import type { Metadata } from "next";
import Link from "next/link";
import { BotaoDesfazer } from "@/components/estoque/BotaoDesfazer";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { ROTULOS_MOVIMENTO, TIPOS_DESFAZIVEIS, type TipoMovimento } from "@/lib/estoque/situacao";
import { getConfig } from "@/lib/services/configuracoes.service";
import { historicoMovimentos, produtosParaEstoque } from "@/lib/services/estoque.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Movimentações de estoque" };

const qtd = (v: { toString(): string }) => Number(v.toString()).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const MENSAGENS: Record<string, string> = { saida: "Movimentação registrada.", entrada: "Entrada registrada." };

export default async function MovimentosPage({ searchParams }: PageProps<"/estoque/movimentos">) {
  const usuario = await exigirPermissao(PERMISSAO.ESTOQUE_VER);
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const produtoId = Number(param("produto")) || undefined;
  const tipo = param("tipo") && param("tipo")! in ROTULOS_MOVIMENTO ? (param("tipo") as TipoMovimento) : undefined;
  const pagina = Math.max(1, Number(param("pagina")) || 1);

  const [{ movimentos, total, totalPaginas }, produtos, empresa] = await Promise.all([
    historicoMovimentos({ produtoId, tipo, pagina }),
    produtosParaEstoque(),
    getConfig("empresa"),
  ]);
  const tz = empresa.funcionamento.timezone;
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
  const podeDesfazer = temPermissao(usuario.permissoes, PERMISSAO.ESTOQUE_DESFAZER);
  const produto = produtoId ? produtos.find((p) => p.id === produtoId) : undefined;
  const msg = param("msg");
  const url = (p: number) => `/estoque/movimentos?${new URLSearchParams({ ...(produtoId && { produto: String(produtoId) }), ...(tipo && { tipo }), pagina: String(p) })}`;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/estoque" className="text-muted-foreground hover:underline">← Estoque</Link>
      </p>
      <PageHeader titulo={produto ? `Movimentações · ${produto.nome}` : "Movimentações de estoque"} descricao={`${total} movimento(s)`} />
      {msg && MENSAGENS[msg] && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          {MENSAGENS[msg]} {param("ref")}
        </p>
      )}

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Produto
          <select name="produto" defaultValue={produtoId ?? ""} className="h-8 max-w-64 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="">Todos</option>
            {produtos.filter((p) => p.controlarEstoque).map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Tipo
          <select name="tipo" defaultValue={tipo ?? ""} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="">Todos</option>
            {Object.entries(ROTULOS_MOVIMENTO).map(([v, r]) => (
              <option key={v} value={v}>{r}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">Filtrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              {!produto && <th className="px-4 py-3 font-medium">Produto</th>}
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Qtd</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Referência / motivo</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {movimentos.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Nenhuma movimentação.</td></tr>
            )}
            {movimentos.map((m) => {
              const q = Number(m.quantidade);
              const desfeito = !!m.desfeitoPorId;
              return (
                <tr key={m.id} className={cn("border-t", desfeito && "text-muted-foreground")}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{quando(m.criadoEm)}</td>
                  {!produto && (
                    <td className="px-4 py-3">
                      <Link href={`/estoque/movimentos?produto=${m.produtoId}`} className="hover:underline">{m.produto.nome}</Link>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {ROTULOS_MOVIMENTO[m.tipo]}
                    {desfeito && <span className="ml-1 text-xs">(desfeito)</span>}
                  </td>
                  <td className={cn("px-4 py-3 text-right font-medium tabular-nums", !desfeito && (q > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"), desfeito && "line-through")}>
                    {q > 0 ? "+" : ""}{qtd(m.quantidade)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{qtd(m.saldoNovo)}</td>
                  <td className="px-4 py-3 text-xs">
                    {m.referenciaTipo === "VENDA" && m.referenciaId ? (
                      <Link href={`/vendas/${m.referenciaId}`} className="font-mono hover:underline">{m.referencia}</Link>
                    ) : m.referencia ? (
                      <span className="font-mono">{m.referencia}</span>
                    ) : null}
                    {m.motivo && <span className="block text-muted-foreground">{m.motivo}</span>}
                    {m.lote && <span className="block text-muted-foreground">Lote {m.lote}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">{m.usuario.nome}</td>
                  <td className="px-4 py-3 text-right">
                    {podeDesfazer && !desfeito && TIPOS_DESFAZIVEIS.includes(m.tipo) && (
                      <BotaoDesfazer id={m.id} descricao={`${ROTULOS_MOVIMENTO[m.tipo]} de ${qtd(m.quantidade)} — ${m.produto.nome}`} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <nav className="mt-4 flex justify-between text-sm" aria-label="Paginação">
          <span className="text-muted-foreground">Página {pagina} de {totalPaginas}</span>
          <span className="flex gap-2">
            {pagina > 1 && <Link href={url(pagina - 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">Anterior</Link>}
            {pagina < totalPaginas && <Link href={url(pagina + 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">Próxima</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
