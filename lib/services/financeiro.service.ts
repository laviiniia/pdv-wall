import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dataNoFuso, intervaloDoDia } from "@/lib/utils/data";
import { CATEGORIAS_DESPESA_PADRAO } from "@/lib/validations/configuracoes.schema";
import type { DespesaInput } from "@/lib/validations/financeiro.schema";
import type { ContextoRequisicao } from "./auth.service";
import { sessaoAbertaDoOperador } from "./caixa.service";
import { getConfig } from "./configuracoes.service";

type Autor = { id: number; email: string };
const c = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Math.round(Number(v.toString()) * 100));
const dec = (centavos: number) => new Prisma.Decimal((centavos / 100).toFixed(2));
const paraData = (d: string) => new Date(`${d}T00:00:00.000Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

async function tz() {
  return (await getConfig("empresa")).funcionamento.timezone;
}
export async function hojeISO() {
  return dataNoFuso(new Date(), await tz());
}

/** Soma `meses` a uma data AAAA-MM-DD, mantendo o dia (ou o último dia do mês). */
function somarMeses(dia: string, meses: number) {
  const [a, m, d] = dia.split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return iso(alvo);
}

// ─── Categorias (Configurações › Financeiro) ────────────────────────────────

export async function categoriasDespesa() {
  const fin = await getConfig("financeiro");
  return [
    ...fin.categoriasDespesa.map((k) => ({ valor: k, rotulo: CATEGORIAS_DESPESA_PADRAO[k] })),
    ...fin.categoriasCustomizadas.map((nome) => ({ valor: nome, rotulo: nome })),
  ];
}

export function rotuloCategoria(valor: string) {
  return (CATEGORIAS_DESPESA_PADRAO as Record<string, string>)[valor] ?? valor;
}

// ─── Despesas (seção 2) ─────────────────────────────────────────────────────

export type Resultado = { ok: true; id: number; numero?: string } | { ok: false; erro: string; campos?: Record<string, string[]> };

export async function criarDespesa(d: DespesaInput, autor: Autor & { nome: string }, ctx: ContextoRequisicao): Promise<Resultado> {
  const hoje = await hojeISO();
  if (d.dataDespesa > hoje) return { ok: false, erro: "Corrija os campos destacados.", campos: { dataDespesa: ["A data não pode ser no futuro"] } };
  const categorias = await categoriasDespesa();
  if (!categorias.some((x) => x.valor === d.categoria)) {
    return { ok: false, erro: "Corrija os campos destacados.", campos: { categoria: ["Categoria inativa ou inexistente"] } };
  }
  let sessaoId: number | null = null;
  if (d.doCaixa) {
    const sessao = await sessaoAbertaDoOperador(autor.id);
    if (!sessao) return { ok: false, erro: "Corrija os campos destacados.", campos: { doCaixa: ["Você não tem caixa aberto"] } };
    sessaoId = sessao.id;
  }

  const valor = Math.round(d.valor * 100);
  const dia = hoje.replace(/-/g, "");
  const despesa = await prisma.$transaction(async (tx) => {
    let fornecedorId: number | null = null;
    if (d.fornecedorNome) {
      const f = await tx.fornecedor.findFirst({ where: { nome: { equals: d.fornecedorNome, mode: "insensitive" } }, select: { id: true } });
      fornecedorId = f?.id ?? (await tx.fornecedor.create({ data: { nome: d.fornecedorNome } })).id;
    }
    const criada = await tx.despesa.create({
      data: {
        numero: `TMP-${crypto.randomUUID()}`.slice(0, 30),
        categoria: d.categoria,
        descricao: d.descricao,
        valor: dec(valor),
        dataDespesa: paraData(d.dataDespesa),
        tipo: d.tipo,
        recorrente: d.recorrente ?? null,
        fornecedorId,
        numeroNf: d.numeroNf ?? null,
        pagaNaHora: d.pagamento === "agora",
        formaPagamento: d.pagamento === "agora" ? d.formaPagamento! : null,
        sessaoCaixaId: sessaoId,
        observacoes: d.observacoes ?? null,
        criadoPorId: autor.id,
      },
    });
    const numero = `DESP-${dia}-${String(criada.id).padStart(6, "0")}`;
    await tx.despesa.update({ where: { id: criada.id }, data: { numero } });

    // A prazo: gera as parcelas em contas a pagar (a última absorve os centavos).
    if (d.pagamento === "prazo") {
      const base = Math.floor(valor / d.parcelas);
      for (let p = 1; p <= d.parcelas; p++) {
        const parcela = p === d.parcelas ? valor - base * (d.parcelas - 1) : base;
        const conta = await tx.contaPagar.create({
          data: {
            numero: `TMP-${crypto.randomUUID()}`.slice(0, 30),
            despesaId: criada.id,
            fornecedorId,
            descricao: d.parcelas > 1 ? `${d.descricao} (${p}/${d.parcelas})` : d.descricao,
            categoria: d.categoria,
            valorTotal: dec(parcela),
            vencimento: paraData(somarMeses(d.primeiroVencimento!, p - 1)),
            parcela: p,
            totalParcelas: d.parcelas,
            criadoPorId: autor.id,
          },
        });
        await tx.contaPagar.update({ where: { id: conta.id }, data: { numero: `CONTA-${dia}-${String(conta.id).padStart(6, "0")}` } });
      }
    }
    return { id: criada.id, numero };
  });

  await auditar("DESPESA_CRIADA", autor, ctx, { despesa_id: despesa.id, valor: d.valor, categoria: d.categoria, pagamento: d.pagamento, parcelas: d.parcelas });
  return { ok: true, ...despesa };
}

export async function listarDespesas(mes: string, categoria?: string) {
  const [a, m] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(a, m - 1, 1));
  const fim = new Date(Date.UTC(a, m, 1));
  return prisma.despesa.findMany({
    where: { dataDespesa: { gte: inicio, lt: fim }, ...(categoria && { categoria }) },
    orderBy: [{ dataDespesa: "desc" }, { id: "desc" }],
    include: { fornecedor: { select: { nome: true } }, criadoPor: { select: { nome: true } }, _count: { select: { contas: true } } },
  });
}

/** Cancela a despesa e as parcelas ainda não pagas; bloqueia se alguma parcela já recebeu pagamento. */
export async function cancelarDespesa(id: number, autor: Autor, ctx: ContextoRequisicao): Promise<Resultado> {
  const desp = await prisma.despesa.findUnique({ where: { id }, include: { contas: { select: { valorPago: true } }, sessaoCaixa: { select: { status: true } } } });
  if (!desp || desp.cancelada) return { ok: false, erro: "Despesa não encontrada ou já cancelada." };
  if (desp.contas.some((ct) => c(ct.valorPago) > 0)) return { ok: false, erro: "Há parcelas já pagas: estorne os pagamentos antes de cancelar." };
  if (desp.sessaoCaixa?.status === "fechado") return { ok: false, erro: "O dinheiro saiu de um caixa já fechado; não é possível cancelar." };
  await prisma.$transaction([
    prisma.despesa.update({ where: { id }, data: { cancelada: true } }),
    prisma.contaPagar.updateMany({ where: { despesaId: id, status: { in: ["pendente"] } }, data: { status: "cancelada" } }),
  ]);
  await auditar("DESPESA_CANCELADA", autor, ctx, { despesa_id: id });
  return { ok: true, id };
}

// ─── Contas a pagar (seção 3) ───────────────────────────────────────────────

export type FiltroContas = "abertas" | "vencidas" | "semana" | "pagas" | "todas";

export async function listarContas(filtro: FiltroContas = "abertas") {
  const hoje = paraData(await hojeISO());
  const em7 = new Date(hoje.getTime() + 7 * 86_400_000);
  const abertas: Prisma.ContaPagarWhereInput = { status: { in: ["pendente", "parcial"] } };
  const where: Prisma.ContaPagarWhereInput =
    filtro === "abertas"
      ? abertas
      : filtro === "vencidas"
        ? { ...abertas, vencimento: { lt: hoje } }
        : filtro === "semana"
          ? { ...abertas, vencimento: { gte: hoje, lte: em7 } }
          : filtro === "pagas"
            ? { status: "paga" }
            : {};
  const contas = await prisma.contaPagar.findMany({
    where,
    orderBy: filtro === "pagas" ? { vencimento: "desc" } : { vencimento: "asc" },
    take: 200,
    include: { fornecedor: { select: { nome: true } }, pagamentos: { orderBy: { criadoEm: "asc" }, select: { valor: true, dataPagamento: true, forma: true } } },
  });
  return contas.map((ct) => ({
    ...ct,
    restante: c(ct.valorTotal) - c(ct.valorPago),
    vencida: (ct.status === "pendente" || ct.status === "parcial") && ct.vencimento < hoje,
  }));
}

export async function resumoContas() {
  const hoje = paraData(await hojeISO());
  const em7 = new Date(hoje.getTime() + 7 * 86_400_000);
  const abertas = await prisma.contaPagar.findMany({ where: { status: { in: ["pendente", "parcial"] } }, select: { valorTotal: true, valorPago: true, vencimento: true } });
  const soma = (l: typeof abertas) => l.reduce((s, x) => s + c(x.valorTotal) - c(x.valorPago), 0);
  const vencidas = abertas.filter((x) => x.vencimento < hoje);
  const semana = abertas.filter((x) => x.vencimento >= hoje && x.vencimento <= em7);
  return { abertas: abertas.length, totalAberto: soma(abertas), vencidas: vencidas.length, totalVencido: soma(vencidas), semana: semana.length, totalSemana: soma(semana) };
}

export async function pagarConta(
  dados: { contaId: number; valor: number; dataPagamento: string; forma: string; numeroTransacao?: string },
  autor: Autor,
  ctx: ContextoRequisicao,
): Promise<Resultado> {
  if (dados.dataPagamento > (await hojeISO())) return { ok: false, erro: "A data do pagamento não pode ser no futuro." };
  const conta = await prisma.contaPagar.findUnique({ where: { id: dados.contaId } });
  if (!conta || !(conta.status === "pendente" || conta.status === "parcial")) return { ok: false, erro: "Esta conta não está em aberto." };
  const valor = Math.round(dados.valor * 100);
  const pagoAntes = c(conta.valorPago);
  const restante = c(conta.valorTotal) - pagoAntes;
  if (valor > restante) return { ok: false, erro: `O valor passa do que falta pagar (${(restante / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).` };

  const novoPago = pagoAntes + valor;
  const ok = await prisma.$transaction(async (tx) => {
    // Condicional no valor pago anterior: dois pagamentos simultâneos não se sobrepõem.
    const r = await tx.contaPagar.updateMany({
      where: { id: conta.id, valorPago: conta.valorPago },
      data: { valorPago: dec(novoPago), status: novoPago === c(conta.valorTotal) ? "paga" : "parcial" },
    });
    if (r.count === 0) return false;
    await tx.pagamentoConta.create({
      data: {
        contaId: conta.id,
        valor: dec(valor),
        dataPagamento: paraData(dados.dataPagamento),
        forma: dados.forma as Prisma.PagamentoContaCreateInput["forma"],
        numeroTransacao: dados.numeroTransacao ?? null,
        usuarioId: autor.id,
      },
    });
    return true;
  });
  if (!ok) return { ok: false, erro: "A conta foi alterada por outra pessoa. Atualize a página." };
  await auditar("CONTA_PAGA", autor, ctx, { conta_id: conta.id, valor: dados.valor, quitada: novoPago === c(conta.valorTotal) });
  return { ok: true, id: conta.id };
}

export async function cancelarConta(id: number, autor: Autor, ctx: ContextoRequisicao): Promise<Resultado> {
  const r = await prisma.contaPagar.updateMany({ where: { id, status: "pendente", valorPago: 0 }, data: { status: "cancelada" } });
  if (r.count === 0) return { ok: false, erro: "Só contas sem nenhum pagamento podem ser canceladas." };
  await auditar("CONTA_CANCELADA", autor, ctx, { conta_id: id });
  return { ok: true, id };
}

// ─── Painel (seção 1) e fluxo de caixa (seção 4) ────────────────────────────

function limitesMes(mes: string, fuso: string) {
  const [a, m] = mes.split("-").map(Number);
  const primeiro = `${a}-${String(m).padStart(2, "0")}-01`;
  const proximo = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
  return { inicio: intervaloDoDia(primeiro, fuso).inicio, fim: intervaloDoDia(proximo, fuso).inicio, dataInicio: paraData(primeiro), dataFim: paraData(proximo) };
}

export function mesAnterior(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * DRE simplificada do mês (competência):
 *   faturamento − CMV (custo gravado em cada item vendido) = lucro bruto
 *   lucro bruto − despesas do mês (exceto categoria "cmv", que já está no CMV) = lucro líquido
 */
export async function indicadoresMes(mes: string) {
  const fuso = await tz();
  const { inicio, fim, dataInicio, dataFim } = limitesMes(mes, fuso);
  const [vendas, itens, despesas] = await Promise.all([
    prisma.venda.aggregate({ where: { status: "finalizada", criadoEm: { gte: inicio, lt: fim } }, _sum: { total: true }, _count: true }),
    prisma.itemVenda.findMany({ where: { venda: { status: "finalizada", criadoEm: { gte: inicio, lt: fim } } }, select: { quantidade: true, precoCustoUnitario: true } }),
    prisma.despesa.groupBy({ by: ["categoria"], where: { cancelada: false, dataDespesa: { gte: dataInicio, lt: dataFim } }, _sum: { valor: true } }),
  ]);
  const faturamento = c(vendas._sum.total);
  const cmv = itens.reduce((s, i) => s + Math.round(Number(i.quantidade) * c(i.precoCustoUnitario)), 0);
  const porCategoria = despesas.map((d) => ({ categoria: d.categoria, rotulo: rotuloCategoria(d.categoria), valor: c(d._sum.valor) })).sort((a, b) => b.valor - a.valor);
  const despesasOperacionais = porCategoria.filter((d) => d.categoria !== "cmv").reduce((s, d) => s + d.valor, 0);
  const comprasInsumos = porCategoria.find((d) => d.categoria === "cmv")?.valor ?? 0;
  const lucroBruto = faturamento - cmv;
  const lucroLiquido = lucroBruto - despesasOperacionais;
  return {
    faturamento,
    vendas: vendas._count,
    ticketMedio: vendas._count ? Math.round(faturamento / vendas._count) : 0,
    cmv,
    lucroBruto,
    despesasOperacionais,
    comprasInsumos,
    lucroLiquido,
    margemLiquidaPct: faturamento ? Math.round((lucroLiquido / faturamento) * 1000) / 10 : 0,
    porCategoria,
  };
}

/** Fluxo de caixa diário do mês (regime de caixa): entradas = vendas; saídas = despesas pagas na hora + pagamentos de contas. */
export async function fluxoCaixaMes(mes: string) {
  const fuso = await tz();
  const { inicio, fim, dataInicio, dataFim } = limitesMes(mes, fuso);
  const [pagamentosVenda, despesas, pagamentosConta] = await Promise.all([
    prisma.pagamento.findMany({ where: { venda: { status: "finalizada", criadoEm: { gte: inicio, lt: fim } } }, select: { valor: true, forma: true, venda: { select: { criadoEm: true } } } }),
    prisma.despesa.findMany({ where: { cancelada: false, pagaNaHora: true, dataDespesa: { gte: dataInicio, lt: dataFim } }, select: { valor: true, dataDespesa: true } }),
    prisma.pagamentoConta.findMany({ where: { dataPagamento: { gte: dataInicio, lt: dataFim } }, select: { valor: true, dataPagamento: true } }),
  ]);

  const dias = new Map<string, { entradas: number; saidas: number; porForma: Record<string, number> }>();
  const dia = (k: string) => {
    if (!dias.has(k)) dias.set(k, { entradas: 0, saidas: 0, porForma: {} });
    return dias.get(k)!;
  };
  for (const p of pagamentosVenda) {
    const d = dia(dataNoFuso(p.venda.criadoEm, fuso));
    d.entradas += c(p.valor);
    d.porForma[p.forma] = (d.porForma[p.forma] ?? 0) + c(p.valor);
  }
  for (const x of despesas) dia(iso(x.dataDespesa)).saidas += c(x.valor);
  for (const x of pagamentosConta) dia(iso(x.dataPagamento)).saidas += c(x.valor);

  let acumulado = 0;
  const linhas = [...dias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, v]) => {
      const resultado = v.entradas - v.saidas;
      acumulado += resultado;
      return { data, ...v, resultado, acumulado };
    });
  return {
    linhas,
    totalEntradas: linhas.reduce((s, l) => s + l.entradas, 0),
    totalSaidas: linhas.reduce((s, l) => s + l.saidas, 0),
    melhor: linhas.reduce<(typeof linhas)[number] | null>((m, l) => (!m || l.resultado > m.resultado ? l : m), null),
    pior: linhas.reduce<(typeof linhas)[number] | null>((m, l) => (!m || l.resultado < m.resultado ? l : m), null),
  };
}

function auditar(acao: string, autor: Autor, ctx: ContextoRequisicao, dados: Prisma.InputJsonObject) {
  return prisma.auditoria.create({
    data: { acao, modulo: "FINANCEIRO", usuarioId: autor.id, emailUsuario: autor.email, dadosModificados: dados, ipAddress: ctx.ip ?? null, userAgent: ctx.userAgent ?? null },
  });
}
