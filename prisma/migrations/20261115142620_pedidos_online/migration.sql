-- CreateEnum
CREATE TYPE "TipoAdicional" AS ENUM ('adicao', 'remocao');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('confirmado', 'preparando', 'pausado', 'pronto', 'entregue', 'cancelado');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "exibir_no_cardapio" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tempo_preparo_min" INTEGER;

-- CreateTable
CREATE TABLE "mesas" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "token" VARCHAR(40) NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 4,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adicionais_produto" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "tipo" "TipoAdicional" NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "adicionais_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_online" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "token" VARCHAR(40) NOT NULL,
    "mesa_id" INTEGER NOT NULL,
    "cliente_nome" VARCHAR(100),
    "cliente_telefone" VARCHAR(20),
    "alergias" VARCHAR(200),
    "observacoes" VARCHAR(300),
    "status" "StatusPedido" NOT NULL DEFAULT 'confirmado',
    "total" DECIMAL(10,2) NOT NULL,
    "tempo_preparo_min" INTEGER NOT NULL,
    "tempo_estimado_min" INTEGER NOT NULL,
    "motivo_cancelamento" TEXT,
    "avaliacao_nota" INTEGER,
    "avaliacao_texto" VARCHAR(500),
    "ip_origem" VARCHAR(45),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_inicio_preparo" TIMESTAMP(3),
    "data_pronto" TIMESTAMP(3),
    "data_entrega" TIMESTAMP(3),
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_online" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "nome_produto" VARCHAR(100) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "personalizacoes" JSONB NOT NULL DEFAULT '[]',
    "observacao" VARCHAR(100),
    "tempo_preparo_min" INTEGER NOT NULL,

    CONSTRAINT "itens_pedido_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_status_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "status" "StatusPedido" NOT NULL,
    "usuario_id" INTEGER,
    "detalhe" VARCHAR(300),
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_key" ON "mesas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_token_key" ON "mesas"("token");

-- CreateIndex
CREATE INDEX "adicionais_produto_produto_id_idx" ON "adicionais_produto"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_online_numero_key" ON "pedidos_online"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_online_token_key" ON "pedidos_online"("token");

-- CreateIndex
CREATE INDEX "pedidos_online_status_idx" ON "pedidos_online"("status");

-- CreateIndex
CREATE INDEX "pedidos_online_mesa_id_data_criacao_idx" ON "pedidos_online"("mesa_id", "data_criacao");

-- CreateIndex
CREATE INDEX "pedidos_online_data_criacao_idx" ON "pedidos_online"("data_criacao");

-- CreateIndex
CREATE INDEX "itens_pedido_online_pedido_id_idx" ON "itens_pedido_online"("pedido_id");

-- CreateIndex
CREATE INDEX "historico_status_pedido_pedido_id_idx" ON "historico_status_pedido"("pedido_id");

-- AddForeignKey
ALTER TABLE "adicionais_produto" ADD CONSTRAINT "adicionais_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_online" ADD CONSTRAINT "pedidos_online_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_online" ADD CONSTRAINT "itens_pedido_online_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_online"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_online" ADD CONSTRAINT "itens_pedido_online_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status_pedido" ADD CONSTRAINT "historico_status_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_online"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status_pedido" ADD CONSTRAINT "historico_status_pedido_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Regras de integridade dos pedidos online (MODULO_2_3).
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_valores_validos" CHECK ("numero" > 0 AND "capacidade" > 0);
ALTER TABLE "adicionais_produto" ADD CONSTRAINT "adicionais_valor_valido"
  CHECK ("valor" >= 0 AND ("tipo" = 'adicao' OR "valor" = 0));
ALTER TABLE "pedidos_online" ADD CONSTRAINT "pedidos_valores_validos"
  CHECK ("total" >= 0 AND "tempo_estimado_min" >= 0 AND ("avaliacao_nota" IS NULL OR "avaliacao_nota" BETWEEN 1 AND 5));
ALTER TABLE "itens_pedido_online" ADD CONSTRAINT "itens_pedido_valores_validos"
  CHECK ("quantidade" > 0 AND "preco_unitario" >= 0);
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_tempo_preparo_valido"
  CHECK ("tempo_preparo_min" IS NULL OR "tempo_preparo_min" BETWEEN 0 AND 240);
