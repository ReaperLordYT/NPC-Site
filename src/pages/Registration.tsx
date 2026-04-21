import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { motion } from 'framer-motion';
import { FileText, Users } from 'lucide-react';

const Registration: React.FC = () => {
  const { data, updateSettings } = useTournament();
  const settings = data.settings;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <h1 data-tour="registration-title" className="font-display text-3xl md:text-5xl font-bold gradient-text mb-6 text-center">Регистрация</h1>
          <EditableText
            value={settings.registrationDeadlineText}
            onSave={val => updateSettings({ registrationDeadlineText: val })}
            as="p"
            className="text-center text-muted-foreground mb-10 sm:mb-12 text-base sm:text-lg"
          />

          <div className="glass-card rounded-2xl p-5 sm:p-8 mb-8 card-glow">
            <h2 className="font-heading text-xl sm:text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <FileText className="text-primary" size={24} /> Как подать заявку
            </h2>
            <EditableText
              value={settings.registrationHowToText}
              onSave={val => updateSettings({ registrationHowToText: val })}
              as="p"
              className="text-muted-foreground mb-6"
            />
            <a
              href={data.settings.googleFormLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-gradient w-full sm:w-auto justify-center px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg inline-flex items-center gap-2"
            >
              <Users size={20} /> Подать заявку
            </a>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-8 card-glow text-center">
            <p className="text-muted-foreground text-base sm:text-lg">
              Ознакомьтесь с регламентом перед подачей заявки.
            </p>
            <Link
              to="/rules"
              className="inline-flex mt-5 px-6 py-2 rounded-lg border border-border bg-card/50 hover:bg-card text-foreground font-heading font-semibold transition-colors"
            >
              Перейти к регламенту
            </Link>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default Registration;
