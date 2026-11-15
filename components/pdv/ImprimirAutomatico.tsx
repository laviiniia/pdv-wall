"use client";

import { useEffect } from "react";

/** Abre a janela de impressão ao carregar (cupom aberto a partir do PDV) e oferece botão para reimprimir. */
export function ImprimirAutomatico({ automatico }: { automatico: boolean }) {
  useEffect(() => {
    if (!automatico) return;
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, [automatico]);

  return (
    <div className="mb-4 flex gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">
        Imprimir
      </button>
      <button type="button" onClick={() => window.close()} className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:underline">
        Fechar
      </button>
    </div>
  );
}
