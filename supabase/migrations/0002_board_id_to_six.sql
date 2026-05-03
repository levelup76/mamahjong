-- Mamahjong: extend the board_id range from 1..5 to 1..6.
-- Adds Pagoda (id=4 replaces former Sárkány) and Toronyház (id=6).
-- Run this in Supabase SQL Editor on top of 0001_init.sql.

alter table public.scores
  drop constraint if exists scores_board_id_check;
alter table public.scores
  add constraint scores_board_id_check
  check (board_id between 1 and 6);

alter table public.assets
  drop constraint if exists assets_board_id_check;
alter table public.assets
  add constraint assets_board_id_check
  check (board_id between 1 and 6);
