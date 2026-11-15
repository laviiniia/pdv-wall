import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus, Tags } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BotaoStatusProduto } from "@/components/produtos/BotaoStatusProduto";
import { Selo, SeloValidade } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { listarCategoriasParaSelect, listarProdutos, ORDENACOES, type Ordenacao } from "@/lib/services/produtos.service";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/utils/format";
import { calcularMargem, situacaoValidade } from "@/lib/validations/produto.schema";

export const metadata: Metadata = { title: "Produtos" };

const MENSAGENS: Record<string, string> = { criado: "Produto cadastrado." };

export default async function ProdutosPage({ searchParams }: PageProps<"/produtos">) {
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const busca = param("busca")?.trim() || undefined;
  const categoriaId = Number(param("categoria")) || undefined;
  const status = (["ativos", "inativos", "todos"] as const).find((s) => s === param("status")) ?? "ativos";
  const ordenar = (Object.keys(ORDENACOES) as Ordenacao[]).find((o) => o === param("ordenar")) ?? "nome";
  const pagina = Math.max(1, Number(param("pagina")) || 1);

  const usuario = await exigirPermissao(PERMISSAO.PRODUTOS_VER);
  const podeGerenciar = temPermissao(usuario.permissoes, PERMISSAO.PRODUTOS_GERENCIAR);
  const [resultado, categorias, financeiro, estoque] = await Promise.all([
    listarProdutos({ busca, categoriaId, status, ordenar, pagina }),
    listarCategoriasParaSelect(),
    getConfig("financeiro"),
    getConfig("estoque"),
  ]);
  const { produtos, total, totalPaginas } = resultado;
  const filtrando = !!(busca || categoriaId || status !== "ativos");

  const urlPagina = (p: number) => {
    const q = new URLSearchParams();
    if (busca) q.set("busca", busca);
    if (categoriaId) q.set("categoria", String(categoriaId));
    if (status !== "ativos") q.set("status", status);
    if (ordenar !== "nome") q.set("ordenar", ordenar);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return s ? `/produtos?${s}` : "/produtos";
  };

  const msg = param("msg");
  const destaque = Number(param("destaque")) || undefined;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo="Produtos" descricao={`${total} produto(s) ${filtrando ? "encontrado(s)" : "ativo(s)"}`} />
        <div className="flex gap-2">
          <Link
            href="/produtos/categorias"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
          >
            <Tags className="size-4" /> Categorias
          </Link>
          {podeGerenciar && (
            <Link
              href="/produtos/novo"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              <Plus className="size-4" /> Novo produto
            </Link>
          )}
        </div>
      </div>

      {msg && MENSAGENS[msg] && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          {MENSAGENS[msg]}
        </p>
      )}

      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Buscar
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Nome ou SKU"
            className="h-8 w-56 rounded-md border bg-background px-2.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Categoria
          <select name="categoria" defaultValue={categoriaId ?? ""} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icone ? `${c.icone} ` : ""}
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          <select name="status" defaultValue={status} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ordenar por
          <select name="ordenar" defaultValue={ordenar} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            {Object.entries(ORDENACOES).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">
          Filtrar
        </button>
        {filtrando && (
          <Link href="/produtos" className="h-8 px-2 text-sm leading-8 text-muted-foreground hover:underline">
            Limpar
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 text-right font-medium">Custo</th>
              <th className="px-4 py-3 text-right font-medium">Venda</th>
              <th className="px-4 py-3 text-right font-medium">Margem</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {filtrando ? "Nenhum produto encontrado com esses filtros." : "Nenhum produto cadastrado ainda."}
                </td>
              </tr>
            )}
            {produtos.map((p) => {
              const { margem, percentual } = calcularMargem(Number(p.precoCusto), Number(p.precoVenda));
              const validade = situacaoValidade(p.dataValidade, estoque.diasAlertaValidade);
              const ativo = p.status === "ativo";
              return (
                <tr key={p.id} className={cn("border-t", !ativo && "text-muted-foreground", destaque === p.id && "bg-primary/5")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden>
                        <Package className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <Link href={`/produtos/${p.id}`} className="font-medium text-foreground hover:underline">
                          {p.nome}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className="size-2 rounded-full" style={{ backgroundColor: p.categoria.corHex }} />
                      {p.categoria.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(p.precoCusto)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(p.precoVenda)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="block">{formatarMoeda(margem)}</span>
                    <span className={cn("text-xs", percentual < financeiro.margemMinimaPct ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                      {percentual.toLocaleString("pt-BR")}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {!ativo && <Selo tom="neutro">Inativo</Selo>}
                      {percentual < financeiro.margemMinimaPct && (
                        <Selo tom="aviso" title={`Margem mínima: ${financeiro.margemMinimaPct}%`}>
                          Margem baixa
                        </Selo>
                      )}
                      <SeloValidade situacao={validade} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3 whitespace-nowrap">
                      <Link href={`/produtos/${p.id}`} className="text-sm text-primary hover:underline">
                        {podeGerenciar ? "Editar" : "Ver"}
                      </Link>
                      {podeGerenciar && <BotaoStatusProduto id={p.id} nome={p.nome} ativo={ativo} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginação">
          <span className="text-muted-foreground">
            Página {resultado.pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            {resultado.pagina > 1 && (
              <Link href={urlPagina(resultado.pagina - 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">
                Anterior
              </Link>
            )}
            {resultado.pagina < totalPaginas && (
              <Link href={urlPagina(resultado.pagina + 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">
                Próxima
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
