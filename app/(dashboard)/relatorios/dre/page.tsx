import type { Metadata } from "next";
import { CabecalhoRelatorio } from "@/components/relatorios/Cabecalho";
import { brl, pct, Variacao } from "@/components/relatorios/comum";
import { analisar, lerFiltro, variacao } from "@/lib/services/relatorios.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "DRE" };

type Linha = { rotulo: string; chave: string; valor: number; anterior?: number; nivel: "total" | "sub" | "item"; sinal?: "−"; nota?: string };

export default async function DrePage({ searchParams }: PageProps<"/relatorios/dre">) {
  const filtro = await lerFiltro(await searchParams);
  const a = await analisar(filtro.atual);
  const b = filtro.comparado ? await analisar(filtro.comparado) : null;
  const d = a.dre;
  const base = d.faturamento || 1;
  const ant = (f: (x: typeof d) => number) => (b ? f(b.dre) : undefined);
  const opAnterior = new Map(b?.dre.operacionais.map((o) => [o.categoria, o.valor]));

  const linhas: Linha[] = [
    { chave: "rb", rotulo: "Receita bruta de vendas", valor: d.receitaBruta, anterior: ant((x) => x.receitaBruta), nivel: "sub" },
    { chave: "desc", rotulo: "Descontos concedidos", valor: d.descontos, anterior: ant((x) => x.descontos), nivel: "item", sinal: "−" },
    { chave: "fat", rotulo: "Faturamento (vendas finalizadas)", valor: d.faturamento, anterior: ant((x) => x.faturamento), nivel: "total" },
    {
      chave: "imp",
      rotulo: "Impostos sobre vendas (estimado)",
      valor: d.impostos,
      anterior: ant((x) => x.impostos),
      nivel: "item",
      sinal: "−",
      nota: `ICMS ${pct(d.aliquotas.icms, 2)} + PIS ${pct(d.aliquotas.pis, 2)} + COFINS ${pct(d.aliquotas.cofins, 2)} + ISS ${pct(d.aliquotas.iss, 2)} = ${pct(d.aliquotas.total, 2)}`,
    },
    { chave: "rl", rotulo: "Receita líquida", valor: d.receitaLiquida, anterior: ant((x) => x.receitaLiquida), nivel: "total" },
    { chave: "cmv", rotulo: "Custo dos produtos vendidos (CMV)", valor: d.cmv, anterior: ant((x) => x.cmv), nivel: "item", sinal: "−", nota: "preço de custo gravado em cada item vendido" },
    { chave: "lb", rotulo: "Lucro bruto", valor: d.lucroBruto, anterior: ant((x) => x.lucroBruto), nivel: "total" },
    ...d.operacionais.map((o): Linha => ({ chave: `op-${o.categoria}`, rotulo: o.rotulo, valor: o.valor, anterior: b ? (opAnterior.get(o.categoria) ?? 0) : undefined, nivel: "item", sinal: "−" })),
    { chave: "top", rotulo: "Despesas operacionais", valor: d.totalOperacionais, anterior: ant((x) => x.totalOperacionais), nivel: "sub", sinal: "−" },
    { chave: "ro", rotulo: "Resultado operacional", valor: d.resultadoOperacional, anterior: ant((x) => x.resultadoOperacional), nivel: "total" },
    { chave: "fin", rotulo: "Despesas financeiras (juros, taxas lançadas)", valor: d.despesasFinanceiras, anterior: ant((x) => x.despesasFinanceiras), nivel: "item", sinal: "−" },
    {
      chave: "tx",
      rotulo: "Taxas de cartão (estimado)",
      valor: d.taxasCartao,
      anterior: ant((x) => x.taxasCartao),
      nivel: "item",
      sinal: "−",
      nota: `débito ${pct(d.taxas.debito, 2)} · crédito ${pct(d.taxas.credito, 2)}`,
    },
    { chave: "ll", rotulo: "Lucro líquido", valor: d.lucroLiquido, anterior: ant((x) => x.lucroLiquido), nivel: "total" },
  ];
  const custo = (k: string) => ["desc", "imp", "cmv", "top", "fin", "tx"].includes(k) || k.startsWith("op-");

  return (
    <>
      <CabecalhoRelatorio filtro={filtro} titulo="Demonstração do resultado" exportar={[{ rotulo: "CSV", tipo: "dre" }]} />
      <div className="max-w-4xl overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-right font-medium">% fat.</th>
              {b && <th className="px-4 py-3 text-right font-medium">{b.periodo.rotulo}</th>}
              {b && <th className="px-4 py-3 text-right font-medium">Variação</th>}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave} className={cn(l.nivel === "total" && "border-t bg-muted/30 font-semibold", l.nivel === "sub" && "border-t font-medium")}>
                <td className={cn("px-4 py-2", l.nivel === "item" && "pl-8")}>
                  {l.nivel === "total" ? "= " : l.sinal ? `(${l.sinal}) ` : ""}
                  {l.rotulo}
                  {l.nota && <div className="text-xs font-normal text-muted-foreground">{l.nota}</div>}
                </td>
                <td className={cn("px-4 py-2 text-right tabular-nums", l.nivel === "total" && l.valor < 0 && "text-destructive")}>{brl(l.valor)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{d.faturamento ? pct(Math.round((l.valor / base) * 1000) / 10) : "—"}</td>
                {b && <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{l.anterior !== undefined ? brl(l.anterior) : "—"}</td>}
                {b && (
                  <td className="px-4 py-2 text-right">
                    <Variacao valor={variacao(l.valor, l.anterior)} inverter={custo(l.chave)} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 max-w-4xl list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Regime de competência: vendas pela data da venda, despesas pela data lançada (parcelas a prazo contam na data da despesa, não do pagamento).</li>
        <li>Impostos e taxas de cartão são estimativas com os percentuais de Configurações › Financeiro e › Vendas; ajuste-os ao seu regime tributário. IR/CSLL não são calculados.</li>
        {d.comprasInsumos > 0 && <li>Compras de insumos lançadas na categoria CMV ({brl(d.comprasInsumos)}) ficam fora: o custo já entra pelo CMV dos itens vendidos.</li>}
        <li>Vendas canceladas não entram ({a.canceladas.quantidade} no período, {brl(a.canceladas.valor)}).</li>
      </ul>
    </>
  );
}
