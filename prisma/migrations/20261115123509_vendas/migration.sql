-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('finalizada', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoDesconto" AS ENUM ('percentual', 'valor', 'cupom');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('dinheiro', 'debito', 'credito', 'pix', 'voucher');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "codigo_barras" VARCHAR(14);

-- CreateTable
CREATE TABLE "vendas" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "operador_id" INTEGER NOT NULL,
    "caixa" VARCHAR(10),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "desconto_tipo" "TipoDesconto",
    "desconto_percentual" DECIMAL(5,2),
    "desconto_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cupom_id" INTEGER,
    "total" DECIMAL(10,2) NOT NULL,
    "troco" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "StatusVenda" NOT NULL DEFAULT 'finalizada',
    "cancelado_em" TIMESTAMP(3),
    "cancelado_por" INTEGER,
    "motivo_cancelamento" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "nome_produto" VARCHAR(100) NOT NULL,
    "sku" VARCHAR(20) NOT NULL,
    "unidade_medida" "UnidadeMedida" NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "preco_custo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "forma_pagamento" "FormaPagamento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "valor_recebido" DECIMAL(10,2),
    "troco" DECIMAL(10,2),
    "numero_transacao" VARCHAR(100),
    "data_processamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupons_promocionais" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoDesconto" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "valor_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "usos_maximos" INTEGER,
    "usos_atuais" INTEGER NOT NULL DEFAULT 0,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_expiracao" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupons_promocionais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendas_numero_key" ON "vendas"("numero");

-- CreateIndex
CREATE INDEX "vendas_data_hora_idx" ON "vendas"("data_hora");

-- CreateIndex
CREATE INDEX "vendas_operador_id_idx" ON "vendas"("operador_id");

-- CreateIndex
CREATE INDEX "vendas_status_idx" ON "vendas"("status");

-- CreateIndex
CREATE INDEX "itens_venda_venda_id_idx" ON "itens_venda"("venda_id");

-- CreateIndex
CREATE INDEX "itens_venda_produto_id_idx" ON "itens_venda"("produto_id");

-- CreateIndex
CREATE INDEX "pagamentos_venda_id_idx" ON "pagamentos"("venda_id");

-- CreateIndex
CREATE UNIQUE INDEX "cupons_promocionais_codigo_key" ON "cupons_promocionais"("codigo");

-- CreateIndex
CREATE INDEX "cupons_promocionais_data_expiracao_idx" ON "cupons_promocionais"("data_expiracao");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_barras_key" ON "produtos"("codigo_barras");

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_cancelado_por_fkey" FOREIGN KEY ("cancelado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_cupom_id_fkey" FOREIGN KEY ("cupom_id") REFERENCES "cupons_promocionais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupons_promocionais" ADD CONSTRAINT "cupons_promocionais_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Regras de integridade das vendas (MODULO_2_2).
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_valores_validos"
  CHECK ("subtotal" >= 0 AND "desconto_valor" >= 0 AND "desconto_valor" <= "subtotal" AND "total" = "subtotal" - "desconto_valor" AND "troco" >= 0);
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_valores_validos"
  CHECK ("quantidade" > 0 AND "preco_unitario" >= 0 AND "subtotal" >= 0);
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_valores_validos"
  CHECK ("valor" > 0 AND "parcelas" BETWEEN 1 AND 24);
ALTER TABLE "cupons_promocionais" ADD CONSTRAINT "cupons_valores_validos"
  CHECK ("valor" > 0 AND ("tipo" <> 'percentual' OR "valor" <= 100) AND "valor_minimo" >= 0 AND "data_expiracao" > "data_inicio" AND "tipo" <> 'cupom');
