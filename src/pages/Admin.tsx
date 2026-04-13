import React, { useState, useRef } from 'react';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { Shield, LogIn, Settings, Upload, Music, Github, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getGitHubConfig,
  saveGitHubConfig,
  clearGitHubConfig,
  isGitHubConfigured,
  GitHubConfig,
} from '@/integrations/github/storage';

const Admin: React.FC = () => {
  const { isAdmin, login, data, updateSettings, toggleEditing, isEditing, saving, saveError, refreshData } = useTournament();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const musicFileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState(data.settings);

  // ── GitHub config state ─────────────────────────────────────────────────
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() =>
    getGitHubConfig() ?? { owner: '', repo: '', branch: 'main', token: '' }
  );
  const [ghSaved, setGhSaved] = useState(isGitHubConfigured());
  const [refreshing, setRefreshing] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(token.trim());
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

  const handleSaveGitHub = () => {
    if (!ghConfig.owner || !ghConfig.repo || !ghConfig.token) {
      alert('Заполните owner, repo и token');
      return;
    }
    saveGitHubConfig(ghConfig);
    setGhSaved(true);
  };

  const handleClearGitHub = () => {
    clearGitHubConfig();
    setGhConfig({ owner: '', repo: '', branch: 'main', token: '' });
    setGhSaved(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 max-w-md w-full">
            <Shield className="mx-auto mb-4 text-primary" size={48} />
            <h1 className="font-display text-2xl font-bold text-center text-foreground mb-6">Вход в админ-панель</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="GitHub token с правами записи" value={token} onChange={e => setToken(e.target.value)} />
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
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display text-3xl font-bold gradient-text">Админ-панель</h1>
          <div className="flex items-center gap-3">
            {/* Save status indicator */}
            {saving && (
              <span className="flex items-center gap-1 text-xs text-primary font-heading">
                <Loader2 size={14} className="animate-spin" /> Сохранение в GitHub…
              </span>
            )}
            {!saving && saveError && (
              <span className="flex items-center gap-1 text-xs text-destructive font-heading">
                <AlertCircle size={14} /> Ошибка: {saveError}
              </span>
            )}
            {!saving && !saveError && ghSaved && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-heading">
                <CheckCircle size={14} /> GitHub подключён
              </span>
            )}
            <button onClick={handleRefresh} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors" title="Обновить данные из GitHub">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Обновить
            </button>
            <button onClick={toggleEditing} className={`px-4 py-2 rounded-lg font-heading font-semibold transition-all ${isEditing ? 'btn-primary-gradient' : 'bg-card border text-muted-foreground'}`}>
              {isEditing ? '✏️ Редактирование ВКЛ' : '✏️ Включить редактирование'}
            </button>
          </div>
        </div>

        <p className="text-muted-foreground mb-8">
          Включите режим редактирования, затем перейдите на любую страницу сайта.
          Вы увидите кнопки для добавления, удаления и редактирования контента прямо на страницах.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Команды', path: '/teams', count: data.teams.length },
            { label: 'Новости', path: '/news', count: data.news.length },
            { label: 'Матчи', path: '/schedule', count: data.matches.length },
            { label: 'Турнир', path: '/tournament', count: data.groups.length + ' групп' },
            { label: 'Регистрация', path: '/registration', count: '' },
            { label: 'Регламент', path: '/rules', count: '' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} className="glass-card rounded-xl p-6 text-left card-glow">
              <h3 className="font-heading font-bold text-foreground mb-1">{item.label}</h3>
              {item.count !== '' && <p className="text-sm text-muted-foreground">{item.count} записей</p>}
            </button>
          ))}
        </div>

        {/* ── GitHub Config ─────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Github size={22} className="text-primary" /> Подключение GitHub
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Укажи свой репозиторий и Personal Access Token — тогда все изменения будут автоматически
            сохраняться в <code className="bg-muted px-1 rounded text-xs">public/data.json</code> и
            становиться видны всем посетителям через ~1–2 минуты (после деплоя GitHub Actions).
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">GitHub username (owner)</label>
              <input
                className="w-full bg-background border rounded-lg p-3 text-foreground font-mono text-sm"
                placeholder="например: myusername"
                value={ghConfig.owner}
                onChange={e => setGhConfig(p => ({ ...p, owner: e.target.value.trim() }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Название репозитория</label>
              <input
                className="w-full bg-background border rounded-lg p-3 text-foreground font-mono text-sm"
                placeholder="например: tournament-site"
                value={ghConfig.repo}
                onChange={e => setGhConfig(p => ({ ...p, repo: e.target.value.trim() }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ветка</label>
              <input
                className="w-full bg-background border rounded-lg p-3 text-foreground font-mono text-sm"
                placeholder="main"
                value={ghConfig.branch}
                onChange={e => setGhConfig(p => ({ ...p, branch: e.target.value.trim() }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Personal Access Token{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=NPC+Tournament+Admin"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline text-xs ml-1"
                >
                  создать токен →
                </a>
              </label>
              <input
                type="password"
                className="w-full bg-background border rounded-lg p-3 text-foreground font-mono text-sm"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={ghConfig.token}
                onChange={e => setGhConfig(p => ({ ...p, token: e.target.value.trim() }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Нужен scope: <code className="bg-muted px-1 rounded">repo</code> (или <code className="bg-muted px-1 rounded">contents: write</code> для fine-grained)</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSaveGitHub} className="btn-primary-gradient px-5 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} /> Сохранить конфигурацию
            </button>
            {ghSaved && (
              <button onClick={handleClearGitHub} className="px-5 py-2 border rounded-lg text-muted-foreground hover:text-destructive transition-colors text-sm">
                Сбросить
              </button>
            )}
          </div>
          {ghSaved && (
            <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
              <CheckCircle size={12} /> Конфигурация сохранена в этом браузере. Данные будут автоматически публиковаться в GitHub.
            </p>
          )}
          {!ghSaved && (
            <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
              <AlertCircle size={12} /> Без GitHub конфигурации изменения хранятся только в этом браузере (localStorage).
            </p>
          )}
        </div>

        {/* ── Site Settings ─────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Settings size={22} className="text-primary" /> Настройки сайта
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Название турнира</label>
              <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.tournamentName} onChange={e => setSettings(p => ({ ...p, tournamentName: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Даты</label>
              <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.tournamentDates} onChange={e => setSettings(p => ({ ...p, tournamentDates: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Discord ссылка</label>
              <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.discordLink} onChange={e => setSettings(p => ({ ...p, discordLink: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Google Form ссылка</label>
              <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.googleFormLink} onChange={e => setSettings(p => ({ ...p, googleFormLink: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Контакт админа 1</label>
              <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.contactAdmin1} onChange={e => setSettings(p => ({ ...p, contactAdmin1: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Контакт админа 2</label>
              <input className="w-full bg-background border rounded-lg p-3 text-foreground" value={settings.contactAdmin2} onChange={e => setSettings(p => ({ ...p, contactAdmin2: e.target.value }))} />
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
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-2">
                <Music size={16} /> Фоновая музыка
              </label>
              <div className="flex gap-3 items-center">
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
          <button onClick={handleSaveSettings} className="btn-primary-gradient px-6 py-2 rounded-lg mt-6">Сохранить настройки</button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Admin;
