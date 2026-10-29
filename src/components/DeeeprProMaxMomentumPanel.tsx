import React, { useState } from 'react';
import {
  MasterVerdictProMax,
  ScenarioBranch,
  TARGET_BAND_PRESETS
} from '../services/deeeprMomentumLiquidityEngine';

interface DeeeprProMaxMomentumPanelProps {
  verdict: MasterVerdictProMax;
  onSelectScenario?: (scenario: ScenarioBranch) => void;
}

export const DeeeprProMaxMomentumPanel: React.FC<DeeeprProMaxMomentumPanelProps> = ({
  verdict,
  onSelectScenario
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<'S1' | 'S2' | 'S3' | 'S4'>('S2');
  const [copiedPlan, setCopiedPlan] = useState(false);

  const selectedScenario =
    verdict.scenarios.find((s) => s.id === selectedScenarioId) || verdict.scenarios[0];

  const handleCopyPlan = () => {
    if (!verdict.plan) return;
    const text = `DEEEPR PRO-MAX SETUP (${verdict.asset}):
Direction: ${verdict.plan.direction} (${verdict.plan.model})
Entry Zone: $${verdict.plan.entryZone[0].toLocaleString()} - $${verdict.plan.entryZone[1].toLocaleString()}
Stop Loss: $${verdict.plan.sl.toLocaleString()} (-${verdict.plan.slDistancePts.toLocaleString()} pts)
TP1: $${verdict.plan.tp1.toLocaleString()} (${verdict.plan.tp1Pts.toLocaleString()} pts, RR 1:${verdict.plan.rrTp1})
TP2: $${verdict.plan.tp2.toLocaleString()} (${verdict.plan.tp2Pts.toLocaleString()} pts, RR 1:${verdict.plan.rrTp2})
TP3: $${verdict.plan.tp3.toLocaleString()} (${verdict.plan.tp3Pts.toLocaleString()} pts, Target Band: ${verdict.plan.targetBandMinPts}-${verdict.plan.targetBandMaxPts} pts)
Big Player Play: ${verdict.bigPlayer.type} (${verdict.bigPlayer.confidence})
Trapped Side: ${verdict.crowd.trappedSide}`;
    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  const isShort = verdict.direction === 'SHORT';
  const isLong = verdict.direction === 'LONG';
  const isWait = verdict.direction === 'WAIT';

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ────────────────── 1. PRO-MAX INSTITUTIONAL HEADER STRIP ────────────────── */}
      <div className="rounded-xl border border-white/10 bg-[#131822] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#5b8cff]/15 text-[#5b8cff] border border-[#5b8cff]/30 uppercase tracking-wide">
              DEEEPR Pro-Max v1
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Regime: <strong className="text-slate-200">{verdict.regime}</strong>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Scores: Long <strong className="text-slate-200">{verdict.scores.longScore}</strong> / Short <strong className="text-slate-200">{verdict.scores.shortScore}</strong> (Gap: {verdict.scores.gap > 0 ? `+${verdict.scores.gap}` : verdict.scores.gap})
            </span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold font-mono border ${
              isShort ? 'bg-[#f0616d]/15 text-[#f0616d] border-[#f0616d]/30' :
              isLong ? 'bg-[#2ebd85]/15 text-[#2ebd85] border-[#2ebd85]/30' :
              'bg-[#e8b04a]/15 text-[#e8b04a] border-[#e8b04a]/30'
            }`}>
              {verdict.state}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Target Band:</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-[#5b8cff] font-semibold border border-white/10">
              {verdict.asset === 'BTC' ? '2,500–3,000 pts' : verdict.asset === 'GOLD' ? '50–80 pts' : '1.5–2.5x ATR'}
            </span>
          </div>
        </div>

        {/* Dense Institutional Header Line */}
        <p className="text-xs font-mono text-slate-300 leading-relaxed bg-[#1a2030] p-2.5 rounded-lg border border-white/10">
          <span className="text-[#5b8cff] font-semibold">{verdict.asset} ${verdict.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="text-slate-400"> · </span>
          <span>Regime: <b className="text-white">{verdict.regime}</b></span>
          <span className="text-slate-400"> · </span>
          <span>Bias: <b className={isShort ? 'text-[#f0616d]' : isLong ? 'text-[#2ebd85]' : 'text-[#e8b04a]'}>{verdict.direction}</b></span>
          <span className="text-slate-400"> · </span>
          <span>Magnet: <b className="text-amber-300">{verdict.crowd.nearestMagnet ? `$${verdict.crowd.nearestMagnet.centerPrice.toLocaleString()} ($${verdict.crowd.nearestMagnet.usdMillions}M)` : 'None'}</b></span>
          <span className="text-slate-400"> · </span>
          <span>Trapped: <b className="text-rose-400">{verdict.crowd.trappedSide}</b> (FuelDown: ${verdict.crowd.fuelDownUsdMillions}M vs FuelUp: ${verdict.crowd.fuelUpUsdMillions}M)</span>
        </p>
      </div>

      {/* ────────────────── 2. TWO COLUMN CARDS: KAUN JEETEGA & BIG PLAYER INFERENCE ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card A: "Kaun Jeetega" & Crowding Breakdown */}
        <div className="rounded-xl border border-white/10 bg-[#131822] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#5b8cff]" />
              <span>Kaun Jeetega: Longs vs Shorts Crowding</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 font-mono">
              ESTIMATED · Weight 0.5
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10 space-y-1">
              <span className="text-slate-400 text-[11px] uppercase tracking-wide block">Long Crowd Score</span>
              <p className="font-mono text-base font-bold text-slate-100">{verdict.crowd.longCrowdScore}/100</p>
              <span className="text-[11px] text-slate-400">Funding & L/S positioning</span>
            </div>
            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10 space-y-1">
              <span className="text-slate-400 text-[11px] uppercase tracking-wide block">Short Crowd Score</span>
              <p className="font-mono text-base font-bold text-slate-100">{verdict.crowd.shortCrowdScore}/100</p>
              <span className="text-[11px] text-slate-400">Downside chase pressure</span>
            </div>
          </div>

          {/* Fuel Meter Visual Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Fuel Down (Long Liq): <b className="text-rose-400">${verdict.crowd.fuelDownUsdMillions}M</b></span>
              <span>Fuel Up (Short Liq): <b className="text-emerald-400">${verdict.crowd.fuelUpUsdMillions}M</b></span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/10">
              <div
                className="bg-rose-500/80 transition-all"
                style={{ width: `${Math.max(10, Math.min(90, (verdict.crowd.fuelDownUsdMillions / ((verdict.crowd.fuelDownUsdMillions + verdict.crowd.fuelUpUsdMillions) || 1)) * 100))}%` }}
              />
              <div
                className="bg-emerald-500/80 transition-all"
                style={{ width: `${Math.max(10, Math.min(90, (verdict.crowd.fuelUpUsdMillions / ((verdict.crowd.fuelDownUsdMillions + verdict.crowd.fuelUpUsdMillions) || 1)) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
              {verdict.crowd.summarySentence}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#1a2030] border border-white/10 text-xs space-y-1">
            <span className="text-slate-400 text-[11px] uppercase tracking-wide block">Funding & Cost:</span>
            <p className="text-slate-200">{verdict.kaunJeetega.whoPaysFunding}</p>
          </div>
        </div>

        {/* Card B: Big-Player Inference & Scenarios */}
        <div className="rounded-xl border border-white/10 bg-[#131822] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>Big-Player Intent (Inference Ladder)</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              INFERENCE · Confidence: {verdict.bigPlayer.confidence}
            </span>
          </div>

          <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Pattern: <b className="text-amber-300">{verdict.bigPlayer.type.replace(/_/g, ' ')}</b>
              </span>
              <span className="text-xs font-mono text-slate-400">{verdict.bigPlayer.confidenceScore}/100</span>
            </div>

            {/* Evidence Checklist */}
            <div className="space-y-1 pt-1 text-xs">
              {verdict.bigPlayer.evidenceChecklist.map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{ev.item}</span>
                  </span>
                  <span className="font-mono text-slate-400">[{ev.sourceType}: {ev.value}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* What Players Can Do Next */}
          <div className="space-y-1 text-xs">
            <span className="text-slate-400 text-[11px] uppercase tracking-wide block">Bade Players Kya Kar Sakte Hain:</span>
            <ul className="space-y-1 text-slate-300 text-xs">
              {verdict.bigPlayer.whatPlayersCanDoNext.map((action, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#5b8cff]">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-2.5 rounded-lg bg-[#1a2030] border border-white/10 text-xs space-y-1">
            <span className="text-rose-400 text-[11px] uppercase tracking-wide block font-semibold">Retail Trap Warning:</span>
            <p className="text-slate-300 text-xs leading-relaxed">{verdict.kaunJeetega.retailTrapWarning}</p>
          </div>
        </div>
      </div>

      {/* ────────────────── 3. LIQUIDITY-HUNT SCENARIO TREE (S1 TO S4) ────────────────── */}
      <div className="rounded-xl border border-white/10 bg-[#131822] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-2">
              <span>Liquidity-Hunt Scenario Tree: Market Liquidity Lene Ja Raha Hai?</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#5b8cff]/15 text-[#5b8cff] font-medium border border-[#5b8cff]/30">
                4-Branch Scenario Tree
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nearest stop pool ko target karke sweep ya breakdown hone ke 4 scenarios live levels ke saath.
            </p>
          </div>

          {/* Scenario Selector Tabs */}
          <div className="flex items-center gap-1.5">
            {verdict.scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  onSelectScenario?.(sc);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedScenarioId === sc.id
                    ? 'bg-[#5b8cff] text-white'
                    : 'bg-[#1a2030] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {sc.id} {sc.favored ? '★ Favored' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Details Box */}
        <div className="rounded-xl border border-white/10 bg-[#1a2030] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>{selectedScenario.title}</span>
                {selectedScenario.favored && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    Currently Favored
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {selectedScenario.summaryHinglish}
              </p>
            </div>
          </div>

          {/* Trigger & Invalidation Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#131822] p-3 rounded-lg border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide block">Execution Trigger Rule</span>
              <p className="text-slate-300 text-xs leading-relaxed">{selectedScenario.triggerCondition}</p>
            </div>
            <div className="bg-[#131822] p-3 rounded-lg border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide block">Invalidation Condition</span>
              <p className="text-slate-300 text-xs leading-relaxed">{selectedScenario.invalidationCondition}</p>
            </div>
          </div>

          {/* Levels Grid (Entry, SL, TP1, TP2, TP3, RR) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs pt-1">
            <div className="bg-[#131822] p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Entry Zone</span>
              <p className="font-mono tabular-nums font-semibold text-slate-100 mt-1">
                ${selectedScenario.entryZone[0].toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-[#131822] p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Stop Loss</span>
              <p className="font-mono tabular-nums font-semibold text-rose-400 mt-1">
                ${selectedScenario.sl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-[#131822] p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Target TP1</span>
              <p className="font-mono tabular-nums font-semibold text-slate-200 mt-1">
                ${selectedScenario.tp1.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-[#131822] p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Target TP2</span>
              <p className="font-mono tabular-nums font-semibold text-slate-200 mt-1">
                ${selectedScenario.tp2.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-[#131822] p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Target TP3 (Band)</span>
              <p className="font-mono tabular-nums font-semibold text-emerald-400 mt-1">
                ${selectedScenario.tp3.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-[#131822] p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Worst-Edge RR</span>
              <p className="font-mono tabular-nums font-semibold text-[#5b8cff] mt-1">
                1 : {selectedScenario.rrWorstEdge.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-1">
            <b>Flip Rule:</b> {selectedScenario.flipCondition}
          </p>
        </div>
      </div>

      {/* ────────────────── 4. POINT TARGET BAND PLAN CARD (BTC 2,500-3,000 PTS) ────────────────── */}
      {verdict.plan && (
        <div className="rounded-xl border border-white/10 bg-[#131822] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                Active Execution Plan ({verdict.plan.direction} · {verdict.plan.model})
              </h3>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5b8cff]/15 text-[#5b8cff] border border-[#5b8cff]/30 font-mono">
                {verdict.plan.targetBandStatus}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Risk Cap: {verdict.plan.positionSizePct}%
              </span>
              <button
                onClick={handleCopyPlan}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 cursor-pointer transition-colors"
              >
                {copiedPlan ? 'Copied!' : 'Copy Plan'}
              </button>
            </div>
          </div>

          {/* Plan Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Planned Entry Zone</span>
              <p className="font-mono tabular-nums font-semibold text-slate-100 text-sm mt-1">
                ${verdict.plan.entryZone[0].toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <span className="text-[10px] text-slate-400">to ${verdict.plan.entryZone[1].toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            </div>

            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Stop Loss (SL)</span>
              <p className="font-mono tabular-nums font-semibold text-rose-400 text-sm mt-1">
                ${verdict.plan.sl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <span className="text-[10px] text-rose-400">-{verdict.plan.slDistancePts.toLocaleString()} pts ({verdict.plan.slDistanceAtr} ATR)</span>
            </div>

            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Target 1 (TP1)</span>
              <p className="font-mono tabular-nums font-semibold text-slate-200 text-sm mt-1">
                ${verdict.plan.tp1.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">+{verdict.plan.tp1Pts.toLocaleString()} pts (1:{verdict.plan.rrTp1})</span>
            </div>

            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Target 2 (TP2)</span>
              <p className="font-mono tabular-nums font-semibold text-slate-200 text-sm mt-1">
                ${verdict.plan.tp2.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">+{verdict.plan.tp2Pts.toLocaleString()} pts (1:{verdict.plan.rrTp2})</span>
            </div>

            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Target 3 (TP3 Band)</span>
              <p className="font-mono tabular-nums font-semibold text-emerald-400 text-sm mt-1">
                ${verdict.plan.tp3.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">+{verdict.plan.tp3Pts.toLocaleString()} pts (1:{verdict.plan.rrTp3})</span>
            </div>

            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Remaining Room</span>
              <p className="font-mono tabular-nums font-semibold text-[#5b8cff] text-sm mt-1">
                {verdict.plan.remainingRoomR}R
              </p>
              <span className="text-[10px] text-slate-400">{verdict.plan.remainingRoomR >= 1.5 ? 'Room Valid (>= 1.5R)' : 'Extended (< 1.5R)'}</span>
            </div>
          </div>

          {/* Trade Management Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs pt-1">
            <div className="bg-[#1a2030] p-2.5 rounded-lg border border-white/10 space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-300 block">TP1 Management (40%)</span>
              <p className="text-slate-400 text-xs">{verdict.plan.management.tp1Rule}</p>
            </div>
            <div className="bg-[#1a2030] p-2.5 rounded-lg border border-white/10 space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-300 block">TP2 Management (30%)</span>
              <p className="text-slate-400 text-xs">{verdict.plan.management.tp2Rule}</p>
            </div>
            <div className="bg-[#1a2030] p-2.5 rounded-lg border border-white/10 space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-300 block">TP3 Runner (30%)</span>
              <p className="text-slate-400 text-xs">{verdict.plan.management.tp3Rule}</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-0.5">
            <b>Target Band Note:</b> {verdict.plan.targetBandNote}
          </p>
        </div>
      )}

      {/* ────────────────── 5. CONDITIONAL PLANS (ALWAYS PUBLISHED EVEN IN WAIT) ────────────────── */}
      {isWait && (
        <div className="rounded-xl border border-white/10 bg-[#131822] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#e8b04a]" />
              <span>Conditional Setup Plan (Waiting for Edge / Trigger)</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 font-mono">
              Reason: {verdict.reasonCode}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            <b>Exact Reason:</b> {verdict.reasonHinglish}
          </p>
          <p className="text-xs text-slate-400">
            <b>Kya Chahiye (Next Trigger):</b> {verdict.whatIsNeededNext}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide block">SHORT Branch Conditional Order</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                If 15m candle closes below support with volume surge → Limit order at breakdown retest zone, SL above breakout candle, TP1 at nearest pool, TP3 within {TARGET_BAND_PRESETS[verdict.asset]?.minPoints || 2500} pts band.
              </p>
            </div>
            <div className="bg-[#1a2030] p-3 rounded-lg border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide block">LONG Branch Conditional Order</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                If price sweeps key liquidity pool and 15m candle reclaims with CHoCH → Limit order on retest of CHoCH origin OB, SL below sweep low, TP1 at range mid, TP3 at HTF supply.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
