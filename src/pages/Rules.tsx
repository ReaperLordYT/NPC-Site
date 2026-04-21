import React, { useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { ExternalLink, Link as LinkIcon, FileText, Save, RotateCcw } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

const DEFAULT_RULES_BANNER = '/rules-banner.png';
const TEAM_BUTTON_TOKEN = '{{TEAM_BUTTON}}';
const SOLO_BUTTON_TOKEN = '{{SOLO_BUTTON}}';
const FREE_PLAYERS_LINK_TOKEN = '{{FREE_PLAYERS_LINK}}';

const RULES_TEMPLATE_HTML = `
<p><strong>Blank &nbsp;&nbsp;&nbsp;&nbsp;&middot; &nbsp;&nbsp;&nbsp;&nbsp;"NPC Championship"</strong></p>
<p>NPC Championship — Официальный регламент<br/>Все участники обязаны соблюдать данный регламент.</p>
<p><strong>1. КОМАНДЫ И ИГРОКИ</strong></p>
<p>&nbsp;</p>
<p><strong>1.1 Состав команды</strong></p>
<ul>
<li>Команда состоит из 5 основных игроков.</li>
<li>Допускается 2 запасных игрока (максимум 7 человек в заявке).</li>
<li>Указание ролей не требуется — игроки могут менять позиции в любое время.</li>
</ul>
<p>&nbsp;</p>
<p><strong>1.2 Ограничение по MMR</strong></p>
<ul>
<li>Максимальный суммарный рейтинг команды: 35 000 MMR.</li>
<li>Ограничение применяется к фактическому составу, участвующему в матче.</li>
</ul>
<p>&nbsp;</p>
<p><strong>1.3 Замены</strong></p>
<ul>
<li>Разрешены 2 замены.</li>
<li>Запасные игроки не могут нарушать лимит MMR при выходе в игру.</li>
<li>На момент проведения матча в команде может единовеременно заменяться только 2 игрока.</li>
</ul>
<p>&nbsp;</p>
<p><strong>1.4 Уточнение</strong></p>
<ul>
<li>Разрешено брать на замену игроков выбывших из турнира.</li>
<li>Запрещено участия игрока, который не был зарегестрирован ни в одной из команд ранее, а также в свободных игроках.</li>
</ul>
<p>&nbsp;</p>
<p><strong>1.5 Все участники дают согласие на проверку аккаунта (по запросу)</strong></p>
<p>Организатор оставляет за собой право дисквалифицировать игрока при подозрении в нарушении правил.</p>
<p><strong>2. РЕГИСТРАЦИЯ И ОБЩИЕ ПРАВИЛА</strong></p>
<p>&nbsp;</p>
<p><strong>2.1 Подача заявок</strong></p>
<ul>
<li>Капитан команды обязан предоставить полный состав до <strong>24.04.2026</strong></li>
<li>Капитан обязан предоставить название и логотип команды.</li>
<li>Заявки, поданные после указанного срока не рассматриваются ни при каких условиях.</li>
</ul>
<p>&nbsp;</p>
<p><strong>2.2 Общие требования к участникам</strong></p>
<p>Каждый игрок обязан иметь:</p>
<ul>
<li>Открытый профиль Dotabuff.</li>
<li>Общедоступную историю матчей.</li>
<li>Не обманывать при указе настооящего ммр. Может последовать бан.</li>
</ul>
<p>Организаторы вправе дополнительно запросить демонстрацию входа в аккаунт Steam.</p>
<p>&nbsp;</p>
<p><strong>2.3 Публичность составов</strong></p>
<p>Все зарегистрированные составы публикуются в открытом доступе.</p>
<p><strong>2.4 Свободные игроки</strong></p>
<p>Свободные игроки могут оставить заявку здесь</p>
<p><strong>3. ИГРОВЫЕ ПРАВИЛА И ПРОВЕДЕНИЕ МАТЧЕЙ</strong></p>
<p>&nbsp;</p>
<p><strong>3.1 Расписание матчей</strong></p>
<ul>
<li>Все матчи проводятся строго по расписанию.</li>
<li>Команды обязаны быть готовы к началу игры в назначенное время.</li>
</ul>
<p>&nbsp;</p>
<p><strong>3.2 Явка команд</strong></p>
<ul>
<li>Все игроки команды должны находиться в голосовом канале не позднее чем за 10 минут до начала матча.</li>
</ul>
<p>&nbsp;</p>
<p><strong>3.3 Задержки</strong></p>
<p>В случае неготовности команды:</p>
<ul>
<li>Предоставляется 15 минут на устранение проблемы.</li>
</ul>
<p>По истечении времени - фиксируется техническое поражение.</p>
<p>&nbsp;</p>
<p><strong>3.4 Паузы</strong></p>
<p>Каждой команде предоставляются паузы:</p>
<ul>
<li>Общее время на паузы 15 минут.</li>
</ul>
<p>По истечении 15 минут соперник имеет право снять паузу без согласования.</p>
<p>&nbsp;</p>
<p><strong>3.5 Завершение игры (GG)</strong></p>
<p>Сообщение “GG” в игровом чате:</p>
<ul>
<li>Не учитывавется, если использовано с колеса чата.</li>
</ul>
<p><strong>Если написано руками:</strong></p>
<ul>
<li>Автоматически считается признанием поражения.</li>
<li>Не может быть отменено или оспорено.</li>
</ul>
<p>&nbsp;</p>
<p><strong>3.6 Проведение матчей</strong></p>
<p>Матчи будут проводиться параллельно.<br/>Командам запрещается:</p>
<ul>
<li>Самостоятельно договариваться о переносе времени.</li>
<li>Проводить матч без согласования с представителем организаторов.</li>
</ul>
<p>&nbsp;</p>
<p><strong>3.7 Софт</strong></p>
<p>Если вы намерены использовать сторонние программы для получения преимуществ в игре, то вы будете забанены навсегда на всех турнирах сервера.<br/>Если в матче будет замечено использование софта, то команда игрока, использовавшего софт, будет дисквалифицирована на месте без дальнейшего обжалования.</p>
<p><strong>4. ОРГАНИЗАЦИЯ ТУРНИРА</strong></p>
<p>&nbsp;</p>
<p><strong>4.1 Коммуникация</strong></p>
<ul>
<li>Каждая группа закрепляется за отдельным организатором.</li>
<li>Вопросы по матчам направляются исключительно закрпленному за вашей командой организатору.</li>
</ul>
<p>&nbsp;</p>
<p><strong>4.2 Контроль со стороны организаторов</strong></p>
<p>Организаторы имеют право подключаться к голосовым каналам команд, запрашивать необходимую информацию в любое время.</p>
<p>&nbsp;</p>
<p><strong>4.3 Подозрение в мошенничестве</strong></p>
<p>Капитан команды после матча имеет право запросить проверку игры на софт. (<strong>см. 3.7</strong>)<br/>Принимайте поражение с гордостью и не обвиняйте каждого в софте.</p>
<p>&nbsp;</p>
<p><strong>4.4 Формат проведения турнира</strong></p>
<p>Формат и расписание будет опубликованы за 2 дня до начала турнира.</p>
<p><strong>ВСЕ СПОРНЫЕ СИТУАЦИИ РЕШАЮТСЯ ОРГАНИЗАТОРАМИ В КОНОЧАТЕЛЬНОЙ ФОРМЕ И НЕ ПОДЛЕЖАТ ОСПАРИВАНИЮ.</strong></p>
<p>&lt;@520287458496217098&gt;</p>
`.trim();

const resolveBannerUrl = (rawValue?: string) => {
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/');
  const value = (rawValue || '').trim();
  if (!value) return `${baseUrl}${DEFAULT_RULES_BANNER.replace(/^\/+/, '')}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${baseUrl}${value.replace(/^\/+/, '')}`;
};

const getFreePlayersPageUrl = () => {
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/');
  return `${baseUrl}#/free-players`;
};

const Rules: React.FC = () => {
  const { data, isAdmin, isEditing, updateSettings, saveNow, saving, saveError } = useTournament();
  const rulesMode = data.settings.rulesMode || 'page';
  const rulesContent = data.settings.rulesContent || '';
  const rulesBannerImage = data.settings.rulesBannerImage || DEFAULT_RULES_BANNER;
  const canEditRules = isAdmin && isEditing;
  const [bannerSrc, setBannerSrc] = useState(resolveBannerUrl(rulesBannerImage));
  const [bannerFailed, setBannerFailed] = useState(false);

  const trimmedRulesContent = useMemo(() => rulesContent.trim(), [rulesContent]);
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

    const freePlayersLinkHtml = `<a href="${getFreePlayersPageUrl()}" class="rules-inline-link"><span>👤 Свободные игроки</span><span aria-hidden="true">↗</span></a>`;

    return html
      .replaceAll(`<p>${TEAM_BUTTON_TOKEN}</p>`, `<p>${teamButtonHtml}</p>`)
      .replaceAll(`<p>${SOLO_BUTTON_TOKEN}</p>`, `<p>${soloButtonHtml}</p>`)
      .replaceAll(`<p>${FREE_PLAYERS_LINK_TOKEN}</p>`, `<p>${freePlayersLinkHtml}</p>`)
      .replaceAll(TEAM_BUTTON_TOKEN, teamButtonHtml)
      .replaceAll(SOLO_BUTTON_TOKEN, soloButtonHtml)
      .replaceAll(FREE_PLAYERS_LINK_TOKEN, freePlayersLinkHtml);
  }, [trimmedRulesContent, teamApplyLink, soloApplyLink]);

  // If link mode and we have a link, redirect
  if (rulesMode === 'link' && data.settings.rulesLink) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 sm:py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text mb-8">Регламент турнира</h1>
            <p className="text-muted-foreground mb-8">Регламент доступен по внешней ссылке</p>
            <a
              href={data.settings.rulesLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-gradient px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg inline-flex items-center gap-2"
            >
              <ExternalLink size={20} /> Открыть регламент
            </a>

            {isAdmin && isEditing && (
              <div className="mt-8 glass-card rounded-xl p-6 max-w-md mx-auto space-y-4">
                <h3 className="font-heading font-bold text-foreground">Настройки режима</h3>
                <div className="flex gap-2 flex-wrap justify-center">
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
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
         
          className="font-display text-3xl md:text-5xl font-bold gradient-text mb-12 sm:mb-16 text-center"
        >
          Регламент турнира
        </motion.h1>

        {isAdmin && isEditing && (
          <div className="max-w-4xl mx-auto mb-8 glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
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
                <div className="w-full aspect-video rounded-xl border border-border/60 overflow-hidden bg-background/40">
                  <img
                    src={bannerSrc}
                    alt="Баннер регламента"
                    className="w-full h-full object-cover object-center"
                    onError={() => {
                      const fallbackSrc = resolveBannerUrl(DEFAULT_RULES_BANNER);
                      if (bannerSrc !== fallbackSrc) {
                        setBannerSrc(fallbackSrc);
                        return;
                      }
                      setBannerFailed(true);
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 px-4 py-5 text-sm text-muted-foreground bg-background/30">
                  Не удалось загрузить баннер. Проверьте путь или нажмите "Сбросить", чтобы вернуть `rules-banner.png`.
                </div>
              )}

              {canEditRules && (
                <div className="mt-3 flex items-end gap-2 flex-wrap">
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
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-muted-foreground">
                      Выделите текст, чтобы появилось всплывающее меню форматирования (жирный, курсив и т.д.).
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = window.confirm('Заменить текущий текст регламента на шаблон? Текущий текст будет перезаписан.');
                        if (!ok) return;
                        updateSettings({ rulesContent: RULES_TEMPLATE_HTML });
                        await saveNow();
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-heading text-muted-foreground hover:text-foreground"
                      title="Перезаписать регламент этим текстом"
                    >
                      Вставить шаблон
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        updateSettings({ rulesContent });
                        await saveNow();
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-heading text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      title="Сохранить изменения регламента"
                    >
                      <Save size={14} /> {saving ? 'Сохраняю...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
                {saveError && (
                  <p className="text-xs text-destructive">
                    Ошибка сохранения: {saveError}
                  </p>
                )}
                  <p className="text-xs text-muted-foreground">
                    Для ручного размещения ссылок используйте токены: <code>{TEAM_BUTTON_TOKEN}</code>, <code>{SOLO_BUTTON_TOKEN}</code>, <code>{FREE_PLAYERS_LINK_TOKEN}</code>
                    (или кнопки в панели редактора).
                  </p>
                <RichTextEditor
                  value={rulesContent}
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
