"use client";

import { useState, useTransition } from "react";
import { descartarConta, descartarDespesa } from "@/app/(dashboard)/financeiro/actions";

export function BotaoCancelar({ tipo, id, descricao }: { tipo: "despesa" | "conta"; id: number; descricao: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const aviso = tipo === "despesa" ? "Cancelar a despesa (e as parcelas ainda não pagas)?" : "Cancelar esta conta a pagar?";

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`${aviso}\n\n${descricao}`)) return;
          setErro(null);
          startTransition(async () => {
            const r = tipo === "despesa" ? await descartarDespesa(id) : await descartarConta(id);
            if (!r.ok) setErro(r.erro);
          });
        }}
        className="text-xs text-muted-foreground no-underline hover:text-foreground hover:underline disabled:opacity-50"
      >
        {pending ? "..." : "Cancelar"}
      </button>
      {erro && <span role="alert" className="max-w-56 text-right text-xs text-destructive">{erro}</span>}
    </span>
  );
}
