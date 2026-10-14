import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame, TrendingUp, TrendingDown, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, CheckCircle2, Clock, Calculator, AlertTriangle,
  Globe, Play, Pause, BarChart3, Database, Anchor, Gauge, Cpu, Filter
} from 'lucide-react';
import {
  OilInstrument,
  OilMarketAction,
  TimeHorizon,
  oilIntelligenceService,
  SUPPORTED_OIL_INSTRUMENTS,
  INITIAL_AI_TRADE_PLAN,
  INITIAL_OIL_SMC_STRUCTURE,
  INITIAL_FUNDAMENTAL_DATA,
  GEOPOLITICAL_RADAR_EVENTS,
  OIL_INVENTORY_CALENDAR,
  INITIAL_COT_DATA,
  OIL_SCENARIOS_PROBABILITY
} from '../services/oilIntelligenceEngine';
import TradingViewWidget from './TradingViewWidget';

interface Props {
  onNavigate?: (tabId: string) => void;
}

export default function OilIntelligenceTerminalView({ onNavigate }: Props) {
  const [instruments, setInstruments] = useState<OilInstrument[]>(SUPPORTED_OIL_INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState<OilInstrument>(SUPPORTED_OIL_INSTRUMENTS[0]);
  const [tradePlan, setTradePlan] = useState(INITIAL_AI_TRADE_PLAN);
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>('SWING_4H');
  const [smc, setSmc] = useState(INITIAL_OIL_SMC_STRUCTURE);
  const [fundamentals, setFundamentals] = useState(INITIAL_FUNDAMENTAL_DATA);
  const [geopolitics, setGeopolitics] = useState(GEOPOLITICAL_RADAR_EVENTS);
  const [inventoryEvents, setInventoryEvents] = useState(OIL_INVENTORY_CALENDAR);
  const [cot, setCot] = useState(INITIAL_COT_DATA);
  const [scenarios, setScenarios] = useState(OIL_SCENARIOS_PROBABILITY);

  // Language & Voice State
  const [langMode, setLangMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Position Sizer State
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [accountCurrency, setAccountCurrency] = useState<'USD' | 'INR'>('USD');
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(tradePlan.entryZone[0]);
  const [stopLossPrice, setStopLossPrice] = useState<number>(tradePlan.stopLoss);
  const [customMultiplier, setCustomMultiplier] = useState<number>(selectedInstrument.multiplier);
  const [brokerLeverage, setBrokerLeverage] = useState<number>(20);

  // Countdown timer simulation for next inventory report (EIA)
  const [eiaCountdown, setEiaCountdown] = useState<number>(inventoryEvents[0].countdownSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setEiaCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
  };

  // Sync multiplier when instrument changes
  useEffect(() => {
    setCustomMultiplier(selectedInstrument.multiplier);
    setEntryPrice(selectedInstrument.price);
  }, [selectedInstrument]);

  // Live Position Calculation
  const positionCalc = useMemo(() => {
    return oilIntelligenceService.calculatePositionSize({
      accountBalance,
      accountCurrency,
      riskPercent,
      entryPrice,
      stopLossPrice,
      multiplier: customMultiplier,
      brokerLeverage,
      estimatedFees: 12,
      usdInrRate: 84.50
    });
  }, [accountBalance, accountCurrency, riskPercent, entryPrice, stopLossPrice, customMultiplier, brokerLeverage]);

  // Voice Briefing Handler
  const toggleVoiceBriefing = () => {
    if (isSpeaking) {
      oilIntelligenceService.stopVoiceBriefing();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      oilIntelligenceService.playVoiceBriefing(langMode);
    }
  };

  // TradingView Symbol Resolver
  const tvSymbol = useMemo(() => {
    if (selectedInstrument.id === 'cl-futures') return 'NYMEX:CL1!';
    if (selectedInstrument.id === 'brent-futures') return 'ICEEUR:B1!';
    if (selectedInstrument.id === 'usoil-cfd') return 'TVC:USOIL';
    if (selectedInstrument.id === 'ukoil-cfd') return 'TVC:UKOIL';
    if (selectedInstrument.id === 'rbob-gasoline') return 'NYMEX:RB1!';
    return 'NYMEX:NG1!';
  }, [selectedInstrument]);

  return (
    <div className="space-y-6">
      {/* ── 1. TOP HEADER & INSTRUMENT SELECTION BANNER ── */}
      <div className="card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg font-black text-2xl shrink-0 shadow-lg">
              🛢️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-heading text-text">
                  CRUDE OIL INTELLIGENCE & AI TRADING TERMINAL
                </h1>
                <span className="label rounded-full bg-up-bg border border-up text-up px-2.5 py-0.5 font-bold">
                  LIVE QUANT FEED
                </span>
              </div>
              <div className="label text-text-muted font-bold mt-1">
                WTI (NYMEX: CL) • BRENT (ICE) • USOIL/UKOIL • SUPPLY & DEMAND • EIA/OPEC+ RADAR
              </div>
            </div>
          </div>

          {/* Telemetry Chips & Language Audio Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 label font-bold text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              GLOBAL DEFICIT: -800K B/D
            </div>

            {/* Language Selector */}
            <div className="flex items-center rounded-full bg-surface-2 border border-border p-1 text-xs">
              <button
                onClick={() => setLangMode('hinglish')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  langMode === 'hinglish' ? 'btn-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLangMode('hindi')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  langMode === 'hindi' ? 'btn-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLangMode('english')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  langMode === 'english' ? 'btn-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={toggleVoiceBriefing}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-xs cursor-pointer shadow-md"
            >
              {isSpeaking ? <VolumeX className="h-4 w-4 text-down" /> : <Volume2 className="h-4 w-4" />}
              <span>{isSpeaking ? 'Stop Audio' : 'AI Oil Briefing'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SUPPORTED OIL MARKETS TABS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {instruments.map(inst => (
          <div
            key={inst.id}
            onClick={() => setSelectedInstrument(inst)}
            className={`card p-3.5 transition-all cursor-pointer ${
              selectedInstrument.id === inst.id
                ? 'border-2 border-accent bg-surface-2 shadow-lg shadow-accent/10'
                : 'hover:bg-surface-2 opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text truncate">{inst.ticker}</span>
              <span className={`label text-[10px] font-bold px-1.5 py-0.5 rounded ${
                inst.feedType === 'FUTURES_FRONT_MONTH'
                  ? 'bg-accent-soft text-accent'
                  : inst.feedType === 'SPOT_CFD'
                  ? 'bg-surface-2 text-text-muted'
                  : 'bg-gold/15 text-gold'
              }`}>
                {inst.feedType === 'FUTURES_FRONT_MONTH' ? 'FUTURES' : inst.feedType === 'SPOT_CFD' ? 'CFD' : 'ENERGY'}
              </span>
            </div>

            <div className="mt-2 text-lg font-mono font-bold text-text num">
              ${inst.price > 10 ? inst.price.toFixed(2) : inst.price.toFixed(4)}
            </div>

            <div className="flex items-center justify-between mt-1 text-xs">
              <span className={`font-mono font-bold num ${inst.change24h >= 0 ? 'text-up' : 'text-down'}`}>
                {inst.change24h >= 0 ? '+' : ''}{inst.change24h.toFixed(2)} ({inst.changePct >= 0 ? '+' : ''}{inst.changePct.toFixed(2)}%)
              </span>
              <span className="text-[10px] text-text-muted truncate">{inst.exchange.split('/')[0]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Instrument Contract Provenance Badge */}
      <div className="p-3.5 rounded-xl bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-accent">Active Instrument:</span>
          <span className="text-text font-semibold">{selectedInstrument.name}</span>
          <span className="text-text-muted">• Exchange: {selectedInstrument.exchange}</span>
          <span className="text-text-muted">• Multiplier: {selectedInstrument.contractSize}</span>
          <span className="text-text-muted">• Expiry: {selectedInstrument.contractExpiry}</span>
        </div>
        <div className="label text-text-muted">
          Feed Timestamp: <span className="font-mono text-text num">{selectedInstrument.dataTimestamp}</span>
        </div>
      </div>

      {/* ── 3. MAIN AI DECISION ENGINE CARD (LONG / SHORT / WAIT) ── */}
      <div className="terminal-hero-spotlight p-6 space-y-5 border-2 border-accent/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="label font-bold text-accent">INSTITUTIONAL QUANT RECOMMENDATION</span>
              <span className="label rounded-full bg-up-bg border border-up text-up px-2.5 py-0.5 font-bold">
                SCORE: {tradePlan.confidenceScore}/100
              </span>
              <span className="label rounded-full bg-surface-2 border border-border text-text-muted px-2.5 py-0.5 font-bold">
                REGIME: {tradePlan.marketRegime.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <div className="flex items-center gap-3">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  tradePlan.action === 'LONG' ? 'text-up' : tradePlan.action === 'SHORT' ? 'text-down' : 'text-gold'
                }`}>
                  {tradePlan.action}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-text num">
                  ${selectedInstrument.price.toFixed(2)}
                </span>
              </div>
              <span className="text-sm font-mono text-text-muted">
                (Risk:Reward 1 : {tradePlan.riskRewardRatio.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex rounded-xl bg-surface-2 border border-border p-1 gap-1 text-xs">
            {(['SCALP_15M', 'INTRADAY_1H', 'SWING_4H', 'POSITION_1D'] as TimeHorizon[]).map(horizon => (
              <button
                key={horizon}
                onClick={() => setSelectedHorizon(horizon)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedHorizon === horizon
                    ? 'btn-primary'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {horizon.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* 2x4 Execution Parameter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="plan-item">
            <div className="plan-item-label">Suggested Entry Zone</div>
            <div className="plan-item-val text-accent text-base">
              ${tradePlan.entryZone[0].toFixed(2)} – ${tradePlan.entryZone[1].toFixed(2)}
            </div>
          </div>
          <div className="plan-item">
            <div className="plan-item-label">Dynamic Stop Loss (ATR)</div>
            <div className="plan-item-val text-down text-base">
              ${tradePlan.stopLoss.toFixed(2)}
            </div>
          </div>
          <div className="plan-item">
            <div className="plan-item-label">Take Profit 1 (Scale 50%)</div>
            <div className="plan-item-val text-up text-base">
              ${tradePlan.takeProfit1.toFixed(2)} (+1.5R)
            </div>
          </div>
          <div className="plan-item">
            <div className="plan-item-label">Take Profit 2 (Core Target)</div>
            <div className="plan-item-val text-up text-base">
              ${tradePlan.takeProfit2.toFixed(2)} (+3.0R)
            </div>
          </div>
        </div>

        {/* Invalidation Alert Banner */}
        <div className="invalidation-box flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-down shrink-0" />
            <span className="text-sm">
              <strong className="text-down">Setup Invalidation:</strong> ${tradePlan.invalidationPrice.toFixed(2)} — {tradePlan.invalidationReason}
            </span>
          </div>
          <span className="label text-down font-bold shrink-0">STRICT STOP MARKET</span>
        </div>

        {/* Trade Confirmation & Catalysts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="label text-up font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-up" />
              Reasons Supporting Trade (Bullish Catalysts):
            </div>
            <ul className="space-y-1.5 text-xs text-text-muted">
              {tradePlan.bullishCatalysts.map((cat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-up font-bold">✓</span>
                  <span>{cat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="label text-down font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-down" />
              Event Risks & Downside Triggers:
            </div>
            <ul className="space-y-1.5 text-xs text-text-muted">
              {tradePlan.bearishRisks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-down font-bold">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── 4. LIVE INTERACTIVE OIL CHART & TECHNICAL STRUCTURE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: TradingView Chart Embed (8 cols) */}
        <div className="lg:col-span-8 card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-text">
                Live Interactive Chart — {selectedInstrument.ticker} ({tvSymbol})
              </h3>
            </div>
            <span className="label text-text-muted">Multi-Timeframe Structure Active</span>
          </div>

          {/* Embedded TradingView Chart */}
          <div className="h-[460px] w-full rounded-xl overflow-hidden border border-border">
            <TradingViewWidget
              symbol={tvSymbol}
              theme="dark"
              height={460}
              interval="60"
            />
          </div>
        </div>

        {/* Right: SMC & Market Structure Breakdown (4 cols) */}
        <div className="lg:col-span-4 card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-text">Smart Money Concepts (SMC)</h3>
            </div>
            <span className="label text-accent font-bold">4H FRAME</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-surface-2 border border-border space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Market Structure:</span>
                <span className="font-bold text-up">{smc.marketStructure.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">HTF Trend / LTF Trend:</span>
                <span className="font-bold text-text">{smc.higherTimeframeTrend} / {smc.lowerTimeframeTrend}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 border border-border space-y-1">
              <div className="label text-accent font-bold">Key Demand Order Block:</div>
              <div className="font-mono text-sm text-text font-bold num">
                ${smc.orderBlock.priceRange[0].toFixed(2)} – ${smc.orderBlock.priceRange[1].toFixed(2)}
              </div>
              <div className="text-[11px] text-text-muted">
                Status: {smc.orderBlock.volumeConfirmed ? 'Institutional Volume Confirmed' : 'Unconfirmed'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 border border-border space-y-1">
              <div className="label text-gold font-bold">Fair Value Gap (FVG):</div>
              <div className="font-mono text-sm text-text font-bold num">
                ${smc.fairValueGap.range[0].toFixed(2)} – ${smc.fairValueGap.range[1].toFixed(2)}
              </div>
              <div className="text-[11px] text-text-muted">
                Tested: {smc.fairValueGap.tested ? 'Fully Filled' : 'Open Imbalance (Magnetic Pull)'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 border border-border space-y-1">
              <div className="label text-text-muted font-bold">Volume Profile (Session POC):</div>
              <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-center num">
                <div>
                  <div className="text-[10px] text-text-muted">VAL</div>
                  <div className="font-bold text-text">${smc.volumeProfile.val.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-accent">POC</div>
                  <div className="font-bold text-accent">${smc.volumeProfile.poc.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted">VAH</div>
                  <div className="font-bold text-text">${smc.volumeProfile.vah.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. FUNDAMENTALS, EIA/API INVENTORY & SUPPLY/DEMAND ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel A: Global Supply / Demand Balance */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-text">Supply & Demand Balance</h3>
            </div>
            <span className="label rounded px-2 py-0.5 bg-up-bg text-up font-bold">
              {fundamentals.globalBalance.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Global Daily Production:</span>
              <span className="font-mono font-bold text-text num">{fundamentals.globalBalance.productionMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Global Daily Consumption:</span>
              <span className="font-mono font-bold text-text num">{fundamentals.globalBalance.consumptionMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Net Balance Deficit:</span>
              <span className="font-mono font-bold text-up num">{fundamentals.globalBalance.netBalanceMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">US Production (Record):</span>
              <span className="font-mono font-bold text-text num">{fundamentals.usProduction.crudeOutputMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">US Active Oil Rigs:</span>
              <span className="font-mono font-bold text-text num">
                {fundamentals.usProduction.activeRigCount} ({fundamentals.usProduction.rigCountWeeklyChange} rigs)
              </span>
            </div>
          </div>
        </div>

        {/* Panel B: OPEC+ Quota Discipline & SPR */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gold" />
              <h3 className="text-base font-bold text-text">OPEC+ & US SPR Reserves</h3>
            </div>
            <span className="label rounded px-2 py-0.5 bg-accent-soft text-accent font-bold">
              {fundamentals.opecPlus.compliancePct}% COMPLIANCE
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">OPEC+ Actual Output:</span>
              <span className="font-mono font-bold text-text num">{fundamentals.opecPlus.actualOutputMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Saudi Voluntary Cuts:</span>
              <span className="font-mono font-bold text-up num">-{fundamentals.opecPlus.saudiVoluntaryCutMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Russia Export Reduction:</span>
              <span className="font-mono font-bold text-up num">-{fundamentals.opecPlus.russiaExportCutMbd} mb/d</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">US SPR Crude Level:</span>
              <span className="font-mono font-bold text-text num">{fundamentals.sprInventory.currentLevelMb} Million bbls</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">SPR Weekly Refill Purchases:</span>
              <span className="font-mono font-bold text-accent num">+{fundamentals.sprInventory.refillWeeklyPurchasesKb}K bbls</span>
            </div>
          </div>
        </div>

        {/* Panel C: Crack Spreads & Term Structure */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Anchor className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-text">Refinery Margins & Spreads</h3>
            </div>
            <span className="label rounded px-2 py-0.5 bg-up-bg text-up font-bold">
              BACKWARDATION
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">3:2:1 Crack Spread Margin:</span>
              <span className="font-mono font-bold text-up num">${fundamentals.refineryMetrics.crackSpread321}/bbl</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Brent – WTI Quality Spread:</span>
              <span className="font-mono font-bold text-text num">${fundamentals.refineryMetrics.brentWtiSpread}/bbl</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">US Refinery Utilization:</span>
              <span className="font-mono font-bold text-text num">{fundamentals.refineryMetrics.utilizationPct}%</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">M1–M12 Prompt Spread:</span>
              <span className="font-mono font-bold text-accent num">+${fundamentals.refineryMetrics.calendarSpreadM1M12}/bbl</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-2">
              <span className="text-text-muted">Futures Curve State:</span>
              <span className="font-bold text-up">Bullish Prompt Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. EIA/API INVENTORY CALENDAR & COUNTDOWN ENGINE ── */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <h3 className="text-base font-bold text-text">EIA & API Inventory Release Radar</h3>
              <p className="text-xs text-text-muted">Official US Department of Energy & Industry Stockpile Reports</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="label text-text-muted">NEXT EIA RELEASE COUNTDOWN:</span>
            <div className="card px-3 py-1 font-mono font-bold text-base text-gold num">
              {formatCountdown(eiaCountdown)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {inventoryEvents.map(evt => (
            <div key={evt.id} className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text">{evt.name}</span>
                <span className="label rounded px-1.5 py-0.5 bg-accent-soft text-accent font-bold">{evt.agency}</span>
              </div>
              <div className="text-text-muted">Release: {evt.releaseTimeIST} ({evt.releaseTimeEST})</div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono num">
                <div className="p-2 rounded bg-surface">
                  <div className="text-[10px] text-text-muted">Crude Forecast</div>
                  <div className="font-bold text-accent">{evt.crudeStocksForecast}</div>
                </div>
                <div className="p-2 rounded bg-surface">
                  <div className="text-[10px] text-text-muted">Previous Print</div>
                  <div className="font-bold text-text">{evt.crudeStocksPrevious}</div>
                </div>
              </div>

              <p className="text-[11px] text-text-muted pt-1 leading-relaxed">
                <strong className="text-text">Trading Rule:</strong> {evt.algorithmicRule}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. GEOPOLITICAL RISK & CHOKEPOINT RADAR ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Flame className="h-5 w-5 text-down" />
            <div>
              <h3 className="text-base font-bold text-text">Geopolitical Threat & Maritime Chokepoint Radar</h3>
              <p className="text-xs text-text-muted">Strait of Hormuz, Bab el-Mandeb, Russia Sanctions & China Stimulus</p>
            </div>
          </div>
          <span className="label text-down font-bold">4 ACTIVE FLASHPOINTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {geopolitics.map(item => (
            <div key={item.id} className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-down animate-pulse" />
                  <span className="font-bold text-sm text-text">{item.title}</span>
                </div>
                <span className="label px-2 py-0.5 rounded bg-down-bg text-down font-bold">{item.bias}</span>
              </div>

              <div className="text-text-muted font-semibold">Region: {item.region} • Supply Risk: {item.supplyDisruptionRiskMbd}</div>

              <div className="space-y-1.5 pt-1 text-text-muted leading-relaxed">
                <div><strong className="text-text">Market Impact:</strong> {item.impactWtiBrent}</div>
                <div><strong className="text-text">Immediate Move:</strong> {item.immediateReaction}</div>
                <div><strong className="text-text">Confirmation Signal:</strong> {item.confirmationSignal}</div>
                <div><strong className="text-text">Invalidation:</strong> {item.invalidationSignal}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. INSTITUTIONAL POSITIONING (CFTC COT) & SCENARIO ENGINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: CFTC COT Positioning (5 cols) */}
        <div className="lg:col-span-5 card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-text">CFTC Commitments of Traders (COT)</h3>
            </div>
            <span className="label text-accent font-bold">MANAGED MONEY</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-surface-2 text-center">
                <div className="text-text-muted text-[10px]">Net Speculative Longs</div>
                <div className="font-mono text-base font-bold text-up num">
                  +{cot.netSpeculativePosition.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface-2 text-center">
                <div className="text-text-muted text-[10px]">Weekly Net Change</div>
                <div className="font-mono text-base font-bold text-up num">
                  +{cot.weeklyChangeNet.toLocaleString()} bbls
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">52-Week Percentile Rank:</span>
                <span className="font-mono font-bold text-text num">{cot.percentileRank52W}%</span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full" style={{ width: `${cot.percentileRank52W}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Futures Open Interest:</span>
                <span className="font-mono font-bold text-text num">{cot.openInterestTotal.toLocaleString()} Contracts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Commercial Hedgers Net:</span>
                <span className="font-mono font-bold text-down num">{cot.commercialHedgersNet.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-text-muted text-[11px] leading-relaxed p-2 bg-surface rounded">
              <strong className="text-text">Quant Interpretation: </strong>
              {cot.interpretation}
            </p>
          </div>
        </div>

        {/* Right: 3-Scenario Probability Matrix (7 cols) */}
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent" />
              <h3 className="text-base font-bold text-text">3-Scenario Calibrated Probability Matrix</h3>
            </div>
            <span className="label text-accent font-bold">TOTAL = 100%</span>
          </div>

          <div className="space-y-3">
            {scenarios.map(sc => (
              <div key={sc.scenario} className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${
                    sc.scenario === 'BULLISH' ? 'text-up' : sc.scenario === 'BEARISH' ? 'text-down' : 'text-gold'
                  }`}>
                    {sc.scenario} SCENARIO ({sc.probability}%)
                  </span>
                  <span className="font-mono font-bold text-text num">{sc.priceTarget}</span>
                </div>

                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sc.scenario === 'BULLISH' ? 'bg-up' : sc.scenario === 'BEARISH' ? 'bg-down' : 'bg-gold'
                    }`}
                    style={{ width: `${sc.probability}%` }}
                  />
                </div>

                <div className="text-text-muted pt-1 space-y-1 leading-relaxed">
                  <div><strong className="text-text">Trigger:</strong> {sc.triggerCondition}</div>
                  <div><strong className="text-text">Driver:</strong> {sc.keyDriver}</div>
                  <div><strong className="text-text">Invalidation:</strong> {sc.invalidation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 9. PROFESSIONAL POSITION SIZING & RISK MANAGEMENT CALCULATOR ── */}
      <div className="card p-6 space-y-5 border-2 border-accent/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-accent" />
            <div>
              <h3 className="text-lg font-bold text-text">Institutional Oil Position Sizer & Risk Calculator</h3>
              <p className="text-xs text-text-muted">Calculates exact contracts & lots based on contract multiplier (1,000 bbl vs 100 bbl)</p>
            </div>
          </div>

          {/* Currency Toggle */}
          <div className="flex rounded-xl bg-surface-2 border border-border p-1 gap-1 text-xs">
            <button
              onClick={() => setAccountCurrency('USD')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                accountCurrency === 'USD' ? 'btn-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setAccountCurrency('INR')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                accountCurrency === 'INR' ? 'btn-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              INR (₹)
            </button>
          </div>
        </div>

        {/* Calculator Inputs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="label text-text-muted block mb-1">Account Balance ({accountCurrency})</label>
            <input
              type="number"
              value={accountBalance}
              onChange={e => setAccountBalance(Number(e.target.value) || 0)}
              className="w-full p-2.5 rounded-lg bg-surface border border-border text-text font-mono num"
            />
          </div>

          <div>
            <label className="label text-text-muted block mb-1">Max Risk Per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={e => setRiskPercent(Number(e.target.value) || 0)}
              className="w-full p-2.5 rounded-lg bg-surface border border-border text-text font-mono num"
            />
          </div>

          <div>
            <label className="label text-text-muted block mb-1">Entry Price ($)</label>
            <input
              type="number"
              step="0.05"
              value={entryPrice}
              onChange={e => setEntryPrice(Number(e.target.value) || 0)}
              className="w-full p-2.5 rounded-lg bg-surface border border-border text-text font-mono num"
            />
          </div>

          <div>
            <label className="label text-text-muted block mb-1">Stop-Loss Price ($)</label>
            <input
              type="number"
              step="0.05"
              value={stopLossPrice}
              onChange={e => setStopLossPrice(Number(e.target.value) || 0)}
              className="w-full p-2.5 rounded-lg bg-surface border border-border text-text font-mono num"
            />
          </div>

          <div>
            <label className="label text-text-muted block mb-1">Contract Multiplier</label>
            <select
              value={customMultiplier}
              onChange={e => setCustomMultiplier(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-surface border border-border text-text font-mono"
            >
              <option value={1000}>Standard Futures (1,000 bbl)</option>
              <option value={100}>Mini CFD / Micro (100 bbl)</option>
              <option value={10}>Nano CFD (10 bbl)</option>
            </select>
          </div>

          <div>
            <label className="label text-text-muted block mb-1">Broker Leverage (1:X)</label>
            <input
              type="number"
              value={brokerLeverage}
              onChange={e => setBrokerLeverage(Number(e.target.value) || 1)}
              className="w-full p-2.5 rounded-lg bg-surface border border-border text-text font-mono num"
            />
          </div>
        </div>

        {/* Calculated Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="plan-item">
            <div className="plan-item-label">Recommended Contracts / Lots</div>
            <div className="plan-item-val text-accent text-lg">
              {positionCalc.recommendedContracts} Contracts
            </div>
          </div>

          <div className="plan-item">
            <div className="plan-item-label">Planned Dollar Risk</div>
            <div className="plan-item-val text-down text-lg">
              {accountCurrency === 'INR' ? '₹' : '$'}{positionCalc.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="plan-item">
            <div className="plan-item-label">Position Notional Value</div>
            <div className="plan-item-val text-text text-lg">
              {accountCurrency === 'INR' ? '₹' : '$'}{positionCalc.positionNotionalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="plan-item">
            <div className="plan-item-label">Required Margin (Estimated)</div>
            <div className="plan-item-val text-gold text-lg">
              {accountCurrency === 'INR' ? '₹' : '$'}{positionCalc.requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Suitability Warning if applicable */}
        {positionCalc.isSuitabilityWarning && (
          <div className="invalidation-box flex items-center gap-2 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-down shrink-0" />
            <span>{positionCalc.suitabilityMessage}</span>
          </div>
        )}

        {/* Profit Projection Table */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-text-muted">Profit at Target 1 ($77.80)</div>
            <div className="font-mono text-base font-bold text-up num mt-0.5">
              +{accountCurrency === 'INR' ? '₹' : '$'}{positionCalc.potentialProfitTP1.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-text-muted">Profit at Target 2 ($79.40)</div>
            <div className="font-mono text-base font-bold text-up num mt-0.5">
              +{accountCurrency === 'INR' ? '₹' : '$'}{positionCalc.potentialProfitTP2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-text-muted">Profit at Target 3 ($81.50)</div>
            <div className="font-mono text-base font-bold text-up num mt-0.5">
              +{accountCurrency === 'INR' ? '₹' : '$'}{positionCalc.potentialProfitTP3.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
