# Documentação: PDV Wall

## Comece por aqui
- [Arquitetura](ARQUITETURA_FINAL.md): stack, camadas, estrutura de pastas e fluxo de dados

## Módulos
| # | Módulo | Rota | Status |
| --- | --- | --- | --- |
| 3 | [Autenticação](modulos/MODULO_3_AUTENTICACAO.md) | `/login`, `/admin/usuarios` | Pronto: login/logout, proteção de rotas, recuperação/troca de senha e gestão de usuários |
| 4 | [Configurações](modulos/MODULO_4_CONFIGURACOES.md) | `/configuracoes` | Empresa, Vendas, Estoque e Financeiro prontos; falta notificações, interface, backups, integrações |
| 2.1 | [Gestão de Produtos](modulos/MODULO_2_1_GESTAO_PRODUTOS.md) | `/produtos` | Pronto; falta upload de imagem, status de estoque e exclusão definitiva |
| 2.2 | [Vendas PDV](modulos/MODULO_2_2_VENDAS_PDV.md) | `/vendas` | A fazer |
| 2.3 | [Pedidos Online / QR Code](modulos/MODULO_2_3_PEDIDOS_ONLINE_QR_CODE.md) | `/pedidos-online` | A fazer |
| 2.4 | [Controle de Estoque](modulos/MODULO_2_4_CONTROLE_ESTOQUE.md) | `/estoque` | A fazer |
| 2.5 | [Financeiro](modulos/MODULO_2_5_FINANCEIRO.md) | `/financeiro` | A fazer |
| 2.6 | [Relatórios](modulos/MODULO_2_6_RELATORIOS.md) | `/relatorios` | A fazer |

Ordem de desenvolvimento recomendada: 3 → 4 → 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6.

## Design
- [Guia do Design System (Figma)](GUIA_DESIGN_SYSTEM_FIGMA.md)

## Divergências entre a documentação e o código
A documentação foi escrita para Next.js 14 / Prisma 5. O projeto usa versões mais novas; onde a documentação conflitar, vale isto:

- **Next.js 16:** `middleware.ts` foi renomeado para `proxy.ts`; `params` e `searchParams` são `Promise` (use `await`).
- **Tailwind 4:** não existe `tailwind.config.ts`; tema e cores ficam em `app/globals.css` (`@theme`).
- **Prisma 7:** a URL do banco fica em `prisma.config.ts`, o client é gerado em `lib/generated/prisma` e a conexão usa `@prisma/adapter-pg`.
- **Nomes no schema:** campos em camelCase no código (`precoVenda`), mapeados para snake_case no banco (`preco_venda`) via `@map`.
- **Auth:** a documentação cita tanto Supabase Auth quanto JWT próprio. O Módulo 3 especifica JWT próprio (`jose` + `bcryptjs`), que é o caminho adotado.
- **Onde fica o token:** a documentação sugere `localStorage` + header `Authorization`. O código guarda o JWT num **cookie httpOnly**, que o JavaScript da página não consegue ler (protege contra roubo por XSS). A sessão dura 8h, ou 7 dias com "manter conectado". Ainda não há refresh token separado: ao expirar, a pessoa faz login de novo.
- **Recuperar senha:** a resposta é sempre a mesma ("se o e-mail estiver cadastrado...") para não revelar quem tem conta; a documentação previa avisar quando o e-mail não existe. A rota é `/redefinir-senha`, não `/reset-senha`. O token é guardado só como hash SHA-256 (sem a coluna `token_plain`) e sessões antigas são derrubadas comparando o `iat` do JWT com `password_changed_at`.
- **Produtos (Módulo 2.1):**
  - **permissões:** a doc do 2.1 diz que o gerente cria, edita e desativa produtos; a matriz do Módulo 3 diz que ele só edita preço. Seguimos o 2.1 (`produtos.gerenciar` para admin e gerente; operador só visualiza). Se a regra certa for a do Módulo 3, basta tirar `produtos.gerenciar` do gerente em `lib/constants/roles.ts` e rodar o seed;
  - **auditoria:** em vez das tabelas `auditoria_produtos`/`auditoria_categorias`, as alterações vão para a tabela única `auditoria` (módulos `PRODUTOS`/`CATEGORIAS`), com o diff campo a campo; o histórico do produto é lido de lá;
  - **regras no banco:** `CHECK (preco_custo > 0)`, `CHECK (preco_venda > preco_custo)` e nomes únicos sem diferenciar maiúsculas (índices em `lower(nome)`), criados à mão na migration `*_produtos_regras` (o Prisma não os representa no schema, mas também não os remove);
  - **"% de lucro"** segue a fórmula da doc: margem ÷ custo × 100 (markup). O alerta de "margem baixa" compara esse número com a margem mínima de Configurações › Financeiro;
  - **nome:** aceita letras com acento, números, espaços e hífen (a doc proíbe caracteres especiais); **SKU** no formato `TIPO-NÚMERO`, sempre em maiúsculas;
  - **validade:** precisa ser futura ao cadastrar ou ao alterar a data; um produto já vencido pode ser editado sem mexer nela. O alerta usa os dias de antecedência de Configurações › Estoque;
  - **ainda fora:** upload de imagem (redimensionar para 400×400 e guardar no Supabase Storage), status de estoque (precisa da quantidade atual, Módulo 2.4) e exclusão definitiva só para quem não tem vendas (Módulo 2.2). A ordenação por margem calcula em memória, o que é suficiente para centenas de produtos.
- **Configurações (Módulo 4):**
  - uma linha por seção na tabela `configuracoes` (`chave` = `empresa`, `vendas`, `estoque`, `financeiro`), sem a coluna `tipo` (a chave já é a seção); formato e valores padrão definidos em `lib/validations/configuracoes.schema.ts`. Nos outros módulos, leia com `getConfig("vendas")`: sempre vem completo, com os padrões para o que nunca foi salvo;
  - permissão: todos visualizam; admin edita tudo; gerente edita só Estoque (`configuracoes.editar_operacional`). Vendas é só admin porque contém os limites de desconto do próprio gerente;
  - descontos máximos em **percentual** (a doc também cita valor em R$; dá para acrescentar quando o PDV existir);
  - ainda fora: notificações (SMTP/SMS próprios — hoje o e-mail usa Resend via `.env`), customização de interface/menu, backups (o Supabase já faz), integrações, upload de logo (depende do Supabase Storage), busca de CEP e tabela `integracoes`.
- **Gestão de usuários:**
  - não há "deletar": usuários são **desativados** (preserva histórico de vendas e auditoria);
  - senha inicial em 3 modos: link por e-mail (padrão, 72h), senha temporária gerada (mostrada uma vez) ou definida pelo admin — nos dois últimos a troca é obrigatória no 1º acesso (`deve_trocar_senha`);
  - a senha temporária **não** é enviada por e-mail (a doc previa isso); quem quer envio usa o modo link;
  - travas: o admin não pode tirar o próprio acesso e o sistema nunca fica sem um admin ativo;
  - ainda fora: "caixa atribuído" (depende do módulo de caixa) e permissões customizadas por usuário (a coluna `permissoes_custom` já existe e é somada às do perfil).
- **Rate limit de login:** é contado pelos registros `LOGIN_FALHA` da tabela `auditoria` (5 em 5 min por e-mail), sem Redis por enquanto.

Os arquivos `RESUMO_FINAL.md` e `SETUP_INSTRUCOES.md` são registros da fase de planejamento e não refletem o setup atual. Para isso, veja o [README](../README.md).
