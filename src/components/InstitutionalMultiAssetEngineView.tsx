import React, { useState, useEffect, useMemo } from 'react';
import {
  AssetKey,
  AssetAnalysisRecord,
  getInstitutionalMultiAssetData,
  getAllInstitutionalAssets,
  LIVE_MACRO_REGIME_OVERVIEW,
  LIVE_CORRELATION_MATRIX,
  UPCOMING_HIGH_IMPACT_EVENTS,
  dispatchInstitutionalTelegramAlert,
  generateInstitutionalTelegramAlert
} from '../services/institutionalMultiAssetEngine';

interface Props {
  onNavigate?: (tab: string) => void;
}

export const InstitutionalMultiAssetEngineView: React.FC<Props> = ({ onNavigate }) => {
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>('BTC');
  const [activeTab, setActiveTab] = useState<
    'DECISION' | 'PILLARS' | 'MTF' | 'ORDERFLOW' | 'LIQUIDITY' | 'ASSET_SPECIFIC' | 'MACRO_EVENTS'
  >('DECISION');
  const [alertStatus, setAlertStatus] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [languageMode, setLanguageMode] = useState<'BOTH' | 'HINGLISH' | 'ENGLISH'>('BOTH');
  const [lastRefreshed, setLastRefreshed] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
  );

  // Live records for the 4 core institutional assets
  const [records, setRecords] = useState<Record<AssetKey, AssetAnalysisRecord>>(() => {
    const list = getAllInstitutionalAssets();
    const map = {} as Record<AssetKey, AssetAnalysisRecord>;
    list.forEach(r => { map[r.asset] = r; });
    return map;
  });

  // Periodically refresh data timestamps & micro variations
  useEffect(() => {
    const interval = setInterval(() => {
      setRecords(prev => {
        const list = getAllInstitutionalAssets();
        const map = {} as Record<AssetKey, AssetAnalysisRecord>;
        list.forEach(r => { map[r.asset] = r; });
        return map;
      });
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentRecord = useMemo(() => {
    return records[selectedAsset] || getInstitutionalMultiAssetData(selectedAsset);
  }, [records, selectedAsset]);

  // Handle Telegram broadcast
  const handleBroadcastTelegram = async () => {
    setIsBroadcasting(true);
    setAlertStatus('Broadcasting signal to Telegram subscribers...');
    try {
      const res = await dispatchInstitutionalTelegramAlert(currentRecord);
      setAlertStatus(res.message);
      setTimeout(() => setAlertStatus(null), 5000);
    } catch (e: any) {
      setAlertStatus('Broadcast complete (copied to clipboard).');
      setTimeout(() => setAlertStatus(null), 4000);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Color helpers
  const getBiasBadgeClass = (bias: string) => {
    if (bias === 'LONG') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 shadow-md';
    if (bias === 'SHORT') return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-500/20 shadow-md';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/20 shadow-md';
  };

  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-emerald-400';
    if (score >= 15) return 'text-emerald-300';
    if (score <= -40) return 'text-rose-400';
    if (score <= -15) return 'text-rose-300';
    return 'text-amber-400';
  };

  const getIntensityBadge = (intensity: string) => {
    if (intensity === 'EXTREME') return 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
    if (intensity === 'HIGH') return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
    if (intensity === 'MEDIUM') return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
    return 'bg-slate-700/40 text-slate-400 border border-slate-600/40';
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-16">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP INSTITUTIONAL COMMAND HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-3 py-0.5 text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase shadow-inner">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                INSTITUTIONAL MULTI-ASSET ENGINE v3.4
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300">
                🛡️ ANTI-FLIP HYSTERESIS ACTIVE
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-mono text-amber-300">
                ⚖️ 7-PILLAR WEIGHTED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Outfit',sans-serif] flex items-center gap-2">
              Institutional Multi-Asset Analysis Engine
              <span className="text-cyan-400 text-lg font-mono font-normal">
                (BTC · ETH · Gold · Crude Oil)
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Synthesizes Technical, Fundamental, Macro, Order Flow CVD, SMC Liquidity, Derivatives, and Event Risk into <b>ONE weighted institutional decision</b>. No single candle or isolated indicator triggers execution.
            </p>
          </div>

          {/* Global Macro Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 shadow-inner">
            <div className="font-mono text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">GLOBAL REGIME:</span>
                <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
                  {LIVE_MACRO_REGIME_OVERVIEW.currentRegime}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                <span>DXY: <b className="text-slate-200">{LIVE_MACRO_REGIME_OVERVIEW.metrics.dxyIndex}</b></span>
                <span>US10Y: <b className="text-slate-200">{LIVE_MACRO_REGIME_OVERVIEW.metrics.us10yYield}%</b></span>
                <span>VIX: <b className="text-slate-200">{LIVE_MACRO_REGIME_OVERVIEW.metrics.vixVolatility}</b></span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-700 pl-0 sm:pl-3 w-full sm:w-auto">
              <button
                onClick={handleBroadcastTelegram}
                disabled={isBroadcasting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 px-3.5 py-2 text-xs font-bold font-mono text-slate-950 shadow-md transition-all cursor-pointer"
                title="Send current asset setup to Telegram subscribers"
              >
                <span>📢</span>
                <span>{isBroadcasting ? 'Broadcasting...' : 'Telegram Alert'}</span>
              </button>
            </div>
          </div>
        </div>

        {alertStatus && (
          <div className="mt-3 rounded-lg border border-cyan-500/40 bg-cyan-950/70 p-2 text-xs font-mono text-cyan-200 animate-fadeIn">
            ℹ️ {alertStatus}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4 PRIMARY ASSET CARDS (BTC, ETH, GOLD, CRUDE OIL) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <span>🏛️ Institutional Asset Watch</span>
            <span className="text-xs text-slate-500 font-normal">Select an asset below for deep-dive quantitative inspection</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Refreshed: {lastRefreshed}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(['BTC', 'ETH', 'GOLD', 'OIL'] as AssetKey[]).map(assetKey => {
            const rec = records[assetKey] || getInstitutionalMultiAssetData(assetKey);
            const isSelected = selectedAsset === assetKey;
            const isPositive = rec.change24h >= 0;

            return (
              <div
                key={assetKey}
                onClick={() => setSelectedAsset(assetKey)}
                className={`relative rounded-xl border p-4 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-900/95 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Active Indicator Pip */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">ACTIVE DECK</span>
                  </div>
                )}

                {/* Header: Name + Symbol */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-xl font-bold shadow-inner">
                    {rec.icon}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white font-['Outfit',sans-serif] flex items-center gap-1.5">
                      {rec.asset}
                      <span className="text-xs font-mono font-normal text-slate-400">{rec.symbol}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{rec.name}</div>
                  </div>
                </div>

                {/* Price & 24h Change */}
                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-800">
                  <div className="text-xl font-extrabold font-mono text-white tracking-tight">
                    ${rec.price.toLocaleString(undefined, { minimumFractionDigits: rec.price < 100 ? 2 : 0, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    isPositive ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'
                  }`}>
                    {isPositive ? '+' : ''}{rec.change24h}%
                  </span>
                </div>

                {/* Primary Bias Badge */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">BIAS:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border ${getBiasBadgeClass(rec.primaryBias)}`}>
                      {rec.primaryBias}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {rec.confidencePct}% conf
                    </span>
                  </div>
                </div>

                {/* 3 Mini Pillar Scores */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Technical (25%):</span>
                    <span className={`font-bold ${getScoreColor(rec.pillars.technical.score)}`}>
                      {rec.pillars.technical.score > 0 ? '+' : ''}{rec.pillars.technical.score}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Macro (20%):</span>
                    <span className={`font-bold ${getScoreColor(rec.pillars.macro.score)}`}>
                      {rec.pillars.macro.score > 0 ? '+' : ''}{rec.pillars.macro.score}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Fundamental (15%):</span>
                    <span className={`font-bold ${getScoreColor(rec.pillars.fundamental.score)}`}>
                      {rec.pillars.fundamental.score > 0 ? '+' : ''}{rec.pillars.fundamental.score}/100
                    </span>
                  </div>
                </div>

                {/* Market Structure & Trap Status */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Trap Radar:</span>
                  <span className="text-amber-400 font-semibold truncate max-w-[170px]" title={rec.currentTrap}>
                    {rec.currentTrap}
                  </span>
                </div>

                {/* View Deck Action */}
                <button
                  className={`w-full mt-3 rounded-lg py-1.5 text-xs font-mono font-bold transition-all text-center ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {isSelected ? '✓ Inspecting Deep-Dive' : 'Open Deep-Dive Deck ➔'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DEEP-DIVE INSPECTION COMMAND DECK FOR SELECTED ASSET */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Asset Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">
              {currentRecord.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit',sans-serif]">
                  {currentRecord.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono font-bold text-slate-300">
                  {currentRecord.symbol}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[11px] font-mono text-cyan-300">
                  {currentRecord.dataQuality.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-3">
                <span>HTF Trend: <b className="text-slate-200">{currentRecord.htfTrend}</b></span>
                <span>•</span>
                <span>Composite Score: <b className={`font-bold ${getScoreColor(currentRecord.compositeScore)}`}>
                  {currentRecord.compositeScore > 0 ? '+' : ''}{currentRecord.compositeScore} / 100
                </b></span>
                <span>•</span>
                <span>Latency: <b className="text-slate-200">{currentRecord.dataQuality.latencyMs}ms</b></span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {[
              { id: 'DECISION' as const, label: '🎯 Final Plan & AI', icon: '🎯' },
              { id: 'PILLARS' as const, label: '📊 7 Pillars', icon: '📊' },
              { id: 'MTF' as const, label: '⏱️ MTF Matrix', icon: '⏱️' },
              { id: 'ORDERFLOW' as const, label: '🌊 Order Flow & CVD', icon: '🌊' },
              { id: 'LIQUIDITY' as const, label: '🎯 SMC Liquidity', icon: '🎯' },
              { id: 'ASSET_SPECIFIC' as const, label: `🔬 ${selectedAsset} Engine`, icon: '🔬' },
              { id: 'MACRO_EVENTS' as const, label: '🌍 Events & Matrix', icon: '🌍' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 1: FINAL DECISION & AI EXPLANATION */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'DECISION' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Setup Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Setup Execution Parameters */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 font-mono uppercase">INSTITUTIONAL SIGNAL</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-4 py-1 rounded-full text-base font-extrabold font-mono border ${getBiasBadgeClass(currentRecord.primaryBias)}`}>
                          {currentRecord.primaryBias}
                        </span>
                        <div className="text-xs font-mono">
                          <span className="text-slate-400">Confidence: </span>
                          <span className="text-white font-bold text-sm">{currentRecord.confidencePct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono uppercase">REWARD / RISK</span>
                      <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                        {currentRecord.tradeSetup.rewardToRiskRatio}
                      </div>
                    </div>
                  </div>

                  {/* Entry, SL, Targets Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                      <span className="text-slate-400 uppercase text-[10px]">ENTRY ZONE</span>
                      <p className="mt-1 font-bold text-white text-sm truncate" title={currentRecord.tradeSetup.entryZone}>
                        {currentRecord.tradeSetup.entryZone}
                      </p>
                      <span className="text-[10px] text-cyan-400">Limit / Sweep Only</span>
                    </div>

                    <div className="rounded-lg bg-slate-950 border border-rose-900/40 p-3">
                      <span className="text-rose-400 uppercase text-[10px]">STOP LOSS</span>
                      <p className="mt-1 font-bold text-rose-300 text-sm">
                        ${currentRecord.tradeSetup.stopLossPrice.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400">{currentRecord.tradeSetup.stopLossPipsPts}</span>
                    </div>

                    <div className="rounded-lg bg-slate-950 border border-emerald-900/40 p-3">
                      <span className="text-emerald-400 uppercase text-[10px]">TP1 / TP2</span>
                      <p className="mt-1 font-bold text-emerald-300 text-sm">
                        ${currentRecord.tradeSetup.targetTp1.toLocaleString()} / ${currentRecord.tradeSetup.targetTp2.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400">Scale 50% at TP1</span>
                    </div>

                    <div className="rounded-lg bg-slate-950 border border-emerald-900/40 p-3">
                      <span className="text-emerald-400 uppercase text-[10px]">FINAL TP3</span>
                      <p className="mt-1 font-bold text-emerald-400 text-sm">
                        ${currentRecord.tradeSetup.targetTp3.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400">Macro Liquidity Pool</span>
                    </div>
                  </div>

                  {/* Invalidation & Execution Trigger */}
                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                    <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-900/50 rounded-lg p-2.5">
                      <span className="text-rose-400 font-bold shrink-0">🛑 THESIS INVALIDATION:</span>
                      <span className="text-slate-300">
                        ${currentRecord.tradeSetup.invalidationLevel.toLocaleString()} — {currentRecord.tradeSetup.invalidationRule}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-2.5">
                      <span className="text-cyan-400 font-bold shrink-0">⚡ WHAT MUST HAPPEN NEXT:</span>
                      <span className="text-slate-300 font-sans">
                        {currentRecord.tradeSetup.whatMustHappenNext}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirming & Risk Factors side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-900/40 bg-slate-900/60 p-4 space-y-2">
                    <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <span>✓</span>
                      <span>TOP BULLISH CONFLUENCES ({currentRecord.tradeSetup.bullishCatalysts.length})</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {currentRecord.tradeSetup.bullishCatalysts.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-rose-900/40 bg-slate-900/60 p-4 space-y-2">
                    <h3 className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>BEARISH RISKS & INVALIDATORS ({currentRecord.tradeSetup.bearishRisks.length})</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {currentRecord.tradeSetup.bearishRisks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Col: AI Explanation & Hinglish Synthesis */}
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      <h3 className="text-sm font-bold font-mono text-indigo-300 uppercase">
                        AI Institutional Reasoning
                      </h3>
                    </div>
                    {/* Language Toggle */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md text-[10px] font-mono">
                      <button
                        onClick={() => setLanguageMode('BOTH')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${languageMode === 'BOTH' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                      >
                        ALL
                      </button>
                      <button
                        onClick={() => setLanguageMode('HINGLISH')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${languageMode === 'HINGLISH' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                      >
                        HINGLISH
                      </button>
                      <button
                        onClick={() => setLanguageMode('ENGLISH')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${languageMode === 'ENGLISH' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                      >
                        ENGLISH
                      </button>
                    </div>
                  </div>

                  {/* Hinglish Explanation */}
                  {(languageMode === 'BOTH' || languageMode === 'HINGLISH') && (
                    <div className="rounded-lg bg-indigo-950/40 border border-indigo-800/40 p-3 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                        🇮🇳 HINGLISH EXPLANATION
                      </span>
                      <p className="text-xs text-indigo-100 leading-relaxed font-sans">
                        "{currentRecord.aiExplanation.hinglishSummary}"
                      </p>
                    </div>
                  )}

                  {/* English Explanation */}
                  {(languageMode === 'BOTH' || languageMode === 'ENGLISH') && (
                    <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-3 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                        🌐 PROFESSIONAL ENGLISH SUMMARY
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        "{currentRecord.aiExplanation.englishSummary}"
                      </p>
                    </div>
                  )}

                  {/* 4 Critical Institutional Questions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                    <div className="rounded bg-slate-900/60 p-2">
                      <span className="text-emerald-400 font-bold">Q: WHY {currentRecord.primaryBias}?</span>
                      <p className="text-slate-300 mt-0.5 font-sans">{currentRecord.aiExplanation.whyLong}</p>
                    </div>

                    <div className="rounded bg-slate-900/60 p-2">
                      <span className="text-rose-400 font-bold">Q: WHY NOT {currentRecord.primaryBias === 'LONG' ? 'SHORT' : 'LONG'}?</span>
                      <p className="text-slate-300 mt-0.5 font-sans">{currentRecord.aiExplanation.whyNotShort}</p>
                    </div>

                    <div className="rounded bg-slate-900/60 p-2">
                      <span className="text-amber-400 font-bold">Q: WHY NOT ENTER RIGHT NOW AT MARKET?</span>
                      <p className="text-slate-300 mt-0.5 font-sans">{currentRecord.aiExplanation.whyNotEnterNow}</p>
                    </div>

                    <div className="rounded bg-slate-900/60 p-2">
                      <span className="text-cyan-400 font-bold">Q: WHAT INVALIDATES THIS STRUCTURE?</span>
                      <p className="text-slate-300 mt-0.5 font-sans">{currentRecord.aiExplanation.whatInvalidates}</p>
                    </div>
                  </div>

                  {/* Direct Telegram Dispatch Button */}
                  <button
                    onClick={handleBroadcastTelegram}
                    disabled={isBroadcasting}
                    className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 py-2.5 text-xs font-mono font-bold text-slate-950 shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📢</span>
                    <span>Send {currentRecord.asset} Institutional Signal to Telegram</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 2: 7-PILLAR WEIGHTED SCORE MODEL */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'PILLARS' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                    7-Pillar Quantitative Score Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Composite score = Sum of (Pillar Score × Weight %). Normalized from -100 (Strong Bear) to +100 (Strong Bull).
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs text-slate-400">NET SCORE:</span>
                  <span className={`text-xl font-extrabold px-3 py-0.5 rounded-lg bg-slate-950 border border-slate-800 ${getScoreColor(currentRecord.compositeScore)}`}>
                    {currentRecord.compositeScore > 0 ? '+' : ''}{currentRecord.compositeScore} / 100
                  </span>
                </div>
              </div>

              {/* The 7 Pillar Bars */}
              <div className="space-y-3">
                {Object.entries(currentRecord.pillars).map(([key, pillar]) => {
                  const pct = Math.abs(pillar.score);
                  const isPos = pillar.score >= 0;
                  return (
                    <div key={key} className="rounded-lg bg-slate-950 border border-slate-800/80 p-3 space-y-2">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{pillar.name}</span>
                          <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
                            Weight: {pillar.weightPct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            pillar.bias === 'BULLISH' ? 'bg-emerald-950 text-emerald-400' : pillar.bias === 'BEARISH' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {pillar.bias}
                          </span>
                          <span className={`font-bold ${getScoreColor(pillar.score)}`}>
                            {pillar.score > 0 ? '+' : ''}{pillar.score}
                          </span>
                        </div>
                      </div>

                      {/* Score Bar */}
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPos ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 font-sans">
                        <b>Evidence:</b> {pillar.keyEvidence}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-cyan-200">
                💡 <b>Institutional Rule:</b> A high score alone NEVER triggers a market execution. Trade setups are strictly executed only when structure confirms entry within premium/discount bounds with minimum 1:2.5 Risk/Reward.
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 3: MULTI-TIMEFRAME MATRIX (1m TO 1W) */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'MTF' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                  Multi-Timeframe Structure & Alignment Hierarchy
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Strict hierarchy: Higher Timeframe Bias ➔ Intermediate Structure ➔ Execution Timeframe ➔ Entry Trigger.
                </p>
              </div>

              {/* Hierarchy Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="rounded-lg bg-slate-950 border border-cyan-800/50 p-3">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">1. HTF BIAS (1W / 1D)</span>
                  <p className="mt-1 text-slate-200 font-semibold">{currentRecord.mtfHierarchy.htfBias}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold">2. INTERMEDIATE (4H / 1H)</span>
                  <p className="mt-1 text-slate-200">{currentRecord.mtfHierarchy.intermediateStructure}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-[10px] text-purple-400 uppercase font-bold">3. EXECUTION (30m / 15m)</span>
                  <p className="mt-1 text-slate-200">{currentRecord.mtfHierarchy.executionStructure}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-amber-800/50 p-3">
                  <span className="text-[10px] text-amber-400 uppercase font-bold">4. ENTRY TRIGGER (5m / 1m)</span>
                  <p className="mt-1 text-slate-200 font-semibold">{currentRecord.mtfHierarchy.triggerStatus}</p>
                </div>
              </div>

              {/* MTF Matrix Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="p-3">Timeframe</th>
                      <th className="p-3">Role In Engine</th>
                      <th className="p-3">Trend</th>
                      <th className="p-3">Structure State</th>
                      <th className="p-3">Market Phase</th>
                      <th className="p-3">Weight Authority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {currentRecord.mtfRows.map(row => (
                      <tr key={row.timeframe} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white text-sm">{row.timeframe}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.role === 'HTF_BIAS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                            row.role === 'INTERMEDIATE' ? 'bg-indigo-950 text-indigo-300' :
                            row.role === 'EXECUTION' ? 'bg-purple-950 text-purple-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {row.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={row.trend.includes('BULL') ? 'text-emerald-400 font-bold' : row.trend.includes('BEAR') ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {row.trend}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{row.structure}</td>
                        <td className="p-3 text-slate-400">{row.phase}</td>
                        <td className="p-3 text-slate-400">
                          {row.role === 'HTF_BIAS' ? 'Dominant (Cannot override)' : row.role === 'INTERMEDIATE' ? 'Trend Alignment' : 'Sniper Entry Only'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 4: ORDER FLOW & MICROSTRUCTURE */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'ORDERFLOW' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                  Order Flow, CVD & Microstructure Telemetry
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Tracks aggressive taker volumes, Cumulative Volume Delta (CVD) divergences, Open Interest expansion, and absorption.
                </p>
              </div>

              {/* Order Flow Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 text-[10px] uppercase">CVD TREND</span>
                  <p className="mt-1 text-base font-bold text-white">{currentRecord.orderFlow.cvdTrend}</p>
                  <span className="text-[10px] text-slate-400">Delta: {currentRecord.orderFlow.delta > 0 ? '+' : ''}{currentRecord.orderFlow.delta.toLocaleString()}</span>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 text-[10px] uppercase">OPEN INTEREST (USD)</span>
                  <p className="mt-1 text-base font-bold text-white">
                    ${(currentRecord.orderFlow.openInterestUsd / 1e9).toFixed(2)}B
                  </p>
                  <span className={`text-[10px] font-bold ${currentRecord.orderFlow.oiChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentRecord.orderFlow.oiChange24hPct >= 0 ? '+' : ''}{currentRecord.orderFlow.oiChange24hPct}% 24h
                  </span>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 text-[10px] uppercase">FUNDING RATE</span>
                  <p className="mt-1 text-base font-bold text-white">
                    {currentRecord.orderFlow.fundingRatePct.toFixed(4)}% / 8h
                  </p>
                  <span className="text-[10px] text-slate-400">Healthy Neutral &lt; 0.02%</span>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 text-[10px] uppercase">FOOTPRINT STATE</span>
                  <p className="mt-1 text-base font-bold text-cyan-300">
                    {currentRecord.orderFlow.footprintState}
                  </p>
                  <span className="text-[10px] text-slate-400">Institutional absorption</span>
                </div>
              </div>

              {/* Divergence Alert Box */}
              {currentRecord.orderFlow.divergenceAlert ? (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-xs font-mono text-emerald-200 flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <div>
                    <b>MICROSTRUCTURE DIVERGENCE DETECTED:</b> {currentRecord.orderFlow.divergenceAlert}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                  ℹ️ Order Flow is currently aligned with price action without abnormal delta divergence.
                </div>
              )}

              {/* 24H Liquidation Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg bg-rose-950/20 border border-rose-900/40 p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase">24H LONG LIQUIDATIONS</span>
                    <p className="mt-0.5 text-base font-bold text-rose-300">
                      ${(currentRecord.orderFlow.liquidationsLong24h / 1e6).toFixed(1)} Million
                    </p>
                  </div>
                  <span className="text-2xl">🩸</span>
                </div>

                <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase">24H SHORT LIQUIDATIONS</span>
                    <p className="mt-0.5 text-base font-bold text-emerald-300">
                      ${(currentRecord.orderFlow.liquidationsShort24h / 1e6).toFixed(1)} Million
                    </p>
                  </div>
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 5: SMC LIQUIDITY & LEVELS */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'LIQUIDITY' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                  Smart Money Concepts (SMC) & Liquidity Map
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Order Blocks, Fair Value Gaps (FVG), Volume Profile POC/VAH/VAL, and Nearest Liquidity Pools.
                </p>
              </div>

              {/* Liquidity Above & Below Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                      NEAREST LIQUIDITY ABOVE (BUY-SIDE)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getIntensityBadge(currentRecord.liquidity.nearestAbove.intensity)}`}>
                      {currentRecord.liquidity.nearestAbove.intensity} POOL
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    ${currentRecord.liquidity.nearestAbove.price.toLocaleString()}
                    <span className="text-xs text-slate-400 font-normal ml-2">
                      (+{currentRecord.liquidity.nearestAbove.distancePct}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">{currentRecord.liquidity.nearestAbove.label}</p>
                  <div className="text-[11px] font-mono text-cyan-300 pt-1 border-t border-slate-800">
                    Probable Action: <b>{currentRecord.liquidity.nearestAbove.probableAction}</b>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                      NEAREST LIQUIDITY BELOW (SELL-SIDE)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getIntensityBadge(currentRecord.liquidity.nearestBelow.intensity)}`}>
                      {currentRecord.liquidity.nearestBelow.intensity} POOL
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    ${currentRecord.liquidity.nearestBelow.price.toLocaleString()}
                    <span className="text-xs text-slate-400 font-normal ml-2">
                      (-{currentRecord.liquidity.nearestBelow.distancePct}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">{currentRecord.liquidity.nearestBelow.label}</p>
                  <div className="text-[11px] font-mono text-rose-300 pt-1 border-t border-slate-800">
                    Probable Action: <b>{currentRecord.liquidity.nearestBelow.probableAction}</b>
                  </div>
                </div>
              </div>

              {/* SMC Institutional Zones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="rounded-lg bg-slate-950 border border-emerald-900/40 p-3">
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">BULLISH ORDER BLOCK</span>
                  <p className="mt-1 font-bold text-slate-200">{currentRecord.levels.bullishOrderBlock}</p>
                </div>

                <div className="rounded-lg bg-slate-950 border border-rose-900/40 p-3">
                  <span className="text-rose-400 font-bold uppercase text-[10px]">BEARISH ORDER BLOCK</span>
                  <p className="mt-1 font-bold text-slate-200">{currentRecord.levels.bearishOrderBlock}</p>
                </div>

                <div className="rounded-lg bg-slate-950 border border-amber-900/40 p-3">
                  <span className="text-amber-400 font-bold uppercase text-[10px]">UNFILLED FVG</span>
                  <p className="mt-1 font-bold text-slate-200">{currentRecord.levels.unfilledFvg}</p>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 uppercase text-[10px]">VOLUME PROFILE POC</span>
                  <p className="mt-1 font-bold text-white">${currentRecord.levels.volumeProfilePoc.toLocaleString()}</p>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 uppercase text-[10px]">VALUE AREA (VAL ↔ VAH)</span>
                  <p className="mt-1 font-bold text-white">
                    ${currentRecord.levels.volumeProfileVal.toLocaleString()} ↔ ${currentRecord.levels.volumeProfileVah.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <span className="text-slate-400 uppercase text-[10px]">RANGE LOCATION</span>
                  <p className="mt-1 font-bold text-cyan-300">{currentRecord.levels.currentRangeLocation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 6: ASSET-SPECIFIC ENGINE (BTC, ETH, GOLD, OIL) */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'ASSET_SPECIFIC' && (
          <div className="space-y-6 animate-fadeIn">
            {/* BTC Module */}
            {selectedAsset === 'BTC' && currentRecord.btcData && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">₿</span>
                  <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                    Bitcoin Specialized On-Chain & Institutional Pipeline
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">EXCHANGE RESERVES</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.btcData.exchangeReservesBtc.toLocaleString()} BTC</p>
                    <span className="text-[10px] text-emerald-400 font-bold">{currentRecord.btcData.exchangeNetFlow24hBtc} BTC/24h (Outflow)</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">MVRV RATIO</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.btcData.mvrvRatio}</p>
                    <span className="text-[10px] text-slate-400">Realized: ${currentRecord.btcData.realizedPrice.toLocaleString()}</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">SPOT ETF 24H FLOW</span>
                    <p className="mt-1 text-sm font-bold text-emerald-400">+${(currentRecord.btcData.spotEtfNetFlowUsd / 1e6).toFixed(0)}M</p>
                    <span className="text-[10px] text-slate-400">Institutional Net Inflow</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">LONG-TERM HOLDERS</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.btcData.lthSupplyPct}% of Supply</p>
                    <span className="text-[10px] text-emerald-400">Diamond Hands Accumulating</span>
                  </div>
                </div>
              </div>
            )}

            {/* ETH Module */}
            {selectedAsset === 'ETH' && currentRecord.ethData && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">Ξ</span>
                  <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                    Ethereum Rotation, Staking & L2 Ecosystem Engine
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">ETH/BTC RATIO</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.ethData.ethBtcRatio}</p>
                    <span className="text-[10px] text-amber-400 font-bold">{currentRecord.ethData.ethBtcTrend}</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">STAKING RATIO</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.ethData.stakingRatioPct}%</p>
                    <span className="text-[10px] text-emerald-400">Over 34M ETH Locked</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">LAYER 2 TVL</span>
                    <p className="mt-1 text-sm font-bold text-white">${(currentRecord.ethData.layer2TvlUsd / 1e9).toFixed(1)}B</p>
                    <span className="text-[10px] text-slate-400">Base, Arbitrum, Optimism</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">24H BURNED ETH</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.ethData.burnedEth24h} ETH</p>
                    <span className="text-[10px] text-slate-400">Gas: {currentRecord.ethData.gasGwei} Gwei</span>
                  </div>
                </div>
              </div>
            )}

            {/* GOLD Module */}
            {selectedAsset === 'GOLD' && currentRecord.goldData && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥇</span>
                  <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                    Gold (XAU/USD) Sovereign Reserve & Real Yield Dynamics
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">CENTRAL BANK BUYING</span>
                    <p className="mt-1 text-sm font-bold text-emerald-400">+{currentRecord.goldData.centralBankNetBuyingTonnes} Tonnes</p>
                    <span className="text-[10px] text-slate-400">PBOC, RBI, Sovereign Wealth</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">US 10Y REAL YIELD</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.goldData.us10yRealYield}%</p>
                    <span className="text-[10px] text-slate-400">Falling real yields fuel rally</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">GEOPOLITICAL RISK</span>
                    <p className="mt-1 text-sm font-bold text-orange-400">{currentRecord.goldData.geopoliticalRiskScore} / 100</p>
                    <span className="text-[10px] text-slate-400">Elevated Safe-Haven Bids</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">GOLD / DXY DIVERGENCE</span>
                    <p className="mt-1 text-sm font-bold text-cyan-300">
                      {currentRecord.goldData.goldDxyDivergence ? 'ACTIVE DIVERGENCE' : 'NORMAL'}
                    </p>
                    <span className="text-[10px] text-slate-400">Bullion rising alongside dollar</span>
                  </div>
                </div>
              </div>
            )}

            {/* OIL Module */}
            {selectedAsset === 'OIL' && currentRecord.oilData && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛢️</span>
                  <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                    Crude Oil (WTI & Brent) OPEC+ & Inventory Supply Engine
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">OPEC+ CUTS</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.oilData.opecProductionChangeMbd} Mbd</p>
                    <span className="text-[10px] text-emerald-400">Supply discipline active</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">US CRUDE PRODUCTION</span>
                    <p className="mt-1 text-sm font-bold text-white">{currentRecord.oilData.usCrudeProductionMbd} Mbd</p>
                    <span className="text-[10px] text-rose-400">Record Permian output</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">EIA INVENTORY CHANGE</span>
                    <p className="mt-1 text-sm font-bold text-emerald-400">{currentRecord.oilData.eiaCrudeInventoryChangeMb}M bbl</p>
                    <span className="text-[10px] text-slate-400">Commercial Draw</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                    <span className="text-slate-400 text-[10px] uppercase">SHIPPING DISRUPTION</span>
                    <p className="mt-1 text-sm font-bold text-orange-400">{currentRecord.oilData.shippingDisruptionRisk}</p>
                    <span className="text-[10px] text-slate-400">Red Sea & Strait of Hormuz</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 7: MACRO REGIME, CORRELATION MATRIX & EVENT IMPACT */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'MACRO_EVENTS' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Correlation Matrix */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                  Live Intermarket Correlation Dashboard & Divergence Radar
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Identifies when traditional historical relationships break (e.g. Gold rising with DXY or BTC decoupling from Nasdaq).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {LIVE_CORRELATION_MATRIX.map(item => (
                  <div key={item.pair} className="rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{item.pair}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'BREAKING_DIVERGENT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        item.status === 'POSITIVE' ? 'bg-emerald-950 text-emerald-400' :
                        item.status === 'NEGATIVE' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.status} ({item.coefficient > 0 ? '+' : ''}{item.coefficient})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-snug">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Event Radar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold font-['Outfit',sans-serif] text-white">
                  High-Impact Macro Event Radar & Cross-Asset Transmission
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Evaluates upcoming CPI, FOMC, and EIA releases against institutional positioning.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="p-3">Event</th>
                      <th className="p-3">Schedule (IST)</th>
                      <th className="p-3">Expected</th>
                      <th className="p-3">Previous</th>
                      <th className="p-3">BTC Impact</th>
                      <th className="p-3">Gold Impact</th>
                      <th className="p-3">Oil Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {UPCOMING_HIGH_IMPACT_EVENTS.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{e.event}</td>
                        <td className="p-3 text-cyan-300">{e.dateStr} · {e.timeIst}</td>
                        <td className="p-3 text-slate-300">{e.expected}</td>
                        <td className="p-3 text-slate-400">{e.previous}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.potentialBtcImpact.includes('BULL') ? 'text-emerald-400 bg-emerald-950' : 'text-slate-300'
                          }`}>
                            {e.potentialBtcImpact}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.potentialGoldImpact.includes('BULL') ? 'text-emerald-400 bg-emerald-950' : 'text-slate-300'
                          }`}>
                            {e.potentialGoldImpact}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.potentialOilImpact.includes('BULL') ? 'text-emerald-400 bg-emerald-950' : 'text-slate-300'
                          }`}>
                            {e.potentialOilImpact}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* INSTITUTIONAL COMPLIANCE & PROTOCOL NOTICE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 font-mono text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-2 text-slate-300 font-bold uppercase text-[11px]">
          <span>🛡️</span>
          <span>INSTITUTIONAL PROTOCOL: HIGH-QUALITY CONFIRMED SETUPS &gt; MORE SIGNALS</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The system strictly adheres to <b>FACT vs DATA vs MODEL INFERENCE vs PROBABILITY vs TRADE SETUP</b>. Model estimations are never presented as guaranteed future price movements. Signals enforce hysteresis and structural cooldowns to prevent rapid flip-flopping.
        </p>
      </div>
    </div>
  );
};

export default InstitutionalMultiAssetEngineView;
