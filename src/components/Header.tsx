import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Edit, LogOut, Volume2, VolumeX, Volume1, Music } from 'lucide-react';
import { useTournament } from '@/context/TournamentContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Главная' },
  { path: '/registration', label: 'Регистрация' },
  { path: '/rules', label: 'Регламент' },
  { path: '/teams', label: 'Команды' },
  { path: '/free-players', label: 'Свободные игроки' },
  { path: '/tournament', label: 'Турнир' },
  { path: '/schedule', label: 'Расписание' },
  { path: '/mvp', label: 'MVP' },
  { path: '/organizers', label: 'Организаторы' },
];

const STORAGE_KEY = 'npc-music-enabled';
const VOLUME_KEY = 'npc-music-volume';

const AdminShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A</text>
  </svg>
);

// Singleton audio element — живёт вне React, один на весь таб
let _globalAudio: HTMLAudioElement | null = null;
let _globalUrl: string | null = null;

function getAudio(url: string): HTMLAudioElement {
  if (!_globalAudio || _globalUrl !== url) {
    if (_globalAudio) {
      _globalAudio.pause();
    }
    _globalAudio = new Audio(url);
    _globalAudio.loop = true;
    _globalAudio.preload = 'auto';
    _globalUrl = url;
  }
  return _globalAudio;
}

const Header: React.FC = () => {
  const { isAdmin, isEditing, toggleEditing, logout, data } = useTournament();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const logoClickCountRef = useRef(0);
  const logoClickResetTimerRef = useRef<number | null>(null);

  const musicUrl = data.settings.musicUrl;

  // Читаем начальное состояние из localStorage
  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Если ничего нет — музыка включена по умолчанию
    return stored === null ? true : stored === 'true';
  });
  const [volume, setVolume] = useState<number>(() => {
    const stored = localStorage.getItem(VOLUME_KEY);
    return stored ? parseFloat(stored) : 0.3;
  });
  const [muted, setMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Актуализируем громкость аудио при изменении
  useEffect(() => {
    if (_globalAudio) {
      _globalAudio.volume = muted ? 0 : volume;
    }
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume, muted]);

  // Основная логика: запуск/остановка при изменении url или enabled
  // Refs for coordinating background music pause/resume with MVP page
  const pausedByMvpRef = useRef(false);
  const _autoplayRetryFn = useRef<(() => void) | null>(null);

  const tryPlay = useCallback(() => {
    if (!musicUrl || !enabled) return;
    const audio = getAudio(musicUrl);
    audio.volume = muted ? 0 : volume;
    if (!audio.paused) return; // уже играет
    audio.play().catch(() => {
      // Autoplay заблокирован — ждём первого клика пользователя
      const onInteract = () => {
        // Don't resume if MVP page has paused us
        if (enabled && _globalAudio?.paused && !pausedByMvpRef.current) {
          _globalAudio.play().catch(() => {});
        }
        document.removeEventListener('click', onInteract, true);
        document.removeEventListener('keydown', onInteract, true);
        _autoplayRetryFn.current = null;
      };
      _autoplayRetryFn.current = onInteract;
      document.addEventListener('click', onInteract, true);
      document.addEventListener('keydown', onInteract, true);
    });
  }, [musicUrl, enabled, volume, muted]);

  useEffect(() => {
    if (!musicUrl) return;

    if (enabled) {
      tryPlay();
    } else {
      _globalAudio?.pause();
    }
  }, [musicUrl, enabled, tryPlay]);

  // Переключение музыки кнопкой
  const togglePlay = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (!next) {
      _globalAudio?.pause();
    } else if (_globalAudio) {
      _globalAudio.play().catch(() => {});
    }
  };

  // Слушаем события от страницы MVP для паузы/возобновления
  // pausedByMvp flag предотвращает возобновление фоновой музыки из-за click-listener'а autoplay
  useEffect(() => {
    const pause = () => {
      pausedByMvpRef.current = true;
      if (_globalAudio) _globalAudio.pause();
      // Remove any pending autoplay click listeners so they don't fire when MVP page loads
      if (_autoplayRetryFn.current) {
        document.removeEventListener('click', _autoplayRetryFn.current, true);
        document.removeEventListener('keydown', _autoplayRetryFn.current, true);
        _autoplayRetryFn.current = null;
      }
    };
    const resume = () => {
      pausedByMvpRef.current = false;
      if (enabled && _globalAudio) _globalAudio.play().catch(() => {});
    };
    window.addEventListener('pause-main-music', pause);
    window.addEventListener('resume-main-music', resume);
    return () => {
      window.removeEventListener('pause-main-music', pause);
      window.removeEventListener('resume-main-music', resume);
    };
  }, [enabled]);

  const isPlaying = enabled && !!musicUrl;
  const VolumeIcon = muted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (logoClickResetTimerRef.current) window.clearTimeout(logoClickResetTimerRef.current);
    };
  }, []);

  const handleLogoClick = () => {
    logoClickCountRef.current += 1;
    if (logoClickResetTimerRef.current) window.clearTimeout(logoClickResetTimerRef.current);
    logoClickResetTimerRef.current = window.setTimeout(() => {
      logoClickCountRef.current = 0;
    }, 4000);

    if (logoClickCountRef.current >= 7) {
      logoClickCountRef.current = 0;
      window.dispatchEvent(new Event('npc-cat-peek-show'));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b bg-background/80">
      <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between h-16 gap-2">
        <Link to="/" onClick={handleLogoClick} className="font-display text-lg sm:text-xl font-bold gradient-text tracking-wider truncate max-w-[120px] sm:max-w-none">
          Blank
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-heading font-semibold tracking-wide transition-colors ${
                location.pathname === item.path
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {/* Music nav item */}
          {musicUrl && (
            <div className="relative">
              <button
                onClick={togglePlay}
                onContextMenu={e => { e.preventDefault(); setShowVolume(!showVolume); }}
                className={`px-3 py-2 rounded-md text-sm font-heading font-semibold tracking-wide transition-colors flex items-center gap-1 ${
                  isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title="ЛКМ: вкл/выкл музыку | ПКМ: громкость"
              >
                <Music size={16} />
                Музыка
              </button>
              {/* Volume popup */}
              <AnimatePresence>
                {showVolume && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-2 glass-card rounded-xl p-3 flex items-center gap-2 z-50 min-w-[180px]"
                  >
                    <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground">
                      <VolumeIcon size={16} />
                    </button>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={muted ? 0 : volume}
                      onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                      className="w-24 h-1 accent-primary"
                    />
                    <button onClick={() => setShowVolume(false)} className="text-muted-foreground hover:text-foreground ml-1">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Music toggle for mobile */}
          {musicUrl && (
            <button
              onClick={togglePlay}
              className={`p-2 rounded-md transition-colors lg:hidden ${isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
              title={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
            >
              <Music size={18} />
            </button>
          )}

          {isAdmin && (
            <>
              <Link to="/admin" className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Админ-панель">
                <AdminShieldIcon />
              </Link>
              <button onClick={toggleEditing} className={`p-1.5 sm:p-2 rounded-md transition-colors ${isEditing ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} title={isEditing ? 'Выключить редактирование' : 'Включить редактирование'}>
                <Edit size={18} />
              </button>
              <button onClick={logout} className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground" title="Выйти">
                <LogOut size={18} />
              </button>
            </>
          )}
          {!isAdmin && (
            <Link to="/admin" className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Админ-панель">
              <AdminShieldIcon />
            </Link>
          )}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 sm:p-2 text-foreground">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-[100] lg:hidden bg-background/95 backdrop-blur-xl border-b border-border/60"
            style={{ height: 'calc(100dvh - 4rem)' }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/60">
                <span className="font-heading font-semibold text-foreground">Меню</span>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground">
                  <X size={22} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block w-full rounded-lg px-4 py-3 text-base font-heading font-semibold transition-colors ${
                      location.pathname === item.path
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground bg-card/40 hover:text-primary hover:bg-muted/70'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {musicUrl && (
                  <div className="mt-3 rounded-lg border border-border/60 p-3 space-y-3 bg-card/40">
                    <button onClick={togglePlay} className={`w-full px-4 py-2 rounded-lg font-heading font-semibold flex items-center justify-center gap-2 ${isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted/30'}`}>
                      <Music size={18} /> {isPlaying ? 'Выключить музыку' : 'Включить музыку'}
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground">
                        <VolumeIcon size={18} />
                      </button>
                      <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }} className="flex-1 accent-primary" />
                    </div>
                  </div>
                )}
                {!isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="mt-3 block w-full rounded-lg px-4 py-3 text-base font-heading font-semibold text-primary bg-primary/5">
                    <span className="inline-flex items-center gap-2"><AdminShieldIcon /> Админ</span>
                  </Link>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
