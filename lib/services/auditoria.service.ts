import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { prisma } from "@/lib/prisma";
import { dataNoFuso, intervaloDoDia } from "@/lib/utils/data";
import { getConfig } from "./configuracoes.service";

export const MODULOS_AUDITORIA: Record<string, string> = {
  AUTENTICACAO: "Login e senhas",
  USUARIOS: "Usuários",
  PERMISSOES: "Permissões",
  CONFIGURACOES: "Configurações",
  PRODUTOS: "Produtos",
  CATEGORIAS: "Categorias",
  EMAIL: "E-mail",
  VENDAS_PDV: "Vendas (PDV)",
  PEDIDOS_ONLINE: "Pedidos online",
  ESTOQUE: "Estoque",
  FINANCEIRO: "Financeiro e caixa",
};
export const NIVEIS = ["INFO", "WARN", "ERROR", "CRITICAL"] as const;
export const PERIODOS = { hoje: "Hoje", "7d": "Últimos 7 dias", "30d": "Últimos 30 dias", "90d": "Últimos 90 dias" } as const;
type Periodo = keyof typeof PERIODOS;

/**
 * Escopo de quem está vendo: admin (auditoria.ver) vê tudo; gerente (auditoria.ver_vendas) vê
 * só vendas, pedidos online e caixa — a "auditoria de vendas" da matriz do Módulo 3.
 */
export function escopo(permissoes: string[]): { total: boolean; where: Prisma.AuditoriaWhereInput; modulos: string[] } {
  if (temPermissao(permissoes, PERMISSAO.AUDITORIA_VER)) return { total: true, where: {}, modulos: Object.keys(MODULOS_AUDITORIA) };
  return {
    total: false,
    where: { OR: [{ modulo: { in: ["VENDAS_PDV", "PEDIDOS_ONLINE"] } }, { modulo: "FINANCEIRO", acao: { startsWith: "CAIXA_" } }] },
    modulos: ["VENDAS_PDV", "PEDIDOS_ONLINE", "FINANCEIRO"],
  };
}

export type FiltroAuditoria = { periodo: Periodo; modulo?: string; usuarioId?: number; nivel?: string; acao?: string; pagina: number };

export function lerFiltroAuditoria(sp: Record<string, string | string[] | undefined>): FiltroAuditoria {
  const p = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  return {
    periodo: (p("periodo") && p("periodo")! in PERIODOS ? p("periodo") : "7d") as Periodo,
    modulo: p("modulo") && p("modulo")! in MODULOS_AUDITORIA ? p("modulo") : undefined,
    usuarioId: Number(p("usuario")) || undefined,
    nivel: (NIVEIS as readonly string[]).includes(p("nivel") ?? "") ? p("nivel") : undefined,
    acao: p("acao")?.trim().toUpperCase().slice(0, 50) || undefined,
    pagina: Math.max(1, Number(p("pagina")) || 1),
  };
}

async function montarWhere(f: FiltroAuditoria, permissoes: string[]): Promise<Prisma.AuditoriaWhereInput> {
  const tz = (await getConfig("empresa")).funcionamento.timezone;
  const hoje = dataNoFuso(new Date(), tz);
  const dias = { hoje: 0, "7d": 6, "30d": 29, "90d": 89 }[f.periodo];
  const de = new Date(Date.parse(`${hoje}T00:00:00Z`) - dias * 86_400_000).toISOString().slice(0, 10);
  return {
    AND: [
      escopo(permissoes).where,
      { dataHora: { gte: intervaloDoDia(de, tz).inicio } },
      f.modulo ? { modulo: f.modulo } : {},
      f.usuarioId ? { usuarioId: f.usuarioId } : {},
      f.nivel ? { nivel: f.nivel } : {},
      f.acao ? { acao: { contains: f.acao } } : {},
    ],
  };
}

const POR_PAGINA = 50;

export async function listarAuditoria(f: FiltroAuditoria, permissoes: string[]) {
  const where = await montarWhere(f, permissoes);
  const [registros, total, porModulo, alertas] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      orderBy: { dataHora: "desc" },
      skip: (f.pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: { usuario: { select: { nome: true } } },
    }),
    prisma.auditoria.count({ where }),
    prisma.auditoria.groupBy({ by: ["modulo"], where, _count: true }),
    prisma.auditoria.count({ where: { AND: [where, { nivel: { in: ["WARN", "ERROR", "CRITICAL"] } }] } }),
  ]);
  return {
    registros,
    total,
    alertas,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    porModulo: porModulo.map((m) => ({ modulo: m.modulo ?? "—", quantidade: m._count })).sort((a, b) => b.quantidade - a.quantidade),
  };
}

/** Para exportação: até 5.000 linhas do filtro atual. */
export async function exportarAuditoria(f: FiltroAuditoria, permissoes: string[]) {
  return prisma.auditoria.findMany({
    where: await montarWhere(f, permissoes),
    orderBy: { dataHora: "desc" },
    take: 5000,
    include: { usuario: { select: { nome: true } } },
  });
}

/** Usuários que aparecem no filtro (todos para admin). */
export function usuariosParaFiltro() {
  return prisma.usuario.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
