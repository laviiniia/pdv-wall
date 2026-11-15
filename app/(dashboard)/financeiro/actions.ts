"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoForm } from "@/components/form/Formulario";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { cancelarConta, cancelarDespesa, criarDespesa, pagarConta } from "@/lib/services/financeiro.service";
import { despesaSchema, pagamentoContaSchema } from "@/lib/validations/financeiro.schema";

const revalidar = () => {
  revalidatePath("/financeiro", "layout");
  revalidatePath("/caixa", "layout");
};

export async function salvarDespesa(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await exigirPermissao(PERMISSAO.FINANCEIRO_DESPESAS);
  const bruto = Object.fromEntries(fd);
  const parsed = despesaSchema.safeParse({ ...bruto, parcelas: bruto.parcelas ?? "1" });
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await criarDespesa(parsed.data, autor, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro, campos: r.campos };
  revalidar();
  redirect(`/financeiro/despesas?mes=${parsed.data.dataDespesa.slice(0, 7)}&msg=criada&ref=${r.numero}`);
}

export async function descartarDespesa(id: number) {
  const autor = await exigirPermissao(PERMISSAO.FINANCEIRO_DESPESAS);
  if (!Number.isInteger(id)) return { ok: false as const, erro: "Despesa inválida." };
  const r = await cancelarDespesa(id, autor, await contextoRequisicao());
  if (r.ok) revalidar();
  return r;
}

export async function pagar(entrada: unknown) {
  const autor = await exigirPermissao(PERMISSAO.FINANCEIRO_PAGAR);
  const parsed = pagamentoContaSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false as const, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const r = await pagarConta(parsed.data, autor, await contextoRequisicao());
  if (r.ok) revalidar();
  return r;
}

export async function descartarConta(id: number) {
  const autor = await exigirPermissao(PERMISSAO.FINANCEIRO_PAGAR);
  if (!Number.isInteger(id)) return { ok: false as const, erro: "Conta inválida." };
  const r = await cancelarConta(id, autor, await contextoRequisicao());
  if (r.ok) revalidar();
  return r;
}
