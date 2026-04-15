import React, { useMemo } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { ExternalLink, Link as LinkIcon, FileText, Save } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

const Rules: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const rulesMode = data.settings.rulesMode || 'page';
  const rulesContent = data.settings.rulesContent || '';
  const rulesBannerImage = data.settings.rulesBannerImage || '';
  const canEditRules = isAdmin && isEditing;

  const trimmedRulesContent = useMemo(() => rulesContent.trim(), [rulesContent]);

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

        <div className="max-w-4xl mx-auto space-y-6">
          {(rulesBannerImage || canEditRules) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4"
            >
              {rulesBannerImage ? (
                <img
                  src={rulesBannerImage}
                  alt="Баннер регламента"
                  className="w-full rounded-xl border border-border/60 object-cover max-h-[380px]"
                />
              ) : (
                <div className="text-sm text-muted-foreground px-2 py-1">Добавьте ссылку на баннер регламента.</div>
              )}

              {canEditRules && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Ссылка на баннер</label>
                  <input
                    className="w-full bg-background border rounded-lg p-2 text-foreground text-sm"
                    placeholder="/rules-banner.png или https://..."
                    value={rulesBannerImage}
                    onChange={e => updateSettings({ rulesBannerImage: e.target.value })}
                  />
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 md:p-8"
          >
            {canEditRules ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Выделите текст, чтобы появилось всплывающее меню форматирования (жирный, курсив и т.д.).
                  </p>
                  <button
                    type="button"
                    onClick={() => updateSettings({ rulesContent })}
                    className="px-3 py-1.5 rounded-lg border text-xs font-heading text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    title="Сохранить изменения регламента"
                  >
                    <Save size={14} /> Обновить
                  </button>
                </div>
                <RichTextEditor
                  value={rulesContent}
                  onChange={(nextValue) => updateSettings({ rulesContent: nextValue })}
                />
              </div>
            ) : (
              <article
                className="rules-content"
                dangerouslySetInnerHTML={{
                  __html: trimmedRulesContent || '<p>Регламент пока не заполнен.</p>',
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Rules;
