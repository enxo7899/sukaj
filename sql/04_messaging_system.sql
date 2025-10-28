-- Migration: Messaging System (Twilio SMS & WhatsApp)
-- Description: Adds support for SMS and WhatsApp notifications via Twilio
-- Date: 2025-10-23

-- ========================================
-- 1. Add short_code to properties table
-- ========================================
alter table public.properties 
  add column if not exists short_code text unique;

-- Create index for fast lookups
create index if not exists idx_properties_short_code 
  on public.properties(short_code);

comment on column public.properties.short_code is 
  'Human-readable unique identifier for property (e.g., AP1, DYQAN2)';

-- ========================================
-- 2. Add owner phone fields to properties
-- ========================================
alter table public.properties
  add column if not exists owner_phone text;

comment on column public.properties.owner_phone is 
  'Owner WhatsApp number in E.164 format (e.g., +355xxxxxxxxx)';

-- ========================================
-- 3. Add tenant phone to kontratat table
-- ========================================
alter table public.kontratat
  add column if not exists tel_qera_marres text;

comment on column public.kontratat.tel_qera_marres is 
  'Tenant phone number in E.164 format for SMS notifications';

-- ========================================
-- 4. Transform rent_notifications table
-- ========================================
-- Drop existing table and recreate with new schema
drop table if exists public.rent_notifications cascade;

create table public.rent_notifications (
  id uuid primary key default gen_random_uuid(),
  
  -- Linked property (if applicable)
  property_id uuid references public.properties(id) on delete set null,
  
  -- Linked contract (if applicable)
  contract_id uuid references public.kontratat(id) on delete set null,
  
  -- Communication channel
  channel text not null check (channel in ('sms', 'whatsapp')),
  
  -- Recipient (E.164 format)
  recipient text not null,
  
  -- Message status tracking
  status text not null default 'queued' 
    check (status in ('queued', 'sent', 'delivered', 'failed', 'undelivered')),
  
  -- Twilio identifiers
  message_sid text unique,
  
  -- Status callback payload from Twilio
  status_callback_payload jsonb,
  
  -- Error tracking
  error_code integer,
  error_message text,
  
  -- Idempotency key to prevent duplicate sends
  idempotency_key text unique not null,
  
  -- Notification metadata
  notification_type text not null
    check (notification_type in ('rent_due', 'contract_expiry_30d')),
  
  -- Message content for reference
  message_body text,
  
  -- Template info for WhatsApp
  content_sid text,
  content_variables jsonb,
  
  -- Timestamps
  created_at timestamptz default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz
);

-- Indexes for efficient querying
create index if not exists idx_rent_notif_property 
  on public.rent_notifications(property_id);

create index if not exists idx_rent_notif_contract 
  on public.rent_notifications(contract_id);

create index if not exists idx_rent_notif_channel 
  on public.rent_notifications(channel);

create index if not exists idx_rent_notif_status 
  on public.rent_notifications(status);

create index if not exists idx_rent_notif_idempotency 
  on public.rent_notifications(idempotency_key);

create index if not exists idx_rent_notif_message_sid 
  on public.rent_notifications(message_sid);

-- RLS policies
alter table public.rent_notifications enable row level security;

drop policy if exists "Admin full access to rent_notifications" 
  on public.rent_notifications;

create policy "Admin full access to rent_notifications"
  on public.rent_notifications
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

-- Allow service role (cron jobs) to insert/update
drop policy if exists "Service role can manage rent_notifications" 
  on public.rent_notifications;

create policy "Service role can manage rent_notifications"
  on public.rent_notifications
  for all
  using (true)
  with check (true);

comment on table public.rent_notifications is 
  'Tracks all SMS and WhatsApp notifications sent via Twilio';

-- ========================================
-- 5. Update rental_payments table
-- ========================================
-- Add composite unique constraint to prevent duplicate monthly records
alter table public.rental_payments
  add column if not exists due_month integer,
  add column if not exists due_year integer;

-- Populate the month and year from existing payment_due_date
update public.rental_payments
set 
  due_month = extract(month from payment_due_date),
  due_year = extract(year from payment_due_date)
where due_month is null or due_year is null;

-- Create unique constraint
drop index if exists ux_rental_payments_property_month_year;
create unique index ux_rental_payments_property_month_year
  on public.rental_payments(property_id, due_month, due_year);

-- Add trigger to auto-populate month/year on insert/update
create or replace function set_payment_month_year()
returns trigger language plpgsql as $$
begin
  new.due_month := extract(month from new.payment_due_date);
  new.due_year := extract(year from new.payment_due_date);
  return new;
end;
$$;

drop trigger if exists trg_set_payment_month_year on public.rental_payments;
create trigger trg_set_payment_month_year
  before insert or update of payment_due_date on public.rental_payments
  for each row execute function set_payment_month_year();

comment on column public.rental_payments.due_month is 
  'Month of payment (1-12) - auto-populated from payment_due_date';

comment on column public.rental_payments.due_year is 
  'Year of payment - auto-populated from payment_due_date';

-- ========================================
-- 6. Helper functions for cron jobs
-- ========================================

-- Function to get properties with rent due today
create or replace function get_properties_due_today()
returns table (
  property_id uuid,
  property_name text,
  property_short_code text,
  tenant_name text,
  tenant_phone text,
  owner_phone text,
  rent_amount numeric,
  currency text,
  due_date date
) language plpgsql as $$
begin
  return query
  select 
    p.id,
    p.emertimi,
    p.short_code,
    p.emri_qiraxhiut,
    p.tel_qiraxhiut,
    p.owner_phone,
    p.qera_mujore,
    p.monedha,
    p.data_qirase
  from public.properties p
  where 
    p.status = 'Aktive'
    and p.data_qirase is not null
    and (
      -- Exact match on day
      extract(day from p.data_qirase) = extract(day from current_date)
      or
      -- Month-end handling: if due day > last day of current month, trigger on last day
      (
        extract(day from p.data_qirase) > extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))
        and extract(day from current_date) = extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))
      )
    );
end;
$$;

-- Function to get contracts expiring in 30 days
create or replace function get_contracts_expiring_soon()
returns table (
  contract_id uuid,
  property_name text,
  property_short_code text,
  owner_phone text,
  expiry_date date,
  tenant_name text
) language plpgsql as $$
begin
  return query
  select 
    k.id,
    coalesce(k.nr_apartament, k.dyqane, 'N/A'),
    p.short_code,
    p.owner_phone,
    k.mbarimi_kontrates,
    k.qera_marres
  from public.kontratat k
  left join public.properties p on p.emertimi = coalesce(k.nr_apartament, k.dyqane)
  where 
    k.mbarimi_kontrates = current_date + interval '30 days'
    and k.mbarimi_kontrates is not null;
end;
$$;

comment on function get_properties_due_today is 
  'Returns all active properties with rent due today (handles month-end edge cases)';

comment on function get_contracts_expiring_soon is 
  'Returns all contracts expiring in exactly 30 days';
