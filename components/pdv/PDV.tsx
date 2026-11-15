"use client";

import { Minus, Package, Plus, Printer, Search, ShoppingCart, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { buscarProdutos, conferirCupom, finalizar, type ProdutoPDVSerializado } from "@/app/(dashboard)/vendas/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lerNumero } from "@/lib/utils/numero";
import { calcularTotais, type Desconto, type FormaPagamento, type PagamentoEntrada, subtotalItem } from "@/lib/vendas/calculo";
import { DialogPagamento } from "./Pagamento";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const CHAVE_CARRINHO = "pdv-wall:carrinho";
const SEM_ITENS: ItemCarrinho[] = [];
const nadaParaAssinar = () => () => {};

function lerCarrinhoSalvo(): ItemCarrinho[] {
  if (typeof window === "undefined") return [];
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? "[]");
    return Array.isArray(salvo) ? salvo : [];
  } catch {
    return [];
  }
}

type ItemCarrinho = {
  produtoId: number;
  nome: string;
  sku: string;
  icone: string | null;
  unidadeMedida: string;
  precoCentavos: number;
  quantidade: number;
};

type EstadoDesconto =
  | { tipo: "percentual" | "valor"; valor: number }
  | { tipo: "cupom"; codigo: string; descricao: string; regra: { tipo: "percentual" | "valor"; valor: number } }
  | null;

type Categoria = { id: number; nome: string; icone: string | null; corHex: string };

export function PDV({
  categorias,
  maisVendidos,
  limiteDescontoPct,
  aprovacaoAcimaDe,
  formasAceitas,
  parcelamentoMax,
  bloquearSemEstoque,
}: {
  categorias: Categoria[];
  maisVendidos: ProdutoPDVSerializado[];
  /** null = sem limite (admin). */
  limiteDescontoPct: number | null;
  /** Centavos; null = não exige aprovação. */
  aprovacaoAcimaDe: number | null;
  formasAceitas: FormaPagamento[];
  parcelamentoMax: number;
  /** Configurações › Estoque › não permitir estoque negativo. */
  bloquearSemEstoque: boolean;
}) {
  // ─── Carrinho (guardado no navegador: sobrevive a recarregar a página) ────
  // Lido na criação do estado; só é exibido depois da hidratação, para o HTML
  // do servidor (sempre com carrinho vazio) bater com a primeira renderização.
  const hidratado = useSyncExternalStore(
    nadaParaAssinar,
    () => true,
    () => false,
  );
  const [itensSalvos, setItens] = useState<ItemCarrinho[]>(lerCarrinhoSalvo);
  const itens = hidratado ? itensSalvos : SEM_ITENS;
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itensSalvos));
    } catch {
      /* armazenamento indisponível: o carrinho só não sobrevive a recarregar */
    }
  }, [itensSalvos]);

  const [removido, setRemovido] = useState<{ item: ItemCarrinho; indice: number } | null>(null);
  const [desconto, setDesconto] = useState<EstadoDesconto>(null);

  const regraDesconto: Desconto = desconto ? (desconto.tipo === "cupom" ? desconto.regra : desconto) : null;
  const totais = useMemo(() => calcularTotais(itens, regraDesconto), [itens, regraDesconto]);

  // ─── Busca ────────────────────────────────────────────────────────────────
  const buscaRef = useRef<HTMLInputElement>(null);
  const [termo, setTermo] = useState("");
  const [qtdRapida, setQtdRapida] = useState("1");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [resultados, setResultados] = useState<ProdutoPDVSerializado[]>([]);
  const [buscando, startBusca] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const t = termo.trim();
    // Busca curta sem categoria: a tela mostra "mais vendidos" e ignora os resultados antigos.
    if (!categoriaId && t.length < 2) return;
    const id = setTimeout(() => {
      startBusca(async () => {
        const r = await buscarProdutos(t, categoriaId ?? undefined);
        setResultados(r);
        // Código de barras lido pelo leitor: adiciona direto.
        if (/^\d{8,14}$/.test(t) && r.length === 1 && r[0].codigoBarras === t) {
          adicionar(r[0]);
        }
      });
    }, 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo, categoriaId]);

  // Atalhos: F2 ou "/" focam a busca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const digitando = e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if (e.key === "F2" || (e.key === "/" && !digitando)) {
        e.preventDefault();
        buscaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function adicionar(p: ProdutoPDVSerializado) {
    // Enter e leitor de código de barras também passam por aqui.
    if (bloquearSemEstoque && p.estoque !== null && p.estoque <= 0) {
      setAviso(`"${p.nome}" está sem estoque.`);
      return;
    }
    const fracionado = p.unidadeMedida !== "un";
    const lida = lerNumero(qtdRapida);
    let qtd = lida !== undefined && Number.isFinite(lida) && lida > 0 ? lida : 1;
    if (!fracionado) qtd = Math.max(1, Math.round(qtd));
    setItens((atual) => {
      const i = atual.findIndex((x) => x.produtoId === p.id);
      if (i >= 0) {
        const novo = [...atual];
        novo[i] = { ...novo[i], quantidade: Math.round((novo[i].quantidade + qtd) * 1000) / 1000 };
        return novo;
      }
      return [
        ...atual,
        {
          produtoId: p.id,
          nome: p.nome,
          sku: p.sku,
          icone: p.categoria.icone,
          unidadeMedida: p.unidadeMedida,
          precoCentavos: p.precoCentavos,
          quantidade: qtd,
        },
      ];
    });
    setTermo("");
    setQtdRapida("1");
    setAviso(null);
    buscaRef.current?.focus();
  }

  function mudarQuantidade(produtoId: number, nova: number) {
    setItens((atual) =>
      atual.map((x) => {
        if (x.produtoId !== produtoId) return x;
        const q = x.unidadeMedida === "un" ? Math.round(nova) : Math.round(nova * 1000) / 1000;
        return { ...x, quantidade: q > 0 ? q : x.quantidade };
      }),
    );
  }

  function remover(produtoId: number) {
    const indice = itens.findIndex((x) => x.produtoId === produtoId);
    if (indice < 0) return;
    setRemovido({ item: itens[indice], indice });
    setItens((atual) => atual.filter((x) => x.produtoId !== produtoId));
  }

  function desfazerRemocao() {
    if (!removido) return;
    setItens((atual) => {
      const novo = [...atual];
      novo.splice(Math.min(removido.indice, novo.length), 0, removido.item);
      return novo;
    });
    setRemovido(null);
  }

  function limpar() {
    if (itens.length && !window.confirm("Limpar todos os itens do carrinho?")) return;
    setItens([]);
    setDesconto(null);
    setRemovido(null);
    buscaRef.current?.focus();
  }

  // ─── Desconto ─────────────────────────────────────────────────────────────
  const [modoDesconto, setModoDesconto] = useState<"percentual" | "valor" | "cupom">("percentual");
  const [entradaDesconto, setEntradaDesconto] = useState("");
  const [erroDesconto, setErroDesconto] = useState<string | null>(null);
  const [conferindo, startConferir] = useTransition();

  function aplicarDesconto() {
    setErroDesconto(null);
    if (modoDesconto === "cupom") {
      const codigo = entradaDesconto.trim();
      if (!codigo) return setErroDesconto("Informe o código do cupom.");
      startConferir(async () => {
        const r = await conferirCupom(codigo, totais.subtotal);
        if (!r.ok) return setErroDesconto(r.erro);
        setDesconto({ tipo: "cupom", codigo: r.cupom.codigo, descricao: r.cupom.descricao ?? "", regra: { tipo: r.cupom.tipo, valor: r.cupom.valor } });
        setEntradaDesconto("");
      });
      return;
    }
    const v = lerNumero(entradaDesconto);
    if (v === undefined || !Number.isFinite(v) || v <= 0) return setErroDesconto("Informe um valor maior que zero.");
    const proposta = { tipo: modoDesconto, valor: v } as const;
    const prev = calcularTotais(itens, proposta);
    if (modoDesconto === "percentual" && v > 100) return setErroDesconto("Máximo de 100%.");
    if (modoDesconto === "valor" && Math.round(v * 100) > totais.subtotal) return setErroDesconto("O desconto não pode passar do subtotal.");
    if (limiteDescontoPct !== null && prev.descontoPercentual > limiteDescontoPct) {
      return setErroDesconto(`Seu limite de desconto é ${limiteDescontoPct}%.`);
    }
    if (aprovacaoAcimaDe !== null && prev.descontoValor > aprovacaoAcimaDe) {
      return setErroDesconto(`Descontos acima de ${brl(aprovacaoAcimaDe)} precisam de um gerente.`);
    }
    setDesconto(proposta);
    setEntradaDesconto("");
  }

  // ─── Finalização ──────────────────────────────────────────────────────────
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [finalizando, startFinalizar] = useTransition();
  const [erroFinal, setErroFinal] = useState<string | undefined>();
  const [concluida, setConcluida] = useState<{ id: number; numero: string; total: number; troco: number } | null>(null);

  function confirmarPagamento(pagamentos: PagamentoEntrada[]) {
    setErroFinal(undefined);
    startFinalizar(async () => {
      const r = await finalizar({
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        desconto: desconto ? (desconto.tipo === "cupom" ? { tipo: "cupom", codigo: desconto.codigo } : desconto) : null,
        pagamentos,
      });
      if (!r.ok) return setErroFinal(r.erro);
      setConcluida({ id: r.id, numero: r.numero, total: totais.total, troco: r.troco });
      setPagamentoAberto(false);
      setItens([]);
      setDesconto(null);
      setRemovido(null);
    });
  }

  function novaVenda() {
    setConcluida(null);
    setTimeout(() => buscaRef.current?.focus(), 0);
  }

  const listaProdutos = termo.trim().length >= 2 || categoriaId ? resultados : maisVendidos;
  const tituloLista =
    termo.trim().length >= 2 ? "Resultados" : categoriaId ? categorias.find((c) => c.id === categoriaId)?.nome : "Mais vendidos";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ── Coluna esquerda: busca e produtos ── */}
      <section className="flex min-w-0 flex-col gap-4" aria-label="Produtos">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Buscar produto</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={buscaRef}
              autoFocus
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && listaProdutos[0] && (termo.trim().length >= 2 || categoriaId)) {
                  e.preventDefault();
                  adicionar(listaProdutos[0]);
                }
                if (e.key === "Escape") {
                  setTermo("");
                  setCategoriaId(null);
                }
              }}
              placeholder="Nome, SKU ou código de barras (F2)"
              className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <label className="flex w-20 flex-col">
            <span className="sr-only">Quantidade a adicionar</span>
            <input
              value={qtdRapida}
              onChange={(e) => setQtdRapida(e.target.value)}
              inputMode="decimal"
              title="Quantidade a adicionar"
              className="h-11 rounded-lg border bg-background px-2 text-center text-base tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Enter adiciona o primeiro resultado · Esc limpa · a caixa ao lado define a quantidade
        </p>

        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categorias">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={categoriaId === c.id}
                onClick={() => setCategoriaId((atual) => (atual === c.id ? null : c.id))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                  categoriaId === c.id ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted",
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: c.corHex }} />
                {c.icone} {c.nome}
              </button>
            ))}
          </div>
        )}

        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {tituloLista} {buscando && <span className="font-normal">· buscando...</span>}
          </h2>
          {termo.trim().length === 1 && <p className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres.</p>}
          {listaProdutos.length === 0 && !buscando && (termo.trim().length >= 2 || categoriaId) && (
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          )}
          {listaProdutos.length === 0 && !termo.trim() && !categoriaId && (
            <p className="text-sm text-muted-foreground">Busque um produto ou escolha uma categoria.</p>
          )}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
            {listaProdutos.map((p, i) => {
              const semEstoque = p.estoque !== null && p.estoque <= 0;
              return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => adicionar(p)}
                  disabled={semEstoque && bloquearSemEstoque}
                  className={cn(
                    "flex h-full w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent",
                    i === 0 && termo.trim().length >= 2 && "border-primary/60",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span aria-hidden>{p.categoria.icone ?? <Package className="size-3" />}</span>
                    <span className="font-mono">{p.sku}</span>
                  </span>
                  <span className="line-clamp-2 text-sm font-medium">{p.nome}</span>
                  <span className="mt-auto text-sm font-semibold tabular-nums">
                    {brl(p.precoCentavos)}
                    {p.unidadeMedida !== "un" && <span className="font-normal text-muted-foreground"> /{p.unidadeMedida}</span>}
                  </span>
                  {p.estoque !== null && (
                    <span className={cn("text-xs", semEstoque ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {semEstoque ? "Sem estoque" : `Estoque: ${p.estoque.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}`}
                    </span>
                  )}
                </button>
              </li>
              );
            })}
          </ul>
          {aviso && <p className="mt-2 text-sm text-destructive">{aviso}</p>}
        </div>
      </section>

      {/* ── Coluna direita: carrinho ── */}
      <section className="flex flex-col rounded-xl border lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]" aria-label="Carrinho">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="size-4" /> Carrinho
            {itens.length > 0 && <span className="text-sm font-normal text-muted-foreground">({itens.length})</span>}
          </h2>
          {itens.length > 0 && (
            <button type="button" onClick={limpar} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" /> Limpar
            </button>
          )}
        </header>

        {concluida ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" role="status">
            <p className="text-sm text-muted-foreground">Venda finalizada</p>
            <p className="font-mono text-sm">{concluida.numero}</p>
            <p className="text-3xl font-semibold tabular-nums">{brl(concluida.total)}</p>
            {concluida.troco > 0 && (
              <p className="rounded-lg bg-amber-500/10 px-4 py-2 text-lg">
                Troco: <strong className="tabular-nums">{brl(concluida.troco)}</strong>
              </p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link
                href={`/cupom/${concluida.id}?imprimir=1`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted"
              >
                <Printer className="size-4" /> Imprimir cupom
              </Link>
              <Button size="lg" onClick={novaVenda} autoFocus>
                Nova venda
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto">
              {itens.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Carrinho vazio.</li>}
              {itens.map((i) => (
                <li key={i.produtoId} className="flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {i.icone && <span aria-hidden>{i.icone} </span>}
                      {i.nome}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remover ${i.nome}`}
                      onClick={() => remover(i.produtoId)}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Diminuir"
                        disabled={i.quantidade <= (i.unidadeMedida === "un" ? 1 : 0.001)}
                        onClick={() => mudarQuantidade(i.produtoId, i.quantidade - 1)}
                        className="rounded-md border p-1 hover:bg-muted disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <input
                        aria-label={`Quantidade de ${i.nome}`}
                        inputMode="decimal"
                        key={i.quantidade}
                        defaultValue={String(i.quantidade).replace(".", ",")}
                        onBlur={(e) => {
                          const n = lerNumero(e.target.value);
                          if (n !== undefined && Number.isFinite(n) && n > 0) mudarQuantidade(i.produtoId, n);
                          else e.target.value = String(i.quantidade).replace(".", ",");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                        className="h-7 w-14 rounded-md border bg-background text-center text-sm tabular-nums"
                      />
                      <button
                        type="button"
                        aria-label="Aumentar"
                        onClick={() => mudarQuantidade(i.produtoId, i.quantidade + 1)}
                        className="rounded-md border p-1 hover:bg-muted"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <span className="ml-1 text-xs text-muted-foreground tabular-nums">× {brl(i.precoCentavos)}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{brl(subtotalItem(i.precoCentavos, i.quantidade))}</span>
                  </div>
                </li>
              ))}
            </ul>

            {removido && (
              <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-sm">
                <span className="truncate">“{removido.item.nome}” removido</span>
                <button type="button" onClick={desfazerRemocao} className="font-medium text-primary hover:underline">
                  Desfazer
                </button>
              </div>
            )}

            {/* Desconto */}
            {itens.length > 0 && (
              <div className="flex flex-col gap-2 border-t px-4 py-3">
                {desconto ? (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      Desconto{" "}
                      <strong>
                        {desconto.tipo === "cupom"
                          ? `cupom ${desconto.codigo}`
                          : desconto.tipo === "percentual"
                            ? `${desconto.valor.toLocaleString("pt-BR")}%`
                            : brl(Math.round(desconto.valor * 100))}
                      </strong>
                    </span>
                    <button type="button" onClick={() => setDesconto(null)} className="text-muted-foreground hover:text-destructive hover:underline">
                      Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 text-xs" role="radiogroup" aria-label="Tipo de desconto">
                      {(["percentual", "valor", "cupom"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={modoDesconto === m}
                          onClick={() => {
                            setModoDesconto(m);
                            setErroDesconto(null);
                          }}
                          className={cn("rounded-md border px-2 py-0.5", modoDesconto === m ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}
                        >
                          {m === "percentual" ? "%" : m === "valor" ? "R$" : "Cupom"}
                        </button>
                      ))}
                      {limiteDescontoPct !== null && modoDesconto !== "cupom" && (
                        <span className="ml-auto self-center text-muted-foreground">Seu limite: {limiteDescontoPct}%</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={entradaDesconto}
                        onChange={(e) => setEntradaDesconto(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && aplicarDesconto()}
                        inputMode={modoDesconto === "cupom" ? "text" : "decimal"}
                        placeholder={modoDesconto === "cupom" ? "Código do cupom" : modoDesconto === "percentual" ? "Ex.: 10" : "Ex.: 5,00"}
                        className={cn("h-8 flex-1 rounded-md border bg-background px-2.5 text-sm", modoDesconto === "cupom" && "uppercase")}
                        aria-label="Valor do desconto"
                      />
                      <Button type="button" variant="outline" onClick={aplicarDesconto} disabled={conferindo}>
                        {conferindo ? "..." : "Aplicar"}
                      </Button>
                    </div>
                    {erroDesconto && <p className="text-xs text-destructive">{erroDesconto}</p>}
                  </>
                )}
              </div>
            )}

            {/* Totais */}
            <div className="flex flex-col gap-1 border-t px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{brl(totais.subtotal)}</span>
              </div>
              {totais.descontoValor > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Desconto ({totais.descontoPercentual.toLocaleString("pt-BR")}%)</span>
                  <span className="tabular-nums">− {brl(totais.descontoValor)}</span>
                </div>
              )}
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-semibold tabular-nums">{brl(totais.total)}</span>
              </div>
              <Button
                size="lg"
                className="mt-2 h-11 text-base"
                disabled={itens.length === 0}
                onClick={() => {
                  setErroFinal(undefined);
                  setPagamentoAberto(true);
                }}
              >
                Finalizar venda
              </Button>
            </div>
          </>
        )}
      </section>

      <DialogPagamento
        aberto={pagamentoAberto}
        aoMudarAberto={setPagamentoAberto}
        total={totais.total}
        formasAceitas={formasAceitas}
        parcelamentoMax={parcelamentoMax}
        aoConfirmar={confirmarPagamento}
        enviando={finalizando}
        erro={erroFinal}
      />
    </div>
  );
}
