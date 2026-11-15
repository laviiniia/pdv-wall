-- CreateEnum
CREATE TYPE "StatusProduto" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('un', 'kg', 'g', 'L', 'ml');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "permissoes" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMP(3),
    "role_id" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "tentativas_login_falhas" INTEGER NOT NULL DEFAULT 0,
    "permissoes_custom" JSONB,
    "ultimo_login" TIMESTAMP(3),
    "criado_por" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "email_usuario" VARCHAR(255),
    "acao" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(50),
    "nivel" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "descricao" TEXT,
    "dados_modificados" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "sucesso" BOOLEAN NOT NULL DEFAULT true,
    "mensagem_erro" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_password_tokens" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_expiracao" TIMESTAMP(3) NOT NULL,
    "data_uso" TIMESTAMP(3),

    CONSTRAINT "reset_password_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "cor_hex" VARCHAR(7) NOT NULL DEFAULT '#808080',
    "icone" VARCHAR(100),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_edicao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "sku" VARCHAR(20) NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "imagem_path" VARCHAR(255),
    "status" "StatusProduto" NOT NULL DEFAULT 'ativo',
    "preco_custo" DECIMAL(10,2) NOT NULL,
    "preco_venda" DECIMAL(10,2) NOT NULL,
    "unidade_medida" "UnidadeMedida" NOT NULL,
    "quantidade_minima" INTEGER NOT NULL DEFAULT 0,
    "data_validade" DATE,
    "lote" VARCHAR(50),
    "criado_por" INTEGER NOT NULL,
    "editado_por" INTEGER,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_edicao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nome_key" ON "roles"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_role_id_idx" ON "usuarios"("role_id");

-- CreateIndex
CREATE INDEX "usuarios_ativo_idx" ON "usuarios"("ativo");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_acao_idx" ON "auditoria"("acao");

-- CreateIndex
CREATE INDEX "auditoria_modulo_idx" ON "auditoria"("modulo");

-- CreateIndex
CREATE INDEX "auditoria_data_hora_idx" ON "auditoria"("data_hora");

-- CreateIndex
CREATE INDEX "reset_password_tokens_usuario_id_idx" ON "reset_password_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "reset_password_tokens_data_expiracao_idx" ON "reset_password_tokens"("data_expiracao");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");

-- CreateIndex
CREATE INDEX "produtos_status_idx" ON "produtos"("status");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reset_password_tokens" ADD CONSTRAINT "reset_password_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_editado_por_fkey" FOREIGN KEY ("editado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
