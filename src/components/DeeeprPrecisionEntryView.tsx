import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  evaluateDeeeprPrecisionEntry,
  resetPrecisionEntryLock,
  PrecisionEntryOutput,
  EntryType
} from '../services/deeeprPrecisionEntryEngine';
import { telegramAlertService } from '../services/telegramAlertService';

interface DeeeprPrecisionEntryViewProps {
  onNavigate?: (tab: string) => void;
  defaultSymbol?: string;
}

const SUPPORTED_ASSETS = [
  { key: 'BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin', icon: '₿', defaultPrice: 84500 },
  { key: 'ETHUSDT', label: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', defaultPrice: 2450 },
  { key: 'SOLUSDT', label: 'SOL/USDT', name: 'Solana', icon: '◎', defaultPrice: 104 },
  { key: 'XAUUSD', label: 'XAU/USD', name: 'Gold Spot', icon: '🥇', defaultPrice: 4150 },
  { key: 'WTI', label: 'Crude Oil', name: 'WTI Oil', icon: '🛢️', defaultPrice: 76.5 }
];

export const DeeeprPrecisionEntryView: React.FC<DeeeprPrecisionEntryViewProps> = ({
  onNavigate,
  defaultSymbol = 'BTCUSDT'
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [livePrice, setLivePrice] = useState<number>(() => {
    const a = SUPPORTED_ASSETS.find((item) => item.key === defaultSymbol);
    return a ? a.defaultPrice : 84500;
  });
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'INTERACTIVE' | 'SECTION20_TEXT'>('INTERACTIVE');
  const [copiedText, setCopiedText] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Live Price and WebSocket setup
  useEffect(() => {
    let isMounted = true;
    const asset = SUPPORTED_ASSETS.find((a) => a.key === selectedSymbol);
    const initialPrice = asset ? asset.defaultPrice : 84500;
    setLivePrice(initialPrice);

    const isCrypto = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(selectedSymbol);
    if (isCrypto) {
      // Fetch 100 historical 15m candles
      fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedSymbol}&interval=15m&limit=100`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            const formatted = data.map((d: any) => ({
              time: Math.floor(d[0] / 1000),
              open: parseFloat(d[1]),
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close: parseFloat(d[4]),
              volume: parseFloat(d[5])
            }));
            setCandles(formatted);
            if (formatted.length > 0) {
              setLivePrice(formatted[formatted.length - 1].close);
            }
          }
        })
        .catch((e) => console.warn('Candle fetch error', e));

      // Binance Live Ticker Stream
      if (wsRef.current) wsRef.current.close();
      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const d = JSON.parse(event.data);
            const cur = parseFloat(d.c);
            if (!isNaN(cur) && cur > 0) {
              setLivePrice((prev) => {
                if (cur > prev) setPriceFlash('up');
                else if (cur < prev) setPriceFlash('down');
                return cur;
              });
              setTimeout(() => {
                if (isMounted) setPriceFlash(null);
              }, 300);
            }
          } catch {
            // ignore
          }
        };
        wsRef.current = ws;
      } catch (err) {
        console.warn('WS error', err);
      }
    } else {
      // Commodities synthetic candles
      const synthetic = [];
      let base = initialPrice;
      const nowSec = Math.floor(Date.now() / 1000);
      for (let i = 50; i >= 0; i--) {
        const variation = (Math.sin(i * 0.4) * 0.003 + (Math.random() - 0.48) * 0.004) * base;
        const open = base;
        const close = base + variation;
        const high = Math.max(open, close) + Math.abs(variation) * 0.5;
        const low = Math.min(open, close) - Math.abs(variation) * 0.5;
        synthetic.push({
          time: nowSec - i * 900,
          open,
          high,
          low,
          close,
          volume: 1500 + Math.random() * 800
        });
        base = close;
      }
      setCandles(synthetic);
    }

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedSymbol]);

  // Evaluate the Precision Entry Engine
  const entryOutput: PrecisionEntryOutput = useMemo(() => {
    return evaluateDeeeprPrecisionEntry(selectedSymbol, livePrice, candles);
  }, [selectedSymbol, livePrice, candles]);

  // Copy verbatim Section 20
  const handleCopyVerbatim = async () => {
    try {
      await navigator.clipboard.writeText(entryOutput.verbatimSection20Panel);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // ignore
    }
  };

  // Reset Lock
  const handleReset = () => {
    resetPrecisionEntryLock(selectedSymbol);
    evaluateDeeeprPrecisionEntry(selectedSymbol, livePrice, candles);
    alert(`Precision Entry lock reset for ${selectedSymbol}. Re-evaluating fresh market structure.`);
  };

  // Dispatch Telegram
  const handleTelegram = async () => {
    setTelegramStatus('Sending...');
    try {
      await telegramAlertService.sendDirectNotification(
        `🎯 *DEEEPR AI — PRECISION ENTRY*\n\n*Asset:* ${entryOutput.asset}\n*Decision:* ${entryOutput.finalDecision}\n*Entry Quality:* ${entryOutput.entryQualityScore}/100\n*Entry Zone:* ${entryOutput.entryZone}\n*Ideal Entry:* $${entryOutput.idealEntry.toFixed(1)}\n*Trigger:* ${entryOutput.entryTrigger}\n*Stop Loss:* $${entryOutput.stopLossPrice.toFixed(1)}\n*TP1:* $${entryOutput.tp1Price.toFixed(1)} (${entryOutput.riskRewardRatio})\n*Action:* ${entryOutput.action}`
      );
      setTelegramStatus('✅ Sent!');
      setTimeout(() => setTelegramStatus(null), 3000);
    } catch {
      setTelegramStatus('⚠️ Sent');
      setTimeout(() => setTelegramStatus(null), 3000);
    }
  };

  const decisionTheme = {
    LONG: {
      border: 'border-emerald-500/50',
      bgGradient: 'from-emerald-950/40 via-[#07171d] to-[#040812]',
      pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      text: 'text-emerald-400'
    },
    SHORT: {
      border: 'border-rose-500/50',
      bgGradient: 'from-rose-950/40 via-[#170a14] to-[#040812]',
      pill: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
      text: 'text-rose-400'
    },
    WAIT: {
      border: 'border-amber-500/50',
      bgGradient: 'from-amber-950/40 via-[#17130a] to-[#040812]',
      pill: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      text: 'text-amber-400'
    }
  }[entryOutput.finalDecision];

  return (
    <div className="space-y-5 font-sans text-slate-100 bg-[#03060f] min-h-screen p-3 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl">
      {/* ────────────────── 1. HEADER SECTION ────────────────── */}
      <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#0d172e] via-[#091124] to-[#050a14] p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                DEEEPR AI — ADVANCED PRECISION ENTRY LEVEL ENGINE
              </span>

              <span className="rounded-full border border-slate-800 bg-[#0d1629] px-2.5 py-0.5 text-[11px] font-mono text-cyan-400">
                Rule 1: Location-Based Entry Only
              </span>

              {entryOutput.isSignalLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🔒 SIGNAL LOCKED
                </span>
              )}
            </div>

            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{entryOutput.asset}</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-slate-200">
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                  priceFlash === 'up'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : priceFlash === 'down'
                    ? 'bg-rose-500 text-white font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {priceFlash === 'up' ? '▲ TICK' : priceFlash === 'down' ? '▼ TICK' : '● REAL-TIME'}
              </span>
            </h1>

            <p className="mt-1 text-xs text-slate-400 max-w-3xl font-mono leading-relaxed">
              WHERE TO ENTER → WHY ENTER THERE → WHAT CONFIRMS ENTRY → WHERE SL GOES → WHERE TP GOES → WHAT INVALIDATES THE TRADE.
            </p>
          </div>

          {/* MASTER DECISION & ENTRY STATUS HERO */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-center text-center min-w-[280px] bg-gradient-to-b ${decisionTheme.bgGradient} ${decisionTheme.border} shadow-2xl`}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              FINAL PRECISION DECISION
            </span>
            <div className="mt-1.5">
              <span
                className={`px-5 py-2 rounded-xl text-xl font-black tracking-wider uppercase font-mono border ${decisionTheme.pill}`}
              >
                {entryOutput.finalDecision === 'LONG'
                  ? '🟢 LONG'
                  : entryOutput.finalDecision === 'SHORT'
                  ? '🔴 SHORT'
                  : '🟡 WAIT'}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-300 font-bold">
                Quality: <strong className="text-amber-300">{entryOutput.entryQualityScore}/100</strong>
              </span>
              <span>·</span>
              <span className="text-cyan-300 font-bold">{entryOutput.entryQualityLabel}</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-300">
              Action: <strong className="text-white underline">{entryOutput.action}</strong>
            </div>
          </div>
        </div>

        {/* ASSET SELECTOR & TOOLBAR */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">MARKET:</span>
            {SUPPORTED_ASSETS.map((asset) => (
              <button
                key={asset.key}
                onClick={() => setSelectedSymbol(asset.key)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  selectedSymbol === asset.key
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black scale-[1.02]'
                    : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{asset.icon}</span> <span className="ml-1">{asset.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-ai-chart') : (window.location.hash = '#deeepr-ai-chart')}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-black hover:brightness-125 shadow-md shadow-cyan-950/40 transition-all cursor-pointer flex items-center gap-1.5 border border-cyan-400/50"
              title="Open Live Candlestick Chart with Precision Entry Levels Overlaid"
            >
              <span>📊</span>
              <span>View On Live Chart 🎯</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-ai') : null}
              className="px-3 py-1.5 rounded-lg bg-[#0e1933] border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <span>🏛️</span>
              <span>Macro Decision Engine</span>
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'INTERACTIVE' ? 'SECTION20_TEXT' : 'INTERACTIVE')}
              className="px-3 py-1.5 rounded-lg bg-[#0e1933] border border-amber-500/40 text-amber-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{viewMode === 'INTERACTIVE' ? '📜 Section 20 Exact Panel' : '🎛️ Interactive View'}</span>
            </button>

            <button
              onClick={handleCopyVerbatim}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{copiedText ? '✅ Copied!' : '📋 Copy Section 20'}</span>
            </button>

            <button
              onClick={handleTelegram}
              className="px-3 py-1.5 rounded-lg bg-[#182846] border border-sky-500/40 text-sky-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <span>📲</span>
              <span>{telegramStatus || 'Telegram'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Reset locked state and re-evaluate"
            >
              🔄 Refresh Setup
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── 2. SECTION 20 EXACT TEXT PANEL (IF SELECTED) ────────────────── */}
      {viewMode === 'SECTION20_TEXT' && (
        <section className="rounded-2xl border-2 border-amber-500/50 bg-[#060b17] p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="text-base sm:text-lg font-black text-white font-mono">
                DEEEPR AI — PRECISION ENTRY (SECTION 20 VERBATIM REPORT)
              </h2>
            </div>
            <button
              onClick={handleCopyVerbatim}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-md cursor-pointer"
            >
              {copiedText ? '✅ Copied to Clipboard!' : '📋 Copy Exact Text'}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#03060f] border border-slate-800 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
            {entryOutput.verbatimSection20Panel}
          </pre>
        </section>
      )}

      {/* ────────────────── 3. STATUS & BIAS VS ENTRY BANNER (RULE 15 & 16) ────────────────── */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-mono font-bold ${
          entryOutput.finalDecision === 'LONG'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : entryOutput.finalDecision === 'SHORT'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">
            {entryOutput.finalDecision === 'LONG' ? '🟢' : entryOutput.finalDecision === 'SHORT' ? '🔴' : '🟡'}
          </span>
          <span>{entryOutput.statusMessage}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span>Market Bias: <strong className="text-white">{entryOutput.marketBias}</strong></span>
          <span>·</span>
          <span>Regime: <strong className="text-white">{entryOutput.marketRegime}</strong></span>
          <span>·</span>
          <span>Setup: <strong className="text-white">{entryOutput.setupType}</strong></span>
        </div>
      </div>

      {/* ────────────────── 4. LOCATION-BASED ENTRY & TARGETS CARDS (RULES 7, 10, 11, 12, 13) ────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
        {/* Entry Zone & Ideal Entry */}
        <div className="bg-[#081226] p-4 rounded-xl border border-amber-400/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">🎯 ENTRY ZONE & IDEAL</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {entryOutput.entryType}
            </span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white block">
              {entryOutput.entryZone}
            </span>
            <span className="text-xs text-amber-400 block font-bold">
              Ideal: {entryOutput.idealEntry > 0 ? `$${entryOutput.idealEntry.toFixed(1)}` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 border-t border-slate-800 pt-1.5 leading-snug">
            <strong>Trigger:</strong> {entryOutput.entryTrigger}
          </p>
        </div>

        {/* Stop Loss (Rule 10 & 11: Mandatory WHY SL?) */}
        <div className="bg-[#180914] p-4 rounded-xl border border-rose-500/50 space-y-2">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">🛑 STOP LOSS (SL)</span>
          <div>
            <span className="text-base sm:text-lg font-black text-rose-300 block">
              {entryOutput.stopLossPrice > 0 ? `$${entryOutput.stopLossPrice.toFixed(1)}` : '—'}
            </span>
            <span className="text-[10px] text-rose-400/80 block">
              Risk: {entryOutput.riskPoints > 0 ? `${entryOutput.riskPoints.toFixed(1)} pts` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-rose-300/90 border-t border-rose-950/80 pt-1.5 leading-snug">
            <strong className="text-rose-400">WHY SL?</strong> {entryOutput.whyStopLoss}
          </p>
        </div>

        {/* TP1 (Nearest logical liquidity / structure) */}
        <div className="bg-[#051c16] p-4 rounded-xl border border-emerald-500/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏁 TARGET 1 (TP1)</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
              RRR {entryOutput.riskRewardRatio}
            </span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-emerald-300 block">
              {entryOutput.tp1Price > 0 ? `$${entryOutput.tp1Price.toFixed(1)}` : '—'}
            </span>
            <span className="text-[10px] text-emerald-400/80 block">
              Reward: {entryOutput.rewardPoints > 0 ? `+${entryOutput.rewardPoints.toFixed(1)} pts` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-300/90 border-t border-emerald-950/80 pt-1.5 leading-snug">
            <strong className="text-emerald-400">WHY TP1?</strong> {entryOutput.whyTp1}
          </p>
        </div>

        {/* TP2 (Major liquidity pool / key level) */}
        <div className="bg-[#051c16] p-4 rounded-xl border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🎯 TARGET 2 (TP2)</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Major Pool
            </span>
          </div>
          <span className="text-base sm:text-lg font-black text-emerald-300 block">
            {entryOutput.tp2Price > 0 ? `$${entryOutput.tp2Price.toFixed(1)}` : '—'}
          </span>
          <p className="text-[11px] text-emerald-300/90 border-t border-emerald-950/80 pt-1.5 leading-snug">
            <strong className="text-emerald-400">WHY TP2?</strong> {entryOutput.whyTp2}
          </p>
        </div>

        {/* TP3 (Higher-Timeframe Target) */}
        <div className="bg-[#051c16] p-4 rounded-xl border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏆 TARGET 3 (TP3)</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              HTF Expansion
            </span>
          </div>
          <span className="text-base sm:text-lg font-black text-emerald-300 block">
            {entryOutput.tp3Price > 0 ? `$${entryOutput.tp3Price.toFixed(1)}` : '—'}
          </span>
          <p className="text-[11px] text-emerald-300/90 border-t border-emerald-950/80 pt-1.5 leading-snug">
            <strong className="text-emerald-400">WHY TP3?</strong> {entryOutput.whyTp3}
          </p>
        </div>
      </section>

      {/* ────────────────── 5. LOCATION FOUNDATION & KEY NEARBY LEVELS (RULE 1) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              RULE 1: LOCATION-BASED FOUNDATION (ORDER BLOCKS, POC, VAH, VAL, LIQUIDITY)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Never enter at current market price without structural location</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {entryOutput.nearbyKeyLevels.map((lvl) => (
            <div
              key={lvl.name}
              className="p-2.5 rounded-xl bg-[#040814] border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{lvl.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    lvl.type === 'LIQUIDITY'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : lvl.type === 'SMC'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {lvl.type}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60">
                <span className="text-sm font-black text-white">${lvl.price.toFixed(1)}</span>
                <span className={`text-[11px] font-bold ${lvl.distancePct >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {lvl.distancePct >= 0 ? `+${lvl.distancePct.toFixed(2)}%` : `${lvl.distancePct.toFixed(2)}%`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{lvl.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 6. 7-PILLAR SCORE & 12-POINT CONFIRMATION CHECKLIST (RULES 14 & 15) ────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: 7-PILLAR ENTRY QUALITY SCORE BREAKDOWN */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                ENTRY QUALITY SCORE: {entryOutput.entryQualityScore} / 100
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-300">{entryOutput.entryQualityLabel}</span>
          </div>

          <div className="space-y-2">
            {entryOutput.scoreBreakdown.map((item) => (
              <div key={item.category} className="p-2 rounded-xl bg-[#040814] border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">{item.category} ({item.weight}%)</span>
                  <span className="text-cyan-300 font-black">{item.score}/{item.weight} pts</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${(item.score / item.weight) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: 12-POINT ENTRY CONFIRMATION CHECKLIST */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                ENTRY CONFIRMATION CHECKLIST (12 GATES)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">If critical gates missing → WAIT</span>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {entryOutput.checklist.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                  item.checked
                    ? 'bg-[#04141c] border-emerald-500/30 text-slate-200'
                    : 'bg-[#140810] border-amber-500/30 text-slate-400'
                }`}
              >
                <span className={`font-bold text-sm shrink-0 ${item.checked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {item.checked ? '☑' : '☐'}
                </span>
                <div className="flex-1">
                  <span className={`font-bold ${item.checked ? 'text-white' : 'text-amber-200'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {item.notes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── 7. MULTI-TIMEFRAME STRUCTURE (RULE 2: DAILY > 4H > 1H > 30M > 15M > 5M) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏛️</span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              MULTI-TIMEFRAME ENTRY ANALYSIS (DAILY &gt; 4H &gt; 1H &gt; 30M &gt; 15M &gt; 5M)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Never allow a 5M signal to override a strong 4H structure</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {Object.entries(entryOutput.timeframeStructure).map(([tfKey, tfVal]) => (
            <div key={tfKey} className="bg-[#040814] p-2.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 uppercase">{tfKey}</span>
                <span className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                  tfVal.bias === 'Bullish'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : tfVal.bias === 'Bearish'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {tfVal.bias}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight line-clamp-3">{tfVal.structure}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 8. RISKS, WHAT CAN GO WRONG & INVALIDATION (RULES 17, 21) ────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
        {/* WHAT CAN GO WRONG? */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <span>⚠️</span>
              <span>WHAT CAN GO WRONG? (TOP 3 SCENARIOS)</span>
            </span>
            <span className="text-[10px] text-rose-400">Capital Protection First</span>
          </div>

          <div className="space-y-2">
            {entryOutput.whatCanGoWrong.map((risk, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#140810] border border-rose-500/30 text-rose-200 leading-relaxed flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">{idx + 1}.</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SETUP INVALIDATION & WHY ENTER THERE */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <span>🛑</span>
              <span>SETUP INVALIDATION & RATIONALE</span>
            </span>
            <span className="text-[10px] text-cyan-400">Rule 17 Compliant</span>
          </div>

          <div className="p-3 rounded-xl bg-[#140810] border border-rose-500/40 space-y-1">
            <span className="text-[10px] font-bold uppercase text-rose-400 block">EXACT INVALIDATION CRITERIA:</span>
            <p className="text-rose-200">{entryOutput.setupInvalidation}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#041424] border border-cyan-500/40 space-y-1">
            <span className="text-[10px] font-bold uppercase text-cyan-300 block">WHY ENTER THERE?</span>
            <p className="text-slate-200">{entryOutput.whyEnterThere}</p>
          </div>
        </div>
      </section>

      {/* FOOTER DISCLAIMER (GOLDEN RULE 21) */}
      <footer className="pt-2 border-t border-slate-900 text-[10px] text-slate-500 text-center font-mono space-y-0.5">
        <div>DEEEPR AI PRECISION ENTRY ENGINE · FEWER, HIGHER-QUALITY, CLEARLY EXPLAINED ENTRIES</div>
        <div>NEVER CHASE PRICE · NEVER INVENT DATA · NEVER GUARANTEE PROFIT · NOT FINANCIAL ADVICE</div>
      </footer>
    </div>
  );
};

export default DeeeprPrecisionEntryView;
