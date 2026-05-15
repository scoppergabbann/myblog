# bbs/ — belutbakarsurabaya

Personal site built with Next.js, TypeScript, Tailwind v4, and MDX. A quiet corner on the internet.

## Stack (all verified building)

- **Framework**: Next.js 15.5 (App Router, Server Components, webpack)
- **Language**: TypeScript strict
- **React**: 18.3
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme`)
- **Content**: MDX via `@next/mdx` (build-time, file-based)
- **Syntax highlighting**: `rehype-pretty-code` + Shiki (server-rendered, dual theme)
- **Fonts**: Inter + JetBrains Mono via `next/font` (self-hosted at build)
- **Theme**: `next-themes` (light/dark, system default, no FOUC)
- **RSS**: `feed`
- **OG images**: `next/og` edge runtime (dynamic via `/api/og?title=...`)

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

> First install may fetch Tailwind v4 beta packages and Google Fonts for Inter / JetBrains Mono. Ensure outbound internet during first build.

## Build & deploy

```bash
npm run build
npm start
```

**Vercel**: works out of the box. Push to a GitHub repo and import.

**VPS / self-host**: build locally, then ship `.next/`, `package.json`, `package-lock.json`, `next.config.mjs`, `public/`, and `content/` to the server. Run `npm install --production && npm start`. Or use a Node process manager like PM2 / systemd.

**Static export** (no Node server needed): not enabled by default because OG image generation needs edge runtime. To make the whole site static, remove `app/api/og/route.tsx` and add `output: 'export'` to `next.config.mjs`.

## Folder structure

```
app/
  layout.tsx          # Root layout, fonts, theme provider, FOUC-prevent script
  page.tsx            # Home
  globals.css         # Tailwind v4 + design tokens (@theme block)
  not-found.tsx
  writing/
    page.tsx          # List page (server)
    writing-filter.tsx# Tag + search (client)
    [slug]/page.tsx   # MDX renderer + TOC + reading progress
  about/page.tsx
  projects/page.tsx
  now/page.tsx
  uses/page.tsx
  guestbook/
    page.tsx
    guestbook-client.tsx
  api/og/route.tsx    # Dynamic OG image
  rss.xml/route.ts    # RSS feed
  sitemap.ts          # Auto sitemap
  robots.ts

components/
  nav.tsx
  footer.tsx
  theme-provider.tsx
  theme-toggle.tsx
  reading-progress.tsx
  client-code-block.tsx  # Wraps rehype-pretty-code <pre> with copy button
  mdx-components.tsx     # Override MDX renderers
  writing-item.tsx
  project-card.tsx

content/
  writings/*.mdx      # Posts with frontmatter
  projects.ts         # Project array
  now.ts              # Now page data

lib/
  mdx.ts              # Loader + frontmatter + reading time
  site-config.ts      # Single source of truth
  utils.ts            # formatDate, slugify, extractToc, etc.

types/content.ts
mdx-components.tsx    # Required by @next/mdx at root
next.config.mjs       # MDX pipeline config
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

Tulisan dimulai di sini. Markdown standar didukung, plus:

## Heading otomatis jadi anchor (TOC sticky)

- list
- dengan **bold**
- dan `inline code`

\`\`\`typescript
// code block dengan syntax highlighting + copy button
const x = 'hello';
\`\`\`

> Blockquote untuk kutipan
```

Set `draft: true` to hide in production (still visible in dev).

Commit, push, redeploy. Done.

## Customization

| What             | Where                                                |
| ---------------- | ---------------------------------------------------- |
| Brand & metadata | `lib/site-config.ts`                                 |
| Colors & tokens  | `app/globals.css` (`@theme` for light, `:root[data-theme="dark"]` for dark) |
| Projects         | `content/projects.ts`                                |
| Now data         | `content/now.ts`                                     |
| Uses page items  | `app/uses/page.tsx` (`sections` array)               |
| About copy       | `app/about/page.tsx`                                 |

## Features

- ✓ App Router + Server Components (zero client JS for most pages)
- ✓ MDX with frontmatter, draft state, auto reading time
- ✓ Server-side syntax highlighting (Shiki via rehype-pretty-code, dual theme)
- ✓ Copy code button on hover
- ✓ Table of contents (sticky, auto from h2/h3)
- ✓ Reading progress bar (article only)
- ✓ Dark mode (system default, persists, no FOUC via pre-paint script)
- ✓ Dynamic OG images (`/api/og?title=...&subtitle=...`)
- ✓ Sitemap (auto from MDX files + static routes)
- ✓ RSS feed
- ✓ robots.txt
- ✓ Mobile-first responsive
- ✓ Tag filter + client search on `/writing`
- ✓ SEO metadata per page (OG + Twitter cards)

## Roadmap (intentionally skipped for v1)

- [ ] CMS dashboard (admin UI for CRUD without `git push`)
- [ ] Guestbook persistence (currently client-state only — needs DB or service like Upstash)
- [ ] Webmentions
- [ ] View counter per article
- [ ] Newsletter subscription
- [ ] Changelog page

## Troubleshooting

**Build fails fetching Google Fonts**: ensure outbound internet to `fonts.googleapis.com`. Behind a strict firewall, replace `next/font/google` with `next/font/local` and self-host the woff2 files.

**Hydration warning about theme**: handled by `suppressHydrationWarning` on `<html>` + pre-paint script in `<head>`. Don't remove these.

**MDX not refreshing in dev**: restart `npm run dev` after adding new MDX files; webpack discovers them at boot.

## License

MIT — fork and adapt for your own site.
