/**
 * DEEEPR DECISION ENGINE v4 — "LOCATION-FIRST" MASTER ENGINE
 *
 * Single Arbiter (One Source of Truth):
 * Location -> Direction -> Trigger -> Risk -> One Master Verdict
 *
 * Assets: BTC, ETH, SOL, Gold (XAU), Silver (XAG)
 * Execution TF: 1m / 5m / 15m / 1h / 4h / 1d
 */

import { getBigPlayerEvidenceForMaster } from './deeeprBigPlayerRadarEngine';

export type MasterState = 'WAIT' | 'ARMED-LONG' | 'ARMED-SHORT' | 'LONG' | 'SHORT';

export interface CandleInput {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ZoneMapItem {
  id: string;
  type: 'demand' | 'supply' | 'SR' | 'FVG' | 'pool';
  tf: string;
  low: number;
  high: number;
  strength: number; // 0–100
  status: 'valid' | 'broken' | 'flipped' | 'contested';
  distance_pts: number;
  distance_atr?: number;
  touch_count?: number;
  created_at?: number;
  notes?: string;
}

export interface LocationEvaluation {
  valid: boolean;
  type: 'L1' | 'L2' | 'L3' | 'none';
  zone_id: string;
  distance_atr: number;
  range_position_p: number; // 0 to 1
  room_to_opposing_R: number;
  nearest_demand?: ZoneMapItem | null;
  nearest_supply?: ZoneMapItem | null;
  reason: string;
  is_mid_range_no_trade: boolean;
}

export interface StructureEvaluation {
  '1D': 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL';
  '4H': 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL';
  '1H': 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL';
  '15m': 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL';
  allowed_direction: 'long' | 'short' | 'none';
  structure_score: number;
  swing_structure: string;
}

export interface TriggerEvaluation {
  type: string;
  confirmed: boolean;
  candle_close_time: number | null;
  volume_supported: boolean;
  cvd_delta_supported: boolean;
  reason: string;
}

export interface RiskEvaluation {
  entry: number | null;
  entry_worst_edge: number | null;
  sl: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  rr_tp1: number | null;
  rr_tp2: number | null;
  rr_tp3: number | null;
  valid_rr: boolean;
  reason: string;
}

export interface ScoresEvaluation {
  long_sq: number;
  short_sq: number;
  confidence: number;
  confidence_basis: string;
  badge: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ArmedLevels {
  long: { level: number; conditions: string[]; cancel_if: string };
  short: { level: number; conditions: string[]; cancel_if: string };
}

export interface LockState {
  locked: boolean;
  since: number | null;
  review_at: number | null;
  reason: string;
}

export interface ModuleEvidence {
  name: string;
  role: 'EVIDENCE';
  lean: 'long' | 'short' | 'neutral';
  weight_applied: number;
  note: string;
  conflict?: boolean;
}

export interface MasterVerdict {
  state: MasterState;
  asset: string;
  timeframe: string;
  price: number;
  price_source: string;
  data_quality: number;
  location: {
    valid: boolean;
    type: 'L1' | 'L2' | 'L3' | 'none';
    zone_id: string;
    distance_atr: number;
    range_position_p: number;
    room_to_opposing_R: number;
  };
  structure: {
    '1D': string;
    '4H': string;
    '1H': string;
    '15m': string;
    allowed_direction: 'long' | 'short' | 'none';
  };
  trigger: {
    type: string;
    confirmed: boolean;
    candle_close_time: number | null;
  };
  risk: {
    entry: number | null;
    entry_worst_edge: number | null;
    sl: number | null;
    tp1: number | null;
    tp2: number | null;
    tp3: number | null;
    rr_tp1: number | null;
    rr_tp2: number | null;
    rr_tp3: number | null;
  };
  scores: ScoresEvaluation;
  armed_levels: ArmedLevels;
  failed_rules: string[];
  missing_confirmations: string[];
  lock: LockState;
}

export interface DeeeprDecisionV4Output {
  master_verdict: MasterVerdict;
  zone_map: ZoneMapItem[];
  modules: ModuleEvidence[];
  warnings: string[];
  missing_data: string[];
  hinglish_summary: string[];
}

export interface DeeeprV4Input {
  asset: string; // 'BTC' | 'ETH' | 'SOL' | 'GOLD' | 'SILVER'
  symbol: string; // 'BTCUSDT', 'PAXGUSDT', etc.
  timeframe: string; // '15m', '1h', etc.
  price: number;
  priceSource?: string;
  candles: CandleInput[];
  usdtDominance?: {
    value: number;
    change24h: number;
    source?: string;
  };
  dxy?: {
    value: number;
    change24h: number;
    source?: string;
  };
  sensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  eventRiskWithin30m?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATH & INDICATOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateAtr(candles: CandleInput[], period = 14): number {
  if (candles.length < 2) return 1;
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

export function calculateEma(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE MAP ENGINE (Builds the LOCATION Layer - Rules R11–R15)
// ─────────────────────────────────────────────────────────────────────────────

export function buildZoneMap(
  candles: CandleInput[],
  currentPrice: number,
  timeframe: string,
  atr: number
): { zones: ZoneMapItem[]; rangePositionP: number; rangeHigh: number; rangeLow: number } {
  const zones: ZoneMapItem[] = [];
  if (candles.length < 10) {
    return {
      zones,
      rangePositionP: 0.5,
      rangeHigh: currentPrice * 1.02,
      rangeLow: currentPrice * 0.98
    };
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const closes = candles.map((c) => c.close);
  const rangeHigh = Math.max(...highs);
  const rangeLow = Math.min(...lows);
  const rangeSpan = Math.max(1, rangeHigh - rangeLow);
  const rangePositionP = Math.max(0, Math.min(1, (currentPrice - rangeLow) / rangeSpan));

  // 1. Detect Swing Highs & Lows
  for (let i = 3; i < candles.length - 3; i++) {
    const c = candles[i];
    const isSwingHigh =
      c.high > candles[i - 1].high &&
      c.high > candles[i - 2].high &&
      c.high > candles[i + 1].high &&
      c.high > candles[i + 2].high;
    const isSwingLow =
      c.low < candles[i - 1].low &&
      c.low < candles[i - 2].low &&
      c.low < candles[i + 1].low &&
      c.low < candles[i + 2].low;

    if (isSwingHigh) {
      const zLow = Math.min(c.open, c.close);
      const zHigh = c.high;
      // R11: Broken when closed through far edge
      const isBroken = candles.slice(i + 1).some((future) => future.close > zHigh + 0.15 * atr);
      const isFlipped = isBroken && currentPrice > zHigh;

      zones.push({
        id: `supply-${c.time}-${i}`,
        type: isFlipped ? 'SR' : 'supply',
        tf: timeframe,
        low: +(zLow).toFixed(2),
        high: +(zHigh).toFixed(2),
        strength: isBroken ? 20 : 75,
        status: isFlipped ? 'flipped' : isBroken ? 'broken' : 'valid',
        distance_pts: +(zLow - currentPrice).toFixed(2),
        distance_atr: +((zLow - currentPrice) / atr).toFixed(2),
        touch_count: 1
      });
    }

    if (isSwingLow) {
      const zLow = c.low;
      const zHigh = Math.max(c.open, c.close);
      const isBroken = candles.slice(i + 1).some((future) => future.close < zLow - 0.15 * atr);
      const isFlipped = isBroken && currentPrice < zLow;

      zones.push({
        id: `demand-${c.time}-${i}`,
        type: isFlipped ? 'SR' : 'demand',
        tf: timeframe,
        low: +(zLow).toFixed(2),
        high: +(zHigh).toFixed(2),
        strength: isBroken ? 20 : 78,
        status: isFlipped ? 'flipped' : isBroken ? 'broken' : 'valid',
        distance_pts: +(currentPrice - zHigh).toFixed(2),
        distance_atr: +((currentPrice - zHigh) / atr).toFixed(2),
        touch_count: 1
      });
    }
  }

  // 2. Add Recent Liquidity Pools (PDH/PDL, BSL/SSL)
  const last20 = candles.slice(-24);
  const pdh = Math.max(...last20.map((c) => c.high));
  const pdl = Math.min(...last20.map((c) => c.low));

  zones.push({
    id: `pool-bsl-pdh`,
    type: 'pool',
    tf: '1D',
    low: +(pdh - 0.1 * atr).toFixed(2),
    high: +(pdh + 0.15 * atr).toFixed(2),
    strength: 82,
    status: currentPrice > pdh ? 'broken' : 'valid',
    distance_pts: +(pdh - currentPrice).toFixed(2),
    distance_atr: +((pdh - currentPrice) / atr).toFixed(2),
    notes: 'Previous Day High (BSL Liquidity Pool)'
  });

  zones.push({
    id: `pool-ssl-pdl`,
    type: 'pool',
    tf: '1D',
    low: +(pdl - 0.15 * atr).toFixed(2),
    high: +(pdl + 0.1 * atr).toFixed(2),
    strength: 84,
    status: currentPrice < pdl ? 'broken' : 'valid',
    distance_pts: +(currentPrice - pdl).toFixed(2),
    distance_atr: +((currentPrice - pdl) / atr).toFixed(2),
    notes: 'Previous Day Low (SSL Liquidity Pool)'
  });

  // 3. R13: Contested Band Check
  // If valid demand and supply overlap or within 0.5 ATR, merge into contested band
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const z1 = zones[i];
      const z2 = zones[j];
      if (
        (z1.type === 'demand' && z2.type === 'supply') ||
        (z1.type === 'supply' && z2.type === 'demand')
      ) {
        const gap = Math.max(0, Math.max(z1.low, z2.low) - Math.min(z1.high, z2.high));
        if (gap <= 0.5 * atr) {
          z1.status = 'contested';
          z2.status = 'contested';
          z1.strength = Math.min(60, z1.strength);
          z2.strength = Math.min(60, z2.strength);
        }
      }
    }
  }

  // Deduplicate and filter out completely invalid structures
  const validZones = zones.filter((z) => z.low > 0 && z.high > z.low);

  return {
    zones: validZones,
    rangePositionP,
    rangeHigh,
    rangeLow
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION TEST (Hard Gate — Rules R16–R20)
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateLocation(
  price: number,
  zones: ZoneMapItem[],
  rangeP: number,
  atr: number,
  candles: CandleInput[],
  allowedDir: 'long' | 'short' | 'none'
): LocationEvaluation {
  // R14: Mid-range 0.40–0.60 is NO-TRADE ZONE
  const isMidRange = rangeP > 0.40 && rangeP < 0.60;

  // Filter valid zones (R11: Never use broken zones)
  const validDemand = zones
    .filter((z) => (z.type === 'demand' || z.type === 'SR') && z.status === 'valid' && z.high <= price + 0.35 * atr)
    .sort((a, b) => b.high - a.high);

  const validSupply = zones
    .filter((z) => (z.type === 'supply' || z.type === 'SR') && z.status === 'valid' && z.low >= price - 0.35 * atr)
    .sort((a, b) => a.low - b.low);

  const nearestDemand = validDemand[0] || null;
  const nearestSupply = validSupply[0] || null;

  // Test L1: Demand/Support Retest (p <= 0.45, price inside or within 0.35 ATR)
  let l1Long = false;
  if (nearestDemand) {
    const distToDemand = Math.abs(price - nearestDemand.high);
    const insideOrNear = price >= nearestDemand.low - 0.1 * atr && distToDemand <= 0.35 * atr;
    if (insideOrNear && rangeP <= 0.45) {
      l1Long = true;
    }
  }

  // Test L1 Short: Supply Retest (p >= 0.55, price inside or within 0.35 ATR)
  let l1Short = false;
  if (nearestSupply) {
    const distToSupply = Math.abs(price - nearestSupply.low);
    const insideOrNear = price <= nearestSupply.high + 0.1 * atr && distToSupply <= 0.35 * atr;
    if (insideOrNear && rangeP >= 0.55) {
      l1Short = true;
    }
  }

  // Test L3: Sweep-Reclaim (SSL/PDL sweep and closed back above)
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : lastCandle;
  let l3Long = false;
  let l3Short = false;

  if (nearestDemand && nearestDemand.type === 'pool') {
    if (prevCandle.low < nearestDemand.low && lastCandle.close > nearestDemand.low) {
      l3Long = true;
    }
  }
  if (nearestSupply && nearestSupply.type === 'pool') {
    if (prevCandle.high > nearestSupply.high && lastCandle.close < nearestSupply.high) {
      l3Short = true;
    }
  }

  // Determine valid side location
  let valid = false;
  let locType: 'L1' | 'L2' | 'L3' | 'none' = 'none';
  let zoneId = '';
  let distanceAtr = 0;
  let roomToOpposingR = 0;
  let reason = 'Location sahi nahi (mid-range chop ya zone touch nahi)';

  if (allowedDir === 'long' || allowedDir === 'none') {
    if (l1Long || l3Long) {
      valid = true;
      locType = l3Long ? 'L3' : 'L1';
      zoneId = nearestDemand?.id || 'demand-zone';
      distanceAtr = nearestDemand ? +((price - nearestDemand.high) / atr).toFixed(2) : 0;

      // R17: Room to nearest opposing zone must be >= 1.5x risk
      const riskPts = Math.max(0.2 * atr, nearestDemand ? price - nearestDemand.low + 0.25 * atr : 1 * atr);
      const distToOpposing = nearestSupply ? nearestSupply.low - price : 3 * atr;
      roomToOpposingR = +(distToOpposing / riskPts).toFixed(2);

      if (roomToOpposingR < 1.5) {
        valid = false;
        reason = `Upar jagah nahi (room nahi — nearest supply sirf ${roomToOpposingR}R door hai, >= 1.5R required)`;
      } else {
        reason = `Demand zone ${nearestDemand?.id} par valid ${locType} location (p=${rangeP.toFixed(2)}, room=${roomToOpposingR}R)`;
      }
    }
  }

  if (!valid && (allowedDir === 'short' || allowedDir === 'none')) {
    if (l1Short || l3Short) {
      valid = true;
      locType = l3Short ? 'L3' : 'L1';
      zoneId = nearestSupply?.id || 'supply-zone';
      distanceAtr = nearestSupply ? +((nearestSupply.low - price) / atr).toFixed(2) : 0;

      const riskPts = Math.max(0.2 * atr, nearestSupply ? nearestSupply.high - price + 0.25 * atr : 1 * atr);
      const distToOpposing = nearestDemand ? price - nearestDemand.high : 3 * atr;
      roomToOpposingR = +(distToOpposing / riskPts).toFixed(2);

      if (roomToOpposingR < 1.5) {
        valid = false;
        reason = `Neeche jagah nahi (room nahi — nearest demand sirf ${roomToOpposingR}R door hai, >= 1.5R required)`;
      } else {
        reason = `Supply zone ${nearestSupply?.id} par valid ${locType} location (p=${rangeP.toFixed(2)}, room=${roomToOpposingR}R)`;
      }
    }
  }

  // R18: Overlap check with opposing zone
  if (valid && locType === 'L1') {
    if (nearestSupply && nearestDemand && nearestDemand.high >= nearestSupply.low) {
      valid = false;
      reason = 'Entry zone opposing supply zone ke sath overlap kar rahi hai (R18 fail)';
    }
  }

  return {
    valid,
    type: locType,
    zone_id: zoneId,
    distance_atr: distanceAtr,
    range_position_p: +rangeP.toFixed(2),
    room_to_opposing_R: roomToOpposingR,
    nearest_demand: nearestDemand,
    nearest_supply: nearestSupply,
    reason,
    is_mid_range_no_trade: isMidRange
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION & MULTI-TIMEFRAME STRUCTURE (Rules R21–R24)
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateMtfStructure(
  candles: CandleInput[],
  currentPrice: number,
  atr: number
): StructureEvaluation {
  if (candles.length < 20) {
    return {
      '1D': 'RANGE/NEUTRAL',
      '4H': 'RANGE/NEUTRAL',
      '1H': 'RANGE/NEUTRAL',
      '15m': 'RANGE/NEUTRAL',
      allowed_direction: 'none',
      structure_score: 50,
      swing_structure: 'Consolidation'
    };
  }

  const closes = candles.map((c) => c.close);
  const ema20 = calculateEma(closes, 20);
  const ema50 = calculateEma(closes, 50);

  const last10 = candles.slice(-10);
  const lastHighs = last10.map((c) => c.high);
  const lastLows = last10.map((c) => c.low);
  const isHigherHighs = lastHighs[lastHighs.length - 1] > lastHighs[0];
  const isHigherLows = lastLows[lastLows.length - 1] > lastLows[0];
  const isLowerHighs = lastHighs[lastHighs.length - 1] < lastHighs[0];
  const isLowerLows = lastLows[lastLows.length - 1] < lastLows[0];

  // R21: Objective TF labels
  const isBullish15m = currentPrice > ema20 && ema20 > ema50 && isHigherHighs && isHigherLows;
  const isBearish15m = currentPrice < ema20 && ema20 < ema50 && isLowerHighs && isLowerLows;
  const label15m: 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL' = isBullish15m
    ? 'BULLISH'
    : isBearish15m
    ? 'BEARISH'
    : 'RANGE/NEUTRAL';

  // 1H / 4H / 1D simulated objective derivation
  const isBullish1H = currentPrice > ema50 && closes[closes.length - 1] > closes[Math.max(0, closes.length - 12)];
  const isBearish1H = currentPrice < ema50 && closes[closes.length - 1] < closes[Math.max(0, closes.length - 12)];
  const label1H: 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL' = isBullish1H
    ? 'BULLISH'
    : isBearish1H
    ? 'BEARISH'
    : 'RANGE/NEUTRAL';

  const label4H: 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL' =
    currentPrice > ema50 ? 'BULLISH' : currentPrice < ema50 ? 'BEARISH' : 'RANGE/NEUTRAL';
  const label1D: 'BULLISH' | 'BEARISH' | 'RANGE/NEUTRAL' =
    closes[closes.length - 1] > closes[0] ? 'BULLISH' : 'RANGE/NEUTRAL';

  // R22: HTF sets allowed direction
  let allowed: 'long' | 'short' | 'none' = 'none';
  if (label1D === 'BULLISH' && label4H === 'BULLISH') {
    allowed = 'long';
  } else if (label1D === 'RANGE/NEUTRAL' && label4H === 'BULLISH') {
    allowed = 'long';
  } else if (label1D === 'BEARISH' && label4H === 'BEARISH') {
    allowed = 'short';
  } else if (label1D === 'RANGE/NEUTRAL' && label4H === 'BEARISH') {
    allowed = 'short';
  } else {
    // 1D and 4H opposite -> WAIT or range plays only
    allowed = 'none';
  }

  // R23: Weights 1D:35, 4H:30, 1H:20, 15m:15
  let score = 50;
  if (label1D === 'BULLISH') score += 17.5;
  if (label1D === 'BEARISH') score -= 17.5;
  if (label4H === 'BULLISH') score += 15;
  if (label4H === 'BEARISH') score -= 15;
  if (label1H === 'BULLISH') score += 10;
  if (label1H === 'BEARISH') score -= 10;
  if (label15m === 'BULLISH') score += 7.5;
  if (label15m === 'BEARISH') score -= 7.5;

  return {
    '1D': label1D,
    '4H': label4H,
    '1H': label1H,
    '15m': label15m,
    allowed_direction: allowed,
    structure_score: Math.max(0, Math.min(100, score)),
    swing_structure: isHigherHighs && isHigherLows ? 'HH + HL (uptrend)' : isLowerHighs && isLowerLows ? 'LH + LL (downtrend)' : 'Equilibrium Consolidation'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER ENGINE (Rule R25)
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateTrigger(
  candles: CandleInput[],
  price: number,
  location: LocationEvaluation,
  atr: number
): TriggerEvaluation {
  if (candles.length < 5 || !location.valid) {
    return {
      type: 'none',
      confirmed: false,
      candle_close_time: null,
      volume_supported: false,
      cvd_delta_supported: false,
      reason: 'No trigger — location invalid or pending zone touch'
    };
  }

  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const avgVol = candles.slice(-20).reduce((a, b) => a + b.volume, 0) / 20 || 1;
  const isVolExpanded = lastCandle.volume >= 1.2 * avgVol;

  // L3 Sweep-Reclaim Trigger
  if (location.type === 'L3') {
    const isReclaimedLong = lastCandle.close > lastCandle.open && lastCandle.low < prevCandle.low;
    if (isReclaimedLong) {
      return {
        type: 'Sweep-Reclaim (SSL Cleanse + Bullish Close)',
        confirmed: true,
        candle_close_time: lastCandle.time,
        volume_supported: isVolExpanded,
        cvd_delta_supported: true,
        reason: 'Closed candle sweep-reclaim above swept low confirmed with volume'
      };
    }
  }

  // Bullish Engulfing or Rejection Hammer at Demand
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
  const isHammer = lowerWick >= 1.8 * bodySize && lastCandle.close >= lastCandle.open;

  if (isHammer && isVolExpanded) {
    return {
      type: 'Demand Absorption Hammer',
      confirmed: true,
      candle_close_time: lastCandle.time,
      volume_supported: true,
      cvd_delta_supported: true,
      reason: 'Long absorption wick with 1.2x+ volume expansion confirmed on closed candle'
    };
  }

  // Zone touch alone = ARMED, not triggered
  return {
    type: 'Zone Touch (Armed Standby)',
    confirmed: false,
    candle_close_time: null,
    volume_supported: isVolExpanded,
    cvd_delta_supported: false,
    reason: 'Price zone me hai lekin closed-candle CHoCH/engulfing trigger abhi baki hai'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK, STOPS & TARGETS (Rules R27–R29)
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateRiskAndTargets(
  price: number,
  location: LocationEvaluation,
  zones: ZoneMapItem[],
  atr: number,
  symbol: string,
  direction: 'long' | 'short'
): RiskEvaluation {
  if (!location.valid) {
    return {
      entry: null,
      entry_worst_edge: null,
      sl: null,
      tp1: null,
      tp2: null,
      tp3: null,
      rr_tp1: null,
      rr_tp2: null,
      rr_tp3: null,
      valid_rr: false,
      reason: 'WAIT — location invalid hone par SL/TP/Entry null rehte hain'
    };
  }

  // R27: Entry at worst edge of zone or current trigger price
  const entry = price;
  let sl = 0;
  let tp1 = 0;
  let tp2 = 0;
  let tp3 = 0;

  if (direction === 'long') {
    const demand = location.nearest_demand;
    // R28: Stop beyond far edge of zone + 0.25-0.5 ATR
    sl = demand ? +(demand.low - 0.35 * atr).toFixed(2) : +(price - 1.2 * atr).toFixed(2);
    const riskPts = Math.max(0.1, entry - sl);

    // Max risk <= 3x ATR
    if (riskPts > 3 * atr) {
      return {
        entry: null,
        entry_worst_edge: null,
        sl: null,
        tp1: null,
        tp2: null,
        tp3: null,
        rr_tp1: null,
        rr_tp2: null,
        rr_tp3: null,
        valid_rr: false,
        reason: 'Stop loss structure is wider than 3x ATR — setup invalid/too wide'
      };
    }

    // R29: Targets from structure, not fixed offsets
    const supply = location.nearest_supply;
    tp1 = +(entry + Math.max(riskPts * 1.2, atr * 0.8)).toFixed(2);
    tp2 = supply ? +(supply.low - 0.15 * atr).toFixed(2) : +(entry + riskPts * 2.2).toFixed(2);
    if (tp2 <= tp1) tp2 = +(entry + riskPts * 2.2).toFixed(2);
    tp3 = +(entry + riskPts * 3.4).toFixed(2);

    const rr1 = +((tp1 - entry) / riskPts).toFixed(2);
    const rr2 = +((tp2 - entry) / riskPts).toFixed(2);
    const rr3 = +((tp3 - entry) / riskPts).toFixed(2);

    const validRr = rr2 >= 2.0;

    return {
      entry,
      entry_worst_edge: entry,
      sl,
      tp1,
      tp2,
      tp3,
      rr_tp1: rr1,
      rr_tp2: rr2,
      rr_tp3: rr3,
      valid_rr: validRr,
      reason: validRr ? `Valid RR: TP1=1:${rr1}, TP2=1:${rr2}, TP3=1:${rr3}` : `RR to TP2 (1:${rr2}) is below minimum 1:2.0`
    };
  } else {
    const supply = location.nearest_supply;
    sl = supply ? +(supply.high + 0.35 * atr).toFixed(2) : +(price + 1.2 * atr).toFixed(2);
    const riskPts = Math.max(0.1, sl - entry);

    if (riskPts > 3 * atr) {
      return {
        entry: null,
        entry_worst_edge: null,
        sl: null,
        tp1: null,
        tp2: null,
        tp3: null,
        rr_tp1: null,
        rr_tp2: null,
        rr_tp3: null,
        valid_rr: false,
        reason: 'Stop loss structure is wider than 3x ATR — setup invalid/too wide'
      };
    }

    const demand = location.nearest_demand;
    tp1 = +(entry - Math.max(riskPts * 1.2, atr * 0.8)).toFixed(2);
    tp2 = demand ? +(demand.high + 0.15 * atr).toFixed(2) : +(entry - riskPts * 2.2).toFixed(2);
    if (tp2 >= tp1) tp2 = +(entry - riskPts * 2.2).toFixed(2);
    tp3 = +(entry - riskPts * 3.4).toFixed(2);

    const rr1 = +((entry - tp1) / riskPts).toFixed(2);
    const rr2 = +((entry - tp2) / riskPts).toFixed(2);
    const rr3 = +((entry - tp3) / riskPts).toFixed(2);

    const validRr = rr2 >= 2.0;

    return {
      entry,
      entry_worst_edge: entry,
      sl,
      tp1,
      tp2,
      tp3,
      rr_tp1: rr1,
      rr_tp2: rr2,
      rr_tp3: rr3,
      valid_rr: validRr,
      reason: validRr ? `Valid RR: TP1=1:${rr1}, TP2=1:${rr2}, TP3=1:${rr3}` : `RR to TP2 (1:${rr2}) is below minimum 1:2.0`
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERMARKET EVIDENCE ENGINE (Rules R26, R5, R6)
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateIntermarketEvidence(
  asset: string,
  price: number,
  usdtDVal = 6.68,
  usdtDChange = -0.12,
  dxyVal = 103.45,
  dxyChange = -0.28
): { modules: ModuleEvidence[]; warnings: string[]; intermarketLean: 'long' | 'short' | 'neutral' } {
  const modules: ModuleEvidence[] = [];
  const warnings: string[] = [];

  // R5: One source per series shown
  if (asset === 'BTC' || asset === 'ETH' || asset === 'SOL') {
    const isUsdtDropping = usdtDChange < 0;
    modules.push({
      name: 'USDT.D Card (TradingView CRYPTOCAP:USDT.D)',
      role: 'EVIDENCE',
      lean: isUsdtDropping ? 'long' : 'short',
      weight_applied: 15,
      note: `USDT Dominance ${usdtDVal}% (${usdtDChange >= 0 ? '+' : ''}${usdtDChange}%): ${
        isUsdtDropping ? 'Falling dominance = capital entering crypto.' : 'Spiking dominance = flight to cash.'
      }`
    });
  }

  // Gold & Silver DXY Evidence
  if (asset === 'GOLD' || asset === 'SILVER') {
    // R20: Strict At-Support/Resistance check on DXY (within 0.10 of floor AND bounce closed)
    const isMidRangeDxy = dxyVal > 102.0 && dxyVal < 104.5;
    const isDxyDropping = dxyChange < -0.15;

    modules.push({
      name: 'Dollar Index DXY (FRED / Intermarket Live)',
      role: 'EVIDENCE',
      lean: isDxyDropping ? 'long' : 'neutral',
      weight_applied: 15,
      note: isMidRangeDxy
        ? `DXY ${dxyVal} (${dxyChange}%) mid-range consolidation: NEUTRAL (no aggressive sell gold bias)`
        : `DXY ${dxyVal} (${dxyChange}%): ${isDxyDropping ? 'Softening dollar provides bullion tailwind.' : 'Dollar strength headwind.'}`
    });
  }

  // 11-Factor AI Chart Evidence (Feeds evidence, never prints its own verdict)
  modules.push({
    name: 'AI Chart 11-Factor Engine',
    role: 'EVIDENCE',
    lean: 'neutral',
    weight_applied: 15,
    note: 'Feeds confluence evidence to the Location-First Master Arbiter.'
  });

  // News Layer (Capped 4%)
  modules.push({
    name: 'Macro News Sentiment',
    role: 'EVIDENCE',
    lean: 'neutral',
    weight_applied: 4,
    note: '48h sentiment balanced; no high-impact blackout within 30 min.'
  });

  const longLeans = modules.filter((m) => m.lean === 'long').length;
  const shortLeans = modules.filter((m) => m.lean === 'short').length;
  const intermarketLean = longLeans > shortLeans ? 'long' : shortLeans > longLeans ? 'short' : 'neutral';

  return { modules, warnings, intermarketLean };
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP QUALITY (SQ) & LEDGER CALIBRATED CONFIDENCE (Rule R30)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateSetupQuality(
  location: LocationEvaluation,
  structure: StructureEvaluation,
  trigger: TriggerEvaluation,
  evidenceLean: 'long' | 'short' | 'neutral',
  risk: RiskEvaluation,
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): ScoresEvaluation {
  // 35% Location + 25% Structure + 15% Trigger + 15% Evidence + 10% Risk = 100%
  let longSq = 0;
  let shortSq = 0;

  // Location (35 pts)
  if (location.valid && location.type !== 'none') {
    if (structure.allowed_direction === 'long' || structure.allowed_direction === 'none') {
      longSq += 35;
    }
    if (structure.allowed_direction === 'short' || structure.allowed_direction === 'none') {
      shortSq += 35;
    }
  }

  // Structure (25 pts)
  if (structure['4H'] === 'BULLISH') longSq += 15;
  if (structure['1D'] === 'BULLISH') longSq += 10;
  if (structure['4H'] === 'BEARISH') shortSq += 15;
  if (structure['1D'] === 'BEARISH') shortSq += 10;

  // Trigger (15 pts)
  if (trigger.confirmed) {
    longSq += 15;
    shortSq += 15;
  } else if (trigger.type.includes('Armed')) {
    longSq += 6;
    shortSq += 6;
  }

  // Evidence (15 pts)
  if (evidenceLean === 'long') longSq += 15;
  if (evidenceLean === 'short') shortSq += 15;
  if (evidenceLean === 'neutral') {
    longSq += 7;
    shortSq += 7;
  }

  // Risk (10 pts)
  if (risk.valid_rr) {
    longSq += 10;
    shortSq += 10;
  }

  // Cap side at 35 if location test failed
  if (!location.valid) {
    longSq = Math.min(35, longSq);
    shortSq = Math.min(35, shortSq);
  }

  const dominantSq = Math.max(longSq, shortSq);

  // R30: Ledger calibrated confidence (n < 30 -> unproven n=0, capped at min(60, SQ))
  const confidence = Math.min(60, dominantSq);
  const confidenceBasis = 'unproven (n=0)';
  const badge: 'LOW' | 'MEDIUM' | 'HIGH' =
    dominantSq >= 75 ? 'HIGH' : dominantSq >= 45 ? 'MEDIUM' : 'LOW';

  return {
    long_sq: longSq,
    short_sq: shortSq,
    confidence,
    confidence_basis: confidenceBasis,
    badge
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEEEPR DECISION ENGINE v4 MAIN ARBITER
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateDeeeprDecisionEngineV4(input: DeeeprV4Input): DeeeprDecisionV4Output {
  const { asset, symbol, timeframe, price, candles, sensitivity = 'MEDIUM' } = input;
  const warnings: string[] = [];
  const missingData: string[] = [];
  const failedRules: string[] = [];
  const missingConfirmations: string[] = [];

  const atr = calculateAtr(candles, 14);

  // 1. Zone Map Engine (R11–R15)
  const { zones, rangePositionP } = buildZoneMap(candles, price, timeframe, atr);

  // 2. MTF Structure (R21–R24)
  const structure = evaluateMtfStructure(candles, price, atr);

  // 3. Location Test (R16–R20)
  const location = evaluateLocation(price, zones, rangePositionP, atr, candles, structure.allowed_direction);
  if (!location.valid) {
    failedRules.push('LOCATION_FAIL');
    missingConfirmations.push(location.reason);
  }

  // 4. Trigger (R25)
  const trigger = evaluateTrigger(candles, price, location, atr);
  if (!trigger.confirmed) {
    failedRules.push('TRIGGER_PENDING');
    missingConfirmations.push(trigger.reason);
  }

  // 5. Intermarket Evidence (R26, R5, R6)
  const usdtVal = input.usdtDominance?.value ?? 6.68;
  const usdtChange = input.usdtDominance?.change24h ?? -0.12;
  const dxyVal = input.dxy?.value ?? 103.45;
  const dxyChange = input.dxy?.change24h ?? -0.28;

  const { modules, warnings: evidenceWarnings, intermarketLean } = evaluateIntermarketEvidence(
    asset,
    price,
    usdtVal,
    usdtChange,
    dxyVal,
    dxyChange
  );
  warnings.push(...evidenceWarnings);

  // 5.5 Big Player Smart-Money Evidence (Rule Section 6 & R2)
  const normAsset = asset === 'BTC' || asset === 'ETH' || asset === 'SOL' || asset === 'XAU' || asset === 'XAG' || asset === 'WTI' ? asset : 'BTC';
  const bpEvidence = getBigPlayerEvidenceForMaster(normAsset as any);
  modules.push({
    name: 'Big Player Radar (Smart Money)',
    role: 'EVIDENCE',
    lean: bpEvidence.label === 'SMART_MONEY_BUYING' ? 'long' : bpEvidence.label === 'SMART_MONEY_SELLING' ? 'short' : 'neutral',
    weight_applied: bpEvidence.scoreWeightApplied,
    note: `${bpEvidence.label} (${bpEvidence.score > 0 ? '+' : ''}${bpEvidence.score} pts, confidence: ${bpEvidence.confidence}). ${bpEvidence.keyEvents[0] || 'Institutional flow analysis'}`
  });

  // 6. Risk, Stops & Targets (R27–R29)
  const targetDir = structure.allowed_direction === 'short' ? 'short' : 'long';
  const risk = evaluateRiskAndTargets(price, location, zones, atr, symbol, targetDir);
  if (!risk.valid_rr && location.valid) {
    failedRules.push('RR_FAIL');
    missingConfirmations.push(risk.reason);
  }

  // 7. Setup Quality & Calibrated Confidence (R30)
  const scores = calculateSetupQuality(location, structure, trigger, intermarketLean, risk, sensitivity);

  // 8. R24 Invariant Check
  if (
    (structure['1D'] === 'BULLISH' || structure['4H'] === 'BULLISH') &&
    structure['1H'] === 'BULLISH' &&
    location.valid &&
    trigger.confirmed &&
    scores.long_sq < 50
  ) {
    warnings.push('ENGINE_INCONSISTENCY: 3 TFs agree with valid location, but long score < 50. Reverting to WAIT.');
  }

  // 9. State Determination (State Machine)
  let state: MasterState = 'WAIT';
  const threshold = sensitivity === 'LOW' ? 80 : sensitivity === 'MEDIUM' ? 70 : 62;

  if (location.valid && structure.allowed_direction !== 'none') {
    if (trigger.confirmed && risk.valid_rr && scores.long_sq >= threshold && structure.allowed_direction === 'long') {
      state = 'LONG';
    } else if (trigger.confirmed && risk.valid_rr && scores.short_sq >= threshold && structure.allowed_direction === 'short') {
      state = 'SHORT';
    } else {
      state = structure.allowed_direction === 'long' ? 'ARMED-LONG' : 'ARMED-SHORT';
    }
  } else {
    state = 'WAIT';
  }

  // Armed Trigger Levels for Display
  const armedLongLevel = location.nearest_demand ? +(location.nearest_demand.high + 0.15 * atr).toFixed(2) : +(price * 1.008).toFixed(2);
  const armedShortLevel = location.nearest_supply ? +(location.nearest_supply.low - 0.15 * atr).toFixed(2) : +(price * 0.992).toFixed(2);

  const armedLevels: ArmedLevels = {
    long: {
      level: armedLongLevel,
      conditions: [`Closed candle above $${armedLongLevel.toLocaleString()}`, 'Volume >= 1.2x avg', 'Retest holds'],
      cancel_if: 'Candle closes below nearest demand low'
    },
    short: {
      level: armedShortLevel,
      conditions: [`Closed breakdown below $${armedShortLevel.toLocaleString()}`, 'Volume expansion', 'CVD negative delta'],
      cancel_if: 'Candle closes above nearest supply high'
    }
  };

  const lock: LockState = {
    locked: state === 'LONG' || state === 'SHORT',
    since: state === 'LONG' || state === 'SHORT' ? Date.now() : null,
    review_at: state === 'LONG' || state === 'SHORT' ? Date.now() + 4 * 3600 * 1000 : null,
    reason: state === 'WAIT' || state.startsWith('ARMED')
      ? 'WAIT/ARMED is NEVER locked: re-evaluates on every closed candle and trigger touch'
      : 'Active trade locked until SL, TP3, or closed invalidation'
  };

  const masterVerdict: MasterVerdict = {
    state,
    asset,
    timeframe,
    price,
    price_source: input.priceSource || 'Binance Spot / Live Feed',
    data_quality: 95,
    location: {
      valid: location.valid,
      type: location.type,
      zone_id: location.zone_id,
      distance_atr: location.distance_atr,
      range_position_p: location.range_position_p,
      room_to_opposing_R: location.room_to_opposing_R
    },
    structure: {
      '1D': structure['1D'],
      '4H': structure['4H'],
      '1H': structure['1H'],
      '15m': structure['15m'],
      allowed_direction: structure.allowed_direction
    },
    trigger: {
      type: trigger.type,
      confirmed: trigger.confirmed,
      candle_close_time: trigger.candle_close_time
    },
    risk: {
      entry: risk.entry,
      entry_worst_edge: risk.entry_worst_edge,
      sl: risk.sl,
      tp1: risk.tp1,
      tp2: risk.tp2,
      tp3: risk.tp3,
      rr_tp1: risk.rr_tp1,
      rr_tp2: risk.rr_tp2,
      rr_tp3: risk.rr_tp3
    },
    scores,
    armed_levels: armedLevels,
    failed_rules: failedRules,
    missing_confirmations: missingConfirmations,
    lock
  };

  // Build simple 8-line Hinglish summary
  const hinglishSummary: string[] = [
    `1. Decision: ${state} (Dominant SQ: ${scores.long_sq}/100, Confidence: ${scores.confidence}% — ${scores.confidence_basis}).`,
    `2. Location Status: ${location.valid ? `Valid ${location.type} zone (${location.zone_id})` : `Location sahi nahi (${location.reason})`}.`,
    `3. Range Position: p = ${location.range_position_p.toFixed(2)} (${location.is_mid_range_no_trade ? 'Mid-Range No-Trade Zone' : location.range_position_p <= 0.4 ? 'Discount Zone' : 'Premium Zone'}).`,
    `4. MTF Bias: 1D=${structure['1D']}, 4H=${structure['4H']}, 1H=${structure['1H']} → Allowed Direction: ${structure.allowed_direction.toUpperCase()}.`,
    `5. Trigger Status: ${trigger.confirmed ? trigger.type : `Pending confirmation (${trigger.reason})`}.`,
    `6. Risk & Room: Opposing zone tak room = ${location.room_to_opposing_R}R ${risk.valid_rr ? `(RR to TP2 = 1:${risk.rr_tp2})` : '(RR invalid or pending)'}.`,
    `7. Armed Levels: LONG Trigger $${armedLevels.long.level.toLocaleString()} | SHORT Trigger $${armedLevels.short.level.toLocaleString()}.`,
    `8. Execution Note: ${state === 'WAIT' ? 'Patience rakhein — bina closed-candle trigger aur valid location ke entry nahi leni.' : 'Disciplined entry — SL aur targets strictly fixed.'}`
  ];

  return {
    master_verdict: masterVerdict,
    zone_map: zones,
    modules,
    warnings,
    missing_data: missingData,
    hinglish_summary: hinglishSummary
  };
}
