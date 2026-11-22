-- Admin-managed Monolog categories. Run after 020_monolog_library_controls.sql.
begin;

create table if not exists public.monolog_categories (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 50),
  label text not null unique check (char_length(trim(label)) between 1 and 60),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.monolog_categories (slug, label, sort_order)
values
  ('menuju-nikah', 'Menuju Nikah', 10),
  ('karier', 'Karier', 20),
  ('olahraga', 'Olahraga', 30),
  ('hobi', 'Hobi', 40),
  ('random', 'Random', 50)
on conflict (slug) do nothing;

alter table public.monolog_episodes
  drop constraint if exists monolog_episodes_category_check,
  drop constraint if exists monolog_episodes_category_fkey;

alter table public.monolog_episodes
  add constraint monolog_episodes_category_fkey
  foreign key (category)
  references public.monolog_categories(slug)
  on update cascade
  on delete restrict;

create index if not exists monolog_categories_order_idx
  on public.monolog_categories (sort_order, id);
create unique index if not exists monolog_categories_label_unique_idx
  on public.monolog_categories (lower(trim(label)));

alter table public.monolog_categories enable row level security;
drop policy if exists monolog_categories_read_all on public.monolog_categories;
create policy monolog_categories_read_all
  on public.monolog_categories for select
  to anon, authenticated
  using (true);

grant select on public.monolog_categories to anon, authenticated;
grant all on public.monolog_categories to service_role;
grant usage, select on sequence public.monolog_categories_id_seq to service_role;

notify pgrst, 'reload schema';
commit;
