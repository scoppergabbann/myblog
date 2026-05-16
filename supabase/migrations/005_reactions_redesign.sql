-- =============================================================================
-- bbs/ — Sesi 5: redesign reactions with more emoji + dislike
-- =============================================================================
-- Run AFTER 004_home_about.sql
-- =============================================================================

-- Drop old check constraint
alter table public.reactions
  drop constraint if exists reactions_emoji_check;

-- Add new check constraint with expanded emoji set
alter table public.reactions
  add constraint reactions_emoji_check
  check (emoji in ('love', 'fire', 'wow', 'lol', 'brain', 'poop'));

-- Optional: migrate existing emoji values to new keys
-- heart    → love
-- thinking → brain
-- star     → wow
update public.reactions set emoji = 'love'  where emoji = 'heart';
update public.reactions set emoji = 'brain' where emoji = 'thinking';
update public.reactions set emoji = 'wow'   where emoji = 'star';
-- 'fire' stays the same
