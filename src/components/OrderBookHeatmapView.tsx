import React, { useState, useEffect } from 'react';
import QuantOrderBookTerminalView from './QuantOrderBookTerminalView';
import BookmapLiquidationTerminalView from './BookmapLiquidationTerminalView';
import { Flame, Layers, Sparkles } from 'lucide-react';

interface OrderBookHeatmapViewProps {
  onNavigate?: (tabId: string) => void;
  initialEngine?: 'QUANT_PRO' | 'ATAS_BOOKMAP';
}

export const OrderBookHeatmapView: React.FC<OrderBookHeatmapViewProps> = ({ onNavigate, initialEngine }) => {
  // Determine default engine based on URL hash or initialEngine prop
  const [activeEngine, setActiveEngine] = useState<'QUANT_PRO' | 'ATAS_BOOKMAP'>(() => {
    if (initialEngine) return initialEngine;
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('quant') || hash.includes('orderbook-pro')) {
      return 'QUANT_PRO';
    }
    // Default to ATAS_BOOKMAP 1:1 to match user reference photo
    return 'ATAS_BOOKMAP';
  });

  // Listen to hash changes in case user navigates via URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('quant') || hash.includes('orderbook-pro')) {
        setActiveEngine('QUANT_PRO');
      } else if (hash.includes('atas') || hash.includes('bookmap') || hash.includes('order-book-heatmap')) {
        setActiveEngine('ATAS_BOOKMAP');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050a18]">
      {/* Top Floating Engine Switcher */}
      <div className="absolute top-2 right-12 z-30 flex items-center bg-[#070d20]/95 border border-cyan-500/30 rounded-lg p-1 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
        <button
          onClick={() => setActiveEngine('ATAS_BOOKMAP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md font-bold transition-all cursor-pointer ${
            activeEngine === 'ATAS_BOOKMAP'
              ? 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title="ATAS & Bookmap 1:1 Liquidity Heatmap (Visual Parity with Reference Photo)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ATAS Bookmap 1:1</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 ml-0.5">REFERENCE</span>
        </button>

        <button
          onClick={() => setActiveEngine('QUANT_PRO')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md font-bold transition-all cursor-pointer ${
            activeEngine === 'QUANT_PRO'
              ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title="Quant Pro OrderBook (Binance, OKX, Bybit, Coinbase WebSocket + D3 CVD + DOM Ladder)"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Quant Pro OrderBook</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30 ml-0.5">MULTI-WS</span>
        </button>
      </div>

      {/* Render Selected Engine */}
      <div className="flex-1 w-full h-full">
        {activeEngine === 'ATAS_BOOKMAP' ? (
          <BookmapLiquidationTerminalView />
        ) : (
          <QuantOrderBookTerminalView onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
};

export default OrderBookHeatmapView;
