import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AbasRelatorios } from "@/components/relatorios/Controles";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";

export default async function RelatoriosLayout({ children }: LayoutProps<"/relatorios">) {
  await exigirPermissao(PERMISSAO.RELATORIOS_VER);
  return (
    <>
      <PageHeader titulo="Relatórios" />
      <Suspense fallback={<div className="mb-4 h-10 border-b" />}>
        <AbasRelatorios />
      </Suspense>
      {children}
    </>
  );
}
