import { z } from "zod";
import { lerNumero } from "@/lib/utils/numero";

const vazio = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const dinheiro = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? lerNumero(v) : v),
    z
      .number(msg)
      .refine(Number.isFinite, msg)
      .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Use no máximo 2 casas decimais"),
  );
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

export const FORMAS_DESPESA = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  boleto: "Boleto",
  transferencia: "Transferência",
} as const;
type Forma = keyof typeof FORMAS_DESPESA;
const formas = Object.keys(FORMAS_DESPESA) as [Forma, ...Forma[]];

export const MOTIVOS_DIFERENCA = ["Erro de troco", "Venda não registrada", "Sangria não registrada", "Furto / extravio", "Outro"] as const;

export const abrirCaixaSchema = z.object({
  caixa: z.string().regex(/^\d{2}$/, "Selecione o caixa"),
  saldoInicial: dinheiro("Informe o saldo inicial").pipe(z.number().min(0, "Não pode ser negativo").max(1_000_000)),
  observacao: z.preprocess(vazio, z.string().trim().max(300).optional()),
});

export const movimentoCaixaSchema = z.object({
  tipo: z.enum(["suprimento", "sangria"], "Selecione o tipo"),
  valor: dinheiro("Informe o valor").pipe(z.number().positive("Deve ser maior que zero").max(1_000_000)),
  motivo: z.string().trim().min(3, "Descreva o motivo").max(300),
});

export const fecharCaixaSchema = z.object({
  sessaoId: z.coerce.number().int().positive(),
  saldoReal: dinheiro("Informe o dinheiro contado").pipe(z.number().min(0, "Não pode ser negativo").max(10_000_000)),
  motivoDiferenca: z.preprocess(vazio, z.enum(MOTIVOS_DIFERENCA).optional()),
  observacao: z.preprocess(vazio, z.string().trim().max(300).optional()),
});

export const despesaSchema = z
  .object({
    categoria: z.string().trim().min(1, "Selecione a categoria").max(60),
    descricao: z.string().trim().min(3, "Descreva a despesa").max(300),
    valor: dinheiro("Informe o valor").pipe(z.number().positive("Deve ser maior que zero").max(99_999_999)),
    dataDespesa: data,
    tipo: z.enum(["fixa", "variavel"]).default("variavel"),
    recorrente: z.preprocess(vazio, z.enum(["mensal", "semanal"]).optional()),
    fornecedorNome: z.preprocess(vazio, z.string().trim().min(2, "Nome muito curto").max(150).optional()),
    numeroNf: z.preprocess(vazio, z.string().trim().max(50).optional()),
    pagamento: z.enum(["agora", "prazo"], "Selecione como foi pago"),
    formaPagamento: z.preprocess(vazio, z.enum(formas).optional()),
    doCaixa: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()),
    parcelas: z.preprocess((v) => (typeof v === "string" ? (v.trim() === "" ? 1 : Number(v)) : v), z.number().int().min(1, "Mínimo 1").max(24, "Máximo 24")),
    primeiroVencimento: z.preprocess(vazio, data.optional()),
    observacoes: z.preprocess(vazio, z.string().trim().max(500).optional()),
  })
  .refine((d) => d.pagamento !== "agora" || d.formaPagamento, { message: "Informe a forma de pagamento", path: ["formaPagamento"] })
  .refine((d) => d.pagamento !== "prazo" || d.primeiroVencimento, { message: "Informe o vencimento", path: ["primeiroVencimento"] })
  .refine((d) => !d.doCaixa || (d.pagamento === "agora" && d.formaPagamento === "dinheiro"), {
    message: "Só despesas pagas agora em dinheiro saem do caixa",
    path: ["doCaixa"],
  });

export type DespesaInput = z.infer<typeof despesaSchema>;

export const pagamentoContaSchema = z.object({
  contaId: z.coerce.number().int().positive(),
  valor: dinheiro("Informe o valor").pipe(z.number().positive("Deve ser maior que zero")),
  dataPagamento: data,
  forma: z.enum(formas, "Selecione a forma"),
  numeroTransacao: z.preprocess(vazio, z.string().trim().max(100).optional()),
});
