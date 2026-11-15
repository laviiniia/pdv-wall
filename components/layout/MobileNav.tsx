"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MarcaEmpresa, NavLinks, type NavegacaoProps, RodapeUsuario } from "./NavLinks";

/**
 * Cabeçalho fixo + menu em painel lateral, só abaixo de `md` (a Sidebar cobre o desktop).
 * O Dialog do Base UI cuida de prender o foco, fechar com Esc / clique fora e dos
 * atributos aria-expanded / aria-controls do botão.
 */
export function MobileNav({ usuario, hrefsPermitidos, nomeEmpresa }: NavegacaoProps) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // Fecha também quando a rota muda por outro caminho (voltar do navegador, redirect...).
  const [rotaAnterior, setRotaAnterior] = useState(pathname);
  if (rotaAnterior !== pathname) {
    setRotaAnterior(pathname);
    setAberto(false);
  }

  const fechar = () => setAberto(false);

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto}>
      <header className="sticky top-0 z-40 flex print:hidden h-14 items-center gap-2 border-b bg-sidebar px-4 text-sidebar-foreground md:hidden">
        <Dialog.Trigger
          aria-label="Abrir menu"
          className="-ml-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Menu className="size-5" />
        </Dialog.Trigger>
        <MarcaEmpresa nomeEmpresa={nomeEmpresa} />
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 md:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none transition-transform duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full md:hidden">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <Dialog.Title className="flex min-w-0 flex-1 items-center gap-2 text-base">
              <MarcaEmpresa nomeEmpresa={nomeEmpresa} />
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar menu"
              className="-mr-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <NavLinks hrefsPermitidos={hrefsPermitidos} onNavegar={fechar} />
          <RodapeUsuario usuario={usuario} onNavegar={fechar} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
