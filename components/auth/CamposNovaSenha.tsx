"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { REQUISITOS_SENHA } from "@/lib/validations/auth.schema";

export const inputClass =
  "h-9 rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

/** Nova senha + confirmação, com checklist de requisitos ao vivo e "mostrar senhas". */
export function CamposNovaSenha({
  erros,
  rotulo = "Nova senha",
  autoFocus,
}: {
  erros?: { senha?: string[]; confirmacao?: string[] };
  rotulo?: string;
  autoFocus?: boolean;
}) {
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  // Erros de requisito já aparecem no checklist; os demais (ex.: "igual à atual") viram texto.
  const outroErro = erros?.senha?.find((e) => !REQUISITOS_SENHA.some((r) => r.texto === e));

  return (
    <>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {rotulo}
        <input
          type={mostrar ? "text" : "password"}
          name="senha"
          autoComplete="new-password"
          required
          autoFocus={autoFocus}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          aria-invalid={!!erros?.senha}
          className={inputClass}
        />
      </label>

      <ul className="flex flex-col gap-1 text-xs" aria-label="Requisitos da senha">
        {REQUISITOS_SENHA.map((r) => {
          const ok = r.teste(senha);
          return (
            <li key={r.id} className={cn("flex items-center gap-1.5", ok ? "text-foreground" : "text-muted-foreground")}>
              {ok ? <Check className="size-3.5 text-primary" /> : <X className="size-3.5" />}
              {r.texto}
            </li>
          );
        })}
      </ul>
      {outroErro && <span className="-mt-2 text-xs text-destructive">{outroErro}</span>}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Confirmar senha
        <input
          type={mostrar ? "text" : "password"}
          name="confirmacao"
          autoComplete="new-password"
          required
          aria-invalid={!!erros?.confirmacao}
          className={inputClass}
        />
        {erros?.confirmacao && <span className="text-xs font-normal text-destructive">{erros.confirmacao[0]}</span>}
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={mostrar}
          onChange={(e) => setMostrar(e.target.checked)}
          className="size-4 accent-primary"
        />
        Mostrar senhas
      </label>
    </>
  );
}
