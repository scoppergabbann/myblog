-- =============================================================================
-- bbs/ - hide library categories from public view
-- =============================================================================
-- Run AFTER 012_premium_posts.sql
-- =============================================================================

alter table public.library_categories
  add column if not exists is_hidden boolean not null default false;

-- Public visitors may only read visible categories.
drop policy if exists "library_categories: public read" on public.library_categories;
create policy "library_categories: public read"
  on public.library_categories for select
  to anon, authenticated
  using (is_hidden = false);

-- Public visitors may only read items whose category is visible.
drop policy if exists "library_items: public read" on public.library_items;
create policy "library_items: public read"
  on public.library_items for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.library_categories c
      where c.id = library_items.category_id
        and c.is_hidden = false
    )
  );

-- Public visitors may only read photos attached to items in visible categories.
drop policy if exists "library_photos: public read" on public.library_photos;
create policy "library_photos: public read"
  on public.library_photos for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.library_items i
      join public.library_categories c on c.id = i.category_id
      where i.id = library_photos.new_item_id
        and c.is_hidden = false
    )
  );
