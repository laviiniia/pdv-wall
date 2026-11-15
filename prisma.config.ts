import { defineConfig } from "prisma/config";

// O Prisma CLI não carrega .env sozinho: lemos .env.local (padrão do Next.js).
try {
  process.loadEnvFile(".env.local");
} catch {
  // arquivo ausente: as variáveis podem vir do ambiente (CI, Vercel, etc.)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (postinstall na Vercel) não precisa de banco: sem DATABASE_URL, segue vazio.
    // Comandos que conectam (migrate, db seed) falham com a mensagem do próprio Prisma.
    url: process.env.DATABASE_URL ?? "",
    // Com `prisma dev`, o shadow DB precisa ser o servidor separado que ele expõe:
    // no servidor principal todos os nomes de banco apontam para o mesmo banco.
    ...(process.env.SHADOW_DATABASE_URL && { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }),
  },
});
