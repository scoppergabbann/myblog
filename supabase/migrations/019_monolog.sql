-- Monolog voice-journal episodes and their public audio bucket. Run after 018.
begin;

create table if not exists public.monolog_episodes (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null check (char_length(trim(description)) between 1 and 600),
  category text not null check (category in ('menuju-nikah', 'karier', 'olahraga', 'hobi', 'random')),
  audio_url text not null default '' check (
    char_length(audio_url) <= 2000
    and (audio_url = '' or audio_url ~ '^https://' or audio_url ~ '^/audio/monolog/[A-Za-z0-9._-]+\.m4a(?:\?.*)?$')
  ),
  audio_path text check (audio_path is null or audio_path ~ '^[0-9]{4}/[0-9]{2}/[a-f0-9]{32}\.m4a$'),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published')),
  transcript text check (transcript is null or char_length(transcript) <= 100000),
  reflection text check (reflection is null or char_length(reflection) <= 30000),
  tags text[] not null default '{}'::text[] check (coalesce(array_length(tags, 1), 0) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monolog_published_complete check (
    status <> 'published'
    or (audio_url <> '' and duration_seconds > 0 and published_at is not null)
  )
);

create index if not exists monolog_published_timeline_idx
  on public.monolog_episodes (published_at desc, id desc)
  where status = 'published';

alter table public.monolog_episodes enable row level security;
drop policy if exists monolog_read_published on public.monolog_episodes;
create policy monolog_read_published
  on public.monolog_episodes for select
  to anon, authenticated
  using (status = 'published');

grant select on public.monolog_episodes to anon, authenticated;
grant all on public.monolog_episodes to service_role;
grant usage, select on sequence public.monolog_episodes_id_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'monolog-audio',
  'monolog-audio',
  true,
  52428800,
  array['audio/mp4', 'audio/x-m4a', 'audio/m4a']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
commit;
