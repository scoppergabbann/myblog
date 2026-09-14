-- A single operational record, separate from public content.
create table if not exists public.database_heartbeat (
  id smallint primary key check (id = 1),
  last_seen_at timestamptz not null default now()
);

alter table public.database_heartbeat enable row level security;
revoke all on table public.database_heartbeat from public, anon, authenticated;
grant select, insert, update on table public.database_heartbeat to service_role;
