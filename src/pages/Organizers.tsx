import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EASTER_EGG_DURATION_MS = 5010;
const SLASH_SOUND_DELAY_MS = 3200;
const BASE_URL = import.meta.env.BASE_URL;
const ZOOM_SOUND_SRC = `${BASE_URL}audio/reaper-zoom.mp3`;
const SLASH_SOUND_SRC = `${BASE_URL}audio/reaper-slash.mp3`;
const REAPER_GIF_SRC = `${BASE_URL}media/reaper.gif`;

const Organizers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const settings = data.settings;
  const navigate = useNavigate();
  const reaperClicksRef = React.useRef(0);
  const reaperTimeoutRef = React.useRef<number | null>(null);
  const slashSoundTimeoutRef = React.useRef<number | null>(null);
  const zoomAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const slashAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [gifLoaded, setGifLoaded] = React.useState(true);
  const [reaperEasterEggActive, setReaperEasterEggActive] = React.useState(false);

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

    setGifLoaded(true);

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
    if (!isReaperCard(name, role) || reaperEasterEggActive) return;
    reaperClicksRef.current += 1;
    if (reaperClicksRef.current >= 7) {
      triggerReaperEasterEgg();
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
    };
  }, []);

  return (
    <PageLayout>
      <audio ref={zoomAudioRef} src={ZOOM_SOUND_SRC} preload="auto" />
      <audio ref={slashAudioRef} src={SLASH_SOUND_SRC} preload="auto" />

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
                {gifLoaded ? (
                  <img
                    src={REAPER_GIF_SRC}
                    alt="Reaper animation"
                    className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] object-contain mix-blend-screen brightness-110 contrast-125"
                    onError={() => setGifLoaded(false)}
                  />
                ) : (
                  <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] flex items-center justify-center text-cyan-100 text-sm">
                    GIF not found: /public/media/reaper.gif
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
    </PageLayout>
  );
};

export default Organizers;
