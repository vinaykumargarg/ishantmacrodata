import React from 'react';
import { MarketTicker } from '../types';

interface TickerBarProps {
  tickers: MarketTicker[];
  isDarkMode?: boolean;
}

export const TickerBar: React.FC<TickerBarProps> = ({ tickers, isDarkMode = true }) => {
  // Double the list for infinite seamless marquee
  const tickerItems = tickers.length ? [...tickers, ...tickers] : [];

  return (
    <div
      id="tickerWrap"
      className={`ticker-wrap overflow-hidden border-b select-none font-['JetBrains_Mono'] text-[10.5px] sm:text-[11px] h-[28px] flex items-center transition-colors relative z-40 ${
        isDarkMode
          ? 'bg-[#070c18] border-[#182335] text-[#e2e8f0]'
          : 'bg-[#ffffff] border-[#e6dede] text-[#1f2937]'
      }`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)'
      }}
    >
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused] items-center h-full">
        {tickerItems.map((item, index) => {
          // Robust positive/negative calculation
          const isPositive =
            item.isPositive !== undefined
              ? item.isPositive
              : item.change
              ? !item.change.includes('-')
              : true;

          // Strip existing symbols to get clean number
          const rawNum = item.change ? item.change.replace(/[+▲▼%\s-]/g, '').trim() : '0.00';
          const cleanChange = rawNum ? `${rawNum}%` : '0.00%';

          return (
            <div
              key={`${item.symbol}-${index}`}
              className={`ticker-item flex items-center gap-2 border-r px-4 sm:px-5 h-full font-['JetBrains_Mono'] shrink-0 ${
                isDarkMode ? 'border-[#182335]' : 'border-[#e6dede]'
              }`}
            >
              <span className={`font-medium tracking-tight text-[10.5px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                {item.symbol}
              </span>
              <span className={`font-bold tabular-nums text-[11px] ${isDarkMode ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>
                {item.price}
              </span>
              <span
                className={`font-bold flex items-center gap-0.5 tabular-nums text-[10.5px] ${
                  isPositive ? 'positive ticker-positive' : 'negative ticker-negative'
                }`}
                style={{
                  color: isPositive ? '#10b981' : '#ef4444',
                  fontWeight: 700
                }}
              >
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{isPositive ? `+${cleanChange}` : `-${cleanChange}`}</span>
              </span>
            </div>
          );
        })}
        {!tickerItems.length && (
          <div className="ticker-item font-['JetBrains_Mono'] text-[10.5px] px-4 opacity-70">
            Live markets · automatic refresh active
          </div>
        )}
      </div>
    </div>
  );
};

export default TickerBar;
