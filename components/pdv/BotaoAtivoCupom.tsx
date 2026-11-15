"use client";

import { useTransition } from "react";
import { definirAtivoCupom } from "@/app/(dashboard)/vendas/actions";

export function BotaoAtivoCupom({ id, ativo }: { id: number; ativo: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", String(id));
        fd.set("ativo", String(!ativo));
        startTransition(() => definirAtivoCupom(fd));
      }}
      className="text-sm text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
    >
      {pending ? "..." : ativo ? "Desativar" : "Ativar"}
    </button>
  );
}
