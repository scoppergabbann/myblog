-- =============================================================================
-- bbs/ — Sesi 9: dumel attached file (1 file per dumel)
-- =============================================================================
-- Run AFTER 008_dumel_images.sql
--
-- 1 file per dumel approach: add columns directly to `dumel` table.
-- No FK relationship needed. Simpler than separate table.
-- =============================================================================

alter table public.dumel
  add column if not exists file_url           text default null,
  add column if not exists file_storage_path  text default null,
  add column if not exists file_name          text default null,
  add column if not exists file_size          int  default null,   -- bytes
  add column if not exists file_mime          text default null;

-- Note: also relax the content check constraint so empty content is allowed
-- when there's only a file attachment (matches existing image-only flow).
alter table public.dumel
  drop constraint if exists dumel_content_check;

alter table public.dumel
  add constraint dumel_content_check
  check (char_length(content) <= 2000);
