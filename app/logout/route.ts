import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/jwt";

// Usado quando a sessão fica inválida (usuário desativado/removido): limpa o cookie e volta ao login.
// O logout normal do usuário é a Server Action `logout` (POST).
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
