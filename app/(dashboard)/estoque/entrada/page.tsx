import type { Metadata } from "next";
import Link from "next/link";
import { EntradaForm } from "@/components/estoque/EntradaForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { listarFornecedores, produtosParaEstoque } from "@/lib/services/estoque.service";
import { dataNoFuso } from "@/lib/utils/data";

export const metadata: Metadata = { title: "Entrada de estoque" };

export default async function EntradaPage({ searchParams }: PageProps<"/estoque/entrada">) {
  await exigirPermissao(PERMISSAO.ESTOQUE_ENTRADA);
  const { produto } = await searchParams;
  const [produtos, fornecedores, empresa] = await Promise.all([produtosParaEstoque(), listarFornecedores(), getConfig("empresa")]);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/estoque" className="text-muted-foreground hover:underline">← Estoque</Link>
      </p>
      <PageHeader titulo="Entrada de estoque" descricao="Registre a mercadoria que chegou (compra)" />
      <EntradaForm
        produtos={produtos.map((p) => ({ id: p.id, nome: p.nome, sku: p.sku, unidadeMedida: p.unidadeMedida, precoCusto: Number(p.precoCusto), controlarEstoque: p.controlarEstoque }))}
        fornecedores={fornecedores}
        hoje={dataNoFuso(new Date(), empresa.funcionamento.timezone)}
        produtoInicial={Number(produto) || undefined}
      />
    </>
  );
}
