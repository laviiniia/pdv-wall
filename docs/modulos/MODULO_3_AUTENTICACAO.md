# MÓDULO 3: AUTENTICAÇÃO E CONTROLE DE ACESSO

## 📋 Sumário Executivo

**Objetivo:** Implementar sistema robusto de autenticação, autorização e controle de acesso baseado em perfis e permissões. Garantir segurança dos dados e conformidade com boas práticas de segurança.

**Funcionalidades Principais:**
- ✅ Login/Logout seguro com JWT
- ✅ Recuperação de senha por email
- ✅ Autenticação de dois fatores (2FA) - opcional
- ✅ Perfis de usuário (Admin, Gerente, Operador)
- ✅ Controle de acesso baseado em roles (RBAC)
- ✅ Permissões granulares por módulo/funcionalidade
- ✅ Gerenciamento de usuários (CRUD)
- ✅ Auditoria de acesso e ações
- ✅ Sessão com timeout automático
- ✅ Criptografia de senhas (bcrypt)

**Perfis de Acesso:**
- **Admin:** Acesso total ao sistema, gerencia usuários e configurações
- **Gerente:** Acesso a vendas, estoque, financeiro, relatórios, cria despesas
- **Operador:** Acesso limitado a vendas (PDV), comanda, abertura/fechamento caixa

**Segurança:** JWT, bcrypt, HTTPS obrigatório, rate limiting, auditoria completa

---

## 1. FUNCIONALIDADE 1.1: AUTENTICAÇÃO COM JWT

### 1.1.1 Fluxo de Login

```
┌──────────────────────────────────┐
│ Cliente Abre Aplicação          │
└────────────┬─────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Sistema Verifica Token Armazenado:   │
│ • localStorage.getItem('token')      │
│ • sessionStorage.getItem('token')    │
└────────────┬──────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
  ✅ Token      ❌ Sem Token
  Válido         ou Expirado
      │             │
      ▼             ▼
  Vai para    Redireciona
  Dashboard   para Login
      │             │
      └─────┬───────┘
            │
┌───────────┴──────────────────────┐
│ TELA DE LOGIN:                   │
│                                  │
│ 🔐 RESTAURANTE XYZ              │
│                                  │
│ Email ou Usuário:                │
│ [gerente@empresa.com_______]     │
│                                  │
│ Senha:                           │
│ [•••••••••••_______]             │
│                                  │
│ ☐ Manter-me conectado           │
│                                  │
│ [Entrar] [Esqueci Senha]         │
│                                  │
│ © 2026 PDV Online                │
│                                  │
└───────────┬──────────────────────┘
            │
┌───────────┴────────────────────────┐
│ Usuário Insere Credenciais:       │
│ Email: gerente@empresa.com         │
│ Senha: senha_segura_123           │
│                                   │
│ Clica [Entrar]                    │
│                                   │
│ Validações Cliente-Side:          │
│ ✓ Email preenchido?               │
│ ✓ Email formato válido?           │
│ ✓ Senha preenchida?               │
│ ✓ Senha mínimo 8 chars?           │
└───────────┬────────────────────────┘
            │
┌───────────┴──────────────────────────────┐
│ Envia para Backend:                      │
│ POST /api/auth/login                     │
│ {                                        │
│   "email": "gerente@empresa.com",       │
│   "senha": "senha_segura_123",          │
│   "manter_conectado": true              │
│ }                                        │
└───────────┬──────────────────────────────┘
            │
┌───────────┴──────────────────────────────────┐
│ Backend Valida:                              │
│ ✓ Email existe no BD?                       │
│ ✓ Senha está correta? (bcrypt verify)       │
│ ✓ Usuário está ativo?                       │
│ ✓ Conta não está bloqueada?                 │
│ ✓ Rate limiting (máx 5 tentativas/5min)    │
└───────────┬──────────────────────────────────┘
            │
      ┌─────┴──────┐
      │            │
   ✅ OK       ❌ Erro
      │            │
      ▼            ▼
 Gera JWT    Retorna erro
      │       • Email não encontrado
      │       • Senha incorreta
      │       • Conta bloqueada
      │       • Muitas tentativas
      │
┌─────┴──────────────────────────────┐
│ Backend Gera Tokens:               │
│                                    │
│ Access Token (JWT):                │
│ • Header: {alg: HS256}             │
│ • Payload: {                       │
│     sub: user_id,                  │
│     email: email,                  │
│     role: "gerente",               │
│     iat: now,                      │
│     exp: now + 8h                  │
│   }                                │
│ • Signature: HMAC-SHA256           │
│ • Duração: 8 horas                 │
│                                    │
│ Refresh Token:                     │
│ • Duração: 7 dias                  │
│ • Armazenado no BD com hash        │
│ • Usado para renovar access token │
└─────┬──────────────────────────────┘
      │
┌─────┴──────────────────────────────────┐
│ Retorna para Cliente:                  │
│ {                                      │
│   "sucesso": true,                     │
│   "dados": {                           │
│     "access_token": "eyJhbGc...",     │
│     "refresh_token": "refresh_...",   │
│     "token_type": "Bearer",            │
│     "expires_in": 28800,  // 8h em s   │
│     "usuario": {                       │
│       "id": 5,                         │
│       "nome": "João Silva",            │
│       "email": "gerente@empresa.com", │
│       "role": "gerente",               │
│       "avatar": "/avatares/5.jpg"     │
│     }                                  │
│   }                                    │
│ }                                      │
└─────┬──────────────────────────────────┘
      │
┌─────┴──────────────────────────────────┐
│ Cliente Armazena Tokens:               │
│ • Access Token: localStorage           │
│ • Refresh Token: localStorage +        │
│   httpOnly cookie                      │
│ • Dados Usuário: Redux/Context         │
│                                        │
│ Define Header Padrão:                  │
│ Authorization: Bearer eyJhbGc...       │
└─────┬──────────────────────────────────┘
      │
┌─────┴──────────────────────────────────┐
│ Redireciona para Dashboard:            │
│ "Bem-vindo, João! 👋"                 │
│                                        │
│ Toast: "Login realizado com sucesso"  │
│                                        │
│ Carrega dados do usuário:              │
│ • Permissões                           │
│ • Menu customizado                     │
│ • Preferências                         │
│ • Último acesso                        │
│                                        │
│ Registra em auditoria:                 │
│ • User: gerente@empresa.com            │
│ • Ação: LOGIN                          │
│ • IP: 192.168.1.100                   │
│ • User Agent: Chrome/Windows           │
│ • Horário: 2026-08-23T14:35:20Z       │
│                                        │
└────────────────────────────────────────┘
```

### 1.1.2 Estrutura do JWT

```
JWT = Header.Payload.Signature

HEADER:
{
  "alg": "HS256",      // Algoritmo de assinatura
  "typ": "JWT"         // Tipo de token
}

PAYLOAD:
{
  "sub": "5",          // Subject (user ID)
  "email": "gerente@empresa.com",
  "nome": "João Silva",
  "role": "gerente",   // Perfil
  "permissoes": [      // Permissões diretas
    "vendas.criar",
    "estoque.visualizar",
    "financeiro.visualizar"
  ],
  "iat": 1692816920,   // Issued At
  "exp": 1692845720,   // Expiration (8h depois)
  "iss": "pdv.empresa.com",  // Issuer
  "aud": "pdv-online"  // Audience
}

SIGNATURE:
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  "seu_super_secret_key_super_secreto"
)

RESULTADO FINAL:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiI1IiwiZW1haWwiOiJnZXJlbnRlQGVtcHJlc2EuY29tIiwicm9sZSI6ImdlcmVudGUifQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 1.1.3 Refresh Token Flow

```
Quando Access Token está perto de expirar (< 5 min):

┌───────────────────────────────────────┐
│ Cliente Detecta Token Expirando:      │
│ • Verifica exp do JWT                 │
│ • Se expira em < 5 min                │
│ • Dispara refresh automático          │
└────────────┬────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Envia Refresh Token:                     │
│ POST /api/auth/refresh                   │
│ {                                        │
│   "refresh_token": "refresh_..."        │
│ }                                        │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Backend Valida Refresh Token:            │
│ ✓ Token existe no BD?                   │
│ ✓ Não foi revogado?                     │
│ ✓ Ainda é válido?                       │
│ ✓ Usuário ainda ativo?                  │
└────────────┬──────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ✅ OK       ❌ Erro
      │             │
      ▼             ▼
  Gera novo   Redireciona
  Access Token para Login
      │
┌─────┴──────────────────────────────┐
│ Retorna Novo Access Token:         │
│ {                                  │
│   "access_token": "eyJhbGc...",   │
│   "expires_in": 28800,             │
│   "token_type": "Bearer"           │
│ }                                  │
└─────┬──────────────────────────────┘
      │
┌─────┴──────────────────────────────┐
│ Cliente Atualiza Token:            │
│ localStorage.setItem('token',...)  │
│                                    │
│ Continua operação:                 │
│ • Sem interrupção de UX            │
│ • Sessão transparente              │
│ • User não percebe                 │
│                                    │
└────────────────────────────────────┘
```

---

## 2. FUNCIONALIDADE 2.1: RECUPERAÇÃO DE SENHA

### 2.1.1 Fluxo Completo

```
┌───────────────────────────────────┐
│ Usuário Clica [Esqueci Senha]    │
└────────────┬──────────────────────┘
             │
┌────────────┴────────────────────────┐
│ Abre Tela de Recuperação:           │
│                                     │
│ 🔐 REDEFINIR SENHA                  │
│                                     │
│ Insira seu email:                   │
│ [gerente@empresa.com_______]       │
│                                     │
│ [Cancelar] [Enviar Link]            │
│                                     │
└────────────┬────────────────────────┘
             │
┌────────────┴─────────────────────────────┐
│ Usuário Insere Email:                   │
│ gerente@empresa.com                     │
│ Clica [Enviar Link]                     │
└────────────┬─────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Backend Valida:                          │
│ ✓ Email existe?                         │
│ ✓ Usuário está ativo?                   │
│ ✓ Rate limiting (1 email/5min)         │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Backend Gera Reset Token:                │
│ • Token único de 32 caracteres           │
│ • Armazenado no BD com hash              │
│ • Expira em 1 hora                       │
│ • One-time use                           │
│                                          │
│ URL de Reset:                            │
│ https://pdv.empresa.com/reset-senha     │
│ ?token=a1b2c3d4e5f6g7h8i9j0             │
│                                          │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Envia Email:                             │
│                                          │
│ De: nao-responda@pdv.empresa.com        │
│ Para: gerente@empresa.com                │
│ Assunto: Redefinir sua senha - PDV      │
│                                          │
│ ────────────────────────────────────── │
│ Olá João,                                │
│                                          │
│ Recebemos uma solicitação para           │
│ redefinir sua senha no PDV Online.      │
│                                          │
│ [🔗 Redefinir Senha]  ← Link clicável   │
│ Link válido por 1 hora                   │
│                                          │
│ Se não foi você, ignore este email.     │
│                                          │
│ Suporte: suporte@empresa.com             │
│ ────────────────────────────────────── │
│                                          │
│ Registra em auditoria:                   │
│ • Ação: PASSWORD_RESET_REQUESTED        │
│ • Email: gerente@empresa.com             │
│ • IP: 192.168.1.100                     │
│                                          │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Mostra Sucesso ao Cliente:               │
│                                          │
│ ✅ Email Enviado!                       │
│                                          │
│ Verifique seu email.                     │
│ Um link de redefinição foi enviado      │
│ para gerente@empresa.com                 │
│                                          │
│ O link é válido por 1 hora.             │
│                                          │
│ [Voltar ao Login]                       │
│                                          │
└────────────┬──────────────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Usuario Recebe   │
    │ Email e Clica    │
    │ no Link          │
    └────────┬─────────┘
             │
┌────────────┴─────────────────────────────────┐
│ Backend Valida Token de Reset:               │
│ ✓ Token existe e é válido?                  │
│ ✓ Não foi usado antes?                      │
│ ✓ Não expirou (< 1 hora)?                   │
│ ✓ Usuário ainda existe?                     │
└────────────┬─────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ✅ OK       ❌ Expirado
      │             │
      ▼             ▼
  Mostra Form  Erro:
  Nova Senha   "Link expirado
               ou inválido"
      │             │
      │        [Solicitar novo]
      │             │
      └─────┬───────┘
            │
┌───────────┴──────────────────────────────┐
│ TELA DE NOVA SENHA:                      │
│                                          │
│ 🔐 REDEFINIR SENHA                       │
│                                          │
│ Nova Senha:                              │
│ [•••••••••••••••_______]                 │
│ Requ: Min 8 chars, 1 maiúscula,         │
│       1 número, 1 símbolo               │
│                                          │
│ Confirmar Senha:                         │
│ [•••••••••••••••_______]                 │
│                                          │
│ ☑ Mostrar Senhas                         │
│                                          │
│ Requisitos da Senha:                     │
│ ✅ Mínimo 8 caracteres                   │
│ ✅ Contém letra maiúscula                │
│ ❌ Contém número (insira)                │
│ ❌ Contém símbolo (insira)               │
│                                          │
│ [Cancelar] [Redefinir]                   │
│                                          │
└───────────┬──────────────────────────────┘
            │
┌───────────┴────────────────────────────────┐
│ Usuário Insere Nova Senha:                 │
│ Senha: Minha$enh@123                      │
│ Confirmação: Minha$enh@123                │
│                                           │
│ Validações:                               │
│ ✓ Senha >= 8 chars                       │
│ ✓ Contém maiúscula                       │
│ ✓ Contém número                          │
│ ✓ Contém símbolo                         │
│ ✓ Senhas conferem                        │
│ ✓ Não é igual à senha anterior (check BD)│
│                                           │
│ Clica [Redefinir]                        │
│                                           │
└───────────┬────────────────────────────────┘
            │
┌───────────┴────────────────────────────────┐
│ Backend:                                   │
│ 1. Valida token novamente                  │
│ 2. Valida força da senha                   │
│ 3. Hash a nova senha (bcrypt)             │
│ 4. Atualiza no BD                          │
│ 5. Marca token como usado                  │
│ 6. Invalida todas as sessões antigas      │
│ 7. Registra em auditoria                   │
│                                            │
│ Ação: PASSWORD_CHANGED                     │
│ IP: 192.168.1.100                         │
│ Timestamp: 2026-08-23T14:35:20Z           │
│                                            │
└───────────┬────────────────────────────────┘
            │
┌───────────┴────────────────────────────────┐
│ Sucesso! Mostra Tela:                      │
│                                            │
│ ✅ SENHA REDEFINIDA                       │
│                                            │
│ Sua senha foi alterada com sucesso.       │
│ Você será redirecionado para login         │
│ em 3 segundos...                          │
│                                            │
│ [Ir para Login Agora]                     │
│                                            │
│ Envia Email de Confirmação:                │
│ "Sua senha foi redefinida com sucesso     │
│  em 23/08/2026 às 14:35."                │
│                                            │
└────────────────────────────────────────────┘
```

---

## 3. FUNCIONALIDADE 3.1: PERFIS E ROLES

### 3.1.1 Estrutura de Perfis

```
┌─────────────────────────────────────────────────────────┐
│ PERFIS DE USUÁRIO E PERMISSÕES                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ADMIN (Administrador)                              │ │
│ │                                                    │ │
│ │ Acesso: TOTAL ao sistema                           │ │
│ │                                                    │ │
│ │ Funcionalidades:                                   │ │
│ │ • Gerencia usuários (CRUD completo)                │ │
│ │ • Modifica roles e permissões                      │ │
│ │ • Acesso a toda auditoria                          │ │
│ │ • Configurações do sistema                         │ │
│ │ • Backup/Restore                                   │ │
│ │ • Ver todos os módulos e dados                     │ │
│ │ • Sem limitações de caixa                          │ │
│ │ • Descontos sem limite                             │ │
│ │                                                    │ │
│ │ Quantidade: Até 2 usuários por restaurante         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ GERENTE                                             │ │
│ │                                                    │ │
│ │ Acesso: OPERACIONAL + FINANCEIRO                   │ │
│ │                                                    │ │
│ │ Funcionalidades:                                   │ │
│ │ ✅ Criar/editar vendas PDV                        │ │
│ │ ✅ Visualizar estoque (todas as operações)        │ │
│ │ ✅ Criar despesas                                 │ │
│ │ ✅ Pagar contas                                   │ │
│ │ ✅ Ver fluxo de caixa                             │ │
│ │ ✅ Gerar relatórios                               │ │
│ │ ✅ Agendar relatórios                             │ │
│ │ ✅ Criar/editar pedidos online                    │ │
│ │ ✅ Gerenciar painel cozinha                       │ │
│ │ ✅ Descontos até R$ 500/dia (customizável)        │ │
│ │ ✅ Ver auditoria de vendas                        │ │
│ │ ❌ Gerenciar usuários                             │ │
│ │ ❌ Acessar configurações do sistema               │ │
│ │                                                    │ │
│ │ Quantidade: Até 3 usuários por restaurante         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ OPERADOR                                            │ │
│ │                                                    │ │
│ │ Acesso: VENDAS + BÁSICO                            │ │
│ │                                                    │ │
│ │ Funcionalidades:                                   │ │
│ │ ✅ Criar vendas PDV (seu turno)                   │ │
│ │ ✅ Visualizar produtos                            │ │
│ │ ✅ Visualizar estoque (read-only)                │ │
│ │ ✅ Abrir/fechar caixa                             │ │
│ │ ✅ Criar pedidos online (sua mesa)                │ │
│ │ ✅ Descontos até 20% máx (customizável)           │ │
│ │ ✅ Ver seu próprio histórico                      │ │
│ │ ❌ Criar despesas                                 │ │
│ │ ❌ Ver financeiro                                 │ │
│ │ ❌ Ver relatórios                                 │ │
│ │ ❌ Gerenciar caixa de outros                      │ │
│ │ ❌ Ver estoque detalhado                          │ │
│ │                                                    │ │
│ │ Quantidade: Ilimitado                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.1.2 Matriz de Permissões Detalhada

```
╔════════════════════════════════════════════════════════╗
║           MATRIZ DE PERMISSÕES POR ROLE              ║
╠════════════════════════════════════════════════════════╣
║                    │ ADMIN │ GERENTE │ OPERADOR       ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ MÓDULO 2.1: GESTÃO PRODUTOS                          ║
║ - Ver produtos     │ ✅    │ ✅      │ ✅             ║
║ - Criar produto    │ ✅    │ ❌      │ ❌             ║
║ - Editar produto   │ ✅    │ ❌      │ ❌             ║
║ - Deletar produto  │ ✅    │ ❌      │ ❌             ║
║ - Editar preço     │ ✅    │ ✅*     │ ❌             ║
║                    │       │ *com    │                ║
║                    │       │ restr.  │                ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ MÓDULO 2.2: VENDAS PDV                               ║
║ - Criar venda      │ ✅    │ ✅      │ ✅*            ║
║ - Ver venda        │ ✅    │ ✅      │ ✅ (suas)      ║
║ - Cancelar venda   │ ✅    │ ✅      │ ✅ (suas)      ║
║ - Desconto até 20% │ ✅    │ ✅      │ ✅             ║
║ - Desconto até 50% │ ✅    │ ✅      │ ❌             ║
║ - Desconto livre   │ ✅    │ ✅      │ ❌             ║
║ - Imprimir cupom   │ ✅    │ ✅      │ ✅             ║
║ - Reemissão cupom  │ ✅    │ ✅      │ ✅             ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ MÓDULO 2.3: PEDIDOS ONLINE                           ║
║ - Ver menu digital │ ✅    │ ✅      │ ✅             ║
║ - Criar pedido     │ ✅    │ ✅      │ ✅*            ║
║ - Ver fila         │ ✅    │ ✅      │ ✅             ║
║ - Painel cozinha   │ ✅    │ ✅      │ ✅*            ║
║ - Mudar status     │ ✅    │ ✅      │ ✅             ║
║ - Cancelar pedido  │ ✅    │ ✅      │ ✅*            ║
║ - Ver rastreamento│ ✅    │ ✅      │ ✅             ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ MÓDULO 2.4: ESTOQUE                                  ║
║ - Ver produtos     │ ✅    │ ✅      │ ✅             ║
║ - Criar entrada    │ ✅    │ ✅      │ ❌             ║
║ - Saída manual     │ ✅    │ ✅      │ ❌             ║
║ - Inventário       │ ✅    │ ✅      │ ❌             ║
║ - Alertas          │ ✅    │ ✅      │ ❌             ║
║ - Histórico        │ ✅    │ ✅      │ ❌             ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ MÓDULO 2.5: FINANCEIRO                               ║
║ - Dashboard finan. │ ✅    │ ✅      │ ❌             ║
║ - Ver despesas     │ ✅    │ ✅      │ ❌             ║
║ - Criar despesa    │ ✅    │ ✅      │ ❌             ║
║ - Contas a pagar   │ ✅    │ ✅      │ ❌             ║
║ - Pagar conta      │ ✅    │ ✅      │ ❌             ║
║ - Fluxo de caixa   │ ✅    │ ✅      │ ❌             ║
║ - Abrir caixa      │ ✅    │ ✅      │ ✅             ║
║ - Fechar caixa     │ ✅    │ ✅      │ ✅             ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ MÓDULO 2.6: RELATÓRIOS                               ║
║ - Dashboard exec.  │ ✅    │ ✅      │ ❌             ║
║ - Relatório P&L    │ ✅    │ ✅      │ ❌             ║
║ - Análise vendas   │ ✅    │ ✅      │ ❌             ║
║ - Exportar relat.  │ ✅    │ ✅      │ ❌             ║
║ - Agendar relat.   │ ✅    │ ✅      │ ❌             ║
╠════════════════════╬═══════╬═════════╬════════════════╣
║ AUTENTICAÇÃO & USERS                                  ║
║ - Ver usuários     │ ✅    │ ❌      │ ❌             ║
║ - Criar usuário    │ ✅    │ ❌      │ ❌             ║
║ - Editar usuário   │ ✅    │ ❌      │ ❌             ║
║ - Deletar usuário  │ ✅    │ ❌      │ ❌             ║
║ - Mudar role       │ ✅    │ ❌      │ ❌             ║
║ - Ver auditoria    │ ✅    │ ✅*     │ ❌             ║
║ - Redefinir senha  │ ✅    │ ✅      │ ❌             ║
║ - Desativar user   │ ✅    │ ❌      │ ❌             ║
║                    │       │ *suas   │                ║
║                    │       │ vendas  │                ║
╚════════════════════╩═══════╩═════════╩════════════════╝
```

---

## 4. FUNCIONALIDADE 4.1: GERENCIAMENTO DE USUÁRIOS

### 4.1.1 Fluxo de Criação de Usuário

```
┌──────────────────────────────────┐
│ Admin Clica [Novo Usuário]      │
└────────────┬─────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Abre Formulário de Criação:           │
│                                       │
│ 📝 CRIAR NOVO USUÁRIO                 │
│                                       │
│ Informações Pessoais:                 │
│                                       │
│ Nome Completo:                        │
│ [João Silva_____________________]     │
│                                       │
│ Email:                                │
│ [joao.silva@empresa.com______]       │
│                                       │
│ Telefone (opcional):                  │
│ [(11) 98765-4321_______________]     │
│                                       │
│ ─────────────────────────────────    │
│ Acesso:                               │
│                                       │
│ Perfil (Role):                        │
│ [Admin      ▼]                        │
│ [Gerente]                             │
│ [Operador]                            │
│                                       │
│ Caixa Atribuído (se Operador):        │
│ [Caixa #01 ▼]                        │
│                                       │
│ Ativo:                                │
│ [☑ Sim]                               │
│                                       │
│ Permissões Customizadas:              │
│ ☐ Descontos > R$ 500                 │
│ ☐ Editar preço produtos              │
│ ☐ Acessar financeiro                 │
│ ☐ Expirar relatórios                │
│                                       │
│ ─────────────────────────────────    │
│ Senha Inicial:                        │
│                                       │
│ ○ Gerar automaticamente               │
│ ● Definir agora: [senha_______]      │
│                                       │
│ ○ Enviar link de definição            │
│   (usuário define sua própria)        │
│                                       │
│ ─────────────────────────────────    │
│ Observações:                          │
│ [Gerente responsável pela loja]      │
│                                       │
│ [Cancelar] [Salvar Usuário]           │
│                                       │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────┐
│ Admin Preenche e Clica Salvar:       │
│                                      │
│ Nome: João Silva                     │
│ Email: joao.silva@empresa.com        │
│ Perfil: Gerente                      │
│ Ativo: Sim                           │
│ Senha: Gerar automaticamente          │
│                                      │
│ Validações:                          │
│ ✓ Nome preenchido                   │
│ ✓ Email formato válido              │
│ ✓ Email único (não existe)          │
│ ✓ Perfil selecionado                │
│ ✓ Se Operador, caixa selecionado   │
│                                      │
└────────────┬──────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Backend Cria Usuário:                     │
│                                           │
│ 1. Verifica email duplicado               │
│ 2. Gera senha temporária (12 chars)      │
│ 3. Hash a senha com bcrypt (10 rounds)   │
│ 4. Insere no BD:                         │
│    - id: 15                              │
│    - nome: João Silva                    │
│    - email: joao.silva@empresa.com       │
│    - password_hash: $2b$10$...          │
│    - role_id: 2 (Gerente)                │
│    - ativo: true                         │
│    - data_criacao: 2026-08-23T14:35:20  │
│    - criado_por: user_id_1 (Admin)      │
│                                           │
│ 5. Registra em auditoria:                │
│    - Ação: USER_CREATED                  │
│    - Email: joao.silva@empresa.com      │
│    - Role: Gerente                       │
│    - Por: Admin                          │
│                                           │
└────────────┬──────────────────────────────┘
             │
┌────────────┴──────────────────────────────┐
│ Opção 1: Senha Gerada Automaticamente    │
│                                           │
│ ✅ Usuário Criado com Sucesso!           │
│                                           │
│ Detalhes:                                │
│ • Nome: João Silva                       │
│ • Email: joao.silva@empresa.com          │
│ • Perfil: Gerente                        │
│ • Status: Ativo                          │
│ • Senha Temporária: X9@kL2mQ5            │
│                                           │
│ O que fazer agora:                       │
│ [Enviar Credenciais por Email]           │
│ [Copiar Dados] [Imprimir] [Ok]           │
│                                           │
│ Email enviado com:                       │
│ • Email de login                         │
│ • Senha temporária                       │
│ • Link para trocar senha no 1º login     │
│ • Instruções de acesso                   │
│                                           │
│ ────────────────────────────────────    │
│ Importante: Usuário DEVE trocar a        │
│ senha na primeira vez que entrar!        │
│                                           │
└────────────┬──────────────────────────────┘
             │
        [Voltar ao Admin]
             │
┌────────────┴──────────────────────────────┐
│ Usuário Recebe Email:                    │
│                                           │
│ De: admin@pdv.empresa.com                │
│ Assunto: Sua conta foi criada - PDV     │
│                                           │
│ ────────────────────────────────────    │
│ Olá João,                                │
│                                           │
│ Bem-vindo ao PDV Online!                 │
│                                           │
│ Suas credenciais iniciais:               │
│ Email: joao.silva@empresa.com            │
│ Senha Temporária: X9@kL2mQ5              │
│                                           │
│ Você deve trocar a senha no primeiro     │
│ acesso.                                  │
│                                           │
│ [Acessar PDV Online]                     │
│                                           │
│ Suporte: suporte@empresa.com             │
│ ────────────────────────────────────    │
│                                           │
│ Ao primeiro login:                       │
│ 1. Usa email + senha temporária          │
│ 2. Sistema força trocar senha            │
│ 3. Insere nova senha pessoal             │
│ 4. Acesso liberado para usar sistema     │
│                                           │
└────────────────────────────────────────────┘
```

### 4.1.2 Gestão de Usuários - Tabela

```
┌──────────────────────────────────────────────────────────────┐
│ GERENCIAMENTO DE USUÁRIOS                                  │
├──────────────────────────────────────────────────────────────┤
│ [+ Novo Usuário] [Filtro: Todos ▼] [Status: Ativos ▼]     │
│                                                              │
│ Nome      │ Email            │ Role     │ Caixa │ Ativo    │
├──────────────────────────────────────────────────────────────┤
│ João Silva│ joao@emp.com     │ Gerente  │ -     │ ✅ Sim   │
│           │                  │          │       │ [Ed][Dt] │
│           │                  │          │       │          │
│ Maria XYZ │ maria@emp.com    │ Operador │ #01   │ ✅ Sim   │
│           │                  │          │       │ [Ed][Dt] │
│           │                  │          │       │          │
│ Pedro ABC │ pedro@emp.com    │ Operador │ #02   │ ✅ Sim   │
│           │                  │          │       │ [Ed][Dt] │
│           │                  │          │       │          │
│ Admin     │ admin@emp.com    │ Admin    │ -     │ ✅ Sim   │
│           │                  │          │       │ [Ed][Dt] │
│           │                  │          │       │          │
│ Desativ.  │ desativado@e.com │ Gerente  │ -     │ ❌ Não   │
│           │                  │          │       │ [Ed][Dt] │
│                                                              │
│ Legenda: [Ed]=Editar [Dt]=Deletar [Reat]=Reativar         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. FUNCIONALIDADE 5.1: AUDITORIA DE ACESSO

### 5.1.1 Registro de Auditoria

```
CADA AÇÃO NO SISTEMA GERA LOG:

Quando usuário faz algo, sistema registra:

┌────────────────────────────────────┐
│ Exemplo: Criar Venda              │
├────────────────────────────────────┤
│ Usuário: João Silva (ID: 5)        │
│ Email: joao@empresa.com            │
│ Role: Gerente                      │
│                                    │
│ Ação: VENDA_CRIADA                │
│ Módulo: VENDAS_PDV                 │
│ Nível: INFO                        │
│                                    │
│ Descrição:                         │
│ "Venda #VEND-001234 criada"       │
│ "Total: R$ 156.00"                │
│ "Itens: 3"                        │
│ "Desconto: R$ 20.00"              │
│                                    │
│ Dados Modificados:                 │
│ {                                  │
│   "venda_id": 12345,               │
│   "total": 156.00,                 │
│   "desconto": 20.00                │
│ }                                  │
│                                    │
│ IP: 192.168.1.50                  │
│ User Agent: Chrome/Windows         │
│ Timestamp: 2026-08-23T14:35:20Z   │
│ Duração: 0.234s                    │
│                                    │
└────────────────────────────────────┘

TIPOS DE AUDITORIA:

LOGIN:
├── LOGIN_SUCESSO
├── LOGIN_FALHA (senha errada)
├── LOGOUT
└── TOKEN_REFRESH

USUÁRIOS:
├── USER_CREATED
├── USER_UPDATED (role, ativo, etc)
├── USER_DELETED
└── PASSWORD_CHANGED

VENDAS:
├── VENDA_CRIADA
├── VENDA_CANCELADA
├── DESCONTO_APLICADO
└── CUPOM_REIMPRESSO

ESTOQUE:
├── ENTRADA_CRIADA
├── SAIDA_MANUAL
├── AJUSTE_QUANTIDADE
└── INVENTARIO_REALIZADO

FINANCEIRO:
├── DESPESA_CRIADA
├── DESPESA_EDITADA
├── CONTA_PAGA
└── CAIXA_FECHADO

PERMISSÕES:
├── ACESSO_NEGADO (tentou acessar sem permissão)
├── PERMISSAO_ALTERADA
└── ROLE_ALTERADA
```

### 5.1.2 Dashboard de Auditoria

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 AUDITORIA DE ACESSO E AÇÕES                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Filtros: [Período: Últimos 7 dias ▼] [Tipo: Todos ▼]  │
│          [Usuário: Todos ▼] [Nível: Todos ▼]           │
│                                                          │
│ Resumo:                                                 │
│ Total Ações: 1.234                                      │
│ Login: 45 | Vendas: 567 | Estoque: 120 | Outros: 502  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Data/Hora   │ Usuário      │ Ação         │ Detalh  │  │
│ ├────────────────────────────────────────────────────┤  │
│ │23/08 14:35  │ João Silva   │ VENDA_CRIADA │ [▶]    │  │
│ │23/08 14:33  │ Maria XYZ    │ LOGIN_SUCES  │ [▶]    │  │
│ │23/08 14:30  │ Pedro ABC    │ VENDA_CANCEL │ [▶]    │  │
│ │23/08 14:28  │ João Silva   │ ESTOQUE_ENT  │ [▶]    │  │
│ │23/08 14:25  │ Admin        │ USER_UPDAT   │ [▶]    │  │
│ │23/08 14:22  │ Maria XYZ    │ ACESSO_NEGA  │ [▶]    │  │
│ │23/08 14:20  │ João Silva   │ DESC_APLICA  │ [▶]    │  │
│ │...          │ ...          │ ...          │ ...    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Ao Clicar [▶]:                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Detalhes da Ação                                 │   │
│ │                                                  │   │
│ │ Usuário: João Silva (joao@empresa.com)          │   │
│ │ Ação: VENDA_CRIADA                              │   │
│ │ Timestamp: 2026-08-23 14:35:20                  │   │
│ │ IP: 192.168.1.50                               │   │
│ │ User Agent: Mozilla/5.0 Chrome/120 Windows     │   │
│ │                                                  │   │
│ │ Dados:                                           │   │
│ │ • Venda ID: 12345                               │   │
│ │ • Total: R$ 156.00                              │   │
│ │ • Desconto: R$ 20.00                            │   │
│ │ • Itens: 3 produtos                             │   │
│ │ • Caixa: #01                                    │   │
│ │                                                  │   │
│ │ [Fechar] [Exportar Log]                         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [Exportar Relatório] [Imprimir]                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 6. BANCO DE DADOS

### 6.1 Tabela USUARIOS

```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  
  -- Autenticação
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  password_changed_at TIMESTAMP,  -- controla obrigação de trocar
  
  -- Role/Perfil
  role_id INT NOT NULL,  -- FK para roles
  
  -- Caixa (se aplicável)
  caixa_id INT,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  bloqueado BOOLEAN DEFAULT FALSE,
  tentativas_login_falhas INT DEFAULT 0,  -- rate limiting
  
  -- Permissões Customizadas
  permissoes_custom JSON,  -- JSON com perms extras/reduzidas
  
  -- 2FA (opcional, para future)
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  
  -- Auditoria
  criado_por INT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP,
  
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (caixa_id) REFERENCES caixas(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  
  INDEX idx_email(email),
  INDEX idx_role(role_id),
  INDEX idx_ativo(ativo)
);
```

### 6.2 Tabela ROLES (Perfis)

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,  -- admin, gerente, operador
  descricao TEXT,
  
  -- Permissões padrão (JSON)
  permissoes JSON NOT NULL,
  
  ativo BOOLEAN DEFAULT TRUE,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert roles padrão:
INSERT INTO roles (nome, descricao, permissoes) VALUES
('admin', 'Administrador - Acesso Total', '["*"]'),
('gerente', 'Gerente - Acesso Operacional e Financeiro', '[...]'),
('operador', 'Operador - Acesso Limitado a Vendas', '[...]');
```

### 6.3 Tabela AUDITORIA

```sql
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  numero_log VARCHAR(30) NOT NULL UNIQUE,  -- AUD-20260823-001234
  
  -- Usuário
  usuario_id INT,
  email_usuario VARCHAR(255),
  
  -- Ação
  acao VARCHAR(50) NOT NULL,  -- LOGIN_SUCESSO, VENDA_CRIADA, etc
  modulo VARCHAR(50),  -- VENDAS_PDV, ESTOQUE, etc
  nivelERRO VARCHAR(20),  -- INFO, WARN, ERROR, CRITICAL
  
  -- Descrição
  descricao TEXT,
  dados_modificados JSON,  -- O que foi alterado
  
  -- Contexto
  ip_address VARCHAR(45),
  user_agent TEXT,
  duracao_ms INT,  -- Tempo da ação em ms
  
  -- Resultado
  sucesso BOOLEAN DEFAULT TRUE,
  mensagem_erro TEXT,
  
  -- Data
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  
  INDEX idx_usuario(usuario_id),
  INDEX idx_acao(acao),
  INDEX idx_data(data_hora),
  INDEX idx_modulo(modulo)
);
```

### 6.4 Tabela RESET_PASSWORD (Tokens de Reset)

```sql
CREATE TABLE reset_password_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL,
  
  token_hash VARCHAR(255) NOT NULL,  -- Hash do token (nunca guardar plain)
  token_plain VARCHAR(255),  -- Apenas para mostrar 1x ao criar
  
  expirado BOOLEAN DEFAULT FALSE,
  usado BOOLEAN DEFAULT FALSE,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP,
  data_uso TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  
  INDEX idx_usuario(usuario_id),
  INDEX idx_expiracao(data_expiracao)
);
```

---

## 7. API REST - ENDPOINTS

**Base URL:** `http://localhost:3000/api/auth`

#### **POST /api/auth/login**
Login do usuário
```
Body:
{
  "email": "gerente@empresa.com",
  "senha": "senha_segura_123",
  "manter_conectado": true
}

Response:
{
  "sucesso": true,
  "dados": {
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh_...",
    "token_type": "Bearer",
    "expires_in": 28800,
    "usuario": {
      "id": 5,
      "nome": "João Silva",
      "email": "gerente@empresa.com",
      "role": "gerente",
      "permissoes": [...]
    }
  }
}
```

#### **POST /api/auth/logout**
Logout do usuário
```
Response:
{
  "sucesso": true,
  "mensagem": "Logout realizado com sucesso"
}
```

#### **POST /api/auth/refresh**
Renovar access token
```
Body:
{
  "refresh_token": "refresh_..."
}

Response:
{
  "sucesso": true,
  "dados": {
    "access_token": "eyJhbGc...",
    "expires_in": 28800
  }
}
```

#### **POST /api/auth/esqueci-senha**
Solicitar reset de senha
```
Body:
{
  "email": "gerente@empresa.com"
}

Response:
{
  "sucesso": true,
  "mensagem": "Email de reset enviado"
}
```

#### **POST /api/auth/redefinir-senha**
Redefinir senha com token
```
Body:
{
  "token": "a1b2c3d4e5f6g7h8i9j0",
  "nova_senha": "Minha$enh@123"
}

Response:
{
  "sucesso": true,
  "mensagem": "Senha redefinida com sucesso"
}
```

#### **GET /api/usuarios**
Listar usuários (Admin)
```
Query:
  - filtro: 'ativos' | 'inativos' | 'todos'
  - role: 'admin' | 'gerente' | 'operador'

Response:
{
  "sucesso": true,
  "dados": [...]
}
```

#### **POST /api/usuarios**
Criar novo usuário
```
Body:
{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "role": "gerente",
  "caixa_id": 1,
  "gerar_senha": true
}

Response:
{
  "sucesso": true,
  "dados": {
    "usuario_id": 15,
    "senha_temporaria": "X9@kL2mQ5"
  }
}
```

#### **GET /api/auditoria**
Ver logs de auditoria
```
Query:
  - periodo: '7dias' | '30dias' | 'customizado'
  - acao: 'LOGIN' | 'VENDA' | etc
  - usuario_id: int

Response:
{
  "sucesso": true,
  "dados": [...]
}
```

---

## 8. MIDDLEWARE DE AUTENTICAÇÃO

### 8.1 Verificação de Token

```javascript
// Middleware Express
const autenticarToken = (req, res, next) => {
  // 1. Extrai token do header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token não fornecido'
    });
  }
  
  // 2. Verifica token
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          sucesso: false,
          erro: 'TOKEN_EXPIRADO',
          mensagem: 'Token expirado. Faça refresh.'
        });
      }
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Token inválido'
      });
    }
    
    // 3. Anexa usuário ao request
    req.usuario = usuario;
    next();
  });
};

// Middleware de Autorização por Role
const autorizarRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não tem permissão para esta ação',
        role_necessaria: rolesPermitidos,
        seu_role: req.usuario.role
      });
    }
    next();
  };
};

// Middleware de Autorização por Permissão
const autorizarPermissao = (permissao) => {
  return (req, res, next) => {
    if (!req.usuario.permissoes.includes(permissao) && 
        !req.usuario.permissoes.includes('*')) {  // admin tem *
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Permissão insuficiente',
        permissao_requerida: permissao
      });
    }
    next();
  };
};

// Uso:
app.post('/api/usuarios', 
  autenticarToken, 
  autorizarRole('admin'),
  criarUsuario
);

app.post('/api/vendas',
  autenticarToken,
  autorizarPermissao('vendas.criar'),
  criarVenda
);
```

---

## 9. ESTRUTURA DE PASTAS (Frontend)

```
src/modules/autenticacao/
│
├── pages/
│   ├── LoginPage.jsx           # Tela de login
│   ├── RecuperarSenhaPage.jsx # Recuperar senha
│   ├── RedefinirSenhaPage.jsx # Redefinir senha
│   ├── AdministradorPage.jsx  # Gestão usuários
│   └── AuditoriaPage.jsx       # Logs auditoria
│
├── components/
│   ├── LoginForm.jsx
│   ├── FormularioRecuperacao.jsx
│   ├── FormularioRedefinicao.jsx
│   ├── TabelaUsuarios.jsx
│   ├── FormularioUsuario.jsx
│   ├── ProtectedRoute.jsx      # Rota privada
│   ├── PermissionGuard.jsx     # Guarda permissão
│   └── TabelaAuditoria.jsx
│
├── hooks/
│   ├── useAuth.js              # Auth context
│   ├── usePermissao.js         # Verifica permissão
│   └── useLogin.js             # Lógica de login
│
├── services/
│   ├── authService.js          # Chamadas API auth
│   └── usuariosService.js      # Gestão usuários
│
├── context/
│   └── AuthContext.jsx         # Redux/Context
│
├── utils/
│   ├── tokenUtils.js           # Manipula tokens
│   ├── jwtDecode.js            # Decodifica JWT
│   └── validacaoSenha.js       # Força de senha
│
└── styles/
    ├── login.css
    ├── recuperacao.css
    └── usuarios.css
```

---

## 10. ESTRUTURA DE PASTAS (Backend)

```
src/modules/autenticacao/
│
├── controllers/
│   ├── authController.js       # Login, logout, refresh
│   ├── usuariosController.js   # CRUD usuários
│   ├── auditoria Controller.js # Logs
│   └── resetController.js      # Reset senha
│
├── services/
│   ├── authService.js          # Lógica autenticação
│   ├── usuariosService.js      # Lógica CRUD
│   ├── jwtService.js           # Geração JWT
│   ├── bcryptService.js        # Hash senhas
│   ├── emailService.js         # Envio emails
│   └── auditoria Service.js    # Registro auditoria
│
├── repositories/
│   ├── usuariosRepository.js
│   ├── rolesRepository.js
│   ├── auditoria Repository.js
│   └── tokenRepository.js
│
├── models/
│   ├── usuarioModel.js
│   ├── roleModel.js
│   ├── auditoria Model.js
│   └── tokenModel.js
│
├── routes/
│   ├── authRoutes.js           # Login, logout, refresh
│   ├── usuariosRoutes.js       # CRUD usuários
│   ├── auditoria Routes.js     # Logs
│   └── resetRoutes.js          # Reset senha
│
├── middleware/
│   ├── autenticarToken.js      # Valida JWT
│   ├── autorizarRole.js        # Autoriza role
│   ├── autorizarPermissao.js   # Autoriza permissão
│   ├── registrarAuditoria.js   # Registra ações
│   ├── rateLimiter.js          # Rate limiting
│   └── validarEmail.js         # Valida email
│
├── validacoes/
│   ├── loginValidacao.js
│   ├── usuarioValidacao.js
│   ├── senhaValidacao.js
│   └── emailValidacao.js
│
└── utils/
    ├── geracaoToken.js         # Gera reset tokens
    ├── criptografia.js         # Uteis cripto
    ├── notificacaoEmail.js     # Templates emails
    └── constants.js            # Constantes
```

---

## 11. MOCKUPS

### Tela 1: Login

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│            🔐 PDV ONLINE                       │
│                                                 │
│        RESTAURANTE XYZ                         │
│                                                 │
│                                                 │
│  Email ou Usuário:                             │
│  ┌─────────────────────────────────────────┐   │
│  │ gerente@empresa.com                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Senha:                                        │
│  ┌─────────────────────────────────────────┐   │
│  │ •••••••••••••••••                       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☐ Manter-me conectado                        │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  [Entrar]                               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  [Esqueci Senha]                        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│                                                 │
│  © 2026 PDV Online | Suporte: (11) 98765-4321 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tela 2: Gerenciamento de Usuários

```
┌──────────────────────────────────────────────────────────┐
│ ⚙️  ADMINISTRAÇÃO > USUÁRIOS                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [+ Novo Usuário] [Filtro: Todos ▼] [Status: Ativos ▼] │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Nome        │ Email            │ Role     │ Ações  │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ João Silva  │ joao@empresa.com │ Gerente  │ ✏️  🗑️  │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ Maria XYZ   │ maria@empresa.com│ Operador │ ✏️  🗑️  │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ Pedro ABC   │ pedro@empresa.com│ Operador │ ✏️  🗑️  │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ Admin       │ admin@empresa.com│ Admin    │ ✏️  🗑️  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Total de usuários: 4 (Ativos: 4, Inativos: 0)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Tela 3: Formulário Novo Usuário

```
┌────────────────────────────────────────────────┐
│ 📝 CRIAR NOVO USUÁRIO                         │
├────────────────────────────────────────────────┤
│                                                │
│ INFORMAÇÕES PESSOAIS:                         │
│                                                │
│ Nome Completo:                                │
│ ┌────────────────────────────────────────┐    │
│ │ João Silva                              │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Email:                                        │
│ ┌────────────────────────────────────────┐    │
│ │ joao.silva@empresa.com                 │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Telefone (opcional):                          │
│ ┌────────────────────────────────────────┐    │
│ │ (11) 98765-4321                        │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ ────────────────────────────────────────────  │
│ ACESSO:                                       │
│                                                │
│ Perfil (Role):                                │
│ ┌────────────────────────────────────────┐    │
│ │ Gerente                          ▼     │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Caixa Atribuído (se aplicável):              │
│ ┌────────────────────────────────────────┐    │
│ │ Caixa #01                        ▼     │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Ativo:  ☑ Sim   ☐ Não                        │
│                                                │
│ ────────────────────────────────────────────  │
│ SENHA:                                        │
│                                                │
│ ○ Gerar automaticamente                       │
│ ● Definir agora                              │
│   ┌────────────────────────────────────────┐  │
│   │ Minha$enh@123                          │  │
│   └────────────────────────────────────────┘  │
│                                                │
│ ────────────────────────────────────────────  │
│                                                │
│ [Cancelar]  [Salvar Usuário]                 │
│                                                │
└────────────────────────────────────────────────┘
```

### Tela 4: Auditoria de Acesso

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 AUDITORIA DE ACESSO E AÇÕES                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Filtros:                                                │
│ [Período: Últimos 7 dias ▼] [Tipo: Todos ▼]            │
│ [Usuário: Todos ▼] [Nível: Todos ▼]                    │
│                                                          │
│ Resumo: 1.234 ações | Login: 45 | Vendas: 567 | ...    │
│                                                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Data/Hora   │ Usuário    │ Ação        │ Detalhe │   │
│ ├───────────────────────────────────────────────────┤   │
│ │ 23/08 14:35 │ João Silva │ VENDA CRIADA│ [▶]    │   │
│ │ 23/08 14:33 │ Maria XYZ  │ LOGIN OK    │ [▶]    │   │
│ │ 23/08 14:30 │ Pedro ABC  │ VENDA CANC  │ [▶]    │   │
│ │ 23/08 14:28 │ João Silva │ ESTOQUE ENT │ [▶]    │   │
│ │ 23/08 14:25 │ Admin      │ USER UPDATE │ [▶]    │   │
│ │ 23/08 14:22 │ Maria XYZ  │ ACESSO NEG  │ [▶]    │   │
│ │ 23/08 14:20 │ João Silva │ DESC APLIC  │ [▶]    │   │
│ │ ...         │ ...        │ ...         │ ...    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                          │
│ [Exportar Relatório] [Imprimir] [Filtros Avançados]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 12. ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1: Setup + JWT (1-2 semanas)
- [ ] BD: tabelas usuarios, roles, auditoria, tokens
- [ ] JWT setup (secret, algoritmo, duração)
- [ ] Endpoint POST /login
- [ ] Endpoint POST /logout
- [ ] Endpoint POST /refresh
- [ ] Middleware autenticarToken
- [ ] Testes

### Sprint 2: Recuperação de Senha (1 semana)
- [ ] Endpoint POST /esqueci-senha
- [ ] Endpoint POST /redefinir-senha
- [ ] Geração de reset tokens
- [ ] Email service setup
- [ ] Templates de email
- [ ] Validações
- [ ] Testes

### Sprint 3: Gerenciamento de Usuários (1-2 semanas)
- [ ] CRUD de usuários (4 endpoints)
- [ ] Validação de dados
- [ ] Geração de senhas temporárias
- [ ] Frontend: tabela usuários
- [ ] Frontend: formulário novo usuário
- [ ] Testes

### Sprint 4: Roles e Permissões (1-2 semanas)
- [ ] Definição de 3 roles (admin, gerente, operador)
- [ ] Matriz de permissões
- [ ] Middleware autorizarRole
- [ ] Middleware autorizarPermissao
- [ ] Frontend: UI baseada em roles
- [ ] Testes

### Sprint 5: Auditoria (1-2 semanas)
- [ ] Middleware registrarAuditoria
- [ ] Tabela auditoria no BD
- [ ] Endpoint GET /auditoria
- [ ] Frontend: dashboard auditoria
- [ ] Filters e busca
- [ ] Testes

### Sprint 6: Segurança (1 semana)
- [ ] Rate limiting (login, reset)
- [ ] Bcrypt configurado
- [ ] Validação de força de senha
- [ ] HTTPS obrigatório (env)
- [ ] CORS configurado
- [ ] Testes

### Sprint 7: Frontend Completo (1-2 semanas)
- [ ] Tela de login
- [ ] Tela de recuperação
- [ ] Gestão usuários (admin)
- [ ] Dashboard auditoria
- [ ] ProtectedRoute (privadas)
- [ ] PermissionGuard
- [ ] Testes E2E

### Sprint 8: Polish + Deploy (1 semana)
- [ ] Testes completos
- [ ] Performance
- [ ] Staging
- [ ] Produção
- [ ] Treinamento usuários

---

## 13. CHECKLIST PRÉ-DESENVOLVIMENTO (Atualizado)

- [ ] Requisitos de segurança finalizados
- [ ] Política de senhas definida (min 8 chars, maiúscula, número, símbolo)
- [ ] Rate limiting configurado (5 tentativas/5min para login)
- [ ] HTTPS obrigatório em produção
- [ ] JWT secret key gerada (env variable, min 64 chars)
- [ ] Refresh token duração: 7 dias
- [ ] Access token duração: 8 horas
- [ ] Email service provider escolhido (SendGrid, AWS SES, Mailgun)
- [ ] Template de emails criado
- [ ] Banco de dados schema aprovado
- [ ] Bcrypt rounds: 10
- [ ] Reset token expira em: 1 hora
- [ ] Rate limiting reset password: 1 email/5min
- [ ] Testes de segurança planejados (OWASP)
- [ ] LGPD compliance considerado (dados sensíveis)
- [ ] Plano de 2FA definido (futuro)
- [ ] Backup de senhas/dados sensíveis
- [ ] Documentação de ambiente (.env.example)
- [ ] Logs de segurança configurados
- [ ] Monitoramento de atividades suspeitas



### Caso de Uso 1: Login e Acesso

**Ator:** Gerente
**Tempo:** ~1 minuto

**Fluxo:**
1. Abre aplicação
2. Tela de login exibida
3. Insere: gerente@empresa.com
4. Insere: senha_segura_123
5. Marca: Manter-me conectado
6. Clica [Entrar]
7. Sistema valida credenciais
8. Gera JWT (8h) e Refresh Token (7 dias)
9. Armazena tokens
10. Redireciona para Dashboard
11. Carrega permissões
12. Menu customizado aparece

**Resultado:** Acesso garantido, sessão iniciada.

---

### Caso de Uso 2: Criar Novo Usuário

**Ator:** Admin
**Tempo:** ~3 minutos

**Fluxo:**
1. Admin vai para: Configurações > [Usuários]
2. Clica [Novo Usuário]
3. Nome: "Pedro Silva"
4. Email: "pedro@empresa.com"
5. Perfil: "Operador"
6. Caixa: "#02"
7. Ativo: Sim
8. Senha: Gerar automaticamente
9. Clica [Salvar]
10. Sistema cria usuário
11. Envia email com credenciais
12. Pedro recebe email com senha temporária
13. Pedro acessa e é forçado trocar senha

**Resultado:** Novo usuário criado e ativado.

---

### Caso de Uso 3: Recuperar Senha

**Ator:** Operador
**Tempo:** ~5 minutos

**Fluxo:**
1. Tela de login
2. Clica [Esqueci Senha]
3. Insere: maria@empresa.com
4. Clica [Enviar Link]
5. Sistema envia email
6. Maria recebe email com link
7. Clica no link (válido por 1h)
8. Abre tela de nova senha
9. Insere: Minha$enh@456
10. Confirma: Minha$enh@456
11. Clica [Redefinir]
12. Sistema valida e atualiza
13. Toast: "Senha redefinida!"
14. Redireciona para login
15. Maria entra com nova senha

**Resultado:** Senha recuperada, acesso restaurado.

---

## 12. CHECKLIST PRÉ-DESENVOLVIMENTO

- [ ] Requisitos de segurança finalizados
- [ ] Política de senhas definida
- [ ] Rate limiting configurado
- [ ] HTTPS obrigatório em produção
- [ ] JWT secret key gerada (env variable)
- [ ] Email service provider escolhido (SendGrid, etc)
- [ ] Banco de dados schema aprovado
- [ ] Testes de segurança planejados
- [ ] LGPD compliance considerado
- [ ] Plano de 2FA definido (futuro)
- [ ] Backup de dados sensíveis

---

**Documento Versão:** 1.0  
**Data:** 23/08/2026  
**Status:** Pronto para Desenvolvimento

**Próximos Módulos:**
- Módulo 4: Configurações do Sistema
- Módulo 5: Integração com APIs Externas
- Fase 2+: Features Avançadas (2FA, SSO, etc)
