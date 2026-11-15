import "server-only";
import { prisma } from "@/lib/prisma";
import { dataNoFuso, intervaloDoDia } from "@/lib/utils/data";
import { getConfig } from "./configuracoes.service";
import { rotuloCategoria } from "./financeiro.service";

// Todos os valores em centavos. Datas "AAAA-MM-DD" no fuso da empresa.

const c = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Math.round(Number(v.toString()) * 100));
const DIA = 86_400_000;
const paraUTC = (d: string) => Date.parse(`${d}T00:00:00Z`);
const deUTC = (t: number) => new Date(t).toISOString().slice(0, 10);
const somarDias = (d: string, n: number) => deUTC(paraUTC(d) + n * DIA);

// ─── Período e comparação ───────────────────────────────────────────────────

export const PRESETS = {
  hoje: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  mes: "Este mês",
  mesAnterior: "Mês passado",
  ano: "Este ano",
  personalizado: "Personalizado",
} as const;
export type Preset = keyof typeof PRESETS;
export const COMPARACOES = { anterior: "Período anterior", ano: "Mesmo período do ano passado", nenhuma: "Sem comparação" } as const;
export type Comparacao = keyof typeof COMPARACOES;

export type Periodo = { de: string; ate: string; dias: number; rotulo: string };
export type FiltroRelatorio = { atual: Periodo; comparado: Periodo | null; preset: Preset; comparar: Comparacao };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const fmt = (d: string) => d.split("-").reverse().join("/");
function periodo(de: string, ate: string, rotulo?: string): Periodo {
  return { de, ate, dias: Math.round((paraUTC(ate) - paraUTC(de)) / DIA) + 1, rotulo: rotulo ?? (de === ate ? fmt(de) : `${fmt(de)} a ${fmt(ate)}`) };
}
function ultimoDiaMes(a: number, m: number) {
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}
function mesInteiro(a: number, m: number, rotulo?: string) {
  const mm = String(m).padStart(2, "0");
  return periodo(`${a}-${mm}-01`, `${a}-${mm}-${ultimoDiaMes(a, m)}`, rotulo);
}

/** Lê os parâmetros da URL (preset, de, ate, comparar) e devolve o período e o de comparação. */
export async function lerFiltro(sp: Record<string, string | string[] | undefined>): Promise<FiltroRelatorio> {
  const tz = (await getConfig("empresa")).funcionamento.timezone;
  const hoje = dataNoFuso(new Date(), tz);
  const [a, m] = hoje.split("-").map(Number);
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  let preset = (p("preset") && p("preset")! in PRESETS ? p("preset") : "mes") as Preset;
  const comparar = (p("comparar") && p("comparar")! in COMPARACOES ? p("comparar") : "anterior") as Comparacao;

  let atual: Periodo;
  switch (preset) {
    case "hoje":
      atual = periodo(hoje, hoje, "Hoje");
      break;
    case "7d":
      atual = periodo(somarDias(hoje, -6), hoje);
      break;
    case "30d":
      atual = periodo(somarDias(hoje, -29), hoje);
      break;
    case "mesAnterior":
      atual = m === 1 ? mesInteiro(a - 1, 12) : mesInteiro(a, m - 1);
      break;
    case "ano":
      atual = periodo(`${a}-01-01`, hoje);
      break;
    case "personalizado": {
      let de = p("de") ?? "";
      let ate = p("ate") ?? "";
      if (!ISO.test(de) || !ISO.test(ate)) {
        preset = "mes";
        atual = mesInteiro(a, m);
        break;
      }
      if (de > ate) [de, ate] = [ate, de];
      if (paraUTC(ate) - paraUTC(de) > 366 * DIA) de = somarDias(ate, -366); // até ~1 ano por consulta
      atual = periodo(de, ate);
      break;
    }
    default:
      atual = periodo(`${hoje.slice(0, 8)}01`, hoje); // este mês, até hoje
  }
  if (preset === "mes" || preset === "mesAnterior") {
    const [aa, mm] = atual.de.split("-").map(Number);
    atual = { ...atual, rotulo: nomeMes(aa, mm) };
  }

  let comparado: Periodo | null = null;
  if (comparar === "ano") {
    const menosUmAno = (d: string) => {
      const [y, mo, di] = d.split("-").map(Number);
      return `${y - 1}-${String(mo).padStart(2, "0")}-${String(Math.min(di, ultimoDiaMes(y - 1, mo))).padStart(2, "0")}`;
    };
    comparado = periodo(menosUmAno(atual.de), menosUmAno(atual.ate));
  } else if (comparar === "anterior") {
    const [ya, ma, da] = atual.de.split("-").map(Number);
    // Mês fechado (ou mês corrente até hoje) compara com o mês anterior equivalente.
    if (da === 1 && (preset === "mes" || preset === "mesAnterior")) {
      const [yp, mp] = ma === 1 ? [ya - 1, 12] : [ya, ma - 1];
      const ultimo = ultimoDiaMes(yp, mp);
      const diaFim = preset === "mes" ? Math.min(Number(atual.ate.slice(8)), ultimo) : ultimo;
      comparado = periodo(`${yp}-${String(mp).padStart(2, "0")}-01`, `${yp}-${String(mp).padStart(2, "0")}-${String(diaFim).padStart(2, "0")}`);
    } else {
      comparado = periodo(somarDias(atual.de, -atual.dias), somarDias(atual.de, -1));
    }
  }
  return { atual, comparado, preset, comparar };
}

function nomeMes(a: number, m: number) {
  const s = new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Query string que reproduz o filtro (para links e exportação). */
export function queryDoFiltro(f: FiltroRelatorio) {
  return new URLSearchParams({
    preset: f.preset,
    comparar: f.comparar,
    ...(f.preset === "personalizado" && { de: f.atual.de, ate: f.atual.ate }),
  }).toString();
}

// ─── Coleta ─────────────────────────────────────────────────────────────────

async function coletar(p: Periodo) {
  const tz = (await getConfig("empresa")).funcionamento.timezone;
  const inicio = intervaloDoDia(p.de, tz).inicio;
  const fim = intervaloDoDia(p.ate, tz).fim;
  const [vendas, canceladas, despesas] = await Promise.all([
    prisma.venda.findMany({
      where: { status: "finalizada", criadoEm: { gte: inicio, lt: fim } },
      select: {
        criadoEm: true,
        subtotal: true,
        descontoValor: true,
        total: true,
        pagamentos: { select: { forma: true, valor: true } },
        itens: {
          select: {
            produtoId: true,
            nomeProduto: true,
            quantidade: true,
            subtotal: true,
            precoCustoUnitario: true,
            produto: { select: { categoria: { select: { id: true, nome: true } } } },
          },
        },
      },
    }),
    prisma.venda.aggregate({ where: { status: "cancelada", criadoEm: { gte: inicio, lt: fim } }, _sum: { total: true }, _count: true }),
    prisma.despesa.findMany({
      where: { cancelada: false, dataDespesa: { gte: new Date(paraUTC(p.de)), lt: new Date(paraUTC(p.ate) + DIA) } },
      select: { categoria: true, valor: true, dataDespesa: true },
    }),
  ]);
  return { vendas, canceladas, despesas, tz };
}

type Linha = { receita: number; custo: number };
const margem = (l: Linha) => (l.receita ? Math.round(((l.receita - l.custo) / l.receita) * 1000) / 10 : 0);

/** Tudo o que os relatórios usam, calculado numa passada só sobre as vendas do período. */
export async function analisar(p: Periodo) {
  const [{ vendas, canceladas, despesas, tz }, vendasCfg, fin] = await Promise.all([coletar(p), getConfig("vendas"), getConfig("financeiro")]);

  let receitaBruta = 0;
  let descontos = 0;
  let faturamento = 0;
  let cmv = 0;
  const porDia = new Map<string, { receita: number; custo: number; vendas: number; despesas: number }>();
  const porCategoria = new Map<number, Linha & { nome: string; quantidade: number }>();
  const porProduto = new Map<number, Linha & { nome: string; categoria: string; quantidade: number }>();
  const porForma = new Map<string, { receita: number; vendas: number }>();
  // heatmap[diaSemana 0=dom][hora]
  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ receita: 0, vendas: 0 })));
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", hourCycle: "h23" });
  const DIAS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dia = (k: string) => {
    if (!porDia.has(k)) porDia.set(k, { receita: 0, custo: 0, vendas: 0, despesas: 0 });
    return porDia.get(k)!;
  };

  for (const v of vendas) {
    const total = c(v.total);
    const subtotal = c(v.subtotal);
    receitaBruta += subtotal;
    descontos += c(v.descontoValor);
    faturamento += total;
    const fator = subtotal ? total / subtotal : 0; // rateia o desconto da venda entre os itens
    let custoVenda = 0;
    for (const i of v.itens) {
      const receita = Math.round(c(i.subtotal) * fator);
      const qtd = Number(i.quantidade);
      const custo = Math.round(qtd * c(i.precoCustoUnitario));
      custoVenda += custo;
      const cat = i.produto.categoria;
      const lc = porCategoria.get(cat.id) ?? { nome: cat.nome, receita: 0, custo: 0, quantidade: 0 };
      lc.receita += receita;
      lc.custo += custo;
      lc.quantidade += qtd;
      porCategoria.set(cat.id, lc);
      const lp = porProduto.get(i.produtoId) ?? { nome: i.nomeProduto, categoria: cat.nome, receita: 0, custo: 0, quantidade: 0 };
      lp.receita += receita;
      lp.custo += custo;
      lp.quantidade += qtd;
      porProduto.set(i.produtoId, lp);
    }
    cmv += custoVenda;
    const d = dia(dataNoFuso(v.criadoEm, tz));
    d.receita += total;
    d.custo += custoVenda;
    d.vendas += 1;
    for (const pg of v.pagamentos) {
      const f = porForma.get(pg.forma) ?? { receita: 0, vendas: 0 };
      f.receita += c(pg.valor);
      f.vendas += 1;
      porForma.set(pg.forma, f);
    }
    const pt = Object.fromEntries(partes.formatToParts(v.criadoEm).map((x) => [x.type, x.value]));
    const cel = heatmap[DIAS_EN.indexOf(pt.weekday)]?.[Number(pt.hour) % 24];
    if (cel) {
      cel.receita += total;
      cel.vendas += 1;
    }
  }

  const despesasPorCategoria = new Map<string, number>();
  for (const d of despesas) {
    despesasPorCategoria.set(d.categoria, (despesasPorCategoria.get(d.categoria) ?? 0) + c(d.valor));
    if (d.categoria !== "cmv") dia(d.dataDespesa.toISOString().slice(0, 10)).despesas += c(d.valor);
  }

  // DRE. Impostos sobre vendas e taxas de cartão são ESTIMADOS com os percentuais de Configurações.
  const aliquotaPct = fin.icmsPct + fin.pisPct + fin.cofinsPct + fin.issPct;
  const impostos = Math.round((faturamento * aliquotaPct) / 100);
  const taxasCartao = Math.round(((porForma.get("debito")?.receita ?? 0) * vendasCfg.taxaDebitoPct + (porForma.get("credito")?.receita ?? 0) * vendasCfg.taxaCreditoPct) / 100);
  const receitaLiquida = faturamento - impostos;
  const lucroBruto = receitaLiquida - cmv;
  const operacionais = [...despesasPorCategoria.entries()]
    .filter(([k]) => k !== "cmv" && k !== "financeiro")
    .map(([k, valor]) => ({ categoria: k, rotulo: rotuloCategoria(k), valor }))
    .sort((x, y) => y.valor - x.valor);
  const totalOperacionais = operacionais.reduce((s, x) => s + x.valor, 0);
  const resultadoOperacional = lucroBruto - totalOperacionais;
  const despesasFinanceiras = despesasPorCategoria.get("financeiro") ?? 0;
  const lucroLiquido = resultadoOperacional - despesasFinanceiras - taxasCartao;

  // Série diária completa (dias sem venda aparecem zerados).
  const serie: { data: string; receita: number; custo: number; despesas: number; lucro: number; vendas: number }[] = [];
  for (let k = p.de; k <= p.ate; k = somarDias(k, 1)) {
    const d = porDia.get(k) ?? { receita: 0, custo: 0, vendas: 0, despesas: 0 };
    serie.push({ data: k, ...d, lucro: d.receita - d.custo - d.despesas });
  }
  const comVenda = serie.filter((s) => s.vendas > 0);

  return {
    periodo: p,
    faturamento,
    vendas: vendas.length,
    ticketMedio: vendas.length ? Math.round(faturamento / vendas.length) : 0,
    canceladas: { quantidade: canceladas._count, valor: c(canceladas._sum.total) },
    dre: {
      receitaBruta,
      descontos,
      faturamento,
      impostos,
      aliquotas: { icms: fin.icmsPct, pis: fin.pisPct, cofins: fin.cofinsPct, iss: fin.issPct, total: aliquotaPct },
      receitaLiquida,
      cmv,
      lucroBruto,
      operacionais,
      totalOperacionais,
      resultadoOperacional,
      despesasFinanceiras,
      taxasCartao,
      taxas: { debito: vendasCfg.taxaDebitoPct, credito: vendasCfg.taxaCreditoPct },
      lucroLiquido,
      comprasInsumos: despesasPorCategoria.get("cmv") ?? 0,
    },
    margemLiquidaPct: faturamento ? Math.round((lucroLiquido / faturamento) * 1000) / 10 : 0,
    serie,
    melhorDia: comVenda.reduce<(typeof serie)[number] | null>((m, s) => (!m || s.receita > m.receita ? s : m), null),
    piorDia: comVenda.reduce<(typeof serie)[number] | null>((m, s) => (!m || s.receita < m.receita ? s : m), null),
    categorias: [...porCategoria.values()]
      .map((l) => ({ ...l, lucro: l.receita - l.custo, margemPct: margem(l), participacaoPct: faturamento ? Math.round((l.receita / faturamento) * 1000) / 10 : 0 }))
      .sort((x, y) => y.receita - x.receita),
    produtos: [...porProduto.entries()]
      .map(([id, l]) => ({ id, ...l, lucro: l.receita - l.custo, margemPct: margem(l), participacaoPct: faturamento ? Math.round((l.receita / faturamento) * 1000) / 10 : 0 }))
      .sort((x, y) => y.receita - x.receita),
    formas: [...porForma.entries()]
      .map(([forma, f]) => ({ forma, ...f, ticketMedio: f.vendas ? Math.round(f.receita / f.vendas) : 0, participacaoPct: faturamento ? Math.round((f.receita / faturamento) * 1000) / 10 : 0 }))
      .sort((x, y) => y.receita - x.receita),
    heatmap,
  };
}

export type Analise = Awaited<ReturnType<typeof analisar>>;

/** Variação percentual (null quando não há base de comparação). */
export function variacao(atual: number, anterior: number | undefined) {
  if (anterior === undefined || anterior === 0) return null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 1000) / 10;
}
