-- Run after 015_now_stream.sql and 016_library_item_details.sql.
-- New library items and their Stream entry are created in one transaction.
begin;
alter table public.now_entries add column if not exists source_library_item_id bigint
  references public.library_items(id) on delete cascade;
create unique index if not exists now_entries_library_source_idx
  on public.now_entries(source_library_item_id) where source_library_item_id is not null;

-- A source category that is hidden later must not leak through Stream or RSS.
drop policy if exists now_entries_read_published on public.now_entries;
create policy now_entries_read_published on public.now_entries for select to anon, authenticated
using (
  published = true and (
    source_library_item_id is null or exists (
      select 1 from public.library_items i
      join public.library_categories c on c.id = i.category_id
      where i.id = now_entries.source_library_item_id and c.is_hidden = false
    )
  )
);

create or replace function public.create_library_item_with_stream(p_item jsonb, p_site_url text)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved public.library_items%rowtype;
  category_hidden boolean;
  kind_label text;
  item_link text;
begin
  if p_site_url !~ '^https?://[^/[:space:]]+$' then
    raise exception 'Invalid site origin';
  end if;
  insert into public.library_items (
    category_id, item_type, details, name, subtitle, description, badge,
    reels_url, link_url, display_order
  ) values (
    (p_item->>'category_id')::bigint,
    p_item->>'item_type', coalesce(p_item->'details', '{}'::jsonb),
    p_item->>'name', p_item->>'subtitle', p_item->>'description',
    p_item->>'badge', p_item->>'reels_url', p_item->>'link_url',
    coalesce((p_item->>'display_order')::integer, 0)
  ) returning * into saved;

  select c.is_hidden into strict category_hidden from public.library_categories c where c.id = saved.category_id;
  kind_label := case saved.item_type
    when 'book' then 'buku' when 'car' then 'mobil' when 'motorcycle' then 'motor'
    when 'note' then 'catatan' when 'drink' then 'minuman' else 'item' end;
  item_link := '/library#item-' || saved.id::text;

  insert into public.now_entries (
    title, category, project, project_url, content, published_on, published, source_library_item_id
  ) values (
    left('Menambahkan ' || kind_label || ': ' || saved.name, 160),
    'life', 'Library', p_site_url || item_link,
    'Baru menambahkan ' || kind_label || ' ke koleksi library.' || E'\n\n' ||
      '[Lihat detail di library](' || item_link || ').',
    (now() at time zone 'Asia/Jakarta')::date,
    not category_hidden, saved.id
  );
  return saved.id;
end;
$$;
-- Only authenticated admin server code with the service key may invoke this write.
revoke all on function public.create_library_item_with_stream(jsonb, text) from public, anon, authenticated;
grant execute on function public.create_library_item_with_stream(jsonb, text) to service_role;
notify pgrst, 'reload schema';
commit;
