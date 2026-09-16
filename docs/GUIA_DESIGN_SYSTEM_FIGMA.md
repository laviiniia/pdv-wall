# GUIA COMPLETO: DESIGN SYSTEM NO FIGMA

## 📋 Sumário

Este guia detalha tudo que você precisa criar no Figma para o Design System do PDV Online.

---

## 1. ESTRUTURA DO PROJETO FIGMA

### 1.1 Organização de Pages

```
Projeto: PDV Online
│
├── 📄 0. Foundations
│   ├── Colors (Paleta de cores)
│   ├── Typography (Tipografia)
│   ├── Spacing (Espaçamento/Grid)
│   ├── Shadows (Sombras)
│   ├── Border Radius (Cantos)
│   └── Icons (Ícones)
│
├── 📄 1. Components
│   ├── Button (Todos os botões)
│   ├── Input (Campos de entrada)
│   ├── Select/Dropdown
│   ├── Checkbox & Radio
│   ├── Toggle
│   ├── Card
│   ├── Modal/Dialog
│   ├── Tooltip
│   ├── Toast/Alert
│   ├── Progress Bar
│   ├── Badge
│   ├── Table
│   └── Pagination
│
├── 📄 2. Patterns
│   ├── Forms (Padrão de formulários)
│   ├── Loading States (Estados de carregamento)
│   ├── Empty States (Estados vazios)
│   ├── Error States (Estados de erro)
│   ├── Navigation (Padrão navegação)
│   └── Layouts (Grid, layouts comuns)
│
├── 📄 3. Screens (Telas de Exemplo)
│   ├── Auth
│   │   ├── Login
│   │   ├── Recuperar Senha
│   │   └── Redefinir Senha
│   ├── Dashboard
│   ├── Vendas
│   ├── Estoque
│   ├── Financeiro
│   ├── Relatórios
│   └── Configurações
│
└── 📄 4. Documentation
    ├── How to Use (Como usar)
    ├── Component States (Estados dos componentes)
    └── Do's and Don'ts (Boas práticas)
```

---

## 2. FOUNDATIONS (O Alicerce)

### 2.1 COLORS (Paleta de Cores)

**PRIMARY BLUE**
- Main: #0066CC (botões, links)
- Dark: #0052A3 (hover)
- Darker: #003D7A (active)
- Light: #E6F0FF (backgrounds)
- Lighter: #B3D9FF (hover backgrounds)

**SECONDARY GREEN**
- Main: #00AA66 (sucesso, vendas)
- Dark: #008C52 (hover)
- Darker: #006E3F (active)
- Light: #E6F7F0 (backgrounds)
- Lighter: #B3E8D6 (hover backgrounds)

**SEMANTIC COLORS**
- Red (#DC3545): Erro, delete
- Amber (#FFC107): Aviso, alerta
- Teal (#17A2B8): Info
- Green (#28A745): Success

**NEUTRALS**
- White: #FFFFFF
- Gray 50: #F8F9FA
- Gray 100: #E9ECEF
- Gray 200: #DEE2E6
- Gray 300: #CED4DA
- Gray 400: #ADB5BD
- Gray 500: #6C757D
- Gray 600: #495057
- Gray 700: #343A40
- Gray 900: #212529

### 2.2 TYPOGRAPHY

```
Font: Inter (Google Fonts)

Display (H1):      48px, Bold, Line-height 1.2
Heading 1 (H2):    36px, Bold, Line-height 1.2
Heading 2 (H3):    28px, 600, Line-height 1.3
Heading 3 (H4):    24px, 600, Line-height 1.4
Body Large:        18px, 400, Line-height 1.5
Body Regular:      16px, 400, Line-height 1.5 (DEFAULT)
Body Small:        14px, 400, Line-height 1.6
Caption:           12px, 500, Line-height 1.6
Overline:          11px, 600, Line-height 1.8
```

### 2.3 SPACING (8px base unit)

```
2px, 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 56px, 64px, 80px, 96px

Padrão:
- Padding inputs: 12px, 16px
- Height inputs: 40px
- Gap entre elementos: 16px, 24px
```

### 2.4 SHADOWS

```
Shadow 1: Y 2px, Blur 4px, 10% opacity (hover)
Shadow 2: Y 4px, Blur 8px, 12% opacity (cards)
Shadow 3: Y 12px, Blur 24px, 15% opacity (dropdowns)
Shadow 4: Y 20px, Blur 40px, 15% opacity (modals)
```

### 2.5 BORDER RADIUS

```
2px: micro
4px: small
6px: medium (padrão)
8px: large
12px: xl
16px: 2xl
24px: pill
```

### 2.6 ICONS

Essenciais: Home, Menu, Settings, User, Bell, Search, Add, Edit, Delete, Check, X, Alert, Heart, Cart, Calendar, Clock, ChevronDown, ArrowRight, Eye, Download, Upload

---

## 3. COMPONENTS (Os Blocos)

### 3.1 BUTTON

Variações: Primary, Secondary, Danger, Success
Tamanhos: Small (32px), Medium (40px), Large (48px)
Estados: Default, Hover, Focus, Disabled, Loading

### 3.2 INPUT

Tipos: Text, Email, Password, Search, Number, Currency
Tamanhos: Small, Medium, Large
Estados: Default, Hover, Focus, Error, Disabled

### 3.3 SELECT / DROPDOWN

Com/sem search, multi-select, disabled

### 3.4 CHECKBOX & RADIO

Todos os estados: unchecked, checked, disabled, hover, focus
Com/sem label

### 3.5 TOGGLE SWITCH

On/off, disabled, com/sem label

### 3.6 CARD

Variações: Basic, Product, Stat, Compact
Com/sem sombra, hover states

### 3.7 MODAL / DIALOG

Tamanhos: Small, Medium, Large, XL
Com header, body, footer
Overlay semi-transparent

### 3.8 TOAST / ALERT

Tipos: Success, Error, Warning, Info
Posições: Top/Bottom, Left/Center/Right
Com/sem ícone

### 3.9 TABLE

Striped, compact, hoverable, selectable, sortable
Com pagination e empty states

### 3.10 BADGE & TAG

Variações por cor, com/sem ícone, removível

### 3.11 PROGRESS

Barra linear, circular, stepper, spinner

### 3.12 TOOLTIP & POPOVER

Positions: Top, Bottom, Left, Right
Com arrow e shadow

---

## 4. PATTERNS

### 4.1 FORM PATTERN
Container, section, row, field com label/helper/error

### 4.2 LOADING STATES
Skeleton, spinner, loading bar, overlay

### 4.3 EMPTY STATES
No data, no results, error, no permission

### 4.4 NAVIGATION
Navbar, sidebar, breadcrumb, tabs, pagination, filters

---

## 5. TELAS DE EXEMPLO

Crie protótipos reais de:
- Login
- Dashboard
- Vendas (lista + nova venda)
- Estoque
- Financeiro
- Configurações

---

## 6. CHECKLIST: O QUE CRIAR

FOUNDATIONS:
☐ Color Palette (com 12+ cores)
☐ Typography Styles (8 tamanhos)
☐ Spacing Grid
☐ Shadows (4 níveis)
☐ Border Radius values
☐ Icon Set (20+ ícones)

COMPONENTS:
☐ Buttons (6+ variações)
☐ Inputs (5+ tipos)
☐ Select/Dropdown
☐ Checkbox & Radio
☐ Toggle
☐ Card (4 variações)
☐ Modal/Dialog
☐ Toast/Alert
☐ Table
☐ Badge & Tag
☐ Progress
☐ Tooltip & Popover

PATTERNS:
☐ Form Pattern
☐ Loading States
☐ Empty States
☐ Navigation

SCREENS:
☐ Auth (3 telas)
☐ Dashboard
☐ Vendas (3 telas)
☐ Estoque
☐ Financeiro
☐ Configurações

DOCUMENTATION:
☐ Usage Guide
☐ Do's and Don'ts
☐ Accessibility
☐ Responsive Behavior

---

## 7. DICAS PRO FIGMA

1. **Use Componentes Aninhados**
   - Button → Button with Icon → Button Group

2. **Nomeação Consistente**
   - Formato: `Category/Type/State`
   - Ex: `Button/Primary/Default`

3. **Use Variants**
   - Combine múltiplas versões em 1 componente

4. **Publish para Times**
   - File > Publish Design System

5. **Use Tokens**
   - Color tokens, size tokens, spacing tokens

6. **Organize Pages**
   - Uma página por tipo de componente

7. **Respeite Grid**
   - Use 8px grid para alinhamento

8. **Crie Prototypes**
   - Link entre telas, mostra flow da app

---

**Status:** Pronto para criar no Figma
**Próximos Passos:**
1. Criar projeto no Figma
2. Seguir estrutura deste guia
3. Exportar tokens (JSON) para código
4. Integrar Shadcn/ui ao Next.js
