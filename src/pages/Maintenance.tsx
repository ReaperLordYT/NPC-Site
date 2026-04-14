import React from 'react';
import { useTournament } from '@/context/TournamentContext';
import { Wrench } from 'lucide-react';
import bgDark from '@/assets/bg-dark.png';

const Maintenance: React.FC = () => {
  const { data } = useTournament();
  const settings = data.settings;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-page pointer-events-none"
        style={{
          backgroundImage: `url(${bgDark})`,
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0 bg-background/80 pointer-events-none" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-10 max-w-2xl w-full text-center card-glow">
          <Wrench className="mx-auto mb-5 text-primary" size={48} />
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">{settings.maintenanceTitle}</h1>
          <p className="text-muted-foreground text-lg">{settings.maintenanceMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
