import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calculator,
  BookmarkPlus,
  RefreshCw,
  Layers,
  BarChart3,
  Flame,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  HelpCircle,
  Info
} from 'lucide-react';
import { sharedQuoteStore } from '../services/sharedQuoteStore';
import {
  generatePreTradeAnalysis,
  calculatePositionRisk,
  AssetPreTradeAnalysis,
  ChecklistItem,
  ChecklistStatus,
  SavedTradeSetup
} from '../services/preTradeChecklistEngine';

interface PreTradeAnalysisViewProps {
  onNavigate?: (tab: string) => void;
}

export const PreTradeAnalysisView: React.FC<PreTradeAnalysisViewProps> = ({ onNavigate }) => {
  // 1. Asset Selector
  const [selectedAsset, setSelectedAsset] = useState<'XAUUSD' | 'BTCUSDT'>('XAUUSD');

  // Real-time prices from sharedQuoteStore
  const [goldQuote, setGoldQuote] = useState(() => sharedQuoteStore.getQuote('XAUUSD'));
  const [btcQuote, setBtcQuote] = useState(() => sharedQuoteStore.getQuote('BTCUSDT'));
  const [dxyQuote, setDxyQuote] = useState(() => sharedQuoteStore.getQuote('DXY'));

  useEffect(() => {
    const unsub = sharedQuoteStore.subscribe((q) => {
      if (q.symbol === 'XAUUSD') setGoldQuote(q);
      if (q.symbol === 'BTCUSDT') setBtcQuote(q);
      if (q.symbol === 'DXY') setDxyQuote(q);
    });
    return () => unsub();
  }, []);

  // Compute live analysis
  const currentPrice = selectedAsset === 'XAUUSD' ? goldQuote.price : btcQuote.price;
  const analysisData: AssetPreTradeAnalysis = useMemo(() => {
    return generatePreTradeAnalysis(selectedAsset, currentPrice, dxyQuote.price);
  }, [selectedAsset, currentPrice, dxyQuote.price]);

  // Interactive Checklist State (allows user override/inspection)
  const [userChecklist, setUserChecklist] = useState<ChecklistItem[]>(analysisData.checklist);

  useEffect(() => {
    setUserChecklist(analysisData.checklist);
  }, [selectedAsset, analysisData.checklist]);

  const handleStatusToggle = (id: string, newStatus: ChecklistStatus) => {
    setUserChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  // Recompute checklist score dynamically based on user checkboxes
  const liveScoring = useMemo(() => {
    const confirmedCount = userChecklist.filter((c) => c.status === 'CONFIRMED').length;
    const missingCritical = userChecklist.filter(
      (c) => c.critical && c.status !== 'CONFIRMED'
    ).length;
    const total = userChecklist.length;
    const compositeScore = Math.round((confirmedCount / total) * 100);
    const tradeApproved = missingCritical === 0 && compositeScore >= 75;

    const blockReasons: string[] = [];
    if (missingCritical > 0) {
      blockReasons.push(`${missingCritical} critical confirmation(s) pending`);
    }
    if (compositeScore < 75) {
      blockReasons.push(`Setup score ${compositeScore}% below institutional threshold (75%)`);
    }

    return {
      confirmedCount,
      missingCritical,
      total,
      compositeScore,
      tradeApproved,
      blockReasons
    };
  }, [userChecklist]);

  // 2. Risk Calculator State
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(0.5); // Default 0.5%
  const [dailyLossLimit, setDailyLossLimit] = useState<number>(2.0); // 2% daily loss cap

  const calculatedRisk = useMemo(() => {
    const plannedEntry = analysisData.tradePlan.plannedEntry;
    const stopLoss = analysisData.tradePlan.stopLoss;
    const tp1 = analysisData.tradePlan.tp1;
    const mult = selectedAsset === 'XAUUSD' ? 100 : 1; // 100 oz per gold contract or 1 BTC

    return calculatePositionRisk(accountBalance, riskPercent, plannedEntry, stopLoss, tp1, mult);
  }, [accountBalance, riskPercent, analysisData.tradePlan, selectedAsset]);

  // 3. Trade Journal Storage (Persistent in localStorage)
  const [savedTrades, setSavedTrades] = useState<SavedTradeSetup[]>(() => {
    try {
      const stored = localStorage.getItem('pre_trade_journal_setups');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  const handleSaveSetup = () => {
    const newSetup: SavedTradeSetup = {
      id: `setup-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      asset: selectedAsset,
      direction: analysisData.decision.primary,
      entry: analysisData.tradePlan.plannedEntry,
      sl: analysisData.tradePlan.stopLoss,
      tp: analysisData.tradePlan.tp1,
      rr: analysisData.tradePlan.rrTp1,
      decisionReason: analysisData.decision.lastChangeReason,
      checklistScore: liveScoring.compositeScore,
      status: 'PENDING',
      notes: `Saved via Pre-Trade Checklist Engine. Rule compliance: ${liveScoring.confirmedCount}/${liveScoring.total}`
    };

    const updated = [newSetup, ...savedTrades];
    setSavedTrades(updated);
    localStorage.setItem('pre_trade_journal_setups', JSON.stringify(updated));

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleDeleteSetup = (id: string) => {
    const updated = savedTrades.filter((s) => s.id !== id);
    setSavedTrades(updated);
    localStorage.setItem('pre_trade_journal_setups', JSON.stringify(updated));
  };

  return (
    <div className="space-y-5 pb-20 font-sans text-foreground">
      {/* ── 1. HEADER & ASSET SELECTOR ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                ✓
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                INSTITUTIONAL PRE-TRADE CHECKLIST & VALIDATION ENGINE
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                v4.0 Rulebook
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display mt-1">
              Advanced AI Pre-Trade Analysis & Checklist
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Before placing any trade: verify HTF structure, liquidity pools, SMC confirmation, macro backdrop & strict risk-to-reward.
            </p>
          </div>

          {/* Asset Selector Tabs */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-1">
            <button
              onClick={() => setSelectedAsset('XAUUSD')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAsset === 'XAUUSD'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-sm">🥇</span>
              <span>GOLD — XAUUSD</span>
              <span className="font-mono text-[11px] font-black">${goldQuote.price.toFixed(2)}</span>
            </button>

            <button
              onClick={() => setSelectedAsset('BTCUSDT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAsset === 'BTCUSDT'
                  ? 'bg-primary/20 border border-primary/40 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-sm">₿</span>
              <span>BITCOIN — BTCUSDT</span>
              <span className="font-mono text-[11px] font-black">${btcQuote.price.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. AI PRIMARY DECISION PANEL (ONE SINGLE ARBITER) ── */}
      <div
        className={`rounded-2xl border-2 p-5 shadow-lg transition-all ${
          analysisData.decision.primary === 'LONG'
            ? 'border-emerald-500/60 bg-emerald-500/10'
            : analysisData.decision.primary === 'SHORT'
            ? 'border-rose-500/60 bg-rose-500/10'
            : 'border-amber-500/60 bg-amber-500/10'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-12 items-center justify-center rounded-2xl font-black text-2xl shadow-md ${
                analysisData.decision.primary === 'LONG'
                  ? 'bg-emerald-500 text-slate-950'
                  : analysisData.decision.primary === 'SHORT'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {analysisData.decision.primary === 'LONG' ? '↑' : analysisData.decision.primary === 'SHORT' ? '↓' : '⏳'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Master Decision Arbiter
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                  Confidence: {analysisData.decision.confidence}% ({analysisData.decision.badge})
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground font-display mt-0.5">
                VERDICT: {analysisData.decision.primary}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="rounded-xl border border-border bg-card/60 p-2 text-right">
              <span className="text-[10px] text-muted-foreground uppercase">Previous State</span>
              <p className="font-bold text-foreground">{analysisData.decision.previousDecision}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-2 text-right">
              <span className="text-[10px] text-muted-foreground uppercase">Changed At</span>
              <p className="font-bold text-primary">{analysisData.decision.changedAt}</p>
            </div>
          </div>
        </div>

        {/* Change Reason & Confirmation Trigger */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs leading-relaxed">
          <div className="rounded-xl bg-card/40 border border-border/60 p-3">
            <span className="font-bold text-foreground">📋 Primary Reason: </span>
            <span className="text-muted-foreground">{analysisData.decision.lastChangeReason}</span>
          </div>
          <div className="rounded-xl bg-card/40 border border-border/60 p-3">
            <span className="font-bold text-rose-400">🛑 Invalidation Trigger: </span>
            <span className="text-muted-foreground">{analysisData.decision.reversalTrigger}</span>
          </div>
        </div>
      </div>

      {/* ── 3. ENTRY, STOP LOSS & TAKE PROFIT PLANNER ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Mathematical Trade Plan & RRR Proof
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Timeframe: <b>{analysisData.tradePlan.timeframe}</b> • Holding: <b>{analysisData.tradePlan.expectedHolding}</b>
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 font-mono text-xs">
          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase">Entry Zone</span>
            <p className="text-base font-black text-foreground">{analysisData.tradePlan.entryZone}</p>
            <p className="text-[10px] text-primary">Exact: ${analysisData.tradePlan.plannedEntry.toFixed(2)}</p>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
            <span className="text-[10px] text-rose-300 uppercase font-bold">Stop Loss (SL)</span>
            <p className="text-base font-black text-rose-400">${analysisData.tradePlan.stopLoss.toFixed(2)}</p>
            <p className="text-[10px] text-rose-300">Risk: {analysisData.tradePlan.riskPoints} pts</p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
            <span className="text-[10px] text-emerald-300 uppercase font-bold">Take Profit 1 (TP1)</span>
            <p className="text-base font-black text-emerald-400">${analysisData.tradePlan.tp1.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-300">RRR {analysisData.tradePlan.rrTp1}</p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
            <span className="text-[10px] text-emerald-300 uppercase font-bold">Take Profit 2 (TP2)</span>
            <p className="text-base font-black text-emerald-400">${analysisData.tradePlan.tp2.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-300">RRR {analysisData.tradePlan.rrTp2}</p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
            <span className="text-[10px] text-emerald-300 uppercase font-bold">Take Profit 3 (TP3)</span>
            <p className="text-base font-black text-emerald-400">${analysisData.tradePlan.tp3.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-300">RRR {analysisData.tradePlan.rrTp3}</p>
          </div>
        </div>
      </div>

      {/* ── 4. MULTI-TIMEFRAME STRUCTURE & LIQUIDITY ANALYSIS ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Timeframe Structure Card */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="size-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Higher Timeframe Trend Matrix
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                analysisData.structure.overallBias === 'BULLISH'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              Overall: {analysisData.structure.overallBias}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground">1D Daily</span>
              <p className="font-bold text-emerald-400 mt-0.5">{analysisData.structure.d1Trend}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground">4H Trend</span>
              <p className="font-bold text-emerald-400 mt-0.5">{analysisData.structure.h4Trend}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground">1H Trend</span>
              <p className="font-bold text-emerald-400 mt-0.5">{analysisData.structure.h1Trend}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground">15M Exec</span>
              <p className="font-bold text-emerald-400 mt-0.5">{analysisData.structure.m15Structure}</p>
            </div>
          </div>

          <div className="text-xs space-y-1 font-mono text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex justify-between">
              <span>Market Structure Event:</span>
              <span className="font-bold text-foreground">{analysisData.structure.bosStatus} (Confirmed)</span>
            </div>
            <div className="flex justify-between">
              <span>Change of Character (CHoCH):</span>
              <span className="font-bold text-emerald-400">{analysisData.structure.chochStatus}</span>
            </div>
          </div>
        </div>

        {/* Liquidity Pools & Sweeps Card */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-1.5">
              <Flame className="size-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Liquidity Map & Sweeps
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground">
              Session: {analysisData.liquidity.activeSession}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Nearest BSL (Above)</span>
              <p className="font-bold text-foreground">${analysisData.liquidity.nearestBslAbove.level.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">+{analysisData.liquidity.nearestBslAbove.distancePts} pts away</p>
            </div>

            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Nearest SSL (Below)</span>
              <p className="font-bold text-foreground">${analysisData.liquidity.nearestSslBelow.level.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">-{analysisData.liquidity.nearestSslBelow.distancePts} pts away</p>
            </div>
          </div>

          <div className="text-xs space-y-1 font-mono text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex justify-between">
              <span>Prior Day Levels:</span>
              <span className="text-foreground">PDH ${analysisData.liquidity.pdh} | PDL ${analysisData.liquidity.pdl}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Confirmed Sweep:</span>
              <span className="font-bold text-emerald-400">✓ {analysisData.liquidity.lastSweep}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. ASSET-SPECIFIC MACRO DATA (GOLD VS BTC) ── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-1.5">
            <Activity className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              {selectedAsset === 'XAUUSD' ? 'Gold Macro Drivers & Intermarket Backdrop' : 'Bitcoin On-Chain & Derivatives Matrix'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            DXY: <b>{analysisData.macro.dxy.price}</b> ({analysisData.macro.dxy.trend}) • US10Y: <b>{analysisData.macro.us10y.yield}%</b>
          </span>
        </div>

        {selectedAsset === 'XAUUSD' && analysisData.macro.goldSpecific && (
          <div className="grid gap-3 sm:grid-cols-4 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">COT Report</span>
              <p className="font-bold text-foreground mt-0.5">{analysisData.macro.goldSpecific.cotCommercials}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">US Real Yield</span>
              <p className="font-bold text-foreground mt-0.5">{analysisData.macro.goldSpecific.realYield}%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Geopolitics / Safe Haven</span>
              <p className="font-bold text-amber-400 mt-0.5">{analysisData.macro.goldSpecific.geopoliticalRisk}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Next Tier-1 Catalyst</span>
              <p className="font-bold text-rose-400 mt-0.5">{analysisData.macro.nextTier1Event.name}</p>
            </div>
          </div>
        )}

        {selectedAsset === 'BTCUSDT' && analysisData.macro.btcSpecific && (
          <div className="grid gap-3 sm:grid-cols-4 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">BTC Dominance</span>
              <p className="font-bold text-foreground mt-0.5">{analysisData.macro.btcSpecific.btcDominance}%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">USDT Dominance</span>
              <p className="font-bold text-emerald-400 mt-0.5">{analysisData.macro.btcSpecific.usdtDominance}% (Falling)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Spot ETF Net Flows</span>
              <p className="font-bold text-emerald-400 mt-0.5">{analysisData.macro.btcSpecific.etfNetFlow24h}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase">Funding Rate</span>
              <p className="font-bold text-foreground mt-0.5">{analysisData.macro.btcSpecific.fundingRate}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. INTERACTIVE PRE-TRADE CHECKLIST & SCORING SYSTEM ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h3 className="text-base font-bold text-foreground font-display">
                Institutional Pre-Trade Checklist
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click checkboxes to confirm live observations. Critical conditions block execution if unconfirmed.
            </p>
          </div>

          {/* Scoring Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <div className="text-xs text-muted-foreground">Confirmation Score</div>
              <div className="text-xl font-black text-foreground">
                {liveScoring.compositeScore}% ({liveScoring.confirmedCount}/{liveScoring.total})
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase border ${
                liveScoring.tradeApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {liveScoring.tradeApproved ? 'TRADE APPROVED ✓' : 'EXECUTION BLOCKED ✗'}
            </div>
          </div>
        </div>

        {/* Blocking reasons if any */}
        {liveScoring.blockReasons.length > 0 && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 space-y-1">
            <span className="font-bold text-rose-300">⚠️ Trade Approval Blocked Due To:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/90 font-mono">
              {liveScoring.blockReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Checklist Items Table */}
        <div className="space-y-2">
          {userChecklist.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                item.status === 'CONFIRMED'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : item.status === 'NOT_CONFIRMED'
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : 'border-border bg-secondary/30'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-foreground font-sans">{item.title}</span>
                  {item.critical && (
                    <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 uppercase">
                      CRITICAL
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">[{item.category}]</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans">{item.description}</p>
              </div>

              {/* Status Radio Buttons */}
              <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                <button
                  onClick={() => handleStatusToggle(item.id, 'CONFIRMED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    item.status === 'CONFIRMED'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => handleStatusToggle(item.id, 'NOT_CONFIRMED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    item.status === 'NOT_CONFIRMED'
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Not Confirmed
                </button>
                <button
                  onClick={() => handleStatusToggle(item.id, 'NOT_APPLICABLE')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    item.status === 'NOT_APPLICABLE'
                      ? 'bg-muted text-foreground font-bold'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  N/A
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. RISK MANAGEMENT POSITION CALCULATOR ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Institutional Risk Management Calculator
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Strict 0.25% - 1.0% Rule Applied
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Account Balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Risk Per Trade (%)</label>
            <div className="mt-1 flex items-center gap-1">
              {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    riskPercent === pct
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase">Estimated Position Size</span>
            <p className="text-base font-black text-foreground mt-0.5">
              {calculatedRisk.positionUnits} {selectedAsset === 'XAUUSD' ? 'Lots / Oz' : 'BTC'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase">Max Monetary Risk</span>
            <p className="text-base font-black text-rose-400 mt-0.5">
              -${calculatedRisk.monetaryRisk.toFixed(2)} ({riskPercent}%)
            </p>
          </div>
        </div>

        {calculatedRisk.warning && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg font-mono">
            ⚠️ {calculatedRisk.warning}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground font-mono">
          <span>Daily Loss Limit: <b>{dailyLossLimit}% ($200)</b> • Max Consecutive Losses Allowed: <b>2</b></span>
          <button
            onClick={handleSaveSetup}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
          >
            <BookmarkPlus className="size-4" />
            <span>Save Trade Setup to Journal</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-center animate-pulse">
            ✓ Setup saved to Trade Journal successfully!
          </div>
        )}
      </div>

      {/* ── 8. TRADE JOURNAL: HISTORICAL SAVED SETUPS ── */}
      {savedTrades.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Saved Trade Setups & Execution Journal ({savedTrades.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Persisted in Local Storage</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-[10px] uppercase text-muted-foreground">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Asset</th>
                  <th className="p-2.5">Direction</th>
                  <th className="p-2.5">Planned Entry</th>
                  <th className="p-2.5">SL</th>
                  <th className="p-2.5">TP</th>
                  <th className="p-2.5">Score</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {savedTrades.map((setup) => (
                  <tr key={setup.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-2.5 text-muted-foreground">{setup.createdAt}</td>
                    <td className="p-2.5 font-bold text-foreground">{setup.asset}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          setup.direction === 'LONG'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : setup.direction === 'SHORT'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {setup.direction}
                      </span>
                    </td>
                    <td className="p-2.5 text-foreground">${setup.entry.toFixed(2)}</td>
                    <td className="p-2.5 text-rose-400">${setup.sl.toFixed(2)}</td>
                    <td className="p-2.5 text-emerald-400">${setup.tp.toFixed(2)}</td>
                    <td className="p-2.5 font-bold text-primary">{setup.checklistScore}%</td>
                    <td className="p-2.5 max-w-xs truncate text-muted-foreground font-sans">
                      {setup.decisionReason}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteSetup(setup.id)}
                        className="p-1 rounded text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete setup"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreTradeAnalysisView;
