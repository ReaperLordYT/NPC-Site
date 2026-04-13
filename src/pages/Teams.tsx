import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import TeamEditor from '@/components/TeamEditor';

const Teams: React.FC = () => {
  const { data, isAdmin, isEditing, deleteTeam } = useTournament();
  const [showEditor, setShowEditor] = React.useState(false);

  const totalMmr = (players: any[]) =>
    players
      .filter((p: any) => !p.isSubstitute)
      .reduce((s: number, p: any) => s + (p.mmr || 0), 0);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text">Команды</h1>
          {isAdmin && isEditing && (
            <button
              onClick={() => setShowEditor(true)}
              className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} /> Добавить команду
            </button>
          )}
        </div>

        {showEditor && <TeamEditor onClose={() => setShowEditor(false)} />}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <Link to={`/teams/${team.id}`} className="block glass-card rounded-xl p-6 card-glow group">
                <div className="flex items-center gap-4 mb-4">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center font-display text-2xl text-muted-foreground">
                      {team.tag || team.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">[{team.tag}]</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">MMR: <span className="text-foreground font-heading font-semibold">{totalMmr(team.players)}</span></span>
                  <span className={`px-2 py-0.5 rounded text-xs font-heading ${
                    team.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    team.status === 'disqualified' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {team.status === 'confirmed' ? 'Подтверждена' :
                     team.status === 'disqualified' ? 'Дисквалифицирована' : team.status === 'withdrawn' ? 'Снялась' : 'Ожидается'}
                  </span>
                </div>
                {team.status === 'disqualified' && team.disqualificationReason && (
                  <p className="text-xs text-red-400 mt-2">Причина: {team.disqualificationReason}</p>
                )}
              </Link>
              {isAdmin && isEditing && (
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="absolute top-2 right-2 p-2 bg-card/90 rounded-md text-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {data.teams.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">Команд пока нет</div>
        )}
      </div>
    </PageLayout>
  );
};

export default Teams;
