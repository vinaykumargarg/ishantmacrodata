import React, { useState } from 'react';
import {
  ULTRA_INSTITUTIONAL_DATA,
  UltraInstitutionalTradeDecision
} from '../data/ultraInstitutionalEngineData';

interface UltraInstitutionalDecisionEngineProps {
  onNavigate?: (tab: string) => void;
}

export const UltraInstitutionalDecisionEngine: React.FC<UltraInstitutionalDecisionEngineProps> = ({ onNavigate }) => {
  const [selectedAsset, setSelectedAsset] = useState<'BTCUSDT' | 'XAUUSD' | 'XAUTUSD'>('BTCUSDT');
  const [activeTab, setActiveTab] = useState<'DECISION' | 'STRUCTURE' | 'LIQUIDITY' | 'ORDER_FLOW' | 'VOLUME_DERIVATIVES' | 'MACRO' | 'RISK'>('DECISION');

  // Interactive Risk Calculator State
  const [userEquity, setUserEquity] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);

  const data: UltraInstitutionalTradeDecision =
    ULTRA_INSTITUTIONAL_DATA[selectedAsset] || ULTRA_INSTITUTIONAL_DATA['BTCUSDT'];

  // Calculate position sizing
  const monetaryRiskLimit = (userEquity * riskPercent) / 100;
  const slDistance = Math.abs(data.entryUpper - data.stopLossPrice);
  const calculatedUnits = slDistance > 0 ? (monetaryRiskLimit / slDistance).toFixed(3) : '0';

  const decisionStyles = {
    LONG: {
      bg: 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400',
      badge: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-black font-extrabold shadow-emerald-500/20 shadow-xl',
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]'
    },
    SHORT: {
      bg: 'bg-rose-950/20 border-rose-500/40 text-rose-400',
      badge: 'bg-gradient-to-r from-rose-600 to-pink-500 text-white font-extrabold shadow-rose-500/20 shadow-xl',
      border: 'border-rose-500/40',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.2)]'
    },
    WAIT: {
      bg: 'bg-amber-950/20 border-amber-500/40 text-amber-400',
      badge: 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-extrabold shadow-amber-500/20 shadow-xl',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]'
    }
  }[data.primaryDecision];

  return (
    <div className="space-y-5 font-sans text-slate-100 bg-[#050811] min-h-screen p-3 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl">
      {/* ────────────────── TOP MASTER HEADER ────────────────── */}
      <header className="rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0c1426] via-[#090f1e] to-[#070b14] p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 px-3.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                ULTRA-INSTITUTIONAL AI TRADE DECISION ENGINE — V2
              </span>
              <span className="rounded-full border border-slate-800 bg-[#0d1629] px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                Execution: <b className="text-cyan-400">{data.tradeTimeframe}</b>
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400">
                ● {data.dataQuality}
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans flex items-center gap-3">
              <span>{data.displaySymbol}</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-white ml-1">
                {data.formattedPrice}
              </span>
              <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${data.isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {data.change24h}
              </span>
            </h1>

            <p className="mt-1 text-xs text-slate-400 max-w-3xl font-mono leading-relaxed">
              Source: <b className="text-slate-200">{data.dataSourceLabel}</b> · {data.lastUpdateTimestamp}
            </p>
          </div>

          {/* PRIMARY DECISION PILL */}
          <div className={`rounded-xl border p-4 ${decisionStyles.bg} ${decisionStyles.border} ${decisionStyles.glow} flex flex-col items-center justify-center text-center min-w-[260px] shadow-2xl`}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PRIMARY DECISION
            </span>
            <div className="mt-1">
              <span className={`px-4 py-1.5 rounded-lg text-lg font-black tracking-wider uppercase font-mono ${decisionStyles.badge}`}>
                {data.primaryDecision === 'LONG' ? '🟢 LONG' : data.primaryDecision === 'SHORT' ? '🔴 SHORT' : '🟡 WAIT'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                Regime: <b className="text-amber-300">{data.regime}</b>
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Net R: <b className="text-cyan-400">{data.estimatedNetExpectancy.split(' ')[0]}</b>
              </span>
            </div>
          </div>
        </div>

        {/* ASSET SELECTOR & ENGINE TABS BAR */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* 3 Supported Markets */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">MARKETS:</span>
            <button
              onClick={() => setSelectedAsset('BTCUSDT')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                selectedAsset === 'BTCUSDT'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
                  : 'bg-[#101728] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ₿ BTCUSDT (Bitcoin)
            </button>
            <button
              onClick={() => setSelectedAsset('XAUUSD')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                selectedAsset === 'XAUUSD'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400'
                  : 'bg-[#101728] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🥇 XAUUSD (Gold Spot / COMEX Proxy)
            </button>
            <button
              onClick={() => setSelectedAsset('XAUTUSD')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                selectedAsset === 'XAUTUSD'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-[#101728] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🪙 XAUTUSD (Tether Gold Token)
            </button>
          </div>

          {/* Engine Sub-System Tabs */}
          <div className="flex items-center gap-1 bg-[#090f1c] p-1 rounded-xl border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveTab('DECISION')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'DECISION' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Decision Matrix
            </button>
            <button
              onClick={() => setActiveTab('STRUCTURE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'STRUCTURE' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📐 Structure & OB
            </button>
            <button
              onClick={() => setActiveTab('LIQUIDITY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'LIQUIDITY' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              💧 Liquidity & Sweeps
            </button>
            <button
              onClick={() => setActiveTab('ORDER_FLOW')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'ORDER_FLOW' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌊 Order Flow
            </button>
            <button
              onClick={() => setActiveTab('VOLUME_DERIVATIVES')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'VOLUME_DERIVATIVES' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 VP & OI
            </button>
            <button
              onClick={() => setActiveTab('MACRO')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'MACRO' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Macro Engine
            </button>
            <button
              onClick={() => setActiveTab('RISK')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'RISK' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Risk Sizing
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('order-flow')}
                className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 transition-all font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                title="Open Order Flow Footprint Terminal"
              >
                🌊 Footprint Engine ↗
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ────────────────── MAIN TAB CONTENT ────────────────── */}
      {activeTab === 'DECISION' && (
        <div className="space-y-4">
          {/* 1. TOP METRICS STRIP: REGIME + MULTI-TIMEFRAME CONFLUENCE */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono">
            {/* Regime Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">ADAPTIVE REGIME</span>
              <span className="text-base font-black text-amber-400 flex items-center gap-1.5">
                <span>🧩</span> {data.regime}
              </span>
              <p className="text-[11px] font-sans text-slate-400 leading-snug">
                {data.regimeDescription}
              </p>
            </div>

            {/* MTF Confluence Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">MTF ALIGNMENT</span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">1D: {data.mtfBias.daily}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">4H: {data.mtfBias.fourHour}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">1H: {data.mtfBias.oneHour}</span>
              </div>
              <p className="text-[11px] font-sans text-slate-400 pt-1">
                Primary: <b className="text-cyan-400">15M ({data.mtfBias.fifteenMin})</b> · 5M Refined
              </p>
            </div>

            {/* Scenario Score Comparison */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">SCENARIO EVALUATION</span>
              <div className="flex items-center justify-between text-xs pt-1">
                <span>Long Score: <b className="text-emerald-400 text-sm">{data.longScenarioScore}/100</b></span>
                <span>Short Score: <b className="text-rose-400 text-sm">{data.shortScenarioScore}/100</b></span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Calibrated Probability: <b className="text-white">{data.calibratedProbabilityEstimate}</b>
              </p>
            </div>

            {/* Net Expectancy & Costs */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">NET EXPECTANCY & R:R</span>
              <span className="text-base font-black text-cyan-400">
                {data.riskRewardRatio} ({data.estimatedNetExpectancy.split(' ')[0]})
              </span>
              <p className="text-[10px] text-slate-400 font-sans">
                {data.estimatedFeesAndSlippage}
              </p>
            </div>
          </div>

          {/* 2. HIGH-PRECISION EXECUTION BLUEPRINT */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#090e1a] space-y-3.5 shadow-xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎯</span> HIGH-PRECISION ENTRY BLUEPRINT (MANDATORY 16-POINT SPECIFICATION)
              </span>
              <span className="text-xs text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800 font-bold">
                Status: {data.primaryDecision === 'LONG' ? 'ENTRY VALIDATED' : data.primaryDecision === 'SHORT' ? 'SHORT VALIDATED' : 'WAIT FOR CONFIRMATION'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
              <div className="p-3 rounded-xl bg-[#0e1628] border border-cyan-500/40 space-y-1">
                <span className="text-[10px] uppercase text-cyan-300 block">ENTRY ZONE</span>
                <span className="text-base font-bold text-white">{data.entryZone.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400 block font-sans">Retest of POC / OB</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-1">
                <span className="text-[10px] uppercase text-rose-300 block">STOP LOSS</span>
                <span className="text-base font-bold text-rose-400">{data.stopLossFormatted.split(' ')[0]}</span>
                <span className="text-[10px] text-rose-300/80 block font-sans">Structural Pivot</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] uppercase text-emerald-300 block">TARGET TP1</span>
                <span className="text-base font-bold text-emerald-400">{data.targetTp1.formatted}</span>
                <span className="text-[10px] text-emerald-300/80 block font-sans">{data.targetTp1.gainPct} (Scale 50%)</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] uppercase text-emerald-300 block">TARGET TP2</span>
                <span className="text-base font-bold text-emerald-400">{data.targetTp2.formatted}</span>
                <span className="text-[10px] text-emerald-300/80 block font-sans">{data.targetTp2.gainPct} (Scale 30%)</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] uppercase text-emerald-300 block">TARGET TP3 (RUNNER)</span>
                <span className="text-base font-bold text-emerald-400">{data.targetTp3.formatted}</span>
                <span className="text-[10px] text-emerald-300/80 block font-sans">{data.targetTp3.gainPct} (Trail 20%)</span>
              </div>
            </div>

            {/* Confirmation Trigger & Invalidation Reason */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-800 text-xs font-sans">
              <div className="p-2.5 rounded-lg bg-[#0e1628] border border-slate-800">
                <strong className="text-cyan-400 block font-mono text-[11px] mb-0.5">⚡ EXACT CONFIRMATION TRIGGER:</strong>
                <p className="text-slate-300 text-xs leading-relaxed">{data.exactConfirmationTrigger}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#140c16] border border-slate-800">
                <strong className="text-rose-400 block font-mono text-[11px] mb-0.5">🛑 STRUCTURAL INVALIDATION:</strong>
                <p className="text-slate-300 text-xs leading-relaxed">{data.structuralInvalidationReason}</p>
              </div>
            </div>
          </div>

          {/* 3. THE INSTITUTIONAL DEBATE: BULLISH VS BEARISH EVIDENCE */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Bullish Evidence */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#091515] space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <span>🟢</span> VERIFIED BULLISH EVIDENCE (SCORE: {data.longScenarioScore}/100)
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {data.bullishEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bearish Evidence */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-[#160c12] space-y-2.5">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                <span>🔴</span> VERIFIED BEARISH COUNTER-EVIDENCE (SCORE: {data.shortScenarioScore}/100)
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {data.bearishEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 mt-0.5 font-bold">✗</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. THE TWO DECISIVE TESTS & CANCELLATION CONDITIONS */}
          <div className="grid gap-3 sm:grid-cols-3 font-sans">
            <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-[#081224] space-y-1">
              <span className="text-[10px] uppercase font-mono text-cyan-300 font-bold block">
                🎯 STRONGEST REASON TO TAKE TRADE
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {data.strongestReasonToTakeTrade}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-[#181109] space-y-1">
              <span className="text-[10px] uppercase font-mono text-amber-300 font-bold block">
                🛑 STRONGEST REASON NOT TO TAKE TRADE
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {data.strongestReasonNotToTakeTrade}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-[#170a12] space-y-1">
              <span className="text-[10px] uppercase font-mono text-rose-300 font-bold block">
                ⚠️ CONDITIONS THAT CANCEL SETUP
              </span>
              <ul className="text-[11px] text-slate-300 space-y-0.5">
                {data.setupCancellationConditions.map((cond, i) => (
                  <li key={i}>• {cond}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. SIMPLE HINDI / HINGLISH EXPLANATION BOX */}
          <div className="p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-[#0d122b] to-[#090e1f] space-y-1.5 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                CLEAR EXPLANATION (SIMPLE HINDI / HINGLISH)
              </span>
            </div>
            <p className="text-xs sm:text-sm font-sans text-slate-200 leading-relaxed font-medium">
              {data.explanationHindiHinglish}
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 2: STRUCTURE & PRICE ACTION ── */}
      {activeTab === 'STRUCTURE' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-cyan-400">📐 MARKET STRUCTURE & INSTITUTIONAL PRICE ACTION</span>
            <span className="text-slate-400">{data.structure.trend}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">HH / HL STATUS</span>
              <span className="text-white font-bold">{data.structure.hh_hl_status}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">BOS LEVEL / CHOCH</span>
              <span className="text-white font-bold">BOS: ${data.structure.bosLevel} · CHoCH: ${data.structure.chochLevel}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">PREMIUM / DISCOUNT</span>
              <span className="text-emerald-400 font-bold">{data.structure.premiumDiscountZone}</span>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-white block">ACTIVE ORDER BLOCKS (OB) & FAIR VALUE GAPS (FVG):</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.structure.orderBlocks.map((ob, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#0a1120] border border-slate-800 flex justify-between">
                  <span>{ob.type}: <b>${ob.low} – ${ob.high}</b></span>
                  <span className={ob.mitigated ? 'text-slate-500' : 'text-emerald-400 font-bold'}>{ob.mitigated ? 'Mitigated' : 'Unmitigated (Fresh)'}</span>
                </div>
              ))}
              {data.structure.fvgZones.map((fvg, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#0a1120] border border-slate-800 flex justify-between">
                  <span>{fvg.type}: <b>${fvg.low} – ${fvg.high}</b></span>
                  <span className="text-cyan-400 font-bold">{fvg.filledPct}% Filled</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LIQUIDITY INTELLIGENCE ── */}
      {activeTab === 'LIQUIDITY' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-cyan-400">💧 INSTITUTIONAL LIQUIDITY INTELLIGENCE</span>
            <span className="text-emerald-400 font-bold">{data.liquidity.liquiditySweepStatus}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">BUY-SIDE LIQUIDITY (BSL)</span>
              <span className="text-emerald-400 font-bold text-sm">${data.liquidity.bslTarget}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">SELL-SIDE LIQUIDITY (SSL)</span>
              <span className="text-rose-400 font-bold text-sm">${data.liquidity.sslTarget}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">PREVIOUS DAY H / L</span>
              <span className="text-white font-bold">${data.liquidity.previousDayHigh} / ${data.liquidity.previousDayLow}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">ASIAN SESSION H / L</span>
              <span className="text-white font-bold">${data.liquidity.asianSessionHigh} / ${data.liquidity.asianSessionLow}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#070d18] border border-slate-800">
            <span className="text-[10px] text-cyan-400 font-bold block mb-1">LIQUIDITY SCENARIO PATH:</span>
            <p className="text-slate-300 font-sans">{data.liquidity.scenarioPath}</p>
          </div>
        </div>
      )}

      {/* ── TAB 4: ORDER FLOW ── */}
      {activeTab === 'ORDER_FLOW' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-cyan-400">🌊 INSTITUTIONAL ORDER FLOW ANALYTICS</span>
            <span className="text-emerald-400 font-bold">{data.orderFlow.cvdTrend}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">24H CUMULATIVE DELTA</span>
              <span className="text-emerald-400 font-bold text-sm">{data.orderFlow.cvd24h}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">ABSORPTION STATUS</span>
              <span className="text-cyan-300 font-bold text-sm">{data.orderFlow.absorptionStatus}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">SPOOFING RISK INDEX</span>
              <span className="text-emerald-400 font-bold text-sm">{data.orderFlow.spoofingRiskIndex}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#070d18] border border-slate-800 space-y-1">
            <span className="text-[10px] text-cyan-400 font-bold block">STACKED FOOTPRINT IMBALANCES:</span>
            <p className="text-slate-300 font-sans">{data.orderFlow.stackedImbalances}</p>
            <p className="text-slate-400 text-[11px] pt-1">Trapped Traders: {data.orderFlow.trappedTradersStatus}</p>
          </div>
        </div>
      )}

      {/* ── TAB 5: VOLUME PROFILE & DERIVATIVES ── */}
      {activeTab === 'VOLUME_DERIVATIVES' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-cyan-400">📊 VOLUME PROFILE & LIQUIDATION DERIVATIVES</span>
            <span className="text-amber-400 font-bold">{data.volumeDerivatives.valueAreaMigration}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">POINT OF CONTROL (POC)</span>
              <span className="text-amber-400 font-bold text-sm">${data.volumeDerivatives.poc}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">VAH / VAL</span>
              <span className="text-cyan-400 font-bold text-sm">${data.volumeDerivatives.vah} / ${data.volumeDerivatives.val}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">SESSION VWAP</span>
              <span className="text-purple-400 font-bold text-sm">${data.volumeDerivatives.sessionVwap}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">OPEN INTEREST DELTA</span>
              <span className="text-emerald-400 font-bold text-sm">{data.volumeDerivatives.openInterestDelta24h}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#070d18] border border-slate-800">
            <span className="text-[10px] text-cyan-400 font-bold block mb-1">CROWDED POSITIONING & SQUEEZE POTENTIAL:</span>
            <p className="text-slate-300 font-sans">{data.volumeDerivatives.crowdedPositioningStatus} · Funding: {data.volumeDerivatives.fundingRate} · L/S: {data.volumeDerivatives.longShortRatio}</p>
          </div>
        </div>
      )}

      {/* ── TAB 6: MACRO ENGINE ── */}
      {activeTab === 'MACRO' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-cyan-400">🌐 MACRO, FUNDAMENTALS & CROSS-MARKET REGIME</span>
            <span className="text-emerald-400 font-bold">{data.macro.macroSentimentScore}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">DXY DOLLAR INDEX</span>
              <span className="text-white font-bold">{data.macro.dxyTrend}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">US 10Y / REAL YIELD</span>
              <span className="text-white font-bold">{data.macro.us10yYield} ({data.macro.realYieldTrend})</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">FED RATE EXPECTATIONS</span>
              <span className="text-white font-bold">{data.macro.fedCutExpectation}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#070d18] border border-slate-800 space-y-1">
            <span className="text-[10px] text-cyan-400 font-bold block">CROSS-MARKET CORRELATION REGIME:</span>
            <p className="text-slate-300 font-sans">{data.macro.crossMarketRegime}</p>
          </div>
        </div>
      )}

      {/* ── TAB 7: PROFESSIONAL RISK CALCULATOR ── */}
      {activeTab === 'RISK' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-[#090e1a] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-amber-400">🛡️ PROFESSIONAL RISK MANAGEMENT & SIZING</span>
            <span className="text-slate-400">Max Portfolio Risk: {riskPercent}%</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-[#0e1628] border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span>Account Balance ($):</span>
                <input
                  type="number"
                  value={userEquity}
                  onChange={(e) => setUserEquity(Number(e.target.value) || 0)}
                  className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right text-white font-bold"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Risk Per Trade (%):</span>
                <input
                  type="number"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value) || 0)}
                  className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right text-white font-bold"
                />
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Monetary Risk Budget:</span>
                <b className="text-rose-400">${monetaryRiskLimit.toFixed(2)}</b>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#070d18] border border-cyan-500/40 space-y-2">
              <span className="text-cyan-400 font-bold block text-sm">CALCULATED POSITION SIZING:</span>
              <div className="flex justify-between">
                <span>Entry to Stop Distance:</span>
                <b>${slDistance.toFixed(2)}</b>
              </div>
              <div className="flex justify-between">
                <span>Recommended Sizing:</span>
                <b className="text-emerald-400 text-base">{calculatedUnits} {selectedAsset === 'BTCUSDT' ? 'BTC' : 'Lots / Oz'}</b>
              </div>
              <p className="text-[10px] text-slate-400 font-sans pt-1">
                * Position size strictly calibrated to maintain maximum loss within ${monetaryRiskLimit}. Never over-leverage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraInstitutionalDecisionEngine;
