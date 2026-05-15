# bbs/ — belutbakarsurabaya

Personal site built with Next.js, TypeScript, Tailwind v4, MDX, and Supabase. A quiet corner on the internet.

## Stack

- **Framework**: Next.js 15.5 (App Router, Server Components)
- **Language**: TypeScript strict
- **React**: 18.3
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme`)
- **Content**: MDX via `@next/mdx` (file-based, git-versioned)
- **Database**: Supabase (Postgres) for guestbook, comments, reactions, views, newsletter
- **Syntax highlighting**: `rehype-pretty-code` + Shiki (server-rendered)
- **Fonts**: Inter + JetBrains Mono via `next/font`
- **Theme**: `next-themes` (no FOUC)
- **Hosting**: Vercel (recommended)

## Quick start

```bash
# 1. Copy env template
cp .env.example .env.local

# 2. Fill in Supabase credentials (see "Supabase setup" below)
# Edit .env.local

# 3. Install + run
npm install
npm run dev
```

Open http://localhost:3000.

> First install fetches Tailwind v4 and Google Fonts. Make sure outbound internet is allowed.

## Supabase setup

### 1. Create project

Go to https://supabase.com → New Project. Choose a region close to you (Singapore for Indonesia).

### 2. Run migrations

Open SQL Editor → New query → paste contents of `supabase/migrations/001_initial.sql` → Run.

Verify tables exist: Table Editor → should see `guestbook`, `comments`, `reactions`, `subscribers`, `views`.

### 3. Get credentials

Settings → API → copy:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ never expose

### 4. Generate admin secret

```bash
openssl rand -hex 32
```

Use the output as `ADMIN_SECRET`. Used for IP hash salt + future admin auth.

### Row Level Security

All tables have RLS enabled. Anon role can only:
- READ approved guestbook + comments
- READ all reactions + views

All WRITE operations go through server actions using `service_role` key (bypasses RLS), with built-in:
- Honeypot field (catches bots)
- IP-hash rate limiting (3 guestbook / hour, 5 comments / hour, etc.)
- Input validation (length, format)
- Privacy: only SHA-256 of IP is stored, never raw IP

## Vercel deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin git@github.com:you/bbs-site.git
git push -u origin main
```

### 2. Import to Vercel

https://vercel.com → New Project → Import your repo. Framework auto-detected.

### 3. Add environment variables

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ADMIN_SECRET
```

Set all to **Production**, **Preview**, and **Development** (or just the ones you need).

### 4. Add custom domain

Project Settings → Domains → Add `belutbakarsurabaya.com` (and `www.` redirect if you like). Vercel handles SSL automatically.

### 5. Update siteConfig

After your real domain is live, edit `lib/site-config.ts`:

```ts
url: 'https://belutbakarsurabaya.com',
```

Commit + push. Vercel auto-deploys.

## Folder structure

```
app/
  layout.tsx                # Root layout + fonts + theme + metadata
  page.tsx                  # Home
  error.tsx                 # Error boundary (per-page)
  global-error.tsx          # Root error (catastrophic)
  loading.tsx               # Loading state
  not-found.tsx             # 404
  manifest.ts               # PWA manifest
  sitemap.ts                # Auto sitemap
  robots.ts
  globals.css               # Tailwind v4 + design tokens
  api/
    og/route.tsx            # Dynamic OG image
    subscribe/actions.ts    # Newsletter subscribe action
  rss.xml/route.ts          # RSS feed
  writing/
    page.tsx                # List + search + filter
    writing-filter.tsx      # Client filter component
    [slug]/
      page.tsx              # Article (MDX + reactions + comments + newsletter)
      comment-actions.ts    # Comment server action
      reaction-actions.ts   # Toggle reaction + increment view
  guestbook/
    page.tsx                # Server: fetch from Supabase
    guestbook-form.tsx      # Client form (useActionState)
    actions.ts              # Server action: insert entry
  about/page.tsx
  projects/page.tsx
  now/page.tsx
  uses/page.tsx

components/
  nav.tsx
  footer.tsx
  theme-provider.tsx
  theme-toggle.tsx
  reading-progress.tsx
  writing-item.tsx
  project-card.tsx
  client-code-block.tsx     # Pre+copy button wrapper for code blocks
  mdx-components.tsx        # MDX renderer overrides
  mdx-custom.tsx            # <Figure>, <Callout> for MDX
  reactions.tsx             # 4-emoji reactions per article
  view-counter.tsx          # Auto-increment + display
  comments-section.tsx      # Server: fetch comments
  comment-form.tsx          # Client form
  newsletter-signup.tsx     # Inline footer signup

content/
  writings/*.mdx            # Articles
  projects.ts               # Projects list
  now.ts                    # Now page data

lib/
  mdx.ts                    # MDX loader + frontmatter + reading time
  site-config.ts            # Brand metadata
  utils.ts                  # formatDate, slugify, etc.
  ip-hash.ts                # Privacy-preserving IP hashing
  rate-limit.ts             # In-memory rate limiter
  queries.ts                # All Supabase read fetchers
  supabase/
    browser.ts              # Browser client (anon)
    server.ts               # Server client (anon, cookie-aware)
    admin.ts                # Service-role client (server-only, RLS bypass)

supabase/
  migrations/
    001_initial.sql         # Schema + RLS + functions

types/content.ts            # TS types for content
mdx-components.tsx          # Required by @next/mdx at root
next.config.mjs             # MDX pipeline
public/
  favicon.ico, favicon-32.png, apple-icon.png
  icon-192.png, icon-512.png, icon-512-maskable.png
  og-default.png            # 1200×630 default OG image
```

## Writing a new post

Create `content/writings/your-slug.mdx`:

```mdx
---
title: 'Judul tulisan kamu'
date: '2026-05-15'
summary: 'Ringkasan satu kalimat untuk preview.'
tags: ['engineering', 'reflection']
draft: false
---

Markdown standar didukung.

## Heading otomatis jadi anchor TOC

Pakai komponen kustom:

<Callout kind="tip">
  Ini callout berguna untuk tips atau catatan.
</Callout>

<Figure
  src="/images/screenshot.png"
  alt="Deskripsi gambar"
  caption="Caption gambar"
  width={1200}
  height={800}
/>
```

Available custom components in MDX:
- `<Callout kind="note|warning|tip">…</Callout>`
- `<Figure src="..." alt="..." caption="..." width={n} height={n} />`

Place images under `public/images/`.

## Anti-spam strategy

Built-in for every public form:

1. **Honeypot** — invisible `website` field; bots fill it, humans don't
2. **Rate limit** — per IP-hash (privacy-preserving)
3. **Length validation** — server-side check before insert
4. **No PII storage** — only SHA-256 of IP, salted with `ADMIN_SECRET`

For higher-volume sites later, add:
- Upstash Ratelimit (replace `lib/rate-limit.ts`)
- hCaptcha / Turnstile on forms

## Moderation

All `guestbook` and `comments` entries default to `approved=true` (show immediately). To moderate manually:

1. In Supabase Table Editor, flip `approved=false` on spam
2. Or set the default to `false` in the migration if you want pre-approval workflow

For comment moderation tooling, see the roadmap below.

## Newsletter — completing the flow

The current implementation collects emails and generates a `confirm_token`, but does NOT send confirmation emails. To complete double opt-in:

1. Sign up for Resend or Postmark
2. Add `RESEND_API_KEY` env var
3. In `app/api/subscribe/actions.ts`, after insert, send email:

```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'bbs <hi@belutbakarsurabaya.com>',
  to: trimmed,
  subject: 'Konfirmasi langganan',
  html: `<p>Klik untuk konfirmasi: <a href="${siteConfig.url}/api/confirm?token=${token}">Confirm</a></p>`,
});
```

4. Create `/api/confirm/route.ts` that flips `confirmed=true` for the token

## Features (Tier 1 + Supabase complete)

- ✓ All public pages (Home, About, Writing, Projects, Now, Uses, Guestbook)
- ✓ MDX with frontmatter, draft state, reading time
- ✓ Server-side syntax highlighting (Shiki dual theme)
- ✓ Copy code button
- ✓ Sticky TOC + reading progress
- ✓ Custom MDX components (`<Figure>`, `<Callout>`)
- ✓ Dark mode (system default, persists, no FOUC)
- ✓ Dynamic OG images (`/api/og`) + default OG fallback
- ✓ Favicon, apple-icon, PWA manifest, all icon sizes
- ✓ Sitemap, RSS, robots
- ✓ Error boundaries (`error.tsx`, `global-error.tsx`, `loading.tsx`)
- ✓ Mobile-first responsive

**Supabase-powered:**
- ✓ Guestbook with persistence + rate limit + honeypot
- ✓ Comments per article
- ✓ 4-emoji reactions per article (optimistic UI)
- ✓ View counter per article (atomic increment, dedup per IP)
- ✓ Newsletter signup (storage + token; email sending TODO)
- ✓ Row Level Security on all tables
- ✓ Privacy-preserving IP-hash anti-spam

## Roadmap (Tier 2-3)

- [ ] Confirmation email for newsletter (Resend integration)
- [ ] Related posts at article footer (by tag overlap)
- [ ] Prev/next article navigation
- [ ] CMS dashboard (admin UI: moderate guestbook/comments, write MDX)
- [ ] Command palette (cmd+k) — fuzzy search articles
- [ ] Webmentions
- [ ] Comment threading / replies
- [ ] Spotify now-playing on /now (via API)
- [ ] /colophon and /changelog pages
- [ ] JSON Feed alongside RSS

## Troubleshooting

**"Missing NEXT_PUBLIC_SUPABASE_URL"** → run `cp .env.example .env.local` and fill in.

**Build fails fetching Google Fonts** → ensure outbound internet during build. Behind firewall, replace `next/font/google` with `next/font/local` and self-host woff2.

**Form submits but nothing appears** → check Supabase logs (Database → Logs). RLS policy may block read for unapproved entries. Check `approved=true` in row.

**Rate limit triggered too aggressively** → tune limits in each `actions.ts` file. Defaults are conservative.

**MDX not refreshing in dev** → restart `npm run dev` after adding new MDX files; webpack discovers them at boot.

**Reactions don't toggle off** → localStorage-backed memory. Clear `bbs-reacted:*` keys in browser DevTools if state drifts.

## License

MIT — fork and adapt for your own site.
