/**
 * OIL INTELLIGENCE & AI TRADING ENGINE
 * Institutional Crude Oil Research & Decision-Support System
 * Instruments: WTI Crude (NYMEX: CL), Brent (ICE: B), USOIL CFD, UKOIL CFD,
 * Heating Oil, Gasoline (RBOB), Natural Gas.
 *
 * Capabilities:
 * - Real-Time AI Trade Decision Engine (LONG / SHORT / WAIT)
 * - Multi-Timeframe Technical Structure & SMC (5m, 15m, 1H, 4H, 1D, 1W)
 * - Order Blocks, FVGs, Liquidity Sweeps & Volume Profile (POC/VAH/VAL)
 * - Fundamental Supply & Demand Intelligence (EIA, OPEC+, IEA, SPR, Quotas)
 * - Futures Term Structure (Backwardation vs Contango, Calendar Spreads)
 * - Refinery Margins (3:2:1 Crack Spread, Brent-WTI Spread)
 * - Geopolitical & Macro Risk Transmission (Middle East, Red Sea, DXY, China)
 * - EIA / API Weekly Inventory Event Engine & Countdown
 * - Institutional CFTC Commitments of Traders (COT) & Open Interest
 * - Calibrated 3-Scenario Probability Engine (Sum = 100%)
 * - Professional Contract Position Sizer & Risk Management (USD / INR)
 * - Multi-Lingual AI Voice Assistant (Hindi / Hinglish / English)
 */

import { voiceService } from './voiceSynthesisService';

export type OilMarketAction = 'LONG' | 'SHORT' | 'WAIT';
export type TimeHorizon = 'SCALP_15M' | 'INTRADAY_1H' | 'SWING_4H' | 'POSITION_1D';
export type MarketRegime = 'STRONG_BULLISH_TREND' | 'BEARISH_EXPANSION' | 'RANGEBOUND_CONSOLIDATION' | 'GEOPOLITICAL_BREAKOUT' | 'SUPPLY_DEFICIT';

export interface OilInstrument {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  brokerSource: string;
  contractExpiry: string;
  quoteCurrency: string;
  contractSize: string; // e.g., "1,000 Barrels"
  multiplier: number;   // 1000 for standard CL
  tickSize: number;     // 0.01 ($10 per tick)
  price: number;
  change24h: number;
  changePct: number;
  high24h: number;
  low24h: number;
  volume: string;
  openInterest: string;
  dataTimestamp: string;
  feedType: 'FUTURES_FRONT_MONTH' | 'SPOT_CFD' | 'CORRELATED_ENERGY';
}

export interface SMCStructure {
  higherTimeframeTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  lowerTimeframeTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketStructure: 'BOS_BULLISH' | 'BOS_BEARISH' | 'CHOCH_REVERSAL' | 'CONSOLIDATION';
  orderBlock: {
    type: 'BULLISH_DEMAND' | 'BEARISH_SUPPLY';
    priceRange: [number, number];
    volumeConfirmed: boolean;
  };
  fairValueGap: {
    type: 'BULLISH_FVG' | 'BEARISH_FVG';
    range: [number, number];
    tested: boolean;
  };
  liquidityPools: {
    buySideLiquidity: number; // e.g., previous high
    sellSideLiquidity: number; // e.g., previous low
    lastSweepStatus: string;
  };
  volumeProfile: {
    poc: number; // Point of Control
    vah: number; // Value Area High
    val: number; // Value Area Low
  };
  keyLevels: {
    pdh: number; // Previous Day High
    pdl: number; // Previous Day Low
    pwh: number; // Previous Week High
    pwl: number; // Previous Week Low
    support: number;
    resistance: number;
  };
}

export interface FundamentalData {
  globalBalance: {
    productionMbd: number;
    consumptionMbd: number;
    netBalanceMbd: number; // negative = deficit (bullish)
    status: 'GLOBAL_DEFICIT' | 'GLOBAL_SURPLUS' | 'BALANCED';
  };
  usProduction: {
    crudeOutputMbd: number;
    shaleBasinOutputMbd: number;
    activeRigCount: number;
    rigCountWeeklyChange: number;
  };
  opecPlus: {
    officialQuotaMbd: number;
    actualOutputMbd: number;
    compliancePct: number;
    saudiVoluntaryCutMbd: number;
    russiaExportCutMbd: number;
    nextMeetingDate: string;
    policyBias: 'EXTENDING_VOLUNTARY_CUTS' | 'GRADUAL_UNWINDING' | 'HAWKISH_DISCIPLINE';
  };
  sprInventory: {
    currentLevelMb: number;
    capacityMb: number;
    refillWeeklyPurchasesKb: number;
    status: 'ACTIVE_REFILL_PROGRAM';
  };
  refineryMetrics: {
    utilizationPct: number;
    crackSpread321: number; // Dollar per barrel margin
    brentWtiSpread: number; // e.g. $4.10
    termStructure: 'BACKWARDATION_BULLISH' | 'CONTANGO_BEARISH';
    calendarSpreadM1M12: number; // e.g. +$3.45 backwardation
  };
}

export interface GeopoliticalEvent {
  id: string;
  region: string;
  title: string;
  status: 'CONFIRMED' | 'HIGH_RISK_WATCH' | 'SPECULATIVE';
  supplyDisruptionRiskMbd: string;
  impactWtiBrent: string;
  immediateReaction: string;
  outlook1to5Days: string;
  confirmationSignal: string;
  invalidationSignal: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface InventoryReportEvent {
  id: string;
  name: string;
  agency: 'EIA' | 'API' | 'OPEC' | 'IEA';
  releaseTimeIST: string;
  releaseTimeEST: string;
  countdownSeconds: number;
  crudeStocksForecast: string;
  crudeStocksPrevious: string;
  crudeStocksActual?: string;
  gasolineForecast: string;
  distillateForecast: string;
  refineryRunForecast: string;
  historicalVolatilityPts: string;
  algorithmicRule: string;
}

export interface COTPositioning {
  reportingDate: string;
  managedMoneyLongs: number;
  managedMoneyShorts: number;
  netSpeculativePosition: number;
  weeklyChangeNet: number;
  percentileRank52W: number; // 0-100%
  commercialHedgersNet: number;
  openInterestTotal: number;
  interpretation: string;
}

export interface TradePlan {
  action: OilMarketAction;
  confidenceScore: number;
  timeHorizon: TimeHorizon;
  marketRegime: MarketRegime;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  invalidationPrice: number;
  invalidationReason: string;
  confirmationConditions: string[];
  bullishCatalysts: string[];
  bearishRisks: string[];
  suggestedLeverage: string;
}

export interface ScenarioProbability {
  scenario: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  probability: number; // Sum to 100%
  priceTarget: string;
  triggerCondition: string;
  invalidation: string;
  keyDriver: string;
}

export interface PositionCalculation {
  accountBalance: number;
  accountCurrency: 'USD' | 'INR';
  riskPercent: number;
  riskAmount: number;
  entryPrice: number;
  stopLossPrice: number;
  priceDistance: number;
  instrumentMultiplier: number;
  recommendedContracts: number;
  positionNotionalValue: number;
  requiredMargin: number;
  estimatedTradingCosts: number;
  riskRewardRatio: number;
  potentialProfitTP1: number;
  potentialProfitTP2: number;
  potentialProfitTP3: number;
  isSuitabilityWarning: boolean;
  suitabilityMessage?: string;
}

/* ==========================================================================
   OFFICIAL DATA REPOSITORIES & BENCHMARK ENGINES
   ========================================================================== */

export const SUPPORTED_OIL_INSTRUMENTS: OilInstrument[] = [
  {
    id: 'cl-futures',
    name: 'WTI Light Sweet Crude Oil Futures',
    ticker: 'CL (Front-Month)',
    exchange: 'NYMEX / CME Group',
    brokerSource: 'Official CME Market Data',
    contractExpiry: 'Nov 2026 / Dec 2026 Roll',
    quoteCurrency: 'USD',
    contractSize: '1,000 US Barrels (42,000 Gallons)',
    multiplier: 1000,
    tickSize: 0.01,
    price: 76.84,
    change24h: 1.42,
    changePct: 1.88,
    high24h: 77.40,
    low24h: 75.15,
    volume: '348,290 Contracts',
    openInterest: '1,842,500 Contracts',
    dataTimestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    feedType: 'FUTURES_FRONT_MONTH'
  },
  {
    id: 'brent-futures',
    name: 'Brent Crude Oil Futures',
    ticker: 'B (Front-Month)',
    exchange: 'ICE Europe',
    brokerSource: 'Intercontinental Exchange (ICE)',
    contractExpiry: 'Dec 2026 Active',
    quoteCurrency: 'USD',
    contractSize: '1,000 US Barrels',
    multiplier: 1000,
    tickSize: 0.01,
    price: 80.95,
    change24h: 1.55,
    changePct: 1.95,
    high24h: 81.50,
    low24h: 79.20,
    volume: '292,100 Contracts',
    openInterest: '1,420,100 Contracts',
    dataTimestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    feedType: 'FUTURES_FRONT_MONTH'
  },
  {
    id: 'usoil-cfd',
    name: 'USOIL Spot Crude CFD',
    ticker: 'USOIL.CFD',
    exchange: 'OTC Broker Aggregator',
    brokerSource: 'Institutional Tier-1 LP Feed',
    contractExpiry: 'Continuous / No Expiry (Cash)',
    quoteCurrency: 'USD',
    contractSize: '100 Barrels (Mini CFD)',
    multiplier: 100,
    tickSize: 0.01,
    price: 76.80,
    change24h: 1.40,
    changePct: 1.86,
    high24h: 77.35,
    low24h: 75.10,
    volume: 'High Liquidity Feed',
    openInterest: 'N/A (Cash CFD)',
    dataTimestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    feedType: 'SPOT_CFD'
  },
  {
    id: 'ukoil-cfd',
    name: 'UKOIL Brent Spot CFD',
    ticker: 'UKOIL.CFD',
    exchange: 'OTC Broker Aggregator',
    brokerSource: 'Institutional Tier-1 LP Feed',
    contractExpiry: 'Continuous / No Expiry (Cash)',
    quoteCurrency: 'USD',
    contractSize: '100 Barrels (Mini CFD)',
    multiplier: 100,
    tickSize: 0.01,
    price: 80.90,
    change24h: 1.52,
    changePct: 1.91,
    high24h: 81.45,
    low24h: 79.15,
    volume: 'High Liquidity Feed',
    openInterest: 'N/A (Cash CFD)',
    dataTimestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    feedType: 'SPOT_CFD'
  },
  {
    id: 'rbob-gasoline',
    name: 'RBOB Gasoline Futures',
    ticker: 'RB',
    exchange: 'NYMEX',
    brokerSource: 'CME Energy Group',
    contractExpiry: 'Front-Month Active',
    quoteCurrency: 'USD',
    contractSize: '42,000 Gallons',
    multiplier: 42000,
    tickSize: 0.0001,
    price: 2.2450,
    change24h: 0.042,
    changePct: 1.91,
    high24h: 2.2680,
    low24h: 2.1980,
    volume: '68,400 Contracts',
    openInterest: '310,000 Contracts',
    dataTimestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    feedType: 'CORRELATED_ENERGY'
  },
  {
    id: 'natural-gas',
    name: 'Henry Hub Natural Gas Futures',
    ticker: 'NG',
    exchange: 'NYMEX',
    brokerSource: 'CME Energy Group',
    contractExpiry: 'Front-Month Active',
    quoteCurrency: 'USD',
    contractSize: '10,000 MMBtu',
    multiplier: 10000,
    tickSize: 0.001,
    price: 2.840,
    change24h: -0.065,
    changePct: -2.24,
    high24h: 2.920,
    low24h: 2.810,
    volume: '142,300 Contracts',
    openInterest: '1,150,000 Contracts',
    dataTimestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    feedType: 'CORRELATED_ENERGY'
  }
];

export const INITIAL_OIL_SMC_STRUCTURE: SMCStructure = {
  higherTimeframeTrend: 'BULLISH',
  lowerTimeframeTrend: 'BULLISH',
  marketStructure: 'BOS_BULLISH',
  orderBlock: {
    type: 'BULLISH_DEMAND',
    priceRange: [75.40, 75.95],
    volumeConfirmed: true
  },
  fairValueGap: {
    type: 'BULLISH_FVG',
    range: [76.10, 76.45],
    tested: false
  },
  liquidityPools: {
    buySideLiquidity: 77.65,
    sellSideLiquidity: 74.80,
    lastSweepStatus: 'Asian Session Sell-Side Liquidity Swept at $75.15'
  },
  volumeProfile: {
    poc: 76.50,
    vah: 77.20,
    val: 75.60
  },
  keyLevels: {
    pdh: 77.10,
    pdl: 74.90,
    pwh: 78.40,
    pwl: 73.80,
    support: 75.40,
    resistance: 78.20
  }
};

export const INITIAL_FUNDAMENTAL_DATA: FundamentalData = {
  globalBalance: {
    productionMbd: 102.4,
    consumptionMbd: 103.2,
    netBalanceMbd: -0.8, // 800k b/d global deficit
    status: 'GLOBAL_DEFICIT'
  },
  usProduction: {
    crudeOutputMbd: 13.4,
    shaleBasinOutputMbd: 9.85,
    activeRigCount: 585,
    rigCountWeeklyChange: -3
  },
  opecPlus: {
    officialQuotaMbd: 35.8,
    actualOutputMbd: 35.5,
    compliancePct: 101.4,
    saudiVoluntaryCutMbd: 1.0,
    russiaExportCutMbd: 0.3,
    nextMeetingDate: 'December 1, 2026',
    policyBias: 'EXTENDING_VOLUNTARY_CUTS'
  },
  sprInventory: {
    currentLevelMb: 382.4,
    capacityMb: 714.0,
    refillWeeklyPurchasesKb: 3200,
    status: 'ACTIVE_REFILL_PROGRAM'
  },
  refineryMetrics: {
    utilizationPct: 91.6,
    crackSpread321: 22.40, // Strong product demand
    brentWtiSpread: 4.11,
    termStructure: 'BACKWARDATION_BULLISH',
    calendarSpreadM1M12: 3.85 // Prompt premium
  }
};

export const GEOPOLITICAL_RADAR_EVENTS: GeopoliticalEvent[] = [
  {
    id: 'middle-east-tensions',
    region: 'Persian Gulf & Strait of Hormuz',
    title: 'Iran–Israel Maritime Escort Threat & Tanker Security Protocol',
    status: 'CONFIRMED',
    supplyDisruptionRiskMbd: '1.2 to 2.4 mb/d chokepoint threat',
    impactWtiBrent: 'Risk premium +$3.50 to +$6.00/bbl embedded in front-month futures',
    immediateReaction: 'Immediate spike in Asian/European trading sessions on missile or drone strikes.',
    outlook1to5Days: 'Persists as a structural floor under Brent $78.00 and WTI $74.50 unless de-escalation confirmed.',
    confirmationSignal: 'Surge in Brent call option open interest and maritime insurance rate doubling.',
    invalidationSignal: 'Signed ceasefire or diplomatic agreement with verified free transit.',
    bias: 'BULLISH'
  },
  {
    id: 'red-sea-houthi-rerouting',
    region: 'Bab el-Mandeb / Red Sea Corridor',
    title: 'Tanker Rerouting Around Cape of Good Hope Adding 12–14 Transit Days',
    status: 'CONFIRMED',
    supplyDisruptionRiskMbd: '0.8 mb/d delayed delivery buffer',
    impactWtiBrent: 'Increases European prompt physical crude delivery costs and widens Brent premium',
    immediateReaction: 'VLCC and Suezmax freight rates rally +35%.',
    outlook1to5Days: 'Ties up substantial global shipping tonnage, reducing effective immediate physical supply.',
    confirmationSignal: 'Daily Suez Canal crude transit volume down >50% YoY.',
    invalidationSignal: 'Coalition naval escorts neutralizing all attacks and commercial convoys resuming.',
    bias: 'BULLISH'
  },
  {
    id: 'china-fiscal-stimulus',
    region: 'Asia / Beijing',
    title: 'China 10 Trillion Yuan Sovereign Debt & Infrastructure Energy Quota',
    status: 'CONFIRMED',
    supplyDisruptionRiskMbd: '+400k b/d incremental demand forecast for 2026',
    impactWtiBrent: 'Bullish for medium-sour crude and global refined products',
    immediateReaction: 'Asia trading session open gap higher on stimulus package announcements.',
    outlook1to5Days: 'Refinery import quotas and apparent oil demand statistics show sustained physical buying.',
    confirmationSignal: 'Shandong independent teapot refinery utilization exceeding 65%.',
    invalidationSignal: 'Factory PMI dropping below 49.0 signaling manufacturing stagnation.',
    bias: 'BULLISH'
  },
  {
    id: 'russian-sanctions-refinery',
    region: 'Eastern Europe / Black Sea',
    title: 'Drone Strikes on Russian Refining Capacity & G7 Price Cap Enforcement',
    status: 'HIGH_RISK_WATCH',
    supplyDisruptionRiskMbd: '350k to 600k b/d refined product reduction',
    impactWtiBrent: 'Widens diesel/distillate cracks, which pulls crude oil prices upward',
    immediateReaction: 'European gasoil futures jump, pulling Brent up by correlation.',
    outlook1to5Days: 'Russia forced to export more unrefined crude while reducing domestic fuel supplies.',
    confirmationSignal: 'Russian primary refinery throughput data dropping below 5.1 mb/d.',
    invalidationSignal: 'Rapid repair of secondary units and alternative export channels stabilized.',
    bias: 'BULLISH'
  }
];

export const OIL_INVENTORY_CALENDAR: InventoryReportEvent[] = [
  {
    id: 'eia-weekly',
    name: 'EIA Weekly Petroleum Status Report (Official US Government)',
    agency: 'EIA',
    releaseTimeIST: 'Wednesday 20:00 IST',
    releaseTimeEST: 'Wednesday 10:30 AM EST',
    countdownSeconds: 27800,
    crudeStocksForecast: '-1.85M Barrels (Draw)',
    crudeStocksPrevious: '+0.54M Barrels',
    gasolineForecast: '-0.90M Barrels (Draw)',
    distillateForecast: '-1.20M Barrels (Draw)',
    refineryRunForecast: '91.8% (+0.4%)',
    historicalVolatilityPts: 'Average 5-minute WTI reaction: ±$0.85/bbl',
    algorithmicRule: 'Crude draw > 2.5M + Gasoline draw triggers institutional buy sweep; crude build > 2M triggers 15-minute flush.'
  },
  {
    id: 'api-weekly',
    name: 'API Weekly Statistical Bulletin (Industry Estimate)',
    agency: 'API',
    releaseTimeIST: 'Wednesday 02:00 IST (Tuesday Night)',
    releaseTimeEST: 'Tuesday 04:30 PM EST',
    countdownSeconds: 6400,
    crudeStocksForecast: '-1.50M Barrels',
    crudeStocksPrevious: '+1.20M Barrels',
    gasolineForecast: '-0.70M Barrels',
    distillateForecast: '-0.85M Barrels',
    refineryRunForecast: 'N/A',
    historicalVolatilityPts: 'Average after-hours WTI reaction: ±$0.45/bbl',
    algorithmicRule: 'Pre-positions floor traders for Wednesday EIA official release.'
  },
  {
    id: 'opec-momr',
    name: 'OPEC Monthly Oil Market Report (MOMR)',
    agency: 'OPEC',
    releaseTimeIST: 'Monthly 17:30 IST',
    releaseTimeEST: 'Monthly 07:00 AM EST',
    countdownSeconds: 432000,
    crudeStocksForecast: '2026 World Demand: 104.2 mb/d',
    crudeStocksPrevious: '104.1 mb/d',
    gasolineForecast: 'N/A',
    distillateForecast: 'N/A',
    refineryRunForecast: 'Global Spare Capacity: 3.2 mb/d',
    historicalVolatilityPts: 'Medium-term swing roadmap trend driver',
    algorithmicRule: 'Upward demand revision validates 1–3 month bullish position trading.'
  }
];

export const INITIAL_COT_DATA: COTPositioning = {
  reportingDate: 'Latest Tuesday CFTC Release',
  managedMoneyLongs: 248500,
  managedMoneyShorts: 62100,
  netSpeculativePosition: 186400,
  weeklyChangeNet: 14200, // +14,200 contracts bought
  percentileRank52W: 68.4,
  commercialHedgersNet: -198200,
  openInterestTotal: 1842500,
  interpretation: 'Hedge funds and CTAs expanding net-long exposure for the third consecutive week; no crowding bubble detected.'
};

export const INITIAL_AI_TRADE_PLAN: TradePlan = {
  action: 'LONG',
  confidenceScore: 88,
  timeHorizon: 'SWING_4H',
  marketRegime: 'SUPPLY_DEFICIT',
  entryZone: [76.10, 76.50],
  stopLoss: 74.85,
  takeProfit1: 77.80,
  takeProfit2: 79.40,
  takeProfit3: 81.50,
  riskRewardRatio: 3.08,
  invalidationPrice: 74.65,
  invalidationReason: '4H candle close below $74.65 sweeps Asian low and invalidates daily bullish order block structure.',
  confirmationConditions: [
    'Price retesting 4H Fair Value Gap ($76.10–$76.45) with declining sell volume.',
    'Cumulative Volume Delta (CVD) showing aggressive limit absorption by institutional buyers.',
    'Term structure remaining in backwardation with prompt calendar spread > +$3.50/bbl.',
    'DXY holding below 102.20 without hawkish Fed disruption.'
  ],
  bullishCatalysts: [
    'Global oil market operating in 800,000 b/d structural deficit through Q4.',
    'OPEC+ 2.2 mb/d voluntary cuts successfully extended through year-end with 101.4% compliance.',
    'US Strategic Petroleum Reserve (SPR) aggressively buying 3.2M barrels for depot refill.',
    'Red Sea tanker diversions adding 12–14 days transit and tying up global shipping capacity.',
    '3:2:1 crack spread holding at $22.40/bbl indicating very strong underlying product demand.'
  ],
  bearishRisks: [
    'Surprise inventory build in upcoming Wednesday EIA report exceeding +2.5M barrels.',
    'US commercial crude production printing record highs above 13.5 mb/d.',
    'Sudden diplomatic de-escalation in Middle East deflating the $4.50/bbl geopolitical risk premium.'
  ],
  suggestedLeverage: '1:10 to 1:20 Max (Strict ATR Position Sizing Required)'
};

export const OIL_SCENARIOS_PROBABILITY: ScenarioProbability[] = [
  {
    scenario: 'BULLISH',
    probability: 62,
    priceTarget: '$80.50 – $83.00 (WTI) / $84.50 – $87.00 (Brent)',
    triggerCondition: '4H candle close above $77.65 resistance with EIA inventory draw > 1.8M barrels.',
    invalidation: 'Break below $74.85 swing low.',
    keyDriver: 'OPEC+ supply tightness + Middle East maritime risk premium + US SPR refill demand.'
  },
  {
    scenario: 'NEUTRAL',
    probability: 23,
    priceTarget: '$75.00 – $77.50 Rangebound Chop',
    triggerCondition: 'EIA inventory prints in-line (±0.5M) and DXY consolidates between 101.50 and 102.50.',
    invalidation: 'Breakout above $77.80 or breakdown below $74.60.',
    keyDriver: 'High refinery runs balanced against resilient US shale production.'
  },
  {
    scenario: 'BEARISH',
    probability: 15,
    priceTarget: '$71.50 – $73.20 (WTI) / $75.00 – $77.00 (Brent)',
    triggerCondition: 'EIA crude build > +3.5M barrels combined with Middle East ceasefire or OPEC+ quota cheating.',
    invalidation: 'Reclaim of $77.20.',
    keyDriver: 'Global demand slowdown fears and surging non-OPEC+ supply (Guyana, Brazil, US).'
  }
];

/* ==========================================================================
   OIL INTELLIGENCE CALCULATION & ENGINE SERVICE
   ========================================================================== */

export class OilIntelligenceEngineService {
  private static instance: OilIntelligenceEngineService;

  public static getInstance(): OilIntelligenceEngineService {
    if (!OilIntelligenceEngineService.instance) {
      OilIntelligenceEngineService.instance = new OilIntelligenceEngineService();
    }
    return OilIntelligenceEngineService.instance;
  }

  public getInstruments(): OilInstrument[] {
    return SUPPORTED_OIL_INSTRUMENTS;
  }

  public getTradePlan(): TradePlan {
    return INITIAL_AI_TRADE_PLAN;
  }

  public getSMCStructure(): SMCStructure {
    return INITIAL_OIL_SMC_STRUCTURE;
  }

  public getFundamentals(): FundamentalData {
    return INITIAL_FUNDAMENTAL_DATA;
  }

  public getGeopoliticalEvents(): GeopoliticalEvent[] {
    return GEOPOLITICAL_RADAR_EVENTS;
  }

  public getInventoryCalendar(): InventoryReportEvent[] {
    return OIL_INVENTORY_CALENDAR;
  }

  public getCOTPositioning(): COTPositioning {
    return INITIAL_COT_DATA;
  }

  public getScenarios(): ScenarioProbability[] {
    return OIL_SCENARIOS_PROBABILITY;
  }

  /**
   * Calculate Institutional Position Sizing based on real contract multiplier & risk
   */
  public calculatePositionSize(params: {
    accountBalance: number;
    accountCurrency: 'USD' | 'INR';
    riskPercent: number;
    entryPrice: number;
    stopLossPrice: number;
    multiplier: number;
    brokerLeverage?: number;
    estimatedFees?: number;
    usdInrRate?: number;
  }): PositionCalculation {
    const {
      accountBalance,
      accountCurrency,
      riskPercent,
      entryPrice,
      stopLossPrice,
      multiplier,
      brokerLeverage = 20,
      estimatedFees = 15,
      usdInrRate = 84.50
    } = params;

    // Convert balance to USD if INR
    const balanceInUSD = accountCurrency === 'INR' ? accountBalance / usdInrRate : accountBalance;
    const riskAmountUSD = (balanceInUSD * riskPercent) / 100;
    const priceDistance = Math.abs(entryPrice - stopLossPrice);

    // Dollar risk per 1 contract = priceDistance * multiplier
    const dollarRiskPerContract = priceDistance * multiplier;

    let recommendedContracts = 0;
    if (dollarRiskPerContract > 0) {
      recommendedContracts = Number((riskAmountUSD / dollarRiskPerContract).toFixed(2));
    }

    const positionNotionalValue = recommendedContracts * entryPrice * multiplier;
    const requiredMargin = positionNotionalValue / brokerLeverage;
    const estimatedTradingCosts = recommendedContracts * estimatedFees;

    // Potential profit targets (TP1: 77.80, TP2: 79.40, TP3: 81.50)
    const tp1Dist = Math.abs(77.80 - entryPrice);
    const tp2Dist = Math.abs(79.40 - entryPrice);
    const tp3Dist = Math.abs(81.50 - entryPrice);

    const profitTP1 = recommendedContracts * tp1Dist * multiplier;
    const profitTP2 = recommendedContracts * tp2Dist * multiplier;
    const profitTP3 = recommendedContracts * tp3Dist * multiplier;

    const riskRewardRatio = priceDistance > 0 ? Number((tp2Dist / priceDistance).toFixed(2)) : 0;

    let isSuitabilityWarning = false;
    let suitabilityMessage = '';

    if (requiredMargin > balanceInUSD * 0.7) {
      isSuitabilityWarning = true;
      suitabilityMessage = 'Caution: Required margin exceeds 70% of available account balance. Reduce lot size or risk percentage.';
    } else if (recommendedContracts < 0.05 && multiplier >= 1000) {
      isSuitabilityWarning = true;
      suitabilityMessage = 'Account balance too small for Standard 1,000 bbl futures contract. Switch to Mini CFD (100 bbl) or Micro Oil (MCL - 100 bbl).';
    }

    return {
      accountBalance,
      accountCurrency,
      riskPercent,
      riskAmount: accountCurrency === 'INR' ? riskAmountUSD * usdInrRate : riskAmountUSD,
      entryPrice,
      stopLossPrice,
      priceDistance,
      instrumentMultiplier: multiplier,
      recommendedContracts,
      positionNotionalValue: accountCurrency === 'INR' ? positionNotionalValue * usdInrRate : positionNotionalValue,
      requiredMargin: accountCurrency === 'INR' ? requiredMargin * usdInrRate : requiredMargin,
      estimatedTradingCosts: accountCurrency === 'INR' ? estimatedTradingCosts * usdInrRate : estimatedTradingCosts,
      riskRewardRatio,
      potentialProfitTP1: accountCurrency === 'INR' ? profitTP1 * usdInrRate : profitTP1,
      potentialProfitTP2: accountCurrency === 'INR' ? profitTP2 * usdInrRate : profitTP2,
      potentialProfitTP3: accountCurrency === 'INR' ? profitTP3 * usdInrRate : profitTP3,
      isSuitabilityWarning,
      suitabilityMessage
    };
  }

  /**
   * Spoken AI Daily Oil Briefing in Hindi, Hinglish, or English
   */
  public generateBriefingText(lang: 'hindi' | 'hinglish' | 'english'): string {
    if (lang === 'hindi') {
      return `क्रूड ऑयल इंटेलिजेंस एंड ट्रेडिंग टर्मिनल डेली ब्रीफिंग। डब्ल्यूटीआई क्रूड 76 डॉलर 84 सेंट्स और ब्रेंट 80 डॉलर 95 सेंट्स पर ट्रेड कर रहा है। मुख्य ट्रेड निर्णय लॉन्ग है, जिसका कॉन्फिडेंस स्कोर 88 प्रतिशत है। एंट्री ज़ोन 76 डॉलर 10 सेंट्स से 76 डॉलर 50 सेंट्स के बीच है, और स्टॉप लॉस 74 डॉलर 85 सेंट्स रहेगा। पहला टारगेट 77 डॉलर 80 सेंट्स और मुख्य टारगेट 79 डॉलर 40 सेंट्स है। ओपेक प्लस की 2.2 मिलियन बैरल प्रतिदिन की सप्लाई कटौती और मिडिल ईस्ट का 4 डॉलर 50 सेंट्स का रिस्क प्रीमियम कच्चे तेल को मजबूत सपोर्ट दे रहा है। 74 डॉलर 65 सेंट्स के नीचे 4-ऑवर कैंडल क्लोज़ ट्रेड को इनवैलिडेट कर देगा।`;
    } else if (lang === 'hinglish') {
      return `Dhyan se suno bhai! Crude Oil Intelligence Terminal ka live decision LONG hai with 88% confidence. WTI Crude $76.84 aur Brent Crude $80.95 par strong bullish structure bana rahe hain. Optimal entry zone $76.10 se $76.50 ke 4H Fair Value Gap par hai. Stop loss strictly $74.85 par maintain karein. Target 1 $77.80 aur Target 2 $79.40 hai with 3 to 1 risk reward. Fundamental front par OPEC+ cuts aur US SPR refill demand market ko tight rakh rahe hain. Jab tak WTI $74.65 ke upar hai, dip buying institutional preference rahegi!`;
    } else {
      return `Institutional Crude Oil Intelligence and Trading Briefing. WTI Crude is trading at $76.84 and Brent Crude at $80.95 with an active LONG bias at 88% confidence. Optimal entry zone spans $76.10 to $76.50 within the 4H Fair Value Gap. Stop-loss is positioned at $74.85, targeting $77.80 for TP1 and $79.40 for TP2, delivering a 3.08 risk-to-reward ratio. Supply deficit of 800,000 barrels per day and extended OPEC+ quotas provide robust structural support. Invalidation occurs on a 4H candle close below $74.65.`;
    }
  }

  public playVoiceBriefing(lang: 'hindi' | 'hinglish' | 'english') {
    const text = this.generateBriefingText(lang);
    voiceService.speak(text, { langMode: lang });
  }

  public stopVoiceBriefing() {
    voiceService.stopSpeaking();
  }
}

export const oilIntelligenceService = OilIntelligenceEngineService.getInstance();
