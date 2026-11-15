"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormCtx } from "./FormCtx";

/** Estado padrão devolvido pelas server actions de formulário. */
export type EstadoForm =
  | { ok?: boolean; mensagem?: string; erro?: string; campos?: Record<string, string[] | undefined> }
  | undefined;

/**
 * Formulário com server action que:
 * - distribui os erros por campo via contexto (usado pelos componentes de components/form/campos);
 * - envia manualmente (em vez de <form action>) para o React 19 não limpar os campos quando há erro;
 * - desabilita tudo em modo somente leitura.
 */
export function Formulario({
  acao,
  children,
  podeEditar = true,
  rotuloBotao = "Salvar",
  rotuloEnviando = "Salvando...",
  acoesExtras,
  avisoSomenteLeitura = "Você pode visualizar, mas não alterar, estes dados.",
  className = "flex max-w-3xl flex-col gap-8",
}: {
  acao: (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;
  children: React.ReactNode;
  podeEditar?: boolean;
  rotuloBotao?: string;
  rotuloEnviando?: string;
  /** Ex.: link "Cancelar", ao lado do botão de salvar. */
  acoesExtras?: React.ReactNode;
  avisoSomenteLeitura?: string;
  className?: string;
}) {
  const [state, action] = useActionState<EstadoForm, FormData>(acao, undefined);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => action(dados));
  };

  return (
    <FormCtx.Provider value={{ erros: state?.campos ?? {}, somenteLeitura: !podeEditar }}>
      <form onSubmit={onSubmit} className={className} noValidate>
        {!podeEditar && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{avisoSomenteLeitura}</p>
        )}
        {state?.erro && !podeEditar && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.erro}
          </p>
        )}

        <fieldset disabled={!podeEditar || pending} className="flex min-w-0 flex-col gap-8">
          {children}
        </fieldset>

        {podeEditar && (
          <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? rotuloEnviando : rotuloBotao}
            </Button>
            {acoesExtras}
            {state?.erro && (
              <p role="alert" className="text-sm text-destructive">
                {state.erro}
              </p>
            )}
            {state?.ok && !pending && state.mensagem && (
              <p role="status" className="text-sm text-muted-foreground">
                {state.mensagem}
              </p>
            )}
          </div>
        )}
      </form>
    </FormCtx.Provider>
  );
}
