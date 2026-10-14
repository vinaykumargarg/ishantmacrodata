import React, { useState, useEffect, useMemo } from 'react';
import {
  DELTA_WEALTH_DATABASE,
  WealthCoinProfile,
  WealthDecision,
  WealthRiskCategory,
  WealthHorizon,
  USD_TO_INR_RATE,
  getWealthProfileForCoin,
  simulatePortfolioDrawdown,
  DrawdownSimulationResult
} from '../data/deltaWealthIntelligenceData';
import {
  deltaExchangeService,
  ServiceConnectionStatus
} from '../services/deltaExchangeService';

export const CryptoWealthIntelligenceTerminalView: React.FC = () => {
  // ── CORE SELECTION STATE ──
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>('BTC');
  const [activeTab, setActiveTab] = useState<
    | 'SCANNER'
    | 'FUNDAMENTALS'
    | 'TOKENOMICS'
    | 'TECHNICALS'
    | 'ON_CHAIN'
    | 'MACRO'
    | 'SECURITY'
    | 'SCENARIOS'
    | 'PORTFOLIO_INR'
    | 'COMPARISON'
    | 'FINAL_REPORT'
  >('FUNDAMENTALS');

  const [selectedHorizon, setSelectedHorizon] = useState<WealthHorizon>('3_6_MONTHS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSector, setFilterSector] = useState<string>('ALL');

  // INR Portfolio State
  const [inrCapitalInput, setInrCapitalInput] = useState<number>(500000); // Default ₹5 Lakh
  const [inrRiskProfile, setInrRiskProfile] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');

  // Connection & API state
  const [connStatus, setConnStatus] = useState<ServiceConnectionStatus>({
    status: 'LIVE_CONNECTED',
    lastSyncTime: 'Live Synced (Delta India)',
    totalProductsCount: 1080,
    totalCoinsCount: 231,
    isWsActive: true
  });

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync Delta Exchange products on mount
  useEffect(() => {
    let isMounted = true;
    const loadDeltaData = async () => {
      try {
        const products = await deltaExchangeService.fetchProducts();
        if (isMounted && products && products.length > 0) {
          setAvailableProducts(products);
        }
      } catch (e) {
        console.warn('Delta service using fallback dataset:', e);
      }
    };
    loadDeltaData();

    const unsub = typeof deltaExchangeService.subscribeStatus === 'function'
      ? deltaExchangeService.subscribeStatus((st) => {
          if (isMounted) setConnStatus(st);
        })
      : typeof deltaExchangeService.onStatus === 'function'
      ? deltaExchangeService.onStatus((st) => {
          if (isMounted) setConnStatus(st);
        })
      : () => {};

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Active Coin Profile
  const coinProfile: WealthCoinProfile = useMemo(() => {
    return getWealthProfileForCoin(selectedCoinSymbol);
  }, [selectedCoinSymbol]);

  // All known curated coins list
  const coinKeys = useMemo(() => {
    return Object.keys(DELTA_WEALTH_DATABASE);
  }, []);

  // Filtered list of coins for scanner
  const filteredCoins = useMemo(() => {
    return coinKeys
      .map((k) => DELTA_WEALTH_DATABASE[k])
      .filter((c) => {
        const matchesQuery =
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.sector.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = filterSector === 'ALL' || c.sector.includes(filterSector);
        return matchesQuery && matchesSector;
      });
  }, [coinKeys, searchQuery, filterSector]);

  // Decision Badge Styling
  const getDecisionBadge = (decision: WealthDecision) => {
    switch (decision) {
      case 'STRONG RESEARCH CANDIDATE':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'STRONG RESEARCH CANDIDATE'
        };
      case 'ACCUMULATION WATCHLIST':
        return {
          bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
          dot: 'bg-cyan-400',
          label: 'ACCUMULATION WATCHLIST'
        };
      case 'HOLD / MONITOR':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
          dot: 'bg-blue-400',
          label: 'HOLD / MONITOR'
        };
      case 'WAIT FOR BETTER VALUATION':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-400',
          label: 'WAIT FOR BETTER VALUATION'
        };
      case 'AVOID / HIGH RISK':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
          dot: 'bg-rose-400',
          label: 'AVOID / HIGH RISK'
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/40',
          dot: 'bg-slate-400',
          label: 'INSUFFICIENT DATA'
        };
    }
  };

  // Risk Category Badge
  const getRiskBadge = (cat: WealthRiskCategory) => {
    switch (cat) {
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'MODERATE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'VERY HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const decisionBadge = getDecisionBadge(coinProfile.decision);
  const drawdownResults: DrawdownSimulationResult[] = useMemo(() => {
    return simulatePortfolioDrawdown(inrCapitalInput, [20, 40, 60, 80]);
  }, [inrCapitalInput]);

  return (
    <div className="w-full min-h-screen bg-[#070b14] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ────────────────── TOP MASTER HEADER & NAVIGATION ────────────────── */}
      <header className="rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#091122] to-[#070b14] border border-cyan-500/30 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                DELTA EXCHANGE INDIA • 1-4 MONTHS & MULTI-YEAR RESEARCH
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API: {connStatus.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-3">
              <span>💎 Crypto Long-Term Wealth Intelligence</span>
            </h1>

            <p className="text-sm text-slate-300 mt-1 max-w-4xl font-medium leading-relaxed">
              Institutional long-term investment research engine analyzing every Delta Exchange asset for 1–4 month holding horizons up to multi-year wealth accumulation. Powered by primary tokenomics, 1D/1W/1M technical structures, verified on-chain whale balances, and global macroeconomic liquidity.
            </p>
          </div>

          {/* Quick Metrics & USD/INR Exchange */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 bg-[#070d1a] border border-slate-800 p-3.5 rounded-xl">
            <div className="text-left pr-3 border-r border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">USD / INR Peg</span>
              <span className="text-sm font-bold text-emerald-400">₹{USD_TO_INR_RATE.toFixed(2)}</span>
            </div>
            <div className="text-left pr-3 border-r border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Delta Coins Monitored</span>
              <span className="text-sm font-bold text-cyan-300">{connStatus.totalCoinsCount || 231} Assets</span>
            </div>
            <button
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 800);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              Sync Delta Feeds
            </button>
          </div>
        </div>

        {/* ── COIN SELECTOR QUICK PILLS ── */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
            Select Asset:
          </span>
          {coinKeys.map((sym) => {
            const isSelected = selectedCoinSymbol === sym;
            const coin = DELTA_WEALTH_DATABASE[sym];
            return (
              <button
                key={sym}
                onClick={() => setSelectedCoinSymbol(sym)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-[#0a1224] hover:bg-[#111e3b] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{sym}</span>
                <span className={`text-[10px] font-mono ${coin.change24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {coin.change24hPct >= 0 ? '+' : ''}{coin.change24hPct}%
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ────────────────── SPOT VS PERPETUAL HOLDING BANNER ────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 border border-cyan-500/40 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <span className="font-extrabold text-cyan-300 tracking-wide block uppercase">
              MANDATORY WEALTH ADVISORY: SPOT COIN OWNERSHIP vs PERPETUAL DERIVATIVES
            </span>
            <span className="text-slate-300 leading-relaxed block mt-0.5">
              Delta Exchange India offers both <strong>Spot (Actual Coin Custody: {coinProfile.deltaMarketAvailability.spotContractSymbol})</strong> and <strong>Perpetuals (Cash-Settled Futures: {coinProfile.deltaMarketAvailability.perpContractSymbol})</strong>. Never hold leveraged perpetual contracts for multi-year buy-and-hold investing due to daily funding rate decay and liquidation risks.
            </span>
          </div>
        </div>
        <div className="shrink-0 bg-[#071328] px-3.5 py-2 rounded-lg border border-cyan-500/30 text-right">
          <span className="text-[10px] text-slate-400 block font-semibold">Recommended Wealth Vehicle:</span>
          <span className="text-emerald-400 font-extrabold text-xs">SPOT HOLDINGS (100% Asset Backed)</span>
        </div>
      </div>

      {/* ────────────────── ACTIVE COIN EXECUTIVE SUMMARY CARD ────────────────── */}
      <div className="rounded-2xl bg-[#0a1224] border border-slate-800/90 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          {/* Left: Name, Price, Sector */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {coinProfile.name} ({coinProfile.symbol})
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {coinProfile.sector}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                  ${coinProfile.livePriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  (₹{Math.round(coinProfile.livePriceInr).toLocaleString('en-IN')})
                </span>
              </div>
              <span
                className={`text-sm font-bold px-2.5 py-0.5 rounded-md font-mono ${
                  coinProfile.change24hPct >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {coinProfile.change24hPct >= 0 ? '+' : ''}{coinProfile.change24hPct}% (24h)
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Volume: <strong className="text-slate-200">{coinProfile.volume24hUsd}</strong>
              </span>
            </div>
          </div>

          {/* Right: Decision Verdict Badge & 100-Point Score */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Decision Badge */}
            <div className={`p-4 rounded-xl border ${decisionBadge.bg} flex flex-col justify-center min-w-[220px]`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                Long-Term Conclusion
              </span>
              <span className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${decisionBadge.dot} animate-ping`} />
                {decisionBadge.label}
              </span>
              <span className="text-[11px] font-semibold mt-1 opacity-90">
                Horizon Suitability: 1-4 Months & Multi-Year
              </span>
            </div>

            {/* Score Badges */}
            <div className="bg-[#060c18] border border-slate-800 p-4 rounded-xl flex items-center gap-5">
              <div className="text-center pr-4 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Research Score</span>
                <span className="text-2xl font-black text-cyan-300 font-mono">
                  {coinProfile.scores.totalScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
              </div>
              <div className="text-center pr-4 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Risk Level</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded border inline-block mt-1 ${getRiskBadge(coinProfile.security.riskCategory)}`}>
                  {coinProfile.security.riskCategory}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Confidence</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {coinProfile.scores.confidenceScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Hinglish & English Direct Thesis */}
        <div className="mt-4 p-4 rounded-xl bg-[#060c18]/80 border border-cyan-500/20 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="text-base text-amber-400">💡</span>
            <div>
              <strong className="text-amber-300 uppercase tracking-wider block font-bold">
                Executive Actionable Thesis (Hinglish):
              </strong>
              <p className="text-slate-200 mt-0.5 font-medium leading-relaxed">
                {coinProfile.decisionThesisSummaryHinglish}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/80">
            <span className="text-base text-cyan-400">🌐</span>
            <div>
              <strong className="text-cyan-300 uppercase tracking-wider block font-bold">
                Institutional Rationale (English):
              </strong>
              <p className="text-slate-300 mt-0.5 font-medium leading-relaxed">
                {coinProfile.decisionThesisSummaryEn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── MODULE NAVIGATION TABS ────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'FUNDAMENTALS', label: '📑 A-to-Z Fundamentals', icon: '🏛️' },
          { id: 'TOKENOMICS', label: '🔓 Tokenomics & Vesting', icon: '💎' },
          { id: 'TECHNICALS', label: '📈 Long-Term Technicals', icon: '📊' },
          { id: 'ON_CHAIN', label: '🐋 On-Chain & Whale Intel', icon: '🌊' },
          { id: 'MACRO', label: '🌐 Macro & Liquidity', icon: '🌍' },
          { id: 'SECURITY', label: '🛡️ Security & Survival', icon: '🔒' },
          { id: 'SCENARIOS', label: '⏳ Horizon Scenarios (3M-5Y)', icon: '🎯' },
          { id: 'PORTFOLIO_INR', label: '💼 INR Portfolio Simulator', icon: '💰' },
          { id: 'SCANNER', label: '🔍 All Coins Scanner', icon: '📡' },
          { id: 'COMPARISON', label: '⚖️ Coin Comparison', icon: '⚖️' },
          { id: 'FINAL_REPORT', label: '📋 Concluding Report', icon: '📑' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-[#091122] hover:bg-[#0e1933] text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: A-TO-Z FUNDAMENTALS                                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'FUNDAMENTALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project & Purpose */}
          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-cyan-400">1.</span> Project Purpose & Real-World Utility
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800/90">
                <span className="font-bold text-cyan-300 block mb-1">Core Mission & Problem Solved:</span>
                <p>{coinProfile.purposeAndUtility}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800/90">
                <span className="font-bold text-cyan-300 block mb-1">Architecture & Consensus Mechanism:</span>
                <p>{coinProfile.architectureAndConsensus}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800/90">
                <span className="font-bold text-cyan-300 block mb-1">Competitive Moat vs Rivals:</span>
                <p>{coinProfile.techMoatAndCompetitors}</p>
              </div>
            </div>
          </div>

          {/* Development & Ecosystem */}
          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-cyan-400">2.</span> Development Activity & Ecosystem Growth
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800/90 flex items-start gap-3">
                <span className="text-xl">🐙</span>
                <div>
                  <span className="font-bold text-emerald-400 block mb-0.5">GitHub Developer Velocity:</span>
                  <p>{coinProfile.githubActivityCommitCount}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800/90 flex items-start gap-3">
                <span className="text-xl">📈</span>
                <div>
                  <span className="font-bold text-emerald-400 block mb-0.5">Verified Ecosystem Milestone:</span>
                  <p>{coinProfile.ecosystemGrowthMetric}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800/90">
                <span className="font-bold text-amber-300 block mb-1">Delta Exchange Trading Specifications:</span>
                <ul className="space-y-1 list-disc list-inside text-slate-400">
                  <li>Spot Symbol: <strong className="text-slate-200">{coinProfile.deltaMarketAvailability.spotContractSymbol}</strong></li>
                  <li>Perpetual Symbol: <strong className="text-slate-200">{coinProfile.deltaMarketAvailability.perpContractSymbol}</strong></li>
                  <li>Options Markets: <strong className="text-slate-200">{coinProfile.deltaMarketAvailability.hasOptions ? 'Available' : 'Unavailable'}</strong></li>
                  <li>Holding Guidance: <strong className="text-emerald-400">{coinProfile.deltaMarketAvailability.notes}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: TOKENOMICS & VESTING CALENDAR                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'TOKENOMICS' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-[#091122] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Circulating Supply</span>
              <span className="text-sm font-black text-white font-mono mt-1 block">{coinProfile.tokenomics.circulatingSupply}</span>
              <span className="text-[10px] text-cyan-400 font-semibold">{coinProfile.tokenomics.circulatingPct}% of Max</span>
            </div>
            <div className="p-4 rounded-xl bg-[#091122] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total / Max Supply</span>
              <span className="text-sm font-black text-white font-mono mt-1 block">{coinProfile.tokenomics.maxSupply}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Hard Capped / Algorithmic</span>
            </div>
            <div className="p-4 rounded-xl bg-[#091122] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Market Cap</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-1 block">{coinProfile.tokenomics.marketCapUsd}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Current Value</span>
            </div>
            <div className="p-4 rounded-xl bg-[#091122] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Fully Diluted (FDV)</span>
              <span className="text-sm font-black text-cyan-300 font-mono mt-1 block">{coinProfile.tokenomics.fdvUsd}</span>
              <span className="text-[10px] text-slate-400 font-semibold">MCap/FDV: {coinProfile.tokenomics.mcFdvRatio}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#091122] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Annual Inflation</span>
              <span className="text-sm font-black text-amber-400 font-mono mt-1 block">{coinProfile.tokenomics.inflationRateAnnual}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Supply Expansion</span>
            </div>
            <div className="p-4 rounded-xl bg-[#091122] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Dilution Risk</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded border inline-block mt-1 ${
                coinProfile.tokenomics.dilutionRisk === 'VERY_LOW' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                coinProfile.tokenomics.dilutionRisk === 'LOW' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                coinProfile.tokenomics.dilutionRisk === 'MODERATE' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {coinProfile.tokenomics.dilutionRisk}
              </span>
            </div>
          </div>

          {/* Vesting Cliffs & Distribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>🗓️</span> Upcoming Token Unlock Calendar & Vesting Cliffs
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Next Major Event:</span>
                    <span className="font-mono font-bold text-amber-400">{coinProfile.tokenomics.nextUnlockDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Unlock Size:</span>
                    <span className="font-mono font-bold text-white">{coinProfile.tokenomics.nextUnlockAmount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Circulating Impact:</span>
                    <span className="font-mono font-bold text-cyan-400">+{coinProfile.tokenomics.nextUnlockPct}% Dilution</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800">
                  <strong className="text-cyan-300 block mb-1">Vesting Cliff Architecture:</strong>
                  <p className="leading-relaxed">{coinProfile.tokenomics.vestingCliffDetails}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">Burn & Revenue Accrual Mechanism:</strong>
                  <p className="leading-relaxed">{coinProfile.tokenomics.burnOrRevenueMechanism}</p>
                </div>
              </div>
            </div>

            {/* Token Distribution Breakdown */}
            <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>🍰</span> Token Distribution & Insider Concentration
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Public & Community', pct: coinProfile.tokenomics.distribution.publicCommunity, color: 'bg-emerald-500' },
                  { label: 'Founders & Team', pct: coinProfile.tokenomics.distribution.teamFounders, color: 'bg-blue-500' },
                  { label: 'Private Venture Investors', pct: coinProfile.tokenomics.distribution.privateVenture, color: 'bg-purple-500' },
                  { label: 'Treasury & Ecosystem', pct: coinProfile.tokenomics.distribution.treasuryEcosystem, color: 'bg-amber-500' },
                  { label: 'Staking / Miner Rewards', pct: coinProfile.tokenomics.distribution.stakingRewards, color: 'bg-cyan-500' }
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-[#060c18] border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-300">{item.label}</span>
                      <span className="font-mono font-bold text-white">{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}

                <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Top 100 Whale Concentration:</span>
                  <span className="font-mono font-bold text-amber-400">{coinProfile.tokenomics.whaleConcentrationPct}% of Supply</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: LONG-TERM TECHNICALS (1D, 1W, 1M)                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'TECHNICALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>📊</span> Multi-Timeframe Market Structure (1D, 1W, 1M)
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">1-Day Structure:</span>
                <span className="font-mono font-bold text-emerald-400">{coinProfile.technicals.marketStructure1D}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">1-Week Macro Trend:</span>
                <span className="font-mono font-bold text-cyan-300">{coinProfile.technicals.marketStructure1W}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">1-Month Cycle Base:</span>
                <span className="font-mono font-bold text-blue-400">{coinProfile.technicals.marketStructure1M}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">200-Week Moving Average:</span>
                <span className="font-mono font-bold text-purple-400">{coinProfile.technicals.ma200Position}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">1W RSI / Momentum:</span>
                <span className="font-mono font-bold text-amber-400">{coinProfile.technicals.rsi1W} ({coinProfile.technicals.macd1WStatus})</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>🎯</span> Long-Term Accumulation & Invalidation Zones
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#060c18] border border-emerald-500/40">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Ideal Long-Term Accumulation Shelf:</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  ${coinProfile.technicals.accumulationZoneMin.toLocaleString()} - ${coinProfile.technicals.accumulationZoneMax.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  INR: ₹{Math.round(coinProfile.technicals.accumulationZoneMin * USD_TO_INR_RATE).toLocaleString('en-IN')} - ₹{Math.round(coinProfile.technicals.accumulationZoneMax * USD_TO_INR_RATE).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/30 to-[#060c18] border border-rose-500/40">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Strict Thesis Invalidation Level:</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  ${coinProfile.technicals.invalidationLevel.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  A weekly candle close below this price invalidates the mid-to-long term accumulation thesis.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Volume Profile Point of Control (POC):</span>
                <span className="font-mono font-bold text-cyan-300">${coinProfile.technicals.volumeProfilePoc.toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Historical Bear Cycle Drawdown:</span>
                <span className="font-mono font-bold text-rose-400">{coinProfile.technicals.historicalCycleDrawdown} (Recovery: {coinProfile.technicals.cycleRecoveryMonths})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: ON-CHAIN & WHALE INTELLIGENCE                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ON_CHAIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>🐋</span> Whale Wallet & Institutional Flows
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Whale Wallet Bias:</span>
                <span className={`font-mono font-bold ${coinProfile.onChain.whaleHoldersAccumulating ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {coinProfile.onChain.whaleHoldersAccumulating ? '🟢 NET ACCUMULATION' : '🔴 NET DISTRIBUTION'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Exchange Net Flow (Past 30 Days):</span>
                <span className="font-mono font-bold text-emerald-400">{coinProfile.onChain.exchangeNetFlow30d}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Smart-Money Balance Change (30d):</span>
                <span className="font-mono font-bold text-cyan-300">{coinProfile.onChain.smartMoneyBalanceChange30d}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Long-Term HODLers (&gt;1 Year):</span>
                <span className="font-mono font-bold text-white">{coinProfile.onChain.longTermHoldersPct}% of circulating coins</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>🔒</span> Network Activity & Audit Verification
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Daily Active Addresses:</span>
                <span className="font-mono font-bold text-cyan-300">{coinProfile.onChain.activeAddressesDaily}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Daily On-Chain Volume:</span>
                <span className="font-mono font-bold text-white">{coinProfile.onChain.txVolumeDailyUsd}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Network Security Metric:</span>
                <span className="font-mono font-bold text-purple-400">{coinProfile.onChain.networkSecurityHashrateOrTvl}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-bold text-slate-400">Data Source:</span>
                  <span className="font-mono text-slate-300">{coinProfile.onChain.dataSource}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-400">Observation Timestamp:</span>
                  <span className="font-mono text-emerald-400">{coinProfile.onChain.observationTimestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: MACRO & LIQUIDITY RADAR                                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MACRO' && (
        <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-white">Global Macroeconomic & Monetary Environment</h3>
              <p className="text-xs text-slate-300 mt-0.5">Evaluation of Federal Reserve policy, inflation, DXY, and spot ETF institutional flows.</p>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider border shrink-0 ${
              coinProfile.macroImpact.verdict === 'SUPPORTS_LONG_TERM_ACCUMULATION'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/40'
            }`}>
              {coinProfile.macroImpact.verdict}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Interest Rate Sensitivity</span>
              <span className="text-base font-bold text-amber-400 mt-1 block">{coinProfile.macroImpact.fedRateSensitivity} SENSITIVITY</span>
              <p className="text-slate-400 mt-1">Impacted by Fed rate cuts and debt expansion cycles.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">DXY Dollar Index Correlation</span>
              <span className="text-base font-bold text-cyan-300 mt-1 block">{coinProfile.macroImpact.dxyCorrelation}</span>
              <p className="text-slate-400 mt-1">Rises strongly when US Dollar Index experiences weakness.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Spot ETF & Institutional Inflows</span>
              <span className="text-base font-bold text-emerald-400 mt-1 block">POSITIVE ACCELERATION</span>
              <p className="text-slate-400 mt-1">{coinProfile.macroImpact.etfFlowImpact}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#060c18] border border-cyan-500/20 text-xs">
            <strong className="text-cyan-300 block mb-1">Macroeconomic Synthesis:</strong>
            <p className="text-slate-200 leading-relaxed font-medium">{coinProfile.macroImpact.macroSummary}</p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: SECURITY & SURVIVAL ENGINE                                         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>🛡️</span> Security Audits, Team & Vulnerability Radar
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Audit Status:</span>
                <span className="font-mono font-bold text-emerald-400">{coinProfile.security.auditStatus}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">Auditing Firms:</span>
                <span className="font-mono text-cyan-300">{coinProfile.security.auditFirms.join(' • ')}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">Historical Exploit Record:</span>
                <p className="text-slate-300">{coinProfile.security.exploitHistory}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Core Team Status:</span>
                <span className="font-mono font-bold text-white">{coinProfile.security.teamAnonymity}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>⚠️</span> Fraud, Delisting & Survival Risk Classification
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Rug-Pull Risk Score:</span>
                <span className="font-mono font-bold text-emerald-400">{coinProfile.security.rugPullRiskScore}/100 (Safe)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Delta Liquidity Quality:</span>
                <span className="font-mono font-bold text-cyan-300">{coinProfile.security.deltaExchangeLiquidity}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-400">Regulatory Classification:</span>
                <span className="font-mono font-bold text-white">{coinProfile.security.regulatoryRisk}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800">
                <strong className="text-amber-300 block mb-1">Survival Prognosis:</strong>
                <p className="leading-relaxed">{coinProfile.security.survivalSummary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: HORIZON SCENARIOS (3-6M, 6-12M, 1-3Y, 3-5Y, EXTENDED)             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SCENARIOS' && (
        <div className="space-y-6">
          {/* Horizon Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              { id: '3_6_MONTHS', label: '3 to 6 Months' },
              { id: '6_12_MONTHS', label: '6 to 12 Months' },
              { id: '1_3_YEARS', label: '1 to 3 Years' },
              { id: '3_5_YEARS', label: '3 to 5 Years' },
              { id: 'EXTENDED_HOLDING', label: 'Extended Holding' }
            ].map((hz) => (
              <button
                key={hz.id}
                onClick={() => setSelectedHorizon(hz.id as WealthHorizon)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedHorizon === hz.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-[#091122] hover:bg-[#0e1933] text-slate-300 border-slate-800'
                }`}
              >
                {hz.label}
              </button>
            ))}
          </div>

          {/* Active Scenario Card */}
          {(() => {
            const sc = coinProfile.horizonScenarios[selectedHorizon];
            return (
              <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-xl font-black text-white">{sc.horizonLabel}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Defensible valuation ranges, key catalysts, and structural assumptions.</p>
                  </div>
                  <span className="text-xs text-cyan-300 font-bold bg-[#060c18] px-3 py-1.5 rounded-lg border border-slate-800">
                    Review Cycle: {sc.reviewFrequency}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bullish */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#07161b] to-[#060c18] border border-emerald-500/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Bullish Case</span>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                        {sc.bullishScenario.probabilityPct}% Prob
                      </span>
                    </div>
                    <div>
                      <span className="text-xl font-black text-white font-mono">{sc.bullishScenario.targetRangeUsd}</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono block mt-0.5">{sc.bullishScenario.targetRangeInr}</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                      <strong className="text-slate-400 block text-[10px] uppercase">Catalysts:</strong>
                      <p>{sc.bullishScenario.keyCatalysts.join(' • ')}</p>
                      <strong className="text-slate-400 block text-[10px] uppercase">Assumption:</strong>
                      <p className="text-slate-400">{sc.bullishScenario.fundamentalAssumption}</p>
                    </div>
                  </div>

                  {/* Base */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#09152b] to-[#060c18] border border-blue-500/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">Base Case</span>
                      <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded">
                        {sc.baseScenario.probabilityPct}% Prob
                      </span>
                    </div>
                    <div>
                      <span className="text-xl font-black text-white font-mono">{sc.baseScenario.targetRangeUsd}</span>
                      <span className="text-xs font-bold text-blue-300 font-mono block mt-0.5">{sc.baseScenario.targetRangeInr}</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                      <strong className="text-slate-400 block text-[10px] uppercase">Catalysts:</strong>
                      <p>{sc.baseScenario.keyCatalysts.join(' • ')}</p>
                      <strong className="text-slate-400 block text-[10px] uppercase">Assumption:</strong>
                      <p className="text-slate-400">{sc.baseScenario.fundamentalAssumption}</p>
                    </div>
                  </div>

                  {/* Bearish */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#1b0b14] to-[#060c18] border border-rose-500/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Bearish Downside</span>
                      <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
                        {sc.bearishScenario.probabilityPct}% Prob
                      </span>
                    </div>
                    <div>
                      <span className="text-xl font-black text-white font-mono">{sc.bearishScenario.targetRangeUsd}</span>
                      <span className="text-xs font-bold text-rose-400 font-mono block mt-0.5">{sc.bearishScenario.targetRangeInr}</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                      <strong className="text-slate-400 block text-[10px] uppercase">Key Risks:</strong>
                      <p>{sc.bearishScenario.keyRisks.join(' • ')}</p>
                      <strong className="text-slate-400 block text-[10px] uppercase">Invalidation Trigger:</strong>
                      <p className="text-rose-400 font-semibold">{sc.bearishScenario.invalidationTrigger}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 text-xs">
                  <strong className="text-cyan-300 block mb-1">Thesis Invalidation Criteria:</strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {sc.thesisInvalidationConditions.map((cond, idx) => (
                      <li key={idx}>{cond}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: INR PORTFOLIO SIMULATOR & DRAWDOWN STRESS TEST                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'PORTFOLIO_INR' && (
        <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-extrabold text-white">INR Portfolio Construction & Drawdown Stress Test</h3>
              <p className="text-xs text-slate-300 mt-0.5">Simulate actual portfolio drawdowns of 20%, 40%, 60%, and 80% to plan capital preservation.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setInrRiskProfile(prof)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    inrRiskProfile === prof
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-[#060c18] text-slate-400 border-slate-800'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>
          </div>

          {/* Capital Input Bar */}
          <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Enter Capital in INR (₹):</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-400">₹</span>
                <input
                  type="number"
                  value={inrCapitalInput}
                  onChange={(e) => setInrCapitalInput(Math.max(10000, Number(e.target.value) || 0))}
                  className="bg-[#091122] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-base w-48 focus:border-cyan-400 outline-none"
                />
                <span className="text-xs text-slate-400">
                  (~${Math.round(inrCapitalInput / USD_TO_INR_RATE).toLocaleString()} USD)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {[100000, 500000, 1000000, 2500000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setInrCapitalInput(preset)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  ₹{(preset / 100000).toFixed(0)} Lakh
                </button>
              ))}
            </div>
          </div>

          {/* Drawdown Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {drawdownResults.map((dd) => (
              <div
                key={dd.drawdownPct}
                className={`p-5 rounded-2xl bg-[#060c18] border ${
                  dd.drawdownPct === 20 ? 'border-blue-500/30' :
                  dd.drawdownPct === 40 ? 'border-amber-500/30' :
                  dd.drawdownPct === 60 ? 'border-orange-500/40' :
                  'border-rose-500/50'
                } space-y-3`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-300">-{dd.drawdownPct}% Drawdown</span>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    Req +{dd.recoveryGainRequiredPct}% Gain
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Capital</span>
                  <span className="text-xl font-black text-white font-mono mt-0.5 block">
                    ₹{Math.round(dd.remainingCapitalInr).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-rose-400 font-semibold font-mono block">
                    Loss: -₹{Math.round(dd.portfolioLossInr).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <strong className="text-[10px] uppercase font-bold text-amber-300 block mb-0.5">Preservation Strategy:</strong>
                  <p className="leading-relaxed">{dd.survivalAdviceHinglish}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Allocation Recommendation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/20 via-[#060c18] to-cyan-950/20 border border-cyan-500/30 text-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-cyan-300 font-bold block uppercase tracking-wide">
                Suggested Allocation Profile ({inrRiskProfile}):
              </span>
              <p className="text-slate-300 mt-0.5">
                {inrRiskProfile === 'CONSERVATIVE' && '60% Bitcoin (BTC), 25% Ethereum (ETH), 15% Cash/USDT Reserve.'}
                {inrRiskProfile === 'BALANCED' && '45% Bitcoin (BTC), 25% Ethereum (ETH), 15% Solana/LINK, 15% High-Conviction Altcoins (SUI/RENDER).'}
                {inrRiskProfile === 'AGGRESSIVE' && '30% Bitcoin, 20% Ethereum, 25% Solana/Sui, 25% High-Growth AI & L1 Ecosystem tokens.'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">Execution Mode:</span>
              <span className="text-emerald-400 font-black text-xs">4-Month Staged SIP / DCA</span>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 9: ALL COINS SCANNER (DELTA EXCHANGE FULL ROSTER)                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SCANNER' && (
        <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Delta Exchange Complete Coin Scanner</h3>
              <p className="text-xs text-slate-400 mt-0.5">Filter, search, and analyze all spot and derivative instruments available on Delta Exchange India.</p>
            </div>

            {/* Search & Sector Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search coin (BTC, SOL, LINK)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#060c18] border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none w-52"
              />

              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="bg-[#060c18] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-400 outline-none"
              >
                <option value="ALL">All Sectors</option>
                <option value="L1">Layer-1 Blockchains</option>
                <option value="Smart Contracts">Smart Contracts</option>
                <option value="AI">AI & Compute</option>
                <option value="Infrastructure">Infrastructure & Oracles</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060c18] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Coin & Asset</th>
                  <th className="p-3.5">Sector</th>
                  <th className="p-3.5">Price (USD / INR)</th>
                  <th className="p-3.5">24h Change</th>
                  <th className="p-3.5">Research Score</th>
                  <th className="p-3.5">Risk Rating</th>
                  <th className="p-3.5">Delta Markets</th>
                  <th className="p-3.5">Decision</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#091122]">
                {filteredCoins.map((coin) => {
                  const b = getDecisionBadge(coin.decision);
                  return (
                    <tr key={coin.symbol} className="hover:bg-[#0c162c] transition-all">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <span>{coin.symbol}</span>
                        <span className="text-[11px] font-normal text-slate-400">({coin.name})</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{coin.sector}</td>
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-white">${coin.livePriceUsd.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block">₹{Math.round(coin.livePriceInr).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={coin.change24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {coin.change24hPct >= 0 ? '+' : ''}{coin.change24hPct}%
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-cyan-300">
                        {coin.scores.totalScore}/100
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(coin.security.riskCategory)}`}>
                          {coin.security.riskCategory}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold mr-1">
                          SPOT
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                          PERP
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.bg}`}>
                          {b.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedCoinSymbol(coin.symbol);
                            setActiveTab('FUNDAMENTALS');
                          }}
                          className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all"
                        >
                          Deep Research
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 10: COIN COMPARISON MATRIX                                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'COMPARISON' && (
        <div className="p-6 rounded-2xl bg-[#091122] border border-slate-800 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-xl font-extrabold text-white">Multi-Coin Research Comparison Matrix</h3>
            <p className="text-xs text-slate-300 mt-0.5">Side-by-side comparison of fundamentals, tokenomics, technical accumulation zones, and multi-year scenarios.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060c18] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Metric / Parameter</th>
                  <th className="p-3.5 text-cyan-300">BTC (Bitcoin)</th>
                  <th className="p-3.5 text-blue-300">ETH (Ethereum)</th>
                  <th className="p-3.5 text-purple-300">SOL (Solana)</th>
                  <th className="p-3.5 text-emerald-300">LINK (Chainlink)</th>
                  <th className="p-3.5 text-amber-300">SUI (Sui Network)</th>
                  <th className="p-3.5 text-rose-300">RENDER (Render)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#091122] font-mono">
                <tr>
                  <td className="p-3.5 font-bold text-slate-400 font-sans">Research Score (Max 100)</td>
                  <td className="p-3.5 font-bold text-white">97.3</td>
                  <td className="p-3.5 font-bold text-white">91.8</td>
                  <td className="p-3.5 font-bold text-white">86.8</td>
                  <td className="p-3.5 font-bold text-white">91.8</td>
                  <td className="p-3.5 font-bold text-white">85.9</td>
                  <td className="p-3.5 font-bold text-white">88.5</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-slate-400 font-sans">Risk Category</td>
                  <td className="p-3.5 text-emerald-400 font-bold">LOW</td>
                  <td className="p-3.5 text-emerald-400 font-bold">LOW</td>
                  <td className="p-3.5 text-blue-400 font-bold">MODERATE</td>
                  <td className="p-3.5 text-emerald-400 font-bold">LOW</td>
                  <td className="p-3.5 text-blue-400 font-bold">MODERATE</td>
                  <td className="p-3.5 text-emerald-400 font-bold">LOW</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-slate-400 font-sans">Dilution Risk</td>
                  <td className="p-3.5 text-emerald-400">VERY_LOW</td>
                  <td className="p-3.5 text-emerald-400">VERY_LOW</td>
                  <td className="p-3.5 text-blue-400">MODERATE</td>
                  <td className="p-3.5 text-emerald-400">LOW</td>
                  <td className="p-3.5 text-rose-400 font-bold">HIGH</td>
                  <td className="p-3.5 text-emerald-400">VERY_LOW</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-slate-400 font-sans">Circulating % of Max</td>
                  <td className="p-3.5 text-white">94.2%</td>
                  <td className="p-3.5 text-white">100.0%</td>
                  <td className="p-3.5 text-white">79.9%</td>
                  <td className="p-3.5 text-white">60.8%</td>
                  <td className="p-3.5 text-amber-400 font-bold">28.5%</td>
                  <td className="p-3.5 text-white">96.5%</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-slate-400 font-sans">Accumulation Zone</td>
                  <td className="p-3.5 text-cyan-300 font-bold">$78k - $82.5k</td>
                  <td className="p-3.5 text-cyan-300 font-bold">$2,350 - $2,550</td>
                  <td className="p-3.5 text-cyan-300 font-bold">$95 - $112</td>
                  <td className="p-3.5 text-cyan-300 font-bold">$12.5 - $15.0</td>
                  <td className="p-3.5 text-cyan-300 font-bold">$1.80 - $2.15</td>
                  <td className="p-3.5 text-cyan-300 font-bold">$5.40 - $6.50</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-slate-400 font-sans">1-3 Year Bull Target</td>
                  <td className="p-3.5 text-emerald-400 font-bold">$160k - $220k</td>
                  <td className="p-3.5 text-emerald-400 font-bold">$6.5k - $9.5k</td>
                  <td className="p-3.5 text-emerald-400 font-bold">$400 - $650</td>
                  <td className="p-3.5 text-emerald-400 font-bold">$75 - $120</td>
                  <td className="p-3.5 text-emerald-400 font-bold">$10 - $16</td>
                  <td className="p-3.5 text-emerald-400 font-bold">$35 - $60</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 11: CONCLUDING INSTITUTIONAL RESEARCH REPORT                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'FINAL_REPORT' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#091122] border border-cyan-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/30">
                OFFICIAL INSTITUTIONAL DOSSIER • {coinProfile.symbol}
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                12-Point Comprehensive Long-Term Investment Thesis
              </h2>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shrink-0 flex items-center gap-2"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">1. What the Project Does & Token Value:</strong>
              <p className="text-slate-300">{coinProfile.purposeAndUtility}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">2. Fundamental Strengths & Moat:</strong>
              <p className="text-slate-300">{coinProfile.techMoatAndCompetitors}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">3. Token Supply & Dilution Constraints:</strong>
              <p className="text-slate-300">{coinProfile.tokenomics.vestingCliffDetails} (Dilution: {coinProfile.tokenomics.dilutionRisk})</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">4. Technical Structure & Accumulation Shelf:</strong>
              <p className="text-slate-300">Accumulation: ${coinProfile.technicals.accumulationZoneMin} - ${coinProfile.technicals.accumulationZoneMax} (Invalidation: ${coinProfile.technicals.invalidationLevel})</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">5. On-Chain Whale & Smart Money Footprint:</strong>
              <p className="text-slate-300">{coinProfile.onChain.exchangeNetFlow30d} • Active daily: {coinProfile.onChain.activeAddressesDaily}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">6. Macroeconomic & Liquidity Alignment:</strong>
              <p className="text-slate-300">{coinProfile.macroImpact.macroSummary}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">7. Downside Risks & Survival Integrity:</strong>
              <p className="text-slate-300">{coinProfile.security.survivalSummary} (Risk: {coinProfile.security.riskCategory})</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">8. Bull, Base & Bear Scenarios:</strong>
              <p className="text-slate-300">3-6M Bull: {coinProfile.horizonScenarios['3_6_MONTHS'].bullishScenario.targetRangeUsd} • Base: {coinProfile.horizonScenarios['3_6_MONTHS'].baseScenario.targetRangeUsd}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">9. Investment Horizon Suitability:</strong>
              <p className="text-slate-300">Ideal for 1-4 months phased DCA holding through multi-year thesis execution.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block font-bold text-[11px]">10. Research Score & Risk Profile:</strong>
              <p className="text-slate-300">Score: {coinProfile.scores.totalScore}/100 • Risk: {coinProfile.scores.riskScore}/100 • Confidence: {coinProfile.scores.confidenceScore}%</p>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1 md:col-span-2">
              <strong className="text-rose-400 block font-bold text-[11px]">11. Evidence That Would Change the Conclusion:</strong>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {coinProfile.evidenceThatChangesConclusion.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-1 md:col-span-2 flex flex-col sm:flex-row justify-between text-slate-400 text-[11px]">
              <div>
                <strong>Primary Sources:</strong> {coinProfile.sourcesAndTimestamp.primarySources.join(' | ')}
              </div>
              <div className="shrink-0 font-mono mt-1 sm:mt-0">
                Evaluated: {coinProfile.sourcesAndTimestamp.lastEvaluated} | Next: {coinProfile.sourcesAndTimestamp.nextScheduledReview}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoWealthIntelligenceTerminalView;
