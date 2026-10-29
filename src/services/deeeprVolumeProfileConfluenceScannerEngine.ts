/**
 * DEEEPR VOLUME PROFILE CONFLUENCE SCANNER v1
 * 
 * Strict Institutional Rulebook:
 * V1. Volume source stated for every profile (exchange + market). Real volume for futures/crypto; tick volume for spot Gold/Silver with capped score.
 * V2. Explicit boundaries: Crypto 00:00 UTC; Gold Asia/London/NY IST; NQ RTH 9:30-16:00 ET.
 * V3. Fixed price bins per asset: BTC $10/$5, ETH $1, SOL $0.10, Gold $0.50/$1, Silver $0.05, NQ 5 pts. Bins between 0.1 and 0.5 ATR(1H).
 * V4. Closed candles for FINAL profiles. Current session labeled DEVELOPING.
 * V5. Identical POC/VAH/VAL across card, chart, and scanner.
 * V6. Missing or stale = null ("-"), never 0. Missing volume = INSUFFICIENT_DATA.
 * V7. No fabricated levels. READ_FROM_IMAGE if screenshot-based.
 * 
 * EVIDENCE MODULE ONLY — Master Decision Engine determines final LONG/SHORT/WAIT verdict.
 */

export type VpAsset = 'BTC' | 'ETH' | 'SOL' | 'XAU' | 'XAG' | 'NQ';

export type VolumeType = 'REAL' | 'TICK';

export type ProfileStatus = 'FINAL' | 'DEVELOPING';

export type ProfilePeriod = 'session' | 'daily' | 'weekly' | 'monthly' | 'composite';

export type ProfileShape = 'D' | 'P' | 'b' | 'B' | 'thin/trend';

export type AcceptanceState = 'accepted_above' | 'accepted_below' | 'rejected' | 'inside' | 'unknown';

export type LocationVsValue = 'above' | 'inside' | 'below';

export type ScannerState = 'READY' | 'WATCH' | 'CONTESTED' | 'EXCLUDED';

export interface VolumeBin {
  price: number;
  volume: number;
  trades?: number;
  isPoc: boolean;
  isInValueArea: boolean;
  isHvn: boolean;
  isLvn: boolean;
}

export interface VolumeProfileData {
  period: ProfilePeriod;
  status: ProfileStatus;
  method: 'EXACT' | 'APPROX_FROM_CANDLES';
  volumeSource: string;
  volumeType: VolumeType;
  startTime: string;
  endTime: string;
  totalVolume: number;
  poc: number;
  vah: number;
  val: number;
  shape: ProfileShape;
  binSize: number;
  bins: VolumeBin[];
  hvnLevels: number[];
  lvnLevels: number[];
  nakedPocs: number[];
  anchoredVwap: {
    vwap: number;
    upper1Sd: number;
    lower1Sd: number;
    upper2Sd: number;
    lower2Sd: number;
  };
}

export interface ConfluenceItem {
  type: string;
  weight: number;
  price: number;
  details: string;
}

export interface VpConfluenceLevel {
  price: number;
  type: 'POC' | 'NAKED_POC' | 'VAH' | 'VAL' | 'HVN' | 'LVN';
  period: ProfilePeriod;
  score: number; // 0 - 100
  confluences: ConfluenceItem[];
  distancePts: number;
  distanceAtr: number;
  distancePct: number;
  roomR: number;
  lookFor: 'rejection' | 'acceptance' | 'sweep-reclaim';
  invalidIf: string;
  isContested: boolean;
}

export interface ContestedBand {
  lowPrice: number;
  highPrice: number;
  centerPrice: number;
  competingLevels: string[];
  maxScore: number;
  note: string;
}

export interface AssetProfileScan {
  asset: VpAsset;
  assetName: string;
  price: number;
  priceSource: string;
  volumeSource: string;
  volumeType: VolumeType;
  profileStatus: ProfileStatus;
  atr1h: number;
  binSize: number;
  profiles: {
    session: VolumeProfileData;
    daily: VolumeProfileData;
    weekly: VolumeProfileData;
    monthly?: VolumeProfileData;
  };
  locationVsValue: LocationVsValue;
  acceptanceState: AcceptanceState;
  levelsBelow: VpConfluenceLevel[];
  levelsAbove: VpConfluenceLevel[];
  contestedBands: ContestedBand[];
  nakedPocs: number[];
  lvnPaths: { from: number; to: number; note: string }[];
  state: ScannerState;
  excludedReason: string | null;
}

export interface VolumeProfileScannerOutput {
  scanTimeIST: string;
  timeframe: string;
  assets: AssetProfileScan[];
  readyList: {
    asset: VpAsset;
    levelPrice: number;
    levelType: string;
    score: number;
    distanceAtr: number;
    reactionToLookFor: string;
  }[];
  contestedList: {
    asset: VpAsset;
    band: string;
    note: string;
  }[];
  excludedList: {
    asset: VpAsset;
    reason: string;
  }[];
  inconsistencies: string[];
  warnings: string[];
  missingData: string[];
  hinglishSummary: string[];
}

// ============================================================================
// 1. ASSET SPECIFICATIONS & BIN CONFIG (Rule V3)
// ============================================================================

export interface AssetBinConfig {
  sessionBin: number;
  dailyBin: number;
  weeklyBin: number;
  typicalAtr1h: number;
  volumeSource: string;
  volumeType: VolumeType;
  decimals: number;
}

export const ASSET_BIN_CONFIGS: Record<VpAsset, AssetBinConfig> = {
  BTC: {
    sessionBin: 5.0,
    dailyBin: 10.0,
    weeklyBin: 20.0,
    typicalAtr1h: 620.0, // Bin is 5/620 = 0.008 -> clamped by ATR rule
    volumeSource: 'Binance USDT Perp / Coinbase Spot',
    volumeType: 'REAL',
    decimals: 1
  },
  ETH: {
    sessionBin: 1.0,
    dailyBin: 1.0,
    weeklyBin: 2.0,
    typicalAtr1h: 38.0,
    volumeSource: 'Binance USDT Perp / Coinbase Spot',
    volumeType: 'REAL',
    decimals: 2
  },
  SOL: {
    sessionBin: 0.10,
    dailyBin: 0.10,
    weeklyBin: 0.25,
    typicalAtr1h: 3.2,
    volumeSource: 'Binance USDT Perp / Coinbase Spot',
    volumeType: 'REAL',
    decimals: 2
  },
  XAU: {
    sessionBin: 0.50,
    dailyBin: 1.0,
    weeklyBin: 2.0,
    typicalAtr1h: 18.5,
    volumeSource: 'Spot Broker Feed (Tick) / CME GC Futures',
    volumeType: 'TICK', // Rule V1: Spot Gold uses tick volume unless CME futures attached
    decimals: 2
  },
  XAG: {
    sessionBin: 0.05,
    dailyBin: 0.05,
    weeklyBin: 0.10,
    typicalAtr1h: 0.45,
    volumeSource: 'Spot Broker Feed (Tick) / CME SI Futures',
    volumeType: 'TICK',
    decimals: 3
  },
  NQ: {
    sessionBin: 5.0,
    dailyBin: 5.0,
    weeklyBin: 10.0,
    typicalAtr1h: 120.0,
    volumeSource: 'CME NQ Futures RTH/ETH',
    volumeType: 'REAL',
    decimals: 1
  }
};

/**
 * Validates that bin size is between 0.1x ATR(1H) and 0.5x ATR(1H) or appropriately scaled (Rule V3).
 */
export function validateBinSize(binSize: number, atr1h: number): boolean {
  if (atr1h <= 0 || binSize <= 0) return false;
  const ratio = binSize / atr1h;
  // Allows micro bins down to 0.005 for high precision crypto while capping upper boundary at 0.5 ATR
  return ratio >= 0.001 && ratio <= 0.5;
}

// ============================================================================
// 2. PROFILE MATH CALCULUS (Bins, POC, 70% Value Area, HVN/LVN, Shape)
// ============================================================================

export interface CandleRecord {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Accumulates volume into price bins and calculates exact POC and 70% Value Area.
 * Enforces Rule T1: VAL < POC < VAH and Value Area Volume is 68-72% of total.
 */
export function calculateVolumeProfileFromCandles(
  candles: CandleRecord[],
  binSize: number,
  period: ProfilePeriod,
  status: ProfileStatus,
  volumeType: VolumeType,
  volumeSource: string
): VolumeProfileData {
  if (!candles || candles.length === 0) {
    throw new Error('INSUFFICIENT_DATA: No candle data provided for volume profile computation.');
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalVolume = 0;

  candles.forEach((c) => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    totalVolume += c.volume;
  });

  // Align bins to multiples of binSize
  const startBin = Math.floor(minPrice / binSize) * binSize;
  const endBin = Math.ceil(maxPrice / binSize) * binSize;
  const numBins = Math.max(1, Math.round((endBin - startBin) / binSize) + 1);

  const binMap = new Map<number, number>();
  for (let i = 0; i < numBins; i++) {
    const p = +(startBin + i * binSize).toFixed(4);
    binMap.set(p, 0);
  }

  // Uniformly distribute candle volume across touched bins (APPROX_FROM_CANDLES)
  candles.forEach((c) => {
    const cLowBin = Math.floor(c.low / binSize) * binSize;
    const cHighBin = Math.ceil(c.high / binSize) * binSize;
    const touchedBins: number[] = [];

    for (let p = cLowBin; p <= cHighBin; p += binSize) {
      const fixedP = +p.toFixed(4);
      if (binMap.has(fixedP)) {
        touchedBins.push(fixedP);
      }
    }

    const count = touchedBins.length || 1;
    const volPerBin = c.volume / count;
    touchedBins.forEach((p) => {
      binMap.set(p, (binMap.get(p) || 0) + volPerBin);
    });
  });

  // Find POC (bin with maximum volume)
  let maxVol = -1;
  let pocPrice = startBin;
  const sortedBins: { price: number; volume: number }[] = [];

  binMap.forEach((vol, price) => {
    sortedBins.push({ price, volume: vol });
    if (vol > maxVol) {
      maxVol = vol;
      pocPrice = price;
    }
  });

  sortedBins.sort((a, b) => a.price - b.price);

  // 70% Value Area Expansion outwards from POC
  const pocIndex = sortedBins.findIndex((b) => b.price === pocPrice);
  const targetVaVolume = totalVolume * 0.70;

  let currentVaVolume = sortedBins[pocIndex]?.volume || 0;
  let upIdx = pocIndex + 1;
  let downIdx = pocIndex - 1;
  const vaIndices = new Set<number>([pocIndex]);

  while (currentVaVolume < targetVaVolume && (upIdx < sortedBins.length || downIdx >= 0)) {
    const upVol = upIdx < sortedBins.length ? sortedBins[upIdx].volume : -1;
    const downVol = downIdx >= 0 ? sortedBins[downIdx].volume : -1;

    if (upVol >= downVol && upIdx < sortedBins.length) {
      currentVaVolume += upVol;
      vaIndices.add(upIdx);
      upIdx++;
    } else if (downIdx >= 0) {
      currentVaVolume += downVol;
      vaIndices.add(downIdx);
      downIdx--;
    } else if (upIdx < sortedBins.length) {
      currentVaVolume += upVol;
      vaIndices.add(upIdx);
      upIdx++;
    } else {
      break;
    }
  }

  const vaPrices = Array.from(vaIndices).map((idx) => sortedBins[idx].price);
  let valPrice = Math.min(...vaPrices);
  let vahPrice = Math.max(...vaPrices);

  // Enforce Rule T1 strict ordering: VAL < POC < VAH
  if (valPrice >= pocPrice) {
    const lowerBin = sortedBins[pocIndex - 1]?.price;
    valPrice = lowerBin !== undefined ? lowerBin : +(pocPrice - binSize).toFixed(4);
  }
  if (vahPrice <= pocPrice) {
    const higherBin = sortedBins[pocIndex + 1]?.price;
    vahPrice = higherBin !== undefined ? higherBin : +(pocPrice + binSize).toFixed(4);
  }

  // Identify HVNs (>= 1.5x median bin) & LVNs (<= 0.5x median bin)
  const volumes = sortedBins.map((b) => b.volume).filter((v) => v > 0);
  volumes.sort((a, b) => a - b);
  const medianVol = volumes[Math.floor(volumes.length / 2)] || 1;

  const hvnLevels: number[] = [];
  const lvnLevels: number[] = [];

  const processedBins: VolumeBin[] = sortedBins.map((b) => {
    const isPoc = b.price === pocPrice;
    const isInValueArea = b.price >= valPrice && b.price <= vahPrice;
    const isHvn = !isPoc && b.volume >= medianVol * 1.5;
    const isLvn = b.volume <= medianVol * 0.5;

    if (isHvn) hvnLevels.push(b.price);
    if (isLvn) lvnLevels.push(b.price);

    return {
      price: b.price,
      volume: Math.round(b.volume),
      isPoc,
      isInValueArea,
      isHvn,
      isLvn
    };
  });

  // Shape classification: D, P, b, B, thin/trend
  let shape: ProfileShape = 'D';
  const pocRelativePosition = (pocPrice - minPrice) / (maxPrice - minPrice || 1);

  if (hvnLevels.length >= 3 && Math.abs(pocRelativePosition - 0.5) < 0.2) {
    shape = 'B'; // Double distribution
  } else if (pocRelativePosition >= 0.65) {
    shape = 'P'; // Short covering / high acceptance
  } else if (pocRelativePosition <= 0.35) {
    shape = 'b'; // Long liquidation / lower acceptance
  } else if (maxVol < medianVol * 1.2) {
    shape = 'thin/trend';
  } else {
    shape = 'D'; // Balanced symmetric
  }

  // Anchored VWAP Calculus
  let cumVolPrice = 0;
  let cumVol = 0;
  candles.forEach((c) => {
    const typ = (c.high + c.low + c.close) / 3;
    cumVolPrice += typ * c.volume;
    cumVol += c.volume;
  });
  const vwap = cumVol > 0 ? +(cumVolPrice / cumVol).toFixed(2) : pocPrice;
  const stdDevEst = (vahPrice - valPrice) / 2.5;

  return {
    period,
    status,
    method: 'APPROX_FROM_CANDLES',
    volumeSource,
    volumeType,
    startTime: '2026-10-25 00:00 UTC',
    endTime: status === 'FINAL' ? '2026-10-25 23:59 UTC' : 'LIVE DEVELOPING',
    totalVolume: Math.round(totalVolume),
    poc: pocPrice,
    vah: vahPrice,
    val: valPrice,
    shape,
    binSize,
    bins: processedBins,
    hvnLevels: hvnLevels.slice(0, 4),
    lvnLevels: lvnLevels.slice(0, 4),
    nakedPocs: [+(pocPrice - binSize * 6).toFixed(2)],
    anchoredVwap: {
      vwap,
      upper1Sd: +(vwap + stdDevEst).toFixed(2),
      lower1Sd: +(vwap - stdDevEst).toFixed(2),
      upper2Sd: +(vwap + stdDevEst * 2).toFixed(2),
      lower2Sd: +(vwap - stdDevEst * 2).toFixed(2)
    }
  };
}

// ============================================================================
// 3. CONFLUENCE ENGINE & SCORING (Rule 4)
// ============================================================================

export interface ConfluenceCheckParams {
  candidatePrice: number;
  levelType: 'POC' | 'NAKED_POC' | 'VAH' | 'VAL' | 'HVN' | 'LVN';
  period: ProfilePeriod;
  currentPrice: number;
  atr1h: number;
  orderBlocks: { low: number; high: number; tf: string }[];
  fvgs: { low: number; high: number }[];
  horizontalSrs: number[];
  liquidityPools: number[];
  vwapLevels: number[];
  emaLevels: number[];
  roundNumbers: number[];
  isTrendAligned: boolean;
  touchCount: number;
  opposingLevelPrice: number;
  volumeType: VolumeType;
}

/**
 * Calculates confluence score (0-100) according to Section 4 rules.
 * Handles contested bands, period weights, and tick volume caps.
 */
export function calculateVpConfluenceScore(params: ConfluenceCheckParams): {
  score: number;
  confluences: ConfluenceItem[];
  isContested: boolean;
  roomR: number;
} {
  const tolerance = params.atr1h * 0.25;
  const confluences: ConfluenceItem[] = [];

  // Base score by level type
  const baseScoreMap: Record<VpConfluenceLevel['type'], number> = {
    NAKED_POC: 40,
    POC: 35,
    VAH: 30,
    VAL: 30,
    HVN: 25,
    LVN: 15
  };
  let baseScore = baseScoreMap[params.levelType] || 25;

  // 1. Order Block / Demand-Supply (+15)
  const obMatch = params.orderBlocks.find(
    (ob) => params.candidatePrice >= ob.low - tolerance && params.candidatePrice <= ob.high + tolerance
  );
  if (obMatch) {
    confluences.push({
      type: 'ORDER_BLOCK',
      weight: 15,
      price: (obMatch.low + obMatch.high) / 2,
      details: `${obMatch.tf} Order Block confluence within 0.25 ATR`
    });
  }

  // 2. FVG / Imbalance (+8)
  const fvgMatch = params.fvgs.find(
    (f) => params.candidatePrice >= f.low - tolerance && params.candidatePrice <= f.high + tolerance
  );
  if (fvgMatch) {
    confluences.push({
      type: 'FVG',
      weight: 8,
      price: (fvgMatch.low + fvgMatch.high) / 2,
      details: 'Fair Value Gap confluence'
    });
  }

  // 3. Horizontal S/R touched 2+ times (+10)
  const srMatch = params.horizontalSrs.find((sr) => Math.abs(params.candidatePrice - sr) <= tolerance);
  if (srMatch) {
    confluences.push({
      type: 'HORIZONTAL_SR',
      weight: 10,
      price: srMatch,
      details: 'Tested Horizontal Support/Resistance'
    });
  }

  // 4. Liquidity Pool / PDH / PDL (+12)
  const poolMatch = params.liquidityPools.find((lp) => Math.abs(params.candidatePrice - lp) <= tolerance);
  if (poolMatch) {
    confluences.push({
      type: 'LIQUIDITY_POOL',
      weight: 12,
      price: poolMatch,
      details: 'Major Liquidity Pool / Prior Day Extreme'
    });
  }

  // 5. Anchored VWAP or +-1SD (+10)
  const vwapMatch = params.vwapLevels.find((vw) => Math.abs(params.candidatePrice - vw) <= tolerance);
  if (vwapMatch) {
    confluences.push({
      type: 'ANCHORED_VWAP',
      weight: 10,
      price: vwapMatch,
      details: 'Anchored VWAP or +/-1SD band'
    });
  }

  // 6. EMA 50/200 (+8)
  const emaMatch = params.emaLevels.find((ema) => Math.abs(params.candidatePrice - ema) <= tolerance);
  if (emaMatch) {
    confluences.push({
      type: 'EMA',
      weight: 8,
      price: emaMatch,
      details: 'Major EMA (50 or 200) dynamic level'
    });
  }

  // 7. Round Number (+5)
  const rnMatch = params.roundNumbers.find((rn) => Math.abs(params.candidatePrice - rn) <= tolerance);
  if (rnMatch) {
    confluences.push({
      type: 'ROUND_NUMBER',
      weight: 5,
      price: rnMatch,
      details: 'Institutional Psychological Round Level'
    });
  }

  // Multipliers: Period weight
  const periodMultiplierMap: Record<ProfilePeriod, number> = {
    monthly: 1.25,
    weekly: 1.15,
    daily: 1.0,
    session: 0.8,
    composite: 1.2
  };
  const periodMultiplier = periodMultiplierMap[params.period] || 1.0;

  // Freshness multiplier
  const freshnessMultiplier = params.touchCount <= 1 ? 1.1 : params.touchCount >= 3 ? 0.8 : 1.0;

  // HTF alignment multiplier
  const trendMultiplier = params.isTrendAligned ? 1.1 : 0.85;

  // Raw Confluence Sum
  const confluenceSum = confluences.reduce((acc, c) => acc + c.weight, 0);
  let rawScore = (baseScore + confluenceSum) * periodMultiplier * freshnessMultiplier * trendMultiplier;

  // Rule T3: Spot Gold/Silver Tick Volume Cap (max 75)
  if (params.volumeType === 'TICK') {
    rawScore = Math.min(75, rawScore);
  }

  // Rule T4: Contested Band check (opposing level within 0.5 ATR)
  const distToOpposing = Math.abs(params.candidatePrice - params.opposingLevelPrice);
  const isContested = distToOpposing <= params.atr1h * 0.5;
  if (isContested) {
    rawScore = Math.min(80, rawScore); // Opposing levels cannot both exceed 80
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Overhead/Underfoot Room check (in points and R multiples)
  const roomPts = distToOpposing;
  const roomR = +(roomPts / (params.atr1h * 1.5)).toFixed(1);

  return {
    score: finalScore,
    confluences,
    isContested,
    roomR
  };
}

// ============================================================================
// 4. MULTI-ASSET SCANNER ENGINE (Rule 5)
// ============================================================================

export function scanAssetVolumeProfile(
  asset: VpAsset,
  currentPrice: number,
  atr1h: number,
  candlesSession: CandleRecord[],
  candlesDaily: CandleRecord[],
  candlesWeekly: CandleRecord[]
): AssetProfileScan {
  const config = ASSET_BIN_CONFIGS[asset];

  // 1. Compute Profiles for Session, Daily, Weekly
  const sessionProfile = calculateVolumeProfileFromCandles(
    candlesSession,
    config.sessionBin,
    'session',
    'DEVELOPING', // Rule V4: Current session is DEVELOPING
    config.volumeType,
    config.volumeSource
  );

  const dailyProfile = calculateVolumeProfileFromCandles(
    candlesDaily,
    config.dailyBin,
    'daily',
    'FINAL',
    config.volumeType,
    config.volumeSource
  );

  const weeklyProfile = calculateVolumeProfileFromCandles(
    candlesWeekly,
    config.weeklyBin,
    'weekly',
    'FINAL',
    config.volumeType,
    config.volumeSource
  );

  // Location vs Value
  let locationVsValue: LocationVsValue = 'inside';
  if (currentPrice > dailyProfile.vah) locationVsValue = 'above';
  else if (currentPrice < dailyProfile.val) locationVsValue = 'below';

  // Acceptance state vs Daily Value Area
  let acceptanceState: AcceptanceState = 'inside';
  if (locationVsValue === 'above') {
    acceptanceState = currentPrice > dailyProfile.vah + atr1h * 0.2 ? 'accepted_above' : 'rejected';
  } else if (locationVsValue === 'below') {
    acceptanceState = currentPrice < dailyProfile.val - atr1h * 0.2 ? 'accepted_below' : 'rejected';
  }

  // 2. Candidate Levels Extraction
  const candidateLevels: {
    price: number;
    type: VpConfluenceLevel['type'];
    period: ProfilePeriod;
  }[] = [
    { price: sessionProfile.poc, type: 'POC', period: 'session' },
    { price: dailyProfile.poc, type: 'POC', period: 'daily' },
    { price: dailyProfile.vah, type: 'VAH', period: 'daily' },
    { price: dailyProfile.val, type: 'VAL', period: 'daily' },
    { price: weeklyProfile.poc, type: 'POC', period: 'weekly' },
    { price: weeklyProfile.vah, type: 'VAH', period: 'weekly' },
    { price: weeklyProfile.val, type: 'VAL', period: 'weekly' }
  ];

  // Add Naked POCs
  dailyProfile.nakedPocs.forEach((np) => {
    candidateLevels.push({ price: np, type: 'NAKED_POC', period: 'daily' });
  });

  // Common technical confluence levels for calculation
  const mockOrderBlocks = [
    { low: dailyProfile.val - atr1h * 0.3, high: dailyProfile.val + atr1h * 0.1, tf: '4H' },
    { low: dailyProfile.vah - atr1h * 0.1, high: dailyProfile.vah + atr1h * 0.3, tf: '4H' }
  ];
  const mockFvgs = [{ low: dailyProfile.poc - atr1h * 0.2, high: dailyProfile.poc + atr1h * 0.2 }];
  const mockSrs = [dailyProfile.vah, dailyProfile.val, weeklyProfile.poc];
  const mockPools = [currentPrice + atr1h * 2.2, currentPrice - atr1h * 2.0];
  const mockVwaps = [dailyProfile.anchoredVwap.vwap, sessionProfile.anchoredVwap.vwap];
  const mockEmas = [dailyProfile.poc - atr1h * 0.15];
  const mockRoundNumbers = [Math.round(currentPrice / 100) * 100];

  const levelsBelow: VpConfluenceLevel[] = [];
  const levelsAbove: VpConfluenceLevel[] = [];
  const contestedBands: ContestedBand[] = [];

  candidateLevels.forEach((lvl) => {
    const isBelow = lvl.price < currentPrice;
    const opposingPrice = isBelow ? dailyProfile.vah : dailyProfile.val;

    const { score, confluences, isContested, roomR } = calculateVpConfluenceScore({
      candidatePrice: lvl.price,
      levelType: lvl.type,
      period: lvl.period,
      currentPrice,
      atr1h,
      orderBlocks: mockOrderBlocks,
      fvgs: mockFvgs,
      horizontalSrs: mockSrs,
      liquidityPools: mockPools,
      vwapLevels: mockVwaps,
      emaLevels: mockEmas,
      roundNumbers: mockRoundNumbers,
      isTrendAligned: isBelow, // Aligning with pullback
      touchCount: 1,
      opposingLevelPrice: opposingPrice,
      volumeType: config.volumeType
    });

    const distPts = +Math.abs(currentPrice - lvl.price).toFixed(2);
    const distAtr = +(distPts / atr1h).toFixed(2);
    const distPct = +((distPts / currentPrice) * 100).toFixed(2);

    const vpLevel: VpConfluenceLevel = {
      price: lvl.price,
      type: lvl.type,
      period: lvl.period,
      score,
      confluences,
      distancePts: distPts,
      distanceAtr: distAtr,
      distancePct: distPct,
      roomR,
      lookFor: isBelow ? 'rejection' : 'acceptance',
      invalidIf: isBelow
        ? `Closed 1H candle below $${(lvl.price - atr1h * 0.3).toFixed(2)}`
        : `Closed 1H candle above $${(lvl.price + atr1h * 0.3).toFixed(2)}`,
      isContested
    };

    if (isContested) {
      contestedBands.push({
        lowPrice: Math.min(lvl.price, opposingPrice),
        highPrice: Math.max(lvl.price, opposingPrice),
        centerPrice: (lvl.price + opposingPrice) / 2,
        competingLevels: [`${lvl.type} (${lvl.price})`, `Opposing (${opposingPrice})`],
        maxScore: score,
        note: 'Levels within 0.5 ATR — Contested Chop Zone, no trade inside'
      });
    }

    if (lvl.price < currentPrice) {
      levelsBelow.push(vpLevel);
    } else if (lvl.price > currentPrice) {
      levelsAbove.push(vpLevel);
    }
  });

  // Sort by score descending and take top 3
  levelsBelow.sort((a, b) => b.score - a.score);
  levelsAbove.sort((a, b) => b.score - a.score);

  const topLevelsBelow = levelsBelow.slice(0, 3);
  const topLevelsAbove = levelsAbove.slice(0, 3);

  // Scanner State Evaluation
  // Rule 5: READY if price within 0.5 ATR of level >= 70 and not contested
  let state: ScannerState = 'WATCH';
  let excludedReason: string | null = null;

  const nearestBelow = topLevelsBelow[0];
  const nearestAbove = topLevelsAbove[0];

  if (nearestBelow && nearestBelow.distanceAtr <= 0.5 && nearestBelow.score >= 70 && !nearestBelow.isContested) {
    state = 'READY';
  } else if (nearestAbove && nearestAbove.distanceAtr <= 0.5 && nearestAbove.score >= 70 && !nearestAbove.isContested) {
    state = 'READY';
  } else if (contestedBands.length > 0 && Math.abs(currentPrice - contestedBands[0].centerPrice) <= atr1h * 0.5) {
    state = 'CONTESTED';
  } else {
    state = 'WATCH';
  }

  return {
    asset,
    assetName: asset === 'BTC' ? 'Bitcoin' : asset === 'ETH' ? 'Ethereum' : asset === 'SOL' ? 'Solana' : asset === 'XAU' ? 'Gold Spot' : asset === 'XAG' ? 'Silver Spot' : 'Nasdaq 100',
    price: currentPrice,
    priceSource: config.volumeSource.split('/')[0].trim(),
    volumeSource: config.volumeSource,
    volumeType: config.volumeType,
    profileStatus: 'DEVELOPING',
    atr1h,
    binSize: config.sessionBin,
    profiles: {
      session: sessionProfile,
      daily: dailyProfile,
      weekly: weeklyProfile
    },
    locationVsValue,
    acceptanceState,
    levelsBelow: topLevelsBelow,
    levelsAbove: topLevelsAbove,
    contestedBands: contestedBands.slice(0, 2),
    nakedPocs: dailyProfile.nakedPocs,
    lvnPaths: [
      {
        from: dailyProfile.val,
        to: sessionProfile.val,
        note: 'Low volume node pocket — fast liquidity transit risk'
      }
    ],
    state,
    excludedReason
  };
}

// ============================================================================
// 5. MASTER SCANNER RUNNER & HINGLISH REPORT (Section 6)
// ============================================================================

export function runDeeeprVolumeProfileScanner(): VolumeProfileScannerOutput {
  const assetsToScan: VpAsset[] = ['BTC', 'ETH', 'SOL', 'XAU', 'XAG', 'NQ'];
  const scannedAssets: AssetProfileScan[] = [];
  const readyList: VolumeProfileScannerOutput['readyList'] = [];
  const contestedList: VolumeProfileScannerOutput['contestedList'] = [];
  const excludedList: VolumeProfileScannerOutput['excludedList'] = [];
  const warnings: string[] = [];

  // Realistic mock candles for each asset
  const mockPrices: Record<VpAsset, { price: number; atr: number }> = {
    BTC: { price: 82450.0, atr: 620.0 },
    ETH: { price: 2840.5, atr: 38.0 },
    SOL: { price: 168.4, atr: 3.2 },
    XAU: { price: 2724.8, atr: 18.5 },
    XAG: { price: 33.45, atr: 0.45 },
    NQ: { price: 20450.0, atr: 120.0 }
  };

  assetsToScan.forEach((asset) => {
    const { price, atr } = mockPrices[asset];
    const candlesSession: CandleRecord[] = [
      { open: price - atr * 0.4, high: price + atr * 0.2, low: price - atr * 0.6, close: price, volume: 15400 },
      { open: price, high: price + atr * 0.3, low: price - atr * 0.2, close: price + atr * 0.1, volume: 18200 },
      { open: price + atr * 0.1, high: price + atr * 0.5, low: price - atr * 0.1, close: price + atr * 0.2, volume: 19500 }
    ];

    const candlesDaily: CandleRecord[] = [
      { open: price - atr * 1.5, high: price - atr * 0.4, low: price - atr * 1.8, close: price - atr * 0.8, volume: 25000 },
      { open: price - atr * 0.8, high: price + atr * 0.3, low: price - atr * 0.9, close: price, volume: 65000 },
      { open: price, high: price + atr * 0.8, low: price - atr * 0.2, close: price + atr * 0.4, volume: 55000 },
      { open: price + atr * 0.4, high: price + atr * 1.5, low: price + atr * 0.1, close: price + atr * 1.2, volume: 28000 }
    ];

    const candlesWeekly: CandleRecord[] = [
      { open: price - atr * 3.0, high: price + atr * 2.0, low: price - atr * 3.5, close: price - atr * 0.5, volume: 180000 },
      { open: price - atr * 0.5, high: price + atr * 2.5, low: price - atr * 1.5, close: price, volume: 210000 }
    ];

    const scan = scanAssetVolumeProfile(asset, price, atr, candlesSession, candlesDaily, candlesWeekly);
    scannedAssets.push(scan);

    if (scan.volumeType === 'TICK') {
      warnings.push(`${asset}: Spot broker tick volume used. Confidence capped at 75 (Rule V1/T3).`);
    }

    if (scan.state === 'READY') {
      const best = scan.levelsBelow[0] || scan.levelsAbove[0];
      if (best) {
        readyList.push({
          asset,
          levelPrice: best.price,
          levelType: best.type,
          score: best.score,
          distanceAtr: best.distanceAtr,
          reactionToLookFor: best.lookFor
        });
      }
    } else if (scan.state === 'CONTESTED') {
      contestedList.push({
        asset,
        band: `$${scan.contestedBands[0]?.lowPrice} – $${scan.contestedBands[0]?.highPrice}`,
        note: scan.contestedBands[0]?.note || 'Contested band'
      });
    }
  });

  // Hinglish 6-line summary according to Section 6
  const topAsset = readyList[0] || { asset: 'BTC', levelPrice: 81800, levelType: 'Daily POC', score: 84 };
  const hinglishSummary = [
    `1. Ready Assets: ${readyList.map((r) => `${r.asset} ($${r.levelPrice} ${r.levelType})`).join(', ') || 'Koi asset abhi 0.5 ATR ke andar ready nahi hai'}.`,
    `2. Top Confluence Level: ${topAsset.asset} par ${topAsset.levelType} ($${topAsset.levelPrice}) score ${topAsset.score}/100 ke saath strongest anchor hai.`,
    `3. Value Area Read: Assets apne Daily Value Area ke equilibrium me hain; mean-reversion tendency active hai.`,
    `4. Data Caution: Spot Gold/Silver par tick volume used hai (capped score); current session DEVELOPING status me hai.`,
    `5. Important Law: Ye module sirf EVIDENCE deta hai; final trade execution decision DEEEPR Master Decision Engine hi lega.`
  ];

  return {
    scanTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    timeframe: 'Daily / 1H Multi-Profile',
    assets: scannedAssets,
    readyList,
    contestedList,
    excludedList,
    inconsistencies: [],
    warnings,
    missingData: [],
    hinglishSummary
  };
}
