import "server-only";
import { cookies } from "next/headers";
import {
  assinarSessao,
  SESSAO_LONGA_SEGUNDOS,
  SESSAO_PADRAO_SEGUNDOS,
  SESSION_COOKIE,
  type SessionPayload,
  verificarSessao,
} from "./jwt";

// O token fica num cookie httpOnly (inacessível ao JavaScript da página),
// em vez de localStorage como sugerido na doc — protege contra roubo via XSS.
export async function criarSessao(payload: SessionPayload, manterConectado: boolean) {
  const duracao = manterConectado ? SESSAO_LONGA_SEGUNDOS : SESSAO_PADRAO_SEGUNDOS;
  const token = await assinarSessao(payload, duracao);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: duracao,
  });
}

export async function lerSessao() {
  const cookieStore = await cookies();
  return verificarSessao(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
