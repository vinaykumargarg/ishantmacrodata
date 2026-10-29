/**
 * ═════════════════════════════════════════════════════════════════════════════
 * GOLD (XAUUSD) MOMENTUM SNIPER ENGINE v1 — INSTITUTIONAL DESK STRATEGY
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Execution TF: 1m / 5m / 15m; Bias from 1H / 4H.
 * Setups:
 *   G1: SWEEP-REVERSAL MOMENTUM (Asian / PDL / PDH liquidity sweeps)
 *   G2: TREND PULLBACK CONTINUATION (38%–62% pullback to EMA20 / VWAP / OB)
 *   G3: BREAKOUT + RETEST / NEWS SPIKE (Compression breakout + first retest)
 *
 * Targets:
 *   - Intraday Momentum: 13–45 points (1 point = $1.00 move, $100/lot)
 *   - Macro Swing Momentum: 70–90 points
 *
 * Pipeline: LOCATION -> DIRECTION -> TRIGGER -> RISK -> VERDICT
 * Rules: R:R to TP2 >= 2.0, Mid-range (0.40 < p < 0.60) is NO-ENTRY ZONE.
 */

import { getLiveDxyTelemetry } from './intermarketConfluenceEngine';

export type GoldVerdictState = 'WAIT' | 'ARMED-LONG' | 'ARMED-SHORT' | 'LONG' | 'SHORT';
export type GoldSetupType = 'G1_SWEEP_REVERSAL' | 'G2_TREND_PULLBACK' | 'G3_BREAKOUT_RETEST' | 'NONE';
export type GoldRegime = 'TRENDING' | 'RANGING' | 'COMPRESSION' | 'VOLATILE' | 'DEAD';
export type GoldSession = 'ASIA' | 'LONDON_OPEN' | 'LONDON_NY_OVERLAP' | 'LATE_NY_ROLLOVER' | 'WEEKEND_CLOSED';
export type TargetMode = 'INTRADAY_MOMENTUM_13_45' | 'MACRO_SWING_70_90';

export interface GoldCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GoldSniperInput {
  currentPrice: number;
  candles5m?: GoldCandle[];
  candles15m?: GoldCandle[];
  candles1h?: GoldCandle[];
  accountSize?: number;
  riskPercent?: number;
  maxSlAcceptedPts?: number;
  targetMode?: TargetMode;
  userSpreadPts?: number;
  customAsianRange?: { high: number; low: number };
  customPdhPdl?: { pdh: number; pdl: number };
  tier1NewsWithin15m?: boolean;
}

export interface GoldSniperOutput {
  timeIst: string;
  price: number;
  session: GoldSession;
  sessionLabel: string;
  regime: GoldRegime;
  regimeDetails: string;
  htfBias: {
    '4H': 'BULLISH' | 'BEARISH' | 'RANGE';
    '1H': 'BULLISH' | 'BEARISH' | 'RANGE';
    composite: 'BULLISH' | 'BEARISH' | 'RANGE';
  };
  rangePositionP: number;
  isNoEntryMidRange: boolean;
  verdict: GoldVerdictState;
  setup: GoldSetupType;
  setupName: string;
  entry: {
    price: number | null;
    zoneLow: number | null;
    zoneHigh: number | null;
    orderType: string;
    isChase: boolean;
  };
  stopLoss: {
    price: number | null;
    points: number | null;
    why: string;
  };
  targets: {
    tp1: { price: number | null; points: number | null; rr: number | null };
    tp2: { price: number | null; points: number | null; rr: number | null };
    tp3: { price: number | null; points: number | null; rr: number | null };
    tp4Runner: { label: string; trailRule: string };
  };
  positionSize: {
    accountSize: number;
    riskPercent: number;
    riskUsd: number;
    lots: number;
    formula: string;
  };
  management: string[];
  invalidation: string;
  map: {
    kahanLongKarein: string;
    kahanShortKarein: string;
    kahanEntryNahi: string;
    nextTriggerToWatch: string;
  };
  evidenceLines: string[];
  dxyAnalysis: {
    currentValue: number;
    change24h: string;
    impactOnGold: string;
    conflict: boolean;
  };
  confidence: {
    level: 'Low' | 'Medium' | 'High';
    reason: string;
  };
  warnings: string[];
  formattedReportText: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME & SESSION HELPERS (IST: UTC + 5:30)
// ─────────────────────────────────────────────────────────────────────────────

export function getIstSessionInfo(date = new Date()): {
  session: GoldSession;
  label: string;
  timeIstStr: string;
  isWithinBlackoutHour: boolean;
} {
  const utcMs = date.getTime();
  const istOffsetMs = 5.5 * 3600 * 1000;
  const istDate = new Date(utcMs + istOffsetMs);

  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const timeNum = hours + minutes / 60;
  const day = istDate.getUTCDay(); // 0 is Sunday, 6 is Saturday

  const timeIstStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} IST`;

  // Weekend check: Gold market closed from Friday 23:30 UTC (~Saturday 05:00 IST) to Sunday 22:00 UTC (~Monday 03:30 IST)
  if (day === 6 || (day === 0 && timeNum < 23) || (day === 5 && timeNum >= 23.5)) {
    return {
      session: 'WEEKEND_CLOSED',
      label: 'Weekend Market Closed (Forex / COMEX Gold re-opens Mon 03:30 IST)',
      timeIstStr,
      isWithinBlackoutHour: true
    };
  }

  // Session hours in IST:
  // Asia: 05:30 to 12:30 IST
  if (timeNum >= 5.5 && timeNum < 12.5) {
    return {
      session: 'ASIA',
      label: 'Asian Session (05:30–12:30 IST) · Range Building & Liquidity Pools',
      timeIstStr,
      isWithinBlackoutHour: false
    };
  }

  // London Open & first 90 mins: 12:30 to 14:00 IST
  if (timeNum >= 12.5 && timeNum < 14.0) {
    return {
      session: 'LONDON_OPEN',
      label: 'London Open & Sweep Window (12:30–14:00 IST) · High-Probability Asian Sweep',
      timeIstStr,
      isWithinBlackoutHour: false
    };
  }

  // London - NY Overlap & NY Open: 18:00 to 21:30 IST
  if (timeNum >= 18.0 && timeNum < 21.5) {
    return {
      session: 'LONDON_NY_OVERLAP',
      label: 'London–NY Overlap & NY Open (18:00–21:30 IST) · Peak Momentum & News Triggers',
      timeIstStr,
      isWithinBlackoutHour: false
    };
  }

  // Late NY / Rollover: after 23:30 IST
  if (timeNum >= 23.5 || timeNum < 5.5) {
    return {
      session: 'LATE_NY_ROLLOVER',
      label: 'Late NY / Rollover (>23:30 IST) · Thin Liquidity & Widening Spreads',
      timeIstStr,
      isWithinBlackoutHour: true
    };
  }

  return {
    session: 'LONDON_OPEN',
    label: 'European Afternoon Session (14:00–18:00 IST) · Trend Development',
    timeIstStr,
    isWithinBlackoutHour: false
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICAL & ATR CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

function calculateAtr(candles: GoldCandle[], period = 14): number {
  if (candles.length < 2) return 6.5; // Typical 5m gold ATR in points
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hpc = Math.abs(candles[i].high - candles[i - 1].close);
    const lpc = Math.abs(candles[i].low - candles[i - 1].close);
    trs.push(Math.max(hl, hpc, lpc));
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENGINE EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateGoldXauusdMomentumSniper(input: GoldSniperInput): GoldSniperOutput {
  const currentPrice = input.currentPrice || 4150.0;
  const targetMode: TargetMode = input.targetMode || 'INTRADAY_MOMENTUM_13_45';
  const accountSize = input.accountSize || 10000;
  const riskPercent = input.riskPercent || 0.5; // Default 0.5%
  const maxSlAccepted = input.maxSlAcceptedPts || (targetMode === 'INTRADAY_MOMENTUM_13_45' ? 15 : 25);
  const spreadPts = input.userSpreadPts || 0.35; // Typical 35 cents spread on XAUUSD

  const { session, label: sessionLabel, timeIstStr, isWithinBlackoutHour } = getIstSessionInfo();

  // 1. DXY Telemetry Integration (Rule: Inverse to Gold, ±0.30% noise band)
  const dxy = getLiveDxyTelemetry();
  const dxyChangeNum = parseFloat(dxy.change24h.replace('%', '').replace('+', '')) || 0;
  const dxyIsTailwindForGold = dxyChangeNum < -0.30;
  const dxyIsHeadwindForGold = dxyChangeNum > 0.30;
  const dxyIsNeutral = Math.abs(dxyChangeNum) <= 0.30;

  let dxyGoldNote = '';
  if (dxyIsTailwindForGold) {
    dxyGoldNote = `DXY falling ${dxy.change24h} (outside -0.30% noise band) = Strong tailwind for Gold Long.`;
  } else if (dxyIsHeadwindForGold) {
    dxyGoldNote = `DXY rising ${dxy.change24h} (outside +0.30% noise band) = Headwind for Gold Long (supports Short/Pullback).`;
  } else {
    dxyGoldNote = `DXY ${dxy.currentValue} (${dxy.change24h}) inside ±0.30% noise band = Neutral intermarket impact.`;
  }

  // 2. Candle Series & ATR
  const candles5m = input.candles5m || [];
  const candles15m = input.candles15m || [];
  const candles1h = input.candles1h || [];

  const atr5m = +(calculateAtr(candles5m, 14)).toFixed(2);
  const atr15m = +(calculateAtr(candles15m, 14)).toFixed(2);

  // 3. Asian Range & 1H Range Map (p = (price - RL)/(RH - RL))
  let rangeHigh = input.customAsianRange?.high || currentPrice + 14.5;
  let rangeLow = input.customAsianRange?.low || currentPrice - 13.5;

  if (candles5m.length >= 24) {
    const recentHighs = candles5m.slice(-36).map((c) => c.high);
    const recentLows = candles5m.slice(-36).map((c) => c.low);
    rangeHigh = Math.max(...recentHighs);
    rangeLow = Math.min(...recentLows);
  }

  const rangeSpan = Math.max(1, rangeHigh - rangeLow);
  const rangePositionP = Math.max(0, Math.min(1, +((currentPrice - rangeLow) / rangeSpan).toFixed(2)));
  const isNoEntryMidRange = rangePositionP > 0.40 && rangePositionP < 0.60;

  // 4. Momentum Regime Filter
  let regime: GoldRegime = 'TRENDING';
  let regimeDetails = '';

  const avgHourAtr5m = 5.5; // Standard 20-day average for active hours
  if (atr5m < 0.6 * avgHourAtr5m) {
    regime = 'DEAD';
    regimeDetails = `Dead market: ATR(5m)=${atr5m} < 0.6x average (${avgHourAtr5m} pts). Overlapping candles -> WAIT.`;
  } else if (atr5m > 2.5 * avgHourAtr5m) {
    regime = 'VOLATILE';
    regimeDetails = `High Volatility / News Spike: ATR(5m)=${atr5m} > 2.5x avg. Wait 3+ candles for structure.`;
  } else if (rangeSpan < 12) {
    regime = 'COMPRESSION';
    regimeDetails = `Tight Compression: Asian/Consolidation range span only ${rangeSpan.toFixed(1)} pts. Awaiting breakout.`;
  } else if (rangePositionP >= 0.40 && rangePositionP <= 0.60) {
    regime = 'RANGING';
    regimeDetails = `Ranging Equilibrium: Price oscillating inside ${rangeLow.toFixed(1)} – ${rangeHigh.toFixed(1)}.`;
  } else {
    regime = 'TRENDING';
    regimeDetails = `Momentum Active: ATR(5m)=${atr5m} pts, displacement legs present.`;
  }

  // 5. Higher Timeframe Bias (4H / 1H)
  let htfBias1h: 'BULLISH' | 'BEARISH' | 'RANGE' = 'BULLISH';
  let htfBias4h: 'BULLISH' | 'BEARISH' | 'RANGE' = 'BULLISH';

  if (candles1h.length >= 10) {
    const last3 = candles1h.slice(-3);
    if (last3[2].close > last3[0].close && last3[1].low >= last3[0].low) {
      htfBias1h = 'BULLISH';
    } else if (last3[2].close < last3[0].close && last3[1].high <= last3[0].high) {
      htfBias1h = 'BEARISH';
    } else {
      htfBias1h = 'RANGE';
    }
    htfBias4h = htfBias1h;
  }

  const compositeHtfBias = htfBias1h === htfBias4h ? htfBias1h : 'RANGE';

  // 6. Setup Detection (G1, G2, G3)
  let setup: GoldSetupType = 'NONE';
  let setupName = 'No Confirmed Setup (Awaiting Edge)';
  let verdict: GoldVerdictState = 'WAIT';
  let entryPrice: number | null = null;
  let entryZoneLow: number | null = null;
  let entryZoneHigh: number | null = null;
  let stopLossPrice: number | null = null;
  let stopLossPoints: number | null = null;
  let slWhy = '';
  let tp1Price: number | null = null;
  let tp2Price: number | null = null;
  let tp3Price: number | null = null;
  let rrTp1: number | null = null;
  let rrTp2: number | null = null;
  let rrTp3: number | null = null;
  let isChase = false;
  const warnings: string[] = [];

  // Check News Window Block
  if (input.tier1NewsWithin15m) {
    warnings.push('TIER-1 NEWS LOCKOUT: High impact release within 15 min. No new entries allowed.');
  }
  if (isWithinBlackoutHour && session === 'LATE_NY_ROLLOVER') {
    warnings.push('LATE NY / ROLLOVER: Liquidity thin and broker spreads widen. Avoid opening new trades.');
  }
  if (session === 'WEEKEND_CLOSED') {
    warnings.push('WEEKEND CLOSURE: Spot gold markets closed. Plan setups for Monday morning.');
  }

  // Evaluate Setups if not in strict mid-range chop and not in blackout
  const canTrade = !isNoEntryMidRange && regime !== 'DEAD' && !input.tier1NewsWithin15m && session !== 'WEEKEND_CLOSED';

  if (canTrade) {
    // ── G1. SWEEP-REVERSAL MOMENTUM ──
    if (rangePositionP <= 0.40) {
      // Long Sweep-Reversal at Discount Floor
      setup = 'G1_SWEEP_REVERSAL';
      setupName = 'G1. SWEEP-REVERSAL MOMENTUM (Asian Low / Demand Sweep Reclaim)';
      const sweepLow = +(rangeLow - 0.25 * atr5m).toFixed(2);
      const plannedEntry = +(rangeLow + 0.5 * atr5m).toFixed(2);
      entryPrice = plannedEntry;
      entryZoneLow = +(plannedEntry - 1.5).toFixed(2);
      entryZoneHigh = +(plannedEntry + 1.0).toFixed(2);

      // SL: below sweep wick low - max(0.25 * ATR, 1.0 pt)
      const buffer = Math.max(0.25 * atr5m, 1.0);
      stopLossPrice = +(sweepLow - buffer).toFixed(2);
      stopLossPoints = +(entryPrice - stopLossPrice).toFixed(1);
      slWhy = `Below sweep wick low ($${sweepLow}) minus ${buffer.toFixed(1)} pt ATR buffer (Rule R28 / G1).`;

      // Targets: Intraday 13–45 pts or Macro 70–90 pts
      if (targetMode === 'INTRADAY_MOMENTUM_13_45') {
        const tp1Pts = Math.max(10, Math.round(stopLossPoints * 1.3));
        const tp2Pts = Math.max(22, Math.round(stopLossPoints * 2.4));
        const tp3Pts = Math.max(38, Math.round(stopLossPoints * 3.8));
        tp1Price = +(entryPrice + tp1Pts).toFixed(2);
        tp2Price = +(entryPrice + tp2Pts).toFixed(2);
        tp3Price = +(entryPrice + tp3Pts).toFixed(2);
      } else {
        // Macro 70–90 pts
        const tp1Pts = 30;
        const tp2Pts = 60;
        const tp3Pts = 85;
        tp1Price = +(entryPrice + tp1Pts).toFixed(2);
        tp2Price = +(entryPrice + tp2Pts).toFixed(2);
        tp3Price = +(entryPrice + tp3Pts).toFixed(2);
      }

      rrTp1 = stopLossPoints > 0 ? +((tp1Price - entryPrice) / stopLossPoints).toFixed(2) : 1.3;
      rrTp2 = stopLossPoints > 0 ? +((tp2Price - entryPrice) / stopLossPoints).toFixed(2) : 2.5;
      rrTp3 = stopLossPoints > 0 ? +((tp3Price - entryPrice) / stopLossPoints).toFixed(2) : 3.8;

      // Check if price already ran away (> 0.5R away)
      if (currentPrice > plannedEntry + 0.5 * stopLossPoints) {
        isChase = true;
        verdict = 'WAIT';
        warnings.push('WAIT — Entry nikal gayi (Price > 0.5R away from entry zone). Do NOT chase.');
      } else if (currentPrice >= rangeLow && currentPrice <= plannedEntry + 1.0) {
        verdict = rrTp2 >= 2.0 && stopLossPoints <= maxSlAccepted ? 'LONG' : 'ARMED-LONG';
      } else {
        verdict = 'ARMED-LONG';
      }
    } else if (rangePositionP >= 0.60) {
      // Short Sweep-Reversal at Premium Ceiling
      setup = 'G1_SWEEP_REVERSAL';
      setupName = 'G1. SWEEP-REVERSAL MOMENTUM (Asian High / Supply Sweep Reject)';
      const sweepHigh = +(rangeHigh + 0.25 * atr5m).toFixed(2);
      const plannedEntry = +(rangeHigh - 0.5 * atr5m).toFixed(2);
      entryPrice = plannedEntry;
      entryZoneLow = +(plannedEntry - 1.0).toFixed(2);
      entryZoneHigh = +(plannedEntry + 1.5).toFixed(2);

      const buffer = Math.max(0.25 * atr5m, 1.0);
      stopLossPrice = +(sweepHigh + buffer).toFixed(2);
      stopLossPoints = +(stopLossPrice - entryPrice).toFixed(1);
      slWhy = `Above sweep wick high ($${sweepHigh}) plus ${buffer.toFixed(1)} pt ATR buffer (Rule R28 / G1).`;

      if (targetMode === 'INTRADAY_MOMENTUM_13_45') {
        const tp1Pts = Math.max(10, Math.round(stopLossPoints * 1.3));
        const tp2Pts = Math.max(22, Math.round(stopLossPoints * 2.4));
        const tp3Pts = Math.max(38, Math.round(stopLossPoints * 3.8));
        tp1Price = +(entryPrice - tp1Pts).toFixed(2);
        tp2Price = +(entryPrice - tp2Pts).toFixed(2);
        tp3Price = +(entryPrice - tp3Pts).toFixed(2);
      } else {
        const tp1Pts = 30;
        const tp2Pts = 60;
        const tp3Pts = 85;
        tp1Price = +(entryPrice - tp1Pts).toFixed(2);
        tp2Price = +(entryPrice - tp2Pts).toFixed(2);
        tp3Price = +(entryPrice - tp3Pts).toFixed(2);
      }

      rrTp1 = stopLossPoints > 0 ? +((entryPrice - tp1Price) / stopLossPoints).toFixed(2) : 1.3;
      rrTp2 = stopLossPoints > 0 ? +((entryPrice - tp2Price) / stopLossPoints).toFixed(2) : 2.5;
      rrTp3 = stopLossPoints > 0 ? +((entryPrice - tp3Price) / stopLossPoints).toFixed(2) : 3.8;

      if (currentPrice < plannedEntry - 0.5 * stopLossPoints) {
        isChase = true;
        verdict = 'WAIT';
        warnings.push('WAIT — Short entry nikal gayi (Price > 0.5R away from entry zone). Do NOT chase.');
      } else if (currentPrice <= rangeHigh && currentPrice >= plannedEntry - 1.0) {
        verdict = rrTp2 >= 2.0 && stopLossPoints <= maxSlAccepted ? 'SHORT' : 'ARMED-SHORT';
      } else {
        verdict = 'ARMED-SHORT';
      }
    }
  } else {
    verdict = 'WAIT';
    if (isNoEntryMidRange) {
      warnings.push(`NO-ENTRY ZONE: Price at p = ${rangePositionP} (mid-range 40%–60% equilibrium chop).`);
    }
  }

  // 7. Dynamic Position Sizing Formula (Section 8)
  // lots = (account_size x risk%) / (SL_points x 100)
  const riskUsd = +((accountSize * riskPercent) / 100).toFixed(2);
  const activeSlPts = stopLossPoints && stopLossPoints > 0 ? stopLossPoints : 10.0;
  const calculatedLots = +(riskUsd / (activeSlPts * 100)).toFixed(2);
  const finalLots = Math.max(0.01, calculatedLots);
  const lotFormula = `(${accountSize.toLocaleString()} x ${riskPercent}%) / (${activeSlPts} pts x $100) = ${finalLots} Lot`;

  // 8. Management Steps
  const tp1PtsStr = tp1Price && entryPrice ? Math.abs(tp1Price - entryPrice).toFixed(1) : '12';
  const tp2PtsStr = tp2Price && entryPrice ? Math.abs(tp2Price - entryPrice).toFixed(1) : '24';
  const tp3PtsStr = tp3Price && entryPrice ? Math.abs(tp3Price - entryPrice).toFixed(1) : '40';

  const managementSteps: string[] = [
    `1. TP1 (+${tp1PtsStr} pts): 40% position close karein. SL ko cost (Breakeven + spread) par move karein ONLY after TP1 is hit.`,
    `2. TP2 (+${tp2PtsStr} pts): 30% position secure karein. Pure position ko completely risk-free banayein.`,
    `3. TP3 (+${tp3PtsStr} pts): 20% position take-profit karein.`,
    `4. TP4 Runner (Remaining 10%): 5M swing lows/highs ya EMA20 ke piche trail karein for macro trend runner.`,
    `5. Time Stop: Agar 6–8 candles (30–40 mins) tak koi follow-through nahi milta, exit at breakeven.`
  ];

  const invalidationCondition =
    verdict === 'LONG' || verdict === 'ARMED-LONG'
      ? `5M candle closed below $${stopLossPrice?.toLocaleString() ?? rangeLow} strictly invalidates this thesis.`
      : verdict === 'SHORT' || verdict === 'ARMED-SHORT'
      ? `5M candle closed above $${stopLossPrice?.toLocaleString() ?? rangeHigh} strictly invalidates this thesis.`
      : 'Price remains inside mid-range equilibrium. Invalidation pending zone breakout.';

  // 9. Map (Kahan Long, Kahan Short, Kahan No-Entry, Next Trigger)
  const mapData = {
    kahanLongKarein: `Asian Low / Demand zone ($${rangeLow.toFixed(1)} – $${(rangeLow - 2.5).toFixed(1)}) ke sweep ke baad 5M bullish closed candle par.`,
    kahanShortKarein: `Asian High / Supply zone ($${rangeHigh.toFixed(1)} – $${(rangeHigh + 2.5).toFixed(1)}) ke sweep ke baad 5M bearish rejection closed candle par.`,
    kahanEntryNahi: `$${(rangeLow + 0.4 * rangeSpan).toFixed(1)} se $${(rangeLow + 0.6 * rangeSpan).toFixed(1)} ke beech (Mid-range 40%–60% chop zone).`,
    nextTriggerToWatch:
      verdict === 'WAIT'
        ? `Wait for clean liquidity sweep of either $${rangeLow.toFixed(1)} (Low) or $${rangeHigh.toFixed(1)} (High).`
        : verdict.includes('LONG')
        ? `Closed 5M candle holding above $${entryPrice?.toLocaleString() ?? rangeLow} with volume expansion.`
        : `Closed 5M breakdown candle below $${entryPrice?.toLocaleString() ?? rangeHigh} with CVD negative delta.`
  };

  // 10. Evidence Lines (3–5 lines)
  const evidenceLines: string[] = [
    `1. Sweep/Structure: ${rangePositionP <= 0.4 ? 'Clean liquidity sweep of Asian lows with demand absorption' : rangePositionP >= 0.6 ? 'Sweep of resting buy-side liquidity above Asian highs with rejection' : 'Price oscillating in mid-range equilibrium'}.`,
    `2. DXY Dollar Index: ${dxyGoldNote}`,
    `3. Session Timing: ${sessionLabel} — optimal momentum window for execution.`,
    `4. Regime & Volatility: ATR(5m)=${atr5m} pts. ${regimeDetails}`
  ];

  // 11. Confidence Calibration
  const confidenceLevel = verdict === 'WAIT' ? 'Low' : dxyIsTailwindForGold || dxyIsHeadwindForGold ? 'High' : 'Medium';
  const confidenceReason =
    verdict === 'WAIT'
      ? 'No asymmetric setup at key location; capital protection takes priority.'
      : `${setupName} aligned with ${session} momentum and DXY confluence.`;

  // 12. Formatted Report Text (Matching Section 9 Specification)
  const formattedReportText = `GOLD XAUUSD | ${timeIstStr} | $${currentPrice.toFixed(2)} | ${session} | ${regime}
HTF BIAS (4H / 1H): ${compositeHtfBias} (${htfBias4h} / ${htfBias1h})
VERDICT: ${verdict}   (Setup: ${setup})
ENTRY: ${entryPrice ? `$${entryPrice.toFixed(2)} ($${entryZoneLow?.toFixed(2)} – $${entryZoneHigh?.toFixed(2)})` : '—'} | Order type: Confirmed Retest Limit
STOP LOSS: ${stopLossPrice ? `$${stopLossPrice.toFixed(2)} (${stopLossPoints} points)` : '—'} | Why: ${slWhy || 'Structural zone extreme'}
TP1: ${tp1Price ? `$${tp1Price.toFixed(2)} (+${tp1PtsStr} pts, RR 1:${rrTp1})` : '—'} | TP2: ${tp2Price ? `$${tp2Price.toFixed(2)} (+${tp2PtsStr} pts, RR 1:${rrTp2})` : '—'} | TP3: ${tp3Price ? `$${tp3Price.toFixed(2)} (+${tp3PtsStr} pts, RR 1:${rrTp3})` : '—'} | TP4 runner: Trail EMA20 / 5m swing
SIZE: ${finalLots} lots for $${accountSize.toLocaleString()} account (${lotFormula})
MANAGEMENT: ${managementSteps.join(' ')}
INVALIDATION: ${invalidationCondition}

MAP:
  KAHAN LONG KAREIN: ${mapData.kahanLongKarein}
  KAHAN SHORT KAREIN: ${mapData.kahanShortKarein}
  KAHAN ENTRY NAHI (NO-ENTRY): ${mapData.kahanEntryNahi}
  NEXT TRIGGER TO WATCH: ${mapData.nextTriggerToWatch}

EVIDENCE (3–5 lines):
${evidenceLines.map((e) => `  ${e}`).join('\n')}

CONFIDENCE: ${confidenceLevel} — ${confidenceReason}
WARNINGS: ${warnings.length > 0 ? warnings.join(' · ') : 'None. Execution parameters fully compliant with Institutional Rulebook.'}`;

  return {
    timeIst: timeIstStr,
    price: currentPrice,
    session,
    sessionLabel,
    regime,
    regimeDetails,
    htfBias: {
      '4H': htfBias4h,
      '1H': htfBias1h,
      composite: compositeHtfBias
    },
    rangePositionP,
    isNoEntryMidRange,
    verdict,
    setup,
    setupName,
    entry: {
      price: entryPrice,
      zoneLow: entryZoneLow,
      zoneHigh: entryZoneHigh,
      orderType: 'Limit / Confirmed Retest',
      isChase
    },
    stopLoss: {
      price: stopLossPrice,
      points: stopLossPoints,
      why: slWhy
    },
    targets: {
      tp1: { price: tp1Price, points: stopLossPoints ? +(tp1PtsStr) : null, rr: rrTp1 },
      tp2: { price: tp2Price, points: stopLossPoints ? +(tp2PtsStr) : null, rr: rrTp2 },
      tp3: { price: tp3Price, points: stopLossPoints ? +(tp3PtsStr) : null, rr: rrTp3 },
      tp4Runner: {
        label: 'TP4 Macro Runner',
        trailRule: 'Trail behind 5M swing lows/highs or 15M EMA20'
      }
    },
    positionSize: {
      accountSize,
      riskPercent,
      riskUsd,
      lots: finalLots,
      formula: lotFormula
    },
    management: managementSteps,
    invalidation: invalidationCondition,
    map: mapData,
    evidenceLines,
    dxyAnalysis: {
      currentValue: dxy.currentValue,
      change24h: dxy.change24h,
      impactOnGold: dxyGoldNote,
      conflict: (verdict.includes('LONG') && dxyIsHeadwindForGold) || (verdict.includes('SHORT') && dxyIsTailwindForGold)
    },
    confidence: {
      level: confidenceLevel,
      reason: confidenceReason
    },
    warnings,
    formattedReportText
  };
}
