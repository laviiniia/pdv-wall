import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSAO, ROLES, temPermissao } from "@/lib/constants/roles";
import { dataNoFuso, intervaloDoDia } from "@/lib/utils/data";
import { calcularTotais, centavos, type Desconto, reais, validarPagamentos } from "@/lib/vendas/calculo";
import type { CupomInput, FinalizarVendaInput } from "@/lib/validations/venda.schema";
import type { ContextoRequisicao } from "./auth.service";
import { getConfig } from "./configuracoes.service";

type Usuario = { id: number; email: string; nome: string; role: { nome: string }; permissoes: string[] };

const dec = (centavos: number) => new Prisma.Decimal((centavos / 100).toFixed(2));
const formatar = (c: number) => reais(c).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Busca de produtos no PDV (seção 1.1) ───────────────────────────────────

const selectProdutoPDV = {
  id: true,
  nome: true,
  sku: true,
  codigoBarras: true,
  precoVenda: true,
  unidadeMedida: true,
  categoria: { select: { id: true, nome: true, icone: true, corHex: true } },
} satisfies Prisma.ProdutoSelect;

/** Nome (parcial), SKU ou código de barras; só produtos ativos; no máximo 10 resultados. */
export async function buscarProdutosPDV(termo: string, categoriaId?: number) {
  const t = termo.trim();
  if (!categoriaId && t.length < 2) return [];

  // Código de barras: 8 a 14 dígitos, busca exata.
  if (/^\d{8,14}$/.test(t)) {
    const porCodigo = await prisma.produto.findMany({ where: { status: "ativo", codigoBarras: t }, select: selectProdutoPDV });
    if (porCodigo.length) return porCodigo;
  }

  const produtos = await prisma.produto.findMany({
    where: {
      status: "ativo",
      ...(categoriaId && { categoriaId }),
      ...(t.length >= 2 && {
        OR: [{ nome: { contains: t, mode: "insensitive" } }, { sku: { startsWith: t, mode: "insensitive" } }],
      }),
    },
    select: selectProdutoPDV,
    orderBy: { nome: "asc" },
    take: categoriaId && t.length < 2 ? 50 : 10,
  });
  // SKU exato primeiro (atalho para quem conhece os códigos).
  const exato = t.toUpperCase();
  return produtos.sort((a, b) => Number(b.sku === exato) - Number(a.sku === exato));
}

export type ProdutoPDV = Awaited<ReturnType<typeof buscarProdutosPDV>>[number];

/** "Últimos vendidos": os mais vendidos nos últimos 30 dias, para adicionar com um clique. */
export async function maisVendidos(limite = 8) {
  const desde = new Date(Date.now() - 30 * 86_400_000);
  const grupos = await prisma.itemVenda.groupBy({
    by: ["produtoId"],
    where: { venda: { status: "finalizada", criadoEm: { gte: desde } }, produto: { status: "ativo" } },
    _sum: { quantidade: true },
    orderBy: { _sum: { quantidade: "desc" } },
    take: limite,
  });
  if (grupos.length === 0) return [];
  const produtos = await prisma.produto.findMany({ where: { id: { in: grupos.map((g) => g.produtoId) } }, select: selectProdutoPDV });
  const porId = new Map(produtos.map((p) => [p.id, p]));
  return grupos.map((g) => porId.get(g.produtoId)).filter((p): p is ProdutoPDV => !!p);
}

export function categoriasPDV() {
  return prisma.categoria.findMany({
    where: { ativa: true, produtos: { some: { status: "ativo" } } },
    select: { id: true, nome: true, icone: true, corHex: true },
    orderBy: { nome: "asc" },
  });
}

// ─── Limites de desconto (seção 3.1.3 + Configurações › Vendas) ─────────────

export async function regrasDesconto(usuario: Pick<Usuario, "role">) {
  const vendas = await getConfig("vendas");
  const role = usuario.role.nome;
  const limitePct =
    role === ROLES.ADMIN ? null : role === ROLES.GERENTE ? vendas.descontoMaxGerentePct : vendas.descontoMaxOperadorPct;
  const exigeAprovacaoAcimaDe =
    role === ROLES.OPERADOR && vendas.exigirAprovacao ? centavos(vendas.aprovacaoGerenteAcimaDe) : null;
  return { limitePct, exigeAprovacaoAcimaDe };
}

// ─── Cupons ─────────────────────────────────────────────────────────────────

type ResultadoCupom =
  | { ok: true; cupom: { id: number; codigo: string; tipo: "percentual" | "valor"; valor: number; descricao: string | null } }
  | { ok: false; erro: string };

const dataBR = (d: Date) => d.toLocaleDateString("pt-BR");

/** Valida um cupom para um subtotal (em centavos), com as mensagens da seção 3.1.1. */
export async function validarCupom(codigo: string, subtotal: number, agora = new Date()): Promise<ResultadoCupom> {
  const c = await prisma.cupomPromocional.findUnique({ where: { codigo: codigo.trim().toUpperCase() } });
  if (!c || !c.ativo) return { ok: false, erro: `Cupom ${codigo.toUpperCase()} não existe ou está inativo.` };
  if (agora < c.inicio) return { ok: false, erro: `Cupom ${c.codigo} só vale a partir de ${dataBR(c.inicio)}.` };
  if (agora > c.expiracao) return { ok: false, erro: `Cupom ${c.codigo} expirou em ${dataBR(c.expiracao)}.` };
  if (c.usosMaximos !== null && c.usosAtuais >= c.usosMaximos) {
    return { ok: false, erro: `Cupom ${c.codigo} atingiu o limite de usos.` };
  }
  const minimo = centavos(Number(c.valorMinimo));
  if (subtotal < minimo) return { ok: false, erro: `Cupom ${c.codigo} requer compra mínima de ${formatar(minimo)}.` };
  return {
    ok: true,
    cupom: { id: c.id, codigo: c.codigo, tipo: c.tipo as "percentual" | "valor", valor: Number(c.valor), descricao: c.descricao },
  };
}

// ─── Finalizar venda (seção 4.1.2) ──────────────────────────────────────────

export type ResultadoVenda = { ok: true; id: number; numero: string; troco: number } | { ok: false; erro: string };

export async function finalizarVenda(entrada: FinalizarVendaInput, usuario: Usuario, ctx: ContextoRequisicao): Promise<ResultadoVenda> {
  if (!temPermissao(usuario.permissoes, PERMISSAO.VENDAS_CRIAR)) return { ok: false, erro: "Sem permissão para vender." };

  // 1. Produtos e preços do banco (nunca do navegador).
  const ids = [...new Set(entrada.itens.map((i) => i.produtoId))];
  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true, sku: true, status: true, precoVenda: true, precoCusto: true, unidadeMedida: true },
  });
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const itens: { produto: (typeof produtos)[number]; quantidade: number; precoCentavos: number }[] = [];
  for (const i of entrada.itens) {
    const p = porId.get(i.produtoId);
    if (!p) return { ok: false, erro: "Um produto do carrinho não existe mais. Remova-o e tente de novo." };
    if (p.status !== "ativo") return { ok: false, erro: `"${p.nome}" foi desativado. Remova-o do carrinho.` };
    if (p.unidadeMedida === "un" && !Number.isInteger(i.quantidade)) {
      return { ok: false, erro: `"${p.nome}" é vendido por unidade: use quantidade inteira.` };
    }
    itens.push({ produto: p, quantidade: i.quantidade, precoCentavos: centavos(Number(p.precoVenda)) });
  }

  // 2. Desconto (um só por venda — seção 3.1.2, cenário 3).
  const subtotalBruto = calcularTotais(itens, null).subtotal;
  let desconto: Desconto = null;
  let cupomId: number | null = null;
  let cupomUsosMaximos: number | null = null;
  if (entrada.desconto?.tipo === "cupom") {
    const r = await validarCupom(entrada.desconto.codigo, subtotalBruto);
    if (!r.ok) return r;
    desconto = { tipo: r.cupom.tipo, valor: r.cupom.valor };
    cupomId = r.cupom.id;
    cupomUsosMaximos = (await prisma.cupomPromocional.findUnique({ where: { id: cupomId }, select: { usosMaximos: true } }))!.usosMaximos;
  } else if (entrada.desconto) {
    desconto = entrada.desconto;
  }
  const totais = calcularTotais(itens, desconto);

  if (desconto?.tipo === "valor" && centavos(desconto.valor) > totais.subtotal) {
    return { ok: false, erro: "O desconto não pode ser maior que o subtotal." };
  }
  if (entrada.desconto && entrada.desconto.tipo !== "cupom" && totais.descontoValor > 0) {
    const regras = await regrasDesconto(usuario);
    if (regras.limitePct !== null && totais.descontoPercentual > regras.limitePct + 1e-9) {
      return { ok: false, erro: `Seu limite de desconto é ${regras.limitePct}% (este desconto equivale a ${totais.descontoPercentual}%).` };
    }
    if (regras.exigeAprovacaoAcimaDe !== null && totais.descontoValor > regras.exigeAprovacaoAcimaDe) {
      return {
        ok: false,
        erro: `Descontos acima de ${formatar(regras.exigeAprovacaoAcimaDe)} precisam de um gerente. Peça para um gerente finalizar esta venda.`,
      };
    }
  }

  // 3. Pagamentos.
  const vendasCfg = await getConfig("vendas");
  const pg = validarPagamentos(totais.total, entrada.pagamentos, {
    formasAceitas: vendasCfg.formasPagamento,
    parcelamentoMax: vendasCfg.parcelamentoMax,
  });
  if (!pg.ok) return pg;

  // 4. Grava tudo numa transação.
  const empresa = await getConfig("empresa");
  const dia = dataNoFuso(new Date(), empresa.funcionamento.timezone).replace(/-/g, "");
  try {
    const venda = await prisma.$transaction(async (tx) => {
      if (cupomId !== null) {
        // Reserva o uso do cupom de forma atômica (evita ultrapassar o limite com vendas simultâneas).
        const reservado = await tx.cupomPromocional.updateMany({
          where: { id: cupomId, ...(cupomUsosMaximos !== null && { usosAtuais: { lt: cupomUsosMaximos } }) },
          data: { usosAtuais: { increment: 1 } },
        });
        if (reservado.count === 0) throw new ErroVenda("O cupom atingiu o limite de usos.");
      }

      const criada = await tx.venda.create({
        data: {
          numero: `TMP-${crypto.randomUUID()}`.slice(0, 30),
          operadorId: usuario.id,
          subtotal: dec(totais.subtotal),
          descontoTipo: entrada.desconto?.tipo ?? null,
          descontoPercentual: totais.descontoValor > 0 ? new Prisma.Decimal(totais.descontoPercentual.toFixed(2)) : null,
          descontoValor: dec(totais.descontoValor),
          cupomId,
          total: dec(totais.total),
          troco: dec(pg.troco),
          itens: {
            create: itens.map((i) => ({
              produtoId: i.produto.id,
              nomeProduto: i.produto.nome,
              sku: i.produto.sku,
              unidadeMedida: i.produto.unidadeMedida,
              quantidade: new Prisma.Decimal(i.quantidade.toFixed(3)),
              precoUnitario: dec(i.precoCentavos),
              precoCustoUnitario: i.produto.precoCusto,
              subtotal: dec(Math.round(i.precoCentavos * i.quantidade)),
            })),
          },
          pagamentos: {
            create: entrada.pagamentos.map((p) => ({
              forma: p.forma,
              valor: dec(p.valor),
              parcelas: p.forma === "credito" ? (p.parcelas ?? 1) : 1,
              valorRecebido: p.forma === "dinheiro" ? dec(p.recebido ?? p.valor) : null,
              troco: p.forma === "dinheiro" ? dec((p.recebido ?? p.valor) - p.valor) : null,
              numeroTransacao: p.numeroTransacao || null,
            })),
          },
        },
      });
      // Número legível: VEND-AAAAMMDD-000123 (o id garante unicidade).
      return tx.venda.update({
        where: { id: criada.id },
        data: { numero: `VEND-${dia}-${String(criada.id).padStart(6, "0")}` },
        select: { id: true, numero: true },
      });
    });

    await prisma.auditoria.create({
      data: {
        acao: "VENDA_CRIADA",
        modulo: "VENDAS_PDV",
        usuarioId: usuario.id,
        emailUsuario: usuario.email,
        descricao: `Venda ${venda.numero}`,
        dadosModificados: {
          venda_id: venda.id,
          total: reais(totais.total),
          desconto: reais(totais.descontoValor),
          desconto_tipo: entrada.desconto?.tipo ?? null,
          itens: itens.length,
        },
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
    return { ok: true, id: venda.id, numero: venda.numero, troco: pg.troco };
  } catch (e) {
    if (e instanceof ErroVenda) return { ok: false, erro: e.message };
    throw e;
  }
}

class ErroVenda extends Error {}

// ─── Consulta, histórico e cancelamento ─────────────────────────────────────

/** Operador vê só as próprias vendas; quem tem `vendas.ver` vê todas. */
function escopo(usuario: Usuario): Prisma.VendaWhereInput {
  return temPermissao(usuario.permissoes, PERMISSAO.VENDAS_VER) ? {} : { operadorId: usuario.id };
}

export function podeVerVendas(usuario: Usuario) {
  return (
    temPermissao(usuario.permissoes, PERMISSAO.VENDAS_VER) || temPermissao(usuario.permissoes, PERMISSAO.VENDAS_VER_PROPRIAS)
  );
}

export async function vendasDoDia(usuario: Usuario, dia?: string) {
  const empresa = await getConfig("empresa");
  const tz = empresa.funcionamento.timezone;
  const diaRef = dia ?? dataNoFuso(new Date(), tz);
  const { inicio, fim } = intervaloDoDia(diaRef, tz);
  const vendas = await prisma.venda.findMany({
    where: { ...escopo(usuario), criadoEm: { gte: inicio, lt: fim } },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      numero: true,
      criadoEm: true,
      total: true,
      descontoValor: true,
      status: true,
      operador: { select: { nome: true } },
      pagamentos: { select: { forma: true, valor: true } },
      _count: { select: { itens: true } },
    },
  });

  const finalizadas = vendas.filter((v) => v.status === "finalizada");
  const porForma: Record<string, number> = {};
  for (const v of finalizadas) for (const p of v.pagamentos) porForma[p.forma] = (porForma[p.forma] ?? 0) + centavos(Number(p.valor));
  const totalVendido = finalizadas.reduce((s, v) => s + centavos(Number(v.total)), 0);

  return {
    dia: diaRef,
    vendas,
    resumo: {
      quantidade: finalizadas.length,
      canceladas: vendas.length - finalizadas.length,
      total: totalVendido,
      ticketMedio: finalizadas.length ? Math.round(totalVendido / finalizadas.length) : 0,
      porForma,
    },
  };
}

export async function buscarVenda(id: number, usuario: Usuario) {
  return prisma.venda.findFirst({
    where: { id, ...escopo(usuario) },
    include: {
      itens: { orderBy: { id: "asc" } },
      pagamentos: { orderBy: { id: "asc" } },
      operador: { select: { nome: true } },
      canceladoPor: { select: { nome: true } },
      cupom: { select: { codigo: true } },
    },
  });
}

export function podeCancelar(usuario: Usuario, operadorId: number) {
  return (
    temPermissao(usuario.permissoes, PERMISSAO.VENDAS_CANCELAR) ||
    (temPermissao(usuario.permissoes, PERMISSAO.VENDAS_CANCELAR_PROPRIAS) && operadorId === usuario.id)
  );
}

export async function cancelarVenda(id: number, motivo: string, usuario: Usuario, ctx: ContextoRequisicao) {
  const venda = await prisma.venda.findUnique({ where: { id }, select: { id: true, numero: true, status: true, operadorId: true, cupomId: true, total: true } });
  if (!venda) return { ok: false as const, erro: "Venda não encontrada." };
  if (!podeCancelar(usuario, venda.operadorId)) return { ok: false as const, erro: "Você não pode cancelar esta venda." };
  if (venda.status === "cancelada") return { ok: false as const, erro: "Esta venda já está cancelada." };

  // Condicional em status = finalizada: com dois cancelamentos simultâneos, só um vence.
  const cancelou = await prisma.$transaction(async (tx) => {
    const r = await tx.venda.updateMany({
      where: { id, status: "finalizada" },
      data: { status: "cancelada", canceladoEm: new Date(), canceladoPorId: usuario.id, motivoCancelamento: motivo },
    });
    if (r.count === 0) return false;
    // Devolve o uso do cupom.
    if (venda.cupomId) {
      await tx.cupomPromocional.updateMany({ where: { id: venda.cupomId, usosAtuais: { gt: 0 } }, data: { usosAtuais: { decrement: 1 } } });
    }
    return true;
  });
  if (!cancelou) return { ok: false as const, erro: "Esta venda já está cancelada." };

  await prisma.auditoria.create({
    data: {
      acao: "VENDA_CANCELADA",
      modulo: "VENDAS_PDV",
      nivel: "WARN",
      usuarioId: usuario.id,
      emailUsuario: usuario.email,
      descricao: `Venda ${venda.numero} cancelada`,
      dadosModificados: { venda_id: id, total: Number(venda.total), motivo },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
  return { ok: true as const };
}

// ─── Gestão de cupons ───────────────────────────────────────────────────────

export function listarCupons() {
  return prisma.cupomPromocional.findMany({ orderBy: [{ ativo: "desc" }, { expiracao: "desc" }] });
}

export async function criarCupom(dados: CupomInput, autor: { id: number; email: string }, ctx: ContextoRequisicao) {
  if (await prisma.cupomPromocional.findUnique({ where: { codigo: dados.codigo }, select: { id: true } })) {
    return { ok: false as const, campos: { codigo: ["Já existe um cupom com este código"] } };
  }
  try {
    const c = await prisma.cupomPromocional.create({
      data: {
        codigo: dados.codigo,
        descricao: dados.descricao ?? null,
        tipo: dados.tipo,
        valor: new Prisma.Decimal(dados.valor.toFixed(2)),
        valorMinimo: new Prisma.Decimal(dados.valorMinimo.toFixed(2)),
        usosMaximos: dados.usosMaximos,
        inicio: dados.inicio,
        expiracao: dados.expiracao,
        ativo: dados.ativo,
        criadoPorId: autor.id,
      },
    });
    await prisma.auditoria.create({
      data: {
        acao: "CUPOM_CRIADO",
        modulo: "VENDAS_PDV",
        usuarioId: autor.id,
        emailUsuario: autor.email,
        dadosModificados: { cupom_id: c.id, codigo: c.codigo, tipo: c.tipo, valor: dados.valor },
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false as const, campos: { codigo: ["Já existe um cupom com este código"] } };
    }
    throw e;
  }
}

export async function alternarCupom(id: number, ativo: boolean, autor: { id: number; email: string }, ctx: ContextoRequisicao) {
  const r = await prisma.cupomPromocional.updateMany({ where: { id }, data: { ativo } });
  if (r.count) {
    await prisma.auditoria.create({
      data: {
        acao: ativo ? "CUPOM_ATIVADO" : "CUPOM_DESATIVADO",
        modulo: "VENDAS_PDV",
        usuarioId: autor.id,
        emailUsuario: autor.email,
        dadosModificados: { cupom_id: id },
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  }
}
