import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnviarLinkSenha } from "@/components/admin/EnviarLinkSenha";
import { SenhaTemporaria } from "@/components/admin/SenhaTemporaria";
import { UsuarioForm } from "@/components/admin/UsuarioForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { buscarUsuario } from "@/lib/services/usuarios.service";

export const metadata: Metadata = { title: "Editar usuário" };

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function EditarUsuarioPage({ params, searchParams }: PageProps<"/admin/usuarios/[id]">) {
  const autor = await exigirPermissao(PERMISSAO.USUARIOS_GERENCIAR);
  const [{ id }, { msg }] = await Promise.all([params, searchParams]);
  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) notFound();

  const usuario = await buscarUsuario(usuarioId);
  if (!usuario) notFound();

  return (
    <>
      <PageHeader
        titulo={usuario.nome}
        descricao={[
          `Criado em ${dataHora.format(usuario.criadoEm)}${usuario.criadoPor ? ` por ${usuario.criadoPor.nome}` : ""}`,
          `Último acesso: ${usuario.ultimoLogin ? dataHora.format(usuario.ultimoLogin) : "nunca"}`,
        ].join(" · ")}
      />

      {msg === "convite-falhou" && (
        <p role="alert" className="mb-4 max-w-xl rounded-md bg-amber-500/10 px-3 py-2 text-sm">
          Usuário criado, mas o e-mail de convite não foi enviado (veja Auditoria › E-mail). Reenvie o link abaixo ou gere uma senha temporária.
        </p>
      )}

      {usuario.id === autor.id && (
        <p className="mb-4 max-w-xl rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Este é o seu usuário. Você não pode remover o seu próprio acesso de administrador.
        </p>
      )}

      <UsuarioForm
        usuario={{
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          role: usuario.role.nome,
          ativo: usuario.ativo,
          bloqueado: usuario.bloqueado,
        }}
      />

      <section className="mt-10 max-w-xl border-t pt-6">
        <h2 className="mb-1 text-sm font-semibold">Senha</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Envia ao usuário um e-mail com link para ele definir uma nova senha (válido por 1 hora).
        </p>
        <EnviarLinkSenha usuarioId={usuario.id} />
        <p className="mt-5 mb-3 text-sm text-muted-foreground">
          Sem e-mail? Gere uma senha temporária para passar pessoalmente (também desbloqueia a conta).
        </p>
        <SenhaTemporaria usuarioId={usuario.id} nome={usuario.nome} />
      </section>
    </>
  );
}
