import React, { useState, useRef, useEffect, useMemo } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { motion } from 'framer-motion';
import { Star, Upload, Volume2, VolumeX, Volume1, Music, Trophy, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import type { Player, Team } from '@/types/tournament';

const SESSION_MVP_PAUSED_KEY = 'npc-mvp-music-paused';
type MvpStage = 'announce' | 'voting' | 'finished';

const MVP: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const settings = data.settings;

  const winnerId = settings.mvpWinnerPlayerId || settings.mvpPlayerId;
  const mvpPlayer = winnerId ? (() => {
    for (const team of data.teams) {
      const p = team.players.find(pl => pl.id === winnerId);
      if (p) return { player: p, team };
    }
    return null;
  })() : null;

  const stage: MvpStage = settings.mvpStage || 'announce';
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]         = useState(false);
  const [volume, setVolume]           = useState(0.5);
  const [muted, setMuted]             = useState(false);
  const [sessionPaused, setSessionPaused] = useState<boolean>(() => sessionStorage.getItem(SESSION_MVP_PAUSED_KEY) === 'true');
  const mvpMusicFileRef               = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone]   = useState(false);

  const stageMusicUrl = useMemo(() => {
    if (stage === 'announce') return settings.mvpAnnounceMusicUrl || '';
    if (stage === 'voting') return settings.mvpVotingMusicUrl || '';
    return settings.mvpFinishedMusicUrl || '';
  }, [settings.mvpAnnounceMusicUrl, settings.mvpVotingMusicUrl, settings.mvpFinishedMusicUrl, stage]);

  const stageCandidates = useMemo(() => {
    const byId = new Map<string, { player: Player; team: Team }>();
    for (const team of data.teams) {
      for (const player of team.players) {
        byId.set(player.id, { player, team });
      }
    }
    const ids = settings.mvpCandidatePlayerIds || [];
    return ids
      .map((id) => {
        const found = byId.get(id);
        if (!found) return null;
        return {
          id,
          nickname: found.player.nickname,
          teamName: found.team.name,
          isSubstitute: found.player.isSubstitute,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.nickname.trim().length > 0);
  }, [data.teams, settings.mvpCandidatePlayerIds]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // On mount: pause background music immediately. On unmount: resume it.
  useEffect(() => {
    window.dispatchEvent(new Event('pause-main-music'));
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaying(false);
      window.dispatchEvent(new Event('resume-main-music'));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload stage audio src when stage or music changes
  useEffect(() => {
    if (!audioRef.current) return;
    const url = stageMusicUrl || '';
    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
    if (url && !sessionPaused) {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [stageMusicUrl, sessionPaused]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      setSessionPaused(true);
      sessionStorage.setItem(SESSION_MVP_PAUSED_KEY, 'true');
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
      setSessionPaused(false);
      sessionStorage.removeItem(SESSION_MVP_PAUSED_KEY);
    }
  };

  const handleMvpMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Файл слишком большой (>20 МБ). Сожми MP3 или выбери другой.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadDone(false);

    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(file);
      });
      const key =
        stage === 'announce'
          ? 'mvpAnnounceMusicUrl'
          : stage === 'voting'
          ? 'mvpVotingMusicUrl'
          : 'mvpFinishedMusicUrl';
      updateSettings({ [key]: url } as Partial<typeof settings>);
      setUploadDone(true);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        if (!sessionPaused) {
          audioRef.current.play().catch(() => {});
          setPlaying(true);
        }
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Неизвестная ошибка загрузки');
    } finally {
      setUploading(false);
      if (mvpMusicFileRef.current) mvpMusicFileRef.current.value = '';
    }
  };

  const handleDeleteMusic = () => {
    if (stage === 'announce') updateSettings({ mvpAnnounceMusicUrl: '' });
    if (stage === 'voting') updateSettings({ mvpVotingMusicUrl: '' });
    if (stage === 'finished') updateSettings({ mvpFinishedMusicUrl: '' });
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false);
    setUploadDone(false);
    setUploadError(null);
  };

  const hasMusic = !!stageMusicUrl;
  const VolumeIcon = muted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-4xl">
        {hasMusic && (
          <audio ref={audioRef} loop preload="auto" />
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Star className="mx-auto mb-4 text-primary" size={56} />
          <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text mb-4">MVP Турнира</h1>
          <EditableText value={settings.mvpText} onSave={val => updateSettings({ mvpText: val })} as="p" className="text-muted-foreground whitespace-pre-line max-w-2xl mx-auto mb-3" multiline />
          <EditableText value={settings.mvpPrize} onSave={val => updateSettings({ mvpPrize: val })} as="p" className="text-foreground font-heading font-semibold mb-8" />
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-heading font-semibold bg-card/40 mb-4">
            {stage === 'announce' && 'Стадия 1: Анонс голосования'}
            {stage === 'voting' && 'Стадия 2: ГОЛОСОВАНИЕ ИДЁТ'}
            {stage === 'finished' && 'Стадия 3: Голосование завершено'}
          </div>
        </motion.div>

        {hasMusic && (
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded-lg font-heading font-semibold flex items-center gap-2 transition-colors ${
                playing ? 'btn-primary-gradient text-primary-foreground' : 'border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Music size={16} /> {playing ? 'Пауза' : 'Воспроизвести'}
            </button>
            <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground p-2">
              <VolumeIcon size={18} />
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              className="w-24 accent-primary"
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 sm:p-8 md:p-12 card-glow text-center"
        >
          {stage === 'announce' && (
            <>
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Star className="text-muted-foreground" size={48} />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Голосование ещё не началось</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Голосование за MVP будет проходить в Discord среди игроков всех участвующих команд.
              </p>
              <a
                href={data.settings.discordLink}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 btn-primary-gradient px-6 py-2 rounded-lg mt-6"
              >
                Перейти в Discord
              </a>
            </>
          )}

          {stage === 'voting' && (
            <>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/70 to-primary/30 flex items-center justify-center mx-auto mb-6">
                <Star className="text-primary-foreground" size={48} />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">ГОЛОСОВАНИЕ ИДЁТ</h2>
              {stageCandidates.length > 0 ? (
                <div className="max-w-lg mx-auto space-y-2 text-left">
                  {stageCandidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-lg border border-border/70 bg-background/40 px-4 py-2.5">
                      <p className="font-heading font-semibold text-foreground break-words">
                        {candidate.nickname}
                        {candidate.isSubstitute ? ' (запасной)' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{candidate.teamName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Список кандидатов будет опубликован здесь.</p>
              )}
            </>
          )}

          {stage === 'finished' && mvpPlayer && (
            <>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-primary-foreground" size={48} />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">{mvpPlayer.player.nickname}</h2>
              <p className="text-primary font-heading font-semibold mb-1">{mvpPlayer.team.name}</p>
              {mvpPlayer.player.isSubstitute && <p className="text-muted-foreground text-sm">Запасной игрок</p>}
              {mvpPlayer.player.mmr > 0 && (
                <p className="text-muted-foreground text-sm mt-1">MMR: {mvpPlayer.player.mmr.toLocaleString()}</p>
              )}
            </>
          )}

          {stage === 'finished' && !mvpPlayer && (
            <>
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Star className="text-muted-foreground" size={48} />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Победитель ещё не указан</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Голосование завершено. Победитель в номинации MVP появится здесь после обновления.
              </p>
            </>
          )}
        </motion.div>

        {isAdmin && isEditing && (
          <div className="glass-card rounded-2xl p-6 mt-8 space-y-5">
            <h3 className="font-heading font-bold text-foreground">Управление MVP</h3>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Текущая стадия MVP</label>
              <select
                className="w-full bg-background border rounded-lg p-3 text-foreground"
                value={stage}
                onChange={e => updateSettings({ mvpStage: e.target.value as MvpStage })}
              >
                <option value="announce">1) Анонс голосования</option>
                <option value="voting">2) Голосование идёт</option>
                <option value="finished">3) Финал (победитель)</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Кандидаты для голосования (стадия 2)</label>
              <div className="space-y-3 max-h-72 overflow-auto pr-1">
                {data.teams.map(team => (
                  <div key={team.id} className="rounded-lg border border-border/60 p-3">
                    <p className="font-heading text-sm font-semibold mb-2">{team.name}</p>
                    <div className="space-y-1">
                      {team.players.filter(p => p.nickname.trim()).map(player => {
                        const checked = (settings.mvpCandidatePlayerIds || []).includes(player.id);
                        return (
                          <label key={player.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                const next = new Set(settings.mvpCandidatePlayerIds || []);
                                if (event.target.checked) next.add(player.id);
                                else next.delete(player.id);
                                updateSettings({ mvpCandidatePlayerIds: Array.from(next) });
                              }}
                            />
                            <span>{player.nickname}{player.isSubstitute ? ' (запасной)' : ''}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Победитель MVP (стадия 3)</label>
              <select
                className="w-full bg-background border rounded-lg p-3 text-foreground"
                value={settings.mvpWinnerPlayerId || settings.mvpPlayerId}
                onChange={e => updateSettings({ mvpWinnerPlayerId: e.target.value, mvpPlayerId: e.target.value })}
              >
                <option value="">— MVP не выбран —</option>
                {data.teams.map(team => (
                  <optgroup key={team.id} label={team.name}>
                    {team.players.filter(p => p.nickname).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nickname}{p.isSubstitute ? ' (запасной)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                <Music size={15} className="inline mr-1" /> Музыка текущей стадии MVP
              </label>

              <div className="text-xs text-muted-foreground/70 bg-muted/30 rounded-lg px-3 py-2 mb-3">
                Отдельная MP3 для каждой стадии. Если трек не загружен, музыка не воспроизводится. Лимит: 20 МБ.
              </div>

              {hasMusic && !uploading && (
                <div className="flex items-center gap-3 mb-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-xs text-green-300 font-heading flex-1 truncate">Музыка активна</span>
                  <button
                    onClick={handleDeleteMusic}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 size={12} /> Убрать
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 mb-3 text-xs text-destructive">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadDone && !uploadError && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3 text-xs text-green-400">
                  <CheckCircle size={14} />
                  Загружено для текущей стадии.
                </div>
              )}

              <input
                ref={mvpMusicFileRef}
                type="file"
                accept="audio/*"
                onChange={handleMvpMusicUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => mvpMusicFileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Загружается…</>
                  : <><Upload size={16} /> {hasMusic ? 'Заменить MP3' : 'Загрузить MP3'}</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MVP;
