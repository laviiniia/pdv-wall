import { z } from "zod";

const vazio = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

/** Entrada por compra (MODULO_2_4, seção 2). Enviada como JSON pela tela. */
export const entradaSchema = z.object({
  fornecedorId: z.number().int().positive().optional(),
  fornecedorNome: z.preprocess(vazio, z.string().trim().min(2, "Informe o fornecedor").max(150).optional()),
  numeroNf: z.string().trim().min(1, "Informe o número da nota fiscal").max(50, "Máximo 50 caracteres"),
  dataCompra: data,
  observacoes: z.preprocess(vazio, z.string().trim().max(500).optional()),
  itens: z
    .array(
      z.object({
        produtoId: z.number().int().positive("Selecione o produto"),
        quantidade: z.number("Informe a quantidade").positive("Quantidade deve ser maior que zero").max(1_000_000),
        precoUnitario: z.number("Informe o preço").min(0, "Preço não pode ser negativo").max(9_999_999),
        lote: z.preprocess(vazio, z.string().trim().max(50).optional()),
        dataValidade: z.preprocess(vazio, data.optional()),
      }),
    )
    .min(1, "Adicione pelo menos um produto")
    .max(100, "Máximo de 100 itens por entrada"),
}).refine((e) => e.fornecedorId || e.fornecedorNome, { message: "Informe o fornecedor", path: ["fornecedorNome"] });

export type EntradaInput = z.infer<typeof entradaSchema>;

export const TIPOS_SAIDA = { devolucao: "Devolução", dano: "Dano", perda: "Perda (vencimento, roubo...)", ajuste: "Ajuste de contagem" } as const;

export const saidaSchema = z.object({
  tipo: z.enum(Object.keys(TIPOS_SAIDA) as [keyof typeof TIPOS_SAIDA], "Selecione o tipo"),
  produtoId: z.coerce.number("Selecione o produto").int().positive("Selecione o produto"),
  /** Ajuste pode ser positivo (achou mais) ou negativo; os demais tipos sempre retiram. */
  direcao: z.enum(["saida", "entrada"]).default("saida"),
  quantidade: z.number("Informe a quantidade").positive("Quantidade deve ser maior que zero").max(1_000_000),
  motivo: z.string().trim().min(3, "Descreva o motivo").max(300, "Máximo 300 caracteres"),
});

export type SaidaInput = z.infer<typeof saidaSchema>;

export const contagemSchema = z.object({
  inventarioId: z.number().int().positive(),
  contagens: z
    .array(z.object({ produtoId: z.number().int().positive(), quantidadeReal: z.number().min(0, "Não pode ser negativa").max(10_000_000).nullable() }))
    .max(5000),
});
