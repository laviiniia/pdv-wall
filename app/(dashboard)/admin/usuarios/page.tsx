import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { type FiltroUsuarios, listarUsuarios } from "@/lib/services/usuarios.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Usuários" };

const MENSAGENS: Record<string, string> = {
  criado: "Usuário criado. Ele precisará trocar a senha no primeiro acesso.",
  convite: "Usuário criado. Um e-mail com o link para definir a senha foi enviado.",
  atualizado: "Usuário atualizado.",
};

const PERFIS: Record<string, string> = { admin: "Administrador", gerente: "Gerente", operador: "Operador" };

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function UsuariosPage({ searchParams }: PageProps<"/admin/usuarios">) {
  await exigirPermissao(PERMISSAO.USUARIOS_GERENCIAR);
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const status = (["ativos", "inativos", "todos"] as const).find((s) => s === param("status")) ?? "ativos";
  const role = param("role") && param("role")! in PERFIS ? param("role") : undefined;
  const busca = param("busca")?.trim() || undefined;
  const filtro: FiltroUsuarios = { status, role, busca };

  const { usuarios, totalAtivos, totalInativos } = await listarUsuarios(filtro);
  const msg = param("msg");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          titulo="Usuários"
          descricao={`${totalAtivos + totalInativos} usuários (ativos: ${totalAtivos}, inativos: ${totalInativos})`}
        />
        <Link
          href="/admin/usuarios/novo"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="size-4" /> Novo usuário
        </Link>
      </div>

      {msg && MENSAGENS[msg] && (
        <p role="status" className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm">
          {MENSAGENS[msg]}
        </p>
      )}

      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Buscar
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Nome ou e-mail"
            className="h-8 w-56 rounded-md border bg-background px-2.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Perfil
          <select name="role" defaultValue={role ?? ""} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="">Todos</option>
            {Object.entries(PERFIS).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          <select name="status" defaultValue={status} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground">
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <button type="submit" className="h-8 rounded-md border px-3 text-sm hover:bg-muted">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado com esses filtros.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className={cn("border-t", !u.ativo && "text-muted-foreground")}>
                <td className="px-4 py-3 font-medium">{u.nome}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{PERFIS[u.role.nome] ?? u.role.nome}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge tom={u.ativo ? "ok" : "neutro"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                    {u.bloqueado && <Badge tom="erro">Bloqueado</Badge>}
                    {u.deveTrocarSenha && <Badge tom="aviso">Senha temporária</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{u.ultimoLogin ? dataHora.format(u.ultimoLogin) : "Nunca"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Badge({ tom, children }: { tom: "ok" | "neutro" | "erro" | "aviso"; children: React.ReactNode }) {
  const cores = {
    ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    neutro: "bg-muted text-muted-foreground",
    erro: "bg-destructive/10 text-destructive",
    aviso: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cores[tom])}>{children}</span>;
}
