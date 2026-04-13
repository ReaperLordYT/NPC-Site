import React from 'react';
import { useTournament } from '@/context/TournamentContext';
import { Link } from 'react-router-dom';
import EditableText from '@/components/EditableText';

const Footer: React.FC = () => {
  const { data, updateSettings } = useTournament();
  const settings = data.settings;

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <EditableText value={settings.tournamentName} onSave={val => updateSettings({ tournamentName: val })} as="h3" className="font-display text-lg gradient-text mb-4" />
            <EditableText value={settings.tournamentDates} onSave={val => updateSettings({ tournamentDates: val })} as="p" className="text-muted-foreground text-sm" />
            <p className="text-muted-foreground text-sm mt-2">Турнир по Dota 2</p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4 text-foreground">Навигация</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Главная</Link>
              <Link to="/registration" className="text-muted-foreground hover:text-primary transition-colors">Регистрация</Link>
              <Link to="/rules" className="text-muted-foreground hover:text-primary transition-colors">Регламент</Link>
              <Link to="/teams" className="text-muted-foreground hover:text-primary transition-colors">Команды</Link>
              <Link to="/tournament" className="text-muted-foreground hover:text-primary transition-colors">Турнир</Link>
              <Link to="/schedule" className="text-muted-foreground hover:text-primary transition-colors">Расписание</Link>
              <Link to="/organizers" className="text-muted-foreground hover:text-primary transition-colors">Организаторы</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4 text-foreground">Контакты</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href={settings.discordLink} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                Discord-сервер
              </a>
              <EditableText value={settings.contactAdmin1} onSave={val => updateSettings({ contactAdmin1: val })} as="p" className="text-muted-foreground" />
              <EditableText value={settings.contactAdmin2} onSave={val => updateSettings({ contactAdmin2: val })} as="p" className="text-muted-foreground" />
              <Link to="/organizers" className="text-primary hover:underline mt-1">Все организаторы →</Link>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-xs">
          © 2026 NPC Championship. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
