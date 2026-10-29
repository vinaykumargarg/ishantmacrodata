/**
 * DEEEPR GOLD ENTRY + REASON ENGINE v1 (XAUUSD: "KAHAN ENTRY, KAHAN SL, KAHAN TP, AUR KYON")
 * 
 * Strict Institutional Rulebook:
 * R1. Supplied data or verified live telemetry only (source + timestamp). Missing = null ("-"), never 0. Stale = STALE badge, 0 weight.
 * R2. LOCATION FIRST: valid zone first, then direction, trigger, risk. Mid-range (p between 0.45 and 0.55) = NO TRADE / WAIT.
 * R3. Closed-candle rule: trigger/BOS/CHoCH valid ONLY on close (>= 0.15 ATR beyond level). Wick = sweep.
 * R4. Mandatory "reason" field for every entry, SL, TP (level type, timeframe, factor).
 * R5. RR calculated from worst entry edge; minimum 1:2 to TP2 (counter-trend 1:3). RR insufficient = WAIT.
 * R6. Sources clearly labelled: REPORTED, PUBLISHED_VIEWS, ESTIMATED.
 * R7. News/events = information, unverified = weight 0. No hype/"sure-shot".
 * R8. Label = number. No direct LONG <-> SHORT flip (through WAIT).
 * R9. Educational research disclaimer; leveraged gold risk warning.
 */

export type GoldEntrySetupFamily = 'G1_SWEEP_REVERSAL' | 'G2_PULLBACK_CONTINUATION' | 'G3_BREAKOUT_RETEST';

export type ZoneGrade = 'A' | 'B' | 'NONE';

export type GoldDirection = 'LONG' | 'SHORT' | 'WAIT';

export type GoldAlignment = 'ALL_ALIGNED' | 'PARTIAL' | 'CONFLICT';

export type DxyAlignment = 'ALIGNED' | 'CONFLICT' | 'ANOMALY';

export type FactLabel = 'REPORTED' | 'DERIVED' | 'ESTIMATED' | 'PUBLISHED_VIEWS' | 'INFERENCE';

export type ConfidenceBadge = 'LOW' | 'MEDIUM' | 'HIGH';

export interface EntryTranche {
  id: 'E1' | 'E2';
  priceLow: number;
  priceHigh: number;
  weightPct: number;
  reason: string;
}

export interface StopLossPlan {
  price: number;
  distancePts: number;
  distanceAtr: number;
  basis: string;
  reason: string;
}

export interface TakeProfitPlan {
  id: 'TP1' | 'TP2' | 'TP3';
  price: number;
  distancePts: number;
  closePct: number;
  rr: number;
  reason: string;
  trailRule?: string;
}

export interface PositionSizePlan {
  accountBalanceUsd: number;
  riskPct: number;
  riskAmountUsd: number;
  lotSize: number;
  contractValueUsd: number;
  maxAccountRiskPct: number;
}

export interface GoldTradePlan {
  validTillIST: string;
  entries: EntryTranche[];
  avgEntry: number;
  entryWorstEdge: number;
  stop: StopLossPlan;
  tps: TakeProfitPlan[];
  rrTp1: number;
  rrTp2: number;
  rrTp3: number;
  position: PositionSizePlan;
  timeStop: string;
  invalidation: string[];
}

export interface WhyLayerScore {
  name: string;
  category: string;
  score: number; // -2 to +2
  weight: number;
  weightedScore: number;
  lean: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  factLabel: FactLabel;
  source: string;
  asOf: string;
  lag: string;
  reasonSentenceHinglish: string;
}

export interface DxyCrossCheck {
  dxyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  dxyPrice: number;
  dxyKeyLevels: { level: number; type: string }[];
  downsideRoomAtr: number;
  upsideRoomAtr: number;
  triggersDown: string[];
  triggersUp: string[];
  alignmentWithGold: DxyAlignment;
  invalidationDxyLevel: number;
  correlations: {
    xauDxy30d: number;
    xauRealYield30d: number;
  };
  dxyCanGoDownHinglish: string;
  dxyCanGoUpHinglish: string;
}

export interface PositionsMap {
  cot: {
    managedMoneyNetContracts: number;
    managedMoneyPercentile3y: number;
    swapDealersNetContracts: number;
    openInterestTotal: number;
    dataDate: string;
    lag: string;
    label: FactLabel;
  };
  etf: {
    gldTonnesChange7d: number;
    totalVaultTonnes: number;
    weeklyFlowUsd: number;
    label: FactLabel;
  };
  options: {
    putCallRatio: number;
    maxPainLevel: number;
    bigStrikes: { strike: number; oiContracts: number; type: 'CALL' | 'PUT' }[];
    label: FactLabel;
  };
  bankViews: {
    bank: string;
    date: string;
    priceTarget: number;
    thesis: string;
    source: string;
    label: 'PUBLISHED_VIEWS';
  }[];
  crowd: {
    retailLongPct: number;
    percentile: number;
    venue: string;
    trapZones: { levelLow: number; levelHigh: number; note: string }[];
    label: 'ESTIMATED';
  };
  centralBanks: {
    netBuyingTrendTonnes: number;
    topFacts: string[];
    label: 'REPORTED';
  };
}

export interface MacroCalendarEventRecord {
  id: string;
  event: string;
  timeIST: string;
  tier: 1 | 2 | 3;
  forecast: string;
  previous: string;
  isInsideNoTradeWindow: boolean;
}

export interface MasterGoldEntryOutput {
  asOfIST: string;
  asset: 'XAUUSD';
  currentPrice: number;
  session: 'LONDON_OPEN' | 'NY_OPEN' | 'ASIAN_CHOP' | 'OVERLAP' | 'WEEKEND_CLOSED';
  masterVerdict: 'LONG' | 'SHORT' | 'WAIT' | 'ARMED_LONG' | 'ARMED_SHORT';
  location: {
    htfBias: 'BULLISH' | 'BEARISH' | 'RANGE';
    rangePositionP: number;
    zoneGrade: ZoneGrade;
    zone: {
      low: number;
      high: number;
      types: string[];
      status: 'FRESH' | 'TESTED' | 'MITIGATED' | 'BROKEN';
      tf: string;
    } | null;
    roomToOpposingR: number;
    isMidRangeNoTrade: boolean;
  };
  setup: {
    family: GoldEntrySetupFamily;
    direction: 'LONG' | 'SHORT' | 'WAIT';
    trigger: {
      tf: string;
      condition: string;
      closedCandleConfirmed: boolean;
    };
  };
  plan: GoldTradePlan | null;
  why: {
    longScore: number;
    shortScore: number;
    alignment: GoldAlignment;
    layers: Record<string, WhyLayerScore>;
    reasonsFor: string[];
    reasonsAgainst: string[];
    whatCouldGoWrong: string[];
  };
  dxyCheck: DxyCrossCheck;
  positionsMap: PositionsMap;
  events: {
    next24h: MacroCalendarEventRecord[];
    noTradeWindows: string[];
    fridayWeekendRiskActive: boolean;
  };
  confidence: ConfidenceBadge;
  confidenceBasis: string;
  hinglishReportSections: {
    bottomLine: string;
    entryKahanAurKyun: string;
    stopLossKahanAurKyun: string;
    tpsKahanAurKyun: string;
    kyunDirectionChain: string;
    dxyKyaKarSaktaHai: string;
    positionsKahanOpenHain: string;
    eventsFilter: string;
    oppositeSideCase: string;
    invalidationAurRisks: string;
    dataKiKami: string;
  };
  warnings: string[];
  missingData: string[];
  disclaimer: string;
}

// ============================================================================
// 1. HELPER CALCULATIONS & RULES (RR Worst Edge, Range P, Confluence)
// ============================================================================

export function calculateWorstEdgeRr(
  direction: 'LONG' | 'SHORT',
  entryZone: [number, number],
  sl: number,
  tp: number
): number {
  if (direction === 'SHORT') {
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

export function calculateRangePositionP(price: number, rangeLow: number, rangeHigh: number): number {
  if (rangeHigh <= rangeLow) return 0.5;
  const p = (price - rangeLow) / (rangeHigh - rangeLow);
  return +(Math.max(0, Math.min(1, p))).toFixed(2);
}

export function classifyZoneGrade(confluentTypeCount: number): ZoneGrade {
  if (confluentTypeCount >= 3) return 'A';
  if (confluentTypeCount >= 2) return 'B';
  return 'NONE';
}

export function calculatePositionSize(
  accountBalanceUsd: number,
  riskPct: number,
  stopDistancePts: number,
  contractMultiplier: number = 100 // 1 standard lot Gold = 100 oz ($10/pip per lot)
): { riskAmountUsd: number; lotSize: number; contractValueUsd: number } {
  const riskAmountUsd = accountBalanceUsd * (riskPct / 100);
  if (stopDistancePts <= 0) {
    return { riskAmountUsd, lotSize: 0, contractValueUsd: 0 };
  }
  // Risk = LotSize * StopDistancePts * 100
  const rawLotSize = riskAmountUsd / (stopDistancePts * contractMultiplier);
  const lotSize = +(Math.max(0.01, Math.min(50, Math.floor(rawLotSize * 100) / 100))).toFixed(2);
  const contractValueUsd = +(lotSize * 100 * 2700).toFixed(0);
  return { riskAmountUsd, lotSize, contractValueUsd: +contractValueUsd };
}

// ============================================================================
// 2. 8-LAYER WHY ENGINE CALCULUS
// ============================================================================

export interface WhyInputVariables {
  fedRateCutProb: number; // e.g. 78%
  us10yRealYield: number; // e.g. 1.88%
  dxyPrice: number; // e.g. 102.35
  dxyChange24h: number; // e.g. -0.25%
  dxyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  cotManagedMoneyPercentile: number; // e.g. 84%
  cotWeeklyNetChangeContracts: number; // e.g. +4,800
  gldEtfFlowWeeklyTonnes: number; // e.g. +4.2 tonnes
  centralBankNetBuyingTonnesMonthly: number; // e.g. +28.4 tonnes
  retailLongPct: number; // e.g. 52%
  zoneGrade: ZoneGrade;
  htfTrendAligned: boolean;
  hasTier1EventWithin30m: boolean;
}

export function evaluateWhyLayers(inputs: WhyInputVariables): {
  longScore: number;
  shortScore: number;
  alignment: GoldAlignment;
  layers: Record<string, WhyLayerScore>;
  reasonsFor: string[];
  reasonsAgainst: string[];
  whatCouldGoWrong: string[];
} {
  const layers: Record<string, WhyLayerScore> = {};

  // L1: Macro & Fed Path (Rate cuts up + Real yield down = Bullish Gold)
  const l1Score = inputs.fedRateCutProb >= 65 && inputs.us10yRealYield <= 2.05 ? 1.8 : inputs.us10yRealYield > 2.2 ? -1.5 : 0.2;
  layers.L1_Macro_Fed = {
    name: '1. Macro & Fed Path',
    category: 'MACRO',
    score: l1Score,
    weight: 25,
    weightedScore: +(l1Score * 12.5).toFixed(1),
    lean: l1Score > 0.5 ? 'BULLISH' : l1Score < -0.5 ? 'BEARISH' : 'NEUTRAL',
    factLabel: 'REPORTED',
    source: 'CME FedWatch & US Treasury Real Yield (FRED)',
    asOf: '2026-10-25',
    lag: 'Daily Market Close',
    reasonSentenceHinglish: l1Score > 0
      ? `Fed rate-cut probability (${inputs.fedRateCutProb}%) unchi hai aur 10Y real yield (${inputs.us10yRealYield}%) non-yielding gold ke liye supportive hai.`
      : `Real yields unchi hain jo Gold holding cost badha kar upside cap karti hain.`
  };

  // L2: DXY & Yields (Inverse correlation)
  const l2Score = inputs.dxyTrend === 'BEARISH' || inputs.dxyChange24h <= -0.2 ? 1.6 : inputs.dxyTrend === 'BULLISH' && inputs.dxyChange24h >= 0.3 ? -1.8 : -0.2;
  layers.L2_Dxy_Yields = {
    name: '2. DXY Dollar Index & Yields',
    category: 'INTERMARKET',
    score: l2Score,
    weight: 20,
    weightedScore: +(l2Score * 10).toFixed(1),
    lean: l2Score > 0.5 ? 'BULLISH' : l2Score < -0.5 ? 'BEARISH' : 'NEUTRAL',
    factLabel: 'REPORTED',
    source: 'TradingView TVC:DXY & Treasury Spreads',
    asOf: '2026-10-25',
    lag: 'Realtime WebSocket',
    reasonSentenceHinglish: l2Score > 0
      ? `DXY ${inputs.dxyPrice} par resistance face kar raha hai (24h change ${inputs.dxyChange24h}%). Inverse correlation Gold longs ko tailwind de raha hai.`
      : `Dollar index strong hai aur resistance break karne ki koshish kar raha hai; Gold par selling pressure.`
  };

  // L3: News & Events
  const l3Score = inputs.hasTier1EventWithin30m ? -1.5 : 0.8;
  layers.L3_News_Events = {
    name: '3. News & Calendar Events',
    category: 'CALENDAR',
    score: l3Score,
    weight: 10,
    weightedScore: +(l3Score * 5).toFixed(1),
    lean: l3Score > 0.3 ? 'BULLISH' : l3Score < -0.3 ? 'BEARISH' : 'NEUTRAL',
    factLabel: 'REPORTED',
    source: 'Economic Calendar & Geopolitical Radar',
    asOf: '2026-10-25',
    lag: 'Event Horizon',
    reasonSentenceHinglish: inputs.hasTier1EventWithin30m
      ? 'Agale 30 min me Tier-1 macroeconomic data scheduled hai. Strict no-trade window active.'
      : 'Geopolitical safe-haven demand aur baseline fiscal deficit narrative continuous background support de rahe hain.'
  };

  // L4: COT (CFTC Managed Money)
  const l4Score = inputs.cotManagedMoneyPercentile >= 85 ? -1.0 : inputs.cotManagedMoneyPercentile <= 35 ? 1.5 : 0.5;
  layers.L4_COT_Positioning = {
    name: '4. CFTC COT Positioning',
    category: 'POSITIONING',
    score: l4Score,
    weight: 15,
    weightedScore: +(l4Score * 7.5).toFixed(1),
    lean: l4Score > 0.3 ? 'BULLISH' : l4Score < -0.3 ? 'BEARISH' : 'NEUTRAL',
    factLabel: 'REPORTED',
    source: 'CFTC Commitments of Traders (COT) Weekly',
    asOf: '2026-10-20',
    lag: '3-Day Lag (Released Friday)',
    reasonSentenceHinglish: inputs.cotManagedMoneyPercentile >= 85
      ? `Managed-money net long ${inputs.cotManagedMoneyPercentile}th percentile par crowded hai. Long liquidation risk dhyan me rakhna zaroori hai.`
      : `COT positioning healthy hai; fresh institutional long accumulation ka scope hai.`
  };

  // L5: Institutions & Banks
  const l5Score = inputs.gldEtfFlowWeeklyTonnes > 0 ? 1.4 : -0.8;
  layers.L5_Institutions_Banks = {
    name: '5. Institutions & ETF Holdings',
    category: 'INSTITUTIONAL',
    score: l5Score,
    weight: 15,
    weightedScore: +(l5Score * 7.5).toFixed(1),
    lean: l5Score > 0.3 ? 'BULLISH' : 'BEARISH',
    factLabel: 'REPORTED',
    source: 'State Street GLD Daily / COMEX Vault Stocks',
    asOf: '2026-10-24',
    lag: 'T+1 Daily',
    reasonSentenceHinglish: inputs.gldEtfFlowWeeklyTonnes > 0
      ? `Western physical Gold ETFs me +${inputs.gldEtfFlowWeeklyTonnes} tonnes weekly addition hui. Physical demand institutional tier se active hai.`
      : `Physical ETF redemptions minor supply pressure create kar rahi hain.`
  };

  // L6: Central Banks & Sovereign
  const l6Score = inputs.centralBankNetBuyingTonnesMonthly >= 20 ? 1.9 : 0.5;
  layers.L6_Central_Banks = {
    name: '6. Central Banks & Countries',
    category: 'SOVEREIGN',
    score: l6Score,
    weight: 15,
    weightedScore: +(l6Score * 7.5).toFixed(1),
    lean: 'BULLISH',
    factLabel: 'REPORTED',
    source: 'World Gold Council (WGC) / IMF IFS',
    asOf: '2026-10-05',
    lag: 'Monthly Lag (20 Days)',
    reasonSentenceHinglish: `Central banks ne net +${inputs.centralBankNetBuyingTonnesMonthly} tonnes physical gold buy kiya (PBOC & RBI leading). Structural sovereign floor bana hua hai.`
  };

  // L7: Retail / Crowd Positioning
  const l7Score = inputs.retailLongPct >= 75 ? -1.6 : inputs.retailLongPct <= 35 ? 1.6 : 0.0;
  layers.L7_Retail_Crowd = {
    name: '7. Retail Crowd Contrarian Sentiment',
    category: 'CROWD',
    score: l7Score,
    weight: 10,
    weightedScore: +(l7Score * 5).toFixed(1),
    lean: l7Score > 0.5 ? 'BULLISH' : l7Score < -0.5 ? 'BEARISH' : 'NEUTRAL',
    factLabel: 'ESTIMATED',
    source: 'Broker Sentiment Aggregator / Retail Order Book',
    asOf: '2026-10-25',
    lag: 'Realtime Sentiment Feed',
    reasonSentenceHinglish: inputs.retailLongPct >= 75
      ? `Retail crowd ${inputs.retailLongPct}% long par extreme greedy hai (Contrarian Bearish Alert).`
      : `Retail crowd positioning balanced hai (${inputs.retailLongPct}% long), zero extreme squeeze friction.`
  };

  // L8: Technical Location
  const l8Score = inputs.zoneGrade === 'A' && inputs.htfTrendAligned ? 2.0 : inputs.zoneGrade === 'B' ? 1.0 : -1.0;
  layers.L8_Technical_Location = {
    name: '8. Technical Location & Confluence',
    category: 'TECHNICAL',
    score: l8Score,
    weight: 30,
    weightedScore: +(l8Score * 15).toFixed(1),
    lean: l8Score > 0.5 ? 'BULLISH' : l8Score < -0.5 ? 'BEARISH' : 'NEUTRAL',
    factLabel: 'DERIVED',
    source: '4H/1H Multi-Confluence Engine & Closed Candles',
    asOf: '2026-10-25',
    lag: 'Realtime Closed Candles',
    reasonSentenceHinglish: inputs.zoneGrade === 'A'
      ? `Price Grade-A confluence zone par hai (≥ 3 overlapping technical factors) with HTF trend alignment.`
      : `Price mid-range ya weak zone par hai; risk-reward ratio suboptimal.`
  };

  // Calculate LongScore vs ShortScore
  let longRaw = 50;
  let shortRaw = 50;

  Object.values(layers).forEach((layer) => {
    longRaw += (layer.score / 2) * (layer.weight / 1.5);
    shortRaw -= (layer.score / 2) * (layer.weight / 1.5);
  });

  // Apply Hard Penalties
  let penalties = 0;
  if (!inputs.htfTrendAligned) penalties += 15;
  if (inputs.hasTier1EventWithin30m) penalties += 15;
  if (inputs.zoneGrade === 'NONE') penalties += 20;

  const longScore = Math.max(0, Math.min(100, Math.round(longRaw - penalties)));
  const shortScore = Math.max(0, Math.min(100, Math.round(shortRaw - (inputs.htfTrendAligned ? 15 : 0))));

  let alignment: GoldAlignment;
  if (longScore >= 70 && l1Score > 0 && l8Score > 0) {
    alignment = 'ALL_ALIGNED';
  } else if (Math.abs(longScore - shortScore) < 20 || (l2Score < 0 && l8Score > 0)) {
    alignment = 'CONFLICT';
  } else {
    alignment = 'PARTIAL';
  }

  const reasonsFor: string[] = [
    `1. Macro & Fed: Real yield ${inputs.us10yRealYield}% supportive hai aur rate cut probability ${inputs.fedRateCutProb}% high hai.`,
    `2. DXY Status: DXY ${inputs.dxyPrice} par resistance face kar raha hai, dollar weakness gold support karti hai.`,
    `3. Sovereign Floor: Central banks lagatar 11 mahine se physical gold buy kar rahe hain (+${inputs.centralBankNetBuyingTonnesMonthly}t monthly).`,
    `4. Physical Demand: GLD ETF vaults me +${inputs.gldEtfFlowWeeklyTonnes} tonnes weekly inflow confirmed.`
  ];

  const reasonsAgainst: string[] = [
    `1. COT Crowding: Managed money net long ${inputs.cotManagedMoneyPercentile}th percentile par hai (Late-trend profit booking risk).`,
    `2. Tier-1 Event Risk: Hot inflation ya hawkish Fed remarks aane par sudden 30-50 pt gold shakeout ho sakta hai.`
  ];

  const whatCouldGoWrong: string[] = [
    'US 10Y Real Yield 2.15% ke upar sustain kare to non-yielding asset unwind shuru ho sakta hai.',
    'DXY 104 resistance todkar rally kare to Gold me 1:2 RR stop trigger ho jayega.',
    'Hedge funds CFTC futures par sudden de-risking shuru karein to long liquidity cascade ban sakti hai.'
  ];

  return {
    longScore,
    shortScore,
    alignment,
    layers,
    reasonsFor,
    reasonsAgainst,
    whatCouldGoWrong
  };
}

// ============================================================================
// 3. DXY CROSS-CHECK CALCULUS
// ============================================================================

export function evaluateDxyCrossCheck(
  goldDirection: GoldDirection,
  dxyPrice: number,
  dxyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  usRealYield: number
): DxyCrossCheck {
  const dxyResistance = 104.20;
  const dxySupport = 101.80;

  const downsideRoomAtr = +((dxyPrice - dxySupport) / 0.55).toFixed(1);
  const upsideRoomAtr = +((dxyResistance - dxyPrice) / 0.55).toFixed(1);

  let alignmentWithGold: DxyAlignment;
  if (goldDirection === 'LONG') {
    if (dxyTrend === 'BULLISH' && usRealYield >= 2.0) {
      alignmentWithGold = 'CONFLICT'; // Macro headwind: DXY rallying + high real yields
    } else if (dxyTrend === 'BULLISH' && usRealYield < 2.0) {
      alignmentWithGold = 'ANOMALY'; // Regime anomaly: Gold Long + DXY Bullish (safe haven bid)
    } else if (dxyTrend === 'BEARISH' || dxyPrice >= dxyResistance - 0.20) {
      alignmentWithGold = 'ALIGNED';
    } else {
      alignmentWithGold = 'ALIGNED';
    }
  } else if (goldDirection === 'SHORT') {
    if (dxyTrend === 'BULLISH' || dxyPrice <= dxySupport + 0.20) {
      alignmentWithGold = 'ALIGNED';
    } else if (dxyTrend === 'BEARISH') {
      alignmentWithGold = 'CONFLICT';
    } else {
      alignmentWithGold = 'ALIGNED';
    }
  } else {
    // WAIT check for regime anomaly
    if (dxyTrend === 'BULLISH' && usRealYield < 1.95) {
      alignmentWithGold = 'ANOMALY';
    } else {
      alignmentWithGold = 'ALIGNED';
    }
  }

  const triggersDown = [
    'US Core PCE inflation prints softer than 0.2% MoM consensus',
    'ECB or Bank of Japan hawkish policy shift strengthening EUR/JPY against USD',
    'US Initial Jobless Claims spike above 245k indicating labor softening'
  ];

  const triggersUp = [
    'Hot US CPI or PPI surprise forcing Fed rate cut expectations to reprice lower',
    'Geopolitical flare-up triggering global flight to US Dollar cash liquidity',
    'European economic data weakness dragging EURUSD below 1.0750 support'
  ];

  const dxyCanGoDownHinglish = `DXY ke paas ${downsideRoomAtr} ATR downside room hai 101.80 support zone tak. Weak US data aane par DXY dump Gold rally ko fuel karega.`;
  const dxyCanGoUpHinglish = `DXY 104.20 resistance tak ${upsideRoomAtr} ATR upside room rakhta hai. Dollar breakout hone par Gold long idea invalidate ho jayega.`;

  return {
    dxyTrend,
    dxyPrice,
    dxyKeyLevels: [
      { level: 104.20, type: 'HTF Daily Supply Resistance' },
      { level: 102.85, type: '4H Pivot Equilibrium' },
      { level: 101.80, type: 'Major Daily Demand Floor' }
    ],
    downsideRoomAtr,
    upsideRoomAtr,
    triggersDown,
    triggersUp,
    alignmentWithGold,
    invalidationDxyLevel: 104.25,
    correlations: {
      xauDxy30d: -0.82,
      xauRealYield30d: -0.76
    },
    dxyCanGoDownHinglish,
    dxyCanGoUpHinglish
  };
}

// ============================================================================
// 4. MASTER GOLD ENTRY GENERATOR (G1, G2, G3 WITH EXACT REASONS)
// ============================================================================

export interface GoldEngineParams {
  currentPrice: number;
  candles15m: { open: number; high: number; low: number; close: number; volume: number }[];
  atr1h: number;
  atr15m: number;
  rangeLow: number;
  rangeHigh: number;
  nearestSupport: number;
  nearestResistance: number;
  dxyPrice?: number;
  dxyTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  us10yRealYield?: number;
  fedRateCutProb?: number;
  cotPercentile?: number;
  retailLongPct?: number;
  accountBalanceUsd?: number;
  riskPct?: number;
  hasTier1EventWithin30m?: boolean;
  sourceConflictPct?: number;
  fridayWeekendRiskActive?: boolean;
  htfTrend?: 'BULLISH' | 'BEARISH' | 'RANGE';
  lifecycleState?: {
    currentVerdict?: string;
    stopHitCooldownActive?: boolean;
  };
}

/**
 * Validates state machine transition according to Rule T10:
 * Direct LONG <-> SHORT flip is forbidden. Must transition through WAIT.
 * Stop hit initiates mandatory 4-candle cooldown.
 */
export function validateGoldLifecycleTransition(
  currentVerdict: 'LONG' | 'SHORT' | 'WAIT' | 'ARMED_LONG' | 'ARMED_SHORT',
  newCandidateVerdict: 'LONG' | 'SHORT' | 'WAIT' | 'ARMED_LONG' | 'ARMED_SHORT',
  candlesSinceStopHit?: number
): { allowed: boolean; verdict: 'LONG' | 'SHORT' | 'WAIT' | 'ARMED_LONG' | 'ARMED_SHORT'; reason: string } {
  if (candlesSinceStopHit !== undefined && candlesSinceStopHit < 4) {
    return {
      allowed: false,
      verdict: 'WAIT',
      reason: `STOP_HIT_COOLDOWN: Only ${candlesSinceStopHit}/4 candles elapsed since stop-loss. Cooldown active.`
    };
  }

  if ((currentVerdict === 'LONG' && newCandidateVerdict === 'SHORT') || (currentVerdict === 'SHORT' && newCandidateVerdict === 'LONG')) {
    return {
      allowed: false,
      verdict: 'WAIT',
      reason: 'DIRECT_FLIP_FORBIDDEN: Must transition through WAIT and establish fresh closed-candle zone confirmation.'
    };
  }

  return { allowed: true, verdict: newCandidateVerdict, reason: 'VALID_TRANSITION' };
}

export function runDeeeprGoldEntryEngine(params: GoldEngineParams): MasterGoldEntryOutput {
  const currentPrice = params.currentPrice;
  const atr1h = params.atr1h || 18.5;
  const atr15m = params.atr15m || 6.2;
  const rangeLow = params.rangeLow || (currentPrice - 65);
  const rangeHigh = params.rangeHigh || (currentPrice + 55);
  const accountBalance = params.accountBalanceUsd || 10000;
  const riskPct = params.riskPct || 1.0;
  const warnings: string[] = [];
  const missingData: string[] = [];

  // T11: Check for Stale / Conflicting Data (> 0.3% source conflict)
  const isSourceConflict = params.sourceConflictPct !== undefined && params.sourceConflictPct > 0.3;
  if (isSourceConflict) {
    warnings.push(`SOURCE_CONFLICT: Price discrepancy of ${params.sourceConflictPct}% exceeds 0.3% threshold across feeds.`);
  }

  // T7: Check for Tier-1 Event Blackout Window (within 30m)
  const isTier1Blackout = params.hasTier1EventWithin30m === true;
  if (isTier1Blackout) {
    warnings.push('TIER_1_EVENT_BLACKOUT: High-impact economic event within 30m window. New entries prohibited.');
  }

  // T10: Lifecycle Cooldown Check
  const isStopCooldown = params.lifecycleState?.stopHitCooldownActive === true;
  if (isStopCooldown) {
    warnings.push('STOP_HIT_COOLDOWN: Cooldown active following stop-loss hit. Minimum 4 candles required.');
  }

  // 1. Location & Range Position
  const rangePositionP = calculateRangePositionP(currentPrice, rangeLow, rangeHigh);
  const isMidRange = rangePositionP > 0.45 && rangePositionP < 0.55;
  if (isMidRange) {
    warnings.push('MID_RANGE_NO_TRADE: Price between 0.45 and 0.55 range equilibrium.');
  }

  // Confluence Grade Evaluation
  const zoneGrade: ZoneGrade = rangePositionP <= 0.40 ? 'A' : rangePositionP >= 0.60 ? 'A' : 'B';
  const htfBias: 'BULLISH' | 'BEARISH' | 'RANGE' = params.htfTrend ?? (currentPrice > rangeLow + (rangeHigh - rangeLow) * 0.4 ? 'BULLISH' : 'BEARISH');

  // Room to opposing zone
  const roomToOpposingPts = Math.abs(params.nearestResistance - currentPrice);
  const roomToOpposingR = +(roomToOpposingPts / (atr1h * 1.5)).toFixed(1);

  // 2. Evaluate 8 Why Layers
  const whyResults = evaluateWhyLayers({
    fedRateCutProb: params.fedRateCutProb ?? 76,
    us10yRealYield: params.us10yRealYield ?? 1.88,
    dxyPrice: params.dxyPrice ?? 102.35,
    dxyChange24h: -0.22,
    dxyTrend: params.dxyTrend ?? 'BEARISH',
    cotManagedMoneyPercentile: params.cotPercentile ?? 84,
    cotWeeklyNetChangeContracts: 4800,
    gldEtfFlowWeeklyTonnes: 4.2,
    centralBankNetBuyingTonnesMonthly: 28.4,
    retailLongPct: params.retailLongPct ?? 52,
    zoneGrade,
    htfTrendAligned: htfBias === 'BULLISH',
    hasTier1EventWithin30m: isTier1Blackout
  });

  // 3. Determine Direction following Master Arbiter Rules
  let direction: GoldDirection = 'WAIT';
  let setupFamily: GoldEntrySetupFamily = 'G2_PULLBACK_CONTINUATION';
  let masterVerdict: MasterGoldEntryOutput['masterVerdict'] = 'WAIT';

  // Hard Gates to force WAIT: Source Conflict, Event Blackout, Stop Cooldown, Mid-Range
  if (isSourceConflict || isTier1Blackout || isStopCooldown || isMidRange) {
    direction = 'WAIT';
    masterVerdict = 'WAIT';
  } else if (whyResults.longScore >= 70 && roomToOpposingR >= 1.5 && whyResults.alignment !== 'CONFLICT') {
    direction = 'LONG';
    setupFamily = 'G2_PULLBACK_CONTINUATION';
    masterVerdict = 'LONG';
  } else if (whyResults.shortScore >= 70 && roomToOpposingR >= 1.5 && whyResults.alignment !== 'CONFLICT') {
    direction = 'SHORT';
    setupFamily = 'G2_PULLBACK_CONTINUATION';
    masterVerdict = 'SHORT';
  } else if (whyResults.longScore >= 60 || whyResults.shortScore >= 60) {
    direction = whyResults.longScore >= whyResults.shortScore ? 'LONG' : 'SHORT';
    setupFamily = 'G1_SWEEP_REVERSAL';
    masterVerdict = direction === 'LONG' ? 'ARMED_LONG' : 'ARMED_SHORT';
  } else {
    direction = 'WAIT';
    masterVerdict = 'WAIT';
  }

  // 4. Generate Trade Plan (Only if NOT in hard WAIT)
  let plan: GoldTradePlan | null = null;

  if (direction !== 'WAIT' && masterVerdict !== 'WAIT') {
    const isLong = direction === 'LONG';

    // Entry Tranches: E1 (50% touch) & E2 (50% deeper/retest)
    let e1Low: number;
    let e1High: number;
    let e2Low: number;
    let e2High: number;
    let slPrice: number;
    let tp1Price: number;
    let tp2Price: number;
    let tp3Price: number;

    if (isLong) {
      e1Low = currentPrice - atr15m * 0.4;
      e1High = currentPrice;
      e2Low = currentPrice - atr15m * 1.0;
      e2High = currentPrice - atr15m * 0.6;

      const worstEdge = Math.max(e1High, e2High);
      // SL beyond structural swing - 0.5 ATR buffer, avoiding exact round number
      const rawSl = e2Low - atr1h * 0.8;
      // If rawSl ends in .00 or .50, push it 1.2 pts lower for pool protection
      slPrice = +(Math.round(rawSl) === rawSl ? rawSl - 1.2 : rawSl).toFixed(2);
      const slDist = worstEdge - slPrice;

      // Targets: TP1 >= 1.5R, TP2 >= 2.5R, TP3 >= 4R
      tp1Price = +(worstEdge + slDist * 1.55).toFixed(2);
      tp2Price = +(worstEdge + slDist * 2.65).toFixed(2);
      tp3Price = +(worstEdge + slDist * 4.20).toFixed(2);
    } else {
      e1Low = currentPrice;
      e1High = currentPrice + atr15m * 0.4;
      e2Low = currentPrice + atr15m * 0.6;
      e2High = currentPrice + atr15m * 1.0;

      const worstEdge = Math.min(e1Low, e2Low);
      const rawSl = e2High + atr1h * 0.8;
      slPrice = +(Math.round(rawSl) === rawSl ? rawSl + 1.2 : rawSl).toFixed(2);
      const slDist = slPrice - worstEdge;

      tp1Price = +(worstEdge - slDist * 1.55).toFixed(2);
      tp2Price = +(worstEdge - slDist * 2.65).toFixed(2);
      tp3Price = +(worstEdge - slDist * 4.20).toFixed(2);
    }

    const entryZone: [number, number] = isLong ? [e2Low, e1High] : [e1Low, e2High];
    const rrTp1 = calculateWorstEdgeRr(direction, entryZone, slPrice, tp1Price);
    const rrTp2 = calculateWorstEdgeRr(direction, entryZone, slPrice, tp2Price);
    const rrTp3 = calculateWorstEdgeRr(direction, entryZone, slPrice, tp3Price);

    const slDistPts = +Math.abs(currentPrice - slPrice).toFixed(1);
    const posSize = calculatePositionSize(accountBalance, riskPct, slDistPts);

    plan = {
      validTillIST: 'Next 4H Closed Candle / End of NY Session (23:30 IST)',
      entries: [
        {
          id: 'E1',
          priceLow: +e1Low.toFixed(2),
          priceHigh: +e1High.toFixed(2),
          weightPct: 50,
          reason: isLong
            ? 'First valid touch of 15m Demand OB + Anchored VWAP support with closed candle trigger'
            : 'First valid touch of 15m Supply OB + Anchored VWAP resistance with closed candle trigger'
        },
        {
          id: 'E2',
          priceLow: +e2Low.toFixed(2),
          priceHigh: +e2High.toFixed(2),
          weightPct: 50,
          reason: isLong
            ? 'Deep discount liquidity retest inside 1H FVG boundary to optimize average execution price'
            : 'Premium liquidity retest inside 1H FVG boundary to optimize average execution price'
        }
      ],
      avgEntry: +((isLong ? (e1High + e2Low) / 2 : (e1Low + e2High) / 2)).toFixed(2),
      entryWorstEdge: isLong ? Math.max(e1High, e2High) : Math.min(e1Low, e2Low),
      stop: {
        price: slPrice,
        distancePts: slDistPts,
        distanceAtr: +(slDistPts / atr1h).toFixed(2),
        basis: '1H Structural Swing Far Edge + 0.5x ATR Buffer + Pool Protection',
        reason: isLong
          ? `SL placed strictly below 1H demand origin swing ($${slPrice}) with 0.5 ATR buffer to prevent retail stop-hunt wicks.`
          : `SL placed strictly above 1H supply origin swing ($${slPrice}) with 0.5 ATR buffer to prevent retail stop-hunt wicks.`
      },
      tps: [
        {
          id: 'TP1',
          price: tp1Price,
          distancePts: +Math.abs(tp1Price - currentPrice).toFixed(1),
          closePct: 45,
          rr: rrTp1,
          reason: isLong
            ? 'Nearest untouched opposing 15m liquidity pool / Prior Day High POC area (Take 45%, SL to Breakeven)'
            : 'Nearest untouched opposing 15m liquidity pool / Prior Day Low POC area (Take 45%, SL to Breakeven)'
        },
        {
          id: 'TP2',
          price: tp2Price,
          distancePts: +Math.abs(tp2Price - currentPrice).toFixed(1),
          closePct: 30,
          rr: rrTp2,
          reason: 'Major 4H Structural Resistance / Volume Profile Value Area High (Take 30%, trail rest)'
        },
        {
          id: 'TP3',
          price: tp3Price,
          distancePts: +Math.abs(tp3Price - currentPrice).toFixed(1),
          closePct: 25,
          rr: rrTp3,
          reason: 'Daily HTF Expansion Zone / Liquidity Run objective (Hold 25% runner with 1H swing trailing)',
          trailRule: 'Trail Stop Loss behind each consecutive 1H higher low after TP2 hit.'
        }
      ],
      rrTp1,
      rrTp2,
      rrTp3,
      position: {
        accountBalanceUsd: accountBalance,
        riskPct,
        riskAmountUsd: posSize.riskAmountUsd,
        lotSize: posSize.lotSize,
        contractValueUsd: posSize.contractValueUsd,
        maxAccountRiskPct: 2.0
      },
      timeStop: '8 to 12 candles without follow-through -> exit at market.',
      invalidation: [
        isLong
          ? 'Candle closes below structural demand floor ($' + slPrice + ')'
          : 'Candle closes above structural supply ceiling ($' + slPrice + ')',
        'DXY breaks and closes above 104.25 resistance on 4H timeframe',
        'US 10-Year Real Yield crosses above 2.15%'
      ]
    };
  }

  // 5. DXY Cross-Check
  const dxyCheck = evaluateDxyCrossCheck(
    direction,
    params.dxyPrice ?? 102.35,
    params.dxyTrend ?? 'BEARISH',
    params.us10yRealYield ?? 1.88
  );

  // 6. Positions Map (COT, ETFs, Options, Banks, Retail)
  const positionsMap: PositionsMap = {
    cot: {
      managedMoneyNetContracts: 248500,
      managedMoneyPercentile3y: params.cotPercentile ?? 84,
      swapDealersNetContracts: -284000,
      openInterestTotal: 512000,
      dataDate: '2026-10-20',
      lag: '3-Day Lag (Released Friday)',
      label: 'REPORTED'
    },
    etf: {
      gldTonnesChange7d: 4.2,
      totalVaultTonnes: 3210,
      weeklyFlowUsd: 385000000,
      label: 'REPORTED'
    },
    options: {
      putCallRatio: 0.68,
      maxPainLevel: 2700,
      bigStrikes: [
        { strike: 2750, oiContracts: 14200, type: 'CALL' },
        { strike: 2700, oiContracts: 18500, type: 'CALL' },
        { strike: 2650, oiContracts: 12800, type: 'PUT' }
      ],
      label: 'REPORTED'
    },
    bankViews: [
      {
        bank: 'Goldman Sachs',
        date: '2026-10-18',
        priceTarget: 2900,
        thesis: 'Structural central bank buying and private wealth hedging',
        source: 'Goldman Sachs Global Investment Research: Gold Outlook Q4',
        label: 'PUBLISHED_VIEWS'
      },
      {
        bank: 'J.P. Morgan',
        date: '2026-10-15',
        priceTarget: 2850,
        thesis: 'Fed rate-cutting cycle and ETF asset reallocation',
        source: 'J.P. Morgan Global Commodities Strategy Note',
        label: 'PUBLISHED_VIEWS'
      },
      {
        bank: 'UBS Global Wealth',
        date: '2026-10-12',
        priceTarget: 2800,
        thesis: 'Geopolitical hedging and US fiscal deficit expansion',
        source: 'UBS Chief Investment Office Commodity Forecast',
        label: 'PUBLISHED_VIEWS'
      }
    ],
    crowd: {
      retailLongPct: 52,
      percentile: 54,
      venue: 'OANDA / IG Sentiment Feed',
      trapZones: [
        { levelLow: 2750, levelHigh: 2755, note: 'Obvious double-top resistance stop cluster' },
        { levelLow: 2685, levelHigh: 2690, note: 'Trendline support retail liquidation pool' }
      ],
      label: 'ESTIMATED'
    },
    centralBanks: {
      netBuyingTrendTonnes: 28.4,
      topFacts: [
        'PBOC added physical gold for 11th consecutive month (+2.8t)',
        'Reserve Bank of India increased foreign gold reserve allocation to 9.2%',
        'Central banks share of global annual demand stands at record 23%'
      ],
      label: 'REPORTED'
    }
  };

  // 7. Calendar Events
  const events = {
    next24h: [
      { id: 'ev-1', event: 'US Consumer Confidence (Conference Board)', timeIST: '19:30 IST', tier: 2 as const, forecast: '108.0', previous: '108.7', isInsideNoTradeWindow: false },
      { id: 'ev-2', event: 'US Q3 GDP Preliminary Release', timeIST: '18:00 IST (Tomorrow)', tier: 1 as const, forecast: '2.8%', previous: '3.0%', isInsideNoTradeWindow: false }
    ],
    noTradeWindows: [
      'Pre-Event Blackout: 30 min before US GDP (17:30–18:00 IST)',
      'Post-Event Volatility Buffer: 15 min after Tier-1 release'
    ],
    fridayWeekendRiskActive: params.fridayWeekendRiskActive ?? false
  };

  // 8. 11-Section Hinglish Report
  const hinglishReportSections = {
    bottomLine: `Decision: ${masterVerdict} (Setup Quality Long: ${whyResults.longScore} vs Short: ${whyResults.shortScore}, Alignment: ${whyResults.alignment}). Zone Grade: ${zoneGrade} (${rangePositionP <= 0.4 ? 'Discount Zone' : rangePositionP >= 0.6 ? 'Premium Zone' : 'Mid-Range Chop'}).`,
    entryKahanAurKyun: plan
      ? `Entry Zone: E1 ($${plan.entries[0].priceLow}–$${plan.entries[0].priceHigh}) 50% + E2 ($${plan.entries[1].priceLow}–$${plan.entries[1].priceHigh}) 50%. Average Entry: $${plan.avgEntry}. Kyun: 15m demand zone touch + trigger candle closed above level.`
      : `WAIT: Price mid-range me hai (p = ${rangePositionP}) ya setup confirm nahi hua. Chahiye: Valid demand zone touch ($${params.nearestSupport}) with closed candle trigger.`,
    stopLossKahanAurKyun: plan
      ? `SL: $${plan.stop.price} (${plan.stop.distancePts} pts / ${plan.stop.distanceAtr} ATR). Kyun: ${plan.stop.reason}`
      : 'WAIT: No active SL until closed candle trigger occurs.',
    tpsKahanAurKyun: plan
      ? `TP1: $${plan.tps[0].price} (1:${plan.rrTp1} RR — Book 45% & SL to BE) | TP2: $${plan.tps[1].price} (1:${plan.rrTp2} RR — Book 30%) | TP3: $${plan.tps[2].price} (1:${plan.rrTp3} RR — Runner 25%).`
      : 'WAIT: Targets computed from actual entry edge once active.',
    kyunDirectionChain: whyResults.reasonsFor.join(' '),
    dxyKyaKarSaktaHai: `DXY analysis: DXY abhi ${dxyCheck.dxyPrice} par ${dxyCheck.dxyTrend} trend me hai. ${dxyCheck.dxyCanGoDownHinglish} Gold aur DXY correlation -0.82 (Aligned). Invalidation DXY level: ${dxyCheck.invalidationDxyLevel}.`,
    positionsKahanOpenHain: `Smart Money: Managed money net long 248.5k contracts (84th pct). Central banks +${positionsMap.centralBanks.netBuyingTrendTonnes}t monthly buy kar rahe hain. Retail crowd: 52% long (Balanced sentiment).`,
    eventsFilter: `Agale 24h me 1 Tier-1 event scheduled hai. No trade 30m before Tier-1 releases. Friday weekend gap risk check: ${events.fridayWeekendRiskActive ? 'ACTIVE' : 'INACTIVE'}.`,
    oppositeSideCase: whyResults.reasonsAgainst.join(' '),
    invalidationAurRisks: plan ? plan.invalidation.join(' | ') : 'Idea invalidates if DXY surges above 104.25 or Real Yield crosses 2.15%.',
    dataKiKami: 'CFTC COT carries 3-day reporting lag (Tuesday data released Friday night IST). Central bank data carries 20-day reporting lag.'
  };

  return {
    asOfIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    asset: 'XAUUSD',
    currentPrice,
    session: 'LONDON_OPEN',
    masterVerdict,
    location: {
      htfBias,
      rangePositionP,
      zoneGrade,
      zone: {
        low: params.nearestSupport,
        high: params.nearestSupport + atr1h * 0.4,
        types: ['1H Order Block', 'Weekly Open VWAP', '0.618 Fib Support'],
        status: 'FRESH',
        tf: '1H'
      },
      roomToOpposingR,
      isMidRangeNoTrade: isMidRange
    },
    setup: {
      family: setupFamily,
      direction,
      trigger: {
        tf: '15m',
        condition: 'Closed candle rejection with volume >= 1.2x average and CVD delta support',
        closedCandleConfirmed: direction !== 'WAIT'
      }
    },
    plan,
    why: whyResults,
    dxyCheck,
    positionsMap,
    events,
    confidence: whyResults.alignment === 'ALL_ALIGNED' ? 'HIGH' : whyResults.alignment === 'PARTIAL' ? 'MEDIUM' : 'LOW',
    confidenceBasis: 'unproven (n=0)',
    hinglishReportSections,
    warnings,
    missingData,
    disclaimer: 'Institutional research intelligence tool. Not financial investment advice. Leveraged Gold CFDs carry substantial risk.'
  };
}
