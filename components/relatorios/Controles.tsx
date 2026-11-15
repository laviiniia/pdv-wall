"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/relatorios", titulo: "Visão geral" },
  { href: "/relatorios/dre", titulo: "DRE" },
  { href: "/relatorios/vendas", titulo: "Produtos e categorias" },
  { href: "/relatorios/comportamento", titulo: "Horários e pagamentos" },
];

/** Abas que mantêm o período escolhido ao trocar de relatório. */
export function AbasRelatorios() {
  const pathname = usePathname();
  const qs = useSearchParams().toString();
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b print:hidden" aria-label="Relatórios">
      {ABAS.map((a) => {
        const ativa = pathname === a.href;
        return (
          <Link
            key={a.href}
            href={qs ? `${a.href}?${qs}` : a.href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              ativa ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {a.titulo}
          </Link>
        );
      })}
    </nav>
  );
}

const campo = "h-8 rounded-md border bg-background px-2 text-sm text-foreground";

export function FiltroPeriodo({
  presets,
  comparacoes,
  preset,
  comparar,
  de,
  ate,
  exportar,
}: {
  presets: Record<string, string>;
  comparacoes: Record<string, string>;
  preset: string;
  comparar: string;
  de: string;
  ate: string;
  /** Links de CSV deste relatório. */
  exportar: { rotulo: string; href: string }[];
}) {
  const [p, setP] = useState(preset);
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden">
      <form className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Período
          <select name="preset" value={p} onChange={(e) => setP(e.target.value)} className={campo}>
            {Object.entries(presets).map(([v, r]) => (
              <option key={v} value={v}>{r}</option>
            ))}
          </select>
        </label>
        {p === "personalizado" && (
          <>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              De
              <input type="date" name="de" defaultValue={de} required className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Até
              <input type="date" name="ate" defaultValue={ate} required className={campo} />
            </label>
          </>
        )}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Comparar com
          <select name="comparar" defaultValue={comparar} className={campo}>
            {Object.entries(comparacoes).map(([v, r]) => (
              <option key={v} value={v}>{r}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">Aplicar</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {exportar.map((e) => (
          <a key={e.href} href={e.href} className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-muted">
            <Download className="size-3.5" /> {e.rotulo}
          </a>
        ))}
        <button type="button" onClick={() => window.print()} className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-muted">
          <Printer className="size-3.5" /> Imprimir / PDF
        </button>
      </div>
    </div>
  );
}

/** Barras verticais de uma série só (ex.: faturamento por dia), com dica ao passar o mouse. */
export function GraficoBarras({ pontos, rotuloValor }: { pontos: { chave: string; rotulo: string; valor: number; detalhe?: string }[]; rotuloValor: string }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  const brl = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const marcas = pontos.length <= 12 ? pontos.map((_, i) => i) : [0, Math.floor(pontos.length / 2), pontos.length - 1];
  const sel = ativo == null ? null : pontos[ativo];

  return (
    <figure className="relative">
      <div className="mb-1 flex h-5 items-baseline justify-between text-xs text-muted-foreground">
        <span>{rotuloValor} · máx. {brl(max)}</span>
        {sel && (
          <span className="text-foreground" role="status">
            <span className="font-medium">{sel.rotulo}:</span> {brl(sel.valor)}
            {sel.detalhe ? ` · ${sel.detalhe}` : ""}
          </span>
        )}
      </div>
      <div className="flex h-40 items-end gap-[2px] border-b border-border" onMouseLeave={() => setAtivo(null)}>
        {pontos.map((p, i) => (
          <div
            key={p.chave}
            className="group flex h-full min-w-0 flex-1 cursor-default items-end"
            onMouseEnter={() => setAtivo(i)}
            title={`${p.rotulo}: ${brl(p.valor)}${p.detalhe ? ` · ${p.detalhe}` : ""}`}
          >
            <div
              className={cn("w-full rounded-t-[4px] bg-primary/70 transition-colors", ativo === i && "bg-primary")}
              style={{ height: p.valor > 0 ? `${Math.max(2, (p.valor / max) * 100)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
        {marcas.map((i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
            style={{ left: `${((i + 0.5) / pontos.length) * 100}%` }}
          >
            {pontos[i]?.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}
