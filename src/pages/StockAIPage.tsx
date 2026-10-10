import React, { useState } from 'react';
import { mockStockSetups } from '../data/mockData';
import { Search, Sparkles, Filter, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StockAIPage: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'NIFTY100'>('US');
  const [biasFilter, setBiasFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = mockStockSetups.filter((s) => {
    if (s.market !== selectedMarket) return false;
    if (biasFilter !== 'ALL' && s.bias !== biasFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.symbol.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#1a2336] to-[var(--bg-card)] border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--text-main)]">AI Stock Intelligence Engine</h1>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> US + NIFTY 100
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              AI-generated technical setups, target price projections, stop losses, and high-conviction rationales.
            </p>
          </div>

          {/* Market Selector Tabs */}
          <div className="flex items-center bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setSelectedMarket('US')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMarket === 'US'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              🇺🇸 US Equities (S&P 500 / Nasdaq)
            </button>
            <button
              onClick={() => setSelectedMarket('NIFTY100')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMarket === 'NIFTY100'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              🇮🇳 NIFTY 100 (India Bluechips)
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-subtle)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedMarket} stocks (e.g. ${selectedMarket === 'US' ? 'NVDA, AAPL' : 'RELIANCE, HDFCBANK'})...`}
            className="w-full bg-[var(--bg-main)] text-[var(--text-main)] pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Bias Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[var(--text-muted)] font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Bias Filter:
          </span>
          {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBiasFilter(b)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                biasFilter === b
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Stocks Setup Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStocks.map((stock) => {
          const isBull = stock.bias === 'BULLISH';
          const isBear = stock.bias === 'BEARISH';
          const badgeClass = isBull ? 'badge-bull' : isBear ? 'badge-bear' : 'badge-neutral';

          return (
            <div
              key={stock.symbol}
              className="glass-panel p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[var(--text-main)] font-mono">{stock.symbol}</span>
                    <span className="text-xs text-[var(--text-muted)]">({stock.market})</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                      {stock.bias} ({stock.score}/100)
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{stock.companyName}</div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-[var(--text-main)] font-mono">{stock.price}</div>
                  <div className={`text-xs font-semibold ${stock.change.startsWith('+') ? 'text-[var(--accent-bull)]' : 'text-[var(--accent-bear)]'}`}>
                    {stock.change}
                  </div>
                </div>
              </div>

              {/* Price Targets & Stops */}
              <div className="grid grid-cols-3 gap-2 bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)] text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[var(--text-subtle)] uppercase">Target Price</div>
                  <div className="font-bold text-[var(--accent-bull)] flex items-center gap-0.5 mt-0.5">
                    <ArrowUpRight className="w-3 h-3" /> {stock.targetPrice}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-subtle)] uppercase">Stop Loss</div>
                  <div className="font-bold text-[var(--accent-bear)] flex items-center gap-0.5 mt-0.5">
                    <ArrowDownRight className="w-3 h-3" /> {stock.stopLoss}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-subtle)] uppercase">Timeframe</div>
                  <div className="font-semibold text-amber-400 mt-0.5">{stock.timeframe}</div>
                </div>
              </div>

              {/* Technical Setup & AI Rationale */}
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="font-semibold text-indigo-300">Technical Setup: </span>
                  <span className="text-[var(--text-muted)]">{stock.technicalSetup}</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-300">AI Rationale: </span>
                  <span className="text-[var(--text-muted)]">{stock.aiRationale}</span>
                </div>
              </div>

              {/* Card Footer Fundamentals */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)] border-t border-[var(--border-color)] pt-2 font-mono">
                <span>P/E: <strong className="text-[var(--text-main)]">{stock.peRatio}</strong></span>
                <span>Market Cap: <strong className="text-[var(--text-main)]">{stock.marketCap}</strong></span>
                <span>24h Vol: <strong className="text-[var(--text-main)]">{stock.volume24h}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
