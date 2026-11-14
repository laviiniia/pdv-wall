"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { contextoRequisicao as contexto } from "@/lib/auth/contexto";
import { criarSessao, encerrarSessao, lerSessao } from "@/lib/auth/session";
import { autenticar, registrarLogout } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validations/auth.schema";

export type LoginState =
  | { erro?: string; campos?: { email?: string[]; senha?: string[] }; email?: string }
  | undefined;

const MENSAGENS = {
  CREDENCIAIS_INVALIDAS: "E-mail ou senha incorretos.",
  CONTA_INATIVA: "Conta inativa ou bloqueada. Procure um administrador.",
  MUITAS_TENTATIVAS: "Muitas tentativas. Aguarde 5 minutos e tente novamente.",
} as const;

/** Só aceita caminhos internos, para evitar open redirect via ?next=https://... */
function destinoSeguro(next: FormDataEntryValue | null) {
  const valor = typeof next === "string" ? next : "";
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : "/dashboard";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    manterConectado: formData.get("manterConectado") === "on",
  });

  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { campos: z.flattenError(parsed.error).fieldErrors, email };
  }

  const resultado = await autenticar(parsed.data.email, parsed.data.senha, await contexto());
  if (!resultado.ok) {
    return { erro: MENSAGENS[resultado.erro], email };
  }

  await criarSessao(resultado.sessao, parsed.data.manterConectado);
  redirect(destinoSeguro(formData.get("next")));
}

export async function logout() {
  const sessao = await lerSessao();
  if (sessao) await registrarLogout(Number(sessao.sub), sessao.email, await contexto());
  await encerrarSessao();
  redirect("/login");
}
