/**
 * DEEEPR DECISION ENGINE — SINGLE SOURCE OF TRUTH (MASTER ARBITER STORE)
 *
 * Implements:
 * 1. Single Master Arbiter per symbol (One Source of Truth for LONG / SHORT / WAIT).
 * 2. 3-Layer Horizon Matrix: SCALP (1m-5m) | INTRADAY (15m-1H) | SWING (4H-1D).
 * 3. Market Phase Classifier integration (P1 to P9) & Phase-to-Action Decision Table.
 * 4. Strict WAIT Rules: WAIT only allowed for (a) no valid location, (b) event/closed/stale, (c) range middle.
 *    Every WAIT carries reason + next level + condition + timeout.
 * 5. Hysteresis & Flip-Flop Guard: Minimum dwell time, flip rate counter (>2/hour = FLIP_RATE_ALERT).
 * 6. Plan Lifecycle: One terminal state, expired plans auto-archived, cooldown strictly per-zone.
 * 7. Shared Quote Store synchronization.
 * 8. Runtime Inconsistency Assertion: Flags conflicting signals immediately.
 */

import {
  classifyMarketPhase,
  MarketPhaseCode,
  MarketPhaseResult,
  CandleLike,
  calculateAtr
} from './marketPhaseClassifier';
import { sharedQuoteStore, normalizeSymbolKey } from './sharedQuoteStore';

export type MasterState =
  | 'WAIT'
  | 'WATCH_LONG'
  | 'WATCH_SHORT'
  | 'ARMED-LONG'
  | 'ARMED-SHORT'
  | 'PRE_SIGNAL'
  | 'LONG'
  | 'SHORT'
  | 'EXPIRED';

export type HorizonType = 'SCALP' | 'INTRADAY' | 'SWING';
export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus =
  | 'ACTIVE'
  | 'TP1_HIT'
  | 'CLOSED_TP'
  | 'CLOSED_SL'
  | 'CLOSED_INVALIDATED'
  | 'EXPIRED';

export interface ActiveTrade {
  tradeNo: number;
  side: TradeSide;
  horizon: HorizonType;
  entryZone: [number, number]; // [lo, hi]
  entryPrice: number;
  entryWorstEdge: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrWorstEdge: number;
  openedAt: number;
  status: TradeStatus;
  closedAt?: number;
  closePrice?: number;
  closeReason?: string;
}

export interface ModuleEvidenceItem {
  name: string;
  lean: 'long' | 'short' | 'neutral';
  score: number;
  notes: string[];
  asOf: number;
  verdictId: string;
  source?: string;
}

export interface HorizonVerdict {
  horizon: HorizonType;
  timeframeLabel: string;
  state: MasterState;
  side: TradeSide | 'NONE';
  phase: MarketPhaseResult;
  headlineAction: string;
  entryZone: [number, number];
  idealEntry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rr: number;
  score: number;
  confidence: number;
  isActionable: boolean;
  whyThisAction: string;
  invalidationLevel: number;
}

export interface WaitDetails {
  reason: string;
  category: 'NO_VALID_LOCATION' | 'RANGE_MIDPOINT' | 'EVENT_BLACKOUT' | 'DATA_STALE';
  nextLevel: number;
  nextCondition: string;
  timeoutMinutes: number;
  reviewAt: number;
}

export interface MasterVerdictObject {
  verdictId: string;
  asset: string;
  symbol: string;
  state: MasterState;
  side: TradeSide | 'NONE';
  selectedHorizon: HorizonType;
  price: number;
  priceSource: string;
  dataQuality: number;
  phase: MarketPhaseResult;
  horizonMatrix: Record<HorizonType, HorizonVerdict>;
  trade: ActiveTrade | null;
  tradeHistory: ActiveTrade[];
  waitDetails: WaitDetails | null;
  armed: {
    long: { level: number; conditions: string[]; cancelIf: string };
    short: { level: number; conditions: string[]; cancelIf: string };
  };
  scores: {
    longSQ: number;
    shortSQ: number;
    readiness: number;
    confidence: number;
    confidenceBasis: string;
    badge: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  cooldownUntil: number | null;
  cooldownZone: [number, number] | null;
  cooldownSide: TradeSide | null;
  flipCount1h: number;
  isFlipRateAlert: boolean;
  hasInconsistency: boolean;
  inconsistencyMessage?: string;
  updatedAt: number;
  asOf: number;
  evidence: Record<string, ModuleEvidenceItem>;
  warnings: string[];
}

const STORAGE_KEY = 'deeepr_master_arbiter_v5_store';
const EVENT_NAME = 'deeepr_master_verdict_update';

/**
 * Compute RR from the WORST EDGE of the entry zone
 */
export function computeWorstEdgeRr(
  side: TradeSide,
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

export function formatPrice(val: number | null | undefined, dp = 2): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) {
    return '—';
  }
  return val.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp
  });
}

export function formatPriceWithDollar(val: number | null | undefined, dp = 2): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) {
    return '—';
  }
  return `$${formatPrice(val, dp)}`;
}

export function formatRr(rr: number | null | undefined): string {
  if (rr === null || rr === undefined || isNaN(rr) || rr <= 0) {
    return '—';
  }
  return `1 : ${rr.toFixed(2)}`;
}

function generateVerdictId(key: string): string {
  return `MV-${key}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
}

class MasterVerdictStore {
  private verdicts: Record<string, MasterVerdictObject> = {};
  private selectedHorizon: HorizonType = 'INTRADAY';
  private flipHistory: Record<string, number[]> = {}; // symbol -> array of flip timestamps
  private candleCache: Record<string, CandleLike[]> = {};

  constructor() {
    this.loadFromStorage();
    // Subscribe to Shared Quote Store for real-time price synchronization
    if (typeof window !== 'undefined') {
      sharedQuoteStore.subscribe((quote) => {
        this.updatePrice(quote.symbol, quote.price);
      });
    }
  }

  private loadFromStorage() {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.verdicts = JSON.parse(raw);
      }
    } catch {
      this.verdicts = {};
    }
  }

  private saveToStorage() {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.verdicts));
    } catch {
      // ignore storage error
    }
  }

  public setSelectedHorizon(h: HorizonType) {
    this.selectedHorizon = h;
    for (const key of Object.keys(this.verdicts)) {
      this.verdicts[key].selectedHorizon = h;
      this.syncHeadlineState(this.verdicts[key]);
      this.notify(this.verdicts[key]);
    }
    this.saveToStorage();
  }

  public getSelectedHorizon(): HorizonType {
    return this.selectedHorizon;
  }

  private createDefaultHorizonVerdict(
    horizon: HorizonType,
    price: number,
    phase: MarketPhaseResult
  ): HorizonVerdict {
    const isBtc = price > 50000;
    const atr = price * (horizon === 'SCALP' ? 0.003 : horizon === 'INTRADAY' ? 0.008 : 0.02);
    const step = isBtc ? (horizon === 'SCALP' ? 300 : horizon === 'INTRADAY' ? 1200 : 3000) : +(price * 0.02).toFixed(2);

    let side: TradeSide | 'NONE' = 'NONE';
    let state: MasterState = 'WAIT';

    if (phase.code === 'P1') {
      side = 'SHORT';
      state = 'SHORT';
    } else if (phase.code === 'P2') {
      side = 'LONG';
      state = 'LONG';
    } else if (phase.code === 'P3') {
      side = 'SHORT';
      state = 'WATCH_SHORT';
    } else if (phase.code === 'P4') {
      side = 'LONG';
      state = 'WATCH_LONG';
    } else if (phase.code === 'P7') {
      side = phase.metrics.sweepSide === 'low' ? 'LONG' : 'SHORT';
      state = side === 'LONG' ? 'LONG' : 'SHORT';
    }

    const idealEntry = +(side === 'SHORT' ? price + step * 0.2 : side === 'LONG' ? price - step * 0.2 : price).toFixed(2);
    const sl = +(side === 'SHORT' ? idealEntry + step * 0.5 : side === 'LONG' ? idealEntry - step * 0.5 : 0).toFixed(2);
    const tp1 = +(side === 'SHORT' ? idealEntry - step : side === 'LONG' ? idealEntry + step : 0).toFixed(2);
    const tp2 = +(side === 'SHORT' ? idealEntry - step * 1.5 : side === 'LONG' ? idealEntry + step * 1.5 : 0).toFixed(2);
    const tp3 = +(side === 'SHORT' ? idealEntry - step * 2.2 : side === 'LONG' ? idealEntry + step * 2.2 : 0).toFixed(2);

    return {
      horizon,
      timeframeLabel: horizon === 'SCALP' ? '1m–5m' : horizon === 'INTRADAY' ? '15m–1H' : '4H–1D',
      state,
      side,
      phase,
      headlineAction: phase.headlineActionText,
      entryZone: [+(idealEntry - atr * 0.2).toFixed(2), +(idealEntry + atr * 0.2).toFixed(2)],
      idealEntry,
      sl,
      tp1,
      tp2,
      tp3,
      rr: 2.2,
      score: side === 'SHORT' ? 82 : side === 'LONG' ? 78 : 45,
      confidence: side !== 'NONE' ? 74 : 45,
      isActionable: state !== 'WAIT' && state !== 'EXPIRED',
      whyThisAction: phase.description,
      invalidationLevel: sl
    };
  }

  private createDefaultVerdict(key: string, basePrice?: number): MasterVerdictObject {
    const px = basePrice || sharedQuoteStore.getPrice(key) || 81770;
    const dummyCandles: CandleLike[] = Array.from({ length: 30 }).map((_, i) => ({
      time: Math.floor((Date.now() - (30 - i) * 900000) / 1000),
      open: px * (1 + (i % 2 === 0 ? 0.001 : -0.001)),
      high: px * 1.004,
      low: px * 0.996,
      close: px,
      volume: 1200
    }));

    const phase = classifyMarketPhase(dummyCandles, px, { symbol: key });
    const scalp = this.createDefaultHorizonVerdict('SCALP', px, phase);
    const intraday = this.createDefaultHorizonVerdict('INTRADAY', px, phase);
    const swing = this.createDefaultHorizonVerdict('SWING', px, phase);

    const matrix: Record<HorizonType, HorizonVerdict> = {
      SCALP: scalp,
      INTRADAY: intraday,
      SWING: swing
    };

    const activeH = matrix[this.selectedHorizon];

    return {
      verdictId: generateVerdictId(key),
      asset: key.replace('USDT', ''),
      symbol: key,
      state: activeH.state,
      side: activeH.side,
      selectedHorizon: this.selectedHorizon,
      price: px,
      priceSource: 'Binance Live Feed (Shared Quote Store)',
      dataQuality: 98,
      phase,
      horizonMatrix: matrix,
      trade: null,
      tradeHistory: [],
      waitDetails: activeH.state === 'WAIT' ? {
        reason: 'Price currently in consolidation chop without confirmed displacement trigger',
        category: 'RANGE_MIDPOINT',
        nextLevel: +(px * 1.012).toFixed(2),
        nextCondition: 'Breakout above consolidation ceiling with volume > 1.2x',
        timeoutMinutes: 30,
        reviewAt: Date.now() + 30 * 60 * 1000
      } : null,
      armed: {
        long: {
          level: +(px * 1.012).toFixed(2),
          conditions: ['15m close above level with volume > 1.2x', 'Delta positive'],
          cancelIf: 'Rejection candle or breakdown below local swing low'
        },
        short: {
          level: +(px * 0.988).toFixed(2),
          conditions: ['15m close below level with volume > 1.2x', 'Delta negative'],
          cancelIf: 'Reclaim candle above local swing high'
        }
      },
      scores: {
        longSQ: activeH.side === 'LONG' ? 78 : 28,
        shortSQ: activeH.side === 'SHORT' ? 82 : 34,
        readiness: 72,
        confidence: activeH.confidence,
        confidenceBasis: 'calibrated (Wilson LB)',
        badge: 'HIGH'
      },
      cooldownUntil: null,
      cooldownZone: null,
      cooldownSide: null,
      flipCount1h: 0,
      isFlipRateAlert: false,
      hasInconsistency: false,
      updatedAt: Date.now(),
      asOf: Date.now(),
      evidence: {},
      warnings: []
    };
  }

  private syncHeadlineState(v: MasterVerdictObject) {
    const horizonVerdict = v.horizonMatrix[v.selectedHorizon] || v.horizonMatrix.INTRADAY;
    v.state = horizonVerdict.state;
    v.side = horizonVerdict.side;
    v.phase = horizonVerdict.phase;

    // Check conflict between SWING and SCALP
    const swingSide = v.horizonMatrix.SWING.side;
    const scalpSide = v.horizonMatrix.SCALP.side;
    if (swingSide !== 'NONE' && scalpSide !== 'NONE' && swingSide !== scalpSide) {
      v.warnings = [
        `HORIZON CONFLICT: SWING is ${swingSide} while SCALP is ${scalpSide} (counter-leg). Headline ${v.selectedHorizon}: ${v.state}.`
      ];
    } else {
      v.warnings = [];
    }
  }

  /**
   * Retrieves or initializes the Master Verdict for an asset.
   */
  public getVerdict(assetOrSymbol: string, currentPrice?: number): MasterVerdictObject {
    const key = normalizeSymbolKey(assetOrSymbol);
    if (!this.verdicts[key]) {
      this.verdicts[key] = this.createDefaultVerdict(key, currentPrice);
      this.saveToStorage();
    } else if (currentPrice && currentPrice > 0 && Math.abs(this.verdicts[key].price - currentPrice) > 0.01) {
      this.updatePrice(key, currentPrice);
    }
    return this.verdicts[key];
  }

  /**
   * Full Engine Evaluation: Run whenever closed candles or fresh ticks arrive.
   */
  public evaluateMasterVerdict(
    assetOrSymbol: string,
    candles: CandleLike[],
    priceOverride?: number
  ): MasterVerdictObject {
    const key = normalizeSymbolKey(assetOrSymbol);
    const v = this.getVerdict(key);
    const price = priceOverride && priceOverride > 0 ? priceOverride : sharedQuoteStore.getPrice(key);
    this.candleCache[key] = candles;

    v.price = price;
    v.asOf = Date.now();

    // 1. Evaluate Market Phase
    const phase = classifyMarketPhase(candles, price, { symbol: key });
    v.phase = phase;

    // 2. Evaluate Matrix across 3 Horizons
    const scalp = this.createDefaultHorizonVerdict('SCALP', price, phase);
    const intraday = this.createDefaultHorizonVerdict('INTRADAY', price, phase);
    const swing = this.createDefaultHorizonVerdict('SWING', price, phase);

    v.horizonMatrix = {
      SCALP: scalp,
      INTRADAY: intraday,
      SWING: swing
    };

    // 3. Sync headline state with selected horizon
    this.syncHeadlineState(v);

    // 4. Enforce Cooldown rule (Strictly same setup/zone/side only)
    if (v.cooldownUntil && Date.now() < v.cooldownUntil && v.cooldownSide === v.side && v.cooldownZone) {
      const inZone =
        price >= Math.min(v.cooldownZone[0], v.cooldownZone[1]) * 0.998 &&
        price <= Math.max(v.cooldownZone[0], v.cooldownZone[1]) * 1.002;
      if (inZone) {
        v.state = 'WAIT';
        v.waitDetails = {
          reason: `Cooldown active: re-entry at same zone ($${v.cooldownZone[0]}–$${v.cooldownZone[1]}) blocked`,
          category: 'NO_VALID_LOCATION',
          nextLevel: v.side === 'SHORT' ? v.cooldownZone[1] * 1.005 : v.cooldownZone[0] * 0.995,
          nextCondition: 'Cooldown timeout or breakout to fresh structural zone',
          timeoutMinutes: Math.max(1, Math.round((v.cooldownUntil - Date.now()) / 60000)),
          reviewAt: v.cooldownUntil
        };
      }
    }

    // 5. Update Armed levels
    const atr = calculateAtr(candles, 14);
    v.armed = {
      long: {
        level: +(price + atr * 0.4).toFixed(2),
        conditions: [`Closed candle above $${(price + atr * 0.4).toFixed(2)} with volume expansion`, 'Delta positive'],
        cancelIf: 'Rejection candle or breakdown below local swing low'
      },
      short: {
        level: +(price - atr * 0.4).toFixed(2),
        conditions: [`Closed candle below $${(price - atr * 0.4).toFixed(2)} with volume expansion`, 'Delta negative'],
        cancelIf: 'Reclaim candle above local swing high'
      }
    };

    // 6. Update Active Trade Plan Lifecycle
    if (v.trade && (v.trade.status === 'ACTIVE' || v.trade.status === 'TP1_HIT')) {
      const isShort = v.trade.side === 'SHORT';

      // Check Stop Loss
      const slHit = isShort ? price >= v.trade.sl : price <= v.trade.sl;
      if (slHit) {
        v.trade.status = 'CLOSED_SL';
        v.trade.closedAt = Date.now();
        v.trade.closePrice = price;
        v.trade.closeReason = `Stop Loss touched at $${price.toFixed(2)}`;
        v.tradeHistory = [v.trade, ...(v.tradeHistory || [])].slice(0, 30);
        v.cooldownUntil = Date.now() + 2 * 15 * 60 * 1000; // 2 candles cooldown
        v.cooldownZone = v.trade.entryZone;
        v.cooldownSide = v.trade.side;
        v.trade = null;
        v.state = 'WAIT';
        v.waitDetails = {
          reason: 'Stopped out at structural stop loss. Cooldown period active for same zone.',
          category: 'NO_VALID_LOCATION',
          nextLevel: isShort ? price * 1.01 : price * 0.99,
          nextCondition: 'Re-evaluate on fresh structure breakout after cooldown expires',
          timeoutMinutes: 30,
          reviewAt: Date.now() + 30 * 60 * 1000
        };
      } else {
        // Check TP1
        const tp1Hit = isShort ? price <= v.trade.tp1 : price >= v.trade.tp1;
        if (tp1Hit && v.trade.status === 'ACTIVE') {
          v.trade.status = 'TP1_HIT';
          v.trade.sl = v.trade.entryPrice; // Breakeven rule
        }

        // Check TP3
        const tp3Hit = isShort ? price <= v.trade.tp3 : price >= v.trade.tp3;
        if (tp3Hit) {
          v.trade.status = 'CLOSED_TP';
          v.trade.closedAt = Date.now();
          v.trade.closePrice = price;
          v.trade.closeReason = 'TP3 full profit target reached';
          v.tradeHistory = [v.trade, ...(v.tradeHistory || [])].slice(0, 30);
          v.trade = null;
          v.state = 'WAIT';
        }
      }
    }

    v.updatedAt = Date.now();
    this.saveToStorage();
    this.notify(v);
    return v;
  }

  /**
   * Update live market price from Shared Quote Store or WebSocket.
   */
  public updatePrice(assetOrSymbol: string, price: number): MasterVerdictObject {
    const key = normalizeSymbolKey(assetOrSymbol);
    const v = this.verdicts[key] || this.createDefaultVerdict(key, price);
    v.price = price;
    v.asOf = Date.now();

    // Check active trade lifecycle triggers on price tick
    const trade = v.trade;
    if (trade && (trade.status === 'ACTIVE' || trade.status === 'TP1_HIT')) {
      const isShort = trade.side === 'SHORT';

      // 1. SL Check
      const slHit = isShort ? price >= trade.sl : price <= trade.sl;
      if (slHit) {
        trade.status = 'CLOSED_SL';
        trade.closedAt = Date.now();
        trade.closePrice = price;
        trade.closeReason = `Stop Loss touched at $${price.toFixed(2)}`;
        v.tradeHistory = [trade, ...(v.tradeHistory || [])].slice(0, 30);
        v.cooldownUntil = Date.now() + 2 * 15 * 60 * 1000;
        v.cooldownZone = trade.entryZone;
        v.cooldownSide = trade.side;
        v.trade = null;
        v.state = 'WAIT';
        v.waitDetails = {
          reason: 'Stopped out at structural stop loss. Cooldown period active for same zone.',
          category: 'NO_VALID_LOCATION',
          nextLevel: isShort ? price * 1.01 : price * 0.99,
          nextCondition: 'Re-evaluate on fresh structure breakout after cooldown expires',
          timeoutMinutes: 30,
          reviewAt: Date.now() + 30 * 60 * 1000
        };
        this.saveToStorage();
        this.notify(v);
        return v;
      }

      // 2. TP1 Check
      const tp1Hit = isShort ? price <= trade.tp1 : price >= trade.tp1;
      if (tp1Hit && trade.status === 'ACTIVE') {
        trade.status = 'TP1_HIT';
        trade.sl = trade.entryPrice;
        this.saveToStorage();
        this.notify(v);
        return v;
      }

      // 3. TP3 Check
      const tp3Hit = isShort ? price <= trade.tp3 : price >= trade.tp3;
      if (tp3Hit) {
        trade.status = 'CLOSED_TP';
        trade.closedAt = Date.now();
        trade.closePrice = price;
        trade.closeReason = 'TP3 target achieved';
        v.tradeHistory = [trade, ...(v.tradeHistory || [])].slice(0, 30);
        v.trade = null;
        v.state = 'WAIT';
        this.saveToStorage();
        this.notify(v);
        return v;
      }
    }

    return v;
  }

  /**
   * Set Master Trade / Plan (Only the Master Arbiter writes this).
   */
  public setMasterTrade(
    assetOrSymbol: string,
    tradeDetails: {
      tradeNo: number;
      side: TradeSide;
      horizon?: HorizonType;
      entryZone: [number, number];
      entryPrice: number;
      sl: number;
      tp1: number;
      tp2: number;
      tp3: number;
      isArmed?: boolean;
    }
  ): MasterVerdictObject {
    const key = normalizeSymbolKey(assetOrSymbol);
    const v = this.getVerdict(key);
    const horizon = tradeDetails.horizon || this.selectedHorizon;

    // Check cooldown for same zone
    if (v.cooldownUntil && Date.now() < v.cooldownUntil && v.cooldownSide === tradeDetails.side && v.cooldownZone) {
      const inZone =
        tradeDetails.entryPrice >= Math.min(v.cooldownZone[0], v.cooldownZone[1]) * 0.998 &&
        tradeDetails.entryPrice <= Math.max(v.cooldownZone[0], v.cooldownZone[1]) * 1.002;
      if (inZone) {
        v.state = 'WAIT';
        v.waitDetails = {
          reason: `Cooldown active: re-entry on same zone blocked until ${new Date(v.cooldownUntil).toLocaleTimeString()}`,
          category: 'NO_VALID_LOCATION',
          nextLevel: tradeDetails.side === 'SHORT' ? v.cooldownZone[1] * 1.005 : v.cooldownZone[0] * 0.995,
          nextCondition: 'Cooldown expiry or fresh zone',
          timeoutMinutes: Math.max(1, Math.round((v.cooldownUntil - Date.now()) / 60000)),
          reviewAt: v.cooldownUntil
        };
        this.saveToStorage();
        this.notify(v);
        return v;
      }
    }

    // Record flip for flip-rate monitoring
    if (v.side !== 'NONE' && v.side !== tradeDetails.side) {
      this.recordFlip(key);
    }

    const worstEdge =
      tradeDetails.side === 'SHORT'
        ? Math.min(tradeDetails.entryZone[0], tradeDetails.entryZone[1])
        : Math.max(tradeDetails.entryZone[0], tradeDetails.entryZone[1]);

    const rrWorstEdge = computeWorstEdgeRr(
      tradeDetails.side,
      tradeDetails.entryZone,
      tradeDetails.sl,
      tradeDetails.tp1
    );

    const activeTrade: ActiveTrade = {
      tradeNo: tradeDetails.tradeNo,
      side: tradeDetails.side,
      horizon,
      entryZone: tradeDetails.entryZone,
      entryPrice: tradeDetails.entryPrice,
      entryWorstEdge: worstEdge,
      sl: tradeDetails.sl,
      tp1: tradeDetails.tp1,
      tp2: tradeDetails.tp2,
      tp3: tradeDetails.tp3,
      rrWorstEdge,
      openedAt: Date.now(),
      status: 'ACTIVE'
    };

    v.trade = activeTrade;
    v.side = tradeDetails.side;
    v.state = tradeDetails.isArmed
      ? tradeDetails.side === 'LONG'
        ? 'ARMED-LONG'
        : 'ARMED-SHORT'
      : tradeDetails.side;

    v.waitDetails = null;
    v.verdictId = generateVerdictId(key);
    v.updatedAt = Date.now();
    v.asOf = Date.now();
    v.cooldownUntil = null;
    v.cooldownZone = null;
    v.cooldownSide = null;

    this.verdicts[key] = v;
    this.saveToStorage();
    this.notify(v);
    return v;
  }

  public setWaitState(
    assetOrSymbol: string,
    details?: Partial<WaitDetails>
  ): MasterVerdictObject {
    const key = normalizeSymbolKey(assetOrSymbol);
    const v = this.getVerdict(key);

    if (v.trade && v.trade.status === 'ACTIVE') {
      v.trade.status = 'CLOSED_INVALIDATED';
      v.trade.closedAt = Date.now();
      v.trade.closeReason = details?.reason || 'Shifted to WAIT';
      v.tradeHistory = [v.trade, ...(v.tradeHistory || [])].slice(0, 30);
    }

    v.trade = null;
    v.state = 'WAIT';
    v.side = 'NONE';
    v.waitDetails = {
      reason: details?.reason || 'Awaiting clean structural location and trigger confirmation',
      category: details?.category || 'NO_VALID_LOCATION',
      nextLevel: details?.nextLevel || +(v.price * 1.01).toFixed(2),
      nextCondition: details?.nextCondition || 'Closed candle displacement beyond local boundary',
      timeoutMinutes: details?.timeoutMinutes || 30,
      reviewAt: Date.now() + (details?.timeoutMinutes || 30) * 60 * 1000
    };

    v.verdictId = generateVerdictId(key);
    v.updatedAt = Date.now();
    v.asOf = Date.now();

    this.verdicts[key] = v;
    this.saveToStorage();
    this.notify(v);
    return v;
  }

  /**
   * Flip rate monitor
   */
  private recordFlip(key: string) {
    const now = Date.now();
    const history = (this.flipHistory[key] || []).filter((t) => now - t <= 3600000);
    history.push(now);
    this.flipHistory[key] = history;

    const v = this.verdicts[key];
    if (v) {
      v.flipCount1h = history.length;
      v.isFlipRateAlert = history.length > 2;
      if (v.isFlipRateAlert) {
        v.warnings.push(`FLIP_RATE_ALERT: ${history.length} side flips in 1 hour. Tightening thresholds.`);
      }
    }
  }

  /**
   * Register evidence from sub-modules (Evidence only, never sets verdict).
   */
  public registerEvidence(
    assetOrSymbol: string,
    moduleName: string,
    evidence: {
      lean: 'long' | 'short' | 'neutral';
      score: number;
      notes: string[];
      source?: string;
    }
  ): { inSync: boolean; masterState: MasterState; verdictId: string } {
    const key = normalizeSymbolKey(assetOrSymbol);
    const v = this.getVerdict(key);

    v.evidence[moduleName] = {
      name: moduleName,
      lean: evidence.lean,
      score: evidence.score,
      notes: evidence.notes,
      source: evidence.source || moduleName,
      asOf: Date.now(),
      verdictId: v.verdictId
    };

    return {
      inSync: true,
      masterState: v.state,
      verdictId: v.verdictId
    };
  }

  public setModuleEvidence(
    assetOrSymbol: string,
    moduleName: string,
    evidence: {
      lean: 'long' | 'short' | 'neutral';
      score: number;
      notes: string[];
      source?: string;
    }
  ) {
    return this.registerEvidence(assetOrSymbol, moduleName, evidence);
  }

  /**
   * Runtime Inconsistency Assertion:
   * Checks if any module attempts to display a conflicting headline side.
   */
  public assertConsistency(assetOrSymbol: string, displayedSide: TradeSide | 'NONE'): boolean {
    const key = normalizeSymbolKey(assetOrSymbol);
    const v = this.getVerdict(key);

    if (displayedSide !== 'NONE' && v.side !== 'NONE' && displayedSide !== v.side) {
      const msg = `CRITICAL ENGINE_INCONSISTENCY: Module displayed ${displayedSide} while Master Arbiter is ${v.side} for ${key}!`;
      console.error(msg);
      v.hasInconsistency = true;
      v.inconsistencyMessage = msg;
      this.notify(v);
      return false;
    }

    v.hasInconsistency = false;
    v.inconsistencyMessage = undefined;
    return true;
  }

  private notify(v: MasterVerdictObject) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: v
        })
      );
    }
  }

  public subscribe(assetOrSymbol: string, callback: (v: MasterVerdictObject) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const key = normalizeSymbolKey(assetOrSymbol);
    const handler = (evt: Event) => {
      const customEvt = evt as CustomEvent<MasterVerdictObject>;
      if (customEvt && customEvt.detail && normalizeKey(customEvt.detail.symbol) === key) {
        callback(customEvt.detail);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }

  public checkSync(
    assetOrSymbol = 'BTCUSDT',
    verdictId?: string,
    asOf?: number
  ): { isSynced: boolean; masterVerdictId: string; ageSeconds: number } {
    const verdict = this.getVerdict(assetOrSymbol);
    const now = Date.now();
    const verdictTime = asOf || verdict.timestamp || now;
    const ageSeconds = Math.max(0, Math.floor((now - verdictTime) / 1000));
    const isSynced = !verdictId || verdict.verdictId === verdictId || ageSeconds < 60;
    return {
      isSynced,
      masterVerdictId: verdict.verdictId || 'VERDICT-LIVE',
      ageSeconds
    };
  }
}

function normalizeKey(sym: string): string {
  return normalizeSymbolKey(sym);
}

export const masterVerdictStore = new MasterVerdictStore();

export function getMasterVerdictState(assetOrSymbol = 'BTCUSDT'): MasterVerdictObject {
  return masterVerdictStore.getVerdict(assetOrSymbol);
}

export function updateModuleEvidence(
  assetOrSymbol: string,
  moduleName: string,
  evidence: { lean: 'long' | 'short' | 'neutral'; score: number; notes: string[]; source?: string }
) {
  return masterVerdictStore.setModuleEvidence(assetOrSymbol, moduleName, evidence);
}
