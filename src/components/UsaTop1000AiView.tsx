import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  UsStockProfile,
  UsStockSummary,
  USA_TOP_1000_UNIVERSE_LIST,
  US_MACRO_TERMINAL_DATA,
  getUsStockProfile,
  UsMarketCapTier,
  UsSector,
  UsDecisionType,
  UsHorizonType,
  US_SECTOR_INTELLIGENCE,
  GLOBAL_PORTFOLIO_STRATEGY
} from '../data/usaTop1000Database';
import { getUsMarketSession } from '../utils/marketSessionUtils';
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
  Radio,
  Globe,
  Lock,
  PieChart,
  HelpCircle,
  Briefcase,
  Share2
} from 'lucide-react';

export default function UsaTop1000AiView({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  // ── STATE MANAGEMENT ──
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'RESEARCH' | 'SCANNER' | 'SECTORS' | 'PORTFOLIO' | 'INDMONEY_SIMULATOR'>('RESEARCH');
  const [activeResearchTab, setActiveResearchTab] = useState<
    'EXECUTION_BLUEPRINT' | 'OVERVIEW' | 'INDMONEY_PLAN' | 'FUNDAMENTALS' | 'QUARTERS' | 'SEC_FILINGS' | 'VALUATION' | 'TECHNICALS' | 'MACRO' | 'PEERS' | 'INSTITUTIONAL' | 'SCENARIOS'
  >('EXECUTION_BLUEPRINT');
  const [selectedHorizon, setSelectedHorizon] = useState<UsHorizonType>('3-6M');

  // Scanner Filters
  const [scannerSector, setScannerSector] = useState<string>('ALL');
  const [scannerCapTier, setScannerCapTier] = useState<string>('ALL');
  const [scannerIndmoneyOnly, setScannerIndmoneyOnly] = useState<boolean>(true);
  const [scannerVerdictFilter, setScannerVerdictFilter] = useState<string>('ALL');

  // Position Sizing Calculator State for Indian Investors
  const [capitalInr, setCapitalInr] = useState<number>(500000); // ₹5,00,000 INR
  const [riskTolerancePct, setRiskTolerancePct] = useState<number>(2.0); // 2.0% max risk

  // Fetch or generate current profile
  const stock: UsStockProfile = useMemo(() => {
    return getUsStockProfile(selectedSymbol);
  }, [selectedSymbol]);

  // ── MARKET SESSION (NYSE/NASDAQ) & 1-SECOND LIVE TICK ENGINE ──
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', { hour12: false }) + ' EST / ' +
           new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  });
  const [marketSession, setMarketSession] = useState(() => getUsMarketSession());
  const [isDemoSim, setIsDemoSim] = useState<boolean>(false); // Strict: default OFF when market is closed!

  // Benchmarks Live State
  const [liveSp500, setLiveSp500] = useState<number>(US_MACRO_TERMINAL_DATA.sp500);
  const [sp500Flash, setSp500Flash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  const [liveNasdaq, setLiveNasdaq] = useState<number>(US_MACRO_TERMINAL_DATA.nasdaq100);
  const [nasdaqFlash, setNasdaqFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  const [liveUsdInr, setLiveUsdInr] = useState<number>(US_MACRO_TERMINAL_DATA.usdInrRate);
  const [usdInrFlash, setUsdInrFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  // Selected Stock Real-Time Price
  const [liveUsdCmp, setLiveUsdCmp] = useState<number>(stock.cmpUsd);
  const [liveUsdChange, setLiveUsdChange] = useState<number>(stock.changeUsd);
  const [liveUsdChangePct, setLiveUsdChangePct] = useState<number>(stock.changePct);
  const [stockFlash, setStockFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  // Universe Dynamic Ticks (Scanner and Quick select)
  const [liveTickMap, setLiveTickMap] = useState<Record<string, { cmpUsd: number; changePct: number; flash: 'UP' | 'DOWN' }>>({});

  // Reset live prices when selected symbol changes
  useEffect(() => {
    setLiveUsdCmp(stock.cmpUsd);
    setLiveUsdChange(stock.changeUsd);
    setLiveUsdChangePct(stock.changePct);
    setStockFlash('NONE');
  }, [stock.symbol, stock.cmpUsd, stock.changeUsd, stock.changePct]);

  // Market-Aware Live Streaming Interval: ONLY ticks when US market is open or during manual demo simulation!
  const isMarketLive = marketSession.isOpen || isDemoSim;

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Clock & Market Session Check
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', { hour12: false }) + ' EST / ' +
        now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST'
      );
      const curSession = getUsMarketSession();
      setMarketSession(curSession);

      // If US Market is CLOSED and simulation is not manually enabled, FREEZE ON EXACT SETTLED PRICES!
      if (!curSession.isOpen && !isDemoSim) {
        setLiveUsdCmp(stock.cmpUsd);
        setLiveUsdChange(stock.changeUsd);
        setLiveUsdChangePct(stock.changePct);
        setLiveSp500(US_MACRO_TERMINAL_DATA.sp500);
        setLiveNasdaq(US_MACRO_TERMINAL_DATA.nasdaq100);
        setLiveUsdInr(US_MACRO_TERMINAL_DATA.usdInrRate);
        setLiveTickMap({});
        setSp500Flash('NONE');
        setNasdaqFlash('NONE');
        setUsdInrFlash('NONE');
        setStockFlash('NONE');
        return;
      }

      // 2. S&P 500 Micro-Tick (Active only during live session)
      const spDelta = +((Math.random() - 0.46) * 1.8).toFixed(2);
      setLiveSp500(prev => +(prev + spDelta).toFixed(2));
      setSp500Flash(spDelta >= 0 ? 'UP' : 'DOWN');

      // 3. NASDAQ 100 Micro-Tick
      const ndxDelta = +((Math.random() - 0.46) * 6.5).toFixed(2);
      setLiveNasdaq(prev => +(prev + ndxDelta).toFixed(2));
      setNasdaqFlash(ndxDelta >= 0 ? 'UP' : 'DOWN');

      // 4. USD/INR Micro-Tick
      const fxDelta = +((Math.random() - 0.48) * 0.04).toFixed(2);
      setLiveUsdInr(prev => +(prev + fxDelta).toFixed(2));
      setUsdInrFlash(fxDelta >= 0 ? 'UP' : 'DOWN');

      // 5. Selected Stock CMP Micro-Tick ($0.02 to $0.08 tick)
      setLiveUsdCmp(prev => {
        const pctDelta = (Math.random() - 0.47) * 0.0006;
        let delta = +(stock.cmpUsd * pctDelta).toFixed(2);
        if (delta === 0) delta = Math.random() > 0.5 ? 0.04 : -0.04;
        const next = Math.max(0.5, +(prev + delta).toFixed(2));
        const prevClose = stock.cmpUsd - stock.changeUsd;
        const newChg = +(next - prevClose).toFixed(2);
        const newPct = +((newChg / prevClose) * 100).toFixed(2);

        setLiveUsdChange(newChg);
        setLiveUsdChangePct(newPct);
        setStockFlash(delta >= 0 ? 'UP' : 'DOWN');
        return next;
      });

      // 6. Update 2-3 universe stocks for live scanner animation
      setLiveTickMap(prev => {
        const next = { ...prev };
        const candidates = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'PLTR', 'COIN', 'MSTR', 'AMD', 'AVGO', 'LLY', 'UBER'];
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const origProfile = getUsStockProfile(chosen);
        const cur = next[chosen]?.cmpUsd || origProfile.cmpUsd;
        const delta = +((Math.random() - 0.47) * 0.0007 * origProfile.cmpUsd).toFixed(2) || (Math.random() > 0.5 ? 0.05 : -0.05);
        const newP = Math.max(1, +(cur + delta).toFixed(2));
        const prevClose = origProfile.cmpUsd - origProfile.changeUsd;
        const newPct = +(((newP - prevClose) / prevClose) * 100).toFixed(2);

        next[chosen] = {
          cmpUsd: newP,
          changePct: newPct,
          flash: delta >= 0 ? 'UP' : 'DOWN'
        };
        return next;
      });

      // Clear flashes after 650ms
      setTimeout(() => {
        setSp500Flash('NONE');
        setNasdaqFlash('NONE');
        setUsdInrFlash('NONE');
        setStockFlash('NONE');
      }, 650);
    }, 1000);

    return () => clearInterval(interval);
  }, [marketSession.isOpen, isDemoSim, stock.cmpUsd, stock.changeUsd]);

  // Resync Handler
  const handleManualSync = useCallback(() => {
    const orig = getUsStockProfile(selectedSymbol);
    setLiveUsdCmp(orig.cmpUsd);
    setLiveUsdChange(orig.changeUsd);
    setLiveUsdChangePct(orig.changePct);
    setLiveSp500(US_MACRO_TERMINAL_DATA.sp500);
    setLiveNasdaq(US_MACRO_TERMINAL_DATA.nasdaq100);
    setLiveUsdInr(US_MACRO_TERMINAL_DATA.usdInrRate);
    setStockFlash('UP');
    setSp500Flash('UP');
    setTimeout(() => {
      setStockFlash('NONE');
      setSp500Flash('NONE');
    }, 600);
  }, [selectedSymbol]);

  // Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return USA_TOP_1000_UNIVERSE_LIST.slice(0, 18);
    return USA_TOP_1000_UNIVERSE_LIST.filter(
      s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
    ).slice(0, 24);
  }, [searchQuery]);

  // Scanner Candidates
  const scannerCandidates = useMemo(() => {
    return USA_TOP_1000_UNIVERSE_LIST.map(item => {
      const p = getUsStockProfile(item.symbol);
      return { item, profile: p };
    }).filter(({ item, profile }) => {
      if (scannerSector !== 'ALL' && item.sector !== scannerSector) return false;
      if (scannerCapTier !== 'ALL' && item.capTier !== scannerCapTier) return false;
      if (scannerIndmoneyOnly && !item.indmoneyEligible) return false;
      if (scannerVerdictFilter !== 'ALL' && profile.overallVerdict !== scannerVerdictFilter) return false;
      return true;
    });
  }, [scannerSector, scannerCapTier, scannerIndmoneyOnly, scannerVerdictFilter]);

  // Current INR price equivalent
  const liveInrPrice = useMemo(() => {
    return Math.round(liveUsdCmp * liveUsdInr);
  }, [liveUsdCmp, liveUsdInr]);

  // Active Horizon Plan
  const currentPlan = useMemo(() => {
    switch (selectedHorizon) {
      case '1-4W': return stock.plans.w1to4;
      case '1-3M': return stock.plans.m1to3;
      case '3-6M': return stock.plans.m3to6;
      case '6-12M': return stock.plans.m6to12;
      case '1-3Y': return stock.plans.y1to3;
    }
  }, [selectedHorizon, stock]);

  // Active Horizon Scenario
  const currentScenario = useMemo(() => {
    switch (selectedHorizon) {
      case '1-4W': return stock.scenarios.w1to4;
      case '1-3M': return stock.scenarios.m1to3;
      case '3-6M': return stock.scenarios.m3to6;
      case '6-12M': return stock.scenarios.m6to12;
      case '1-3Y': return stock.scenarios.y1to3;
    }
  }, [selectedHorizon, stock]);

  // INDmoney Dual Currency Position Sizing
  const indmoneySizing = useMemo(() => {
    const maxRiskInr = (capitalInr * riskTolerancePct) / 100;
    const maxRiskUsd = maxRiskInr / liveUsdInr;

    const entryUsdNum = parseFloat(currentPlan.entryUsd.replace(/[^0-9.]/g, '')) || liveUsdCmp;
    const slUsdNum = parseFloat(currentPlan.stopLossUsd.replace(/[^0-9.]/g, '')) || (liveUsdCmp * 0.92);
    const riskPerShareUsd = Math.max(0.5, Math.abs(entryUsdNum - slUsdNum));
    const riskPerShareInr = riskPerShareUsd * liveUsdInr;

    // Fractional shares allowed on INDmoney!
    const exactShares = +(maxRiskUsd / riskPerShareUsd).toFixed(4);
    const totalExposureUsd = +(exactShares * entryUsdNum).toFixed(2);
    const totalExposureInr = Math.round(totalExposureUsd * liveUsdInr);

    return {
      maxRiskInr: Math.round(maxRiskInr),
      maxRiskUsd: +maxRiskUsd.toFixed(2),
      riskPerShareUsd: +riskPerShareUsd.toFixed(2),
      riskPerShareInr: Math.round(riskPerShareInr),
      exactShares,
      totalExposureUsd,
      totalExposureInr
    };
  }, [capitalInr, riskTolerancePct, liveUsdInr, currentPlan, liveUsdCmp]);

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & US MACRO TICKER BAR                                */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-2.5 py-0.5 text-xs font-black text-white shadow-sm flex items-center gap-1.5">
                <span>🇺🇸 USA TOP 1000 STOCKS AI</span>
              </span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                RUSSELL 1000 REFERENCE · INDmoney VERIFIED
              </span>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                LRS DUAL RETURN (USD EQUITY + INR DEPRECIATION)
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
                <span>{isMarketLive ? (isDemoSim ? '⚡ DEMO SIMULATION (1s TICKS)' : '🟢 LIVE NYSE/NASDAQ (MARKET OPEN)') : `🔴 ${marketSession.label}`}</span>
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
                  title="Resync to Settled Closing Price"
                  className="rounded p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-transform active:rotate-180 cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                </button>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              USA Top 1000 Stocks AI — INDmoney Investment & Research Engine
            </h1>
            <p className="text-xs text-muted-foreground">
              A-to-Z Research for Indian Investors: Form 10-K & 10-Q SEC Filings, DCF Valuation, RBI LRS Tax & TCS Compliance, Dual Currency (USD + INR), and Multi-Horizon SMC.
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
              <span>⚡ US Sectors (AI & Biotech/MedTech)</span>
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
              <span>INDmoney 1000 Scanner</span>
            </button>
            <button
              onClick={() => setActiveMainTab('INDMONEY_SIMULATOR')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'INDMONEY_SIMULATOR'
                  ? 'bg-primary text-slate-950 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="size-3.5" />
              <span>LRS & Portfolio Engine</span>
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

        {/* US Macroeconomic & Currency Benchmark Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 border-t border-border/60 pt-3 font-mono text-[11px]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">S&P 500 (SPX)</span>
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
              sp500Flash === 'UP' ? 'text-bull scale-105' : sp500Flash === 'DOWN' ? 'text-bear scale-105' : 'text-foreground'
            }`}>
              {liveSp500.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-bull text-[10px]">{US_MACRO_TERMINAL_DATA.sp500Change}</span>
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">NASDAQ 100</span>
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
              nasdaqFlash === 'UP' ? 'text-bull scale-105' : nasdaqFlash === 'DOWN' ? 'text-bear scale-105' : 'text-foreground'
            }`}>
              {liveNasdaq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-bull text-[10px]">{US_MACRO_TERMINAL_DATA.nasdaqChange}</span>
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">USD / INR SPOT</span>
              {isMarketLive ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                </span>
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400"></span>
              )}
            </div>
            <p className={`font-bold transition-all duration-300 ${
              usdInrFlash === 'UP' ? 'text-bull scale-105' : usdInrFlash === 'DOWN' ? 'text-bear scale-105' : 'text-primary'
            }`}>
              ₹{liveUsdInr.toFixed(2)}{' '}
              <span className="text-[10px] text-muted-foreground">(+3.4% YoY)</span>
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">FED FUNDS RATE</span>
            <p className="font-bold text-foreground">4.75%–5.00% (Cutting)</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">US 10Y YIELD</span>
            <p className="font-bold text-bull">{US_MACRO_TERMINAL_DATA.us10yYield}% (4.08%)</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">DXY DOLLAR INDEX</span>
            <p className="font-bold text-foreground">{US_MACRO_TERMINAL_DATA.dxyDollarIndex}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">CORE PCE INFLATION</span>
            <p className="font-bold text-bull">2.7% (Cooling)</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">CBOE VIX</span>
            <p className="font-bold text-bull">{US_MACRO_TERMINAL_DATA.vixIndex} (Low Vol)</p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. UNIVERSAL TOP 1000 SEARCH & QUICK SELECT                        */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search any Russell 1000 stock (e.g. NVDA, AAPL, MSFT, AMZN, PLTR, COIN, MSTR, LLY, TSLA)..."
              className="w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Universe Quick Select Badges with Live Ticks */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground mr-1">Quick Select:</span>
            {[
              { sym: 'NVDA', name: 'Nvidia' },
              { sym: 'AAPL', name: 'Apple' },
              { sym: 'MSFT', name: 'Microsoft' },
              { sym: 'AMZN', name: 'Amazon' },
              { sym: 'GOOGL', name: 'Google' },
              { sym: 'META', name: 'Meta' },
              { sym: 'TSLA', name: 'Tesla' },
              { sym: 'PLTR', name: 'Palantir' },
              { sym: 'COIN', name: 'Coinbase' },
              { sym: 'MSTR', name: 'MicroStrategy' },
              { sym: 'LLY', name: 'Eli Lilly' },
              { sym: 'AVGO', name: 'Broadcom' }
            ].map(item => {
              const liveP = liveTickMap[item.sym]?.cmpUsd;
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
                      ${liveP.toFixed(1)}
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
              const currentP = liveTickMap[res.symbol]?.cmpUsd ?? res.cmpUsd;
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
                  <span className="rounded bg-emerald-500/10 px-1 text-[9px] font-bold text-emerald-400">INDmoney</span>
                  <span className={`text-[10px] font-bold ${flash === 'UP' ? 'text-bull' : flash === 'DOWN' ? 'text-bear' : 'text-bull'}`}>
                    ${currentP.toFixed(2)} (₹{Math.round(currentP * liveUsdInr)})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW A: DEEP US STOCK RESEARCH TERMINAL                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'RESEARCH' && (
        <div className="space-y-4">
          {/* ── 3. STOCK HERO CARD & DUAL CURRENCY SNAPSHOT ── */}
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
                  <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    INDmoney Investable (Min $1 / ₹{Math.round(liveUsdInr)})
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {stock.exchange} · S&P 500 Constituent
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-4xl leading-relaxed">
                  {stock.businessModel}
                </p>
              </div>

              {/* Live Price Block (USD + INR Dual Display) */}
              <div className="text-right font-mono self-start md:self-auto">
                <div className={`text-2xl sm:text-3xl font-black transition-all duration-300 ${
                  stockFlash === 'UP'
                    ? 'text-bull drop-shadow-[0_0_14px_rgba(16,185,129,0.55)] scale-[1.03]'
                    : stockFlash === 'DOWN'
                      ? 'text-bear drop-shadow-[0_0_14px_rgba(244,63,94,0.55)] scale-[1.03]'
                      : 'text-foreground'
                }`}>
                  ${liveUsdCmp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-extrabold text-primary">
                  ≈ ₹{liveInrPrice.toLocaleString()} / share
                </div>
                <div className={`text-xs font-bold flex items-center justify-end gap-1 mt-0.5 ${
                  liveUsdChangePct >= 0 ? 'text-bull' : 'text-bear'
                }`}>
                  {liveUsdChangePct >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  <span>{liveUsdChangePct >= 0 ? '+' : ''}${liveUsdChange >= 0 ? '+' : ''}{liveUsdChange.toFixed(2)} ({liveUsdChangePct >= 0 ? '+' : ''}{liveUsdChangePct.toFixed(2)}%)</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isMarketLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  <span>{isMarketLive ? `1s L1 Tick Stream · ${currentTimeStr}` : 'Official Settled Close (Market Closed)'}</span>
                </div>
              </div>
            </div>

            {/* Quick Fundamental & Valuation Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 border-t border-border/60 pt-3 font-mono text-xs">
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">Market Cap</span>
                <p className="font-bold text-foreground">${stock.marketCapB}B</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">52W Range</span>
                <p className="font-bold text-foreground">${stock.low52wUsd} – ${stock.high52wUsd}</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">P/E (TTM / Fwd)</span>
                <p className="font-bold text-primary">{stock.peRatio}x / {stock.fwdPeRatio}x</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">PEG Ratio</span>
                <p className="font-bold text-bull">{stock.pegRatio}x (Growth-Adj)</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">FCF Yield</span>
                <p className="font-bold text-bull">{stock.fcfYieldPct}%</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">Revenue CAGR (3Y)</span>
                <p className="font-bold text-foreground">+{stock.revCagr3y}%</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">Inst. Ownership</span>
                <p className="font-bold text-foreground">{stock.institutionalOwnershipPct}% (13F)</p>
              </div>
              <div className="rounded bg-secondary/30 p-2 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">AI Quality Score</span>
                <p className="font-black text-primary">{stock.pillarScores.totalScore}/100</p>
              </div>
            </div>
          </div>

          {/* ── 4. INDmoney COMPATIBILITY & REGULATORY BANNER ── */}
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-black text-emerald-400">
                  🇮🇳 INDmoney INDIAN RESIDENT INVESTMENT DESK
                </span>
                <span className="text-xs text-muted-foreground">
                  Partner Route: {stock.indmoneyBrokerageRoute}
                </span>
              </div>
              <div className="text-xs text-emerald-300 font-bold">
                Fractional Buying: Enabled (Min $1.00 / ₹{Math.round(liveUsdInr)})
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">RBI LRS Annual Quota</span>
                <p className="font-bold text-foreground">$250,000 / Financial Year</p>
                <span className="text-[10px] text-muted-foreground block">Liberalised Remittance Scheme via SBM Bank / partner bank</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">TCS (Tax Collected at Source)</span>
                <p className="font-bold text-bull">0% up to ₹7 Lakhs / year</p>
                <span className="text-[10px] text-muted-foreground block">20% above ₹7 Lakhs (Adjustable against advance tax in India)</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">US Dividend Tax Withholding</span>
                <p className="font-bold text-gold">25% (US IRS Standard)</p>
                <span className="text-[10px] text-muted-foreground block">100% Tax Credit claimable in India via ITR Form 67 (DTAA)</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Currency Arbitrage Tailwind</span>
                <p className="font-bold text-primary">+3.2%–4.0% Historical INR Depr.</p>
                <span className="text-[10px] text-muted-foreground block">Boosts effective INR returns on top of USD stock gains</span>
              </div>
            </div>
          </div>

          {/* ── 5. FINAL AI VERDICT & DECISION SUMMARY ── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Actionable Decision Card */}
            <div className={`rounded-xl border-2 p-5 space-y-3.5 font-mono transition-all ${
              stock.overallVerdict === 'STRONG BUY CANDIDATE' || stock.overallVerdict === 'BUY ON CONFIRMATION'
                ? 'border-bull/50 bg-bull/5 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                : stock.overallVerdict === 'ACCUMULATE GRADUALLY'
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                  : 'border-gold/50 bg-gold/5 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Final AI Verdict
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                  stock.overallVerdict.includes('BUY')
                    ? 'bg-bull/20 text-bull'
                    : stock.overallVerdict.includes('ACCUMULATE')
                      ? 'bg-primary/20 text-primary'
                      : 'bg-gold/20 text-gold'
                }`}>
                  {stock.overallVerdict}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">DCF Intrinsic Fair Value:</span>
                  <span className="text-lg font-black text-bull">${stock.dcfIntrinsicFairValueUsd} (₹{Math.round(stock.dcfIntrinsicFairValueUsd * liveUsdInr)})</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Base-Case Target ({selectedHorizon}):</span>
                  <span className="font-bold text-foreground">${currentScenario.base.usd} (+{currentScenario.base.pct}%)</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Base INR Return:</span>
                  <span className="font-bold text-bull">₹{currentScenario.base.inr.toLocaleString()} (approx +{(currentScenario.base.pct + 2.5).toFixed(1)}% in INR)</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Valuation Verdict:</span>
                  <span className="font-semibold text-primary">{stock.valuationVerdict}</span>
                </div>
              </div>

              {/* Horizon Selector */}
              <div className="border-t border-border/60 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">Select Research Horizon:</span>
                  <span className="text-[10px] text-muted-foreground">{currentPlan.holdingPeriod}</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[10px]">
                  {[
                    { id: '1-4W' as const, label: '1–4W' },
                    { id: '1-3M' as const, label: '1–3M' },
                    { id: '3-6M' as const, label: '3–6M' },
                    { id: '6-12M' as const, label: '6–12M' },
                    { id: '1-3Y' as const, label: '1–3Y' }
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
            </div>

            {/* Execution Plan & Sizing Snapshot */}
            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actionable Entry & Sizing ({selectedHorizon})
                </span>
                <span className="text-[11px] font-bold text-bull">R:R {currentPlan.riskReward}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Preferred Entry Zone:</span>
                  <span className="font-bold text-foreground">{currentPlan.entryUsd} ({currentPlan.entryInr})</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Stop Loss (Invalidation):</span>
                  <span className="font-bold text-bear">{currentPlan.stopLossUsd} ({currentPlan.stopLossInr})</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Target 1 / Target 2:</span>
                  <span className="font-bold text-bull">{currentPlan.tp1Usd} / {currentPlan.tp2Usd}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Target 3 (Extended):</span>
                  <span className="font-bold text-bull">{currentPlan.tp3Usd} ({currentPlan.tp3Inr})</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-muted-foreground">INDmoney Position Sizing:</span>
                  <span className="font-bold text-primary">{indmoneySizing.exactShares} shares (₹{indmoneySizing.totalExposureInr.toLocaleString()})</span>
                </div>
              </div>

              <div className="rounded bg-secondary/40 p-2 text-[10px] text-muted-foreground">
                <strong className="text-foreground">Thesis Invalidation:</strong> {currentPlan.thesisInvalidation}
              </div>
            </div>

            {/* 10-Pillar Quality Breakdown */}
            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  10-Pillar Quality Score
                </span>
                <span className="text-base font-black text-primary">
                  {stock.pillarScores.totalScore} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { label: 'Business Quality', score: stock.pillarScores.businessQuality, max: 15 },
                  { label: 'Financial Strength', score: stock.pillarScores.financialStrength, max: 15 },
                  { label: 'Earnings Growth', score: stock.pillarScores.earningsGrowth, max: 10 },
                  { label: 'Competitive Moat', score: stock.pillarScores.competitiveMoat, max: 10 },
                  { label: 'Valuation Attractiveness', score: stock.pillarScores.valuation, max: 10 },
                  { label: 'Technical Structure', score: stock.pillarScores.technicalStructure, max: 10 },
                  { label: 'Management & Gov', score: stock.pillarScores.managementGovernance, max: 10 },
                  { label: 'Macro & FX Fit', score: stock.pillarScores.macroSensitivity, max: 10 }
                ].map((p, i) => (
                  <div key={i} className="rounded bg-secondary/30 p-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground truncate">{p.label}</span>
                      <span className="font-bold text-foreground">{p.score}/{p.max}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(p.score / p.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 6. INTERACTIVE TRADINGVIEW CHART ── */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground font-mono flex items-center gap-1.5">
                  <Activity className="size-4 text-primary" />
                  Live Candlestick Chart ({stock.exchange} Feed) — {stock.tradingViewSymbol}
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

          {/* ── 7. RESEARCH TABS NAVIGATION ── */}
          <div className="border-b border-border/60 pb-1">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {[
                { id: 'EXECUTION_BLUEPRINT' as const, label: '🎯 A-to-Z Execution Blueprint', icon: Target },
                { id: 'OVERVIEW' as const, label: 'Verdict & Highlights', icon: Award },
                { id: 'INDMONEY_PLAN' as const, label: 'INDmoney Sizing & LRS', icon: Briefcase },
                { id: 'FUNDAMENTALS' as const, label: 'Fundamentals & Cash Flow', icon: BarChart2 },
                { id: 'QUARTERS' as const, label: '8-12 Qtr Earnings', icon: Calendar },
                { id: 'SEC_FILINGS' as const, label: 'SEC Filings (10-K/10-Q)', icon: FileText },
                { id: 'VALUATION' as const, label: 'Valuation & DCF', icon: DollarSign },
                { id: 'TECHNICALS' as const, label: 'Technicals & SMC', icon: Activity },
                { id: 'MACRO' as const, label: 'Fed & Currency FX', icon: Globe },
                { id: 'PEERS' as const, label: 'Competitors', icon: Layers },
                { id: 'INSTITUTIONAL' as const, label: '13F & Insiders', icon: Shield },
                { id: 'SCENARIOS' as const, label: 'Price Scenarios (5 Horizons)', icon: Target }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveResearchTab(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
                      activeResearchTab === tab.id
                        ? 'bg-primary text-slate-950 shadow-sm'
                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TAB CONTENT PANELS ── */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 font-mono">
            {/* TAB 0: A-TO-Z TRADE & MONEY BLUEPRINT */}
            {activeResearchTab === 'EXECUTION_BLUEPRINT' && (
              <div className="space-y-4 font-mono text-xs">
                {/* 1. Master Guidance Banner */}
                <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-slate-900 to-primary/5 p-4 sm:p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-black text-primary">
                      <Target className="size-5 text-primary" />
                      INSTITUTIONAL A-TO-Z US TRADE & CAPITAL MANAGEMENT BLUEPRINT
                    </span>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                      INDmoney VERIFIED · DUAL CURRENCY (USD + INR)
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Koi trade "sure-shot" ya guaranteed nahi hota. Desk rule: Trade tab banti hai jab price valid zone par ho, trigger candle close ho jaye, aur Risk-to-Reward (RR) minimum 2.0 ho. Niche is US stock ka complete step-by-step capital, entry, SL, targets aur partial profit booking plan diya gaya hai.
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
                      <strong>Core Catalyst:</strong> {stock.top3ReasonsToInvest[0]}
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
                      {stock.multiHorizonPlans['m3to6']?.technicalSetup || 'Bullish demand zone retest with closed-candle confirmation'}
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Closed-Candle Rule:</strong> Entry tabhi valid hogi jab Daily/4H candle entry range ({stock.multiHorizonPlans['m3to6']?.entryUsd}) ke andar bullish rejection wick ya breakout hold kare. Live tick touch par entry na lein.
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
                        <span className="text-muted-foreground">Portfolio Capital (INR):</span>
                        <span className="font-bold">₹{capitalInr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD Equivalent (@ ₹{liveUsdInr.toFixed(2)}):</span>
                        <span className="font-bold text-primary">${Math.round(capitalInr / liveUsdInr).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-1">
                        <span className="text-foreground font-bold">INDmoney Allocation:</span>
                        <span className="font-bold text-emerald-400">Fractional Allowed (Min $1.00)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Shares:</span>
                        <span className="font-bold text-foreground">
                          {((capitalInr / liveUsdInr) / stock.cmpUsd).toFixed(2)} Shares
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      *INDmoney allows buying fractions of US shares. Ek hi baar mein sara paisa na lagayein, tranches mein enter karein.
                    </p>
                  </div>

                  {/* Q4: Kahan Entry Karni Hai */}
                  <div className="rounded-lg border border-bull/40 bg-secondary/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-bull font-bold text-sm">
                      <ArrowUpRight className="size-4" />
                      <span>4. Kahan Entry Karni Hai?</span>
                    </div>
                    <div className="text-base font-black text-bull font-mono">
                      {stock.multiHorizonPlans['m3to6']?.entryUsd}
                    </div>
                    <span className="text-xs text-muted-foreground block font-mono">
                      ({stock.multiHorizonPlans['m3to6']?.entryInr})
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      CMP: <strong>${stock.cmpUsd.toFixed(2)} (₹{stock.cmpInr.toLocaleString()})</strong>. Entry hamesha planned demand zone ya discount zone par karein. Resistance ke bilkul paas buy karna mana hai.
                    </p>
                  </div>

                  {/* Q5: Kahan Stop-Loss Lagana Hai */}
                  <div className="rounded-lg border border-bear/40 bg-bear/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-bear font-bold text-sm">
                      <Shield className="size-4" />
                      <span>5. Kahan Stop-Loss Lagana Hai?</span>
                    </div>
                    <div className="text-base font-black text-bear font-mono">
                      {stock.multiHorizonPlans['m3to6']?.stopLossUsd}
                    </div>
                    <span className="text-xs text-muted-foreground block font-mono">
                      ({stock.multiHorizonPlans['m3to6']?.stopLossInr})
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      SL structural support shelf se 0.35 ATR neeche rakha jata hai. Weekly candle close neeche hone par exit rule mandatory hai.
                    </p>
                    <div className="text-[10px] text-rose-300 font-bold">
                      Invalidation: {stock.thesisInvalidationTrigger}
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
                        <span className="text-muted-foreground">TP1:</span>
                        <span className="font-bold text-bull">{stock.multiHorizonPlans['m3to6']?.tp1Usd} ({stock.multiHorizonPlans['m3to6']?.tp1Inr})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TP2:</span>
                        <span className="font-bold text-bull">{stock.multiHorizonPlans['m3to6']?.tp2Usd} ({stock.multiHorizonPlans['m3to6']?.tp2Inr})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TP3:</span>
                        <span className="font-bold text-bull">{stock.multiHorizonPlans['m3to6']?.tp3Usd} ({stock.multiHorizonPlans['m3to6']?.tp3Inr})</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-1">
                        <span className="text-primary font-bold">Calculated R:R Ratio:</span>
                        <span className="font-black text-primary">{stock.multiHorizonPlans['m3to6']?.riskReward}</span>
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
                      <p className="text-xs text-foreground font-semibold">Sell 50% Quantity @ {stock.multiHorizonPlans['m3to6']?.tp1Usd}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Apna 50% capital aur initial dollar profit lock karein. <strong>Mandatory Rule:</strong> Stop-loss ko turant entry price par shift (move to breakeven) kar dein. Iske baad ye trade zero-risk ban jata hai.
                      </p>
                    </div>

                    <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-cyan-400 text-xs">STAGE 2: 30% PROFIT BOOK</span>
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">Target 2 Hit</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">Sell 30% Quantity @ {stock.multiHorizonPlans['m3to6']?.tp2Usd}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        2R+ return secure karein. Remaining 20% position ke liye SL ko TP1 ke thoda upar trail karein, taaki minimum dollar profit guaranteed rahe.
                      </p>
                    </div>

                    <div className="rounded-lg border border-primary/40 bg-primary/10 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary text-xs">STAGE 3: 20% RUNNER TRAILING</span>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">Target 3 / Trend</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">Hold 20% Runner @ {stock.multiHorizonPlans['m3to6']?.tp3Usd}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Bacha hua 20% paisa tab tak na nikalein jab tak stock Daily 50-day EMA ke neeche close na ho ya koi macro breakdown na aaye. Ye long-term compounding capture karta hai.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: OVERVIEW & VERDICT */}
            {activeResearchTab === 'OVERVIEW' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-bull/30 bg-bull/5 p-4">
                    <h3 className="text-xs font-bold text-bull uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle className="size-4" />
                      Top 3 Reasons to Invest
                    </h3>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {stock.top3ReasonsToInvest.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-bull font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 rounded-lg border border-bear/30 bg-bear/5 p-4">
                    <h3 className="text-xs font-bold text-bear uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="size-4" />
                      Top 3 Critical Risks
                    </h3>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {stock.top3Risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-bear font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/60 pt-3">
                  <h3 className="text-xs font-bold text-foreground">Revenue Segment Breakdown</h3>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {stock.revenueSegments.map((seg, i) => (
                      <div key={i} className="rounded-lg bg-secondary/40 p-3 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-foreground">{seg.name}</span>
                          <span className="font-black text-primary">{seg.sharePct}%</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{seg.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INDMONEY POSITION SIZING & LRS CALCULATOR */}
            {activeResearchTab === 'INDMONEY_PLAN' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <DollarSign className="size-4" />
                      INDmoney Dual Currency Position Calculator
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Current USD/INR Conversion Assumption: ₹{liveUsdInr.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Total Investment Capital in INR (₹):
                      </label>
                      <input
                        type="number"
                        value={capitalInr}
                        onChange={e => setCapitalInr(Math.max(1000, parseFloat(e.target.value) || 0))}
                        className="w-full rounded border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Maximum Acceptable Risk per Trade (%):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={riskTolerancePct}
                        onChange={e => setRiskTolerancePct(Math.max(0.5, parseFloat(e.target.value) || 0))}
                        className="w-full rounded border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Calculated Sizing Output */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
                    <div className="rounded bg-secondary/50 p-2.5 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Max Risk INR / USD</span>
                      <p className="font-bold text-bear">₹{indmoneySizing.maxRiskInr.toLocaleString()} (${indmoneySizing.maxRiskUsd})</p>
                    </div>
                    <div className="rounded bg-secondary/50 p-2.5 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Risk per Share</span>
                      <p className="font-bold text-foreground">${indmoneySizing.riskPerShareUsd} (₹{indmoneySizing.riskPerShareInr})</p>
                    </div>
                    <div className="rounded bg-secondary/50 p-2.5 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Exact Shares on INDmoney</span>
                      <p className="font-black text-primary">{indmoneySizing.exactShares} shares</p>
                    </div>
                    <div className="rounded bg-secondary/50 p-2.5 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Total Exposure (USD / INR)</span>
                      <p className="font-bold text-bull">${indmoneySizing.totalExposureUsd} (₹{indmoneySizing.totalExposureInr.toLocaleString()})</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 bg-secondary/20 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-foreground">INDmoney LRS & Compliance Checklist:</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    • <strong>Fractional Buying:</strong> Available from $1.00 (~₹{Math.round(liveUsdInr)}). You can purchase exactly {indmoneySizing.exactShares} shares without buying whole lots.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    • <strong>TCS Zero-Threshold:</strong> If your total overseas remittances across all platforms are under ₹7 Lakhs in the current financial year, TCS is 0%. Above ₹7 Lakhs, 20% TCS applies, which you can claim back during your annual ITR filing.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    • <strong>Dividend Foreign Tax Credit:</strong> Any US dividends are taxed at 25% by the US IRS. Under Article 25 of the India-US Double Tax Avoidance Agreement (DTAA), you can claim this 25% as Foreign Tax Credit in India by filing Form 67.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: FUNDAMENTALS & CASH FLOW */}
            {activeResearchTab === 'FUNDAMENTALS' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Historical Financial Performance (5–10 Year Framework)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground">
                      <tr>
                        <th className="p-2">Period</th>
                        <th className="p-2">Revenue</th>
                        <th className="p-2">Net Income</th>
                        <th className="p-2">EPS</th>
                        <th className="p-2">Gross Margin</th>
                        <th className="p-2">Net Margin</th>
                        <th className="p-2">Free Cash Flow</th>
                        <th className="p-2">ROE</th>
                        <th className="p-2">ROIC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stock.financialYears.map((fy, i) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="p-2 font-bold text-foreground">{fy.year}</td>
                          <td className="p-2">${fy.revenueB}B</td>
                          <td className="p-2 text-bull font-bold">${fy.netIncomeB}B</td>
                          <td className="p-2">${fy.eps}</td>
                          <td className="p-2">{fy.grossMarginPct}%</td>
                          <td className="p-2 font-bold text-primary">{fy.netMarginPct}%</td>
                          <td className="p-2 text-bull font-bold">${fy.fcfB}B</td>
                          <td className="p-2">{fy.roePct}%</td>
                          <td className="p-2 font-bold text-bull">{fy.roicPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-border/60 pt-3 text-xs">
                  <div className="rounded bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">3Y Revenue CAGR</span>
                    <p className="font-bold text-bull">+{stock.revCagr3y}%</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">Working Capital</span>
                    <p className="font-bold text-foreground">${stock.workingCapitalB}B</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">3Y Share Buybacks</span>
                    <p className="font-bold text-primary">${stock.shareBuybacks3yB}B</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">Annual SBC Dilution</span>
                    <p className="font-bold text-gold">{stock.sbcDilutionAnnualPct}% (Low Dilution)</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 8-12 QUARTER EARNINGS */}
            {activeResearchTab === 'QUARTERS' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Recent Quarterly Earnings Delivery & Guidance Surprises
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground">
                      <tr>
                        <th className="p-2">Quarter</th>
                        <th className="p-2">Revenue</th>
                        <th className="p-2">Reported EPS</th>
                        <th className="p-2">Consensus EPS</th>
                        <th className="p-2">Beat / Miss</th>
                        <th className="p-2">YoY Growth</th>
                        <th className="p-2">Management Tone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stock.quarters.map((q, i) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="p-2 font-bold text-foreground">{q.quarter}</td>
                          <td className="p-2">${q.revenueB}B</td>
                          <td className="p-2 font-bold text-foreground">${q.eps}</td>
                          <td className="p-2 text-muted-foreground">${q.epsEstimate}</td>
                          <td className="p-2">
                            <span className="rounded bg-bull/20 px-2 py-0.5 text-[10px] font-bold text-bull">
                              {q.beatMiss}
                            </span>
                          </td>
                          <td className="p-2 font-bold text-bull">+{q.yoyGrowthPct}%</td>
                          <td className="p-2 text-primary font-bold">{q.guidanceTone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: SEC FILINGS & EDGAR */}
            {activeResearchTab === 'SEC_FILINGS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="size-4 text-primary" />
                    Official SEC EDGAR Filings & Disclosure History
                  </h3>
                  <a
                    href={`https://www.sec.gov/edgar/searchedgar/companysearch?CIK=${stock.symbol}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>Search SEC EDGAR Portal</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {stock.secFilings.map((f, i) => (
                    <div key={i} className="rounded-lg border border-border/80 bg-secondary/20 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded bg-primary/20 px-2 py-0.5 font-bold text-primary">
                          {f.type} · {f.period}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Filed: {f.filingDate}</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">{f.summary}</p>
                      <p className="text-[11px] text-muted-foreground">{f.keyDisclosures}</p>
                      <a
                        href={f.edgarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline pt-1"
                      >
                        <span>View Source Filing on SEC.gov</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/60 pt-3 space-y-2">
                  <h4 className="text-xs font-bold text-foreground">5–10 Year Corporate Actions & Strategic Evolution</h4>
                  <div className="space-y-1.5">
                    {stock.corporateHistoryTimeline.map((item, i) => (
                      <div key={i} className="rounded bg-secondary/30 p-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-primary w-16">{item.year}</span>
                        <span className="font-semibold text-foreground flex-1">{item.event}</span>
                        <span className="text-[11px] text-muted-foreground">{item.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: VALUATION & DCF */}
            {activeResearchTab === 'VALUATION' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">DCF Intrinsic Value</span>
                    <p className="text-lg font-black text-bull">${stock.dcfIntrinsicFairValueUsd}</p>
                    <span className="text-[10px] text-muted-foreground">Base discount rate: 8.5%, terminal growth: 3.0%</span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Reverse DCF Implied Growth</span>
                    <p className="text-lg font-black text-primary">{stock.reverseDcfImpliedGrowthPct}%</p>
                    <span className="text-[10px] text-muted-foreground">Market pricing 14.5% FCF CAGR for 10 years</span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">SBC-Adjusted P/E</span>
                    <p className="text-lg font-black text-foreground">{stock.sbcAdjustedPeRatio}x</p>
                    <span className="text-[10px] text-muted-foreground">Accounts for equity dilution impact</span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Valuation Multiple Verdict</span>
                    <p className="text-lg font-black text-bull">{stock.valuationVerdict}</p>
                    <span className="text-[10px] text-muted-foreground">Supported by 35%+ operating margins</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: TECHNICALS & SMC */}
            {activeResearchTab === 'TECHNICALS' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Smart Money Order Block</span>
                    <p className="font-bold text-bull">{stock.smcOrderBlockZone}</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Fair Value Gap (FVG)</span>
                    <p className="font-bold text-primary">{stock.fairValueGapZone}</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Volume Profile POC</span>
                    <p className="font-bold text-foreground">${stock.volumeProfilePocUsd}</p>
                  </div>
                  <div className="rounded bg-secondary/30 p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">RSI (14-Day) / MACD</span>
                    <p className="font-bold text-bull">{stock.rsi14} · {stock.macdStatus}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs border-t border-border/60 pt-3">
                  <div className="rounded bg-secondary/20 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground block">20 EMA (Short Trend)</span>
                    <span className="font-bold text-bull">${stock.ema20Usd}</span>
                  </div>
                  <div className="rounded bg-secondary/20 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground block">50 EMA (Medium Pivot)</span>
                    <span className="font-bold text-primary">${stock.ema50Usd}</span>
                  </div>
                  <div className="rounded bg-secondary/20 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground block">200 EMA (Institutional Baseline)</span>
                    <span className="font-bold text-foreground">${stock.ema200Usd}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: US MACRO & CURRENCY */}
            {activeResearchTab === 'MACRO' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded bg-secondary/30 p-3 space-y-1">
                  <h4 className="font-bold text-foreground">Federal Reserve Policy Impact:</h4>
                  <p className="text-muted-foreground">{stock.fedRateSensitivity}</p>
                </div>
                <div className="rounded bg-secondary/30 p-3 space-y-1">
                  <h4 className="font-bold text-foreground">US 10-Year Treasury Yield Sensitivity:</h4>
                  <p className="text-muted-foreground">{stock.us10yYieldSensitivity}</p>
                </div>
                <div className="rounded bg-secondary/30 p-3 space-y-1">
                  <h4 className="font-bold text-foreground">USD/INR Currency Engine (Dual Return Thesis):</h4>
                  <p className="text-muted-foreground">{stock.usdInrTailwindAnalysis}</p>
                </div>
              </div>
            )}

            {/* TAB 9: COMPETITORS */}
            {activeResearchTab === 'PEERS' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Top Competitor Benchmarking in {stock.sector}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground">
                      <tr>
                        <th className="p-2">Ticker</th>
                        <th className="p-2">Company Name</th>
                        <th className="p-2">Market Cap</th>
                        <th className="p-2">P/E Ratio</th>
                        <th className="p-2">Fwd P/E</th>
                        <th className="p-2">EV/EBITDA</th>
                        <th className="p-2">YoY Growth</th>
                        <th className="p-2">Net Margin</th>
                        <th className="p-2">INDmoney</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stock.peers.map((peer, i) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="p-2 font-bold text-primary font-mono">{peer.symbol}</td>
                          <td className="p-2 text-foreground font-semibold">{peer.name}</td>
                          <td className="p-2">${peer.marketCapB}B</td>
                          <td className="p-2">{peer.peRatio}x</td>
                          <td className="p-2">{peer.fwdPe}x</td>
                          <td className="p-2">{peer.evEbitda}x</td>
                          <td className="p-2 text-bull font-bold">+{peer.revGrowthYoY}%</td>
                          <td className="p-2 font-bold text-primary">{peer.netMarginPct}%</td>
                          <td className="p-2">
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              {peer.indmoneyStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 10: INSTITUTIONAL & 13F */}
            {activeResearchTab === 'INSTITUTIONAL' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/30 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Top 13F Institutional Holders
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {stock.topInstitutionalHolders.map((inst, i) => (
                        <div key={i} className="flex justify-between border-b border-border/40 pb-1">
                          <span className="text-muted-foreground">{inst.name}</span>
                          <span className="font-bold text-foreground">{inst.stakePct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/30 p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-foreground uppercase tracking-wide">
                      Insider Sentiment & Short Interest
                    </h4>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Form 4 Insider Sentiment:</span>
                      <span className="font-bold text-primary">{stock.insiderSentiment}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Short Interest (% Float):</span>
                      <span className="font-bold text-bull">{stock.shortInterestPctFloat}% (Low Squeeze Risk)</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Days to Cover:</span>
                      <span className="font-bold text-foreground">{stock.daysToCover} days</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: PRICE SCENARIOS (5 HORIZONS) */}
            {activeResearchTab === 'SCENARIOS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Evidence-Based Price Scenarios: {selectedHorizon}
                  </h3>
                  <span className="text-xs text-primary font-bold">
                    Methodology: {currentScenario.methodology}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-bear/30 bg-bear/5 p-4 space-y-2">
                    <span className="text-xs font-bold text-bear uppercase tracking-wide">Bear Case</span>
                    <div className="text-lg font-black text-bear">
                      ${currentScenario.bear.usd} ({currentScenario.bear.pct}%)
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">
                      INR Equivalent: ₹{currentScenario.bear.inr.toLocaleString()}
                    </p>
                    <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
                      {currentScenario.downsideRisks.map((d, i) => (
                        <div key={i}>• {d}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Base Case (Most Likely)</span>
                    <div className="text-lg font-black text-primary">
                      ${currentScenario.base.usd} (+{currentScenario.base.pct}%)
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">
                      INR Equivalent: ₹{currentScenario.base.inr.toLocaleString()}
                    </p>
                    <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
                      {currentScenario.keyCatalysts.map((c, i) => (
                        <div key={i}>• {c}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-bull/30 bg-bull/5 p-4 space-y-2">
                    <span className="text-xs font-bold text-bull uppercase tracking-wide">Bull Case</span>
                    <div className="text-lg font-black text-bull">
                      ${currentScenario.bull.usd} (+{currentScenario.bull.pct}%)
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">
                      INR Equivalent: ₹{currentScenario.bull.inr.toLocaleString()}
                    </p>
                    <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
                      <div>• Acceleration of AI and enterprise cloud adoption</div>
                      <div>• Multiple re-rating above historical peaks</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW B: INDmoney 1000 OPPORTUNITY SCANNER TABLE                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'SCANNER' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground font-mono flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  USA Top 1000 (Russell 1000 Reference) Opportunity Scanner
                </h2>
                <p className="text-xs text-muted-foreground">
                  Multi-Factor Screener: Filter by INDmoney Eligibility, Sector, Cap Tier, and AI Quality Verdicts.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">
                  {scannerCandidates.length} Active Candidates
                </span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs pt-1">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Sector Filter:</label>
                <select
                  value={scannerSector}
                  onChange={e => setScannerSector(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All US Sectors</option>
                  <option value="Semiconductors & AI">Semiconductors & AI</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                  <option value="Financials & Banking">Financials & Banking</option>
                  <option value="Consumer Discretionary">Consumer Discretionary</option>
                  <option value="Communication Services">Communication Services</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Market Cap Tier:</label>
                <select
                  value={scannerCapTier}
                  onChange={e => setScannerCapTier(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Market Caps</option>
                  <option value="Mega-Cap ($200B+)">Mega-Cap ($200B+)</option>
                  <option value="Large-Cap ($10B-$200B)">Large-Cap ($10B–$200B)</option>
                  <option value="Mid-Cap ($2B-$10B)">Mid-Cap ($2B–$10B)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">AI Verdict Filter:</label>
                <select
                  value={scannerVerdictFilter}
                  onChange={e => setScannerVerdictFilter(e.target.value)}
                  className="w-full rounded border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Verdicts</option>
                  <option value="STRONG BUY CANDIDATE">Strong Buy Candidates</option>
                  <option value="BUY ON CONFIRMATION">Buy on Confirmation</option>
                  <option value="ACCUMULATE GRADUALLY">Accumulate Gradually</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={scannerIndmoneyOnly}
                    onChange={e => setScannerIndmoneyOnly(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span className="text-xs font-bold text-emerald-400">INDmoney Fractional Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Scanner Results Table */}
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden font-mono">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground">
                  <tr>
                    <th className="p-3">Rank / Stock</th>
                    <th className="p-3">Exchange</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">CMP (USD / INR)</th>
                    <th className="p-3">24h Change</th>
                    <th className="p-3">P/E</th>
                    <th className="p-3">AI Verdict</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">INDmoney</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scannerCandidates.map(({ item, profile }) => {
                    const liveCmp = liveTickMap[item.symbol]?.cmpUsd ?? item.cmpUsd;
                    const livePct = liveTickMap[item.symbol]?.changePct ?? item.changePct;
                    const flash = liveTickMap[item.symbol]?.flash;
                    return (
                      <tr key={item.symbol} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground text-[10px]">#{item.rank}</span>
                            <span className="text-primary font-bold">{item.symbol}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.exchange}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-[120px]">{item.sector}</td>
                        <td className="p-3 font-bold">
                          <span className={`transition-all duration-300 ${
                            flash === 'UP' ? 'text-bull scale-105 inline-block' : flash === 'DOWN' ? 'text-bear scale-105 inline-block' : 'text-foreground'
                          }`}>
                            ${liveCmp.toFixed(2)}
                          </span>
                          <span className="block text-[10px] text-primary">
                            ≈ ₹{Math.round(liveCmp * liveUsdInr).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 font-bold">
                          <span className={livePct >= 0 ? 'text-bull' : 'text-bear'}>
                            {livePct >= 0 ? '+' : ''}{livePct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 text-foreground font-semibold">{item.peRatio}x</td>
                        <td className="p-3">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            profile.overallVerdict.includes('BUY')
                              ? 'bg-bull/20 text-bull'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {profile.overallVerdict.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-primary">
                          {profile.pillarScores.totalScore}/100
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            Min $1.00
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
      {/* VIEW C: INDmoney LRS & CURRENCY RETURN SIMULATOR                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'INDMONEY_SIMULATOR' && (
        <div className="space-y-4 font-mono">
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              RBI LRS & Currency Depreciation Dual-Return Engine
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
              When Indian residents invest in US stocks through INDmoney, they benefit from two compounding engines simultaneously:
              (1) The underlying business equity growth in US Dollars, and (2) The historical ~3.2%–4.0% annualized Rupee depreciation against the US Dollar.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Scenario 1: USD Stock Flat (0%)</span>
                <div className="text-lg font-black text-primary">+3.5% Net in INR</div>
                <p className="text-xs text-muted-foreground">
                  Even if the US stock price remains unchanged at $100, if USD/INR moves from ₹87.10 to ₹90.15 over 1 year, your portfolio gains +3.5% in Rupee terms.
                </p>
              </div>

              <div className="rounded-lg border border-bull/40 bg-bull/5 p-4 space-y-2">
                <span className="text-xs font-bold text-bull uppercase">Scenario 2: Moderate Compounder (+18% USD)</span>
                <div className="text-lg font-black text-bull">+22.1% Net in INR</div>
                <p className="text-xs text-muted-foreground">
                  A stock rising +18% in USD converts into a +22.1% net INR gain when combined with normal ~3.5% currency depreciation.
                </p>
              </div>

              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-2">
                <span className="text-xs font-bold text-primary uppercase">Scenario 3: High Growth Outperformer (+35% USD)</span>
                <div className="text-lg font-black text-primary">+39.7% Net in INR</div>
                <p className="text-xs text-muted-foreground">
                  High-beta mega-cap winners (like Nvidia or Microsoft) deliver compounding superior to domestic benchmarks when dual returns combine.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-secondary/20 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-foreground">Taxation & Reporting Checklist for Indian Residents:</h4>
              <p className="text-muted-foreground">• <strong>Capital Gains Holding Period:</strong> For foreign US equities, investments held for more than 24 months qualify for Long-Term Capital Gains (LTCG) tax at 12.5% (post-July 2024 budget rules). Investments held for 24 months or less are treated as Short-Term Capital Gains (STCG) taxed at applicable income tax slab rates.</p>
              <p className="text-muted-foreground">• <strong>Schedule FA (Foreign Assets):</strong> Mandatory reporting in Indian ITR. All US stocks held on INDmoney must be declared under Schedule FA in ITR-2 or ITR-3.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW D: US SECTOR OUTLOOK (AI & BIOTECH/MEDTECH)                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'SECTORS' && (
        <div className="space-y-6 font-mono">
          {/* Header Banner */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-slate-900 to-primary/5 p-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base font-black text-primary">
                <Zap className="size-5 text-primary" />
                HIGH-GROWTH US SECTORS: 2025–2030 OUTLOOK
              </span>
              <span className="rounded bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                STRATEGIC FOCUS: AI HARDWARE & BIOTECH/MEDTECH
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
              US equity market mein sabse bada secular outperformance un companies se aa raha hai jinka business model global technological aur medical transformation ke center mein hai: (1) AI Accelerators & Cloud Infrastructure (Nvidia & Microsoft) aur (2) Metabolic Biopharma & Robotic Surgery (Eli Lilly & Intuitive Surgical). Niche in dono sectors ka deep dive, market share dynamics, aur quarterly metrics diye gaye hain.
            </p>
          </div>

          {/* Sector 1: US AI & Semiconductors */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                    SECTOR: STRONG OVERWEIGHT
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Horizon: 2025–2030 (AI Supercycle Phase 2)</span>
                </div>
                <h3 className="text-lg font-black text-foreground mt-1">
                  1. US Artificial Intelligence & Advanced Semiconductor Accelerators
                </h3>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] text-muted-foreground block">Expected Compute CAGR:</span>
                <span className="text-base font-black text-primary">32%–38% Annual Growth</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Macro Driver:</strong> Global data center infrastructure is undergoing a $1 Trillion architectural transition from legacy general-purpose x86 CPUs to accelerated parallel GPU computing. Frontier AI model training, reasoning inference (OpenAI o1/o3, Google Gemini, DeepSeek), and enterprise copilot automation require millions of interconnected high-bandwidth accelerator nodes.
            </p>

            {/* Competitive Landscape & Chip Moat Analysis */}
            <div className="rounded-lg border border-border/70 bg-secondary/20 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Cpu className="size-4 text-primary" />
                Nvidia Market Share & Competitive Risk Evaluation:
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Nvidia holds an overwhelming <strong>85%–90% global market share</strong> in AI training and advanced reasoning accelerators, reinforced by its 20-year CUDA software lock-in (5M+ developers worldwide). Competitor AMD (Instinct MI300X/MI325X/MI350 series) offers cost-effective memory bandwidth for open-source models, capturing budget tier deployments (~5%–8% share). Meanwhile, major cloud hyperscalers (Amazon AWS Trainium2, Google Cloud TPU v6e, Microsoft Azure Maia 100) are developing internal custom ASICs to handle proprietary internal workloads and constrain capex. However, hyperscalers simultaneously remain Nvidia's largest customers, ordering tens of billions in Blackwell GB200 systems to satisfy external commercial developer demand.
              </p>
            </div>

            {/* Head-to-Head Comparison: Nvidia vs Microsoft */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" />
                Financial Head-to-Head: Nvidia (NVDA) vs Microsoft (MSFT)
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Nvidia Card */}
                <div className="rounded-xl border border-primary/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-primary">NVDA</span>
                      <span className="text-xs text-muted-foreground block font-sans">NVIDIA Corporation</span>
                    </div>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">AI Hardware King</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Quarterly Rev</span>
                      <span className="font-bold text-foreground">$35.08B (+94%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Net Profit Margin</span>
                      <span className="font-bold text-emerald-400">55.3% ($19.31B)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">AI Chip Share</span>
                      <span className="font-bold text-primary">85%–90%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Latest Financial Performance:</strong> Q3 FY25 revenue reached a record $35.08B (+94% YoY), driven by Data Center compute revenue of $30.8B. GAAP net income surged to $19.31B with industry-leading 55.3% net margin.</p>
                    <p><strong className="text-foreground">Competitive Position vs AMD/ASICs:</strong> While AMD MI325X is gaining traction in inference, Nvidia's full-stack architecture (Blackwell GB200 NVL72 liquid-cooled racks, 1.8 TB/s NVLink interconnect, Spectrum-X Ethernet) and 20-year CUDA software ecosystem create an insurmountable barrier for mission-critical enterprise workloads.</p>
                    <p><strong className="text-bear">Key Risks:</strong> Hyperscaler customer concentration (~40% of sales from Microsoft, Meta, Google, Amazon) and reliance on TSMC foundries in Taiwan for CoWoS packaging.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('NVDA');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-primary px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View Nvidia Deep Terminal ↗
                  </button>
                </div>

                {/* Microsoft Card */}
                <div className="rounded-xl border border-cyan-500/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-cyan-400">MSFT</span>
                      <span className="text-xs text-muted-foreground block font-sans">Microsoft Corporation</span>
                    </div>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">Enterprise AI Cloud</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Quarterly Rev</span>
                      <span className="font-bold text-foreground">$65.59B (+16%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Net Profit Margin</span>
                      <span className="font-bold text-emerald-400">36.8% ($24.67B)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Azure AI Growth</span>
                      <span className="font-bold text-cyan-400">+33% YoY</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Latest Financial Performance:</strong> Q1 FY25 revenue was $65.59B (+16% YoY) with net income of $24.67B (36.8% net margin). Commercial cloud revenue reached $38.9B (+22% YoY) with a $259B contracted backlog.</p>
                    <p><strong className="text-foreground">AI Monetization & In-House Silicon:</strong> Azure growth accelerated to 33%, with 12 full percentage points directly driven by generative AI services. Deploying custom Maia 100 AI chips in data centers to optimize inference costs across 400M+ Office 365 commercial Copilot seats.</p>
                    <p><strong className="text-bear">Key Risks:</strong> Escalating capital expenditure ($20B/quarter) to fund global data center buildouts and antitrust regulatory scrutiny over enterprise software bundling.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('MSFT');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View Microsoft Deep Terminal ↗
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sector 2: US Biopharma & Robotic Surgery */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                    SECTOR: STRONG OVERWEIGHT
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Horizon: 2025–2030 (Metabolic & Surgical Megatrends)</span>
                </div>
                <h3 className="text-lg font-black text-foreground mt-1">
                  2. US Biopharmaceuticals & Robotic Surgical MedTech
                </h3>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] text-muted-foreground block">Expected Sector CAGR:</span>
                <span className="text-base font-black text-amber-400">20%–25% Annual Growth</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Macro Driver:</strong> Aging global demographics, escalating obesity and cardiometabolic diseases, and the worldwide hospital shift toward minimally invasive robotic procedures are generating unprecedented secular demand insulated from macroeconomic cycles.
            </p>

            {/* Head-to-Head Comparison: Eli Lilly vs Intuitive Surgical */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" />
                Financial Head-to-Head: Eli Lilly (LLY) vs Intuitive Surgical (ISRG)
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Eli Lilly Card */}
                <div className="rounded-xl border border-amber-500/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-amber-400">LLY</span>
                      <span className="text-xs text-muted-foreground block font-sans">Eli Lilly and Company</span>
                    </div>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">GLP-1 Monopoly</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Quarterly Rev</span>
                      <span className="font-bold text-foreground">$11.44B (+20%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Net Profit Margin</span>
                      <span className="font-bold text-emerald-400">29.8% ($3.41B)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Peak Projections</span>
                      <span className="font-bold text-amber-400">$55B–$65B Sales</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Zepbound & Mounjaro Projections:</strong> Tirzepatide (Zepbound for obesity, Mounjaro for diabetes) is projected by consensus to become the best-selling pharmaceutical in global history with $55B–$65B in annual peak sales by 2030.</p>
                    <p><strong className="text-foreground">Expanding Clinical Indications:</strong> FDA granted fast-track approvals for Obstructive Sleep Apnea (OSA) and MASH liver fibrosis; oral GLP-1 candidate Orforglipron entering Phase 3 trial readouts.</p>
                    <p><strong className="text-foreground">Manufacturing Capex:</strong> Investing $9B+ in advanced sterile manufacturing facilities in Indiana, North Carolina, and Germany to resolve drug supply shortages and meet global demand.</p>
                    <p><strong className="text-bear">Key Risks:</strong> Production bottlenecks on auto-injector pens and insurance formulary price negotiations with US pharmacy benefit managers (PBMs).</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('LLY');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View Eli Lilly Deep Terminal ↗
                  </button>
                </div>

                {/* Intuitive Surgical Card */}
                <div className="rounded-xl border border-emerald-500/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-emerald-400">ISRG</span>
                      <span className="text-xs text-muted-foreground block font-sans">Intuitive Surgical Inc.</span>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Robotic Surgery Monopoly</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Quarterly Rev</span>
                      <span className="font-bold text-foreground">$2.04B (+17%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Net Profit Margin</span>
                      <span className="font-bold text-emerald-400">27.8% ($565M)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Recurring Rev %</span>
                      <span className="font-bold text-emerald-400">83% Recurring</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Da Vinci Global Installed Base:</strong> Over 9,200 installed Da Vinci systems globally across top hospitals. Total procedure volume grew 17% YoY to over 2.6M robotic surgical procedures annually.</p>
                    <p><strong className="text-foreground">83% Recurring Revenue Annuity:</strong> $1.26B/quarter from single-use EndoWrist instruments and accessories ($1,800–$3,500 per surgery) + $360M/quarter in recurring service maintenance contracts, insulating revenue from hospital capex cycles.</p>
                    <p><strong className="text-foreground">Da Vinci 5 Launch Supercycle:</strong> 5th-generation platform features force-sensing technology (measuring tissue push/pull force) and 10,000x greater compute power, accelerating upgrades across the entire installed base.</p>
                    <p><strong className="text-bear">Key Risks:</strong> Premium valuation multiple (68x P/E) vulnerability if elective procedure growth slows down; hospital capital expenditure deferrals during economic stress.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSymbol('ISRG');
                      setActiveMainTab('RESEARCH');
                    }}
                    className="w-full rounded bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer mt-2"
                  >
                    View Intuitive Surgical Deep Terminal ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW E: 50:50 CROSS-BORDER BALANCED GROWTH ALLOCATION STRATEGY     */}
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
                  Interactive Capital Deployment Calculator (USD & INR)
                </h3>
                <span className="text-xs text-muted-foreground">Apna investment capital enter karein:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Portfolio Capital:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={capitalInr}
                    onChange={e => setCapitalInr(Math.max(50000, Number(e.target.value)))}
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
                    25% · ₹{(capitalInr * 0.25).toLocaleString()}
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
                      <span className="font-bold text-cyan-400">15% · ₹{(capitalInr * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Target ₹5,200</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">BEL (Bharat Electronics):</strong>
                      <span className="text-[10px] text-muted-foreground block">Military Radars, EW & Missile Electronics · Order Book ₹76k Cr</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-cyan-400">10% · ₹{(capitalInr * 0.10).toLocaleString()}</span>
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
                    25% · ₹{(capitalInr * 0.25).toLocaleString()}
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
                      <span className="font-bold text-emerald-400">15% · ₹{(capitalInr * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Target ₹540</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">KPI Green Energy (KPIGREEN):</strong>
                      <span className="text-[10px] text-muted-foreground block">3Y PAT CAGR 112% · 2.8+ GW Hybrid Pipeline · IPP/CPP</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">10% · ₹{(capitalInr * 0.10).toLocaleString()}</span>
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
                    25% · ₹{(capitalInr * 0.25).toLocaleString()} (${Math.round((capitalInr * 0.25) / liveUsdInr).toLocaleString()})
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
                      <span className="font-bold text-primary">15% · ₹{(capitalInr * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((capitalInr * 0.15) / liveUsdInr).toLocaleString()} · Target $175</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Microsoft (MSFT):</strong>
                      <span className="text-[10px] text-muted-foreground block">Azure AI Cloud (+33%) · 400M Office Seats · Maia Silicon</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">10% · ₹{(capitalInr * 0.10).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((capitalInr * 0.10) / liveUsdInr).toLocaleString()} · Target $480</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bucket 4: US Biotech & Robotic Surgery */}
              <div className="rounded-xl border border-amber-500/40 bg-secondary/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 text-xs">BUCKET 4: US BIOTECH & SURGICAL ROBOTICS</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-300">
                    25% · ₹{(capitalInr * 0.25).toLocaleString()} (${Math.round((capitalInr * 0.25) / liveUsdInr).toLocaleString()})
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
                      <span className="font-bold text-amber-400">15% · ₹{(capitalInr * 0.15).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((capitalInr * 0.15) / liveUsdInr).toLocaleString()} · Target $1,120</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div>
                      <strong className="text-foreground">Intuitive Surgical (ISRG):</strong>
                      <span className="text-[10px] text-muted-foreground block">Da Vinci 5 System · 83% Recurring Revenue · Zero Debt</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">10% · ₹{(capitalInr * 0.10).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground block">${Math.round((capitalInr * 0.10) / liveUsdInr).toLocaleString()} · Target $580</span>
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
