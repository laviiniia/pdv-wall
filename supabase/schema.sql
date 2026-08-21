-- Comanda — schema, RLS e seed
-- Cole no SQL Editor do Supabase e execute.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('customer', 'staff');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.comanda_status as enum ('aberta', 'cancelada', 'finalizada');
exception when duplicate_object then null;
end $$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_codes (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  staff_code text not null unique
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'customer',
  restaurant_id uuid references public.restaurants(id),
  created_at timestamptz not null default now(),
  constraint staff_has_restaurant check (
    (role = 'staff' and restaurant_id is not null)
    or (role = 'customer')
  )
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  category text not null,
  active boolean not null default true,
  unique (restaurant_id, name)
);

create table if not exists public.comandas (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  opened_by uuid references public.profiles(id) on delete set null,
  table_label text not null default 'Balcão',
  status public.comanda_status not null default 'aberta',
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comanda_items (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references public.comandas(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(10, 2) not null,
  qty integer not null default 1 check (qty > 0),
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists comandas_one_open_per_customer
  on public.comandas (restaurant_id, customer_id)
  where status = 'aberta' and customer_id is not null;

create index if not exists comandas_restaurant_status_idx
  on public.comandas (restaurant_id, status, created_at desc);

create index if not exists products_restaurant_idx
  on public.products (restaurant_id, active);

create or replace function public.touch_comanda_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists comandas_touch_updated_at on public.comandas;
create trigger comandas_touch_updated_at
  before update on public.comandas
  for each row execute function public.touch_comanda_updated_at();

create or replace function public.my_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.join_restaurant_staff(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rest_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select restaurant_id into rest_id
  from public.restaurant_codes
  where upper(trim(staff_code)) = upper(trim(p_code));

  if rest_id is null then
    raise exception 'Código da equipe inválido';
  end if;

  update public.profiles
    set role = 'staff', restaurant_id = rest_id
    where id = auth.uid();

  return rest_id;
end;
$$;

grant execute on function public.join_restaurant_staff(text) to authenticated;

alter table public.restaurants enable row level security;
alter table public.restaurant_codes enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.comandas enable row level security;
alter table public.comanda_items enable row level security;

-- Códigos da equipe: só via função (sem policy de SELECT)
revoke all on public.restaurant_codes from anon, authenticated;
grant select on public.restaurants to anon, authenticated;
grant select on public.products to anon, authenticated;

drop policy if exists restaurants_read on public.restaurants;
create policy restaurants_read on public.restaurants
  for select using (true);

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (active = true);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.my_role() = 'staff');

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'customer');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer' and restaurant_id is null);

drop policy if exists comandas_select on public.comandas;
create policy comandas_select on public.comandas
  for select to authenticated
  using (
    customer_id = auth.uid()
    or (public.my_role() = 'staff' and restaurant_id = public.my_restaurant_id())
  );

drop policy if exists comandas_insert on public.comandas;
create policy comandas_insert on public.comandas
  for insert to authenticated
  with check (
    (
      customer_id = auth.uid()
      and public.my_role() = 'customer'
      and status = 'aberta'
    )
    or (
      public.my_role() = 'staff'
      and restaurant_id = public.my_restaurant_id()
    )
  );

drop policy if exists comandas_update on public.comandas;
create policy comandas_update on public.comandas
  for update to authenticated
  using (
    (customer_id = auth.uid() and status = 'aberta' and public.my_role() = 'customer')
    or (public.my_role() = 'staff' and restaurant_id = public.my_restaurant_id())
  )
  with check (
    (customer_id = auth.uid() and public.my_role() = 'customer' and status = 'aberta')
    or (public.my_role() = 'staff' and restaurant_id = public.my_restaurant_id())
  );

drop policy if exists items_select on public.comanda_items;
create policy items_select on public.comanda_items
  for select to authenticated
  using (
    exists (
      select 1 from public.comandas c
      where c.id = comanda_id
        and (
          c.customer_id = auth.uid()
          or (public.my_role() = 'staff' and c.restaurant_id = public.my_restaurant_id())
        )
    )
  );

drop policy if exists items_write on public.comanda_items;
create policy items_write on public.comanda_items
  for all to authenticated
  using (
    exists (
      select 1 from public.comandas c
      where c.id = comanda_id
        and c.status = 'aberta'
        and (
          c.customer_id = auth.uid()
          or (public.my_role() = 'staff' and c.restaurant_id = public.my_restaurant_id())
        )
    )
  )
  with check (
    exists (
      select 1 from public.comandas c
      where c.id = comanda_id
        and c.status = 'aberta'
        and (
          c.customer_id = auth.uid()
          or (public.my_role() = 'staff' and c.restaurant_id = public.my_restaurant_id())
        )
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.comandas;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.comanda_items;
exception when duplicate_object then null;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.restaurants, public.products to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.comandas, public.comanda_items to authenticated;

-- Seed (São Paulo)
insert into public.restaurants (id, name, address, lat, lng, phone)
values
  ('11111111-1111-1111-1111-111111111111', 'Luma da Esquina', 'Rua da Consolação 2100, Consolação, São Paulo', -23.5489, -46.6388, '1130330101'),
  ('22222222-2222-2222-2222-222222222222', 'Taberna do Mercado', 'Rua da Cantareira 306, Centro, São Paulo', -23.5425, -46.6298, '1132214400'),
  ('33333333-3333-3333-3333-333333333333', 'Casa Brasa', 'Rua Oscar Freire 480, Jardins, São Paulo', -23.5614, -46.6558, '1130812200'),
  ('44444444-4444-4444-4444-444444444444', 'Maré de Copo', 'Rua dos Pinheiros 850, Pinheiros, São Paulo', -23.5570, -46.6630, '1130317788')
on conflict (id) do nothing;

insert into public.restaurant_codes (restaurant_id, staff_code)
values
  ('11111111-1111-1111-1111-111111111111', 'LUMA26'),
  ('22222222-2222-2222-2222-222222222222', 'TABERNA26'),
  ('33333333-3333-3333-3333-333333333333', 'BRASA26'),
  ('44444444-4444-4444-4444-444444444444', 'MARE26')
on conflict (restaurant_id) do nothing;

insert into public.products (restaurant_id, name, description, price, category)
values
  ('11111111-1111-1111-1111-111111111111', 'Pão de fermentação', 'Manteiga de cabra e flor de sal', 18.00, 'Entradas'),
  ('11111111-1111-1111-1111-111111111111', 'Salada de folhas tostadas', 'Queijo coalho e vinagrete de maracujá', 32.00, 'Entradas'),
  ('11111111-1111-1111-1111-111111111111', 'Risoto de funghi', 'Parmesão 24 meses', 58.00, 'Pratos'),
  ('11111111-1111-1111-1111-111111111111', 'Frango caipira', 'Farofa de banana e suco do assado', 64.00, 'Pratos'),
  ('11111111-1111-1111-1111-111111111111', 'Pudim de café', 'Caramelo salgado', 22.00, 'Sobremesas'),
  ('11111111-1111-1111-1111-111111111111', 'Negroni da casa', 'Vermute artesanal', 36.00, 'Bebidas'),

  ('22222222-2222-2222-2222-222222222222', 'Pastel de bacalhau', 'Dois pastéis crocantes', 24.00, 'Entradas'),
  ('22222222-2222-2222-2222-222222222222', 'Caldo verde', 'Linguiça e azeite', 28.00, 'Entradas'),
  ('22222222-2222-2222-2222-222222222222', 'Bacalhau à brás', 'Batata palha e azeitona', 72.00, 'Pratos'),
  ('22222222-2222-2222-2222-222222222222', 'Francesinha', 'Molho de cerveja preta', 68.00, 'Pratos'),
  ('22222222-2222-2222-2222-222222222222', 'Natas do céu', 'Doce de ovos', 19.00, 'Sobremesas'),
  ('22222222-2222-2222-2222-222222222222', 'Vinho da casa (taça)', 'Tinto do Dão', 28.00, 'Bebidas'),

  ('33333333-3333-3333-3333-333333333333', 'Linguiça na brasa', 'Vinagrete de pimenta biquinho', 34.00, 'Entradas'),
  ('33333333-3333-3333-3333-333333333333', 'Picanha 200g', 'Arroz, farofa e vinagrete', 89.00, 'Pratos'),
  ('33333333-3333-3333-3333-333333333333', 'Costela lenta', '12h no fogo brando', 96.00, 'Pratos'),
  ('33333333-3333-3333-3333-333333333333', 'Salada de palmito', 'Gergelim e limão', 29.00, 'Entradas'),
  ('33333333-3333-3333-3333-333333333333', 'Pudim de leite', 'Calda amarga', 18.00, 'Sobremesas'),
  ('33333333-3333-3333-3333-333333333333', 'Caipirinha de tangerina', 'Cachaça prata', 26.00, 'Bebidas'),

  ('44444444-4444-4444-4444-444444444444', 'Ostras 6un', 'Limão e tabasco', 48.00, 'Entradas'),
  ('44444444-4444-4444-4444-444444444444', 'Ceviche de cação', 'Leche de tigre', 42.00, 'Entradas'),
  ('44444444-4444-4444-4444-444444444444', 'Moqueca de peixe', 'Azeite de dendê e pirão', 78.00, 'Pratos'),
  ('44444444-4444-4444-4444-444444444444', 'Camarão no coco', 'Arroz de jasmim', 82.00, 'Pratos'),
  ('44444444-4444-4444-4444-444444444444', 'Mousse de maracujá', 'Crocante de castanha', 21.00, 'Sobremesas'),
  ('44444444-4444-4444-4444-444444444444', 'Gin tônica cítrica', 'Alecrim e toranja', 32.00, 'Bebidas')
on conflict (restaurant_id, name) do nothing;
