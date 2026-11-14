"use client";

import { createContext, useActionState, useContext, useTransition } from "react";
import { type ConfigFormState, salvar } from "@/app/(dashboard)/configuracoes/actions";
import { Button } from "@/components/ui/button";

type Ctx = { erros: Record<string, string[]>; somenteLeitura: boolean };
const ConfigCtx = createContext<Ctx>({ erros: {}, somenteLeitura: false });
export const useConfigCtx = () => useContext(ConfigCtx);

export function ConfigForm({
  secao,
  podeEditar,
  children,
}: {
  secao: string;
  podeEditar: boolean;
  children: React.ReactNode;
}) {
  const [state, action] = useActionState<ConfigFormState, FormData>(salvar, undefined);
  const [pending, startTransition] = useTransition();

  // Envio manual (em vez de <form action>) para o React não limpar os campos quando há erro.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => action(dados));
  };

  return (
    <ConfigCtx.Provider value={{ erros: state?.campos ?? {}, somenteLeitura: !podeEditar }}>
      <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-8" noValidate>
        <input type="hidden" name="secao" value={secao} />

        {!podeEditar && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Você pode visualizar, mas não alterar, as configurações desta seção.
          </p>
        )}
        {!podeEditar && state?.erro && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.erro}
          </p>
        )}

        <fieldset disabled={!podeEditar || pending} className="flex flex-col gap-8">
          {children}
        </fieldset>

        {podeEditar && (
          <div className="sticky bottom-0 -mx-1 flex items-center gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Salvando..." : "Salvar configurações"}
            </Button>
            {state?.erro && (
              <p role="alert" className="text-sm text-destructive">
                {state.erro}
              </p>
            )}
            {state?.ok && !pending && (
              <p role="status" className="text-sm text-muted-foreground">
                {state.mensagem}
              </p>
            )}
          </div>
        )}
      </form>
    </ConfigCtx.Provider>
  );
}
