import React from 'react';

interface BiasGaugeProps {
  score?: number;
}

export const BiasGauge: React.FC<BiasGaugeProps> = ({ score = 39 }) => {
  const n = Math.max(0, Math.min(100, score));
  const r = -90 + (n / 100) * 180;
  const i = n >= 60 ? 'Bullish' : n <= 40 ? 'Bearish' : 'Neutral';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-full max-w-[260px]">
        <defs>
          <linearGradient id="gaugeArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--bear)" />
            <stop offset="50%" stopColor="var(--neutral)" />
            <stop offset="100%" stopColor="var(--bull)" />
          </linearGradient>
        </defs>
        <path
          d="M14 100 A86 86 0 0 1 186 100"
          fill="none"
          stroke="url(#gaugeArc)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <g transform={`rotate(${r} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="var(--foreground)" strokeWidth="3" />
        </g>
        <circle cx="100" cy="100" r="6" fill="var(--foreground)" />
      </svg>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold tracking-tight font-sans">{i}</span>
        <span className="num text-lg text-muted-foreground">{n.toFixed(0)}%</span>
      </div>
      <p className="label-xs mt-1">Weighted across 31 macro factors · 7-tier scale</p>
    </div>
  );
};
