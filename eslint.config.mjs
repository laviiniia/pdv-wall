import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Pastas de trabalho (git worktrees) de sessões paralelas do Claude Code:
    // são cópias do projeto, com builds próprios, e não devem ser analisadas aqui.
    ".claude/worktrees/**",
    // Prisma Client gerado
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
