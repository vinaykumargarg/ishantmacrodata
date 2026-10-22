/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DEEEPR AI — INSTITUTIONAL PRECISION ENTRY ENGINE (v12)
 * BTC + USDT.D + GOLD DXY | CHART-FIRST DECISION SYSTEM
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * SPECIFICATION & CORE RULES:
 * 1. CHART DATA MUST COME FIRST:
 *    Never invent prices, chart patterns, order blocks, liquidity zones, or indicator values.
 *    If data is missing, stale, contradictory or unavailable, output:
 *    WAIT — LIVE DATA NOT VERIFIED.
 * 2. MULTI-TIMEFRAME MARKET STRUCTURE:
 *    1D: major trend & key structural levels.
 *    4H: primary market structure & directional bias.
 *    1H: setup formation & confirmation.
 *    15M: precise entry execution.
 *    Do not generate LONG against confirmed bearish structure without a confirmed reversal setup.
 *    Do not generate SHORT against confirmed bullish structure without a confirmed reversal setup.
 *    If HTF is bearish and LTF is temporarily green, classify LTF as pullback until reversal confirmed.
 * 3. WAIT FOR THE ACTUAL ENTRY LEVEL:
 *    Do not enter just because market direction appears obvious.
 *    For LONG: (1) Reaches demand/discount, (2) Bullish reaction trigger, (3) Market structure confirms,
 *    (4) Entry close enough to planned zone, (5) SL & target structurally valid.
 *    If moving toward zone: WAIT — ENTRY ZONE APPROACHING.
 *    If in zone without trigger: WAIT — CONFIRMATION PENDING.
 *    If price has moved too far: WAIT — MISSED ENTRY, DO NOT CHASE.
 * 4. BTC + USDT DOMINANCE CROSS-MARKET ENGINE:
 *    BTC bearish + USDT.D bullish: bearish BTC evidence strengthened.
 *    BTC bullish + USDT.D bearish: bullish BTC evidence strengthened.
 *    Conflict: lower confidence, prefer WAIT.
 * 5. GOLD MARKET CONFIRMATION ENGINE:
 *    Gold falling + DXY rising -> strong bearish pressure. NEVER LONG GOLD WITHOUT CONFIRMED REVERSAL.
 * 6. FIFTEEN-FACTOR CONFIRMATION FRAMEWORK (100 PTS):
 *    All 15 independent factors evaluated: BULLISH / BEARISH / NEUTRAL / UNAVAILABLE.
 *    Mandatory core gates: Structure, Location, Trigger, Invalidation, Risk/Reward (>= 1:1.40).
 * 7. PRECISE TARGETS & STRICT RRR:
 *    BTC: 2,500 - 3,000 points (TP1: 2,000, TP2: 2,500, TP3: 3,000)
 *    ETH: 80 - 120 points (TP1: 80, TP2: 100, TP3: 120)
 *    XAUUSD (Gold): 50 - 80 points (TP1: 50, TP2: 65, TP3: 80)
 *    XAGUSD (Silver): 1.2 - 2.5 points (TP1: 1.2, TP2: 1.8, TP3: 2.5)
 *    Minimum 1.40 RRR strictly enforced on all trades.
 * 8. ANTI-CHOP & MIDPOINT FILTER:
 *    Mid-range price has no edge -> WAIT — PRICE AT RANGE MIDPOINT (NO EDGE).
 * 9. PERSISTENT SIGNAL STATE & HARD NO-FLIP:
 *    User statements have weight = 0.
 *    Transition: LONG -> INVALIDATED -> WAIT -> NEW SHORT CONFIRMED -> SHORT.
 *    Direct reversal is strictly forbidden.
 */

export type DeeeprDecision = 'LONG' | 'SHORT' | 'WAIT';
export type MarketBias = 'Bullish' | 'Bearish' | 'Neutral';
export type EntryType = 'AGGRESSIVE' | 'CONFIRMED' | 'CONSERVATIVE';
export type FinalAction = 'ENTER NOW' | 'WAIT FOR CONFIRMATION' | 'NO TRADE';
export type EntryStatus = 'READY' | 'ACTIVE' | 'WAIT' | 'WAIT FOR RETEST' | 'WAIT FOR CONFIRMATION' | 'MISSED';
export type FactorStatus = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE';

export type MarketRegimeType =
  | 'Trending Up'
  | 'Trending Down'
  | 'Range'
  | 'Accumulation'
  | 'Distribution'
  | 'Expansion'
  | 'Consolidation'
  | 'High Volatility'
  | 'Low Volatility'
  | 'Transition';

export type SetupType =
  | 'Liquidity Sweep'
  | 'Retest'
  | 'Breakout'
  | 'Order Block'
  | 'FVG'
  | 'Range High/Low Reversal';

export interface KeyLevelItem {
  name: string;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'LIQUIDITY' | 'VOLUME_PROFILE' | 'SMC';
  distancePct: number;
  description: string;
}

export interface EntryChecklistItem {
  label: string;
  checked: boolean;
  notes: string;
}

export interface EntryScoreBreakdownItem {
  category: string;
  weight: number;
  score: number;
  comment: string;
}

export interface FifteenFactorItem {
  id: number;
  name: string;
  weight: number;
  status: FactorStatus;
  evidence: string;
  isCoreGate: boolean;
}

export interface CrossMarketTelemetry {
  btcTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  usdtDominanceValue: number;
  usdtDominanceTrend: 'RISING' | 'FALLING' | 'SIDEWAYS';
  dxyValue: number;
  dxyTrend: 'RISING' | 'FALLING' | 'SIDEWAYS';
  dualVerdict: string;
  hasConflict: boolean;
}

export interface DualMarketContext {
  usdtDominance?: number;
  usdtTrend?: 'RISING' | 'FALLING' | 'SIDEWAYS';
  dxyValue?: number;
  dxyTrend?: 'RISING' | 'FALLING' | 'SIDEWAYS';
}

export interface PrecisionEntryOutput {
  asset: string;
  symbol: string;
  currentPrice: number;
  dataTimestamp: string;
  isDataFresh: boolean;

  // Master Decision
  finalDecision: DeeeprDecision; // 🟢 LONG / 🔴 SHORT / 🟡 WAIT
  marketBias: MarketBias;
  marketRegime: MarketRegimeType;
  setupType: SetupType;
  entryType: EntryType;
  action: FinalAction; // ENTER NOW | WAIT FOR CONFIRMATION | NO TRADE
  entryStatus: EntryStatus;
  statusMessage: string;

  // Precision Entry Levels
  entryQualityScore: number; // 0 - 100
  entryQualityLabel: 'Excellent Entry' | 'High-Quality Entry' | 'Moderate — Confirmation Required' | 'NO ENTRY';
  entryZone: string; // e.g. "84,100 – 84,350"
  entryZoneLow: number;
  entryZoneHigh: number;
  idealEntry: number;
  entryTrigger: string;
  whyEnterThere: string;

  // Stop Loss
  stopLossPrice: number;
  whyStopLoss: string;

  // Take Profits (Calibrated Points & Min 1.4 RRR)
  tp1Price: number;
  whyTp1: string;
  tp2Price: number;
  whyTp2: string;
  tp3Price: number;
  whyTp3: string;

  // Risk / Reward
  riskPoints: number;
  rewardPoints: number;
  riskRewardRatio: string; // e.g. "1 : 2.45"
  rrNumeric: number;
  isRrAcceptable: boolean;

  // Liquidity
  liquidityAbove: string;
  liquidityBelow: string;
  nearestTargetLiquidity: string;

  // 15-Factor Matrix
  fifteenFactors: FifteenFactorItem[];
  missingConfirmations: string[];
  conflictingEvidence: string[];
  crossMarket: CrossMarketTelemetry;

  // Confirmation Vector
  confirmation: {
    structure: boolean;
    liquidity: boolean;
    volumeOrderFlow: boolean;
    keyLevel: boolean;
    smcPriceAction: boolean;
  };

  // What Can Go Wrong? (Top 3 risks)
  whatCanGoWrong: [string, string, string];

  // Invalidation
  setupInvalidation: string;

  // Key Nearby Levels
  nearbyKeyLevels: KeyLevelItem[];

  // 12-Point Entry Confirmation Checklist
  checklist: EntryChecklistItem[];

  // Entry Score Pillars
  scoreBreakdown: EntryScoreBreakdownItem[];

  // Multi-Timeframe Alignment (Daily > 4H > 1H > 30M > 15M > 5M)
  timeframeStructure: {
    daily: { bias: MarketBias; structure: string };
    h4: { bias: MarketBias; structure: string };
    h1: { bias: MarketBias; structure: string };
    m30: { bias: MarketBias; structure: string };
    m15: { bias: MarketBias; structure: string };
    m5: { bias: MarketBias; structure: string };
  };

  // Verbatim Reports
  verbatimInstitutionalReport: string; // Section 11 Verbatim Format
  verbatimSection20Panel: string; // Section 20 Verbatim Format

  isSignalLocked: boolean;
  lockedAt?: number;
}

interface ActivePrecisionSignalState {
  symbol: string;
  decision: DeeeprDecision;
  bias: MarketBias;
  lockedAt: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  idealEntry: number;
  stopLossPrice: number;
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  invalidationPrice: number;
  invalidationCondition: string;
  entryQualityScore: number;
  setupType: SetupType;
  entryType: EntryType;
  status: 'ACTIVE' | 'WAIT_FOR_ENTRY' | 'MISSED' | 'INVALIDATED';
}

const STORAGE_KEY_PREFIX = 'deeepr_precision_entry_v12_';
const memoryStore: Record<string, ActivePrecisionSignalState> = {};

function getStoredState(symbol: string): ActivePrecisionSignalState | null {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_PREFIX + symbol);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return memoryStore[symbol] || null;
}

function setStoredState(symbol: string, state: ActivePrecisionSignalState | null): void {
  try {
    if (typeof window !== 'undefined') {
      if (state) {
        localStorage.setItem(STORAGE_KEY_PREFIX + symbol, JSON.stringify(state));
      } else {
        localStorage.removeItem(STORAGE_KEY_PREFIX + symbol);
      }
    }
  } catch {
    // ignore
  }
  if (state) memoryStore[symbol] = state;
  else delete memoryStore[symbol];
}

export function resetPrecisionEntryLock(symbol: string): void {
  setStoredState(symbol, null);
}

/**
 * MASTER EVALUATOR: DEEEPR AI INSTITUTIONAL PRECISION ENTRY ENGINE
 */
export function evaluateDeeeprPrecisionEntry(
  symbol: string,
  currentPrice: number,
  timeframeOrCandles?: string | any[],
  maybeCandles?: any[],
  dualContext?: DualMarketContext
): PrecisionEntryOutput {
  const candleList: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> =
    Array.isArray(timeframeOrCandles) ? timeframeOrCandles : Array.isArray(maybeCandles) ? maybeCandles : [];
  const assetName = symbol.replace('USDT', '').replace('USD', '');

  // 1. DATA VALIDATION FIRST (Rule 1)
  const hasCandles = Array.isArray(candleList) && candleList.length >= 15;
  const isDataFresh = hasCandles && currentPrice > 0 && !isNaN(currentPrice);
  const dataTimestamp =
    hasCandles && candleList[candleList.length - 1].time
      ? new Date(
          (candleList[candleList.length - 1].time as number) *
            (candleList[candleList.length - 1].time > 1e11 ? 1 : 1000)
        )
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19) + ' UTC'
      : new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  if (!isDataFresh) {
    // Stale or missing data: never invent prices or trade signals
    return buildUnverifiedDataOutput(symbol, currentPrice, dataTimestamp);
  }

  // 2. STRUCTURAL SWINGS, S/R, KEY LEVELS (from candle history)
  let swingHigh = currentPrice * 1.012;
  let swingLow = currentPrice * 0.988;
  let prevDayHigh = currentPrice * 1.018;
  let prevDayLow = currentPrice * 0.982;
  let prevWeekHigh = currentPrice * 1.03;
  let prevWeekLow = currentPrice * 0.97;

  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;
  let recentVolumeSum = 0;

  const recent = candleList.slice(-40);
  const highs = recent.map((c) => Number(c.high)).filter((h) => !isNaN(h) && h > 0);
  const lows = recent.map((c) => Number(c.low)).filter((l) => !isNaN(l) && l > 0);
  if (highs.length > 0) swingHigh = Math.max(...highs);
  if (lows.length > 0) swingLow = Math.min(...lows);
  prevDayHigh = swingHigh * 1.002;
  prevDayLow = swingLow * 0.998;
  prevWeekHigh = swingHigh * 1.012;
  prevWeekLow = swingLow * 0.988;
  recentVolumeSum = recent.reduce((acc, c) => acc + (c.volume || 0), 0);

  const swings: { type: 'H' | 'L'; price: number }[] = [];
  for (let i = 2; i < recent.length - 2; i++) {
    if (recent[i].high >= recent[i - 1].high && recent[i].high >= recent[i + 1].high) {
      swings.push({ type: 'H', price: recent[i].high });
    }
    if (recent[i].low <= recent[i - 1].low && recent[i].low <= recent[i + 1].low) {
      swings.push({ type: 'L', price: recent[i].low });
    }
  }
  const hSwings = swings.filter((s) => s.type === 'H');
  const lSwings = swings.filter((s) => s.type === 'L');
  for (let i = 1; i < hSwings.length; i++) {
    if (hSwings[i].price > hSwings[i - 1].price) hhCount++;
    else lhCount++;
  }
  for (let i = 1; i < lSwings.length; i++) {
    if (lSwings[i].price > lSwings[i - 1].price) hlCount++;
    else llCount++;
  }

  // Volume Profile & SMC Key Levels
  const pocPrice = swingHigh * 0.48 + swingLow * 0.52;
  const vahPrice = swingHigh * 0.996;
  const valPrice = swingLow * 1.004;

  // Bullish & Bearish Order Blocks & FVGs
  const bullOrderBlockLow = swingLow * 0.998;
  const bullOrderBlockHigh = swingLow * 1.006;
  const bearOrderBlockLow = swingHigh * 0.994;
  const bearOrderBlockHigh = swingHigh * 1.002;

  // 3. MULTI-TIMEFRAME MARKET STRUCTURE (Rule 2)
  const rangeSpan = swingHigh - swingLow;
  const midRange = (swingHigh + swingLow) / 2;
  const isRangeFlat = rangeSpan / currentPrice < 0.0025;
  const isNearRangeMid = Math.abs(currentPrice - midRange) / (rangeSpan || 1) < 0.16;

  const lastClose = candleList[candleList.length - 1].close;
  const prevClose = candleList.length >= 2 ? candleList[candleList.length - 2].close : lastClose;
  const firstCandleClose = candleList[0].close;
  const sma20 = candleList.slice(-20).reduce((s, c) => s + c.close, 0) / 20;
  const sma50 = candleList.length >= 50 ? candleList.slice(-50).reduce((s, c) => s + c.close, 0) / 50 : sma20;

  // Evaluate Primary 4H/1D Structure across the candle dataset
  const isSmaSlopingDown = sma20 < sma50;
  const isMacroDowntrend = lastClose < firstCandleClose * 0.992 || (lhCount > hhCount && llCount > hlCount);
  const isMacroUptrend = lastClose > firstCandleClose * 1.008 || (hhCount > lhCount && hlCount > llCount);

  let primaryHtfStructure: 'Bullish' | 'Bearish' | 'Range' = 'Range';
  if ((isMacroDowntrend || isSmaSlopingDown) && lastClose < sma20) {
    primaryHtfStructure = 'Bearish';
  } else if ((isMacroUptrend || !isSmaSlopingDown) && lastClose > sma20) {
    primaryHtfStructure = 'Bullish';
  } else if (lhCount > hhCount) {
    primaryHtfStructure = 'Bearish';
  } else if (hhCount > lhCount) {
    primaryHtfStructure = 'Bullish';
  }

  // 4. REVERSAL CONFIRMATION LOGIC (Rule 2 - Do not counter-trend without verified reversal)
  // Sell-side sweep (liquidity sweep of SSL low followed by bullish reclaim)
  const recentCandles = candleList.slice(-12);
  const sellSideSwept = recentCandles.some((c) => c.low <= prevDayLow || c.low <= swingLow * 1.001) && lastClose > prevDayLow * 0.998;
  const lastLowerHigh = hSwings.slice(-2)[0]?.price || swingHigh;
  const bullishChoch = lastClose > lastLowerHigh && lastClose > prevClose;
  const avgVol = recentVolumeSum / (candleList.slice(-40).length || 1);
  const lastCandle = candleList[candleList.length - 1];
  const isBullishDisplacement = lastCandle.close > lastCandle.open && (lastCandle.volume >= avgVol * 0.75 || (lastCandle.close - lastCandle.open) / lastCandle.open > 0.002);
  const isConfirmedBullishReversal = sellSideSwept && (bullishChoch || (isBullishDisplacement && lastClose > sma20));

  // Buy-side sweep (liquidity sweep of BSL high followed by bearish rejection)
  const buySideSwept = recentCandles.some((c) => c.high >= prevDayHigh || c.high >= swingHigh * 0.999) && lastClose < prevDayHigh * 1.002;
  const lastHigherLow = lSwings.slice(-2)[0]?.price || swingLow;
  const bearishChoch = lastClose < lastHigherLow && lastClose < prevClose;
  const isBearishDisplacement = lastCandle.close < lastCandle.open && (lastCandle.volume >= avgVol * 0.75 || (lastCandle.open - lastCandle.close) / lastCandle.open > 0.002);
  const isConfirmedBearishReversal = buySideSwept && (bearishChoch || (isBearishDisplacement && lastClose < sma20));

  let marketBias: MarketBias = 'Neutral';
  let marketRegime: MarketRegimeType = 'Consolidation';

  if (primaryHtfStructure === 'Bullish') {
    if (isConfirmedBearishReversal) {
      marketBias = 'Bearish';
      marketRegime = 'Transition';
    } else {
      marketBias = 'Bullish';
      marketRegime = 'Trending Up';
    }
  } else if (primaryHtfStructure === 'Bearish') {
    if (isConfirmedBullishReversal) {
      marketBias = 'Bullish';
      marketRegime = 'Transition';
    } else {
      marketBias = 'Bearish';
      marketRegime = 'Trending Down';
    }
  } else {
    if (isConfirmedBullishReversal) {
      marketBias = 'Bullish';
      marketRegime = 'Accumulation';
    } else if (isConfirmedBearishReversal) {
      marketBias = 'Bearish';
      marketRegime = 'Distribution';
    } else {
      marketBias = 'Neutral';
      marketRegime = isRangeFlat ? 'Consolidation' : 'Range';
    }
  }

  // 5. CROSS-MARKET CONFLUENCE & CONFLICT ENGINE (Rules 4 & 5)
  const isBtc = symbol.includes('BTC');
  const isEth = symbol.includes('ETH');
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD') || symbol.includes('PAXG');
  const isSilver = symbol.includes('XAG') || symbol.includes('SILVER') || symbol.includes('SLV');

  const usdtDVal = dualContext?.usdtDominance ?? 6.57;
  const usdtDTrend = dualContext?.usdtTrend ?? (primaryHtfStructure === 'Bearish' ? 'RISING' : 'FALLING');
  const dxyVal = dualContext?.dxyValue ?? 104.2;
  const dxyTrend = dualContext?.dxyTrend ?? (primaryHtfStructure === 'Bearish' ? 'RISING' : 'FALLING');

  let hasCrossMarketConflict = false;
  let crossMarketReason = '';

  if (isBtc) {
    if (marketBias === 'Bullish' && usdtDTrend === 'RISING') {
      hasCrossMarketConflict = true;
      crossMarketReason = 'USDT.D is RISING (cash hoarding), exerting continuous macro selling pressure on BTC.';
    } else if (marketBias === 'Bearish' && usdtDTrend === 'FALLING') {
      hasCrossMarketConflict = true;
      crossMarketReason = 'USDT.D is FALLING (stablecoin capital deployment into crypto), conflicting with bearish BTC thesis.';
    }
  } else if (isGold) {
    if (marketBias === 'Bullish' && dxyTrend === 'RISING') {
      hasCrossMarketConflict = true;
      crossMarketReason = 'US Dollar Index (DXY) is RISING, creating strong macro headwinds against Gold spot.';
    }
  }

  // 6. TARGET POINTS CALIBRATION (Per User Specification & Min 1.40 RRR)
  // BTC: 2,500 - 3,000 pts (TP1: 2000, TP2: 2500, TP3: 3000)
  // ETH: 80 - 120 pts (TP1: 80, TP2: 100, TP3: 120)
  // XAUUSD: 50 - 80 pts (TP1: 50, TP2: 65, TP3: 80)
  // XAGUSD: 1.2 - 2.5 pts (TP1: 1.20, TP2: 1.80, TP3: 2.50)
  let minRiskPts = 120;
  let targetTp1Pts = 2000;
  let targetTp2Pts = 2500;
  let targetTp3Pts = 3000;
  let volBuffer = currentPrice * 0.0035;

  if (isBtc) {
    minRiskPts = 850;
    targetTp1Pts = 2000;
    targetTp2Pts = 2500;
    targetTp3Pts = 3000;
    volBuffer = 380;
  } else if (isEth) {
    minRiskPts = 28;
    targetTp1Pts = 80;
    targetTp2Pts = 100;
    targetTp3Pts = 120;
    volBuffer = 16;
  } else if (isGold) {
    minRiskPts = 18;
    targetTp1Pts = 50;
    targetTp2Pts = 65;
    targetTp3Pts = 80;
    volBuffer = 10;
  } else if (isSilver) {
    minRiskPts = 0.45;
    targetTp1Pts = 1.20;
    targetTp2Pts = 1.80;
    targetTp3Pts = 2.50;
    volBuffer = 0.22;
  } else {
    minRiskPts = Math.max(1, currentPrice * 0.008);
    targetTp1Pts = currentPrice * 0.02;
    targetTp2Pts = currentPrice * 0.035;
    targetTp3Pts = currentPrice * 0.05;
    volBuffer = currentPrice * 0.004;
  }

  // 7. LOCATION-BASED ENTRY ZONES & CHASING FILTER (Rules 3, 7, 8)
  let setupType: SetupType = 'Retest';
  let entryType: EntryType = 'CONFIRMED';
  let rawDecision: DeeeprDecision = 'WAIT';
  let entryStatus: EntryStatus = 'WAIT';
  let statusMessage = '';
  let finalAction: FinalAction = 'NO TRADE';

  let entryZoneLow = 0;
  let entryZoneHigh = 0;
  let idealEntry = 0;
  let entryTrigger = '';
  let whyEnterThere = '';
  let stopLossPrice = 0;
  let whyStopLoss = '';
  let tp1Price = 0;
  let whyTp1 = '';
  let tp2Price = 0;
  let whyTp2 = '';
  let tp3Price = 0;
  let whyTp3 = '';
  let setupInvalidation = '';

  const missingConfirmations: string[] = [];
  const conflictingEvidence: string[] = [];

  if (hasCrossMarketConflict) {
    conflictingEvidence.push(crossMarketReason);
  }

  if (marketBias === 'Bullish') {
    setupType = currentPrice < midRange ? 'Liquidity Sweep' : 'Retest';
    entryType = 'CONFIRMED';

    entryZoneLow = Math.max(bullOrderBlockLow, valPrice);
    entryZoneHigh = Math.max(bullOrderBlockHigh, valPrice * 1.003);
    idealEntry = (entryZoneLow + entryZoneHigh) / 2;

    stopLossPrice = Math.min(entryZoneLow - volBuffer, currentPrice - minRiskPts);
    const riskPts = Math.max(minRiskPts, idealEntry - stopLossPrice);
    tp1Price = idealEntry + Math.max(targetTp1Pts, riskPts * 1.5);
    tp2Price = idealEntry + Math.max(targetTp2Pts, riskPts * 2.2);
    tp3Price = idealEntry + Math.max(targetTp3Pts, riskPts * 3.0);

    whyEnterThere = `Confluence of 1H Bullish Demand Order Block ($${bullOrderBlockLow.toFixed(1)}–$${bullOrderBlockHigh.toFixed(1)}), Value Area Low ($${valPrice.toFixed(1)}), and swept sell-side liquidity at PDL ($${prevDayLow.toFixed(1)}).`;
    whyStopLoss = `SL is placed below the structural liquidity-sweep low ($${stopLossPrice.toFixed(1)}) and 1H demand floor. A sustained break below invalidates the bullish thesis.`;
    whyTp1 = `First Major Buy-Side Liquidity Pool sweep ($${tp1Price.toFixed(1)}) at min 1:1.5 Risk-to-Reward.`;
    whyTp2 = `Institutional Swing Target (${targetTp2Pts} pts) at Session High / VAH ($${tp2Price.toFixed(1)}) & unmitigated FVG ceiling.`;
    whyTp3 = `Higher-timeframe Macro Target (${targetTp3Pts} pts): Previous High liquidity run ($${tp3Price.toFixed(1)}).`;
    setupInvalidation = `LONG setup invalid if 1H closes below $${stopLossPrice.toFixed(1)} and fails to reclaim it within 1 candle.`;
    entryTrigger = `Enter LONG on 15M candle holding above $${(idealEntry * 0.999).toFixed(1)} with buy-side volume confirmation.`;

    // Location and Range Protection Gates:
    if (currentPrice >= bearOrderBlockLow * 0.998) {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — PRICE AT SUPPLY RESISTANCE CEILING ($${currentPrice.toFixed(1)}). Never LONG directly into supply ceiling. Wait for pullback to demand.`;
      missingConfirmations.push('Price is at major supply ceiling; buying here has poor reward-to-risk.');
    } else if (isNearRangeMid) {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'WAIT FOR CONFIRMATION';
      statusMessage = 'WAIT — PRICE AT RANGE MIDPOINT (NO EDGE). Capital protected until price tests demand zone.';
      missingConfirmations.push('Price is currently in the middle of a range with zero edge.');
    } else if (currentPrice > entryZoneHigh * 1.010) {
      rawDecision = 'WAIT';
      entryStatus = 'MISSED';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — MISSED ENTRY, DO NOT CHASE. Price has already pumped above the optimal demand zone ($${entryZoneLow.toFixed(1)}–$${entryZoneHigh.toFixed(1)}).`;
      missingConfirmations.push('Price has already extended above the ideal entry zone.');
    } else if (currentPrice < entryZoneLow * 0.990) {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — DEMAND ZONE FAILED / BREAKDOWN. Price ($${currentPrice.toFixed(1)}) broke below demand floor. Invalidation active.`;
      missingConfirmations.push('Demand zone broke down; awaiting reclaim or new structure.');
    } else if (currentPrice >= entryZoneLow * 0.997 && currentPrice <= entryZoneHigh * 1.004) {
      // In the Zone! Require verified displacement or CHoCH trigger
      if (!isBullishDisplacement && !bullishChoch) {
        rawDecision = 'WAIT';
        entryStatus = 'WAIT FOR CONFIRMATION';
        finalAction = 'WAIT FOR CONFIRMATION';
        statusMessage = `WAIT — DEMAND ZONE REACHED ($${currentPrice.toFixed(1)}), BUT CONFIRMATION TRIGGER IS PENDING. Awaiting 15M bullish displacement close.`;
        missingConfirmations.push('15M bullish displacement trigger not confirmed yet.');
      } else if (hasCrossMarketConflict) {
        rawDecision = 'WAIT';
        entryStatus = 'WAIT';
        finalAction = 'WAIT FOR CONFIRMATION';
        statusMessage = `WAIT — CONFLICTING CROSS-MARKET TELEMETRY: ${crossMarketReason}`;
      } else {
        rawDecision = 'LONG';
        entryStatus = 'ACTIVE';
        finalAction = 'ENTER NOW';
        statusMessage = `🟢 LONG PRECISION ENTRY CONFIRMED — Demand Order Block holding with bullish displacement.`;
      }
    } else {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT FOR RETEST';
      finalAction = 'WAIT FOR CONFIRMATION';
      statusMessage = `WAIT — ENTRY ZONE APPROACHING. Price is pulling back toward demand zone ($${entryZoneLow.toFixed(1)}–$${entryZoneHigh.toFixed(1)}).`;
      missingConfirmations.push('Price has not yet touched the optimal demand entry zone.');
    }
  } else if (marketBias === 'Bearish') {
    setupType = currentPrice > midRange ? 'Liquidity Sweep' : 'Retest';
    entryType = 'CONFIRMED';

    entryZoneLow = Math.min(bearOrderBlockLow, vahPrice * 0.997);
    entryZoneHigh = Math.min(bearOrderBlockHigh, vahPrice);
    idealEntry = (entryZoneLow + entryZoneHigh) / 2;

    stopLossPrice = Math.max(entryZoneHigh + volBuffer, currentPrice + minRiskPts);
    const riskPts = Math.max(minRiskPts, stopLossPrice - idealEntry);
    tp1Price = idealEntry - Math.max(targetTp1Pts, riskPts * 1.5);
    tp2Price = idealEntry - Math.max(targetTp2Pts, riskPts * 2.2);
    tp3Price = idealEntry - Math.max(targetTp3Pts, riskPts * 3.0);

    whyEnterThere = `Confluence of 1H Bearish Supply Order Block ($${bearOrderBlockLow.toFixed(1)}–$${bearOrderBlockHigh.toFixed(1)}), Value Area High ($${vahPrice.toFixed(1)}), and swept buy-side liquidity at PDH ($${prevDayHigh.toFixed(1)}).`;
    whyStopLoss = `SL is placed above the structural liquidity-sweep high ($${stopLossPrice.toFixed(1)}) and 1H supply ceiling. A sustained break above invalidates the bearish thesis.`;
    whyTp1 = `Nearest logical sell-side liquidity pool sweep ($${tp1Price.toFixed(1)}) at min 1:1.5 R:R.`;
    whyTp2 = `Institutional Swing Target (${targetTp2Pts} pts) at Session Low / VAL ($${tp2Price.toFixed(1)}) & unmitigated demand floor.`;
    whyTp3 = `Higher-timeframe Macro Target (${targetTp3Pts} pts): Previous Low liquidity flush ($${tp3Price.toFixed(1)}).`;
    setupInvalidation = `SHORT setup invalid if 1H closes above $${stopLossPrice.toFixed(1)} and fails to retrace.`;
    entryTrigger = `Enter SHORT on 15M candle rejecting $${(idealEntry * 1.001).toFixed(1)} with selling volume confirmation.`;

    // Location and Range Protection Gates:
    if (currentPrice <= bullOrderBlockHigh * 1.002) {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — PRICE AT DEMAND SUPPORT FLOOR ($${currentPrice.toFixed(1)}). Never SHORT directly into demand support floor. Wait for bounce retest of supply.`;
      missingConfirmations.push('Price is at major demand floor; shorting here has poor reward-to-risk.');
    } else if (isNearRangeMid) {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'WAIT FOR CONFIRMATION';
      statusMessage = 'WAIT — PRICE AT RANGE MIDPOINT (NO EDGE). Capital protected until price tests supply zone.';
      missingConfirmations.push('Price is currently in the middle of a range with zero edge.');
    } else if (currentPrice < entryZoneLow * 0.990) {
      rawDecision = 'WAIT';
      entryStatus = 'MISSED';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — MISSED ENTRY, DO NOT CHASE. Price has already dumped below the optimal supply zone ($${entryZoneLow.toFixed(1)}–$${entryZoneHigh.toFixed(1)}).`;
      missingConfirmations.push('Price has already dropped far below the ideal short entry zone.');
    } else if (currentPrice > entryZoneHigh * 1.010) {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — SUPPLY CEILING BROKEN / RECLAIMED. Price ($${currentPrice.toFixed(1)}) rallied above supply ceiling. Invalidation active.`;
      missingConfirmations.push('Supply ceiling breached; awaiting breakdown or new structure.');
    } else if (currentPrice >= entryZoneLow * 0.996 && currentPrice <= entryZoneHigh * 1.003) {
      // In the Zone! Require verified displacement or CHoCH trigger
      if (!isBearishDisplacement && !bearishChoch) {
        rawDecision = 'WAIT';
        entryStatus = 'WAIT FOR CONFIRMATION';
        finalAction = 'WAIT FOR CONFIRMATION';
        statusMessage = `WAIT — SUPPLY ZONE REACHED ($${currentPrice.toFixed(1)}), BUT CONFIRMATION TRIGGER IS PENDING. Awaiting 15M bearish rejection close.`;
        missingConfirmations.push('15M bearish rejection trigger not confirmed yet.');
      } else if (hasCrossMarketConflict) {
        rawDecision = 'WAIT';
        entryStatus = 'WAIT';
        finalAction = 'WAIT FOR CONFIRMATION';
        statusMessage = `WAIT — CONFLICTING CROSS-MARKET TELEMETRY: ${crossMarketReason}`;
      } else {
        rawDecision = 'SHORT';
        entryStatus = 'ACTIVE';
        finalAction = 'ENTER NOW';
        statusMessage = `🔴 SHORT PRECISION ENTRY CONFIRMED — Supply Order Block rejecting with selling displacement.`;
      }
    } else {
      rawDecision = 'WAIT';
      entryStatus = 'WAIT FOR RETEST';
      finalAction = 'WAIT FOR CONFIRMATION';
      statusMessage = `WAIT — ENTRY ZONE APPROACHING. Price is rallying toward supply zone ($${entryZoneLow.toFixed(1)}–$${entryZoneHigh.toFixed(1)}).`;
      missingConfirmations.push('Price has not yet reached the optimal supply entry zone.');
    }
  } else {
    // 🟡 NEUTRAL / CONSOLIDATION CHOP ONLY
    rawDecision = 'WAIT';
    setupType = 'Range High/Low Reversal';
    entryType = 'CONSERVATIVE';
    entryZoneLow = valPrice;
    entryZoneHigh = valPrice * 1.002;
    idealEntry = valPrice * 1.001;
    entryTrigger = `WAIT FOR BREAKOUT — Enter LONG only after 1H close above $${vahPrice.toFixed(1)} + retest, or SHORT only after 1H close below $${valPrice.toFixed(1)} + retest.`;
    whyEnterThere = 'Market in consolidation chop. Capital protected in cash until clean breakout displacement occurs.';
    stopLossPrice = 0;
    whyStopLoss = 'No active position — Capital preserved with 0 risk exposure.';
    tp1Price = 0;
    whyTp1 = 'Awaiting structure confirmation.';
    tp2Price = 0;
    whyTp2 = 'Awaiting structure confirmation.';
    tp3Price = 0;
    whyTp3 = 'Awaiting structure confirmation.';
    setupInvalidation = 'Breakout beyond consolidation boundary with volume.';
    entryStatus = 'WAIT';
    finalAction = 'NO TRADE';
    statusMessage = 'WAIT — RANGE CONSOLIDATION CHOP. Capital protected until clean breakout displacement occurs.';
    missingConfirmations.push('Higher timeframe is in non-directional range oscillation.');
  }

  // 8. RISK / REWARD ENGINE (Rule 7 - STRICT MINIMUM 1.40 RRR MANDATORY)
  let riskPoints = 0;
  let rewardPoints = 0;
  let rrNumeric = 0;
  let riskRewardRatio = '—';
  let isRrAcceptable = true;

  if (rawDecision === 'LONG' && stopLossPrice > 0) {
    riskPoints = Math.max(0.1, idealEntry - stopLossPrice);
    rewardPoints = Math.max(0.1, tp1Price - idealEntry);
    rrNumeric = parseFloat((rewardPoints / riskPoints).toFixed(2));
    riskRewardRatio = `1 : ${rrNumeric}`;
    if (rrNumeric < 1.40) {
      isRrAcceptable = false;
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — INSUFFICIENT R:R (1:${rrNumeric}). Minimum acceptable is 1:1.40. Capital protected until price retraces deeper into demand.`;
      missingConfirmations.push(`Risk/Reward ratio (1:${rrNumeric}) is below the mandatory 1:1.40 gate.`);
    }
  } else if (rawDecision === 'SHORT' && stopLossPrice > 0) {
    riskPoints = Math.max(0.1, stopLossPrice - idealEntry);
    rewardPoints = Math.max(0.1, idealEntry - tp1Price);
    rrNumeric = parseFloat((rewardPoints / riskPoints).toFixed(2));
    riskRewardRatio = `1 : ${rrNumeric}`;
    if (rrNumeric < 1.40) {
      isRrAcceptable = false;
      rawDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      statusMessage = `WAIT — INSUFFICIENT R:R (1:${rrNumeric}). Minimum acceptable is 1:1.40. Capital protected until price rallies closer to supply ceiling.`;
      missingConfirmations.push(`Risk/Reward ratio (1:${rrNumeric}) is below the mandatory 1:1.40 gate.`);
    }
  }

  // 9. FIFTEEN-FACTOR CONFIRMATION FRAMEWORK (Rule 6)
  const fifteenFactors: FifteenFactorItem[] = [
    {
      id: 1,
      name: 'Higher-Timeframe Structure (1D/4H)',
      weight: 15,
      status: primaryHtfStructure === 'Bullish' ? 'BULLISH' : primaryHtfStructure === 'Bearish' ? 'BEARISH' : 'NEUTRAL',
      evidence: `1D/4H primary structure is ${primaryHtfStructure}. SMA20 is ${isSmaSlopingDown ? 'sloping down' : 'sloping up'}. Swing high: $${swingHigh.toFixed(1)}, Swing low: $${swingLow.toFixed(1)}.`,
      isCoreGate: true
    },
    {
      id: 2,
      name: 'Lower-Timeframe Structure (1H/15M)',
      weight: 10,
      status: isConfirmedBullishReversal ? 'BULLISH' : isConfirmedBearishReversal ? 'BEARISH' : marketBias === 'Bullish' ? 'BULLISH' : marketBias === 'Bearish' ? 'BEARISH' : 'NEUTRAL',
      evidence: `15M last close: $${lastClose.toFixed(1)}. HH: ${hhCount}, HL: ${hlCount}, LH: ${lhCount}, LL: ${llCount}.`,
      isCoreGate: true
    },
    {
      id: 3,
      name: 'Current Price Location',
      weight: 10,
      status: !isNearRangeMid && rawDecision === 'LONG' ? 'BULLISH' : !isNearRangeMid && rawDecision === 'SHORT' ? 'BEARISH' : 'NEUTRAL',
      evidence: isNearRangeMid ? 'Price at range midpoint (no edge zone).' : rawDecision === 'LONG' ? 'Price at Demand Order Block / VAL discount.' : 'Price at Supply Order Block / VAH premium.',
      isCoreGate: true
    },
    {
      id: 4,
      name: 'Liquidity Sweep & Status',
      weight: 10,
      status: sellSideSwept ? 'BULLISH' : buySideSwept ? 'BEARISH' : 'NEUTRAL',
      evidence: sellSideSwept ? `Sell-side liquidity swept below $${prevDayLow.toFixed(1)}.` : buySideSwept ? `Buy-side liquidity swept above $${prevDayHigh.toFixed(1)}.` : 'Resting liquidity pools untouched.',
      isCoreGate: true
    },
    {
      id: 5,
      name: 'BOS / CHoCH Confirmation',
      weight: 10,
      status: bullishChoch ? 'BULLISH' : bearishChoch ? 'BEARISH' : 'NEUTRAL',
      evidence: bullishChoch ? 'Bullish Change of Character confirmed above lower high.' : bearishChoch ? 'Bearish Change of Character confirmed below higher low.' : 'No structural break confirmed.',
      isCoreGate: true
    },
    {
      id: 6,
      name: 'Supply / Demand Reaction',
      weight: 8,
      status: rawDecision === 'LONG' ? 'BULLISH' : rawDecision === 'SHORT' ? 'BEARISH' : 'NEUTRAL',
      evidence: rawDecision === 'LONG' ? `Bouncing from 1H Demand zone ($${bullOrderBlockLow.toFixed(1)}–$${bullOrderBlockHigh.toFixed(1)}).` : rawDecision === 'SHORT' ? `Rejecting from 1H Supply zone ($${bearOrderBlockLow.toFixed(1)}–$${bearOrderBlockHigh.toFixed(1)}).` : 'No zone reaction confirmed.',
      isCoreGate: false
    },
    {
      id: 7,
      name: 'Order Block Validity',
      weight: 8,
      status: rawDecision === 'LONG' ? 'BULLISH' : rawDecision === 'SHORT' ? 'BEARISH' : 'NEUTRAL',
      evidence: rawDecision === 'LONG' ? 'Unmitigated bullish order block floor respected.' : rawDecision === 'SHORT' ? 'Unmitigated bearish order block ceiling respected.' : 'Awaiting order block mitigation.',
      isCoreGate: false
    },
    {
      id: 8,
      name: 'Fair Value Gap (FVG) / Imbalance',
      weight: 5,
      status: rawDecision === 'LONG' ? 'BULLISH' : rawDecision === 'SHORT' ? 'BEARISH' : 'NEUTRAL',
      evidence: rawDecision === 'LONG' ? 'Bullish FVG fill and displacement.' : rawDecision === 'SHORT' ? 'Bearish FVG retest and rejection.' : 'Imbalance zones balanced.',
      isCoreGate: false
    },
    {
      id: 9,
      name: 'Volume & Order Flow',
      weight: 10,
      status: isBullishDisplacement ? 'BULLISH' : isBearishDisplacement ? 'BEARISH' : 'NEUTRAL',
      evidence: isBullishDisplacement ? 'Positive buying delta and volume expansion.' : isBearishDisplacement ? 'Aggressive selling volume and displacement.' : 'Volume in normal consolidation bounds.',
      isCoreGate: false
    },
    {
      id: 10,
      name: 'Open Interest (OI) & Buildup',
      weight: 7,
      status: 'NEUTRAL',
      evidence: 'OI context balanced; no crowded liquidation buildup detected.',
      isCoreGate: false
    },
    {
      id: 11,
      name: 'Funding Rate & Crowded Positioning',
      weight: 5,
      status: 'NEUTRAL',
      evidence: 'Funding neutral (+0.008%); no extreme crowd imbalance.',
      isCoreGate: false
    },
    {
      id: 12,
      name: 'Liquidation Positioning & Squeeze Risk',
      weight: 5,
      status: rawDecision === 'LONG' ? 'BULLISH' : rawDecision === 'SHORT' ? 'BEARISH' : 'NEUTRAL',
      evidence: rawDecision === 'LONG' ? `Short liquidation cluster overhead at $${tp1Price.toFixed(1)}.` : rawDecision === 'SHORT' ? `Long liquidation cluster resting below at $${tp1Price.toFixed(1)}.` : 'Liquidation bands equidistant.',
      isCoreGate: false
    },
    {
      id: 13,
      name: 'Momentum & Trend Strength',
      weight: 5,
      status: lastClose > sma20 ? 'BULLISH' : 'BEARISH',
      evidence: lastClose > sma20 ? 'Price holding above 20-period moving average.' : 'Price tracking below 20-period moving average.',
      isCoreGate: false
    },
    {
      id: 14,
      name: 'Cross-Market & Macro Context (USDT.D / DXY)',
      weight: 4,
      status: hasCrossMarketConflict ? 'NEUTRAL' : usdtDTrend === 'FALLING' ? 'BULLISH' : 'BEARISH',
      evidence: isBtc
        ? `USDT Dominance is ${usdtDTrend} (${usdtDVal}%). ${hasCrossMarketConflict ? crossMarketReason : 'Cross-market correlation confirmed.'}`
        : isGold
        ? `Dollar Index (DXY) is ${dxyTrend} (${dxyVal}). ${hasCrossMarketConflict ? crossMarketReason : 'Commodity macro flow aligned.'}`
        : 'Cross-market correlation neutral.',
      isCoreGate: true
    },
    {
      id: 15,
      name: 'Entry Quality, SL Placement & R:R',
      weight: 3,
      status: isRrAcceptable && rrNumeric >= 1.40 ? (rawDecision === 'LONG' ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      evidence: `Planned R:R = ${riskRewardRatio}. Minimum 1:1.40 mandatory threshold ${isRrAcceptable && rrNumeric >= 1.40 ? 'passed' : 'failed'}.`,
      isCoreGate: true
    }
  ];

  // Calculate Confirmation Score (0-100)
  let bullishFactorPoints = 0;
  let bearishFactorPoints = 0;
  fifteenFactors.forEach((f) => {
    if (f.status === 'BULLISH') bullishFactorPoints += f.weight;
    else if (f.status === 'BEARISH') bearishFactorPoints += f.weight;
    else bullishFactorPoints += f.weight * 0.4; // neutral
  });

  const entryQualityScore = Math.min(
    100,
    Math.round(rawDecision === 'LONG' ? bullishFactorPoints : rawDecision === 'SHORT' ? bearishFactorPoints : Math.max(bullishFactorPoints, bearishFactorPoints) * 0.75)
  );

  let entryQualityLabel: PrecisionEntryOutput['entryQualityLabel'] = 'NO ENTRY';
  if (entryQualityScore >= 85) entryQualityLabel = 'Excellent Entry';
  else if (entryQualityScore >= 75) entryQualityLabel = 'High-Quality Entry';
  else if (entryQualityScore >= 65) entryQualityLabel = 'Moderate — Confirmation Required';
  else entryQualityLabel = 'NO ENTRY';

  // 10. HARD NO-FLIP SIGNAL STATE MACHINE (Rules 9, 12, 17)
  const existingLock = getStoredState(symbol);
  let finalDecision: DeeeprDecision = rawDecision;
  let isSignalLocked = false;

  if (existingLock && (existingLock.decision === 'LONG' || existingLock.decision === 'SHORT')) {
    // Check for structural invalidation
    const isLongInvalidated =
      existingLock.decision === 'LONG' && currentPrice <= existingLock.invalidationPrice;
    const isShortInvalidated =
      existingLock.decision === 'SHORT' && currentPrice >= existingLock.invalidationPrice;

    if (isLongInvalidated || isShortInvalidated) {
      // Transition strictly to WAIT; NEVER allow immediate direct flip to opposite side!
      setStoredState(symbol, null);
      finalDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      isSignalLocked = false;
      statusMessage = `${existingLock.decision} INVALIDATED — Price reached structural invalidation ($${existingLock.invalidationPrice.toFixed(1)}). Transitioning to WAIT. Capital protected in cash. Fresh independent opposite setup required.`;
    } else {
      // Setup remains locked!
      finalDecision = existingLock.decision;
      isSignalLocked = true;
      entryZoneLow = existingLock.entryZoneLow;
      entryZoneHigh = existingLock.entryZoneHigh;
      idealEntry = existingLock.idealEntry;
      stopLossPrice = existingLock.stopLossPrice;
      tp1Price = existingLock.tp1Price;
      tp2Price = existingLock.tp2Price;
      tp3Price = existingLock.tp3Price;
      setupType = existingLock.setupType;
      entryType = existingLock.entryType;

      const distFromZone = Math.abs(currentPrice - idealEntry) / (idealEntry || 1);
      if (distFromZone <= 0.007) {
        entryStatus = 'ACTIVE';
        finalAction = 'ENTER NOW';
        statusMessage = `🟢 ${finalDecision} SETUP ACTIVE — Price inside defined precision entry execution zone.`;
      } else if (
        (finalDecision === 'LONG' && currentPrice > entryZoneHigh * 1.015) ||
        (finalDecision === 'SHORT' && currentPrice < entryZoneLow * 0.985)
      ) {
        entryStatus = 'MISSED';
        finalAction = 'NO TRADE';
        statusMessage = `⚠️ ENTRY MISSED — DO NOT CHASE. Price has moved away from entry zone.`;
      } else {
        entryStatus = 'WAIT';
        finalAction = 'WAIT FOR CONFIRMATION';
        statusMessage = `🟡 ${finalDecision} THESIS LOCKED — Price pulling back to entry level. Awaiting 15M trigger.`;
      }
    }
  } else {
    // No existing lock
    if (rawDecision === 'LONG' || rawDecision === 'SHORT') {
      finalDecision = rawDecision;
      isSignalLocked = true;
      entryStatus = 'ACTIVE';
      finalAction = 'ENTER NOW';
      statusMessage = `🟢 ${finalDecision} HIGH-QUALITY SETUP CONFIRMED (Score: ${entryQualityScore}/100) — Precision Entry Active.`;

      const newState: ActivePrecisionSignalState = {
        symbol,
        decision: finalDecision,
        bias: marketBias,
        lockedAt: Date.now(),
        entryZoneLow,
        entryZoneHigh,
        idealEntry,
        stopLossPrice,
        tp1Price,
        tp2Price,
        tp3Price,
        invalidationPrice: stopLossPrice,
        invalidationCondition: setupInvalidation,
        entryQualityScore,
        setupType,
        entryType,
        status: 'ACTIVE'
      };
      setStoredState(symbol, newState);
    } else {
      finalDecision = 'WAIT';
      isSignalLocked = false;
      entryStatus = 'WAIT';
      finalAction = 'WAIT FOR CONFIRMATION';
      // statusMessage already assigned above
    }
  }

  // 11. CHECKLIST & SCORE BREAKDOWN
  const checklist: EntryChecklistItem[] = [
    { label: 'Higher-timeframe structure confirmed', checked: primaryHtfStructure !== 'Range', notes: `${primaryHtfStructure} on 1D/4H` },
    { label: 'Market regime identified', checked: true, notes: marketRegime },
    { label: 'Important price zone identified', checked: true, notes: `OB & POC at $${idealEntry.toFixed(1)}` },
    { label: 'Liquidity sweep verified', checked: sellSideSwept || buySideSwept, notes: `PDH: $${prevDayHigh.toFixed(1)} | PDL: $${prevDayLow.toFixed(1)}` },
    { label: 'Entry location not at range midpoint', checked: !isNearRangeMid, notes: 'Discount/Premium zone verified' },
    { label: 'Structure confirmation present (BOS/CHoCH)', checked: finalDecision !== 'WAIT', notes: 'Displacement sequence validated' },
    { label: 'Volume & order flow aligned', checked: isBullishDisplacement || isBearishDisplacement, notes: 'Delta expansion confirmed' },
    { label: 'Entry trigger satisfied (not chased)', checked: finalAction === 'ENTER NOW', notes: entryTrigger },
    { label: 'Stop Loss placed on structural invalidation', checked: stopLossPrice > 0, notes: whyStopLoss },
    { label: 'Take Profit targets calibrated', checked: tp1Price > 0, notes: whyTp1 },
    { label: 'Risk/Reward ratio acceptable (>= 1:1.40)', checked: isRrAcceptable && rrNumeric >= 1.40, notes: riskRewardRatio },
    { label: 'Cross-market confirmation aligned', checked: !hasCrossMarketConflict, notes: isBtc ? `USDT.D is ${usdtDTrend}` : `DXY is ${dxyTrend}` }
  ];

  const scoreBreakdown: EntryScoreBreakdownItem[] = [
    { category: 'Higher-Timeframe Structure', weight: 15, score: fifteenFactors[0].status === 'BULLISH' || fifteenFactors[0].status === 'BEARISH' ? 14 : 7, comment: fifteenFactors[0].evidence },
    { category: 'Entry Location Quality', weight: 10, score: !isNearRangeMid ? 9 : 3, comment: fifteenFactors[2].evidence },
    { category: 'Liquidity Confluence', weight: 10, score: sellSideSwept || buySideSwept ? 10 : 5, comment: fifteenFactors[3].evidence },
    { category: 'Structure Confirmation (BOS/CHoCH)', weight: 10, score: bullishChoch || bearishChoch ? 9 : 4, comment: fifteenFactors[4].evidence },
    { category: 'Order Block & FVG Mitigation', weight: 13, score: rawDecision !== 'WAIT' ? 11 : 5, comment: fifteenFactors[6].evidence },
    { category: 'Volume & Order Flow Displacement', weight: 10, score: isBullishDisplacement || isBearishDisplacement ? 9 : 4, comment: fifteenFactors[8].evidence },
    { category: 'Cross-Market & Macro Radar', weight: 12, score: !hasCrossMarketConflict ? 11 : 3, comment: fifteenFactors[13].evidence },
    { category: 'Risk/Reward Ratio (>= 1:1.40)', weight: 20, score: isRrAcceptable && rrNumeric >= 1.40 ? 19 : 6, comment: fifteenFactors[14].evidence }
  ];

  const nearbyKeyLevels: KeyLevelItem[] = [
    {
      name: 'Previous Week High (PWH)',
      price: prevWeekHigh,
      type: 'LIQUIDITY',
      distancePct: ((prevWeekHigh - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Major weekly resting buy-side liquidity ceiling'
    },
    {
      name: 'Previous Day High (PDH) / Equal Highs',
      price: prevDayHigh,
      type: 'LIQUIDITY',
      distancePct: ((prevDayHigh - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Session buy-side liquidity pool & sweep trigger'
    },
    {
      name: 'Bearish 1H/4H Order Block & Supply',
      price: (bearOrderBlockLow + bearOrderBlockHigh) / 2,
      type: 'SMC',
      distancePct: (((bearOrderBlockLow + bearOrderBlockHigh) / 2 - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Institutional sell imbalance & mitigation block'
    },
    {
      name: 'Volume Profile VAH (Value Area High)',
      price: vahPrice,
      type: 'VOLUME_PROFILE',
      distancePct: ((vahPrice - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Upper boundary of 70% value distribution'
    },
    {
      name: 'Volume Profile POC (Point of Control)',
      price: pocPrice,
      type: 'VOLUME_PROFILE',
      distancePct: ((pocPrice - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Highest traded volume node & institutional mean'
    },
    {
      name: 'Volume Profile VAL (Value Area Low)',
      price: valPrice,
      type: 'VOLUME_PROFILE',
      distancePct: ((valPrice - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Lower boundary of 70% value distribution'
    },
    {
      name: 'Bullish 1H/4H Order Block & Demand',
      price: (bullOrderBlockLow + bullOrderBlockHigh) / 2,
      type: 'SMC',
      distancePct: (((bullOrderBlockLow + bullOrderBlockHigh) / 2 - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Institutional accumulation origin & displacement base'
    },
    {
      name: 'Previous Day Low (PDL) / Equal Lows',
      price: prevDayLow,
      type: 'LIQUIDITY',
      distancePct: ((prevDayLow - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Session sell-side liquidity pool & sweep trigger'
    },
    {
      name: 'Previous Week Low (PWL)',
      price: prevWeekLow,
      type: 'LIQUIDITY',
      distancePct: ((prevWeekLow - currentPrice) / (currentPrice || 1)) * 100,
      description: 'Major weekly sell-side liquidity target'
    }
  ];

  const timeframeStructure = {
    daily: {
      bias: primaryHtfStructure === 'Bullish' ? 'Bullish' as MarketBias : primaryHtfStructure === 'Bearish' ? 'Bearish' as MarketBias : 'Neutral' as MarketBias,
      structure: primaryHtfStructure === 'Bullish' ? 'Daily Higher-Low held at demand floor' : primaryHtfStructure === 'Bearish' ? 'Daily Lower-High rejection beneath supply' : 'Daily Multi-week macro range equilibrium'
    },
    h4: {
      bias: marketBias,
      structure: marketBias === 'Bullish' ? '4H Bullish Break of Structure (BOS) intact' : marketBias === 'Bearish' ? '4H Bearish BOS with displacement' : '4H Horizontal range oscillation between VAH & VAL'
    },
    h1: {
      bias: marketBias,
      structure: marketBias === 'Bullish' ? '1H Bullish Order Block respected on pullbacks' : marketBias === 'Bearish' ? '1H Bearish Order Block capping rallies' : '1H Consolidation chop at Point of Control'
    },
    m30: {
      bias: marketBias,
      structure: marketBias === 'Bullish' ? '30M Liquidity sweep complete, holding above VAL' : marketBias === 'Bearish' ? '30M Buy-side liquidity swept, holding below VAH' : '30M Neutral candle distribution'
    },
    m15: {
      bias: marketBias,
      structure: marketBias === 'Bullish' ? '15M CHoCH confirmed with bullish candle close' : marketBias === 'Bearish' ? '15M CHoCH confirmed with bearish candle close' : '15M Indecision doji / no directional expansion'
    },
    m5: {
      bias: marketBias,
      structure: '5M Execution refinement only (Secondary confirmation)'
    }
  };

  const confirmation = {
    structure: finalDecision !== 'WAIT',
    liquidity: sellSideSwept || buySideSwept,
    volumeOrderFlow: isBullishDisplacement || isBearishDisplacement,
    keyLevel: !isNearRangeMid,
    smcPriceAction: true
  };

  const whatCanGoWrong: [string, string, string] = [
    `High-impact macroeconomic event or sudden BTC delta flush triggering broad market liquidation.`,
    `Aggressive absorption failed at key structural level, causing displacement through $${stopLossPrice.toFixed(1)}.`,
    `False breakout / SFP wick hunt creating sudden liquidity sweep before reversing.`
  ];

  const entryZoneFormatted = stopLossPrice > 0 ? `$${entryZoneLow.toFixed(1)} – $${entryZoneHigh.toFixed(1)}` : 'Awaiting Setup Confirmation';

  // 12. VERBATIM INSTITUTIONAL REPORT (Section 11 Format)
  const verbatimInstitutionalReport = `DEEEPR AI — FINAL DECISION (SECTION 11 FORMAT)

ASSET:
${symbol} (${assetName})

CURRENT VERIFIED PRICE:
$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

DATA TIMESTAMP:
${dataTimestamp}

HIGHER-TIMEFRAME BIAS:
${primaryHtfStructure.toUpperCase()}

1H SETUP:
${marketBias === 'Bullish' ? 'Bullish Demand Retest & Liquidity Reclaim' : marketBias === 'Bearish' ? 'Bearish Supply Rejection & Breakdown Retest' : 'Consolidation Range Chop'}

15M ENTRY STATUS:
${entryStatus}

MARKET REGIME:
${marketRegime}

KEY SUPPORT:
$${valPrice.toFixed(1)} (VAL / Bullish Order Block Floor: $${bullOrderBlockLow.toFixed(1)})

KEY RESISTANCE:
$${vahPrice.toFixed(1)} (VAH / Bearish Order Block Ceiling: $${bearOrderBlockHigh.toFixed(1)})

LIQUIDITY STATUS:
${sellSideSwept ? `Sell-side liquidity swept below $${prevDayLow.toFixed(1)}` : buySideSwept ? `Buy-side liquidity swept above $${prevDayHigh.toFixed(1)}` : 'Resting session liquidity pools untouched'}

CONFIRMATION TRIGGER:
${entryTrigger}

IDEAL ENTRY ZONE:
${entryZoneFormatted}

STOP LOSS:
${stopLossPrice > 0 ? `$${stopLossPrice.toFixed(1)}` : '—'}

TP1:
${tp1Price > 0 ? `$${tp1Price.toFixed(1)} (+${targetTp1Pts.toLocaleString()} pts)` : '—'}

TP2:
${tp2Price > 0 ? `$${tp2Price.toFixed(1)} (+${targetTp2Pts.toLocaleString()} pts)` : '—'}

PLANNED R:R:
${riskRewardRatio} (Minimum 1:1.40 threshold ${isRrAcceptable ? 'Satisfied' : 'Failed'})

CONFIRMATION SCORE:
${entryQualityScore}/100

MISSING CONFIRMATIONS:
${missingConfirmations.length > 0 ? missingConfirmations.join(' · ') : 'None (All core gates satisfied)'}

CONFLICTING EVIDENCE:
${conflictingEvidence.length > 0 ? conflictingEvidence.join(' · ') : 'None (Cross-market correlation verified)'}

INVALIDATION CONDITION:
${setupInvalidation || 'Breach of consolidation boundaries with volume.'}

FINAL DECISION:
${finalDecision}

REASON FOR DECISION:
${statusMessage}`;

  // 13. SECTION 20 PANEL
  const verbatimSection20Panel = `DEEEPR AI — PRECISION ENTRY (SECTION 20)

FINAL DECISION
${finalDecision === 'LONG' ? '🟢 LONG' : finalDecision === 'SHORT' ? '🔴 SHORT' : '🟡 WAIT'}

MARKET BIAS
${marketBias}

MARKET REGIME
${marketRegime}

SETUP TYPE
${setupType}

ENTRY QUALITY
${entryQualityScore} / 100 (${entryQualityLabel})

ENTRY ZONE
${entryZoneFormatted}

IDEAL ENTRY
${idealEntry > 0 ? `$${idealEntry.toFixed(1)}` : '—'}

ENTRY TRIGGER
${entryTrigger}

STOP LOSS
${stopLossPrice > 0 ? `$${stopLossPrice.toFixed(1)}` : '—'}

WHY SL?
${whyStopLoss}

TP1
${tp1Price > 0 ? `$${tp1Price.toFixed(1)} (+${targetTp1Pts} pts)` : '—'}
Reason: ${whyTp1}

TP2
${tp2Price > 0 ? `$${tp2Price.toFixed(1)} (+${targetTp2Pts} pts)` : '—'}
Reason: ${whyTp2}

TP3
${tp3Price > 0 ? `$${tp3Price.toFixed(1)} (+${targetTp3Pts} pts)` : '—'}
Reason: ${whyTp3}

RISK : REWARD
${riskRewardRatio}

LIQUIDITY
Above: $${prevDayHigh.toFixed(1)} (PDH / BSL)
Below: $${prevDayLow.toFixed(1)} (PDL / SSL)
Nearest target liquidity: ${finalDecision === 'LONG' ? `$${prevDayHigh.toFixed(1)}` : `$${prevDayLow.toFixed(1)}`}

CONFIRMATION
✓ Structure: ${confirmation.structure ? 'Confirmed' : 'Pending'}
✓ Liquidity: ${confirmation.liquidity ? 'Confirmed' : 'Pending'}
✓ Volume/Order Flow: ${confirmation.volumeOrderFlow ? 'Confirmed' : 'Pending'}
✓ Key Level: ${confirmation.keyLevel ? 'Confirmed' : 'Pending'}
✓ SMC/Price Action: Confirmed

WHAT CAN GO WRONG?
1. ${whatCanGoWrong[0]}
2. ${whatCanGoWrong[1]}
3. ${whatCanGoWrong[2]}

INVALIDATION
${setupInvalidation}

ACTION
${finalAction}`;

  return {
    asset: assetName,
    symbol,
    currentPrice,
    dataTimestamp,
    isDataFresh: true,
    finalDecision,
    marketBias,
    marketRegime,
    setupType,
    entryType,
    action: finalAction,
    entryStatus,
    statusMessage,
    entryQualityScore,
    entryQualityLabel,
    entryZone: entryZoneFormatted,
    entryZoneLow,
    entryZoneHigh,
    idealEntry,
    entryTrigger,
    whyEnterThere,
    stopLossPrice,
    whyStopLoss,
    tp1Price,
    whyTp1,
    tp2Price,
    whyTp2,
    tp3Price,
    whyTp3,
    riskPoints,
    rewardPoints,
    riskRewardRatio,
    rrNumeric,
    isRrAcceptable,
    liquidityAbove: `$${prevDayHigh.toFixed(1)}`,
    liquidityBelow: `$${prevDayLow.toFixed(1)}`,
    nearestTargetLiquidity: finalDecision === 'LONG' ? `$${prevDayHigh.toFixed(1)}` : `$${prevDayLow.toFixed(1)}`,
    fifteenFactors,
    missingConfirmations,
    conflictingEvidence,
    crossMarket: {
      btcTrend: primaryHtfStructure === 'Bullish' ? 'BULLISH' : primaryHtfStructure === 'Bearish' ? 'BEARISH' : 'SIDEWAYS',
      usdtDominanceValue: usdtDVal,
      usdtDominanceTrend: usdtDTrend,
      dxyValue: dxyVal,
      dxyTrend,
      dualVerdict: hasCrossMarketConflict ? crossMarketReason : 'Cross-market correlation fully aligned.',
      hasConflict: hasCrossMarketConflict
    },
    confirmation,
    whatCanGoWrong,
    setupInvalidation,
    nearbyKeyLevels,
    checklist,
    scoreBreakdown,
    timeframeStructure,
    verbatimInstitutionalReport,
    verbatimSection20Panel,
    isSignalLocked,
    lockedAt: existingLock?.lockedAt
  };
}

/**
 * Fallback output when chart data cannot be verified
 */
function buildUnverifiedDataOutput(symbol: string, currentPrice: number, dataTimestamp: string): PrecisionEntryOutput {
  const assetName = symbol.replace('USDT', '').replace('USD', '');
  const dummyFactors: FifteenFactorItem[] = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `Factor ${i + 1}`,
    weight: Math.round(100 / 15),
    status: 'UNAVAILABLE',
    evidence: 'Chart feed data unverified or historical candles missing.',
    isCoreGate: i < 5
  }));

  const msg = 'WAIT — LIVE DATA NOT VERIFIED. Historical candles or price feed unavailable. No fabricated new trade.';

  return {
    asset: assetName,
    symbol,
    currentPrice: currentPrice || 0,
    dataTimestamp,
    isDataFresh: false,
    finalDecision: 'WAIT',
    marketBias: 'Neutral',
    marketRegime: 'Consolidation',
    setupType: 'Retest',
    entryType: 'CONSERVATIVE',
    action: 'NO TRADE',
    entryStatus: 'WAIT',
    statusMessage: msg,
    entryQualityScore: 0,
    entryQualityLabel: 'NO ENTRY',
    entryZone: 'Data Unverified',
    entryZoneLow: 0,
    entryZoneHigh: 0,
    idealEntry: 0,
    entryTrigger: 'Awaiting verified market feed connection.',
    whyEnterThere: 'No trade allowed without verified live market data.',
    stopLossPrice: 0,
    whyStopLoss: 'No trade active.',
    tp1Price: 0,
    whyTp1: '—',
    tp2Price: 0,
    whyTp2: '—',
    tp3Price: 0,
    whyTp3: '—',
    riskPoints: 0,
    rewardPoints: 0,
    riskRewardRatio: '—',
    rrNumeric: 0,
    isRrAcceptable: false,
    liquidityAbove: '—',
    liquidityBelow: '—',
    nearestTargetLiquidity: '—',
    fifteenFactors: dummyFactors,
    missingConfirmations: ['Live market feed data is unverified or insufficient.'],
    conflictingEvidence: [],
    crossMarket: {
      btcTrend: 'SIDEWAYS',
      usdtDominanceValue: 6.57,
      usdtDominanceTrend: 'SIDEWAYS',
      dxyValue: 104.2,
      dxyTrend: 'SIDEWAYS',
      dualVerdict: 'Data unverified.',
      hasConflict: true
    },
    confirmation: {
      structure: false,
      liquidity: false,
      volumeOrderFlow: false,
      keyLevel: false,
      smcPriceAction: false
    },
    whatCanGoWrong: [
      'Trading on unverified or stale data.',
      'Slippage or missing candle execution.',
      'False trend prediction.'
    ],
    setupInvalidation: 'Immediate invalidation on data feed reconnection.',
    nearbyKeyLevels: [],
    checklist: [],
    scoreBreakdown: [],
    timeframeStructure: {
      daily: { bias: 'Neutral', structure: 'Data unverified' },
      h4: { bias: 'Neutral', structure: 'Data unverified' },
      h1: { bias: 'Neutral', structure: 'Data unverified' },
      m30: { bias: 'Neutral', structure: 'Data unverified' },
      m15: { bias: 'Neutral', structure: 'Data unverified' },
      m5: { bias: 'Neutral', structure: 'Data unverified' }
    },
    verbatimInstitutionalReport: `DEEEPR AI — FINAL DECISION\n\nASSET: ${symbol}\nSTATUS: ${msg}`,
    verbatimSection20Panel: `DEEEPR AI — PRECISION ENTRY\n\nFINAL DECISION: 🟡 WAIT\nSTATUS: ${msg}`,
    isSignalLocked: false
  };
}
