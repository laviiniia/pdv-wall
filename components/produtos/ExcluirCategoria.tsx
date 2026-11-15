"use client";

import { useActionState } from "react";
import { removerCategoria } from "@/app/(dashboard)/produtos/actions";
import type { EstadoForm } from "@/components/form/Formulario";
import { Button } from "@/components/ui/button";

export function ExcluirCategoria({ id, nome, totalProdutos }: { id: number; nome: string; totalProdutos: number }) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(removerCategoria, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Excluir a categoria "${nome}"? Esta ação não pode ser desfeita.`)) e.preventDefault();
      }}
      className="flex flex-col items-start gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" disabled={pending || totalProdutos > 0}>
        {pending ? "Excluindo..." : "Excluir categoria"}
      </Button>
      {totalProdutos > 0 && (
        <p className="text-sm text-muted-foreground">
          Esta categoria tem {totalProdutos} produto(s), então não pode ser excluída. Desative-a ou mude os produtos de categoria.
        </p>
      )}
      {state?.erro && (
        <p role="alert" className="text-sm text-destructive">
          {state.erro}
        </p>
      )}
    </form>
  );
}
