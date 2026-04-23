import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTournament } from '@/context/TournamentContext';
import { useRegistrationDeadline } from '@/hooks/useRegistrationDeadline';
import { formatRemainingTime } from '@/lib/registrationDeadline';
import EditableText from '@/components/EditableText';
import PageLayout from '@/components/PageLayout';
import { Calendar, Users, Trophy, FileText, ChevronRight, Tv, Plus, Trash2 } from 'lucide-react';
import { DiscordIcon } from '@/components/icons/DiscordIcon';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/** Общая вёрстка кнопок героя; размер текста задаётся отдельно (у Discord крупнее). */
const heroCtaLayout =
  'inline-flex items-center justify-center rounded-lg px-5 sm:px-6 py-3.5 font-bold tracking-wide';
const heroCtaText = 'gap-2.5 sm:gap-3 text-lg sm:text-xl';
const heroCtaBoxBase = `${heroCtaLayout} ${heroCtaText}`;
const heroCtaBox = `${heroCtaBoxBase} min-h-14`;

/** Discord: крупнее подпись и лого, чем у нижнего ряда. */
const heroDiscordCta = `${heroCtaLayout} gap-3 sm:gap-3.5 text-xl sm:text-2xl`;

const Index: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings, getTeamById } = useTournament();
  const settings = data.settings;
  const registrationState = useRegistrationDeadline(settings.registrationDeadlineAt);
  const showAlertsOnHome = settings.showRegistrationAlertsOnHome;
  const scheduledMatches = data.matches
    .filter(match => match.status === 'scheduled')
    .sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`))
    .slice(0, 5);

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

  /** На sm+ высота ряда из 3 кнопок = высоте самой высокой (часто 2 строки у «Регистрации»). Подгоняем Discord под эту же высоту «коробки». */
  const heroCtaRowRef = useRef<HTMLDivElement>(null);
  const [discordBoxHeightPx, setDiscordBoxHeightPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const row = heroCtaRowRef.current;
    if (!row) return;

    const mq = window.matchMedia('(min-width: 640px)');

    const apply = () => {
      if (!mq.matches) {
        setDiscordBoxHeightPx(null);
        return;
      }
      const h = Math.round(row.getBoundingClientRect().height);
      if (h > 0) setDiscordBoxHeightPx(h);
    };

    const ro = new ResizeObserver(apply);
    ro.observe(row);
    mq.addEventListener('change', apply);
    apply();

    return () => {
      ro.disconnect();
      mq.removeEventListener('change', apply);
    };
  }, [settings.freePlayerFormLink]);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-x-hidden overflow-y-visible">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background/50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-visible text-center px-4 max-w-4xl mx-auto w-full"
        >
          <div className="inline-block px-4 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-heading mb-6">
            <Calendar className="inline mr-2" size={14} />
            <EditableText value={settings.tournamentDates} onSave={val => updateSettings({ tournamentDates: val })} as="span" className="inline" />
          </div>
          <EditableText
            value={settings.tournamentName}
            onSave={val => updateSettings({ tournamentName: val })}
            as="h1"
            className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black gradient-text leading-snug break-words hyphens-none mb-6"
          />
          <EditableText
            value={settings.heroSubtitle}
            onSave={val => updateSettings({ heroSubtitle: val })}
            as="p"
            className="text-base sm:text-lg md:text-xl text-muted-foreground font-heading mb-8 sm:mb-10 max-w-2xl mx-auto"
          />
          {!registrationState.isClosed && registrationState.hasDeadline && showAlertsOnHome && (
            <motion.div
              initial={{ opacity: 0, x: 24, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed right-4 top-20 z-40 w-[min(22rem,calc(100vw-2rem))] sm:right-6 sm:top-24"
            >
              <div className="rounded-xl border border-primary/35 bg-background/90 p-4 text-left shadow-[0_10px_35px_rgba(22,35,75,0.45)] backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-primary/80 font-heading mb-1">Уведомление</p>
                <p className="text-sm sm:text-base font-heading text-foreground">Успейте зарегистрироваться</p>
                <p className="text-sm text-primary mt-1">
                  До конца регистрации осталось {formatRemainingTime(registrationState.remainingMs)}.
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Время указано по МСК.</p>
              </div>
            </motion.div>
          )}
          {registrationState.isClosed && showAlertsOnHome && (
            <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm sm:text-base font-heading text-destructive">
              Регистрация команд закрыта. Новые заявки больше не принимаются.
            </div>
          )}
          {!registrationState.isClosed && registrationState.isClosingSoon && showAlertsOnHome && (
            <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm sm:text-base font-heading text-amber-200">
              Регистрация команд завершится в течение 24 часов.
            </div>
          )}
          <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
            <div className="flex w-full max-w-4xl justify-center">
              <a
                href={settings.discordLink}
                target="_blank"
                rel="noopener noreferrer"
                style={
                  discordBoxHeightPx != null
                    ? { height: discordBoxHeightPx, minHeight: discordBoxHeightPx, boxSizing: 'border-box' }
                    : undefined
                }
                className={`btn-primary-gradient ${heroDiscordCta} ${discordBoxHeightPx == null ? 'min-h-14' : ''} box-border w-auto max-w-full sm:w-[calc((100%_-_2rem)_/_2)]`}
              >
                <DiscordIcon size={32} className="shrink-0" />
                Discord
              </a>
            </div>
            <div
              ref={heroCtaRowRef}
              className="flex w-full max-w-4xl flex-col flex-wrap justify-center gap-3 sm:flex-row sm:gap-4 sm:items-stretch"
            >
              {registrationState.isClosed ? (
                <div
                  className={`w-full sm:flex-1 sm:min-w-[200px] justify-center rounded-lg border border-border bg-card/50 text-muted-foreground font-heading ${heroCtaBox}`}
                >
                  <Users size={24} /> Регистрация закрыта
                </div>
              ) : (
                <a
                  href={settings.googleFormLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn-primary-gradient w-full sm:flex-1 sm:min-w-[200px] justify-center ${heroCtaBox}`}
                >
                  <Users size={24} /> Регистрация команды
                </a>
              )}
              {settings.freePlayerFormLink?.trim() && (
                <a
                  href={settings.freePlayerFormLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn-primary-gradient w-full sm:flex-1 sm:min-w-[200px] justify-center ${heroCtaBox}`}
                >
                  <Users size={24} /> Я свободный игрок
                </a>
              )}
              <Link
                to="/rules"
                className={`w-full sm:flex-1 sm:min-w-[200px] justify-center border border-border bg-card/50 hover:bg-card text-foreground font-heading transition-colors ${heroCtaBox}`}
              >
                <FileText size={24} /> Регламент
              </Link>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {settings.formatStages.length > 0 ? (
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
          ) : (
            <div className="max-w-3xl mx-auto glass-card rounded-xl p-8 text-center text-muted-foreground">
              Информация будет указана позже.
            </div>
          )}
          {isAdmin && isEditing && (
            <div className="flex justify-center mt-4">
              <button onClick={handleAddFormat} className="px-4 py-2 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-1 text-sm">
                <Plus size={14} /> Добавить этап
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Teams */}
      {data.teams.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between gap-3 mb-10 flex-wrap">
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
                {team.titleText && (
                  <p className={`text-[11px] mt-1 ${team.titleStyle === 'current' ? 'text-amber-300' : 'text-primary'}`}>
                    {team.titleEmoji || '🏆'} {team.titleText}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Schedule */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Расписание матчей</h2>
          <Link to="/schedule" className="text-primary font-heading font-semibold flex items-center gap-1 hover:underline">
            Полное расписание <ChevronRight size={16} />
          </Link>
        </div>
        {scheduledMatches.length > 0 ? (
          <div className="space-y-3">
            {scheduledMatches.map(match => {
              const t1 = getTeamById(match.team1Id);
              const t2 = getTeamById(match.team2Id);
              return (
                <div key={match.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-heading">{match.format}</span>
                    <div className="flex items-center gap-2">
                      {t1?.logo && <img src={t1.logo} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="font-heading font-semibold text-foreground text-base break-words">{t1?.name || 'TBD'}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <div className="flex items-center gap-2">
                      {t2?.logo && <img src={t2.logo} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="font-heading font-semibold text-foreground text-base break-words">{t2?.name || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
                    {match.streamLink && (
                      <a href={match.streamLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Tv size={14} /> Трансляция
                      </a>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-heading bg-muted text-muted-foreground">
                      Запланирован
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            <EditableText
              value={settings.tournamentCompleted ? settings.scheduleCompletedText : settings.schedulePreparingText}
              onSave={val => {
                if (settings.tournamentCompleted) {
                  updateSettings({ scheduleCompletedText: val });
                } else {
                  updateSettings({ schedulePreparingText: val });
                }
              }}
              as="p"
              className="text-muted-foreground"
            />
          </div>
        )}
      </section>

    </PageLayout>
  );
};

export default Index;
