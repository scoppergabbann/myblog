-- =============================================================================
-- bbs/ — Add Spotify embed support to Now page
-- =============================================================================
-- Run this AFTER 002_content.sql
-- =============================================================================

alter table public.now_meta
  add column if not exists spotify_url text;

-- Optional: set a default playlist as starter
-- update public.now_meta
-- set spotify_url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
-- where id = 1;
