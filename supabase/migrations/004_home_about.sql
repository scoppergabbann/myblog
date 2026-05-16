-- =============================================================================
-- bbs/ — Sesi 4 schema: home_meta + about_meta + supporting tables
-- =============================================================================
-- Run AFTER 003_now_spotify.sql
-- =============================================================================


-- =============================================================================
-- HOME META (singleton)
-- =============================================================================

create table if not exists public.home_meta (
  id            int primary key default 1 check (id = 1),

  -- Hero
  mono_label    text not null default '~/halo',
  hero_intro    text not null default 'Sudut sepi di internet untuk',
  hero_accent_1 text not null default 'menulis',
  hero_accent_2 text not null default 'membangun',
  hero_accent_3 text not null default 'memikirkan ulang',
  hero_outro    text not null default '.',
  lead          text not null default 'Saya seorang software engineer yang juga menulis dan berinvestasi pelan-pelan. Tempat ini adalah catatan kepala saya—proyek yang sedang dibangun, tulisan yang sedang dimasak, dan refleksi yang belum selesai.',

  -- Meta row
  location      text not null default 'Surabaya, Indonesia',
  timezone      text not null default 'UTC+7',
  est_year      text not null default 'est. 2026',

  -- Focus card
  focus_title   text not null default 'Membangun tatap, aplikasi journaling untuk iOS',
  focus_body    text not null default 'Membaca ulang Designing Data-Intensive Applications. Belajar bahasa Jepang menuju N3. Mengurangi screen time di malam hari dan kembali ke buku fisik.',

  updated_at    timestamptz not null default now()
);

-- Seed singleton
insert into public.home_meta (id) values (1)
on conflict (id) do nothing;


-- =============================================================================
-- HOME QUICK LINKS
-- =============================================================================

create table if not exists public.home_quick_links (
  id            bigint generated always as identity primary key,
  label         text not null check (char_length(label) between 1 and 60),
  href          text not null check (char_length(href) between 1 and 200),
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists home_quick_links_order_idx
  on public.home_quick_links (display_order desc);

-- Seed default quick links (only if table empty)
insert into public.home_quick_links (label, href, display_order)
select * from (values
  ('tentang saya', '/about', 100),
  ('tools yang saya pakai', '/uses', 90),
  ('apa yang sedang saya kerjakan', '/now', 80),
  ('tinggalkan pesan', '/guestbook', 70),
  ('rss feed', '/rss.xml', 60)
) as v(label, href, display_order)
where not exists (select 1 from public.home_quick_links limit 1);


-- =============================================================================
-- ABOUT META (singleton)
-- =============================================================================

create table if not exists public.about_meta (
  id            int primary key default 1 check (id = 1),

  title         text not null default 'Tentang',
  subtitle      text not null default 'Software engineer, writer, dan investor pelan-pelan dari Surabaya.',

  -- MDX content (the body of /about, between subtitle and stack section)
  content       text not null default '',

  -- Contact line
  contact_email text not null default 'halo@belutbakarsurabaya.com',
  contact_intro text not null default 'Saya merespon email pelan-pelan, tapi saya merespon semua:',

  updated_at    timestamptz not null default now()
);

-- Seed singleton with starter MDX content
insert into public.about_meta (id, content) values (
  1,
  $$## // cerita

Saya mulai menulis kode pertama kali di SMA, sebuah script PHP yang membaca file teks dan menampilkannya sebagai blog. Lima belas tahun kemudian, saya masih mencoba membangun hal yang sama—website pribadi yang sederhana, tapi terasa seperti rumah.

Hari ini, saya bekerja sebagai senior engineer di sebuah startup fintech, fokus pada infrastruktur pembayaran yang melayani jutaan transaksi setiap bulan. Di luar pekerjaan, saya menulis, membaca, dan sesekali berinvestasi pada perusahaan yang saya percaya.

## // filosofi

Saya percaya pada pekerjaan yang dilakukan dengan sabar. Pada proyek yang dibangun dalam waktu lama. Pada tulisan yang ditulis bukan untuk algoritma, tapi untuk satu pembaca yang kebetulan singgah di tempat ini.

Internet seharusnya tetap menjadi tempat yang aneh dan personal. Bukan lobby hotel.

## // perjalanan belajar

Saya belajar dengan urutan yang tidak teratur. Mulai dari PHP, lompat ke Python, jatuh cinta dengan JavaScript, lalu kembali ke fundamental—algoritma, sistem terdistribusi, basis data. Beberapa tahun terakhir saya juga belajar Rust dan Swift, bukan karena mereka populer, tapi karena saya penasaran.

Yang saya pelajari setelah bertahun-tahun: kecepatan menguasai teknologi tidak sepenting kedalaman pemahaman. Lebih baik tahu satu hal dengan dalam daripada banyak hal dengan dangkal.$$
) on conflict (id) do nothing;


-- =============================================================================
-- ABOUT STACK (the grid items)
-- =============================================================================

create table if not exists public.about_stack (
  id            bigint generated always as identity primary key,
  label         text not null check (char_length(label) between 1 and 40),
  value         text not null check (char_length(value) between 1 and 200),
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists about_stack_order_idx
  on public.about_stack (display_order desc);

-- Seed default stack
insert into public.about_stack (label, value, display_order)
select * from (values
  ('bahasa', 'TypeScript, Rust, Swift', 100),
  ('frontend', 'Next.js, React', 90),
  ('backend', 'Node, Go, Postgres', 80),
  ('infra', 'Docker, Hetzner', 70),
  ('editor', 'Neovim, Zed', 60),
  ('notes', 'Obsidian + git', 50)
) as v(label, value, display_order)
where not exists (select 1 from public.about_stack limit 1);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.home_meta        enable row level security;
alter table public.home_quick_links enable row level security;
alter table public.about_meta       enable row level security;
alter table public.about_stack      enable row level security;

drop policy if exists "home_meta_read_all" on public.home_meta;
create policy "home_meta_read_all"
  on public.home_meta for select
  to anon, authenticated
  using (true);

drop policy if exists "home_quick_links_read_all" on public.home_quick_links;
create policy "home_quick_links_read_all"
  on public.home_quick_links for select
  to anon, authenticated
  using (true);

drop policy if exists "about_meta_read_all" on public.about_meta;
create policy "about_meta_read_all"
  on public.about_meta for select
  to anon, authenticated
  using (true);

drop policy if exists "about_stack_read_all" on public.about_stack;
create policy "about_stack_read_all"
  on public.about_stack for select
  to anon, authenticated
  using (true);


-- =============================================================================
-- TRIGGERS for updated_at
-- =============================================================================

drop trigger if exists home_meta_updated_at on public.home_meta;
create trigger home_meta_updated_at
  before update on public.home_meta
  for each row execute function public.set_updated_at();

drop trigger if exists about_meta_updated_at on public.about_meta;
create trigger about_meta_updated_at
  before update on public.about_meta
  for each row execute function public.set_updated_at();
