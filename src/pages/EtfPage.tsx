import React from 'react';
import { mockEtfFlows } from '../data/mockData';
import { Landmark, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export const EtfPage: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#152338] to-[var(--bg-card)] border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-bold text-[var(--text-main)]">Institutional & Spot ETF Flow Engine</h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Daily net capital inflows and outflows into US Spot Bitcoin & Ethereum ETFs (BlackRock, Fidelity, Grayscale).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 px-3 py-1.5 rounded-lg font-mono">
              Net 24h Inflow: +$420.5 Million
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase">Total Spot BTC ETF AUM</div>
          <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono mt-1">$61.4 Billion</div>
          <div className="text-[11px] text-green-400 font-medium mt-0.5">+4.8% past 7 days</div>
        </div>

        <div className="glass-panel p-4">
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase">BlackRock (IBIT) Dominance</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">$24.8 Billion</div>
          <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">40.4% market share</div>
        </div>

        <div className="glass-panel p-4">
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase">Cumulative Net Inflows</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">+$19.82 Billion</div>
          <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">Since January launch</div>
        </div>
      </div>

      {/* ETF Inflows Table */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" /> Spot ETF Daily Net Flows Leaderboard
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-subtle)] uppercase text-[10px]">
                <th className="pb-2">Date</th>
                <th className="pb-2">Ticker</th>
                <th className="pb-2">Fund Name</th>
                <th className="pb-2">Provider</th>
                <th className="pb-2">Net USD Flow</th>
                <th className="pb-2">Total AUM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {mockEtfFlows.map((flow, idx) => (
                <tr key={`etf-${idx}`} className="hover:bg-[var(--bg-card-hover)]">
                  <td className="py-2.5 text-[var(--text-muted)]">{flow.date}</td>
                  <td className="py-2.5 font-bold text-[var(--text-main)]">{flow.ticker}</td>
                  <td className="py-2.5 text-[var(--text-muted)]">{flow.fundName}</td>
                  <td className="py-2.5 text-[var(--text-subtle)]">{flow.provider}</td>
                  <td className={`py-2.5 font-bold flex items-center gap-1 ${flow.isPositive ? 'text-[var(--accent-bull)]' : 'text-[var(--accent-bear)]'}`}>
                    {flow.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {flow.flowUsd}
                  </td>
                  <td className="py-2.5 text-[var(--text-main)] font-semibold">{flow.totalAum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
