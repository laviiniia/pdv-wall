import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProdutoForm } from "@/components/produtos/ProdutoForm";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { listarCategoriasParaSelect } from "@/lib/services/produtos.service";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NovoProdutoPage() {
  await exigirPermissao(PERMISSAO.PRODUTOS_GERENCIAR);
  const [categorias, financeiro] = await Promise.all([listarCategoriasParaSelect(), getConfig("financeiro")]);

  return (
    <>
      <PageHeader titulo="Novo produto" />
      {categorias.length === 0 ? (
        <p className="max-w-xl rounded-md bg-muted px-3 py-2 text-sm">
          Nenhuma categoria ativa. <Link href="/produtos/categorias/nova" className="text-primary hover:underline">Crie uma categoria</Link> antes de cadastrar produtos.
        </p>
      ) : (
        <ProdutoForm categorias={categorias} margemMinimaPct={financeiro.margemMinimaPct} podeEditar />
      )}
    </>
  );
}
