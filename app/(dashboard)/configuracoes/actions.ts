"use server";

import { revalidatePath } from "next/cache";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { podeEditarSecao, salvarConfig } from "@/lib/services/configuracoes.service";
import { ehSecao } from "@/lib/validations/configuracoes.schema";
import type { EstadoForm } from "@/components/form/Formulario";

export type ConfigFormState = EstadoForm;

/** Nome do campo oculto em que cada formulário declara seus campos de lista (checkbox em grupo). */
const MARCADOR_LISTA = "__lista__";

/**
 * FormData → objeto aninhado: "endereco.cep" vira { endereco: { cep } }.
 * Campos declarados em `__lista__` viram arrays (inclusive vazios, quando nada foi marcado).
 */
function formParaObjeto(formData: FormData) {
  const listas = new Set(formData.getAll(MARCADOR_LISTA).map(String));
  const chaves = new Set(
    [...formData.keys()].filter((k) => k !== "secao" && k !== MARCADOR_LISTA && !k.startsWith("$")),
  );
  for (const l of listas) chaves.add(l);

  const obj: Record<string, unknown> = {};
  for (const chave of chaves) {
    const valor = listas.has(chave)
      ? formData.getAll(chave).filter((v): v is string => typeof v === "string")
      : formData.get(chave);
    const partes = chave.split(".");
    let alvo = obj;
    for (const p of partes.slice(0, -1)) alvo = (alvo[p] ??= {}) as Record<string, unknown>;
    alvo[partes.at(-1)!] = valor;
  }
  return obj;
}

export async function salvar(_prev: ConfigFormState, formData: FormData): Promise<ConfigFormState> {
  const usuario = await getUsuarioAtual();
  const secao = String(formData.get("secao") ?? "");
  if (!ehSecao(secao)) return { erro: "Seção inválida." };
  if (!podeEditarSecao(usuario.permissoes, secao)) {
    return { erro: "Você não tem permissão para alterar esta seção." };
  }

  const r = await salvarConfig(secao, formParaObjeto(formData), usuario, await contextoRequisicao());
  if (!r.ok) return { erro: "Corrija os campos destacados.", campos: r.campos };

  revalidatePath("/", "layout"); // o nome da empresa aparece na sidebar
  return {
    ok: true,
    mensagem: r.alterados === 0 ? "Nada foi alterado." : `Configurações salvas (${r.alterados} campo(s) alterado(s)).`,
  };
}
