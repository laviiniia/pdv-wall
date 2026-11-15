import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoriaForm } from "@/components/produtos/CategoriaForm";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";

export const metadata: Metadata = { title: "Nova categoria" };

export default async function NovaCategoriaPage() {
  await exigirPermissao(PERMISSAO.PRODUTOS_GERENCIAR);
  return (
    <>
      <PageHeader titulo="Nova categoria" />
      <CategoriaForm podeEditar />
    </>
  );
}
