-- =============================================================================
-- bbs/ — Sesi 8: dumel image attachments (up to 4 per dumel)
-- =============================================================================
-- Run AFTER 007_site_settings.sql
-- =============================================================================

create table if not exists public.dumel_images (
  id          bigint generated always as identity primary key,
  dumel_id    bigint not null references public.dumel(id) on delete cascade,
  url         text not null,
  storage_path text not null,  -- for deletion from Storage when dumel deleted
  width       int default null,
  height      int default null,
  position    smallint not null default 0,  -- 0..3, order of display
  created_at  timestamptz not null default now()
);

create index if not exists dumel_images_dumel_id_idx
  on public.dumel_images (dumel_id, position);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Same model as dumel: anon has NO access. Only service_role (admin actions).

alter table public.dumel_images enable row level security;

-- No policies for anon/authenticated → effectively denied.


-- =============================================================================
-- Constraint: max 4 images per dumel
-- =============================================================================
-- Use a trigger because Postgres CHECK can't reference other rows.

create or replace function public.check_dumel_image_count()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.dumel_images where dumel_id = new.dumel_id) >= 4 then
    raise exception 'A dumel can have at most 4 images';
  end if;
  return new;
end;
$$;

drop trigger if exists dumel_images_max_count on public.dumel_images;
create trigger dumel_images_max_count
  before insert on public.dumel_images
  for each row execute function public.check_dumel_image_count();
