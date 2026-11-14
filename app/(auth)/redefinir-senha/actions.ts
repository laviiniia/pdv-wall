"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { encerrarSessao } from "@/lib/auth/session";
import { redefinirSenha } from "@/lib/services/senha.service";
import { redefinirSenhaSchema } from "@/lib/validations/auth.schema";

export type RedefinirState =
  | { erro?: string; tokenInvalido?: boolean; campos?: { senha?: string[]; confirmacao?: string[] } }
  | undefined;

export async function redefinir(_prev: RedefinirState, formData: FormData): Promise<RedefinirState> {
  const parsed = redefinirSenhaSchema.safeParse({
    token: formData.get("token"),
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) {
    const campos = z.flattenError(parsed.error).fieldErrors;
    return { campos: { senha: campos.senha, confirmacao: campos.confirmacao } };
  }

  const resultado = await redefinirSenha(parsed.data.token, parsed.data.senha, await contextoRequisicao());
  if (!resultado.ok) {
    return resultado.erro === "SENHA_IGUAL"
      ? { campos: { senha: ["A nova senha deve ser diferente da atual"] } }
      : { tokenInvalido: true, erro: "Link expirado ou inválido." };
  }

  await encerrarSessao();
  redirect("/login?senha=redefinida");
}
