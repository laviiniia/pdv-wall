// Dados iniciais para desenvolvimento: perfis, usuário admin, categorias e produtos de exemplo.
// Rode com: npx prisma db seed
try {
  process.loadEnvFile(".env.local");
} catch {}
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PERMISSOES_PADRAO, type RoleNome } from "../lib/constants/roles";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  for (const [nome, { descricao, permissoes }] of Object.entries(PERMISSOES_PADRAO)) {
    await prisma.role.upsert({
      where: { nome },
      update: { descricao, permissoes },
      create: { nome: nome as RoleNome, descricao, permissoes },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { nome: "admin" } });
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@pdv.local";
  const senha = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const admin = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nome: "Administrador",
      email,
      passwordHash: await bcrypt.hash(senha, 10),
      roleId: adminRole.id,
    },
  });

  const categorias = [
    { nome: "Lanches", corHex: "#F59E0B", icone: "🍔" },
    { nome: "Bebidas", corHex: "#0066CC", icone: "🥤" },
    { nome: "Sobremesas", corHex: "#EC4899", icone: "🍰" },
  ];
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { nome: c.nome },
      update: {},
      create: { ...c, criadoPorId: admin.id },
    });
  }

  const cat = Object.fromEntries(
    (await prisma.categoria.findMany()).map((c) => [c.nome, c.id]),
  );

  const produtos = [
    { sku: "LAN-001", nome: "X-Burguer", categoria: "Lanches", custo: 9.5, venda: 22.9, un: "un", ean: null },
    { sku: "LAN-002", nome: "X-Salada", categoria: "Lanches", custo: 10.5, venda: 24.9, un: "un", ean: null },
    { sku: "BEB-001", nome: "Refrigerante Lata", categoria: "Bebidas", custo: 2.8, venda: 6.5, un: "un", ean: "7894900011517" },
    { sku: "BEB-002", nome: "Suco Natural 500ml", categoria: "Bebidas", custo: 3.2, venda: 9.9, un: "un", ean: null },
    { sku: "SOB-001", nome: "Pudim", categoria: "Sobremesas", custo: 3.0, venda: 11.0, un: "un", ean: null },
  ] as const;

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { sku: p.sku },
      // só preenche o código de barras de exemplo se ainda não houver um
      update: p.ean ? { codigoBarras: p.ean } : {},
      create: {
        codigoBarras: p.ean,
        sku: p.sku,
        nome: p.nome,
        categoriaId: cat[p.categoria],
        precoCusto: p.custo,
        precoVenda: p.venda,
        unidadeMedida: p.un,
        quantidadeMinima: 10,
        criadoPorId: admin.id,
      },
    });
  }

  // Cupom de exemplo para testar o PDV (válido por 1 ano a partir do seed).
  const agora = new Date();
  await prisma.cupomPromocional.upsert({
    where: { codigo: "PROMO10" },
    update: {},
    create: {
      codigo: "PROMO10",
      descricao: "10% de desconto (exemplo)",
      tipo: "percentual",
      valor: 10,
      valorMinimo: 20,
      inicio: agora,
      expiracao: new Date(agora.getTime() + 365 * 86_400_000),
      criadoPorId: admin.id,
    },
  });

  console.log(`Seed concluído. Login de desenvolvimento: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
