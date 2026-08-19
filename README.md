# Comanda

App Expo de gestão de comandas (cliente + equipe) com restaurantes por GPS e dados no Supabase.

## 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Authentication → Providers → Email**, desative **Confirm email** no MVP (senão o cadastro não cria sessão na hora).
3. SQL Editor: cole e rode [`supabase/schema.sql`](supabase/schema.sql).
4. Copie a URL e a `anon` key em **Project Settings → API**.

## 2. App

```bash
cp .env.example .env
```

Preencha:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

```bash
npx expo start
```

Abra no Expo Go (GPS funciona melhor no celular).

## Contas

- **Cliente:** cadastro normal, sem código.
- **Equipe:** no cadastro, informe o código do salão:
  - Luma da Esquina → `LUMA26`
  - Taberna do Mercado → `TABERNA26`
  - Casa Brasa → `BRASA26`
  - Maré de Copo → `MARE26`

O cliente lista restaurantes por distância, abre comanda e lança itens. A equipe vê o mesmo em tempo real, edita, cancela e finaliza. Se o aparelho da equipe estiver a mais de 200 m do salão, aparece um aviso (não bloqueia).
