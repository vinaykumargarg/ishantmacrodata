import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Crown, Shield, Award, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Clock, Compass, Zap, CheckCircle2, ChevronRight,
  Info, Eye, Play, BookOpen, Volume2, VolumeX, RefreshCw,
  Crosshair, Maximize2, Minimize2, Sliders, ArrowUpRight, ArrowDownRight,
  FileText, Check, HelpCircle, Move, ZoomIn, ZoomOut, RotateCcw,
  Sparkles, Filter, Lock, Target, Calendar, Globe, BarChart2
} from 'lucide-react';
import {
  TimeframeOption,
  MarketRegime,
  GoldCandle,
  SMCSwing,
  BOSLine,
  MSSLine,
  LiquidityMarker,
  SMCZone,
  ExactTradePlan,
  AssetTelemetry,
  getTopAssetTelemetry,
  generateInstitutionalGoldCandles,
  getInstitutionalSMCStructures,
  getExactInstitutionalTradePlan,
  getBottomDashboardData
} from '../services/goldInstitutionalEngine';
import { soundEffects } from '../services/soundEffectsService';

export default function GoldSmcAutoTradeLabView() {
  // Navigation & Market Regime state
  const [activeAsset, setActiveAsset] = useState<'GOLD' | 'BTC' | 'ETH' | 'SOL'>('GOLD');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('15m');
  const [marketRegime, setMarketRegime] = useState<MarketRegime>('BULLISH');
  const [isThemeDark, setIsThemeDark] = useState<boolean>(true);

  // Live Telemetry
  const [livePrice, setLivePrice] = useState<number>(4012.45);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('29 Oct 2026, 21:45:32 IST');

  // Interactive Chart Pan & Zoom state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Voice narration state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      setCurrentTimeStr(`${dateStr}, ${timeStr} IST`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Candles & SMC structures
  const candles = useMemo(() => {
    return generateInstitutionalGoldCandles(marketRegime, livePrice);
  }, [marketRegime, livePrice]);

  const smcStructures = useMemo(() => {
    return getInstitutionalSMCStructures(marketRegime, candles);
  }, [marketRegime, candles]);

  const tradePlan: ExactTradePlan = useMemo(() => {
    return getExactInstitutionalTradePlan(marketRegime, candles);
  }, [marketRegime, candles]);

  const topAssets = useMemo(() => {
    return getTopAssetTelemetry(livePrice);
  }, [livePrice]);

  const bottomData = useMemo(() => {
    return getBottomDashboardData();
  }, []);

  // Chart Layout Dimensions
  const chartWidth = 960;
  const chartHeight = 440;
  const padding = { top: 35, bottom: 45, left: 15, right: 85 };

  // Price Bounds matching screenshot (3,995.00 to 4,035.00)
  const minP = 3995.0;
  const maxP = 4035.0;
  const pRange = maxP - minP || 1;
  const usableW = chartWidth - padding.left - padding.right;
  const usableH = chartHeight - padding.top - padding.bottom;

  const scaleX = (i: number) => padding.left + (i / (candles.length - 1)) * usableW;
  const scaleY = (price: number) => padding.top + (1 - (price - minP) / pRange) * usableH;
  const invScaleY = (yVal: number) => maxP - ((yVal - padding.top) / usableH) * pRange;

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

  // Mouse & Touch Dragging Handlers
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

      setCrosshair({
        x: svgX,
        y: svgY,
        price: +priceAtY.toFixed(2)
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
      return Math.min(3.5, Math.max(0.65, +next.toFixed(2)));
    });
  };

  const handleResetView = () => {
    soundEffects.playBlip();
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Audio Assistant
  const handleToggleVoice = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) return;
    const text = `Gold Institutional Command Centre briefing. XAUUSD is trading at ${livePrice}. Active setup is ${tradePlan.status}. Entry planned at ${tradePlan.entryPrice}, Stop Loss at ${tradePlan.stopLoss}, Target 1 at ${tradePlan.tp1}, Target 2 at ${tradePlan.tp2}, Target 3 at ${tradePlan.tp3}. Reward to risk ratio is ${tradePlan.rrrTp3}. Setup Grade is ${tradePlan.setupGrade} with ${tradePlan.confidence} percent confidence.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`space-y-3 font-sans text-slate-100 ${isMaximized ? 'fixed inset-0 z-50 bg-[#060a12] p-4 overflow-y-auto' : ''}`}>
      {/* ── 1. TOP HEADER & BRAND BAR (1:1 with Screenshot) ── */}
      <div className="rounded-xl border border-slate-800 bg-[#070b14] px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl font-mono">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
            <Crown className="h-6 w-6 text-slate-950 fill-current" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-sans flex items-center gap-2">
              <span>Ishant Jakhenia Marco Panel Global Marco Command Centre</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              AI Powered Trading • SMC | Liquidity | Smart Money | Macro Analysis
            </p>
          </div>
        </div>

        {/* Live Data Badge, Clock & Theme Toggle */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] tracking-wider uppercase font-black">LIVE DATA</span>
          </div>

          <span className="text-[11px] text-slate-400">
            Last Update: <strong className="text-slate-300 font-normal">{currentTimeStr}</strong>
          </span>

          {/* Dark / Light Toggle Pills */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-[11px]">
            <button
              onClick={() => setIsThemeDark(true)}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                isThemeDark ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setIsThemeDark(false)}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                !isThemeDark ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Light
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. TOP NAVIGATION TABS & MACRO REGIME CONTROLLER ── */}
      <div className="rounded-xl border border-slate-800 bg-[#070b14] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Switcher Pills */}
          <button
            onClick={() => setActiveAsset('GOLD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeAsset === 'GOLD'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <span>🪙 Gold AI</span>
          </button>

          <button
            onClick={() => setActiveAsset('BTC')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <span>₿ BTC AI</span>
          </button>

          <button
            onClick={() => setActiveAsset('ETH')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <span>⟠ ETH AI</span>
          </button>

          <button
            onClick={() => setActiveAsset('SOL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <span>◎ SOL AI</span>
          </button>

          <span className="text-slate-700 mx-1">|</span>

          {/* Quick Sub-Links matching screenshot */}
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Market Overview</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Economic Calendar</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">COT Report</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">DXY Analysis</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">News & Alerts</span>
        </div>

        {/* Interactive HTF Trend Fixer / Selector (Addresses User Complaint) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Trend Mode:</span>
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-[11px]">
            <button
              onClick={() => {
                soundEffects.playBlip();
                setMarketRegime('BULLISH');
              }}
              className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer ${
                marketRegime === 'BULLISH'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Demand Zone Retest Long Trade (1:4 RRR)"
            >
              🟢 Bullish Long
            </button>
            <button
              onClick={() => {
                soundEffects.playBlip();
                setMarketRegime('BEARISH');
              }}
              className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer ${
                marketRegime === 'BEARISH'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Market Falling Short Trade (500-700 Pips Target)"
            >
              🔴 Bearish Short (Falling)
            </button>
          </div>

          <button
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isSpeaking
                ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
            }`}
            title="AI Voice Briefing"
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* ── 3. TOP 4 ASSET TELEMETRY CARDS (1:1 with Screenshot) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {topAssets.map((asset) => (
          <div
            key={asset.symbol}
            className={`rounded-xl border p-3 flex items-center justify-between shadow-lg transition-all ${
              asset.symbol.includes('GOLD')
                ? 'border-amber-500/40 bg-gradient-to-br from-[#0c1424] to-[#070b14]'
                : 'border-slate-800 bg-[#070b14]'
            }`}
          >
            {/* Left: Icon, Symbol, Big Price, Change */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-lg shrink-0">
                {asset.symbol.includes('GOLD') ? '🪙' : asset.symbol.includes('BTC') ? '₿' : asset.symbol.includes('ETH') ? '⟠' : '◎'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block tracking-tight">
                  {asset.symbol}
                </span>
                <span className="text-lg font-black text-white font-sans block leading-tight">
                  {asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  ▲ +{asset.changePts.toFixed(2)} (+{asset.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Right: Daily, 4H, 1H Biases */}
            <div className="text-[10px] space-y-0.5 border-l border-slate-800/80 pl-2.5 leading-tight">
              <div>
                <span className="text-slate-500">Daily Bias: </span>
                <strong className={marketRegime === 'BEARISH' && asset.symbol.includes('GOLD') ? 'text-rose-400' : 'text-emerald-400'}>
                  {marketRegime === 'BEARISH' && asset.symbol.includes('GOLD') ? 'BEARISH' : asset.dailyBias}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">4H Bias: </span>
                <strong className={marketRegime === 'BEARISH' && asset.symbol.includes('GOLD') ? 'text-rose-400' : 'text-emerald-400'}>
                  {marketRegime === 'BEARISH' && asset.symbol.includes('GOLD') ? 'BEARISH' : asset.h4Bias}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">1H Bias: </span>
                <strong className={marketRegime === 'BEARISH' && asset.symbol.includes('GOLD') ? 'text-rose-400' : 'text-emerald-400'}>
                  {marketRegime === 'BEARISH' && asset.symbol.includes('GOLD') ? 'BEARISH' : asset.h1Bias}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. MAIN WORKSPACE: CHART (68%) + RIGHT TRADE PLAN PANEL (32%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT 68%: EXACT CANDLESTICK CHART */}
        <div className="lg:col-span-8 xl:col-span-8 rounded-xl border border-slate-800 bg-[#070b14] p-3 shadow-2xl relative flex flex-col font-mono">
          {/* Chart Header Bar matching screenshot */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <span>🪙</span>
                <span>XAUUSD Gold – {timeframe}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                marketRegime === 'BEARISH'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                <span>Market Structure:</span>
                <span>{marketRegime === 'BEARISH' ? 'BEARISH' : 'BULLISH'}</span>
              </span>
            </div>

            {/* Timeframe Selector & Move/Zoom Tool Pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                {(['1D', '4H', '1H', '30m', '15m', '5m'] as TimeframeOption[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      soundEffects.playBlip();
                      setTimeframe(tf);
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Chart Move / Zoom buttons */}
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3.5, +(z * 1.2).toFixed(2)))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.65, +(z / 1.2).toFixed(2)))}
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
          </div>

          {/* Canvas SVG Area with Interactive Drag to Move */}
          <div
            className={`relative w-full overflow-hidden select-none mt-1.5 rounded-lg border border-slate-800/80 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ height: `${chartHeight}px` }}
          >
            {/* Live Chart Navigation Helper */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded px-2 py-0.5 text-[10px] text-slate-400 pointer-events-none">
              <span className="text-amber-400 font-bold">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
              <span>•</span>
              <span className="text-slate-300">Left-click & drag to move chart</span>
              {crosshair && (
                <>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">${crosshair.price}</span>
                </>
              )}
            </div>

            <svg
              ref={svgRef}
              viewBox={dynamicViewBox}
              className="w-full h-full text-xs font-mono"
              style={{ background: '#090e18' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
            >
              {/* Subtle Horizontal Price Grid Lines & Axis Ticks */}
              {[4035, 4030, 4025, 4020, 4015, 4010, 4005, 4000, 3995].map((pVal) => {
                const y = scaleY(pVal);
                return (
                  <g key={pVal}>
                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#131c2e" strokeDasharray="3 3" opacity="0.65" />
                    <text x={chartWidth - padding.right + 6} y={y + 4} fill="#64748b" fontSize="10">
                      {pVal.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Time Axis Labels on Bottom */}
              {[
                { i: 4, label: '18:00' },
                { i: 12, label: '21:00' },
                { i: 20, label: '29 Oct' },
                { i: 28, label: '03:00' },
                { i: 36, label: '06:00' },
                { i: 44, label: '09:00' },
                { i: 52, label: '12:00' },
                { i: 60, label: '18:00' },
                { i: 68, label: '21:00' }
              ].map((t) => (
                <text key={t.label} x={scaleX(t.i)} y={chartHeight - 12} textAnchor="middle" fill="#64748b" fontSize="9.5">
                  {t.label}
                </text>
              ))}

              {/* ── SMC ZONES: DEMAND (GREEN), SUPPLY (RED), FVG (BLUE) ── */}
              {smcStructures.zones.map((zone) => {
                const yTop = scaleY(zone.top);
                const yBottom = scaleY(zone.bottom);
                const h = Math.abs(yBottom - yTop);
                const isDemand = zone.type === 'DEMAND';
                const isSupply = zone.type === 'SUPPLY';

                const fillColor = isDemand ? '#059669' : isSupply ? '#dc2626' : '#0284c7';
                const strokeColor = isDemand ? '#10b981' : isSupply ? '#ef4444' : '#38bdf8';

                return (
                  <g key={zone.id}>
                    <rect
                      x={scaleX(zone.id === 'DEMAND-1' ? 8 : zone.id === 'SUPPLY-1' ? 36 : zone.id === 'FVG-1' ? 44 : 50)}
                      y={yTop}
                      width={chartWidth - padding.right - scaleX(zone.id === 'DEMAND-1' ? 8 : zone.id === 'SUPPLY-1' ? 36 : zone.id === 'FVG-1' ? 44 : 50)}
                      height={Math.max(12, h)}
                      fill={fillColor}
                      fillOpacity={isDemand ? '0.35' : isSupply ? '0.35' : '0.28'}
                      stroke={strokeColor}
                      strokeWidth="1"
                      rx="3"
                    />
                    <text
                      x={scaleX(zone.id === 'DEMAND-1' ? 24 : zone.id === 'SUPPLY-1' ? 48 : zone.id === 'FVG-1' ? 48 : 52)}
                      y={yTop + 13}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {zone.label}
                    </text>
                    {zone.slPrice && (
                      <text
                        x={chartWidth - padding.right - 10}
                        y={scaleY(zone.slPrice) - 4}
                        textAnchor="end"
                        fill="#ef4444"
                        fontSize="9.5"
                        fontWeight="bold"
                      >
                        SL: {zone.slPrice.toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── BOS & CHOCH LINES ── */}
              {smcStructures.bosList.map((bos) => (
                <g key={bos.id}>
                  <line
                    x1={scaleX(bos.id === 'BOS-1' ? 8 : 54)}
                    y1={scaleY(bos.price)}
                    x2={scaleX(bos.id === 'BOS-1' ? 14 : 64)}
                    y2={scaleY(bos.price)}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                  <text
                    x={scaleX(bos.id === 'BOS-1' ? 10 : 58)}
                    y={scaleY(bos.price) - 4}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    BOS
                  </text>
                </g>
              ))}

              {smcStructures.mssList.map((choch) => (
                <g key={choch.id}>
                  <line
                    x1={scaleX(18)}
                    y1={scaleY(choch.price)}
                    x2={scaleX(30)}
                    y2={scaleY(choch.price)}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                  <text
                    x={scaleX(22)}
                    y={scaleY(choch.price) - 4}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    CHoCH
                  </text>
                </g>
              ))}

              {/* ── LIQUIDITY SWEEP & LIQUIDITY GRAB CALLOUTS ── */}
              {smcStructures.markers.map((m) => {
                const candleIdx = m.type === 'SWEEP' ? 16 : 38;
                const x = scaleX(candleIdx);
                const y = scaleY(m.price);

                return (
                  <g key={m.id}>
                    {m.type === 'SWEEP' ? (
                      <>
                        <line x1={x} y1={y + 18} x2={x} y2={y + 3} stroke="#ffffff" strokeWidth="1.5" markerEnd="url(#arrow-white-up)" />
                        <text x={x + 6} y={y + 14} fill="#ffffff" fontSize="9" fontWeight="bold">
                          {m.label}
                        </text>
                      </>
                    ) : (
                      <>
                        <line x1={x} y1={y - 18} x2={x} y2={y - 3} stroke="#ffffff" strokeWidth="1.5" markerEnd="url(#arrow-white-down)" />
                        <text x={x - 6} y={y - 20} textAnchor="end" fill="#ffffff" fontSize="9" fontWeight="bold">
                          {m.label}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}

              {/* ── TRADE EXECUTION PLAN LINES (ENTRY, SL, TP1, TP2, TP3) ── */}
              <g>
                {/* Green Shaded Reward Box */}
                <rect
                  x={scaleX(52)}
                  y={scaleY(tradePlan.tp3)}
                  width={chartWidth - padding.right - scaleX(52)}
                  height={Math.abs(scaleY(tradePlan.tp3) - scaleY(tradePlan.entryPrice))}
                  fill="#0284c7"
                  fillOpacity="0.22"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Solid Green Entry Line & Green Tag Chip */}
                <line
                  x1={scaleX(52)}
                  y1={scaleY(tradePlan.entryPrice)}
                  x2={chartWidth - padding.right}
                  y2={scaleY(tradePlan.entryPrice)}
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <text
                  x={scaleX(64)}
                  y={scaleY(tradePlan.entryPrice) - 5}
                  fill="#10b981"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  Entry: {tradePlan.entryPrice.toFixed(2)}
                </text>
                <rect
                  x={chartWidth - padding.right + 2}
                  y={scaleY(tradePlan.entryPrice) - 8}
                  width="72"
                  height="16"
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
                  {tradePlan.entryPrice.toFixed(2)}
                </text>

                {/* Red SL Line & Tag */}
                <line
                  x1={scaleX(52)}
                  y1={scaleY(tradePlan.stopLoss)}
                  x2={chartWidth - padding.right}
                  y2={scaleY(tradePlan.stopLoss)}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <text
                  x={scaleX(64)}
                  y={scaleY(tradePlan.stopLoss) + 12}
                  fill="#ef4444"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  SL: {tradePlan.stopLoss.toFixed(2)}
                </text>

                {/* Blue TP1, TP2, TP3 Lines */}
                {[
                  { label: `TP1: ${tradePlan.tp1.toFixed(2)}`, p: tradePlan.tp1 },
                  { label: `TP2: ${tradePlan.tp2.toFixed(2)}`, p: tradePlan.tp2 },
                  { label: `TP3: ${tradePlan.tp3.toFixed(2)}`, p: tradePlan.tp3 }
                ].map((tp) => (
                  <g key={tp.label}>
                    <line
                      x1={scaleX(52)}
                      y1={scaleY(tp.p)}
                      x2={chartWidth - padding.right}
                      y2={scaleY(tp.p)}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                    />
                    <text
                      x={chartWidth - padding.right - 10}
                      y={scaleY(tp.p) - 4}
                      textAnchor="end"
                      fill="#38bdf8"
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {tp.label}
                    </text>
                  </g>
                ))}

                {/* Dotted hypothetical path into TP3 */}
                {tradePlan.projectedPath.length > 0 && (
                  <polyline
                    points={tradePlan.projectedPath.map((pt, idx) => {
                      const x = scaleX(52 + idx * 3.4);
                      const y = scaleY(pt.price);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#f8fafc"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                )}
              </g>

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
                    {/* Body */}
                    <rect
                      x={x - 3.2}
                      y={bodyTop}
                      width={6.4}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="0.5"
                    />
                  </g>
                );
              })}

              {/* Crosshair Overlay */}
              {crosshair && (
                <g pointerEvents="none">
                  <line x1={crosshair.x} y1={padding.top} x2={crosshair.x} y2={chartHeight - padding.bottom} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" opacity="0.8" />
                  <line x1={padding.left} y1={crosshair.y} x2={chartWidth - padding.right} y2={crosshair.y} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" opacity="0.8" />
                  <rect x={chartWidth - padding.right + 2} y={crosshair.y - 9} width="68" height="18" fill="#0284c7" rx="3" />
                  <text x={chartWidth - padding.right + 6} y={crosshair.y + 4} fill="#ffffff" fontSize="10" fontWeight="900">
                    ${crosshair.price}
                  </text>
                </g>
              )}

              {/* SVG Markers */}
              <defs>
                <marker id="arrow-white-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 10 L 5 0 L 10 10 z" fill="#ffffff" />
                </marker>
                <marker id="arrow-white-down" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 0 L 5 10 z" fill="#ffffff" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        {/* RIGHT 32%: GOLD AI — TRADE PLAN CARD (1:1 with Screenshot) */}
        <div className="lg:col-span-4 xl:col-span-4 rounded-xl border border-slate-800 bg-[#070b14] p-4 shadow-2xl relative flex flex-col justify-between font-mono">
          <div className="space-y-3.5">
            {/* Header: Golden Bar Icon + GOLD AI – Trade Plan */}
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <h2 className="text-sm font-black text-amber-400 tracking-wide font-sans">
                GOLD AI – Trade Plan
              </h2>
            </div>

            {/* Big Green/Red Banner: LONG SETUP ✓ or SHORT SETUP ▼ */}
            <div
              className={`rounded-lg py-2.5 text-center font-sans font-black text-base tracking-wider flex items-center justify-center gap-2 shadow-lg ${
                tradePlan.direction === 'LONG'
                  ? 'bg-[#10b981] text-slate-950'
                  : 'bg-[#ef4444] text-white'
              }`}
            >
              <span>{tradePlan.status}</span>
            </div>

            {/* Key-Value Details Table matching screenshot exactly */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-300 font-bold">Entry Price :</span>
                <strong className="text-white font-sans text-sm font-black">{tradePlan.entryPrice.toFixed(2)}</strong>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-300 font-bold">Entry Zone :</span>
                <strong className="text-slate-200">{tradePlan.entryZone}</strong>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-300 font-bold">Stop Loss (SL) :</span>
                <strong className="text-rose-400 font-sans text-sm font-black">{tradePlan.stopLoss.toFixed(2)}</strong>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-300 font-bold">TP1 :</span>
                <strong className="text-cyan-400 font-sans">{tradePlan.tp1.toFixed(2)} <span className="text-emerald-400 text-[11px]">(RRR {tradePlan.rrrTp1})</span></strong>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-300 font-bold">TP2 :</span>
                <strong className="text-cyan-400 font-sans">{tradePlan.tp2.toFixed(2)} <span className="text-emerald-400 text-[11px]">(RRR {tradePlan.rrrTp2})</span></strong>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-300 font-bold">TP3 :</span>
                <strong className="text-cyan-400 font-sans">{tradePlan.tp3.toFixed(2)} <span className="text-emerald-400 text-[11px]">(RRR {tradePlan.rrrTp3})</span></strong>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Market Structure :</span>
                <span className="text-emerald-400 font-bold">{tradePlan.marketStructure}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Liquidity :</span>
                <span className="text-slate-200">{tradePlan.liquidity}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">DXY :</span>
                <span className="text-slate-200">{tradePlan.dxy}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">News Impact :</span>
                <span className="text-slate-200">{tradePlan.newsImpact}</span>
              </div>
            </div>

            {/* Lime Green Banner: Setup Grade: A+ | Confidence: 92% */}
            <div className="rounded-lg bg-[#a3e635]/20 border border-[#a3e635]/50 py-2 px-3 text-center text-[#a3e635] font-black text-xs tracking-wider">
              <span>Setup Grade : {tradePlan.setupGrade}</span>
              <span className="mx-2">|</span>
              <span>Confidence : {tradePlan.confidence}%</span>
            </div>

            {/* Bottom Explanations */}
            <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-sans">
              <div>
                <span className="text-slate-400 font-mono text-[11px]">Reason : </span>
                <span className="font-medium text-slate-200">{tradePlan.reason}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[11px]">Invalidation : </span>
                <strong className="text-rose-400 font-mono">{tradePlan.invalidation}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[11px]">Trade Expiry : </span>
                <span className="text-slate-300 font-mono">{tradePlan.tradeExpiry}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. BOTTOM 4-CARD DASHBOARD GRID (1:1 with Screenshot) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Card 1: Market Analysis Summary */}
        <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-2">
            <span>📊</span>
            <span>Market Analysis Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Gold Trend :</span>
              <strong className="text-emerald-400 font-bold">{bottomData.marketAnalysisSummary.goldTrend}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DXY :</span>
              <strong className="text-rose-400 font-bold">{bottomData.marketAnalysisSummary.dxy}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">BTC Trend :</span>
              <strong className="text-emerald-400 font-bold">{bottomData.marketAnalysisSummary.btcTrend}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">US 10Y :</span>
              <strong className="text-rose-400 font-bold">{bottomData.marketAnalysisSummary.us10y}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ETH Trend :</span>
              <strong className="text-emerald-400 font-bold">{bottomData.marketAnalysisSummary.ethTrend}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">BTC.D :</span>
              <strong className="text-emerald-400 font-bold">{bottomData.marketAnalysisSummary.btcD}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SOL Trend :</span>
              <strong className="text-emerald-400 font-bold">{bottomData.marketAnalysisSummary.solTrend}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">USDT.D :</span>
              <strong className="text-rose-400 font-bold">{bottomData.marketAnalysisSummary.usdtD}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming High Impact News */}
        <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-2">
            <span>📅</span>
            <span>Upcoming High Impact News</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {bottomData.upcomingNews.map((n, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    n.impact === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {n.impact}
                  </span>
                  <span className="text-slate-200">{n.title}</span>
                </div>
                <span className="text-slate-400 text-[11px]">{n.dateStr}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Global Market Snapshot */}
        <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-2">
            <span>🌐</span>
            <span>Global Market Snapshot</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-xs">
              <div><span className="text-slate-400">BTC Liquidation (24h) : </span><strong className="text-white">{bottomData.globalSnapshot.btcLiquidation24h}</strong></div>
              <div><span className="text-slate-400">ETH Liquidation (24h) : </span><strong className="text-white">{bottomData.globalSnapshot.ethLiquidation24h}</strong></div>
              <div><span className="text-slate-400">Total Crypto MC : </span><strong className="text-emerald-400">{bottomData.globalSnapshot.totalCryptoMc}</strong></div>
              <div><span className="text-slate-400">Gold Volume : </span><strong className="text-emerald-400">{bottomData.globalSnapshot.goldVolume}</strong></div>
            </div>
            {/* Mini Sparkline SVG */}
            <svg viewBox="0 0 70 30" className="w-16 h-10">
              <path
                d="M 2 24 Q 15 12, 30 18 T 50 6 T 68 2"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Live Status & Trade Smart With AI */}
        <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3.5 flex items-center justify-between">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Live Status</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-300">✓ Chart Data : <strong className="text-emerald-400">Connected</strong></div>
              <div className="text-slate-300">✓ News Feed : <strong className="text-emerald-400">Connected</strong></div>
              <div className="text-slate-300">✓ COT Data : <strong className="text-emerald-400">Updated (Weekly)</strong></div>
              <div className="text-slate-300">✓ AI Engine : <strong className="text-emerald-400">Active</strong></div>
            </div>
          </div>

          {/* Golden Trophy / Chart Badge */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 text-amber-400 text-center">
            <TrendingUp className="h-8 w-8 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-wider mt-1">Trade Smart</span>
            <span className="text-[9px] text-slate-300">With AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
