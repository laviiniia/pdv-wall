import "server-only";
import bcrypt from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants/roles";
import type { CriarUsuarioInput, EditarUsuarioInput } from "@/lib/validations/usuario.schema";
import type { ContextoRequisicao } from "./auth.service";
import { enviarConviteConta, gerarSenhaTemporaria, solicitarResetSenha } from "./senha.service";

export type FiltroUsuarios = { status?: "ativos" | "inativos" | "todos"; role?: string; busca?: string };

export async function listarUsuarios({ status = "ativos", role, busca }: FiltroUsuarios) {
  const where: Prisma.UsuarioWhereInput = {
    ...(status === "ativos" && { ativo: true }),
    ...(status === "inativos" && { ativo: false }),
    ...(role && { role: { nome: role } }),
    ...(busca && {
      OR: [
        { nome: { contains: busca, mode: "insensitive" } },
        { email: { contains: busca, mode: "insensitive" } },
      ],
    }),
  };

  const [usuarios, totalAtivos, totalInativos] = await Promise.all([
    prisma.usuario.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        bloqueado: true,
        deveTrocarSenha: true,
        ultimoLogin: true,
        role: { select: { nome: true } },
      },
    }),
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.usuario.count({ where: { ativo: false } }),
  ]);

  return { usuarios, totalAtivos, totalInativos };
}

export function buscarUsuario(id: number) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      ativo: true,
      bloqueado: true,
      deveTrocarSenha: true,
      ultimoLogin: true,
      criadoEm: true,
      role: { select: { nome: true } },
      criadoPor: { select: { nome: true } },
    },
  });
}

type Autor = { id: number; email: string };

export type ResultadoCriacao =
  | { ok: true; id: number; senhaTemporaria?: string }
  | { ok: false; erro: "EMAIL_EM_USO" };

export async function criarUsuario(
  dados: CriarUsuarioInput,
  autor: Autor,
  baseUrl: string,
  ctx: ContextoRequisicao,
): Promise<ResultadoCriacao> {
  if (await prisma.usuario.findUnique({ where: { email: dados.email }, select: { id: true } })) {
    return { ok: false, erro: "EMAIL_EM_USO" };
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { nome: dados.role } });

  // Modo "link": a senha inicial é aleatória e ninguém a conhece; o usuário define pelo link.
  const senhaTemporaria = dados.modoSenha === "temporaria" ? gerarSenhaTemporaria() : undefined;
  const senhaInicial =
    dados.modoSenha === "definir" ? dados.senha : (senhaTemporaria ?? gerarSenhaTemporaria() + gerarSenhaTemporaria());

  let usuario;
  try {
    usuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone ?? null,
        roleId: role.id,
        ativo: dados.ativo,
        passwordHash: await bcrypt.hash(senhaInicial, 10),
        deveTrocarSenha: dados.modoSenha !== "link",
        criadoPorId: autor.id,
      },
    });
  } catch (e) {
    // corrida: outro cadastro com o mesmo e-mail entre a checagem e o insert
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, erro: "EMAIL_EM_USO" };
    }
    throw e;
  }

  await registrar("USER_CREATED", autor, ctx, {
    usuario_id: usuario.id,
    email: usuario.email,
    role: dados.role,
    ativo: dados.ativo,
    modo_senha: dados.modoSenha,
  });

  if (dados.modoSenha === "link" && dados.ativo) {
    await enviarConviteConta(usuario, baseUrl);
  }

  return { ok: true, id: usuario.id, senhaTemporaria };
}

export type ResultadoEdicao =
  | { ok: true }
  | { ok: false; erro: "EMAIL_EM_USO" | "NAO_ENCONTRADO" | "AUTO_REBAIXAMENTO" | "ULTIMO_ADMIN" };

export async function editarUsuario(
  dados: EditarUsuarioInput,
  autor: Autor,
  ctx: ContextoRequisicao,
): Promise<ResultadoEdicao> {
  const atual = await prisma.usuario.findUnique({
    where: { id: dados.id },
    include: { role: { select: { nome: true } } },
  });
  if (!atual) return { ok: false, erro: "NAO_ENCONTRADO" };

  const deixaDeSerAdminAtivo =
    atual.role.nome === ROLES.ADMIN &&
    atual.ativo &&
    !atual.bloqueado &&
    (dados.role !== ROLES.ADMIN || !dados.ativo || dados.bloqueado);

  if (deixaDeSerAdminAtivo) {
    // Ninguém tira o próprio acesso de admin (evita trancar-se fora por engano).
    if (atual.id === autor.id) return { ok: false, erro: "AUTO_REBAIXAMENTO" };
    const outrosAdmins = await prisma.usuario.count({
      where: { id: { not: atual.id }, ativo: true, bloqueado: false, role: { nome: ROLES.ADMIN } },
    });
    if (outrosAdmins === 0) return { ok: false, erro: "ULTIMO_ADMIN" };
  }

  if (dados.email !== atual.email) {
    const emUso = await prisma.usuario.findUnique({ where: { email: dados.email }, select: { id: true } });
    if (emUso) return { ok: false, erro: "EMAIL_EM_USO" };
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { nome: dados.role } });

  const antes = {
    nome: atual.nome,
    email: atual.email,
    telefone: atual.telefone,
    role: atual.role.nome,
    ativo: atual.ativo,
    bloqueado: atual.bloqueado,
  };
  const depois = {
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone ?? null,
    role: dados.role,
    ativo: dados.ativo,
    bloqueado: dados.bloqueado,
  };
  const alteracoes = Object.fromEntries(
    (Object.keys(depois) as (keyof typeof depois)[])
      .filter((k) => antes[k] !== depois[k])
      .map((k) => [k, { de: antes[k], para: depois[k] }]),
  );
  if (Object.keys(alteracoes).length === 0) return { ok: true };

  await prisma.usuario.update({
    where: { id: atual.id },
    data: {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone ?? null,
      roleId: role.id,
      ativo: dados.ativo,
      bloqueado: dados.bloqueado,
      // desbloquear zera o contador de falhas
      ...(!dados.bloqueado && atual.bloqueado && { tentativasLoginFalhas: 0 }),
    },
  });

  await registrar("USER_UPDATED", autor, ctx, { usuario_id: atual.id, alteracoes });
  return { ok: true };
}

/** Admin dispara o e-mail de redefinição para um usuário. */
export async function enviarLinkRedefinicao(usuarioId: number, autor: Autor, baseUrl: string, ctx: ContextoRequisicao) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  await solicitarResetSenha(usuario.email, baseUrl, ctx);
  await registrar("USER_PASSWORD_RESET_SENT", autor, ctx, { usuario_id: usuario.id });
}

function registrar(acao: string, autor: Autor, ctx: ContextoRequisicao, dados: Prisma.InputJsonObject) {
  return prisma.auditoria.create({
    data: {
      acao,
      modulo: "USUARIOS",
      nivel: "INFO",
      usuarioId: autor.id,
      emailUsuario: autor.email,
      dadosModificados: dados,
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
}

