"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";
import { NAVEGACAO } from "@/lib/constants/navegacao";
import { cn } from "@/lib/utils";

export type UsuarioNavegacao = { nome: string; email: string; role: string };

/** Props comuns à Sidebar (desktop) e à MobileNav, vindas de app/(dashboard)/layout.tsx. */
export type NavegacaoProps = {
  usuario: UsuarioNavegacao;
  hrefsPermitidos: string[];
  nomeEmpresa: string;
};

export function iniciaisDe(nome: string) {
  return (
    nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "PW"
  );
}

export function MarcaEmpresa({ nomeEmpresa }: { nomeEmpresa: string }) {
  return (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        {iniciaisDe(nomeEmpresa)}
      </span>
      <span className="truncate font-semibold" title={nomeEmpresa}>
        {nomeEmpresa}
      </span>
    </>
  );
}

/** Lista de links do menu, já filtrada pelas permissões do usuário. */
export function NavLinks({ hrefsPermitidos, onNavegar }: { hrefsPermitidos: string[]; onNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {NAVEGACAO.filter((i) => hrefsPermitidos.includes(i.href)).map(({ href, titulo, icone: Icone }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavegar}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              ativo
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icone className="size-4" />
            {titulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Rodapé com o usuário logado (link para trocar a senha) e o botão Sair. */
export function RodapeUsuario({ usuario, onNavegar }: { usuario: UsuarioNavegacao; onNavegar?: () => void }) {
  return (
    <div className="flex items-center gap-2 border-t p-3">
      <Link
        href="/trocar-senha"
        onClick={onNavegar}
        title="Alterar minha senha"
        className="min-w-0 flex-1 rounded-md hover:underline"
      >
        <p className="truncate text-sm font-medium">{usuario.nome}</p>
        <p className="truncate text-xs capitalize text-muted-foreground">{usuario.role}</p>
        <span className="sr-only">Alterar minha senha</span>
      </Link>
      <form
        action={logout}
        onSubmit={() => {
          // O carrinho do PDV fica no navegador: não deixa para o próximo operador.
          try {
            localStorage.removeItem("pdv-wall:carrinho");
          } catch {
            /* armazenamento indisponível */
          }
        }}
      >
        <button
          type="submit"
          title="Sair"
          aria-label="Sair"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
