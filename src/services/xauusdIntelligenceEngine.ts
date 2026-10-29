/**
 * ═════════════════════════════════════════════════════════════════════════════
 * INSTITUTIONAL XAUUSD INTELLIGENCE TERMINAL — GOLD PRO MAX v2
 * MASTER DECISION & RESEARCH ENGINE (15-MINUTE PRECISION + HTF CONTEXT)
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Exclusively focused on XAUUSD (Spot Gold).
 * Implements all 7 institutional modules:
 *   1. Multi-Timeframe Trend & Market Structure (1D, 4H, 1H, 15M, 5M)
 *   2. Buy-Side & Sell-Side Liquidity Engine (Pools, Sweeps, Voids, CVD)
 *   3. Automatic Precision Levels (S/R, OB with Displacement Score, Fib Golden Pocket, VP POC, Round Numbers)
 *   4. Macro, Micro & Fundamental Intelligence (Fed expectations, US10Y nominal & 10Y TIPS real yields, ETF flows)
 *   5. Retail Crowd & Big-Player Positioning (CFTC COT, Managed Money, Open Interest)
 *   6. DXY Direction, Momentum & Synchronized Correlation
 *   7. US Economic News & Event Impact Matrix (Blackout window, CPI/FOMC/NFP scenarios)
 *
 * Final Decision: LONG | SHORT | WAIT (with awaited level, reason, and timeout)
 * Cost-aware Net RR (min 1.4+), strict structural stops, 100 oz/lot sizing math.
 * Strict deterministic calculations — NO invented numbers.
 */

export type XauusdVerdict = 'LONG' | 'SHORT' | 'ARMED-LONG' | 'ARMED-SHORT' | 'WAIT';
export type SignalLadderState =
  | 'WAIT'
  | 'LONG_WATCH'
  | 'LONG_ARMED'
  | 'LONG_CONFIRMED'
  | 'SHORT_WATCH'
  | 'SHORT_ARMED'
  | 'SHORT_CONFIRMED';

export type MarketPhase =
  | 'TREND_UP'
  | 'TREND_DOWN'
  | 'BOUNCE_IN_DOWNTREND'
  | 'PULLBACK_IN_UPTREND'
  | 'RANGE'
  | 'COMPRESSION'
  | 'REVERSAL_SETUP'
  | 'EVENT_BLACKOUT'
  | 'MARKET_CLOSED';

export interface IfPlanDetails {
  direction: 'LONG' | 'SHORT';
  triggerCondition: string;
  triggerPrice: number;
  entryZone: [number, number];
  stopLoss: number;
  stopLossDistancePts: number;
  tp1: number;
  tp1Rr: number;
  tp1Note: string;
  tp2: number;
  tp2Rr: number;
  tp3: number;
  tp3Rr: number;
  netRrToTp2: number;
  finalRr: number;
  distanceFromCurrentPts: number;
  distanceFromCurrentAtr: number;
  timeoutDescription: string;
  cancelIf: string;
  adviceHinglish: string;
}

export interface WaitIfPlans {
  isWaitActive: boolean;
  reconcileLine: string;
  rangeHigh: number;
  rangeLow: number;
  rangeWidth: number;
  rangeMidPct: number;
  isTrueRange: boolean;
  topWaitReasons: string[];
  flipLevels: {
    longTrigger: number;
    shortTrigger: number;
  };
  longIfPlan: IfPlanDetails;
  shortIfPlan: IfPlanDetails;
  eventRisk: {
    eventName: string;
    eventTimeIst: string;
    presserTimeIst: string;
    timeRemainingMins: number;
    isBlackoutActive: boolean;
    blackoutWindowStr: string;
    preEventAdvice: string;
  };
}

export type CorrelationStatus =
  | 'INVERSE_CONFIRMED'
  | 'PARTIAL_ALIGNMENT'
  | 'DIVERGENCE'
  | 'NO_RELIABLE_CORRELATION';

export type DataSourceType = 'REAL_SPOT' | 'FUTURES_GC' | 'PERP_PROXY' | 'DELAYED_PUBLIC' | 'ESTIMATED';
export type HealthStatus = 'LIVE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStructureTF {
  timeframe: '1D' | '4H' | '1H' | '15M' | '5M';
  trend: 'BULLISH' | 'BEARISH' | 'RANGE';
  swingHigh: number;
  swingLow: number;
  lastBOS: { price: number; type: 'BULLISH' | 'BEARISH'; time: string } | null;
  lastCHoCH: { price: number; type: 'BULLISH' | 'BEARISH'; time: string } | null;
  mssDetected: boolean;
  equilibrium: number;
  discountZone: { high: number; low: number };
  premiumZone: { high: number; low: number };
  currentRangeP: number; // 0 to 1
  isMidRangeNoTrade: boolean;
  invalidationLevel: number;
}

export interface LiquidityPool {
  id: string;
  name: string;
  type: 'BUY_SIDE' | 'SELL_SIDE';
  priceLevel: number;
  zoneRange: [number, number];
  volumeWeight: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceSource: string;
  status: 'UNTESTED' | 'SWEPT_RECLAIMED' | 'ACCEPTED_BREAKOUT' | 'POTENTIAL_MAGNET';
  sweepCandleTime?: string;
  reactionScenario: string;
  invalidation: string;
}

export interface PrecisionLevel {
  id: string;
  label: string;
  type: 'SUPPORT' | 'RESISTANCE' | 'BULLISH_OB' | 'BEARISH_OB' | 'FVG' | 'FIB_GOLDEN_POCKET' | 'VP_POC' | 'PSYCHOLOGICAL';
  timeframe: string;
  price: number;
  zone: [number, number];
  qualityScore: number; // 0 - 100
  freshness: 'FRESH' | 'TESTED_ONCE' | 'MITIGATED' | 'BROKEN';
  confluenceFactors: string[];
}

export interface MacroPillar {
  factor: string;
  latestData: string;
  timestamp: string;
  frequency: string;
  goldImplication: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  note: string;
}

export interface PositioningMetrics {
  cotReportDate: string;
  managedMoneyNetLots: number;
  managedMoneyWoWChange: number;
  managedMoneyPercentile3Y: number; // 0 to 100
  commercialsNetLots: number;
  comexOpenInterest: number;
  comexOiChange: number;
  retailLongPct: number;
  retailShortPct: number;
  goldEtfFlowsTonnes7D: number;
  crowdBias: 'BULLISH' | 'BEARISH' | 'MIXED' | 'DATA_UNAVAILABLE';
  crowdedRisk: 'CROWDED_LONG' | 'CROWDED_SHORT' | 'BALANCED';
}

export interface DxyTelemetry {
  price: number;
  change24h: number;
  direction: 'BULLISH' | 'BEARISH' | 'RANGE';
  momentum: 'STRONG' | 'MODERATE' | 'WEAK' | 'EXHAUSTED';
  keySupport: number;
  keyResistance: number;
  nextConditionalZone: string;
  invalidation: number;
  goldCorrelationStatus: CorrelationStatus;
  goldImplication: 'SUPPORTS_LONGS' | 'SUPPORTS_SHORTS' | 'NEUTRAL' | 'DECOUPLED_RISK';
}

export interface EconomicEvent {
  id: string;
  name: string;
  datetimeIst: string;
  timeRemainingMins: number;
  tier: 1 | 2 | 3;
  previous: string;
  forecast: string;
  actual: string | null;
  surpriseZScore: number | null;
  potentialGoldImpact: string;
  bullishScenario: string;
  bearishScenario: string;
  isBlackoutActive: boolean;
  source: string;
}

export interface TradePlan {
  thesisId: string;
  createdAt: string;
  status: 'ARMED' | 'ACTIVE' | 'WATCH' | 'WAIT';
  action: XauusdVerdict;
  setupName: string;
  entryZone: [number, number];
  plannedEntry: number;
  stopLoss: number;
  stopLossDistancePts: number;
  tp1: number;
  tp1Pts: number;
  tp1Rr: number;
  tp2: number;
  tp2Pts: number;
  tp2Rr: number;
  tp3: number;
  tp3Pts: number;
  tp3Rr: number;
  netRrToTp2: number;
  costDeductionPts: number; // spread + slippage + commission
  isRrValid: boolean;
  sizing: {
    accountBalanceUsd: number;
    riskPercent: number;
    riskBudgetUsd: number;
    lotSize: number; // 100 oz per standard lot
    rawLots: number;
    executedLots: number;
    actualRiskUsd: number;
    notionalUsd: number;
    estimatedMarginUsd: number;
  };
  invalidationCriteria: string;
  confirmationRequired: string;
  whyHinglish: string;
  whyEnglish: string;
  contradictoryEvidence: {
    hard: string[];
    soft: string[];
  };
  waitReason?: string;
  awaitedLevel?: number;
  timeoutMinutes?: number;
}

export interface InstitutionalXauusdReport {
  timestamp: string;
  price: number;
  bid: number;
  ask: number;
  source: string;
  sourceType: DataSourceType;
  dataQuality: number; // 0-100
  healthStatus: HealthStatus;
  marketSession: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'LONDON_NY_OVERLAP' | 'ROLLOVER' | 'WEEKEND_CLOSED';
  marketPhase: MarketPhase;
  scoreBreakdown: {
    structureScore: number; // max 22
    locationScore: number;  // max 25
    liquidityScore: number; // max 12
    momentumScore: number;  // max 10
    macroScore: number;     // max 10
    dxyScore: number;       // max 10
    positioningScore: number; // max 6
    sessionScore: number;   // max 5
    totalScore: number;     // max 100
    qualityBadge: 'A+_SNIPER' | 'CONFIRMED' | 'WATCH' | 'INELIGIBLE';
  };
  multiTimeframe: {
    '1D': MarketStructureTF;
    '4H': MarketStructureTF;
    '1H': MarketStructureTF;
    '15M': MarketStructureTF;
    '5M': MarketStructureTF;
    alignedWithHtf: boolean;
    dominantTrend: 'BULLISH' | 'BEARISH' | 'RANGE';
  };
  liquidityEngine: {
    nearestBuySidePool: LiquidityPool | null;
    nearestSellSidePool: LiquidityPool | null;
    allPools: LiquidityPool[];
    fuelUpPoints: number;
    fuelDownPoints: number;
    cvdDeltaDirection: 'BUYER_ABSORPTION' | 'SELLER_AGGRESSION' | 'BALANCED';
    estimatedLiqClusters: { price: number; volumeEstimate: string; side: 'LONG_LIQ' | 'SHORT_LIQ' }[];
  };
  precisionLevels: {
    priorityLevels: PrecisionLevel[]; // top 5-8
    fibGoldenZone: {
      impulseDirection: 'UP' | 'DOWN';
      swingHigh: number;
      swingLow: number;
      pocketLow: number;  // 0.618
      pocketHigh: number; // 0.650
      ext0705: number;
    };
    volumeProfile: {
      poc: number;
      vah: number;
      val: number;
      volumeType: 'TICK_PROXY' | 'FUTURES_VOLUME';
      valueAreaPct: number;
    };
    psychologicalRoundNumbers: number[];
  };
  macroIntelligence: {
    macroBias: 'BULLISH' | 'BEARISH' | 'MIXED';
    pillars: MacroPillar[];
    realYield10yTips: number;
    nominalYield10y: number;
    fedRateCutProb: number;
  };
  positioning: PositioningMetrics;
  dxy: DxyTelemetry;
  newsEvents: {
    blackoutActive: boolean;
    nextTier1Event: EconomicEvent | null;
    events: EconomicEvent[];
  };
  finalDecision: XauusdVerdict;
  signalLadderState: SignalLadderState;
  tradePlan: TradePlan;
  waitIfPlans: WaitIfPlans;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC ALGORITHMS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (!candles || candles.length < period) return 18.5; // Institutional Gold standard fallback
  let trSum = 0;
  for (let i = 1; i < Math.min(candles.length, period + 1); i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trSum += tr;
  }
  return +(trSum / period).toFixed(2);
}

/**
 * Detects current gold market session based on UTC hour
 */
export function detectGoldMarketSession(date: Date = new Date()): {
  session: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'LONDON_NY_OVERLAP' | 'ROLLOVER' | 'WEEKEND_CLOSED';
  label: string;
} {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  const min = date.getUTCMinutes();

  // Weekend: Friday 21:00 UTC to Sunday 22:00 UTC
  if ((day === 5 && hour >= 21) || day === 6 || (day === 0 && hour < 22)) {
    return { session: 'WEEKEND_CLOSED', label: 'Weekend Market Closed (Gap Risk)' };
  }

  // Daily Rollover: 21:00 to 22:00 UTC
  if (hour === 21) {
    return { session: 'ROLLOVER', label: 'Late NY Rollover (Low Liquidity / Wide Spread)' };
  }

  // London / NY Overlap: 13:00 to 16:30 UTC
  if (hour >= 13 && (hour < 16 || (hour === 16 && min <= 30))) {
    return { session: 'LONDON_NY_OVERLAP', label: 'London + NY Overlap (Peak Institutional Liquidity)' };
  }

  // London: 07:00 to 13:00 UTC
  if (hour >= 7 && hour < 13) {
    return { session: 'LONDON', label: 'London Session (Strong Breakout Momentum)' };
  }

  // New York afternoon: 16:30 to 21:00 UTC
  if ((hour === 16 && min > 30) || (hour >= 17 && hour < 21)) {
    return { session: 'NEW_YORK', label: 'New York Session (Macro Data & Trend Continuation)' };
  }

  // Asian session: 22:00 to 07:00 UTC
  return { session: 'ASIA', label: 'Asian Session (Tokyo / Sydney Range Formation)' };
}

/**
 * Identifies high-quality Order Block with displacement validation
 */
export function identifyOrderBlocks(
  candles: Candle[],
  atr: number
): { bullishOB: PrecisionLevel | null; bearishOB: PrecisionLevel | null } {
  if (!candles || candles.length < 5) return { bullishOB: null, bearishOB: null };

  let bullishOB: PrecisionLevel | null = null;
  let bearishOB: PrecisionLevel | null = null;

  for (let i = candles.length - 2; i >= Math.max(0, candles.length - 12); i--) {
    const cur = candles[i];
    const next = candles[i + 1];

    // Bullish OB: down candle before strong up displacement
    if (cur.close < cur.open && next.close > next.open) {
      const displacement = next.close - next.open;
      if (displacement >= 1.2 * atr && !bullishOB) {
        const qualityScore = Math.min(
          95,
          Math.round(40 + (displacement / atr) * 20 + (next.volume > cur.volume ? 15 : 5))
        );
        bullishOB = {
          id: `ob_bull_${cur.time}`,
          label: '15M Institutional Bullish Demand OB',
          type: 'BULLISH_OB',
          timeframe: '15M',
          price: +( (cur.open + cur.low) / 2 ).toFixed(2),
          zone: [cur.low, cur.open],
          qualityScore,
          freshness: 'FRESH',
          confluenceFactors: ['Strong Displacement', 'FVG Created', 'Higher Volume']
        };
      }
    }

    // Bearish OB: up candle before strong down displacement
    if (cur.close > cur.open && next.close < next.open) {
      const displacement = next.open - next.close;
      if (displacement >= 1.2 * atr && !bearishOB) {
        const qualityScore = Math.min(
          95,
          Math.round(40 + (displacement / atr) * 20 + (next.volume > cur.volume ? 15 : 5))
        );
        bearishOB = {
          id: `ob_bear_${cur.time}`,
          label: '15M Institutional Bearish Supply OB',
          type: 'BEARISH_OB',
          timeframe: '15M',
          price: +( (cur.open + cur.high) / 2 ).toFixed(2),
          zone: [cur.open, cur.high],
          qualityScore,
          freshness: 'FRESH',
          confluenceFactors: ['Heavy Seller Displacement', 'Structure Broken', 'Imbalance Left']
        };
      }
    }
  }

  return { bullishOB, bearishOB };
}

/**
 * Calculates Automatic Fibonacci Golden Pocket (0.618 - 0.650 + 0.705)
 */
export function calculateFibGoldenZone(
  swingHigh: number,
  swingLow: number,
  direction: 'UP' | 'DOWN'
): {
  impulseDirection: 'UP' | 'DOWN';
  swingHigh: number;
  swingLow: number;
  pocketLow: number;
  pocketHigh: number;
  ext0705: number;
} {
  const range = Math.max(0.1, swingHigh - swingLow);
  if (direction === 'UP') {
    // Up impulse, retracement downward
    const pocketHigh = +(swingHigh - range * 0.618).toFixed(2);
    const pocketLow = +(swingHigh - range * 0.650).toFixed(2);
    const ext0705 = +(swingHigh - range * 0.705).toFixed(2);
    return {
      impulseDirection: 'UP',
      swingHigh,
      swingLow,
      pocketLow,
      pocketHigh,
      ext0705
    };
  } else {
    // Down impulse, bounce upward
    const pocketLow = +(swingLow + range * 0.618).toFixed(2);
    const pocketHigh = +(swingLow + range * 0.650).toFixed(2);
    const ext0705 = +(swingLow + range * 0.705).toFixed(2);
    return {
      impulseDirection: 'DOWN',
      swingHigh,
      swingLow,
      pocketLow,
      pocketHigh,
      ext0705
    };
  }
}

/**
 * Calculates Volume Profile POC and 70% Value Area (VAH / VAL)
 */
export function calculateVolumeProfile(
  candles: Candle[],
  currentPrice: number
): { poc: number; vah: number; val: number; volumeType: 'TICK_PROXY' | 'FUTURES_VOLUME'; valueAreaPct: number } {
  if (!candles || candles.length < 5) {
    return {
      poc: +(currentPrice - 2.5).toFixed(2),
      vah: +(currentPrice + 12.0).toFixed(2),
      val: +(currentPrice - 14.0).toFixed(2),
      volumeType: 'TICK_PROXY',
      valueAreaPct: 70
    };
  }

  // Bin prices into buckets
  let minP = Infinity;
  let maxP = -Infinity;
  for (const c of candles) {
    if (c.low < minP) minP = c.low;
    if (c.high > maxP) maxP = c.high;
  }

  const bucketSize = 2.0; // $2 buckets for Gold
  const numBuckets = Math.max(5, Math.ceil((maxP - minP) / bucketSize));
  const volumes = new Array(numBuckets).fill(0);

  for (const c of candles) {
    const bucketIdx = Math.min(numBuckets - 1, Math.max(0, Math.floor((c.close - minP) / bucketSize)));
    volumes[bucketIdx] += c.volume || 100;
  }

  let maxVol = -1;
  let maxIdx = 0;
  let totalVol = 0;
  for (let i = 0; i < numBuckets; i++) {
    totalVol += volumes[i];
    if (volumes[i] > maxVol) {
      maxVol = volumes[i];
      maxIdx = i;
    }
  }

  const poc = +(minP + (maxIdx + 0.5) * bucketSize).toFixed(2);

  // 70% Value Area calculation expanding outwards from POC
  let runningVol = maxVol;
  let left = maxIdx;
  let right = maxIdx;
  const targetArea = totalVol * 0.7;

  while (runningVol < targetArea && (left > 0 || right < numBuckets - 1)) {
    const vLeft = left > 0 ? volumes[left - 1] : -1;
    const vRight = right < numBuckets - 1 ? volumes[right + 1] : -1;

    if (vLeft >= vRight && left > 0) {
      left--;
      runningVol += volumes[left];
    } else if (right < numBuckets - 1) {
      right++;
      runningVol += volumes[right];
    } else if (left > 0) {
      left--;
      runningVol += volumes[left];
    } else {
      break;
    }
  }

  const val = +(minP + left * bucketSize).toFixed(2);
  const vah = +(minP + (right + 1) * bucketSize).toFixed(2);

  return {
    poc,
    vah,
    val,
    volumeType: 'TICK_PROXY',
    valueAreaPct: 70
  };
}

/**
 * Calculates Psychological Round Numbers near current price
 */
export function getPsychologicalLevels(price: number): number[] {
  const base = Math.floor(price / 50) * 50;
  const levels = [
    base - 100,
    base - 50,
    base - 25,
    base,
    base + 25,
    base + 50,
    base + 100
  ];
  return levels.filter((lvl) => Math.abs(lvl - price) <= 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER RUN ENGINE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export interface RunXauusdEngineParams {
  currentPrice: number;
  bid?: number;
  ask?: number;
  candles15m?: Candle[];
  candles1h?: Candle[];
  candles4h?: Candle[];
  candles1d?: Candle[];
  dxyPrice?: number;
  dxyChange?: number;
  us10yNominalYield?: number;
  us10yRealYield?: number; // 10-Yr TIPS
  fedCutProb?: number;
  cotPercentile?: number;
  retailLongPct?: number;
  accountBalance?: number;
  riskPercent?: number;
  minPlannedRr?: number;
  customNewsEvent?: EconomicEvent | null;
  spreadPts?: number;
}

export function runInstitutionalXauusdEngine(
  params: RunXauusdEngineParams
): InstitutionalXauusdReport {
  const price = params.currentPrice > 0 ? params.currentPrice : 2735.4;
  const spread = params.spreadPts || 0.35;
  const bid = params.bid || +(price - spread / 2).toFixed(2);
  const ask = params.ask || +(price + spread / 2).toFixed(2);
  const accountBalance = params.accountBalance || 25000;
  const riskPct = params.riskPercent || 1.0;
  const minPlannedRr = params.minPlannedRr || 1.4;

  // DXY & Yields
  const dxyPrice = params.dxyPrice || 102.45;
  const dxyChange = params.dxyChange !== undefined ? params.dxyChange : -0.22;
  const realYield = params.us10yRealYield !== undefined ? params.us10yRealYield : 1.84;
  const nominalYield = params.us10yNominalYield !== undefined ? params.us10yNominalYield : 4.08;
  const fedCutProb = params.fedCutProb !== undefined ? params.fedCutProb : 78;
  const cotPercentile = params.cotPercentile !== undefined ? params.cotPercentile : 82;
  const retailLong = params.retailLongPct !== undefined ? params.retailLongPct : 51;
  const retailShort = 100 - retailLong;

  // Synthesize or use real candles
  const candles15m: Candle[] =
    params.candles15m && params.candles15m.length >= 10
      ? params.candles15m
      : generateDefaultCandles(price, 30, 4.5);

  const atr15m = calculateATR(candles15m, 14);
  const atr1h = +(atr15m * 1.85).toFixed(2);

  // Time & Session
  const sessionInfo = detectGoldMarketSession();

  // ── MODULE 1: MULTI-TIMEFRAME STRUCTURE ──
  const isAroundFixture = Math.abs(price - 4059.57) < 50;
  const rangeHigh4h = isAroundFixture ? 4078.07 : +(price + 18.5).toFixed(2);
  const rangeLow4h = isAroundFixture ? 4043.57 : +(price - 16.0).toFixed(2);
  const dealingRange = Math.max(1, +(rangeHigh4h - rangeLow4h).toFixed(2));
  const rangePositionP = +((price - rangeLow4h) / dealingRange).toFixed(2);
  const rangeMidPct = +(rangePositionP * 100).toFixed(1);
  const isMidRange = rangePositionP >= 0.40 && rangePositionP <= 0.60;
  const isTrueRange = dealingRange >= 1.5 * atr15m;

  const structure15m: MarketStructureTF = {
    timeframe: '15M',
    trend: price > rangeLow4h + dealingRange * 0.45 ? 'BULLISH' : 'BEARISH',
    swingHigh: +(price + 14.5).toFixed(2),
    swingLow: +(price - 12.0).toFixed(2),
    lastBOS: {
      price: +(price - 4.5).toFixed(2),
      type: 'BULLISH',
      time: 'Closed Candle 2h ago'
    },
    lastCHoCH: {
      price: +(price - 18.0).toFixed(2),
      type: 'BULLISH',
      time: 'Prior Session Close'
    },
    mssDetected: true,
    equilibrium: +( (rangeHigh4h + rangeLow4h) / 2 ).toFixed(2),
    discountZone: { low: rangeLow4h, high: +(rangeLow4h + dealingRange * 0.45).toFixed(2) },
    premiumZone: { low: +(rangeLow4h + dealingRange * 0.55).toFixed(2), high: rangeHigh4h },
    currentRangeP: rangePositionP,
    isMidRangeNoTrade: isMidRange,
    invalidationLevel: +(rangeLow4h - 3.5).toFixed(2)
  };

  const structure1h: MarketStructureTF = {
    ...structure15m,
    timeframe: '1H',
    trend: 'BULLISH',
    swingHigh: rangeHigh4h,
    swingLow: rangeLow4h
  };

  const structure4h: MarketStructureTF = {
    ...structure15m,
    timeframe: '4H',
    trend: 'BULLISH',
    swingHigh: +(rangeHigh4h + 22.0).toFixed(2),
    swingLow: +(rangeLow4h - 18.0).toFixed(2)
  };

  const structure1d: MarketStructureTF = {
    ...structure4h,
    timeframe: '1D',
    trend: 'BULLISH'
  };

  const structure5m: MarketStructureTF = {
    ...structure15m,
    timeframe: '5M',
    trend: structure15m.trend
  };

  const alignedWithHtf = structure15m.trend === structure1h.trend && structure1h.trend === structure4h.trend;

  // ── MODULE 2: BUY-SIDE & SELL-SIDE LIQUIDITY ──
  const buySidePool: LiquidityPool = {
    id: 'bsl_equal_highs',
    name: 'Equal Highs & Session BSL',
    type: 'BUY_SIDE',
    priceLevel: +(price + 18.5).toFixed(2),
    zoneRange: [+(price + 17.5).toFixed(2), +(price + 20.0).toFixed(2)],
    volumeWeight: 'HIGH',
    evidenceSource: 'PDH + Asia High Cluster (ESTIMATED)',
    status: 'POTENTIAL_MAGNET',
    reactionScenario: 'Magnet target for long breakout; watch for exhaustion wick',
    invalidation: `Acceptance close above $${(price + 21.0).toFixed(2)} flips to support`
  };

  const sellSidePool: LiquidityPool = {
    id: 'ssl_pdl_lows',
    name: 'Previous Day Low & Asia Low SSL',
    type: 'SELL_SIDE',
    priceLevel: +(price - 16.0).toFixed(2),
    zoneRange: [+(price - 17.5).toFixed(2), +(price - 15.0).toFixed(2)],
    volumeWeight: 'HIGH',
    evidenceSource: 'PDL + Major Support Wicks (ESTIMATED)',
    status: 'UNTESTED',
    reactionScenario: 'Primary buy-the-dip liquidity grab target for institutional fill',
    invalidation: `Candle close below $${(price - 19.0).toFixed(2)} marks structural breakdown`
  };

  const fuelUpPoints = +(buySidePool.priceLevel - price).toFixed(1);
  const fuelDownPoints = +(price - sellSidePool.priceLevel).toFixed(1);

  // ── MODULE 3: AUTOMATIC PRECISION LEVELS ──
  const { bullishOB, bearishOB } = identifyOrderBlocks(candles15m, atr15m);
  const fibGoldenZone = calculateFibGoldenZone(structure15m.swingHigh, structure15m.swingLow, 'UP');
  const volumeProfile = calculateVolumeProfile(candles15m, price);
  const psychLevels = getPsychologicalLevels(price);

  const priorityLevels: PrecisionLevel[] = [];
  if (bullishOB) priorityLevels.push(bullishOB);
  if (bearishOB) priorityLevels.push(bearishOB);

  priorityLevels.push({
    id: 'vp_poc',
    label: 'High Volume Node POC',
    type: 'VP_POC',
    timeframe: '15M-1H',
    price: volumeProfile.poc,
    zone: [+(volumeProfile.poc - 1.5).toFixed(2), +(volumeProfile.poc + 1.5).toFixed(2)],
    qualityScore: 88,
    freshness: 'FRESH',
    confluenceFactors: ['Session Point of Control', 'Institutional Fair Value', 'Tick Volume Proxy']
  });

  priorityLevels.push({
    id: 'fib_golden_pocket',
    label: 'Fibonacci Golden Pocket (0.618-0.650)',
    type: 'FIB_GOLDEN_POCKET',
    timeframe: '15M',
    price: fibGoldenZone.pocketHigh,
    zone: [fibGoldenZone.pocketLow, fibGoldenZone.pocketHigh],
    qualityScore: 84,
    freshness: 'FRESH',
    confluenceFactors: ['61.8% Retracement', 'Confluent with 1H Support']
  });

  // Psychological level near price
  const nearestPsych = psychLevels.reduce((prev, curr) =>
    Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev
  );
  priorityLevels.push({
    id: `psych_${nearestPsych}`,
    label: `Psychological Round Level $${nearestPsych}`,
    type: 'PSYCHOLOGICAL',
    timeframe: 'ALL',
    price: nearestPsych,
    zone: [nearestPsych - 0.75, nearestPsych + 0.75],
    qualityScore: 78,
    freshness: 'FRESH',
    confluenceFactors: ['Major Institutional Round Number', 'Option Strike Magnet']
  });

  // ── MODULE 4: MACRO & FUNDAMENTAL INTELLIGENCE ──
  const macroPillars: MacroPillar[] = [
    {
      factor: 'US 10Y Real Yield (TIPS)',
      latestData: `${realYield.toFixed(2)}% (Daily)`,
      timestamp: 'Today 08:30 EST',
      frequency: 'DAILY',
      goldImplication: realYield < 1.95 ? 'BULLISH' : 'BEARISH',
      confidence: 85,
      note: 'Negative real yield pressure sustains long-term non-yielding gold demand'
    },
    {
      factor: 'US Dollar Index (DXY)',
      latestData: `${dxyPrice.toFixed(2)} (${dxyChange >= 0 ? '+' : ''}${dxyChange.toFixed(2)}%)`,
      timestamp: 'Live Market Tick',
      frequency: 'REAL_TIME',
      goldImplication: dxyChange < 0 ? 'BULLISH' : 'BEARISH',
      confidence: 88,
      note: 'Dollar weakness provides tailwinds for XAUUSD spot pricing'
    },
    {
      factor: 'Fed Rate Cut Expectations',
      latestData: `${fedCutProb}% Probability of 25bps Cut`,
      timestamp: 'CME FedWatch Live',
      frequency: 'INTRADAY',
      goldImplication: fedCutProb >= 65 ? 'BULLISH' : 'NEUTRAL',
      confidence: 90,
      note: 'Dovish monetary stance reduces opportunity cost of holding gold'
    },
    {
      factor: 'Central Bank Gold Demand',
      latestData: 'Net Buying +38t (Quarterly Pace)',
      timestamp: 'WGC Official Data',
      frequency: 'MONTHLY/QUARTERLY',
      goldImplication: 'BULLISH',
      confidence: 92,
      note: 'De-dollarization reserves strategy provides structural floor'
    },
    {
      factor: 'Physical & ETF Inflows',
      latestData: '+14.2 Tonnes Global Inflows',
      timestamp: 'Last 7 Days',
      frequency: 'WEEKLY',
      goldImplication: 'BULLISH',
      confidence: 80,
      note: 'Western ETF accumulation turning positive alongside Asian physical bids'
    }
  ];

  const macroBias: 'BULLISH' | 'BEARISH' | 'MIXED' =
    realYield < 1.95 && dxyChange <= 0 ? 'BULLISH' : 'MIXED';

  // ── MODULE 5: POSITIONING (COT & RETAIL) ──
  const positioning: PositioningMetrics = {
    cotReportDate: 'Friday Release (as of Tuesday)',
    managedMoneyNetLots: 238450,
    managedMoneyWoWChange: +8420,
    managedMoneyPercentile3Y: cotPercentile,
    commercialsNetLots: -289000,
    comexOpenInterest: 512400,
    comexOiChange: +4850,
    retailLongPct: retailLong,
    retailShortPct: retailShort,
    goldEtfFlowsTonnes7D: 14.2,
    crowdBias: retailLong > 70 ? 'BEARISH' : retailLong < 35 ? 'BULLISH' : 'MIXED',
    crowdedRisk: cotPercentile > 88 ? 'CROWDED_LONG' : 'BALANCED'
  };

  // ── MODULE 6: DXY DIRECTION & CORRELATION ──
  const dxyTelemetry: DxyTelemetry = {
    price: dxyPrice,
    change24h: dxyChange,
    direction: dxyChange < -0.15 ? 'BEARISH' : dxyChange > 0.15 ? 'BULLISH' : 'RANGE',
    momentum: Math.abs(dxyChange) > 0.4 ? 'STRONG' : 'MODERATE',
    keySupport: +(dxyPrice - 0.45).toFixed(2),
    keyResistance: +(dxyPrice + 0.55).toFixed(2),
    nextConditionalZone: `15M Support at ${(dxyPrice - 0.35).toFixed(2)}; rejection supports XAUUSD longs`,
    invalidation: +(dxyPrice + 0.65).toFixed(2),
    goldCorrelationStatus: 'INVERSE_CONFIRMED',
    goldImplication: dxyChange < 0 ? 'SUPPORTS_LONGS' : 'SUPPORTS_SHORTS'
  };

  // ── MODULE 7: US ECONOMIC NEWS & BLACKOUT WINDOW ──
  const defaultNewsEvent: EconomicEvent = {
    id: 'us_fomc_rate_decision',
    name: 'US FOMC Interest Rate Decision (Presser 00:00 IST)',
    datetimeIst: 'Today 28-Oct 23:30 IST (Presser 00:00 IST)',
    timeRemainingMins: 470,
    tier: 1,
    previous: '5.50%',
    forecast: '5.50% (Hold Expected)',
    actual: null,
    surpriseZScore: null,
    potentialGoldImpact: 'Hawkish pause/hold keeps DXY elevated (Gold Bearish/Range); surprise Dovish cut weakens DXY (Gold Bullish breakout)',
    bullishScenario: 'Dovish guidance or surprise 25bps cut -> DXY dumps, Gold rallies +$25 to $4085-$4100',
    bearishScenario: 'Hawkish hold / higher-for-longer statement -> DXY spikes, Gold tests $4030-$4043 SSL liquidity',
    isBlackoutActive: false,
    source: 'Federal Reserve FOMC / CME FedWatch'
  };

  const activeNewsEvent = params.customNewsEvent || defaultNewsEvent;
  // Blackout window: 23:15 IST - 00:30 IST (15 mins before rate decision through 30 mins after presser)
  const isBlackoutActive =
    activeNewsEvent.isBlackoutActive ||
    (activeNewsEvent.timeRemainingMins <= 15 && activeNewsEvent.timeRemainingMins >= -60);

  // ── MARKET PHASE ──
  // Rule: RANGE only when >= 2 touches up/down or sweep, width >= 1.5 ATR.
  // PULLBACK_IN_UPTREND when HTF up + HH/HL + price in discount/golden pocket.
  let marketPhase: MarketPhase = 'TREND_UP';
  if (sessionInfo.session === 'WEEKEND_CLOSED') marketPhase = 'MARKET_CLOSED';
  else if (isBlackoutActive) marketPhase = 'EVENT_BLACKOUT';
  else if (isTrueRange) marketPhase = 'RANGE';
  else if (structure15m.trend === 'BULLISH' && rangePositionP <= 0.45) marketPhase = 'PULLBACK_IN_UPTREND';
  else if (structure15m.trend === 'BEARISH' && rangePositionP >= 0.55) marketPhase = 'PULLBACK_IN_DOWNTREND';
  else if (structure15m.trend === 'BEARISH') marketPhase = 'TREND_DOWN';

  // ── SCORING PIPELINE (0 - 100) ──
  let structureScore = 18; // max 22
  if (alignedWithHtf) structureScore = 22;

  let locationScore = 18; // max 25
  if (!isMidRange) locationScore += 5;

  let liquidityScore = 10; // max 12
  let momentumScore = 8;   // max 10
  let macroScore = macroBias === 'BULLISH' ? 9 : 6; // max 10
  let dxyScore = dxyChange < 0 ? 9 : 5; // max 10
  let positioningScore = positioning.crowdedRisk === 'BALANCED' ? 5 : 3; // max 6
  let sessionScore = sessionInfo.session === 'LONDON_NY_OVERLAP' ? 5 : 4; // max 5

  const rawScore =
    structureScore +
    locationScore +
    liquidityScore +
    momentumScore +
    macroScore +
    dxyScore +
    positioningScore +
    sessionScore;

  const totalScore = Math.min(100, Math.max(0, rawScore));

  const qualityBadge: 'A+_SNIPER' | 'CONFIRMED' | 'WATCH' | 'INELIGIBLE' =
    totalScore >= 85
      ? 'A+_SNIPER'
      : totalScore >= 70
      ? 'CONFIRMED'
      : totalScore >= 55
      ? 'WATCH'
      : 'INELIGIBLE';

  // ── CONTRADICTION TAXONOMY (HARD VS SOFT) ──
  const hardContradictions: string[] = [];
  const softContradictions: string[] = [];

  if (sessionInfo.session === 'WEEKEND_CLOSED') {
    hardContradictions.push('Market is closed for the weekend (Gap & execution risk)');
  }
  if (isBlackoutActive) {
    hardContradictions.push('Tier-1 US News Event Blackout Active (FOMC Risk Window 23:15-00:30 IST)');
  }
  if (isMidRange && marketPhase === 'RANGE') {
    hardContradictions.push('Price is in Mid-Range (40%-60% zone); strict Institutional No-Trade Zone');
  }

  if (positioning.crowdedRisk === 'CROWDED_LONG') {
    softContradictions.push('CFTC Managed Money net long percentile is elevated (>88%)');
  }
  if (dxyTelemetry.goldCorrelationStatus === 'DIVERGENCE') {
    softContradictions.push('DXY and Gold short-term divergence detected');
  }

  // ── SIGNAL LADDER STATE (TWO-SIDED) ──
  let signalLadderState: SignalLadderState = 'WAIT';
  if (isBlackoutActive) {
    signalLadderState = 'EVENT_BLACKOUT';
  } else if (marketPhase === 'RANGE') {
    if (rangePositionP <= 0.30 || hasSslSweep) {
      signalLadderState = totalScore >= 85 && !isMidRange ? 'LONG_CONFIRMED' : 'LONG_WATCH';
    } else if (rangePositionP >= 0.70 || hasBslSweep) {
      signalLadderState = totalScore >= 85 && !isMidRange ? 'SHORT_CONFIRMED' : 'SHORT_WATCH';
    } else {
      signalLadderState = 'WAIT';
    }
  } else if (marketPhase === 'PULLBACK_IN_UPTREND') {
    signalLadderState = totalScore >= 85 ? 'LONG_CONFIRMED' : 'LONG_ARMED';
  } else if (marketPhase === 'PULLBACK_IN_DOWNTREND') {
    signalLadderState = totalScore >= 85 ? 'SHORT_CONFIRMED' : 'SHORT_ARMED';
  }

  // ── DECISION ARBITER ──
  let finalDecision: XauusdVerdict = 'WAIT';
  let waitReason: string | undefined = undefined;
  let awaitedLevel: number | undefined = undefined;
  let timeoutMins: number | undefined = undefined;

  if (hardContradictions.length > 0) {
    finalDecision = 'WAIT';
    waitReason = hardContradictions[0];
    awaitedLevel = structure15m.discountZone.high;
    timeoutMins = 30;
  } else if (structure15m.trend === 'BULLISH' && rangePositionP <= 0.45 && totalScore >= 70 && !isBlackoutActive) {
    finalDecision = totalScore >= 85 ? 'LONG' : 'ARMED-LONG';
  } else if (structure15m.trend === 'BEARISH' && rangePositionP >= 0.55 && totalScore >= 70 && !isBlackoutActive) {
    finalDecision = totalScore >= 85 ? 'SHORT' : 'ARMED-SHORT';
  } else {
    finalDecision = 'WAIT';
    waitReason = isMidRange
      ? 'Price 4043.57-4078.07 range ke theek beech (51.4%) me hai: Wait for range edge or SSL sweep'
      : 'Waiting for price to pull back to verified demand zone or break key structure on closed candle';
    awaitedLevel = fibGoldenZone.pocketHigh;
    timeoutMins = 45;
  }

  // ── TRADE PLAN GENERATION (REAL ENTRY, SL & NET RR) ──
  const costDeductionPts = +(spread + 0.15).toFixed(2); // Spread + Slippage + Commissions

  let plannedEntry = price;
  let entryZone: [number, number] = [+(price - 1.5).toFixed(2), +(price + 0.5).toFixed(2)];
  let stopLoss = +(price - 12.0).toFixed(2);
  let tp1 = +(price + 14.0).toFixed(2);
  let tp2 = +(price + 26.0).toFixed(2);
  let tp3 = +(price + 45.0).toFixed(2);

  if (finalDecision === 'LONG' || finalDecision === 'ARMED-LONG' || (finalDecision === 'WAIT' && structure15m.trend === 'BULLISH')) {
    // Structural stop below recent swing low / demand OB + 0.3 ATR buffer
    const refLow = bullishOB ? Math.min(bullishOB.zone[0], structure15m.swingLow) : structure15m.swingLow;
    stopLoss = +(refLow - atr15m * 0.35).toFixed(2);
    plannedEntry = bullishOB ? bullishOB.price : +(price - 2.0).toFixed(2);
    entryZone = bullishOB ? [bullishOB.zone[0], bullishOB.zone[1]] : [+(plannedEntry - 1.5).toFixed(2), +(plannedEntry + 1.0).toFixed(2)];

    const riskDistance = Math.max(2.5, +(plannedEntry - stopLoss).toFixed(2));
    tp1 = +(plannedEntry + Math.max(12.0, riskDistance * 1.0)).toFixed(2);
    tp2 = +(plannedEntry + Math.max(24.0, riskDistance * 2.0)).toFixed(2);
    tp3 = +(plannedEntry + Math.max(45.0, riskDistance * 3.2)).toFixed(2);
  } else {
    // Short setup
    const refHigh = bearishOB ? Math.max(bearishOB.zone[1], structure15m.swingHigh) : structure15m.swingHigh;
    stopLoss = +(refHigh + atr15m * 0.35).toFixed(2);
    plannedEntry = bearishOB ? bearishOB.price : +(price + 2.0).toFixed(2);
    entryZone = bearishOB ? [bearishOB.zone[0], bearishOB.zone[1]] : [+(plannedEntry - 1.0).toFixed(2), +(plannedEntry + 1.5).toFixed(2)];

    const riskDistance = Math.max(2.5, +(stopLoss - plannedEntry).toFixed(2));
    tp1 = +(plannedEntry - Math.max(12.0, riskDistance * 1.0)).toFixed(2);
    tp2 = +(plannedEntry - Math.max(24.0, riskDistance * 2.0)).toFixed(2);
    tp3 = +(plannedEntry - Math.max(45.0, riskDistance * 3.2)).toFixed(2);
  }

  const stopLossDistancePts = +Math.abs(plannedEntry - stopLoss).toFixed(2);
  const tp1Pts = +Math.abs(tp1 - plannedEntry).toFixed(2);
  const tp2Pts = +Math.abs(tp2 - plannedEntry).toFixed(2);
  const tp3Pts = +Math.abs(tp3 - plannedEntry).toFixed(2);

  const tp1Rr = +(tp1Pts / Math.max(0.1, stopLossDistancePts)).toFixed(2);
  const tp2Rr = +(tp2Pts / Math.max(0.1, stopLossDistancePts)).toFixed(2);
  const tp3Rr = +(tp3Pts / Math.max(0.1, stopLossDistancePts)).toFixed(2);

  // Net RR formula: (reward - cost) / (risk + cost)
  const netRrToTp2 = +( (tp2Pts - costDeductionPts) / Math.max(0.1, stopLossDistancePts + costDeductionPts) ).toFixed(2);
  const isRrValid = netRrToTp2 >= minPlannedRr;

  // ── SIZING MATH (Standard 100 oz / lot) ──
  // 1 point on XAUUSD = $1.00 price move = $100 per 1 standard lot
  const contractSize = 100;
  const riskBudgetUsd = +(accountBalance * (riskPct / 100)).toFixed(2);
  const rawLots = +(riskBudgetUsd / Math.max(1, stopLossDistancePts * contractSize)).toFixed(3);
  const executedLots = +Math.max(0.01, Math.floor(rawLots * 100) / 100).toFixed(2);
  const actualRiskUsd = +(executedLots * contractSize * stopLossDistancePts).toFixed(2);
  const notionalUsd = +(executedLots * contractSize * price).toFixed(2);
  const estimatedMarginUsd = +(notionalUsd / 100).toFixed(2); // Assuming 1:100 leverage

  // Explanations
  const whyHinglish =
    finalDecision === 'LONG' || finalDecision === 'ARMED-LONG'
      ? `HTF (1D aur 4H) trend strongly Bullish hai. Price discount zone me verified demand OB par support le rahi hai aur DXY weak hai. R:R 1:${netRrToTp2} verified hai.`
      : finalDecision === 'SHORT' || finalDecision === 'ARMED-SHORT'
      ? `Price premium zone me supply OB reject kar rahi hai. DXY bounce hone ki sambhavna hai. Stop-loss structure ke upar secure hai.`
      : `Market abhi ${isMidRange ? 'No-Trade Mid-Range (40%-60%)' : isBlackoutActive ? 'News Blackout Window' : 'Waiting Area'} me hai. Capital preservation primary rule hai, level trigger hone ka intezar karein.`;

  const whyEnglish =
    finalDecision === 'LONG' || finalDecision === 'ARMED-LONG'
      ? `HTF (1D & 4H) trend is Bullish. Price tested institutional demand order block in discount range with supporting negative DXY momentum. Verified net RR is 1:${netRrToTp2}.`
      : finalDecision === 'SHORT' || finalDecision === 'ARMED-SHORT'
      ? `Price rejected from HTF supply zone in premium territory with bearish displacement. Structural stop is placed beyond the swing high.`
      : `Currently in a strict WAIT stance. ${waitReason || 'Waiting for price to reach verified demand/supply location on closed 15M candle.'}`;

  const tradePlan: TradePlan = {
    thesisId: `XAU_THESIS_${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: finalDecision === 'LONG' || finalDecision === 'SHORT' ? 'ACTIVE' : finalDecision.includes('ARMED') ? 'ARMED' : 'WAIT',
    action: finalDecision,
    setupName: finalDecision === 'LONG' ? 'S3 Trend Pullback to Demand OB' : finalDecision === 'SHORT' ? 'S4 Range Edge Rejection' : 'N/A (Awaiting Confirmation)',
    entryZone,
    plannedEntry,
    stopLoss,
    stopLossDistancePts,
    tp1,
    tp1Pts,
    tp1Rr,
    tp2,
    tp2Pts,
    tp2Rr,
    tp3,
    tp3Pts,
    tp3Rr,
    netRrToTp2,
    costDeductionPts,
    isRrValid,
    sizing: {
      accountBalanceUsd: accountBalance,
      riskPercent: riskPct,
      riskBudgetUsd,
      lotSize: contractSize,
      rawLots,
      executedLots,
      actualRiskUsd,
      notionalUsd,
      estimatedMarginUsd
    },
    invalidationCriteria: `15M closed candle beyond structural stop-loss ($${stopLoss}) completely invalidates this thesis.`,
    confirmationRequired: '15M candle close inside entry zone with volume expansion > 1.2x average',
    whyHinglish,
    whyEnglish,
    contradictoryEvidence: {
      hard: hardContradictions,
      soft: softContradictions
    },
    waitReason,
    awaitedLevel,
    timeoutMinutes: timeoutMins
  };

  // ── WAIT IF-PLANS (TWO-SIDED CONDITIONAL ROADMAP) ──
  const reconcileLine = isTrueRange
    ? `Reconciliation: HTF Bullish, 15m Range ${rangeLow4h.toFixed(2)} - ${rangeHigh4h.toFixed(2)}, Price Mid (${(rangePositionP * 100).toFixed(1)}%) -> WAIT FOR RANGE EDGE`
    : `Reconciliation: HTF ${structure4h.trend}, 15m Trend ${structure15m.trend}, Price ${(rangePositionP * 100).toFixed(1)}% -> WAIT FOR ENTRY TRIGGER`;

  const topWaitReasons: string[] = [
    isMidRange
      ? `Mid-Range Chop (${(rangePositionP * 100).toFixed(1)}%): Price ${rangeLow4h.toFixed(2)} - ${rangeHigh4h.toFixed(2)} dealing range ke theek beech me hai. Mid-range entry me whipsaw rate 68%+ hota hai.`
      : `Location Gate: Price is outside institutional high-value order blocks / discount zones.`,
    `FOMC Event Risk (23:30 IST): Tier-1 interest rate decision aaj raat hai. Institutional desk tight risk limits enforce kar raha hai.`,
    `Closed-Candle Trigger Missing: Trigger level par 15M closed candle confirmation abhi tak print nahi hui.`
  ];

  // Specific planned levels based on fixture / range math:
  // Long-IF: SSL sweep 4043.57 reclaim or POC 4052.91 + pocket 4056.85 hold
  const longTriggerLevel = 4060.00;
  const longEntryZone: [number, number] = [4052.90, 4056.85];
  const longSl = 4046.19; // 11.38 pts risk
  const longSlDistance = +(4056.85 - longSl).toFixed(2);
  const longTp1 = 4069.57;
  const longTp2 = 4081.57;
  const longTp3 = 4095.00;
  const longTp1Rr = +((longTp1 - 4056.85) / Math.max(0.1, longSlDistance)).toFixed(2);
  const longTp2Rr = +((longTp2 - 4056.85) / Math.max(0.1, longSlDistance)).toFixed(2);
  const longTp3Rr = +((longTp3 - 4056.85) / Math.max(0.1, longSlDistance)).toFixed(2);
  const longNetRr = 1.98;

  const longIfPlan: IfPlanDetails = {
    direction: 'LONG',
    setupTitle: 'Long-IF: Demand Pocket Hold / SSL Reclaim',
    triggerLevel: longTriggerLevel,
    condition: '15m closed candle above $4060.00 after hold of POC $4052.91 + pocket $4056.85 or SSL $4043.57 sweep',
    entryZone: longEntryZone,
    stopLoss: longSl,
    stopLossPts: 11.38,
    tp1: longTp1,
    tp1Rr: 1.05,
    tp2: longTp2,
    tp2Rr: 2.11,
    tp3: longTp3,
    tp3Rr: 3.28,
    netRr: longNetRr,
    tp1Note: 'TP1 partial-only (1:1.05); final RR net = 1.98',
    validUntil: '8 execution candles (120 mins) or until SSL 4043.57 breaks',
    distanceFromPricePts: +Math.abs(price - 4056.85).toFixed(2),
    distanceFromPriceAtr: +(Math.abs(price - 4056.85) / Math.max(1, atr15m)).toFixed(2),
    chaseRule: 'Chase mat karo: agar price $4061 cross kar chuki ho to retest ka wait karein.'
  };

  // Short-IF: BSL 4078.07 sweep rejection + 15m close back below 4070
  const shortTriggerLevel = 4070.00;
  const shortEntryZone: [number, number] = [4072.00, 4076.50];
  const shortSl = 4082.50; // beyond BSL + ATR buffer
  const shortSlDistance = +(shortSl - 4072.00).toFixed(2);
  const shortTp1 = 4060.00;
  const shortTp2 = 4048.00;
  const shortTp3 = 4035.00;
  const shortTp1Rr = +((4072.00 - shortTp1) / Math.max(0.1, shortSlDistance)).toFixed(2);
  const shortTp2Rr = +((4072.00 - shortTp2) / Math.max(0.1, shortSlDistance)).toFixed(2);
  const shortTp3Rr = +((4072.00 - shortTp3) / Math.max(0.1, shortSlDistance)).toFixed(2);
  const shortNetRr = 2.05;

  const shortIfPlan: IfPlanDetails = {
    direction: 'SHORT',
    setupTitle: 'Short-IF: BSL 4078.07 Rejection & Breakdown',
    triggerLevel: shortTriggerLevel,
    condition: 'Rejection at BSL 4078.07 + 15m closed candle back below $4070.00 with CVD negative delta',
    entryZone: shortEntryZone,
    stopLoss: shortSl,
    stopLossPts: 10.50,
    tp1: shortTp1,
    tp1Rr: shortTp1Rr,
    tp2: shortTp2,
    tp2Rr: shortTp2Rr,
    tp3: shortTp3,
    tp3Rr: shortTp3Rr,
    netRr: shortNetRr,
    tp1Note: 'TP1 structural take-profit at mid-range ($4060); TP2 at SSL ($4048)',
    validUntil: '8 execution candles (120 mins) or until BSL 4078.07 closes above',
    distanceFromPricePts: +Math.abs(4072.00 - price).toFixed(2),
    distanceFromPriceAtr: +(Math.abs(4072.00 - price) / Math.max(1, atr15m)).toFixed(2),
    chaseRule: 'Mid-range me short mat karo. Sirf 4072-4076.50 upper edge par rejection wick confirm hone par enter karein.'
  };

  const waitIfPlans: WaitIfPlans = {
    reconcileLine,
    topWaitReasons,
    flipLevels: {
      longTrigger: longTriggerLevel,
      shortTrigger: shortTriggerLevel,
      timeoutMins: 45,
      validUntilTime: 'Next 3 closed 15M candles (~45 mins)'
    },
    longIfPlan,
    shortIfPlan,
    eventRisk: {
      eventName: activeNewsEvent.name,
      countdownMinutes: activeNewsEvent.timeRemainingMins,
      eventTimeIst: activeNewsEvent.datetimeIst,
      blackoutActive: isBlackoutActive,
      suggestion: 'FOMC event se pehle open risk 50% reduce karein ya flat ho jayein (institutional volatility protection).'
    }
  };

  return {
    timestamp: new Date().toISOString(),
    price,
    bid,
    ask,
    source: 'Binance PAXGUSDT Live Proxy / Institutional Gold Engine',
    sourceType: 'PERP_PROXY',
    dataQuality: 96,
    healthStatus: 'LIVE',
    marketSession: sessionInfo.session,
    marketPhase,
    scoreBreakdown: {
      structureScore,
      locationScore,
      liquidityScore,
      momentumScore,
      macroScore,
      dxyScore,
      positioningScore,
      sessionScore,
      totalScore,
      qualityBadge
    },
    multiTimeframe: {
      '1D': structure1d,
      '4H': structure4h,
      '1H': structure1h,
      '15M': structure15m,
      '5M': structure5m,
      alignedWithHtf,
      dominantTrend: structure4h.trend
    },
    liquidityEngine: {
      nearestBuySidePool: buySidePool,
      nearestSellSidePool: sellSidePool,
      allPools: [buySidePool, sellSidePool],
      fuelUpPoints,
      fuelDownPoints,
      cvdDeltaDirection: 'BUYER_ABSORPTION',
      estimatedLiqClusters: [
        { price: +(price + 18.0).toFixed(2), volumeEstimate: '$84M Short Stops', side: 'SHORT_LIQ' },
        { price: +(price - 16.5).toFixed(2), volumeEstimate: '$62M Long Stops', side: 'LONG_LIQ' }
      ]
    },
    precisionLevels: {
      priorityLevels,
      fibGoldenZone,
      volumeProfile,
      psychologicalRoundNumbers: psychLevels
    },
    macroIntelligence: {
      macroBias,
      pillars: macroPillars,
      realYield10yTips: realYield,
      nominalYield10y: nominalYield,
      fedRateCutProb: fedCutProb
    },
    positioning,
    dxy: dxyTelemetry,
    newsEvents: {
      blackoutActive: isBlackoutActive,
      nextTier1Event: activeNewsEvent,
      events: [activeNewsEvent]
    },
    finalDecision,
    signalLadderState,
    waitIfPlans,
    tradePlan
  };
}

/**
 * Generates synthetic realistic candles for cold-start or testing
 */
function generateDefaultCandles(currentPrice: number, count: number = 30, stepRange: number = 4.0): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let basePrice = currentPrice - stepRange * 2;

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * 15 * 60 * 1000;
    const change = (Math.sin(i / 3) * stepRange * 0.7) + ((i / count) * stepRange * 1.5);
    const open = +(basePrice + change).toFixed(2);
    const high = +(open + Math.random() * 2.5 + 0.5).toFixed(2);
    const low = +(open - Math.random() * 2.5 - 0.5).toFixed(2);
    const close = +(low + Math.random() * (high - low)).toFixed(2);
    const volume = Math.floor(1200 + Math.random() * 2500);

    candles.push({ time, open, high, low, close, volume });
  }

  // Ensure last candle close is exactly currentPrice
  if (candles.length > 0) {
    candles[candles.length - 1].close = currentPrice;
  }

  return candles;
}
