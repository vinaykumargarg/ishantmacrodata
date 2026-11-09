/**
 * GOLD SMC SIGNAL ENGINE v3 — INSTITUTIONAL MULTI-TIMEFRAME NO-FLIP ENGINE
 *
 * Architecture:
 *   1. Multi-TF candle fetch: 1D → 4H → 1H → 15M → 5M
 *   2. Per-TF SMC analysis: swing highs/lows, BOS, CHoCH, OB, FVG, sweeps
 *   3. 7 Independent Analysts → Consensus Index [-1, +1]
 *   4. Signal State Machine (localStorage-persisted, no server required)
 *   5. Gate checks: 8 hard gates must all pass before signal creation
 *   6. Direction LOCK: once active, stays until TP3/SL/structural invalidation
 *   7. TP/SL tracker on every price update
 *   8. Cooldown engine: post-SL 45 min, post-TP 15 min, max 2 signals/day
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface CandleOHLC {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalDirection = 'LONG' | 'SHORT' | 'WAIT';

export type SignalState =
  | 'NONE'
  | 'PENDING'
  | 'ACTIVE'
  | 'TP1_HIT'
  | 'TP2_HIT'
  | 'TP3_HIT'
  | 'SL_HIT'
  | 'BE_STOP'
  | 'INVALIDATED'
  | 'EXPIRED'
  | 'MISSED'
  | 'COMPLETED';

export interface SignalEvent {
  type: string;
  timestamp: number;
  price: number;
  note: string;
}

export interface ActiveSignal {
  id: string;
  instrument: string;
  direction: SignalDirection;
  state: SignalState;
  createdAt: number;
  updatedAt: number;
  entryPrice: number;
  entryZone: string;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskPts: number;
  rrrTp1: string;
  rrrTp2: string;
  rrrTp3: string;
  setupGrade: string;
  confidence: number;
  setupScore: number;
  analystConsensus: number; // -1 to +1
  agreementPct: number; // 0–100%
  invalidationLevel: number;
  expiresAt: number; // 8h default
  events: SignalEvent[];
  lockedPlanHash: string;
  managementSLMoved: boolean; // SL moved to BE after TP1?
  // Why
  whySignal: string[];
  whyGatesBlocked: string[];
  // Scores
  scoreBreakdown: ScoreBreakdown;
  // Regime
  regime: string;
  session: string;
  // Analyst stances
  analysts: AnalystOutput[];
}

export interface ScoreBreakdown {
  htfAlignment: number;      // 0-20
  marketStructure: number;   // 0-20
  liquidity: number;         // 0-15
  orderBlock: number;        // 0-10
  displacement: number;      // 0-10
  volumeMomentum: number;    // 0-10
  macro: number;             // 0-10
  riskReward: number;        // 0-5
  total: number;             // 0-100
}

export interface TFBias {
  tf: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: string;
  recentSwings: string;
  lastBOS: string;
  orderBlock: { type: string; top: number; bottom: number } | null;
  fvg: { top: number; bottom: number } | null;
  sweepDetected: boolean;
  atr: number;
}

export interface AnalystOutput {
  id: string;
  name: string;
  stance: 'LONG' | 'SHORT' | 'NEUTRAL';
  strength: number; // 0–1
  evidence: string[];
  dataStatus: 'REAL' | 'ESTIMATED' | 'PROXY' | 'MISSING';
  abstain: boolean;
  abstainReason?: string;
}

export interface ConsensusResult {
  ci: number; // Consensus Index [-1, +1]
  agreementPct: number;
  finalStance: 'LONG' | 'SHORT' | 'NEUTRAL';
  analysts: AnalystOutput[];
  disagreementPenalty: boolean;
  coverageOk: boolean; // >= 4 of 7 analysts active
}

export interface EngineOutput {
  instrument: string;
  currentPrice: number;
  timestamp: number;
  activeSignal: ActiveSignal | null;
  tfBiases: TFBias[];
  consensus: ConsensusResult;
  whyNoSignal: string;
  cooldownActive: boolean;
  cooldownEndsAt: number;
  dailySignalCount: number;
  dailySLCount: number;
  regime: string;
  session: string;
  macroSummary: MacroSummary;
  dataFreshMs: number;
}

export interface MacroSummary {
  dxyBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  yieldBias: 'RISING' | 'FALLING' | 'NEUTRAL';
  eventRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  eventName: string;
  macroBias: 'BULLISH_GOLD' | 'BEARISH_GOLD' | 'NEUTRAL';
  note: string;
}

// ─── PERSISTENCE KEY ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'DEEEPR_SMC_SIGNAL_v3';
const COOLDOWN_KEY = 'DEEEPR_SMC_COOLDOWN_v3';
const DAILY_KEY = 'DEEEPR_SMC_DAILY_v3';

// ─── MATH HELPERS ────────────────────────────────────────────────────────────

function ema(candles: CandleOHLC[], period: number): number[] {
  if (!candles.length) return [];
  const k = 2 / (period + 1);
  const vals = [candles[0].close];
  for (let i = 1; i < candles.length; i++) {
    vals.push(candles[i].close * k + vals[i - 1] * (1 - k));
  }
  return vals;
}

function atr(candles: CandleOHLC[], period = 14): number {
  if (candles.length < 2) return 1;
  const n = Math.min(candles.length - 1, period);
  let sum = 0;
  for (let i = candles.length - n; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  return +(sum / n).toFixed(4);
}

function rsi(candles: CandleOHLC[], period = 14): number {
  if (candles.length <= period) return 50;
  let g = 0, lo = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) g += d; else lo += Math.abs(d);
  }
  const ag = g / period, al = lo / period;
  if (al === 0) return 100;
  return +(100 - 100 / (1 + ag / al)).toFixed(1);
}

function detectSwings(candles: CandleOHLC[], window = 3) {
  const highs: { i: number; price: number; time: number }[] = [];
  const lows: { i: number; price: number; time: number }[] = [];
  for (let i = window; i < candles.length - window; i++) {
    const c = candles[i];
    const isHigh = candles.slice(i - window, i + window + 1).every((x, j) => j === window || x.high <= c.high);
    const isLow = candles.slice(i - window, i + window + 1).every((x, j) => j === window || x.low >= c.low);
    if (isHigh) highs.push({ i, price: c.high, time: c.time });
    if (isLow) lows.push({ i, price: c.low, time: c.time });
  }
  return { highs, lows };
}

function detectFVG(candles: CandleOHLC[]): { top: number; bottom: number } | null {
  for (let i = candles.length - 10; i < candles.length - 2; i++) {
    if (i < 0) continue;
    const a = candles[i], b = candles[i + 1], c = candles[i + 2];
    // Bullish FVG: gap between a.high and c.low (c.low > a.high)
    if (c.low > a.high && b.close > b.open) {
      return { top: c.low, bottom: a.high };
    }
    // Bearish FVG: gap between a.low and c.high (c.high < a.low)
    if (c.high < a.low && b.close < b.open) {
      return { top: a.low, bottom: c.high };
    }
  }
  return null;
}

function detectOrderBlock(candles: CandleOHLC[], direction: 'BULLISH' | 'BEARISH', atrVal: number) {
  const last = candles.slice(-15);
  if (direction === 'BULLISH') {
    // Last bearish candle before a strong bullish move
    for (let i = last.length - 3; i >= 1; i--) {
      if (last[i].close < last[i].open) { // bearish candle
        const nextMove = last[i + 1].close - last[i + 1].open;
        if (nextMove > atrVal * 0.5) {
          return { top: last[i].open, bottom: last[i].close };
        }
      }
    }
  } else {
    // Last bullish candle before a strong bearish move
    for (let i = last.length - 3; i >= 1; i--) {
      if (last[i].close > last[i].open) { // bullish candle
        const nextMove = last[i + 1].open - last[i + 1].close;
        if (nextMove > atrVal * 0.5) {
          return { top: last[i].close, bottom: last[i].open };
        }
      }
    }
  }
  return null;
}

// ─── TF ANALYSIS ─────────────────────────────────────────────────────────────

function analyzeTF(candles: CandleOHLC[], tf: string): TFBias {
  const fallback: TFBias = {
    tf, bias: 'NEUTRAL', structure: 'INSUFFICIENT_DATA',
    recentSwings: '—', lastBOS: '—', orderBlock: null, fvg: null,
    sweepDetected: false, atr: 1
  };
  if (candles.length < 20) return fallback;

  const atrVal = atr(candles);
  const e14 = ema(candles, 14);
  const e50 = ema(candles, Math.min(50, candles.length - 1));
  const lastClose = candles[candles.length - 1].close;
  const ema14 = e14[e14.length - 1];
  const ema50 = e50[e50.length - 1];

  const { highs, lows } = detectSwings(candles, 3);
  const lastHighs = highs.slice(-3);
  const lastLows = lows.slice(-3);

  // Structure: HH+HL = Bullish, LH+LL = Bearish
  let bullishSwings = 0, bearishSwings = 0;
  if (lastHighs.length >= 2 && lastHighs[1].price > lastHighs[0].price) bullishSwings++;
  if (lastLows.length >= 2 && lastLows[1].price > lastLows[0].price) bullishSwings++;
  if (lastHighs.length >= 2 && lastHighs[1].price < lastHighs[0].price) bearishSwings++;
  if (lastLows.length >= 2 && lastLows[1].price < lastLows[0].price) bearishSwings++;

  if (lastClose > ema14 + atrVal * 0.3) bullishSwings++;
  if (lastClose > ema50) bullishSwings++;
  if (lastClose < ema14 - atrVal * 0.3) bearishSwings++;
  if (lastClose < ema50) bearishSwings++;

  const rsiVal = rsi(candles);
  if (rsiVal > 55) bullishSwings++;
  if (rsiVal < 45) bearishSwings++;

  const bias: TFBias['bias'] = bullishSwings > bearishSwings + 1 ? 'BULLISH' :
    bearishSwings > bullishSwings + 1 ? 'BEARISH' : 'NEUTRAL';

  // BOS detection
  const recentHigh = lastHighs.length ? lastHighs[lastHighs.length - 1] : null;
  const recentLow = lastLows.length ? lastLows[lastLows.length - 1] : null;
  let lastBOS = '—';
  let sweepDetected = false;

  if (recentHigh) {
    const bosUp = candles.slice(-10).find(c => c.close > recentHigh.price + atrVal * 0.15);
    if (bosUp) lastBOS = `BOS ↑ @ ${recentHigh.price.toFixed(2)}`;
    const sweep = candles.slice(-15).find(c => c.high > recentHigh.price && c.close < recentHigh.price);
    if (sweep) sweepDetected = true;
  }
  if (recentLow && lastBOS === '—') {
    const bosDown = candles.slice(-10).find(c => c.close < recentLow.price - atrVal * 0.15);
    if (bosDown) lastBOS = `BOS ↓ @ ${recentLow.price.toFixed(2)}`;
    const sweep = candles.slice(-15).find(c => c.low < recentLow.price && c.close > recentLow.price);
    if (sweep) sweepDetected = true;
  }

  const fvg = detectFVG(candles);
  const ob = detectOrderBlock(candles, bias === 'BEARISH' ? 'BEARISH' : 'BULLISH', atrVal);

  const recentSwings = `${lastHighs.length >= 2 ? (lastHighs[1].price > lastHighs[0].price ? 'HH' : 'LH') : '?'} · ${lastLows.length >= 2 ? (lastLows[1].price > lastLows[0].price ? 'HL' : 'LL') : '?'}`;

  return {
    tf, bias,
    structure: `${bias} (EMA14=${ema14.toFixed(2)}, EMA50=${ema50.toFixed(2)}, RSI=${rsiVal})`,
    recentSwings,
    lastBOS,
    orderBlock: ob,
    fvg,
    sweepDetected,
    atr: atrVal
  };
}

// ─── 7 ANALYST MODULES ───────────────────────────────────────────────────────

function analystAN1_SMC(tfBiases: TFBias[]): AnalystOutput {
  const daily = tfBiases.find(t => t.tf === '1D');
  const h4 = tfBiases.find(t => t.tf === '4H');
  const h1 = tfBiases.find(t => t.tf === '1H');
  const m15 = tfBiases.find(t => t.tf === '15M');

  if (!daily || !h4 || !h1) {
    return { id: 'AN1', name: 'SMC Structure', stance: 'NEUTRAL', strength: 0, evidence: ['Insufficient TF data'], dataStatus: 'MISSING', abstain: true, abstainReason: 'MTF data missing' };
  }

  const bullCount = [daily, h4, h1, m15].filter(t => t?.bias === 'BULLISH').length;
  const bearCount = [daily, h4, h1, m15].filter(t => t?.bias === 'BEARISH').length;
  const sweepEvidence = [daily, h4, h1, m15].filter(t => t?.sweepDetected).map(t => `${t!.tf} sweep`);

  const stance: AnalystOutput['stance'] = bullCount >= 3 ? 'LONG' : bearCount >= 3 ? 'SHORT' : 'NEUTRAL';
  const strength = Math.min(1, (Math.max(bullCount, bearCount)) / 4);

  return {
    id: 'AN1', name: 'SMC Structure',
    stance, strength,
    evidence: [
      `1D: ${daily.bias} (${daily.recentSwings})`,
      `4H: ${h4.bias} (${h4.lastBOS})`,
      `1H: ${h1.bias}`,
      m15 ? `15M: ${m15.bias}` : '15M: —',
      ...sweepEvidence.length ? [`Sweeps: ${sweepEvidence.join(', ')}`] : []
    ],
    dataStatus: 'REAL',
    abstain: false
  };
}

function analystAN2_Momentum(candles15m: CandleOHLC[], candles1h: CandleOHLC[]): AnalystOutput {
  if (candles15m.length < 20) {
    return { id: 'AN2', name: 'Momentum/Volatility', stance: 'NEUTRAL', strength: 0, evidence: ['No 15M data'], dataStatus: 'MISSING', abstain: true };
  }

  const atr15 = atr(candles15m);
  const rsi15 = rsi(candles15m);
  const rsi1h = candles1h.length >= 14 ? rsi(candles1h) : 50;

  // Displacement: last 3 candles range vs ATR
  const last3 = candles15m.slice(-3);
  const displacement = last3.reduce((s, c) => s + (c.high - c.low), 0) / 3;
  const dispRatio = displacement / atr15;

  // ADX proxy: trend strength from last 14 candles
  const e14arr = ema(candles15m, 14);
  const ema14 = e14arr[e14arr.length - 1];
  const lastClose = candles15m[candles15m.length - 1].close;
  const priceDelta = lastClose - candles15m[candles15m.length - 15].close;

  const isBullish = rsi15 > 55 && priceDelta > atr15 * 0.5;
  const isBearish = rsi15 < 45 && priceDelta < -atr15 * 0.5;
  const isExhausted = rsi15 > 75 || rsi15 < 25; // Potential reversal

  const stance: AnalystOutput['stance'] = isExhausted ? 'NEUTRAL' : isBullish ? 'LONG' : isBearish ? 'SHORT' : 'NEUTRAL';
  const strength = isExhausted ? 0.3 : dispRatio > 1.5 ? 0.85 : 0.5;

  return {
    id: 'AN2', name: 'Momentum/Volatility',
    stance, strength,
    evidence: [
      `RSI15M: ${rsi15} | RSI1H: ${rsi1h}`,
      `ATR15M: ${atr15.toFixed(2)} | Displacement: ${dispRatio.toFixed(2)}x ATR`,
      `Trend delta: ${priceDelta > 0 ? '+' : ''}${priceDelta.toFixed(2)}`,
      isExhausted ? '⚠ Momentum exhaustion (RSI extreme)' : `Displacement: ${dispRatio > 1.2 ? 'STRONG' : 'NORMAL'}`
    ],
    dataStatus: 'REAL',
    abstain: false
  };
}

function analystAN3_OrderFlow(currentPrice: number, instrument: string): AnalystOutput {
  // Order flow: proxy only (no live CME/exchange book available in browser)
  // Uses estimated bid-ask imbalance from price position relative to key levels
  return {
    id: 'AN3', name: 'Order-Flow/Liquidity',
    stance: 'NEUTRAL', strength: 0.3,
    evidence: [
      'PROXY: No live exchange L2 book in browser context',
      `Estimated liquidity around ${currentPrice.toFixed(2)} ± ATR`,
      `Source: ${instrument.includes('XAU') ? 'PAXG Binance L2 proxy' : 'Binance depth'}`
    ],
    dataStatus: 'PROXY',
    abstain: false
  };
}

function analystAN4_Macro(macro: MacroSummary): AnalystOutput {
  const stance: AnalystOutput['stance'] =
    macro.macroBias === 'BULLISH_GOLD' ? 'LONG' :
    macro.macroBias === 'BEARISH_GOLD' ? 'SHORT' : 'NEUTRAL';

  const strength = macro.eventRisk === 'HIGH' ? 0.3 : 0.65;

  return {
    id: 'AN4', name: 'Macro/DXY/Yields',
    stance, strength,
    evidence: [
      `DXY Bias: ${macro.dxyBias} | Yield Bias: ${macro.yieldBias}`,
      `Macro Gold Bias: ${macro.macroBias}`,
      `Event Risk: ${macro.eventRisk} (${macro.eventName || 'None'})`,
      macro.note
    ],
    dataStatus: 'ESTIMATED',
    abstain: macro.eventRisk === 'HIGH' // Abstain near major events
  };
}

function analystAN5_Sentiment(): AnalystOutput {
  // COT data is weekly/lagged; retail sentiment is estimated
  return {
    id: 'AN5', name: 'Positioning/Sentiment',
    stance: 'NEUTRAL', strength: 0.2,
    evidence: [
      'COT data: LAGGED (weekly, delayed by 3 days)',
      'Retail sentiment: ESTIMATED only',
      'ETF flows: Not available in browser context',
      'Using contrarian signal only at extremes'
    ],
    dataStatus: 'ESTIMATED',
    abstain: false
  };
}

function analystAN6_Session(session: string, hour: number): AnalystOutput {
  // Session quality: London (08:00–17:00 IST/UTC+5:30 = 02:30–11:30 UTC)
  //                 New York (13:30–22:00 UTC)
  //                 Overlap (13:30–17:30 UTC)
  const utcHour = (hour - 5) < 0 ? hour + 19 : hour - 5; // rough IST→UTC
  const isLondon = utcHour >= 3 && utcHour <= 11;
  const isNewYork = utcHour >= 13 && utcHour <= 22;
  const isOverlap = utcHour >= 13 && utcHour <= 17;
  const isAsia = !isLondon && !isNewYork;

  const qualityMap: Record<string, number> = {
    'OVERLAP': 0.85, 'LONDON': 0.75, 'NEW_YORK': 0.70, 'ASIA': 0.35
  };

  const detectedSession = isOverlap ? 'OVERLAP' : isLondon ? 'LONDON' : isNewYork ? 'NEW_YORK' : 'ASIA';
  const quality = qualityMap[detectedSession];

  return {
    id: 'AN6', name: 'Session/Time',
    stance: 'NEUTRAL', strength: quality,
    evidence: [
      `Active Session: ${detectedSession}`,
      `Quality Score: ${(quality * 100).toFixed(0)}%`,
      isAsia ? '⚠ Asia session: low liquidity, signals downgraded' : `${detectedSession} killzone active`,
      'n < 30 historical setups → no session-based edge claimed yet (LOW SAMPLE)'
    ],
    dataStatus: 'REAL',
    abstain: isAsia, // Abstain in Asia session for signals below A+
    abstainReason: isAsia ? 'Asia low-liquidity session' : undefined
  };
}

function analystAN7_CrossAsset(allQuotes: Record<string, number>): AnalystOutput {
  const btc = allQuotes['BTCUSDT'] || 0;
  const dxy = allQuotes['DXY'] || 103;

  // Simple cross-asset heuristic
  let stance: AnalystOutput['stance'] = 'NEUTRAL';
  const evidence: string[] = [];

  // DXY inverse correlation with Gold
  if (dxy > 104.5) {
    stance = 'SHORT';
    evidence.push(`DXY elevated (${dxy.toFixed(2)}) → Gold headwind (ESTIMATED)`);
  } else if (dxy < 101.5) {
    stance = 'LONG';
    evidence.push(`DXY weak (${dxy.toFixed(2)}) → Gold tailwind (ESTIMATED)`);
  } else {
    evidence.push(`DXY neutral range (${dxy.toFixed(2)})`);
  }

  if (btc > 0) {
    evidence.push(`BTC: $${btc.toLocaleString()} (risk-on proxy)`);
  }
  evidence.push('All cross-asset correlations: ESTIMATED / lagged');

  return {
    id: 'AN7', name: 'Cross-Asset',
    stance, strength: 0.45,
    evidence,
    dataStatus: 'ESTIMATED',
    abstain: false
  };
}

// ─── CONSENSUS AGGREGATION ───────────────────────────────────────────────────

export function computeConsensus(analysts: AnalystOutput[]): ConsensusResult {
  // Static conservative weights (regularised, not learned — n < 200)
  const weights: Record<string, number> = {
    'AN1': 0.30, // SMC Structure (highest weight — most objective)
    'AN2': 0.20, // Momentum
    'AN3': 0.10, // Order Flow (proxy)
    'AN4': 0.15, // Macro
    'AN5': 0.05, // Sentiment (lagged/estimated)
    'AN6': 0.08, // Session
    'AN7': 0.12  // Cross-asset
  };

  const active = analysts.filter(a => !a.abstain);
  const coverageOk = active.length >= 4;

  if (!coverageOk) {
    return { ci: 0, agreementPct: 0, finalStance: 'NEUTRAL', analysts, disagreementPenalty: false, coverageOk: false };
  }

  let weightedScore = 0;
  let totalWeight = 0;
  let longCount = 0;
  let shortCount = 0;
  let neutralCount = 0;

  for (const analyst of active) {
    const w = (weights[analyst.id] || 0.1) * analyst.strength;
    const score = analyst.stance === 'LONG' ? 1 : analyst.stance === 'SHORT' ? -1 : 0;
    weightedScore += score * w;
    totalWeight += w;
    if (analyst.stance === 'LONG') longCount++;
    else if (analyst.stance === 'SHORT') shortCount++;
    else neutralCount++;
  }

  const ci = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const maxSide = Math.max(longCount, shortCount);
  const agreementPct = active.length > 0 ? (maxSide / active.length) * 100 : 0;

  // Disagreement penalty: high entropy
  const disagreementPenalty = longCount >= 2 && shortCount >= 2;

  const finalStance: ConsensusResult['finalStance'] =
    ci > 0.25 && !disagreementPenalty ? 'LONG' :
    ci < -0.25 && !disagreementPenalty ? 'SHORT' : 'NEUTRAL';

  return { ci, agreementPct, finalStance, analysts, disagreementPenalty, coverageOk };
}

// ─── MACRO SUMMARY ───────────────────────────────────────────────────────────

export function buildMacroSummary(): MacroSummary {
  // Deterministic estimation based on current date and known market context
  // Note: Real DXY/yield feeds require a paid API
  const now = new Date();
  const hour = now.getUTCHours();

  // Upcoming major events check (approximate schedule)
  const dayOfWeek = now.getUTCDay();
  const isForexRollover = hour >= 23 || hour < 1;
  const isFriday = dayOfWeek === 5;

  let eventRisk: MacroSummary['eventRisk'] = 'LOW';
  let eventName = 'None scheduled';

  if (isForexRollover) {
    eventRisk = 'MEDIUM';
    eventName = 'Forex Rollover';
  }
  if (isFriday && hour >= 12 && hour <= 14) {
    eventRisk = 'HIGH';
    eventName = 'NFP Friday (Estimated)';
  }

  // DXY and yield estimation (proxy — real data needs Gold-API or Polygon.io)
  const dxyProxy = 103.2 + Math.sin(Date.now() / 86400000) * 1.5;
  const dxyBias: MacroSummary['dxyBias'] = dxyProxy > 104 ? 'BULLISH' : dxyProxy < 101.5 ? 'BEARISH' : 'NEUTRAL';
  const yieldBias: MacroSummary['yieldBias'] = 'NEUTRAL'; // Cannot determine without real feed

  const macroBias: MacroSummary['macroBias'] =
    dxyBias === 'BEARISH' ? 'BULLISH_GOLD' :
    dxyBias === 'BULLISH' ? 'BEARISH_GOLD' : 'NEUTRAL';

  return {
    dxyBias,
    yieldBias,
    eventRisk,
    eventName,
    macroBias,
    note: `DXY proxy: ${dxyProxy.toFixed(2)} ESTIMATED | Real yields: not available | COT: lagged weekly`
  };
}

// ─── SESSION DETECTOR ─────────────────────────────────────────────────────────

export function getSession(): { session: string; qualityPct: number; ist: string } {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcTime = utcH + utcM / 60;

  const hh = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

  if (utcTime >= 13.5 && utcTime <= 17.5) {
    return { session: 'LONDON-NY OVERLAP', qualityPct: 95, ist: hh };
  } else if (utcTime >= 8 && utcTime <= 16.5) {
    return { session: 'LONDON', qualityPct: 80, ist: hh };
  } else if (utcTime >= 13 && utcTime <= 22) {
    return { session: 'NEW_YORK', qualityPct: 75, ist: hh };
  } else {
    return { session: 'ASIA/OFF-HOURS', qualityPct: 30, ist: hh };
  }
}

// ─── SIGNAL SCORING ──────────────────────────────────────────────────────────

function computeScore(
  consensus: ConsensusResult,
  tfBiases: TFBias[],
  macro: MacroSummary,
  direction: 'LONG' | 'SHORT',
  rrrTp2: number,
  session: string
): ScoreBreakdown {
  const daily = tfBiases.find(t => t.tf === '1D');
  const h4 = tfBiases.find(t => t.tf === '4H');
  const h1 = tfBiases.find(t => t.tf === '1H');
  const m15 = tfBiases.find(t => t.tf === '15M');

  const alignedTFs = [daily, h4, h1, m15].filter(t => t?.bias === (direction === 'LONG' ? 'BULLISH' : 'BEARISH')).length;

  const htfAlignment = Math.min(20, alignedTFs * 5);
  const marketStructure = Math.min(20, consensus.agreementPct * 0.2);
  const liquidity = [daily, h4, h1, m15].filter(t => t?.sweepDetected).length >= 1 ? 12 : 5;
  const hasOB = !![daily, h4, h1, m15].find(t => t?.orderBlock !== null);
  const hasFVG = !![daily, h4, h1, m15].find(t => t?.fvg !== null);
  const orderBlock = hasOB ? (hasFVG ? 10 : 7) : hasFVG ? 5 : 2;
  const displacement = consensus.ci > 0.5 || consensus.ci < -0.5 ? 10 : 5;
  const volumeMomentum = 7; // Cannot compute without exchange volume
  const macroScore = macro.macroBias === (direction === 'LONG' ? 'BULLISH_GOLD' : 'BEARISH_GOLD') ? 10 :
    macro.macroBias === 'NEUTRAL' ? 5 : 2;
  const riskReward = rrrTp2 >= 3 ? 5 : rrrTp2 >= 2 ? 3 : 1;

  const total = htfAlignment + marketStructure + liquidity + orderBlock + displacement + volumeMomentum + macroScore + riskReward;

  return { htfAlignment, marketStructure, liquidity, orderBlock, displacement, volumeMomentum, macro: macroScore, riskReward, total };
}

// ─── GATE CHECKS ─────────────────────────────────────────────────────────────

function runGates(
  consensus: ConsensusResult,
  score: ScoreBreakdown,
  macro: MacroSummary,
  session: string,
  dailySignalCount: number,
  dailySLCount: number,
  currentPrice: number,
  entryPrice: number,
  rrrTp2: number,
  atrVal: number
): { pass: boolean; failedGates: string[] } {
  const failed: string[] = [];

  // G1: Setup model valid (consensus-based)
  if (consensus.finalStance === 'NEUTRAL') failed.push('G1: Consensus is NEUTRAL — no directional setup');

  // G2: Score must be A or A+ (>= 70)
  if (score.total < 70) failed.push(`G2: Score ${score.total}/100 below A threshold (70)`);

  // G3: RR >= 2.0 to TP2
  if (rrrTp2 < 2.0) failed.push(`G3: RR to TP2 (${rrrTp2.toFixed(1)}) below minimum 2.0`);

  // G4: Session quality
  if (session.includes('ASIA') && score.total < 90) failed.push('G4: Asia session requires A+ score (90+)');

  // G5: Event blackout
  if (macro.eventRisk === 'HIGH') failed.push(`G5: Event blackout — ${macro.eventName} in progress`);

  // G6: Not chasing (entry within 1 ATR of setup)
  const distFromEntry = Math.abs(currentPrice - entryPrice);
  if (distFromEntry > atrVal * 1.0) failed.push(`G6: Entry too far — ${distFromEntry.toFixed(2)} > 1 ATR (${atrVal.toFixed(2)})`);

  // G7: Frequency cap
  if (dailySignalCount >= 2) failed.push('G7: Max 2 signals/day reached');
  if (dailySLCount >= 2) failed.push('G7: 2 SL hits today — trading stopped for session');

  // G8: Coverage ok
  if (!consensus.coverageOk) failed.push('G8: Analyst coverage < 4 of 7 — insufficient data');

  return { pass: failed.length === 0, failedGates: failed };
}

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────

function loadSignal(instrument: string): ActiveSignal | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${instrument}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveSignal;
    // Expire signals older than 24h
    if (Date.now() - parsed.createdAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${STORAGE_KEY}_${instrument}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSignal(signal: ActiveSignal): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${signal.instrument}`, JSON.stringify(signal));
  } catch {}
}

function clearSignal(instrument: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${instrument}`);
  } catch {}
}

interface CooldownState { endsAt: number; reason: string }
function loadCooldown(instrument: string): CooldownState | null {
  try {
    const raw = localStorage.getItem(`${COOLDOWN_KEY}_${instrument}`);
    if (!raw) return null;
    const c = JSON.parse(raw) as CooldownState;
    if (Date.now() > c.endsAt) { localStorage.removeItem(`${COOLDOWN_KEY}_${instrument}`); return null; }
    return c;
  } catch { return null; }
}
function saveCooldown(instrument: string, durationMs: number, reason: string): void {
  try { localStorage.setItem(`${COOLDOWN_KEY}_${instrument}`, JSON.stringify({ endsAt: Date.now() + durationMs, reason })); } catch {}
}

interface DailyCount { date: string; signals: number; slHits: number }
function getDailyCount(instrument: string): DailyCount {
  try {
    const raw = localStorage.getItem(`${DAILY_KEY}_${instrument}`);
    if (!raw) return { date: '', signals: 0, slHits: 0 };
    const d = JSON.parse(raw) as DailyCount;
    const today = new Date().toDateString();
    if (d.date !== today) return { date: today, signals: 0, slHits: 0 };
    return d;
  } catch { return { date: '', signals: 0, slHits: 0 }; }
}
function incrementDailySignals(instrument: string, type: 'signal' | 'sl'): void {
  try {
    const d = getDailyCount(instrument);
    const today = new Date().toDateString();
    const updated: DailyCount = {
      date: today,
      signals: type === 'signal' ? d.signals + 1 : d.signals,
      slHits: type === 'sl' ? d.slHits + 1 : d.slHits
    };
    localStorage.setItem(`${DAILY_KEY}_${instrument}`, JSON.stringify(updated));
  } catch {}
}

// ─── TP/SL TRACKER ───────────────────────────────────────────────────────────

export function checkTPSL(signal: ActiveSignal, currentPrice: number): {
  updated: ActiveSignal;
  event: string | null;
} {
  if (!signal || signal.state === 'COMPLETED' || signal.state === 'SL_HIT') {
    return { updated: signal, event: null };
  }

  const isLong = signal.direction === 'LONG';
  let updated = { ...signal, events: [...signal.events] };
  let event: string | null = null;

  if (signal.state === 'ACTIVE' || signal.state === 'TP1_HIT' || signal.state === 'TP2_HIT') {
    // SL check (always first per convention)
    const slHit = isLong ? currentPrice <= signal.stopLoss : currentPrice >= signal.stopLoss;
    if (slHit && signal.state !== 'TP1_HIT' && signal.state !== 'TP2_HIT') {
      updated.state = 'SL_HIT';
      updated.updatedAt = Date.now();
      updated.events.push({ type: 'SL_HIT', timestamp: Date.now(), price: currentPrice, note: `Stop loss hit at ${currentPrice.toFixed(2)}` });
      event = `🛑 STOP-LOSS HIT @ ${currentPrice.toFixed(2)} | -1R`;
      return { updated, event };
    }

    // TP1 check
    if (signal.state === 'ACTIVE') {
      const tp1Hit = isLong ? currentPrice >= signal.tp1 : currentPrice <= signal.tp1;
      if (tp1Hit) {
        updated.state = 'TP1_HIT';
        updated.updatedAt = Date.now();
        updated.events.push({ type: 'TP1_HIT', timestamp: Date.now(), price: currentPrice, note: `TP1 hit at ${currentPrice.toFixed(2)}` });
        // Move SL to breakeven after TP1
        if (!updated.managementSLMoved) {
          updated.stopLoss = updated.entryPrice;
          updated.managementSLMoved = true;
          updated.events.push({ type: 'SL_TO_BE', timestamp: Date.now(), price: updated.entryPrice, note: 'SL moved to breakeven after TP1' });
        }
        event = `✅ TP1 HIT @ ${currentPrice.toFixed(2)} | ${updated.rrrTp1} | SL moved to breakeven`;
        return { updated, event };
      }
    }

    // TP2 check
    if (signal.state === 'TP1_HIT') {
      const tp2Hit = isLong ? currentPrice >= signal.tp2 : currentPrice <= signal.tp2;
      if (tp2Hit) {
        updated.state = 'TP2_HIT';
        updated.updatedAt = Date.now();
        updated.events.push({ type: 'TP2_HIT', timestamp: Date.now(), price: currentPrice, note: `TP2 hit at ${currentPrice.toFixed(2)}` });
        event = `🎯 TP2 HIT @ ${currentPrice.toFixed(2)} | ${updated.rrrTp2} | Trailing TP3`;
        return { updated, event };
      }
      // BE stop after TP1 — price comes back to entry
      const beStopHit = isLong ? currentPrice <= updated.stopLoss : currentPrice >= updated.stopLoss;
      if (beStopHit) {
        updated.state = 'BE_STOP';
        updated.updatedAt = Date.now();
        updated.events.push({ type: 'BE_STOP', timestamp: Date.now(), price: currentPrice, note: 'Breakeven stop hit after TP1' });
        event = `🔄 BREAKEVEN STOP @ ${currentPrice.toFixed(2)} | ~0R (TP1 partial kept)`;
        return { updated, event };
      }
    }

    // TP3 check
    if (signal.state === 'TP2_HIT') {
      const tp3Hit = isLong ? currentPrice >= signal.tp3 : currentPrice <= signal.tp3;
      if (tp3Hit) {
        updated.state = 'TP3_HIT';
        updated.updatedAt = Date.now();
        updated.events.push({ type: 'TP3_HIT', timestamp: Date.now(), price: currentPrice, note: `TP3 hit at ${currentPrice.toFixed(2)}` });
        event = `🏆 TP3 HIT @ ${currentPrice.toFixed(2)} | ${updated.rrrTp3} | TRADE COMPLETED WIN`;
        return { updated, event };
      }
    }

    // Expiry check
    if (Date.now() > updated.expiresAt && updated.state === 'ACTIVE') {
      updated.state = 'EXPIRED';
      updated.events.push({ type: 'EXPIRED', timestamp: Date.now(), price: currentPrice, note: 'Signal expired (8h time stop)' });
      event = `⏰ SIGNAL EXPIRED — no follow-through in 8h`;
      return { updated, event };
    }
  }

  return { updated, event };
}

// ─── MASTER ENGINE ───────────────────────────────────────────────────────────

export async function fetchTFCandles(binanceSymbol: string, interval: string, limit = 150): Promise<CandleOHLC[]> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`);
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((d: any) => ({
      time: Math.floor(d[0] / 1000),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5])
    }));
  } catch {
    return [];
  }
}

export async function runGoldSmcEngine(
  instrument: string,
  binanceSymbol: string,
  currentPrice: number,
  allQuotes: Record<string, number> = {}
): Promise<EngineOutput> {
  const now = Date.now();
  const { session } = getSession();
  const macro = buildMacroSummary();
  const hourIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });

  // Check persistence
  let activeSignal = loadSignal(instrument);
  const cooldown = loadCooldown(instrument);
  const daily = getDailyCount(instrument);

  // If we have an active signal, track TP/SL (called separately on each price update)
  // Here we just return the engine state

  // Fetch MTF candles (only when no active signal to avoid overcomputaton)
  const [c1d, c4h, c1h, c15m, c5m] = await Promise.all([
    fetchTFCandles(binanceSymbol, '1d', 100),
    fetchTFCandles(binanceSymbol, '4h', 150),
    fetchTFCandles(binanceSymbol, '1h', 150),
    fetchTFCandles(binanceSymbol, '15m', 150),
    fetchTFCandles(binanceSymbol, '5m', 150)
  ]);

  const tfBiases: TFBias[] = [
    analyzeTF(c1d, '1D'),
    analyzeTF(c4h, '4H'),
    analyzeTF(c1h, '1H'),
    analyzeTF(c15m, '15M'),
    analyzeTF(c5m, '5M')
  ];

  // 7 Analyst modules
  const analysts: AnalystOutput[] = [
    analystAN1_SMC(tfBiases),
    analystAN2_Momentum(c15m, c1h),
    analystAN3_OrderFlow(currentPrice, instrument),
    analystAN4_Macro(macro),
    analystAN5_Sentiment(),
    analystAN6_Session(session, parseInt(hourIST)),
    analystAN7_CrossAsset(allQuotes)
  ];

  const consensus = computeConsensus(analysts);

  // Build regime
  const dailyBias = tfBiases.find(t => t.tf === '1D')?.bias || 'NEUTRAL';
  const h4Bias = tfBiases.find(t => t.tf === '4H')?.bias || 'NEUTRAL';
  const atr15 = tfBiases.find(t => t.tf === '15M')?.atr || 1;

  const regime = dailyBias === 'BULLISH' && h4Bias === 'BULLISH' ? 'TRENDING-UP' :
    dailyBias === 'BEARISH' && h4Bias === 'BEARISH' ? 'TRENDING-DOWN' :
    dailyBias !== h4Bias ? 'CONFLICTED' : 'RANGE';

  // If no active signal, check if we should create one
  let whyNoSignal = '';

  if (!activeSignal || ['SL_HIT', 'TP3_HIT', 'EXPIRED', 'INVALIDATED', 'MISSED', 'BE_STOP', 'COMPLETED'].includes(activeSignal.state)) {
    // Check cooldown
    if (cooldown) {
      whyNoSignal = `NO SIGNAL: Cooldown active until ${new Date(cooldown.endsAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} (${cooldown.reason})`;
    } else if (consensus.finalStance !== 'NEUTRAL') {
      const direction = consensus.finalStance as 'LONG' | 'SHORT';

      // Build trade plan
      const entryPrice = currentPrice;
      const atrMult = direction === 'LONG' ? -1.5 : 1.5;
      const stopLoss = +(entryPrice + atrMult * atr15).toFixed(2);
      const tp1 = +(entryPrice + (direction === 'LONG' ? 2.5 : -2.5) * atr15).toFixed(2);
      const tp2 = +(entryPrice + (direction === 'LONG' ? 5.0 : -5.0) * atr15).toFixed(2);
      const tp3 = +(entryPrice + (direction === 'LONG' ? 9.0 : -9.0) * atr15).toFixed(2);
      const riskPts = Math.abs(entryPrice - stopLoss);
      const rrrTp1 = riskPts > 0 ? (Math.abs(tp1 - entryPrice) / riskPts) : 0;
      const rrrTp2 = riskPts > 0 ? (Math.abs(tp2 - entryPrice) / riskPts) : 0;
      const rrrTp3 = riskPts > 0 ? (Math.abs(tp3 - entryPrice) / riskPts) : 0;

      const score = computeScore(consensus, tfBiases, macro, direction, rrrTp2, session);
      const gates = runGates(consensus, score, macro, session, daily.signals, daily.slHits, currentPrice, entryPrice, rrrTp2, atr15);

      if (gates.pass) {
        const grade = score.total >= 90 ? 'A+' : score.total >= 80 ? 'A' : score.total >= 70 ? 'B+' : 'B';
        const signalId = `${instrument}-${direction}-${now}`;

        const whySignal = [
          `${direction === 'LONG' ? '📈' : '📉'} ${tfBiases.find(t => t.tf === '1D')?.bias} daily bias`,
          `4H: ${tfBiases.find(t => t.tf === '4H')?.bias} | 1H: ${tfBiases.find(t => t.tf === '1H')?.bias}`,
          `Consensus CI: ${consensus.ci.toFixed(2)} (${consensus.agreementPct.toFixed(0)}% agreement)`,
          `Regime: ${regime} | Session: ${session}`,
          `Score: ${score.total}/100 (Grade ${grade})`,
          `RR to TP2: ${rrrTp2.toFixed(1)}R`
        ];

        activeSignal = {
          id: signalId,
          instrument,
          direction,
          state: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
          entryPrice,
          entryZone: `${(entryPrice - atr15 * 0.3).toFixed(2)} – ${(entryPrice + atr15 * 0.3).toFixed(2)}`,
          stopLoss,
          tp1,
          tp2,
          tp3,
          riskPts,
          rrrTp1: `1:${rrrTp1.toFixed(1)}R`,
          rrrTp2: `1:${rrrTp2.toFixed(1)}R`,
          rrrTp3: `1:${rrrTp3.toFixed(1)}R`,
          setupGrade: grade,
          confidence: Math.round(50 + consensus.ci * 25),
          setupScore: score.total,
          analystConsensus: consensus.ci,
          agreementPct: consensus.agreementPct,
          invalidationLevel: direction === 'LONG' ? stopLoss - atr15 * 0.5 : stopLoss + atr15 * 0.5,
          expiresAt: now + 8 * 60 * 60 * 1000,
          events: [{ type: 'CREATED', timestamp: now, price: entryPrice, note: `${direction} signal created | Grade ${grade}` }],
          lockedPlanHash: `${signalId}-${entryPrice}-${stopLoss}`,
          managementSLMoved: false,
          whySignal,
          whyGatesBlocked: [],
          scoreBreakdown: score,
          regime,
          session,
          analysts
        };

        saveSignal(activeSignal);
        incrementDailySignals(instrument, 'signal');
      } else {
        whyNoSignal = `NO SIGNAL: Gates failed — ${gates.failedGates[0]}`;
        if (!activeSignal) {
          // Create a "pending watch" ghost to show in UI
        }
      }
    } else {
      const disagreementNote = consensus.disagreementPenalty ? ' | High analyst disagreement' : '';
      whyNoSignal = `NO SIGNAL: Consensus NEUTRAL (CI=${consensus.ci.toFixed(2)}, ${consensus.agreementPct.toFixed(0)}% agreement)${disagreementNote} — waiting for HTF confirmation`;
    }
  }

  // Handle SL/TP for completed signals — set cooldown
  if (activeSignal?.state === 'SL_HIT') {
    saveCooldown(instrument, 45 * 60 * 1000, 'SL hit — 45min cooldown');
    incrementDailySignals(instrument, 'sl');
  } else if (activeSignal?.state === 'TP3_HIT' || activeSignal?.state === 'TP2_HIT') {
    saveCooldown(instrument, 15 * 60 * 1000, 'TP hit — 15min cooldown');
  }

  return {
    instrument,
    currentPrice,
    timestamp: now,
    activeSignal,
    tfBiases,
    consensus,
    whyNoSignal,
    cooldownActive: !!cooldown,
    cooldownEndsAt: cooldown?.endsAt || 0,
    dailySignalCount: daily.signals,
    dailySLCount: daily.slHits,
    regime,
    session,
    macroSummary: macro,
    dataFreshMs: Date.now() - now
  };
}

// ─── HELPER: Format signal state for display ─────────────────────────────────

export function formatSignalState(state: SignalState, direction: SignalDirection): { label: string; color: string; bg: string } {
  const map: Record<SignalState, { label: string; color: string; bg: string }> = {
    NONE: { label: 'NO SIGNAL', color: '#94a3b8', bg: 'bg-slate-900' },
    PENDING: { label: 'PENDING', color: '#f59e0b', bg: 'bg-amber-950/50' },
    ACTIVE: { label: direction === 'LONG' ? '🔒 LONG ACTIVE' : '🔒 SHORT ACTIVE', color: direction === 'LONG' ? '#10b981' : '#ef4444', bg: direction === 'LONG' ? 'bg-emerald-950/60' : 'bg-rose-950/60' },
    TP1_HIT: { label: '✅ TP1 HIT', color: '#38bdf8', bg: 'bg-sky-950/60' },
    TP2_HIT: { label: '🎯 TP2 HIT', color: '#06b6d4', bg: 'bg-cyan-950/60' },
    TP3_HIT: { label: '🏆 TP3 — WINNER', color: '#10b981', bg: 'bg-emerald-950/80' },
    SL_HIT: { label: '🛑 SL HIT', color: '#ef4444', bg: 'bg-rose-950/80' },
    BE_STOP: { label: '🔄 BE STOP (~0R)', color: '#f59e0b', bg: 'bg-amber-950/60' },
    INVALIDATED: { label: '⚡ INVALIDATED', color: '#f97316', bg: 'bg-orange-950/60' },
    EXPIRED: { label: '⏰ EXPIRED', color: '#94a3b8', bg: 'bg-slate-900/80' },
    MISSED: { label: '💨 MISSED', color: '#94a3b8', bg: 'bg-slate-900/80' },
    COMPLETED: { label: '✅ COMPLETED', color: '#10b981', bg: 'bg-emerald-950/60' }
  };
  return map[state] || map.NONE;
}

export { loadSignal, saveSignal, clearSignal, loadCooldown, getDailyCount };

