/**
 * VERDICT BADGE — SINGLE SOURCE OF TRUTH UI COMPONENT
 *
 * Implements Section 2 of DEEEPR Enforcement Rules:
 * - One shared <VerdictBadge /> across all pages and modules.
 * - Displays Master Arbiter state, Market Phase (P1–P9), and Horizon Matrix.
 * - Renders RUNTIME INCONSISTENCY banner if any conflict is detected.
 */

import React, { useState, useEffect } from 'react';
import {
  masterVerdictStore,
  MasterVerdictObject,
  HorizonType,
  formatPriceWithDollar
} from '../services/masterVerdictStore';

interface VerdictBadgeProps {
  symbol?: string;
  horizon?: HorizonType;
  compact?: boolean;
  showHorizonSelector?: boolean;
  showPhase?: boolean;
  showReason?: boolean;
  showInconsistencyBanner?: boolean;
  className?: string;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  symbol = 'BTCUSDT',
  horizon,
  compact = false,
  showHorizonSelector = true,
  showPhase = true,
  showReason = true,
  showInconsistencyBanner = true,
  className = ''
}) => {
  const [verdict, setVerdict] = useState<MasterVerdictObject>(() =>
    masterVerdictStore.getVerdict(symbol)
  );

  useEffect(() => {
    setVerdict(masterVerdictStore.getVerdict(symbol));
    const unsub = masterVerdictStore.subscribe(symbol, (updated) => {
      setVerdict({ ...updated });
    });
    return unsub;
  }, [symbol]);

  const activeHorizon = horizon || verdict.selectedHorizon || 'INTRADAY';
  const horizonVerdict = verdict.horizonMatrix[activeHorizon] || verdict.horizonMatrix.INTRADAY;
  const isWait = horizonVerdict.state === 'WAIT';
  const isLong = horizonVerdict.side === 'LONG';
  const isShort = horizonVerdict.side === 'SHORT';

  const stateTheme = isLong
    ? {
        bg: 'bg-emerald-950/60',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        pill: 'bg-emerald-500 text-slate-950 font-black',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
      }
    : isShort
    ? {
        bg: 'bg-rose-950/60',
        border: 'border-rose-500/50',
        text: 'text-rose-400',
        pill: 'bg-rose-500 text-slate-950 font-black',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]'
      }
    : {
        bg: 'bg-amber-950/50',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        pill: 'bg-amber-500 text-slate-950 font-black',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]'
      };

  const signalAgeSec = Math.max(0, Math.round((Date.now() - verdict.updatedAt) / 1000));
  const ageDisplay =
    signalAgeSec < 60
      ? `${signalAgeSec}s ago`
      : `${Math.round(signalAgeSec / 60)}m ago`;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${stateTheme.border} ${stateTheme.bg} ${className}`}>
        <span className={`px-2 py-0.5 rounded text-xs tracking-wider uppercase ${stateTheme.pill}`}>
          {horizonVerdict.state}
        </span>
        <span className="text-xs font-semibold text-slate-300">
          [{activeHorizon}]
        </span>
        {verdict.phase && (
          <span className="text-xs text-amber-300/80 font-mono">
            {verdict.phase.code}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ⚠️ Runtime Inconsistency Assertion Banner */}
      {showInconsistencyBanner && verdict.hasInconsistency && (
        <div className="rounded-xl border border-rose-500 bg-rose-950/90 p-3 text-rose-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <span className="font-bold">ENGINE_INCONSISTENCY:</span>
            <span>{verdict.inconsistencyMessage || 'Conflicting module signal detected. Master Arbiter overrides all.'}</span>
          </div>
          <span className="font-mono text-xs bg-rose-900 px-2 py-0.5 rounded">R1 SINGLE ARBITER RULE</span>
        </div>
      )}

      {/* Main Verdict Badge Container */}
      <div className={`rounded-2xl border ${stateTheme.border} ${stateTheme.bg} p-4 sm:p-5 relative overflow-hidden ${stateTheme.glow}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Verdict State + Horizon */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-3 py-1 rounded-md text-sm sm:text-base tracking-wider uppercase ${stateTheme.pill}`}>
                {horizonVerdict.state}
              </span>

              <span className="text-xs sm:text-sm font-bold text-slate-200 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">
                HORIZON: {activeHorizon} ({horizonVerdict.timeframeLabel})
              </span>

              {verdict.phase && showPhase && (
                <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-600/50 flex items-center gap-1.5">
                  <span>[{verdict.phase.code}]</span>
                  <span>{verdict.phase.label}</span>
                </span>
              )}

              <span className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                Updated {ageDisplay}
              </span>
            </div>

            {/* Headline Action */}
            <div className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>🎯 Action:</span>
              <span className={stateTheme.text}>{horizonVerdict.headlineAction}</span>
            </div>

            {/* Specific WAIT Details if in WAIT state */}
            {isWait && showReason && verdict.waitDetails && (
              <div className="mt-2 text-xs text-amber-200/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">⏳ WHY WAIT:</span>
                  <span className="font-mono text-[11px] text-amber-400">Timeout: {verdict.waitDetails.timeoutMinutes}m</span>
                </div>
                <p>{verdict.waitDetails.reason}</p>
                <p className="text-slate-300 font-mono text-[11px]">
                  Next Trigger: {verdict.waitDetails.nextCondition} (Level: {formatPriceWithDollar(verdict.waitDetails.nextLevel)})
                </p>
              </div>
            )}
          </div>

          {/* Right: Horizon Switcher & Score */}
          <div className="flex flex-col items-end gap-2.5">
            {showHorizonSelector && (
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-xs">
                {(['SCALP', 'INTRADAY', 'SWING'] as HorizonType[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => masterVerdictStore.setSelectedHorizon(h)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      verdict.selectedHorizon === h
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {horizonVerdict.confidence}% ({verdict.scores.confidenceBasis})
              </span>
              <span className="text-slate-400">R:R:</span>
              <span className="font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                1 : {horizonVerdict.rr.toFixed(1)}+
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
