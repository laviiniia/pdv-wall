import type { Metadata } from "next";
import { UsuarioForm } from "@/components/admin/UsuarioForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";

export const metadata: Metadata = { title: "Novo usuário" };

export default async function NovoUsuarioPage() {
  await exigirPermissao(PERMISSAO.USUARIOS_GERENCIAR);

  return (
    <>
      <PageHeader titulo="Novo usuário" />
      <UsuarioForm />
    </>
  );
}
