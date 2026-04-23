import { useEffect, useMemo, useState } from 'react';
import { getRegistrationState } from '@/lib/registrationDeadline';

export const useRegistrationDeadline = (deadlineAt: string) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const registrationState = useMemo(
    () => getRegistrationState(deadlineAt, new Date(nowMs)),
    [deadlineAt, nowMs]
  );

  useEffect(() => {
    if (!registrationState.hasDeadline || registrationState.isClosed || registrationState.remainingMs == null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.reload();
    }, registrationState.remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [registrationState.hasDeadline, registrationState.isClosed, registrationState.remainingMs]);

  return registrationState;
};
