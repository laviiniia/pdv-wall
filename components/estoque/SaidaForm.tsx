"use client";

import Link from "next/link";
import { useState } from "react";
import { salvarSaida } from "@/app/(dashboard)/estoque/actions";
import { CampoTexto, CampoTextoLongo, Grupo } from "@/components/form/campos";
import { useFormCtx } from "@/components/form/FormCtx";
import { Formulario } from "@/components/form/Formulario";
import { TIPOS_SAIDA } from "@/lib/validations/estoque.schema";

type Produto = { id: number; nome: string; sku: string; unidadeMedida: string; quantidade: number };

const input = "h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function Erro({ nome }: { nome: string }) {
  const { erros } = useFormCtx();
  return erros[nome] ? <span className="text-xs font-normal text-destructive">{erros[nome]![0]}</span> : null;
}

export function SaidaForm({ produtos, produtoInicial }: { produtos: Produto[]; produtoInicial?: number }) {
  const [tipo, setTipo] = useState<keyof typeof TIPOS_SAIDA>("dano");
  const [produtoId, setProdutoId] = useState(produtoInicial ? String(produtoInicial) : "");
  const p = produtos.find((x) => String(x.id) === produtoId);

  return (
    <Formulario
      acao={salvarSaida}
      rotuloBotao="Registrar"
      className="flex max-w-xl flex-col gap-6"
      acoesExtras={<Link href="/estoque" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">Cancelar</Link>}
    >
      <Grupo titulo="Movimentação manual">
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
          Tipo
          <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as keyof typeof TIPOS_SAIDA)} className={input}>
            {Object.entries(TIPOS_SAIDA).map(([v, r]) => (
              <option key={v} value={v}>{r}</option>
            ))}
          </select>
          <Erro nome="tipo" />
        </label>
        {tipo === "ajuste" && (
          <fieldset className="flex gap-4 text-sm sm:col-span-2">
            <legend className="mb-1 font-medium">Direção</legend>
            <label className="flex items-center gap-2"><input type="radio" name="direcao" value="saida" defaultChecked className="accent-primary" /> Retirar (contou menos)</label>
            <label className="flex items-center gap-2"><input type="radio" name="direcao" value="entrada" className="accent-primary" /> Acrescentar (contou mais)</label>
          </fieldset>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
          Produto
          <select name="produtoId" value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className={input}>
            <option value="">Selecione...</option>
            {produtos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome} ({x.sku}) — estoque: {x.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} {x.unidadeMedida}
              </option>
            ))}
          </select>
          <Erro nome="produtoId" />
        </label>
        <CampoTexto nome="quantidade" rotulo={`Quantidade${p ? ` (${p.unidadeMedida})` : ""}`} valor="" inputMode="decimal" />
        <div />
        <CampoTextoLongo nome="motivo" rotulo="Motivo" valor="" max={300} ajuda="Ex.: produto queimado no preparo, lote vencido" />
      </Grupo>
    </Formulario>
  );
}
