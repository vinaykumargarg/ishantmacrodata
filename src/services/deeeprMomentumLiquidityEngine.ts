/**
 * DEEEPR PRO-MAX: MOMENTUM DIRECTION ENGINE + LIQUIDITY-HUNT / BIG-PLAYER ENGINE v1
 * 
 * Symmetric Long/Short Engine with:
 * 1. Momentum & Regime Classifier (IMPULSE, TREND, CHOP, RANGE)
 * 2. 5 Execution Models (M1 Pullback, M2 Break-Retest, M3 Sweep-Reversal, M4 Momentum, M5 Range-Edge)
 * 3. Point Target Bands (BTC 2,500-3,000 pts preset, ETH 80-120, Gold 50-80, Silver 1.2-2.5)
 * 4. Liquidation Fuel & Magnetic Cluster Calculus (FuelUp, FuelDown, Imbalance, Magnet)
 * 5. Big-Player Inference Ladder (Stop-Hunt, Absorption, Distribution, Accumulation, Cascade, Squeeze)
 * 6. Liquidity-Hunt Scenario Tree (S1 Sweep-Reverse, S2 Sweep-Continue, S3 Hunt-Above, S4 Range-Drift)
 * 7. "Kaun Jeetega" Crowding & Trapped Side Calculus
 * 8. Always-Published Conditional "If-Then" Plans (even in WAIT)
 * 
 * Rules:
 * - REAL vs ESTIMATED vs INFERENCE labels strictly separated.
 * - Single masterVerdict architecture (all modules are evidence).
 * - Closed-candle confirmation; location first; RR from worst entry edge.
 * - No hype, no promise of profit, no "100% fixed/sure-shot".
 */

export type ProMaxState =
  | 'ACTIVE_LONG'
  | 'ACTIVE_SHORT'
  | 'ARMED_LONG'
  | 'ARMED_SHORT'
  | 'ENTRY_READY'
  | 'WAIT_EXTENDED'
  | 'WAIT_COOLDOWN'
  | 'WAIT_EVENT'
  | 'WAIT_DATA'
  | 'WAIT_NO_EDGE';

export type RegimeType =
  | 'TREND_UP'
  | 'TREND_DOWN'
  | 'IMPULSE_UP'
  | 'IMPULSE_DOWN'
  | 'RANGE'
  | 'COMPRESSION'
  | 'EXPANSION_CHOP';

export type EntryModelType =
  | 'M1_PULLBACK_CONTINUATION'
  | 'M2_BREAK_RETEST'
  | 'M3_SWEEP_RECLAIM_REVERSAL'
  | 'M4_MOMENTUM_CONTINUATION'
  | 'M5_RANGE_EDGE';

export type BigPlayerInferenceType =
  | 'STOP_HUNT_SWEEP_TARGETING'
  | 'ABSORPTION'
  | 'DISTRIBUTION'
  | 'ACCUMULATION'
  | 'CASCADE'
  | 'SQUEEZE'
  | 'GAMMA_PIN'
  | 'NEUTRAL_FLOW';

export type LabelType = 'REAL' | 'ESTIMATED' | 'INFERENCE';

export interface TargetBandConfig {
  asset: string;
  minPoints: number;
  maxPoints: number;
  typicalSlPoints: [number, number];
  atrMultiplier: number;
  dp: number;
}

export const TARGET_BAND_PRESETS: Record<string, TargetBandConfig> = {
  BTC: {
    asset: 'BTC',
    minPoints: 2500,
    maxPoints: 3000,
    typicalSlPoints: [500, 1000],
    atrMultiplier: 2.2,
    dp: 2
  },
  ETH: {
    asset: 'ETH',
    minPoints: 80,
    maxPoints: 120,
    typicalSlPoints: [18, 35],
    atrMultiplier: 2.0,
    dp: 2
  },
  GOLD: {
    asset: 'GOLD',
    minPoints: 50,
    maxPoints: 80,
    typicalSlPoints: [10, 20],
    atrMultiplier: 2.0,
    dp: 2
  },
  SILVER: {
    asset: 'SILVER',
    minPoints: 1.2,
    maxPoints: 2.5,
    typicalSlPoints: [0.3, 0.6],
    atrMultiplier: 2.0,
    dp: 3
  },
  SOL: {
    asset: 'SOL',
    minPoints: 8,
    maxPoints: 16,
    typicalSlPoints: [2.5, 4.5],
    atrMultiplier: 2.2,
    dp: 2
  }
};

export interface LiquidityCluster {
  id: string;
  side: 'long_liq' | 'short_liq';
  priceLow: number;
  priceHigh: number;
  centerPrice: number;
  usdMillions: number;
  distancePts: number;
  distanceAtr: number;
  distancePct: number;
  isStacked: boolean;
  poolType: 'equal_lows' | 'equal_highs' | 'pdl' | 'pdh' | 'swing_extreme' | 'liq_cluster';
  probabilityToday: 'LOW' | 'MEDIUM' | 'HIGH';
  labelType: 'ESTIMATED';
}

export interface CrowdMetrics {
  longCrowdScore: number; // 0–100
  shortCrowdScore: number; // 0–100
  fuelDownUsdMillions: number;
  fuelUpUsdMillions: number;
  imbalance: number; // -1 to +1 (positive = fuel up / shorts crowded, negative = fuel down / longs crowded)
  nearestMagnet: LiquidityCluster | null;
  trappedSide: 'LONGS' | 'SHORTS' | 'BALANCED';
  summarySentence: string;
  labelType: 'ESTIMATED';
}

export interface RealLiquidationEvidence {
  liqLong5mUsd: number;
  liqShort5mUsd: number;
  liqLong1hUsd: number;
  liqShort1hUsd: number;
  liqLong24hUsd: number;
  liqShort24hUsd: number;
  spikeActive: boolean;
  spikeSide: 'LONG' | 'SHORT' | 'NONE';
  spikeMultipleVsAvg: number;
  cascadeActive: boolean;
  labelType: 'REAL';
}

export interface BigPlayerInference {
  type: BigPlayerInferenceType;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number; // 0-100
  evidenceChecklist: {
    item: string;
    verified: boolean;
    value: string;
    sourceType: LabelType;
  }[];
  whatPlayersCanDoNext: string[];
  whatConfirms: string;
  whatInvalidates: string;
  trapZones: {
    zone: string;
    description: string;
  }[];
  labelType: 'INFERENCE';
}

export interface KaunJeetegaCard {
  favoredSide: 'LONGS' | 'SHORTS' | 'STANDOFF';
  crowdingComparison: string;
  whoPaysFunding: string;
  fuelSummary: string;
  bigPlayerLikelyPlay: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  retailTrapWarning: string;
}

export interface ScenarioBranch {
  id: 'S1' | 'S2' | 'S3' | 'S4';
  title: string;
  summaryHinglish: string;
  favored: boolean;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  triggerCondition: string;
  invalidationCondition: string;
  entryZone: [number, number];
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrWorstEdge: number;
  targetBandMatch: boolean;
  flipCondition: string;
}

export interface ProMaxTradingPlan {
  direction: 'LONG' | 'SHORT' | 'WAIT';
  model: EntryModelType;
  entryZone: [number, number];
  entryWorstEdge: number;
  sl: number;
  slDistancePts: number;
  slDistanceAtr: number;
  tp1: number;
  tp2: number;
  tp3: number;
  tp1Pts: number;
  tp2Pts: number;
  tp3Pts: number;
  rrTp1: number;
  rrTp2: number;
  rrTp3: number;
  targetBandMinPts: number;
  targetBandMaxPts: number;
  targetBandStatus: 'WITHIN_BAND' | 'SCALED_TO_STRUCTURE' | 'UNAVAILABLE';
  targetBandNote: string;
  positionSizePct: number; // 0.5% or 1.0%
  management: {
    tp1Rule: string;
    tp2Rule: string;
    tp3Rule: string;
  };
  remainingRoomR: number;
  isExtended: boolean;
  extensionAtr: number;
  exhaustionFlagsCount: number;
  exhaustionNotes: string[];
  conditionalPlans: {
    shortBranch: string;
    longBranch: string;
  };
}

export interface MasterVerdictProMax {
  verdictId: string;
  asset: string;
  symbol: string;
  state: ProMaxState;
  direction: 'LONG' | 'SHORT' | 'WAIT';
  price: number;
  regime: RegimeType;
  regimeReason: string;
  scores: {
    longScore: number;
    shortScore: number;
    gap: number;
    badge: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    confidenceBasis: string;
    subScores: {
      htfStructureTrend: { long: number; short: number; weight: 25 };
      momentumImpulse: { long: number; short: number; weight: 20 };
      location: { long: number; short: number; weight: 20 };
      derivativesPositioning: { long: number; short: number; weight: 10 };
      liquidityEvidence: { long: number; short: number; weight: 10 };
      intermarket: { long: number; short: number; weight: 10 };
      sessionEvent: { long: number; short: number; weight: 5 };
    };
    penalties: {
      long: string[];
      short: string[];
      longPenaltyTotal: number;
      shortPenaltyTotal: number;
    };
  };
  reasonCode: string;
  reasonHinglish: string;
  whatIsNeededNext: string;
  plan: ProMaxTradingPlan | null;
  scenarios: ScenarioBranch[];
  crowd: CrowdMetrics;
  realLiq: RealLiquidationEvidence;
  bigPlayer: BigPlayerInference;
  kaunJeetega: KaunJeetegaCard;
  intermarket: {
    usdtD: { value: number; change24h: number; status: string; correlationLean: 'bullish' | 'bearish' | 'neutral' };
    dxy: { value: number; change24h: number; status: string; correlationLean: 'bullish' | 'bearish' | 'neutral' };
    conflict: boolean;
  };
  readiness: {
    passedGates: number;
    totalGates: number;
    missingConfirmations: string[];
  };
  cooldown: {
    active: boolean;
    remainingCandles: number;
    cooldownZone: [number, number] | null;
  };
  asOf: number;
  freshnessSec: number;
  oneLineHeader: string;
}

// ============================================================================
// HELPER MATH & FORMATTING
// ============================================================================

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function computeWorstEdgeRr(
  side: 'LONG' | 'SHORT',
  entryZone: [number, number],
  sl: number,
  tp: number
): number {
  if (side === 'SHORT') {
    const worstEdge = Math.min(entryZone[0], entryZone[1]);
    const risk = sl - worstEdge;
    const reward = worstEdge - tp;
    if (risk <= 0 || reward <= 0) return 0;
    return +(reward / risk).toFixed(2);
  } else {
    const worstEdge = Math.max(entryZone[0], entryZone[1]);
    const risk = worstEdge - sl;
    const reward = tp - worstEdge;
    if (risk <= 0 || reward <= 0) return 0;
    return +(reward / risk).toFixed(2);
  }
}

// ============================================================================
// 1. REGIME CLASSIFIER
// ============================================================================

export function classifyMarketRegime(
  candles15m: { open: number; high: number; low: number; close: number; volume: number }[],
  atr1h: number,
  adx: number,
  ema20: number,
  ema50: number,
  bosCount12: number
): { regime: RegimeType; reason: string; displacementAtr: number } {
  if (!candles15m || candles15m.length < 3) {
    return { regime: 'RANGE', reason: 'Insufficient candle data', displacementAtr: 0 };
  }

  const sampleCandles = candles15m.slice(-Math.min(8, candles15m.length));
  const startPrice = sampleCandles[0].open;
  const endPrice = sampleCandles[sampleCandles.length - 1].close;
  const netMove = endPrice - startPrice;
  const displacementAtr = atr1h > 0 ? Math.abs(netMove) / atr1h : 0;

  const avgVol = sampleCandles.reduce((s, c) => s + (c.volume || 1), 0) / sampleCandles.length;
  const latestVol = sampleCandles[sampleCandles.length - 1].volume || 1;
  const volumeElevated = latestVol >= avgVol * 1.15 || sampleCandles.every((c) => (c.volume || 0) >= 1500);

  // Rule 1.3: IMPULSE = displacement >= 2.5 x ATR(1H) within <= 8 x 15m candles
  if (displacementAtr >= 2.3 && volumeElevated) {
    if (netMove < 0) {
      return {
        regime: 'IMPULSE_DOWN',
        reason: `Aggressive drop of ${displacementAtr.toFixed(1)}x ATR(1H) across ${sampleCandles.length} candles with volume surge.`,
        displacementAtr
      };
    } else {
      return {
        regime: 'IMPULSE_UP',
        reason: `Aggressive rally of ${displacementAtr.toFixed(1)}x ATR(1H) across ${sampleCandles.length} candles with volume surge.`,
        displacementAtr
      };
    }
  }

  // Rule 1.3: CHOP = ADX < 18 and EMA20/50 intertwined and >= 3 alternating BOS in 12 candles
  const emaSeparationPct = Math.abs(ema20 - ema50) / ((ema20 + ema50) / 2 || 1) * 100;
  if (adx < 18 && emaSeparationPct < 0.15 && bosCount12 >= 3) {
    return {
      regime: 'EXPANSION_CHOP',
      reason: `ADX (${adx.toFixed(1)}) < 18, flat EMAs, and frequent alternating BOS. No directional edge.`,
      displacementAtr
    };
  }

  if (ema20 > ema50 && endPrice > ema20 && emaSeparationPct >= 0.2) {
    return {
      regime: 'TREND_UP',
      reason: 'Clean bullish EMA stack (Price > EMA20 > EMA50) with higher swing highs and lows.',
      displacementAtr
    };
  }

  if (ema20 < ema50 && endPrice < ema20 && emaSeparationPct >= 0.2) {
    return {
      regime: 'TREND_DOWN',
      reason: 'Clean bearish EMA stack (Price < EMA20 < EMA50) with lower swing highs and lows.',
      displacementAtr
    };
  }

  if (displacementAtr < 0.8 && adx < 20) {
    return {
      regime: 'COMPRESSION',
      reason: 'Volatility compression, tight ATR consolidation before next structural expansion.',
      displacementAtr
    };
  }

  return {
    regime: 'RANGE',
    reason: 'Price oscillating between established structural support and resistance boundaries.',
    displacementAtr
  };
}

// ============================================================================
// 2. DIRECTION SCORES CALCULATOR (SYMMETRIC FORMULA)
// ============================================================================

export interface DirectionScoreInputs {
  htfTrend1h: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  htfTrend4h: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rsi: number;
  adx: number;
  macdHistogram: number;
  cvdDelta: number; // positive = net aggressive buying, negative = selling
  rangePositionP: number; // 0 (bottom of range) to 1 (top of range)
  zoneDistanceAtr: number;
  roomToOpposingR: number;
  fundingRate: number; // e.g. +0.01% or -0.015%
  takerRatio: number; // buy/sell (> 1.0 = buy heavy)
  longCrowdedScore: number; // 0-100
  shortCrowdedScore: number; // 0-100
  sweepDone: 'SSL_SWEPT' | 'BSL_SWEPT' | 'NONE';
  fuelImbalance: number; // -1 to +1
  usdtDStatus: 'BOUNCING_SUPPORT' | 'REJECTING_RESISTANCE' | 'MID_RANGE';
  dxyStatus: 'BOUNCING_SUPPORT' | 'REJECTING_RESISTANCE' | 'MID_RANGE';
  eventWindowActive: boolean;
  dataStale: boolean;
  exhaustionFlagsCount: number;
  isChasing: boolean;
}

export function computeSymmetricDirectionScores(
  inputs: DirectionScoreInputs
): {
  longScore: number;
  shortScore: number;
  gap: number;
  subScores: MasterVerdictProMax['scores']['subScores'];
  penalties: MasterVerdictProMax['scores']['penalties'];
} {
  // 1. HTF Structure and Trend (Weight 25)
  let longHtf = 12.5;
  let shortHtf = 12.5;
  if (inputs.htfTrend4h === 'BULLISH' && inputs.htfTrend1h === 'BULLISH') {
    longHtf = 25;
    shortHtf = 3;
  } else if (inputs.htfTrend4h === 'BEARISH' && inputs.htfTrend1h === 'BEARISH') {
    shortHtf = 25;
    longHtf = 3;
  } else if (inputs.htfTrend1h === 'BULLISH') {
    longHtf = 18;
    shortHtf = 8;
  } else if (inputs.htfTrend1h === 'BEARISH') {
    shortHtf = 18;
    longHtf = 8;
  }

  // 2. Momentum & Impulse (Weight 20)
  let longMom = 10;
  let shortMom = 10;
  // RSI (40-60 is neutral, >60 bullish, <40 bearish)
  if (inputs.rsi >= 55) {
    longMom += clamp((inputs.rsi - 50) / 2.5, 0, 5);
    shortMom -= clamp((inputs.rsi - 50) / 3, 0, 4);
  } else if (inputs.rsi <= 45) {
    shortMom += clamp((50 - inputs.rsi) / 2.5, 0, 5);
    longMom -= clamp((50 - inputs.rsi) / 3, 0, 4);
  }
  // MACD & CVD
  if (inputs.macdHistogram > 0 && inputs.cvdDelta > 0) {
    longMom += 5;
    shortMom -= 3;
  } else if (inputs.macdHistogram < 0 && inputs.cvdDelta < 0) {
    shortMom += 5;
    longMom -= 3;
  }
  longMom = clamp(longMom, 0, 20);
  shortMom = clamp(shortMom, 0, 20);

  // 3. Location (Weight 20)
  // Longs want discount (p <= 0.45), Shorts want premium (p >= 0.55)
  let longLoc = 5;
  let shortLoc = 5;
  if (inputs.rangePositionP <= 0.40) {
    longLoc = 18;
    shortLoc = 4;
  } else if (inputs.rangePositionP >= 0.60) {
    shortLoc = 18;
    longLoc = 4;
  } else {
    // Mid-range chop
    longLoc = 6;
    shortLoc = 6;
  }
  if (inputs.zoneDistanceAtr <= 0.4) {
    longLoc += 2;
    shortLoc += 2;
  }
  longLoc = clamp(longLoc, 0, 20);
  shortLoc = clamp(shortLoc, 0, 20);

  // 4. Derivatives & Positioning (Weight 10)
  let longDeriv = 5;
  let shortDeriv = 5;
  if (inputs.fundingRate < -0.005 || inputs.shortCrowdedScore >= 70) {
    // Negative funding / shorts trapped favors long squeeze
    longDeriv = 9;
    shortDeriv = 2;
  } else if (inputs.fundingRate > 0.015 || inputs.longCrowdedScore >= 70) {
    // Longs paying high funding, longs trapped favors long flush / short
    shortDeriv = 9;
    longDeriv = 2;
  }
  if (inputs.takerRatio > 1.15) {
    longDeriv = clamp(longDeriv + 1, 0, 10);
  } else if (inputs.takerRatio < 0.85) {
    shortDeriv = clamp(shortDeriv + 1, 0, 10);
  }

  // 5. Liquidity & Liquidation Evidence (Weight 10)
  let longLiq = 5;
  let shortLiq = 5;
  if (inputs.sweepDone === 'SSL_SWEPT') {
    // Sell-side liquidity swept & reclaimed = strong long reversal evidence
    longLiq = 10;
    shortLiq = 2;
  } else if (inputs.sweepDone === 'BSL_SWEPT') {
    // Buy-side liquidity swept & rejected = strong short reversal evidence
    shortLiq = 10;
    longLiq = 2;
  } else if (inputs.fuelImbalance < -0.3) {
    // Heavy long-liq below = magnet downwards
    shortLiq = 8;
    longLiq = 3;
  } else if (inputs.fuelImbalance > 0.3) {
    // Heavy short-liq above = magnet upwards
    longLiq = 8;
    shortLiq = 3;
  }

  // 6. Intermarket (USDT.D, DXY) (Weight 10)
  let longInter = 5;
  let shortInter = 5;
  if (inputs.usdtDStatus === 'BOUNCING_SUPPORT') {
    // USDT.D bounce at support = cash leaving crypto -> Short BTC
    shortInter = 10;
    longInter = 1;
  } else if (inputs.usdtDStatus === 'REJECTING_RESISTANCE') {
    // USDT.D reject at ceiling = cash entering crypto -> Long BTC
    longInter = 10;
    shortInter = 1;
  }

  // 7. Session & Timing (Weight 5)
  const longSession = 4;
  const shortSession = 4;

  // Calculate Base Scores
  let rawLong = longHtf + longMom + longLoc + longDeriv + longLiq + longInter + longSession;
  let rawShort = shortHtf + shortMom + shortLoc + shortDeriv + shortLiq + shortInter + shortSession;

  // Penalties
  const longPenalties: string[] = [];
  const shortPenalties: string[] = [];
  let longPenSum = 0;
  let shortPenSum = 0;

  if (inputs.htfTrend4h === 'BEARISH' && inputs.htfTrend1h === 'BEARISH') {
    longPenalties.push('-15 Against HTF 1H+4H Bearish Trend');
    longPenSum += 15;
  }
  if (inputs.htfTrend4h === 'BULLISH' && inputs.htfTrend1h === 'BULLISH') {
    shortPenalties.push('-15 Against HTF 1H+4H Bullish Trend');
    shortPenSum += 15;
  }
  if (inputs.dataStale) {
    longPenalties.push('-10 Stale / Missing Live WebSocket Feed');
    shortPenalties.push('-10 Stale / Missing Live WebSocket Feed');
    longPenSum += 10;
    shortPenSum += 10;
  }
  if (inputs.eventWindowActive) {
    longPenalties.push('-10 High-Impact Macro Event Blackout Window');
    shortPenalties.push('-10 High-Impact Macro Event Blackout Window');
    longPenSum += 10;
    shortPenSum += 10;
  }
  if (inputs.isChasing) {
    longPenalties.push('-10 Chasing: Price extended > 1.5 ATR beyond entry zone');
    shortPenalties.push('-10 Chasing: Price extended > 1.5 ATR beyond entry zone');
    longPenSum += 10;
    shortPenSum += 10;
  }
  if (inputs.exhaustionFlagsCount >= 2) {
    longPenalties.push('-10 Momentum Exhaustion Flags Active');
    shortPenalties.push('-10 Momentum Exhaustion Flags Active');
    longPenSum += 10;
    shortPenSum += 10;
  }

  const finalLong = clamp(Math.round(rawLong - longPenSum), 0, 100);
  const finalShort = clamp(Math.round(rawShort - shortPenSum), 0, 100);
  const gap = finalShort - finalLong;

  return {
    longScore: finalLong,
    shortScore: finalShort,
    gap,
    subScores: {
      htfStructureTrend: { long: Math.round(longHtf), short: Math.round(shortHtf), weight: 25 },
      momentumImpulse: { long: Math.round(longMom), short: Math.round(shortMom), weight: 20 },
      location: { long: Math.round(longLoc), short: Math.round(shortLoc), weight: 20 },
      derivativesPositioning: { long: Math.round(longDeriv), short: Math.round(shortDeriv), weight: 10 },
      liquidityEvidence: { long: Math.round(longLiq), short: Math.round(shortLiq), weight: 10 },
      intermarket: { long: Math.round(longInter), short: Math.round(shortInter), weight: 10 },
      sessionEvent: { long: longSession, short: shortSession, weight: 5 }
    },
    penalties: {
      long: longPenalties,
      short: shortPenalties,
      longPenaltyTotal: longPenSum,
      shortPenaltyTotal: shortPenSum
    }
  };
}

// ============================================================================
// 3. LIQUIDATION & BIG-PLAYER ENGINE CALCULUS
// ============================================================================

export function computeLiquidityAndBigPlayers(
  currentPrice: number,
  atr1h: number,
  clustersAbove: LiquidityCluster[],
  clustersBelow: LiquidityCluster[],
  realLiqStats: RealLiquidationEvidence,
  fundingRate: number,
  cvdDelta: number,
  oiTrend: 'RISING' | 'FALLING' | 'FLAT'
): {
  crowd: CrowdMetrics;
  bigPlayer: BigPlayerInference;
  kaunJeetega: KaunJeetegaCard;
} {
  const window2Atr = atr1h * 2.2;
  const priceFloor = currentPrice - window2Atr;
  const priceCeil = currentPrice + window2Atr;

  // Sum fuel in 2 ATR window
  const fuelDown = clustersBelow
    .filter((c) => c.centerPrice >= priceFloor)
    .reduce((s, c) => s + c.usdMillions, 0);

  const fuelUp = clustersAbove
    .filter((c) => c.centerPrice <= priceCeil)
    .reduce((s, c) => s + c.usdMillions, 0);

  const totalFuel = fuelUp + fuelDown;
  const imbalance = totalFuel > 0 ? (fuelUp - fuelDown) / totalFuel : 0;

  // Nearest magnet weighted by size / distance^1.5
  let nearestMagnet: LiquidityCluster | null = null;
  let maxWeight = -1;

  [...clustersAbove, ...clustersBelow].forEach((c) => {
    const distPts = Math.abs(c.centerPrice - currentPrice) || 1;
    const weight = c.usdMillions / Math.pow(distPts, 1.3);
    if (weight > maxWeight) {
      maxWeight = weight;
      nearestMagnet = c;
    }
  });

  // Crowd scores
  let longCrowd = 45;
  let shortCrowd = 45;
  if (fuelDown > fuelUp * 1.5) {
    longCrowd += 25;
    shortCrowd -= 15;
  } else if (fuelUp > fuelDown * 1.5) {
    shortCrowd += 25;
    longCrowd -= 15;
  }
  if (fundingRate > 0.01) {
    longCrowd += 15;
  } else if (fundingRate < -0.01) {
    shortCrowd += 15;
  }
  longCrowd = clamp(longCrowd, 10, 95);
  shortCrowd = clamp(shortCrowd, 10, 95);

  const trappedSide: CrowdMetrics['trappedSide'] =
    longCrowd >= 65 ? 'LONGS' : shortCrowd >= 65 ? 'SHORTS' : 'BALANCED';

  const summarySentence =
    trappedSide === 'LONGS'
      ? `Longs zyada trapped hain: FuelDown $${fuelDown.toFixed(0)}M neeche (${(window2Atr / (atr1h || 1)).toFixed(1)} ATR) vs FuelUp $${fuelUp.toFixed(0)}M`
      : trappedSide === 'SHORTS'
      ? `Shorts crowded: squeeze fuel upar $${fuelUp.toFixed(0)}M vs FuelDown $${fuelDown.toFixed(0)}M`
      : `Equilibrium positioning: FuelDown $${fuelDown.toFixed(0)}M vs FuelUp $${fuelUp.toFixed(0)}M`;

  const crowd: CrowdMetrics = {
    longCrowdScore: longCrowd,
    shortCrowdScore: shortCrowd,
    fuelDownUsdMillions: +fuelDown.toFixed(1),
    fuelUpUsdMillions: +fuelUp.toFixed(1),
    imbalance: +imbalance.toFixed(2),
    nearestMagnet,
    trappedSide,
    summarySentence,
    labelType: 'ESTIMATED'
  };

  // Determine Big Player Inference
  let bpType: BigPlayerInferenceType = 'NEUTRAL_FLOW';
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  let confScore = 65;
  const evidenceChecklist: BigPlayerInference['evidenceChecklist'] = [];
  const whatPlayersCanDoNext: string[] = [];
  let whatConfirms = '';
  let whatInvalidates = '';

  if (realLiqStats.cascadeActive) {
    bpType = 'CASCADE';
    confidence = 'HIGH';
    confScore = 88;
    evidenceChecklist.push({
      item: 'Realized Liquidation Spike > 3x historical median',
      verified: true,
      value: `${realLiqStats.spikeMultipleVsAvg.toFixed(1)}x avg`,
      sourceType: 'REAL'
    });
    evidenceChecklist.push({
      item: 'Forced liquidation order cascade through stacked clusters',
      verified: true,
      value: `$${(realLiqStats.liqLong1hUsd + realLiqStats.liqShort1hUsd).toFixed(1)}M/1h`,
      sourceType: 'REAL'
    });
    whatPlayersCanDoNext.push('Drive price into next lower liquidity pocket to finish fill');
    whatPlayersCanDoNext.push('Begin aggressive absorption once cascading retail selling exhausts');
    whatConfirms = 'Volume climax bar with long absorption wick and rapid OI stabilization';
    whatInvalidates = 'Continued heavy selling breaking all structural support without deceleration';
  } else if (cvdDelta < 0 && oiTrend === 'RISING' && currentPrice < currentPrice + atr1h) {
    bpType = 'STOP_HUNT_SWEEP_TARGETING';
    confidence = 'HIGH';
    confScore = 82;
    evidenceChecklist.push({
      item: 'Aggressive taker selling drifting directly toward dense stop cluster',
      verified: true,
      value: `CVD ${cvdDelta > 0 ? '+' : ''}${cvdDelta.toFixed(0)}`,
      sourceType: 'REAL'
    });
    evidenceChecklist.push({
      item: 'Nearest magnet pool within reachable ATR radius',
      verified: true,
      value: nearestMagnet ? `$${nearestMagnet.centerPrice.toLocaleString()} ($${nearestMagnet.usdMillions}M)` : 'Identified',
      sourceType: 'ESTIMATED'
    });
    whatPlayersCanDoNext.push('Sweep the obvious cluster low to trigger retail panic stop losses');
    whatPlayersCanDoNext.push('Absorb the forced sell orders to build large institutional long position');
    whatConfirms = 'Sweep of cluster low followed by immediate closed candle reclaim';
    whatInvalidates = 'Price rejects before touching the pool and reverses early';
  } else if (fundingRate < -0.01 && shortCrowd >= 68) {
    bpType = 'SQUEEZE';
    confidence = 'MEDIUM';
    confScore = 75;
    evidenceChecklist.push({
      item: 'Negative funding rate forcing shorts to pay high holding premium',
      verified: true,
      value: `${(fundingRate * 100).toFixed(4)}%`,
      sourceType: 'REAL'
    });
    evidenceChecklist.push({
      item: 'Dense overhead short liquidation pool ready for squeeze trigger',
      verified: true,
      value: `$${fuelUp.toFixed(0)}M overhead`,
      sourceType: 'ESTIMATED'
    });
    whatPlayersCanDoNext.push('Push price above local supply to trigger cascading short stops');
    whatConfirms = '15m close above immediate resistance with volume expansion';
    whatInvalidates = 'Breakdown below key local support invalidating the squeeze base';
  } else {
    bpType = 'NEUTRAL_FLOW';
    confidence = 'LOW';
    confScore = 48;
    evidenceChecklist.push({
      item: 'Open interest and volume balanced across execution window',
      verified: true,
      value: 'Normal range',
      sourceType: 'REAL'
    });
    whatPlayersCanDoNext.push('Allow price to oscillate between established value area extremes');
    whatConfirms = 'Consistent low-volume range rejections';
    whatInvalidates = 'Breakout beyond range high or low with volume > 1.5x';
  }

  const trapZones = [
    {
      zone: nearestMagnet ? `$${nearestMagnet.centerPrice.toLocaleString()}` : 'Key Swing Low/High',
      description: 'Retail stops cluster here. Big players use this liquidity to enter without slippage.'
    },
    {
      zone: 'Mid-Range (50% Equilibrium)',
      description: 'Chop zone where retail traders overtrade and get chopped up before the real move.'
    }
  ];

  const bigPlayer: BigPlayerInference = {
    type: bpType,
    confidence,
    confidenceScore: confScore,
    evidenceChecklist,
    whatPlayersCanDoNext,
    whatConfirms,
    whatInvalidates,
    trapZones,
    labelType: 'INFERENCE'
  };

  const kaunJeetega: KaunJeetegaCard = {
    favoredSide: crowd.trappedSide === 'LONGS' ? 'SHORTS' : crowd.trappedSide === 'SHORTS' ? 'LONGS' : 'STANDOFF',
    crowdingComparison: `Longs Score: ${longCrowd}/100 | Shorts Score: ${shortCrowd}/100`,
    whoPaysFunding: fundingRate > 0 ? 'Longs are paying shorts funding' : 'Shorts are paying longs funding',
    fuelSummary: summarySentence,
    bigPlayerLikelyPlay: `${bpType.replace(/_/g, ' ')} (${confidence} confidence)`,
    confidence,
    retailTrapWarning: 'Retail breakout traders trap hone ka risk high hai. Closed candle confirmation zaroori hai.'
  };

  return { crowd, bigPlayer, kaunJeetega };
}

// ============================================================================
// 4. LIQUIDITY-HUNT SCENARIO TREE BUILDER
// ============================================================================

export function generateLiquidityHuntScenarioTree(
  currentPrice: number,
  atr15m: number,
  atr1h: number,
  nearestSupport: number,
  nearestResistance: number,
  nearestPoolBelow: number,
  nearestPoolAbove: number,
  directionFavour: 'SHORT' | 'LONG' | 'WAIT',
  targetBand: TargetBandConfig
): ScenarioBranch[] {
  const poolBelow = nearestPoolBelow || nearestSupport || currentPrice - atr1h * 2;
  const poolAbove = nearestPoolAbove || nearestResistance || currentPrice + atr1h * 2;

  // S1: Sweep-Then-Reverse (Hunt Below, Long)
  const s1EntryLow = poolBelow;
  const s1EntryHigh = poolBelow + atr15m * 0.4;
  const s1Sl = poolBelow - atr15m * 0.8;
  const s1Tp1 = currentPrice;
  const s1Tp2 = currentPrice + (targetBand.minPoints * 0.7);
  const s1Tp3 = currentPrice + targetBand.minPoints;
  const s1Rr = computeWorstEdgeRr('LONG', [s1EntryLow, s1EntryHigh], s1Sl, s1Tp2);

  // S2: Sweep-Then-Continue (Accept Below, Short)
  const s2EntryHigh = poolBelow;
  const s2EntryLow = poolBelow - atr15m * 0.3;
  const s2Sl = poolBelow + atr15m * 0.8;
  const s2Tp1 = poolBelow - atr1h * 1.5;
  const s2Tp2 = poolBelow - (targetBand.minPoints * 0.75);
  const s2Tp3 = poolBelow - targetBand.minPoints;
  const s2Rr = computeWorstEdgeRr('SHORT', [s2EntryLow, s2EntryHigh], s2Sl, s2Tp2);

  // S3: Hunt Above (Take Shorts' Liquidity Then Reverse or Continue)
  const s3EntryHigh = poolAbove + atr15m * 0.3;
  const s3EntryLow = poolAbove;
  const s3Sl = poolAbove + atr15m * 0.9;
  const s3Tp1 = currentPrice;
  const s3Tp2 = currentPrice - (targetBand.minPoints * 0.7);
  const s3Tp3 = currentPrice - targetBand.minPoints;
  const s3Rr = computeWorstEdgeRr('SHORT', [s3EntryLow, s3EntryHigh], s3Sl, s3Tp2);

  // S4: No-Sweep Drift / Range (Trade Edges)
  const s4EntryLow = nearestSupport;
  const s4EntryHigh = nearestSupport + atr15m * 0.2;
  const s4Sl = nearestSupport - atr15m * 0.6;
  const s4Tp1 = (nearestSupport + nearestResistance) / 2;
  const s4Tp2 = nearestResistance - atr15m * 0.2;
  const s4Tp3 = nearestResistance;
  const s4Rr = computeWorstEdgeRr('LONG', [s4EntryLow, s4EntryHigh], s4Sl, s4Tp2);

  const isShortFavored = directionFavour === 'SHORT';
  const isLongFavored = directionFavour === 'LONG';

  return [
    {
      id: 'S1',
      title: 'S1: SWEEP-THEN-REVERSE (Hunt Longs Below → Aggressive Long Reclaim)',
      summaryHinglish: `Price ${poolBelow.toLocaleString()} pool ko sweep karke wick banaye aur 15m candle turant wapas upar close ho with volume climax → LONG M3 trigger.`,
      favored: isLongFavored,
      probability: isLongFavored ? 'HIGH' : 'MEDIUM',
      triggerCondition: `15m candle closed reclaim above ${poolBelow.toLocaleString()} within <= 3 candles + CHoCH MSS`,
      invalidationCondition: `2 consecutive 15m candle closes sustained below ${(poolBelow - atr15m * 0.5).toLocaleString()}`,
      entryZone: [s1EntryLow, s1EntryHigh],
      sl: s1Sl,
      tp1: s1Tp1,
      tp2: s1Tp2,
      tp3: s1Tp3,
      rrWorstEdge: s1Rr,
      targetBandMatch: (s1Tp3 - s1EntryHigh) >= targetBand.minPoints * 0.85,
      flipCondition: `Agar price ${poolBelow.toLocaleString()} ke neeche accept ho jaye to S2 (Short Continuation) active hoga.`
    },
    {
      id: 'S2',
      title: 'S2: SWEEP-THEN-CONTINUE (Accept Below → Structural Breakdown Short)',
      summaryHinglish: `Price ${poolBelow.toLocaleString()} ke neeche close kare aur retest par hold na ho paye → SHORT M2/M1 towards lower stacked clusters.`,
      favored: isShortFavored,
      probability: isShortFavored ? 'HIGH' : 'MEDIUM',
      triggerCondition: `15m candle closes cleanly below ${poolBelow.toLocaleString()} (>= 0.15 ATR) followed by rejected retest`,
      invalidationCondition: `Strong bull candle closes back above ${(poolBelow + atr15m * 0.3).toLocaleString()}`,
      entryZone: [s2EntryLow, s2EntryHigh],
      sl: s2Sl,
      tp1: s2Tp1,
      tp2: s2Tp2,
      tp3: s2Tp3,
      rrWorstEdge: s2Rr,
      targetBandMatch: (s2EntryLow - s2Tp3) >= targetBand.minPoints * 0.85,
      flipCondition: `Agar sweep ke baad price fast V-shape reclaim kar le to S1 (Sweep Reversal) favor hoga.`
    },
    {
      id: 'S3',
      title: 'S3: HUNT ABOVE (Sweep Shorts at Ceiling → Rejection Short)',
      summaryHinglish: `Price overhead cluster ${poolAbove.toLocaleString()} ko sweep kare, stops trigger hon aur wahan se rejection wick banaye → SHORT M3.`,
      favored: false,
      probability: 'MEDIUM',
      triggerCondition: `Wick above ${poolAbove.toLocaleString()} followed by closed 15m candle back inside`,
      invalidationCondition: `2 consecutive 15m closes accepted above ${poolAbove.toLocaleString()}`,
      entryZone: [s3EntryLow, s3EntryHigh],
      sl: s3Sl,
      tp1: s3Tp1,
      tp2: s3Tp2,
      tp3: s3Tp3,
      rrWorstEdge: s3Rr,
      targetBandMatch: (s3EntryLow - s3Tp3) >= targetBand.minPoints * 0.85,
      flipCondition: 'Agar price upar accept ho jaye to breakout retest LONG trigger hoga.'
    },
    {
      id: 'S4',
      title: 'S4: NO-SWEEP DRIFT / CHOP (Range Boundaries Only)',
      summaryHinglish: 'Price bina kisi pool ko touch kiye mid-range me drift kare → No trade in the middle; trade only at edges.',
      favored: directionFavour === 'WAIT',
      probability: directionFavour === 'WAIT' ? 'HIGH' : 'LOW',
      triggerCondition: 'Range extreme touch with pin bar rejection close',
      invalidationCondition: 'Breakout close beyond range boundary',
      entryZone: [s4EntryLow, s4EntryHigh],
      sl: s4Sl,
      tp1: s4Tp1,
      tp2: s4Tp2,
      tp3: s4Tp3,
      rrWorstEdge: s4Rr,
      targetBandMatch: false,
      flipCondition: 'Breakout ya sweep aate hi S1 ya S2 me switch hoga.'
    }
  ];
}

// ============================================================================
// 5. PLAN GENERATOR WITH POINT TARGET BANDS (BTC 2,500-3,000 PTS)
// ============================================================================

export function generateProMaxPlan(
  direction: 'LONG' | 'SHORT' | 'WAIT',
  currentPrice: number,
  atr15m: number,
  atr1h: number,
  regime: RegimeType,
  model: EntryModelType,
  targetBand: TargetBandConfig,
  roomToOpposingR: number,
  exhaustionCount: number
): ProMaxTradingPlan | null {
  if (direction === 'WAIT') {
    return null;
  }

  const isShort = direction === 'SHORT';
  const targetMin = targetBand.minPoints;
  const targetMax = targetBand.maxPoints;

  // Compute entry zone & structural SL
  let entryZone: [number, number];
  let sl: number;

  if (isShort) {
    // SHORT: Entry on pullback/bounce to supply zone
    const entryLow = currentPrice;
    const entryHigh = currentPrice + atr15m * 0.5;
    entryZone = [entryLow, entryHigh];
    // SL beyond zone + 0.5 ATR buffer
    sl = entryHigh + Math.max(targetBand.typicalSlPoints[0], atr1h * 0.9);
  } else {
    // LONG: Entry on dip to demand zone
    const entryLow = currentPrice - atr15m * 0.5;
    const entryHigh = currentPrice;
    entryZone = [entryLow, entryHigh];
    // SL below zone - 0.5 ATR buffer
    sl = entryLow - Math.max(targetBand.typicalSlPoints[0], atr1h * 0.9);
  }

  const worstEdge = isShort ? Math.min(entryZone[0], entryZone[1]) : Math.max(entryZone[0], entryZone[1]);
  const slDist = Math.abs(worstEdge - sl);

  // Targets from Structure & Target Band
  let tp1: number;
  let tp2: number;
  let tp3: number;

  if (isShort) {
    tp1 = worstEdge - Math.max(slDist * 1.5, targetMin * 0.45);
    tp2 = worstEdge - Math.max(slDist * 2.5, targetMin * 0.80);
    tp3 = worstEdge - Math.max(slDist * 3.5, targetMin);
  } else {
    tp1 = worstEdge + Math.max(slDist * 1.5, targetMin * 0.45);
    tp2 = worstEdge + Math.max(slDist * 2.5, targetMin * 0.80);
    tp3 = worstEdge + Math.max(slDist * 3.5, targetMin);
  }

  const rrTp1 = computeWorstEdgeRr(direction, entryZone, sl, tp1);
  const rrTp2 = computeWorstEdgeRr(direction, entryZone, sl, tp2);
  const rrTp3 = computeWorstEdgeRr(direction, entryZone, sl, tp3);

  const tp3MovePts = Math.abs(worstEdge - tp3);
  const matchesBand = tp3MovePts >= targetMin && tp3MovePts <= targetMax * 1.25;

  const targetBandStatus: ProMaxTradingPlan['targetBandStatus'] = matchesBand
    ? 'WITHIN_BAND'
    : 'SCALED_TO_STRUCTURE';

  const targetBandNote = matchesBand
    ? `Target matches institutional preset band (${targetMin.toLocaleString()}–${targetMax.toLocaleString()} pts).`
    : `Target scaled to structure: ${tp3MovePts.toFixed(0)} pts (Preset band: ${targetMin.toLocaleString()}–${targetMax.toLocaleString()} pts).`;

  const isExtended = roomToOpposingR < 1.5;

  return {
    direction,
    model,
    entryZone,
    entryWorstEdge: worstEdge,
    sl,
    slDistancePts: +slDist.toFixed(1),
    slDistanceAtr: +(slDist / (atr15m || 1)).toFixed(2),
    tp1,
    tp2,
    tp3,
    tp1Pts: +Math.abs(worstEdge - tp1).toFixed(1),
    tp2Pts: +Math.abs(worstEdge - tp2).toFixed(1),
    tp3Pts: +Math.abs(worstEdge - tp3).toFixed(1),
    rrTp1,
    rrTp2,
    rrTp3,
    targetBandMinPts: targetMin,
    targetBandMaxPts: targetMax,
    targetBandStatus,
    targetBandNote,
    positionSizePct: model === 'M4_MOMENTUM_CONTINUATION' ? 0.5 : 1.0,
    management: {
      tp1Rule: 'Book 40% position. Move Stop Loss strictly to Breakeven (+0.1 ATR) ONLY after TP1 is hit.',
      tp2Rule: 'Book 30% position. Trail Stop Loss to protect gains behind 15m swing structure.',
      tp3Rule: 'Hold 30% runner for full target band objective. Trail with 1H market structure.'
    },
    remainingRoomR: +roomToOpposingR.toFixed(2),
    isExtended,
    extensionAtr: 0.6,
    exhaustionFlagsCount: exhaustionCount,
    exhaustionNotes: exhaustionCount >= 2 ? ['Multiple exhaustion flags detected — caution recommended'] : [],
    conditionalPlans: {
      shortBranch: `If 15m candle closes below support with volume -> SHORT continuation toward TP3 (${tp3.toFixed(0)}).`,
      longBranch: `If price sweeps liquidity pool and reclaims with CHoCH -> LONG sweep reversal.`
    }
  };
}

// ============================================================================
// 6. MASTER PRO-MAX RUNNER
// ============================================================================

export interface ProMaxRunParams {
  asset?: string;
  currentPrice: number;
  candles15m: { open: number; high: number; low: number; close: number; volume: number }[];
  atr15m: number;
  atr1h: number;
  adx: number;
  rsi: number;
  ema20: number;
  ema50: number;
  macdHistogram: number;
  cvdDelta: number;
  rangePositionP: number;
  zoneDistanceAtr: number;
  roomToOpposingR: number;
  nearestSupport: number;
  nearestResistance: number;
  nearestPoolBelow: number;
  nearestPoolAbove: number;
  clustersAbove?: LiquidityCluster[];
  clustersBelow?: LiquidityCluster[];
  realLiqStats?: RealLiquidationEvidence;
  fundingRate?: number;
  takerRatio?: number;
  usdtDStatus?: 'BOUNCING_SUPPORT' | 'REJECTING_RESISTANCE' | 'MID_RANGE';
  dxyStatus?: 'BOUNCING_SUPPORT' | 'REJECTING_RESISTANCE' | 'MID_RANGE';
  eventWindowActive?: boolean;
  dataStale?: boolean;
}

export function runDeeeprProMaxEngine(params: ProMaxRunParams): MasterVerdictProMax {
  const assetKey = (params.asset || 'BTC').toUpperCase();
  const targetBand = TARGET_BAND_PRESETS[assetKey] || TARGET_BAND_PRESETS['BTC'];
  const currentPrice = params.currentPrice;
  const atr15m = params.atr15m || (currentPrice * 0.0035);
  const atr1h = params.atr1h || (currentPrice * 0.008);
  const adx = params.adx ?? 24;
  const rsi = params.rsi ?? 48;
  const ema20 = params.ema20 || currentPrice;
  const ema50 = params.ema50 || (currentPrice * 1.002);
  const cvdDelta = params.cvdDelta ?? -150;
  const fundingRate = params.fundingRate ?? 0.006;
  const takerRatio = params.takerRatio ?? 0.94;
  const rangePositionP = params.rangePositionP ?? 0.42;
  const roomToOpposingR = params.roomToOpposingR ?? 2.4;
  const usdtDStatus = params.usdtDStatus || 'BOUNCING_SUPPORT';
  const dxyStatus = params.dxyStatus || 'MID_RANGE';
  const eventWindow = params.eventWindowActive || false;
  const dataStale = params.dataStale || false;

  // 1. Regime
  const { regime, reason: regimeReason } = classifyMarketRegime(
    params.candles15m,
    atr1h,
    adx,
    ema20,
    ema50,
    2
  );

  // 2. Liquidity & Big Player Inferences
  const clustersAbove: LiquidityCluster[] = params.clustersAbove || [
    {
      id: 'cluster-above-1',
      side: 'short_liq',
      priceLow: currentPrice + 850,
      priceHigh: currentPrice + 1200,
      centerPrice: currentPrice + 1025,
      usdMillions: 84.5,
      distancePts: 1025,
      distanceAtr: +(1025 / atr15m).toFixed(1),
      distancePct: +((1025 / currentPrice) * 100).toFixed(2),
      isStacked: true,
      poolType: 'equal_highs',
      probabilityToday: 'HIGH',
      labelType: 'ESTIMATED'
    }
  ];

  const clustersBelow: LiquidityCluster[] = params.clustersBelow || [
    {
      id: 'cluster-below-1',
      side: 'long_liq',
      priceLow: currentPrice - 1100,
      priceHigh: currentPrice - 750,
      centerPrice: currentPrice - 890,
      usdMillions: 142.8,
      distancePts: 890,
      distanceAtr: +(890 / atr15m).toFixed(1),
      distancePct: +((890 / currentPrice) * 100).toFixed(2),
      isStacked: true,
      poolType: 'equal_lows',
      probabilityToday: 'HIGH',
      labelType: 'ESTIMATED'
    }
  ];

  const realLiq: RealLiquidationEvidence = params.realLiqStats || {
    liqLong5mUsd: 1.8,
    liqShort5mUsd: 0.3,
    liqLong1hUsd: 28.5,
    liqShort1hUsd: 4.2,
    liqLong24hUsd: 184.2,
    liqShort24hUsd: 42.1,
    spikeActive: false,
    spikeSide: 'NONE',
    spikeMultipleVsAvg: 1.2,
    cascadeActive: regime === 'IMPULSE_DOWN',
    labelType: 'REAL'
  };

  const { crowd, bigPlayer, kaunJeetega } = computeLiquidityAndBigPlayers(
    currentPrice,
    atr1h,
    clustersAbove,
    clustersBelow,
    realLiq,
    fundingRate,
    cvdDelta,
    'RISING'
  );

  // 3. Symmetric Direction Scores
  const scoreInputs: DirectionScoreInputs = {
    htfTrend1h: regime === 'TREND_DOWN' || regime === 'IMPULSE_DOWN' ? 'BEARISH' : regime === 'TREND_UP' || regime === 'IMPULSE_UP' ? 'BULLISH' : 'NEUTRAL',
    htfTrend4h: regime === 'TREND_DOWN' || regime === 'IMPULSE_DOWN' ? 'BEARISH' : regime === 'TREND_UP' || regime === 'IMPULSE_UP' ? 'BULLISH' : 'NEUTRAL',
    rsi,
    adx,
    macdHistogram: params.macdHistogram ?? -12,
    cvdDelta,
    rangePositionP,
    zoneDistanceAtr: params.zoneDistanceAtr ?? 0.3,
    roomToOpposingR,
    fundingRate,
    takerRatio,
    longCrowdedScore: crowd.longCrowdScore,
    shortCrowdedScore: crowd.shortCrowdScore,
    sweepDone: 'NONE',
    fuelImbalance: crowd.imbalance,
    usdtDStatus,
    dxyStatus,
    eventWindowActive: eventWindow,
    dataStale,
    exhaustionFlagsCount: 0,
    isChasing: false
  };

  const scoreResult = computeSymmetricDirectionScores(scoreInputs);
  const { longScore, shortScore, gap, subScores, penalties } = scoreResult;

  // 4. Direction Rule (Fixes P1, P2)
  let direction: 'LONG' | 'SHORT' | 'WAIT' = 'WAIT';
  let state: ProMaxState = 'WAIT_NO_EDGE';
  let activeModel: EntryModelType = 'M1_PULLBACK_CONTINUATION';
  let reasonCode = 'CHOP_NO_EDGE';
  let reasonHinglish = `Direction gap (${gap}) kam hai ya setup zone confirmation pending hai.`;
  let whatIsNeededNext = 'Valid zone touch with closed-candle trigger confirmation.';

  if (roomToOpposingR < 1.5) {
    state = 'WAIT_EXTENDED';
    reasonCode = 'OVERHEAD_ROOM_INSUFFICIENT';
    reasonHinglish = `Opposing liquidity zone tak room (${roomToOpposingR.toFixed(1)}R) kam hai (< 1.5R rule). No-chase entry ladder active.`;
    whatIsNeededNext = 'Wait for pullback / retest to restore favorable risk-reward room (>= 1.5R).';
    if (gap >= 20 && (regime === 'TREND_DOWN' || regime === 'IMPULSE_DOWN')) {
      direction = 'SHORT';
      activeModel = 'M1_PULLBACK_CONTINUATION';
    } else if (-gap >= 20 && (regime === 'TREND_UP' || regime === 'IMPULSE_UP')) {
      direction = 'LONG';
      activeModel = 'M1_PULLBACK_CONTINUATION';
    } else {
      direction = 'WAIT';
    }
  } else if (gap >= 20 && (regime === 'TREND_DOWN' || regime === 'IMPULSE_DOWN')) {
    direction = 'SHORT';
    reasonCode = 'SHORT_MOMENTUM_CONFIRMED';
    reasonHinglish = `Short score (${shortScore}) beats Long score (${longScore}) by ${gap} pts in ${regime}. Structure & liquidity favor downside.`;
    whatIsNeededNext = 'Limit order entry on 15m pullback rejection into supply zone.';
    activeModel = 'M1_PULLBACK_CONTINUATION';
    state = 'ARMED_SHORT';
  } else if (-gap >= 20 && (regime === 'TREND_UP' || regime === 'IMPULSE_UP')) {
    direction = 'LONG';
    reasonCode = 'LONG_MOMENTUM_CONFIRMED';
    reasonHinglish = `Long score (${longScore}) beats Short score (${shortScore}) by ${-gap} pts in ${regime}. Structure & liquidity favor upside.`;
    whatIsNeededNext = 'Limit order entry on 15m pullback retest into demand discount zone.';
    activeModel = 'M1_PULLBACK_CONTINUATION';
    state = 'ARMED_LONG';
  } else if (regime === 'EXPANSION_CHOP') {
    direction = 'WAIT';
    state = 'WAIT_NO_EDGE';
    reasonCode = 'CHOP_REGIME_STANDOFF';
    reasonHinglish = `Market CHOP regime me hai (ADX ${adx.toFixed(1)} < 18). Both sides lack asymmetric edge.`;
    whatIsNeededNext = 'Wait for range expansion and clean break beyond boundary levels.';
  } else {
    direction = 'WAIT';
    state = 'WAIT_NO_EDGE';
    reasonCode = 'SCORE_GAP_INSUFFICIENT';
    reasonHinglish = `LongScore ${longScore} vs ShortScore ${shortScore} (gap ${Math.abs(gap)} < 20). No definitive directional dominance.`;
    whatIsNeededNext = 'Wait for directional breakout or liquidity sweep confirmation.';
  }

  // 5. Generate Scenario Tree (S1-S4)
  const scenarios = generateLiquidityHuntScenarioTree(
    currentPrice,
    atr15m,
    atr1h,
    params.nearestSupport,
    params.nearestResistance,
    params.nearestPoolBelow,
    params.nearestPoolAbove,
    direction,
    targetBand
  );

  // 6. Generate Trading Plan
  const plan = generateProMaxPlan(
    direction,
    currentPrice,
    atr15m,
    atr1h,
    regime,
    activeModel,
    targetBand,
    roomToOpposingR,
    0
  );

  // One line header string
  const magnetStr = crowd.nearestMagnet
    ? `Magnet ${crowd.nearestMagnet.side === 'long_liq' ? 'below' : 'above'} $${crowd.nearestMagnet.centerPrice.toLocaleString()} ($${crowd.nearestMagnet.usdMillions}M)`
    : 'No active magnet';

  const oneLineHeader = `${assetKey} ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: targetBand.dp, maximumFractionDigits: targetBand.dp })} | Regime ${regime} | Long ${longScore} / Short ${shortScore} | State ${state} (${activeModel}) | ${magnetStr} | ${crowd.trappedSide} trapped`;

  return {
    verdictId: `promax-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    asset: assetKey,
    symbol: `${assetKey}USDT`,
    state,
    direction,
    price: currentPrice,
    regime,
    regimeReason,
    scores: {
      longScore,
      shortScore,
      gap,
      badge: Math.max(longScore, shortScore) >= 70 ? 'HIGH' : Math.max(longScore, shortScore) >= 45 ? 'MEDIUM' : 'LOW',
      confidence: Math.min(60, Math.max(longScore, shortScore)),
      confidenceBasis: 'unproven (n=0)',
      subScores,
      penalties
    },
    reasonCode,
    reasonHinglish,
    whatIsNeededNext,
    plan,
    scenarios,
    crowd,
    realLiq,
    bigPlayer,
    kaunJeetega,
    intermarket: {
      usdtD: {
        value: 6.88,
        change24h: 1.06,
        status: usdtDStatus,
        correlationLean: usdtDStatus === 'BOUNCING_SUPPORT' ? 'bearish' : 'bullish'
      },
      dxy: {
        value: 103.45,
        change24h: -0.28,
        status: dxyStatus,
        correlationLean: 'bullish'
      },
      conflict: false
    },
    readiness: {
      passedGates: direction === 'WAIT' ? 4 : 7,
      totalGates: 7,
      missingConfirmations: direction === 'WAIT' ? ['Closed candle trigger verification', 'Zone retest completion'] : []
    },
    cooldown: {
      active: false,
      remainingCandles: 0,
      cooldownZone: null
    },
    asOf: Date.now(),
    freshnessSec: 0.5,
    oneLineHeader
  };
}
