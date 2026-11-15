import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Acompanhamento } from "@/components/cardapio/Acompanhamento";
import { getConfig } from "@/lib/services/configuracoes.service";
import { acompanharPedido } from "@/lib/services/pedidos.service";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

// Página pública de acompanhamento (MODULO_2_3, seção 6). O token na URL é o "acesso".
export default async function PedidoPage({ params }: PageProps<"/pedido/[token]">) {
  const { token } = await params;
  const [pedido, empresa] = await Promise.all([acompanharPedido(token), getConfig("empresa")]);
  if (!pedido) notFound();

  // Mesma forma que a API devolve (datas como texto), para a tela poder trocar uma pela outra.
  const inicial = JSON.parse(JSON.stringify(pedido));
  return <Acompanhamento token={token} inicial={inicial} timeZone={empresa.funcionamento.timezone} />;
}
