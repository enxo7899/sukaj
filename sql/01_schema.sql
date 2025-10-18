create schema if not exists app;

create table if not exists app.properties (
  id uuid primary key default gen_random_uuid(),
  -- Nga Excel + fusha të rëndësishme
  emertimi text not null,
  emri_qiraxhiut text,
  tel_qiraxhiut text,
  oshee text,
  ukt text,

  -- Grup/ndarje dhe shkalla (filtra në sidebar)
  grupi text,                 -- p.sh. "6 KATESHI I BARDHË", "Shkalla A+B", "MAGAZINA", "DYQANE", "HOTELI", ...
  shkalla text,               -- p.sh. "A", "B", "D"
  tags text[] default '{}',

  -- Fusha shumë të rëndësishme për fazën e radhës
  qera_mujore numeric,
  monedha text default 'EUR',
  dita_skadences int default 1,
  status text default 'Aktive', -- "Aktive" | "Jo aktive"
  pershkrim text,

  -- Adresimi (opsionale)
  adresa text,
  qyteti text,
  njesia_administrative text,
  kodi_postar text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table app.properties disable row level security;

create index if not exists idx_properties_grupi on app.properties(grupi);
create index if not exists idx_properties_shkalla on app.properties(shkalla);
create index if not exists idx_properties_tags on app.properties using gin(tags);

create or replace function app.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_touch_properties on app.properties;
create trigger trg_touch_properties
before update on app.properties
for each row execute function app.touch_updated_at();

-- NOTE: RLS OFF in dev. For production, enable RLS and add policies.
