import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { temPermissao } from "@/lib/constants/roles";
import { NAVEGACAO } from "@/lib/constants/navegacao";

// Layout das rotas privadas: valida a sessão no servidor (o proxy.ts só faz a checagem otimista).
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const usuario = await getUsuarioAtual();

  // Senha temporária: precisa trocar antes de usar o sistema.
  if (usuario.deveTrocarSenha) redirect("/trocar-senha");

  const itens = NAVEGACAO.filter((i) => !i.permissao || temPermissao(usuario.permissoes, i.permissao)).map(
    ({ href }) => href,
  );

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar
        usuario={{ nome: usuario.nome, email: usuario.email, role: usuario.role.nome }}
        hrefsPermitidos={itens}
      />
      <main className="flex-1 overflow-x-hidden p-6 md:p-8">{children}</main>
    </div>
  );
}
