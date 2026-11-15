"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoForm } from "@/components/form/Formulario";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { abrirCaixa, fecharCaixa, registrarMovimentoCaixa } from "@/lib/services/caixa.service";
import { abrirCaixaSchema, fecharCaixaSchema, movimentoCaixaSchema } from "@/lib/validations/financeiro.schema";

const revalidar = () => {
  revalidatePath("/caixa", "layout");
  revalidatePath("/vendas");
  revalidatePath("/financeiro", "layout");
};

export async function abrir(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const usuario = await exigirPermissao(PERMISSAO.CAIXA_OPERAR);
  const parsed = abrirCaixaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await abrirCaixa(parsed.data, usuario, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro };
  revalidar();
  redirect("/caixa?msg=aberto");
}

export async function movimentar(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const usuario = await exigirPermissao(PERMISSAO.CAIXA_OPERAR);
  const parsed = movimentoCaixaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await registrarMovimentoCaixa(parsed.data, usuario, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro };
  revalidar();
  redirect(`/caixa?msg=${parsed.data.tipo}`);
}

export async function fechar(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const usuario = await exigirPermissao(PERMISSAO.CAIXA_OPERAR);
  const parsed = fecharCaixaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const r = await fecharCaixa(parsed.data, usuario, await contextoRequisicao());
  if (!r.ok) return { erro: r.erro };
  revalidar();
  redirect(`/caixa/${parsed.data.sessaoId}?msg=fechado`);
}
