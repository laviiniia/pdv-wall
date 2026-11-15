"use client";

import { useTransition } from "react";
import { definirStatusProduto } from "@/app/(dashboard)/produtos/actions";

/** Desativar (soft delete) ou reativar, com a confirmação pedida na seção 2.1.2 da doc. */
export function BotaoStatusProduto({ id, nome, ativo }: { id: number; nome: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition();

  const alternar = () => {
    if (
      ativo &&
      !window.confirm(
        `Desativar "${nome}"?\n\nEle deixa de aparecer no PDV e no cardápio digital. As vendas anteriores continuam no histórico e você pode reativá-lo depois.`,
      )
    ) {
      return;
    }
    const dados = new FormData();
    dados.set("id", String(id));
    dados.set("ativo", String(!ativo));
    startTransition(() => definirStatusProduto(dados));
  };

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pending}
      className="text-sm text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
    >
      {pending ? "..." : ativo ? "Desativar" : "Reativar"}
    </button>
  );
}
