import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReaperWithScythe: React.FC = () => (
  <svg viewBox="0 0 360 360" className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]" fill="none">
    <defs>
      <radialGradient id="cloakGlow" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#9ae6ff" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#091226" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="scytheBlade" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d8f5ff" />
        <stop offset="55%" stopColor="#95cfe4" />
        <stop offset="100%" stopColor="#6a9ab4" />
      </linearGradient>
    </defs>

    <circle cx="180" cy="186" r="120" fill="url(#cloakGlow)" />

    <motion.g
      initial={{ rotate: -18, x: -8, y: 10 }}
      animate={{ rotate: [0, 22, -8], x: [0, 18, -2], y: [0, -6, 0] }}
      transition={{ duration: 1, ease: 'easeInOut', times: [0, 0.65, 1] }}
      style={{ transformOrigin: '220px 150px' }}
    >
      <line x1="224" y1="88" x2="198" y2="274" stroke="#9c7648" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M228 90 C 308 82, 344 126, 330 172 C 298 128, 265 116, 208 118 Z"
        fill="url(#scytheBlade)"
        stroke="#d6ecf9"
        strokeWidth="2.5"
      />
    </motion.g>

    <path d="M180 72 C 144 72, 114 98, 102 142 C 90 192, 112 254, 180 302 C 248 254, 270 192, 258 142 C 246 98, 216 72, 180 72Z" fill="#0d1424" stroke="#223754" strokeWidth="3" />
    <ellipse cx="180" cy="132" rx="44" ry="42" fill="#0a101d" />
    <circle cx="165" cy="130" r="5" fill="#9ae6ff" />
    <circle cx="195" cy="130" r="5" fill="#9ae6ff" />
    <path d="M172 146 Q 180 154 188 146" stroke="#9ae6ff" strokeWidth="2" strokeLinecap="round" />
    <path d="M138 194 C 156 212, 206 212, 224 194" stroke="#1d2d47" strokeWidth="5" strokeLinecap="round" />
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
    }, 2800);
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
              className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />

            <motion.div
              className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800/85"
              initial={{ x: 0 }}
              animate={{ x: '-110%' }}
              transition={{ delay: 1.25, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800/85"
              initial={{ x: 0 }}
              animate={{ x: '110%' }}
              transition={{ delay: 1.25, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.div
              className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-300 to-transparent shadow-[0_0_24px_rgba(34,211,238,0.9)]"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ delay: 0.9, duration: 1.2, times: [0, 0.3, 1], ease: 'easeOut' }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ scale: 0.7, opacity: 0, rotate: -14 }}
                animate={{ scale: 1.12, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              >
                <motion.div
                  className="rounded-full bg-cyan-400/15 p-6 border border-cyan-300/35"
                  animate={{ boxShadow: ['0 0 0px rgba(34,211,238,0.2)', '0 0 38px rgba(34,211,238,0.95)', '0 0 12px rgba(34,211,238,0.5)'] }}
                  transition={{ duration: 1.2, times: [0, 0.45, 1], ease: 'easeInOut' }}
                >
                  <ReaperWithScythe />
                </motion.div>
                <motion.p
                  className="font-heading text-cyan-100/90 tracking-widest text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  THE REAPER IS COMING
                </motion.p>
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
