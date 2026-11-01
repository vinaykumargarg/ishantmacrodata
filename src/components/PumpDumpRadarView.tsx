import React, { useState, useMemo } from 'react';
import {
  Flame,
  TrendingDown,
  TrendingUp,
  Zap,
  Clock,
  ShieldAlert,
  HelpCircle,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  getDetectedMoves,
  DetectedMoveEvent,
  CauseCategory
} from '../services/pumpDumpAttributionEngine';

interface PumpDumpRadarViewProps {
  onNavigate?: (tab: string) => void;
}

export const PumpDumpRadarView: React.FC<PumpDumpRadarViewProps> = ({ onNavigate }) => {
  const [moves, setMoves] = useState<DetectedMoveEvent[]>(() => getDetectedMoves());
  const [selectedMoveId, setSelectedMoveId] = useState<string>(moves[0]?.id || '');
  const [filterAsset, setFilterAsset] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const selectedMove = useMemo(() => {
    return moves.find((m) => m.id === selectedMoveId) || moves[0];
  }, [moves, selectedMoveId]);

  const filteredMoves = useMemo(() => {
    if (filterAsset === 'ALL') return moves;
    return moves.filter((m) => m.asset === filterAsset);
  }, [moves, filterAsset]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setMoves(getDetectedMoves());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-5 pb-20 font-sans text-foreground">
      {/* ── 1. HEADER ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 text-xs font-bold">
                ⚡
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                INSTITUTIONAL MOVE ATTRIBUTION ENGINE (EVIDENCE ONLY)
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted-foreground">
                v1.0 Pro
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display mt-1">
              Pump / Dump Radar: "Kyun Aaya?"
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              When Bitcoin, Gold, or Oil moves suddenly: discovers <b>KITNA</b> move hua, <b>KAB</b> shuru hua (t0 onset), <b>KYUN</b> hua (data release, news, liquidation cascade, yield shock), and <b>AB AAGE KYA</b>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>Scan Moves</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/50 text-xs font-mono">
          <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1">Filter Asset:</span>
          {['ALL', 'BTC', 'GOLD', 'OIL'].map((ast) => (
            <button
              key={ast}
              onClick={() => setFilterAsset(ast)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterAsset === ast
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {ast}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. LIVE DETECTED MOVES FEED CARDS ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {filteredMoves.map((m) => {
          const isSelected = selectedMove?.id === m.id;
          const isPump = m.type === 'PUMP';

          return (
            <div
              key={m.id}
              onClick={() => setSelectedMoveId(m.id)}
              className={`group cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{m.assetName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                      isPump
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {m.type} {m.sizePct > 0 ? `+${m.sizePct}%` : `${m.sizePct}%`}
                  </span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    m.status === 'ACTIVE'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : m.status === 'EXHAUSTING'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Size / ATR</span>
                  <p className="text-base font-black text-foreground">
                    {m.sizePts > 0 ? `+${m.sizePts}` : m.sizePts} pts ({m.atrMultiple}x ATR)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase">Onset t0</span>
                  <p className="text-xs font-bold text-primary">{m.t0Ist}</p>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground font-sans line-clamp-2 leading-relaxed">
                {m.primaryCause.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── 3. DETAILED ATTRIBUTION BREAKDOWN PANEL ── */}
      {selectedMove && (
        <div className="space-y-4">
          {/* Hero Banner: Plain Hinglish One-Line Verdict */}
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 sm:p-5 shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Zap className="size-4 text-amber-400" />
                <span>PRIMARY ATTRIBUTION SUMMARY</span>
              </span>
              <span className="rounded bg-primary/20 px-2 py-0.5 font-bold text-foreground">
                Confidence: {selectedMove.primaryCause.confidence}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground font-sans leading-snug">
              📢 {selectedMove.oneLineSummaryHinglish}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left Column: Causes & Cross-Asset (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Ranked Candidate Causes Card */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Ranked Causal Factors & Triggers
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Time Alignment & Trust Weighted
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Primary Trigger */}
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground uppercase font-mono">
                          PRIMARY TRIGGER ({selectedMove.primaryCause.weightPct}%)
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          Seen: {selectedMove.primaryCause.firstSeenIst}
                        </span>
                      </div>
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                        {selectedMove.primaryCause.trust}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground font-sans">
                      {selectedMove.primaryCause.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      💡 <b>Kyun Hua:</b> {selectedMove.primaryCause.explanationHinglish}
                    </p>

                    <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
                      Source: {selectedMove.primaryCause.source}
                    </div>
                  </div>

                  {/* Contributing Factors */}
                  {selectedMove.contributingCauses.map((c, i) => (
                    <div key={i} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-muted-foreground font-bold">
                          CONTRIBUTING FACTOR ({c.weightPct}%)
                        </span>
                        <span className="text-muted-foreground">{c.firstSeenIst}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground">{c.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.explanationHinglish}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Asset Reaction & Lead/Lag Matrix */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Activity className="size-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Cross-Asset Synchronization & Lead/Lag Matrix
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    1-Min Return Cross-Correlation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {selectedMove.crossAssetReactions.map((ast, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-secondary/40 border border-border space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">{ast.asset}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            ast.leadLag === 'LEADER'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {ast.leadLag}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-black ${
                          ast.movePct > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {ast.movePct > 0 ? `+${ast.movePct}%` : `${ast.movePct}%`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Explains {ast.contributionPct}% of move</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Mechanics & "AB KYA?" (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Derivatives Mechanics Card */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className="size-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Derivatives & Order Flow Mechanics
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Real-Time WS</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-muted-foreground">Long Liquidations:</span>
                    <span className="font-bold text-rose-400">{selectedMove.mechanics.longLiquidationsUSD}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-muted-foreground">Short Liquidations:</span>
                    <span className="font-bold text-emerald-400">{selectedMove.mechanics.shortLiquidationsUSD}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-muted-foreground">Open Interest Change:</span>
                    <span className="font-bold text-primary">{selectedMove.mechanics.oiChangePct}%</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-muted-foreground">Funding Rate:</span>
                    <span className="font-bold text-foreground">{selectedMove.mechanics.fundingRate}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-muted-foreground">Broken Key Level:</span>
                    <span className="font-bold text-amber-400">{selectedMove.mechanics.keyLevelBroken}</span>
                  </div>
                </div>
              </div>

              {/* "AB KYA?" Panel */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-border pb-2">
                  <Clock className="size-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    "Ab Kya?" (Move Exhaustion & Next Catalysts)
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">
                      Exhaustion Status:
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`size-2 rounded-full ${
                          selectedMove.nextSteps.exhaustionFlag ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="font-bold text-foreground">
                        {selectedMove.nextSteps.exhaustionFlag ? 'EXHAUSTION DETECTED' : 'TREND CONTINUING'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {selectedMove.nextSteps.exhaustionReason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">
                      Next Immediate Catalyst:
                    </span>
                    <p className="font-bold text-rose-400 mt-0.5 font-mono">
                      {selectedMove.nextSteps.nextImmediateCatalyst}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">
                      Key Levels To Watch:
                    </span>
                    <p className="text-[11px] text-foreground mt-0.5 font-mono">
                      {selectedMove.nextSteps.keyLevelsToWatch}
                    </p>
                  </div>
                </div>
              </div>

              {/* Historical Comparison */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Historical Base Rates (Similar {selectedMove.asset} Moves)
                </span>
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Historical Sample:</span>
                    <span className="font-bold text-foreground">n = {selectedMove.historicalComparison.similarEventsCount} events</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Typical Retracement:</span>
                    <span className="font-bold text-primary">{selectedMove.historicalComparison.typicalRetracePct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Continuation Edge:</span>
                    <span className="font-bold text-foreground">{selectedMove.historicalComparison.continuationProbability}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PumpDumpRadarView;

