# MÓDULO 2.5: FINANCEIRO E FLUXO DE CAIXA

## 📋 Sumário Executivo

**Objetivo:** Gerenciar aspecto financeiro completo do restaurante: receitas (vendas), despesas (custos operacionais), contas a pagar/receber, fluxo de caixa diário e análises de lucratividade.

**Funcionalidades Principais:**
- ✅ Dashboard financeiro com KPIs
- ✅ Gestão de despesas por categoria
- ✅ Contas a pagar com vencimento
- ✅ Contas a receber (futuro)
- ✅ Fluxo de caixa diário/mensal
- ✅ Abertura e fechamento de caixa
- ✅ Conciliação bancária (futuro)
- ✅ Análise de lucro por período
- ✅ Relatórios financeiros (P&L, DRE)
- ✅ Exportação de dados

**Perfis de Acesso:**
- Operador (visualizar vendas do dia)
- Gerente (criar despesas, ver fluxo)
- Admin/Financeiro (acesso total, análises)

**Periodicidade:** Diária, Semanal, Mensal, Anual

---

## 1. FUNCIONALIDADE 1.1: DASHBOARD FINANCEIRO

### 1.1.1 Visão Geral KPIs

```
┌───────────────────────────────────────────────────────────┐
│ 💰 FINANCEIRO - Período: [Agosto/2026 ▼]                │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ KPIs PRINCIPAIS:                                          │
│ ┌──────────────┬──────────────┬──────────────────────────┐
│ │ FATURAMENTO  │ CUSTOS       │ LUCRO LÍQUIDO           │
│ │ R$ 15.850,00 │ R$ 8.420,00  │ R$ 7.430,00             │
│ │ ↑ 12% vs mês │ ↑ 5% vs mês  │ ↑ 18% vs mês            │
│ │ passado      │ passado      │ passado (47% margem)    │
│ └──────────────┴──────────────┴──────────────────────────┘
│                                                           │
│ ┌──────────────┬──────────────┬──────────────────────────┐
│ │ TICKET MÉDIO │ PEDIDOS HOJE │ CONTAS A PAGAR VENCIDAS│
│ │ R$ 75,50     │ 210 pedidos  │ 3 contas / R$ 2.100    │
│ │ ↓ 2% vs mês  │ ↑ 8% vs mês  │ ⚠️ ATENÇÃO              │
│ └──────────────┴──────────────┴──────────────────────────┘
│                                                           │
│ RECEITAS x DESPESAS (Este Mês até agora):               │
│                                                           │
│ Receitas:                                               │
│ ├── Vendas PDV: R$ 234.500,00 (85%)                     │
│ ├── Pedidos Online: R$ 38.200,00 (14%)                  │
│ └── Outros: R$ 3.400,00 (1%)                            │
│ TOTAL: R$ 276.100,00                                    │
│                                                           │
│ Despesas:                                               │
│ ├── Insumos/COGS: R$ 118.500,00 (43%)                   │
│ ├── Pessoal: R$ 85.200,00 (31%)                         │
│ ├── Aluguel: R$ 12.000,00 (4%)                          │
│ ├── Água/Luz/Gás: R$ 5.800,00 (2%)                      │
│ ├── Marketing: R$ 3.500,00 (1%)                         │
│ └── Outros: R$ 51.000,00 (19%)                          │
│ TOTAL: R$ 276.000,00                                    │
│                                                           │
│ LUCRO LÍQUIDO: R$ 100,00 (0,04% margem) ⚠️ CRÍTICO      │
│                                                           │
│ ┌────────────────────────────────────────────────────────┐
│ │ [Fluxo Caixa] [Contas A Pagar] [Relatórios] [Config]  │
│ └────────────────────────────────────────────────────────┘
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 1.1.2 Gráficos de Análise

```
GRÁFICO 1: Receitas vs Despesas (Últimos 30 dias)

      R$
      |
40k   |     ╱╲        ╱╲
      |    ╱  ╲      ╱  ╲
30k   |   ╱    ╲    ╱    ╲
      |  ╱      ╲  ╱      ╲
20k   | ╱        ╲╱        ╲
      |╱                    ╲
10k   |                      ╲
      |                       ╲
  0   |________________________
      Dia1  Dia5  Dia10 Dia15 Dia20 Dia25 Dia30
      
      —— Receitas   —— Despesas

GRÁFICO 2: Composição de Despesas (Pizza)

       Pessoal (31%)
      ╱───────────╲
     ╱             ╲
    │   COGS (43%) │  
    │    ╱────╲    │
    ╱───╱      ╲───╲
   │  Outros(19%) │
    ╲              ╱
     ╲      ╱──╲  ╱
      ╲────│Rent│
           │ 4% │
           └────┘
           
GRÁFICO 3: Lucratividade por Categoria de Produto

Categoria      Vendas      Custo    Lucro    Margem
────────────────────────────────────────────────────
Lanches        45.000      18.000   27.000   60%  ▓▓▓▓▓▓▓▓▓▓
Pizzas         85.000      34.000   51.000   60%  ▓▓▓▓▓▓▓▓▓▓
Bebidas        32.000      6.400    25.600   80%  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓
Sobremesas     25.000      12.500   12.500   50%  ▓▓▓▓▓▓▓▓
Complementos   89.100      47.600   41.500   47%  ▓▓▓▓▓▓▓
────────────────────────────────────────────────────
TOTAL          276.100    118.500  157.600   57%
```

---

## 2. FUNCIONALIDADE 2.1: GESTÃO DE DESPESAS

### 2.1.1 Categorias de Despesas

```
Categorias Padrão:

COGS (Custo dos Produtos Vendidos):
├── Insumos diretos (carnes, queijos, etc)
├── Embalagens
└── Outros matérias-primas

PESSOAL:
├── Salários
├── Encargos (INSS, FGTS)
└── Uniformes

OPERACIONAL:
├── Aluguel
├── Água/Luz/Gás
├── Internet/Telefone
├── Limpeza/Manutenção
├── Despesas com software
└── Depreciação equipamentos

VENDAS & MARKETING:
├── Publicidade
├── Promoções/Cupons
├── Delivery (taxas)
└── Outros

FINANCEIRO:
├── Juros
├── Taxas bancárias
├── Seguros
└── Multas

OUTROS:
├── Viagens
├── Eventos
└── Imprevistos
```

### 2.1.2 Fluxo de Criar Despesa

```
┌──────────────────────────────────┐
│ Gerente Clica [Nova Despesa]    │
└────────────┬─────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Abre Formulário de Despesa:           │
│                                       │
│ 1. Categoria:                         │
│    [COGS ▼]                           │
│                                       │
│ 2. Descrição:                         │
│    [Frango para preparo____]         │
│                                       │
│ 3. Valor:                             │
│    R$ [450,00]                        │
│                                       │
│ 4. Data:                              │
│    [23/08/2026]                       │
│                                       │
│ 5. Fornecedor/Referência:             │
│    [Fornecedor XYZ / NF-1234]        │
│                                       │
│ 6. Tipo de Despesa:                   │
│    [○ Fixa] [● Variável]              │
│                                       │
│ 7. Recorrente?                        │
│    [○ Não] [○ Mensal] [○ Semanal]    │
│                                       │
│ 8. Observações:                       │
│    [Promo - 10% de desconto]         │
│                                       │
│ [Cancelar] [Salvar Despesa]           │
│                                       │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Valida:                       │
│ ✓ Categoria existe?                  │
│ ✓ Valor > 0?                         │
│ ✓ Data não no futuro?                │
│ ✓ Se recorrente, frequência?         │
└────────────┬──────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ✅ OK        ❌ Erro
      │             │
      ▼             ▼
 Prossegue    Mostra erro
      │
┌─────┴──────────────────────────────┐
│ Sistema Cria Despesa:              │
│ • ID: DESP-20260823-001234         │
│ • Insere na tabela DESPESAS        │
│ • Se recorrente, agenda próximas   │
│ • Registra quem criou e quando     │
└─────┬──────────────────────────────┘
      │
┌─────┴──────────────────────────────┐
│ Mostra Sucesso:                    │
│ "Despesa criada com sucesso!"      │
│                                    │
│ Despesa #DESP-20260823-001234      │
│ Categoria: COGS                    │
│ Valor: R$ 450,00                   │
│ Data: 23/08/2026                   │
│                                    │
│ [Editar] [Duplicar] [Deletar]      │
│ [Voltar ao Financeiro]             │
│                                    │
└────────────────────────────────────┘
```

### 2.1.3 Tabela de Despesas

```
┌─────────────────────────────────────────────────────────────┐
│ DESPESAS MÊS: AGOSTO/2026                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Data   │ Categoria │ Descrição      │ Valor   │ Ações      │
├─────────────────────────────────────────────────────────────┤
│ 23/08  │ COGS      │ Frango         │ 450,00  │ [E] [D] [X]│
│ 23/08  │ Pessoal   │ Vale Refeição  │ 200,00  │ [E] [D] [X]│
│ 22/08  │ Aluguel   │ Aluguel Agosto │12.000,00│ [E] [D] [X]│
│ 22/08  │ Água      │ Conta Água     │ 350,00  │ [E] [D] [X]│
│ 21/08  │ Marketing │ Instagram Ads  │ 500,00  │ [E] [D] [X]│
│ 20/08  │ COGS      │ Queijo Cheddar │ 800,00  │ [E] [D] [X]│
│                                                             │
│ Legenda: [E]=Editar [D]=Duplicar [X]=Deletar               │
│                                                             │
│ Filtro: [Todos] Cat: [Todas ▼] Data: [08/2026]            │
│ Total Mês: R$ 14.300,00                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. FUNCIONALIDADE 3.1: CONTAS A PAGAR

### 3.1.1 Estrutura de Conta a Pagar

```
Quando despesa é criada, pode-se registrar:
├── Forma de Pagamento (Dinheiro, Débito, Crédito, Boleto, PIX)
├── Parcelamento (1x, 2x, 3x, etc)
├── Data de Vencimento
├── Status (Pendente, Parcialmente Pago, Pago, Vencida)
└── Observações

Exemplo 1: Compra à vista
├── Valor: R$ 450,00
├── Forma: Dinheiro
├── Parcelamento: 1x
├── Status: Paga (imediato)
└── Vencimento: hoje

Exemplo 2: Compra parcelada
├── Valor Total: R$ 1.200,00
├── Forma: Crédito
├── Parcelamento: 3x R$ 400,00
├── 1ª Parcela Vence: 23/09/2026
├── 2ª Parcela Vence: 23/10/2026
├── 3ª Parcela Vence: 23/11/2026
└── Status: Pendente (todas não pagas)

Exemplo 3: Conta recorrente
├── Descrição: Aluguel
├── Valor: R$ 12.000,00
├── Recorrência: Mensal (dia 1º)
├── Próximo Vencimento: 01/09/2026
├── Última Parcela Paga: 01/08/2026
└── Status: Pendente
```

### 3.1.2 Fluxo de Contas a Pagar

```
┌──────────────────────────────────────────┐
│ Gerente Acessa: [Contas a Pagar]        │
└────────────┬─────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│ Sistema Mostra Dashboard de Contas:        │
│                                            │
│ RESUMO:                                    │
│ ┌──────────┬──────────┬─────────────────┐  │
│ │ Pendente │ Vencidas │ Próx 7 dias    │  │
│ │ R$ 8.500 │ R$ 2.100 │ R$ 3.200       │  │
│ │ 12 conts │ 3 conts  │ 5 conts        │  │
│ │ 🟠 ATEN. │ 🔴 CRIT. │ 🟡 AVISO       │  │
│ └──────────┴──────────┴─────────────────┘  │
│                                            │
│ CONTAS VENCIDAS 🔴:                       │
│ ┌──────────────────────────────────────┐  │
│ │ Boleto Fornecedor XYZ                │  │
│ │ Vencimento: 20/08/2026 (3 dias atrás)│ │
│ │ Valor: R$ 1.200,00                   │  │
│ │ Status: NÃO PAGO                     │  │
│ │ [Pagar Agora] [Prorrogar] [Detalhes] │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ CONTAS PRÓXIMO VENCIMENTO 🟡:              │
│ ┌──────────────────────────────────────┐  │
│ │ PIX Fornecedor ABC                   │  │
│ │ Vencimento: 25/08/2026 (2 dias)     │  │
│ │ Valor: R$ 800,00                     │  │
│ │ Status: PENDENTE                     │  │
│ │ [Pagar] [Postergar] [Detalhes]       │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ CONTAS PENDENTES 🟠:                       │
│ ┌──────────────────────────────────────┐  │
│ │ Aluguel - Mês setembro                │ │
│ │ Vencimento: 01/09/2026 (9 dias)     │  │
│ │ Valor: R$ 12.000,00                  │  │
│ │ Status: PENDENTE                     │  │
│ │ [Pagar Antecipado] [Detalhes]        │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [Todas] [Apenas Vencidas] [Próximas 7d]  │
│ Ordenar: [Por Vencimento] [Por Valor]    │
│                                            │
└────────────┬───────────────────────────────┘
             │
┌────────────┴─────────────────────────────┐
│ Gerente Clica "Pagar" em uma Conta      │
└────────────┬─────────────────────────────┘
             │
┌────────────┴───────────────────────────────┐
│ Abre Modal de Pagamento:                  │
│                                           │
│ Conta: Fornecedor XYZ                     │
│ Valor: R$ 1.200,00                        │
│ Vencimento: 20/08/2026 (atrasado)        │
│                                           │
│ Forma de Pagamento:                       │
│ [○ Dinheiro]                              │
│ [○ Débito]                                │
│ [● Transferência PIX]                     │
│ [○ Boleto]                                │
│ [○ Crédito]                               │
│                                           │
│ Data Pagamento: [23/08/2026]              │
│                                           │
│ Observações:                              │
│ [Pagamento com 3 dias de atraso]         │
│                                           │
│ [Cancelar] [Confirmar Pagamento]          │
│                                           │
└────────────┬───────────────────────────────┘
             │
┌────────────┴───────────────────────────────┐
│ Sistema Registra Pagamento:               │
│ • Insere em tabela PAGAMENTOS             │
│ • Status da Conta muda: PAGO              │
│ • Cria movimento no Fluxo de Caixa        │
│ • Registra quem pagou e quando            │
│ • Afeta saldo em conta                    │
│                                           │
│ Notificação:                              │
│ "Pagamento registrado com sucesso"        │
│ Conta: #CONTA-001                         │
│ Valor: R$ 1.200,00                        │
│ Data: 23/08/2026                          │
│                                           │
│ Novo status:                              │
│ ✅ PAGO                                   │
│                                           │
│ [Imprimir Comprovante] [Histórico]        │
│                                           │
└───────────────────────────────────────────┘
```

### 3.1.3 Banco de Dados - Contas

```sql
CREATE TABLE contas_pagar (
  id SERIAL PRIMARY KEY,
  numero_conta VARCHAR(30) NOT NULL UNIQUE,
  -- CONTA-20260823-001
  
  -- Relacionamento
  despesa_id INT,  -- Pode vir de uma despesa ou ser criada direto
  fornecedor_id INT,
  
  -- Valores
  valor_total DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  valor_restante DECIMAL(10,2) NOT NULL,
  
  -- Datas
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  -- pendente, pago, parcialmente_pago, vencida, cancelada
  
  -- Parcelamento
  parcela_numero INT DEFAULT 1,  -- 1 de 3
  total_parcelas INT DEFAULT 1,
  
  -- Forma de Pagamento
  forma_pagamento VARCHAR(20),
  -- dinheiro, debito, credito, boleto, pix
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  criado_por INT,
  pago_por INT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (despesa_id) REFERENCES despesas(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  FOREIGN KEY (pago_por) REFERENCES usuarios(id),
  
  INDEX idx_status(status),
  INDEX idx_vencimento(data_vencimento),
  INDEX idx_fornecedor(fornecedor_id),
  CONSTRAINT status_valido CHECK (
    status IN ('pendente', 'pago', 'parcialmente_pago', 'vencida', 'cancelada')
  )
);

CREATE TABLE pagamentos_conta (
  id SERIAL PRIMARY KEY,
  conta_id INT NOT NULL,
  
  valor_pago DECIMAL(10,2) NOT NULL,
  data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  forma_pagamento VARCHAR(20),
  numero_transacao VARCHAR(100),
  observacoes TEXT,
  
  usuario_id INT NOT NULL,
  
  FOREIGN KEY (conta_id) REFERENCES contas_pagar(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  
  INDEX idx_conta(conta_id),
  INDEX idx_data(data_pagamento)
);
```

---

## 4. FUNCIONALIDADE 4.1: FLUXO DE CAIXA DIÁRIO

### 4.1.1 Conceito

```
Fluxo de Caixa = Saldo anterior + Entradas - Saídas = Saldo Final

EXEMPLO DIA 23/08/2026:

SALDO ANTERIOR (22/08): R$ 5.000,00

ENTRADAS (Receitas do dia):
├── Vendas PDV: R$ 8.500,00
├── Pedidos Online: R$ 1.200,00
└── TOTAL ENTRADAS: R$ 9.700,00

SAÍDAS (Despesas do dia):
├── COGS (Insumos): R$ 3.400,00
├── Pessoal (Vale): R$ 200,00
├── Água: R$ 150,00
├── Pagamento Fornecedor: R$ 1.200,00
└── TOTAL SAÍDAS: R$ 4.950,00

SALDO DO DIA: R$ 9.700,00 - R$ 4.950,00 = R$ 4.750,00

SALDO FINAL (23/08): R$ 5.000,00 + R$ 4.750,00 = R$ 9.750,00
```

### 4.1.2 Dashboard de Fluxo de Caixa

```
┌──────────────────────────────────────────────────────────┐
│ 💵 FLUXO DE CAIXA - Data: [23/08/2026]                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ SALDO INICIAL (Abertura de Caixa):   R$ 5.000,00       │
│                                                          │
│ ═════════════════════════════════════════════════════    │
│ ENTRADAS (Receitas do Dia):                             │
│                                                          │
│ Origem                  Tipo         Valor     Hora     │
│ ────────────────────────────────────────────────────    │
│ Vendas PDV             Dinheiro    R$ 4.200  14:30     │
│ Vendas PDV             Débito      R$ 2.100  14:35     │
│ Vendas PDV             Crédito     R$ 1.800  14:40     │
│ Vendas PDV             PIX         R$ 400    14:50     │
│ Pedidos Online         PIX         R$ 800    15:00     │
│ Outros                 Manual      R$ 400    16:00     │
│                                                          │
│ TOTAL ENTRADAS:                     R$ 9.700,00       │
│                                                          │
│ ═════════════════════════════════════════════════════    │
│ SAÍDAS (Despesas do Dia):                               │
│                                                          │
│ Descrição              Categoria    Valor     Hora     │
│ ────────────────────────────────────────────────────    │
│ Frango                 COGS       R$ 450    11:30     │
│ Queijo                 COGS       R$ 1.200  12:00     │
│ Farinha                COGS       R$ 300    13:00     │
│ Vale Refeição          Pessoal    R$ 200    13:30     │
│ Conta Água             Operacional R$ 150   14:00     │
│ Pagto Fornecedor       Débito     R$ 1.200  15:00     │
│ Internet               Operacional R$ 100   16:00     │
│                                                          │
│ TOTAL SAÍDAS:                       R$ 4.950,00       │
│                                                          │
│ ═════════════════════════════════════════════════════    │
│                                                          │
│ RESULTADO DO DIA: +R$ 4.750,00 ✅                      │
│                                                          │
│ ═════════════════════════════════════════════════════    │
│                                                          │
│ SALDO FINAL (Fechamento de Caixa): R$ 9.750,00        │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Fechamento de Caixa] [Exportar] [Imprimir]      │  │
│ │ [Dia Anterior] [Próximo Dia] [Período Customizado]│  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.1.3 Relatório de Fluxo Mensal

```
╔════════════════════════════════════════════════════════════╗
║ FLUXO DE CAIXA - AGOSTO/2026                             ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ Dia | Inicial  | Entradas | Saídas  | Resultado | Final  ║
║─────┼──────────┼──────────┼─────────┼───────────┼────────║
║ 01  │ 2.000    │ 9.200    │ 4.500   │ +4.700    │ 6.700  ║
║ 02  │ 6.700    │ 8.900    │ 5.100   │ +3.800    │ 10.500 ║
║ 03  │ 10.500   │ 10.100   │ 4.800   │ +5.300    │ 15.800 ║
║ 04  │ 15.800   │ 7.500    │ 3.900   │ +3.600    │ 19.400 ║
║ 05  │ 19.400   │ 11.200   │ 5.200   │ +6.000    │ 25.400 ║
║ 06  │ 25.400   │ 9.800    │ 4.600   │ +5.200    │ 30.600 ║
║ 07  │ 30.600   │ 12.100   │ 6.800   │ +5.300    │ 35.900 ║
║ 08  │ 35.900   │ 8.200    │ 4.100   │ +4.100    │ 40.000 ║
║ 09  │ 40.000   │ 10.500   │ 5.300   │ +5.200    │ 45.200 ║
║ 10  │ 45.200   │ 11.800   │ 12.800  │ -1.000    │ 44.200 ║
║ ..  │ ...      │ ...      │ ...     │ ...       │ ...    ║
║ 30  │ 45.300   │ 9.600    │ 5.400   │ +4.200    │ 49.500 ║
║ 31  │ 49.500   │ 8.900    │ 4.700   │ +4.200    │ 53.700 ║
║─────┴──────────┴──────────┴─────────┴───────────┴────────║
║                                                            ║
║ TOTAL MÊS:                                                ║
║ Saldo Inicial (01/08):              R$ 2.000,00          ║
║ Total Entradas:                     R$ 276.100,00        ║
║ Total Saídas:                       R$ 224.400,00        ║
║ Resultado Mês:                      R$ 51.700,00 ✅      ║
║ Saldo Final (31/08):                R$ 53.700,00         ║
║                                                            ║
║ Dia Melhor:  02/08 (+R$ 8.900)                           ║
║ Dia Pior:    15/08 (-R$ 1.200)                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 5. FUNCIONALIDADE 5.1: ABERTURA E FECHAMENTO DE CAIXA

### 5.1.1 Abertura de Caixa

```
Diariamente, operador abre o caixa:

┌─────────────────────────────────────┐
│ Operador Clica [Abrir Caixa]       │
└────────────┬────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Modal de Abertura:                   │
│                                      │
│ Operador: João Silva                 │
│ Data: 23/08/2026                     │
│ Hora: 11:00                          │
│ Caixa: #01                           │
│                                      │
│ Saldo Anterior (Fechamento):         │
│ R$ 5.000,00                          │
│                                      │
│ Saldo Inicial Hoje:                  │
│ R$ [5.000,00] (pré-preenchido)      │
│                                      │
│ Ou adicione/retire:                  │
│ [+ Adicionar] [− Retirar]            │
│                                      │
│ Observações:                         │
│ [Entregue por gerente________]      │
│                                      │
│ [Cancelar] [Abrir Caixa]             │
│                                      │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Valida:                      │
│ ✓ Caixa não está aberto?             │
│ ✓ Operador existe?                   │
│ ✓ Saldo > 0?                         │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Abre o Caixa:                │
│ • ID Abertura: ABER-20260823-001     │
│ • Registra data/hora/operador        │
│ • Define saldo inicial: R$ 5.000     │
│ • Status: ABERTO                     │
│ • Pronto para vendas                 │
│                                      │
│ Toast: "Caixa aberto com sucesso!"   │
│ "Saldo Inicial: R$ 5.000,00"        │
│                                      │
└──────────────────────────────────────┘
```

### 5.1.2 Fechamento de Caixa

```
Fim do dia, operador fecha o caixa:

┌──────────────────────────────────────┐
│ Operador Clica [Fechar Caixa]       │
└────────────┬─────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Modal de Fechamento:                 │
│                                      │
│ Caixa: #01                           │
│ Data: 23/08/2026                     │
│ Hora Abertura: 11:00                 │
│ Hora Fechamento: 22:00               │
│ Duração: 11 horas                    │
│                                      │
│ SISTEMA DIZ:                         │
│ Saldo Inicial:      R$ 5.000,00     │
│ Total Vendas PDV:   R$ 8.500,00     │
│ Total Pedidos Online: R$ 1.200,00   │
│ Total Saídas:       R$ 4.950,00     │
│ ────────────────────────────────────│
│ Saldo Esperado:     R$ 9.750,00     │
│                                      │
│ OPERADOR CONFIRMA:                   │
│ Saldo Real no Caixa:                 │
│ [R$ 9.750,00] (pré-preenchido)      │
│                                      │
│ OU edita se houver diferença:        │
│ [R$ 9.750,00] ← operador pode mudar │
│                                      │
│ Se diferentes:                       │
│ ⚠️ DIFERENÇA DETECTADA               │
│ Esperado:    R$ 9.750,00             │
│ Real:        R$ 9.700,00             │
│ Diferença:   -R$ 50,00 ⚠️            │
│                                      │
│ Motivo da Diferença:                 │
│ [○ Erro de operação]                 │
│ [○ Não registrado]                   │
│ [○ Trocado/Roubado]                  │
│ [○ Outro]                            │
│                                      │
│ Observações:                         │
│ [Suspeitam de erro no PDV____]      │
│                                      │
│ [Cancelar] [Finalizar Fechamento]    │
│                                      │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Valida e Registra:           │
│ • ID Fechamento: FECH-20260823-001   │
│ • Saldo Esperado vs Real              │
│ • Se diferença > 0: Registra como    │
│   movimento especial (investigar)     │
│ • Gera relatório de movimentações    │
│ • Caixa muda status: FECHADO         │
│ • Bloqueia novas transações neste    │
│   caixa até próxima abertura         │
│                                      │
│ Toast: "Caixa fechado com sucesso!"  │
│                                      │
│ Resumo do Dia:                       │
│ ✅ Saldo Inicial: R$ 5.000,00       │
│ ✅ Vendas: R$ 9.700,00              │
│ ✅ Despesas: R$ 4.950,00             │
│ ✅ Saldo Final: R$ 9.750,00         │
│ ✅ Diferença: R$ 0,00 (Perfeito!)   │
│                                      │
│ [Ver Relatório Completo] [Imprimir]  │
│                                      │
└──────────────────────────────────────┘
```

---

## 6. BANCO DE DADOS

### 6.1 Tabela DESPESAS

```sql
CREATE TABLE despesas (
  id SERIAL PRIMARY KEY,
  numero_despesa VARCHAR(30) NOT NULL UNIQUE,
  -- DESP-20260823-001
  
  -- Classificação
  categoria_id INT NOT NULL,
  subcategoria VARCHAR(100),
  
  -- Descrição e Valor
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  
  -- Data
  data_despesa DATE NOT NULL,
  data_vencimento DATE,
  
  -- Referência
  fornecedor_id INT,
  numero_nf VARCHAR(50),  -- Nota Fiscal
  
  -- Tipo
  tipo VARCHAR(20) NOT NULL,  -- FIXA, VARIAVEL
  recorrente BOOLEAN DEFAULT FALSE,
  frequencia_recorrencia VARCHAR(20),  -- MENSAL, SEMANAL
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  criado_por INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (categoria_id) REFERENCES categorias_despesa(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  
  INDEX idx_categoria(categoria_id),
  INDEX idx_data(data_despesa),
  INDEX idx_fornecedor(fornecedor_id)
);
```

### 6.2 Tabela FLUXO_CAIXA

```sql
CREATE TABLE fluxo_caixa (
  id SERIAL PRIMARY KEY,
  data_fluxo DATE NOT NULL,
  
  -- Saldos
  saldo_anterior DECIMAL(12,2) NOT NULL,
  total_entradas DECIMAL(12,2) DEFAULT 0,
  total_saidas DECIMAL(12,2) DEFAULT 0,
  saldo_final DECIMAL(12,2) NOT NULL,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_data(data_fluxo),
  UNIQUE (data_fluxo)
);
```

### 6.3 Tabela ABERTURA_FECHAMENTO_CAIXA

```sql
CREATE TABLE abertura_fechamento_caixa (
  id SERIAL PRIMARY KEY,
  numero_movimento VARCHAR(30) NOT NULL UNIQUE,
  -- ABER-20260823-001 ou FECH-20260823-001
  
  -- Tipo
  tipo VARCHAR(20) NOT NULL,  -- ABERTURA, FECHAMENTO
  
  -- Caixa
  caixa_id INT NOT NULL,
  operador_id INT NOT NULL,
  
  -- Valores
  saldo_inicial DECIMAL(12,2),
  saldo_esperado DECIMAL(12,2),
  saldo_real DECIMAL(12,2),
  diferenca DECIMAL(12,2),
  
  -- Data/Hora
  data_hora TIMESTAMP NOT NULL,
  
  -- Observações
  observacoes TEXT,
  motivo_diferenca VARCHAR(100),
  
  -- Status
  status VARCHAR(20),  -- ABERTO, FECHADO, COM_DIFERENCA
  
  FOREIGN KEY (operador_id) REFERENCES usuarios(id),
  
  INDEX idx_data(data_hora),
  INDEX idx_tipo(tipo),
  INDEX idx_caixa(caixa_id)
);
```

---

## 7. API REST - ENDPOINTS

**Base URL:** `http://localhost:3000/api/financeiro`

#### **GET /api/financeiro/dashboard**
Dashboard financeiro com KPIs
```
Query Params:
  - periodo: 'dia' | 'mes' | 'ano' (padrão: 'mes')
  - data_inicio: date (padrão: 1º do mês)
  - data_fim: date (padrão: hoje)

Response:
{
  "sucesso": true,
  "dados": {
    "periodo": "ago/2026",
    "kpis": {
      "faturamento": 276100.00,
      "custos": 224400.00,
      "lucro_liquido": 51700.00,
      "margem_lucro": 18.73,
      "ticket_medio": 75.50,
      "pedidos_totais": 3663
    },
    "composicao_receitas": {
      "vendas_pdv": 234500.00,
      "pedidos_online": 38200.00,
      "outros": 3400.00
    },
    "composicao_despesas": {
      "cogs": 118500.00,
      "pessoal": 85200.00,
      "aluguel": 12000.00,
      "agua_luz_gas": 5800.00,
      "marketing": 3500.00,
      "outros": 51000.00
    }
  }
}
```

#### **GET /api/financeiro/contas-pagar**
Listar contas a pagar
```
Query Params:
  - status: 'todas' | 'pendente' | 'vencida'
  - ordenar: 'vencimento' | 'valor'

Response:
{
  "sucesso": true,
  "dados": {
    "resumo": {
      "pendentes": { "total": 8500.00, "contas": 12 },
      "vencidas": { "total": 2100.00, "contas": 3 },
      "proximos_7_dias": { "total": 3200.00, "contas": 5 }
    },
    "contas": [
      {
        "id": 1,
        "numero": "CONTA-001",
        "valor": 1200.00,
        "vencimento": "2026-08-20",
        "status": "vencida",
        "fornecedor": "Fornecedor XYZ"
      }
    ]
  }
}
```

#### **POST /api/financeiro/despesas**
Criar nova despesa
```
Body:
{
  "categoria_id": 1,
  "descricao": "Frango para preparo",
  "valor": 450.00,
  "data_despesa": "2026-08-23",
  "fornecedor_id": 5,
  "tipo": "VARIAVEL",
  "recorrente": false
}

Response:
{
  "sucesso": true,
  "dados": {
    "id": 54321,
    "numero_despesa": "DESP-20260823-001234",
    "valor": 450.00
  }
}
```

#### **GET /api/financeiro/fluxo-caixa**
Obter fluxo de caixa
```
Query Params:
  - data: date (padrão: hoje)
  - periodo: 'dia' | 'mes' | 'ano'

Response:
{
  "sucesso": true,
  "dados": {
    "data": "2026-08-23",
    "saldo_inicial": 5000.00,
    "total_entradas": 9700.00,
    "total_saidas": 4950.00,
    "saldo_final": 9750.00,
    "resultado_dia": 4750.00
  }
}
```

#### **POST /api/financeiro/abertura-caixa**
Abrir caixa
```
Body:
{
  "caixa_id": 1,
  "operador_id": 5,
  "saldo_inicial": 5000.00,
  "observacoes": "Entregue por gerente"
}

Response:
{
  "sucesso": true,
  "dados": {
    "numero": "ABER-20260823-001",
    "status": "ABERTO"
  }
}
```

#### **POST /api/financeiro/fechamento-caixa**
Fechar caixa
```
Body:
{
  "abertura_id": 123,
  "saldo_real": 9750.00,
  "observacoes": "Tudo confere"
}

Response:
{
  "sucesso": true,
  "dados": {
    "numero": "FECH-20260823-001",
    "saldo_esperado": 9750.00,
    "saldo_real": 9750.00,
    "diferenca": 0,
    "status": "OK"
  }
}
```

---

## 8. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/financeiro/
│
├── pages/
│   ├── DashboardFinanceiroPage.jsx   # KPIs principais
│   ├── DespesasPage.jsx              # Gestão despesas
│   ├── ContasApagarPage.jsx          # Contas a pagar
│   ├── FluxoCaixaPage.jsx            # Fluxo diário/mensal
│   ├── AberturaCaixaPage.jsx         # Abertura
│   ├── FechamentoCaixaPage.jsx       # Fechamento
│   └── RelatorioFinanceiroPage.jsx   # Relatórios P&L
│
├── components/
│   ├── Dashboard/
│   │   ├── CardKPI.jsx
│   │   ├── GraficoReceitaVsDispesa.jsx
│   │   ├── GraficoComposicaoDespesa.jsx
│   │   └── GraficoLucratividade.jsx
│   │
│   ├── Despesas/
│   │   ├── FormularioDespesa.jsx
│   │   ├── TabelaDespesas.jsx
│   │   ├── FiltrosDespesas.jsx
│   │   └── ModalEditarDespesa.jsx
│   │
│   ├── ContasAPagar/
│   │   ├── ResumoContas.jsx
│   │   ├── TabelaContas.jsx
│   │   ├── CardAlertaVencimento.jsx
│   │   ├── ModalPagamento.jsx
│   │   └── BotaoProrrogar.jsx
│   │
│   ├── FluxoCaixa/
│   │   ├── ResumoFluxodia.jsx
│   │   ├── TabelaFluxoMensal.jsx
│   │   ├── GraficoSaldoDia.jsx
│   │   └── ExportarFluxo.jsx
│   │
│   ├── AberturaBaixa/
│   │   ├── ModalAberturaCaixa.jsx
│   │   ├── ModalFechamentoCaixa.jsx
│   │   ├── CardAlertaDiferenca.jsx
│   │   └── TabelaOperacoesCaixa.jsx
│   │
│   └── Relatorios/
│       ├── RelatorioP&L.jsx
│       ├── GraficoSeries.jsx
│       └── BotaoExportar.jsx
│
├── hooks/
│   ├── useDashboardFinanceiro.js
│   ├── useDespesas.js
│   ├── useContasAPagar.js
│   ├── useFluxoCaixa.js
│   └── useAberturaCaixa.js
│
├── services/
│   ├── financeiroService.js
│   ├── despesasService.js
│   ├── contasService.js
│   └── fluxoService.js
│
├── utils/
│   ├── formatacaoMonetaria.js
│   ├── calculoMargem.js
│   ├── validacoes.js
│   └── exportacao.js
│
├── styles/
│   ├── financeiro.css
│   ├── dashboard.css
│   ├── formularios.css
│   └── graficos.css
│
└── constants/
    ├── categoriasDepesa.js
    ├── statusContas.js
    └── periodos.js
```

---

## 9. CASOS DE USO DETALHADOS

### Caso de Uso 1: Criar Despesa Semanal

**Ator:** Gerente
**Tempo:** ~2 minutos

**Fluxo:**
1. Gerente vai para Financeiro > [Nova Despesa]
2. Categoria: "COGS"
3. Descrição: "Frango para próxima semana"
4. Valor: R$ 450,00
5. Data: 23/08/2026
6. Fornecedor: "Fornecedor XYZ"
7. Tipo: "VARIÁVEL"
8. Recorrente: Não
9. Clica "Salvar"
10. Sistema valida
11. Cria: DESP-20260823-001234
12. Estoque é atualizado automaticamente (se integrado)
13. Toast: "Despesa criada!"

**Resultado:** Despesa registrada, rastreável por categoria.

---

### Caso de Uso 2: Pagar Conta Vencida

**Ator:** Financeiro
**Tempo:** ~3 minutos

**Fluxo:**
1. Financeiro acessa Contas a Pagar
2. Vê: "Fornecedor XYZ - Vencida 3 dias - R$ 1.200"
3. Clica [Pagar]
4. Modal abre
5. Valor: R$ 1.200,00
6. Forma: "Transferência PIX"
7. Data: 23/08/2026
8. Obs: "Pagamento com atraso"
9. Clica "Confirmar"
10. Sistema registra pagamento
11. Cria movimento em Fluxo de Caixa (saída)
12. Status da Conta muda: PAGO
13. Toast: "Pagamento registrado"

**Resultado:** Conta quitada, histórico mantido, fluxo atualizado.

---

### Caso de Uso 3: Fechar Caixa com Diferença

**Ator:** Operador/Gerente
**Tempo:** ~5 minutos

**Fluxo:**
1. Fim do dia (22:00)
2. Operador vai para [Fechar Caixa]
3. Sistema mostra:
   - Saldo Esperado: R$ 9.750,00
4. Operador conta dinheiro
5. Encontra: R$ 9.700,00
6. Insere no formulário: R$ 9.700,00
7. Sistema detecta diferença: -R$ 50,00
8. Alerta: ⚠️ DIFERENÇA DETECTADA
9. Operador seleciona motivo: "Trocado"
10. Clica "Finalizar"
11. Sistema registra:
    - Fechamento: FECH-20260823-001
    - Diferença: -R$ 50,00
    - Motivo: Trocado
12. Gerente recebe notificação
13. Admin pode investigar depois
14. Caixa fecha com status: COM_DIFERENCA

**Resultado:** Diferença documentada, investigação possível, caixa fechado.

---

## 10. MOCKUPS

### Tela 1: Dashboard Financeiro

```
┌──────────────────────────────────────────────────┐
│ 💰 FINANCEIRO - AGOSTO/2026                     │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────┬──────────┬────────────────────────┐│
│ │FATURAMENTO│ CUSTOS   │ LUCRO LÍQUIDO         ││
│ │R$ 15.850  │R$ 8.420  │ R$ 7.430 (47%)        ││
│ │↑12% mês   │↑5% mês   │ ↑18% mês              ││
│ └──────────┴──────────┴────────────────────────┘│
│                                                  │
│ RECEITAS vs DESPESAS                            │
│ ┌────────────────────────────────────────────┐  │
│ │                                            │  │
│ │  R$ │ R$ R$    R$    R$                   │  │
│ │     │ ╱╲  ╱╲  ╱╲   ╱╲                    │  │
│ │ 40k │╱  ╲╱  ╲╱  ╲╱  ╲                   │  │
│ │     │                                    │  │
│ │ 30k │                                    │  │
│ │     │                                    │  │
│ │ 20k │                                    │  │
│ │     │                                    │  │
│ │ 10k │                                    │  │
│ │     │                                    │  │
│ │  0  │____|____|____|____|____           │  │
│ │     D5   D10  D15  D20  D25              │  │
│ │                                          │  │
│ │ —— Receitas   —— Despesas               │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ COMPOSIÇÃO DE DESPESAS                         │
│ COGS: R$ 118.5k (43%)                          │
│ Pessoal: R$ 85.2k (31%)                        │
│ Aluguel: R$ 12k (4%)                           │
│ Água/Luz: R$ 5.8k (2%)                         │
│ Outros: R$ 54.5k (20%)                         │
│                                                  │
│ [Detalhes] [Despesas] [Contas a Pagar]         │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Tela 2: Contas a Pagar

```
┌────────────────────────────────────────────────┐
│ 📋 CONTAS A PAGAR                             │
├────────────────────────────────────────────────┤
│                                                │
│ RESUMO:                                        │
│ ┌────────┬────────┬─────────────────────────┐ │
│ │Pendente│Vencidas│ Próx 7 dias            │ │
│ │R$ 8.5k │R$ 2.1k │ R$ 3.2k                │ │
│ │ 12 ctas│ 3 ctas │ 5 ctas                 │ │
│ └────────┴────────┴─────────────────────────┘ │
│                                                │
│ VENCIDAS 🔴:                                  │
│ ┌────────────────────────────────────────────┐│
│ │Fornecedor XYZ         R$ 1.200,00         ││
│ │Venc: 20/08 (3 dias)   Status: NÃO PAGO   ││
│ │[Pagar Agora] [Prorrogar] [Detalhes]      ││
│ └────────────────────────────────────────────┘│
│                                                │
│ PRÓXIMO VENCIMENTO 🟡:                         │
│ ┌────────────────────────────────────────────┐│
│ │Fornecedor ABC         R$ 800,00           ││
│ │Venc: 25/08 (2 dias)   Status: PENDENTE    ││
│ │[Pagar] [Postergar] [Detalhes]             ││
│ └────────────────────────────────────────────┘│
│                                                │
│ PENDENTES 🟠:                                  │
│ ┌────────────────────────────────────────────┐│
│ │Aluguel Setembro       R$ 12.000,00        ││
│ │Venc: 01/09 (9 dias)   Status: PENDENTE    ││
│ │[Pagar Antecipado] [Detalhes]              ││
│ └────────────────────────────────────────────┘│
│                                                │
│ [Todas] [Vencidas] [Próximas 7d] [Pendentes] │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 11. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup + Dashboard (1-2 semanas)
- [ ] BD: tabelas despesas, contas_pagar, fluxo_caixa
- [ ] API: GET dashboard, GET despesas
- [ ] Frontend: Dashboard com KPIs
- [ ] Gráficos básicos
- [ ] Testes

### Sprint 2: Gestão de Despesas (1-2 semanas)
- [ ] CRUD de despesas
- [ ] Categorias de despesa
- [ ] Filtros e busca
- [ ] Edição e deleção
- [ ] Testes

### Sprint 3: Contas a Pagar (1-2 semanas)
- [ ] CRUD de contas
- [ ] Registrar pagamentos
- [ ] Prorrogação
- [ ] Alertas de vencimento
- [ ] Testes

### Sprint 4: Fluxo de Caixa (1-2 semanas)
- [ ] Cálculo automático
- [ ] Relatório diário/mensal
- [ ] Integração com vendas
- [ ] Integração com despesas
- [ ] Testes

### Sprint 5: Abertura/Fechamento (1 semana)
- [ ] Modal abertura
- [ ] Modal fechamento
- [ ] Detecção diferença
- [ ] Relatório movimento
- [ ] Testes

### Sprint 6: Relatórios (1-2 semanas)
- [ ] Relatório P&L
- [ ] DRE (Demonstração Resultado)
- [ ] Análise de lucratividade
- [ ] Exportação (PDF, Excel)
- [ ] Testes

### Sprint 7: Polish + Integrações (1-2 semanas)
- [ ] Integração PDV-Financeiro (vendas automáticas)
- [ ] Integração Estoque-Financeiro (COGS)
- [ ] Notificações de alertas
- [ ] Performance otimizations
- [ ] Testes

### Sprint 8: Deploy (1 semana)
- [ ] Testes E2E
- [ ] Staging
- [ ] Produção
- [ ] Treinamento usuários

---

## 12. CHECKLIST PRÉ-DESENVOLVIMENTO

- [ ] Requisitos financeiros finalizados
- [ ] Categorias de despesa definidas
- [ ] Plano de contas estruturado
- [ ] Impostos/Tributos configurados (futura integração)
- [ ] Banco de dados aprovado
- [ ] Integração PDV-Financeiro definida
- [ ] Formato de exportação definido
- [ ] Relatórios fiscais requeridos mapeados
- [ ] Ambiente dev setup
- [ ] Auditoria requisitos (compliance)
- [ ] Backup/recovery plan

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento

**Próximos Módulos:**
- Módulo 2.6: Análises e Relatórios Avançados
- Módulo 3: Autenticação e Perfis de Usuário
- Módulo 4: Configurações do Sistema
