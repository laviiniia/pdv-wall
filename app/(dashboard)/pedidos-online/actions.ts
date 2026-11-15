"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EstadoForm } from "@/components/form/Formulario";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao, getUsuarioAtual } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import type { StatusPedido } from "@/lib/pedidos/fila";
import { atualizarMesa, criarAdicional, criarMesas, mudarStatusPedido, removerAdicional } from "@/lib/services/pedidos.service";
import { adicionalSchema } from "@/lib/validations/pedido.schema";

const STATUS = ["confirmado", "preparando", "pausado", "pronto", "entregue", "cancelado"] as const;

export async function mudarStatus(id: number, novo: StatusPedido, motivo?: string) {
  const usuario = await getUsuarioAtual();
  if (!Number.isInteger(id) || !STATUS.includes(novo)) return { ok: false as const, erro: "Dados inválidos." };
  return mudarStatusPedido(id, novo, usuario, await contextoRequisicao(), typeof motivo === "string" ? motivo.slice(0, 300) : undefined);
}

const criarMesasSchema = z
  .object({
    de: z.coerce.number().int().min(1, "Mínimo 1").max(999),
    ate: z.coerce.number().int().min(1).max(999, "Máximo 999"),
    capacidade: z.coerce.number().int().min(1, "Mínimo 1").max(50),
  })
  .refine((d) => d.ate >= d.de, { message: "Deve ser maior ou igual ao início", path: ["ate"] })
  .refine((d) => d.ate - d.de < 100, { message: "Crie no máximo 100 mesas por vez", path: ["ate"] });

export async function adicionarMesas(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const autor = await exigirPermissao(PERMISSAO.MESAS_GERENCIAR);
  const parsed = criarMesasSchema.safeParse({ de: fd.get("de"), ate: fd.get("ate"), capacidade: fd.get("capacidade") });
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  const n = await criarMesas(parsed.data.de, parsed.data.ate, parsed.data.capacidade, autor);
  revalidatePath("/pedidos-online/mesas");
  return { ok: true, mensagem: n === 0 ? "Essas mesas já existiam." : `${n} mesa(s) criada(s).` };
}

export async function alterarMesa(fd: FormData) {
  const autor = await exigirPermissao(PERMISSAO.MESAS_GERENCIAR);
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const acao = fd.get("acao");
  if (acao === "novoToken") await atualizarMesa(id, { novoToken: true }, autor);
  else if (acao === "ativar" || acao === "desativar") await atualizarMesa(id, { ativa: acao === "ativar" }, autor);
  revalidatePath("/pedidos-online/mesas");
}

export async function salvarAdicional(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await exigirPermissao(PERMISSAO.PRODUTOS_GERENCIAR);
  const parsed = adicionalSchema.safeParse({
    produtoId: fd.get("produtoId"),
    tipo: fd.get("tipo"),
    nome: fd.get("nome"),
    valor: fd.get("valor"),
  });
  if (!parsed.success) return { erro: "Corrija os campos destacados.", campos: z.flattenError(parsed.error).fieldErrors };
  await criarAdicional(parsed.data);
  revalidatePath(`/produtos/${parsed.data.produtoId}`);
  return { ok: true, mensagem: "Opção adicionada." };
}

export async function excluirAdicional(fd: FormData) {
  await exigirPermissao(PERMISSAO.PRODUTOS_GERENCIAR);
  const id = Number(fd.get("id"));
  const produtoId = Number(fd.get("produtoId"));
  if (!Number.isInteger(id)) return;
  await removerAdicional(id);
  revalidatePath(`/produtos/${produtoId}`);
}
