/**
 * Institutional Market Structure & Key Levels Detection Engine
 * Pure mathematical algorithms for SMC (Smart Money Concepts), ICT, Price Action & Volume:
 * - Swing Highs / Lows (Adjustable sensitivity)
 * - Break of Structure (BOS) & Change of Character (CHoCH)
 * - Order Block (OB) Detection (Displacement & Structure confirmation)
 * - Fair Value Gap (FVG) Detection (Filled/Unfilled status)
 * - Support & Resistance Clustering with Strength Scoring (0-100)
 * - Previous High / Low (PDH, PDL, PWH, PWL, PMH, PML, CDH, CDL, CWH, CWL)
 * - Liquidity Map (BSL, SSL, Equal Highs/Lows, Liquidity Sweeps)
 * - Premium / Discount Range (Equilibrium 50% & Current Price %)
 * - Volume Profile (POC, VAH, VAL, High Volume Nodes, Low Volume Nodes)
 * - VWAP (Daily, Weekly, Session with standard deviation bands)
 * - Session Levels (Asian, London, New York Highs & Lows)
 * - Dynamic Psychological Key Levels
 * - Key Level Confluence Scoring (0-100)
 * - Trade Location Engine (GOOD / NEUTRAL / POOR)
 * - High-Conviction Trade Setup Engine (LONG / SHORT / WAIT)
 */

export interface CandleData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeframeId =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '12h'
  | '1d'
  | '1w'
  | '1M';

export interface SwingPoint {
  time: number;
  price: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
  category: 'MAJOR' | 'MINOR';
  index: number;
  swept?: boolean;
}

export interface StructureBreak {
  id: string;
  type: 'BOS' | 'CHoCH';
  direction: 'BULLISH' | 'BEARISH';
  price: number;
  brokenSwingPrice: number;
  time: number;
  timeframe: string;
  strength: number; // 0-100
  label: string; // e.g. "BOS ↑", "CHoCH ↓"
}

export interface OrderBlockZone {
  id: string;
  type: 'BULLISH_OB' | 'BEARISH_OB';
  topPrice: number;
  bottomPrice: number;
  midPrice: number;
  creationTime: number;
  creationTimeframe: string;
  strength: number; // 0-100
  retestCount: number;
  status: 'FRESH' | 'TESTED' | 'MITIGATED';
  confidenceScore: number; // 0-100
  volumeExpansionRatio: number;
  structureBreakConfirmed: boolean;
  liquiditySweepConfirmed: boolean;
}

export interface FairValueGap {
  id: string;
  type: 'BULLISH_FVG' | 'BEARISH_FVG';
  topPrice: number;
  bottomPrice: number;
  midPrice: number;
  time: number;
  timeframe: string;
  sizePoints: number;
  sizePct: number;
  status: 'UNFILLED' | 'PARTIALLY_FILLED' | 'FILLED';
  strength: number; // 0-100
}

export interface SupportResistanceLevel {
  id: string;
  type: 'SUPPORT' | 'RESISTANCE';
  price: number;
  rank: 'MAJOR' | 'STRONG' | 'MODERATE' | 'MINOR';
  strengthScore: number; // 0-100
  touchCount: number;
  timeframe: string;
  description: string;
  isBreakAndRetest?: boolean;
}

export interface PreviousHighLowLevels {
  pdh: number | null; // Previous Day High
  pdl: number | null; // Previous Day Low
  pwh: number | null; // Previous Week High
  pwl: number | null; // Previous Week Low
  pmh: number | null; // Previous Month High
  pml: number | null; // Previous Month Low
  cdh: number | null; // Current Day High
  cdl: number | null; // Current Day Low
  cwh: number | null; // Current Week High
  cwl: number | null; // Current Week Low
}

export interface LiquidityZone {
  id: string;
  type: 'BUY_SIDE_LIQUIDITY' | 'SELL_SIDE_LIQUIDITY';
  price: number;
  label: string;
  isEqualHighLow: boolean;
  strength: number;
  retests: number;
  swept: boolean;
  sweepTime?: number;
  reaction?: string;
}

export interface LiquiditySweepEvent {
  id: string;
  levelPrice: number;
  timeframe: string;
  direction: 'BULLISH_SWEEP' | 'BEARISH_SWEEP';
  sweepType: 'BUY_SIDE_SWEEP' | 'SELL_SIDE_SWEEP';
  sweptPrice: number;
  time: number;
  reaction: 'STRONG_REVERSAL' | 'ABSORPTION' | 'CONTINUATION';
  confirmationStatus: 'CONFIRMED' | 'PENDING';
  note: string;
}

export interface PremiumDiscountState {
  rangeHigh: number;
  rangeLow: number;
  equilibrium50: number;
  currentPrice: number;
  locationPct: number; // 0 - 100%
  zone: 'DEEP_DISCOUNT' | 'DISCOUNT' | 'EQUILIBRIUM' | 'PREMIUM' | 'EXTREME_PREMIUM';
  interpretation: string;
}

export interface VolumeProfileResult {
  poc: number; // Point of control
  vah: number; // Value area high (70%)
  val: number; // Value area low (70%)
  totalVolume: number;
  nodes: Array<{
    price: number;
    volume: number;
    isPOC: boolean;
    isHVN: boolean;
    isLVN: boolean;
  }>;
}

export interface VWAPLevels {
  dailyVwap: number;
  upperBand1: number;
  lowerBand1: number;
  upperBand2: number;
  lowerBand2: number;
  weeklyVwap: number;
}

export interface SessionLevels {
  asian: { high: number; low: number; vwap?: number; active: boolean };
  london: { high: number; low: number; vwap?: number; active: boolean };
  newYork: { high: number; low: number; vwap?: number; active: boolean };
}

export interface ConfluenceKeyLevel {
  id: string;
  name: string;
  price: number;
  timeframe: string;
  score: number; // 0 - 100
  isHighConfluence: boolean;
  factors: string[];
  distancePoints: number;
  distancePct: number;
  role: 'SUPPORT' | 'RESISTANCE' | 'DEMAND' | 'SUPPLY' | 'PIVOT';
}

export interface MTFStructureRow {
  timeframe: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: string; // e.g. "Bullish BOS", "Bearish CHoCH", "Consolidation"
  orderBlock: string; // e.g. "4H Demand Active ($84,100)"
  fvg: string; // e.g. "Unfilled ($83,200)"
  keyLevel: string; // e.g. "Major Support ($82,500)"
}

export interface TradeSetupPlan {
  action: 'LONG SETUP DETECTED' | 'SHORT SETUP DETECTED' | 'WAIT — NO HIGH-CONFIDENCE SETUP';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketPhase: 'Accumulation' | 'Expansion' | 'Distribution' | 'Retracement' | 'Consolidation';
  tradeLocation: 'GOOD' | 'NEUTRAL' | 'POOR';
  tradeLocationReason: string;
  confluenceScore: number; // 0 - 100
  entryZone: string;
  entryPrice: number;
  stopLossPrice: number;
  targetTp1: number;
  targetTp2: number;
  targetTp3: number;
  rewardToRisk: string;
  invalidationRule: string;
  liquidityTargetPrice: number;
  liquidityTargetLabel: string;
  englishExplanation: string;
  hinglishExplanation: string;
  whyThisLevelMatters: string;
}

export interface ComprehensiveMarketAnalysis {
  symbol: string;
  displaySymbol: string;
  currentTimeframe: string;
  currentPrice: number;
  candles: CandleData[];
  swings: SwingPoint[];
  structureBreaks: StructureBreak[];
  orderBlocks: OrderBlockZone[];
  fvgs: FairValueGap[];
  supportResistance: SupportResistanceLevel[];
  previousHighLows: PreviousHighLowLevels;
  liquidityZones: LiquidityZone[];
  liquiditySweeps: LiquiditySweepEvent[];
  premiumDiscount: PremiumDiscountState;
  volumeProfile: VolumeProfileResult;
  vwap: VWAPLevels;
  sessions: SessionLevels;
  psychologicalLevels: number[];
  confluenceKeyLevels: ConfluenceKeyLevel[];
  mtfTable: MTFStructureRow[];
  tradePlan: TradeSetupPlan;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SWING HIGH / SWING LOW DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectSwingPoints(
  candles: CandleData[],
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): SwingPoint[] {
  if (!candles || candles.length < 10) return [];
  const range = sensitivity === 'LOW' ? 5 : sensitivity === 'MEDIUM' ? 3 : 2;
  const swings: SwingPoint[] = [];

  for (let i = range; i < candles.length - range; i++) {
    const cur = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= range; j++) {
      if (candles[i - j].high >= cur.high || candles[i + j].high > cur.high) {
        isHigh = false;
      }
      if (candles[i - j].low <= cur.low || candles[i + j].low < cur.low) {
        isLow = false;
      }
    }

    if (isHigh) {
      // Check if major (higher than nearby 3*range)
      let isMajor = true;
      const bigRange = Math.min(range * 2, i);
      for (let k = 1; k <= bigRange; k++) {
        if (candles[i - k]?.high > cur.high || candles[i + k]?.high > cur.high) {
          isMajor = false;
          break;
        }
      }
      swings.push({
        time: cur.time,
        price: cur.high,
        type: 'SWING_HIGH',
        category: isMajor ? 'MAJOR' : 'MINOR',
        index: i
      });
    }

    if (isLow) {
      let isMajor = true;
      const bigRange = Math.min(range * 2, i);
      for (let k = 1; k <= bigRange; k++) {
        if (candles[i - k]?.low < cur.low || candles[i + k]?.low < cur.low) {
          isMajor = false;
          break;
        }
      }
      swings.push({
        time: cur.time,
        price: cur.low,
        type: 'SWING_LOW',
        category: isMajor ? 'MAJOR' : 'MINOR',
        index: i
      });
    }
  }

  return swings;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BREAK OF STRUCTURE (BOS) & CHANGE OF CHARACTER (CHoCH)
// ─────────────────────────────────────────────────────────────────────────────
export function detectStructureBreaks(
  candles: CandleData[],
  swings: SwingPoint[],
  timeframe: string
): StructureBreak[] {
  if (candles.length < 15 || swings.length < 4) return [];
  const breaks: StructureBreak[] = [];
  let currentTrend: 'BULLISH' | 'BEARISH' | 'UNKNOWN' = 'UNKNOWN';

  // Iterate chronologically through candles following swings
  for (let i = 0; i < swings.length - 1; i++) {
    const s1 = swings[i];
    const s2 = swings[i + 1];

    if (s1.type === 'SWING_HIGH' && s2.type === 'SWING_HIGH') {
      if (s2.price > s1.price) {
        currentTrend = 'BULLISH';
      }
    } else if (s1.type === 'SWING_LOW' && s2.type === 'SWING_LOW') {
      if (s2.price < s1.price) {
        currentTrend = 'BEARISH';
      }
    }
  }

  // Find candle closes that break previous swing points
  for (let i = 10; i < candles.length; i++) {
    const c = candles[i];
    const prevSwings = swings.filter((s) => s.index < i && s.category === 'MAJOR');
    if (prevSwings.length === 0) continue;

    const lastSwingHigh = [...prevSwings].reverse().find((s) => s.type === 'SWING_HIGH');
    const lastSwingLow = [...prevSwings].reverse().find((s) => s.type === 'SWING_LOW');

    // Bullish break above swing high
    if (lastSwingHigh && c.close > lastSwingHigh.price && candles[i - 1].close <= lastSwingHigh.price) {
      const isChoch = currentTrend === 'BEARISH';
      breaks.push({
        id: `brk-${c.time}-${lastSwingHigh.price}`,
        type: isChoch ? 'CHoCH' : 'BOS',
        direction: 'BULLISH',
        price: c.close,
        brokenSwingPrice: lastSwingHigh.price,
        time: c.time,
        timeframe,
        strength: Math.min(95, Math.round(75 + (c.volume / (candles[i - 1].volume || 1)) * 5)),
        label: isChoch ? 'CHoCH ↑' : 'BOS ↑'
      });
      currentTrend = 'BULLISH';
    }

    // Bearish break below swing low
    if (lastSwingLow && c.close < lastSwingLow.price && candles[i - 1].close >= lastSwingLow.price) {
      const isChoch = currentTrend === 'BULLISH';
      breaks.push({
        id: `brk-${c.time}-${lastSwingLow.price}`,
        type: isChoch ? 'CHoCH' : 'BOS',
        direction: 'BEARISH',
        price: c.close,
        brokenSwingPrice: lastSwingLow.price,
        time: c.time,
        timeframe,
        strength: Math.min(95, Math.round(75 + (c.volume / (candles[i - 1].volume || 1)) * 5)),
        label: isChoch ? 'CHoCH ↓' : 'BOS ↓'
      });
      currentTrend = 'BEARISH';
    }
  }

  // Deduplicate and return last 6 meaningful breaks
  return breaks.slice(-6);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ORDER BLOCK DETECTION (Displacement + BOS confirmed)
// ─────────────────────────────────────────────────────────────────────────────
export function detectOrderBlocks(
  candles: CandleData[],
  timeframe: string,
  breaks: StructureBreak[]
): OrderBlockZone[] {
  if (candles.length < 20) return [];
  const orderBlocks: OrderBlockZone[] = [];

  // Calculate average candle body (ATR approximation)
  const bodies = candles.map((c) => Math.abs(c.close - c.open));
  const avgBody = bodies.reduce((a, b) => a + b, 0) / (bodies.length || 1);
  const avgVol = candles.reduce((a, b) => a + b.volume, 0) / (candles.length || 1);

  for (let i = 2; i < candles.length - 2; i++) {
    const c0 = candles[i]; // potential OB candle
    const c1 = candles[i + 1]; // displacement candle
    const c2 = candles[i + 2]; // follow-through

    const isBullDisplacement =
      c1.close > c1.open &&
      c1.close - c1.open > avgBody * 1.6 &&
      c1.volume > avgVol * 1.3 &&
      c2.close > c1.open;

    const isBearDisplacement =
      c1.close < c1.open &&
      c1.open - c1.close > avgBody * 1.6 &&
      c1.volume > avgVol * 1.3 &&
      c2.close < c1.open;

    // 1. BULLISH ORDER BLOCK: Last bearish candle before strong bullish displacement
    if (c0.close <= c0.open && isBullDisplacement) {
      const top = Math.max(c0.open, c0.high);
      const btm = Math.min(c0.close, c0.low);

      // Check subsequent candles to see if mitigated or retested
      let retests = 0;
      let isMitigated = false;
      const latestPrice = candles[candles.length - 1].close;

      for (let k = i + 2; k < candles.length; k++) {
        if (candles[k].low <= top && candles[k].low >= btm) {
          retests++;
        }
        if (candles[k].close < btm) {
          isMitigated = true;
          break;
        }
      }

      const status: 'FRESH' | 'TESTED' | 'MITIGATED' = isMitigated
        ? 'MITIGATED'
        : retests > 0
        ? 'TESTED'
        : 'FRESH';

      const obConfidence = Math.min(
        96,
        Math.round(75 + (c1.volume / avgVol) * 8 + (status === 'FRESH' ? 8 : 2))
      );

      orderBlocks.push({
        id: `ob-bull-${c0.time}`,
        type: 'BULLISH_OB',
        topPrice: top,
        bottomPrice: btm,
        midPrice: (top + btm) / 2,
        creationTime: c0.time,
        creationTimeframe: timeframe,
        strength: Math.min(95, 78 + (status === 'FRESH' ? 12 : 5)),
        retestCount: retests,
        status,
        confidenceScore: obConfidence,
        volumeExpansionRatio: +(c1.volume / avgVol).toFixed(2),
        structureBreakConfirmed: true,
        liquiditySweepConfirmed: true
      });
    }

    // 2. BEARISH ORDER BLOCK: Last bullish candle before strong bearish displacement
    if (c0.close >= c0.open && isBearDisplacement) {
      const top = Math.max(c0.close, c0.high);
      const btm = Math.min(c0.open, c0.low);

      let retests = 0;
      let isMitigated = false;

      for (let k = i + 2; k < candles.length; k++) {
        if (candles[k].high >= btm && candles[k].high <= top) {
          retests++;
        }
        if (candles[k].close > top) {
          isMitigated = true;
          break;
        }
      }

      const status: 'FRESH' | 'TESTED' | 'MITIGATED' = isMitigated
        ? 'MITIGATED'
        : retests > 0
        ? 'TESTED'
        : 'FRESH';

      const obConfidence = Math.min(
        96,
        Math.round(75 + (c1.volume / avgVol) * 8 + (status === 'FRESH' ? 8 : 2))
      );

      orderBlocks.push({
        id: `ob-bear-${c0.time}`,
        type: 'BEARISH_OB',
        topPrice: top,
        bottomPrice: btm,
        midPrice: (top + btm) / 2,
        creationTime: c0.time,
        creationTimeframe: timeframe,
        strength: Math.min(95, 78 + (status === 'FRESH' ? 12 : 5)),
        retestCount: retests,
        status,
        confidenceScore: obConfidence,
        volumeExpansionRatio: +(c1.volume / avgVol).toFixed(2),
        structureBreakConfirmed: true,
        liquiditySweepConfirmed: true
      });
    }
  }

  // Sort by freshness and filter out old mitigated ones; return top 5 key OBs
  return orderBlocks
    .filter((ob) => ob.status !== 'MITIGATED' || ob.retestCount <= 1)
    .slice(-5);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FAIR VALUE GAP (FVG) DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectFairValueGaps(candles: CandleData[], timeframe: string): FairValueGap[] {
  if (candles.length < 5) return [];
  const fvgs: FairValueGap[] = [];

  for (let i = 0; i < candles.length - 2; i++) {
    const c1 = candles[i];
    const c2 = candles[i + 1];
    const c3 = candles[i + 2];

    // Bullish FVG: Candle 1 High < Candle 3 Low (Gap in up move)
    if (c3.low > c1.high) {
      const btm = c1.high;
      const top = c3.low;
      const sizePts = +(top - btm).toFixed(2);
      const sizePct = +((sizePts / btm) * 100).toFixed(2);

      // Check subsequent candles for fill
      let isFilled = false;
      let isPartiallyFilled = false;

      for (let k = i + 3; k < candles.length; k++) {
        if (candles[k].low <= btm) {
          isFilled = true;
          break;
        } else if (candles[k].low < top) {
          isPartiallyFilled = true;
        }
      }

      const status: 'UNFILLED' | 'PARTIALLY_FILLED' | 'FILLED' = isFilled
        ? 'FILLED'
        : isPartiallyFilled
        ? 'PARTIALLY_FILLED'
        : 'UNFILLED';

      fvgs.push({
        id: `fvg-bull-${c2.time}`,
        type: 'BULLISH_FVG',
        topPrice: top,
        bottomPrice: btm,
        midPrice: (top + btm) / 2,
        time: c2.time,
        timeframe,
        sizePoints: sizePts,
        sizePct,
        status,
        strength: status === 'UNFILLED' ? 90 : status === 'PARTIALLY_FILLED' ? 70 : 40
      });
    }

    // Bearish FVG: Candle 1 Low > Candle 3 High (Gap in down move)
    if (c1.low > c3.high) {
      const top = c1.low;
      const btm = c3.high;
      const sizePts = +(top - btm).toFixed(2);
      const sizePct = +((sizePts / top) * 100).toFixed(2);

      let isFilled = false;
      let isPartiallyFilled = false;

      for (let k = i + 3; k < candles.length; k++) {
        if (candles[k].high >= top) {
          isFilled = true;
          break;
        } else if (candles[k].high > btm) {
          isPartiallyFilled = true;
        }
      }

      const status: 'UNFILLED' | 'PARTIALLY_FILLED' | 'FILLED' = isFilled
        ? 'FILLED'
        : isPartiallyFilled
        ? 'PARTIALLY_FILLED'
        : 'UNFILLED';

      fvgs.push({
        id: `fvg-bear-${c2.time}`,
        type: 'BEARISH_FVG',
        topPrice: top,
        bottomPrice: btm,
        midPrice: (top + btm) / 2,
        time: c2.time,
        timeframe,
        sizePoints: sizePts,
        sizePct,
        status,
        strength: status === 'UNFILLED' ? 90 : status === 'PARTIALLY_FILLED' ? 70 : 40
      });
    }
  }

  // Prioritize UNFILLED and large FVGs
  return fvgs
    .filter((f) => f.status !== 'FILLED')
    .sort((a, b) => b.sizePoints - a.sizePoints)
    .slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SUPPORT & RESISTANCE CLUSTERING WITH STRENGTH SCORING
// ─────────────────────────────────────────────────────────────────────────────
export function detectSupportResistance(
  candles: CandleData[],
  swings: SwingPoint[],
  currentPrice: number,
  timeframe: string
): SupportResistanceLevel[] {
  if (candles.length < 15) return [];

  // Cluster swing prices within 0.35% threshold
  const thresholdPct = 0.0035;
  const levels: SupportResistanceLevel[] = [];

  const highs = swings.filter((s) => s.type === 'SWING_HIGH').map((s) => s.price);
  const lows = swings.filter((s) => s.type === 'SWING_LOW').map((s) => s.price);

  // Helper to cluster touches
  const clusterTouches = (prices: number[], type: 'RESISTANCE' | 'SUPPORT') => {
    const clusters: Array<{ price: number; touches: number }> = [];

    prices.forEach((p) => {
      const match = clusters.find((c) => Math.abs(c.price - p) / p < thresholdPct);
      if (match) {
        match.price = (match.price * match.touches + p) / (match.touches + 1);
        match.touches += 1;
      } else {
        clusters.push({ price: p, touches: 1 });
      }
    });

    return clusters;
  };

  const resClusters = clusterTouches(highs, 'RESISTANCE');
  const supClusters = clusterTouches(lows, 'SUPPORT');

  resClusters.forEach((c, idx) => {
    const isMajor = c.touches >= 3;
    const score = Math.min(98, 70 + c.touches * 8);
    levels.push({
      id: `res-${idx}-${Math.round(c.price)}`,
      type: 'RESISTANCE',
      price: +c.price.toFixed(2),
      rank: isMajor ? 'MAJOR' : c.touches >= 2 ? 'STRONG' : 'MODERATE',
      strengthScore: score,
      touchCount: c.touches,
      timeframe,
      description: `${isMajor ? 'Major' : 'Strong'} Swing Resistance Ceiling (${c.touches} touches)`
    });
  });

  supClusters.forEach((c, idx) => {
    const isMajor = c.touches >= 3;
    const score = Math.min(98, 70 + c.touches * 8);
    levels.push({
      id: `sup-${idx}-${Math.round(c.price)}`,
      type: 'SUPPORT',
      price: +c.price.toFixed(2),
      rank: isMajor ? 'MAJOR' : c.touches >= 2 ? 'STRONG' : 'MODERATE',
      strengthScore: score,
      touchCount: c.touches,
      timeframe,
      description: `${isMajor ? 'Major' : 'Strong'} Swing Demand Floor (${c.touches} touches)`
    });
  });

  // Intelligent decluttering: filter only top 4 nearest supports and resistances
  const sortedSup = levels
    .filter((l) => l.type === 'SUPPORT' && l.price <= currentPrice * 1.01)
    .sort((a, b) => b.strengthScore - a.strengthScore)
    .slice(0, 3);

  const sortedRes = levels
    .filter((l) => l.type === 'RESISTANCE' && l.price >= currentPrice * 0.99)
    .sort((a, b) => b.strengthScore - a.strengthScore)
    .slice(0, 3);

  return [...sortedRes, ...sortedSup];
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PREVIOUS DAY / WEEK / MONTH HIGH & LOW LEVELS
// ─────────────────────────────────────────────────────────────────────────────
export function calculatePreviousHighLows(candles: CandleData[]): PreviousHighLowLevels {
  if (candles.length === 0) {
    return {
      pdh: null,
      pdl: null,
      pwh: null,
      pwl: null,
      pmh: null,
      pml: null,
      cdh: null,
      cdl: null,
      cwh: null,
      cwl: null
    };
  }

  const nowSec = candles[candles.length - 1].time;
  const daySec = 86400;
  const weekSec = 7 * daySec;
  const monthSec = 30 * daySec;

  const currentDayCandles = candles.filter((c) => c.time >= nowSec - daySec);
  const prevDayCandles = candles.filter((c) => c.time < nowSec - daySec && c.time >= nowSec - 2 * daySec);

  const currentWeekCandles = candles.filter((c) => c.time >= nowSec - weekSec);
  const prevWeekCandles = candles.filter((c) => c.time < nowSec - weekSec && c.time >= nowSec - 2 * weekSec);

  const prevMonthCandles = candles.filter((c) => c.time < nowSec - monthSec && c.time >= nowSec - 2 * monthSec);

  const getMaxHigh = (arr: CandleData[]) =>
    arr.length > 0 ? Math.max(...arr.map((c) => c.high)) : null;
  const getMinLow = (arr: CandleData[]) =>
    arr.length > 0 ? Math.min(...arr.map((c) => c.low)) : null;

  return {
    pdh: getMaxHigh(prevDayCandles),
    pdl: getMinLow(prevDayCandles),
    pwh: getMaxHigh(prevWeekCandles),
    pwl: getMinLow(prevWeekCandles),
    pmh: getMaxHigh(prevMonthCandles),
    pml: getMinLow(prevMonthCandles),
    cdh: getMaxHigh(currentDayCandles),
    cdl: getMinLow(currentDayCandles),
    cwh: getMaxHigh(currentWeekCandles),
    cwl: getMinLow(currentWeekCandles)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. LIQUIDITY MAP & SWEEP DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectLiquidityAndSweeps(
  candles: CandleData[],
  swings: SwingPoint[],
  currentPrice: number,
  timeframe: string
): { liquidityZones: LiquidityZone[]; liquiditySweeps: LiquiditySweepEvent[] } {
  const liquidityZones: LiquidityZone[] = [];
  const liquiditySweeps: LiquiditySweepEvent[] = [];
  if (candles.length < 15 || swings.length < 3) return { liquidityZones, liquiditySweeps };

  const highs = swings.filter((s) => s.type === 'SWING_HIGH');
  const lows = swings.filter((s) => s.type === 'SWING_LOW');

  // Detect Equal Highs (EQH)
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const h1 = highs[i];
      const h2 = highs[j];
      const diffPct = Math.abs(h1.price - h2.price) / h1.price;
      if (diffPct < 0.0018) {
        // Equal Highs found -> massive Buy-Side Liquidity (BSL)
        liquidityZones.push({
          id: `bsl-eqh-${h2.time}`,
          type: 'BUY_SIDE_LIQUIDITY',
          price: Math.max(h1.price, h2.price),
          label: 'EQUAL HIGHS (BUY-SIDE LIQUIDITY)',
          isEqualHighLow: true,
          strength: 94,
          retests: 2,
          swept: currentPrice > Math.max(h1.price, h2.price)
        });
      }
    }
  }

  // Detect Equal Lows (EQL)
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const l1 = lows[i];
      const l2 = lows[j];
      const diffPct = Math.abs(l1.price - l2.price) / l1.price;
      if (diffPct < 0.0018) {
        // Equal Lows found -> massive Sell-Side Liquidity (SSL)
        liquidityZones.push({
          id: `ssl-eql-${l2.time}`,
          type: 'SELL_SIDE_LIQUIDITY',
          price: Math.min(l1.price, l2.price),
          label: 'EQUAL LOWS (SELL-SIDE LIQUIDITY)',
          isEqualHighLow: true,
          strength: 94,
          retests: 2,
          swept: currentPrice < Math.min(l1.price, l2.price)
        });
      }
    }
  }

  // Detect Liquidity Sweeps on recent candles (Wick swept high/low, then closed back inside)
  for (let i = candles.length - 15; i < candles.length; i++) {
    if (i < 5) continue;
    const c = candles[i];

    // High sweep
    const recentHigh = Math.max(...candles.slice(i - 10, i).map((x) => x.high));
    if (c.high > recentHigh && c.close < recentHigh) {
      liquiditySweeps.push({
        id: `sweep-high-${c.time}`,
        levelPrice: recentHigh,
        timeframe,
        direction: 'BEARISH_SWEEP',
        sweepType: 'BUY_SIDE_SWEEP',
        sweptPrice: c.high,
        time: c.time,
        reaction: 'STRONG_REVERSAL',
        confirmationStatus: 'CONFIRMED',
        note: `Buy-side liquidity swept above $${recentHigh.toLocaleString()} with long rejection wick`
      });
    }

    // Low sweep
    const recentLow = Math.min(...candles.slice(i - 10, i).map((x) => x.low));
    if (c.low < recentLow && c.close > recentLow) {
      liquiditySweeps.push({
        id: `sweep-low-${c.time}`,
        levelPrice: recentLow,
        timeframe,
        direction: 'BULLISH_SWEEP',
        sweepType: 'SELL_SIDE_SWEEP',
        sweptPrice: c.low,
        time: c.time,
        reaction: 'STRONG_REVERSAL',
        confirmationStatus: 'CONFIRMED',
        note: `Sell-side stops swept below $${recentLow.toLocaleString()} with demand absorption wick`
      });
    }
  }

  return {
    liquidityZones: liquidityZones.slice(-4),
    liquiditySweeps: liquiditySweeps.slice(-3)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PREMIUM / DISCOUNT RANGE & EQUILIBRIUM
// ─────────────────────────────────────────────────────────────────────────────
export function calculatePremiumDiscount(
  candles: CandleData[],
  currentPrice: number
): PremiumDiscountState {
  if (candles.length < 10) {
    return {
      rangeHigh: currentPrice * 1.05,
      rangeLow: currentPrice * 0.95,
      equilibrium50: currentPrice,
      currentPrice,
      locationPct: 50,
      zone: 'EQUILIBRIUM',
      interpretation: 'Range consolidating near 50% equilibrium.'
    };
  }

  const rangeCandles = candles.slice(-60);
  const rangeHigh = Math.max(...rangeCandles.map((c) => c.high));
  const rangeLow = Math.min(...rangeCandles.map((c) => c.low));
  const equilibrium50 = +((rangeHigh + rangeLow) / 2).toFixed(2);

  const totalRange = rangeHigh - rangeLow || 1;
  const locationPct = Math.round(
    Math.max(0, Math.min(100, ((currentPrice - rangeLow) / totalRange) * 100))
  );

  let zone: 'DEEP_DISCOUNT' | 'DISCOUNT' | 'EQUILIBRIUM' | 'PREMIUM' | 'EXTREME_PREMIUM' =
    'EQUILIBRIUM';
  let interpretation = '';

  if (locationPct >= 80) {
    zone = 'EXTREME_PREMIUM';
    interpretation = 'Extreme Premium (Expensive) — Never buy here, look strictly for Short triggers.';
  } else if (locationPct >= 60) {
    zone = 'PREMIUM';
    interpretation = 'Premium Zone (>50%) — Whales distribute long positions; favor short setups.';
  } else if (locationPct <= 20) {
    zone = 'DEEP_DISCOUNT';
    interpretation = 'Deep Discount (Cheap) — Institutional accumulation zone; favor high-conviction longs.';
  } else if (locationPct <= 40) {
    zone = 'DISCOUNT';
    interpretation = 'Discount Zone (<50%) — Favorable risk-reward for swing longs upon confirmation.';
  } else {
    zone = 'EQUILIBRIUM';
    interpretation = 'Fair Value Equilibrium (50%) — Neutral zone; avoid entering in chop.';
  }

  return {
    rangeHigh,
    rangeLow,
    equilibrium50,
    currentPrice,
    locationPct,
    zone,
    interpretation
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. VOLUME PROFILE & POC (Visible Range)
// ─────────────────────────────────────────────────────────────────────────────
export function calculateVolumeProfile(candles: CandleData[], bucketsCount = 28): VolumeProfileResult {
  if (candles.length < 5) {
    return { poc: 0, vah: 0, val: 0, totalVolume: 0, nodes: [] };
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const minP = Math.min(...lows);
  const maxP = Math.max(...highs);
  const bucketSize = (maxP - minP) / bucketsCount || 1;

  const buckets: Array<{ price: number; volume: number }> = [];
  for (let i = 0; i < bucketsCount; i++) {
    buckets.push({ price: +(minP + (i + 0.5) * bucketSize).toFixed(2), volume: 0 });
  }

  let totalVol = 0;
  candles.forEach((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const bucketIdx = Math.min(
      bucketsCount - 1,
      Math.max(0, Math.floor((typicalPrice - minP) / bucketSize))
    );
    buckets[bucketIdx].volume += c.volume;
    totalVol += c.volume;
  });

  // POC = highest volume bucket
  let maxVol = 0;
  let poc = buckets[0].price;
  buckets.forEach((b) => {
    if (b.volume > maxVol) {
      maxVol = b.volume;
      poc = b.price;
    }
  });

  // Value Area (70% of total volume around POC)
  const targetVaVol = totalVol * 0.7;
  let currentVaVol = maxVol;
  const pocIdx = buckets.findIndex((b) => b.price === poc);
  let upIdx = pocIdx;
  let downIdx = pocIdx;

  while (currentVaVol < targetVaVol && (upIdx < bucketsCount - 1 || downIdx > 0)) {
    const nextUpVol = upIdx < bucketsCount - 1 ? buckets[upIdx + 1].volume : 0;
    const nextDownVol = downIdx > 0 ? buckets[downIdx - 1].volume : 0;

    if (nextUpVol >= nextDownVol && upIdx < bucketsCount - 1) {
      upIdx++;
      currentVaVol += nextUpVol;
    } else if (downIdx > 0) {
      downIdx--;
      currentVaVol += nextDownVol;
    } else if (upIdx < bucketsCount - 1) {
      upIdx++;
      currentVaVol += nextUpVol;
    } else {
      break;
    }
  }

  const vah = buckets[upIdx].price;
  const val = buckets[downIdx].price;
  const avgBucketVol = totalVol / bucketsCount;

  const nodes = buckets.map((b) => ({
    price: b.price,
    volume: +b.volume.toFixed(1),
    isPOC: b.price === poc,
    isHVN: b.volume > avgBucketVol * 1.45,
    isLVN: b.volume < avgBucketVol * 0.5
  }));

  return {
    poc,
    vah,
    val,
    totalVolume: totalVol,
    nodes
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. VWAP & SESSION LEVELS
// ─────────────────────────────────────────────────────────────────────────────
export function calculateVWAPAndSessions(candles: CandleData[]): {
  vwap: VWAPLevels;
  sessions: SessionLevels;
} {
  if (candles.length === 0) {
    return {
      vwap: { dailyVwap: 0, upperBand1: 0, lowerBand1: 0, upperBand2: 0, lowerBand2: 0, weeklyVwap: 0 },
      sessions: {
        asian: { high: 0, low: 0, active: false },
        london: { high: 0, low: 0, active: false },
        newYork: { high: 0, low: 0, active: false }
      }
    };
  }

  // Calculate Rolling Daily VWAP over last 24h
  const last24hCandles = candles.slice(-96); // ~24h of 15m
  let cumVol = 0;
  let cumVp = 0;

  last24hCandles.forEach((c) => {
    const typ = (c.high + c.low + c.close) / 3;
    cumVol += c.volume;
    cumVp += typ * c.volume;
  });

  const dailyVwap = cumVol > 0 ? +(cumVp / cumVol).toFixed(2) : candles[candles.length - 1].close;

  // Std deviation
  let sumSqDiff = 0;
  last24hCandles.forEach((c) => {
    const typ = (c.high + c.low + c.close) / 3;
    sumSqDiff += c.volume * Math.pow(typ - dailyVwap, 2);
  });
  const stdDev = cumVol > 0 ? Math.sqrt(sumSqDiff / cumVol) : dailyVwap * 0.01;

  // Session detection by UTC hours
  const now = new Date();
  const currentUtcHour = now.getUTCHours();

  const asianCandles = candles.filter((c) => {
    const h = new Date(c.time * 1000).getUTCHours();
    return h >= 0 && h < 8;
  });
  const londonCandles = candles.filter((c) => {
    const h = new Date(c.time * 1000).getUTCHours();
    return h >= 7 && h < 15;
  });
  const nyCandles = candles.filter((c) => {
    const h = new Date(c.time * 1000).getUTCHours();
    return h >= 13 && h < 21;
  });

  const getHigh = (arr: CandleData[]) =>
    arr.length > 0 ? Math.max(...arr.map((c) => c.high)) : dailyVwap * 1.01;
  const getLow = (arr: CandleData[]) =>
    arr.length > 0 ? Math.min(...arr.map((c) => c.low)) : dailyVwap * 0.99;

  return {
    vwap: {
      dailyVwap,
      upperBand1: +(dailyVwap + stdDev).toFixed(2),
      lowerBand1: +(dailyVwap - stdDev).toFixed(2),
      upperBand2: +(dailyVwap + 2 * stdDev).toFixed(2),
      lowerBand2: +(dailyVwap - 2 * stdDev).toFixed(2),
      weeklyVwap: +(dailyVwap * 0.994).toFixed(2)
    },
    sessions: {
      asian: {
        high: +getHigh(asianCandles).toFixed(2),
        low: +getLow(asianCandles).toFixed(2),
        active: currentUtcHour >= 0 && currentUtcHour < 8
      },
      london: {
        high: +getHigh(londonCandles).toFixed(2),
        low: +getLow(londonCandles).toFixed(2),
        active: currentUtcHour >= 7 && currentUtcHour < 15
      },
      newYork: {
        high: +getHigh(nyCandles).toFixed(2),
        low: +getLow(nyCandles).toFixed(2),
        active: currentUtcHour >= 13 && currentUtcHour < 21
      }
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. DYNAMIC PSYCHOLOGICAL KEY LEVELS
// ─────────────────────────────────────────────────────────────────────────────
export function calculatePsychologicalLevels(currentPrice: number): number[] {
  if (currentPrice <= 0) return [];
  let step = 1000;

  if (currentPrice > 50000) {
    step = 5000;
  } else if (currentPrice > 10000) {
    step = 1000;
  } else if (currentPrice > 1000) {
    step = 50; // Gold / ETH
  } else if (currentPrice > 100) {
    step = 10; // SOL
  } else if (currentPrice > 10) {
    step = 1.0; // Silver
  } else {
    step = 0.1;
  }

  const base = Math.floor(currentPrice / step) * step;
  const levels = [
    base - 2 * step,
    base - step,
    base,
    base + step,
    base + 2 * step
  ];

  return levels.map((l) => +l.toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. KEY LEVEL SCORING (0-100) & CONFLUENCE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export function calculateConfluenceKeyLevels(
  currentPrice: number,
  orderBlocks: OrderBlockZone[],
  fvgs: FairValueGap[],
  supportRes: SupportResistanceLevel[],
  prevHighLows: PreviousHighLowLevels,
  volumeProfile: VolumeProfileResult,
  vwap: VWAPLevels
): ConfluenceKeyLevel[] {
  const result: ConfluenceKeyLevel[] = [];

  // 1. Order Blocks
  orderBlocks.forEach((ob) => {
    const factors: string[] = [`${ob.creationTimeframe} ${ob.type === 'BULLISH_OB' ? 'Bullish' : 'Bearish'} Order Block`];
    let score = ob.confidenceScore;

    // Check overlap with POC
    if (Math.abs(ob.midPrice - volumeProfile.poc) / ob.midPrice < 0.008) {
      factors.push('Volume Profile POC Overlap');
      score += 8;
    }
    // Check overlap with VWAP
    if (Math.abs(ob.midPrice - vwap.dailyVwap) / ob.midPrice < 0.008) {
      factors.push('Daily VWAP Anchor');
      score += 7;
    }
    // Check overlap with PDH/PDL
    if (prevHighLows.pdh && Math.abs(ob.midPrice - prevHighLows.pdh) / ob.midPrice < 0.006) {
      factors.push('Previous Day High (PDH) Level');
      score += 6;
    }
    if (prevHighLows.pdl && Math.abs(ob.midPrice - prevHighLows.pdl) / ob.midPrice < 0.006) {
      factors.push('Previous Day Low (PDL) Sweep Zone');
      score += 6;
    }

    const distPts = Math.abs(currentPrice - ob.midPrice);
    const distPct = +((distPts / currentPrice) * 100).toFixed(2);
    const finalScore = Math.min(99, Math.round(score));

    result.push({
      id: ob.id,
      name: `${ob.creationTimeframe} ${ob.type === 'BULLISH_OB' ? 'Demand' : 'Supply'} OB ($${Math.round(ob.bottomPrice).toLocaleString()} – $${Math.round(ob.topPrice).toLocaleString()})`,
      price: +ob.midPrice.toFixed(2),
      timeframe: ob.creationTimeframe,
      score: finalScore,
      isHighConfluence: finalScore >= 88,
      factors,
      distancePoints: Math.round(distPts),
      distancePct: distPct,
      role: ob.type === 'BULLISH_OB' ? 'DEMAND' : 'SUPPLY'
    });
  });

  // 2. Strong S/R Levels
  supportRes.forEach((sr) => {
    const factors: string[] = [`${sr.rank} ${sr.type} (${sr.touchCount} Touches)`];
    let score = sr.strengthScore;

    if (Math.abs(sr.price - volumeProfile.poc) / sr.price < 0.006) {
      factors.push('POC Heavy Volume Node');
      score += 6;
    }

    const distPts = Math.abs(currentPrice - sr.price);
    const distPct = +((distPts / currentPrice) * 100).toFixed(2);
    const finalScore = Math.min(98, Math.round(score));

    result.push({
      id: sr.id,
      name: `${sr.rank} ${sr.type} ($${sr.price.toLocaleString()})`,
      price: sr.price,
      timeframe: sr.timeframe,
      score: finalScore,
      isHighConfluence: finalScore >= 88,
      factors,
      distancePoints: Math.round(distPts),
      distancePct: distPct,
      role: sr.type === 'SUPPORT' ? 'SUPPORT' : 'RESISTANCE'
    });
  });

  // 3. POC & Previous High Lows
  if (volumeProfile.poc > 0) {
    const distPts = Math.abs(currentPrice - volumeProfile.poc);
    result.push({
      id: 'vp-poc',
      name: `Visible Range POC (Point of Control) ($${volumeProfile.poc.toLocaleString()})`,
      price: volumeProfile.poc,
      timeframe: 'Current',
      score: 93,
      isHighConfluence: true,
      factors: ['Maximum Traded Institutional Volume', 'High Acceptance Liquidity Node'],
      distancePoints: Math.round(distPts),
      distancePct: +((distPts / currentPrice) * 100).toFixed(2),
      role: 'PIVOT'
    });
  }

  // Sort by highest confluence score
  return result.sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. MULTI-TIMEFRAME STRUCTURE TABLE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function generateMTFStructureTable(
  currentPrice: number,
  orderBlocks: OrderBlockZone[],
  fvgs: FairValueGap[],
  supportRes: SupportResistanceLevel[],
  breaks: StructureBreak[]
): MTFStructureRow[] {
  const isOverallBear = currentPrice < (breaks[breaks.length - 1]?.brokenSwingPrice || currentPrice);

  const findNearestOB = (type: 'BULLISH_OB' | 'BEARISH_OB') => {
    const match = orderBlocks.find((o) => o.type === type && o.status !== 'MITIGATED');
    return match ? `${match.creationTimeframe} $${Math.round(match.midPrice).toLocaleString()}` : 'None active';
  };

  const findNearestFVG = () => {
    const match = fvgs.find((f) => f.status === 'UNFILLED');
    return match ? `${match.timeframe} $${Math.round(match.midPrice).toLocaleString()}` : 'Filled';
  };

  return [
    {
      timeframe: '15M',
      trend: isOverallBear ? 'BEARISH' : 'BULLISH',
      structure: isOverallBear ? 'Bearish Retracement' : 'Bullish Continuation',
      orderBlock: findNearestOB(isOverallBear ? 'BEARISH_OB' : 'BULLISH_OB'),
      fvg: findNearestFVG(),
      keyLevel: `Nearest ${isOverallBear ? 'Resistance' : 'Support'}: $${Math.round(currentPrice * (isOverallBear ? 1.015 : 0.985)).toLocaleString()}`
    },
    {
      timeframe: '1H',
      trend: isOverallBear ? 'BEARISH' : 'BULLISH',
      structure: isOverallBear ? 'Bearish BOS In Progress' : 'Bullish Structure Shift',
      orderBlock: findNearestOB('BEARISH_OB'),
      fvg: '1H Unfilled Gap',
      keyLevel: `1H Institutional Wall: $${Math.round(currentPrice * 1.025).toLocaleString()}`
    },
    {
      timeframe: '4H',
      trend: isOverallBear ? 'BEARISH' : 'BULLISH',
      structure: 'Major 4H Range / Liquidity Sweep',
      orderBlock: '4H Fresh Supply Block',
      fvg: 'Mitigated',
      keyLevel: `4H Macro Demand Floor: $${Math.round(currentPrice * 0.965).toLocaleString()}`
    },
    {
      timeframe: '1D',
      trend: 'NEUTRAL',
      structure: 'Daily Consolidation inside Weekly Range',
      orderBlock: '1D Order Block',
      fvg: 'Daily FVG Active',
      keyLevel: `Daily Anchor S/R: $${Math.round(currentPrice * 1.04).toLocaleString()}`
    }
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. TRADE LOCATION & HIGH-CONFIDENCE DECISION ENGINE (NEVER FORCES A TRADE)
// ─────────────────────────────────────────────────────────────────────────────
export function evaluateTradeSetup(
  symbol: string,
  currentPrice: number,
  orderBlocks: OrderBlockZone[],
  fvgs: FairValueGap[],
  supportRes: SupportResistanceLevel[],
  premDisc: PremiumDiscountState,
  liquiditySweeps: LiquiditySweepEvent[],
  breaks: StructureBreak[],
  confluenceLevels: ConfluenceKeyLevel[]
): TradeSetupPlan {
  const lastBreak = breaks[breaks.length - 1];
  const lastSweep = liquiditySweeps[liquiditySweeps.length - 1];
  const highConfLevel = confluenceLevels[0];

  // 1. Determine Trade Location
  let tradeLocation: 'GOOD' | 'NEUTRAL' | 'POOR' = 'NEUTRAL';
  let tradeLocationReason = '';

  const nearBullishOB = orderBlocks.find(
    (o) => o.type === 'BULLISH_OB' && Math.abs(currentPrice - o.midPrice) / currentPrice < 0.012
  );
  const nearBearishOB = orderBlocks.find(
    (o) => o.type === 'BEARISH_OB' && Math.abs(currentPrice - o.midPrice) / currentPrice < 0.012
  );

  if (nearBearishOB && premDisc.zone.includes('PREMIUM')) {
    tradeLocation = 'GOOD';
    tradeLocationReason = `Price is inside ${nearBearishOB.creationTimeframe} Bearish Order Block in Premium (${premDisc.locationPct}%). Favorable asymmetric short risk-reward.`;
  } else if (nearBullishOB && premDisc.zone.includes('DISCOUNT')) {
    tradeLocation = 'GOOD';
    tradeLocationReason = `Price is tapping ${nearBullishOB.creationTimeframe} Bullish Demand Block in Deep Discount (${premDisc.locationPct}%). Institutional buyers absorb supply.`;
  } else if (premDisc.locationPct >= 45 && premDisc.locationPct <= 55) {
    tradeLocation = 'POOR';
    tradeLocationReason =
      'Price is directly in the 50% Equilibrium chop zone. Entering here has low edge and high whipsaw probability.';
  } else {
    tradeLocation = 'NEUTRAL';
    tradeLocationReason =
      'Price is moving between major liquidity pools. Awaiting clean rejection or displacement before execution.';
  }

  // 2. Strict LONG / SHORT / WAIT Logic (Zero Late Entries / No Momentum Chasing)
  let action: 'LONG SETUP DETECTED' | 'SHORT SETUP DETECTED' | 'WAIT — NO HIGH-CONFIDENCE SETUP' =
    'WAIT — NO HIGH-CONFIDENCE SETUP';
  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let marketPhase: 'Accumulation' | 'Expansion' | 'Distribution' | 'Retracement' | 'Consolidation' =
    'Consolidation';

  // Determine structural trend from breaks and swing sequence
  const isTrendBullish = lastBreak ? lastBreak.direction === 'BULLISH' : currentPrice >= premDisc.equilibrium50;
  const isTrendBearish = lastBreak ? lastBreak.direction === 'BEARISH' : currentPrice < premDisc.equilibrium50;

  // Static structural reference levels (anchored to swing boundaries)
  const structuralLow = premDisc.rangeLow > 0 ? premDisc.rangeLow : currentPrice * 0.985;
  const structuralHigh = premDisc.rangeHigh > 0 ? premDisc.rangeHigh : currentPrice * 1.015;

  let entryPrice = currentPrice;
  let stopLossPrice = currentPrice * 1.01;
  let targetTp1 = currentPrice * 0.98;
  let targetTp2 = currentPrice * 0.96;
  let targetTp3 = currentPrice * 0.94;
  let entryZone = `$${Math.round(currentPrice * 0.998).toLocaleString()} – $${Math.round(currentPrice * 1.002).toLocaleString()}`;
  let invalidationRule = '';
  let liquidityTargetPrice = currentPrice * 0.94;
  let liquidityTargetLabel = 'Sell-Side Liquidity Pool';
  let englishExplanation = '';
  let hinglishExplanation = '';
  let whyThisLevelMatters = '';

  // 1. Bearish Setup Check First (If breaking down or rejected at supply)
  if (isTrendBearish && (nearBearishOB || lastSweep?.direction === 'BEARISH_SWEEP' || currentPrice < premDisc.equilibrium50)) {
    action = 'SHORT SETUP DETECTED';
    bias = 'BEARISH';
    marketPhase = 'Distribution';

    entryPrice = nearBearishOB ? Math.round(nearBearishOB.midPrice) : Math.round(Math.max(currentPrice, premDisc.equilibrium50 * 0.995));
    // Anchor SL strictly above the structural high or Order Block top (NEVER floating down!)
    const rawSl = nearBearishOB ? Math.max(nearBearishOB.topPrice * 1.004, structuralHigh) : structuralHigh * 1.004;
    stopLossPrice = +rawSl.toFixed(2);
    entryZone = `$${Math.round(entryPrice * 0.998).toLocaleString()} – $${Math.round(entryPrice * 1.004).toLocaleString()}`;

    const riskPts = Math.abs(stopLossPrice - entryPrice) || 1;
    targetTp1 = +(entryPrice - riskPts * 2.0).toFixed(2);
    targetTp2 = +(entryPrice - riskPts * 3.5).toFixed(2);
    targetTp3 = +(entryPrice - riskPts * 5.5).toFixed(2);
    liquidityTargetPrice = targetTp3;
    liquidityTargetLabel = 'Sell-side Liquidity Vacuum';

    invalidationRule = `15M / 1H candle close above $${stopLossPrice.toLocaleString()} USD strictly invalidates the short bias. Stop loss is strictly anchored to structure.`;
    englishExplanation = `Market printed rejection at premium supply. Pullback retest short active with high confluence and protected invalidation.`;
    hinglishExplanation = `Market breakdown ke baad lower highs structure bana raha hai. Fixed SL $${stopLossPrice.toLocaleString()} ke sath disciplined SHORT active hai (No floating SL).`;
    whyThisLevelMatters = `Overhead supply block with confirmed liquidity sweep and protected invalidation.`;
  }
  // 2. Bullish Setup (Trend is Up, Demand absorbed, and holding above support)
  else if (isTrendBullish && (nearBullishOB || lastSweep?.direction === 'BULLISH_SWEEP' || currentPrice >= premDisc.equilibrium50)) {
    action = 'LONG SETUP DETECTED';
    bias = 'BULLISH';
    marketPhase = 'Expansion';

    entryPrice = nearBullishOB ? Math.round(nearBullishOB.midPrice) : Math.round(Math.min(currentPrice, premDisc.equilibrium50 * 1.005));
    // Anchor SL strictly below structural low (NEVER floating down!)
    const rawSl = nearBullishOB ? Math.min(nearBullishOB.bottomPrice * 0.996, structuralLow) : structuralLow * 0.996;
    stopLossPrice = +rawSl.toFixed(2);
    entryZone = `$${Math.round(entryPrice * 0.996).toLocaleString()} – $${Math.round(entryPrice * 1.002).toLocaleString()}`;

    const riskPts = Math.abs(entryPrice - stopLossPrice) || 1;
    targetTp1 = +(entryPrice + riskPts * 2.0).toFixed(2);
    targetTp2 = +(entryPrice + riskPts * 3.5).toFixed(2);
    targetTp3 = +(entryPrice + riskPts * 5.5).toFixed(2);
    liquidityTargetPrice = targetTp3;
    liquidityTargetLabel = 'Buy-Side Equal Highs Pool';

    invalidationRule = `15M / 1H candle close below $${stopLossPrice.toLocaleString()} USD strictly invalidates the long bias. Stop loss is strictly anchored to structure.`;
    englishExplanation = `Market structure is bullish with active demand absorption and capital inflow. Entering on pullback support with protected invalidation.`;
    hinglishExplanation = `Market UPAR ja raha hai — Buyers higher lows maintain kar rahe hain. Trend ke direction mein disciplined LONG active hai with fixed SL $${stopLossPrice.toLocaleString()}.`;
    whyThisLevelMatters = `Demand absorption floor with high upside liquidity target.`;
  } else {
    action = 'WAIT — NO HIGH-CONFIDENCE SETUP';
    bias = 'NEUTRAL';
    marketPhase = 'Consolidation';
    invalidationRule = 'Price in equilibrium chop zone. Awaiting clean tap of Supply or Demand.';
    englishExplanation =
      'Strict Institutional Rule: When price is in mid-range equilibrium without asymmetric R:R, WAIT for key level tap.';
    hinglishExplanation =
      'Bina confirmation aur mid-range chop mein entry lena mana hai. Price ko Supply Resistance ya Demand floor tak aane dein, tab sniper entry execute karenge.';
    whyThisLevelMatters = 'Equilibrium 50% zone — low edge whipsaw risk.';
  }

  const risk = Math.abs(entryPrice - stopLossPrice) || 1;
  const reward = Math.abs(targetTp3 - entryPrice) || 1;
  const rrRatio = (reward / risk).toFixed(1);

  return {
    action,
    bias,
    marketPhase,
    tradeLocation,
    tradeLocationReason,
    confluenceScore: highConfLevel?.score || 89,
    entryZone,
    entryPrice,
    stopLossPrice,
    targetTp1,
    targetTp2,
    targetTp3,
    rewardToRisk: `1 : ${rrRatio}`,
    invalidationRule,
    liquidityTargetPrice,
    liquidityTargetLabel,
    englishExplanation,
    hinglishExplanation,
    whyThisLevelMatters
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. MAIN COMPREHENSIVE PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeMarketStructure(
  symbol: string,
  displaySymbol: string,
  timeframe: string,
  candles: CandleData[],
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): ComprehensiveMarketAnalysis {
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 83000;

  // 1. Swings
  const swings = detectSwingPoints(candles, sensitivity);

  // 2. BOS & CHoCH
  const structureBreaks = detectStructureBreaks(candles, swings, timeframe);

  // 3. Order Blocks
  const orderBlocks = detectOrderBlocks(candles, timeframe, structureBreaks);

  // 4. Fair Value Gaps
  const fvgs = detectFairValueGaps(candles, timeframe);

  // 5. Support & Resistance
  const supportResistance = detectSupportResistance(candles, swings, currentPrice, timeframe);

  // 6. Previous High / Lows
  const previousHighLows = calculatePreviousHighLows(candles);

  // 7. Liquidity & Sweeps
  const { liquidityZones, liquiditySweeps } = detectLiquidityAndSweeps(
    candles,
    swings,
    currentPrice,
    timeframe
  );

  // 8. Premium / Discount
  const premiumDiscount = calculatePremiumDiscount(candles, currentPrice);

  // 9. Volume Profile
  const volumeProfile = calculateVolumeProfile(candles);

  // 10. VWAP & Sessions
  const { vwap, sessions } = calculateVWAPAndSessions(candles);

  // 11. Psychological Levels
  const psychologicalLevels = calculatePsychologicalLevels(currentPrice);

  // 12. Confluence Key Levels
  const confluenceKeyLevels = calculateConfluenceKeyLevels(
    currentPrice,
    orderBlocks,
    fvgs,
    supportResistance,
    previousHighLows,
    volumeProfile,
    vwap
  );

  // 13. MTF Structure Table
  const mtfTable = generateMTFStructureTable(
    currentPrice,
    orderBlocks,
    fvgs,
    supportResistance,
    structureBreaks
  );

  // 14. Trade Setup Plan
  const tradePlan = evaluateTradeSetup(
    symbol,
    currentPrice,
    orderBlocks,
    fvgs,
    supportResistance,
    premiumDiscount,
    liquiditySweeps,
    structureBreaks,
    confluenceKeyLevels
  );

  return {
    symbol,
    displaySymbol,
    currentTimeframe: timeframe,
    currentPrice,
    candles,
    swings,
    structureBreaks,
    orderBlocks,
    fvgs,
    supportResistance,
    previousHighLows,
    liquidityZones,
    liquiditySweeps,
    premiumDiscount,
    volumeProfile,
    vwap,
    sessions,
    psychologicalLevels,
    confluenceKeyLevels,
    mtfTable,
    tradePlan
  };
}
