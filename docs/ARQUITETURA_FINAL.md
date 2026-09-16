# ARQUITETURA DO SISTEMA - PDV ONLINE

## 📋 Sumário Executivo

**Projeto:** PDV Online para Empresa Alimentícia  
**Versão:** 1.0  
**Data:** 23/08/2026  
**Stack:** Next.js 14 + Supabase + Prisma + TypeScript

---

## 1. STACK TECNOLÓGICO

### 1.1 Frontend

```
Next.js 14.0+
├── App Router (não Pages Router)
├── TypeScript
├── Tailwind CSS
├── Shadcn/ui (componentes)
├── React Hook Form + Zod (forms)
├── TanStack Query v5 (data fetching)
├── Zustand (state management)
└── Jest + Testing Library (testes)

Node.js: 20 LTS (Vercel suporta nativamente)
```

### 1.2 Backend

```
Supabase
├── PostgreSQL (database)
├── Supabase Auth (autenticação)
├── Supabase Storage (arquivos)
├── Supabase Realtime (WebSocket)
└── Supabase Edge Functions (optional)

Prisma ORM 5.0+
├── Type-safe database access
├── Migrations automáticas
├── TypeScript nativo
└── Seed scripts

Next.js API Routes
├── /app/api/[module]/[action].ts
├── Middleware de autenticação
└── Error handling centralizado
```

### 1.3 Infraestrutura

```
Vercel (Deployment)
├── Ambiente Production
├── Ambiente Staging
├── Preview Deployments (por PR)
└── CI/CD automático

GitHub (Versionamento)
├── Repositório
├── GitHub Actions (workflows)
├── Branch strategy (main, develop, feature/*)
└── Code review (PRs)

Upstash Redis (Cache)
├── Serverless Redis
├── Rate limiting
├── Cache de dados
└── Session store (optional)

Sentry (Error Tracking) - OPCIONAL
├── Frontend errors
├── Backend errors
└── Performance monitoring
```

### 1.4 Serviços Externos

```
Email Service:
├── Resend (recomendado para Vercel)
├── API Key armazenada em .env
└── Templates em /app/emails

SMS Provider:
├── Twilio (opcional)
├── Credenciais em .env
└── Para alertas críticos

Payment Processor:
├── Stripe (futuro)
├── Credenciais em .env
└── Para processamento de pagamentos

Monitor/Logging:
├── Supabase Logs (built-in)
├── Vercel Analytics (built-in)
└── Sentry (optional)
```

---

## 2. ARQUITETURA EM CAMADAS

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER (UI)             │
│  ┌─────────────────────────────────────┐    │
│  │  Next.js Pages & Components         │    │
│  │  (/app/page.tsx, /app/dashboard/*)  │    │
│  │  - React Components (TSX)           │    │
│  │  - Hooks customizados                │    │
│  │  - Tailwind + Shadcn/ui             │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│       BUSINESS LOGIC LAYER (Services)       │
│  ┌─────────────────────────────────────┐    │
│  │  /lib/services/*.ts                 │    │
│  │  - Lógica de negócio                 │    │
│  │  - Transformação de dados            │    │
│  │  - Validação (Zod)                   │    │
│  │  - Cálculos (desconto, estoque, etc) │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│     DATA ACCESS LAYER (API Routes)          │
│  ┌─────────────────────────────────────┐    │
│  │  /app/api/[module]/[action].ts      │    │
│  │  - Next.js API Routes                │    │
│  │  - Autenticação middleware           │    │
│  │  - Error handling                    │    │
│  │  - Prisma queries                    │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│     DATABASE LAYER (Prisma + Supabase)      │
│  ┌─────────────────────────────────────┐    │
│  │  PostgreSQL (Supabase)               │    │
│  │  /prisma/schema.prisma               │    │
│  │  - Models (Usuarios, Vendas, etc)    │    │
│  │  - Relations                         │    │
│  │  - Validations                       │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 3. ESTRUTURA DE PASTAS DEFINITIVA

```
projeto-pdv/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Layout raiz
│   ├── page.tsx                      # Página inicial (/)
│   ├── globals.css                   # Estilos globais + Tailwind
│   │
│   ├── (auth)/                       # Grupo de rotas (não afeta URL)
│   │   ├── login/page.tsx            # /login
│   │   ├── recuperar-senha/page.tsx  # /recuperar-senha
│   │   └── redefinir-senha/page.tsx  # /redefinir-senha
│   │
│   ├── (dashboard)/                  # Rotas privadas
│   │   ├── layout.tsx                # Layout do dashboard
│   │   ├── dashboard/page.tsx        # /dashboard
│   │   │
│   │   ├── vendas/                   # Módulo Vendas
│   │   │   ├── page.tsx              # /vendas
│   │   │   ├── [id]/page.tsx         # /vendas/[id]
│   │   │   └── layout.tsx
│   │   │
│   │   ├── pedidos-online/           # Módulo Pedidos Online
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── estoque/                  # Módulo Estoque
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── financeiro/               # Módulo Financeiro
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── relatorios/               # Módulo Relatórios
│   │   │   ├── page.tsx
│   │   │   ├── [tipo]/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── configuracoes/            # Módulo Configurações
│   │   │   ├── page.tsx
│   │   │   ├── [secao]/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   └── admin/                    # Módulo Admin
│   │       ├── usuarios/page.tsx
│   │       ├── auditoria/page.tsx
│   │       └── layout.tsx
│   │
│   ├── api/                          # API Routes (Backend)
│   │   ├── auth/                     # Autenticação
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── recuperar-senha/route.ts
│   │   │
│   │   ├── vendas/                   # Vendas PDV
│   │   │   ├── route.ts              # GET (lista), POST (criar)
│   │   │   ├── [id]/route.ts         # GET, PUT, DELETE por ID
│   │   │   └── validar-desconto/route.ts
│   │   │
│   │   ├── produtos/                 # Gestão Produtos
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   │
│   │   ├── estoque/                  # Controle Estoque
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   ├── movimentacoes/route.ts
│   │   │   └── alertas/route.ts
│   │   │
│   │   ├── financeiro/               # Financeiro
│   │   │   ├── dashboard/route.ts
│   │   │   ├── despesas/route.ts
│   │   │   ├── contas-pagar/route.ts
│   │   │   └── fluxo-caixa/route.ts
│   │   │
│   │   ├── relatorios/               # Relatórios
│   │   │   ├── pl/route.ts
│   │   │   ├── vendas/route.ts
│   │   │   └── exportar/route.ts
│   │   │
│   │   ├── configuracoes/            # Configurações
│   │   │   ├── empresa/route.ts
│   │   │   ├── vendas/route.ts
│   │   │   └── [tipo]/route.ts
│   │   │
│   │   ├── usuarios/                 # Gestão Usuários
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   │
│   │   ├── auditoria/                # Auditoria
│   │   │   └── route.ts
│   │   │
│   │   └── health/route.ts           # Health check
│   │
│   └── error.tsx                     # Error boundary
│
├── components/                       # Componentes reutilizáveis
│   ├── ui/                           # UI componentes (Shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   └── ... (outros)
│   │
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RecuperarSenhaForm.tsx
│   │   └── RedefinirSenhaForm.tsx
│   │
│   ├── vendas/
│   │   ├── VendasTable.tsx
│   │   ├── NovaVendaForm.tsx
│   │   ├── CarrinhoPDV.tsx
│   │   ├── BuscaProduto.tsx
│   │   └── ConfirmacaoPagamento.tsx
│   │
│   ├── estoque/
│   │   ├── EstoqueTable.tsx
│   │   ├── AlertasEstoque.tsx
│   │   ├── EntradaEstoqueForm.tsx
│   │   └── InventarioForm.tsx
│   │
│   ├── financeiro/
│   │   ├── DashboardFinanceiro.tsx
│   │   ├── ContasApagarTable.tsx
│   │   ├── DespesasTable.tsx
│   │   └── FluxoCaixaGrafico.tsx
│   │
│   ├── relatorios/
│   │   ├── DashboardExecutivo.tsx
│   │   ├── RelatorioPL.tsx
│   │   ├── GraficoVendas.tsx
│   │   └── ExportarRelatorio.tsx
│   │
│   ├── pedidos-online/
│   │   ├── MenuDigital.tsx
│   │   ├── FilaPedidos.tsx
│   │   ├── PainelCozinha.tsx
│   │   └── RastreamentoPedido.tsx
│   │
│   └── admin/
│       ├── TabelaUsuarios.tsx
│       ├── FormularioUsuario.tsx
│       ├── DashboardAuditoria.tsx
│       └── ConfiguracoesGerais.tsx
│
├── lib/                              # Utilitários e lógica compartilhada
│   ├── prisma.ts                     # Cliente Prisma (singleton)
│   ├── supabase.ts                   # Cliente Supabase
│   ├── redis.ts                      # Cliente Redis (Upstash)
│   │
│   ├── services/                     # Serviços de negócio
│   │   ├── auth.service.ts
│   │   ├── vendas.service.ts
│   │   ├── estoque.service.ts
│   │   ├── financeiro.service.ts
│   │   ├── relatorios.service.ts
│   │   ├── usuarios.service.ts
│   │   └── configuracoes.service.ts
│   │
│   ├── validations/                  # Schemas Zod
│   │   ├── auth.schema.ts
│   │   ├── vendas.schema.ts
│   │   ├── estoque.schema.ts
│   │   ├── financeiro.schema.ts
│   │   └── usuarios.schema.ts
│   │
│   ├── utils/                        # Funções utilitárias
│   │   ├── auth.ts                   # JWT, session
│   │   ├── format.ts                 # Formatar datas, moeda
│   │   ├── validation.ts             # Validações customizadas
│   │   ├── calculation.ts            # Cálculos (desconto, etc)
│   │   └── error-handler.ts          # Tratamento de erros
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── useAuth.ts                # Auth context
│   │   ├── usePermission.ts          # Verificar permissão
│   │   ├── useFetch.ts               # Data fetching
│   │   ├── useForm.ts                # Wrapper React Hook Form
│   │   └── useVendas.ts              # Dados de vendas
│   │
│   ├── middleware/                   # Middleware Next.js
│   │   ├── auth.middleware.ts        # Autenticação
│   │   ├── cors.middleware.ts        # CORS
│   │   ├── rate-limit.middleware.ts  # Rate limiting
│   │   ├── logger.middleware.ts      # Logging
│   │   └── error.middleware.ts       # Error handling
│   │
│   ├── constants/                    # Constantes
│   │   ├── roles.ts                  # Perfis de usuário
│   │   ├── permissions.ts            # Permissões
│   │   ├── error-messages.ts         # Mensagens de erro
│   │   └── api-routes.ts             # URLs das APIs
│   │
│   └── types/                        # Types compartilhados
│       ├── database.ts               # Types do BD
│       ├── api.ts                    # Types de API
│       ├── auth.ts                   # Types de auth
│       └── common.ts                 # Types gerais
│
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                 # Schema do banco
│   ├── migrations/                   # Migrations automáticas
│   │   ├── 001_initial/
│   │   ├── 002_add_usuarios/
│   │   └── ...
│   └── seed.ts                       # Seed (dados iniciais)
│
├── public/                           # Assets estáticos
│   ├── images/
│   ├── icons/
│   ├── logos/
│   └── favicons/
│
├── styles/                           # Estilos (Tailwind config)
│   ├── globals.css
│   └── variables.css
│
├── tests/                            # Testes
│   ├── unit/                         # Testes unitários
│   │   ├── services/
│   │   ├── utils/
│   │   └── validations/
│   ├── integration/                  # Testes de integração
│   │   ├── api/
│   │   └── services/
│   └── e2e/                          # Testes E2E (Playwright/Cypress)
│       ├── auth.spec.ts
│       ├── vendas.spec.ts
│       └── ...
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI (testes, lint)
│       ├── cd.yml                    # CD (deploy Vercel)
│       └── codeql.yml                # Segurança
│
├── .env.example                      # Variáveis de ambiente (template)
├── .env.local                        # Variáveis locais (não commitar)
├── .gitignore
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── postcss.config.js                 # PostCSS config
├── jest.config.js                    # Jest config
├── package.json
├── package-lock.json
└── README.md
```

---

## 4. FLUXO DE DADOS

### 4.1 Fluxo de uma Venda (Exemplo Completo)

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUÁRIO INTERAGE (Frontend)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Operador clica [Nova Venda]                           │
│  ↓                                                      │
│  Componente: <NovaVendaForm />                         │
│  ↓                                                      │
│  React Hook Form captura dados                        │
│  ↓                                                      │
│  Zod valida os dados localmente                       │
│  ├─ Email válido?                                      │
│  ├─ Produtos existem?                                  │
│  ├─ Quantidade > 0?                                    │
│  └─ Desconto < máximo?                                │
│  ↓                                                      │
│  Se OK: Envia para Backend                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CHAMADA DE API (Frontend → Backend)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POST /api/vendas/criar                               │
│  Headers:                                              │
│  ├─ Authorization: Bearer eyJhbGc...                  │
│  ├─ Content-Type: application/json                   │
│  └─ X-Request-ID: uuid                                │
│                                                         │
│  Body (JSON):                                          │
│  {                                                      │
│    "operador_id": 5,                                  │
│    "items": [                                          │
│      {"produto_id": 123, "qtd": 2},                  │
│      {"produto_id": 456, "qtd": 1}                   │
│    ],                                                  │
│    "desconto": 50.00,                                 │
│    "forma_pagamento": "dinheiro"                      │
│  }                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PROCESSAMENTO NO BACKEND (API Route)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Route: /app/api/vendas/criar/route.ts                │
│  ↓                                                      │
│  Middleware:                                           │
│  ├─ Autenticação (verificar JWT)                       │
│  ├─ Rate limiting (5 req/min)                          │
│  ├─ Logger (registra requisição)                       │
│  └─ CORS (verificar origem)                            │
│  ↓                                                      │
│  Validação com Zod:                                   │
│  ├─ Schema.parse(req.body)                            │
│  └─ Se erro: retorna 400 com mensagem                 │
│  ↓                                                      │
│  Chamar Service (vendas.service.ts):                  │
│  └─ criarVenda(dados)                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. LÓGICA DE NEGÓCIO (Service)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  vendas.service.ts → criarVenda()                      │
│  ↓                                                      │
│  1. Validar permissão:                                 │
│     └─ Usuário pode criar vendas?                     │
│  ↓                                                      │
│  2. Buscar produtos:                                   │
│     └─ SELECT * FROM produtos WHERE id IN (123, 456)  │
│  ↓                                                      │
│  3. Verificar estoque:                                 │
│     └─ produto.quantidade >= quantidade_vendida?      │
│  ↓                                                      │
│  4. Calcular total:                                    │
│     ├─ Soma itens: (2 * 50) + (1 * 80) = 180         │
│     ├─ Desconto: 50.00                                │
│     └─ Total: 180 - 50 = 130.00                       │
│  ↓                                                      │
│  5. Criar transação:                                   │
│     ├─ INSERT INTO vendas (...)                       │
│     ├─ INSERT INTO itens_venda (...)                  │
│     ├─ UPDATE estoque (decrementa quantidade)         │
│     ├─ INSERT INTO auditoria (...)                    │
│     └─ COMMIT (tudo ou nada)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. ACESSO AO BANCO DE DADOS (Prisma)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  prisma.vendas.create({                               │
│    data: {                                             │
│      numero_venda: "VEND-001234",                     │
│      operador_id: 5,                                   │
│      total: 130.00,                                    │
│      desconto: 50.00,                                  │
│      forma_pagamento: "dinheiro",                      │
│      itens: {                                          │
│        createMany: {                                   │
│          data: [                                       │
│            {produto_id: 123, qtd: 2, preco: 50},    │
│            {produto_id: 456, qtd: 1, preco: 80}     │
│          ]                                             │
│        }                                               │
│      }                                                 │
│    },                                                  │
│    include: {itens: true}                             │
│  });                                                    │
│                                                         │
│  ↓ (Prisma converte para SQL e executa no BD)         │
│  ↓                                                      │
│  PostgreSQL (Supabase):                               │
│  BEGIN TRANSACTION;                                    │
│  INSERT INTO vendas (...) VALUES (...);               │
│  INSERT INTO itens_venda (...) VALUES (...);          │
│  UPDATE estoque SET quantidade = quantidade - 2 ...;  │
│  COMMIT;                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. RESPOSTA AO FRONTEND (API Response)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Status: 200 OK                                        │
│  Body (JSON):                                          │
│  {                                                      │
│    "sucesso": true,                                   │
│    "dados": {                                          │
│      "venda_id": 12345,                               │
│      "numero_venda": "VEND-001234",                   │
│      "total": 130.00,                                 │
│      "timestamp": "2026-08-23T14:35:20Z"             │
│    }                                                    │
│  }                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. ATUALIZAÇÃO NO FRONTEND (UI)                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Recebe resposta                                       │
│  ↓                                                      │
│  TanStack Query atualiza cache                        │
│  ↓                                                      │
│  Componente re-renderiza com novos dados              │
│  ↓                                                      │
│  Toast: "Venda #VEND-001234 criada com sucesso!"     │
│  ↓                                                      │
│  Redireciona para dashboard de vendas                 │
│  ↓                                                      │
│  Lista atualiza automaticamente                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 8. REAL-TIME UPDATES (Supabase Realtime)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  WebSocket (Supabase Realtime):                        │
│                                                         │
│  Inscritos no evento "vendas":                        │
│  ├─ Dashboard (atualiza estatísticas)                  │
│  ├─ Cozinha (novo pedido chegou)                      │
│  └─ Estoque (quantidade diminuiu)                      │
│                                                         │
│  Broadcast:                                            │
│  {                                                      │
│    "event": "vendas:nova",                            │
│    "venda_id": 12345,                                 │
│    "operador": "João Silva",                          │
│    "total": 130.00                                     │
│  }                                                      │
│                                                         │
│  → Dashboard recebe e atualiza gráficos                │
│  → Cozinha recebe e mostra novo pedido                │
│  → Estoque recebe e atualiza alertas                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. DECISÕES ARQUITETURAIS

### 5.1 Por que Next.js?

```
✓ Full-stack (Frontend + Backend no mesmo projeto)
✓ App Router (roteamento moderno)
✓ API Routes (sem servidor separado)
✓ TypeScript nativo
✓ SSR/SSG (performance)
✓ Vercel (deployment automático)
✓ Edge Middleware (autenticação em edge)
```

### 5.2 Por que Supabase?

```
✓ PostgreSQL gerenciado
✓ Autenticação built-in
✓ Storage de arquivos
✓ Realtime (WebSocket nativo)
✓ Sem custo até certo volume
✓ Rest API automática
✓ Backups automáticos
```

### 5.3 Por que Prisma?

```
✓ Type-safe (TypeScript nativo)
✓ Migrations automáticas
✓ Schema declarativo
✓ Query builder intuitivo
✓ Suporte a PostgreSQL
✓ CLI poderosa
✓ Seed scripts
✓ Sem overhead de SQL raw
```

### 5.4 Por que React Hook Form + Zod?

```
React Hook Form:
✓ Performático (não re-renderiza desnecessariamente)
✓ Pequeno (~9KB)
✓ Integração simples com Zod
✓ Suporte a forms complexas
✓ Integração com Shadcn/ui

Zod:
✓ Validação TypeScript-first
✓ Schemas tipados
✓ Mensagens customizadas
✓ Validação client + server
✓ Parsing de dados
```

### 5.5 Por que Upstash Redis?

```
✓ Serverless (sem gerenciar servidor)
✓ Pré-integrado com Vercel
✓ Rate limiting
✓ Cache distribuído
✓ Session store
✓ Pago por uso
```

### 5.6 Por que Vercel para Deploy?

```
✓ Next.js é feito pela Vercel
✓ Deploy automático por git push
✓ Preview deployments (PRs)
✓ Scaling automático
✓ Edge Functions
✓ Analytics built-in
✓ Integração GitHub perfeita
```

---

## 6. VARIÁVEIS DE AMBIENTE (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# Prisma
PRISMA_DATABASE_URL=$DATABASE_URL

# JWT
JWT_SECRET=sua_super_secret_key_minimo_64_caracteres_muito_segura

# Redis (Upstash)
REDIS_URL=redis://default:password@host:port
REDIS_REST_URL=https://...rest.upstash.io
REDIS_REST_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000 (local) ou https://pdv.empresa.com (prod)
NODE_ENV=development

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...

# API Keys
STRIPE_PUBLIC_KEY=pk_test_... (futuro)
STRIPE_SECRET_KEY=sk_test_... (futuro)
TWILIO_ACCOUNT_SID=... (futuro)
TWILIO_AUTH_TOKEN=... (futuro)
```

---

## 7. CONFIGURAÇÕES INICIAIS

### 7.1 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript strict mode
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  
  // Compressão
  compress: true,
  
  // Imagens otimizadas
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 7.2 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultConfig';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      colors: {
        // Design System da empresa
        primary: '#0066CC',
        secondary: '#00AA66',
        // ... mais cores
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;
```

### 7.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 8. PRISMA SCHEMA EXEMPLO

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Usuários
model Usuario {
  id                  Int      @id @default(autoincrement())
  nome                String
  email               String   @unique
  password_hash       String
  role                Role     @relation(fields: [role_id], references: [id])
  role_id             Int
  ativo               Boolean  @default(true)
  
  // Relacionamentos
  vendas              Venda[]
  auditoria           Auditoria[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([role_id])
  @@index([email])
}

// Roles
model Role {
  id          Int       @id @default(autoincrement())
  nome        String    @unique
  descricao   String?
  usuarios    Usuario[]
  
  createdAt   DateTime  @default(now())
}

// Vendas
model Venda {
  id                  Int       @id @default(autoincrement())
  numero_venda        String    @unique
  operador            Usuario   @relation(fields: [operador_id], references: [id])
  operador_id         Int
  total               Decimal   @db.Decimal(10, 2)
  desconto            Decimal   @db.Decimal(10, 2) @default(0)
  forma_pagamento     String
  
  itens               ItemVenda[]
  auditoria           Auditoria[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([operador_id])
  @@index([createdAt])
}

// Items Venda
model ItemVenda {
  id                  Int       @id @default(autoincrement())
  venda               Venda     @relation(fields: [venda_id], references: [id], onDelete: Cascade)
  venda_id            Int
  produto_id          Int
  quantidade          Int
  preco_unitario      Decimal   @db.Decimal(10, 2)
  
  @@index([venda_id])
}

// Auditoria
model Auditoria {
  id                  Int       @id @default(autoincrement())
  usuario             Usuario   @relation(fields: [usuario_id], references: [id])
  usuario_id          Int
  acao                String
  descricao           String?
  ip_address          String?
  
  createdAt           DateTime  @default(now())
  
  @@index([usuario_id])
  @@index([createdAt])
}

// ... Mais models conforme módulos
```

---

## 9. MIDDLEWARE EXEMPLO

```typescript
// lib/middleware/auth.middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_key'
);

export async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Token não fornecido' },
      { status: 401 }
    );
  }

  try {
    const verified = await jwtVerify(token, secretKey);
    return verified.payload;
  } catch (err) {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Token inválido' },
      { status: 403 }
    );
  }
}
```

---

## 10. SERVICE EXEMPLO

```typescript
// lib/services/vendas.service.ts

import { prisma } from '@/lib/prisma';
import { CreateVendaInput } from '@/lib/validations/vendas.schema';

export async function criarVenda(dados: CreateVendaInput, usuarioId: number) {
  // Validar permissão
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { role: true },
  });

  if (!usuario || !usuario.role.permissoes.includes('vendas.criar')) {
    throw new Error('Permissão negada');
  }

  // Calcular total
  let total = 0;
  const itens = [];

  for (const item of dados.itens) {
    const produto = await prisma.produto.findUnique({
      where: { id: item.produto_id },
    });

    if (!produto) throw new Error(`Produto ${item.produto_id} não encontrado`);
    if (produto.quantidade < item.quantidade) {
      throw new Error(`Estoque insuficiente para ${produto.nome}`);
    }

    const subtotal = produto.preco * item.quantidade;
    total += subtotal;

    itens.push({
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: produto.preco,
    });
  }

  // Aplicar desconto
  const totalComDesconto = total - (dados.desconto || 0);

  // Criar venda em transação
  const venda = await prisma.$transaction(async (tx) => {
    const novaVenda = await tx.venda.create({
      data: {
        numero_venda: `VEND-${Date.now()}`,
        operador_id: usuarioId,
        total: totalComDesconto,
        desconto: dados.desconto || 0,
        forma_pagamento: dados.forma_pagamento,
        itens: {
          createMany: {
            data: itens,
          },
        },
      },
      include: { itens: true },
    });

    // Atualizar estoque
    for (const item of itens) {
      await tx.produto.update({
        where: { id: item.produto_id },
        data: {
          quantidade: {
            decrement: item.quantidade,
          },
        },
      });
    }

    // Registrar auditoria
    await tx.auditoria.create({
      data: {
        usuario_id: usuarioId,
        acao: 'VENDA_CRIADA',
        descricao: `Venda ${novaVenda.numero_venda} criada`,
      },
    });

    return novaVenda;
  });

  return venda;
}
```

---

## 11. COMPONENTE EXEMPLO (React Hook Form + Zod)

```typescript
// components/vendas/NovaVendaForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { criarVendaSchema } from '@/lib/validations/vendas.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NovaVendaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(criarVendaSchema),
  });

  const onSubmit = async (data) => {
    const response = await fetch('/api/vendas/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Sucesso
      alert('Venda criada!');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        placeholder="Desconto"
        type="number"
        {...register('desconto', { valueAsNumber: true })}
      />
      {errors.desconto && <span>{errors.desconto.message}</span>}

      <Button type="submit">Criar Venda</Button>
    </form>
  );
}
```

---

## 12. ROADMAP DE SETUP

### Semana 1: Setup Base
- [ ] Criar repositório GitHub
- [ ] Setup Next.js com TypeScript
- [ ] Configurar Supabase
- [ ] Setup Prisma
- [ ] Configurar Tailwind + Shadcn/ui
- [ ] Setup variáveis de ambiente

### Semana 2: Autenticação
- [ ] Criar schema Prisma (Usuarios, Roles)
- [ ] Implementar JWT
- [ ] Criar API routes de auth
- [ ] Criar componentes de login

### Semana 3: Modelos Principais
- [ ] Prisma schema completo
- [ ] Migrations
- [ ] Seed inicial

### Semana 4+: Módulos
- [ ] Vendas PDV
- [ ] Estoque
- [ ] Financeiro
- [ ] Relatórios
- [ ] Etc.

---

## 13. CHECKLIST PRÉ-DESENVOLVIMENTO

```
SETUP INICIAL:
[ ] Node.js 20 LTS instalado
[ ] Git configurado
[ ] Conta Supabase criada
[ ] Projeto Vercel criado
[ ] GitHub repo criado
[ ] Variáveis .env configuradas

DEPENDÊNCIAS PRINCIPAIS:
[ ] next@latest
[ ] react@latest
[ ] typescript@latest
[ ] prisma@latest
[ ] zod@latest
[ ] react-hook-form@latest
[ ] zustand@latest
[ ] @tanstack/react-query@latest
[ ] tailwindcss@latest
[ ] shadcn/ui instalado
[ ] upstash/redis@latest

CONFIGURAÇÕES:
[ ] TypeScript strict: true
[ ] ESLint configurado
[ ] Prettier configurado
[ ] Git hooks (husky)
[ ] Database URL conectada
[ ] Prisma generate feito

SEGURANÇA:
[ ] CORS configurado
[ ] Rate limiting setup
[ ] JWT secret definido
[ ] .env.local no .gitignore
[ ] HTTPS em produção
[ ] Headers de segurança

MONITORAMENTO:
[ ] Sentry (optional)
[ ] Analytics Vercel
[ ] Logs Supabase
[ ] GitHub Actions CI/CD

TESTES:
[ ] Jest configurado
[ ] Testing Library setup
[ ] Primeiros testes unitários
[ ] Playwright para E2E

DOCUMENTAÇÃO:
[ ] README.md completo
[ ] Arquitetura documentada
[ ] Guias de desenvolvimento
[ ] API docs (Swagger/OpenAPI)
```

---

**Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Implementação

**Próximos Passos:**
1. Criar repositório e setup inicial
2. Configurar Supabase + Prisma
3. Implementar autenticação
4. Começar módulo 2.1 (Gestão Produtos)
