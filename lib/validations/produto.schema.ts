// Regras de produtos e categorias (docs/modulos/MODULO_2_1_GESTAO_PRODUTOS.md, seções 1.1.4 e 3.1.2).
import { z } from "zod";
import { lerNumero } from "@/lib/utils/numero";

export const UNIDADES_MEDIDA = { un: "Unidade (un)", kg: "Quilo (kg)", g: "Grama (g)", L: "Litro (L)", ml: "Mililitro (ml)" } as const;

// Letras (com acento), números, espaços e hífen — a doc proíbe "caracteres especiais".
const SO_PERMITIDOS = /^[\p{L}\p{N} -]+$/u;

const vazioParaUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const dinheiro = (rotulo: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? lerNumero(v) : v),
    z
      .number(`Informe o ${rotulo}`)
      .refine((n) => Number.isFinite(n), `Informe o ${rotulo}`)
      .positive(`O ${rotulo} deve ser maior que zero`)
      .max(99_999_999.99, "Valor muito alto")
      .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Use no máximo 2 casas decimais"),
  );

/** Data "AAAA-MM-DD" do <input type="date">; vazio → null. */
const dataOpcional = z.preprocess(
  vazioParaUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional(),
);

export const produtoSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(100, "Máximo 100 caracteres")
      .regex(SO_PERMITIDOS, "Use apenas letras, números, espaços e hífen"),
    descricao: z.preprocess(vazioParaUndefined, z.string().trim().max(500, "Máximo 500 caracteres").optional()),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Mínimo 3 caracteres")
      .max(20, "Máximo 20 caracteres")
      .regex(/^[A-Z0-9]+-[0-9]+$/, "Use o formato TIPO-NÚMERO, ex.: HAM-001"),
    codigoBarras: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\s/g, "") || undefined : v),
      z.string().regex(/^\d{8,14}$/, "Use de 8 a 14 dígitos (EAN-8, EAN-13 ou GTIN-14)").optional(),
    ),
    categoriaId: z.coerce.number("Selecione a categoria").int().positive("Selecione a categoria"),
    ativo: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()),
    precoCusto: dinheiro("preço de custo"),
    precoVenda: dinheiro("preço de venda"),
    unidadeMedida: z.enum(Object.keys(UNIDADES_MEDIDA) as [keyof typeof UNIDADES_MEDIDA], "Selecione a unidade"),
    quantidadeMinima: z.preprocess(
      (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v)) : v),
      z.number("Informe a quantidade mínima").int("Use um número inteiro").min(0, "Não pode ser negativa").max(1_000_000),
    ),
    dataValidade: dataOpcional,
    lote: z.preprocess(vazioParaUndefined, z.string().trim().max(50, "Máximo 50 caracteres").optional()),
    exibirNoCardapio: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()),
    tempoPreparoMin: z.preprocess(
      (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v)) : v),
      z.number("Informe minutos").int("Use minutos inteiros").min(0, "Não pode ser negativo").max(240, "Máximo 240 min").optional(),
    ),
  })
  .refine((p) => p.precoVenda > p.precoCusto, {
    message: "O preço de venda deve ser maior que o preço de custo",
    path: ["precoVenda"],
  });

export type ProdutoInput = z.infer<typeof produtoSchema>;

export const categoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(SO_PERMITIDOS, "Use apenas letras, números, espaços e hífen"),
  descricao: z.preprocess(vazioParaUndefined, z.string().trim().max(200, "Máximo 200 caracteres").optional()),
  corHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .transform((c) => c.toUpperCase())
    .default("#808080"),
  icone: z.preprocess(vazioParaUndefined, z.string().trim().max(8, "Use um emoji").optional()),
  ativa: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;

// ─── Cálculos (seção 1.1.5) ─────────────────────────────────────────────────

/** Margem em R$ e % de lucro sobre o custo: (venda − custo) / custo × 100. */
export function calcularMargem(precoCusto: number, precoVenda: number) {
  const margem = Math.round((precoVenda - precoCusto) * 100) / 100;
  const percentual = precoCusto > 0 ? Math.round((margem / precoCusto) * 1000) / 10 : 0;
  return { margem, percentual };
}

/** Situação da validade em relação a hoje (fuso local do servidor). */
export function situacaoValidade(dataValidade: Date | null, diasAlerta: number, hoje = new Date()) {
  if (!dataValidade) return null;
  const inicioHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dias = Math.round((dataValidade.getTime() - inicioHoje) / 86_400_000);
  if (dias < 0) return { tipo: "vencido" as const, dias };
  if (dias <= diasAlerta) return { tipo: "vencendo" as const, dias };
  return { tipo: "ok" as const, dias };
}
