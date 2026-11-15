"use server";

import { revalidatePath } from "next/cache";
import { contextoRequisicao } from "@/lib/auth/contexto";
import { exigirPermissao, getUsuarioAtual } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { enviarEmail } from "@/lib/services/email.service";
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

/** Admin: envia um e-mail de teste para si mesmo, para conferir a configuração do Resend. */
export async function enviarEmailTeste(): Promise<{ ok: boolean; mensagem: string }> {
  const usuario = await exigirPermissao(PERMISSAO.CONFIG_EDITAR);
  try {
    const r = await enviarEmail({
      para: usuario.email,
      assunto: "Teste de envio - PDV Wall",
      texto: `Olá ${usuario.nome.split(" ")[0]},\n\nSe você recebeu esta mensagem, o envio de e-mails do PDV Wall está funcionando.`,
      html: `<p>Olá,</p><p>Se você recebeu esta mensagem, o envio de e-mails do PDV Wall está funcionando.</p>`,
    });
    return r.simulado
      ? { ok: false, mensagem: "Resend não configurado: o e-mail foi só impresso no terminal do servidor." }
      : { ok: true, mensagem: `E-mail enviado para ${usuario.email}. Confira a caixa de entrada (e o spam).` };
  } catch (e) {
    return { ok: false, mensagem: e instanceof Error ? e.message : "Falha desconhecida." };
  }
}
