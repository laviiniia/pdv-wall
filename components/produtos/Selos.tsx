import { cn } from "@/lib/utils";

export type TomSelo = "ok" | "neutro" | "erro" | "aviso";

export function Selo({ tom, children, title }: { tom: TomSelo; children: React.ReactNode; title?: string }) {
  const cores: Record<TomSelo, string> = {
    ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    neutro: "bg-muted text-muted-foreground",
    erro: "bg-destructive/10 text-destructive",
    aviso: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  return (
    <span title={title} className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", cores[tom])}>
      {children}
    </span>
  );
}

export function SeloValidade({ situacao }: { situacao: { tipo: "vencido" | "vencendo" | "ok"; dias: number } | null }) {
  if (!situacao || situacao.tipo === "ok") return null;
  if (situacao.tipo === "vencido") return <Selo tom="erro">Vencido</Selo>;
  return <Selo tom="aviso">{situacao.dias === 0 ? "Vence hoje" : `Vence em ${situacao.dias} dia(s)`}</Selo>;
}
