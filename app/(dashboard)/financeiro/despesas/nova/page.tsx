import type { Metadata } from "next";
import Link from "next/link";
import { DespesaForm } from "@/components/financeiro/DespesaForm";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { sessaoAbertaDoOperador } from "@/lib/services/caixa.service";
import { listarFornecedores } from "@/lib/services/estoque.service";
import { categoriasDespesa, hojeISO } from "@/lib/services/financeiro.service";

export const metadata: Metadata = { title: "Nova despesa" };

export default async function NovaDespesaPage() {
  const usuario = await exigirPermissao(PERMISSAO.FINANCEIRO_DESPESAS);
  const [categorias, fornecedores, hoje, sessao] = await Promise.all([
    categoriasDespesa(),
    listarFornecedores(),
    hojeISO(),
    sessaoAbertaDoOperador(usuario.id),
  ]);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/financeiro/despesas" className="text-muted-foreground hover:underline">← Despesas</Link>
      </p>
      <h2 className="mb-4 text-lg font-semibold">Nova despesa</h2>
      <DespesaForm categorias={categorias} fornecedores={fornecedores.map((f) => f.nome)} hoje={hoje} temCaixaAberto={!!sessao} />
    </>
  );
}
