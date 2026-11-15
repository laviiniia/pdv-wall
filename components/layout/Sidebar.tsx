import { MarcaEmpresa, NavLinks, type NavegacaoProps, RodapeUsuario } from "./NavLinks";

export function Sidebar({ usuario, hrefsPermitidos, nomeEmpresa }: NavegacaoProps) {
  return (
    <aside className="hidden print:hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <MarcaEmpresa nomeEmpresa={nomeEmpresa} />
      </div>
      <NavLinks hrefsPermitidos={hrefsPermitidos} />
      <RodapeUsuario usuario={usuario} />
    </aside>
  );
}
