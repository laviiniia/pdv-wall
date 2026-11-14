"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { contextoRequisicao, urlBase } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { criarUsuario, editarUsuario, enviarLinkRedefinicao } from "@/lib/services/usuarios.service";
import { criarUsuarioSchema, editarUsuarioSchema } from "@/lib/validations/usuario.schema";

type Campos = Partial<Record<"nome" | "email" | "telefone" | "role" | "senha" | "confirmacao", string[]>>;

export type UsuarioFormState =
  | {
      erro?: string;
      campos?: Campos;
      valores?: Record<string, string>;
      criado?: { id: number; nome: string; email: string; senhaTemporaria: string };
    }
  | undefined;

const ERROS: Record<string, { erro?: string; campos?: Campos }> = {
  EMAIL_EM_USO: { campos: { email: ["Já existe um usuário com este e-mail"] } },
  NAO_ENCONTRADO: { erro: "Usuário não encontrado." },
  AUTO_REBAIXAMENTO: { erro: "Você não pode remover o seu próprio acesso de administrador." },
  ULTIMO_ADMIN: { erro: "Este é o último administrador ativo. Crie ou ative outro admin antes." },
};

/** Mantém o que foi digitado (menos senhas) para repreencher o formulário em caso de erro. */
function valoresDe(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()]
      .filter(([k, v]) => typeof v === "string" && !["senha", "confirmacao"].includes(k) && !k.startsWith("$"))
      .map(([k, v]) => [k, v as string]),
  );
}

export async function criar(_prev: UsuarioFormState, formData: FormData): Promise<UsuarioFormState> {
  const autor = await exigirPermissao(PERMISSAO.USUARIOS_GERENCIAR);
  const valores = valoresDe(formData);

  const parsed = criarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    role: formData.get("role"),
    ativo: formData.get("ativo") === "on",
    modoSenha: formData.get("modoSenha"),
    senha: formData.get("senha") ?? undefined,
  });
  if (!parsed.success) return { campos: z.flattenError(parsed.error).fieldErrors as Campos, valores };

  if (parsed.data.modoSenha === "definir" && parsed.data.senha !== formData.get("confirmacao")) {
    return { campos: { confirmacao: ["As senhas não conferem"] }, valores };
  }

  const r = await criarUsuario(parsed.data, autor, await urlBase(), await contextoRequisicao());
  if (!r.ok) return { ...ERROS[r.erro], valores };

  revalidatePath("/admin/usuarios");

  // Senha temporária é mostrada uma única vez, aqui.
  if (r.senhaTemporaria) {
    return {
      criado: { id: r.id, nome: parsed.data.nome, email: parsed.data.email, senhaTemporaria: r.senhaTemporaria },
    };
  }
  redirect(`/admin/usuarios?msg=${parsed.data.modoSenha === "link" ? "convite" : "criado"}`);
}

export async function editar(_prev: UsuarioFormState, formData: FormData): Promise<UsuarioFormState> {
  const autor = await exigirPermissao(PERMISSAO.USUARIOS_GERENCIAR);
  const valores = valoresDe(formData);

  const parsed = editarUsuarioSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    role: formData.get("role"),
    ativo: formData.get("ativo") === "on",
    bloqueado: formData.get("bloqueado") === "on",
  });
  if (!parsed.success) return { campos: z.flattenError(parsed.error).fieldErrors as Campos, valores };

  const r = await editarUsuario(parsed.data, autor, await contextoRequisicao());
  if (!r.ok) return { ...ERROS[r.erro], valores };

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?msg=atualizado");
}

export type LinkState = { mensagem?: string } | undefined;

export async function enviarLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const autor = await exigirPermissao(PERMISSAO.USUARIOS_GERENCIAR);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { mensagem: "Usuário inválido." };

  await enviarLinkRedefinicao(id, autor, await urlBase(), await contextoRequisicao());
  return {
    mensagem: "Se o usuário estiver ativo, ele vai receber o link por e-mail (máximo de 1 envio a cada 5 minutos).",
  };
}
