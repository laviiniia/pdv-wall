"use client";

import { Check, Clock, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { avaliar, cancelarMeuPedido } from "@/app/mesa/actions";
import { Button } from "@/components/ui/button";
import type { StatusPedido } from "@/lib/pedidos/fila";
import { useAtualizacao } from "@/lib/pedidos/useAtualizacao";
import type { PedidoAcompanhamento } from "@/lib/services/pedidos.service";
import { cn } from "@/lib/utils";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Serializado = Omit<PedidoAcompanhamento, "criadoEm" | "iniciadoEm" | "prontoEm" | "entregueEm" | "historico" | "previsaoEm"> & {
  previsaoEm: string;
  criadoEm: string;
  iniciadoEm: string | null;
  prontoEm: string | null;
  entregueEm: string | null;
  historico: { status: StatusPedido; criadoEm: string }[];
};

const ETAPAS: { status: StatusPedido; titulo: string; texto: string }[] = [
  { status: "confirmado", titulo: "Recebido", texto: "Seu pedido chegou na cozinha" },
  { status: "preparando", titulo: "Preparando", texto: "Seu pedido está sendo preparado" },
  { status: "pronto", titulo: "Pronto", texto: "Já vai sair para a sua mesa" },
  { status: "entregue", titulo: "Entregue", texto: "Bom apetite!" },
];
const ORDEM: Record<StatusPedido, number> = { confirmado: 0, preparando: 1, pausado: 1, pronto: 2, entregue: 3, cancelado: -1 };

export function Acompanhamento({ token, inicial, timeZone }: { token: string; inicial: Serializado; timeZone: string }) {
  const { dados: p, erro, atualizadoEm, atualizar } = useAtualizacao<Serializado>(`/api/pedidos/${token}`, inicial, 5000);
  const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" });
  const quandoEntrou = (s: StatusPedido) => [...p.historico].reverse().find((h) => h.status === s)?.criadoEm;
  const atual = ORDEM[p.status];

  // Avaliação (seção 8.4)
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [msgAvaliacao, setMsgAvaliacao] = useState<string | null>(null);
  const [enviando, startEnvio] = useTransition();

  function enviarAvaliacao() {
    startEnvio(async () => {
      const r = await avaliar(token, { nota, texto: comentario || undefined });
      setMsgAvaliacao(r.ok ? "Obrigado pela avaliação!" : (r.erro ?? "Não foi possível enviar."));
      if (r.ok) void atualizar();
    });
  }

  const [msgCancelar, setMsgCancelar] = useState<string | null>(null);
  function cancelar() {
    if (!window.confirm("Cancelar este pedido?")) return;
    startEnvio(async () => {
      const r = await cancelarMeuPedido(token);
      setMsgCancelar(r.ok ? null : (r.erro ?? "Não foi possível cancelar."));
      void atualizar();
    });
  }

  async function compartilhar() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Pedido ${p.numero}`, url });
      else {
        await navigator.clipboard.writeText(url);
        window.alert("Link copiado!");
      }
    } catch {
      /* compartilhamento cancelado */
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-4">
      <header>
        <p className="text-xs text-muted-foreground">Mesa {String(p.mesa.numero).padStart(2, "0")}</p>
        <h1 className="text-lg font-semibold">Acompanhe seu pedido</h1>
        <p className="font-mono text-sm text-muted-foreground">{p.numero}</p>
      </header>

      {p.status === "cancelado" ? (
        <div role="status" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-semibold text-destructive">Pedido cancelado</p>
          {p.motivoCancelamento && <p className="mt-1 text-sm">{p.motivoCancelamento}</p>}
        </div>
      ) : (
        <>
          {(p.status === "confirmado" || p.status === "preparando" || p.status === "pausado") && (
            <div className="rounded-xl bg-primary/10 p-4 text-center" aria-live="polite">
              <p className="text-sm text-muted-foreground">{p.status === "pausado" ? "Preparo em pausa — já retomamos" : "Previsão"}</p>
              <p className="text-3xl font-semibold tabular-nums">~{p.previsaoMinutos} min</p>
              <p className="text-sm text-muted-foreground">por volta das {hora(p.previsaoEm)}</p>
              {p.posicao && p.totalFila > 1 && (
                <p className="mt-2 text-sm">
                  Posição na fila: <strong>{p.posicao}</strong> de {p.totalFila}
                </p>
              )}
            </div>
          )}
          {p.status === "pronto" && (
            <p role="status" className="rounded-xl bg-emerald-500/15 p-4 text-center text-lg font-semibold text-emerald-800 dark:text-emerald-300">
              🔔 Seu pedido está pronto!
            </p>
          )}

          <ol className="flex flex-col" aria-label="Andamento do pedido">
            {ETAPAS.map((e, i) => {
              const feito = i < atual || (i === atual && p.status === "entregue");
              const agora = i === atual && p.status !== "entregue";
              const quando = quandoEntrou(e.status);
              return (
                <li key={e.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border-2",
                        feito && "border-primary bg-primary text-primary-foreground",
                        agora && "border-primary text-primary",
                        !feito && !agora && "border-muted text-muted-foreground",
                      )}
                    >
                      {feito ? <Check className="size-4" /> : agora ? <Clock className="size-3.5" /> : null}
                    </span>
                    {i < ETAPAS.length - 1 && <span className={cn("w-0.5 flex-1", i < atual ? "bg-primary" : "bg-muted")} />}
                  </div>
                  <div className="pb-5">
                    <p className={cn("font-medium", !feito && !agora && "text-muted-foreground")}>
                      {e.titulo} {quando && <span className="text-sm font-normal text-muted-foreground">· {hora(quando)}</span>}
                    </p>
                    {(feito || agora) && <p className="text-sm text-muted-foreground">{e.texto}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <section className="rounded-xl border">
        <h2 className="border-b px-4 py-2 text-sm font-semibold">Resumo</h2>
        <ul className="divide-y text-sm">
          {p.itens.map((i) => (
            <li key={i.id} className="flex justify-between gap-2 px-4 py-2">
              <span>
                {i.quantidade}× {i.nomeProduto}
                {i.personalizacoes.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {i.personalizacoes.map((o) => (o.tipo === "adicao" ? `+ ${o.nome}` : o.nome)).join(" · ")}
                  </span>
                )}
                {i.observacao && <span className="block text-xs text-muted-foreground">Obs.: {i.observacao}</span>}
              </span>
              <span className="tabular-nums">{brl(i.precoCentavos * i.quantidade)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t px-4 py-2 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{brl(p.totalCentavos)}</span>
        </div>
      </section>

      {p.status === "entregue" && !p.avaliacaoNota && (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <h2 className="text-sm font-semibold">Como foi?</h2>
          <div className="flex gap-1" role="radiogroup" aria-label="Nota">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={nota === n} aria-label={`${n} estrela(s)`} onClick={() => setNota(n)}>
                <Star className={cn("size-8", n <= nota ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Comentário (opcional)"
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button disabled={!nota || enviando} onClick={enviarAvaliacao}>
            Enviar avaliação
          </Button>
          {msgAvaliacao && <p className="text-sm text-muted-foreground">{msgAvaliacao}</p>}
        </section>
      )}
      {p.avaliacaoNota && <p className="text-center text-sm text-muted-foreground">Você avaliou com {p.avaliacaoNota} estrela(s). Obrigado!</p>}

      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <Button variant="outline" onClick={compartilhar}>
          <Share2 className="size-4" /> Compartilhar
        </Button>
        <Link href={`/mesa/${p.mesa.token}`} className="inline-flex h-8 items-center rounded-lg border px-3 hover:bg-muted">
          Pedir mais
        </Link>
        {p.status === "confirmado" && (
          <Button variant="destructive" onClick={cancelar} disabled={enviando}>
            Cancelar pedido
          </Button>
        )}
      </div>
      {msgCancelar && <p className="text-center text-sm text-destructive">{msgCancelar}</p>}

      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {erro ?? (atualizadoEm ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR")}` : "Atualiza automaticamente")}
      </p>
    </main>
  );
}
