import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(auth)/login/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { TrocarSenhaForm } from "@/components/auth/TrocarSenhaForm";
import { getUsuarioAtual } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Alterar senha" };

// Fora do grupo (dashboard) de propósito: o layout de lá redireciona para cá quando a troca é obrigatória.
export default async function TrocarSenhaPage() {
  const usuario = await getUsuarioAtual();

  return (
    <AuthCard
      titulo={usuario.deveTrocarSenha ? "Defina uma nova senha" : "Alterar senha"}
      descricao={
        usuario.deveTrocarSenha
          ? "Você entrou com uma senha temporária. Escolha uma senha pessoal para continuar."
          : usuario.email
      }
    >
      <TrocarSenhaForm />
      {usuario.deveTrocarSenha ? (
        <form action={logout} className="mt-4 text-center">
          <button type="submit" className="text-sm text-muted-foreground hover:underline">
            Sair
          </button>
        </form>
      ) : (
        <Link href="/dashboard" className="mt-4 block text-center text-sm text-muted-foreground hover:underline">
          Cancelar
        </Link>
      )}
    </AuthCard>
  );
}
