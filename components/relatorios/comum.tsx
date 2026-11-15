import { cn } from "@/lib/utils";

export const brl = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const pct = (n: number, casas = 1) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
export const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
export const diaCurto = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;

/** ▲/▼ com a variação; "inverter" quando subir é ruim (custos, despesas). */
export function Variacao({ valor, inverter, pp }: { valor: number | null; inverter?: boolean; pp?: boolean }) {
  if (valor == null) return <span className="text-xs text-muted-foreground">—</span>;
  const bom = inverter ? valor <= 0 : valor >= 0;
  return (
    <span className={cn("whitespace-nowrap text-xs", valor === 0 ? "text-muted-foreground" : bom ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
      {valor > 0 ? "▲" : valor < 0 ? "▼" : "="} {Math.abs(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
      {pp ? " p.p." : "%"}
    </span>
  );
}

export function Cartao({ titulo, valor, children }: { titulo: string; valor: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-4 break-inside-avoid">
      <span className="text-xs text-muted-foreground">{titulo}</span>
      <span className="text-xl font-semibold tabular-nums">{valor}</span>
      {children}
    </div>
  );
}

export function Secao({ titulo, children, acao, className }: { titulo: string; children: React.ReactNode; acao?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border p-4 text-sm break-inside-avoid", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Barra horizontal fina para participação/margem dentro de tabelas. */
export function BarraFina({ fracao }: { fracao: number }) {
  return (
    <div className="h-1.5 w-full min-w-16 rounded-full bg-muted">
      <div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${Math.min(100, Math.max(0, fracao * 100))}%` }} />
    </div>
  );
}
