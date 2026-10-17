import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TradingViewWidget from './TradingViewWidget';
import {
  TrendingUp, TrendingDown, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, Clock, Calculator, AlertTriangle,
  HelpCircle, Eye, Info, Calendar, ShieldCheck, DollarSign, BarChart2,
  Globe, Cpu, Users, ArrowRight, BookOpen, Check, Play, Pause, Settings
} from 'lucide-react';
import {
  GoldMarketPriceData,
  UsDollarData,
  TreasuryYieldData,
  FedMonetaryPolicyData,
  MacroCalendarEvent,
  CentralBankGoldData,
  GoldEtfFlowData,
  CftcCotData,
  GoldDerivativesData,
  GlobalLiquidityData,
  GeopoliticalRiskData,
  OilCommoditiesData,
  IndiaMcxData,
  PhysicalSupplyDemandData,
  TechnicalSMCData,
  PillarScoreWeight,
  DEFAULT_GOLD_PRICES,
  DEFAULT_USD_DOLLAR,
  DEFAULT_TREASURY_YIELDS,
  DEFAULT_FED_POLICY,
  DEFAULT_MACRO_CALENDAR,
  DEFAULT_CENTRAL_BANK_GOLD,
  DEFAULT_ETF_FLOWS,
  DEFAULT_CFTC_COT,
  DEFAULT_DERIVATIVES,
  DEFAULT_GLOBAL_LIQUIDITY,
  DEFAULT_GEOPOLITICAL,
  DEFAULT_OIL_COMMODITIES,
  DEFAULT_INDIA_MCX,
  DEFAULT_PHYSICAL_SD,
  DEFAULT_TECHNICAL_SMC,
  INITIAL_PILLAR_WEIGHTS,
  DEFAULT_ANOMALIES,
  MARKET_CYCLE_PHASES,
  DATABASE_TABLES_SCHEMA,
  LONG_TERM_GOLD_CHECKLIST,
  calculateRegimeScore
} from '../services/goldIntelligenceEngine';
import { voiceService } from '../services/voiceSynthesisService';

type TabView =
  | 'DASHBOARD'
  | 'WHY_MOVING'
  | 'REGIME_SCORE'
  | 'AI_ANSWER'
  | 'SMC_CHART'
  | 'MARKET_CYCLES'
  | 'FLOWS_DERIVATIVES'
  | 'MACRO_CALENDAR'
  | 'INDIA_MCX'
  | 'ANOMALIES_ALERTS'
  | 'RESEARCH_AUDIT';

type ScenarioPreset = 'LIVE_BULLISH' | 'BEARISH_BREAKDOWN' | 'NEWS_LOCKOUT' | 'RANGE_CHOP';

interface Props {
  initialTab?: string;
  onNavigate?: (tabId: string) => void;
}

export const GoldAiMarketIntelligenceView: React.FC<Props> = ({ initialTab, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabView>(() => {
    if (initialTab === 'MACRO_DASHBOARD') return 'DASHBOARD';
    return 'DASHBOARD';
  });

  const [scenarioPreset, setScenarioPreset] = useState<ScenarioPreset>('LIVE_BULLISH');
  const [pillarWeights, setPillarWeights] = useState<PillarScoreWeight[]>(INITIAL_PILLAR_WEIGHTS);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [langMode, setLangMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [chartTf, setChartTf] = useState<'15' | '60' | '240' | 'D'>('60');

  // Calculator states
  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [contractType, setContractType] = useState<'STANDARD_100OZ' | 'MINI_10OZ' | 'MICRO_1OZ'>('STANDARD_100OZ');
  const [stopLossDistance, setStopLossDistance] = useState<number>(18.5);

  // UTC Market Clock & Active Sessions
  const [utcTime, setUtcTime] = useState<string>('');
  const [activeSessions, setActiveSessions] = useState<{ name: string; hours: string; active: boolean; note: string }[]>([]);

  useEffect(() => {
    const tickClock = () => {
      const now = new Date();
      const h = now.getUTCHours();
      const m = now.getUTCMinutes();
      const s = now.getUTCSeconds();
      setUtcTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} UTC`);

      setActiveSessions([
        {
          name: 'Asian Session (Tokyo/Sydney/Shanghai)',
          hours: '00:00 – 09:00 UTC',
          active: h >= 0 && h < 9,
          note: h >= 0 && h < 9 ? `${8 - h}h ${60 - m}m remaining` : 'Opens 00:00 UTC'
        },
        {
          name: 'London Session (LBMA / Europe)',
          hours: '07:00 – 16:00 UTC',
          active: h >= 7 && h < 16,
          note: h >= 7 && h < 16 ? `${15 - h}h ${60 - m}m remaining` : 'Opens 07:00 UTC'
        },
        {
          name: 'New York Session (COMEX / US Overlap)',
          hours: '12:00 – 21:00 UTC',
          active: h >= 12 && h < 21,
          note: h >= 12 && h < 21 ? `${20 - h}h ${60 - m}m remaining` : 'Opens 12:00 UTC'
        }
      ]);
    };

    tickClock();
    const interval = setInterval(tickClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Prices based on scenario
  const prices = useMemo<GoldMarketPriceData>(() => {
    if (scenarioPreset === 'BEARISH_BREAKDOWN') {
      return {
        ...DEFAULT_GOLD_PRICES,
        spotXauUsd: 4068.20,
        spotChange: -42.80,
        spotChangePct: -1.04,
        comexFuturesFront: 4074.50,
        mcxGoldInrPer10g: 87150,
        mcxGoldChangePct: -0.92,
        goldDxyCorrelation: -0.91
      };
    } else if (scenarioPreset === 'NEWS_LOCKOUT') {
      return {
        ...DEFAULT_GOLD_PRICES,
        spotXauUsd: 4118.40,
        spotChange: +3.20,
        spotChangePct: +0.08,
        bidAskSpread: 0.65 // Spreads widen before CPI
      };
    } else if (scenarioPreset === 'RANGE_CHOP') {
      return {
        ...DEFAULT_GOLD_PRICES,
        spotXauUsd: 4112.00,
        spotChange: -1.80,
        spotChangePct: -0.04
      };
    }
    return DEFAULT_GOLD_PRICES;
  }, [scenarioPreset]);

  // Dynamic USD Data
  const dxy = useMemo<UsDollarData>(() => {
    if (scenarioPreset === 'BEARISH_BREAKDOWN') {
      return {
        ...DEFAULT_USD_DOLLAR,
        dxyLive: 104.40,
        dxyChange1D: +0.72,
        trend: 'BULLISH',
        momentumRsi: 66.4,
        aiRelationshipNote: 'DXY break above 104.20 resistance is exerting strong downward pressure on precious metals.'
      };
    }
    return DEFAULT_USD_DOLLAR;
  }, [scenarioPreset]);

  // Dynamic Yields
  const yields = useMemo<TreasuryYieldData>(() => {
    if (scenarioPreset === 'BEARISH_BREAKDOWN') {
      return {
        ...DEFAULT_TREASURY_YIELDS,
        us10Y: 4.34,
        tipsRealYield10Y: 2.18,
        realYieldChange1D: +0.12,
        realYieldChange1W: +0.24,
        supportiveOrRestrictive: 'RESTRICTIVE',
        aiYieldInterpretation: '10Y TIPS real yield spiked to 2.18% (+24 bps WoW), increasing the opportunity cost of holding non-yielding bullion.'
      };
    }
    return DEFAULT_TREASURY_YIELDS;
  }, [scenarioPreset]);

  // Dynamic Pillars
  const currentPillars = useMemo<PillarScoreWeight[]>(() => {
    if (scenarioPreset === 'BEARISH_BREAKDOWN') {
      return pillarWeights.map(p => {
        if (p.pillarId === 'macro_fed') return { ...p, score: 38, bias: 'BEARISH', institutionalReason: 'Hawkish repricing: rate cuts delayed' };
        if (p.pillarId === 'real_yields') return { ...p, score: 24, bias: 'BEARISH', institutionalReason: 'Real yields spiking over 2.15% sharply hits gold' };
        if (p.pillarId === 'usd_dxy') return { ...p, score: 28, bias: 'BEARISH', institutionalReason: 'DXY surging above 104.20' };
        if (p.pillarId === 'technical_smc') return { ...p, score: 32, bias: 'BEARISH', institutionalReason: '4H Bearish CHoCH confirmed below $4,098' };
        return { ...p, score: Math.max(30, p.score - 25), bias: 'BEARISH' };
      });
    } else if (scenarioPreset === 'NEWS_LOCKOUT') {
      return pillarWeights.map(p => ({
        ...p,
        score: 50,
        bias: 'NEUTRAL',
        institutionalReason: 'Tier-1 News Risk window: spreads widening, stand by for post-release direction.'
      }));
    } else if (scenarioPreset === 'RANGE_CHOP') {
      return pillarWeights.map(p => ({
        ...p,
        score: 48,
        bias: 'NEUTRAL',
        institutionalReason: 'Equilibrium pricing inside value area without directional conviction.'
      }));
    }
    return pillarWeights;
  }, [scenarioPreset, pillarWeights]);

  // Dynamic Regime Score
  const regimeScore = useMemo(() => calculateRegimeScore(currentPillars), [currentPillars]);

  // Dynamic Biases across Timeframes (Section 18 & 20)
  const timeframeBiases = useMemo(() => {
    if (scenarioPreset === 'BEARISH_BREAKDOWN') {
      return {
        shortTerm: { bias: 'BEARISH', score: 34, reason: 'DXY +0.72% rally & TIPS real yield surge above 2.15%' },
        swing: { bias: 'BEARISH', score: 42, reason: '4H CHoCH breakdown and ETF outflows' },
        longTerm: { bias: 'BULLISH', score: 78, reason: 'Central bank floor and US national debt debasement secular trend' }
      };
    } else if (scenarioPreset === 'NEWS_LOCKOUT') {
      return {
        shortTerm: { bias: 'WAIT / NEUTRAL', score: 50, reason: 'Tier-1 high impact event lockout (< 20 mins)' },
        swing: { bias: 'BULLISH', score: 72, reason: 'Macro cycle easing bias intact' },
        longTerm: { bias: 'STRONG_BULLISH', score: 88, reason: 'Structural de-dollarization and reserve accumulation' }
      };
    }
    return {
      shortTerm: { bias: 'BULLISH', score: 84, reason: 'Asian low swept, DXY cooling below 102.50, real yields at 1.62%' },
      swing: { bias: 'BULLISH', score: 86, reason: 'Fed rate cut cycle, Western ETF inflows, pristine 4H HH/HL' },
      longTerm: { bias: 'STRONG_BULLISH', score: 92, reason: 'Record central-bank buying, M2 expansion, fiscal deficits' }
    };
  }, [scenarioPreset]);

  // Position Sizing Calculation
  const positionSizing = useMemo(() => {
    const cashAtRisk = (accountBalance * riskPercent) / 100;
    const ouncesPerContract = contractType === 'STANDARD_100OZ' ? 100 : contractType === 'MINI_10OZ' ? 10 : 1;
    const distance = Math.max(1, stopLossDistance);
    const suggestedContracts = Math.max(0.01, Math.round((cashAtRisk / (distance * ouncesPerContract)) * 100) / 100);
    const totalExposure = suggestedContracts * ouncesPerContract * prices.spotXauUsd;
    const maxLoss = suggestedContracts * ouncesPerContract * distance;

    return {
      cashAtRisk,
      suggestedContracts,
      totalExposure,
      maxLoss
    };
  }, [accountBalance, riskPercent, contractType, stopLossDistance, prices.spotXauUsd]);

  // Voice Briefing Function
  const handlePlayVoiceBriefing = useCallback(() => {
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
      return;
    }

    let speechText = '';
    if (langMode === 'hindi' || langMode === 'hinglish') {
      speechText = `Gold Market Intelligence update: XAU/USD spot price chal raha hai $${prices.spotXauUsd.toFixed(1)}, change hai ${prices.spotChangePct > 0 ? '+' : ''}${prices.spotChangePct} percent. Hamara AI Gold Regime Score hai ${regimeScore.totalScore} out of 100, jo ki ${regimeScore.bias} regime confirm kar raha hai. Short term bias hai ${timeframeBiases.shortTerm.bias}, swing bias hai ${timeframeBiases.swing.bias}, aur long term bias hai ${timeframeBiases.longTerm.bias}. Sabse bada driver hai DXY ki weakness aur Real Yields ka 1.62 percent par compress hona. Central banks ki buying structural floor provide kar rahi hai. Key resistance $4,148 aur key support $4,098 hai.`;
    } else {
      speechText = `Gold Market Intelligence report: XAU/USD spot is trading at $${prices.spotXauUsd.toFixed(1)}, up ${prices.spotChangePct} percent. The AI Gold Regime Score stands at ${regimeScore.totalScore} out of 100, indicating a ${regimeScore.bias} regime with ${regimeScore.confidence} percent confidence. Short term bias is ${timeframeBiases.shortTerm.bias}, swing bias is ${timeframeBiases.swing.bias}, and long term structural bias is ${timeframeBiases.longTerm.bias}. Primary drivers are falling US real yields at 1.62% and sustained sovereign accumulation. Immediate support is at $4,098 and resistance at $4,148.`;
    }

    voiceService.speak(
      speechText,
      langMode === 'english' ? 'english' : 'hindi',
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  }, [isSpeaking, langMode, prices, regimeScore, timeframeBiases]);

  // Weight Adjustment Handler for Section 19
  const handleWeightChange = (pillarId: string, newWeight: number) => {
    setPillarWeights(prev =>
      prev.map(p => (p.pillarId === pillarId ? { ...p, weightPct: Math.max(1, Math.min(40, newWeight)) } : p))
    );
  };

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: TOP BAR & MASTER HEADER                                 */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/40 bg-gold/15 text-2xl text-gold shadow-inner">
              🥇
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  GOLD AI MARKET INTELLIGENCE TERMINAL
                </h1>
                <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-mono font-bold text-gold border border-gold/40">
                  XAU/USD · 30-MODULE SPEC
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evidence-Based Decision Support System combining Macro, Rates, Sovereign Demand, CFTC, Derivatives & SMC Market Structure.
              </p>
            </div>
          </div>

          {/* Voice briefing & Lang Mode & UTC Clock */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lang switcher */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5 text-xs font-mono">
              <button
                onClick={() => setLangMode('hinglish')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${langMode === 'hinglish' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLangMode('hindi')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${langMode === 'hindi' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Hindi
              </button>
              <button
                onClick={() => setLangMode('english')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${langMode === 'english' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                English
              </button>
            </div>

            {/* Audio brief button */}
            <button
              onClick={handlePlayVoiceBriefing}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                isSpeaking
                  ? 'border-red-500 bg-red-500/15 text-red-400 animate-pulse'
                  : 'border-gold/50 bg-gold/10 text-gold hover:bg-gold/20'
              }`}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{isSpeaking ? 'Stop Audio AI' : 'Play AI Audio Brief'}</span>
            </button>

            {/* UTC Clock */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-3 py-1.5 font-mono text-xs text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{utcTime || 'UTC CLOCK'}</span>
            </div>
          </div>
        </div>

        {/* Live Ticker Strip (Section 1 & 2) */}
        {/* Live Ticker Strip (Section 1 & 2) */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 sm:grid-cols-4 lg:grid-cols-7 font-mono text-xs">
          {/* 1. Spot Gold */}
          <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block font-sans">XAU/USD Spot</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-extrabold text-foreground">${prices.spotXauUsd.toFixed(2)}</span>
              <span className={`text-xs font-bold ${prices.spotChangePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {prices.spotChangePct >= 0 ? '+' : ''}{prices.spotChangePct.toFixed(2)}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">Range: ${prices.dailyLow.toFixed(0)} - ${prices.dailyHigh.toFixed(0)}</span>
          </div>

          {/* 2. Gold Futures COMEX */}
          <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block font-sans">COMEX Futures (GC)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-extrabold text-foreground">${prices.comexFuturesFront.toFixed(2)}</span>
              <span className="text-xs text-bull font-bold">+{prices.futuresBasis.toFixed(1)}$ Basis</span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">OI: {(prices.comexOpenInterest / 1000).toFixed(0)}k contracts</span>
          </div>

          {/* 3. MCX Gold India */}
          <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block font-sans">MCX Gold (10g) 🇮🇳</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-extrabold text-gold">₹{prices.mcxGoldInrPer10g.toLocaleString()}</span>
              <span className="text-xs text-bull font-bold">+{prices.mcxGoldChangePct}%</span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">USD/INR: {prices.usdInrRate.toFixed(2)}</span>
          </div>

          {/* 4. DXY Live */}
          <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block font-sans">US Dollar Index (DXY)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-extrabold text-foreground">{dxy.dxyLive.toFixed(2)}</span>
              <span className={`text-xs font-bold ${dxy.dxyChange1D >= 0 ? 'text-bear' : 'text-bull'}`}>
                {dxy.dxyChange1D >= 0 ? '+' : ''}{dxy.dxyChange1D}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">Trend: {dxy.trend} (RSI {dxy.momentumRsi.toFixed(0)})</span>
          </div>

          {/* 5. US 10Y Real TIPS Yield */}
          <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block font-sans">10Y TIPS Real Yield</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-extrabold text-foreground">{yields.tipsRealYield10Y.toFixed(2)}%</span>
              <span className="text-xs text-bull font-bold">{yields.realYieldChange1D >= 0 ? '+' : ''}{yields.realYieldChange1D}%</span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">US10Y: {yields.us10Y}% · Spread +{yields.spread2Y10Y}bp</span>
          </div>

          {/* 6. Fed Target & FOMC */}
          <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block font-sans">Fed Target & FOMC</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-extrabold text-foreground">{DEFAULT_FED_POLICY.targetRange}</span>
              <span className="text-xs text-bull font-bold">{DEFAULT_FED_POLICY.probCut}% Cut</span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">Next: {DEFAULT_FED_POLICY.nextFomcCountdownDays}D ({DEFAULT_FED_POLICY.nextFomcDate})</span>
          </div>

          {/* 7. AI Regime Score */}
          <div className="rounded-xl border border-gold/50 bg-gold/15 p-2.5 shadow-xs">
            <span className="text-[11px] text-gold font-bold block font-sans">AI Gold Regime Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gold">{regimeScore.totalScore}/100</span>
              <span className="text-xs font-black text-bull">{regimeScore.bias}</span>
            </div>
            <span className="text-[11px] text-muted-foreground block font-sans mt-0.5">Confidence: {regimeScore.confidence}%</span>
          </div>
        </div>

        {/* Global Market Sessions Active indicator */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2 text-[11px]">
          <span className="font-semibold text-muted-foreground">Sessions:</span>
          {activeSessions.map(s => (
            <span
              key={s.name}
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold flex items-center gap-1 ${
                s.active
                  ? 'border border-bull/40 bg-bull/15 text-bull'
                  : 'border border-border bg-secondary/30 text-muted-foreground'
              }`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.active ? 'bg-bull animate-ping' : 'bg-muted-foreground'}`} />
              <span>{s.name.split(' ')[0]}</span>
              <span className="text-[9px] opacity-80">({s.hours})</span>
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">
            ATR: ${prices.atr14D} · GSR: {prices.goldSilverRatio} · Realized Vol: {prices.realizedVol30D}%
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SCENARIO SIMULATOR BAR (Interactive State Switcher)                */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Interactive Market Scenario Simulation:</span>
          <span className="text-muted-foreground hidden sm:inline">Test how the 30-factor engine responds to live shifts.</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setScenarioPreset('LIVE_BULLISH')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              scenarioPreset === 'LIVE_BULLISH'
                ? 'border border-bull bg-bull/20 text-bull font-bold shadow-sm'
                : 'border border-border bg-card/60 text-muted-foreground hover:bg-card'
            }`}
          >
            🟢 Live Bullish (Real Yields Drop)
          </button>
          <button
            onClick={() => setScenarioPreset('BEARISH_BREAKDOWN')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              scenarioPreset === 'BEARISH_BREAKDOWN'
                ? 'border border-bear bg-bear/20 text-bear font-bold shadow-sm'
                : 'border border-border bg-card/60 text-muted-foreground hover:bg-card'
            }`}
          >
            🔴 Bearish Breakdown (Yields & DXY Spike)
          </button>
          <button
            onClick={() => setScenarioPreset('NEWS_LOCKOUT')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              scenarioPreset === 'NEWS_LOCKOUT'
                ? 'border border-amber-500 bg-amber-500/20 text-amber-400 font-bold shadow-sm'
                : 'border border-border bg-card/60 text-muted-foreground hover:bg-card'
            }`}
          >
            ⚠️ News Lockout (Pre-CPI / FOMC)
          </button>
          <button
            onClick={() => setScenarioPreset('RANGE_CHOP')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              scenarioPreset === 'RANGE_CHOP'
                ? 'border border-primary bg-primary/20 text-primary font-bold shadow-sm'
                : 'border border-border bg-card/60 text-muted-foreground hover:bg-card'
            }`}
          >
            ⚖️ Range Chop (Equilibrium)
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* MASTER NAVIGATION PILLS (30 SECTIONS ACCESSIBLE)                   */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="flex snap-x gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'DASHBOARD', label: '1. Main Dashboard', icon: '🌟' },
          { id: 'WHY_MOVING', label: '21. Why Is Gold Moving?', icon: '⚡' },
          { id: 'REGIME_SCORE', label: '19. AI Gold Regime Score (10 Pillars)', icon: '⚖️' },
          { id: 'AI_ANSWER', label: '20. AI Master Answer Format', icon: '📋' },
          { id: 'SMC_CHART', label: '17. SMC & Technical Chart', icon: '📈' },
          { id: 'MARKET_CYCLES', label: 'Market Cycles (6 Phases)', icon: '🔄' },
          { id: 'FLOWS_DERIVATIVES', label: '8-11. Sovereign, ETF & COT', icon: '🏛️' },
          { id: 'MACRO_CALENDAR', label: '6-7. Macro & Surprise Engine', icon: '📅' },
          { id: 'INDIA_MCX', label: '15. India / MCX Desk', icon: '🇮🇳' },
          { id: 'ANOMALIES_ALERTS', label: '22-23. Divergence & Alerts', icon: '🚨' },
          { id: 'RESEARCH_AUDIT', label: '24-28. Research, Checklist & Calculator', icon: '🔬' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabView)}
            className={`shrink-0 snap-start flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-gold bg-gold/15 text-gold shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MAIN DASHBOARD (SECTIONS 1-5 & 27 UI LAYOUT)                */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* Row 1: Timeframe Regimes & High Level Outlook (Section 1 & 18) */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Short Term (1D – 1W)</span>
                <span className="rounded bg-bull/15 px-2 py-0.5 text-xs font-mono font-bold text-bull">
                  {timeframeBiases.shortTerm.bias}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground">Score: {timeframeBiases.shortTerm.score}/100</p>
              <p className="text-xs text-muted-foreground">{timeframeBiases.shortTerm.reason}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Swing Horizon (1W – 3M)</span>
                <span className="rounded bg-bull/15 px-2 py-0.5 text-xs font-mono font-bold text-bull">
                  {timeframeBiases.swing.bias}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground">Score: {timeframeBiases.swing.score}/100</p>
              <p className="text-xs text-muted-foreground">{timeframeBiases.swing.reason}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Long Term Secular (6M – 5Y)</span>
                <span className="rounded bg-gold/15 px-2 py-0.5 text-xs font-mono font-bold text-gold">
                  {timeframeBiases.longTerm.bias}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground">Score: {timeframeBiases.longTerm.score}/100</p>
              <p className="text-xs text-muted-foreground">{timeframeBiases.longTerm.reason}</p>
            </div>
          </div>

          {/* Row 2: Live Chart + Why Gold is Moving Engine (Section 21 & 27) */}
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: TradingView Chart */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">TradingView Live Institutional Chart</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    TVC:GOLD · {chartTf}M
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  {(['15', '60', '240', 'D'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setChartTf(tf)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        chartTf === tf
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tf === 'D' ? '1D' : `${tf}m`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[460px] w-full overflow-hidden rounded-lg border border-border">
                <TradingViewWidget symbol="TVC:GOLD" theme="dark" autosize={true} />
              </div>
            </div>

            {/* Right: Section 21 'Why is Gold Moving?' Dedicated AI Panel */}
            <div className="rounded-xl border border-gold/40 bg-card p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-gold" />
                  <span className="text-xs font-bold text-gold font-sans uppercase">21 · Why Is Gold Moving?</span>
                </div>
                <span className="rounded bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                  LIVE DIAGNOSTIC
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
                  <span className="text-[10px] text-muted-foreground block font-sans">Price Move & Driver</span>
                  <p className="font-bold text-foreground mt-0.5">
                    {prices.spotChangePct >= 0 ? '▲ Up' : '▼ Down'} {Math.abs(prices.spotChangePct)}% (${prices.spotChange >= 0 ? '+' : ''}{prices.spotChange.toFixed(1)})
                  </p>
                  <p className="text-[11px] text-gold mt-1 font-sans">
                    <strong>Primary Driver:</strong> {scenarioPreset === 'BEARISH_BREAKDOWN' ? 'US Real Yield spike (+24 bps) & DXY breakout above 104.' : 'Real TIPS Yield compression to 1.62% combined with DXY breaking below 102.50 support.'}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    <strong>Secondary Driver:</strong> {scenarioPreset === 'BEARISH_BREAKDOWN' ? 'Institutional profit taking following multi-week run' : 'Central bank floor accumulation & Strait of Hormuz conflict hedge.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded border border-border bg-secondary/20 p-2">
                    <span className="text-[10px] text-muted-foreground block font-sans">DXY Factor:</span>
                    <span className="font-semibold text-foreground">{dxy.dxyLive} ({dxy.dxyChange1D}%)</span>
                  </div>
                  <div className="rounded border border-border bg-secondary/20 p-2">
                    <span className="text-[10px] text-muted-foreground block font-sans">10Y Yield Factor:</span>
                    <span className="font-semibold text-foreground">{yields.us10Y}% (Real: {yields.tipsRealYield10Y}%)</span>
                  </div>
                  <div className="rounded border border-border bg-secondary/20 p-2">
                    <span className="text-[10px] text-muted-foreground block font-sans">Fed Odds:</span>
                    <span className="font-semibold text-bull">{DEFAULT_FED_POLICY.probCut}% Cut Probability</span>
                  </div>
                  <div className="rounded border border-border bg-secondary/20 p-2">
                    <span className="text-[10px] text-muted-foreground block font-sans">ETF Inflows:</span>
                    <span className="font-semibold text-bull">+{DEFAULT_ETF_FLOWS.weeklyFlowTonnes}t WoW</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-2.5 font-sans space-y-1.5 text-xs">
                  <p className="font-bold text-foreground text-[11px]">AI Synthesis & Mechanics:</p>
                  <p className="text-muted-foreground text-[11px]">
                    • <strong>What Changed:</strong> Disinflation in latest CPI release weakened USD interest rate differential, accelerating Treasury buying.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    • <strong>Who Moved First:</strong> US 2Y and 10Y Yields dipped 20 minutes prior to bullion expansion, followed by London Judas sweep of Asian lows.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    • <strong>Regime Nature:</strong> Structural tailwind supported by sovereign reserves; not a transient retail spike.
                  </p>
                  <p className="text-bull text-[11px]">
                    • <strong>Confirmation:</strong> Hold above $4,108 London POC confirms continuation towards $4,148 resistance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: 12 Major Factors Grid (Infographic 1) */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span>📊</span> 12 Major Gold Drivers Matrix (Infographic 1 Master Framework)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Gold ko samajhne ke liye sirf chart nahi, ye 12 factors dekhne hote hain (Formula: Macro + Chart + Sentiment + Supply/Demand)
                </p>
              </div>
              <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                12 CONFLUENCE PILLARS
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 font-mono text-xs">
              {[
                { num: 1, title: 'Interest Rate', status: 'Rate ↓ → Gold ↑', current: `${DEFAULT_FED_POLICY.targetRange} (Cutting)`, tone: 'bull', rule: 'Lower rates decrease holding cost of non-yielding bullion.' },
                { num: 2, title: 'US Dollar Index', status: 'DXY ↓ → Gold ↑', current: `${dxy.dxyLive} (${dxy.dxyChange1D}%)`, tone: dxy.dxyChange1D < 0 ? 'bull' : 'bear', rule: 'Dollar weak hone se Gold international buyers ke liye cheap hota hai.' },
                { num: 3, title: '10-Year Bond Yield', status: 'Yield ↓ → Gold ↑', current: `${yields.us10Y}% (Real ${yields.tipsRealYield10Y}%)`, tone: 'bull', rule: 'Bond yields badhne par capital bonds me shift hota hai.' },
                { num: 4, title: 'CPI Inflation', status: 'Inflation ↑ → Gold ↑', current: '3.1% Core CPI', tone: 'bull', rule: 'Inflation hedge asset ke roop me Gold attractive ban jata hai.' },
                { num: 5, title: 'PCE Inflation', status: 'Core PCE 2.5%', current: 'Cooling towards 2%', tone: 'bull', rule: "Fed ka favorite inflation data — soft print rate cut confirm karta hai." },
                { num: 6, title: 'NFP Employment', status: 'Weak NFP → Gold ↑', current: '142K (Softening)', tone: 'bull', rule: 'US jobs data cooling Fed ko aggressive easing par majboor karta hai.' },
                { num: 7, title: 'GDP Growth', status: 'Moderate Growth', current: '2.3% Real GDP', tone: 'neutral', rule: 'Economic stability without overheating keeps gold bid strong.' },
                { num: 8, title: 'Geopolitics', status: 'Tension ↑ → Gold ↑', current: 'Risk Score 78/100', tone: 'bull', rule: 'War, sanctions aur reserve weaponization safe-haven demand laate hain.' },
                { num: 9, title: 'Central Bank Buying', status: 'Massive Accumulation', current: '+1,045 Tonnes/Yr', tone: 'bull', rule: 'Central banks Gold kharidenge toh dip par solid structural floor rehta hai.' },
                { num: 10, title: 'Supply & Demand', status: 'Mine Growth < 1%', current: '3,650t Output', tone: 'bull', rule: 'Physical jewelry aur bar/coin demand rate badh rahi hai.' },
                { num: 11, title: 'Crude Oil', status: 'Brent $82.15', current: 'Elevated Energy', tone: 'bull', rule: 'Oil price ka asar broad inflation aur monetary safe haven par padta hai.' },
                { num: 12, title: 'Sentiment & Greed', status: 'Fear & Greed: 64', current: 'Moderate Greed', tone: 'neutral', rule: 'Market fear badhne par investors Gold ki taraf bhaagte hain.' }
              ].map(f => (
                <div key={f.num} className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">{f.num}. {f.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${f.tone === 'bull' ? 'bg-bull/20 text-bull' : f.tone === 'bear' ? 'bg-bear/20 text-bear' : 'bg-secondary text-muted-foreground'}`}>
                      {f.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground">{f.current}</p>
                  <p className="text-[10px] text-muted-foreground font-sans line-clamp-2">{f.rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: SECTION 21 'WHY IS GOLD MOVING?' FULL VIEW                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'WHY_MOVING' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gold/40 bg-card p-4 space-y-4 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-gold font-sans">
                  Section 21 · Dedicated 'Why Is Gold Moving?' Live Diagnostic
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Auto-explains price causality, leading market moves, structural vs transient behavior, and confirmation criteria.
                </p>
              </div>
              <span className="rounded bg-gold/15 px-3 py-1 text-xs font-bold text-gold border border-gold/40">
                ACTIVE REGIME: {regimeScore.bias}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">Price Move Magnitude</span>
                <span className="text-xl font-bold text-foreground">
                  ${prices.spotXauUsd.toFixed(2)} ({prices.spotChangePct >= 0 ? '+' : ''}{prices.spotChangePct}%)
                </span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  Session range: ${prices.dailyLow} – ${prices.dailyHigh} (${prices.atr14D} ATR)
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">Primary Causal Driver</span>
                <span className="text-sm font-bold text-gold">US Real Yield Compression</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  10Y TIPS drop to 1.62% (-9 bps WoW) triggers systematic multi-asset reallocation.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">Secondary Driver</span>
                <span className="text-sm font-bold text-foreground">DXY Breakdown below 102.80</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  Broad dollar retreat lowers physical acquisition costs across Europe and Asia.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">Technical Order Flow Trigger</span>
                <span className="text-sm font-bold text-bull">London Sweep of Asian Low</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  $4,104 Asian liquidity swept followed by aggressive 15M Bullish Displacement.
                </p>
              </div>
            </div>

            {/* Natural language analytical breakdown */}
            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3 font-sans text-xs">
              <h3 className="text-sm font-bold text-foreground">Institutional Diagnostic Questions & Answers:</h3>

              <div className="space-y-1">
                <p className="font-bold text-gold">1. What changed since the previous session?</p>
                <p className="text-muted-foreground">
                  US disinflation metrics and softening employment indicators raised market-implied rate cut probability from 52% to 68%. Meanwhile, the PBoC and RBI confirmed continuous net additions to reserve vaults, eliminating down-side liquidation panic.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gold">2. Which market moved first?</p>
                <p className="text-muted-foreground">
                  US 2Y and 10Y Treasury futures rallied first (yields dropping), immediately followed by EUR/USD and GBP/USD pushing DXY lower. Bullion banks responded within 12 minutes by sweeping sell-side stops at $4,104 before driving spot price upward.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gold">3. Is this move macro, flow, technical, or headline driven?</p>
                <p className="text-muted-foreground">
                  <strong>Macro + Institutional Flow:</strong> This is a confluence of macro rates easing and Western ETF inflows (+18.6 tonnes this week), backed by structural technical support at the 50-day EMA.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gold">4. Is the move temporary noise or structural?</p>
                <p className="text-bull">
                  <strong>STRUCTURAL:</strong> Backed by record sovereign reserves accumulation and a multi-year secular uptrend above the 200 EMA ($4,040).
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gold">5. What would confirm or reject this explanation?</p>
                <p className="text-muted-foreground">
                  <strong>Confirmation:</strong> Daily close holding above $4,120 Point of Control with expanding COMEX open interest.
                  <br />
                  <strong>Rejection:</strong> Reversal below $4,098 accompanied by sudden hawkish comments from Fed officials or a DXY surge back above 103.80.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: SECTION 19 AI GOLD REGIME SCORE (10 PILLARS)                */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REGIME_SCORE' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>⚖️</span> Section 19 · AI Gold Regime Score (10-Pillar Weighted Framework)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configurable weights across all 10 macroeconomic, sovereign, derivative and technical pillars. Score: 0–39 Bearish, 40–59 Neutral, 60–74 Moderately Bullish, 75–89 Bullish, 90–100 Strong Bullish.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs text-muted-foreground">Total Regime Score:</span>
                <span className="rounded bg-gold/20 px-3 py-1 text-lg font-black text-gold border border-gold/40">
                  {regimeScore.totalScore}/100 ({regimeScore.bias})
                </span>
              </div>
            </div>

            {/* Pillar Sliders & Rationale Grid */}
            <div className="grid gap-3 md:grid-cols-2">
              {currentPillars.map(pillar => (
                <div key={pillar.pillarId} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground font-sans">{pillar.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pillar.score >= 75 ? 'bg-bull/20 text-bull' : pillar.score >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-bear/20 text-bear'}`}>
                      Score: {pillar.score}/100 ({pillar.bias})
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden border border-border/60">
                    <div
                      className={`h-full ${pillar.score >= 75 ? 'bg-bull' : pillar.score >= 50 ? 'bg-amber-400' : 'bg-bear'}`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>

                  {/* Weight slider & quality tag */}
                  <div className="flex items-center justify-between pt-1 text-[11px] font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Configurable Weight:</span>
                      <input
                        type="range"
                        min="2"
                        max="35"
                        value={pillar.weightPct}
                        onChange={e => handleWeightChange(pillar.pillarId, parseInt(e.target.value))}
                        className="h-1.5 w-24 cursor-pointer accent-gold"
                      />
                      <span className="font-bold text-gold font-mono">{pillar.weightPct}%</span>
                    </div>
                    <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] text-muted-foreground">
                      Source: {pillar.dataQuality}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-sans border-t border-border/40 pt-1.5">
                    <strong>Rationale:</strong> {pillar.institutionalReason}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-muted-foreground font-sans flex items-center justify-between">
              <span>
                💡 <strong>Transparent Algorithm:</strong> In accordance with Section 19, the AI never hides calculation behind a single unexplained number. Every pillar provides its raw score, individual weighting, and institutional causal rationale.
              </span>
              <button
                onClick={() => setPillarWeights(INITIAL_PILLAR_WEIGHTS)}
                className="shrink-0 ml-3 rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:bg-secondary cursor-pointer"
              >
                Reset Weights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: SECTION 20 AI MASTER ANSWER FORMAT                          */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'AI_ANSWER' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-gold font-sans">
                  Section 20 · Standard AI Answer Format (Copy-Paste Ready)
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Complete structured evidence report complying with Section 20 guidelines.
                </p>
              </div>
              <button
                onClick={() => {
                  const text = `GOLD AI SUMMARY\nCurrent Gold Price: $${prices.spotXauUsd}\nShort-Term Bias: ${timeframeBiases.shortTerm.bias}\nSwing Bias: ${timeframeBiases.swing.bias}\nLong-Term Bias: ${timeframeBiases.longTerm.bias}\nAI Gold Score: ${regimeScore.totalScore}/100\nConfidence: ${regimeScore.confidence}%`;
                  navigator.clipboard?.writeText(text);
                  alert('Gold AI Summary copied to clipboard!');
                }}
                className="rounded border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80 cursor-pointer"
              >
                📋 Copy Report
              </button>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3 font-sans">
              <div className="border-b border-border/60 pb-2">
                <span className="text-xs font-black text-gold font-mono tracking-wider">GOLD AI SUMMARY</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px]">Current Gold Price:</span>
                    <p className="font-bold text-foreground text-sm">${prices.spotXauUsd.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Short-Term Bias:</span>
                    <p className="font-bold text-bull">{timeframeBiases.shortTerm.bias}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Swing Bias:</span>
                    <p className="font-bold text-bull">{timeframeBiases.swing.bias}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Long-Term Bias:</span>
                    <p className="font-bold text-gold">{timeframeBiases.longTerm.bias}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 font-mono text-xs">
                  <span>AI Gold Score: <strong className="text-gold">{regimeScore.totalScore}/100</strong></span>
                  <span>Confidence: <strong className="text-bull">{regimeScore.confidence}%</strong></span>
                </div>
              </div>

              {/* Top 5 Bullish & Bearish Factors */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-bull text-xs flex items-center gap-1">
                    <span>🟢</span> Top 5 Bullish Factors:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                    <li>10Y TIPS Real Yield drop to 1.62% (-9 bps WoW) minimizes non-yielding holding cost.</li>
                    <li>Sovereign central banks (PBoC, RBI, Turkey) accumulating &gt;1,000 tonnes annually.</li>
                    <li>DXY trading below 20/50/200-day moving averages (102.42, -0.31%).</li>
                    <li>Western physical Gold ETFs show 4 consecutive weeks of net vault inflows (+18.6t).</li>
                    <li>Global M2 liquidity expanded +5.4% YoY to $104.8 Trillion.</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-bear text-xs flex items-center gap-1">
                    <span>🔴</span> Top 5 Bearish Factors / Headwinds:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                    <li>CFTC Managed Money net long positioning at 76th percentile (elevated long exposure).</li>
                    <li>High nominal price ($4,125+) causes slight consumer pushback on retail Indian jewelry.</li>
                    <li>US ISM Manufacturing PMI briefly printed above 50 (50.3), showing resilient industry.</li>
                    <li>Potential transient risk of hawkish Fed surprises if US wage growth accelerates.</li>
                    <li>Gold/Silver ratio compressed to 73.2, indicating industrial beta competition from silver.</li>
                  </ol>
                </div>
              </div>

              {/* Catalysts, Risks, S/R */}
              <div className="border-t border-border/60 pt-3 grid gap-2 sm:grid-cols-2 text-xs">
                <div>
                  <p><strong>Biggest Catalyst:</strong> March 18 FOMC rate cut confirmation and revised dot-plot projection.</p>
                  <p className="mt-1"><strong>Biggest Risk:</strong> Unexpected upside spike in US Core PCE inflation forcing Fed hawkish pause.</p>
                </div>
                <div>
                  <p><strong>Key Support:</strong> $4,098 (1H Bullish BOS & Asian low demand block) / $4,048 (50 EMA).</p>
                  <p className="mt-1"><strong>Key Resistance:</strong> $4,148 (Previous Weekly High) / $4,210 (All-Time High).</p>
                </div>
              </div>

              {/* Invalidation & Conclusion */}
              <div className="border-t border-border/60 pt-2 space-y-1.5 text-xs">
                <p>
                  <strong>What would invalidate the current thesis?</strong>
                  <br />
                  <span className="text-muted-foreground">
                    A sustained 4H candle close below $4,098 coupled with DXY rebounding firmly above 104.20 and TIPS yields surging beyond 2.05%.
                  </span>
                </p>
                <p>
                  <strong>What data changed since previous update?</strong>
                  <br />
                  <span className="text-muted-foreground">
                    US Jobless Claims came in at 218K, Western ETFs reported an additional +4.2 tonnes daily deposit, and Asian session liquidity sweep confirmed strong institutional bid.
                  </span>
                </p>
                <div className="rounded border border-bull/30 bg-bull/10 p-2 text-bull font-bold">
                  Conclusion: BULLISH (Targeting $4,148 and $4,210 with anchored stops below $4,098)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: SECTION 17 SMC & TECHNICAL MARKET STRUCTURE                 */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SMC_CHART' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>📈</span> Section 17 & Infographic 3 · SMC Market Structure & Liquidity Sweeps
                </h2>
                <p className="text-xs text-muted-foreground">
                  Read the Market Story, Not Just the Price: HH/HL, BOS Continuation, CHOCH Reversal & ICT Judas Sweeps.
                </p>
              </div>
              <span className="rounded bg-bull/15 px-3 py-1 text-xs font-mono font-bold text-bull border border-bull/40">
                STRUCTURE: {DEFAULT_TECHNICAL_SMC.marketStructure}
              </span>
            </div>

            {/* Structure Summary Grid (Infographic 3) */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
              <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-3.5 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground block font-sans">Market Structure</span>
                <span className="text-sm font-black text-bull mt-0.5 block">Higher Highs & Higher Lows</span>
                <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
                  Uptrend confirmed on Weekly, Daily & 4H. Buy pullbacks in discount zones.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-3.5 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground block font-sans">Break of Structure (BOS)</span>
                <span className="text-sm font-black text-bull mt-0.5 block">Bullish BOS at $4,098</span>
                <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
                  Trend continuation confirmed with displacement and volume expansion.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-3.5 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground block font-sans">Change of Character (CHOCH)</span>
                <span className="text-sm font-black text-foreground mt-0.5 block">No Bearish CHOCH</span>
                <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
                  Prior Higher Low at $4,098 remains completely defended by buyers.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-3.5 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground block font-sans">Liquidity Sweep (Stop Hunt)</span>
                <span className="text-sm font-black text-gold mt-0.5 block">Asian Low Swept & Rejected</span>
                <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
                  London opened with sweep of $4,104 Asian low, trapping breakout sellers.
                </p>
              </div>
            </div>

            {/* Fair Value Gaps & Moving Averages */}
            <div className="grid gap-3 sm:grid-cols-2 font-mono text-xs">
              <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-3.5 space-y-2 shadow-xs">
                <h4 className="font-bold text-foreground text-xs font-sans">Institutional Fair Value Gaps (FVG):</h4>
                <div className="p-2 rounded-lg bg-card border border-border/80 space-y-1">
                  <p className="text-bull text-xs font-bold">
                    Bullish Demand FVG: <span className="font-mono">{DEFAULT_TECHNICAL_SMC.fvgZoneBullish}</span>
                  </p>
                  <p className="text-bear text-xs font-bold">
                    Bearish Supply Pool: <span className="font-mono">{DEFAULT_TECHNICAL_SMC.fvgZoneBearish}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-sans pt-0.5 leading-relaxed">
                  Algorithmic market makers balance liquidity voids before expanding towards external liquidity.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/80 dark:bg-secondary/40 p-3.5 space-y-2 shadow-xs">
                <h4 className="font-bold text-foreground text-xs font-sans">Key Moving Averages (EMA):</h4>
                <div className="grid grid-cols-2 gap-2 text-xs p-2 rounded-lg bg-card border border-border/80">
                  <span>20 EMA: <strong className="text-foreground">${DEFAULT_TECHNICAL_SMC.ema20}</strong></span>
                  <span>50 EMA: <strong className="text-foreground">${DEFAULT_TECHNICAL_SMC.ema50}</strong></span>
                  <span>100 EMA: <strong className="text-foreground">${DEFAULT_TECHNICAL_SMC.ema100}</strong></span>
                  <span>200 EMA: <strong className="text-foreground">${DEFAULT_TECHNICAL_SMC.ema200}</strong></span>
                </div>
                <p className="text-xs text-bull font-sans font-semibold pt-0.5">
                  ✓ Golden Stack confirmed: Price &gt; 20 &gt; 50 &gt; 100 &gt; 200 EMA.
                </p>
              </div>
            </div>

            {/* 10-Step Gold Analysis Process (Infographic 1) */}
            <div className="rounded-xl border border-border bg-secondary/60 dark:bg-secondary/40 p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <span>📋</span> Gold Analysis Process (10 Step by Step Checklist from Infographic 1):
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-5 font-sans pt-1">
                {[
                  { step: 1, text: 'Economic Calendar check karo' },
                  { step: 2, text: 'DXY trend & momentum check karo' },
                  { step: 3, text: 'US 10Y Bond Yield & TIPS dekho' },
                  { step: 4, text: 'Interest Rate & Fed comments dekho' },
                  { step: 5, text: 'CPI / PCE inflation data dekho' },
                  { step: 6, text: 'NFP jobs data dekho' },
                  { step: 7, text: 'Geopolitical news & conflict dekho' },
                  { step: 8, text: 'Central Bank Buying & ETF dekho' },
                  { step: 9, text: 'Weekly/Daily Gold Chart analyze karo' },
                  { step: 10, text: 'Final Bias banao (Long/Short/Wait)' }
                ].map(s => (
                  <div key={s.step} className="rounded-lg border border-border bg-card p-2.5 flex items-center gap-2 shadow-xs hover:border-gold/50 transition-all">
                    <span className="h-6 w-6 rounded-full bg-gold/15 text-gold border border-gold/40 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {s.step}
                    </span>
                    <span className="text-foreground text-xs font-medium">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: INFOGRAPHIC 4 MARKET CYCLES (6 PHASES)                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MARKET_CYCLES' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>🔄</span> Infographic 4 · Market Cycle 6 Phases (Bull & Bear Cycles)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Understand institutional market positioning across the entire 6-stage lifecycle.
                </p>
              </div>
              <span className="rounded bg-bull/20 px-3 py-1 text-xs font-mono font-bold text-bull border border-bull/40">
                ACTIVE PHASE: 3 · CONFIDENCE (Trend Continuation)
              </span>
            </div>

            {/* Bull Market 6 Phases */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-bull flex items-center gap-1.5">
                <span>🐂</span> Bull Market 6 Phases:
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 font-mono text-xs">
                {MARKET_CYCLE_PHASES.map(phase => (
                  <div
                    key={phase.phaseNumber}
                    className={`rounded-lg border p-3 space-y-2 transition-all ${
                      phase.currentMatch
                        ? 'border-gold bg-gold/15 shadow-md ring-1 ring-gold'
                        : 'border-border bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                        {phase.phaseNumber}
                      </span>
                      {phase.currentMatch && (
                        <span className="rounded bg-gold px-1.5 py-0.2 text-[9px] font-black text-black">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-foreground font-sans text-xs">{phase.name}</p>
                    <p className="text-[10px] text-muted-foreground font-sans line-clamp-3">
                      {phase.characteristics}
                    </p>
                    <div className="border-t border-border/40 pt-1.5">
                      <span className="text-[9px] text-gold font-sans block font-semibold">Institutional Play:</span>
                      <p className="text-[10px] text-foreground font-sans">{phase.institutionalAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bear Market 6 Phases */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h3 className="text-sm font-bold text-bear flex items-center gap-1.5">
                <span>🐻</span> Bear Market 6 Phases Reference (For Downtrends):
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 font-mono text-xs">
                {[
                  { num: 1, name: 'Euphoric Overextension', desc: 'Price pushes parabolically. Retail greed maximum.' },
                  { num: 2, name: 'Psychological Breakdown', desc: 'First important support breaks. Sentiment shifts to confusion.' },
                  { num: 3, name: 'Accelerated Repricing', desc: 'Fast down moves, heavy liquidations of late longs.' },
                  { num: 4, name: 'Liquidity Dehydration', desc: 'Low volume sideways grind with lower highs.' },
                  { num: 5, name: 'Capitulation Shock', desc: 'Panic selling, weak hands flush out, final bottom forms.' },
                  { num: 6, name: 'Stabilization & Reversal', desc: 'Smart money accumulates new base, new bull cycle starts.' }
                ].map(p => (
                  <div key={p.num} className="rounded-lg border border-border bg-secondary/20 p-2.5 space-y-1">
                    <span className="h-5 w-5 rounded-full bg-bear/20 text-bear flex items-center justify-center font-bold text-[10px]">
                      {p.num}
                    </span>
                    <p className="font-bold text-foreground font-sans text-xs">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-sans">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: SECTIONS 8-11 SOVEREIGN, ETF, CFTC & DERIVATIVES           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'FLOWS_DERIVATIVES' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Section 8: Central Bank Gold Demand */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                  <span>🏛️</span> 8 · Central Bank Gold Demand (Long-Term Core)
                </h3>
                <span className="rounded bg-bull/20 px-2 py-0.5 text-bull font-bold">
                  {DEFAULT_CENTRAL_BANK_GOLD.aiDemandTrend}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Monthly Purchases</span>
                  <span className="font-bold text-foreground">{DEFAULT_CENTRAL_BANK_GOLD.monthlyNetPurchasesTonnes} Tonnes</span>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Annual Net Total</span>
                  <span className="font-bold text-gold">{DEFAULT_CENTRAL_BANK_GOLD.annualNetPurchasesTonnes} Tonnes</span>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Historical Percentile</span>
                  <span className="font-bold text-bull">{DEFAULT_CENTRAL_BANK_GOLD.historicalPercentile}th Percentile</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground font-sans">Top Sovereign Accumulators:</span>
                {DEFAULT_CENTRAL_BANK_GOLD.topBuyers.map(b => (
                  <div key={b.country} className="flex items-center justify-between rounded border border-border/60 bg-secondary/20 px-2.5 py-1.5">
                    <span className="font-sans text-foreground">{b.flag} {b.country}</span>
                    <span>{b.tonnesHeld}t held (+{b.ytdAdditionsTonnes}t YTD · {b.reserveSharePct}% reserves)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 9: Gold ETF Flow Module */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                  <span>📦</span> 9 · Physical Gold ETF Flows (GLD / IAU)
                </h3>
                <span className="rounded bg-bull/20 px-2 py-0.5 text-bull font-bold">
                  Score: {DEFAULT_ETF_FLOWS.aiInstitutionalDemandScore}/100
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Total Vault Tonnes</span>
                  <span className="font-bold text-foreground">{DEFAULT_ETF_FLOWS.totalTonnesHeld}t</span>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Weekly Net Flow</span>
                  <span className="font-bold text-bull">+{DEFAULT_ETF_FLOWS.weeklyFlowTonnes}t</span>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Total AUM</span>
                  <span className="font-bold text-foreground">${DEFAULT_ETF_FLOWS.totalAumBillions}B</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground font-sans">Major ETF Vault Holdings:</span>
                {DEFAULT_ETF_FLOWS.majorHoldings.map(h => (
                  <div key={h.ticker} className="flex items-center justify-between rounded border border-border/60 bg-secondary/20 px-2.5 py-1.5">
                    <span className="font-sans text-foreground"><strong>{h.ticker}</strong> ({h.name})</span>
                    <span>{h.tonnes}t (${h.aumUsdB}B) <strong className="text-bull ml-1">{h.weeklyChange}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 10: CFTC / COT Positioning */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                  <span>📊</span> 10 · CFTC Commitments of Traders (COT)
                </h3>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-primary font-bold">
                  {DEFAULT_CFTC_COT.crowdedStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Managed Money Net Long</span>
                  <span className="font-bold text-foreground">{DEFAULT_CFTC_COT.managedMoneyNetContracts.toLocaleString()} contracts</span>
                  <span className="text-[10px] text-bull block">+{DEFAULT_CFTC_COT.weeklyNetChangeContracts} WoW</span>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Commercial Net Short</span>
                  <span className="font-bold text-bear">{DEFAULT_CFTC_COT.commercialNetContracts.toLocaleString()} contracts</span>
                  <span className="text-[10px] text-muted-foreground block">Bullion Bank Hedging</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground font-sans pt-1">
                <span>1Y Percentile: <strong>{DEFAULT_CFTC_COT.percentile1Y}%</strong></span>
                <span>3Y Percentile: <strong>{DEFAULT_CFTC_COT.percentile3Y}%</strong></span>
                <span>Extreme Reversal Alert: <strong className="text-bull">NONE</strong></span>
              </div>
            </div>

            {/* Section 11: Gold Derivatives & Options Greeks */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                  <span>🎲</span> 11 · Gold Derivatives & Options Greeks
                </h3>
                <span className="rounded bg-gold/20 px-2 py-0.5 text-gold font-bold">
                  {DEFAULT_DERIVATIVES.termStructureState}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Put / Call Ratio (PCR)</span>
                  <span className="font-bold text-bull">{DEFAULT_DERIVATIVES.putCallRatio} (Bullish Call Bias)</span>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="text-[10px] text-muted-foreground block font-sans">Implied Volatility (GVZ)</span>
                  <span className="font-bold text-foreground">{DEFAULT_DERIVATIVES.impliedVolatility}%</span>
                </div>
              </div>
              <div className="space-y-1 text-[11px] font-sans">
                <p>• <strong>Max Pain Strike:</strong> ${DEFAULT_DERIVATIVES.maxPainStrike} (Expiry magnet)</p>
                <p>• <strong>Open Interest Concentration:</strong> Calls at ${DEFAULT_DERIVATIVES.highestCallOiStrike} / Puts at ${DEFAULT_DERIVATIVES.highestPutOiStrike}</p>
                <p className="text-gold">• <strong>Volatility Skew:</strong> {DEFAULT_DERIVATIVES.volatilitySkew}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: SECTIONS 6-7, 12, 14 MACRO CALENDAR & COMMODITIES           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MACRO_CALENDAR' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>📅</span> Sections 6-7 · US Macro Economic Calendar & Surprise Engine
                </h3>
                <p className="text-xs text-muted-foreground">
                  Formula: Event Surprise = Actual − Forecast | Directional Fed, USD & Gold Impact
                </p>
              </div>
              <span className="rounded bg-primary/15 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                HIGH IMPACT RADAR
              </span>
            </div>

            {/* Calendar Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2.5">Date & Event</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Previous</th>
                    <th className="p-2.5">Forecast</th>
                    <th className="p-2.5">Actual</th>
                    <th className="p-2.5">Surprise</th>
                    <th className="p-2.5">Fed Impact</th>
                    <th className="p-2.5">Gold Read</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {DEFAULT_MACRO_CALENDAR.map(e => (
                    <tr key={e.id} className="hover:bg-secondary/20">
                      <td className="p-2.5">
                        <span className="font-bold text-foreground font-sans block">{e.event}</span>
                        <span className="text-[10px] text-muted-foreground">{e.dateStr}</span>
                      </td>
                      <td className="p-2.5 text-muted-foreground">{e.category}</td>
                      <td className="p-2.5">{e.previous}</td>
                      <td className="p-2.5">{e.forecast}</td>
                      <td className="p-2.5 font-bold text-foreground">{e.actual}</td>
                      <td className="p-2.5 font-bold text-bull">{e.surpriseValue}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.fedImpact === 'DOVISH' ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'}`}>
                          {e.fedImpact}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.goldImpact === 'BULLISH' ? 'bg-bull/20 text-bull' : 'bg-secondary text-muted-foreground'}`}>
                          {e.goldImpact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Global Liquidity & Oil Commodities (Sections 12 & 14) */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2 font-mono text-xs">
                <h4 className="font-bold text-foreground font-sans">12 · Global Liquidity M2 Telemetry:</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span>Global M2: <strong className="text-gold">${DEFAULT_GLOBAL_LIQUIDITY.globalM2Trillions}T (+{DEFAULT_GLOBAL_LIQUIDITY.globalM2YoYPct}%)</strong></span>
                  <span>US M2: <strong className="text-foreground">${DEFAULT_GLOBAL_LIQUIDITY.usM2Trillions}T</strong></span>
                  <span>China M2: <strong className="text-foreground">${DEFAULT_GLOBAL_LIQUIDITY.chinaM2Trillions}T</strong></span>
                  <span>Fed Balance: <strong className="text-foreground">${DEFAULT_GLOBAL_LIQUIDITY.fedBalanceSheetTrillionsUsd}T</strong></span>
                </div>
                <p className="text-[10px] text-bull font-sans">
                  Dollar Liquidity Trend: <strong>{DEFAULT_GLOBAL_LIQUIDITY.netDollarLiquidityTrend}</strong> (Supports monetary debasement hedge).
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2 font-mono text-xs">
                <h4 className="font-bold text-foreground font-sans">14 · Energy & Commodities Transmission:</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span>Brent Crude: <strong className="text-foreground">${DEFAULT_OIL_COMMODITIES.brentCrudePrice}</strong></span>
                  <span>Silver (XAG): <strong className="text-foreground">${DEFAULT_OIL_COMMODITIES.silverPrice}</strong></span>
                  <span>Copper: <strong className="text-foreground">${DEFAULT_OIL_COMMODITIES.copperPrice}</strong></span>
                  <span>Oil Vol (OVX): <strong className="text-foreground">{DEFAULT_OIL_COMMODITIES.oilVolatilityOvx}</strong></span>
                </div>
                <p className="text-[10px] text-muted-foreground font-sans">
                  {DEFAULT_OIL_COMMODITIES.crossAssetInflationTransmission}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 9: SECTION 15 INDIA / MCX GOLD DESK                           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'INDIA_MCX' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>🇮🇳</span> Section 15 · India / MCX Gold Module & RBI Reserves
                </h3>
                <p className="text-xs text-muted-foreground">
                  Domestic Indian pricing, USD/INR conversion dynamics, wedding season cycles, and import duties.
                </p>
              </div>
              <span className="rounded bg-gold/15 px-3 py-1 text-xs font-mono font-bold text-gold border border-gold/40">
                MCX 10G: ₹{DEFAULT_INDIA_MCX.mcxGold10g.toLocaleString()}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">USD / INR Exchange Rate</span>
                <span className="text-base font-bold text-foreground">₹{DEFAULT_INDIA_MCX.usdInrLive.toFixed(2)}</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  INR depreciation directly inflates landed gold price inside India.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">Import Duty Structure</span>
                <span className="text-base font-bold text-foreground">{DEFAULT_INDIA_MCX.importDutyPct}% Basic Customs</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  Lowered duty structure prevents smuggling and narrows domestic vs international parity.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">RBI Gold Vault Reserves</span>
                <span className="text-base font-bold text-gold">{DEFAULT_INDIA_MCX.rbiGoldReservesTonnes} Tonnes</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  10.2% of total foreign exchange reserves held in physical gold.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-[10px] text-muted-foreground block font-sans">Seasonal Demand Index</span>
                <span className="text-base font-bold text-bull">{DEFAULT_INDIA_MCX.seasonalDemandIndex}/100</span>
                <p className="text-[11px] text-muted-foreground mt-1 font-sans">
                  {DEFAULT_INDIA_MCX.seasonalPhaseName}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2 text-xs font-sans">
              <h4 className="font-bold text-foreground text-sm">Formula: International to MCX Gold Conversion</h4>
              <p className="text-muted-foreground font-mono text-xs">
                MCX Price (10g) = [(XAU/USD Spot × USD/INR) / 31.1035] × 10 × (1 + Customs Duty 6% + GST 3%) ± Domestic Premium/Discount
              </p>
              <p className="text-muted-foreground text-[11px]">
                Currently domestic spot is trading at a slight +0.12% premium over London parity due to robust festival and auspicious wedding bookings across Mumbai Zaveri Bazaar and southern retail hubs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 10: SECTIONS 22-23 ANOMALY & ALERT RADAR                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ANOMALIES_ALERTS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>🚨</span> Sections 22-23 · Real-Time Divergence & Anomaly Engine
                </h3>
                <p className="text-xs text-muted-foreground">
                  Automatically flags structural market anomalies where normal macro correlations break down.
                </p>
              </div>
              <span className="rounded bg-primary/20 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                7 RADAR FILTERS
              </span>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_ANOMALIES.map(anomaly => (
                <div
                  key={anomaly.id}
                  className={`rounded-lg border p-3 font-mono text-xs space-y-1 ${
                    anomaly.detected
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-border bg-secondary/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground font-sans">{anomaly.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${anomaly.detected ? 'bg-amber-500/20 text-amber-400' : 'bg-secondary text-muted-foreground'}`}>
                      {anomaly.detected ? 'DETECTED' : 'NORMAL (NOT DETECTED)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans">
                    <strong>Condition:</strong> {anomaly.condition}
                  </p>
                  <p className="text-[11px] text-foreground font-sans border-t border-border/40 pt-1">
                    <strong>AI Interpretation:</strong> {anomaly.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TAB 11: SECTIONS 24-28 RESEARCH, CHECKLIST & POSITION CALCULATOR   */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'RESEARCH_AUDIT' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Position Sizing Calculator */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <h3 className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                <span>🧮</span> Institutional Gold Position Sizer (Risk Management)
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans">
                Calculates precise contract volume based on strict capital percentage risk limits.
              </p>

              <div className="space-y-2">
                <div>
                  <label className="text-muted-foreground block text-[10px]">Account Capital ($):</label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={e => setAccountBalance(parseFloat(e.target.value) || 1000)}
                    className="w-full rounded border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground font-bold mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground block text-[10px]">Risk Per Trade (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={riskPercent}
                      onChange={e => setRiskPercent(parseFloat(e.target.value) || 0.5)}
                      className="w-full rounded border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block text-[10px]">Stop Loss Distance ($):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={stopLossDistance}
                      onChange={e => setStopLossDistance(parseFloat(e.target.value) || 5)}
                      className="w-full rounded border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground font-bold mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block text-[10px]">Contract Size:</label>
                  <select
                    value={contractType}
                    onChange={e => setContractType(e.target.value as any)}
                    className="w-full rounded border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground mt-1"
                  >
                    <option value="STANDARD_100OZ">Standard Contract (100 oz per lot)</option>
                    <option value="MINI_10OZ">Mini Contract (10 oz per lot)</option>
                    <option value="MICRO_1OZ">Micro / Spot (1 oz per lot)</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 space-y-1 text-[11px]">
                <p>Cash at Risk: <strong className="text-foreground">${positionSizing.cashAtRisk.toFixed(2)}</strong></p>
                <p className="text-sm font-bold text-gold">Suggested Position: {positionSizing.suggestedContracts} Contracts</p>
                <p className="text-muted-foreground">Total Notional Exposure: ${positionSizing.totalExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            {/* Section 28: 13-Point Long-Term Checklist */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <h3 className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                <span>📋</span> 28 · Final Long-Term Gold Checklist
              </h3>
              <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
                {LONG_TERM_GOLD_CHECKLIST.map((item, idx) => (
                  <div key={idx} className="rounded border border-border/60 bg-secondary/20 p-2 flex items-center justify-between text-[11px]">
                    <span className="font-sans text-foreground">{item.item}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status.includes('BULLISH') || item.status.includes('SUPPORTIVE') ? 'bg-bull/20 text-bull' : 'bg-secondary text-muted-foreground'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 26: 20 Core Database Tables Schema Viewer */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <span>🗄️</span> Section 26 · Database Schema Architecture (20 Core Collections)
            </h3>
            <p className="text-xs text-muted-foreground">
              Timestamped data persistence schema ensuring reliable replay and backtesting capabilities.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 font-mono text-xs">
              {DATABASE_TABLES_SCHEMA.map(t => (
                <div key={t.table} className="rounded border border-border bg-secondary/30 p-2 space-y-1">
                  <span className="font-bold text-gold">{t.table}</span>
                  <p className="text-[10px] text-muted-foreground font-sans line-clamp-2">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* FOOTER & COMPLIANCE DISCLAIMER (SECTION 29)                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-secondary/20 p-3 text-center text-[11px] text-muted-foreground font-sans">
        <p>
          ⚠️ <strong>Regulatory Disclaimer (Section 29):</strong> The Gold AI Market Intelligence Terminal provides analytical decision-support, econometric telemetry, and quantitative structure interpretation. It does not provide guaranteed forecasts or personalized financial advice. Real-time exchange and futures feeds operate via licensed third-party data providers.
        </p>
      </div>
    </div>
  );
};

export default GoldAiMarketIntelligenceView;
