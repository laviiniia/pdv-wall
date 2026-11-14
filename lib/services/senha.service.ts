import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { ContextoRequisicao } from "./auth.service";
import { enviarEmail } from "./email.service";

// Regras do MODULO_3: token expira em 1h, uso único, 1 e-mail a cada 5 min.
const VALIDADE_MS = 60 * 60 * 1000;
const INTERVALO_MS = 5 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Gera e envia o link de redefinição. Sempre "dá certo" para quem chama:
 * a resposta não revela se o e-mail existe (evita enumeração de usuários).
 */
export async function solicitarResetSenha(email: string, baseUrl: string, ctx: ContextoRequisicao) {
  const recente = await prisma.auditoria.findFirst({
    where: {
      acao: "PASSWORD_RESET_REQUESTED",
      emailUsuario: email,
      dataHora: { gte: new Date(Date.now() - INTERVALO_MS) },
    },
  });
  if (recente) return;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo || usuario.bloqueado) {
    await auditar("PASSWORD_RESET_IGNORED", email, usuario?.id ?? null, ctx, false, "Usuário inexistente ou inativo");
    return;
  }

  const token = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    // Só o link mais recente vale.
    prisma.resetPasswordToken.updateMany({
      where: { usuarioId: usuario.id, usado: false },
      data: { usado: true, usadoEm: new Date() },
    }),
    prisma.resetPasswordToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + VALIDADE_MS),
      },
    }),
  ]);

  const link = `${baseUrl}/redefinir-senha?token=${token}`;
  const nome = usuario.nome.split(" ")[0];

  await enviarEmail({
    para: usuario.email,
    assunto: "Redefinir sua senha - PDV Wall",
    texto: `Olá ${nome},\n\nRecebemos uma solicitação para redefinir sua senha no PDV Wall.\nAcesse o link abaixo (válido por 1 hora):\n\n${link}\n\nSe não foi você, ignore este e-mail.`,
    html: `<p>Olá ${escapeHtml(nome)},</p>
<p>Recebemos uma solicitação para redefinir sua senha no PDV Wall.</p>
<p><a href="${link}">Redefinir senha</a></p>
<p>O link é válido por 1 hora. Se não foi você, ignore este e-mail.</p>`,
  });

  await auditar("PASSWORD_RESET_REQUESTED", email, usuario.id, ctx, true);
}

/** Retorna o token do banco se ele for válido (existe, não usado, não expirado, usuário ativo). */
export async function buscarTokenValido(token: string) {
  const registro = await prisma.resetPasswordToken.findFirst({
    where: { tokenHash: hashToken(token), usado: false, expiraEm: { gt: new Date() } },
    include: { usuario: { select: { id: true, email: true, ativo: true, bloqueado: true, passwordHash: true } } },
  });
  if (!registro || !registro.usuario.ativo || registro.usuario.bloqueado) return null;
  return registro;
}

export type ResultadoRedefinicao = { ok: true } | { ok: false; erro: "TOKEN_INVALIDO" | "SENHA_IGUAL" };

export async function redefinirSenha(
  token: string,
  novaSenha: string,
  ctx: ContextoRequisicao,
): Promise<ResultadoRedefinicao> {
  const registro = await buscarTokenValido(token);
  if (!registro) return { ok: false, erro: "TOKEN_INVALIDO" };

  if (await bcrypt.compare(novaSenha, registro.usuario.passwordHash)) {
    return { ok: false, erro: "SENHA_IGUAL" };
  }

  const agora = new Date();
  // Marca o token como usado de forma condicional: se duas requisições chegarem juntas, só uma vence.
  const consumido = await prisma.resetPasswordToken.updateMany({
    where: { id: registro.id, usado: false },
    data: { usado: true, usadoEm: agora },
  });
  if (consumido.count === 0) return { ok: false, erro: "TOKEN_INVALIDO" };

  await prisma.usuario.update({
    where: { id: registro.usuarioId },
    data: {
      passwordHash: await bcrypt.hash(novaSenha, 10),
      // Sessões emitidas antes deste instante passam a ser recusadas (ver lib/auth/dal.ts).
      passwordAlteradaEm: agora,
      tentativasLoginFalhas: 0,
    },
  });

  await auditar("PASSWORD_CHANGED", registro.usuario.email, registro.usuarioId, ctx, true);
  return { ok: true };
}

function auditar(
  acao: string,
  email: string,
  usuarioId: number | null,
  ctx: ContextoRequisicao,
  sucesso: boolean,
  mensagemErro?: string,
) {
  return prisma.auditoria.create({
    data: {
      acao,
      modulo: "AUTENTICACAO",
      nivel: sucesso ? "INFO" : "WARN",
      emailUsuario: email,
      usuarioId,
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      sucesso,
      mensagemErro: mensagemErro ?? null,
    },
  });
}
