import React, { useState, useMemo, useEffect, useRef } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Info, Edit2, Tv, Check, X, ChevronUp, ChevronDown, ChevronsUpDown, Filter, FilterX } from 'lucide-react';
import { formatDate } from '@/lib/dateFormat';
import { TournamentMatch } from '@/types/tournament';
import { Link } from 'react-router-dom';

type SortCol = 'date' | 'time' | 'match' | 'stage' | 'format' | 'result' | 'status';
type SortDir = 'asc' | 'desc';
interface Filters { stage: string; format: string; status: string; search: string; }

const STAGE_OPTIONS = [
  { value: '', label: 'Все стадии' },
  { value: 'group', label: 'Групповой' },
  { value: 'playoff-upper', label: 'Верхняя сетка' },
  { value: 'playoff-lower', label: 'Нижняя сетка' },
  { value: 'final', label: 'Финал' },
];
const FORMAT_OPTIONS = [
  { value: '', label: 'Все форматы' },
  { value: 'Bo1', label: 'Bo1' },
  { value: 'Bo2', label: 'Bo2' },
  { value: 'Bo3', label: 'Bo3' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'scheduled', label: 'Запланирован' },
  { value: 'live', label: 'LIVE' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
];
const stageLabels: Record<string, string> = {
  group: 'Групповой',
  'playoff-upper': 'Верхняя сетка',
  'playoff-lower': 'Нижняя сетка',
  final: 'Финал',
};

const StatusBadge: React.FC<{ status: TournamentMatch['status'] }> = ({ status }) => {
  if (status === 'live')
    return <span className="px-2 py-0.5 rounded-md text-xs font-heading whitespace-nowrap bg-red-500/20 text-red-400 animate-pulse">🔴 LIVE</span>;
  if (status === 'completed')
    return <span className="px-2 py-0.5 rounded-md text-xs font-heading whitespace-nowrap bg-green-500/20 text-green-400">✅ Завершён</span>;
  if (status === 'cancelled')
    return <span className="px-2 py-0.5 rounded-md text-xs font-heading whitespace-nowrap bg-red-900/20 text-red-400/70 line-through">❌ Отменён</span>;
  return <span className="px-2 py-0.5 rounded-md text-xs font-heading whitespace-nowrap bg-muted text-muted-foreground">⏳ Запланирован</span>;
};

const SortIcon: React.FC<{ col: SortCol; active: SortCol | null; dir: SortDir }> = ({ col, active, dir }) => {
  if (active !== col) return <ChevronsUpDown size={12} className="ml-1 text-muted-foreground/40 inline" />;
  return dir === 'asc' ? <ChevronUp size={12} className="ml-1 text-primary inline" /> : <ChevronDown size={12} className="ml-1 text-primary inline" />;
};

const FilterDropdown: React.FC<{ label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; }> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Schedule: React.FC = () => {
  const { data, getTeamById, isAdmin, isEditing, updateMatch } = useTournament();
  const [filters, setFilters] = useState<Filters>({ stage: '', format: '', status: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol | null>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const [editForm, setEditForm] = useState({
    scheduledDate: '', scheduledTime: '', streamLink: '',
    status: 'scheduled' as TournamentMatch['status'],
    stage: 'group' as TournamentMatch['stage'],
    format: 'Bo2' as TournamentMatch['format'],
    score1: 0, score2: 0,
  });

  const processed = useMemo(() => {
    let list = [...data.matches];
    if (filters.stage)  list = list.filter(m => m.stage === filters.stage);
    if (filters.format) list = list.filter(m => m.format === filters.format);
    if (filters.status) list = list.filter(m => m.status === filters.status);
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(m => {
        const t1 = getTeamById(m.team1Id); const t2 = getTeamById(m.team2Id);
        return t1?.name.toLowerCase().includes(q) || t2?.name.toLowerCase().includes(q);
      });
    }
    if (sortCol) {
      list.sort((a, b) => {
        let va = '', vb = '';
        if (sortCol === 'date')   { va = a.scheduledDate || ''; vb = b.scheduledDate || ''; }
        if (sortCol === 'time')   { va = a.scheduledTime || ''; vb = b.scheduledTime || ''; }
        if (sortCol === 'stage')  { va = a.stage; vb = b.stage; }
        if (sortCol === 'format') { va = a.format; vb = b.format; }
        if (sortCol === 'status') { va = a.status; vb = b.status; }
        if (sortCol === 'match')  { va = getTeamById(a.team1Id)?.name || ''; vb = getTeamById(b.team1Id)?.name || ''; }
        if (sortCol === 'result') { va = a.result ? `${a.result.team1Score}` : ''; vb = b.result ? `${b.result.team1Score}` : ''; }
        const cmp = va.localeCompare(vb, undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [data.matches, filters, sortCol, sortDir, getTeamById]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const hasActiveFilters = !!(filters.stage || filters.format || filters.status || filters.search);
  const resetFilters = () => setFilters({ stage: '', format: '', status: '', search: '' });

  const startEditing = (matchId: string) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    setEditForm({
      scheduledDate: match.scheduledDate,
      scheduledTime: match.scheduledTime,
      streamLink: match.streamLink || '',
      status: match.status,
      stage: match.stage,
      format: match.format,
      score1: match.result?.team1Score ?? 0,
      score2: match.result?.team2Score ?? 0,
    });
    setEditingMatchId(matchId);
  };

  const saveEdit = () => {
    if (!editingMatchId) return;
    const match = data.matches.find(m => m.id === editingMatchId);
    if (!match) return;
    const hasScore = editForm.status === 'completed';
    updateMatch({
      ...match,
      scheduledDate: editForm.scheduledDate,
      scheduledTime: editForm.scheduledTime,
      streamLink: editForm.streamLink || undefined,
      status: editForm.status,
      stage: editForm.stage,
      format: editForm.format,
      result: hasScore ? { team1Score: editForm.score1, team2Score: editForm.score2 } : match.result,
    });
    setEditingMatchId(null);
  };

  const selectedMatchData = selectedMatch ? data.matches.find(m => m.id === selectedMatch) : null;
  useEffect(() => {
    if (selectedMatch && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedMatch]);

  const t1Full = selectedMatchData ? getTeamById(selectedMatchData.team1Id) : null;
  const t2Full = selectedMatchData ? getTeamById(selectedMatchData.team2Id) : null;

  const Th: React.FC<{ col: SortCol; className?: string; children: React.ReactNode }> = ({ col, className = '', children }) => (
    <th className={`py-3 px-4 text-muted-foreground font-heading text-xs uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors ${className}`} onClick={() => handleSort(col)}>
      <span className="inline-flex items-center gap-0.5">{children}<SortIcon col={col} active={sortCol} dir={sortDir} /></span>
    </th>
  );

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <h1 data-tour="schedule-title" className="font-display text-3xl md:text-5xl font-bold gradient-text mb-8 text-center">Расписание</h1>

        {/* Filter bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <input
              type="text"
              placeholder="Поиск команды..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              className="flex-1 min-w-[180px] sm:max-w-xs bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors whitespace-nowrap">
                  <FilterX size={13} /> Сбросить
                </button>
              )}
              <button
                onClick={() => setShowFilters(p => !p)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-heading rounded-lg border transition-all ${showFilters || hasActiveFilters ? 'bg-primary/10 border-primary/50 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                <Filter size={14} /> Фильтры
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                    {[filters.stage, filters.format, filters.status, filters.search].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-end">
                  <FilterDropdown label="Стадия"  value={filters.stage}  options={STAGE_OPTIONS}  onChange={v => setFilters(p => ({ ...p, stage: v }))} />
                  <FilterDropdown label="Формат"  value={filters.format} options={FORMAT_OPTIONS} onChange={v => setFilters(p => ({ ...p, format: v }))} />
                  <FilterDropdown label="Статус"  value={filters.status} options={STATUS_OPTIONS} onChange={v => setFilters(p => ({ ...p, status: v }))} />
                  <span className="text-xs text-muted-foreground pb-2">Найдено: <span className="text-foreground font-semibold">{processed.length}</span> матчей</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Match detail modal */}
        <AnimatePresence>
          {selectedMatchData && (
            <motion.div ref={detailsRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card rounded-2xl p-4 sm:p-6 mb-8 max-w-3xl mx-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-heading text-xl font-bold text-foreground">Подробности матча</h3>
                <button onClick={() => setSelectedMatch(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="flex items-center justify-center gap-3 mb-4 text-sm text-muted-foreground flex-wrap">
                <span>📅 {formatDate(selectedMatchData.scheduledDate) || 'Не назначена'}</span>
                <span>⏰ {selectedMatchData.scheduledTime || 'Не назначено'}</span>
                <span className="text-primary font-heading">{selectedMatchData.format}</span>
                <span className="text-muted-foreground font-heading">{stageLabels[selectedMatchData.stage]}</span>
                <StatusBadge status={selectedMatchData.status} />
              </div>
              {selectedMatchData.result && (
                <div className="text-center mb-4">
                  <span className="font-display text-3xl font-bold text-foreground">{selectedMatchData.result.team1Score} - {selectedMatchData.result.team2Score}</span>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {[t1Full, t2Full].map((team, idx) => (
                  <div key={idx} className="bg-background/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {team?.logo && <img src={team.logo} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                      <div>
                        {team ? (
                          <Link to={`/teams/${team.id}`} className="font-heading font-bold text-foreground text-lg hover:text-primary transition-colors">
                            {team.name}
                          </Link>
                        ) : (
                          <h4 className="font-heading font-bold text-foreground text-lg">TBD</h4>
                        )}
                        <p className="text-xs text-muted-foreground">[{team?.tag}]</p>
                      </div>
                    </div>
                    {team?.players.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 text-sm">
                        <span className="text-foreground">
                          {p.nickname || '—'}{p.isSubstitute ? ' (запасной)' : ''}
                        </span>
                        <span className="text-muted-foreground">{p.mmr} MMR</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {selectedMatchData.streamLink && (
                <a href={selectedMatchData.streamLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 btn-primary-gradient px-4 py-2 rounded-lg font-heading text-sm">
                  <Tv size={16} /> Смотреть трансляцию <ExternalLink size={14} />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <Th col="date"   className="text-left">Дата</Th>
                <Th col="time"   className="text-left">Время</Th>
                <Th col="match"  className="text-left">Матч</Th>
                <Th col="stage"  className="text-center">Стадия</Th>
                <Th col="format" className="text-center">Формат</Th>
                <Th col="result" className="text-center">Результат</Th>
                <Th col="status" className="text-center">Статус</Th>
                <th className="py-3 px-4 text-muted-foreground font-heading text-xs uppercase tracking-wider text-center">Трансляция</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {processed.map((match, i) => {
                const t1 = getTeamById(match.team1Id);
                const t2 = getTeamById(match.team2Id);
                const isCancelled = match.status === 'cancelled';
                const isEditingThis = editingMatchId === match.id;

                if (isEditingThis) {
                  return (
                    <tr key={match.id} className="border-b border-primary/30 bg-primary/5">
                      <td className="py-2 px-4">
                        <input type="date" className="bg-background border border-border rounded-lg p-1.5 text-foreground text-xs w-full focus:outline-none focus:border-primary" value={editForm.scheduledDate} onChange={e => setEditForm(p => ({ ...p, scheduledDate: e.target.value }))} />
                      </td>
                      <td className="py-2 px-4">
                        <input type="time" className="bg-background border border-border rounded-lg p-1.5 text-foreground text-xs w-full focus:outline-none focus:border-primary" value={editForm.scheduledTime} onChange={e => setEditForm(p => ({ ...p, scheduledTime: e.target.value }))} />
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {t1?.logo && <img src={t1.logo} alt="" className="w-7 h-7 rounded object-cover" />}
                          <span className="font-heading text-foreground font-semibold">{t1?.name || 'TBD'}</span>
                          <span className="text-muted-foreground text-xs">vs</span>
                          {t2?.logo && <img src={t2.logo} alt="" className="w-7 h-7 rounded object-cover" />}
                          <span className="font-heading text-foreground font-semibold">{t2?.name || 'TBD'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <select className="bg-background border border-border rounded-lg p-1.5 text-foreground text-xs w-full focus:outline-none focus:border-primary" value={editForm.stage} onChange={e => setEditForm(p => ({ ...p, stage: e.target.value as TournamentMatch['stage'] }))}>
                          <option value="group">Групповой</option>
                          <option value="playoff-upper">Верхняя сетка</option>
                          <option value="playoff-lower">Нижняя сетка</option>
                          <option value="final">Финал</option>
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <select className="bg-background border border-border rounded-lg p-1.5 text-foreground text-xs w-full focus:outline-none focus:border-primary" value={editForm.format} onChange={e => setEditForm(p => ({ ...p, format: e.target.value as TournamentMatch['format'] }))}>
                          <option value="Bo1">Bo1</option>
                          <option value="Bo2">Bo2</option>
                          <option value="Bo3">Bo3</option>
                        </select>
                      </td>
                      <td className="py-2 px-4 text-center">
                        {editForm.status === 'completed' ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input type="number" min={0} max={9} className="w-10 bg-background border rounded p-1 text-center text-foreground text-xs font-bold" value={editForm.score1} onChange={e => setEditForm(p => ({ ...p, score1: parseInt(e.target.value) || 0 }))} />
                            <span className="text-muted-foreground">:</span>
                            <input type="number" min={0} max={9} className="w-10 bg-background border rounded p-1 text-center text-foreground text-xs font-bold" value={editForm.score2} onChange={e => setEditForm(p => ({ ...p, score2: parseInt(e.target.value) || 0 }))} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <select className="bg-background border border-border rounded-lg p-1.5 text-foreground text-xs w-full focus:outline-none focus:border-primary" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}>
                          <option value="scheduled">Запланирован</option>
                          <option value="live">🔴 LIVE</option>
                          <option value="completed">Завершён</option>
                          <option value="cancelled">Отменён</option>
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <input placeholder="Twitch/YouTube" className="bg-background border border-border rounded-lg p-1.5 text-foreground text-xs w-full focus:outline-none focus:border-primary" value={editForm.streamLink} onChange={e => setEditForm(p => ({ ...p, streamLink: e.target.value }))} />
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex gap-1 justify-center">
                          <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors" title="Сохранить"><Check size={14} /></button>
                          <button onClick={() => setEditingMatchId(null)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors" title="Отмена"><X size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <motion.tr
                    key={match.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b border-border/40 transition-colors ${
                      isCancelled
                        ? 'bg-muted/5 opacity-50 hover:opacity-70'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className={`py-3 px-4 text-foreground whitespace-nowrap ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                      {formatDate(match.scheduledDate) || '—'}
                    </td>
                    <td className={`py-3 px-4 text-foreground whitespace-nowrap ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                      {match.scheduledTime || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {t1?.logo && <img src={t1.logo} alt="" className="w-7 h-7 rounded object-cover" />}
                        <span className={`font-heading font-semibold text-foreground ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>{t1?.name || 'TBD'}</span>
                        <span className="text-muted-foreground text-xs">vs</span>
                        {t2?.logo && <img src={t2.logo} alt="" className="w-7 h-7 rounded object-cover" />}
                        <span className={`font-heading font-semibold text-foreground ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>{t2?.name || 'TBD'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-heading text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md whitespace-nowrap">{stageLabels[match.stage] || match.stage}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-heading font-bold px-2 py-0.5 rounded-md ${isCancelled ? 'text-muted-foreground bg-muted/30' : 'text-primary bg-primary/10'}`}>{match.format}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-heading font-bold text-foreground">
                      {match.result ? `${match.result.team1Score} - ${match.result.team2Score}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={match.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {match.streamLink && !isCancelled ? (
                        <a href={match.streamLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-heading"><Tv size={13} /> Смотреть</a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setSelectedMatch(match.id)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors" title="Подробности"><Info size={14} /></button>
                        {isAdmin && isEditing && (
                          <button onClick={() => startEditing(match.id)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors" title="Редактировать"><Edit2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {processed.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {hasActiveFilters ? 'Матчей не найдено — попробуй изменить фильтры' : 'Матчей пока нет'}
            </div>
          )}
        </div>
        {processed.length > 0 && (
          <p className="text-xs text-muted-foreground text-right mt-3">Показано {processed.length} из {data.matches.length} матчей</p>
        )}
      </div>
    </PageLayout>
  );
};

export default Schedule;
