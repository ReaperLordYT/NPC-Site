import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReaperWithScythe: React.FC = () => (
  <svg viewBox="0 0 420 420" className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]" fill="none">
    <defs>
      <linearGradient id="bladeBlue" x1="0%" y1="0%" x2="100%" y2="80%">
        <stop offset="0%" stopColor="#dbf4ff" />
        <stop offset="100%" stopColor="#52b5ff" />
      </linearGradient>
    </defs>

    <motion.g
      initial={{ rotate: -16 }}
      animate={{ rotate: [0, 0, 0, 34, 34] }}
      transition={{ duration: 3.7, times: [0, 0.55, 0.72, 0.8, 1], ease: 'easeInOut' }}
      style={{ transformOrigin: '292px 165px' }}
    >
      <line x1="292" y1="82" x2="252" y2="338" stroke="#7f8da6" strokeWidth="10" strokeLinecap="round" />
      <path d="M297 84 C 385 76, 410 132, 355 176 C 322 140, 282 128, 246 128 Z" fill="url(#bladeBlue)" stroke="#d9f2ff" strokeWidth="3" />
    </motion.g>

    <path d="M210 102 C 153 102, 108 145, 95 198 C 76 275, 132 334, 210 356 C 288 334, 344 275, 325 198 C 312 145, 267 102, 210 102Z" fill="#1d3660" />
    <path d="M210 118 C 171 118, 136 146, 128 188 C 121 228, 140 266, 210 297 C 280 266, 299 228, 292 188 C 284 146, 249 118, 210 118Z" fill="#243f6f" />

    <ellipse cx="210" cy="185" rx="56" ry="50" fill="#f4fbff" />
    <path d="M178 178 C 186 167, 199 167, 206 178 C 196 184, 189 184, 178 178Z" fill="#0e2748" />
    <path d="M214 178 C 221 167, 234 167, 242 178 C 231 184, 224 184, 214 178Z" fill="#0e2748" />

    <motion.circle
      cx="192"
      cy="178"
      r="6"
      fill="#45b7ff"
      animate={{ r: [6, 6, 7.5, 6, 7.5, 6] }}
      transition={{ duration: 1.5, delay: 0.8, times: [0, 0.15, 0.35, 0.55, 0.75, 1] }}
    />
    <motion.circle
      cx="228"
      cy="178"
      r="6"
      fill="#45b7ff"
      animate={{ r: [6, 6, 7.5, 6, 7.5, 6] }}
      transition={{ duration: 1.5, delay: 0.8, times: [0, 0.15, 0.35, 0.55, 0.75, 1] }}
    />

    <motion.path
      d="M188 210 Q 210 232 232 210"
      stroke="#0e2748"
      strokeWidth="4"
      strokeLinecap="round"
      animate={{ x: [0, -2, 2, -2, 2, 0], y: [0, 1, -1, 1, -1, 0] }}
      transition={{ duration: 1.5, delay: 0.8, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
    />
  </svg>
);

const Organizers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const settings = data.settings;
  const navigate = useNavigate();
  const reaperClicksRef = React.useRef(0);
  const reaperTimeoutRef = React.useRef<number | null>(null);
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

    setReaperEasterEggActive(true);
    reaperTimeoutRef.current = window.setTimeout(() => {
      navigate('/');
      setReaperEasterEggActive(false);
      reaperClicksRef.current = 0;
    }, 4200);
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
    };
  }, []);

  return (
    <PageLayout>
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
              transition={{ delay: 3.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute left-0 bottom-0 h-1/2 w-full bg-transparent"
              initial={{ y: 0 }}
              animate={{ y: '105%' }}
              transition={{ delay: 3.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.div
              className="absolute left-0 top-1/2 h-[5px] w-full -translate-y-1/2 bg-[#3ec3ff]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0.95] }}
              transition={{ delay: 2.95, duration: 0.55, times: [0, 0.45, 1], ease: 'easeOut' }}
              style={{ transformOrigin: 'left center' }}
            />

            <motion.div
              className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 3.02, duration: 0.2, ease: 'easeOut' }}
            />

            <motion.div
              className="absolute left-0 top-0 h-full w-full bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.95, 0] }}
              transition={{ delay: 3.03, duration: 0.22, times: [0, 0.35, 1] }}
            />

            <motion.div
              className="absolute left-0 top-1/2 h-[4px] w-full -translate-y-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4, 0], backgroundPositionX: ['0%', '120%'] }}
              transition={{ delay: 3.0, duration: 0.6, ease: 'easeOut' }}
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
                transition={{ duration: 3.7, times: [0, 0.16, 0.56, 0.72], ease: 'easeInOut' }}
              >
                <ReaperWithScythe />
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
