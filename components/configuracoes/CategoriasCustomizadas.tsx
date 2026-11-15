"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useFormCtx } from "@/components/form/FormCtx";

const MAX = 10;

export function CategoriasCustomizadas({ valores }: { valores: string[] }) {
  const { erros, somenteLeitura } = useFormCtx();
  // ids estáveis para o React não trocar o conteúdo dos inputs ao remover
  const [itens, setItens] = useState(() => valores.map((v, i) => ({ id: i, valor: v })));
  const [proximoId, setProximoId] = useState(valores.length);

  const adicionar = () => {
    setItens((l) => [...l, { id: proximoId, valor: "" }]);
    setProximoId((n) => n + 1);
  };

  return (
    <fieldset className="flex flex-col gap-2 text-sm sm:col-span-2">
      <legend className="mb-1.5 font-medium">Categorias personalizadas</legend>
      <input type="hidden" name="__lista__" value="categoriasCustomizadas" />
      {itens.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            name="categoriasCustomizadas"
            defaultValue={item.valor}
            maxLength={50}
            placeholder="Ex.: Embalagens"
            className="h-9 w-72 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:bg-muted/50"
          />
          {!somenteLeitura && (
            <button
              type="button"
              aria-label="Remover categoria"
              onClick={() => setItens((l) => l.filter((i) => i.id !== item.id))}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
      {!somenteLeitura && itens.length < MAX && (
        <button type="button" onClick={adicionar} className="flex w-fit items-center gap-1 text-sm text-primary hover:underline">
          <Plus className="size-4" /> Adicionar categoria
        </button>
      )}
      {erros.categoriasCustomizadas && (
        <span className="text-xs text-destructive">{erros.categoriasCustomizadas[0]}</span>
      )}
    </fieldset>
  );
}
