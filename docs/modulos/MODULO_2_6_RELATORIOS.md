# MÓDULO 2.6: ANÁLISES E RELATÓRIOS AVANÇADOS

## 📋 Sumário Executivo

**Objetivo:** Gerar relatórios completos, dashboards customizáveis e análises profundas para tomada de decisão estratégica. Visualizar dados de vendas, estoque, financeiro e operacional em múltiplos formatos.

**Funcionalidades Principais:**
- ✅ Dashboard executivo customizável
- ✅ Relatórios financeiros (P&L, DRE, Fluxo)
- ✅ Análises de vendas por período/categoria/produto
- ✅ Análises de lucratividade e margem
- ✅ Comparações período vs período (YoY, MoM)
- ✅ Análises de comportamento (cliente, horário, dia)
- ✅ Exportação (PDF, Excel, CSV)
- ✅ Agendamento de relatórios por email
- ✅ Gráficos avançados interativos
- ✅ Forecasting/Previsão (básico)

**Perfis de Acesso:**
- Operador (visualizar vendas do dia)
- Gerente (relatórios mensais, comparações)
- Admin/Diretor (acesso total, análises estratégicas)

**Periodicidade:** Diária, Semanal, Mensal, Trimestral, Anual, Customizado

---

## 1. FUNCIONALIDADE 1.1: DASHBOARD EXECUTIVO CUSTOMIZÁVEL

### 1.1.1 Layout do Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD EXECUTIVO - AGOSTO/2026                       │
│                                                             │
│ [Filtro Período: Ago/2026 ▼] [Comparar com: Jul/2026 ▼]  │
│ [Atualizar] [Salvar Layout] [Exportar Imagem]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│ │ FATURAMENTO │ LUCRO LÍQDO │ TICKET MÉD  │ PEDIDOS HOJE │ │
│ │ R$ 276.1k   │ R$ 51.7k    │ R$ 75,50    │ 3.663 ped.   │ │
│ │ ↑ 12% vs mês│ ↑ 18% vs mês│ ↓ 2% vs mês │ ↑ 8% vs mês  │ │
│ └─────────────┴─────────────┴─────────────┴──────────────┘ │
│                                                             │
│ ╔════════════════════════╦════════════════════════╗        │
│ ║ RECEITAS x DESPESAS    ║ TOP 5 PRODUTOS        ║        │
│ ║ (Últimos 30 dias)      ║ (Por Faturamento)     ║        │
│ ║                        ║                        ║        │
│ ║      R$                ║ 1. Pizzas: R$ 85k     ║        │
│ ║ 40k  |    ╱╲           ║ 2. Lanches: R$ 45k    ║        │
│ ║      |   ╱  ╲  ╱╲      ║ 3. Complementos: R$89k║        │
│ ║ 30k  |  ╱    ╲╱  ╲     ║ 4. Bebidas: R$ 32k    ║        │
│ ║      | ╱            ╲  ║ 5. Sobremesas: R$ 25k ║        │
│ ║ 20k  |╱               ╲║                        ║        │
│ ║      |_________________║                        ║        │
│ ║ —— Receitas — Despesas ║                        ║        │
│ ╠════════════════════════╬════════════════════════╣        │
│ ║ LUCRATIVIDADE POR CAT. ║ DIAS MELHOR/PIOR      ║        │
│ ║                        ║                        ║        │
│ ║ Bebidas:      80%  ▓▓▓ ║ 📈 Melhor: 02/08      ║        │
│ ║ Pizzas:       60%  ▓▓  ║    R$ 8.900           ║        │
│ ║ Lanches:      60%  ▓▓  ║                        ║        │
│ ║ Complementos: 47%  ▓   ║ 📉 Pior: 15/08        ║        │
│ ║ Sobremesas:   50%  ▓   ║    R$ 6.200           ║        │
│ ╚════════════════════════╩════════════════════════╝        │
│                                                             │
│ ÚLTIMOS 7 DIAS (Tendência):                               │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Dia │ Receita  │ Despesa │ Lucro  │ Margem │ Pedidos │ │
│ │─────┼──────────┼─────────┼────────┼────────┼─────────│ │
│ │ 17  │ 8.200    │ 4.100   │ 4.100  │ 50%    │ 108     │ │
│ │ 18  │ 8.900    │ 3.900   │ 5.000  │ 56%    │ 118     │ │
│ │ 19  │ 7.500    │ 4.600   │ 2.900  │ 39%    │ 99      │ │
│ │ 20  │ 9.800    │ 5.200   │ 4.600  │ 47%    │ 130     │ │
│ │ 21  │ 10.100   │ 5.300   │ 4.800  │ 48%    │ 134     │ │
│ │ 22  │ 8.500    │ 4.950   │ 3.550  │ 42%    │ 112     │ │
│ │ 23  │ 9.700    │ 4.950   │ 4.750  │ 49%    │ 128     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Relatório Completo] [Exportar Excel] [Agendar Email]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.1.2 Personalização de Dashboard

```
Gerente/Admin pode customizar dashboard:

Widgets Disponíveis:
├── KPIs (Faturamento, Lucro, Ticket)
├── Gráfico Linha (Receitas vs Despesas)
├── Gráfico Pizza (Composição)
├── Top Produtos
├── Lucratividade por Categoria
├── Últimos 7/30 dias
├── Heatmap (melhor/pior hora)
├── Comparação período
└── Alertas Críticos

Cada Widget pode:
├── Ser movido (drag & drop)
├── Ser redimensionado
├── Ser removido
├── Ter seus filtros alterados
└── Ser duplicado

Exemplo de Filtro em Widget:

┌───────────────────────────────┐
│ Top Produtos                  │
├───────────────────────────────┤
│ Período: [Agosto ▼]           │
│ Top: [5 produtos ▼]           │
│ Ordenar: [Faturamento ▼]      │
│ Incluir: [Todos ▼]            │
│ [Aplicar Filtro]              │
└───────────────────────────────┘

Sistema salva layout personalizado por usuário.
```

---

## 2. FUNCIONALIDADE 2.1: RELATÓRIOS FINANCEIROS

### 2.1.1 Relatório P&L (Profit & Loss)

**Fórmula:**

```
RECEITAS:
├── Vendas PDV                          R$ 234.500,00
├── Pedidos Online                      R$  38.200,00
└── TOTAL RECEITAS                      R$ 272.700,00

CUSTOS VARIÁVEIS (COGS):
├── Insumos Diretos                     R$ 118.500,00
├── Embalagens                          R$   4.200,00
└── TOTAL COGS (43,5%)                  R$ 122.700,00

LUCRO BRUTO:                            R$ 150.000,00 (55%)

DESPESAS OPERACIONAIS:
├── Pessoal (Salários)                  R$  85.200,00
├── Aluguel                             R$  12.000,00
├── Água/Luz/Gás                        R$   5.800,00
├── Manutenção/Limpeza                  R$   3.200,00
├── Marketing                           R$   3.500,00
├── Software/Sistema                    R$   2.100,00
└── TOTAL DESPESAS OPERACIONAIS         R$ 111.800,00

LUCRO OPERACIONAL:                      R$  38.200,00 (14%)

DESPESAS FINANCEIRAS:
├── Juros                               R$   1.200,00
├── Taxas Bancárias                     R$     800,00
└── TOTAL DESPESAS FINANCEIRAS          R$   2.000,00

LUCRO ANTES DE IMPOSTOS:                R$  36.200,00 (13%)

IMPOSTOS (Estimado 15%):                R$   5.430,00

LUCRO LÍQUIDO:                          R$  30.770,00 (11%)
```

**Visual do Relatório:**

```
┌─────────────────────────────────────────────────────┐
│ DEMONSTRAÇÃO DE RESULTADO DO EXERCÍCIO (P&L)      │
│ PERÍODO: AGOSTO/2026                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ RECEITAS OPERACIONAIS                             │
│ Vendas PDV                      234.500,00   86%  │
│ Pedidos Online                   38.200,00   14%  │
│ ─────────────────────────────────────────────────  │
│ RECEITA TOTAL                  272.700,00   100%  │
│                                                     │
│ CUSTOS DOS PRODUTOS VENDIDOS                      │
│ Insumos Diretos                118.500,00         │
│ Embalagens                       4.200,00         │
│ ─────────────────────────────────────────────────  │
│ COGS TOTAL                     122.700,00  (45%)   │
│                                                     │
│ LUCRO BRUTO                    150.000,00   55%    │
│                                                     │
│ DESPESAS OPERACIONAIS                             │
│ Pessoal                          85.200,00         │
│ Aluguel                          12.000,00         │
│ Água/Luz/Gás                      5.800,00         │
│ Manutenção                        3.200,00         │
│ Marketing                         3.500,00         │
│ Software                          2.100,00         │
│ ─────────────────────────────────────────────────  │
│ DESPESAS OPERACIONAIS          111.800,00  (41%)   │
│                                                     │
│ LUCRO OPERACIONAL               38.200,00   14%    │
│                                                     │
│ DESPESAS FINANCEIRAS                              │
│ Juros e Taxas                    2.000,00         │
│ ─────────────────────────────────────────────────  │
│ LUCRO ANTES DE IMPOSTOS         36.200,00   13%    │
│                                                     │
│ IMPOSTOS (15%)                   5.430,00         │
│ ─────────────────────────────────────────────────  │
│ LUCRO LÍQUIDO                   30.770,00   11%    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.1.2 Relatório DRE (Demonstração do Resultado do Exercício)

Similar ao P&L, mas com foco em estrutura contábil brasileira, incluindo:
- Receita Operacional Bruta
- Deduções (Devoluções, Abatimentos)
- Receita Operacional Líquida
- CPV (Custo de Produtos Vendidos)
- Lucro Bruto
- Despesas de Operacional
- Resultado Operacional
- Outras Receitas/Despesas
- Resultado Antes do IR/CS
- IR/CS
- Lucro Líquido

---

## 3. FUNCIONALIDADE 3.1: ANÁLISES DE VENDAS

### 3.1.1 Análise por Período (Comparação)

```
┌───────────────────────────────────────────────────────────┐
│ ANÁLISE COMPARATIVA: AGOSTO vs JULHO/2026               │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ MÉTRICA              │ AGOSTO   │ JULHO   │ VARIAÇÃO    │
│──────────────────────┼──────────┼─────────┼─────────────│
│ Faturamento          │276.100   │246.500  │ ↑ 12,0% ✅  │
│ Nº de Pedidos        │ 3.663    │ 3.361   │ ↑ 9,0% ✅   │
│ Ticket Médio         │   75,30  │   73,40 │ ↑ 2,6% ✅   │
│ Receita PDV          │234.500   │209.200  │ ↑ 12,1% ✅  │
│ Receita Online       │ 38.200   │ 35.600  │ ↑ 7,3% ✅   │
│ Custos Totais        │224.400   │201.200  │ ↑ 11,5% →   │
│ COGS                 │122.700   │109.800  │ ↑ 11,7% →   │
│ Despesas Operac.     │111.800   │ 99.800  │ ↑ 12,0% →   │
│ Lucro Líquido        │ 51.700   │ 45.300  │ ↑ 14,1% ✅  │
│ Margem Lucro         │  18,7%   │  18,4%  │ ↑ 0,3pp ✅  │
│──────────────────────┴──────────┴─────────┴─────────────│
│                                                           │
│ RESUMO: Agosto melhor que Julho em TODAS as métricas   │
│ Crescimento consistente em receita e lucro              │
│ Margem mantida, eficiência operacional OK               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 3.1.2 Análise por Categoria de Produto

```
┌──────────────────────────────────────────────────────────────┐
│ ANÁLISE POR CATEGORIA - AGOSTO/2026                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ CATEGORIA      │ VENDAS  │ %TOTAL │ CUSTO │ MARGEM │ % LUC │
│────────────────┼─────────┼────────┼───────┼────────┼───────│
│ Pizzas         │ 85.000  │  30,8% │34.000│  51.000│ 60%   │
│ Lanches        │ 45.000  │  16,3% │18.000│  27.000│ 60%   │
│ Complementos   │ 89.100  │  32,3% │47.600│  41.500│ 47%   │
│ Bebidas        │ 32.000  │  11,6% │ 6.400│  25.600│ 80%   │
│ Sobremesas     │ 25.000  │   9,1% │12.500│  12.500│ 50%   │
│────────────────┴─────────┴────────┴───────┴────────┴───────│
│ TOTAL          │276.100  │ 100%   │118.500│157.600│ 57%   │
│                                                              │
│ GRÁFICO DE COMPARAÇÃO:                                      │
│                                                              │
│ VENDAS POR CATEGORIA:                                       │
│ Pizzas         ▓▓▓▓▓▓░░░░ 30,8%                            │
│ Complementos   ▓▓▓▓▓▓▓░░░ 32,3%                            │
│ Lanches        ▓▓▓░░░░░░░ 16,3%                            │
│ Bebidas        ▓▓░░░░░░░░ 11,6%                            │
│ Sobremesas     ▓░░░░░░░░░  9,1%                            │
│                                                              │
│ MARGEM POR CATEGORIA:                                       │
│ Bebidas        ▓▓▓▓▓▓▓▓░░ 80%  ← MAIOR MARGEM              │
│ Pizzas         ▓▓▓▓▓▓░░░░ 60%                              │
│ Lanches        ▓▓▓▓▓▓░░░░ 60%                              │
│ Sobremesas     ▓▓▓▓▓░░░░░ 50%                              │
│ Complementos   ▓▓▓▓░░░░░░ 47%  ← MENOR MARGEM             │
│                                                              │
│ INSIGHTS:                                                   │
│ • Complementos lidera em volume (32%) mas tem menor        │
│   margem (47%) - considerar aumento de preço               │
│ • Bebidas tem excelente margem (80%) - push em promoção   │
│ • Pizzas e Lanches balanceados                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.1.3 Análise por Produto Individual

```
TOP 10 PRODUTOS - AGOSTO/2026:

Rank │ Produto             │ Qtd.  │ Receita  │ Custo   │ Lucro  │ Marg.
─────┼─────────────────────┼───────┼──────────┼─────────┼────────┼──────
1    │ Pizza Calabresa     │ 1.200 │ 54.000   │ 21.600  │ 32.400 │ 60%
2    │ Hamburger Clássico  │ 800   │ 28.000   │ 11.200  │ 16.800 │ 60%
3    │ Refrigerante 2L     │ 1.850 │ 14.800   │  2.960  │ 11.840 │ 80%
4    │ Batata Frita Grande │ 950   │ 14.250   │  7.125  │  7.125 │ 50%
5    │ Pizza Margherita    │ 900   │ 40.500   │ 16.200  │ 24.300 │ 60%
6    │ Suco Natural        │ 450   │  5.400   │  1.620  │  3.780 │ 70%
7    │ Mozzarella Frita    │ 680   │  8.160   │  4.080  │  4.080 │ 50%
8    │ Frango Desfiado     │ 620   │ 18.600   │  7.440  │ 11.160 │ 60%
9    │ Cerveja 350ml       │ 1.200 │  7.200   │  1.800  │  5.400 │ 75%
10   │ Brigadeiro          │ 780   │  3.900   │  1.950  │  1.950 │ 50%

ANÁLISE:
• Pizza Calabresa lidera (R$ 54k) - produto estrela
• Refrigerante (3º) com 80% margem - excelente
• Produto #4 (Batata) tem volume mas margem baixa (50%)
• Conjunto top 10 representa ~60% da receita total
```

---

## 4. FUNCIONALIDADE 4.1: ANÁLISES COMPORTAMENTAIS

### 4.1.1 Heatmap de Horários

```
Qual hora/dia vende mais?

┌────────────────────────────────────────────────────┐
│ HEATMAP DE VENDAS - POR HORA E DIA DA SEMANA      │
├────────────────────────────────────────────────────┤
│                                                    │
│       Seg   Ter   Qua   Qui   Sex   Sab   Dom    │
│ 11h  ░░░░  ░░░░  ░░░░  ░░░░  ▒▒▒▒  ▓▓▓▓  ▓▓▓▓   │
│ 12h  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓   │
│ 13h  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  █████ █████   │
│ 14h  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▒▒▒▒  ▓▓▓▓  ▓▓▓▓   │
│ 15h  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ░░░░  ▒▒▒▒  ▒▒▒▒   │
│ 16h  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░   │
│ 17h  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ▒▒▒▒  ▒▒▒▒   │
│ 18h  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ▒▒▒▒  ▒▒▒▒   │
│ 19h  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓   │
│ 20h  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓   │
│ 21h  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓   │
│ 22h  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓   │
│ 23h  ░░░░  ░░░░  ░░░░  ░░░░  ▒▒▒▒  ▒▒▒▒  ▒▒▒▒   │
│                                                    │
│ Legenda:                                          │
│ ░░░░ Baixo (< R$ 200)                            │
│ ▒▒▒▒ Médio (R$ 200-500)                          │
│ ▓▓▓▓ Alto (R$ 500-800)                           │
│ █████ Pico (> R$ 800)                            │
│                                                    │
│ INSIGHTS:                                         │
│ • Melhor horário: 13h-14h (almoço)                │
│ • 2º melhor: 19h-22h (jantar/noite)              │
│ • Sábado/Domingo vendem mais que semana          │
│ • Terça-feira é dia mais lento (oportunidade)    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 4.1.2 Análise por Forma de Pagamento

```
┌──────────────────────────────────────────────────────┐
│ ANÁLISE DE PAGAMENTO - AGOSTO/2026                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Forma          │ Quantidade │ Receita  │ % Total   │
│────────────────┼────────────┼──────────┼───────────│
│ Dinheiro       │ 1.200      │ 90.000   │  32,6%    │
│ Débito         │ 850        │ 63.750   │  23,1%    │
│ Crédito        │ 1.100      │ 82.500   │  29,9%    │
│ PIX            │ 400        │ 30.000   │  10,9%    │
│ Convênios      │ 113        │  9.850   │   3,6%    │
│────────────────┴────────────┴──────────┴───────────│
│ TOTAL          │ 3.663      │ 276.100  │ 100%      │
│                                                      │
│ TICKET MÉDIO POR FORMA:                            │
│ Dinheiro:     R$ 75,00                             │
│ Débito:       R$ 75,00                             │
│ Crédito:      R$ 75,00                             │
│ PIX:          R$ 75,00                             │
│ Convênios:    R$ 87,10  ← Ticket mais alto        │
│                                                      │
│ CRESCIMENTO MÊS:                                   │
│ PIX:          ↑ 45% (tendência crescente!)         │
│ Débito:       ↑ 20%                                │
│ Crédito:      ↓ 5%                                 │
│ Dinheiro:     ↓ 8%                                 │
│                                                      │
│ INSIGHTS:                                          │
│ • Dinheiro ainda lidera (33%)                      │
│ • Crédito em segundo (30%)                         │
│ • PIX crescendo rapidamente - oferecer incentivo  │
│ • Convênios têm melhor ticket - push corporativo  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. FUNCIONALIDADE 5.1: COMPARAÇÕES E BENCHMARKS

### 5.1.1 Comparação Período vs Período (YoY / MoM)

```
YoY = Year over Year (Ano sobre Ano)
MoM = Month over Month (Mês sobre Mês)

┌────────────────────────────────────────────────────┐
│ COMPARAÇÃO: AGOSTO 2026 vs AGOSTO 2025            │
├────────────────────────────────────────────────────┤
│                                                    │
│ MÉTRICA              │ AGO/25  │ AGO/26  │ MUDANÇA │
│──────────────────────┼─────────┼─────────┼─────────│
│ Faturamento          │ 246.800 │ 276.100 │ ↑11,9%  │
│ Nº Pedidos           │ 3.334   │ 3.663   │ ↑ 9,9%  │
│ Ticket Médio         │ 74,00   │ 75,30   │ ↑ 1,8%  │
│ Lucro Líquido        │ 43.100  │ 51.700  │ ↑20,0%  │
│ Margem               │ 17,5%   │ 18,7%   │ ↑ 1,2pp │
│ Receita PIX          │ 2.000   │ 30.000  │↑1400%!  │
│ Receita Online       │ 18.900  │ 38.200  │ ↑102%   │
│                                                    │
│ CONCLUSÃO: Crescimento consistente ano a ano      │
│ • Faturamento +12%                                │
│ • Lucro +20% (melhor que faturamento!)            │
│ • PIX explosivo (nova forma de pagamento)        │
│ • Online crescendo (novos clientes)              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 6. FUNCIONALIDADE 6.1: EXPORTAÇÃO DE RELATÓRIOS

### 6.1.1 Formatos Suportados

```
OPÇÕES DE EXPORTAÇÃO:

1. PDF
   ├── Relatório formatado profissional
   ├── Gráficos embutidos (imagens)
   ├── Logo da empresa
   ├── Rodapé com data/hora
   └── Pronto para imprimir

2. EXCEL (.xlsx)
   ├── Múltiplas abas (dados, gráficos, análise)
   ├── Fórmulas incluídas
   ├── Formatação básica
   ├── Possibilita edição/análise adicional
   └── Compatível com Office

3. CSV (.csv)
   ├── Dados brutos (sem formatação)
   ├── Facilita importação em outros sistemas
   ├── Simples e leve
   └── Ideal para análise em Python/R

4. JSON
   ├── Dados estruturados
   ├── API integration-friendly
   ├── Possibilita automação
   └── Ideal para sincronização sistemas

5. IMAGEM (PNG/SVG)
   ├── Apenas gráficos
   ├── Ideal para apresentações
   ├── Fácil compartilhamento
   └── Resolução otimizada
```

### 6.1.2 Fluxo de Exportação

```
┌──────────────────────────────────┐
│ Gerente Clica [Exportar]        │
└────────────┬─────────────────────┘
             │
┌────────────┴─────────────────────────┐
│ Modal de Exportação Abre:           │
│                                     │
│ Relatório: [P&L (Ago/2026)]        │
│                                     │
│ Formato:                            │
│ [○ PDF] [○ Excel] [● CSV]          │
│ [○ JSON] [○ PNG]                   │
│                                     │
│ Incluir:                            │
│ ☑ Gráficos                         │
│ ☑ Resumos                          │
│ ☑ Análises                         │
│ ☑ Rodapé (data, assinatura)       │
│                                     │
│ Nomenclatura Arquivo:               │
│ [P&L_AGO_2026_23-08-2026] (auto)   │
│                                     │
│ [Cancelar] [Exportar] [Agendar]    │
│                                     │
└────────────┬─────────────────────────┘
             │
┌────────────┴─────────────────────────┐
│ Sistema Gera Arquivo:               │
│ • Processa dados                    │
│ • Formata conforme seleção          │
│ • Gera gráficos se aplicável        │
│ • Comprime se necessário            │
│                                     │
│ Download Iniciado:                  │
│ "P&L_AGO_2026_23-08-2026.csv"      │
│                                     │
│ Toast: "Arquivo gerado com sucesso"│
│ [Abrir] [Ir para Downloads]         │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. FUNCIONALIDADE 7.1: AGENDAMENTO DE RELATÓRIOS

### 7.1.1 Relatórios Automáticos por Email

```
┌──────────────────────────────────────────┐
│ [Configurar Agendamento]                │
└────────────┬─────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│ Formulário de Agendamento:                 │
│                                            │
│ 1. Relatório:                              │
│    [P&L ▼] ou [Vendas ▼] ou [Estoque ▼]  │
│                                            │
│ 2. Período:                                │
│    [○ Diário]                              │
│    [○ Semanal] → [Sexta-feira]            │
│    [● Mensal] → [Último dia do mês]       │
│    [○ Trimestral]                          │
│    [○ Customizado] [Especificar...]       │
│                                            │
│ 3. Hora de Envio:                          │
│    [07:00] (horário do sistema)            │
│                                            │
│ 4. Destinatários:                          │
│    [gerente@empresa.com]                   │
│    [+ Adicionar Recipiente]                │
│                                            │
│ 5. Formato:                                │
│    [○ PDF] [● Excel] [○ CSV]              │
│                                            │
│ 6. Incluir no Email:                       │
│    [Summary Executivo]                     │
│    ☑ Gráficos                             │
│    ☑ Top 10 itens                         │
│    ☑ KPIs principais                      │
│    ☑ Recomendações (IA básica)            │
│                                            │
│ 7. Observação:                             │
│    [Relatório de desempenho mensal]       │
│                                            │
│ [Cancelar] [Salvar Agendamento]           │
│                                            │
└────────────┬────────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│ Sistema Confirma:                          │
│ ✅ Agendamento salvo                       │
│                                            │
│ Resumo:                                    │
│ • Relatório: P&L                           │
│ • Frequência: Mensal (31º de cada mês)    │
│ • Hora: 07:00                              │
│ • Para: gerente@empresa.com                │
│ • Formato: Excel                           │
│                                            │
│ Próximo envio: 31/08/2026 às 07:00        │
│                                            │
│ [Editar] [Deletar] [Testar Envio Agora]   │
│                                            │
└────────────────────────────────────────────┘
```

**Email Recebido:**

```
De: relatorios@pdv.empresa.com
Para: gerente@empresa.com
Assunto: 📊 Relatório P&L - Agosto/2026

Olá Gerente,

Segue em anexo o relatório financeiro de Agosto/2026.

═══════════════════════════════════════════

RESUMO EXECUTIVO:

✅ Faturamento: R$ 276.100,00 (+12% vs mês anterior)
✅ Lucro Líquido: R$ 51.700,00 (+20% vs mês anterior)
📈 Margem: 18,7% (estável)
📉 COGS: 43,5% (controlado)

TOP 3 PRODUTOS:
1. Pizzas: R$ 85.000,00
2. Complementos: R$ 89.100,00
3. Lanches: R$ 45.000,00

RECOMENDAÇÕES:
• Aumentar promoção de Bebidas (melhor margem 80%)
• Revisar preço de Complementos (margem baixa 47%)
• Continuar investimento em Pedidos Online (+102% YoY)

═══════════════════════════════════════════

Arquivo: P&L_AGO_2026.xlsx

Atenciosamente,
Sistema PDV Online
```

---

## 8. FUNCIONALIDADE 8.1: INSIGHTS E RECOMENDAÇÕES (IA BÁSICA)

### 8.1.1 Algoritmo de Recomendações

```
Sistema analisa dados e oferece insights:

1. ALERTAS CRÍTICOS 🔴:
   ├── Queda acentuada em categoria
   ├── Margem abaixo do esperado
   ├── Produto específico com desempenho ruim
   └── Custo operacional acima do limite

Exemplo:
"ALERTA: Margem de Complementos caiu para 47%.
 Considere aumentar preço em 5-10%."

2. OPORTUNIDADES 💡:
   ├── Categoria com crescimento forte
   ├── Hora/dia com menos movimento
   ├── Produto subaproveitado
   └── Nova forma de pagamento em alta

Exemplo:
"PIX cresceu 45% este mês.
 Considere oferecer cashback de 2% em PIX."

3. TENDÊNCIAS 📈:
   ├── Padrão semanal/mensal
   ├── Sazonalidade observada
   ├── Comparação YoY/MoM
   └── Previsão simples próximo período

Exemplo:
"Sextas e sábados vendem 40% mais.
 Aumente estoque nestes dias."

4. COMPARAÇÕES 📊:
   ├── vs Período anterior
   ├── vs Meta definida
   ├── vs Média histórica
   └── vs Benchmark interno

Exemplo:
"Agosto superou meta de faturamento em 8%.
 Continue a estratégia atual."

ESSES INSIGHTS APARECEM:
├── No Dashboard (widgets destacados)
├── Nos Relatórios (seção de recomendações)
├── Nos Emails agendados
└── Em notificação push (configurável)
```

---

## 9. BANCO DE DADOS

### 9.1 Tabela RELATORIOS_AGENDADOS

```sql
CREATE TABLE relatorios_agendados (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  
  -- Tipo
  tipo_relatorio VARCHAR(50) NOT NULL,
  -- p_e_l, dre, vendas, estoque, financeiro
  
  -- Período
  periodo_tipo VARCHAR(20) NOT NULL,
  -- diario, semanal, mensal, trimestral, customizado
  
  dia_semana INT,  -- 1=seg, 2=ter... 7=dom
  dia_mes INT,     -- 1-31
  hora TIME NOT NULL,  -- HH:MM
  
  -- Formato
  formato VARCHAR(20) NOT NULL,
  -- pdf, excel, csv, json
  
  -- Destinatários
  emails TEXT NOT NULL,  -- JSON array de emails
  
  -- Configurações
  incluir_graficos BOOLEAN DEFAULT TRUE,
  incluir_resumo BOOLEAN DEFAULT TRUE,
  incluir_insights BOOLEAN DEFAULT TRUE,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Auditoria
  criado_por INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  proximo_envio TIMESTAMP,
  ultimo_envio TIMESTAMP,
  
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  INDEX idx_ativo(ativo),
  INDEX idx_tipo(tipo_relatorio),
  INDEX idx_proximo(proximo_envio)
);

CREATE TABLE relatorios_enviados (
  id SERIAL PRIMARY KEY,
  agendamento_id INT NOT NULL,
  
  email_destino VARCHAR(255),
  data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20),  -- enviado, falha
  arquivo_url VARCHAR(255),
  
  FOREIGN KEY (agendamento_id) REFERENCES relatorios_agendados(id),
  INDEX idx_agendamento(agendamento_id),
  INDEX idx_data(data_envio)
);
```

---

## 10. API REST - ENDPOINTS

**Base URL:** `http://localhost:3000/api/relatorios`

#### **GET /api/relatorios/dashboard**
Obter dados do dashboard
```
Query Params:
  - periodo: 'dia' | 'mes' | 'ano'
  - widgets: 'kpi,graficos,top_produtos' (customizável)

Response:
{
  "sucesso": true,
  "dados": {
    "kpis": {...},
    "widgets": [...]
  }
}
```

#### **GET /api/relatorios/pl**
Gerar relatório P&L
```
Query Params:
  - data_inicio: date
  - data_fim: date
  - formato: 'json' | 'pdf' | 'excel'

Response:
{
  "sucesso": true,
  "dados": {
    "periodo": "ago/2026",
    "receitas": {...},
    "custos": {...},
    "lucro": {...}
  }
}
```

#### **GET /api/relatorios/vendas/analise**
Análise detalhada de vendas
```
Response:
{
  "por_categoria": [...],
  "por_produto": [...],
  "por_pagamento": [...],
  "por_horario": [...]
}
```

#### **POST /api/relatorios/exportar**
Exportar relatório
```
Body:
{
  "tipo_relatorio": "p_e_l",
  "formato": "excel",
  "data_inicio": "2026-08-01",
  "data_fim": "2026-08-31"
}

Response:
{
  "sucesso": true,
  "download_url": "/downloads/P&L_AGO.xlsx"
}
```

#### **POST /api/relatorios/agendar**
Agendar envio automático
```
Body:
{
  "nome": "P&L Mensal",
  "tipo_relatorio": "p_e_l",
  "periodo_tipo": "mensal",
  "dia_mes": 31,
  "hora": "07:00",
  "emails": ["gerente@empresa.com"],
  "formato": "excel"
}

Response:
{
  "sucesso": true,
  "agendamento_id": 12345,
  "proximo_envio": "2026-08-31T07:00:00Z"
}
```

---

## 11. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/relatorios/
│
├── pages/
│   ├── DashboardExecutivoPage.jsx      # Dashboard
│   ├── RelatorioP&LPage.jsx            # P&L
│   ├── RelatorioDREPage.jsx            # DRE
│   ├── AnaliseVendasPage.jsx           # Vendas
│   ├── AnaliseLucrativdadePage.jsx     # Lucro
│   ├── ComparacaoPeriodicaPage.jsx     # YoY/MoM
│   ├── ExportacaoPage.jsx              # Exportar
│   └── AgendamentosPage.jsx            # Agendados
│
├── components/
│   ├── Dashboard/
│   │   ├── GridLayout.jsx              # Drag & drop
│   │   ├── WidgetKPI.jsx
│   │   ├── WidgetGrafico.jsx
│   │   ├── WidgetTabela.jsx
│   │   └── CustomizadorDashboard.jsx
│   │
│   ├── Relatorios/
│   │   ├── RelatorioP&L.jsx
│   │   ├── RelatorioDRE.jsx
│   │   ├── RelatorioVendas.jsx
│   │   └── RelatorioComparativo.jsx
│   │
│   ├── Graficos/
│   │   ├── GraficoLinha.jsx
│   │   ├── GraficoPizza.jsx
│   │   ├── GraficoBarras.jsx
│   │   ├── GraficoHeatmap.jsx
│   │   └── GraficoArea.jsx
│   │
│   ├── Exportacao/
│   │   ├── ModalExportacao.jsx
│   │   ├── OpcoesFomato.jsx
│   │   └── ProgressoExportacao.jsx
│   │
│   └── Agendamento/
│       ├── FormularioAgendamento.jsx
│       ├── ListaAgendamentos.jsx
│       └── ModalTestoEnvio.jsx
│
├── hooks/
│   ├── useDashboard.js
│   ├── useRelatorios.js
│   ├── useExportacao.js
│   └── useAgendamentos.js
│
├── services/
│   ├── relatoriosService.js
│   ├── exportacaoService.js
│   └── agendamentosService.js
│
├── utils/
│   ├── calculosPL.js
│   ├── geradorGraficos.js
│   ├── exportadorPDF.js
│   ├── exportadorExcel.js
│   └── validacoes.js
│
├── styles/
│   ├── dashboard.css
│   ├── relatorios.css
│   ├── graficos.css
│   └── responsive.css
│
└── constants/
    ├── tiposRelatorios.js
    ├── formatosExportacao.js
    └── periodosRelatorio.js
```

---

## 12. CASOS DE USO DETALHADOS

### Caso de Uso 1: Gerar Relatório P&L

**Ator:** Gerente
**Tempo:** ~2 minutos

**Fluxo:**
1. Gerente vai para: Relatórios > [P&L]
2. Período: "Agosto/2026"
3. Clica "Gerar Relatório"
4. Sistema processa dados
5. Mostra em tela:
   - Receitas: R$ 276.100
   - Custos: R$ 224.400
   - Lucro: R$ 51.700 (18,7% margem)
6. Com gráficos de visualização
7. Clica [Exportar]
8. Seleciona formato: "Excel"
9. Download inicia
10. Arquivo: "P&L_AGO_2026.xlsx"

**Resultado:** Relatório financeiro completo em mãos, pronto para análise.

---

### Caso de Uso 2: Configurar Relatório Automático

**Ator:** Admin
**Tempo:** ~5 minutos

**Fluxo:**
1. Admin acessa: Relatórios > [Agendamentos]
2. Clica [Novo Agendamento]
3. Tipo: "P&L"
4. Frequência: "Mensal"
5. Dia: "31 de cada mês"
6. Hora: "07:00"
7. Destinatários: "gerente@empresa.com, diretor@empresa.com"
8. Formato: "Excel"
9. Clica "Salvar"
10. Sistema confirma: "Agendamento ativo"
11. Próximo envio: 31/08/2026 às 07:00
12. Operador pode testar: [Enviar Agora]
13. Email é enviado imediatamente
14. Gerente recebe arquivo anexado

**Resultado:** Relatório automático chega todo mês sem necessidade de ação manual.

---

### Caso de Uso 3: Analisar Comparação YoY

**Ator:** Diretor
**Tempo:** ~3 minutos

**Fluxo:**
1. Diretor vai para: Relatórios > [Comparação]
2. Período 1: "Agosto/2025"
3. Período 2: "Agosto/2026"
4. Clica "Comparar"
5. Sistema mostra:
   - Faturamento: +12% ✅
   - Lucro: +20% ✅
   - Margem: +1,2pp ✅
6. Tabela comparativa aparece
7. Gráfico visual com barras comparando
8. Diretor vê: "Crescimento consistente em todas as métricas"
9. Clica [Insights] para recomendações
10. Sistema sugere: "PIX cresceu 45%, ofereça incentivo"

**Resultado:** Análise estratégica clara, decisões embasadas em dados.

---

## 13. MOCKUPS

### Tela 1: Dashboard Executivo

```
┌─────────────────────────────────────────────────────┐
│ 📊 DASHBOARD EXECUTIVO                            │
│ [Periodo: Agosto/2026 ▼] [Atualizar] [Exportar]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌────┬────┬────┬────┐                             │
│ │ R$ │Lucr│Tick│Ped │                             │
│ │276k│51k │75  │366 │                             │
│ └────┴────┴────┴────┘                             │
│                                                     │
│ ╔═══════════════════╦═══════════════════════════╗  │
│ ║ RECEITA vs CUSTO  ║ TOP 5 PRODUTOS BY SALES   ║  │
│ ║                  ║ 1. Pizzas R$ 85k (31%)    ║  │
│ ║    ╱╲             ║ 2. Compl. R$ 89k (32%)    ║  │
│ ║   ╱  ╲  ╱╲        ║ 3. Lanch. R$ 45k (16%)    ║  │
│ ║  ╱    ╲╱  ╲       ║ 4. Bebid. R$ 32k (12%)    ║  │
│ ║ ╱            ╲    ║ 5. Sobre. R$ 25k (9%)     ║  │
│ ║               ╲   ║                            ║  │
│ ║—— Receita —Custo ║                            ║  │
│ ╠═══════════════════╬═══════════════════════════╣  │
│ ║ MARGEM POR CAT.   ║ ÚLTIMOS 7 DIAS (Trends)   ║  │
│ ║ Bebidas 80% ▓▓▓▓▓ ║ 17: R$ 8.2k ↑             ║  │
│ ║ Pizzas  60% ▓▓▓   ║ 18: R$ 8.9k ↑ Melhor      ║  │
│ ║ Lanches 60% ▓▓▓   ║ 19: R$ 7.5k ↓             ║  │
│ ║ Sobres  50% ▓▓    ║ 20: R$ 9.8k ↑             ║  │
│ ║ Compl.  47% ▓     ║ 21: R$ 10.1k ↑ Pico      ║  │
│ ║                  ║ 22: R$ 8.5k ↓             ║  │
│ ║                  ║ 23: R$ 9.7k ↑             ║  │
│ ╚═══════════════════╩═══════════════════════════╝  │
│                                                     │
│ 💡 INSIGHTS:                                       │
│ • Complementos com margem baixa (47%)              │
│ • PIX cresceu 45% este mês                         │
│ • Pico de vendas em 21/08 (R$ 10.1k)              │
│                                                     │
│ [Relatórios] [Análises] [Exportar] [Agendamentos] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tela 2: Relatório P&L

```
┌──────────────────────────────────────┐
│ DEMONSTRAÇÃO DE RESULTADO (P&L)     │
│ PERÍODO: AGOSTO/2026                │
├──────────────────────────────────────┤
│                                      │
│ RECEITAS TOTAIS        276.100  100% │
│                                      │
│ CUSTOS                 122.700   45% │
│ ─────────────────────────────────── │
│ LUCRO BRUTO            153.400   55% │
│                                      │
│ DESPESAS OPERAC.       111.800   41% │
│ ─────────────────────────────────── │
│ LUCRO OPERACIONAL       41.600   15% │
│                                      │
│ DESPESAS FINANCEIRAS     2.000    1% │
│ ─────────────────────────────────── │
│ LUCRO ANTES IMPOSTOS    39.600   14% │
│                                      │
│ IMPOSTOS (15%)           5.940    2% │
│ ─────────────────────────────────── │
│ LUCRO LÍQUIDO           33.660   12% │
│                                      │
│ [Detalhes] [Exportar] [Comparar]    │
│                                      │
└──────────────────────────────────────┘
```

---

## 14. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Dashboard Básico (1-2 semanas)
- [ ] Layout grid responsivo
- [ ] KPIs principais
- [ ] Primeiros gráficos (linha, pizza)
- [ ] Filtro período básico
- [ ] Testes

### Sprint 2: Dashboard Avançado (1-2 semanas)
- [ ] Drag & drop widgets
- [ ] Customização por usuário
- [ ] Mais gráficos (barras, área, heatmap)
- [ ] Save/load layouts
- [ ] Testes

### Sprint 3: Relatórios P&L/DRE (1-2 semanas)
- [ ] Cálculos P&L
- [ ] Cálculos DRE
- [ ] Visualização completa
- [ ] Comparação períodos
- [ ] Testes

### Sprint 4: Análises de Vendas (1-2 semanas)
- [ ] Análise por categoria
- [ ] Análise por produto
- [ ] Análise por pagamento
- [ ] Heatmap por hora
- [ ] Testes

### Sprint 5: Exportação (1 semana)
- [ ] Export PDF
- [ ] Export Excel
- [ ] Export CSV
- [ ] Export JSON
- [ ] Testes

### Sprint 6: Agendamento (1-2 semanas)
- [ ] Configuração agendamento
- [ ] Envio automático por email
- [ ] Log de envios
- [ ] Teste de envio
- [ ] Testes

### Sprint 7: Insights e IA (1-2 semanas)
- [ ] Algoritmo de insights
- [ ] Recomendações básicas
- [ ] Alertas críticos
- [ ] Oportunidades
- [ ] Testes

### Sprint 8: Polish + Deploy (1 semana)
- [ ] Testes E2E
- [ ] Performance
- [ ] Staging
- [ ] Produção
- [ ] Treinamento

---

## 15. CHECKLIST PRÉ-DESENVOLVIMENTO

- [ ] Requisitos de relatórios finalizados
- [ ] Estrutura de dados para análises definida
- [ ] Cálculos financeiros validados (contador)
- [ ] Biblioteca de gráficos selecionada (Chart.js, Recharts, etc)
- [ ] Formato de exportação definido
- [ ] Email service provider escolhido (SendGrid, AWS SES, etc)
- [ ] Performance strategy para grandes volumes de dados
- [ ] Banco de dados schema aprovado
- [ ] Backup strategy definido
- [ ] Segurança de dados e LGPD considerada

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento

**Próximos Módulos (Fase 2):**
- Módulo 3: Autenticação e Perfis de Usuário
- Módulo 4: Configurações do Sistema
- Módulo 5: Integração com APIs Externas
