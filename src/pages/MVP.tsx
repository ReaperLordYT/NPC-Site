import React, { useState, useRef, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { motion } from 'framer-motion';
import { Star, Upload, Volume2, VolumeX, Volume1, Music, Trophy, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  getGitHubConfig,
  isGitHubConfigured,
  saveFileToGitHub,
} from '@/integrations/github/storage';

const MVP_MUSIC_PATH = 'public/music/mvp.mp3';

async function uploadMusicToGitHub(file: File): Promise<string> {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub не настроен. Зайди в Admin → настрой GitHub токен.');
  }
  const cfg = getGitHubConfig()!;

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });

  const url = await saveFileToGitHub(
    cfg,
    MVP_MUSIC_PATH,
    base64,
    'chore: upload MVP music [skip ci]'
  );
  return `${url}?t=${Date.now()}`;
}

const MVP: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const settings = data.settings;

  const mvpPlayer = settings.mvpPlayerId ? (() => {
    for (const team of data.teams) {
      const p = team.players.find(pl => pl.id === settings.mvpPlayerId);
      if (p) return { player: p, team };
    }
    return null;
  })() : null;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]         = useState(false);
  const [volume, setVolume]           = useState(0.5);
  const [muted, setMuted]             = useState(false);
  const mvpMusicFileRef               = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone]   = useState(false);

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

  // Reload MVP audio src whenever mvpMusicUrl changes (upload or initial load)
  useEffect(() => {
    if (!audioRef.current) return;
    const url = settings.mvpMusicUrl || '';
    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
    if (url) {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [settings.mvpMusicUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
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
      const url = await uploadMusicToGitHub(file);
      updateSettings({ mvpMusicUrl: url });
      setUploadDone(true);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Неизвестная ошибка загрузки');
    } finally {
      setUploading(false);
      if (mvpMusicFileRef.current) mvpMusicFileRef.current.value = '';
    }
  };

  const handleDeleteMusic = () => {
    updateSettings({ mvpMusicUrl: '' });
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false);
    setUploadDone(false);
    setUploadError(null);
  };

  const hasMusic = !!settings.mvpMusicUrl;
  const VolumeIcon = muted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const ghReady = isGitHubConfigured();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        {hasMusic && (
          <audio ref={audioRef} loop preload="auto" />
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Star className="mx-auto mb-4 text-primary" size={56} />
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">MVP Турнира</h1>
          <EditableText value={settings.mvpText} onSave={val => updateSettings({ mvpText: val })} as="p" className="text-muted-foreground max-w-2xl mx-auto mb-4" multiline />
          <EditableText value={settings.mvpPrize} onSave={val => updateSettings({ mvpPrize: val })} as="p" className="text-foreground font-heading font-semibold mb-8" />
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
          className="glass-card rounded-2xl p-8 md:p-12 card-glow text-center"
        >
          {mvpPlayer ? (
            <>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-primary-foreground" size={48} />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">{mvpPlayer.player.nickname}</h2>
              <p className="text-primary font-heading font-semibold mb-1">{mvpPlayer.team.name}</p>
              {mvpPlayer.player.isSubstitute && <p className="text-muted-foreground text-sm">Запасной игрок</p>}
              {mvpPlayer.player.mmr > 0 && (
                <p className="text-muted-foreground text-sm mt-1">MMR: {mvpPlayer.player.mmr.toLocaleString()}</p>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Star className="text-muted-foreground" size={48} />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">MVP ещё не выбран</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Голосование за MVP пройдёт в Discord-канале после завершения турнира. Следите за обновлениями!
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
        </motion.div>

        {isAdmin && isEditing && (
          <div className="glass-card rounded-2xl p-6 mt-8 space-y-5">
            <h3 className="font-heading font-bold text-foreground">Управление MVP</h3>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Выберите MVP игрока</label>
              <select
                className="w-full bg-background border rounded-lg p-3 text-foreground"
                value={settings.mvpPlayerId}
                onChange={e => updateSettings({ mvpPlayerId: e.target.value })}
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
                <Music size={15} className="inline mr-1" /> Музыка MVP страницы
              </label>

              {!ghReady && (
                <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2.5 mb-3 text-xs text-amber-300">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>GitHub токен не настроен. Зайди в <strong>Admin → GitHub конфиг</strong>.</span>
                </div>
              )}

              {ghReady && (
                <div className="text-xs text-muted-foreground/70 bg-muted/30 rounded-lg px-3 py-2 mb-3">
                  MP3 загрузится в репо (<code className="text-primary/80">public/music/mvp.mp3</code>) и будет
                  слышен всем посетителям. Лимит: 20 МБ.
                </div>
              )}

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
                  Загружено в GitHub! Нажми «Сохранить в GitHub» чтобы обновить data.json.
                </div>
              )}

              <input
                ref={mvpMusicFileRef}
                type="file"
                accept="audio/*"
                onChange={handleMvpMusicUpload}
                className="hidden"
                disabled={uploading || !ghReady}
              />
              <button
                onClick={() => mvpMusicFileRef.current?.click()}
                disabled={uploading || !ghReady}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Загружается в GitHub…</>
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
