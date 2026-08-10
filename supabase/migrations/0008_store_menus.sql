create table if not exists public.store_menus (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  price int check (price is null or price >= 0),
  description text,
  is_signature boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_menus_store_position_idx
  on public.store_menus (store_id, position, name);

alter table public.store_menus enable row level security;

drop trigger if exists store_menus_set_updated_at on public.store_menus;
create trigger store_menus_set_updated_at
before update on public.store_menus
for each row execute function public.set_updated_at();

drop policy if exists "store menus public read" on public.store_menus;
create policy "store menus public read"
on public.store_menus for select
using (true);

drop policy if exists "store menus admin all" on public.store_menus;
create policy "store menus admin all"
on public.store_menus for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
