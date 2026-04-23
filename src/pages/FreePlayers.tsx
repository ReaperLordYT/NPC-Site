import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { useRegistrationDeadline } from '@/hooks/useRegistrationDeadline';
import { formatRemainingTime } from '@/lib/registrationDeadline';
import { Plus, Trash2, FileText, ExternalLink, Swords, Sparkles, Shield, HelpingHand, HandHeart, Lock, Search } from 'lucide-react';
import { BowIcon } from '@/components/icons/BowIcon';

const FreePlayers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const players = data.settings.freePlayers;
  const freePlayerFormLink = data.settings.freePlayerFormLink?.trim();
  const isFreePlayersRegistrationClosed = data.settings.freePlayersRegistrationClosed;
  const registrationState = useRegistrationDeadline(data.settings.registrationDeadlineAt);
  const isFreePlayerFormClosedByDeadline = registrationState.hasDeadline && registrationState.isClosed;
  const isFreePlayerFormClosed = isFreePlayersRegistrationClosed || isFreePlayerFormClosedByDeadline;
  const hasTournamentStarted = data.matches.some(match => match.status === 'live' || match.status === 'completed');
  const freePlayersClosedText = data.settings.tournamentCompleted
    ? 'Турнир завершен. Подача заявок закрыта.'
    : hasTournamentStarted
      ? 'Турнир уже идет. Подача заявок закрыта.'
      : 'Подача заявок завершена. Сейчас идет проверка заявок и подготовка расписания матчей.';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Array<'carry' | 'mid' | 'offlane' | 'soft' | 'hard'>>([]);
  const [mmrSort, setMmrSort] = useState<'asc' | 'desc'>('asc');
  const [mmrEnabled, setMmrEnabled] = useState(false);
  const [mmrMin, setMmrMin] = useState(0);
  const [mmrMax, setMmrMax] = useState(0);

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
    { id: 'mid', label: 'Mid', Icon: BowIcon },
    { id: 'offlane', label: 'Offlaner', Icon: Shield },
    { id: 'soft', label: 'Soft Support', Icon: HelpingHand },
    { id: 'hard', label: 'Full Support', Icon: HandHeart },
  ] as const;

  const mmrBounds = useMemo(() => {
    const max = Math.max(...players.map(p => p.mmr ?? 0), 0);
    return { min: 0, max };
  }, [players]);

  useEffect(() => {
    // Если список игроков обновился, аккуратно ограничим текущие значения.
    setMmrMin(prev => Math.min(prev, mmrBounds.max));
    setMmrMax(prev => Math.min(prev, mmrBounds.max));
  }, [mmrBounds.max]);

  const visiblePlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let list = [...players];

    if (selectedRoles.length > 0) {
      list = list.filter(player => {
        const roles = toRoles(player);
        return roles.some(r => selectedRoles.includes(r));
      });
    }

    if (q) {
      list = list.filter(player => {
        const fields = [
          player.nickname,
          player.discord,
          player.discordDmLink,
          player.steam,
          player.dotabuff,
        ].filter(Boolean) as string[];

        return fields.some(f => f.toLowerCase().includes(q));
      });
    }

    if (mmrEnabled) {
      const min = Math.min(mmrMin, mmrMax);
      const max = Math.max(mmrMin, mmrMax);
      list = list.filter(player => {
        const v = player.mmr ?? 0;
        return v >= min && v <= max;
      });
    }

    // Сначала сортируем по статусу: free -> busy, затем по ММР (по выбранному направлению).
    list.sort((a, b) => {
      const aFree = (a.status ?? 'free') === 'free' ? 0 : 1;
      const bFree = (b.status ?? 'free') === 'free' ? 0 : 1;
      if (aFree !== bFree) return aFree - bFree;

      const am = a.mmr ?? 0;
      const bm = b.mmr ?? 0;
      if (am !== bm) return mmrSort === 'asc' ? am - bm : bm - am;

      return (a.nickname || '').localeCompare(b.nickname || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    return list;
  }, [players, searchQuery, selectedRoles, mmrSort, mmrEnabled, mmrMin, mmrMax]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="flex items-center justify-between gap-3 mb-8 sm:mb-10 flex-wrap">
          <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text">Свободные игроки</h1>
          {isAdmin && isEditing && (
            <button onClick={addPlayer} className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base">
              <Plus size={16} /> Добавить игрока
            </button>
          )}
        </div>

        <div className="mb-8 glass-card rounded-xl p-4 sm:p-6 text-center">
          <p className="text-base sm:text-lg text-muted-foreground">
            У тебя нет команды? Не беда - подай заявку как свободный игрок
          </p>
          {!registrationState.isClosed && registrationState.hasDeadline && (
            <div className="mt-4 rounded-xl border border-primary/35 bg-primary/10 p-4 text-center">
              <p className="font-heading text-foreground">До конца подачи заявок свободных игроков:</p>
              <p className="text-primary font-heading text-lg mt-1">
                {formatRemainingTime(registrationState.remainingMs)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Отсчет ведется по МСК.</p>
            </div>
          )}
          {freePlayerFormLink && !isFreePlayerFormClosed && (
            <a
              href={freePlayerFormLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-gradient mt-4 px-5 sm:px-6 py-3 rounded-lg inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <FileText size={18} /> Подать заявку как свободный игрок
            </a>
          )}
          {isFreePlayerFormClosed && (
            <div className="mt-4 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-lg border border-border bg-card/50 text-muted-foreground w-full sm:w-auto">
              <Lock size={18} /> Регистрация свободных игроков закрыта
            </div>
          )}
          {isFreePlayerFormClosedByDeadline && (
            <p className="text-xs text-muted-foreground mt-3">
              {freePlayersClosedText}
            </p>
          )}
          {!freePlayerFormLink && isAdmin && (
            <p className="text-xs text-muted-foreground mt-3">
              Добавьте ссылку формы в админке: "Форма для свободных игроков".
            </p>
          )}
          {!freePlayerFormLink && !isAdmin && !isFreePlayerFormClosed && (
            <p className="text-xs text-muted-foreground mt-3">
              Форма заявки появится чуть позже.
            </p>
          )}
        </div>

        {/* Search + role filter + sorting */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[220px] max-w-[460px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full bg-background border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Поиск: никнейм, Discord, Steam или Dotabuff"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <select
                className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                value={mmrSort}
                onChange={e => setMmrSort(e.target.value as 'asc' | 'desc')}
              >
                <option value="asc">MMR: низкий - высокий</option>
                <option value="desc">MMR: высокий - низкий</option>
              </select>

              {(searchQuery.trim() || selectedRoles.length > 0 || mmrEnabled) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRoles([]);
                    setMmrSort('asc');
                    setMmrEnabled(false);
                    setMmrMin(0);
                    setMmrMax(mmrBounds.max);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* MMR slider filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={mmrEnabled}
                  onChange={e => {
                    const enabled = e.target.checked;
                    setMmrEnabled(enabled);
                    if (enabled) {
                      setMmrMin(0);
                      setMmrMax(mmrBounds.max);
                    }
                  }}
                />
                Поиск по MMR
              </label>
              {mmrEnabled && (
                <p className="text-xs text-muted-foreground">
                  Диапазон: <span className="text-foreground font-semibold">{Math.min(mmrMin, mmrMax)} - {Math.max(mmrMin, mmrMax)}</span>
                </p>
              )}
            </div>

            {mmrEnabled && (
              <div className="glass-card rounded-xl p-4 border border-border/50">
                <div className="flex flex-wrap items-end gap-4 justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">от</span>
                      <input
                        className="w-28 bg-background border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        type="number"
                        min={mmrBounds.min}
                        max={mmrBounds.max}
                        step={100}
                        value={mmrMin}
                        onChange={e => {
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) return;
                          const next = Math.max(mmrBounds.min, Math.min(raw, mmrBounds.max));
                          setMmrMin(next > mmrMax ? mmrMax : next);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">до</span>
                      <input
                        className="w-28 bg-background border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        type="number"
                        min={mmrBounds.min}
                        max={mmrBounds.max}
                        step={100}
                        value={mmrMax}
                        onChange={e => {
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) return;
                          const next = Math.max(mmrBounds.min, Math.min(raw, mmrBounds.max));
                          setMmrMax(next < mmrMin ? mmrMin : next);
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Макс: <span className="text-foreground font-semibold">{mmrBounds.max}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">min</span>
                    <input
                      className="w-full"
                      type="range"
                      min={mmrBounds.min}
                      max={mmrBounds.max}
                      step={100}
                      value={Math.min(mmrMin, mmrMax)}
                      onChange={e => {
                        const raw = Number(e.target.value);
                        if (Number.isNaN(raw)) return;
                        const next = Math.max(mmrBounds.min, Math.min(raw, mmrBounds.max));
                        setMmrMin(next > mmrMax ? mmrMax : next);
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">max</span>
                    <input
                      className="w-full"
                      type="range"
                      min={mmrBounds.min}
                      max={mmrBounds.max}
                      step={100}
                      value={Math.max(mmrMin, mmrMax)}
                      onChange={e => {
                        const raw = Number(e.target.value);
                        if (Number.isNaN(raw)) return;
                        const next = Math.max(mmrBounds.min, Math.min(raw, mmrBounds.max));
                        setMmrMax(next < mmrMin ? mmrMin : next);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Фильтр по роли (клик по иконкам):</p>
            <div className="flex items-center gap-2 flex-wrap">
              {roleItems.map(({ id, label, Icon }) => {
                const active = selectedRoles.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedRoles(prev => (active ? prev.filter(r => r !== id) : [...prev, id]));
                    }}
                    className={`role-split role-split--clickable ${active ? 'is-active' : ''}`}
                    title={label}
                    aria-pressed={active}
                  >
                    <span className="role-split__half role-split__left">
                      <Icon size={22} />
                    </span>
                    <span className="role-split__half role-split__right">
                      <Icon size={22} />
                    </span>
                    <span className="role-split__label">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visiblePlayers.map(player => {
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
                              <Icon size={22} />
                            </span>
                            <span className="role-split__half role-split__right">
                              <Icon size={22} />
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
                <div className="space-y-3 text-base">
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
                  <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>Позиция:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {roleItems.map(({ id, label, Icon }) => {
                        const active = roles.includes(id);
                        return (
                          <div
                            key={id}
                            className={`role-split ${active ? 'is-active' : 'role-split--locked'}`}
                            title={active ? label : 'Не выбрано'}
                            aria-label={active ? label : 'Не выбрано'}
                          >
                            <span className="role-split__half role-split__left">
                              <Icon size={22} />
                            </span>
                            <span className="role-split__half role-split__right">
                              <Icon size={22} />
                            </span>
                            {active && <span className="role-split__label">{label}</span>}
                            {!active && (
                              <span className="role-split__lock" aria-hidden="true">
                                <Lock size={14} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-muted-foreground">MMR: <span className="text-foreground">{player.mmr || 0}</span></p>
                  {(steamUrl || dotabuffUrl) && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {steamUrl && (
                        <a
                          href={steamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-sm border rounded-lg text-muted-foreground hover:text-primary hover:border-primary flex items-center gap-1 transition-colors"
                        >
                          Steam <ExternalLink size={12} />
                        </a>
                      )}
                      {dotabuffUrl && (
                        <a
                          href={dotabuffUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-sm border rounded-lg text-muted-foreground hover:text-primary hover:border-primary flex items-center gap-1 transition-colors"
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

        {visiblePlayers.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {players.length === 0 ? 'Пока нет свободных игроков.' : 'По заданным фильтрам ничего не найдено.'}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default FreePlayers;
