import React, { useState } from 'react';
import OrderBookHeatmapView from './OrderBookHeatmapView';
import { BookmapLiquidationTerminalView } from './BookmapLiquidationTerminalView';
import DeeeprLiquidationHubView from './DeeeprLiquidationHubView';

/**
 * ORDER-BOOK & LIQUIDATION HEATMAP TERMINAL
 * Includes:
 * 1. DEEEPR Liquidation Hub v1 (Coinglass 1:1 Heatmap + Max Pain + Cascades)
 * 2. Authentic Order-Book Depth (Bookmap / ATAS 1:1)
 * 3. CoinGlass Estimated Liquidation Archive
 */
export const LiquidationHeatmapTerminalView: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'DEEEPR_LIQUIDATION_HUB' | 'AUTHENTIC_ORDER_BOOK' | 'ESTIMATED_LIQUIDATION_LEVELS'>('DEEEPR_LIQUIDATION_HUB');

  return (
    <div className="space-y-3">
      {/* View Switcher Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Terminal Mode:</span>
          <button
            onClick={() => setViewMode('DEEEPR_LIQUIDATION_HUB')}
            className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'DEEEPR_LIQUIDATION_HUB'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400'
                : 'text-slate-400 hover:text-white bg-slate-800/50 border border-transparent'
            }`}
          >
            🔥 DEEEPR Liquidation Hub v1 ⭐ (Coinglass Heatmap + Max Pain)
          </button>
          <button
            onClick={() => setViewMode('AUTHENTIC_ORDER_BOOK')}
            className={`px-2.5 py-1.5 rounded font-bold transition-all cursor-pointer ${
              viewMode === 'AUTHENTIC_ORDER_BOOK'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-800/50 border border-transparent'
            }`}
          >
            🗺️ Authentic Order-Book Depth (Bookmap / ATAS 1:1)
          </button>
          <button
            onClick={() => setViewMode('ESTIMATED_LIQUIDATION_LEVELS')}
            className={`px-2.5 py-1.5 rounded font-bold transition-all cursor-pointer ${
              viewMode === 'ESTIMATED_LIQUIDATION_LEVELS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-800/50 border border-transparent'
            }`}
          >
            📊 CoinGlass Estimated Levels (Archive)
          </button>
        </div>
        <span className="text-[11px] text-slate-500 hidden md:inline">
          {viewMode === 'DEEEPR_LIQUIDATION_HUB'
            ? 'BTC, ETH, SOL, Gold & Silver Coinglass-style Viridis heatmap + Max Pain'
            : viewMode === 'AUTHENTIC_ORDER_BOOK'
              ? 'Real resting limit orders on Binance public depth & aggTrade'
              : 'Estimated leverage liquidation levels'}
        </span>
      </div>

      {/* Render Active View */}
      {viewMode === 'DEEEPR_LIQUIDATION_HUB' ? (
        <DeeeprLiquidationHubView onNavigate={onNavigate} />
      ) : viewMode === 'AUTHENTIC_ORDER_BOOK' ? (
        <OrderBookHeatmapView onNavigate={onNavigate} />
      ) : (
        <BookmapLiquidationTerminalView />
      )}
    </div>
  );
};

export default LiquidationHeatmapTerminalView;
