import { supabase } from './client';
import { TournamentData, Team, Player, NewsItem, TournamentMatch, Group, SiteSettings } from '@/types/tournament';

export interface BackupSnapshot {
  id: string;
  note: string;
  createdAt: string;
  createdBy: string;
}

type TeamRow = {
  id: string;
  name: string;
  tag: string;
  logo: string;
  status: Team['status'];
  disqualification_reason: string | null;
  withdrawal_reason: string | null;
  group_id: string | null;
  title_text: string | null;
  title_emoji: string | null;
  title_style: string | null;
};
type PlayerRow = {
  id: string;
  team_id: string;
  nickname: string;
  role: string | null;
  steam_link: string;
  dotabuff_link: string;
  mmr: number;
  discord_username: string;
  is_captain: boolean;
  is_substitute: boolean;
};
type NewsRow = NewsItem;
type MatchRow = {
  id: string;
  team1_id: string;
  team2_id: string;
  stage: TournamentMatch['stage'];
  format: TournamentMatch['format'];
  group_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: TournamentMatch['status'];
  result: TournamentMatch['result'] | null;
  stream_link: string | null;
  round: number | null;
  match_number: number | null;
  node_x: number | null;
  node_y: number | null;
};
type GroupRow = { id: string; name: string; points_formula: string | null; team_ids: string[] };

const ADMIN_EMAILS = String(import.meta.env.VITE_SUPABASE_ADMIN_EMAILS || '')
  .split(',')
  .map((v: string) => v.trim().toLowerCase())
  .filter(Boolean);

function ensureSupabaseConfigured() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY');
  }
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function deleteMissingRows(table: string, ids: string[]) {
  if (ids.length === 0) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw error;
    return;
  }
  const inList = `(${ids.map(quote).join(',')})`;
  const { error } = await supabase.from(table).delete().not('id', 'in', inList);
  if (error) throw error;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  ensureSupabaseConfigured();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return false;

  const email = userData.user.email?.toLowerCase() ?? '';
  if (ADMIN_EMAILS.includes(email)) return true;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) return false;
  return profile?.role === 'admin';
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const admin = await isCurrentUserAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error('У этого пользователя нет прав администратора.');
  }
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchTournamentData(): Promise<TournamentData> {
  ensureSupabaseConfigured();

  const [
    teamsRes,
    playersRes,
    newsRes,
    matchesRes,
    groupsRes,
    settingsRes,
    metaRes,
  ] = await Promise.all([
    supabase.from('teams').select('*'),
    supabase.from('players').select('*'),
    supabase.from('news').select('*'),
    supabase.from('matches').select('*'),
    supabase.from('groups').select('*'),
    supabase.from('site_settings').select('payload').eq('id', 1).maybeSingle(),
    supabase.from('meta_state').select('bracket_connections').eq('id', 1).maybeSingle(),
  ]);

  const firstErr = [
    teamsRes.error,
    playersRes.error,
    newsRes.error,
    matchesRes.error,
    groupsRes.error,
    settingsRes.error,
    metaRes.error,
  ].find(Boolean);
  if (firstErr) throw firstErr;

  const playersByTeam = new Map<string, Player[]>();
  (playersRes.data as PlayerRow[]).forEach((player) => {
    const teamId = player.team_id;
    const p: Player = {
      id: player.id,
      nickname: player.nickname,
      role: (player.role || undefined) as Player['role'],
      steamLink: player.steam_link,
      dotabuffLink: player.dotabuff_link,
      mmr: player.mmr,
      discordUsername: player.discord_username,
      isCaptain: player.is_captain,
      isSubstitute: player.is_substitute,
    };
    if (!playersByTeam.has(teamId)) playersByTeam.set(teamId, []);
    playersByTeam.get(teamId)!.push(p);
  });

  const teams: Team[] = (teamsRes.data as TeamRow[]).map((team) => ({
    id: team.id,
    name: team.name,
    tag: team.tag,
    logo: team.logo,
    status: team.status,
    disqualificationReason: team.disqualification_reason || undefined,
    withdrawalReason: team.withdrawal_reason || undefined,
    groupId: team.group_id || undefined,
    titleText: team.title_text || undefined,
    titleEmoji: team.title_emoji || undefined,
    titleStyle: (team.title_style || undefined) as Team['titleStyle'],
    players: playersByTeam.get(team.id) ?? [],
  }));

  const groups: Group[] = (groupsRes.data as GroupRow[]).map((group) => ({
    id: group.id,
    name: group.name,
    teamIds: group.team_ids || [],
    pointsFormula: group.points_formula || undefined,
  }));

  const settings = (settingsRes.data?.payload || {}) as SiteSettings;

  return {
    teams,
    news: (newsRes.data as NewsItem[]) ?? [],
    matches: ((matchesRes.data as MatchRow[]) ?? []).map((m) => ({
      id: m.id,
      team1Id: m.team1_id,
      team2Id: m.team2_id,
      stage: m.stage,
      format: m.format,
      groupId: m.group_id || undefined,
      scheduledDate: m.scheduled_date,
      scheduledTime: m.scheduled_time,
      status: m.status,
      result: m.result || undefined,
      streamLink: m.stream_link || undefined,
      round: m.round || undefined,
      matchNumber: m.match_number || undefined,
      nodeX: m.node_x || undefined,
      nodeY: m.node_y || undefined,
    })),
    groups,
    settings,
    bracketConnections: (metaRes.data?.bracket_connections ?? []) as TournamentData['bracketConnections'],
  };
}

export async function saveTournamentData(data: TournamentData): Promise<void> {
  ensureSupabaseConfigured();

  const teamRows: TeamRow[] = data.teams.map(({ players, ...team }) => ({
    id: team.id,
    name: team.name,
    tag: team.tag,
    logo: team.logo,
    status: team.status,
    disqualification_reason: team.disqualificationReason ?? null,
    withdrawal_reason: team.withdrawalReason ?? null,
    group_id: team.groupId ?? null,
    title_text: team.titleText ?? null,
    title_emoji: team.titleEmoji ?? null,
    title_style: team.titleStyle ?? null,
  }));
  const playerRows: PlayerRow[] = data.teams.flatMap((team) =>
    team.players.map((player) => ({
      id: player.id,
      team_id: team.id,
      nickname: player.nickname,
      role: player.role ?? null,
      steam_link: player.steamLink,
      dotabuff_link: player.dotabuffLink,
      mmr: player.mmr,
      discord_username: player.discordUsername,
      is_captain: !!player.isCaptain,
      is_substitute: !!player.isSubstitute,
    }))
  );
  const newsRows: NewsRow[] = data.news;
  const matchRows: MatchRow[] = data.matches.map((m) => ({
    id: m.id,
    team1_id: m.team1Id,
    team2_id: m.team2Id,
    stage: m.stage,
    format: m.format,
    group_id: m.groupId ?? null,
    scheduled_date: m.scheduledDate,
    scheduled_time: m.scheduledTime,
    status: m.status,
    result: m.result ?? null,
    stream_link: m.streamLink ?? null,
    round: m.round ?? null,
    match_number: m.matchNumber ?? null,
    node_x: m.nodeX ?? null,
    node_y: m.nodeY ?? null,
  }));
  const groupRows: GroupRow[] = data.groups.map((group) => ({
    id: group.id,
    name: group.name,
    points_formula: group.pointsFormula ?? null,
    team_ids: group.teamIds,
  }));

  const { data: currentSettingsRow } = await supabase
    .from('site_settings')
    .select('payload')
    .eq('id', 1)
    .maybeSingle();
  const mergedSettings = {
    ...((currentSettingsRow?.payload || {}) as Record<string, unknown>),
    ...(data.settings as Record<string, unknown>),
  };

  const { error: settingsErr } = await supabase
    .from('site_settings')
    .upsert({ id: 1, payload: mergedSettings }, { onConflict: 'id' });
  if (settingsErr) throw settingsErr;

  const { error: metaErr } = await supabase
    .from('meta_state')
    .upsert({ id: 1, bracket_connections: data.bracketConnections ?? [] }, { onConflict: 'id' });
  if (metaErr) throw metaErr;

  const { error: teamsErr } = await supabase.from('teams').upsert(teamRows, { onConflict: 'id' });
  if (teamsErr) throw teamsErr;
  await deleteMissingRows('teams', teamRows.map((r) => r.id));

  const { error: playersErr } = await supabase.from('players').upsert(playerRows, { onConflict: 'id' });
  if (playersErr) throw playersErr;
  await deleteMissingRows('players', playerRows.map((r) => r.id));

  const { error: newsErr } = await supabase.from('news').upsert(newsRows, { onConflict: 'id' });
  if (newsErr) throw newsErr;
  await deleteMissingRows('news', newsRows.map((n) => n.id));

  const { error: matchesErr } = await supabase.from('matches').upsert(matchRows, { onConflict: 'id' });
  if (matchesErr) throw matchesErr;
  await deleteMissingRows('matches', matchRows.map((m) => m.id));

  const { error: groupsErr } = await supabase.from('groups').upsert(groupRows, { onConflict: 'id' });
  if (groupsErr) throw groupsErr;
  await deleteMissingRows('groups', groupRows.map((g) => g.id));
}

export async function listBackups(limit = 20): Promise<BackupSnapshot[]> {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('backups')
    .select('id,note,created_at,created_by')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    note: row.note || '',
    createdAt: row.created_at,
    createdBy: row.created_by || 'unknown',
  }));
}

export async function createBackupSnapshot(snapshot: TournamentData, note: string): Promise<void> {
  ensureSupabaseConfigured();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email || 'unknown';
  const { error } = await supabase.from('backups').insert({
    note,
    snapshot,
    created_by: email,
  });
  if (error) throw error;
}

export async function restoreBackupSnapshot(backupId: string): Promise<void> {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('backups')
    .select('snapshot')
    .eq('id', backupId)
    .single();
  if (error) throw error;
  await saveTournamentData(data.snapshot as TournamentData);
}

export async function deleteBackupSnapshot(backupId: string): Promise<void> {
  ensureSupabaseConfigured();
  const { error } = await supabase
    .from('backups')
    .delete()
    .eq('id', backupId);
  if (error) throw error;
}

export function subscribeTournamentUpdates(onChange: () => void): () => void {
  ensureSupabaseConfigured();
  const channel = supabase
    .channel('tournament-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meta_state' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
