import type { Metadata } from "next";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import Link from "next/link";
import { CabecalhoRelatorio } from "@/components/relatorios/Cabecalho";
import { brl, Cartao, diaCurto, pct, Secao, Variacao } from "@/components/relatorios/comum";
import { GraficoBarras } from "@/components/relatorios/Controles";
import { analisar, lerFiltro, queryDoFiltro, variacao } from "@/lib/services/relatorios.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatórios" };

export default async function VisaoGeralPage({ searchParams }: PageProps<"/relatorios">) {
  await exigirPermissao(PERMISSAO.RELATORIOS_VER);
  const filtro = await lerFiltro(await searchParams);
  const a = await analisar(filtro.atual);
  const b = filtro.comparado ? await analisar(filtro.comparado) : null;
  const qs = queryDoFiltro(filtro);
  const ultimos = a.serie.slice(-7).reverse();
  const top = a.produtos.slice(0, 5);

  const linhas: { rotulo: string; atual: string; anterior?: string; v: number | null; inverter?: boolean; pp?: boolean }[] = [
    { rotulo: "Faturamento", atual: brl(a.faturamento), anterior: b && brl(b.faturamento), v: variacao(a.faturamento, b?.faturamento) },
    { rotulo: "Nº de vendas", atual: String(a.vendas), anterior: b && String(b.vendas), v: variacao(a.vendas, b?.vendas) },
    { rotulo: "Ticket médio", atual: brl(a.ticketMedio), anterior: b && brl(b.ticketMedio), v: variacao(a.ticketMedio, b?.ticketMedio) },
    { rotulo: "Descontos concedidos", atual: brl(a.dre.descontos), anterior: b && brl(b.dre.descontos), v: variacao(a.dre.descontos, b?.dre.descontos), inverter: true },
    { rotulo: "CMV", atual: brl(a.dre.cmv), anterior: b && brl(b.dre.cmv), v: variacao(a.dre.cmv, b?.dre.cmv), inverter: true },
    { rotulo: "Despesas operacionais", atual: brl(a.dre.totalOperacionais), anterior: b && brl(b.dre.totalOperacionais), v: variacao(a.dre.totalOperacionais, b?.dre.totalOperacionais), inverter: true },
    { rotulo: "Lucro líquido", atual: brl(a.dre.lucroLiquido), anterior: b && brl(b.dre.lucroLiquido), v: variacao(a.dre.lucroLiquido, b?.dre.lucroLiquido) },
    { rotulo: "Margem líquida", atual: pct(a.margemLiquidaPct), anterior: b && pct(b.margemLiquidaPct), v: b && b.faturamento && a.faturamento ? Math.round((a.margemLiquidaPct - b.margemLiquidaPct) * 10) / 10 : null, pp: true },
    { rotulo: "Vendas canceladas", atual: `${a.canceladas.quantidade} · ${brl(a.canceladas.valor)}`, anterior: b && `${b.canceladas.quantidade} · ${brl(b.canceladas.valor)}`, v: variacao(a.canceladas.valor, b?.canceladas.valor), inverter: true },
  ].map((l) => ({ ...l, anterior: l.anterior ?? undefined }));

  return (
    <>
      <CabecalhoRelatorio filtro={filtro} titulo="Visão geral" exportar={[{ rotulo: "CSV diário", tipo: "diario" }]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao titulo="Faturamento" valor={brl(a.faturamento)}>
          <Variacao valor={variacao(a.faturamento, b?.faturamento)} />
        </Cartao>
        <Cartao titulo="Lucro líquido (estimado)" valor={brl(a.dre.lucroLiquido)}>
          <span className="flex gap-2 text-xs text-muted-foreground">
            margem {pct(a.margemLiquidaPct)} <Variacao valor={variacao(a.dre.lucroLiquido, b?.dre.lucroLiquido)} />
          </span>
        </Cartao>
        <Cartao titulo="Ticket médio" valor={brl(a.ticketMedio)}>
          <Variacao valor={variacao(a.ticketMedio, b?.ticketMedio)} />
        </Cartao>
        <Cartao titulo="Vendas" valor={String(a.vendas)}>
          <Variacao valor={variacao(a.vendas, b?.vendas)} />
        </Cartao>
      </div>

      {a.vendas === 0 && <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">Nenhuma venda finalizada neste período.</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Secao titulo="Faturamento por dia" className="lg:col-span-2">
          {a.serie.length > 1 ? (
            <GraficoBarras
              rotuloValor="Faturamento"
              pontos={a.serie.map((s) => ({ chave: s.data, rotulo: diaCurto(s.data), valor: s.receita, detalhe: `${s.vendas} venda(s)` }))}
            />
          ) : (
            <p className="text-muted-foreground">Escolha um período de mais de um dia para ver o gráfico.</p>
          )}
          {a.melhorDia && a.piorDia && a.melhorDia.data !== a.piorDia.data && (
            <p className="mt-3 text-xs text-muted-foreground">
              Melhor dia: <span className="text-foreground">{diaCurto(a.melhorDia.data)} ({brl(a.melhorDia.receita)})</span> · pior dia com venda:{" "}
              <span className="text-foreground">{diaCurto(a.piorDia.data)} ({brl(a.piorDia.receita)})</span>
            </p>
          )}
        </Secao>

        <Secao titulo="Top 5 produtos" acao={<Link href={`/relatorios/vendas?${qs}`} className="text-xs text-muted-foreground hover:underline print:hidden">ver todos</Link>}>
          {top.length === 0 ? (
            <p className="text-muted-foreground">Sem vendas.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {top.map((p, i) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{i + 1}.</span> {p.nome}
                  </span>
                  <span className="tabular-nums">{brl(p.receita)}</span>
                </li>
              ))}
            </ol>
          )}
        </Secao>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {b && (
          <Secao titulo={`Comparação com ${b.periodo.rotulo}`}>
            <table className="w-full">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Métrica</th>
                  <th className="pb-2 text-right font-medium">Atual</th>
                  <th className="pb-2 text-right font-medium">Anterior</th>
                  <th className="pb-2 text-right font-medium">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {linhas.map((l) => (
                  <tr key={l.rotulo}>
                    <td className="py-1.5">{l.rotulo}</td>
                    <td className="py-1.5 text-right tabular-nums">{l.atual}</td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">{l.anterior}</td>
                    <td className="py-1.5 text-right"><Variacao valor={l.v} inverter={l.inverter} pp={l.pp} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>
        )}

        <Secao titulo="Lucratividade por categoria">
          {a.categorias.length === 0 ? (
            <p className="text-muted-foreground">Sem vendas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...a.categorias].sort((x, y) => y.margemPct - x.margemPct).map((cat) => (
                <li key={cat.nome}>
                  <div className="flex justify-between">
                    <span>{cat.nome}</span>
                    <span className="tabular-nums">
                      {pct(cat.margemPct)} <span className="text-xs text-muted-foreground">· {brl(cat.lucro)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${Math.max(0, cat.margemPct)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Margem bruta = (receita − custo dos itens) ÷ receita.</p>
        </Secao>
      </div>

      <Secao titulo="Últimos 7 dias do período" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Dia</th>
                <th className="pb-2 text-right font-medium">Receita</th>
                <th className="pb-2 text-right font-medium">CMV + despesas</th>
                <th className="pb-2 text-right font-medium">Resultado</th>
                <th className="pb-2 text-right font-medium">Margem</th>
                <th className="pb-2 text-right font-medium">Vendas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ultimos.map((s) => (
                <tr key={s.data}>
                  <td className="py-1.5">{diaCurto(s.data)}</td>
                  <td className="py-1.5 text-right tabular-nums">{brl(s.receita)}</td>
                  <td className="py-1.5 text-right tabular-nums">{brl(s.custo + s.despesas)}</td>
                  <td className={cn("py-1.5 text-right tabular-nums", s.lucro < 0 && "text-destructive")}>{brl(s.lucro)}</td>
                  <td className="py-1.5 text-right tabular-nums">{s.receita ? pct(Math.round((s.lucro / s.receita) * 1000) / 10) : "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">{s.vendas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Resultado do dia antes de impostos e taxas de cartão; despesas contam na data lançada.</p>
      </Secao>
    </>
  );
}
