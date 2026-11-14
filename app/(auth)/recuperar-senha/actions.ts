"use server";

import { z } from "zod";
import { contextoRequisicao, urlBase } from "@/lib/auth/contexto";
import { solicitarResetSenha } from "@/lib/services/senha.service";
import { recuperarSenhaSchema } from "@/lib/validations/auth.schema";

export type RecuperarState =
  | { enviado?: boolean; email?: string; erro?: string; campos?: { email?: string[] } }
  | undefined;

export async function solicitarReset(_prev: RecuperarState, formData: FormData): Promise<RecuperarState> {
  const parsed = recuperarSenhaSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { campos: z.flattenError(parsed.error).fieldErrors, email: String(formData.get("email") ?? "") };
  }

  try {
    await solicitarResetSenha(parsed.data.email, await urlBase(), await contextoRequisicao());
  } catch (error) {
    console.error("[recuperar-senha] falha ao processar solicitação", error);
    return { erro: "Não foi possível enviar o e-mail agora. Tente novamente em instantes.", email: parsed.data.email };
  }

  // Mesma resposta exista ou não o e-mail (não revela quem é cadastrado).
  return { enviado: true, email: parsed.data.email };
}
