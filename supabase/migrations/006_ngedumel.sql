-- =============================================================================
-- bbs/ — Sesi 6: /ngedumel admin-only mini-thread
-- =============================================================================
-- Run AFTER 005_reactions_redesign.sql
-- =============================================================================

create table if not exists public.dumel (
  id          bigint generated always as identity primary key,
  content     text not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists dumel_created_at_idx
  on public.dumel (created_at desc);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Critical: NO public access. Anon role can't even know this table exists.
-- Only the service_role (admin actions) can read/write.
-- This is the FIRST line of defense even before the middleware check.

alter table public.dumel enable row level security;

-- No policies for anon/authenticated → effectively denied for them.
-- service_role bypasses RLS, so admin server actions work normally.


-- =============================================================================
-- updated_at trigger
-- =============================================================================

drop trigger if exists dumel_updated_at on public.dumel;
create trigger dumel_updated_at
  before update on public.dumel
  for each row execute function public.set_updated_at();
