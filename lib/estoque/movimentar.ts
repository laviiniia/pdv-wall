import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import type { TipoMovimento } from "./situacao";

type Tx = Prisma.TransactionClient;

export class EstoqueInsuficiente extends Error {
  constructor(
    public produtoId: number,
    public nome: string,
    public disponivel: number,
  ) {
    super(`Estoque insuficiente de "${nome}" (disponível: ${disponivel.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}).`);
  }
}

/**
 * Único ponto que altera saldo de estoque. Faz a soma no próprio banco numa instrução
 * (UPDATE ... RETURNING): vendas simultâneas não perdem baixas e, quando o saldo não
 * pode ficar negativo, a condição é checada no mesmo UPDATE (sem janela de corrida).
 * Grava o movimento correspondente com saldo anterior e novo.
 */
export async function movimentarEstoque(
  tx: Tx,
  m: {
    produtoId: number;
    quantidade: number; // + entra, − sai
    tipo: TipoMovimento;
    usuarioId: number;
    permitirNegativo: boolean;
    referenciaTipo?: string;
    referenciaId?: number;
    referencia?: string;
    lote?: string | null;
    dataValidade?: Date | null;
    motivo?: string | null;
  },
) {
  const qtd = new Prisma.Decimal(m.quantidade.toFixed(3));
  const linhas = await tx.$queryRaw<{ quantidade_estoque: Prisma.Decimal; nome: string }[]>`
    UPDATE "produtos"
       SET "quantidade_estoque" = "quantidade_estoque" + ${qtd},
           "ultimo_movimento_em" = NOW()
     WHERE "id" = ${m.produtoId}
       AND (${m.permitirNegativo} OR ${qtd} >= 0 OR "quantidade_estoque" + ${qtd} >= 0)
 RETURNING "quantidade_estoque", "nome"`;

  if (linhas.length === 0) {
    const p = await tx.produto.findUnique({ where: { id: m.produtoId }, select: { nome: true, quantidadeEstoque: true } });
    if (!p) throw new Error(`Produto ${m.produtoId} não encontrado`);
    throw new EstoqueInsuficiente(m.produtoId, p.nome, Number(p.quantidadeEstoque));
  }

  const saldoNovo = linhas[0].quantidade_estoque;
  return tx.movimentoEstoque.create({
    data: {
      produtoId: m.produtoId,
      tipo: m.tipo,
      quantidade: qtd,
      saldoAnterior: new Prisma.Decimal(saldoNovo).minus(qtd),
      saldoNovo,
      referenciaTipo: m.referenciaTipo ?? null,
      referenciaId: m.referenciaId ?? null,
      referencia: m.referencia ?? null,
      lote: m.lote ?? null,
      dataValidade: m.dataValidade ?? null,
      motivo: m.motivo ?? null,
      usuarioId: m.usuarioId,
    },
  });
}
