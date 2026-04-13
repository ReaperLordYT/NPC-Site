import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import PageLayout from '@/components/PageLayout';
import { Calendar, Users, Trophy, MessageCircle, FileText, ChevronRight, HelpCircle, Tv, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/dateFormat';
import { InfoCard, FormatStage, FaqItem } from '@/types/tournament';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings, getTeamById } = useTournament();
  const settings = data.settings;

  // Info cards
  const handleUpdateCard = (id: string, field: 'label' | 'desc', val: string) => {
    updateSettings({ infoCards: settings.infoCards.map(c => c.id === id ? { ...c, [field]: val } : c) });
  };
  const handleAddCard = () => {
    updateSettings({ infoCards: [...settings.infoCards, { id: Date.now().toString(), label: 'Новый', desc: 'Описание' }] });
  };
  const handleDeleteCard = (id: string) => {
    updateSettings({ infoCards: settings.infoCards.filter(c => c.id !== id) });
  };

  // Format stages
  const handleUpdateFormat = (id: string, field: 'title' | 'desc', val: string) => {
    updateSettings({ formatStages: settings.formatStages.map(f => f.id === id ? { ...f, [field]: val } : f) });
  };
  const handleAddFormat = () => {
    updateSettings({ formatStages: [...settings.formatStages, { id: Date.now().toString(), title: 'Новый этап', desc: 'Описание' }] });
  };
  const handleDeleteFormat = (id: string) => {
    updateSettings({ formatStages: settings.formatStages.filter(f => f.id !== id) });
  };

  // FAQ
  const handleUpdateFaq = (id: string, field: 'q' | 'a', val: string) => {
    updateSettings({ faqItems: settings.faqItems.map(f => f.id === id ? { ...f, [field]: val } : f) });
  };
  const handleAddFaq = () => {
    updateSettings({ faqItems: [...settings.faqItems, { id: Date.now().toString(), q: 'Новый вопрос?', a: 'Ответ' }] });
  };
  const handleDeleteFaq = (id: string) => {
    updateSettings({ faqItems: settings.faqItems.filter(f => f.id !== id) });
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background/50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4 max-w-4xl mx-auto"
        >
          <div className="inline-block px-4 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-heading mb-6">
            <Calendar className="inline mr-2" size={14} />
            <EditableText value={settings.tournamentDates} onSave={val => updateSettings({ tournamentDates: val })} as="span" className="inline" />
          </div>
          <EditableText value={settings.tournamentName} onSave={val => updateSettings({ tournamentName: val })} as="h1" className="font-display text-5xl md:text-7xl lg:text-8xl font-black gradient-text mb-6 leading-tight" />
          <EditableText value={settings.heroSubtitle} onSave={val => updateSettings({ heroSubtitle: val })} as="p" className="text-lg md:text-xl text-muted-foreground font-heading mb-10 max-w-2xl mx-auto" />
          <div className="flex flex-wrap justify-center gap-4">
            <a href={settings.googleFormLink} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient px-8 py-3 rounded-lg text-lg inline-flex items-center gap-2">
              <Users size={20} /> Регистрация команды
            </a>
            <a href={settings.discordLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-lg border border-border bg-card/50 hover:bg-card text-foreground font-heading font-semibold inline-flex items-center gap-2 transition-colors">
              <MessageCircle size={20} /> Discord
            </a>
            <Link to="/rules" className="px-8 py-3 rounded-lg border border-border bg-card/50 hover:bg-card text-foreground font-heading font-semibold inline-flex items-center gap-2 transition-colors">
              <FileText size={20} /> Регламент
            </Link>
          </div>
          {isAdmin && isEditing && (
            <div className="mt-6 glass-card rounded-xl p-4 text-left max-w-md mx-auto space-y-2">
              <label className="text-xs text-muted-foreground font-heading">Discord ссылка</label>
              <input className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={settings.discordLink} onChange={e => updateSettings({ discordLink: e.target.value })} />
              <label className="text-xs text-muted-foreground font-heading">Google Form ссылка</label>
              <input className="w-full bg-background border rounded-lg p-2 text-foreground text-sm" value={settings.googleFormLink} onChange={e => updateSettings({ googleFormLink: e.target.value })} />
            </div>
          )}
        </motion.div>
      </section>

      {/* About */}
      <section className="container mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp} custom={0}>
            <EditableText value="О турнире" onSave={() => {}} as="h2" className="section-title mb-6" />
            <EditableText value={settings.aboutText} onSave={val => updateSettings({ aboutText: val })} as="p" className="text-muted-foreground leading-relaxed mb-4" multiline />
            <EditableText value={settings.aboutText2} onSave={val => updateSettings({ aboutText2: val })} as="p" className="text-muted-foreground leading-relaxed" multiline />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              {settings.infoCards.map((card, i) => (
                <div key={card.id} className="glass-card rounded-xl p-6 card-glow text-center relative group">
                  {isAdmin && isEditing && (
                    <button onClick={() => handleDeleteCard(card.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <Trophy className="mx-auto mb-3 text-primary" size={28} />
                  <EditableText value={card.label} onSave={val => handleUpdateCard(card.id, 'label', val)} as="h3" className="font-heading font-bold text-foreground" />
                  <EditableText value={card.desc} onSave={val => handleUpdateCard(card.id, 'desc', val)} as="p" className="text-sm text-muted-foreground" />
                </div>
              ))}
            </div>
            {isAdmin && isEditing && (
              <button onClick={handleAddCard} className="w-full py-2 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1 text-sm">
                <Plus size={14} /> Добавить карточку
              </button>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Format */}
      <section className="container mx-auto px-4 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="section-title mb-10 text-center">Формат турнира</motion.h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {settings.formatStages.map((item, i) => (
              <motion.div key={item.id} variants={fadeUp} custom={i} className="glass-card rounded-xl p-6 card-glow relative group">
                {isAdmin && isEditing && (
                  <button onClick={() => handleDeleteFormat(item.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="font-display text-3xl font-bold text-primary mb-3">{i + 1}</div>
                <EditableText value={item.title} onSave={val => handleUpdateFormat(item.id, 'title', val)} as="h3" className="font-heading font-bold text-lg text-foreground mb-2" />
                <EditableText value={item.desc} onSave={val => handleUpdateFormat(item.id, 'desc', val)} as="p" className="text-sm text-muted-foreground" multiline />
              </motion.div>
            ))}
          </div>
          {isAdmin && isEditing && (
            <div className="flex justify-center mt-4">
              <button onClick={handleAddFormat} className="px-4 py-2 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-1 text-sm">
                <Plus size={14} /> Добавить этап
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Latest News */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Новости</h2>
          <Link to="/news" className="text-primary font-heading font-semibold flex items-center gap-1 hover:underline">
            Все новости <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {data.news.slice(0, 3).map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link to={`/news/${item.id}`} className="block glass-card rounded-xl overflow-hidden card-glow group">
                {item.image && (
                  <div className="h-48 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs text-muted-foreground mb-2">{formatDate(item.date)}</p>
                  <h3 className="font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Teams */}
      {data.teams.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-title">Команды</h2>
            <Link to="/teams" className="text-primary font-heading font-semibold flex items-center gap-1 hover:underline">
              Все команды <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.teams.slice(0, 12).map(team => (
              <Link key={team.id} to={`/teams/${team.id}`} className="glass-card rounded-xl p-4 card-glow text-center group">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-16 h-16 mx-auto mb-3 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center font-display text-xl text-muted-foreground">
                    {team.tag || team.name[0]}
                  </div>
                )}
                <h3 className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{team.name}</h3>
                <p className="text-xs text-muted-foreground">[{team.tag}]</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Schedule */}
      {data.matches.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-title">Расписание матчей</h2>
            <Link to="/schedule" className="text-primary font-heading font-semibold flex items-center gap-1 hover:underline">
              Полное расписание <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.matches.slice(0, 5).map(match => {
              const t1 = getTeamById(match.team1Id);
              const t2 = getTeamById(match.team2Id);
              return (
                <div key={match.id} className={`glass-card rounded-xl p-4 flex items-center justify-between ${match.status === 'live' ? 'ring-1 ring-red-500/40' : ''}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-heading">{match.format}</span>
                    <div className="flex items-center gap-2">
                      {t1?.logo && <img src={t1.logo} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="font-heading font-semibold text-foreground text-base">{t1?.name || 'TBD'}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <div className="flex items-center gap-2">
                      {t2?.logo && <img src={t2.logo} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="font-heading font-semibold text-foreground text-base">{t2?.name || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {match.streamLink && (
                      <a href={match.streamLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Tv size={14} /> Трансляция
                      </a>
                    )}
                    {match.result && <span className="font-heading font-bold text-foreground">{match.result.team1Score} - {match.result.team2Score}</span>}
                    <span className={`px-2 py-0.5 rounded text-xs font-heading ${
                      match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                      match.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {match.status === 'live' ? '🔴 LIVE' : match.status === 'completed' ? 'Завершён' : 'Запланирован'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="section-title mb-10 text-center">Частые вопросы</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {settings.faqItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl relative group"
            >
              {isAdmin && isEditing && (
                <button onClick={() => handleDeleteFaq(item.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Trash2 size={14} />
                </button>
              )}
              <details className="group/details">
                <summary className="px-6 py-4 cursor-pointer font-heading font-semibold text-foreground flex items-center gap-3 list-none">
                  <HelpCircle size={18} className="text-primary flex-shrink-0" />
                  <EditableText value={item.q} onSave={val => handleUpdateFaq(item.id, 'q', val)} as="span" className="inline" />
                </summary>
                <div className="px-6 pb-4">
                  <EditableText value={item.a} onSave={val => handleUpdateFaq(item.id, 'a', val)} as="p" className="text-muted-foreground text-sm" multiline />
                </div>
              </details>
            </motion.div>
          ))}
          {isAdmin && isEditing && (
            <button onClick={handleAddFaq} className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1 text-sm">
              <Plus size={14} /> Добавить вопрос
            </button>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
