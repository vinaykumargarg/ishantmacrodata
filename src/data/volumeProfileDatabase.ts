/* ==========================================================================
   ADVANCED VOLUME PROFILE & MARKET STRUCTURE DATABASE & ALGORITHMIC ENGINE
   Assets: BTCUSD/BTCUSDT, ETHUSD/ETHUSDT, SOLUSD/SOLUSDT, XAUUSD (Gold), XAGUSD (Silver)
   VRVP, FRVP, Session, Anchored, Composite, POC, VAH (70%), VAL, HVN, LVN, CVD,
   Market Structure (BOS, CHoCH, FVG, EQH/EQL), and Multi-Factor LONG/SHORT/WAIT AI
   ========================================================================== */

export type AssetSymbol = 'BTCUSD' | 'ETHUSD' | 'SOLUSD' | 'XAUUSD' | 'XAGUSD' | 'USDTD' | 'DXY';
export type AssetClass = 'Crypto' | 'Precious Metals' | 'Macro Benchmark';
export type ProfileType = 'VRVP' | 'FRVP' | 'SESSION' | 'ANCHORED' | 'COMPOSITE';
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '1D' | '1W';
export type DataProvider = 'BINANCE_SPOT' | 'BINANCE_FUTURES' | 'COINBASE' | 'KRAKEN' | 'OANDA_OTC_TICK' | 'COMEX_FUTURES_PROXY';
export type SessionName = 'ALL' | 'ASIA' | 'LONDON' | 'NEW_YORK';
export type DecisionStatus = 'LONG SETUP' | 'SHORT SETUP' | 'WAIT' | 'NO TRADE / DATA UNAVAILABLE';
export type StructureBias = 'Bullish Expansion' | 'Bearish Breakdown' | 'Range-Bound Balance' | 'Liquidity Sweep Reversal';

export interface Candle {
  t: number;      // timestamp (ms)
  o: number;      // open
  h: number;      // high
  l: number;      // low
  c: number;      // close
  v: number;      // volume
  buyV?: number;  // aggressive buy volume
  sellV?: number; // aggressive sell volume
}

export interface VolumePriceRow {
  priceLevel: number;
  priceFormatted: string;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  isPoc: boolean;
  isInValueArea: boolean;
  isHvn: boolean;
  isLvn: boolean;
  volumePct: number; // percentage of maximum row volume
}

export interface VolumeProfileResult {
  poc: number;
  pocFormatted: string;
  vah: number;
  vahFormatted: string;
  val: number;
  valFormatted: string;
  vaPct: number;
  totalVolume: number;
  buyVolumeTotal: number;
  sellVolumeTotal: number;
  cvdTotal: number;
  rows: VolumePriceRow[];
  hvns: number[];
  lvns: number[];
  priceRange: { min: number; max: number };
  priceVsPoc: 'ABOVE_POC' | 'AT_POC' | 'BELOW_POC';
  priceVsVa: 'ABOVE_VAH' | 'INSIDE_VA' | 'BELOW_VAL';
  developingPocTrend: 'MIGRATING_UP' | 'STABLE' | 'MIGRATING_DOWN';
}

export interface AssetMetadata {
  symbol: AssetSymbol;
  name: string;
  assetClass: AssetClass;
  quoteCurrency: 'USD' | 'USDT';
  decimals: number;
  tickSize: number;
  lotUnit: string;
  basePrice: number;
  bidSpread: number;
  tvSymbol: string;
  supportedProviders: { id: DataProvider; label: string; volumeType: 'TRADED_VOLUME' | 'TICK_VOLUME' | 'FUTURES_PROXY' }[];
  marketHours: string;
  isDerivativesSupported: boolean;
  otcDisclaimer?: string;
}

export interface MarketStructureTelemetry {
  trend: 'UPTREND (HH/HL)' | 'DOWNTREND (LH/LL)' | 'CONSOLIDATION';
  lastBos: { level: number; type: 'BULLISH_BOS' | 'BEARISH_BOS'; timeStr: string };
  lastChoch: { level: number; type: 'BULLISH_CHOCH' | 'BEARISH_CHOCH'; timeStr: string };
  keySupport: number;
  keyResistance: number;
  fvgZones: { top: number; bottom: number; kind: 'BULLISH' | 'BEARISH' }[];
  liquidityPools: { eqh: number | null; eql: number | null; sweepStatus: string };
  priorDayPoc: number;
  priorDayVah: number;
  priorDayVal: number;
}

export interface OrderFlowTelemetry {
  isAvailable: boolean;
  cvd: number;
  cvdTrend: 'RISING (Aggressive Buying)' | 'FALLING (Aggressive Selling)' | 'FLAT';
  buySellRatio: number;
  stackedImbalances: { price: number; type: 'BUY_STACK' | 'SELL_STACK'; size: string }[];
  openInterest?: string;
  fundingRate?: string;
  largeTradeAlerts: { time: string; side: 'BUY' | 'SELL'; sizeUsd: string; price: number }[];
  absorptionAlert?: string;
  dataQualityWarning?: string;
}

export interface TradeDecision {
  status: DecisionStatus;
  confidenceScore: number; // 0 - 100
  qualityTier: 'A+ PRIME' | 'B TACTICAL' | 'C MARGINAL' | 'NO_EDGE';
  entryZone: string;
  entryPrice: number;
  stopLoss: number;
  stopLossFormatted: string;
  tp1: number;
  tp1Formatted: string;
  tp2: number;
  tp2Formatted: string;
  tp3: number;
  tp3Formatted: string;
  riskRewardRatio: string;
  invalidationTrigger: string;
  requiredPreConditions: string[];
  supportingEvidence: string[];
  conflictingEvidence: string[];
  catalystContext: string;
  estimatedCosts: { spreadUsd: number; slippagePct: string; feePct: string };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ASSET MASTER REGISTRY                                                      */
/* ────────────────────────────────────────────────────────────────────────── */
export const ASSET_REGISTRY: Record<AssetSymbol, AssetMetadata> = {
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    assetClass: 'Crypto',
    quoteCurrency: 'USDT',
    decimals: 2,
    tickSize: 0.1,
    lotUnit: 'BTC',
    basePrice: 82799.50,
    bidSpread: 0.50,
    tvSymbol: 'BINANCE:BTCUSDT',
    supportedProviders: [
      { id: 'BINANCE_SPOT', label: 'Binance Spot Tape', volumeType: 'TRADED_VOLUME' },
      { id: 'BINANCE_FUTURES', label: 'Binance USDT-M Futures', volumeType: 'TRADED_VOLUME' },
      { id: 'COINBASE', label: 'Coinbase Institutional', volumeType: 'TRADED_VOLUME' },
      { id: 'KRAKEN', label: 'Kraken Exchange Tape', volumeType: 'TRADED_VOLUME' }
    ],
    marketHours: '24/7/365 Continuous Real-Time',
    isDerivativesSupported: true
  },
  ETHUSD: {
    symbol: 'ETHUSD',
    name: 'Ethereum',
    assetClass: 'Crypto',
    quoteCurrency: 'USDT',
    decimals: 2,
    tickSize: 0.05,
    lotUnit: 'ETH',
    basePrice: 2493.80,
    bidSpread: 0.15,
    tvSymbol: 'BINANCE:ETHUSDT',
    supportedProviders: [
      { id: 'BINANCE_SPOT', label: 'Binance Spot Tape', volumeType: 'TRADED_VOLUME' },
      { id: 'BINANCE_FUTURES', label: 'Binance USDT-M Futures', volumeType: 'TRADED_VOLUME' },
      { id: 'COINBASE', label: 'Coinbase Prime', volumeType: 'TRADED_VOLUME' }
    ],
    marketHours: '24/7/365 Continuous Real-Time',
    isDerivativesSupported: true
  },
  SOLUSD: {
    symbol: 'SOLUSD',
    name: 'Solana',
    assetClass: 'Crypto',
    quoteCurrency: 'USDT',
    decimals: 2,
    tickSize: 0.01,
    lotUnit: 'SOL',
    basePrice: 109.47,
    bidSpread: 0.05,
    tvSymbol: 'BINANCE:SOLUSDT',
    supportedProviders: [
      { id: 'BINANCE_SPOT', label: 'Binance Spot Tape', volumeType: 'TRADED_VOLUME' },
      { id: 'BINANCE_FUTURES', label: 'Binance USDT-M Futures', volumeType: 'TRADED_VOLUME' },
      { id: 'COINBASE', label: 'Coinbase Pro Tape', volumeType: 'TRADED_VOLUME' }
    ],
    marketHours: '24/7/365 Continuous Real-Time',
    isDerivativesSupported: true
  },
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Spot Gold / USD',
    assetClass: 'Precious Metals',
    quoteCurrency: 'USD',
    decimals: 2,
    tickSize: 0.05,
    lotUnit: 'Troy Oz (100 oz standard lot)',
    basePrice: 4193.60,
    bidSpread: 0.25,
    tvSymbol: 'OANDA:XAUUSD',
    supportedProviders: [
      { id: 'OANDA_OTC_TICK', label: 'OANDA Global OTC (Tick Volume)', volumeType: 'TICK_VOLUME' },
      { id: 'COMEX_FUTURES_PROXY', label: 'CME/COMEX Gold Futures (GC1!)', volumeType: 'FUTURES_PROXY' }
    ],
    marketHours: 'Mon 00:00 – Fri 23:00 GMT (Daily break 21:00-22:00 GMT)',
    isDerivativesSupported: true,
    otcDisclaimer: 'Note: Spot Gold is a decentralized OTC interbank market without a single universal tape. Profiles use Broker Tick-Volume or CME COMEX Gold Futures (GC) centralized traded volume proxy.'
  },
  XAGUSD: {
    symbol: 'XAGUSD',
    name: 'Spot Silver / USD',
    assetClass: 'Precious Metals',
    quoteCurrency: 'USD',
    decimals: 3,
    tickSize: 0.005,
    lotUnit: 'Troy Oz (5,000 oz standard lot)',
    basePrice: 59.80,
    bidSpread: 0.02,
    tvSymbol: 'OANDA:XAGUSD',
    supportedProviders: [
      { id: 'OANDA_OTC_TICK', label: 'OANDA Global OTC (Tick Volume)', volumeType: 'TICK_VOLUME' },
      { id: 'COMEX_FUTURES_PROXY', label: 'CME/COMEX Silver Futures (SI1!)', volumeType: 'FUTURES_PROXY' }
    ],
    marketHours: 'Mon 00:00 – Fri 23:00 GMT (Daily break 21:00-22:00 GMT)',
    isDerivativesSupported: true,
    otcDisclaimer: 'Note: Spot Silver OTC market relies on venue-specific tick activity. CME/COMEX Silver Futures (SI) proxy is available for centralized exchange-traded contract volume.'
  },
  USDTD: {
    symbol: 'USDTD',
    name: 'USDT Dominance (%)',
    assetClass: 'Macro Benchmark',
    quoteCurrency: 'USDT',
    decimals: 2,
    tickSize: 0.01,
    lotUnit: '%',
    basePrice: 5.34,
    bidSpread: 0.01,
    tvSymbol: 'CRYPTOCAP:USDT.D',
    supportedProviders: [
      { id: 'BINANCE_SPOT', label: 'Tether Dominance Index', volumeType: 'TRADED_VOLUME' }
    ],
    marketHours: '24/7/365 Continuous Real-Time',
    isDerivativesSupported: false
  },
  DXY: {
    symbol: 'DXY',
    name: 'US Dollar Index',
    assetClass: 'Macro Benchmark',
    quoteCurrency: 'USD',
    decimals: 2,
    tickSize: 0.01,
    lotUnit: 'Pts',
    basePrice: 102.35,
    bidSpread: 0.02,
    tvSymbol: 'CAPITALCOM:DXY',
    supportedProviders: [
      { id: 'OANDA_OTC_TICK', label: 'ICE US Dollar Index Feed', volumeType: 'TICK_VOLUME' }
    ],
    marketHours: 'Mon 00:00 – Fri 23:00 GMT',
    isDerivativesSupported: true
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/* MATHEMATICAL VOLUME PROFILE CALCULATION ENGINE                             */
/* ────────────────────────────────────────────────────────────────────────── */
export function calculateVolumeProfile(
  candles: Candle[],
  numBins = 50,
  vaPercentage = 0.70
): VolumeProfileResult {
  if (!candles || candles.length === 0) {
    return {
      poc: 0,
      pocFormatted: '$0.00',
      vah: 0,
      vahFormatted: '$0.00',
      val: 0,
      valFormatted: '$0.00',
      vaPct: 70,
      totalVolume: 0,
      buyVolumeTotal: 0,
      sellVolumeTotal: 0,
      cvdTotal: 0,
      rows: [],
      hvns: [],
      lvns: [],
      priceRange: { min: 0, max: 0 },
      priceVsPoc: 'AT_POC',
      priceVsVa: 'INSIDE_VA',
      developingPocTrend: 'STABLE'
    };
  }

  // 1. Calculate price boundary across candle subset
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalVol = 0;
  let totalBuy = 0;
  let totalSell = 0;

  for (const c of candles) {
    if (c.l < minPrice) minPrice = c.l;
    if (c.h > maxPrice) maxPrice = c.h;
    totalVol += c.v;
  }

  if (minPrice === maxPrice) {
    maxPrice += 1;
    minPrice -= 1;
  }

  const binStep = (maxPrice - minPrice) / numBins;

  // Initialize bins
  const bins: {
    priceLevel: number;
    buyV: number;
    sellV: number;
    totalV: number;
  }[] = [];

  for (let i = 0; i < numBins; i++) {
    bins.push({
      priceLevel: minPrice + (i + 0.5) * binStep,
      buyV: 0,
      sellV: 0,
      totalV: 0
    });
  }

  // 2. Allocate candle volume across price bins
  for (const c of candles) {
    const range = Math.max(0.0001, c.h - c.l);
    // Candle Buy / Sell ratio derived from close vs open position
    const buyFraction = c.buyV && c.sellV
      ? c.buyV / (c.buyV + c.sellV)
      : c.c >= c.o
        ? 0.5 + 0.4 * Math.min(1, (c.c - c.o) / range)
        : 0.5 - 0.4 * Math.min(1, (c.o - c.c) / range);

    const candleBuyVol = c.v * buyFraction;
    const candleSellVol = c.v * (1 - buyFraction);
    totalBuy += candleBuyVol;
    totalSell += candleSellVol;

    // Overlapping bins
    const startBin = Math.max(0, Math.min(numBins - 1, Math.floor((c.l - minPrice) / binStep)));
    const endBin = Math.max(0, Math.min(numBins - 1, Math.floor((c.h - minPrice) / binStep)));
    const binCount = Math.max(1, endBin - startBin + 1);
    const volPerBin = c.v / binCount;
    const buyPerBin = candleBuyVol / binCount;
    const sellPerBin = candleSellVol / binCount;

    for (let b = startBin; b <= endBin; b++) {
      bins[b].totalV += volPerBin;
      bins[b].buyV += buyPerBin;
      bins[b].sellV += sellPerBin;
    }
  }

  // 3. Find POC (Point of Control)
  let maxBinVol = 0;
  let pocIndex = 0;
  for (let i = 0; i < bins.length; i++) {
    if (bins[i].totalV > maxBinVol) {
      maxBinVol = bins[i].totalV;
      pocIndex = i;
    }
  }

  const pocPrice = bins[pocIndex].priceLevel;

  // 4. Calculate Value Area (VAH and VAL) with 70% Volume Area Rule
  const targetVaVol = totalVol * vaPercentage;
  let currentVaVol = bins[pocIndex].totalV;
  let upper = pocIndex + 1;
  let lower = pocIndex - 1;
  const inVaSet = new Set<number>([pocIndex]);

  while (currentVaVol < targetVaVol && (upper < bins.length || lower >= 0)) {
    const upperVol = (upper < bins.length ? bins[upper].totalV : 0) +
                     (upper + 1 < bins.length ? bins[upper + 1].totalV : 0);
    const lowerVol = (lower >= 0 ? bins[lower].totalV : 0) +
                     (lower - 1 >= 0 ? bins[lower - 1].totalV : 0);

    if (upperVol >= lowerVol && upper < bins.length) {
      inVaSet.add(upper);
      currentVaVol += bins[upper].totalV;
      upper++;
    } else if (lower >= 0) {
      inVaSet.add(lower);
      currentVaVol += bins[lower].totalV;
      lower--;
    } else if (upper < bins.length) {
      inVaSet.add(upper);
      currentVaVol += bins[upper].totalV;
      upper++;
    } else {
      break;
    }
  }

  let minVaIndex = pocIndex;
  let maxVaIndex = pocIndex;
  inVaSet.forEach(idx => {
    if (idx < minVaIndex) minVaIndex = idx;
    if (idx > maxVaIndex) maxVaIndex = idx;
  });

  const valPrice = bins[minVaIndex].priceLevel - binStep * 0.5;
  const vahPrice = bins[maxVaIndex].priceLevel + binStep * 0.5;

  // 5. Detect HVNs (High Volume Nodes) and LVNs (Low Volume Nodes)
  const avgVol = totalVol / numBins;
  const hvns: number[] = [];
  const lvns: number[] = [];

  for (let i = 1; i < bins.length - 1; i++) {
    const prev = bins[i - 1].totalV;
    const curr = bins[i].totalV;
    const next = bins[i + 1].totalV;

    // Local peak > 1.25x average
    if (curr > prev && curr > next && curr > avgVol * 1.25) {
      hvns.push(bins[i].priceLevel);
    }
    // Local trough < 0.55x average
    if (curr < prev && curr < next && curr < avgVol * 0.55) {
      lvns.push(bins[i].priceLevel);
    }
  }

  // 6. Map to VolumePriceRow
  const rows: VolumePriceRow[] = bins.map((b, idx) => {
    const isPoc = idx === pocIndex;
    const isInValueArea = inVaSet.has(idx);
    const isHvn = hvns.includes(b.priceLevel);
    const isLvn = lvns.includes(b.priceLevel);
    return {
      priceLevel: +b.priceLevel.toFixed(2),
      priceFormatted: b.priceLevel >= 1000 ? `$${b.priceLevel.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : `$${b.priceLevel.toFixed(2)}`,
      totalVolume: Math.round(b.totalV),
      buyVolume: Math.round(b.buyV),
      sellVolume: Math.round(b.sellV),
      delta: Math.round(b.buyV - b.sellV),
      isPoc,
      isInValueArea,
      isHvn,
      isLvn,
      volumePct: maxBinVol > 0 ? (b.totalV / maxBinVol) * 100 : 0
    };
  });

  // Latest candle price comparison
  const latestClose = candles[candles.length - 1].c;
  const priceVsPoc: 'ABOVE_POC' | 'AT_POC' | 'BELOW_POC' =
    latestClose > pocPrice * 1.001 ? 'ABOVE_POC' : latestClose < pocPrice * 0.999 ? 'BELOW_POC' : 'AT_POC';

  const priceVsVa: 'ABOVE_VAH' | 'INSIDE_VA' | 'BELOW_VAL' =
    latestClose > vahPrice ? 'ABOVE_VAH' : latestClose < valPrice ? 'BELOW_VAL' : 'INSIDE_VA';

  // Developing POC migration: compare POC of first half of candles with full POC
  const halfCandles = candles.slice(0, Math.floor(candles.length / 2));
  let devTrend: 'MIGRATING_UP' | 'STABLE' | 'MIGRATING_DOWN' = 'STABLE';
  if (halfCandles.length > 5) {
    const earlyPoc = calculateVolumeProfile(halfCandles, Math.min(30, numBins), vaPercentage).poc;
    if (pocPrice > earlyPoc * 1.002) devTrend = 'MIGRATING_UP';
    else if (pocPrice < earlyPoc * 0.998) devTrend = 'MIGRATING_DOWN';
  }

  return {
    poc: +pocPrice.toFixed(2),
    pocFormatted: pocPrice >= 1000 ? `$${pocPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${pocPrice.toFixed(2)}`,
    vah: +vahPrice.toFixed(2),
    vahFormatted: vahPrice >= 1000 ? `$${vahPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${vahPrice.toFixed(2)}`,
    val: +valPrice.toFixed(2),
    valFormatted: valPrice >= 1000 ? `$${valPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${valPrice.toFixed(2)}`,
    vaPct: Math.round(vaPercentage * 100),
    totalVolume: Math.round(totalVol),
    buyVolumeTotal: Math.round(totalBuy),
    sellVolumeTotal: Math.round(totalSell),
    cvdTotal: Math.round(totalBuy - totalSell),
    rows,
    hvns,
    lvns,
    priceRange: { min: +minPrice.toFixed(2), max: +maxPrice.toFixed(2) },
    priceVsPoc,
    priceVsVa,
    developingPocTrend: devTrend
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SYNTHETIC REALISTIC BENCHMARK CANDLE GENERATOR (15M / 1H / 4H)            */
/* Authentically models real volatility, session rotations, and volume spikes */
/* ────────────────────────────────────────────────────────────────────────── */
export function generateBenchmarkCandles(
  symbol: AssetSymbol,
  count = 96
): Candle[] {
  const meta = ASSET_REGISTRY[symbol];
  const base = meta.basePrice;
  const now = Date.now();
  const stepMs = 15 * 60 * 1000; // 15m intervals
  const candles: Candle[] = [];

  // Volatility multiplier per asset
  const volPct = symbol === 'BTCUSD' ? 0.0035 : symbol === 'ETHUSD' ? 0.0045 : symbol === 'SOLUSD' ? 0.0065 : symbol === 'XAUUSD' ? 0.0020 : symbol === 'USDTD' ? 0.0022 : symbol === 'DXY' ? 0.0012 : 0.0030;
  const baseVol = symbol === 'BTCUSD' ? 240 : symbol === 'ETHUSD' ? 1800 : symbol === 'SOLUSD' ? 22000 : symbol === 'XAUUSD' ? 4200 : symbol === 'USDTD' ? 1200 : symbol === 'DXY' ? 3400 : 8500;

  let currentPrice = base * (1 - volPct * 4); // start slightly lower for realistic trend

  for (let i = 0; i < count; i++) {
    const t = now - (count - i) * stepMs;
    // Introduce gentle wave cycles with random walk
    const cycle = Math.sin((i / count) * Math.PI * 3.5) * volPct * base * 0.8;
    const noise = (Math.random() - 0.48) * volPct * base;
    const open = currentPrice;
    const close = +(open + cycle * 0.15 + noise).toFixed(meta.decimals);
    const wickHigh = +(Math.max(open, close) + Math.random() * volPct * base * 0.7).toFixed(meta.decimals);
    const wickLow = +(Math.min(open, close) - Math.random() * volPct * base * 0.7).toFixed(meta.decimals);

    // Volume with session bursts (e.g. London / NY overlap)
    const sessionMultiplier = (i % 32 >= 12 && i % 32 <= 24) ? 1.8 : 0.9;
    const volume = Math.round(baseVol * sessionMultiplier * (0.6 + Math.random() * 0.8));
    const buyVol = close >= open ? Math.round(volume * (0.52 + Math.random() * 0.25)) : Math.round(volume * (0.35 + Math.random() * 0.15));
    const sellVol = volume - buyVol;

    candles.push({
      t,
      o: open,
      h: wickHigh,
      l: wickLow,
      c: close,
      v: volume,
      buyV: buyVol,
      sellV: sellVol
    });

    currentPrice = close;
  }

  // Ensure latest candle reflects exact current baseline
  const last = candles[candles.length - 1];
  last.c = meta.basePrice;
  last.h = Math.max(last.h, meta.basePrice);
  last.l = Math.min(last.l, meta.basePrice);

  return candles;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MULTI-FACTOR LONG / SHORT / WAIT AI DECISION ENGINE                         */
/* ────────────────────────────────────────────────────────────────────────── */
export function evaluateVolumeProfileDecision(
  symbol: AssetSymbol,
  vp: VolumeProfileResult,
  currentPrice: number,
  structure: MarketStructureTelemetry,
  orderFlow: OrderFlowTelemetry
): TradeDecision {
  const meta = ASSET_REGISTRY[symbol];
  const poc = vp.poc;
  const vah = vp.vah;
  const val = vp.val;

  // Evidence collector
  const supporting: string[] = [];
  const conflicting: string[] = [];
  let score = 50;

  // Factor 1: Price relative to Value Area and POC
  if (currentPrice > vah) {
    supporting.push(`Price is trading above Value Area High ($${vah.toLocaleString()}), showing bullish expansion above 70% value.`);
    score += 12;
  } else if (currentPrice < val) {
    supporting.push(`Price is auctioning below Value Area Low ($${val.toLocaleString()}), reflecting seller imbalance and value rejection.`);
    score -= 12;
  } else {
    supporting.push(`Price is rotating inside Value Area ($${val.toLocaleString()} – $${vah.toLocaleString()}), in balanced consolidation.`);
  }

  // Factor 2: POC Acceptance vs Rejection
  if (currentPrice >= poc) {
    supporting.push(`Price holding above Point of Control ($${poc.toLocaleString()}), buyers defending high-volume institutional baseline.`);
    score += 10;
  } else {
    supporting.push(`Price capped below Point of Control ($${poc.toLocaleString()}), POC acts as overhead supply resistance.`);
    score -= 10;
  }

  // Factor 3: Market Structure (BOS / CHoCH)
  if (structure.trend.startsWith('UPTREND')) {
    supporting.push(`Higher Timeframe structure prints Higher Highs / Higher Lows with confirmed Bullish BOS at $${structure.lastBos.level.toLocaleString()}.`);
    score += 14;
  } else if (structure.trend.startsWith('DOWNTREND')) {
    supporting.push(`Market structure prints Lower Highs / Lower Lows with Bearish Breakdown at $${structure.lastBos.level.toLocaleString()}.`);
    score -= 14;
  } else {
    conflicting.push('Market structure is currently in neutral consolidation / range-bound balance.');
  }

  // Factor 4: Cumulative Volume Delta (CVD)
  if (orderFlow.isAvailable) {
    if (orderFlow.cvdTrend.startsWith('RISING')) {
      supporting.push(`Cumulative Volume Delta (+${orderFlow.cvd.toLocaleString()}) confirms aggressive market buyers absorbing resting liquidity.`);
      score += 10;
    } else if (orderFlow.cvdTrend.startsWith('FALLING')) {
      supporting.push(`CVD is diverging negative, indicating market orders skewed towards aggressive sellers.`);
      score -= 10;
    }
  } else {
    conflicting.push(orderFlow.dataQualityWarning || 'Direct tick-level order book depth tape unavailable for this OTC instrument; proxy metrics applied.');
  }

  // Factor 5: LVN Fast-Travel & Liquidity Sweeps
  if (structure.liquidityPools.sweepStatus.includes('Clean')) {
    supporting.push(`Session low liquidity swept clean; price reclaimed back into Value Area.`);
    score += 8;
  }

  // Clamp score
  score = Math.max(15, Math.min(95, score));

  // Determine Primary Decision
  let status: DecisionStatus = 'WAIT';
  let qualityTier: 'A+ PRIME' | 'B TACTICAL' | 'C MARGINAL' | 'NO_EDGE' = 'B TACTICAL';

  if (score >= 68 && currentPrice >= poc) {
    status = 'LONG SETUP';
    qualityTier = score >= 80 ? 'A+ PRIME' : 'B TACTICAL';
  } else if (score <= 35 && currentPrice < poc) {
    status = 'SHORT SETUP';
    qualityTier = score <= 25 ? 'A+ PRIME' : 'B TACTICAL';
  } else {
    status = 'WAIT';
    qualityTier = 'C MARGINAL';
  }

  // Concrete Trade Plan Levels
  const isLong = status === 'LONG SETUP';
  const entryPrice = currentPrice;
  const slBuffer = isLong ? Math.min(val, currentPrice * 0.985) : Math.max(vah, currentPrice * 1.015);
  const stopLoss = +(slBuffer).toFixed(meta.decimals);
  const riskDist = Math.max(0.5, Math.abs(entryPrice - stopLoss));

  const tp1 = +(isLong ? entryPrice + riskDist * 1.5 : entryPrice - riskDist * 1.5).toFixed(meta.decimals);
  const tp2 = +(isLong ? entryPrice + riskDist * 2.4 : entryPrice - riskDist * 2.4).toFixed(meta.decimals);
  const tp3 = +(isLong ? entryPrice + riskDist * 3.8 : entryPrice - riskDist * 3.8).toFixed(meta.decimals);

  const rrStr = isLong ? `1 : ${(Math.abs(tp2 - entryPrice) / riskDist).toFixed(1)}` : `1 : ${(Math.abs(entryPrice - tp2) / riskDist).toFixed(1)}`;

  const fmt = (p: number) => p >= 1000 ? `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${p.toFixed(2)}`;

  return {
    status,
    confidenceScore: score,
    qualityTier,
    entryZone: isLong ? `${fmt(currentPrice * 0.998)} – ${fmt(currentPrice * 1.002)} (Near POC/VAL Shelf)` : `${fmt(currentPrice * 0.998)} – ${fmt(currentPrice * 1.002)} (Under POC Rejection)`,
    entryPrice,
    stopLoss,
    stopLossFormatted: fmt(stopLoss),
    tp1,
    tp1Formatted: fmt(tp1),
    tp2,
    tp2Formatted: fmt(tp2),
    tp3,
    tp3Formatted: fmt(tp3),
    riskRewardRatio: rrStr,
    invalidationTrigger: isLong
      ? `Hourly close below VAL ($${val.toLocaleString()}) or strong volume expansion below $${fmt(stopLoss)}`
      : `Hourly close back above POC ($${poc.toLocaleString()}) or reclaim of VAH at $${fmt(stopLoss)}`,
    requiredPreConditions: isLong ? [
      `Wait for 15-minute candle acceptance holding above $${poc.toLocaleString()} (POC)`,
      `Confirm CVD delta is not negative during the entry test`,
      `Verify bid/ask spread is within normal limit (<= $${meta.bidSpread * 2})`
    ] : [
      `Wait for rejection wick under Point of Control at $${poc.toLocaleString()}`,
      `Ensure negative CVD delta expansion confirms distribution`,
      `Risk must be capped with invalidation immediately above local HVN`
    ],
    supportingEvidence: supporting,
    conflictingEvidence: conflicting,
    catalystContext: symbol.startsWith('XAU') || symbol.startsWith('XAG')
      ? 'US CPI and upcoming FOMC rate path dictate real yields; strong central bank gold reserve buying provides structural floor.'
      : 'Fed easing cycle, stablecoin liquidity expansion, and institutional ETF inflows drive underlying structural demand.',
    estimatedCosts: {
      spreadUsd: meta.bidSpread,
      slippagePct: '0.02%',
      feePct: '0.04% (Taker) / 0.02% (Maker)'
    }
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MOCK TELEMETRY SEED PROVIDER (REALISTIC CONTEXTS FOR ALL 5 ASSETS)         */
/* ────────────────────────────────────────────────────────────────────────── */
export function getAssetTelemetry(symbol: AssetSymbol): {
  structure: MarketStructureTelemetry;
  orderFlow: OrderFlowTelemetry;
} {
  const meta = ASSET_REGISTRY[symbol];
  const p = meta.basePrice;

  if (symbol === 'BTCUSD') {
    return {
      structure: {
        trend: 'UPTREND (HH/HL)',
        lastBos: { level: +(p * 0.982).toFixed(2), type: 'BULLISH_BOS', timeStr: '4H Candle Breakout' },
        lastChoch: { level: +(p * 0.965).toFixed(2), type: 'BULLISH_CHOCH', timeStr: 'Daily Structure Flip' },
        keySupport: +(p * 0.988).toFixed(2),
        keyResistance: +(p * 1.025).toFixed(2),
        fvgZones: [{ top: +(p * 0.995).toFixed(2), bottom: +(p * 0.991).toFixed(2), kind: 'BULLISH' }],
        liquidityPools: { eqh: +(p * 1.032).toFixed(2), eql: +(p * 0.978).toFixed(2), sweepStatus: 'Prior Asian Low Swept Clean' },
        priorDayPoc: +(p * 0.994).toFixed(2),
        priorDayVah: +(p * 1.012).toFixed(2),
        priorDayVal: +(p * 0.985).toFixed(2)
      },
      orderFlow: {
        isAvailable: true,
        cvd: 4820,
        cvdTrend: 'RISING (Aggressive Buying)',
        buySellRatio: 1.28,
        stackedImbalances: [
          { price: +(p * 0.998).toFixed(2), type: 'BUY_STACK', size: '380 BTC' },
          { price: +(p * 1.002).toFixed(2), type: 'BUY_STACK', size: '240 BTC' }
        ],
        openInterest: '$34.2B (+2.4% 24h)',
        fundingRate: '+0.0082% (Neutral-Bullish)',
        largeTradeAlerts: [
          { time: '14:28:10', side: 'BUY', sizeUsd: '$3.4M', price: +(p * 0.999).toFixed(2) },
          { time: '14:15:02', side: 'BUY', sizeUsd: '$1.8M', price: +(p * 0.997).toFixed(2) }
        ],
        absorptionAlert: 'Buyer absorption detected at VAL demand shelf ($' + (p * 0.988).toFixed(0) + ')'
      }
    };
  }

  if (symbol === 'ETHUSD') {
    return {
      structure: {
        trend: 'CONSOLIDATION',
        lastBos: { level: +(p * 0.975).toFixed(2), type: 'BULLISH_BOS', timeStr: '1H Structure' },
        lastChoch: { level: +(p * 0.960).toFixed(2), type: 'BULLISH_CHOCH', timeStr: '4H Retest' },
        keySupport: +(p * 0.982).toFixed(2),
        keyResistance: +(p * 1.028).toFixed(2),
        fvgZones: [{ top: +(p * 0.992).toFixed(2), bottom: +(p * 0.988).toFixed(2), kind: 'BULLISH' }],
        liquidityPools: { eqh: +(p * 1.035).toFixed(2), eql: +(p * 0.972).toFixed(2), sweepStatus: 'Equal Lows Liquidity Resting Below' },
        priorDayPoc: +(p * 0.998).toFixed(2),
        priorDayVah: +(p * 1.015).toFixed(2),
        priorDayVal: +(p * 0.984).toFixed(2)
      },
      orderFlow: {
        isAvailable: true,
        cvd: 1240,
        cvdTrend: 'FLAT',
        buySellRatio: 1.04,
        stackedImbalances: [
          { price: +(p * 0.995).toFixed(2), type: 'BUY_STACK', size: '4,200 ETH' }
        ],
        openInterest: '$11.8B (+0.8% 24h)',
        fundingRate: '+0.0054% (Normal)',
        largeTradeAlerts: [
          { time: '14:19:35', side: 'BUY', sizeUsd: '$1.2M', price: +(p * 0.999).toFixed(2) }
        ]
      }
    };
  }

  if (symbol === 'SOLUSD') {
    return {
      structure: {
        trend: 'UPTREND (HH/HL)',
        lastBos: { level: +(p * 0.965).toFixed(2), type: 'BULLISH_BOS', timeStr: '15M Breakout' },
        lastChoch: { level: +(p * 0.940).toFixed(2), type: 'BULLISH_CHOCH', timeStr: '1H Momentum' },
        keySupport: +(p * 0.975).toFixed(2),
        keyResistance: +(p * 1.035).toFixed(2),
        fvgZones: [{ top: +(p * 0.995).toFixed(2), bottom: +(p * 0.989).toFixed(2), kind: 'BULLISH' }],
        liquidityPools: { eqh: +(p * 1.040).toFixed(2), eql: +(p * 0.965).toFixed(2), sweepStatus: 'Asia Low Clean Sweep' },
        priorDayPoc: +(p * 0.991).toFixed(2),
        priorDayVah: +(p * 1.020).toFixed(2),
        priorDayVal: +(p * 0.978).toFixed(2)
      },
      orderFlow: {
        isAvailable: true,
        cvd: 18500,
        cvdTrend: 'RISING (Aggressive Buying)',
        buySellRatio: 1.34,
        stackedImbalances: [
          { price: +(p * 0.996).toFixed(2), type: 'BUY_STACK', size: '28,000 SOL' }
        ],
        openInterest: '$2.4B (+4.1% 24h)',
        fundingRate: '+0.0112% (Bullish)',
        largeTradeAlerts: [
          { time: '14:22:15', side: 'BUY', sizeUsd: '$840k', price: +(p * 0.998).toFixed(2) }
        ],
        absorptionAlert: 'High volume node accumulation shelf formed at $' + (p * 0.99).toFixed(1)
      }
    };
  }

  if (symbol === 'XAUUSD') {
    return {
      structure: {
        trend: 'UPTREND (HH/HL)',
        lastBos: { level: +(p * 0.988).toFixed(2), type: 'BULLISH_BOS', timeStr: '4H All-Time High Extension' },
        lastChoch: { level: +(p * 0.975).toFixed(2), type: 'BULLISH_CHOCH', timeStr: 'Daily Trend Support' },
        keySupport: +(p * 0.992).toFixed(2),
        keyResistance: +(p * 1.015).toFixed(2),
        fvgZones: [{ top: +(p * 0.997).toFixed(2), bottom: +(p * 0.993).toFixed(2), kind: 'BULLISH' }],
        liquidityPools: { eqh: +(p * 1.018).toFixed(2), eql: +(p * 0.988).toFixed(2), sweepStatus: 'London Low Swept & Reclaimed' },
        priorDayPoc: +(p * 0.996).toFixed(2),
        priorDayVah: +(p * 1.008).toFixed(2),
        priorDayVal: +(p * 0.991).toFixed(2)
      },
      orderFlow: {
        isAvailable: false,
        cvd: 0,
        cvdTrend: 'FLAT',
        buySellRatio: 1.0,
        stackedImbalances: [],
        largeTradeAlerts: [],
        dataQualityWarning: 'OTC Spot Gold lacks a centralized order book tape. Tick-volume distribution is sourced from interbank liquidity feeds, or CME COMEX Gold Futures proxy.'
      }
    };
  }

  if (symbol === 'USDTD') {
    return {
      structure: {
        trend: 'CONSOLIDATION',
        lastBos: { level: +(p * 0.985).toFixed(2), type: 'BEARISH_BOS', timeStr: '1H Range' },
        lastChoch: { level: +(p * 1.025).toFixed(2), type: 'BULLISH_CHOCH', timeStr: '4H Level' },
        keySupport: 5.30,
        keyResistance: 5.58,
        fvgZones: [{ top: 5.48, bottom: 5.42, kind: 'BEARISH' }],
        liquidityPools: { eqh: 5.62, eql: 5.28, sweepStatus: 'VAL Demand Shelf Active' },
        priorDayPoc: 5.44,
        priorDayVah: 5.54,
        priorDayVal: 5.34
      },
      orderFlow: {
        isAvailable: true,
        cvd: -240,
        cvdTrend: 'FLAT',
        buySellRatio: 0.96,
        stackedImbalances: [],
        largeTradeAlerts: [],
        openInterest: '$14.2B USDT',
        fundingRate: 'N/A'
      }
    };
  }

  if (symbol === 'DXY') {
    return {
      structure: {
        trend: 'CONSOLIDATION',
        lastBos: { level: +(p * 0.992).toFixed(2), type: 'BULLISH_BOS', timeStr: '1H Rebound' },
        lastChoch: { level: +(p * 1.015).toFixed(2), type: 'BEARISH_CHOCH', timeStr: '4H Resistance' },
        keySupport: 101.90,
        keyResistance: 102.85,
        fvgZones: [{ top: 102.60, bottom: 102.40, kind: 'BEARISH' }],
        liquidityPools: { eqh: 103.10, eql: 101.80, sweepStatus: 'Equal Lows Floor Held' },
        priorDayPoc: 102.35,
        priorDayVah: 102.75,
        priorDayVal: 101.95
      },
      orderFlow: {
        isAvailable: true,
        cvd: 450,
        cvdTrend: 'RISING (Aggressive Buying)',
        buySellRatio: 1.08,
        stackedImbalances: [],
        largeTradeAlerts: [],
        dataQualityWarning: 'ICE US Dollar Index centralized currency basket weights applied.'
      }
    };
  }

  // XAGUSD (Silver)
  return {
    structure: {
      trend: 'UPTREND (HH/HL)',
      lastBos: { level: +(p * 0.982).toFixed(3), type: 'BULLISH_BOS', timeStr: 'Daily Multi-Year Breakout' },
      lastChoch: { level: +(p * 0.965).toFixed(3), type: 'BULLISH_CHOCH', timeStr: 'Weekly Retest' },
      keySupport: +(p * 0.990).toFixed(3),
      keyResistance: +(p * 1.025).toFixed(3),
      fvgZones: [{ top: +(p * 0.996).toFixed(3), bottom: +(p * 0.991).toFixed(3), kind: 'BULLISH' }],
      liquidityPools: { eqh: +(p * 1.030).toFixed(3), eql: +(p * 0.982).toFixed(3), sweepStatus: 'Equal Lows Absorbed' },
      priorDayPoc: +(p * 0.994).toFixed(3),
      priorDayVah: +(p * 1.012).toFixed(3),
      priorDayVal: +(p * 0.988).toFixed(3)
    },
    orderFlow: {
      isAvailable: false,
      cvd: 0,
      cvdTrend: 'FLAT',
      buySellRatio: 1.0,
      stackedImbalances: [],
      largeTradeAlerts: [],
      dataQualityWarning: 'OTC Spot Silver does not report centralized depth. Tick activity is calculated via global liquidity providers.'
    }
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* INTER-MARKET VOLUME PROFILE CONFLUENCE ENGINE (BTC ⮂ USDT.D & GOLD ⮂ DXY)  */
/* Based on D-Profile: High -> Resistance, POC -> Profit Target, Low -> Support*/
/* ────────────────────────────────────────────────────────────────────────── */

export type IntermarketPairType = 'BTC_USDTD' | 'GOLD_DXY';

export interface DProfileItem {
  symbol: AssetSymbol;
  name: string;
  price: number;
  priceFormatted: string;
  vah: number;
  vahFormatted: string;
  poc: number;
  pocFormatted: string;
  val: number;
  valFormatted: string;
  zone: 'ABOVE_VAH' | 'INSIDE_VA' | 'BELOW_VAL';
  zoneLabel: string;
  highResistanceFormatted: string;
  pocProfitTargetFormatted: string;
  lowSupportFormatted: string;
  profile: VolumeProfileResult;
  hvns: number[];
  lvns: number[];
}

export interface IntermarketVpConfluenceResult {
  pair: IntermarketPairType;
  targetAsset: DProfileItem;
  inverseAsset: DProfileItem;
  confluenceSignal: 'STRONG_SHORT' | 'STRONG_LONG' | 'PARTIAL_SETUP' | 'NO_CONFLUENCE';
  badgeType: 'SHORT' | 'LONG' | 'WAIT';
  confidenceScore: number;
  badgeText: string;
  headline: string;
  coreRuleMatched: string;
  executionPlan: {
    action: 'SHORT' | 'LONG' | 'WAIT';
    entryZone: string;
    entryPrice: number;
    stopLoss: number;
    stopLossFormatted: string;
    profitTargetPoc: number;
    profitTargetPocFormatted: string;
    runnerTargetVa: number;
    runnerTargetVaFormatted: string;
    riskRewardRatio: string;
    invalidationClause: string;
  };
  hinglishLogic: string;
  dProfileGuide: {
    resistanceExplanation: string;
    pocTargetExplanation: string;
    supportExplanation: string;
  };
}

function formatPriceForSymbol(p: number, symbol: AssetSymbol): string {
  if (symbol === 'USDTD') {
    return `${p.toFixed(2)}%`;
  }
  if (symbol === 'DXY') {
    return `${p.toFixed(2)} pts`;
  }
  if (p >= 1000) {
    return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${p.toFixed(2)}`;
}

/**
 * Builds a standardized DProfileItem for any supported asset
 */
export function buildAssetDProfile(
  symbol: AssetSymbol,
  overridePrice?: number,
  customCandles?: Candle[]
): DProfileItem {
  const candles = customCandles && customCandles.length > 0
    ? customCandles
    : generateBenchmarkCandles(symbol, 96);
  const profile = calculateVolumeProfile(candles, 45, 0.70);
  const meta = ASSET_REGISTRY[symbol];
  const price = overridePrice !== undefined ? overridePrice : meta.basePrice;

  const isAboveVah = price > profile.vah;
  const isBelowVal = price < profile.val;
  const zone: 'ABOVE_VAH' | 'INSIDE_VA' | 'BELOW_VAL' = isAboveVah
    ? 'ABOVE_VAH'
    : isBelowVal
    ? 'BELOW_VAL'
    : 'INSIDE_VA';

  const zoneLabel = isAboveVah
    ? '🔴 RESISTANCE HIGH (> VAH)'
    : isBelowVal
    ? '🟢 SUPPORT FLOOR (< VAL)'
    : '🔵 FAIR VALUE (70% VA)';

  return {
    symbol,
    name: meta.name,
    price,
    priceFormatted: formatPriceForSymbol(price, symbol),
    vah: profile.vah,
    vahFormatted: formatPriceForSymbol(profile.vah, symbol),
    poc: profile.poc,
    pocFormatted: formatPriceForSymbol(profile.poc, symbol),
    val: profile.val,
    valFormatted: formatPriceForSymbol(profile.val, symbol),
    zone,
    zoneLabel,
    highResistanceFormatted: formatPriceForSymbol(profile.vah, symbol),
    pocProfitTargetFormatted: formatPriceForSymbol(profile.poc, symbol),
    lowSupportFormatted: formatPriceForSymbol(profile.val, symbol),
    profile,
    hvns: profile.hvns,
    lvns: profile.lvns
  };
}

/**
 * Evaluates Intermarket Volume Profile Confluence:
 * 1. BTC vs USDT.D:
 *    - Short Confluence: BTC > VAH (High / Resistance) AND USDT.D < VAL (Low / Support)
 *    - Long Confluence: BTC < VAL (Low / Support) AND USDT.D > VAH (High / Resistance)
 * 2. Gold vs DXY:
 *    - Short Confluence: Gold > VAH (High / Resistance) AND DXY < VAL (Low / Support)
 *    - Long Confluence: Gold < VAL (Low / Support) AND DXY > VAH (High / Resistance)
 */
export function evaluateIntermarketVpConfluence(
  pair: IntermarketPairType,
  customTargetPrice?: number,
  customInversePrice?: number,
  customTargetCandles?: Candle[],
  customInverseCandles?: Candle[]
): IntermarketVpConfluenceResult {
  const targetSymbol: AssetSymbol = pair === 'BTC_USDTD' ? 'BTCUSD' : 'XAUUSD';
  const inverseSymbol: AssetSymbol = pair === 'BTC_USDTD' ? 'USDTD' : 'DXY';

  const target = buildAssetDProfile(targetSymbol, customTargetPrice, customTargetCandles);
  const inverse = buildAssetDProfile(inverseSymbol, customInversePrice, customInverseCandles);

  const tPrice = target.price;
  const tVah = target.vah;
  const tVal = target.val;
  const tPoc = target.poc;

  const iPrice = inverse.price;
  const iVah = inverse.vah;
  const iVal = inverse.val;

  // Case 1: ULTRA-HIGH CONFLUENCE SHORT SETUP
  // Target Price > VAH (Resistance High) AND Inverse Price < VAL (Support Low)
  if (tPrice >= tVah * 0.999 && iPrice <= iVal * 1.002) {
    const sl = +(tVah * 1.012).toFixed(targetSymbol === 'BTCUSD' ? 2 : 2);
    const risk = Math.max(1, Math.abs(tPrice - sl));
    const reward = Math.abs(tPrice - tPoc);
    const rr = (reward / risk).toFixed(1);

    return {
      pair,
      targetAsset: target,
      inverseAsset: inverse,
      confluenceSignal: 'STRONG_SHORT',
      badgeType: 'SHORT',
      confidenceScore: 96,
      badgeText: `⚡ ULTRA HIGH-PROBABILITY SHORT CONFIRMED (${target.symbol} > VAH + ${inverse.symbol} < VAL)`,
      headline: `${target.name} at Volume Area High (Resistance) + ${inverse.name} at Volume Area Low (Support)`,
      coreRuleMatched: `${target.symbol} Price >= VAH (${target.vahFormatted}) + ${inverse.symbol} <= VAL (${inverse.valFormatted}) ➔ High-Probability Mean Reversion Short`,
      executionPlan: {
        action: 'SHORT',
        entryZone: `${formatPriceForSymbol(tPrice * 0.998, targetSymbol)} – ${formatPriceForSymbol(tPrice * 1.002, targetSymbol)} (At VAH Resistance Ceiling)`,
        entryPrice: tPrice,
        stopLoss: sl,
        stopLossFormatted: formatPriceForSymbol(sl, targetSymbol),
        profitTargetPoc: tPoc,
        profitTargetPocFormatted: target.pocFormatted,
        runnerTargetVa: tVal,
        runnerTargetVaFormatted: target.valFormatted,
        riskRewardRatio: `1 : ${rr}`,
        invalidationClause: `Hourly candle close firmly above VAH (${target.vahFormatted}) or break above stop loss ${formatPriceForSymbol(sl, targetSymbol)}.`
      },
      hinglishLogic: `${target.name} price volume profile ke Value Area High (VAH Resistance: ${target.vahFormatted}) ke upar trade kar raha hai, jabki ${inverse.name} apne Value Area Low (VAL Support: ${inverse.valFormatted}) ke niche support par khada hai. Jaise hi ${inverse.symbol} support se bounce karega (${pair === 'BTC_USDTD' ? 'log crypto bech kar USDT cash me aayenge' : 'dollar index मजबूत hoga'}), ${target.symbol} resistance ceiling se aggressively reject hoga. Yahan se SHORT trade lena maximum reward-to-risk deta hai! Primary Profit Target = POC (${target.pocFormatted}).`,
      dProfileGuide: {
        resistanceExplanation: `High -> Resistance: ${target.name} VAH (${target.vahFormatted}) ke upar overbought zone me hai jahan sellers dominant rehte hain.`,
        pocTargetExplanation: `POC -> Profit Target: POC (${target.pocFormatted}) par maximum volume execute hua hai, isliye price POC magnet par revert hoga.`,
        supportExplanation: `Low -> Support: ${inverse.name} apne VAL (${inverse.valFormatted}) support par hai jahan se bounce expected hai.`
      }
    };
  }

  // Case 2: ULTRA-HIGH CONFLUENCE LONG SETUP
  // Target Price < VAL (Support Low) AND Inverse Price > VAH (Resistance High)
  if (tPrice <= tVal * 1.001 && iPrice >= iVah * 0.998) {
    const sl = +(tVal * 0.988).toFixed(targetSymbol === 'BTCUSD' ? 2 : 2);
    const risk = Math.max(1, Math.abs(tPrice - sl));
    const reward = Math.abs(tPoc - tPrice);
    const rr = (reward / risk).toFixed(1);

    return {
      pair,
      targetAsset: target,
      inverseAsset: inverse,
      confluenceSignal: 'STRONG_LONG',
      badgeType: 'LONG',
      confidenceScore: 94,
      badgeText: `⚡ ULTRA HIGH-PROBABILITY LONG CONFIRMED (${target.symbol} < VAL + ${inverse.symbol} > VAH)`,
      headline: `${target.name} at Volume Area Low (Support) + ${inverse.name} at Volume Area High (Resistance)`,
      coreRuleMatched: `${target.symbol} Price <= VAL (${target.valFormatted}) + ${inverse.symbol} >= VAH (${inverse.vahFormatted}) ➔ High-Probability Mean Reversion Long`,
      executionPlan: {
        action: 'LONG',
        entryZone: `${formatPriceForSymbol(tPrice * 0.998, targetSymbol)} – ${formatPriceForSymbol(tPrice * 1.002, targetSymbol)} (At VAL Support Floor)`,
        entryPrice: tPrice,
        stopLoss: sl,
        stopLossFormatted: formatPriceForSymbol(sl, targetSymbol),
        profitTargetPoc: tPoc,
        profitTargetPocFormatted: target.pocFormatted,
        runnerTargetVa: tVah,
        runnerTargetVaFormatted: target.vahFormatted,
        riskRewardRatio: `1 : ${rr}`,
        invalidationClause: `Hourly candle close firmly below VAL (${target.valFormatted}) or stop loss trigger at ${formatPriceForSymbol(sl, targetSymbol)}.`
      },
      hinglishLogic: `${target.name} price volume profile ke Value Area Low (VAL Support: ${target.valFormatted}) ke niche discount zone me trade kar raha hai, jabki ${inverse.name} apne Value Area High (VAH Resistance: ${inverse.vahFormatted}) par exhaust ho chuka hai. ${inverse.symbol} resistance se slip karega (${pair === 'BTC_USDTD' ? 'cash se paisa nikal kar Bitcoin me deploy hoga' : 'dollar weak hone se gold surge karega'}) aur ${target.symbol} POC target ki taraf shoot karega. Yahan se LONG trade initiate karna best hai! Profit Target = POC (${target.pocFormatted}).`,
      dProfileGuide: {
        resistanceExplanation: `High -> Resistance: ${inverse.name} apne VAH (${inverse.vahFormatted}) resistance par hai jahan selling pressure aana tay hai.`,
        pocTargetExplanation: `POC -> Profit Target: POC (${target.pocFormatted}) high liquidity magnet par apka main profit book hoga.`,
        supportExplanation: `Low -> Support: ${target.name} apne VAL (${target.valFormatted}) support floor par hai jahan se institutional buying active hoti hai.`
      }
    };
  }

  // Case 3: PARTIAL SETUP (One asset in extreme, awaiting confirmation from inverse asset)
  if (tPrice >= tVah) {
    return {
      pair,
      targetAsset: target,
      inverseAsset: inverse,
      confluenceSignal: 'PARTIAL_SETUP',
      badgeType: 'WAIT',
      confidenceScore: 68,
      badgeText: `⏳ PARTIAL SHORT SETUP (${target.symbol} > VAH, AWAITING ${inverse.symbol} VAL TOUCH)`,
      headline: `${target.name} is at Resistance (> VAH) but ${inverse.name} is not yet at Support (< VAL)`,
      coreRuleMatched: `Waiting for ${inverse.symbol} to reach VAL support (${inverse.valFormatted}) to avoid fakeout.`,
      executionPlan: {
        action: 'WAIT',
        entryZone: `Watch ${target.vahFormatted} for rejection wicks`,
        entryPrice: tPrice,
        stopLoss: +(tVah * 1.01).toFixed(2),
        stopLossFormatted: formatPriceForSymbol(tVah * 1.01, targetSymbol),
        profitTargetPoc: tPoc,
        profitTargetPocFormatted: target.pocFormatted,
        runnerTargetVa: tVal,
        runnerTargetVaFormatted: target.valFormatted,
        riskRewardRatio: '1 : 2.2',
        invalidationClause: `Do not front-run short until ${inverse.symbol} aligns at VAL support.`
      },
      hinglishLogic: `${target.name} to Value Area High (${target.vahFormatted}) par resistance test kar raha hai, lekin ${inverse.name} abhi tak apne VAL Support (${inverse.valFormatted}) par nahi pahucha hai (Current: ${inverse.priceFormatted}). Fakeout se bachne ke liye dono ka simultaneously reach hona zaroori hai. Thoda intezar karein!`,
      dProfileGuide: {
        resistanceExplanation: `${target.name} VAH Resistance par test kar raha hai.`,
        pocTargetExplanation: `POC (${target.pocFormatted}) setup activate hone par primary target hoga.`,
        supportExplanation: `${inverse.name} VAL (${inverse.valFormatted}) support ka test pending hai.`
      }
    };
  }

  if (tPrice <= tVal) {
    return {
      pair,
      targetAsset: target,
      inverseAsset: inverse,
      confluenceSignal: 'PARTIAL_SETUP',
      badgeType: 'WAIT',
      confidenceScore: 68,
      badgeText: `⏳ PARTIAL LONG SETUP (${target.symbol} < VAL, AWAITING ${inverse.symbol} VAH TOUCH)`,
      headline: `${target.name} is at Support (< VAL) but ${inverse.name} has not reached Resistance (> VAH)`,
      coreRuleMatched: `Waiting for ${inverse.symbol} to hit VAH ceiling (${inverse.vahFormatted}) for confirmed rotation.`,
      executionPlan: {
        action: 'WAIT',
        entryZone: `Watch ${target.valFormatted} for buyer absorption`,
        entryPrice: tPrice,
        stopLoss: +(tVal * 0.99).toFixed(2),
        stopLossFormatted: formatPriceForSymbol(tVal * 0.99, targetSymbol),
        profitTargetPoc: tPoc,
        profitTargetPocFormatted: target.pocFormatted,
        runnerTargetVa: tVah,
        runnerTargetVaFormatted: target.vahFormatted,
        riskRewardRatio: '1 : 2.4',
        invalidationClause: `Confirm ${inverse.symbol} rejection before full size entry.`
      },
      hinglishLogic: `${target.name} apne Value Area Low (${target.valFormatted}) par hai, par ${inverse.name} abhi tak apne VAH Ceiling (${inverse.vahFormatted}) par exhaust nahi hua hai. Jab dono extreme sync honge tab trade confirm hogi.`,
      dProfileGuide: {
        resistanceExplanation: `${inverse.name} VAH (${inverse.vahFormatted}) reach hone ka wait karein.`,
        pocTargetExplanation: `POC (${target.pocFormatted}) target rahega.`,
        supportExplanation: `${target.name} VAL (${target.valFormatted}) par support build kar raha hai.`
      }
    };
  }

  // Case 4: NEUTRAL RANGE ROTATION
  return {
    pair,
    targetAsset: target,
    inverseAsset: inverse,
    confluenceSignal: 'NO_CONFLUENCE',
    badgeType: 'WAIT',
    confidenceScore: 50,
    badgeText: '⚖️ VALUE AREA ROTATION (70% FAIR VALUE BALANCE)',
    headline: 'Both assets rotating inside 70% Value Area — No edge for directional expansion',
    coreRuleMatched: 'Price between VAL and VAH. Patience required until boundary extremes are probed.',
    executionPlan: {
      action: 'WAIT',
      entryZone: 'No trade inside POC balance zone',
      entryPrice: tPrice,
      stopLoss: 0,
      stopLossFormatted: 'N/A',
      profitTargetPoc: tPoc,
      profitTargetPocFormatted: target.pocFormatted,
      runnerTargetVa: tVal,
      runnerTargetVaFormatted: target.valFormatted,
      riskRewardRatio: 'N/A',
      invalidationClause: 'Wait for test of VAH or VAL.'
    },
    hinglishLogic: `Donon assets apne 70% Value Area ke andar rotate kar rahe hain. POC (${target.pocFormatted}) fair value magnet bana hua hai. Jab tak ${target.symbol} VAH ke upar aur ${inverse.symbol} VAL ke niche na aaye, tab tak short trade initiate na karein. Capital preserve karein!`,
    dProfileGuide: {
      resistanceExplanation: `VAH (${target.vahFormatted}) upper boundary ceiling hai.`,
      pocTargetExplanation: `POC (${target.pocFormatted}) high volume magnet equilibrium hai.`,
      supportExplanation: `VAL (${target.valFormatted}) lower floor demand shelf hai.`
    }
  };
}
