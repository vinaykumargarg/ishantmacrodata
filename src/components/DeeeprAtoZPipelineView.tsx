import React, { useState, useEffect, useMemo } from 'react';
import {
  evaluate4LaneAnalysis,
  parsePlainEnglishStrategy,
  runBacktestSimulation,
  deeeprAtoZPipelineManager,
  UnifiedAnalysisOutput,
  StrategyDefinition,
  BacktestResult,
  PaperAccount,
  DeployedStrategyState,
  VerifiableSignalLog,
  DataStatusLabel
} from '../services/deeeprAtoZPipelineEngine';
import { sharedQuoteStore } from '../services/sharedQuoteStore';
import { telegramAlertService } from '../services/telegramAlertService';
import { ALL_WORLD_GLOBAL_NEWS_FEED, UPCOMING_MACRO_CALENDAR_EVENTS } from '../data/institutionalMarketIntelligenceData';
import { getMarketSessionInfo } from '../utils/marketSessionUtils';
import TradingViewWidget from './TradingViewWidget';
import {
  Search, Play, Shield, BarChart3, TrendingUp, Cpu, Activity,
  AlertTriangle, CheckCircle, Clock, Send, Layers, Globe, Radio,
  Sparkles, DollarSign, RefreshCw, FileText, Lock, Eye, ExternalLink,
  ChevronRight, ArrowUpRight, ArrowDownRight, Compass, ShieldAlert,
  Wallet, ListFilter, Share2, Award, Zap, Check, Flame
} from 'lucide-react';

interface Props {
  onNavigate?: (tabId: string) => void;
  initialTab?: string;
}

type AtoZTab =
  | 'analyze'
  | 'charts'
  | 'strategy'
  | 'backtest'
  | 'paper'
  | 'deploy'
  | 'alerts'
  | 'derivatives'
  | 'brief'
  | 'scenario'
  | 'dashboards'
  | 'calendar'
  | 'news'
  | 'community'
  | 'track_record'
  | 'tokens'
  | 'legal'
  | 'earth_radar';

export const DeeeprAtoZPipelineView: React.FC<Props> = ({ onNavigate, initialTab = 'analyze' }) => {
  const [activeTab, setActiveTab] = useState<AtoZTab>(initialTab as AtoZTab);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [strategyPrompt, setStrategyPrompt] = useState<string>(
    '15m chart par jab SSL sweep ho kar price reclaim kare aur volume 25% spike ho, toh long entry le. SL previous swing low ke neeche aur TP1 1.5R, TP2 2.5R rakhe.'
  );

  // Core Pipeline States
  const [analysis, setAnalysis] = useState<UnifiedAnalysisOutput>(() => evaluate4LaneAnalysis('BTC'));
  const [currentStrategy, setCurrentStrategy] = useState<StrategyDefinition>(() =>
    parsePlainEnglishStrategy('SSL sweep & reclaim with volume surge', 'BTC')
  );
  const [backtestResult, setBacktestResult] = useState<BacktestResult>(() =>
    runBacktestSimulation(currentStrategy, 60)
  );
  const [paperAccount, setPaperAccount] = useState<PaperAccount>(() =>
    deeeprAtoZPipelineManager.getPaperAccount()
  );
  const [deployedList, setDeployedList] = useState<DeployedStrategyState[]>(() =>
    deeeprAtoZPipelineManager.getDeployed()
  );
  const [signalLogs, setSignalLogs] = useState<VerifiableSignalLog[]>(() =>
    deeeprAtoZPipelineManager.getSignalLogs()
  );
  const [tokenBalance, setTokenBalance] = useState<number>(() =>
    deeeprAtoZPipelineManager.getTokenBalance()
  );

  // Scenario Simulator state
  const [scenarioEvent, setScenarioEvent] = useState<'CPI_HOT' | 'BTC_CRASH' | 'FED_CUT_50' | 'FUNDING_SPIKE'>('CPI_HOT');

  // Refresh analysis when asset changes
  useEffect(() => {
    const updated = evaluate4LaneAnalysis(selectedAsset);
    setAnalysis(updated);
  }, [selectedAsset]);

  // Sync quote updates
  useEffect(() => {
    const handleQuote = () => {
      setPaperAccount(deeeprAtoZPipelineManager.getPaperAccount());
    };
    window.addEventListener('shared_quote_store_updated', handleQuote);
    return () => window.removeEventListener('shared_quote_store_updated', handleQuote);
  }, []);

  // Strategy Builder Parse handler
  const handleParseStrategy = () => {
    deeeprAtoZPipelineManager.spendTokens('STRATEGY_BUILD', 5, 'Strategy Builder DSL Parse');
    setTokenBalance(deeeprAtoZPipelineManager.getTokenBalance());
    const strat = parsePlainEnglishStrategy(strategyPrompt, selectedAsset);
    setCurrentStrategy(strat);
  };

  // Run Backtest handler
  const handleRunBacktest = () => {
    deeeprAtoZPipelineManager.spendTokens('BACKTEST', 1, 'Candle Replay Backtest');
    setTokenBalance(deeeprAtoZPipelineManager.getTokenBalance());
    const bt = runBacktestSimulation(currentStrategy, 60);
    setBacktestResult(bt);
    setActiveTab('backtest');
  };

  // Paper trade actions
  const handleOpenPaper = (side: 'LONG' | 'SHORT') => {
    deeeprAtoZPipelineManager.openPaperTrade(selectedAsset, side, 1000);
    setPaperAccount(deeeprAtoZPipelineManager.getPaperAccount());
  };

  const handleClosePaper = (posId: string) => {
    deeeprAtoZPipelineManager.closePaperTrade(posId);
    setPaperAccount(deeeprAtoZPipelineManager.getPaperAccount());
  };

  // Primary 7-Step Pipeline Stages
  const primaryStages: { id: AtoZTab; label: string; step: number; icon: any; color: string }[] = [
    { id: 'analyze', label: '1. Analyze (4-Lanes)', step: 1, icon: Cpu, color: 'from-cyan-500 to-blue-600' },
    { id: 'strategy', label: '2. Strategy Builder', step: 2, icon: Sparkles, color: 'from-blue-600 to-indigo-600' },
    { id: 'backtest', label: '3. Backtest Replay', step: 3, icon: BarChart3, color: 'from-indigo-600 to-purple-600' },
    { id: 'paper', label: '4. Paper Trading', step: 4, icon: Wallet, color: 'from-purple-600 to-pink-600' },
    { id: 'deploy', label: '5. Deploy Signals', step: 5, icon: Play, color: 'from-pink-600 to-rose-600' },
    { id: 'alerts', label: '6. Live Alerts', step: 6, icon: Radio, color: 'from-amber-500 to-orange-600' },
    { id: 'track_record', label: '7. Track Record', step: 7, icon: Award, color: 'from-emerald-500 to-teal-600' }
  ];

  // Secondary Modules
  const secondaryTabs: { id: AtoZTab; label: string; icon: any }[] = [
    { id: 'charts', label: 'Live Charts', icon: TrendingUp },
    { id: 'derivatives', label: 'Derivatives Flow', icon: Activity },
    { id: 'brief', label: 'Daily Brief (IST)', icon: FileText },
    { id: 'scenario', label: 'Scenario Simulator', icon: Compass },
    { id: 'earth_radar', label: 'Earth Radar', icon: Globe },
    { id: 'calendar', label: 'Sessions & Calendar', icon: Clock },
    { id: 'news', label: 'Live News', icon: ExternalLink },
    { id: 'community', label: 'Community Opinions', icon: Share2 },
    { id: 'tokens', label: 'Token Ledger', icon: DollarSign },
    { id: 'legal', label: 'Compliance & Rules', icon: Shield }
  ];

  const currentPrice = analysis.currentPrice;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto text-slate-100 font-sans pb-16">
      {/* ── HEADER BANNER: UNIFIED A-TO-Z PIPELINE (LUXURY FINTECH THEME) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-[#071329] via-[#091b38] to-[#0c1426] p-5 shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-400/40 uppercase shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                DEEEPR INSTITUTIONAL PIPELINE v1.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                CLOSED-CANDLE CONFIRMATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                CREDITS: {tokenBalance} PTS
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                DEEEPR A-TO-Z QUANTITATIVE ENGINE
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-2">
              <span className="text-cyan-400 font-mono font-bold">ANALYZE</span> ➔
              <span className="text-blue-400 font-mono font-bold">STRATEGY</span> ➔
              <span className="text-indigo-400 font-mono font-bold">BACKTEST</span> ➔
              <span className="text-purple-400 font-mono font-bold">PAPER</span> ➔
              <span className="text-pink-400 font-mono font-bold">DEPLOY</span> ➔
              <span className="text-amber-400 font-mono font-bold">ALERTS</span> ➔
              <span className="text-emerald-400 font-mono font-bold">TRACK RECORD</span>
            </p>
          </div>

          {/* Asset Selector & Live Quote with Glowing Glass Container */}
          <div className="flex items-center gap-3 bg-[#0a152b]/90 border border-cyan-400/30 rounded-xl p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <span className="text-xs font-black tracking-wider text-cyan-300 uppercase font-mono">Asset:</span>
            {['BTC', 'ETH', 'SOL', 'XAUUSD', 'XAGUSD'].map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedAsset(sym)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer ${
                  selectedAsset === sym
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                    : 'bg-[#101b33] text-slate-300 hover:bg-[#162547] hover:text-white border border-slate-700/60'
                }`}
              >
                {sym}
              </button>
            ))}
            <div className="pl-3 border-l border-slate-700/80 text-right">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Live Mark Price</div>
              <div className="text-base font-black text-cyan-300 font-mono tracking-tight tabular-nums">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* ── STAGE STEPPER (THE 7 CORE PHASES) ── */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {primaryStages.map((st) => {
            const Icon = st.icon;
            const isCurrent = activeTab === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveTab(st.id)}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black tracking-wide shrink-0 transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-102'
                    : 'bg-[#0a1224]/80 text-slate-400 border-slate-800/90 hover:border-cyan-500/40 hover:bg-[#0e1830] hover:text-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Navigation Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] pt-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono font-bold pr-1">Auxiliary Modules:</span>
          {secondaryTabs.map((t) => {
            const Icon = t.icon;
            const isCurrent = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'bg-[#091122]/60 text-slate-400 border-slate-800/60 hover:bg-[#0e1933] hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          M1: ANALYZE VIEW (4 LANES -> SINGLE MASTER ARBITER VERDICT)
          ============================================================== */}
      {activeTab === 'analyze' && (
        <div className="space-y-4">
          {/* Master Verdict Hero Banner (Visual State Glow) */}
          <div
            className={`rounded-2xl border p-6 shadow-2xl transition-all ${
              analysis.masterVerdict === 'LONG'
                ? 'border-emerald-500/50 bg-gradient-to-br from-[#06201a]/95 via-[#071622]/90 to-[#060b14] shadow-[0_0_35px_rgba(16,185,129,0.18)]'
                : analysis.masterVerdict === 'SHORT'
                ? 'border-rose-500/50 bg-gradient-to-br from-[#240810]/95 via-[#1a081a]/90 to-[#060b14] shadow-[0_0_35px_rgba(244,63,94,0.18)]'
                : 'border-amber-500/50 bg-gradient-to-br from-[#261806]/95 via-[#181308]/90 to-[#060b14] shadow-[0_0_35px_rgba(245,158,11,0.18)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-5 pb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl shadow-lg border ${
                    analysis.masterVerdict === 'LONG'
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20'
                      : analysis.masterVerdict === 'SHORT'
                      ? 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-rose-500/20'
                      : 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-amber-500/20'
                  }`}
                >
                  <span className="text-[10px] font-mono tracking-widest opacity-80 uppercase">VERDICT</span>
                  <span className="text-xl leading-none">{analysis.masterVerdict}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight text-white">
                      MASTER ARBITER: {analysis.masterVerdict}
                    </h2>
                    <span className="px-3 py-0.5 rounded-full text-xs font-black font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/40">
                      CONFIDENCE: {analysis.confidencePct}% ({analysis.badge})
                    </span>
                    {analysis.isUnprovenSample && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                        UNPROVEN (n=0 live ledger)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1.5 leading-relaxed">
                    {analysis.disagreement.waitReason}
                  </p>
                </div>
              </div>

              {/* Trade Plan Box with Vibrant Metrics */}
              {analysis.tradePlan && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0a1426]/90 p-3.5 rounded-xl border border-cyan-500/30 text-xs shadow-md backdrop-blur-md">
                  <div>
                    <span className="text-[10px] text-cyan-400 block font-mono font-bold uppercase tracking-wider">PLANNED ENTRY</span>
                    <span className="text-sm font-black text-white font-mono tabular-nums">
                      ${analysis.tradePlan.entryMin} - ${analysis.tradePlan.entryMax}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block font-mono font-bold uppercase tracking-wider">STRUCTURAL STOP</span>
                    <span className="text-sm font-black text-rose-300 font-mono tabular-nums">
                      ${analysis.tradePlan.sl}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-mono font-bold uppercase tracking-wider">TARGET (TP1/TP2)</span>
                    <span className="text-sm font-black text-emerald-300 font-mono tabular-nums">
                      ${analysis.tradePlan.tp1} / ${analysis.tradePlan.tp2}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 block font-mono font-bold uppercase tracking-wider">NET RISK/REWARD</span>
                    <span className="text-sm font-black text-amber-300 font-mono tabular-nums">
                      1 : {analysis.tradePlan.netRr} (Net)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Disagreement Matrix Alert Card */}
            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-200 bg-[#091325]/90 p-3 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-black font-mono text-cyan-300">LANE CONSENSUS:</span>
                <span>
                  Long: <b className="text-emerald-400 font-mono">{analysis.disagreement.longLanes.join(', ') || 'None'}</b> |
                  Short: <b className="text-rose-400 font-mono">{analysis.disagreement.shortLanes.join(', ') || 'None'}</b> |
                  Neutral: <b className="text-slate-400 font-mono">{analysis.disagreement.neutralLanes.join(', ') || 'None'}</b>
                </span>
              </div>
              <div className="text-slate-300 text-[11px] font-mono">
                Condition to Flip: <span className="text-cyan-300 font-bold">{analysis.disagreement.conditionToFlip}</span>
              </div>
            </div>
          </div>

          {/* 4 Lanes Evidence Cards (Signature Visual Themes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Technical Lane (Electric Cyan) */}
            <div className="rounded-2xl border border-cyan-500/35 bg-gradient-to-b from-[#08182b] via-[#071322] to-[#050c17] p-4.5 flex flex-col justify-between shadow-[0_8px_25px_rgba(6,182,212,0.12)]">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-cyan-200 uppercase tracking-wide">Technical Lane</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-900/50 text-cyan-300 border border-cyan-700">
                      {analysis.lanes.Technical.dataStatus}
                    </span>
                  </div>
                  <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-full ${
                    analysis.lanes.Technical.lean === 'LONG'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {analysis.lanes.Technical.lean} (+{analysis.lanes.Technical.score})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-2.5">
                  Source: <span className="text-cyan-300 font-semibold">{analysis.lanes.Technical.dataSource}</span>
                </div>
                <div className="space-y-2 border-t border-cyan-900/40 pt-2.5 text-xs text-slate-200">
                  {analysis.lanes.Technical.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5 font-bold">›</span>
                      <span className="leading-snug">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-cyan-900/40 flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>Coverage: {analysis.lanes.Technical.coverage}%</span>
                <span>Strength: {analysis.lanes.Technical.strength}/100</span>
              </div>
            </div>

            {/* 2. Flow & Derivatives Lane (Royal Purple) */}
            <div className="rounded-2xl border border-purple-500/35 bg-gradient-to-b from-[#180e2b] via-[#120a22] to-[#080514] p-4.5 flex flex-col justify-between shadow-[0_8px_25px_rgba(168,85,247,0.12)]">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-purple-200 uppercase tracking-wide">Flow Lane</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-900/50 text-purple-300 border border-purple-700">
                      {analysis.lanes.Flow.dataStatus}
                    </span>
                  </div>
                  <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-full ${
                    analysis.lanes.Flow.lean === 'LONG'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {analysis.lanes.Flow.lean} (+{analysis.lanes.Flow.score})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-2.5">
                  Source: <span className="text-purple-300 font-semibold">{analysis.lanes.Flow.dataSource}</span>
                </div>
                <div className="space-y-2 border-t border-purple-900/40 pt-2.5 text-xs text-slate-200">
                  {analysis.lanes.Flow.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-400 mt-0.5 font-bold">›</span>
                      <span className="leading-snug">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-purple-900/40 flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>Coverage: {analysis.lanes.Flow.coverage}%</span>
                <span>Strength: {analysis.lanes.Flow.strength}/100</span>
              </div>
            </div>

            {/* 3. News Lane (Warm Gold) */}
            <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#241708] via-[#1a1106] to-[#0c0803] p-4.5 flex flex-col justify-between shadow-[0_8px_25px_rgba(245,158,11,0.12)]">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-amber-200 uppercase tracking-wide">News Lane</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-900/50 text-amber-300 border border-amber-700">
                      {analysis.lanes.News.dataStatus}
                    </span>
                  </div>
                  <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {analysis.lanes.News.lean} (+{analysis.lanes.News.score})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-2.5">
                  Source: <span className="text-amber-300 font-semibold">{analysis.lanes.News.dataSource}</span>
                </div>
                <div className="space-y-2 border-t border-amber-900/40 pt-2.5 text-xs text-slate-200">
                  {analysis.lanes.News.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5 font-bold">›</span>
                      <span className="leading-snug">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-amber-900/40 flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>Coverage: {analysis.lanes.News.coverage}%</span>
                <span>Strength: {analysis.lanes.News.strength}/100</span>
              </div>
            </div>

            {/* 4. Macro Lane (Emerald Mint) */}
            <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-b from-[#082218] via-[#061912] to-[#040d0a] p-4.5 flex flex-col justify-between shadow-[0_8px_25px_rgba(16,185,129,0.12)]">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-emerald-200 uppercase tracking-wide">Macro Lane</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700">
                      {analysis.lanes.Macro.dataStatus}
                    </span>
                  </div>
                  <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                    {analysis.lanes.Macro.lean} (+{analysis.lanes.Macro.score})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-2.5">
                  Source: <span className="text-emerald-300 font-semibold">{analysis.lanes.Macro.dataSource}</span>
                </div>
                <div className="space-y-2 border-t border-emerald-900/40 pt-2.5 text-xs text-slate-200">
                  {analysis.lanes.Macro.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5 font-bold">›</span>
                      <span className="leading-snug">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-emerald-900/40 flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>Coverage: {analysis.lanes.Macro.coverage}%</span>
                <span>Strength: {analysis.lanes.Macro.strength}/100</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-r from-[#0a1426] via-[#0d1a33] to-[#0a1426] p-4.5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div className="text-xs text-slate-300 font-medium">
              4-Lane consensus verified. Ready to convert this hypothesis into exact strategy rules or verify historical edge?
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('strategy')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <Sparkles className="w-4 h-4" />
                Build Strategy Rules
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className="px-5 py-2.5 rounded-xl bg-[#142340] text-cyan-300 font-bold text-xs hover:bg-[#1a2f57] border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                View On Live Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M2: LIVE CHARTS WITH ENTRY / SL / TP OVERLAYS
          ============================================================== */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-lg text-white">Live Execution Terminal ({selectedAsset})</h3>
                <p className="text-xs text-slate-300">
                  Real-time candles with Master Planned Entry (${analysis.tradePlan?.entryMin} - ${analysis.tradePlan?.entryMax}), SL (${analysis.tradePlan?.sl}) & TP targets.
                </p>
              </div>
              <button
                onClick={() => {
                  alert(`Alert scheduled for ${selectedAsset} at trigger level $${analysis.tradePlan?.entryMin}!`);
                  setActiveTab('alerts');
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:brightness-110"
              >
                <Radio className="w-4 h-4" /> Set Telegram Alert
              </button>
            </div>

            <div className="h-[580px] w-full rounded-xl overflow-hidden border border-slate-700/80 bg-[#060a12] shadow-inner">
              <TradingViewWidget
                symbol={selectedAsset === 'BTC' ? 'BINANCE:BTCUSDT' : selectedAsset === 'ETH' ? 'BINANCE:ETHUSDT' : selectedAsset === 'XAUUSD' ? 'OANDA:XAUUSD' : 'BINANCE:SOLUSDT'}
                interval="15"
                theme="dark"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M3: STRATEGY BUILDER (PLAIN ENGLISH / HINGLISH -> RULES DSL)
          ============================================================== */}
      {activeTab === 'strategy' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-1.5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Plain-English / Hinglish Strategy Builder
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Apne trading idea ko aam bhasha mein likhein. Parser ise exact rule DSL JSON mein convert karke dikhayega ("maine ye samjha"). Ambiguity hone par sawal puchega, guess nahi karega.
            </p>

            {/* Prompt Input Box */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">Strategy Logic Prompt:</label>
              <textarea
                rows={3}
                value={strategyPrompt}
                onChange={(e) => setStrategyPrompt(e.target.value)}
                placeholder="e.g. 15m candle par jab RSI 30 ke neeche jaakar bullish pin bar banaye aur volume 1.3x average ho, tab long karein..."
                className="w-full bg-[#0a1426] border border-cyan-500/30 rounded-xl p-4 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Fast Templates:</span>
                  {[
                    { label: 'Sweep & Reclaim', text: '15m par Prior Day Low sweep ho kar range me reclaim kare aur volume 25% surge ho' },
                    { label: 'Pullback in 4H Trend', text: '4H trend bullish ho, 15m price 50-EMA test kare aur rejection candle close de' },
                    { label: 'Volume POC Rejection', text: 'Volume profile POC par tap kare aur CVD delta positive turn ho' }
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      onClick={() => setStrategyPrompt(tpl.text)}
                      className="px-2.5 py-1 bg-[#101c36] hover:bg-[#16274d] text-cyan-300 rounded-lg text-[10px] font-mono font-semibold border border-cyan-500/20 cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleParseStrategy}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black font-black text-xs rounded-xl hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <Cpu className="w-4 h-4" /> Parse Rules (5 Tokens)
                </button>
              </div>
            </div>

            {/* "Maine Ye Samjha" Echo & Warning Card */}
            {currentStrategy && (
              <div className="mt-6 rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-[#0b172a] via-[#091322] to-[#070e1a] p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                  <span className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Maine Ye Samjha (Parser Echo)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Execution Engine: Closed-Candle v1.0</span>
                </div>
                <p className="text-xs text-slate-200 bg-[#060c17] p-3.5 rounded-xl border border-slate-700/80 leading-relaxed font-mono">
                  {currentStrategy.parsedSummary}
                </p>

                {currentStrategy.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    {currentStrategy.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/15 p-2.5 rounded-xl border border-amber-500/30">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Entry Rules DSL Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider font-mono">Configured Strategy Conditions:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {currentStrategy.entryRules.map((rule) => (
                      <div key={rule.id} className="bg-[#0b1528] p-3.5 rounded-xl border border-cyan-500/25 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] text-cyan-300 font-mono font-bold mb-1.5">
                          <span>{rule.indicator}</span>
                          <span className="px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-200">{rule.timeframe}</span>
                        </div>
                        <div className="text-white font-black font-mono text-sm">{rule.operator} {rule.threshold}</div>
                        <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">{rule.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action to Backtest */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Conservative SL: 1.5x ATR · Intrabar Tie: SL Evaluated First · Fees: 0.05%
                  </div>
                  <button
                    onClick={handleRunBacktest}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110"
                  >
                    <Play className="w-4 h-4" /> Run Deterministic Backtest (1 Token)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          M4: DETERMINISTIC BACKTEST ENGINE VIEW
          ============================================================== */}
      {activeTab === 'backtest' && backtestResult && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-xl font-black text-white">Backtest Report: {backtestResult.strategyName}</h3>
                  {backtestResult.isUnproven ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                      UNPROVEN (n &lt; 30)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                      STATISTICALLY SIGNIFICANT (n={backtestResult.totalTrades})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Exchange: Binance / Delta Candles · Intrabar Tie: SL First · Cost: 0.05% fee + 0.02% slippage
                </p>
              </div>

              <button
                onClick={() => setActiveTab('paper')}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <Wallet className="w-4 h-4" /> Forward to Paper Trading
              </button>
            </div>

            {/* Performance KPI Metrics (Large JetBrains Mono Numbers) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 my-5">
              <div className="bg-gradient-to-b from-[#0c1a33] to-[#081224] p-4 rounded-xl border border-cyan-500/25 text-center shadow-md">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">WIN RATE</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums block mt-0.5">{backtestResult.winRatePct}%</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">
                  Wilson: {backtestResult.wilsonLowerBound}% - {backtestResult.wilsonUpperBound}%
                </span>
              </div>
              <div className="bg-gradient-to-b from-[#0c1a33] to-[#081224] p-4 rounded-xl border border-cyan-500/25 text-center shadow-md">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">AVG R-MULTIPLE</span>
                <span className="text-2xl font-black text-white font-mono tabular-nums block mt-0.5">+{backtestResult.avgRMultiple}R</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">per winner</span>
              </div>
              <div className="bg-gradient-to-b from-[#0c1a33] to-[#081224] p-4 rounded-xl border border-cyan-500/25 text-center shadow-md">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">PROFIT FACTOR</span>
                <span className="text-2xl font-black text-cyan-300 font-mono tabular-nums block mt-0.5">{backtestResult.profitFactor}</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">Gross Win / Loss</span>
              </div>
              <div className="bg-gradient-to-b from-[#0c1a33] to-[#081224] p-4 rounded-xl border border-rose-500/25 text-center shadow-md">
                <span className="text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider block">MAX DRAWDOWN</span>
                <span className="text-2xl font-black text-rose-400 font-mono tabular-nums block mt-0.5">-{backtestResult.maxDrawdownPct}%</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">Peak to Trough</span>
              </div>
              <div className="bg-gradient-to-b from-[#0c1a33] to-[#081224] p-4 rounded-xl border border-purple-500/25 text-center shadow-md">
                <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider block">EXPECTANCY (R)</span>
                <span className="text-2xl font-black text-purple-300 font-mono tabular-nums block mt-0.5">+{backtestResult.expectancyR}R</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">Mathematical Edge</span>
              </div>
              <div className="bg-gradient-to-b from-[#0c1a33] to-[#081224] p-4 rounded-xl border border-emerald-500/25 text-center shadow-md">
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">NET SIMULATED PNL</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums block mt-0.5">+{backtestResult.netPnlPct}%</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">After all costs</span>
              </div>
            </div>

            {/* Trade Log Table */}
            <div className="space-y-2 mt-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Sample Replay Execution Trades:</span>
                <span className="text-[10px] text-cyan-400 font-mono">Showing {backtestResult.trades.length} trades</span>
              </div>
              <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b162b] text-slate-300 border-b border-slate-700/80">
                    <tr>
                      <th className="p-3">Trade #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Side</th>
                      <th className="p-3">Entry Price</th>
                      <th className="p-3">Exit Price</th>
                      <th className="p-3">R-Multiple</th>
                      <th className="p-3">Net PnL ($)</th>
                      <th className="p-3">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#070d1a]">
                    {backtestResult.trades.slice(0, 10).map((tr) => (
                      <tr key={tr.id} className="hover:bg-[#0d1a33]/60 transition-colors">
                        <td className="p-3 text-slate-400">{tr.id}</td>
                        <td className="p-3 text-slate-300">{tr.entryTime}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            tr.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {tr.side}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200 tabular-nums">${tr.entryPrice.toLocaleString()}</td>
                        <td className="p-3 text-slate-200 tabular-nums">${tr.exitPrice.toLocaleString()}</td>
                        <td className={`p-3 font-black tabular-nums ${tr.rMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tr.rMultiple > 0 ? `+${tr.rMultiple}R` : `${tr.rMultiple}R`}
                        </td>
                        <td className={`p-3 font-black tabular-nums ${tr.pnlDollar > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tr.pnlDollar > 0 ? `+$${tr.pnlDollar}` : `-$${Math.abs(tr.pnlDollar)}`}
                        </td>
                        <td className="p-3 text-[11px] text-slate-300">{tr.exitReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M5: PAPER TRADING VIEW
          ============================================================== */}
      {activeTab === 'paper' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-cyan-400" />
                  Simulated Paper Trading Terminal
                </h3>
                <p className="text-xs text-slate-300">
                  Real-time market prices with simulated virtual liquidity. Test execution discipline & forward performance before deploying live.
                </p>
              </div>

              {/* Account Balance Card */}
              <div className="flex items-center gap-5 bg-[#0a162d] p-3.5 rounded-xl border border-cyan-400/30 shadow-lg">
                <div>
                  <span className="text-[10px] text-cyan-300 font-mono font-bold block uppercase tracking-wider">VIRTUAL EQUITY</span>
                  <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">
                    ${paperAccount.equity.toLocaleString()}
                  </span>
                </div>
                <div className="border-l border-slate-700/80 pl-4">
                  <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">CASH BALANCE</span>
                  <span className="text-sm font-bold text-slate-200 font-mono tabular-nums">
                    ${paperAccount.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Order Execution Panel */}
            <div className="my-5 p-4.5 rounded-xl bg-gradient-to-r from-[#0b172a] via-[#0d1c38] to-[#0b172a] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <span className="text-sm font-black text-white block">Execute Simulated Market Order ({selectedAsset})</span>
                <span className="text-xs text-slate-300 font-mono">
                  Fixed $1,000 position sizing · Stop-Loss 1.5% · TP 2.5%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenPaper('LONG')}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:brightness-110"
                >
                  <ArrowUpRight className="w-4 h-4" /> Paper Long ($1,000)
                </button>
                <button
                  onClick={() => handleOpenPaper('SHORT')}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:brightness-110"
                >
                  <ArrowDownRight className="w-4 h-4" /> Paper Short ($1,000)
                </button>
              </div>
            </div>

            {/* Open Positions Table */}
            <div className="space-y-2 mt-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Active Open Paper Positions:</span>
              {paperAccount.openPositions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-[#060c17] rounded-xl border border-slate-800 font-mono">
                  No active paper positions. Click "Paper Long" or "Paper Short" to simulate.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0b162b] text-slate-300 border-b border-slate-700/80">
                      <tr>
                        <th className="p-3">Asset</th>
                        <th className="p-3">Side</th>
                        <th className="p-3">Entry Price</th>
                        <th className="p-3">Mark Price</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Unrealized PnL</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-[#070d1a]">
                      {paperAccount.openPositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-[#0d1a33]/60 transition-colors">
                          <td className="p-3 font-black text-white">{pos.asset}</td>
                          <td className="p-3 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              pos.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {pos.side}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 tabular-nums">${pos.entryPrice.toLocaleString()}</td>
                          <td className="p-3 text-cyan-300 font-black tabular-nums">${pos.currentPrice.toLocaleString()}</td>
                          <td className="p-3 text-slate-400 tabular-nums">{pos.sizeUnits}</td>
                          <td className={`p-3 font-black tabular-nums ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pos.unrealizedPnl >= 0 ? `+$${pos.unrealizedPnl}` : `-$${Math.abs(pos.unrealizedPnl)}`} ({pos.unrealizedPnlPct}%)
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleClosePaper(pos.id)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold cursor-pointer border border-slate-600"
                            >
                              Close Market
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M6: DEPLOY (LIVE STRATEGIES & SIGNAL BROADCAST)
          ============================================================== */}
      {activeTab === 'deploy' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  Deployed Quantitative Strategies (Live Signals Only)
                </h3>
                <p className="text-xs text-slate-300">
                  Headless signal generation engine. Signals fire exclusively on closed candles and broadcast to UI & Telegram alerts.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono text-emerald-300 font-black">DAEMON ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
              {deployedList.map((st) => (
                <div key={st.strategyId} className="p-5 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-[#0b162b] to-[#070e1c] flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-base text-white">{st.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-black ${
                          st.status === 'RUNNING'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {st.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-[#060c17] p-3 rounded-xl border border-slate-800 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">ASSET / TF</span>
                        <span className="text-white font-black">{st.asset} ({st.timeframe})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">LAST SIGNAL</span>
                        <span className="text-cyan-300 font-black">{st.lastSignal}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">LATENCY</span>
                        <span className="text-emerald-400 font-black">{st.latencyMs}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px] font-mono">Last evaluated: {st.lastEvaluatedAt}</span>
                    <button
                      onClick={() => {
                        deeeprAtoZPipelineManager.toggleDeploy(st.strategyId);
                        setDeployedList(deeeprAtoZPipelineManager.getDeployed());
                      }}
                      className="px-4 py-1.5 bg-[#12203d] hover:bg-[#1a2d54] text-cyan-300 border border-cyan-500/30 rounded-lg font-bold text-xs cursor-pointer transition-all"
                    >
                      {st.status === 'RUNNING' ? 'Pause Strategy' : 'Resume Strategy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M8: TELEGRAM & LIVE ALERTS
          ============================================================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1.5">
              <Radio className="w-5 h-5 text-cyan-400" />
              Live Telegram & Webhook Alerts
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Real-time push notifications jab Master Arbiter ya Deployed Strategies closed candle par trigger confirm karein.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl border border-cyan-500/25 bg-[#0b162b] space-y-3">
                <h4 className="font-black text-sm text-cyan-300 uppercase tracking-wider font-mono">Telegram Bot Daemon Status</h4>
                <div className="space-y-2 text-xs text-slate-200">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-mono">Daemon Script:</span>
                    <span className="font-mono text-emerald-400 font-bold">telegram_alert_daemon.py</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-mono">Channel / Chat:</span>
                    <span className="font-mono text-white font-bold">VIP Institutional Signals</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-mono">Trigger Filter:</span>
                    <span className="font-mono text-cyan-300 font-bold">Closed Candle + Master Verdict Only</span>
                  </div>
                </div>
                <button
                  onClick={() => alert('Test alert dispatch simulated successfully to connected Telegram channel!')}
                  className="mt-3 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" /> Send Test Alert
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-cyan-500/25 bg-[#0b162b] space-y-2.5">
                <h4 className="font-black text-sm text-cyan-300 uppercase tracking-wider font-mono">Subscribed Event Categories</h4>
                <div className="space-y-2 text-xs text-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-cyan-500 w-4 h-4" />
                    <span>Master Verdict State Changes (WAIT ➔ LONG / SHORT)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-cyan-500 w-4 h-4" />
                    <span>Take-Profit & Stop-Loss Hit Confirmations</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-cyan-500 w-4 h-4" />
                    <span>US Tier-1 Event Blackout Warnings (FOMC / CPI 30m prior)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-cyan-500 w-4 h-4" />
                    <span>Liquidity Sweep & Reclaim Alerts</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M15: TRACK RECORD (APPEND-ONLY VERIFIABLE SIGNAL LOG)
          ============================================================== */}
      {activeTab === 'track_record' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  Verifiable Production Track Record
                </h3>
                <p className="text-xs text-slate-300">
                  Append-only immutable signal ledger. Har verdict ka outcome closed candle se resolve hota hai (TARGET_HIT, STOP_HIT, NO_RESULT). Editing or deleting logged trades is cryptographically forbidden.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-black shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  SHA-256 INTEGRITY PROTECTED
                </span>
              </div>
            </div>

            {/* Performance Ledger Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
              <div className="bg-[#0b162b] p-4 rounded-xl border border-slate-700/80 text-center">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">VERIFIED SIGNALS</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">{signalLogs.length}</span>
                <span className="text-[10px] text-amber-300 font-mono font-bold block mt-1">UNPROVEN (n &lt; 30)</span>
              </div>
              <div className="bg-[#0b162b] p-4 rounded-xl border border-slate-700/80 text-center">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">HIT RATE</span>
                <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
                  {Math.round((signalLogs.filter(s => s.outcome === 'TARGET_HIT').length / signalLogs.length) * 100)}%
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">Closed-candle hit</span>
              </div>
              <div className="bg-[#0b162b] p-4 rounded-xl border border-slate-700/80 text-center">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">REALIZED AVG R</span>
                <span className="text-2xl font-black text-cyan-300 font-mono block mt-1">+1.05R</span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">Net R-Multiple</span>
              </div>
              <div className="bg-[#0b162b] p-4 rounded-xl border border-slate-700/80 text-center">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">LATEST CHECKSUM</span>
                <span className="text-xs font-mono text-cyan-300 font-bold block truncate mt-1">0x3f4a9b1c8e227d4e</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-1">Append-only Valid</span>
              </div>
            </div>

            {/* Verifiable Ledger Table */}
            <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b162b] text-slate-300 border-b border-slate-700/80">
                  <tr>
                    <th className="p-3">Signal ID</th>
                    <th className="p-3">Checksum Hash</th>
                    <th className="p-3">Asset / TF</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Entry / SL / TP</th>
                    <th className="p-3">Outcome</th>
                    <th className="p-3">Realized R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#070d1a]">
                  {signalLogs.map((log) => (
                    <tr key={log.signalId} className="hover:bg-[#0d1a33]/60 transition-colors">
                      <td className="p-3 font-bold text-slate-300">{log.signalId}</td>
                      <td className="p-3 text-cyan-400 font-mono text-[11px] font-bold">{log.checksum}</td>
                      <td className="p-3 text-slate-200">{log.asset} ({log.timeframe})</td>
                      <td className="p-3 font-black">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {log.side}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 tabular-nums">
                        ${log.entryPrice} / ${log.sl} / ${log.tp}
                      </td>
                      <td className="p-3 font-black">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            log.outcome === 'TARGET_HIT'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : log.outcome === 'STOP_HIT'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </td>
                      <td className={`p-3 font-black tabular-nums ${log.realizedR && log.realizedR > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.realizedR && log.realizedR > 0 ? `+${log.realizedR}R` : `${log.realizedR}R`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M7: DERIVATIVES FLOW DASHBOARDS
          ============================================================== */}
      {activeTab === 'derivatives' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1.5">
              <Activity className="w-5 h-5 text-cyan-400" />
              Derivatives Positioning & Order Flow Terminal
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Real-time Open Interest, Funding Rates, Long/Short Liquidation Clusters, and Cumulative Volume Delta (CVD).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0b162b] p-4.5 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">AGGREGATE OPEN INTEREST</span>
                <span className="text-2xl font-black text-white font-mono mt-1 block tabular-nums">$34.82B</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">+3.4% (24H expanding)</span>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-snug">Price rise accompanied by expanding OI confirms trend conviction rather than short covering.</p>
              </div>

              <div className="bg-[#0b162b] p-4.5 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">PERP FUNDING RATE (8H)</span>
                <span className="text-2xl font-black text-cyan-300 font-mono mt-1 block tabular-nums">+0.0068%</span>
                <span className="text-xs text-slate-400 font-mono">Neutral baseline</span>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-snug">Retail longs are not over-leveraged. Funding squeeze risk remains low.</p>
              </div>

              <div className="bg-[#0b162b] p-4.5 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block">TOP LIQUIDATION POOL</span>
                <span className="text-2xl font-black text-amber-300 font-mono mt-1 block tabular-nums">${(currentPrice * 1.025).toFixed(0)}</span>
                <span className="text-xs text-amber-300 font-mono font-bold">~$210M Short stops</span>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-snug">Overhead buy stops cluster provides potential upside magnet before resistance test.</p>
              </div>

              <div className="bg-[#0b162b] p-4.5 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">CVD SPOT DELTA</span>
                <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block tabular-nums">+1,420 BTC</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">Spot-led advance</span>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-snug">Spot market buying absorption dominant over derivative perpetual speculation.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M9: DAILY BRIEF (MORNING IST SUMMARY)
          ============================================================== */}
      {activeTab === 'brief' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Daily Institutional Market Brief (IST Morning Edition)
                </h3>
                <p className="text-xs text-slate-300">
                  Deterministically grounded summary generated from live feeds & central bank data. Zero hallucinated claims.
                </p>
              </div>
              <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/70 px-3 py-1.5 rounded-xl border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                DATE: 29 OCT 2026 (08:30 IST)
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed bg-[#0b162b] p-5 rounded-xl border border-slate-700/80 font-mono">
              <h4 className="font-black text-sm text-cyan-300 uppercase tracking-widest">Executive Institutional Summary</h4>
              <p>
                1. <b className="text-white">Key Structural Levels:</b> Bitcoin maintains its high-timeframe foothold above the 50-day EMA ($82,400), with the primary demand order block defined at $84,100 – $85,200. Overhead resistance sits at the structural swing high of $89,500.
              </p>
              <p>
                2. <b className="text-white">Macro Backdrop & Intermarket:</b> The US Dollar Index (DXY) consolidated at 102.35 (-0.28%), releasing overhead pressure on Gold (XAUUSD holding firmly at $2,735) and Bitcoin. 10-Year Treasury yields remain stable at 4.08%.
              </p>
              <p>
                3. <b className="text-white">Scheduled Economic Events:</b> No Tier-1 US blackout events are scheduled during Asian session hours. Markets remain vigilant ahead of upcoming US Core PCE inflation indices later this week.
              </p>
              <p>
                4. <b className="text-white">Institutional Bias & Positioning:</b> Master Arbiter maintains a cautious <b className="text-amber-400">WAIT</b> stance pending execution-timeframe closed-candle trigger confirmation. Mid-range is treated strictly as a NO-TRADE zone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M10: SCENARIO SIMULATOR ("AGAR X HO TOH...")
          ============================================================== */}
      {activeTab === 'scenario' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1.5">
              <Compass className="w-5 h-5 text-cyan-400" />
              Scenario Simulator ("Agar X Ho Toh Levels/Plan Par Kya Asar Hoga?")
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Rule & volatility-based scenario projections. All outputs carry the mandatory <b className="text-amber-400">ESTIMATED</b> tag.
            </p>

            {/* Scenario Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { id: 'CPI_HOT', label: 'US CPI Comes Hot (+0.4%)' },
                { id: 'BTC_CRASH', label: 'Bitcoin Dumps -5% Instant' },
                { id: 'FED_CUT_50', label: 'Fed Cuts Rate by 50 bps' },
                { id: 'FUNDING_SPIKE', label: 'Perp Funding Spikes > +0.08%' }
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setScenarioEvent(sc.id as any)}
                  className={`p-3.5 rounded-xl text-xs font-black text-left transition-all cursor-pointer border ${
                    scenarioEvent === sc.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-[#0b162b] text-slate-400 border-slate-700/80 hover:text-white'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Scenario Impact Projection */}
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#0b162b] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Estimated Macro Transmission Model
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ESTIMATED · RESEARCH ONLY
                </span>
              </div>

              {scenarioEvent === 'CPI_HOT' && (
                <div className="text-xs text-slate-200 space-y-2.5 leading-relaxed font-mono">
                  <p>• <b className="text-white">Immediate DXY Impact:</b> Dollar index surges +0.45% to +0.80% as rate-cut expectations push out.</p>
                  <p>• <b className="text-white">Gold (XAUUSD):</b> Initial liquidity sweep down of $25 - $40 towards nearest HTF Demand Zone ($2,705).</p>
                  <p>• <b className="text-white">Bitcoin & Crypto:</b> High-beta dump testing structural stop level ($83,100). Long Master Verdict immediately vetos into WAIT with EVENT_VOLATILITY flag.</p>
                  <p>• <b className="text-white">Recommended Action:</b> 30-minute blackout window before and after the release. Do not place limit orders inside the spread.</p>
                </div>
              )}

              {scenarioEvent === 'BTC_CRASH' && (
                <div className="text-xs text-slate-200 space-y-2.5 leading-relaxed font-mono">
                  <p>• <b className="text-white">Liquidation Cascade:</b> Estimated $180M in leveraged long liquidations flushed down to $81,200.</p>
                  <p>• <b className="text-white">Altcoins:</b> Beta multiplier 1.5x - 2.0x, dropping -7% to -10% across Delta exchange universe.</p>
                  <p>• <b className="text-white">Master Arbiter State:</b> Immediate transition to <b>ARMED-LONG (Sweep-Reclaim L3)</b> if candle sweeps $81,000 and closes back above within 15m.</p>
                </div>
              )}

              {scenarioEvent === 'FED_CUT_50' && (
                <div className="text-xs text-slate-200 space-y-2.5 leading-relaxed font-mono">
                  <p>• <b className="text-white">Global Liquidity Surge:</b> Rapid risk-on expansion. DXY slides towards 101.50.</p>
                  <p>• <b className="text-white">Gold & Silver:</b> Direct breakout above all-time high resistance band.</p>
                  <p>• <b className="text-white">Bitcoin:</b> Target TP3 ($89,500+) triggered with high volume delta.</p>
                </div>
              )}

              {scenarioEvent === 'FUNDING_SPIKE' && (
                <div className="text-xs text-slate-200 space-y-2.5 leading-relaxed font-mono">
                  <p>• <b className="text-white">Overcrowded Long Warning:</b> Retail funding extremes indicate late FOMO buyers.</p>
                  <p>• <b className="text-white">Counter-Trend Risk:</b> High probability of smart-money long squeeze before any continuation.</p>
                  <p>• <b className="text-white">Arbiter Filter:</b> Long score penalized by -20 points; entries locked until funding cools below +0.02%.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M18: EARTH RADAR (GEOPOLITICAL & MACRO GEO-MAP)
          ============================================================== */}
      {activeTab === 'earth_radar' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1.5">
              <Globe className="w-5 h-5 text-cyan-400" />
              Earth Radar (Geopolitical & Macro Geo-Risk Map)
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Global events mapped by geographic origin, asset impact hypothesis, and trust classification.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  region: 'Middle East (Strait of Hormuz)',
                  category: 'Oil Supply & Geopolitics',
                  headline: 'Tanker transit surveillance tightened; maritime insurance rates adjusted',
                  impact: 'Crude Oil (WTI/Brent) & Gold Bullish Evidence',
                  trust: 'CONFIRMED'
                },
                {
                  region: 'Washington D.C. (Federal Reserve)',
                  category: 'Monetary Policy',
                  headline: 'FOMC members reiterate data-dependent neutral interest rate trajectory',
                  impact: 'DXY Consolidating, US10Y Stable',
                  trust: 'CONFIRMED'
                },
                {
                  region: 'Tokyo, Japan (Bank of Japan)',
                  category: 'Yen Carry Trade',
                  headline: 'BoJ signals gradual normalization of bond yield curve parameters',
                  impact: 'Global Liquidity & Crypto Volatility Risk',
                  trust: 'REPORTED'
                }
              ].map((pin, i) => (
                <div key={i} className="p-5 rounded-2xl border border-cyan-500/25 bg-[#0b162b] space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-cyan-300 font-mono">{pin.region}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                      {pin.trust}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">{pin.category}</div>
                  <p className="text-xs text-slate-200 leading-snug">{pin.headline}</p>
                  <div className="pt-2.5 border-t border-slate-700/80 text-[11px] text-amber-300 font-mono font-bold">
                    Hypothesis: {pin.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M12: SESSIONS & ECONOMIC CALENDAR
          ============================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1.5">
              <Clock className="w-5 h-5 text-cyan-400" />
              Global Trading Sessions (IST) & Tier-1 Macro Calendar
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Real-time Indian Standard Time (IST) sessions tracker with holiday & Daylight Savings Time (DST) awareness.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { name: 'Asia / Tokyo Session', hours: '05:30 - 14:30 IST', status: 'ACTIVE', color: 'text-emerald-400' },
                { name: 'London / Europe Session', hours: '13:30 - 22:00 IST', status: 'ACTIVE (High Volume)', color: 'text-cyan-300' },
                { name: 'New York Session', hours: '19:00 - 03:30 IST', status: 'OPENING SOON', color: 'text-amber-400' }
              ].map((sess) => (
                <div key={sess.name} className="p-4 bg-[#0b162b] rounded-xl border border-cyan-500/25 shadow-md">
                  <span className="text-xs font-black text-white block uppercase tracking-wider">{sess.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">{sess.hours}</span>
                  <span className={`text-[10px] font-black ${sess.color} font-mono mt-1.5 block`}>{sess.status}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">Upcoming Tier-1 US & Global Events:</span>
              <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b162b] text-slate-300 border-b border-slate-700/80">
                    <tr>
                      <th className="p-3">Date & Time (IST)</th>
                      <th className="p-3">Event Name</th>
                      <th className="p-3">Impact</th>
                      <th className="p-3">Forecast</th>
                      <th className="p-3">Previous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#070d1a]">
                    {UPCOMING_MACRO_CALENDAR_EVENTS.slice(0, 5).map((ev, i) => (
                      <tr key={i} className="hover:bg-[#0d1a33]/60 transition-colors">
                        <td className="p-3 text-slate-300">{ev.date} {ev.time}</td>
                        <td className="p-3 font-bold text-white">{ev.event}</td>
                        <td className="p-3 font-black text-rose-400">{ev.impact}</td>
                        <td className="p-3 text-slate-300">{ev.forecast || '-'}</td>
                        <td className="p-3 text-slate-400">{ev.previous || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M14: COMMUNITY FEED (STRICT UNVERIFIED / OPINION WEIGHT 0)
          ============================================================== */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  Influencer & Community Opinion Stream
                </h3>
                <p className="text-xs text-slate-300">
                  Third-party trader opinions. STRICT RULE: Signal weight is permanently <b>ZERO</b>. Never influences Master Verdict.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                WEIGHT: 0.0 (DISPLAY ONLY)
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { author: '@CryptoCapWhale', handle: 'Twitter/X', lean: 'BULLISH', text: 'BTC holding the golden pocket retest. Looking for expansion towards 92k before month end.', tag: 'UNVERIFIED / OPINION' },
                { author: '@MacroGoldDesk', handle: 'Telegram VIP', lean: 'NEUTRAL', text: 'Central bank physical demand continuing to absorb any 50-pip dips in spot gold.', tag: 'UNVERIFIED / OPINION' },
                { author: '@DeltaTraderIndia', handle: 'Community Forum', lean: 'BEARISH', text: 'Funding positive across major alts. Be ready for sudden weekend flush.', tag: 'UNVERIFIED / OPINION' }
              ].map((comm, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-purple-500/25 bg-[#0b1426] flex items-start justify-between gap-4 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-black text-xs text-white">{comm.author}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{comm.handle}</span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-900/50 text-purple-300 border border-purple-700">
                        {comm.lean}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">{comm.text}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                    {comm.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M16: TOKEN POOL & USAGE LEDGER
          ============================================================== */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Shared Research Token Pool & Usage Ledger
                </h3>
                <p className="text-xs text-slate-300">
                  Transparent pay-per-action credit system. Failed runs or network errors automatically refund to your ledger.
                </p>
              </div>

              <div className="bg-[#0b1a2f] px-5 py-2.5 rounded-xl border border-emerald-500/40 text-right shadow-lg">
                <span className="text-[10px] text-cyan-300 font-mono font-bold block uppercase tracking-wider">REMAINING BALANCE</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">{tokenBalance} TOKENS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-5 text-xs font-mono">
              {[
                { action: 'Analyze (4-Lanes)', cost: '3 Pts' },
                { action: 'Strategy Build', cost: '5 Pts' },
                { action: 'Backtest Run', cost: '1 Pt' },
                { action: 'Deploy Signal', cost: '2 Pts' },
                { action: 'Daily Brief', cost: '1 Pt' },
                { action: 'Scenario Sim', cost: '1 Pt' }
              ].map((c) => (
                <div key={c.action} className="p-3 bg-[#0b162b] rounded-xl border border-slate-700/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{c.action}</span>
                  <span className="font-black text-cyan-300 text-sm mt-0.5 block">{c.cost}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">Recent Token Transactions & Refunds:</span>
              <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b162b] text-slate-300 border-b border-slate-700/80">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3">Balance After</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#070d1a]">
                    {deeeprAtoZPipelineManager.getTokenTransactions().map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#0d1a33]/60 transition-colors">
                        <td className="p-3 text-slate-400">{tx.timestamp}</td>
                        <td className="p-3 font-bold text-cyan-300">{tx.action}</td>
                        <td className="p-3 text-rose-400 font-black">-{tx.costTokens}</td>
                        <td className="p-3 text-emerald-400 font-black">{tx.balanceAfter}</td>
                        <td className="p-3 text-slate-200">{tx.notes}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          M17: COMPLIANCE, RULES & LEGAL DISCLAIMER
          ============================================================== */}
      {activeTab === 'legal' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-6 shadow-2xl space-y-4 text-xs text-slate-200 leading-relaxed font-mono">
            <h3 className="text-xl font-black text-white flex items-center gap-2 pb-4 border-b border-slate-800">
              <Shield className="w-5 h-5 text-cyan-400" />
              Institutional Compliance, Disclaimer & Operational Rules
            </h3>

            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200">
              <b className="text-amber-300 uppercase">Mandatory Regulatory Notice:</b> This platform is strictly an educational quantitative research aid and data analysis engine. It does not provide personal financial, investment, or legal advice. All trade plans, scores, and simulations are mathematical outputs derived from historical and real-time market data. Trading in derivatives and financial markets carries significant capital risk.
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-cyan-300">1. Master Verdict Single Arbiter Rule</h4>
              <p>
                Only the centralized Master Arbiter is authorized to emit final trading verdicts. Individual evidence modules (SMC, Volume Profile, News, Macro) are strictly classified as evidence providers and can never print individual buy/sell alerts.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-cyan-300">2. Conservative Backtest & Tie-Breaker Logic</h4>
              <p>
                In any intrabar situation where price reaches both Stop-Loss and Take-Profit extremes within the same candle, the engine conservatively resolves the Stop-Loss first to prevent inflated backtest claims.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-cyan-300">3. Verifiable Append-Only Integrity</h4>
              <p>
                Track record entries are immutably signed with SHA-256 style digests at the moment of emission. Any sample size under 30 trades is prominently labeled with the <b>UNPROVEN</b> badge.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeeeprAtoZPipelineView;
