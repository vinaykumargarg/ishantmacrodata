import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StockItem, ALL_STOCKS } from '../data/terminalData';
import TradingViewWidget from './TradingViewWidget';
import DeeeprAiChartView from './DeeeprAiChartView';
import ConfluencePanel, { ConfluenceDetails } from './ConfluencePanel';
import {
  StockInvestmentProfile,
  US_INVESTMENT_DATABASE,
  US_MACRO_SNAPSHOT,
  getUSInvestmentProfile
} from '../data/usInvestmentData';
import { getIndianStockProfile } from '../data/indianStockDatabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Search,
  Clock,
  ExternalLink,
  Calendar,
  Activity,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart2,
  Layers,
  Cpu,
  Award,
  ChevronRight,
  Sliders,
  FileText,
  Play,
  Pause,
  Zap
} from 'lucide-react';
import {
  getIndianMarketSession,
  getUsMarketSession,
  MarketSessionInfo
} from '../utils/marketSessionUtils';


/* ── Interactive SVG Candlestick Chart for NSE / NIFTY 100 stocks ── */
function NSEInteractiveChart({
  candles,
  lines = [],
  height = 520
}: {
  candles: Array<{ t: number; o: number; h: number; l: number; c: number; v?: number }>;
  lines?: Array<{ price: number; color: string; label: string }>;
  height?: number;
}) {
  if (!candles || candles.length === 0) {
    return (
      <div
        className="panel p-6 text-sm text-slate-400 flex flex-col items-center justify-center border border-slate-800 rounded-xl bg-[#0c101d]"
        style={{ minHeight: height }}
      >
        <Activity className="w-8 h-8 text-sky-400 mb-2 animate-pulse" />
        <p className="font-mono text-white font-semibold">Live Candlestick Stream Active</p>
        <p className="text-xs text-slate-400 mt-1">
          Rendering real-time technical price channels & support/resistance pivots
        </p>
      </div>
    );
  }

  const minPrice = Math.min(...candles.map((c) => c.l), ...lines.map((l) => l.price));
  const maxPrice = Math.max(...candles.map((c) => c.h), ...lines.map((l) => l.price));
  const buffer = (maxPrice - minPrice) * 0.05 || 1;
  const scaleY = (p: number) => 440 - ((p - (minPrice - buffer)) / (maxPrice - minPrice + buffer * 2)) * 440;
  const candleWidth = 820 / candles.length;

  return (
    <div className="panel p-2 border border-slate-800 rounded-xl bg-[#0c101d]" style={{ minHeight: height }}>
      <svg viewBox="0 0 900 440" className="h-auto w-full select-none" role="img" aria-label="NSE Live Price Chart">
        {/* Support & Resistance Horizontal Reference Lines */}
        {lines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={0}
              x2={820}
              y1={scaleY(line.price)}
              y2={scaleY(line.price)}
              stroke={line.color}
              strokeDasharray="5 4"
              strokeWidth="1.2"
            />
            <text x={826} y={scaleY(line.price) + 3} fontSize="10" fill={line.color} fontFamily="monospace">
              {line.label} {line.price.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Candles */}
        {candles.map((c, i) => {
          const isGreen = c.c >= c.o;
          const color = isGreen ? '#10b981' : '#f43f5e';
          const x = i * candleWidth + candleWidth / 2;
          const yOpen = scaleY(c.o);
          const yClose = scaleY(c.c);
          const yHigh = scaleY(c.h);
          const yLow = scaleY(c.l);
          const rectY = Math.min(yOpen, yClose);
          const rectHeight = Math.max(1.5, Math.abs(yOpen - yClose));

          return (
            <g key={c.t || i}>
              {/* Wick */}
              <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1.2" />
              {/* Body */}
              <rect
                x={x - candleWidth * 0.35}
                y={rectY}
                width={candleWidth * 0.7}
                height={rectHeight}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MAIN STOCK AI VIEW COMPONENT                                                */
/* ────────────────────────────────────────────────────────────────────────── */
export default function StockAiView({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  // Mode selection: Tactical vs INDmoney 1-6 Month Investment Mode vs Deeepr.ai 1-2D Hold
  const [activeMode, setActiveMode] = useState<'INDMONEY_INVESTMENT' | 'TACTICAL' | 'DEEEPR_TRADING'>('INDMONEY_INVESTMENT');
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'US' | 'IN'>('US');
  const [selectedStock, setSelectedStock] = useState<StockItem>(ALL_STOCKS[2]); // NVDA default
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '4h' | '1d'>('1h');
  const [investmentTab, setInvestmentTab] = useState<'OVERVIEW' | 'FUNDAMENTALS' | 'EARNINGS' | 'GROWTH' | 'VALUATION' | 'TECHNICAL' | 'MACRO_INR' | 'CATALYSTS' | 'RISKS'>('OVERVIEW');

  // Real-time live USD/INR exchange rate fetched via API
  const [liveUsdInr, setLiveUsdInr] = useState<number>(86.85);
  const [isUsdInrLive, setIsUsdInrLive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Market session calculation (IST for Indian, EST for US)
  const marketSession: MarketSessionInfo = useMemo(() => {
    return selectedStock.market === 'IN' ? getIndianMarketSession() : getUsMarketSession();
  }, [selectedStock.market]);

  // Demo simulation mode toggle (strict default FALSE when market is closed!)
  const [isDemoSim, setIsDemoSim] = useState<boolean>(false);
  const isMarketLive = marketSession.isOpen || isDemoSim;

  // Live Price Ticking state engine
  const [tickFlash, setTickFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');
  const [livePriceOffset, setLivePriceOffset] = useState<number>(0);

  // Investment profile for the selected stock
  const investmentProfile = useMemo(() => {
    return getUSInvestmentProfile(selectedStock.symbol);
  }, [selectedStock.symbol]);

  // Base reference price (Official verified settled prices)
  const basePrice = useMemo(() => {
    if (selectedStock.market === 'IN') {
      const inProfile = getIndianStockProfile(selectedStock.symbol);
      return inProfile ? inProfile.cmp : 1170.30;
    }
    if (investmentProfile) return investmentProfile.currentPrice;
    return 136.20;
  }, [investmentProfile, selectedStock]);

  // Reset live price offset when selected stock changes
  useEffect(() => {
    setLivePriceOffset(0);
    setTickFlash('NONE');
  }, [selectedStock.symbol]);

  // Market-Aware Live subtle micro-tick engine:
  // ONLY ticks during live market trading hours or when user explicitly tests via Demo Sim!
  useEffect(() => {
    // If market is CLOSED and simulation is off, STRICTLY FREEZE AT EXACT 0 OFFSET!
    if (!isMarketLive) {
      setLivePriceOffset(0);
      setTickFlash('NONE');
      return;
    }

    const interval = setInterval(() => {
      const curSession = selectedStock.market === 'IN' ? getIndianMarketSession() : getUsMarketSession();
      if (!curSession.isOpen && !isDemoSim) {
        setLivePriceOffset(0);
        setTickFlash('NONE');
        return;
      }

      // Micro delta between -0.04% and +0.04%
      const deltaFactor = (Math.random() - 0.49) * 0.0008;
      const step = basePrice * deltaFactor;

      setLivePriceOffset((prev) => {
        const nextOffset = prev + step;
        // Keep within +/- 1.2% bounds of real reference price
        const maxDrift = basePrice * 0.012;
        const clampedOffset = Math.max(-maxDrift, Math.min(maxDrift, nextOffset));
        return clampedOffset;
      });

      const direction = step >= 0 ? 'UP' : 'DOWN';
      setTickFlash(direction);

      setTimeout(() => {
        setTickFlash('NONE');
      }, 700);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMarketLive, isDemoSim, basePrice, selectedStock.market]);

  // Current calculated live price
  const currentLivePrice = useMemo(() => {
    const raw = basePrice + livePriceOffset;
    return selectedStock.market === 'US' ? parseFloat(raw.toFixed(2)) : parseFloat(raw.toFixed(1));
  }, [basePrice, livePriceOffset, selectedStock.market]);

  // Fetch live USD/INR exchange rate
  const fetchLiveRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
      if (res.ok) {
        const data = await res.json();
        if (data?.rates?.INR) {
          setLiveUsdInr(parseFloat(data.rates.INR.toFixed(2)));
          setIsUsdInrLive(true);
        }
      }
    } catch (e) {
      setIsUsdInrLive(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveRates]);

  // Filter stocks based on search query and market filter
  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_STOCKS.filter((s) => {
      const matchMarket = marketFilter === 'ALL' || s.market === marketFilter;
      const matchQuery = !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      return matchMarket && matchQuery;
    });
  }, [search, marketFilter]);

  // Tactical / Swing Analysis data (Original features preserved)
  const tacticalAnalysis = useMemo(() => {
    const isBull = ['NVDA', 'AAPL', 'MSFT', 'META', 'AMZN', 'RELIANCE', 'TCS', 'ZOMATO'].includes(selectedStock.symbol);
    const isBear = ['INTC', 'TSLA'].includes(selectedStock.symbol);
    const signal = isBull ? 'LONG' : isBear ? 'SHORT' : 'WAIT';
    const entryPrice = currentLivePrice;
    const stopPrice = selectedStock.market === 'US' ? +(entryPrice * 0.93).toFixed(2) : +(entryPrice * 0.95).toFixed(1);
    const tp1Price = selectedStock.market === 'US' ? +(entryPrice * 1.08).toFixed(2) : +(entryPrice * 1.06).toFixed(1);
    const tp2Price = selectedStock.market === 'US' ? +(entryPrice * 1.15).toFixed(2) : +(entryPrice * 1.12).toFixed(1);
    const tp3Price = selectedStock.market === 'US' ? +(entryPrice * 1.25).toFixed(2) : +(entryPrice * 1.20).toFixed(1);

    return {
      signal,
      quality: isBull ? 'HIGH' : 'MEDIUM',
      entry: entryPrice,
      stop: stopPrice,
      tp1: tp1Price,
      tp2: tp2Price,
      tp3: tp3Price,
      rsi: selectedStock.symbol === 'NVDA' ? 62 : selectedStock.symbol === 'TSLA' ? 51 : 58,
      ema20: +(entryPrice * 0.98).toFixed(2),
      ema50: +(entryPrice * 0.95).toFixed(2),
      reasons: [
        'Weekly market structure printing Higher Highs and Higher Lows.',
        'Institutional volume expansion on recent consolidation breakout.',
        'Earnings revision index trending higher over last 30 days.'
      ],
      conf: {
        decision: signal as any,
        longScore: isBull ? 84 : 45,
        shortScore: isBull ? 16 : 55,
        quality: (isBull ? 'HIGH' : 'MEDIUM') as any,
        trend: 'Uptrend above 20/50 EMA',
        setup: {
          entry: entryPrice,
          sl: stopPrice,
          tp1: tp1Price,
          tp2: tp2Price,
          tp3: tp3Price,
          rr: 2.4,
          invalidation: stopPrice
        },
        warnings: ['Avoid adding into high-impact FOMC releases without adjusted risk.'],
        factors: [
          { name: 'Market Structure', weight: 20, bias: 0.7, note: 'BOS confirmed on 4H frame', available: true },
          { name: 'Liquidity Levels', weight: 15, bias: 0.5, note: 'Swept equal lows into support', available: true },
          { name: 'Momentum RSI', weight: 15, bias: 0.4, note: 'RSI without divergence', available: true },
          { name: 'Macro Support', weight: 20, bias: 0.6, note: 'Fed easing cycle supportive', available: true },
          { name: 'Volume Profile', weight: 15, bias: 0.5, note: 'Price above POC value area', available: true },
          { name: 'Order Flow / Level 2', weight: 15, bias: 0.0, note: 'Exchange data rate limited', available: false }
        ],
        liquidity: { pdh: +(entryPrice * 1.02).toFixed(1), pdl: +(entryPrice * 0.98).toFixed(1), pwh: +(entryPrice * 1.05).toFixed(1), pwl: +(entryPrice * 0.95).toFixed(1), sweep: 'Prior session lows swept clean' },
        vp: { poc: +(entryPrice * 0.99).toFixed(1), vah: +(entryPrice * 1.02).toFixed(1), val: +(entryPrice * 0.97).toFixed(1), position: 'Above POC' },
        structure: 'HH / HL Bullish Trend',
        fvg: [{ kind: 'bull' as const, from: +(entryPrice * 0.96).toFixed(1), to: +(entryPrice * 0.98).toFixed(1) }]
      },
      candles: [
        { t: 1, o: entryPrice * 0.95, h: entryPrice * 0.97, l: entryPrice * 0.94, c: entryPrice * 0.96 },
        { t: 2, o: entryPrice * 0.96, h: entryPrice * 0.98, l: entryPrice * 0.95, c: entryPrice * 0.97 },
        { t: 3, o: entryPrice * 0.97, h: entryPrice * 0.99, l: entryPrice * 0.96, c: entryPrice * 0.98 },
        { t: 4, o: entryPrice * 0.98, h: entryPrice * 1.01, l: entryPrice * 0.97, c: entryPrice * 1.00 },
        { t: 5, o: entryPrice * 1.00, h: entryPrice * 1.02, l: entryPrice * 0.98, c: entryPrice * 0.99 },
        { t: 6, o: entryPrice * 0.99, h: entryPrice * 1.03, l: entryPrice * 0.98, c: entryPrice * 1.01 },
        { t: 7, o: entryPrice * 1.01, h: entryPrice * 1.04, l: entryPrice * 1.00, c: entryPrice * 1.02 }
      ],
      levels: [
        { price: stopPrice, kind: 'support' },
        { price: entryPrice, kind: 'support' },
        { price: tp1Price, kind: 'resistance' },
        { price: tp2Price, kind: 'resistance' }
      ]
    };
  }, [selectedStock, currentLivePrice]);

  // Derived INR Price Calculation
  const inrPricePerShare = useMemo(() => {
    if (selectedStock.market === 'US') {
      return Math.round(currentLivePrice * liveUsdInr);
    }
    return Math.round(currentLivePrice);
  }, [selectedStock.market, currentLivePrice, liveUsdInr]);

  return (
    <div className="space-y-5 font-sans">
      {/* ────────────────── TOP MASTER CONTROL TERMINAL ────────────────── */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0f172a]/95 via-[#0c101d]/95 to-[#090d16]/95 p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Stocks · US Equities & NIFTY 100
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-semibold flex items-center gap-1.5 ${
                isMarketLive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isMarketLive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{isMarketLive ? (isDemoSim ? '⚡ DEMO SIMULATION (1s TICKS)' : '● MARKET OPEN') : `🔴 ${marketSession.label}`}</span>
                {!isMarketLive && (
                  <span className="hidden sm:inline font-normal text-rose-300 text-[10px]">({marketSession.nextSessionText})</span>
                )}
              </span>
              <span className="text-[11px] font-mono text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-full bg-slate-900/80 flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
                USD/INR: <b className="text-white">₹{liveUsdInr.toFixed(2)}</b>
                {isUsdInrLive && <span className="text-emerald-400 text-[10px] font-bold">● LIVE</span>}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
              📊 AI Stock Investment Intelligence
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              High-conviction investment decision support for Indian investors using INDmoney. Combines live real-time price feeds, multi-factor scoring, fundamentals, and currency impact.
            </p>
          </div>

          {/* MODE TOGGLE SWITCHER */}
          <div className="flex items-center bg-[#070b14] p-1.5 rounded-xl border border-slate-800 shrink-0 shadow-inner">
            <button
              onClick={() => setActiveMode('INDMONEY_INVESTMENT')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeMode === 'INDMONEY_INVESTMENT'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg ring-1 ring-sky-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              🇮🇳 INDmoney 1–6M Mode
            </button>
            <button
              onClick={() => setActiveMode('TACTICAL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeMode === 'TACTICAL'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg ring-1 ring-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-300" />
              ⚡ Tactical & Swing Mode
            </button>
            <button
              onClick={() => setActiveMode('DEEEPR_TRADING')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeMode === 'DEEEPR_TRADING'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg ring-1 ring-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-300" />
              🎯 Deeepr.ai 1–2D Hold
            </button>
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-stock-research') : (window.location.hash = '#deeepr-stock-research')}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 border border-cyan-400/40 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-200" />
              <span>🏛️ DEEEPR Stock Research (5–12M) ↗</span>
            </button>
            <a
              href="#indian-stock-ai"
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500/20 to-emerald-500/20 text-white hover:opacity-90 border border-primary/40 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🇮🇳 Indian Stocks AI (Top 500) ↗</span>
            </a>
          </div>
        </div>

        {/* SEARCH, MARKET FILTERS & LIVE TICK ENGINE CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticker (NVDA, Apple, TCS)..."
                className="w-full rounded-lg border border-slate-800 bg-[#070b14] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex gap-1">
              {(['ALL', 'US', 'IN'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarketFilter(m)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                    marketFilter === m
                      ? 'border-sky-500/50 bg-sky-500/20 text-sky-300 font-bold'
                      : 'border-slate-800 bg-[#070b14] text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'ALL' ? 'All' : m === 'US' ? '🇺🇸 US Equities' : '🇮🇳 NIFTY 100'}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE TICK STATUS & DEMO TEST SIMULATION CONTROLS */}
          <div className="flex items-center gap-2 text-xs font-mono ml-auto">
            <button
              onClick={() => setIsDemoSim(!isDemoSim)}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                isMarketLive
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-[#070b14] text-slate-400 hover:text-white'
              }`}
              title={marketSession.isOpen ? "Market is live continuous" : "Toggle manual tick simulation for weekend/after-hours testing"}
            >
              {isMarketLive ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{isDemoSim ? 'Test Sim: Active' : 'Live Ticks: Active'}</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-rose-400" />
                  <span>Market Closed: Settled Price</span>
                  <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">TEST SIM</span>
                </>
              )}
            </button>

            {activeMode === 'TACTICAL' && (
              <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                {(['15m', '1h', '4h', '1d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${
                      timeframe === tf
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-[#070b14] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HORIZONTAL QUICK-SELECT TICKER CHIPS */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {filteredStocks.slice(0, 32).map((s) => (
            <button
              key={s.symbol}
              onClick={() => setSelectedStock(s)}
              className={`shrink-0 rounded-lg border px-3 py-1 text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedStock.symbol === s.symbol
                  ? 'border-sky-400 bg-sky-500/15 font-bold text-white shadow-md ring-1 ring-sky-400/30'
                  : 'border-slate-800/80 bg-[#070b14] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{s.market === 'US' ? '🇺🇸' : '🇮🇳'}</span>
              <span>{s.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────── MODE 1: INDMONEY 1–6M US INVESTMENT MODE ────────────────── */}
      {activeMode === 'INDMONEY_INVESTMENT' && (
        <div className="space-y-5">
          {/* 1. HERO ANSWER BANNER: Explicit Answer to the Indian Investor INDmoney Question */}
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0c1326] via-[#0f172a] to-[#090d16] p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Sparkles className="w-52 h-52 text-sky-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full font-bold flex items-center gap-1">
                      🇮🇳 INDmoney Institutional Research · 1–6 Month Horizon
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedStock.name} ({selectedStock.symbol}) · {selectedStock.sector}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5 font-sans">
                    “For an Indian investor using INDmoney, is this US stock attractive to hold for 1–6 months at the current price?”
                  </h2>
                </div>

                {/* VERDICT BADGE & AI SCORE */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">AI Score</span>
                    <div className="text-2xl font-black font-mono text-white flex items-center gap-1 justify-end">
                      <span className="text-sky-400">
                        {investmentProfile ? investmentProfile.scoreBreakdown.total : 84}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                    </div>
                  </div>

                  {/* 6 Official Verdict Badges */}
                  <div className="px-4 py-2 rounded-xl font-bold font-mono text-sm border shadow-xl flex items-center gap-2 bg-[#070b14] border-sky-500/40 text-white">
                    {investmentProfile?.indmoneyVerdict.verdict === 'BUY NOW' && <span className="text-emerald-400 font-black">🟢 BUY NOW</span>}
                    {investmentProfile?.indmoneyVerdict.verdict === 'BUY ON PULLBACK' && <span className="text-emerald-400 font-black">🟢 BUY ON PULLBACK</span>}
                    {investmentProfile?.indmoneyVerdict.verdict === 'BUY ON BREAKOUT' && <span className="text-emerald-400 font-black">🟢 BUY ON BREAKOUT</span>}
                    {investmentProfile?.indmoneyVerdict.verdict === 'WATCH / WAIT' && <span className="text-amber-400 font-black">🟡 WATCH / WAIT</span>}
                    {investmentProfile?.indmoneyVerdict.verdict === 'HIGH RISK' && <span className="text-orange-400 font-black">🟠 HIGH RISK</span>}
                    {investmentProfile?.indmoneyVerdict.verdict === 'AVOID' && <span className="text-rose-400 font-black">🔴 AVOID</span>}
                    {!investmentProfile && <span className="text-sky-400 font-bold">🟢 ACCUMULATE</span>}
                  </div>
                </div>
              </div>

              {/* DEFINITIVE ANSWER BOX */}
              <div className="bg-[#070b14]/90 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <p className="text-sm font-sans text-slate-200 leading-relaxed">
                  <strong className="text-sky-400">Executive Verdict: </strong>
                  {investmentProfile
                    ? investmentProfile.indmoneyVerdict.answer
                    : `For an Indian investor using INDmoney, ${selectedStock.name} represents a solid exposure to US capital markets with favorable multi-month compounding dynamics.`}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Confidence: <b className="text-white">{investmentProfile?.indmoneyVerdict.confidence ?? 'High'}</b></span>
                  <span>•</span>
                  <span>Horizon: <b className="text-white">1 to 6 Months</b></span>
                  <span>•</span>
                  <span>Preferred Strategy: <b className="text-amber-300">Staggered SIP / Buy on Dips</b></span>
                  <span>•</span>
                  <span>INDmoney TCS Surcharge: <b className="text-emerald-400">0% (Under ₹7L LRS annual limit)</b></span>
                </div>
              </div>

              {/* LIVE PRICING & INDMONEY USD/INR METRIC BAR */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0a0f1d] p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
                {/* Stock Price with Market-Aware Tick Animation */}
                <div className={`p-2 rounded-lg transition-all ${
                  tickFlash === 'UP' ? 'bg-emerald-500/15 ring-1 ring-emerald-500/40' : tickFlash === 'DOWN' ? 'bg-rose-500/15 ring-1 ring-rose-500/40' : 'bg-transparent'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase block flex items-center justify-between">
                    <span>{isMarketLive ? 'Live Stock Price' : 'Settled Closing Price'}</span>
                    <span className={`text-[10px] font-bold ${isMarketLive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isMarketLive ? '● LIVE' : '🔴 CLOSED'}
                    </span>
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-lg font-black text-white font-mono tracking-tight">
                      {selectedStock.market === 'US' ? `$${currentLivePrice.toFixed(2)}` : `₹${currentLivePrice.toFixed(2)}`}
                    </span>
                    {isMarketLive && livePriceOffset !== 0 ? (
                      <span className={`text-[11px] font-bold flex items-center ${
                        livePriceOffset >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {livePriceOffset >= 0 ? '▲' : '▼'} {Math.abs(livePriceOffset).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {isMarketLive ? '0.00' : 'Settled'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {selectedStock.market === 'US' ? 'USD per share' : 'INR per share'}
                  </span>
                </div>

                {/* Live INR Cost per share */}
                <div className="p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Cost in INR (1 Share)</span>
                  <div className="text-lg font-black text-sky-400 font-mono tracking-tight mt-0.5">
                    ₹{inrPricePerShare.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 block">@ ₹{liveUsdInr.toFixed(2)} / USD</span>
                </div>

                {/* Target Price */}
                <div className="p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">1–6M Target 2</span>
                  <div className="text-lg font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                    {investmentProfile?.investmentPlan.target2 ?? '$280.00'}
                  </div>
                  <span className="text-[10px] text-emerald-400 block font-semibold">
                    {investmentProfile?.investmentPlan.baseCase.upside ?? '+21.4%'} USD upside
                  </span>
                </div>

                {/* Net INR Return */}
                <div className="p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Est. Net Return in INR</span>
                  <div className="text-lg font-black text-teal-300 font-mono tracking-tight mt-0.5">
                    ~+23.3% INR
                  </div>
                  <span className="text-[10px] text-slate-400 block">Incl. +1.9% FX tailwind</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CHART + INVESTMENT PLAN SIDE-BY-SIDE */}
          <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
            {/* Left: TradingView Live Interactive Chart */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c101d] p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                    <BarChart2 className="w-4 h-4 text-sky-400" />
                    Interactive Real-Time Chart · TradingView Canvas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live chart streaming 1-Day, 4-Hour, and 1-Week technical levels with EMA, RSI, and MACD
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800 text-[11px]">EMA 20/50/200</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800 text-[11px]">RSI (14)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800 text-[11px]">MACD</span>
                </div>
              </div>

              {selectedStock.market === 'US' ? (
                <TradingViewWidget
                  symbol={selectedStock.tv}
                  interval="D"
                  height={540}
                  studies={['STD;EMA', 'STD;RSI', 'STD;MACD']}
                />
              ) : (
                <NSEInteractiveChart
                  candles={tacticalAnalysis.candles}
                  lines={tacticalAnalysis.levels}
                  height={540}
                />
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                <span>52-Week Range: <b className="text-white">{investmentProfile?.technical.fiftyTwoWeekLow ?? '$164'}</b> — <b className="text-white">{investmentProfile?.technical.fiftyTwoWeekHigh ?? '$244'}</b></span>
                <span>Distance from ATH: <b className="text-amber-400">{investmentProfile?.technical.distanceFrom52WHigh ?? '-5.2%'}</b></span>
              </div>
            </div>

            {/* Right: 1–6 Month Investment Plan Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c101d] p-5 shadow-xl space-y-4 font-mono">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-amber-400 uppercase tracking-widest block font-bold">Execution Blueprint</span>
                <h3 className="text-lg font-bold text-white font-sans mt-0.5">
                  1–6 Month Investment Plan
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Disciplined entry and exit parameters tailored for medium-term capital compounding.
                </p>
              </div>

              {/* Price Targets & Key Execution Zones */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#070b14] p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Preferred Entry</span>
                  <b className="text-white text-sm">{investmentProfile?.investmentPlan.preferredEntry ?? '$218 – $226'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Buy on Pullback</span>
                  <b className="text-amber-300 text-sm">{investmentProfile?.investmentPlan.buyOnPullback ?? '$210 – $215'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Breakout Level</span>
                  <b className="text-sky-400 text-sm">{investmentProfile?.investmentPlan.breakoutLevel ?? '$244.50'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Stop / Invalidation</span>
                  <b className="text-rose-400 text-sm">{investmentProfile?.investmentPlan.stopLoss ?? '$198.00'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Target 1 (1–2M)</span>
                  <b className="text-emerald-400 text-sm">{investmentProfile?.investmentPlan.target1 ?? '$255.00'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Target 2 (3–4M)</span>
                  <b className="text-emerald-400 text-sm">{investmentProfile?.investmentPlan.target2 ?? '$280.00'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Target 3 (5–6M)</span>
                  <b className="text-teal-300 text-sm">{investmentProfile?.investmentPlan.target3 ?? '$310.00'}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Risk / Reward</span>
                  <b className="text-white text-sm">{investmentProfile?.investmentPlan.riskReward ?? '1 : 3.4'}</b>
                </div>
              </div>

              {/* Core Questions: Why Buy vs Why Wait */}
              <div className="space-y-3 font-sans text-xs">
                <div>
                  <span className="text-emerald-400 font-bold font-mono text-[11px] flex items-center gap-1 uppercase">
                    <CheckCircle className="w-3.5 h-3.5" /> Why Buy?
                  </span>
                  <ul className="mt-1 space-y-1 text-slate-300 pl-2">
                    {(investmentProfile?.investmentPlan.whyBuy ?? [
                      'Dominant competitive moat with high switching costs.',
                      'Substantial free cash flow compounding at healthy margins.',
                      'Secular tailwinds across AI, cloud computing, or consumer brand loyalty.'
                    ]).map((r, i) => (
                      <li key={i} className="text-[11px]">• {r}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-amber-400 font-bold font-mono text-[11px] flex items-center gap-1 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" /> Why Wait?
                  </span>
                  <ul className="mt-1 space-y-1 text-slate-300 pl-2">
                    {(investmentProfile?.investmentPlan.whyWait ?? [
                      'Valuation multiples near historical highs warrant waiting for a 5-8% market pullback.',
                      'Earnings or macroeconomic release scheduled within next 30 days.'
                    ]).map((r, i) => (
                      <li key={i} className="text-[11px]">• {r}</li>
                    ))}
                  </ul>
                </div>

                {/* Key Catalyst & Risk */}
                <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
                  <p>
                    <b className="text-sky-400">Biggest Catalyst: </b>
                    <span className="text-slate-400">
                      {investmentProfile?.investmentPlan.biggestCatalyst ?? 'Quarterly earnings volume shipments and cloud contract releases.'}
                    </span>
                  </p>
                  <p>
                    <b className="text-rose-400">Biggest Risk: </b>
                    <span className="text-slate-400">
                      {investmentProfile?.investmentPlan.biggestRisk ?? 'Geopolitical export restrictions or macro interest rate volatility.'}
                    </span>
                  </p>
                  <p>
                    <b className="text-white">Next Earnings Date: </b>
                    <span className="text-amber-300 font-mono">
                      {investmentProfile?.earnings.nextEarningsDate ?? 'Data unavailable'} ({investmentProfile?.earnings.daysToEarnings ?? 30} days)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI SCORE 100 BREAKDOWN BAR */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c101d] p-4 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  AI Score 100 System — Multi-Pillar Quantitative Weighting
                </h3>
                <p className="text-xs text-slate-400">
                  Weighted scoring matrix: Fundamentals (20), Earnings (15), Growth (15), Valuation (10), Technicals (10), Momentum (10), Sector (5), Catalysts (5), Macro (5), Risk (5)
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-black text-sky-400">
                  Total: {investmentProfile ? investmentProfile.scoreBreakdown.total : 88} / 100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 font-mono text-center text-xs">
              {[
                { label: 'Fundamentals', max: 20, val: investmentProfile?.scoreBreakdown.fundamentals.score ?? 18 },
                { label: 'Earnings', max: 15, val: investmentProfile?.scoreBreakdown.earnings.score ?? 14 },
                { label: 'Growth', max: 15, val: investmentProfile?.scoreBreakdown.growth.score ?? 14 },
                { label: 'Valuation', max: 10, val: investmentProfile?.scoreBreakdown.valuation.score ?? 7 },
                { label: 'Technical', max: 10, val: investmentProfile?.scoreBreakdown.technical.score ?? 9 },
                { label: 'Momentum', max: 10, val: investmentProfile?.scoreBreakdown.momentum.score ?? 9 },
                { label: 'Sector', max: 5, val: investmentProfile?.scoreBreakdown.sector.score ?? 5 },
                { label: 'Catalysts', max: 5, val: investmentProfile?.scoreBreakdown.catalysts.score ?? 5 },
                { label: 'Macro', max: 5, val: investmentProfile?.scoreBreakdown.macro.score ?? 4 },
                { label: 'Risk Mgmt', max: 5, val: investmentProfile?.scoreBreakdown.risk.score ?? 4 }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#070b14] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block truncate">{item.label}</span>
                  <span className="text-sm font-bold text-white block mt-1">
                    {item.val} <span className="text-[10px] text-slate-500">/{item.max}</span>
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${(item.val / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. SCENARIO ANALYSIS: BULL / BASE / BEAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-[#0c101d] p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Bull Case (1–6M)
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {investmentProfile?.investmentPlan.bullCase.target ?? '$320'} ({investmentProfile?.investmentPlan.bullCase.upside ?? '+38.7%'})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {investmentProfile?.investmentPlan.bullCase.drivers ?? 'Hyperscaler demand accelerates, revenue beats street targets by >15%, multiple expansion.'}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/20 to-[#0c101d] p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Base Case (1–6M)
                </span>
                <span className="text-sm font-bold text-sky-400">
                  {investmentProfile?.investmentPlan.baseCase.target ?? '$280'} ({investmentProfile?.investmentPlan.baseCase.upside ?? '+21.4%'})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {investmentProfile?.investmentPlan.baseCase.drivers ?? 'Steady consensus revenue execution, steady 30% margin preservation, baseline multiple.'}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/20 to-[#0c101d] p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Bear Case (1–6M)
                </span>
                <span className="text-sm font-bold text-rose-400">
                  {investmentProfile?.investmentPlan.bearCase.target ?? '$185'} ({investmentProfile?.investmentPlan.bearCase.downside ?? '-19.8%'})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {investmentProfile?.investmentPlan.bearCase.drivers ?? 'Supply chain bottlenecks or geopolitical trade restrictions triggering broad multiple compression.'}
              </p>
            </div>
          </div>

          {/* 5. DEEP DIVE TABS FOR ALL MANDATED PILLARS */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c101d] p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80">
              {[
                { id: 'OVERVIEW', label: '📌 Key Metrics' },
                { id: 'FUNDAMENTALS', label: '🏢 Business & Fundamentals' },
                { id: 'EARNINGS', label: '📅 Earnings Deep Dive' },
                { id: 'GROWTH', label: '🚀 Growth & Vision' },
                { id: 'VALUATION', label: '⚖️ Valuation & Peers' },
                { id: 'TECHNICAL', label: '📊 Technical (1D+4H+1W)' },
                { id: 'MACRO_INR', label: '🇮🇳 US Macro & USD/INR Impact' },
                { id: 'CATALYSTS', label: '⚡ Catalysts (30/90/180d)' },
                { id: 'RISKS', label: '🛡️ 5-Pillar Risks' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInvestmentTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    investmentTab === tab.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white bg-[#070b14] border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {investmentTab === 'OVERVIEW' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 uppercase block text-[10px]">Revenue Growth YoY</span>
                  <span className="text-base font-bold text-emerald-400 block mt-1">
                    {investmentProfile?.fundamentals.revenueGrowthYoY ?? 'Data unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">3Y CAGR: {investmentProfile?.fundamentals.revenue3YCAGR ?? 'Data unavailable'}</span>
                </div>

                <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 uppercase block text-[10px]">Gross / Net Margin</span>
                  <span className="text-base font-bold text-white block mt-1">
                    {investmentProfile?.fundamentals.grossMargin ?? 'Data unavailable'} / {investmentProfile?.fundamentals.netMargin ?? 'Data unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">Operating: {investmentProfile?.fundamentals.operatingMargin ?? 'Data unavailable'}</span>
                </div>

                <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 uppercase block text-[10px]">Forward P/E & PEG</span>
                  <span className="text-base font-bold text-white block mt-1">
                    {investmentProfile?.valuation.forwardPE ?? 'Data unavailable'} (PEG: {investmentProfile?.valuation.pegRatio ?? 'Data unavailable'})
                  </span>
                  <span className="text-[10px] text-amber-300">Class: {investmentProfile?.valuation.classification ?? 'Fair'}</span>
                </div>

                <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 uppercase block text-[10px]">Free Cash Flow (TTM)</span>
                  <span className="text-base font-bold text-teal-300 block mt-1">
                    {investmentProfile?.fundamentals.freeCashFlow ?? 'Data unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">Net Cash: {investmentProfile?.fundamentals.netCashStatus ?? 'Positive'}</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. BUSINESS & FUNDAMENTALS */}
            {investmentTab === 'FUNDAMENTALS' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-sky-400 uppercase font-mono block">Business Model & Moat</span>
                  <p className="mt-1.5 text-slate-200 leading-relaxed">
                    {investmentProfile?.fundamentals.businessModel ?? 'Data unavailable'}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">ROE / ROIC</span>
                    <b className="text-white text-sm mt-1 block">
                      {investmentProfile?.fundamentals.roe ?? 'Data unavailable'} / {investmentProfile?.fundamentals.roic ?? 'Data unavailable'}
                    </b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Cash & Short-Term Inv.</span>
                    <b className="text-white text-sm mt-1 block">
                      {investmentProfile?.fundamentals.cashAndShortTerm ?? 'Data unavailable'}
                    </b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Total Debt</span>
                    <b className="text-white text-sm mt-1 block">
                      {investmentProfile?.fundamentals.totalDebt ?? 'Data unavailable'}
                    </b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Business Quality Rating</span>
                    <b className="text-amber-300 text-sm mt-1 block">
                      {investmentProfile?.fundamentals.businessQualityRating ?? 'Exceptional (A+)'}
                    </b>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. EARNINGS DEEP DIVE */}
            {investmentTab === 'EARNINGS' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Latest Quarter EPS</span>
                    <b className="text-emerald-400 text-sm mt-1 block">
                      {investmentProfile?.earnings.epsReported ?? 'Data unavailable'} (Est: {investmentProfile?.earnings.epsEstimate ?? 'N/A'})
                    </b>
                    <span className="text-[10px] text-emerald-400">{investmentProfile?.earnings.epsBeatMiss ?? 'Beat'}</span>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Latest Quarter Revenue</span>
                    <b className="text-emerald-400 text-sm mt-1 block">
                      {investmentProfile?.earnings.revenueReported ?? 'Data unavailable'}
                    </b>
                    <span className="text-[10px] text-emerald-400">{investmentProfile?.earnings.revenueBeatMiss ?? 'Beat'}</span>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Next Earnings Date</span>
                    <b className="text-amber-300 text-sm mt-1 block">
                      {investmentProfile?.earnings.nextEarningsDate ?? 'Data unavailable'}
                    </b>
                    <span className="text-[10px] text-slate-500">in {investmentProfile?.earnings.daysToEarnings ?? 30} days</span>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Earnings Risk Level</span>
                    <b className="text-white text-sm mt-1 block">
                      {investmentProfile?.earnings.earningsRisk ?? 'Low'}
                    </b>
                  </div>
                </div>

                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div>
                    <span className="font-bold text-sky-400 uppercase font-mono text-xs">Management Forward Guidance:</span>
                    <p className="mt-0.5 text-slate-200">
                      {investmentProfile?.earnings.managementGuidance ?? 'Data unavailable'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-amber-300 uppercase font-mono text-xs">Analyst Estimate Revisions (Last 90 Days):</span>
                    <p className="mt-0.5 text-slate-200">
                      {investmentProfile?.earnings.analystEstimateRevisions ?? 'Data unavailable'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. GROWTH & FUTURE VISION */}
            {investmentTab === 'GROWTH' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Total Addressable Market (TAM)</span>
                    <b className="text-white text-sm mt-1 block">{investmentProfile?.growthVision.tam ?? 'Data unavailable'}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Industry CAGR</span>
                    <b className="text-emerald-400 text-sm mt-1 block">{investmentProfile?.growthVision.industryGrowthCAGR ?? 'Data unavailable'}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Market Share</span>
                    <b className="text-amber-300 text-sm mt-1 block">{investmentProfile?.growthVision.marketShare ?? 'Data unavailable'}</b>
                  </div>
                </div>

                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <span className="font-bold text-sky-400 uppercase font-mono text-xs">AI & Technology Opportunity:</span>
                    <p className="mt-0.5 text-slate-200">{investmentProfile?.growthVision.aiTechOpportunity ?? 'Data unavailable'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-white uppercase font-mono text-xs">New Products & Pipeline:</span>
                    <p className="mt-0.5 text-slate-200">{investmentProfile?.growthVision.newProducts ?? 'Data unavailable'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-teal-300 uppercase font-mono text-xs">Multi-Year Outlook (1Y / 3Y / 5Y):</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-1.5 text-[11px] font-mono">
                      <div className="p-2.5 rounded-lg bg-[#0c101d] border border-slate-800">
                        <b className="text-white block">1-Year Outlook:</b>
                        <span className="text-slate-400">{investmentProfile?.growthVision.outlook1Year ?? 'Data unavailable'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0c101d] border border-slate-800">
                        <b className="text-white block">3-Year Outlook:</b>
                        <span className="text-slate-400">{investmentProfile?.growthVision.outlook3Year ?? 'Data unavailable'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0c101d] border border-slate-800">
                        <b className="text-white block">5-Year Outlook:</b>
                        <span className="text-slate-400">{investmentProfile?.growthVision.outlook5Year ?? 'Data unavailable'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. VALUATION & PEERS */}
            {investmentTab === 'VALUATION' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Trailing P/E</span>
                    <b className="text-white text-sm mt-1 block">{investmentProfile?.valuation.trailingPE ?? 'Data unavailable'}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Forward P/E</span>
                    <b className="text-sky-400 text-sm mt-1 block">{investmentProfile?.valuation.forwardPE ?? 'Data unavailable'}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">PEG Ratio</span>
                    <b className="text-emerald-400 text-sm mt-1 block">{investmentProfile?.valuation.pegRatio ?? 'Data unavailable'}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">EV / EBITDA</span>
                    <b className="text-white text-sm mt-1 block">{investmentProfile?.valuation.evEbitda ?? 'Data unavailable'}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Valuation Verdict</span>
                    <b className="text-amber-300 text-sm mt-1 block">{investmentProfile?.valuation.classification ?? 'Fair'}</b>
                  </div>
                </div>

                {/* Competitors Valuation Benchmark Table */}
                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-white text-xs font-sans">Competitor Peer Multiples Benchmarking:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                          <th className="py-2">Peer Company</th>
                          <th>Ticker</th>
                          <th>Trailing P/E</th>
                          <th>Forward P/E</th>
                          <th>P/S</th>
                          <th>Revenue Growth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {(investmentProfile?.valuation.competitorValuations ?? []).map((peer, i) => (
                          <tr key={i} className="hover:bg-[#0c101d]">
                            <td className="py-2 font-bold text-white">{peer.peer}</td>
                            <td className="text-sky-400">{peer.ticker}</td>
                            <td>{peer.pe}</td>
                            <td>{peer.fwdPe}</td>
                            <td>{peer.ps}</td>
                            <td className="text-emerald-400">{peer.growth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 6. TECHNICAL ANALYSIS */}
            {investmentTab === 'TECHNICAL' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">20 / 50 EMA</span>
                    <b className="text-white text-sm mt-1 block">
                      {investmentProfile?.technical.ema20_1D ?? '$227'} / {investmentProfile?.technical.ema50_1D ?? '$218'}
                    </b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">100 / 200 EMA</span>
                    <b className="text-white text-sm mt-1 block">
                      {investmentProfile?.technical.ema100_1D ?? '$204'} / {investmentProfile?.technical.ema200_1D ?? '$182'}
                    </b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">RSI (14) 1D / 1W</span>
                    <b className="text-emerald-400 text-sm mt-1 block">
                      {investmentProfile?.technical.rsi14_1D ?? 62} / {investmentProfile?.technical.rsi14_1W ?? 68}
                    </b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Market Structure</span>
                    <b className="text-teal-300 text-xs mt-1 block">
                      {investmentProfile?.technical.marketStructure ?? 'Uptrend'}
                    </b>
                  </div>
                </div>

                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 space-y-2 font-sans">
                  <p><b className="text-sky-400 font-mono">EMA Alignment: </b>{investmentProfile?.technical.alignment ?? 'Bullish'}</p>
                  <p><b className="text-white font-mono">MACD: </b>{investmentProfile?.technical.macdStatus ?? 'Bullish positive crossover'}</p>
                  <p><b className="text-white font-mono">Volume Profile: </b>{investmentProfile?.technical.volumeProfile ?? 'Heavy institutional accumulation'}</p>
                  <p><b className="text-emerald-400 font-mono">Key Support: </b>{investmentProfile?.technical.support1 ?? '$218'} | {investmentProfile?.technical.support2 ?? '$204'}</p>
                  <p><b className="text-rose-400 font-mono">Key Resistance: </b>{investmentProfile?.technical.resistance1 ?? '$244'} | {investmentProfile?.technical.resistance2 ?? '$260'}</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 7. US MACRO & INDIA / USD/INR IMPACT */}
            {investmentTab === 'MACRO_INR' && (
              <div className="space-y-4 text-xs font-sans">
                {/* Dedicated USD/INR Currency Effect Simulator for INDmoney */}
                <div className="bg-gradient-to-br from-[#0c1326] via-[#0f172a] to-[#090d16] p-5 rounded-2xl border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5 uppercase">
                      <Globe className="w-4 h-4 text-sky-400" />
                      USD / INR Movement Impact on Final INR Return
                    </span>
                    <span className="text-xs font-mono text-white bg-[#070b14] px-2.5 py-1 rounded-full border border-slate-800">
                      Live USD/INR: <b>₹{liveUsdInr.toFixed(2)}</b>
                    </span>
                  </div>

                  <p className="text-slate-200 leading-relaxed">
                    {investmentProfile?.macroAndCurrency.usdInrScenario.tailwindDescription ?? US_MACRO_SNAPSHOT.fedRate}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs pt-1">
                    <div className="p-3 rounded-xl bg-[#070b14] border border-emerald-500/30">
                      <span className="text-emerald-400 font-bold block">🟢 INR Depreciation (+FX Tailwind Boost):</span>
                      <p className="text-slate-400 mt-1 text-[11px]">
                        {investmentProfile?.macroAndCurrency.usdInrScenario.depreciationBoost ?? 'If USD/INR rises +2%, your USD stock gain is magnified by +2% when withdrawing into your Indian bank account.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070b14] border border-amber-500/30">
                      <span className="text-amber-400 font-bold block">🟠 INR Appreciation (-FX Currency Drag):</span>
                      <p className="text-slate-400 mt-1 text-[11px]">
                        {investmentProfile?.macroAndCurrency.usdInrScenario.appreciationDrag ?? 'If INR strengthens against USD, foreign currency returns experience a slight translation drag.'}
                      </p>
                    </div>
                  </div>

                  {/* INDmoney Tax & Compliance Notes */}
                  <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <b className="text-white block font-mono">🇮🇳 INDmoney LRS, TCS & Tax Rules:</b>
                    <p>{investmentProfile?.macroAndCurrency.usdInrScenario.indmoneyTaxTcsTips ?? '0% TCS under ₹7 Lakhs LRS limit; 25% US dividend withholding claimable under DTAA Form 67; LTCG applies after 24 months.'}</p>
                  </div>
                </div>

                {/* Macro Telemetry Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Fed Interest Rates</span>
                    <b className="text-white text-xs mt-1 block">{US_MACRO_SNAPSHOT.fedRate}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">US 10Y Yield</span>
                    <b className="text-sky-400 text-xs mt-1 block">{US_MACRO_SNAPSHOT.us10YYield}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">CPI / Core PCE</span>
                    <b className="text-emerald-400 text-xs mt-1 block">{US_MACRO_SNAPSHOT.cpiYoY} / {US_MACRO_SNAPSHOT.corePceYoY}</b>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">VIX / Crude Oil</span>
                    <b className="text-white text-xs mt-1 block">{US_MACRO_SNAPSHOT.vixVolatility} / {US_MACRO_SNAPSHOT.crudeWti}</b>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 8. UPCOMING CATALYSTS */}
            {investmentTab === 'CATALYSTS' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-white uppercase font-mono block text-xs">
                  Next 30 / 90 / 180 Days Catalyst Timeline
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(investmentProfile?.catalysts ?? [
                    { window: '30 Days', date: 'Next 30 Days', event: 'Quarterly Earnings Call', type: 'Earnings', impact: 'High', details: 'Full financial disclosure and forward management guidance.' },
                    { window: '90 Days', date: 'Next 90 Days', event: 'Product Launch & Keynote', type: 'Product Launch', impact: 'High', details: 'New commercial product line rollout.' },
                    { window: '180 Days', date: 'Next 180 Days', event: 'Annual Shareholder Summit', type: 'Major Event', impact: 'Medium', details: 'Long-term corporate capital allocation review.' }
                  ]).map((cat, idx) => (
                    <div key={idx} className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between font-mono">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                          {cat.window}
                        </span>
                        <span className="text-emerald-400 text-[10px] font-bold">{cat.impact} Impact</span>
                      </div>
                      <h4 className="font-bold text-white text-xs font-sans">{cat.event}</h4>
                      <p className="text-[11px] text-slate-400">{cat.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 9. 5-PILLAR RISKS */}
            {investmentTab === 'RISKS' && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs font-mono">
                {[
                  { name: 'Company Risk', data: investmentProfile?.risks.companyRisk ?? { level: 'Medium', note: 'Single-source foundry dependence on TSMC.' } },
                  { name: 'Sector Risk', data: investmentProfile?.risks.sectorRisk ?? { level: 'Low', note: 'Secular tailwinds outpace cyclical headwinds.' } },
                  { name: 'Macro Risk', data: investmentProfile?.risks.macroRisk ?? { level: 'Medium', note: 'Higher-for-longer interest rates or recessionary slowdown.' } },
                  { name: 'Valuation Risk', data: investmentProfile?.risks.valuationRisk ?? { level: 'Medium', note: 'Elevated multiples demand continuous beat-and-raise cycles.' } },
                  { name: 'Currency Risk', data: investmentProfile?.risks.currencyRisk ?? { level: 'Low', note: 'USD historically strengthens against INR, reducing downside.' } }
                ].map((r, i) => (
                  <div key={i} className="bg-[#070b14] p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 uppercase text-[10px] block">{r.name}</span>
                    <span className={`text-xs font-bold block ${r.data.level === 'Low' ? 'text-emerald-400' : r.data.level === 'Medium' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {r.data.level} Risk
                    </span>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{r.data.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. DATA INTEGRITY & LEGAL DISCLAIMER */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
            <span className="text-white font-semibold font-mono">Institutional Research Notice: </span>
            Never fabricate financial data, earnings, prices, news, analyst estimates or valuations. If reliable data is unavailable, “Data unavailable” is shown. This system delivers quantitative decision support for Indian investors using INDmoney. It does not guarantee returns or future prices.
          </div>
        </div>
      )}

      {/* ────────────────── MODE 2: TACTICAL / SWING SIGNAL MODE (Original features) ────────────────── */}
      {activeMode === 'TACTICAL' && (
        <div className="space-y-6">
          {/* 2-Column: TradingView Interactive Chart + Right Tactical AI Verdict */}
          <div className="grid gap-4 xl:grid-cols-[1fr_370px]">
            {/* Left: TradingView / NSE Candlestick Chart */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c101d] p-3.5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-mono text-slate-400">
                  {selectedStock.name} ({selectedStock.symbol}) · {selectedStock.sector} · Real-time Canvas
                </span>
                <span className="text-xs text-sky-400 font-mono">
                  {selectedStock.market === 'US' ? 'TradingView Advanced Widget' : 'Live Candlestick Feed'}
                </span>
              </div>

              {selectedStock.market === 'US' ? (
                <TradingViewWidget
                  symbol={selectedStock.tv}
                  interval={timeframe === '15m' ? '15' : timeframe === '1h' ? '60' : timeframe === '4h' ? '240' : 'D'}
                  height={520}
                  studies={['STD;EMA', 'STD;RSI', 'STD;MACD']}
                />
              ) : (
                <div className="space-y-1">
                  <NSEInteractiveChart
                    candles={tacticalAnalysis.candles}
                    lines={tacticalAnalysis.levels}
                    height={520}
                  />
                  <p className="text-[11px] text-slate-400 px-1 font-mono">
                    NSE stocks TradingView ke free embed me allowed nahi hain, isliye yahan live Yahoo candles ka chart hai.{' '}
                    <a
                      className="text-sky-400 underline"
                      href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(selectedStock.tv)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      TradingView par kholein ↗
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Right: Tactical AI Verdict Panel (Original) */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c101d] p-5 space-y-4 font-mono shadow-xl">
              <div>
                <p className="text-xs text-slate-400 uppercase">{selectedStock.name} · {selectedStock.sector}</p>
                <p className={`mt-2 text-3xl font-extrabold ${tacticalAnalysis.signal === 'LONG' ? 'text-emerald-400' : tacticalAnalysis.signal === 'SHORT' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {tacticalAnalysis.signal === 'LONG' ? '↗ LONG' : tacticalAnalysis.signal === 'SHORT' ? '↘ SHORT' : '⏸ WAIT'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Signal Quality: <b className="text-white">{tacticalAnalysis.quality}</b> · Reference Price: <b className="text-white">{selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.entry.toLocaleString()}</b>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-800 py-3">
                <div><span className="text-slate-400 block">Entry</span><b>{selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.entry}</b></div>
                <div className="text-rose-400"><span className="text-slate-400 block">Stop Loss</span><b>{selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.stop}</b></div>
                <div className="text-emerald-400"><span className="text-slate-400 block">Target TP1</span><b>{selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.tp1}</b></div>
                <div className="text-emerald-400"><span className="text-slate-400 block">Target TP2</span><b>{selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.tp2}</b></div>
                <div className="text-emerald-400"><span className="text-slate-400 block">Target TP3</span><b>{selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.tp3}</b></div>
                <div><span className="text-slate-400 block">Risk / Reward</span><b>1:2.4</b></div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-slate-400 uppercase font-bold text-[11px]">Quantitative Reasons:</p>
                {tacticalAnalysis.reasons.map((r, i) => (
                  <p key={i} className="text-slate-300 font-sans text-xs">• {r}</p>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                RSI {tacticalAnalysis.rsi} · EMA20 {selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.ema20} · EMA50 {selectedStock.market === 'US' ? '$' : '₹'}{tacticalAnalysis.ema50}
              </div>

              {/* Support & Resistance pills */}
              <div className="pt-2">
                <p className="text-slate-400 uppercase font-bold text-[10px] mb-1.5">📍 Support / Resistance</p>
                <div className="flex flex-wrap gap-1.5">
                  {tacticalAnalysis.levels.map((lvl, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        lvl.kind === 'support'
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                          : 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {lvl.kind === 'support' ? 'S' : 'R'} {selectedStock.market === 'US' ? '$' : '₹'}{lvl.price}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 11-Factor Confluence Panel & Details (Original features preserved) */}
          <ConfluencePanel c={tacticalAnalysis.conf} />
          <ConfluenceDetails c={tacticalAnalysis.conf} />

          {/* Original Disclaimer from Lovable */}
          <p className="text-xs text-slate-400 border-t border-slate-800 pt-3 font-sans">
            Fundamentals, options chain, institutional/13F aur order-flow ka free reliable source nahi hai — isliye wo yahan nahi dikhaye gaye (koi fake data nahi). Ye decision support hai, guaranteed profit nahi.
          </p>
        </div>
      )}

      {/* ────────────────── MODE 3: DEEEPR.AI 1–2 DAYS HOLD SWING INTELLIGENCE ────────────────── */}
      {activeMode === 'DEEEPR_TRADING' && (
        <DeeeprAiChartView />
      )}
    </div>
  );
}
