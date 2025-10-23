create table if not exists public.kontratat (
  id uuid primary key default gen_random_uuid(),
  nr_repert text,
  nr_koleks text,
  qera_dhenes text,
  qera_marres text,
  nr_apartament text,
  m2 numeric,
  dyqane text,
  vendi text,
  fillimi_kontrates date,
  mbarimi_kontrates date,
  vlera_bruto numeric,
  monedha_bruto text,
  vlera_neto numeric,
  monedha_neto text,
  garanci numeric,
  monedha_garanci text,
  kontrate_drita text,
  kontrate_uji text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_kontratat_qera_marres on public.kontratat(qera_marres);
create index if not exists idx_kontratat_nr_apartament on public.kontratat(nr_apartament);
create unique index if not exists ux_kontratat_repert_koleks on public.kontratat(nr_repert, nr_koleks);

alter table public.kontratat enable row level security;

drop policy if exists "Admin full access to kontratat" on public.kontratat;
drop policy if exists "Editor can view kontratat" on public.kontratat;

create policy "Admin full access to kontratat"
  on public.kontratat
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Editor can view kontratat"
  on public.kontratat
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'editor'
    )
  );

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists trg_touch_kontratat on public.kontratat;
create trigger trg_touch_kontratat
  before update on public.kontratat
  for each row execute function update_updated_at_column();
