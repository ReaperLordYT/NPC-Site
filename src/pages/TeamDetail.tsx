import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Crown, Calendar, Clock, Tv, Shield, AlertTriangle } from 'lucide-react';
import TeamEditor from '@/components/TeamEditor';
import { formatDate } from '@/lib/dateFormat';

const stageLabels: Record<string, string> = {
  group: 'Групповой',
  'playoff-upper': 'Верхняя сетка',
  'playoff-lower': 'Нижняя сетка',
  final: 'Финал',
};

const TeamDetail: React.FC = () => {
  const { id } = useParams();
  const { data, isAdmin, isEditing, withdrawTeam } = useTournament();
  const team = data.teams.find(t => t.id === id);
  const [showEditor, setShowEditor] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [withdrawReason, setWithdrawReason] = React.useState('');

  if (!team) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-heading text-foreground">Команда не найдена</h1>
          <Link to="/teams" className="text-primary mt-4 inline-block">← Назад к командам</Link>
        </div>
      </PageLayout>
    );
  }

  const totalMmr = team.players
    .filter(player => !player.isSubstitute)
    .reduce((s, p) => s + (p.mmr || 0), 0);
  const teamMatches = data.matches.filter(m => m.team1Id === team.id || m.team2Id === team.id);
  const completed = teamMatches.filter(m => m.status === 'completed' && m.result);

  let wins = 0, losses = 0, draws = 0;
  completed.forEach(m => {
    if (!m.result) return;
    const isTeam1 = m.team1Id === team.id;
    const my = isTeam1 ? m.result.team1Score : m.result.team2Score;
    const their = isTeam1 ? m.result.team2Score : m.result.team1Score;
    if (my > their) wins++;
    else if (my < their) losses++;
    else draws++;
  });

  const statusConfig = {
    confirmed:     { label: 'Подтверждена',    bg: 'bg-green-500/20',  text: 'text-green-400'  },
    disqualified:  { label: 'Дисквалифицирована', bg: 'bg-red-500/20', text: 'text-red-400'    },
    pending:       { label: 'Ожидается',        bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    withdrawn:     { label: 'Снялась',          bg: 'bg-muted',        text: 'text-muted-foreground' },
  };
  const sc = statusConfig[team.status] ?? statusConfig.pending;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <Link to="/teams" className="text-muted-foreground hover:text-primary flex items-center gap-2 mb-8 font-heading">
          <ArrowLeft size={18} /> Назад к командам
        </Link>

        {isAdmin && isEditing && showEditor && (
          <TeamEditor teamId={team.id} onClose={() => setShowEditor(false)} />
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* ── Team Header ───────────────────────────────────────────────── */}
          <div className={`glass-card rounded-2xl p-8 mb-8 ${team.status === 'withdrawn' ? 'opacity-80' : ''}`}>
            <div className="flex items-start gap-6 mb-6 flex-wrap">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-24 h-24 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center font-display text-4xl text-muted-foreground flex-shrink-0">
                  {team.tag || team.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className={`font-display text-3xl font-bold text-foreground ${team.status === 'withdrawn' ? 'line-through opacity-60' : ''}`}>{team.name}</h1>
                <p className="text-muted-foreground font-heading">[{team.tag}]</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded text-xs font-heading ${sc.bg} ${sc.text}`}>
                  {sc.label}
                </span>
                {team.status === 'disqualified' && team.disqualificationReason && (
                  <p className="text-sm text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={13} /> {team.disqualificationReason}</p>
                )}
                {team.status === 'withdrawn' && team.withdrawalReason && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Shield size={13} /> Причина: {team.withdrawalReason}</p>
                )}
              </div>
              {isAdmin && isEditing && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => setShowEditor(true)} className="btn-primary-gradient px-4 py-2 rounded-lg text-sm">
                    Редактировать
                  </button>
                  {team.status !== 'withdrawn' && (
                    <button onClick={() => setShowWithdraw(!showWithdraw)} className="px-4 py-2 border border-destructive/50 text-destructive/70 hover:text-destructive rounded-lg text-sm font-heading transition-colors">
                      Снять с турнира
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Withdraw form */}
            {showWithdraw && isAdmin && isEditing && (
              <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-3">
                <p className="text-sm font-heading text-foreground">Снятие команды с турнира. Команда останется в базе, но будет помечена как снявшаяся.</p>
                <input
                  className="w-full bg-background border rounded-lg p-2 text-foreground text-sm"
                  placeholder="Причина снятия (необязательно)"
                  value={withdrawReason}
                  onChange={e => setWithdrawReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { withdrawTeam(team.id, withdrawReason); setShowWithdraw(false); }}
                    className="px-4 py-2 bg-destructive/20 text-destructive rounded-lg text-sm font-heading hover:bg-destructive/30 transition-colors"
                  >
                    Подтвердить снятие
                  </button>
                  <button onClick={() => setShowWithdraw(false)} className="px-4 py-2 border rounded-lg text-muted-foreground text-sm">Отмена</button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-2xl font-display font-bold text-foreground">{totalMmr}</p>
                <p className="text-xs text-muted-foreground">Суммарный MMR</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-2xl font-display font-bold text-green-400">{wins}</p>
                <p className="text-xs text-muted-foreground">Победы</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-2xl font-display font-bold text-red-400">{losses}</p>
                <p className="text-xs text-muted-foreground">Поражения</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-2xl font-display font-bold text-yellow-400">{draws}</p>
                <p className="text-xs text-muted-foreground">Ничьи</p>
              </div>
            </div>
          </div>

          {/* ── Players ───────────────────────────────────────────────────── */}
          <h2 className="font-heading text-2xl font-bold mb-6 text-foreground">Состав</h2>
          <div className="space-y-3 mb-10">
            {team.players.map(player => (
              <div key={player.id} className="glass-card rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {player.isCaptain && <Crown size={16} className="text-yellow-400" />}
                    <span className="font-heading font-bold text-foreground">{player.nickname || 'Без ника'}</span>
                    {player.isSubstitute && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-heading">Запасной</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">MMR: {player.mmr} | Discord: {player.discordUsername || '—'}</p>
                </div>
                <div className="flex gap-2">
                  {player.steamLink && (
                    <a href={player.steamLink} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs border rounded-lg text-muted-foreground hover:text-primary hover:border-primary flex items-center gap-1 transition-colors">
                      Steam <ExternalLink size={12} />
                    </a>
                  )}
                  {player.dotabuffLink && (
                    <a href={player.dotabuffLink} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs border rounded-lg text-muted-foreground hover:text-primary hover:border-primary flex items-center gap-1 transition-colors">
                      DotaBuff <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Team Matches — detailed cards ─────────────────────────────── */}
          {teamMatches.length > 0 && (
            <>
              <h2 className="font-heading text-2xl font-bold mb-6 text-foreground">Матчи</h2>
              <div className="space-y-4">
                {teamMatches.map(match => {
                  const oppId = match.team1Id === team.id ? match.team2Id : match.team1Id;
                  const opp = data.teams.find(t => t.id === oppId);
                  const isTeam1 = match.team1Id === team.id;
                  const myScore = match.result ? (isTeam1 ? match.result.team1Score : match.result.team2Score) : null;
                  const theirScore = match.result ? (isTeam1 ? match.result.team2Score : match.result.team1Score) : null;
                  const didWin = myScore !== null && theirScore !== null && myScore > theirScore;
                  const didLose = myScore !== null && theirScore !== null && myScore < theirScore;

                  const resultBg = match.status === 'completed'
                    ? didWin ? 'border-l-4 border-l-green-500/60' : didLose ? 'border-l-4 border-l-red-500/60' : 'border-l-4 border-l-yellow-500/60'
                    : match.status === 'cancelled' ? 'opacity-50' : '';

                  return (
                    <div key={match.id} className={`glass-card rounded-xl p-5 ${resultBg}`}>
                      {/* Row 1: opponent + score */}
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {opp?.logo
                            ? <img src={opp.logo} alt={opp.name} className="w-10 h-10 rounded-lg object-cover" />
                            : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">{opp?.tag?.[0] || '?'}</div>
                          }
                          <div>
                            <p className="font-heading font-bold text-foreground text-base">vs {opp?.name || 'TBD'}</p>
                            {opp?.tag && <p className="text-xs text-muted-foreground">[{opp.tag}]</p>}
                          </div>
                        </div>

                        {/* Score */}
                        {match.result ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-display font-bold tabular-nums ${didWin ? 'text-green-400' : didLose ? 'text-red-400' : 'text-yellow-400'}`}>
                              {myScore}
                            </span>
                            <span className="text-muted-foreground font-bold">:</span>
                            <span className="text-2xl font-display font-bold tabular-nums text-muted-foreground">{theirScore}</span>
                            <span className={`text-xs font-heading px-2 py-0.5 rounded font-bold ${didWin ? 'bg-green-500/20 text-green-400' : didLose ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {didWin ? 'ПОБЕДА' : didLose ? 'ПОРАЖЕНИЕ' : 'НИЧЬЯ'}
                            </span>
                          </div>
                        ) : (
                          <div className={`px-3 py-1.5 rounded text-xs font-heading ${
                            match.status === 'live'      ? 'bg-red-500/20 text-red-400 animate-pulse' :
                            match.status === 'cancelled' ? 'bg-muted text-muted-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {match.status === 'live' ? '🔴 LIVE' : match.status === 'cancelled' ? '❌ Отменён' : 'Предстоит'}
                          </div>
                        )}
                      </div>

                      {/* Row 2: meta info */}
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-heading">{match.format}</span>
                        <span className="px-2 py-0.5 rounded bg-muted font-heading">{stageLabels[match.stage] || match.stage}</span>
                        {match.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {formatDate(match.scheduledDate)}
                          </span>
                        )}
                        {match.scheduledTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {match.scheduledTime}
                          </span>
                        )}
                        {match.round && <span className="flex items-center gap-1">Раунд {match.round}</span>}
                        {match.streamLink && (
                          <a href={match.streamLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Tv size={11} /> Трансляция
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default TeamDetail;
