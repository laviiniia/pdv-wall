import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoriaForm } from "@/components/produtos/CategoriaForm";
import { ExcluirCategoria } from "@/components/produtos/ExcluirCategoria";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { buscarCategoria } from "@/lib/services/produtos.service";

export const metadata: Metadata = { title: "Categoria" };

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function CategoriaPage({ params }: PageProps<"/produtos/categorias/[id]">) {
  const { id } = await params;
  const categoriaId = Number(id);
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) notFound();

  const usuario = await getUsuarioAtual();
  const categoria = await buscarCategoria(categoriaId);
  if (!categoria) notFound();
  const podeGerenciar = temPermissao(usuario.permissoes, PERMISSAO.PRODUTOS_GERENCIAR);

  return (
    <>
      <PageHeader
        titulo={categoria.nome}
        descricao={[
          `${categoria._count.produtos} produto(s)`,
          `Criada em ${dataHora.format(categoria.criadoEm)} por ${categoria.criadoPor.nome}`,
          ...(categoria.editadoPor ? [`Editada em ${dataHora.format(categoria.editadoEm)} por ${categoria.editadoPor.nome}`] : []),
        ].join(" · ")}
      />
      <CategoriaForm categoria={categoria} podeEditar={podeGerenciar} />
      {podeGerenciar && (
        <section className="mt-10 max-w-xl border-t pt-6">
          <h2 className="mb-3 text-sm font-semibold">Excluir</h2>
          <ExcluirCategoria id={categoria.id} nome={categoria.nome} totalProdutos={categoria._count.produtos} />
        </section>
      )}
    </>
  );
}
