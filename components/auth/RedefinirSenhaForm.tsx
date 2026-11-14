"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { redefinir } from "@/app/(auth)/redefinir-senha/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REQUISITOS_SENHA } from "@/lib/validations/auth.schema";

const inputClass =
  "h-9 rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(redefinir, undefined);
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);

  if (state?.tokenInvalido) return <LinkInvalido />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nova senha
        <input
          type={mostrar ? "text" : "password"}
          name="senha"
          autoComplete="new-password"
          required
          autoFocus
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          aria-invalid={!!state?.campos?.senha}
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
      {state?.campos?.senha && !REQUISITOS_SENHA.some((r) => state.campos?.senha?.includes(r.texto)) && (
        <span className="-mt-2 text-xs text-destructive">{state.campos.senha[0]}</span>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Confirmar senha
        <input
          type={mostrar ? "text" : "password"}
          name="confirmacao"
          autoComplete="new-password"
          required
          aria-invalid={!!state?.campos?.confirmacao}
          className={inputClass}
        />
        {state?.campos?.confirmacao && (
          <span className="text-xs font-normal text-destructive">{state.campos.confirmacao[0]}</span>
        )}
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

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Salvando..." : "Redefinir senha"}
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
