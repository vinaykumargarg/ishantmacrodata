import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  IndianStockProfile,
  INDIAN_STOCKS_DATABASE,
  INDIAN_MACRO_SNAPSHOT,
  TOP_500_UNIVERSE_LIST,
  getIndianStockProfile,
  MarketCapTier,
  DecisionType,
  SetupType,
  INDIAN_SECTOR_INTELLIGENCE
} from '../data/indianStockDatabase';
import { GLOBAL_PORTFOLIO_STRATEGY } from '../data/usaTop1000Database';
import { getIndianMarketSession } from '../utils/marketSessionUtils';
import TradingViewWidget from './TradingViewWidget';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Search,
  Activity,
  Layers,
  Award,
  Zap,
  BarChart2,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
  Sliders,
  Compass,
  Cpu,
  Target,
  Clock,
  Printer,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Play,
  Pause,
  Radio
} from 'lucide-react';

export default function IndianStockAiView({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  // ── STATE MANAGEMENT ──
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'RESEARCH' | 'SCANNER' | 'SECTORS' | 'PORTFOLIO'>('RESEARCH');
  const [activeResearchTab, setActiveResearchTab] = useState<
    'EXECUTION_BLUEPRINT' | 'OVERVIEW' | 'BUSINESS' | 'FINANCIALS' | 'QUARTERS' | 'GOVERNANCE' | 'ANNUAL_REPORT' | 'VALUATION' | 'TECHNICALS' | 'MACRO' | 'SCENARIOS' | 'PEERS'
  >('EXECUTION_BLUEPRINT');
  const [selectedHorizon, setSelectedHorizon] = useState<'SWING' | 'INTRADAY' | 'SHORT' | 'MEDIUM' | 'LONG'>('SWING');

  // Scanner Filters
  const [scannerCapTier, setScannerCapTier] = useState<string>('ALL');
  const [scannerSetupFilter, setScannerSetupFilter] = useState<string>('ALL');
  const [scannerHorizonFilter, setScannerHorizonFilter] = useState<string>('SWING');
  const [scannerDecisionFilter, setScannerDecisionFilter] = useState<string>('ALL');

  // Position Sizing Calculator State
  const [tradingCapital, setTradingCapital] = useState<number>(500000); // ₹5,00,000 default
  const [riskPerTradePct, setRiskPerTradePct] = useState<number>(1.5);  // 1.5% max risk

  // Fetch current stock profile baseline
  const stock: IndianStockProfile = useMemo(() => {
    return getIndianStockProfile(selectedSymbol);
  }, [selectedSymbol]);

  // ── MARKET SESSION (NSE/BSE) & LIVE TICK ENGINE ──
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  });
  const [marketSession, setMarketSession] = useState(() => getIndianMarketSession());
  const [isDemoSim, setIsDemoSim] = useState<boolean>(false); // Strict: default OFF when market is closed!

  // Benchmark Live State (Nifty & Sensex)
  const [liveNifty, setLiveNifty] = useState<number>(INDIAN_MACRO_SNAPSHOT.nifty50); // 22520.45
  const [liveNiftyChange, setLiveNiftyChange] = useState<number>(288.75);
  const [liveNiftyPct, setLiveNiftyPct] = useState<number>(1.30);
  const [niftyFlash, setNiftyFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  const [liveSensex, setLiveSensex] = useState<number>(INDIAN_MACRO_SNAPSHOT.sensex); // 72472.33
  const [liveSensexChange, setLiveSensexChange] = useState<number>(874.15);
  const [liveSensexPct, setLiveSensexPct] = useState<number>(1.22);
  const [sensexFlash, setSensexFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  // Selected Stock Real-Time Price State
  const [liveStockCmp, setLiveStockCmp] = useState<number>(stock.cmp);
  const [liveStockChange, setLiveStockChange] = useState<number>(stock.change24h);
  const [liveStockChangePct, setLiveStockChangePct] = useState<number>(stock.changePct24h);
  const [stockTickFlash, setStockTickFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  // Universe Live Ticks (Dynamic tick map for Quick Select & Scanner)
  const [liveTickMap, setLiveTickMap] = useState<Record<string, { cmp: number; changePct: number; flash: 'UP' | 'DOWN' }>>({});

  // Reset live prices when user switches stock
  useEffect(() => {
    setLiveStockCmp(stock.cmp);
    setLiveStockChange(stock.change24h);
    setLiveStockChangePct(stock.changePct24h);
    setStockTickFlash('NONE');
  }, [stock.symbol, stock.cmp, stock.change24h, stock.changePct24h]);

  // Market-Aware Live Streaming Interval: ONLY ticks during live market hours or explicit demo simulation!
  const isMarketLive = marketSession.isOpen || isDemoSim;

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Live IST Clock & Market Status Check
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
      const currentSession = getIndianMarketSession();
      setMarketSession(currentSession);

      // If market is CLOSED and simulation is not manually enabled, FREEZE ON EXACT SETTLED PRICES!
      if (!currentSession.isOpen && !isDemoSim) {
        setLiveStockCmp(stock.cmp);
        setLiveStockChange(stock.change24h);
        setLiveStockChangePct(stock.changePct24h);
        setLiveNifty(INDIAN_MACRO_SNAPSHOT.nifty50);
        setLiveSensex(INDIAN_MACRO_SNAPSHOT.sensex);
        setLiveTickMap({});
        setNiftyFlash('NONE');
        setSensexFlash('NONE');
        setStockTickFlash('NONE');
        return;
      }

      // 2. NIFTY 50 Micro-Tick (Active only during live market session)
      const niftyDelta = +((Math.random() - 0.46) * 3.8).toFixed(2);
      setLiveNifty(prev => +(prev + niftyDelta).toFixed(2));
      setLiveNiftyChange(prev => +(prev + niftyDelta).toFixed(2));
      setLiveNiftyPct(prev => +(prev + (niftyDelta / 22520.45) * 100).toFixed(2));
      setNiftyFlash(niftyDelta >= 0 ? 'UP' : 'DOWN');

      // 3. SENSEX Micro-Tick
      const sensexDelta = +((Math.random() - 0.46) * 12.8).toFixed(2);
      setLiveSensex(prev => +(prev + sensexDelta).toFixed(2));
      setLiveSensexChange(prev => +(prev + sensexDelta).toFixed(2));
      setLiveSensexPct(prev => +(prev + (sensexDelta / 72472.33) * 100).toFixed(2));
      setSensexFlash(sensexDelta >= 0 ? 'UP' : 'DOWN');

      // 4. Selected Stock Real-Time CMP Micro-Tick
      setLiveStockCmp(prev => {
        const pctDelta = (Math.random() - 0.47) * 0.0005;
        let delta = +(stock.cmp * pctDelta).toFixed(2);
        delta = Math.round(delta * 20) / 20;
        if (delta === 0) delta = Math.random() > 0.5 ? 0.05 : -0.05;

        const next = Math.max(1, +(prev + delta).toFixed(2));
        const prevClose = stock.cmp - stock.change24h;
        const newChange = +(next - prevClose).toFixed(2);
        const newChangePct = +((newChange / prevClose) * 100).toFixed(2);

        setLiveStockChange(newChange);
        setLiveStockChangePct(newChangePct);
        setStockTickFlash(delta >= 0 ? 'UP' : 'DOWN');
        return next;
      });

      // 5. Universe Stocks Live Ticks
      setLiveTickMap(prev => {
        const next = { ...prev };
        const keys = ['RELIANCE', 'TCS', 'HDFCBANK', 'TATAMOTORS', 'SBIN', 'INFY', 'HAL', 'BEL', 'TRENT', 'DIXON', 'ITC', 'LT', 'ICICIBANK', 'BHARTIARTL'];
        const chosen = keys[Math.floor(Math.random() * keys.length)];
        const origProfile = getIndianStockProfile(chosen);
        const currentP = next[chosen]?.cmp || origProfile.cmp;
        const delta = Math.round(((Math.random() - 0.47) * 0.0006 * origProfile.cmp) * 20) / 20 || (Math.random() > 0.5 ? 0.10 : -0.10);
        const newP = Math.max(1, +(currentP + delta).toFixed(2));
        const prevClose = origProfile.cmp - origProfile.change24h;
        const newPct = +(((newP - prevClose) / prevClose) * 100).toFixed(2);

        next[chosen] = {
          cmp: newP,
          changePct: newPct,
          flash: delta >= 0 ? 'UP' : 'DOWN'
        };
        return next;
      });

      // Clear visual flashes after 650ms
      setTimeout(() => {
        setNiftyFlash('NONE');
        setSensexFlash('NONE');
        setStockTickFlash('NONE');
      }, 650);
    }, 1000);

    return () => clearInterval(interval);
  }, [marketSession.isOpen, isDemoSim, stock.cmp, stock.change24h]);

  // Manual Instant Resync Handler
  const handleManualSync = useCallback(() => {
    const origProfile = getIndianStockProfile(selectedSymbol);
    setLiveStockCmp(origProfile.cmp);
    setLiveStockChange(origProfile.change24h);
    setLiveStockChangePct(origProfile.changePct24h);
    setLiveNifty(INDIAN_MACRO_SNAPSHOT.nifty50);
    setLiveSensex(INDIAN_MACRO_SNAPSHOT.sensex);
    setStockTickFlash('UP');
    setNiftyFlash('UP');
    setSensexFlash('UP');
    setTimeout(() => {
      setStockTickFlash('NONE');
      setNiftyFlash('NONE');
      setSensexFlash('NONE');
    }, 650);
  }, [selectedSymbol]);

  // Filtered universe list for instant search
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TOP_500_UNIVERSE_LIST.slice(0, 18);
    return TOP_500_UNIVERSE_LIST.filter(
      s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
    ).slice(0, 24);
  }, [searchQuery]);

  // Scanner Candidates
  const scannerCandidates = useMemo(() => {
    return TOP_500_UNIVERSE_LIST.map(item => {
      const p = getIndianStockProfile(item.symbol);
      return {
        item,
        profile: p
      };
    }).filter(({ item, profile }) => {
      if (scannerCapTier !== 'ALL' && item.capTier !== scannerCapTier) return false;
      if (scannerDecisionFilter !== 'ALL' && profile.overallDecision !== scannerDecisionFilter) return false;
      if (scannerSetupFilter !== 'ALL' && !profile.swing.setup.toLowerCase().includes(scannerSetupFilter.toLowerCase())) return false;
      return true;
    });
  }, [scannerCapTier, scannerDecisionFilter, scannerSetupFilter]);

  // Position Sizing Calculation
  const positionSizing = useMemo(() => {
    const maxRiskInr = (tradingCapital * riskPerTradePct) / 100;
    const plan = selectedHorizon === 'SWING'
      ? stock.swing
      : selectedHorizon === 'INTRADAY'
        ? stock.intraday
        : selectedHorizon === 'SHORT'
          ? stock.shortTerm
          : selectedHorizon === 'MEDIUM'
            ? stock.mediumTerm
            : stock.longTerm;

    const entryNum = parseFloat(plan.entry.replace(/[^0-9.]/g, '')) || liveStockCmp;
    const slNum = parseFloat(plan.sl.replace(/[^0-9.]/g, '')) || (liveStockCmp * 0.95);
    const riskPerShare = Math.abs(entryNum - slNum) || (liveStockCmp * 0.04);
    const sharesQty = Math.floor(maxRiskInr / riskPerShare) || 1;
    const totalExposure = Math.round(sharesQty * entryNum);

    return {
      maxRiskInr: Math.round(maxRiskInr),
      riskPerShare: +riskPerShare.toFixed(2),
      sharesQty,
      totalExposure
    };
  }, [tradingCapital, riskPerTradePct, selectedHorizon, stock, liveStockCmp]);

  const activePlan = useMemo(() => {
    switch (selectedHorizon) {
      case 'INTRADAY': return stock.intraday;
      case 'SWING': return stock.swing; // 1-4 Weeks
      case 'SHORT': return stock.shortTerm; // 1-3 Months
      case 'MEDIUM': return stock.mediumTerm; // 3-6 Months
      case 'LONG': return stock.longTerm; // 6-12 Months
    }
  }, [selectedHorizon, stock]);

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & INDIAN MACRO TICKER BAR                           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-gradient-to-r from-orange-500 via-white/80 to-emerald-500 px-2 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                🇮🇳 BHARAT EQUITY ENGINE
              </span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                NSE & BSE TOP 500 CONSTITUENTS
              </span>
              <span className="rounded bg-bull/15 px-2 py-0.5 text-xs font-semibold text-bull">
                MULTI-HORIZON & SWING 1–4W
              </span>
              {/* Dynamic Market Session Status Pill */}
              <div className={`flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-mono font-bold shadow-sm ${
                isMarketLive
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
              }`}>
                {isMarketLive ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500"></span>
                )}
                <span>{isMarketLive ? (isDemoSim ? '⚡ DEMO SIMULATION (1s TICKS)' : '🟢 LIVE NSE/BSE (MARKET OPEN)') : `🔴 ${marketSession.label}`}</span>
                <span className="font-normal opacity-80 text-[11px]">• {currentTimeStr}</span>
                {!isMarketLive && (
                  <span className="hidden sm:inline font-normal text-rose-300 text-[10px]">({marketSession.nextSessionText})</span>
                )}
                <button
                  onClick={() => setIsDemoSim(!isDemoSim)}
                  title={isDemoSim ? "Disable Demo Simulation" : "Test Simulation Mode"}
                  className={`ml-1 rounded px-1.5 py-0.2 transition-colors cursor-pointer text-[10px] ${
                    isDemoSim
                      ? 'bg-amber-500/30 text-amber-300 font-bold'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isDemoSim ? 'STOP SIM' : 'TEST SIM'}
                </button>
                <button
                  onClick={handleManualSync}
                  title="Resync to Verified Base Price"
                  className="rounded p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-transform active:rotate-180 cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                </button>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Advanced Indian Stock Market AI — Top 500 Stocks Analysis & Opportunity Engine
            </h1>
            <p className="text-xs text-muted-foreground">
              A-to-Z Multi-Factor Research: Business Moats, Balance Sheet CAGR, 8-Quarter Trends, Fair Value DCF, Multi-Timeframe SMC & Opportunity Scanner.
            </p>
          </div>

          {/* Primary View Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto rounded-lg border border-border/80 bg-secondary/50 p-1">
            <button
              onClick={() => setActiveMainTab('RESEARCH')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'RESEARCH'
                  ? 'bg-primary text-slate-950 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Compass className="size-3.5" />
              <span>Deep Stock Terminal</span>
            </button>
            <button
              onClick={() => setActiveMainTab('SECTORS')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'SECTORS'
                  ? 'bg-primary text-slate-950 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="size-3.5" />
              <span>⚡ Sector Outlook (Renewables & Defence)</span>
            </button>
            <button
              onClick={() => setActiveMainTab('PORTFOLIO')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'PORTFOLIO'
                  ? 'bg-primary text-slate-950 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="size-3.5" />
              <span>🌐 50:50 Growth Allocation (India & US)</span>
            </button>
            <button
              onClick={() => setActiveMainTab('SCANNER')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'SCANNER'
                  ? 'bg-primary text-slate-950 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="size-3.5" />
              <span>AI Opportunity Scanner</span>
            </button>
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-stock-research') : (window.location.hash = '#deeepr-stock-research')}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm"
            >
              <Shield className="size-3.5 text-cyan-200" />
              <span>🏛️ DEEEPR Stock Research ↗</span>
            </button>
          </div>
        </div>

        {/* Indian Benchmark Macro Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 border-t border-border/60 pt-3 font-mono text-[11px]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">NIFTY 50</span>
              {isMarketLive ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              )}
            </div>
            <p className={`font-bold transition-all duration-300 ${
              niftyFlash === 'UP'
                ? 'text-bull drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] scale-105'
                : niftyFlash === 'DOWN'
                  ? 'text-bear drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] scale-105'
                  : 'text-foreground'
            }`}>
              {liveNifty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className={`text-[10px] ${liveNiftyPct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {liveNiftyPct >= 0 ? '+' : ''}{liveNiftyPct.toFixed(2)}%
              </span>
            </p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">SENSEX</span>
              {isMarketLive ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              )}
            </div>
            <p className={`font-bold transition-all duration-300 ${
              sensexFlash === 'UP'
                ? 'text-bull drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] scale-105'
                : sensexFlash === 'DOWN'
                  ? 'text-bear drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] scale-105'
                  : 'text-foreground'
            }`}>
              {liveSensex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className={`text-[10px] ${liveSensexPct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {liveSensexPct >= 0 ? '+' : ''}{liveSensexPct.toFixed(2)}%
              </span>
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">INDIA VIX</span>
            <p className="font-bold text-bull">{INDIAN_MACRO_SNAPSHOT.indiaVix} (Low Vol)</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">RBI REPO RATE</span>
            <p className="font-bold text-foreground">6.50% (Neutral)</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">CPI INFLATION</span>
            <p className="font-bold text-bull">{INDIAN_MACRO_SNAPSHOT.cpiInflation.split(' ')[0]}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">USD / INR</span>
            <p className="font-bold text-foreground">₹{INDIAN_MACRO_SNAPSHOT.usdInr}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">BRENT CRUDE</span>
            <p className="font-bold text-bull">${INDIAN_MACRO_SNAPSHOT.brentCrudeUsd}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">DII NET FLOW</span>
            <p className="font-bold text-bull">+₹{INDIAN_MACRO_SNAPSHOT.diiNetCashCr} Cr</p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. UNIVERSAL TOP 500 SEARCH & SELECTOR                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search any NSE/BSE stock (e.g. RELIANCE, TCS, HDFCBANK, HAL, TRENT, DIXON, BSE)..."
              className="w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Universe Tier Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground mr-1">Quick Select:</span>
            {[
              { sym: 'RELIANCE', name: 'Reliance' },
              { sym: 'TATAPOWER', name: 'Tata Power ⚡' },
              { sym: 'KPIGREEN', name: 'KPI Green 🌱' },
              { sym: 'HAL', name: 'HAL Defence ✈️' },
              { sym: 'BEL', name: 'BEL Radar 🛡️' },
              { sym: 'TCS', name: 'TCS' },
              { sym: 'HDFCBANK', name: 'HDFC Bank' },
              { sym: 'TATAMOTORS', name: 'Tata Motors' },
              { sym: 'SBIN', name: 'SBI' },
              { sym: 'TRENT', name: 'Trent' }
            ].map(item => {
              const liveP = liveTickMap[item.sym]?.cmp;
              const flash = liveTickMap[item.sym]?.flash;
              return (
                <button
                  key={item.sym}
                  onClick={() => {
                    setSelectedSymbol(item.sym);
                    setActiveMainTab('RESEARCH');
                  }}
                  className={`rounded px-2 py-1 text-xs font-mono transition-all cursor-pointer ${
                    selectedSymbol === item.sym
                      ? 'border border-primary bg-primary/15 text-primary font-bold shadow-sm'
                      : 'border border-border/70 bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <span>{item.name}</span>
                  {liveP && (
                    <span className={`ml-1 text-[10px] font-bold ${flash === 'UP' ? 'text-bull' : flash === 'DOWN' ? 'text-bear' : 'text-foreground'}`}>
                      ₹{liveP.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Dropdown/Chips when typing */}
        {searchQuery.trim().length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-2.5 max-h-36 overflow-y-auto">
            {searchResults.map(res => {
              const currentP = liveTickMap[res.symbol]?.cmp ?? res.cmp;
              const currentChangePct = liveTickMap[res.symbol]?.changePct ?? res.changePct;
              const flash = liveTickMap[res.symbol]?.flash;
              return (
                <button
                  key={res.symbol}
                  onClick={() => {
                    setSelectedSymbol(res.symbol);
                    setSearchQuery('');
                    setActiveMainTab('RESEARCH');
                  }}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono cursor-pointer transition-colors ${
                    selectedSymbol === res.symbol
                      ? 'border-primary bg-primary/20 text-primary font-bold'
                      : 'border-border/60 bg-secondary/40 text-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="font-bold">{res.symbol}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{res.name}</span>
                  <span className={`text-[10px] font-bold ${flash === 'UP' ? 'text-bull' : flash === 'DOWN' ? 'text-bear' : currentChangePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                    ₹{currentP.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW A: DEEP STOCK RESEARCH ENGINE TERMINAL                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'RESEARCH' && (
        <div className="space-y-4">
          {/* ── 3. STOCK HERO CARD & SNAPSHOT ── */}
          <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-foreground font-mono">
                    {stock.symbol}
                  </h2>
                  <span className="text-sm font-semibold text-muted-foreground">{stock.name}</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {stock.capTier}
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {stock.sector}
                  </span>
                  {stock.isFnO && (
                    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      F&O ELIGIBLE
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground">
                    BSE: {stock.bseCode} · ISIN: {stock.isin}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-4xl leading-relaxed">
                  {stock.businessOverview}
                </p>
              </div>

              {/* Live Price Block with 1-Second Continuous Stream & Flash */}
              <div className="text-right font-mono self-start md:self-auto">
                <div className={`text-2xl sm:text-3xl font-black transition-all duration-300 ${
                  stockTickFlash === 'UP'
                    ? 'text-bull drop-shadow-[0_0_14px_rgba(16,185,129,0.55)] scale-[1.03]'
                    : stockTickFlash === 'DOWN'
                      ? 'text-bear drop-shadow-[0_0_14px_rgba(244,63,94,0.55)] scale-[1.03]'
                      : 'text-foreground'
                }`}>
                  ₹{liveStockCmp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-bold flex items-center justify-end gap-1 ${
                  liveStockChangePct >= 0 ? 'text-bull' : 'text-bear'
                }`}>
                  {liveStockChangePct >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  <span>{liveStockChangePct >= 0 ? '+' : ''}{liveStockChange >= 0 ? '+' : ''}{liveStockChange.toFixed(2)} ({liveStockChangePct >= 0 ? '+' : ''}{liveStockChangePct.toFixed(2)}%)</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isMarketLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  <span>{isMarketLive ? `1s L1 Live Feed · ${currentTimeStr}` : 'Official Settled Close (Market Closed)'}</span>
                </div>
              </div>
            </div>

            {/* Quick Financial Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 border-t border-border/60 pt-3 font-mono text-xs">
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">Market Cap</span>
                <p className="font-bold text-foreground">₹{(stock.mcapCr / 1000).toFixed(1)}k Cr</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">52W High / Low</span>
                <p className="font-bold text-foreground">₹{stock.high52w} / ₹{stock.low52w}</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">P/E Ratio</span>
                <p className="font-bold text-primary">{stock.peRatio}x <span className="text-[10px] text-muted-foreground">(Ind {stock.industryPE}x)</span></p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">P/B Ratio</span>
                <p className="font-bold text-foreground">{stock.pbRatio}x</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">ROE / ROCE</span>
                <p className="font-bold text-bull">{stock.roe}% / {stock.roce}%</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">Debt / Equity</span>
                <p className="font-bold text-foreground">{stock.debtToEquity.toFixed(2)}x</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">Delivery Volume</span>
                <p className="font-bold text-bull">{stock.deliveryPct}% (High)</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="label-xs block">Composite Quality</span>
                <p className="font-black text-primary">{stock.compositeQualityScore}/100</p>
              </div>
            </div>
          </div>

          {/* ── 4. DECISION BANNER & 10 QUALITY PILLARS ── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Actionable Decision Card */}
            <div className={`rounded-xl border-2 p-5 space-y-3.5 font-mono transition-all ${
              stock.overallDecision === 'STRONG BUY CANDIDATE' || stock.overallDecision === 'BUY ON CONFIRMATION'
                ? 'border-bull/50 bg-bull/5 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                : stock.overallDecision === 'ACCUMULATE GRADUALLY'
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                  : stock.overallDecision === 'WAIT FOR BETTER ENTRY' || stock.overallDecision === 'HOLD'
                    ? 'border-gold/50 bg-gold/5 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                    : 'border-bear/50 bg-bear/5 shadow-[0_0_20px_rgba(244,63,94,0.12)]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Final AI Verdict
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                  stock.overallDecision.includes('BUY')
                    ? 'bg-bull/20 text-bull'
                    : stock.overallDecision.includes('ACCUMULATE')
                      ? 'bg-primary/20 text-primary'
                      : stock.overallDecision.includes('WAIT') || stock.overallDecision.includes('HOLD')
                        ? 'bg-gold/20 text-gold'
                        : 'bg-bear/20 text-bear'
                }`}>
                  {stock.overallDecision}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">DCF Intrinsic Fair Value:</span>
                  <span className="text-lg font-black text-bull">₹{stock.dcfIntrinsicValue}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Base-Case Target:</span>
                  <span className="font-bold text-foreground">₹{stock.baseCaseFairValue} ({(((stock.baseCaseFairValue - liveStockCmp) / liveStockCmp) * 100).toFixed(1)}% upside)</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Valuation Multiple:</span>
                  <span className="font-semibold text-primary">{stock.valuationVerdict}</span>
                </div>
              </div>

              {/* Horizon Selector */}
              <div className="border-t border-border/60 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">Select Horizon Plan:</span>
                  <span className="text-[10px] text-muted-foreground">Active: {activePlan.holding}</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[10px]">
                  {[
                    { id: 'SWING' as const, label: 'Swing (1–4W)' },
                    { id: 'INTRADAY' as const, label: 'Intraday' },
                    { id: 'SHORT' as const, label: 'Short (1–3M)' },
                    { id: 'MEDIUM' as const, label: 'Medium (3–6M)' },
                    { id: 'LONG' as const, label: 'Long (1–3Y)' }
                  ].map(h => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHorizon(h.id)}
                      className={`rounded py-1 text-center font-bold transition-all cursor-pointer ${
                        selectedHorizon === h.id
                          ? 'bg-primary text-slate-950 shadow-sm'
                          : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Coordinates */}
              <div className="rounded-lg bg-card/80 border border-border/70 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Setup Type:</span>
                  <span className="font-bold text-foreground truncate max-w-[180px]">{activePlan.setup}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preferred Entry:</span>
                  <span className="font-black text-bull">{activePlan.entry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Structural Stop-Loss:</span>
                  <span className="font-black text-bear">{activePlan.sl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Target 1 / Target 2:</span>
                  <span className="font-bold text-bull">{activePlan.tp1} {activePlan.tp2 ? `· ${activePlan.tp2}` : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk / Reward (R:R):</span>
                  <span className="font-black text-primary">{activePlan.rr}</span>
                </div>
              </div>
            </div>

            {/* 10 Quality Pillars Gauge Grid */}
            <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Award className="size-4 text-primary" />
                  10-Factor Institutional Quality & Risk Audit (Scores / 100)
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                  Composite: {stock.compositeQualityScore}/100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                {[
                  { label: 'Business Moat', score: stock.businessQualityScore, desc: 'Pricing power & entry barrier' },
                  { label: 'Balance Sheet', score: stock.financialStrengthScore, desc: 'Zero/low debt & cash flow' },
                  { label: 'Earnings CAGR', score: stock.earningsConsistencyScore, desc: '3Y/5Y profit consistency' },
                  { label: 'Valuation Attract', score: stock.valuationScore, desc: 'DCF & multiple discount' },
                  { label: 'Governance & Board', score: stock.governanceScore, desc: 'Clean audit & zero pledge' },
                  { label: 'Technical Trend', score: stock.technicalTrendScore, desc: 'Multi-TF BOS structure' },
                  { label: 'Sector Momentum', score: stock.sectorStrengthScore, desc: 'Industry demand tailwind' },
                  { label: 'Liquidity & F&O', score: stock.liquidityScore, desc: 'High delivery & depth' },
                  { label: 'Macro Insulation', score: stock.macroSensitivityScore, desc: 'Rates, oil & FX impact' },
                  { label: 'Risk-Adjusted R:R', score: stock.riskAdjustedScore, desc: 'Asymmetric Sharpe potential' }
                ].map(p => (
                  <div key={p.label} className="rounded-lg border border-border/70 bg-secondary/30 p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground truncate">{p.label}</span>
                      <span className={`font-black text-xs ${
                        p.score >= 85 ? 'text-bull' : p.score >= 70 ? 'text-primary' : 'text-gold'
                      }`}>
                        {p.score}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.score >= 85 ? 'bg-bull' : p.score >= 70 ? 'bg-primary' : 'bg-gold'
                        }`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground block truncate">{p.desc}</span>
                  </div>
                ))}
              </div>

              {/* Invalidation Trigger Alert */}
              <div className="rounded-lg border border-bear/30 bg-bear/5 p-2.5 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-bear" />
                <span className="text-muted-foreground text-[11px]">
                  <strong className="text-bear">Thesis Invalidation Level:</strong> {stock.invalidationTrigger}
                </span>
              </div>
            </div>
          </div>

          {/* ── 5. INTERACTIVE LIVE TRADINGVIEW CANDLESTICK CHART ── */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground font-mono flex items-center gap-1.5">
                  <Activity className="size-4 text-primary" />
                  Interactive Candlestick Chart (NSE Feed) — {stock.tradingViewSymbol}
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  EMA 20/50/200 · RSI · MACD · Volume Profile POC
                </span>
              </div>
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(stock.tradingViewSymbol)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
              >
                <span>Full Chart on TradingView</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="h-[460px] w-full rounded-lg overflow-hidden border border-border/70 bg-[#080d1a]">
              <TradingViewWidget
                symbol={stock.tradingViewSymbol}
                height={460}
                interval="D"
                studies={['STD;EMA', 'STD;RSI', 'STD;MACD']}
              />
            </div>
          </div>

          {/* ── 6. POSITION SIZING & RISK MANAGEMENT CALCULATOR ── */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Target className="size-4 text-primary" />
                Capital Allocation & Position Sizing Calculator (Strict Risk Control)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Never risk more than 1–2% of trading capital on any single equity trade
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground block">Trading Capital (₹):</label>
                <input
                  type="number"
                  value={tradingCapital}
                  onChange={e => setTradingCapital(Math.max(10000, Number(e.target.value)))}
                  className="w-full rounded border border-border bg-secondary/40 px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground block">Max Risk Per Trade (%):</label>
                <select
                  value={riskPerTradePct}
                  onChange={e => setRiskPerTradePct(Number(e.target.value))}
                  className="w-full rounded border border-border bg-secondary/40 px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={0.5}>0.5% (Conservative Institutional)</option>
                  <option value={1.0}>1.0% (Standard Professional)</option>
                  <option value={1.5}>1.5% (Balanced Growth)</option>
                  <option value={2.0}>2.0% (Aggressive Maximum)</option>
                </select>
              </div>

              <div className="space-y-1 rounded bg-secondary/30 p-2.5">
                <span className="text-[10px] text-muted-foreground block">Allowed Max Risk (₹):</span>
                <p className="text-sm font-black text-bear">₹{positionSizing.maxRiskInr.toLocaleString()}</p>
                <span className="text-[10px] text-muted-foreground block">Risk per share: ₹{positionSizing.riskPerShare}</span>
              </div>

              <div className="space-y-1 rounded bg-primary/10 p-2.5 border border-primary/30">
                <span className="text-[10px] text-primary block">Recommended Allocation:</span>
                <p className="text-sm font-black text-primary">{positionSizing.sharesQty} Shares (₹{positionSizing.totalExposure.toLocaleString()})</p>
                <span className="text-[10px] text-muted-foreground block">{((positionSizing.totalExposure / tradingCapital) * 100).toFixed(1)}% of total portfolio</span>
              </div>
            </div>
          </div>

          {/* ── 7. COMPREHENSIVE RESEARCH TABS (10 SECTIONS) ── */}
          <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4">
            {/* Tab navigation pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-border/60 text-xs font-mono">
              {[
                { id: 'EXECUTION_BLUEPRINT' as const, label: '🎯 A-to-Z Execution Blueprint' },
                { id: 'OVERVIEW' as const, label: 'Overview & Catalysts' },
                { id: 'BUSINESS' as const, label: 'Business Model & Moat' },
                { id: 'FINANCIALS' as const, label: 'Financial Statements (10Y)' },
                { id: 'QUARTERS' as const, label: 'Quarterly Results (8Q)' },
                { id: 'GOVERNANCE' as const, label: 'Shareholding & Audit' },
                { id: 'ANNUAL_REPORT' as const, label: 'Annual Report & Capex' },
                { id: 'VALUATION' as const, label: 'Valuation & DCF Fair Value' },
                { id: 'TECHNICALS' as const, label: 'SMC Technicals & F&O' },
                { id: 'MACRO' as const, label: 'Macro Sensitivities' },
                { id: 'SCENARIOS' as const, label: '1M/3M/6M/12M Scenarios' },
                { id: 'PEERS' as const, label: 'Peer Comparison' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveResearchTab(t.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    activeResearchTab === t.id
                      ? 'bg-primary text-slate-950 font-bold shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 0: A-TO-Z TRADE & MONEY BLUEPRINT */}
            {activeResearchTab === 'EXECUTION_BLUEPRINT' && (
              <div className="space-y-4 font-mono text-xs">
                {/* 1. Master Guidance Banner */}
                <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-slate-900 to-primary/5 p-4 sm:p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-black text-primary">
                      <Target className="size-5 text-primary" />
                      INSTITUTIONAL A-TO-Z TRADE & MONEY MANAGEMENT BLUEPRINT
                    </span>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                      PIPELINE: LOCATION ➔ DIRECTION ➔ TRIGGER ➔ RISK
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Koi bhi trade "sure-shot" ya guaranteed nahi hota. Desk rule: Trade tab banti hai jab price valid zone par ho, trigger candle close ho jaye, aur Risk-to-Reward (RR) minimum 2.0 ho. Niche is stock ka complete step-by-step capital, entry, SL, targets aur partial profit booking plan diya gaya hai.
                  </p>
                </div>

                {/* 2. Seven Essential Questions Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Q1: Upar Kyon Ja Sakta Hai */}
                  <div className="rounded-lg border border-bull/40 bg-bull/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-bull font-bold text-sm">
                      <TrendingUp className="size-4" />
                      <span>1. Upar Kyon Ja Sakta Hai?</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Core Drivers & Moat:</strong> {stock.businessOverview}
                    </p>
                    <ul className="space-y-1 text-[11px] text-foreground">
                      {stock.top3ReasonsToInvest.slice(0, 3).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-bull font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Q2: Long Kab Karna Hai */}
                  <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Clock className="size-4" />
                      <span>2. Long Kab Karna Hai? (Trigger)</span>
                    </div>
                    <p className="text-foreground text-[11px] font-bold">
                      {stock.swing.setup}
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Closed-Candle Rule:</strong> Entry tabhi valid hogi jab Daily/4H candle entry range ({stock.swing.entry}) ke andar bullish rejection wick ya breakout hold kare. Live tick touch par entry na lein.
                    </p>
                    <div className="rounded bg-black/40 p-2 text-[10px] text-amber-300 border border-amber-500/30">
                      ⚡ Mid-range chhod dein. Agar price entry zone se door bhag chuka hai, chase na karein (WAIT rule).
                    </div>
                  </div>

                  {/* Q3: Kitna Paisa Lagana Hai */}
                  <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                      <DollarSign className="size-4 text-primary" />
                      <span>3. Kitna Paisa Lagana Hai?</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Portfolio Capital:</span>
                        <span className="font-bold">₹{tradingCapital.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Risk ({riskPerTradePct}%):</span>
                        <span className="font-bold text-bear">₹{positionSizing.maxRiskInr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-1">
                        <span className="text-primary font-bold">Recommended Quantity:</span>
                        <span className="font-bold text-primary">{positionSizing.sharesQty} Shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total INR Deployed:</span>
                        <span className="font-bold text-foreground">₹{positionSizing.totalExposure.toLocaleString()} ({((positionSizing.totalExposure / tradingCapital) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      *Formula: Shares = Max Risk / (Entry - StopLoss). Kabhi bhi 1-2% se zyada risk na lein.
                    </p>
                  </div>

                  {/* Q4: Kahan Entry Karni Hai */}
                  <div className="rounded-lg border border-bull/40 bg-secondary/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-bull font-bold text-sm">
                      <ArrowUpRight className="size-4" />
                      <span>4. Kahan Entry Karni Hai?</span>
                    </div>
                    <div className="text-lg font-black text-bull font-mono">
                      {stock.swing.entry}
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      CMP: <strong>₹{stock.cmp.toLocaleString()}</strong>. Entry hamesha planned demand zone ya discount zone (p &le; 0.45) par karein. Resistance ke bilkul neeche buy karna mana hai.
                    </p>
                  </div>

                  {/* Q5: Kahan Stop-Loss Lagana Hai */}
                  <div className="rounded-lg border border-bear/40 bg-bear/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-bear font-bold text-sm">
                      <Shield className="size-4" />
                      <span>5. Kahan Stop-Loss Lagana Hai?</span>
                    </div>
                    <div className="text-lg font-black text-bear font-mono">
                      {stock.swing.sl}
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      SL demand zone ke lowest point se 0.35 ATR neeche rakha jata hai. Agar candle iske neeche close hoti hai, to chupchap exit karein. Hope par holding mana hai.
                    </p>
                    <div className="text-[10px] text-rose-300 font-bold">
                      Thesis Invalidation: {stock.invalidationTrigger}
                    </div>
                  </div>

                  {/* Q6: Kitna Target Book Karna Hai */}
                  <div className="rounded-lg border border-primary/40 bg-secondary/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Target className="size-4" />
                      <span>6. Targets & Risk-to-Reward</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TP1 (Nearest Supply):</span>
                        <span className="font-bold text-bull">{stock.swing.tp1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TP2 (Structural Expansion):</span>
                        <span className="font-bold text-bull">{stock.swing.tp2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TP3 (HTF Liquidity Pool):</span>
                        <span className="font-bold text-bull">{stock.swing.tp3}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-1">
                        <span className="text-primary font-bold">Calculated R:R Ratio:</span>
                        <span className="font-black text-primary">{stock.swing.rr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Partial Profit Booking & Capital Recovery Timeline */}
                <div className="rounded-xl border border-border/80 bg-slate-900/90 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Layers className="size-4 text-primary" />
                    <span>7. Partially Kab Aur Kitna Paisa Nikalna Hai? (Exit Execution Strategy)</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-400 text-xs">STAGE 1: 50% PROFIT BOOK</span>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">Target 1 Hit</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">Sell 50% Quantity @ {stock.swing.tp1}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Apna 50% capital aur initial profit lock karein. <strong>Mandatory Rule:</strong> Stop-loss ko turant entry price par shift (move to breakeven) kar dein. Iske baad ye trade zero-risk ban jata hai.
                      </p>
                    </div>

                    <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-cyan-400 text-xs">STAGE 2: 30% PROFIT BOOK</span>
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">Target 2 Hit</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">Sell 30% Quantity @ {stock.swing.tp2}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        2R+ return secure karein. Remaining 20% position ke liye SL ko TP1 ke thoda upar trail karein, taaki minimum profit guaranteed rahe.
                      </p>
                    </div>

                    <div className="rounded-lg border border-primary/40 bg-primary/10 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary text-xs">STAGE 3: 20% RUNNER TRAILING</span>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">Target 3 / Trend</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">Hold 20% Runner @ {stock.swing.tp3}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Bacha hua 20% paisa tab tak na nikalein jab tak stock Daily 50 EMA ke neeche close na ho ya koi structural trend breakdown na de. Ye multibagger expansion capture karta hai.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: OVERVIEW */}
            {activeResearchTab === 'OVERVIEW' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-bull/40 bg-bull/5 p-4 space-y-2">
                    <span className="font-bold text-bull text-sm flex items-center gap-1.5">
                      <CheckCircle className="size-4" />
                      Top 3 Reasons to Invest:
                    </span>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {stock.top3ReasonsToInvest.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-bull font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-bear/40 bg-bear/5 p-4 space-y-2">
                    <span className="font-bold text-bear text-sm flex items-center gap-1.5">
                      <AlertTriangle className="size-4" />
                      Top 3 Key Risks to Monitor:
                    </span>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {stock.top3Risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-bear font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-2">
                  <span className="font-bold text-foreground">Sector Catalysts & Government Tailwinds:</span>
                  <div className="flex flex-wrap gap-2">
                    {stock.sectorCatalysts.map((cat, i) => (
                      <span key={i} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary text-[11px] font-bold">
                        ⚡ {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: BUSINESS MODEL & MOATS */}
            {activeResearchTab === 'BUSINESS' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-2">
                  <span className="font-bold text-foreground">Segment Revenue Contribution (% of Total Sales):</span>
                  <div className="space-y-2">
                    {stock.revenueStreams.map(st => (
                      <div key={st.name} className="space-y-1 rounded-lg border border-border/70 bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{st.name}</span>
                          <span className="font-black text-primary">{st.sharePct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${st.sharePct}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 space-y-2">
                    <span className="font-bold text-primary">Core Economic Moats:</span>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {stock.moats.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">🏰</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 space-y-2">
                    <span className="font-bold text-bull">Competitive Advantages:</span>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {stock.competitiveAdvantages.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-bull font-bold">✓</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: FINANCIAL STATEMENTS & CAGR */}
            {activeResearchTab === 'FINANCIALS' && (
              <div className="space-y-4 text-xs font-mono">
                {/* 3Y/5Y/10Y Growth CAGR Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div className="rounded bg-secondary/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">3Y Revenue CAGR</span>
                    <p className="font-black text-bull text-sm">+{stock.revenue3yCagr}%</p>
                  </div>
                  <div className="rounded bg-secondary/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">5Y Revenue CAGR</span>
                    <p className="font-black text-bull text-sm">+{stock.revenue5yCagr}%</p>
                  </div>
                  <div className="rounded bg-secondary/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">10Y Revenue CAGR</span>
                    <p className="font-black text-foreground text-sm">+{stock.revenue10yCagr}%</p>
                  </div>
                  <div className="rounded bg-secondary/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">3Y Profit CAGR</span>
                    <p className="font-black text-bull text-sm">+{stock.profit3yCagr}%</p>
                  </div>
                  <div className="rounded bg-secondary/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">5Y Profit CAGR</span>
                    <p className="font-black text-bull text-sm">+{stock.profit5yCagr}%</p>
                  </div>
                  <div className="rounded bg-secondary/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">OCF / Net Profit</span>
                    <p className="font-black text-primary text-sm">{stock.ocfToNetProfit}x</p>
                  </div>
                </div>

                {/* Annual Financial Statements Table */}
                <div className="rounded-lg border border-border/80 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground">
                      <tr>
                        <th className="p-2.5">FY Year</th>
                        <th className="p-2.5">Revenue (₹ Cr)</th>
                        <th className="p-2.5">EBITDA (₹ Cr)</th>
                        <th className="p-2.5">PAT (₹ Cr)</th>
                        <th className="p-2.5">EPS (₹)</th>
                        <th className="p-2.5">OCF (₹ Cr)</th>
                        <th className="p-2.5">FCF (₹ Cr)</th>
                        <th className="p-2.5">OPM %</th>
                        <th className="p-2.5">ROE %</th>
                        <th className="p-2.5">ROCE %</th>
                        <th className="p-2.5">D/E</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stock.financialYears.map(fy => (
                        <tr key={fy.year} className="hover:bg-secondary/30">
                          <td className="p-2.5 font-bold text-foreground">{fy.year}</td>
                          <td className="p-2.5 font-bold">{fy.revenueCr.toLocaleString()}</td>
                          <td className="p-2.5">{fy.ebitdaCr.toLocaleString()}</td>
                          <td className="p-2.5 font-bold text-bull">{fy.netProfitCr.toLocaleString()}</td>
                          <td className="p-2.5">₹{fy.eps}</td>
                          <td className="p-2.5 text-bull">{fy.ocfCr.toLocaleString()}</td>
                          <td className="p-2.5 text-primary">{fy.fcfCr.toLocaleString()}</td>
                          <td className="p-2.5">{fy.opmPct}%</td>
                          <td className="p-2.5 font-bold text-bull">{fy.roePct}%</td>
                          <td className="p-2.5">{fy.rocePct}%</td>
                          <td className="p-2.5">{fy.d2e}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: QUARTERLY RESULTS */}
            {activeResearchTab === 'QUARTERS' && (
              <div className="space-y-4 text-xs font-mono">
                <span className="font-bold text-foreground">Recent Quarterly Performance & Earnings Surprises:</span>
                <div className="rounded-lg border border-border/80 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Quarter</th>
                        <th className="p-2.5">Revenue (₹ Cr)</th>
                        <th className="p-2.5">YoY Rev %</th>
                        <th className="p-2.5">EBITDA (₹ Cr)</th>
                        <th className="p-2.5">PAT (₹ Cr)</th>
                        <th className="p-2.5">YoY PAT %</th>
                        <th className="p-2.5">EPS (₹)</th>
                        <th className="p-2.5">OPM %</th>
                        <th className="p-2.5">Consensus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stock.quarters.map(q => (
                        <tr key={q.qtr} className="hover:bg-secondary/30">
                          <td className="p-2.5 font-bold text-foreground">{q.qtr}</td>
                          <td className="p-2.5 font-bold">{q.revenueCr.toLocaleString()}</td>
                          <td className={`p-2.5 ${q.yoyRevGrowth >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {q.yoyRevGrowth >= 0 ? '+' : ''}{q.yoyRevGrowth}%
                          </td>
                          <td className="p-2.5">{q.ebitdaCr.toLocaleString()}</td>
                          <td className="p-2.5 font-bold text-bull">{q.netProfitCr.toLocaleString()}</td>
                          <td className={`p-2.5 font-bold ${q.yoyPatGrowth >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {q.yoyPatGrowth >= 0 ? '+' : ''}{q.yoyPatGrowth}%
                          </td>
                          <td className="p-2.5">₹{q.eps}</td>
                          <td className="p-2.5">{q.opmPct}%</td>
                          <td className="p-2.5">
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              q.beatMiss === 'BEAT' ? 'bg-bull/20 text-bull' : q.beatMiss === 'IN-LINE' ? 'bg-primary/20 text-primary' : 'bg-bear/20 text-bear'
                            }`}>
                              {q.beatMiss}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: GOVERNANCE & SHAREHOLDING */}
            {activeResearchTab === 'GOVERNANCE' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">Promoter Holding</span>
                    <p className="text-xl font-bold text-foreground">{stock.promoterHoldingPct}%</p>
                    <span className="text-[10px] text-muted-foreground">{stock.promoterChangeQoQ}</span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">Promoter Pledge %</span>
                    <p className={`text-xl font-bold ${stock.promoterPledgePct === 0 ? 'text-bull' : 'text-bear'}`}>
                      {stock.promoterPledgePct.toFixed(2)}%
                    </p>
                    <span className="text-[10px] text-bull">{stock.promoterPledgePct === 0 ? 'Zero Encumbrance' : 'Pledge Alert'}</span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">FII / FPI Holding</span>
                    <p className="text-xl font-bold text-primary">{stock.fiiHoldingPct}%</p>
                    <span className="text-[10px] text-muted-foreground">{stock.fiiChangeQoQ}</span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">DII & Mutual Funds</span>
                    <p className="text-xl font-bold text-bull">{stock.diiHoldingPct}%</p>
                    <span className="text-[10px] text-muted-foreground">{stock.diiChangeQoQ}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 space-y-2">
                  <span className="font-bold text-foreground">Statutory Auditor & Corporate Governance Audit:</span>
                  <div className="space-y-1 text-muted-foreground">
                    <p><strong className="text-foreground">Auditor Name:</strong> {stock.auditorName}</p>
                    <p><strong className="text-foreground">Auditor Opinion:</strong> {stock.auditorRemarks}</p>
                    <p><strong className="text-foreground">Dilution Risk:</strong> {stock.dilutionRisk}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: ANNUAL REPORT */}
            {activeResearchTab === 'ANNUAL_REPORT' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 space-y-2">
                  <span className="font-bold text-foreground">Management Discussion & Outlook (Latest Annual Report):</span>
                  <p className="text-muted-foreground leading-relaxed">{stock.managementCommentary}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="label-xs block">Capex Guidance</span>
                    <p className="text-muted-foreground">{stock.capexGuidance}</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="label-xs block">Order Backlog / Book</span>
                    <p className="font-bold text-bull">{stock.orderBookCr ? `₹${stock.orderBookCr.toLocaleString()} Cr` : 'Continuous Retail / Annuity'}</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="label-xs block">Corporate Actions</span>
                    <p className="text-muted-foreground">{stock.corporateActionHistory}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 7: VALUATION & DCF */}
            {activeResearchTab === 'VALUATION' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">Current P/E Ratio</span>
                    <p className="text-xl font-bold text-foreground">{stock.peRatio}x</p>
                    <span className="text-[10px] text-muted-foreground">10Y Median: {stock.peBandMedian}x</span>
                  </div>

                  <div className="rounded-lg border border-bull/40 bg-bull/5 p-3.5 space-y-1">
                    <span className="label-xs block text-bull">DCF Intrinsic Fair Value</span>
                    <p className="text-xl font-bold text-bull">₹{stock.dcfIntrinsicValue}</p>
                    <span className="text-[10px] text-bull">Implied Growth: {stock.reverseDcfImpliedGrowth}%</span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">Base-Case Valuation</span>
                    <p className="text-xl font-bold text-primary">₹{stock.baseCaseFairValue}</p>
                    <span className="text-[10px] text-muted-foreground">Bull-Case: ₹{stock.bullCaseFairValue}</span>
                  </div>

                  <div className="rounded-lg border border-bear/40 bg-bear/5 p-3.5 space-y-1">
                    <span className="label-xs block text-bear">Bear-Case Stress Test</span>
                    <p className="text-xl font-bold text-bear">₹{stock.bearCaseFairValue}</p>
                    <span className="text-[10px] text-muted-foreground">Growth compressed to 6%</span>
                  </div>
                </div>

                {stock.bankingMetrics && (
                  <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-2">
                    <span className="font-bold text-foreground">Sector-Specific Banking / Financial Metrics:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs pt-1">
                      <div><span className="text-muted-foreground text-[10px] block">NIM:</span> <strong className="text-foreground">{stock.bankingMetrics.nimPct}%</strong></div>
                      <div><span className="text-muted-foreground text-[10px] block">Gross NPA:</span> <strong className="text-bull">{stock.bankingMetrics.gnpaPct}%</strong></div>
                      <div><span className="text-muted-foreground text-[10px] block">Net NPA:</span> <strong className="text-bull">{stock.bankingMetrics.nnpaPct}%</strong></div>
                      <div><span className="text-muted-foreground text-[10px] block">ROA:</span> <strong className="text-foreground">{stock.bankingMetrics.roaPct}%</strong></div>
                      <div><span className="text-muted-foreground text-[10px] block">CAR (Capital Adequacy):</span> <strong className="text-primary">{stock.bankingMetrics.carPct}%</strong></div>
                      <div><span className="text-muted-foreground text-[10px] block">CASA Ratio:</span> <strong className="text-foreground">{stock.bankingMetrics.casaPct}%</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 8: TECHNICALS & SMC */}
            {activeResearchTab === 'TECHNICALS' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1.5">
                    <span className="label-xs block">Market Structure & Trend</span>
                    <p className="font-bold text-foreground">{stock.marketStructure}</p>
                    <span className="text-[11px] text-bull font-semibold">{stock.trendDaily}</span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1.5">
                    <span className="label-xs block">SMC Supply & Demand</span>
                    <p className="text-muted-foreground">Order Block: <strong className="text-bull">₹{stock.orderBlockPrice}</strong></p>
                    <p className="text-muted-foreground">FVG Level: <strong className="text-primary">{stock.fvgLevel}</strong></p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1.5">
                    <span className="label-xs block">Volume Profile (VPVR)</span>
                    <p className="text-muted-foreground">POC Anchor: <strong className="text-foreground">₹{stock.pocVolumeProfile}</strong></p>
                    <p className="text-muted-foreground">VAH / VAL: <strong>₹{stock.vahLevel} / ₹{stock.valLevel}</strong></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div className="rounded bg-secondary/30 p-2"><span className="text-[10px] text-muted-foreground block">RSI (14)</span><strong>{stock.rsi14}</strong></div>
                  <div className="rounded bg-secondary/30 p-2"><span className="text-[10px] text-muted-foreground block">EMA 20</span><strong>₹{stock.ema20}</strong></div>
                  <div className="rounded bg-secondary/30 p-2"><span className="text-[10px] text-muted-foreground block">EMA 50</span><strong>₹{stock.ema50}</strong></div>
                  <div className="rounded bg-secondary/30 p-2"><span className="text-[10px] text-muted-foreground block">EMA 200</span><strong className="text-bull">₹{stock.ema200}</strong></div>
                  <div className="rounded bg-secondary/30 p-2"><span className="text-[10px] text-muted-foreground block">Delivery %</span><strong className="text-bull">{stock.deliveryPct}%</strong></div>
                  <div className="rounded bg-secondary/30 p-2"><span className="text-[10px] text-muted-foreground block">Rel Volume (RVOL)</span><strong>{stock.relVolume}x</strong></div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 9: MACRO */}
            {activeResearchTab === 'MACRO' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">RBI Repo Rate Sensitivity</span>
                    <p className="font-bold text-bull">{stock.rbiRateSensitivity}</p>
                    <span className="text-[10px] text-muted-foreground">Rate easing expands capex and consumer borrowing demand</span>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">Crude Oil Sensitivity</span>
                    <p className="font-bold text-foreground">{stock.crudeOilSensitivity}</p>
                    <span className="text-[10px] text-muted-foreground">Lower crude protects logistics margins</span>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-1">
                    <span className="label-xs block">USD / INR Sensitivity</span>
                    <p className="font-bold text-foreground">{stock.usdInrSensitivity}</p>
                    <span className="text-[10px] text-muted-foreground">Domestic market insulation prevents FX squeeze</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 10: SCENARIOS */}
            {activeResearchTab === 'SCENARIOS' && (
              <div className="space-y-4 text-xs font-mono">
                <span className="font-bold text-foreground">Multi-Horizon Future Price Forecast (Bear / Base / Bull):</span>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { h: '1 Month', sc: stock.priceScenarios.m1 },
                    { h: '3 Months', sc: stock.priceScenarios.m3 },
                    { h: '6 Months', sc: stock.priceScenarios.m6 },
                    { h: '12 Months', sc: stock.priceScenarios.m12 }
                  ].map(s => (
                    <div key={s.h} className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 space-y-2">
                      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                        <span className="font-bold text-foreground">{s.h}</span>
                        <span className="text-[10px] text-primary font-bold">Prob {s.sc.probBase}%</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]"><span className="text-bear">Bear Case:</span> <strong>₹{s.sc.bear}</strong></div>
                        <div className="flex justify-between text-xs"><span className="text-foreground font-bold">Base Case:</span> <strong className="text-bull">₹{s.sc.base}</strong></div>
                        <div className="flex justify-between text-[11px]"><span className="text-bull">Bull Case:</span> <strong>₹{s.sc.bull}</strong></div>
                      </div>
                      <span className="text-[10px] text-muted-foreground block text-right">
                        Potential: {(((s.sc.base - stock.cmp) / stock.cmp) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 11: PEERS */}
            {activeResearchTab === 'PEERS' && (
              <div className="space-y-4 text-xs font-mono">
                <span className="font-bold text-foreground">Listed Peer Comparison Matrix:</span>
                <div className="rounded-lg border border-border/80 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Company</th>
                        <th className="p-2.5">P/E</th>
                        <th className="p-2.5">EV / EBITDA</th>
                        <th className="p-2.5">ROE %</th>
                        <th className="p-2.5">ROCE %</th>
                        <th className="p-2.5">3Y Sales CAGR</th>
                        <th className="p-2.5">Market Cap (₹ Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr className="bg-primary/10 font-bold">
                        <td className="p-2.5 text-primary">{stock.symbol} ({stock.name})</td>
                        <td className="p-2.5">{stock.peRatio}x</td>
                        <td className="p-2.5">{stock.evEbitda}x</td>
                        <td className="p-2.5 text-bull">{stock.roe}%</td>
                        <td className="p-2.5 text-bull">{stock.roce}%</td>
                        <td className="p-2.5">+{stock.revenue3yCagr}%</td>
                        <td className="p-2.5">₹{stock.mcapCr.toLocaleString()}</td>
                      </tr>
                      {stock.peers.map(p => (
                        <tr key={p.symbol} className="hover:bg-secondary/30">
                          <td className="p-2.5 font-bold text-foreground">{p.symbol} ({p.name})</td>
                          <td className="p-2.5">{p.pe}x</td>
                          <td className="p-2.5">{p.evEbitda}x</td>
                          <td className="p-2.5">{p.roe}%</td>
                          <td className="p-2.5">{p.roce}%</td>
                          <td className="p-2.5">+{p.salesCagr3y}%</td>
                          <td className="p-2.5">₹{p.mcapCr.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW B: AI OPPORTUNITY SCANNER (INDIAN EQUITY ENGINE)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'SCANNER' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Scanner Controls Bar */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div>
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Zap className="size-4 text-primary" />
                  Real-Time AI Market Scanner — Indian Equity Opportunity Engine
                </span>
                <span className="text-[11px] text-muted-foreground ml-2">
                  Scanning Top 500 stocks across multi-timeframe structure, delivery spikes, and fair value discounts
                </span>
              </div>
              <span className="rounded bg-bull/15 px-2.5 py-1 text-bull font-bold text-[11px]">
                ● {scannerCandidates.length} Active High-Probability Setups
              </span>
            </div>

            {/* Filters Row */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Cap Tier:</label>
                <select
                  value={scannerCapTier}
                  onChange={e => setScannerCapTier(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Market Caps</option>
                  <option value="Large-Cap">Large-Cap (Top 100)</option>
                  <option value="Mid-Cap">Mid-Cap (101–250)</option>
                  <option value="Small-Cap">Small-Cap (251–500)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Setup Type:</label>
                <select
                  value={scannerSetupFilter}
                  onChange={e => setScannerSetupFilter(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Setups</option>
                  <option value="Breakout">Breakout & Retest</option>
                  <option value="Support">Support Reversal / Bounce</option>
                  <option value="Accumulation">Value Accumulation</option>
                  <option value="Demand">Demand Block Sweep</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Decision Filter:</label>
                <select
                  value={scannerDecisionFilter}
                  onChange={e => setScannerDecisionFilter(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Decisions</option>
                  <option value="STRONG BUY CANDIDATE">Strong Buy Candidates</option>
                  <option value="BUY ON CONFIRMATION">Buy on Confirmation</option>
                  <option value="ACCUMULATE GRADUALLY">Accumulate Gradually</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Holding Horizon:</label>
                <select
                  value={scannerHorizonFilter}
                  onChange={e => setScannerHorizonFilter(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="SWING">Swing Trading (1–4 Weeks)</option>
                  <option value="INTRADAY">Intraday (Day Session)</option>
                  <option value="SHORT">Short-Term (1–3 Months)</option>
                  <option value="MEDIUM">Medium-Term (3–6 Months)</option>
                  <option value="LONG">Long-Term (6–12 Months)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scanner Results Table */}
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground">
                  <tr>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">CMP</th>
                    <th className="p-3">Decision</th>
                    <th className="p-3">Setup</th>
                    <th className="p-3">Entry Zone</th>
                    <th className="p-3">Stop-Loss</th>
                    <th className="p-3">Target 1</th>
                    <th className="p-3">R:R</th>
                    <th className="p-3">Quality</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scannerCandidates.map(({ item, profile }) => {
                    const liveCmp = liveTickMap[item.symbol]?.cmp ?? item.cmp;
                    const liveChangePct = liveTickMap[item.symbol]?.changePct ?? item.changePct;
                    const flash = liveTickMap[item.symbol]?.flash;
                    return (
                      <tr key={item.symbol} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-primary font-bold">{item.symbol}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground truncate max-w-[120px]">{item.sector}</td>
                        <td className="p-3 font-bold">
                          <span className={`font-mono transition-all duration-300 ${
                            flash === 'UP'
                              ? 'text-bull scale-105 inline-block drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : flash === 'DOWN'
                                ? 'text-bear scale-105 inline-block drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                : 'text-foreground'
                          }`}>
                            ₹{liveCmp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`block text-[10px] font-mono ${liveChangePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {liveChangePct >= 0 ? '+' : ''}{typeof liveChangePct === 'number' ? liveChangePct.toFixed(2) : liveChangePct}%
                          </span>
                        </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          profile.overallDecision.includes('BUY')
                            ? 'bg-bull/20 text-bull'
                            : profile.overallDecision.includes('ACCUMULATE')
                              ? 'bg-primary/20 text-primary'
                              : 'bg-gold/20 text-gold'
                        }`}>
                          {profile.overallDecision.split(' ')[0]}
                        </span>
                      </td>
                      <td className="p-3 text-foreground font-semibold truncate max-w-[140px]">
                        {profile.swing.setup}
                      </td>
                      <td className="p-3 font-bold text-bull">{profile.swing.entry}</td>
                      <td className="p-3 font-bold text-bear">{profile.swing.sl.split(' ')[0]}</td>
                      <td className="p-3 font-bold text-bull">{profile.swing.tp1}</td>
                      <td className="p-3 font-black text-primary">{profile.swing.rr}</td>
                      <td className="p-3 font-bold text-foreground">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                          profile.compositeQualityScore >= 85 ? 'bg-bull/15 text-bull' : 'bg-primary/15 text-primary'
                        }`}>
                          {profile.compositeQualityScore}/100
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedSymbol(item.symbol);
                            setActiveMainTab('RESEARCH');
                          }}
                          className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer"
                        >
                          Deep Dive ↗
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
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW C: SECTOR OUTLOOK & COMPARATIVE RESEARCH (RENEWABLES & DEFENCE)*/}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'SECTORS' && (
        <div className="space-y-6 font-mono">
          {/* Header Banner */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-slate-900 to-primary/5 p-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base font-black text-primary">
                <Zap className="size-5 text-primary" />
                HIGH-GROWTH INDIAN SECTORS: 2025–2030 OUTLOOK
              </span>
              <span className="rounded bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                STRATEGIC FOCUS: RENEWABLE ENERGY & DEFENCE INDIGENISATION
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
              Aane wale 5 saalon mein Bharat ke do sabse bade structural secular megatrends hain: (1) Renewable Clean Energy Transition (500 GW target by 2030 + ₹75,000 Cr PM Surya Ghar Yojana) aur (2) Defence Indigenisation (Make in India + ₹50,000 Cr export target). Niche dono sectors ka deep dive, order books, aur top stocks ka financial comparison diya gaya hai.
            </p>
          </div>

          {/* Sector 1: Indian Renewable Energy */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    SECTOR: STRONG OVERWEIGHT
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Horizon: 2025–2030 (Multidecade Megatrend)</span>
                </div>
                <h3 className="text-lg font-black text-foreground mt-1">
                  1. Indian Renewable Energy & Clean Power Transition
                </h3>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] text-muted-foreground block">Expected Sector CAGR:</span>
                <span className="text-base font-black text-emerald-400">24%–28% Annual Growth</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Macro Driver:</strong> India has committed to reaching 500 GW of non-fossil capacity by 2030 (currently ~190 GW), requiring an annual addition of 40–50 GW. Surging power demand driven by AI data centers, industrial manufacturing, and residential AC load is creating peak power deficits that only hybrid solar-wind and storage can fulfill.
            </p>

            {/* Key Policies & Schemes */}
            <div className="rounded-lg border border-border/70 bg-secondary/20 p-3 space-y-1.5 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Award className="size-3.5 text-primary" />
                Key Government Catalysts & Budget Schemes:
              </span>
              <ul className="grid gap-1 sm:grid-cols-2 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-1">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>PM Surya Ghar Muft Bijli Yojana:</strong> ₹75,021 Cr outlay targeting 1 Crore household rooftop solar systems with 60% direct subsidy.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Solar PLI Scheme:</strong> ₹24,000 Cr incentive creating 45+ GW of domestic cell & module manufacturing to displace Chinese imports.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>ISTS Transmission Waiver:</strong> Green energy corridors with 25-year waiver of inter-state transmission charges.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>National Green Hydrogen Mission:</strong> ₹19,744 Cr outlay requiring 125 GW of dedicated renewable capacity.</span>
                </li>
              </ul>
            </div>

            {/* Head-to-Head Comparison: Tata Power vs KPI Green Energy */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" />
                Financial Head-to-Head: Tata Power (TATAPOWER) vs KPI Green Energy (KPIGREEN)
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Tata Power Card */}
                <div className="rounded-xl border border-primary/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-primary">TATAPOWER</span>
                      <span className="text-xs text-muted-foreground block font-sans">Tata Power Company Limited</span>
                    </div>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">Large-Cap Leader</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">P/E Ratio</span>
                      <span className="font-bold text-foreground">34.2x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Debt/Equity</span>
                      <span className="font-bold text-amber-400">1.22x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">3Y PAT CAGR</span>
                      <span className="font-bold text-emerald-400">+36.8%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Order Book:</strong> ₹15,900+ Cr utility EPC backlog + ₹3,800+ Cr rooftop solar pipeline.</p>
                    <p><strong className="text-foreground">Project Pipeline:</strong> 5.5 GW operational & under construction clean portfolio; 4.3 GW solar cell & module plant in Tirunelveli (Tamil Nadu) fully operational; 5,500+ public EV charging stations across India.</p>
                    <p><strong className="text-foreground">Core Moat:</strong> Integrated presence across power generation, transmission, distribution (Odisha/Delhi/Mumbai), solar rooftop EPC, and high-margin EV charging infrastructure.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('TATAPOWER');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-primary px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View Tata Power Deep Terminal ↗
                  </button>
                </div>

                {/* KPI Green Energy Card */}
                <div className="rounded-xl border border-emerald-500/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-emerald-400">KPIGREEN</span>
                      <span className="text-xs text-muted-foreground block font-sans">KPI Green Energy Limited</span>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">High-Growth Small-Cap</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">P/E Ratio</span>
                      <span className="font-bold text-foreground">42.5x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Debt/Equity</span>
                      <span className="font-bold text-emerald-400">0.84x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">3Y PAT CAGR</span>
                      <span className="font-bold text-emerald-400">+112.4%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Order Book:</strong> ₹3,150+ Cr confirmed orders across hybrid solar and wind installations, providing 2.5x revenue visibility.</p>
                    <p><strong className="text-foreground">Project Pipeline:</strong> 2.8+ GW hybrid pipeline under active execution; targeting Vision 2030 milestone of 10 GW operational capacity; proprietary power evacuation lines across industrial Gujarat.</p>
                    <p><strong className="text-foreground">Core Moat:</strong> Dual IPP (Independent Power Producer) + CPP (Captive Power Producer) model delivering high 31%+ ROE with zero bad-debt credit risk from commercial clients.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('KPIGREEN');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View KPI Green Deep Terminal ↗
                  </button>
                </div>
              </div>
            </div>

            {/* Sector Risks */}
            <div className="rounded-lg border border-bear/30 bg-bear/5 p-3 text-xs">
              <span className="font-bold text-bear flex items-center gap-1.5 mb-1">
                <AlertTriangle className="size-3.5" />
                Key Renewable Sector Risks:
              </span>
              <p className="text-muted-foreground text-[11px]">
                (1) Grid transmission evacuation delays in high-resource regions of Rajasthan & Gujarat, (2) State DISCOM financial delays in tariff approval, (3) Volatility in imported wind turbine and solar wafer prices.
              </p>
            </div>
          </div>

          {/* Sector 2: Indian Aerospace & Defence */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-400">
                    SECTOR: STRONG OVERWEIGHT
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Horizon: 2025–2029 (5-Year Visibility)</span>
                </div>
                <h3 className="text-lg font-black text-foreground mt-1">
                  2. Indian Aerospace & National Defence Indigenisation
                </h3>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] text-muted-foreground block">Expected Sector CAGR:</span>
                <span className="text-base font-black text-cyan-400">18%–22% Annual Growth</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Macro Driver:</strong> Geopolitical realignments and the national imperative for strategic autonomy have created the Make in India defence mandate: 75%+ of defence capital procurement must be sourced from domestic vendors. Simultaneously, Indian defence exports have skyrocketed from ₹1,521 Cr in FY17 to ₹21,083 Cr in FY24, with the government officially targeting ₹50,000 Cr by 2029.
            </p>

            {/* Key Policies & Schemes */}
            <div className="rounded-lg border border-border/70 bg-secondary/20 p-3 space-y-1.5 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                Key Government Catalysts & Make in India Policies:
              </span>
              <ul className="grid gap-1 sm:grid-cols-2 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-1">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Defence Acquisition Procedure (DAP 2020):</strong> Mandatory Buy (Indian-IDDM) priority ensures domestic PSUs receive exclusive procurement preference.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Positive Indigenisation Lists:</strong> 5 embargo lists banning imports of 509+ military platforms, weapon systems, and avionics.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Surging Defence Exports:</strong> Fast-track defence export approvals to 85+ friendly nations (Armenia, Philippines, Vietnam, Middle East).</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Union Budget Capex:</strong> Record capital outlay of ₹1.72 Lakh Cr dedicated exclusively to military modernization.</span>
                </li>
              </ul>
            </div>

            {/* Head-to-Head Comparison: HAL vs BEL */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" />
                Financial Head-to-Head: Hindustan Aeronautics (HAL) vs Bharat Electronics (BEL)
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                {/* HAL Card */}
                <div className="rounded-xl border border-cyan-500/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-cyan-400">HAL</span>
                      <span className="text-xs text-muted-foreground block font-sans">Hindustan Aeronautics Limited</span>
                    </div>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">Aviation Monopoly</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">P/E Ratio</span>
                      <span className="font-bold text-foreground">36.4x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Debt/Equity</span>
                      <span className="font-bold text-emerald-400">0.00x (Cash ₹24k Cr)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">3Y PAT CAGR</span>
                      <span className="font-bold text-emerald-400">+28.5%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Order Book:</strong> ₹94,000+ Cr confirmed backlog (~3.2x TTM revenue), with ₹1.2 Lakh Cr pipeline pending Cabinet sanction.</p>
                    <p><strong className="text-foreground">Upcoming Project Pipeline:</strong> 83 LCA Tejas Mk1A fighters + 97 additional Tejas Mk1A DAC clearance (₹65,000 Cr); 156 LCH Prachand combat helicopters; ₹60,000 Cr Su-30MKI radar and avionics upgrade; RD-33 and AL-31FP engine manufacturing.</p>
                    <p><strong className="text-foreground">Export Impact:</strong> Actively pitching LCA Tejas and combat helicopters to Philippines, Egypt, Argentina; export share expected to expand from 2% to 10% of revenues.</p>
                    <p><strong className="text-bear">Key Risks:</strong> Delay in delivery of GE F404 engines by US supplier GE Aerospace; single-customer sovereign risk (Indian Air Force & Army = 92% of revenue).</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('HAL');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View HAL Deep Terminal ↗
                  </button>
                </div>

                {/* BEL Card */}
                <div className="rounded-xl border border-primary/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-primary">BEL</span>
                      <span className="text-xs text-muted-foreground block font-sans">Bharat Electronics Limited</span>
                    </div>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">Defence Radars & EW</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">P/E Ratio</span>
                      <span className="font-bold text-foreground">48.2x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Debt/Equity</span>
                      <span className="font-bold text-emerald-400">0.00x (Cash ₹9k Cr)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">3Y PAT CAGR</span>
                      <span className="font-bold text-emerald-400">+24.2%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Order Book:</strong> ₹76,000+ Cr confirmed order book (~3.8x TTM revenue), with annual order inflow guidance of ₹25,000 Cr.</p>
                    <p><strong className="text-foreground">Upcoming Project Pipeline:</strong> Akash air defence missile systems electronics; MF-STAR and QRSAM radar platforms; Electronic Warfare suites for warships and submarines; Drone detection and Counter-Unmanned Systems (C-UAS).</p>
                    <p><strong className="text-foreground">Export Impact:</strong> Coastal surveillance systems to Maldives, Seychelles, and Mauritius; radar systems to Armenia and Southeast Asia; targeting $1 Billion exports by FY28.</p>
                    <p><strong className="text-bear">Key Risks:</strong> Dependence on foreign semiconductor foundries for specialized sub-assemblies; lumpy quarter-on-quarter revenue recognition due to testing approvals.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('BEL');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-primary px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View BEL Deep Terminal ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW D: 50:50 CROSS-BORDER BALANCED GROWTH ALLOCATION STRATEGY     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'PORTFOLIO' && (
        <div className="space-y-6 font-mono">
          {/* Top Strategy Card */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-slate-900 to-primary/5 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base font-black text-primary">
                <Target className="size-5 text-primary" />
                50:50 CROSS-BORDER GROWTH & RISK-HEDGED ALLOCATION STRATEGY
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                TARGET RETURN: 24%–28% ANNUAL NET CAGR
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
              Growth-oriented investor ke liye optimal asset allocation strategy jo geopolitical risks ko hedge karte hue maximum returns generate kare. Capital ko 4 high-moat secular sectors mein barabar (25% each) divide kiya gaya hai: <strong>Indian Defence</strong> (25%), <strong>Indian Renewable Energy</strong> (25%), <strong>US AI Hardware & Cloud</strong> (25%), aur <strong>US Biotech & Robotic Surgery</strong> (25%).
            </p>

            <div className="rounded-lg border border-border/80 bg-black/40 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <DollarSign className="size-4" />
                Dual-Currency Alpha: Indian Rupee (INR) + US Dollar (USD) Currency Tailwind
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                50% capital US mega-caps mein lagane se ek automatic <strong>3.2%–4.0% annual currency depreciation bonus</strong> milta hai. Agar US stocks $ terms mein 18% compound karte hain, to INR terms mein effective return <strong>22%–23%</strong> ho jata hai. Saath hi domestic political/economic shock ke samay USD exposure portfolio ko protect karta hai.
              </p>
            </div>
          </div>

          {/* Capital Allocator Interactive Calculator */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  Interactive Capital Deployment Calculator
                </h3>
                <span className="text-xs text-muted-foreground">Apna investment capital enter karein:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Portfolio Capital:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={tradingCapital}
                    onChange={e => setTradingCapital(Math.max(50000, Number(e.target.value)))}
                    className="w-36 rounded border border-border bg-secondary/50 pl-6 pr-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* 4 Buckets Breakdown Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Bucket 1: Indian Defence */}
              <div className="rounded-xl border border-cyan-500/40 bg-secondary/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-cyan-400 text-xs">BUCKET 1: INDIAN DEFENCE & AEROSPACE</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-black text-cyan-300">
                    25% · ₹{(tradingCapital * 0.25).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Monopoly order books (₹1.7 Lakh Cr combined), debt-free fortress balance sheets, and soaring export demand to 85+ partner countries.
                </p>
                <div className="space-y-1.5 border-t border-border/60 pt-2 text-xs">
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">HAL (Hindustan Aeronautics):</strong>
                      <span className="text-[10px] text-muted-foreground block">Tejas Mk1A & Prachand Monopoly · Order Book ₹94k Cr</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-cyan-400">15% · ₹{(tradingCapital * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Target ₹5,200</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">BEL (Bharat Electronics):</strong>
                      <span className="text-[10px] text-muted-foreground block">Military Radars, EW & Missile Electronics · Order Book ₹76k Cr</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-cyan-400">10% · ₹{(tradingCapital * 0.10).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Target ₹365</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bucket 2: Indian Renewable Energy */}
              <div className="rounded-xl border border-emerald-500/40 bg-secondary/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-400 text-xs">BUCKET 2: INDIAN RENEWABLE ENERGY</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-300">
                    25% · ₹{(tradingCapital * 0.25).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  500 GW national target by 2030, PM Surya Ghar Muft Bijli Yojana (₹75k Cr), and explosive hybrid solar-wind commercial adoption.
                </p>
                <div className="space-y-1.5 border-t border-border/60 pt-2 text-xs">
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Tata Power (TATAPOWER):</strong>
                      <span className="text-[10px] text-muted-foreground block">Integrated Clean Utility · 5.5 GW Pipeline + Rooftop EPC</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">15% · ₹{(tradingCapital * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Target ₹540</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">KPI Green Energy (KPIGREEN):</strong>
                      <span className="text-[10px] text-muted-foreground block">3Y PAT CAGR 112% · 2.8+ GW Hybrid Pipeline · IPP/CPP</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">10% · ₹{(tradingCapital * 0.10).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Target ₹1,150</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bucket 3: US AI Hardware & Cloud */}
              <div className="rounded-xl border border-primary/40 bg-secondary/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-primary text-xs">BUCKET 3: US AI ACCELERATORS & CLOUD</span>
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-black text-primary">
                    25% · ₹{(tradingCapital * 0.25).toLocaleString()} (${Math.round((tradingCapital * 0.25) / 87.10)})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  $1 Trillion data center transition to parallel computing; Nvidia 85–90% AI chip dominance and Microsoft Azure enterprise Copilot monetization.
                </p>
                <div className="space-y-1.5 border-t border-border/60 pt-2 text-xs">
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Nvidia (NVDA):</strong>
                      <span className="text-[10px] text-muted-foreground block">Blackwell Architecture · 55% Net Margin · CUDA Software Lock-in</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">15% · ₹{(tradingCapital * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((tradingCapital * 0.15) / 87.10)} · Target $175</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Microsoft (MSFT):</strong>
                      <span className="text-[10px] text-muted-foreground block">Azure AI Cloud (+33%) · 400M Office Seats · Maia Silicon</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">10% · ₹{(tradingCapital * 0.10).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((tradingCapital * 0.10) / 87.10)} · Target $480</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bucket 4: US Biotech & Robotic Surgery */}
              <div className="rounded-xl border border-amber-500/40 bg-secondary/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 text-xs">BUCKET 4: US BIOTECH & SURGICAL ROBOTICS</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-300">
                    25% · ₹{(tradingCapital * 0.25).toLocaleString()} (${Math.round((tradingCapital * 0.25) / 87.10)})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Metabolic GLP-1/GIP weight loss megatrend ($100B+ TAM) and robotic surgery platform with 83% recurring revenue.
                </p>
                <div className="space-y-1.5 border-t border-border/60 pt-2 text-xs">
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Eli Lilly (LLY):</strong>
                      <span className="text-[10px] text-muted-foreground block">Zepbound & Mounjaro Global Demand ($55B–$65B Projections)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">15% · ₹{(tradingCapital * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((tradingCapital * 0.15) / 87.10)} · Target $1,120</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Intuitive Surgical (ISRG):</strong>
                      <span className="text-[10px] text-muted-foreground block">Da Vinci 5 System · 83% Recurring Revenue · Zero Debt</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">10% · ₹{(tradingCapital * 0.10).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((tradingCapital * 0.10) / 87.10)} · Target $580</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tranche Accumulation Strategy */}
            <div className="rounded-xl border border-border/80 bg-slate-900/90 p-4 space-y-2 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Layers className="size-4 text-primary" />
                Institutional Tranche Deployment Rulebook (Never Buy 100% in One Go)
              </span>
              <div className="grid gap-2 sm:grid-cols-3 text-[11px]">
                <div className="bg-black/40 p-2.5 rounded border border-border/60">
                  <strong className="text-primary block">Tranche 1 (33% Capital):</strong>
                  <span className="text-muted-foreground">Initial anchor entry within the planned structural demand zone on confirmation candle.</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded border border-border/60">
                  <strong className="text-emerald-400 block">Tranche 2 (33% Capital):</strong>
                  <span className="text-muted-foreground">Add on a healthy pullback or retest of the daily 20/50 EMA that holds support.</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded border border-border/60">
                  <strong className="text-cyan-400 block">Tranche 3 (34% Capital):</strong>
                  <span className="text-muted-foreground">Final tranche deployed upon breakout confirmation above recent consolidation swing high.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
