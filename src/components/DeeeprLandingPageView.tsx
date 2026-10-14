import React, { useState } from 'react';
import {
  Play,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Globe2,
  ExternalLink,
  ChevronRight,
  Bell,
  Lock,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DeeeprLandingPageViewProps {
  onLaunchTerminal: (tabId?: string) => void;
}

interface AssetSignal {
  symbol: string;
  name: string;
  change: string;
  isPositive: boolean;
  verdict: 'LONG' | 'SHORT' | 'WAIT';
  verdictReason: string;
  entry: string;
  target: string;
  stop: string;
  lanesAgree: string;
  riskReward: string;
  lanes: {
    tech: { label: string; status: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; color: string };
    flow: { label: string; status: 'INFLOW' | 'OUTFLOW' | 'NEUTRAL'; color: string };
    news: { label: string; status: 'FAVORABLE' | 'RISK-OFF' | 'NEUTRAL'; color: string };
    macro: { label: string; status: 'TAILWIND' | 'HEADWIND' | 'MIXED'; color: string };
  };
}

const ASSET_DATA: Record<string, AssetSignal> = {
  'BTC/USDT': {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    change: '+2.84%',
    isPositive: true,
    verdict: 'LONG',
    verdictReason: 'Structure and order flow delta agree on the long side. $82,400 bid wall absorbed retail panic selling while institutional spot CVD continues accumulating.',
    entry: '83,120',
    target: '86,450',
    stop: '81,900',
    lanesAgree: '4 OF 4 LANES AGREE',
    riskReward: '1 : 2.7',
    lanes: {
      tech: { label: 'Higher lows pressing into $83.5k resistance', status: 'BULLISH', color: 'emerald' },
      flow: { label: 'Spot buyers absorbing heavy sell walls on Bookmap', status: 'INFLOW', color: 'cyan' },
      news: { label: 'US Bitcoin ETF net daily inflows positive (+$480M)', status: 'FAVORABLE', color: 'teal' },
      macro: { label: 'DXY easing at 102.4, global M2 liquidity expansion', status: 'TAILWIND', color: 'amber' }
    }
  },
  'ETH/USDT': {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    change: '+3.45%',
    isPositive: true,
    verdict: 'LONG',
    verdictReason: 'Breakout from descending triangle with aggressive buyer delta. Large short liquidation pool clustered at $2,620.',
    entry: '2,535',
    target: '2,680',
    stop: '2,460',
    lanesAgree: '3 OF 4 LANES AGREE',
    riskReward: '1 : 2.2',
    lanes: {
      tech: { label: '200 EMA reclaim on 4h timeframe', status: 'BULLISH', color: 'emerald' },
      flow: { label: 'Derivatives open interest rising with positive funding', status: 'INFLOW', color: 'cyan' },
      news: { label: 'Layer-2 volume hitting new all-time high', status: 'FAVORABLE', color: 'teal' },
      macro: { label: 'Yield curve steepening; beta assets favored', status: 'TAILWIND', color: 'amber' }
    }
  },
  'XAU/USD': {
    symbol: 'XAU/USD',
    name: 'Gold Spot',
    change: '+0.77%',
    isPositive: true,
    verdict: 'LONG',
    verdictReason: 'Central bank accumulation and geopolitical safe-haven bids protecting the $4,100 support floor. Real yields flattening.',
    entry: '4,125',
    target: '4,220',
    stop: '4,075',
    lanesAgree: '4 OF 4 LANES AGREE',
    riskReward: '1 : 2.5',
    lanes: {
      tech: 'Daily bull flag consolidation near historic highs' as any,
      flow: { label: 'London & NY cash desks absorbing all pullbacks', status: 'INFLOW', color: 'cyan' },
      news: { label: 'PBOC & BRICS central banks increase gold reserves', status: 'FAVORABLE', color: 'teal' },
      macro: { label: 'Sovereign debt hedging and de-dollarization flows', status: 'TAILWIND', color: 'amber' }
    } as any
  },
  'SOL/USDT': {
    symbol: 'SOL/USDT',
    name: 'Solana',
    change: '+2.88%',
    isPositive: true,
    verdict: 'LONG',
    verdictReason: 'High momentum bounce from $108 support. Order flow shows continuous limit bid refreshes and positive delta divergence.',
    entry: '112.90',
    target: '124.50',
    stop: '107.20',
    lanesAgree: '3 OF 4 LANES AGREE',
    riskReward: '1 : 2.3',
    lanes: {
      tech: { label: 'Ascending channel hold with RSI reset', status: 'BULLISH', color: 'emerald' },
      flow: { label: 'Aggressive taker buying across DEX & CEX liquidity', status: 'INFLOW', color: 'cyan' },
      news: { label: 'Ecosystem TVL and daily active addresses expanding', status: 'FAVORABLE', color: 'teal' },
      macro: { label: 'High beta crypto benefiting from risk-on rotation', status: 'TAILWIND', color: 'amber' }
    }
  }
};

export const DeeeprLandingPageView: React.FC<DeeeprLandingPageViewProps> = ({ onLaunchTerminal }) => {
  const { openAuthModal, user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const current = ASSET_DATA[selectedAsset] || ASSET_DATA['BTC/USDT'];

  const handleTriggerAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 900);
  };

  const handleStartFree = () => {
    if (user) {
      onLaunchTerminal('ultra-ai');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#030610] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* ──────────────── 1. LUXURY TOP NAVIGATION BAR ──────────────── */}
      <nav className="sticky top-0 z-40 border-b border-cyan-500/15 bg-[#030610]/85 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(0,242,254,0.35)]">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-['Outfit']">
                  IshantMacro<span className="text-cyan-400">.Ai</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                  v4.2 PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
                Institutional Macro & Order Flow Copilot
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Deeepr match) */}
          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-300">
            <button
              onClick={() => onLaunchTerminal('deeepr-ai')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Analyze (4-Lanes)
            </button>
            <button
              onClick={() => onLaunchTerminal('order-flow')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Order Flow & Bookmap
            </button>
            <button
              onClick={() => onLaunchTerminal('liquidation-heatmap')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Liquidation Heatmap
            </button>
            <button
              onClick={() => onLaunchTerminal('indian-stock-ai')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Stocks & Macro
            </button>
            <button
              onClick={() => onLaunchTerminal('pricing')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </div>

          {/* Right Action Buttons (Sign In + Start Free Pill) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {user ? (
              <button
                onClick={() => onLaunchTerminal('ultra-ai')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👤 {user.name || 'Terminal Active'}</span>
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="text-xs sm:text-[13px] font-medium text-slate-300 hover:text-white px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            )}

            <button
              onClick={handleStartFree}
              className="px-4 sm:px-5 py-2 rounded-full text-xs sm:text-[13px] font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 font-['Outfit']"
            >
              <span>Start free</span>
              <ArrowRight className="size-3.5" />
            </button>

            <button
              onClick={() => onLaunchTerminal('ultra-ai')}
              className="hidden lg:flex px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer items-center gap-1"
            >
              <span>Terminal</span>
              <ExternalLink className="size-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>

      {/* ──────────────── 2. HERO SECTION (IMAGE 3 MATCH WITH ENHANCED LUXURY) ──────────────── */}
      <section className="relative pt-12 pb-20 px-4 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Radiant Ambient Background Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-cyan-400/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono mb-6 shadow-[0_0_15px_rgba(0,242,254,0.15)] animate-pulse">
            <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span>INSTITUTIONAL MACRO & BOOKMAP ORDER FLOW COPILOT</span>
          </div>

          {/* Main Huge Headline (Exact Deeepr spirit with custom high-converting institutional copy) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-['Outfit'] text-white leading-[1.08] mb-6">
            Trade on <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 drop-shadow-[0_0_25px_rgba(0,242,254,0.35)]">conviction.</span>
            <br />
            Not market noise.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            One definitive verdict per asset, with real-time liquidation clusters, Bookmap absorption walls, and 4-lane risk parameters attached.
          </p>

          {/* CTA Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-5">
            <button
              onClick={handleStartFree}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm sm:text-base font-bold bg-white text-slate-950 hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 font-['Outfit']"
            >
              <span>Start free</span>
              <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => onLaunchTerminal('order-flow')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm sm:text-base font-semibold bg-slate-900/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all cursor-pointer flex items-center justify-center gap-2 font-['Outfit'] shadow-lg"
            >
              <span>Launch Live Terminal ⚡</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 font-mono tracking-wide">
            20 free tokens daily · Real-time WebSocket feeds · No credit card required
          </p>
        </div>

        {/* ── 3. INTERACTIVE HERO PREVIEW CARD (EXACT IMAGE 3 MATCH) ── */}
        <div className="relative mt-12 max-w-4xl mx-auto">
          {/* Card Frame with Frosted Glass & Border Glow */}
          <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-[#081224]/90 via-[#060c18]/90 to-[#030610]/95 p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            {/* Top Bar: Asset Selector & 24h Change Pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {Object.keys(ASSET_DATA).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setSelectedAsset(sym)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      selectedAsset === sym
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                        : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  {current.change} 24h
                </span>
                <button
                  onClick={handleTriggerAnalyze}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Activity className={`size-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'SCANNING…' : 'ANALYZE'}</span>
                </button>
              </div>
            </div>

            {/* Verdict Box & Analysis Text */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-extrabold font-['Outfit'] tracking-wide flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <TrendingUp className="size-4" />
                    <span>↗ {current.verdict} BIAS</span>
                  </span>
                  <span className="text-xs font-mono text-cyan-400/90 font-medium">
                    {current.lanesAgree}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Risk/Reward:</span>
                  <span className="text-white font-bold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                    {current.riskReward}
                  </span>
                </div>
              </div>

              {/* Reasoning Description */}
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/70">
                {current.verdictReason}
              </p>

              {/* Precision Execution Levels Grid (Entry / Target / Stop) */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    ENTRY LEVEL
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-white">
                    ${current.entry}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <span className="block text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">
                    TARGET (TP)
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-emerald-300">
                    ${current.target}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-center shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                  <span className="block text-[10px] font-mono text-rose-400 uppercase tracking-wider mb-1">
                    STOP LOSS (SL)
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-rose-300">
                    ${current.stop}
                  </span>
                </div>
              </div>

              {/* Visual Visual Target & SL Pill Flags */}
              <div className="relative pt-4 pb-2">
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-1/4 bg-rose-500/40" />
                  <div className="absolute inset-y-0 left-1/4 w-1/2 bg-cyan-400/60" />
                  <div className="absolute inset-y-0 right-0 w-1/4 bg-emerald-500/40" />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono mt-2">
                  <span className="text-rose-400 font-medium">SL: ${current.stop}</span>
                  <span className="text-cyan-300 font-bold">CURRENT: ${current.entry}</span>
                  <span className="text-emerald-400 font-medium">TP: ${current.target}</span>
                </div>
              </div>

              {/* Bottom Quick Terminal CTA inside preview */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onLaunchTerminal('order-flow')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open live order flow for {current.symbol}</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 4. SECTION 04: "FROM QUESTION TO VERDICT IN SECONDS" (IMAGE 4 MATCH) ──────────────── */}
      <section className="py-20 px-4 lg:px-8 border-t border-slate-800/80 bg-[#040816] relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading, Subtext & 3 Steps */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              <span>04</span>
              <span>·</span>
              <span>ANALYZE ENGINE</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white tracking-tight leading-tight">
              From question to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                verdict in seconds.
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Pick any asset, tap Analyze, and watch four independent institutional engines return with one cohesive answer.
            </p>

            {/* 3 Step List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="size-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Pick an asset & timeframe</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Bitcoin, Gold, Ethereum, Solana, or Top 500 Indian & US equities.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="size-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Four engines read it separately</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Technical structure, Bookmap order flow, sentiment news, and macro yields evaluate in parallel.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">One verdict, with levels attached</h4>
                  <p className="text-xs text-slate-400 mt-0.5">High-probability Entry, Invalidation Stop, and Target profit boxes drawn instantly.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 4-Lane Real-time Simulator Card (Exact Image 4) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-cyan-500/30 bg-[#070f20] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    LIVE CONFLUENCE MATRIX
                  </span>
                  <span className="text-base font-bold font-['Outfit'] text-white">
                    ANALYZE · BTC/USDT (1h)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    4 LANES ACTIVE
                  </span>
                </div>
              </div>

              {/* 4 Lanes Rows */}
              <div className="space-y-3.5 my-5">
                {/* Lane 1: Technical */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-md bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                      T
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">Technical Structure</span>
                      <span className="text-xs text-slate-400">Higher lows into key daily resistance ($83.5k)</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                    BULLISH
                  </span>
                </div>

                {/* Lane 2: Flow */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-md bg-cyan-500/20 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center">
                      F
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">Order Flow & CVD</span>
                      <span className="text-xs text-slate-400">Spot buyers absorbing retail sell walls on Bookmap</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                    HEAVY INFLOW
                  </span>
                </div>

                {/* Lane 3: News */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-md bg-teal-500/20 text-teal-400 font-bold font-mono text-xs flex items-center justify-center">
                      N
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">News & Sentiment</span>
                      <span className="text-xs text-slate-400">Institutional ETF net daily inflow positive; no headwind stories</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-mono font-bold">
                    FAVORABLE
                  </span>
                </div>

                {/* Lane 4: Macro */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-md bg-amber-500/20 text-amber-400 font-bold font-mono text-xs flex items-center justify-center">
                      M
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">Macro & Global Yields</span>
                      <span className="text-xs text-slate-400">Fed rate pause priced in; US10Y consolidating at 4.08%</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                    TAILWIND
                  </span>
                </div>
              </div>

              {/* Bottom Final Verdict Strip */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/80 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">VERDICT:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-extrabold text-xs font-mono">
                    ↗ LONG
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-300 space-x-2">
                  <span>Entry: <strong className="text-white">$83,120</strong></span>
                  <span>·</span>
                  <span>Stop: <strong className="text-rose-400">$81,900</strong></span>
                  <span>·</span>
                  <span>Target: <strong className="text-emerald-400">$86,450</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 5. SECTION 05: "THE CHART YOU ALREADY TRUST. NOW IT ANSWERS BACK." (IMAGE 5 MATCH) ──────────────── */}
      <section className="py-20 px-4 lg:px-8 border-t border-slate-800/80 bg-[#030610] relative">
        <div className="max-w-6xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            <span>05</span>
            <span>·</span>
            <span>CHART INTELLIGENCE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white tracking-tight">
            The chart you already trust.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
              Now it answers back.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Signals and liquidation clusters draw their entry, stop loss, and target boxes directly on the candles the moment high-volume institutional orders execute.
          </p>
        </div>

        {/* Visual Chart Card Representation (Exact Image 5) */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-cyan-500/30 bg-[#070e1c] p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden">
          {/* Top Chart Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold font-mono text-white">BTC/USDT</span>
              <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
                {['15m', '1h', '4h', '1d'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                      selectedTimeframe === tf
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                ● SIGNAL LIVE
              </span>
            </div>
          </div>

          {/* Candlestick & Target Zone Graphic */}
          <div className="h-64 sm:h-80 w-full my-6 bg-[#040814] rounded-xl border border-slate-800/80 relative overflow-hidden flex items-center justify-center p-4">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#131e33_1px,transparent_1px),linear-gradient(to_bottom,#131e33_1px,transparent_1px)] bg-[size:4rem_3rem] opacity-35" />

            {/* Dotted Key Level Line */}
            <div className="absolute top-[52%] left-0 right-0 border-b border-dashed border-cyan-400/50" />

            {/* Target Green Profit Zone Box (Right half) */}
            <div className="absolute top-[28%] right-8 w-60 sm:w-80 h-24 bg-emerald-500/15 border border-emerald-400/40 rounded-lg flex flex-col justify-between p-2.5">
              <span className="text-[10px] font-mono font-bold text-emerald-300">
                TAKE PROFIT ZONE · $86,450.35
              </span>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[11px] font-bold font-mono">
                  +3.8% GAIN
                </span>
                <button
                  onClick={() => alert('Alert activated for BTC/USDT target $86,450')}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-emerald-400/50 text-[10px] text-white font-mono hover:bg-emerald-500 hover:text-black transition-colors cursor-pointer"
                >
                  Set alert 🔔
                </button>
              </div>
            </div>

            {/* Stop Loss Red Zone Box */}
            <div className="absolute top-[55%] right-8 w-60 sm:w-80 h-16 bg-rose-500/15 border border-rose-400/40 rounded-lg flex items-center justify-between p-2.5">
              <span className="text-[10px] font-mono font-bold text-rose-300">
                STOP LOSS · $81,900.77
              </span>
              <span className="text-[10px] font-mono text-rose-400">-1.4% RISK</span>
            </div>

            {/* Stylized Candle Group (Graphic) */}
            <div className="flex items-end gap-2.5 sm:gap-4 relative z-10 mr-auto ml-6 sm:ml-16">
              <div className="w-2.5 sm:w-3.5 h-16 bg-rose-500/70 rounded-xs relative">
                <div className="w-0.5 h-24 bg-rose-400 absolute left-1/2 -top-4 -translate-x-1/2 -z-1" />
              </div>
              <div className="w-2.5 sm:w-3.5 h-12 bg-rose-500/70 rounded-xs relative">
                <div className="w-0.5 h-20 bg-rose-400 absolute left-1/2 -top-4 -translate-x-1/2 -z-1" />
              </div>
              <div className="w-2.5 sm:w-3.5 h-20 bg-emerald-500/90 rounded-xs relative">
                <div className="w-0.5 h-28 bg-emerald-400 absolute left-1/2 -top-4 -translate-x-1/2 -z-1" />
              </div>
              <div className="w-2.5 sm:w-3.5 h-28 bg-emerald-500/90 rounded-xs relative">
                <div className="w-0.5 h-36 bg-emerald-400 absolute left-1/2 -top-4 -translate-x-1/2 -z-1" />
              </div>
              <div className="w-2.5 sm:w-3.5 h-36 bg-emerald-500 rounded-xs relative shadow-[0_0_15px_#10b981]">
                <div className="w-0.5 h-44 bg-emerald-300 absolute left-1/2 -top-4 -translate-x-1/2 -z-1" />
              </div>
            </div>
          </div>

          {/* Bottom Bar: Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-400">
            <span>Signals update continuously with Binance & Chicago Mercantile Exchange order flow.</span>
            <button
              onClick={() => onLaunchTerminal('order-flow')}
              className="text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore live interactive Bookmap chart →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────── 6. SECTION 06: STRATEGY BUILDER SIMULATOR (IMAGE 4 BOTTOM) ──────────────── */}
      <section className="py-20 px-4 lg:px-8 border-t border-slate-800 bg-[#040816]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            <span>06</span>
            <span>·</span>
            <span>AI COPILOT</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white">
            Describe it.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              IshantMacro AI builds it.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Type your strategy in plain language. Our AI scans order books, liquidity pools, and economic calendars in milliseconds.
          </p>

          {/* Interactive AI Prompt Box */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center gap-2 shadow-[0_0_30px_rgba(0,242,254,0.15)]">
            <Cpu className="size-5 text-cyan-400 ml-3 shrink-0" />
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Find all coins with negative funding and massive short liquidation squeeze near 200 EMA..."
              className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none font-mono"
            />
            <button
              onClick={() => onLaunchTerminal('ultra-ai')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs sm:text-sm hover:brightness-110 transition-all cursor-pointer font-['Outfit'] shrink-0"
            >
              Ask AI
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs">
            {[
              'Gold vs DXY divergence levels',
              'BTC $100M+ liquidation squeeze targets',
              'Indian NIFTY 50 top AI momentum',
              'Delta Exchange 1-3M scalping setups'
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => setCustomPrompt(chip)}
                className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300 transition-all cursor-pointer font-mono text-[11px]"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── 7. HIGH-CONVERTING BOTTOM CTA BANNER ──────────────── */}
      <section className="py-20 px-4 lg:px-8 border-t border-cyan-500/20 bg-gradient-to-b from-[#030610] via-[#050c1e] to-[#02040a] relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white">
            Ready to trade with unfair institutional conviction?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Stop guessing on unverified retail rumors. Get real-time liquidation clusters, Bookmap absorption, and 4-lane AI verdicts now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={handleStartFree}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-base font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 hover:brightness-110 shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-all cursor-pointer font-['Outfit']"
            >
              Start free today →
            </button>
            <button
              onClick={() => onLaunchTerminal('ultra-ai')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full text-base font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all cursor-pointer font-['Outfit']"
            >
              Explore Live Terminal
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              20 Free Daily Tokens
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Sub-Millisecond L2 Depth
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              No Credit Card Required
            </span>
          </div>
        </div>
      </section>

      {/* ──────────────── 8. FOOTER ──────────────── */}
      <footer className="border-t border-slate-900 py-8 px-4 lg:px-8 bg-[#02040a] text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-['Outfit'] text-sm">
              IshantMacro<span className="text-cyan-400">.Ai</span>
            </span>
            <span>·</span>
            <span>Global Macro Command Centre</span>
          </div>
          <div>
            © 2026 IshantMacro.Ai. All rights reserved. High-Risk Capital Trading Notice.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DeeeprLandingPageView;
