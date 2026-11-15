import type { Metadata } from "next";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import Link from "next/link";
import { CabecalhoRelatorio } from "@/components/relatorios/Cabecalho";
import { BarraFina, brl, num, pct, Secao, Variacao } from "@/components/relatorios/comum";
import { analisar, lerFiltro, queryDoFiltro, variacao } from "@/lib/services/relatorios.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Produtos e categorias" };

const ORDENS = { receita: "Receita", lucro: "Lucro", quantidade: "Quantidade", margem: "Margem" } as const;
type Ordem = keyof typeof ORDENS;

export default async function VendasRelatorioPage({ searchParams }: PageProps<"/relatorios/vendas">) {
  await exigirPermissao(PERMISSAO.RELATORIOS_VER);
  const sp = await searchParams;
  const filtro = await lerFiltro(sp);
  const ordem: Ordem = typeof sp.ordem === "string" && sp.ordem in ORDENS ? (sp.ordem as Ordem) : "receita";
  const a = await analisar(filtro.atual);
  const b = filtro.comparado ? await analisar(filtro.comparado) : null;
  const catAnterior = new Map(b?.categorias.map((x) => [x.nome, x.receita]));
  const prodAnterior = new Map(b?.produtos.map((x) => [x.id, x.receita]));
  const chave = { receita: "receita", lucro: "lucro", quantidade: "quantidade", margem: "margemPct" } as const;
  const produtos = [...a.produtos].sort((x, y) => y[chave[ordem]] - x[chave[ordem]]);
  const maiorCat = a.categorias[0]?.receita ?? 1;
  const top10 = a.produtos.slice(0, 10).reduce((s, p) => s + p.receita, 0);
  const qs = queryDoFiltro(filtro);

  return (
    <>
      <CabecalhoRelatorio
        filtro={filtro}
        titulo="Produtos e categorias"
        exportar={[
          { rotulo: "CSV categorias", tipo: "categorias" },
          { rotulo: "CSV produtos", tipo: "produtos" },
        ]}
      />

      <Secao titulo="Por categoria">
        {a.categorias.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma venda no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 text-right font-medium">Receita</th>
                  <th className="w-32 pb-2 pl-3 font-medium">% do total</th>
                  <th className="pb-2 text-right font-medium">Custo</th>
                  <th className="pb-2 text-right font-medium">Lucro bruto</th>
                  <th className="pb-2 text-right font-medium">Margem</th>
                  {b && <th className="pb-2 text-right font-medium">vs anterior</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {a.categorias.map((cat) => (
                  <tr key={cat.nome}>
                    <td className="py-2">{cat.nome}</td>
                    <td className="py-2 text-right tabular-nums">{brl(cat.receita)}</td>
                    <td className="py-2 pl-3">
                      <div className="flex items-center gap-2">
                        <BarraFina fracao={cat.receita / maiorCat} />
                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{pct(cat.participacaoPct)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{brl(cat.custo)}</td>
                    <td className="py-2 text-right tabular-nums">{brl(cat.lucro)}</td>
                    <td className="py-2 text-right tabular-nums">{pct(cat.margemPct)}</td>
                    {b && <td className="py-2 text-right"><Variacao valor={variacao(cat.receita, catAnterior.get(cat.nome) ?? 0)} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      <Secao
        titulo={`Por produto (${a.produtos.length})`}
        className="mt-4"
        acao={
          <nav className="flex gap-1 text-xs print:hidden" aria-label="Ordenar por">
            {Object.entries(ORDENS).map(([k, r]) => (
              <Link
                key={k}
                href={`/relatorios/vendas?${qs}&ordem=${k}`}
                aria-current={k === ordem ? "true" : undefined}
                className={cn("rounded-full border px-2.5 py-1", k === ordem ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {r}
              </Link>
            ))}
          </nav>
        }
      >
        {a.produtos.length > 10 && a.faturamento > 0 && (
          <p className="mb-2 text-xs text-muted-foreground">Os 10 produtos que mais faturaram somam {pct(Math.round((top10 / a.faturamento) * 1000) / 10)} da receita.</p>
        )}
        {produtos.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma venda no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Produto</th>
                  <th className="pb-2 text-right font-medium">Qtd.</th>
                  <th className="pb-2 text-right font-medium">Receita</th>
                  <th className="pb-2 text-right font-medium">Custo</th>
                  <th className="pb-2 text-right font-medium">Lucro</th>
                  <th className="pb-2 text-right font-medium">Margem</th>
                  <th className="pb-2 text-right font-medium">% total</th>
                  {b && <th className="pb-2 text-right font-medium">vs anterior</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {produtos.map((p, i) => (
                  <tr key={p.id}>
                    <td className="py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="py-2">
                      {p.nome}
                      <div className="text-xs text-muted-foreground">{p.categoria}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{num(p.quantidade)}</td>
                    <td className="py-2 text-right tabular-nums">{brl(p.receita)}</td>
                    <td className="py-2 text-right tabular-nums">{brl(p.custo)}</td>
                    <td className="py-2 text-right tabular-nums">{brl(p.lucro)}</td>
                    <td className="py-2 text-right tabular-nums">{pct(p.margemPct)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{pct(p.participacaoPct)}</td>
                    {b && <td className="py-2 text-right"><Variacao valor={variacao(p.receita, prodAnterior.get(p.id) ?? 0)} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Receita por item já com o desconto da venda rateado; custo = preço de custo gravado na hora da venda.</p>
      </Secao>
    </>
  );
}
