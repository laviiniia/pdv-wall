"use server";

// Ações públicas do cliente (sem login): o "controle de acesso" é o token secreto da mesa / do pedido.
import { contextoRequisicao } from "@/lib/auth/contexto";
import { avaliarPedido, cancelarPeloCliente, criarPedido } from "@/lib/services/pedidos.service";
import { avaliacaoSchema, criarPedidoSchema } from "@/lib/validations/pedido.schema";

export async function enviarPedido(tokenMesa: string, entrada: unknown) {
  if (typeof tokenMesa !== "string") return { ok: false as const, erro: "Mesa inválida." };
  const parsed = criarPedidoSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false as const, erro: parsed.error.issues[0]?.message ?? "Pedido inválido." };
  return criarPedido(tokenMesa, parsed.data, await contextoRequisicao());
}

export async function avaliar(tokenPedido: string, entrada: unknown) {
  const parsed = avaliacaoSchema.safeParse(entrada);
  if (typeof tokenPedido !== "string" || !parsed.success) {
    return { ok: false as const, erro: parsed.success ? "Pedido inválido." : parsed.error.issues[0]?.message };
  }
  const ok = await avaliarPedido(tokenPedido, parsed.data.nota, parsed.data.texto);
  return ok ? { ok: true as const } : { ok: false as const, erro: "Este pedido não pode mais ser avaliado." };
}

export async function cancelarMeuPedido(tokenPedido: string) {
  if (typeof tokenPedido !== "string") return { ok: false as const };
  const ok = await cancelarPeloCliente(tokenPedido);
  return ok
    ? { ok: true as const }
    : { ok: false as const, erro: "A cozinha já começou a preparar seu pedido. Fale com um atendente." };
}
