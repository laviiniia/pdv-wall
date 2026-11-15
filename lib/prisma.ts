import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Singleton: evita abrir várias conexões durante o hot reload do `next dev`.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Veja .env.example.");
  }
  // O banco local do `prisma dev` aceita uma conexão por vez: com mais de uma no pool,
  // ele derruba a anterior (erro P1017 "Server has closed the connection").
  // Em Supabase/produção, deixe DATABASE_POOL_MAX vazio para usar o padrão do driver.
  const max = Number(process.env.DATABASE_POOL_MAX) || undefined;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
}

function cliente() {
  return (globalForPrisma.prisma ??= createPrismaClient());
}

/**
 * Client criado só no primeiro uso. Importar este módulo não exige DATABASE_URL — o build
 * (`next build` na Vercel) importa as rotas para ler a configuração delas sem acessar o banco.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_alvo, prop) {
    const c = cliente();
    const valor = Reflect.get(c, prop, c);
    return typeof valor === "function" ? valor.bind(c) : valor;
  },
});
