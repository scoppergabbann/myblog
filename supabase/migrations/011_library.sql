-- =============================================================================
-- bbs/ — Library page: books, drinks, cars, motorcycles
-- =============================================================================
-- Run AFTER 010_cloudinary.sql
-- =============================================================================

-- Books
create table if not exists public.library_books (
  id             bigint generated always as identity primary key,
  title          text not null,
  author         text not null default '',
  cover_url      text default null,
  year_read      int  default null,
  description    text default null,
  status         text not null default 'finished'
                 check (status in ('reading', 'finished', 'wishlist')),
  link_url       text default null,
  display_order  int  not null default 0,
  created_at     timestamptz not null default now()
);

-- Drinks
create table if not exists public.library_drinks (
  id             bigint generated always as identity primary key,
  name           text not null,
  brand          text default null,
  photo_url      text default null,
  description    text default null,
  category       text not null default 'lainnya'
                 check (category in ('kopi', 'teh', 'susu', 'jus', 'lainnya')),
  reels_url      text default null,
  display_order  int  not null default 0,
  created_at     timestamptz not null default now()
);

-- Cars (classic/old cars)
create table if not exists public.library_cars (
  id             bigint generated always as identity primary key,
  name           text not null,
  model          text default null,
  year           int  default null,
  photo_url      text default null,
  description    text default null,
  status         text not null default 'wishlist'
                 check (status in ('wishlist', 'pernah_nyetir', 'pernah_punya', 'impian')),
  reels_url      text default null,
  display_order  int  not null default 0,
  created_at     timestamptz not null default now()
);

-- Motorcycles
create table if not exists public.library_motorcycles (
  id             bigint generated always as identity primary key,
  name           text not null,
  model          text default null,
  year           int  default null,
  photo_url      text default null,
  description    text default null,
  status         text not null default 'wishlist'
                 check (status in ('wishlist', 'pernah_naik', 'pernah_punya', 'impian')),
  reels_url      text default null,
  display_order  int  not null default 0,
  created_at     timestamptz not null default now()
);

-- =============================================================================
-- RLS: public read, admin (service_role) write
-- =============================================================================

alter table public.library_books enable row level security;
alter table public.library_drinks enable row level security;
alter table public.library_cars enable row level security;
alter table public.library_motorcycles enable row level security;

-- Public read policies
create policy "library_books: public read"
  on public.library_books for select using (true);

create policy "library_drinks: public read"
  on public.library_drinks for select using (true);

create policy "library_cars: public read"
  on public.library_cars for select using (true);

create policy "library_motorcycles: public read"
  on public.library_motorcycles for select using (true);

-- service_role bypasses RLS → admin server actions can write freely
