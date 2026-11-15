import { usuarioAtualOuNull } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { exportarAuditoria, lerFiltroAuditoria, MODULOS_AUDITORIA } from "@/lib/services/auditoria.service";
import { getConfig } from "@/lib/services/configuracoes.service";

const celula = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: Request) {
  const usuario = await usuarioAtualOuNull();
  if (!usuario) return new Response("Não autenticado", { status: 401 });
  if (![PERMISSAO.AUDITORIA_VER, PERMISSAO.AUDITORIA_VER_VENDAS].some((p) => temPermissao(usuario.permissoes, p))) {
    return new Response("Sem permissão", { status: 403 });
  }
  const f = lerFiltroAuditoria(Object.fromEntries(new URL(request.url).searchParams));
  const [registros, empresa] = await Promise.all([exportarAuditoria(f, usuario.permissoes), getConfig("empresa")]);
  const tz = empresa.funcionamento.timezone;
  const linhas = [
    ["Data/hora", "Usuário", "E-mail", "Ação", "Módulo", "Nível", "Sucesso", "IP", "Dados"],
    ...registros.map((r) => [
      r.dataHora.toLocaleString("pt-BR", { timeZone: tz }),
      r.usuario?.nome ?? "",
      r.emailUsuario ?? "",
      r.acao,
      MODULOS_AUDITORIA[r.modulo ?? ""] ?? r.modulo ?? "",
      r.nivel,
      r.sucesso ? "sim" : "não",
      r.ipAddress ?? "",
      r.dadosModificados == null ? "" : JSON.stringify(r.dadosModificados),
    ]),
  ];
  const csv = "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria_${f.periodo}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
