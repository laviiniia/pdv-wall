import { Selo } from "@/components/produtos/Selos";
import type { resumoSessao } from "@/lib/services/caixa.service";
import { ROTULOS_FORMA } from "@/lib/vendas/calculo";
import { cn } from "@/lib/utils";

type Resumo = NonNullable<Awaited<ReturnType<typeof resumoSessao>>>;
const brl = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const c = (v: { toString(): string } | null) => (v == null ? 0 : Math.round(Number(v.toString()) * 100));

function Linha({ rotulo, valor, sinal, forte }: { rotulo: string; valor: number; sinal?: "+" | "−"; forte?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 py-1", forte && "border-t pt-2 font-semibold")}>
      <span className={forte ? undefined : "text-muted-foreground"}>{rotulo}</span>
      <span className="tabular-nums">
        {sinal && valor ? `${sinal} ` : ""}
        {brl(valor)}
      </span>
    </div>
  );
}

/** Conferência da sessão: dinheiro da gaveta, outras formas e movimentações. */
export function ResumoSessao({ resumo, tz }: { resumo: Resumo; tz: string }) {
  const { sessao, totais } = resumo;
  const hora = (d: Date) => d.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
  const outras = Object.entries(totais.porForma).filter(([f]) => f !== "dinheiro");
  const dif = c(sessao.diferenca);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">Dinheiro na gaveta</h2>
        <Linha rotulo="Saldo inicial" valor={totais.inicial} />
        <Linha rotulo="Vendas em dinheiro (líquido de troco)" valor={totais.dinheiroVendas} sinal="+" />
        <Linha rotulo="Suprimentos" valor={totais.suprimentos} sinal="+" />
        <Linha rotulo="Sangrias" valor={totais.sangrias} sinal="−" />
        <Linha rotulo="Despesas pagas com o caixa" valor={totais.despesas} sinal="−" />
        <Linha rotulo={sessao.status === "aberto" ? "Esperado agora" : "Esperado no fechamento"} valor={sessao.status === "aberto" ? totais.esperado : c(sessao.saldoEsperado)} forte />
        {sessao.status === "fechado" && (
          <>
            <Linha rotulo="Contado" valor={c(sessao.saldoReal)} />
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-muted-foreground">Diferença</span>
              {dif === 0 ? <Selo tom="ok">Sem diferença</Selo> : <Selo tom={dif > 0 ? "aviso" : "erro"}>{`${dif > 0 ? "Sobra" : "Falta"} ${brl(Math.abs(dif))}`}</Selo>}
            </div>
            {sessao.motivoDiferenca && <p className="text-xs text-muted-foreground">Motivo: {sessao.motivoDiferenca}</p>}
          </>
        )}
      </section>

      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">Vendas da sessão</h2>
        <Linha rotulo={`${totais.vendas} venda(s) finalizada(s)`} valor={totais.totalVendido} forte={false} />
        {totais.canceladas > 0 && <p className="py-1 text-xs text-muted-foreground">{totais.canceladas} cancelada(s), fora dos totais</p>}
        <div className="mt-2 border-t pt-2">
          <p className="mb-1 text-xs text-muted-foreground">Conferir com maquininha / extrato:</p>
          {outras.length === 0 ? (
            <p className="py-1 text-muted-foreground">Nenhum recebimento fora do dinheiro.</p>
          ) : (
            outras.map(([f, v]) => <Linha key={f} rotulo={ROTULOS_FORMA[f as keyof typeof ROTULOS_FORMA] ?? f} valor={v} />)
          )}
        </div>
      </section>

      {(sessao.movimentos.length > 0 || sessao.despesas.length > 0) && (
        <section className="rounded-xl border p-4 text-sm lg:col-span-2">
          <h2 className="mb-2 font-semibold">Movimentações do caixa</h2>
          <ul className="divide-y">
            {sessao.movimentos.map((m) => (
              <li key={`m${m.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-center gap-2">
                  <Selo tom={m.tipo === "sangria" ? "aviso" : "neutro"}>{m.tipo === "sangria" ? "Sangria" : "Suprimento"}</Selo>
                  {m.motivo}
                  <span className="text-xs text-muted-foreground">
                    {hora(m.criadoEm)} · {m.usuario.nome}
                  </span>
                </span>
                <span className="tabular-nums">
                  {m.tipo === "sangria" ? "− " : "+ "}
                  {brl(c(m.valor))}
                </span>
              </li>
            ))}
            {sessao.despesas.map((d) => (
              <li key={`d${d.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-center gap-2">
                  <Selo tom="erro">Despesa</Selo>
                  {d.descricao}
                  <span className="text-xs text-muted-foreground">
                    {hora(d.criadoEm)} · {d.numero}
                  </span>
                </span>
                <span className="tabular-nums">− {brl(c(d.valor))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
