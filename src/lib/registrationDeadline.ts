const WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;

export const parseRegistrationDeadline = (deadlineAt: string): Date | null => {
  if (!deadlineAt?.trim()) return null;
  const parsed = new Date(deadlineAt);
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
