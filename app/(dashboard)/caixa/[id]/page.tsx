import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FecharCaixaForm } from "@/components/caixa/FormsCaixa";
import { ResumoSessao } from "@/components/caixa/ResumoSessao";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { resumoSessao } from "@/lib/services/caixa.service";
import { getConfig } from "@/lib/services/configuracoes.service";

export const metadata: Metadata = { title: "Sessão de caixa" };

export default async function SessaoCaixaPage({ params, searchParams }: PageProps<"/caixa/[id]">) {
  const usuario = await exigirPermissao(PERMISSAO.CAIXA_OPERAR);
  const [{ id }, { msg }] = await Promise.all([params, searchParams]);
  const resumo = Number.isInteger(Number(id)) ? await resumoSessao(Number(id)) : null;
  if (!resumo) notFound();
  const gerente = temPermissao(usuario.permissoes, PERMISSAO.CAIXA_GERENCIAR);
  const dono = resumo.sessao.operadorId === usuario.id;
  if (!dono && !gerente) redirect("/caixa");

  const [empresa, fin] = await Promise.all([getConfig("empresa"), getConfig("financeiro")]);
  const tz = empresa.funcionamento.timezone;
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
  const { sessao } = resumo;
  const exigeGerente = fin.diferencaCaixaSoGerente && !temPermissao(usuario.permissoes, PERMISSAO.CAIXA_FECHAR_DIFERENCA);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/caixa" className="text-muted-foreground hover:underline">← Caixa</Link>
      </p>
      <PageHeader
        titulo={`Caixa ${sessao.caixa} · ${sessao.numero}`}
        descricao={`${sessao.operador.nome} · aberto em ${quando(sessao.abertoEm)}${
          sessao.fechadoEm ? ` · fechado em ${quando(sessao.fechadoEm)}${sessao.fechadoPor ? ` por ${sessao.fechadoPor.nome}` : ""}` : " · em andamento"
        }`}
      />
      {msg === "fechado" && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          Caixa fechado.
        </p>
      )}
      <ResumoSessao resumo={resumo} tz={tz} />
      {(sessao.observacaoAbertura || sessao.observacaoFechamento) && (
        <div className="mt-4 rounded-xl border p-4 text-sm">
          {sessao.observacaoAbertura && <p><span className="text-muted-foreground">Abertura:</span> {sessao.observacaoAbertura}</p>}
          {sessao.observacaoFechamento && <p><span className="text-muted-foreground">Fechamento:</span> {sessao.observacaoFechamento}</p>}
        </div>
      )}
      {sessao.status === "aberto" && (dono || gerente) && (
        <section className="mt-6 max-w-xl rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">Fechar caixa{dono ? "" : ` de ${sessao.operador.nome}`}</h2>
          <FecharCaixaForm sessaoId={sessao.id} esperado={resumo.totais.esperado} exigeGerente={exigeGerente} />
        </section>
      )}
    </>
  );
}
