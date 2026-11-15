"use client";

import { createContext, useContext } from "react";

/** Erros por campo (chave = name do input) e modo somente leitura, compartilhados pelos campos. */
export type FormCtxValor = { erros: Record<string, string[] | undefined>; somenteLeitura: boolean };

export const FormCtx = createContext<FormCtxValor>({ erros: {}, somenteLeitura: false });
export const useFormCtx = () => useContext(FormCtx);
