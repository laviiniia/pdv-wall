"use client";

import { useActionState } from "react";
import { trocar } from "@/app/trocar-senha/actions";
import { Button } from "@/components/ui/button";
import { CamposNovaSenha, inputClass } from "./CamposNovaSenha";

export function TrocarSenhaForm() {
  const [state, action, pending] = useActionState(trocar, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Senha atual
        <input
          type="password"
          name="senhaAtual"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={!!state?.campos?.senhaAtual}
          className={inputClass}
        />
        {state?.campos?.senhaAtual && (
          <span className="text-xs font-normal text-destructive">{state.campos.senhaAtual[0]}</span>
        )}
      </label>
      <CamposNovaSenha erros={state?.campos} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
