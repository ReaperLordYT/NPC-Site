import React, { useState, useRef } from 'react';
import { useTournament } from '@/context/TournamentContext';
import { Team, Player } from '@/types/tournament';
import { X, Plus, Upload, Trash2 } from 'lucide-react';

const emptyPlayer = (isSubstitute = false): Player => ({
  id: Date.now().toString() + Math.random(),
  nickname: '',
  role: undefined,
  steamLink: '',
  dotabuffLink: '',
  mmr: 0,
  discordUsername: '',
  isCaptain: false,
  isSubstitute,
});

interface TeamEditorProps {
  teamId?: string;
  onClose: () => void;
}

const TeamEditor: React.FC<TeamEditorProps> = ({ teamId, onClose }) => {
  const { data, addTeam, updateTeam } = useTournament();
  const existing = teamId ? data.teams.find(t => t.id === teamId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [tag, setTag] = useState(existing?.tag || '');
  const [logo, setLogo] = useState(existing?.logo || '');
  const [status, setStatus] = useState<Team['status']>(existing?.status || 'pending');
  const [dqReason, setDqReason] = useState(existing?.disqualificationReason || '');
  const [titleText, setTitleText] = useState(existing?.titleText || '');
  const [titleEmoji, setTitleEmoji] = useState(existing?.titleEmoji || '');
  const [titleStyle, setTitleStyle] = useState<Team['titleStyle']>(existing?.titleStyle || 'legacy');
  const [players, setPlayers] = useState<Player[]>(
    existing?.players.length
      ? existing.players.map(player => ({
          ...player,
          isSubstitute: player.isSubstitute ?? player.role === 'reserve',
        }))
      : [emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer()]
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updatePlayer = (index: number, field: keyof Player, value: any) => {
    setPlayers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };
  const addPlayer = (isSubstitute = false) => setPlayers(prev => [...prev, emptyPlayer(isSubstitute)]);
  const deletePlayer = (index: number) => setPlayers(prev => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!name.trim()) return;
    const team: Team = {
      id: existing?.id || Date.now().toString(),
      name, tag, logo, status, players,
      disqualificationReason: status === 'disqualified' ? dqReason : undefined,
      titleText: titleText.trim() || undefined,
      titleEmoji: titleEmoji.trim() || undefined,
      titleStyle,
    };
    if (existing) updateTeam(team);
    else addTeam(team);
    onClose();
  };

  const mainPlayersCount = players.filter(p => !p.isSubstitute).length;
  const substitutePlayersCount = players.filter(p => p.isSubstitute).length;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 mb-8 relative max-h-[85vh] overflow-y-auto pb-24 sm:pb-6">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <X size={20} />
      </button>
      <h3 className="font-heading text-xl font-bold mb-4 text-foreground">{existing ? 'Редактировать команду' : 'Новая команда'}</h3>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Название</label>
          <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Тег</label>
          <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={tag} onChange={e => setTag(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Статус</label>
          <select className="w-full bg-background border rounded-lg p-3 text-foreground" value={status} onChange={e => setStatus(e.target.value as Team['status'])}>
            <option value="pending">Ожидается</option>
            <option value="confirmed">Подтверждена</option>
            <option value="disqualified">Дисквалифицирована</option>
                <option value="withdrawn">Снялась</option>
          </select>
        </div>
        {status === 'disqualified' && (
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Причина ДК</label>
            <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={dqReason} onChange={e => setDqReason(e.target.value)} />
          </div>
        )}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Логотип</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-3 border rounded-lg text-muted-foreground hover:text-foreground w-full">
            <Upload size={18} /> {logo ? 'Изменить логотип' : 'Загрузить логотип'}
          </button>
          {logo && <img src={logo} alt="logo" className="h-12 mt-2 rounded" />}
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Титул команды</label>
          <input
            className="w-full bg-background border rounded-lg p-3 text-foreground"
            placeholder="Например: Победитель прошлого Blank"
            value={titleText}
            onChange={e => setTitleText(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Эмодзи титула</label>
          <input
            className="w-full bg-background border rounded-lg p-3 text-foreground"
            placeholder="🏆"
            value={titleEmoji}
            onChange={e => setTitleEmoji(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Стиль титула</label>
          <select
            className="w-full bg-background border rounded-lg p-3 text-foreground"
            value={titleStyle}
            onChange={e => setTitleStyle(e.target.value as Team['titleStyle'])}
          >
            <option value="legacy">Обычный (прошлый турнир)</option>
            <option value="current">Яркий (текущий чемпион)</option>
          </select>
        </div>
      </div>

      <h4 className="font-heading font-semibold mb-4 text-foreground">
        Состав ({mainPlayersCount} основных + {substitutePlayersCount} запасных)
      </h4>
      <div className="space-y-4">
        {players.map((player, i) => (
          <div key={i} className="bg-background/50 border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-heading font-semibold text-primary text-sm">
                  {player.isSubstitute ? 'Запасной игрок' : 'Основной игрок'}
                </span>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={!!player.isSubstitute} onChange={e => updatePlayer(i, 'isSubstitute', e.target.checked)} />
                  Запасной
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={!!player.isCaptain} onChange={e => updatePlayer(i, 'isCaptain', e.target.checked)} />
                  Капитан
                </label>
              </div>
              <button
                onClick={() => deletePlayer(i)}
                className="p-1.5 rounded border text-muted-foreground hover:text-destructive"
                title="Удалить игрока"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <input className="bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="Никнейм" value={player.nickname} onChange={e => updatePlayer(i, 'nickname', e.target.value)} />
              <input className="bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="MMR" type="number" value={player.mmr || ''} onChange={e => updatePlayer(i, 'mmr', parseInt(e.target.value) || 0)} />
              <input className="bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="Discord" value={player.discordUsername} onChange={e => updatePlayer(i, 'discordUsername', e.target.value)} />
              <input className="bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="Steam ссылка" value={player.steamLink} onChange={e => updatePlayer(i, 'steamLink', e.target.value)} />
              <input className="bg-background border rounded-lg p-2 text-foreground text-sm" placeholder="DotaBuff ссылка" value={player.dotabuffLink} onChange={e => updatePlayer(i, 'dotabuffLink', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2 flex-wrap">
        <button onClick={() => addPlayer(false)} className="px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
          <Plus size={14} /> Добавить основного
        </button>
        <button onClick={() => addPlayer(true)} className="px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
          <Plus size={14} /> Добавить запасного
        </button>
      </div>

      <div className="mt-6 hidden sm:flex gap-3">
        <button onClick={handleSave} className="btn-primary-gradient px-6 py-2 rounded-lg">
          {existing ? 'Сохранить' : 'Создать команду'}
        </button>
        <button onClick={onClose} className="px-6 py-2 rounded-lg border text-muted-foreground hover:text-foreground">
          Отмена
        </button>
      </div>
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur p-3">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground">
            Отмена
          </button>
          <button onClick={handleSave} className="btn-primary-gradient px-4 py-2 rounded-lg text-xs">
            {existing ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamEditor;
