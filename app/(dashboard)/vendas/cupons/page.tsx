import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BotaoAtivoCupom } from "@/components/pdv/BotaoAtivoCupom";
import { Selo } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { listarCupons } from "@/lib/services/vendas.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cupons" };

const brl = (v: { toString(): string }) => Number(v.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (d: Date) => d.toLocaleDateString("pt-BR");

export default async function CuponsPage({ searchParams }: PageProps<"/vendas/cupons">) {
  await exigirPermissao(PERMISSAO.CUPONS_GERENCIAR);
  const { msg } = await searchParams;
  const cupons = await listarCupons();
  const agora = new Date();

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/vendas" className="text-muted-foreground hover:underline">
          ← PDV
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo="Cupons promocionais" descricao={`${cupons.length} cupom(ns)`} />
        <Link
          href="/vendas/cupons/novo"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="size-4" /> Novo cupom
        </Link>
      </div>
      {msg === "criado" && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          Cupom criado.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
              <th className="px-4 py-3 font-medium">Compra mínima</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 text-right font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {cupons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
            {cupons.map((c) => {
              const esgotado = c.usosMaximos !== null && c.usosAtuais >= c.usosMaximos;
              const situacao = !c.ativo
                ? { tom: "neutro" as const, texto: "Inativo" }
                : agora > c.expiracao
                  ? { tom: "neutro" as const, texto: "Expirado" }
                  : agora < c.inicio
                    ? { tom: "aviso" as const, texto: "Agendado" }
                    : esgotado
                      ? { tom: "aviso" as const, texto: "Esgotado" }
                      : { tom: "ok" as const, texto: "Válido" };
              return (
                <tr key={c.id} className={cn("border-t", situacao.tom !== "ok" && "text-muted-foreground")}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-foreground">{c.codigo}</span>
                    {c.descricao && <span className="block text-xs text-muted-foreground">{c.descricao}</span>}
                  </td>
                  <td className="px-4 py-3">{c.tipo === "percentual" ? `${Number(c.valor).toLocaleString("pt-BR")}%` : brl(c.valor)}</td>
                  <td className="px-4 py-3">{Number(c.valorMinimo) > 0 ? brl(c.valorMinimo) : "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {data(c.inicio)} a {data(c.expiracao)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.usosAtuais}
                    {c.usosMaximos !== null && ` / ${c.usosMaximos}`}
                  </td>
                  <td className="px-4 py-3">
                    <Selo tom={situacao.tom}>{situacao.texto}</Selo>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BotaoAtivoCupom id={c.id} ativo={c.ativo} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
