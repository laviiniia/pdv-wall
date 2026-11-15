import type { Metadata } from "next";
import Link from "next/link";
import { History, Ticket } from "lucide-react";
import { PDV } from "@/components/pdv/PDV";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { categoriasPDV, maisVendidos, paraPDV, podeVerVendas, regrasDesconto } from "@/lib/services/vendas.service";

export const metadata: Metadata = { title: "PDV" };

export default async function VendasPage() {
  const usuario = await exigirPermissao(PERMISSAO.VENDAS_CRIAR);
  const [categorias, populares, regras, vendas, estoque] = await Promise.all([
    categoriasPDV(),
    maisVendidos(),
    regrasDesconto(usuario),
    getConfig("vendas"),
    getConfig("estoque"),
  ]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">PDV</h1>
        <div className="flex gap-2">
          {podeVerVendas(usuario) && (
            <Link href="/vendas/historico" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
              <History className="size-4" /> Vendas do dia
            </Link>
          )}
          {temPermissao(usuario.permissoes, PERMISSAO.CUPONS_GERENCIAR) && (
            <Link href="/vendas/cupons" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
              <Ticket className="size-4" /> Cupons
            </Link>
          )}
        </div>
      </div>
      <PDV
        categorias={categorias}
        maisVendidos={populares.map(paraPDV)}
        bloquearSemEstoque={!estoque.permitirEstoqueNegativo}
        limiteDescontoPct={regras.limitePct}
        aprovacaoAcimaDe={regras.exigeAprovacaoAcimaDe}
        formasAceitas={vendas.formasPagamento}
        parcelamentoMax={vendas.parcelamentoMax}
      />
    </>
  );
}
