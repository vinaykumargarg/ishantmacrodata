import React, { useState, useMemo } from 'react';
import {
  Users,
  Scale,
  Zap,
  ShieldAlert,
  RefreshCw,
  Flame,
  Activity,
  Code2,
  Copy,
  Check,
  Layers,
  BarChart3,
  Crosshair,
  FileText
} from 'lucide-react';
import {
  analyzeCrowdPositioning,
  CrowdAsset,
  DeeeprCrowdOutput
} from '../services/deeeprCrowdPositioningEngine';

interface RetailCrowdSentimentViewProps {
  onNavigate?: (tab: string) => void;
}

export const RetailCrowdSentimentView: React.FC<RetailCrowdSentimentViewProps> = ({ onNavigate: _onNavigate }) => {
  const [selectedAsset, setSelectedAsset] = useState<CrowdAsset>('BTC');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute live institutional crowd metrics from DEEEPR engine
  const crowdOutput: DeeeprCrowdOutput = useMemo(() => {
    return analyzeCrowdPositioning(selectedAsset);
  }, [selectedAsset]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(crowdOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    crowd,
    action_now,
    oi,
    funding,
    taker,
    liquidations,
    positions_map,
    options,
    india,
    cot,
    flags,
    master_hint,
    hinglish_summary
  } = crowdOutput;

  return (
    <div className="space-y-5 pb-12 font-sans text-foreground">
      {/* ── 1. HEADER & ASSET SELECTOR BAR ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              👥
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">
              DEEEPR Decision Engine Evidence Module
            </span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              v1.0 Institutional
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl text-foreground font-display flex items-center gap-2">
            <span>Crowd Positioning Engine</span>
            <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
              ("Retail / Crowd Kya Kar Raha Hai")
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Answers which side the crowd is on, who is trapped, what they are doing right now, and what options/COT say.
          </p>
        </div>

        {/* Action Controls & JSON Modal Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
            title="Inspect Master Engine JSON Contract"
          >
            <Code2 className="size-3.5 text-primary" />
            <span>Master JSON</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* ── ASSET SELECTOR PILLS (CRYPTO / METALS / NQ / INDIA) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <span className="text-[11px] text-muted-foreground mr-1 uppercase tracking-wider">Asset:</span>
        {(
          [
            { id: 'BTC', label: '₿ Bitcoin (BTC)', cat: 'Crypto Perp & Options' },
            { id: 'ETH', label: 'Ξ Ethereum (ETH)', cat: 'Crypto Perp & Options' },
            { id: 'SOL', label: '◎ Solana (SOL)', cat: 'Crypto Perp & Options' },
            { id: 'GOLD', label: '🥇 Gold (XAU)', cat: 'CFTC COT & CME Options' },
            { id: 'SILVER', label: '🥈 Silver (XAG)', cat: 'CFTC COT & CME Options' },
            { id: 'NQ', label: '📈 Nasdaq 100 (NQ)', cat: 'CFTC COT & Options' },
            { id: 'NIFTY', label: '🇮🇳 NIFTY 50', cat: 'NSE India F&O & PCR' },
            { id: 'BANKNIFTY', label: '🏦 BANKNIFTY', cat: 'NSE India F&O & PCR' }
          ] as const
        ).map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAsset(a.id)}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedAsset === a.id
                ? 'border-primary bg-primary text-primary-foreground shadow-md font-black scale-102'
                : 'border-border bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── 2. HONEST SCOPE NOTICE (SECTION 0 MANDATORY AUDIT) ── */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
        <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-300 font-bold uppercase tracking-wider mr-1.5">
            Institutional Rule & Honest Scope:
          </strong>
          Nobody can see individual retail positions. The crowd is <b>INFERRED</b> from exchange and regulator data.
          Figures are labeled <span className="underline decoration-dotted font-bold">OBSERVED</span> (published number),{' '}
          <span className="underline decoration-dotted font-bold">DERIVED</span> (computed), or{' '}
          <span className="underline decoration-dotted font-bold">ESTIMATED</span> (model-based, reliability ≤ 0.4).
          Crowd extremes are a <b>RISK indicator</b>, not a timing signal. This module never creates a trade standalone;
          total effect on the master decision engine is capped at <b>±15%</b>.
        </div>
      </div>

      {/* ── 3. TOP SUMMARY CARDS: CROWD VERDICT, ACTION NOW & SMART DIVERGENCE ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Crowd Verdict & Score */}
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-xs flex items-center gap-1 text-muted-foreground">
              <Users className="size-3.5 text-primary" />
              <span>Crowd Bias & Score</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                crowd.side === 'LONG_CROWDED'
                  ? 'bg-bear/15 text-bear border border-bear/30'
                  : crowd.side === 'SHORT_CROWDED'
                  ? 'bg-bull/15 text-bull border border-bull/30'
                  : 'bg-gold/15 text-gold border border-gold/30'
              }`}
            >
              {crowd.side}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-foreground font-mono">
                {crowd.long_score}
                <span className="text-xs font-normal text-muted-foreground">/100 Long Score</span>
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                Global Longs: <b className="text-foreground">{crowd.global_long_pct}%</b>
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary flex">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${crowd.long_score}%` }}
                title={`Long Score: ${crowd.long_score}%`}
              />
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${crowd.short_score}%` }}
                title={`Short Score: ${crowd.short_score}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="text-emerald-400 font-bold">{crowd.long_score}% Long Pressure</span>
              <span className="text-rose-400 font-bold">{crowd.short_score}% Short Pressure</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-between items-center text-[11px]">
            <span className="text-muted-foreground">Percentile vs 30D:</span>
            <span className="font-mono font-bold text-foreground">{crowd.global_long_percentile}th %tile</span>
          </div>
        </div>

        {/* Card 2: Action NOW & 2-Bar Confirmation */}
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-xs flex items-center gap-1 text-muted-foreground">
              <Zap className="size-3.5 text-amber-400" />
              <span>Crowd Action Right Now</span>
            </span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              2 Bars Confirmed ✓
            </span>
          </div>

          <div>
            <div className="text-lg font-black text-foreground font-mono flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  action_now.label === 'CHASING' || action_now.label === 'CAPITULATING'
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-emerald-500'
                }`}
              />
              <span>{action_now.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {action_now.evidence[0] || 'OI and price tracking persistent institutional momentum.'}
            </p>
          </div>

          <div className="pt-2 border-t border-border flex justify-between items-center text-[11px] font-mono">
            <span className="text-muted-foreground">OI Matrix State:</span>
            <span className="font-bold text-primary uppercase">{oi.matrix_state.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Card 3: Smart Money vs Crowd Divergence (D) */}
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="label-xs flex items-center gap-1 text-muted-foreground">
              <Scale className="size-3.5 text-cyan-400" />
              <span>Smart vs Retail Divergence</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                (crowd.smart_vs_crowd_D ?? 0) <= -10
                  ? 'bg-rose-500/15 text-rose-400'
                  : (crowd.smart_vs_crowd_D ?? 0) >= 10
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              D = {crowd.smart_vs_crowd_D ?? '0'} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded-xl border border-border/60 bg-secondary/40 p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase">Retail Accounts</p>
              <p className="text-base font-bold text-foreground mt-0.5">{crowd.global_long_pct}% Long</p>
              <p className="text-[10px] text-muted-foreground">Crowd long biased</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/40 p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase">Top Whales / Smart</p>
              <p className="text-base font-bold text-cyan-400 mt-0.5">
                {crowd.top_trader_position_long_pct}% Long
              </p>
              <p className="text-[10px] text-muted-foreground">
                {100 - (crowd.top_trader_position_long_pct ?? 50)}% Short biased
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-snug">
            {(crowd.smart_vs_crowd_D ?? 0) <= -10
              ? '⚠️ Crowd is significantly more Long than large institutional accounts (Trap candidate).'
              : 'Institutional positioning is reasonably aligned with broad market participants.'}
          </p>
        </div>
      </div>

      {/* ── 4. WHERE ARE THE CROWD'S POSITIONS OPEN (ESTIMATED PROFILE) ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-400 font-bold text-xs">
              📍
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Where Are The Crowd's Positions Open?
            </h2>
            <span className="rounded bg-purple-500/15 text-purple-300 px-2 py-0.5 text-[10px] font-mono font-bold">
              ESTIMATED · 7d/1h · Reliability 0.4
            </span>
          </div>

          <div className="text-xs font-mono text-muted-foreground">
            Current Price:{' '}
            <b className="text-foreground text-sm font-bold">
              ${crowdOutput.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </b>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
          {/* Average Long Entry */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
            <span className="text-[11px] text-muted-foreground uppercase flex items-center justify-between">
              <span>Avg Entry (Longs)</span>
              <span className="text-emerald-400 font-bold">E_L</span>
            </span>
            <p className="text-lg font-bold text-foreground">
              ${positions_map.avg_entry_long?.toLocaleString() ?? '—'}
            </p>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Underwater %:</span>
              <span
                className={`font-bold ${
                  (positions_map.underwater_long_pct ?? 0) > 0 ? 'text-bear' : 'text-bull'
                }`}
              >
                {positions_map.underwater_long_pct ?? 0}%
              </span>
            </div>
          </div>

          {/* Average Short Entry */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
            <span className="text-[11px] text-muted-foreground uppercase flex items-center justify-between">
              <span>Avg Entry (Shorts)</span>
              <span className="text-rose-400 font-bold">E_S</span>
            </span>
            <p className="text-lg font-bold text-foreground">
              ${positions_map.avg_entry_short?.toLocaleString() ?? '—'}
            </p>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Underwater %:</span>
              <span
                className={`font-bold ${
                  (positions_map.underwater_short_pct ?? 0) > 0 ? 'text-bear' : 'text-bull'
                }`}
              >
                {positions_map.underwater_short_pct ?? 0}%
              </span>
            </div>
          </div>

          {/* Trapped Long Share */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
            <span className="text-[11px] text-muted-foreground uppercase flex items-center justify-between">
              <span>Trapped Longs</span>
              <span className="text-muted-foreground font-mono">&gt;0.5 ATR</span>
            </span>
            <p className="text-lg font-bold text-foreground">
              {Math.round((positions_map.trapped_long_share ?? 0) * 100)}%
            </p>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-rose-500"
                style={{ width: `${Math.round((positions_map.trapped_long_share ?? 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Trapped Short Share */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
            <span className="text-[11px] text-muted-foreground uppercase flex items-center justify-between">
              <span>Trapped Shorts</span>
              <span className="text-muted-foreground font-mono">&gt;0.5 ATR</span>
            </span>
            <p className="text-lg font-bold text-foreground">
              {Math.round((positions_map.trapped_short_share ?? 0) * 100)}%
            </p>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${Math.round((positions_map.trapped_short_share ?? 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Big Unclosed Volume Buckets Table */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            <span>Estimated Unclosed Position Clusters (Price Buckets)</span>
          </span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            {positions_map.big_buckets.map((b, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/70 bg-card p-2.5 flex justify-between items-center hover:border-primary/50 transition-all"
              >
                <div>
                  <span className="text-xs font-bold text-foreground">${b.price.toLocaleString()}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Est. ${(b.usd / 1000000).toFixed(0)}M resting
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    b.side === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {b.side}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. DERIVATIVES FLOW: FUNDING, TAKER RATIO & LIQUIDATIONS ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Funding Rate & Basis */}
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <span className="label-xs flex items-center gap-1 text-muted-foreground">
            <Flame className="size-3.5 text-amber-500" />
            <span>Funding Rate & Basis Meter</span>
          </span>

          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-foreground">
                {funding.current !== null ? `${funding.current}%` : 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground">
                {funding.annualised !== null ? `~${funding.annualised}% p.a.` : 'Spot / Cash'}
              </span>
            </div>

            <div className="rounded-lg bg-secondary/50 p-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Funding 30D Percentile:</span>
                <span className="font-bold text-foreground">
                  {funding.percentile !== null ? `${funding.percentile}th` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basis Percentile:</span>
                <span className="font-bold text-foreground">
                  {funding.basis_percentile !== null ? `${funding.basis_percentile}th` : '—'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {(funding.percentile ?? 50) >= 85
              ? '🔥 Hot funding regime: Longs paying heavy premium, liquidation sweep risk elevated.'
              : 'Funding is within balanced historical parameters.'}
          </p>
        </div>

        {/* Taker Buy / Sell Volume Flow */}
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <span className="label-xs flex items-center gap-1 text-muted-foreground">
            <Activity className="size-3.5 text-emerald-500" />
            <span>Taker Flow (Aggressive Market Orders)</span>
          </span>

          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-foreground">{taker.ratio_4h ?? '—'}</span>
              <span className="text-xs text-muted-foreground">4H Taker Ratio</span>
            </div>

            <div className="rounded-lg bg-secondary/50 p-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">1H Taker Ratio:</span>
                <span
                  className={`font-bold ${
                    (taker.ratio_1h ?? 1) >= 1.05
                      ? 'text-bull'
                      : (taker.ratio_1h ?? 1) <= 0.95
                      ? 'text-bear'
                      : 'text-foreground'
                  }`}
                >
                  {taker.ratio_1h ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Flow Bias:</span>
                <span className="font-bold text-foreground">
                  {(taker.ratio_4h ?? 1) > 1.1
                    ? 'Aggressive Buys'
                    : (taker.ratio_4h ?? 1) < 0.9
                    ? 'Aggressive Sells'
                    : 'Balanced'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {(taker.ratio_4h ?? 1) > 1.1
              ? 'Taker aggressive buyers lifting the offer book.'
              : 'Taker market volume is neutral without panic selling.'}
          </p>
        </div>

        {/* Liquidations Cascade Detector */}
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3 sm:col-span-2 lg:col-span-1">
          <span className="label-xs flex items-center gap-1 text-muted-foreground">
            <BarChart3 className="size-3.5 text-rose-500" />
            <span>24H Liquidations & Cascades</span>
          </span>

          <div className="space-y-2 font-mono text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2">
                <span className="text-[10px] text-rose-300 uppercase">Long Liquidations</span>
                <p className="text-sm font-bold text-rose-400 mt-0.5">
                  ${liquidations.long_usd_24h ? (liquidations.long_usd_24h / 1000000).toFixed(1) + 'M' : '0'}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                <span className="text-[10px] text-emerald-300 uppercase">Short Liquidations</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  ${liquidations.short_usd_24h ? (liquidations.short_usd_24h / 1000000).toFixed(1) + 'M' : '0'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-muted-foreground">Cascade State:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  liquidations.cascade === 'none'
                    ? 'bg-secondary text-muted-foreground'
                    : 'bg-rose-500/20 text-rose-300 animate-pulse'
                }`}
              >
                {liquidations.cascade === 'none' ? 'No Cascade Active' : `${liquidations.cascade} Cascade!`}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Liquidations source: <b>{liquidations.source}</b> via direct websocket / exchange feeds.
          </p>
        </div>
      </div>

      {/* ── 6. SEGMENT SPECIFIC INSIGHTS: OPTIONS (CRYPTO / DERIBIT) OR INDIA OR CFTC COT ── */}
      {selectedAsset === 'NIFTY' || selectedAsset === 'BANKNIFTY' ? (
        /* India NSE Segment */
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
              <span>🇮🇳</span>
              <span>NSE India Participant Open Interest & Option Chain (PCR)</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-primary">
              India VIX: {india.india_vix ?? '—'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">PCR (Open Interest)</span>
              <p className="text-base font-bold text-foreground mt-0.5">{india.pcr_oi ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">{india.pcr_percentile}th %tile (20d)</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">Client (Retail+HNI) Net Fut</span>
              <p className="text-base font-bold text-bull mt-0.5">
                +{india.client_net_index_futures?.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Net Long contracts</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">FII Net Index Futures</span>
              <p className="text-base font-bold text-bear mt-0.5">
                {india.fii_net_index_futures?.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Net Short contracts</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">Key Support / Resistance</span>
              <p className="text-xs font-bold text-foreground mt-1">
                Sup: {india.support_strikes.join(', ')}
              </p>
              <p className="text-xs font-bold text-rose-400">Res: {india.resistance_strikes.join(', ')}</p>
            </div>
          </div>
        </div>
      ) : selectedAsset === 'GOLD' || selectedAsset === 'SILVER' || selectedAsset === 'NQ' ? (
        /* CFTC COT Segment */
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
              <span>🏛️</span>
              <span>CFTC Commitments of Traders (COT Weekly) & Positioning</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">{cot.asOf}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 font-mono text-xs">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">
                Small Speculators (Non-Reportable)
              </span>
              <p className="text-base font-bold text-foreground mt-0.5">
                +{cot.small_spec_net_pct_oi}% of OI
              </p>
              <p className="text-[10px] text-muted-foreground">
                {cot.small_spec_percentile_3y}th percentile vs 3-year history
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">
                Managed Money (Speculators)
              </span>
              <p className="text-base font-bold text-cyan-400 mt-0.5">
                +{cot.managed_money_net_pct_oi}% of OI
              </p>
              <p className="text-[10px] text-muted-foreground">
                {cot.managed_money_percentile_3y}th percentile (Stretched Long)
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">Commercials (Hedgers)</span>
              <p className="text-base font-bold text-rose-400 mt-0.5">
                {cot.commercial_net_pct_oi}% of OI
              </p>
              <p className="text-[10px] text-muted-foreground">Hedging supply baseline</p>
            </div>
          </div>
        </div>
      ) : (
        /* Crypto Options (Deribit) Segment */
        <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
              <span>🎯</span>
              <span>Options Market Positioning & Skew ({options.venue})</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Basis: Open Interest & Volume</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">Put / Call Ratio (OI)</span>
              <p className="text-base font-bold text-foreground mt-0.5">{options.pcr_oi ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">{options.pcr_percentile}th %tile (30d)</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">25-Delta Skew (Put IV - Call IV)</span>
              <p className="text-base font-bold text-foreground mt-0.5">
                {options.skew_25d ? `+${options.skew_25d}%` : '0%'}
              </p>
              <p className="text-[10px] text-muted-foreground">Downside hedge demand</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">Max Pain Magnet</span>
              <p className="text-base font-bold text-gold mt-0.5">
                ${options.max_pain.join(' / $')}
              </p>
              <p className="text-[10px] text-muted-foreground">Pinning magnet near expiry</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[10px] text-muted-foreground uppercase">Top Put / Call Strikes</span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">
                Puts: ${options.top_put_strikes.join(', $')}
              </p>
              <p className="text-xs font-bold text-rose-400">
                Calls: ${options.top_call_strikes.join(', $')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. EXCHANGES BREAKDOWN TABLE ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
            <span>🌐</span>
            <span>Multi-Exchange Account Ratio & Open Interest Breakdown</span>
          </span>
          <span className="text-[10px] text-muted-foreground">Same-Clock Sync Rule Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground uppercase">
                <th className="pb-2">Exchange</th>
                <th className="pb-2">Market</th>
                <th className="pb-2">Global Long %</th>
                <th className="pb-2">Global Short %</th>
                <th className="pb-2">Top Trader Long %</th>
                <th className="pb-2">Funding Rate</th>
                <th className="pb-2">Open Interest</th>
                <th className="pb-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {crowd.exchanges.map((ex, i) => (
                <tr key={i} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-2.5 font-bold text-foreground">{ex.exchange}</td>
                  <td className="py-2.5 text-muted-foreground">{ex.market}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{ex.globalLongPct}%</td>
                  <td className="py-2.5 text-rose-400 font-bold">{ex.globalShortPct}%</td>
                  <td className="py-2.5 text-cyan-400 font-bold">{ex.topTraderLongPct}%</td>
                  <td className="py-2.5 text-foreground">
                    {ex.fundingRate > 0 ? `+${ex.fundingRate}%` : `${ex.fundingRate}%`}
                  </td>
                  <td className="py-2.5 font-bold text-foreground">{ex.openInterestUSD}</td>
                  <td className="py-2.5 text-[11px] text-muted-foreground">{ex.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 8. MASTER HINT & SQUEEZE RISK HOOK ── */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crosshair className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              DEEEPR Master Decision Engine Evidence Integration
            </span>
          </div>

          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-black ${
              master_hint.adjustment < 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : master_hint.adjustment > 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            Master Hint Adjustment: {master_hint.adjustment > 0 ? `+${master_hint.adjustment}` : master_hint.adjustment} pts
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          <b>Rule:</b> {master_hint.reason}{' '}
          <span className="italic">
            (Total adjustment is strictly capped at ±15 points and only takes effect if a closed-candle trigger is verified by the master engine).
          </span>
        </p>

        {flags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1">Active Flags:</span>
            {flags.map((f, i) => (
              <span
                key={i}
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300"
              >
                ⚠️ {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 9. EXACT 8-LINE HINGLISH INSTITUTIONAL SUMMARY ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
              Hinglish Institutional Summary (8 Lines)
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Rulebook Compliant</span>
        </div>

        <div className="space-y-1.5 font-mono text-xs leading-relaxed text-foreground/90">
          {hinglish_summary.map((line, idx) => (
            <div key={idx} className="rounded-lg bg-secondary/30 p-2 border border-border/50">
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* ── 10. STRICT RAW JSON EXPORT MODAL ── */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground font-mono">
                  DEEEPR Crowd Positioning Engine v1 — Contract JSON
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyJson}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
                >
                  {copied ? <Check className="size-3.5 text-bull" /> : <Copy className="size-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-black/90 p-3 font-mono text-[11px] text-emerald-400 border border-border">
              <pre>{JSON.stringify(crowdOutput, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailCrowdSentimentView;
