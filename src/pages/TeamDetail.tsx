import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Crown, Calendar, Clock, Tv, Shield, AlertTriangle } from 'lucide-react';
import TeamEditor from '@/components/TeamEditor';
import { formatDate } from '@/lib/dateFormat';

const stageLabels: Record<string, string> = {
  group: 'Групповой этап',
  'playoff-upper': 'Верхняя сетка',
  'playoff-lower': 'Нижняя сетка',
  final: 'Финал',
};

const LINEUP_SIZE = 5;
const MAX_ACTIVE_SUBS = 2;
const DEFAULT_MMR_LIMIT = 35000;

const TeamDetail: React.FC = () => {
  const { id } = useParams();
  const { data, isAdmin, isEditing, withdrawTeam } = useTournament();
  const team = data.teams.find(t => t.id === id);
  const [showEditor, setShowEditor] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [withdrawReason, setWithdrawReason] = React.useState('');
  const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null);
  const [mmrLimit, setMmrLimit] = React.useState(DEFAULT_MMR_LIMIT);
  const [activePlayerIds, setActivePlayerIds] = React.useState<string[]>([]);

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
  const sortedPlayers = [...team.players]
    .map((player, originalIndex) => ({ player, originalIndex }))
    .sort((a, b) => {
      const aReserve = !!a.player.isSubstitute;
      const bReserve = !!b.player.isSubstitute;
      if (aReserve !== bReserve) return aReserve ? 1 : -1;

      const aCaptain = !!a.player.isCaptain;
      const bCaptain = !!b.player.isCaptain;
      if (aCaptain !== bCaptain) return aCaptain ? -1 : 1;

      return a.originalIndex - b.originalIndex;
    })
    .map(entry => entry.player);
  const teamMatches = data.matches
    .filter(m => m.team1Id === team.id || m.team2Id === team.id)
    .sort((a, b) => {
      const dateA = a.scheduledDate || '9999-12-31';
      const dateB = b.scheduledDate || '9999-12-31';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.scheduledTime || '99:99';
      const timeB = b.scheduledTime || '99:99';
      return timeA.localeCompare(timeB);
    });
  const completed = teamMatches.filter(m => m.status === 'completed' && m.result);
  const activePlayers = sortedPlayers.filter(player => activePlayerIds.includes(player.id));
  const activeMmr = activePlayers.reduce((sum, player) => sum + (player.mmr || 0), 0);
  const activeSubs = activePlayers.filter(player => player.isSubstitute).length;
  const lineupReady = activePlayers.length === LINEUP_SIZE;
  const subsWithinRule = activeSubs <= MAX_ACTIVE_SUBS;
  const mmrWithinLimit = activeMmr <= mmrLimit;
  const lineupValid = lineupReady && subsWithinRule && mmrWithinLimit;

  React.useEffect(() => {
    const defaultActive = sortedPlayers
      .filter(player => !player.isSubstitute)
      .slice(0, LINEUP_SIZE)
      .map(player => player.id);
    setActivePlayerIds(defaultActive);
  }, [team.id]);

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
  const selectedMatch = selectedMatchId ? teamMatches.find(m => m.id === selectedMatchId) : null;
  const selectedOpponent = selectedMatch
    ? data.teams.find(t => t.id === (selectedMatch.team1Id === team.id ? selectedMatch.team2Id : selectedMatch.team1Id))
    : null;
  const titleClass = team.titleStyle === 'current'
    ? 'bg-gradient-to-r from-amber-300/30 via-yellow-300/25 to-orange-400/30 text-amber-200 border border-amber-300/40 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
    : 'bg-primary/10 text-primary border border-primary/30';

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-4xl">
        <Link to="/teams" className="text-muted-foreground hover:text-primary flex items-center gap-2 mb-8 font-heading">
          <ArrowLeft size={18} /> Назад к командам
        </Link>

        {isAdmin && isEditing && showEditor && (
          <TeamEditor teamId={team.id} onClose={() => setShowEditor(false)} />
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* ── Team Header ───────────────────────────────────────────────── */}
          <div className={`glass-card rounded-2xl p-5 sm:p-8 mb-8 ${team.status === 'withdrawn' ? 'opacity-80' : ''}`}>
            <div className="flex items-start gap-6 mb-6 flex-wrap">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-28 h-28 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-muted flex items-center justify-center font-display text-4xl text-muted-foreground flex-shrink-0">
                  {team.tag || team.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className={`font-display text-2xl sm:text-3xl font-bold text-foreground break-words ${team.status === 'withdrawn' ? 'line-through opacity-60' : ''}`}>{team.name}</h1>
                <p className="text-muted-foreground font-heading">[{team.tag}]</p>
                {team.titleText && (
                  <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded text-xs font-heading ${titleClass}`}>
                    {team.titleEmoji || '🏆'} {team.titleText}
                  </span>
                )}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
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
            {sortedPlayers.map(player => (
              <div
                key={player.id}
                className={`glass-card rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 border ${
                  player.isSubstitute
                    ? 'border-amber-400/45 bg-amber-500/5'
                    : 'border-emerald-400/45 bg-emerald-500/5'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {player.isCaptain && <Crown size={16} className="text-yellow-400" />}
                    <span className="font-heading font-bold text-foreground">{player.nickname || 'Без ника'}</span>
                    {player.isSubstitute && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-heading">Запасной</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-words">MMR: {player.mmr} | Discord: {player.discordUsername || '—'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
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

          <div className="glass-card rounded-2xl p-6 mb-10">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Калькулятор состава на матч</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Отметьте 5 активных игроков. Калькулятор проверит лимит MMR и количество замен.
                </p>
              </div>
              <label className="text-sm text-muted-foreground">
                Лимит MMR
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-36 bg-background border rounded-lg p-2 text-foreground"
                  value={mmrLimit}
                  onChange={e => setMmrLimit(Math.max(0, parseInt(e.target.value || '0', 10)))}
                />
              </label>
            </div>

            <div className="space-y-2 mb-4">
              {sortedPlayers.map(player => {
                const isActive = activePlayerIds.includes(player.id);
                return (
                  <label
                    key={`lineup-${player.id}`}
                    className={`flex items-start sm:items-center justify-between gap-3 bg-background/40 border rounded-lg px-3 py-2 ${
                      player.isSubstitute ? 'border-amber-400/45 bg-amber-500/5' : 'border-emerald-400/45 bg-emerald-500/5'
                    }`}
                  >
                    <span className="text-sm text-foreground break-words">
                      {player.nickname || 'Без ника'} ({player.mmr || 0} MMR)
                      {player.isCaptain ? ' • Капитан' : ''}
                      {player.isSubstitute ? ' • Запасной' : ''}
                    </span>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => {
                        const checked = e.target.checked;
                        setActivePlayerIds(prev => {
                          if (checked) return prev.includes(player.id) ? prev : [...prev, player.id];
                          return prev.filter(id => id !== player.id);
                        });
                      }}
                    />
                  </label>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-center">
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xl font-display font-bold text-foreground">{activePlayers.length}/{LINEUP_SIZE}</p>
                <p className="text-xs text-muted-foreground">Активных игроков</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className={`text-xl font-display font-bold ${mmrWithinLimit ? 'text-green-400' : 'text-red-400'}`}>{activeMmr}</p>
                <p className="text-xs text-muted-foreground">MMR активного состава</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className={`text-xl font-display font-bold ${subsWithinRule ? 'text-green-400' : 'text-red-400'}`}>{activeSubs}/{MAX_ACTIVE_SUBS}</p>
                <p className="text-xs text-muted-foreground">Запасных в матче</p>
              </div>
            </div>

            <div className={`mt-4 rounded-lg px-4 py-3 text-sm border ${lineupValid ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'}`}>
              {lineupValid
                ? `Состав валиден. Запас по лимиту: ${mmrLimit - activeMmr} MMR.`
                : [
                    !lineupReady ? `Нужно выбрать ровно ${LINEUP_SIZE} игроков.` : null,
                    !subsWithinRule ? `Одновременно можно выпускать не более ${MAX_ACTIVE_SUBS} запасных.` : null,
                    !mmrWithinLimit ? `Лимит превышен на ${activeMmr - mmrLimit} MMR.` : null,
                  ].filter(Boolean).join(' ')}
            </div>
          </div>

          {/* ── Team Matches — detailed cards ─────────────────────────────── */}
          {teamMatches.length > 0 && (
            <>
              <h2 className="font-heading text-2xl font-bold mb-6 text-foreground">Матчи</h2>
              <div className="space-y-4">
                {teamMatches.map(match => {
                  const oppId = match.team1Id === team.id ? match.team2Id : match.team1Id;
                  const opp = data.teams.find(t => t.id === oppId);
                  const groupName = match.groupId ? data.groups.find(g => g.id === match.groupId)?.name : null;
                  const isTeam1 = match.team1Id === team.id;
                  const myScore = match.result ? (isTeam1 ? match.result.team1Score : match.result.team2Score) : null;
                  const theirScore = match.result ? (isTeam1 ? match.result.team2Score : match.result.team1Score) : null;
                  const didWin = myScore !== null && theirScore !== null && myScore > theirScore;
                  const didLose = myScore !== null && theirScore !== null && myScore < theirScore;

                  const resultBg = match.status === 'completed'
                    ? didWin ? 'border-l-4 border-l-green-500/60' : didLose ? 'border-l-4 border-l-red-500/60' : 'border-l-4 border-l-yellow-500/60'
                    : match.status === 'cancelled' ? 'opacity-50' : '';

                  return (
                    <div
                      key={match.id}
                      onClick={() => {
                        setSelectedMatchId(match.id);
                      }}
                      className={`glass-card rounded-xl p-5 ${resultBg} w-full text-left cursor-pointer`}
                    >
                      {/* Row 1: opponent + score */}
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {opp?.logo
                            ? <img src={opp.logo} alt={opp.name} className="w-10 h-10 rounded-lg object-cover" />
                            : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">{opp?.tag?.[0] || '?'}</div>
                          }
                          <div className="min-w-0">
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
                        {groupName && (
                          <span className="px-2 py-0.5 rounded bg-muted/70 font-heading">Группа: {groupName}</span>
                        )}
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
                          <a href={match.streamLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-primary hover:underline">
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
          {selectedMatch && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedMatchId(null)}>
              <div className="max-w-2xl mx-auto mt-10 sm:mt-16 glass-card rounded-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-xl font-bold text-foreground">Подробности матча</h3>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedMatchId(null)}>✕</button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 rounded-md text-xs font-heading bg-primary/10 text-primary">{stageLabels[selectedMatch.stage] || selectedMatch.stage}</span>
                  <span className="px-2 py-1 rounded-md text-xs font-heading bg-muted/60 text-foreground">{selectedMatch.format}</span>
                  {selectedMatch.round && <span className="px-2 py-1 rounded-md text-xs font-heading bg-muted/60 text-foreground">Раунд {selectedMatch.round}</span>}
                  {selectedMatch.groupId && (
                    <span className="px-2 py-1 rounded-md text-xs font-heading bg-muted/60 text-foreground">
                      Группа: {data.groups.find(g => g.id === selectedMatch.groupId)?.name || selectedMatch.groupId}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-border/40 bg-background/40 p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-muted-foreground">Команда 1</p>
                      <p className="font-heading font-semibold text-foreground">
                        {data.teams.find(t => t.id === selectedMatch.team1Id)?.name || 'TBD'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-display font-bold text-foreground">
                        {selectedMatch.result
                          ? `${selectedMatch.result.team1Score} : ${selectedMatch.result.team2Score}`
                          : '— : —'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedMatch.status === 'completed' ? 'Матч завершён' : selectedMatch.status === 'live' ? 'Идёт матч' : 'Ожидается'}
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-muted-foreground">Команда 2</p>
                      <p className="font-heading font-semibold text-foreground">
                        {data.teams.find(t => t.id === selectedMatch.team2Id)?.name || 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Дата</p>
                    <p className="text-foreground">{selectedMatch.scheduledDate ? formatDate(selectedMatch.scheduledDate) : 'Не указана'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Время</p>
                    <p className="text-foreground">{selectedMatch.scheduledTime || 'Не указано'}</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link to={`/teams/${team.id}`} className="px-3 py-2 border rounded-lg text-sm hover:text-primary">
                    {team.name}
                  </Link>
                  {selectedOpponent && (
                    <Link to={`/teams/${selectedOpponent.id}`} className="px-3 py-2 border rounded-lg text-sm hover:text-primary">
                      {selectedOpponent.name}
                    </Link>
                  )}
                  {selectedMatch.streamLink && (
                    <a
                      href={selectedMatch.streamLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 border rounded-lg text-sm hover:text-primary inline-flex items-center gap-1"
                    >
                      <Tv size={14} /> Трансляция
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default TeamDetail;
