import type { Metadata } from "next";
import Link from "next/link";
import { BotaoCancelar } from "@/components/financeiro/BotaoCancelar";
import { brl, c, dataCurta } from "@/components/financeiro/comum";
import { PagarConta } from "@/components/financeiro/PagarConta";
import { Selo } from "@/components/produtos/Selos";
import { usuarioAtualOuNull } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { type FiltroContas, hojeISO, listarContas, resumoContas, rotuloCategoria } from "@/lib/services/financeiro.service";
import { cn } from "@/lib/utils";
import { FORMAS_DESPESA } from "@/lib/validations/financeiro.schema";

export const metadata: Metadata = { title: "Contas a pagar" };

const FILTROS: Record<FiltroContas, string> = { abertas: "Em aberto", vencidas: "Vencidas", semana: "Próximos 7 dias", pagas: "Pagas", todas: "Todas" };

export default async function ContasPage({ searchParams }: PageProps<"/financeiro/contas">) {
  const sp = await searchParams;
  const filtro = typeof sp.filtro === "string" && sp.filtro in FILTROS ? (sp.filtro as FiltroContas) : "abertas";
  const [usuario, contas, resumo, hoje] = await Promise.all([usuarioAtualOuNull(), listarContas(filtro), resumoContas(), hojeISO()]);
  const podePagar = !!usuario && temPermissao(usuario.permissoes, PERMISSAO.FINANCEIRO_PAGAR);

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Em aberto</p>
          <p className="text-xl font-semibold tabular-nums">{brl(resumo.totalAberto)}</p>
          <p className="text-xs text-muted-foreground">{resumo.abertas} conta(s)</p>
        </div>
        <div className={cn("rounded-xl border p-4", resumo.vencidas > 0 && "border-destructive/40 bg-destructive/5")}>
          <p className="text-xs text-muted-foreground">Vencidas</p>
          <p className={cn("text-xl font-semibold tabular-nums", resumo.vencidas > 0 && "text-destructive")}>{brl(resumo.totalVencido)}</p>
          <p className="text-xs text-muted-foreground">{resumo.vencidas} conta(s)</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Vencem nos próximos 7 dias</p>
          <p className="text-xl font-semibold tabular-nums">{brl(resumo.totalSemana)}</p>
          <p className="text-xs text-muted-foreground">{resumo.semana} conta(s)</p>
        </div>
      </div>

      <nav className="mb-4 flex flex-wrap gap-1.5" aria-label="Filtro">
        {Object.entries(FILTROS).map(([k, r]) => (
          <Link
            key={k}
            href={`/financeiro/contas?filtro=${k}`}
            aria-current={k === filtro ? "page" : undefined}
            className={cn("h-8 rounded-full border px-3 text-sm leading-8", k === filtro ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {r}
          </Link>
        ))}
      </nav>

      {contas.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          Nenhuma conta aqui. Contas são geradas ao lançar uma despesa “a pagar” em <Link href="/financeiro/despesas/nova" className="underline">Nova despesa</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-right font-medium">Falta</th>
                {podePagar && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {contas.map((ct) => {
                const aberta = ct.status === "pendente" || ct.status === "parcial";
                return (
                  <tr key={ct.id} className="align-top hover:bg-muted/30">
                    <td className={cn("px-4 py-2.5 whitespace-nowrap", ct.vencida && "font-medium text-destructive")}>{dataCurta(ct.vencimento)}</td>
                    <td className="px-4 py-2.5">
                      <div>{ct.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        {ct.numero} · {rotuloCategoria(ct.categoria)}
                        {ct.fornecedor && ` · ${ct.fornecedor.nome}`}
                      </div>
                      {ct.pagamentos.length > 0 && (
                        <ul className="mt-1 text-xs text-muted-foreground">
                          {ct.pagamentos.map((p, i) => (
                            <li key={i}>
                              Pago {brl(c(p.valor))} em {dataCurta(p.dataPagamento)} ({FORMAS_DESPESA[p.forma]})
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {ct.status === "paga" ? (
                        <Selo tom="ok">Paga</Selo>
                      ) : ct.status === "cancelada" ? (
                        <Selo tom="neutro">Cancelada</Selo>
                      ) : ct.vencida ? (
                        <Selo tom="erro">Vencida</Selo>
                      ) : ct.status === "parcial" ? (
                        <Selo tom="aviso">Parcial</Selo>
                      ) : (
                        <Selo tom="neutro">Pendente</Selo>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{brl(c(ct.valorTotal))}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{aberta ? brl(ct.restante) : "—"}</td>
                    {podePagar && (
                      <td className="px-4 py-2.5 text-right">
                        {aberta && (
                          <div className="flex flex-col items-end gap-1.5">
                            <PagarConta contaId={ct.id} restante={ct.restante} hoje={hoje} />
                            {ct.status === "pendente" && <BotaoCancelar tipo="conta" id={ct.id} descricao={`${ct.numero} — ${ct.descricao}`} />}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
