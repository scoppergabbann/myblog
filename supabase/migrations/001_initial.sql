-- =============================================================================
-- bbs/ — belutbakarsurabaya — Supabase schema
-- =============================================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- Safe to run multiple times (uses IF NOT EXISTS).
-- =============================================================================


-- =============================================================================
-- 1. GUESTBOOK
-- =============================================================================

create table if not exists public.guestbook (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 40),
  message     text not null check (char_length(message) between 1 and 280),
  approved    boolean not null default true,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index if not exists guestbook_created_at_idx
  on public.guestbook (created_at desc);


-- =============================================================================
-- 2. COMMENTS (per article)
-- =============================================================================

create table if not exists public.comments (
  id           bigint generated always as identity primary key,
  slug         text not null,
  name         text not null check (char_length(name) between 1 and 40),
  message      text not null check (char_length(message) between 1 and 800),
  approved     boolean not null default true,
  ip_hash      text,
  created_at   timestamptz not null default now()
);

create index if not exists comments_slug_idx
  on public.comments (slug, created_at desc);


-- =============================================================================
-- 3. REACTIONS (per article)
-- =============================================================================

create table if not exists public.reactions (
  id           bigint generated always as identity primary key,
  slug         text not null,
  emoji        text not null check (emoji in ('heart', 'fire', 'thinking', 'star')),
  ip_hash      text not null,
  created_at   timestamptz not null default now(),
  unique (slug, emoji, ip_hash)  -- one reaction per kind per IP per article
);

create index if not exists reactions_slug_idx on public.reactions (slug);


-- =============================================================================
-- 4. NEWSLETTER SUBSCRIBERS
-- =============================================================================

create table if not exists public.subscribers (
  id           bigint generated always as identity primary key,
  email        text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  confirmed    boolean not null default false,
  confirm_token text unique,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz
);


-- =============================================================================
-- 5. VIEW COUNTER (per article)
-- =============================================================================

create table if not exists public.views (
  slug         text primary key,
  count        bigint not null default 0,
  updated_at   timestamptz not null default now()
);

-- Atomic increment function (avoids race conditions)
create or replace function public.increment_view(p_slug text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  insert into public.views (slug, count)
  values (p_slug, 1)
  on conflict (slug) do update
    set count = views.count + 1,
        updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- All tables: RLS ON. We give anon role only SELECT and very specific INSERTs.
-- Service role bypasses RLS (used for admin operations via server actions).

alter table public.guestbook   enable row level security;
alter table public.comments    enable row level security;
alter table public.reactions   enable row level security;
alter table public.subscribers enable row level security;
alter table public.views       enable row level security;


-- GUESTBOOK policies
drop policy if exists "guestbook_read_approved" on public.guestbook;
create policy "guestbook_read_approved"
  on public.guestbook for select
  to anon, authenticated
  using (approved = true);

-- (no anon insert — all writes go through server action with service role)


-- COMMENTS policies
drop policy if exists "comments_read_approved" on public.comments;
create policy "comments_read_approved"
  on public.comments for select
  to anon, authenticated
  using (approved = true);


-- REACTIONS policies
drop policy if exists "reactions_read_all" on public.reactions;
create policy "reactions_read_all"
  on public.reactions for select
  to anon, authenticated
  using (true);


-- VIEWS policies
drop policy if exists "views_read_all" on public.views;
create policy "views_read_all"
  on public.views for select
  to anon, authenticated
  using (true);


-- SUBSCRIBERS: no public read (privacy). Only service role can access.


-- =============================================================================
-- DONE
-- =============================================================================
-- After running this, verify in Supabase dashboard:
--   1. Tables → all 5 should appear
--   2. Authentication → Policies → RLS enabled with expected policies
--   3. Database → Functions → increment_view exists
-- =============================================================================
