-- Optional photo documentation for Stream entries. Run after 017.
-- Existing entries receive an empty array; existing RLS policies stay in effect.
begin;
alter table public.now_entries add column if not exists photos jsonb not null default '[]'::jsonb;
alter table public.now_entries drop constraint if exists now_entries_photos_limit;
alter table public.now_entries add constraint now_entries_photos_limit
  check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 3);
notify pgrst, 'reload schema';
commit;
