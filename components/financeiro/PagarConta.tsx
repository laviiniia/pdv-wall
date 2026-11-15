"use client";

import { useState, useTransition } from "react";
import { pagar } from "@/app/(dashboard)/financeiro/actions";
import { numeroParaInput } from "@/lib/utils/numero";
import { FORMAS_DESPESA } from "@/lib/validations/financeiro.schema";

const input = "h-8 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** Botão "Pagar" que abre um mini formulário na própria linha (pagamento total ou parcial). */
export function PagarConta({ contaId, restante, hoje }: { contaId: number; restante: number; hoje: string }) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="h-8 rounded-md border px-3 text-sm hover:bg-muted">
        Pagar
      </button>
    );
  }

  return (
    <form
      className="flex flex-col items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErro(null);
        startTransition(async () => {
          const r = await pagar({ contaId, ...Object.fromEntries(fd) });
          if (!r.ok) setErro(r.erro);
          else setAberto(false);
        });
      }}
    >
      <div className="flex flex-wrap justify-end gap-2">
        <input name="valor" aria-label="Valor pago" inputMode="decimal" defaultValue={numeroParaInput(restante / 100)} className={`${input} w-24 text-right tabular-nums`} />
        <input name="dataPagamento" aria-label="Data do pagamento" type="date" defaultValue={hoje} max={hoje} className={input} />
        <select name="forma" aria-label="Forma" defaultValue="pix" className={input}>
          {Object.entries(FORMAS_DESPESA).map(([v, r]) => (
            <option key={v} value={v}>{r}</option>
          ))}
        </select>
        <input name="numeroTransacao" aria-label="Nº da transação" placeholder="Nº transação (opcional)" maxLength={100} className={`${input} w-44`} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAberto(false)} className="h-8 rounded-md px-3 text-sm hover:bg-muted">Voltar</button>
        <button type="submit" disabled={pending} className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {pending ? "Registrando..." : "Confirmar pagamento"}
        </button>
      </div>
      {erro && <span role="alert" className="text-xs text-destructive">{erro}</span>}
    </form>
  );
}
