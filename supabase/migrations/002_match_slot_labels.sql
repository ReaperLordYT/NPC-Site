alter table public.matches
  add column if not exists team1_label text,
  add column if not exists team2_label text;

