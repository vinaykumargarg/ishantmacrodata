import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield, Award, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Clock, Compass, Zap, CheckCircle2, ChevronRight,
  Info, Eye, Play, BookOpen, Volume2, VolumeX, RefreshCw,
  Crosshair, Maximize2, Minimize2, Sliders, ArrowUpRight, ArrowDownRight,
  FileText, Check, HelpCircle, Move, ZoomIn, ZoomOut, RotateCcw,
  Sparkles, Filter, Lock, Target, Brain, Calendar, BarChart3, Globe,
  ArrowRight, Radio, Landmark, DollarSign, Database
} from 'lucide-react';
import {
  TimeframeOption,
  EngineMode,
  GoldCandle,
  DetectedSMC,
  MTFAnalysis,
  TradeAuthorizationReport,
  ExactTradePlan,
  KeyLevels,
  SessionInfo,
  FundamentalEvent,
  DxyCorrelation,
  CotPositioning,
  WhyGoldMoving,
  ZoneMapItem,
  fetchLiveGoldQuote,
  generateGoldCandles,
  detectSMCStructure,
  evaluateMultiTimeframeAuthorization,
  calculateExactTradePlan,
  calculateKeyLevels,
  getSessionIntelligence,
  getFundamentalCalendar,
  getDxyCorrelation,
  getCotPositioning,
  getWhyGoldMoving,
  buildZoneMap
} from '../services/goldSmcAutoEngine';
import { soundEffects } from '../services/soundEffectsService';

export default function GoldSmcAutoTradeLabView() {
  // Navigation & Timeframe
  const [timeframe, setTimeframe] = useState<TimeframeOption>('15m');
  const [engineMode, setEngineMode] = useState<EngineMode>('LIVE_SCANNER');
  const [setupSide, setSetupSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [activeSubTab, setActiveSubTab] = useState<'TRADE_CARD' | 'MTF_AUTHORIZATION' | 'FUNDAMENTALS' | 'DXY_CORRELATION' | 'COT_POSITIONING' | 'WHY_MOVING'>('TRADE_CARD');

  // Live Telemetry
  const [livePrice, setLivePrice] = useState<number>(2748.68);
  const [change24h, setChange24h] = useState<number>(1.53);
  const [high24h, setHigh24h] = useState<number>(2764.20);
  const [low24h, setLow24h] = useState<number>(2728.40);
  const [spread, setSpread] = useState<number>(0.25);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Interactive Chart Pan & Zoom
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showSubIndicators, setShowSubIndicators] = useState<boolean>(true);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number; candle?: GoldCandle } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Audio Assistant
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Fetch live price loop
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
        console.warn('Gold quote error:', err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 3500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute Core SMC, MTF, and Trade Data
  const candles = useMemo(() => {
    return generateGoldCandles(timeframe, livePrice, engineMode, setupSide, 85);
  }, [timeframe, livePrice, engineMode, setupSide]);

  const smcData: DetectedSMC = useMemo(() => {
    return detectSMCStructure(candles, timeframe, livePrice, setupSide);
  }, [candles, timeframe, livePrice, setupSide]);

  const { mtf, authorization } = useMemo(() => {
    return evaluateMultiTimeframeAuthorization(livePrice, smcData);
  }, [livePrice, smcData]);

  const tradePlan: ExactTradePlan = useMemo(() => {
    return calculateExactTradePlan(livePrice, smcData, authorization);
  }, [livePrice, smcData, authorization]);

  const keyLevels: KeyLevels = useMemo(() => {
    return calculateKeyLevels(livePrice);
  }, [livePrice]);

  const sessionInfo: SessionInfo = useMemo(() => {
    return getSessionIntelligence();
  }, []);

  const fundamentals: FundamentalEvent[] = useMemo(() => {
    return getFundamentalCalendar();
  }, []);

  const dxyData: DxyCorrelation = useMemo(() => {
    return getDxyCorrelation();
  }, []);

  const cotData: CotPositioning = useMemo(() => {
    return getCotPositioning();
  }, []);

  const whyMoving: WhyGoldMoving = useMemo(() => {
    return getWhyGoldMoving();
  }, []);

  const zoneMap: ZoneMapItem[] = useMemo(() => {
    return buildZoneMap(candles, smcData, livePrice, engineMode);
  }, [candles, smcData, livePrice, engineMode]);

  // Chart Layout Dimensions
  const chartWidth = 980;
  const chartHeight = showSubIndicators ? 580 : 440;
  const padding = { top: 35, bottom: 40, left: 20, right: 95 };

  // Price & Indicator Height Partitions
  const candleAreaH = showSubIndicators ? 360 : 365;
  const volumeAreaTop = 385;
  const volumeAreaH = 65;
  const rsiAreaTop = 465;
  const rsiAreaH = 65;

  const { minP, maxP, scaleX, scaleY, invScaleY } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    // Pad scale for targets and stop loss
    min = Math.min(min, tradePlan.stopLoss - 4.0);
    max = Math.max(max, tradePlan.tp2 + 4.0);

    const pRange = max - min || 1;
    const usableW = chartWidth - padding.left - padding.right;
    const usableH = candleAreaH - padding.top;

    const sX = (i: number) => padding.left + (i / (candles.length - 1)) * usableW;
    const sY = (price: number) => padding.top + (1 - (price - min) / pRange) * usableH;
    const invY = (yVal: number) => max - ((yVal - padding.top) / usableH) * pRange;

    return { minP: min, maxP: max, scaleX: sX, scaleY: sY, invScaleY: invY };
  }, [candles, tradePlan, candleAreaH, chartWidth]);

  // Dynamic ViewBox for Panning & Zooming
  const dynamicViewBox = useMemo(() => {
    const w = chartWidth / zoomLevel;
    const h = chartHeight / zoomLevel;
    const cx = chartWidth / 2;
    const cy = chartHeight / 2;
    const vx = cx - w / 2 - panOffset.x;
    const vy = cy - h / 2 - panOffset.y;
    return `${vx} ${vy} ${w} ${h}`;
  }, [chartWidth, chartHeight, zoomLevel, panOffset]);

  // Mouse drag handlers for chart pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const dx = (e.clientX - dragStartRef.current.x) / zoomLevel;
      const dy = (e.clientY - dragStartRef.current.y) / zoomLevel;
      setPanOffset({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy
      });
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const svgX = (clientX / rect.width) * (chartWidth / zoomLevel) + (chartWidth / 2 - (chartWidth / zoomLevel) / 2 - panOffset.x);
      const svgY = (clientY / rect.height) * (chartHeight / zoomLevel) + (chartHeight / 2 - (chartHeight / zoomLevel) / 2 - panOffset.y);
      const priceAtY = invScaleY(svgY);

      // Find nearest candle
      const usableW = chartWidth - padding.left - padding.right;
      const candleIndex = Math.min(candles.length - 1, Math.max(0, Math.round(((svgX - padding.left) / usableW) * (candles.length - 1))));

      setCrosshair({
        x: svgX,
        y: svgY,
        price: +priceAtY.toFixed(1),
        candle: candles[candleIndex]
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setCrosshair(null);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoomLevel((prev) => {
      const next = prev * factor;
      return Math.min(3.5, Math.max(0.6, +next.toFixed(2)));
    });
  };

  const handleResetView = () => {
    soundEffects.playBlip();
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Audio briefing
  const handleToggleVoice = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) return;
    const text = `Gold AI Institutional Command Centre briefing. Gold Spot is trading at ${livePrice}. Trend is Bullish with 87 percent confidence. Daily, 4H, and 1H timeframes are in full Bullish alignment authorizing Long only. Liquidity sweep confirmed. Optimal entry zone between ${tradePlan.entryZoneMin} and ${tradePlan.entryZoneMax}. Target 1 at ${tradePlan.tp1}, Target 2 at ${tradePlan.tp2}, Stop loss at ${tradePlan.stopLoss}. Reward to risk ratio is 1 to ${tradePlan.rrrTp2}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`space-y-4 font-sans text-slate-100 ${isMaximized ? 'fixed inset-0 z-50 bg-[#060a12] p-4 overflow-y-auto' : ''}`}>
      {/* ── TOP INSTITUTIONAL COMMAND HEADER ── */}
      <div className="rounded-2xl border border-amber-500/30 bg-[#080d18] p-3.5 sm:p-4 shadow-2xl relative overflow-hidden font-mono">
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Bar: Symbol, Live Price, 24h Change, Timeframe Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-600 text-slate-950 font-black text-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  XAUUSD
                </span>
                <span className="text-xs text-slate-400 font-bold">Gold Spot / U.S. Dollar</span>
                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  INSTITUTIONAL AI TERMINAL
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xl font-black text-emerald-400">
                  ${livePrice.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center">
                  +{((livePrice * change24h) / 100).toFixed(2)} (+{change24h.toFixed(2)}%)
                </span>
                <span className="text-xs text-slate-400">
                  Spr: <strong className="text-white">${spread.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Selector Strip matching screenshot */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 text-xs">
              {(['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'] as TimeframeOption[]).map((tf) => (
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
                  {tf === '1m' ? 'M1' : tf === '5m' ? 'M5' : tf === '15m' ? 'M15' : tf === '30m' ? 'M30' : tf === '1H' ? 'H1' : tf === '4H' ? 'H4' : tf === '1D' ? 'D1' : 'W1'}
                </button>
              ))}
            </div>

            {/* Voice Briefing & Indicators Toggle */}
            <button
              onClick={handleToggleVoice}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isSpeaking
                  ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{isSpeaking ? 'Stop Audio' : 'AI Voice Brief'}</span>
            </button>

            <button
              onClick={() => setShowSubIndicators(!showSubIndicators)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
              <span>{showSubIndicators ? 'Hide Vol/RSI' : 'Show Vol/RSI'}</span>
            </button>
          </div>
        </div>

        {/* 2. Secondary Telemetry Ribbon matching screenshot */}
        <div className="pt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-400">SMART MONEY CONCEPTS (SMC) ANALYSIS</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1">
              <span className="text-slate-400 uppercase text-[11px]">TREND:</span>
              <span className="text-emerald-400 font-bold">BULLISH ↑</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 uppercase text-[11px]">STRUCTURE:</span>
              <span className="text-emerald-400 font-bold">BULLISH ↑</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 uppercase text-[11px]">MARKET STATE:</span>
              <span className="text-cyan-400 font-bold">EXPANSION</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 uppercase text-[11px]">LIQUIDITY:</span>
              <span className="text-amber-400 font-bold">HIGH</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 uppercase text-[11px]">VOLATILITY:</span>
              <span className="text-purple-400 font-bold">MODERATE</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: CHART (70%) + RIGHT AI ANALYSIS (30%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 70%: MAIN CANDLESTICK + VOLUME + RSI CHART */}
        <div className="lg:col-span-8 xl:col-span-8 rounded-2xl border border-slate-800 bg-[#080d18] p-3 sm:p-4 shadow-2xl relative flex flex-col font-mono">
          {/* Chart Header Bar matching screenshot */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">XAUUSD • {timeframe.toUpperCase()} • OANDA / LIVE</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">
                O: ${candles[candles.length - 1]?.open.toFixed(2)}  H: ${candles[candles.length - 1]?.high.toFixed(2)}  L: ${candles[candles.length - 1]?.low.toFixed(2)}  C: ${candles[candles.length - 1]?.close.toFixed(2)}
              </span>
            </div>

            {/* Panning & Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                <Move className="h-3 w-3" />
                <span>Drag to Move</span>
              </div>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3.5, +(z * 1.2).toFixed(2)))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, +(z / 1.2).toFixed(2)))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title={isMaximized ? 'Minimize' : 'Maximize Fullscreen'}
              >
                {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div
            className={`relative w-full overflow-hidden select-none mt-2 rounded-xl border border-slate-800/80 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ minHeight: isMaximized ? '75vh' : `${chartHeight}px` }}
          >
            {/* Live Indicator HUD */}
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-400 pointer-events-none">
              <span className="text-amber-400 font-bold">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                {tradePlan.direction} {tradePlan.status}
              </span>
              {crosshair && (
                <>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">Cursor: ${crosshair.price}</span>
                </>
              )}
            </div>

            <svg
              ref={svgRef}
              viewBox={dynamicViewBox}
              className="w-full h-full text-xs font-mono"
              style={{ background: '#080d18', minHeight: isMaximized ? '75vh' : `${chartHeight}px` }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
            >
              {/* Subtle Grid Lines & Price Ticks */}
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((pct, idx) => {
                const y = padding.top + pct * (candleAreaH - padding.top);
                const pVal = maxP - pct * (maxP - minP);
                return (
                  <g key={idx}>
                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#172033" strokeDasharray="3 3" opacity="0.6" />
                    <text x={chartWidth - padding.right + 8} y={y + 4} fill="#64748b" fontSize="10">
                      ${pVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* 50% Equilibrium Line */}
              <line
                x1={padding.left}
                y1={scaleY(smcData.dealingRange.equilibrium)}
                x2={chartWidth - padding.right}
                y2={scaleY(smcData.dealingRange.equilibrium)}
                stroke="#334155"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <text
                x={padding.left + 8}
                y={scaleY(smcData.dealingRange.equilibrium) - 4}
                fill="#64748b"
                fontSize="9"
              >
                EQ 50%: ${smcData.dealingRange.equilibrium.toFixed(1)}
              </text>

              {/* ── ANNOTATIONS: PREVIOUS SWING HIGH ── */}
              <line
                x1={scaleX(12)}
                y1={scaleY(candles[12]?.high || maxP - 15)}
                x2={scaleX(36)}
                y2={scaleY(candles[12]?.high || maxP - 15)}
                stroke="#64748b"
                strokeDasharray="4 2"
                strokeWidth="1.2"
              />
              <text
                x={scaleX(14)}
                y={scaleY(candles[12]?.high || maxP - 15) - 5}
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
              >
                PREVIOUS SWING HIGH
              </text>

              {/* ── ANNOTATIONS: SWINGS (HH, HL, LH, LL) ── */}
              {smcData.swings.map((sw) => {
                const candleIdx = candles.findIndex((c) => Math.abs(c.time - sw.time) < 1800);
                if (candleIdx < 0) return null;
                const x = scaleX(candleIdx);
                const isHigh = sw.type === 'HH' || sw.type === 'LH';
                const y = scaleY(sw.price);

                return (
                  <g key={sw.id}>
                    <circle cx={x} cy={y} r="2" fill={isHigh ? '#38bdf8' : '#eab308'} />
                    <text
                      x={x}
                      y={isHigh ? y - 8 : y + 14}
                      textAnchor="middle"
                      fill={isHigh ? '#7dd3fc' : '#fde047'}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {sw.type}
                    </text>
                  </g>
                );
              })}

              {/* ── ANNOTATIONS: BOS & CHOCH LINES ── */}
              {smcData.bosList.map((bos) => (
                <g key={bos.id}>
                  <line
                    x1={scaleX(18)}
                    y1={scaleY(bos.price)}
                    x2={scaleX(52)}
                    y2={scaleY(bos.price)}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                  <text
                    x={scaleX(35)}
                    y={scaleY(bos.price) - 4}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    BOS
                  </text>
                </g>
              ))}

              {smcData.mssList.map((choch) => (
                <g key={choch.id}>
                  <line
                    x1={scaleX(32)}
                    y1={scaleY(choch.price)}
                    x2={scaleX(48)}
                    y2={scaleY(choch.price)}
                    stroke="#eab308"
                    strokeWidth="1.5"
                  />
                  <text
                    x={scaleX(40)}
                    y={scaleY(choch.price) - 5}
                    textAnchor="middle"
                    fill="#fde047"
                    fontSize="9.5"
                    fontWeight="900"
                  >
                    CHoCH
                  </text>
                </g>
              ))}

              {/* ── ANNOTATIONS: LIQUIDITY SWEEP (STOP HUNT) ── */}
              {smcData.sweeps[0] && (
                <g>
                  {/* Arrow pointing up to the sweep low */}
                  <line
                    x1={scaleX(32)}
                    y1={scaleY(smcData.sweeps[0].price) + 24}
                    x2={scaleX(32)}
                    y2={scaleY(smcData.sweeps[0].price) + 4}
                    stroke="#ef4444"
                    strokeWidth="2"
                    markerEnd="url(#arrow-red-up)"
                  />
                  <text
                    x={scaleX(32)}
                    y={scaleY(smcData.sweeps[0].price) + 36}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="9.5"
                    fontWeight="900"
                  >
                    LIQUIDITY SWEEP (STOP HUNT)
                  </text>
                </g>
              )}

              {/* ── ANNOTATIONS: FVG (H1) OPTIMAL ENTRY ZONE ── */}
              {smcData.fvgs[0] && (
                <g>
                  <rect
                    x={scaleX(48)}
                    y={scaleY(smcData.fvgs[0].top)}
                    width={chartWidth - padding.right - scaleX(48)}
                    height={Math.max(16, scaleY(smcData.fvgs[0].bottom) - scaleY(smcData.fvgs[0].top))}
                    fill="#0284c7"
                    fillOpacity="0.22"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                    rx="4"
                  />
                  <text
                    x={scaleX(50)}
                    y={scaleY(smcData.fvgs[0].top) + 12}
                    fill="#7dd3fc"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    FVG (H1) Optimal Entry Zone (${smcData.fvgs[0].bottom} - ${smcData.fvgs[0].top})
                  </text>
                </g>
              )}

              {/* ── ANNOTATIONS: TRADE PLAN (ENTRY, SL, TP1, TP2) ── */}
              {tradePlan.status !== 'WAIT' && (
                <g>
                  {/* Green Reward Zone */}
                  <rect
                    x={scaleX(64)}
                    y={scaleY(tradePlan.tp2)}
                    width={chartWidth - padding.right - scaleX(64)}
                    height={Math.abs(scaleY(tradePlan.tp2) - scaleY(tradePlan.entryPrice))}
                    fill="#059669"
                    fillOpacity="0.18"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Red Risk Zone */}
                  <rect
                    x={scaleX(64)}
                    y={scaleY(tradePlan.entryPrice)}
                    width={chartWidth - padding.right - scaleX(64)}
                    height={Math.abs(scaleY(tradePlan.stopLoss) - scaleY(tradePlan.entryPrice))}
                    fill="#dc2626"
                    fillOpacity="0.18"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Solid Green Entry Line & Axis Tag */}
                  <line
                    x1={scaleX(62)}
                    y1={scaleY(tradePlan.entryPrice)}
                    x2={chartWidth - padding.right}
                    y2={scaleY(tradePlan.entryPrice)}
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <rect
                    x={chartWidth - padding.right + 2}
                    y={scaleY(tradePlan.entryPrice) - 8}
                    width="84"
                    height="17"
                    fill="#059669"
                    rx="3"
                  />
                  <text
                    x={chartWidth - padding.right + 6}
                    y={scaleY(tradePlan.entryPrice) + 4}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="900"
                  >
                    ENTRY ${tradePlan.entryPrice.toFixed(2)}
                  </text>

                  {/* Red Dashed SL Line & Axis Tag */}
                  <line
                    x1={scaleX(62)}
                    y1={scaleY(tradePlan.stopLoss)}
                    x2={chartWidth - padding.right}
                    y2={scaleY(tradePlan.stopLoss)}
                    stroke="#ef4444"
                    strokeDasharray="4 3"
                    strokeWidth="1.8"
                  />
                  <rect
                    x={chartWidth - padding.right + 2}
                    y={scaleY(tradePlan.stopLoss) - 8}
                    width="84"
                    height="17"
                    fill="#dc2626"
                    rx="3"
                  />
                  <text
                    x={chartWidth - padding.right + 6}
                    y={scaleY(tradePlan.stopLoss) + 4}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="900"
                  >
                    SL ${tradePlan.stopLoss.toFixed(2)}
                  </text>

                  {/* Take Profit 1 & 2 Lines & Tags */}
                  {[
                    { label: `TP1 $${tradePlan.tp1.toFixed(2)} (2.1R)`, p: tradePlan.tp1, color: '#38bdf8' },
                    { label: `TP2 $${tradePlan.tp2.toFixed(2)} (3.4R)`, p: tradePlan.tp2, color: '#10b981' }
                  ].map((tp, idx) => (
                    <g key={idx}>
                      <line
                        x1={scaleX(62)}
                        y1={scaleY(tp.p)}
                        x2={chartWidth - padding.right}
                        y2={scaleY(tp.p)}
                        stroke={tp.color}
                        strokeDasharray="4 3"
                        strokeWidth="1.5"
                      />
                      <rect
                        x={chartWidth - padding.right + 2}
                        y={scaleY(tp.p) - 8}
                        width="88"
                        height="17"
                        fill="#0f172a"
                        stroke={tp.color}
                        strokeWidth="1.2"
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

                  {/* Dotted hypothetical scenario path into TP2 */}
                  {tradePlan.projectedPath.length > 0 && (
                    <polyline
                      points={tradePlan.projectedPath.map((pt, idx) => {
                        const x = scaleX(64 + idx * 2.8);
                        const y = scaleY(pt.price);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      strokeWidth="1.8"
                      opacity="0.85"
                    />
                  )}
                </g>
              )}

              {/* ── CANDLESTICKS RENDERING ── */}
              {candles.map((c, i) => {
                const x = scaleX(i);
                const isUp = c.close >= c.open;
                const candleColor = isUp ? '#26a69a' : '#ef5350';
                const bodyTop = scaleY(Math.max(c.open, c.close));
                const bodyBottom = scaleY(Math.min(c.open, c.close));
                const bodyHeight = Math.max(1.8, bodyBottom - bodyTop);

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
                    {/* Candle Body */}
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

              {/* ── SUB-INDICATOR 1: VOLUME BARS ── */}
              {showSubIndicators && (
                <g>
                  {/* Volume Separator Line */}
                  <line x1={padding.left} y1={volumeAreaTop} x2={chartWidth - padding.right} y2={volumeAreaTop} stroke="#1e293b" />
                  <text x={padding.left + 6} y={volumeAreaTop + 14} fill="#64748b" fontSize="9" fontWeight="bold">
                    VOLUME: 12.45K
                  </text>

                  {candles.map((c, i) => {
                    const x = scaleX(i);
                    const isUp = c.close >= c.open;
                    const vH = Math.min(volumeAreaH - 18, (c.volume / 3000) * (volumeAreaH - 18));
                    return (
                      <rect
                        key={`vol-${i}`}
                        x={x - 2.5}
                        y={volumeAreaTop + volumeAreaH - vH}
                        width={5}
                        height={vH}
                        fill={isUp ? '#26a69a' : '#ef5350'}
                        opacity="0.75"
                      />
                    );
                  })}
                </g>
              )}

              {/* ── SUB-INDICATOR 2: RSI (14) ── */}
              {showSubIndicators && (
                <g>
                  {/* RSI Separator Line */}
                  <line x1={padding.left} y1={rsiAreaTop} x2={chartWidth - padding.right} y2={rsiAreaTop} stroke="#1e293b" />
                  <text x={padding.left + 6} y={rsiAreaTop + 14} fill="#64748b" fontSize="9" fontWeight="bold">
                    RSI (14): 64.21
                  </text>

                  {/* 70 & 30 bands */}
                  <line x1={padding.left} y1={rsiAreaTop + 18} x2={chartWidth - padding.right} y2={rsiAreaTop + 18} stroke="#334155" strokeDasharray="2 2" />
                  <line x1={padding.left} y1={rsiAreaTop + 48} x2={chartWidth - padding.right} y2={rsiAreaTop + 48} stroke="#334155" strokeDasharray="2 2" />

                  {/* RSI Polyline */}
                  <polyline
                    points={candles.map((c, i) => {
                      const x = scaleX(i);
                      const rsiVal = c.rsi || 50;
                      const y = rsiAreaTop + rsiAreaH - ((rsiVal - 20) / 60) * (rsiAreaH - 18);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Crosshair Overlay */}
              {crosshair && (
                <g pointerEvents="none">
                  <line x1={crosshair.x} y1={padding.top} x2={crosshair.x} y2={chartHeight - padding.bottom} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" opacity="0.8" />
                  <line x1={padding.left} y1={crosshair.y} x2={chartWidth - padding.right} y2={crosshair.y} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" opacity="0.8" />
                  <rect x={chartWidth - padding.right + 2} y={crosshair.y - 9} width="65" height="18" fill="#0284c7" rx="3" />
                  <text x={chartWidth - padding.right + 6} y={crosshair.y + 4} fill="#ffffff" fontSize="10" fontWeight="900">
                    ${crosshair.price}
                  </text>
                </g>
              )}

              {/* SVG Markers */}
              <defs>
                <marker id="arrow-red-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* ── BOTTOM ROW UNDER CHART: MTF ANALYSIS + KEY LEVELS + SESSION INFO ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
            {/* 1. Multi-Timeframe Analysis with Mini Sparklines (5 cols) */}
            <div className="md:col-span-5 rounded-xl border border-slate-800 bg-[#060a14] p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                MULTI-TIMEFRAME ANALYSIS
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                {mtf.map((m) => (
                  <div key={m.timeframe} className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">{m.timeframe}</span>
                    <span className="text-emerald-400 font-black text-xs block">{m.trend} ↑</span>
                    {/* Mini SVG Sparkline */}
                    <svg viewBox="0 0 50 16" className="w-full h-4">
                      <polyline
                        points={m.sparkline.map((val, idx) => {
                          const min = Math.min(...m.sparkline);
                          const max = Math.max(...m.sparkline);
                          const x = (idx / (m.sparkline.length - 1)) * 48 + 1;
                          const y = 15 - ((val - min) / (max - min || 1)) * 14;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Key Levels (4 cols) */}
            <div className="md:col-span-4 rounded-xl border border-slate-800 bg-[#060a14] p-3 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                KEY LEVELS
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">RESISTANCE 2:</span><strong className="text-rose-400">${keyLevels.resistance2.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">RESISTANCE 1:</span><strong className="text-rose-300">${keyLevels.resistance1.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">CURRENT PRICE:</span><strong className="text-emerald-400 font-black">${livePrice.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">SUPPORT 1:</span><strong className="text-emerald-300">${keyLevels.support1.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">SUPPORT 2:</span><strong className="text-emerald-400">${keyLevels.support2.toFixed(2)}</strong></div>
              </div>
            </div>

            {/* 3. Session Info (3 cols) */}
            <div className="md:col-span-3 rounded-xl border border-slate-800 bg-[#060a14] p-3 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                SESSION INFO
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">SESSION:</span><strong className="text-amber-400 font-bold">{sessionInfo.session}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">STATUS:</span><span className="text-emerald-400 font-bold">ACTIVE ●</span></div>
                <div className="flex justify-between"><span className="text-slate-400">TIME LEFT:</span><strong className="text-white">{sessionInfo.timeLeft}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">SPREAD:</span><strong className="text-white">${sessionInfo.spread.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">VOLATILITY:</span><span className="text-purple-400 font-bold">{sessionInfo.volatility}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 30%: PROFESSIONAL AI TRADE ANALYSIS PANEL */}
        <div className="lg:col-span-4 xl:col-span-4 rounded-2xl border border-slate-800 bg-[#080d18] p-4 sm:p-5 shadow-2xl relative flex flex-col justify-between font-mono">
          <div className="space-y-4">
            {/* Header with Brain Icon */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase font-sans">
                    AI MARKET ANALYSIS
                  </h3>
                  <span className="text-[10px] text-slate-400">XAUUSD Multi-Factor Engine</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black">
                <span>BIAS:</span>
                <span>BULLISH ↑</span>
              </div>
            </div>

            {/* Circular Confidence Meter & Score Matrix */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">CONFIDENCE</span>
                <span className="text-3xl font-black text-emerald-400 font-sans">87%</span>
                <span className="text-[10px] text-slate-400 block">High Probability Setup</span>
              </div>
              {/* Circular Meter SVG */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="5" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#10b981"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="163.3"
                    strokeDashoffset={163.3 * (1 - 0.87)}
                    strokeLinecap="round"
                  />
                </svg>
                <Award className="h-6 w-6 text-emerald-400 absolute" />
              </div>
            </div>

            {/* Factor Badges Grid matching screenshot */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">STRUCTURE:</span>
                <strong className="text-emerald-400">BULLISH ↑</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">LIQUIDITY SWEEP:</span>
                <strong className="text-emerald-400">DETECTED ✓</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">FVG ALIGNMENT:</span>
                <strong className="text-emerald-400">HIGH ↑</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">ENTRY QUALITY:</span>
                <strong className="text-emerald-400">HIGH ↑</strong>
              </div>
            </div>

            {/* AI Recommendation Summary Box */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase block">
                AI Recommendation:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {tradePlan.entryReason}
              </p>
            </div>

            {/* Mini Market Structure ZigZag Diagram matching screenshot */}
            <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">MARKET STRUCTURE</span>
                <span className="text-emerald-400 font-bold text-[10px]">ICT / SMC SCHEMATIC</span>
              </div>
              {/* ZigZag Visual SVG */}
              <svg viewBox="0 0 280 60" className="w-full h-14">
                <polyline
                  points="10,48 40,22 70,40 100,12 125,52 160,28 200,16 230,34 265,10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="125" cy="52" r="3" fill="#ef4444" />
                <text x="125" y="58" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="bold">LIQ SWEEP</text>
                <text x="40" y="16" fill="#38bdf8" fontSize="8" fontWeight="bold">BOS</text>
                <text x="160" y="24" fill="#fde047" fontSize="8" fontWeight="bold">CHoCH</text>
                <text x="200" y="10" fill="#38bdf8" fontSize="8" fontWeight="bold">BOS</text>
              </svg>
              <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>HH = Higher High</span>
                <span>BOS = Break of Structure</span>
                <span>CHoCH = Change of Character</span>
              </div>
            </div>

            {/* EXACT TRADE PLAN CARD WITH EXACT PRICES */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                  GOLD AI — CONFIRMED SETUP
                </span>
                <span className="rounded bg-emerald-500 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase">
                  {tradePlan.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ENTRY:</span>
                  <strong className="text-emerald-400 text-sm font-sans font-black">${tradePlan.entryPrice.toFixed(2)}</strong>
                </div>
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">STOP LOSS (SL):</span>
                  <strong className="text-rose-400 text-sm font-sans font-black">${tradePlan.stopLoss.toFixed(2)}</strong>
                </div>
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">TAKE PROFIT 1:</span>
                  <strong className="text-cyan-300 text-sm font-sans font-black">${tradePlan.tp1.toFixed(2)}</strong>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">RRR: 1:{tradePlan.rrrTp1}</span>
                </div>
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">TAKE PROFIT 2:</span>
                  <strong className="text-emerald-300 text-sm font-sans font-black">${tradePlan.tp2.toFixed(2)}</strong>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">RRR: 1:{tradePlan.rrrTp2}</span>
                </div>
              </div>

              {/* Sizing & Invalidation */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position Size (1% Risk):</span>
                  <strong className="text-white">{tradePlan.recommendedLots} Lots</strong>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>Invalidation:</span>
                  <span>15m close &lt; ${tradePlan.stopLoss}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center mt-3">
            Institutional Research Aid • Not Financial Advice
          </div>
        </div>
      </div>

      {/* ── BOTTOM DEEP INSTITUTIONAL WORKSPACE TABS ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#080d18] p-4 sm:p-5 shadow-2xl font-mono">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'TRADE_CARD', label: '🎯 Complete Trade Plan Details' },
              { id: 'MTF_AUTHORIZATION', label: '🧭 Multi-TF Bias Authorization' },
              { id: 'FUNDAMENTALS', label: '🌐 Live Fundamental & News Calendar' },
              { id: 'DXY_CORRELATION', label: '💵 DXY & Real Yields Engine' },
              { id: 'COT_POSITIONING', label: '📊 CFTC COT Positioning' },
              { id: 'WHY_MOVING', label: '🔎 "Why is Gold Moving?"' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playBlip();
                  setActiveSubTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Gold Execution Pipeline: <span className="text-emerald-400 font-bold">1D ➔ 4H ➔ 1H ➔ 15M ➔ 5M</span>
          </div>
        </div>

        {/* TAB 1: COMPLETE TRADE PLAN DETAILS */}
        {activeSubTab === 'TRADE_CARD' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">1. Directional Thesis</span>
              <p className="text-slate-200 leading-relaxed font-sans">{tradePlan.marketStructureExplanation}</p>
              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <span className="text-slate-400">Execution Stage:</span>
                <span className="text-amber-400 font-bold">{tradePlan.stageName}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">2. Liquidity & Stop Placement</span>
              <p className="text-slate-200 leading-relaxed font-sans">{tradePlan.liquidityExplanation}</p>
              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <span className="text-slate-400">Target Objective:</span>
                <span className="text-emerald-400 font-bold">{tradePlan.liquidityTarget}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">3. Invalidation & Triggers</span>
              <p className="text-rose-300 leading-relaxed font-sans">{tradePlan.invalidationCondition}</p>
              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <span className="text-slate-400">Next Action:</span>
                <span className="text-cyan-300 font-bold">{tradePlan.nextTrigger}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-TIMEFRAME DIRECTIONAL BIAS AUTHORIZATION */}
        {activeSubTab === 'MTF_AUTHORIZATION' && (
          <div className="pt-4 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">
                  CRITICAL LAW: Multi-Timeframe Trade Authorization Report
                </h4>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed font-sans">
                  {authorization.reasonHinglish}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">1D DIRECTION</span>
                <strong className="text-emerald-400 text-base font-black font-sans">{authorization.dailyDirection}</strong>
                <span className="text-[10px] text-slate-400 block">Higher Highs & Lows</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">4H DIRECTION</span>
                <strong className="text-emerald-400 text-base font-black font-sans">{authorization.h4Direction}</strong>
                <span className="text-[10px] text-slate-400 block">Agrees with Daily</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">1H DIRECTION</span>
                <strong className="text-emerald-400 text-base font-black font-sans">{authorization.h1Direction}</strong>
                <span className="text-[10px] text-slate-400 block">Validates 4H Trend</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">15M STRUCTURE</span>
                <strong className="text-cyan-400 text-base font-black font-sans">{authorization.m15Structure}</strong>
                <span className="text-[10px] text-slate-400 block">Setup Formed</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">5M ENTRY</span>
                <strong className="text-amber-400 text-base font-black font-sans">{authorization.m5Precision}</strong>
                <span className="text-[10px] text-slate-400 block">Precision Trigger</span>
              </div>
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
                <span className="text-[10px] text-amber-300 uppercase font-bold block">FINAL PERMISSION</span>
                <strong className="text-amber-300 text-base font-black font-sans">{authorization.finalAuthorization}</strong>
                <span className="text-[10px] text-amber-200 block">No Counter-Trades</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FUNDAMENTAL & NEWS CALENDAR */}
        {activeSubTab === 'FUNDAMENTALS' && (
          <div className="pt-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Impact</th>
                    <th className="p-2.5">Event Name</th>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Forecast</th>
                    <th className="p-2.5">Previous</th>
                    <th className="p-2.5">Actual / Surprise</th>
                    <th className="p-2.5">Gold Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {fundamentals.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.impact === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400'}`}>
                          {ev.impact}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-white font-mono">{ev.name}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{ev.dateTime}</td>
                      <td className="p-2.5 text-slate-300 font-mono">{ev.forecast}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{ev.previous}</td>
                      <td className="p-2.5 text-cyan-300 font-mono font-bold">{ev.actual} ({ev.surprise})</td>
                      <td className="p-2.5 text-emerald-400">{ev.goldImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DXY & REAL YIELDS CORRELATION */}
        {activeSubTab === 'DXY_CORRELATION' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">US Dollar Index (DXY)</span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>DXY Spot:</span><strong className="text-white">${dxyData.dxyPrice} ({dxyData.dxyChange24h}%)</strong></div>
                <div className="flex justify-between"><span>Trend:</span><strong className="text-rose-400">{dxyData.dxyTrend}</strong></div>
                <div className="flex justify-between"><span>15M Structure:</span><span className="text-slate-300">{dxyData.dxy15mStructure}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">US Treasury & Real Yields</span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>US 10Y Nominal:</span><strong className="text-amber-300">{dxyData.us10yYield}%</strong></div>
                <div className="flex justify-between"><span>US 10Y Real Yield:</span><strong className="text-emerald-400">{dxyData.realYield10y}% (-4 bps)</strong></div>
                <div className="flex justify-between"><span>Correlation Status:</span><span className="text-cyan-300 font-bold">{dxyData.correlationStatus}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase block">Institutional Gold Thesis</span>
              <p className="text-slate-200 leading-relaxed font-sans">{dxyData.explanation}</p>
            </div>
          </div>
        )}

        {/* TAB 5: CFTC COT POSITIONING */}
        {activeSubTab === 'COT_POSITIONING' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Official CFTC Commitments Data</span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Report As Of:</span><strong className="text-white">{cotData.reportDate}</strong></div>
                <div className="flex justify-between"><span>Release Date:</span><span className="text-slate-400">{cotData.publicationDate}</span></div>
                <div className="flex justify-between"><span>Open Interest:</span><strong className="text-cyan-300">{cotData.openInterest.toLocaleString()} Contracts</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Managed Money (Speculators)</span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Long Positions:</span><strong className="text-emerald-400">{cotData.managedMoneyLong.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span>Short Positions:</span><strong className="text-rose-400">{cotData.managedMoneyShort.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span>Net Speculative:</span><strong className="text-amber-400 font-black">+{cotData.managedMoneyNet.toLocaleString()}</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Institutional Context</span>
              <p className="text-slate-200 leading-relaxed font-sans">{cotData.contextNote}</p>
            </div>
          </div>
        )}

        {/* TAB 6: WHY IS GOLD MOVING? */}
        {activeSubTab === 'WHY_MOVING' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {whyMoving.topReasons.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{r.category}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {r.impactLevel}
                  </span>
                </div>
                <h5 className="text-xs font-black text-white">{r.factor}</h5>
                <p className="text-slate-300 leading-relaxed font-sans">{r.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
