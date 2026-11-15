import { AbasConfig } from "@/components/configuracoes/AbasConfig";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";

const ABAS = [
  { href: "/financeiro", titulo: "Painel" },
  { href: "/financeiro/despesas", titulo: "Despesas" },
  { href: "/financeiro/contas", titulo: "Contas a pagar" },
  { href: "/financeiro/fluxo", titulo: "Fluxo de caixa" },
];

export default async function FinanceiroLayout({ children }: LayoutProps<"/financeiro">) {
  await exigirPermissao(PERMISSAO.FINANCEIRO_VER);
  return (
    <>
      <PageHeader titulo="Financeiro" />
      <AbasConfig abas={ABAS} />
      {children}
    </>
  );
}
