"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { criarSessao } from "@/lib/auth/session";
import type { RoleNome } from "@/lib/constants/roles";
import { trocarSenha } from "@/lib/services/senha.service";
import { senhaForteSchema } from "@/lib/validations/auth.schema";

const schema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    senha: senhaForteSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, { message: "As senhas não conferem", path: ["confirmacao"] });

export type TrocarSenhaState =
  | { campos?: { senhaAtual?: string[]; senha?: string[]; confirmacao?: string[] } }
  | undefined;

export async function trocar(_prev: TrocarSenhaState, formData: FormData): Promise<TrocarSenhaState> {
  const usuario = await getUsuarioAtual();

  const parsed = schema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) return { campos: z.flattenError(parsed.error).fieldErrors };

  const r = await trocarSenha(usuario.id, parsed.data.senhaAtual, parsed.data.senha, await contextoRequisicao());
  if (!r.ok) {
    return r.erro === "SENHA_ATUAL_INCORRETA"
      ? { campos: { senhaAtual: ["Senha atual incorreta"] } }
      : { campos: { senha: ["A nova senha deve ser diferente da atual"] } };
  }

  // A troca invalida sessões anteriores; emite uma nova para quem acabou de trocar.
  await criarSessao(
    { sub: String(usuario.id), email: usuario.email, nome: usuario.nome, role: usuario.role.nome as RoleNome },
    false,
  );
  redirect("/dashboard?senha=alterada");
}
