import { defineConfig, env } from "prisma/config";

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
    url: env("DATABASE_URL"),
  },
});
