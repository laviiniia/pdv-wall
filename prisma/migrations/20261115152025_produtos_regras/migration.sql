-- AlterTable
ALTER TABLE "categorias" ADD COLUMN     "editado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_editado_por_fkey" FOREIGN KEY ("editado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regras de preço (MODULO_2_1, tabela produtos): garantidas também pelo banco,
-- não só pela validação da aplicação.
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_preco_custo_positivo" CHECK ("preco_custo" > 0);
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_preco_venda_maior" CHECK ("preco_venda" > "preco_custo");

-- Nome de produto único sem diferenciar maiúsculas/minúsculas.
CREATE UNIQUE INDEX "produtos_nome_lower_key" ON "produtos" (lower("nome"));
CREATE UNIQUE INDEX "categorias_nome_lower_key" ON "categorias" (lower("nome"));
