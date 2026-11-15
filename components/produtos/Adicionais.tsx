"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { excluirAdicional, salvarAdicional } from "@/app/(dashboard)/pedidos-online/actions";
import { CampoNumero, CampoSelect, CampoTexto, Grupo } from "@/components/form/campos";
import { Formulario } from "@/components/form/Formulario";

type Adicional = { id: number; tipo: "adicao" | "remocao"; nome: string; valor: number; ativo: boolean };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Personalizações que o cliente escolhe no cardápio digital (MODULO_2_3, seção 3). */
export function Adicionais({ produtoId, adicionais, podeEditar }: { produtoId: number; adicionais: Adicional[]; podeEditar: boolean }) {
  const [pending, startTransition] = useTransition();

  const remover = (id: number) => {
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("produtoId", String(produtoId));
    startTransition(() => excluirAdicional(fd));
  };

  return (
    <section className="mt-10 max-w-3xl border-t pt-6">
      <h2 className="mb-1 text-sm font-semibold">Personalizações no cardápio digital</h2>
      <p className="mb-4 text-sm text-muted-foreground">Adicionais (com acréscimo de preço) e ingredientes que o cliente pode pedir para retirar.</p>

      {adicionais.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Nenhuma personalização.</p>
      ) : (
        <ul className="mb-6 divide-y rounded-xl border text-sm">
          {adicionais.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <span>
                <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">{a.tipo === "adicao" ? "Adicional" : "Retirar"}</span>
                {a.nome}
              </span>
              <span className="flex items-center gap-3">
                {a.tipo === "adicao" && <span className="tabular-nums text-muted-foreground">+ {brl(a.valor)}</span>}
                {podeEditar && (
                  <button type="button" aria-label={`Remover ${a.nome}`} onClick={() => remover(a.id)} disabled={pending} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {podeEditar && (
        <Formulario acao={salvarAdicional} rotuloBotao="Adicionar opção" className="flex max-w-xl flex-col gap-4">
          <input type="hidden" name="produtoId" value={produtoId} />
          <Grupo titulo="Nova opção">
            <CampoSelect nome="tipo" rotulo="Tipo" valor="adicao" opcoes={{ adicao: "Adicional (+ preço)", remocao: "Retirar ingrediente" }} />
            <CampoTexto nome="nome" rotulo="Nome" valor="" placeholder="Ex.: Bacon extra / Sem cebola" maxLength={60} />
            <CampoNumero nome="valor" rotulo="Acréscimo" valor={0} prefixo="R$" ajuda="Ignorado em “retirar”" />
          </Grupo>
        </Formulario>
      )}
    </section>
  );
}
