# bbs/ — belutbakarsurabaya

Personal site dengan Next.js, TypeScript, Tailwind v4, Supabase (all-content), NextAuth (GitHub OAuth), MDX runtime rendering. A quiet corner on the internet.

## Status: All 3 sessions complete ✓

**Yang sudah ada di build ini:**
- All public pages render dari Supabase
- Admin auth via GitHub OAuth (single-user allowlist)
- Admin shell + overview dashboard
- **Posts CRUD**: list, create, edit, delete, publish/unpublish, bulk actions, MDX editor with image upload
- **Projects CRUD**: list, create, edit, delete, status toggle, display order, bulk actions
- **Comments moderation**: approve/reject/delete with article slug link
- **Guestbook moderation**: full table with bulk actions
- **Subscribers**: list, confirm/unconfirm, delete, bulk actions, CSV export
- **Now page editor**: focus textarea + CRUD items per section (learning/working/consuming) + reorder up/down
- **Views dashboard**: top 10 articles with bar chart, all articles list, orphan records detection
- **Image upload** to Supabase Storage from post editor
- **Toast notifications** for all admin actions (success/error/info)
- Top nav progress bar on navigation

## Stack

- **Framework**: Next.js 15.5 (App Router, Server Components)
- **Language**: TypeScript strict
- **React**: 18.3
- **Styling**: Tailwind CSS v4 (CSS-first via `@theme`)
- **Database**: Supabase Postgres (all content here, including articles)
- **MDX**: `next-mdx-remote/rsc` (runtime compile from DB string)
- **Auth**: NextAuth v5 / Auth.js dengan GitHub provider
- **Syntax highlighting**: `rehype-pretty-code` + Shiki
- **Theme**: `next-themes` (no FOUC)
- **Hosting**: Vercel (recommended)

## Setup — first time

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase project

Buka https://supabase.com → New Project (Singapore region untuk Indonesia).

Setelah project ready, copy credentials dari **Settings → API**:

```bash
# In .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...  # secret!
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=bbs-images
```

### 3. Run SQL migrations — **urutan penting**

Buka **SQL Editor** di Supabase dashboard. Run dua file secara berurutan:

**File 1**: `supabase/migrations/001_initial.sql`
→ Bikin tables: guestbook, comments, reactions, subscribers, views + RLS

**File 2**: `supabase/migrations/002_content.sql`
→ Bikin tables: posts, projects, now_items, now_meta + RLS + seed 4 sample articles + projects + now data

Verifikasi: **Table Editor** harus menampilkan 9 tables total.

### 4. Setup Supabase Storage (untuk image upload)

Storage bucket harus dibuat manual di dashboard (tidak via SQL):

1. Supabase dashboard → **Storage** → **New bucket**
2. Name: `bbs-images`
3. ✅ Centang **Public bucket** (so images can be embedded in articles)
4. File size limit: 5 MB (recommended)
5. Allowed MIME types: `image/*`
6. Klik **Create bucket**

Bucket ini akan dipakai di Sesi 2 untuk upload gambar dari admin posts editor. Untuk sekarang, biarkan kosong.

### 5. GitHub OAuth App — step-by-step

NextAuth perlu OAuth app dari GitHub:

1. Buka https://github.com/settings/developers
2. Klik **OAuth Apps** → **New OAuth App**
3. Isi form:
   - **Application name**: `bbs admin` (atau apa saja)
   - **Homepage URL**: `http://localhost:3000` (development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Klik **Register application**
5. Di halaman aplikasi:
   - Copy **Client ID** → `AUTH_GITHUB_ID`
   - Klik **Generate a new client secret** → copy → `AUTH_GITHUB_SECRET`

**Untuk production (Vercel)** nanti, kamu perlu OAuth app kedua atau update yang ini:
- **Homepage URL**: `https://belutbakarsurabaya.com`
- **Authorization callback URL**: `https://belutbakarsurabaya.com/api/auth/callback/github`

> Tip: bisa juga keep satu OAuth app dengan callback URL development, lalu di production set ke URL production—pakai 2 set env vars di Vercel (Production vs Development).

### 6. Generate secrets

```bash
# Generate AUTH_SECRET (for JWT signing)
openssl rand -base64 32

# Generate ADMIN_SECRET (for IP-hash salting)
openssl rand -hex 32
```

Paste ke `.env.local`.

### 7. Set admin username

```bash
# In .env.local
ADMIN_GITHUB_USERNAME=your-github-username
```

⚠️ Username ini case-insensitive tapi typo-sensitive. Pastikan exact match dengan GitHub login kamu (`https://github.com/<this-username>`).

Tanpa env ini di-set, semua login attempt akan ditolak (intentional fail-safe).

### 8. Jalankan dev

```bash
npm run dev
```

Buka:
- http://localhost:3000 → public site
- http://localhost:3000/admin → akan redirect ke login
- http://localhost:3000/admin/login → klik **Sign in with GitHub**

Jika username GitHub kamu match `ADMIN_GITHUB_USERNAME`, kamu akan masuk dashboard. Jika tidak, akan ditolak dengan error.

## Folder structure

```
app/
  layout.tsx                # Root layout (public site)
  page.tsx                  # Home (fetches from Supabase)
  globals.css               # Tailwind v4 + design tokens
  error.tsx, global-error.tsx, loading.tsx
  not-found.tsx, manifest.ts, sitemap.ts, robots.ts

  about/page.tsx
  uses/page.tsx
  projects/page.tsx         # Now from Supabase
  now/page.tsx              # Now from Supabase

  writing/
    page.tsx                # List from Supabase
    writing-filter.tsx
    [slug]/
      page.tsx              # Runtime MDX from DB via MDXRemote
      comment-actions.ts
      reaction-actions.ts

  guestbook/
    page.tsx, guestbook-form.tsx, actions.ts

  api/
    auth/[...nextauth]/route.ts  # NextAuth handlers
    og/route.tsx
    subscribe/actions.ts

  rss.xml/route.ts

  admin/
    (auth)/                 # Public auth pages (no protection)
      layout.tsx
      login/
        page.tsx
        login-button.tsx
    (protected)/            # Protected by middleware + layout auth check
      layout.tsx            # Sidebar nav + sign out
      page.tsx              # Overview dashboard
      guestbook/
        page.tsx            # Live moderation
        guestbook-table.tsx
        actions.ts
      posts/, projects/, now/, comments/, subscribers/, views/
                            # Placeholders (Sesi 2-3)

auth.ts                     # NextAuth config (root)
middleware.ts               # Protect /admin/*

components/
  nav.tsx, footer.tsx
  theme-provider.tsx, theme-toggle.tsx
  reading-progress.tsx
  writing-item.tsx, project-card.tsx
  client-code-block.tsx
  mdx-components.tsx, mdx-custom.tsx
  reactions.tsx, view-counter.tsx
  comments-section.tsx, comment-form.tsx
  newsletter-signup.tsx
  admin/
    data-table.tsx          # Reusable spreadsheet-like table
    providers.tsx           # SessionProvider wrapper
    sign-out-button.tsx
    coming-soon.tsx

content/
  _archive/                 # Old MDX/TS files (kept for git history reference)
                            # NOT USED at runtime — all content in Supabase

lib/
  posts.ts                  # Article queries (replaces lib/mdx.ts)
  content-queries.ts        # Projects + Now queries
  queries.ts                # Guestbook/comments/reactions/views queries
  site-config.ts
  utils.ts
  ip-hash.ts, rate-limit.ts
  supabase/
    browser.ts, server.ts, admin.ts

types/
  content.ts
  next-auth.d.ts            # Session type augmentation

supabase/
  migrations/
    001_initial.sql         # guestbook, comments, reactions, subscribers, views
    002_content.sql         # posts, projects, now_items, now_meta + seed
```

## Cara publish artikel sekarang

**Tidak lagi via git push** — semua konten di Supabase.

**Via admin panel** (Sesi 2):

1. Buka `/admin/posts` → klik **New post**
2. Isi:
   - **title**: judul artikel
   - **slug**: URL-friendly identifier (e.g., `belajar-pelan-pelan`) — auto-validated lowercase + dash only
   - **summary**: preview text untuk list dan OG image
   - **content**: MDX. Markdown standar + komponen kustom `<Figure>`, `<Callout kind="note|tip|warning">`
   - **tags**: comma-separated (e.g., `engineering, reflection`)
   - **status**: `draft` (hidden), `published` (live), `archived` (hidden)
   - **published at**: optional, auto-set saat publish
3. **Upload image** dari editor — klik "upload image", select file, URL otomatis di-append sebagai markdown `![](url)` di content
4. **Save**. Jika published, artikel muncul di `/writing` dalam ≤60 detik (ISR revalidate path triggered otomatis)

**Bulk actions** di `/admin/posts`:
- Select multiple → publish/draft/archive/delete sekaligus
- Filter cepat by title/slug/tag

**Image upload constraints**:
- Max 5 MB per file
- Allowed: PNG, JPEG, WebP, GIF, SVG
- Disimpan di Supabase Storage bucket `bbs-images/<YYYYMM>/<random>.<ext>`
- Public URL via Supabase CDN, optimisasi via `next/image`

## Auth model

- **Single-user allowlist**: hanya GitHub username di `ADMIN_GITHUB_USERNAME` yang bisa akses `/admin/*`
- **Session strategy**: JWT (no DB for session storage)
- **Middleware protection**: edge-level redirect untuk semua `/admin/*` kecuali `/admin/login`
- **Layout-level second check**: `(protected)/layout.tsx` redirect lagi jika somehow lolos middleware
- **Server actions check**: `requireAdmin()` di setiap admin action untuk defense in depth

Kalau OAuth callback gagal verify username, user akan dikembalikan ke `/admin/login?error=AccessDenied`.

## Vercel deployment

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin git@github.com:you/bbs-site.git
git push -u origin main
```

### 2. Import ke Vercel

vercel.com → Import → pilih repo. Framework auto-detected as Next.js.

### 3. Environment variables

Pre-deploy, di Project Settings → Environment Variables, paste semua yang ada di `.env.local`, **kecuali**:
- `NEXT_PUBLIC_SITE_URL` → set ke `https://belutbakarsurabaya.com` (URL production kamu)
- `AUTH_URL` → optional, but recommended: `https://belutbakarsurabaya.com`

Pastikan **Production**, **Preview**, dan **Development** semua ter-set (atau minimal Production).

### 4. Update GitHub OAuth callback

Setelah deploy:
- Buka GitHub → Settings → Developer settings → OAuth Apps → your app
- Update **Authorization callback URL** ke `https://your-vercel-url.vercel.app/api/auth/callback/github`
- Atau setelah custom domain attached: `https://belutbakarsurabaya.com/api/auth/callback/github`

### 5. Build settings

Vercel auto-detected. Pastikan **Output Directory** kosong / `.next` (jangan `dist`).

## Common pitfalls

**Halaman `/writing` kosong setelah migrasi** — pastikan `002_content.sql` sudah dijalankan dan `status='published'` di seed data. Cek `posts` table langsung.

**"Unauthorized" saat sign in** — `ADMIN_GITHUB_USERNAME` tidak ter-set atau typo. Cek logs server untuk warning `[auth] ADMIN_GITHUB_USERNAME not set`.

**"Configuration" error di NextAuth** — `AUTH_SECRET` belum di-generate atau kosong.

**OAuth callback 404** — Authorization callback URL di GitHub OAuth app tidak match `<your-url>/api/auth/callback/github`.

**Middleware infinite redirect** — pastikan `(auth)/login` ada di route group `(auth)`, bukan `(protected)`. Middleware sudah exclude `/admin/login` secara eksplisit.

**ISR tidak refresh setelah edit data di Supabase** — page revalidate setiap 60 detik. Tunggu, atau di Vercel dashboard klik **Purge cache**. Sesi 2 akan tambah `revalidatePath()` otomatis dari admin actions.

## Features

### Public site
- ✓ All pages render dari Supabase (posts, projects, now)
- ✓ Runtime MDX rendering (admin edit → langsung live dalam ≤60s)
- ✓ Reading progress, TOC sticky, copy code button
- ✓ Dark mode (no FOUC)
- ✓ Dynamic OG images + default fallback
- ✓ RSS, sitemap, robots, manifest
- ✓ Custom MDX components: `<Figure>`, `<Callout>`
- ✓ Guestbook + comments + reactions + newsletter (Supabase-backed)
- ✓ View counter atomic per article

### Admin (complete)
- ✓ GitHub OAuth via NextAuth v5
- ✓ Single-user allowlist enforcement
- ✓ Middleware + layout + action 3-layer protection
- ✓ Overview dashboard with stats cards
- ✓ Top progress bar on navigation (no jarring "loading..." text)
- ✓ Reusable DataTable (filter, bulk actions, optimistic UI)
- ✓ Toast notification system (success/error/info)
- ✓ Posts CRUD with MDX editor + image upload to Supabase Storage
- ✓ Projects CRUD with display order
- ✓ Comments moderation (with article link)
- ✓ Guestbook moderation
- ✓ Subscribers manage + CSV export + manual confirm
- ✓ Now page editor (focus + items with reorder)
- ✓ Views statistics dashboard with bar chart + orphan detection

### Beyond v1 (optional future)
- [ ] Confirmation email for newsletter (Resend integration)
- [ ] Related posts at article footer
- [ ] Prev/next article navigation
- [ ] Command palette (cmd+k)
- [ ] Webmentions
- [ ] Comment threading
- [ ] Spotify now-playing on /now

## License

MIT — fork dan adapt untuk site personal kamu.
