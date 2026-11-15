import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
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

  const token = await emitirTokenSenha(usuario.id, VALIDADE_MS);
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

/** Cria um token de definição de senha (invalida os anteriores) e devolve o token puro. */
export async function emitirTokenSenha(usuarioId: number, validadeMs: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    // Só o link mais recente vale.
    prisma.resetPasswordToken.updateMany({
      where: { usuarioId, usado: false },
      data: { usado: true, usadoEm: new Date() },
    }),
    prisma.resetPasswordToken.create({
      data: { usuarioId, tokenHash: hashToken(token), expiraEm: new Date(Date.now() + validadeMs) },
    }),
  ]);
  return token;
}

const VALIDADE_CONVITE_MS = 72 * 60 * 60 * 1000; // conta nova: 72h para definir a senha

/** E-mail de boas-vindas com link para o novo usuário definir a própria senha. */
export async function enviarConviteConta(usuario: { id: number; nome: string; email: string }, baseUrl: string) {
  const token = await emitirTokenSenha(usuario.id, VALIDADE_CONVITE_MS);
  const link = `${baseUrl}/redefinir-senha?token=${token}`;
  const nome = usuario.nome.split(" ")[0];

  await enviarEmail({
    para: usuario.email,
    assunto: "Sua conta foi criada - PDV Wall",
    texto: `Olá ${nome},\n\nBem-vindo(a) ao PDV Wall! Seu login é ${usuario.email}.\nDefina sua senha pelo link abaixo (válido por 72 horas):\n\n${link}`,
    html: `<p>Olá ${escapeHtml(nome)},</p>
<p>Bem-vindo(a) ao PDV Wall! Seu login é <strong>${escapeHtml(usuario.email)}</strong>.</p>
<p><a href="${link}">Definir minha senha</a></p>
<p>O link é válido por 72 horas.</p>`,
  });
}

/** Senha temporária de 12 caracteres que já atende à política de senha forte. */
export function gerarSenhaTemporaria() {
  const grupos = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "@#$%&*!?"];
  const todos = grupos.join("");
  const escolher = (s: string) => s[randomInt(s.length)];
  const chars = [...grupos.map(escolher), ...Array.from({ length: 8 }, () => escolher(todos))];
  // embaralha (Fisher–Yates)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export type ResultadoTroca = { ok: true } | { ok: false; erro: "SENHA_ATUAL_INCORRETA" | "SENHA_IGUAL" };

/** Troca de senha pelo próprio usuário logado. */
export async function trocarSenha(
  usuarioId: number,
  senhaAtual: string,
  novaSenha: string,
  ctx: ContextoRequisicao,
): Promise<ResultadoTroca> {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });

  if (!(await bcrypt.compare(senhaAtual, usuario.passwordHash))) {
    await auditar("PASSWORD_CHANGE_FAILED", usuario.email, usuario.id, ctx, false, "Senha atual incorreta");
    return { ok: false, erro: "SENHA_ATUAL_INCORRETA" };
  }
  if (senhaAtual === novaSenha) return { ok: false, erro: "SENHA_IGUAL" };

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      passwordHash: await bcrypt.hash(novaSenha, 10),
      passwordAlteradaEm: new Date(),
      deveTrocarSenha: false,
    },
  });
  await auditar("PASSWORD_CHANGED", usuario.email, usuario.id, ctx, true);
  return { ok: true };
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
      deveTrocarSenha: false,
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
