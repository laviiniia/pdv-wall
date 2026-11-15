// Assinatura/verificação do JWT de sessão. Sem dependências de servidor do Next,
// para poder ser usado tanto no proxy.ts quanto em Server Components/Actions.
import { jwtVerify, SignJWT } from "jose";
import type { RoleNome } from "@/lib/constants/roles";

export const SESSION_COOKIE = "pdv_session";
export const SESSAO_PADRAO_SEGUNDOS = 8 * 60 * 60; // 8h (MODULO_3)
export const SESSAO_LONGA_SEGUNDOS = 7 * 24 * 60 * 60; // 7 dias ("manter conectado")

const ISSUER = "pdv-wall";
const AUDIENCE = "pdv-wall-app";

export type SessionPayload = {
  sub: string; // id do usuário
  email: string;
  nome: string;
  role: RoleNome;
  /** Emitido em (segundos desde epoch). Preenchido na verificação. */
  iat?: number;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). Veja .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function assinarSessao(payload: SessionPayload, duracaoSegundos: number) {
  return new SignJWT({ email: payload.email, nome: payload.nome, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${duracaoSegundos}s`)
    .sign(getSecret());
}

/** Retorna o payload se o token for válido; `null` se ausente, expirado ou adulterado. */
export async function verificarSessao(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      nome: payload.nome as string,
      role: payload.role as RoleNome,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
