import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, senha } = await searchParams;

  return (
    <AuthCard titulo="PDV Wall" descricao="Entre com seu e-mail e senha">
      {senha === "redefinida" && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          Senha redefinida. Entre com a nova senha.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <Link
        href="/recuperar-senha"
        className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        Esqueci minha senha
      </Link>
    </AuthCard>
  );
}
