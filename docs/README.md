# Documentação: PDV Wall

## Comece por aqui
- [Arquitetura](ARQUITETURA_FINAL.md): stack, camadas, estrutura de pastas e fluxo de dados

## Módulos
| # | Módulo | Rota | Status |
| --- | --- | --- | --- |
| 3 | [Autenticação](modulos/MODULO_3_AUTENTICACAO.md) | `/login`, `/admin/usuarios` | Pronto: login/logout, proteção de rotas, recuperação/troca de senha e gestão de usuários |
| 4 | [Configurações](modulos/MODULO_4_CONFIGURACOES.md) | `/configuracoes` | A fazer |
| 2.1 | [Gestão de Produtos](modulos/MODULO_2_1_GESTAO_PRODUTOS.md) | `/produtos` | Schema pronto, listagem |
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
- **Gestão de usuários:**
  - não há "deletar": usuários são **desativados** (preserva histórico de vendas e auditoria);
  - senha inicial em 3 modos: link por e-mail (padrão, 72h), senha temporária gerada (mostrada uma vez) ou definida pelo admin — nos dois últimos a troca é obrigatória no 1º acesso (`deve_trocar_senha`);
  - a senha temporária **não** é enviada por e-mail (a doc previa isso); quem quer envio usa o modo link;
  - travas: o admin não pode tirar o próprio acesso e o sistema nunca fica sem um admin ativo;
  - ainda fora: "caixa atribuído" (depende do módulo de caixa) e permissões customizadas por usuário (a coluna `permissoes_custom` já existe e é somada às do perfil).
- **Rate limit de login:** é contado pelos registros `LOGIN_FALHA` da tabela `auditoria` (5 em 5 min por e-mail), sem Redis por enquanto.

Os arquivos `RESUMO_FINAL.md` e `SETUP_INSTRUCOES.md` são registros da fase de planejamento e não refletem o setup atual. Para isso, veja o [README](../README.md).
