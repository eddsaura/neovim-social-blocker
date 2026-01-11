import { useState, useEffect } from 'react';

interface TimerProps {
  timeLimitMs: number;
  startTime: number;
  onTimeUp: () => void;
  isPaused: boolean;
}

export function Timer({ timeLimitMs, startTime, onTimeUp, isPaused }: TimerProps) {
  const [remaining, setRemaining] = useState(timeLimitMs);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, timeLimitMs - elapsed);
      setRemaining(newRemaining);

      if (newRemaining === 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeLimitMs, startTime, onTimeUp, isPaused]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const percentRemaining = (remaining / timeLimitMs) * 100;
  const timerClass =
    percentRemaining <= 10 ? 'danger' : percentRemaining <= 25 ? 'warning' : '';

  return (
    <div className={`timer ${timerClass}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
