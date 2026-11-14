"use client";

import Link from "next/link";
import { useActionState } from "react";
import { solicitarReset } from "@/app/(auth)/recuperar-senha/actions";
import { Button } from "@/components/ui/button";

export function RecuperarSenhaForm() {
  const [state, action, pending] = useActionState(solicitarReset, undefined);

  if (state?.enviado) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-md bg-primary/10 px-3 py-2 text-sm">
          Se <strong>{state.email}</strong> estiver cadastrado, você vai receber um link para redefinir a
          senha. O link vale por 1 hora.
        </p>
        <Link href="/login" className="text-center text-sm text-primary hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
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
          className="h-9 rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        {state?.campos?.email && (
          <span className="text-xs font-normal text-destructive">{state.campos.email[0]}</span>
        )}
      </label>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
      <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
        Cancelar
      </Link>
    </form>
  );
}
