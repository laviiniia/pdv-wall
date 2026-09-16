# MÓDULO 2.2: SISTEMA DE VENDAS PDV (PONTO DE VENDA)

## 📋 Sumário Executivo

**Objetivo:** Permitir que operadores (caixa/vendedor) realizem vendas rápidas de produtos de forma intuitiva, com busca eficiente, carrinho dinâmico, cálculo de descontos e múltiplas formas de pagamento.

**Funcionalidades Principais:**
- ✅ Busca rápida de produtos (nome, SKU, código de barras)
- ✅ Carrinho de compras dinâmico
- ✅ Ajuste de quantidade e remoção de itens
- ✅ Sistema de descontos (manual, percentual, cupom)
- ✅ Múltiplas formas de pagamento
- ✅ Cálculo automático de troco
- ✅ Impressão de cupom/recibo
- ✅ Histórico de vendas do dia

**Perfis de Acesso:**
- Operador (caixa) - criar vendas
- Gerente - criar, anular e ver histórico
- Admin - tudo + relatórios

**Tempo de Venda Alvo:** 1-2 minutos por transação

---

## 1. FUNCIONALIDADE 1.1: BUSCA DE PRODUTOS

### 1.1.1 Descrição Geral

Sistema inteligente de busca que retorna produtos relevantes em tempo real, otimizado para vendas rápidas.

### 1.1.2 Métodos de Busca

#### **Busca 1: Por Nome**
```
Usuário digita: "ham"
Sistema retorna:
├── 🍔 Hamburger Clássico (HAM-001) - R$ 35,00
├── 🍔 Hamburger Premium (HAM-002) - R$ 45,00
└── 🍔 Hamburger Duplo (HAM-003) - R$ 55,00

Busca case-insensitive (maiúscula/minúscula não importa)
Retorna resultado parcial (não precisa digitar tudo)
Máximo 10 resultados por busca
```

#### **Busca 2: Por SKU/Código**
```
Usuário digita: "HAM-001"
Sistema retorna:
├── 🍔 Hamburger Clássico (HAM-001) - R$ 35,00

Busca exata (maiúscula/minúscula insensível)
Retorna apenas 1 resultado (SKU é único)
Atalho rápido para operador que conhece os códigos
```

#### **Busca 3: Por Código de Barras**
```
Leitor de código de barras lê: "7891234567890"
Sistema busca no BD:
├── Campo: codigo_barras
├── Se encontrar: Adiciona direto ao carrinho
├── Se não encontrar: Mostra "Produto não encontrado"

Útil em lojas com produtos codificados
```

#### **Busca 4: Por Categoria**
```
Usuário clica em "Lanches" (categoria)
Sistema mostra todos os produtos:
├── 🍔 Hamburger Clássico
├── 🍕 Sanduíche X-Tudo
└── 🌭 Cachorro Quente
```

### 1.1.3 Fluxo de Busca e Adição ao Carrinho

```
┌─────────────────────────────────────┐
│ Usuário Abre Interface PDV          │
│ Campo de Busca em Foco              │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│ Usuário Digita: "ham"               │
│ Sistema processa em tempo real       │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│ Sistema Retorna Resultados:         │
│ • Hamburger Clássico (HAM-001)      │
│ • Hamburger Premium (HAM-002)       │
│                                     │
│ Cada resultado mostra:              │
│   - Imagem (thumb)                  │
│   - Nome                            │
│   - SKU                             │
│   - Preço                           │
│   - Stock Status                    │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│ Usuário Clica em "Hamburger Classic"│
│ OU Clica [Adicionar] / Escaneia Code│
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│ Sistema Abre Modal/Popup:           │
│ "Qual quantidade?"                  │
│ [Quantidade: 1] [+] [-]             │
│ [Adicionar] [Cancelar]              │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│ Usuário Define Quantidade: 2        │
│ Clica "Adicionar"                   │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│ Sistema Adiciona ao Carrinho:       │
│ • 2x Hamburger Clássico             │
│ • R$ 35,00 x 2 = R$ 70,00           │
│                                     │
│ Carrinho Atualiza                   │
│ Total: R$ 70,00                     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Campo de Busca Limpa                │
│ Fica em Foco para Próxima Busca     │
└─────────────────────────────────────┘
```

### 1.1.4 Otimizações para Velocidade

**Atalhos de Teclado:**
- Barra de espaço: Foco no campo de busca
- Enter: Adiciona primeiro resultado
- ESC: Limpa busca
- Número + Enter: Quantidade rápida

**Histórico de Últimos Produtos:**
```
Quando operador abre PDV, mostra:
"Últimos vendidos"
├── 🍔 Hamburger Clássico
├── 🍟 Batata Frita
└── 🥤 Refrigerante

Um clique = Adiciona ao carrinho
```

**Produtos Favoritos:**
```
Operador pode marcar produtos frequentes como ⭐
Aparecem em seção especial acima de tudo
```

### 1.1.5 Validações de Busca

**Validação 1: Produto Inativo**
```
Busca encontra: "Pizza Margherita (INATIVA)"
Sistema não mostra no resultado
Apenas produtos ativos aparecem
```

**Validação 2: Produto Sem Estoque**
```
Busca encontra: "Suco Natural"
Aparece no resultado MAS com:
├── Visual Desbotado
├── Badge "Sem Estoque"
└── Não permite adicionar ao carrinho

Validação: "Este produto não tem estoque"
```

**Validação 3: Palavra-chave Muito Curta**
```
Usuário digita: "a"
Sistema não busca (muito genérico)
Mostra: "Digite pelo menos 2 caracteres"
```

---

## 2. FUNCIONALIDADE 2.1: CARRINHO DE COMPRAS

### 2.1.1 Estrutura do Carrinho

```
CARRINHO DE COMPRAS
═════════════════════════════════════════════

Produto              | Qtd | Unitário | Subtotal  | Ação
─────────────────────────────────────────────────────────
🍔 Hamburger Clássico | 2  | R$ 35,00 | R$ 70,00  | [x]
🍟 Batata Frita      | 1  | R$ 15,00 | R$ 15,00  | [x]
🥤 Refrigerante      | 3  | R$ 8,00  | R$ 24,00  | [x]

═════════════════════════════════════════════
RESUMO:
  Subtotal:        R$ 109,00
  Desconto:        R$ 0,00
  ─────────────────────────────
  TOTAL:           R$ 109,00
═════════════════════════════════════════════
```

### 2.1.2 Operações do Carrinho

#### **Adicionar Item**
```
Já documentado em 1.1.3

Fluxo:
1. Busca produto
2. Define quantidade
3. Confirma
4. Item aparece no carrinho
```

#### **Ajustar Quantidade**

```
Método 1: Botões [+] [-]
┌─────────────────────────────────┐
│ 🍔 Hamburger x 2  [−] [+] [x]   │
│ R$ 35,00 x 2 = R$ 70,00         │
└─────────────────────────────────┘

Usuário Clica [+]:
├── Quantidade passa para 3
├── Subtotal recalcula: R$ 105,00
└── Total geral recalcula

Método 2: Campo Editável
Usuário pode clicar no "2" e digitar número direto
Precisa confirmar com Enter ou Tab

Validações:
├── Mínimo: 1 unidade
├── Máximo: Sem limite (validar estoque)
├── Não permite 0 ou negativo
```

#### **Remover Item**

```
Usuário Clica em [x]:

Opção 1 (Padrão): Remove direto
├── Item sai do carrinho
├── Total recalcula
└── Toast: "Item removido"

Opção 2 (Gerenciado): Confirmação
"Tem certeza que deseja remover este item?"
[Cancelar] [Remover]

Melhor: Usar Opção 1 (mais rápido)
Com botão DESFAZER se operador clicar rápido
```

#### **Limpar Carrinho**

```
Botão: [Limpar Carrinho]

Sistema Confirma:
"Deseja limpar todos os itens?
Esta ação não pode ser desfeita."

[Cancelar] [Limpar]

Se Confirmar:
├── Remove todos os itens
├── Total volta para R$ 0,00
├── Campo de busca fica em foco
└── Toast: "Carrinho limparado"
```

### 2.1.3 Salvar Carrinho como Rascunho

```
Situação: Operador precisa pausar venda
(cliente vai embora, volta depois)

Opção: [Salvar como Rascunho]

Sistema Abre Modal:
┌──────────────────────────────┐
│ Salvar Venda Pendente        │
├──────────────────────────────┤
│ Nome/Referência:             │
│ [Cliente João da Silva____] │
│                              │
│ Observações:                 │
│ [Volta em 30 min_________]  │
│                              │
│ [Cancelar] [Salvar]          │
└──────────────────────────────┘

Salva no BD:
├── Tab: vendas_pendentes
├── Status: "rascunho"
├── timestamp: 14:35:20
├── operador_id: 5
├── cliente_nome: "João"
├── observacoes: "Volta em 30 min"
├── itens: JSON com produtos

Depois:
1. Operador clica [Recuperar Rascunho]
2. Busca por cliente
3. Carrega carrinho anterior
4. Continua vendendo
```

---

## 3. FUNCIONALIDADE 3.1: SISTEMA DE DESCONTOS

### 3.1.1 Tipos de Desconto

#### **Desconto 1: Percentual (Manual)**

```
Operador acessa: [Aplicar Desconto]

Modal de Desconto:
┌────────────────────────────┐
│ Tipo de Desconto           │
├────────────────────────────┤
│ [○ Percentual] [○ Valor]   │
│                            │
│ Percentual: [10] %         │
│                            │
│ Preview:                   │
│ Subtotal: R$ 100,00        │
│ Desconto (10%): R$ 10,00   │
│ Total: R$ 90,00            │
│                            │
│ [Cancelar] [Aplicar]       │
└────────────────────────────┘

Validações:
├── Máximo: 100% (não mais)
├── Mínimo: 0%
├── Valores permitidos: 5%, 10%, 15%, 20%, 50%
├── Campo livre para gerentes
└── Operador limitado a 20%

Quando Aplica:
├── Desconto aparece na tela
├── Total recalcula
├── Registro em auditoria (quem, quando, quanto)
```

#### **Desconto 2: Valor Fixo (Manual)**

```
Modal de Desconto:
┌────────────────────────────┐
│ Tipo de Desconto           │
├────────────────────────────┤
│ [○ Percentual] [○ Valor]   │
│                            │
│ Valor: R$ [10,00]          │
│                            │
│ Preview:                   │
│ Subtotal: R$ 100,00        │
│ Desconto: R$ 10,00         │
│ Total: R$ 90,00            │
│                            │
│ [Cancelar] [Aplicar]       │
└────────────────────────────┘

Validações:
├── Máximo: Não pode ser > Subtotal
├── Mínimo: R$ 0,00
├── Máximo desconto: R$ 50,00 (para operador)
├── Gerente: Sem limite
└── Precision: 2 decimais
```

#### **Desconto 3: Cupom Promocional**

```
Operador vê campo: [Cupom/Código]

Exemplo Cupons:
├── PROMO10 = 10% de desconto
├── BLACKFRIDAY = 30% desconto
├── CLIENTE_VIP_50 = R$ 50 off
├── FRETEGRATIS = R$ 0 frete (futuro)

Fluxo:
1. Operador digita: "PROMO10"
2. Sistema valida:
   ├── Cupom existe no BD?
   ├── Cupom está ativo?
   ├── Cupom não expirou?
   ├── Valor mínimo atingido?
   ├── Máximo de usos não foi atingido?
   └── Cliente já usou (se nominal)?
3. Se ✅: Aplica desconto
4. Se ❌: Mostra erro específico

Exemplo Erro:
"Cupom PROMO10 expirou em 31/08/2026"
"Cupom PROMO10 requer compra mínima de R$ 50,00"
"Cupom DESCONTO50 já foi usado por você"

Tabela de Cupons (BD):
├── ID
├── Codigo (PROMO10)
├── Tipo (PERCENTUAL ou VALOR)
├── Valor (10 ou 50)
├── Data Inicio
├── Data Expiracao
├── Usos Máximos
├── Usos Atuais
├── Ativo
└── Quer registrar venda com cupom
```

### 3.1.2 Cálculos com Desconto

**Cenário 1: Desconto Percentual**
```
Subtotal: R$ 100,00
Desconto: 10%

Cálculo:
Valor Desconto = Subtotal × (Percentual / 100)
Valor Desconto = 100 × (10 / 100) = R$ 10,00

Total = Subtotal - Valor Desconto
Total = 100 - 10 = R$ 90,00
```

**Cenário 2: Desconto em Valor Fixo**
```
Subtotal: R$ 100,00
Desconto: R$ 15,00

Validação:
├── Desconto > Subtotal? → Erro
├── R$ 15 > R$ 100? → NÃO, OK

Total = Subtotal - Desconto
Total = 100 - 15 = R$ 85,00
```

**Cenário 3: Múltiplos Descontos (Cascata)**
```
Raro, mas possível:

Subtotal: R$ 100,00
Desconto 1 (Cupom): 10% = R$ 10,00 → Subtotal = R$ 90,00
Desconto 2 (Manual): R$ 5,00 → Total = R$ 85,00

OU (mais comum):

Subtotal: R$ 100,00
Desconto Final: 15% = R$ 15,00
Total: R$ 85,00

Melhor: Permitir APENAS 1 desconto automático
Se operador quer múltiplos, calcula manual e aplica como 1
```

### 3.1.3 Regras de Negócio para Desconto

```
Para OPERADOR:
├── Desconto máximo: 20%
├── Desconto máximo em valor: R$ 50,00
├── Precisa de confirmação para descontos > 10%
├── Histórico registrado (auditoria)
└── Limite de descontos/dia: R$ 500,00

Para GERENTE:
├── Desconto máximo: 100% (valor mínimo = 0)
├── Sem limite de valor
├── Sem confirmação necessária
├── Histórico registrado
└── Sem limite diário

Para ADMIN:
├── Sem restrições
└── Acesso total
```

---

## 4. FUNCIONALIDADE 4.1: FORMAS DE PAGAMENTO

### 4.1.1 Métodos Disponíveis

#### **Método 1: Dinheiro**

```
Fluxo:
1. Usuário Seleciona: "Dinheiro"
2. Sistema Mostra Modal:

┌─────────────────────────────────────┐
│ Pagamento em Dinheiro               │
├─────────────────────────────────────┤
│                                     │
│ Total a Pagar:     R$ 89,00         │
│                                     │
│ Valor Recebido:    R$ [_______]    │
│ (ex: 100)                           │
│                                     │
│ Troco:             R$ 11,00         │
│                                     │
│ [Cancelar] [Confirmar Pagamento]    │
└─────────────────────────────────────┘

3. Operador digita: 100
4. Sistema calcula: Troco = 100 - 89 = R$ 11,00
5. Operador confirma
6. Venda finalizada
7. Imprime cupom com troco

Validações:
├── Valor recebido não pode ser < Total
├── Se < Total, mostra: "Valor insuficiente"
├── Precision: 2 decimais
└── Aceita valores arredondados (99,50 etc)
```

#### **Método 2: Débito**

```
Tipo: Débito em Conta Corrente

Fluxo:
1. Usuário Seleciona: "Débito"
2. Sistema Mostra Modal:

┌─────────────────────────────────────┐
│ Pagamento por Débito                │
├─────────────────────────────────────┤
│                                     │
│ Total a Pagar:     R$ 89,00         │
│                                     │
│ Banco: [Selecione ▼]                │
│ • Banco do Brasil                   │
│ • Itaú                              │
│ • Santander                         │
│ • Outro                             │
│                                     │
│ Número da Transação:                │
│ [Auto-gerado: 20260823001234]      │
│                                     │
│ [Cancelar] [Confirmar Pagamento]    │
└─────────────────────────────────────┘

3. Operador seleciona banco
4. Confirma
5. Sistema registra transação
6. Venda é finalizada
7. Imprime cupom (sem troco, pois débito é exato)

Validações:
├── Banco obrigatório
├── Número único por transação
└── Timeout: Se não processar em 30s, tenta de novo
```

#### **Método 3: Crédito**

```
Tipo: Cartão de Crédito

Fluxo:
1. Usuário Seleciona: "Crédito"
2. Sistema Mostra Modal:

┌─────────────────────────────────────┐
│ Pagamento por Crédito               │
├─────────────────────────────────────┤
│                                     │
│ Total a Pagar:     R$ 89,00         │
│                                     │
│ Parcelamento:                       │
│ [○ 1x] [○ 2x] [○ 3x] [○ Mais]     │
│                                     │
│ Se 3x:                              │
│ 1ª Parcela: R$ 30,00 (sem juros)   │
│ 2ª Parcela: R$ 30,00 (sem juros)   │
│ 3ª Parcela: R$ 29,00 (sem juros)   │
│                                     │
│ Número da Transação:                │
│ [Auto-gerado: 20260823001234]      │
│                                     │
│ [Cancelar] [Confirmar Pagamento]    │
└─────────────────────────────────────┘

3. Operador seleciona: 3x
4. Sistema calcula parcelas (sem juros para este caso)
5. Confirma
6. Venda é finalizada
7. Imprime cupom com detalhes das parcelas

Validações:
├── Máximo de parcelas: 12x (configurável)
├── Cada parcela mínima: R$ 5,00
└── Juros: 0% (pode ser configurado por loja)
```

#### **Método 4: PIX**

```
Tipo: Transferência Instantânea

Fluxo:
1. Usuário Seleciona: "PIX"
2. Sistema Mostra Modal:

┌─────────────────────────────────────┐
│ Pagamento por PIX                   │
├─────────────────────────────────────┤
│                                     │
│ Total a Pagar:     R$ 89,00         │
│                                     │
│ Chave PIX:                          │
│ CPF: 123.456.789-00                 │
│                                     │
│ QR Code:                            │
│ ┌─────────────────────────┐        │
│ │ ██ ██ ██ ██ ██ ██ ██  │        │
│ │ ██                  ██  │        │
│ │ ██  00051.62031      ██  │        │
│ │ ██  20260823143512   ██  │        │
│ │ ██                  ██  │        │
│ │ ██ ██ ██ ██ ██ ██ ██  │        │
│ └─────────────────────────┘        │
│ (gerado dinamicamente)              │
│                                     │
│ ⏱️ Tempo restante: 05:00            │
│                                     │
│ [Cancelar] [Já Paguei]              │
└─────────────────────────────────────┘

3. Cliente escaneia QR Code com app PIX
4. Transfere R$ 89,00
5. Sistema espera confirmação (até 5 minutos)
6. Quando recebe transferência:
   ├── QR Code desaparece
   ├── Status muda para "Pago"
   ├── Venda finaliza automaticamente
   └── Cupom imprime
7. Se timeout (5 min):
   └── Oferece opção de tentar novamente

Validações:
├── PIX Dinâmico com ID único
├── Timeout: 5 minutos
├── Revalidação: Se cliente não pagar, pode cancelar
└── Webhook: Banco notifica quando PIX foi pago
```

#### **Método 5: Combinado (Múltiplos Pagamentos)**

```
Cliente quer pagar: R$ 50 em dinheiro + R$ 39 no débito

Fluxo:
1. Total: R$ 89,00
2. Operador Clica: [+ Adicionar Forma de Pagamento]

┌──────────────────────────────────┐
│ Primeiro Pagamento:              │
│ [Dinheiro] ............. R$ 50   │
│                                  │
│ Segundo Pagamento:               │
│ [Débito] ................. R$ 39 │
│                                  │
│ ─────────────────────────────    │
│ Total:                  R$ 89    │
│                                  │
│ [Adicionar Mais] [Finalizar]     │
└──────────────────────────────────┘

3. Sistema valida se soma = Total
4. Se OK: Permite finalizar
5. Se Diferente: "Total não bate. Faltam R$ X"
6. Operador ajusta
7. Finaliza quando tudo bate
```

### 4.1.2 Fluxo Completo de Pagamento

```
┌──────────────────────────────────┐
│ CARRINHO PRONTO                  │
│ Total: R$ 89,00                  │
│ [Finalizar Venda] [Limpar]       │
└────────────────┬─────────────────┘
                 │
┌────────────────┴─────────────────┐
│ Clica "Finalizar Venda"          │
└────────────────┬─────────────────┘
                 │
┌────────────────┴─────────────────┐
│ Sistema Mostra Seletor de Forma  │
│ [Dinheiro]                       │
│ [Débito]                         │
│ [Crédito]                        │
│ [PIX]                            │
│ [Combinado ↓]                    │
└────────────────┬─────────────────┘
                 │
┌────────────────┴─────────────────┐
│ Operador Seleciona: "Dinheiro"   │
└────────────────┬─────────────────┘
                 │
┌────────────────┴─────────────────┐
│ Abre Modal de Dinheiro           │
│ Total: R$ 89,00                  │
│ Valor Recebido: [100]            │
│ Troco: R$ 11,00                  │
└────────────────┬─────────────────┘
                 │
┌────────────────┴─────────────────┐
│ Operador Confirma Pagamento      │
└────────────────┬─────────────────┘
                 │
┌────────────────┴──────────────────────────────┐
│ Sistema Processa:                            │
│ 1. Valida pagamento                          │
│ 2. Cria registro de venda no BD              │
│ 3. Atualiza estoque (diminui quantidade)     │
│ 4. Registra movimento financeiro             │
│ 5. Gera ID único da venda (VEND-20260823...)│
│ 6. Calcula lucro da venda                    │
│ 7. Registra em auditoria                     │
└────────────────┬──────────────────────────────┘
                 │
┌────────────────┴──────────────────────────────┐
│ Imprime Cupom / Recibo                       │
│ └─ Ver próxima seção: Impressão              │
└────────────────┬──────────────────────────────┘
                 │
┌────────────────┴──────────────────────────────┐
│ Venda Finalizada com Sucesso ✅              │
│ Mostra Toast: "Venda realizada #VEND-001"    │
│ Campo de Busca Limpa e em Foco               │
│ Carrinho Zerado                              │
│ Pronto para Próxima Venda                    │
└──────────────────────────────────────────────┘
```

---

## 5. FUNCIONALIDADE 5.1: IMPRESSÃO DE CUPOM

### 5.1.1 Conteúdo do Cupom

```
════════════════════════════════════════
       RESTAURANTE FASTFOOD LTDA
════════════════════════════════════════

Recibo de Venda
Venda: #VEND-20260823-001234
Data: 23/08/2026
Hora: 14:35:20
Operador: João Silva
Caixa: #01

────────────────────────────────────────
DESCRIÇÃO            QTD   UNITÁRIO  TOTAL
────────────────────────────────────────
Hamburger Classic     2    R$ 35,00  R$ 70,00
Batata Frita          1    R$ 15,00  R$ 15,00
Refrigerante          3    R$ 8,00   R$ 24,00

────────────────────────────────────────
SUBTOTAL:                         R$ 109,00
DESCONTO:                         R$ 10,00
                                  (10%)
────────────────────────────────────────
TOTAL:                            R$ 99,00

Forma de Pagamento: Dinheiro
Valor Recebido:                   R$ 100,00
Troco:                            R$ 1,00

════════════════════════════════════════
Obrigado pela preferência!
Volte sempre!

Powered by FastFood PDV v1.0
════════════════════════════════════════
```

### 5.1.2 Configurações de Impressão

**Tamanho de Papel:**
- Padrão: 80mm (role de papel térmico)
- Alternativa: A4 (impressora comum)

**Conteúdo Customizável:**
- Logo da loja
- Endereço e telefone
- Mensagem de rodapé
- CNPJ/CPF
- Número da máquina ECF

**Opções de Saída:**
```
1. Imprimir Direto (padrão)
2. Preview na tela (antes de imprimir)
3. Enviar por Email (futuro)
4. WhatsApp (futuro)
5. Duplicata (segunda via)
```

### 5.1.3 Fluxo de Impressão

```
Venda Finalizada com Sucesso
  ↓
Sistema Prepara Dados do Cupom
  ↓
Opção A: Imprimir Automático
  └─ Envia direto à impressora
  └─ Se erro, mostra: "Erro na impressora"

Opção B: Preview Antes
  └─ Mostra cupom formatado na tela
  └─ [Imprimir] [Cancelar]

Opção C: Não Imprimir
  └─ Cupom fica disponível para reimpressão
  └─ Menu: [Histórico] > Venda > [Reimprimir Cupom]

Se Impressão Falhar:
  ├─ Tenta novamente automaticamente (3x)
  ├─ Se continuar falhando, oferece:
  │  └─ "Impressora offline. Imprimir depois?"
  ├─ Salva cupom para reimprimir depois
  └─ Permite finalizar venda mesmo assim
```

---

## 6. BANCO DE DADOS

### 6.1 Tabela VENDAS

```sql
CREATE TABLE vendas (
  id SERIAL PRIMARY KEY,
  numero_venda VARCHAR(30) NOT NULL UNIQUE,  -- VEND-20260823-001234
  
  -- Informações da Venda
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  operador_id INT NOT NULL,
  caixa_id VARCHAR(10),  -- "#01"
  tipo_venda VARCHAR(20),  -- 'PDV' ou 'COMANDA'
  
  -- Valores
  total_bruto DECIMAL(10,2) NOT NULL,  -- Sem desconto
  desconto_valor DECIMAL(10,2) DEFAULT 0,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  desconto_tipo VARCHAR(20),  -- 'MANUAL', 'CUPOM', 'PERCENTUAL', 'VALOR'
  cupom_usado VARCHAR(50),  -- Código do cupom (se aplicável)
  total_liquido DECIMAL(10,2) NOT NULL,  -- Com desconto
  
  -- Pagamento
  forma_pagamento VARCHAR(50) NOT NULL,  -- 'DINHEIRO', 'DEBITO', 'CREDITO', 'PIX', 'COMBINADO'
  valor_recebido DECIMAL(10,2),  -- Só para dinheiro
  troco DECIMAL(10,2) DEFAULT 0,  -- Só para dinheiro
  
  -- Crédito
  parcelamento INT DEFAULT 1,  -- Número de parcelas
  
  -- Status
  status VARCHAR(20) DEFAULT 'finalizada',  -- 'finalizada', 'cancelada', 'devolvida'
  cancelado_em TIMESTAMP,
  motivo_cancelamento TEXT,
  
  -- Auditoria
  cupom_impresso BOOLEAN DEFAULT FALSE,
  data_impressao TIMESTAMP,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relacionamentos
  FOREIGN KEY (operador_id) REFERENCES usuarios(id),
  INDEX idx_data(data_hora),
  INDEX idx_operador(operador_id),
  INDEX idx_status(status)
);
```

### 6.2 Tabela ITENS_VENDA

```sql
CREATE TABLE itens_venda (
  id SERIAL PRIMARY KEY,
  venda_id INT NOT NULL,
  produto_id INT NOT NULL,
  
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,  -- Preço no momento da venda
  subtotal DECIMAL(10,2) NOT NULL,  -- quantidade × preco_unitario
  
  -- Desconto no item (raro, mas possível)
  desconto_item DECIMAL(10,2) DEFAULT 0,
  
  -- Lucro calculado
  preco_custo_unitario DECIMAL(10,2) NOT NULL,  -- Custo no momento
  lucro DECIMAL(10,2),  -- (preco_unitario - preco_custo) × quantidade
  
  -- Relacionamentos
  FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  
  INDEX idx_venda(venda_id),
  INDEX idx_produto(produto_id)
);
```

### 6.3 Tabela CUPONS_PROMOCIONAIS

```sql
CREATE TABLE cupons_promocionais (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,  -- PROMO10, BLACKFRIDAY
  
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL,  -- 'PERCENTUAL' ou 'VALOR'
  valor DECIMAL(10,2) NOT NULL,  -- 10 (para %) ou 50 (para R$)
  
  -- Restrições
  valor_minimo DECIMAL(10,2) DEFAULT 0,  -- Compra mínima para usar cupom
  usos_maximos INT,  -- NULL = ilimitado
  usos_atuais INT DEFAULT 0,
  
  -- Validade
  data_inicio TIMESTAMP NOT NULL,
  data_expiracao TIMESTAMP NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Auditoria
  criado_por INT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  INDEX idx_codigo(codigo),
  INDEX idx_data_expiracao(data_expiracao)
);
```

### 6.4 Tabela VENDAS_PENDENTES (Rascunhos)

```sql
CREATE TABLE vendas_pendentes (
  id SERIAL PRIMARY KEY,
  operador_id INT NOT NULL,
  
  cliente_nome VARCHAR(100),
  observacoes TEXT,
  
  itens JSON,  -- Armazena items como JSON
  total_bruto DECIMAL(10,2),
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP,  -- Limpa depois de 24h
  
  FOREIGN KEY (operador_id) REFERENCES usuarios(id),
  INDEX idx_operador(operador_id),
  INDEX idx_data_expiracao(data_expiracao)
);
```

### 6.5 Tabela PAGAMENTOS (Detalhamento)

```sql
CREATE TABLE pagamentos (
  id SERIAL PRIMARY KEY,
  venda_id INT NOT NULL,
  
  forma_pagamento VARCHAR(50) NOT NULL,  -- DINHEIRO, DEBITO, CREDITO, PIX
  valor DECIMAL(10,2) NOT NULL,
  
  -- Débito
  banco_id INT,  -- Referência ao banco
  numero_transacao_banco VARCHAR(100),
  
  -- Crédito
  numero_parcela INT DEFAULT 1,  -- Qual parcela (1 de 3, 2 de 3, etc)
  total_parcelas INT DEFAULT 1,
  valor_parcela DECIMAL(10,2),
  
  -- PIX
  id_transacao_pix VARCHAR(100),  -- ID retornado pelo Banco Central
  qr_code_dinamico TEXT,  -- QR Code gerado
  
  -- Dinheiro
  valor_recebido DECIMAL(10,2),
  troco DECIMAL(10,2),
  
  status VARCHAR(20),  -- 'pendente', 'processando', 'aprovado', 'cancelado'
  
  data_processamento TIMESTAMP,
  data_confirmacao TIMESTAMP,
  
  FOREIGN KEY (venda_id) REFERENCES vendas(id),
  INDEX idx_venda(venda_id)
);
```

---

## 7. API REST - ENDPOINTS

### 7.1 Endpoints de Busca de Produtos

**Base URL:** `http://localhost:3000/api/pdv`

#### **GET /api/pdv/produtos/buscar**
Buscar produtos por nome/SKU
```
Query Params:
  - termo: string (obrigatório, min 2 chars)
  - tipo: 'nome' | 'sku' | 'todos' (padrão: 'todos')
  - limite: int (padrão: 10)

Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 12345,
      "nome": "Hamburger Clássico",
      "sku": "HAM-001",
      "preco_venda": 35.00,
      "imagem_url": "/uploads/produtos/12345.jpg",
      "em_estoque": true,
      "quantidade_estoque": 45
    }
  ],
  "total": 2
}
```

#### **GET /api/pdv/produtos/categoria/{categoria_id}**
Listar todos os produtos de uma categoria
```
Response:
{
  "sucesso": true,
  "dados": [
    { ... produtos ... }
  ]
}
```

#### **GET /api/pdv/produtos/favoritos**
Listar últimos 5 produtos vendidos
```
Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 12345,
      "nome": "Hamburger Clássico",
      "vezes_vendido": 24,
      "preco_venda": 35.00
    }
  ]
}
```

### 7.2 Endpoints de Venda

#### **POST /api/pdv/vendas**
Criar nova venda
```
Body:
{
  "itens": [
    {
      "produto_id": 12345,
      "quantidade": 2,
      "preco_unitario": 35.00
    },
    {
      "produto_id": 67890,
      "quantidade": 1,
      "preco_unitario": 15.00
    }
  ],
  "total_bruto": 85.00,
  "desconto_valor": 0,
  "desconto_percentual": 0,
  "cupom_usado": null,
  "forma_pagamento": "DINHEIRO",
  "valor_recebido": 100.00,
  "troco": 15.00,
  "operador_id": 5
}

Response:
{
  "sucesso": true,
  "mensagem": "Venda realizada com sucesso",
  "dados": {
    "id": 54321,
    "numero_venda": "VEND-20260823-001234",
    "total_liquido": 85.00,
    "troco": 15.00,
    "cupom": {
      "id": 998877,
      "html": "<html>...cupom formatado...</html>"
    }
  }
}
```

#### **POST /api/pdv/vendas/aplicar-desconto**
Aplicar desconto a uma venda pendente
```
Body:
{
  "vendas_pendentes_id": 123,  // Se está em rascunho
  "tipo": "PERCENTUAL",  // ou "VALOR"
  "valor": 10,  // 10% ou R$ 10
  "cupom": "PROMO10"  // Optional
}

Response:
{
  "sucesso": true,
  "dados": {
    "desconto": 8.50,
    "total_anterior": 85.00,
    "total_novo": 76.50
  }
}
```

#### **POST /api/pdv/cupons/validar**
Validar cupom promocional
```
Body:
{
  "codigo": "PROMO10",
  "valor_compra": 85.00,
  "usuario_id": 5  // Para cupons pessoais
}

Response:
{
  "sucesso": true,
  "dados": {
    "cupom_id": 789,
    "tipo": "PERCENTUAL",
    "valor": 10,
    "desconto_aplicado": 8.50
  }
}

Erro:
{
  "sucesso": false,
  "mensagem": "Cupom expirado em 31/08/2026"
}
```

#### **GET /api/pdv/vendas/{id}/cupom**
Obter cupom de uma venda (para reimprimir)
```
Response:
{
  "sucesso": true,
  "dados": {
    "numero_venda": "VEND-20260823-001234",
    "html": "<html>...cupom formatado...</html>",
    "texto_bruto": "...cupom em texto..."
  }
}
```

#### **POST /api/pdv/vendas-pendentes**
Salvar carrinho como rascunho
```
Body:
{
  "cliente_nome": "João Silva",
  "observacoes": "Volta em 30 min",
  "itens": [...itens do carrinho...],
  "total": 85.00
}

Response:
{
  "sucesso": true,
  "dados": {
    "id": 123,
    "codigo": "RASC-001"
  }
}
```

#### **GET /api/pdv/vendas-pendentes**
Listar todas as vendas pendentes do operador
```
Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 123,
      "cliente_nome": "João Silva",
      "total": 85.00,
      "data_criacao": "2026-08-23T14:35:00Z"
    }
  ]
}
```

#### **GET /api/pdv/vendas-pendentes/{id}**
Recuperar venda pendente
```
Response:
{
  "sucesso": true,
  "dados": {
    "id": 123,
    "cliente_nome": "João Silva",
    "observacoes": "Volta em 30 min",
    "itens": [...],
    "total": 85.00
  }
}
```

#### **DELETE /api/pdv/vendas-pendentes/{id}**
Deletar venda pendente
```
Response:
{
  "sucesso": true,
  "mensagem": "Venda pendente deletada"
}
```

#### **POST /api/pdv/vendas/{id}/cancelar**
Cancelar uma venda finalizada
```
Body:
{
  "motivo": "Cliente solicitou devolução"
}

Response:
{
  "sucesso": true,
  "mensagem": "Venda cancelada com sucesso"
}
```

#### **GET /api/pdv/vendas/historico/dia**
Obter histórico de vendas do dia
```
Query Params:
  - operador_id: int (opcional)
  - data: date (padrão: hoje)

Response:
{
  "sucesso": true,
  "dados": {
    "total_vendas": 31,
    "total_faturamento": 1850.00,
    "desconto_total": 50.00,
    "ticket_medio": 58.75,
    "vendas": [...]
  }
}
```

---

## 8. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/pdv/
├── pages/
│   ├── PDVPage.jsx                  # Página principal PDV
│   ├── HistoricoVendasPage.jsx      # Histórico do dia
│   └── ConfiguracaoCAixaPage.jsx    # Abrir/Fechar caixa
│
├── components/
│   ├── BuscaProdutos.jsx            # Campo de busca + resultados
│   ├── CarrinhoProdutos.jsx         # Lista de itens
│   ├── ResumoVenda.jsx              # Subtotal, desconto, total
│   ├── ModalDesconto.jsx            # Modal de desconto
│   ├── ModalPagamento.jsx           # Seletor de forma pagamento
│   ├── PagamentoDinheiro.jsx        # Cálculo de troco
│   ├── PagamentoDebito.jsx
│   ├── PagamentoCredito.jsx         # Parcelamento
│   ├── PagamentoPIX.jsx             # QR Code e status
│   ├── ModalCupom.jsx               # Validação de cupom
│   ├── PreviewCupom.jsx             # Visualizar cupom
│   ├── BotaoRapido.jsx              # Atalho para produto
│   └── UltimosVendidos.jsx          # Histórico de últimas vendas
│
├── hooks/
│   ├── useCarrinho.js               # Estado do carrinho
│   ├── usePagamento.js              # Lógica de pagamento
│   ├── useCupom.js                  # Validação de cupom
│   └── useBusca.js                  # Busca com debounce
│
├── services/
│   ├── pdvService.js                # Chamadas API
│   └── impressoraService.js         # Impressão
│
├── utils/
│   ├── formatacao.js                # Formata preços, datas
│   ├── calculos.js                  # Cálculos de venda
│   └── validacoes.js                # Validações
│
├── styles/
│   ├── pdv.css
│   ├── carrinho.css
│   └── modal-pagamento.css
│
└── constants/
    ├── formasPagamento.js           # Tipos de pagamento
    └── mensagens.js                 # Mensagens de erro/sucesso
```

---

## 9. ESTRUTURA DE PASTAS (Backend)

```
src/modules/pdv/
├── vendas/
│   ├── vendasController.js
│   ├── vendasService.js
│   ├── vendasRepository.js
│   ├── vendasRoutes.js
│   ├── vendasValidacao.js
│   └── vendasModel.js
│
├── cupons/
│   ├── cuponController.js
│   ├── cuponService.js
│   ├── cuponRepository.js
│   ├── cuponRoutes.js
│   └── cuponModel.js
│
├── pagamentos/
│   ├── pagamentoService.js          # Integração com gateways
│   ├── pagamentoDinheiroService.js
│   ├── pagamentoPixService.js
│   ├── pagamentoCreditoService.js
│   └── pagamentoDebito Service.js
│
├── impressao/
│   ├── cupomService.js              # Geração de cupom
│   ├── impressoraService.js         # Comunicação com impressora
│   └── formatacaoCupom.js
│
├── busca/
│   ├── buscaController.js
│   ├── buscaService.js
│   └── buscaRoutes.js
│
└── middleware/
    ├── validacaoVenda.js
    ├── autorizacaoPagamento.js
    └── logger-vendas.js
```

---

## 10. CASOS DE USO DETALHADOS

### Caso de Uso 1: Venda Simples em Dinheiro

**Ator:** Operador de Caixa
**Tempo:** ~1 minuto

**Fluxo:**
1. Operador abre interface PDV
2. Campo de busca em foco
3. Digita "ham" (busca Hamburger)
4. Resultados aparecem
5. Clica em "Hamburger Clássico"
6. Modal pergunta: "Quantidade: 1 [+] [-]"
7. Muda para 2
8. Clica "Adicionar"
9. Item aparece no carrinho: "2x Hamburger = R$ 70,00"
10. Digita "refri"
11. Clica em "Refrigerante"
12. Define quantidade: 3
13. Adiciona
14. Carrinho agora mostra: R$ 94,00
15. Clica "Finalizar Venda"
16. Sistema mostra: [Dinheiro] [Débito] [Crédito] [PIX]
17. Clica "Dinheiro"
18. Modal abre:
    - Total: R$ 94,00
    - Valor Recebido: [100]
    - Troco: R$ 6,00
19. Clica "Confirmar"
20. Sistema processa
21. Cupom imprime
22. Toast: "Venda #VEND-20260823-001234 realizada!"
23. Carrinho limpa
24. Pronto para próxima venda

**Resultado:** Venda finalizada, estoque atualizado, lucro calculado.

---

### Caso de Uso 2: Venda com Desconto e Cupom

**Ator:** Operador
**Tempo:** ~2 minutos

**Fluxo:**
1. Cria venda: 1x Pizza = R$ 45,00
2. Clica "Aplicar Desconto"
3. Modal abre com opções
4. Digita Cupom: "PROMO10"
5. Sistema valida: ✅ Válido
6. Aplica 10% de desconto
7. Nova venda: R$ 45,00 - R$ 4,50 = R$ 40,50
8. Clica "Finalizar"
9. Seleciona "Débito"
10. Confirma
11. Venda realizada com desconto registrado
12. Cupom mostra: "Cupom PROMO10 - Desconto R$ 4,50"

**Resultado:** Desconto aplicado, auditoria registrada.

---

### Caso de Uso 3: Pagamento em Crédito Parcelado

**Ator:** Operador

**Fluxo:**
1. Venda total: R$ 150,00
2. Clica "Finalizar"
3. Seleciona "Crédito"
4. Modal mostra opções:
   - 1x R$ 150,00
   - 2x R$ 75,00
   - 3x R$ 50,00
   - 12x R$ 12,50
5. Operador clica em "3x"
6. Mostra:
   - 1ª Parcela: R$ 50,00
   - 2ª Parcela: R$ 50,00
   - 3ª Parcela: R$ 50,00
7. Clica "Confirmar"
8. Venda registrada com 3 parcelas
9. Cupom mostra detalhes do parcelamento

**Resultado:** Venda em 3x registrada, financeiro controlado.

---

### Caso de Uso 4: PIX Dinâmico

**Ator:** Operador + Cliente

**Fluxo Operador:**
1. Venda: R$ 89,00
2. Clica "Finalizar"
3. Seleciona "PIX"
4. Modal abre mostrando QR Code dinâmico
5. Timer: 05:00

**Fluxo Cliente:**
6. Escaneia QR Code com smartphone
7. App PIX abre automaticamente
8. Mostra: "Pagar R$ 89,00 para Restaurante XYZ"
9. Cliente confirma
10. Transferência processada

**Fluxo Operador Novamente:**
11. Sistema recebe webhook do banco
12. QR Code desaparece
13. Status muda para "Pago"
14. Cupom imprime automaticamente
15. Toast: "PIX recebido com sucesso!"

**Resultado:** Venda finalizada, dinheiro confirmado em tempo real.

---

### Caso de Uso 5: Venda Pendente (Rascunho)

**Ator:** Operador

**Fluxo:**
1. Cliente senta, pede comida
2. Operador abre PDV
3. Adiciona itens ao carrinho
4. Cliente diz: "Vou voltar em 30 min, deixa anotado"
5. Operador clica "Salvar como Rascunho"
6. Modal abre:
   - Nome: "João Silva"
   - Obs: "Volta em 30 min"
7. Clica "Salvar"
8. Rascunho salvo com ID: RASC-001
9. Carrinho limpa

**30 minutos depois:**
10. Cliente volta
11. Operador abre "Recuperar Rascunho"
12. Busca por: "João"
13. Encontra: "RASC-001 - R$ 85,00 - João Silva"
14. Clica "Recuperar"
15. Carrinho volta com os items anteriores
16. Finaliza venda normalmente

**Resultado:** Flexibilidade na operação, cliente atendido.

---

## 11. TELAS/MOCKUPS

### Tela 1: Interface PDV Principal

```
┌─────────────────────────────────────────────────────────────┐
│ 🍔 PDV RÁPIDO - Operador: João | Caixa: #01               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [🔍 Buscar produto... ]  [Categorias ▼]  [Favoritos ⭐]    │
│                                                              │
│ Últimos Vendidos:                                           │
│ [🍔 Hamburger] [🍟 Batata] [🥤 Refri]                      │
│                                                              │
│ ┌─────────────────────────────┐  ┌─────────────────────┐   │
│ │   PRODUTOS DISPONÍVEIS      │  │   CARRINHO          │   │
│ ├─────────────────────────────┤  ├─────────────────────┤   │
│ │                             │  │ 🍔 Hamburger x 2    │   │
│ │ [🍔 Hamburger   R$ 35,00]  │  │ R$ 35 x 2 = R$ 70  │   │
│ │ [🍟 Batata      R$ 15,00]  │  │                     │   │
│ │ [🍕 Pizza       R$ 45,00]  │  │ 🍟 Batata x 1      │   │
│ │ [🥤 Refrigerante R$ 8,00]  │  │ R$ 15 x 1 = R$ 15  │   │
│ │ [☕ Café        R$ 5,00]   │  │                     │   │
│ │                             │  │ 🥤 Refrigerante x3 │   │
│ │ (mais...)                   │  │ R$ 8 x 3 = R$ 24   │   │
│ │                             │  │                     │   │
│ │                             │  │ ─────────────────── │   │
│ │                             │  │ Subtotal: R$ 109,00│   │
│ │                             │  │ Desconto: R$ 0,00  │   │
│ │                             │  │ ─────────────────── │   │
│ │                             │  │ TOTAL: R$ 109,00   │   │
│ │                             │  │                     │   │
│ │                             │  │ [Desconto] [Limpar] │   │
│ │                             │  │                     │   │
│ │                             │  │ [Finalizar Venda]  │   │
│ │                             │  │                     │   │
│ │                             │  │ [Rascunho] [Hist.] │   │
│ └─────────────────────────────┘  └─────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tela 2: Modal de Pagamento em Dinheiro

```
┌──────────────────────────────────────┐
│ Pagamento em Dinheiro                │
├──────────────────────────────────────┤
│                                      │
│ Total a Pagar: R$ 109,00             │
│                                      │
│ Valor Recebido:                      │
│ [_____________] (ex: 110)            │
│                                      │
│ ─────────────────────────────────    │
│                                      │
│ Troco: R$ 1,00                       │
│                                      │
│ [Cancelar] [Confirmar Pagamento]    │
│                                      │
└──────────────────────────────────────┘
```

### Tela 3: Modal de Desconto

```
┌────────────────────────────────┐
│ Aplicar Desconto               │
├────────────────────────────────┤
│                                │
│ Tipo de Desconto:              │
│ [● Percentual] [○ Valor]       │
│                                │
│ Percentual: [10] %             │
│                                │
│ OU                             │
│                                │
│ Cupom/Código: [PROMO10____]    │
│ [Validar Cupom]                │
│                                │
│ Preview:                       │
│ Subtotal:      R$ 109,00       │
│ Desconto (10%): R$ 10,90       │
│ ─────────────────────────      │
│ Total:         R$ 98,10        │
│                                │
│ [Cancelar] [Aplicar Desconto]  │
│                                │
└────────────────────────────────┘
```

### Tela 4: Modal de PIX

```
┌────────────────────────────────┐
│ Pagamento por PIX              │
├────────────────────────────────┤
│                                │
│ Total a Pagar: R$ 89,00        │
│                                │
│ QR Code Dinâmico:              │
│ ┌──────────────────────────┐   │
│ │ ██ ██ ██ ██ ██ ██ ██   │   │
│ │ ██                    ██ │   │
│ │ ██  00051.62031      ██ │   │
│ │ ██  20260823143512   ██ │   │
│ │ ██                    ██ │   │
│ │ ██ ██ ██ ██ ██ ██ ██   │   │
│ └──────────────────────────┘   │
│                                │
│ ⏱️ Tempo restante: 04:35       │
│                                │
│ Aguardando confirmação...      │
│ (Assim que cliente pagar,      │
│  venda finaliza automaticamente)│
│                                │
│ [Cancelar] [Já Paguei]         │
│                                │
└────────────────────────────────┘
```

---

## 12. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup e Busca (1-2 semanas)
- [ ] Estrutura de pastas
- [ ] Setup banco de dados (tabelas VENDAS, ITENS_VENDA, CUPONS)
- [ ] Autenticação e autorização
- [ ] Componente de busca com debounce
- [ ] API de busca de produtos
- [ ] Testes

### Sprint 2: Carrinho e Operações (2 semanas)
- [ ] Componente do carrinho
- [ ] Adicionar/remover/editar quantidade
- [ ] Cálculos automáticos
- [ ] Rascunho de vendas
- [ ] Estado global (Context ou Redux)
- [ ] Testes

### Sprint 3: Descontos e Cupons (1-2 semanas)
- [ ] Modal de desconto (manual, percentual, valor)
- [ ] Sistema de validação de cupons
- [ ] API de cupons
- [ ] Testes

### Sprint 4: Pagamentos (2-3 semanas)
- [ ] Pagamento em dinheiro (troco)
- [ ] Pagamento em débito
- [ ] Pagamento em crédito (parcelamento)
- [ ] Pagamento em PIX (QR Code)
- [ ] Integração com gateways (futuro, mock por enquanto)
- [ ] Testes

### Sprint 5: Impressão e Finalização (1-2 semanas)
- [ ] Geração de cupom
- [ ] Integração com impressora
- [ ] Preview de cupom
- [ ] API de reimpressão
- [ ] Histórico de vendas
- [ ] Testes E2E

### Sprint 6: Polish e Deploy (1 semana)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Testes de carga
- [ ] Deploy em staging
- [ ] Validação com cliente

---

## 13. CHECKLIST ANTES DE INICIAR

- [ ] Requisitos com cliente finalizados
- [ ] Wireframes aprovados
- [ ] Banco de dados design aprovado
- [ ] Integração com gateways definida (qual usar)
- [ ] Impressora/modelo definido
- [ ] Ambiente dev configurado
- [ ] Git com padrão de commits
- [ ] CI/CD setup
- [ ] Logger/monitoring setup
- [ ] Postman/Insomnia com coleção de APIs
- [ ] Testes unitários configurados
- [ ] Testes E2E framework escolhido (Cypress/Playwright)

---

## 14. OBSERVAÇÕES IMPORTANTES

**Performance:**
- Busca com debounce (não fazer requisição a cada letra)
- Cache de últimos produtos
- Paginação em histórico
- Lazy loading de categorias

**Segurança:**
- Validação de todos os inputs
- Teto de desconto por operador
- Auditoria completa de vendas
- Logs de transações críticas
- Proteção contra duplicação de venda (UUID)

**UX:**
- Teclado em foco sempre
- Atalhos de teclado (Enter, ESC, números)
- Feedback visual imediato
- Toast messages para confirmações
- Confirmações em casos críticos

**Escalabilidade:**
- Pronto para múltiplos caixas
- Sincronização em tempo real (futuro)
- Suporte a offline (futuro)
- Fila de sincronização (futuro)

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento
