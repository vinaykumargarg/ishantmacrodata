import React, { useState, useMemo } from 'react';
import {
  AssetKey,
  generateWeeklyBigPlayerReport,
  MOCK_RADAR_EVENTS,
  MOCK_RADAR_FRESHNESS,
  FactLabel,
  BehaviorClass
} from '../services/deeeprBigPlayerRadarEngine';

interface DeeeprBigPlayerRadarViewProps {
  onNavigate?: (tab: string) => void;
  defaultAsset?: AssetKey;
}

export const DeeeprBigPlayerRadarView: React.FC<DeeeprBigPlayerRadarViewProps> = ({
  onNavigate,
  defaultAsset = 'BTC'
}) => {
  const [activeAsset, setActiveAsset] = useState<AssetKey>(defaultAsset);
  const [activeSubTab, setActiveSubTab] = useState<'RADAR_VIEW' | 'WEEKLY_REPORT' | 'CROSS_ASSET' | 'FRESHNESS'>('RADAR_VIEW');
  const [copiedReport, setCopiedReport] = useState(false);

  const report = useMemo(() => {
    return generateWeeklyBigPlayerReport();
  }, []);

  const assetProfile = report.assets[activeAsset] || report.assets.BTC;

  const handleCopyReport = () => {
    const textToCopy = JSON.stringify({
      reportHeader: {
        id: report.reportId,
        week: report.weekRangeIST,
        asOfIST: report.asOfIST,
        topTakeaways: report.top5TakeawaysHinglish
      },
      assetProfile: assetProfile
    }, null, 2);

    navigator.clipboard.writeText(textToCopy);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const getLabelBadge = (label: FactLabel) => {
    switch (label) {
      case 'REPORTED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DERIVED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'ESTIMATED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'INFERENCE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  const getBehaviorBadge = (b: BehaviorClass, persistent: boolean) => {
    switch (b) {
      case 'ACCUMULATING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span>🟢 ACCUMULATING</span>
            {persistent && <span className="text-[9px] bg-emerald-500/30 px-1 rounded">Persistent 3W+</span>}
          </span>
        );
      case 'DISTRIBUTING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span>🔴 DISTRIBUTING</span>
            {persistent && <span className="text-[9px] bg-rose-500/30 px-1 rounded">Persistent 3W+</span>}
          </span>
        );
      case 'NEUTRAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
            ⚪ NEUTRAL
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-900 text-slate-500 border border-slate-800">
            — UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 p-3 sm:p-5 font-sans magical-midnight-bg rounded-2xl border-2 border-amber-500/30 shadow-2xl animate-fadeIn">
      {/* ────────────────── 1. INSTITUTIONAL TERMINAL HEADER ────────────────── */}
      <header className="rounded-2xl panel-gold-glow p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-3xl">🐋</span>
              <h1 className="text-lg sm:text-2xl font-black font-sans tracking-tight flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                  DEEEPR "BIG PLAYER RADAR" v1
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  SMART-MONEY FLOWS
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-sans mt-1">
              Weekly & Live Institutional Capital Flows: Tracking Spot ETF Issuers, Banks, Hedge Funds (COT), Corporate Treasuries, Central Banks, Miners, Exchanges, Whales, and Early-Era Wallets.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-[#0e1630] border border-amber-500/30 text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">IST Week Range</span>
              <span className="text-xs font-mono font-bold text-amber-300">{report.weekRangeIST.start.split(' ')[0]} → {report.weekRangeIST.end.split(' ')[0]}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#0e1630] border border-amber-500/30 text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Single Arbiter Role</span>
              <span className="text-xs font-mono font-bold text-emerald-400">Evidence Only (No Standalone Signal)</span>
            </div>
            <button
              onClick={handleCopyReport}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>{copiedReport ? '✅ Copied!' : '📋 Copy Report'}</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('deeepr-decision-engine')}
                className="px-3 py-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
                title="Go to Master Decision Engine"
              >
                <span>🔮 Decision Engine</span>
              </button>
            )}
          </div>
        </div>

        {/* Macro Regime Summary Banner */}
        <div className="p-3.5 rounded-xl panel-purple-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌐</span>
            <div className="text-xs">
              <span className="font-bold text-purple-200 uppercase font-mono mr-2">Weekly Macro Regime:</span>
              <span className="text-slate-200 font-sans">{report.macroRegimeSummaryHinglish}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-slate-400">Source Lag Rule:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              COT 3D Lag · 13F 45D Lag · ETF T+1
            </span>
          </div>
        </div>

        {/* Asset Selector Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {(['BTC', 'ETH', 'SOL', 'XAU', 'XAG', 'WTI'] as AssetKey[]).map((assetKey) => {
              const active = activeAsset === assetKey;
              const assetScore = report.assets[assetKey]?.smartMoney.score ?? 0;
              return (
                <button
                  key={assetKey}
                  onClick={() => setActiveAsset(assetKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_12px_rgba(238,186,48,0.5)] border border-amber-300'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span>{assetKey === 'BTC' ? '₿ BTC' : assetKey === 'ETH' ? 'Ξ ETH' : assetKey === 'SOL' ? '◎ SOL' : assetKey === 'XAU' ? '🥇 Gold' : assetKey === 'XAG' ? '🥈 Silver' : '🛢️ Oil'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    assetScore >= 30 ? 'bg-emerald-500/30 text-emerald-200' : assetScore <= -30 ? 'bg-rose-500/30 text-rose-200' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {assetScore > 0 ? `+${assetScore}` : assetScore}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab(activeSubTab === 'WEEKLY_REPORT' ? 'RADAR_VIEW' : 'WEEKLY_REPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'WEEKLY_REPORT'
                  ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-md font-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span>📑</span>
              <span>{activeSubTab === 'WEEKLY_REPORT' ? 'Back to Radar' : '13-Section Hinglish Report'}</span>
            </button>
            <button
              onClick={() => setActiveSubTab(activeSubTab === 'CROSS_ASSET' ? 'RADAR_VIEW' : 'CROSS_ASSET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'CROSS_ASSET'
                  ? 'bg-cyan-500 text-slate-950 border border-cyan-400 shadow-md font-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              <span>🌐</span>
              <span>Cross-Asset Matrix</span>
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── 2. LIVE RADAR ALERTS BAR ────────────────── */}
      <section className="rounded-2xl panel-cyan-glow p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-sm font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400">
              🚨 Live Radar Event Feed & Priority Alerts
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Rule R1 & R4: Reputable Labelled Sources Only · Inferences Tagged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_RADAR_EVENTS.slice(0, 3).map((evt) => (
            <div
              key={evt.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                evt.priority === 'CRITICAL'
                  ? 'panel-gold-glow'
                  : evt.priority === 'HIGH'
                  ? 'panel-purple-glow'
                  : 'bg-slate-900/60 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-slate-400">{evt.timestampIST}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getLabelBadge(evt.label)}`}>
                  {evt.label}
                </span>
              </div>
              <h4 className="font-bold text-slate-100 text-xs leading-snug">{evt.headline}</h4>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{evt.descriptionHinglish}</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                <span>{evt.source}</span>
                <span className="text-cyan-300 font-semibold">{evt.dataLag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 3. ASSET SMART MONEY SCORE CARD ────────────────── */}
      <section className="rounded-2xl panel-purple-glow p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black font-mono shadow-inner border ${
              assetProfile.smartMoney.score >= 30
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                : assetProfile.smartMoney.score <= -30
                ? 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}>
              {assetProfile.smartMoney.score > 0 ? `+${assetProfile.smartMoney.score}` : assetProfile.smartMoney.score}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black text-white font-mono">{activeAsset} Smart-Money Alignment:</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-black font-mono border ${
                  assetProfile.smartMoney.label === 'SMART_MONEY_BUYING'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : assetProfile.smartMoney.label === 'SMART_MONEY_SELLING'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {assetProfile.smartMoney.label.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Confidence: {assetProfile.smartMoney.confidence} ({assetProfile.smartMoney.confidenceBasis})
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-sans">{assetProfile.smartMoney.headlineHinglish}</p>
              <p className="text-[11px] text-slate-400 font-sans">{assetProfile.smartMoney.primaryDriverHinglish}</p>
            </div>
          </div>

          {/* Retail vs Smart Divergence Card */}
          <div className="p-3 rounded-xl bg-[#091024] border border-indigo-500/30 text-xs space-y-1 min-w-[240px]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
              Retail vs Smart Money Divergence
            </span>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300">Retail Lean:</span>
              <span className="font-bold text-amber-300">{assetProfile.divergence.retailCrowdLean}</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300">Smart Money:</span>
              <span className="font-bold text-emerald-300">{assetProfile.divergence.smartMoneyLean}</span>
            </div>
            <div className="text-[11px] text-slate-300 font-sans border-t border-slate-800 pt-1 mt-1">
              {assetProfile.divergence.contextHinglish}
            </div>
          </div>
        </div>

        {/* ────────────────── 4. 11-ENTITY CLASS HEAT TABLE ────────────────── */}
        {activeSubTab === 'RADAR_VIEW' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span>📊</span>
                <span>Entity Class Flow & Behavior Matrix (Kaun Kya Kar Raha Hai)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Z-Score ≥ +1.0 = Accumulating · Z-Score ≤ -1.0 = Distributing
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#050914]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#080e1e] text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Entity Class</th>
                    <th className="py-2.5 px-3">Weekly Net Flow</th>
                    <th className="py-2.5 px-3">Behavior (Z-Score)</th>
                    <th className="py-2.5 px-3">Cumulative Holdings</th>
                    <th className="py-2.5 px-3">Fact Label</th>
                    <th className="py-2.5 px-3">Source & Lag</th>
                    <th className="py-2.5 px-3">Hinglish Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {Object.values(assetProfile.classes).map((cls) => (
                    <tr key={cls.entityClass} className="hover:bg-indigo-950/20 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2 whitespace-nowrap">
                        <span>{cls.icon}</span>
                        <span>{cls.displayName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                        {cls.weeklyNetFlowUsd !== null ? (
                          <span className={cls.weeklyNetFlowUsd > 0 ? 'text-emerald-400' : cls.weeklyNetFlowUsd < 0 ? 'text-rose-400' : 'text-slate-300'}>
                            {cls.weeklyNetFlowUsd > 0 ? `+$${(cls.weeklyNetFlowUsd / 1e6).toFixed(1)}M` : `-$${(Math.abs(cls.weeklyNetFlowUsd) / 1e6).toFixed(1)}M`}
                            {cls.weeklyNetFlowUnits && <span className="block text-[10px] text-slate-400 font-normal">{cls.weeklyNetFlowUnits}</span>}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {getBehaviorBadge(cls.behavior, cls.isPersistent)}
                          <span className="block text-[10px] font-mono text-slate-400">z: {cls.zScore52w > 0 ? `+${cls.zScore52w}` : cls.zScore52w}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {cls.cumulativeHoldingsUnits || '—'}
                        {cls.shareOfSupplyPct && (
                          <span className="block text-[10px] text-indigo-300">({cls.shareOfSupplyPct}% supply)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getLabelBadge(cls.label)}`}>
                          {cls.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        <span className="block text-slate-300">{cls.source}</span>
                        <span className="text-amber-400">{cls.lag}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs leading-snug">
                        {cls.summaryHinglish}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ────────────────── 5. COST BASIS LADDER & SCENARIO INFERENCES ────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* Cost-Basis Ladder */}
              <div className="rounded-2xl panel-gold-glow p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300 font-sans uppercase tracking-wider flex items-center gap-1.5">
                    <span>🪜</span>
                    <span>Cost-Basis Ladder (Bade Players Kahan Base Hue Hain)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-300">REPORTED vs ESTIMATED Entry Bases</span>
                </div>

                <div className="space-y-2">
                  {assetProfile.costBasisLadder.length > 0 ? (
                    assetProfile.costBasisLadder.map((cb) => (
                      <div key={cb.id} className="p-3 rounded-xl bg-[#080e20] border border-amber-500/25 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">{cb.entityName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getLabelBadge(cb.label)}`}>
                            {cb.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-amber-300 font-bold">${cb.priceLevel.toLocaleString()}</span>
                          <span className={`font-semibold ${cb.distancePts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {cb.distancePts >= 0 ? `+${cb.distancePts.toLocaleString()} pts (+${cb.distancePct}%) buffer` : `${cb.distancePts.toLocaleString()} pts (${cb.distancePct}%) stress`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">{cb.notesHinglish}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 text-center">No cost-basis records active for {activeAsset}.</p>
                  )}
                </div>
              </div>

              {/* "Kya Kar Sakte Hain" Scenario Inferences */}
              <div className="rounded-2xl panel-purple-glow p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                  <h4 className="text-xs sm:text-sm font-bold text-purple-300 font-sans uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>"Kya Kar Sakte Hain" Institutional Scenarios (Inference)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                    LABEL: INFERENCE ONLY
                  </span>
                </div>

                <div className="space-y-2.5">
                  {assetProfile.scenarios.map((sc) => (
                    <div key={sc.id} className="p-3 rounded-lg bg-[#080e20] border border-purple-500/30 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-purple-200">{sc.scenarioName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-500/40">
                          Confidence: {sc.confidence}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-sans">{sc.hypothesisHinglish}</p>
                      
                      <div className="space-y-1 bg-[#050814] p-2 rounded border border-slate-800 text-[10px] font-mono">
                        <span className="text-slate-400 block font-bold">Evidence Checklist (Reported Facts):</span>
                        {sc.evidenceList.map((e, idx) => (
                          <div key={idx} className="text-slate-300 flex items-center justify-between">
                            <span>• {e.point}</span>
                            <span className="text-slate-500">{e.source}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                        <div className="text-emerald-400 bg-emerald-950/20 p-1.5 rounded border border-emerald-500/20">
                          <span className="font-bold block">Confirms If:</span>
                          <span>{sc.confirmsIf}</span>
                        </div>
                        <div className="text-rose-400 bg-rose-950/20 p-1.5 rounded border border-rose-500/20">
                          <span className="font-bold block">Denies If:</span>
                          <span>{sc.deniesIf}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── 6. FULL 13-SECTION HINGLISH WEEKLY REPORT VIEW ────────────────── */}
        {activeSubTab === 'WEEKLY_REPORT' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
              <h3 className="text-sm font-black text-amber-300 font-mono flex items-center gap-2">
                <span>📑</span>
                <span>{activeAsset} FULL 13-SECTION HINGLISH INSTITUTIONAL RESEARCH REPORT</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Week Range: {assetProfile.weekRangeIST.start} → {assetProfile.weekRangeIST.end}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">1. Is Hafte Bade Players Ka Bottom Line</span>
                <p className="text-slate-200">{assetProfile.smartMoney.headlineHinglish}. Overall score: {assetProfile.smartMoney.score}/100 ({assetProfile.smartMoney.label}). {assetProfile.smartMoney.primaryDriverHinglish}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">2. ETF & Asset Managers Kya Kar Rahe Hain</span>
                <p className="text-slate-200">{assetProfile.classes.etf_managers.summaryHinglish} Net weekly flow: {assetProfile.classes.etf_managers.weeklyNetFlowUnits || 'N/A'}. Cumulative holdings: {assetProfile.classes.etf_managers.cumulativeHoldingsUnits || 'N/A'}.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">3. Hedge Funds & Banks Positioning</span>
                <p className="text-slate-200">{assetProfile.classes.hedge_funds_cot.summaryHinglish} Bank research view: {assetProfile.classes.banks_dealers.summaryHinglish}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">4. Corporates (Public/Private) & Treasuries</span>
                <p className="text-slate-200">{assetProfile.classes.public_corporates.summaryHinglish} Stablecoin / Private issuers: {assetProfile.classes.private_corporates.summaryHinglish}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">5. Governments & Central Banks</span>
                <p className="text-slate-200">{assetProfile.classes.governments_central_banks.summaryHinglish}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">6. Miners / Producers Stress</span>
                <p className="text-slate-200">{assetProfile.classes.miners_producers.summaryHinglish}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">7. Exchanges (Inflows, Outflows, PoR)</span>
                <p className="text-slate-200">{assetProfile.classes.exchanges.summaryHinglish} Reserves: {assetProfile.classes.exchanges.cumulativeHoldingsUnits || 'N/A'}.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">8. Whales & Early-Era Wallets</span>
                <p className="text-slate-200">{assetProfile.classes.whales.summaryHinglish} Early-era coins: {assetProfile.classes.early_era_wallets.summaryHinglish}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">9. Retail vs Smart Money Divergence</span>
                <p className="text-slate-200">{assetProfile.divergence.contextHinglish} (Type: {assetProfile.divergence.divergenceType}).</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">10. Cost-Basis Ladder (Kaun Kahan Fasa Hai)</span>
                <p className="text-slate-200">{assetProfile.costBasisLadder.map(cb => `${cb.entityName}: $${cb.priceLevel.toLocaleString()} (${cb.notesHinglish})`).join(' | ')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">11. Aage Kya Kar Sakte Hain (Scenarios)</span>
                <p className="text-slate-200">{assetProfile.scenarios.map(sc => `${sc.scenarioName}: ${sc.hypothesisHinglish}`).join(' | ')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">12. Agle Hafte Ka Watchlist</span>
                <p className="text-slate-200">{assetProfile.nextWeekWatchlist.map(w => `${w.dateIST}: ${w.event} (${w.expectedImpact} impact)`).join(' | ') || 'No critical dated releases.'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d1c] border border-indigo-500/30 space-y-1 col-span-1 md:col-span-2">
                <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">13. Data Ki Kami Aur Lag Notice</span>
                <p className="text-slate-300 text-[11px]">COT data carries a 3-day reporting lag (Tuesday positioning released Friday night IST). 13F holdings carry 45-day lag. On-chain cluster heuristics carry ESTIMATED confidence. Research aid only, never trade on lagged figures blindly.</p>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── 7. CROSS-ASSET MATRIX VIEW ────────────────── */}
        {activeSubTab === 'CROSS_ASSET' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
              <h3 className="text-xs sm:text-sm font-black text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span>🌐</span>
                <span>Cross-Asset Institutional Flow Matrix (BTC ↔ Gold ↔ Silver ↔ Oil)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Capital Rotation Tracking</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#050914]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#080e1e] text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Smart Money Alignment</th>
                    <th className="py-2.5 px-3">ETF Net Flow</th>
                    <th className="py-2.5 px-3">Hedge Funds (COT)</th>
                    <th className="py-2.5 px-3">Macro Regime Alignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {report.crossAssetMatrix.map((item) => (
                    <tr key={item.asset} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-white">
                        {item.asset}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          item.smartMoneyScore >= 30 ? 'bg-emerald-500/20 text-emerald-300' : item.smartMoneyScore <= -30 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.smartMoneyScore > 0 ? `+${item.smartMoneyScore}` : item.smartMoneyScore} · {item.smartMoneyLabel.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {item.etfFlowWeeklyUsd ? (
                          <span className={item.etfFlowWeeklyUsd > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {item.etfFlowWeeklyUsd > 0 ? `+$${(item.etfFlowWeeklyUsd / 1e6).toFixed(1)}M` : `-$${(Math.abs(item.etfFlowWeeklyUsd) / 1e6).toFixed(1)}M`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-300">
                        {item.cotSpecNetPosition}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded ${
                          item.macroAlignment === 'ALIGNED_RISK_ON' ? 'bg-emerald-500/20 text-emerald-300' : item.macroAlignment === 'ALIGNED_DEFENSIVE' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.macroAlignment.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ────────────────── 8. FOOTER & DATA FRESHNESS TABLE ────────────────── */}
      <footer className="rounded-xl border border-slate-800 bg-[#050814] p-3 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
          <span>DEEEPR Institutional Big-Player Engine v1</span>
          <span>Legal Disclaimer: Publicly verifiable regulatory filings and on-chain records only.</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
          {MOCK_RADAR_FRESHNESS.map((f, i) => (
            <span key={i} className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              {f.category}: <span className="text-slate-300">{f.lastUpdate}</span> ({f.lagDescription})
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default DeeeprBigPlayerRadarView;
