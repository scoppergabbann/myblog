# Cloudinary storage migration — install

## Env vars (tambah ke Vercel + .env.local):
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  CLOUDINARY_UPLOAD_PRESET=bbs-ngedumel

## Migration WAJIB sebelum push code:
Buka Supabase SQL Editor, paste isi
`supabase/migrations/010_cloudinary.sql`, klik Run.

## NEW file (1):
  lib/cloudinary.ts           (upload/delete/URL helper, no SDK)

## MODIFIED files (2):
  app/ngedumel/actions.ts     (full rewrite — Supabase Storage → Cloudinary)
  app/ngedumel/composer.tsx   (storagePath → publicId)

## Cara apply:
  cp lib/cloudinary.ts ../bbs-site/lib/
  cp app/ngedumel/actions.ts ../bbs-site/app/ngedumel/
  cp app/ngedumel/composer.tsx ../bbs-site/app/ngedumel/
  cp supabase/migrations/010_cloudinary.sql ../bbs-site/supabase/migrations/
  cd ../bbs-site && git add -A && git commit -m "feat: migrate ngedumel storage to Cloudinary" && git push

## Cloudinary folder structure:
  ngedumel/images/   ← semua foto dari /ngedumel
  ngedumel/files/    ← semua dokumen dari /ngedumel

## Test setelah deploy:
1. /ngedumel → upload foto → cek URL yang muncul di feed
   harus: https://res.cloudinary.com/your-cloud/image/upload/...
2. Upload PDF → viewer jalan normal (URL Cloudinary)
3. Hapus dumel → cek di Cloudinary dashboard, file should be deleted
4. Admin post images TETAP ke Supabase Storage (tidak berubah)
