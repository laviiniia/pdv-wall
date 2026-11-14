"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";
import { NAVEGACAO } from "@/lib/constants/navegacao";
import { cn } from "@/lib/utils";

type UsuarioSidebar = { nome: string; email: string; role: string };

export function Sidebar({ usuario, hrefsPermitidos }: { usuario: UsuarioSidebar; hrefsPermitidos: string[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          PW
        </span>
        <span className="font-semibold">PDV Wall</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAVEGACAO.filter((i) => hrefsPermitidos.includes(i.href)).map(({ href, titulo, icone: Icone }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
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
      <div className="flex items-center gap-2 border-t p-3">
        <Link href="/trocar-senha" title="Alterar minha senha" className="min-w-0 flex-1 rounded-md hover:underline">
          <p className="truncate text-sm font-medium">{usuario.nome}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">{usuario.role}</p>
        </Link>
        <form action={logout}>
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
    </aside>
  );
}
