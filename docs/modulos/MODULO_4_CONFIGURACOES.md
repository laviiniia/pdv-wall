# MÓDULO 4: CONFIGURAÇÕES DO SISTEMA

## 📋 Sumário Executivo

**Objetivo:** Centralizar todas as configurações do sistema, preferências da empresa, parametrizações de regras de negócio e customizações operacionais. Permitir que Admin e Gerente customizem o sistema conforme suas necessidades específicas.

**Funcionalidades Principais:**
- ✅ Configurações gerais da empresa (nome, CNPJ, endereço, logo)
- ✅ Configurações de vendas (descontos máximos, impressora)
- ✅ Configurações de estoque (alertas, mínimos)
- ✅ Configurações financeiras (impostos, categorias despesas)
- ✅ Configurações de notificações (email, SMS, push)
- ✅ Customização de menu (módulos visíveis por role)
- ✅ Temas e interface (cores, logos, layout)
- ✅ Backups automáticos
- ✅ Logs do sistema
- ✅ Integrações com serviços externos

**Perfis de Acesso:**
- Admin: Acesso total a todas as configurações
- Gerente: Configurações operacionais (impressora, alertas)
- Operador: Apenas visualizar configurações (read-only)

**Categorias:** Empresa, Vendas, Estoque, Financeiro, Notificações, Interface, Integrações

---

## 1. FUNCIONALIDADE 1.1: CONFIGURAÇÕES GERAIS DA EMPRESA

### 1.1.1 Dados Básicos da Empresa

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > EMPRESA                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [Dados Básicos] [Localização] [Contatos] [Integrações]
│                                                      │
│ ─── INFORMAÇÕES GERAIS ───────────────────────────  │
│                                                      │
│ Nome da Empresa:                                   │
│ [Restaurante XYZ Ltda________________]             │
│                                                      │
│ CNPJ:                                              │
│ [12.345.678/0001-00_____________]                 │
│                                                      │
│ Inscrição Estadual (IE):                           │
│ [123.456.789.012______________________]           │
│                                                      │
│ Tipo de Contribuinte:                              │
│ [○ Simples Nacional] [● Lucro Real] [○ Outro]    │
│                                                      │
│ Categoria Negócio:                                 │
│ [Restaurante/Lanchonete ▼]                        │
│                                                      │
│ Logo da Empresa:                                   │
│ ┌──────────────────┐                               │
│ │   [Logo.png]     │  [Alterar Logo] [Remover]   │
│ │  100x100px       │                               │
│ └──────────────────┘                               │
│                                                      │
│ ─── CONTATO ───────────────────────────────────────│
│                                                      │
│ Telefone Geral:                                    │
│ [(11) 3000-0000___________________]               │
│                                                      │
│ Email de Contato:                                  │
│ [contato@restaurante.com____________________]     │
│                                                      │
│ Website (opcional):                                │
│ [www.restaurante.com.br____________________]      │
│                                                      │
│ ─── ENDEREÇO ──────────────────────────────────────│
│                                                      │
│ CEP:                                               │
│ [01310-100_________________]  [Buscar]             │
│                                                      │
│ Rua:                                               │
│ [Avenida Paulista, 1000_________________]         │
│                                                      │
│ Número:                                            │
│ [1000_________________]                            │
│                                                      │
│ Complemento:                                       │
│ [Sala 500_________________]                        │
│                                                      │
│ Bairro:                                            │
│ [Bela Vista_________________]                      │
│                                                      │
│ Cidade:                                            │
│ [São Paulo_________________]                       │
│                                                      │
│ Estado:                                            │
│ [SP ▼]                                             │
│                                                      │
│ ─── FUNCIONAMENTO ────────────────────────────────│
│                                                      │
│ Horário de Abertura:                              │
│ [11:00] até [23:00]                               │
│                                                      │
│ Dias de Funcionamento:                             │
│ ☑ Seg ☑ Ter ☑ Qua ☑ Qui ☑ Sex ☑ Sab ☑ Dom      │
│                                                      │
│ Timezone:                                          │
│ [America/Sao_Paulo ▼]                            │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 1.1.2 Dados Armazenados

```sql
-- Será armazenado em tabela CONFIGURACOES:

configuracao_empresa = {
  "nome": "Restaurante XYZ Ltda",
  "cnpj": "12345678000100",
  "ie": "123456789012",
  "contribuinte": "lucro_real",
  "categoria": "restaurante",
  "logo_url": "/logos/empresa_12345.png",
  
  "contato": {
    "telefone": "1130000000",
    "email": "contato@restaurante.com",
    "website": "www.restaurante.com.br"
  },
  
  "endereco": {
    "cep": "01310100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Sala 500",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "coordenadas": {
      "latitude": -23.5615,
      "longitude": -46.6560
    }
  },
  
  "funcionamento": {
    "horario_abertura": "11:00",
    "horario_fechamento": "23:00",
    "dias_funcionamento": [1, 2, 3, 4, 5, 6, 7],
    "timezone": "America/Sao_Paulo"
  }
}
```

---

## 2. FUNCIONALIDADE 2.1: CONFIGURAÇÕES DE VENDAS

### 2.1.1 Regras de Desconto e PDV

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > VENDAS                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ─── DESCONTOS ────────────────────────────────────  │
│                                                      │
│ Desconto Máximo por Venda (Operador):              │
│ [20] %  ou  R$ [500,00]                            │
│ ○ Por Percentual  ● Por Valor  ○ Ambos             │
│                                                      │
│ Desconto Máximo por Venda (Gerente):               │
│ [50] %  ou  R$ [2.000,00]                          │
│ ○ Por Percentual  ● Por Valor  ○ Ambos             │
│                                                      │
│ Desconto Máximo por Venda (Admin):                 │
│ [Ilimitado]  (nenhum limite)                       │
│                                                      │
│ Requer Aprovação Gerente para Descontos > [R$ 200] │
│ [☑ Ativado]                                        │
│                                                      │
│ ─── PAGAMENTOS ────────────────────────────────────│
│                                                      │
│ Formas de Pagamento Ativas:                        │
│ ☑ Dinheiro                                         │
│ ☑ Débito                                           │
│ ☑ Crédito                                          │
│ ☑ PIX                                              │
│ ☑ Convênios                                        │
│ ☐ Trocas                                           │
│ ☐ Outros (especifique)                             │
│                                                      │
│ Aceita Parcelamento em Crédito?                    │
│ [☑ Sim]  até [12] parcelas                         │
│                                                      │
│ Taxa de Cartão Débito:  [0,00]%                    │
│ Taxa de Cartão Crédito: [2,50]%                    │
│                                                      │
│ ─── IMPRESSORA ────────────────────────────────────│
│                                                      │
│ Impressora Térmica Ativa?                          │
│ [☑ Sim]                                            │
│                                                      │
│ Tamanho Papel:                                     │
│ [○ 80mm] [● 58mm] [○ A4]                          │
│                                                      │
│ Cópias por Venda:                                  │
│ [1] cópia(s)                                       │
│                                                      │
│ Impressora Conectada:                              │
│ [Bematech BR 3000 ▼]  [Testar] [Adicionar]        │
│                                                      │
│ ─── VOUCHERS/RECIBOS ──────────────────────────────│
│                                                      │
│ Imprimir Cupom Fiscal?                             │
│ [☑ Sim]                                            │
│                                                      │
│ Numeração Cupom (próximo):                         │
│ [CUPON-00001256__]                                 │
│                                                      │
│ Rodapé Personalizado Cupom:                        │
│ [Obrigado! Volte Sempre!________________]         │
│                                                      │
│ ─── PEDIDOS ONLINE ────────────────────────────────│
│                                                      │
│ Aceita Pedidos Online?                             │
│ [☑ Sim]                                            │
│                                                      │
│ Limite de Pedidos Simultâneos:                     │
│ [30] pedidos (capacidade cozinha)                  │
│                                                      │
│ Tempo Médio de Preparo (minutos):                  │
│ [20]  (padrão para todos produtos)                 │
│                                                      │
│ Horário Início Pedidos Online:                     │
│ [11:00]                                            │
│                                                      │
│ Horário Fim Pedidos Online:                        │
│ [22:30]  (30 min antes do fechamento)              │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 3. FUNCIONALIDADE 3.1: CONFIGURAÇÕES DE ESTOQUE

### 3.1.1 Alertas e Mínimos

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > ESTOQUE                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ─── ALERTAS ───────────────────────────────────────│
│                                                      │
│ Ativar Alertas de Estoque?                         │
│ [☑ Sim]                                            │
│                                                      │
│ Alertar quando Quantidade Cai Para:                │
│ [●○ Mínimo Predefinido]  ou  [○● Quantidade]     │
│                                                      │
│ Quantidade Crítica (vermelho):                      │
│ [20%] acima do mínimo  (padrão)                    │
│                                                      │
│ Quantidade Baixa (amarelo):                        │
│ [50%] acima do mínimo  (padrão)                    │
│                                                      │
│ ─── CANAIS DE NOTIFICAÇÃO ────────────────────────│
│                                                      │
│ Notificar via:                                     │
│ ☑ Toast na Tela (imediato)                        │
│ ☑ Email para Gerente                              │
│ ☐ Email para Admin                                │
│ ☐ SMS para Celular                                │
│ ☑ Dashboard (widget)                              │
│                                                      │
│ ─── MOVIMENTAÇÕES ────────────────────────────────│
│                                                      │
│ Registrar Automaticamente Saída de Vendas?         │
│ [☑ Sim]  (desconta automaticamente ao vender)     │
│                                                      │
│ Requer Confirmação para Saída Manual?              │
│ [☑ Sim]  (dano, perda, devolução)                 │
│                                                      │
│ Permitir Venda com Estoque Negativo?               │
│ [☐ Não]  (bloqueado por padrão)                   │
│                                                      │
│ Manter Histórico de Estoque:                       │
│ [○ 30 dias] [○ 6 meses] [● 1 ano] [○ Sempre]     │
│                                                      │
│ ─── INVENTÁRIO ────────────────────────────────────│
│                                                      │
│ Frequência Recomendada de Inventário:              │
│ [● Mensal] [○ Trimestral] [○ Anual]               │
│                                                      │
│ Fechar Vendas Durante Inventário?                  │
│ [☐ Não]  (continua normalmente)                   │
│                                                      │
│ Divergência Máxima Aceitável:                      │
│ [2,00] % (acima disso, investiga)                 │
│                                                      │
│ ─── LOTE E VALIDADE ───────────────────────────────│
│                                                      │
│ Rastrear Lotes?                                    │
│ [☑ Sim]  (FIFO automático)                        │
│                                                      │
│ Alertar Produtos Vencidos:                         │
│ [7] dias antes do vencimento                       │
│                                                      │
│ Permitir Vender Produto Vencido?                   │
│ [☐ Não]  (bloqueado)                              │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 4. FUNCIONALIDADE 4.1: CONFIGURAÇÕES FINANCEIRAS

### 4.1.1 Impostos e Categorias

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > FINANCEIRO                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ─── IMPOSTOS ──────────────────────────────────────│
│                                                      │
│ Alíquota ICMS Padrão:                              │
│ [18,00] %                                          │
│                                                      │
│ Alíquota PIS:                                      │
│ [1,65] %                                           │
│                                                      │
│ Alíquota COFINS:                                   │
│ [7,60] %                                           │
│                                                      │
│ Alíquota ISS (Serviços):                           │
│ [5,00] %  (se aplicável)                          │
│                                                      │
│ ─── CUSTOS OPERACIONAIS ───────────────────────────│
│                                                      │
│ Percentual de Margem Mínima Desejada:             │
│ [40,00] %  (para alertar se margem cair abaixo)  │
│                                                      │
│ Aluguel Mensal (para projeções):                   │
│ R$ [12.000,00]                                     │
│                                                      │
│ ─── CATEGORIAS DE DESPESA ───────────────────────│
│                                                      │
│ Categorias Ativas:                                 │
│ ☑ COGS (Custo Produtos Vendidos)                 │
│ ☑ Pessoal (Salários, encargos)                    │
│ ☑ Operacional (Aluguel, serviços)                 │
│ ☑ Marketing (Publicidade, promos)                 │
│ ☑ Financeiro (Juros, taxas)                       │
│ ☑ Outros (Itens diversos)                         │
│ ☐ Customizado 1: [_______________]                │
│ ☐ Customizado 2: [_______________]                │
│                                                      │
│ ─── CAIXA ────────────────────────────────────────│
│                                                      │
│ Múltiplos Caixas no Sistema?                       │
│ [☑ Sim]                                            │
│                                                      │
│ Número de Caixas:                                  │
│ [3] caixas                                         │
│                                                      │
│ Caixas Criados:                                    │
│ [Caixa #01] [Caixa #02] [Caixa #03]              │
│                                                      │
│ Apenas Gerente/Admin Pode Fechar Diferenças?      │
│ [☑ Sim]                                            │
│                                                      │
│ ─── FLUXO DE CAIXA ────────────────────────────────│
│                                                      │
│ Data Padrão de Fechamento Mês:                     │
│ [Último dia do mês ▼]                             │
│                                                      │
│ Período de Análise P&L:                            │
│ [Mês do calendário]  ou  [Período customizado]    │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. FUNCIONALIDADE 5.1: CONFIGURAÇÕES DE NOTIFICAÇÕES

### 5.1.1 Canais e Preferências

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > NOTIFICAÇÕES                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ─── NOTIFICAÇÕES DE VENDAS ────────────────────────│
│                                                      │
│ Alertar Desconto Aplicado (> R$ 100)?              │
│ [☑ Sim]  via [✓ Toast] [✓ Dashboard] [✗ Email]   │
│                                                      │
│ Alertar Venda Cancelada?                           │
│ [☑ Sim]  via [✓ Toast] [✗ Dashboard] [✗ Email]   │
│                                                      │
│ ─── NOTIFICAÇÕES DE ESTOQUE ──────────────────────│
│                                                      │
│ Alertar Estoque Baixo?                             │
│ [☑ Sim]  via [✓ Toast] [✓ Dashboard] [✓ Email]   │
│                                                      │
│ Alertar Produto Vencido?                           │
│ [☑ Sim]  via [✓ Toast] [✓ Dashboard] [✓ SMS]     │
│                                                      │
│ ─── NOTIFICAÇÕES FINANCEIRAS ──────────────────────│
│                                                      │
│ Alertar Conta a Pagar Vencida?                     │
│ [☑ Sim]  via [✓ Toast] [✓ Dashboard] [✓ Email]   │
│                                                      │
│ Alertar Margem Abaixo do Mínimo?                   │
│ [☑ Sim]  via [✓ Dashboard] [✓ Email]  [✗ Toast]  │
│                                                      │
│ ─── NOTIFICAÇÕES DE PEDIDOS ONLINE ────────────────│
│                                                      │
│ Notificar Novo Pedido na Cozinha?                  │
│ [☑ Sim]  via [Áudio + Vibração]  + [Toast]        │
│                                                      │
│ Notificar Pedido Pronto para Retirada?             │
│ [☑ Sim]  via [SMS] para cliente + [Toast] loja    │
│                                                      │
│ ─── CANAIS DE NOTIFICAÇÃO ────────────────────────│
│                                                      │
│ EMAIL:                                             │
│ Email Servidor (SMTP):  [smtp.gmail.com________]   │
│ Porta: [587]  Usar TLS: [☑]                       │
│ Usuário: [seu-email@gmail.com________]             │
│ Senha: [••••••••] [Testar Conexão]                │
│                                                      │
│ Email Para Alertas:                                │
│ [gerente@empresa.com________] [+ Adicionar]       │
│ [admin@empresa.com_________]  [Remover]           │
│                                                      │
│ SMS (opcional):                                    │
│ Provider: [Twilio ▼]                              │
│ Account SID: [AC••••••••••••••••••••]             │
│ Auth Token: [••••••••] [Testar SMS]               │
│                                                      │
│ PUSH NOTIFICATIONS (app):                          │
│ [☐ Ativar] (requer Firebase)                      │
│                                                      │
│ WEBHOOK (integração):                              │
│ URL: [https://seu-servidor.com/webhooks]          │
│ [☐ Ativar] [Testar]                               │
│                                                      │
│ ─── AGENDAMENTO ──────────────────────────────────│
│                                                      │
│ Horário Silencioso (sem notificações):             │
│ Início: [22:00]  Fim: [08:00]                      │
│ [☑ Ativado]                                        │
│                                                      │
│ Notificações Críticas Mesmo no Silencioso:         │
│ [☑ Sim]  (estoque vencido, conta vencida)         │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 6. FUNCIONALIDADE 6.1: CUSTOMIZAÇÃO DE INTERFACE

### 6.1.1 Tema e Menu

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > INTERFACE                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ─── TEMA ──────────────────────────────────────────│
│                                                      │
│ Tema Padrão:                                       │
│ [● Light] [○ Dark] [○ Auto (conforme hora)]       │
│                                                      │
│ Cor Primária:                                      │
│ [#0066CC ▼]  [Ver Paleta]  ■ azul                 │
│                                                      │
│ Cor Secundária:                                    │
│ [#00AA66 ▼]  [Ver Paleta]  ■ verde                │
│                                                      │
│ ─── LAYOUT ────────────────────────────────────────│
│                                                      │
│ Barra Lateral:                                     │
│ [○ Expandida] [● Colapsada] [○ Ícones]            │
│                                                      │
│ Tamanho Fonte (Escala):                            │
│ [○ 90%] [● 100%] [○ 110%] [○ 120%]                │
│                                                      │
│ Densidade Componentes:                              │
│ [○ Compacta] [● Normal] [○ Espaçosa]              │
│                                                      │
│ ─── MÓDULOS VISÍVEIS ──────────────────────────────│
│                                                      │
│ Menu Principal (Operador vê):                      │
│ ☑ Dashboard                                        │
│ ☑ Vendas (PDV)                                    │
│ ☑ Pedidos Online                                  │
│ ☐ Estoque                                          │
│ ☐ Financeiro                                       │
│ ☐ Relatórios                                       │
│ ☐ Configurações                                    │
│                                                      │
│ Menu Principal (Gerente vê):                       │
│ ☑ Dashboard                                        │
│ ☑ Vendas (PDV)                                    │
│ ☑ Pedidos Online                                  │
│ ☑ Estoque                                          │
│ ☑ Financeiro                                       │
│ ☑ Relatórios                                       │
│ ☐ Configurações                                    │
│                                                      │
│ Menu Principal (Admin vê):                         │
│ ☑ Tudo (sem opção de desabilitar)                 │
│                                                      │
│ ─── BRANDING ──────────────────────────────────────│
│                                                      │
│ Logo Cabeçalho:                                    │
│ ┌──────────────┐                                   │
│ │  Logo.png    │  [Alterar] [Remover]             │
│ │  200x60px    │                                   │
│ └──────────────┘                                   │
│                                                      │
│ Título na Aba do Navegador:                        │
│ [PDV Restaurante XYZ______________]                │
│                                                      │
│ Favicon:                                           │
│ [icon.png ▼]  [Alterar]                           │
│                                                      │
│ Cor de Fundo (Login):                              │
│ [#F5F5F5 ▼]  Usar logo como fundo?  [○ Sim]      │
│                                                      │
│ ─── ACESSIBILIDADE ────────────────────────────────│
│                                                      │
│ Modo Alto Contraste:                               │
│ [☐ Ativado]  (para deficientes visuais)            │
│                                                      │
│ Permitir Teclas Atalho (Operador)?                 │
│ [☑ Sim]  (F1=Help, F2=Nova Venda, etc)            │
│                                                      │
│ [Cancelar]  [Salvar Configurações]  [Visualizar]  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 7. FUNCIONALIDADE 7.1: BACKUPS E LOGS

### 7.1.1 Backup Automático

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > BACKUPS & LOGS                │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ─── BACKUPS AUTOMÁTICOS ──────────────────────────│
│                                                      │
│ Ativar Backups Automáticos?                        │
│ [☑ Sim]                                            │
│                                                      │
│ Frequência:                                        │
│ [○ Diária] [● 2x/dia (12h-22h)] [○ Semanal]      │
│                                                      │
│ Horário do Backup:                                 │
│ Primeiro: [12:00]                                  │
│ Segundo:  [22:00]                                  │
│                                                      │
│ Local de Armazenamento:                            │
│ [● Cloud (AWS S3)] [○ Servidor Local] [○ USB]     │
│                                                      │
│ Retenção de Backups:                               │
│ [○ 1 mês] [● 3 meses] [○ 6 meses] [○ 1 ano]      │
│                                                      │
│ Notificar Após Backup?                             │
│ [☑ Sim]  via [Email] para [admin@empresa.com]    │
│                                                      │
│ ─── BACKUPS MANUAIS ───────────────────────────────│
│                                                      │
│ Último Backup: 23/08/2026 às 22:00 (✓ OK)         │
│                                                      │
│ [Fazer Backup Agora] [Download] [Restaurar]       │
│                                                      │
│ ─── LOGS DO SISTEMA ───────────────────────────────│
│                                                      │
│ Nível de Log:                                      │
│ [○ DEBUG] [● INFO] [○ WARN] [○ ERROR]             │
│ (DEBUG = mais verboso, mais espaço em disco)      │
│                                                      │
│ Retenção de Logs:                                  │
│ [○ 1 semana] [○ 1 mês] [● 3 meses] [○ 1 ano]     │
│                                                      │
│ Compactar Logs Antigos?                            │
│ [☑ Sim]  (economiza espaço)                        │
│                                                      │
│ ─── MONITORAMENTO ────────────────────────────────│
│                                                      │
│ Alertar se CPU > [80]%                             │
│ [☑ Sim]                                            │
│                                                      │
│ Alertar se Disco < [5]% livre                      │
│ [☑ Sim]                                            │
│                                                      │
│ Alertar se Downtime > [1] minuto                   │
│ [☑ Sim]  notificar via [Email] [SMS]              │
│                                                      │
│ ─── SINCRONIZAÇÃO ────────────────────────────────│
│                                                      │
│ Status Sincronização: ✓ OK (Última: 08:23)        │
│                                                      │
│ Sincronizar Agora: [Sincronizar]                   │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 8. FUNCIONALIDADE 8.1: INTEGRAÇÕES EXTERNAS

### 8.1.1 Serviços Conectados

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES > INTEGRAÇÕES                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ INTEGRAÇÕES DISPONÍVEIS:                           │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📧 EMAIL SERVICE (SMTP)                      │   │
│ │                                              │   │
│ │ Status: ✓ Conectado (Gmail)                 │   │
│ │ Provider: Gmail                              │   │
│ │ Email: seu-email@gmail.com                   │   │
│ │ Last Sync: 23/08/2026 14:35                 │   │
│ │                                              │   │
│ │ [Configurar] [Testar] [Desconectar]          │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 💬 SMS GATEWAY (SMS)                         │   │
│ │                                              │   │
│ │ Status: ✗ Não Conectado                     │   │
│ │ Provider: [Twilio ▼]                        │   │
│ │                                              │   │
│ │ [Conectar] [Mais Info]                       │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ☁️  STORAGE (AWS S3)                         │   │
│ │                                              │   │
│ │ Status: ✓ Conectado                         │   │
│ │ Bucket: pdv-restaurante-xyz                 │   │
│ │ Região: us-east-1                           │   │
│ │ Last Sync: 23/08/2026 22:00                 │   │
│ │                                              │   │
│ │ [Configurar] [Testar] [Desconectar]          │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📱 PUSH NOTIFICATIONS (Firebase)             │   │
│ │                                              │   │
│ │ Status: ✗ Não Conectado                     │   │
│ │ Project: [Selecione projeto...]              │   │
│ │                                              │   │
│ │ [Conectar] [Mais Info]                       │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 💳 PROCESSADOR PAGAMENTO (Stripe)            │   │
│ │                                              │   │
│ │ Status: ✓ Conectado                         │   │
│ │ Merchant: Restaurante XYZ LTDA              │   │
│ │ Taxa: 2.99% + R$ 0,30 por transação         │   │
│ │ Last Sync: 23/08/2026 14:35                 │   │
│ │                                              │   │
│ │ [Configurar] [Testar] [Dashboard]            │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ INTEGRAÇÕES FUTURAS:                               │
│ □ NFC (cartões)                                    │
│ □ Delivery (iFood, Uber Eats)                     │
│ □ Nota Fiscal (RFB)                               │
│ □ ERP (SAP, Totvs)                                │
│ □ CRM (Salesforce)                                │
│                                                      │
│ [Cancelar]  [Salvar Configurações]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 9. BANCO DE DADOS

### 9.1 Tabela CONFIGURACOES

```sql
CREATE TABLE configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) NOT NULL UNIQUE,  -- config_empresa, config_vendas, etc
  
  -- Valor armazenado como JSON
  valor JSON NOT NULL,
  
  -- Tipo de config
  tipo VARCHAR(50),  -- empresa, vendas, estoque, financeiro, notificacoes, interface
  
  -- Descrição
  descricao TEXT,
  
  -- Quem alterou por último
  alterado_por INT,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (alterado_por) REFERENCES usuarios(id),
  
  INDEX idx_tipo(tipo),
  INDEX idx_chave(chave)
);

-- Exemplos de configurações:
INSERT INTO configuracoes (chave, tipo, valor) VALUES
('empresa', 'empresa', '{"nome": "Restaurante XYZ", "cnpj": "12345678000100"}'),
('vendas_desconto_max', 'vendas', '{"operador": 500, "gerente": 2000, "admin": "ilimitado"}'),
('estoque_alerta_critico', 'estoque', '{"percentual": 20, "ativar": true}'),
('financeiro_margem_minima', 'financeiro', '{"valor": 40, "alertar": true}'),
('notificacoes_email', 'notificacoes', '{"smtp": "smtp.gmail.com", "porta": 587}'),
('interface_tema', 'interface', '{"tema": "light", "cor_primaria": "#0066CC"}');
```

### 9.2 Tabela INTEGRAÇÕES

```sql
CREATE TABLE integracoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,  -- Email Service, SMS Gateway, etc
  tipo VARCHAR(50),  -- email, sms, storage, payment, push
  
  provider VARCHAR(100),  -- Gmail, Twilio, AWS, Stripe
  
  -- Credenciais armazenadas encrypted
  config_encrypted VARCHAR(2000),  -- Criptografado
  
  conectado BOOLEAN DEFAULT FALSE,
  
  last_sync TIMESTAMP,
  
  ativo BOOLEAN DEFAULT TRUE,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_provider(provider),
  INDEX idx_conectado(conectado)
);
```

---

## 10. API REST - ENDPOINTS

**Base URL:** `http://localhost:3000/api/configuracoes`

#### **GET /api/configuracoes/{tipo}**
Obter configurações por tipo
```
Response:
{
  "sucesso": true,
  "dados": {
    "empresa": {...},
    "vendas": {...},
    "estoque": {...}
  }
}
```

#### **PUT /api/configuracoes/{tipo}**
Atualizar configurações
```
Body:
{
  "config_key": {
    "field": "value"
  }
}

Response:
{
  "sucesso": true,
  "mensagem": "Configurações atualizadas"
}
```

#### **GET /api/configuracoes/empresa**
Dados da empresa
```
Response:
{
  "sucesso": true,
  "dados": {
    "nome": "Restaurante XYZ",
    "cnpj": "12.345.678/0001-00",
    "logo_url": "/logos/..."
  }
}
```

#### **POST /api/integracoes/{tipo}/conectar**
Conectar integração externa
```
Body:
{
  "provider": "Gmail",
  "credenciais": {...}
}

Response:
{
  "sucesso": true,
  "mensagem": "Integração conectada com sucesso"
}
```

#### **GET /api/configuracoes/backup/listar**
Listar backups
```
Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 123,
      "data": "2026-08-23T22:00:00Z",
      "tamanho": "245MB",
      "status": "sucesso"
    }
  ]
}
```

---

## 11. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/configuracoes/
│
├── pages/
│   ├── ConfiguracoesPage.jsx         # Nav principal
│   ├── EmpresaPage.jsx               # Dados empresa
│   ├── VendasPage.jsx                # Config vendas
│   ├── EstoquePage.jsx               # Config estoque
│   ├── FinanceiroPage.jsx            # Config financeiro
│   ├── NotificacoesPage.jsx          # Config notificações
│   ├── InterfacePage.jsx             # Tema, layout
│   ├── BackupsPage.jsx               # Backup, logs
│   └── IntegracoesPage.jsx           # Integrações
│
├── components/
│   ├── FormularioEmpresa.jsx
│   ├── FormularioVendas.jsx
│   ├── FormularioEstoque.jsx
│   ├── FormularioNotificacoes.jsx
│   ├── SeletorTema.jsx
│   ├── ListaIntegracoes.jsx
│   ├── CardIntegracao.jsx
│   ├── DashboardBackup.jsx
│   └── BotaoSalvar.jsx
│
├── hooks/
│   ├── useConfiguracao.js
│   ├── useIntegracao.js
│   └── useBackup.js
│
├── services/
│   ├── configuracoesService.js
│   ├── integracoesService.js
│   └── backupService.js
│
└── styles/
    ├── configuracoes.css
    ├── formularios.css
    └── integrações.css
```

---

## 12. CASOS DE USO DETALHADOS

### Caso de Uso 1: Configurar Desconto Máximo

**Ator:** Admin
**Tempo:** ~2 minutos

**Fluxo:**
1. Admin vai para: Configurações > [Vendas]
2. Vê: Desconto Máximo Operador: 20%
3. Altera para: 25%
4. Clica [Salvar]
5. Sistema atualiza configuração
6. Toast: "Configuração salva!"
7. Próximas vendas de Operador podem ter até 25% de desconto

**Resultado:** Regra de negócio atualizada em tempo real.

---

### Caso de Uso 2: Conectar Email para Alertas

**Ator:** Admin
**Tempo:** ~5 minutos

**Fluxo:**
1. Admin vai para: Configurações > [Notificações]
2. Seção EMAIL
3. Provider: Gmail
4. Email: admin@empresa.com
5. Senha: [insere senha de app do Gmail]
6. Clica [Testar Conexão]
7. Sistema envia email de teste
8. Admin recebe email (✓ OK)
9. Clica [Salvar]
10. Agora todos os alertas vão por email

**Resultado:** Sistema de notificações ativado.

---

### Caso de Uso 3: Fazer Backup Manual

**Ator:** Admin/Gerente
**Tempo:** ~1 minuto

**Fluxo:**
1. Admin vai para: Configurações > [Backups]
2. Clica [Fazer Backup Agora]
3. Sistema mostra: "Processando..."
4. Após ~30 segundos: "Backup concluído!"
5. Arquivo: backup_20260823_143520.sql (245MB)
6. Admin pode [Download] ou deixar na cloud

**Resultado:** Dados protegidos contra perda.

---

## 13. MOCKUPS

### Tela 1: Configurações Gerais

```
┌────────────────────────────────────────────┐
│ ⚙️  CONFIGURAÇÕES                         │
├────────────────────────────────────────────┤
│                                            │
│ [Empresa] [Vendas] [Estoque] [Financeiro] │
│ [Notificações] [Interface] [Backups]      │
│ [Integrações]                              │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ EMPRESA                                │ │
│ │                                        │ │
│ │ Nome: Restaurante XYZ Ltda            │ │
│ │ CNPJ: 12.345.678/0001-00              │ │
│ │ Logo: [Logo.png] [Alterar]            │ │
│ │                                        │ │
│ │ [Salvar]                              │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

### Tela 2: Integrações

```
┌─────────────────────────────────────────────────┐
│ ⚙️  INTEGRAÇÕES EXTERNAS                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ 📧 EMAIL (Gmail)         ✓ Conectado    │   │
│ │ Último sync: 14:35                       │   │
│ │ [Configurar] [Testar] [Desconectar]      │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ 💬 SMS (Twilio)         ✗ Não conectado │   │
│ │ [Conectar] [Mais Info]                   │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ ☁️  STORAGE (AWS S3)    ✓ Conectado     │   │
│ │ Bucket: pdv-restaurante-xyz             │   │
│ │ [Configurar] [Testar] [Desconectar]      │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 14. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup + Empresa (1-2 semanas)
- [ ] BD: tabela configuracoes e integracoes
- [ ] Frontend: página empresa
- [ ] API: GET/PUT configuracoes/empresa
- [ ] Upload logo
- [ ] Testes

### Sprint 2: Config Vendas (1 semana)
- [ ] Frontend: página vendas
- [ ] Desconto máximo por role
- [ ] Impressora settings
- [ ] API: GET/PUT configuracoes/vendas
- [ ] Testes

### Sprint 3: Config Estoque (1 semana)
- [ ] Frontend: página estoque
- [ ] Alertas e mínimos
- [ ] Lote e validade
- [ ] API: GET/PUT configuracoes/estoque
- [ ] Testes

### Sprint 4: Config Financeiro (1 semana)
- [ ] Frontend: página financeiro
- [ ] Impostos, categorias despesa
- [ ] Caixas
- [ ] API: GET/PUT configuracoes/financeiro
- [ ] Testes

### Sprint 5: Notificações (1-2 semanas)
- [ ] Frontend: página notificações
- [ ] Email service integration
- [ ] SMS setup (optional)
- [ ] Webhooks
- [ ] API: GET/PUT configuracoes/notificacoes
- [ ] Testes

### Sprint 6: Interface (1 semana)
- [ ] Frontend: página interface
- [ ] Tema (light/dark)
- [ ] Menu customizado por role
- [ ] Branding (logo, titulo)
- [ ] Testes

### Sprint 7: Backups & Logs (1-2 semanas)
- [ ] Backup automático (cloud)
- [ ] Backup manual
- [ ] Restore funcionando
- [ ] Dashboard logs
- [ ] API: backup endpoints
- [ ] Testes

### Sprint 8: Integrações (1-2 semanas)
- [ ] Frontend: página integrações
- [ ] Email service
- [ ] SMS gateway
- [ ] Storage (AWS S3)
- [ ] Payment processor
- [ ] Testes

### Sprint 9: Polish + Deploy (1 semana)
- [ ] Testes E2E
- [ ] Performance
- [ ] Staging
- [ ] Produção
- [ ] Treinamento

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento

**Próximos Módulos:**
- Módulo 5: Integração com APIs Externas
- Fase 2: Features Avançadas
