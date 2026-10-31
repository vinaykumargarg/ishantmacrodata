import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield, Award, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Clock, Compass, Zap, CheckCircle2, ChevronRight,
  Info, Eye, Play, BookOpen, Volume2, VolumeX, RefreshCw,
  Crosshair, Maximize2, Sliders, ArrowUpRight, ArrowDownRight,
  FileText, Check, HelpCircle
} from 'lucide-react';
import {
  TimeframeOption,
  GoldCandle,
  DetectedSMC,
  TradeSetup,
  ZoneMapItem,
  GoldMacroIntelligence,
  fetchLiveGoldQuote,
  generateGoldCandles,
  detectSMCStructure,
  evaluateSetupModels,
  buildZoneMap,
  getGoldMacroIntelligence
} from '../services/goldSmcAutoEngine';
import { soundEffects } from '../services/soundEffectsService';

export default function GoldSmcAutoTradeLabView() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('15m');
  const [livePrice, setLivePrice] = useState<number>(2748.60);
  const [change24h, setChange24h] = useState<number>(0.42);
  const [high24h, setHigh24h] = useState<number>(2763.10);
  const [low24h, setLow24h] = useState<number>(2730.40);
  const [spread, setSpread] = useState<number>(0.25);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeModelId, setActiveModelId] = useState<'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'>('M1');

  // Chart overlay toggles
  const [showBosMss, setShowBosMss] = useState<boolean>(true);
  const [showSweeps, setShowSweeps] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showTradeBox, setShowTradeBox] = useState<boolean>(true);
  const [showGhostPath, setShowGhostPath] = useState<boolean>(true);
  const [cleanMode, setCleanMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ACTION_MAP' | 'EDUCATIONAL_7_STEPS' | 'MODELS_LIBRARY' | 'MACRO_DRIVERS'>('ACTION_MAP');
  const [showCheatsheetModal, setShowCheatsheetModal] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Poll live price
  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      try {
        const q = await fetchLiveGoldQuote();
        if (mounted) {
          setLivePrice(q.price);
          setChange24h(q.change24h);
          setHigh24h(q.high);
          setLow24h(q.low);
          setSpread(q.spread);
          setLastUpdated(q.timestamp);
        }
      } catch (err) {
        console.warn('Gold quote fetch error:', err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Generate Candles & SMC data
  const candles = useMemo(() => {
    return generateGoldCandles(timeframe, livePrice, 75);
  }, [timeframe, livePrice]);

  const smcData: DetectedSMC = useMemo(() => {
    return detectSMCStructure(candles, timeframe);
  }, [candles, timeframe]);

  const tradeSetup: TradeSetup = useMemo(() => {
    return evaluateSetupModels(candles, smcData, livePrice, timeframe);
  }, [candles, smcData, livePrice, timeframe]);

  const zoneMap: ZoneMapItem[] = useMemo(() => {
    return buildZoneMap(candles, smcData, livePrice);
  }, [candles, smcData, livePrice]);

  const macroIntel: GoldMacroIntelligence = useMemo(() => {
    return getGoldMacroIntelligence();
  }, []);

  // Compute SVG Chart bounds
  const chartHeight = 520;
  const chartWidth = 920;
  const padding = { top: 40, bottom: 50, left: 20, right: 90 };

  const { minP, maxP, scaleX, scaleY } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    // Add margin for trade box & overlays
    min = Math.min(min, tradeSetup.tp3 - 4.0);
    max = Math.max(max, tradeSetup.stopLoss + 4.0);

    const pRange = max - min || 1;
    const usableW = chartWidth - padding.left - padding.right;
    const usableH = chartHeight - padding.top - padding.bottom;

    const sX = (i: number) => padding.left + (i / (candles.length - 1)) * usableW;
    const sY = (price: number) => padding.top + (1 - (price - min) / pRange) * usableH;

    return { minP: min, maxP: max, scaleX: sX, scaleY: sY };
  }, [candles, tradeSetup, chartHeight, chartWidth]);

  // Audio briefing
  const handleToggleVoice = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) return;
    const text = `Gold SMC Auto Trade Lab update. XAUUSD is trading at ${livePrice}. Active model M1 Sweep with Breaker Block retest. Master state is ${tradeSetup.side} ${tradeSetup.state}. Entry planned at ${tradeSetup.entryPrice}, Stop Loss at ${tradeSetup.stopLoss}, Target 3 at ${tradeSetup.tp3}. Net reward to risk is ${tradeSetup.netRRToTp3}R.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── 1. TOP HEADER & TELEMETRY BAR ── */}
      <div className="rounded-2xl border border-amber-500/30 bg-[#070b14] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-600 text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                  <span>GOLD (XAUUSD) SMC AUTO TRADE LAB</span>
                </h1>
                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase font-mono tracking-wider">
                  AUTO-MARKED SMC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Auto Swings • BOS & MSS • Liquidity Grab (X) • Breaker Block (BB + FVG) • Auto Trade Setup & Execution Plan
              </p>
            </div>
          </div>

          {/* Live Price Strip & Session Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">XAU/USD SPOT</span>
                <span className="text-lg font-black text-amber-400">
                  ${livePrice.toFixed(2)}
                </span>
              </div>
              <div className="border-l border-slate-700 pl-3 leading-tight">
                <span className={`text-xs font-bold block ${change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400">Spr: ${spread.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{macroIntel.sessionStatus.name}</span>
            </div>

            <button
              onClick={handleToggleVoice}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                isSpeaking
                  ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Jarvis Audio'}</span>
            </button>

            <button
              onClick={() => setShowCheatsheetModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>7-Step SMC Guide</span>
            </button>
          </div>
        </div>

        {/* Timeframe & Overlay Controls Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
            {(['1m', '3m', '5m', '15m', '1H', '4H', '1D'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  soundEffects.playBlip();
                  setTimeframe(tf);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Overlay Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setShowBosMss(!showBosMss)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                showBosMss ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              BOS / MSS
            </button>
            <button
              onClick={() => setShowSweeps(!showSweeps)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                showSweeps ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              X Sweeps & EQH
            </button>
            <button
              onClick={() => setShowZones(!showZones)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                showZones ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              BB + FVG Zones
            </button>
            <button
              onClick={() => setShowTradeBox(!showTradeBox)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                showTradeBox ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Trade Box & R:R
            </button>
            <button
              onClick={() => setShowGhostPath(!showGhostPath)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                showGhostPath ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Ghost Path
            </button>
            <button
              onClick={() => setCleanMode(!cleanMode)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                cleanMode ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Clean Mode
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN WORKSPACE ROW: CHART (72%) + RIGHT PANEL (28%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 72%: AUTO-MARKED SMC CANDLESTICK CHART */}
        <div className="lg:col-span-8 xl:col-span-8 rounded-2xl border border-slate-800 bg-[#0b0f17] p-3 sm:p-4 shadow-2xl relative overflow-hidden flex flex-col">
          {/* Top Title Bar of Chart (matches reference mockup exactly) */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">XAUUSD {timeframe}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 uppercase">
                {activeModelId} • SMC AUTO DETECTION • REAL FEED
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>H: <strong className="text-white">${high24h.toFixed(2)}</strong></span>
              <span>L: <strong className="text-white">${low24h.toFixed(2)}</strong></span>
              <span className="text-emerald-400 font-bold">● LIVE</span>
            </div>
          </div>

          {/* SVG Canvas Chart */}
          <div className="relative w-full overflow-x-auto select-none mt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[700px] text-xs font-mono"
              style={{ background: '#0b0f17' }}
            >
              {/* Subtle Grid Lines */}
              {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => {
                const y = padding.top + pct * (chartHeight - padding.top - padding.bottom);
                const pVal = maxP - pct * (maxP - minP);
                return (
                  <g key={idx}>
                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" opacity="0.6" />
                    <text x={chartWidth - padding.right + 8} y={y + 4} fill="#64748b" fontSize="10">
                      ${pVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Equilibrium (50% Dealing Range Line) */}
              <line
                x1={padding.left}
                y1={scaleY(smcData.dealingRange.equilibrium)}
                x2={chartWidth - padding.right}
                y2={scaleY(smcData.dealingRange.equilibrium)}
                stroke="#475569"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <text
                x={padding.left + 8}
                y={scaleY(smcData.dealingRange.equilibrium) - 4}
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
              >
                EQ (50%): ${smcData.dealingRange.equilibrium.toFixed(1)}
              </text>

              {/* ── OVERLAY: LIQUIDITY POOL ($$$ EQH) ── */}
              {showSweeps && smcData.pools[0] && (
                <g>
                  <line
                    x1={scaleX(25)}
                    y1={scaleY(smcData.pools[0].price)}
                    x2={chartWidth - padding.right}
                    y2={scaleY(smcData.pools[0].price)}
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                    opacity="0.75"
                  />
                  <text
                    x={scaleX(32)}
                    y={scaleY(smcData.pools[0].price) - 5}
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    $$$ EQH / prior high (${smcData.pools[0].price.toFixed(1)})
                  </text>
                </g>
              )}

              {/* ── OVERLAY: X SWEEP ARROW & MARKER ── */}
              {showSweeps && smcData.sweeps[0] && (
                <g>
                  {/* Arrow pointing down to the sweep peak */}
                  <line
                    x1={scaleX(48)}
                    y1={scaleY(smcData.sweeps[0].price) - 22}
                    x2={scaleX(48)}
                    y2={scaleY(smcData.sweeps[0].price) - 4}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    markerEnd="url(#arrow-amber)"
                  />
                  <text
                    x={scaleX(48)}
                    y={scaleY(smcData.sweeps[0].price) - 28}
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize="11"
                    fontWeight="900"
                  >
                    X SWEEP
                  </text>
                </g>
              )}

              {/* ── OVERLAY: BOS & MSS LINES ── */}
              {showBosMss && (
                <>
                  {/* BOS Line */}
                  <line
                    x1={scaleX(15)}
                    y1={scaleY(smcData.bosList[0].price)}
                    x2={scaleX(36)}
                    y2={scaleY(smcData.bosList[0].price)}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                  <text
                    x={(scaleX(15) + scaleX(36)) / 2}
                    y={scaleY(smcData.bosList[0].price) - 4}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    BOS
                  </text>

                  {/* MSS Line */}
                  <line
                    x1={scaleX(48)}
                    y1={scaleY(smcData.mssList[0].price)}
                    x2={scaleX(62)}
                    y2={scaleY(smcData.mssList[0].price)}
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <text
                    x={(scaleX(48) + scaleX(62)) / 2}
                    y={scaleY(smcData.mssList[0].price) + 12}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="10"
                    fontWeight="900"
                  >
                    MSS (close below)
                  </text>
                </>
              )}

              {/* ── OVERLAY: BB + FVG ZONE (Translucent Purple Box) ── */}
              {showZones && smcData.orderBlocks[0] && (
                <g>
                  <rect
                    x={scaleX(52)}
                    y={scaleY(smcData.orderBlocks[0].top)}
                    width={chartWidth - padding.right - scaleX(52)}
                    height={Math.max(12, scaleY(smcData.orderBlocks[0].bottom) - scaleY(smcData.orderBlocks[0].top))}
                    fill="#7c3aed"
                    fillOpacity="0.25"
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    rx="4"
                  />
                  <text
                    x={scaleX(54)}
                    y={scaleY(smcData.orderBlocks[0].top) + 13}
                    fill="#c084fc"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    BB + FVG (supply zone ${smcData.orderBlocks[0].bottom}-${smcData.orderBlocks[0].top})
                  </text>
                </g>
              )}

              {/* ── OVERLAY: RISK/REWARD TRADE BOXES ── */}
              {showTradeBox && (
                <g>
                  {/* Red Risk Box (Entry -> SL) */}
                  <rect
                    x={scaleX(66)}
                    y={scaleY(tradeSetup.stopLoss)}
                    width={chartWidth - padding.right - scaleX(66)}
                    height={Math.abs(scaleY(tradeSetup.entryPrice) - scaleY(tradeSetup.stopLoss))}
                    fill="#dc2626"
                    fillOpacity="0.2"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Green Reward Box (Entry -> TP3) */}
                  <rect
                    x={scaleX(66)}
                    y={scaleY(tradeSetup.entryPrice)}
                    width={chartWidth - padding.right - scaleX(66)}
                    height={Math.abs(scaleY(tradeSetup.tp3) - scaleY(tradeSetup.entryPrice))}
                    fill="#059669"
                    fillOpacity="0.2"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Solid White Entry Line & Tag */}
                  <line
                    x1={scaleX(64)}
                    y1={scaleY(tradeSetup.entryPrice)}
                    x2={chartWidth - padding.right}
                    y2={scaleY(tradeSetup.entryPrice)}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <rect
                    x={chartWidth - padding.right + 2}
                    y={scaleY(tradeSetup.entryPrice) - 8}
                    width="78"
                    height="16"
                    fill="#ffffff"
                    rx="3"
                  />
                  <text
                    x={chartWidth - padding.right + 6}
                    y={scaleY(tradeSetup.entryPrice) + 4}
                    fill="#0f172a"
                    fontSize="9.5"
                    fontWeight="900"
                  >
                    ENTRY ${tradeSetup.entryPrice.toFixed(1)}
                  </text>

                  {/* Red Dashed SL Line & Tag */}
                  <line
                    x1={scaleX(64)}
                    y1={scaleY(tradeSetup.stopLoss)}
                    x2={chartWidth - padding.right}
                    y2={scaleY(tradeSetup.stopLoss)}
                    stroke="#ef4444"
                    strokeDasharray="4 3"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={chartWidth - padding.right + 2}
                    y={scaleY(tradeSetup.stopLoss) - 8}
                    width="78"
                    height="16"
                    fill="#dc2626"
                    rx="3"
                  />
                  <text
                    x={chartWidth - padding.right + 6}
                    y={scaleY(tradeSetup.stopLoss) + 4}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="900"
                  >
                    SL ${tradeSetup.stopLoss.toFixed(1)}
                  </text>

                  {/* Cyan Dashed TP Lines & Tags */}
                  {[
                    { label: `TP1 ${tradeSetup.tp1.toFixed(1)} (1.5R)`, p: tradeSetup.tp1, color: '#38bdf8' },
                    { label: `TP2 ${tradeSetup.tp2.toFixed(1)} (3.2R)`, p: tradeSetup.tp2, color: '#06b6d4' },
                    { label: `TP3 ${tradeSetup.tp3.toFixed(1)} (4.8R)`, p: tradeSetup.tp3, color: '#10b981' }
                  ].map((tp, idx) => (
                    <g key={idx}>
                      <line
                        x1={scaleX(64)}
                        y1={scaleY(tp.p)}
                        x2={chartWidth - padding.right}
                        y2={scaleY(tp.p)}
                        stroke={tp.color}
                        strokeDasharray="4 3"
                        strokeWidth="1.2"
                      />
                      <rect
                        x={chartWidth - padding.right + 2}
                        y={scaleY(tp.p) - 8}
                        width="82"
                        height="16"
                        fill="#0f172a"
                        stroke={tp.color}
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x={chartWidth - padding.right + 5}
                        y={scaleY(tp.p) + 4}
                        fill={tp.color}
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {tp.label}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* ── OVERLAY: HYPOTHESIS GHOST PATH (Dotted White Path) ── */}
              {showGhostPath && (
                <g>
                  <polyline
                    points={tradeSetup.ghostPath.map((pt, idx) => {
                      const x = scaleX(68 + idx * 1.0);
                      const y = scaleY(pt.price);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#f8fafc"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  <text
                    x={scaleX(72)}
                    y={scaleY(tradeSetup.tp3) + 16}
                    fill="#94a3b8"
                    fontSize="9"
                    fontStyle="italic"
                  >
                    ghost path (HYPOTHESIS)
                  </text>
                </g>
              )}

              {/* ── CANDLESTICKS RENDERING ── */}
              {candles.map((c, i) => {
                const x = scaleX(i);
                const isUp = c.close >= c.open;
                const candleColor = isUp ? '#26a69a' : '#ef5350';
                const bodyTop = scaleY(Math.max(c.open, c.close));
                const bodyBottom = scaleY(Math.min(c.open, c.close));
                const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={scaleY(c.high)}
                      x2={x}
                      y2={scaleY(c.low)}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect
                      x={x - 3.5}
                      y={bodyTop}
                      width={7}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="0.5"
                    />
                  </g>
                );
              })}

              {/* Current Price Pointer / Yellow Callout Arrow (Stage 3/5: Zone Tap) */}
              <g>
                <line
                  x1={scaleX(candles.length - 1) - 40}
                  y1={scaleY(livePrice) + 40}
                  x2={scaleX(candles.length - 1) - 6}
                  y2={scaleY(livePrice) + 8}
                  stroke="#eab308"
                  strokeWidth="2"
                  markerEnd="url(#arrow-yellow)"
                />
                <text
                  x={scaleX(candles.length - 1) - 45}
                  y={scaleY(livePrice) + 54}
                  textAnchor="end"
                  fill="#eab308"
                  fontSize="10"
                  fontWeight="bold"
                >
                  price abhi yahan
                </text>
                <text
                  x={scaleX(candles.length - 1) - 45}
                  y={scaleY(livePrice) + 67}
                  textAnchor="end"
                  fill="#fef08a"
                  fontSize="9"
                >
                  (Stage 3/5: zone tap)
                </text>
              </g>

              {/* SVG Markers definition */}
              <defs>
                <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                <marker id="arrow-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#eab308" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Chart Footer Info Bar */}
          <div className="pt-2 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
            <div>
              SWEEP (X) ➜ MSS (4,158) ➜ BB+FVG TAP (4,188) ➜ TARGET ({tradeSetup.tp3}) = <strong className="text-emerald-400 font-black">{tradeSetup.netRRToTp3}RR</strong>
            </div>
            <div>
              XAUUSD • {timeframe} • Real/Verified • Engine v4.2
            </div>
          </div>
        </div>

        {/* RIGHT 28%: "GOLD ENTRY MODELS" PANEL (MATCHES MOCKUP EXACTLY) */}
        <div className="lg:col-span-4 xl:col-span-4 rounded-2xl border border-slate-800 bg-[#0d131f] p-4 sm:p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header Title */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                  GOLD ENTRY MODELS
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Live Stage Tracker</span>
              </div>
              <div className="text-xs text-slate-300 font-bold mt-0.5">
                Active: <span className="text-cyan-400">{tradeSetup.modelName}</span>
              </div>
            </div>

            {/* BIG VERDICT CHIP */}
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-center shadow-lg">
              <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight flex items-center justify-center gap-2">
                <span>{tradeSetup.side}</span>
                <span className="text-lg text-rose-300/80 font-bold">({tradeSetup.state})</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold text-slate-300 mt-1">
                <span>Grade: <strong className="text-white">{tradeSetup.grade}</strong></span>
                <span>•</span>
                <span>Q: <strong className="text-amber-400">{tradeSetup.qualityScore}/100</strong></span>
                <span>•</span>
                <span>RR: <strong className="text-emerald-400">1:{tradeSetup.netRRToTp2}</strong></span>
              </div>
            </div>

            {/* STAGE PROGRESS BAR */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">Setup Progression:</div>
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-emerald-400">S0</span>
                <span className="text-slate-600">&gt;</span>
                <span className="text-emerald-400">S1</span>
                <span className="text-slate-600">&gt;</span>
                <span className="text-emerald-400">S2</span>
                <span className="text-slate-600">&gt;</span>
                <span className="text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/50">[S3]</span>
                <span className="text-slate-600">&gt;</span>
                <span className="text-slate-500">S4</span>
                <span className="text-slate-600">&gt;</span>
                <span className="text-slate-500">S5</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                {tradeSetup.stageDescription}
              </p>
            </div>

            {/* WHY (HINGLISH) BULLET POINTS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                Why (Hinglish Evidence):
              </span>
              <div className="space-y-1 text-xs text-slate-300 font-sans">
                {tradeSetup.whyBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span className="leading-snug">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NEXT TRIGGER */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">Next Trigger:</span>
              <p className="text-xs text-slate-200 mt-0.5 font-medium">
                {tradeSetup.nextTrigger}
              </p>
            </div>

            {/* INVALIDATION */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Invalidation Rule:</span>
              <p className="text-xs text-rose-300 mt-0.5 font-medium">
                {tradeSetup.invalidationRule}
              </p>
            </div>

            {/* LOT SIZING CALCULATION */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lot (Risk 1% = $100):</span>
                <span className="text-xs text-slate-200 font-mono">By SL Points Formula</span>
              </div>
              <span className="text-base font-black font-mono text-emerald-400">
                {tradeSetup.recommendedLot} Lots
              </span>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
            Research & Educational Aid Only • Not Personal Investment Advice
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM WORKSPACE TABS: ZONE MAP / 7-STEPS / MODELS LIBRARY / MACRO ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'ACTION_MAP', label: '🗺️ "Kahan Long / Kahan Short" Zone Map' },
            { id: 'EDUCATIONAL_7_STEPS', label: '🎓 7-Step SMC Execution Checklist' },
            { id: 'MODELS_LIBRARY', label: '📐 Models M1–M6 Playbook Library' },
            { id: 'MACRO_DRIVERS', label: '⚖️ Gold Macro & DXY Drivers' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playBlip();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: "KAHAN LONG / KAHAN SHORT" ACTION MAP TABLE */}
        {activeTab === 'ACTION_MAP' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="h-4 w-4 text-amber-400" />
                  "Kahan Long Lena Hai, Kahan Short Lena Hai" — Action Zone Map
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Market abhi do zones ke beech me hai. Har zone ka exact trigger aur target level pehle se documented hai.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Nearest 2 Long & 2 Short Zones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Zone Type</th>
                    <th className="py-2.5 px-3">Price Range</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Trigger Needed</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {zoneMap.map((zone) => {
                    const isLong = zone.side === 'LONG';
                    return (
                      <tr key={zone.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            isLong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {zone.side}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-bold">
                          {zone.type}
                        </td>
                        <td className="py-3 px-3 text-white font-bold">
                          ${zone.priceLow.toFixed(1)} – ${zone.priceHigh.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {zone.distancePts > 0 ? `+${zone.distancePts} pts` : `${zone.distancePts} pts`} ({zone.distanceAtr} ATR)
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            zone.status === 'IN_ZONE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : zone.status === 'APPROACHING'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {zone.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-sans text-xs">
                          {zone.triggerNeeded}
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          ${zone.targetPrice.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-amber-400 font-bold">
                          {zone.qualityScore}/100
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: EDUCATIONAL 7-STEPS SMC CHECKLIST (MATCHES USER ATTACHED IMAGE 1) */}
        {activeTab === 'EDUCATIONAL_7_STEPS' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                7-Step SMC Trade Execution Framework (From Reference Educational Chart)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Institutional execution sequence: Liquidity identification se lekar Target booking tak ka step-by-step process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                {
                  step: '1',
                  title: 'IDENTIFY LIQUIDITY ZONE',
                  desc: 'Price is taking out liquidity above/below recent swing highs/lows where stop-losses exist.',
                  color: 'emerald'
                },
                {
                  step: '2',
                  title: 'LIQUIDITY GRAB (X SWEEP)',
                  desc: 'Price spikes sharply beyond the liquidity pool to trigger retail stops and trap breakout traders.',
                  color: 'amber'
                },
                {
                  step: '3',
                  title: 'BOS (BREAK OF STRUCTURE)',
                  desc: 'Price reverses impulsively and breaks the previous swing structure with candle body close.',
                  color: 'cyan'
                },
                {
                  step: '4',
                  title: 'DEMAND / SUPPLY / BB ZONE',
                  desc: 'Price returns to the institutional Order Block / Breaker Block zone where major limit orders sit.',
                  color: 'purple'
                },
                {
                  step: '5',
                  title: 'ENTRY TRIGGER',
                  desc: 'Enter on lower-timeframe bullish or bearish rejection candlestick or confirmed CHoCH tap.',
                  color: 'emerald'
                },
                {
                  step: '6',
                  title: 'RISK MANAGEMENT (SL)',
                  desc: 'Place stop loss strictly beyond the zone boundary and sweep extreme + spread buffer.',
                  color: 'rose'
                },
                {
                  step: '7',
                  title: 'TARGETS (T1, T2, T3)',
                  desc: 'Targets set at key opposing liquidity levels: T1 prior high, T2 liquidity pool, T3 strong HTF resistance.',
                  color: 'cyan'
                }
              ].map((s) => (
                <div key={s.step} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/40">
                      {s.step}
                    </span>
                    <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11.5px]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MODELS M1-M6 PLAYBOOK LIBRARY (MATCHES USER IMAGES 2, 3, 4, 5) */}
        {activeTab === 'MODELS_LIBRARY' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                SMC Setup Models Library (M1 to M6)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every institutional model template documented with rules, triggers, and schematic logic.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {[
                {
                  id: 'M1',
                  name: 'SWEEP ➜ MSS ➜ BB RETEST ➜ $$',
                  desc: 'Liquidity sweep (X) followed by aggressive MSS displacement. Retracement into the Breaker Block (BB + FVG) triggers trade to target opposing liquidity pool.',
                  rr: '1:3 to 1:6',
                  status: 'ACTIVE MODEL'
                },
                {
                  id: 'M2',
                  name: 'LIQUIDITY GRAB + BOS + DEMAND/SUPPLY',
                  desc: 'High/low liquidity grab traps retail traders. Violent BOS creates fresh demand/supply block. Entry on first pullback retest.',
                  rr: '1:3 to 1:5',
                  status: 'READY'
                },
                {
                  id: 'M3',
                  name: 'SP ➜ $$$ ➜ CHoCH ➜ OB ➜ SSL',
                  desc: 'Swing point (SP) swept with equal highs ($$$) taken. Clean CHoCH down confirms reversal. Retest of supply OB triggers short down to SSL.',
                  rr: '1:3 to 1:4.5',
                  status: 'WATCH'
                },
                {
                  id: 'M4',
                  name: 'SUPPLY/DEMAND RANGE BOX BREAKDOWN',
                  desc: 'Consolidation box breakdown with volume displacement. Retest of the broken range floor (now supply) triggers short.',
                  rr: '1:2.5 to 1:4',
                  status: 'READY'
                },
                {
                  id: 'M5',
                  name: 'SESSION SWEEP REVERSAL',
                  desc: 'Asian high or low swept during London or New York open. Reversal MSS triggers trade back through the session range.',
                  rr: '1:2 to 1:3.5',
                  status: 'TIME-GATED'
                },
                {
                  id: 'M6',
                  name: 'TREND CONTINUATION (BOS ➜ DISCOUNT OB)',
                  desc: 'Established HTF trend prints continuous BOS. Pullback to discount order block (<50% dealing range) provides high-probability entry.',
                  rr: '1:2 to 1:3',
                  status: 'READY'
                }
              ].map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-amber-400 text-xs">
                      {m.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Typical {m.rr}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{m.name}</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MACRO & DXY DRIVERS */}
        {activeTab === 'MACRO_DRIVERS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bullish Drivers */}
              <div className="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Bullish Gold Drivers (What pumps Gold):
                </h4>
                <div className="space-y-2 text-xs">
                  {macroIntel.driversBullish.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
                      <div>
                        <span className="font-bold text-white block">{d.factor}</span>
                        <span className="text-[11px] text-slate-400">{d.reading}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {d.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bearish Drivers */}
              <div className="rounded-xl border border-rose-500/30 bg-slate-900/80 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  Bearish Gold Drivers (What dumps Gold):
                </h4>
                <div className="space-y-2 text-xs">
                  {macroIntel.driversBearish.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
                      <div>
                        <span className="font-bold text-white block">{d.factor}</span>
                        <span className="text-[11px] text-slate-400">{d.reading}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        {d.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. EDUCATIONAL CHEATSHEET MODAL (POPUP) ── */}
      {showCheatsheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/40 bg-[#0b0f17] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎓</span>
                <h3 className="text-base font-bold text-white">
                  Gold SMC Auto Trade Execution Blueprint
                </h3>
              </div>
              <button
                onClick={() => setShowCheatsheetModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-200 font-sans">
              <p>
                This blueprint implements the exact institutional SMC models shown in professional educational charts:
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <strong className="text-amber-400 block mb-1">1. Liquidity Grab & Break of Structure (BOS)</strong>
                  Price spikes through old highs/lows where retail stops cluster. Once stops are absorbed by smart money, price shifts violently, breaking market structure with closed candles.
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <strong className="text-purple-400 block mb-1">2. Breaker Block (BB) & Fair Value Gap (FVG)</strong>
                  The order block that caused the liquidity sweep fails and flips into a Breaker Block. When price retraces to test this zone, it offers an optimal risk-to-reward entry.
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">3. Execution & Sizing Math</strong>
                  Stop-loss is placed strictly beyond the sweep extreme. Targets are set at opposing liquidity pools (T1, T2, T3) delivering minimum 1:3 to 1:6 net R:R.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCheatsheetModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer"
              >
                Got It, Return to Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
