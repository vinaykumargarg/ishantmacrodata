/**
 * DEEEPR MARKET PHASE CLASSIFIER (P1 – P9)
 *
 * Mathematical classification of market state based on closed candles,
 * ATR, ADX, EMA alignments, swing structure, and compression squeeze.
 *
 * Implements Section 4 & 5 of DEEEPR Enforcement Rules:
 * Phase determines the ALLOWED ACTION — eliminating false signals and "vague WAIT".
 */

export type MarketPhaseCode =
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'P5'
  | 'P6'
  | 'P7'
  | 'P8'
  | 'P9';

export type AllowedAction =
  | 'SHORT_ONLY'
  | 'LONG_ONLY'
  | 'PULLBACK_SHORT_WATCH'
  | 'PULLBACK_LONG_WATCH'
  | 'RANGE_EDGES_ONLY'
  | 'BREAKOUT_WATCH'
  | 'REVERSAL_A_PLUS'
  | 'EVENT_BLOCK'
  | 'WAIT_DATA';

export interface CandleLike {
  time?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PhaseMetrics {
  atr: number;
  atrPercentile: number;
  adx: number;
  ema20: number;
  ema50: number;
  rangeHigh: number;
  rangeLow: number;
  rangeSpanAtr: number;
  compressionRatio: number;
  upperWickAvg: number;
  lowerWickAvg: number;
  isSweepReclaim: boolean;
  sweepSide?: 'low' | 'high';
  chochConfirmed: boolean;
}

export interface MarketPhaseResult {
  code: MarketPhaseCode;
  name: string;
  label: string;
  description: string;
  allowedAction: AllowedAction;
  headlineActionText: string;
  isActionable: boolean;
  metrics: PhaseMetrics;
  ruleReference: string;
}

// Asset-specific ATR multipliers and settings
const ASSET_CONFIGS: Record<
  string,
  {
    atrPeriod: number;
    rangeAtrThreshold: number;
    compressionThreshold: number;
    minRrScalp: number;
    minRrSwing: number;
  }
> = {
  BTCUSDT: { atrPeriod: 14, rangeAtrThreshold: 2.5, compressionThreshold: 0.012, minRrScalp: 1.5, minRrSwing: 2.0 },
  ETHUSDT: { atrPeriod: 14, rangeAtrThreshold: 2.5, compressionThreshold: 0.014, minRrScalp: 1.5, minRrSwing: 2.0 },
  SOLUSDT: { atrPeriod: 14, rangeAtrThreshold: 2.8, compressionThreshold: 0.018, minRrScalp: 1.5, minRrSwing: 2.0 },
  PAXGUSDT: { atrPeriod: 14, rangeAtrThreshold: 2.2, compressionThreshold: 0.008, minRrScalp: 1.4, minRrSwing: 1.8 },
  SLVUSDT: { atrPeriod: 14, rangeAtrThreshold: 2.2, compressionThreshold: 0.010, minRrScalp: 1.4, minRrSwing: 1.8 }
};

export function calculateAtr(candles: CandleLike[], period = 14): number {
  if (candles.length < 2) return 1;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
}

export function calculateEma(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateAdx(candles: CandleLike[], period = 14): number {
  if (candles.length < period * 2) return 22;
  let plusDmSum = 0;
  let minusDmSum = 0;
  let trSum = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trSum += tr;
    if (upMove > downMove && upMove > 0) plusDmSum += upMove;
    if (downMove > upMove && downMove > 0) minusDmSum += downMove;
  }

  if (trSum === 0) return 20;
  const plusDi = (plusDmSum / trSum) * 100;
  const minusDi = (minusDmSum / trSum) * 100;
  const dx = Math.abs(plusDi - minusDi) / ((plusDi + minusDi) || 1) * 100;
  return +dx.toFixed(1);
}

/**
 * Classifies market state into P1–P9.
 */
export function classifyMarketPhase(
  candles: CandleLike[],
  price: number,
  options?: {
    symbol?: string;
    isEventWindow?: boolean;
    isMarketClosed?: boolean;
    htfBias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  }
): MarketPhaseResult {
  const symbol = options?.symbol || 'BTCUSDT';
  const cfg = ASSET_CONFIGS[symbol] || ASSET_CONFIGS.BTCUSDT;

  // P8 Check: Event Window
  if (options?.isEventWindow) {
    return {
      code: 'P8',
      name: 'EVENT_WINDOW',
      label: 'High-Impact Event Window',
      description: 'High-impact macroeconomic or policy announcement active within ±30 minutes. Capital protection gate active.',
      allowedAction: 'EVENT_BLOCK',
      headlineActionText: 'WAIT — EVENT BLACKOUT WINDOW (Manage open positions, no new orders)',
      isActionable: false,
      metrics: {
        atr: 0,
        atrPercentile: 50,
        adx: 0,
        ema20: price,
        ema50: price,
        rangeHigh: price,
        rangeLow: price,
        rangeSpanAtr: 0,
        compressionRatio: 0,
        upperWickAvg: 0,
        lowerWickAvg: 0,
        isSweepReclaim: false,
        chochConfirmed: false
      },
      ruleReference: 'Section 4 (P8) & Section 10 Event Blackout'
    };
  }

  // P9 Check: Stale Data or Market Closed
  if (options?.isMarketClosed || !candles || candles.length < 15 || price <= 0) {
    return {
      code: 'P9',
      name: 'MARKET_CLOSED_STALE',
      label: 'Market Closed / Stale Data',
      description: 'Session closed or live tick feed disconnected. Never generate LONG/SHORT triggers on unverified data.',
      allowedAction: 'WAIT_DATA',
      headlineActionText: 'WAIT_DATA — Live market feed closed or unverified',
      isActionable: false,
      metrics: {
        atr: 0,
        atrPercentile: 0,
        adx: 0,
        ema20: price,
        ema50: price,
        rangeHigh: price,
        rangeLow: price,
        rangeSpanAtr: 0,
        compressionRatio: 0,
        upperWickAvg: 0,
        lowerWickAvg: 0,
        isSweepReclaim: false,
        chochConfirmed: false
      },
      ruleReference: 'Section 4 (P9) & Data Hygiene R7–R9'
    };
  }

  const atr = calculateAtr(candles, cfg.atrPeriod);
  const adx = calculateAdx(candles, 14);
  const closes = candles.map((c) => c.close);
  const ema20 = calculateEma(closes, 20);
  const ema50 = calculateEma(closes, 50);

  // Look back 25 candles for swing range & structure
  const recent = candles.slice(-25);
  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);
  const rangeHigh = Math.max(...highs);
  const rangeLow = Math.min(...lows);
  const rangeSpanAtr = (rangeHigh - rangeLow) / (atr || 1);

  // Volatility / Compression Bandwidth
  const bbWidth = (rangeHigh - rangeLow) / (price || 1);
  const compressionRatio = bbWidth;

  // Wick calculations
  let upperWickSum = 0;
  let lowerWickSum = 0;
  for (const c of recent.slice(-5)) {
    const bodyTop = Math.max(c.open, c.close);
    const bodyBottom = Math.min(c.open, c.close);
    upperWickSum += (c.high - bodyTop);
    lowerWickSum += (bodyBottom - c.low);
  }
  const upperWickAvg = upperWickSum / 5;
  const lowerWickAvg = lowerWickSum / 5;

  // Sweep and Reclaim Check (last 4 candles)
  let isSweepReclaim = false;
  let sweepSide: 'low' | 'high' | undefined;
  let chochConfirmed = false;

  const priorLows = candles.slice(-40, -5).map((c) => c.low);
  const priorHighs = candles.slice(-40, -5).map((c) => c.high);
  const keySwingLow = priorLows.length > 0 ? Math.min(...priorLows) : rangeLow;
  const keySwingHigh = priorHighs.length > 0 ? Math.max(...priorHighs) : rangeHigh;

  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  // Bullish sweep-reclaim: swept key low, closed back inside
  if (
    (lastCandle.low < keySwingLow && lastCandle.close > keySwingLow) ||
    (prevCandle.low < keySwingLow && lastCandle.close > keySwingLow && lastCandle.close > lastCandle.open)
  ) {
    isSweepReclaim = true;
    sweepSide = 'low';
    if (lastCandle.close > ema20 || lastCandle.close > prevCandle.high) {
      chochConfirmed = true;
    }
  }

  // Bearish sweep-reclaim: swept key high, rejected back below
  if (
    (lastCandle.high > keySwingHigh && lastCandle.close < keySwingHigh) ||
    (prevCandle.high > keySwingHigh && lastCandle.close < keySwingHigh && lastCandle.close < lastCandle.open)
  ) {
    isSweepReclaim = true;
    sweepSide = 'high';
    if (lastCandle.close < ema20 || lastCandle.close < prevCandle.low) {
      chochConfirmed = true;
    }
  }

  // HTF Bias direction
  const htfBias = options?.htfBias || (ema20 < ema50 && price < ema50 ? 'BEARISH' : ema20 > ema50 && price > ema50 ? 'BULLISH' : 'NEUTRAL');

  const metrics: PhaseMetrics = {
    atr,
    atrPercentile: adx > 25 ? 65 : 25,
    adx,
    ema20,
    ema50,
    rangeHigh,
    rangeLow,
    rangeSpanAtr,
    compressionRatio,
    upperWickAvg,
    lowerWickAvg,
    isSweepReclaim,
    sweepSide,
    chochConfirmed
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EVALUATION PRIORITY (P7 -> P6 -> P3/P4 -> P1/P2 -> P5)
  // ─────────────────────────────────────────────────────────────────────────

  // P7: REVERSAL_SETUP (Sweep + Reclaim + CHoCH on closed candles)
  if (isSweepReclaim && chochConfirmed) {
    const isBullReversal = sweepSide === 'low';
    return {
      code: 'P7',
      name: 'REVERSAL_SETUP',
      label: 'V-Reversal / Sweep-Reclaim Setup',
      description: isBullReversal
        ? `Sell-side liquidity swept below $${keySwingLow.toFixed(1)}, closed back above level with bullish CHoCH displacement.`
        : `Buy-side liquidity swept above $${keySwingHigh.toFixed(1)}, rejected with bearish CHoCH displacement.`,
      allowedAction: 'REVERSAL_A_PLUS',
      headlineActionText: isBullReversal
        ? 'CONFIRMED LONG (Counter-Trend A+ Reversal) — Target opposing liquidity pool'
        : 'CONFIRMED SHORT (Counter-Trend A+ Reversal) — Target opposing liquidity pool',
      isActionable: true,
      metrics,
      ruleReference: 'Section 4 (P7) & Setup S1/S6 Sweep & Reclaim'
    };
  }

  // P6: COMPRESSION SQUEEZE (Volatility contracted, breakout pending)
  if (compressionRatio < cfg.compressionThreshold || (rangeSpanAtr < 1.8 && adx < 18)) {
    return {
      code: 'P6',
      name: 'COMPRESSION',
      label: 'Volatility Compression Squeeze',
      description: `Narrow range compression (Bandwidth: ${(compressionRatio * 100).toFixed(2)}%, ADX: ${adx}). Institutional stop-orders clustering at edges.`,
      allowedAction: 'BREAKOUT_WATCH',
      headlineActionText: `WATCH BOTH SIDES — Wait for 15m breakout close above $${rangeHigh.toFixed(1)} or breakdown below $${rangeLow.toFixed(1)}`,
      isActionable: false,
      metrics,
      ruleReference: 'Section 4 (P6) & Section 5 Compression Rules'
    };
  }

  // P3: BOUNCE_IN_DOWNTREND (HTF Bearish, but LTF rallying on relief bounce)
  if (htfBias === 'BEARISH' && price > ema20 && lastCandle.close > candles[Math.max(0, candles.length - 4)].close) {
    const pullbackTarget = +(ema50 + 0.2 * atr).toFixed(1);
    return {
      code: 'P3',
      name: 'BOUNCE_IN_DOWNTREND',
      label: 'Relief Bounce in Downtrend',
      description: `Higher timeframe is bearish, but market is undergoing a relief bounce. Do not chase shorts at the bottom. Prepare to sell the pullback into supply ($${pullbackTarget}).`,
      allowedAction: 'PULLBACK_SHORT_WATCH',
      headlineActionText: `WATCH SHORT — Sell on pullback into supply ceiling ($${pullbackTarget}) on rejection`,
      isActionable: true,
      metrics,
      ruleReference: 'Section 4 (P3) & Section 5 Bounce-in-Downtrend Rules'
    };
  }

  // P4: PULLBACK_IN_UPTREND (HTF Bullish, but LTF dipping on healthy retrace)
  if (htfBias === 'BULLISH' && price < ema20 && lastCandle.close < candles[Math.max(0, candles.length - 4)].close) {
    const pullbackTarget = +(ema50 - 0.2 * atr).toFixed(1);
    return {
      code: 'P4',
      name: 'PULLBACK_IN_UPTREND',
      label: 'Healthy Pullback in Uptrend',
      description: `Higher timeframe is bullish, but market is pulling back into discount. Prepare to buy demand dip ($${pullbackTarget}).`,
      allowedAction: 'PULLBACK_LONG_WATCH',
      headlineActionText: `WATCH LONG — Buy on dip into demand floor ($${pullbackTarget}) on absorption`,
      isActionable: true,
      metrics,
      ruleReference: 'Section 4 (P4) & Section 5 Pullback-in-Uptrend Rules'
    };
  }

  // P1: TREND_DOWN_IMPULSE (Strong momentum selling, price < EMA20/50, ADX expanding)
  if (htfBias === 'BEARISH' && price <= ema20 && ema20 < ema50 && adx >= 20) {
    return {
      code: 'P1',
      name: 'TREND_DOWN_IMPULSE',
      label: 'Bearish Trend Impulse',
      description: `Consistent Lower Highs / Lower Lows with downward displacement. ADX (${adx}) confirms momentum expansion. Sell-side active.`,
      allowedAction: 'SHORT_ONLY',
      headlineActionText: 'ACTIVE SHORT — Sell breakdown / rejection of local supply',
      isActionable: true,
      metrics,
      ruleReference: 'Section 4 (P1) & Section 5 Trend Down Rules'
    };
  }

  // P2: TREND_UP_IMPULSE (Strong momentum buying, price > EMA20/50, ADX expanding)
  if (htfBias === 'BULLISH' && price >= ema20 && ema20 > ema50 && adx >= 20) {
    return {
      code: 'P2',
      name: 'TREND_UP_IMPULSE',
      label: 'Bullish Trend Impulse',
      description: `Consistent Higher Highs / Higher Lows with upward displacement. ADX (${adx}) confirms buying expansion. Buy-side active.`,
      allowedAction: 'LONG_ONLY',
      headlineActionText: 'ACTIVE LONG — Buy retest / continuation of local demand',
      isActionable: true,
      metrics,
      ruleReference: 'Section 4 (P2) & Section 5 Trend Up Rules'
    };
  }

  // P5: RANGE / CHOP (Equilibrium oscillation, ADX low, bounded)
  const rangeMid = (rangeHigh + rangeLow) / 2;
  const distFromMid = Math.abs(price - rangeMid) / (rangeHigh - rangeLow || 1);
  const isMidRange = distFromMid < 0.25;

  return {
    code: 'P5',
    name: 'RANGE_CHOP',
    label: 'Range Equilibrium / Chop',
    description: `Market oscillating between range boundaries ($${rangeLow.toFixed(1)} – $${rangeHigh.toFixed(1)}). ADX is calm (${adx}).`,
    allowedAction: 'RANGE_EDGES_ONLY',
    headlineActionText: isMidRange
      ? `WAIT — PRICE AT RANGE MIDPOINT ($${price.toFixed(1)}). Trade only at boundary edges ($${rangeLow.toFixed(1)} / $${rangeHigh.toFixed(1)})`
      : price > rangeMid
      ? `WATCH SHORT — Upper range edge reached ($${rangeHigh.toFixed(1)}). Short only on confirmed rejection`
      : `WATCH LONG — Lower range edge reached ($${rangeLow.toFixed(1)}). Long only on confirmed sweep-reclaim`,
    isActionable: !isMidRange,
    metrics,
    ruleReference: 'Section 4 (P5) & Mid-Range Filter R14'
  };
}
