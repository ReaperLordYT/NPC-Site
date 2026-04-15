import React, { useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { ExternalLink, Link as LinkIcon, FileText, Save, RotateCcw } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

const DEFAULT_RULES_BANNER = '/rules-banner.png';
const TEAM_BUTTON_TOKEN = '{{TEAM_BUTTON}}';
const SOLO_BUTTON_TOKEN = '{{SOLO_BUTTON}}';

const resolveBannerUrl = (rawValue?: string) => {
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/');
  const value = (rawValue || '').trim();
  if (!value) return `${baseUrl}${DEFAULT_RULES_BANNER.replace(/^\/+/, '')}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${baseUrl}${value.replace(/^\/+/, '')}`;
};

const PROMO_BLOCK_HTML = `
<p><strong>Blank &nbsp;&nbsp;&nbsp;&nbsp;&middot; &nbsp;&nbsp;&nbsp;&nbsp;"NPC Championship"</strong></p>
<p>Снова собираем команды, снова считаем MMR и снова смотрим кто на самом деле умеет в Dota. Регистрация открыта - не тяни.</p>
<p><strong>- &nbsp;Начало - 25.04.2026</strong></p>
<p><strong>- &nbsp;Лимит MMR - 35 000</strong></p>
<p><strong>- &nbsp;Формат - 5 x 5 Capitans Mode</strong></p>
<p><strong>- &nbsp;Приз - 5 000 рублей</strong></p>
<p><strong>- &nbsp;Состав - 5 основных + до 2 запасных</strong></p>
<p><strong>- Дата проведения - 25.04.2026 - 26.04.2026</strong></p>
<p><strong>Blank &nbsp;&nbsp;&nbsp;&nbsp;&middot; &nbsp;&nbsp;&nbsp;&nbsp;"NPC Championship"</strong></p>
`.trim();

const Rules: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings } = useTournament();
  const rulesMode = data.settings.rulesMode || 'page';
  const rulesContent = data.settings.rulesContent || '';
  const rulesBannerImage = data.settings.rulesBannerImage || DEFAULT_RULES_BANNER;
  const canEditRules = isAdmin && isEditing;
  const [bannerSrc, setBannerSrc] = useState(resolveBannerUrl(rulesBannerImage));
  const [bannerFailed, setBannerFailed] = useState(false);

  const normalizedRulesContent = useMemo(() => {
    const trimmed = rulesContent.trim();
    if (!trimmed) return trimmed;
    if (trimmed.includes('Снова собираем команды, снова считаем MMR')) return trimmed;
    if (!trimmed.includes('NPC Championship - Официальный регламент')) return trimmed;
    return `${PROMO_BLOCK_HTML}\n${trimmed}`;
  }, [rulesContent]);

  const trimmedRulesContent = useMemo(() => normalizedRulesContent.trim(), [normalizedRulesContent]);
  const teamApplyLink = data.settings.googleFormLink?.trim();
  const soloApplyLink = data.settings.freePlayerFormLink?.trim();

  React.useEffect(() => {
    setBannerFailed(false);
    setBannerSrc(resolveBannerUrl(rulesBannerImage));
  }, [rulesBannerImage]);

  const rulesHtmlWithButtons = useMemo(() => {
    const html = trimmedRulesContent || '<p>Регламент пока не заполнен.</p>';

    const teamButtonHtml = teamApplyLink
      ? `<a href="${teamApplyLink}" target="_blank" rel="noopener noreferrer" class="rules-inline-link"><span>📝 Team</span><span>↗</span></a>`
      : `<span class="rules-inline-link rules-inline-link-muted">📝 Team (ссылка не задана)</span>`;

    const soloButtonHtml = soloApplyLink
      ? `<a href="${soloApplyLink}" target="_blank" rel="noopener noreferrer" class="rules-inline-link"><span>📝 Solo</span><span>↗</span></a>`
      : `<span class="rules-inline-link rules-inline-link-muted">📝 Solo (ссылка не задана)</span>`;

    return html
      .replaceAll(`<p>${TEAM_BUTTON_TOKEN}</p>`, `<p>${teamButtonHtml}</p>`)
      .replaceAll(`<p>${SOLO_BUTTON_TOKEN}</p>`, `<p>${soloButtonHtml}</p>`)
      .replaceAll(TEAM_BUTTON_TOKEN, teamButtonHtml)
      .replaceAll(SOLO_BUTTON_TOKEN, soloButtonHtml);
  }, [trimmedRulesContent, teamApplyLink, soloApplyLink]);

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
              {bannerSrc && !bannerFailed ? (
                <img
                  src={bannerSrc}
                  alt="Баннер регламента"
                  className="w-full rounded-xl border border-border/60 object-contain bg-background/40 max-h-[420px]"
                  onError={() => {
                    const fallbackSrc = resolveBannerUrl(DEFAULT_RULES_BANNER);
                    if (bannerSrc !== fallbackSrc) {
                      setBannerSrc(fallbackSrc);
                      return;
                    }
                    setBannerFailed(true);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 px-4 py-5 text-sm text-muted-foreground bg-background/30">
                  Не удалось загрузить баннер. Проверьте путь или нажмите "Сбросить", чтобы вернуть `rules-banner.png`.
                </div>
              )}

              {canEditRules && (
                <div className="mt-3 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Ссылка на баннер</label>
                    <input
                      className="w-full bg-background border rounded-lg p-2 text-foreground text-sm"
                      placeholder="/rules-banner.png или https://..."
                      value={rulesBannerImage}
                      onChange={e => {
                        setBannerFailed(false);
                        setBannerSrc(resolveBannerUrl(e.target.value));
                        updateSettings({ rulesBannerImage: e.target.value });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="h-10 px-3 rounded-lg border text-xs font-heading text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    onClick={() => {
                      setBannerFailed(false);
                      setBannerSrc(resolveBannerUrl(DEFAULT_RULES_BANNER));
                      updateSettings({ rulesBannerImage: DEFAULT_RULES_BANNER });
                    }}
                    title="Вернуть баннер по умолчанию"
                  >
                    <RotateCcw size={13} /> Сбросить
                  </button>
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
                  <p className="text-xs text-muted-foreground">
                    Для ручного размещения кнопок используйте в тексте токены: <code>{TEAM_BUTTON_TOKEN}</code> и <code>{SOLO_BUTTON_TOKEN}</code>
                    (или кнопки Team/Solo в панели редактора).
                  </p>
                <RichTextEditor
                  value={normalizedRulesContent}
                  onChange={(nextValue) => updateSettings({ rulesContent: nextValue })}
                />
              </div>
            ) : (
              <article
                className="rules-content"
                dangerouslySetInnerHTML={{
                  __html: rulesHtmlWithButtons,
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
