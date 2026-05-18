import React from 'react';
import { modeColors } from '../hooks/useTimer';

function Timer({ timeLeft, progress, mode, formatTime, MODES }) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="timer">
      <svg className="timer-ring" viewBox="0 0 280 280">
        <circle
          className="timer-ring-bg"
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          strokeWidth="8"
        />
        <circle
          className="timer-ring-progress"
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          strokeWidth="8"
          stroke={modeColors[mode]}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 140 140)"
        />
      </svg>

      <div className="timer-display">
        <div className="timer-time">{formatTime(timeLeft)}</div>
        <div className="timer-mode">{MODES[mode].label}</div>
      </div>
    </div>
  );
}

export default Timer;
