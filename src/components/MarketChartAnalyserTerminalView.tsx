import React, { useState, useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import {
  Activity,
  Compass,
  Layers,
  Zap,
  BarChart2,
  Flame,
  Globe,
  RefreshCw,
  ArrowRight,
  Target,
  Eye,
  SlidersHorizontal,
  TrendingDown,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import {
  analyzeChartDeep,
  ChartDeepAnalysisResult
} from '../data/marketChartAnalyserData';

export const MarketChartAnalyserTerminalView: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<'BTCUSDT' | 'XAUUSD' | 'ETHUSDT' | 'SOLUSDT'>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('15m');

  // Live real-time tick prices
  const [livePrice, setLivePrice] = useState<number>(82862);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);

  // Inspector Sub-tab state
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'OVERVIEW' | 'STRUCTURE' | 'TRAJECTORY' | 'ACTION_PLAN' | 'LIQUIDATION' | 'WHALES' | 'NEWS'
  >('OVERVIEW');

  // Deep Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ChartDeepAnalysisResult | null>(() =>
    analyzeChartDeep('BTCUSDT', '15m', 82862)
  );

  // Overlay toggles (Clean default: show Trade Levels & Structure, others on-demand)
  const [showOverlays, setShowOverlays] = useState<{
    tradeLevels: boolean;
    structure: boolean;
    liquidations: boolean;
    whaleFootprint: boolean;
  }>({
    tradeLevels: true,
    structure: true,
    liquidations: false,
    whaleFootprint: false
  });

  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);

  // ─── 1. RUN DEEP ALL-OVER CHART ANALYSIS SCANNER ───
  const handleRunDeepAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const steps = [
      `1/6 Reading Candlestick Microstructure on ${timeframe.toUpperCase()}...`,
      `2/6 Mapping Market Structure: HH/HL/LH/LL, BOS & CHoCH Shifts...`,
      `3/6 Calculating 3-Step Trajectory Roadmap & Liquidity Magnets...`,
      `4/6 Scanning Liquidation Pools & Overleveraged Retail Traps...`,
      `5/6 Inspecting Institutional Order Blocks & CVD Volume Delta...`,
      `6/6 Synthesizing Final Action Plan (Signal, Entry, SL & TP1-3)...`
    ];

    let currentStepIdx = 0;
    setScanStepText(steps[0]);

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        const next = prev + 18;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const freshAnalysis = analyzeChartDeep(selectedSymbol, timeframe, livePrice);
            setAnalysisResult(freshAnalysis);
            setIsAnalyzing(false);
          }, 250);
          return 100;
        }

        const stepIndex = Math.min(Math.floor((next / 100) * steps.length), steps.length - 1);
        if (stepIndex !== currentStepIdx) {
          currentStepIdx = stepIndex;
          setScanStepText(steps[stepIndex]);
        }
        return next;
      });
    }, 220);
  };

  // ─── 2. INITIALIZE LIGHTWEIGHT CANVAS CHART & OVERLAYS ───
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    setChartLoaded(false);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth || 840,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: '#070b14' },
        textColor: '#94a3b8',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#0ea5e9', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#0284c7' },
        horzLine: { color: '#0ea5e9', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#0284c7' }
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      priceLineVisible: false
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    // Add Dynamic Clean On-Chart Price Lines
    if (analysisResult) {
      if (showOverlays.tradeLevels) {
        candleSeries.createPriceLine({
          price: analysisResult.actionablePlan.stopLossPrice,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SL $${analysisResult.actionablePlan.stopLossPrice.toLocaleString()}`
        });

        candleSeries.createPriceLine({
          price: analysisResult.actionablePlan.entryPrice,
          color: '#06b6d4',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ENTRY $${analysisResult.actionablePlan.entryPrice.toLocaleString()}`
        });

        candleSeries.createPriceLine({
          price: analysisResult.actionablePlan.targetTp1,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP1 $${analysisResult.actionablePlan.targetTp1.toLocaleString()}`
        });
      }

      if (showOverlays.structure) {
        candleSeries.createPriceLine({
          price: analysisResult.allOverMarketStructure.pricingZone.equilibrium50,
          color: '#f59e0b',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: true,
          title: `0.50 EQ $${analysisResult.allOverMarketStructure.pricingZone.equilibrium50.toLocaleString()}`
        });

        candleSeries.createPriceLine({
          price: analysisResult.allOverMarketStructure.bosLevel.price,
          color: '#38bdf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `BOS $${analysisResult.allOverMarketStructure.bosLevel.price.toLocaleString()}`
        });
      }

      if (showOverlays.liquidations) {
        candleSeries.createPriceLine({
          price: analysisResult.liquidationData.highLiquidationPrice,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `LIQ $${analysisResult.liquidationData.highLiquidationPrice.toLocaleString()}`
        });
      }

      if (showOverlays.whaleFootprint) {
        candleSeries.createPriceLine({
          price: analysisResult.whaleFootprint.whaleEntryPrice,
          color: '#d97706',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `WHALE $${analysisResult.whaleFootprint.whaleEntryPrice.toLocaleString()}`
        });
      }
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // Seed baseline candles
    const now = Math.floor(Date.now() / 1000);
    const baseP = selectedSymbol === 'BTCUSDT' ? 82862 : selectedSymbol === 'XAUUSD' ? 4185 : selectedSymbol === 'ETHUSDT' ? 2530 : 112.5;
    const initCandles: any[] = [];
    const initVols: any[] = [];
    const stepSec = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : 86400;

    for (let i = 65; i >= 0; i--) {
      const t = now - i * stepSec;
      const cycle = Math.sin(i * 0.16);
      const open = baseP + cycle * (baseP * 0.006);
      const close = open + (Math.sin(i * 0.45) - 0.5) * (baseP * 0.003);
      const high = Math.max(open, close) + Math.abs(Math.sin(i * 0.3)) * (baseP * 0.002);
      const low = Math.min(open, close) - Math.abs(Math.cos(i * 0.3)) * (baseP * 0.002);
      const vol = Math.floor(Math.abs(Math.sin(i * 0.5)) * 140) + 30;

      initCandles.push({ time: t, open, high, low, close });
      initVols.push({
        time: t,
        value: vol,
        color: close >= open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
      });
    }

    candleSeries.setData(initCandles);
    volumeSeries.setData(initVols);

    const latest = initCandles[initCandles.length - 1];
    lastCandleRef.current = latest;
    setLivePrice(latest.close);
    setChartLoaded(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [selectedSymbol, timeframe, showOverlays, analysisResult]);

  // ─── 3. LIVE TICK STREAM SIMULATOR ───
  useEffect(() => {
    const timer = setInterval(() => {
      if (!candleSeriesRef.current || !lastCandleRef.current) return;

      const current = lastCandleRef.current;
      const delta = (Math.random() - 0.495) * (current.close * 0.0004);
      const updatedClose = Number((current.close + delta).toFixed(2));
      const updatedHigh = Math.max(current.high, updatedClose);
      const updatedLow = Math.min(current.low, updatedClose);

      const updatedCandle = {
        ...current,
        high: updatedHigh,
        low: updatedLow,
        close: updatedClose
      };

      candleSeriesRef.current.update(updatedCandle);
      lastCandleRef.current = updatedCandle;
      setLivePrice(updatedClose);
    }, 1800);

    return () => clearInterval(timer);
  }, [selectedSymbol, timeframe]);

  // Handle symbol change
  const handleSelectSymbol = (sym: 'BTCUSDT' | 'XAUUSD' | 'ETHUSDT' | 'SOLUSDT') => {
    setSelectedSymbol(sym);
    const p = sym === 'BTCUSDT' ? 82862 : sym === 'XAUUSD' ? 4185 : sym === 'ETHUSDT' ? 2530 : 112.5;
    setLivePrice(p);
    const fresh = analyzeChartDeep(sym, timeframe, p);
    setAnalysisResult(fresh);
  };

  // Handle timeframe change
  const handleSelectTimeframe = (tf: string) => {
    setTimeframe(tf);
    const fresh = analyzeChartDeep(selectedSymbol, tf, livePrice);
    setAnalysisResult(fresh);
  };

  // Helper for price positioning on Equilibrium bar
  const getEquilibriumProgress = () => {
    if (!analysisResult) return 50;
    const { rangeLow, rangeHigh } = analysisResult.allOverMarketStructure.pricingZone;
    if (rangeHigh <= rangeLow) return 50;
    const pct = ((livePrice - rangeLow) / (rangeHigh - rangeLow)) * 100;
    return Math.min(Math.max(pct, 8), 92);
  };

  // Helper to render text with highlighted financial terms, prices and metrics for crystal clear readability
  const renderHighlightedText = (text: string): React.ReactNode => {
    if (!text) return null;

    // Match currency prices, percentages, technical terms
    const regex = /(\$[0-9,]+(?:\.[0-9]+)?(?:\s*-\s*\$[0-9,]+(?:\.[0-9]+)?)?|[0-9]+(?:\.[0-9]+)?%|\b(?:BOS|CHoCH|FVG|Order Block|Fair Value Gap|Liquidity Pool|Liquidity Sweep|Stop Loss|Take Profit|Equilibrium|Premium Zone|Discount Zone|Lower High|Lower Low|Higher High|Higher Low|Short|Long)\b)/gi;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      if (part.startsWith('$')) {
        return (
          <span
            key={idx}
            className="font-mono font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/25 mx-0.5 inline-block text-[13px] sm:text-sm"
          >
            {part}
          </span>
        );
      }

      if (part.endsWith('%')) {
        return (
          <span
            key={idx}
            className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 mx-0.5 inline-block text-[13px] sm:text-sm"
          >
            {part}
          </span>
        );
      }

      const upper = part.toUpperCase();
      if (['BOS', 'CHOCH', 'FVG', 'ORDER BLOCK', 'FAIR VALUE GAP', 'LIQUIDITY POOL', 'LIQUIDITY SWEEP'].includes(upper)) {
        return (
          <span
            key={idx}
            className="font-semibold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/25 mx-0.5 inline-block text-xs uppercase tracking-wider"
          >
            {part}
          </span>
        );
      }

      if (['PREMIUM ZONE', 'SHORT', 'STOP LOSS', 'LOWER HIGH', 'LOWER LOW'].includes(upper)) {
        return (
          <span
            key={idx}
            className="font-semibold text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/25 mx-0.5 inline-block text-xs"
          >
            {part}
          </span>
        );
      }

      if (['DISCOUNT ZONE', 'LONG', 'TAKE PROFIT', 'HIGHER HIGH', 'HIGHER LOW', 'EQUILIBRIUM'].includes(upper)) {
        return (
          <span
            key={idx}
            className="font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 mx-0.5 inline-block text-xs"
          >
            {part}
          </span>
        );
      }

      return part;
    });
  };

  return (
    <div className="w-full space-y-6 text-slate-100 font-sans pb-12">
      {/* ────────────────── 1. COMPACT INSTITUTIONAL COMMAND RIBBON ────────────────── */}
      <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070c18] p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Row 1: Header Brand, Live Telemetry & Primary Scan Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Market Chart AI Analyzer
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-600/60 uppercase tracking-wider">
                  SMC · ICT Quant
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-600/50 text-[11px] font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Engine</span>
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-400 font-normal mt-1">
                Autonomous Smart Money Structure, Liquidity Pools & 3-Step Predictive Trajectory Roadmap
              </p>
            </div>
          </div>

          {/* Action Trigger Button + Live Price Chip */}
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#060a13] border border-slate-800 text-right shadow-inner">
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Live Tick</div>
              <div className="font-mono text-base font-bold text-white leading-tight">
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <button
              onClick={handleRunDeepAnalysis}
              disabled={isAnalyzing}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0 ${
                isAnalyzing
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border border-cyan-400/50 hover:shadow-cyan-500/30 active:scale-[0.98]'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? `Scanning (${analysisProgress}%)...` : '⚡ Re-Scan Chart'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Asset Switcher & Timeframe Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Asset Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#060a13] rounded-xl border border-slate-800/90 overflow-x-auto">
            <button
              onClick={() => handleSelectSymbol('BTCUSDT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedSymbol === 'BTCUSDT'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>₿</span>
              <span>Bitcoin (BTC)</span>
            </button>
            <button
              onClick={() => handleSelectSymbol('XAUUSD')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedSymbol === 'XAUUSD'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>🥇</span>
              <span>Gold (XAU/USD)</span>
            </button>
            <button
              onClick={() => handleSelectSymbol('ETHUSDT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedSymbol === 'ETHUSDT'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Ξ</span>
              <span>Ethereum (ETH)</span>
            </button>
            <button
              onClick={() => handleSelectSymbol('SOLUSDT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedSymbol === 'SOLUSDT'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>◎</span>
              <span>Solana (SOL)</span>
            </button>
          </div>

          {/* Timeframe Chips */}
          <div className="flex items-center gap-1 p-1 bg-[#060a13] rounded-xl border border-slate-800/90 text-xs overflow-x-auto self-start md:self-auto">
            {['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => handleSelectTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Scan Progress Bar */}
        {isAnalyzing && (
          <div className="p-3.5 bg-[#060a13] rounded-xl border border-cyan-500/40 space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs font-medium text-cyan-200">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{scanStepText}</span>
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">{analysisProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-200"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ────────────────── 2. EXECUTIVE DIAGNOSTIC GRID: 4 CORE ANSWERS ────────────────── */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: Market Abhi Kya Kar Raha Hai? */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#0b101f] to-[#070b14] border border-slate-800/90 border-t-[3px] border-t-amber-400 p-6 sm:p-7 shadow-2xl space-y-4 hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    1. Market Abhi Kya Kar Raha Hai?
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Real-Time Microstructure Diagnosis</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                {analysisResult.allOverMarketStructure.marketPhaseLabel}
              </span>
            </div>

            {/* Clear Hinglish Explanation */}
            <div className="p-4 rounded-xl bg-[#060a14]/90 border border-slate-800/80">
              <p className="text-[14px] sm:text-[14.5px] text-slate-100 font-normal leading-relaxed">
                {renderHighlightedText(analysisResult.marketConditionQuickSummaryHinglish)}
              </p>
            </div>

            {/* Metric Strips (Spacious 2-column) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-[#060a14] p-3.5 rounded-xl border border-slate-800/90 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Candlestick Pattern</span>
                <span className="text-white font-bold text-sm block">
                  {analysisResult.candlestickPattern}
                </span>
                <span className="text-[11px] text-slate-400 block">Wick rejection at institutional order level</span>
              </div>
              <div className="bg-[#060a14] p-3.5 rounded-xl border border-rose-500/30 space-y-1">
                <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider block">Retail Trap Status</span>
                <span className="text-rose-300 font-bold text-sm block">
                  Retail Longs Trapped
                </span>
                <span className="text-[11px] text-rose-300/80 block">Breakout buyers vulnerable to fast stop sweep</span>
              </div>
            </div>
          </div>

          {/* Card 2: Market Ka Structure Kya Hai? */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#0b101f] to-[#070b14] border border-slate-800/90 border-t-[3px] border-t-cyan-400 p-6 sm:p-7 shadow-2xl space-y-4 hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    2. Market Ka Structure Kya Hai?
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">SMC Order Flow & Equilibrium Valuation</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
                {analysisResult.allOverMarketStructure.pricingZone.currentZoneLabel}
              </span>
            </div>

            {/* Trend Summary */}
            <div className="p-4 rounded-xl bg-[#060a14]/90 border border-slate-800/80">
              <p className="text-[14px] sm:text-[14.5px] text-slate-100 font-medium leading-relaxed">
                {renderHighlightedText(analysisResult.allOverMarketStructure.trendSequenceLabel)}
              </p>
            </div>

            {/* Visual Equilibrium Bar (Discount vs Premium Gauge) */}
            <div className="p-4 rounded-xl bg-[#060a14]/90 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span>🟢</span>
                  <span>Discount (Buy Zone)</span>
                </span>
                <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/25">
                  0.50 EQ: ${analysisResult.allOverMarketStructure.pricingZone.equilibrium50.toLocaleString()}
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <span>🔴</span>
                  <span>Premium (Sell Zone)</span>
                </span>
              </div>

              {/* Progress track with vibrant gradient and center 0.50 notch */}
              <div
                className="relative w-full h-4 rounded-full border border-slate-700/80 overflow-visible shadow-inner"
                style={{
                  background: 'linear-gradient(to right, #10b981 0%, #34d399 28%, #f59e0b 50%, #fb7185 75%, #ef4444 100%)'
                }}
              >
                {/* Center equilibrium divider */}
                <div className="absolute left-1/2 -top-1 -bottom-1 w-0.5 bg-white shadow-sm z-10" />
                {/* Pointer marker */}
                <div
                  className="absolute -top-1.5 -bottom-1.5 w-4 bg-white rounded-full shadow-[0_0_12px_#ffffff] -translate-x-1/2 border-2 border-slate-950 z-20 cursor-pointer"
                  style={{ left: `${getEquilibriumProgress()}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
                <span>Floor: <b className="text-slate-200 font-mono">{analysisResult.allOverMarketStructure.swingLow.formatted}</b></span>
                <span className="text-amber-300 font-semibold">Current Price: {analysisResult.allOverMarketStructure.pricingZone.fibPercentage} Area</span>
                <span>Ceiling: <b className="text-slate-200 font-mono">{analysisResult.allOverMarketStructure.swingHigh.formatted}</b></span>
              </div>
            </div>

            {/* BOS and CHoCH Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#060a14] p-3 rounded-xl border border-slate-800/90 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">BOS Break Level</span>
                  <span className="text-[11px] text-slate-400">Trend continuation target</span>
                </div>
                <span className="font-mono text-cyan-300 font-bold text-sm">{analysisResult.allOverMarketStructure.bosLevel.formatted}</span>
              </div>
              <div className="bg-[#060a14] p-3 rounded-xl border border-slate-800/90 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">CHoCH Structure Shift</span>
                  <span className="text-[11px] text-slate-400">Bullish reversal invalidation</span>
                </div>
                <span className="font-mono text-orange-300 font-bold text-sm">{analysisResult.allOverMarketStructure.chochLevel.formatted}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Market Abhi Kahan Ja Sakta Hai? */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#0b101f] to-[#070b14] border border-slate-800/90 border-t-[3px] border-t-emerald-400 p-6 sm:p-7 shadow-2xl space-y-4 hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    3. Market Abhi Kahan Ja Sakta Hai?
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">High Probability Trajectory Path</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                {analysisResult.trajectoryRoadmap.primaryPath.probabilityPct}% Probability
              </span>
            </div>

            {/* Hinglish Explanation */}
            <div className="p-4 rounded-xl bg-[#060a14]/90 border border-slate-800/80">
              <p className="text-[14px] sm:text-[14.5px] text-slate-100 font-normal leading-relaxed">
                {renderHighlightedText(analysisResult.whereMarketCanGoQuickSummaryHinglish)}
              </p>
            </div>

            {/* 3-Step Visual Connected Sequence */}
            <div className="p-4 bg-[#060a14]/90 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Concrete 3-Step Execution Sequence:
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
                {analysisResult.trajectoryRoadmap.primaryPath.steps.map((step, idx) => (
                  <div
                    key={step.stepNumber}
                    className={`p-3 rounded-xl border relative shadow-sm ${
                      idx === 0
                        ? 'bg-gradient-to-b from-[#081524] to-[#040c14] border-cyan-500/40'
                        : idx === 1
                        ? 'bg-gradient-to-b from-[#1b1408] to-[#0d0904] border-amber-500/40'
                        : 'bg-gradient-to-b from-[#081b13] to-[#040e0a] border-emerald-500/40'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        idx === 0 ? 'text-cyan-300' : idx === 1 ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      Step {step.stepNumber}
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-white mt-1">
                      {step.priceLevel}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-1">
                      {step.phaseTitle}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Target & Time */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400">
              <span>Primary Liquidity Target: <b className="text-emerald-300 font-mono text-sm ml-1">{analysisResult.primaryScenario.formattedTarget}</b></span>
              <span className="text-slate-400">Time Horizon: <b className="text-slate-200">{analysisResult.primaryScenario.timeExpectancy}</b></span>
            </div>
          </div>

          {/* Card 4: Action Advice: Kya Karna Hai? */}
          <div className="rounded-2xl bg-gradient-to-b from-[#1b1022] via-[#120b18] to-[#0a0710] border border-rose-500/50 border-t-[3px] border-t-rose-500 p-6 sm:p-7 shadow-2xl space-y-4 hover:border-rose-500/70 transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-rose-900/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-rose-200 tracking-tight">
                    4. Action Advice: Kya Karna Hai?
                  </h3>
                  <span className="text-[11px] text-rose-300/70 font-medium">Execution Rules, Triggers & Invalidation</span>
                </div>
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md">
                {analysisResult.actionablePlan.signal}
              </span>
            </div>

            {/* High-Impact Directive Advice Box */}
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/40">
              <p className="text-[14px] sm:text-[14.5px] text-rose-100 font-medium leading-relaxed">
                {renderHighlightedText(analysisResult.actionablePlan.whatToDoNowHinglish)}
              </p>
            </div>

            {/* 4 Execution Metric Tiles in Spacious 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-gradient-to-br from-[#06182a] to-[#030d17] p-3.5 rounded-xl border border-cyan-500/40 space-y-1 shadow-sm">
                <span className="text-cyan-300 text-[10px] block uppercase font-bold tracking-wider">Entry Execution Zone</span>
                <span className="font-mono text-cyan-200 font-bold text-sm block">
                  {analysisResult.actionablePlan.entryZone}
                </span>
                <span className="text-[11px] text-slate-400 block">Mode: {analysisResult.actionablePlan.executionMode}</span>
              </div>
              <div className="bg-gradient-to-br from-[#230a14] to-[#12050a] p-3.5 rounded-xl border border-rose-500/40 space-y-1 shadow-sm">
                <span className="text-rose-400 text-[10px] block uppercase font-bold tracking-wider">Invalidation Stop Loss</span>
                <span className="font-mono text-rose-300 font-bold text-sm block">
                  ${analysisResult.actionablePlan.stopLossPrice.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block">Exit if candle closes above ceiling</span>
              </div>
              <div className="bg-gradient-to-br from-[#082015] to-[#04100b] p-3.5 rounded-xl border border-emerald-500/40 space-y-1 shadow-sm">
                <span className="text-emerald-400 text-[10px] block uppercase font-bold tracking-wider">Take Profit Targets</span>
                <span className="font-mono text-emerald-300 font-bold text-sm block">
                  TP1: ${analysisResult.actionablePlan.targetTp1.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-400/80 block">TP2: ${analysisResult.actionablePlan.targetTp2.toLocaleString()} · TP3: ${analysisResult.actionablePlan.targetTp3.toLocaleString()}</span>
              </div>
              <div className="bg-gradient-to-br from-[#211708] to-[#110b03] p-3.5 rounded-xl border border-amber-500/40 space-y-1 shadow-sm">
                <span className="text-amber-400 text-[10px] block uppercase font-bold tracking-wider">Risk / Reward Ratio</span>
                <span className="font-mono text-amber-300 font-bold text-sm block">
                  {analysisResult.actionablePlan.rewardToRisk}
                </span>
                <span className="text-[11px] text-slate-400 block">Quant Score: {analysisResult.actionablePlan.quantScore}/10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── 3. LIVE CANDLESTICK CHART VIEWPORT ────────────────── */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#070b14] overflow-hidden shadow-2xl">
        {/* Chart Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 bg-[#0b101d] border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight">{selectedSymbol}</span>
              <span className="text-xs font-mono font-semibold text-slate-400">({timeframe.toUpperCase()})</span>
            </div>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <span className="text-sm sm:text-base font-mono font-bold text-white">
              ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Clean Overlay Switches */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1 hidden sm:inline">Chart Overlays:</span>
            <button
              onClick={() => setShowOverlays((p) => ({ ...p, tradeLevels: !p.tradeLevels }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showOverlays.tradeLevels
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-[#060a13] text-slate-500 border-slate-800'
              }`}
            >
              SL / Entry / TP
            </button>
            <button
              onClick={() => setShowOverlays((p) => ({ ...p, structure: !p.structure }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showOverlays.structure
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-[#060a13] text-slate-500 border-slate-800'
              }`}
            >
              SMC Levels (EQ & BOS)
            </button>
            <button
              onClick={() => setShowOverlays((p) => ({ ...p, liquidations: !p.liquidations }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showOverlays.liquidations
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-[#060a13] text-slate-500 border-slate-800'
              }`}
            >
              Liquidation Pool
            </button>
            <button
              onClick={() => setShowOverlays((p) => ({ ...p, whaleFootprint: !p.whaleFootprint }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showOverlays.whaleFootprint
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-[#060a13] text-slate-500 border-slate-800'
              }`}
            >
              Whale Order Wall
            </button>
          </div>
        </div>

        {/* Lightweight Charts Canvas */}
        <div className="relative w-full h-[500px]">
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* ────────────────── 4. NEAT SEGMENTED INSPECTOR TABS ────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveInspectorTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'OVERVIEW'
              ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Full Overview</span>
        </button>
        <button
          onClick={() => setActiveInspectorTab('STRUCTURE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'STRUCTURE'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Market Structure (SMC)</span>
        </button>
        <button
          onClick={() => setActiveInspectorTab('TRAJECTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'TRAJECTORY'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Trajectory Roadmap</span>
        </button>
        <button
          onClick={() => setActiveInspectorTab('ACTION_PLAN')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'ACTION_PLAN'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>Execution Trade Plan</span>
        </button>
        <button
          onClick={() => setActiveInspectorTab('LIQUIDATION')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'LIQUIDATION'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Liquidation Heatmap</span>
        </button>
        <button
          onClick={() => setActiveInspectorTab('WHALES')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'WHALES'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Whales & CVD Delta</span>
        </button>
        <button
          onClick={() => setActiveInspectorTab('NEWS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
            activeInspectorTab === 'NEWS'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
              : 'bg-[#0b101d] text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Macro Radar</span>
        </button>
      </div>

      {/* ────────────────── 5. DETAILED INSPECTION SECTIONS ────────────────── */}
      {analysisResult && (
        <div className="space-y-4">
          {/* SECTION: ALL-OVER STRUCTURE */}
          {(activeInspectorTab === 'OVERVIEW' || activeInspectorTab === 'STRUCTURE') && (
            <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>Smart Money Market Structure (SMC / ICT Analysis)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Swing Highs, Swing Lows, Break of Structure (BOS), Change of Character (CHoCH) aur Fair Value Gaps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                    Phase: {analysisResult.allOverMarketStructure.marketPhaseLabel}
                  </span>
                </div>
              </div>

              {/* 4 Clean Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#060a13] p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">Swing High & Low</span>
                  <div>
                    <span className="text-[11px] text-slate-400 block">High (Ceiling):</span>
                    <span className="text-sm font-mono text-white font-bold">{analysisResult.allOverMarketStructure.swingHigh.formatted}</span>
                    <span className="text-[11px] text-rose-400 block mt-0.5">{analysisResult.allOverMarketStructure.swingHigh.status}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Low (Floor):</span>
                    <span className="text-sm font-mono text-slate-300 font-bold">{analysisResult.allOverMarketStructure.swingLow.formatted}</span>
                  </div>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 block uppercase tracking-wider">BOS & CHoCH Shifts</span>
                  <div>
                    <span className="text-[11px] text-slate-400 block">BOS Level:</span>
                    <span className="text-sm font-mono text-cyan-300 font-bold">{analysisResult.allOverMarketStructure.bosLevel.formatted}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{analysisResult.allOverMarketStructure.bosLevel.status}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 block">CHoCH Level:</span>
                    <span className="text-sm font-mono text-orange-300 font-bold">{analysisResult.allOverMarketStructure.chochLevel.formatted}</span>
                  </div>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-xs font-bold text-purple-400 block uppercase tracking-wider">Valuation Equilibrium</span>
                  <div>
                    <span className="text-[11px] text-slate-400 block">0.50 Equilibrium:</span>
                    <span className="text-sm font-mono text-amber-300 font-bold">${analysisResult.allOverMarketStructure.pricingZone.equilibrium50.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Fib Depth:</span>
                    <span className="text-xs text-purple-300 font-semibold">{analysisResult.allOverMarketStructure.pricingZone.fibPercentage}</span>
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed pt-1 border-t border-slate-800">
                    {renderHighlightedText(analysisResult.allOverMarketStructure.pricingZone.adviceHinglish)}
                  </p>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">Fair Value Gaps (FVG)</span>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Bearish FVG (Supply):</span>
                    <span className="text-xs font-mono text-rose-300 font-bold">{analysisResult.allOverMarketStructure.fairValueGaps.bearishFvg.formatted}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Bullish FVG (Demand):</span>
                    <span className="text-xs font-mono text-emerald-300 font-bold">{analysisResult.allOverMarketStructure.fairValueGaps.bullishFvg.formatted}</span>
                  </div>
                </div>
              </div>

              {/* Complete Structure Read */}
              <div className="p-4 bg-[#060a14] rounded-xl border border-slate-800/90 text-xs sm:text-[13px] text-slate-200 leading-relaxed space-y-1.5">
                <span className="text-slate-400 font-bold block text-[11px] uppercase tracking-wider">
                  Summary Synthesis:
                </span>
                <p className="text-sm text-slate-100 leading-relaxed">{renderHighlightedText(analysisResult.allOverMarketStructure.structureSummaryHinglish)}</p>
              </div>
            </div>
          )}

          {/* SECTION: 3-STEP TRAJECTORY ROADMAP */}
          {(activeInspectorTab === 'OVERVIEW' || activeInspectorTab === 'TRAJECTORY') && (
            <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Compass className="h-4 w-4 text-emerald-400" />
                    <span>Where Market Can Go (3-Step Concrete Trajectory)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Price path sequence, probability estimates, aur liquidity gravity magnets.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {analysisResult.trajectoryRoadmap.primaryPath.probabilityPct}% Probability · {analysisResult.trajectoryRoadmap.primaryPath.timeframeForecast}
                </span>
              </div>

              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysisResult.trajectoryRoadmap.primaryPath.steps.map((st) => (
                  <div key={st.stepNumber} className="bg-[#060a13] p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="h-6 w-6 rounded-full bg-slate-800 text-cyan-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                        {st.stepNumber}
                      </span>
                      <span className="font-mono text-xs text-emerald-300 font-bold">{st.priceLevel}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 block">{st.phaseTitle}</span>
                    <p className="text-[13px] text-slate-200 leading-relaxed">
                      {renderHighlightedText(st.expectedBehavior)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Magnets + Alternative Invalidation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-[#060a13] p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-300 block uppercase tracking-wider">
                    Liquidity Gravity Magnets
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center bg-[#0b101d] p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400">Lower Magnet (Target):</span>
                      <span className="font-mono text-rose-300 font-bold">{analysisResult.trajectoryRoadmap.liquidityMagnets.lowerMagnetPrice} ({analysisResult.trajectoryRoadmap.liquidityMagnets.lowerMagnetVolume})</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#0b101d] p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400">Upper Magnet (Stops):</span>
                      <span className="font-mono text-cyan-300 font-bold">{analysisResult.trajectoryRoadmap.liquidityMagnets.upperMagnetPrice} ({analysisResult.trajectoryRoadmap.liquidityMagnets.upperMagnetVolume})</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed pt-1">
                    {renderHighlightedText(analysisResult.trajectoryRoadmap.liquidityMagnets.explanationHinglish)}
                  </p>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      Alternative Invalidation Path
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-orange-500/15 text-orange-300 border border-orange-500/30">
                      {analysisResult.trajectoryRoadmap.alternativePath.probabilityPct}% Prob
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    Trigger Level: <span className="font-mono text-orange-300 font-bold">{analysisResult.trajectoryRoadmap.alternativePath.invalidationTriggerPrice}</span>
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed">
                    {renderHighlightedText(analysisResult.trajectoryRoadmap.alternativePath.catalystReasonHinglish)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: EXECUTION TRADE PLAN */}
          {(activeInspectorTab === 'OVERVIEW' || activeInspectorTab === 'ACTION_PLAN') && (
            <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Target className="h-4 w-4 text-rose-400" />
                    <span>Complete Tactical Trade Execution Plan</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Precise trigger levels, invalidation boundary, risk-reward ratios, aur profit-taking tiers.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Signal: {analysisResult.actionablePlan.signal}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#060a13] p-4 rounded-xl border border-cyan-500/30 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Entry Execution Zone</span>
                  <div className="text-base font-mono font-bold text-cyan-300">
                    {analysisResult.actionablePlan.entryZone}
                  </div>
                  <span className="text-[10px] text-slate-400">Mode: {analysisResult.actionablePlan.executionMode}</span>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-rose-500/30 space-y-1">
                  <span className="text-[11px] text-rose-400 uppercase font-semibold">Invalidation Stop Loss</span>
                  <div className="text-base font-mono font-bold text-rose-300">
                    ${analysisResult.actionablePlan.stopLossPrice.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Trigger: Close Above Ceiling</span>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] text-emerald-400 uppercase font-semibold">Take Profit Targets</span>
                  <div className="text-sm font-mono font-bold text-emerald-300">
                    TP1: ${analysisResult.actionablePlan.targetTp1.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    TP2: ${analysisResult.actionablePlan.targetTp2.toLocaleString()} | TP3: ${analysisResult.actionablePlan.targetTp3.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#060a13] p-4 rounded-xl border border-amber-500/30 space-y-1">
                  <span className="text-[11px] text-amber-400 uppercase font-semibold">Risk / Reward & Confidence</span>
                  <div className="text-base font-mono font-bold text-amber-300">
                    {analysisResult.actionablePlan.rewardToRisk}
                  </div>
                  <span className="text-[10px] text-slate-400">Quant Score: {analysisResult.actionablePlan.quantScore}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: LIQUIDATIONS & WHALES */}
          {(activeInspectorTab === 'OVERVIEW' || activeInspectorTab === 'LIQUIDATION' || activeInspectorTab === 'WHALES') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="h-4 w-4" />
                    <span>Liquidation Heatmap & Trap Clusters</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded">
                    {analysisResult.liquidationData.highLiquidationIntensity} Intensity
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between bg-[#060a13] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">High Liq Cluster:</span>
                    <span className="font-mono text-rose-300 font-bold">{analysisResult.liquidationData.highLiquidationFormatted}</span>
                  </div>
                  <div className="flex justify-between bg-[#060a13] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Estimated Size:</span>
                    <span className="font-mono text-white font-bold">{analysisResult.liquidationData.highLiquidationVolumeUsd}</span>
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed pt-1">
                    {renderHighlightedText(analysisResult.liquidationData.highLiquidationNote)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4" />
                    <span>Whale Order Walls & CVD Delta</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                    {analysisResult.whaleFootprint.confidenceGrade}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between bg-[#060a13] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Whale Wall:</span>
                    <span className="font-mono text-amber-300 font-bold">{analysisResult.whaleFootprint.whaleEntryFormatted}</span>
                  </div>
                  <div className="flex justify-between bg-[#060a13] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">CVD Volume Delta:</span>
                    <span className="font-mono text-rose-300 font-bold">{analysisResult.whaleFootprint.observedVolumeDelta}</span>
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed pt-1">
                    {renderHighlightedText(analysisResult.whaleFootprint.detailsHinglish)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: MACRO EVENTS */}
          {(activeInspectorTab === 'OVERVIEW' || activeInspectorTab === 'NEWS') && (
            <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-xs sm:text-sm font-bold text-blue-300">Macro Event Radar:</span>
                  <span className="text-xs text-white font-medium">{analysisResult.newsImpact.upcomingHeadline}</span>
                </div>
                <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed">
                  {renderHighlightedText(analysisResult.newsImpact.eventAdviceHinglish)} ({analysisResult.newsImpact.crossAssetImpact})
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Countdown</span>
                  <span className="font-mono text-xs font-bold text-amber-300">{analysisResult.newsImpact.timeToEvent}</span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {analysisResult.newsImpact.volatilityRisk} Volatility
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketChartAnalyserTerminalView;
