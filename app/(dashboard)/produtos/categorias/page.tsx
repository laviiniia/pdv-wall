import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { listarCategorias } from "@/lib/services/produtos.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Categorias" };

const MENSAGENS: Record<string, string> = {
  criada: "Categoria criada.",
  atualizada: "Categoria atualizada.",
  excluida: "Categoria excluída.",
};

export default async function CategoriasPage({ searchParams }: PageProps<"/produtos/categorias">) {
  const sp = await searchParams;
  const status = sp.status === "ativas" ? "ativas" : "todas";
  const ordenar = sp.ordenar === "produtos" ? "produtos" : "nome";

  const usuario = await exigirPermissao(PERMISSAO.PRODUTOS_VER);
  const podeGerenciar = temPermissao(usuario.permissoes, PERMISSAO.PRODUTOS_GERENCIAR);
  const categorias = await listarCategorias(status, ordenar);
  const msg = typeof sp.msg === "string" ? MENSAGENS[sp.msg] : undefined;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/produtos" className="text-muted-foreground hover:underline">
          ← Produtos
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo="Categorias" descricao={`${categorias.length} categoria(s)`} />
        {podeGerenciar && (
          <Link
            href="/produtos/categorias/nova"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="size-4" /> Nova categoria
          </Link>
        )}
      </div>

      {msg && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          {msg}
        </p>
      )}

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Mostrar
          <select name="status" defaultValue={status} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="todas">Todas</option>
            <option value="ativas">Só ativas</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ordenar por
          <select name="ordenar" defaultValue={ordenar} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="nome">Nome</option>
            <option value="produtos">Quantidade de produtos</option>
          </select>
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">
          Aplicar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 text-right font-medium">Produtos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma categoria.
                </td>
              </tr>
            )}
            {categorias.map((c) => (
              <tr key={c.id} className={cn("border-t", !c.ativa && "text-muted-foreground")}>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: c.corHex }} />
                    {c.icone && <span aria-hidden>{c.icone}</span>}
                    {c.nome}
                  </span>
                </td>
                <td className="max-w-xs truncate px-4 py-3">{c.descricao ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <Link href={`/produtos?categoria=${c.id}&status=todos`} className="hover:underline">
                    {c._count.produtos}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Selo tom={c.ativa ? "ok" : "neutro"}>{c.ativa ? "Ativa" : "Inativa"}</Selo>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/produtos/categorias/${c.id}`} className="text-sm text-primary hover:underline">
                    {podeGerenciar ? "Editar" : "Ver"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
