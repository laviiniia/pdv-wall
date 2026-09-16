# MÓDULO 2.3: PEDIDOS ONLINE VIA QR CODE COM RASTREAMENTO EM TEMPO REAL

## 📋 Sumário Executivo

**Objetivo:** Permitir que clientes façam pedidos diretamente da mesa via QR Code, acompanhem o preparo em tempo real, e recebam notificações automáticas. Gerenciar fila de pedidos da cozinha com painel Kanban dinâmico.

**Funcionalidades Principais:**
- ✅ QR Code único por mesa
- ✅ Menu digital responsivo (web, mobile)
- ✅ Customização de produtos (adições, remoções, extras)
- ✅ Sistema de fila inteligente (tempo estimado dinâmico)
- ✅ Painel de acompanhamento do cliente (real-time)
- ✅ Painel de cozinha Kanban (AGUARDANDO → PREPARANDO → PRONTO → ENTREGUE)
- ✅ Notificações em tempo real (WebSocket)
- ✅ Histórico e compartilhamento de pedidos
- ✅ Avaliação de pedido

**Perfis de Acesso:**
- Cliente (não autenticado) - fazer pedido, acompanhar
- Operador Cozinha - gerenciar status
- Gerente - relatórios, fila
- Admin - tudo

**Tempo de Experiência Alvo:**
- Menu/Pedido: ~3-5 minutos
- Acompanhamento: Real-time
- Entrega: Notificação automática

---

## 1. FUNCIONALIDADE 1.1: GERAÇÃO E GERENCIAMENTO DE QR CODES

### 1.1.1 Estrutura de Mesas

```
Restaurante tem 20 mesas:
├── Mesa #01
├── Mesa #02
├── Mesa #03
├── ...
└── Mesa #20

Cada mesa tem:
├── ID único (01, 02, 03...)
├── QR Code único
├── Status (disponível/ocupada/reservada/limpando)
├── Link: https://pdv.empresa.com/mesa/MESA-001-ABC123XYZ
└── Código curto: MESA-001
```

### 1.1.2 Geração de QR Code

**Fluxo no Admin:**

```
┌──────────────────────────────┐
│ Admin vai para:              │
│ Configurações > Mesas        │
└────────────┬─────────────────┘
             │
┌────────────┴─────────────────┐
│ Vê lista de todas as mesas   │
│ ┌─────────────────────────┐  │
│ │ Mesa #01  [Editar] [QR] │  │
│ │ Mesa #02  [Editar] [QR] │  │
│ │ Mesa #03  [Editar] [QR] │  │
│ └─────────────────────────┘  │
└────────────┬─────────────────┘
             │
┌────────────┴──────────────────────┐
│ Clica [QR] em Mesa #01            │
└────────────┬──────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Gera QR Code:                 │
│ ┌──────────────────────────────────┐  │
│ │ ██ ██ ██ ██ ██ ██ ██ ██ ██     │  │
│ │ ██                            ██│  │
│ │ ██  URL: https://pdv.e...     ██│  │
│ │ ██  Código: MESA-001-ABC123    ██│  │
│ │ ██                            ██│  │
│ │ ██ ██ ██ ██ ██ ██ ██ ██ ██     │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [Imprimir] [Baixar PNG] [Copiar Link] │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Opções:                               │
│ 1. Imprimir e colar na mesa            │
│ 2. Salvar em arquivo                  │
│ 3. Compartilhar link em grupo         │
└──────────────────────────────────────┘
```

### 1.1.3 Dados do QR Code

**Formato da URL:**
```
https://pdv.empresa.com/mesa/{MESA_ID}

Onde MESA_ID é codificado com:
├── ID da mesa (01)
├── Token único (ABC123XYZ)
├── Hash de segurança
└── Timestamp (gerado)

Exemplo Completo:
https://pdv.empresa.com/mesa/MESA-001-ABC123XYZ-20260823

Ou versão curta:
https://pdv.empresa.com/m/001
```

**Validação de Segurança:**
- QR Code não pode ser usado por mesas diferentes
- Se cliente usa link de Mesa #01 em Mesa #02, aviso: "Este QR é da Mesa #01"
- Cada scan registra IP e timestamp
- Rate limiting: Máximo 5 pedidos por mesa por hora

### 1.1.4 Banco de Dados - Tabela MESAS

```sql
CREATE TABLE mesas (
  id SERIAL PRIMARY KEY,
  numero_mesa INT NOT NULL UNIQUE,  -- 1, 2, 3...
  
  -- QR Code
  qrcode_id VARCHAR(50) NOT NULL UNIQUE,  -- MESA-001-ABC123XYZ
  qrcode_url TEXT NOT NULL,  -- URL completa
  qrcode_token VARCHAR(100) NOT NULL,  -- Token para validação
  
  -- Status
  status VARCHAR(20) DEFAULT 'disponivel',  -- disponivel, ocupada, reservada, limpando
  pedido_ativo INT,  -- FK para pedido em andamento
  
  -- Configurações
  capacidade_pessoas INT DEFAULT 4,
  ativa BOOLEAN DEFAULT TRUE,
  
  -- Auditoria
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (pedido_ativo) REFERENCES pedidos_online(id),
  INDEX idx_numero(numero_mesa),
  INDEX idx_qrcode(qrcode_id),
  INDEX idx_status(status)
);
```

---

## 2. FUNCIONALIDADE 2.1: MENU DIGITAL INTERATIVO

### 2.1.1 Acesso ao Menu

**Fluxo do Cliente:**

```
┌────────────────────────────────┐
│ Cliente Escaneia QR na Mesa    │
└────────────┬───────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Smartphone Abre Navegador              │
│ URL: https://pdv.empresa.com/mesa/001 │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Valida:                       │
│ ├─ QR Code é válido?                 │
│ ├─ Mesa existe?                       │
│ ├─ Mesa está ativa?                   │
│ └─ Token não expirou?                 │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Página Carrega (Responsive Design)    │
│ ✅ Mobile-first (90% dos casos)       │
│ ✅ Tablet (5%)                        │
│ ✅ Desktop (5%)                       │
└────────────┬──────────────────────────┘
             │
            ▼
┌────────────────────────────────────────┐
│ MENU DIGITAL CARREGADO                 │
│ ┌──────────────────────────────────┐   │
│ │ 🍔 RESTAURANTE FASTFOOD          │   │
│ │ Mesa #01 - Token: ABC123         │   │
│ │                                  │   │
│ │ [🔄 Atualizar] [📋 Histórico]   │   │
│ │                                  │   │
│ │ Categorias:                      │   │
│ │ [Lanches] [Pizzas] [Bebidas]    │   │
│ │ [Sobremesas] [Complementos]     │   │
│ │                                  │   │
│ │ LANCHES:                        │   │
│ │ 🍔 Hamburger Clássico           │   │
│ │    R$ 35,00                     │   │
│ │    Descrição: Carne, alface...  │   │
│ │    [+ Adicionar]                │   │
│ │                                  │   │
│ │ 🍕 Sanduíche X-Tudo             │   │
│ │    R$ 28,00                     │   │
│ │    [+ Adicionar]                │   │
│ │                                  │   │
│ │ (mais produtos...)              │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Rodapé:                                │
│ [Carrinho] (3) ........................ │
│ [Confirmar Pedido]                     │
└────────────────────────────────────────┘
```

### 2.1.2 Estrutura do Menu

**Categorias Padrão:**
```
Categoria: Lanches
├── Hamburger Clássico (R$ 35,00)
├── Hamburger Premium (R$ 45,00)
├── Sanduíche X-Tudo (R$ 28,00)
└── Cachorro Quente (R$ 15,00)

Categoria: Pizzas
├── Margherita (R$ 45,00)
├── Calabresa (R$ 48,00)
├── Vegetariana (R$ 42,00)
└── 4 Queijos (R$ 52,00)

Categoria: Bebidas
├── Refrigerante 2L (R$ 8,00)
├── Suco Natural (R$ 12,00)
├── Água 500ml (R$ 2,00)
└── Cerveja 350ml (R$ 6,00)

Categoria: Sobremesas
├── Brigadeiro (R$ 5,00)
├── Pudim (R$ 7,00)
└── Sorvete (R$ 8,00)

Categoria: Complementos
├── Batata Frita Extra (R$ 15,00)
├── Mozzarella Frita (R$ 12,00)
└── Sauces (R$ 2,00)
```

### 2.1.3 Informações de Cada Produto

```
┌─────────────────────────────────────┐
│ 🍔 HAMBURGER CLÁSSICO               │
├─────────────────────────────────────┤
│                                     │
│ [Imagem do Produto]                 │
│                                     │
│ Descrição:                          │
│ "Hambúrgueres de 200g feito com    │
│  carne vermelha de primeira        │
│  qualidade, acompanhado de alface,  │
│  tomate, cebola e nosso molho      │
│  especial."                         │
│                                     │
│ Preço: R$ 35,00                     │
│                                     │
│ Tempo de Preparo: ~15 min           │
│ Disponível: ✅ Sim                  │
│                                     │
│ Alergia/Restrição:                  │
│ ⚠️ Contém glúten                    │
│ ⚠️ Contém lactose (queijo)          │
│ ℹ️ Pode retirar cebola              │
│                                     │
│ [Voltar] [Adicionar ao Carrinho]   │
│                                     │
└─────────────────────────────────────┘
```

### 2.1.4 Banco de Dados - Tabela MENU_DIGITAL

```sql
CREATE TABLE menu_digital (
  id SERIAL PRIMARY KEY,
  produto_id INT NOT NULL,
  
  -- Exibição no Menu
  titulo_menu VARCHAR(100),  -- Nome exibido
  descricao_menu TEXT,  -- Descrição curta
  imagem_menu VARCHAR(255),  -- Caminho da imagem
  
  -- Visibilidade
  ativo_no_menu BOOLEAN DEFAULT TRUE,
  ordem_exibicao INT,  -- 1, 2, 3... (ordena produtos)
  
  -- Avisos
  contem_alergeno TEXT,  -- JSON: ["glúten", "lactose", "amendoim"]
  aviso_especial TEXT,  -- "Longo tempo de preparo (30 min)"
  
  -- Tempo de Preparo
  tempo_preparo_padrao INT,  -- Minutos (ex: 15)
  tempo_preparo_maximo INT,  -- Para cálculo dinâmico (ex: 20)
  
  -- Customizações
  permite_customizacoes BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  INDEX idx_produto(produto_id),
  INDEX idx_ativo(ativo_no_menu),
  INDEX idx_ordem(ordem_exibicao)
);
```

---

## 3. FUNCIONALIDADE 3.1: CUSTOMIZAÇÃO DE PRODUTOS

### 3.1.1 Tipos de Customização

**Tipo 1: Adições (Extras)**

```
Hambúrgueres podem ter:
├── Queijo Extra (+R$ 3,00)
├── Bacon (+R$ 5,00)
├── Ovo (+R$ 4,00)
├── Alface Extra (+R$ 1,00)
└── Molho Extra (+R$ 1,00)

Cliente Seleciona: Queijo Extra + Bacon
Preço Original: R$ 35,00
Adições: +R$ 8,00
Novo Preço: R$ 43,00
```

**Tipo 2: Remoções**

```
Pizza padrão: Calabresa, Cebola, Azeitona

Cliente quer remover:
✓ Sem Cebola
✓ Sem Azeitona

Preço não muda (é remoção, não desconto)
```

**Tipo 3: Substituições**

```
X-Burger padrão: Hambúrguer + Queijo + Bacon

Cliente quer:
✓ Trocar Bacon por Frango (+R$ 2,00)
✓ Trocar Queijo por Queijo Cheddar (+R$ 1,00)

Novo Preço: R$ 35,00 + 3,00 = R$ 38,00
```

**Tipo 4: Observações/Notas**

```
Campo livre: "Preparo especial"

Exemplos:
├── "Muito molho"
├── "Pouco sal"
├── "Sem gelo" (para bebidas)
├── "Bem quente"
└── "Carne bem feita"

Máximo: 100 caracteres
Vai impresso na cozinha
```

### 3.1.2 Fluxo de Customização

```
┌─────────────────────────────────┐
│ Cliente Clica em Produto        │
│ "Hamburger Clássico"            │
└────────────┬─────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Modal de Customização Abre:           │
│                                       │
│ 🍔 HAMBURGER CLÁSSICO                 │
│ Preço Base: R$ 35,00                  │
│                                       │
│ ADIÇÕES (Marque as que deseja):       │
│ ☐ Queijo Extra (+R$ 3,00)             │
│ ☐ Bacon (+R$ 5,00)                    │
│ ☐ Ovo (+R$ 4,00)                      │
│ ☐ Alface Extra (+R$ 1,00)             │
│                                       │
│ REMOÇÕES (O que tirar):               │
│ ☐ Sem Cebola                          │
│ ☐ Sem Tomate                          │
│ ☐ Sem Alface                          │
│                                       │
│ OBSERVAÇÕES:                          │
│ [Bem quente, sem cebola _____]       │
│                                       │
│ ────────────────────────────────     │
│ Preço Final: R$ 43,00                 │
│ Tempo de Preparo: ~15 min             │
│                                       │
│ [Cancelar] [Adicionar Carrinho]       │
│                                       │
└────────────┬──────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│ Cliente Clica "Adicionar Carrinho"     │
└────────────┬─────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│ Sistema Adiciona:                      │
│ • Produto: Hamburger Clássico          │
│ • Preço: R$ 43,00                      │
│ • Customizações: Queijo + Bacon        │
│ • Observações: "Bem quente..."         │
│ • Timestamp: 14:35:20                  │
│                                        │
│ Carrinho Atualiza:                     │
│ "1x Hamburger Clássico - R$ 43,00"    │
│                                        │
│ Toast: "Produto adicionado"            │
└────────────┬────────────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Menu Volta com Carrinho Visível  │
│ [Carrinho] (1) R$ 43,00          │
│ [+ Continuar Comprando]          │
└──────────────────────────────────┘
```

### 3.1.3 Banco de Dados - Customizações

```sql
CREATE TABLE customizacoes_produto (
  id SERIAL PRIMARY KEY,
  produto_id INT NOT NULL,
  
  -- Tipo de Customização
  tipo VARCHAR(20) NOT NULL,  -- 'ADICAO', 'REMOCAO', 'SUBSTITUICAO'
  nome VARCHAR(100) NOT NULL,  -- "Queijo Extra", "Sem Cebola"
  
  -- Preço
  valor_adicional DECIMAL(10,2) DEFAULT 0,  -- +R$ 3,00 (para adições)
  descricao TEXT,
  
  -- Visibilidade
  ativo BOOLEAN DEFAULT TRUE,
  ordem INT,  -- Para ordenação no formulário
  
  -- Auditoria
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  INDEX idx_produto(produto_id),
  INDEX idx_tipo(tipo)
);

-- Exemplo de Inserção:
INSERT INTO customizacoes_produto (produto_id, tipo, nome, valor_adicional)
VALUES 
  (12345, 'ADICAO', 'Queijo Extra', 3.00),
  (12345, 'ADICAO', 'Bacon', 5.00),
  (12345, 'ADICAO', 'Ovo', 4.00),
  (12345, 'REMOCAO', 'Sem Cebola', 0),
  (12345, 'REMOCAO', 'Sem Tomate', 0);
```

---

## 4. FUNCIONALIDADE 4.1: CARRINHO E CONFIRMAÇÃO DE PEDIDO

### 4.1.1 Carrinho do Menu Digital

```
┌──────────────────────────────────────┐
│ 🛒 SEU CARRINHO                      │
├──────────────────────────────────────┤
│                                      │
│ 1x Hamburger Clássico       R$ 43,00│
│   • Queijo Extra                     │
│   • Bacon                            │
│   • Obs: "Bem quente"                │
│   [−] [+] [×]                        │
│                                      │
│ 1x Pizza Calabresa          R$ 48,00│
│   • Sem Cebola                       │
│   [−] [+] [×]                        │
│                                      │
│ 3x Refrigerante 2L          R$ 24,00│
│   [−] [+] [×]                        │
│                                      │
│ ──────────────────────────────────── │
│ SUBTOTAL:                   R$ 115,00│
│                                      │
│ [Cupom Desconto] ________________    │
│                                      │
│ TOTAL:                      R$ 115,00│
│                                      │
│ Tempo Estimado de Preparo: ~20 min   │
│                                      │
│ [Voltar ao Menu] [Confirmar Pedido]  │
│                                      │
└──────────────────────────────────────┘
```

### 4.1.2 Fluxo de Confirmação

```
┌────────────────────────────────────┐
│ Cliente Clica "Confirmar Pedido"   │
└────────────┬────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Valida:                       │
│ ✓ Carrinho não está vazio?            │
│ ✓ Mesa existe e está ativa?           │
│ ✓ Token de mesa é válido?             │
│ ✓ Produtos existem no BD?             │
│ ✓ Produtos têm preço?                 │
│ ✓ Produtos estão ativos?              │
│ ✓ Produtos têm estoque?               │
│ ✓ Cupom (se houver) é válido?         │
└────────────┬──────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ✅ OK        ❌ Erro
      │             │
      ▼             ▼
 Prossegue    Mostra Erro:
           "Desculpe, Hamburger não
            tem mais estoque.
            Remova do carrinho?"
             [Remover] [Voltar]
      │
┌─────┴──────────────────────────────────┐
│ Abre Modal de Informações do Cliente   │
│                                        │
│ INFORMAÇÕES DO PEDIDO:                 │
│                                        │
│ Nome (opcional):                       │
│ [João Silva____________]              │
│                                        │
│ Telefone (opcional):                   │
│ [(11) 98765-4321_____]                 │
│                                        │
│ Alergias/Restrições:                   │
│ [Intolerância à lactose___]            │
│                                        │
│ Observações do Pedido:                 │
│ [Não tenho pressa, deixa melhor]      │
│                                        │
│ [Voltar] [Confirmar Pedido Final]      │
│                                        │
└────────────┬──────────────────────────┘
             │
┌────────────┴─────────────────────────┐
│ Cliente Clica "Confirmar"            │
│ Sistema Cria Pedido no BD:           │
│                                      │
│ INSERT INTO pedidos_online (        │
│   mesa_id: 1,                       │
│   itens: [...],                     │
│   total: 115.00,                    │
│   status: 'confirmado',             │
│   tempo_estimado: 20,               │
│   cliente_nome: 'João Silva',       │
│   ...                               │
│ )                                   │
│                                      │
│ ID Gerado: PEDIDO-20260823-001234   │
│ Token Rastreamento: XYZ789ABC       │
│                                      │
└────────────┬─────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Envia Notificação:            │
│ • Cozinha recebe: "Novo Pedido!"     │
│ • Cliente vê: "Pedido Confirmado!"   │
│ • Abre Painel de Rastreamento        │
│                                       │
│ Toast: "Pedido #PEDIDO-001234        │
│ confirmado! Tempo: ~20 min"           │
│                                       │
│ [Ver Pedido] [Fechar]                │
│                                       │
└──────────────────────────────────────┘
```

---

## 5. FUNCIONALIDADE 5.1: SISTEMA DE FILA INTELIGENTE

### 5.1.1 Cálculo de Tempo Estimado

**Fórmula Base:**
```
tempo_estimado_pedido = max(tempos_preparo_produtos) + tempo_espera_fila

Onde:
- max(tempos_preparo_produtos) = maior tempo entre todos os produtos
- tempo_espera_fila = soma dos tempos dos pedidos na frente
```

**Exemplo 1: Sem Fila**
```
Pedido #1:
├── Hamburger (15 min)
├── Pizza (20 min)
├── Refrigerante (0 min)
└── max = 20 min

Fila anterior: 0 pedidos
Tempo Espera: 0 min

Tempo Estimado = 20 + 0 = 20 minutos
```

**Exemplo 2: Com Fila**
```
Pedido #1 (na cozinha): 15 min restantes
Pedido #2 (na cozinha): 10 min restantes
Pedido #3 (NOVO - cliente):
├── Pizza (20 min)
└── max = 20 min

Tempo Espera Fila = max(15, 10) = 15 min
(aguarda os anteriores finalizarem)

Tempo Estimado = 20 + 15 = 35 minutos
```

**Exemplo 3: Múltiplos Produtos**
```
Pedido #NEW:
├── Hambúrgueres (15 min)
├── Pizza (20 min)
├── Fritura (10 min)
├── Bebida (0 min)
└── max = 20 min

Fila:
├── Pedido #1 (5 min restantes)
├── Pedido #2 (12 min restantes)
└── max = 12 min

Tempo Estimado = 20 + 12 = 32 minutos
```

### 5.1.2 Atualização Dinâmica de Tempo

**Cenário 1: Pedido Finalizado Cedo**

```
Tempo Original: 20 min
Tempo Real: 18 min (finalizado antes)

Sistema Recalcula Fila:
└─ Todos os pedidos esperando ganham 2 min

Pedidos na fila:
├── #002: 35 min → 33 min (atualizado)
├── #003: 38 min → 36 min (atualizado)
└── #004: 40 min → 38 min (atualizado)

Clientes recebem notificação:
"Tempo reduzido! Seu pedido saí às 14:55"
```

**Cenário 2: Produto com Problema**

```
Pizza em preparo: 15 min transcorridos, faltam 5 min
Problema: Cozinheiro recomença a pizza

Tempo agora: 20 min (recomeça do zero)

Fila:
├── #002: +5 min (novo tempo estimado)
├── #003: +5 min
└── #004: +5 min

Clientes recebem notificação (sem detalhes):
"Seu pedido está em preparação (tempo atualizado)"
```

**Cenário 3: Cozinha Preparando Vários ao Mesmo Tempo**

```
Cozinha tem 3 pessoas:
├── Pessoa 1: Preparando Pizza #001 (10 min)
├── Pessoa 2: Preparando Hambúrguer #002 (5 min)
└── Pessoa 3: Preparando Frtura #003 (8 min)

Novo Pedido #004 (Pizza + Hambúrguer):
├── Pizza: 15 min
├── Hambúrguer: 10 min
└── max = 15 min

Sistema analisa carga:
└─ Uma pessoa ficará livre em 10 min (Hambúrguer #002)
└─ Ela pode começar Hambúrguer do #004

Tempo de espera reduzido para 5 min (até Pizza sair)
Tempo Estimado = 15 + 5 = 20 min
```

### 5.1.3 Banco de Dados - Cálculos de Fila

```sql
-- Visualizar fila em tempo real (pseudo-código SQL)

SELECT 
  p.id,
  p.numero_pedido,
  p.status,
  p.tempo_preparo_estimado,
  p.tempo_preparo_restante,
  (SELECT SUM(pr.tempo_preparo_padrao)
   FROM pedidos_online p2
   JOIN itens_pedido ip ON ip.pedido_id = p2.id
   JOIN produtos pr ON pr.id = ip.produto_id
   WHERE p2.id < p.id
   AND p2.status IN ('confirmado', 'preparando')
  ) AS tempo_espera_fila,
  
  -- Tempo total estimado (recalculado a cada segundo)
  (p.tempo_preparo_estimado + 
   COALESCE(
     (SELECT MAX(pp.tempo_preparo_padrao)
      FROM pedidos_online p2
      JOIN itens_pedido ip2 ON ip2.pedido_id = p2.id
      JOIN produtos pp ON pp.id = ip2.produto_id
      WHERE p2.id < p.id
      AND p2.status IN ('confirmado', 'preparando')), 
     0
   )
  ) AS tempo_total_estimado

FROM pedidos_online p
WHERE p.mesa_id = 1
AND p.status IN ('confirmado', 'preparando', 'pronto')
ORDER BY p.id ASC;
```

---

## 6. FUNCIONALIDADE 6.1: PAINEL DE ACOMPANHAMENTO DO CLIENTE

### 6.1.1 Interface de Rastreamento

```
┌───────────────────────────────────────────────┐
│ 📱 ACOMPANHE SEU PEDIDO                       │
├───────────────────────────────────────────────┤
│                                               │
│ Número do Pedido: #PEDIDO-20260823-001234    │
│ Status: Preparando                            │
│                                               │
│ ═══════════════════════════════════════════  │
│ TIMELINE DE STATUS:                           │
│ ═══════════════════════════════════════════  │
│                                               │
│ ✅ CONFIRMADO           14:35:20             │
│    "Seu pedido foi recebido"                 │
│                                               │
│ ⏳ PREPARANDO           14:36:50 → Agora    │
│    "Seu pedido está sendo preparado"         │
│    Tempo no forno: ████░░░░░░ 40%            │
│    Tempo estimado: ~12 min                   │
│                                               │
│ ⭕ PRONTO (em breve)    ~14:50               │
│    "Seu pedido estará pronto"                │
│                                               │
│ ⭕ ENTREGUE             ---                  │
│    "Aproveite sua refeição!"                 │
│                                               │
│ ═══════════════════════════════════════════  │
│                                               │
│ POSIÇÃO NA FILA: 3 de 5 pedidos              │
│ • Pedido #1 (seu hambúrguer)                │
│ • Pedido #2 (sua pizza)                     │
│ • ➜ Pedido #3 (você) ← SEU PEDIDO           │
│ • Pedido #4                                  │
│ • Pedido #5                                  │
│                                               │
│ RESUMO DO PEDIDO:                           │
│ 1x Hamburger Clássico      R$ 43,00         │
│ 1x Pizza Calabresa         R$ 48,00         │
│ 3x Refrigerante            R$ 24,00         │
│ ─────────────────────────────────────       │
│ TOTAL: R$ 115,00                            │
│                                               │
│ ═════════════════════════════════════════   │
│                                               │
│ [🔄 Atualizar] [📤 Compartilhar] [⭐ Avaliar]│
│                                               │
│ [Chamar Garçom] [Cancelar Pedido]           │
│                                               │
└───────────────────────────────────────────────┘
```

### 6.1.2 Notificações em Tempo Real

**Implementação com WebSocket:**

```javascript
// Cliente conecta ao servidor WebSocket
const socket = io('https://pdv.empresa.com/socket');

// Subscreve ao pedido específico
socket.emit('subscribe_pedido', {
  pedido_id: 'PEDIDO-001234',
  token: 'XYZ789ABC'  // Token de segurança
});

// Eventos que cliente pode receber:

// 1. Pedido confirmado
socket.on('pedido_confirmado', (data) => {
  // {
  //   pedido_id: 'PEDIDO-001234',
  //   status: 'confirmado',
  //   tempo_estimado: 20,
  //   posicao_fila: 1
  // }
  
  showNotification('Pedido confirmado! Saírá em ~20 min');
  updateTimeline();
});

// 2. Pedido em preparação
socket.on('pedido_preparando', (data) => {
  // {
  //   pedido_id: 'PEDIDO-001234',
  //   status: 'preparando',
  //   tempo_restante: 12,
  //   progresso: 40
  // }
  
  showNotification('Seu pedido está sendo preparado');
  updateProgressBar(40);
  updateTimeRemaining(12);
});

// 3. Tempo atualizado dinamicamente
socket.on('tempo_atualizado', (data) => {
  // {
  //   pedido_id: 'PEDIDO-001234',
  //   novo_tempo_estimado: 18,
  //   motivo: 'fila_reduzida'
  // }
  
  showNotification('Bom! Seu pedido saírá mais cedo: ~18 min');
});

// 4. Pedido pronto
socket.on('pedido_pronto', (data) => {
  // {
  //   pedido_id: 'PEDIDO-001234',
  //   status: 'pronto',
  //   mensagem: 'Seu pedido está pronto! Chamaremos seu número.',
  //   numero_chamada: 'MESA #001'
  // }
  
  showNotification('🔔 PRONTO! Seu pedido está pronto!');
  playSound('chime.mp3');
  updateTimeline();
  vibrate(200);
});

// 5. Pedido entregue
socket.on('pedido_entregue', (data) => {
  // {
  //   pedido_id: 'PEDIDO-001234',
  //   status: 'entregue',
  //   hora_entrega: '14:50:30'
  // }
  
  showNotification('Pedido entregue! Aproveite sua refeição! 😋');
  showAvaliacaoPrompt();
});

// 6. Pedido cancelado (por problema)
socket.on('pedido_cancelado', (data) => {
  // {
  //   pedido_id: 'PEDIDO-001234',
  //   motivo: 'produto_sem_estoque',
  //   detalhes: 'Pizza Calabresa saiu do estoque'
  // }
  
  showNotification(
    'Desculpe! Tivemos um problema com seu pedido. ' +
    'Fale com nosso garçom para mais informações.'
  );
});
```

### 6.1.3 Compartilhamento de Pedido

**Link Compartilhável:**

```
https://pdv.empresa.com/rastreamento/PEDIDO-001234/XYZ789ABC

Quando alguém abre o link:
├── Vê timeline do pedido
├── NÃO pode cancelar (apenas quem pediu)
├── NÃO pode chamar garçom (apenas quem pediu)
├── Pode avaliar (público)
└── Útil para acompanhar de outro lugar

Exemplo de Uso:
Cliente pediu, saiu da mesa
Manda link para amigo: "Meu hambúrguer sai em 15 min"
Amigo acompanha junto
```

---

## 7. FUNCIONALIDADE 7.1: PAINEL DE COZINHA (OPERADOR)

### 7.1.1 Interface Kanban

```
┌──────────────────────────────────────────────────────────────┐
│ 🍳 PAINEL DE COZINHA - Restaurante XYZ                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Filtro: Todos] [Apenas Meus] [Urgentes] [Última Hora]      │
│ [🔄 Auto-Atualizar: ON] [Som: ON]                           │
│                                                               │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐
│ │ 🔴 AGUARDANDO │ 🟠 PREPARANDO │ 🟢 PRONTO   │ 🔵 ENTREGUE  │
│ ├──────────────┼──────────────┼──────────────┼──────────────┤
│ │ 5 pedidos    │ 3 pedidos    │ 2 pedidos    │ 12 pedidos   │
│ │ Fila: 1-2h   │ Tempo: 12min │ Aguardando   │ Hoje        │
│ │              │              │ entrega      │              │
│ ├──────────────┼──────────────┼──────────────┼──────────────┤
│ │              │              │              │              │
│ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ │#PEDIDO-01│ │ │#PEDIDO-03│ │ │#PEDIDO-02│ │ │#PEDIDO-08│ │
│ │ │Mesa: #02 │ │ │Mesa: #05 │ │ │Mesa: #01 │ │ │Mesa: #03 │ │
│ │ │Timer: 0s │ │ │Timer: 8m │ │ │Pronto!   │ │ │14:35     │ │
│ │ │          │ │ │          │ │ │          │ │ │          │ │
│ │ │1x Hamb.  │ │ │1x Pizza  │ │ │1x Hamb.  │ │ │1x Hamb.  │ │
│ │ │1x Pizza  │ │ │2x Bebida │ │ │1x Pizza  │ │ │1x Pizza  │ │
│ │ │3x Bebida │ │ │Obs: Qdo  │ │ │3x Bebida │ │ │3x Bebida │ │
│ │ │          │ │ │bem quente│ │ │          │ │ │          │ │
│ │ │[Prox...] │ │ │[Pronto]  │ │ │[Entreg.] │ │ │[Hist]    │ │
│ │ └──────────┘ │ │ [Pausar]  │ │ │[Cancelar]│ │ │          │ │
│ │              │ │ └──────────┘ │ │[Reabrir] │ │ │          │ │
│ │ ┌──────────┐ │ │              │ └──────────┘ │ │ ┌──────┐  │
│ │ │#PEDIDO-02│ │ │ ┌──────────┐ │              │ │ │...12 │  │
│ │ │Mesa: #04 │ │ │ │#PEDIDO-04│ │ ┌──────────┐ │ │ │ped. │  │
│ │ │Timer: 2s │ │ │ │Mesa: #06 │ │ │#PEDIDO-05│ │ │ │      │  │
│ │ │...       │ │ │ │Timer: 2m │ │ │Mesa: #08 │ │ │ │      │  │
│ │ │          │ │ │ │...       │ │ │Pronto!   │ │ │ └──────┘  │
│ │ │[Começar] │ │ │ │[Pausar]  │ │ │[Entreg.] │ │ │          │
│ │ │[Urgente] │ │ │ │ └──────────┘ │ │          │ │          │
│ │ └──────────┘ │ │              │ │          │ │          │
│ │              │ │ ┌──────────┐ │ └──────────┘ │          │
│ │ ┌──────────┐ │ │ │#PEDIDO-06│ │              │          │
│ │ │#PEDIDO-05│ │ │ │Mesa: #07 │ │ ┌──────────┐ │          │
│ │ │Mesa: #09 │ │ │ │Timer: 5m │ │ │#PEDIDO-07│ │          │
│ │ │Timer: 5s │ │ │ │...       │ │ │Mesa: #10 │ │          │
│ │ │...       │ │ │ │[Pronto]  │ │ │Pronto!   │ │          │
│ │ │          │ │ │ │[Pausar]  │ │ │[Entreg.] │ │          │
│ │ │[Começar] │ │ │ │[Cancelar]│ │ │          │ │          │
│ │ │ [Urgente]│ │ │ └──────────┘ │ │          │ │          │
│ │ └──────────┘ │ │              │ └──────────┘ │          │
│ │              │ │              │              │          │
│ │              │ │              │              │          │
│ └──────────────┴──────────────────┴──────────────┴──────────┘
│                                                               │
│ ESTATÍSTICAS RODAPÉ:                                         │
│ Tempo Médio: 18 min | Pedidos Hoje: 47 | Faturamento: R$ 1.850
│ Fila: 12 min | Ocupação: 85%                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.1.2 Operações do Painel Kanban

**Operação 1: Começar Preparação**

```
Cozinheiro vê pedido em "AGUARDANDO"
Clica [Começar] ou arrasta para "PREPARANDO"

Sistema:
├── Muda status: AGUARDANDO → PREPARANDO
├── Inicia timer (tempo estimado)
├── Notifica cliente: "Seu pedido está sendo preparado"
├── Imprime etiqueta na cozinha (impressora térmica)
│   ├── Número do pedido
│   ├── Mesa
│   ├── Lista de itens com customizações
│   ├── Observações do cliente
│   └── Tempo estimado
└── Som: "beep" para chamar atenção
```

**Etiqueta Impressa:**
```
╔════════════════════════════════╗
║ 🍳 PEDIDO #PEDIDO-001234       ║
╠════════════════════════════════╣
║ MESA: #01   HORA: 14:35        ║
║                                ║
║ ITENS A PREPARAR:              ║
║ • Hamburger Clássico           ║
║   - Queijo Extra               ║
║   - Bacon                       ║
║   - Obs: Bem quente            ║
║   Tempo: 15 min                ║
║                                ║
║ • Pizza Calabresa              ║
║   - Sem Cebola                 ║
║   Tempo: 20 min                ║
║                                ║
║ • Refrigerante 2L (3x)          ║
║   Tempo: 0 min                 ║
║                                ║
║ TEMPO TOTAL: 20 min            ║
║                                ║
╚════════════════════════════════╝
```

**Operação 2: Pausar Preparação**

```
Cozinheiro clica [Pausar] se:
├── Falta algum ingrediente
├── Precisa de ajuda
├── Tem problema com o pedido

Sistema:
├── Pausa timer
├── Manda notificação: "Seu pedido está em pausa"
├── Gerente recebe alerta
└── Cozinheiro pode inserir motivo
```

**Operação 3: Marcar como Pronto**

```
Cozinheiro termina e clica [Pronto]

Sistema:
├── Muda status: PREPARANDO → PRONTO
├── Para timer
├── Emite som/vibração para avisar que saiu
├── Notifica cliente: 🔔 "Seu pedido está pronto!"
├── Toca áudio: "Pedido Mesa #01"
├── Começa novo timer (tempo máximo de entrega)
├── Notifica garçom/operador: Pedido pronto para entregar
└── Card muda para coluna PRONTO
```

**Operação 4: Marcar como Entregue**

```
Garçom/Operador clica [Entregue] após levar pedido

Sistema:
├── Muda status: PRONTO → ENTREGUE
├── Registra hora de entrega
├── Notifica cliente: "Aproveite sua refeição!"
├── Oferece avaliação
├── Move para histórico
├── Libera mesa como disponível
└── Atualiza estatísticas
```

**Operação 5: Cancelar Pedido**

```
Operador clica [Cancelar Pedido]

Modal aparece:
┌──────────────────────────────┐
│ Cancelar Pedido #PEDIDO-001  │
├──────────────────────────────┤
│ Tem certeza?                 │
│                              │
│ Motivo do Cancelamento:      │
│ [○ Produto sem estoque]      │
│ [○ Pedido duplicado]         │
│ [○ Cliente cancelou]         │
│ [○ Outro]                    │
│                              │
│ Observações:                 │
│ [___________________]        │
│                              │
│ Reembolso: Sim / Não         │
│                              │
│ [Cancelar] [Confirmar]       │
└──────────────────────────────┘

Sistema:
├── Muda status: CANCELADO
├── Notifica cliente: "Seu pedido foi cancelado"
├── Detalha motivo
├── Oferece reembolso/desconto
├── Registra em auditoria
└── Libera mesa/ingredientes
```

### 7.1.3 Filtros e Visualização

```
Filtros Disponíveis:
├── [Todos] - Mostra todos os pedidos
├── [Apenas Meus] - Apenas os atribuídos a mim
├── [Urgentes] - Pedidos atrasados
├── [Última Hora] - Últimos 60 minutos
└── [Por Categoria] - Apenas Pizzas, Lanches, etc

Ordenação:
├── [Mais Antigos] - Por data de entrada
├── [Mais Urgentes] - Por tempo de espera
├── [Maior Fila] - Mais itens
└── [Minha Especialidade] - Se aplicável

Automatizações:
├── [🔄 Auto-Atualizar: ON] - Atualiza a cada 3s
├── [🔊 Som: ON] - Emite alerta quando novo pedido
└── [📱 Notificação Desktop: ON] - Notifica fora da aba
```

### 7.1.4 Banco de Dados - Status de Pedido

```sql
CREATE TABLE pedidos_online (
  id SERIAL PRIMARY KEY,
  numero_pedido VARCHAR(30) NOT NULL UNIQUE,  -- PEDIDO-001234
  
  -- Mesa e Cliente
  mesa_id INT NOT NULL,
  cliente_nome VARCHAR(100),
  cliente_telefone VARCHAR(20),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  -- Valores: confirmado, preparando, pausado, pronto, entregue, cancelado
  
  -- Tempos
  data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tempo_preparo_estimado INT,  -- Minutos
  tempo_preparo_real INT,  -- Preenchido ao finalizar
  data_inicio_preparo TIMESTAMP,
  data_fim_preparo TIMESTAMP,
  data_entrega TIMESTAMP,
  
  -- Fila
  posicao_fila INT,  -- 1, 2, 3... (recalculado dinamicamente)
  tempo_espera_total INT,  -- Incluindo espera em fila
  
  -- Valores
  total DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  total_liquido DECIMAL(10,2) NOT NULL,
  
  -- Observações
  observacoes_cliente TEXT,
  alergias_restricoes TEXT,
  notas_cozinha TEXT,
  
  -- Rastreamento
  token_rastreamento VARCHAR(100) NOT NULL UNIQUE,
  
  -- Cancelamento
  cancelado_em TIMESTAMP,
  motivo_cancelamento VARCHAR(100),
  
  -- Auditoria
  criado_por INT,
  atualizado_por INT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mesa_id) REFERENCES mesas(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  FOREIGN KEY (atualizado_por) REFERENCES usuarios(id),
  
  INDEX idx_mesa(mesa_id),
  INDEX idx_status(status),
  INDEX idx_data(data_confirmacao),
  INDEX idx_token(token_rastreamento),
  CONSTRAINT status_valido CHECK (
    status IN ('confirmado', 'preparando', 'pausado', 'pronto', 'entregue', 'cancelado')
  )
);
```

---

## 8. BANCO DE DADOS - TABELAS COMPLETAS

### 8.1 Tabela ITENS_PEDIDO_ONLINE

```sql
CREATE TABLE itens_pedido_online (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  
  -- Quantidade e Preço
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  
  -- Customizações (JSON)
  customizacoes JSON,
  -- Exemplo:
  -- {
  //   "adicoes": [
  //     {"id": 1, "nome": "Queijo Extra", "valor": 3.00},
  //     {"id": 2, "nome": "Bacon", "valor": 5.00}
  //   ],
  //   "remocoes": [
  //     {"id": 10, "nome": "Sem Cebola"}
  //   ],
  //   "observacoes": "Bem quente"
  // }
  
  -- Status do Item
  status VARCHAR(20) DEFAULT 'confirmado',  -- confirmado, preparando, pronto, entregue
  tempo_preparo_produto INT,  -- Minutos
  
  -- Auditoria
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (pedido_id) REFERENCES pedidos_online(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  
  INDEX idx_pedido(pedido_id),
  INDEX idx_status(status)
);
```

### 8.2 Tabela HISTORICO_STATUS_PEDIDO (Auditoria)

```sql
CREATE TABLE historico_status_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL,
  
  status_anterior VARCHAR(20),
  status_novo VARCHAR(20) NOT NULL,
  
  motivo VARCHAR(255),
  usuario_id INT,
  
  data_mudanca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (pedido_id) REFERENCES pedidos_online(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  
  INDEX idx_pedido(pedido_id),
  INDEX idx_data(data_mudanca)
);
```

### 8.3 Tabela NOTIFICACOES_PEDIDO

```sql
CREATE TABLE notificacoes_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL,
  
  tipo VARCHAR(50) NOT NULL,
  -- confirmado, preparando, tempo_atualizado, pronto, entregue, cancelado
  
  titulo VARCHAR(100),
  mensagem TEXT,
  
  enviado BOOLEAN DEFAULT FALSE,
  data_envio TIMESTAMP,
  
  -- Canal de notificação
  via_websocket BOOLEAN DEFAULT TRUE,
  via_email BOOLEAN DEFAULT FALSE,
  via_sms BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (pedido_id) REFERENCES pedidos_online(id),
  
  INDEX idx_pedido(pedido_id),
  INDEX idx_tipo(tipo)
);
```

### 8.4 Tabela AVALIACOES_PEDIDO

```sql
CREATE TABLE avaliacoes_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL,
  
  -- Avaliação
  nota_geral INT CHECK (nota_geral BETWEEN 1 AND 5),  -- 1-5 estrelas
  qualidade_comida INT CHECK (qualidade_comida BETWEEN 1 AND 5),
  tempo_preparo INT CHECK (tempo_preparo BETWEEN 1 AND 5),
  atendimento INT CHECK (atendimento BETWEEN 1 AND 5),
  
  comentario TEXT,
  
  -- Cliente
  cliente_nome VARCHAR(100),
  cliente_email VARCHAR(100),
  
  data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (pedido_id) REFERENCES pedidos_online(id),
  
  INDEX idx_pedido(pedido_id),
  INDEX idx_nota(nota_geral)
);
```

---

## 9. API REST - ENDPOINTS

### 9.1 Endpoints de Menu Digital

**Base URL:** `http://localhost:3000/api/menu`

#### **GET /api/menu/mesa/{mesa_id}**
Obter menu completo para uma mesa
```
Query Params:
  - token: string (validação)

Response:
{
  "sucesso": true,
  "dados": {
    "mesa": {
      "id": 1,
      "numero": "01",
      "capacidade": 4
    },
    "categorias": [
      {
        "id": 1,
        "nome": "Lanches",
        "icone": "🍔",
        "produtos": [
          {
            "id": 12345,
            "nome": "Hamburger Clássico",
            "preco": 35.00,
            "imagem": "/uploads/produtos/12345.jpg",
            "descricao": "Carne, alface, tomate...",
            "tempo_preparo": 15,
            "em_estoque": true,
            "customizacoes": [
              {
                "id": 1,
                "tipo": "ADICAO",
                "nome": "Queijo Extra",
                "valor": 3.00
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 9.2 Endpoints de Pedido Online

#### **POST /api/pedidos-online/confirmar**
Criar novo pedido online
```
Body:
{
  "mesa_id": 1,
  "cliente_nome": "João Silva",
  "cliente_telefone": "(11) 98765-4321",
  "itens": [
    {
      "produto_id": 12345,
      "quantidade": 1,
      "customizacoes": {
        "adicoes": [
          {"id": 1, "nome": "Queijo Extra", "valor": 3.00}
        ],
        "observacoes": "Bem quente"
      }
    },
    {
      "produto_id": 67890,
      "quantidade": 1,
      "customizacoes": {}
    }
  ],
  "total": 115.00,
  "observacoes": "Não tenho pressa",
  "alergias": "Intolerância à lactose"
}

Response:
{
  "sucesso": true,
  "mensagem": "Pedido confirmado com sucesso",
  "dados": {
    "id": 54321,
    "numero_pedido": "PEDIDO-20260823-001234",
    "token_rastreamento": "XYZ789ABC",
    "status": "confirmado",
    "tempo_estimado": 20,
    "posicao_fila": 3,
    "link_rastreamento": "https://pdv.empresa.com/rastreamento/PEDIDO-001234/XYZ789ABC"
  }
}
```

#### **GET /api/pedidos-online/{id}/rastrear**
Obter status atual do pedido
```
Query Params:
  - token: string (validação)

Response:
{
  "sucesso": true,
  "dados": {
    "id": 54321,
    "numero_pedido": "PEDIDO-20260823-001234",
    "status": "preparando",
    "tempo_estimado_total": 20,
    "tempo_decorrido": 8,
    "tempo_restante": 12,
    "progresso": 40,
    "posicao_fila": 3,
    "itens": [
      {
        "produto": "Hamburger Clássico",
        "quantidade": 1,
        "status": "preparando",
        "tempo_produto": 15
      }
    ],
    "timeline": [
      {
        "status": "confirmado",
        "timestamp": "14:35:20",
        "mensagem": "Seu pedido foi recebido"
      },
      {
        "status": "preparando",
        "timestamp": "14:36:50",
        "mensagem": "Seu pedido está sendo preparado"
      }
    ]
  }
}
```

#### **PUT /api/pedidos-online/{id}/status**
Atualizar status (operador cozinha)
```
Body:
{
  "novo_status": "preparando",  -- ou "pronto", "entregue", "pausado"
  "motivo": "Começando preparação"
}

Response:
{
  "sucesso": true,
  "mensagem": "Status atualizado",
  "dados": {
    "novo_status": "preparando",
    "timestamp": "14:36:50"
  }
}
```

#### **POST /api/pedidos-online/{id}/cancelar**
Cancelar pedido
```
Body:
{
  "motivo": "Produto sem estoque",
  "detalhes": "Pizza Calabresa saiu do estoque"
}

Response:
{
  "sucesso": true,
  "mensagem": "Pedido cancelado"
}
```

#### **POST /api/pedidos-online/{id}/avaliar**
Enviar avaliação do pedido
```
Body:
{
  "nota_geral": 5,
  "qualidade_comida": 5,
  "tempo_preparo": 4,
  "atendimento": 5,
  "comentario": "Excelente! Recomendo"
}

Response:
{
  "sucesso": true,
  "mensagem": "Avaliação registrada"
}
```

#### **GET /api/pedidos-online/cozinha/fila**
Obter fila atual (para painel cozinha)
```
Query Params:
  - filtro: 'todos' | 'meus' | 'urgentes' (padrão: 'todos')

Response:
{
  "sucesso": true,
  "dados": {
    "aguardando": [
      {
        "id": 1,
        "numero": "PEDIDO-001",
        "mesa": "01",
        "tempo_espera": 0,
        "itens_count": 3,
        "prioridade": "normal"
      }
    ],
    "preparando": [
      {
        "id": 3,
        "numero": "PEDIDO-003",
        "mesa": "05",
        "tempo_preparo_decorrido": 8,
        "tempo_preparo_total": 20,
        "progresso": 40,
        "itens": [...]
      }
    ],
    "pronto": [
      {
        "id": 2,
        "numero": "PEDIDO-002",
        "mesa": "01",
        "tempo_aguardando": 5
      }
    ],
    "estatisticas": {
      "total_na_fila": 5,
      "tempo_medio_preparo": 18,
      "tempo_medio_espera": 12
    }
  }
}
```

---

## 10. WEBSOCKET EVENTS

```javascript
// EVENTOS QUE SERVIDOR ENVIA PARA CLIENTE

// 1. Confirmação de Pedido
socket.emit('pedido:confirmado', {
  pedido_id: 'PEDIDO-001234',
  numero_pedido: 'PEDIDO-20260823-001234',
  status: 'confirmado',
  tempo_estimado: 20,
  posicao_fila: 3,
  token: 'XYZ789ABC'
});

// 2. Pedido em Preparação
socket.emit('pedido:preparando', {
  pedido_id: 'PEDIDO-001234',
  status: 'preparando',
  tempo_restante: 12,
  progresso: 40,
  mensagem: 'Seu pedido está sendo preparado'
});

// 3. Tempo Atualizado Dinamicamente
socket.emit('pedido:tempo_atualizado', {
  pedido_id: 'PEDIDO-001234',
  novo_tempo_estimado: 18,
  tempo_reduzido_em: 2,
  motivo: 'fila_reduzida',
  mensagem: 'Bom! Seu pedido saírá mais cedo'
});

// 4. Posição na Fila Atualizada
socket.emit('pedido:posicao_fila_alterada', {
  pedido_id: 'PEDIDO-001234',
  nova_posicao: 2,
  posicao_anterior: 3,
  frente: 1  // Um pedido saiu
});

// 5. Pedido Pronto
socket.emit('pedido:pronto', {
  pedido_id: 'PEDIDO-001234',
  status: 'pronto',
  numero_chamada: 'MESA #01',
  mensagem: 'Seu pedido está pronto!',
  timestamp: '14:50:30'
});

// 6. Pedido Entregue
socket.emit('pedido:entregue', {
  pedido_id: 'PEDIDO-001234',
  status: 'entregue',
  timestamp: '14:50:35',
  tempo_total: 15  // 15 minutos
});

// 7. Pedido Cancelado
socket.emit('pedido:cancelado', {
  pedido_id: 'PEDIDO-001234',
  status: 'cancelado',
  motivo: 'produto_sem_estoque',
  detalhes: 'Pizza Calabresa saiu do estoque',
  mensagem: 'Desculpe! Seu pedido foi cancelado.'
});

// 8. Pausa no Pedido
socket.emit('pedido:pausado', {
  pedido_id: 'PEDIDO-001234',
  motivo: 'Falta de ingrediente',
  tempo_pausa_estimado: 5
});

// EVENTOS PARA COZINHA

// 1. Novo Pedido
socket.emit('cozinha:novo_pedido', {
  pedido_id: 'PEDIDO-001234',
  numero_pedido: 'PEDIDO-001234',
  mesa: '01',
  itens: [
    {
      produto: 'Hamburger Clássico',
      quantidade: 1,
      customizacoes: {...},
      tempo_preparo: 15
    }
  ],
  tempo_estimado_total: 20,
  prioridade: 'normal'  // ou 'alta'
});

// 2. Pedido Cancelado (cozinha)
socket.emit('cozinha:pedido_cancelado', {
  pedido_id: 'PEDIDO-001234',
  numero_pedido: 'PEDIDO-001234',
  motivo: 'Cliente cancelou'
});

// 3. Estatísticas de Fila Atualizadas
socket.emit('cozinha:fila_atualizada', {
  total_aguardando: 5,
  total_preparando: 3,
  total_pronto: 2,
  tempo_medio_preparo: 18,
  tempo_medio_espera: 12
});
```

---

## 11. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/pedidos-online/
│
├── pages/
│   ├── MenuDigitalPage.jsx          # Menu completo
│   ├── RastreamentoPedidoPage.jsx   # Acompanhamento cliente
│   └── CompartilhamentoPedidoPage.jsx
│
├── components/
│   ├── Menu/
│   │   ├── CategoriaLista.jsx
│   │   ├── ProdutoCard.jsx
│   │   ├── ProdutoDetalhe.jsx
│   │   └── BuscaProdutos.jsx
│   │
│   ├── Customizacao/
│   │   ├── ModalCustomizacao.jsx
│   │   ├── OpcaoAdicao.jsx
│   │   ├── OpcaoRemocao.jsx
│   │   └── ObservacoesCliente.jsx
│   │
│   ├── Carrinho/
│   │   ├── CarrinhoMenu.jsx
│   │   ├── ItemCarrinho.jsx
│   │   ├── ResumoCarrinho.jsx
│   │   └── FormularioConfirmacao.jsx
│   │
│   ├── Rastreamento/
│   │   ├── TimelineStatus.jsx
│   │   ├── InfoPosicaoFila.jsx
│   │   ├── TimerProgresso.jsx
│   │   └── BotoesAcao.jsx
│   │
│   ├── Notificacoes/
│   │   ├── NotificacaoToast.jsx
│   │   ├── SomNotificacao.jsx
│   │   └── VibracaoNotificacao.jsx
│   │
│   ├── Compartilhamento/
│   │   ├── BotaoCompartilhar.jsx
│   │   └── ModalCompartilhamento.jsx
│   │
│   └── Avaliacao/
│       └── ModalAvaliacaoPedido.jsx
│
├── hooks/
│   ├── useCarrinhoMenu.js           # Estado do carrinho
│   ├── usePedidoOnline.js           # Criar/recuperar pedido
│   ├── useRastreamento.js           # WebSocket rastreamento
│   ├── useCustomizacao.js           # Lógica customização
│   └── useAvaliacaoPedido.js        # Submissão avaliação
│
├── services/
│   ├── menuDigitalService.js        # GET menu, categorias
│   ├── pedidoOnlineService.js       # POST confirmar, GET status
│   ├── websocketService.js          # Socket.io connection
│   └── notificacaoService.js        # Notificações
│
├── utils/
│   ├── calculosValor.js             # Preços com customização
│   ├── formatacaoTempo.js           # Timer, tempo estimado
│   ├── validacoesPedido.js          # Validação
│   └── compartilhamento.js          # Links, QR codes
│
├── styles/
│   ├── menu-digital.css
│   ├── rastreamento.css
│   ├── modal-customizacao.css
│   └── responsive.css
│
└── constants/
    ├── statusPedido.js
    ├── tiposNotificacao.js
    └── cores.js
```

---

## 12. ESTRUTURA DE PASTAS (Backend)

```
src/modules/pedidos-online/
│
├── controllers/
│   ├── menuController.js
│   ├── pedidoController.js
│   ├── rastreamentoController.js
│   └── cozinhaController.js
│
├── services/
│   ├── pedidoService.js             # Lógica de negócio
│   ├── filaService.js               # Cálculos de fila
│   ├── notificacaoService.js        # Envio de notificações
│   ├── websocketService.js          # Gerenciamento de sockets
│   └── avaliacaoService.js
│
├── repositories/
│   ├── pedidoRepository.js
│   ├── mesaRepository.js
│   ├── menuRepository.js
│   └── filaRepository.js
│
├── models/
│   ├── pedidoModel.js               # Sequelize
│   ├── mesaModel.js
│   ├── itemPedidoModel.js
│   ├── customizacaoModel.js
│   └── avaliacaoModel.js
│
├── routes/
│   ├── menuRoutes.js
│   ├── pedidoRoutes.js
│   ├── rastreamentoRoutes.js
│   └── cozinhaRoutes.js
│
├── validacoes/
│   ├── pedidoValidacao.js
│   └── customizacaoValidacao.js
│
├── middleware/
│   ├── validacaoMesa.js
│   ├── validacaoToken.js
│   └── rateLimiting.js
│
├── websocket/
│   ├── socketConfig.js              # Setup Socket.io
│   ├── eventosCliente.js            # Eventos para cliente
│   ├── eventosCozinha.js            # Eventos para cozinha
│   └── emissoresNotificacao.js      # Funções de envio
│
└── utils/
    ├── geracaoToken.js              # Token rastreamento
    ├── calculoFila.js               # Cálculos matemáticos
    ├── qrcodeGenerator.js           # Geração QR Code
    └── validacaoQRCode.js           # Validação segurança
```

---

## 13. CASOS DE USO DETALHADOS

### Caso de Uso 1: Cliente Faz Primeiro Pedido

**Ator:** Cliente (novo, sem autenticação)
**Tempo:** ~5 minutos

**Fluxo:**
1. Cliente senta na mesa #01
2. Escaneia QR Code com celular
3. Navegador abre: `https://pdv.empresa.com/mesa/MESA-001-ABC123`
4. Sistema valida QR (token, mesa ativa)
5. Menu digital carrega com todas as categorias
6. Cliente navega por categorias
7. Clica em "Hamburger Clássico" (R$ 35,00)
8. Modal de customização abre
9. Seleciona: Queijo Extra (+R$ 3,00), Bacon (+R$ 5,00)
10. Adiciona à observação: "Bem quente"
11. Clica "Adicionar Carrinho"
12. Produto aparece no carrinho: R$ 43,00
13. Continua adicionando: Pizza (R$ 45,00) e 3 Refrigerantes (R$ 8,00 cada = R$ 24,00)
14. Carrinho mostra: R$ 112,00
15. Clica "Confirmar Pedido"
16. Modal pede informações:
    - Nome: João Silva
    - Telefone: (11) 98765-4321
    - Alergias: Nenhuma
    - Observação: "Não tenho pressa"
17. Clica "Confirmar Pedido Final"
18. Sistema cria pedido: `PEDIDO-20260823-001234`
19. Token: `XYZ789ABC`
20. Cliente recebe notificação: ✅ "Pedido confirmado! Saírá em ~20 min"
21. Abre painel de rastreamento automaticamente
22. Vê timeline: Confirmado → Preparando (em breve)
23. Vê posição na fila: 3 de 5 pedidos

**Cozinha (simultâneo):**
- Operador recebe: "Novo Pedido #PEDIDO-001234"
- Painel Kanban mostra card em "AGUARDANDO"
- Etiqueta impressa automaticamente
- Operador arrasta para "PREPARANDO"
- Timer começa (20 min)

**Resultado:** Pedido confirmado, cliente acompanhando, cozinha preparando.

---

### Caso de Uso 2: Atualização Dinâmica de Tempo

**Ator:** Sistema (automático)

**Fluxo:**
1. Pedido #1 estava com 15 min restantes
2. Finaliza em 13 min (2 min mais rápido)
3. Sistema recalcula fila para todos na frente
4. Pedido #2 (seu hamburger) ganha 2 min
   - Tempo anterior: 35 min → Novo: 33 min
5. Pedido #3 (você) também ganha 2 min
   - Tempo anterior: 38 min → Novo: 36 min
6. Sistema envia WebSocket:
   ```json
   {
     "tipo": "tempo_atualizado",
     "pedido_id": "PEDIDO-003",
     "novo_tempo": 36,
     "tempo_ganho": 2,
     "mensagem": "Bom! Seu pedido saírá mais cedo"
   }
   ```
7. Cliente recebe notificação: "Bom! Seu pedido saírá às 14:55 (era 14:57)"
8. Timer na tela atualiza para 36 min
9. Painel mostra: "Posição na fila: 2 de 4" (Pedido saiu da frente)

**Resultado:** Cliente informado em tempo real, experiência melhorada.

---

### Caso de Uso 3: Pedido Pronto e Entrega

**Ator:** Operador Cozinha + Garçom

**Fluxo Cozinha:**
1. Pedido #PEDIDO-003 está em "PREPARANDO" há 18 min
2. Todas as preparações finalizadas
3. Operador clica [Pronto]
4. Status muda: PREPARANDO → PRONTO
5. Sistema emite som: "beep beep"
6. Frase de áudio: "Pedido Mesa #01"
7. Card move para coluna PRONTO
8. Timer para

**Fluxo Cliente Simultâneo:**
9. Cliente recebe notificação: 🔔 "Seu pedido está pronto!"
10. Som de alerta no celular
11. Tela vibra
12. Timeline atualiza: "Pronto - 14:50:30"

**Fluxo Garçom:**
13. Vê pedido pronto no painel
14. Pega a bandeja
15. Leva para mesa #01
16. Coloca na mesa
17. Sistema pede: "Marcar como entregue?"
18. Garçom clica [Entregue]
19. Status: PRONTO → ENTREGUE

**Fluxo Cliente Final:**
20. Recebe notificação: "Aproveite sua refeição! 😋"
21. Sistema oferece: "Avalie seu pedido"
22. Cliente vê 5 estrelas para marcar
23. Opcionalmente deixa comentário
24. Submete avaliação

**Resultado:** Pedido entregue, experiência completa, feedback coletado.

---

## 14. MOCKUPS DE TELAS

### Tela 1: Menu Digital (Mobile)

```
┌─────────────────────────────────┐
│ 🍔 RESTAURANTE FASTFOOD         │
│ Mesa #01                        │
├─────────────────────────────────┤
│                                 │
│ [Lanches] [Pizzas] [Bebidas]   │
│ [Sobremesas] [Complementos]     │
│                                 │
│ 🍔 HAMBÚRGUER CLÁSSICO         │
│ [Imagem]                        │
│ R$ 35,00                        │
│ Carne, alface, tomate, queijo   │
│ Tempo: 15 min                   │
│ [+ Adicionar]                   │
│                                 │
│ 🍕 PIZZA CALABRESA             │
│ [Imagem]                        │
│ R$ 45,00                        │
│ Calabresa, cebola, azeitona     │
│ Tempo: 20 min                   │
│ [+ Adicionar]                   │
│                                 │
│ 🥤 REFRIGERANTE 2L             │
│ [Imagem]                        │
│ R$ 8,00                         │
│ Gelado                           │
│ [+ Adicionar]                   │
│                                 │
│ ─────────────────────────────── │
│ [Carrinho] (3) | Total: R$ 112  │
│                                 │
│ [Confirmar Pedido]              │
│                                 │
└─────────────────────────────────┘
```

### Tela 2: Rastreamento do Pedido (Mobile)

```
┌─────────────────────────────────┐
│ 📱 ACOMPANHE SEU PEDIDO         │
├─────────────────────────────────┤
│                                 │
│ Pedido: #PEDIDO-001234         │
│ Status: Preparando              │
│                                 │
│ ✅ CONFIRMADO         14:35     │
│                                 │
│ ⏳ PREPARANDO (agora)          │
│ ████░░░░░░ 40%                 │
│ ~12 min restantes               │
│                                 │
│ ⭕ PRONTO              ~14:50   │
│                                 │
│ ⭕ ENTREGUE             ---     │
│                                 │
│ ─────────────────────────────── │
│ Posição na Fila: 3 de 5         │
│                                 │
│ RESUMO:                         │
│ 1x Hamburger        R$ 43,00   │
│ 1x Pizza            R$ 45,00   │
│ 3x Refrigerante     R$ 24,00   │
│ ─────────────────────────────── │
│ TOTAL:              R$ 112,00   │
│                                 │
│ [📤 Compartilhar] [⭐ Avaliar]  │
│ [Chamar Garçom]                │
│                                 │
└─────────────────────────────────┘
```

### Tela 3: Painel Cozinha (Desktop)

(Já mostrado em 7.1.1)

---

## 15. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup + QR Code (1-2 semanas)
- [ ] Estrutura BD (mesas, pedidos_online, itens_pedido)
- [ ] Geração de QR Codes
- [ ] Gerenciamento de mesas (admin)
- [ ] Validação de token/segurança
- [ ] Testes

### Sprint 2: Menu Digital (2 semanas)
- [ ] Frontend menu digital responsivo
- [ ] Carregamento de categorias/produtos
- [ ] Busca de produtos
- [ ] Carrinho de menu
- [ ] Testes

### Sprint 3: Customizações (1-2 semanas)
- [ ] Modal de customização
- [ ] Cálculos de preço com adições
- [ ] Remover/substituir produtos
- [ ] Observações livres
- [ ] Testes

### Sprint 4: Confirmação + Banco de Dados (1-2 semanas)
- [ ] Fluxo de confirmação
- [ ] Criação de pedido
- [ ] Geração de token
- [ ] Validações
- [ ] Testes

### Sprint 5: WebSocket + Notificações (2-3 semanas)
- [ ] Setup Socket.io
- [ ] Envio de eventos em tempo real
- [ ] Notificações no cliente
- [ ] Som/Vibração
- [ ] Testes

### Sprint 6: Painel Cozinha (2-3 semanas)
- [ ] Interface Kanban
- [ ] Operações (começar, pausar, pronto, entregue)
- [ ] Cálculos de fila
- [ ] Impressão de etiquetas
- [ ] Testes

### Sprint 7: Rastreamento Cliente (1-2 semanas)
- [ ] Timeline visual
- [ ] Atualização dinâmica de tempo
- [ ] Posição na fila
- [ ] Compartilhamento
- [ ] Testes

### Sprint 8: Avaliação + Polish (1-2 semanas)
- [ ] Modal de avaliação
- [ ] Submissão de feedback
- [ ] Histórico de pedidos
- [ ] Testes E2E
- [ ] Deploy staging

---

## 16. CHECKLIST PRÉ-DESENVOLVIMENTO

- [ ] Requisitos com cliente finalizados
- [ ] Design responsivo aprovado
- [ ] Banco de dados schema validado
- [ ] WebSocket vs REST decision feita
- [ ] Hosting/servidor definido
- [ ] SSL/HTTPS confirmado
- [ ] Servidor Socket.io escalável
- [ ] Impressora térmica testada
- [ ] Ambiente dev setup
- [ ] CI/CD pipeline
- [ ] Teste de carga (quanto pega simultâneo?)
- [ ] Testes unitários framework
- [ ] Testes E2E framework
- [ ] Monitoramento/logs
- [ ] Plano de backup/disaster recovery

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento

**Próximas Integrações:**
- Módulo 2.4: Controle de Estoque
- Módulo 2.5: Financeiro
- Módulo 2.6: Análises e Relatórios
