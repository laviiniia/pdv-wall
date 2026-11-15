import { z } from "zod";
import { lerNumero } from "@/lib/utils/numero";

const FORMAS = ["dinheiro", "debito", "credito", "pix", "voucher"] as const;

/** O que a tela do PDV envia para finalizar. Preços NÃO vêm daqui: o servidor busca no banco. */
export const finalizarVendaSchema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.number().int().positive(),
        quantidade: z.number().positive("Quantidade deve ser maior que zero").max(100_000),
      }),
    )
    .min(1, "O carrinho está vazio")
    .max(200, "Máximo de 200 itens por venda"),
  desconto: z
    .discriminatedUnion("tipo", [
      z.object({ tipo: z.literal("percentual"), valor: z.number().min(0).max(100) }),
      z.object({ tipo: z.literal("valor"), valor: z.number().min(0).max(99_999_999) }),
      z.object({ tipo: z.literal("cupom"), codigo: z.string().trim().min(1).max(50) }),
    ])
    .nullable(),
  pagamentos: z
    .array(
      z.object({
        forma: z.enum(FORMAS),
        valor: z.number().int().positive(),
        recebido: z.number().int().positive().optional(),
        parcelas: z.number().int().min(1).max(24).optional(),
        numeroTransacao: z.string().trim().max(100).optional(),
      }),
    )
    .max(6, "Máximo de 6 formas de pagamento"),
});

export type FinalizarVendaInput = z.infer<typeof finalizarVendaSchema>;

export const cancelarVendaSchema = z.object({
  id: z.coerce.number().int().positive(),
  motivo: z.string().trim().min(5, "Descreva o motivo (mínimo 5 caracteres)").max(500),
});

// ─── Cupons promocionais ────────────────────────────────────────────────────

const dinheiro = (msg: string) =>
  z.preprocess((v) => (typeof v === "string" ? lerNumero(v) : v), z.number(msg).refine(Number.isFinite, msg));

const dataHora = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v ? new Date(v) : undefined),
    z.date(msg).refine((d) => !Number.isNaN(d.getTime()), msg),
  );

export const cupomSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Mínimo 3 caracteres")
      .max(50, "Máximo 50 caracteres")
      .regex(/^[A-Z0-9_-]+$/, "Use letras, números, _ ou -"),
    descricao: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(200).optional()),
    tipo: z.enum(["percentual", "valor"], "Selecione o tipo"),
    valor: dinheiro("Informe o valor do desconto").pipe(z.number().positive("Deve ser maior que zero")),
    valorMinimo: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? 0 : v),
      dinheiro("Valor mínimo inválido").pipe(z.number().min(0, "Não pode ser negativo")),
    ),
    usosMaximos: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? Number(v) : v),
      z.number("Número inválido").int("Use um número inteiro").positive("Deve ser maior que zero").nullable(),
    ),
    inicio: dataHora("Informe o início"),
    expiracao: dataHora("Informe a expiração"),
    ativo: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()),
  })
  .refine((c) => c.tipo !== "percentual" || c.valor <= 100, { message: "Percentual máximo: 100%", path: ["valor"] })
  .refine((c) => c.expiracao > c.inicio, { message: "A expiração deve ser depois do início", path: ["expiracao"] });

export type CupomInput = z.infer<typeof cupomSchema>;
