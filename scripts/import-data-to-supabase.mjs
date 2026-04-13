import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const supabase = createClient(
  required('SUPABASE_URL'),
  required('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } }
);

const root = process.cwd();
const filePath = path.join(root, 'public', 'data.json');
const raw = await fs.readFile(filePath, 'utf-8');
const data = JSON.parse(raw);

const teams = (data.teams || []).map(({ players, ...team }) => ({
  id: team.id,
  name: team.name,
  tag: team.tag || '',
  logo: team.logo || '',
  status: team.status || 'pending',
  disqualification_reason: team.disqualificationReason || null,
  withdrawal_reason: team.withdrawalReason || null,
  group_id: team.groupId || null,
  title_text: team.titleText || null,
  title_emoji: team.titleEmoji || null,
  title_style: team.titleStyle || null,
}));

const players = (data.teams || []).flatMap((team) =>
  (team.players || []).map((player) => ({
    id: player.id,
    team_id: team.id,
    nickname: player.nickname || '',
    role: player.role || null,
    steam_link: player.steamLink || '',
    dotabuff_link: player.dotabuffLink || '',
    mmr: player.mmr || 0,
    discord_username: player.discordUsername || '',
    is_captain: !!player.isCaptain,
    is_substitute: !!player.isSubstitute,
  }))
);

const news = (data.news || []).map((item) => ({
  id: item.id,
  title: item.title || '',
  summary: item.summary || '',
  content: item.content || '',
  image: item.image || '',
  date: item.date || '',
}));

const matches = (data.matches || []).map((m) => ({
  id: m.id,
  team1_id: m.team1Id || '',
  team2_id: m.team2Id || '',
  stage: m.stage,
  format: m.format,
  group_id: m.groupId || null,
  scheduled_date: m.scheduledDate || '',
  scheduled_time: m.scheduledTime || '',
  status: m.status || 'scheduled',
  result: m.result || null,
  stream_link: m.streamLink || null,
  round: m.round ?? null,
  match_number: m.matchNumber ?? null,
  node_x: m.nodeX ?? null,
  node_y: m.nodeY ?? null,
}));

const groups = (data.groups || []).map((g) => ({
  id: g.id,
  name: g.name,
  points_formula: g.pointsFormula || null,
  team_ids: g.teamIds || [],
}));

const run = async () => {
  await supabase.from('site_settings').upsert({ id: 1, payload: data.settings || {} }, { onConflict: 'id' });
  await supabase.from('meta_state').upsert({ id: 1, bracket_connections: data.bracketConnections || [] }, { onConflict: 'id' });
  await supabase.from('teams').upsert(teams, { onConflict: 'id' });
  await supabase.from('players').upsert(players, { onConflict: 'id' });
  await supabase.from('news').upsert(news, { onConflict: 'id' });
  await supabase.from('matches').upsert(matches, { onConflict: 'id' });
  await supabase.from('groups').upsert(groups, { onConflict: 'id' });
  console.log('Import completed successfully.');
};

await run();
