/**
 * Delta Exchange India - Advanced Multi-Coin Investment Intelligence Engine
 * Official API Types & Institutional Research Engine Schema
 */

export type DeltaContractType =
  | 'perpetual_futures'
  | 'spot'
  | 'call_options'
  | 'put_options'
  | 'move_options'
  | 'spreads'
  | 'futures';

export type ResearchDecision =
  | 'STRONG CANDIDATE'
  | 'WATCHLIST'
  | 'WAIT'
  | 'AVOID'
  | 'INSUFFICIENT DATA';

export type InvestmentHorizon = '30D' | '60D' | '90D';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export type MarketRegimeType =
  | 'BULLISH_EXPANSION'
  | 'BEARISH_DISTRIBUTION'
  | 'ACCUMULATION_BASE'
  | 'VOLATILITY_SQUEEZE'
  | 'NEUTRAL_CONSOLIDATION'
  | 'EXHAUSTION_BREAKDOWN';

export interface DeltaProductRaw {
  id: number;
  symbol: string;
  short_description?: string;
  description?: string;
  contract_type: DeltaContractType;
  state: string; // 'live'
  trading_status: string; // 'operational'
  tick_size: string;
  contract_value: string;
  default_leverage: string;
  maker_commission_rate: string;
  taker_commission_rate: string;
  maintenance_margin?: string;
  initial_margin?: string;
  position_size_limit?: number;
  strike_price?: string;
  settlement_time?: string;
  underlying_asset?: {
    id: number;
    symbol: string;
    name: string;
    precision: number;
  };
  quoting_asset?: {
    id: number;
    symbol: string;
    name: string;
  };
  settling_asset?: {
    id: number;
    symbol: string;
    name: string;
  };
}

export interface DeltaTickerRaw {
  symbol: string;
  product_id?: number;
  contract_type?: DeltaContractType;
  underlying_asset_symbol?: string;
  close?: number;
  mark_price?: string | number;
  spot_price?: string | number;
  high?: number;
  low?: number;
  open?: number;
  ltp_change_24h?: string | number;
  mark_change_24h?: string | number;
  volume?: number;
  turnover?: number;
  turnover_usd?: number;
  oi?: string | number;
  oi_value_usd?: string | number;
  funding_rate?: string | number;
  mark_basis?: string | number;
  quotes?: {
    best_bid?: string | number;
    best_ask?: string | number;
    bid_size?: string | number;
    ask_size?: string | number;
    bid_iv?: string | number | null;
    ask_iv?: string | number | null;
  };
  price_band?: {
    lower_limit?: string | number;
    upper_limit?: string | number;
  };
  tags?: string[];
  time?: string;
  timestamp?: number;
}

export interface DeltaAssetRaw {
  id: number;
  name: string;
  symbol: string;
  precision: number;
  min_withdrawal_amount?: string;
  base_withdrawal_fee?: string;
}

export interface DeltaCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ContractSpecification {
  id: number;
  symbol: string;
  contractType: DeltaContractType;
  tradingStatus: string;
  settlementCurrency: string;
  makerFee: string;
  takerFee: string;
  tickSize: string;
  contractValue: string;
  maxLeverage: string;
  description: string;
  isSpot: boolean;
  strikePrice?: string;
  settlementTime?: string;
  currentPrice: number;
  turnoverUsd: number;
  openInterestUsd: number;
}

export interface ScenarioForecast {
  scenario: 'BULLISH' | 'BASE' | 'BEARISH';
  probability: number; // 0-100, sum must equal 100%
  targetPriceMin: number;
  targetPriceMax: number;
  triggerCondition: string;
  invalidationCondition: string;
  keyEvidence: string[];
  primaryCatalyst: string;
}

export interface HorizonAnalysis {
  horizon: InvestmentHorizon;
  horizonLabel: string;
  bullish: ScenarioForecast;
  base: ScenarioForecast;
  bearish: ScenarioForecast;
  expectedValuePrice: number;
  decision: ResearchDecision;
  decisionReason: string;
  invalidationCriteria: string;
}

export interface ResearchScores {
  fundamentals: number;       // weight 18%
  tokenomics: number;         // weight 15%
  technical: number;          // weight 18%
  liquidity: number;          // weight 12%
  onChain: number;            // weight 10%
  derivatives: number;        // weight 10%
  macro: number;              // weight 7%
  newsSentiment: number;      // weight 5%
  riskQuality: number;        // weight 5%
  overallScore: number;       // 0-100 weighted
  confidenceScore: number;    // 0-100 based on data completeness & verification
  dataFreshnessPenalty: number;
  missingDataNotes: string[];
}

export interface TokenomicsIntelligence {
  circulatingSupply: string;
  totalSupply: string;
  maxSupply: string;
  circulatingPct: number;
  fdvUsd: string;
  marketCapUsd: string;
  next90dUnlockPct: number;
  nextUnlockDate: string;
  vestingCliffDetails: string;
  annualInflationPct: string;
  stakingRewardsPct: string;
  tokenBurnsMechanism: string;
  treasuryReserves: string;
  whaleConcentrationPct: number;
  dilutionRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface MultiTimeframeTechnical {
  tf1W: { regime: MarketRegimeType; bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; keyZone: string };
  tf1D: { regime: MarketRegimeType; swingHigh: number; swingLow: number; bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  tf4H: { structure: 'HH_HL' | 'LH_LL' | 'CONSOLIDATING'; bosLevel: number; chochLevel: number; bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  tf1H: { entryZone: string; orderBlockRange: string; bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  supportZones: number[];
  resistanceZones: number[];
  orderBlocks: { type: 'BULLISH_OB' | 'BEARISH_OB'; range: string; timeframe: string }[];
  fairValueGaps: { type: 'BULLISH_FVG' | 'BEARISH_FVG'; range: string; status: 'UNFILLED' | 'PARTIAL' }[];
  liquidityPools: { type: 'EQUAL_HIGHS' | 'EQUAL_LOWS' | 'SWEEP'; level: number; note: string }[];
  volumeProfile: {
    poc: number; // Point of Control
    vah: number; // Value Area High
    val: number; // Value Area Low
    hvn: number[]; // High Volume Nodes
    lvn: number[]; // Low Volume Nodes
  };
  vwap: number;
  anchoredVwap: number;
  rsi14: number;
  macd: { macdLine: number; signalLine: number; histogram: number; bias: string };
  ema20: number;
  ema50: number;
  ema200: number;
  atr14: number;
  relativeStrengthVsBtc: 'OUTPERFORMING' | 'NEUTRAL' | 'UNDERPERFORMING';
  relativeStrengthVsEth: 'OUTPERFORMING' | 'NEUTRAL' | 'UNDERPERFORMING';
  historicalVolatility30dPct: number;
  maxAdverseExcursionPct: number;
}

export interface DerivativesOrderFlowIntel {
  openInterestUsd: number;
  openInterestDelta24hUsd: number;
  fundingRate8h: number;
  annualizedFundingPct: number;
  basisUsd: number;
  basisPct: number;
  termStructure: 'CONTANGO' | 'BACKWARDATION' | 'FLAT';
  estimatedLiquidationLongUsd: string;
  estimatedLiquidationShortUsd: string;
  squeezeRisk: 'SHORT_SQUEEZE_PRONE' | 'LONG_FLUSH_PRONE' | 'BALANCED';
  bidAskImbalancePct: number; // positive = bid heavy, negative = ask heavy
  cvdDeltaTrend: 'AGGRESSIVE_BUYING' | 'AGGRESSIVE_SELLING' | 'PASSIVE_ABSORPTION' | 'NEUTRAL';
  spotToDerivativesVolRatio: number;
  trappedTradersStatus: string;
}

export interface OnChainIntel {
  activeAddresses24h: string;
  newAddresses24h: string;
  txCount24h: string;
  txValueUsd24h: string;
  networkFees24h: string;
  protocolRevenue24h: string;
  exchangeNetFlowUsd: string;
  flowClassification: 'NET_OUTFLOW_BULLISH' | 'NET_INFLOW_BEARISH' | 'NEUTRAL' | 'N/A';
  whaleAccumulationStatus: 'ACCUMULATING' | 'DISTRIBUTING' | 'DORMANT' | 'N/A';
  top10WalletsConcentrationPct: string;
  stakingParticipationPct: string;
  bridgeEcosystemFlows: string;
  dataAvailability: 'LIVE_VERIFIED' | 'ESTIMATED' | 'NOT_APPLICABLE';
}

export interface MacroAndNewsEvent {
  id: string;
  title: string;
  category: 'REGULATORY' | 'MACRO' | 'ECOSYSTEM' | 'SECURITY' | 'LISTING' | 'GEOPOLITICAL';
  source: string;
  publishedAt: string;
  credibility: 'CONFIRMED_OFFICIAL' | 'REPUTABLE_OUTLET' | 'ANALYST_ESTIMATE';
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'HIGH_VOLATILITY';
  coinsAffected: string[];
  summary: string;
}

export interface CoinInvestmentThesis {
  projectOverview: string;
  valueAccrualMechanisms: string;
  strongestBullishArguments: string[];
  strongestBearishArguments: string[];
  recentDevelopments: string[];
  technicalStructureSummary: string;
  supplyAndTokenUnlockRisks: string;
  macroAndSectorCatalysts: string;
  upcomingCatalysts: string[];
  risksNext30To90Days: string[];
  invalidationConditions: string[];
}

export interface DeltaCoinProfile {
  // Identification
  symbol: string;
  name: string;
  sector: string;
  subCategory: string;
  tags: string[];

  // Delta Exchange Contract Availability
  hasSpot: boolean;
  hasPerpetual: boolean;
  hasOptions: boolean;
  primaryPerpSymbol?: string;
  primarySpotSymbol?: string;
  contracts: ContractSpecification[];
  totalContractsCount: number;

  // Live Pricing & Market Data
  price: number;
  spotPrice: number;
  markPrice: number;
  change24h: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  turnoverUsd24h: number;
  totalOiUsd: number;
  bidAskSpreadUsd: number;
  spreadPct: number;
  depthTopBidsUsd: number;
  depthTopAsksUsd: number;
  lastUpdated: string;
  dataFreshness: 'LIVE' | 'RECENT' | 'STALE' | 'FALLBACK';

  // Institutional Intelligence Sub-sections
  decision: ResearchDecision;
  decisionReason: string;
  riskLevel: RiskLevel;
  scores: ResearchScores;
  tokenomics: TokenomicsIntelligence;
  technicals: MultiTimeframeTechnical;
  derivatives: DerivativesOrderFlowIntel;
  onChain: OnChainIntel;
  thesis: CoinInvestmentThesis;
  horizons: {
    '30D': HorizonAnalysis;
    '60D': HorizonAnalysis;
    '90D': HorizonAnalysis;
  };
}

export interface MacroEnvironmentSnapshot {
  fedRateExpectation: string;
  fedRateDecisionDate: string;
  cpiYearOverYear: string;
  corePceYearOverYear: string;
  dxyIndex: number;
  dxyTrend: 'STRENGTHENING' | 'SOFTENING' | 'RANGE';
  us10yYield: string;
  globalLiquidityIndex: string;
  btcDominancePct: number;
  stablecoinTotalCapUsd: string;
  etfNetFlowWeeklyUsd: string;
  sp500Level: string;
  cryptoRiskRegime: 'RISK_ON_EXPANSION' | 'SELECTIVE_ROTATION' | 'DEFENSIVE_RISK_OFF' | 'LIQUIDITY_SQUEEZE';
}

export interface PortfolioStressTest {
  scenarioName: string;
  btcShockPct: number;
  altcoinBetaShockPct: number;
  liquidityShockPct: number;
  estimatedPortfolioDrawdownPct: number;
  recoveryHorizonDays: number;
  mitigationAdvice: string;
}
