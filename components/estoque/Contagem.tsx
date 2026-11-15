"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { concluirInventario, descartarInventario, gravarContagem } from "@/app/(dashboard)/estoque/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lerNumero } from "@/lib/utils/numero";

type Item = { produtoId: number; nome: string; sku: string; categoria: string; unidade: string; saldoAtual: number; contado: number | null };

const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export function Contagem({ inventarioId, itens, divergenciaMaxPct }: { inventarioId: number; itens: Item[]; divergenciaMaxPct: number }) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<number, string>>(() =>
    Object.fromEntries(itens.map((i) => [i.produtoId, i.contado === null ? "" : String(i.contado).replace(".", ",")])),
  );
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const lido = (id: number) => {
    const v = valores[id]?.trim();
    if (!v) return null;
    const n = lerNumero(v);
    return n === undefined || !Number.isFinite(n) ? NaN : n;
  };
  const contados = itens.filter((i) => lido(i.produtoId) !== null).length;
  const visiveis = itens.filter((i) => !busca || `${i.nome} ${i.sku}`.toLowerCase().includes(busca.toLowerCase()));

  const payload = () => ({
    inventarioId,
    contagens: itens.map((i) => ({ produtoId: i.produtoId, quantidadeReal: lido(i.produtoId) })),
  });

  function salvar(depois?: () => Promise<void>) {
    setMsg(null);
    if (itens.some((i) => Number.isNaN(lido(i.produtoId)))) return setMsg({ tipo: "erro", texto: "Há quantidades inválidas." });
    startTransition(async () => {
      const r = await gravarContagem(payload());
      if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro });
      if (depois) await depois();
      else setMsg({ tipo: "ok", texto: "Contagem salva. Você pode continuar depois." });
    });
  }

  function finalizar() {
    if (!window.confirm(`Finalizar com ${contados} de ${itens.length} produto(s) contado(s)? O saldo dos contados será ajustado; os não contados ficam como estão.`)) return;
    salvar(async () => {
      const r = await concluirInventario(inventarioId);
      if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro });
      router.refresh();
    });
  }

  function cancelar() {
    if (!window.confirm("Cancelar este inventário? Nada será ajustado.")) return;
    startTransition(async () => {
      await descartarInventario(inventarioId);
      router.push("/estoque/inventario");
    });
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar produto" className="h-8 w-56 rounded-md border bg-background px-2.5 text-sm" />
        <span className="text-sm text-muted-foreground">{contados} de {itens.length} contado(s)</span>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 text-right font-medium">No sistema</th>
              <th className="px-4 py-3 font-medium">Contado</th>
              <th className="px-4 py-3 text-right font-medium">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((i) => {
              const v = lido(i.produtoId);
              const dif = v === null || Number.isNaN(v) ? null : Math.round((v - i.saldoAtual) * 1000) / 1000;
              const pct = dif !== null && i.saldoAtual > 0 ? (Math.abs(dif) / i.saldoAtual) * 100 : null;
              const acima = pct !== null && pct > divergenciaMaxPct;
              return (
                <tr key={i.produtoId} className="border-t">
                  <td className="px-4 py-2">
                    {i.nome}
                    <span className="block font-mono text-xs text-muted-foreground">{i.sku} · {i.categoria}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(i.saldoAtual)} <span className="text-xs text-muted-foreground">{i.unidade}</span></td>
                  <td className="px-4 py-2">
                    <input
                      aria-label={`Quantidade contada de ${i.nome}`}
                      inputMode="decimal"
                      value={valores[i.produtoId] ?? ""}
                      onChange={(e) => setValores((s) => ({ ...s, [i.produtoId]: e.target.value }))}
                      className={cn("h-8 w-24 rounded-md border bg-background px-2 text-right text-sm tabular-nums", Number.isNaN(v) && "border-destructive")}
                    />
                  </td>
                  <td className={cn("px-4 py-2 text-right tabular-nums", dif !== null && dif !== 0 && (acima ? "font-semibold text-destructive" : "text-amber-700 dark:text-amber-400"))}>
                    {dif === null ? "—" : dif === 0 ? "ok" : `${dif > 0 ? "+" : ""}${fmt(dif)}`}
                    {acima && <span className="block text-xs">acima de {divergenciaMaxPct}%</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
        <Button size="lg" onClick={finalizar} disabled={pending || contados === 0}>Finalizar e ajustar estoque</Button>
        <Button size="lg" variant="outline" onClick={() => salvar()} disabled={pending}>Salvar contagem</Button>
        <Button variant="ghost" onClick={cancelar} disabled={pending} className="text-muted-foreground">Cancelar inventário</Button>
        {msg && <p role={msg.tipo === "erro" ? "alert" : "status"} className={cn("text-sm", msg.tipo === "erro" ? "text-destructive" : "text-muted-foreground")}>{msg.texto}</p>}
      </div>
    </div>
  );
}
