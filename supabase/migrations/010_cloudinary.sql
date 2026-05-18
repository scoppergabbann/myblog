-- =============================================================================
-- bbs/ — Sesi 10: Cloudinary storage for ngedumel attachments
-- =============================================================================
-- Run AFTER 009_dumel_files.sql
--
-- Adds cloudinary_public_id columns so we can properly delete files
-- from Cloudinary when a dumel is deleted.
-- resource_type distinguishes 'image' vs 'raw' (documents).
-- =============================================================================

-- For photo attachments
alter table public.dumel_images
  add column if not exists cloudinary_public_id  text default null,
  add column if not exists cloudinary_resource_type text default 'image';

-- For file attachments (PDF, Office, text)
alter table public.dumel
  add column if not exists file_cloudinary_public_id    text default null,
  add column if not exists file_cloudinary_resource_type text default 'raw';

-- Note: file_storage_path column from migration 009 can be left as-is
-- (nullable, will just be NULL for new Cloudinary-stored files).
-- Old Supabase-stored files (if any) keep their storage_path for reference.
