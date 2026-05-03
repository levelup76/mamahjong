-- Mamahjong initial schema.
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query).

-- 1) profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_public_display_name" on public.profiles;
create policy "profiles_public_display_name" on public.profiles
  for select using (true); -- needed for scores leaderboard joins; only display_name + id are useful publicly

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row on sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) scores ------------------------------------------------------------------
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  board_id smallint not null check (board_id between 1 and 5),
  time_seconds int not null check (time_seconds >= 0),
  won boolean not null,
  moves int,
  completed_at timestamptz not null default now()
);

create index if not exists scores_board_time_idx
  on public.scores (board_id, time_seconds);
create index if not exists scores_user_idx
  on public.scores (user_id, completed_at desc);

alter table public.scores enable row level security;

drop policy if exists "scores_read_all" on public.scores;
create policy "scores_read_all" on public.scores
  for select using (true);

drop policy if exists "scores_insert_self" on public.scores;
create policy "scores_insert_self" on public.scores
  for insert with check (auth.uid() = user_id);

-- 3) assets ------------------------------------------------------------------
-- Metadata for uploaded files (the file itself lives in Storage bucket "assets").
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('background','music','sound','tile')),
  board_id smallint check (board_id between 1 and 5),
  slot_key text,                 -- e.g. 'east','red','click','match','win','default'
  storage_path text not null,    -- path inside the 'assets' bucket
  is_active boolean not null default true,
  uploaded_by uuid references auth.users on delete set null,
  uploaded_at timestamptz not null default now()
);

create index if not exists assets_kind_active_idx
  on public.assets (kind, is_active);
create index if not exists assets_board_kind_slot_idx
  on public.assets (board_id, kind, slot_key);

alter table public.assets enable row level security;

drop policy if exists "assets_read_all" on public.assets;
create policy "assets_read_all" on public.assets
  for select using (true);

drop policy if exists "assets_admin_write" on public.assets;
create policy "assets_admin_write" on public.assets
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- 4) Storage bucket ----------------------------------------------------------
-- Run this section AFTER creating the bucket "assets" via Dashboard → Storage.
-- Make it public so the game can fetch images/audio without signed URLs.
--
-- Storage RLS: only admins can write; anyone can read.

-- Storage policies (run AFTER you've created the "assets" bucket via Dashboard).
-- Wrapped in DO blocks so a re-run doesn't fail when policies already exist.

drop policy if exists "Public read assets" on storage.objects;
create policy "Public read assets"
  on storage.objects for select
  using (bucket_id = 'assets');

drop policy if exists "Admin write assets" on storage.objects;
create policy "Admin write assets"
  on storage.objects for insert
  with check (
    bucket_id = 'assets'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "Admin update assets" on storage.objects;
create policy "Admin update assets"
  on storage.objects for update
  using (
    bucket_id = 'assets'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "Admin delete assets" on storage.objects;
create policy "Admin delete assets"
  on storage.objects for delete
  using (
    bucket_id = 'assets'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
