import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { podeVerVendas, vendasDoDia } from "@/lib/services/vendas.service";
import { cn } from "@/lib/utils";
import { ROTULOS_FORMA, type FormaPagamento } from "@/lib/vendas/calculo";

export const metadata: Metadata = { title: "Vendas do dia" };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function HistoricoPage({ searchParams }: PageProps<"/vendas/historico">) {
  const usuario = await getUsuarioAtual();
  if (!podeVerVendas(usuario)) redirect("/dashboard?erro=sem-permissao");

  const { dia } = await searchParams;
  const diaValido = typeof dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : undefined;
  const [{ dia: diaRef, vendas, resumo }, empresa] = await Promise.all([vendasDoDia(usuario, diaValido), getConfig("empresa")]);
  const tz = empresa.funcionamento.timezone;
  const todas = temPermissao(usuario.permissoes, PERMISSAO.VENDAS_VER);
  const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  const diaBR = diaRef.split("-").reverse().join("/");

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/vendas" className="text-muted-foreground hover:underline">
          ← PDV
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo="Vendas do dia" descricao={`${diaBR} · ${todas ? "todas as vendas" : "suas vendas"}`} />
        <form className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Dia
            <input type="date" name="dia" defaultValue={diaRef} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground" />
          </label>
          <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">
            Ver
          </button>
        </form>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { rotulo: "Total vendido", valor: brl(resumo.total) },
          { rotulo: "Vendas", valor: String(resumo.quantidade) + (resumo.canceladas ? ` (+${resumo.canceladas} canc.)` : "") },
          { rotulo: "Ticket médio", valor: brl(resumo.ticketMedio) },
          {
            rotulo: "Por forma de pagamento",
            valor:
              Object.entries(resumo.porForma)
                .map(([f, v]) => `${ROTULOS_FORMA[f as FormaPagamento]} ${brl(v)}`)
                .join(" · ") || "—",
            pequeno: true,
          },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.rotulo}</p>
            <p className={cn("mt-1 font-semibold tabular-nums", c.pequeno ? "text-sm" : "text-2xl")}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Venda</th>
              {todas && <th className="px-4 py-3 font-medium">Operador</th>}
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 text-right font-medium">Itens</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {vendas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma venda neste dia.
                </td>
              </tr>
            )}
            {vendas.map((v) => (
              <tr key={v.id} className={cn("border-t", v.status === "cancelada" && "text-muted-foreground")}>
                <td className="px-4 py-3 tabular-nums">{hora(v.criadoEm)}</td>
                <td className="px-4 py-3">
                  <Link href={`/vendas/${v.id}`} className="font-mono text-xs text-foreground hover:underline">
                    {v.numero}
                  </Link>
                  {v.status === "cancelada" && (
                    <span className="ml-2">
                      <Selo tom="erro">Cancelada</Selo>
                    </span>
                  )}
                </td>
                {todas && <td className="px-4 py-3">{v.operador.nome}</td>}
                <td className="px-4 py-3">{[...new Set(v.pagamentos.map((p) => ROTULOS_FORMA[p.forma]))].join(" + ") || "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{v._count.itens}</td>
                <td className={cn("px-4 py-3 text-right font-medium tabular-nums", v.status === "cancelada" && "line-through")}>
                  {brl(Math.round(Number(v.total) * 100))}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/vendas/${v.id}`} className="text-sm text-primary hover:underline">
                    Detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
