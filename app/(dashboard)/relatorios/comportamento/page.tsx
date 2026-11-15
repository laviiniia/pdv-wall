import type { Metadata } from "next";
import { CabecalhoRelatorio } from "@/components/relatorios/Cabecalho";
import { BarraFina, brl, pct, Secao, Variacao } from "@/components/relatorios/comum";
import { analisar, lerFiltro, variacao } from "@/lib/services/relatorios.service";
import { ROTULOS_FORMA } from "@/lib/vendas/calculo";

export const metadata: Metadata = { title: "Horários e pagamentos" };

// Segunda primeiro (como na especificação); índices do heatmap: 0 = domingo.
const DIAS = [
  [1, "Seg"],
  [2, "Ter"],
  [3, "Qua"],
  [4, "Qui"],
  [5, "Sex"],
  [6, "Sáb"],
  [0, "Dom"],
] as const;

export default async function ComportamentoPage({ searchParams }: PageProps<"/relatorios/comportamento">) {
  const filtro = await lerFiltro(await searchParams);
  const a = await analisar(filtro.atual);
  const b = filtro.comparado ? await analisar(filtro.comparado) : null;
  const formaAnterior = new Map(b?.formas.map((f) => [f.forma, f.receita]));

  // Só as horas com alguma venda (mais uma de folga em cada ponta), para a grade não ficar enorme.
  const horasComVenda = Array.from({ length: 24 }, (_, h) => h).filter((h) => a.heatmap.some((d) => d[h].vendas > 0));
  const horas = horasComVenda.length
    ? Array.from({ length: Math.min(23, horasComVenda.at(-1)! + 1) - Math.max(0, horasComVenda[0] - 1) + 1 }, (_, i) => Math.max(0, horasComVenda[0] - 1) + i)
    : [];
  const max = Math.max(1, ...a.heatmap.flat().map((c) => c.receita));
  const porHora = horas.map((h) => ({ h, receita: a.heatmap.reduce((s, d) => s + d[h].receita, 0) }));
  const porDiaSemana = DIAS.map(([i, r]) => ({ r, receita: a.heatmap[i].reduce((s, c) => s + c.receita, 0) }));
  const melhorHora = porHora.reduce<(typeof porHora)[number] | null>((m, x) => (!m || x.receita > m.receita ? x : m), null);
  const melhorDia = porDiaSemana.reduce<(typeof porDiaSemana)[number] | null>((m, x) => (!m || x.receita > m.receita ? x : m), null);
  const piorDia = porDiaSemana.filter((d) => d.receita > 0).reduce<(typeof porDiaSemana)[number] | null>((m, x) => (!m || x.receita < m.receita ? x : m), null);
  const maiorForma = a.formas[0]?.receita ?? 1;

  return (
    <>
      <CabecalhoRelatorio
        filtro={filtro}
        titulo="Horários e pagamentos"
        exportar={[
          { rotulo: "CSV horários", tipo: "horarios" },
          { rotulo: "CSV pagamentos", tipo: "formas" },
        ]}
      />

      <Secao titulo="Faturamento por dia da semana e hora">
        {horas.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma venda no período.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-[2px] text-xs">
                <thead>
                  <tr>
                    <th />
                    {DIAS.map(([, r]) => (
                      <th key={r} className="w-14 pb-1 font-medium text-muted-foreground">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map((h) => (
                    <tr key={h}>
                      <th className="pr-2 text-right font-normal text-muted-foreground tabular-nums">{String(h).padStart(2, "0")}h</th>
                      {DIAS.map(([i, r]) => {
                        const cel = a.heatmap[i][h];
                        const intensidade = cel.receita / max;
                        return (
                          <td
                            key={r}
                            title={`${r} ${String(h).padStart(2, "0")}h: ${brl(cel.receita)} · ${cel.vendas} venda(s)`}
                            className="h-7 rounded-[4px] bg-muted"
                            style={cel.receita > 0 ? { backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(15 + intensidade * 85)}%, var(--muted))` } : undefined}
                          >
                            <span className="sr-only">{brl(cel.receita)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Menos</span>
              {[0.15, 0.4, 0.65, 1].map((x) => (
                <span key={x} className="inline-block size-3 rounded-[3px]" style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(x * 100)}%, var(--muted))` }} />
              ))}
              <span>Mais (máx. {brl(max)} numa célula) · passe o mouse para ver o valor</span>
            </div>
            <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {melhorHora && <li>Horário que mais fatura: {String(melhorHora.h).padStart(2, "0")}h ({brl(melhorHora.receita)} no período).</li>}
              {melhorDia && <li>Dia da semana mais forte: {melhorDia.r} ({brl(melhorDia.receita)}).</li>}
              {piorDia && piorDia !== melhorDia && <li>Dia mais fraco (com venda): {piorDia.r} ({brl(piorDia.receita)}).</li>}
            </ul>
          </>
        )}
      </Secao>

      <Secao titulo="Formas de pagamento" className="mt-4">
        {a.formas.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma venda no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Forma</th>
                  <th className="pb-2 text-right font-medium">Pagamentos</th>
                  <th className="pb-2 text-right font-medium">Receita</th>
                  <th className="w-32 pb-2 pl-3 font-medium">% do total</th>
                  <th className="pb-2 text-right font-medium">Ticket médio</th>
                  {b && <th className="pb-2 text-right font-medium">vs anterior</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {a.formas.map((f) => (
                  <tr key={f.forma}>
                    <td className="py-2">{ROTULOS_FORMA[f.forma as keyof typeof ROTULOS_FORMA] ?? f.forma}</td>
                    <td className="py-2 text-right tabular-nums">{f.vendas}</td>
                    <td className="py-2 text-right tabular-nums">{brl(f.receita)}</td>
                    <td className="py-2 pl-3">
                      <div className="flex items-center gap-2">
                        <BarraFina fracao={f.receita / maiorForma} />
                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{pct(f.participacaoPct)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{brl(f.ticketMedio)}</td>
                    {b && <td className="py-2 text-right"><Variacao valor={variacao(f.receita, formaAnterior.get(f.forma) ?? 0)} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Uma venda dividida em duas formas conta um pagamento em cada; o ticket é por pagamento.</p>
      </Secao>
    </>
  );
}
