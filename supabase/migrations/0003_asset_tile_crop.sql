alter table public.assets
  add column if not exists crop_zoom real,
  add column if not exists crop_x real,
  add column if not exists crop_y real;

update public.assets
set
  crop_zoom = coalesce(crop_zoom, 1),
  crop_x = coalesce(crop_x, 0),
  crop_y = coalesce(crop_y, 0)
where kind = 'tile';

alter table public.assets
  alter column crop_zoom set default 1,
  alter column crop_x set default 0,
  alter column crop_y set default 0;
