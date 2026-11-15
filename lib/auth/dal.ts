// Data Access Layer de autenticação: a verificação "de verdade" (o proxy.ts só faz a checagem otimista).
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/constants/roles";
import { lerSessao } from "./session";

type ResultadoSessao =
  | { tipo: "ok"; usuario: NonNullable<Awaited<ReturnType<typeof carregar>>> }
  | { tipo: "sem-sessao" }
  | { tipo: "invalida" };

async function carregar(id: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
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
  if (!usuario) return null;
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
    passwordAlteradaEm: usuario.passwordAlteradaEm,
    role: usuario.role,
    permissoes,
  };
}

const verificarSessao = cache(async (): Promise<ResultadoSessao> => {
  const sessao = await lerSessao();
  if (!sessao) return { tipo: "sem-sessao" };

  const usuario = await carregar(Number(sessao.sub));
  // Usuário removido, desativado ou bloqueado depois do login: derruba a sessão.
  if (!usuario || !usuario.ativo || usuario.bloqueado) return { tipo: "invalida" };
  // Senha trocada depois que esta sessão foi emitida: invalida sessões antigas (MODULO_3).
  if (usuario.passwordAlteradaEm && (sessao.iat ?? 0) < Math.floor(usuario.passwordAlteradaEm.getTime() / 1000)) {
    return { tipo: "invalida" };
  }
  return { tipo: "ok", usuario };
});

function semDadosSensiveis(u: NonNullable<Awaited<ReturnType<typeof carregar>>>) {
  const { passwordAlteradaEm: _ignorado, ...resto } = u;
  void _ignorado;
  return resto;
}

/** Usuário logado (do banco). Redireciona para /login se a sessão for inválida ou o usuário estiver inativo. */
export const getUsuarioAtual = cache(async () => {
  const r = await verificarSessao();
  if (r.tipo === "sem-sessao") redirect("/login");
  if (r.tipo === "invalida") redirect("/logout");
  return semDadosSensiveis(r.usuario);
});

/** Igual a getUsuarioAtual, mas devolve null em vez de redirecionar (para rotas de API). */
export async function usuarioAtualOuNull() {
  const r = await verificarSessao();
  return r.tipo === "ok" ? semDadosSensiveis(r.usuario) : null;
}

/** Use em páginas/actions que exigem uma permissão específica. */
export async function exigirPermissao(permissao: string) {
  const usuario = await getUsuarioAtual();
  if (!temPermissao(usuario.permissoes, permissao)) redirect("/dashboard?erro=sem-permissao");
  return usuario;
}
