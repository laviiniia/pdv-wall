import { Sidebar } from "@/components/layout/Sidebar";
import { getUsuarioAtual } from "@/lib/auth/dal";

// Layout das rotas privadas: valida a sessão no servidor (o proxy.ts só faz a checagem otimista).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioAtual();

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar usuario={{ nome: usuario.nome, email: usuario.email, role: usuario.role.nome }} />
      <main className="flex-1 overflow-x-hidden p-6 md:p-8">{children}</main>
    </div>
  );
}
