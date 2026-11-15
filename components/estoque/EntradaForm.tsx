"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salvarEntrada } from "@/app/(dashboard)/estoque/actions";
import { Button } from "@/components/ui/button";
import { lerNumero } from "@/lib/utils/numero";

type Produto = { id: number; nome: string; sku: string; unidadeMedida: string; precoCusto: number; controlarEstoque: boolean };
type Linha = { chave: number; produtoId: string; quantidade: string; preco: string; lote: string; validade: string };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const input = "h-9 rounded-md border bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function EntradaForm({
  produtos,
  fornecedores,
  hoje,
  produtoInicial,
}: {
  produtos: Produto[];
  fornecedores: { id: number; nome: string }[];
  hoje: string;
  produtoInicial?: number;
}) {
  const router = useRouter();
  const porId = new Map(produtos.map((p) => [String(p.id), p]));
  const novaLinha = (chave: number, produtoId = ""): Linha => ({
    chave,
    produtoId,
    quantidade: "",
    preco: produtoId && porId.get(produtoId) ? porId.get(produtoId)!.precoCusto.toFixed(2).replace(".", ",") : "",
    lote: "",
    validade: "",
  });

  const [fornecedor, setFornecedor] = useState("");
  const [nf, setNf] = useState("");
  const [dataCompra, setDataCompra] = useState(hoje);
  const [obs, setObs] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>(() => [novaLinha(1, produtoInicial ? String(produtoInicial) : "")]);
  const [proxima, setProxima] = useState(2);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startEnvio] = useTransition();

  const atualizar = (chave: number, m: Partial<Linha>) =>
    setLinhas((ls) =>
      ls.map((l) => {
        if (l.chave !== chave) return l;
        const nova = { ...l, ...m };
        // Ao escolher o produto, sugere o custo atual.
        if (m.produtoId && !l.preco) nova.preco = porId.get(m.produtoId)?.precoCusto.toFixed(2).replace(".", ",") ?? "";
        return nova;
      }),
    );

  const subtotal = (l: Linha) => {
    const q = lerNumero(l.quantidade) ?? 0;
    const p = lerNumero(l.preco) ?? 0;
    return Number.isFinite(q * p) ? Math.round(q * p * 100) / 100 : 0;
  };
  const total = linhas.reduce((s, l) => s + subtotal(l), 0);
  const ligamControle = linhas.map((l) => porId.get(l.produtoId)).filter((p) => p && !p.controlarEstoque);

  function enviar() {
    setErro(null);
    const existente = fornecedores.find((f) => f.nome.toLowerCase() === fornecedor.trim().toLowerCase());
    startEnvio(async () => {
      const r = await salvarEntrada({
        ...(existente ? { fornecedorId: existente.id } : { fornecedorNome: fornecedor }),
        numeroNf: nf,
        dataCompra,
        observacoes: obs,
        itens: linhas.map((l) => ({
          produtoId: Number(l.produtoId) || 0,
          quantidade: lerNumero(l.quantidade) ?? NaN,
          precoUnitario: lerNumero(l.preco) ?? NaN,
          lote: l.lote,
          dataValidade: l.validade,
        })),
      });
      if (!r.ok) return setErro(r.erro);
      router.push(`/estoque/movimentos?msg=entrada&ref=${encodeURIComponent(r.numero ?? "")}`);
    });
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Fornecedor
          <input list="fornecedores" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} maxLength={150} placeholder="Nome do fornecedor" className={input} />
          <datalist id="fornecedores">
            {fornecedores.map((f) => (
              <option key={f.id} value={f.nome} />
            ))}
          </datalist>
          <span className="text-xs font-normal text-muted-foreground">Nome novo cria o fornecedor</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nota fiscal
          <input value={nf} onChange={(e) => setNf(e.target.value)} maxLength={50} placeholder="Número da NF" className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Data da compra
          <input type="date" value={dataCompra} max={hoje} onChange={(e) => setDataCompra(e.target.value)} className={input} />
        </label>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Produtos</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium">Quantidade</th>
                <th className="px-3 py-2 font-medium">Custo unitário (R$)</th>
                <th className="px-3 py-2 font-medium">Lote</th>
                <th className="px-3 py-2 font-medium">Validade</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const p = porId.get(l.produtoId);
                return (
                  <tr key={l.chave} className="border-t">
                    <td className="px-3 py-2">
                      <select aria-label="Produto" value={l.produtoId} onChange={(e) => atualizar(l.chave, { produtoId: e.target.value })} className={`${input} w-56`}>
                        <option value="">Selecione...</option>
                        {produtos.map((x) => (
                          <option key={x.id} value={x.id}>{x.nome} ({x.sku})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1">
                        <input aria-label="Quantidade" inputMode="decimal" value={l.quantidade} onChange={(e) => atualizar(l.chave, { quantidade: e.target.value })} className={`${input} w-24 text-right`} />
                        <span className="text-xs text-muted-foreground">{p?.unidadeMedida}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label="Custo unitário" inputMode="decimal" value={l.preco} onChange={(e) => atualizar(l.chave, { preco: e.target.value })} className={`${input} w-28 text-right`} />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label="Lote" value={l.lote} maxLength={50} onChange={(e) => atualizar(l.chave, { lote: e.target.value })} className={`${input} w-32`} />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label="Validade" type="date" min={hoje} value={l.validade} onChange={(e) => atualizar(l.chave, { validade: e.target.value })} className={input} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{brl(subtotal(l))}</td>
                    <td className="px-3 py-2 text-right">
                      {linhas.length > 1 && (
                        <button type="button" aria-label="Remover linha" onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t">
              <tr>
                <td colSpan={5} className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLinhas((ls) => [...ls, novaLinha(proxima)]);
                      setProxima((n) => n + 1);
                    }}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="size-4" /> Adicionar produto
                  </button>
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{brl(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {ligamControle.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Esta entrada liga o controle de estoque de: {ligamControle.map((p) => p!.nome).join(", ")}. A partir daí, as vendas dão baixa automaticamente.
          </p>
        )}
        <p className="text-xs text-muted-foreground">O custo unitário passa a ser o preço de custo do produto (se continuar abaixo do preço de venda).</p>
      </section>

      <label className="flex max-w-xl flex-col gap-1.5 text-sm font-medium">
        Observações
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} maxLength={500} rows={2} className="rounded-md border bg-background px-3 py-2 text-sm font-normal" />
      </label>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
        <Button size="lg" onClick={enviar} disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar entrada"}
        </Button>
        <Link href="/estoque" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">Cancelar</Link>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      </div>
    </div>
  );
}
