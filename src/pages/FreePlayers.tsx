import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { Plus, Trash2, FileText, ExternalLink, Swords, Sparkles, Shield, HelpingHand, HandHeart } from 'lucide-react';

const FreePlayers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const players = data.settings.freePlayers;
  const freePlayerFormLink = data.settings.freePlayerFormLink?.trim();

  const updatePlayer = (
    id: string,
    field: 'nickname' | 'discord' | 'discordDmLink' | 'steam' | 'dotabuff' | 'position' | 'mmr' | 'status',
    value: string
  ) => {
    updateSettings({
      freePlayers: players.map(player => (
        player.id === id
          ? {
              ...player,
              [field]: field === 'mmr' ? Number(value || 0) : value,
            }
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
          discordDmLink: '',
          steam: '',
          dotabuff: '',
          position: '',
          roles: [],
          mmr: 0,
          status: 'free',
        },
      ],
    });
  };

  const deletePlayer = (id: string) => {
    updateSettings({ freePlayers: players.filter(player => player.id !== id) });
  };

  const updatePlayerRoles = (id: string, roles: Array<'carry' | 'mid' | 'offlane' | 'soft' | 'hard'>) => {
    const next = Array.from(new Set(roles));
    updateSettings({
      freePlayers: players.map(player =>
        player.id === id
          ? {
              ...player,
              roles: next,
              position: next.join(', '),
            }
          : player
      ),
    });
  };

  const toExternalUrl = (value?: string, baseIfId?: (id: string) => string) => {
    const raw = (value ?? '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^\d{16,20}$/.test(raw) && baseIfId) return baseIfId(raw);
    return baseIfId ? baseIfId(raw) : raw;
  };

  const normalizeRole = (pos?: string) => {
    const p = (pos ?? '').trim().toLowerCase();
    if (!p) return '';
    if (/(^|[^a-zа-я0-9])(carry|керри|кэрри|pos\s*1|позици[яи]\s*1|1)([^a-zа-я0-9]|$)/i.test(p)) return 'carry';
    if (/(^|[^a-zа-я0-9])(mid|мид|pos\s*2|позици[яи]\s*2|2)([^a-zа-я0-9]|$)/i.test(p)) return 'mid';
    if (/(^|[^a-zа-я0-9])(offlane|offlaner|оффлейн|оффлейнер|hardlane|pos\s*3|позици[яи]\s*3|3)([^a-zа-я0-9]|$)/i.test(p)) return 'offlane';
    if (/(^|[^a-zа-я0-9])(soft\s*support|support\s*4|pos\s*4|позици[яи]\s*4|4)([^a-zа-я0-9]|$)/i.test(p)) return 'soft';
    if (/(^|[^a-zа-я0-9])(full\s*support|hard\s*support|support\s*5|pos\s*5|позици[яи]\s*5|5)([^a-zа-я0-9]|$)/i.test(p)) return 'hard';
    return p;
  };

  const toRoles = (player: any): Array<'carry' | 'mid' | 'offlane' | 'soft' | 'hard'> => {
    const direct = Array.isArray(player.roles) ? (player.roles as string[]) : [];
    const known = new Set(['carry', 'mid', 'offlane', 'soft', 'hard']);

    const cleanedDirect = direct
      .map(r => normalizeRole(String(r)))
      .filter(r => known.has(r)) as Array<'carry' | 'mid' | 'offlane' | 'soft' | 'hard'>;

    if (cleanedDirect.length) return Array.from(new Set(cleanedDirect));

    const legacy = String(player.position ?? '');
    const parts = legacy
      .split(/[,/;|]+/g)
      .map(s => s.trim())
      .filter(Boolean);
    const fromLegacy = parts
      .map(p => normalizeRole(p))
      .filter(r => known.has(r)) as Array<'carry' | 'mid' | 'offlane' | 'soft' | 'hard'>;
    return Array.from(new Set(fromLegacy));
  };

  const roleItems = [
    { id: 'carry', label: 'Carry', Icon: Swords },
    { id: 'mid', label: 'Mid', Icon: Sparkles },
    { id: 'offlane', label: 'Offlaner', Icon: Shield },
    { id: 'soft', label: 'Soft Support', Icon: HelpingHand },
    { id: 'hard', label: 'Full Support', Icon: HandHeart },
  ] as const;

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
          {players.map(player => {
            const playerStatus = player.status ?? 'free';
            const isFree = playerStatus === 'free';
            const hasDiscordDmLink = !!player.discordDmLink?.trim();
            const shouldLinkDiscord = isFree && hasDiscordDmLink && !!player.discord?.trim();
            const steamUrl = toExternalUrl(
              player.steam,
              id => `https://steamcommunity.com/profiles/${id}`
            );
            const dotabuffUrl = toExternalUrl(
              player.dotabuff,
              id => `https://www.dotabuff.com/players/${id}`
            );
            const roles = toRoles(player);

            return (
            <div
              key={player.id}
              className="glass-card rounded-xl p-5 card-glow relative border border-border/50 hover:border-primary/40 transition-colors"
            >
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
                  <input
                    className="w-full bg-background border rounded-lg p-2 text-sm"
                    value={player.discordDmLink ?? ''}
                    onChange={e => updatePlayer(player.id, 'discordDmLink', e.target.value)}
                    placeholder="Ссылка на ЛС Discord (необязательно)"
                  />
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" value={player.steam} onChange={e => updatePlayer(player.id, 'steam', e.target.value)} placeholder="Steam" />
                  <input
                    className="w-full bg-background border rounded-lg p-2 text-sm"
                    value={player.dotabuff ?? ''}
                    onChange={e => updatePlayer(player.id, 'dotabuff', e.target.value)}
                    placeholder="Dotabuff (ссылка или ID)"
                  />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Роли (можно несколько)</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {roleItems.map(({ id, label, Icon }) => {
                        const active = roles.includes(id);
                        return (
                          <button
                            type="button"
                            key={id}
                            onClick={() => {
                              const next = active ? roles.filter(r => r !== id) : [...roles, id];
                              updatePlayerRoles(player.id, next);
                            }}
                            className={`role-split role-split--clickable ${active ? 'is-active' : ''}`}
                            title={label}
                            aria-pressed={active}
                          >
                            <span className="role-split__half role-split__left">
                              <Icon size={18} />
                            </span>
                            <span className="role-split__half role-split__right">
                              <Icon size={18} />
                            </span>
                            <span className="role-split__label">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input className="w-full bg-background border rounded-lg p-2 text-sm" type="number" value={player.mmr} onChange={e => updatePlayer(player.id, 'mmr', e.target.value)} placeholder="MMR" />
                  <select
                    className="w-full bg-background border rounded-lg p-2 text-sm"
                    value={playerStatus}
                    onChange={e => updatePlayer(player.id, 'status', e.target.value)}
                  >
                    <option value="free">СВОБОДНЫЙ</option>
                    <option value="busy">ЗАНЯТ</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-heading font-bold text-lg text-foreground">{player.nickname}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                        isFree
                          ? 'bg-green-500/15 text-green-400 border-green-500/40'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {isFree ? 'СВОБОДНЫЙ' : 'ЗАНЯТ'}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Discord:{' '}
                    {shouldLinkDiscord ? (
                      <a
                        href={player.discordDmLink}
                        className="text-primary hover:underline underline-offset-2"
                        title="Открыть личные сообщения в Discord"
                      >
                        {player.discord}
                      </a>
                    ) : (
                      <span className="text-foreground">{player.discord || '—'}</span>
                    )}
                  </p>
                  <p className="text-muted-foreground">Позиция: <span className="text-foreground">{player.position || '—'}</span></p>
                  <p className="text-muted-foreground">MMR: <span className="text-foreground">{player.mmr || 0}</span></p>
                  {roles.length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {roleItems
                          .filter(r => roles.includes(r.id))
                          .map(({ id, label, Icon }) => (
                            <div
                              key={id}
                              className="role-split is-active"
                              title={label}
                              aria-label={label}
                            >
                              <span className="role-split__half role-split__left">
                                <Icon size={18} />
                              </span>
                              <span className="role-split__half role-split__right">
                                <Icon size={18} />
                              </span>
                              <span className="role-split__label">{label}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {(steamUrl || dotabuffUrl) && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {steamUrl && (
                        <a
                          href={steamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs border rounded-lg text-muted-foreground hover:text-primary hover:border-primary flex items-center gap-1 transition-colors"
                        >
                          Steam <ExternalLink size={12} />
                        </a>
                      )}
                      {dotabuffUrl && (
                        <a
                          href={dotabuffUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs border rounded-lg text-muted-foreground hover:text-primary hover:border-primary flex items-center gap-1 transition-colors"
                        >
                          DotaBuff <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
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
