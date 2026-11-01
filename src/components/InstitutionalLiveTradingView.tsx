import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Activity,
  Zap,
  Layers,
  BarChart3,
  Scale,
  Clock,
  RefreshCw,
  Info,
  DollarSign,
  BookmarkPlus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Target
} from 'lucide-react';
import { sharedQuoteStore } from '../services/sharedQuoteStore';
import {
  computeLiveInstitutionalAnalysis,
  InstitutionalLiveAnalysis
} from '../services/institutionalLiveAnalysisEngine';

interface InstitutionalLiveTradingViewProps {
  onNavigate?: (tab: string) => void;
}

export const InstitutionalLiveTradingView: React.FC<InstitutionalLiveTradingViewProps> = ({ onNavigate }) => {
  const [selectedAsset, setSelectedAsset] = useState<'BTCUSDT' | 'XAUUSD'>('XAUUSD');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Subscribe to live price store
  const [goldQuote, setGoldQuote] = useState(() => sharedQuoteStore.getQuote('XAUUSD'));
  const [btcQuote, setBtcQuote] = useState(() => sharedQuoteStore.getQuote('BTCUSDT'));

  useEffect(() => {
    const unsub = sharedQuoteStore.subscribe((q) => {
      if (q.symbol === 'XAUUSD') setGoldQuote(q);
      if (q.symbol === 'BTCUSDT') setBtcQuote(q);
    });
    return () => unsub();
  }, []);

  const currentPrice = selectedAsset === 'XAUUSD' ? goldQuote.price : btcQuote.price;

  // Compute Live Institutional Analysis
  const data: InstitutionalLiveAnalysis = useMemo(() => {
    return computeLiveInstitutionalAnalysis(selectedAsset, currentPrice);
  }, [selectedAsset, currentPrice]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-5 pb-20 font-sans text-foreground">
      {/* ── 1. HEADER & DISCIPLINARY MISSION BAR ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                🏛️
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                IITIAN-INSPIRED ORDERFLOW + PRICE ACTION + LIQUIDITY TRADING FRAMEWORK
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted-foreground">
                Live Discretionary Workflow
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display mt-1">
              Institutional Live Trading Analysis Engine
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Orderflow, Liquidity Sweeps, Market Structure Shifts, CVD Absorption & Macro Confluence for Gold and Bitcoin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Asset Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 p-1">
              <button
                onClick={() => setSelectedAsset('XAUUSD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedAsset === 'XAUUSD'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🥇 Gold (XAUUSD)</span>
                <span className="font-mono text-[11px] font-black">${goldQuote.price.toFixed(2)}</span>
              </button>

              <button
                onClick={() => setSelectedAsset('BTCUSDT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedAsset === 'BTCUSDT'
                    ? 'bg-primary/20 text-primary border border-primary/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>₿ Bitcoin (BTCUSDT)</span>
                <span className="font-mono text-[11px] font-black">${btcQuote.price.toLocaleString()}</span>
              </button>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>Sync Feed</span>
            </button>
          </div>
        </div>

        {/* Live Data Provenance Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/30 border border-border/50 px-3 py-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-foreground font-bold">{data.dataStatus} FEED:</span>
            <span>{data.dataSource}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Spread: <b className="text-foreground">{data.spread}</b></span>
            <span>Session: <b className="text-primary">{data.marketSession}</b></span>
            <span>Updated: <b className="text-foreground">{data.lastUpdateTimestamp}</b></span>
          </div>
        </div>
      </div>

      {/* ── 2. EXACT DASHBOARD OUTPUT SPECIFIED IN MASTER PROMPT (SECTION 12) ── */}
      <div className="rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-lg space-y-4">
        {/* Terminal Header Info */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs border-b border-border/70 pb-4">
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase">MARKET & PRICE</span>
            <p className="text-lg font-black text-foreground mt-0.5">
              {data.market}: ${data.currentPrice.toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase">1D & 4H TREND</span>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              1D {data.structure.d1Trend} • 4H {data.structure.h4Trend}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase">1H & 15M CONFIRMATION</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              1H {data.structure.h1Structure} • 15M {data.structure.m15Confirmation}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase">FINAL DECISION ARBITER</span>
            <p
              className={`text-lg font-black mt-0.5 ${
                data.decision === 'LONG'
                  ? 'text-emerald-400'
                  : data.decision === 'SHORT'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              VERDICT: {data.decision}
            </p>
          </div>
        </div>

        {/* Section A: Liquidity Breakdown */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-amber-500" />
              <span>LIQUIDITY MAP:</span>
            </span>
            <span className="text-muted-foreground font-normal">
              Vulnerable Side: <b className="text-foreground">{data.liquidity.vulnerableSide}</b>
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 font-mono text-xs">
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px] uppercase">Buy-Side (BSL):</span>
              <p className="font-bold text-foreground mt-0.5">{data.liquidity.buySide}</p>
            </div>
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px] uppercase">Sell-Side (SSL):</span>
              <p className="font-bold text-foreground mt-0.5">{data.liquidity.sellSide}</p>
            </div>
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px] uppercase">Nearest Liquidity Target:</span>
              <p className="font-bold text-emerald-400 mt-0.5">{data.liquidity.nearestTarget}</p>
            </div>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground pt-1">
            <b>Last Confirmed Sweep:</b> {data.liquidity.lastConfirmedSweep}
          </p>
        </div>

        {/* Section B: Orderflow & Footprint Delta */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <Activity className="size-3.5 text-cyan-400" />
              <span>ORDERFLOW & FOOTPRINT DELTA:</span>
            </span>
            <span className="text-emerald-400 font-normal">
              Controlling: <b>{data.orderflow.controllingSide}</b>
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-5 font-mono text-xs">
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px]">CVD:</span>
              <p className="font-bold text-foreground mt-0.5">{data.orderflow.cvd}</p>
            </div>
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px]">Delta:</span>
              <p className="font-bold text-emerald-400 mt-0.5">{data.orderflow.delta}</p>
            </div>
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px]">Absorption:</span>
              <p className="font-bold text-foreground mt-0.5">{data.orderflow.absorption}</p>
            </div>
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px]">Volume:</span>
              <p className="font-bold text-foreground mt-0.5">{data.orderflow.volume}</p>
            </div>
            <div className="p-2 rounded bg-card/60 border border-border/60">
              <span className="text-muted-foreground text-[10px]">Open Interest (OI):</span>
              <p className="font-bold text-primary mt-0.5">{data.orderflow.oi}</p>
            </div>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground pt-1">
            <b>Iceberg Evidence:</b> {data.orderflow.icebergEvidence}
          </p>
        </div>

        {/* Section C: Institutional Setup & Zones */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary">
            <Target className="size-3.5 text-emerald-400" />
            <span>INSTITUTIONAL SETUP:</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-card/60 border border-border/60 space-y-1">
              <span className="text-muted-foreground text-[10px]">Setup Type:</span>
              <p className="font-bold text-foreground">{data.setup.typeName}</p>
              <span className="text-muted-foreground text-[10px]">Important Zone:</span>
              <p className="font-bold text-primary">{data.setup.importantZone}</p>
            </div>
            <div className="p-2.5 rounded bg-card/60 border border-border/60 space-y-1">
              <span className="text-muted-foreground text-[10px]">Entry Confirmation:</span>
              <p className="font-bold text-emerald-400">{data.setup.confirmationTrigger}</p>
              <span className="text-muted-foreground text-[10px]">Setup Invalidation:</span>
              <p className="font-bold text-rose-400">{data.setup.invalidationTrigger}</p>
            </div>
          </div>
        </div>

        {/* Section D: Trade Levels & Real RRR */}
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-primary uppercase">EXECUTION LEVELS & RISK-REWARD:</span>
            <span className="rounded bg-primary/20 px-2 py-0.5 font-bold text-foreground">
              Confidence: {data.confidenceScore}% ({data.confidenceBadge})
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">ENTRY</span>
              <p className="text-base font-black text-foreground mt-0.5">${data.entry.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <span className="text-[10px] text-rose-300 uppercase font-bold">STOP LOSS</span>
              <p className="text-base font-black text-rose-400 mt-0.5">${data.stopLoss.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">TP 1</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">${data.tp1.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">TP 2</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">${data.tp2.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">TP 3</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">${data.tp3.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">RISK-REWARD</span>
              <p className="text-base font-black text-primary mt-0.5">{data.riskRewardRatio}</p>
            </div>
          </div>
        </div>

        {/* Section E: Simple Hindi Reason */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              📢 REASON (Simple Hindi Market Explanation):
            </span>
          </div>
          <p className="text-xs sm:text-sm font-sans text-foreground/95">
            {data.simpleHindiReason}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalLiveTradingView;
