import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { exigirAlguma } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import {
  escopo,
  lerFiltroAuditoria,
  listarAuditoria,
  MODULOS_AUDITORIA,
  NIVEIS,
  PERIODOS,
  usuariosParaFiltro,
} from "@/lib/services/auditoria.service";
import { getConfig } from "@/lib/services/configuracoes.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Auditoria" };

const TOM_NIVEL = { INFO: "neutro", WARN: "aviso", ERROR: "erro", CRITICAL: "erro" } as const;
const campo = "h-8 rounded-md border bg-background px-2 text-sm text-foreground";

export default async function AuditoriaPage({ searchParams }: PageProps<"/admin/auditoria">) {
  const usuario = await exigirAlguma([PERMISSAO.AUDITORIA_VER, PERMISSAO.AUDITORIA_VER_VENDAS]);
  const sp = await searchParams;
  const f = lerFiltroAuditoria(sp);
  const esc = escopo(usuario.permissoes);
  const [{ registros, total, alertas, totalPaginas, porModulo }, usuarios, empresa] = await Promise.all([
    listarAuditoria(f, usuario.permissoes),
    usuariosParaFiltro(),
    getConfig("empresa"),
  ]);
  const tz = empresa.funcionamento.timezone;
  const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "medium" });
  const qs = (extra: Record<string, string>) =>
    new URLSearchParams({
      periodo: f.periodo,
      ...(f.modulo && { modulo: f.modulo }),
      ...(f.usuarioId && { usuario: String(f.usuarioId) }),
      ...(f.nivel && { nivel: f.nivel }),
      ...(f.acao && { acao: f.acao }),
      ...extra,
    }).toString();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          titulo="Auditoria"
          descricao={esc.total ? "Tudo o que foi feito no sistema, por quem e de onde." : "Ações de vendas, pedidos online e caixa."}
        />
        <a href={`/api/auditoria?${qs({})}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
          <Download className="size-4" /> Exportar CSV
        </a>
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Período
          <select name="periodo" defaultValue={f.periodo} className={campo}>
            {Object.entries(PERIODOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Módulo
          <select name="modulo" defaultValue={f.modulo ?? ""} className={campo}>
            <option value="">Todos</option>
            {esc.modulos.map((m) => <option key={m} value={m}>{MODULOS_AUDITORIA[m]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Usuário
          <select name="usuario" defaultValue={f.usuarioId ?? ""} className={cn(campo, "max-w-48")}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Nível
          <select name="nivel" defaultValue={f.nivel ?? ""} className={campo}>
            <option value="">Todos</option>
            {NIVEIS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ação contém
          <input name="acao" defaultValue={f.acao} placeholder="Ex.: LOGIN, VENDA" className={cn(campo, "w-40 uppercase")} />
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">Filtrar</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg border px-3 py-1.5">
          <span className="font-semibold tabular-nums">{total.toLocaleString("pt-BR")}</span> ações
        </span>
        {alertas > 0 && (
          <Link href={`/admin/auditoria?${qs({ nivel: "WARN" })}`} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 hover:bg-amber-500/15">
            <span className="font-semibold tabular-nums">{alertas}</span> alertas
          </Link>
        )}
        {porModulo.map((m) => (
          <Link key={m.modulo} href={`/admin/auditoria?${qs({ modulo: m.modulo, pagina: "1" })}`} className="rounded-lg border px-3 py-1.5 text-muted-foreground hover:bg-muted">
            {MODULOS_AUDITORIA[m.modulo] ?? m.modulo}: <span className="tabular-nums text-foreground">{m.quantidade}</span>
          </Link>
        ))}
      </div>

      {registros.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">Nenhum registro com esses filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Data/hora</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Módulo</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {registros.map((r) => (
                <tr key={r.id} className="align-top hover:bg-muted/30">
                  <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{quando(r.dataHora)}</td>
                  <td className="px-4 py-2.5">
                    {r.usuario?.nome ?? <span className="text-muted-foreground">—</span>}
                    {r.emailUsuario && <div className="text-xs text-muted-foreground">{r.emailUsuario}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs">{r.acao}</span>
                    <div className="mt-1 flex gap-1">
                      {r.nivel !== "INFO" && <Selo tom={TOM_NIVEL[r.nivel as keyof typeof TOM_NIVEL] ?? "neutro"}>{r.nivel}</Selo>}
                      {!r.sucesso && <Selo tom="erro">Falhou</Selo>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{MODULOS_AUDITORIA[r.modulo ?? ""] ?? r.modulo ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <details className="max-w-md">
                      <summary className="cursor-pointer text-xs text-primary hover:underline">ver</summary>
                      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                        {r.descricao && (<><dt className="text-muted-foreground">Descrição</dt><dd>{r.descricao}</dd></>)}
                        {r.mensagemErro && (<><dt className="text-muted-foreground">Erro</dt><dd>{r.mensagemErro}</dd></>)}
                        <dt className="text-muted-foreground">IP</dt>
                        <dd className="font-mono">{r.ipAddress ?? "—"}</dd>
                        <dt className="text-muted-foreground">Navegador</dt>
                        <dd className="break-all">{r.userAgent ?? "—"}</dd>
                      </dl>
                      {r.dadosModificados != null && (
                        <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(r.dadosModificados, null, 2)}</pre>
                      )}
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3 text-sm" aria-label="Paginação">
          {f.pagina > 1 && <Link href={`/admin/auditoria?${qs({ pagina: String(f.pagina - 1) })}`} className="rounded-md border px-3 py-1.5 hover:bg-muted">← Anterior</Link>}
          <span className="text-muted-foreground">Página {f.pagina} de {totalPaginas}</span>
          {f.pagina < totalPaginas && <Link href={`/admin/auditoria?${qs({ pagina: String(f.pagina + 1) })}`} className="rounded-md border px-3 py-1.5 hover:bg-muted">Próxima →</Link>}
        </nav>
      )}
    </>
  );
}
