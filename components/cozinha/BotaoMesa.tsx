"use client";

import { useTransition } from "react";
import { alterarMesa } from "@/app/(dashboard)/pedidos-online/actions";

const CONFIRMACOES: Record<string, string> = {
  novoToken: "Gerar um QR Code novo? O QR impresso desta mesa deixa de funcionar.",
  desativar: "Desativar a mesa? O QR Code dela deixa de aceitar pedidos.",
};

export function BotaoMesa({ id, acao, rotulo }: { id: number; acao: "novoToken" | "ativar" | "desativar"; rotulo: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (CONFIRMACOES[acao] && !window.confirm(CONFIRMACOES[acao])) return;
        const fd = new FormData();
        fd.set("id", String(id));
        fd.set("acao", acao);
        startTransition(() => alterarMesa(fd));
      }}
      className="text-sm text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
    >
      {pending ? "..." : rotulo}
    </button>
  );
}
