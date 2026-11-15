import { z } from "zod";
import { lerNumero } from "@/lib/utils/numero";

const textoOpcional = (max: number, msg: string) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max, msg).optional());

/** O que o cardápio digital envia. Preços NÃO vêm daqui: o servidor calcula com o banco. */
export const criarPedidoSchema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.number().int().positive(),
        quantidade: z.number().int("Quantidade inteira").min(1).max(50, "Máximo de 50 por item"),
        adicionais: z.array(z.number().int().positive()).max(20).default([]),
        observacao: textoOpcional(100, "Observação: máximo 100 caracteres"),
      }),
    )
    .min(1, "Seu carrinho está vazio")
    .max(30, "Máximo de 30 itens por pedido"),
  clienteNome: textoOpcional(100, "Nome muito longo"),
  clienteTelefone: textoOpcional(20, "Telefone muito longo"),
  alergias: textoOpcional(200, "Alergias: máximo 200 caracteres"),
  observacoes: textoOpcional(300, "Observações: máximo 300 caracteres"),
});

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;

export const avaliacaoSchema = z.object({
  nota: z.number().int().min(1, "Escolha de 1 a 5 estrelas").max(5),
  texto: textoOpcional(500, "Comentário: máximo 500 caracteres"),
});

export const adicionalSchema = z.object({
  produtoId: z.coerce.number().int().positive(),
  tipo: z.enum(["adicao", "remocao"], "Selecione o tipo"),
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  valor: z.preprocess(
    (v) => (typeof v === "string" ? (lerNumero(v) ?? 0) : v),
    z.number("Valor inválido").min(0, "Não pode ser negativo").max(9999),
  ),
});
