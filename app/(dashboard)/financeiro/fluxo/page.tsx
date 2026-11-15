import type { Metadata } from "next";
import { brl, mesDoParametro, nomeMes, SeletorMes } from "@/components/financeiro/comum";
import { fluxoCaixaMes, hojeISO } from "@/lib/services/financeiro.service";
import { cn } from "@/lib/utils";
import { ROTULOS_FORMA } from "@/lib/vendas/calculo";

export const metadata: Metadata = { title: "Fluxo de caixa" };

const diaSemana = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

export default async function FluxoPage({ searchParams }: PageProps<"/financeiro/fluxo">) {
  const sp = await searchParams;
  const mes = mesDoParametro(sp.mes, await hojeISO());
  const f = await fluxoCaixaMes(mes);
  const resultado = f.totalEntradas - f.totalSaidas;

  return (
    <>
      <SeletorMes mes={mes} />
      <h2 className="mb-1 text-lg font-semibold">{nomeMes(mes)}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Regime de caixa: entradas são os recebimentos das vendas; saídas são despesas pagas na hora e pagamentos de contas, no dia em que o dinheiro saiu.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Entradas</p>
          <p className="text-xl font-semibold tabular-nums">{brl(f.totalEntradas)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Saídas</p>
          <p className="text-xl font-semibold tabular-nums">{brl(f.totalSaidas)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Resultado</p>
          <p className={cn("text-xl font-semibold tabular-nums", resultado >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>{brl(resultado)}</p>
          {f.melhor && f.pior && f.linhas.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Melhor dia {diaSemana(f.melhor.data)} · pior {diaSemana(f.pior.data)}
            </p>
          )}
        </div>
      </div>

      {f.linhas.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">Nenhuma movimentação neste mês.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Dia</th>
                <th className="px-4 py-3 text-right font-medium">Entradas</th>
                <th className="px-4 py-3 font-medium">Por forma</th>
                <th className="px-4 py-3 text-right font-medium">Saídas</th>
                <th className="px-4 py-3 text-right font-medium">Resultado</th>
                <th className="px-4 py-3 text-right font-medium">Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {f.linhas.map((l) => (
                <tr key={l.data} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 whitespace-nowrap capitalize">{diaSemana(l.data)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{brl(l.entradas)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {Object.entries(l.porForma)
                      .map(([forma, v]) => `${ROTULOS_FORMA[forma as keyof typeof ROTULOS_FORMA] ?? forma} ${brl(v)}`)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{l.saidas ? brl(l.saidas) : "—"}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", l.resultado < 0 && "text-destructive")}>{brl(l.resultado)}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", l.acumulado < 0 && "text-destructive")}>{brl(l.acumulado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
