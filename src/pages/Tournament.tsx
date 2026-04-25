import React, { useState, useRef, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Tv, Edit2, Check, X, Trophy, Crown, Link, Move } from 'lucide-react';
import { TournamentMatch, Group, BracketConnection } from '@/types/tournament';
import { formatDate } from '@/lib/dateFormat';
import { Link as RouterLink } from 'react-router-dom';

const STAGE_LABELS: Record<TournamentMatch['stage'], string> = {
  group: 'Групповой этап',
  'playoff-upper': 'Верхняя сетка',
  'playoff-lower': 'Нижняя сетка',
  final: 'Финал',
};

const GROUP_ROUND_TIMES: Record<number, string> = {
  1: '13:00',
  2: '14:20',
  3: '15:40',
  4: '17:00',
  5: '18:20',
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface MatchEditState {
  team1Id: string;
  team2Id: string;
  format: TournamentMatch['format'];
  stage: TournamentMatch['stage'];
  status: TournamentMatch['status'];
  scheduledDate: string;
  scheduledTime: string;
  streamLink: string;
  round: number;
  score1: number;
  score2: number;
}
function initEdit(m: TournamentMatch): MatchEditState {
  return {
    team1Id: m.team1Id || '',
    team2Id: m.team2Id || '',
    format: m.format, stage: m.stage, status: m.status,
    scheduledDate: m.scheduledDate, scheduledTime: m.scheduledTime,
    streamLink: m.streamLink || '', round: m.round || 1,
    score1: m.result?.team1Score ?? 0, score2: m.result?.team2Score ?? 0,
  };
}

// ─── Inline MatchCard (for match list below bracket) ────────────────────────
const MatchCard: React.FC<{ match: TournamentMatch; onOpenDetails?: (match: TournamentMatch) => void }> = ({ match, onOpenDetails }) => {
  const { getTeamById, isAdmin, isEditing, updateMatch, deleteMatch } = useTournament();
  const t1 = getTeamById(match.team1Id);
  const t2 = getTeamById(match.team2Id);
  const [editing, setEditing] = useState(false);
  const [ed, setEd] = useState<MatchEditState>(() => initEdit(match));

  const saveEdit = () => {
    updateMatch({
      ...match, team1Id: ed.team1Id, team2Id: ed.team2Id, format: ed.format, stage: ed.stage, status: ed.status,
      scheduledDate: ed.scheduledDate, scheduledTime: ed.scheduledTime,
      streamLink: ed.streamLink || undefined, round: ed.round,
      result: (ed.status === 'completed' || ed.status === 'live')
        ? { team1Score: ed.score1, team2Score: ed.score2 }
        : undefined,
    });
    setEditing(false);
  };

  // Determine required wins from format (e.g. Bo3 -> 2)
  const winsRequired = React.useMemo(() => {
    try {
      const m = String(match.format).match(/Bo(\d+)/i);
      if (m) return Math.ceil(parseInt(m[1], 10) / 2) || 1;
    } catch {}
    return 1;
  }, [match.format]);

  const t1Win = !!(match.result && match.result.team1Score >= winsRequired && match.result.team1Score > match.result.team2Score);
  const t2Win = !!(match.result && match.result.team2Score >= winsRequired && match.result.team2Score > match.result.team1Score);

  return (
    <div
      onClick={() => {
        if (!editing && onOpenDetails) onOpenDetails(match);
      }}
      className={`glass-card rounded-xl p-4 ${match.status === 'live' ? 'ring-1 ring-red-500/40' : ''} ${match.status === 'completed' ? 'border border-green-500/45 ring-1 ring-green-500/20' : ''} ${match.status === 'cancelled' ? 'opacity-50' : ''} ${!editing && onOpenDetails ? 'cursor-pointer' : ''}`}
    >
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Формат</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={ed.format} onChange={e => setEd(p => ({ ...p, format: e.target.value as TournamentMatch['format'] }))}>
                <option value="Bo1">Bo1</option><option value="Bo2">Bo2</option><option value="Bo3">Bo3</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Стадия</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={ed.stage} onChange={e => setEd(p => ({ ...p, stage: e.target.value as TournamentMatch['stage'] }))}>
                <option value="group">Групповой</option>
                <option value="playoff-upper">Верхняя сетка</option>
                <option value="playoff-lower">Нижняя сетка</option>
                <option value="final">Финал</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Статус</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={ed.status} onChange={e => setEd(p => ({ ...p, status: e.target.value as TournamentMatch['status'] }))}>
                <option value="scheduled">Запланирован</option>
                <option value="live">LIVE</option>
                <option value="completed">Завершён</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Раунд</label>
              <input type="number" min={1} className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={ed.round} onChange={e => setEd(p => ({ ...p, round: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Дата</label>
              <input type="date" className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={ed.scheduledDate} onChange={e => setEd(p => ({ ...p, scheduledDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Время</label>
              <input type="time" className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={ed.scheduledTime} onChange={e => setEd(p => ({ ...p, scheduledTime: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Трансляция</label>
              <input className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="https://twitch.tv/..." value={ed.streamLink} onChange={e => setEd(p => ({ ...p, streamLink: e.target.value }))} />
            </div>
          </div>
          {(ed.status === 'completed' || ed.status === 'live') && (
            <div className="flex items-center gap-3 bg-background/50 rounded-lg px-4 py-3">
              <span className="text-sm text-muted-foreground font-heading">{t1?.name || 'TBD'}</span>
              <input type="number" min={0} max={9} className="w-14 bg-background border rounded p-1 text-center text-foreground font-bold" value={ed.score1} onChange={e => setEd(p => ({ ...p, score1: parseInt(e.target.value) || 0 }))} />
              <span className="text-muted-foreground font-bold">:</span>
              <input type="number" min={0} max={9} className="w-14 bg-background border rounded p-1 text-center text-foreground font-bold" value={ed.score2} onChange={e => setEd(p => ({ ...p, score2: parseInt(e.target.value) || 0 }))} />
              <span className="text-sm text-muted-foreground font-heading">{t2?.name || 'TBD'}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-heading"><Check size={14} /> Сохранить</button>
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-heading"><X size={14} /> Отмена</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-heading">{match.format}</span>
            <div className="flex items-center gap-2">
              {t1?.logo && <img src={t1.logo} alt="" className="w-7 h-7 rounded object-cover" />}
              <span className={`font-heading font-semibold text-base ${t1Win ? 'text-primary' : 'text-foreground'}`}>{t1?.name || 'TBD'}</span>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div className="flex items-center gap-2">
              {t2?.logo && <img src={t2.logo} alt="" className="w-7 h-7 rounded object-cover" />}
              <span className={`font-heading font-semibold text-base ${t2Win ? 'text-primary' : 'text-foreground'}`}>{t2?.name || 'TBD'}</span>
            </div>
            {match.result && <span className="font-heading font-bold text-lg text-foreground">{match.result.team1Score} — {match.result.team2Score}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {match.streamLink && <a href={match.streamLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-primary hover:underline font-heading flex items-center gap-1"><Tv size={12} /> Трансляция</a>}
            {isAdmin && isEditing && (
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); setEd(initEdit(match)); setEditing(true); }} className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Edit2 size={14} /></button>
                <button onClick={e => { e.stopPropagation(); deleteMatch(match.id); }} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NODE-EDITOR BRACKET
// ═══════════════════════════════════════════════════════════════════════════════

// Extended match with canvas position
interface MatchNode extends TournamentMatch {
  nodeX: number;
  nodeY: number;
}

// Connection between two match nodes: winner of 'from' feeds into 'to'
interface NodeConnection extends BracketConnection {}

// ─── Card dimensions ─────────────────────────────────────────────────────────
const NODE_W = 272;
const NODE_H = 96; // header(28) + team(34) + divider(1) + team(34) ≈ 97
const PORT_R = 6;  // radius of connection port circles

// ─── Node Card (draggable) ───────────────────────────────────────────────────
interface NodeCardProps {
  match: MatchNode;
  isAdmin: boolean;
  isEditing: boolean;
  connectMode: boolean;
  connectingFrom: string | null;
  zoom: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onWin: (id: string, team: 1 | 2) => void;
  onStartConnect: (fromId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  match, isAdmin, isEditing, connectMode, connectingFrom,
  zoom, onDragEnd, onWin, onStartConnect, onDelete, onEdit,
}) => {
  const { getTeamById } = useTournament();
  const t1 = getTeamById(match.team1Id);
  const t2 = getTeamById(match.team2Id);

  // Determine required wins from format (e.g. Bo3 -> 2)
  const nodeWinsRequired = React.useMemo(() => {
    try {
      const m = String(match.format).match(/Bo(\d+)/i);
      if (m) return Math.ceil(parseInt(m[1], 10) / 2) || 1;
    } catch {}
    return 1;
  }, [match.format]);

  const t1Win = !!(match.result && match.result.team1Score >= nodeWinsRequired && match.result.team1Score > match.result.team2Score);
  const t2Win = !!(match.result && match.result.team2Score >= nodeWinsRequired && match.result.team2Score > match.result.team1Score);
  const isFinal = match.stage === 'final';
  const cancelled = match.status === 'cancelled';

  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState({ x: match.nodeX, y: match.nodeY });
  const [dragging, setDragging] = useState(false);

  // Keep pos in sync if match moves externally (e.g. auto-layout)
  useEffect(() => { setPos({ x: match.nodeX, y: match.nodeY }); }, [match.nodeX, match.nodeY]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    if (connectMode) {
      // In connect mode: left click on card = select/connect
      if (e.button === 0) {
        e.stopPropagation();
        onStartConnect(match.id);
      }
      return;
    }
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (e.clientX - dragStart.current.mx) / zoom;
      const dy = (e.clientY - dragStart.current.my) / zoom;
      setPos({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    };
    const onUp = (e: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (e.clientX - dragStart.current.mx) / zoom;
      const dy = (e.clientY - dragStart.current.my) / zoom;
      const nx = dragStart.current.ox + dx;
      const ny = dragStart.current.oy + dy;
      onDragEnd(match.id, nx, ny);
      dragStart.current = null;
      setDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, match.id, onDragEnd, zoom]);

  const stageColor = isFinal
    ? 'border-yellow-400/50 shadow-yellow-400/10'
    : match.stage === 'playoff-upper'
    ? 'border-blue-500/40'
    : match.stage === 'playoff-lower'
    ? 'border-red-500/40'
    : 'border-border/50';

  const stageBg = isFinal ? 'bg-yellow-400/5' : 'bg-muted/20';

  return (
    <div
      ref={nodeRef}
      data-match-id={match.id}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: NODE_W,
        zIndex: dragging ? 100 : 1,
        cursor: connectMode ? 'pointer' : isEditing ? (dragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
      }}
      className={`rounded-xl overflow-hidden border shadow-lg ${stageColor} ${cancelled ? 'opacity-40' : ''} ${match.status === 'live' ? 'ring-1 ring-red-500/60' : ''} ${match.status === 'completed' ? 'ring-1 ring-green-500/45 border-green-500/55' : ''} bg-card transition-shadow ${dragging ? 'shadow-2xl shadow-primary/20' : ''} ${connectingFrom === match.id ? 'ring-2 ring-primary' : ''} ${!match.team1Id && !match.team2Id ? 'border-dashed opacity-75' : ''}`}
      onMouseDown={onMouseDown}
      onDoubleClick={() => {
        if (isAdmin && isEditing && !connectMode) onEdit(match.id);
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b border-border/20 ${stageBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isEditing && !connectMode && (
            <Move size={11} className="text-muted-foreground/40 flex-shrink-0" />
          )}
          <span className="text-[10px] font-heading text-muted-foreground tracking-wider">{match.format}</span>
          <span className={`text-[9px] font-heading px-1.5 py-0.5 rounded-full ${
            match.stage === 'final' ? 'bg-yellow-400/20 text-yellow-300' :
            match.stage === 'playoff-upper' ? 'bg-blue-500/20 text-blue-300' :
            match.stage === 'playoff-lower' ? 'bg-red-500/20 text-red-300' :
            'bg-muted text-muted-foreground'
          }`}>
            {match.stage === 'final' ? '🏆 Финал' : match.stage === 'playoff-upper' ? '▲ Верх' : match.stage === 'playoff-lower' ? '▼ Низ' : 'Группа'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2" data-no-drag="1">
          {(match.scheduledDate || match.scheduledTime) && (
            <span className="text-[9px] text-muted-foreground/50">{formatDate(match.scheduledDate)} {match.scheduledTime}</span>
          )}
          {match.status === 'live' && <span className="text-[9px] text-red-400 animate-pulse font-bold">● LIVE</span>}
          {match.status === 'completed' && <span className="text-[9px] text-green-400">✓</span>}
          {match.streamLink && (
            <a href={match.streamLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <Tv size={9} className="text-primary" />
            </a>
          )}
          {isAdmin && isEditing && !connectMode && (
            <button data-no-drag="1" onClick={() => onDelete(match.id)} className="ml-1 text-muted-foreground/40 hover:text-destructive transition-colors">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Team 1 */}
      <div
        data-no-drag="1"
        className={`flex items-center justify-between px-3 py-2 transition-colors ${t1Win ? 'bg-primary/10' : ''} ${isEditing && !connectMode && match.team1Id ? 'cursor-pointer hover:bg-muted/20' : ''}`}
        onClick={() => { if (isEditing && !connectMode && match.team1Id) onWin(match.id, 1); }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {t1?.logo
            ? <img src={t1.logo} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
            : <div className="w-6 h-6 rounded bg-muted flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground">{t1?.tag?.[0] || '?'}</div>
          }
          <span className={`text-sm font-heading truncate ${t1Win ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
            {t1?.name || <span className="italic text-muted-foreground/40 text-xs">TBD</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
          {t1Win && (isFinal ? <Trophy size={13} className="text-yellow-400" /> : <Crown size={12} className="text-yellow-400" />)}
          <span className={`text-sm font-heading font-bold tabular-nums w-4 text-right ${t1Win ? 'text-primary' : 'text-muted-foreground/40'}`}>
            {match.result != null ? match.result.team1Score : '—'}
          </span>
        </div>
      </div>

      <div className="border-t border-border/20" />

      {/* Team 2 */}
      <div
        data-no-drag="1"
        className={`flex items-center justify-between px-3 py-2 transition-colors ${t2Win ? 'bg-primary/10' : ''} ${isEditing && !connectMode && match.team2Id ? 'cursor-pointer hover:bg-muted/20' : ''}`}
        onClick={() => { if (isEditing && !connectMode && match.team2Id) onWin(match.id, 2); }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {t2?.logo
            ? <img src={t2.logo} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
            : <div className="w-6 h-6 rounded bg-muted flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground">{t2?.tag?.[0] || '?'}</div>
          }
          <span className={`text-sm font-heading truncate ${t2Win ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
            {t2?.name || <span className="italic text-muted-foreground/40 text-xs">TBD</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
          {t2Win && (isFinal ? <Trophy size={13} className="text-yellow-400" /> : <Crown size={12} className="text-yellow-400" />)}
          <span className={`text-sm font-heading font-bold tabular-nums w-4 text-right ${t2Win ? 'text-primary' : 'text-muted-foreground/40'}`}>
            {match.result != null ? match.result.team2Score : '—'}
          </span>
        </div>
      </div>

      {/* Connect port — right side output */}
      {isEditing && connectMode && (
        <div
          data-no-drag="1"
          title="Потяни соединение от этого матча"
          onClick={() => onStartConnect(match.id)}
          style={{
            position: 'absolute', right: -PORT_R - 2, top: '50%',
            transform: 'translateY(-50%)',
            width: PORT_R * 2 + 4, height: PORT_R * 2 + 4,
            borderRadius: '50%',
            background: connectingFrom === match.id ? 'var(--primary)' : 'var(--card)',
            border: '2px solid var(--primary)',
            cursor: 'pointer',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

// ─── Bezier connection line ──────────────────────────────────────────────────
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ─── Node positions are stored directly in each match (nodeX/nodeY fields in data.json)
// No localStorage needed — positions are synced to GitHub with all other data.
function loadPositions(): Record<string, { x: number; y: number }> { return {}; }
function savePositions(_ps: Record<string, { x: number; y: number }>) { /* no-op: positions saved per match via updateMatch */ }

// ─── Auto-layout: arrange nodes in columns by round ─────────────────────────
function autoLayout(matches: TournamentMatch[]): Record<string, { x: number; y: number }> {
  const COL_W = NODE_W + 80;
  const ROW_H = NODE_H + 36;

  // Separate upper, lower, final
  const upper = matches.filter(m => m.stage === 'playoff-upper');
  const lower = matches.filter(m => m.stage === 'playoff-lower');
  const finals = matches.filter(m => m.stage === 'final');

  const byRound = (ms: TournamentMatch[]) => {
    const map: Record<number, TournamentMatch[]> = {};
    ms.forEach(m => { const r = m.round ?? 1; if (!map[r]) map[r] = []; map[r].push(m); });
    return map;
  };

  const result: Record<string, { x: number; y: number }> = {};

  // Upper bracket starts at top (y offset 32)
  const upperRows = byRound(upper);
  const upperRounds = Object.keys(upperRows).map(Number).sort((a, b) => a - b);
  upperRounds.forEach((r, colIdx) => {
    upperRows[r].forEach((m, rowIdx) => {
      result[m.id] = { x: 32 + colIdx * COL_W, y: 32 + rowIdx * ROW_H };
    });
  });

  // Lower bracket starts below upper (y offset = upper height + gap)
  const maxUpperRows = Math.max(1, ...upperRounds.map(r => upperRows[r].length));
  const lowerOffsetY = 32 + maxUpperRows * ROW_H + 60;
  const lowerRows = byRound(lower);
  const lowerRounds = Object.keys(lowerRows).map(Number).sort((a, b) => a - b);
  lowerRounds.forEach((r, colIdx) => {
    lowerRows[r].forEach((m, rowIdx) => {
      result[m.id] = { x: 32 + colIdx * COL_W, y: lowerOffsetY + rowIdx * ROW_H };
    });
  });

  // Final — after all upper rounds, vertically centred
  const maxCols = Math.max(upperRounds.length, lowerRounds.length);
  finals.forEach((m, rowIdx) => {
    result[m.id] = { x: 32 + maxCols * COL_W, y: 32 + rowIdx * ROW_H };
  });

  return result;
}

// ─── Main Node Editor ────────────────────────────────────────────────────────
const NodeBracketEditor: React.FC = () => {
  const { data, isAdmin, isEditing, updateMatch, deleteMatch, updateBracketConnections } = useTournament();
  // Stable ref to updateMatch to use inside effects without causing infinite loops
  const updateMatchRef = useRef(updateMatch);
  useEffect(() => { updateMatchRef.current = updateMatch; }, [updateMatch]);

  const bracketMatches = data.matches.filter(m => m.stage !== 'group');

  // Build initial positions from match data (nodeX/nodeY stored in data.json)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const fromMatches: Record<string, { x: number; y: number }> = {};
    // will be populated in useEffect below
    return fromMatches;
  });
  const [connections, setConnections] = useState<NodeConnection[]>(data.bracketConnections || []);
  const [connectMode, setConnectMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [canvasSize] = useState({ w: 2400, h: 1200 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeEditState, setNodeEditState] = useState<MatchEditState | null>(null);
  const panStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const persistConnections = useCallback((next: NodeConnection[]) => {
    setConnections(next);
    updateBracketConnections(next);
  }, [updateBracketConnections]);

  useEffect(() => {
    setConnections(data.bracketConnections || []);
  }, [data.bracketConnections]);

  // Sync positions from match data (nodeX/nodeY). Auto-layout only for matches with no saved position.
  useEffect(() => {
    const fromData: Record<string, { x: number; y: number }> = {};
    bracketMatches.forEach(m => {
      if (m.nodeX !== undefined && m.nodeY !== undefined) {
        fromData[m.id] = { x: m.nodeX, y: m.nodeY };
      }
    });
    const missing = bracketMatches.filter(m => !fromData[m.id]);
    const autoPos = missing.length > 0 ? autoLayout(bracketMatches) : {};
    
    setPositions(prev => {
      const next: Record<string, { x: number; y: number }> = { ...prev, ...fromData };
      missing.forEach(m => { next[m.id] = autoPos[m.id] ?? { x: 32, y: 32 }; });
      return next;
    });

    // Persist auto-assigned positions to data.json for newly added matches
    if (missing.length > 0) {
      missing.forEach(m => {
        const pos = autoPos[m.id] ?? { x: 32, y: 32 };
        updateMatchRef.current({ ...m, nodeX: Math.round(pos.x), nodeY: Math.round(pos.y) });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracketMatches.map(m => m.id + ':' + (m.nodeX ?? '') + ':' + (m.nodeY ?? '')).join(',')]);

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
    // Persist to data.json via updateMatch so all users see the saved layout
    const match = data.matches.find(m => m.id === id);
    if (match) {
      updateMatch({ ...match, nodeX: Math.round(x), nodeY: Math.round(y) });
    }
  }, [data.matches, updateMatch]);

  const handleWin = useCallback((matchId: string, team: 1 | 2) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    const winsNeeded = match.format === 'Bo3' ? 2 : match.format === 'Bo2' ? 2 : 1;
    const cur1 = match.result?.team1Score ?? 0;
    const cur2 = match.result?.team2Score ?? 0;
    const currentWinner = match.result
      ? (match.result.team1Score > match.result.team2Score ? 1 : match.result.team2Score > match.result.team1Score ? 2 : null)
      : null;
    // Click same winner again -> reset
    if (currentWinner === team && match.status === 'completed') {
      updateMatch({ ...match, status: 'scheduled', result: undefined });
      return;
    }
    const newScore1 = team === 1 ? cur1 + 1 : cur1;
    const newScore2 = team === 2 ? cur2 + 1 : cur2;
    const isComplete = newScore1 >= winsNeeded || newScore2 >= winsNeeded;
    const nextStatus: TournamentMatch['status'] = isComplete ? 'completed' : 'live';
    updateMatch({
      ...match,
      status: nextStatus,
      result: { team1Score: newScore1, team2Score: newScore2 },
    });
  }, [data.matches, updateMatch]);

  const handleStartConnect = (fromId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(fromId);
    } else if (connectingFrom !== fromId) {
      // Create connection: fromId → fromId's winner feeds into 'fromId'... 
      // Actually: connectingFrom is the SOURCE, clicked node is DEST
      const existing = connections.filter(
        c => !(c.fromMatchId === connectingFrom && c.toMatchId === fromId)
      );
      // Determine which slot in dest is free
      const destMatch = bracketMatches.find(m => m.id === fromId);
      const slot1Taken = connections.some(c => c.toMatchId === fromId && c.toSlot === 1);
      const toSlot: 1 | 2 = slot1Taken ? 2 : 1;
      const newConn: NodeConnection = {
        id: `${connectingFrom}->${fromId}`,
        fromMatchId: connectingFrom,
        toMatchId: fromId,
        toSlot,
      };
      const next = [...existing, newConn];
      persistConnections(next);
      setConnectingFrom(null);
    } else {
      setConnectingFrom(null);
    }
  };

  const handleDeleteConnection = (id: string) => {
    const next = connections.filter(c => c.id !== id);
    persistConnections(next);
  };

  const handleEditNode = (matchId: string) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    setEditingNodeId(matchId);
    setNodeEditState(initEdit(match));
  };

  const handleSaveNodeEdit = () => {
    if (!editingNodeId || !nodeEditState) return;
    const match = data.matches.find(m => m.id === editingNodeId);
    if (!match) return;
    updateMatch({
      ...match,
      team1Id: nodeEditState.team1Id,
      team2Id: nodeEditState.team2Id,
      format: nodeEditState.format,
      stage: nodeEditState.stage,
      status: nodeEditState.status,
      scheduledDate: nodeEditState.scheduledDate,
      scheduledTime: nodeEditState.scheduledTime,
      streamLink: nodeEditState.streamLink || undefined,
      round: nodeEditState.round,
      result: (nodeEditState.status === 'completed' || nodeEditState.status === 'live')
        ? { team1Score: nodeEditState.score1, team2Score: nodeEditState.score2 }
        : undefined,
    });
    setEditingNodeId(null);
    setNodeEditState(null);
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(prev => Math.min(2.2, Math.max(0.45, +(prev + delta).toFixed(2))));
  };

  const handleAutoLayout = () => {
    const autoPos = autoLayout(bracketMatches);
    setPositions(autoPos);
    // Persist positions to data.json for all bracket matches
    bracketMatches.forEach(m => {
      const pos = autoPos[m.id];
      if (pos) updateMatch({ ...m, nodeX: Math.round(pos.x), nodeY: Math.round(pos.y) });
    });
  };

  // Canvas pan with middle mouse / right mouse
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      panStart.current = { mx: e.clientX, my: e.clientY, ox: pan.x, oy: pan.y };
      setPanning(true);
    }
    // In connect mode, clicking EMPTY canvas cancels connect
    // Cards call e.stopPropagation() so this only fires for empty canvas
    if (connectMode && e.button === 0 && e.target === e.currentTarget) {
      setConnectingFrom(null);
    }
  };

  useEffect(() => {
    if (!panning) return;
    const onMove = (e: MouseEvent) => {
      if (!panStart.current) return;
      setPan({ x: panStart.current.ox + e.clientX - panStart.current.mx, y: panStart.current.oy + e.clientY - panStart.current.my });
    };
    const onUp = () => { panStart.current = null; setPanning(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [panning]);

  // Compute SVG connection paths
  const connectionPaths = connections.map(conn => {
    const from = positions[conn.fromMatchId];
    const to   = positions[conn.toMatchId];
    if (!from || !to) return null;
    // Output port: right-center of source card
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    // Input port: left side of destination, team 1 or 2 row
    const x2 = to.x;
    const slotOffset = conn.toSlot === 1 ? NODE_H * 0.35 : NODE_H * 0.72;
    const y2 = to.y + slotOffset;

    const stageFrom = bracketMatches.find(m => m.id === conn.fromMatchId)?.stage;
    const color = stageFrom === 'playoff-upper' ? 'rgba(96,165,250,0.55)'
                : stageFrom === 'playoff-lower' ? 'rgba(248,113,113,0.55)'
                : stageFrom === 'final'         ? 'rgba(250,200,50,0.55)'
                : 'rgba(255,255,255,0.25)';

    return { ...conn, path: bezierPath(x1, y1, x2, y2), color };
  }).filter(Boolean) as (NodeConnection & { path: string; color: string })[];

  const isEmpty = bracketMatches.length === 0;

  if (isEmpty && !(isAdmin && isEditing)) {
    return <div className="text-center py-20 text-muted-foreground">Сетка плей-офф ещё не сформирована</div>;
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {isAdmin && isEditing && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setConnectMode(m => !m); setConnectingFrom(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-heading transition-all border ${
              connectMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link size={13} /> {connectMode ? 'Режим соединений ON' : 'Соединить узлы'}
          </button>
          {connectMode && connectingFrom && (
            <span className="text-xs text-primary animate-pulse font-heading">
              Выбери узел-получатель…
            </span>
          )}
          <button onClick={handleAutoLayout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-heading border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={13} /> Авто-расстановка
          </button>
          <div className="flex items-center gap-1 border border-border rounded-lg px-2 py-1">
            <button onClick={() => setZoom(z => Math.max(0.45, +(z - 0.1).toFixed(2)))} className="text-xs text-muted-foreground hover:text-foreground px-1" title="Уменьшить">−</button>
            <span className="text-xs text-muted-foreground min-w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.2, +(z + 0.1).toFixed(2)))} className="text-xs text-muted-foreground hover:text-foreground px-1" title="Увеличить">+</button>
            <button onClick={() => setZoom(1)} className="text-xs text-primary hover:underline px-1" title="Сбросить масштаб">1:1</button>
          </div>
          <span className="text-xs text-muted-foreground/50 ml-auto hidden md:block">
            Ctrl + колесо / +/- — масштаб · ПКМ / средняя — панорама
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 font-heading flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-blue-400/70 inline-block" /> Верхняя сетка</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-red-400/70 inline-block" /> Нижняя сетка</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-yellow-400/70 inline-block" /> Финал</span>
        {isAdmin && isEditing && <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-foreground/30 inline-block" /> Кликни команду = победитель</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-heading">Масштаб сетки:</span>
        <button onClick={() => setZoom(z => Math.max(0.45, +(z - 0.1).toFixed(2)))} className="px-2 py-0.5 border border-border rounded hover:text-foreground">−</button>
        <span className="min-w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(2.2, +(z + 0.1).toFixed(2)))} className="px-2 py-0.5 border border-border rounded hover:text-foreground">+</button>
        <button onClick={() => setZoom(1)} className="text-primary hover:underline">Сброс</button>
      </div>

      {/* Canvas */}
      <div
        className="glass-card rounded-2xl overflow-hidden border border-border/30"
        style={{ height: 'min(70vh, 600px)', position: 'relative' }}
      >
        <div
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            cursor: panning ? 'grabbing' : connectMode ? 'crosshair' : 'default',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 70%)',
          }}
          onMouseDown={onCanvasMouseDown}
          onWheel={handleCanvasWheel}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Dot grid background */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="dotgrid" x={pan.x % 28} y={pan.y % 28} width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>

          {/* Transformed canvas content */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: canvasSize.w, height: canvasSize.h }}>
            {/* SVG connections layer */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
              {connectionPaths.map(conn => (
                <g key={conn.id}>
                  {/* Glow */}
                  <path d={conn.path} fill="none" stroke={conn.color} strokeWidth="6" strokeOpacity="0.15" strokeLinecap="round" />
                  {/* Main line */}
                  <path d={conn.path} fill="none" stroke={conn.color} strokeWidth="2" strokeLinecap="round" />
                  {/* Delete button on hover — midpoint */}
                  {isAdmin && isEditing && (
                    <foreignObject
                      x={(() => { const pts = conn.path.match(/[\d.]+/g)!.map(Number); return (pts[0] + pts[6]) / 2 - 8; })()}
                      y={(() => { const pts = conn.path.match(/[\d.]+/g)!.map(Number); return (pts[1] + pts[7]) / 2 - 8; })()}
                      width="16" height="16"
                      style={{ pointerEvents: 'all' }}
                    >
                      <div
                        style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--destructive)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85 }}
                        onClick={() => handleDeleteConnection(conn.id)}
                        title="Удалить связь"
                      >
                        <X style={{ width: 9, height: 9, color: 'white' }} />
                      </div>
                    </foreignObject>
                  )}
                </g>
              ))}
            </svg>

            {/* Nodes */}
            {bracketMatches.map(match => {
              const pos = positions[match.id] ?? { x: 32, y: 32 };
              const node: MatchNode = { ...match, nodeX: pos.x, nodeY: pos.y };
              return (
                <NodeCard
                  key={match.id}
                  match={node}
                  isAdmin={isAdmin}
                  isEditing={isEditing}
                  connectMode={connectMode}
                  connectingFrom={connectingFrom}
                  zoom={zoom}
                  onDragEnd={handleDragEnd}
                  onWin={handleWin}
                  onStartConnect={handleStartConnect}
                  onDelete={deleteMatch}
                  onEdit={handleEditNode}
                />
              );
            })}

            {isEmpty && isAdmin && isEditing && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground/50 text-sm pointer-events-none">
                Добавь матчи через панель выше →
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && isEditing && editingNodeId && nodeEditState && (
        <div className="glass-card rounded-xl p-4 border border-primary/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-heading font-semibold text-sm text-foreground">Редактирование блока</h4>
            <button onClick={() => { setEditingNodeId(null); setNodeEditState(null); }} className="text-xs text-muted-foreground hover:text-foreground">Закрыть</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Команда 1</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.team1Id} onChange={e => setNodeEditState(p => p ? ({ ...p, team1Id: e.target.value }) : p)}>
                <option value="">TBD</option>
                {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Команда 2</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.team2Id} onChange={e => setNodeEditState(p => p ? ({ ...p, team2Id: e.target.value }) : p)}>
                <option value="">TBD</option>
                {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Формат</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.format} onChange={e => setNodeEditState(p => p ? ({ ...p, format: e.target.value as TournamentMatch['format'] }) : p)}>
                <option value="Bo1">Bo1</option><option value="Bo2">Bo2</option><option value="Bo3">Bo3</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Стадия</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.stage} onChange={e => setNodeEditState(p => p ? ({ ...p, stage: e.target.value as TournamentMatch['stage'] }) : p)}>
                <option value="playoff-upper">Верхняя сетка</option>
                <option value="playoff-lower">Нижняя сетка</option>
                <option value="final">Финал</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Статус</label>
              <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.status} onChange={e => setNodeEditState(p => p ? ({ ...p, status: e.target.value as TournamentMatch['status'] }) : p)}>
                <option value="scheduled">Запланирован</option>
                <option value="live">LIVE</option>
                <option value="completed">Завершён</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Раунд</label>
              <input type="number" min={1} className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.round} onChange={e => setNodeEditState(p => p ? ({ ...p, round: parseInt(e.target.value) || 1 }) : p)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Дата</label>
              <input type="date" className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.scheduledDate} onChange={e => setNodeEditState(p => p ? ({ ...p, scheduledDate: e.target.value }) : p)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Время</label>
              <input type="time" className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={nodeEditState.scheduledTime} onChange={e => setNodeEditState(p => p ? ({ ...p, scheduledTime: e.target.value }) : p)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Трансляция</label>
              <input className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="https://twitch.tv/..." value={nodeEditState.streamLink} onChange={e => setNodeEditState(p => p ? ({ ...p, streamLink: e.target.value }) : p)} />
            </div>
          </div>
          {(nodeEditState.status === 'completed' || nodeEditState.status === 'live') && (
            <div className="flex items-center gap-3 bg-background/50 rounded-lg px-4 py-3 mt-3">
              <span className="text-sm text-muted-foreground font-heading">Счёт</span>
              <input type="number" min={0} max={9} className="w-14 bg-background border rounded p-1 text-center text-foreground font-bold" value={nodeEditState.score1} onChange={e => setNodeEditState(p => p ? ({ ...p, score1: parseInt(e.target.value) || 0 }) : p)} />
              <span className="text-muted-foreground font-bold">:</span>
              <input type="number" min={0} max={9} className="w-14 bg-background border rounded p-1 text-center text-foreground font-bold" value={nodeEditState.score2} onChange={e => setNodeEditState(p => p ? ({ ...p, score2: parseInt(e.target.value) || 0 }) : p)} />
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={handleSaveNodeEdit} className="flex items-center gap-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-heading"><Check size={14} /> Сохранить блок</button>
            <button onClick={() => { setEditingNodeId(null); setNodeEditState(null); }} className="flex items-center gap-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-heading"><X size={14} /> Отмена</button>
          </div>
        </div>
      )}

      {/* Connection list for deleting */}
      {isAdmin && isEditing && connections.length > 0 && (
        <div className="text-xs text-muted-foreground/60 font-heading">
          {connections.length} соединений.{' '}
          <button onClick={() => persistConnections([])} className="text-destructive hover:underline">
            Сбросить все
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Auto-generate Double Elimination bracket ─────────────────────────────────
function buildDoubleElimMatches(teams: { id: string; status?: string }[]): TournamentMatch[] {
  const active = teams.filter(t => t.status !== 'withdrawn' && t.status !== 'disqualified');
  if (active.length < 2) return [];

  const n = Math.pow(2, Math.ceil(Math.log2(active.length)));
  const seeded: (string | null)[] = [...active.map(t => t.id)];
  while (seeded.length < n) seeded.push(null);

  const now = Date.now();
  const newMatches: TournamentMatch[] = [];
  let id = now;

  const upperR1: TournamentMatch[] = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const t1 = seeded[i]; const t2 = seeded[i + 1];
    if (!t1 && !t2) continue;
    upperR1.push({ id: `${id++}`, team1Id: t1 ?? '', team2Id: t2 ?? '', stage: 'playoff-upper', format: 'Bo1', round: 1, scheduledDate: '', scheduledTime: '', status: 'scheduled' });
  }
  newMatches.push(...upperR1);

  let prev = upperR1; let r = 2;
  while (prev.length > 1) {
    const next: TournamentMatch[] = [];
    for (let i = 0; i < Math.ceil(prev.length / 2); i++) {
      next.push({ id: `${id++}`, team1Id: '', team2Id: '', stage: 'playoff-upper', format: 'Bo1', round: r, scheduledDate: '', scheduledTime: '', status: 'scheduled' });
    }
    newMatches.push(...next); prev = next; r++;
  }

  const lbRounds = Math.max(2, (r - 1) * 2 - 2);
  let lbCount = Math.max(1, upperR1.length / 2);
  for (let lr = 1; lr <= lbRounds; lr++) {
    for (let i = 0; i < lbCount; i++) {
      newMatches.push({ id: `${id++}`, team1Id: '', team2Id: '', stage: 'playoff-lower', format: 'Bo1', round: lr, scheduledDate: '', scheduledTime: '', status: 'scheduled' });
    }
    if (lr % 2 === 0) lbCount = Math.max(1, Math.floor(lbCount / 2));
  }

  newMatches.push({ id: `${id++}`, team1Id: '', team2Id: '', stage: 'final', format: 'Bo3', round: 1, scheduledDate: '', scheduledTime: '', status: 'scheduled' });
  return newMatches;
}

// ─── Main Tournament Page ────────────────────────────────────────────────────
const Tournament: React.FC = () => {
  const {
    data, isAdmin, isEditing,
    addGroup, updateGroup, deleteGroup, generateGroupMatches,
    addMatch, deleteMatch, getTeamById, getGroupStandings,
  } = useTournament();

  const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupForTeam, setSelectedGroupForTeam] = useState('');
  const [selectedTeamForGroup, setSelectedTeamForGroup] = useState('');
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [newMatch, setNewMatch] = useState({
    team1Id: '', team2Id: '', format: 'Bo1' as TournamentMatch['format'],
    stage: 'playoff-upper' as TournamentMatch['stage'],
    groupId: '', scheduledDate: '', scheduledTime: '', streamLink: '', round: 1,
  });

  const tabs = [
    { key: 'groups'  as const, label: 'Групповой этап' },
    { key: 'bracket' as const, label: 'Плей-офф & Финал' },
  ];

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addGroup({ id: Date.now().toString(), name: newGroupName, teamIds: [] });
    setNewGroupName('');
  };

  const handleAddTeamToGroup = () => {
    if (!selectedGroupForTeam || !selectedTeamForGroup) return;
    const group = data.groups.find(g => g.id === selectedGroupForTeam);
    if (!group || group.teamIds.includes(selectedTeamForGroup)) return;
    updateGroup({ ...group, teamIds: [...group.teamIds, selectedTeamForGroup] });
    setSelectedTeamForGroup('');
  };

  const handleRemoveTeamFromGroup = (groupId: string, teamId: string) => {
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return;
    updateGroup({ ...group, teamIds: group.teamIds.filter(id => id !== teamId) });
  };

  const handleCreateMatch = () => {
    addMatch({
      id: Date.now().toString(),
      team1Id: newMatch.team1Id, team2Id: newMatch.team2Id,
      format: newMatch.format, stage: newMatch.stage,
      groupId: newMatch.stage === 'group' ? newMatch.groupId : undefined,
      scheduledDate: newMatch.scheduledDate, scheduledTime: newMatch.scheduledTime,
      streamLink: newMatch.streamLink || undefined,
      round: newMatch.round, status: 'scheduled',
    });
    setShowNewMatch(false);
    setNewMatch({ team1Id: '', team2Id: '', format: 'Bo1', stage: 'playoff-upper', groupId: '', scheduledDate: '', scheduledTime: '', streamLink: '', round: 1 });
  };

  const handleAddEmptyBlock = (stage: TournamentMatch['stage'], round: number) => {
    addMatch({
      id: Date.now().toString(),
      team1Id: '', team2Id: '',
      format: 'Bo1', stage, round,
      scheduledDate: '', scheduledTime: '', status: 'scheduled',
    });
  };

  const handleAutoGenerate = () => {
    const generated = buildDoubleElimMatches(data.teams);
    generated.forEach(m => addMatch(m));
  };

  const bracketMatches = data.matches.filter(m => m.stage !== 'group');
  const teamsNotInGroups = data.teams.filter(t => !data.groups.some(g => g.teamIds.includes(t.id)));
  const selectedT1 = selectedMatch ? getTeamById(selectedMatch.team1Id) : null;
  const selectedT2 = selectedMatch ? getTeamById(selectedMatch.team2Id) : null;
  const selectedGroup = newMatch.stage === 'group' ? data.groups.find(g => g.id === newMatch.groupId) : undefined;
  const availableTeamsForNewMatch = newMatch.stage === 'group'
    ? (selectedGroup ? selectedGroup.teamIds.map(id => getTeamById(id)).filter(Boolean) : [])
    : data.teams;

  const NewMatchPanel = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-background/50 rounded-lg border border-border/50 mt-4">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Команда 1</label>
        <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={newMatch.team1Id} onChange={e => setNewMatch(p => ({ ...p, team1Id: e.target.value }))}>
          <option value="">Выберите...</option>
          {availableTeamsForNewMatch
            .filter(t => t.id !== newMatch.team2Id)
            .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Команда 2</label>
        <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={newMatch.team2Id} onChange={e => setNewMatch(p => ({ ...p, team2Id: e.target.value }))}>
          <option value="">Выберите...</option>
          {availableTeamsForNewMatch
            .filter(t => t.id !== newMatch.team1Id)
            .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Формат</label>
        <select className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={newMatch.format} onChange={e => setNewMatch(p => ({ ...p, format: e.target.value as any }))}>
          <option value="Bo1">Bo1</option><option value="Bo2">Bo2</option><option value="Bo3">Bo3</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Стадия</label>
        <select
          className="w-full bg-background border rounded-lg p-2 text-foreground text-sm"
          value={newMatch.stage}
          onChange={e => setNewMatch(p => {
            const stage = e.target.value as TournamentMatch['stage'];
            if (stage !== 'group') return { ...p, stage, groupId: '', team1Id: '', team2Id: '' };
            return { ...p, stage, team1Id: '', team2Id: '' };
          })}
        >
          <option value="group">Групповой этап</option>
          <option value="playoff-upper">Верхняя сетка</option>
          <option value="playoff-lower">Нижняя сетка</option>
          <option value="final">Финал</option>
        </select>
      </div>
      {newMatch.stage === 'group' && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Группа</label>
          <select
            className="w-full bg-background border rounded-lg p-2 text-foreground text-sm"
            value={newMatch.groupId}
            onChange={e => setNewMatch(p => ({ ...p, groupId: e.target.value, team1Id: '', team2Id: '' }))}
          >
            <option value="">Выберите группу...</option>
            {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Раунд</label>
        <input type="number" min={1} className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={newMatch.round} onChange={e => setNewMatch(p => ({ ...p, round: parseInt(e.target.value) || 1 }))} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Дата</label>
        <input type="date" className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={newMatch.scheduledDate} onChange={e => setNewMatch(p => ({ ...p, scheduledDate: e.target.value }))} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Время</label>
        <input type="time" className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={newMatch.scheduledTime} onChange={e => setNewMatch(p => ({ ...p, scheduledTime: e.target.value }))} />
      </div>
      {newMatch.stage === 'group' && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Быстрое время по раунду</label>
          <button
            onClick={() => {
              const quickTime = GROUP_ROUND_TIMES[newMatch.round];
              if (quickTime) setNewMatch(p => ({ ...p, scheduledTime: quickTime }));
            }}
            className="w-full px-3 py-2 border rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
          >
            Подставить время для R{newMatch.round} {GROUP_ROUND_TIMES[newMatch.round] ? `(${GROUP_ROUND_TIMES[newMatch.round]})` : ''}
          </button>
        </div>
      )}
      <div className="sm:col-span-2 md:col-span-3">
        <label className="text-xs text-muted-foreground block mb-1">Ссылка на трансляцию</label>
        <input className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="https://twitch.tv/..." value={newMatch.streamLink} onChange={e => setNewMatch(p => ({ ...p, streamLink: e.target.value }))} />
      </div>
      {newMatch.stage === 'group' && (
        <div className="sm:col-span-2 md:col-span-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          {newMatch.groupId
            ? `Для ${selectedGroup?.name}: доступны только команды этой группы.`
            : 'Сначала выбери группу, затем команды будут отфильтрованы автоматически.'}
        </div>
      )}
      <div className="flex gap-2 flex-wrap sm:col-span-2 md:col-span-3">
        <button onClick={handleCreateMatch} className="btn-primary-gradient px-5 py-2 rounded-lg text-sm font-heading flex items-center gap-1">
          <Check size={14} /> Создать матч {(!newMatch.team1Id || !newMatch.team2Id) ? '(TBD)' : ''}
        </button>
        <button onClick={() => setShowNewMatch(false)} className="px-5 py-2 border rounded-lg text-muted-foreground text-sm font-heading">Отмена</button>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text mb-8 text-center">Турнир</h1>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-6 py-2 rounded-lg w-full sm:w-auto text-sm sm:text-base font-heading font-semibold transition-all ${
                activeTab === tab.key ? 'btn-primary-gradient' : 'bg-card border text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ GROUPS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'groups' && (
          <div className="space-y-8">
            {isAdmin && isEditing && (
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="font-heading font-bold text-foreground">Управление группами</h3>
                <div className="flex gap-3 flex-wrap">
                  <input
                    className="bg-background border rounded-lg p-2 text-foreground flex-1 min-w-40"
                    placeholder="Название группы (напр. Группа A)"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                  />
                  <button onClick={handleAddGroup} className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
                    <Plus size={16} /> Создать группу
                  </button>
                </div>
                {data.groups.length > 0 && (
                  <div className="flex gap-3 flex-wrap items-end border-t border-border/30 pt-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Группа</label>
                      <select className="bg-background border rounded-lg p-2 text-foreground text-sm" value={selectedGroupForTeam} onChange={e => setSelectedGroupForTeam(e.target.value)}>
                        <option value="">Выберите группу</option>
                        {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Команда</label>
                      <select className="bg-background border rounded-lg p-2 text-foreground text-sm" value={selectedTeamForGroup} onChange={e => setSelectedTeamForGroup(e.target.value)}>
                        <option value="">Выберите команду</option>
                        {teamsNotInGroups.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <button onClick={handleAddTeamToGroup} className="px-4 py-2 border rounded-lg text-sm text-foreground hover:border-primary transition-colors">
                      Добавить в группу
                    </button>
                  </div>
                )}
                <div className="border-t border-border/30 pt-4">
                  <button onClick={() => setShowNewMatch(!showNewMatch)} className="text-sm text-primary hover:underline font-heading flex items-center gap-1">
                    <Plus size={14} /> Добавить матч вручную
                  </button>
                  {showNewMatch && <NewMatchPanel />}
                </div>
              </div>
            )}

            {data.groups.map(group => {
              const standings = getGroupStandings(group.id);
              const groupMatches = data.matches
                .filter(m => m.groupId === group.id)
                .sort((a, b) => {
                  const roundDiff = (a.round || 0) - (b.round || 0);
                  if (roundDiff !== 0) return roundDiff;
                  return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
                });
              const groupMatchesByRound = groupMatches.reduce<Record<number, TournamentMatch[]>>((acc, match) => {
                const round = match.round || 1;
                if (!acc[round]) acc[round] = [];
                acc[round].push(match);
                return acc;
              }, {});
              const rounds = Object.keys(groupMatchesByRound).map(Number).sort((a, b) => a - b);
              return (
                <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                      <h2 className="font-heading text-2xl font-bold text-foreground">{group.name}</h2>
                    </div>
                    {isAdmin && isEditing && (
                      <div className="flex gap-2">
                        <button onClick={() => generateGroupMatches(group.id)} className="px-3 py-1.5 border rounded-lg text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                          <RefreshCw size={12} /> Авто-матчи
                        </button>
                        <button onClick={() => deleteGroup(group.id)} className="px-3 py-1.5 border rounded-lg text-xs text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {standings.length > 0 && (
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-muted-foreground">
                            <th className="text-left py-2 px-3 font-heading text-xs">#</th>
                            <th className="text-left py-2 px-3 font-heading text-xs">Команда</th>
                            <th className="text-center py-2 px-3 font-heading text-xs">В</th>
                            <th className="text-center py-2 px-3 font-heading text-xs">П</th>
                            <th className="text-center py-2 px-3 font-heading text-xs">Очки</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((s, i) => {
                            const team = getTeamById(s.teamId);
                            return (
                              <tr key={s.teamId} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                <td className="py-3 px-3 font-heading font-bold text-foreground">{i + 1}</td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    {team?.logo
                                      ? <img src={team.logo} alt="" className="w-7 h-7 rounded object-cover" />
                                      : <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold">{team?.tag?.[0] || '?'}</div>}
                                    <span className="font-heading text-foreground">{team?.name || 'N/A'}</span>
                                    {team?.status === 'withdrawn' && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-heading">снялась</span>}
                                  </div>
                                </td>
                                <td className="text-center py-3 px-3 text-green-400 font-heading font-semibold">{s.wins}</td>
                                <td className="text-center py-3 px-3 text-red-400 font-heading font-semibold">{s.losses}</td>
                                <td className="text-center py-3 px-3 font-heading font-bold text-foreground text-base">{s.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-5">
                    {group.teamIds.map(tid => {
                      const team = getTeamById(tid);
                      return (
                        <div key={tid} className={`flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 ${team?.status === 'withdrawn' ? 'opacity-50' : ''}`}>
                          {team?.logo
                            ? <img src={team.logo} alt="" className="w-6 h-6 rounded object-cover" />
                            : <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{team?.tag?.[0] || '?'}</div>}
                          <span className={`text-sm font-heading text-foreground ${team?.status === 'withdrawn' ? 'line-through' : ''}`}>{team?.name || 'N/A'}</span>
                          {isAdmin && isEditing && (
                            <button onClick={() => handleRemoveTeamFromGroup(group.id, tid)} className="text-muted-foreground hover:text-destructive ml-1 transition-colors">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {group.teamIds.length === 0 && <p className="text-muted-foreground text-sm">В группе пока нет команд</p>}
                  </div>

                  {groupMatches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Матчи группы</h4>
                      <div className="space-y-4">
                        {rounds.map(round => (
                          <div key={round} className="rounded-xl border border-border/40 bg-background/30 p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-heading font-semibold text-sm text-foreground">Раунд {round}</h5>
                              <span className="text-xs text-muted-foreground">
                                {groupMatchesByRound[round][0]?.scheduledTime ? `Старт: ${groupMatchesByRound[round][0].scheduledTime}` : 'Время не указано'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {groupMatchesByRound[round].map(match => (
                                <MatchCard key={match.id} match={match} onOpenDetails={setSelectedMatch} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {data.groups.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                {isAdmin ? 'Создайте группы выше в режиме редактирования' : 'Группы ещё не сформированы'}
              </div>
            )}
          </div>
        )}

        {/* ═══ BRACKET TAB ════════════════════════════════════════════════════ */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            {isAdmin && isEditing && (
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
                  <h3 className="font-heading font-bold text-foreground">Управление сеткой</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowNewMatch(!showNewMatch)} className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
                      <Plus size={16} /> Новый матч
                    </button>
                    {bracketMatches.length === 0 && (
                      <button onClick={handleAutoGenerate} className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <RefreshCw size={14} /> Авто-сетка DE
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Добавляй матчи → расставляй их на канвасе → соединяй линиями (режим соединений).
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center">Быстро добавить пустой блок:</span>
                  {[1,2,3,4].map(r => (
                    <button key={r} onClick={() => handleAddEmptyBlock('playoff-upper', r)} className="px-3 py-1 border border-blue-500/40 rounded-lg text-xs text-blue-300 hover:bg-blue-500/10 transition-colors">
                      ▲ Верх R{r}
                    </button>
                  ))}
                  {[1,2,3,4].map(r => (
                    <button key={r} onClick={() => handleAddEmptyBlock('playoff-lower', r)} className="px-3 py-1 border border-red-500/40 rounded-lg text-xs text-red-300 hover:bg-red-500/10 transition-colors">
                      ▼ Низ R{r}
                    </button>
                  ))}
                  <button onClick={() => handleAddEmptyBlock('final', 1)} className="px-3 py-1 border border-yellow-400/40 rounded-lg text-xs text-yellow-300 hover:bg-yellow-400/10 transition-colors">
                    🏆 Финал
                  </button>
                </div>
                {showNewMatch && <NewMatchPanel />}
              </div>
            )}

            <NodeBracketEditor />

            {/* Match list for editing */}
            {isAdmin && isEditing && bracketMatches.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Все матчи (список для редактирования)</h4>
                {bracketMatches.map(m => <MatchCard key={m.id} match={m} onOpenDetails={setSelectedMatch} />)}
              </div>
            )}
          </div>
        )}
        {selectedMatch && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedMatch(null)}>
            <div className="max-w-2xl mx-auto mt-10 sm:mt-16 glass-card rounded-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-xl font-bold text-foreground">Подробности матча</h3>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedMatch(null)}>✕</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 rounded-md text-xs font-heading bg-primary/10 text-primary">{STAGE_LABELS[selectedMatch.stage]}</span>
                <span className="px-2 py-1 rounded-md text-xs font-heading bg-muted/60 text-foreground">{selectedMatch.format}</span>
                {selectedMatch.round && <span className="px-2 py-1 rounded-md text-xs font-heading bg-muted/60 text-foreground">Раунд {selectedMatch.round}</span>}
              </div>
              <div className="rounded-xl border border-border/40 bg-background/40 p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">Команда 1</p>
                    <p className="font-heading font-semibold text-foreground">{selectedT1?.name || 'TBD'}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display font-bold text-foreground">
                      {selectedMatch.result ? `${selectedMatch.result.team1Score} : ${selectedMatch.result.team2Score}` : '— : —'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedMatch.status === 'completed' ? 'Матч завершён' : selectedMatch.status === 'live' ? 'Идёт матч' : 'Ожидается'}
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-muted-foreground">Команда 2</p>
                    <p className="font-heading font-semibold text-foreground">{selectedT2?.name || 'TBD'}</p>
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
                {selectedT1 && (
                  <RouterLink to={`/teams/${selectedT1.id}`} className="px-3 py-2 border rounded-lg text-sm hover:text-primary" onClick={() => setSelectedMatch(null)}>
                    {selectedT1.name}
                  </RouterLink>
                )}
                {selectedT2 && (
                  <RouterLink to={`/teams/${selectedT2.id}`} className="px-3 py-2 border rounded-lg text-sm hover:text-primary" onClick={() => setSelectedMatch(null)}>
                    {selectedT2.name}
                  </RouterLink>
                )}
                {selectedMatch.streamLink && (
                  <a href={selectedMatch.streamLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border rounded-lg text-sm hover:text-primary inline-flex items-center gap-1">
                    <Tv size={14} /> Трансляция
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Tournament;
