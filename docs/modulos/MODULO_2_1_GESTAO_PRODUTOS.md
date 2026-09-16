# MÓDULO 2.1: GESTÃO DE PRODUTOS

## 📋 Sumário Executivo

**Objetivo:** Permitir que o administrador/gerente cadastre, edite, delete e categorizasse todos os produtos da empresa alimentícia de forma centralizada e fácil.

**Funcionalidades Principais:**
- ✅ Cadastro de novos produtos
- ✅ Edição de produtos existentes
- ✅ Soft delete (desativar ao invés de deletar)
- ✅ Gestão de categorias
- ✅ Cálculo automático de margem de lucro
- ✅ Upload de imagens
- ✅ Filtros e busca avançada

**Perfis de Acesso:**
- Admin (acesso total)
- Gerente (criar, editar, ativar/desativar)
- Operador (apenas visualizar)

---

## 1. FUNCIONALIDADE 1.1: CADASTRO DE PRODUTOS

### 1.1.1 Descrição Geral

Permite adicionar novos produtos ao sistema com todas as informações necessárias para vendas, cálculos de lucro e rastreamento de estoque.

### 1.1.2 Campos do Formulário

#### **Seção Básica**

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|------------|-----------|-----------|
| Nome do Produto | Text | ✅ Sim | Único, 3-100 caracteres | Nome que aparece na venda e menu |
| Descrição | Textarea | ❌ Não | Máx 500 caracteres | Detalhes do produto (ex: "Hamburger de 200g, carne vermelha") |
| SKU/Código | Text | ✅ Sim | Único, 3-20 caracteres | Código interno do produto (ex: HAM-001) |
| Categoria | Select | ✅ Sim | Deve existir no BD | Categoria pré-definida (Alimentos, Bebidas, etc) |
| Imagem | File Upload | ❌ Não | JPG/PNG, máx 2MB | Foto do produto para menu digital |
| Status | Toggle | ✅ Sim | Ativo/Inativo | Determina se produto aparece nas vendas |

#### **Seção de Preços**

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|------------|-----------|-----------|
| Preço de Custo | Currency | ✅ Sim | > 0, 2 decimais | Quanto a empresa pagou pelo produto |
| Preço de Venda | Currency | ✅ Sim | > Preço Custo, 2 decimais | Preço cobrado do cliente |
| Margem de Lucro | Currency | ❌ Não (Auto) | Somente leitura | **Calculado:** Preço Venda - Preço Custo |
| Percentual Lucro | Percent | ❌ Não (Auto) | Somente leitura | **Calculado:** (Lucro / Preço Custo) × 100 |

#### **Seção de Estoque e Medidas**

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|------------|-----------|-----------|
| Unidade de Medida | Select | ✅ Sim | Un, kg, L, g, ml, etc | Como é medido o produto |
| Quantidade Mínima | Number | ✅ Sim | ≥ 0 | Ao atingir, gera alerta de estoque |
| Status Estoque | Text | ❌ Não (Auto) | Somente leitura | "Em Estoque", "Baixo" ou "Sem Estoque" |

#### **Seção de Validade (Alimentos)**

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|------------|-----------|-----------|
| Validade | Date | ❌ Não | > Data atual | Data de vencimento do produto |
| Lote | Text | ❌ Não | Máx 50 caracteres | Número do lote do fabricante |

#### **Seção de Informações do Cadastro**

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|------------|-----------|---------|
| Data de Cadastro | DateTime | ❌ Não (Auto) | Somente leitura | Preenchido automaticamente |
| Criado por | Select | ❌ Não (Auto) | Somente leitura | Usuário que cadastrou |
| Data Última Edição | DateTime | ❌ Não (Auto) | Somente leitura | Preenchido automaticamente |
| Editado por | Select | ❌ Não (Auto) | Somente leitura | Usuário que editou |

### 1.1.3 Fluxo de Cadastro de Produto

```
┌─────────────────────────────────────────┐
│ Admin/Gerente Clica em "Novo Produto"  │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Sistema Abre Formulário em Abas         │
│ • Informações Básicas                   │
│ • Preços                                │
│ • Estoque e Medidas                     │
│ • Validade (opcional)                   │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Usuário Preenche Aba 1: Básico          │
│ - Nome, Descrição, SKU, Categoria      │
│ - Upload de Imagem                      │
│ - Status Ativo/Inativo                  │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Usuário Preenche Aba 2: Preços          │
│ - Preço Custo                           │
│ - Preço Venda                           │
│ → Sistema calcula Margem Automaticamente│
│ → Sistema calcula % Lucro               │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Usuário Preenche Aba 3: Estoque         │
│ - Unidade de Medida                     │
│ - Quantidade Mínima para Alerta         │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Usuário Preenche Aba 4: Validade        │
│ - Data de Vencimento (opcional)         │
│ - Lote (opcional)                       │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Usuário Clica "Salvar Produto"          │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│ Sistema Valida Todos os Campos          │
│ • Nome não existe?                      │
│ • SKU não existe?                       │
│ • Preço Venda > Preço Custo?            │
│ • Categoria existe no BD?               │
│ • Imagem é válida?                      │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ✅ Válido        ❌ Inválido
        │                 │
        ▼                 ▼
    ┌───────┐      ┌──────────────┐
    │ Salva │      │ Mostra Erro  │
    │no BD  │      │ Especifico   │
    │INSERT │      │ Usuário      │
    │PRODUTO│      │ Corrige      │
    └───────┘      └──────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Sistema Retorna Sucesso                  │
│ • Mostra Toast: "Produto criado!"        │
│ • ID atribuído: PROD-12345               │
│ • Redireciona para Lista de Produtos     │
│ • Novo produto aparece na listagem       │
│ • Pronto para estoque e vendas           │
└──────────────────────────────────────────┘
```

### 1.1.4 Validações e Regras

**Validação de Nome:**
- Mínimo 3 caracteres
- Máximo 100 caracteres
- Não pode ser duplicado (case-insensitive)
- Não pode conter caracteres especiais (apenas letras, números, espaços, hífen)

**Validação de SKU:**
- Mínimo 3 caracteres
- Máximo 20 caracteres
- Deve ser único no sistema
- Formato: `[TIPO]-[NÚMERO]` (ex: HAM-001, BEB-045)

**Validação de Preços:**
```
Se Preço Custo = R$ 10,00
Se Preço Venda = R$ 5,00
→ Erro: "Preço de venda deve ser maior que preço de custo"

Se Preço Custo = R$ 10,00
Se Preço Venda = R$ 15,00
→ Margem = R$ 5,00
→ % Lucro = 50%
✅ Válido
```

**Validação de Imagem:**
- Formatos aceitos: JPG, JPEG, PNG
- Tamanho máximo: 2MB
- Dimensões recomendadas: 400x400px (será redimensionada automaticamente)

**Validação de Data de Validade:**
- Deve ser maior que data atual
- Se preenchida, deve ser futura
- Aviso visual: produto com vencimento em 7 dias

**Validação de Categoria:**
- Deve ser selecionada de lista pré-existente
- Não permite criar categoria no formulário de produto (apenas no módulo de categorias)

### 1.1.5 Cálculos Automáticos

**Margem de Lucro (Valor):**
```
Margem = Preço Venda - Preço Custo

Exemplo:
Preço Custo: R$ 20,00
Preço Venda: R$ 35,00
Margem: R$ 15,00
```

**Percentual de Lucro:**
```
% Lucro = (Margem / Preço Custo) × 100

Exemplo:
Margem: R$ 15,00
Preço Custo: R$ 20,00
% Lucro = (15 / 20) × 100 = 75%
```

**Status de Estoque (Automático):**
```
Se Quantidade Atual > Quantidade Mínima
  → Status = "Em Estoque" (verde)

Se Quantidade Atual = Quantidade Mínima OU Quantidade Atual <= Quantidade Mínima + 10%
  → Status = "Baixo" (amarelo)

Se Quantidade Atual = 0
  → Status = "Sem Estoque" (vermelho)
```

### 1.1.6 Armazenamento de Imagem

**Fluxo:**
1. Usuário seleciona arquivo (JPG/PNG)
2. Frontend valida (tipo, tamanho)
3. Redimensiona para 400x400px (se necessário)
4. Comprime para qualidade web
5. Envia para servidor
6. Servidor salva em `/uploads/produtos/{PRODUTO_ID}.jpg`
7. Banco de dados armazena caminho relativo: `produtos/12345.jpg`

**Fallback:**
- Se não houver imagem, mostra ícone genérico (📦)
- Menu digital mantém espaço reservado

---

## 2. FUNCIONALIDADE 2.1: EDITAR/DELETAR PRODUTOS

### 2.1.1 Editar Produto

**Fluxo:**
```
Usuário Clica em Produto Existente
  ↓
Sistema Carrega Formulário PRÉ-PREENCHIDO
  ↓
Usuário Modifica Campos Desejados
  ↓
Sistema Valida Novamente
  ↓
Usuário Clica "Salvar Alterações"
  ↓
Sistema Executa UPDATE no BD
  ↓
Registra Quem Editou e Quando
  ↓
Mostra Sucesso e Retorna à Lista
```

**Campos Editáveis:**
- ✅ Nome (validação de unicidade excluindo o próprio produto)
- ✅ Descrição
- ✅ SKU (validação de unicidade excluindo o próprio produto)
- ✅ Categoria
- ✅ Preço de Custo
- ✅ Preço de Venda (margem recalculada automaticamente)
- ✅ Unidade de Medida
- ✅ Quantidade Mínima
- ✅ Imagem (pode substituir)
- ✅ Validade
- ✅ Lote
- ✅ Status (Ativo/Inativo)

**Campos Não Editáveis (Somente Leitura):**
- ❌ Data de Cadastro
- ❌ Criado por
- ❌ Data Última Edição (será atualizada)
- ❌ Editado por (será atualizado)
- ❌ Margem de Lucro (auto-calculado)
- ❌ % Lucro (auto-calculado)

**Registro de Auditoria:**
```json
{
  "produto_id": 12345,
  "campo_editado": "preco_venda",
  "valor_anterior": 35.00,
  "valor_novo": 40.00,
  "data_edicao": "2026-08-23 14:35:20",
  "usuario_id": 7,
  "usuario_nome": "João Silva"
}
```

### 2.1.2 Soft Delete (Desativar Produto)

**Por que Soft Delete?**
- Preserva histórico de vendas
- Mantém integridade referencial
- Permite rastreabilidade completa
- Pode reativar se necessário

**Fluxo:**
```
Usuário Clica em "Deletar" ou "Desativar"
  ↓
Sistema Mostra Confirmação
  "Este produto será desativado.
   Vendas anteriores serão mantidas no histórico.
   Deseja continuar?"
  ↓
Usuário Confirma
  ↓
Sistema Executa UPDATE
  SET status = 'inativo'
  WHERE produto_id = 12345
  ↓
Sistema NÃO mostra mais em:
  • PDV (busca de vendas)
  • Menu digital
  • Listas padrão
  ↓
Sistema AINDA mostra em:
  • Histórico de vendas
  • Relatórios
  • Filtro "Mostrar inativos"
  ↓
Mostra Sucesso
  "Produto desativado com sucesso"
```

**Reativar Produto:**
```
Admin vê lista de "Produtos Inativos"
  ↓
Clica "Reativar" no produto desejado
  ↓
Sistema Executa UPDATE
  SET status = 'ativo'
  WHERE produto_id = 12345
  ↓
Produto volta à listagem normal
  ↓
Pronto para vendas novamente
```

**Deletar de Verdade (Apenas Admin):**
```
APENAS em desenvolvimento/testes, NUNCA em produção

Se houver pedido para deletar de verdade:
1. Verifica se produto tem vendas
2. Se SIM → Bloqueia com mensagem: 
   "Não é possível deletar. Produto tem histórico de vendas."
3. Se NÃO → Executa DELETE (com confirmação dupla)
```

### 2.1.3 Visualizar Histórico de Edições

**Funcionalidade:**
- Clique em "Ver Histórico" no detalhe do produto
- Mostra lista de todas as alterações
- Data, quem editou, o quê foi alterado, valor anterior e novo

**Tabela de Auditoria:**

| ID | Produto ID | Campo | Valor Anterior | Valor Novo | Usuário | Data |
|----|----|----|----|----|----|-----|
| 1 | 12345 | preco_venda | R$ 35,00 | R$ 40,00 | João Silva | 23/08 14:35 |
| 2 | 12345 | status | ativo | inativo | Maria | 22/08 09:15 |
| 3 | 12345 | quantidade_minima | 10 | 20 | João Silva | 20/08 11:20 |

---

## 3. FUNCIONALIDADE 3.1: GESTÃO DE CATEGORIAS

### 3.1.1 O que são Categorias?

Agrupamentos lógicos de produtos para melhor organização, busca e análise.

**Exemplos:**
```
Alimentos
├── Lanches
│   ├── Hamburgers
│   ├── Sandwiches
│   └── Cachorro Quente
├── Pratos Principais
│   ├── Pizzas
│   ├── Massas
│   └── Saladas
└── Sobremesas

Bebidas
├── Refrigerantes
├── Sucos
├── Café
└── Bebidas Alcoólicas

Acessórios
├── Embalagens
├── Talheres
└── Guardanapos
```

### 3.1.2 CRUD de Categorias

#### **Criar Categoria**

**Fluxo:**
```
Admin/Gerente Clica "Nova Categoria"
  ↓
Abre Modal/Página com Formulário:
  - Nome da Categoria (obrigatório, único)
  - Descrição (opcional)
  - Cor/Ícone (visual, para menu)
  - Ativa/Inativa (padrão: ativa)
  ↓
Valida:
  - Nome: 3-50 caracteres, único
  - Sem caracteres especiais
  ↓
Salva no BD
  ↓
Mostra Sucesso
  "Categoria 'Bebidas' criada com sucesso"
  ↓
Aparece imediatamente ao criar produtos
```

**Campos:**

| Campo | Tipo | Obrigatório | Validação |
|-------|------|------------|-----------|
| Nome | Text | ✅ Sim | Único, 3-50 caracteres |
| Descrição | Textarea | ❌ Não | Máx 200 caracteres |
| Cor (Hex) | Color Picker | ❌ Não | Padrão: Cinza (#808080) |
| Ícone | Select | ❌ Não | Emoji ou ícone SVG |
| Ativa | Toggle | ✅ Sim | Padrão: Sim |

#### **Editar Categoria**

```
Gerente Seleciona Categoria
  ↓
Clica "Editar"
  ↓
Abre Formulário Pré-preenchido
  ↓
Modifica Campos
  ↓
Salva
  ↓
Atualiza em Tempo Real
```

**Restrições:**
- Não pode renomear para nome já existente
- Se desativar categoria, produtos associados NÃO são deletados (apenas não aparecem em filtros)
- Histórico de edições registrado

#### **Deletar Categoria**

```
Clique em "Deletar Categoria"
  ↓
Sistema Verifica:
  ┌─────────────────────────────┐
  │ Existem produtos com esta   │
  │ categoria?                  │
  └─────────────────────────────┘
  
  SIM → Bloqueia
  "Não é possível deletar.
   Existem 15 produtos nesta categoria.
   Desative a categoria ou mude os produtos de categoria."
  
  NÃO → Permite deletar (com confirmação)
```

### 3.1.3 Listagem de Categorias

**Funcionalidades:**
- Tabela com todas as categorias
- Colunas: Nome | Descrição | Produtos | Ativa? | Ações
- Botões: Editar | Deletar | Ver Produtos
- Ordenação: por nome, por quantidade de produtos
- Filtro: Mostrar todas / Mostrar apenas ativas

**Tabela Exemplo:**

| Nome | Descrição | Produtos | Status | Ações |
|------|-----------|----------|--------|-------|
| 🍔 Lanches | Hambúrgueres, Sanduíches | 12 | ✅ Ativa | [Editar] [Deletar] |
| 🍕 Pizzas | Pizzas variadas | 8 | ✅ Ativa | [Editar] [Deletar] |
| 🥤 Bebidas | Refrigerantes e Sucos | 15 | ✅ Ativa | [Editar] [Deletar] |
| 🎂 Sobremesas | Bolos e Doces | 6 | ✅ Ativa | [Editar] [Deletar] |
| 📦 Acessórios | Embalagens e Talheres | 20 | ❌ Inativa | [Editar] [Deletar] |

---

## 4. BANCO DE DADOS

### 4.1 Tabela CATEGORIAS

```sql
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  cor_hex VARCHAR(7) DEFAULT '#808080',  -- Cor em hex
  icone VARCHAR(100),                     -- Emoji ou URL do ícone
  ativa BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por INT NOT NULL,
  data_edicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  editado_por INT,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  FOREIGN KEY (editado_por) REFERENCES usuarios(id)
);
```

### 4.2 Tabela PRODUTOS

```sql
CREATE TABLE produtos (
  id SERIAL PRIMARY KEY,
  
  -- Informações Básicas
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  sku VARCHAR(20) NOT NULL UNIQUE,
  categoria_id INT NOT NULL,
  imagem_path VARCHAR(255),  -- Caminho relativo: produtos/12345.jpg
  status VARCHAR(20) DEFAULT 'ativo',  -- 'ativo' ou 'inativo'
  
  -- Preços
  preco_custo DECIMAL(10,2) NOT NULL,
  preco_venda DECIMAL(10,2) NOT NULL,
  -- margem_lucro e percentual_lucro são CALCULADOS, não armazenados
  
  -- Estoque
  unidade_medida VARCHAR(10) NOT NULL,  -- 'un', 'kg', 'L', 'g', 'ml'
  quantidade_minima INT DEFAULT 0,
  
  -- Validade (Alimentos)
  data_validade DATE,
  lote VARCHAR(50),
  
  -- Auditoria
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por INT NOT NULL,
  data_edicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  editado_por INT,
  
  -- Relacionamentos
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  FOREIGN KEY (editado_por) REFERENCES usuarios(id),
  
  -- Índices
  INDEX idx_categoria(categoria_id),
  INDEX idx_sku(sku),
  INDEX idx_status(status),
  CONSTRAINT preco_venda_maior CHECK (preco_venda > preco_custo)
);
```

### 4.3 Tabela AUDITORIA_PRODUTOS (Log de Edições)

```sql
CREATE TABLE auditoria_produtos (
  id SERIAL PRIMARY KEY,
  produto_id INT NOT NULL,
  campo_editado VARCHAR(50) NOT NULL,
  valor_anterior VARCHAR(255),
  valor_novo VARCHAR(255),
  data_edicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_produto(produto_id),
  INDEX idx_data(data_edicao)
);
```

### 4.4 Tabela CATEGORIAS_AUDITORIA (Log de Edições)

```sql
CREATE TABLE auditoria_categorias (
  id SERIAL PRIMARY KEY,
  categoria_id INT NOT NULL,
  campo_editado VARCHAR(50) NOT NULL,
  valor_anterior VARCHAR(255),
  valor_novo VARCHAR(255),
  data_edicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_categoria(categoria_id),
  INDEX idx_data(data_edicao)
);
```

---

## 5. API REST - ENDPOINTS

### 5.1 Endpoints de Categorias

**Base URL:** `http://localhost:3000/api/categorias`

#### **GET /api/categorias**
Listar todas as categorias
```
Query Params:
  - ativas_apenas: boolean (padrão: false)
  - ordem: 'nome' | 'quantidade' (padrão: 'nome')

Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 1,
      "nome": "Lanches",
      "descricao": "Hambúrgueres, Sanduíches",
      "cor_hex": "#FF6B6B",
      "icone": "🍔",
      "ativa": true,
      "total_produtos": 12
    }
  ],
  "total": 5
}
```

#### **POST /api/categorias**
Criar nova categoria
```
Body:
{
  "nome": "Bebidas",
  "descricao": "Refrigerantes e Sucos",
  "cor_hex": "#4A90E2",
  "icone": "🥤",
  "ativa": true
}

Response:
{
  "sucesso": true,
  "mensagem": "Categoria criada com sucesso",
  "dados": {
    "id": 6,
    "nome": "Bebidas",
    ...
  }
}
```

#### **PUT /api/categorias/{id}**
Editar categoria
```
Body:
{
  "nome": "Bebidas Quentes",
  "descricao": "Café, Chá, Chocolate",
  "ativa": true
}

Response:
{
  "sucesso": true,
  "mensagem": "Categoria atualizada com sucesso",
  "dados": { ... }
}
```

#### **DELETE /api/categorias/{id}**
Deletar categoria
```
Response:
{
  "sucesso": true,
  "mensagem": "Categoria deletada com sucesso"
}

Erro (se tem produtos):
{
  "sucesso": false,
  "mensagem": "Não é possível deletar. Existem 12 produtos nesta categoria."
}
```

### 5.2 Endpoints de Produtos

**Base URL:** `http://localhost:3000/api/produtos`

#### **GET /api/produtos**
Listar todos os produtos
```
Query Params:
  - categoria_id: int (opcional)
  - status: 'ativo' | 'inativo' (padrão: 'ativo')
  - busca: string (busca por nome/SKU)
  - pagina: int (padrão: 1)
  - limite: int (padrão: 20)
  - ordenar: 'nome' | 'preco' | 'lucro' (padrão: 'nome')

Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 12345,
      "nome": "Hamburger Clássico",
      "sku": "HAM-001",
      "categoria": {
        "id": 1,
        "nome": "Lanches"
      },
      "preco_custo": 20.00,
      "preco_venda": 35.00,
      "margem_lucro": 15.00,
      "percentual_lucro": 75.0,
      "unidade_medida": "un",
      "quantidade_minima": 10,
      "imagem_url": "/uploads/produtos/12345.jpg",
      "status": "ativo",
      "data_cadastro": "2026-01-15T10:30:00Z"
    }
  ],
  "paginacao": {
    "pagina": 1,
    "limite": 20,
    "total": 145,
    "total_paginas": 8
  }
}
```

#### **GET /api/produtos/{id}**
Obter detalhes de um produto
```
Response:
{
  "sucesso": true,
  "dados": {
    "id": 12345,
    "nome": "Hamburger Clássico",
    "sku": "HAM-001",
    "descricao": "Hamburger de 200g com alface, tomate e queijo",
    "categoria": {
      "id": 1,
      "nome": "Lanches"
    },
    "preco_custo": 20.00,
    "preco_venda": 35.00,
    "margem_lucro": 15.00,
    "percentual_lucro": 75.0,
    "unidade_medida": "un",
    "quantidade_minima": 10,
    "status": "ativo",
    "imagem_url": "/uploads/produtos/12345.jpg",
    "data_validade": null,
    "lote": null,
    "data_cadastro": "2026-01-15T10:30:00Z",
    "criado_por": {
      "id": 1,
      "nome": "João Silva"
    },
    "data_edicao": "2026-08-20T14:50:00Z",
    "editado_por": {
      "id": 2,
      "nome": "Maria Santos"
    }
  }
}
```

#### **GET /api/produtos/{id}/auditoria**
Ver histórico de edições
```
Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 1,
      "campo": "preco_venda",
      "valor_anterior": "30.00",
      "valor_novo": "35.00",
      "data_edicao": "2026-08-20T14:50:00Z",
      "usuario": {
        "id": 2,
        "nome": "Maria Santos"
      }
    }
  ]
}
```

#### **POST /api/produtos**
Criar novo produto
```
Body:
{
  "nome": "Hamburger Clássico",
  "descricao": "Hamburger de 200g com alface, tomate e queijo",
  "sku": "HAM-001",
  "categoria_id": 1,
  "preco_custo": 20.00,
  "preco_venda": 35.00,
  "unidade_medida": "un",
  "quantidade_minima": 10,
  "status": "ativo",
  "data_validade": null,
  "lote": null
}

Upload de Imagem (multipart/form-data):
  Form Field: "imagem" (file)
  + campos acima como form fields

Response:
{
  "sucesso": true,
  "mensagem": "Produto criado com sucesso",
  "dados": {
    "id": 12345,
    "nome": "Hamburger Clássico",
    ...
  }
}
```

#### **PUT /api/produtos/{id}**
Editar produto
```
Body: (mesmo do POST, campos opcionais)
{
  "nome": "Hamburger Premium",
  "preco_venda": 45.00,
  "quantidade_minima": 15
}

Response:
{
  "sucesso": true,
  "mensagem": "Produto atualizado com sucesso",
  "dados": { ... }
}
```

#### **DELETE /api/produtos/{id}**
Deletar (desativar) produto
```
Query Params:
  - hard_delete: boolean (apenas admin, padrão: false)

Response:
{
  "sucesso": true,
  "mensagem": "Produto desativado com sucesso"
}
```

#### **PUT /api/produtos/{id}/reativar**
Reativar produto desativado
```
Response:
{
  "sucesso": true,
  "mensagem": "Produto reativado com sucesso"
}
```

#### **POST /api/produtos/{id}/imagem**
Atualizar apenas a imagem do produto
```
Body (multipart/form-data):
  - imagem: file (JPG/PNG)

Response:
{
  "sucesso": true,
  "mensagem": "Imagem atualizada com sucesso",
  "dados": {
    "id": 12345,
    "imagem_url": "/uploads/produtos/12345_v2.jpg"
  }
}
```

---

## 6. ESTRUTURA DE PASTAS (Frontend - React)

```
src/
├── modules/
│   ├── produtos/
│   │   ├── pages/
│   │   │   ├── ProdutosList.jsx          # Listagem de produtos
│   │   │   ├── ProdutoForm.jsx           # Formulário (criar/editar)
│   │   │   ├── ProdutoDetalhes.jsx       # Detalhes e histórico
│   │   │   └── ProdutoHistorico.jsx      # Auditoria
│   │   ├── components/
│   │   │   ├── ProdutoCard.jsx           # Card individual
│   │   │   ├── ProdutoFilter.jsx         # Filtros e busca
│   │   │   ├── FormBasico.jsx            # Aba de informações básicas
│   │   │   ├── FormPrecos.jsx            # Aba de preços
│   │   │   ├── FormEstoque.jsx           # Aba de estoque
│   │   │   ├── FormValidade.jsx          # Aba de validade
│   │   │   ├── TabelaAuditoria.jsx       # Tabela de histórico
│   │   │   └── UploadImagem.jsx          # Upload com preview
│   │   ├── hooks/
│   │   │   ├── useProdutos.js            # Hook para GET produtos
│   │   │   ├── useCategorias.js          # Hook para categorias
│   │   │   └── useProdutoForm.js         # Hook para validação
│   │   ├── services/
│   │   │   ├── produtosService.js        # Chamadas API
│   │   │   └── categoriasService.js      # Chamadas API
│   │   ├── utils/
│   │   │   ├── validacoes.js             # Validações de campos
│   │   │   └── calculos.js               # Cálculos (margem, %)
│   │   └── styles/
│   │       ├── produtos.css
│   │       └── form.css
│   │
│   ├── categorias/
│   │   ├── pages/
│   │   │   ├── CategoriasList.jsx
│   │   │   └── CategoriaForm.jsx
│   │   ├── components/
│   │   │   ├── CategoriaCard.jsx
│   │   │   ├── CategoriaModal.jsx
│   │   │   └── CategoriaColorPicker.jsx
│   │   ├── services/
│   │   │   └── categoriasService.js
│   │   └── styles/
│   │       └── categorias.css
│   └── ...outros módulos
│
├── components/
│   ├── common/
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── Loading.jsx
│   │   └── Confirmacao.jsx
│   └── ...
│
├── hooks/
│   ├── useApi.js
│   ├── useForm.js
│   └── useAuth.js
│
├── services/
│   └── api.js                # Configuração axios
│
└── assets/
    ├── icons/
    ├── images/
    └── uploads/              # Pasta temporária de uploads
```

---

## 7. ESTRUTURA DE PASTAS (Backend - Node.js)

```
backend/
├── src/
│   ├── modules/
│   │   ├── produtos/
│   │   │   ├── produtosController.js     # Lógica das rotas
│   │   │   ├── produtosService.js        # Lógica de negócio
│   │   │   ├── produtosRepository.js     # Acesso ao BD
│   │   │   ├── produtosRoutes.js         # Definição de rotas
│   │   │   ├── produtosValidacao.js      # Validações
│   │   │   └── produtosModel.js          # Relacionamentos Sequelize
│   │   │
│   │   ├── categorias/
│   │   │   ├── categoriasController.js
│   │   │   ├── categoriasService.js
│   │   │   ├── categoriasRepository.js
│   │   │   ├── categoriasRoutes.js
│   │   │   ├── categoriasValidacao.js
│   │   │   └── categoriasModel.js
│   │   │
│   │   ├── auditoria/
│   │   │   ├── auditoriaService.js       # Funções para registrar edições
│   │   │   └── auditoriaModel.js
│   │   │
│   │   └── auth/
│   │       └── ...
│   │
│   ├── middleware/
│   │   ├── autenticacao.js
│   │   ├── autorizacao.js
│   │   ├── validacaoDados.js
│   │   ├── tratamentoErros.js
│   │   └── uploadImagem.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── calculosMargem.js
│   │   └── formatacao.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── upload.js
│   │   └── env.js
│   │
│   ├── migrations/
│   │   ├── 001_create_categorias.js
│   │   ├── 002_create_produtos.js
│   │   ├── 003_create_auditoria_produtos.js
│   │   └── 004_create_auditoria_categorias.js
│   │
│   └── app.js                             # Inicialização Express
│
├── uploads/
│   └── produtos/                          # Armazena imagens de produtos
│
├── tests/
│   ├── produtos.test.js
│   └── categorias.test.js
│
└── .env                                   # Variáveis de ambiente
```

---

## 8. CASOS DE USO DETALHADOS

### Caso de Uso 1: Criar Novo Produto

**Ator:** Gerente de Operações
**Pré-condição:** Usuário autenticado e com permissão de criar produtos

**Fluxo Básico:**
1. Clica em "Novo Produto"
2. Preenche Aba 1 (Básico): Nome, Descrição, SKU, Categoria, Imagem
3. Preenche Aba 2 (Preços): Preço Custo = R$ 20, Preço Venda = R$ 35
4. Sistema calcula Margem = R$ 15 e % Lucro = 75%
5. Preenche Aba 3 (Estoque): Unidade = "un", Quantidade Mínima = 10
6. Preenche Aba 4 (Validade): Data Validade = 30/12/2026, Lote = LT-001
7. Clica "Salvar Produto"
8. Sistema valida tudo
9. Insere no BD com ID atribuído
10. Retorna sucesso: "Produto criado com sucesso - ID: PROD-12345"
11. Redireciona para lista de produtos (novo produto aparece no topo)
12. Produto agora está pronto para:
    - Vendas via PDV
    - Menu Digital (Pedidos Online)
    - Controle de Estoque

**Fluxo Alternativo - Erro em Validação:**
- Se Nome duplicado: "Nome já existe. Escolha outro."
- Se SKU duplicado: "SKU já existe. Escolha outro."
- Se Preço Venda ≤ Preço Custo: "Preço de venda deve ser maior que custo."
- Se Arquivo imagem > 2MB: "Imagem muito grande. Máximo 2MB."
- Usuário corrige e tenta novamente.

---

### Caso de Uso 2: Editar Preço de um Produto

**Ator:** Gerente

**Fluxo:**
1. Na listagem, clica em "Hamburger Clássico"
2. Abre detalhes do produto
3. Clica "Editar"
4. Vai direto à Aba de Preços
5. Muda Preço Venda de R$ 35,00 para R$ 40,00
6. Sistema recalcula: Margem = R$ 20,00 e % Lucro = 100%
7. Clica "Salvar Alterações"
8. Sistema registra na auditoria:
   ```
   Campo: preco_venda
   Valor Anterior: 35.00
   Valor Novo: 40.00
   Usuário: João Silva
   Data: 23/08/2026 14:35
   ```
9. Mostra sucesso
10. Produto é atualizado
11. Próximas vendas usam o novo preço

**Impacto:**
- Novos pedidos usarão R$ 40,00
- Histórico de vendas anteriores mantém o preço de R$ 35,00
- Relatório pode comparar períodos

---

### Caso de Uso 3: Desativar Produto Vencido

**Ator:** Gerente

**Fluxo:**
1. No dashboard, recebe alerta: "Produto Refrigerante Premium está vencido"
2. Clica para abrir o produto
3. Vê data de validade: 15/08/2026 (hoje: 23/08/2026)
4. Clica "Desativar Produto"
5. Sistema confirma:
   "Este produto será desativado.
    Vendas anteriores serão mantidas no histórico.
    Deseja continuar?"
6. Clica "Confirmar"
7. Sistema Executa:
   - UPDATE produtos SET status = 'inativo' WHERE id = ...
   - INSERT auditoria (Campo: status, Anterior: ativo, Novo: inativo)
8. Mostra sucesso
9. Produto desaparece de:
   - Listagem padrão
   - PDV (busca de vendas)
   - Menu Digital
10. Produto ainda aparece em:
    - Histórico de vendas
    - Filtro "Mostrar inativos"
    - Relatórios passados

---

### Caso de Uso 4: Gerenciar Categorias

**Ator:** Admin

**Fluxo - Criar Categoria:**
1. Vai para "Configurações > Categorias"
2. Clica "Nova Categoria"
3. Preenche:
   - Nome: "Bebidas Frias"
   - Descrição: "Refrigerantes, Sucos Gelados"
   - Cor: Azul (#4A90E2)
   - Ícone: 🥤
4. Clica "Salvar"
5. Categoria criada
6. Imediatamente disponível ao criar novo produto

**Fluxo - Editar Categoria:**
1. Seleciona "Bebidas Frias"
2. Clica "Editar"
3. Muda nome para "Bebidas e Sucos"
4. Clica "Salvar"
5. Atualiza em tempo real
6. Todos os 15 produtos nesta categoria agora mostram categoria atualizada

**Fluxo - Deletar Categoria:**
1. Seleciona "Bebidas Frias"
2. Clica "Deletar"
3. Sistema verifica: "Existem 15 produtos nesta categoria"
4. Sistema bloqueia: "Não é possível deletar. Mude estes produtos para outra categoria primeiro."
5. Admin vai a Produtos > Filtra por Categoria > Move produtos
6. Volta e tenta deletar novamente
7. Agora funciona

---

## 9. TELAS/MOCKUPS

### Tela 1: Lista de Produtos

```
┌─────────────────────────────────────────────────────────────┐
│ 🍔 Produtos                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Novo Produto]  [Importar]                                  │
│                                                              │
│ Buscar: [____________]  Categoria: [Todas ▼]  [Filtros]    │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐
│ │ Nome      │ SKU    │ Categoria │ Preço Venda │ Lucro │   │
│ ├──────────────────────────────────────────────────────────┤
│ │🍔 Hamburger  HAM-001  Lanches   R$ 35,00      75%   ⋮│   │
│ │🍕 Pizza      PIZ-001  Pizzas    R$ 45,00      80%   ⋮│   │
│ │🥗 Salada     SAL-001  Saladas   R$ 32,00      60%   ⋮│   │
│ │🍟 Batata     BAT-001  Lanches   R$ 15,00      50%   ⋮│   │
│ │🥤 Refrigerante BEB-001 Bebidas  R$ 8,00       33%   ⋮│   │
│ │                                                         │
│ │ Menu ⋮ (para cada linha)                               │
│ │   - Visualizar                                         │
│ │   - Editar                                             │
│ │   - Duplicar                                           │
│ │   - Desativar                                          │
│ │   - Ver Histórico                                      │
│ └──────────────────────────────────────────────────────────┘
│                                                              │
│ Mostrando 1-20 de 145 produtos                              │
│ [< Anterior]  1 [2] 3 4 5  [Próximo >]                     │
└─────────────────────────────────────────────────────────────┘
```

### Tela 2: Formulário de Produto (Abas)

```
┌──────────────────────────────────────────────────────────────┐
│ Novo Produto                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Básico] [Preços] [Estoque] [Validade]                      │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ABA 1: INFORMAÇÕES BÁSICAS                            │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │                                                        │   │
│ │ Nome do Produto *                                     │   │
│ │ [_____________________________]                        │   │
│ │                                                        │   │
│ │ Descrição                                             │   │
│ │ [_________________________________]                  │   │
│ │                                                        │   │
│ │ SKU/Código *                                          │   │
│ │ [_______________]                                     │   │
│ │                                                        │   │
│ │ Categoria *                                           │   │
│ │ [Selecione uma categoria ▼]                          │   │
│ │ • Lanches                                             │   │
│ │ • Pizzas                                              │   │
│ │ • Bebidas                                             │   │
│ │ • Sobremesas                                          │   │
│ │                                                        │   │
│ │ Imagem do Produto                                     │   │
│ │ ┌─────────────────────────────────────┐              │   │
│ │ │                                      │              │   │
│ │ │  [Clique para upload] ou solte aqui  │              │   │
│ │ │                                      │              │   │
│ │ └─────────────────────────────────────┘              │   │
│ │ Tamanho máximo: 2MB. Formatos: JPG, PNG              │   │
│ │                                                        │   │
│ │ Status                                                │   │
│ │ [⚫ Ativo] [⚪ Inativo]                                │   │
│ │                                                        │   │
│ │ [Anterior] [Próximo: Preços →]                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│ Novo Produto                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Básico] [Preços] [Estoque] [Validade]                      │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ABA 2: PREÇOS                                          │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │                                                        │   │
│ │ Preço de Custo * (quanto você paga)                   │   │
│ │ R$ [____________] (ex: 20.00)                         │   │
│ │                                                        │   │
│ │ Preço de Venda * (quanto você cobra)                  │   │
│ │ R$ [____________] (ex: 35.00)                         │   │
│ │ ⚠️ Deve ser maior que o preço de custo                │   │
│ │                                                        │   │
│ │ ┌──────────────────────────────────────┐              │   │
│ │ │ CÁLCULO AUTOMÁTICO:                  │              │   │
│ │ │ Margem de Lucro: R$ 15.00            │              │   │
│ │ │ Percentual de Lucro: 75.00%          │              │   │
│ │ └──────────────────────────────────────┘              │   │
│ │                                                        │   │
│ │ [← Anterior: Básico] [Próximo: Estoque →]             │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Tela 3: Painel de Categorias

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙️ Categorias                                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Nova Categoria]                                             │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Nome          │ Produtos │ Ativa │ Ações              │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ 🍔 Lanches   │   12    │ ✅    │ [Editar] [Deletar] │   │
│ │ 🍕 Pizzas    │    8    │ ✅    │ [Editar] [Deletar] │   │
│ │ 🥤 Bebidas   │   15    │ ✅    │ [Editar] [Deletar] │   │
│ │ 🍰 Sobremesas│    6    │ ✅    │ [Editar] [Deletar] │   │
│ │ 📦 Acessórios│   20    │ ❌    │ [Editar] [Deletar] │   │
│ │                                                     │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup Base (1-2 semanas)
- [ ] Estrutura de pastas (frontend + backend)
- [ ] Setup banco de dados (criar tabelas)
- [ ] Criar modelos Sequelize
- [ ] Configurar autenticação e autorização
- [ ] Setup upload de imagens

### Sprint 2: CRUD de Categorias (1-2 semanas)
- [ ] Endpoints GET, POST, PUT, DELETE de categorias
- [ ] Componentes de listagem e formulário (frontend)
- [ ] Validações backend
- [ ] Testes unitários

### Sprint 3: CRUD de Produtos (2-3 semanas)
- [ ] Endpoints GET, POST, PUT, DELETE de produtos
- [ ] Componentes de listagem (frontend)
- [ ] Formulário com abas
- [ ] Cálculos automáticos
- [ ] Upload de imagem
- [ ] Testes

### Sprint 4: Auditoria e Polish (1 semana)
- [ ] Implementar auditoria (log de edições)
- [ ] Página de histórico
- [ ] Filtros avançados
- [ ] Testes E2E
- [ ] Documentação

---

## 11. CHECKLIST ANTES DE INICIAR

- [ ] Banco de dados criado (PostgreSQL/MySQL)
- [ ] Conexão testada
- [ ] Estrutura de pastas criada
- [ ] Dependências instaladas (npm/pip)
- [ ] .env configurado
- [ ] Pasta de uploads criada com permissões corretas
- [ ] Framework escolhido e configurado
- [ ] Autenticação implementada
- [ ] Logger configurado
- [ ] Testes setup (Jest/Mocha)

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento
