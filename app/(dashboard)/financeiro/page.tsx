import type { Metadata } from "next";
import Link from "next/link";
import { brl, mesDoParametro, nomeMes, SeletorMes } from "@/components/financeiro/comum";
import { hojeISO, indicadoresMes, mesAnterior, resumoContas } from "@/lib/services/financeiro.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Financeiro" };

function Variacao({ atual, anterior, inverter }: { atual: number; anterior: number; inverter?: boolean }) {
  if (!anterior) return <span className="text-xs text-muted-foreground">sem base no mês anterior</span>;
  const pct = Math.round(((atual - anterior) / Math.abs(anterior)) * 1000) / 10;
  const bom = inverter ? pct <= 0 : pct >= 0;
  return (
    <span className={cn("text-xs", bom ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
      {pct > 0 ? "▲" : pct < 0 ? "▼" : "="} {Math.abs(pct).toLocaleString("pt-BR")}% vs mês anterior
    </span>
  );
}

function Card({ titulo, valor, children, destaque }: { titulo: string; valor: string; children?: React.ReactNode; destaque?: "ok" | "erro" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-4">
      <span className="text-xs text-muted-foreground">{titulo}</span>
      <span className={cn("text-xl font-semibold tabular-nums", destaque === "ok" && "text-emerald-700 dark:text-emerald-400", destaque === "erro" && "text-destructive")}>
        {valor}
      </span>
      {children}
    </div>
  );
}

export default async function PainelFinanceiroPage({ searchParams }: PageProps<"/financeiro">) {
  const sp = await searchParams;
  const mes = mesDoParametro(sp.mes, await hojeISO());
  const [atual, anterior, contas] = await Promise.all([indicadoresMes(mes), indicadoresMes(mesAnterior(mes)), resumoContas()]);
  const maiorCategoria = atual.porCategoria[0]?.valor ?? 0;

  return (
    <>
      <SeletorMes mes={mes} />
      <h2 className="mb-3 text-lg font-semibold">{nomeMes(mes)}</h2>

      {(contas.vencidas > 0 || contas.semana > 0) && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {contas.vencidas > 0 && (
            <Link href="/financeiro/contas?filtro=vencidas" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive hover:bg-destructive/15">
              {contas.vencidas} conta(s) vencida(s) · {brl(contas.totalVencido)}
            </Link>
          )}
          {contas.semana > 0 && (
            <Link href="/financeiro/contas?filtro=semana" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 hover:bg-amber-500/15">
              {contas.semana} vencendo em 7 dias · {brl(contas.totalSemana)}
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card titulo="Faturamento" valor={brl(atual.faturamento)}>
          <Variacao atual={atual.faturamento} anterior={anterior.faturamento} />
        </Card>
        <Card titulo="Custo dos produtos vendidos (CMV)" valor={brl(atual.cmv)}>
          <span className="text-xs text-muted-foreground">{atual.faturamento ? `${Math.round((atual.cmv / atual.faturamento) * 1000) / 10}% do faturamento` : "—"}</span>
        </Card>
        <Card titulo="Despesas operacionais" valor={brl(atual.despesasOperacionais)}>
          <Variacao atual={atual.despesasOperacionais} anterior={anterior.despesasOperacionais} inverter />
        </Card>
        <Card titulo="Lucro antes de impostos" valor={brl(atual.lucroLiquido)} destaque={atual.lucroLiquido >= 0 ? "ok" : "erro"}>
          <span className="text-xs text-muted-foreground">Margem {atual.margemLiquidaPct.toLocaleString("pt-BR")}%</span>
        </Card>
        <Card titulo="Vendas" valor={String(atual.vendas)}>
          <Variacao atual={atual.vendas} anterior={anterior.vendas} />
        </Card>
        <Card titulo="Ticket médio" valor={brl(atual.ticketMedio)}>
          <Variacao atual={atual.ticketMedio} anterior={anterior.ticketMedio} />
        </Card>
        <Card titulo="Lucro bruto" valor={brl(atual.lucroBruto)} />
        <Card titulo="Contas em aberto" valor={brl(contas.totalAberto)}>
          <Link href="/financeiro/contas" className="text-xs text-muted-foreground hover:underline">
            {contas.abertas} conta(s) · ver
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border p-4 text-sm">
          <h3 className="mb-3 font-semibold">Resultado do mês</h3>
          {[
            ["Faturamento", atual.faturamento, ""],
            ["(−) CMV", -atual.cmv, ""],
            ["= Lucro bruto", atual.lucroBruto, "font-medium border-t pt-2"],
            ["(−) Despesas operacionais", -atual.despesasOperacionais, ""],
            ["= Lucro antes de impostos e taxas", atual.lucroLiquido, "font-semibold border-t pt-2"],
          ].map(([r, v, cls]) => (
            <div key={r as string} className={cn("flex justify-between py-1", cls as string)}>
              <span>{r}</span>
              <span className="tabular-nums">{brl(v as number)}</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-muted-foreground">
            Impostos sobre vendas e taxas de cartão (estimados pelas Configurações) entram na{" "}
            <Link href="/relatorios/dre" className="underline">DRE em Relatórios</Link>.
          </p>
          {atual.comprasInsumos > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Compras de insumos lançadas como despesa ({brl(atual.comprasInsumos)}) não entram de novo: o custo já está no CMV, pelo preço de custo de cada item vendido.
            </p>
          )}
        </section>

        <section className="rounded-xl border p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Despesas por categoria</h3>
            <Link href={`/financeiro/despesas?mes=${mes}`} className="text-xs text-muted-foreground hover:underline">ver despesas</Link>
          </div>
          {atual.porCategoria.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma despesa lançada neste mês.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {atual.porCategoria.map((d) => (
                <li key={d.categoria}>
                  <div className="flex justify-between">
                    <Link href={`/financeiro/despesas?mes=${mes}&categoria=${encodeURIComponent(d.categoria)}`} className="hover:underline">{d.rotulo}</Link>
                    <span className="tabular-nums">{brl(d.valor)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(2, (d.valor / maiorCategoria) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
