"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Clock, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { enviarPedido } from "@/app/mesa/actions";
import { Button } from "@/components/ui/button";
import type { ProdutoCardapio } from "@/lib/services/pedidos.service";
import { cn } from "@/lib/utils";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type ItemCarrinho = {
  chave: string; // produto + opções + observação: itens iguais se somam
  produtoId: number;
  nome: string;
  adicionais: number[];
  descricaoOpcoes: string[];
  observacao: string;
  unitario: number;
  quantidade: number;
};

const nadaParaAssinar = () => () => {};

function lerLista<T>(chave: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(chave) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function salvar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento indisponível */
  }
}

export function Cardapio({
  tokenMesa,
  numeroMesa,
  nomeEmpresa,
  produtos,
  aberto,
  avisoFechado,
  tempoPadraoMin,
}: {
  tokenMesa: string;
  numeroMesa: number;
  nomeEmpresa: string;
  produtos: ProdutoCardapio[];
  aberto: boolean;
  avisoFechado: string;
  tempoPadraoMin: number;
}) {
  const router = useRouter();
  const chaveCarrinho = `pdv-wall:mesa:${tokenMesa}:carrinho`;
  const chavePedidos = `pdv-wall:mesa:${tokenMesa}:pedidos`;

  // Carrinho e "meus pedidos" ficam no celular do cliente (sem login).
  const hidratado = useSyncExternalStore(nadaParaAssinar, () => true, () => false);
  const [carrinhoSalvo, setCarrinho] = useState<ItemCarrinho[]>(() => lerLista(chaveCarrinho));
  const [meusPedidos] = useState<{ token: string; numero: string }[]>(() => lerLista(chavePedidos));
  const carrinho = hidratado ? carrinhoSalvo : [];
  useEffect(() => salvar(chaveCarrinho, carrinhoSalvo), [carrinhoSalvo, chaveCarrinho]);

  const categorias = useMemo(() => {
    const m = new Map<number, { id: number; nome: string; icone: string | null; produtos: ProdutoCardapio[] }>();
    for (const p of produtos) {
      if (!m.has(p.categoria.id)) m.set(p.categoria.id, { ...p.categoria, produtos: [] });
      m.get(p.categoria.id)!.produtos.push(p);
    }
    return [...m.values()];
  }, [produtos]);

  const total = carrinho.reduce((s, i) => s + i.unitario * i.quantidade, 0);
  const qtdItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const tempoCarrinho = carrinho.reduce((max, i) => {
    const p = produtos.find((x) => x.id === i.produtoId);
    return Math.max(max, p?.tempoPreparoMin ?? tempoPadraoMin);
  }, 0);

  // ─── Personalização ───────────────────────────────────────────────────────
  const [produtoAberto, setProdutoAberto] = useState<ProdutoCardapio | null>(null);
  const [opcoes, setOpcoes] = useState<number[]>([]);
  const [observacao, setObservacao] = useState("");
  const [qtd, setQtd] = useState(1);

  function abrirProduto(p: ProdutoCardapio) {
    setProdutoAberto(p);
    setOpcoes([]);
    setObservacao("");
    setQtd(1);
  }

  const unitarioAberto = produtoAberto
    ? produtoAberto.precoCentavos +
      produtoAberto.adicionais.filter((a) => a.tipo === "adicao" && opcoes.includes(a.id)).reduce((s, a) => s + a.valorCentavos, 0)
    : 0;

  function adicionarAoCarrinho() {
    if (!produtoAberto) return;
    const ids = [...opcoes].sort((a, b) => a - b);
    const obs = observacao.trim().slice(0, 100);
    const chave = `${produtoAberto.id}|${ids.join(",")}|${obs}`;
    const descricaoOpcoes = produtoAberto.adicionais
      .filter((a) => ids.includes(a.id))
      .map((a) => (a.tipo === "adicao" ? `+ ${a.nome}` : a.nome));
    setCarrinho((atual) => {
      const i = atual.findIndex((x) => x.chave === chave);
      if (i >= 0) return atual.map((x, j) => (j === i ? { ...x, quantidade: Math.min(50, x.quantidade + qtd) } : x));
      return [...atual, { chave, produtoId: produtoAberto.id, nome: produtoAberto.nome, adicionais: ids, descricaoOpcoes, observacao: obs, unitario: unitarioAberto, quantidade: qtd }];
    });
    setProdutoAberto(null);
  }

  function mudarQtd(chave: string, delta: number) {
    setCarrinho((atual) =>
      atual
        .map((x) => (x.chave === chave ? { ...x, quantidade: Math.min(50, x.quantidade + delta) } : x))
        .filter((x) => x.quantidade > 0),
    );
  }

  // ─── Carrinho e confirmação ───────────────────────────────────────────────
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [etapa, setEtapa] = useState<"carrinho" | "dados">("carrinho");
  const [dados, setDados] = useState({ clienteNome: "", clienteTelefone: "", alergias: "", observacoes: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startEnvio] = useTransition();

  function confirmar() {
    setErro(null);
    startEnvio(async () => {
      const r = await enviarPedido(tokenMesa, {
        itens: carrinho.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, adicionais: i.adicionais, observacao: i.observacao || undefined })),
        ...dados,
      });
      if (!r.ok) return setErro(r.erro);
      salvar(chavePedidos, [{ token: r.token, numero: r.numero }, ...meusPedidos].slice(0, 10));
      setCarrinho([]);
      router.push(`/pedido/${r.token}`);
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col pb-28">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">{nomeEmpresa}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Mesa {String(numeroMesa).padStart(2, "0")}</h1>
          {hidratado && meusPedidos.length > 0 && (
            <Link href={`/pedido/${meusPedidos[0].token}`} className="text-sm text-primary hover:underline">
              Acompanhar pedido
            </Link>
          )}
        </div>
        {categorias.length > 1 && (
          <nav className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Categorias">
            {categorias.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} className="whitespace-nowrap rounded-full border px-3 py-1 text-sm hover:bg-muted">
                {c.icone} {c.nome}
              </a>
            ))}
          </nav>
        )}
      </header>

      {!aberto && (
        <p role="status" className="m-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm">
          {avisoFechado}
        </p>
      )}

      <main className="flex flex-col gap-6 px-4 py-4">
        {categorias.length === 0 && <p className="text-sm text-muted-foreground">O cardápio ainda está vazio.</p>}
        {categorias.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-28">
            <h2 className="mb-2 font-semibold">
              {c.icone} {c.nome}
            </h2>
            <ul className="flex flex-col divide-y rounded-xl border">
              {c.produtos.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => abrirProduto(p)}
                    disabled={!aberto}
                    className="flex w-full items-start justify-between gap-3 p-3 text-left hover:bg-muted/50 disabled:opacity-60"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{p.nome}</span>
                      {p.descricao && <span className="line-clamp-2 text-sm text-muted-foreground">{p.descricao}</span>}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> ~{p.tempoPreparoMin ?? tempoPadraoMin} min
                      </span>
                    </span>
                    <span className="whitespace-nowrap font-semibold tabular-nums">{brl(p.precoCentavos)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {/* Barra do carrinho */}
      {qtdItens > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-3">
          <div className="mx-auto max-w-2xl">
            <Button
              size="lg"
              className="h-12 w-full justify-between px-4 text-base"
              onClick={() => {
                setEtapa("carrinho");
                setErro(null);
                setCarrinhoAberto(true);
              }}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="size-5" /> Ver carrinho ({qtdItens})
              </span>
              <span className="tabular-nums">{brl(total)}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Personalização do produto */}
      <Dialog.Root open={!!produtoAberto} onOpenChange={(a) => !a && setProdutoAberto(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl bg-background outline-none sm:inset-x-auto sm:left-1/2 sm:w-[480px] sm:-translate-x-1/2 sm:rounded-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
            {produtoAberto && (
              <>
                <div className="flex items-start justify-between gap-2 border-b p-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold">{produtoAberto.nome}</Dialog.Title>
                    {produtoAberto.descricao && <Dialog.Description className="text-sm text-muted-foreground">{produtoAberto.descricao}</Dialog.Description>}
                  </div>
                  <Dialog.Close aria-label="Fechar" className="rounded-md p-1.5 hover:bg-muted">
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto p-4">
                  {(["adicao", "remocao"] as const).map((tipo) => {
                    const lista = produtoAberto.adicionais.filter((a) => a.tipo === tipo);
                    if (!lista.length) return null;
                    return (
                      <fieldset key={tipo} className="flex flex-col gap-2">
                        <legend className="mb-1 text-sm font-semibold">{tipo === "adicao" ? "Adicionais" : "Retirar"}</legend>
                        {lista.map((a) => (
                          <label key={a.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={opcoes.includes(a.id)}
                                onChange={(e) => setOpcoes((o) => (e.target.checked ? [...o, a.id] : o.filter((x) => x !== a.id)))}
                                className="size-4 accent-primary"
                              />
                              {a.nome}
                            </span>
                            {tipo === "adicao" && a.valorCentavos > 0 && <span className="tabular-nums text-muted-foreground">+ {brl(a.valorCentavos)}</span>}
                          </label>
                        ))}
                      </fieldset>
                    );
                  })}
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Observação
                    <input
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      maxLength={100}
                      placeholder="Ex.: bem passado, sem gelo"
                      className="h-10 rounded-md border bg-background px-3 font-normal"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 border-t p-4">
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Diminuir" disabled={qtd <= 1} onClick={() => setQtd((q) => q - 1)} className="rounded-md border p-2 disabled:opacity-40">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center tabular-nums" aria-live="polite">{qtd}</span>
                    <button type="button" aria-label="Aumentar" disabled={qtd >= 50} onClick={() => setQtd((q) => q + 1)} className="rounded-md border p-2 disabled:opacity-40">
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <Button size="lg" className="h-11 flex-1 justify-between px-4" onClick={adicionarAoCarrinho}>
                    <span>Adicionar</span>
                    <span className="tabular-nums">{brl(unitarioAberto * qtd)}</span>
                  </Button>
                </div>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Carrinho + dados do cliente */}
      <Dialog.Root open={carrinhoAberto} onOpenChange={(a) => !enviando && setCarrinhoAberto(a)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-2xl bg-background outline-none sm:inset-x-auto sm:left-1/2 sm:w-[480px] sm:-translate-x-1/2 sm:rounded-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
            <div className="flex items-center justify-between border-b p-4">
              <Dialog.Title className="text-lg font-semibold">{etapa === "carrinho" ? "Seu pedido" : "Quase lá"}</Dialog.Title>
              <Dialog.Close aria-label="Fechar" className="rounded-md p-1.5 hover:bg-muted" disabled={enviando}>
                <X className="size-5" />
              </Dialog.Close>
            </div>

            {etapa === "carrinho" ? (
              <ul className="flex flex-col divide-y overflow-y-auto">
                {carrinho.map((i) => (
                  <li key={i.chave} className="flex flex-col gap-1 p-4">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{i.nome}</span>
                      <span className="tabular-nums">{brl(i.unitario * i.quantidade)}</span>
                    </div>
                    {i.descricaoOpcoes.length > 0 && <p className="text-sm text-muted-foreground">{i.descricaoOpcoes.join(" · ")}</p>}
                    {i.observacao && <p className="text-sm text-muted-foreground">Obs.: {i.observacao}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <button type="button" aria-label="Diminuir" onClick={() => mudarQtd(i.chave, -1)} className="rounded-md border p-1.5">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center tabular-nums">{i.quantidade}</span>
                      <button type="button" aria-label="Aumentar" onClick={() => mudarQtd(i.chave, 1)} className="rounded-md border p-1.5">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto p-4">
                <p className="text-sm text-muted-foreground">Tudo opcional: ajuda a cozinha e o atendente a encontrar você.</p>
                {(
                  [
                    ["clienteNome", "Seu nome", "text", 100],
                    ["clienteTelefone", "Telefone", "tel", 20],
                    ["alergias", "Alergias ou restrições", "text", 200],
                    ["observacoes", "Observações do pedido", "text", 300],
                  ] as const
                ).map(([campo, rotulo, tipo, max]) => (
                  <label key={campo} className="flex flex-col gap-1.5 text-sm font-medium">
                    {rotulo}
                    <input
                      type={tipo}
                      value={dados[campo]}
                      maxLength={max}
                      onChange={(e) => setDados((d) => ({ ...d, [campo]: e.target.value }))}
                      className="h-10 rounded-md border bg-background px-3 font-normal"
                    />
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t p-4">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3.5" /> Preparo a partir de ~{tempoCarrinho} min
                </span>
                <span className="text-lg font-semibold tabular-nums">{brl(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">O pagamento é feito no caixa.</p>
              {erro && (
                <p role="alert" className="text-sm text-destructive">
                  {erro}
                </p>
              )}
              {etapa === "carrinho" ? (
                <Button size="lg" className="h-12 text-base" disabled={!carrinho.length || !aberto} onClick={() => setEtapa("dados")}>
                  Continuar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" className="h-12" disabled={enviando} onClick={() => setEtapa("carrinho")}>
                    Voltar
                  </Button>
                  <Button size="lg" className={cn("h-12 flex-1 text-base")} disabled={enviando || !aberto} onClick={confirmar}>
                    {enviando ? "Enviando..." : "Confirmar pedido"}
                  </Button>
                </div>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
