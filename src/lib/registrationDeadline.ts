const WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
const MSK_OFFSET_HOURS = 3;
const RU_DEADLINE_FORMAT = /^(\d{2})-(\d{2})-(\d{4})-(\d{2}):(\d{2})$/;

export const parseRegistrationDeadline = (deadlineAt: string): Date | null => {
  if (!deadlineAt?.trim()) return null;

  const value = deadlineAt.trim();
  const m = value.match(RU_DEADLINE_FORMAT);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const hours = Number(m[4]);
    const minutes = Number(m[5]);

    if (
      month < 1 || month > 12 ||
      day < 1 || day > 31 ||
      hours < 0 || hours > 23 ||
      minutes < 0 || minutes > 59
    ) {
      return null;
    }

    // Deadline string is interpreted as Moscow time (UTC+3).
    const utcMillis = Date.UTC(year, month - 1, day, hours - MSK_OFFSET_HOURS, minutes, 0, 0);
    const parsedMsk = new Date(utcMillis);
    return Number.isNaN(parsedMsk.getTime()) ? null : parsedMsk;
  }

  // Backward compatibility with previous ISO values in storage.
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getRegistrationState = (deadlineAt: string, now = new Date()) => {
  const deadline = parseRegistrationDeadline(deadlineAt);
  if (!deadline) {
    return {
      hasDeadline: false,
      isClosed: false,
      isClosingSoon: false,
      remainingMs: null as number | null,
      deadline: null as Date | null,
    };
  }

  const remainingMs = deadline.getTime() - now.getTime();
  const isClosed = remainingMs <= 0;
  const isClosingSoon = !isClosed && remainingMs <= WARNING_WINDOW_MS;

  return {
    hasDeadline: true,
    isClosed,
    isClosingSoon,
    remainingMs,
    deadline,
  };
};

export const formatRemainingTime = (remainingMs: number | null): string => {
  if (remainingMs == null || remainingMs <= 0) return '0 мин';

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} дн ${hours} ч ${minutes} мин`;
  if (hours > 0) return `${hours} ч ${minutes} мин ${seconds} сек`;
  return `${minutes} мин ${seconds} сек`;
};
