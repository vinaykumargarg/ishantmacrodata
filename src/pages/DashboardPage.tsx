import React from 'react';
import { BiasGauge } from '../components/BiasGauge';
import { mockMacroSignals, initialTickers } from '../data/mockData';
import { ShieldCheck, TrendingUp, Sparkles, Activity, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigateTab: (tabId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 bg-gradient-to-r from-[var(--bg-card)] via-[#161d2d] to-[var(--bg-card)] border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--text-main)]">Global Market Score</h1>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Terminal
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time multi-asset bias read across Crypto, US & NIFTY Equities, Gold, Forex, and Macro Liquidity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('stock-ai')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400 px-3 py-2 rounded-lg transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" /> AI Stocks (US + Nifty)
          </button>
          <button
            onClick={() => onNavigateTab('assistant')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Main Grid: Gauge Dial + Asset Matrix + Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Bias Gauge (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <BiasGauge score={78} label="Global Macro Bias Score" regimeText="Risk-On Expansion" />

          {/* Quick Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Crypto Temperature</span>
              <div className="text-lg font-bold text-[var(--accent-bull)] mt-1">74 / 100</div>
              <span className="text-[10px] text-green-400 font-medium mt-0.5">Greed & Expansion</span>
            </div>

            <div className="glass-panel p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Fed Liquidity Index</span>
              <div className="text-lg font-bold text-amber-400 mt-1">+$84.2B</div>
              <span className="text-[10px] text-[var(--text-subtle)] mt-0.5">TGA Runoff Active</span>
            </div>

            <div className="glass-panel p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Altcoin Season</span>
              <div className="text-lg font-bold text-purple-400 mt-1">48 / 100</div>
              <span className="text-[10px] text-[var(--text-subtle)] mt-0.5">BTC Dominance 56.4%</span>
            </div>

            <div className="glass-panel p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Geopolitical Risk</span>
              <div className="text-lg font-bold text-blue-400 mt-1">Moderate</div>
              <span className="text-[10px] text-[var(--text-subtle)] mt-0.5">Gold $2,652 Stable</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Conviction Signals & Asset Breakdown (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Asset Matrix Breakdown */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" /> Multi-Asset Confluence Read
              </h3>
              <button onClick={() => onNavigateTab('confluence')} className="text-xs text-amber-400 hover:underline">
                View Full Matrix →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                <div className="text-[11px] text-[var(--text-muted)] font-medium">Crypto Market</div>
                <div className="text-xs font-bold text-[var(--accent-bull)] mt-0.5 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> BULLISH (84)
                </div>
                <div className="text-[10px] text-[var(--text-subtle)] mt-1">ETF Net Inflows +$420M</div>
              </div>

              <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                <div className="text-[11px] text-[var(--text-muted)] font-medium">US Equities</div>
                <div className="text-xs font-bold text-[var(--accent-bull)] mt-0.5 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> BULLISH (76)
                </div>
                <div className="text-[10px] text-[var(--text-subtle)] mt-1">Tech & AI Strength</div>
              </div>

              <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                <div className="text-[11px] text-[var(--text-muted)] font-medium">Gold & Commodities</div>
                <div className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> NEUTRAL (58)
                </div>
                <div className="text-[10px] text-[var(--text-subtle)] mt-1">Central Bank Buys</div>
              </div>

              <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                <div className="text-[11px] text-[var(--text-muted)] font-medium">US Dollar (DXY)</div>
                <div className="text-xs font-bold text-[var(--accent-bear)] mt-0.5 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> BEARISH (38)
                </div>
                <div className="text-[10px] text-[var(--text-subtle)] mt-1">Rate Cuts Softening</div>
              </div>
            </div>
          </div>

          {/* Top High Conviction Signals Feed */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> High-Conviction Macro Signals
              </h3>
              <span className="text-[11px] text-[var(--text-subtle)] font-mono">Updated Real-Time</span>
            </div>

            <div className="space-y-2.5">
              {mockMacroSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] p-3 rounded-lg border border-[var(--border-color)] transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {signal.category}
                      </span>
                      <span className="text-[10px] text-[var(--text-subtle)] font-mono">{signal.time}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-[var(--text-main)]">{signal.title}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] leading-normal">{signal.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-400 font-mono block">{signal.value}</span>
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 inline-block mt-1">
                      {signal.bias}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Quick Overview Table */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Live Global Instruments Snapshot
          </h3>
          <button onClick={() => onNavigateTab('overview')} className="text-xs text-amber-400 hover:underline">
            View All Instruments →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-subtle)] uppercase text-[10px]">
                <th className="pb-2">Instrument</th>
                <th className="pb-2">Asset Class</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">24h Change</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {initialTickers.slice(0, 6).map((t, idx) => (
                <tr key={`dash-t-${idx}`} className="hover:bg-[var(--bg-card-hover)]">
                  <td className="py-2.5 font-bold text-[var(--text-main)]">{t.symbol}</td>
                  <td className="py-2.5 text-[var(--text-muted)]">{t.category}</td>
                  <td className="py-2.5 font-semibold text-[var(--text-main)]">{t.price}</td>
                  <td className={t.isPositive ? 'py-2.5 text-[var(--accent-bull)]' : 'py-2.5 text-[var(--accent-bear)]'}>
                    {t.change}
                  </td>
                  <td className="py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.isPositive ? 'badge-bull' : 'badge-bear'}`}>
                      {t.isPositive ? 'BULLISH' : 'BEARISH'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
