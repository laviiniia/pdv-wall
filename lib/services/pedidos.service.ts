import "server-only";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import {
  dentroDoHorario,
  esperaDaFila,
  previsaoMinutos,
  STATUS_ATIVOS,
  type StatusPedido,
  TRANSICOES,
  tempoPreparoDoPedido,
} from "@/lib/pedidos/fila";
import { dataNoFuso, intervaloDoDia } from "@/lib/utils/data";
import type { CriarPedidoInput } from "@/lib/validations/pedido.schema";
import type { ContextoRequisicao } from "./auth.service";
import { getConfig } from "./configuracoes.service";

const centavos = (v: { toString(): string } | number) => Math.round(Number(v.toString()) * 100);
const dec = (c: number) => new Prisma.Decimal((c / 100).toFixed(2));
const novoToken = () => randomBytes(18).toString("base64url"); // 24 caracteres

const LIMITE_POR_MESA_HORA = 5; // doc: máximo 5 pedidos por mesa por hora
const LIMITE_POR_IP_HORA = 10;

function horaNoFuso(data: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(data);
}

// ─── Cardápio público ───────────────────────────────────────────────────────

export async function situacaoPedidosOnline() {
  const [vendas, empresa] = await Promise.all([getConfig("vendas"), getConfig("empresa")]);
  const tz = empresa.funcionamento.timezone;
  const agora = horaNoFuso(new Date(), tz);
  const aberto = vendas.pedidosOnlineAtivos && dentroDoHorario(agora, vendas.pedidosOnlineInicio, vendas.pedidosOnlineFim);
  return {
    aberto,
    ativos: vendas.pedidosOnlineAtivos,
    inicio: vendas.pedidosOnlineInicio,
    fim: vendas.pedidosOnlineFim,
    tempoPadraoMin: vendas.tempoPreparoMin,
    limiteSimultaneos: vendas.limitePedidosSimultaneos,
    nomeEmpresa: empresa.nomeFantasia || empresa.nome,
  };
}

export function buscarMesaPorToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(token)) return null;
  return prisma.mesa.findUnique({ where: { token }, select: { id: true, numero: true, ativa: true } });
}

export async function carregarCardapio() {
  const produtos = await prisma.produto.findMany({
    where: { status: "ativo", exibirNoCardapio: true, categoria: { ativa: true } },
    select: {
      id: true,
      nome: true,
      descricao: true,
      precoVenda: true,
      tempoPreparoMin: true,
      categoria: { select: { id: true, nome: true, icone: true, corHex: true } },
      adicionais: {
        where: { ativo: true },
        select: { id: true, tipo: true, nome: true, valor: true },
        orderBy: [{ tipo: "asc" }, { ordem: "asc" }, { nome: "asc" }],
      },
    },
    orderBy: [{ categoria: { nome: "asc" } }, { nome: "asc" }],
  });
  return produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    precoCentavos: centavos(p.precoVenda),
    tempoPreparoMin: p.tempoPreparoMin,
    categoria: p.categoria,
    adicionais: p.adicionais.map((a) => ({ id: a.id, tipo: a.tipo, nome: a.nome, valorCentavos: centavos(a.valor) })),
  }));
}

export type ProdutoCardapio = Awaited<ReturnType<typeof carregarCardapio>>[number];

// ─── Criação do pedido (seção 4.1.2) ────────────────────────────────────────

export type ResultadoPedido = { ok: true; token: string; numero: string } | { ok: false; erro: string };

export async function criarPedido(tokenMesa: string, entrada: CriarPedidoInput, ctx: ContextoRequisicao): Promise<ResultadoPedido> {
  const mesa = await buscarMesaPorToken(tokenMesa);
  if (!mesa || !mesa.ativa) return { ok: false, erro: "Este QR Code não é mais válido. Peça ajuda a um atendente." };

  const situacao = await situacaoPedidosOnline();
  if (!situacao.ativos) return { ok: false, erro: "Os pedidos pelo celular estão desativados no momento." };
  if (!situacao.aberto) return { ok: false, erro: `Recebemos pedidos pelo celular das ${situacao.inicio} às ${situacao.fim}.` };

  // Limites anti-abuso (seção 1.1.3).
  const umaHora = new Date(Date.now() - 3_600_000);
  const [porMesa, porIp, ativosNaCozinha] = await Promise.all([
    prisma.pedidoOnline.count({ where: { mesaId: mesa.id, criadoEm: { gte: umaHora } } }),
    ctx.ip ? prisma.pedidoOnline.count({ where: { ipOrigem: ctx.ip, criadoEm: { gte: umaHora } } }) : 0,
    prisma.pedidoOnline.count({ where: { status: { in: STATUS_ATIVOS } } }),
  ]);
  if (porMesa >= LIMITE_POR_MESA_HORA || porIp >= LIMITE_POR_IP_HORA) {
    return { ok: false, erro: "Muitos pedidos em pouco tempo nesta mesa. Chame um atendente." };
  }
  if (ativosNaCozinha >= situacao.limiteSimultaneos) {
    return { ok: false, erro: "A cozinha está com muitos pedidos agora. Tente de novo em alguns minutos." };
  }

  // Produtos e adicionais do banco (preço nunca vem do celular).
  const ids = [...new Set(entrada.itens.map((i) => i.produtoId))];
  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      nome: true,
      status: true,
      exibirNoCardapio: true,
      precoVenda: true,
      tempoPreparoMin: true,
      categoria: { select: { ativa: true } },
      adicionais: { where: { ativo: true }, select: { id: true, tipo: true, nome: true, valor: true } },
    },
  });
  const porId = new Map(produtos.map((p) => [p.id, p]));

  const itens: {
    produtoId: number;
    nomeProduto: string;
    quantidade: number;
    unitario: number;
    personalizacoes: { tipo: "adicao" | "remocao"; nome: string; valor: number }[];
    observacao: string | null;
    tempoPreparoMin: number;
  }[] = [];
  for (const i of entrada.itens) {
    const p = porId.get(i.produtoId);
    if (!p || p.status !== "ativo" || !p.exibirNoCardapio || !p.categoria.ativa) {
      return { ok: false, erro: `${p?.nome ?? "Um produto"} não está mais disponível. Remova-o do carrinho.` };
    }
    const escolhidos = [...new Set(i.adicionais)].map((id) => p.adicionais.find((a) => a.id === id));
    if (escolhidos.some((a) => !a)) return { ok: false, erro: `Uma opção de "${p.nome}" mudou. Remova o item e adicione de novo.` };
    const opcoes = escolhidos as NonNullable<(typeof escolhidos)[number]>[];
    const unitario = centavos(p.precoVenda) + opcoes.filter((a) => a.tipo === "adicao").reduce((s, a) => s + centavos(a.valor), 0);
    itens.push({
      produtoId: p.id,
      nomeProduto: p.nome,
      quantidade: i.quantidade,
      unitario,
      personalizacoes: opcoes.map((a) => ({ tipo: a.tipo, nome: a.nome, valor: Number(a.valor) })),
      observacao: i.observacao ?? null,
      tempoPreparoMin: p.tempoPreparoMin ?? situacao.tempoPadraoMin,
    });
  }

  const total = itens.reduce((s, i) => s + i.unitario * i.quantidade, 0);
  const tempoPreparoMin = tempoPreparoDoPedido(itens.map((i) => i.tempoPreparoMin));
  const aFrente = await prisma.pedidoOnline.findMany({
    where: { status: { in: STATUS_ATIVOS } },
    select: { status: true, tempoPreparoMin: true, iniciadoEm: true },
  });
  const tempoEstimadoMin = tempoPreparoMin + esperaDaFila(aFrente);

  const empresa = await getConfig("empresa");
  const dia = dataNoFuso(new Date(), empresa.funcionamento.timezone).replace(/-/g, "");
  const token = novoToken();

  const pedido = await prisma.$transaction(async (tx) => {
    const criado = await tx.pedidoOnline.create({
      data: {
        numero: `TMP-${token}`.slice(0, 30),
        token,
        mesaId: mesa.id,
        clienteNome: entrada.clienteNome ?? null,
        clienteTelefone: entrada.clienteTelefone ?? null,
        alergias: entrada.alergias ?? null,
        observacoes: entrada.observacoes ?? null,
        total: dec(total),
        tempoPreparoMin,
        tempoEstimadoMin,
        ipOrigem: ctx.ip ?? null,
        itens: {
          create: itens.map((i) => ({
            produtoId: i.produtoId,
            nomeProduto: i.nomeProduto,
            quantidade: i.quantidade,
            precoUnitario: dec(i.unitario),
            personalizacoes: i.personalizacoes,
            observacao: i.observacao,
            tempoPreparoMin: i.tempoPreparoMin,
          })),
        },
        historico: { create: { status: "confirmado", detalhe: "Pedido recebido pelo cardápio digital" } },
      },
    });
    return tx.pedidoOnline.update({
      where: { id: criado.id },
      data: { numero: `PED-${dia}-${String(criado.id).padStart(6, "0")}` },
      select: { numero: true, token: true },
    });
  });

  return { ok: true, token: pedido.token, numero: pedido.numero };
}

// ─── Acompanhamento do cliente (seção 6) ────────────────────────────────────

export async function acompanharPedido(token: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(token)) return null;
  const pedido = await prisma.pedidoOnline.findUnique({
    where: { token },
    select: {
      id: true,
      numero: true,
      status: true,
      total: true,
      tempoPreparoMin: true,
      tempoEstimadoMin: true,
      clienteNome: true,
      motivoCancelamento: true,
      avaliacaoNota: true,
      criadoEm: true,
      iniciadoEm: true,
      prontoEm: true,
      entregueEm: true,
      mesa: { select: { numero: true, token: true } },
      itens: { select: { id: true, nomeProduto: true, quantidade: true, precoUnitario: true, personalizacoes: true, observacao: true } },
      historico: { select: { status: true, criadoEm: true }, orderBy: { criadoEm: "asc" } },
    },
  });
  if (!pedido) return null;

  // Posição e previsão são recalculadas a cada consulta (a fila anda).
  let posicao: number | null = null;
  let totalFila = 0;
  let previsao = 0;
  if (STATUS_ATIVOS.includes(pedido.status)) {
    const fila = await prisma.pedidoOnline.findMany({
      where: { status: { in: STATUS_ATIVOS } },
      orderBy: { criadoEm: "asc" },
      select: { id: true, status: true, tempoPreparoMin: true, iniciadoEm: true },
    });
    totalFila = fila.length;
    const indice = fila.findIndex((f) => f.id === pedido.id);
    posicao = indice >= 0 ? indice + 1 : null;
    previsao = previsaoMinutos(pedido, indice >= 0 ? fila.slice(0, indice) : fila);
  }

  const { id: _id, ...publico } = pedido;
  void _id;
  return {
    ...publico,
    totalCentavos: centavos(pedido.total),
    itens: pedido.itens.map((i) => ({
      id: i.id,
      nomeProduto: i.nomeProduto,
      quantidade: i.quantidade,
      precoCentavos: centavos(i.precoUnitario),
      personalizacoes: i.personalizacoes as { tipo: "adicao" | "remocao"; nome: string }[],
      observacao: i.observacao,
    })),
    total: undefined,
    posicao,
    totalFila,
    previsaoMinutos: previsao,
    previsaoEm: new Date(Date.now() + previsao * 60_000),
  };
}

export type PedidoAcompanhamento = NonNullable<Awaited<ReturnType<typeof acompanharPedido>>>;

export async function avaliarPedido(token: string, nota: number, texto?: string) {
  const r = await prisma.pedidoOnline.updateMany({
    where: { token, status: "entregue", avaliacaoNota: null },
    data: { avaliacaoNota: nota, avaliacaoTexto: texto ?? null },
  });
  return r.count > 0;
}

/** O cliente pode cancelar enquanto a cozinha ainda não começou (status "confirmado"). */
export async function cancelarPeloCliente(token: string) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.pedidoOnline.findUnique({ where: { token }, select: { id: true } });
    if (!p) return false;
    const r = await tx.pedidoOnline.updateMany({
      where: { id: p.id, status: "confirmado" },
      data: { status: "cancelado", motivoCancelamento: "Cancelado pelo cliente" },
    });
    if (r.count === 0) return false;
    await tx.historicoStatusPedido.create({ data: { pedidoId: p.id, status: "cancelado", detalhe: "Cancelado pelo cliente" } });
    return true;
  });
}

// ─── Painel da cozinha (seção 7) ────────────────────────────────────────────

type Usuario = { id: number; email: string; permissoes: string[] };

export async function painelCozinha() {
  const empresa = await getConfig("empresa");
  const tz = empresa.funcionamento.timezone;
  const { inicio, fim } = intervaloDoDia(dataNoFuso(new Date(), tz), tz);

  const select = {
    id: true,
    numero: true,
    status: true,
    total: true,
    clienteNome: true,
    alergias: true,
    observacoes: true,
    tempoPreparoMin: true,
    tempoEstimadoMin: true,
    criadoEm: true,
    iniciadoEm: true,
    prontoEm: true,
    entregueEm: true,
    mesa: { select: { numero: true } },
    itens: { select: { id: true, nomeProduto: true, quantidade: true, personalizacoes: true, observacao: true } },
  } satisfies Prisma.PedidoOnlineSelect;

  const [ativos, entreguesHoje, hoje] = await Promise.all([
    prisma.pedidoOnline.findMany({
      where: { status: { in: ["confirmado", "preparando", "pausado", "pronto"] } },
      orderBy: { criadoEm: "asc" },
      select,
    }),
    prisma.pedidoOnline.findMany({
      where: { status: "entregue", entregueEm: { gte: inicio, lt: fim } },
      orderBy: { entregueEm: "desc" },
      take: 20,
      select,
    }),
    prisma.pedidoOnline.findMany({
      where: { criadoEm: { gte: inicio, lt: fim }, status: { not: "cancelado" } },
      select: { total: true, iniciadoEm: true, prontoEm: true },
    }),
  ]);

  const preparos = hoje
    .filter((p) => p.iniciadoEm && p.prontoEm)
    .map((p) => (p.prontoEm!.getTime() - p.iniciadoEm!.getTime()) / 60_000);
  const serializar = (p: (typeof ativos)[number]) => ({
    ...p,
    total: centavos(p.total),
    itens: p.itens.map((i) => ({ ...i, personalizacoes: i.personalizacoes as { tipo: "adicao" | "remocao"; nome: string }[] })),
    criadoEm: p.criadoEm.toISOString(),
    iniciadoEm: p.iniciadoEm?.toISOString() ?? null,
    prontoEm: p.prontoEm?.toISOString() ?? null,
    entregueEm: p.entregueEm?.toISOString() ?? null,
  });

  return {
    pedidos: [...ativos, ...entreguesHoje].map(serializar),
    estatisticas: {
      pedidosHoje: hoje.length,
      faturamentoHoje: hoje.reduce((s, p) => s + centavos(p.total), 0),
      tempoMedioPreparoMin: preparos.length ? Math.round(preparos.reduce((a, b) => a + b, 0) / preparos.length) : null,
      filaMin: esperaDaFila(ativos),
    },
    geradoEm: new Date().toISOString(),
  };
}

export type PainelCozinha = Awaited<ReturnType<typeof painelCozinha>>;

export async function mudarStatusPedido(
  id: number,
  novo: StatusPedido,
  usuario: Usuario,
  ctx: ContextoRequisicao,
  motivo?: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const precisa = novo === "cancelado" ? PERMISSAO.PEDIDOS_CANCELAR : PERMISSAO.PEDIDOS_MUDAR_STATUS;
  if (!temPermissao(usuario.permissoes, precisa)) return { ok: false, erro: "Você não tem permissão para esta ação." };
  if (novo === "cancelado" && (!motivo || motivo.trim().length < 3)) return { ok: false, erro: "Informe o motivo do cancelamento." };

  const atual = await prisma.pedidoOnline.findUnique({ where: { id }, select: { status: true, numero: true, iniciadoEm: true } });
  if (!atual) return { ok: false, erro: "Pedido não encontrado." };
  if (!TRANSICOES[atual.status].includes(novo)) {
    return { ok: false, erro: "O pedido mudou de situação. A tela foi atualizada." };
  }

  const agora = new Date();
  const datas: Prisma.PedidoOnlineUpdateManyMutationInput = {};
  if (novo === "preparando" && (atual.status === "confirmado" || atual.status === "pronto")) datas.iniciadoEm = agora;
  if (novo === "preparando" && atual.status === "pronto") datas.prontoEm = null;
  if (novo === "pronto") datas.prontoEm = agora;
  if (novo === "entregue") datas.entregueEm = agora;
  if (novo === "cancelado") datas.motivoCancelamento = motivo!.trim();

  // Condicional no status atual: dois cozinheiros clicando juntos não geram transição dupla.
  const ok = await prisma.$transaction(async (tx) => {
    const r = await tx.pedidoOnline.updateMany({ where: { id, status: atual.status }, data: { status: novo, ...datas } });
    if (r.count === 0) return false;
    await tx.historicoStatusPedido.create({
      data: { pedidoId: id, status: novo, usuarioId: usuario.id, detalhe: novo === "cancelado" ? motivo!.trim() : null },
    });
    return true;
  });
  if (!ok) return { ok: false, erro: "O pedido mudou de situação. A tela foi atualizada." };

  if (novo === "cancelado") {
    await prisma.auditoria.create({
      data: {
        acao: "PEDIDO_ONLINE_CANCELADO",
        modulo: "PEDIDOS_ONLINE",
        nivel: "WARN",
        usuarioId: usuario.id,
        emailUsuario: usuario.email,
        descricao: `Pedido ${atual.numero} cancelado`,
        dadosModificados: { pedido_id: id, motivo: motivo!.trim() },
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  }
  return { ok: true };
}

export function buscarPedidoParaEtiqueta(id: number) {
  return prisma.pedidoOnline.findUnique({
    where: { id },
    include: { mesa: { select: { numero: true } }, itens: true },
  });
}

// ─── Mesas e QR Codes (seção 1) ─────────────────────────────────────────────

export function listarMesas() {
  return prisma.mesa.findMany({
    orderBy: { numero: "asc" },
    include: { _count: { select: { pedidos: { where: { status: { in: STATUS_ATIVOS } } } } } },
  });
}

/** Cria as mesas de `de` até `ate` que ainda não existem. */
export async function criarMesas(de: number, ate: number, capacidade: number, autor: { id: number; email: string }) {
  const existentes = new Set((await prisma.mesa.findMany({ where: { numero: { gte: de, lte: ate } }, select: { numero: true } })).map((m) => m.numero));
  const novas = [];
  for (let n = de; n <= ate; n++) if (!existentes.has(n)) novas.push({ numero: n, token: novoToken(), capacidade });
  if (novas.length) await prisma.mesa.createMany({ data: novas, skipDuplicates: true });
  await prisma.auditoria.create({
    data: { acao: "MESAS_CRIADAS", modulo: "PEDIDOS_ONLINE", usuarioId: autor.id, emailUsuario: autor.email, dadosModificados: { de, ate, criadas: novas.length } },
  });
  return novas.length;
}

export async function atualizarMesa(id: number, dados: { ativa?: boolean; novoToken?: boolean }, autor: { id: number; email: string }) {
  await prisma.mesa.update({
    where: { id },
    data: { ...(dados.ativa !== undefined && { ativa: dados.ativa }), ...(dados.novoToken && { token: novoToken() }) },
  });
  await prisma.auditoria.create({
    data: {
      acao: dados.novoToken ? "MESA_QR_REGENERADO" : dados.ativa ? "MESA_ATIVADA" : "MESA_DESATIVADA",
      modulo: "PEDIDOS_ONLINE",
      usuarioId: autor.id,
      emailUsuario: autor.email,
      dadosModificados: { mesa_id: id },
    },
  });
}

export function qrCodeSvg(url: string) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1 });
}

// ─── Adicionais (personalizações) por produto ───────────────────────────────

export function listarAdicionais(produtoId: number) {
  return prisma.adicionalProduto.findMany({ where: { produtoId }, orderBy: [{ tipo: "asc" }, { ordem: "asc" }, { nome: "asc" }] });
}

export async function criarAdicional(dados: { produtoId: number; tipo: "adicao" | "remocao"; nome: string; valor: number }) {
  await prisma.adicionalProduto.create({
    data: { produtoId: dados.produtoId, tipo: dados.tipo, nome: dados.nome, valor: new Prisma.Decimal(dados.tipo === "adicao" ? dados.valor.toFixed(2) : "0") },
  });
}

export async function removerAdicional(id: number) {
  await prisma.adicionalProduto.deleteMany({ where: { id } });
}

export function podeVerCozinha(usuario: Usuario) {
  return temPermissao(usuario.permissoes, PERMISSAO.PEDIDOS_VER);
}
