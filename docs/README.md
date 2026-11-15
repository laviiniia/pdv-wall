# Documentação: PDV Wall

## Comece por aqui
- [Arquitetura](ARQUITETURA_FINAL.md): stack, camadas, estrutura de pastas e fluxo de dados

## Módulos
| # | Módulo | Rota | Status |
| --- | --- | --- | --- |
| 3 | [Autenticação](modulos/MODULO_3_AUTENTICACAO.md) | `/login`, `/admin/usuarios` | Pronto: login/logout, proteção de rotas, recuperação/troca de senha e gestão de usuários |
| 4 | [Configurações](modulos/MODULO_4_CONFIGURACOES.md) | `/configuracoes` | Empresa, Vendas, Estoque e Financeiro prontos; falta notificações, interface, backups, integrações |
| 2.1 | [Gestão de Produtos](modulos/MODULO_2_1_GESTAO_PRODUTOS.md) | `/produtos` | Pronto; falta upload de imagem, status de estoque e exclusão definitiva |
| 2.2 | [Vendas PDV](modulos/MODULO_2_2_VENDAS_PDV.md) | `/vendas` | Pronto; falta integração com maquininha/PIX, rascunhos, estoque e caixa |
| 2.3 | [Pedidos Online / QR Code](modulos/MODULO_2_3_PEDIDOS_ONLINE_QR_CODE.md) | `/pedidos-online`, `/mesa/[token]` | Pronto; "tempo real" por consulta periódica (sem Supabase), sem SMS/push nem pagamento pelo celular |
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
- **Pedidos online / QR Code (Módulo 2.3):**
  - **"tempo real" sem WebSocket:** a doc prevê Supabase Realtime, que ainda não está configurado. A cozinha consulta `/api/cozinha` a cada 4 s e o cliente consulta `/api/pedidos/[token]` a cada 5 s (pausa com a aba em segundo plano). Tudo passa pelo hook `lib/pedidos/useAtualizacao.ts`: para usar Realtime, troca-se só ele;
  - **acesso sem login por token:** o QR Code leva a `/mesa/{token}` (24 caracteres aleatórios por mesa; "Novo QR" troca o token e invalida o impresso). O link de acompanhamento `/pedido/{token}` tem token próprio por pedido. `/mesa` e `/pedido` são rotas públicas no `proxy.ts`; as ações públicas só aceitam esses tokens;
  - **preço nunca vem do celular:** o servidor recalcula preço base + adicionais com o banco e grava uma "fotografia" dos itens e das personalizações;
  - **fila (seção 5.1):** tempo estimado = maior tempo de preparo entre os itens + maior tempo restante entre os pedidos à frente (cozinha em paralelo). A previsão e a posição na fila são recalculadas a cada consulta. Tempo de preparo por produto (campo novo; vazio = padrão de Configurações › Vendas — bebidas prontas devem ser 0);
  - **regras de Configurações › Vendas:** liga/desliga, horário (aceita virar a meia-noite; início = fim = 24h) e limite de pedidos simultâneos na cozinha. Anti-abuso: até 5 pedidos por mesa e 10 por IP por hora;
  - **status:** confirmado → preparando ↔ pausado → pronto → entregue, com cancelamento (cozinha, com motivo visível ao cliente) e "reabrir" de pronto para preparo. O cliente pode cancelar enquanto a cozinha não começou. Cada mudança vai para `historico_status_pedido`; transições são condicionais ao status atual (dois cliques simultâneos não geram transição dupla);
  - **personalizações:** em vez das tabelas `menu_digital` e `customizacoes_produto`, o produto ganhou "aparece no cardápio" e a tabela `adicionais_produto` (adição com preço ou remoção). Substituições da doc são cadastradas como adição com preço;
  - **cozinha:** Kanban com cronômetros, destaque de atraso, alergias em vermelho, bipe (Web Audio) quando chega pedido, etiqueta de preparo para impressora térmica em `/etiqueta/[id]` e estatísticas do dia;
  - **ainda fora:** notificações por SMS/push/desktop, "chamar garçom", pagamento pelo celular e fechamento do pedido no caixa (o cliente paga no PDV, lançando os itens), status da mesa (ocupada/limpando), filtros "apenas meus"/por categoria no painel, checagem de estoque.
- **Vendas / PDV (Módulo 2.2):**
  - **preços nunca vêm do navegador:** a tela manda só produto e quantidade; o servidor busca preço e custo no banco, recalcula tudo em centavos (`lib/vendas/calculo.ts`, mesmo código da prévia na tela) e grava venda, itens e pagamentos numa transação. `CHECK`s no banco garantem `total = subtotal − desconto`, quantidades e valores positivos;
  - **itens guardam uma "fotografia"** do produto (nome, SKU, preço e custo do momento), como a doc pede, para o histórico não mudar quando o produto for editado. Quantidade aceita fração (kg, L); produto "un" só aceita inteiro;
  - **descontos:** um por venda (percentual, valor ou cupom), como a doc recomenda. O limite por perfil vem de Configurações › Vendas (operador 20%, gerente 50%, admin sem limite) e é checado na tela e de novo no servidor. A doc também cita limite em R$ para operador (R$ 50) e limite diário (R$ 500): não implementados. **Aprovação de gerente:** acima do valor configurado, o operador é orientado a chamar um gerente, que finaliza a venda com o próprio login (não há a senha do gerente digitada na hora);
  - **cupons:** código único em maiúsculas, % ou R$, compra mínima, limite de usos, período de validade. O uso é reservado de forma atômica (duas vendas simultâneas não estouram o limite) e devolvido se a venda for cancelada. As mensagens de erro seguem a doc;
  - **pagamentos:** dinheiro (troco), débito, crédito (parcelas até o máximo configurado, mínimo de R$ 5,00 por parcela), PIX e voucher, ou combinados. Só aparecem as formas habilitadas nas configurações. **Sem integração externa:** maquininha e PIX são confirmados manualmente pelo operador (campo opcional de NSU/ID). O QR Code dinâmico do PIX e o webhook do banco ficam para quando houver um provedor de pagamentos;
  - **número da venda:** `VEND-AAAAMMDD-000123`, com a data no fuso da empresa e o id como sequencial (único, mas não reinicia a cada dia);
  - **cupom impresso:** página `/cupom/[id]` no tamanho da bobina configurada (58/80 mm ou A4), via impressão do navegador. Marcado como "recibo, não é documento fiscal" — emissão de NFC-e/SAT depende de integração fiscal (não prevista na doc da V1). Não há "imprimir automático" porque o navegador bloqueia janelas abertas sem clique;
  - **cancelamento:** gerente/admin cancelam qualquer venda; operador só as próprias (matriz do Módulo 3). Exige motivo; a venda fica no histórico como cancelada;
  - **carrinho no navegador:** sobrevive a recarregar a página e é apagado ao sair do sistema. **Rascunhos de venda** (tabela `vendas_pendentes`) ainda não existem;
  - **ainda fora:** baixa automática de estoque e bloqueio de produto sem estoque (Módulo 2.4), caixa atribuído (Módulo 2.5), produtos favoritos por operador. As datas de cupom (`datetime-local`) são interpretadas no fuso do servidor: em produção na Vercel (UTC), convém ajustar para o fuso da empresa.
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
