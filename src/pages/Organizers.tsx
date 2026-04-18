import React from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, MessageCircle } from 'lucide-react';

const Organizers: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const settings = data.settings;

  const handleAddStaff = () => {
    updateSettings({ staffMembers: [...settings.staffMembers, { id: Date.now().toString(), name: 'Новый участник', role: 'Роль' }] });
  };
  const handleDeleteStaff = (id: string) => {
    updateSettings({ staffMembers: settings.staffMembers.filter(s => s.id !== id) });
  };
  const handleUpdateStaff = (id: string, field: 'name' | 'role', val: string) => {
    updateSettings({ staffMembers: settings.staffMembers.map(s => s.id === id ? { ...s, [field]: val } : s) });
  };

  return (
    <PageLayout>
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
              >
                {isAdmin && isEditing && (
                  <button onClick={() => handleDeleteStaff(staff.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
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
