import "server-only";
import { headers } from "next/headers";
import type { ContextoRequisicao } from "@/lib/services/auth.service";

/** IP e user agent da requisição atual, para auditoria. */
export async function contextoRequisicao(): Promise<ContextoRequisicao> {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

/** URL base pública do app (para links em e-mails). */
export async function urlBase(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
