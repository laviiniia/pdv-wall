// Formato e valores padrão de cada seção de configurações (docs/modulos/MODULO_4_CONFIGURACOES.md).
// Cada seção é guardada como JSON em uma linha da tabela `configuracoes` (chave = nome da seção).
import { z } from "zod";
import { lerNumero } from "@/lib/utils/numero";

// ─── Helpers de entrada (os valores chegam de <form> como texto) ─────────────

/** Número em formato pt-BR; vazio → undefined (deixa o .default() agir). */
const numero = (s: z.ZodNumber) => z.preprocess((v) => (typeof v === "string" ? lerNumero(v) : v), s);

/** Checkbox: "true"/"on" → true; ausente → false. */
const checkbox = z.preprocess((v) => v === true || v === "true" || v === "on", z.boolean());

const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const textoOpcional = (max: number) => texto(max).default("");
const soDigitos = (v: unknown) => (typeof v === "string" ? v.replace(/\D/g, "") : v);
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM");
const pct = (max = 100) => numero(z.number("Informe um número").min(0, "Mínimo 0").max(max, `Máximo ${max}`));

export function cnpjValido(cnpj: string) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const dv = (base: string, pesos: number[]) => {
    const soma = pesos.reduce((acc, p, i) => acc + Number(base[i]) * p, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = dv(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

// ─── Empresa ────────────────────────────────────────────────────────────────

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const REGIMES = {
  simples: "Simples Nacional",
  mei: "MEI",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
} as const;

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const empresaSchema = z.object({
  nome: texto(150).min(2, "Informe o nome da empresa").default("Minha Empresa"),
  nomeFantasia: textoOpcional(100),
  cnpj: z
    .preprocess(soDigitos, z.string().refine((v) => v === "" || cnpjValido(v), "CNPJ inválido"))
    .default(""),
  inscricaoEstadual: textoOpcional(20),
  regimeTributario: z.enum(Object.keys(REGIMES) as [keyof typeof REGIMES], "Selecione o regime").default("simples"),
  telefone: textoOpcional(20),
  email: z.union([z.literal(""), z.email("E-mail inválido")]).default(""),
  website: textoOpcional(150),
  endereco: z
    .object({
      cep: z.preprocess(soDigitos, z.string().refine((v) => v === "" || v.length === 8, "CEP deve ter 8 dígitos")).default(""),
      rua: textoOpcional(150),
      numero: textoOpcional(20),
      complemento: textoOpcional(100),
      bairro: textoOpcional(100),
      cidade: textoOpcional(100),
      uf: z.union([z.literal(""), z.enum(UFS)]).default(""),
    })
    .default({ cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" }),
  funcionamento: z
    .object({
      abertura: hora.default("11:00"),
      fechamento: hora.default("23:00"),
      dias: z.array(z.coerce.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
      timezone: z.string().default("America/Sao_Paulo"),
    })
    .default({ abertura: "11:00", fechamento: "23:00", dias: [0, 1, 2, 3, 4, 5, 6], timezone: "America/Sao_Paulo" }),
});

// ─── Vendas ─────────────────────────────────────────────────────────────────

export const FORMAS_PAGAMENTO = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  pix: "PIX",
  voucher: "Vale-refeição / voucher",
} as const;

type FormaPagamento = keyof typeof FORMAS_PAGAMENTO;

export const vendasSchema = z
  .object({
    descontoMaxOperadorPct: pct().default(20),
    descontoMaxGerentePct: pct().default(50),
    aprovacaoGerenteAcimaDe: numero(z.number().min(0, "Mínimo 0")).default(200),
    exigirAprovacao: checkbox.default(true),
    formasPagamento: z
      .array(z.enum(Object.keys(FORMAS_PAGAMENTO) as [FormaPagamento]))
      .min(1, "Ative pelo menos uma forma de pagamento")
      .default(["dinheiro", "debito", "credito", "pix"]),
    parcelamentoMax: numero(z.number().int("Número inteiro").min(1, "Mínimo 1").max(24, "Máximo 24")).default(1),
    taxaDebitoPct: pct(20).default(0),
    taxaCreditoPct: pct(20).default(0),
    impressoraAtiva: checkbox.default(false),
    papel: z.enum(["58mm", "80mm", "A4"]).default("80mm"),
    copias: numero(z.number().int().min(1, "Mínimo 1").max(5, "Máximo 5")).default(1),
    rodapeCupom: textoOpcional(200).default("Obrigado! Volte sempre!"),
    pedidosOnlineAtivos: checkbox.default(false),
    limitePedidosSimultaneos: numero(z.number().int().min(1, "Mínimo 1").max(500)).default(30),
    tempoPreparoMin: numero(z.number().int().min(1, "Mínimo 1").max(240)).default(20),
    pedidosOnlineInicio: hora.default("11:00"),
    pedidosOnlineFim: hora.default("22:30"),
  })
  .refine((v) => v.descontoMaxOperadorPct <= v.descontoMaxGerentePct, {
    message: "O limite do operador não pode ser maior que o do gerente",
    path: ["descontoMaxOperadorPct"],
  });

// ─── Estoque ────────────────────────────────────────────────────────────────

export const estoqueSchema = z
  .object({
    alertasAtivos: checkbox.default(true),
    nivelCriticoPct: pct(500).default(20),
    nivelBaixoPct: pct(500).default(50),
    baixaAutomaticaVendas: checkbox.default(true),
    confirmarSaidaManual: checkbox.default(true),
    permitirEstoqueNegativo: checkbox.default(false),
    rastrearLotes: checkbox.default(true),
    diasAlertaValidade: numero(z.number().int().min(0).max(365, "Máximo 365")).default(7),
    permitirVendaVencido: checkbox.default(false),
    divergenciaMaxInventarioPct: pct().default(2),
    frequenciaInventario: z.enum(["mensal", "trimestral", "anual"]).default("mensal"),
  })
  .refine((v) => v.nivelCriticoPct <= v.nivelBaixoPct, {
    message: "O nível crítico deve ser menor ou igual ao nível baixo",
    path: ["nivelCriticoPct"],
  });

// ─── Financeiro ─────────────────────────────────────────────────────────────

export const CATEGORIAS_DESPESA_PADRAO = {
  cmv: "CMV (custo dos produtos vendidos)",
  pessoal: "Pessoal (salários, encargos)",
  operacional: "Operacional (aluguel, serviços)",
  marketing: "Marketing",
  financeiro: "Financeiro (juros, taxas)",
  outros: "Outros",
} as const;

export const financeiroSchema = z.object({
  icmsPct: pct().default(18),
  pisPct: pct().default(1.65),
  cofinsPct: pct().default(7.6),
  issPct: pct().default(5),
  margemMinimaPct: pct().default(40),
  categoriasDespesa: z
    .array(z.enum(Object.keys(CATEGORIAS_DESPESA_PADRAO) as [keyof typeof CATEGORIAS_DESPESA_PADRAO]))
    .default(Object.keys(CATEGORIAS_DESPESA_PADRAO) as (keyof typeof CATEGORIAS_DESPESA_PADRAO)[]),
  categoriasCustomizadas: z
    .array(texto(50))
    .transform((l) => [...new Set(l.filter(Boolean))])
    .pipe(z.array(z.string()).max(10, "Máximo 10 categorias customizadas"))
    .default([]),
  caixasQuantidade: numero(z.number().int().min(1, "Mínimo 1").max(50)).default(1),
  diferencaCaixaSoGerente: checkbox.default(true),
});

// ─── Registro das seções ────────────────────────────────────────────────────

export const SECOES = {
  empresa: { titulo: "Empresa", descricao: "Dados cadastrais, endereço e funcionamento", schema: empresaSchema },
  vendas: { titulo: "Vendas", descricao: "Descontos, pagamentos, impressora e pedidos online", schema: vendasSchema },
  estoque: { titulo: "Estoque", descricao: "Alertas, movimentações, lote e validade", schema: estoqueSchema },
  financeiro: { titulo: "Financeiro", descricao: "Impostos, margem, categorias de despesa e caixas", schema: financeiroSchema },
} as const;

export type Secao = keyof typeof SECOES;
export type ConfigEmpresa = z.infer<typeof empresaSchema>;
export type ConfigVendas = z.infer<typeof vendasSchema>;
export type ConfigEstoque = z.infer<typeof estoqueSchema>;
export type ConfigFinanceiro = z.infer<typeof financeiroSchema>;
export type ConfigPorSecao = {
  empresa: ConfigEmpresa;
  vendas: ConfigVendas;
  estoque: ConfigEstoque;
  financeiro: ConfigFinanceiro;
};

export function ehSecao(v: string): v is Secao {
  return v in SECOES;
}
