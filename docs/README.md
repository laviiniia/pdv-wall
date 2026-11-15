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
| 2.4 | [Controle de Estoque](modulos/MODULO_2_4_CONTROLE_ESTOQUE.md) | `/estoque` | Pronto; falta notificações, lotes com FIFO e relatórios |
| 2.5 | [Financeiro](modulos/MODULO_2_5_FINANCEIRO.md) | `/caixa`, `/financeiro` | Pronto; falta recorrência automática, anexos e conciliação (impostos/taxas e exportação estão em Relatórios) |
| 2.6 | [Relatórios](modulos/MODULO_2_6_RELATORIOS.md) | `/relatorios` | Pronto; falta widgets personalizáveis, Excel/agendamento por e-mail e insights automáticos |

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
- **E-mail (Resend):** chamado direto pela API REST (`lib/services/email.service.ts`, sem SDK). Sem `RESEND_API_KEY`/`EMAIL_FROM`, em dev o e-mail vai para o terminal e em produção dá erro. Falhas viram mensagem explicada (chave inválida, domínio não verificado, modo de teste, limite) e ficam na auditoria como `EMAIL_FALHA`; recuperação de senha mostra "tente de novo", convite de usuário não desfaz a criação (o admin reenvia o link ou gera senha temporária). O admin testa o envio em Configurações › Empresa.
- **Permissões (matriz do Módulo 3):**
  - toda página, server action e rota de API checa a permissão que precisa (`exigirPermissao`); o layout também checa, mas não é a única barreira (o Next pode renderizar uma página sem refazer o layout);
  - **produtos:** ver exige `produtos.ver`; criar/editar exige `produtos.gerenciar` (o Módulo 2.1 libera para gerente, a matriz do Módulo 3 só para admin — seguimos o 2.1); mudar preço de produto existente exige também `produtos.editar_preco` (campos ficam travados sem ela);
  - **estoque:** o operador vê a lista com quantidade e situação; alertas, valor do estoque e histórico de movimentações exigem `estoque.historico` (gerente/admin), como na matriz;
  - **descontos** seguem os limites por perfil de Configurações › Vendas (operador, gerente, admin sem limite), não as strings `vendas.desconto_*`;
  - **auditoria (`/admin/auditoria`):** admin (`auditoria.ver`) vê tudo; gerente (`auditoria.ver_vendas`) vê só vendas, pedidos online e caixa — a "auditoria de vendas" da matriz —, sem logins, usuários e configurações. Toda tentativa de abrir tela sem permissão grava `ACESSO_NEGADO` (nível WARN). Exporta até 5.000 linhas em CSV;
  - **senha da equipe:** a doc diz que o gerente pode "redefinir senha". Como o e-mail pode não estar configurado, o gerente (`usuarios.redefinir_senha`) gera em `/equipe` uma **senha temporária só para operadores**: mostrada uma vez, obriga a troca no próximo acesso, derruba as sessões abertas e desbloqueia a conta. O admin tem o mesmo botão na edição do usuário, para qualquer perfil;
  - **ainda fora:** "criar pedido" pela equipe (o pedido nasce no QR Code da mesa).
- **Relatórios (Módulo 2.6):**
  - **calculado na hora, sem tabelas de agregação:** um serviço só (`lib/services/relatorios.service.ts`) lê as vendas finalizadas do período e calcula tudo numa passada (DRE, categorias, produtos, formas, heatmap, série diária). Suficiente para o volume de uma lanchonete; o período personalizado é limitado a ~1 ano;
  - **período e comparação na URL** (`?preset=mes&comparar=anterior`, ou `preset=personalizado&de=…&ate=…`), então o link do relatório pode ser compartilhado e as abas mantêm o filtro. "Este mês" vai até hoje e compara com os mesmos dias do mês anterior; "ano" compara com o mesmo período do ano passado;
  - **DRE:** faturamento = vendas finalizadas (já sem desconto); impostos sobre vendas = soma das alíquotas de Configurações › Financeiro sobre o faturamento e taxas de cartão = percentuais de Configurações › Vendas sobre débito/crédito — **ambos estimativas**, ajustáveis ao regime da empresa (IR/CSLL não são calculados). O painel de `/financeiro` mostra o lucro antes desses itens. Despesas da categoria "CMV" ficam fora (o custo já vem dos itens vendidos);
  - **produtos:** a receita de cada item já tem o desconto da venda rateado; custo é o gravado na hora da venda;
  - **PDV × online:** a doc separa receita do PDV e de pedidos online, mas o pedido online é pago no caixa e vira uma venda do PDV sem vínculo com o pedido, então não há como separar ainda;
  - **exportação:** CSV no padrão do Excel em português (`;`, vírgula decimal, BOM UTF-8) por `/api/relatorios/[tipo]`; PDF pelo "Imprimir / PDF" do navegador (menu e filtros somem na impressão). Excel com abas, JSON, PNG, agendamento por e-mail, widgets arrastáveis e "insights de IA" ficaram de fora.
- **Financeiro (Módulo 2.5):**
  - **caixa obrigatório para vender:** o PDV monta o carrinho, mas só finaliza com uma sessão de caixa aberta pelo operador (a venda grava `sessao_caixa_id` e o número do caixa). Quantidade de caixas vem de Configurações › Financeiro; índices únicos parciais no banco garantem um caixa aberto por número e por operador;
  - **o "esperado" conta só dinheiro:** saldo inicial + vendas em dinheiro (já sem o troco) + suprimentos − sangrias − despesas pagas com o dinheiro do caixa. Cartão e PIX aparecem à parte, para conferir com a maquininha/extrato. O saldo inicial sugerido é o que foi contado no último fechamento daquele caixa;
  - **fechamento:** diferença exige motivo (lista fixa); com "só gerente fecha com diferença" ligado, quem não tem `caixa.fechar_com_diferenca` precisa chamar um gerente, que fecha pela tela da sessão (`/caixa/[id]`). Sangria não pode passar do dinheiro esperado. A sessão fechada não reabre;
  - **despesas:** categorias vêm de Configurações › Financeiro (padrão + customizadas). "Já foi paga" registra a forma (e, se em dinheiro, pode sair do caixa aberto); "a pagar" gera 1 a 24 parcelas mensais em contas a pagar (a última absorve os centavos). Fornecedor reaproveita a tabela do estoque. Cancelar despesa cancela as parcelas pendentes e é bloqueado se alguma já foi paga ou se o dinheiro saiu de um caixa já fechado;
  - **contas a pagar:** pagamento total ou parcial (status pendente → parcial → paga), com data, forma e nº da transação; "vencida" é calculada pela data, não gravada. O pagamento é condicional ao valor pago anterior, então dois pagamentos simultâneos não se sobrepõem;
  - **painel (competência):** faturamento das vendas finalizadas − CMV (preço de custo gravado em cada item vendido) = lucro bruto; − despesas do mês = lucro líquido. Despesas da categoria "CMV" (compras de insumo) ficam fora do resultado para não contar o custo duas vezes. **Fluxo de caixa (regime de caixa):** entradas = recebimentos das vendas; saídas = despesas pagas na hora + pagamentos de contas, no dia em que o dinheiro saiu;
  - **ainda fora:** geração automática de despesas recorrentes, anexo de NF, centro de custo, exportação PDF/Excel, gráficos e conciliação bancária.
- **Estoque (Módulo 2.4):**
  - **controle opcional por produto** (`controlar_estoque`, desligado por padrão): num restaurante, lanche montado na hora não tem saldo como uma lata de refrigerante, e ligar o controle para tudo com saldo zero travaria as vendas. Só produtos controlados têm baixa, alertas e bloqueio. A primeira entrada de mercadoria liga o controle do produto;
  - **saldo no próprio produto** (`produtos.quantidade_estoque`, aceita fração para kg/L) em vez da tabela `estoque` separada, e um **livro-razão** `movimento_estoque` com saldo anterior/novo de cada movimento (`CHECK saldo_novo = saldo_anterior + quantidade`);
  - **concorrência:** todo movimento passa por `lib/estoque/movimentar.ts`, que soma no banco numa instrução só (`UPDATE … RETURNING`) e, quando o negativo não é permitido, checa o saldo no mesmo UPDATE — duas vendas simultâneas não "perdem" baixa nem passam do saldo;
  - **vendas:** a baixa acontece na mesma transação da venda (Configurações › Estoque › baixa automática); faltando saldo e com negativo proibido, a venda inteira é desfeita com a mensagem "Estoque insuficiente de X (disponível: N)". Cancelar a venda devolve ao estoque (movimento "Venda cancelada"). **Pedidos online não dão baixa** (o cliente paga no caixa e a venda é lançada no PDV — dar baixa nos dois contaria em dobro), mas o cardápio mostra "Esgotado" e o pedido é recusado sem saldo;
  - **níveis de alerta** usam Configurações › Estoque ("% acima do mínimo"): sem estoque (≤ 0), crítico, baixo e normal. Com mínimo 0, só "sem estoque" alerta. O dashboard mostra a contagem; notificações por e-mail/SMS ficam para quando houver o serviço de e-mail configurado;
  - **entrada por compra:** fornecedor (cadastro mínimo — nome novo cria o fornecedor; a tabela `fornecedores` não estava definida na doc e será reaproveitada em contas a pagar), NF obrigatória, vários itens com lote e validade. O custo unitário vira o preço de custo do produto, se continuar abaixo do preço de venda; lote/validade informados atualizam os do produto. Não há "compra pendente/parcial": a entrada já é a mercadoria recebida;
  - **saída manual:** devolução, dano, perda e ajuste (para mais ou para menos), sempre com motivo. **Desfazer** (só admin, como a doc) vale para movimentos manuais e entradas; venda se desfaz cancelando a venda;
  - **inventário:** total ou por categoria, um por vez (índice único parcial no banco). Pode salvar e continuar depois; as vendas seguem normalmente. Ao finalizar, o saldo de cada produto contado vira o valor contado (movimento "Inventário") e a diferença é calculada contra o saldo daquele momento; divergência acima de Configurações › Estoque é destacada;
  - **ainda fora:** lotes com FIFO (o produto guarda só o último lote/validade), notificações, relatórios de estoque, transferência entre depósitos, "fechar vendas durante inventário".
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
  - **ainda fora:** baixa automática de estoque e bloqueio de produto sem estoque (Módulo 2.4), produtos favoritos por operador. As datas de cupom (`datetime-local`) são interpretadas no fuso do servidor: em produção na Vercel (UTC), convém ajustar para o fuso da empresa.
- **Produtos (Módulo 2.1):**
  - **permissões:** a doc do 2.1 diz que o gerente cria, edita e desativa produtos; a matriz do Módulo 3 diz que ele só edita preço. Seguimos o 2.1 (`produtos.gerenciar` para admin e gerente; operador só visualiza). Se a regra certa for a do Módulo 3, basta tirar `produtos.gerenciar` do gerente em `lib/constants/roles.ts` e rodar o seed;
  - **auditoria:** em vez das tabelas `auditoria_produtos`/`auditoria_categorias`, as alterações vão para a tabela única `auditoria` (módulos `PRODUTOS`/`CATEGORIAS`), com o diff campo a campo; o histórico do produto é lido de lá;
  - **regras no banco:** `CHECK (preco_custo > 0)`, `CHECK (preco_venda > preco_custo)` e nomes únicos sem diferenciar maiúsculas (índices em `lower(nome)`), criados à mão na migration `*_produtos_regras` (o Prisma não os representa no schema, mas também não os remove);
  - **"% de lucro"** segue a fórmula da doc: margem ÷ custo × 100 (markup). O alerta de "margem baixa" compara esse número com a margem mínima de Configurações › Financeiro;
  - **nome:** aceita letras com acento, números, espaços e hífen (a doc proíbe caracteres especiais); **SKU** no formato `TIPO-NÚMERO`, sempre em maiúsculas;
  - **validade:** precisa ser futura ao cadastrar ou ao alterar a data; um produto já vencido pode ser editado sem mexer nela. O alerta usa os dias de antecedência de Configurações › Estoque;
  - **ainda fora:** upload de imagem (redimensionar para 400×400 e guardar no Supabase Storage) e exclusão definitiva só para quem não tem vendas. O status de estoque agora vem do Módulo 2.4. A ordenação por margem calcula em memória, o que é suficiente para centenas de produtos.
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
