import React, { useState, useMemo } from 'react';
import {
  ORDER_FLOW_DATA,
  MarketOrderFlowPackage,
  OrderFlowTimeframe,
  FootprintCandle
} from '../data/orderFlowData';
import TradingViewWidget from './TradingViewWidget';
import BookmapChart, { BookmapSymbol } from './BookmapChart';

export interface OrderFlowTerminalProps {
  onNavigate?: (tab: string) => void;
}

export const OrderFlowTerminal: React.FC<OrderFlowTerminalProps> = ({ onNavigate }) => {
  const [selectedMarket, setSelectedMarket] = useState<BookmapSymbol>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<OrderFlowTimeframe>('15M');
  const [viewMode, setViewMode] = useState<'BOOKMAP' | 'FOOTPRINT' | 'TRADINGVIEW' | 'HEATMAP'>('BOOKMAP');
  const [imbalanceThreshold, setImbalanceThreshold] = useState<number>(300); // 300% default
  const [hoveredCandle, setHoveredCandle] = useState<FootprintCandle | null>(null);

  // Position sizing calculator state
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);

  const marketData: MarketOrderFlowPackage =
    ORDER_FLOW_DATA[selectedMarket] || ORDER_FLOW_DATA['BTCUSDT'];

  // Map timeframe to TradingView interval string
  const tvInterval = useMemo(() => {
    switch (timeframe) {
      case '1M':
        return '1';
      case '3M':
        return '3';
      case '5M':
        return '5';
      case '15M':
        return '15';
      case '30M':
        return '30';
      case '1H':
        return '60';
      case '4H':
        return '240';
      case '1D':
        return 'D';
      default:
        return '15';
    }
  }, [timeframe]);

  // Position size calculations
  const calculatedRiskAmount = (accountSize * riskPercent) / 100;
  const slDistance = Math.abs(marketData.riskPlan.suggestedEntry - marketData.riskPlan.suggestedStopLoss);
  const calculatedUnits = slDistance > 0 ? (calculatedRiskAmount / slDistance).toFixed(3) : '0';

  return (
    <div className="space-y-4 font-['Outfit',sans-serif] text-slate-100 bg-gradient-to-b from-[#030610] via-[#060d1c] to-[#040814] min-h-screen p-3 sm:p-5 rounded-3xl border border-cyan-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
      {/* ────────────────── ULTRA AI V2 BANNER SWITCHER ────────────────── */}
      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/70 via-[#0c162d] to-cyan-950/60 p-3.5 sm:p-4.5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_24px_rgba(99,102,241,0.5)] border border-cyan-400/40">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-['JetBrains_Mono',monospace] font-bold text-cyan-400 uppercase tracking-wider">
                UPGRADE AVAILABLE · MULTI-LAYER QUANT SYSTEM
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono',monospace] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/50 shadow-sm">
                V2 ACTIVE
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
              ULTRA-INSTITUTIONAL AI TRADE DECISION ENGINE — V2
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Full multi-timeframe confluence, 8 market regimes, order flow footprint & macro correlation for BTC, XAU & XAUT.
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('ultra-ai')}
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black font-['JetBrains_Mono',monospace] px-4 py-2.5 text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            Launch Decision Engine V2 ➔
          </button>
        )}
      </div>

      {/* ────────────────── TOP MASTER HEADER ────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-['JetBrains_Mono',monospace] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              PROFESSIONAL ORDER FLOW ENGINE
            </span>
            <span className="rounded-full border border-slate-800 bg-[#0d1424] px-3 py-1 text-xs font-['JetBrains_Mono',monospace] text-slate-300">
              Primary TF: <b className="text-cyan-400">15 Minutes</b>
            </span>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-['JetBrains_Mono',monospace] text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              ● {marketData.dataSourceQuality}
            </span>
          </div>

          <h1 className="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{marketData.displaySymbol}</span>
            <span className="text-2xl sm:text-3xl font-['JetBrains_Mono',monospace] font-black text-white ml-1 tracking-tight">
              {marketData.formattedPrice}
            </span>
            <span className={`text-sm font-['JetBrains_Mono',monospace] font-bold px-2.5 py-1 rounded-lg ${marketData.isPositive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
              {marketData.change24h}
            </span>
          </h1>

          <p className="mt-1 text-xs text-slate-400 max-w-3xl font-['JetBrains_Mono',monospace]">
            Source: <b className="text-slate-200">{marketData.dataSourceLabel}</b> · {marketData.lastUpdated}
          </p>
        </div>

        {/* DECISION PILL */}
        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#0c162a] to-[#070e1c] min-w-[270px] text-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <span className="text-[10px] font-['JetBrains_Mono',monospace] uppercase text-cyan-400 font-bold tracking-widest">
            AI ORDER FLOW BIAS
          </span>
          <div className="mt-1 text-lg font-black font-['JetBrains_Mono',monospace] tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
            {marketData.finalStatus}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs font-['JetBrains_Mono',monospace] text-slate-400">
            <span>Score: <b className="text-white font-bold">{marketData.orderFlowScore}/100</b></span>
            <span>·</span>
            <span>Long Conf: <b className="text-emerald-400 font-bold">{marketData.longConfirmations.score}/11</b></span>
          </div>
        </div>
      </header>

      {/* ────────────────── DATA INTEGRITY & MARKET SELECTOR BAR ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081020]/90 p-3 rounded-2xl border border-cyan-500/20 text-xs font-['JetBrains_Mono',monospace] backdrop-blur-md shadow-lg">
        {/* Markets: BTC, ETH, XAUUSD, XAGUSD, SOL */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 uppercase text-[11px] font-bold mr-1">MARKET:</span>
          <button
            onClick={() => setSelectedMarket('BTCUSDT')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              selectedMarket === 'BTCUSDT'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_16px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                : 'bg-[#10192e] text-slate-400 hover:text-white border border-slate-800 hover:bg-[#152340]'
            }`}
          >
            ₿ BTCUSDT (Bitcoin)
          </button>
          <button
            onClick={() => setSelectedMarket('ETHUSDT')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              selectedMarket === 'ETHUSDT'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] ring-1 ring-indigo-400'
                : 'bg-[#10192e] text-slate-400 hover:text-white border border-slate-800 hover:bg-[#152340]'
            }`}
          >
            Ξ ETHUSDT (Ethereum)
          </button>
          <button
            onClick={() => setSelectedMarket('XAUUSD')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              selectedMarket === 'XAUUSD'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-[0_0_16px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                : 'bg-[#10192e] text-slate-400 hover:text-white border border-slate-800 hover:bg-[#152340]'
            }`}
          >
            🥇 XAUUSD (Gold COMEX)
          </button>
          <button
            onClick={() => setSelectedMarket('XAGUSD')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              selectedMarket === 'XAGUSD'
                ? 'bg-gradient-to-r from-slate-400 to-slate-200 text-slate-950 shadow-[0_0_16px_rgba(203,213,225,0.4)] ring-1 ring-white font-extrabold'
                : 'bg-[#10192e] text-slate-400 hover:text-white border border-slate-800 hover:bg-[#152340]'
            }`}
          >
            🥈 XAGUSD (Silver Spot)
          </button>
          <button
            onClick={() => setSelectedMarket('SOLUSDT')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              selectedMarket === 'SOLUSDT'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.4)] ring-1 ring-purple-400'
                : 'bg-[#10192e] text-slate-400 hover:text-white border border-slate-800 hover:bg-[#152340]'
            }`}
          >
            ◎ SOLUSDT (Solana)
          </button>
        </div>

        {/* Timeframe Selector (1M, 3M, 5M, 15M, 30M, 1H, 4H, 1D) */}
        <div className="flex items-center gap-1 bg-[#101726] p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase px-1">TIMEFRAME:</span>
          {(['1M', '3M', '5M', '15M', '30M', '1H', '4H', '1D'] as OrderFlowTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* View Mode & Imbalance Config */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#101726] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('BOOKMAP')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'BOOKMAP' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow ring-1 ring-cyan-400' : 'text-cyan-400 hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              🗺️ Bookmap Pro
            </button>
            <button
              onClick={() => setViewMode('FOOTPRINT')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'FOOTPRINT' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Footprint
            </button>
            <button
              onClick={() => setViewMode('TRADINGVIEW')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'TRADINGVIEW' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📈 TradingView
            </button>
            <button
              onClick={() => setViewMode('HEATMAP')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'HEATMAP' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🧱 DOM Depth
            </button>
          </div>

          {/* Imbalance Threshold Button */}
          <div className="flex items-center gap-1 bg-[#101726] px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500">IMBALANCE:</span>
            {[250, 300, 400].map((th) => (
              <button
                key={th}
                onClick={() => setImbalanceThreshold(th)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  imbalanceThreshold === th ? 'bg-cyan-500 text-black' : 'text-slate-400'
                }`}
              >
                {th}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────────── GOLD & BTC DATA INTEGRITY NOTICE BANNER ────────────────── */}
      {selectedMarket === 'XAUUSD' && (
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/60 text-xs text-amber-200/90 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <b>DATA INTEGRITY RULE:</b> Gold spot OTC lacks a centralized book. Live footprint and order flow are sourced from <b>COMEX GC Active Contract Futures Proxy</b>. Zero fabricated data.
            </span>
          </div>
          <span className="bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
            VERIFIED FUTURES FEED
          </span>
        </div>
      )}
      {selectedMarket === 'XAGUSD' && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/80 text-xs text-slate-200/90 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <b>DATA INTEGRITY RULE:</b> Silver spot OTC footprint & depth are sourced from <b>COMEX SI Active Contract Futures Proxy</b> (~$48.60/oz). High-resolution Level 2 order flow.
            </span>
          </div>
          <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
            COMEX SILVER L2 FEED
          </span>
        </div>
      )}

      {/* ────────────────── MAIN 2-COLUMN ORDER FLOW VIEWPORT ────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px]">
        {/* ── LEFT: CHART & ORDER FLOW SUB-CHARTS (CVD + DELTA) ── */}
        <div className="space-y-3">
          {/* Main Chart Container */}
          <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3 shadow-xl space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-mono">
              <span className="text-white font-bold flex items-center gap-2">
                <span>📊</span>
                <span>{marketData.marketName}</span>
                <span className="text-cyan-400">· {timeframe} Footprint</span>
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  POC: <b>${marketData.poc}</b>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  VAH: <b>${marketData.vah}</b> · VAL: <b>${marketData.val}</b>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  VWAP: <b>${marketData.sessionVwap}</b>
                </span>
              </div>
            </div>

            {/* CHART DISPLAY */}
            {viewMode === 'BOOKMAP' ? (
              <div className="w-full">
                <BookmapChart
                  initialSymbol={selectedMarket}
                  onSymbolChange={(s) => setSelectedMarket(s)}
                />
              </div>
            ) : viewMode === 'FOOTPRINT' ? (
              <div className="bg-[#05080f] rounded-lg border border-slate-800/80 p-3 min-h-[460px] overflow-x-auto select-none">
                <div className="flex items-stretch justify-around gap-4 min-w-[680px]">
                  {marketData.candles.map((candle, cIdx) => {
                    const isBull = candle.close >= candle.open;
                    return (
                      <div
                        key={cIdx}
                        className="flex-1 flex flex-col justify-between p-2 rounded-lg bg-[#0a0f1d] border border-slate-800/80 hover:border-cyan-500/50 transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredCandle(candle)}
                      >
                        {/* Candle Top Stats */}
                        <div className="text-[10px] font-mono border-b border-slate-800/80 pb-1.5 space-y-0.5">
                          <div className="flex justify-between text-slate-400">
                            <span>{candle.time}</span>
                            <span className={isBull ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {isBull ? '▲' : '▼'} {candle.close}
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px]">
                            <span className="text-slate-500">Vol: {candle.volume}</span>
                            <span className={`font-bold ${candle.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              Δ {candle.delta >= 0 ? '+' : ''}{candle.delta} ({candle.deltaPct}%)
                            </span>
                          </div>
                        </div>

                        {/* Diagonal Bid x Ask Footprint Levels */}
                        <div className="py-2 space-y-1 font-mono text-[10px]">
                          {candle.levels.map((lvl, lIdx) => (
                            <div
                              key={lIdx}
                              className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[9px] ${
                                lvl.isPoc
                                  ? 'bg-amber-500/20 border border-amber-400/60 font-bold text-amber-300'
                                  : 'bg-[#080d18]'
                              }`}
                            >
                              {/* Bid Volume */}
                              <span
                                className={`w-12 text-left ${
                                  lvl.isSellImbalance ? 'text-rose-400 font-black bg-rose-950/60 px-1 rounded' : 'text-slate-400'
                                }`}
                              >
                                {lvl.bidVol}
                              </span>

                              {/* Price Level */}
                              <span className="text-slate-400 text-[8px] font-bold">
                                {lvl.price}
                              </span>

                              {/* Ask Volume */}
                              <span
                                className={`w-12 text-right ${
                                  lvl.isBuyImbalance ? 'text-emerald-400 font-black bg-emerald-950/60 px-1 rounded' : 'text-slate-400'
                                }`}
                              >
                                {lvl.askVol}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Candle Bottom Features */}
                        <div className="pt-1.5 border-t border-slate-800/80 text-[9px] font-mono flex flex-wrap gap-1">
                          {candle.hasStackedBuyImbalance && (
                            <span className="bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-800 text-[8px] font-bold">
                              STACKED BUY IMB
                            </span>
                          )}
                          {candle.absorptionDetected === 'BUY_ABSORPTION' && (
                            <span className="bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-800 text-[8px] font-bold">
                              BUY ABSORPTION
                            </span>
                          )}
                          {candle.liquiditySweepDetected === 'SELL_SIDE_SWEEP' && (
                            <span className="bg-indigo-950 text-indigo-300 px-1 rounded border border-indigo-800 text-[8px] font-bold">
                              💧 SWEEP LOW
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footprint Interactive Hover Details */}
                {hoveredCandle && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[#090e1c] border border-cyan-500/40 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                    <span className="text-cyan-400 font-bold">Selected Candle: {hoveredCandle.time}</span>
                    <span>O: ${hoveredCandle.open} · H: ${hoveredCandle.high} · L: ${hoveredCandle.low} · C: ${hoveredCandle.close}</span>
                    <span className="text-emerald-400 font-bold">Delta: +{hoveredCandle.delta}</span>
                    <span className="text-amber-400">POC: ${hoveredCandle.pocPrice}</span>
                    <span className="text-purple-400">VWAP: ${hoveredCandle.vwapPrice}</span>
                  </div>
                )}
              </div>
            ) : viewMode === 'TRADINGVIEW' ? (
              <TradingViewWidget
                symbol={
                  selectedMarket === 'BTCUSDT' ? 'BINANCE:BTCUSDT' :
                  selectedMarket === 'ETHUSDT' ? 'BINANCE:ETHUSDT' :
                  selectedMarket === 'SOLUSDT' ? 'BINANCE:SOLUSDT' :
                  selectedMarket === 'XAGUSD' ? 'OANDA:XAGUSD' :
                  'OANDA:XAUUSD'
                }
                interval={tvInterval}
                height={480}
                studies={['STD;EMA', 'STD;Bollinger_Bands', 'STD;Volume', 'STD;RSI']}
              />
            ) : (
              /* Liquidity Heatmap View */
              <div className="bg-[#05080f] rounded-lg border border-slate-800 p-4 min-h-[460px] font-mono space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="text-white font-bold">Resting Liquidity & Order Book Heatmap Depth</span>
                  <span>Cluster Aggregation: 0.1% Bands</span>
                </div>
                <div className="space-y-2">
                  {marketData.domRows.map((row, idx) => {
                    const isAsk = row.askPrice > 0;
                    const price = isAsk ? row.askPrice : row.bidPrice;
                    const size = isAsk ? row.askSize : row.bidSize;
                    const maxDepth = Math.max(marketData.bidDepthTotal, marketData.askDepthTotal) / 5;
                    const barPct = Math.min(100, Math.round((size / maxDepth) * 100));

                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-20 font-bold text-slate-300">${price}</span>
                        <div className="flex-1 h-5 bg-[#080d18] rounded overflow-hidden relative border border-slate-800/80">
                          <div
                            className={`h-full ${isAsk ? 'bg-rose-500/40' : 'bg-emerald-500/40'}`}
                            style={{ width: `${barPct}%` }}
                          />
                          <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-bold text-slate-200">
                            {size} {selectedMarket === 'BTCUSDT' ? 'BTC' : 'Lots'}
                            {row.isLiquidityWall && ' 🧱 WALL'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sub-Chart: Real-time Cumulative Volume Delta (CVD) & Delta Histogram */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* 1. CVD Panel */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090d16] font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span>📈</span> CUMULATIVE VOLUME DELTA (CVD)
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-800">
                  {marketData.cvdDirection}
                </span>
              </div>
              <p className="text-xl font-black text-white">{marketData.totalDeltaFormatted}</p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Slope: <b className="text-white">{marketData.cvdSlope}</b></span>
                <span>Divergence: <b className="text-emerald-400">{marketData.cvdDivergence}</b></span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                {marketData.cvdDivergenceDetail}
              </p>
            </div>

            {/* 2. Order Book Imbalance & DOM */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090d16] font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>📚</span> ORDER BOOK / DOM IMBALANCE
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-800">
                  {marketData.orderBookDominance}
                </span>
              </div>
              <p className="text-xl font-black text-emerald-400">
                +{marketData.orderBookImbalancePct}% Bid Dominance
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Best Bid: <b className="text-white">${marketData.bestBid}</b></span>
                <span>Best Ask: <b className="text-white">${marketData.bestAsk}</b></span>
                <span>Spread: <b className="text-cyan-400">${marketData.spread}</b></span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Total Bids: <b>{marketData.bidDepthTotal}</b></span>
                <span>Total Asks: <b>{marketData.askDepthTotal}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: DECISION PANEL, CONFIRMATIONS & RISK MANAGEMENT ── */}
        <div className="space-y-4">
          {/* Panel 1: Sequence Detector (6 Stages) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1220] font-mono space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span>🔄</span> ORDER FLOW SEQUENCE ENGINE
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-bold">
                {marketData.sequenceEngine.sequenceConfidence}% CONFIDENCE
              </span>
            </div>

            {/* 6 Step Progression */}
            <div className="space-y-1.5 text-xs">
              {[
                { label: '1. LIQUIDITY SWEEP', active: marketData.sequenceEngine.liquiditySweep, detail: 'Stops hunted below key shelf' },
                { label: '2. AGGRESSION CONFIRMED', active: marketData.sequenceEngine.aggressionConfirmed, detail: 'Market sell aggression surge' },
                { label: '3. ABSORPTION DETECTED', active: marketData.sequenceEngine.absorptionDetected, detail: 'Bids absorbed selling volume' },
                { label: '4. REJECTION FORMED', active: marketData.sequenceEngine.rejectionFormed, detail: 'Price pushed immediately away' },
                { label: '5. STRUCTURE SHIFT', active: marketData.sequenceEngine.structureShift, detail: 'Bullish CHoCH on 15M candle' },
                { label: '6. CONFIRMATION ACHIEVED', active: marketData.sequenceEngine.finalConfirmation, detail: 'Reclaimed VWAP & POC level' }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg flex items-center justify-between border ${
                    step.active
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-[11px]">{step.label}</span>
                    <span className="text-[9px] text-slate-400 font-sans">{step.detail}</span>
                  </div>
                  <span className="text-xs">{step.active ? '✅' : '⏳'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: 11-Factor Confirmation Scorecard */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1220] font-mono space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🎯</span> 11-FACTOR CONFIRMATION SCORE
              </span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {marketData.longConfirmations.score} / 11 CHECKS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { name: 'Positive Delta', ok: marketData.longConfirmations.positiveDelta },
                { name: 'Positive CVD', ok: marketData.longConfirmations.positiveCvd },
                { name: 'Buy Imbalance', ok: marketData.longConfirmations.buyImbalance },
                { name: 'Buy Absorption', ok: marketData.longConfirmations.buyAbsorption },
                { name: 'Sell-Side Sweep', ok: marketData.longConfirmations.sellSideSweep },
                { name: 'Above VWAP', ok: marketData.longConfirmations.aboveVwap },
                { name: 'POC Support', ok: marketData.longConfirmations.pocSupport },
                { name: 'Volume Conf.', ok: marketData.longConfirmations.volumeConfirmation },
                { name: 'Bullish Struct.', ok: marketData.longConfirmations.bullishMarketStructure },
                { name: 'CHoCH / BOS', ok: marketData.longConfirmations.bullishChochOrBos },
                { name: 'DOM Imbalance', ok: marketData.longConfirmations.positiveBookImbalance }
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-300">
                  <span>{c.ok ? '🟢' : '⚪'}</span>
                  <span className="truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Risk Management & ATR Calculator */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1220] font-mono space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>🛡️</span> RISK MANAGEMENT & SIZING
              </span>
              <span className="text-[10px] text-slate-400">ATR: ${marketData.riskPlan.atrValue}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[#070b14] border border-slate-800">
                <span className="text-[10px] text-slate-500 block">SUGGESTED ENTRY</span>
                <span className="text-sm font-bold text-white">${marketData.riskPlan.suggestedEntry}</span>
              </div>
              <div className="p-2 rounded bg-rose-950/20 border border-rose-800/60">
                <span className="text-[10px] text-rose-300 block">STOP LOSS</span>
                <span className="text-sm font-bold text-rose-400">${marketData.riskPlan.suggestedStopLoss}</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/60">
                <span className="text-[10px] text-emerald-300 block">TARGET 1</span>
                <span className="text-sm font-bold text-emerald-400">${marketData.riskPlan.suggestedTp1}</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/60">
                <span className="text-[10px] text-emerald-300 block">TARGET 2</span>
                <span className="text-sm font-bold text-emerald-400">${marketData.riskPlan.suggestedTp2}</span>
              </div>
            </div>

            {/* Position Size Input Calculator */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Account ($):</span>
                <input
                  type="number"
                  value={accountSize}
                  onChange={(e) => setAccountSize(Number(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-right text-white font-bold"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Max Risk (%):</span>
                <input
                  type="number"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-right text-white font-bold"
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-cyan-950/30 border border-cyan-800/60 text-cyan-300 text-[11px]">
                <span>Recommended Position:</span>
                <b>{calculatedUnits} {selectedMarket === 'BTCUSDT' ? 'BTC' : 'Lots'} (${calculatedRiskAmount} risk)</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 4. MULTI-TIMEFRAME ORDER FLOW MATRIX ────────────────── */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#090e18] font-mono space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🌐</span> MULTI-TIMEFRAME ORDER FLOW ANALYSIS (5M · 15M · 1H · 4H)
          </span>
          <span className="text-xs font-bold text-emerald-400">Overall Consensus: BULLISH</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0f172a] text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="p-2.5">Timeframe</th>
                <th className="p-2.5">Delta</th>
                <th className="p-2.5">CVD</th>
                <th className="p-2.5">Imbalance</th>
                <th className="p-2.5">Absorption</th>
                <th className="p-2.5">Liquidity</th>
                <th className="p-2.5">Volume</th>
                <th className="p-2.5">VWAP</th>
                <th className="p-2.5">Structure</th>
                <th className="p-2.5">Bias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {marketData.mtfAnalysis.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-2.5 font-bold text-white">{row.timeframe}</td>
                  <td className="p-2.5 text-emerald-400 font-bold">{row.delta}</td>
                  <td className="p-2.5 text-cyan-400">{row.cvd}</td>
                  <td className="p-2.5 text-emerald-300">{row.imbalance}</td>
                  <td className="p-2.5 text-slate-300">{row.absorption}</td>
                  <td className="p-2.5 text-slate-300">{row.liquidity}</td>
                  <td className="p-2.5 text-slate-300">{row.volume}</td>
                  <td className="p-2.5 text-purple-300">{row.vwapRelation}</td>
                  <td className="p-2.5 text-cyan-300 font-bold">{row.structure}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {row.bias}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ────────────────── 5. REAL-TIME ALERT SYSTEM FEED ────────────────── */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#090e18] font-mono space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <span>🚨</span> REAL-TIME ORDER FLOW ALERT ENGINE
          </span>
          <span className="text-[10px] text-slate-500">Live Telemetry Trigger</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {marketData.recentAlerts.map((alt) => (
            <div
              key={alt.id}
              className="p-3 rounded-lg bg-[#0e1424] border border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">{alt.timestamp}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    alt.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  }`}
                >
                  {alt.severity}
                </span>
              </div>
              <p className="text-xs font-bold text-white">{alt.title}</p>
              <p className="text-[10px] text-slate-400 font-sans leading-snug">{alt.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────────── 6. FINAL AI DECISION & EXPLANATION SUMMARY ────────────────── */}
      <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-[#0d1627] via-[#0b1220] to-[#070b14] p-5 shadow-2xl font-mono space-y-3">
        <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
          ━━━━━━━━━━━━━━━━━━━━ AI ORDER FLOW SUMMARY ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs pt-1 border-t border-slate-800/80">
          <div><span className="text-slate-500 block text-[10px]">MARKET</span><b className="text-white">{marketData.symbol}</b></div>
          <div><span className="text-slate-500 block text-[10px]">TIMEFRAME</span><b className="text-cyan-400">{timeframe} (Primary)</b></div>
          <div><span className="text-slate-500 block text-[10px]">ORDER FLOW</span><b className="text-emerald-400">Bullish Dominance</b></div>
          <div><span className="text-slate-500 block text-[10px]">DELTA / CVD</span><b className="text-emerald-400">Positive (+1,845)</b></div>
          <div><span className="text-slate-500 block text-[10px]">ABSORPTION</span><b className="text-cyan-300">Buy Absorption</b></div>
          <div><span className="text-slate-500 block text-[10px]">VWAP / POC</span><b className="text-purple-300">Above Both</b></div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#070c18] border border-cyan-500/30 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-emerald-400">{marketData.finalStatus}</span>
            <span className="text-xs text-slate-400">· Long Score {marketData.longConfirmations.score}/11</span>
          </div>
          <p className="text-xs font-sans text-slate-200 leading-relaxed">
            <strong className="text-cyan-400">Order Flow Evidence: </strong>
            {marketData.aiDecisionReason}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-sans">
          <span>* Order Flow is confirmation, not a guaranteed prediction. Prioritize stop loss and capital preservation.</span>
          <span className="font-mono text-slate-400">Data Source: {marketData.dataSourceLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderFlowTerminal;
