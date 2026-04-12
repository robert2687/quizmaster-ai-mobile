import { useState, useCallback, useRef, useEffect } from 'react';

export function useTimer(
  initialSeconds: number,
  onTimeUp: () => void
) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    stopTimer();
    onTimeUp();
  }, [stopTimer, onTimeUp]);

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(initialSeconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleTimeUp, stopTimer, initialSeconds]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return {
    secondsLeft,
    startTimer,
    stopTimer,
    percentage: (secondsLeft / initialSeconds) * 100,
  };
}
