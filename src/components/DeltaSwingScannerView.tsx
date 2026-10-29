import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Target,
  Search, RefreshCw, Volume2, VolumeX,
  ArrowUpRight, Layers,
  Compass, Clock, Calculator, AlertTriangle,
  Calendar, ShieldCheck, DollarSign, BarChart2,
  Globe,
  TrendingUp, TrendingDown, ShieldAlert, Info,
  CheckCircle2, XCircle, Award, BookOpen, FileText,
  Activity, Zap, Play, Trash2, Check, ArrowDownRight
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import {
  TradingHorizon,
  CoinTier,
  MasterVerdict,
  DeltaDeepDossier,
  DeltaUniverseSummary,
  runDeltaAllCoinsScanner,
  getOrBuildDossierForSymbol,
  DELTA_ALL_COINS_SEEDS
} from '../services/deltaAllCoinsEngine';
import { deltaSwingService } from '../services/deltaSwingEngine';
import { voiceService } from '../services/voiceSynthesisService';
import TradingViewWidget from './TradingViewWidget';

interface Props {
  onNavigate?: (tabId: string) => void;
}

type FilterTab =
  | 'ALL'
  | 'CORE_HOLDS'
  | 'SWING_LONGS'
  | 'SWING_SHORTS'
  | 'POS_LONGS'
  | 'POS_SHORTS'
  | 'SQUEEZE_FUEL'
  | 'FLUSH_RISK'
  | 'AVOID_RISK';

type DossierSectionTab =
  | 'MEMO'
  | 'MONEY_FLOW'
  | 'ENTRY_PLAN'
  | 'SIZING_TABLE'
  | 'VALUATION'
  | 'TOKENOMICS'
  | 'BACKERS'
  | 'TECHNICALS'
  | 'DERIVATIVES'
  | 'MACRO_REGIME'
  | 'CATALYSTS'
  | 'PROFIT_BOOKING_TAX'
  | 'PORTFOLIO_HEAT'
  | 'SOURCES_GROUNDING'
  | 'PAPER_TRADE';

interface PaperTradePosition {
  id: string;
  symbol: string;
  tier: CoinTier;
  horizon: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  contracts: number;
  notionalUsd: number;
  marginUsd: number;
  openedAt: string;
  pnlUsd: number;
  status: 'OPEN' | 'TP1_HIT' | 'CLOSED_SL' | 'CLOSED_MANUAL';
}

const POPULAR_COINS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'SUI', 'AVAX', 'NEAR', 'LINK', 'BNB', 'ADA', 'TAO', 'AAVE', 'INJ', 'PEPE', 'TIA', 'RENDER', 'PENDLE'
];

export default function DeltaSwingScannerView({ onNavigate: _onNavigate }: Props) {
  // Horizon Mode: SWING (1-4W / 4H) vs POSITION (1-6M / 1D) vs LONG-TERM HOLD (1-3Y / 1W)
  const [horizon, setHorizon] = useState<TradingHorizon>('SWING_3_30D');

  // Capital & Risk settings
  const [accountCapital, setAccountCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);

  // Active Coin Selection
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [dossierTab, setDossierTab] = useState<DossierSectionTab>('MEMO');

  // Chart & Display Controls
  const [chartMode, setChartMode] = useState<'CANVAS' | 'TRADINGVIEW'>('CANVAS');
  const [langMode, setLangMode] = useState<'hinglish' | 'english'>('hinglish');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString());

  // Paper Trade simulator state
  const [paperPositions, setPaperPositions] = useState<PaperTradePosition[]>([
    {
      id: 'PT-101',
      symbol: 'BTC',
      tier: 'CORE_HOLD',
      horizon: 'SWING_3_30D',
      direction: 'LONG',
      entryPrice: 82450,
      stopLoss: 78500,
      tp1: 85500,
      tp2: 89000,
      contracts: 25,
      notionalUsd: 2061.25,
      marginUsd: 687.08,
      openedAt: '28-Oct 11:30 IST',
      pnlUsd: +45.2,
      status: 'OPEN'
    }
  ]);
  const [tradeSuccessToast, setTradeSuccessToast] = useState<string | null>(null);

  // Chart Container Refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Live universe cache
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Fetch live market data on mount and interval
  useEffect(() => {
    let isMounted = true;
    const fetchLivePrices = async () => {
      setIsRefreshing(true);
      try {
        const liveCoins = await deltaSwingService.fetchLiveUniverse();
        if (isMounted && liveCoins && liveCoins.length > 0) {
          const priceMap: Record<string, number> = {};
          liveCoins.forEach((c) => {
            priceMap[c.symbol] = c.price;
          });
          setLivePrices(priceMap);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (e) {
        console.warn('Delta live prices fetch fallback used:', e);
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 30000); // 30s auto-refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute Universe Summary for current Horizon and User Capital
  const universeSummary: DeltaUniverseSummary = useMemo(() => {
    return runDeltaAllCoinsScanner(horizon, accountCapital, riskPercent);
  }, [horizon, accountCapital, riskPercent]);

  // Active Deep Dossier for selected coin
  const activeDossier: DeltaDeepDossier = useMemo(() => {
    const liveP = livePrices[selectedSymbol];
    return getOrBuildDossierForSymbol(selectedSymbol, horizon, accountCapital, riskPercent, liveP);
  }, [selectedSymbol, horizon, accountCapital, riskPercent, livePrices]);

  // Filtered List of Dossiers
  const filteredDossiers = useMemo(() => {
    let list = universeSummary.allDossiers;

    if (filterTab === 'CORE_HOLDS') {
      list = universeSummary.shortlistCoreHolds;
    } else if (filterTab === 'SWING_LONGS') {
      list = universeSummary.shortlistSwingLongs;
    } else if (filterTab === 'SWING_SHORTS') {
      list = universeSummary.shortlistSwingShorts;
    } else if (filterTab === 'POS_LONGS') {
      list = universeSummary.shortlistPositionLongs;
    } else if (filterTab === 'POS_SHORTS') {
      list = universeSummary.shortlistPositionShorts;
    } else if (filterTab === 'SQUEEZE_FUEL') {
      list = universeSummary.squeezeCandidates;
    } else if (filterTab === 'FLUSH_RISK') {
      list = universeSummary.flushCandidates;
    } else if (filterTab === 'AVOID_RISK') {
      list = universeSummary.allDossiers.filter((d) => d.meta.tier === 'AVOID' || d.s3_valuation.next90dUnlockPct > 5);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.s1_identity.symbol.toLowerCase().includes(q) ||
          d.s1_identity.name.toLowerCase().includes(q) ||
          d.s1_identity.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [universeSummary, filterTab, searchQuery]);

  // Chart Rendering
  useEffect(() => {
    if (chartMode !== 'CANVAS' || !chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth || 800;
    const height = 380;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8'
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: '#1e293b'
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#38bdf8',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });

    // Generate anchored candles around active dossier price
    const baseP = activeDossier.s1_identity.price;
    const atrApprox = baseP * 0.04;
    const nowSec = Math.floor(Date.now() / 1000);
    const candleData = [];
    const volData = [];
    const isBear = activeDossier.s13_plan.direction === 'SHORT';

    for (let i = 40; i >= 0; i--) {
      const t = (nowSec - i * 14400) as any;
      const drift = isBear ? (40 - i) * 0.001 : -(40 - i) * 0.001;
      const noise = (Math.sin(i * 0.8) + Math.cos(i * 0.5)) * 0.5;
      const cClose = +(baseP * (1 + drift) + noise * atrApprox * 0.4).toFixed(4);
      const cOpen = +(cClose - (Math.random() - 0.48) * atrApprox * 0.6).toFixed(4);
      const cHigh = +(Math.max(cOpen, cClose) + Math.random() * atrApprox * 0.3).toFixed(4);
      const cLow = +(Math.min(cOpen, cClose) - Math.random() * atrApprox * 0.3).toFixed(4);
      const vol = Math.floor(Math.random() * 400000 + 200000);

      candleData.push({ time: t, open: cOpen, high: cHigh, low: cLow, close: cClose });
      volData.push({
        time: t,
        value: vol,
        color: cClose >= cOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      });
    }

    candlestickSeries.setData(candleData as any);
    volumeSeries.setData(volData as any);

    // Add Price Lines for Entry, SL, TP1, TP2
    const plan = activeDossier.s13_plan;
    candlestickSeries.createPriceLine({
      price: plan.entryTranches.averageEntry,
      color: '#06b6d4',
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'AVG ENTRY'
    });

    candlestickSeries.createPriceLine({
      price: plan.stopLoss.price,
      color: '#ef4444',
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'SL (STRUCTURAL)'
    });

    candlestickSeries.createPriceLine({
      price: plan.targets.tp1.price,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'TP1 (35% + BE)'
    });

    candlestickSeries.createPriceLine({
      price: plan.targets.tp2.price,
      color: '#10b981',
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'TP2'
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

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
  }, [chartMode, activeDossier]);

  // Voice briefing
  const triggerVoiceBriefing = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const speechText =
      langMode === 'hinglish'
        ? activeDossier.s13_plan.whyHinglish
        : activeDossier.s13_plan.whyEnglish;

    setIsSpeaking(true);
    voiceService.speak(speechText, {
      langMode: langMode === 'hinglish' ? 'hinglish' : 'english',
      onEnd: () => setIsSpeaking(false)
    });
  };

  // Paper Trade execution action
  const handleExecutePaperTrade = () => {
    const p = activeDossier.s13_plan;
    const s = p.sizingTable;
    const newPos: PaperTradePosition = {
      id: `PT-${Math.floor(Math.random() * 900 + 100)}`,
      symbol: activeDossier.s1_identity.symbol,
      tier: activeDossier.meta.tier,
      horizon,
      direction: p.direction === 'SHORT' ? 'SHORT' : 'LONG',
      entryPrice: p.entryTranches.averageEntry,
      stopLoss: p.stopLoss.price,
      tp1: p.targets.tp1.price,
      tp2: p.targets.tp2.price,
      contracts: s.contractsToExecute,
      notionalUsd: s.totalNotionalUsd,
      marginUsd: s.requiredMarginUsd,
      openedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      pnlUsd: 0.0,
      status: 'OPEN'
    };

    setPaperPositions([newPos, ...paperPositions]);
    setTradeSuccessToast(`Paper Trade executed for ${newPos.symbol}: ${newPos.contracts} Contracts ($${newPos.notionalUsd} Notional)!`);
    setTimeout(() => setTradeSuccessToast(null), 4000);
  };

  const isBtcBearish = universeSummary.macroRegime === 'RISK-OFF';
  const sizing = activeDossier.s13_plan.sizingTable;
  const plan = activeDossier.s13_plan;
  const meta = activeDossier.meta;
  const memo = activeDossier.memo;
  const moneyFlow = activeDossier.s5_moneyFlow;

  return (
    <div className="space-y-6 font-sans">
      {/* ── TOP HERO HEADER & METRIC STREAM ── */}
      <div className="terminal-card-glass p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-600 to-purple-600 text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(0,242,254,0.4)] shrink-0">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-cyan-400 font-sans">
                  DEEEPR DELTA EXCHANGE ALL-COINS PRO ENGINE v2
                </h1>
                <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-black uppercase font-mono">
                  v2 PRO DOSSIER
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                SWING (1-4W) • POSITION (1-6M) • LONG-TERM HOLD (1-3Y) • COMPREHENSIVE RESEARCH & EXECUTION PLAN
              </div>
            </div>
          </div>

          {/* 3 Horizon Switcher + Telemetry Chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 3-HORIZON SWITCHER */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-cyan-500/30 p-1 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <button
                onClick={() => setHorizon('SWING_3_30D')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  horizon === 'SWING_3_30D'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>SWING (1–4W / 4H)</span>
              </button>
              <button
                onClick={() => setHorizon('POSITION_1_3M')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  horizon === 'POSITION_1_3M'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>POSITION (1–6M / 1D)</span>
              </button>
              <button
                onClick={() => setHorizon('LONG_TERM_1_3Y')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  horizon === 'LONG_TERM_1_3Y'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>HOLD (1–3Y / 1W)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/60 bg-emerald-500/15 px-3 py-1 text-xs font-mono font-bold text-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.35)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>DELTA INDIA PERPETUALS</span>
            </div>

            <button
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 600);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh {lastUpdated}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TOAST ALERT ── */}
      {tradeSuccessToast && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-3.5 text-xs text-emerald-200 font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{tradeSuccessToast}</span>
        </div>
      )}

      {/* ── COIN SELECTOR BAR & SEARCH ACROSS 231+ DELTA UNIVERSE ── */}
      <div className="terminal-card-glass p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-cyan-400" />
              SELECT ANY DELTA EXCHANGE CONTRACT:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              (Active: <strong className="text-cyan-300">{activeDossier.s1_identity.symbol}</strong> • Tier: <strong className="text-indigo-300">[{meta.tier}]</strong>)
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Delta contract (BTC, ETH, SOL, SUI, PEPE, TAO, TIA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-border bg-slate-900/90 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400 w-full sm:w-80 font-mono"
            />
          </div>
        </div>

        {/* Quick Popular Coin Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {POPULAR_COINS.map((sym) => {
            const isSelected = selectedSymbol.toUpperCase() === sym;
            const p = livePrices[sym] || DELTA_ALL_COINS_SEEDS.find((s) => s.symbol === sym)?.price;

            return (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-[0_0_14px_rgba(0,242,254,0.5)] font-black'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                }`}
              >
                <span>{sym}</span>
                {p !== undefined && (
                  <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-slate-950/30 text-slate-950' : 'text-cyan-400 font-mono'}`}>
                    ${p > 100 ? Math.round(p) : p}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SELECTED COIN SPOTLIGHT & 5-LINE INSTITUTIONAL MEMO ── */}
      <div className="terminal-hero-spotlight">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {/* Coin Tier Badge */}
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                  meta.tier === 'CORE_HOLD'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : meta.tier === 'POSITION_LONG'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : meta.tier === 'SWING_LONG'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : meta.tier === 'SWING_SHORT'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : meta.tier === 'SPECULATIVE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : meta.tier === 'AVOID'
                    ? 'bg-rose-950 text-rose-400 border-rose-600'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                TIER: {meta.tier}
              </span>

              {/* Master Verdict Badge */}
              <span
                className={`px-3 py-0.5 rounded text-xs font-black uppercase tracking-wider ${
                  meta.masterVerdict === 'LONG' || meta.masterVerdict === 'HOLD'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : meta.masterVerdict === 'SHORT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                VERDICT: {meta.masterVerdict}
              </span>

              {/* Money Flow Badge */}
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  moneyFlow.netMoneyFlowVerdict === 'INFLOW'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : moneyFlow.netMoneyFlowVerdict === 'OUTFLOW'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                FLOW: {moneyFlow.netMoneyFlowVerdict}
              </span>

              <span className="text-[10px] font-mono text-slate-400">
                Coverage: <strong className="text-cyan-300">{meta.coverageScorePct}% {meta.dataIntegrityTag}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white">
                {activeDossier.s1_identity.symbol}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400">
                ${activeDossier.s1_identity.price > 10
                  ? activeDossier.s1_identity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : activeDossier.s1_identity.price}
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Contract: <strong className="text-slate-200">{activeDossier.s1_identity.contractSymbol}</strong> | Lot:{' '}
                <strong className="text-indigo-300">{activeDossier.s1_identity.contractValue} {activeDossier.s1_identity.underlying}</strong>
              </span>
            </div>
          </div>

          {/* Quick Actions (Audio, Paper Trade, Lang) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExecutePaperTrade}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black px-3.5 py-2 text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Simulate Paper Trade</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-xs">
              {(['hinglish', 'english'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLangMode(mode)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all ${
                    langMode === mode ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={triggerVoiceBriefing}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-400" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Jarvis Audio'}</span>
            </button>
          </div>
        </div>

        {/* ── 5-LINE SIMPLE HINGLISH SUMMARY MEMO (Section 2) ── */}
        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              5-Line Executive Summary Memo ({langMode === 'hinglish' ? 'Hinglish' : 'English'}):
            </span>
            <span className="text-[10px] font-mono text-slate-400">Valid till Next Weekly Close</span>
          </div>

          <div className="space-y-1.5 text-xs sm:text-sm font-sans text-slate-200">
            {memo.fiveLineHinglishSummary.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">•</span>
                <span className="leading-relaxed">{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3-COLUMN SUMMARY BOXES: KYUN INVEST KAREIN VS RISKS VS KILL SWITCHES ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* BOX 1: KYUN INVEST KAREIN */}
          <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Kyun Invest Karein? (Top 3)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Evidence</span>
            </div>
            <div className="space-y-2 text-xs">
              {memo.top5WhyInvest.slice(0, 3).map((item, idx) => (
                <div key={idx} className="rounded bg-slate-900/90 p-2 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{idx + 1}. {item.point}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {item.strength}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Source: {item.source} ({item.asOf})</div>
                </div>
              ))}
            </div>
          </div>

          {/* BOX 2: KYUN NAHI / RISKS */}
          <div className="rounded-xl border border-rose-500/30 bg-slate-950/80 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Kyun Nahi / Risks? (Top 3)
              </span>
              <span className="text-[10px] text-rose-400 font-mono">Critical</span>
            </div>
            <div className="space-y-2 text-xs">
              {memo.top5WhyNot.slice(0, 3).map((item, idx) => (
                <div key={idx} className="rounded bg-slate-900/90 p-2 border border-slate-800 space-y-1">
                  <div className="font-bold text-rose-200 flex items-center justify-between">
                    <span>{idx + 1}. {item.risk}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                      {item.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Trigger: {item.killSwitchTrigger}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BOX 3: KILL-SWITCHES LIVE MONITOR */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-950/80 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                Kill-Switches Live Status
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">Auto-Veto</span>
            </div>
            <div className="space-y-2 text-xs">
              {memo.killSwitches.slice(0, 3).map((ks) => (
                <div key={ks.id} className="rounded bg-slate-900/90 p-2 border border-slate-800 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{ks.id}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-black font-mono ${
                        ks.status === 'SAFE_GREEN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : ks.status === 'WATCH_AMBER'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {ks.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">{ks.condition}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── "ITNA PAISA LAGAO" MANDATORY CAPITAL SIZING CARD (Section 7) ── */}
      <div className="terminal-card-glass p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-cyan-400" />
              "ITNA PAISA LAGAO" — DELTA INSTITUTIONAL SIZING & CONTRACTS TABLE
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Strict mathematical risk allocation based on Delta Exchange lot multipliers, isolated margin & liquidation buffers.
            </p>
          </div>

          {/* Capital & Risk Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Account Capital:</span>
              <span className="text-xs text-cyan-400 font-bold">$</span>
              <input
                type="number"
                value={accountCapital}
                onChange={(e) => setAccountCapital(Math.max(100, Number(e.target.value)))}
                className="w-24 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 font-mono">(₹{sizing.capitalInr.toLocaleString()})</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Risk %:</span>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="3.0"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Math.max(0.25, Number(e.target.value)))}
                className="w-14 bg-transparent text-xs font-mono font-bold text-cyan-400 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* 6 Grid Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Risk Budget</div>
            <div className="text-sm font-mono font-black text-rose-400 mt-1">
              ${sizing.riskBudgetUsd} (₹{sizing.riskBudgetInr.toLocaleString()})
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">{sizing.riskPct}% of Account</div>
          </div>

          <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/40 p-2.5">
            <div className="text-[10px] text-cyan-300 uppercase font-bold">Delta Contracts to Buy</div>
            <div className="text-base font-mono font-black text-cyan-200 mt-1">
              {sizing.contractsToExecute} Contracts
            </div>
            <div className="text-[9px] text-cyan-400 mt-0.5">Lot: {activeDossier.s1_identity.contractValue} {activeDossier.s1_identity.underlying}</div>
          </div>

          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Notional Value</div>
            <div className="text-sm font-mono font-black text-white mt-1">
              ${sizing.totalNotionalUsd.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">{sizing.quantityCoinUnits} {activeDossier.s1_identity.symbol} Exposure</div>
          </div>

          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Required Margin (Isolated)</div>
            <div className="text-sm font-mono font-black text-indigo-300 mt-1">
              ${sizing.requiredMarginUsd} (₹{sizing.requiredMarginInr.toLocaleString()})
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Leverage: {sizing.leverageCap}x</div>
          </div>

          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Est. Liquidation Price</div>
            <div className="text-sm font-mono font-black text-amber-400 mt-1">
              ${sizing.estLiquidationPrice.toLocaleString()}
            </div>
            <div className={`text-[9px] font-bold mt-0.5 ${sizing.isLiquidationSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
              Liq/SL Buffer: {sizing.liqDistanceToStopRatio}x (Min 2.0x)
            </div>
          </div>

          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Perp vs Spot Carry Cost</div>
            <div className="text-xs font-mono font-bold text-slate-200 mt-1">
              Perp Funding: ~${sizing.estFundingCostUsd}
            </div>
            <div className={`text-[9px] font-bold mt-0.5 ${sizing.perpVsSpotRecommendation === 'PREFER_SPOT' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {sizing.perpVsSpotRecommendation === 'PREFER_SPOT' ? 'Recommend Spot Hold' : 'Recommend Perp Hold'}
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE DUAL CHART VIEW ── */}
      <div className="terminal-card-glass p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              INSTITUTIONAL CHART & EXECUTION LEVELS ({activeDossier.s1_identity.contractSymbol})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartMode('CANVAS')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'CANVAS'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              Lightweight Engine
            </button>
            <button
              onClick={() => setChartMode('TRADINGVIEW')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'TRADINGVIEW'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              TradingView Live
            </button>
          </div>
        </div>

        {chartMode === 'CANVAS' ? (
          <div ref={chartContainerRef} className="w-full h-[380px] rounded-lg overflow-hidden" />
        ) : (
          <div className="h-[420px] w-full rounded-lg overflow-hidden border border-border">
            <TradingViewWidget symbol={`BINANCE:${activeDossier.s1_identity.symbol}USDT`} />
          </div>
        )}
      </div>

      {/* ── 14 COMPREHENSIVE DOSSIER TABS (v2 PRO UPGRADE) ── */}
      <div className="terminal-card-glass p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              DEEP RESEARCH & INSTITUTIONAL PLAN DOSSIER ({activeDossier.s1_identity.symbol})
            </h2>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Integrity Tag: <strong className="text-emerald-400">{meta.dataIntegrityTag} {meta.coverageScorePct}% Coverage</strong>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
          {[
            { id: 'MEMO', label: '1-Page Memo' },
            { id: 'MONEY_FLOW', label: '🌊 Money Flow' },
            { id: 'ENTRY_PLAN', label: '🎯 Entry & SL Plan' },
            { id: 'SIZING_TABLE', label: '💰 Capital "Itna Lagao"' },
            { id: 'VALUATION', label: '📊 Valuation & Category' },
            { id: 'TOKENOMICS', label: '🔓 Tokenomics & Unlocks' },
            { id: 'BACKERS', label: '👥 Who\'s Behind' },
            { id: 'TECHNICALS', label: '📈 MTF Technicals' },
            { id: 'DERIVATIVES', label: '⚡ Derivatives & Liq' },
            { id: 'MACRO_REGIME', label: '🌐 Macro Regime' },
            { id: 'CATALYSTS', label: '📅 Catalysts' },
            { id: 'PROFIT_BOOKING_TAX', label: '💸 Profit & India Tax' },
            { id: 'PORTFOLIO_HEAT', label: '💼 Portfolio Heat' },
            { id: 'SOURCES_GROUNDING', label: '🛡️ Sources & Grounding' },
            { id: 'PAPER_TRADE', label: '📝 Paper Trade Journal' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDossierTab(tab.id as DossierSectionTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dossierTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {/* TAB 1: 1-PAGE MEMO */}
          {dossierTab === 'MEMO' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-2">
                <div className="text-xs font-bold uppercase text-cyan-300">Core Investment Thesis</div>
                <p className="text-sm text-slate-100 font-serif leading-relaxed">"{memo.thesisLine}"</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Review Horizon: <strong className="text-cyan-300">{memo.reviewDate}</strong> • Kill Trigger: <strong className="text-rose-300">{memo.whatWouldChangeMind}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase text-emerald-400">Top 5 Reasons to Invest</h3>
                  <div className="space-y-2 text-xs">
                    {memo.top5WhyInvest.map((item, idx) => (
                      <div key={idx} className="rounded bg-slate-900/90 p-2.5 border border-slate-800">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{idx + 1}. {item.point}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                            {item.strength}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">Source: {item.source} ({item.asOf})</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-slate-900/60 p-4 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase text-rose-400">Top 5 Risks & Kill-Switches</h3>
                  <div className="space-y-2 text-xs">
                    {memo.top5WhyNot.map((item, idx) => (
                      <div key={idx} className="rounded bg-slate-900/90 p-2.5 border border-slate-800">
                        <div className="font-bold text-rose-200 flex items-center justify-between">
                          <span>{idx + 1}. {item.risk}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                            {item.severity}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Kill-Switch: {item.killSwitchTrigger}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONEY FLOW ENGINE */}
          {dossierTab === 'MONEY_FLOW' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-cyan-300">Net Money Flow Status:</span>
                  <span className={`text-xs px-2.5 py-1 rounded font-black font-mono ${
                    moneyFlow.netMoneyFlowVerdict === 'INFLOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {moneyFlow.netMoneyFlowVerdict} ({moneyFlow.signalsSummary})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {moneyFlow.moneyFlowHinglish}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Exchange 24h Netflow</div>
                  <div className="font-mono font-bold text-cyan-300 mt-1">{moneyFlow.exchangeNetflow24hUsd}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Outflow = Accumulation</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Stablecoin On-Chain 7d</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1">{moneyFlow.stablecoinSupplyChange7d}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Liquidity Dry Powder</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Spot ETF Flow (7D)</div>
                  <div className="font-mono font-bold text-white mt-1">{moneyFlow.spotEtfFlow7dUsd}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Institutional Absorption</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Whale Wallet 7D Trend</div>
                  <div className="font-mono font-bold text-indigo-300 mt-1">{moneyFlow.whaleWallet7dChange}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Top 100 Non-Exchange [EST]</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">OI x Price Quadrant</div>
                  <div className="font-mono font-bold text-cyan-300 mt-1">{moneyFlow.oiPriceQuadrant}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Spot vs Perp CVD</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1">{moneyFlow.spotVsPerpCvd}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Long / Short Ratio</div>
                  <div className="font-mono font-bold text-indigo-300 mt-1">{moneyFlow.longShortRatio}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENTRY & SL PLAN */}
          {dossierTab === 'ENTRY_PLAN' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase text-cyan-300">1. Entry Tranches Ladder</div>
                  <div className="text-lg font-black font-mono text-cyan-100">
                    Avg Entry: ${plan.entryTranches.averageEntry}
                  </div>
                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                      <strong>E1 (40%):</strong> ${plan.entryTranches.e1.price} — {plan.entryTranches.e1.label}
                    </div>
                    <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                      <strong>E2 (30%):</strong> ${plan.entryTranches.e2.price} — {plan.entryTranches.e2.label}
                    </div>
                    <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                      <strong>E3 (30%):</strong> ${plan.entryTranches.e3.price} — {plan.entryTranches.e3.label}
                    </div>
                  </div>
                  <div className="text-[10px] text-cyan-400">{plan.entryTranches.avoidChasingRule}</div>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-slate-900/60 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase text-rose-300">2. Structural Stop-Loss</div>
                  <div className="text-lg font-black font-mono text-rose-400">
                    SL: ${plan.stopLoss.price}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{plan.stopLoss.basis}</p>
                  <div className="text-[10px] text-rose-300 font-mono mt-1">
                    Thesis Invalidation: {plan.stopLoss.thesisInvalidationRule}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase text-emerald-300">3. Target Ladder & Net RR</div>
                  <div className="text-lg font-black font-mono text-emerald-400">
                    Net RR to TP2: 1:{plan.targets.netRRToTp2} (Final: 1:{plan.targets.finalRR})
                  </div>
                  <div className="space-y-1 text-xs font-mono text-slate-300">
                    <div>TP1: ${plan.targets.tp1.price} (35% + Breakeven Move)</div>
                    <div>TP2: ${plan.targets.tp2.price} (35% Scale-out)</div>
                    <div>TP3: ${plan.targets.tp3.price} (20% Target)</div>
                    <div>Runner (10%): {plan.targets.tp4Runner.trailRule}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAPITAL SIZING */}
          {dossierTab === 'SIZING_TABLE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Delta Contract Value</div>
                  <div className="font-mono font-bold text-cyan-300 mt-1">{activeDossier.s1_identity.contractValue} {activeDossier.s1_identity.underlying}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Free Margin Buffer</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1">${sizing.freeMarginBufferUsd}</div>
                  <div className="text-[10px] text-slate-500">50% cushion recommended</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Expected Profit at TP2</div>
                  <div className="font-mono font-bold text-white mt-1">+${sizing.expectedProfitAtTp2}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Portfolio Weight Cap</div>
                  <div className="font-mono font-bold text-indigo-300 mt-1">{sizing.portfolioWeightPct}% of Sleeve</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase text-cyan-300">Carry Cost & Perpetual vs Spot Hold Analysis</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{sizing.carryVerdict}</p>
              </div>
            </div>
          )}

          {/* TAB 5: VALUATION & FUNDAMENTALS */}
          {dossierTab === 'VALUATION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-900 p-3.5 border border-slate-800">
                  <div className="text-[10px] text-rose-400 font-bold uppercase">Bear Fair Value</div>
                  <div className="text-xl font-black font-mono text-rose-300 mt-1">${activeDossier.s3_valuation.fairValueRange.bear.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">-40% crypto macro compression</div>
                </div>
                <div className="rounded-xl bg-cyan-950/40 p-3.5 border border-cyan-500/40">
                  <div className="text-[10px] text-cyan-300 font-bold uppercase">Base Fair Value Target</div>
                  <div className="text-xl font-black font-mono text-cyan-100 mt-1">${activeDossier.s3_valuation.fairValueRange.base.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Margin of Safety: +{activeDossier.s3_valuation.fairValueRange.marginOfSafetyPct}%</div>
                </div>
                <div className="rounded-xl bg-slate-900 p-3.5 border border-slate-800">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">Bull Fair Value Target</div>
                  <div className="text-xl font-black font-mono text-emerald-300 mt-1">${activeDossier.s3_valuation.fairValueRange.bull.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Alt-season & ETF liquidity surge</div>
                </div>
              </div>

              {/* Category Specific Metrics Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-300">
                  Category Metrics: {activeDossier.s3_valuation.category}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  {Object.entries(activeDossier.s3_valuation.categoryMetrics).map(([key, val]) => (
                    <div key={key} className="rounded bg-slate-900 p-2.5 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">{key}</div>
                      <div className="font-bold text-cyan-300 mt-0.5">{String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TOKENOMICS & UNLOCKS */}
          {dossierTab === 'TOKENOMICS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Circulating Supply %</div>
                  <div className="font-mono font-bold text-cyan-300 mt-1">{activeDossier.s3_valuation.circulatingPct}%</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Market Cap vs FDV</div>
                  <div className="font-mono font-bold text-white mt-1">{activeDossier.s3_valuation.mcapUsd} / {activeDossier.s3_valuation.fdvUsd}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Next 90D Unlock Risk</div>
                  <div className={`font-mono font-bold mt-1 ${activeDossier.s3_valuation.next90dUnlockPct > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {activeDossier.s3_valuation.next90dUnlockPct}% of Circulating
                  </div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Annual Emissions</div>
                  <div className="font-mono font-bold text-amber-300 mt-1">{activeDossier.s3_valuation.annualEmissionsPct}%/year</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-300">Dilution & Supply Risk Rating:</div>
                <p className="text-xs text-slate-300 font-sans">{activeDossier.s3_valuation.dilutionWarning}</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Schedule: {activeDossier.s3_valuation.unlockDateSummary}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BACKERS */}
          {dossierTab === 'BACKERS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-slate-900 p-3 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Foundation & Lead Backers</div>
                <div className="font-bold text-white">{activeDossier.s4_backers.foundation}</div>
                <div className="text-slate-300 font-mono">{(activeDossier.s4_backers.leadVcs || []).join(', ')}</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-3 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Institutional ETF / Treasury Holdings</div>
                <div className="font-bold text-cyan-300">{activeDossier.s4_backers.institutionalEtfHolding}</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-3 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Whale Wallet Flow</div>
                <div className="font-bold text-indigo-300">{activeDossier.s4_backers.whaleWalletFlow}</div>
              </div>
            </div>
          )}

          {/* TAB 8: TECHNICALS */}
          {dossierTab === 'TECHNICALS' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                <div className="text-slate-400">1W Trend:</div>
                <div className="font-bold text-white mt-0.5">{activeDossier.s6_technicals.trend1W}</div>
              </div>
              <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                <div className="text-slate-400">1D Structure:</div>
                <div className="font-bold text-white mt-0.5">{activeDossier.s6_technicals.trend1D} ({activeDossier.s6_technicals.lastBos1D})</div>
              </div>
              <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                <div className="text-slate-400">4H Structure:</div>
                <div className="font-bold text-cyan-300 mt-0.5">{activeDossier.s6_technicals.trend4H} ({activeDossier.s6_technicals.lastChoch4H})</div>
              </div>
              <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                <div className="text-slate-400">RS vs BTC:</div>
                <div className="font-bold text-emerald-400 mt-0.5">{activeDossier.s6_technicals.relativeStrengthVsBtc}</div>
              </div>
            </div>
          )}

          {/* TAB 9: DERIVATIVES */}
          {dossierTab === 'DERIVATIVES' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">OI x Price Quadrant</div>
                  <div className="font-bold text-cyan-300 mt-1">{activeDossier.s9_derivativesLiquidation.oiPriceQuadrant}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Nearest Short Liq Magnet</div>
                  <div className="font-bold text-emerald-400 mt-1">${activeDossier.s9_derivativesLiquidation.nearestShortLiqMagnet.toLocaleString()}</div>
                </div>
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="text-slate-400">Nearest Long Liq Magnet</div>
                  <div className="font-bold text-rose-400 mt-1">${activeDossier.s9_derivativesLiquidation.nearestLongLiqMagnet.toLocaleString()}</div>
                </div>
              </div>

              {activeDossier.s9_derivativesLiquidation.estimatedLiquidationClusters.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold uppercase text-slate-300 mb-2">Estimated Liquidation Clusters (Delta + Venues):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeDossier.s9_derivativesLiquidation.estimatedLiquidationClusters.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center rounded bg-slate-900 p-2 border border-slate-800">
                        <span className={`font-mono font-bold ${c.side === 'LONG_LIQ' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${c.price.toLocaleString()} ({c.side})
                        </span>
                        <span className="font-mono text-slate-300">{c.estimatedVolumeUsd}</span>
                        <span className="text-[10px] text-cyan-400 font-bold">{c.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: MACRO REGIME */}
          {dossierTab === 'MACRO_REGIME' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">BTC Trend Alignment</div>
                <div className="font-bold text-emerald-400 mt-1">{activeDossier.s10_macroRegime.btcTrend1W}</div>
              </div>
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">USDT.D Cash Flow Role</div>
                <div className="font-bold text-cyan-300 mt-1">{activeDossier.s10_macroRegime.usdtDominanceTrend}</div>
              </div>
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">Alt-Season Gate Status</div>
                <div className="font-bold text-white mt-1">PASSED (High-Beta Alts Permitted)</div>
              </div>
            </div>
          )}

          {/* TAB 11: CATALYSTS */}
          {dossierTab === 'CATALYSTS' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <h4 className="text-xs font-bold uppercase text-slate-300 mb-2">Upcoming Dated Catalysts:</h4>
                <div className="space-y-2 text-xs">
                  {activeDossier.s11_catalysts.newsItems.map((n, idx) => (
                    <div key={idx} className="rounded bg-slate-900 p-2.5 border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{n.headline}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                          {n.impactTag}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Source: {n.source} • {n.publishedIst}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: PROFIT-BOOKING & INDIA TAX PLAN */}
          {dossierTab === 'PROFIT_BOOKING_TAX' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-emerald-400">Scale-Out & Breakeven Schedule</h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-white">TP1:</strong> Take 35% partial profit, lock initial risk, move SL to Breakeven after closed candle.</li>
                    <li><strong className="text-white">TP2:</strong> Take 35% profit (net RR verified at 1:{plan.targets.netRRToTp2}).</li>
                    <li><strong className="text-white">TP3:</strong> Take 20% target profit at structural cycle ceiling.</li>
                    <li><strong className="text-white">Runner (10%):</strong> Trail with 20 EMA until momentum invalidation.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-amber-400">India VDA Tax & Withdrawal Plan</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {plan.profitBookingTaxPlan.indiaTaxReserveReminder}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono">
                    Rebalancing Rule: {plan.profitBookingTaxPlan.rebalancingCapTrim}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: PORTFOLIO HEAT */}
          {dossierTab === 'PORTFOLIO_HEAT' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">Max Position Cap</div>
                <div className="font-mono font-bold text-cyan-300 mt-1">{plan.portfolioHeat.maxPortfolioWeightPct}% of Sleeve</div>
              </div>
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">This Trade Allocation</div>
                <div className="font-mono font-bold text-white mt-1">{sizing.portfolioWeightPct}% of Sleeve</div>
              </div>
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">Cash Reserve Target</div>
                <div className="font-mono font-bold text-emerald-400 mt-1">Min 20% for Dips</div>
              </div>
              <div className="rounded bg-slate-900 p-3 border border-slate-800">
                <div className="text-slate-400">Historical VaR (95%)</div>
                <div className="font-mono font-bold text-amber-400 mt-1">{plan.portfolioHeat.var95EstimatePct}% / 1W</div>
              </div>
            </div>
          )}

          {/* TAB 14: SOURCES & DATA GROUNDING */}
          {dossierTab === 'SOURCES_GROUNDING' && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase text-cyan-300">Data Sources & Grounding Proofs</h4>
                <div className="space-y-1.5 font-mono text-slate-300">
                  <div>• [REAL] Delta Exchange India Order Books & Perpetual Specs: <span className="text-cyan-300">docs.delta.exchange</span></div>
                  <div>• [REAL] Tokenomics, Circulating Float & FDV: <span className="text-cyan-300">CoinGecko / DefiLlama</span></div>
                  <div>• [REPORTED] Institutional ETF Holdings: <span className="text-cyan-300">SEC 13F Filings / Bitwise / BlackRock IBIT</span></div>
                  <div>• [ESTIMATED] Whale Wallet Shift & Liquidation Clusters: <span className="text-cyan-300">Glassnode / Arkham / Delta Depth</span></div>
                  <div>• [OPINION] Market Narrative & Sentiment: <span className="text-cyan-300">Institutional Strategy Desk</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: PAPER TRADE JOURNAL */}
          {dossierTab === 'PAPER_TRADE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-cyan-300">Active Paper Trading Simulated Positions:</h4>
                <button
                  onClick={() => setPaperPositions([])}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Positions</span>
                </button>
              </div>

              {paperPositions.length === 0 ? (
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-6 text-center text-xs text-slate-400">
                  Zero open paper positions. Click "Simulate Paper Trade" above to execute this coin with strict plan math.
                </div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {paperPositions.map((pos) => (
                    <div key={pos.id} className="rounded-lg bg-slate-900 p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{pos.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pos.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {pos.direction}
                          </span>
                          <span className="text-slate-400 text-[10px]">Tier: [{pos.tier}] • {pos.openedAt}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          Entry: ${pos.entryPrice} | SL: ${pos.stopLoss} | TP1: ${pos.tp1} | TP2: ${pos.tp2}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-cyan-300">{pos.contracts} Lots</div>
                          <div className="text-[10px] text-slate-400">Margin: ${pos.marginUsd}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                          {pos.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 231+ DELTA CONTRACTS UNIVERSE SCANNER TABLE ── */}
      <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Table Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b border-border gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: `All Delta Coins (${universeSummary.allDossiers.length})` },
              { id: 'CORE_HOLDS', label: `Core Holds (${universeSummary.shortlistCoreHolds.length})` },
              { id: 'SWING_LONGS', label: `Swing Longs (${universeSummary.shortlistSwingLongs.length})` },
              { id: 'SWING_SHORTS', label: `Swing Shorts (${universeSummary.shortlistSwingShorts.length})` },
              { id: 'POS_LONGS', label: `Position Longs (${universeSummary.shortlistPositionLongs.length})` },
              { id: 'POS_SHORTS', label: `Position Shorts (${universeSummary.shortlistPositionShorts.length})` },
              { id: 'SQUEEZE_FUEL', label: `Squeeze Fuel (${universeSummary.squeezeCandidates.length})` },
              { id: 'FLUSH_RISK', label: `Flush Risk (${universeSummary.flushCandidates.length})` },
              { id: 'AVOID_RISK', label: 'Avoid List' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as FilterTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-primary text-primary-foreground font-black'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing <strong className="text-cyan-400">{filteredDossiers.length}</strong> candidates for{' '}
            <strong className="text-white">
              {horizon === 'SWING_3_30D' ? 'SWING (1-4W)' : horizon === 'POSITION_1_3M' ? 'POSITION (1-6M)' : 'LONG-TERM HOLD (1-3Y)'}
            </strong>
          </div>
        </div>

        {/* Table of Coins */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-3">Coin / Contract</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Mark Price</th>
                <th className="py-3 px-3">Money Flow</th>
                <th className="py-3 px-3">Structure</th>
                <th className="py-3 px-3">Avg Entry & SL</th>
                <th className="py-3 px-3">Delta Contracts</th>
                <th className="py-3 px-3 text-center">SQ Score</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDossiers.map((dossier, index) => {
                const sym = dossier.s1_identity.symbol;
                const isSelected = selectedSymbol === sym;
                const dPlan = dossier.s13_plan;
                const dSizing = dPlan.sizingTable;
                const dMeta = dossier.meta;
                const dFlow = dossier.s5_moneyFlow;

                return (
                  <tr
                    key={sym}
                    onClick={() => {
                      setSelectedSymbol(sym);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className={`transition-colors cursor-pointer group ${
                      isSelected ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <div className={`font-bold transition-colors ${isSelected ? 'text-cyan-300' : 'text-foreground group-hover:text-primary'}`}>
                            {sym}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{dossier.s1_identity.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {dMeta.tier}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-foreground">
                      ${dossier.s1_identity.price > 10
                        ? dossier.s1_identity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : dossier.s1_identity.price}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dFlow.netMoneyFlowVerdict === 'INFLOW'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : dFlow.netMoneyFlowVerdict === 'OUTFLOW'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {dFlow.netMoneyFlowVerdict}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          dossier.s6_technicals.trend4H === 'BULLISH'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        4H {dossier.s6_technicals.trend4H}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      <div className="text-cyan-300 font-bold">${dPlan.entryTranches.averageEntry.toLocaleString()}</div>
                      <div className="text-[10px] text-rose-400">SL: ${dPlan.stopLoss.price.toLocaleString()}</div>
                    </td>

                    <td className="py-3 px-3 text-muted-foreground font-mono">
                      <span className="text-indigo-400 font-bold">{dSizing.contractsToExecute} Lots</span>
                      <div className="text-[10px] text-slate-400">Margin: ${dSizing.requiredMarginUsd}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-black text-sm">
                        <span className={dPlan.scoreTotal >= 75 ? 'text-emerald-400' : dPlan.scoreTotal >= 60 ? 'text-primary' : 'text-muted-foreground'}>
                          {dPlan.scoreTotal}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-extrabold ${
                          dMeta.masterVerdict === 'LONG' || dMeta.masterVerdict === 'HOLD'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : dMeta.masterVerdict === 'SHORT'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {dMeta.masterVerdict}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSymbol(sym);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className={`rounded px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30'
                        }`}
                      >
                        {isSelected ? 'Active Dossier' : 'Load Dossier'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
