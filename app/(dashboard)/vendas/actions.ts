"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoForm } from "@/components/form/Formulario";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao, getUsuarioAtual } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import {
  alternarCupom,
  buscarProdutosPDV,
  cancelarVenda,
  criarCupom,
  finalizarVenda,
  paraPDV,
  type ProdutoPDVSerializado,
  validarCupom,
} from "@/lib/services/vendas.service";
import { cancelarVendaSchema, cupomSchema, finalizarVendaSchema } from "@/lib/validations/venda.schema";

export type { ProdutoPDVSerializado };
const serializar = paraPDV;

export async function buscarProdutos(termo: string, categoriaId?: number): Promise<ProdutoPDVSerializado[]> {
  await exigirPermissao(PERMISSAO.VENDAS_CRIAR);
  if (typeof termo !== "string" || termo.length > 100) return [];
  return (await buscarProdutosPDV(termo, categoriaId)).map(serializar);
}

export async function conferirCupom(codigo: string, subtotalCentavos: number) {
  await exigirPermissao(PERMISSAO.VENDAS_CRIAR);
  if (typeof codigo !== "string" || !codigo.trim() || !Number.isInteger(subtotalCentavos)) {
    return { ok: false as const, erro: "Informe o código do cupom." };
  }
  return validarCupom(codigo, subtotalCentavos);
}

export async function finalizar(entrada: unknown) {
  const usuario = await getUsuarioAtual();
  const parsed = finalizarVendaSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false as const, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const r = await finalizarVenda(parsed.data, usuario, await contextoRequisicao());
  if (r.ok) revalidatePath("/vendas", "layout");
  return r;
}

export async function cancelar(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const usuario = await getUsuarioAtual();
  const parsed = cancelarVendaSchema.safeParse({ id: fd.get("id"), motivo: fd.get("motivo") });
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await cancelarVenda(parsed.data.id, parsed.data.motivo, usuario, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro };
  revalidatePath("/vendas", "layout");
  return { ok: true, mensagem: "Venda cancelada." };
}

export async function salvarCupom(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await exigirPermissao(PERMISSAO.CUPONS_GERENCIAR);
  const parsed = cupomSchema.safeParse({
    codigo: fd.get("codigo"),
    descricao: fd.get("descricao"),
    tipo: fd.get("tipo"),
    valor: fd.get("valor"),
    valorMinimo: fd.get("valorMinimo"),
    usosMaximos: fd.get("usosMaximos"),
    inicio: fd.get("inicio"),
    expiracao: fd.get("expiracao"),
    ativo: fd.get("ativo"),
  });
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await criarCupom(parsed.data, autor, await contextoRequisicao());
  if (!r.ok) return { erro: "Corrija os campos destacados.", campos: r.campos };
  revalidatePath("/vendas/cupons");
  redirect("/vendas/cupons?msg=criado");
}

export async function definirAtivoCupom(fd: FormData) {
  const autor = await exigirPermissao(PERMISSAO.CUPONS_GERENCIAR);
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await alternarCupom(id, fd.get("ativo") === "true", autor, await contextoRequisicao());
  revalidatePath("/vendas/cupons");
}
