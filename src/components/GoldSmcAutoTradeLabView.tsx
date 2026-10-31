import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Shield, Award, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Clock, Compass, Zap, CheckCircle2, ChevronRight,
  Info, Eye, Play, BookOpen, Volume2, VolumeX, RefreshCw,
  Crosshair, Maximize2, Minimize2, Sliders, ArrowUpRight, ArrowDownRight,
  FileText, Check, HelpCircle, Move, ZoomIn, ZoomOut, RotateCcw,
  Sparkles, Filter, Lock, Target
} from 'lucide-react';
import {
  TimeframeOption,
  EngineMode,
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
  // Engine & Display Modes
  const [engineMode, setEngineMode] = useState<EngineMode>('BLUEPRINT_MOCKUP');
  const [activeModelId, setActiveModelId] = useState<'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'>('M1');
  const [selectedStage, setSelectedStage] = useState<number>(3); // S0 to S5
  const [timeframe, setTimeframe] = useState<TimeframeOption>('15m');

  // Live telemetry data
  const [livePrice, setLivePrice] = useState<number>(2748.60);
  const [change24h, setChange24h] = useState<number>(0.42);
  const [high24h, setHigh24h] = useState<number>(2763.10);
  const [low24h, setLow24h] = useState<number>(2730.40);
  const [spread, setSpread] = useState<number>(0.25);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Interactive Chart Pan & Zoom state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Crosshair state
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number } | null>(null);

  // Overlay filter toggles
  const [showBosMss, setShowBosMss] = useState<boolean>(true);
  const [showSweeps, setShowSweeps] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showTradeBox, setShowTradeBox] = useState<boolean>(true);
  const [showGhostPath, setShowGhostPath] = useState<boolean>(true);
  const [cleanMode, setCleanMode] = useState<boolean>(false);

  // Bottom Tabs & Modals
  const [activeTab, setActiveTab] = useState<'ACTION_MAP' | 'ZERO_FALTU_GATES' | 'EDUCATIONAL_7_STEPS' | 'MODELS_LIBRARY' | 'MACRO_DRIVERS'>('ACTION_MAP');
  const [showCheatsheetModal, setShowCheatsheetModal] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Fetch live gold quote
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
    const interval = setInterval(fetchPrice, 3500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute Candles & SMC Structure
  const candles = useMemo(() => {
    return generateGoldCandles(timeframe, livePrice, engineMode, activeModelId, selectedStage, 75);
  }, [timeframe, livePrice, engineMode, activeModelId, selectedStage]);

  const smcData: DetectedSMC = useMemo(() => {
    return detectSMCStructure(candles, timeframe, engineMode);
  }, [candles, timeframe, engineMode]);

  const tradeSetup: TradeSetup = useMemo(() => {
    return evaluateSetupModels(candles, smcData, livePrice, timeframe, engineMode, activeModelId, selectedStage);
  }, [candles, smcData, livePrice, timeframe, engineMode, activeModelId, selectedStage]);

  const zoneMap: ZoneMapItem[] = useMemo(() => {
    return buildZoneMap(candles, smcData, livePrice, engineMode);
  }, [candles, smcData, livePrice, engineMode]);

  const macroIntel: GoldMacroIntelligence = useMemo(() => {
    return getGoldMacroIntelligence();
  }, []);

  // Chart Dimensions & Scales
  const chartHeight = 540;
  const chartWidth = 960;
  const padding = { top: 40, bottom: 50, left: 20, right: 90 };

  const { minP, maxP, scaleX, scaleY, invScaleY } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    if (engineMode === 'BLUEPRINT_MOCKUP') {
      min = 4120.0;
      max = 4208.0;
    } else {
      min = Math.min(min, tradeSetup.tp3 - 4.0);
      max = Math.max(max, tradeSetup.stopLoss + 4.0);
    }

    const pRange = max - min || 1;
    const usableW = chartWidth - padding.left - padding.right;
    const usableH = chartHeight - padding.top - padding.bottom;

    const sX = (i: number) => padding.left + (i / (candles.length - 1)) * usableW;
    const sY = (price: number) => padding.top + (1 - (price - min) / pRange) * usableH;
    const invY = (yVal: number) => max - ((yVal - padding.top) / usableH) * pRange;

    return { minP: min, maxP: max, scaleX: sX, scaleY: sY, invScaleY: invY };
  }, [candles, tradeSetup, chartHeight, chartWidth, engineMode]);

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

  // Mouse & Touch Drag Handlers for Panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    // 1. Drag Panning
    if (isDragging) {
      const dx = (e.clientX - dragStartRef.current.x) / zoomLevel;
      const dy = (e.clientY - dragStartRef.current.y) / zoomLevel;
      setPanOffset({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy
      });
    }

    // 2. Crosshair positioning
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Transform client coordinates to SVG viewBox space
      const svgX = (clientX / rect.width) * (chartWidth / zoomLevel) + (chartWidth / 2 - (chartWidth / zoomLevel) / 2 - panOffset.x);
      const svgY = (clientY / rect.height) * (chartHeight / zoomLevel) + (chartHeight / 2 - (chartHeight / zoomLevel) / 2 - panOffset.y);
      const priceAtY = invScaleY(svgY);

      setCrosshair({
        x: svgX,
        y: svgY,
        price: +priceAtY.toFixed(1)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setCrosshair(null);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoomLevel((prev) => {
      const next = prev * factor;
      return Math.min(3.5, Math.max(0.55, +next.toFixed(2)));
    });
  };

  // Reset Zoom & Pan
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
    const text = `Gold SMC Auto Trade Lab update. Mode is ${engineMode}. Active model is ${tradeSetup.modelName}. Master state is ${tradeSetup.side} ${tradeSetup.state}. Grade ${tradeSetup.grade}. Entry is at ${tradeSetup.entryPrice}, Stop Loss at ${tradeSetup.stopLoss}, Target 3 at ${tradeSetup.tp3}. Reward to risk ratio is ${tradeSetup.netRRToTp3}R. Zero faltu trade gate active.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`space-y-4 font-sans text-slate-100 ${isMaximized ? 'fixed inset-0 z-50 bg-[#070b14] p-4 overflow-y-auto' : ''}`}>
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
                Auto Swings • BOS & MSS • Liquidity Grab (X) • Breaker Block (BB + FVG) • Interactive Moveable Chart • Zero-Faltu Entry Gates
              </p>
            </div>
          </div>

          {/* Mode Selector & Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dual Engine Switcher */}
            <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 font-mono text-xs">
              <button
                onClick={() => {
                  soundEffects.playBlip();
                  setEngineMode('BLUEPRINT_MOCKUP');
                  handleResetView();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  engineMode === 'BLUEPRINT_MOCKUP'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📸 Textbook Blueprint (As in Photo)</span>
              </button>
              <button
                onClick={() => {
                  soundEffects.playBlip();
                  setEngineMode('LIVE_SCANNER');
                  handleResetView();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  engineMode === 'LIVE_SCANNER'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>⚡ Live Market Scanner</span>
              </button>
            </div>

            {/* Live Price Tag */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  {engineMode === 'BLUEPRINT_MOCKUP' ? 'BLUEPRINT PRICE' : 'XAU/USD SPOT'}
                </span>
                <span className="text-base font-black text-amber-400">
                  ${engineMode === 'BLUEPRINT_MOCKUP' ? '4,188.20' : livePrice.toFixed(2)}
                </span>
              </div>
              <div className="border-l border-slate-700 pl-2.5 leading-tight">
                <span className={`text-xs font-bold block ${change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400">Spr: ${spread.toFixed(2)}</span>
              </div>
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

          {/* Model Selection Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-bold uppercase">SMC Models:</span>
            {[
              { id: 'M1', label: 'M1 (Bearish Sweep & Retest)' },
              { id: 'M2', label: 'M2 (Bullish Demand Reclaim)' },
              { id: 'M3', label: 'M3 (London Killzone)' },
              { id: 'M4', label: 'M4 (NY Reversal)' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  soundEffects.playBlip();
                  setActiveModelId(m.id as any);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeModelId === m.id
                    ? 'bg-indigo-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
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

        {/* Stage Scrubber Bar (Interactive Step Replay) */}
        {engineMode === 'BLUEPRINT_MOCKUP' && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-bold">
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span>INTERACTIVE SETUP REPLAY (Stage Scrubber):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { stage: 0, label: 'S0: Range ($$$ EQH)' },
                { stage: 1, label: 'S1: Liquidity Grab (X)' },
                { stage: 2, label: 'S2: MSS Close' },
                { stage: 3, label: 'S3: Zone Tap [ARMED]' },
                { stage: 4, label: 'S4: Rejection Pin' },
                { stage: 5, label: 'S5: TP3 Hit' }
              ].map((s) => (
                <button
                  key={s.stage}
                  onClick={() => {
                    soundEffects.playBlip();
                    setSelectedStage(s.stage);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStage === s.stage
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
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
              <span className="text-slate-300 font-bold uppercase tracking-wide">
                {engineMode === 'BLUEPRINT_MOCKUP'
                  ? 'ILLUSTRATIVE MOCKUP - synthetic data, not a real signal'
                  : 'LIVE REAL-TIME SMC SCANNER — 0 FALTU ENTRIES'}
              </span>
            </div>

            {/* Panning & Zooming HUD Controls */}
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
                onClick={() => setZoomLevel((z) => Math.max(0.55, +(z / 1.2).toFixed(2)))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Reset Chart View (100%)"
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

          {/* SVG Canvas Chart with Drag & Pan Handlers */}
          <div
            className={`relative w-full overflow-hidden select-none mt-2 rounded-xl border border-slate-800/60 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ minHeight: isMaximized ? '75vh' : '520px' }}
          >
            {/* Floating Zoom / Pan Level Chip */}
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-400 pointer-events-none">
              <span className="text-amber-400 font-bold">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
              <span>•</span>
              <span>Pan: X:{panOffset.x.toFixed(0)} Y:{panOffset.y.toFixed(0)}</span>
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
              style={{ background: '#0b0f17', minHeight: isMaximized ? '75vh' : '520px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
            >
              {/* Subtle Grid Lines */}
              {[0.15, 0.35, 0.55, 0.75, 0.95].map((pct, idx) => {
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

              {/* ── OVERLAY: LIQUIDITY POOL ($$$ EQH / prior high) ── */}
              {showSweeps && smcData.pools[0] && (
                <g>
                  <line
                    x1={scaleX(22)}
                    y1={scaleY(smcData.pools[0].price)}
                    x2={chartWidth - padding.right}
                    y2={scaleY(smcData.pools[0].price)}
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                  <text
                    x={scaleX(26)}
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
                  <line
                    x1={scaleX(40)}
                    y1={scaleY(smcData.sweeps[0].price) - 24}
                    x2={scaleX(40)}
                    y2={scaleY(smcData.sweeps[0].price) - 4}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    markerEnd="url(#arrow-amber)"
                  />
                  <text
                    x={scaleX(40)}
                    y={scaleY(smcData.sweeps[0].price) - 30}
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
                    x1={scaleX(10)}
                    y1={scaleY(smcData.bosList[0].price)}
                    x2={scaleX(28)}
                    y2={scaleY(smcData.bosList[0].price)}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                  <text
                    x={(scaleX(10) + scaleX(28)) / 2}
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
                    x1={scaleX(40)}
                    y1={scaleY(smcData.mssList[0].price)}
                    x2={scaleX(56)}
                    y2={scaleY(smcData.mssList[0].price)}
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <text
                    x={(scaleX(40) + scaleX(56)) / 2}
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
                    x={scaleX(48)}
                    y={scaleY(smcData.orderBlocks[0].top)}
                    width={chartWidth - padding.right - scaleX(48)}
                    height={Math.max(14, scaleY(smcData.orderBlocks[0].bottom) - scaleY(smcData.orderBlocks[0].top))}
                    fill="#7c3aed"
                    fillOpacity="0.25"
                    stroke="#a855f7"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                    rx="4"
                  />
                  <text
                    x={scaleX(50)}
                    y={scaleY(smcData.orderBlocks[0].top) + 13}
                    fill="#c084fc"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    BB + FVG (supply zone {smcData.orderBlocks[0].bottom}-{smcData.orderBlocks[0].top})
                  </text>
                </g>
              )}

              {/* ── OVERLAY: RISK/REWARD TRADE BOXES ── */}
              {showTradeBox && tradeSetup.state !== 'WAIT' && (
                <g>
                  {/* Red Risk Box (Entry -> SL) */}
                  <rect
                    x={scaleX(58)}
                    y={scaleY(tradeSetup.stopLoss)}
                    width={chartWidth - padding.right - scaleX(58)}
                    height={Math.abs(scaleY(tradeSetup.entryPrice) - scaleY(tradeSetup.stopLoss))}
                    fill="#dc2626"
                    fillOpacity="0.22"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Green Reward Box (Entry -> TP3) */}
                  <rect
                    x={scaleX(58)}
                    y={scaleY(tradeSetup.entryPrice)}
                    width={chartWidth - padding.right - scaleX(58)}
                    height={Math.abs(scaleY(tradeSetup.tp3) - scaleY(tradeSetup.entryPrice))}
                    fill="#059669"
                    fillOpacity="0.22"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Solid White Entry Line & Tag */}
                  <line
                    x1={scaleX(56)}
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
                    ENTRY {tradeSetup.entryPrice.toFixed(0)}
                  </text>

                  {/* Red Dashed SL Line & Tag */}
                  <line
                    x1={scaleX(56)}
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
                    SL {tradeSetup.stopLoss.toFixed(0)}
                  </text>

                  {/* Cyan Dashed TP Lines & Tags */}
                  {[
                    { label: `TP1 ${tradeSetup.tp1.toFixed(0)} (1.5R)`, p: tradeSetup.tp1, color: '#38bdf8' },
                    { label: `TP2 ${tradeSetup.tp2.toFixed(0)} (3.2R)`, p: tradeSetup.tp2, color: '#06b6d4' },
                    { label: `TP3 ${tradeSetup.tp3.toFixed(0)} (4.8R)`, p: tradeSetup.tp3, color: '#10b981' }
                  ].map((tp, idx) => (
                    <g key={idx}>
                      <line
                        x1={scaleX(56)}
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
                        width="84"
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
              {showGhostPath && tradeSetup.ghostPath.length > 0 && (
                <g>
                  <polyline
                    points={tradeSetup.ghostPath.map((pt, idx) => {
                      const x = scaleX(58 + idx * 2.2);
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
                    x={scaleX(66)}
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
              {tradeSetup.state !== 'WAIT' && (
                <g>
                  <line
                    x1={scaleX(66) - 40}
                    y1={scaleY(tradeSetup.entryPrice) + 40}
                    x2={scaleX(66) - 6}
                    y2={scaleY(tradeSetup.entryPrice) + 8}
                    stroke="#eab308"
                    strokeWidth="2"
                    markerEnd="url(#arrow-yellow)"
                  />
                  <text
                    x={scaleX(66) - 45}
                    y={scaleY(tradeSetup.entryPrice) + 54}
                    textAnchor="end"
                    fill="#eab308"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    price abhi yahan
                  </text>
                  <text
                    x={scaleX(66) - 45}
                    y={scaleY(tradeSetup.entryPrice) + 67}
                    textAnchor="end"
                    fill="#fef08a"
                    fontSize="9"
                  >
                    (Stage {selectedStage}/5: zone tap)
                  </text>
                </g>
              )}

              {/* Interactive Crosshair Overlay */}
              {crosshair && (
                <g pointerEvents="none">
                  {/* Vertical line */}
                  <line
                    x1={crosshair.x}
                    y1={padding.top}
                    x2={crosshair.x}
                    y2={chartHeight - padding.bottom}
                    stroke="#38bdf8"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                  {/* Horizontal line */}
                  <line
                    x1={padding.left}
                    y1={crosshair.y}
                    x2={chartWidth - padding.right}
                    y2={crosshair.y}
                    stroke="#38bdf8"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                  {/* Floating Price Chip on axis */}
                  <rect
                    x={chartWidth - padding.right + 2}
                    y={crosshair.y - 9}
                    width="65"
                    height="18"
                    fill="#0284c7"
                    rx="3"
                  />
                  <text
                    x={chartWidth - padding.right + 6}
                    y={crosshair.y + 4}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="900"
                  >
                    ${crosshair.price}
                  </text>
                </g>
              )}

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
            <div className="flex items-center gap-3">
              <span>Zoom/Pan Enabled: Left-click and drag chart to move anywhere</span>
              <span className="text-slate-600">|</span>
              <span>Scroll wheel to zoom in/out</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">R:R to TP2: {tradeSetup.netRRToTp2}R</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">R:R to TP3: {tradeSetup.netRRToTp3}R</span>
            </div>
          </div>
        </div>

        {/* RIGHT 28%: GOLD ENTRY MODELS PANEL (1:1 Match with User Mockup media_1793442095019_cc358c56.jpg) */}
        <div className="lg:col-span-4 xl:col-span-4 rounded-2xl border border-slate-800 bg-[#080d1a] p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header Title */}
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase block">
                GOLD ENTRY MODELS
              </span>
              <span className="text-xs font-mono text-slate-400 block mt-0.5">
                Active: {tradeSetup.modelName}
              </span>
            </div>

            {/* BIG MASTER VERDICT */}
            <div className="pt-1">
              <h2
                className={`text-3xl sm:text-4xl font-black font-sans tracking-tight ${
                  tradeSetup.state === 'WAIT'
                    ? 'text-amber-400'
                    : tradeSetup.side === 'SHORT'
                    ? 'text-rose-500'
                    : 'text-emerald-400'
                }`}
              >
                {tradeSetup.state === 'WAIT'
                  ? 'WAIT (PATIENCE)'
                  : `${tradeSetup.side} (${tradeSetup.state})`}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 font-mono text-xs">
                <span className="text-slate-300 font-bold">Grade {tradeSetup.grade}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-bold">Q {tradeSetup.qualityScore}/100</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-bold">RR 1:{tradeSetup.netRRToTp2}</span>
              </div>
            </div>

            {/* Stage Progress Bar (S0 > S1 > S2 > [S3] > S4 > S5) */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                <span>Stage:</span>
                <span className="text-[11px] text-amber-200">
                  {['S0: Range', 'S1: Sweep', 'S2: MSS', 'S3: Retest', 'S4: Trigger', 'S5: Targets'][selectedStage]}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      soundEffects.playBlip();
                      setSelectedStage(s);
                    }}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      selectedStage === s
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                        : selectedStage > s
                        ? 'text-emerald-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {selectedStage === s ? `[S${s}]` : `S${s}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Why (Hinglish) Section */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 block font-mono">
                Why (Hinglish):
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
                {tradeSetup.whyBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Anti-Faltu Trade Shield Banner */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-emerald-300 block">Anti-Faltu Trade Shield: ACTIVE</span>
                <span className="text-slate-400 text-[10px]">
                  Faltu entries strictly blocked. Only genuine institutional sweeps + MSS triggers arm.
                </span>
              </div>
            </div>

            {/* Next Trigger */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                Next trigger:
              </span>
              <p className="text-xs text-white font-medium">
                {tradeSetup.nextTrigger}
              </p>
            </div>

            {/* Invalidation Rule */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
              <span className="text-[10px] font-mono font-bold text-rose-300 uppercase block">
                Invalidation:
              </span>
              <p className="text-xs text-rose-200 font-medium">
                {tradeSetup.invalidationRule}
              </p>
            </div>

            {/* Lot Sizing */}
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400 border-t border-slate-800">
              <span>Lot (risk 1% = $100):</span>
              <strong className="text-white font-bold">{tradeSetup.recommendedLot} Lots</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-4 text-[11px] text-slate-500 font-mono text-center">
            Research aid, not investment advice
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM DETAIL WORKSPACE TABS ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ACTION_MAP', label: '🎯 "Kahan Long / Kahan Short" Zone Map' },
              { id: 'ZERO_FALTU_GATES', label: '🛡️ Zero-Faltu Institutional Gates' },
              { id: 'EDUCATIONAL_7_STEPS', label: '📚 7-Step SMC Execution Checklist' },
              { id: 'MODELS_LIBRARY', label: '🏛️ Models M1 to M6' },
              { id: 'MACRO_DRIVERS', label: '🌐 Gold Macro Intelligence' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playBlip();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400">
            Gold Price Feed: <span className="text-emerald-400 font-bold">100% Backed Physical / Spot Proxy</span>
          </div>
        </div>

        {/* TAB 1: KAHAN LONG / KAHAN SHORT ZONE MAP */}
        {activeTab === 'ACTION_MAP' && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Institutional Gold Structure Zones
                </h3>
                <p className="text-xs text-slate-400">
                  Exact demand & supply order blocks with distance in points and triggers needed before entering
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Side</th>
                    <th className="p-2.5">Zone Type</th>
                    <th className="p-2.5">Price Range</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Trigger Needed</th>
                    <th className="p-2.5">Structural Target</th>
                    <th className="p-2.5">Distance</th>
                    <th className="p-2.5">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {zoneMap.map((zone) => (
                    <tr key={zone.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            zone.side === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {zone.side}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-200 font-bold">{zone.type}</td>
                      <td className="p-2.5 text-amber-300 font-bold">
                        ${zone.priceLow} - ${zone.priceHigh}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            zone.status === 'IN_ZONE'
                              ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                              : zone.status === 'APPROACHING'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {zone.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">{zone.triggerNeeded}</td>
                      <td className="p-2.5 text-emerald-400 font-bold">${zone.targetPrice}</td>
                      <td className="p-2.5 text-slate-400">
                        {zone.distancePts === 0 ? '0 pts (At Zone)' : `${zone.distancePts} pts`}
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-amber-400">{zone.qualityScore}/100</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ZERO-FALTU INSTITUTIONAL GATES */}
        {activeTab === 'ZERO_FALTU_GATES' && (
          <div className="pt-4 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300 font-mono">
                  Why Institutional Desks Never Enter Mid-Range (Anti-Faltu Trade Architecture)
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Retail traders lose money because they force trades in the middle 50% chop zone. This engine enforces 6 strict
                  hard gates: price must sweep prior liquidity, close beyond swing structure on a closed candle, tap an extreme discount/premium
                  order block, and have minimum 1.5R room before any setup is armed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tradeSetup.gates.map((g) => (
                <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">{g.ruleCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        g.status === 'PASSED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : g.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white">{g.name}</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">{g.description}</p>
                  <div className="pt-1.5 border-t border-slate-800 text-[11px] font-mono font-bold text-cyan-300">
                    Status: {g.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EDUCATIONAL 7-STEP CHECKLIST */}
        {activeTab === 'EDUCATIONAL_7_STEPS' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: 1, title: 'IDENTIFY LIQUIDITY ZONE', desc: 'Price taking out liquidity above/below recent swing highs where buy/sell stops exist.', color: 'border-emerald-500/40' },
              { step: 2, title: 'LIQUIDITY GRAB (X)', desc: 'Price spikes above the liquidity zone to trigger stops and trap breakout buyers.', color: 'border-blue-500/40' },
              { step: 3, title: 'BOS / MSS SHIFT', desc: 'Price breaks the previous swing structure with candle close, confirming shift.', color: 'border-purple-500/40' },
              { step: 4, title: 'ORDER BLOCK / FVG', desc: 'Price returns to unmitigated Breaker Block or Fair Value Gap where institutions step in.', color: 'border-amber-500/40' },
              { step: 5, title: 'ENTRY TRIGGER', desc: 'Enter on 1m/3m bullish or bearish confirmation candle pattern inside the zone.', color: 'border-emerald-500/40' },
              { step: 6, title: 'RISK MANAGEMENT', desc: 'Stop loss placed strictly beyond the sweep wick extreme + ATR buffer.', color: 'border-rose-500/40' },
              { step: 7, title: 'TARGETS (TP1, 2, 3)', desc: 'Target 1 (Prior Swing), Target 2 (Liquidity Level), Target 3 (Structural Pool).', color: 'border-cyan-500/40' }
            ].map((s) => (
              <div key={s.step} className={`rounded-xl border ${s.color} bg-slate-900/60 p-3.5 space-y-1.5`}>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                    {s.step}
                  </span>
                  <h4 className="text-xs font-bold text-white font-mono">{s.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{s.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: MODELS M1 TO M6 */}
        {activeTab === 'MODELS_LIBRARY' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'M1', name: 'M1: Sweep > MSS > BB Retest', side: 'BEARISH', desc: 'Highs swept with wick, aggressive drop through swing low, retrace to breaker block for short entry down to $$ target.' },
              { id: 'M2', name: 'M2: SSL Sweep > MSS > Demand OB', side: 'BULLISH', desc: 'Sell-side liquidity swept below support, displacement rally breaks previous high, retrace to demand for long entry.' },
              { id: 'M3', name: 'M3: London Open Judas Run', side: 'COUNTER', desc: 'False move at London 12:30 UTC open sweeping Asian range, followed by sharp institutional reversal.' },
              { id: 'M4', name: 'M4: New York Session Retest', side: 'TREND', desc: '13:30 UTC US open continuation tapping 15m Fair Value Gap with volume expansion.' },
              { id: 'M5', name: 'M5: Equal Highs/Lows ($$$) Raid', side: 'SWEEP', desc: 'Engine tracks engineering of equal highs or equal lows and anticipates sweep liquidity raid.' },
              { id: 'M6', name: 'M6: Breaker Block Flip', side: 'FLIP', desc: 'Failed demand block flipped into supply resistance or vice versa after clean displacement.' }
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  soundEffects.playBlip();
                  setActiveModelId(m.id as any);
                }}
                className={`rounded-xl border p-3.5 space-y-1.5 transition-all cursor-pointer ${
                  activeModelId === m.id
                    ? 'border-amber-500 bg-amber-500/15 shadow-lg'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">{m.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{m.side}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{m.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: GOLD MACRO INTELLIGENCE */}
        {activeTab === 'MACRO_DRIVERS' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 font-mono">
              <span className="text-xs font-bold text-slate-400 uppercase block">Macro Fundamentals</span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>DXY (Dollar Index):</span><strong className="text-white">{macroIntel.dxy} ({macroIntel.dxyChange24h >= 0 ? '+' : ''}{macroIntel.dxyChange24h}%)</strong></div>
                <div className="flex justify-between"><span>US 10Y Real Yield:</span><strong className="text-amber-300">{macroIntel.realYield10y}%</strong></div>
                <div className="flex justify-between"><span>Fed Rate Cut Prob:</span><strong className="text-emerald-400">{macroIntel.fedCutProbNext}%</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase block">Bullish Drivers (+)</span>
              <ul className="space-y-1 text-xs text-slate-300">
                {macroIntel.driversBullish.map((d, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{d.factor}:</span>
                    <strong className="text-emerald-300">{d.reading}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase block">Bearish Drivers (-)</span>
              <ul className="space-y-1 text-xs text-slate-300">
                {macroIntel.driversBearish.map((d, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{d.factor}:</span>
                    <strong className="text-rose-300">{d.reading}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Cheatsheet Modal */}
      {showCheatsheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-amber-400 font-mono">
                SMC Institutional Playbook Cheatsheet
              </h3>
              <button
                onClick={() => setShowCheatsheetModal(false)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p><strong>Rule 1:</strong> Trade exists only at a verified Order Block or FVG outside the 40-60% mid-range.</p>
              <p><strong>Rule 2:</strong> Sweep of prior highs/lows (X) is required to ensure retail stop liquidity has been harvested.</p>
              <p><strong>Rule 3:</strong> Closed-candle MSS on execution timeframe confirms displacement in the anticipated trade direction.</p>
              <p><strong>Rule 4:</strong> Minimum 1.5R room to opposing zone required before trigger is armed.</p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowCheatsheetModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer hover:bg-amber-400"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
