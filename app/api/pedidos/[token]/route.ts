import { acompanharPedido } from "@/lib/services/pedidos.service";

// Consulta pública do acompanhamento (a tela do cliente chama a cada poucos segundos).
// Quando houver Supabase Realtime, a tela passa a ouvir mudanças em vez de consultar.
export async function GET(_req: Request, ctx: RouteContext<"/api/pedidos/[token]">) {
  const { token } = await ctx.params;
  const pedido = await acompanharPedido(token);
  if (!pedido) return Response.json({ erro: "Pedido não encontrado" }, { status: 404 });
  return Response.json(pedido, { headers: { "Cache-Control": "no-store" } });
}
