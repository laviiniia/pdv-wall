import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CancelarVenda } from "@/components/pdv/CancelarVenda";
import { Selo } from "@/components/produtos/Selos";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { getConfig } from "@/lib/services/configuracoes.service";
import { buscarVenda, podeCancelar } from "@/lib/services/vendas.service";
import { ROTULOS_FORMA } from "@/lib/vendas/calculo";

export const metadata: Metadata = { title: "Venda" };

const brl = (v: { toString(): string }) => Number(v.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const qtd = (v: { toString(): string }) => Number(v.toString()).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export default async function VendaPage({ params }: PageProps<"/vendas/[id]">) {
  const { id } = await params;
  const usuario = await getUsuarioAtual();
  const venda = await buscarVenda(Number(id), usuario);
  if (!venda) notFound();
  const empresa = await getConfig("empresa");
  const tz = empresa.funcionamento.timezone;
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
  const lucro = venda.itens.reduce(
    (s, i) => s + (Number(i.precoUnitario) - Number(i.precoCustoUnitario)) * Number(i.quantidade),
    -Number(venda.descontoValor),
  );

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/vendas/historico" className="text-muted-foreground hover:underline">
          ← Vendas do dia
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo={venda.numero} descricao={`${quando(venda.criadoEm)} · Operador: ${venda.operador.nome}`} />
        <Link
          href={`/cupom/${venda.id}`}
          target="_blank"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted"
        >
          <Printer className="size-4" /> Reimprimir cupom
        </Link>
      </div>

      {venda.status === "cancelada" && (
        <div className="mb-6 max-w-3xl rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <Selo tom="erro">Cancelada</Selo>{" "}
          {venda.canceladoEm && `em ${quando(venda.canceladoEm)}`} {venda.canceladoPor && `por ${venda.canceladoPor.nome}`}
          {venda.motivoCancelamento && <p className="mt-1 text-muted-foreground">Motivo: {venda.motivoCancelamento}</p>}
        </div>
      )}

      <div className="grid max-w-3xl gap-6">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 text-right font-medium">Qtd</th>
                <th className="px-4 py-3 text-right font-medium">Unitário</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/produtos/${i.produtoId}`} className="hover:underline">
                      {i.nomeProduto}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{i.sku}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {qtd(i.quantidade)} {i.unidadeMedida !== "un" && i.unidadeMedida}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(i.precoUnitario)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t text-sm">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td>
                <td className="px-4 py-2 text-right tabular-nums">{brl(venda.subtotal)}</td>
              </tr>
              {Number(venda.descontoValor) > 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">
                    Desconto {venda.cupom ? `(cupom ${venda.cupom.codigo})` : venda.descontoPercentual && `(${Number(venda.descontoPercentual).toLocaleString("pt-BR")}%)`}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">− {brl(venda.descontoValor)}</td>
                </tr>
              )}
              <tr className="font-semibold">
                <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">{brl(venda.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="rounded-xl border p-4 text-sm">
          <h2 className="mb-2 font-semibold">Pagamento</h2>
          <ul className="flex flex-col gap-1">
            {venda.pagamentos.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  {ROTULOS_FORMA[p.forma]}
                  {p.forma === "credito" && p.parcelas > 1 && ` em ${p.parcelas}x`}
                  {p.forma === "dinheiro" && p.valorRecebido && ` · recebido ${brl(p.valorRecebido)}`}
                  {p.numeroTransacao && <span className="text-muted-foreground"> · {p.numeroTransacao}</span>}
                </span>
                <span className="tabular-nums">{brl(p.valor)}</span>
              </li>
            ))}
            {venda.pagamentos.length === 0 && <li className="text-muted-foreground">Sem pagamento (desconto total)</li>}
          </ul>
          {Number(venda.troco) > 0 && <p className="mt-2">Troco: <strong>{brl(venda.troco)}</strong></p>}
          <p className="mt-3 text-muted-foreground">
            Lucro estimado: <span className="tabular-nums">{lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </p>
        </div>

        {venda.status === "finalizada" && podeCancelar(usuario, venda.operadorId) && (
          <section className="border-t pt-6">
            <CancelarVenda id={venda.id} numero={venda.numero} />
          </section>
        )}
      </div>
    </>
  );
}
