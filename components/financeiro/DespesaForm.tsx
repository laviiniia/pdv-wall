"use client";

import Link from "next/link";
import { useState } from "react";
import { salvarDespesa } from "@/app/(dashboard)/financeiro/actions";
import { CampoTexto, CampoTextoLongo, Grupo } from "@/components/form/campos";
import { useFormCtx } from "@/components/form/FormCtx";
import { Formulario } from "@/components/form/Formulario";
import { lerNumero } from "@/lib/utils/numero";
import { FORMAS_DESPESA } from "@/lib/validations/financeiro.schema";

const input = "h-9 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";
const brl = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Erro({ nome }: { nome: string }) {
  const { erros } = useFormCtx();
  return erros[nome] ? <span className="text-xs font-normal text-destructive">{erros[nome]![0]}</span> : null;
}

function Select({ nome, rotulo, valor, onChange, opcoes, vazio }: { nome: string; rotulo: string; valor?: string; onChange?: (v: string) => void; opcoes: [string, string][]; vazio?: string }) {
  const { erros } = useFormCtx();
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {rotulo}
      <select
        name={nome}
        {...(onChange ? { value: valor, onChange: (e) => onChange(e.target.value) } : { defaultValue: valor ?? "" })}
        aria-invalid={!!erros[nome]}
        className={input}
      >
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opcoes.map(([v, r]) => (
          <option key={v} value={v}>{r}</option>
        ))}
      </select>
      <Erro nome={nome} />
    </label>
  );
}

export function DespesaForm({
  categorias,
  fornecedores,
  hoje,
  temCaixaAberto,
}: {
  categorias: { valor: string; rotulo: string }[];
  fornecedores: string[];
  hoje: string;
  temCaixaAberto: boolean;
}) {
  const [pagamento, setPagamento] = useState<"agora" | "prazo">("agora");
  const [forma, setForma] = useState("pix");
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const total = Math.round((lerNumero(valor) ?? 0) * 100);
  const n = Math.min(24, Math.max(1, Number(parcelas) || 1));

  return (
    <Formulario
      acao={salvarDespesa}
      rotuloBotao="Lançar despesa"
      rotuloEnviando="Lançando..."
      className="flex max-w-3xl flex-col gap-8"
      acoesExtras={<Link href="/financeiro/despesas" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">Cancelar</Link>}
    >
      <Grupo titulo="Despesa">
        <Select nome="categoria" rotulo="Categoria" vazio="Selecione..." opcoes={categorias.map((x) => [x.valor, x.rotulo])} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Valor (R$)
          <input name="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={`${input} text-right tabular-nums`} />
          <Erro nome="valor" />
        </label>
        <CampoTexto nome="descricao" rotulo="Descrição" valor="" largo maxLength={300} placeholder="Ex.: Conta de luz de outubro" />
        <CampoTexto nome="dataDespesa" rotulo="Data" tipo="date" valor={hoje} max={hoje} />
        <Select nome="tipo" rotulo="Tipo" valor="variavel" opcoes={[["variavel", "Variável"], ["fixa", "Fixa (todo mês)"]]} />
        <Select nome="recorrente" rotulo="Recorrência (informativo)" vazio="Não se repete" opcoes={[["mensal", "Mensal"], ["semanal", "Semanal"]]} />
        <div />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Fornecedor (opcional)
          <input name="fornecedorNome" list="fornecedores" maxLength={150} className={input} placeholder="Digite ou escolha" />
          <datalist id="fornecedores">
            {fornecedores.map((f) => <option key={f} value={f} />)}
          </datalist>
          <span className="text-xs font-normal text-muted-foreground">Se não existir, é cadastrado.</span>
          <Erro nome="fornecedorNome" />
        </label>
        <CampoTexto nome="numeroNf" rotulo="Nº da nota fiscal (opcional)" valor="" maxLength={50} />
      </Grupo>

      <Grupo titulo="Pagamento">
        <fieldset className="flex flex-wrap gap-4 text-sm sm:col-span-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="pagamento" value="agora" checked={pagamento === "agora"} onChange={() => setPagamento("agora")} className="accent-primary" /> Já foi paga
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pagamento" value="prazo" checked={pagamento === "prazo"} onChange={() => setPagamento("prazo")} className="accent-primary" /> A pagar (gera contas a pagar)
          </label>
        </fieldset>
        {pagamento === "agora" ? (
          <>
            <Select nome="formaPagamento" rotulo="Forma de pagamento" valor={forma} onChange={setForma} opcoes={Object.entries(FORMAS_DESPESA)} />
            {forma === "dinheiro" && temCaixaAberto ? (
              <label className="flex items-start gap-2.5 self-end text-sm">
                <input type="checkbox" name="doCaixa" value="true" defaultChecked className="mt-0.5 size-4 accent-primary" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">Saiu do dinheiro do meu caixa</span>
                  <span className="text-xs text-muted-foreground">Desconta do esperado no fechamento.</span>
                  <Erro nome="doCaixa" />
                </span>
              </label>
            ) : (
              <div />
            )}
          </>
        ) : (
          <>
            <CampoTexto nome="primeiroVencimento" rotulo="1º vencimento" tipo="date" valor="" />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Parcelas
              <input name="parcelas" type="number" min={1} max={24} value={parcelas} onChange={(e) => setParcelas(e.target.value)} className={`${input} w-24`} />
              <span className="text-xs font-normal text-muted-foreground">
                {n > 1 && total > 0 ? `${n}x de ${brl(Math.floor(total / n))}${total % n ? " (a última ajusta os centavos)" : ""}, uma por mês` : "Uma conta por mês, a partir do 1º vencimento."}
              </span>
              <Erro nome="parcelas" />
            </label>
          </>
        )}
        <CampoTextoLongo nome="observacoes" rotulo="Observações (opcional)" valor="" max={500} />
      </Grupo>
    </Formulario>
  );
}
