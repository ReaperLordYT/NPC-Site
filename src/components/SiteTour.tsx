import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type TourStep = {
  selectors: string[];
  title: string;
  description: string;
};

const SESSION_SKIP_KEY = 'npc-tour-skip';

const steps: TourStep[] = [
  {
    selectors: ['[data-tour="brand"]'],
    title: 'Лого и переход на главную',
    description: 'Нажмите на логотип, чтобы быстро вернуться на главную страницу.',
  },
  {
    selectors: ['[data-tour="desktop-nav"]', '[data-tour="mobile-menu-button"]'],
    title: 'Главная навигация',
    description: 'Тут находятся основные вкладки сайта: регистрация, команды, расписание и другие разделы.',
  },
  {
    selectors: ['[data-tour="hero-discord"]'],
    title: 'Discord и связь',
    description: 'Кнопка ведет в Discord-сервер турнира для связи с организаторами и новостей.',
  },
  {
    selectors: ['[data-tour="hero-register-team"]'],
    title: 'Регистрация команды',
    description: 'Через эту кнопку команда отправляет заявку на участие в турнире.',
  },
  {
    selectors: ['[data-tour="hero-rules"]'],
    title: 'Регламент турнира',
    description: 'Здесь все правила: формат, ограничения и условия участия.',
  },
  {
    selectors: ['[data-tour="registration-title"]'],
    title: 'Страница регистрации',
    description: 'Тут описано, как подать заявку, и есть прямая кнопка отправки формы.',
  },
  {
    selectors: ['[data-tour="rules-title"]'],
    title: 'Страница регламента',
    description: 'Полный свод правил, чтобы все участники играли в одинаковых условиях.',
  },
  {
    selectors: ['[data-tour="teams-title"]'],
    title: 'Страница команд',
    description: 'Список всех команд, их составов и статусов.',
  },
  {
    selectors: ['[data-tour="free-players-title"]'],
    title: 'Свободные игроки',
    description: 'Игроки без команды: здесь можно найти людей в состав.',
  },
  {
    selectors: ['[data-tour="tournament-title"]'],
    title: 'Турнирная сетка',
    description: 'Группы, плей-офф, матчи и текущий прогресс турнира.',
  },
  {
    selectors: ['[data-tour="schedule-title"]'],
    title: 'Расписание матчей',
    description: 'Дата, время, стадия и статус матчей в одном месте.',
  },
  {
    selectors: ['[data-tour="organizers-title"]'],
    title: 'Организаторы',
    description: 'Контакты и люди, которые ведут турнир.',
  },
];

const stepRoutes = ['/', '/', '/', '/', '/', '/registration', '/rules', '/teams', '/free-players', '/tournament', '/schedule', '/organizers'];

const resolveTarget = (step: TourStep): HTMLElement | null => {
  for (const selector of step.selectors) {
    const node = document.querySelector(selector);
    if (!(node instanceof HTMLElement)) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
};

const SiteTour: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    if (location.pathname !== '/') return;
    const skipped = sessionStorage.getItem(SESSION_SKIP_KEY) === '1';
    if (!skipped) {
      setOpen(true);
      setStepIndex(0);
    }
  }, [enabled, location.pathname]);

  React.useEffect(() => {
    if (!open) return;
    const expectedPath = stepRoutes[stepIndex];
    if (location.pathname !== expectedPath) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const target = resolveTarget(steps[stepIndex]);
      setTargetRect(target ? target.getBoundingClientRect() : null);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [open, stepIndex, location.pathname]);

  if (!open) return null;

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const closeTour = () => {
    sessionStorage.setItem(SESSION_SKIP_KEY, '1');
    setOpen(false);
  };

  const nextStep = () => {
    if (isLastStep) {
      closeTour();
      return;
    }
    const nextIndex = stepIndex + 1;
    const nextRoute = stepRoutes[nextIndex];
    setStepIndex(nextIndex);
    if (nextRoute && nextRoute !== location.pathname) {
      navigate(nextRoute);
    }
  };

  const top = targetRect ? Math.max(16, targetRect.top - 155) : 24;
  const left = targetRect ? Math.max(16, Math.min(window.innerWidth - 340, targetRect.left)) : 16;

  return (
    <div className="fixed inset-0 z-[180]">
      <div className="absolute inset-0 bg-black/70" />

      {targetRect && (
        <div
          className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      <div
        className="absolute w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border bg-card p-4 shadow-xl"
        style={{ top, left }}
      >
        <p className="text-xs text-primary font-heading font-semibold mb-1">
          Обучение {stepIndex + 1}/{steps.length}
        </p>
        <h3 className="font-heading text-lg font-bold text-foreground">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{currentStep.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={closeTour}
            className="px-3 py-2 rounded-md border text-sm text-muted-foreground hover:text-foreground"
          >
            Пропустить
          </button>
          <button type="button" onClick={nextStep} className="btn-primary-gradient px-4 py-2 rounded-md text-sm">
            {isLastStep ? 'Завершить' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteTour;
