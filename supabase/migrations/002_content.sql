-- =============================================================================
-- bbs/ — Sesi 1 schema: posts, projects, now_items + storage
-- =============================================================================
-- Run AFTER 001_initial.sql
-- =============================================================================


-- =============================================================================
-- POSTS (replaces MDX files)
-- =============================================================================

create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title         text not null check (char_length(title) between 1 and 200),
  summary       text not null check (char_length(summary) between 1 and 400),
  content       text not null,  -- MDX source
  tags          text[] not null default '{}',
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc nulls last);

create index if not exists posts_tags_idx on public.posts using gin (tags);

-- Auto-update updated_at on changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();


-- =============================================================================
-- PROJECTS
-- =============================================================================

create table if not exists public.projects (
  id           bigint generated always as identity primary key,
  title        text not null check (char_length(title) between 1 and 100),
  description  text not null check (char_length(description) between 1 and 500),
  stack        text[] not null default '{}',
  status       text not null default 'wip' check (status in ('live', 'wip', 'archived')),
  url          text,
  github_url   text,
  display_order int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists projects_order_idx on public.projects (display_order desc, created_at desc);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();


-- =============================================================================
-- NOW PAGE
-- =============================================================================

create table if not exists public.now_items (
  id            bigint generated always as identity primary key,
  section       text not null check (section in ('learning', 'working', 'consuming')),
  role          text not null check (char_length(role) between 1 and 50),
  content       text not null check (char_length(content) between 1 and 500),
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists now_items_section_idx
  on public.now_items (section, display_order);

create table if not exists public.now_meta (
  id            int primary key default 1 check (id = 1),  -- singleton
  focus         text not null default '',
  updated_at    timestamptz not null default now()
);

-- Seed singleton row
insert into public.now_meta (id, focus) values (1, '')
on conflict (id) do nothing;


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.posts     enable row level security;
alter table public.projects  enable row level security;
alter table public.now_items enable row level security;
alter table public.now_meta  enable row level security;

-- POSTS: anyone reads published, writes via service_role only
drop policy if exists "posts_read_published" on public.posts;
create policy "posts_read_published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

-- PROJECTS: anyone reads all (no draft state for projects), writes via service_role
drop policy if exists "projects_read_all" on public.projects;
create policy "projects_read_all"
  on public.projects for select
  to anon, authenticated
  using (true);

-- NOW: anyone reads, writes via service_role
drop policy if exists "now_items_read_all" on public.now_items;
create policy "now_items_read_all"
  on public.now_items for select
  to anon, authenticated
  using (true);

drop policy if exists "now_meta_read_all" on public.now_meta;
create policy "now_meta_read_all"
  on public.now_meta for select
  to anon, authenticated
  using (true);


-- =============================================================================
-- STORAGE: image bucket for blog content
-- =============================================================================
-- This must be run AFTER you create the bucket in the dashboard
-- (Supabase Storage → New bucket → name: bbs-images, public: true).
--
-- The bucket itself can't be created via SQL on free tier.
-- See README "Supabase Storage setup" section.

-- Storage RLS: anyone can read, only service_role can write (via admin panel).
-- Supabase enforces this if you check "Public bucket" in dashboard.


-- =============================================================================
-- SEED: convert existing MDX-style content
-- =============================================================================
-- Replace the content body below with your actual MDX after running migration.

insert into public.posts (slug, title, summary, content, tags, status, published_at)
values
(
  'menulis-untuk-diri-sendiri',
  'Menulis untuk diri sendiri, bukan untuk algoritma',
  'Tentang kenapa saya kembali ke blog personal dan meninggalkan platform yang mengukur kita lewat metrik.',
  $$Saya pernah menghabiskan dua tahun menulis di platform yang menghitung view, like, dan jumlah follower. Setiap kali saya membuka editor, ada bagian otak saya yang sudah mulai menghitung: judul apa yang akan dapat klik, paragraf pertama yang menahan pembaca tiga detik pertama, panjang artikel yang sesuai dengan algoritma.

Tulisan-tulisan saya jadi lebih efisien. Tapi juga lebih kosong.

## Kembali ke rumah

Internet personal—yang saya tumbuh besar bersamanya di awal 2010-an—dulu terasa seperti rumah. Setiap blog punya font berbeda, layout aneh, sidebar penuh widget yang tidak ada gunanya. Tapi semuanya terasa _hidup_. Seperti masuk ke kamar seseorang.

Sekarang semua website terasa seperti lobby hotel. Bersih, profesional, dan tidak bisa diingat.

## Kenapa personal site lagi?

Karena saya butuh tempat menulis yang tidak diukur. Tempat di mana paragraf yang aneh, kalimat yang setengah jadi, dan ide yang belum matang punya tempat untuk hidup tanpa harus terlebih dahulu pantas dibaca 10.000 orang.

> The web should be a place where you can be weird without being punished for it.

Jadi inilah saya, kembali menulis di sudut sepi internet. Tidak banyak yang akan baca. Itu bukan masalah. Yang penting saya menulis lagi—untuk saya, dan mungkin untuk satu-dua orang yang kebetulan singgah.

## Penutup

Kalau kamu pernah merasa hal yang sama, mungkin sekarang waktunya kembali punya rumah sendiri di internet. Tidak perlu mewah. Sebuah domain, sedikit HTML, dan kesabaran untuk menulis tanpa hadiah.$$,
  array['writing','internet'],
  'published',
  '2026-04-22'::timestamptz
),
(
  'belajar-pelan-pelan',
  'Belajar pelan-pelan: melawan FOMO teknis',
  'Setiap minggu ada framework baru. Tapi mungkin yang perlu kita pelajari justru kesabaran.',
  $$Saya pernah menjadi engineer yang gelisah. Setiap kali ada framework baru di Hacker News, saya merasa harus segera mempelajarinya. Kalau tidak, saya akan tertinggal.

Tiga tahun saya hidup seperti itu. Hasilnya: saya tahu sedikit tentang banyak hal, tapi tidak benar-benar menguasai apapun.

## Pelajaran dari engineer yang lebih senior

Salah satu mentor saya pernah berkata: `tools change, fundamentals don't`. Saya sempat menganggapnya klise. Tapi setelah bertahun-tahun, baru saya mengerti—dia tidak bilang framework tidak penting. Dia bilang ada urutan dalam belajar.

- Pahami masalah dulu, baru tools.
- Kuasai satu bahasa dalam-dalam sebelum melompat.
- Baca kode lama yang sudah teruji, bukan hanya hype mingguan.

## Sebuah contoh sederhana

```typescript
// kode yang ditulis terburu-buru
const users = await Promise.all(
  ids.map((id) => fetchUser(id))
);

// kode yang ditulis dengan kesabaran
const users = await pMap(ids, fetchUser, { concurrency: 5 });
```

Perbedaannya kecil. Tapi yang pertama bisa membunuh server saat `ids` berisi 10.000 entry. Yang kedua adalah hasil dari engineer yang pernah merasakan production di jam 3 pagi.

## Pelan-pelan tapi konsisten

Saya sekarang belajar lebih lambat. Membaca dokumentasi sampai habis. Mengerjakan proyek kecil sampai benar-benar paham. Tidak setiap minggu ada hal baru yang saya kuasai—tapi yang saya kuasai, saya pegang dengan dalam.

Itu sudah cukup.$$,
  array['engineering','philosophy'],
  'published',
  '2026-03-15'::timestamptz
),
(
  'investasi-bukan-trading',
  'Investasi bukan trading: catatan untuk diri 5 tahun lalu',
  'Setelah tiga tahun mencoba menjadi trader aktif, saya akhirnya mengerti kenapa kebanyakan trader rugi.',
  $$Surat untuk saya yang lima tahun lalu—yang baru saja membaca buku trading pertama dan merasa sudah menemukan jalan pintas.

## Kabar dari masa depan

Pertama: kamu akan kalah cukup banyak uang. Bukan karena bodoh, tapi karena terlalu yakin. Tidak apa-apa. Itu uang sekolah.

Kedua: yang menghasilkan uang bukan kepintaran, tapi kesabaran. Setelah tiga tahun mencoba berbagai strategi, kamu akan menyadari bahwa portofolio paling stabil adalah yang paling membosankan.

## Tiga prinsip yang akan menyelamatkanmu

- **Time in the market beats timing the market.** Klise, tapi benar.
- **Kalau kamu tidak mengerti bisnisnya, jangan beli sahamnya.**
- **Compound interest hanya bekerja untuk yang sabar.**

## Hidup di luar pasar

Yang paling penting: jangan biarkan grafik mengontrol hidupmu. Cek portofolio sekali sebulan, tidak lebih. Sisanya, fokus pada karir, hubungan, dan kesehatan. Itu yang lebih berdampak dalam jangka panjang.

Aku tahu kamu tidak akan langsung mendengarkan. Tapi simpan surat ini.$$,
  array['investing','reflection'],
  'published',
  '2026-02-08'::timestamptz
),
(
  'rumah-internet',
  'Membangun rumah di internet, satu file sekali',
  'Tentang proses membangun belutbakarsurabaya.com dan kenapa saya memilih nama yang aneh.',
  $$Kenapa belutbakarsurabaya? Pertanyaan yang paling sering saya dapat sejak meluncurkan site ini.

Jawaban singkat: karena tidak ada orang yang menyangka nama itu untuk website seorang engineer. Dan itu bagian dari intinya.

## Nama dan identitas

Internet awal penuh dengan nama domain yang aneh: `cool-stuff.xyz`, `monkeyman.net`, `perl.com`. Nama-nama itu personal, terkadang konyol, dan justru karena itu memorable.

Saya tumbuh besar di Surabaya. Belut bakar adalah makanan yang saya rindukan. Itu cukup alasan untuk sebuah nama domain.

## Prosesnya

Site ini dibangun dengan Next.js, TypeScript, dan TailwindCSS. Konten dalam MDX. Tidak ada database—semuanya file di repo. Setiap kali saya menulis sesuatu, saya `git commit && git push`.

Sederhana, portable, dan akan tetap bekerja 10 tahun dari sekarang.$$,
  array['meta','writing'],
  'published',
  '2026-01-12'::timestamptz
)
on conflict (slug) do nothing;


-- Seed projects
insert into public.projects (title, description, stack, status, url, github_url, display_order)
values
('kawanbaca', 'Platform diskusi buku untuk pembaca Indonesia. Membaca tidak harus sendirian.', array['Next.js','Postgres','tRPC'], 'live', 'https://kawanbaca.example', 'https://github.com/example/kawanbaca', 100),
('notebook-cli', 'Tool CLI untuk menulis daily notes dengan format markdown dan auto-sync ke git.', array['Rust','CLI'], 'live', null, 'https://github.com/example/notebook-cli', 90),
('tatap', 'Aplikasi reflektif harian dengan prompt yang berubah setiap minggu. Untuk yang suka journaling tapi malas.', array['Swift','iOS'], 'wip', null, null, 80),
('investasi-101', 'Kumpulan tulisan tentang investasi value untuk pemula Indonesia. Tidak ada teknik trading.', array['MDX','static'], 'live', '#', null, 70)
on conflict do nothing;


-- Seed now items
insert into public.now_items (section, role, content, display_order) values
('learning', 'reading', 'The Pragmatic Programmer (20th anniversary edition)—setelah 5 tahun pertama kali baca, banyak yang baru saya pahami.', 100),
('learning', 'course', 'Mengerjakan ulang database internals sambil membaca buku Designing Data-Intensive Applications.', 90),
('learning', 'language', 'Belajar bahasa Jepang lewat Anki, sudah masuk N4. Lambat tapi konsisten.', 80),
('working', 'work', 'Senior engineer di sebuah startup fintech, fokus pada infrastruktur pembayaran.', 100),
('working', 'side', 'Menulis konsisten satu artikel per minggu di sini.', 90),
('working', 'project', 'Membangun ulang tatap—aplikasi journaling minimalis untuk iOS.', 80),
('consuming', 'book', '"Tomorrow, and Tomorrow, and Tomorrow" — Gabrielle Zevin', 100),
('consuming', 'music', 'Album baru Nujabes (anumerta), playlist Tycho untuk fokus.', 90),
('consuming', 'game', 'Outer Wilds—main pelan-pelan, suka diam dan memikirkan misterinya.', 80),
('consuming', 'film', 'Perfect Days karya Wim Wenders. Film tentang menerima rutinitas.', 70);

update public.now_meta
set focus = 'Kesehatan tidur dan menulis tanpa tekanan. Mengurangi screen time di malam hari, berjalan pagi minimal 3x seminggu, dan kembali ke kebiasaan membaca fisik sebelum tidur.'
where id = 1;


-- =============================================================================
-- DONE
-- =============================================================================
