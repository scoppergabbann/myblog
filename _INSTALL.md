# Library page — install

## NOTE: admin/protected/ → app/admin/(protected)/
Sama seperti sebelumnya, rename folder saat copy.

## Migration WAJIB:
Paste supabase/migrations/011_library.sql ke Supabase SQL Editor → Run

## NEW files:
  lib/library.ts
  app/library/page.tsx
  app/library/library-shelf.tsx
  app/admin/(protected)/library/actions.ts
  app/admin/(protected)/library/page.tsx
  app/admin/(protected)/library/library-admin-editor.tsx

## MODIFIED files:
  lib/site-config.ts               (add /library to nav)
  app/admin/(protected)/layout.tsx (add library to sidebar)
  app/globals.css                  (add .input-base + .scrollbar-none)
  app/sitemap.ts                   (add /library)
