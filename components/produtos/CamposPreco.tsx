"use client";

import { useState } from "react";
import { useFormCtx } from "@/components/form/FormCtx";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/utils/format";
import { lerNumero } from "@/lib/utils/numero";
import { calcularMargem } from "@/lib/validations/produto.schema";

const inputBase =
  "h-9 w-36 rounded-md border bg-background px-3 text-right text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:bg-muted/50";

/** Preço de custo e de venda, com margem e % de lucro recalculados enquanto se digita (MODULO_2_1, 1.1.5). */
export function CamposPreco({
  custo,
  venda,
  margemMinimaPct,
  bloqueado = false,
}: {
  custo: string;
  venda: string;
  /** Configurações > Financeiro: abaixo disso, mostra alerta. */
  margemMinimaPct: number;
  /** Somente leitura (sem permissão para alterar preço). */
  bloqueado?: boolean;
}) {
  const { erros } = useFormCtx();
  const [precoCusto, setPrecoCusto] = useState(custo);
  const [precoVenda, setPrecoVenda] = useState(venda);

  const c = lerNumero(precoCusto);
  const v = lerNumero(precoVenda);
  const calculavel = c !== undefined && v !== undefined && Number.isFinite(c) && Number.isFinite(v) && c > 0;
  const { margem, percentual } = calculavel ? calcularMargem(c, v) : { margem: 0, percentual: 0 };

  const campo = (nome: "precoCusto" | "precoVenda", rotulo: string, valor: string, set: (s: string) => void) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {rotulo}
      <span className="flex items-center gap-2">
        <span className="text-sm font-normal text-muted-foreground">R$</span>
        <input
          name={nome}
          inputMode="decimal"
          value={valor}
          onChange={(e) => set(e.target.value)}
          placeholder="0,00"
          aria-invalid={!!erros[nome]}
          readOnly={bloqueado}
          title={bloqueado ? "Sem permissão para alterar preço" : undefined}
          className={cn(inputBase, bloqueado && "bg-muted/50 text-muted-foreground")}
        />
      </span>
      {erros[nome] && <span className="text-xs font-normal text-destructive">{erros[nome]![0]}</span>}
    </label>
  );

  return (
    <>
      {campo("precoCusto", "Preço de custo", precoCusto, setPrecoCusto)}
      {campo("precoVenda", "Preço de venda", precoVenda, setPrecoVenda)}
      <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3 text-sm sm:col-span-2" aria-live="polite">
        {calculavel ? (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Margem: <strong className={cn(margem <= 0 && "text-destructive")}>{formatarMoeda(margem)}</strong>
              </span>
              <span>
                Lucro sobre o custo: <strong className={cn(margem <= 0 && "text-destructive")}>{percentual.toLocaleString("pt-BR")}%</strong>
              </span>
            </div>
            {margem <= 0 ? (
              <span className="text-xs text-destructive">O preço de venda precisa ser maior que o de custo.</span>
            ) : (
              percentual < margemMinimaPct && (
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Abaixo da margem mínima de {margemMinimaPct.toLocaleString("pt-BR")}% definida em Configurações › Financeiro.
                </span>
              )
            )}
          </>
        ) : (
          <span className="text-muted-foreground">Preencha os preços para ver a margem.</span>
        )}
      </div>
    </>
  );
}
