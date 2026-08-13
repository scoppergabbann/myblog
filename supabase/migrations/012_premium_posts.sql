-- =============================================================================
-- bbs/ - premium/password-protected posts
-- =============================================================================
-- Run AFTER 011_library.sql
-- =============================================================================

alter table public.posts
  add column if not exists is_premium boolean not null default false;

create table if not exists public.post_premium_locks (
  post_id        bigint primary key references public.posts(id) on delete cascade,
  password_hash  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists post_premium_locks_updated_at_idx
  on public.post_premium_locks (updated_at desc);

drop trigger if exists post_premium_locks_updated_at on public.post_premium_locks;
create trigger post_premium_locks_updated_at
  before update on public.post_premium_locks
  for each row execute function public.set_updated_at();

alter table public.post_premium_locks enable row level security;

-- No public SELECT/INSERT/UPDATE/DELETE policy on this table.
-- Admin server actions use service_role, which bypasses RLS.

-- Hide premium rows from direct anon/authenticated Supabase reads. The website
-- fetches posts server-side with service_role and decides whether to render the
-- MDX after password unlock.
drop policy if exists "posts_read_published" on public.posts;
create policy "posts_read_published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published' and is_premium = false);
