-- =============================================================================
-- bbs/ — Sesi 5: redesign reactions with more emoji + dislike
-- =============================================================================
-- Run AFTER 004_home_about.sql
--
-- Order is critical:
--   1. Drop the old check constraint (so we can modify rows freely)
--   2. Migrate every existing emoji value to a new key
--   3. Catch-all: rename anything still unknown so it doesn't violate
--   4. Add the new check constraint LAST (after all rows are valid)
-- =============================================================================

-- Step 1: Drop the old check constraint
alter table public.reactions
  drop constraint if exists reactions_emoji_check;

-- Step 2: Migrate existing values to new keys
--   heart    → love
--   thinking → brain
--   star     → wow
--   fire     → fire (no change)
update public.reactions set emoji = 'love'  where emoji = 'heart';
update public.reactions set emoji = 'brain' where emoji = 'thinking';
update public.reactions set emoji = 'wow'   where emoji = 'star';

-- Step 3: Safety net — catch anything else (shouldn't happen, but defensive).
-- Anything not in the new valid set becomes 'love' as a sensible default.
update public.reactions
set emoji = 'love'
where emoji not in ('love', 'fire', 'wow', 'lol', 'brain', 'poop');

-- Step 4: Add the new check constraint (now safe — all rows valid)
alter table public.reactions
  add constraint reactions_emoji_check
  check (emoji in ('love', 'fire', 'wow', 'lol', 'brain', 'poop'));
