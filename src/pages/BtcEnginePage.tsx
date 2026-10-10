import React from 'react';
import { Coins, Zap, Shield, Flame, Activity } from 'lucide-react';

export const BtcEnginePage: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#1f190e] to-[var(--bg-card)] border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold text-[var(--text-main)]">Bitcoin Cycle & On-Chain Engine</h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Macro Bitcoin cycle evaluation combining MVRV-Z, Stock-to-Flow, Rainbow Band valuation, and Network Hashrate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg font-mono">
              BTC Price: $68,450.20 (+2.85%)
            </span>
          </div>
        </div>
      </div>

      {/* Cycle Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold uppercase">
            <span>MVRV Z-Score</span>
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono">2.14</div>
          <div className="text-[11px] text-green-400 font-medium">Accumulation Zone (Fair Value)</div>
          <p className="text-[10px] text-[var(--text-subtle)]">Market cap is valued moderately relative to realized cap.</p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold uppercase">
            <span>Rainbow Chart Band</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">"BUY!"</div>
          <div className="text-[11px] text-[var(--text-muted)]">Band 3 of 9 (Still Cheap)</div>
          <p className="text-[10px] text-[var(--text-subtle)]">Historically precedes major parabolic expansion phases.</p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold uppercase">
            <span>Pi Cycle Top Indicator</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono">NO CROSS</div>
          <div className="text-[11px] text-blue-400 font-medium">111 DMA &lt; 350 DMA x2</div>
          <p className="text-[10px] text-[var(--text-subtle)]">No macro blow-off top signal detected yet.</p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold uppercase">
            <span>Hash Rate (ATH)</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">685 EH/s</div>
          <div className="text-[11px] text-purple-300 font-medium">+14.2% YoY Growth</div>
          <p className="text-[10px] text-[var(--text-subtle)]">Miner security and network fundamental strength at record highs.</p>
        </div>
      </div>

      {/* Visual Rainbow Band Representation */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Bitcoin Rainbow Valuation Spectrum
        </h3>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded bg-red-900/30 border border-red-500/30 text-red-300">
            <span>Maximum Bubble Territory ($180k+)</span>
            <span className="text-[10px] font-bold">EXTREME RISK</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-orange-900/30 border border-orange-500/30 text-orange-300">
            <span>Sell! Seriously, SELL! ($140k - $180k)</span>
            <span className="text-[10px] font-bold">HIGH RISK</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-amber-900/30 border border-amber-500/30 text-amber-300">
            <span>FOMO Intensifies ($110k - $140k)</span>
            <span className="text-[10px] font-bold">TAKE PROFIT</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-yellow-900/30 border border-yellow-500/30 text-yellow-300">
            <span>Is this a Bubble? ($85k - $110k)</span>
            <span className="text-[10px] font-bold">NEUTRAL</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 font-bold">
            <span>★ CURRENT PRICE LEVEL ($68.4k - BUY ZONE) ★</span>
            <span className="text-[10px] font-extrabold bg-emerald-500 text-black px-2 py-0.5 rounded">ACTIVE HERE</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-teal-900/30 border border-teal-500/30 text-teal-300">
            <span>Basically a Fire Sale ($52k - $68k)</span>
            <span className="text-[10px] font-bold">STRONG BUY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
