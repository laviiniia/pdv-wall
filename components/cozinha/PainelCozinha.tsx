"use client";

import { Pause, Play, Printer, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { mudarStatus } from "@/app/(dashboard)/pedidos-online/actions";
import { Button } from "@/components/ui/button";
import type { StatusPedido } from "@/lib/pedidos/fila";
import { useAtualizacao } from "@/lib/pedidos/useAtualizacao";
import type { PainelCozinha as Painel } from "@/lib/services/pedidos.service";
import { cn } from "@/lib/utils";

type Pedido = Painel["pedidos"][number];
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLUNAS: { titulo: string; status: StatusPedido[]; cor: string }[] = [
  { titulo: "Aguardando", status: ["confirmado"], cor: "bg-red-500" },
  { titulo: "Preparando", status: ["preparando", "pausado"], cor: "bg-amber-500" },
  { titulo: "Pronto", status: ["pronto"], cor: "bg-emerald-500" },
  { titulo: "Entregue (hoje)", status: ["entregue"], cor: "bg-sky-500" },
];

const MOTIVOS = ["Produto em falta", "Pedido duplicado", "Cliente desistiu", "Outro"];

/** Bipe curto via Web Audio (sem arquivo de som). */
function bipe() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.frequency.value = 880;
    ganho.gain.setValueAtTime(0.2, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(ganho).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* sem áudio */
  }
}

function minutosDesde(iso: string | null, agora: number) {
  return iso ? Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60_000)) : 0;
}

export function PainelCozinha({
  inicial,
  podeCancelar,
  timeZone,
}: {
  inicial: Painel;
  podeCancelar: boolean;
  timeZone: string;
}) {
  const { dados, erro, atualizar } = useAtualizacao<Painel>("/api/cozinha", inicial, 4000);
  const [som, setSom] = useState(true);
  const [agora, setAgora] = useState(() => Date.now());
  const [pendente, startTransition] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<Pedido | null>(null);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalheMotivo, setDetalheMotivo] = useState("");

  // Relógio para os cronômetros.
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Bipe quando chega pedido novo.
  const conhecidos = useRef(new Set(inicial.pedidos.map((p) => p.id)));
  useEffect(() => {
    const novos = dados.pedidos.filter((p) => p.status === "confirmado" && !conhecidos.current.has(p.id));
    for (const p of dados.pedidos) conhecidos.current.add(p.id);
    if (novos.length && som) bipe();
  }, [dados, som]);

  function mover(p: Pedido, novo: StatusPedido, motivoCancelamento?: string) {
    setAviso(null);
    startTransition(async () => {
      const r = await mudarStatus(p.id, novo, motivoCancelamento);
      if (!r.ok) setAviso(r.erro);
      await atualizar();
    });
  }

  const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" });
  const e = dados.estatisticas;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span>
          Pedidos hoje: <strong className="tabular-nums">{e.pedidosHoje}</strong>
        </span>
        <span>
          Faturamento: <strong className="tabular-nums">{brl(e.faturamentoHoje)}</strong>
        </span>
        <span>
          Preparo médio: <strong className="tabular-nums">{e.tempoMedioPreparoMin !== null ? `${e.tempoMedioPreparoMin} min` : "—"}</strong>
        </span>
        <span>
          Fila: <strong className="tabular-nums">{e.filaMin} min</strong>
        </span>
        <button
          type="button"
          onClick={() => setSom((s) => !s)}
          aria-pressed={som}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 hover:bg-muted"
        >
          {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} Som {som ? "ligado" : "desligado"}
        </button>
        <span className={cn("text-xs", erro ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
          {erro ?? "Atualizando automaticamente"}
        </span>
      </div>

      {aviso && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {aviso}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUNAS.map((col) => {
          const lista = dados.pedidos.filter((p) => col.status.includes(p.status));
          return (
            <section key={col.titulo} className="flex min-w-0 flex-col rounded-xl bg-muted/40 p-2" aria-label={col.titulo}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
                <span className={cn("size-2.5 rounded-full", col.cor)} />
                {col.titulo}
                <span className="font-normal text-muted-foreground">({lista.length})</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {lista.length === 0 && <li className="px-1 py-6 text-center text-xs text-muted-foreground">Nenhum pedido</li>}
                {lista.map((p) => {
                  const esperando = minutosDesde(p.criadoEm, agora);
                  const emPreparo = minutosDesde(p.iniciadoEm, agora);
                  const atrasado =
                    (p.status === "confirmado" && esperando > p.tempoEstimadoMin) ||
                    (p.status === "preparando" && emPreparo > p.tempoPreparoMin);
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border bg-background p-3 text-sm shadow-xs",
                        atrasado && "border-red-500/60",
                        p.status === "pausado" && "border-dashed",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold">Mesa {String(p.mesa.numero).padStart(2, "0")}</p>
                          <p className="font-mono text-xs text-muted-foreground">{p.numero.slice(-6)}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground tabular-nums">
                          {p.status === "entregue" && p.entregueEm ? (
                            <>Entregue {hora(p.entregueEm)}</>
                          ) : p.status === "pronto" && p.prontoEm ? (
                            <>Pronto há {minutosDesde(p.prontoEm, agora)} min</>
                          ) : p.status === "preparando" ? (
                            <span className={cn(atrasado && "font-semibold text-red-600")}>
                              {emPreparo}/{p.tempoPreparoMin} min
                            </span>
                          ) : p.status === "pausado" ? (
                            <span className="font-semibold text-amber-600">Pausado</span>
                          ) : (
                            <span className={cn(atrasado && "font-semibold text-red-600")}>Há {esperando} min</span>
                          )}
                        </div>
                      </div>

                      <ul className="flex flex-col gap-1">
                        {p.itens.map((i) => (
                          <li key={i.id}>
                            <span className="font-medium">{i.quantidade}×</span> {i.nomeProduto}
                            {i.personalizacoes.length > 0 && (
                              <span className="block pl-4 text-xs text-muted-foreground">
                                {i.personalizacoes.map((o) => (o.tipo === "adicao" ? `+ ${o.nome}` : o.nome)).join(" · ")}
                              </span>
                            )}
                            {i.observacao && <span className="block pl-4 text-xs italic">“{i.observacao}”</span>}
                          </li>
                        ))}
                      </ul>
                      {p.alergias && <p className="rounded bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300">⚠ Alergias: {p.alergias}</p>}
                      {p.observacoes && <p className="text-xs text-muted-foreground">Obs.: {p.observacoes}</p>}
                      {p.clienteNome && <p className="text-xs text-muted-foreground">Cliente: {p.clienteNome}</p>}

                      {p.status !== "entregue" && (
                        <div className="flex flex-wrap gap-1.5 border-t pt-2">
                          {p.status === "confirmado" && (
                            <Button size="sm" onClick={() => mover(p, "preparando")} disabled={pendente}>
                              <Play className="size-3.5" /> Começar
                            </Button>
                          )}
                          {p.status === "preparando" && (
                            <>
                              <Button size="sm" onClick={() => mover(p, "pronto")} disabled={pendente}>
                                Pronto
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => mover(p, "pausado")} disabled={pendente}>
                                <Pause className="size-3.5" /> Pausar
                              </Button>
                            </>
                          )}
                          {p.status === "pausado" && (
                            <Button size="sm" onClick={() => mover(p, "preparando")} disabled={pendente}>
                              <Play className="size-3.5" /> Retomar
                            </Button>
                          )}
                          {p.status === "pronto" && (
                            <>
                              <Button size="sm" onClick={() => mover(p, "entregue")} disabled={pendente}>
                                Entregue
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => mover(p, "preparando")} disabled={pendente} title="Volta para preparo">
                                <RotateCcw className="size-3.5" /> Reabrir
                              </Button>
                            </>
                          )}
                          <a
                            href={`/etiqueta/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs hover:bg-muted"
                            aria-label="Imprimir etiqueta"
                          >
                            <Printer className="size-3.5" />
                          </a>
                          {podeCancelar && p.status !== "pronto" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto text-muted-foreground"
                              onClick={() => {
                                setMotivo(MOTIVOS[0]);
                                setDetalheMotivo("");
                                setCancelando(p);
                              }}
                              disabled={pendente}
                            >
                              <X className="size-3.5" /> Cancelar
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {cancelando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-cancelar">
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-background p-5 shadow-xl">
            <h2 id="titulo-cancelar" className="font-semibold">
              Cancelar pedido da mesa {String(cancelando.mesa.numero).padStart(2, "0")}?
            </h2>
            <fieldset className="flex flex-col gap-1.5 text-sm">
              <legend className="mb-1 font-medium">Motivo</legend>
              {MOTIVOS.map((m) => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} className="accent-primary" />
                  {m}
                </label>
              ))}
            </fieldset>
            <input
              value={detalheMotivo}
              onChange={(ev) => setDetalheMotivo(ev.target.value)}
              placeholder="Detalhes (opcional)"
              maxLength={200}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">O cliente vê o motivo na tela de acompanhamento.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelando(null)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  mover(cancelando, "cancelado", detalheMotivo.trim() ? `${motivo}: ${detalheMotivo.trim()}` : motivo);
                  setCancelando(null);
                }}
              >
                Cancelar pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
