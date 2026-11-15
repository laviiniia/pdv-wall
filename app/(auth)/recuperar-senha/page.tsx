import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RecuperarSenhaForm } from "@/components/auth/RecuperarSenhaForm";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AuthCard titulo="Recuperar senha" descricao="Informe seu e-mail para receber um link de redefinição">
      <RecuperarSenhaForm />
    </AuthCard>
  );
}
