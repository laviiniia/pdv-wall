"use client";

import { useState } from "react";
import { abrir, fechar, movimentar } from "@/app/(dashboard)/caixa/actions";
import { CampoTexto, CampoTextoLongo, Grupo } from "@/components/form/campos";
import { useFormCtx } from "@/components/form/FormCtx";
import { Formulario } from "@/components/form/Formulario";
import { lerNumero, numeroParaInput } from "@/lib/utils/numero";
import { MOTIVOS_DIFERENCA } from "@/lib/validations/financeiro.schema";
import { cn } from "@/lib/utils";

const input = "h-9 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";
const brl = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Erro({ nome }: { nome: string }) {
  const { erros } = useFormCtx();
  return erros[nome] ? <span className="text-xs font-normal text-destructive">{erros[nome]![0]}</span> : null;
}

export function AbrirCaixaForm({ caixas }: { caixas: { caixa: string; ocupadoPor: string | null; sugerido: number }[] }) {
  const livres = caixas.filter((c) => !c.ocupadoPor);
  const [caixa, setCaixa] = useState(livres[0]?.caixa ?? "");
  const sugerido = caixas.find((c) => c.caixa === caixa)?.sugerido ?? 0;

  return (
    <Formulario acao={abrir} rotuloBotao="Abrir caixa" rotuloEnviando="Abrindo..." className="flex max-w-xl flex-col gap-6">
      <Grupo titulo="Abertura de caixa">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Caixa
          <select name="caixa" value={caixa} onChange={(e) => setCaixa(e.target.value)} className={input}>
            {caixas.map((c) => (
              <option key={c.caixa} value={c.caixa} disabled={!!c.ocupadoPor}>
                Caixa {c.caixa}
                {c.ocupadoPor ? ` — em uso por ${c.ocupadoPor}` : ""}
              </option>
            ))}
          </select>
          <Erro nome="caixa" />
        </label>
        {/* key: ao trocar de caixa, o valor sugerido é recarregado */}
        <CampoTexto
          key={caixa}
          nome="saldoInicial"
          rotulo="Dinheiro na gaveta (R$)"
          valor={numeroParaInput(sugerido / 100)}
          inputMode="decimal"
          className="text-right tabular-nums"
          ajuda={sugerido ? "Sugestão: o que foi contado no último fechamento deste caixa." : "Conte o troco que está na gaveta."}
        />
        <CampoTextoLongo nome="observacao" rotulo="Observação (opcional)" valor="" max={300} />
      </Grupo>
    </Formulario>
  );
}

export function MovimentoCaixaForm() {
  const [tipo, setTipo] = useState<"sangria" | "suprimento">("sangria");
  return (
    <Formulario acao={movimentar} rotuloBotao="Registrar" rotuloEnviando="Registrando..." className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <fieldset className="flex gap-4 text-sm">
          <legend className="mb-1.5 font-medium">Tipo</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="sangria" checked={tipo === "sangria"} onChange={() => setTipo("sangria")} className="accent-primary" /> Sangria (retirada)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="suprimento" checked={tipo === "suprimento"} onChange={() => setTipo("suprimento")} className="accent-primary" /> Suprimento (reforço)
          </label>
        </fieldset>
        <CampoTexto nome="valor" rotulo="Valor (R$)" valor="" inputMode="decimal" className="text-right tabular-nums" />
        <CampoTexto
          nome="motivo"
          rotulo="Motivo"
          valor=""
          maxLength={300}
          placeholder={tipo === "sangria" ? "Ex.: depósito no banco, excesso de dinheiro" : "Ex.: troco extra"}
        />
      </div>
    </Formulario>
  );
}

export function FecharCaixaForm({ sessaoId, esperado, exigeGerente }: { sessaoId: number; esperado: number; exigeGerente: boolean }) {
  const [texto, setTexto] = useState("");
  const lido = texto.trim() === "" ? undefined : lerNumero(texto);
  const contado = lido == null ? null : Math.round(lido * 100);
  const diferenca = contado == null || !Number.isFinite(contado) ? null : contado - esperado;

  return (
    <Formulario acao={fechar} rotuloBotao="Fechar caixa" rotuloEnviando="Fechando..." className="flex flex-col gap-4">
      <input type="hidden" name="sessaoId" value={sessaoId} />
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Dinheiro contado na gaveta (R$)
          <input name="saldoReal" inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} className={cn(input, "text-right tabular-nums")} />
          <span className="text-xs font-normal text-muted-foreground">Esperado: {brl(esperado)}. Conte só as notas e moedas.</span>
          <Erro nome="saldoReal" />
        </label>
        {diferenca != null && (
          <p
            role="status"
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              diferenca === 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-800 dark:text-amber-300",
            )}
          >
            {diferenca === 0 ? "Caixa batendo." : `${diferenca > 0 ? "Sobra" : "Falta"} de ${brl(Math.abs(diferenca))}.`}
            {diferenca !== 0 && exigeGerente && " Fechamento com diferença precisa de um gerente."}
          </p>
        )}
        {diferenca != null && diferenca !== 0 && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Motivo da diferença
            <select name="motivoDiferenca" defaultValue="" className={input}>
              <option value="" disabled>
                Selecione...
              </option>
              {MOTIVOS_DIFERENCA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Erro nome="motivoDiferenca" />
          </label>
        )}
        <CampoTextoLongo nome="observacao" rotulo="Observação (opcional)" valor="" max={300} />
      </div>
    </Formulario>
  );
}
