import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { Plus, Trash2, FileText } from 'lucide-react';

const FreePlayers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const players = data.settings.freePlayers;
  const freePlayerFormLink = data.settings.freePlayerFormLink?.trim();

  const updatePlayer = (id: string, field: 'nickname' | 'discord' | 'steam' | 'position' | 'mmr', value: string) => {
    updateSettings({
      freePlayers: players.map(player => (
        player.id === id
          ? { ...player, [field]: field === 'mmr' ? Number(value || 0) : value }
          : player
      )),
    });
  };

  const addPlayer = () => {
    updateSettings({
      freePlayers: [
        ...players,
        {
          id: Date.now().toString(),
          nickname: 'Новый игрок',
          discord: '',
          steam: '',
          position: '',
          mmr: 0,
        },
      ],
    });
  };

  const deletePlayer = (id: string) => {
    updateSettings({ freePlayers: players.filter(player => player.id !== id) });
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text">Свободные игроки</h1>
          {isAdmin && isEditing && (
            <button onClick={addPlayer} className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus size={16} /> Добавить игрока
            </button>
          )}
        </div>

        <div className="mb-8 glass-card rounded-xl p-6 text-center">
          <p className="text-lg text-muted-foreground">
            У тебя нет команды? Не беда - подай заявку как свободный игрок
          </p>
          {freePlayerFormLink && (
            <a
              href={freePlayerFormLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-gradient mt-4 px-6 py-3 rounded-lg inline-flex items-center gap-2"
            >
              <FileText size={18} /> Подать заявку как свободный игрок
            </a>
          )}
          {!freePlayerFormLink && isAdmin && (
            <p className="text-xs text-muted-foreground mt-3">
              Добавьте ссылку формы в админке: "Форма для свободных игроков".
            </p>
          )}
          {!freePlayerFormLink && !isAdmin && (
            <p className="text-xs text-muted-foreground mt-3">
              Форма заявки появится чуть позже.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {players.map(player => (
            <div key={player.id} className="glass-card rounded-xl p-5 card-glow relative">
              {isAdmin && isEditing && (
                <button
                  onClick={() => deletePlayer(player.id)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                  title="Удалить карточку"
                >
                  <Trash2 size={15} />
                </button>
              )}

              {isAdmin && isEditing ? (
                <div className="space-y-2">
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" value={player.nickname} onChange={e => updatePlayer(player.id, 'nickname', e.target.value)} placeholder="Никнейм" />
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" value={player.discord} onChange={e => updatePlayer(player.id, 'discord', e.target.value)} placeholder="Discord" />
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" value={player.steam} onChange={e => updatePlayer(player.id, 'steam', e.target.value)} placeholder="Steam" />
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" value={player.position} onChange={e => updatePlayer(player.id, 'position', e.target.value)} placeholder="Позиция" />
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" type="number" value={player.mmr} onChange={e => updatePlayer(player.id, 'mmr', e.target.value)} placeholder="MMR" />
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="font-heading font-bold text-lg text-foreground">{player.nickname}</p>
                  <p className="text-muted-foreground">Discord: <span className="text-foreground">{player.discord || '—'}</span></p>
                  <p className="text-muted-foreground">Steam: <span className="text-foreground">{player.steam || '—'}</span></p>
                  <p className="text-muted-foreground">Позиция: <span className="text-foreground">{player.position || '—'}</span></p>
                  <p className="text-muted-foreground">MMR: <span className="text-foreground">{player.mmr || 0}</span></p>
                </div>
              )}
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            Пока нет свободных игроков.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default FreePlayers;
