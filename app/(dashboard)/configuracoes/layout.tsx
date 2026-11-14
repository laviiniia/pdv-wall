import { AbasConfig } from "@/components/configuracoes/AbasConfig";
import { PageHeader } from "@/components/layout/PageHeader";
import { SECOES } from "@/lib/validations/configuracoes.schema";

const ABAS = Object.entries(SECOES).map(([chave, s]) => ({ href: `/configuracoes/${chave}`, titulo: s.titulo }));

export default function ConfiguracoesLayout({ children }: LayoutProps<"/configuracoes">) {
  return (
    <>
      <PageHeader titulo="Configurações" />
      <AbasConfig abas={ABAS} />
      {children}
    </>
  );
}
