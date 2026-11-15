import type { Metadata } from "next";
import { Cardapio } from "@/components/cardapio/Cardapio";
import { buscarMesaPorToken, carregarCardapio, situacaoPedidosOnline } from "@/lib/services/pedidos.service";

export const metadata: Metadata = { title: "Cardápio" };

// Página pública aberta pelo QR Code da mesa (MODULO_2_3, seção 2). Sem login.
export default async function MesaPage({ params }: PageProps<"/mesa/[token]">) {
  const { token } = await params;
  const mesa = await buscarMesaPorToken(token);

  if (!mesa || !mesa.ativa) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">QR Code inválido</h1>
        <p className="text-sm text-muted-foreground">Este QR Code não está mais ativo. Peça ajuda a um atendente.</p>
      </main>
    );
  }

  const [situacao, produtos] = await Promise.all([situacaoPedidosOnline(), carregarCardapio()]);
  const avisoFechado = !situacao.ativos
    ? "Os pedidos pelo celular estão desativados no momento. Fale com um atendente."
    : `Recebemos pedidos pelo celular das ${situacao.inicio} às ${situacao.fim}. Você pode ver o cardápio.`;

  return (
    <Cardapio
      tokenMesa={token}
      numeroMesa={mesa.numero}
      nomeEmpresa={situacao.nomeEmpresa}
      produtos={produtos}
      aberto={situacao.aberto}
      avisoFechado={avisoFechado}
      tempoPadraoMin={situacao.tempoPadraoMin}
    />
  );
}
