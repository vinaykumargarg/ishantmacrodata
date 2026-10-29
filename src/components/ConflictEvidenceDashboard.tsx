/**
 * CONFLICT & EVIDENCE DASHBOARD — TRANSPARENT MULTI-MODULE AUDIT
 *
 * Implements Section 7 of DEEEPR Enforcement Rules:
 * Shows Master Verdict, Horizon Matrix, Market Phase, and all sub-modules'
 * evidence split into Supporting vs Opposing vs Neutral columns.
 */

import React, { useState, useEffect } from 'react';
import {
  masterVerdictStore,
  MasterVerdictObject,
  ModuleEvidenceItem,
  formatPriceWithDollar
} from '../services/masterVerdictStore';

interface ConflictEvidenceDashboardProps {
  symbol?: string;
  className?: string;
}

export const ConflictEvidenceDashboard: React.FC<ConflictEvidenceDashboardProps> = ({
  symbol = 'BTCUSDT',
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

  const activeHorizon = verdict.selectedHorizon || 'INTRADAY';
  const horizonVerdict = verdict.horizonMatrix[activeHorizon] || verdict.horizonMatrix.INTRADAY;
  const targetSide = horizonVerdict.side;

  const evidenceList: ModuleEvidenceItem[] = Object.values(verdict.evidence || {});

  // Group evidence into Supporting, Opposing, Neutral
  const supporting: ModuleEvidenceItem[] = [];
  const opposing: ModuleEvidenceItem[] = [];
  const neutral: ModuleEvidenceItem[] = [];

  for (const item of evidenceList) {
    if (targetSide === 'NONE') {
      neutral.push(item);
    } else if (item.lean === 'neutral') {
      neutral.push(item);
    } else if (
      (targetSide === 'LONG' && item.lean === 'long') ||
      (targetSide === 'SHORT' && item.lean === 'short')
    ) {
      supporting.push(item);
    } else {
      opposing.push(item);
    }
  }

  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-900/90 p-5 space-y-4 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>⚖️ Conflict & Evidence Audit Dashboard</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
              SINGLE ARBITER v5
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit of all 15 evidence feeds compared against the single Master Arbiter.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Flip Count (1H):</span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded ${verdict.isFlipRateAlert ? 'bg-rose-900/80 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
            {verdict.flipCount1h} flips {verdict.isFlipRateAlert && '⚠️ ALERT'}
          </span>
        </div>
      </div>

      {/* 3-Layer Horizon Matrix Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
        <div className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center justify-between">
          <span>📊 Horizon Matrix (Multi-Timeframe Decision Alignment)</span>
          <span className="text-[11px] text-slate-400">Default: INTRADAY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {(['SCALP', 'INTRADAY', 'SWING'] as const).map((h) => {
            const hv = verdict.horizonMatrix[h];
            const isSelected = verdict.selectedHorizon === h;
            const sideColor =
              hv.side === 'LONG'
                ? 'text-emerald-400'
                : hv.side === 'SHORT'
                ? 'text-rose-400'
                : 'text-amber-400';

            return (
              <div
                key={h}
                onClick={() => masterVerdictStore.setSelectedHorizon(h)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500/60 bg-amber-950/20 shadow-md'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">
                    {h} ({hv.timeframeLabel})
                  </span>
                  <span className={`font-black font-mono px-1.5 py-0.5 rounded text-[11px] ${
                    hv.side === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    hv.side === 'SHORT' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {hv.state}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Phase: <span className="font-mono text-amber-300">[{hv.phase.code}] {hv.phase.label}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  Action: <span className={sideColor}>{hv.headlineAction}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Column Evidence Breakdown: Supporting | Opposing | Neutral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Supporting Evidence */}
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-emerald-900/40 pb-1.5">
            <span>✅ Supporting Evidence ({supporting.length})</span>
            <span className="text-[11px] text-emerald-300 font-mono">Lean: {targetSide}</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {supporting.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">No active supporting evidence feeds recorded yet.</p>
            ) : (
              supporting.map((item, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2 rounded border border-emerald-900/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Score: {item.score}</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside">
                    {item.notes.slice(0, 2).map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Opposing Evidence */}
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 border-b border-rose-900/40 pb-1.5">
            <span>❌ Opposing / Counter-Trend ({opposing.length})</span>
            <span className="text-[11px] text-rose-300 font-mono">Risk Veto Check</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {opposing.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">No opposing evidence feeds. Confluence aligned.</p>
            ) : (
              opposing.map((item, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2 rounded border border-rose-900/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="text-[10px] text-rose-400 font-mono">Lean: {item.lean.toUpperCase()}</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside">
                    {item.notes.slice(0, 2).map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Neutral / Equilibrium Feeds */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span>⚖️ Neutral / Context Feeds ({neutral.length})</span>
            <span className="text-[11px] text-slate-400 font-mono">Equilibrium</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {neutral.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">All feeds actively leaned.</p>
            ) : (
              neutral.map((item, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2 rounded border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Neutral</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside">
                    {item.notes.slice(0, 2).map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
