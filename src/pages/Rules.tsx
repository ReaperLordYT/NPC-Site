import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import EditableText from '@/components/EditableText';
import { motion } from 'framer-motion';
import { Shield, Users, AlertCircle, Trophy, ExternalLink, Link as LinkIcon, FileText } from 'lucide-react';

const defaultSections = [
  {
    icon: Shield,
    title: 'Правила участия',
    content: [
      'Суммарный рейтинг команды (5 игроков) не должен превышать 30 000 MMR.',
      'У каждого игрока должен быть открытый профиль DotaBuff.',
      'Игроки могут менять роли между матчами по решению команды.',
      'Команда должна иметь минимум 5 основных игроков. Запасные разрешены.',
      'Каждый игрок может быть заявлен только в одной команде.',
      'Замена игрока возможна только до начала турнира и с согласия организаторов.',
      'Капитан команды несёт полную ответственность за действия своего состава.',
    ],
  },
  {
    icon: Users,
    title: 'Организационный регламент',
    content: [
      'Турнир проводится 28-29 марта 2026 года.',
      'Все матчи проводятся на серверах Dota 2 (регион по согласованию).',
      'Лобби создаётся организаторами или назначенным судьёй.',
      'Команда должна быть готова к матчу в указанное время. Опоздание более 15 минут — техническое поражение.',
      'Все спорные ситуации решаются организаторами. Решение организаторов окончательное.',
      'Организаторы вправе изменить расписание с предварительным уведомлением команд.',
      'Результаты матчей фиксируются скриншотами и/или записями.',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Правила поведения участников',
    content: [
      'Запрещены любые формы оскорблений, расизма, сексизма и дискриминации.',
      'Запрещено использование читов, скриптов и любого стороннего ПО.',
      'Запрещён коучинг во время матча (никто не должен подсказывать игрокам).',
      'Запрещены договорные матчи.',
      'Нарушение правил поведения может привести к дисквалификации команды.',
      'Все участники обязаны проявлять уважение к соперникам и организаторам.',
      'Общение в лобби и чате должно оставаться корректным.',
    ],
  },
  {
    icon: Trophy,
    title: 'Формат турнира',
    content: [
      'Групповой этап: Round-Robin в группах. Матчи Bo2.',
      'Система начисления очков: победа 2-0 = 3 очка, ничья 1-1 = 1 очко, поражение 0-2 = 0 очков.',
      'Из каждой группы выходят 2 лучшие команды в плей-офф.',
      'Плей-офф: Double Elimination (верхняя и нижняя сетка).',
      'Матчи плей-офф проводятся в формате Bo1.',
      'Гранд-финал проводится в формате Bo3.',
      'Команда из верхней сетки имеет преимущество в гранд-финале.',
      'Каждая команда имеет право на 1 паузу до 5 минут за карту.',
    ],
  },
];

const Rules: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const rulesMode = data.settings.rulesMode || 'page';

  // If link mode and we have a link, redirect
  if (rulesMode === 'link' && data.settings.rulesLink) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-8">Регламент турнира</h1>
            <p className="text-muted-foreground mb-8">Регламент доступен по внешней ссылке</p>
            <a
              href={data.settings.rulesLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-gradient px-8 py-4 rounded-lg text-lg inline-flex items-center gap-2"
            >
              <ExternalLink size={20} /> Открыть регламент
            </a>

            {isAdmin && isEditing && (
              <div className="mt-8 glass-card rounded-xl p-6 max-w-md mx-auto space-y-4">
                <h3 className="font-heading font-bold text-foreground">Настройки режима</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ rulesMode: 'page' })}
                    className="px-4 py-2 rounded-lg border text-sm font-heading text-muted-foreground hover:text-foreground"
                  >
                    <FileText size={14} className="inline mr-1" /> Режим страницы
                  </button>
                  <button className="px-4 py-2 rounded-lg btn-primary-gradient text-sm font-heading">
                    <LinkIcon size={14} className="inline mr-1" /> Режим ссылки
                  </button>
                </div>
                <input
                  className="w-full bg-background border rounded-lg p-2 text-foreground text-sm"
                  placeholder="Ссылка на Google Docs"
                  value={data.settings.rulesLink}
                  onChange={e => updateSettings({ rulesLink: e.target.value })}
                />
              </div>
            )}
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-bold gradient-text mb-16 text-center"
        >
          Регламент турнира
        </motion.h1>

        {isAdmin && isEditing && (
          <div className="max-w-4xl mx-auto mb-8 glass-card rounded-xl p-4 flex items-center gap-4">
            <span className="text-sm font-heading text-muted-foreground">Режим:</span>
            <button className="px-3 py-1.5 rounded-lg btn-primary-gradient text-xs font-heading">
              <FileText size={12} className="inline mr-1" /> Страница
            </button>
            <button
              onClick={() => updateSettings({ rulesMode: 'link' })}
              className="px-3 py-1.5 rounded-lg border text-xs font-heading text-muted-foreground hover:text-foreground"
            >
              <LinkIcon size={12} className="inline mr-1" /> Ссылка
            </button>
            {rulesMode === 'link' || data.settings.rulesLink ? (
              <input
                className="flex-1 bg-background border rounded-lg p-1.5 text-foreground text-xs"
                placeholder="Ссылка на Google Docs"
                value={data.settings.rulesLink}
                onChange={e => updateSettings({ rulesLink: e.target.value })}
              />
            ) : null}
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
          {defaultSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-8 card-glow"
            >
              <h2 className="font-heading text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <section.icon className="text-primary" size={28} />
                <EditableText
                  value={section.title}
                  onSave={() => {}}
                  as="span"
                  className=""
                />
              </h2>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <EditableText
                      value={item}
                      onSave={() => {}}
                      as="span"
                      className="text-muted-foreground"
                    />
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Rules;
