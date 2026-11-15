import { redirect } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { temPermissao } from "@/lib/constants/roles";
import { NAVEGACAO } from "@/lib/constants/navegacao";
import { getConfig } from "@/lib/services/configuracoes.service";

// Layout das rotas privadas: valida a sessão no servidor (o proxy.ts só faz a checagem otimista).
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const usuario = await getUsuarioAtual();

  // Senha temporária: precisa trocar antes de usar o sistema.
  if (usuario.deveTrocarSenha) redirect("/trocar-senha");

  const empresa = await getConfig("empresa");
  const itens = NAVEGACAO.filter((i) => !i.permissao || temPermissao(usuario.permissoes, i.permissao)).map(
    ({ href }) => href,
  );

  const navegacao = {
    usuario: { nome: usuario.nome, email: usuario.email, role: usuario.role.nome },
    hrefsPermitidos: itens,
    nomeEmpresa: empresa.nomeFantasia || empresa.nome,
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <MobileNav {...navegacao} />
      <Sidebar {...navegacao} />
      <main className="flex-1 overflow-x-hidden p-6 md:p-8 print:p-0">{children}</main>
    </div>
  );
}
