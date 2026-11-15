import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Contagem } from "@/components/estoque/Contagem";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { buscarInventario } from "@/lib/services/estoque.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventário" };

const fmt = (v: { toString(): string } | null) => (v === null ? "—" : Number(v.toString()).toLocaleString("pt-BR", { maximumFractionDigits: 3 }));

export default async function InventarioPage({ params }: PageProps<"/estoque/inventario/[id]">) {
  await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const { id } = await params;
  const inv = await buscarInventario(Number(id));
  if (!inv) notFound();
  const [estoque, empresa] = await Promise.all([getConfig("estoque"), getConfig("empresa")]);
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: empresa.funcionamento.timezone, dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/estoque/inventario" className="text-muted-foreground hover:underline">← Inventários</Link>
      </p>
      <PageHeader
        titulo={`Inventário ${inv.numero}`}
        descricao={`Iniciado em ${quando(inv.iniciadoEm)} por ${inv.realizadoPor.nome}${inv.finalizadoEm ? ` · ${inv.status === "finalizado" ? "finalizado" : "cancelado"} em ${quando(inv.finalizadoEm)}` : ""}`}
      />

      {inv.status === "em_andamento" ? (
        <Contagem
          inventarioId={inv.id}
          divergenciaMaxPct={estoque.divergenciaMaxInventarioPct}
          itens={inv.itens.map((i) => ({
            produtoId: i.produtoId,
            nome: i.produto.nome,
            sku: i.produto.sku,
            categoria: i.produto.categoria.nome,
            unidade: i.produto.unidadeMedida,
            saldoAtual: Number(i.produto.quantidadeEstoque),
            contado: i.quantidadeReal === null ? null : Number(i.quantidadeReal),
          }))}
        />
      ) : (
        <>
          {inv.status === "finalizado" && (
            <p className="mb-4 max-w-4xl rounded-md bg-primary/10 px-3 py-2 text-sm">
              {inv.itens.filter((i) => i.quantidadeReal !== null).length} produto(s) contado(s), {inv.divergencias} com divergência. Os saldos foram ajustados (movimentos do tipo “Inventário”).
            </p>
          )}
          <div className="max-w-4xl overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 text-right font-medium">Sistema</th>
                  <th className="px-4 py-3 text-right font-medium">Contado</th>
                  <th className="px-4 py-3 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {inv.itens.map((i) => {
                  const d = i.diferenca === null ? null : Number(i.diferenca);
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="px-4 py-2">{i.produto.nome}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmt(i.quantidadeSistema)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmt(i.quantidadeReal)}</td>
                      <td className={cn("px-4 py-2 text-right tabular-nums", d !== null && d !== 0 && "font-medium text-amber-700 dark:text-amber-400")}>
                        {d === null ? "não contado" : d === 0 ? "ok" : `${d > 0 ? "+" : ""}${fmt(i.diferenca)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
