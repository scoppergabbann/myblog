-- Stream replaces the public lists on /now. Legacy tables are preserved.
begin;
create table if not exists public.now_entries (
  id bigint generated always as identity primary key,
  title text not null check (char_length(trim(title)) between 1 and 160),
  category text not null default 'life' check (category in ('maintenance', 'release', 'life')),
  project text not null default '' check (char_length(project) <= 100),
  project_url text not null default '' check (char_length(project_url) <= 1000 and (project_url = '' or project_url ~ '^https?://')),
  content text not null check (char_length(trim(content)) between 1 and 20000),
  published_on date not null default current_date,
  published boolean not null default false,
  legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists now_entries_timeline_idx on public.now_entries (published_on desc, id desc) where published = true;
alter table public.now_entries enable row level security;
drop policy if exists now_entries_read_published on public.now_entries;
create policy now_entries_read_published on public.now_entries for select to anon, authenticated using (published = true);
grant select on public.now_entries to anon, authenticated;
grant all on public.now_entries to service_role;
grant usage, select on sequence public.now_entries_id_seq to service_role;

-- Copy existing activities once. Rerunning this migration never restores deleted entries.
insert into public.now_entries (title, category, content, published_on, published, legacy_key)
select case section when 'learning' then 'Sedang belajar' when 'working' then 'Sedang dikerjakan' else 'Sedang dikonsumsi' end,
  'life', string_agg(role || ': ' || content, E'\n\n' order by display_order desc, id desc),
  (select updated_at::date from public.now_meta where id = 1), true, section
from public.now_items
where not exists (select 1 from public.now_entries where legacy_key = 'migration-015')
group by section on conflict (legacy_key) do nothing;
insert into public.now_entries (title, category, content, published_on, published, legacy_key)
select 'Fokus hidup', 'life', focus, updated_at::date, true, 'focus'
from public.now_meta where id = 1 and trim(focus) <> ''
  and not exists (select 1 from public.now_entries where legacy_key = 'migration-015')
on conflict (legacy_key) do nothing;
-- Private marker makes the migration safe to rerun after users delete imported content.
insert into public.now_entries (title, content, published, legacy_key)
values ('Migration 015', 'Legacy content imported.', false, 'migration-015')
on conflict (legacy_key) do nothing;
notify pgrst, 'reload schema';
commit;
