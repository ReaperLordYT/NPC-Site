create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id int primary key default 1,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_state (
  id int primary key default 1,
  bracket_connections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  name text not null,
  tag text not null default '',
  logo text not null default '',
  status text not null default 'pending',
  disqualification_reason text,
  withdrawal_reason text,
  group_id text,
  title_text text,
  title_emoji text,
  title_style text,
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  nickname text not null default '',
  role text,
  steam_link text not null default '',
  dotabuff_link text not null default '',
  mmr int not null default 0,
  discord_username text not null default '',
  is_captain boolean not null default false,
  is_substitute boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists idx_players_team_id on public.players(team_id);

create table if not exists public.news (
  id text primary key,
  title text not null,
  summary text not null default '',
  content text not null default '',
  image text not null default '',
  date text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  team1_id text not null default '',
  team2_id text not null default '',
  stage text not null,
  format text not null,
  group_id text,
  scheduled_date text not null default '',
  scheduled_time text not null default '',
  status text not null default 'scheduled',
  result jsonb,
  stream_link text,
  round int,
  match_number int,
  node_x int,
  node_y int,
  updated_at timestamptz not null default now()
);
create index if not exists idx_matches_status on public.matches(status);
create index if not exists idx_matches_group_id on public.matches(group_id);

create table if not exists public.groups (
  id text primary key,
  name text not null,
  points_formula text,
  team_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  note text not null default '',
  snapshot jsonb not null,
  created_by text not null default 'unknown',
  created_at timestamptz not null default now()
);
create index if not exists idx_backups_created_at on public.backups(created_at desc);

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.meta_state enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.news enable row level security;
alter table public.matches enable row level security;
alter table public.groups enable row level security;
alter table public.backups enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

drop policy if exists "public_read_profiles" on public.profiles;
create policy "public_read_profiles" on public.profiles for select using (true);
drop policy if exists "admin_write_profiles" on public.profiles;
create policy "admin_write_profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_site_settings" on public.site_settings;
create policy "public_read_site_settings" on public.site_settings for select using (true);
drop policy if exists "admin_write_site_settings" on public.site_settings;
create policy "admin_write_site_settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_meta_state" on public.meta_state;
create policy "public_read_meta_state" on public.meta_state for select using (true);
drop policy if exists "admin_write_meta_state" on public.meta_state;
create policy "admin_write_meta_state" on public.meta_state for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_teams" on public.teams;
create policy "public_read_teams" on public.teams for select using (true);
drop policy if exists "admin_write_teams" on public.teams;
create policy "admin_write_teams" on public.teams for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_players" on public.players;
create policy "public_read_players" on public.players for select using (true);
drop policy if exists "admin_write_players" on public.players;
create policy "admin_write_players" on public.players for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_news" on public.news;
create policy "public_read_news" on public.news for select using (true);
drop policy if exists "admin_write_news" on public.news;
create policy "admin_write_news" on public.news for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_matches" on public.matches;
create policy "public_read_matches" on public.matches for select using (true);
drop policy if exists "admin_write_matches" on public.matches;
create policy "admin_write_matches" on public.matches for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_groups" on public.groups;
create policy "public_read_groups" on public.groups for select using (true);
drop policy if exists "admin_write_groups" on public.groups;
create policy "admin_write_groups" on public.groups for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_read_backups" on public.backups;
create policy "admin_read_backups" on public.backups for select using (public.is_admin());
drop policy if exists "admin_write_backups" on public.backups;
create policy "admin_write_backups" on public.backups for all using (public.is_admin()) with check (public.is_admin());
