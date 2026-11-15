"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoForm } from "@/components/form/Formulario";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import {
  cancelarInventario,
  desfazerMovimento,
  finalizarInventario,
  iniciarInventario,
  registrarEntrada,
  registrarSaida,
  salvarContagem,
} from "@/lib/services/estoque.service";
import { lerNumero } from "@/lib/utils/numero";
import { contagemSchema, entradaSchema, saidaSchema } from "@/lib/validations/estoque.schema";

const revalidar = () => {
  revalidatePath("/estoque", "layout");
  revalidatePath("/produtos", "layout");
  revalidatePath("/vendas");
};

export async function salvarEntrada(entrada: unknown) {
  const autor = await exigirPermissao(PERMISSAO.ESTOQUE_ENTRADA);
  const parsed = entradaSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false as const, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const r = await registrarEntrada(parsed.data, autor, await contextoRequisicao());
  if (r.ok) revalidar();
  return r;
}

export async function salvarSaida(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const qtd = typeof fd.get("quantidade") === "string" ? lerNumero(String(fd.get("quantidade"))) : undefined;
  const parsed = saidaSchema.safeParse({
    tipo: fd.get("tipo"),
    produtoId: fd.get("produtoId"),
    direcao: fd.get("direcao") ?? undefined,
    quantidade: qtd,
    motivo: fd.get("motivo"),
  });
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await registrarSaida(parsed.data, autor, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro };
  revalidar();
  redirect("/estoque/movimentos?msg=saida");
}

export async function desfazer(id: number, motivo: string) {
  const autor = await exigirPermissao(PERMISSAO.ESTOQUE_DESFAZER);
  if (!Number.isInteger(id) || typeof motivo !== "string" || motivo.trim().length < 3) {
    return { ok: false as const, erro: "Informe o motivo (mínimo 3 caracteres)." };
  }
  const r = await desfazerMovimento(id, motivo.trim().slice(0, 300), autor, await contextoRequisicao());
  if (r.ok) revalidar();
  return r;
}

export async function novoInventario(fd: FormData) {
  const autor = await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const categoriaId = Number(fd.get("categoriaId")) || null;
  const r = await iniciarInventario(categoriaId, autor, await contextoRequisicao());
  if (!r.ok) redirect(`/estoque/inventario?erro=${encodeURIComponent(r.erro)}`);
  redirect(`/estoque/inventario/${r.id}`);
}

export async function gravarContagem(entrada: unknown) {
  await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const parsed = contagemSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false as const, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const r = await salvarContagem(parsed.data.inventarioId, parsed.data.contagens);
  if (r.ok) revalidatePath(`/estoque/inventario/${parsed.data.inventarioId}`);
  return r;
}

export async function concluirInventario(inventarioId: number) {
  const autor = await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  if (!Number.isInteger(inventarioId)) return { ok: false as const, erro: "Inventário inválido." };
  const r = await finalizarInventario(inventarioId, autor, await contextoRequisicao());
  if (r.ok) revalidar();
  return r;
}

export async function descartarInventario(inventarioId: number) {
  const autor = await exigirPermissao(PERMISSAO.ESTOQUE_AJUSTAR);
  const ok = await cancelarInventario(inventarioId, autor, await contextoRequisicao());
  revalidatePath("/estoque/inventario", "layout");
  return ok;
}
