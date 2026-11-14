"use client";

import Link from "next/link";
import { useActionState } from "react";
import { redefinir } from "@/app/(auth)/redefinir-senha/actions";
import { Button } from "@/components/ui/button";
import { CamposNovaSenha } from "./CamposNovaSenha";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(redefinir, undefined);

  if (state?.tokenInvalido) return <LinkInvalido />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <CamposNovaSenha erros={state?.campos} autoFocus />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Salvando..." : "Salvar senha"}
      </Button>
    </form>
  );
}

export function LinkInvalido() {
  return (
    <div className="flex flex-col gap-4">
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Este link expirou ou já foi usado.
      </p>
      <Link href="/recuperar-senha" className="text-center text-sm text-primary hover:underline">
        Solicitar um novo link
      </Link>
    </div>
  );
}
