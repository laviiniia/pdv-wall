import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CategoriaInput, ProdutoInput } from "@/lib/validations/produto.schema";
import type { ContextoRequisicao } from "./auth.service";

type Autor = { id: number; email: string };
type Campos = Record<string, string[]>;

// ─── Listagem ───────────────────────────────────────────────────────────────

export const POR_PAGINA = 20;
export const ORDENACOES = { nome: "Nome", preco: "Preço de venda", lucro: "Margem" } as const;
export type Ordenacao = keyof typeof ORDENACOES;

export type FiltroProdutos = {
  busca?: string;
  categoriaId?: number;
  status?: "ativos" | "inativos" | "todos";
  ordenar?: Ordenacao;
  pagina?: number;
};

export async function listarProdutos({ busca, categoriaId, status = "ativos", ordenar = "nome", pagina = 1 }: FiltroProdutos) {
  const where: Prisma.ProdutoWhereInput = {
    ...(status === "ativos" && { status: "ativo" }),
    ...(status === "inativos" && { status: "inativo" }),
    ...(categoriaId && { categoriaId }),
    ...(busca && {
      OR: [
        { nome: { contains: busca, mode: "insensitive" } },
        { sku: { contains: busca, mode: "insensitive" } },
      ],
    }),
  };

  const total = await prisma.produto.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas);
  const select = {
    id: true,
    nome: true,
    sku: true,
    status: true,
    precoCusto: true,
    precoVenda: true,
    dataValidade: true,
    imagemPath: true,
    categoria: { select: { nome: true, corHex: true, icone: true } },
  } satisfies Prisma.ProdutoSelect;

  // Margem é calculada (não armazenada): ordenar por ela exige SQL.
  let produtos;
  if (ordenar === "lucro") {
    const ids = await idsOrdenadosPorMargem(where, paginaAtual);
    const porId = new Map(
      (await prisma.produto.findMany({ where: { id: { in: ids } }, select })).map((p) => [p.id, p]),
    );
    produtos = ids.map((id) => porId.get(id)!).filter(Boolean);
  } else {
    produtos = await prisma.produto.findMany({
      where,
      select,
      orderBy: ordenar === "preco" ? [{ precoVenda: "desc" }, { nome: "asc" }] : [{ nome: "asc" }],
      skip: (paginaAtual - 1) * POR_PAGINA,
      take: POR_PAGINA,
    });
  }

  return { produtos, total, pagina: paginaAtual, totalPaginas };
}

/** Ids da página ordenados pela margem (% sobre o custo), respeitando os mesmos filtros. */
async function idsOrdenadosPorMargem(where: Prisma.ProdutoWhereInput, pagina: number) {
  const candidatos = await prisma.produto.findMany({ where, select: { id: true, precoCusto: true, precoVenda: true, nome: true } });
  return candidatos
    .map((p) => ({ id: p.id, nome: p.nome, pct: (Number(p.precoVenda) - Number(p.precoCusto)) / Number(p.precoCusto) }))
    .sort((a, b) => b.pct - a.pct || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
    .map((p) => p.id);
}

export function buscarProduto(id: number) {
  return prisma.produto.findUnique({
    where: { id },
    include: {
      categoria: { select: { id: true, nome: true } },
      criadoPor: { select: { nome: true } },
      editadoPor: { select: { nome: true } },
    },
  });
}

export function listarCategoriasParaSelect(incluirId?: number) {
  return prisma.categoria.findMany({
    // categorias inativas não aparecem para novos produtos, mas a atual do produto sim
    where: { OR: [{ ativa: true }, ...(incluirId ? [{ id: incluirId }] : [])] },
    select: { id: true, nome: true, icone: true, ativa: true },
    orderBy: { nome: "asc" },
  });
}

/** Histórico de alterações de um produto, a partir da tabela de auditoria. */
export function historicoProduto(id: number) {
  return prisma.auditoria.findMany({
    where: { modulo: "PRODUTOS", dadosModificados: { path: ["produto_id"], equals: id } },
    orderBy: { dataHora: "desc" },
    take: 50,
    select: { id: true, acao: true, dataHora: true, dadosModificados: true, usuario: { select: { nome: true } } },
  });
}

// ─── Escrita de produtos ────────────────────────────────────────────────────

export type ResultadoProduto = { ok: true; id: number } | { ok: false; campos?: Campos; erro?: string };

const paraData = (d?: string) => (d ? new Date(`${d}T00:00:00.000Z`) : null);
const hojeISO = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

async function validarUnicidadeECategoria(dados: ProdutoInput, ignorarId?: number): Promise<Campos | null> {
  const campos: Campos = {};
  const outro = { ...(ignorarId && { id: { not: ignorarId } }) };
  const [mesmoNome, mesmoSku, mesmoCodigo, categoria] = await Promise.all([
    prisma.produto.findFirst({ where: { ...outro, nome: { equals: dados.nome, mode: "insensitive" } }, select: { id: true } }),
    prisma.produto.findFirst({ where: { ...outro, sku: dados.sku }, select: { id: true } }),
    dados.codigoBarras
      ? prisma.produto.findFirst({ where: { ...outro, codigoBarras: dados.codigoBarras }, select: { nome: true } })
      : null,
    prisma.categoria.findUnique({ where: { id: dados.categoriaId }, select: { id: true } }),
  ]);
  if (mesmoNome) campos.nome = ["Já existe um produto com este nome"];
  if (mesmoSku) campos.sku = ["Já existe um produto com este SKU"];
  if (mesmoCodigo) campos.codigoBarras = [`Código já usado por "${mesmoCodigo.nome}"`];
  if (!categoria) campos.categoriaId = ["Categoria não encontrada"];
  return Object.keys(campos).length ? campos : null;
}

/** Converte violações de unicidade/CHECK do banco (corridas) em erros de campo. */
function traduzirErroBanco(e: unknown): ResultadoProduto | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const alvo = JSON.stringify(e.meta ?? {});
    if (alvo.includes("codigo_barras") || alvo.includes("codigoBarras")) {
      return { ok: false, campos: { codigoBarras: ["Código de barras já usado por outro produto"] } };
    }
    return { ok: false, campos: alvo.includes("sku") ? { sku: ["Já existe um produto com este SKU"] } : { nome: ["Já existe um produto com este nome"] } };
  }
  if (e instanceof Error && /produtos_preco_(venda_maior|custo_positivo)/.test(e.message)) {
    return { ok: false, campos: { precoVenda: ["O preço de venda deve ser maior que o preço de custo"] } };
  }
  return null;
}

function dadosProduto(d: ProdutoInput) {
  return {
    nome: d.nome,
    descricao: d.descricao ?? null,
    sku: d.sku,
    codigoBarras: d.codigoBarras ?? null,
    categoriaId: d.categoriaId,
    status: d.ativo ? ("ativo" as const) : ("inativo" as const),
    precoCusto: new Prisma.Decimal(d.precoCusto.toFixed(2)),
    precoVenda: new Prisma.Decimal(d.precoVenda.toFixed(2)),
    unidadeMedida: d.unidadeMedida,
    quantidadeMinima: d.quantidadeMinima,
    dataValidade: paraData(d.dataValidade),
    lote: d.lote ?? null,
  };
}

const ERRO_VALIDADE = { dataValidade: ["A validade deve ser uma data futura"] };

export async function criarProduto(dados: ProdutoInput, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoProduto> {
  // Junta todos os problemas para mostrar de uma vez (validade + nome/SKU/categoria).
  const validadeInvalida = !!dados.dataValidade && dados.dataValidade <= hojeISO();
  const conflito = await validarUnicidadeECategoria(dados);
  if (validadeInvalida || conflito) {
    return { ok: false, campos: { ...conflito, ...(validadeInvalida && ERRO_VALIDADE) } };
  }

  try {
    const produto = await prisma.produto.create({ data: { ...dadosProduto(dados), criadoPorId: autor.id } });
    await auditar("PRODUTO_CRIADO", autor, ctx, { produto_id: produto.id, sku: produto.sku, nome: produto.nome });
    return { ok: true, id: produto.id };
  } catch (e) {
    const traduzido = traduzirErroBanco(e);
    if (traduzido) return traduzido;
    throw e;
  }
}

export async function editarProduto(
  id: number,
  dados: ProdutoInput,
  autor: Autor,
  ctx: ContextoRequisicao,
): Promise<ResultadoProduto & { alterados?: number }> {
  const atual = await prisma.produto.findUnique({ where: { id } });
  if (!atual) return { ok: false, erro: "Produto não encontrado." };

  const novaValidade = dados.dataValidade ?? null;
  const validadeAtual = atual.dataValidade?.toISOString().slice(0, 10) ?? null;
  // Só exige data futura se a validade foi alterada (permite salvar produto já vencido sem mexer na data).
  const validadeInvalida = !!novaValidade && novaValidade !== validadeAtual && novaValidade <= hojeISO();
  const conflito = await validarUnicidadeECategoria(dados, id);
  if (validadeInvalida || conflito) {
    return { ok: false, campos: { ...conflito, ...(validadeInvalida && ERRO_VALIDADE) } };
  }

  const novo = dadosProduto(dados);
  const comparavel = (p: typeof novo | typeof atual) => ({
    nome: p.nome,
    descricao: p.descricao ?? null,
    sku: p.sku,
    codigo_barras: p.codigoBarras ?? null,
    categoria_id: p.categoriaId,
    status: p.status,
    preco_custo: Number(p.precoCusto).toFixed(2),
    preco_venda: Number(p.precoVenda).toFixed(2),
    unidade_medida: p.unidadeMedida,
    quantidade_minima: p.quantidadeMinima,
    data_validade: p.dataValidade?.toISOString().slice(0, 10) ?? null,
    lote: p.lote ?? null,
  });
  const antes = comparavel(atual);
  const depois = comparavel(novo);
  const alteracoes = Object.fromEntries(
    (Object.keys(depois) as (keyof typeof depois)[])
      .filter((k) => antes[k] !== depois[k])
      .map((k) => [k, { de: antes[k], para: depois[k] }]),
  );
  if (Object.keys(alteracoes).length === 0) return { ok: true, id, alterados: 0 };

  try {
    await prisma.produto.update({ where: { id }, data: { ...novo, editadoPorId: autor.id } });
  } catch (e) {
    const traduzido = traduzirErroBanco(e);
    if (traduzido) return traduzido;
    throw e;
  }
  const acao = "status" in alteracoes ? (dados.ativo ? "PRODUTO_REATIVADO" : "PRODUTO_DESATIVADO") : "PRODUTO_EDITADO";
  await auditar(acao, autor, ctx, { produto_id: id, alteracoes });
  return { ok: true, id, alterados: Object.keys(alteracoes).length };
}

/** Desativar/reativar direto da lista (soft delete, seção 2.1.2). */
export async function alterarStatusProduto(id: number, ativo: boolean, autor: Autor, ctx: ContextoRequisicao) {
  const atual = await prisma.produto.findUnique({ where: { id }, select: { status: true } });
  if (!atual) return false;
  const status = ativo ? "ativo" : "inativo";
  if (atual.status === status) return true;
  await prisma.produto.update({ where: { id }, data: { status, editadoPorId: autor.id } });
  await auditar(ativo ? "PRODUTO_REATIVADO" : "PRODUTO_DESATIVADO", autor, ctx, {
    produto_id: id,
    alteracoes: { status: { de: atual.status, para: status } },
  });
  return true;
}

// ─── Categorias ─────────────────────────────────────────────────────────────

export async function listarCategorias(status: "ativas" | "todas" = "todas", ordenar: "nome" | "produtos" = "nome") {
  const categorias = await prisma.categoria.findMany({
    where: status === "ativas" ? { ativa: true } : {},
    include: { _count: { select: { produtos: true } } },
    orderBy: ordenar === "produtos" ? [{ produtos: { _count: "desc" } }, { nome: "asc" }] : { nome: "asc" },
  });
  return categorias;
}

export function buscarCategoria(id: number) {
  return prisma.categoria.findUnique({
    where: { id },
    include: {
      _count: { select: { produtos: true } },
      criadoPor: { select: { nome: true } },
      editadoPor: { select: { nome: true } },
    },
  });
}

export type ResultadoCategoria = { ok: true; id: number } | { ok: false; campos?: Campos; erro?: string };

async function nomeCategoriaEmUso(nome: string, ignorarId?: number) {
  return !!(await prisma.categoria.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" }, ...(ignorarId && { id: { not: ignorarId } }) },
    select: { id: true },
  }));
}

const erroNomeCategoria = { ok: false as const, campos: { nome: ["Já existe uma categoria com este nome"] } };

export async function criarCategoria(dados: CategoriaInput, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoCategoria> {
  if (await nomeCategoriaEmUso(dados.nome)) return erroNomeCategoria;
  try {
    const c = await prisma.categoria.create({
      data: {
        nome: dados.nome,
        descricao: dados.descricao ?? null,
        corHex: dados.corHex,
        icone: dados.icone ?? null,
        ativa: dados.ativa,
        criadoPorId: autor.id,
      },
    });
    await auditar("CATEGORIA_CRIADA", autor, ctx, { categoria_id: c.id, nome: c.nome });
    return { ok: true, id: c.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return erroNomeCategoria;
    throw e;
  }
}

export async function editarCategoria(id: number, dados: CategoriaInput, autor: Autor, ctx: ContextoRequisicao): Promise<ResultadoCategoria> {
  const atual = await prisma.categoria.findUnique({ where: { id } });
  if (!atual) return { ok: false, erro: "Categoria não encontrada." };
  if (await nomeCategoriaEmUso(dados.nome, id)) return erroNomeCategoria;

  const antes = { nome: atual.nome, descricao: atual.descricao, cor_hex: atual.corHex, icone: atual.icone, ativa: atual.ativa };
  const depois = { nome: dados.nome, descricao: dados.descricao ?? null, cor_hex: dados.corHex, icone: dados.icone ?? null, ativa: dados.ativa };
  const alteracoes = Object.fromEntries(
    (Object.keys(depois) as (keyof typeof depois)[])
      .filter((k) => antes[k] !== depois[k])
      .map((k) => [k, { de: antes[k], para: depois[k] }]),
  );
  if (Object.keys(alteracoes).length === 0) return { ok: true, id };

  try {
    await prisma.categoria.update({
      where: { id },
      data: { nome: depois.nome, descricao: depois.descricao, corHex: depois.cor_hex, icone: depois.icone, ativa: depois.ativa, editadoPorId: autor.id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return erroNomeCategoria;
    throw e;
  }
  await auditar("CATEGORIA_EDITADA", autor, ctx, { categoria_id: id, alteracoes });
  return { ok: true, id };
}

/** Exclui só categoria sem produtos (seção 3.1.2); com produtos, orienta a desativar. */
export async function excluirCategoria(id: number, autor: Autor, ctx: ContextoRequisicao) {
  const c = await prisma.categoria.findUnique({ where: { id }, include: { _count: { select: { produtos: true } } } });
  if (!c) return { ok: false as const, erro: "Categoria não encontrada." };
  if (c._count.produtos > 0) {
    return {
      ok: false as const,
      erro: `Não é possível excluir: existem ${c._count.produtos} produto(s) nesta categoria. Desative a categoria ou mude os produtos de categoria.`,
    };
  }
  try {
    await prisma.categoria.delete({ where: { id } });
  } catch (e) {
    // produto criado nesta categoria entre a checagem e o delete
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false as const, erro: "A categoria passou a ter produtos. Atualize a página." };
    }
    throw e;
  }
  await auditar("CATEGORIA_EXCLUIDA", autor, ctx, { categoria_id: id, nome: c.nome });
  return { ok: true as const };
}

function auditar(acao: string, autor: Autor, ctx: ContextoRequisicao, dados: Prisma.InputJsonObject) {
  return prisma.auditoria.create({
    data: {
      acao,
      modulo: acao.startsWith("CATEGORIA") ? "CATEGORIAS" : "PRODUTOS",
      usuarioId: autor.id,
      emailUsuario: autor.email,
      dadosModificados: dados,
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
}
