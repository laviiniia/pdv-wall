"use server";

import { revalidatePath } from "next/cache";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { redefinirComSenhaTemporaria } from "@/lib/services/usuarios.service";

export async function gerarSenhaTemporaria(usuarioId: number) {
  const autor = await exigirPermissao(PERMISSAO.USUARIOS_REDEFINIR_SENHA);
  if (!Number.isInteger(usuarioId)) return { ok: false as const, erro: "Usuário inválido." };
  const r = await redefinirComSenhaTemporaria(usuarioId, autor, await contextoRequisicao());
  if (r.ok) {
    revalidatePath("/equipe");
    revalidatePath("/admin/usuarios", "layout");
  }
  return r;
}
