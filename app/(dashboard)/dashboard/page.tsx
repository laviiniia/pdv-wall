import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await connection(); // dados sempre atuais (sem prerender no build)
  const [produtos, categorias, usuarios] = await Promise.all([
    prisma.produto.count({ where: { status: "ativo" } }),
    prisma.categoria.count({ where: { ativa: true } }),
    prisma.usuario.count({ where: { ativo: true } }),
  ]);

  const cards = [
    { titulo: "Produtos ativos", valor: produtos, href: "/produtos" },
    { titulo: "Categorias", valor: categorias, href: "/produtos" },
    { titulo: "Usuários ativos", valor: usuarios, href: "/configuracoes" },
  ];

  return (
    <>
      <PageHeader titulo="Dashboard" descricao="Visão geral da operação" />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.titulo}
            href={c.href}
            className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50"
          >
            <p className="text-sm text-muted-foreground">{c.titulo}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.valor}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
