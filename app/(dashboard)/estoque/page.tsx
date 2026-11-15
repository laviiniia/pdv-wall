import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, History, PackageMinus, PackagePlus } from "lucide-react";
import { SeloSituacao } from "@/components/estoque/SeloSituacao";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import type { SituacaoEstoque } from "@/lib/estoque/situacao";
import { painelEstoque, type FiltroEstoque } from "@/lib/services/estoque.service";
import { listarCategoriasParaSelect } from "@/lib/services/produtos.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Estoque" };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const qtd = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const SITUACOES: Record<string, string> = { todos: "Todos", alertas: "Só alertas", sem_estoque: "Sem estoque", critico: "Crítico", baixo: "Baixo", normal: "Normal" };
const ORDENS: Record<string, string> = { situacao: "Situação", nome: "Nome", quantidade: "Quantidade", valor: "Valor em estoque", movimento: "Último movimento" };

export default async function EstoquePage({ searchParams }: PageProps<"/estoque">) {
  const usuario = await exigirPermissao(PERMISSAO.ESTOQUE_VER);
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const situacao = (param("situacao") && param("situacao")! in SITUACOES ? param("situacao") : "todos") as FiltroEstoque["situacao"];
  const ordenar = (param("ordenar") && param("ordenar")! in ORDENS ? param("ordenar") : "situacao") as FiltroEstoque["ordenar"];
  const categoriaId = Number(param("categoria")) || undefined;
  const busca = param("busca")?.trim() || undefined;

  const [{ linhas, resumo, alertasAtivos }, categorias] = await Promise.all([
    painelEstoque({ situacao, ordenar, categoriaId, busca }),
    listarCategoriasParaSelect(),
  ]);
  const pode = (p: string) => temPermissao(usuario.permissoes, p);
  const gestao = pode(PERMISSAO.ESTOQUE_HISTORICO);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo="Estoque" descricao="Só aparecem produtos com controle de estoque ligado" />
        <div className="flex flex-wrap gap-2">
          {pode(PERMISSAO.ESTOQUE_ENTRADA) && (
            <Link href="/estoque/entrada" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80">
              <PackagePlus className="size-4" /> Entrada
            </Link>
          )}
          {pode(PERMISSAO.ESTOQUE_AJUSTAR) && (
            <>
              <Link href="/estoque/saida" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
                <PackageMinus className="size-4" /> Saída / ajuste
              </Link>
              <Link href="/estoque/inventario" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
                <ClipboardList className="size-4" /> Inventário
              </Link>
            </>
          )}
          {gestao && (
            <Link href="/estoque/movimentos" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
              <History className="size-4" /> Movimentações
            </Link>
          )}
        </div>
      </div>

      {gestao && (
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { rotulo: "Produtos controlados", valor: String(resumo.produtos), href: "/estoque" },
          { rotulo: "Valor em estoque (custo)", valor: brl(resumo.valorTotal), href: "/estoque?ordenar=valor" },
          { rotulo: "Sem estoque / crítico", valor: `${resumo.semEstoque} / ${resumo.criticos}`, href: "/estoque?situacao=alertas", alerta: resumo.semEstoque + resumo.criticos > 0 },
          { rotulo: "Estoque baixo", valor: String(resumo.baixos), href: "/estoque?situacao=baixo", aviso: resumo.baixos > 0 },
        ].map((c) => (
          <Link key={c.rotulo} href={c.href} className={cn("rounded-xl border bg-card p-4 hover:bg-muted/50", c.alerta && "border-destructive/40", c.aviso && "border-amber-500/40")}>
            <p className="text-xs text-muted-foreground">{c.rotulo}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", c.alerta && "text-destructive")}>{c.valor}</p>
          </Link>
        ))}
      </div>
      )}
      {gestao && !alertasAtivos && <p className="mb-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Os alertas de estoque estão desligados em Configurações › Estoque.</p>}

      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Buscar
          <input name="busca" defaultValue={busca} placeholder="Nome ou SKU" className="h-8 w-48 rounded-md border bg-background px-2.5 text-sm text-foreground" />
        </label>
        {(
          [
            ["situacao", "Situação", SITUACOES, situacao],
            ["ordenar", "Ordenar por", gestao ? ORDENS : Object.fromEntries(Object.entries(ORDENS).filter(([k]) => k !== "valor")), ordenar],
          ] as const
        ).map(([nome, rotulo, opcoes, valor]) => (
          <label key={nome} className="flex flex-col gap-1 text-xs text-muted-foreground">
            {rotulo}
            <select name={nome} defaultValue={valor} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
              {Object.entries(opcoes).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Categoria
          <select name="categoria" defaultValue={categoriaId ?? ""} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">Filtrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 text-right font-medium">Quantidade</th>
              <th className="px-4 py-3 text-right font-medium">Mínimo</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              {gestao && <th className="px-4 py-3 text-right font-medium">Valor</th>}
              <th className="px-4 py-3 font-medium">Último movimento</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {resumo.produtos === 0
                    ? "Nenhum produto com controle de estoque. Dê uma entrada de mercadoria ou ligue o controle no cadastro do produto."
                    : "Nenhum produto com esses filtros."}
                </td>
              </tr>
            )}
            {linhas.map((l) => (
              <tr key={l.id} className={cn("border-t", (l.situacao as SituacaoEstoque) === "sem_estoque" && "bg-destructive/5")}>
                <td className="px-4 py-3">
                  <Link href={`/produtos/${l.id}`} className="font-medium hover:underline">{l.nome}</Link>
                  <span className="block font-mono text-xs text-muted-foreground">{l.sku} · {l.categoria.nome}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{qtd(l.quantidade)} <span className="text-xs font-normal text-muted-foreground">{l.unidadeMedida}</span></td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{l.quantidadeMinima}</td>
                <td className="px-4 py-3"><SeloSituacao situacao={l.situacao} /></td>
                {gestao && <td className="px-4 py-3 text-right tabular-nums">{brl(l.valor)}</td>}
                <td className="px-4 py-3 text-xs text-muted-foreground">{l.ultimoMovimentoEm ? dataHora.format(l.ultimoMovimentoEm) : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3 whitespace-nowrap">
                    {pode(PERMISSAO.ESTOQUE_ENTRADA) && <Link href={`/estoque/entrada?produto=${l.id}`} className="text-primary hover:underline" title="Entrada">+ Entrada</Link>}
                    {pode(PERMISSAO.ESTOQUE_AJUSTAR) && <Link href={`/estoque/saida?produto=${l.id}`} className="text-muted-foreground hover:underline" title="Saída">− Saída</Link>}
                    {gestao && <Link href={`/estoque/movimentos?produto=${l.id}`} className="text-muted-foreground hover:underline">Histórico</Link>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
