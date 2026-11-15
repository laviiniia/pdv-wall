# PDV Wall

Sistema PDV online para empresa alimentícia: vendas no balcão, pedidos por QR Code, estoque, financeiro e relatórios.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · Prisma 7 · PostgreSQL (local via `prisma dev`, produção via Supabase)

A especificação completa está em [`docs/`](docs/README.md).

## Como rodar (primeira vez)

Requisitos: Node.js 20+ (testado com 24) e npm.

```bash
npm install                 # instala dependências e gera o Prisma Client
cp .env.example .env.local  # depois ajuste os valores
npm run db:start            # sobe um Postgres local (sem Docker) e imprime a URL
```

Se as portas impressas forem diferentes das do `.env.local`, atualize o `DATABASE_URL` e o `SHADOW_DATABASE_URL` (o servidor local expõe um banco separado para o shadow DB do `prisma migrate dev`). Depois:

> **Limitação do banco local:** o `prisma dev` aceita **uma conexão por vez** (por isso `DATABASE_POOL_MAX=1`). Não rode scripts que conectam no banco (seed, `pg`, Prisma Studio) com o `npm run dev` ligado: a segunda conexão derruba a primeira e pode travar o servidor. Se travar (erros `ECONNRESET`/`Lock file is already being held`), pare tudo, apague a pasta `server.lock.lock` em `%LOCALAPPDATA%\prisma-dev-nodejs\Data\durable-streams\pdv-wall\` e rode `npm run db:start`. Isso não existe no Supabase.

```bash
npm run db:migrate          # cria as tabelas
npm run db:seed             # perfis, admin, categorias e produtos de exemplo
npm run dev                 # http://localhost:3000
```

Health check: <http://localhost:3000/api/health>

Logins de desenvolvimento (criados pelo seed): `admin@pdv.local` / `admin123`, `gerente@pdv.local` / `gerente123` e `operador@pdv.local` / `operador123`, um por perfil. Mude com `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_GERENTE_PASSWORD` e `SEED_OPERADOR_PASSWORD` (não use essas contas em produção). O `.env.local` precisa de um `JWT_SECRET` com pelo menos 32 caracteres.

**E-mail (Resend):** defina `RESEND_API_KEY` e `EMAIL_FROM` no `.env.local` (veja os comentários no `.env.example`) e confira em Configurações › Empresa › "Enviar e-mail de teste para mim". Sem eles, em desenvolvimento os e-mails são só impressos no terminal; falhas de envio aparecem em Auditoria › E-mail.

**Recuperação de senha em desenvolvimento:** sem `RESEND_API_KEY` e `EMAIL_FROM`, o e-mail com o link de redefinição não é enviado, só aparece no terminal do `npm run dev`. Em produção esses dois são obrigatórios.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `start` | Build e servidor de produção |
| `npm run lint` / `type-check` | ESLint / TypeScript |
| `npm run db:start` / `db:stop` | Liga/desliga o Postgres local (`prisma dev`) |
| `npm run db:migrate` | Cria/aplica migrations a partir do `prisma/schema.prisma` |
| `npm run db:seed` | Popula dados de desenvolvimento |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:reset` | Apaga o banco, reaplica migrations e roda o seed |

## Estrutura

```
app/
  (auth)/login/          tela de login (Módulo 3)
  (dashboard)/           rotas privadas com sidebar
    dashboard/           visão geral
    produtos/            Módulo 2.1
    vendas/              Módulo 2.2
    pedidos-online/      Módulo 2.3
    estoque/             Módulo 2.4
    caixa/               Módulo 2.5 (abertura/fechamento de caixa)
    financeiro/          Módulo 2.5
    relatorios/          Módulo 2.6
    configuracoes/       Módulo 4
  api/                   route handlers (backend)
components/
  ui/                    componentes shadcn/ui
  layout/                Sidebar, PageHeader...
lib/
  prisma.ts              cliente Prisma (singleton)
  constants/             perfis/permissões, navegação
  utils/                 formatação etc.
  generated/prisma/      Prisma Client gerado (não versionado)
prisma/
  schema.prisma          modelo de dados
  migrations/            histórico de migrations
  seed.ts                dados iniciais
docs/                    especificação funcional e técnica
```

Convenções que vamos seguir conforme os módulos forem implementados (ver `docs/ARQUITETURA_FINAL.md`):
`lib/services/*.service.ts` para regra de negócio, `lib/validations/*.schema.ts` para schemas Zod e `components/<modulo>/` para componentes de cada módulo.

## Usando o Supabase em vez do banco local

1. Crie um projeto em supabase.com.
2. Em *Project Settings → Database*, copie a connection string (URI) para o `DATABASE_URL` do `.env.local`.
3. Rode `npm run db:migrate` (ou `npx prisma migrate deploy` em produção) e `npm run db:seed`.

## Status

- [x] Setup base: Next 16, Tailwind 4, shadcn/ui, Prisma 7, banco local
- [x] Schema inicial: usuários, perfis, auditoria, tokens de reset, categorias, produtos
- [x] Layout do dashboard + listagem de produtos (somente leitura)
- [x] Módulo 3 (parte 1): login/logout com JWT em cookie httpOnly, proteção de rotas (`proxy.ts` + `lib/auth/dal.ts`), limite de 5 tentativas/5 min, auditoria
- [x] Módulo 3 (parte 2): recuperar/redefinir senha (link de uso único, 1h, derruba sessões antigas)
- [x] Módulo 3 (parte 3): gestão de usuários em `/admin/usuarios` (criar, editar, desativar, bloquear, convite por link ou senha temporária), troca de senha obrigatória/voluntária em `/trocar-senha`, menu filtrado por permissão
- [x] Permissões finas por tela/ação: cada página, action e rota da API checa a própria permissão (não só o layout), seguindo a matriz do Módulo 3 — ver `docs/README.md`
- [x] Auditoria em `/admin/auditoria` (filtros por período, módulo, usuário, nível e ação; detalhes de cada registro; CSV) e senha temporária para a equipe: gerente em `/equipe` (só operadores), admin na edição do usuário. Acessos negados ficam registrados
- [x] Módulo 4 (parte 1): configurações de Empresa, Vendas, Estoque e Financeiro em `/configuracoes` (validação, padrões, permissão por seção, auditoria). Use `getConfig("vendas")` etc. nos outros módulos
- [ ] Módulo 4 (parte 2): notificações, interface, backups/logs, integrações e upload de logo
- [x] Módulo 2.1: produtos e categorias em `/produtos` (cadastro, edição, desativar/reativar, margem ao vivo, busca/filtros/ordenação/paginação, alertas de margem e validade, histórico de alterações)
- [ ] Módulo 2.1 (pendente): upload de imagem (depende do Supabase Storage) e exclusão definitiva de produto sem vendas
- [x] Módulo 2.2: PDV em `/vendas` (busca por nome/SKU/código de barras, carrinho, desconto por perfil e cupons, pagamento em dinheiro/débito/crédito/PIX/combinado, cupom para impressão, vendas do dia, cancelamento) e cupons em `/vendas/cupons`
- [ ] Módulo 2.2 (pendente): integração com maquininha e PIX dinâmico, rascunhos de venda no banco, aprovação de desconto por gerente na hora
- [x] Módulo 2.3: pedidos pelo QR Code da mesa — cardápio público em `/mesa/[token]`, acompanhamento em `/pedido/[token]`, painel da cozinha em `/pedidos-online`, mesas e QR Codes em `/pedidos-online/mesas`
- [ ] Módulo 2.3 (pendente): Supabase Realtime no lugar da consulta a cada 4–5 s, notificações por SMS/push, "chamar garçom", pagamento pelo celular e fechamento do pedido no PDV
- [x] Módulo 2.4: estoque em `/estoque` — painel com alertas e valor, entrada por compra (com fornecedor), saída/ajuste manual, histórico com desfazer, inventário por contagem física; baixa automática nas vendas, estorno no cancelamento e bloqueio de produto sem estoque no PDV e no cardápio
- [ ] Módulo 2.4 (pendente): notificações por e-mail/SMS, lotes com FIFO (hoje o produto guarda só o último lote/validade), relatórios de estoque, pedidos de compra pendentes
- [x] Módulo 2.5: caixa em `/caixa` (abertura com saldo sugerido, sangria/suprimento, fechamento com conferência e motivo de diferença; vender exige caixa aberto) e financeiro em `/financeiro` — painel do mês (faturamento, CMV, despesas por categoria, lucro, ticket médio, comparação com o mês anterior), despesas pagas na hora ou a prazo com parcelas, contas a pagar com pagamento parcial e fluxo de caixa diário
- [ ] Módulo 2.5 (pendente): despesas recorrentes geradas automaticamente, anexo de nota fiscal, conciliação bancária
- [x] Módulo 2.6: relatórios em `/relatorios` — visão geral com comparação (período anterior ou ano anterior), DRE com impostos e taxas de cartão estimados, vendas por categoria e produto, heatmap de horários e formas de pagamento; exportação CSV e impressão/PDF pelo navegador
- [ ] Módulo 2.6 (pendente): dashboard personalizável por widgets, exportação Excel/JSON/PNG, agendamento por e-mail, insights automáticos, separação PDV × pedidos online
