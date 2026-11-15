import "server-only";
import { cache } from "react";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { type ConfigPorSecao, type Secao, SECOES } from "@/lib/validations/configuracoes.schema";
import type { ContextoRequisicao } from "./auth.service";

/** Permissão necessária para editar cada seção (todas podem ser visualizadas por quem está logado). */
const PERMISSAO_EDICAO: Record<Secao, string[]> = {
  empresa: [PERMISSAO.CONFIG_EDITAR],
  vendas: [PERMISSAO.CONFIG_EDITAR], // inclui limites de desconto: só admin
  estoque: [PERMISSAO.CONFIG_EDITAR, PERMISSAO.CONFIG_EDITAR_OPERACIONAL],
  financeiro: [PERMISSAO.CONFIG_EDITAR],
};

export function podeEditarSecao(permissoes: string[], secao: Secao) {
  return PERMISSAO_EDICAO[secao].some((p) => temPermissao(permissoes, p));
}

/**
 * Configuração de uma seção, sempre completa: campos ausentes recebem o valor padrão.
 * Se o JSON salvo ficou inválido (ex.: schema mudou), cai nos padrões e registra no log.
 */
export const getConfig = cache(async <S extends Secao>(secao: S): Promise<ConfigPorSecao[S]> => {
  const registro = await prisma.configuracao.findUnique({ where: { chave: secao } });
  const schema = SECOES[secao].schema;
  const resultado = schema.safeParse(registro?.valor ?? {});
  if (resultado.success) return resultado.data as ConfigPorSecao[S];

  console.error(`[configuracoes] valor salvo de "${secao}" é inválido; usando padrões`, resultado.error.issues);
  return schema.parse({}) as ConfigPorSecao[S];
});

export async function getMetaConfig(secao: Secao) {
  return prisma.configuracao.findUnique({
    where: { chave: secao },
    select: { atualizadoEm: true, alteradoPor: { select: { nome: true } } },
  });
}

export type ResultadoSalvar =
  | { ok: true; alterados: number }
  | { ok: false; campos: Record<string, string[]> };

export async function salvarConfig(
  secao: Secao,
  entrada: unknown,
  autor: { id: number; email: string },
  ctx: ContextoRequisicao,
): Promise<ResultadoSalvar> {
  const parsed = SECOES[secao].schema.safeParse(entrada);
  if (!parsed.success) {
    const campos: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const chave = issue.path.join(".");
      (campos[chave] ??= []).push(issue.message);
    }
    return { ok: false, campos };
  }

  const antes = (await getConfig(secao)) as Record<string, unknown>;
  const depois = parsed.data as Record<string, unknown>;
  const alteracoes = diff(antes, depois);
  if (Object.keys(alteracoes).length === 0) return { ok: true, alterados: 0 };

  const valor = depois as Prisma.InputJsonObject;
  await prisma.$transaction([
    prisma.configuracao.upsert({
      where: { chave: secao },
      create: { chave: secao, valor, alteradoPorId: autor.id },
      update: { valor, alteradoPorId: autor.id },
    }),
    prisma.auditoria.create({
      data: {
        acao: "CONFIG_UPDATED",
        modulo: "CONFIGURACOES",
        usuarioId: autor.id,
        emailUsuario: autor.email,
        descricao: `Seção ${secao}`,
        dadosModificados: { secao, alteracoes } as Prisma.InputJsonObject,
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    }),
  ]);

  return { ok: true, alterados: Object.keys(alteracoes).length };
}

/** Diferenças campo a campo (achatando objetos: "endereco.cep"). */
function diff(antes: Record<string, unknown>, depois: Record<string, unknown>, prefixo = "") {
  const out: Record<string, { de: unknown; para: unknown }> = {};
  for (const k of new Set([...Object.keys(antes), ...Object.keys(depois)])) {
    const a = antes[k];
    const d = depois[k];
    const caminho = prefixo + k;
    if (isObj(a) && isObj(d)) Object.assign(out, diff(a, d, `${caminho}.`));
    else if (JSON.stringify(a) !== JSON.stringify(d)) out[caminho] = { de: a ?? null, para: d ?? null };
  }
  return out;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
