import { usuarioAtualOuNull } from "@/lib/auth/dal";
import { painelCozinha, podeVerCozinha } from "@/lib/services/pedidos.service";

// Dados do painel da cozinha (consultado a cada poucos segundos pela tela).
export async function GET() {
  const usuario = await usuarioAtualOuNull();
  if (!usuario) return Response.json({ erro: "Sessão expirada" }, { status: 401 });
  if (!podeVerCozinha(usuario)) return Response.json({ erro: "Sem permissão" }, { status: 403 });
  return Response.json(await painelCozinha(), { headers: { "Cache-Control": "no-store" } });
}
