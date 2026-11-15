import type { Metadata } from "next";
import Link from "next/link";
import { novoInventario } from "@/app/(dashboard)/estoque/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { Button } from "@/components/ui/button";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { listarInventarios } from "@/lib/services/estoque.service";
import { listarCategoriasParaSelect } from "@/lib/services/produtos.service";

export const metadata: Metadata = { title: "Inventário" };

const STATUS = { em_andamento: ["aviso", "Em andamento"], finalizado: ["ok", "Finalizado"], cancelado: ["neutro", "Cancelado"] } as const;

export default async function InventariosPage({ searchParams }: PageProps<"/estoque/inventario">) {
  await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const { erro } = await searchParams;
  const [inventarios, categorias, estoque, empresa] = await Promise.all([
    listarInventarios(),
    listarCategoriasParaSelect(),
    getConfig("estoque"),
    getConfig("empresa"),
  ]);
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: empresa.funcionamento.timezone, dateStyle: "short", timeStyle: "short" });
  const emAndamento = inventarios.find((i) => i.status === "em_andamento");

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/estoque" className="text-muted-foreground hover:underline">← Estoque</Link>
      </p>
      <PageHeader titulo="Inventário" descricao={`Contagem física · frequência recomendada: ${estoque.frequenciaInventario} · divergência aceitável: ${estoque.divergenciaMaxInventarioPct}%`} />
      {typeof erro === "string" && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}

      {emAndamento ? (
        <p className="mb-6 max-w-xl rounded-md bg-amber-500/10 px-3 py-2 text-sm">
          Há um inventário em andamento: <Link href={`/estoque/inventario/${emAndamento.id}`} className="font-medium text-primary hover:underline">{emAndamento.numero}</Link>.
        </p>
      ) : (
        <form action={novoInventario} className="mb-8 flex max-w-xl flex-wrap items-end gap-3 rounded-xl border p-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Contar
            <select name="categoriaId" className="h-9 rounded-md border bg-background px-3 text-sm font-normal">
              <option value="">Todo o estoque</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>Só {c.nome}</option>
              ))}
            </select>
          </label>
          <Button type="submit" size="lg">Iniciar inventário</Button>
          <p className="w-full text-xs text-muted-foreground">As vendas continuam normalmente; ao finalizar, o saldo de cada produto contado passa a ser o valor contado.</p>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Inventário</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 text-right font-medium">Produtos</th>
              <th className="px-4 py-3 text-right font-medium">Divergências</th>
              <th className="px-4 py-3 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {inventarios.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum inventário ainda.</td></tr>}
            {inventarios.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-3"><Link href={`/estoque/inventario/${i.id}`} className="font-mono text-xs hover:underline">{i.numero}</Link></td>
                <td className="px-4 py-3 text-xs">{quando(i.iniciadoEm)}</td>
                <td className="px-4 py-3">{i.realizadoPor.nome}</td>
                <td className="px-4 py-3 text-right tabular-nums">{i.totalProdutos}</td>
                <td className="px-4 py-3 text-right tabular-nums">{i.status === "finalizado" ? i.divergencias : "—"}</td>
                <td className="px-4 py-3"><Selo tom={STATUS[i.status][0]}>{STATUS[i.status][1]}</Selo></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
