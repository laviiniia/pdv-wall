"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lerNumero } from "@/lib/utils/numero";
import {
  dividirParcelas,
  type FormaPagamento,
  type PagamentoEntrada,
  PARCELA_MINIMA_CENTAVOS,
  ROTULOS_FORMA,
  validarPagamentos,
} from "@/lib/vendas/calculo";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const paraInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const lerCentavos = (s: string) => {
  const n = lerNumero(s);
  return n === undefined || !Number.isFinite(n) ? 0 : Math.round(n * 100);
};

type Linha = { id: number; forma: FormaPagamento; valor: string; recebido: string; parcelas: number; numeroTransacao: string };

const inputBase =
  "h-9 rounded-md border bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function DialogPagamento({
  aberto,
  aoMudarAberto,
  total,
  formasAceitas,
  parcelamentoMax,
  aoConfirmar,
  enviando,
  erro,
}: {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  total: number;
  formasAceitas: FormaPagamento[];
  parcelamentoMax: number;
  aoConfirmar: (pagamentos: PagamentoEntrada[]) => void;
  enviando: boolean;
  erro?: string;
}) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [proximoId, setProximoId] = useState(1);
  const [totalAnterior, setTotalAnterior] = useState(total);
  const [abertoAnterior, setAbertoAnterior] = useState(aberto);

  // Ao abrir (ou se o total mudar), recomeça com uma linha cobrindo o total.
  if (aberto !== abertoAnterior || total !== totalAnterior) {
    setAbertoAnterior(aberto);
    setTotalAnterior(total);
    if (aberto) {
      setLinhas(total > 0 ? [novaLinha(0, formasAceitas[0] ?? "dinheiro", total)] : []);
      setProximoId(1);
    }
  }

  function novaLinha(id: number, forma: FormaPagamento, valor: number): Linha {
    return { id, forma, valor: paraInput(valor), recebido: forma === "dinheiro" ? paraInput(valor) : "", parcelas: 1, numeroTransacao: "" };
  }

  const pagamentos: PagamentoEntrada[] = useMemo(
    () =>
      linhas.map((l) => ({
        forma: l.forma,
        valor: lerCentavos(l.valor),
        ...(l.forma === "dinheiro" && { recebido: lerCentavos(l.recebido) || lerCentavos(l.valor) }),
        ...(l.forma === "credito" && { parcelas: l.parcelas }),
        ...(l.numeroTransacao.trim() && { numeroTransacao: l.numeroTransacao.trim() }),
      })),
    [linhas],
  );
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const restante = total - pago;
  const validacao = validarPagamentos(total, pagamentos, { formasAceitas, parcelamentoMax });

  const atualizar = (id: number, mudanca: Partial<Linha>) =>
    setLinhas((ls) =>
      ls.map((l) => {
        if (l.id !== id) return l;
        const nova = { ...l, ...mudanca };
        // Trocar para dinheiro: sugere "recebido" igual ao valor.
        if (mudanca.forma === "dinheiro" && !l.recebido) nova.recebido = nova.valor;
        return nova;
      }),
    );

  const adicionarForma = () => {
    const forma = formasAceitas.find((f) => !linhas.some((l) => l.forma === f)) ?? formasAceitas[0];
    setLinhas((ls) => [...ls, novaLinha(proximoId, forma, Math.max(restante, 0))]);
    setProximoId((n) => n + 1);
  };

  return (
    <Dialog.Root open={aberto} onOpenChange={(a) => !enviando && aoMudarAberto(a)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-background shadow-xl outline-none">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <Dialog.Title className="text-base font-semibold">Pagamento</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" disabled={enviando}>
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-2xl font-semibold tabular-nums">{brl(total)}</span>
            </div>

            {total === 0 && <p className="text-sm text-muted-foreground">Venda com desconto total: não há pagamento a registrar.</p>}

            {linhas.map((l, idx) => {
              const valor = lerCentavos(l.valor);
              const recebido = lerCentavos(l.recebido);
              const troco = l.forma === "dinheiro" && recebido > valor ? recebido - valor : 0;
              return (
                <fieldset key={l.id} className="flex flex-col gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <legend className="sr-only">Forma de pagamento {idx + 1}</legend>
                    <div className="flex flex-1 flex-wrap gap-1" role="radiogroup" aria-label="Forma de pagamento">
                      {formasAceitas.map((f) => (
                        <button
                          key={f}
                          type="button"
                          role="radio"
                          aria-checked={l.forma === f}
                          onClick={() => atualizar(l.id, { forma: f })}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-sm",
                            l.forma === f ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted",
                          )}
                        >
                          {ROTULOS_FORMA[f]}
                        </button>
                      ))}
                    </div>
                    {linhas.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remover forma de pagamento"
                        onClick={() => setLinhas((ls) => ls.filter((x) => x.id !== l.id))}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Valor desta forma
                      <span className="flex items-center gap-1.5 text-sm text-foreground">
                        R$
                        <input
                          inputMode="decimal"
                          value={l.valor}
                          onChange={(e) => atualizar(l.id, { valor: e.target.value })}
                          className={cn(inputBase, "w-28 text-right")}
                        />
                      </span>
                    </label>

                    {l.forma === "dinheiro" && (
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Valor recebido
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          R$
                          <input
                            inputMode="decimal"
                            value={l.recebido}
                            onChange={(e) => atualizar(l.id, { recebido: e.target.value })}
                            autoFocus
                            className={cn(inputBase, "w-28 text-right")}
                          />
                        </span>
                      </label>
                    )}

                    {l.forma === "credito" && (
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Parcelas
                        <select
                          value={l.parcelas}
                          onChange={(e) => atualizar(l.id, { parcelas: Number(e.target.value) })}
                          className={cn(inputBase, "text-foreground")}
                        >
                          {Array.from({ length: parcelamentoMax }, (_, i) => i + 1)
                            .filter((n) => n === 1 || Math.floor(valor / n) >= PARCELA_MINIMA_CENTAVOS)
                            .map((n) => (
                              <option key={n} value={n}>
                                {n}x de {brl(dividirParcelas(valor, n)[0])}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}

                    {l.forma !== "dinheiro" && (
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {l.forma === "pix" ? "ID da transação (opcional)" : "NSU / autorização (opcional)"}
                        <input
                          value={l.numeroTransacao}
                          onChange={(e) => atualizar(l.id, { numeroTransacao: e.target.value })}
                          maxLength={100}
                          className={cn(inputBase, "w-44 text-foreground")}
                        />
                      </label>
                    )}
                  </div>

                  {l.forma === "dinheiro" && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {[valor, 2000, 5000, 10000, 20000]
                        .filter((n, i, a) => n >= valor && a.indexOf(n) === i)
                        .map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => atualizar(l.id, { recebido: paraInput(n) })}
                            className="rounded-md border px-2 py-0.5 text-xs hover:bg-muted"
                          >
                            {n === valor ? "Exato" : brl(n)}
                          </button>
                        ))}
                      <span className="ml-auto">
                        Troco: <strong className="tabular-nums">{brl(troco)}</strong>
                      </span>
                    </div>
                  )}
                  {l.forma === "pix" && (
                    <p className="text-xs text-muted-foreground">
                      Confirme o recebimento no app do banco antes de finalizar. (A geração automática do QR Code depende da integração com o banco.)
                    </p>
                  )}
                  {(l.forma === "debito" || l.forma === "credito") && (
                    <p className="text-xs text-muted-foreground">Passe o cartão na maquininha e finalize após a aprovação.</p>
                  )}
                </fieldset>
              );
            })}

            {total > 0 && (
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={adicionarForma} className="flex items-center gap-1 text-primary hover:underline">
                  <Plus className="size-4" /> Dividir em outra forma
                </button>
                <span className={cn("tabular-nums", restante !== 0 && "font-medium text-amber-700 dark:text-amber-400")}>
                  {restante > 0 ? `Falta ${brl(restante)}` : restante < 0 ? `Excede ${brl(-restante)}` : "Valores conferem"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t px-5 py-4">
            {(erro || (!validacao.ok && linhas.length > 0)) && (
              <p role="alert" className="text-sm text-destructive">
                {erro ?? (!validacao.ok ? validacao.erro : "")}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {validacao.ok && validacao.troco > 0 && (
                  <>
                    Troco: <strong className="text-base text-foreground tabular-nums">{brl(validacao.troco)}</strong>
                  </>
                )}
              </span>
              <Button size="lg" disabled={!validacao.ok || enviando} onClick={() => aoConfirmar(pagamentos)}>
                {enviando ? "Finalizando..." : "Confirmar pagamento"}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
