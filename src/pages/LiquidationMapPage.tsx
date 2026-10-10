import React, { useState } from 'react';
import { Flame, Layers, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const LiquidationMapPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'ETH'>('BTC');

  const btcClusters = [
    { price: '$72,500', volume: '$1.42 Billion', type: 'SHORT LIQUIDATION MAGNET', intensity: 95, color: '#ef4444' },
    { price: '$70,800', volume: '$840 Million', type: 'SHORT LIQUIDATION CLUSTER', intensity: 75, color: '#f97316' },
    { price: '$68,450', volume: 'CURRENT PRICE', type: 'SPOT PRICE', intensity: 100, color: '#eab308' },
    { price: '$66,200', volume: '$620 Million', type: 'LONG LIQUIDATION CLUSTER', intensity: 65, color: '#3b82f6' },
    { price: '$64,100', volume: '$1.85 Billion', type: 'LONG LIQUIDATION MAGNET', intensity: 98, color: '#22c55e' },
  ];

  const ethClusters = [
    { price: '$2,850', volume: '$420 Million', type: 'SHORT LIQUIDATION MAGNET', intensity: 90, color: '#ef4444' },
    { price: '$2,740', volume: '$210 Million', type: 'SHORT LIQUIDATION CLUSTER', intensity: 70, color: '#f97316' },
    { price: '$2,640', volume: 'CURRENT PRICE', type: 'SPOT PRICE', intensity: 100, color: '#eab308' },
    { price: '$2,520', volume: '$180 Million', type: 'LONG LIQUIDATION CLUSTER', intensity: 60, color: '#3b82f6' },
    { price: '$2,380', volume: '$540 Million', type: 'LONG LIQUIDATION MAGNET', intensity: 95, color: '#22c55e' },
  ];

  const clusters = selectedAsset === 'BTC' ? btcClusters : ethClusters;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#291313] to-[var(--bg-card)] border-red-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500 animate-pulse" />
              <h1 className="text-xl font-bold text-[var(--text-main)]">Liquidation Heatmap & Leverage Magnet Engine</h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Visual map of high-leverage long & short liquidation pools across Binance, Bybit, and OKX derivatives markets.
            </p>
          </div>

          <div className="flex items-center bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setSelectedAsset('BTC')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
                selectedAsset === 'BTC' ? 'bg-amber-500 text-black' : 'text-[var(--text-muted)]'
              }`}
            >
              BTC / USD Map
            </button>
            <button
              onClick={() => setSelectedAsset('ETH')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
                selectedAsset === 'ETH' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              ETH / USD Map
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 border-red-500/30">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-red-400" /> Upper Short Liquidation Pool
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono mt-1">
            {selectedAsset === 'BTC' ? '$2.26 Billion' : '$630 Million'}
          </div>
          <p className="text-[11px] text-[var(--text-subtle)] mt-1">Short squeeze target above current price.</p>
        </div>

        <div className="glass-panel p-4 border-amber-500/30">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" /> Total 24h Liquidated
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">$148.5 Million</div>
          <p className="text-[11px] text-[var(--text-subtle)] mt-1">72% Longs / 28% Shorts wiped past 24h.</p>
        </div>

        <div className="glass-panel p-4 border-green-500/30">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-green-400" /> Lower Long Liquidation Pool
          </div>
          <div className="text-2xl font-extrabold text-green-400 font-mono mt-1">
            {selectedAsset === 'BTC' ? '$2.47 Billion' : '$720 Million'}
          </div>
          <p className="text-[11px] text-[var(--text-subtle)] mt-1">Long liquidation cascade risk level.</p>
        </div>
      </div>

      {/* Liquidation Heatmap Bars */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {selectedAsset} Leverage Cluster Liquidation Depth Map
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {clusters.map((c, i) => (
            <div key={`cluster-${i}`} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[var(--text-main)]">{c.price}</span>
                <span className="text-[var(--text-muted)]">{c.type}</span>
                <span className="font-bold" style={{ color: c.color }}>{c.volume}</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-[var(--bg-main)] h-4 rounded-full overflow-hidden border border-[var(--border-color)] relative">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${c.intensity}%`,
                    backgroundColor: c.color,
                    opacity: 0.8
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
