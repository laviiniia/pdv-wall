"use client";

import { useActionState } from "react";
import { enviarLink } from "@/app/(dashboard)/admin/usuarios/actions";
import { Button } from "@/components/ui/button";

export function EnviarLinkSenha({ usuarioId }: { usuarioId: number }) {
  const [state, action, pending] = useActionState(enviarLink, undefined);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="id" value={usuarioId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link de redefinição de senha"}
      </Button>
      {state?.mensagem && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.mensagem}
        </p>
      )}
    </form>
  );
}
