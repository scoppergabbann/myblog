-- Pinning, admin-only archiving, and a maximum of five active published
-- episodes per category. Run after 019_monolog.sql.
begin;

alter table public.monolog_episodes
  add column if not exists is_pinned boolean not null default false,
  add column if not exists archived_at timestamptz;

create or replace function public.enforce_monolog_library_controls()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  active_in_category integer;
begin
  -- Drafts and archived episodes can never remain pinned.
  if new.status <> 'published' or new.archived_at is not null then
    new.is_pinned := false;
  end if;

  -- The limit applies only to episodes visible in the public library.
  if new.status = 'published' and new.archived_at is null then
    select count(*) into active_in_category
    from public.monolog_episodes
    where category = new.category
      and status = 'published'
      and archived_at is null
      and id <> coalesce(new.id, 0);

    if active_in_category >= 5 then
      raise exception 'MONOLOG_CATEGORY_LIMIT'
        using hint = 'Archive or unpublish an episode in this category before publishing another.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists monolog_library_controls on public.monolog_episodes;
create trigger monolog_library_controls
before insert or update of category, status, archived_at, is_pinned
on public.monolog_episodes
for each row execute function public.enforce_monolog_library_controls();

drop index if exists monolog_published_timeline_idx;
create index monolog_published_timeline_idx
  on public.monolog_episodes (is_pinned desc, published_at desc, id desc)
  where status = 'published' and archived_at is null;

drop policy if exists monolog_read_published on public.monolog_episodes;
create policy monolog_read_published
  on public.monolog_episodes for select
  to anon, authenticated
  using (status = 'published' and archived_at is null);

notify pgrst, 'reload schema';
commit;
