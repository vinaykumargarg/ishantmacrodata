import React from 'react';
import { MarketTicker } from '../types';

interface TickerBarProps {
  tickers: MarketTicker[];
  isDarkMode?: boolean;
}

export const TickerBar: React.FC<TickerBarProps> = ({ tickers }) => {
  // Double the list for infinite seamless marquee
  const tickerItems = tickers.length ? [...tickers, ...tickers] : [];

  return (
    <div className="overflow-hidden border-b border-border bg-card">
      <div className="flex w-max animate-ticker">
        {tickerItems.map((item, index) => {
          const isPositive = item.isPositive ?? (item.change ? item.change.startsWith('+') : true);
          const cleanChange = item.change ? item.change.replace(/[+▲▼]/g, '').trim() : '0.00%';
          return (
            <div
              key={`${item.symbol}-${index}`}
              className="flex items-center gap-2 border-r border-border px-4 py-2 text-xs"
            >
              <span className="num text-muted-foreground">{item.symbol}</span>
              <span className="num font-semibold text-foreground">{item.price}</span>
              <span className={`num font-semibold flex items-center gap-0.5 ${isPositive ? 'text-bull' : 'text-bear'}`}>
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{isPositive ? `+${cleanChange}` : `-${cleanChange.replace('-', '')}`}</span>
              </span>
            </div>
          );
        })}
        {!tickerItems.length && (
          <div className="label-xs px-4 py-2">
            Live markets · automatic refresh active
          </div>
        )}
      </div>
    </div>
  );
};

export default TickerBar;
