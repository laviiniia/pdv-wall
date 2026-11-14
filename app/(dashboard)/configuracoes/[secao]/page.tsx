import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/configuracoes/ConfigForm";
import { SecaoEmpresa, SecaoEstoque, SecaoFinanceiro, SecaoVendas } from "@/components/configuracoes/secoes";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { getConfig, getMetaConfig, podeEditarSecao } from "@/lib/services/configuracoes.service";
import { ehSecao, SECOES } from "@/lib/validations/configuracoes.schema";

export async function generateMetadata({ params }: PageProps<"/configuracoes/[secao]">): Promise<Metadata> {
  const { secao } = await params;
  return { title: ehSecao(secao) ? `Configurações · ${SECOES[secao].titulo}` : "Configurações" };
}

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function SecaoConfigPage({ params }: PageProps<"/configuracoes/[secao]">) {
  const { secao } = await params;
  if (!ehSecao(secao)) notFound();

  const usuario = await getUsuarioAtual();
  const [meta, conteudo] = await Promise.all([getMetaConfig(secao), renderSecao(secao)]);

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {SECOES[secao].descricao}
        {meta && (
          <>
            {" · "}Última alteração em {dataHora.format(meta.atualizadoEm)}
            {meta.alteradoPor && ` por ${meta.alteradoPor.nome}`}
          </>
        )}
      </p>
      {/* key: remonta o formulário ao trocar de aba, para não herdar estado/erros */}
      <ConfigForm key={secao} secao={secao} podeEditar={podeEditarSecao(usuario.permissoes, secao)}>
        {conteudo}
      </ConfigForm>
    </>
  );
}

async function renderSecao(secao: keyof typeof SECOES) {
  switch (secao) {
    case "empresa":
      return <SecaoEmpresa c={await getConfig("empresa")} />;
    case "vendas":
      return <SecaoVendas c={await getConfig("vendas")} />;
    case "estoque":
      return <SecaoEstoque c={await getConfig("estoque")} />;
    case "financeiro":
      return <SecaoFinanceiro c={await getConfig("financeiro")} />;
  }
}
