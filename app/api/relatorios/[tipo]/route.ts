import { usuarioAtualOuNull } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { analisar, type Analise, lerFiltro } from "@/lib/services/relatorios.service";
import { ROTULOS_FORMA } from "@/lib/vendas/calculo";

// CSV no padrão do Excel em português: separador ";", vírgula decimal e BOM UTF-8 (acentos).
const valor = (centavos: number) => (centavos / 100).toFixed(2).replace(".", ",");
const numero = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");
const celula = (v: string | number) => {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const TIPOS: Record<string, { nome: string; gerar: (a: Analise) => (string | number)[][] }> = {
  diario: {
    nome: "faturamento-diario",
    gerar: (a) => [
      ["Data", "Vendas", "Receita (R$)", "CMV (R$)", "Despesas (R$)", "Resultado (R$)"],
      ...a.serie.map((s) => [s.data.split("-").reverse().join("/"), s.vendas, valor(s.receita), valor(s.custo), valor(s.despesas), valor(s.lucro)]),
    ],
  },
  dre: {
    nome: "dre",
    gerar: ({ dre: d }) => [
      ["Conta", "Valor (R$)"],
      ["Receita bruta de vendas", valor(d.receitaBruta)],
      ["(-) Descontos", valor(-d.descontos)],
      ["= Faturamento", valor(d.faturamento)],
      [`(-) Impostos sobre vendas (estimado ${numero(d.aliquotas.total)}%)`, valor(-d.impostos)],
      ["= Receita líquida", valor(d.receitaLiquida)],
      ["(-) CMV", valor(-d.cmv)],
      ["= Lucro bruto", valor(d.lucroBruto)],
      ...d.operacionais.map((o) => [`(-) ${o.rotulo}`, valor(-o.valor)]),
      ["= Resultado operacional", valor(d.resultadoOperacional)],
      ["(-) Despesas financeiras", valor(-d.despesasFinanceiras)],
      ["(-) Taxas de cartão (estimado)", valor(-d.taxasCartao)],
      ["= Lucro líquido", valor(d.lucroLiquido)],
    ],
  },
  categorias: {
    nome: "vendas-por-categoria",
    gerar: (a) => [
      ["Categoria", "Quantidade", "Receita (R$)", "% do total", "Custo (R$)", "Lucro bruto (R$)", "Margem %"],
      ...a.categorias.map((c) => [c.nome, numero(c.quantidade), valor(c.receita), numero(c.participacaoPct), valor(c.custo), valor(c.lucro), numero(c.margemPct)]),
    ],
  },
  produtos: {
    nome: "vendas-por-produto",
    gerar: (a) => [
      ["Produto", "Categoria", "Quantidade", "Receita (R$)", "% do total", "Custo (R$)", "Lucro (R$)", "Margem %"],
      ...a.produtos.map((p) => [p.nome, p.categoria, numero(p.quantidade), valor(p.receita), numero(p.participacaoPct), valor(p.custo), valor(p.lucro), numero(p.margemPct)]),
    ],
  },
  formas: {
    nome: "formas-de-pagamento",
    gerar: (a) => [
      ["Forma", "Pagamentos", "Receita (R$)", "% do total", "Ticket médio (R$)"],
      ...a.formas.map((f) => [ROTULOS_FORMA[f.forma as keyof typeof ROTULOS_FORMA] ?? f.forma, f.vendas, valor(f.receita), numero(f.participacaoPct), valor(f.ticketMedio)]),
    ],
  },
  horarios: {
    nome: "vendas-por-horario",
    gerar: (a) => {
      const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const linhas: (string | number)[][] = [["Dia da semana", "Hora", "Vendas", "Receita (R$)"]];
      a.heatmap.forEach((horas, d) => horas.forEach((c, h) => c.vendas > 0 && linhas.push([dias[d], `${String(h).padStart(2, "0")}h`, c.vendas, valor(c.receita)])));
      return linhas;
    },
  },
};

export async function GET(request: Request, ctx: RouteContext<"/api/relatorios/[tipo]">) {
  const usuario = await usuarioAtualOuNull();
  if (!usuario) return new Response("Não autenticado", { status: 401 });
  if (!temPermissao(usuario.permissoes, PERMISSAO.RELATORIOS_VER)) return new Response("Sem permissão", { status: 403 });
  const { tipo } = await ctx.params;
  const def = TIPOS[tipo];
  if (!def) return new Response("Relatório inexistente", { status: 404 });

  const filtro = await lerFiltro(Object.fromEntries(new URL(request.url).searchParams));
  const linhas = def.gerar(await analisar(filtro.atual));
  const csv = "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  const arquivo = `${def.nome}_${filtro.atual.de}_a_${filtro.atual.ate}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${arquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
