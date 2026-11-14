import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LinkInvalido, RedefinirSenhaForm } from "@/components/auth/RedefinirSenhaForm";
import { buscarTokenValido } from "@/lib/services/senha.service";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function RedefinirSenhaPage({ searchParams }: PageProps<"/redefinir-senha">) {
  const { token } = await searchParams;
  const valido = typeof token === "string" && (await buscarTokenValido(token)) !== null;

  return (
    <AuthCard titulo="Redefinir senha" descricao={valido ? "Escolha uma nova senha" : undefined}>
      {valido ? <RedefinirSenhaForm token={token} /> : <LinkInvalido />}
    </AuthCard>
  );
}
