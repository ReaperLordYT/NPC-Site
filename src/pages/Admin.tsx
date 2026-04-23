import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { Shield, LogIn, Settings, Upload, Music, CheckCircle, AlertCircle, Loader2, RefreshCw, DatabaseBackup, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Admin: React.FC = () => {
  const { isAdmin, login, data, updateSettings, toggleEditing, isEditing, saving, saveError, refreshData, backups, refreshBackups, createBackup, restoreBackup, deleteBackup } = useTournament();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backupNote, setBackupNote] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const musicFileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState(data.settings);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setSettings(data.settings);
  }, [data.settings]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(data.settings),
    [settings, data.settings]
  );

  const applyDeadlineMask = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    const hh = digits.slice(8, 10);
    const min = digits.slice(10, 12);

    let masked = dd;
    if (mm) masked += `-${mm}`;
    if (yyyy) masked += `-${yyyy}`;
    if (hh) masked += `-${hh}`;
    if (min) masked += `:${min}`;
    return masked;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email.trim(), password);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    }
  };

  const handleSaveSettings = () => { updateSettings(settings); };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setSettings(p => ({ ...p, musicUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await refreshBackups();
    setRefreshing(false);
  };

  const handleCreateBackup = async () => {
    await createBackup(backupNote.trim() || 'manual backup');
    setBackupNote('');
  };

  const handleDeleteBackup = async (backupId: string) => {
    const confirmed = window.confirm('Удалить этот бэкап? Это действие нельзя отменить.');
    if (!confirmed) return;
    setDeletingBackupId(backupId);
    try {
      await deleteBackup(backupId);
    } finally {
      setDeletingBackupId(null);
    }
  };

  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 max-w-md w-full">
            <Shield className="mx-auto mb-4 text-primary" size={48} />
            <h1 className="font-display text-2xl font-bold text-center text-foreground mb-6">Вход в админ-панель</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="admin@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <button type="submit" className="btn-primary-gradient w-full py-3 rounded-lg flex items-center justify-center gap-2">
                <LogIn size={18} /> Войти
              </button>
            </form>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-4xl pb-28 sm:pb-20">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold gradient-text">Админ-панель</h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Save status indicator */}
            {saving && (
              <span className="flex items-center gap-1 text-xs text-primary font-heading">
                <Loader2 size={14} className="animate-spin" /> Сохранение в Supabase…
              </span>
            )}
            {!saving && saveError && (
              <span className="flex items-center gap-1 text-xs text-destructive font-heading">
                <AlertCircle size={14} /> Ошибка: {saveError}
              </span>
            )}
            <button onClick={handleRefresh} className="hidden sm:flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors" title="Обновить данные из Supabase">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Обновить
            </button>
            <button onClick={toggleEditing} className={`hidden sm:block px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-heading font-semibold transition-all ${isEditing ? 'btn-primary-gradient' : 'bg-card border text-muted-foreground'}`}>
              {isEditing ? '✏️ Редактирование ВКЛ' : '✏️ Включить редактирование'}
            </button>
          </div>
        </div>

        <p className="text-muted-foreground mb-8">
          Включите режим редактирования, затем перейдите на любую страницу сайта.
          Вы увидите кнопки для добавления, удаления и редактирования контента прямо на страницах.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-12">
          {[
            { label: 'Команды', path: '/teams', count: data.teams.length },
            { label: 'Матчи', path: '/schedule', count: data.matches.length },
            { label: 'Турнир', path: '/tournament', count: data.groups.length + ' групп' },
            { label: 'Регистрация', path: '/registration', count: '' },
            { label: 'Регламент', path: '/rules', count: '' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} className="glass-card rounded-xl p-3 sm:p-6 text-left card-glow">
              <h3 className="font-heading font-bold text-foreground mb-1 text-sm sm:text-base">{item.label}</h3>
              {item.count !== '' && <p className="text-xs sm:text-sm text-muted-foreground">{item.count} записей</p>}
            </button>
          ))}
        </div>

        {/* ── Backups ───────────────────────────────────────────────────── */}
        <details className="glass-card rounded-2xl p-6 mb-8" open>
          <summary className="list-none cursor-pointer">
            <h2 className="font-heading text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <DatabaseBackup size={22} className="text-primary" /> Бэкапы и откат
            </h2>
          </summary>
          <p className="text-xs text-muted-foreground mb-2">Создавайте снапшоты и откатывайте изменения</p>
          <p className="text-sm text-muted-foreground mb-5">
            Создавайте снапшоты перед крупными изменениями. При откате система восстановит все данные
            (команды, матчи, настройки) из выбранного бэкапа.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              className="flex-1 bg-background border rounded-lg p-3 text-foreground text-sm min-w-0"
              placeholder="Комментарий к бэкапу (например: перед финальными сетками)"
              value={backupNote}
              onChange={e => setBackupNote(e.target.value)}
            />
            <button onClick={handleCreateBackup} className="btn-primary-gradient px-5 py-2 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap">
              <CheckCircle size={16} /> Создать бэкап
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {backups.length === 0 && <p className="text-xs text-muted-foreground">Бэкапов пока нет.</p>}
            {backups.map(backup => (
              <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background/50 border rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{backup.note || 'snapshot'}</p>
                  <p className="text-xs text-muted-foreground break-all">{new Date(backup.createdAt).toLocaleString()} · {backup.createdBy}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => restoreBackup(backup.id)}
                    className="px-3 py-1.5 border rounded-lg text-xs text-muted-foreground hover:text-foreground"
                  >
                    Восстановить
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    disabled={deletingBackupId === backup.id}
                    className="px-3 py-1.5 border rounded-lg text-xs text-muted-foreground hover:text-destructive disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deletingBackupId === backup.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* ── Site Settings ─────────────────────────────────────────────── */}
        <details className="glass-card rounded-2xl p-6" open>
          <summary className="list-none cursor-pointer">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Settings size={22} className="text-primary" /> Настройки сайта
            </h2>
          </summary>
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 p-4 sm:p-5">
              <h3 className="font-heading font-bold text-foreground mb-4">Основное</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Название турнира (и заголовок вкладки браузера)</label>
                  <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.tournamentName} onChange={e => setSettings(p => ({ ...p, tournamentName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Даты</label>
                  <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.tournamentDates} onChange={e => setSettings(p => ({ ...p, tournamentDates: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Страница «Организаторы»: текст под заголовком</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.organizersIntro}
                    onChange={e => setSettings(p => ({ ...p, organizersIntro: e.target.value }))}
                    placeholder="Команда, которая стоит за NPC CHAMPIONSHIP"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Discord ссылка</label>
                  <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.discordLink} onChange={e => setSettings(p => ({ ...p, discordLink: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Ссылка на регламент (Google Docs)</label>
                  <input className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="https://docs.google.com/..." value={settings.rulesLink} onChange={e => setSettings(p => ({ ...p, rulesLink: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Режим регламента</label>
                  <select className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.rulesMode} onChange={e => setSettings(p => ({ ...p, rulesMode: e.target.value as 'page' | 'link' }))}>
                    <option value="page">Страница на сайте</option>
                    <option value="link">Внешняя ссылка (Google Docs)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Текст в футере (копирайт)</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.footerCopyright}
                    onChange={e => setSettings(p => ({ ...p, footerCopyright: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-4 sm:p-5">
              <h3 className="font-heading font-bold text-foreground mb-4">Регистрация</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Google Form ссылка</label>
                  <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.googleFormLink} onChange={e => setSettings(p => ({ ...p, googleFormLink: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Форма для свободных игроков</label>
                  <input className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="https://docs.google.com/forms/..." value={settings.freePlayerFormLink} onChange={e => setSettings(p => ({ ...p, freePlayerFormLink: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Дедлайн регистрации (МСК, формат: ДД-ММ-ГГГГ-ЧЧ:ММ)</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.registrationDeadlineAt || ''}
                    onChange={e => setSettings(p => ({ ...p, registrationDeadlineAt: applyDeadlineMask(e.target.value) }))}
                    placeholder="24-04-2026-12:30"
                    inputMode="numeric"
                    maxLength={16}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Уведомления о дедлайне на главной</label>
                  <select
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.showRegistrationAlertsOnHome ? 'on' : 'off'}
                    onChange={e => setSettings(p => ({ ...p, showRegistrationAlertsOnHome: e.target.value === 'on' }))}
                  >
                    <option value="on">Включены</option>
                    <option value="off">Выключены</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Текст: дедлайн регистрации</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.registrationDeadlineText}
                    onChange={e => setSettings(p => ({ ...p, registrationDeadlineText: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Текст: как подать заявку</label>
                  <textarea
                    className="w-full bg-background border rounded-lg p-3 text-foreground min-h-[88px]"
                    value={settings.registrationHowToText}
                    onChange={e => setSettings(p => ({ ...p, registrationHowToText: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-4 sm:p-5">
              <h3 className="font-heading font-bold text-foreground mb-4">Режимы и системные плашки</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Режим турнира</label>
                  <select
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.tournamentCompleted ? 'completed' : 'active'}
                    onChange={e => setSettings(p => ({ ...p, tournamentCompleted: e.target.value === 'completed' }))}
                  >
                    <option value="active">Активный (расписание готовится)</option>
                    <option value="completed">Завершён</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Режим техработ</label>
                  <select
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.maintenanceEnabled ? 'on' : 'off'}
                    onChange={e => setSettings(p => ({ ...p, maintenanceEnabled: e.target.value === 'on' }))}
                  >
                    <option value="off">Выключен</option>
                    <option value="on">Включен</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Заголовок страницы техработ</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.maintenanceTitle}
                    onChange={e => setSettings(p => ({ ...p, maintenanceTitle: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Сообщение на странице техработ</label>
                  <textarea
                    className="w-full bg-background border rounded-lg p-3 text-foreground min-h-[90px]"
                    value={settings.maintenanceMessage}
                    onChange={e => setSettings(p => ({ ...p, maintenanceMessage: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Плашка: расписание готовится</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.schedulePreparingText}
                    onChange={e => setSettings(p => ({ ...p, schedulePreparingText: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Плашка: турнир завершён</label>
                  <input
                    className="w-full bg-background border rounded-lg p-3 text-foreground"
                    value={settings.scheduleCompletedText}
                    onChange={e => setSettings(p => ({ ...p, scheduleCompletedText: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-4 sm:p-5">
              <h3 className="font-heading font-bold text-foreground mb-4">Контакты</h3>
              <div className="space-y-2">
                {settings.contactsList.map((contact, idx) => (
                  <div key={`${contact}-${idx}`} className="flex gap-2">
                    <input
                      className="flex-1 bg-background border rounded-lg p-3 text-foreground min-w-0"
                      value={contact}
                      onChange={e => setSettings(p => {
                        const next = [...p.contactsList];
                        next[idx] = e.target.value;
                        return { ...p, contactsList: next };
                      })}
                      placeholder="Новый контакт"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings(p => ({
                        ...p,
                        contactsList: p.contactsList.filter((_, i) => i !== idx),
                      }))}
                      className="px-3 py-2 border rounded-lg text-muted-foreground hover:text-destructive"
                      title="Удалить контакт"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSettings(p => ({ ...p, contactsList: [...p.contactsList, ''] }))}
                  className="px-4 py-2 border border-dashed rounded-lg text-muted-foreground hover:text-primary hover:border-primary inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Добавить контакт
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-4 sm:p-5">
              <h3 className="font-heading font-bold text-foreground mb-4">Медиа</h3>
              <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-2">
                <Music size={16} /> Фоновая музыка
              </label>
              <div className="flex gap-3 items-center flex-wrap">
                <input ref={musicFileRef} type="file" accept="audio/mp3,audio/mpeg,audio/*" onChange={handleMusicUpload} className="hidden" />
                <button onClick={() => musicFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Upload size={16} /> {settings.musicUrl ? 'Заменить MP3' : 'Загрузить MP3'}
                </button>
                {settings.musicUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 font-heading">✓ Музыка загружена</span>
                    <button onClick={() => setSettings(p => ({ ...p, musicUrl: '' }))} className="text-xs text-muted-foreground hover:text-destructive">Удалить</button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Загрузите MP3 файл (до 4 минут). Можно также указать URL:</p>
              <input className="w-full bg-background border rounded-lg p-2 text-foreground text-sm mt-1" placeholder="https://example.com/music.mp3" value={settings.musicUrl?.startsWith('data:') ? '' : settings.musicUrl} onChange={e => setSettings(p => ({ ...p, musicUrl: e.target.value }))} />
            </div>
          </div>
          {!isMobile && (
            <button onClick={handleSaveSettings} className="btn-primary-gradient px-6 py-2 rounded-lg mt-6">
              {hasUnsavedChanges ? 'Сохранить настройки' : 'Настройки сохранены'}
            </button>
          )}
        </details>
      </div>
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur p-3">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
              title="Обновить данные"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Обновить
            </button>
            <button
              onClick={toggleEditing}
              className={`px-3 py-2 rounded-lg text-xs font-heading font-semibold transition-all ${isEditing ? 'btn-primary-gradient' : 'bg-card border text-muted-foreground'}`}
            >
              {isEditing ? 'Редактир.' : 'Режим правки'}
            </button>
            <button
              onClick={handleSaveSettings}
              className={`px-3 py-2 rounded-lg text-xs font-heading font-semibold ${
                hasUnsavedChanges ? 'btn-primary-gradient' : 'border text-muted-foreground'
              }`}
            >
              {hasUnsavedChanges ? 'Сохранить' : 'Сохранено'}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Admin;
