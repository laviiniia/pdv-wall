export const brl = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const c = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Math.round(Number(v.toString()) * 100));
/** Data guardada como DATE (meia-noite UTC) → dd/mm/aaaa. */
export const dataCurta = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });

/** Lê ?mes=AAAA-MM, com o mês atual como padrão. */
export function mesDoParametro(v: string | string[] | undefined, hoje: string) {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : hoje.slice(0, 7);
}

export function nomeMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const s = new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Seletor de mês (GET), preservando outros filtros como campos ocultos. */
export function SeletorMes({ mes, extras = {}, children }: { mes: string; extras?: Record<string, string | undefined>; children?: React.ReactNode }) {
  return (
    <form className="mb-4 flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Mês
        <input type="month" name="mes" defaultValue={mes} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground" />
      </label>
      {Object.entries(extras).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">
        Ver
      </button>
    </form>
  );
}
