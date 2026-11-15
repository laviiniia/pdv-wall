-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('entrada', 'venda', 'estorno_venda', 'devolucao', 'dano', 'perda', 'ajuste', 'inventario', 'desfazimento');

-- CreateEnum
CREATE TYPE "StatusInventario" AS ENUM ('em_andamento', 'finalizado', 'cancelado');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "controlar_estoque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quantidade_estoque" DECIMAL(12,3) NOT NULL DEFAULT 0,
ADD COLUMN     "ultimo_movimento_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "movimento_estoque" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "saldo_anterior" DECIMAL(12,3) NOT NULL,
    "saldo_novo" DECIMAL(12,3) NOT NULL,
    "referencia_tipo" VARCHAR(20),
    "referencia_id" INTEGER,
    "referencia" VARCHAR(40),
    "lote" VARCHAR(50),
    "data_validade" DATE,
    "motivo" VARCHAR(300),
    "usuario_id" INTEGER NOT NULL,
    "desfeito_por" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimento_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(18),
    "telefone" VARCHAR(20),
    "email" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrada_estoque" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "fornecedor_id" INTEGER NOT NULL,
    "numero_nf" VARCHAR(50),
    "data_compra" DATE NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "observacoes" VARCHAR(500),
    "criado_por" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrada_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrada_estoque_itens" (
    "id" SERIAL NOT NULL,
    "entrada_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "lote" VARCHAR(50),
    "data_validade" DATE,

    CONSTRAINT "entrada_estoque_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventarios" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "categoria_id" INTEGER,
    "status" "StatusInventario" NOT NULL DEFAULT 'em_andamento',
    "total_produtos" INTEGER NOT NULL DEFAULT 0,
    "divergencias" INTEGER NOT NULL DEFAULT 0,
    "observacoes" VARCHAR(500),
    "realizado_por" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),

    CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_items" (
    "id" SERIAL NOT NULL,
    "inventario_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade_sistema" DECIMAL(12,3) NOT NULL,
    "quantidade_real" DECIMAL(12,3),
    "diferenca" DECIMAL(12,3),

    CONSTRAINT "inventario_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movimento_estoque_desfeito_por_key" ON "movimento_estoque"("desfeito_por");

-- CreateIndex
CREATE INDEX "movimento_estoque_produto_id_data_criacao_idx" ON "movimento_estoque"("produto_id", "data_criacao");

-- CreateIndex
CREATE INDEX "movimento_estoque_tipo_idx" ON "movimento_estoque"("tipo");

-- CreateIndex
CREATE INDEX "movimento_estoque_data_criacao_idx" ON "movimento_estoque"("data_criacao");

-- CreateIndex
CREATE INDEX "movimento_estoque_referencia_tipo_referencia_id_idx" ON "movimento_estoque"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_nome_key" ON "fornecedores"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "entrada_estoque_numero_key" ON "entrada_estoque"("numero");

-- CreateIndex
CREATE INDEX "entrada_estoque_data_compra_idx" ON "entrada_estoque"("data_compra");

-- CreateIndex
CREATE INDEX "entrada_estoque_itens_entrada_id_idx" ON "entrada_estoque_itens"("entrada_id");

-- CreateIndex
CREATE INDEX "entrada_estoque_itens_produto_id_idx" ON "entrada_estoque_itens"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventarios_numero_key" ON "inventarios"("numero");

-- CreateIndex
CREATE INDEX "inventarios_status_idx" ON "inventarios"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_items_inventario_id_produto_id_key" ON "inventario_items"("inventario_id", "produto_id");

-- AddForeignKey
ALTER TABLE "movimento_estoque" ADD CONSTRAINT "movimento_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_estoque" ADD CONSTRAINT "movimento_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_estoque" ADD CONSTRAINT "movimento_estoque_desfeito_por_fkey" FOREIGN KEY ("desfeito_por") REFERENCES "movimento_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrada_estoque" ADD CONSTRAINT "entrada_estoque_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrada_estoque" ADD CONSTRAINT "entrada_estoque_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrada_estoque_itens" ADD CONSTRAINT "entrada_estoque_itens_entrada_id_fkey" FOREIGN KEY ("entrada_id") REFERENCES "entrada_estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrada_estoque_itens" ADD CONSTRAINT "entrada_estoque_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_realizado_por_fkey" FOREIGN KEY ("realizado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Regras de integridade do estoque (MODULO_2_4).
ALTER TABLE "movimento_estoque" ADD CONSTRAINT "movimento_saldo_consistente"
  CHECK ("quantidade" <> 0 AND "saldo_novo" = "saldo_anterior" + "quantidade");
ALTER TABLE "entrada_estoque" ADD CONSTRAINT "entrada_valor_valido" CHECK ("valor_total" >= 0);
ALTER TABLE "entrada_estoque_itens" ADD CONSTRAINT "entrada_itens_validos"
  CHECK ("quantidade" > 0 AND "preco_unitario" >= 0 AND "subtotal" >= 0);
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_contagem_valida"
  CHECK ("quantidade_real" IS NULL OR "quantidade_real" >= 0);
-- No máximo um inventário em andamento por vez.
CREATE UNIQUE INDEX "inventario_um_em_andamento" ON "inventarios" ("status") WHERE "status" = 'em_andamento';
