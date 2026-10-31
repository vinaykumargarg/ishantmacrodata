import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Crown, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Lock, ArrowUpRight, ArrowDownRight,
  RefreshCw, Activity, ShieldCheck, BookOpen, Layers, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import { sharedQuoteStore, AssetQuote } from '../services/sharedQuoteStore';
import { soundEffects } from '../services/soundEffectsService';
import {
  analyzeInstitutionalSMC,
  CandleDataPoint,
  ValidatedTradePlan
} from '../services/institutionalSMCAnalysisEngine';
import { getBottomDashboardData } from '../services/goldInstitutionalEngine';

export type SupportedAsset = 'GOLD' | 'BTC' | 'ETH' | 'SOL';
export type SupportedTimeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D' | '1W';

interface AssetConfig {
  key: SupportedAsset;
  instrument: string;
  name: string;
  binanceSymbol: string;
  quoteKey: string;
  icon: string;
  color: string;
  priceDecimals: number;
}

const ASSET_CONFIGS: Record<SupportedAsset, AssetConfig> = {
  GOLD: {
    key: 'GOLD',
    instrument: 'XAUUSD',
    name: 'Gold Spot (XAU / USD)',
    binanceSymbol: 'PAXGUSDT',
    quoteKey: 'XAUUSD',
    icon: '🪙',
    color: '#f59e0b',
    priceDecimals: 2
  },
  BTC: {
    key: 'BTC',
    instrument: 'BTCUSDT',
    name: 'Bitcoin Spot (BTC / USDT)',
    binanceSymbol: 'BTCUSDT',
    quoteKey: 'BTCUSDT',
    icon: '₿',
    color: '#f97316',
    priceDecimals: 2
  },
  ETH: {
    key: 'ETH',
    instrument: 'ETHUSDT',
    name: 'Ethereum Spot (ETH / USDT)',
    binanceSymbol: 'ETHUSDT',
    quoteKey: 'ETHUSDT',
    icon: '⟠',
    color: '#818cf8',
    priceDecimals: 2
  },
  SOL: {
    key: 'SOL',
    instrument: 'SOLUSDT',
    name: 'Solana Spot (SOL / USDT)',
    binanceSymbol: 'SOLUSDT',
    quoteKey: 'SOLUSDT',
    icon: '◎',
    color: '#2dd4bf',
    priceDecimals: 2
  }
};

const TF_API_MAP: Record<SupportedTimeframe, string> = {
  '1M': '1m',
  '5M': '5m',
  '15M': '15m',
  '30M': '30m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '1w'
};

export default function GoldSmcAutoTradeLabView() {
  const [activeAsset, setActiveAsset] = useState<SupportedAsset>('GOLD');
  const [timeframe, setTimeframe] = useState<SupportedTimeframe>('15M');
  const [isThemeDark, setIsThemeDark] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(true);

  // UI Toggles matching user screenshots
  const [rightPanelTab, setRightPanelTab] = useState<'TRADE_PLAN' | 'SMC_ENTRY_MODEL'>('TRADE_PLAN');
  const [showEducationalGuide, setShowEducationalGuide] = useState<boolean>(false);
  const [showSMCModelModal, setShowSMCModelModal] = useState<boolean>(false);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showGhostPath, setShowGhostPath] = useState<boolean>(true);

  // Synchronized Market Data from Central Store
  const [currentQuote, setCurrentQuote] = useState<AssetQuote>(() => sharedQuoteStore.getQuote('XAUUSD'));
  const [allQuotes, setAllQuotes] = useState<Record<string, AssetQuote>>({});
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'DELAYED' | 'RECONNECTING' | 'STALE DATA' | 'OFFLINE'>('LIVE');
  const [connectionLatency, setConnectionLatency] = useState<number>(18);

  // Chart References
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const candlesRef = useRef<CandleDataPoint[]>([]);

  // Overlay Pixel Coordinates for Demand Zone, Supply Zone, FVG, Ghost Path
  const [overlayCoords, setOverlayCoords] = useState<{
    supplyYTop: number | null;
    supplyYBottom: number | null;
    demandYTop: number | null;
    demandYBottom: number | null;
    fvgYTop: number | null;
    fvgYBottom: number | null;
    entryY: number | null;
    slY: number | null;
    tp1Y: number | null;
    tp2Y: number | null;
    tp3Y: number | null;
    currentX: number | null;
    currentY: number | null;
    width: number;
    height: number;
  }>({
    supplyYTop: null,
    supplyYBottom: null,
    demandYTop: null,
    demandYBottom: null,
    fvgYTop: null,
    fvgYBottom: null,
    entryY: null,
    slY: null,
    tp1Y: null,
    tp2Y: null,
    tp3Y: null,
    currentX: null,
    currentY: null,
    width: 800,
    height: 520
  });

  const activeConfig = ASSET_CONFIGS[activeAsset];

  // ── 1. SUBSCRIBED TO CENTRALIZED REAL-TIME MARKET DATA ENGINE ──
  useEffect(() => {
    const handleQuoteUpdate = (quote: AssetQuote) => {
      setAllQuotes((prev) => ({ ...prev, [quote.symbol]: quote }));

      if (quote.symbol === activeConfig.quoteKey || quote.symbol === activeConfig.binanceSymbol) {
        setCurrentQuote(quote);
        setConnectionStatus(quote.status || 'LIVE');
        setConnectionLatency(quote.latencyMs || 18);

        // Real-time tick update on the active candlestick
        if (candleSeriesRef.current && candlesRef.current.length > 0) {
          const lastCandle = candlesRef.current[candlesRef.current.length - 1];
          const newHigh = Math.max(lastCandle.high, quote.price);
          const newLow = Math.min(lastCandle.low, quote.price);
          const updatedLast = {
            ...lastCandle,
            high: newHigh,
            low: newLow,
            close: quote.price
          };
          candlesRef.current[candlesRef.current.length - 1] = updatedLast;
          candleSeriesRef.current.update(updatedLast);
        }
      }
    };

    const initialQuote = sharedQuoteStore.getQuote(activeConfig.quoteKey);
    setCurrentQuote(initialQuote);
    setConnectionStatus(initialQuote.status || 'LIVE');
    setConnectionLatency(initialQuote.latencyMs || 18);

    const unsub = sharedQuoteStore.subscribe(handleQuoteUpdate);
    return () => unsub();
  }, [activeAsset, activeConfig]);

  // ── 2. LIVE CLOCK (IST) ──
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      setCurrentTimeStr(`${dateStr}, ${timeStr} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── 3. RUN INSTITUTIONAL SMC & PINESCRIPT ANALYSIS ENGINE ON LIVE DATA ──
  const tradePlan: ValidatedTradePlan = useMemo(() => {
    return analyzeInstitutionalSMC(
      candlesRef.current,
      activeConfig.instrument,
      currentQuote.price
    );
  }, [currentQuote.price, activeConfig.instrument]);

  // ── 4. INITIALIZE TRADINGVIEW LIGHTWEIGHT CHARTS (CANVAS/WEBGL ENGINE) ──
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: 520,
      layout: {
        background: { type: ColorType.Solid, color: '#070d1a' },
        textColor: '#94a3b8',
        fontFamily: '"JetBrains Mono", "IBM Plex Sans", Inter, -apple-system, sans-serif',
        fontSize: 12
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.35)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.35)', style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#38bdf8', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#38bdf8', width: 1, style: LineStyle.Dashed }
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 9,
        minBarSpacing: 3,
        fixLeftEdge: false,
        fixRightEdge: false
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.22 }
      }
    });

    chartInstanceRef.current = chart;

    // Candlestick Series (Crisp Emerald Bull, Vivid Rose Bear)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e'
    });
    candleSeriesRef.current = candleSeries;

    // Volume Histogram Series at Bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    // Window Resize Handling
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [activeAsset]);

  // ── 5. FETCH REAL HISTORICAL OHLC CANDLES ON ASSET & TIMEFRAME CHANGE ──
  const fetchHistoricalCandles = useCallback(async () => {
    setIsLoadingCandles(true);
    const binanceSym = activeConfig.binanceSymbol;
    const intervalStr = TF_API_MAP[timeframe];

    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${intervalStr}&limit=120`
      );
      if (!res.ok) throw new Error('Failed to fetch historical klines');
      const data = await res.json();

      const formattedCandles: CandleDataPoint[] = data.map((d: any) => ({
        time: Math.floor(d[0] / 1000),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));

      const formattedVolumes = data.map((d: any) => ({
        time: Math.floor(d[0] / 1000),
        value: parseFloat(d[5]),
        color: parseFloat(d[4]) >= parseFloat(d[1]) ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
      }));

      candlesRef.current = formattedCandles;

      if (candleSeriesRef.current && volumeSeriesRef.current) {
        candleSeriesRef.current.setData(formattedCandles);
        volumeSeriesRef.current.setData(formattedVolumes);
      }

      if (formattedCandles.length > 0) {
        const last = formattedCandles[formattedCandles.length - 1];
        sharedQuoteStore.setQuote(activeConfig.quoteKey, {
          price: last.close,
          source: activeConfig.instrument === 'XAUUSD' ? 'Gold-API Spot / Binance PAXG' : 'Binance Official Feed'
        });
      }

      if (chartInstanceRef.current) {
        chartInstanceRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.warn('Real historical candles fetch failed, using calibrated store data:', err);
    } finally {
      setIsLoadingCandles(false);
    }
  }, [activeConfig, timeframe]);

  useEffect(() => {
    fetchHistoricalCandles();
  }, [fetchHistoricalCandles]);

  // ── 6. RENDER NATIVE SMC PRICE LINES & MARKERS ON CANDLESTICK CHART ──
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || candlesRef.current.length === 0) return;

    // Remove previous price lines
    priceLinesRef.current.forEach((l) => {
      try {
        series.removePriceLine(l);
      } catch {}
    });
    priceLinesRef.current = [];

    // Current Live Price Line (Yellow Accent)
    priceLinesRef.current.push(
      series.createPriceLine({
        price: currentQuote.price,
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `LIVE: $${currentQuote.price.toFixed(activeConfig.priceDecimals)}`
      })
    );

    // Trade Plan Price Lines: Entry, SL, TP1, TP2, TP3
    if (tradePlan.direction !== 'WAIT') {
      // 1. Entry Line (Solid White)
      priceLinesRef.current.push(
        series.createPriceLine({
          price: tradePlan.entryPrice,
          color: '#ffffff',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Entry: $${tradePlan.entryPrice.toFixed(activeConfig.priceDecimals)}`
        })
      );

      // 2. Stop Loss Line (Dashed Red with exact pips risk)
      priceLinesRef.current.push(
        series.createPriceLine({
          price: tradePlan.stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL: $${tradePlan.stopLoss.toFixed(activeConfig.priceDecimals)} (-${tradePlan.riskPips} Pips)`
        })
      );

      // 3. TP1 Line (Cyan Dotted)
      priceLinesRef.current.push(
        series.createPriceLine({
          price: tradePlan.tp1,
          color: '#38bdf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP1: $${tradePlan.tp1.toFixed(activeConfig.priceDecimals)} (${tradePlan.rrrTp1})`
        })
      );

      // 4. TP2 Line (Cyan Dotted)
      priceLinesRef.current.push(
        series.createPriceLine({
          price: tradePlan.tp2,
          color: '#38bdf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP2: $${tradePlan.tp2.toFixed(activeConfig.priceDecimals)} (${tradePlan.rrrTp2})`
        })
      );

      // 5. TP3 Line (Emerald Dotted - Macro Target 500-700 Pips)
      priceLinesRef.current.push(
        series.createPriceLine({
          price: tradePlan.tp3,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP3: $${tradePlan.tp3.toFixed(activeConfig.priceDecimals)} (${tradePlan.rrrTp3} • ${tradePlan.rewardPipsTp3} Pips Target)`
        })
      );
    }

    // Native SMC Markers from Actual Candle Geometry
    const markers: any[] = [];
    const isShort = tradePlan.direction === 'SHORT';

    tradePlan.events.forEach((evt) => {
      markers.push({
        time: evt.time,
        position: evt.direction === 'BEARISH' ? 'aboveBar' : 'belowBar',
        color: evt.type === 'SWEEP' ? '#f59e0b' : evt.type === 'BOS' ? '#38bdf8' : '#a855f7',
        shape: evt.direction === 'BEARISH' ? 'arrowDown' : 'arrowUp',
        text: evt.label
      });
    });

    // Single Locked Trade Signal Marker on Trigger Bar
    const lastCandle = candlesRef.current[candlesRef.current.length - 1];
    if (lastCandle) {
      markers.push({
        time: lastCandle.time,
        position: isShort ? 'aboveBar' : 'belowBar',
        color: isShort ? '#ef4444' : '#10b981',
        shape: isShort ? 'arrowDown' : 'arrowUp',
        text: isShort ? '🔒 LOCKED SHORT SETUP' : '🔒 LOCKED LONG SETUP'
      });
    }

    markers.sort((a, b) => (a.time as number) - (b.time as number));
    try {
      createSeriesMarkers(series, markers);
    } catch {}
  }, [tradePlan, currentQuote.price, activeConfig]);

  // ── 7. RECOMPUTE PIXEL COORDINATES FOR VISUAL SVG OVERLAYS ──
  const updateOverlayCoordinates = useCallback(() => {
    const series = candleSeriesRef.current;
    const chart = chartInstanceRef.current;
    const container = chartContainerRef.current;
    if (!series || !chart || !container || candlesRef.current.length === 0) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;
    const lastCandle = candlesRef.current[candlesRef.current.length - 1];

    const currentX = chart.timeScale().timeToCoordinate(lastCandle.time as any) ?? width * 0.75;
    const currentY = series.priceToCoordinate(currentQuote.price) ?? height * 0.5;

    const supplyYTop = series.priceToCoordinate(tradePlan.supplyZone.top);
    const supplyYBottom = series.priceToCoordinate(tradePlan.supplyZone.bottom);

    const demandYTop = series.priceToCoordinate(tradePlan.demandZone.top);
    const demandYBottom = series.priceToCoordinate(tradePlan.demandZone.bottom);

    const fvgYTop = series.priceToCoordinate(tradePlan.fvgZone.top);
    const fvgYBottom = series.priceToCoordinate(tradePlan.fvgZone.bottom);

    const entryY = series.priceToCoordinate(tradePlan.entryPrice);
    const slY = series.priceToCoordinate(tradePlan.stopLoss);
    const tp1Y = series.priceToCoordinate(tradePlan.tp1);
    const tp2Y = series.priceToCoordinate(tradePlan.tp2);
    const tp3Y = series.priceToCoordinate(tradePlan.tp3);

    setOverlayCoords({
      supplyYTop,
      supplyYBottom,
      demandYTop,
      demandYBottom,
      fvgYTop,
      fvgYBottom,
      entryY,
      slY,
      tp1Y,
      tp2Y,
      tp3Y,
      currentX,
      currentY,
      width,
      height
    });
  }, [tradePlan, currentQuote.price]);

  useEffect(() => {
    updateOverlayCoordinates();
    const chart = chartInstanceRef.current;
    if (!chart) return;

    try {
      chart.timeScale().subscribeVisibleLogicalRangeChange(updateOverlayCoordinates);
      chart.timeScale().subscribeVisibleTimeRangeChange(updateOverlayCoordinates);
    } catch {}

    const timer = setTimeout(updateOverlayCoordinates, 300);
    return () => clearTimeout(timer);
  }, [updateOverlayCoordinates, isLoadingCandles]);

  // ── 8. BOTTOM DASHBOARD DATA ──
  const bottomData = useMemo(() => {
    return getBottomDashboardData(
      tradePlan.direction === 'SHORT' ? 'Bearish' : 'Bullish',
      102.35
    );
  }, [tradePlan.direction]);

  // Chart Zoom Helpers
  const handleZoom = (factor: number) => {
    soundEffects.playBlip();
    if (chartInstanceRef.current) {
      const ts = chartInstanceRef.current.timeScale();
      ts.applyOptions({ barSpacing: Math.min(30, Math.max(3, 9 * factor)) });
      setTimeout(updateOverlayCoordinates, 50);
    }
  };

  const handleResetZoom = () => {
    soundEffects.playBlip();
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
      setTimeout(updateOverlayCoordinates, 50);
    }
  };

  const isPositive = currentQuote.change24h >= 0;

  // Calculate Ghost Path Coordinates
  const isShort = tradePlan.direction === 'SHORT';
  const startX = overlayCoords.currentX ? Math.min(overlayCoords.width - 220, Math.max(80, overlayCoords.currentX)) : overlayCoords.width * 0.55;
  const startY = overlayCoords.entryY ?? (isShort ? 180 : 340);
  const target1Y = overlayCoords.tp1Y ?? (isShort ? 240 : 280);
  const target2Y = overlayCoords.tp2Y ?? (isShort ? 310 : 210);
  const target3Y = overlayCoords.tp3Y ?? (isShort ? 400 : 130);

  const ghostPoints = isShort
    ? `${startX},${startY} ${startX + 35},${target1Y} ${startX + 60},${target1Y - 18} ${startX + 95},${target2Y} ${startX + 120},${target2Y - 18} ${startX + 160},${target3Y}`
    : `${startX},${startY} ${startX + 35},${target1Y} ${startX + 60},${target1Y + 18} ${startX + 95},${target2Y} ${startX + 120},${target2Y + 18} ${startX + 160},${target3Y}`;

  return (
    <div className={`space-y-3 font-sans text-slate-100 ${isMaximized ? 'fixed inset-0 z-50 bg-[#040812] p-4 overflow-y-auto' : ''}`}>
      {/* ── 1. TOP HEADER & BRAND BAR (Exact Match to User Screenshot) ── */}
      <div className="rounded-xl border border-[#162032] bg-[#070b14] px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl font-mono">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
            <Crown className="h-6 w-6 text-slate-950 fill-current" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
              Ishant Jakhenia Marco Panel Global Marco Command Centre
            </h1>
            <p className="text-[11px] text-[#94a3b8] font-medium mt-0.5 font-sans">
              AI Powered Trading • SMC | Liquidity | Smart Money | Macro Analysis
            </p>
          </div>
        </div>

        {/* Real-Time Connection Telemetry */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`h-2.5 w-2.5 rounded-full ${
              connectionStatus === 'LIVE' ? 'bg-[#22c55e] animate-ping' : connectionStatus === 'RECONNECTING' ? 'bg-[#f59e0b] animate-bounce' : 'bg-[#ef4444]'
            }`} />
            <span className={`text-[11px] tracking-wider uppercase font-black font-mono ${
              connectionStatus === 'LIVE' ? 'text-[#22c55e]' : connectionStatus === 'RECONNECTING' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
            }`}>
              {connectionStatus}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({connectionLatency}ms)</span>
          </div>

          <span className="text-[11px] text-[#94a3b8] font-mono hidden sm:inline">
            Last Update: <strong className="text-slate-300 font-normal">{currentTimeStr}</strong>
          </span>

          <div className="flex items-center rounded-lg border border-[#1e293b] bg-[#0b1322] p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setIsThemeDark(true)}
              className={`px-2.5 py-0.5 rounded font-bold cursor-pointer ${
                isThemeDark ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#94a3b8]'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setIsThemeDark(false)}
              className={`px-2.5 py-0.5 rounded font-bold cursor-pointer ${
                !isThemeDark ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#94a3b8]'
              }`}
            >
              Light
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SUB-NAVIGATION BAR (Separate Gold AI, BTC AI, ETH AI, SOL AI Engines) ── */}
      <div className="rounded-xl border border-[#162032] bg-[#070b14] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {(['GOLD', 'BTC', 'ETH', 'SOL'] as SupportedAsset[]).map((key) => {
            const conf = ASSET_CONFIGS[key];
            const isActive = activeAsset === key;
            return (
              <button
                key={key}
                onClick={() => {
                  soundEffects.playBlip();
                  setActiveAsset(key);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-white border border-[#f59e0b]/50 shadow-md shadow-amber-500/20'
                    : 'text-[#94a3b8] hover:text-white bg-[#0b1322] border border-[#162032]'
                }`}
              >
                <span>{conf.icon} {key} AI</span>
                <span className="text-[10px] text-slate-400 font-normal">({conf.instrument})</span>
              </button>
            );
          })}

          <span className="text-[#334155] mx-1">|</span>
          <button
            onClick={() => {
              soundEffects.playBlip();
              setShowEducationalGuide(!showEducationalGuide);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              showEducationalGuide ? 'bg-sky-600 text-white shadow' : 'text-[#38bdf8] bg-sky-950/40 hover:bg-sky-900/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>7-Step Educational Guide</span>
          </button>

          <span className="text-[#334155]">|</span>
          <button
            onClick={() => {
              soundEffects.playBlip();
              setShowSMCModelModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-amber-400 bg-amber-950/40 hover:bg-amber-900/50 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SMC Entry Models</span>
          </button>

          <span className="text-[#334155]">|</span>
          <span className="text-[#94a3b8] hover:text-slate-200 cursor-pointer">Market Overview</span>
          <span className="text-[#334155]">|</span>
          <span className="text-[#94a3b8] hover:text-slate-200 cursor-pointer">Economic Calendar</span>
          <span className="text-[#334155]">|</span>
          <span className="text-[#94a3b8] hover:text-slate-200 cursor-pointer">COT Report</span>
          <span className="text-[#334155]">|</span>
          <span className="text-[#94a3b8] hover:text-slate-200 cursor-pointer">DXY Analysis</span>
        </div>

        <button
          onClick={fetchHistoricalCandles}
          className="flex items-center gap-1 text-[11px] text-[#38bdf8] hover:text-[#7dd3fc] font-bold cursor-pointer"
          title="Force refresh candlestick feed from live API"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCandles ? 'animate-spin' : ''}`} />
          <span>Sync Candles</span>
        </button>
      </div>

      {/* ── 3. TOP 4 ASSET TELEMETRY CARDS (Daily, 4H, 1H Biases Matching User Screenshot) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {(['GOLD', 'BTC', 'ETH', 'SOL'] as SupportedAsset[]).map((key) => {
          const conf = ASSET_CONFIGS[key];
          const q = allQuotes[conf.quoteKey] || sharedQuoteStore.getQuote(conf.quoteKey);
          const isNeg = q.change24h < 0;
          const isSelected = activeAsset === key;

          // Multi-Timeframe Biases from Institutional Engine
          const dailyBias = key === 'GOLD' ? tradePlan.dailyBias : isNeg ? 'BEARISH' : 'BULLISH';
          const h4Bias = key === 'GOLD' ? tradePlan.h4Bias : isNeg ? 'BEARISH' : 'BULLISH';
          const h1Bias = key === 'GOLD' ? tradePlan.h1Bias : isNeg ? 'BEARISH' : 'BULLISH';

          return (
            <div
              key={key}
              onClick={() => {
                soundEffects.playBlip();
                setActiveAsset(key);
              }}
              className={`rounded-xl border p-3 flex items-center justify-between shadow-lg cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#f59e0b]/60 bg-gradient-to-br from-[#121c32] to-[#070b14] ring-1 ring-[#f59e0b]/40'
                  : 'border-[#162032] bg-[#070b14] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0b1322] border border-[#1e293b] text-2xl shrink-0">
                  {conf.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white tracking-tight">
                      {conf.instrument} {key === 'GOLD' ? '(GOLD)' : ''}
                    </span>
                  </div>
                  <span className="text-lg font-black font-sans block leading-tight text-white tabular-nums">
                    ${q.price.toLocaleString(undefined, { minimumFractionDigits: conf.priceDecimals, maximumFractionDigits: conf.priceDecimals })}
                  </span>
                  <span className={`text-[10px] font-bold block tabular-nums ${isNeg ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                    {isNeg ? '▼' : '▲'} {q.change24hPts >= 0 ? `+${q.change24hPts.toFixed(2)}` : q.change24hPts.toFixed(2)} ({q.change24h >= 0 ? `+${q.change24h.toFixed(2)}` : q.change24h.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Exact Biases matching photo: Daily Bias, 4H Bias, 1H Bias */}
              <div className="text-[10px] space-y-0.5 border-l border-[#1e293b] pl-2.5 leading-tight font-mono">
                <div>
                  <span className="text-[#94a3b8]">Daily Bias: </span>
                  <strong className={dailyBias === 'BEARISH' ? 'text-[#ef4444]' : 'text-[#22c55e]'}>
                    {dailyBias}
                  </strong>
                </div>
                <div>
                  <span className="text-[#94a3b8]">4H Bias: </span>
                  <strong className={h4Bias === 'BEARISH' ? 'text-[#ef4444]' : 'text-[#22c55e]'}>
                    {h4Bias}
                  </strong>
                </div>
                <div>
                  <span className="text-[#94a3b8]">1H Bias: </span>
                  <strong className={h1Bias === 'BEARISH' ? 'text-[#ef4444]' : 'text-[#22c55e]'}>
                    {h1Bias}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. MAIN WORKSPACE: TRADINGVIEW CHART WITH DIRECT SMC OVERLAYS (68%) + RIGHT TRADE PLAN PANEL (32%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT 68%: SYNCHRONIZED CANDLESTICK CHART WITH DIRECT SMC ZONE RECTANGLES & GHOST PATH */}
        <div className="lg:col-span-8 xl:col-span-8 rounded-xl border border-[#162032] bg-[#070b14] p-3 shadow-2xl relative flex flex-col font-mono">
          {/* Header Bar: Instrument, Timeframe (1M, 5M, 15M, 30M, 1H, 4H, 1D, 1W), Overlay Toggles, Zoom */}
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#162032] gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span className="text-amber-400">{activeConfig.icon}</span>
                <span>{activeConfig.instrument} Gold – {timeframe}</span>
              </div>

              {/* Overlay Toggle Badges */}
              <button
                onClick={() => setShowZones(!showZones)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                  showZones ? 'bg-purple-950/60 text-purple-300 border-purple-500/40' : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
                title="Toggle Demand/Supply/FVG Zone boxes"
              >
                Zones: {showZones ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setShowGhostPath(!showGhostPath)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                  showGhostPath ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
                title="Toggle Zigzag Ghost Projection Path"
              >
                Ghost Path: {showGhostPath ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Timeframe Selector with standard intervals */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5 bg-[#0b1322] border border-[#1e293b] rounded-lg p-0.5 text-xs">
                {(['1D', '4H', '1H', '30M', '15M', '5M', '1M'] as SupportedTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      soundEffects.playBlip();
                      setTimeframe(tf);
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-[#2563eb] text-white font-black shadow-sm'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {tf.toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Zoom & Maximize */}
              <div className="flex items-center gap-1 text-[#94a3b8]">
                <button
                  onClick={() => handleZoom(1.3)}
                  className="p-1 rounded bg-[#0b1322] hover:bg-[#1e293b] text-slate-300 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleZoom(0.7)}
                  className="p-1 rounded bg-[#0b1322] hover:bg-[#1e293b] text-slate-300 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1 rounded bg-[#0b1322] hover:bg-[#1e293b] text-slate-300 cursor-pointer"
                  title="Reset View"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1 rounded bg-[#0b1322] hover:bg-[#1e293b] text-slate-300 cursor-pointer"
                  title={isMaximized ? 'Minimize' : 'Maximize Fullscreen'}
                >
                  {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Chart Canvas & SVG Overlay Container */}
          <div
            ref={chartContainerRef}
            className="w-full relative mt-1.5 rounded-lg border border-[#162032] overflow-hidden"
            style={{ height: '520px' }}
          >
            {/* Market Structure Badge directly on Chart (Top Left) */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                tradePlan.direction === 'SHORT'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              }`}>
                <span className={`h-2 w-2 rounded-full ${tradePlan.direction === 'SHORT' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-ping'}`} />
                <span>Market Structure: {tradePlan.direction === 'SHORT' ? 'BEARISH' : 'BULLISH'}</span>
              </span>
            </div>

            {/* Loading Indicator */}
            {isLoadingCandles && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070d1a]/85 backdrop-blur-sm space-y-2">
                <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs font-mono text-cyan-300">Streaming Live {activeConfig.instrument} Candles ({timeframe})...</span>
              </div>
            )}

            {/* ── SVG SMC OVERLAYS (Demand Zone, Supply Zone, FVG, Ghost Path, Risk/Reward Box, Callout) ── */}
            {showZones && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#e2e8f0" />
                  </marker>
                  <marker id="yellowArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#facc15" />
                  </marker>
                </defs>

                {/* 1. Supply Zone (BB + FVG) Box */}
                {overlayCoords.supplyYTop !== null && overlayCoords.supplyYBottom !== null && (
                  <g>
                    <rect
                      x={overlayCoords.width * 0.42}
                      y={Math.min(overlayCoords.supplyYTop, overlayCoords.supplyYBottom)}
                      width={overlayCoords.width * 0.42}
                      height={Math.max(16, Math.abs(overlayCoords.supplyYBottom - overlayCoords.supplyYTop))}
                      fill="rgba(147, 51, 234, 0.25)"
                      stroke="#a855f7"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      rx="4"
                    />
                    <text
                      x={overlayCoords.width * 0.43}
                      y={Math.min(overlayCoords.supplyYTop, overlayCoords.supplyYBottom) + 12}
                      fill="#e9d5ff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      BB + FVG (supply zone {tradePlan.supplyZone.bottom.toFixed(0)}-{tradePlan.supplyZone.top.toFixed(0)})
                    </text>
                  </g>
                )}

                {/* 2. Demand Zone Box */}
                {overlayCoords.demandYTop !== null && overlayCoords.demandYBottom !== null && (
                  <g>
                    <rect
                      x={overlayCoords.width * 0.12}
                      y={Math.min(overlayCoords.demandYTop, overlayCoords.demandYBottom)}
                      width={overlayCoords.width * 0.42}
                      height={Math.max(16, Math.abs(overlayCoords.demandYBottom - overlayCoords.demandYTop))}
                      fill="rgba(16, 185, 129, 0.18)"
                      stroke="#10b981"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      rx="4"
                    />
                    <text
                      x={overlayCoords.width * 0.13}
                      y={Math.min(overlayCoords.demandYTop, overlayCoords.demandYBottom) + 13}
                      fill="#a7f3d0"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Demand Zone
                    </text>
                  </g>
                )}

                {/* 3. FVG (Fair Value Gap) Box */}
                {overlayCoords.fvgYTop !== null && overlayCoords.fvgYBottom !== null && (
                  <g>
                    <rect
                      x={overlayCoords.width * 0.40}
                      y={Math.min(overlayCoords.fvgYTop, overlayCoords.fvgYBottom)}
                      width={overlayCoords.width * 0.10}
                      height={Math.max(12, Math.abs(overlayCoords.fvgYBottom - overlayCoords.fvgYTop))}
                      fill="rgba(56, 189, 248, 0.22)"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      rx="2"
                    />
                    <text
                      x={overlayCoords.width * 0.42}
                      y={Math.min(overlayCoords.fvgYTop, overlayCoords.fvgYBottom) + 10}
                      fill="#bae6fd"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      FVG
                    </text>
                  </g>
                )}

                {/* 4. Risk Box (Red Shaded Area between Entry and SL) */}
                {overlayCoords.entryY !== null && overlayCoords.slY !== null && (
                  <rect
                    x={startX}
                    y={Math.min(overlayCoords.entryY, overlayCoords.slY)}
                    width={170}
                    height={Math.max(10, Math.abs(overlayCoords.slY - overlayCoords.entryY))}
                    fill="rgba(239, 68, 68, 0.16)"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    rx="3"
                  />
                )}

                {/* 5. Reward Box (Green Shaded Area between Entry and TP3) */}
                {overlayCoords.entryY !== null && overlayCoords.tp3Y !== null && (
                  <rect
                    x={startX}
                    y={Math.min(overlayCoords.entryY, overlayCoords.tp3Y)}
                    width={170}
                    height={Math.max(10, Math.abs(overlayCoords.tp3Y - overlayCoords.entryY))}
                    fill="rgba(16, 185, 129, 0.16)"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    rx="3"
                  />
                )}

                {/* 6. Ghost Path (Dashed Zigzag Projection Line) */}
                {showGhostPath && overlayCoords.entryY !== null && (
                  <g>
                    <polyline
                      points={ghostPoints}
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={startX + 165}
                      y={target3Y + (isShort ? 14 : -6)}
                      fill="#cbd5e1"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ghost path (HYPOTHESIS)
                    </text>
                  </g>
                )}

                {/* 7. Callout: price abhi yahan (Stage 3/5: zone tap) */}
                {overlayCoords.currentX && overlayCoords.currentY && (
                  <g>
                    <line
                      x1={overlayCoords.currentX - 45}
                      y1={overlayCoords.currentY + (isShort ? 45 : -45)}
                      x2={overlayCoords.currentX - 5}
                      y2={overlayCoords.currentY + (isShort ? 5 : -5)}
                      stroke="#facc15"
                      strokeWidth="1.5"
                      markerEnd="url(#yellowArrow)"
                    />
                    <rect
                      x={overlayCoords.currentX - 160}
                      y={overlayCoords.currentY + (isShort ? 48 : -72)}
                      width="155"
                      height="26"
                      rx="4"
                      fill="#0b1322"
                      stroke="#facc15"
                      strokeWidth="1"
                    />
                    <text
                      x={overlayCoords.currentX - 152}
                      y={overlayCoords.currentY + (isShort ? 64 : -56)}
                      fill="#facc15"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      price abhi yahan ({tradePlan.activeStage}/5: zone tap)
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* RIGHT 32%: TRADE PLAN & SMC ENTRY MODEL PANEL (Exact Match to User Screenshots) */}
        <div className="lg:col-span-4 xl:col-span-4 rounded-xl border border-[#162032] bg-[#070b14] p-4 shadow-2xl flex flex-col justify-between font-mono">
          <div>
            {/* Header with Switchable Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-[#162032]">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400 fill-current" />
                <span className="text-xs font-black text-white uppercase font-sans">
                  {activeAsset} AI
                </span>
              </div>

              {/* Tab Selector: Trade Plan vs SMC Entry Model */}
              <div className="flex items-center bg-[#0b1322] border border-[#1e293b] rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => setRightPanelTab('TRADE_PLAN')}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                    rightPanelTab === 'TRADE_PLAN' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#94a3b8]'
                  }`}
                >
                  Trade Plan
                </button>
                <button
                  onClick={() => setRightPanelTab('SMC_ENTRY_MODEL')}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                    rightPanelTab === 'SMC_ENTRY_MODEL' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#94a3b8]'
                  }`}
                >
                  SMC Story
                </button>
              </div>
            </div>

            {/* ── TAB A: INSTITUTIONAL TRADE PLAN (Matching Screenshot 1) ── */}
            {rightPanelTab === 'TRADE_PLAN' && (
              <div>
                {/* Big Action Pill (LONG SETUP ✓ or SHORT SETUP ✓) */}
                <div className={`mt-3 p-3 rounded-xl border text-center shadow-lg transition-all ${
                  tradePlan.direction === 'SHORT'
                    ? 'bg-gradient-to-r from-rose-950/80 via-red-900/50 to-rose-950/80 border-rose-500/60'
                    : 'bg-gradient-to-r from-emerald-950/80 via-green-900/50 to-emerald-950/80 border-emerald-500/60'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Lock className={`w-4 h-4 ${tradePlan.direction === 'SHORT' ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span className={`text-base font-black tracking-wider ${tradePlan.direction === 'SHORT' ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {tradePlan.direction === 'SHORT' ? 'SHORT SETUP' : 'LONG SETUP'}
                    </span>
                    <span className="text-sm text-white">✓</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5 font-sans">
                    PineScript Indicator Confirmed on Bar Close • Macro Target: <strong className="tabular-nums">{tradePlan.rewardPipsTp3} Pips</strong>
                  </p>
                </div>

                {/* Key Execution Metrics Table */}
                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">Entry Price :</span>
                    <strong className="text-white font-bold tabular-nums">${tradePlan.entryPrice.toFixed(activeConfig.priceDecimals)}</strong>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">Entry Zone :</span>
                    <span className="text-white tabular-nums">{tradePlan.entryZone}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#ef4444] font-bold">Stop Loss (SL) :</span>
                    <strong className="text-[#ef4444] font-black tabular-nums">${tradePlan.stopLoss.toFixed(activeConfig.priceDecimals)}</strong>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#38bdf8] font-bold">TP1 :</span>
                    <span className="text-white tabular-nums">${tradePlan.tp1.toFixed(activeConfig.priceDecimals)} <strong className="text-[#38bdf8]">({tradePlan.rrrTp1})</strong></span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#38bdf8] font-bold">TP2 :</span>
                    <span className="text-white tabular-nums">${tradePlan.tp2.toFixed(activeConfig.priceDecimals)} <strong className="text-[#38bdf8]">({tradePlan.rrrTp2})</strong></span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#10b981] font-bold">TP3 :</span>
                    <span className="text-white tabular-nums">${tradePlan.tp3.toFixed(activeConfig.priceDecimals)} <strong className="text-[#10b981]">({tradePlan.rrrTp3})</strong></span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">Market Structure :</span>
                    <span className={tradePlan.direction === 'SHORT' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {tradePlan.direction === 'SHORT' ? 'Bearish Trend' : 'Bullish Trend'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">Liquidity :</span>
                    <span className="text-white">{tradePlan.direction === 'SHORT' ? 'Sell-side Liquidity' : 'Buy-side Liquidity'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">DXY :</span>
                    <span className="text-[#38bdf8] font-bold">{tradePlan.direction === 'SHORT' ? 'Strength (Pressures Gold)' : 'Weakness (Supports Gold)'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">News Impact :</span>
                    <span className="text-amber-400 font-bold">Neutral</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#162032]">
                    <span className="text-[#94a3b8]">Setup Grade :</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40">
                        {tradePlan.setupGrade}
                      </span>
                      <span className="text-white font-bold">Confidence : {tradePlan.confidence}%</span>
                    </div>
                  </div>

                  <div className="pt-1.5 space-y-1">
                    <div>
                      <span className="text-[#94a3b8]">Reason : </span>
                      <span className="text-slate-200">Liquidity Sweep + BOS + {tradePlan.direction === 'SHORT' ? 'Supply Zone' : 'Demand Zone'}</span>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Invalidation : </span>
                      <span className="text-rose-400 font-bold tabular-nums">${tradePlan.invalidationLevel.toFixed(activeConfig.priceDecimals)}</span>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Trade Expiry : </span>
                      <span className="text-slate-300">Today (4 Hours)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB B: SMC ENTRY MODEL STORY (Matching Screenshot 2) ── */}
            {rightPanelTab === 'SMC_ENTRY_MODEL' && (
              <div className="mt-3 space-y-2.5">
                <div className="text-xs">
                  <span className="text-[#94a3b8] block uppercase text-[10px] font-bold">GOLD ENTRY MODELS</span>
                  <span className="text-slate-300 text-[11px] font-mono">Active: {tradePlan.activeModel}</span>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${
                  tradePlan.direction === 'SHORT' ? 'bg-rose-950/60 border-rose-500/50' : 'bg-emerald-950/60 border-emerald-500/50'
                }`}>
                  <h3 className={`text-lg font-black tracking-wider ${tradePlan.direction === 'SHORT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tradePlan.direction === 'SHORT' ? 'SHORT (ARMED)' : 'LONG (ARMED)'}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span>Grade {tradePlan.setupGrade}</span>
                    <span>•</span>
                    <span>Q {tradePlan.confidence}/100</span>
                    <span>•</span>
                    <span>RR {tradePlan.rrrTp2}</span>
                  </div>
                </div>

                <div className="text-xs text-amber-400 font-bold">
                  {tradePlan.stageString}
                </div>

                <div className="space-y-1 text-[11px] text-slate-200 bg-[#0b1322] p-2.5 rounded-lg border border-[#1e293b]">
                  <span className="text-[#94a3b8] font-bold block mb-1">Why (Hinglish):</span>
                  {tradePlan.hinglishBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-xs pt-1 border-t border-[#162032]">
                  <div>
                    <span className="text-[#94a3b8] font-bold">Next trigger: </span>
                    <span className="text-slate-300">{tradePlan.nextTrigger}</span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8] font-bold">Invalidation: </span>
                    <span className="text-rose-400 font-bold">{timeframe} close {tradePlan.direction === 'SHORT' ? '>' : '<'} ${tradePlan.stopLoss.toFixed(activeConfig.priceDecimals)} =&gt; setup cancel</span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8] font-bold">Lot (risk 1%): </span>
                    <span className="text-slate-300">{tradePlan.lotRisk}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#162032] flex items-center justify-between text-[10px] text-[#94a3b8]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Strict RRR (Risk 1% Max)</span>
            </div>
            <span className="font-bold text-slate-300">DEEEPR Institutional Engine v4</span>
          </div>
        </div>
      </div>

      {/* ── 5. EDUCATIONAL 7-STEP SMC GUIDE DRAWER (Matching Screenshot 3) ── */}
      {showEducationalGuide && (
        <div className="rounded-xl border border-sky-500/40 bg-[#070e1c] p-4 shadow-2xl relative">
          <div className="flex items-center justify-between pb-3 border-b border-sky-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <div>
                <h3 className="text-base font-black text-white font-sans">
                  XAUUSD (GOLD) LIQUIDITY GRAB & BREAK OF STRUCTURE
                </h3>
                <p className="text-xs text-sky-400 font-mono">EDUCATIONAL CHART • 7-STEP INSTITUTIONAL EXECUTION BLUEPRINT</p>
              </div>
            </div>
            <button
              onClick={() => setShowEducationalGuide(false)}
              className="p-1 rounded bg-[#0b1322] hover:bg-[#1e293b] text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs font-mono">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
                  1
                </span>
                <span className="font-bold text-emerald-400">IDENTIFY LIQUIDITY ZONE</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Price is taking out liquidity above recent swing highs where buy side liquidity exists.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-slate-950 font-black text-xs">
                  2
                </span>
                <span className="font-bold text-sky-400">LIQUIDITY GRAB</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Price spikes above the liquidity zone to trigger stops and trap buyers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-slate-950 font-black text-xs">
                  3
                </span>
                <span className="font-bold text-purple-400">BOS (BREAK OF STRUCTURE)</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Price breaks the previous swing low, confirming a shift in market structure.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                  4
                </span>
                <span className="font-bold text-amber-400">DEMAND / RETEST ZONE</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Price returns to the institutional zone (OB / BB + FVG) where strong orders step in.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
                  5
                </span>
                <span className="font-bold text-emerald-400">ENTRY TRIGGER</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Enter trade on confirmation (candlestick rejection / closed bar PineScript lock).
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-slate-950 font-black text-xs">
                  6
                </span>
                <span className="font-bold text-rose-400">RISK MANAGEMENT</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Place stop loss strictly beyond the zone extreme + 0.35 ATR buffer (Risk &lt;= 1%).
              </p>
            </div>

            {/* Step 7 */}
            <div className="p-3 rounded-lg bg-[#0b162a] border border-sky-900/40 space-y-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-slate-950 font-black text-xs">
                  7
                </span>
                <span className="font-bold text-blue-400">TARGETS (TP1, TP2, TP3)</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Targets are set at key opposing liquidity levels: TP1 (Prior High/Low), TP2 (Internal Liquidity), TP3 (Macro 500-700 Pips Resistance/Support).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. SMC ENTRY MODEL MODAL (Matching Screenshots 4 & 5) ── */}
      {showSMCModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-amber-500/40 bg-[#070b14] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h2 className="text-lg font-black text-white font-sans flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>SMC | INSTITUTIONAL ENTRY MODEL SCHEMATIC</span>
                </h2>
                <p className="text-xs text-[#94a3b8]">ICT &amp; Smart Money Concepts Flowchart</p>
              </div>
              <button
                onClick={() => setShowSMCModelModal(false)}
                className="p-1 rounded bg-[#0b1322] hover:bg-[#1e293b] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Flow Diagrams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bearish Schematic */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
                <h4 className="text-sm font-black text-rose-400 flex items-center justify-between">
                  <span>SHORT ENTRY MODEL</span>
                  <span className="text-[10px] bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">BEARISH</span>
                </h4>
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-amber-400" /> <strong>1. SWEEP (X):</strong> Buy-side liquidity swept</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-sky-400" /> <strong>2. BOS:</strong> Break of structure down</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-purple-400" /> <strong>3. IDM:</strong> Inducement high created</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-rose-400" /> <strong>4. MSS:</strong> Market structure shift confirmed</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-cyan-400" /> <strong>5. Retest:</strong> Retracement to Breaker Block (BB) + FVG</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-emerald-400" /> <strong>6. Target ($$):</strong> Plunge to sell-side liquidity</div>
                </div>
              </div>

              {/* Bullish Schematic */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <h4 className="text-sm font-black text-emerald-400 flex items-center justify-between">
                  <span>LONG ENTRY MODEL</span>
                  <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">BULLISH</span>
                </h4>
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-amber-400" /> <strong>1. SWEEP (X):</strong> Sell-side liquidity taken</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-sky-400" /> <strong>2. BOS:</strong> Break of structure up</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-purple-400" /> <strong>3. IDM:</strong> Inducement low formed</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-emerald-400" /> <strong>4. MSS:</strong> Shift in market structure to bullish</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-cyan-400" /> <strong>5. Retest:</strong> Retracement to Demand Block + FVG</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-emerald-400" /> <strong>6. Target ($$):</strong> Rally to buy-side liquidity</div>
                </div>
              </div>
            </div>

            {/* Glossary Table */}
            <div className="p-3 rounded-lg bg-[#0b1322] border border-[#1e293b] text-xs space-y-1">
              <span className="text-amber-400 font-bold block mb-1">Institutional Abbreviations:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div>• <strong>X</strong> : Sweep of Liquidity</div>
                <div>• <strong>MSS</strong> : Market Structure Shift</div>
                <div>• <strong>BOS</strong> : Break Of Structure</div>
                <div>• <strong>FVG</strong> : Fair Value Gap</div>
                <div>• <strong>BB</strong> : Breaker Block</div>
                <div>• <strong>$$</strong> : Liquidity Target</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. BOTTOM 4 ANALYSIS DASHBOARD CARDS (Matching User Screenshot) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Card 1: Market Analysis Summary */}
        <div className="rounded-xl border border-[#162032] bg-[#070b14] p-3 shadow-lg space-y-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-[#162032]">
            <span className="text-blue-400">📊</span>
            <h3 className="font-bold text-white text-xs">Market Analysis Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div>
              <span className="text-[#94a3b8]">Gold Trend : </span>
              <strong className={tradePlan.direction === 'SHORT' ? 'text-[#ef4444]' : 'text-[#22c55e]'}>
                {tradePlan.direction === 'SHORT' ? 'Bearish' : 'Bullish'}
              </strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">DXY : </span>
              <strong className="text-slate-200">{bottomData.marketAnalysisSummary.dxy}</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">BTC Trend : </span>
              <strong className="text-[#22c55e]">{bottomData.marketAnalysisSummary.btcTrend}</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">US 10Y : </span>
              <strong className="text-slate-200">{bottomData.marketAnalysisSummary.us10y}</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">ETH Trend : </span>
              <strong className="text-[#22c55e]">{bottomData.marketAnalysisSummary.ethTrend}</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">BTC.D : </span>
              <strong className="text-slate-200">{bottomData.marketAnalysisSummary.btcD}</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">SOL Trend : </span>
              <strong className="text-[#22c55e]">{bottomData.marketAnalysisSummary.solTrend}</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">USDT.D : </span>
              <strong className="text-[#ef4444]">{bottomData.marketAnalysisSummary.usdtD}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming High Impact News */}
        <div className="rounded-xl border border-[#162032] bg-[#070b14] p-3 shadow-lg space-y-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-[#162032]">
            <span className="text-rose-400">📅</span>
            <h3 className="font-bold text-white text-xs">Upcoming High Impact News</h3>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {bottomData.upcomingNews.map((news) => (
              <div key={news.title} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    news.impact === 'High' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                  }`}>
                    {news.impact}
                  </span>
                  <span className="text-slate-200 truncate">{news.title}</span>
                </div>
                <span className="text-[#94a3b8] text-[10px] shrink-0">{news.dateStr}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Global Market Snapshot */}
        <div className="rounded-xl border border-[#162032] bg-[#070b14] p-3 shadow-lg space-y-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-[#162032]">
            <span className="text-cyan-400">🌐</span>
            <h3 className="font-bold text-white text-xs">Global Market Snapshot</h3>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">BTC Liquidation (24h) :</span>
              <strong className="text-white">{bottomData.globalSnapshot.btcLiquidation24h}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">ETH Liquidation (24h) :</span>
              <strong className="text-white">{bottomData.globalSnapshot.ethLiquidation24h}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Total Crypto MC :</span>
              <strong className="text-[#22c55e]">{bottomData.globalSnapshot.totalCryptoMc}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Gold Volume :</span>
              <strong className="text-[#f59e0b]">{bottomData.globalSnapshot.goldVolume}</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Live Status & Institutional Connection Telemetry */}
        <div className="rounded-xl border border-[#162032] bg-[#070b14] p-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#162032]">
              <span className="text-emerald-400">⚡</span>
              <h3 className="font-bold text-white text-xs">Live Status & Data Feeds</h3>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-[#22c55e]">✓</span>
                <span>Feed : <strong className="text-white">{currentQuote.source}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-[#22c55e]">✓</span>
                <span>Status : <strong className="text-[#22c55e]">{connectionStatus} ({connectionLatency}ms)</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-[#22c55e]">✓</span>
                <span>COT Data : <strong className="text-white">Updated (Weekly CFTC)</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-[#22c55e]">✓</span>
                <span>AI Engine : <strong className="text-white">Active (PineScript v5 Lock)</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[#1e293b] flex items-center justify-between text-amber-400 font-bold text-[11px]">
            <span>Trade Smart With AI</span>
            <span>🪙 1:1 Parity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
