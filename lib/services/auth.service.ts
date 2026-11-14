import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { RoleNome } from "@/lib/constants/roles";
import type { SessionPayload } from "@/lib/auth/jwt";

// Regras do MODULO_3: máx. 5 tentativas falhas a cada 5 minutos por e-mail.
const MAX_TENTATIVAS = 5;
const JANELA_MS = 5 * 60 * 1000;

// Hash fixo usado quando o e-mail não existe, para o tempo de resposta não revelar
// quais e-mails estão cadastrados.
const HASH_FALSO = "$2b$10$aIuMC2AADHen.TCuePkrUeRxpfaI2j/9oUjEE7Z2nDU9T9vnpUyP.";

export type ContextoRequisicao = { ip?: string | null; userAgent?: string | null };

export type ResultadoLogin =
  | { ok: true; sessao: SessionPayload }
  | { ok: false; erro: "CREDENCIAIS_INVALIDAS" | "CONTA_INATIVA" | "MUITAS_TENTATIVAS" };

export async function autenticar(
  email: string,
  senha: string,
  ctx: ContextoRequisicao,
): Promise<ResultadoLogin> {
  const desde = new Date(Date.now() - JANELA_MS);
  const falhasRecentes = await prisma.auditoria.count({
    where: { acao: "LOGIN_FALHA", emailUsuario: email, dataHora: { gte: desde } },
  });
  if (falhasRecentes >= MAX_TENTATIVAS) {
    await registrar("LOGIN_BLOQUEADO_RATE_LIMIT", email, null, ctx, false, "Muitas tentativas");
    return { ok: false, erro: "MUITAS_TENTATIVAS" };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { role: { select: { nome: true } } },
  });

  const senhaOk = await bcrypt.compare(senha, usuario?.passwordHash ?? HASH_FALSO);

  if (!usuario || !senhaOk) {
    await registrar("LOGIN_FALHA", email, usuario?.id ?? null, ctx, false, "Credenciais inválidas");
    if (usuario) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { tentativasLoginFalhas: { increment: 1 } },
      });
    }
    return { ok: false, erro: "CREDENCIAIS_INVALIDAS" };
  }

  if (!usuario.ativo || usuario.bloqueado) {
    await registrar("LOGIN_FALHA", email, usuario.id, ctx, false, "Conta inativa ou bloqueada");
    return { ok: false, erro: "CONTA_INATIVA" };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date(), tentativasLoginFalhas: 0 },
  });
  await registrar("LOGIN_SUCESSO", email, usuario.id, ctx, true);

  return {
    ok: true,
    sessao: {
      sub: String(usuario.id),
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role.nome as RoleNome,
    },
  };
}

export async function registrarLogout(usuarioId: number, email: string, ctx: ContextoRequisicao) {
  await registrar("LOGOUT", email, usuarioId, ctx, true);
}

function registrar(
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
