-- CreateEnum
CREATE TYPE "StatusSessaoCaixa" AS ENUM ('aberto', 'fechado');

-- CreateEnum
CREATE TYPE "TipoMovimentoCaixa" AS ENUM ('suprimento', 'sangria');

-- CreateEnum
CREATE TYPE "TipoDespesa" AS ENUM ('fixa', 'variavel');

-- CreateEnum
CREATE TYPE "FormaPagamentoDespesa" AS ENUM ('dinheiro', 'debito', 'credito', 'pix', 'boleto', 'transferencia');

-- CreateEnum
CREATE TYPE "StatusContaPagar" AS ENUM ('pendente', 'parcial', 'paga', 'cancelada');

-- AlterTable
ALTER TABLE "vendas" ADD COLUMN     "sessao_caixa_id" INTEGER;

-- CreateTable
CREATE TABLE "sessoes_caixa" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "caixa" VARCHAR(10) NOT NULL,
    "operador_id" INTEGER NOT NULL,
    "status" "StatusSessaoCaixa" NOT NULL DEFAULT 'aberto',
    "saldo_inicial" DECIMAL(12,2) NOT NULL,
    "data_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao_abertura" VARCHAR(300),
    "data_fechamento" TIMESTAMP(3),
    "fechado_por" INTEGER,
    "saldo_esperado" DECIMAL(12,2),
    "saldo_real" DECIMAL(12,2),
    "diferenca" DECIMAL(12,2),
    "motivo_diferenca" VARCHAR(100),
    "observacao_fechamento" VARCHAR(300),

    CONSTRAINT "sessoes_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_caixa" (
    "id" SERIAL NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "tipo" "TipoMovimentoCaixa" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "motivo" VARCHAR(300) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "categoria" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(300) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data_despesa" DATE NOT NULL,
    "tipo" "TipoDespesa" NOT NULL DEFAULT 'variavel',
    "recorrente" VARCHAR(10),
    "fornecedor_id" INTEGER,
    "numero_nf" VARCHAR(50),
    "paga_na_hora" BOOLEAN NOT NULL DEFAULT true,
    "forma_pagamento" "FormaPagamentoDespesa",
    "sessao_caixa_id" INTEGER,
    "observacoes" VARCHAR(500),
    "criado_por" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_pagar" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "despesa_id" INTEGER,
    "fornecedor_id" INTEGER,
    "descricao" VARCHAR(300) NOT NULL,
    "categoria" VARCHAR(60) NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "valor_pago" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "data_vencimento" DATE NOT NULL,
    "status" "StatusContaPagar" NOT NULL DEFAULT 'pendente',
    "parcela_numero" INTEGER NOT NULL DEFAULT 1,
    "total_parcelas" INTEGER NOT NULL DEFAULT 1,
    "observacoes" VARCHAR(500),
    "criado_por" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contas_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_conta" (
    "id" SERIAL NOT NULL,
    "conta_id" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data_pagamento" DATE NOT NULL,
    "forma_pagamento" "FormaPagamentoDespesa" NOT NULL,
    "numero_transacao" VARCHAR(100),
    "observacoes" VARCHAR(300),
    "usuario_id" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_conta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_caixa_numero_key" ON "sessoes_caixa"("numero");

-- CreateIndex
CREATE INDEX "sessoes_caixa_status_idx" ON "sessoes_caixa"("status");

-- CreateIndex
CREATE INDEX "sessoes_caixa_data_abertura_idx" ON "sessoes_caixa"("data_abertura");

-- CreateIndex
CREATE INDEX "movimentos_caixa_sessao_id_idx" ON "movimentos_caixa"("sessao_id");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_numero_key" ON "despesas"("numero");

-- CreateIndex
CREATE INDEX "despesas_data_despesa_idx" ON "despesas"("data_despesa");

-- CreateIndex
CREATE INDEX "despesas_categoria_idx" ON "despesas"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "contas_pagar_numero_key" ON "contas_pagar"("numero");

-- CreateIndex
CREATE INDEX "contas_pagar_status_data_vencimento_idx" ON "contas_pagar"("status", "data_vencimento");

-- CreateIndex
CREATE INDEX "pagamentos_conta_conta_id_idx" ON "pagamentos_conta"("conta_id");

-- CreateIndex
CREATE INDEX "pagamentos_conta_data_pagamento_idx" ON "pagamentos_conta"("data_pagamento");

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_sessao_caixa_id_fkey" FOREIGN KEY ("sessao_caixa_id") REFERENCES "sessoes_caixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_caixa" ADD CONSTRAINT "sessoes_caixa_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_caixa" ADD CONSTRAINT "sessoes_caixa_fechado_por_fkey" FOREIGN KEY ("fechado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessoes_caixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_sessao_caixa_id_fkey" FOREIGN KEY ("sessao_caixa_id") REFERENCES "sessoes_caixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "despesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_conta" ADD CONSTRAINT "pagamentos_conta_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas_pagar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_conta" ADD CONSTRAINT "pagamentos_conta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Regras de integridade do financeiro (MODULO_2_5).
-- Um caixa físico só pode ter uma sessão aberta, e um operador só opera um caixa por vez.
CREATE UNIQUE INDEX "sessoes_caixa_um_aberto_por_caixa" ON "sessoes_caixa" ("caixa") WHERE "status" = 'aberto';
CREATE UNIQUE INDEX "sessoes_caixa_um_aberto_por_operador" ON "sessoes_caixa" ("operador_id") WHERE "status" = 'aberto';
ALTER TABLE "sessoes_caixa" ADD CONSTRAINT "sessoes_caixa_valores_validos"
  CHECK ("saldo_inicial" >= 0 AND ("saldo_real" IS NULL OR "saldo_real" >= 0));
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_valor_positivo" CHECK ("valor" > 0);
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_valor_positivo" CHECK ("valor" > 0);
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_valores_validos"
  CHECK ("valor_total" > 0 AND "valor_pago" >= 0 AND "valor_pago" <= "valor_total" AND "parcela_numero" BETWEEN 1 AND "total_parcelas");
ALTER TABLE "pagamentos_conta" ADD CONSTRAINT "pagamentos_conta_valor_positivo" CHECK ("valor" > 0);
