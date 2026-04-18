import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search } from 'lucide-react';
import TeamEditor from '@/components/TeamEditor';
import { Team } from '@/types/tournament';

const Teams: React.FC = () => {
  const { data, isAdmin, isEditing, deleteTeam } = useTournament();
  const [showEditor, setShowEditor] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<Team['status'] | 'all'>('all');
  const [search, setSearch] = React.useState('');

  const totalMmr = (players: any[]) =>
    players
      .filter((p: any) => !p.isSubstitute)
      .reduce((s: number, p: any) => s + (p.mmr || 0), 0);

  const filteredTeams = data.teams.filter(team => {
    if (statusFilter !== 'all' && team.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const teamMatches =
      team.name.toLowerCase().includes(q) ||
      team.tag.toLowerCase().includes(q);
    if (teamMatches) return true;

    return team.players.some(player => {
      const steam64 = player.steamLink.match(/\d{16,20}/)?.[0] ?? '';
      return (
        player.nickname.toLowerCase().includes(q) ||
        player.steamLink.toLowerCase().includes(q) ||
        steam64.includes(q)
      );
    });
  });

  const q = search.trim().toLowerCase();
  const matchedPlayers = q
    ? data.teams.flatMap(team =>
        team.players
          .filter(player => {
            const steam64 = player.steamLink.match(/\d{16,20}/)?.[0] ?? '';
            return (
              player.nickname.toLowerCase().includes(q) ||
              player.steamLink.toLowerCase().includes(q) ||
              steam64.includes(q)
            );
          })
          .map(player => ({ team, player }))
      )
    : [];

  const getTitleClass = (style?: Team['titleStyle']) =>
    style === 'current'
      ? 'bg-gradient-to-r from-amber-300/30 via-yellow-300/25 to-orange-400/30 text-amber-200 border border-amber-300/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
      : 'bg-primary/10 text-primary border border-primary/30';

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="flex items-center justify-between gap-3 mb-8 sm:mb-12 flex-wrap">
          <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text">Команды</h1>
          {isAdmin && isEditing && (
            <button
              onClick={() => setShowEditor(true)}
              className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus size={18} /> Добавить команду
            </button>
          )}
        </div>

        {showEditor && <TeamEditor onClose={() => setShowEditor(false)} />}
        <div className="mb-8 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full bg-card border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground"
              placeholder="Поиск: команда, никнейм или Steam64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-card border rounded-lg px-3 py-2 text-sm text-foreground w-full sm:w-auto"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as Team['status'] | 'all')}
          >
            <option value="all">Все статусы</option>
            <option value="confirmed">Подтверждена</option>
            <option value="pending">Ожидается</option>
            <option value="withdrawn">Снялась</option>
            <option value="disqualified">Дисквалифицирована</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchedPlayers.length > 0 && (
            <div className="md:col-span-2 lg:col-span-3 mb-2">
              <h2 className="font-heading font-semibold text-foreground mb-3">Найденные игроки</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedPlayers.map(({ team, player }, idx) => {
                  const steam64 = player.steamLink.match(/\d{16,20}/)?.[0] ?? '—';
                  return (
                    <Link
                      key={`${team.id}-${player.id}-${idx}`}
                      to={`/teams/${team.id}`}
                      className="glass-card rounded-xl p-4 card-glow hover:border-primary/40 border border-transparent transition-colors"
                    >
                      <p className="font-heading font-semibold text-foreground">{player.nickname}</p>
                      <p className="text-xs text-muted-foreground mt-1">Steam64: {steam64}</p>
                      <p className="text-xs text-primary mt-2">Команда: {team.name} [{team.tag}]</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          {filteredTeams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <Link to={`/teams/${team.id}`} className="block glass-card rounded-xl p-6 card-glow group">
                <div className="flex items-center gap-4 mb-4 min-w-0">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center font-display text-2xl text-muted-foreground">
                      {team.tag || team.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors break-words">
                      {team.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">[{team.tag}]</p>
                    {team.titleText && (
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded mt-1 ${getTitleClass(team.titleStyle)}`}>
                        {team.titleEmoji || '🏆'} {team.titleText}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                  <span className="text-muted-foreground">MMR: <span className="text-foreground font-heading font-semibold">{totalMmr(team.players)}</span></span>
                  <span className={`px-2 py-0.5 rounded text-xs font-heading ${
                    team.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    team.status === 'disqualified' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {team.status === 'confirmed' ? 'Подтверждена' :
                     team.status === 'disqualified' ? 'Дисквалифицирована' : team.status === 'withdrawn' ? 'Снялась' : 'Ожидается'}
                  </span>
                </div>
                {team.status === 'disqualified' && team.disqualificationReason && (
                  <p className="text-xs text-red-400 mt-2">Причина: {team.disqualificationReason}</p>
                )}
              </Link>
              {isAdmin && isEditing && (
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="absolute top-2 right-2 p-2 bg-card/90 rounded-md text-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">Команд пока нет</div>
        )}
      </div>
    </PageLayout>
  );
};

export default Teams;
