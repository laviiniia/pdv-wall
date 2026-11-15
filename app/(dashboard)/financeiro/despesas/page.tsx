import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { brl, c, dataCurta, mesDoParametro, SeletorMes } from "@/components/financeiro/comum";
import { BotaoCancelar } from "@/components/financeiro/BotaoCancelar";
import { Selo } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { categoriasDespesa, hojeISO, listarDespesas, rotuloCategoria } from "@/lib/services/financeiro.service";
import { FORMAS_DESPESA } from "@/lib/validations/financeiro.schema";

export const metadata: Metadata = { title: "Despesas" };

export default async function DespesasPage({ searchParams }: PageProps<"/financeiro/despesas">) {
  const sp = await searchParams;
  const mes = mesDoParametro(sp.mes, await hojeISO());
  const categoria = typeof sp.categoria === "string" && sp.categoria ? sp.categoria : undefined;
  const [usuario, despesas, categorias] = await Promise.all([exigirPermissao(PERMISSAO.FINANCEIRO_VER), listarDespesas(mes, categoria), categoriasDespesa()]);
  const podeLancar = temPermissao(usuario.permissoes, PERMISSAO.FINANCEIRO_DESPESAS);
  const ativas = despesas.filter((d) => !d.cancelada);
  const total = ativas.reduce((s, d) => s + c(d.valor), 0);

  return (
    <>
      {sp.msg === "criada" && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          Despesa {typeof sp.ref === "string" ? sp.ref : ""} lançada.
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SeletorMes mes={mes}>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Categoria
            <select name="categoria" defaultValue={categoria ?? ""} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
              <option value="">Todas</option>
              {categorias.map((x) => (
                <option key={x.valor} value={x.valor}>{x.rotulo}</option>
              ))}
            </select>
          </label>
        </SeletorMes>
        {podeLancar && (
          <Link href="/financeiro/despesas/nova" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> Nova despesa
          </Link>
        )}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {ativas.length} despesa(s) · total <span className="font-medium text-foreground">{brl(total)}</span>
      </p>

      {despesas.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">Nenhuma despesa neste mês{categoria ? " para esta categoria" : ""}.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                {podeLancar && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {despesas.map((d) => (
                <tr key={d.id} className={d.cancelada ? "text-muted-foreground line-through" : "hover:bg-muted/30"}>
                  <td className="px-4 py-2.5 whitespace-nowrap">{dataCurta(d.dataDespesa)}</td>
                  <td className="px-4 py-2.5">
                    <div>{d.descricao}</div>
                    <div className="text-xs text-muted-foreground no-underline">
                      {d.numero}
                      {d.fornecedor && ` · ${d.fornecedor.nome}`}
                      {d.numeroNf && ` · NF ${d.numeroNf}`}
                      {d.tipo === "fixa" && " · fixa"}
                      {d.recorrente && ` · ${d.recorrente}`}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{rotuloCategoria(d.categoria)}</td>
                  <td className="px-4 py-2.5">
                    {d.cancelada ? (
                      <Selo tom="neutro">Cancelada</Selo>
                    ) : d.pagaNaHora ? (
                      <span className="flex flex-wrap gap-1">
                        <Selo tom="ok">{FORMAS_DESPESA[d.formaPagamento!]}</Selo>
                        {d.sessaoCaixaId && <Selo tom="neutro">do caixa</Selo>}
                      </span>
                    ) : (
                      <Link href="/financeiro/contas?filtro=todas" className="hover:underline">
                        <Selo tom="aviso">{`A prazo · ${d._count.contas}x`}</Selo>
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{brl(c(d.valor))}</td>
                  {podeLancar && (
                    <td className="px-4 py-2.5 text-right">
                      {!d.cancelada && <BotaoCancelar tipo="despesa" id={d.id} descricao={`${d.numero} — ${d.descricao}`} />}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
