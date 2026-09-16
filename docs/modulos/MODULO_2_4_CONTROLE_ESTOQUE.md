# MÓDULO 2.4: CONTROLE DE ESTOQUE

## 📋 Sumário Executivo

**Objetivo:** Gerenciar quantidade de produtos em estoque, registrar entradas (compras), saídas (vendas/devoluções), alertar sobre produtos com baixo estoque e manter histórico completo de movimentações.

**Funcionalidades Principais:**
- ✅ Dashboard de estoque com alertas
- ✅ Entrada de estoque (por compra)
- ✅ Saída de estoque (automática via vendas, manual)
- ✅ Ajuste de quantidade (inventário, dano, perda, devolução)
- ✅ Alertas de estoque baixo/crítico
- ✅ Histórico completo de movimentações
- ✅ Relatórios e análises
- ✅ Rastreamento por lote (alimentos)
- ✅ Movimentação entre depositos (futuro)

**Perfis de Acesso:**
- Operador (visualizar estoque)
- Gerente (criar entradas, ajustes, ver alertas)
- Admin (tudo + configurações)

**Atualização:** Automática (vendas/devoluções) + Manual (compras/ajustes)

---

## 1. FUNCIONALIDADE 1.1: DASHBOARD DE ESTOQUE

### 1.1.1 Visão Geral

```
┌──────────────────────────────────────────────────────────┐
│ 📦 ESTOQUE - Restaurante XYZ                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ RESUMO RÁPIDO:                                          │
│ ┌─────────────┬─────────────┬─────────────┬─────────┐   │
│ │ Total SKU   │ Valor Total │ Alertas     │ Crítico │   │
│ │ 125         │ R$ 8.500    │ 12 ⚠️       │ 3 🔴    │   │
│ └─────────────┴─────────────┴─────────────┴─────────┘   │
│                                                          │
│ PRODUTOS EM ALERTA:                                     │
│ 🔴 CRÍTICO (0-5 un):                                   │
│  • Hamburger Especial (2 un) - Mín: 10                 │
│  • Bacon Importado (3 un) - Mín: 15                    │
│  • Frango Desfiado (1 un) - Mín: 8                     │
│                                                          │
│ 🟠 BAIXO (5-20% acima do mínimo):                       │
│  • Pizza Especial (8 un) - Mín: 10                     │
│  • Queijo Cheddar (12 un) - Mín: 20                    │
│  • Molho Barbecue (5 L) - Mín: 10 L                    │
│  ... (9 mais)                                           │
│                                                          │
│ 🟢 NORMAL (acima do mínimo):                           │
│  • Hamburger Clássico (45 un)                          │
│  • Pizza Margherita (38 un)                            │
│  • Refrigerante 2L (52 un)                             │
│  ... (100+ produtos)                                    │
│                                                          │
│ ─────────────────────────────────────────────────────  │
│ [Entrada] [Saída Ajuste] [Inventário] [Relatórios]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 1.1.2 Tabela de Estoque

```
┌──────────────────────────────────────────────────────────────────┐
│ PRODUTOS EM ESTOQUE                                             │
├──────────────────────────────────────────────────────────────────┤
│ Produto      │ SKU    │ Qtd │ Mín │ Status │ Valor │ Ações     │
├──────────────────────────────────────────────────────────────────┤
│ Hamburger Cl. │ HAM-01 │ 45 │ 10  │ ✅OK   │ 1.575 │ [+][−][📋]│
│ Pizza Calab.  │ PIZ-02 │  8 │ 10  │ 🟠BX   │   384 │ [+][−][📋]│
│ Bacon Import. │ BAC-01 │  3 │ 15  │ 🔴CR   │   450 │ [+][−][📋]│
│ Ref. 2L       │ BEB-01 │ 52 │ 20  │ ✅OK   │   416 │ [+][−][📋]│
│ Queijo Ched.  │ QUE-02 │ 12 │ 20  │ 🟠BX   │   420 │ [+][−][📋]│
│ ...           │  ...   │ .. │ ..  │  ...   │  ...  │  ...      │
└──────────────────────────────────────────────────────────────────┘

Legenda:
✅ OK = Acima do mínimo
🟠 BX = Baixo estoque (5-20% acima mínimo)
🔴 CR = Crítico (0-5 un ou abaixo do mínimo)

Ações:
[+] Aumentar quantidade (entrada)
[−] Diminuir quantidade (saída/ajuste)
[📋] Ver histórico de movimentações
```

### 1.1.3 Filtros e Busca

```
Filtros Disponíveis:
├── Status: [Todos] [OK] [Baixo] [Crítico]
├── Categoria: [Todas] [Lanches] [Pizzas] [Bebidas]
├── Unidade: [Todas] [Unidade] [KG] [L]
├── Valor Mínimo: [R$ 0] até [R$ 10.000]
└── Produto: [Buscar por nome ou SKU]

Ordenação:
├── Por Nome (A-Z)
├── Por Quantidade (Crescente)
├── Por Quantidade (Decrescente)
├── Por Status Alerta
├── Por Valor Total
└── Por Último Movimento
```

---

## 2. FUNCIONALIDADE 2.1: ENTRADA DE ESTOQUE (COMPRAS)

### 2.1.1 Fluxo de Entrada

```
┌──────────────────────────────────────────┐
│ Gerente Clica [Entrada de Estoque]      │
└────────────┬─────────────────────────────┘
             │
┌────────────┴─────────────────────────────┐
│ Abre Tela de Nova Entrada               │
│ (Relacionada a Compra ou Manual)        │
└────────────┬─────────────────────────────┘
             │
┌────────────┴──────────────────────────────────┐
│ Preenche Informações da Compra:              │
│                                               │
│ 1. Fornecedor (obrigatório):                 │
│    [Fornecedor XYZ ▼]                        │
│                                               │
│ 2. Número da Nota Fiscal:                    │
│    [NF-2026-001234]                          │
│                                               │
│ 3. Data da Compra:                           │
│    [23/08/2026]                              │
│                                               │
│ 4. Produtos Adicionados:                     │
│    [+ Adicionar Produto]                     │
│                                               │
│    Hamburger Clássico:                       │
│    ├── SKU: HAM-001                          │
│    ├── Quantidade: [50] un                   │
│    ├── Preço Unitário: [R$ 20,00]           │
│    ├── Subtotal: R$ 1.000,00                │
│    ├── Lote: [LT-2026-0892]                 │
│    ├── Validade: [31/12/2026]               │
│    └── [Remover]                             │
│                                               │
│    Pizza Margherita:                         │
│    ├── SKU: PIZ-001                          │
│    ├── Quantidade: [30] un                   │
│    ├── Preço Unitário: [R$ 18,50]           │
│    ├── Subtotal: R$ 555,00                  │
│    ├── Lote: [LT-2026-0893]                 │
│    ├── Validade: [15/12/2026]               │
│    └── [Remover]                             │
│                                               │
│ 5. Observações:                              │
│    [Entrega prevista para 25/08]            │
│                                               │
│ ─────────────────────────────────────────   │
│ Total da Compra: R$ 1.555,00                │
│                                               │
│ [Cancelar] [Salvar Compra] [Finalizar]      │
│                                               │
└────────────┬──────────────────────────────────┘
             │
┌────────────┴──────────────────────────────────┐
│ Gerente Clica "Finalizar"                    │
└────────────┬──────────────────────────────────┘
             │
┌────────────┴─────────────────────────────────┐
│ Sistema Valida:                             │
│ ✓ Fornecedor existe?                        │
│ ✓ Produtos existem no BD?                   │
│ ✓ Quantidades > 0?                          │
│ ✓ Preços > 0?                               │
│ ✓ Validade > data atual?                    │
└────────────┬─────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ✅ OK        ❌ Erro
      │             │
      ▼             ▼
 Prossegue    Mostra erro
              específico
      │
┌─────┴──────────────────────────────────┐
│ Sistema Cria Entrada:                  │
│ • Insere na tabela MOVIMENTO_ESTOQUE  │
│ • Tipo: ENTRADA                        │
│ • Aumenta quantidade dos produtos     │
│ • Registra lote e validade             │
│ • Registra quem criou e quando         │
│ • ID Entrada: EST-20260823-001        │
└─────┬──────────────────────────────────┘
      │
┌─────┴──────────────────────────────────┐
│ Mostra Sucesso:                        │
│ Toast: "Entrada criada com sucesso!"   │
│ Compra #EST-20260823-001               │
│                                        │
│ Estoque Atualizado:                    │
│ • Hamburger: 45 → 95 un                │
│ • Pizza: 38 → 68 un                    │
│                                        │
│ [Visualizar Entrada] [Histórico]       │
│                                        │
└────────────────────────────────────────┘
```

### 2.1.2 Dados de Entrada

**Tabela de Informações:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| Fornecedor ID | Select | ✅ Sim | Qual fornecedor |
| Número NF | Text | ✅ Sim | Nota fiscal |
| Data Compra | Date | ✅ Sim | Quando comprou |
| Produto ID | Select | ✅ Sim | Qual produto |
| Quantidade | Number | ✅ Sim | Quanto entrou |
| Preço Unitário | Currency | ✅ Sim | Preço de custo |
| Lote | Text | ❌ Não | Código do lote |
| Validade | Date | ❌ Não | Data vencimento |
| Observações | Text | ❌ Não | Anotações |

---

## 3. FUNCIONALIDADE 3.1: SAÍDA DE ESTOQUE

### 3.1.1 Tipos de Saída

#### **Tipo 1: Saída Automática (Vendas)**

```
Quando venda é finalizada no PDV:

Venda criada:
├── 2x Hamburger Clássico
├── 1x Pizza Calabresa
└── 3x Refrigerante

Sistema executa:
├── UPDATE produtos SET quantidade = quantidade - 2 WHERE id = HAM-001
├── UPDATE produtos SET quantidade = quantidade - 1 WHERE id = PIZ-002
├── UPDATE produtos SET quantidade = quantidade - 3 WHERE id = BEB-001
├── INSERT movimento_estoque (tipo: VENDA, quantidade: -2, etc)
└── Atualiza status do produto se atingir mínimo

Registro Automático:
├── Tipo: VENDA
├── Referência: VEND-20260823-001234 (ID venda)
├── Quantidade Saída: Conforme itens
├── Motivo: Venda PDV
├── Data: Automática (agora)
├── Usuário: Operador que fez venda
└── Status: Confirmado
```

#### **Tipo 2: Saída Manual (Devolução, Dano, Perda)**

```
Fluxo:
1. Gerente vai para: [Saída Manual]
2. Seleciona Tipo de Saída:
   ├── Devolução (cliente devolveu produto)
   ├── Dano (produto danificado)
   ├── Perda (vencimento, roubo, etc)
   └── Ajuste (erro de contagem)

3. Preenche Formulário:

   Tipo de Saída: [Dano ▼]
   
   Produto: [Hamburger Clássico ▼]
   Quantidade: [5]
   
   Motivo: [Produto queimado no preparo]
   
   Observações: [Lote LT-2026-0892 problema]
   
4. Clica "Confirmar Saída"

5. Sistema:
   ├── Valida produto e quantidade
   ├── Diminui estoque
   ├── Registra movimento
   ├── Marca como DANO/PERDA/etc
   └── Mostra sucesso
```

**Matriz de Saídas:**

| Tipo | Impacto | Registra | Audit. | Exemplo |
|------|---------|----------|--------|---------|
| VENDA | Diminui | Automático | ✓ | PDV venda |
| DEVOLUÇÃO | Diminui | Manual | ✓ | Cliente devolveu |
| DANO | Diminui | Manual | ✓ | Queimou no fogo |
| PERDA | Diminui | Manual | ✓ | Venceu (deita fora) |
| AJUSTE | Aumenta/Diminui | Manual | ✓ | Erro de contagem |

---

## 4. FUNCIONALIDADE 4.1: SISTEMA DE ALERTAS

### 4.1.1 Níveis de Alerta

```
ESTOQUE CRÍTICO (Vermelho 🔴):
└─ Quantidade ≤ Quantidade Mínima
└─ OU Quantidade = 0
└─ OU Quantidade < 5 unidades (limite rígido)

Ação Sistema:
├── Notifica gerente imediatamente
├── Email de alerta
├── Toast na interface
├── Destaca em vermelho no dashboard
└── Sinal sonoro (opcional)

ESTOQUE BAIXO (Amarelo 🟠):
└─ Quantidade entre Mínimo e (Mínimo + 20%)

Exemplo:
   Mínimo: 10 unidades
   Baixo: 10-12 unidades (10 + 20% de 10)

Ação Sistema:
├── Notifica gerente
├── Mostra em cor amarela/laranja
├── Sugere compra do produto
└── Cria "Lembrete de Reposição"

ESTOQUE NORMAL (Verde 🟢):
└─ Quantidade > (Mínimo + 20%)

Ação Sistema:
├── Sem alerta
├── Mostra em verde
└── Tudo OK
```

### 4.1.2 Notificações

```
Canais de Notificação:
├── Toast na Interface (imediato)
├── Email para Gerente
├── SMS (opcional)
├── Relatório Diário
└── Dashboard

Exemplo de Notificação:

🔴 ALERTA CRÍTICO!
"Bacon Importado atingiu estoque crítico"
Quantidade atual: 3 unidades
Quantidade mínima: 15 unidades
Faltam: 12 unidades

[Fazer Compra] [Remover Alerta] [Ignora]

Frequência:
├── Crítico: A cada movimento
├── Baixo: 1x por dia (às 08:00)
└── Normal: Nenhuma notificação

Silenciar Alerta:
├── Temporário: 24 horas
├── Permanente: Desabilitar alerta deste produto
└── Criar compra: Automaticamente silencia
```

---

## 5. FUNCIONALIDADE 5.1: HISTÓRICO E MOVIMENTAÇÕES

### 5.1.1 Registro de Movimentação

**Exemplo de Histórico:**

```
┌────────────────────────────────────────────────────────────┐
│ HISTÓRICO: Hamburger Clássico (HAM-001)                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Data       │ Tipo      │ Qtd │ Saldo │ Usuário  │ Ref.     │
├────────────────────────────────────────────────────────────┤
│ 23/08 14:45│ VENDA     │ -2  │  43   │ João     │ VEND-001 │
│ 23/08 14:35│ VENDA     │ -1  │  45   │ Maria    │ VEND-002 │
│ 23/08 09:30│ ENTRADA   │ +50 │  46   │ Gerente  │ EST-001  │
│ 22/08 16:20│ DANO      │ -3  │  -4   │ Chef     │ Manual   │
│ 22/08 15:00│ VENDA     │ -5  │  -1   │ João     │ VEND-003 │
│ 22/08 08:00│ ENTRADA   │ +30 │   4   │ Gerente  │ EST-002  │
│ 21/08 17:30│ PERDA     │ -2  │  -26  │ Gerente  │ Manual   │
│                                                             │
│ [Exportar CSV] [Imprimir] [Filtrar Data]                  │
│                                                             │
└────────────────────────────────────────────────────────────┘

Detalhes ao Clicar:
┌────────────────────────────────────┐
│ Movimento #MOV-20260823-001234     │
├────────────────────────────────────┤
│ Tipo: VENDA                        │
│ Produto: Hamburger Clássico       │
│ Quantidade: -2 unidades            │
│ Saldo Anterior: 45 un              │
│ Saldo Novo: 43 un                  │
│ Referência: VEND-20260823-001234  │
│ Data: 23/08/2026 14:45:32         │
│ Operador: João Silva               │
│ Caixa: #01                         │
│ Observações: (nenhuma)             │
│                                    │
│ [Desfazer Movimento] [Voltar]      │
│                                    │
└────────────────────────────────────┘
```

### 5.1.2 Desfazer Movimento

```
Admin pode desfazer últimos movimentos:

Clica [Desfazer Movimento]

Modal Confirmação:
┌───────────────────────────────────┐
│ Deseja desfazer este movimento?   │
├───────────────────────────────────┤
│ Tipo: VENDA                       │
│ Produto: Hamburger                │
│ Quantidade: -2 un                 │
│ Saldo afetado: 43 → 45            │
│                                   │
│ Motivo do Desfazimento:           │
│ [Erro na operação_______]         │
│                                   │
│ [Cancelar] [Desfazer]             │
│                                   │
└───────────────────────────────────┘

Sistema:
├── Reverte o movimento
├── Restaura saldo anterior
├── Cria novo movimento "DESFAZIMENTO"
├── Registra quem desfez e por quê
├── Notifica operador original
└── Mostra sucesso

Restrições:
├── Apenas últimos 7 dias
├── Admin ou Gerente apenas
└── Registra em auditoria
```

---

## 6. FUNCIONALIDADE 6.1: INVENTÁRIO (CONTAGEM FÍSICA)

### 6.1.1 Fluxo de Inventário

```
┌────────────────────────────────────┐
│ Gerente Clica [Contagem Física]   │
└────────────┬────────────────────────┘
             │
┌────────────┴─────────────────────────┐
│ Sistema Oferece Opções:              │
│ [Inventário Total] [Parcial]        │
└────────────┬─────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Clica "Inventário Total"               │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Sistema Prepara:                        │
│ 1. Gera planilha com todos os produtos  │
│ 2. Quantidade segundo sistema           │
│ 3. Campo para quantidade real           │
│ 4. Diferença (divergência)              │
│                                         │
│ Opções:                                 │
│ [Imprimir] [Baixar Excel] [Usar App]   │
│                                         │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────────────┐
│ Gerente/Operador Faz Contagem Manual:           │
│ (Com papel ou App)                               │
│                                                  │
│ Hamburger Clássico:                             │
│ Sistema diz: 45 unidades                        │
│ Realidade: 43 unidades                          │
│ Diferença: -2 (faltam 2)                        │
│                                                  │
│ Pizza Calabresa:                                │
│ Sistema diz: 38 unidades                        │
│ Realidade: 40 unidades                          │
│ Diferença: +2 (sobraram 2)                      │
│                                                  │
│ Refrigerante 2L:                                │
│ Sistema diz: 52 unidades                        │
│ Realidade: 52 unidades                          │
│ Diferença: 0 (correto)                          │
│                                                  │
└────────────┬──────────────────────────────────────┘
             │
┌────────────┴──────────────────────────────────────┐
│ Insere Quantidades Reais no Sistema:            │
│ [Hamburger: 43] [Pizza: 40] [Refri: 52]        │
└────────────┬──────────────────────────────────────┘
             │
┌────────────┴──────────────────────────────────────┐
│ Sistema Calcula Divergências:                    │
│ Hamburger: 45 - 43 = -2 (Possível Roubo/Erro)  │
│ Pizza: 38 - 40 = +2 (Erro de Contagem Anterior)│
│ Refrigerante: Correto ✓                         │
│                                                  │
│ Gera Relatório de Divergências                 │
│                                                  │
│ [Salvar Inventário] [Revisar] [Cancelar]       │
│                                                  │
└────────────┬──────────────────────────────────────┘
             │
┌────────────┴──────────────────────────────────────┐
│ Clica "Salvar Inventário"                       │
└────────────┬──────────────────────────────────────┘
             │
┌────────────┴───────────────────────────────────────┐
│ Sistema Cria Movimentos de Ajuste:                │
│ • Para cada produto com diferença                 │
│ • Tipo: AJUSTE INVENTÁRIO                         │
│ • Registra quantidade corrigida                   │
│ • Motivo: "Contagem Física"                       │
│ • Data/Hora: Agora                               │
│ • Usuário: Quem fez                              │
│                                                   │
│ Hamburger:                                       │
│ Quantidade anterior: 45                          │
│ Quantidade nova: 43                              │
│ Movimento criado: -2                             │
│                                                   │
│ Pizza:                                           │
│ Quantidade anterior: 38                          │
│ Quantidade nova: 40                              │
│ Movimento criado: +2                             │
│                                                   │
└────────────┬───────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────┐
│ Mostra Sucesso:                                │
│ "Inventário realizado com sucesso!"            │
│ Inventário #INV-20260823-001                   │
│                                                │
│ Divergências Encontradas:                      │
│ • Hamburger: -2 unidades                       │
│ • Pizza: +2 unidades                           │
│ • Total Ajustado                               │
│                                                │
│ [Ver Relatório] [Histórico Inventários]        │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 7. BANCO DE DADOS

### 7.1 Tabela ESTOQUE

```sql
CREATE TABLE estoque (
  id SERIAL PRIMARY KEY,
  produto_id INT NOT NULL,
  
  -- Quantidade
  quantidade_atual INT NOT NULL DEFAULT 0,
  quantidade_minima INT NOT NULL DEFAULT 10,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'normal',
  -- normal, baixo, critico
  
  -- Últimas Movimentações
  ultima_movimento TIMESTAMP,
  ultima_entrada TIMESTAMP,
  ultima_saida TIMESTAMP,
  
  -- Auditoria
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  INDEX idx_produto(produto_id),
  INDEX idx_status(status),
  INDEX idx_quantidade(quantidade_atual),
  UNIQUE (produto_id)
);
```

### 7.2 Tabela MOVIMENTO_ESTOQUE

```sql
CREATE TABLE movimento_estoque (
  id SERIAL PRIMARY KEY,
  numero_movimento VARCHAR(30) NOT NULL UNIQUE,
  -- MOV-20260823-001234
  
  produto_id INT NOT NULL,
  
  -- Tipo de Movimento
  tipo VARCHAR(20) NOT NULL,
  -- ENTRADA, VENDA, DEVOLUCAO, DANO, PERDA, AJUSTE, DESFAZIMENTO
  
  -- Quantidades
  quantidade INT NOT NULL,  -- Pode ser positiva ou negativa
  saldo_anterior INT NOT NULL,
  saldo_novo INT NOT NULL,
  
  -- Referência
  referencia_id VARCHAR(100),  -- ID da venda, compra, etc
  referencia_tipo VARCHAR(20),  -- VENDA, COMPRA, etc
  
  -- Lote e Validade (para rastreamento)
  lote VARCHAR(50),
  data_validade DATE,
  
  -- Motivo (para não-vendas)
  motivo TEXT,  -- "Produto queimado", "Cliente devolveu", etc
  observacoes TEXT,
  
  -- Auditoria
  usuario_id INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  
  INDEX idx_produto(produto_id),
  INDEX idx_tipo(tipo),
  INDEX idx_data(data_criacao),
  INDEX idx_referencia(referencia_id),
  CONSTRAINT tipo_valido CHECK (
    tipo IN ('ENTRADA', 'VENDA', 'DEVOLUCAO', 'DANO', 'PERDA', 'AJUSTE', 'DESFAZIMENTO')
  )
);
```

### 7.3 Tabela ENTRADA_ESTOQUE (Compras)

```sql
CREATE TABLE entrada_estoque (
  id SERIAL PRIMARY KEY,
  numero_entrada VARCHAR(30) NOT NULL UNIQUE,
  -- EST-20260823-001
  
  fornecedor_id INT NOT NULL,
  
  -- Documento
  numero_nf VARCHAR(50),  -- Nota Fiscal
  data_compra DATE NOT NULL,
  data_entrega DATE,
  
  -- Valores
  valor_total DECIMAL(10,2) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pendente',
  -- pendente, recebida, parcial
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  criado_por INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  
  INDEX idx_fornecedor(fornecedor_id),
  INDEX idx_data(data_compra),
  INDEX idx_status(status)
);

CREATE TABLE entrada_estoque_itens (
  id SERIAL PRIMARY KEY,
  entrada_id INT NOT NULL,
  produto_id INT NOT NULL,
  
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  
  -- Rastreamento
  lote VARCHAR(50),
  data_validade DATE,
  
  -- Status
  recebido BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (entrada_id) REFERENCES entrada_estoque(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  
  INDEX idx_entrada(entrada_id),
  INDEX idx_produto(produto_id)
);
```

### 7.4 Tabela INVENTARIOS

```sql
CREATE TABLE inventarios (
  id SERIAL PRIMARY KEY,
  numero_inventario VARCHAR(30) NOT NULL UNIQUE,
  -- INV-20260823-001
  
  -- Tipo
  tipo VARCHAR(20) NOT NULL,
  -- TOTAL, PARCIAL
  
  -- Períodos
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP,
  
  -- Resultados
  total_produtos INT,
  divergencias INT,
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  realizado_por INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (realizado_por) REFERENCES usuarios(id),
  
  INDEX idx_tipo(tipo),
  INDEX idx_data(data_criacao)
);

CREATE TABLE inventario_items (
  id SERIAL PRIMARY KEY,
  inventario_id INT NOT NULL,
  produto_id INT NOT NULL,
  
  quantidade_sistema INT NOT NULL,
  quantidade_real INT NOT NULL,
  diferenca INT,  -- quantidade_real - quantidade_sistema
  
  FOREIGN KEY (inventario_id) REFERENCES inventarios(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  
  INDEX idx_inventario(inventario_id),
  INDEX idx_diferenca(diferenca)
);
```

---

## 8. API REST - ENDPOINTS

### 8.1 Endpoints de Consulta

**Base URL:** `http://localhost:3000/api/estoque`

#### **GET /api/estoque**
Obter dashboard de estoque
```
Query Params:
  - filtro_status: 'todos' | 'critico' | 'baixo' | 'normal'
  - categoria_id: int
  - ordenar: 'nome' | 'quantidade' | 'status'

Response:
{
  "sucesso": true,
  "dados": {
    "resumo": {
      "total_produtos": 125,
      "valor_total_estoque": 8500.00,
      "alertas_criticos": 3,
      "alertas_baixos": 12,
      "produtos_normais": 110
    },
    "produtos": [
      {
        "id": 12345,
        "nome": "Hamburger Clássico",
        "sku": "HAM-001",
        "quantidade": 45,
        "quantidade_minima": 10,
        "status": "normal",
        "valor_total": 900.00,
        "ultima_movimentacao": "2026-08-23T14:45:00Z"
      }
    ]
  }
}
```

#### **GET /api/estoque/produto/{id}/historico**
Obter histórico de movimentações
```
Query Params:
  - dias: int (últimos N dias, padrão: 30)
  - tipo: 'todos' | 'entrada' | 'venda' | 'ajuste'

Response:
{
  "sucesso": true,
  "dados": {
    "produto": {
      "id": 12345,
      "nome": "Hamburger Clássico",
      "sku": "HAM-001",
      "quantidade_atual": 45
    },
    "movimentacoes": [
      {
        "id": 1,
        "tipo": "VENDA",
        "quantidade": -2,
        "saldo_anterior": 47,
        "saldo_novo": 45,
        "data": "2026-08-23T14:45:00Z",
        "usuario": "João Silva",
        "referencia": "VEND-001234"
      }
    ]
  }
}
```

### 8.2 Endpoints de Entrada

#### **POST /api/estoque/entrada**
Criar nova entrada de estoque
```
Body:
{
  "fornecedor_id": 5,
  "numero_nf": "NF-2026-001234",
  "data_compra": "2026-08-23",
  "itens": [
    {
      "produto_id": 12345,
      "quantidade": 50,
      "preco_unitario": 20.00,
      "lote": "LT-2026-0892",
      "data_validade": "2026-12-31"
    }
  ],
  "observacoes": "Entrega prevista para amanhã"
}

Response:
{
  "sucesso": true,
  "mensagem": "Entrada criada com sucesso",
  "dados": {
    "id": 54321,
    "numero_entrada": "EST-20260823-001",
    "valor_total": 1000.00
  }
}
```

### 8.3 Endpoints de Saída

#### **POST /api/estoque/saida-manual**
Criar saída manual (dano, perda, devolução)
```
Body:
{
  "tipo": "DANO",  -- ou PERDA, DEVOLUCAO, AJUSTE
  "produto_id": 12345,
  "quantidade": 5,
  "motivo": "Produto queimado no preparo",
  "observacoes": "Lote LT-2026-0892"
}

Response:
{
  "sucesso": true,
  "mensagem": "Saída registrada com sucesso",
  "dados": {
    "id": 112233,
    "numero_movimento": "MOV-20260823-001234",
    "saldo_novo": 40
  }
}
```

### 8.4 Endpoints de Inventário

#### **POST /api/estoque/inventario/iniciar**
Iniciar contagem física
```
Body:
{
  "tipo": "TOTAL",  -- ou PARCIAL
  "categoria_ids": [1, 2, 3]  -- opcional para parcial
}

Response:
{
  "sucesso": true,
  "dados": {
    "id": 999,
    "numero_inventario": "INV-20260823-001",
    "produtos": [
      {
        "id": 12345,
        "nome": "Hamburger",
        "quantidade_sistema": 45
      }
    ]
  }
}
```

#### **POST /api/estoque/inventario/{id}/finalizar**
Finalizar inventário com quantidades reais
```
Body:
{
  "itens": [
    {
      "produto_id": 12345,
      "quantidade_real": 43
    },
    {
      "produto_id": 67890,
      "quantidade_real": 40
    }
  ]
}

Response:
{
  "sucesso": true,
  "mensagem": "Inventário finalizado",
  "dados": {
    "divergencias": [
      {
        "produto": "Hamburger",
        "esperado": 45,
        "real": 43,
        "diferenca": -2
      }
    ]
  }
}
```

#### **GET /api/estoque/alertas**
Obter lista de alertas
```
Response:
{
  "sucesso": true,
  "dados": {
    "criticos": [
      {
        "id": 12345,
        "nome": "Bacon Importado",
        "quantidade": 3,
        "minimo": 15,
        "status": "critico"
      }
    ],
    "baixos": [...]
  }
}
```

---

## 9. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/estoque/
│
├── pages/
│   ├── DashboardEstoquePage.jsx      # Visão geral
│   ├── ProdutosEstoquePage.jsx       # Lista produtos
│   ├── EntradaEstoquePage.jsx        # Registrar entrada
│   ├── SaidaEstoquePage.jsx          # Registrar saída
│   ├── HistoricoMovimentacaoPage.jsx # Histórico
│   └── InventarioPage.jsx            # Contagem física
│
├── components/
│   ├── Dashboard/
│   │   ├── ResumoAlerts.jsx
│   │   ├── TabelaProdutosEstoque.jsx
│   │   ├── CardAlerta.jsx
│   │   └── GraficoEstoque.jsx
│   │
│   ├── Entrada/
│   │   ├── FormularioEntrada.jsx
│   │   ├── ListaFornecedores.jsx
│   │   ├── TabelaItensEntrada.jsx
│   │   └── SeletorProduto.jsx
│   │
│   ├── Saida/
│   │   ├── FormularioSaida.jsx
│   │   ├── SeletorTipoSaida.jsx
│   │   └── ModalConfirmacaoSaida.jsx
│   │
│   ├── Historico/
│   │   ├── TabelaMovimentacoes.jsx
│   │   ├── FiltrosHistorico.jsx
│   │   ├── ModalDetalheMovimento.jsx
│   │   └── BotaoDesfazimento.jsx
│   │
│   ├── Inventario/
│   │   ├── FormularioInventario.jsx
│   │   ├── PlanilhaContagem.jsx
│   │   ├── RelatorioInventario.jsx
│   │   └── TabelaComparacao.jsx
│   │
│   └── Alertas/
│       ├── BannerAlerta.jsx
│       ├── ListaAlertas.jsx
│       └── BotaoSilenciarAlerta.jsx
│
├── hooks/
│   ├── useEstoque.js
│   ├── useEntrada.js
│   ├── useSaida.js
│   ├── useMovimentacoes.js
│   └── useInventario.js
│
├── services/
│   ├── estoqueService.js
│   └── movimentacaoService.js
│
├── utils/
│   ├── statusEstoque.js
│   ├── formatacaoQuantidade.js
│   └── validacoes.js
│
├── styles/
│   ├── estoque.css
│   ├── dashboard.css
│   ├── formularios.css
│   └── alertas.css
│
└── constants/
    ├── tiposMovimento.js
    ├── nivelisAlerta.js
    └── statusEstoque.js
```

---

## 10. ESTRUTURA DE PASTAS (Backend)

```
src/modules/estoque/
│
├── controllers/
│   ├── estoqueController.js
│   ├── entradaController.js
│   ├── saidaController.js
│   ├── historicoController.js
│   ├── inventarioController.js
│   └── alertasController.js
│
├── services/
│   ├── estoqueService.js            # Lógica principal
│   ├── entradaService.js
│   ├── saidaService.js
│   ├── historicoService.js
│   ├── inventarioService.js
│   ├── alertaService.js             # Notificações
│   └── calculoFifoService.js        # FIFO para lotes
│
├── repositories/
│   ├── estoqueRepository.js
│   ├── movimentacaoRepository.js
│   ├── entradaRepository.js
│   └── inventarioRepository.js
│
├── models/
│   ├── estoqueModel.js
│   ├── movimentoEstoqueModel.js
│   ├── entradaEstoqueModel.js
│   └── inventarioModel.js
│
├── routes/
│   ├── estoqueRoutes.js
│   ├── entradaRoutes.js
│   ├── saidaRoutes.js
│   ├── historicoRoutes.js
│   ├── inventarioRoutes.js
│   └── alertasRoutes.js
│
├── validacoes/
│   ├── entradaValidacao.js
│   ├── saidaValidacao.js
│   └── inventarioValidacao.js
│
├── middleware/
│   ├── validacaoEstoque.js
│   ├── autorizacaoEstoque.js
│   └── registroAuditoria.js
│
└── utils/
    ├── calculoStatus.js
    ├── geracaoNumero.js
    └── notificacaoAlerta.js
```

---

## 11. CASOS DE USO DETALHADOS

### Caso de Uso 1: Entrada de Compra

**Ator:** Gerente
**Tempo:** ~5 minutos

**Fluxo:**
1. Fornecedor entrega 50 Hamburger + 30 Pizza
2. Gerente vai para Estoque > [Entrada]
3. Seleciona Fornecedor: "Fornecedor XYZ"
4. Número NF: "NF-2026-001234"
5. Data: "23/08/2026"
6. Clica [+ Adicionar Produto]
7. Seleciona: "Hamburger Clássico"
8. Quantidade: 50, Preço: R$ 20,00
9. Lote: "LT-2026-0892", Validade: "31/12/2026"
10. Clica [Adicionar]
11. Adiciona Pizza (30 un, R$ 18,50)
12. Clica "Finalizar Entrada"
13. Sistema valida tudo
14. Cria entrada: EST-20260823-001
15. Atualiza estoque:
    - Hamburger: 45 → 95
    - Pizza: 38 → 68
16. Toast: "Entrada registrada!"
17. Estoque atualizado em tempo real

**Resultado:** 80 produtos entram no sistema, rastreáveis por lote.

---

### Caso de Uso 2: Saída Manual (Dano)

**Ator:** Chef/Gerente
**Tempo:** ~2 minutos

**Fluxo:**
1. Chef queima um Hamburger (está preparando)
2. Gerente vai para Estoque > [Saída Manual]
3. Tipo: "DANO"
4. Produto: "Hamburger Clássico"
5. Quantidade: 1
6. Motivo: "Queimado no fogo"
7. Observações: "Chef iniciante treinando"
8. Clica "Confirmar"
9. Sistema valida
10. Estoque reduz: 95 → 94
11. Cria movimento: MOV-20260823-001234
12. Tipo: DANO
13. Registra quem, quando, por quê
14. Toast: "Saída registrada"

**Resultado:** Contabilizado como perda, estoque correto, auditoria completa.

---

### Caso de Uso 3: Alerta Automático

**Ator:** Sistema (automático)

**Fluxo:**
1. Venda de 3x Bacon Importado
2. Estoque anterior: 15 un
3. Novo estoque: 12 un
4. Quantidade Mínima: 15 un
5. Sistema detecta: 12 < 15
6. Status muda de NORMAL → BAIXO
7. Envia notificação:
   - Toast na interface do gerente
   - Email para gerente@empresa.com
   - Adiciona ao dashboard "Alertas"
8. Gerente recebe: "Bacon está baixo"
9. Clica [Fazer Compra]
10. Abre formulário de entrada pré-preenchido
11. Gerente preenche quantidade desejada
12. Faz a compra
13. Alerta silenciado automaticamente

**Resultado:** Gerente proativo, sem perda de venda por falta de estoque.

---

### Caso de Uso 4: Inventário Física

**Ator:** Gerente + Equipe
**Tempo:** ~1 hora (todo estoque)

**Fluxo:**
1. Fim de semana, restaurante fechado
2. Gerente vai para: Estoque > [Contagem Física]
3. Clica "Inventário Total"
4. Sistema gera planilha com 125 produtos
5. Clica [Imprimir]
6. 3 pessoas com pranchetas fazem contagem
7. Após 1 hora, trazem resultados
8. Gerente insere quantidades reais no sistema
9. Sistema compara:
   - Hamburger: Sistema=45, Real=43, Diff=-2
   - Pizza: Sistema=38, Real=40, Diff=+2
   - (resto correto)
10. Mostra divergências
11. Gerente clica "Finalizar Inventário"
12. Sistema cria movimentos de ajuste:
    - AJUSTE INVENTÁRIO: -2 Hamburger
    - AJUSTE INVENTÁRIO: +2 Pizza
13. Estoque sincronizado com realidade
14. Gera relatório de divergências
15. Admin pode investigar depois

**Resultado:** Estoque preciso, divergências documentadas e investigadas.

---

## 12. MOCKUPS

### Tela 1: Dashboard de Estoque

```
┌─────────────────────────────────────────────────┐
│ 📦 ESTOQUE                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ RESUMO:                                         │
│ ┌────────┬────────┬────────┬────────┐          │
│ │ 125 SKU│ R$ 8.5k│ 12 ⚠️  │ 3 🔴  │          │
│ └────────┴────────┴────────┴────────┘          │
│                                                 │
│ ALERTAS CRÍTICOS 🔴:                           │
│ • Bacon (3 un) - Min: 15                      │
│ • Frango (1 un) - Min: 8                      │
│ • Queijo Cheddar (4 un) - Min: 20             │
│                                                 │
│ PRODUTOS BAIXO 🟠 (9 mais)                     │
│                                                 │
│ NORMAL 🟢 (110 produtos)                       │
│                                                 │
│ Filtro: [Todos ▼] Cat: [Todas ▼] Ord: [Nome] │
│                                                 │
│ ┌──────────┬────┬─────┬────┬──────┬────────┐  │
│ │Produto   │QTD │MÍN  │STS │Valor │Ações   │  │
│ ├──────────┼────┼─────┼────┼──────┼────────┤  │
│ │Hamburger │ 45 │  10 │✅ │1.575 │[+][−]  │  │
│ │Pizza CB. │  8 │  10 │🟠 │  384 │[+][−]  │  │
│ │Bacon     │  3 │  15 │🔴 │  450 │[+][−]  │  │
│ │Refri 2L  │ 52 │  20 │✅ │  416 │[+][−]  │  │
│ │Queijo CD │ 12 │  20 │🟠 │  420 │[+][−]  │  │
│ └──────────┴────┴─────┴────┴──────┴────────┘  │
│                                                 │
│ [Entrada] [Saída] [Inventário] [Relatórios]  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tela 2: Formulário de Entrada

```
┌─────────────────────────────────────────────┐
│ ENTRADA DE ESTOQUE                          │
├─────────────────────────────────────────────┤
│                                             │
│ Fornecedor: [Fornecedor XYZ ▼]             │
│ Número NF: [NF-2026-001234]                │
│ Data Compra: [23/08/2026]                  │
│                                             │
│ PRODUTOS:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ Hamburger Clássico (HAM-001)            │ │
│ │ Qtd: [50] | Preço: [20,00]             │ │
│ │ Lote: [LT-2026-0892]                    │ │
│ │ Validade: [31/12/2026]                  │ │
│ │ Subtotal: R$ 1.000,00  [Remover]       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Pizza Margherita (PIZ-001)              │ │
│ │ Qtd: [30] | Preço: [18,50]             │ │
│ │ Lote: [LT-2026-0893]                    │ │
│ │ Validade: [15/12/2026]                  │ │
│ │ Subtotal: R$ 555,00  [Remover]         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ Adicionar Produto]                      │
│                                             │
│ Obs: [Entrega amanhã_____________]         │
│                                             │
│ Total Compra: R$ 1.555,00                  │
│                                             │
│ [Cancelar] [Salvar] [Finalizar Entrada]   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 13. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup + Dashboard (1-2 semanas)
- [ ] BD: tabelas estoque, movimento
- [ ] API: GET dashboard, lista produtos
- [ ] Frontend: Dashboard com resumo
- [ ] Filtros básicos
- [ ] Testes

### Sprint 2: Entrada de Estoque (1-2 semanas)
- [ ] BD: entrada_estoque, itens
- [ ] API: POST entrada
- [ ] Frontend: Formulário entrada
- [ ] Validações
- [ ] Testes

### Sprint 3: Saída Manual (1 semana)
- [ ] API: POST saída manual
- [ ] Frontend: Formulário saída
- [ ] Integração com vendas (saída automática)
- [ ] Testes

### Sprint 4: Alertas (1 semana)
- [ ] Cálculo de status
- [ ] Notificações
- [ ] Email/SMS
- [ ] Testes

### Sprint 5: Histórico (1 semana)
- [ ] API: GET histórico
- [ ] Frontend: Tabela movimentações
- [ ] Desfazimento
- [ ] Testes

### Sprint 6: Inventário (1-2 semanas)
- [ ] API: Iniciar/finalizar inventário
- [ ] Frontend: Planilha de contagem
- [ ] Comparação sistema vs real
- [ ] Relatório divergências
- [ ] Testes

### Sprint 7: Relatórios (1-2 semanas)
- [ ] Gráficos de movimentação
- [ ] Análise de consumo
- [ ] Sugestões de compra
- [ ] Exportação

### Sprint 8: Testes + Deploy (1 semana)
- [ ] Testes E2E
- [ ] Performance
- [ ] Staging
- [ ] Deploy produção

---

## 14. CHECKLIST ANTES DE INICIAR

- [ ] Requisitos finalizados
- [ ] BD schema validado
- [ ] Integração PDV-Estoque definida
- [ ] Política de lotes (FIFO/LIFO) decidida
- [ ] Alertas por produto definidos
- [ ] Fornecedores cadastrados
- [ ] Ambiente dev setup
- [ ] Teste de carga (quantidade de movimentos)
- [ ] Backup/recovery plan
- [ ] Auditoria requisitos (compliance)

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento

**Próximos Módulos:**
- Módulo 2.5: Financeiro e Fluxo de Caixa
- Módulo 2.6: Análises e Relatórios
- Módulo 3: Autenticação e Perfis
