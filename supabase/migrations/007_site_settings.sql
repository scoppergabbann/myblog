-- =============================================================================
-- bbs/ — Sesi 7: Maintenance mode setting
-- =============================================================================
-- Run AFTER 006_ngedumel.sql
--
-- Single-row config table. Holds maintenance toggle + custom message.
-- Schema designed to be extensible — future settings can be added as columns.
-- =============================================================================

create table if not exists public.site_settings (
  -- Single row enforced by primary key = 1
  id                      smallint primary key default 1 check (id = 1),
  maintenance_enabled     boolean not null default false,
  maintenance_title       text not null default 'Sedang dalam perbaikan',
  maintenance_message     text not null default 'Halamannya lagi di-update sebentar. Balik lagi ya — nuhun banyak!',
  maintenance_eta         text default null,  -- e.g. "kira-kira 30 menit lagi" or "sebentar lagi"
  maintenance_contact     text default null,  -- contact email or social URL for urgent
  updated_at              timestamptz not null default now()
);

-- Seed single row if empty
insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Anyone can READ (middleware needs anon access to check maintenance state).
-- Only service_role (admin) can WRITE.

alter table public.site_settings enable row level security;

drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read"
  on public.site_settings
  for select
  using (true);

-- No insert/update/delete policies for anon → effectively service_role only.


-- =============================================================================
-- updated_at trigger
-- =============================================================================

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();
