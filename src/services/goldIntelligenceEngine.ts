/**
 * GOLD AI MARKET INTELLIGENCE ENGINE
 * Comprehensive Data, Telemetry & Analytical Models
 * Covers all 30 Sections of the Gold AI Market Intelligence Master Specification
 * & 4 Macro / Market Structure / Cycle Infographics
 */

export interface GoldMarketPriceData {
  spotXauUsd: number;
  spotChange: number;
  spotChangePct: number;
  dailyHigh: number;
  dailyLow: number;
  weeklyHigh: number;
  weeklyLow: number;
  monthlyHigh: number;
  monthlyLow: number;
  yearlyHigh: number;
  yearlyLow: number;
  comexFuturesFront: number;
  comexVolumeContracts: number;
  comexOpenInterest: number;
  futuresBasis: number; // Spot vs Futures contango/backwardation
  termStructure: 'CONTANGO' | 'BACKWARDATION';
  mcxGoldInrPer10g: number;
  mcxGoldChangePct: number;
  mcxGoldMiniInr: number;
  usdInrRate: number;
  bidAskSpread: number;
  atr14D: number;
  realizedVol30D: number;
  goldSilverRatio: number;
  goldDxyCorrelation: number;
  goldRealYieldCorrelation: number;
}

export interface UsDollarData {
  dxyLive: number;
  dxyChange1D: number;
  dxyChange1W: number;
  dxyChange1M: number;
  dxyChange3M: number;
  dxyChange1Y: number;
  ma20D: number;
  ma50D: number;
  ma100D: number;
  ma200D: number;
  trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  momentumRsi: number;
  eurUsd: number;
  usdJpy: number;
  gbpUsd: number;
  correlationStatus: 'NORMAL_INVERSE' | 'CORRELATION_BREAKDOWN_BOTH_RISING' | 'CORRELATION_BREAKDOWN_BOTH_FALLING';
  aiRelationshipNote: string;
}

export interface TreasuryYieldData {
  us2Y: number;
  us5Y: number;
  us10Y: number;
  us30Y: number;
  tipsRealYield10Y: number;
  spread2Y10Y: number; // bps
  spread10Y30Y: number; // bps
  curveRegime: 'STEEPENING' | 'FLATTENING' | 'INVERTED';
  realYieldChange1D: number;
  realYieldChange1W: number;
  realYieldChange1M: number;
  aiYieldInterpretation: string;
  supportiveOrRestrictive: 'SUPPORTIVE' | 'RESTRICTIVE' | 'NEUTRAL';
}

export interface FedMonetaryPolicyData {
  targetRange: string;
  nextFomcDate: string;
  nextFomcCountdownDays: number;
  probHike: number;
  probHold: number;
  probCut: number;
  expectedRate3M: number;
  expectedRate6M: number;
  expectedRate12M: number;
  fedBalanceSheetTrillions: number;
  fedStanceScore: number; // 0-100 (0 = Extreme Hawkish, 100 = Extreme Dovish)
  fedStanceLabel: 'HAWISH' | 'LEANING_HAWKISH' | 'NEUTRAL' | 'LEANING_DOVISH' | 'DOVISH';
  recentStatementSummary: string;
}

export interface MacroCalendarEvent {
  id: string;
  event: string;
  category: 'INFLATION' | 'LABOR' | 'GROWTH' | 'CENTRAL_BANK' | 'SENTIMENT';
  dateStr: string;
  previous: string;
  forecast: string;
  actual: string;
  surpriseValue: string;
  surpriseStandardized: number; // in sigma
  fedImpact: 'DOVISH' | 'HAWKISH' | 'NEUTRAL';
  goldImpact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  analysisNote: string;
}

export interface CentralBankGoldData {
  monthlyNetPurchasesTonnes: number;
  annualNetPurchasesTonnes: number;
  rolling3MTonnes: number;
  rolling6MTonnes: number;
  rolling12MTonnes: number;
  aiDemandTrend: 'ACCELERATING' | 'STABLE' | 'DECLINING';
  historicalPercentile: number;
  topBuyers: { country: string; flag: string; tonnesHeld: number; ytdAdditionsTonnes: number; reserveSharePct: number }[];
}

export interface GoldEtfFlowData {
  totalTonnesHeld: number;
  totalAumBillions: number;
  dailyFlowTonnes: number;
  weeklyFlowTonnes: number;
  monthlyFlowTonnes: number;
  regionalFlows: { region: string; weeklyTonnes: number }[];
  priceVsFlowDivergence: boolean;
  aiInstitutionalDemandScore: number; // 0-100
  majorHoldings: { ticker: string; name: string; tonnes: number; aumUsdB: number; weeklyChange: string }[];
}

export interface CftcCotData {
  managedMoneyLongContracts: number;
  managedMoneyShortContracts: number;
  managedMoneyNetContracts: number;
  commercialLongContracts: number;
  commercialShortContracts: number;
  commercialNetContracts: number;
  openInterestTotal: number;
  weeklyNetChangeContracts: number;
  percentile1Y: number;
  percentile3Y: number;
  percentile5Y: number;
  crowdedStatus: 'EXTREME_CROWDED_LONG' | 'MODERATELY_LONG' | 'BALANCED' | 'CROWDED_SHORT';
  extremeReversalAlert: boolean;
}

export interface GoldDerivativesData {
  futuresOpenInterest: number;
  futuresDailyVolume: number;
  basisAnnualizedPct: number;
  termStructureState: 'CONTANGO' | 'BACKWARDATION';
  optionsVolume: number;
  putCallRatio: number;
  impliedVolatility: number; // GVZ
  volatilitySkew: string;
  maxPainStrike: number;
  highestCallOiStrike: number;
  highestPutOiStrike: number;
}

export interface GlobalLiquidityData {
  globalM2Trillions: number;
  globalM2YoYPct: number;
  usM2Trillions: number;
  chinaM2Trillions: number;
  ecbBalanceSheetTrillionsEur: number;
  fedBalanceSheetTrillionsUsd: number;
  bojBalanceSheetTrillionsJpy: number;
  usTgaBillions: number;
  reverseRepoBillions: number;
  netDollarLiquidityTrend: 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING';
}

export interface GeopoliticalRiskData {
  overallRiskScore: number; // 0-100
  riskRegime: 'HIGH_ELEVATED' | 'MODERATE' | 'LOW';
  activeConflicts: { title: string; category: string; impactOnGold: 'HIGH_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL'; timestamp: string; confidencePct: number }[];
}

export interface OilCommoditiesData {
  wtiCrudePrice: number;
  brentCrudePrice: number;
  copperPrice: number;
  silverPrice: number;
  platinumPrice: number;
  oilVolatilityOvx: number;
  crossAssetInflationTransmission: string;
}

export interface IndiaMcxData {
  usdInrLive: number;
  mcxGold10g: number;
  mcxGoldMini: number;
  internationalVsMcxDivergencePct: number;
  importDutyPct: number;
  rbiGoldReservesTonnes: number;
  rbiGoldReserveSharePct: number;
  seasonalDemandIndex: number; // 0-100 (Diwali, Dhanteras, Wedding Season)
  seasonalPhaseName: string;
  mcxBasisStatus: 'PREMIUM' | 'PARITY' | 'DISCOUNT';
}

export interface PhysicalSupplyDemandData {
  annualMineProductionTonnes: number;
  recycledScrapSupplyTonnes: number;
  mineSupplyGrowthYoYPct: number;
  averageAiscUsdPerOz: number;
  jewelleryDemandTonnes: number;
  techIndustrialDemandTonnes: number;
  barCoinRetailDemandTonnes: number;
  majorMiners: { company: string; outputKoz: number; aiscUsd: number; guidance: string }[];
}

export interface TechnicalSMCData {
  marketStructure: 'BULLISH_HH_HL' | 'BEARISH_LH_LL' | 'SIDEWAYS_RANGE';
  bosStatus: 'BULLISH_BOS_CONFIRMED' | 'BEARISH_BOS_CONFIRMED' | 'NONE';
  chochStatus: 'BULLISH_CHOCH_REVERSAL' | 'BEARISH_CHOCH_REVERSAL' | 'NONE';
  immediateSupport: number;
  immediateResistance: number;
  asianSessionHigh: number;
  asianSessionLow: number;
  asianSweepDetected: 'ASIAN_HIGH_SWEPT_REJECTED' | 'ASIAN_LOW_SWEPT_REJECTED' | 'NO_SWEEP';
  fvgZoneBullish: string;
  fvgZoneBearish: string;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  rsi14D: number;
  macdHistogram: 'POSITIVE_EXPANDING' | 'POSITIVE_CONTRACTING' | 'NEGATIVE_EXPANDING' | 'NEGATIVE_CONTRACTING';
  dailyPivots: { r2: number; r1: number; pivot: number; s1: number; s2: number };
}

export interface PillarScoreWeight {
  pillarId: string;
  name: string;
  category: string;
  weightPct: number; // default sum = 100
  score: number; // 0 - 100
  bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  institutionalReason: string;
  dataQuality: 'PRIMARY_LIVE' | 'OFFICIAL_DAILY' | 'CFTC_WEEKLY' | 'ESTIMATED';
}

export interface WhyGoldIsMovingDiagnostic {
  priceMoveMagnitude: string;
  primaryDriver: string;
  secondaryDriver: string;
  dxyFactor: string;
  yield10YFactor: string;
  realYieldFactor: string;
  fedExpectationFactor: string;
  etfFlowFactor: string;
  cftcFactor: string;
  geopoliticalFactor: string;
  technicalTrigger: string;
  aiExplanation: {
    whatChanged: string;
    whoMovedFirst: string;
    isTemporaryOrStructural: 'STRUCTURAL' | 'TEMPORARY_NOISE' | 'LIQUIDITY_EXPANSION';
    confirmationRejectionCriteria: string;
  };
}

export interface AnomalyDivergenceItem {
  id: string;
  title: string;
  condition: string;
  detected: boolean;
  type: 'BULLISH_ANOMALY' | 'BEARISH_ANOMALY' | 'WARNING';
  explanation: string;
}

export interface MarketCyclePhase {
  phaseNumber: number;
  name: string;
  cycleType: 'BULL_MARKET' | 'BEAR_MARKET';
  characteristics: string;
  keySigns: string[];
  currentMatch: boolean;
  institutionalAction: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MOCK / REALISTIC INSTITUTIONAL DEFAULT DATASETS                            */
/* ────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_GOLD_PRICES: GoldMarketPriceData = {
  spotXauUsd: 4165.42,
  spotChange: -5.27,
  spotChangePct: -0.13,
  dailyHigh: 4198.62,
  dailyLow: 4147.39,
  weeklyHigh: 4210.00,
  weeklyLow: 4110.00,
  monthlyHigh: 4210.00,
  monthlyLow: 3980.00,
  yearlyHigh: 4210.00,
  yearlyLow: 2680.00,
  comexFuturesFront: 4181.10,
  comexVolumeContracts: 236400,
  comexOpenInterest: 512800,
  futuresBasis: 15.68,
  termStructure: 'CONTANGO',
  mcxGoldInrPer10g: 88450,
  mcxGoldChangePct: 0.74,
  mcxGoldMiniInr: 88220,
  usdInrRate: 86.42,
  bidAskSpread: 0.18,
  atr14D: 42.60,
  realizedVol30D: 18.4,
  goldSilverRatio: 73.20,
  goldDxyCorrelation: -0.84,
  goldRealYieldCorrelation: -0.88
};

export const DEFAULT_USD_DOLLAR: UsDollarData = {
  dxyLive: 102.42,
  dxyChange1D: -0.31,
  dxyChange1W: -0.84,
  dxyChange1M: -1.45,
  dxyChange3M: -2.80,
  dxyChange1Y: -3.60,
  ma20D: 103.10,
  ma50D: 103.85,
  ma100D: 104.20,
  ma200D: 104.60,
  trend: 'BEARISH',
  momentumRsi: 38.6,
  eurUsd: 1.0940,
  usdJpy: 151.20,
  gbpUsd: 1.2890,
  correlationStatus: 'NORMAL_INVERSE',
  aiRelationshipNote: 'DXY is trading below its 20, 50, and 200 EMAs. Broad dollar weakness is directly lowering foreign investor acquisition cost for bullion.'
};

export const DEFAULT_TREASURY_YIELDS: TreasuryYieldData = {
  us2Y: 3.82,
  us5Y: 3.94,
  us10Y: 4.08,
  us30Y: 4.42,
  tipsRealYield10Y: 1.62,
  spread2Y10Y: 26,
  spread10Y30Y: 34,
  curveRegime: 'STEEPENING',
  realYieldChange1D: -0.04,
  realYieldChange1W: -0.09,
  realYieldChange1M: -0.22,
  aiYieldInterpretation: '10Y Real TIPS yield compressed to 1.62%. Lower real yields dramatically reduce the opportunity cost of holding non-yielding physical bullion.',
  supportiveOrRestrictive: 'SUPPORTIVE'
};

export const DEFAULT_FED_POLICY: FedMonetaryPolicyData = {
  targetRange: '4.25% – 4.50%',
  nextFomcDate: 'March 18, 2026',
  nextFomcCountdownDays: 14,
  probHike: 0,
  probHold: 32,
  probCut: 68,
  expectedRate3M: 4.05,
  expectedRate6M: 3.75,
  expectedRate12M: 3.30,
  fedBalanceSheetTrillions: 6.62,
  fedStanceScore: 72,
  fedStanceLabel: 'LEANING_DOVISH',
  recentStatementSummary: 'Fed Chair acknowledged disinflation progress and softening labor demand, confirming policy is positioned to normalize downward.'
};

export const DEFAULT_MACRO_CALENDAR: MacroCalendarEvent[] = [
  {
    id: 'cpi-core',
    event: 'US Core CPI (MoM)',
    category: 'INFLATION',
    dateStr: 'Mar 12, 13:30 UTC',
    previous: '0.3%',
    forecast: '0.2%',
    actual: '0.2%',
    surpriseValue: '0.0%',
    surpriseStandardized: -0.15,
    fedImpact: 'DOVISH',
    goldImpact: 'BULLISH',
    analysisNote: 'Confirmed disinflation trend without accelerating upside pressure.'
  },
  {
    id: 'nfp-labor',
    event: 'Non-Farm Payrolls (NFP)',
    category: 'LABOR',
    dateStr: 'Mar 07, 13:30 UTC',
    previous: '182K',
    forecast: '160K',
    actual: '142K',
    surpriseValue: '-18K',
    surpriseStandardized: -0.72,
    fedImpact: 'DOVISH',
    goldImpact: 'BULLISH',
    analysisNote: 'Labor market cooling strengthens market probability of consecutive Fed rate cuts.'
  },
  {
    id: 'pce-core',
    event: 'Core PCE Price Index (YoY)',
    category: 'INFLATION',
    dateStr: 'Feb 28, 13:30 UTC',
    previous: '2.7%',
    forecast: '2.6%',
    actual: '2.5%',
    surpriseValue: '-0.1%',
    surpriseStandardized: -0.85,
    fedImpact: 'DOVISH',
    goldImpact: 'BULLISH',
    analysisNote: "Fed's primary inflation gauge continues smooth glidepath toward 2.0% target."
  },
  {
    id: 'gdp-us',
    event: 'US Real GDP (Annualized Q4)',
    category: 'GROWTH',
    dateStr: 'Feb 26, 13:30 UTC',
    previous: '3.1%',
    forecast: '2.4%',
    actual: '2.3%',
    surpriseValue: '-0.1%',
    surpriseStandardized: -0.40,
    fedImpact: 'NEUTRAL',
    goldImpact: 'BULLISH',
    analysisNote: 'Moderate slowdown reduces economic overheating risk, keeping rate cut path intact.'
  },
  {
    id: 'ism-mfg',
    event: 'ISM Manufacturing PMI',
    category: 'GROWTH',
    dateStr: 'Mar 03, 15:00 UTC',
    previous: '49.2',
    forecast: '49.8',
    actual: '50.3',
    surpriseValue: '+0.5',
    surpriseStandardized: 0.60,
    fedImpact: 'HAWKISH',
    goldImpact: 'NEUTRAL',
    analysisNote: 'Brief expansion territory print triggered transient algorithmic intraday dip in gold.'
  }
];

export const DEFAULT_CENTRAL_BANK_GOLD: CentralBankGoldData = {
  monthlyNetPurchasesTonnes: 44.8,
  annualNetPurchasesTonnes: 1045,
  rolling3MTonnes: 128.4,
  rolling6MTonnes: 264.2,
  rolling12MTonnes: 1045,
  aiDemandTrend: 'ACCELERATING',
  historicalPercentile: 96,
  topBuyers: [
    { country: 'China (PBoC)', flag: '🇨🇳', tonnesHeld: 2264, ytdAdditionsTonnes: 48.6, reserveSharePct: 5.4 },
    { country: 'India (RBI)', flag: '🇮🇳', tonnesHeld: 854.7, ytdAdditionsTonnes: 32.4, reserveSharePct: 10.2 },
    { country: 'Poland (NBP)', flag: '🇵🇱', tonnesHeld: 420.2, ytdAdditionsTonnes: 28.5, reserveSharePct: 14.8 },
    { country: 'Turkey (CBRT)', flag: '🇹🇷', tonnesHeld: 588.6, ytdAdditionsTonnes: 22.1, reserveSharePct: 34.2 },
    { country: 'Singapore (MAS)', flag: '🇸🇬', tonnesHeld: 242.0, ytdAdditionsTonnes: 14.0, reserveSharePct: 4.8 }
  ]
};

export const DEFAULT_ETF_FLOWS: GoldEtfFlowData = {
  totalTonnesHeld: 3284,
  totalAumBillions: 246.8,
  dailyFlowTonnes: 4.2,
  weeklyFlowTonnes: 18.6,
  monthlyFlowTonnes: 42.8,
  regionalFlows: [
    { region: 'North America', weeklyTonnes: 11.4 },
    { region: 'Europe', weeklyTonnes: 4.8 },
    { region: 'Asia', weeklyTonnes: 2.4 }
  ],
  priceVsFlowDivergence: false,
  aiInstitutionalDemandScore: 84,
  majorHoldings: [
    { ticker: 'GLD', name: 'SPDR Gold Shares', tonnes: 884.2, aumUsdB: 78.4, weeklyChange: '+8.2t' },
    { ticker: 'IAU', name: 'iShares Gold Trust', tonnes: 486.0, aumUsdB: 42.1, weeklyChange: '+4.1t' },
    { ticker: 'ZKB', name: 'ZKB Gold ETF (Swiss)', tonnes: 210.5, aumUsdB: 18.2, weeklyChange: '+2.0t' },
    { ticker: 'SGOL', name: 'Aberdeen Physical Gold', tonnes: 118.4, aumUsdB: 10.2, weeklyChange: '+1.4t' }
  ]
};

export const DEFAULT_CFTC_COT: CftcCotData = {
  managedMoneyLongContracts: 264200,
  managedMoneyShortContracts: 42800,
  managedMoneyNetContracts: 221400,
  commercialLongContracts: 112000,
  commercialShortContracts: 348000,
  commercialNetContracts: -236000,
  openInterestTotal: 512800,
  weeklyNetChangeContracts: 8400,
  percentile1Y: 82,
  percentile3Y: 76,
  percentile5Y: 71,
  crowdedStatus: 'MODERATELY_LONG',
  extremeReversalAlert: false
};

export const DEFAULT_DERIVATIVES: GoldDerivativesData = {
  futuresOpenInterest: 512800,
  futuresDailyVolume: 236400,
  basisAnnualizedPct: 2.85,
  termStructureState: 'CONTANGO',
  optionsVolume: 68400,
  putCallRatio: 0.62,
  impliedVolatility: 17.8, // GVZ
  volatilitySkew: 'Bullish Call Skew (+2.4 vol points on 25 delta OTM calls)',
  maxPainStrike: 4100,
  highestCallOiStrike: 4200,
  highestPutOiStrike: 4000
};

export const DEFAULT_GLOBAL_LIQUIDITY: GlobalLiquidityData = {
  globalM2Trillions: 104.8,
  globalM2YoYPct: 5.4,
  usM2Trillions: 21.4,
  chinaM2Trillions: 42.8,
  ecbBalanceSheetTrillionsEur: 6.42,
  fedBalanceSheetTrillionsUsd: 6.62,
  bojBalanceSheetTrillionsJpy: 748,
  usTgaBillions: 680,
  reverseRepoBillions: 184,
  netDollarLiquidityTrend: 'EXPANDING'
};

export const DEFAULT_GEOPOLITICAL: GeopoliticalRiskData = {
  overallRiskScore: 78,
  riskRegime: 'HIGH_ELEVATED',
  activeConflicts: [
    {
      title: 'Middle East Strait of Hormuz & Maritime Trade Disruption',
      category: 'REGIONAL_WAR',
      impactOnGold: 'HIGH_BULLISH',
      timestamp: '2 hours ago',
      confidencePct: 92
    },
    {
      title: 'US-China High-Tech Chip & Tariff Sanction Escalation',
      category: 'TRADE_WAR',
      impactOnGold: 'MODERATE_BULLISH',
      timestamp: '5 hours ago',
      confidencePct: 88
    },
    {
      title: 'Sovereign Reserve Weaponization Concerns & De-Dollarization',
      category: 'SANCTIONS_RESERVES',
      impactOnGold: 'HIGH_BULLISH',
      timestamp: '1 day ago',
      confidencePct: 95
    }
  ]
};

export const DEFAULT_OIL_COMMODITIES: OilCommoditiesData = {
  wtiCrudePrice: 78.40,
  brentCrudePrice: 82.15,
  copperPrice: 4.34,
  silverPrice: 32.85,
  platinumPrice: 985.00,
  oilVolatilityOvx: 28.4,
  crossAssetInflationTransmission: 'Elevated oil ($82 Brent) supports inflation floor while boosting gold monetary hedge appeal.'
};

export const DEFAULT_INDIA_MCX: IndiaMcxData = {
  usdInrLive: 86.42,
  mcxGold10g: 88450,
  mcxGoldMini: 88220,
  internationalVsMcxDivergencePct: 0.12,
  importDutyPct: 6.0,
  rbiGoldReservesTonnes: 854.7,
  rbiGoldReserveSharePct: 10.2,
  seasonalDemandIndex: 78,
  seasonalPhaseName: 'Auspicious Spring Wedding Season & Akshaya Tritiya Build-up',
  mcxBasisStatus: 'PREMIUM'
};

export const DEFAULT_PHYSICAL_SD: PhysicalSupplyDemandData = {
  annualMineProductionTonnes: 3650,
  recycledScrapSupplyTonnes: 1280,
  mineSupplyGrowthYoYPct: 0.6,
  averageAiscUsdPerOz: 1380,
  jewelleryDemandTonnes: 2180,
  techIndustrialDemandTonnes: 312,
  barCoinRetailDemandTonnes: 1190,
  majorMiners: [
    { company: 'Newmont (NEM)', outputKoz: 5800, aiscUsd: 1440, guidance: 'Stable 2026 production' },
    { company: 'Barrick Gold (GOLD)', outputKoz: 4100, aiscUsd: 1320, guidance: 'Tier-one asset focus' },
    { company: 'Agnico Eagle (AEM)', outputKoz: 3450, aiscUsd: 1180, guidance: 'Lowest quartile cost' },
    { company: 'Gold Fields', outputKoz: 2280, aiscUsd: 1410, guidance: 'Expansion in Chile' }
  ]
};

export const DEFAULT_TECHNICAL_SMC: TechnicalSMCData = {
  marketStructure: 'BULLISH_HH_HL',
  bosStatus: 'BULLISH_BOS_CONFIRMED',
  chochStatus: 'NONE',
  immediateSupport: 4098.00,
  immediateResistance: 4148.50,
  asianSessionHigh: 4136.20,
  asianSessionLow: 4104.00,
  asianSweepDetected: 'ASIAN_LOW_SWEPT_REJECTED',
  fvgZoneBullish: '$4,114.00 – $4,120.50 (Unmitigated 15M Bullish FVG)',
  fvgZoneBearish: '$4,142.00 – $4,146.00 (Upper Liquidity Pool)',
  ema20: 4118.20,
  ema50: 4102.50,
  ema100: 4078.00,
  ema200: 4040.00,
  rsi14D: 64.2,
  macdHistogram: 'POSITIVE_EXPANDING',
  dailyPivots: {
    r2: 4162.00,
    r1: 4144.00,
    pivot: 4118.00,
    s1: 4096.00,
    s2: 4072.00
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/* 10 PILLARS REGIME SCORE DEFINITIONS (SECTION 19)                            */
/* ────────────────────────────────────────────────────────────────────────── */

export const INITIAL_PILLAR_WEIGHTS: PillarScoreWeight[] = [
  {
    pillarId: 'macro_fed',
    name: '1. Macro & Fed Policy',
    category: 'Macro',
    weightPct: 20,
    score: 82,
    bias: 'BULLISH',
    institutionalReason: '68% probability of upcoming rate cut; Fed easing trajectory decreases non-yielding holding drag.',
    dataQuality: 'OFFICIAL_DAILY'
  },
  {
    pillarId: 'real_yields',
    name: '2. Real Yields & Treasury',
    category: 'Rates',
    weightPct: 15,
    score: 86,
    bias: 'BULLISH',
    institutionalReason: '10Y Real TIPS yield compressed to 1.62% (-9 bps WoW). Direct inverse driver strongly supportive.',
    dataQuality: 'PRIMARY_LIVE'
  },
  {
    pillarId: 'usd_dxy',
    name: '3. US Dollar Index (DXY)',
    category: 'Currency',
    weightPct: 10,
    score: 80,
    bias: 'BULLISH',
    institutionalReason: 'DXY below 20/50/200 EMAs (102.42, -0.31%). Broad dollar retreat lowers international acquisition friction.',
    dataQuality: 'PRIMARY_LIVE'
  },
  {
    pillarId: 'etf_institutional',
    name: '4. ETF & Institutional Flow',
    category: 'Institutional',
    weightPct: 10,
    score: 84,
    bias: 'BULLISH',
    institutionalReason: 'Western physical ETF holdings register 4th straight week of net positive inflows (+18.6 tonnes).',
    dataQuality: 'OFFICIAL_DAILY'
  },
  {
    pillarId: 'central_banks',
    name: '5. Central Bank Demand',
    category: 'Sovereign',
    weightPct: 10,
    score: 95,
    bias: 'BULLISH',
    institutionalReason: 'Sovereign accumulation exceeding 1,000 tonnes annualized. PBoC and RBI providing permanent structural floor.',
    dataQuality: 'OFFICIAL_DAILY'
  },
  {
    pillarId: 'cftc_positioning',
    name: '6. CFTC / COT Positioning',
    category: 'Derivatives',
    weightPct: 8,
    score: 72,
    bias: 'BULLISH',
    institutionalReason: 'Managed Money net long at 76th percentile; healthy institutional backing without extreme exhaustion risk.',
    dataQuality: 'CFTC_WEEKLY'
  },
  {
    pillarId: 'global_liquidity',
    name: '7. Global Liquidity / M2',
    category: 'Liquidity',
    weightPct: 10,
    score: 85,
    bias: 'BULLISH',
    institutionalReason: 'Global M2 index expanded +5.4% YoY to $104.8T. Monetary base expansion historically correlates to hard asset repricing.',
    dataQuality: 'OFFICIAL_DAILY'
  },
  {
    pillarId: 'geopolitics',
    name: '8. Geopolitics & Sanctions',
    category: 'Macro Risk',
    weightPct: 7,
    score: 88,
    bias: 'BULLISH',
    institutionalReason: 'Strait of Hormuz disruptions and sanction fears continue driving non-dollar sovereign diversification.',
    dataQuality: 'PRIMARY_LIVE'
  },
  {
    pillarId: 'physical_supply_demand',
    name: '9. Physical Supply & Demand',
    category: 'Physical',
    weightPct: 5,
    score: 74,
    bias: 'BULLISH',
    institutionalReason: 'Mine supply flat (+0.6% YoY) while Indian & Chinese retail bar/coin demand remains resilient.',
    dataQuality: 'OFFICIAL_DAILY'
  },
  {
    pillarId: 'technical_smc',
    name: '10. Technical Structure & SMC',
    category: 'Technicals',
    weightPct: 5,
    score: 86,
    bias: 'BULLISH',
    institutionalReason: 'Consecutive Higher Highs & Higher Lows, 15M Bullish FVG holding, clean sweep of Asian lows with London expansion.',
    dataQuality: 'PRIMARY_LIVE'
  }
];

/* ────────────────────────────────────────────────────────────────────────── */
/* 7 DIVERGENCES & ANOMALIES (SECTION 23)                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_ANOMALIES: AnomalyDivergenceItem[] = [
  {
    id: 'gold_dxy_both_rising',
    title: 'Gold ↑ while DXY ↑ (Safe Haven Decoupling)',
    condition: 'Both Gold and US Dollar index rising simultaneously over 5-day window.',
    detected: false,
    type: 'BULLISH_ANOMALY',
    explanation: 'When Gold defies strong dollar, it indicates extreme geopolitical stress or sovereign de-dollarization flight.'
  },
  {
    id: 'gold_real_yields_both_rising',
    title: 'Gold ↑ while Real Yields ↑ (Fiscal Risk Premium)',
    condition: 'Gold expanding despite positive TIPS yield spike.',
    detected: false,
    type: 'BULLISH_ANOMALY',
    explanation: 'Market is pricing US fiscal debt sustainability and long-term debasement risks over short-term interest rates.'
  },
  {
    id: 'gold_drop_etf_inflows',
    title: 'Gold ↓ while ETF Flows ↑ (Institutional Accumulation)',
    condition: 'Spot price dipping while major Western ETF vaults add net tonnage.',
    detected: false,
    type: 'BULLISH_ANOMALY',
    explanation: 'Smart institutional money utilizing speculative futures dumps to build physical long-term vault positions.'
  },
  {
    id: 'price_up_oi_down',
    title: 'Price ↑ while Open Interest ↓ (Short-Covering Squeeze)',
    condition: 'Gold rallies while total COMEX open interest decreases.',
    detected: false,
    type: 'WARNING',
    explanation: 'Rally driven by short sellers capitulating rather than aggressive new organic buyers; vulnerable to rapid exhaustion.'
  },
  {
    id: 'cftc_extreme_crowded',
    title: 'CFTC Managed Money at > 92nd Percentile (Crowded Long Warning)',
    condition: 'Speculative long contracts heavily saturated.',
    detected: false,
    type: 'BEARISH_ANOMALY',
    explanation: 'Extreme positioning leaves bullion highly susceptible to cascade liquidations on any hawkish macro surprise.'
  },
  {
    id: 'high_breakout_low_volume',
    title: 'Breakout above Resistance without Volume Confirmation (Fakeout Risk)',
    condition: 'Price pushes to new weekly highs on below-average volume.',
    detected: false,
    type: 'WARNING',
    explanation: 'Lack of institutional participation suggests retail trap or low-liquidity sweep before mean-reversion.'
  },
  {
    id: 'macro_bull_technical_bear',
    title: 'Macro Bullish vs Technical Structure Bearish (Patience Trigger)',
    condition: 'Macro regime score > 75 but 4H prints lower low or breakdown.',
    detected: false,
    type: 'WARNING',
    explanation: 'Macro direction is sound, but timing is premature; wait for lower timeframe CHoCH confirmation before execution.'
  }
];

/* ────────────────────────────────────────────────────────────────────────── */
/* 6 MARKET CYCLE PHASES (INFOGRAPHIC 4)                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export const MARKET_CYCLE_PHASES: MarketCyclePhase[] = [
  {
    phaseNumber: 1,
    name: 'Accumulation (Smart Money Buying)',
    cycleType: 'BULL_MARKET',
    characteristics: 'Market moves sideways/down at deep value. Retail interest low, smart money quietly absorbs physical metal.',
    keySigns: ['Low Volume consolidation', 'Low Open Interest', 'Near major historical demand / Cost of Production', 'Whale & Central bank accumulation'],
    currentMatch: false,
    institutionalAction: 'Scale into spot and core physical holdings on discount pullbacks.'
  },
  {
    phaseNumber: 2,
    name: 'Breakout (Trend Change)',
    cycleType: 'BULL_MARKET',
    characteristics: 'Price decisively breaks major resistance. Volume expands significantly, beginning new upward trajectory.',
    keySigns: ['Breakout + Volume surge', 'Structure Change (CHOCH)', 'Higher High printed on Daily', 'Momentum indicators align'],
    currentMatch: false,
    institutionalAction: 'Add trend-following swing contracts on first 15M/1H FVG retest.'
  },
  {
    phaseNumber: 3,
    name: 'Confidence (Trend Continuation) ⭐ ACTIVE PHASE',
    cycleType: 'BULL_MARKET',
    characteristics: 'Market moves smoothly higher. Institutions and Western ETFs show steady positive inflows. High confidence.',
    keySigns: ['Sustained ETF inflows', 'Positive macro news alignment', 'Strong multi-timeframe uptrend', 'Demand increases on every dip'],
    currentMatch: true,
    institutionalAction: 'Ride core long exposure, trail stops below swing Higher Lows, take partial profits at key extensions.'
  },
  {
    phaseNumber: 4,
    name: 'FOMO (Retail Rush)',
    cycleType: 'BULL_MARKET',
    characteristics: 'Retail traders rush in fear of missing out. Futures funding rates increase, Open Interest expands parabolically.',
    keySigns: ['High Funding Rates', 'Open Interest spikes', 'Media headlines everywhere', 'Parabolic steep slope candles'],
    currentMatch: false,
    institutionalAction: 'Tighten trailing stops; avoid initiating fresh unhedged leverage.'
  },
  {
    phaseNumber: 5,
    name: 'Euphoria (Extreme Greed & Blow-Off)',
    cycleType: 'BULL_MARKET',
    characteristics: 'Extreme greed index (> 85). Everyone believes gold will rise forever. Maximum leverage deployed.',
    keySigns: ['Extreme Greed', 'Overextension from 200 EMA (> 20%)', 'Mainstream media mania', 'Leverage at record highs'],
    currentMatch: false,
    institutionalAction: 'Aggressively take profits into the liquidity pool; hedge with put options.'
  },
  {
    phaseNumber: 6,
    name: 'Distribution (Profit Booking)',
    cycleType: 'BULL_MARKET',
    characteristics: 'Smart money distributes inventory to late retail buyers. Price fails to make new highs, rounding top forms.',
    keySigns: ['Lower Highs appearing', 'Volume decreasing on rallies', 'Heavy sell delta on spikes', 'Trend momentum weakening'],
    currentMatch: false,
    institutionalAction: 'Close remaining long exposure; prepare short setups on structural breakdown.'
  }
];

/* ────────────────────────────────────────────────────────────────────────── */
/* 20 CORE DATABASE TABLES SCHEMA (SECTION 26)                                */
/* ────────────────────────────────────────────────────────────────────────── */

export const DATABASE_TABLES_SCHEMA = [
  { table: 'market_prices', desc: 'Real-time XAU/USD spot, COMEX futures, MCX Gold prices & spreads' },
  { table: 'market_volume', desc: 'Tick & aggregate volume across COMEX, London LBMA, and MCX' },
  { table: 'futures_oi', desc: 'COMEX open interest by strike and contract expiration' },
  { table: 'options_data', desc: 'Put/Call ratio, Greeks, Max Pain, Implied Volatility (GVZ)' },
  { table: 'treasury_yields', desc: 'US 2Y, 5Y, 10Y, 30Y nominal yields and curve slope' },
  { table: 'real_yields', desc: 'US 5Y & 10Y TIPS real yields and breakeven inflation rates' },
  { table: 'dxy', desc: 'US Dollar Index OHLC, EMAs, and major FX cross rates' },
  { table: 'fed_policy', desc: 'Fed Funds rate target, FedWatch probabilities, balance sheet' },
  { table: 'economic_calendar', desc: 'Macro release schedule with priority and forecast tags' },
  { table: 'economic_releases', desc: 'Actual vs forecast historical records with surprise calculations' },
  { table: 'etf_flows', desc: 'Daily/weekly holdings and net tonnage changes for GLD, IAU, etc.' },
  { table: 'cftc_positioning', desc: 'Weekly Commitments of Traders (COT) report positioning' },
  { table: 'central_bank_gold', desc: 'World Gold Council monthly/annual sovereign accumulation' },
  { table: 'global_liquidity', desc: 'Global M2 index, central bank assets, TGA, Reverse Repo' },
  { table: 'geopolitical_events', desc: 'Conflict alerts, sanctions, trade barriers with confidence' },
  { table: 'physical_supply_demand', desc: 'Mine production, AISC costs, recycling, jewellery/bar demand' },
  { table: 'technical_signals', desc: 'Market structure, HH/HL, BOS, CHOCH, liquidity sweeps, FVGs' },
  { table: 'ai_scores', desc: '10-Pillar weighted Gold Regime Scores and confidence history' },
  { table: 'ai_explanations', desc: 'Timestamped "Why Gold is Moving" natural language records' },
  { table: 'historical_snapshots', desc: 'Immutable multi-factor state snapshots for research and backtesting' }
];

/* ────────────────────────────────────────────────────────────────────────── */
/* 13-POINT LONG-TERM GOLD CHECKLIST (SECTION 28)                             */
/* ────────────────────────────────────────────────────────────────────────── */

export const LONG_TERM_GOLD_CHECKLIST = [
  { item: '1. Real Yields Trend', status: 'SUPPORTIVE', note: '10Y Real yield compressed from 2.2% peak to 1.62%.' },
  { item: '2. Fed Policy Direction', status: 'SUPPORTIVE', note: 'Global rate-cutting easing cycle underway.' },
  { item: '3. DXY Structural Trend', status: 'SUPPORTIVE', note: 'Bearish alignment below multi-year moving averages.' },
  { item: '4. Global Liquidity Trend', status: 'SUPPORTIVE', note: 'Global M2 expanding above $104T.' },
  { item: '5. Central-Bank Gold Buying Trend', status: 'VERY_BULLISH', note: 'De-dollarization floor (> 1,000t annually).' },
  { item: '6. Gold ETF Holdings / Flows', status: 'SUPPORTIVE', note: 'Western institutional inflows confirmed.' },
  { item: '7. CFTC Speculative Positioning', status: 'NEUTRAL_HEALTHY', note: '76th percentile — strong without euphoria.' },
  { item: '8. US Fiscal / Debt Environment', status: 'VERY_BULLISH', note: '$36T US National debt creates structural debasement bid.' },
  { item: '9. Geopolitical Fragmentation / Risk', status: 'VERY_BULLISH', note: 'Multi-polar conflict elevated safe-haven premium.' },
  { item: '10. Physical Demand from India / China', status: 'SUPPORTIVE', note: 'Steady consumer, wedding & temple purchases.' },
  { item: '11. Mine Supply & Recycling Growth', status: 'SUPPORTIVE', note: 'Peak discovery constraints limit supply growth (< 1%).' },
  { item: '12. Valuation relative to Historical Real Yields', status: 'FAIR_TO_SLIGHT_PREMIUM', note: 'Gold carries ~10% geopolitical sovereign premium.' },
  { item: '13. Technical Long-Term Structure', status: 'VERY_BULLISH', note: 'Multi-year pristine Higher Highs and Higher Lows on Monthly/Weekly.' }
];

/* ────────────────────────────────────────────────────────────────────────── */
/* ENGINE HELPER FUNCTIONS                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export function calculateRegimeScore(pillars: PillarScoreWeight[]): {
  totalScore: number;
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'MODERATELY_BULLISH' | 'NEUTRAL' | 'BEARISH';
  confidence: number;
} {
  let weightedSum = 0;
  let totalWeight = 0;

  pillars.forEach(p => {
    weightedSum += p.score * p.weightPct;
    totalWeight += p.weightPct;
  });

  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

  let bias: 'STRONG_BULLISH' | 'BULLISH' | 'MODERATELY_BULLISH' | 'NEUTRAL' | 'BEARISH' = 'NEUTRAL';
  if (finalScore >= 90) bias = 'STRONG_BULLISH';
  else if (finalScore >= 75) bias = 'BULLISH';
  else if (finalScore >= 60) bias = 'MODERATELY_BULLISH';
  else if (finalScore >= 40) bias = 'NEUTRAL';
  else bias = 'BEARISH';

  // Confidence is calculated from pillar agreement
  const bullishCount = pillars.filter(p => p.bias === 'BULLISH').length;
  const confidence = Math.min(95, Math.max(50, Math.round((bullishCount / pillars.length) * 100)));

  return { totalScore: finalScore, bias, confidence };
}
