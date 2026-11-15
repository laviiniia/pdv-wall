import type { Metadata } from "next";
import Link from "next/link";
import { SaidaForm } from "@/components/estoque/SaidaForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { produtosParaEstoque } from "@/lib/services/estoque.service";

export const metadata: Metadata = { title: "Saída de estoque" };

export default async function SaidaPage({ searchParams }: PageProps<"/estoque/saida">) {
  await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const { produto } = await searchParams;
  const produtos = (await produtosParaEstoque()).filter((p) => p.controlarEstoque);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/estoque" className="text-muted-foreground hover:underline">← Estoque</Link>
      </p>
      <PageHeader titulo="Saída / ajuste de estoque" descricao="Devolução, dano, perda ou correção de contagem. Vendas dão baixa sozinhas." />
      {produtos.length === 0 ? (
        <p className="max-w-xl rounded-md bg-muted px-3 py-2 text-sm">Nenhum produto com controle de estoque ainda.</p>
      ) : (
        <SaidaForm
          produtos={produtos.map((p) => ({ id: p.id, nome: p.nome, sku: p.sku, unidadeMedida: p.unidadeMedida, quantidade: Number(p.quantidadeEstoque) }))}
          produtoInicial={Number(produto) || undefined}
        />
      )}
    </>
  );
}
