import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { prisma } from "@/lib/prisma";
import { resumoAlertas } from "@/lib/services/estoque.service";

export const metadata: Metadata = { title: "Dashboard" };

const AVISOS: Record<string, { texto: string; erro?: boolean }> = {
  "senha:alterada": { texto: "Senha alterada com sucesso." },
  "erro:sem-permissao": { texto: "Você não tem permissão para acessar aquela página.", erro: true },
};

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const sp = await searchParams;
  const aviso = (["senha", "erro"] as const).map((k) => AVISOS[`${k}:${sp[k]}`]).find(Boolean);

  const usuario = await getUsuarioAtual();
  const veEstoque = temPermissao(usuario.permissoes, PERMISSAO.ESTOQUE_VER);
  const [produtos, categorias, usuarios, alertas] = await Promise.all([
    prisma.produto.count({ where: { status: "ativo" } }),
    prisma.categoria.count({ where: { ativa: true } }),
    prisma.usuario.count({ where: { ativo: true } }),
    veEstoque ? resumoAlertas() : null,
  ]);

  const cards: { titulo: string; valor: number; href?: string }[] = [
    ...(alertas && alertas.alertasAtivos && alertas.produtos > 0
      ? [{ titulo: "Alertas de estoque", valor: alertas.semEstoque + alertas.criticos + alertas.baixos, href: "/estoque?situacao=alertas" }]
      : []),
    { titulo: "Produtos ativos", valor: produtos, href: "/produtos" },
    { titulo: "Categorias", valor: categorias, href: "/produtos" },
    {
      titulo: "Usuários ativos",
      valor: usuarios,
      href: temPermissao(usuario.permissoes, PERMISSAO.USUARIOS_GERENCIAR) ? "/admin/usuarios" : undefined,
    },
  ];

  return (
    <>
      <PageHeader titulo="Dashboard" descricao="Visão geral da operação" />
      {aviso && (
        <p
          role={aviso.erro ? "alert" : "status"}
          className={`mb-4 rounded-md px-3 py-2 text-sm ${aviso.erro ? "bg-destructive/10 text-destructive" : "bg-primary/10"}`}
        >
          {aviso.texto}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const conteudo = (
            <>
              <p className="text-sm text-muted-foreground">{c.titulo}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{c.valor}</p>
            </>
          );
          return c.href ? (
            <Link key={c.titulo} href={c.href} className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50">
              {conteudo}
            </Link>
          ) : (
            <div key={c.titulo} className="rounded-xl border bg-card p-5">
              {conteudo}
            </div>
          );
        })}
      </div>
    </>
  );
}
