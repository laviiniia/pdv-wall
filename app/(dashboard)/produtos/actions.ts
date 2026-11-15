"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoForm } from "@/components/form/Formulario";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import {
  alterarStatusProduto,
  criarCategoria,
  criarProduto,
  editarCategoria,
  editarProduto,
  excluirCategoria,
} from "@/lib/services/produtos.service";
import { categoriaSchema, produtoSchema } from "@/lib/validations/produto.schema";

const gerente = () => exigirPermissao(PERMISSAO.PRODUTOS_GERENCIAR);

function lerProduto(fd: FormData) {
  return produtoSchema.safeParse({
    nome: fd.get("nome"),
    descricao: fd.get("descricao"),
    sku: fd.get("sku"),
    codigoBarras: fd.get("codigoBarras"),
    categoriaId: fd.get("categoriaId"),
    ativo: fd.get("ativo"),
    precoCusto: fd.get("precoCusto"),
    precoVenda: fd.get("precoVenda"),
    unidadeMedida: fd.get("unidadeMedida"),
    quantidadeMinima: fd.get("quantidadeMinima"),
    dataValidade: fd.get("dataValidade"),
    lote: fd.get("lote"),
  });
}

const ERRO_CAMPOS = "Corrija os campos destacados.";

export async function salvarProduto(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await gerente();
  const parsed = lerProduto(fd);
  if (!parsed.success) return { erro: ERRO_CAMPOS, campos: z.flattenError(parsed.error).fieldErrors };

  const id = Number(fd.get("id"));
  const ctx = await contextoRequisicao();

  if (!id) {
    const r = await criarProduto(parsed.data, autor, ctx);
    if (!r.ok) return { erro: r.erro ?? ERRO_CAMPOS, campos: r.campos };
    revalidatePath("/produtos");
    redirect(`/produtos?msg=criado&destaque=${r.id}`);
  }

  const r = await editarProduto(id, parsed.data, autor, ctx);
  if (!r.ok) return { erro: r.erro ?? ERRO_CAMPOS, campos: r.campos };
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
  return { ok: true, mensagem: r.alterados === 0 ? "Nada foi alterado." : "Produto salvo." };
}

export async function definirStatusProduto(fd: FormData) {
  const autor = await gerente();
  const id = Number(fd.get("id"));
  const ativo = fd.get("ativo") === "true";
  if (!Number.isInteger(id) || id <= 0) return;
  await alterarStatusProduto(id, ativo, autor, await contextoRequisicao());
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
}

function lerCategoria(fd: FormData) {
  return categoriaSchema.safeParse({
    nome: fd.get("nome"),
    descricao: fd.get("descricao"),
    corHex: fd.get("corHex"),
    icone: fd.get("icone"),
    ativa: fd.get("ativa"),
  });
}

export async function salvarCategoria(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await gerente();
  const parsed = lerCategoria(fd);
  if (!parsed.success) return { erro: ERRO_CAMPOS, campos: z.flattenError(parsed.error).fieldErrors };

  const id = Number(fd.get("id"));
  const ctx = await contextoRequisicao();
  const r = id ? await editarCategoria(id, parsed.data, autor, ctx) : await criarCategoria(parsed.data, autor, ctx);
  if (!r.ok) return { erro: r.erro ?? ERRO_CAMPOS, campos: r.campos };

  revalidatePath("/produtos", "layout");
  redirect(`/produtos/categorias?msg=${id ? "atualizada" : "criada"}`);
}

export async function removerCategoria(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await gerente();
  const id = Number(fd.get("id"));
  const r = await excluirCategoria(id, autor, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro };
  revalidatePath("/produtos", "layout");
  redirect("/produtos/categorias?msg=excluida");
}
