"use client";

import { useActionState } from "react";
import { login } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-9 rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.erro && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.erro}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state?.email}
          aria-invalid={!!state?.campos?.email}
          className={inputClass}
        />
        {state?.campos?.email && (
          <span className="text-xs font-normal text-destructive">{state.campos.email[0]}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Senha
        <input
          type="password"
          name="senha"
          autoComplete="current-password"
          required
          aria-invalid={!!state?.campos?.senha}
          className={inputClass}
        />
        {state?.campos?.senha && (
          <span className="text-xs font-normal text-destructive">{state.campos.senha[0]}</span>
        )}
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="manterConectado" className="size-4 accent-primary" />
        Manter conectado por 7 dias
      </label>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
