/**
 * ═══════════════════════════════════════════════════════════════════════
 * DEEEPR AI — SIGNAL DECISION ENGINE v2.0 (Complete Rebuild)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ARCHITECTURAL PRINCIPLES:
 * 1. STRUCTURE-FIRST: Market structure (HH/HL/LH/LL, BOS, CHoCH) determines
 *    directional bias BEFORE any signal is considered.
 * 2. HTF-FIRST: Higher timeframes always dominate lower timeframes.
 * 3. CONFIRMATION-FIRST: A signal requires multiple independent confirmations.
 * 4. ANTI-CHASE: Never chase price that has already moved significantly.
 * 5. ANTI-FLIP: Signal state machine prevents rapid LONG↔SHORT flipping.
 * 6. WAIT IS VALID: When evidence is insufficient, WAIT is the correct answer.
 *
 * CRITICAL RULES:
 * - Rising price does NOT automatically mean SHORT.
 * - Falling price does NOT automatically mean LONG.
 * - A single candle is NEVER enough to generate a signal.
 * - RSI > 70 does NOT automatically mean SHORT.
 * - RSI < 30 does NOT automatically mean LONG.
 * - Liquidity sweep alone does NOT mean reversal.
 * - OB/FVG existence alone is NOT a signal.
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════

export type MarketRegime =
  | 'STRONG_BULLISH'
  | 'BULLISH'
  | 'BULLISH_PULLBACK'
  | 'RANGE'
  | 'BEARISH_PULLBACK'
  | 'BEARISH'
  | 'STRONG_BEARISH'
  | 'HIGH_VOLATILITY'
  | 'EVENT_RISK'
  | 'UNCLEAR';

export type SignalState =
  | 'WAIT'
  | 'LONG_SETUP'
  | 'LONG_CONFIRMED'
  | 'LONG_INVALIDATED'
  | 'SHORT_SETUP'
  | 'SHORT_CONFIRMED'
  | 'SHORT_INVALIDATED';

export type SignalStatus =
  | 'ENTRY_WAITING'
  | 'ENTRY_ACTIVE'
  | 'ACTIVE_TRADE'
  | 'MISSED_ENTRY'
  | 'INVALIDATED'
  | 'TP_HIT'
  | 'SL_HIT'
  | 'EXPIRED'
  | 'WAITING';

export type SignalGrade = 'A+' | 'A' | 'B' | 'C' | 'NO_TRADE';

export type ChaseRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type DataQuality = 'LIVE' | 'CALCULATED' | 'DELAYED' | 'ESTIMATED' | 'UNAVAILABLE';

export interface CandleInput {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeframeAnalysis {
  timeframe: string;
  weight: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: string;
  hasBOS: boolean;
  bosDirection: 'BULLISH' | 'BEARISH' | 'NONE';
  hasChoch: boolean;
  chochDirection: 'BULLISH' | 'BEARISH' | 'NONE';
  trendStrength: number; // 0-100
  emaAlignment: 'BULLISH' | 'BEARISH' | 'MIXED';
}

export interface ConfluenceScore {
  name: string;
  maxWeight: number;
  longScore: number;
  shortScore: number;
  note: string;
  dataQuality: DataQuality;
}

export interface SignalExplanation {
  reason: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DebugPanel {
  currentMarketRegime: MarketRegime;
  htfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structureBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  liquidityBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volumeBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  orderFlowBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentumBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macroBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  longScore: number;
  shortScore: number;
  signalState: SignalState;
  previousSignal: string;
  signalChangeReason: string;
  invalidationReason: string;
  chaseRisk: ChaseRisk;
  newsRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  rrValidation: boolean;
  entryDistancePct: number;
  mtfScores: TimeframeAnalysis[];
}

export interface SignalDecision {
  // Final decision
  decision: 'LONG' | 'SHORT' | 'WAIT';
  confidence: number; // 0-100
  grade: SignalGrade;
  signalState: SignalState;
  signalStatus: SignalStatus;
  regime: MarketRegime;
  regimeLabel: string;

  // Scores
  longScore: number;
  shortScore: number;
  scoreDelta: number;

  // Entry/Exit levels
  currentPrice: number;
  entryPrice: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  entryDistancePct: number;
  stopLossPrice: number;
  targetTp1: number;
  targetTp2: number;
  targetTp3: number;
  rewardToRisk: number;
  invalidationLevel: number;

  // Chase/Timing
  chaseRisk: ChaseRisk;
  signalAge: number; // ms since signal generated
  signalGeneratedAt: number;
  signalUpdatedAt: number;

  // Explanations
  topReasons: SignalExplanation[];
  whyThisSignal: string;
  structureNote: string;
  liquidityNote: string;
  orderFlowNote: string;
  macroNote: string;
  invalidationRule: string;

  // Confluence breakdown
  confluenceScores: ConfluenceScore[];

  // Debug
  debug: DebugPanel;
}

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const SIGNAL_THRESHOLDS = {
  MIN_SCORE_FOR_SIGNAL: 70,      // Minimum score to generate LONG or SHORT (sensitive to SMC displacement)
  MIN_SCORE_DELTA: 12,           // Minimum difference between LONG and SHORT scores
  MIN_SCORE_TO_FLIP: 78,         // Minimum opposite score needed to flip signal
  MIN_RR: 1.3,                   // Calibrated RRR: 1.30 to 1.40 (TP1)
  MAX_ENTRY_DISTANCE_PCT: 1.8,   // Max % distance from entry to still be "active"
  CHASE_THRESHOLD_PCT: 2.2,      // % move that triggers high chase risk
  CHASE_MEDIUM_PCT: 1.2,         // % move that triggers medium chase risk
  COOLDOWN_MS: 5 * 60 * 1000,    // 5 minute cooldown after signal change
  SIGNAL_EXPIRY_MS: 60 * 60 * 1000, // 1 hour signal expiry
  STRUCTURE_CONFIRM_CANDLES: 3,  // Minimum candles to confirm structure
  MTF_WEIGHTS: {
    '5m': 5,
    '15m': 15,
    '30m': 20,
    '1h': 25,
    '4h': 35,
  } as Record<string, number>,
  CONFLUENCE_WEIGHTS: {
    marketStructure: 20,
    htfAlignment: 20,
    liquidity: 10,
    volumeOrderFlow: 15,
    obFvg: 10,
    momentum: 5,
    supportResistance: 5,
    macroNews: 10,
    riskReward: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SIGNAL STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════

interface SignalMemory {
  state: SignalState;
  decision: 'LONG' | 'SHORT' | 'WAIT';
  entryPrice: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  stopLossPrice: number;
  targetTp1: number;
  targetTp2: number;
  targetTp3: number;
  rewardToRisk: number;
  invalidationLevel: number;
  status: SignalStatus;
  generatedAt: number;
  lastUpdatedAt: number;
  longScore: number;
  shortScore: number;
  cooldownUntil: number;
  invalidationCount: number;
  tradeNumber: number;
}

const signalMemoryStore: Record<string, SignalMemory> = {};

function getSignalMemory(symbol: string): SignalMemory {
  if (!signalMemoryStore[symbol]) {
    signalMemoryStore[symbol] = {
      state: 'WAIT',
      decision: 'WAIT',
      entryPrice: 0,
      entryZoneLow: 0,
      entryZoneHigh: 0,
      stopLossPrice: 0,
      targetTp1: 0,
      targetTp2: 0,
      targetTp3: 0,
      rewardToRisk: 0,
      invalidationLevel: 0,
      status: 'WAITING',
      generatedAt: 0,
      lastUpdatedAt: 0,
      longScore: 0,
      shortScore: 0,
      cooldownUntil: 0,
      invalidationCount: 0,
      tradeNumber: 1,
    };
  }
  return signalMemoryStore[symbol];
}

function updateSignalMemory(symbol: string, update: Partial<SignalMemory>): void {
  const mem = getSignalMemory(symbol);
  Object.assign(mem, update);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. MARKET STRUCTURE ANALYSIS (from candles)
// ═══════════════════════════════════════════════════════════════════════

interface StructureResult {
  higherHighs: number;
  higherLows: number;
  lowerHighs: number;
  lowerLows: number;
  lastSwingHigh: number;
  lastSwingLow: number;
  hasBullishBOS: boolean;
  hasBearishBOS: boolean;
  hasBullishChoch: boolean;
  hasBearishChoch: boolean;
  trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendStrength: number; // 0-100
  priceVsSma20: 'ABOVE' | 'BELOW' | 'AT';
  priceVsSma50: 'ABOVE' | 'BELOW' | 'AT';
  priceSlope20: number; // normalized slope over 20 candles
  recentDisplacement: 'BULLISH' | 'BEARISH' | 'NONE';
  volatilityATR: number;
  avgVolume: number;
  lastCandleRelativeVolume: number;
}

function analyzeStructure(candles: CandleInput[]): StructureResult {
  const result: StructureResult = {
    higherHighs: 0,
    higherLows: 0,
    lowerHighs: 0,
    lowerLows: 0,
    lastSwingHigh: 0,
    lastSwingLow: Infinity,
    hasBullishBOS: false,
    hasBearishBOS: false,
    hasBullishChoch: false,
    hasBearishChoch: false,
    trendBias: 'NEUTRAL',
    trendStrength: 0,
    priceVsSma20: 'AT',
    priceVsSma50: 'AT',
    priceSlope20: 0,
    recentDisplacement: 'NONE',
    volatilityATR: 0,
    avgVolume: 0,
    lastCandleRelativeVolume: 1,
  };

  if (!candles || candles.length < 20) return result;

  // Calculate SMAs
  const len = candles.length;
  const last20 = candles.slice(-20);
  const sma20 = last20.reduce((s, c) => s + c.close, 0) / 20;
  const last50 = candles.slice(-Math.min(50, len));
  const sma50 = last50.reduce((s, c) => s + c.close, 0) / last50.length;
  const currentPrice = candles[len - 1].close;

  result.priceVsSma20 = currentPrice > sma20 * 1.001 ? 'ABOVE' : currentPrice < sma20 * 0.999 ? 'BELOW' : 'AT';
  result.priceVsSma50 = currentPrice > sma50 * 1.001 ? 'ABOVE' : currentPrice < sma50 * 0.999 ? 'BELOW' : 'AT';

  // Price slope (normalized over 20 candles)
  const priceChange = (candles[len - 1].close - candles[len - 20].close) / candles[len - 20].close;
  result.priceSlope20 = priceChange;

  // ATR calculation (14 period)
  let atrSum = 0;
  const atrPeriod = Math.min(14, len - 1);
  for (let i = len - atrPeriod; i < len; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    atrSum += tr;
  }
  result.volatilityATR = atrSum / atrPeriod;

  // Volume analysis
  const volumes = candles.slice(-20).map(c => c.volume);
  result.avgVolume = volumes.reduce((s, v) => s + v, 0) / volumes.length;
  result.lastCandleRelativeVolume = result.avgVolume > 0
    ? candles[len - 1].volume / result.avgVolume
    : 1;

  // Detect swing points (minimum 3-candle confirmation on each side)
  const swingHighs: { index: number; price: number }[] = [];
  const swingLows: { index: number; price: number }[] = [];
  const lookback = 3;

  for (let i = lookback; i < len - lookback; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= candles[i].high || candles[i + j].high > candles[i].high) {
        isSwingHigh = false;
      }
      if (candles[i - j].low <= candles[i].low || candles[i + j].low < candles[i].low) {
        isSwingLow = false;
      }
    }
    if (isSwingHigh) swingHighs.push({ index: i, price: candles[i].high });
    if (isSwingLow) swingLows.push({ index: i, price: candles[i].low });
  }

  // Count HH/HL/LH/LL from the LAST 6-8 swing points
  const recentSwingHighs = swingHighs.slice(-4);
  const recentSwingLows = swingLows.slice(-4);

  for (let i = 1; i < recentSwingHighs.length; i++) {
    if (recentSwingHighs[i].price > recentSwingHighs[i - 1].price) result.higherHighs++;
    if (recentSwingHighs[i].price < recentSwingHighs[i - 1].price) result.lowerHighs++;
  }
  for (let i = 1; i < recentSwingLows.length; i++) {
    if (recentSwingLows[i].price > recentSwingLows[i - 1].price) result.higherLows++;
    if (recentSwingLows[i].price < recentSwingLows[i - 1].price) result.lowerLows++;
  }

  // Last swing high/low
  if (swingHighs.length > 0) result.lastSwingHigh = swingHighs[swingHighs.length - 1].price;
  if (swingLows.length > 0) result.lastSwingLow = swingLows[swingLows.length - 1].price;

  // BOS detection: candle close breaks previous swing high/low
  if (swingHighs.length >= 2 && swingLows.length >= 1) {
    const prevSwingHigh = swingHighs[swingHighs.length - 2].price;
    const prevSwingLow = swingLows[swingLows.length - 1].price;

    // Check last 3 candles for BOS
    for (let i = Math.max(0, len - 3); i < len; i++) {
      if (candles[i].close > prevSwingHigh && (i === 0 || candles[i - 1].close <= prevSwingHigh)) {
        result.hasBullishBOS = true;
      }
      if (candles[i].close < prevSwingLow && (i === 0 || candles[i - 1].close >= prevSwingLow)) {
        result.hasBearishBOS = true;
      }
    }
  }

  // CHoCH detection: trend was one direction, now structure shifts
  const bullishCount = result.higherHighs + result.higherLows;
  const bearishCount = result.lowerHighs + result.lowerLows;

  if (bullishCount >= 2 && result.hasBearishBOS) {
    result.hasBearishChoch = true;
  }
  if (bearishCount >= 2 && result.hasBullishBOS) {
    result.hasBullishChoch = true;
  }

  // Trend bias determination
  const bullishEvidence = result.higherHighs + result.higherLows +
    (result.hasBullishBOS ? 2 : 0) + (result.priceVsSma20 === 'ABOVE' ? 1 : 0) +
    (result.priceVsSma50 === 'ABOVE' ? 1 : 0);
  const bearishEvidence = result.lowerHighs + result.lowerLows +
    (result.hasBearishBOS ? 2 : 0) + (result.priceVsSma20 === 'BELOW' ? 1 : 0) +
    (result.priceVsSma50 === 'BELOW' ? 1 : 0);

  if (bullishEvidence > bearishEvidence + 2) {
    result.trendBias = 'BULLISH';
    result.trendStrength = Math.min(100, Math.round((bullishEvidence / (bullishEvidence + bearishEvidence + 1)) * 100));
  } else if (bearishEvidence > bullishEvidence + 2) {
    result.trendBias = 'BEARISH';
    result.trendStrength = Math.min(100, Math.round((bearishEvidence / (bullishEvidence + bearishEvidence + 1)) * 100));
  } else {
    result.trendBias = 'NEUTRAL';
    result.trendStrength = Math.round(50 - Math.abs(bullishEvidence - bearishEvidence) * 5);
  }

  // Displacement detection (large body candle with volume)
  const lastCandle = candles[len - 1];
  const prevCandle = candles[len - 2];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const avgBody = last20.reduce((s, c) => s + Math.abs(c.close - c.open), 0) / 20;

  if (bodySize > avgBody * 2 && result.lastCandleRelativeVolume > 1.5) {
    result.recentDisplacement = lastCandle.close > lastCandle.open ? 'BULLISH' : 'BEARISH';
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. MARKET REGIME DETERMINATION
// ═══════════════════════════════════════════════════════════════════════

function determineRegime(structure: StructureResult, candles: CandleInput[]): MarketRegime {
  const { trendBias, trendStrength, priceSlope20, volatilityATR, higherHighs, higherLows, lowerHighs, lowerLows } = structure;

  // High volatility check
  if (candles.length >= 20) {
    const currentPrice = candles[candles.length - 1].close;
    const atrPct = (volatilityATR / currentPrice) * 100;
    if (atrPct > 3.0) return 'HIGH_VOLATILITY';
  }

  // Strong trends
  if (trendBias === 'BULLISH' && trendStrength >= 75 && priceSlope20 > 0.02 && higherHighs >= 2 && higherLows >= 2) {
    return 'STRONG_BULLISH';
  }
  if (trendBias === 'BEARISH' && trendStrength >= 75 && priceSlope20 < -0.02 && lowerHighs >= 2 && lowerLows >= 2) {
    return 'STRONG_BEARISH';
  }

  // Regular trends
  if (trendBias === 'BULLISH' && trendStrength >= 55) {
    // Check if lower TFs are pulling back
    if (priceSlope20 < -0.003) return 'BULLISH_PULLBACK';
    return 'BULLISH';
  }
  if (trendBias === 'BEARISH' && trendStrength >= 55) {
    if (priceSlope20 > 0.003) return 'BEARISH_PULLBACK';
    return 'BEARISH';
  }

  // Range detection
  if (trendStrength < 40 && Math.abs(priceSlope20) < 0.005) {
    return 'RANGE';
  }

  return 'UNCLEAR';
}

// ═══════════════════════════════════════════════════════════════════════
// 3. MULTI-TIMEFRAME ANALYSIS (simulated from available candles)
// ═══════════════════════════════════════════════════════════════════════

function analyzeMTF(candles: CandleInput[], primaryTF: string): TimeframeAnalysis[] {
  if (!candles || candles.length < 20) return [];

  const results: TimeframeAnalysis[] = [];

  // We simulate MTF by analyzing different lookback windows on the available candles
  // This maps the primary timeframe's candles to approximate higher TF behavior
  const tfMultipliers: Record<string, { tf: string; multiplier: number; weight: number }[]> = {
    '5m': [
      { tf: '5m', multiplier: 1, weight: 5 },
      { tf: '15m', multiplier: 3, weight: 15 },
      { tf: '30m', multiplier: 6, weight: 20 },
      { tf: '1h', multiplier: 12, weight: 25 },
      { tf: '4h', multiplier: 48, weight: 35 },
    ],
    '15m': [
      { tf: '15m', multiplier: 1, weight: 15 },
      { tf: '30m', multiplier: 2, weight: 20 },
      { tf: '1h', multiplier: 4, weight: 25 },
      { tf: '4h', multiplier: 16, weight: 35 },
    ],
    '30m': [
      { tf: '30m', multiplier: 1, weight: 20 },
      { tf: '1h', multiplier: 2, weight: 25 },
      { tf: '4h', multiplier: 8, weight: 35 },
    ],
    '1h': [
      { tf: '1h', multiplier: 1, weight: 25 },
      { tf: '4h', multiplier: 4, weight: 35 },
    ],
    '4h': [
      { tf: '4h', multiplier: 1, weight: 35 },
    ],
  };

  const multipliers = tfMultipliers[primaryTF] || tfMultipliers['15m'];

  for (const { tf, multiplier, weight } of multipliers) {
    // Aggregate candles to simulate higher TF
    const aggregatedCandles: CandleInput[] = [];
    const step = Math.max(1, multiplier);
    for (let i = 0; i + step <= candles.length; i += step) {
      const chunk = candles.slice(i, i + step);
      aggregatedCandles.push({
        time: chunk[0].time,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((s, c) => s + c.volume, 0),
      });
    }

    if (aggregatedCandles.length < 10) {
      results.push({
        timeframe: tf,
        weight,
        bias: 'NEUTRAL',
        structure: 'Insufficient data',
        hasBOS: false,
        bosDirection: 'NONE',
        hasChoch: false,
        chochDirection: 'NONE',
        trendStrength: 0,
        emaAlignment: 'MIXED',
      });
      continue;
    }

    const struct = analyzeStructure(aggregatedCandles);

    let emaAlignment: 'BULLISH' | 'BEARISH' | 'MIXED' = 'MIXED';
    if (struct.priceVsSma20 === 'ABOVE' && struct.priceVsSma50 === 'ABOVE') emaAlignment = 'BULLISH';
    else if (struct.priceVsSma20 === 'BELOW' && struct.priceVsSma50 === 'BELOW') emaAlignment = 'BEARISH';

    results.push({
      timeframe: tf,
      weight,
      bias: struct.trendBias,
      structure: `HH:${struct.higherHighs} HL:${struct.higherLows} LH:${struct.lowerHighs} LL:${struct.lowerLows}`,
      hasBOS: struct.hasBullishBOS || struct.hasBearishBOS,
      bosDirection: struct.hasBullishBOS ? 'BULLISH' : struct.hasBearishBOS ? 'BEARISH' : 'NONE',
      hasChoch: struct.hasBullishChoch || struct.hasBearishChoch,
      chochDirection: struct.hasBullishChoch ? 'BULLISH' : struct.hasBearishChoch ? 'BEARISH' : 'NONE',
      trendStrength: struct.trendStrength,
      emaAlignment,
    });
  }

  return results;
}

function calculateMTFWeightedScore(mtfAnalysis: TimeframeAnalysis[]): { bullishScore: number; bearishScore: number } {
  let totalWeight = 0;
  let bullishWeighted = 0;
  let bearishWeighted = 0;

  for (const tf of mtfAnalysis) {
    totalWeight += tf.weight;
    if (tf.bias === 'BULLISH') {
      bullishWeighted += tf.weight * (tf.trendStrength / 100);
    } else if (tf.bias === 'BEARISH') {
      bearishWeighted += tf.weight * (tf.trendStrength / 100);
    }
    // NEUTRAL contributes nothing
  }

  if (totalWeight === 0) return { bullishScore: 0, bearishScore: 0 };

  return {
    bullishScore: Math.round((bullishWeighted / totalWeight) * 100),
    bearishScore: Math.round((bearishWeighted / totalWeight) * 100),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 4. MOMENTUM ANALYSIS (Contextual, NOT mechanical)
// ═══════════════════════════════════════════════════════════════════════

interface MomentumResult {
  rsi14: number;
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macdHistogram: number;
  trendContextRsi: 'BULLISH_MOMENTUM' | 'BEARISH_MOMENTUM' | 'OVERBOUGHT_IN_UPTREND' | 'OVERSOLD_IN_DOWNTREND' | 'NEUTRAL';
  adx: number;
  trendStrengthADX: 'STRONG' | 'MODERATE' | 'WEAK' | 'NO_TREND';
}

function analyzeMomentum(candles: CandleInput[], structureBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): MomentumResult {
  const result: MomentumResult = {
    rsi14: 50,
    macdSignal: 'NEUTRAL',
    macdHistogram: 0,
    trendContextRsi: 'NEUTRAL',
    adx: 25,
    trendStrengthADX: 'MODERATE',
  };

  if (candles.length < 26) return result;

  // RSI calculation
  const changes = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }
  const period = 14;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + Math.max(0, changes[i])) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -changes[i])) / period;
  }
  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  result.rsi14 = 100 - (100 / (1 + rs));

  // MACD calculation (12, 26, 9)
  const ema = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const emaArr = [data[0]];
    for (let i = 1; i < data.length; i++) {
      emaArr.push(data[i] * k + emaArr[i - 1] * (1 - k));
    }
    return emaArr;
  };

  const closes = candles.map(c => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  result.macdHistogram = lastMacd - lastSignal;
  result.macdSignal = lastMacd > lastSignal ? 'BULLISH' : lastMacd < lastSignal ? 'BEARISH' : 'NEUTRAL';

  // CONTEXTUAL RSI interpretation (this is the critical fix)
  // RSI > 70 in a strong uptrend = bullish momentum, NOT automatic short
  // RSI < 30 in a strong downtrend = bearish momentum, NOT automatic long
  if (structureBias === 'BULLISH') {
    if (result.rsi14 > 70) {
      result.trendContextRsi = 'OVERBOUGHT_IN_UPTREND'; // Still bullish, just extended
    } else if (result.rsi14 > 50) {
      result.trendContextRsi = 'BULLISH_MOMENTUM';
    } else {
      result.trendContextRsi = 'NEUTRAL'; // Possible pullback
    }
  } else if (structureBias === 'BEARISH') {
    if (result.rsi14 < 30) {
      result.trendContextRsi = 'OVERSOLD_IN_DOWNTREND'; // Still bearish, just extended
    } else if (result.rsi14 < 50) {
      result.trendContextRsi = 'BEARISH_MOMENTUM';
    } else {
      result.trendContextRsi = 'NEUTRAL'; // Possible bounce
    }
  }

  // ADX approximation
  const adxVal = Math.min(100, Math.abs(result.rsi14 - 50) * 2 + Math.abs(result.macdHistogram) * 10);
  result.adx = Math.round(adxVal);
  result.trendStrengthADX = adxVal > 50 ? 'STRONG' : adxVal > 25 ? 'MODERATE' : adxVal > 15 ? 'WEAK' : 'NO_TREND';

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// 5. VOLUME ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

interface VolumeResult {
  relativeVolume: number;
  volumeTrend: 'EXPANDING' | 'CONTRACTING' | 'STABLE';
  buyPressure: number; // 0-100
  sellPressure: number; // 0-100
  volumeConfirmsDirection: boolean;
}

function analyzeVolume(candles: CandleInput[], trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): VolumeResult {
  const result: VolumeResult = {
    relativeVolume: 1,
    volumeTrend: 'STABLE',
    buyPressure: 50,
    sellPressure: 50,
    volumeConfirmsDirection: false,
  };

  if (candles.length < 20) return result;

  const recent = candles.slice(-20);
  const avgVol = recent.reduce((s, c) => s + c.volume, 0) / 20;
  const lastVol = candles[candles.length - 1].volume;
  result.relativeVolume = avgVol > 0 ? lastVol / avgVol : 1;

  // Volume trend
  const first10Vol = recent.slice(0, 10).reduce((s, c) => s + c.volume, 0) / 10;
  const last10Vol = recent.slice(-10).reduce((s, c) => s + c.volume, 0) / 10;
  if (last10Vol > first10Vol * 1.2) result.volumeTrend = 'EXPANDING';
  else if (last10Vol < first10Vol * 0.8) result.volumeTrend = 'CONTRACTING';

  // Buy/sell pressure approximation using candle body position
  let buyCount = 0;
  let sellCount = 0;
  for (const c of recent.slice(-10)) {
    if (c.close > c.open) buyCount++;
    else sellCount++;
  }
  result.buyPressure = Math.round((buyCount / 10) * 100);
  result.sellPressure = Math.round((sellCount / 10) * 100);

  // Volume confirms direction?
  if (trendBias === 'BULLISH' && result.buyPressure > 60 && result.volumeTrend !== 'CONTRACTING') {
    result.volumeConfirmsDirection = true;
  } else if (trendBias === 'BEARISH' && result.sellPressure > 60 && result.volumeTrend !== 'CONTRACTING') {
    result.volumeConfirmsDirection = true;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// 6. LIQUIDITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

interface LiquidityResult {
  nearBuySideLiquidity: number | null;
  nearSellSideLiquidity: number | null;
  recentSweep: 'BUY_SIDE' | 'SELL_SIDE' | null;
  sweepConfirmed: boolean;
  equalHighs: number[];
  equalLows: number[];
}

function analyzeLiquidity(candles: CandleInput[], structure: StructureResult): LiquidityResult {
  const result: LiquidityResult = {
    nearBuySideLiquidity: null,
    nearSellSideLiquidity: null,
    recentSweep: null,
    sweepConfirmed: false,
    equalHighs: [],
    equalLows: [],
  };

  if (candles.length < 20) return result;

  const currentPrice = candles[candles.length - 1].close;
  const tolerance = currentPrice * 0.001; // 0.1%

  // Find equal highs and equal lows (liquidity pools)
  const highs = candles.slice(-30).map(c => c.high);
  const lows = candles.slice(-30).map(c => c.low);

  for (let i = 0; i < highs.length; i++) {
    for (let j = i + 2; j < highs.length; j++) {
      if (Math.abs(highs[i] - highs[j]) < tolerance) {
        if (!result.equalHighs.includes(highs[i])) {
          result.equalHighs.push(highs[i]);
        }
      }
    }
  }

  for (let i = 0; i < lows.length; i++) {
    for (let j = i + 2; j < lows.length; j++) {
      if (Math.abs(lows[i] - lows[j]) < tolerance) {
        if (!result.equalLows.includes(lows[i])) {
          result.equalLows.push(lows[i]);
        }
      }
    }
  }

  // Nearest liquidity
  const buySideLiquidity = result.equalHighs.filter(h => h > currentPrice);
  const sellSideLiquidity = result.equalLows.filter(l => l < currentPrice);

  if (buySideLiquidity.length > 0) {
    result.nearBuySideLiquidity = Math.min(...buySideLiquidity);
  }
  if (sellSideLiquidity.length > 0) {
    result.nearSellSideLiquidity = Math.max(...sellSideLiquidity);
  }

  // Liquidity sweep detection
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  // Buy-side sweep: wick above previous high then close below
  if (structure.lastSwingHigh > 0 && lastCandle.high > structure.lastSwingHigh && lastCandle.close < structure.lastSwingHigh) {
    result.recentSweep = 'BUY_SIDE';
    // Confirmed if followed by bearish displacement
    if (structure.recentDisplacement === 'BEARISH') {
      result.sweepConfirmed = true;
    }
  }

  // Sell-side sweep: wick below previous low then close above
  if (structure.lastSwingLow < Infinity && lastCandle.low < structure.lastSwingLow && lastCandle.close > structure.lastSwingLow) {
    result.recentSweep = 'SELL_SIDE';
    if (structure.recentDisplacement === 'BULLISH') {
      result.sweepConfirmed = true;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// 7. CHASE RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════

function assessChaseRisk(candles: CandleInput[], direction: 'LONG' | 'SHORT'): ChaseRisk {
  if (candles.length < 10) return 'LOW';

  const currentPrice = candles[candles.length - 1].close;
  const lookback = candles.slice(-10);
  const startPrice = lookback[0].open;
  const movePct = Math.abs((currentPrice - startPrice) / startPrice) * 100;

  if (direction === 'LONG') {
    // If price has already pumped significantly, chasing LONG is risky
    const priceUp = currentPrice > startPrice;
    if (priceUp && movePct > SIGNAL_THRESHOLDS.CHASE_THRESHOLD_PCT) return 'HIGH';
    if (priceUp && movePct > SIGNAL_THRESHOLDS.CHASE_MEDIUM_PCT) return 'MEDIUM';
  } else if (direction === 'SHORT') {
    // If price has already dumped significantly, chasing SHORT is risky
    const priceDown = currentPrice < startPrice;
    if (priceDown && movePct > SIGNAL_THRESHOLDS.CHASE_THRESHOLD_PCT) return 'HIGH';
    if (priceDown && movePct > SIGNAL_THRESHOLDS.CHASE_MEDIUM_PCT) return 'MEDIUM';
  }

  return 'LOW';
}

// ═══════════════════════════════════════════════════════════════════════
// 8. CONFLUENCE SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════

function calculateConfluenceScores(
  structure: StructureResult,
  regime: MarketRegime,
  mtfAnalysis: TimeframeAnalysis[],
  momentum: MomentumResult,
  volume: VolumeResult,
  liquidity: LiquidityResult,
  candles: CandleInput[]
): { longScore: number; shortScore: number; scores: ConfluenceScore[] } {
  const W = SIGNAL_THRESHOLDS.CONFLUENCE_WEIGHTS;
  const scores: ConfluenceScore[] = [];

  // 1. Market Structure (20 points)
  let structLong = 0;
  let structShort = 0;
  if (structure.trendBias === 'BULLISH') {
    structLong = W.marketStructure * (structure.trendStrength / 100);
    if (structure.hasBullishBOS) structLong = Math.min(W.marketStructure, structLong + 5);
    if (structure.higherHighs >= 2 && structure.higherLows >= 2) structLong = W.marketStructure;
  } else if (structure.trendBias === 'BEARISH') {
    structShort = W.marketStructure * (structure.trendStrength / 100);
    if (structure.hasBearishBOS) structShort = Math.min(W.marketStructure, structShort + 5);
    if (structure.lowerHighs >= 2 && structure.lowerLows >= 2) structShort = W.marketStructure;
  }
  scores.push({
    name: 'Market Structure',
    maxWeight: W.marketStructure,
    longScore: Math.round(structLong),
    shortScore: Math.round(structShort),
    note: `HH:${structure.higherHighs} HL:${structure.higherLows} LH:${structure.lowerHighs} LL:${structure.lowerLows} | BOS: ${structure.hasBullishBOS ? '↑' : ''}${structure.hasBearishBOS ? '↓' : ''}${(!structure.hasBullishBOS && !structure.hasBearishBOS) ? 'None' : ''}`,
    dataQuality: 'CALCULATED',
  });

  // 2. HTF Alignment (20 points)
  const mtfScores = calculateMTFWeightedScore(mtfAnalysis);
  const htfLong = Math.round(W.htfAlignment * (mtfScores.bullishScore / 100));
  const htfShort = Math.round(W.htfAlignment * (mtfScores.bearishScore / 100));
  const htfBias = mtfAnalysis.filter(t => t.weight >= 25).map(t => t.bias).join(', ') || 'N/A';
  scores.push({
    name: 'HTF Alignment',
    maxWeight: W.htfAlignment,
    longScore: htfLong,
    shortScore: htfShort,
    note: `MTF Bull: ${mtfScores.bullishScore}% Bear: ${mtfScores.bearishScore}% | HTF: ${htfBias}`,
    dataQuality: 'CALCULATED',
  });

  // 3. Liquidity (10 points)
  let liqLong = 0;
  let liqShort = 0;
  if (liquidity.recentSweep === 'SELL_SIDE' && liquidity.sweepConfirmed) {
    liqLong = W.liquidity; // Sell-side swept + confirmed = bullish
  } else if (liquidity.recentSweep === 'BUY_SIDE' && liquidity.sweepConfirmed) {
    liqShort = W.liquidity; // Buy-side swept + confirmed = bearish
  } else if (liquidity.recentSweep && !liquidity.sweepConfirmed) {
    // Sweep without confirmation — partial credit, bias toward wait
    if (liquidity.recentSweep === 'SELL_SIDE') liqLong = Math.round(W.liquidity * 0.3);
    else liqShort = Math.round(W.liquidity * 0.3);
  }
  scores.push({
    name: 'Liquidity',
    maxWeight: W.liquidity,
    longScore: liqLong,
    shortScore: liqShort,
    note: liquidity.recentSweep
      ? `${liquidity.recentSweep} sweep ${liquidity.sweepConfirmed ? 'CONFIRMED' : 'UNCONFIRMED'}`
      : 'No recent sweep',
    dataQuality: 'CALCULATED',
  });

  // 4. Volume / Order Flow (15 points)
  let volLong = 0;
  let volShort = 0;
  if (volume.volumeConfirmsDirection) {
    if (structure.trendBias === 'BULLISH') {
      volLong = W.volumeOrderFlow;
    } else if (structure.trendBias === 'BEARISH') {
      volShort = W.volumeOrderFlow;
    }
  } else {
    // Partial credit based on buy/sell pressure
    if (volume.buyPressure > 65) volLong = Math.round(W.volumeOrderFlow * 0.5);
    else if (volume.sellPressure > 65) volShort = Math.round(W.volumeOrderFlow * 0.5);
  }
  if (volume.volumeTrend === 'EXPANDING' && volume.relativeVolume > 1.3) {
    // Volume expansion adds confidence to the dominant direction
    if (structure.trendBias === 'BULLISH') volLong = Math.min(W.volumeOrderFlow, volLong + 3);
    else if (structure.trendBias === 'BEARISH') volShort = Math.min(W.volumeOrderFlow, volShort + 3);
  }
  scores.push({
    name: 'Volume / Order Flow',
    maxWeight: W.volumeOrderFlow,
    longScore: volLong,
    shortScore: volShort,
    note: `RVol: ${volume.relativeVolume.toFixed(1)}x | Buy: ${volume.buyPressure}% Sell: ${volume.sellPressure}% | Trend: ${volume.volumeTrend}`,
    dataQuality: 'CALCULATED',
  });

  // 5. OB/FVG (10 points)
  // Without external OB/FVG data, we use price location relative to structure
  let obLong = 0;
  let obShort = 0;
  if (candles.length >= 20) {
    const currentPrice = candles[candles.length - 1].close;
    const high20 = Math.max(...candles.slice(-20).map(c => c.high));
    const low20 = Math.min(...candles.slice(-20).map(c => c.low));
    const range = high20 - low20;
    const locationPct = range > 0 ? ((currentPrice - low20) / range) * 100 : 50;

    if (locationPct < 30 && structure.trendBias !== 'BEARISH') {
      obLong = Math.round(W.obFvg * 0.7); // Discount zone — favor long
    } else if (locationPct > 70 && structure.trendBias !== 'BULLISH') {
      obShort = Math.round(W.obFvg * 0.7); // Premium zone — favor short
    }

    // Displacement adds strength
    if (structure.recentDisplacement === 'BULLISH' && locationPct < 40) {
      obLong = W.obFvg;
    } else if (structure.recentDisplacement === 'BEARISH' && locationPct > 60) {
      obShort = W.obFvg;
    }
  }
  scores.push({
    name: 'OB / FVG / Premium-Discount',
    maxWeight: W.obFvg,
    longScore: obLong,
    shortScore: obShort,
    note: structure.recentDisplacement !== 'NONE'
      ? `${structure.recentDisplacement} displacement detected`
      : 'No displacement',
    dataQuality: 'CALCULATED',
  });

  // 6. Momentum (5 points) — CONTEXTUAL, not mechanical
  let momLong = 0;
  let momShort = 0;
  // In bullish structure, bullish momentum confirms. In bearish, bearish confirms.
  // We DO NOT use RSI > 70 = SHORT or RSI < 30 = LONG
  if (momentum.trendContextRsi === 'BULLISH_MOMENTUM') momLong = W.momentum;
  else if (momentum.trendContextRsi === 'BEARISH_MOMENTUM') momShort = W.momentum;
  else if (momentum.trendContextRsi === 'OVERBOUGHT_IN_UPTREND') momLong = Math.round(W.momentum * 0.6);
  else if (momentum.trendContextRsi === 'OVERSOLD_IN_DOWNTREND') momShort = Math.round(W.momentum * 0.6);

  if (momentum.macdSignal === 'BULLISH') momLong = Math.min(W.momentum, momLong + 2);
  else if (momentum.macdSignal === 'BEARISH') momShort = Math.min(W.momentum, momShort + 2);

  scores.push({
    name: 'Momentum',
    maxWeight: W.momentum,
    longScore: momLong,
    shortScore: momShort,
    note: `RSI: ${momentum.rsi14.toFixed(1)} (${momentum.trendContextRsi}) | MACD: ${momentum.macdSignal} | ADX: ${momentum.adx}`,
    dataQuality: 'CALCULATED',
  });

  // 7. Support/Resistance (5 points)
  let srLong = 0;
  let srShort = 0;
  if (candles.length >= 20) {
    const currentPrice = candles[candles.length - 1].close;
    // Check if price is at a support or resistance level
    const nearSupport = currentPrice <= structure.lastSwingLow * 1.005;
    const nearResistance = currentPrice >= structure.lastSwingHigh * 0.995;

    if (nearSupport && structure.trendBias !== 'BEARISH') {
      srLong = W.supportResistance;
    }
    if (nearResistance && structure.trendBias !== 'BULLISH') {
      srShort = W.supportResistance;
    }
  }
  scores.push({
    name: 'Support / Resistance',
    maxWeight: W.supportResistance,
    longScore: srLong,
    shortScore: srShort,
    note: `SwingH: ${structure.lastSwingHigh > 0 ? structure.lastSwingHigh.toFixed(2) : 'N/A'} | SwingL: ${structure.lastSwingLow < Infinity ? structure.lastSwingLow.toFixed(2) : 'N/A'}`,
    dataQuality: 'CALCULATED',
  });

  // 8. Macro/News (10 points) — Cannot be fully assessed without live data
  scores.push({
    name: 'Macro / News',
    maxWeight: W.macroNews,
    longScore: 0,
    shortScore: 0,
    note: 'Live macro data not available — neutral bias applied',
    dataQuality: 'UNAVAILABLE',
  });

  // 9. Risk/Reward (5 points) — assessed after entry/SL/TP calculated
  scores.push({
    name: 'Risk / Reward',
    maxWeight: W.riskReward,
    longScore: 0,
    shortScore: 0,
    note: 'Calculated after entry/SL/TP',
    dataQuality: 'CALCULATED',
  });

  // Sum up
  const totalLong = scores.reduce((s, c) => s + c.longScore, 0);
  const totalShort = scores.reduce((s, c) => s + c.shortScore, 0);

  return {
    longScore: Math.min(100, totalLong),
    shortScore: Math.min(100, totalShort),
    scores,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 9. ENTRY / SL / TP CALCULATION
// ═══════════════════════════════════════════════════════════════════════

interface TradeLevels {
  entryPrice: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  stopLossPrice: number;
  targetTp1: number;
  targetTp2: number;
  targetTp3: number;
  rr: number;
  invalidationLevel: number;
  isValid: boolean;
  validationError: string;
}

function calculateTradeLevels(
  direction: 'LONG' | 'SHORT',
  currentPrice: number,
  structure: StructureResult,
  candles: CandleInput[]
): TradeLevels {
  const result: TradeLevels = {
    entryPrice: currentPrice,
    entryZoneLow: currentPrice,
    entryZoneHigh: currentPrice,
    stopLossPrice: currentPrice,
    targetTp1: currentPrice,
    targetTp2: currentPrice,
    targetTp3: currentPrice,
    rr: 0,
    invalidationLevel: currentPrice,
    isValid: false,
    validationError: '',
  };

  // Calculate swing points from candles
  let swingHigh = structure.lastSwingHigh;
  let swingLow = structure.lastSwingLow;

  // Fallback if no valid swings
  if (swingHigh <= 0 || swingHigh === Infinity) {
    swingHigh = candles.length >= 20
      ? Math.max(...candles.slice(-25).map(c => c.high))
      : currentPrice * 1.01;
  }
  if (swingLow <= 0 || swingLow === Infinity) {
    swingLow = candles.length >= 20
      ? Math.min(...candles.slice(-25).map(c => c.low))
      : currentPrice * 0.99;
  }

  if (direction === 'LONG') {
    // Entry zone: near current price or slightly below (pullback area)
    result.entryPrice = currentPrice;
    result.entryZoneLow = +(currentPrice * 0.997).toFixed(2);
    result.entryZoneHigh = +(currentPrice * 1.002).toFixed(2);

    // SL: below structural swing low
    result.stopLossPrice = +(Math.min(swingLow * 0.998, currentPrice * 0.9885)).toFixed(2);
    result.invalidationLevel = result.stopLossPrice;

    // TPs based on structural SMC targets (~2,000 to 3,000+ points)
    const risk = Math.max(currentPrice * 0.0115, result.entryPrice - result.stopLossPrice);
    result.targetTp1 = +(result.entryPrice + Math.max(risk * 1.8, currentPrice * 0.024)).toFixed(2);
    result.targetTp2 = +(result.entryPrice + Math.max(risk * 3.0, currentPrice * 0.036)).toFixed(2);
    result.targetTp3 = +(result.entryPrice + Math.max(risk * 4.8, currentPrice * 0.052)).toFixed(2);

    // RR calculation
    const reward = result.targetTp3 - result.entryPrice;
    result.rr = risk > 0 ? +(reward / risk).toFixed(2) : 0;

    // Validation: SL < Entry, TP1 > Entry, TP2 > TP1, TP3 > TP2
    if (result.stopLossPrice >= result.entryPrice) {
      result.isValid = false;
      result.validationError = 'LONG: SL must be below entry';
    } else if (result.targetTp1 <= result.entryPrice) {
      result.isValid = false;
      result.validationError = 'LONG: TP1 must be above entry';
    } else if (result.targetTp2 <= result.targetTp1) {
      result.isValid = false;
      result.validationError = 'LONG: TP2 must be above TP1';
    } else if (result.targetTp3 <= result.targetTp2) {
      result.isValid = false;
      result.validationError = 'LONG: TP3 must be above TP2';
    } else {
      result.isValid = true;
    }
  } else {
    // SHORT
    result.entryPrice = currentPrice;
    result.entryZoneLow = +(currentPrice * 0.998).toFixed(2);
    result.entryZoneHigh = +(currentPrice * 1.003).toFixed(2);

    // SL: above structural swing high
    result.stopLossPrice = +(Math.max(swingHigh * 1.002, currentPrice * 1.0115)).toFixed(2);
    result.invalidationLevel = result.stopLossPrice;

    const risk = Math.max(currentPrice * 0.0115, result.stopLossPrice - result.entryPrice);
    result.targetTp1 = +(result.entryPrice - Math.max(risk * 1.8, currentPrice * 0.024)).toFixed(2);
    result.targetTp2 = +(result.entryPrice - Math.max(risk * 3.0, currentPrice * 0.036)).toFixed(2);
    result.targetTp3 = +(result.entryPrice - Math.max(risk * 4.8, currentPrice * 0.052)).toFixed(2);

    const reward = result.entryPrice - result.targetTp3;
    result.rr = risk > 0 ? +(reward / risk).toFixed(2) : 0;

    // Validation: SL > Entry, TP1 < Entry, TP2 < TP1, TP3 < TP2
    if (result.stopLossPrice <= result.entryPrice) {
      result.isValid = false;
      result.validationError = 'SHORT: SL must be above entry';
    } else if (result.targetTp1 >= result.entryPrice) {
      result.isValid = false;
      result.validationError = 'SHORT: TP1 must be below entry';
    } else if (result.targetTp2 >= result.targetTp1) {
      result.isValid = false;
      result.validationError = 'SHORT: TP2 must be below TP1';
    } else if (result.targetTp3 >= result.targetTp2) {
      result.isValid = false;
      result.validationError = 'SHORT: TP3 must be below TP2';
    } else {
      result.isValid = true;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// 10. ENTRY DISTANCE VALIDATION
// ═══════════════════════════════════════════════════════════════════════

function validateEntryDistance(
  currentPrice: number,
  entryPrice: number,
  direction: 'LONG' | 'SHORT'
): { distancePct: number; isMissed: boolean; status: SignalStatus } {
  const distancePct = Math.abs((currentPrice - entryPrice) / entryPrice) * 100;

  if (distancePct > SIGNAL_THRESHOLDS.MAX_ENTRY_DISTANCE_PCT) {
    return { distancePct, isMissed: true, status: 'MISSED_ENTRY' };
  }

  // For LONG, if price is already well above entry, it's missed
  if (direction === 'LONG' && currentPrice > entryPrice * (1 + SIGNAL_THRESHOLDS.MAX_ENTRY_DISTANCE_PCT / 100)) {
    return { distancePct, isMissed: true, status: 'MISSED_ENTRY' };
  }

  // For SHORT, if price is already well below entry, it's missed
  if (direction === 'SHORT' && currentPrice < entryPrice * (1 - SIGNAL_THRESHOLDS.MAX_ENTRY_DISTANCE_PCT / 100)) {
    return { distancePct, isMissed: true, status: 'MISSED_ENTRY' };
  }

  return { distancePct, isMissed: false, status: 'ENTRY_ACTIVE' };
}

// ═══════════════════════════════════════════════════════════════════════
// 11. SIGNAL STATE MACHINE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════

function transitionSignalState(
  symbol: string,
  proposedDecision: 'LONG' | 'SHORT' | 'WAIT',
  longScore: number,
  shortScore: number,
  structureConfirmed: boolean
): SignalState {
  const mem = getSignalMemory(symbol);
  const currentState = mem.state;
  const now = Date.now();

  // Cooldown check
  if (now < mem.cooldownUntil && proposedDecision !== 'WAIT') {
    // During cooldown, only allow WAIT or same direction
    if (proposedDecision !== mem.decision) {
      return currentState; // Don't transition
    }
  }

  switch (currentState) {
    case 'WAIT':
      if (proposedDecision === 'LONG' && longScore >= SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL && structureConfirmed) {
        return 'LONG_SETUP';
      }
      if (proposedDecision === 'SHORT' && shortScore >= SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL && structureConfirmed) {
        return 'SHORT_SETUP';
      }
      return 'WAIT';

    case 'LONG_SETUP':
      if (proposedDecision === 'LONG' && longScore >= SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL) {
        return 'LONG_CONFIRMED';
      }
      if (proposedDecision === 'WAIT' || longScore < SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL * 0.8) {
        return 'WAIT';
      }
      // Don't flip directly to SHORT — must go through invalidation
      if (proposedDecision === 'SHORT') {
        if (shortScore >= SIGNAL_THRESHOLDS.MIN_SCORE_TO_FLIP && structureConfirmed) {
          return 'LONG_INVALIDATED';
        }
        return 'LONG_SETUP'; // Stay, insufficient evidence to flip
      }
      return 'LONG_SETUP';

    case 'LONG_CONFIRMED':
      if (proposedDecision === 'LONG') return 'LONG_CONFIRMED'; // Stay
      if (proposedDecision === 'WAIT' && longScore < SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL * 0.7) {
        return 'LONG_INVALIDATED';
      }
      if (proposedDecision === 'SHORT' && shortScore >= SIGNAL_THRESHOLDS.MIN_SCORE_TO_FLIP && structureConfirmed) {
        return 'LONG_INVALIDATED';
      }
      return 'LONG_CONFIRMED'; // Stay — need strong evidence to invalidate

    case 'LONG_INVALIDATED':
      return 'WAIT'; // Always go to WAIT after invalidation

    case 'SHORT_SETUP':
      if (proposedDecision === 'SHORT' && shortScore >= SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL) {
        return 'SHORT_CONFIRMED';
      }
      if (proposedDecision === 'WAIT' || shortScore < SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL * 0.8) {
        return 'WAIT';
      }
      if (proposedDecision === 'LONG') {
        if (longScore >= SIGNAL_THRESHOLDS.MIN_SCORE_TO_FLIP && structureConfirmed) {
          return 'SHORT_INVALIDATED';
        }
        return 'SHORT_SETUP';
      }
      return 'SHORT_SETUP';

    case 'SHORT_CONFIRMED':
      if (proposedDecision === 'SHORT') return 'SHORT_CONFIRMED';
      if (proposedDecision === 'WAIT' && shortScore < SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL * 0.7) {
        return 'SHORT_INVALIDATED';
      }
      if (proposedDecision === 'LONG' && longScore >= SIGNAL_THRESHOLDS.MIN_SCORE_TO_FLIP && structureConfirmed) {
        return 'SHORT_INVALIDATED';
      }
      return 'SHORT_CONFIRMED';

    case 'SHORT_INVALIDATED':
      return 'WAIT';

    default:
      return 'WAIT';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 12. GRADE ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════

function assessGrade(
  score: number,
  scoreDelta: number,
  chaseRisk: ChaseRisk,
  rrRatio: number,
  levelsValid: boolean,
  structureConfirmed: boolean
): SignalGrade {
  if (!levelsValid || !structureConfirmed || chaseRisk === 'HIGH' || rrRatio < SIGNAL_THRESHOLDS.MIN_RR) {
    return 'NO_TRADE';
  }

  if (score >= 88 && scoreDelta >= 25 && chaseRisk === 'LOW' && rrRatio >= 2.5) return 'A+';
  if (score >= 78 && scoreDelta >= 16 && rrRatio >= 1.8) return 'A';
  if (score >= 70 && scoreDelta >= 12 && rrRatio >= SIGNAL_THRESHOLDS.MIN_RR) return 'B';
  if (score >= 60) return 'C';
  return 'NO_TRADE';
}

// ═══════════════════════════════════════════════════════════════════════
// MASTER DECISION ENGINE
// ═══════════════════════════════════════════════════════════════════════

export function evaluateSignal(
  symbol: string,
  candles: CandleInput[],
  currentPrice: number,
  timeframe: string = '15m'
): SignalDecision {
  const now = Date.now();
  const mem = getSignalMemory(symbol);

  // Default WAIT result
  const waitResult = (): SignalDecision => buildWaitDecision(symbol, currentPrice, candles, timeframe, now);

  // Insufficient data check
  if (!candles || candles.length < 20) {
    return waitResult();
  }

  // ─── Step 1: Analyze market structure ───
  const structure = analyzeStructure(candles);

  // ─── Step 2: Determine market regime ───
  const regime = determineRegime(structure, candles);

  // ─── Step 3: Multi-timeframe analysis ───
  const mtfAnalysis = analyzeMTF(candles, timeframe);

  // ─── Step 4: Momentum analysis (contextual) ───
  const momentum = analyzeMomentum(candles, structure.trendBias);

  // ─── Step 5: Volume analysis ───
  const volumeAnalysis = analyzeVolume(candles, structure.trendBias);

  // ─── Step 6: Liquidity analysis ───
  const liquidity = analyzeLiquidity(candles, structure);

  // ─── Step 7: Calculate confluence scores ───
  const { longScore, shortScore, scores: confluenceScores } = calculateConfluenceScores(
    structure, regime, mtfAnalysis, momentum, volumeAnalysis, liquidity, candles
  );

  // ─── Step 8: Determine proposed direction ───
  let proposedDecision: 'LONG' | 'SHORT' | 'WAIT' = 'WAIT';
  const scoreDelta = Math.abs(longScore - shortScore);

  if (longScore >= SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL &&
      longScore - shortScore >= SIGNAL_THRESHOLDS.MIN_SCORE_DELTA) {
    proposedDecision = 'LONG';
  } else if (shortScore >= SIGNAL_THRESHOLDS.MIN_SCORE_FOR_SIGNAL &&
             shortScore - longScore >= SIGNAL_THRESHOLDS.MIN_SCORE_DELTA) {
    proposedDecision = 'SHORT';
  }

  // ─── Step 9: Structure confirmation check ───
  const structureConfirmed = proposedDecision === 'LONG'
    ? (structure.trendBias === 'BULLISH' || structure.hasBullishBOS || structure.hasBullishChoch)
    : proposedDecision === 'SHORT'
    ? (structure.trendBias === 'BEARISH' || structure.hasBearishBOS || structure.hasBearishChoch)
    : false;

  if (proposedDecision !== 'WAIT' && !structureConfirmed) {
    proposedDecision = 'WAIT'; // No structural confirmation = WAIT
  }

  // ─── Step 10: Signal state machine ───
  const newState = transitionSignalState(symbol, proposedDecision, longScore, shortScore, structureConfirmed);

  // Map state to final decision
  let finalDecision: 'LONG' | 'SHORT' | 'WAIT' = 'WAIT';
  if (newState === 'LONG_CONFIRMED' || newState === 'LONG_SETUP') finalDecision = 'LONG';
  else if (newState === 'SHORT_CONFIRMED' || newState === 'SHORT_SETUP') finalDecision = 'SHORT';

  // ─── Step 11: Chase risk assessment ───
  const chaseRisk = finalDecision !== 'WAIT' ? assessChaseRisk(candles, finalDecision) : 'LOW' as ChaseRisk;
  if (chaseRisk === 'HIGH') {
    finalDecision = 'WAIT';
  }

  // ─── Step 12: Maintain Locked Levels or Calculate Fresh Setup ───
  let levels: TradeLevels | null = null;
  let signalStatus: SignalStatus = 'WAITING';

  if (finalDecision !== 'WAIT') {
    const isAlreadyActive =
      mem.decision === finalDecision &&
      mem.entryPrice > 0 &&
      mem.stopLossPrice > 0 &&
      mem.status !== 'SL_HIT' &&
      (mem.state === 'LONG_CONFIRMED' || mem.state === 'LONG_SETUP' ||
       mem.state === 'SHORT_CONFIRMED' || mem.state === 'SHORT_SETUP');

    if (isAlreadyActive) {
      // KEEP FROZEN ANCHORED LEVELS — NEVER FLOAT OR MOVE SL DOWN AGAINST TRADER!
      levels = {
        entryPrice: mem.entryPrice,
        entryZoneLow: mem.entryZoneLow || mem.entryPrice * 0.997,
        entryZoneHigh: mem.entryZoneHigh || mem.entryPrice * 1.002,
        stopLossPrice: mem.stopLossPrice,
        targetTp1: mem.targetTp1,
        targetTp2: mem.targetTp2,
        targetTp3: mem.targetTp3,
        rr: mem.rewardToRisk || 2.5,
        invalidationLevel: mem.invalidationLevel || mem.stopLossPrice,
        isValid: true,
        validationError: '',
      };

      // Real-time evaluation against the STRICTLY LOCKED SL & TPs
      if (finalDecision === 'LONG') {
        if (currentPrice <= mem.stopLossPrice) {
          // STOP LOSS HIT: Invalidation enforced, never slide SL down!
          signalStatus = 'SL_HIT';
          finalDecision = 'WAIT';
          updateSignalMemory(symbol, {
            state: 'LONG_INVALIDATED',
            decision: 'WAIT',
            status: 'SL_HIT',
            cooldownUntil: now + SIGNAL_THRESHOLDS.COOLDOWN_MS,
          });
        } else if (currentPrice >= mem.targetTp3) {
          signalStatus = 'TP_HIT';
        } else if (currentPrice >= mem.targetTp1) {
          signalStatus = 'ACTIVE_TRADE';
        } else {
          signalStatus = 'ACTIVE_TRADE';
        }
      } else {
        // SHORT
        if (currentPrice >= mem.stopLossPrice) {
          // STOP LOSS HIT: Invalidation enforced, never slide SL up!
          signalStatus = 'SL_HIT';
          finalDecision = 'WAIT';
          updateSignalMemory(symbol, {
            state: 'SHORT_INVALIDATED',
            decision: 'WAIT',
            status: 'SL_HIT',
            cooldownUntil: now + SIGNAL_THRESHOLDS.COOLDOWN_MS,
          });
        } else if (currentPrice <= mem.targetTp3) {
          signalStatus = 'TP_HIT';
        } else if (currentPrice <= mem.targetTp1) {
          signalStatus = 'ACTIVE_TRADE';
        } else {
          signalStatus = 'ACTIVE_TRADE';
        }
      }
    } else {
      // FRESH SETUP - Compute initial structural levels
      levels = calculateTradeLevels(finalDecision, currentPrice, structure, candles);

      // Level validation
      if (!levels.isValid) {
        finalDecision = 'WAIT';
      }

      // RR validation
      if (levels.rr < SIGNAL_THRESHOLDS.MIN_RR) {
        finalDecision = 'WAIT';
      }

      // Entry distance validation
      if (finalDecision !== 'WAIT') {
        const entryValidation = validateEntryDistance(currentPrice, levels.entryPrice, finalDecision);
        if (entryValidation.isMissed) {
          finalDecision = 'WAIT';
          signalStatus = 'MISSED_ENTRY';
        } else {
          signalStatus = entryValidation.status;
        }
      }
    }
  }

  // ─── Step 13: Update RR score in confluence ───
  if (levels && levels.isValid && levels.rr >= SIGNAL_THRESHOLDS.MIN_RR) {
    const rrScore = confluenceScores.find(s => s.name === 'Risk / Reward');
    if (rrScore) {
      const rrPoints = Math.min(5, Math.round(levels.rr));
      if (finalDecision === 'LONG') rrScore.longScore = rrPoints;
      else if (finalDecision === 'SHORT') rrScore.shortScore = rrPoints;
      rrScore.note = 'RR: 1:' + levels.rr.toFixed(2);
    }
  }

  // ─── Step 14: Grade assessment ───
  const activeScore = finalDecision === 'LONG' ? longScore : finalDecision === 'SHORT' ? shortScore : 0;
  const grade = finalDecision !== 'WAIT'
    ? assessGrade(activeScore, scoreDelta, chaseRisk, levels?.rr || 0, levels?.isValid || false, structureConfirmed)
    : 'NO_TRADE' as SignalGrade;

  // Only high-quality grades (A+, A, B) produce actionable signals; C and NO_TRADE remain in disciplined WAIT mode
  if (grade === 'C' || grade === 'NO_TRADE') {
    finalDecision = 'WAIT';
  }

  // ─── Step 15: Update signal memory with locked levels ───
  const stateChanged = newState !== mem.state || finalDecision !== mem.decision;
  if (finalDecision !== 'WAIT' && levels && levels.isValid) {
    const isNew = mem.decision !== finalDecision || mem.state === 'WAIT';
    updateSignalMemory(symbol, {
      state: newState,
      decision: finalDecision,
      entryPrice: isNew ? levels.entryPrice : mem.entryPrice,
      entryZoneLow: isNew ? levels.entryZoneLow : mem.entryZoneLow,
      entryZoneHigh: isNew ? levels.entryZoneHigh : mem.entryZoneHigh,
      stopLossPrice: isNew ? levels.stopLossPrice : mem.stopLossPrice,
      targetTp1: isNew ? levels.targetTp1 : mem.targetTp1,
      targetTp2: isNew ? levels.targetTp2 : mem.targetTp2,
      targetTp3: isNew ? levels.targetTp3 : mem.targetTp3,
      rewardToRisk: isNew ? levels.rr : mem.rewardToRisk,
      invalidationLevel: isNew ? levels.invalidationLevel : mem.invalidationLevel,
      status: signalStatus,
      generatedAt: isNew ? now : mem.generatedAt,
      lastUpdatedAt: now,
      longScore,
      shortScore,
      cooldownUntil: isNew ? now + SIGNAL_THRESHOLDS.COOLDOWN_MS : mem.cooldownUntil,
      tradeNumber: isNew ? (mem.tradeNumber || 0) + 1 : mem.tradeNumber,
    });
  } else if (finalDecision === 'WAIT') {
    updateSignalMemory(symbol, {
      lastUpdatedAt: now,
      longScore,
      shortScore,
      status: signalStatus === 'SL_HIT' ? 'SL_HIT' : signalStatus === 'MISSED_ENTRY' ? 'MISSED_ENTRY' : 'WAITING',
    });
  }

  // ─── Step 16: Signal expiry check ───
  if (finalDecision !== 'WAIT' && mem.generatedAt > 0 && (now - mem.generatedAt) > SIGNAL_THRESHOLDS.SIGNAL_EXPIRY_MS) {
    finalDecision = 'WAIT';
    signalStatus = 'EXPIRED';
  }

  // ─── Step 17: Build explanations ───
  const topReasons = buildExplanations(finalDecision, structure, regime, mtfAnalysis, momentum, volumeAnalysis, liquidity, chaseRisk);

  // ─── Step 18: Determine regime label ───
  const regimeLabel = getRegimeLabel(regime);

  // ─── Step 19: Build final confidence ───
  const confidence = finalDecision === 'WAIT'
    ? 0
    : Math.min(99, Math.round(activeScore * (grade === 'A+' ? 1.0 : grade === 'A' ? 0.95 : 0.85)));

  // ─── Step 20: Determine MTF bias for debug ───
  const htfEntries = mtfAnalysis.filter(t => t.weight >= 25);
  const htfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    htfEntries.length > 0 && htfEntries.every(t => t.bias === 'BULLISH') ? 'BULLISH' :
    htfEntries.length > 0 && htfEntries.every(t => t.bias === 'BEARISH') ? 'BEARISH' : 'NEUTRAL';

  // ─── Build result ───
  return {
    decision: finalDecision,
    confidence,
    grade,
    signalState: newState,
    signalStatus: finalDecision === 'WAIT' ? (signalStatus === 'MISSED_ENTRY' ? 'MISSED_ENTRY' : 'WAITING') : signalStatus,
    regime,
    regimeLabel,
    longScore,
    shortScore,
    scoreDelta,
    currentPrice,
    entryPrice: levels?.entryPrice || currentPrice,
    entryZoneLow: levels?.entryZoneLow || currentPrice,
    entryZoneHigh: levels?.entryZoneHigh || currentPrice,
    entryDistancePct: levels ? Math.abs((currentPrice - levels.entryPrice) / levels.entryPrice) * 100 : 0,
    stopLossPrice: levels?.stopLossPrice || currentPrice,
    targetTp1: levels?.targetTp1 || currentPrice,
    targetTp2: levels?.targetTp2 || currentPrice,
    targetTp3: levels?.targetTp3 || currentPrice,
    rewardToRisk: levels?.rr || 0,
    invalidationLevel: levels?.invalidationLevel || currentPrice,
    chaseRisk,
    signalAge: mem.generatedAt > 0 ? now - mem.generatedAt : 0,
    signalGeneratedAt: mem.generatedAt || now,
    signalUpdatedAt: now,
    topReasons,
    whyThisSignal: topReasons.length > 0 ? topReasons.map(r => r.reason).join('; ') : 'No high-confidence setup detected. Protect capital and wait.',
    structureNote: `${structure.trendBias} | HH:${structure.higherHighs} HL:${structure.higherLows} LH:${structure.lowerHighs} LL:${structure.lowerLows}`,
    liquidityNote: liquidity.recentSweep
      ? `${liquidity.recentSweep} sweep ${liquidity.sweepConfirmed ? '(CONFIRMED)' : '(PENDING)'}`
      : 'No active sweep',
    orderFlowNote: `Buy: ${volumeAnalysis.buyPressure}% | Sell: ${volumeAnalysis.sellPressure}% | RVol: ${volumeAnalysis.relativeVolume.toFixed(1)}x`,
    macroNote: 'Live macro data integration pending',
    invalidationRule: levels && finalDecision !== 'WAIT'
      ? `Candle close ${finalDecision === 'LONG' ? 'below' : 'above'} $${levels.stopLossPrice.toLocaleString()} invalidates the setup.`
      : 'No active setup to invalidate.',
    confluenceScores,
    debug: {
      currentMarketRegime: regime,
      htfBias,
      structureBias: structure.trendBias,
      liquidityBias: liquidity.recentSweep === 'SELL_SIDE' ? 'BULLISH' : liquidity.recentSweep === 'BUY_SIDE' ? 'BEARISH' : 'NEUTRAL',
      volumeBias: volumeAnalysis.buyPressure > 60 ? 'BULLISH' : volumeAnalysis.sellPressure > 60 ? 'BEARISH' : 'NEUTRAL',
      orderFlowBias: volumeAnalysis.volumeConfirmsDirection ? structure.trendBias : 'NEUTRAL',
      momentumBias: momentum.macdSignal === 'BULLISH' ? 'BULLISH' : momentum.macdSignal === 'BEARISH' ? 'BEARISH' : 'NEUTRAL',
      macroBias: 'NEUTRAL',
      longScore,
      shortScore,
      signalState: newState,
      previousSignal: mem.decision,
      signalChangeReason: stateChanged ? `State: ${mem.state} → ${newState}` : 'No change',
      invalidationReason: newState.includes('INVALIDATED') ? 'Structure invalidated by opposing evidence' : '',
      chaseRisk,
      newsRisk: 'LOW',
      rrValidation: levels?.isValid || false,
      entryDistancePct: levels ? Math.abs((currentPrice - levels.entryPrice) / levels.entryPrice) * 100 : 0,
      mtfScores: mtfAnalysis,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function buildWaitDecision(symbol: string, currentPrice: number, candles: CandleInput[], timeframe: string, now: number): SignalDecision {
  const structure = candles && candles.length >= 20 ? analyzeStructure(candles) : null;
  const regime: MarketRegime = structure ? determineRegime(structure, candles) : 'UNCLEAR';
  const mtfAnalysis = candles && candles.length >= 20 ? analyzeMTF(candles, timeframe) : [];

  return {
    decision: 'WAIT',
    confidence: 0,
    grade: 'NO_TRADE',
    signalState: 'WAIT',
    signalStatus: 'WAITING',
    regime,
    regimeLabel: getRegimeLabel(regime),
    longScore: 0,
    shortScore: 0,
    scoreDelta: 0,
    currentPrice,
    entryPrice: currentPrice,
    entryZoneLow: currentPrice,
    entryZoneHigh: currentPrice,
    entryDistancePct: 0,
    stopLossPrice: 0,
    targetTp1: 0,
    targetTp2: 0,
    targetTp3: 0,
    rewardToRisk: 0,
    invalidationLevel: 0,
    chaseRisk: 'LOW',
    signalAge: 0,
    signalGeneratedAt: now,
    signalUpdatedAt: now,
    topReasons: [{ reason: 'Insufficient data or no high-confidence setup detected.', importance: 'HIGH' }],
    whyThisSignal: 'No high-confidence setup. Protect capital and wait for confirmation.',
    structureNote: structure ? `${structure.trendBias} | HH:${structure.higherHighs} HL:${structure.higherLows} LH:${structure.lowerHighs} LL:${structure.lowerLows}` : 'Insufficient data',
    liquidityNote: 'No active sweep',
    orderFlowNote: 'Insufficient data',
    macroNote: 'Live macro data integration pending',
    invalidationRule: 'No active setup to invalidate.',
    confluenceScores: [],
    debug: {
      currentMarketRegime: regime,
      htfBias: 'NEUTRAL',
      structureBias: structure?.trendBias || 'NEUTRAL',
      liquidityBias: 'NEUTRAL',
      volumeBias: 'NEUTRAL',
      orderFlowBias: 'NEUTRAL',
      momentumBias: 'NEUTRAL',
      macroBias: 'NEUTRAL',
      longScore: 0,
      shortScore: 0,
      signalState: 'WAIT',
      previousSignal: 'WAIT',
      signalChangeReason: 'Initial state',
      invalidationReason: '',
      chaseRisk: 'LOW',
      newsRisk: 'LOW',
      rrValidation: false,
      entryDistancePct: 0,
      mtfScores: mtfAnalysis,
    },
  };
}

function getRegimeLabel(regime: MarketRegime): string {
  const labels: Record<MarketRegime, string> = {
    'STRONG_BULLISH': '🟢 Strong Bullish Trend',
    'BULLISH': '🟢 Bullish',
    'BULLISH_PULLBACK': '🟡 Bullish Pullback (Do NOT short)',
    'RANGE': '🟡 Range / Consolidation',
    'BEARISH_PULLBACK': '🟡 Bearish Pullback (Do NOT long)',
    'BEARISH': '🔴 Bearish',
    'STRONG_BEARISH': '🔴 Strong Bearish Trend',
    'HIGH_VOLATILITY': '⚠️ High Volatility — Caution',
    'EVENT_RISK': '⚠️ Event Risk — Avoid',
    'UNCLEAR': '🟡 Unclear — Wait for clarity',
  };
  return labels[regime] || regime;
}

function buildExplanations(
  decision: 'LONG' | 'SHORT' | 'WAIT',
  structure: StructureResult,
  regime: MarketRegime,
  mtfAnalysis: TimeframeAnalysis[],
  momentum: MomentumResult,
  volume: VolumeResult,
  liquidity: LiquidityResult,
  chaseRisk: ChaseRisk
): SignalExplanation[] {
  const reasons: SignalExplanation[] = [];

  if (decision === 'WAIT') {
    if (regime === 'RANGE') {
      reasons.push({ reason: 'Market is ranging — no clear directional edge.', importance: 'HIGH' });
    }
    if (regime === 'UNCLEAR') {
      reasons.push({ reason: 'Market regime unclear — waiting for structural clarity.', importance: 'HIGH' });
    }
    if (regime === 'HIGH_VOLATILITY') {
      reasons.push({ reason: 'High volatility environment — reduced position sizing or wait.', importance: 'HIGH' });
    }
    if (chaseRisk === 'HIGH') {
      reasons.push({ reason: 'Price has already moved significantly — chase risk too high.', importance: 'HIGH' });
    }
    if (structure.trendBias === 'NEUTRAL') {
      reasons.push({ reason: 'No clear trend structure (mixed HH/HL and LH/LL).', importance: 'MEDIUM' });
    }
    if (reasons.length === 0) {
      reasons.push({ reason: 'Confluence scores do not meet minimum threshold for a trade.', importance: 'HIGH' });
    }
    return reasons.slice(0, 5);
  }

  if (decision === 'LONG') {
    if (structure.trendBias === 'BULLISH') {
      reasons.push({ reason: `Bullish market structure: ${structure.higherHighs} HH + ${structure.higherLows} HL confirmed.`, importance: 'HIGH' });
    }
    if (structure.hasBullishBOS) {
      reasons.push({ reason: 'Bullish Break of Structure (BOS) confirmed on close.', importance: 'HIGH' });
    }
    const bullishHTF = mtfAnalysis.filter(t => t.weight >= 25 && t.bias === 'BULLISH');
    if (bullishHTF.length > 0) {
      reasons.push({ reason: `Higher timeframe bullish: ${bullishHTF.map(t => t.timeframe).join(', ')} aligned.`, importance: 'HIGH' });
    }
    if (liquidity.recentSweep === 'SELL_SIDE' && liquidity.sweepConfirmed) {
      reasons.push({ reason: 'Sell-side liquidity swept and confirmed with bullish displacement.', importance: 'HIGH' });
    }
    if (volume.volumeConfirmsDirection) {
      reasons.push({ reason: `Volume confirms bullish direction (Buy: ${volume.buyPressure}%, RVol: ${volume.relativeVolume.toFixed(1)}x).`, importance: 'MEDIUM' });
    }
    if (structure.priceVsSma20 === 'ABOVE') {
      reasons.push({ reason: 'Price holding above SMA20 — bullish EMA structure.', importance: 'MEDIUM' });
    }
    if (momentum.macdSignal === 'BULLISH') {
      reasons.push({ reason: 'MACD bullish crossover active.', importance: 'LOW' });
    }
  }

  if (decision === 'SHORT') {
    if (structure.trendBias === 'BEARISH') {
      reasons.push({ reason: `Bearish market structure: ${structure.lowerHighs} LH + ${structure.lowerLows} LL confirmed.`, importance: 'HIGH' });
    }
    if (structure.hasBearishBOS) {
      reasons.push({ reason: 'Bearish Break of Structure (BOS) confirmed on close.', importance: 'HIGH' });
    }
    const bearishHTF = mtfAnalysis.filter(t => t.weight >= 25 && t.bias === 'BEARISH');
    if (bearishHTF.length > 0) {
      reasons.push({ reason: `Higher timeframe bearish: ${bearishHTF.map(t => t.timeframe).join(', ')} aligned.`, importance: 'HIGH' });
    }
    if (liquidity.recentSweep === 'BUY_SIDE' && liquidity.sweepConfirmed) {
      reasons.push({ reason: 'Buy-side liquidity swept and confirmed with bearish displacement.', importance: 'HIGH' });
    }
    if (volume.volumeConfirmsDirection) {
      reasons.push({ reason: `Volume confirms bearish direction (Sell: ${volume.sellPressure}%, RVol: ${volume.relativeVolume.toFixed(1)}x).`, importance: 'MEDIUM' });
    }
    if (structure.priceVsSma20 === 'BELOW') {
      reasons.push({ reason: 'Price rejected below SMA20 — bearish EMA structure.', importance: 'MEDIUM' });
    }
    if (momentum.macdSignal === 'BEARISH') {
      reasons.push({ reason: 'MACD bearish crossover active.', importance: 'LOW' });
    }
  }

  return reasons.slice(0, 5);
}

/**
 * Reset signal memory for a symbol (used when switching assets or manually resetting).
 */
export function resetSignalMemory(symbol: string): void {
  delete signalMemoryStore[symbol];
}

/**
 * Get the current signal memory state for debugging.
 */
export function getSignalMemoryState(symbol: string): SignalMemory {
  return getSignalMemory(symbol);
}
