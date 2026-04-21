import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import { Plus, Trash2, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EASTER_EGG_DURATION_MS = 5010;
const SLASH_SOUND_DELAY_MS = 3200;
const BASE_URL = import.meta.env.BASE_URL;
const ZOOM_SOUND_SRC = `${BASE_URL}audio/reaper-zoom.mp3`;
const SLASH_SOUND_SRC = `${BASE_URL}audio/reaper-slash.mp3`;
const REAPER_WEBM_SRC = `${BASE_URL}media/reaper.webm`;
const REAPER_GIF_SRC = `${BASE_URL}media/reaper.gif`;
const REAPER_WEBM_PLAYBACK_RATE = 1;
const REAPER_CLICKS_REQUIRED = 10;
const REAPER_COUNTDOWN_LAST = 3;
const REAPER_COUNTDOWN_AFTER_FINAL_MS = 820;

const Organizers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const settings = data.settings;
  const navigate = useNavigate();
  const reaperClicksRef = React.useRef(0);
  const reaperTimeoutRef = React.useRef<number | null>(null);
  const slashSoundTimeoutRef = React.useRef<number | null>(null);
  const summonDelayTimeoutRef = React.useRef<number | null>(null);
  const countdownClearTimeoutRef = React.useRef<number | null>(null);
  const zoomAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const slashAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [mediaType, setMediaType] = React.useState<'webm' | 'gif' | 'none'>('webm');
  const [mediaPlayKey, setMediaPlayKey] = React.useState(0);
  const [reaperEasterEggActive, setReaperEasterEggActive] = React.useState(false);
  const [reaperCountdown, setReaperCountdown] = React.useState<number | null>(null);
  const [reaperSummonPending, setReaperSummonPending] = React.useState(false);
  const [pageShakeRef, animatePageShake] = useAnimate();

  const triggerPageShake = (level: 1 | 2 | 3) => {
    const el = pageShakeRef.current;
    if (!el) return;

    const soft = { x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 1, -1, 0], rotate: [0, -0.25, 0.25, 0] };
    const medium = { x: [0, -6, 5, -4, 6, 0], y: [0, 3, -4, 5, -2, 0], rotate: [0, -0.35, 0.35, -0.25, 0.25, 0] };
    const hard = { x: [0, -12, 10, -9, 12, -8, 10, 0], y: [0, 6, -8, 10, -6, -10, 8, 0], rotate: [0, -0.65, 0.7, -0.55, 0.6, -0.45, 0.5, 0] };

    const preset = level === 1 ? soft : level === 2 ? medium : hard;
    const duration = level === 1 ? 0.45 : level === 2 ? 0.6 : 0.8;

    void animatePageShake(el, preset, { duration, ease: 'easeInOut' });
  };

  const handleAddStaff = () => {
    updateSettings({ staffMembers: [...settings.staffMembers, { id: Date.now().toString(), name: 'Новый участник', role: 'Роль' }] });
  };
  const handleDeleteStaff = (id: string) => {
    updateSettings({ staffMembers: settings.staffMembers.filter(s => s.id !== id) });
  };
  const handleUpdateStaff = (id: string, field: 'name' | 'role', val: string) => {
    updateSettings({ staffMembers: settings.staffMembers.map(s => s.id === id ? { ...s, [field]: val } : s) });
  };

  const isReaperCard = (name: string, role: string) => {
    const normalized = `${name} ${role}`.toLowerCase();
    return normalized.includes('reaperlordyt');
  };

  const triggerReaperEasterEgg = () => {
    if (reaperEasterEggActive) return;

    setReaperSummonPending(false);
    setReaperCountdown(null);

    setMediaType('webm');
    setMediaPlayKey(prev => prev + 1);

    if (zoomAudioRef.current) {
      zoomAudioRef.current.currentTime = 0;
      void zoomAudioRef.current.play().catch(() => undefined);
    }

    slashSoundTimeoutRef.current = window.setTimeout(() => {
      if (!slashAudioRef.current) return;
      slashAudioRef.current.currentTime = 0;
      void slashAudioRef.current.play().catch(() => undefined);
    }, SLASH_SOUND_DELAY_MS);

    setReaperEasterEggActive(true);
    reaperTimeoutRef.current = window.setTimeout(() => {
      navigate('/');
      setReaperEasterEggActive(false);
      reaperClicksRef.current = 0;
    }, EASTER_EGG_DURATION_MS);
  };

  const handleStaffCardClick = (name: string, role: string) => {
    if (!isReaperCard(name, role) || reaperEasterEggActive || reaperSummonPending) return;
    reaperClicksRef.current += 1;
    const clicks = reaperClicksRef.current;
    const remaining = REAPER_CLICKS_REQUIRED - clicks;

    if (remaining > 0 && remaining <= REAPER_COUNTDOWN_LAST) {
      const level = (REAPER_COUNTDOWN_LAST - remaining + 1) as 1 | 2 | 3;
      triggerPageShake(level);

      if (countdownClearTimeoutRef.current !== null) {
        window.clearTimeout(countdownClearTimeoutRef.current);
      }
      setReaperCountdown(remaining);
      countdownClearTimeoutRef.current = window.setTimeout(() => {
        setReaperCountdown(null);
      }, 900);
    } else {
      triggerPageShake(1);
    }

    if (clicks >= REAPER_CLICKS_REQUIRED) {
      setReaperSummonPending(true);
      summonDelayTimeoutRef.current = window.setTimeout(() => {
        triggerReaperEasterEgg();
      }, REAPER_COUNTDOWN_AFTER_FINAL_MS);
    }
  };

  React.useEffect(() => {
    return () => {
      if (reaperTimeoutRef.current !== null) {
        window.clearTimeout(reaperTimeoutRef.current);
      }
      if (slashSoundTimeoutRef.current !== null) {
        window.clearTimeout(slashSoundTimeoutRef.current);
      }
      if (summonDelayTimeoutRef.current !== null) {
        window.clearTimeout(summonDelayTimeoutRef.current);
      }
      if (countdownClearTimeoutRef.current !== null) {
        window.clearTimeout(countdownClearTimeoutRef.current);
      }
      if (zoomAudioRef.current) {
        zoomAudioRef.current.pause();
        zoomAudioRef.current.currentTime = 0;
      }
      if (slashAudioRef.current) {
        slashAudioRef.current.pause();
        slashAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <PageLayout>
      <motion.div ref={pageShakeRef} className="relative">
        <audio ref={zoomAudioRef} src={ZOOM_SOUND_SRC} preload="auto" />
        <audio ref={slashAudioRef} src={SLASH_SOUND_SRC} preload="auto" />

        <AnimatePresence>
          {reaperCountdown !== null && (
            <motion.div
              key={`reaper-countdown-${reaperCountdown}`}
              className="fixed inset-0 z-[190] flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="font-display font-black gradient-text text-[clamp(6rem,28vw,18rem)] leading-none tracking-tight drop-shadow-[0_0_40px_hsl(var(--primary)/0.55)]"
                initial={{ scale: 2.2, opacity: 0, filter: 'blur(18px)' }}
                animate={{ scale: [2.2, 1, 1.06, 1.22], opacity: [0, 1, 0.95, 0], filter: ['blur(18px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'] }}
                transition={{ duration: 0.85, times: [0, 0.22, 0.72, 1], ease: [0.2, 0.8, 0.4, 1] }}
              >
                {reaperCountdown}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reaperEasterEggActive && (
            <motion.div
              key="reaper-easter-egg"
              className="fixed inset-0 z-[200] overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-transparent"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
              />

              <motion.div
                className="absolute left-0 top-0 h-1/2 w-full bg-transparent"
                initial={{ y: 0 }}
                animate={{ y: '-105%' }}
                transition={{ delay: 3.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="absolute left-0 bottom-0 h-1/2 w-full bg-transparent"
                initial={{ y: 0 }}
                animate={{ y: '105%' }}
                transition={{ delay: 3.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />

              <motion.div
                className="absolute left-0 top-1/2 h-[5px] w-full -translate-y-1/2 bg-[#3ec3ff]"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0.95] }}
                transition={{ delay: 3.15, duration: 0.55, times: [0, 0.45, 1], ease: 'easeOut' }}
                style={{ transformOrigin: 'left center' }}
              />

              <motion.div
                className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ delay: 3.22, duration: 0.2, ease: 'easeOut' }}
              />

              <motion.div
                className="absolute left-0 top-0 h-full w-full bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0] }}
                transition={{ delay: 3.23, duration: 0.22, times: [0, 0.35, 1] }}
              />

              <motion.div
                className="absolute left-0 top-1/2 h-[4px] w-full -translate-y-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.4, 0], backgroundPositionX: ['0%', '120%'] }}
                transition={{ delay: 3.2, duration: 0.6, ease: 'easeOut' }}
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, #3ec3ff 0 7px, transparent 7px 16px)',
                  backgroundSize: '220px 100%',
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="flex flex-col items-center"
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: [0.8, 5.2, 5.2, 1], opacity: [1, 1, 1, 1] }}
                  transition={{ duration: 4.45, times: [0, 0.18, 0.58, 0.76], ease: 'easeInOut' }}
                >
                  {mediaType === 'webm' && (
                    <video
                      key={`reaper-webm-${mediaPlayKey}`}
                      src={REAPER_WEBM_SRC}
                      className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] object-contain"
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={(e) => {
                        e.currentTarget.playbackRate = REAPER_WEBM_PLAYBACK_RATE;
                      }}
                      onError={() => setMediaType('gif')}
                    />
                  )}
                  {mediaType === 'gif' && (
                    <img
                      key={`reaper-gif-${mediaPlayKey}`}
                      src={REAPER_GIF_SRC}
                      alt="Reaper animation"
                      className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] object-contain"
                      onError={() => setMediaType('none')}
                    />
                  )}
                  {mediaType === 'none' && (
                    <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] flex items-center justify-center text-cyan-100 text-sm">
                      Media not found: /public/media/reaper.webm or reaper.gif
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl sm:text-4xl font-bold gradient-text mb-4 text-center">Организаторы</h1>
            <EditableText
              value={settings.organizersIntro}
              onSave={val => updateSettings({ organizersIntro: val })}
              as="p"
              className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto"
            />

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {settings.staffMembers.map((staff, i) => (
                <motion.div
                  key={staff.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-xl p-6 card-glow relative group"
                  onClick={() => handleStaffCardClick(staff.name, staff.role)}
                >
                  {isAdmin && isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStaff(staff.id);
                      }}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <Users className="text-primary" size={28} />
                  </div>
                  <EditableText value={staff.name} onSave={val => handleUpdateStaff(staff.id, 'name', val)} as="h3" className="font-heading font-bold text-lg text-foreground text-center mb-1" />
                  <EditableText value={staff.role} onSave={val => handleUpdateStaff(staff.id, 'role', val)} as="p" className="text-primary text-sm text-center font-heading" />
                </motion.div>
              ))}
            </div>

            {isAdmin && isEditing && (
              <div className="flex justify-center mb-12">
                <button onClick={handleAddStaff} className="px-6 py-3 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-2">
                  <Plus size={16} /> Добавить организатора
                </button>
              </div>
            )}

            {/* Contacts */}
            <div className="glass-card rounded-2xl p-5 sm:p-8 text-center card-glow">
              <h2 className="font-heading text-xl font-bold text-foreground mb-6">Контакты</h2>
              <div className="flex flex-col items-center gap-3">
                {settings.contactsList.map((contact, idx) => (
                  <EditableText
                    key={`${contact}-${idx}`}
                    value={contact}
                    onSave={val => {
                      const next = [...settings.contactsList];
                      next[idx] = val;
                      updateSettings({ contactsList: next });
                    }}
                    as="p"
                    className="text-muted-foreground"
                  />
                ))}
                <a href={settings.discordLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline mt-2">
                  <MessageCircle size={18} /> Discord-сервер
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Organizers;
