// Data Access Layer de autenticação: a verificação "de verdade" (o proxy.ts só faz a checagem otimista).
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/constants/roles";
import { lerSessao } from "./session";

/** Usuário logado (do banco). Redireciona para /login se a sessão for inválida ou o usuário estiver inativo. */
export const getUsuarioAtual = cache(async () => {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(sessao.sub) },
    select: {
      id: true,
      nome: true,
      email: true,
      ativo: true,
      bloqueado: true,
      permissoesCustom: true,
      passwordAlteradaEm: true,
      deveTrocarSenha: true,
      role: { select: { nome: true, permissoes: true } },
    },
  });

  // Usuário removido, desativado ou bloqueado depois do login: derruba a sessão.
  if (!usuario || !usuario.ativo || usuario.bloqueado) redirect("/logout");

  // Senha trocada depois que esta sessão foi emitida: invalida sessões antigas (MODULO_3).
  if (
    usuario.passwordAlteradaEm &&
    (sessao.iat ?? 0) < Math.floor(usuario.passwordAlteradaEm.getTime() / 1000)
  ) {
    redirect("/logout");
  }

  const permissoes = [
    ...((usuario.role.permissoes as string[]) ?? []),
    ...((usuario.permissoesCustom as string[] | null) ?? []),
  ];

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    ativo: usuario.ativo,
    bloqueado: usuario.bloqueado,
    deveTrocarSenha: usuario.deveTrocarSenha,
    role: usuario.role,
    permissoes,
  };
});

/** Use em páginas/actions que exigem uma permissão específica. */
export async function exigirPermissao(permissao: string) {
  const usuario = await getUsuarioAtual();
  if (!temPermissao(usuario.permissoes, permissao)) redirect("/dashboard?erro=sem-permissao");
  return usuario;
}
