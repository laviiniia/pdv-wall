import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { formatarMoeda } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Produtos" };

// Módulo 2.1 — por enquanto só leitura. CRUD completo: docs/modulos/MODULO_2_1_GESTAO_PRODUTOS.md
export default async function ProdutosPage() {
  await connection(); // dados sempre atuais (sem prerender no build)
  const produtos = await prisma.produto.findMany({
    include: { categoria: true },
    orderBy: [{ categoria: { nome: "asc" } }, { nome: "asc" }],
  });

  return (
    <>
      <PageHeader titulo="Produtos" descricao={`${produtos.length} produtos cadastrados`} />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 text-right font-medium">Custo</th>
              <th className="px-4 py-3 text-right font-medium">Venda</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: p.categoria.corHex }} />
                    {p.categoria.nome}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(p.precoCusto)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(p.precoVenda)}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
