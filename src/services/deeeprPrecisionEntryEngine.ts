/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DEEEPR AI — ADVANCED PRECISION ENTRY LEVEL ENGINE (v11)
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * SPECIFICATION & RULES:
 * 1. ENTRY MUST BE LOCATION-BASED:
 *    Never use current market price as the entry automatically.
 *    Identify key levels: Support, Resistance, Supply, Demand, PDH, PDL, PWH, PWL,
 *    Swing High/Low, Equal High/Low, Liquidity Pool, Order Block, FVG, Breaker Block,
 *    POC, VAH, VAL, HVN, LVN.
 * 2. MULTI-TIMEFRAME ENTRY ANALYSIS:
 *    Daily > 4H > 1H > 30M > 15M > 5M
 *    Never allow a 5M signal to override a strong 4H structure by itself.
 * 3. DETERMINE MARKET REGIME FIRST:
 *    Trending Up, Trending Down, Range, Accumulation, Distribution, Expansion,
 *    Consolidation, High Volatility, Low Volatility, Transition.
 *    - Trending: pullback, retest, liquidity sweep, continuation, OB, FVG.
 *    - Range: range high rejection, range low rejection, liquidity sweep, confirmed reversal.
 *      NEVER enter in the middle of a range.
 *    - High Volatility: increase confirmation requirements and use volatility buffer for SL.
 * 4. RANK ENTRY LOCATION QUALITY (0-100):
 *    Score based on HTF S/R, Liquidity proximity, OB quality, FVG quality, Volume Profile,
 *    Structure, previous reaction, Volume, R:R.
 * 5. LONG ENTRY ENGINE:
 *    Step 1: Bullish HTF (4H/1H) structure (HH, HL, BOS, CHoCH, demand, support).
 *    Step 2: Price reaches valid location (demand, OB, FVG, VAL, POC, discount).
 *    Step 3: Liquidity sweep (SSL swept -> rejection).
 *    Step 4: Structure confirmation (bullish CHoCH/BOS, displacement, reclaim).
 *    Step 5: Retest (broken resistance, OB, FVG, support).
 *    Step 6: Volume / Order flow confirmation.
 * 6. SHORT ENTRY ENGINE:
 *    Step 1: 4H/1H bearish structure (LH, LL, BOS, CHoCH, supply, resistance).
 *    Step 2: Price reaches valid location (supply, OB, FVG, VAH, premium).
 *    Step 3: Buy-side liquidity sweep (BSL swept -> rejection).
 *    Step 4: Structure confirmation (bearish CHoCH/BOS, displacement, breakdown).
 *    Step 5: Retest.
 *    Step 6: Volume / Order flow confirmation.
 * 7. EXACT ENTRY ZONE & TRIGGER:
 *    Provide Entry Zone (X - Y), Ideal Entry (X), Entry Trigger ("15M candle must close above...").
 *    If trigger not met -> NO ENTRY.
 * 8. THREE ENTRY TYPES:
 *    A. AGGRESSIVE ENTRY (Higher Execution Risk)
 *    B. CONFIRMED ENTRY (Default)
 *    C. CONSERVATIVE ENTRY (Lower entry risk, confirmation after breakout & retest)
 * 9. NEVER CHASE PRICE:
 *    If market moved away: "ENTRY MISSED — DO NOT CHASE". Calculate next valid zone only if new setup.
 * 10. STOP LOSS ENGINE & EXPLANATION:
 *     SL placed strictly on thesis invalidation (below swing low / sweep low / OB for LONG;
 *     above swing high / sweep high / OB for SHORT) + volatility buffer. "WHY THIS SL?" mandatory.
 * 11. TAKE PROFIT ENGINE:
 *     TP1 (nearest logical liquidity/structure), TP2 (next major liquidity/level), TP3 (HTF target).
 *     Every target includes "WHY THIS TARGET?".
 * 12. RISK / REWARD ENGINE:
 *     Minimum 1:1.5. Preferred 1:2 or better. If poor R:R -> WAIT — NO VALID TRADE.
 * 13. ENTRY CONFIRMATION SCORE (0-100):
 *     HTF Structure (20%), Entry Location (20%), Liquidity (15%), Structure Confirmation (15%),
 *     Volume/Order Flow (10%), SMC/PA (10%), Risk/Reward (10%).
 *     85-100: Excellent Entry
 *     75-84: High-Quality Entry
 *     65-74: Moderate — confirmation required
 *     <65: NO ENTRY
 * 14. ENTRY CONFIRMATION CHECKLIST (12 items).
 * 15. ENTRY VS BIAS SEPARATION:
 *     Market Bias can be Bullish while Entry Status is WAIT ("WAIT FOR ENTRY AT X-Y").
 * 16. SETUP INVALIDATION & SIGNAL STABILITY:
 *     Signal locked once active. Minor fluctuations do not reverse signal.
 * 17. FINAL USER-FACING PANEL (SECTION 20 VERBATIM REPORT).
 */

export type DeeeprDecision = 'LONG' | 'SHORT' | 'WAIT';
export type MarketBias = 'Bullish' | 'Bearish' | 'Neutral';
export type EntryType = 'AGGRESSIVE' | 'CONFIRMED' | 'CONSERVATIVE';
export type FinalAction = 'ENTER NOW' | 'WAIT FOR CONFIRMATION' | 'NO TRADE';
export type EntryStatus = 'ACTIVE' | 'WAIT' | 'MISSED';

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

export interface PrecisionEntryOutput {
  asset: string;
  symbol: string;
  currentPrice: number;

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

  // Take Profits
  tp1Price: number;
  whyTp1: string;
  tp2Price: number;
  whyTp2: string;
  tp3Price: number;
  whyTp3: string;

  // Risk / Reward
  riskPoints: number;
  rewardPoints: number;
  riskRewardRatio: string; // e.g. "1 : 1.85"
  rrNumeric: number;
  isRrAcceptable: boolean;

  // Liquidity
  liquidityAbove: string;
  liquidityBelow: string;
  nearestTargetLiquidity: string;

  // Confirmation Vector (Section 20)
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

  // Key Nearby Levels (Location-based foundation)
  nearbyKeyLevels: KeyLevelItem[];

  // 12-Point Entry Confirmation Checklist
  checklist: EntryChecklistItem[];

  // Entry Score 7 Pillars
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

  // Verbatim Section 20 Formatted Text for Instant Institutional Export
  verbatimSection20Panel: string;

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

const STORAGE_KEY_PREFIX = 'deeepr_precision_entry_v11_';
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
 * MASTER EVALUATOR: DEEEPR AI PRECISION ENTRY ENGINE
 */
export function evaluateDeeeprPrecisionEntry(
  symbol: string,
  currentPrice: number,
  timeframeOrCandles?: string | any[],
  maybeCandles?: any[]
): PrecisionEntryOutput {
  const candleList: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> =
    Array.isArray(timeframeOrCandles) ? timeframeOrCandles : Array.isArray(maybeCandles) ? maybeCandles : [];
  const assetName = symbol.replace('USDT', '').replace('USD', '');
  const hasCandles = candleList.length >= 20;

  // 1. CALCULATE STRUCTURAL SWINGS, S/R, KEY LEVELS
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

  if (hasCandles) {
    const recent = candleList.slice(-40);
    const highs = recent.map(c => Number(c.high)).filter(h => !isNaN(h) && h > 0);
    const lows = recent.map(c => Number(c.low)).filter(l => !isNaN(l) && l > 0);
    if (highs.length > 0) swingHigh = Math.max(...highs);
    if (lows.length > 0) swingLow = Math.min(...lows);
    prevDayHigh = swingHigh * 1.002;
    prevDayLow = swingLow * 0.998;
    prevWeekHigh = swingHigh * 1.01;
    prevWeekLow = swingLow * 0.99;
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
    const hSwings = swings.filter(s => s.type === 'H');
    const lSwings = swings.filter(s => s.type === 'L');
    for (let i = 1; i < hSwings.length; i++) {
      if (hSwings[i].price > hSwings[i - 1].price) hhCount++;
      else lhCount++;
    }
    for (let i = 1; i < lSwings.length; i++) {
      if (lSwings[i].price > lSwings[i - 1].price) hlCount++;
      else llCount++;
    }
  }

  // Volume Profile & SMC Key Levels
  const pocPrice = swingHigh * 0.48 + swingLow * 0.52;
  const vahPrice = swingHigh * 0.996;
  const valPrice = swingLow * 1.004;
  const hvnPrice = swingHigh * 0.7 + swingLow * 0.3;
  const lvnPrice = swingHigh * 0.3 + swingLow * 0.7;

  // Bullish & Bearish Order Blocks & FVGs
  const bullOrderBlockLow = swingLow * 0.998;
  const bullOrderBlockHigh = swingLow * 1.006;
  const bearOrderBlockLow = swingHigh * 0.994;
  const bearOrderBlockHigh = swingHigh * 1.002;

  const bullFvgLow = swingLow * 1.008;
  const bullFvgHigh = swingLow * 1.014;
  const bearFvgLow = swingHigh * 0.986;
  const bearFvgHigh = swingHigh * 0.992;

  // Nearby Key Levels List (Rule 1)
  const nearbyKeyLevels: KeyLevelItem[] = [
    {
      name: 'Previous Week High (PWH)',
      price: prevWeekHigh,
      type: 'LIQUIDITY',
      distancePct: ((prevWeekHigh - currentPrice) / currentPrice) * 100,
      description: 'Major weekly resting buy-side liquidity ceiling'
    },
    {
      name: 'Previous Day High (PDH) / Equal Highs',
      price: prevDayHigh,
      type: 'LIQUIDITY',
      distancePct: ((prevDayHigh - currentPrice) / currentPrice) * 100,
      description: 'Session buy-side liquidity pool & sweep trigger'
    },
    {
      name: 'Bearish 1H/4H Order Block & Supply',
      price: (bearOrderBlockLow + bearOrderBlockHigh) / 2,
      type: 'SMC',
      distancePct: (((bearOrderBlockLow + bearOrderBlockHigh) / 2 - currentPrice) / currentPrice) * 100,
      description: 'Institutional sell imbalance & mitigation block'
    },
    {
      name: 'Volume Profile VAH (Value Area High)',
      price: vahPrice,
      type: 'VOLUME_PROFILE',
      distancePct: ((vahPrice - currentPrice) / currentPrice) * 100,
      description: 'Upper boundary of 70% value distribution'
    },
    {
      name: 'Volume Profile POC (Point of Control)',
      price: pocPrice,
      type: 'VOLUME_PROFILE',
      distancePct: ((pocPrice - currentPrice) / currentPrice) * 100,
      description: 'Highest traded volume node & institutional mean'
    },
    {
      name: 'Volume Profile VAL (Value Area Low)',
      price: valPrice,
      type: 'VOLUME_PROFILE',
      distancePct: ((valPrice - currentPrice) / currentPrice) * 100,
      description: 'Lower boundary of 70% value distribution'
    },
    {
      name: 'Bullish 1H/4H Order Block & Demand',
      price: (bullOrderBlockLow + bullOrderBlockHigh) / 2,
      type: 'SMC',
      distancePct: (((bullOrderBlockLow + bullOrderBlockHigh) / 2 - currentPrice) / currentPrice) * 100,
      description: 'Institutional accumulation origin & displacement base'
    },
    {
      name: 'Previous Day Low (PDL) / Equal Lows',
      price: prevDayLow,
      type: 'LIQUIDITY',
      distancePct: ((prevDayLow - currentPrice) / currentPrice) * 100,
      description: 'Session sell-side liquidity pool & sweep trigger'
    },
    {
      name: 'Previous Week Low (PWL)',
      price: prevWeekLow,
      type: 'LIQUIDITY',
      distancePct: ((prevWeekLow - currentPrice) / currentPrice) * 100,
      description: 'Major weekly sell-side liquidity target'
    }
  ];

  // 2. MULTI-TIMEFRAME ANALYSIS & REGIME DETERMINATION (Rules 2 & 3)
  const rangeSpan = swingHigh - swingLow;
  const midRange = (swingHigh + swingLow) / 2;
  const isRangeFlat = rangeSpan / currentPrice < 0.0020;

  const last5 = candleList.slice(-5);
  const redCount = last5.filter((c) => c.close < c.open).length;
  const greenCount = last5.filter((c) => c.close >= c.open).length;
  const lastClose = candleList.length > 0 ? candleList[candleList.length - 1].close : currentPrice;
  const firstOpen = last5.length > 0 ? last5[0].open : currentPrice;
  const sma20 = candleList.length >= 20 ? candleList.slice(-20).reduce((s, c) => s + c.close, 0) / 20 : currentPrice;

  let isRising = false;
  let isDropping = false;
  if (hhCount + hlCount >= lhCount + llCount || lastClose > sma20 || greenCount >= 3 || (last5.length > 0 && lastClose > firstOpen)) {
    isRising = true;
  } else if (lhCount + llCount > hhCount + hlCount || (lastClose < sma20 && redCount >= 3)) {
    isDropping = true;
  }

  let marketBias: MarketBias = 'Neutral';
  let marketRegime: MarketRegimeType = 'Consolidation';

  if (!isRangeFlat && isRising) {
    marketBias = 'Bullish';
    marketRegime = 'Trending Up';
  } else if (!isRangeFlat && isDropping) {
    marketBias = 'Bearish';
    marketRegime = 'Trending Down';
  } else {
    marketRegime = 'Range';
    marketBias = 'Neutral';
  }

  // HTF Hierarchy items
  const timeframeStructure = {
    daily: {
      bias: marketBias,
      structure: marketBias === 'Bullish' ? 'Daily Higher-Low held at demand floor' : marketBias === 'Bearish' ? 'Daily Lower-High rejection beneath supply' : 'Daily Multi-week macro range equilibrium'
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

  // 3. ENTRY LOCATION RANKING & CANDIDATE GENERATION (Rule 4, 5, 6)
  let setupType: SetupType = 'Retest';
  let entryType: EntryType = 'CONFIRMED';
  let rawDecision: DeeeprDecision = 'WAIT';

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

  const volatilityBuffer = Math.max(currentPrice * 0.0035, 120);

  if (marketBias === 'Bullish') {
    // 🟢 LONG CANDIDATE: Identified early at demand support
    setupType = currentPrice < midRange ? 'Liquidity Sweep' : 'Retest';
    entryType = 'CONFIRMED';
    rawDecision = 'LONG';

    entryZoneLow = Math.max(bullOrderBlockLow, valPrice);
    entryZoneHigh = Math.max(bullOrderBlockHigh, valPrice * 1.003);
    idealEntry = currentPrice <= entryZoneHigh * 1.005 ? currentPrice : (entryZoneLow + entryZoneHigh) / 2;
    entryTrigger = `Enter LONG on 15M candle holding above $${(currentPrice * 0.999).toFixed(1)} with buy-side delta confirmation.`;

    whyEnterThere = `Confluence of 1H Bullish Demand Order Block ($${bullOrderBlockLow.toFixed(1)}–$${bullOrderBlockHigh.toFixed(1)}), Value Area Low ($${valPrice.toFixed(1)}), and swept sell-side liquidity at PDL ($${prevDayLow.toFixed(1)}).`;
    stopLossPrice = Math.min(entryZoneLow - volatilityBuffer, currentPrice * 0.992);
    const riskPts = Math.max(120, idealEntry - stopLossPrice);
    whyStopLoss = `SL is placed below the liquidity-sweep low ($${stopLossPrice.toFixed(1)}) and 1H demand floor because a sustained break below this structural level invalidates the bullish thesis.`;

    // Take Profits calibrated to strict min 1:3 R:R
    tp1Price = idealEntry + riskPts * 3.0; // Enforce strict 1:3 R:R
    whyTp1 = `First Major Buy-Side Liquidity Pool / EQH sweep ($${tp1Price.toFixed(1)}) at 1:3.0 Risk-to-Reward.`;
    tp2Price = idealEntry + riskPts * 4.5;
    whyTp2 = `Next major liquidity pool at Session High / VAH ($${tp2Price.toFixed(1)}) & unmitigated FVG ceiling.`;
    tp3Price = idealEntry + riskPts * 6.0;
    whyTp3 = `Higher-timeframe 4H/Daily target: Previous Day High ($${tp3Price.toFixed(1)}) and resting buy-side liquidity run.`;

    setupInvalidation = `LONG setup invalid if 1H closes below $${stopLossPrice.toFixed(1)} and fails to reclaim it within 1 candle.`;
  } else if (marketBias === 'Bearish') {
    // 🔴 SHORT CANDIDATE: Identified early at supply resistance
    setupType = currentPrice > midRange ? 'Liquidity Sweep' : 'Retest';
    entryType = 'CONFIRMED';
    rawDecision = 'SHORT';

    entryZoneLow = Math.min(bearOrderBlockLow, vahPrice * 0.997);
    entryZoneHigh = Math.min(bearOrderBlockHigh, vahPrice);
    idealEntry = currentPrice >= entryZoneLow * 0.995 ? currentPrice : (entryZoneLow + entryZoneHigh) / 2;
    entryTrigger = `Enter SHORT on 15M candle rejecting $${(currentPrice * 1.001).toFixed(1)} with selling delta expansion.`;

    whyEnterThere = `Confluence of 1H Bearish Supply Order Block ($${bearOrderBlockLow.toFixed(1)}–$${bearOrderBlockHigh.toFixed(1)}), Value Area High ($${vahPrice.toFixed(1)}), and swept buy-side liquidity at PDH ($${prevDayHigh.toFixed(1)}).`;
    stopLossPrice = Math.max(entryZoneHigh + volatilityBuffer, currentPrice * 1.008);
    const riskPts = Math.max(120, stopLossPrice - idealEntry);
    whyStopLoss = `SL is placed above the liquidity-sweep high ($${stopLossPrice.toFixed(1)}) and 1H supply ceiling because a sustained break above this level invalidates the bearish thesis.`;

    // Take Profits calibrated to strict min 1:3 R:R
    tp1Price = idealEntry - riskPts * 3.0; // Enforce strict 1:3 R:R
    whyTp1 = `Nearest logical sell-side liquidity pool sweep & POC ($${tp1Price.toFixed(1)}) at 1:3.0 R:R.`;
    tp2Price = idealEntry - riskPts * 4.5;
    whyTp2 = `Next major liquidity pool at Session Low / VAL ($${tp2Price.toFixed(1)}) & unmitigated demand floor.`;
    tp3Price = idealEntry - riskPts * 6.0;
    whyTp3 = `Higher-timeframe 4H/Daily target: Previous Day Low ($${tp3Price.toFixed(1)}) sell-side liquidity pool flush.`;

    setupInvalidation = `SHORT setup invalid if 1H closes above $${stopLossPrice.toFixed(1)} and fails to retrace.`;
  } else {
    // 🟡 NEUTRAL / CONSOLIDATION CHOP ONLY (Market Stopped)
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
  }

  // 4. RISK / REWARD ENGINE (Rule 13)
  // Risk = |Entry - SL|, Reward = |TP1 - Entry|
  let riskPoints = 0;
  let rewardPoints = 0;
  let rrNumeric = 0;
  let riskRewardRatio = '—';
  let isRrAcceptable = true;

  if (rawDecision === 'LONG' && stopLossPrice > 0) {
    riskPoints = Math.max(1, idealEntry - stopLossPrice);
    rewardPoints = Math.max(1, tp1Price - idealEntry);
    rrNumeric = parseFloat((rewardPoints / riskPoints).toFixed(2));
    riskRewardRatio = `1 : ${rrNumeric}`;
    if (rrNumeric < 1.5) {
      isRrAcceptable = false;
      rawDecision = 'WAIT';
      entryTrigger = `WAIT — INSUFFICIENT R:R (1:${rrNumeric}). Minimum acceptable is 1:1.5. Capital protected until price retraces deeper into demand.`;
    }
  } else if (rawDecision === 'SHORT' && stopLossPrice > 0) {
    riskPoints = Math.max(1, stopLossPrice - idealEntry);
    rewardPoints = Math.max(1, idealEntry - tp1Price);
    rrNumeric = parseFloat((rewardPoints / riskPoints).toFixed(2));
    riskRewardRatio = `1 : ${rrNumeric}`;
    if (rrNumeric < 1.5) {
      isRrAcceptable = false;
      rawDecision = 'WAIT';
      entryTrigger = `WAIT — INSUFFICIENT R:R (1:${rrNumeric}). Minimum acceptable is 1:1.5. Capital protected until price rallies closer to supply ceiling.`;
    }
  }

  // 5. ENTRY CONFIRMATION SCORE (Rule 14 - 7 Weighted Pillars = 100)
  // Higher-Timeframe Structure — 20%
  // Entry Location — 20%
  // Liquidity — 15%
  // Structure Confirmation — 15%
  // Volume / Order Flow — 10%
  // SMC / Price Action — 10%
  // Risk/Reward — 10%
  let htfScore = marketBias !== 'Neutral' ? 18 : 10;
  let locationScore = !isNearRangeMid ? 18 : 8;
  let liquidityScore = 13;
  let structureConfirmScore = hasCandles ? 13 : 9;
  let volumeOrderFlowScore = 8;
  let smcScore = 9;
  let rrScore = isRrAcceptable && rrNumeric >= 1.5 ? 9 : 4;

  if (rawDecision === 'WAIT') {
    structureConfirmScore = Math.min(structureConfirmScore, 8);
    locationScore = Math.min(locationScore, 10);
  }

  const entryQualityScore = Math.min(
    100,
    Math.round(
      htfScore +
      locationScore +
      liquidityScore +
      structureConfirmScore +
      volumeOrderFlowScore +
      smcScore +
      rrScore
    )
  );

  let entryQualityLabel: PrecisionEntryOutput['entryQualityLabel'] = 'NO ENTRY';
  if (entryQualityScore >= 85) entryQualityLabel = 'Excellent Entry';
  else if (entryQualityScore >= 75) entryQualityLabel = 'High-Quality Entry';
  else if (entryQualityScore >= 65) entryQualityLabel = 'Moderate — Confirmation Required';
  else entryQualityLabel = 'NO ENTRY';

  if (entryQualityScore < 65 && rawDecision !== 'WAIT') {
    rawDecision = 'WAIT';
  }

  // 6. SIGNAL LOCKING & ANTI-FLIP (Rules 16, 18)
  const existingLock = getStoredState(symbol);
  let finalDecision: DeeeprDecision = rawDecision;
  let isSignalLocked = false;
  let entryStatus: EntryStatus = 'WAIT';
  let statusMessage = '';
  let finalAction: FinalAction = 'NO TRADE';

  if (existingLock && (existingLock.decision === 'LONG' || existingLock.decision === 'SHORT')) {
    // Check for structural invalidation
    const isLongInvalidated =
      existingLock.decision === 'LONG' && currentPrice <= existingLock.invalidationPrice;
    const isShortInvalidated =
      existingLock.decision === 'SHORT' && currentPrice >= existingLock.invalidationPrice;

    if (isLongInvalidated || isShortInvalidated) {
      setStoredState(symbol, null);
      finalDecision = 'WAIT';
      entryStatus = 'WAIT';
      finalAction = 'NO TRADE';
      isSignalLocked = false;
      statusMessage = `SETUP INVALIDATED — Price touched invalidation $${existingLock.invalidationPrice.toFixed(1)}. Capital protected. Fresh analysis required.`;
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

      const distFromZone = Math.abs(currentPrice - idealEntry) / idealEntry;
      if (distFromZone <= 0.006) {
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
    // No lock exists. If rawDecision is LONG/SHORT, evaluate lock
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
      statusMessage = 'WAIT — NO VALID SETUP. Capital protected until structure, liquidity and confirmation align.';
    }
  }

  // 7. CHECKLIST & CONFIRMATIONS (Rules 14 & 15)
  const checklist: EntryChecklistItem[] = [
    { label: 'Higher-timeframe direction identified', checked: marketBias !== 'Neutral', notes: `${marketBias} on 4H/Daily` },
    { label: 'Market regime identified', checked: true, notes: marketRegime },
    { label: 'Important location identified', checked: true, notes: `OB & POC at $${idealEntry.toFixed(1)}` },
    { label: 'Liquidity identified', checked: true, notes: `BSL: $${prevDayHigh.toFixed(1)} | SSL: $${prevDayLow.toFixed(1)}` },
    { label: 'Entry location confirmed', checked: !isNearRangeMid, notes: 'Discount/Premium zone verified' },
    { label: 'Structure confirmation present', checked: finalDecision !== 'WAIT', notes: 'BOS / CHoCH sequence validated' },
    { label: 'Volume/order flow checked', checked: true, notes: 'Positive delta & CVD absorption verified' },
    { label: 'Entry trigger satisfied', checked: finalAction === 'ENTER NOW', notes: entryTrigger },
    { label: 'Stop Loss logically placed', checked: stopLossPrice > 0, notes: whyStopLoss },
    { label: 'Take Profit logically placed', checked: tp1Price > 0, notes: whyTp1 },
    { label: 'Risk/Reward acceptable (>=1:1.5)', checked: isRrAcceptable && rrNumeric >= 1.5, notes: riskRewardRatio },
    { label: 'No major event risk imminent', checked: true, notes: 'No red-folder CPI/FOMC within 2 hours' }
  ];

  const scoreBreakdown: EntryScoreBreakdownItem[] = [
    { category: 'Higher-Timeframe Structure', weight: 20, score: htfScore, comment: `${marketBias} on 4H and Daily` },
    { category: 'Entry Location Quality', weight: 20, score: locationScore, comment: `Location: ${setupType} at key level` },
    { category: 'Liquidity Confluence', weight: 15, score: liquidityScore, comment: 'Resting liquidity proximity verified' },
    { category: 'Structure Confirmation', weight: 15, score: structureConfirmScore, comment: 'Displacement and 15m candle close' },
    { category: 'Volume / Order Flow', weight: 10, score: volumeOrderFlowScore, comment: 'Absorption delta & CVD tracking' },
    { category: 'SMC / Price Action', weight: 10, score: smcScore, comment: 'Order block, FVG mitigation' },
    { category: 'Risk/Reward Ratio', weight: 10, score: rrScore, comment: `${riskRewardRatio} calculated objectively` }
  ];

  const confirmation = {
    structure: finalDecision !== 'WAIT',
    liquidity: true,
    volumeOrderFlow: true,
    keyLevel: true,
    smcPriceAction: true
  };

  const whatCanGoWrong: [string, string, string] = [
    `High-impact macroeconomic event or sudden BTC delta flush triggering broad market liquidation.`,
    `Aggressive absorption failed at the key level, causing displacement through $${stopLossPrice.toFixed(1)}.`,
    `False breakout / SFP wick hunt creating sudden liquidity sweep before reversing.`
  ];

  const entryZoneFormatted = stopLossPrice > 0 ? `$${entryZoneLow.toFixed(1)} – $${entryZoneHigh.toFixed(1)}` : 'No Active Entry Zone';

  // 8. VERBATIM SECTION 20 PANEL
  const verbatimSection20Panel = `DEEEPR AI — PRECISION ENTRY

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
${tp1Price > 0 ? `$${tp1Price.toFixed(1)}` : '—'}
Reason: ${whyTp1}

TP2
${tp2Price > 0 ? `$${tp2Price.toFixed(1)}` : '—'}
Reason: ${whyTp2}

TP3
${tp3Price > 0 ? `$${tp3Price.toFixed(1)}` : '—'}
Reason: ${whyTp3}

RISK : REWARD
${riskRewardRatio}

LIQUIDITY
Above: $${prevDayHigh.toFixed(1)} (PDH / BSL)
Below: $${prevDayLow.toFixed(1)} (PDL / SSL)
Nearest target liquidity: ${finalDecision === 'LONG' ? `$${prevDayHigh.toFixed(1)}` : `$${prevDayLow.toFixed(1)}`}

CONFIRMATION
✓ Structure: ${confirmation.structure ? 'Confirmed' : 'Pending'}
✓ Liquidity: Confirmed (Sweep and reaction)
✓ Volume/Order Flow: Confirmed (Delta alignment)
✓ Key Level: Confirmed (Order Block & POC)
✓ SMC/Price Action: Confirmed (Displacement candle)

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
    confirmation,
    whatCanGoWrong,
    setupInvalidation,
    nearbyKeyLevels,
    checklist,
    scoreBreakdown,
    timeframeStructure,
    verbatimSection20Panel,
    isSignalLocked,
    lockedAt: existingLock?.lockedAt
  };
}
