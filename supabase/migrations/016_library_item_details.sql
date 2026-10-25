begin;
alter table public.library_categories add column if not exists item_type text;
alter table public.library_items add column if not exists item_type text;
alter table public.library_items add column if not exists details jsonb not null default '{}'::jsonb;
-- Existing content stays intact; do not guess authors or model names from subtitles.
update public.library_categories set item_type = case
  when lower(name) ~ '(buku|book|bacaan)' then 'book'
  when lower(name) ~ '(motor|motorcycle)' then 'motorcycle'
  when lower(name) ~ '(mobil|car)' then 'car'
  when lower(name) ~ '(catatan|note)' then 'note'
  when lower(name) ~ '(minuman|drink|kopi|coffee|teh)' then 'drink'
  else 'general' end where item_type is null;
-- Keep legacy item types null until an editor explicitly saves the structured details.
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.library_categories'::regclass and conname = 'library_categories_item_type_check') then
    alter table public.library_categories add constraint library_categories_item_type_check check (item_type in ('book','car','motorcycle','note','drink','general'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.library_items'::regclass and conname = 'library_items_item_type_check') then
    alter table public.library_items add constraint library_items_item_type_check check (item_type in ('book','car','motorcycle','note','drink','general'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.library_items'::regclass and conname = 'library_items_details_check') then
    alter table public.library_items add constraint library_items_details_check check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 20000);
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
