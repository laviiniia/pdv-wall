import type { Metadata } from "next";
import Link from "next/link";
import { AbrirCaixaForm, FecharCaixaForm, MovimentoCaixaForm } from "@/components/caixa/FormsCaixa";
import { ResumoSessao } from "@/components/caixa/ResumoSessao";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { historicoSessoes, resumoSessao, saldoSugerido, sessaoAbertaDoOperador, situacaoDosCaixas } from "@/lib/services/caixa.service";
import { getConfig } from "@/lib/services/configuracoes.service";

export const metadata: Metadata = { title: "Caixa" };

const MENSAGENS: Record<string, string> = {
  aberto: "Caixa aberto. Bom trabalho!",
  sangria: "Sangria registrada.",
  suprimento: "Suprimento registrado.",
};
const brl = (v: { toString(): string } | null) => (v == null ? "—" : Number(v.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));

export default async function CaixaPage({ searchParams }: PageProps<"/caixa">) {
  const usuario = await exigirPermissao(PERMISSAO.CAIXA_OPERAR);
  const { msg } = await searchParams;
  const [sessao, caixas, historico, empresa, fin] = await Promise.all([
    sessaoAbertaDoOperador(usuario.id),
    situacaoDosCaixas(),
    historicoSessoes(usuario, 20),
    getConfig("empresa"),
    getConfig("financeiro"),
  ]);
  const tz = empresa.funcionamento.timezone;
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
  const gerente = temPermissao(usuario.permissoes, PERMISSAO.CAIXA_GERENCIAR);
  const resumo = sessao ? await resumoSessao(sessao.id) : null;
  const sugestoes = sessao ? [] : await Promise.all(caixas.map(async (c) => ({ ...c, sugerido: await saldoSugerido(c.caixa) })));
  const outrosAbertos = caixas.filter((c) => c.sessaoId && c.sessaoId !== sessao?.id);
  const exigeGerente = fin.diferencaCaixaSoGerente && !temPermissao(usuario.permissoes, PERMISSAO.CAIXA_FECHAR_DIFERENCA);

  return (
    <>
      <PageHeader
        titulo={sessao ? `Caixa ${sessao.caixa}` : "Caixa"}
        descricao={sessao ? `Sessão ${sessao.numero} · aberta em ${quando(sessao.abertoEm)}` : "Abra o caixa no início do turno para poder vender."}
      />
      {typeof msg === "string" && MENSAGENS[msg] && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          {MENSAGENS[msg]}
        </p>
      )}

      {resumo ? (
        <div className="flex flex-col gap-6">
          <ResumoSessao resumo={resumo} tz={tz} />
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border p-4">
              <h2 className="mb-3 text-sm font-semibold">Sangria / suprimento</h2>
              {/* key: remonta (limpa) o formulário depois de cada registro */}
              <MovimentoCaixaForm key={resumo.sessao.movimentos.length} />
            </section>
            <section className="rounded-xl border p-4">
              <h2 className="mb-3 text-sm font-semibold">Fechar caixa</h2>
              <FecharCaixaForm sessaoId={resumo.sessao.id} esperado={resumo.totais.esperado} exigeGerente={exigeGerente} />
            </section>
          </div>
        </div>
      ) : sugestoes.every((c) => c.ocupadoPor) ? (
        <p className="max-w-xl rounded-md bg-muted px-3 py-2 text-sm">
          Todos os caixas estão em uso. Aumente o número de caixas em Configurações › Financeiro ou peça para fecharem um.
        </p>
      ) : (
        <AbrirCaixaForm caixas={sugestoes} />
      )}

      {gerente && outrosAbertos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Outros caixas abertos</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {outrosAbertos.map((c) => (
              <li key={c.caixa}>
                <Link href={`/caixa/${c.sessaoId}`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 hover:bg-muted">
                  Caixa {c.caixa} · {c.ocupadoPor}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">{gerente ? "Últimas sessões" : "Minhas últimas sessões"}</h2>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Sessão</th>
                  <th className="px-4 py-3 font-medium">Caixa</th>
                  {gerente && <th className="px-4 py-3 font-medium">Operador</th>}
                  <th className="px-4 py-3 font-medium">Abertura</th>
                  <th className="px-4 py-3 font-medium">Fechamento</th>
                  <th className="px-4 py-3 text-right font-medium">Contado</th>
                  <th className="px-4 py-3 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historico.map((s) => {
                  const dif = s.diferenca == null ? null : Number(s.diferenca.toString());
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <Link href={`/caixa/${s.id}`} className="font-mono text-xs hover:underline">
                          {s.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{s.caixa}</td>
                      {gerente && <td className="px-4 py-2.5">{s.operador.nome}</td>}
                      <td className="px-4 py-2.5 whitespace-nowrap">{quando(s.abertoEm)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{s.fechadoEm ? quando(s.fechadoEm) : <Selo tom="ok">Aberto</Selo>}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{brl(s.saldoReal)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {dif == null ? "—" : dif === 0 ? <Selo tom="ok">OK</Selo> : <Selo tom={dif > 0 ? "aviso" : "erro"}>{brl(s.diferenca)}</Selo>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
