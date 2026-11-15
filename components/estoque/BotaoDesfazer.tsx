"use client";

import { useState, useTransition } from "react";
import { desfazer } from "@/app/(dashboard)/estoque/actions";

export function BotaoDesfazer({ id, descricao }: { id: number; descricao: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const motivo = window.prompt(`Desfazer: ${descricao}\n\nMotivo do desfazimento:`);
          if (motivo === null) return;
          setErro(null);
          startTransition(async () => {
            const r = await desfazer(id, motivo);
            if (!r.ok) setErro(r.erro);
          });
        }}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
      >
        {pending ? "..." : "Desfazer"}
      </button>
      {erro && <span role="alert" className="max-w-48 text-right text-xs text-destructive">{erro}</span>}
    </span>
  );
}
