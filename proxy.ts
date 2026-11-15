import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verificarSessao } from "@/lib/auth/jwt";

// Checagem otimista (só o cookie, sem banco). A verificação completa fica em lib/auth/dal.ts.
// /mesa e /pedido: cardápio digital e acompanhamento do cliente (MODULO_2_3), sem login.
const ROTAS_PUBLICAS = ["/login", "/recuperar-senha", "/redefinir-senha", "/mesa", "/pedido"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessao = await verificarSessao(request.cookies.get(SESSION_COOKIE)?.value);
  const publica = ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (!publica && !sessao) {
    const url = new URL("/login", request.url);
    if (pathname !== "/" && pathname !== "/dashboard") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Só a tela de login manda quem já está logado para o dashboard; o link de
  // redefinição de senha precisa abrir mesmo com sessão ativa.
  if (pathname === "/login" && sessao) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Não roda em API, logout, assets do Next e arquivos estáticos.
  matcher: ["/((?!api|logout|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
