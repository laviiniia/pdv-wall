import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Adicionais } from "@/components/produtos/Adicionais";
import { ProdutoForm } from "@/components/produtos/ProdutoForm";
import { Selo, SeloValidade } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { listarAdicionais } from "@/lib/services/pedidos.service";
import { buscarProduto, historicoProduto, listarCategoriasParaSelect } from "@/lib/services/produtos.service";
import { situacaoValidade } from "@/lib/validations/produto.schema";

export const metadata: Metadata = { title: "Produto" };

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const ROTULOS_CAMPO: Record<string, string> = {
  nome: "Nome",
  descricao: "Descrição",
  sku: "SKU",
  codigo_barras: "Código de barras",
  categoria_id: "Categoria",
  status: "Status",
  preco_custo: "Preço de custo",
  preco_venda: "Preço de venda",
  unidade_medida: "Unidade",
  quantidade_minima: "Qtd. mínima",
  data_validade: "Validade",
  lote: "Lote",
  exibir_no_cardapio: "No cardápio",
  tempo_preparo_min: "Tempo de preparo",
  controlar_estoque: "Controla estoque",
};

const ROTULOS_ACAO: Record<string, string> = {
  PRODUTO_CRIADO: "Cadastrou o produto",
  PRODUTO_EDITADO: "Editou",
  PRODUTO_DESATIVADO: "Desativou",
  PRODUTO_REATIVADO: "Reativou",
};

function formatarValor(campo: string, v: unknown, categorias: Map<number, string>) {
  if (v === null || v === undefined || v === "") return "—";
  if (campo === "categoria_id") return categorias.get(Number(v)) ?? `#${v}`;
  if (campo.startsWith("preco_")) return `R$ ${String(v).replace(".", ",")}`;
  if (campo === "data_validade") return String(v).split("-").reverse().join("/");
  return String(v);
}

export default async function ProdutoPage({ params }: PageProps<"/produtos/[id]">) {
  const { id } = await params;
  const produtoId = Number(id);
  if (!Number.isInteger(produtoId) || produtoId <= 0) notFound();

  const usuario = await exigirPermissao(PERMISSAO.PRODUTOS_VER);
  const produto = await buscarProduto(produtoId);
  if (!produto) notFound();

  const podeGerenciar = temPermissao(usuario.permissoes, PERMISSAO.PRODUTOS_GERENCIAR);
  const [categorias, financeiro, estoque, vendas, historico, adicionais] = await Promise.all([
    listarCategoriasParaSelect(produto.categoriaId),
    getConfig("financeiro"),
    getConfig("estoque"),
    getConfig("vendas"),
    historicoProduto(produtoId),
    listarAdicionais(produtoId),
  ]);
  const nomesCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const validade = situacaoValidade(produto.dataValidade, estoque.diasAlertaValidade);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <PageHeader
          titulo={produto.nome}
          descricao={[
            `${produto.sku}`,
            `Cadastrado em ${dataHora.format(produto.criadoEm)} por ${produto.criadoPor.nome}`,
            ...(produto.editadoPor ? [`Editado em ${dataHora.format(produto.editadoEm)} por ${produto.editadoPor.nome}`] : []),
          ].join(" · ")}
        />
      </div>
      <div className="-mt-3 mb-6 flex gap-1">
        {produto.status === "inativo" && <Selo tom="neutro">Inativo</Selo>}
        <SeloValidade situacao={validade} />
      </div>

      <ProdutoForm
        produto={produto}
        categorias={categorias}
        margemMinimaPct={financeiro.margemMinimaPct}
        tempoPadraoMin={vendas.tempoPreparoMin}
        podeEditar={podeGerenciar}
        podeEditarPreco={temPermissao(usuario.permissoes, PERMISSAO.PRODUTOS_EDITAR_PRECO)}
      />

      <Adicionais
        produtoId={produto.id}
        adicionais={adicionais.map((a) => ({ id: a.id, tipo: a.tipo, nome: a.nome, valor: Number(a.valor), ativo: a.ativo }))}
        podeEditar={podeGerenciar}
      />

      <section className="mt-10 max-w-3xl border-t pt-6">
        <h2 className="mb-3 text-sm font-semibold">Histórico de alterações</h2>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {historico.map((h) => {
              const dados = (h.dadosModificados ?? {}) as { alteracoes?: Record<string, { de: unknown; para: unknown }> };
              return (
                <li key={h.id} className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{h.usuario?.nome ?? "Sistema"}</span>{" "}
                    {(ROTULOS_ACAO[h.acao] ?? h.acao).toLowerCase()} em {dataHora.format(h.dataHora)}
                  </p>
                  {dados.alteracoes && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {Object.entries(dados.alteracoes).map(([campo, { de, para }]) => (
                        <li key={campo}>
                          <span className="text-muted-foreground">{ROTULOS_CAMPO[campo] ?? campo}:</span>{" "}
                          <span className="line-through decoration-muted-foreground/60">{formatarValor(campo, de, nomesCategoria)}</span>{" "}
                          → <span className="font-medium">{formatarValor(campo, para, nomesCategoria)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
