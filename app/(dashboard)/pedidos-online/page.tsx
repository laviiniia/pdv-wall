import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { PainelCozinha } from "@/components/cozinha/PainelCozinha";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { painelCozinha, situacaoPedidosOnline } from "@/lib/services/pedidos.service";

export const metadata: Metadata = { title: "Cozinha" };

export default async function PedidosOnlinePage() {
  const usuario = await exigirPermissao(PERMISSAO.PEDIDOS_VER);
  const [painel, situacao, empresa] = await Promise.all([painelCozinha(), situacaoPedidosOnline(), getConfig("empresa")]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos online · Cozinha</h1>
          <p className="text-sm text-muted-foreground">
            {situacao.aberto
              ? `Recebendo pedidos até as ${situacao.fim}`
              : situacao.ativos
                ? `Fora do horário (${situacao.inicio}–${situacao.fim})`
                : "Pedidos pelo celular desativados em Configurações › Vendas"}
          </p>
        </div>
        {temPermissao(usuario.permissoes, PERMISSAO.MESAS_GERENCIAR) && (
          <Link href="/pedidos-online/mesas" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
            <QrCode className="size-4" /> Mesas e QR Codes
          </Link>
        )}
      </div>
      <PainelCozinha
        inicial={JSON.parse(JSON.stringify(painel))}
        podeCancelar={temPermissao(usuario.permissoes, PERMISSAO.PEDIDOS_CANCELAR)}
        timeZone={empresa.funcionamento.timezone}
      />
    </>
  );
}
