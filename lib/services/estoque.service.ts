import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { EstoqueInsuficiente, movimentarEstoque } from "@/lib/estoque/movimentar";
import {
  ORDEM_SITUACAO,
  quantidadeValida,
  type SituacaoEstoque,
  situacaoEstoque,
  TIPOS_DESFAZIVEIS,
  type TipoMovimento,
} from "@/lib/estoque/situacao";
import { dataNoFuso } from "@/lib/utils/data";
import type { EntradaInput, SaidaInput } from "@/lib/validations/estoque.schema";
import type { ContextoRequisicao } from "./auth.service";
import { getConfig } from "./configuracoes.service";

type Autor = { id: number; email: string };
type Tx = Prisma.TransactionClient;

const n = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Number(v.toString()));
const dec2 = (v: number) => new Prisma.Decimal(v.toFixed(2));
const paraData = (d?: string) => (d ? new Date(`${d}T00:00:00.000Z`) : null);
const hojeISO = async () => dataNoFuso(new Date(), (await getConfig("empresa")).funcionamento.timezone);
const diaNumero = async () => (await hojeISO()).replace(/-/g, "");

// ─── Painel (seção 1) ───────────────────────────────────────────────────────

export type FiltroEstoque = {
  situacao?: SituacaoEstoque | "alertas" | "todos";
  categoriaId?: number;
  busca?: string;
  ordenar?: "situacao" | "nome" | "quantidade" | "valor" | "movimento";
};

export async function painelEstoque({ situacao = "todos", categoriaId, busca, ordenar = "situacao" }: FiltroEstoque) {
  const cfg = await getConfig("estoque");
  const produtos = await prisma.produto.findMany({
    where: {
      controlarEstoque: true,
      status: "ativo",
      ...(categoriaId && { categoriaId }),
      ...(busca && { OR: [{ nome: { contains: busca, mode: "insensitive" } }, { sku: { contains: busca, mode: "insensitive" } }] }),
    },
    select: {
      id: true,
      nome: true,
      sku: true,
      unidadeMedida: true,
      quantidadeEstoque: true,
      quantidadeMinima: true,
      precoCusto: true,
      ultimoMovimentoEm: true,
      dataValidade: true,
      categoria: { select: { nome: true, corHex: true } },
    },
  });

  const linhas = produtos.map((p) => {
    const quantidade = n(p.quantidadeEstoque);
    return {
      ...p,
      quantidade,
      situacao: situacaoEstoque(quantidade, p.quantidadeMinima, cfg),
      valor: Math.max(quantidade, 0) * n(p.precoCusto),
    };
  });

  const resumo = {
    produtos: linhas.length,
    valorTotal: linhas.reduce((s, l) => s + l.valor, 0),
    semEstoque: linhas.filter((l) => l.situacao === "sem_estoque").length,
    criticos: linhas.filter((l) => l.situacao === "critico").length,
    baixos: linhas.filter((l) => l.situacao === "baixo").length,
  };

  const filtradas = linhas.filter((l) =>
    situacao === "todos" ? true : situacao === "alertas" ? l.situacao !== "normal" : l.situacao === situacao,
  );
  const comparadores: Record<NonNullable<FiltroEstoque["ordenar"]>, (a: (typeof linhas)[number], b: (typeof linhas)[number]) => number> = {
    situacao: (a, b) => ORDEM_SITUACAO[a.situacao] - ORDEM_SITUACAO[b.situacao] || a.nome.localeCompare(b.nome, "pt-BR"),
    nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
    quantidade: (a, b) => a.quantidade - b.quantidade,
    valor: (a, b) => b.valor - a.valor,
    movimento: (a, b) => (b.ultimoMovimentoEm?.getTime() ?? 0) - (a.ultimoMovimentoEm?.getTime() ?? 0),
  };
  filtradas.sort(comparadores[ordenar]);

  return { linhas: filtradas, resumo, alertasAtivos: cfg.alertasAtivos };
}

/** Contagem de alertas para o dashboard. */
export async function resumoAlertas() {
  const { resumo, alertasAtivos } = await painelEstoque({});
  return { ...resumo, alertasAtivos };
}

/** Produtos que podem receber movimentação (inclui os sem controle: a entrada liga o controle). */
export function produtosParaEstoque() {
  return prisma.produto.findMany({
    where: { status: "ativo" },
    select: { id: true, nome: true, sku: true, unidadeMedida: true, precoCusto: true, controlarEstoque: true, quantidadeEstoque: true },
    orderBy: { nome: "asc" },
  });
}

export function listarFornecedores() {
  return prisma.fornecedor.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } });
}

// ─── Entrada por compra (seção 2) ───────────────────────────────────────────

export type ResultadoOperacao = { ok: true; id: number; numero?: string } | { ok: false; erro: string };

export async function registrarEntrada(dados: EntradaInput, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoOperacao> {
  const hoje = await hojeISO();
  if (dados.dataCompra > hoje) return { ok: false, erro: "A data da compra não pode ser no futuro." };

  const produtos = await prisma.produto.findMany({
    where: { id: { in: [...new Set(dados.itens.map((i) => i.produtoId))] } },
    select: { id: true, nome: true, status: true, unidadeMedida: true, precoVenda: true, controlarEstoque: true },
  });
  const porId = new Map(produtos.map((p) => [p.id, p]));
  for (const [idx, i] of dados.itens.entries()) {
    const p = porId.get(i.produtoId);
    if (!p || p.status !== "ativo") return { ok: false, erro: `Item ${idx + 1}: produto não encontrado ou inativo.` };
    if (!quantidadeValida(i.quantidade, p.unidadeMedida)) {
      return { ok: false, erro: `"${p.nome}": quantidade inválida${p.unidadeMedida === "un" ? " (use número inteiro)" : ""}.` };
    }
    if (i.dataValidade && i.dataValidade <= hoje) return { ok: false, erro: `"${p.nome}": a validade deve ser uma data futura.` };
  }

  const valorTotal = dados.itens.reduce((s, i) => s + Math.round(i.quantidade * i.precoUnitario * 100), 0) / 100;
  const numeroDia = await diaNumero();

  const entrada = await prisma.$transaction(async (tx) => {
    // Fornecedor existente ou novo (pelo nome, sem diferenciar maiúsculas).
    let fornecedorId = dados.fornecedorId;
    if (!fornecedorId) {
      const existente = await tx.fornecedor.findFirst({ where: { nome: { equals: dados.fornecedorNome!, mode: "insensitive" } }, select: { id: true } });
      fornecedorId = existente?.id ?? (await tx.fornecedor.create({ data: { nome: dados.fornecedorNome! } })).id;
    }

    const criada = await tx.entradaEstoque.create({
      data: {
        numero: `TMP-${crypto.randomUUID()}`.slice(0, 30),
        fornecedorId,
        numeroNf: dados.numeroNf,
        dataCompra: paraData(dados.dataCompra)!,
        valorTotal: dec2(valorTotal),
        observacoes: dados.observacoes ?? null,
        criadoPorId: autor.id,
        itens: {
          create: dados.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: new Prisma.Decimal(i.quantidade.toFixed(3)),
            precoUnitario: dec2(i.precoUnitario),
            subtotal: dec2(Math.round(i.quantidade * i.precoUnitario * 100) / 100),
            lote: i.lote ?? null,
            dataValidade: paraData(i.dataValidade),
          })),
        },
      },
    });
    const numero = `EST-${numeroDia}-${String(criada.id).padStart(6, "0")}`;
    await tx.entradaEstoque.update({ where: { id: criada.id }, data: { numero } });

    for (const i of dados.itens) {
      const p = porId.get(i.produtoId)!;
      // Dar entrada liga o controle de estoque do produto.
      const dadosProduto: Prisma.ProdutoUpdateInput = { ...(p.controlarEstoque ? {} : { controlarEstoque: true }) };
      // Último custo vira o preço de custo, desde que continue abaixo do preço de venda (regra do Módulo 2.1).
      if (i.precoUnitario > 0 && i.precoUnitario < n(p.precoVenda)) dadosProduto.precoCusto = dec2(i.precoUnitario);
      if (i.lote) dadosProduto.lote = i.lote;
      if (i.dataValidade) dadosProduto.dataValidade = paraData(i.dataValidade);
      if (Object.keys(dadosProduto).length) await tx.produto.update({ where: { id: p.id }, data: dadosProduto });

      await movimentarEstoque(tx, {
        produtoId: p.id,
        quantidade: i.quantidade,
        tipo: "entrada",
        usuarioId: autor.id,
        permitirNegativo: true,
        referenciaTipo: "ENTRADA",
        referenciaId: criada.id,
        referencia: numero,
        lote: i.lote,
        dataValidade: paraData(i.dataValidade),
        motivo: `NF ${dados.numeroNf}`,
      });
    }
    return { id: criada.id, numero };
  });

  await auditar("ESTOQUE_ENTRADA", autor, ctx, { entrada_id: entrada.id, numero: entrada.numero, itens: dados.itens.length, valor_total: valorTotal });
  return { ok: true, ...entrada };
}

export function listarEntradas(limite = 30) {
  return prisma.entradaEstoque.findMany({
    orderBy: { criadoEm: "desc" },
    take: limite,
    include: { fornecedor: { select: { nome: true } }, criadoPor: { select: { nome: true } }, _count: { select: { itens: true } } },
  });
}

// ─── Saída manual / ajuste (seção 3) ────────────────────────────────────────

export async function registrarSaida(dados: SaidaInput, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoOperacao> {
  const [produto, cfg] = await Promise.all([
    prisma.produto.findUnique({ where: { id: dados.produtoId }, select: { id: true, nome: true, unidadeMedida: true, controlarEstoque: true, status: true } }),
    getConfig("estoque"),
  ]);
  if (!produto || produto.status !== "ativo") return { ok: false, erro: "Produto não encontrado ou inativo." };
  if (!produto.controlarEstoque) return { ok: false, erro: `"${produto.nome}" não tem controle de estoque. Dê uma entrada ou ligue o controle no cadastro.` };
  if (!quantidadeValida(dados.quantidade, produto.unidadeMedida)) {
    return { ok: false, erro: `Quantidade inválida${produto.unidadeMedida === "un" ? " (use número inteiro)" : ""}.` };
  }
  const sinal = dados.tipo === "ajuste" && dados.direcao === "entrada" ? 1 : -1;

  try {
    const mov = await prisma.$transaction((tx) =>
      movimentarEstoque(tx, {
        produtoId: produto.id,
        quantidade: sinal * dados.quantidade,
        tipo: dados.tipo,
        usuarioId: autor.id,
        permitirNegativo: cfg.permitirEstoqueNegativo,
        referenciaTipo: "MANUAL",
        motivo: dados.motivo,
      }),
    );
    await auditar("ESTOQUE_SAIDA", autor, ctx, { movimento_id: mov.id, produto_id: produto.id, tipo: dados.tipo, quantidade: sinal * dados.quantidade, motivo: dados.motivo });
    return { ok: true, id: mov.id };
  } catch (e) {
    if (e instanceof EstoqueInsuficiente) return { ok: false, erro: e.message };
    throw e;
  }
}

// ─── Histórico e desfazer (seção 5) ─────────────────────────────────────────

export async function historicoMovimentos({ produtoId, tipo, pagina = 1 }: { produtoId?: number; tipo?: TipoMovimento; pagina?: number }) {
  const where: Prisma.MovimentoEstoqueWhereInput = { ...(produtoId && { produtoId }), ...(tipo && { tipo }) };
  const porPagina = 50;
  const [total, movimentos] = await Promise.all([
    prisma.movimentoEstoque.count({ where }),
    prisma.movimentoEstoque.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        produto: { select: { nome: true, sku: true, unidadeMedida: true } },
        usuario: { select: { nome: true } },
        desfaz: { select: { id: true } },
      },
    }),
  ]);
  return { movimentos, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
}

export async function desfazerMovimento(id: number, motivo: string, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoOperacao> {
  const original = await prisma.movimentoEstoque.findUnique({ where: { id }, select: { id: true, tipo: true, produtoId: true, quantidade: true, desfeitoPorId: true } });
  if (!original) return { ok: false, erro: "Movimento não encontrado." };
  if (!TIPOS_DESFAZIVEIS.includes(original.tipo)) {
    return { ok: false, erro: original.tipo === "venda" ? "Para desfazer uma venda, cancele a venda." : "Este tipo de movimento não pode ser desfeito." };
  }
  if (original.desfeitoPorId) return { ok: false, erro: "Este movimento já foi desfeito." };

  const cfg = await getConfig("estoque");
  try {
    const mov = await prisma.$transaction(async (tx) => {
      const inverso = await movimentarEstoque(tx, {
        produtoId: original.produtoId,
        quantidade: -n(original.quantidade),
        tipo: "desfazimento",
        usuarioId: autor.id,
        permitirNegativo: cfg.permitirEstoqueNegativo,
        referenciaTipo: "MOVIMENTO",
        referenciaId: original.id,
        motivo,
      });
      // Condicional: dois "desfazer" simultâneos não anulam o mesmo movimento duas vezes.
      const r = await tx.movimentoEstoque.updateMany({ where: { id: original.id, desfeitoPorId: null }, data: { desfeitoPorId: inverso.id } });
      if (r.count === 0) throw new Error("JA_DESFEITO");
      return inverso;
    });
    await auditar("ESTOQUE_DESFAZER", autor, ctx, { movimento_id: original.id, desfazimento_id: mov.id, motivo });
    return { ok: true, id: mov.id };
  } catch (e) {
    if (e instanceof EstoqueInsuficiente) return { ok: false, erro: `Não dá para desfazer: ${e.message}` };
    if (e instanceof Error && e.message === "JA_DESFEITO") return { ok: false, erro: "Este movimento já foi desfeito." };
    throw e;
  }
}

// ─── Integração com vendas (seção 3.1, tipo 1) ──────────────────────────────

/**
 * Baixa os itens de uma venda dentro da transação do PDV. Só produtos com controle de estoque.
 * Lança EstoqueInsuficiente se faltar saldo e a configuração não permitir negativo.
 * `cfg` deve ser lida ANTES da transação: dentro dela, uma consulta fora do `tx` disputaria
 * a única conexão do pool local e travaria.
 */
export async function baixarEstoqueVenda(
  tx: Tx,
  venda: { id: number; numero: string },
  itens: { produtoId: number; quantidade: number }[],
  usuarioId: number,
  cfg: { baixaAutomaticaVendas: boolean; permitirEstoqueNegativo: boolean },
) {
  if (!cfg.baixaAutomaticaVendas) return;
  const controlados = new Set(
    (await tx.produto.findMany({ where: { id: { in: itens.map((i) => i.produtoId) }, controlarEstoque: true }, select: { id: true } })).map((p) => p.id),
  );
  // Agrupa o mesmo produto em uma baixa só.
  const porProduto = new Map<number, number>();
  for (const i of itens) if (controlados.has(i.produtoId)) porProduto.set(i.produtoId, (porProduto.get(i.produtoId) ?? 0) + i.quantidade);
  for (const [produtoId, quantidade] of porProduto) {
    await movimentarEstoque(tx, {
      produtoId,
      quantidade: -quantidade,
      tipo: "venda",
      usuarioId,
      permitirNegativo: cfg.permitirEstoqueNegativo,
      referenciaTipo: "VENDA",
      referenciaId: venda.id,
      referencia: venda.numero,
      motivo: "Venda PDV",
    });
  }
}

/** Devolve ao estoque o que uma venda baixou (venda cancelada). */
export async function estornarEstoqueVenda(tx: Tx, venda: { id: number; numero: string }, usuarioId: number) {
  const baixas = await tx.movimentoEstoque.findMany({
    where: { referenciaTipo: "VENDA", referenciaId: venda.id, tipo: "venda" },
    select: { produtoId: true, quantidade: true },
  });
  for (const b of baixas) {
    await movimentarEstoque(tx, {
      produtoId: b.produtoId,
      quantidade: -n(b.quantidade),
      tipo: "estorno_venda",
      usuarioId,
      permitirNegativo: true,
      referenciaTipo: "VENDA",
      referenciaId: venda.id,
      referencia: venda.numero,
      motivo: "Venda cancelada",
    });
  }
}

/** Disponibilidade para PDV/cardápio: null = não controla estoque. */
export async function disponibilidade(produtoIds: number[]) {
  const cfg = await getConfig("estoque");
  const produtos = await prisma.produto.findMany({ where: { id: { in: produtoIds }, controlarEstoque: true }, select: { id: true, quantidadeEstoque: true } });
  return { permitirNegativo: cfg.permitirEstoqueNegativo, saldos: new Map(produtos.map((p) => [p.id, n(p.quantidadeEstoque)])) };
}

// ─── Inventário (seção 6) ───────────────────────────────────────────────────

export function listarInventarios() {
  return prisma.inventario.findMany({
    orderBy: { iniciadoEm: "desc" },
    take: 30,
    include: { realizadoPor: { select: { nome: true } } },
  });
}

export async function iniciarInventario(categoriaId: number | null, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoOperacao> {
  const emAndamento = await prisma.inventario.findFirst({ where: { status: "em_andamento" }, select: { id: true } });
  if (emAndamento) return { ok: false, erro: "Já existe um inventário em andamento. Finalize ou cancele antes de começar outro." };

  const produtos = await prisma.produto.findMany({
    where: { controlarEstoque: true, status: "ativo", ...(categoriaId && { categoriaId }) },
    select: { id: true, quantidadeEstoque: true },
  });
  if (produtos.length === 0) return { ok: false, erro: "Nenhum produto com controle de estoque para contar." };

  const numeroDia = await diaNumero();
  try {
    const inv = await prisma.$transaction(async (tx) => {
      const criado = await tx.inventario.create({
        data: {
          numero: `TMP-${crypto.randomUUID()}`.slice(0, 30),
          categoriaId,
          realizadoPorId: autor.id,
          totalProdutos: produtos.length,
          itens: { create: produtos.map((p) => ({ produtoId: p.id, quantidadeSistema: p.quantidadeEstoque })) },
        },
      });
      const numero = `INV-${numeroDia}-${String(criado.id).padStart(6, "0")}`;
      await tx.inventario.update({ where: { id: criado.id }, data: { numero } });
      return { id: criado.id, numero };
    });
    await auditar("INVENTARIO_INICIADO", autor, ctx, { inventario_id: inv.id, produtos: produtos.length, categoria_id: categoriaId });
    return { ok: true, ...inv };
  } catch (e) {
    // índice único parcial: outro inventário começou ao mesmo tempo
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, erro: "Já existe um inventário em andamento." };
    throw e;
  }
}

export function buscarInventario(id: number) {
  return prisma.inventario.findUnique({
    where: { id },
    include: {
      realizadoPor: { select: { nome: true } },
      itens: {
        include: { produto: { select: { nome: true, sku: true, unidadeMedida: true, quantidadeEstoque: true, categoria: { select: { nome: true } } } } },
        orderBy: { produto: { nome: "asc" } },
      },
    },
  });
}

export async function salvarContagem(inventarioId: number, contagens: { produtoId: number; quantidadeReal: number | null }[]) {
  const inv = await prisma.inventario.findUnique({ where: { id: inventarioId }, select: { status: true, itens: { select: { produtoId: true, produto: { select: { unidadeMedida: true, nome: true } } } } } });
  if (!inv || inv.status !== "em_andamento") return { ok: false as const, erro: "Este inventário não está mais em andamento." };
  const unidade = new Map(inv.itens.map((i) => [i.produtoId, i.produto]));
  for (const c of contagens) {
    const p = unidade.get(c.produtoId);
    if (!p) return { ok: false as const, erro: "Produto fora deste inventário." };
    if (c.quantidadeReal !== null && c.quantidadeReal !== 0 && !quantidadeValida(c.quantidadeReal, p.unidadeMedida)) {
      return { ok: false as const, erro: `"${p.nome}": quantidade inválida${p.unidadeMedida === "un" ? " (use número inteiro)" : ""}.` };
    }
  }
  await prisma.$transaction(
    contagens.map((c) =>
      prisma.itemInventario.update({
        where: { inventarioId_produtoId: { inventarioId, produtoId: c.produtoId } },
        data: { quantidadeReal: c.quantidadeReal === null ? null : new Prisma.Decimal(c.quantidadeReal.toFixed(3)) },
      }),
    ),
  );
  return { ok: true as const };
}

/**
 * Finaliza: para cada item contado, ajusta o saldo para o valor contado (movimento "inventario")
 * e registra a diferença em relação ao saldo do sistema no momento da finalização.
 */
export async function finalizarInventario(inventarioId: number, autor: Autor, ctx: ContextoRequisicao) {
  const cfg = await getConfig("estoque");
  const resultado = await prisma.$transaction(async (tx) => {
    const inv = await tx.inventario.findUnique({ where: { id: inventarioId }, include: { itens: { include: { produto: { select: { quantidadeEstoque: true } } } } } });
    if (!inv || inv.status !== "em_andamento") return { ok: false as const, erro: "Este inventário não está mais em andamento." };
    const contados = inv.itens.filter((i) => i.quantidadeReal !== null);
    if (contados.length === 0) return { ok: false as const, erro: "Nenhum produto foi contado ainda." };

    let divergencias = 0;
    let acimaDoLimite = 0;
    for (const item of contados) {
      const sistema = n(item.produto.quantidadeEstoque);
      const real = n(item.quantidadeReal);
      const diferenca = Math.round((real - sistema) * 1000) / 1000;
      await tx.itemInventario.update({ where: { id: item.id }, data: { quantidadeSistema: new Prisma.Decimal(sistema.toFixed(3)), diferenca: new Prisma.Decimal(diferenca.toFixed(3)) } });
      if (diferenca !== 0) {
        divergencias++;
        if (sistema > 0 && (Math.abs(diferenca) / sistema) * 100 > cfg.divergenciaMaxInventarioPct) acimaDoLimite++;
        await movimentarEstoque(tx, {
          produtoId: item.produtoId,
          quantidade: diferenca,
          tipo: "inventario",
          usuarioId: autor.id,
          permitirNegativo: true,
          referenciaTipo: "INVENTARIO",
          referenciaId: inv.id,
          referencia: inv.numero,
          motivo: "Contagem física",
        });
      }
    }
    await tx.inventario.update({ where: { id: inv.id }, data: { status: "finalizado", divergencias, finalizadoEm: new Date() } });
    return { ok: true as const, contados: contados.length, naoContados: inv.itens.length - contados.length, divergencias, acimaDoLimite, numero: inv.numero };
  });
  if (resultado.ok) await auditar("INVENTARIO_FINALIZADO", autor, ctx, { inventario_id: inventarioId, ...resultado });
  return resultado;
}

export async function cancelarInventario(inventarioId: number, autor: Autor, ctx: ContextoRequisicao) {
  const r = await prisma.inventario.updateMany({ where: { id: inventarioId, status: "em_andamento" }, data: { status: "cancelado", finalizadoEm: new Date() } });
  if (r.count) await auditar("INVENTARIO_CANCELADO", autor, ctx, { inventario_id: inventarioId });
  return r.count > 0;
}

function auditar(acao: string, autor: Autor, ctx: ContextoRequisicao, dados: Prisma.InputJsonObject) {
  return prisma.auditoria.create({
    data: { acao, modulo: "ESTOQUE", usuarioId: autor.id, emailUsuario: autor.email, dadosModificados: dados, ipAddress: ctx.ip ?? null, userAgent: ctx.userAgent ?? null },
  });
}
