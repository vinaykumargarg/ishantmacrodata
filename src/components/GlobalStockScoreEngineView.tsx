import React, { useState, useMemo } from 'react';
import {
  CountryUniverse,
  CapTier,
  SignalType,
  InstitutionalStockRecord,
  INSTITUTIONAL_STOCKS,
  GLOBAL_MACRO_SNAPSHOT
} from '../data/globalStockScoreData';
import TradingViewWidget from './TradingViewWidget';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart2,
  DollarSign,
  Filter,
  Layers,
  Award,
  Zap,
  Clock,
  Sliders,
  ExternalLink,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Scale,
  Briefcase,
  PieChart,
  BookOpen,
  Compass,
  Cpu,
  FileText
} from 'lucide-react';

interface GlobalStockScoreEngineViewProps {
  onNavigate?: (id: string) => void;
  liveTickers?: any[];
}

export default function GlobalStockScoreEngineView({ onNavigate }: GlobalStockScoreEngineViewProps) {
  // ── STATE MANAGEMENT ──
  const [selectedStockId, setSelectedStockId] = useState<string>('NVDA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'INDIA' | 'USA'>('ALL');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [capFilter, setCapFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'SCREENER' | 'ENGINE' | 'AZ_RESEARCH' | 'ENTRY_ENGINE'>('SCREENER');
  const [selectedAZLetter, setSelectedAZLetter] = useState<string>('A');

  // Position Sizing Calculator State
  const [tradingCapital, setTradingCapital] = useState<number>(500000); // ₹5,00,000 or $25,000
  const [riskPerTradePct, setRiskPerTradePct] = useState<number>(1.5);  // 1.5% max risk

  // Fetch current stock record
  const selectedStock: InstitutionalStockRecord = useMemo(() => {
    return INSTITUTIONAL_STOCKS.find((s) => s.id === selectedStockId) || INSTITUTIONAL_STOCKS[0];
  }, [selectedStockId]);

  // Adjust default capital currency when switching stock
  const isIndia = selectedStock.country === 'INDIA';
  const currencySymbol = isIndia ? '₹' : '$';

  // Filtered and Ranked Stock Universe
  const filteredStocks = useMemo(() => {
    return INSTITUTIONAL_STOCKS.filter((stock) => {
      // Country Filter
      if (countryFilter !== 'ALL' && stock.country !== countryFilter) return false;
      // Signal Filter
      if (signalFilter !== 'ALL' && stock.entryPlan.holdingHorizon && stock.entryPlan.riskRewardRatio) {
        if (signalFilter !== stock.azResearch.finalVerdict.signal) return false;
      }
      // Cap Filter
      if (capFilter !== 'ALL' && stock.capTier !== capFilter) return false;
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = stock.name.toLowerCase().includes(q);
        const matchesSymbol = stock.symbol.toLowerCase().includes(q);
        const matchesExchange = stock.exchange.toLowerCase().includes(q);
        const matchesSector = stock.sector.toLowerCase().includes(q);
        const matchesAlias = stock.tickerAlias.some((a) => a.toLowerCase().includes(q));
        return matchesName || matchesSymbol || matchesExchange || matchesSector || matchesAlias;
      }
      return true;
    }).sort((a, b) => b.scores.totalScore - a.scores.totalScore);
  }, [countryFilter, signalFilter, capFilter, searchQuery]);

  // ── POSITION SIZING CALCULATOR LOGIC ──
  const positionCalc = useMemo(() => {
    const entryPrice = selectedStock.cmp;
    const stopPrice = selectedStock.entryPlan.stopLoss.price;
    const riskPerShare = Math.abs(entryPrice - stopPrice);
    const maxRiskAmount = (tradingCapital * riskPerTradePct) / 100;
    const sharesToBuy = riskPerShare > 0 ? Math.floor(maxRiskAmount / riskPerShare) : 0;
    const totalPositionValue = sharesToBuy * entryPrice;
    const capitalDeployedPct = tradingCapital > 0 ? (totalPositionValue / tradingCapital) * 100 : 0;

    const profitAtTp1 = sharesToBuy * (selectedStock.entryPlan.target1.price - entryPrice);
    const profitAtTp2 = sharesToBuy * (selectedStock.entryPlan.target2.price - entryPrice);
    const profitAtTp3 = sharesToBuy * (selectedStock.entryPlan.target3.price - entryPrice);

    return {
      maxRiskAmount,
      riskPerShare,
      sharesToBuy,
      totalPositionValue,
      capitalDeployedPct,
      profitAtTp1,
      profitAtTp2,
      profitAtTp3
    };
  }, [selectedStock, tradingCapital, riskPerTradePct]);

  // Helpers for signal badge colors
  const getSignalBadge = (sig: SignalType) => {
    switch (sig) {
      case 'BUY':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'ACCUMULATE':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'HOLD':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'WAIT':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'AVOID':
      case 'SELL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-cyan-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  // A to Z research chapters
  const azChapters = [
    { key: 'A', title: 'Business', icon: '🏢' },
    { key: 'B', title: 'Business Model', icon: '⚙️' },
    { key: 'C', title: 'Competitive Advantage', icon: '🏰' },
    { key: 'D', title: 'Debt Profile', icon: '💳' },
    { key: 'E', title: 'Earnings Growth', icon: '📈' },
    { key: 'F', title: 'Free Cash Flow', icon: '💵' },
    { key: 'G', title: 'Growth Vectors', icon: '🚀' },
    { key: 'H', title: 'Holdings & Shareholding', icon: '👥' },
    { key: 'I', title: 'Insider & Institutional', icon: '🔍' },
    { key: 'J', title: 'Judgement & Evidence', icon: '⚖️' },
    { key: 'K', title: 'Key Risks', icon: '⚠️' },
    { key: 'L', title: 'Liquidity & Tradability', icon: '💧' },
    { key: 'M', title: 'Macro Sensitivity', icon: '🌐' },
    { key: 'N', title: 'News (Fact vs Rumor)', icon: '📰' },
    { key: 'O', title: 'Order & Price Structure', icon: '📊' },
    { key: 'P', title: 'Profitability Ratios', icon: '💎' },
    { key: 'Q', title: 'Quality Rating', icon: '⭐' },
    { key: 'R', title: 'Relative Strength', icon: '⚡' },
    { key: 'S', title: 'Sentiment & Flows', icon: '🧠' },
    { key: 'T', title: 'Technical 4-6M Setup', icon: '📐' },
    { key: 'U', title: 'Upside Scenarios', icon: '🎯' },
    { key: 'V', title: 'Valuation Reality', icon: '🏷️' },
    { key: 'W', title: 'Why Now?', icon: '⏱️' },
    { key: 'X', title: 'X-Factor Catalyst', icon: '✨' },
    { key: 'Y', title: 'Yield & Return', icon: '💰' },
    { key: 'Z', title: 'Final Verdict', icon: '🏁' }
  ];

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER & EXECUTIVE STRATEGY BRIEF ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="label-xs rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-primary font-semibold flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              GLOBAL SCORE ENGINE
            </span>
            <span className="label-xs rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-gold font-medium">
              4–6 MONTH HOLDING HORIZON
            </span>
            <span className="label-xs rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-muted-foreground">
              🇮🇳 INDIA + 🇺🇸 USA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-gradient">
            Institutional Stock Investment & Research Engine
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-4xl">
            Evidence-based decision terminal combining <span className="text-foreground font-medium">Macro + Micro + Fundamental (20%) + Technical (15%) + Valuation (15%) + Earnings (15%) + Macro (15%) + Sector (10%) + Flow (5%) + Catalyst (5%)</span> to identify asymmetric 4–6 month risk/reward opportunities.
          </p>
        </div>

        {/* Global Macro Regime Indicators Quick Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="panel px-3 py-2 flex items-center gap-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">India RBI Repo</p>
              <p className="font-semibold text-foreground font-mono">{GLOBAL_MACRO_SNAPSHOT.india.rbiRepoRate}</p>
            </div>
            <div className="border-l border-border pl-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">US Fed Funds</p>
              <p className="font-semibold text-foreground font-mono">{GLOBAL_MACRO_SNAPSHOT.usa.fedFundsRate}</p>
            </div>
            <div className="border-l border-border pl-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Crude Brent</p>
              <p className="font-semibold text-foreground font-mono">{GLOBAL_MACRO_SNAPSHOT.global.brentCrude}</p>
            </div>
            <div className="border-l border-border pl-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Gold Spot</p>
              <p className="font-semibold text-gold font-mono">{GLOBAL_MACRO_SNAPSHOT.global.goldSpot}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. QUICK SEARCH & UNIVERSE CONTROLS ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-lg border border-border/80">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Company, Ticker (e.g. RELIANCE, NVDA, HDFCBANK, MSFT, HAL, TRENT)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Country Filter Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">Universe:</span>
          {(['ALL', 'INDIA', 'USA'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                countryFilter === c
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c === 'ALL' ? '🌍 All (India + US)' : c === 'INDIA' ? '🇮🇳 India (NSE/BSE)' : '🇺🇸 USA (NASDAQ/NYSE)'}
            </button>
          ))}
        </div>

        {/* Signal & Cap Tier Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Signals</option>
            <option value="BUY">BUY</option>
            <option value="ACCUMULATE">ACCUMULATE</option>
            <option value="HOLD">HOLD</option>
            <option value="WAIT">WAIT</option>
            <option value="AVOID">AVOID</option>
            <option value="SELL">SELL</option>
          </select>

          <select
            value={capFilter}
            onChange={(e) => setCapFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Cap Tiers</option>
            <option value="Large-Cap">Large-Cap</option>
            <option value="Mid-Cap">Mid-Cap</option>
            <option value="Small-Cap">Small-Cap</option>
          </select>
        </div>
      </div>

      {/* ── 3. MAIN SECTION NAVIGATION TABS ── */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('SCREENER')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SCREENER'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Layers className="size-4" />
          <span>TOP OPPORTUNITIES — 4–6 MONTHS</span>
          <span className="label-xs rounded-full bg-secondary px-1.5 py-0.2 text-foreground font-mono">
            {filteredStocks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ENGINE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ENGINE'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Scale className="size-4" />
          <span>GLOBAL SCORE ENGINE (WEIGHTED 0–100)</span>
          <span className="label-xs text-gold font-mono">
            {selectedStock.scores.totalScore}/100
          </span>
        </button>

        <button
          onClick={() => setActiveTab('AZ_RESEARCH')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'AZ_RESEARCH'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <BookOpen className="size-4" />
          <span>COMPANY A–Z RESEARCH DOSSIER ({selectedStock.symbol})</span>
        </button>

        <button
          onClick={() => setActiveTab('ENTRY_ENGINE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ENTRY_ENGINE'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Target className="size-4 text-emerald-400" />
          <span className="text-emerald-400 font-bold">ENTRY ENGINE & RISK CALCULATOR</span>
          <span className="label-xs rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 font-mono">
            {selectedStock.entryPlan.riskRewardRatio} R:R
          </span>
        </button>
      </div>

      {/* ── 4. TAB 1: TOP OPPORTUNITIES 4–6 MONTHS SCREENING TABLE ── */}
      {activeTab === 'SCREENER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🏆 Ranked Stock Universe — Strongest Evidence-Based Opportunities</span>
              <span className="label-xs text-muted-foreground">(Sorted by Global Score descending)</span>
            </h2>
            <div className="text-xs text-muted-foreground">
              Click any stock to inspect its full A-Z report & Entry Plan
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3 text-center">Rank</th>
                  <th className="py-2.5 px-3">Stock & Ticker</th>
                  <th className="py-2.5 px-2 text-center">Country</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3">Entry Zone</th>
                  <th className="py-2.5 px-3 text-rose-400">Stop Loss</th>
                  <th className="py-2.5 px-3 text-emerald-400">Target (4-6M)</th>
                  <th className="py-2.5 px-3 text-right">Exp Return %</th>
                  <th className="py-2.5 px-3 text-right">Risk %</th>
                  <th className="py-2.5 px-2 text-center font-mono">R:R</th>
                  <th className="py-2.5 px-2 text-center" title="Fundamental (20%)">Fund.</th>
                  <th className="py-2.5 px-2 text-center" title="Technical (15%)">Tech.</th>
                  <th className="py-2.5 px-2 text-center" title="Macro (15%)">Macro</th>
                  <th className="py-2.5 px-2 text-center" title="Earnings (15%)">Earn.</th>
                  <th className="py-2.5 px-2 text-center" title="Valuation (15%)">Val.</th>
                  <th className="py-2.5 px-3 text-center font-bold">Global Score</th>
                  <th className="py-2.5 px-3 text-center">Signal</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStocks.map((stock, idx) => {
                  const isSelected = stock.id === selectedStockId;
                  const sym = stock.country === 'INDIA' ? '₹' : '$';
                  return (
                    <tr
                      key={stock.id}
                      onClick={() => setSelectedStockId(stock.id)}
                      className={`transition-colors cursor-pointer hover:bg-secondary/60 ${
                        isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-muted-foreground">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{stock.name}</span>
                          <span className="label-xs rounded bg-secondary px-1.5 py-0.2 text-[10px] font-mono text-primary">
                            {stock.symbol}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{stock.exchange}</span>
                          <span>•</span>
                          <span>{stock.index}</span>
                          <span>•</span>
                          <span>MCap: {stock.marketCapStr}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-sm">
                        {stock.country === 'INDIA' ? '🇮🇳' : '🇺🇸'}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {stock.sector}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                        {sym}{stock.cmp.toFixed(2)}
                        <span className={`block text-[10px] ${stock.changePct24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stock.changePct24h >= 0 ? '+' : ''}{stock.changePct24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {stock.entryPlan.entryZone.primary}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-rose-400 font-semibold">
                        {stock.entryPlan.stopLoss.formatted}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-emerald-400 font-semibold">
                        {stock.entryPlan.target2.formatted}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        +{stock.entryPlan.expectedReturnPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">
                        -{stock.entryPlan.riskPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-gold font-semibold">
                        {stock.entryPlan.riskRewardRatio}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {stock.scores.fundamentalQuality}/20
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {stock.scores.technicalStructure}/15
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {stock.scores.macroEnvironment}/15
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {stock.scores.earningsGrowth}/15
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {stock.scores.valuation}/15
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono text-sm font-extrabold ${getScoreColor(stock.scores.totalScore)}`}>
                          {stock.scores.totalScore}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">/100</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold border ${getSignalBadge(stock.azResearch.finalVerdict.signal)}`}>
                          {stock.azResearch.finalVerdict.signal}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockId(stock.id);
                            setActiveTab('ENTRY_ENGINE');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded transition-all cursor-pointer"
                        >
                          Trade Setup 🎯
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. TAB 2: GLOBAL SCORE ENGINE (WEIGHTED BREAKDOWN) ── */}
      {activeTab === 'ENGINE' && (
        <div className="space-y-6">
          {/* Active Stock Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 panel p-4 border-l-4 border-l-primary">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedStock.country === 'INDIA' ? '🇮🇳' : '🇺🇸'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground font-display">{selectedStock.name}</h2>
                  <span className="label-xs rounded bg-primary/20 text-primary font-mono font-bold px-2 py-0.5">
                    {selectedStock.symbol}
                  </span>
                  <span className={`label-xs rounded font-bold px-2 py-0.5 border ${getSignalBadge(selectedStock.azResearch.finalVerdict.signal)}`}>
                    {selectedStock.azResearch.finalVerdict.signal}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedStock.sector} • {selectedStock.exchange} • Current Price: <span className="font-mono font-semibold text-foreground">{currencySymbol}{selectedStock.cmp}</span> ({selectedStock.changePct24h >= 0 ? '+' : ''}{selectedStock.changePct24h}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="label-xs text-muted-foreground">WEIGHTED GLOBAL SCORE</span>
                <p className={`text-3xl font-mono font-extrabold ${getScoreColor(selectedStock.scores.totalScore)}`}>
                  {selectedStock.scores.totalScore} <span className="text-sm text-muted-foreground">/ 100</span>
                </p>
              </div>
              <div className="text-right border-l border-border pl-4">
                <span className="label-xs text-muted-foreground">CONFIDENCE SCORE</span>
                <p className="text-2xl font-mono font-bold text-primary">
                  {selectedStock.entryPlan.confidenceScore}%
                </p>
              </div>
            </div>
          </div>

          {/* 8-Pillar Weighted Score Breakdown Grid */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>8-Pillar Scoring Weights & Contribution Matrix</span>
              <span className="text-gold font-mono">100% Normalized Evidence Weighting</span>
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Fundamental Quality (20%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-emerald-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">1. Fundamental Quality</span>
                  <span className="label-xs text-emerald-400 font-mono font-bold">20% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.fundamentalQuality}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 20.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.fundamentalQuality / 20) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Revenue, EBITDA, FCF conversion, ROE ({selectedStock.azResearch.profitability.roe}), ROCE ({selectedStock.azResearch.profitability.roce}), Debt/Equity ({selectedStock.azResearch.debt.debtToEquity}).
                </p>
              </div>

              {/* 2. Earnings & Growth (15%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-cyan-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">2. Earnings & Growth</span>
                  <span className="label-xs text-cyan-400 font-mono font-bold">15% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.earningsGrowth}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 15.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.earningsGrowth / 15) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  YoY Net Profit ({selectedStock.azResearch.earnings.earningsGrowthYoY}), Beat/Miss ({selectedStock.azResearch.earnings.latestQuarterBeat}), Forward Guidance, Next: {selectedStock.azResearch.earnings.earningsDate}.
                </p>
              </div>

              {/* 3. Valuation (15%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-amber-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">3. Relative Valuation</span>
                  <span className="label-xs text-amber-400 font-mono font-bold">15% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.valuation}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 15.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.valuation / 15) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  P/E: {selectedStock.azResearch.valuation.pe}x (Sector: {selectedStock.azResearch.valuation.sectorPe}x), PEG: {selectedStock.azResearch.valuation.peg}, Rating: {selectedStock.azResearch.valuation.rating}.
                </p>
              </div>

              {/* 4. Technical Structure (15%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-purple-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">4. Technical Structure</span>
                  <span className="label-xs text-purple-400 font-mono font-bold">15% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.technicalStructure}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 15.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.technicalStructure / 15) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Price structure over indicator lag. 50/200 EMA alignment, RSI {selectedStock.azResearch.technicalSetup.rsi}, Weekly Higher Highs.
                </p>
              </div>

              {/* 5. Macro Environment (15%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-blue-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">5. Macro Environment</span>
                  <span className="label-xs text-blue-400 font-mono font-bold">15% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.macroEnvironment}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 15.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.macroEnvironment / 15) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {selectedStock.country === 'INDIA'
                    ? `RBI: ${GLOBAL_MACRO_SNAPSHOT.india.rbiRepoRate}, CPI: ${GLOBAL_MACRO_SNAPSHOT.india.cpiInflation}, DII Flows: ${GLOBAL_MACRO_SNAPSHOT.india.diiFlowsMonth}`
                    : `Fed: ${GLOBAL_MACRO_SNAPSHOT.usa.fedFundsRate}, PCE: ${GLOBAL_MACRO_SNAPSHOT.usa.corePce}, 10Y: ${GLOBAL_MACRO_SNAPSHOT.usa.treasury10y}`}
                </p>
              </div>

              {/* 6. Sector Strength (10%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-teal-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">6. Sector Strength</span>
                  <span className="label-xs text-teal-400 font-mono font-bold">10% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.sectorStrength}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 10.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.sectorStrength / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sector: {selectedStock.sector} • Industry demand & institutional sector rotation favorability.
                </p>
              </div>

              {/* 7. Market Flow & Sentiment (5%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-indigo-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">7. Flow & Sentiment</span>
                  <span className="label-xs text-indigo-400 font-mono font-bold">5% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.flowSentiment}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 5.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(selectedStock.scores.flowSentiment / 5) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Institutional: {selectedStock.azResearch.insiderActivity.institutionalTrend} • Delivery volume & options skew.
                </p>
              </div>

              {/* 8. Risk & Catalyst (5%) */}
              <div className="panel p-4 space-y-2 border-t-2 border-t-gold">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">8. Risk & Catalyst</span>
                  <span className="label-xs text-gold font-mono font-bold">5% Weight</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-extrabold text-foreground">{selectedStock.scores.riskCatalyst}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 5.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${(selectedStock.scores.riskCatalyst / 5) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  X-Factor Catalyst: {selectedStock.azResearch.xFactor.catalyst.slice(0, 70)}...
                </p>
              </div>
            </div>
          </div>

          {/* Institutional Macro Transmission Analysis Card */}
          <div className="panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              <span>Macro Transmission Sensitivity Analysis for {selectedStock.name}</span>
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div className="bg-secondary/40 p-3 rounded border border-border/80">
                <span className="text-muted-foreground font-semibold uppercase text-[10px] block">Interest Rates & Yields</span>
                <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.interestRates}</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded border border-border/80">
                <span className="text-muted-foreground font-semibold uppercase text-[10px] block">Currency & FX (USD/INR)</span>
                <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.currencyFx}</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded border border-border/80">
                <span className="text-muted-foreground font-semibold uppercase text-[10px] block">Commodity & Energy (Crude Oil)</span>
                <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.commodityEnergy}</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded border border-border/80">
                <span className="text-muted-foreground font-semibold uppercase text-[10px] block">Inflation & Recession Resilience</span>
                <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.inflationRecession}</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded border border-border/80 sm:col-span-2">
                <span className="text-muted-foreground font-semibold uppercase text-[10px] block">Global Liquidity & Institutional Inflows</span>
                <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.liquidityExpansion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TAB 3: COMPANY A–Z RESEARCH DOSSIER ── */}
      {activeTab === 'AZ_RESEARCH' && (
        <div className="space-y-6">
          {/* Header of A-Z Dossier */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 panel p-4 bg-gradient-to-r from-card to-secondary/30">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-foreground">{selectedStock.name} ({selectedStock.symbol})</h2>
                <span className={`label-xs font-bold rounded px-2 py-0.5 border ${getSignalBadge(selectedStock.azResearch.finalVerdict.signal)}`}>
                  {selectedStock.azResearch.finalVerdict.signal}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete 26-Letter Institutional Research Dossier • 4–6 Month Investment Horizon
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Stock:</span>
              <select
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-card border border-border rounded text-foreground font-mono font-semibold"
              >
                {INSTITUTIONAL_STOCKS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.country === 'INDIA' ? '🇮🇳' : '🇺🇸'} {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Letter Navigation Bar (A to Z Pills) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border">
            {azChapters.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setSelectedAZLetter(ch.key)}
                className={`size-8 shrink-0 rounded flex items-center justify-center font-mono text-xs font-bold transition-all cursor-pointer ${
                  selectedAZLetter === ch.key
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                title={`${ch.key} — ${ch.title}`}
              >
                {ch.key}
              </button>
            ))}
          </div>

          {/* Selected Chapter Display Card */}
          <div className="panel p-6 space-y-4 border-t-2 border-t-primary">
            {/* Header of selected letter */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-mono font-bold text-base">
                  {selectedAZLetter}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>{azChapters.find((c) => c.key === selectedAZLetter)?.title}</span>
                    <span>{azChapters.find((c) => c.key === selectedAZLetter)?.icon}</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Section {selectedAZLetter} of Company A–Z Institutional Investigation
                  </p>
                </div>
              </div>

              {/* Prev / Next chapter controls */}
              <div className="flex items-center gap-1">
                <button
                  disabled={selectedAZLetter === 'A'}
                  onClick={() => {
                    const idx = azChapters.findIndex((c) => c.key === selectedAZLetter);
                    if (idx > 0) setSelectedAZLetter(azChapters[idx - 1].key);
                  }}
                  className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded disabled:opacity-40 cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  disabled={selectedAZLetter === 'Z'}
                  onClick={() => {
                    const idx = azChapters.findIndex((c) => c.key === selectedAZLetter);
                    if (idx < azChapters.length - 1) setSelectedAZLetter(azChapters[idx + 1].key);
                  }}
                  className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded disabled:opacity-40 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Letter Content Rendering */}
            <div className="text-xs text-foreground space-y-4">
              {/* A — BUSINESS */}
              {selectedAZLetter === 'A' && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-slate-200">
                    {selectedStock.azResearch.business.summary}
                  </p>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Revenue Sources Breakdown</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedStock.azResearch.business.revenueSources.map((r) => (
                        <div key={r.segment} className="bg-secondary/40 p-2.5 rounded border border-border flex items-center justify-between">
                          <span>{r.segment}</span>
                          <span className="font-mono font-bold text-primary">{r.sharePct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-secondary/30 p-3 rounded border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Domestic vs International Exposure</span>
                      <p className="mt-1 font-medium">{selectedStock.azResearch.business.domesticVsIntl}</p>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Core Competitive Advantage</span>
                      <p className="mt-1 font-medium">{selectedStock.azResearch.business.coreAdvantage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* B — BUSINESS MODEL */}
              {selectedAZLetter === 'B' && (
                <div className="space-y-3">
                  <div className="bg-secondary/30 p-3.5 rounded border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">How the company makes money</span>
                    <p className="mt-1 text-sm text-slate-200">{selectedStock.azResearch.businessModel.description}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Recurring vs Cyclical</span>
                      <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.businessModel.recurringVsCyclical}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Customer Concentration</span>
                      <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.businessModel.customerConcentration}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Pricing Power</span>
                      <p className="mt-1 font-medium text-emerald-400">{selectedStock.azResearch.businessModel.pricingPower}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* C — COMPETITIVE ADVANTAGE */}
              {selectedAZLetter === 'C' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-secondary/30 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Economic Moat</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.competitiveAdvantage.moat}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Brand Strength</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.competitiveAdvantage.brandStrength}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Proprietary Technology</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.competitiveAdvantage.technology}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Distribution & Scale</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.competitiveAdvantage.distribution}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Network Effects & Lock-in</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.competitiveAdvantage.networkEffects}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Market Share</span>
                    <p className="mt-1 font-medium text-primary font-bold">{selectedStock.azResearch.competitiveAdvantage.marketShare}</p>
                  </div>
                </div>
              )}

              {/* D — DEBT */}
              {selectedAZLetter === 'D' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Debt</span>
                    <p className="mt-1 text-base font-mono font-bold">{selectedStock.azResearch.debt.totalDebt}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Net Debt Position</span>
                    <p className="mt-1 text-base font-mono font-bold text-emerald-400">{selectedStock.azResearch.debt.netDebt}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Debt / Equity Ratio</span>
                    <p className="mt-1 text-base font-mono font-bold">{selectedStock.azResearch.debt.debtToEquity}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border sm:col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Interest Coverage</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.debt.interestCoverage}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Refinancing Risk</span>
                    <p className="mt-1 font-bold text-emerald-400">{selectedStock.azResearch.debt.refinancingRisk}</p>
                  </div>
                </div>
              )}

              {/* E — EARNINGS */}
              {selectedAZLetter === 'E' && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Revenue (TTM)</span>
                      <p className="mt-1 text-base font-mono font-bold">{selectedStock.azResearch.earnings.revenue}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Net Profit (TTM)</span>
                      <p className="mt-1 text-base font-mono font-bold text-emerald-400">{selectedStock.azResearch.earnings.netProfit}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Operating Margin</span>
                      <p className="mt-1 text-base font-mono font-bold">{selectedStock.azResearch.earnings.operatingMargin}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">YoY Profit Growth</span>
                      <p className="mt-1 text-base font-mono font-bold text-emerald-400">{selectedStock.azResearch.earnings.earningsGrowthYoY}</p>
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Latest Quarter Result</span>
                      <p className="font-bold text-emerald-400 text-sm">{selectedStock.azResearch.earnings.latestQuarterBeat} CONSENSUS</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Upcoming Earnings Announcement</span>
                      <p className="font-mono font-bold text-foreground text-sm">{selectedStock.azResearch.earnings.earningsDate}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* F — FREE CASH FLOW */}
              {selectedAZLetter === 'F' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Operating Cash Flow</span>
                    <p className="mt-1 text-base font-mono font-bold">{selectedStock.azResearch.freeCashFlow.operatingCashFlow}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Annual Capex</span>
                    <p className="mt-1 text-base font-mono font-bold">{selectedStock.azResearch.freeCashFlow.capex}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Free Cash Flow (FCF)</span>
                    <p className="mt-1 text-base font-mono font-bold text-emerald-400">{selectedStock.azResearch.freeCashFlow.freeCashFlow}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border sm:col-span-3">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">FCF Quality & Conversion</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.freeCashFlow.fcfConversion} • {selectedStock.azResearch.freeCashFlow.quality}</p>
                  </div>
                </div>
              )}

              {/* G — GROWTH */}
              {selectedAZLetter === 'G' && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Historical 3Y CAGR</span>
                      <p className="mt-1 font-mono font-bold text-base">{selectedStock.azResearch.growth.historical3yCAGR}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Expected Forward Growth</span>
                      <p className="mt-1 font-mono font-bold text-base text-emerald-400">{selectedStock.azResearch.growth.expectedForwardGrowth}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Addressable Market (TAM)</span>
                      <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.growth.tam}</p>
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-3.5 rounded border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Primary Expansion Vectors</span>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-slate-200">
                      {selectedStock.azResearch.growth.expansionVectors.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* H — HOLDINGS */}
              {selectedAZLetter === 'H' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Promoter / Insider Stake</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.holdings.promoterOrInsiders}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Institutional Ownership</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.holdings.institutionalOwnership}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">FII / Foreign Institutional Holdings</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.holdings.fiiOrForeignHoldings}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">DII / Mutual Funds Holdings</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.holdings.diiOrMutualFunds}</p>
                  </div>
                </div>
              )}

              {/* I — INSIDER & INSTITUTIONAL ACTIVITY */}
              {selectedAZLetter === 'I' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Insider Trend</span>
                    <p className="mt-1 font-bold text-base text-foreground">{selectedStock.azResearch.insiderActivity.insiderTrend}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Institutional Flow Bias</span>
                    <p className="mt-1 font-bold text-base text-emerald-400">{selectedStock.azResearch.insiderActivity.institutionalTrend}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Recent Institutional Deals</span>
                    <p className="mt-1 text-[11px] text-slate-200">{selectedStock.azResearch.insiderActivity.recentDeals}</p>
                  </div>
                </div>
              )}

              {/* J — JUDGEMENT */}
              {selectedAZLetter === 'J' && (
                <div className="space-y-3 bg-secondary/30 p-4 rounded border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <span className="label-xs uppercase font-bold text-emerald-400">Independent Research Conclusion</span>
                    <span className="label-xs rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-bold">
                      {selectedStock.azResearch.judgement.convictionLevel}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {selectedStock.azResearch.judgement.verdict}
                  </p>
                  <p className="text-xs text-muted-foreground border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Evidence Base: </span>
                    {selectedStock.azResearch.judgement.evidenceSummary}
                  </p>
                </div>
              )}

              {/* K — KEY RISKS */}
              {selectedAZLetter === 'K' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-rose-400 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    <span>Top Institutional Downside Risks & Invalidation Triggers</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedStock.azResearch.keyRisks.map((risk, idx) => (
                      <div key={idx} className="bg-rose-500/10 border border-rose-500/30 p-3 rounded text-slate-200 flex items-start gap-2.5">
                        <span className="size-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* L — LIQUIDITY */}
              {selectedAZLetter === 'L' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Daily Dollar/Rupee Turnover</span>
                    <p className="mt-1 font-mono font-bold text-base text-foreground">{selectedStock.azResearch.liquidity.dailyVolume}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">30-Day Average Volume</span>
                    <p className="mt-1 font-mono font-bold text-base text-foreground">{selectedStock.azResearch.liquidity.avgVolume30d}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Institutional Tradability</span>
                    <p className="mt-1 font-bold text-emerald-400">{selectedStock.azResearch.liquidity.institutionalTradability}</p>
                  </div>
                </div>
              )}

              {/* M — MACRO SENSITIVITY */}
              {selectedAZLetter === 'M' && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Interest Rates & Yields</span>
                      <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.interestRates}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Currency & FX</span>
                      <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.currencyFx}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Commodity & Energy Prices</span>
                      <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.commodityEnergy}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Inflation & Recession Cycle</span>
                      <p className="mt-1 text-slate-200">{selectedStock.azResearch.macroSensitivity.inflationRecession}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* N — NEWS (FACT / INTERPRETATION / SPECULATION) */}
              {selectedAZLetter === 'N' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="label-xs rounded bg-primary/20 text-primary px-2 py-0.5 font-bold">FACT</span>
                    <span className="label-xs text-muted-foreground">vs</span>
                    <span className="label-xs rounded bg-cyan-500/20 text-cyan-400 px-2 py-0.5 font-bold">MARKET INTERPRETATION</span>
                    <span className="label-xs text-muted-foreground">vs</span>
                    <span className="label-xs rounded bg-amber-500/20 text-amber-400 px-2 py-0.5 font-bold">SPECULATION</span>
                  </div>
                  {selectedStock.azResearch.news.map((n, i) => (
                    <div key={i} className="panel p-4 space-y-2 border-l-2 border-l-primary">
                      <h4 className="font-bold text-foreground text-sm">{n.headline}</h4>
                      <div className="grid gap-2 sm:grid-cols-3 text-[11px] pt-1">
                        <div className="bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase block">1. Verified Fact</span>
                          <p className="mt-0.5 text-slate-200">{n.fact}</p>
                        </div>
                        <div className="bg-cyan-500/10 p-2.5 rounded border border-cyan-500/20">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase block">2. Market Interpretation</span>
                          <p className="mt-0.5 text-slate-200">{n.marketInterpretation}</p>
                        </div>
                        <div className="bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                          <span className="text-[10px] font-bold text-amber-400 uppercase block">3. Speculation / Rumor</span>
                          <p className="mt-0.5 text-slate-200">{n.speculation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* O — ORDER & PRICE STRUCTURE */}
              {selectedAZLetter === 'O' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Institutional Demand Zones</span>
                    <p className="mt-1 font-mono font-bold text-emerald-400">{selectedStock.azResearch.orderStructure.demandZones}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Overhead Supply Zones</span>
                    <p className="mt-1 font-mono font-bold text-rose-400">{selectedStock.azResearch.orderStructure.supplyZones}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Key Technical Support</span>
                    <p className="mt-1 font-mono text-slate-200">{selectedStock.azResearch.orderStructure.keySupport}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Key Technical Resistance</span>
                    <p className="mt-1 font-mono text-slate-200">{selectedStock.azResearch.orderStructure.keyResistance}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border sm:col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Institutional Volume Point of Control (POC)</span>
                    <p className="mt-1 font-mono font-bold text-gold">{selectedStock.azResearch.orderStructure.institutionalVolumeNodes}</p>
                  </div>
                </div>
              )}

              {/* P — PROFITABILITY */}
              {selectedAZLetter === 'P' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Return on Equity (ROE)</span>
                    <p className="mt-1 font-mono font-bold text-lg text-emerald-400">{selectedStock.azResearch.profitability.roe}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">ROCE</span>
                    <p className="mt-1 font-mono font-bold text-lg text-emerald-400">{selectedStock.azResearch.profitability.roce}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">ROIC</span>
                    <p className="mt-1 font-mono font-bold text-lg text-emerald-400">{selectedStock.azResearch.profitability.roic}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Gross Margin</span>
                    <p className="mt-1 font-mono font-bold">{selectedStock.azResearch.profitability.grossMargin}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Operating Margin</span>
                    <p className="mt-1 font-mono font-bold">{selectedStock.azResearch.profitability.operatingMargin}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Net Margin</span>
                    <p className="mt-1 font-mono font-bold">{selectedStock.azResearch.profitability.netMargin}</p>
                  </div>
                </div>
              )}

              {/* Q — QUALITY */}
              {selectedAZLetter === 'Q' && (
                <div className="bg-secondary/30 p-4 rounded border-l-4 border-l-emerald-500 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Business Quality Rating</span>
                    <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono text-sm">
                      {selectedStock.azResearch.quality.rating}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{selectedStock.azResearch.quality.justification}</p>
                </div>
              )}

              {/* R — RELATIVE STRENGTH */}
              {selectedAZLetter === 'R' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">RS vs Benchmark Index</span>
                    <p className="mt-1 text-slate-200 font-medium">{selectedStock.azResearch.relativeStrength.vsBenchmark}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">RS vs Sector Peers</span>
                    <p className="mt-1 text-slate-200 font-medium">{selectedStock.azResearch.relativeStrength.vsSector}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Relative Strength Rating</span>
                    <p className="mt-1 font-mono font-extrabold text-2xl text-primary">{selectedStock.azResearch.relativeStrength.rsRating} / 99</p>
                  </div>
                </div>
              )}

              {/* S — SENTIMENT */}
              {selectedAZLetter === 'S' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Wall Street / Dalal Street Consensus</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.sentiment.analystConsensus}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Options Positioning Skew</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.sentiment.optionsFlowSkew}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Institutional Flow Bias</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.sentiment.institutionalStance}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Retail Positioning</span>
                    <p className="mt-1 font-medium text-slate-200">{selectedStock.azResearch.sentiment.retailSentiment}</p>
                  </div>
                </div>
              )}

              {/* T — TECHNICAL SETUP */}
              {selectedAZLetter === 'T' && (
                <div className="space-y-3">
                  <div className="bg-secondary/30 p-3.5 rounded border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-primary">Setup Structure</span>
                      <span className="label-xs rounded bg-primary/20 text-primary px-2 py-0.5 font-bold">
                        {selectedStock.azResearch.technicalSetup.setupName}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedStock.azResearch.technicalSetup.primaryTrend}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedStock.azResearch.technicalSetup.structure}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Moving Averages Alignment</span>
                      <p className="mt-1 text-[11px] font-medium text-slate-200">{selectedStock.azResearch.technicalSetup.movingAverages}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">RSI Indicator</span>
                      <p className="mt-1 font-mono font-bold text-base text-foreground">{selectedStock.azResearch.technicalSetup.rsi}</p>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded border border-border">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">MACD Momentum</span>
                      <p className="mt-1 text-[11px] font-medium text-emerald-400">{selectedStock.azResearch.technicalSetup.macd}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* U — UPSIDE */}
              {selectedAZLetter === 'U' && (
                <div className="space-y-3">
                  <div className="bg-secondary/40 p-3.5 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Calculation Methodology</span>
                    <p className="mt-1 text-xs text-slate-200">{selectedStock.azResearch.upside.calculationBasis}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/30">
                      <span className="text-[10px] font-bold uppercase text-emerald-400">Base Scenario (4–6 Months)</span>
                      <p className="mt-1 font-mono font-bold text-base text-emerald-400">{selectedStock.azResearch.upside.baseScenario}</p>
                    </div>
                    <div className="bg-cyan-500/10 p-3 rounded border border-cyan-500/30">
                      <span className="text-[10px] font-bold uppercase text-cyan-400">Bull Case Expansion</span>
                      <p className="mt-1 font-mono font-bold text-base text-cyan-400">{selectedStock.azResearch.upside.bullScenario}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* V — VALUATION */}
              {selectedAZLetter === 'V' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Valuation Verdict</span>
                    <p className="mt-1 font-bold text-base text-emerald-400">{selectedStock.azResearch.valuation.rating}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Trailing P/E vs Sector</span>
                    <p className="mt-1 font-mono font-bold text-base">{selectedStock.azResearch.valuation.pe}x vs {selectedStock.azResearch.valuation.sectorPe}x</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">PEG Ratio</span>
                    <p className="mt-1 font-mono font-bold text-base text-primary">{selectedStock.azResearch.valuation.peg}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border sm:col-span-3">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Historical Context</span>
                    <p className="mt-1 text-slate-200">{selectedStock.azResearch.valuation.historicalContext}</p>
                  </div>
                </div>
              )}

              {/* W — WHY NOW? */}
              {selectedAZLetter === 'W' && (
                <div className="bg-secondary/30 p-4 rounded border-l-4 border-l-gold space-y-2">
                  <span className="text-xs font-bold uppercase text-gold">Why Enter Now vs Waiting?</span>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{selectedStock.azResearch.whyNow.timingRationale}</p>
                  <p className="text-xs text-muted-foreground border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Immediate Trigger: </span>
                    {selectedStock.azResearch.whyNow.immediateTrigger}
                  </p>
                </div>
              )}

              {/* X — X-FACTOR */}
              {selectedAZLetter === 'X' && (
                <div className="bg-secondary/30 p-4 rounded border-l-4 border-l-cyan-500 space-y-2">
                  <span className="text-xs font-bold uppercase text-cyan-400">Strongest Potential Catalyst</span>
                  <h4 className="text-sm font-bold text-foreground">{selectedStock.azResearch.xFactor.catalyst}</h4>
                  <p className="text-xs text-slate-300">{selectedStock.azResearch.xFactor.impactPotential}</p>
                </div>
              )}

              {/* Y — YIELD & SHAREHOLDER RETURN */}
              {selectedAZLetter === 'Y' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Dividend Yield</span>
                    <p className="mt-1 font-mono font-bold text-base">{selectedStock.azResearch.yieldReturn.dividendYield}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Buyback Yield</span>
                    <p className="mt-1 font-mono font-bold text-base">{selectedStock.azResearch.yieldReturn.buybackYield}</p>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded border border-border">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Return Forecast</span>
                    <p className="mt-1 font-mono font-bold text-base text-emerald-400">{selectedStock.azResearch.yieldReturn.totalReturnForecast}</p>
                  </div>
                </div>
              )}

              {/* Z — FINAL VERDICT */}
              {selectedAZLetter === 'Z' && (
                <div className="panel p-5 bg-gradient-to-r from-card via-secondary/20 to-primary/5 space-y-3 border-2 border-primary/50">
                  <div className="flex items-center justify-between">
                    <span className="label-xs font-bold uppercase tracking-wider text-muted-foreground">Final Investment Recommendation</span>
                    <span className={`px-4 py-1.5 rounded text-sm font-extrabold border ${getSignalBadge(selectedStock.azResearch.finalVerdict.signal)}`}>
                      {selectedStock.azResearch.finalVerdict.signal}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {selectedStock.azResearch.finalVerdict.summary}
                  </p>
                  <p className="text-xs text-gold font-mono font-medium border-t border-border pt-2">
                    {selectedStock.azResearch.finalVerdict.horizonNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. TAB 4: ENTRY ENGINE & POSITION SIZING CALCULATOR ── */}
      {activeTab === 'ENTRY_ENGINE' && (
        <div className="space-y-6">
          {/* Top Level Summary Bar */}
          <div className="panel p-4 bg-gradient-to-r from-card via-secondary/20 to-emerald-950/20 border-l-4 border-l-emerald-500 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedStock.country === 'INDIA' ? '🇮🇳' : '🇺🇸'}</span>
                <h2 className="text-lg font-bold text-foreground font-display">{selectedStock.name} ({selectedStock.symbol})</h2>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSignalBadge(selectedStock.azResearch.finalVerdict.signal)}`}>
                  {selectedStock.azResearch.finalVerdict.signal}
                </span>
                <span className="label-xs rounded bg-gold/20 text-gold px-2 py-0.5 font-bold font-mono">
                  CONFIDENCE: {selectedStock.entryPlan.confidenceScore}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current Price: <span className="font-mono font-bold text-foreground">{currencySymbol}{selectedStock.cmp}</span> • Primary Horizon: 4–6 Months • Risk/Reward: <span className="font-mono font-bold text-gold">{selectedStock.entryPlan.riskRewardRatio}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="label-xs text-muted-foreground">EXPECTED 4–6M RETURN</span>
                <p className="text-2xl font-mono font-extrabold text-emerald-400">
                  +{selectedStock.entryPlan.expectedReturnPct.toFixed(1)}%
                </p>
              </div>
              <div className="text-right border-l border-border pl-3">
                <span className="label-xs text-muted-foreground">STOP LOSS RISK</span>
                <p className="text-2xl font-mono font-extrabold text-rose-400">
                  -{selectedStock.entryPlan.riskPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Interactive TradingView Chart Preview */}
          <div className="panel p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="size-4 text-primary" />
                <span>Live Interactive TradingView Chart ({selectedStock.tradingViewSymbol})</span>
              </span>
              <span className="label-xs text-muted-foreground">4H / Daily Setup View</span>
            </div>
            <div className="h-[420px] rounded overflow-hidden border border-border">
              <TradingViewWidget
                symbol={selectedStock.tradingViewSymbol}
                theme="dark"
                interval="D"
                autosize
              />
            </div>
          </div>

          {/* Precise Execution Targets Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Entry Zone */}
            <div className="panel p-4 space-y-2 border-t-2 border-t-primary">
              <span className="label-xs font-bold uppercase text-primary">1. ENTRY ZONE</span>
              <p className="text-xl font-mono font-extrabold text-foreground">{selectedStock.entryPlan.entryZone.primary}</p>
              <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border">
                <p><span className="text-slate-300 font-semibold">Secondary Dip:</span> {selectedStock.entryPlan.entryZone.secondaryDip}</p>
                <p><span className="text-slate-300 font-semibold">Full Range:</span> {selectedStock.entryPlan.entryZone.range}</p>
              </div>
            </div>

            {/* Target 1 (1–2 Months) */}
            <div className="panel p-4 space-y-2 border-t-2 border-t-emerald-400">
              <div className="flex items-center justify-between">
                <span className="label-xs font-bold uppercase text-emerald-400">TARGET 1 (TP1)</span>
                <span className="label-xs text-muted-foreground font-mono">1–2 Months</span>
              </div>
              <p className="text-xl font-mono font-extrabold text-emerald-400">{selectedStock.entryPlan.target1.formatted}</p>
              <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border">
                <p><span className="text-emerald-400 font-bold font-mono">+{selectedStock.entryPlan.target1.expectedReturnPct}%</span> Return</p>
                <p className="text-slate-300 truncate">{selectedStock.entryPlan.target1.rationale}</p>
              </div>
            </div>

            {/* Target 2 (4–6 Months - Primary) */}
            <div className="panel p-4 space-y-2 border-t-2 border-t-gold bg-gold/5">
              <div className="flex items-center justify-between">
                <span className="label-xs font-bold uppercase text-gold">TARGET 2 (BASE 4–6M) ⭐</span>
                <span className="label-xs text-gold font-mono font-bold">PRIMARY</span>
              </div>
              <p className="text-xl font-mono font-extrabold text-gold">{selectedStock.entryPlan.target2.formatted}</p>
              <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border">
                <p><span className="text-gold font-bold font-mono">+{selectedStock.entryPlan.target2.expectedReturnPct}%</span> Return</p>
                <p className="text-slate-300 truncate">{selectedStock.entryPlan.target2.rationale}</p>
              </div>
            </div>

            {/* Target 3 (6+ Months Expansion) */}
            <div className="panel p-4 space-y-2 border-t-2 border-t-cyan-400">
              <div className="flex items-center justify-between">
                <span className="label-xs font-bold uppercase text-cyan-400">TARGET 3 (BLUE-SKY)</span>
                <span className="label-xs text-muted-foreground font-mono">6+ Months</span>
              </div>
              <p className="text-xl font-mono font-extrabold text-cyan-400">{selectedStock.entryPlan.target3.formatted}</p>
              <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border">
                <p><span className="text-cyan-400 font-bold font-mono">+{selectedStock.entryPlan.target3.expectedReturnPct}%</span> Return</p>
                <p className="text-slate-300 truncate">{selectedStock.entryPlan.target3.rationale}</p>
              </div>
            </div>
          </div>

          {/* Stop Loss & Invalidation Rules */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Precise Stop Loss */}
            <div className="panel p-4 space-y-2 border-l-4 border-l-rose-500 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <span className="label-xs font-bold uppercase text-rose-400">STRICT STOP LOSS LEVEL</span>
                <span className="font-mono font-bold text-rose-400">-{selectedStock.entryPlan.stopLoss.pct}% Risk</span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-rose-400">{selectedStock.entryPlan.stopLoss.formatted}</p>
              <p className="text-xs text-slate-300 pt-1 border-t border-border">
                <span className="font-semibold text-foreground">Structural Rationale: </span>
                {selectedStock.entryPlan.stopLoss.structuralLevel}
              </p>
            </div>

            {/* Invalidation Conditions */}
            <div className="panel p-4 space-y-2 border-l-4 border-l-amber-500 bg-amber-500/5">
              <span className="label-xs font-bold uppercase text-amber-400">THESIS INVALIDATION CONDITIONS</span>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                {selectedStock.entryPlan.invalidationConditions.map((cond, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── POSITION SIZING CALCULATOR ── */}
          <div className="panel p-5 space-y-4 border-2 border-primary/40 bg-secondary/20">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Scale className="size-4 text-primary" />
                <span>Institutional Risk & Position Sizing Engine</span>
              </h3>
              <span className="label-xs text-muted-foreground">Never risk more than your predefined risk limit</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Trading / Portfolio Capital ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={tradingCapital}
                  onChange={(e) => setTradingCapital(Math.max(1000, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Max Risk % Per Trade
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5.0"
                  value={riskPerTradePct}
                  onChange={(e) => setRiskPerTradePct(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="bg-card p-3 rounded border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Max Rupee / Dollar Risk</span>
                <p className="text-base font-mono font-bold text-rose-400">
                  {currencySymbol}{positionCalc.maxRiskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <span className="text-[10px] text-muted-foreground">({riskPerTradePct}% of capital)</span>
              </div>

              <div className="bg-card p-3 rounded border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Optimal Position Size</span>
                <p className="text-base font-mono font-bold text-primary">
                  {positionCalc.sharesToBuy.toLocaleString()} Shares
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Deploy: {currencySymbol}{positionCalc.totalPositionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({positionCalc.capitalDeployedPct.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Calculated Profit PnL Projections */}
            <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-border text-xs">
              <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Gain at Target 1 ({selectedStock.entryPlan.target1.formatted})</span>
                <p className="mt-1 font-mono font-bold text-base text-emerald-400">
                  +{currencySymbol}{positionCalc.profitAtTp1.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="bg-gold/10 p-3 rounded border border-gold/30">
                <span className="text-[10px] uppercase font-bold text-gold">Gain at Target 2 Base ({selectedStock.entryPlan.target2.formatted}) ⭐</span>
                <p className="mt-1 font-mono font-bold text-base text-gold">
                  +{currencySymbol}{positionCalc.profitAtTp2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="bg-cyan-500/10 p-3 rounded border border-cyan-500/20">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Gain at Target 3 Expansion ({selectedStock.entryPlan.target3.formatted})</span>
                <p className="mt-1 font-mono font-bold text-base text-cyan-400">
                  +{currencySymbol}{positionCalc.profitAtTp3.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
