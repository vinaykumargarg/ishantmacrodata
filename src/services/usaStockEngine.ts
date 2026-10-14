/**
 * USA STOCKS — ADVANCED SWING & INVESTMENT SCANNER ENGINE
 * Institutional 4H Swing Trading & 1-6 Month Multi-Horizon Equity Analysis
 * 10-Pillar Equity Scoring Model with Automatic Earnings Event Risk Protection
 */

export interface UsaStockProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change24h: number;
  marketCap: string; // e.g., "$3.45T"
  volume: string;
  avgVolume: string;
  peRatio: number;
  pegRatio: number;
  forwardPe: number;
  beta: number;
  institutionalOwnership: number; // in %
  shortInterestPct: number; // in %

  // Earnings Risk Guard
  earningsRisk: {
    nextEarningsDate: string;
    daysUntilEarnings: number;
    hasRiskWarning: boolean; // true if <= 14 days
    warningText: string;
  };

  // 4H Swing Technicals & SMC
  structure4H: 'BULLISH_BOS' | 'BEARISH_BOS' | 'CHOCH_REVERSAL' | 'RANGE_CONSOLIDATION';
  structureSummary: string;
  smcLevels: {
    orderBlock: { type: 'BULLISH' | 'BEARISH'; top: number; bottom: number };
    fvg: { type: 'BULLISH' | 'BEARISH' | 'NONE'; top: number; bottom: number };
    poc: number;
    vah: number;
    val: number;
  };

  // Options Sentiment
  optionsSentiment: {
    putCallRatio: number;
    maxPainPrice: number;
    ivRank: number; // 0 to 100
    sentimentBias: 'BULLISH_FLOW' | 'BEARISH_FLOW' | 'NEUTRAL';
  };

  // Relative Strength vs S&P 500 (SPY)
  relStrengthVsSpy: {
    perf1M: number;
    perf3M: number;
    status: 'MARKET_LEADER' | 'IN_LINE' | 'LAGGARD';
    rsScore: number; // 0 to 10
  };

  // 10-Pillar Equity Scoring (0 - 100)
  scoreBreakdown: {
    structureScore: number;     // max 15
    smcVolumeScore: number;     // max 15
    relStrengthScore: number;   // max 10
    earningsSafetyScore: number;// max 10
    fundamentalsScore: number;  // max 10
    valuationScore: number;     // max 10
    inst13FOwnershipScore: number; // max 10
    optionsSentimentScore: number; // max 10
    macroAlignmentScore: number;   // max 5
    riskRewardScore: number;       // max 5
    totalScore: number;            // 0 - 100
  };

  // Actionable Decision
  verdict: 'STRONG_BUY' | 'BUY' | 'WAIT' | 'SHORT' | 'STRONG_SHORT';
  verdictReason: string;
  confidence: number;

  // 4H Swing Execution Plan
  tradePlan: {
    direction: 'LONG' | 'SHORT' | 'WAIT';
    entryZone: [number, number];
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    riskRewardRatio: number;
    invalidationTrigger: string;
  };

  // 1-6 Month Investment Horizon
  investmentHorizon: {
    suitability: 'CORE_COMPOUNDER' | 'HIGH_GROWTH_AI' | 'VALUE_DIVIDEND' | 'MOMENTUM_SWING' | 'ASYMMETRIC_RISK';
    recommendedAllocationPct: number; // 0 to 15%
    fairValueDCF: number;
    marginOfSafety: number; // in %
    moatRating: 'WIDE_MOAT' | 'NARROW_MOAT' | 'NONE';
    growthThesis: string;
    target6M: number;
  };
}

export interface MacroRegimeState {
  sp500Status: 'BULLISH_TREND' | 'CHOP_CONSOLIDATION' | 'CORRECTION';
  nasdaqStatus: 'BULLISH_EXPANSION' | 'CONSOLIDATION' | 'WEAKNESS';
  vixLevel: number;
  vixRegime: 'LOW_VOLATILITY_COMPLACENT' | 'NORMAL_EXPANSION' | 'ELEVATED_RISK' | 'PANIC_SPIKE';
  us10YYield: number;
  dxyIndex: number;
  marketRegimeVerdict: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE US UNIVERSE (AI, TECH, VALUE, HEALTHCARE, CONSUMER, ETFS)
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_USA_STOCKS: UsaStockProfile[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    industry: 'Semiconductors & AI',
    price: 138.25,
    change24h: 3.15,
    marketCap: '$3.39T',
    volume: '48.2M',
    avgVolume: '45.0M',
    peRatio: 52.4,
    pegRatio: 1.15,
    forwardPe: 34.2,
    beta: 1.68,
    institutionalOwnership: 68.4,
    shortInterestPct: 1.25,
    earningsRisk: {
      nextEarningsDate: '2026-11-20',
      daysUntilEarnings: 37,
      hasRiskWarning: false,
      warningText: 'Earnings >30 days away. Safe for 4H swing execution.'
    },
    structure4H: 'BULLISH_BOS',
    structureSummary: 'Bullish BOS confirmed on 4H above $135.50 previous pivot high.',
    smcLevels: {
      orderBlock: { type: 'BULLISH', top: 134.50, bottom: 131.80 },
      fvg: { type: 'BULLISH', top: 135.20, bottom: 133.00 },
      poc: 133.80,
      vah: 140.50,
      val: 129.50
    },
    optionsSentiment: {
      putCallRatio: 0.62,
      maxPainPrice: 135.00,
      ivRank: 42,
      sentimentBias: 'BULLISH_FLOW'
    },
    relStrengthVsSpy: {
      perf1M: 8.4,
      perf3M: 19.8,
      status: 'MARKET_LEADER',
      rsScore: 10
    },
    scoreBreakdown: {
      structureScore: 15,
      smcVolumeScore: 14,
      relStrengthScore: 10,
      earningsSafetyScore: 10,
      fundamentalsScore: 10,
      valuationScore: 7,
      inst13FOwnershipScore: 9,
      optionsSentimentScore: 9,
      macroAlignmentScore: 5,
      riskRewardScore: 5,
      totalScore: 94
    },
    verdict: 'STRONG_BUY',
    verdictReason: 'Top AI hardware dominance, clean 4H breakout, high 13F smart money accumulation.',
    confidence: 94,
    tradePlan: {
      direction: 'LONG',
      entryZone: [134.50, 137.00],
      stopLoss: 129.80,
      takeProfit1: 148.00,
      takeProfit2: 158.00,
      riskRewardRatio: 3.42,
      invalidationTrigger: '4H candle close below $129.80 key swing low'
    },
    investmentHorizon: {
      suitability: 'HIGH_GROWTH_AI',
      recommendedAllocationPct: 12.0,
      fairValueDCF: 165.00,
      marginOfSafety: 16.2,
      moatRating: 'WIDE_MOAT',
      growthThesis: 'Blackwell GPU architecture ramp, sovereign AI demand, and CUDA developer lock-in moat.',
      target6M: 175.00
    }
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software & Cloud',
    price: 422.80,
    change24h: 1.45,
    marketCap: '$3.14T',
    volume: '18.4M',
    avgVolume: '21.0M',
    peRatio: 34.8,
    pegRatio: 2.10,
    forwardPe: 29.5,
    beta: 0.92,
    institutionalOwnership: 72.8,
    shortInterestPct: 0.75,
    earningsRisk: {
      nextEarningsDate: '2026-10-24',
      daysUntilEarnings: 10,
      hasRiskWarning: true,
      warningText: '⚠️ EARNINGS RISK: Reporting in 10 days! No swing trades recommended due to binary volatility.'
    },
    structure4H: 'RANGE_CONSOLIDATION',
    structureSummary: 'Consolidating between $415 and $430 ahead of quarterly earnings report.',
    smcLevels: {
      orderBlock: { type: 'BULLISH', top: 418.00, bottom: 412.00 },
      fvg: { type: 'NONE', top: 0, bottom: 0 },
      poc: 421.50,
      vah: 428.00,
      val: 415.00
    },
    optionsSentiment: {
      putCallRatio: 0.88,
      maxPainPrice: 420.00,
      ivRank: 68,
      sentimentBias: 'NEUTRAL'
    },
    relStrengthVsSpy: {
      perf1M: 2.1,
      perf3M: 5.6,
      status: 'IN_LINE',
      rsScore: 7
    },
    scoreBreakdown: {
      structureScore: 9,
      smcVolumeScore: 9,
      relStrengthScore: 7,
      earningsSafetyScore: 2, // Penalized heavily for <14d earnings
      fundamentalsScore: 10,
      valuationScore: 8,
      inst13FOwnershipScore: 10,
      optionsSentimentScore: 7,
      macroAlignmentScore: 4,
      riskRewardScore: 3,
      totalScore: 69
    },
    verdict: 'WAIT',
    verdictReason: 'WAIT / NO SWING TRADE: High binary earnings risk within 10 days. Re-evaluate post-results.',
    confidence: 69,
    tradePlan: {
      direction: 'WAIT',
      entryZone: [412.00, 418.00],
      stopLoss: 402.00,
      takeProfit1: 445.00,
      takeProfit2: 465.00,
      riskRewardRatio: 2.45,
      invalidationTrigger: 'Earnings catalyst may gap past standard stops'
    },
    investmentHorizon: {
      suitability: 'CORE_COMPOUNDER',
      recommendedAllocationPct: 15.0,
      fairValueDCF: 480.00,
      marginOfSafety: 11.9,
      moatRating: 'WIDE_MOAT',
      growthThesis: 'Azure enterprise cloud, Copilot subscription monetization, enterprise cybersecurity dominance.',
      target6M: 475.00
    }
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies Inc.',
    sector: 'Technology',
    industry: 'Enterprise AI & Defense',
    price: 43.60,
    change24h: 5.80,
    marketCap: '$98.5B',
    volume: '65.2M',
    avgVolume: '52.0M',
    peRatio: 98.2,
    pegRatio: 2.80,
    forwardPe: 68.0,
    beta: 2.45,
    institutionalOwnership: 46.2,
    shortInterestPct: 4.80,
    earningsRisk: {
      nextEarningsDate: '2026-11-14',
      daysUntilEarnings: 31,
      hasRiskWarning: false,
      warningText: 'Earnings >30 days away. Clear runway for swing trades.'
    },
    structure4H: 'BULLISH_BOS',
    structureSummary: 'Parabolic Bullish BOS with massive institutional AIP (Artificial Intelligence Platform) demand.',
    smcLevels: {
      orderBlock: { type: 'BULLISH', top: 41.50, bottom: 39.80 },
      fvg: { type: 'BULLISH', top: 42.20, bottom: 40.50 },
      poc: 41.20,
      vah: 44.50,
      val: 38.90
    },
    optionsSentiment: {
      putCallRatio: 0.54,
      maxPainPrice: 40.00,
      ivRank: 55,
      sentimentBias: 'BULLISH_FLOW'
    },
    relStrengthVsSpy: {
      perf1M: 22.4,
      perf3M: 64.2,
      status: 'MARKET_LEADER',
      rsScore: 10
    },
    scoreBreakdown: {
      structureScore: 15,
      smcVolumeScore: 14,
      relStrengthScore: 10,
      earningsSafetyScore: 10,
      fundamentalsScore: 9,
      valuationScore: 4, // High valuation penalty
      inst13FOwnershipScore: 7,
      optionsSentimentScore: 10,
      macroAlignmentScore: 5,
      riskRewardScore: 5,
      totalScore: 89
    },
    verdict: 'STRONG_BUY',
    verdictReason: 'S&P 500 inclusion tailwind, accelerating commercial US revenue growth (+55% YoY), extreme momentum.',
    confidence: 89,
    tradePlan: {
      direction: 'LONG',
      entryZone: [41.20, 42.80],
      stopLoss: 38.90,
      takeProfit1: 49.50,
      takeProfit2: 56.00,
      riskRewardRatio: 3.52,
      recommendedLeverage: 1, // Cash/Options
      invalidationTrigger: '4H candle close below $38.90 FVG base'
    },
    investmentHorizon: {
      suitability: 'HIGH_GROWTH_AI',
      recommendedAllocationPct: 8.0,
      fairValueDCF: 48.00,
      marginOfSafety: 9.1,
      moatRating: 'WIDE_MOAT',
      growthThesis: 'AIP Bootcamp enterprise conversion flywheel, defense ontology network effects.',
      target6M: 58.00
    }
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    price: 231.40,
    change24h: 0.85,
    marketCap: '$3.52T',
    volume: '34.1M',
    avgVolume: '46.0M',
    peRatio: 33.6,
    pegRatio: 2.45,
    forwardPe: 28.9,
    beta: 0.88,
    institutionalOwnership: 61.5,
    shortInterestPct: 0.85,
    earningsRisk: {
      nextEarningsDate: '2026-10-31',
      daysUntilEarnings: 17,
      hasRiskWarning: false,
      warningText: 'Earnings in 17 days. Tight risk management required.'
    },
    structure4H: 'BULLISH_BOS',
    structureSummary: 'Reclaimed 4H Value Area High at $230.50 following Apple Intelligence roll-out.',
    smcLevels: {
      orderBlock: { type: 'BULLISH', top: 228.00, bottom: 225.50 },
      fvg: { type: 'BULLISH', top: 229.50, bottom: 227.00 },
      poc: 228.20,
      vah: 233.00,
      val: 224.50
    },
    optionsSentiment: {
      putCallRatio: 0.76,
      maxPainPrice: 230.00,
      ivRank: 38,
      sentimentBias: 'BULLISH_FLOW'
    },
    relStrengthVsSpy: {
      perf1M: 3.4,
      perf3M: 8.9,
      status: 'IN_LINE',
      rsScore: 8
    },
    scoreBreakdown: {
      structureScore: 13,
      smcVolumeScore: 13,
      relStrengthScore: 8,
      earningsSafetyScore: 8,
      fundamentalsScore: 10,
      valuationScore: 7,
      inst13FOwnershipScore: 9,
      optionsSentimentScore: 8,
      macroAlignmentScore: 4,
      riskRewardScore: 4,
      totalScore: 84
    },
    verdict: 'BUY',
    verdictReason: 'Apple Intelligence upgrade cycle, $100B annual buyback support, high free cash flow conversion.',
    confidence: 84,
    tradePlan: {
      direction: 'LONG',
      entryZone: [228.00, 230.50],
      stopLoss: 224.20,
      takeProfit1: 242.00,
      takeProfit2: 255.00,
      riskRewardRatio: 3.10,
      invalidationTrigger: '4H candle breakdown below $224.20 SSL'
    },
    investmentHorizon: {
      suitability: 'CORE_COMPOUNDER',
      recommendedAllocationPct: 15.0,
      fairValueDCF: 250.00,
      marginOfSafety: 7.4,
      moatRating: 'WIDE_MOAT',
      growthThesis: '2.2 billion active device installed base, high-margin Services revenue expansion (+14% YoY).',
      target6M: 260.00
    }
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Consumer Discretionary',
    industry: 'EV & Autonomous AI',
    price: 218.80,
    change24h: -2.40,
    marketCap: '$698.0B',
    volume: '62.5M',
    avgVolume: '68.0M',
    peRatio: 64.2,
    pegRatio: 4.10,
    forwardPe: 52.0,
    beta: 2.35,
    institutionalOwnership: 44.2,
    shortInterestPct: 3.40,
    earningsRisk: {
      nextEarningsDate: '2026-10-23',
      daysUntilEarnings: 9,
      hasRiskWarning: true,
      warningText: '⚠️ EARNINGS RISK: Reporting in 9 days! High event risk on automotive gross margins.'
    },
    structure4H: 'BEARISH_BOS',
    structureSummary: '4H Lower Low printed post-Robotaxi presentation selloff. Testing support at $215.',
    smcLevels: {
      orderBlock: { type: 'BEARISH', top: 232.00, bottom: 226.00 },
      fvg: { type: 'BEARISH', top: 235.00, bottom: 228.00 },
      poc: 224.00,
      vah: 240.00,
      val: 212.00
    },
    optionsSentiment: {
      putCallRatio: 1.15,
      maxPainPrice: 220.00,
      ivRank: 75,
      sentimentBias: 'BEARISH_FLOW'
    },
    relStrengthVsSpy: {
      perf1M: -6.2,
      perf3M: -4.5,
      status: 'LAGGARD',
      rsScore: 3
    },
    scoreBreakdown: {
      structureScore: 5,
      smcVolumeScore: 6,
      relStrengthScore: 3,
      earningsSafetyScore: 1, // Severe penalty for <10d earnings
      fundamentalsScore: 6,
      valuationScore: 4,
      inst13FOwnershipScore: 6,
      optionsSentimentScore: 4,
      macroAlignmentScore: 3,
      riskRewardScore: 3,
      totalScore: 41
    },
    verdict: 'WAIT',
    verdictReason: 'WAIT / NO TRADE: Bearish structure combined with high-risk earnings in 9 days. Do not front-run.',
    confidence: 41,
    tradePlan: {
      direction: 'WAIT',
      entryZone: [205.00, 212.00],
      stopLoss: 198.00,
      takeProfit1: 235.00,
      takeProfit2: 255.00,
      riskRewardRatio: 2.10,
      invalidationTrigger: 'Wait for post-earnings reclaim of $232 with heavy volume'
    },
    investmentHorizon: {
      suitability: 'ASYMMETRIC_RISK',
      recommendedAllocationPct: 5.0,
      fairValueDCF: 225.00,
      marginOfSafety: 2.7,
      moatRating: 'NARROW_MOAT',
      growthThesis: 'Full Self-Driving (FSD) v13 commercial rollout, Cybercab autonomous scaling, Megapack energy storage.',
      target6M: 265.00
    }
  },
  {
    ticker: 'LLY',
    name: 'Eli Lilly and Company',
    sector: 'Healthcare',
    industry: 'Pharmaceuticals & Weight Loss',
    price: 914.50,
    change24h: 2.10,
    marketCap: '$868.0B',
    volume: '2.8M',
    avgVolume: '3.2M',
    peRatio: 62.5,
    pegRatio: 1.45,
    forwardPe: 41.2,
    beta: 0.65,
    institutionalOwnership: 82.5,
    shortInterestPct: 0.68,
    earningsRisk: {
      nextEarningsDate: '2026-10-30',
      daysUntilEarnings: 16,
      hasRiskWarning: false,
      warningText: 'Earnings in 16 days. Safe for disciplined swing target.'
    },
    structure4H: 'BULLISH_BOS',
    structureSummary: 'Bullish continuation with high institutional accumulation above $900 psychological barrier.',
    smcLevels: {
      orderBlock: { type: 'BULLISH', top: 902.00, bottom: 888.00 },
      fvg: { type: 'BULLISH', top: 908.00, bottom: 894.00 },
      poc: 904.00,
      vah: 928.00,
      val: 885.00
    },
    optionsSentiment: {
      putCallRatio: 0.68,
      maxPainPrice: 900.00,
      ivRank: 44,
      sentimentBias: 'BULLISH_FLOW'
    },
    relStrengthVsSpy: {
      perf1M: 6.8,
      perf3M: 14.5,
      status: 'MARKET_LEADER',
      rsScore: 9
    },
    scoreBreakdown: {
      structureScore: 14,
      smcVolumeScore: 14,
      relStrengthScore: 9,
      earningsSafetyScore: 8,
      fundamentalsScore: 10,
      valuationScore: 7,
      inst13FOwnershipScore: 10,
      optionsSentimentScore: 9,
      macroAlignmentScore: 5,
      riskRewardScore: 4,
      totalScore: 90
    },
    verdict: 'STRONG_BUY',
    verdictReason: 'Unprecedented GLP-1 (Mounjaro/Zepbound) drug demand, massive manufacturing expansion.',
    confidence: 90,
    tradePlan: {
      direction: 'LONG',
      entryZone: [898.00, 912.00],
      stopLoss: 882.00,
      takeProfit1: 965.00,
      takeProfit2: 1020.00,
      riskRewardRatio: 3.25,
      invalidationTrigger: '4H candle close below $882 swing support'
    },
    investmentHorizon: {
      suitability: 'CORE_COMPOUNDER',
      recommendedAllocationPct: 10.0,
      fairValueDCF: 1050.00,
      marginOfSafety: 12.9,
      moatRating: 'WIDE_MOAT',
      growthThesis: 'Dominant duopoly in obesity therapeutics, expanding cardiovascular and sleep apnea label indications.',
      target6M: 1080.00
    }
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    industry: 'Diversified Banking',
    price: 222.40,
    change24h: 1.20,
    marketCap: '$635.0B',
    volume: '8.4M',
    avgVolume: '9.2M',
    peRatio: 12.8,
    pegRatio: 1.35,
    forwardPe: 12.1,
    beta: 1.05,
    institutionalOwnership: 71.0,
    shortInterestPct: 0.92,
    earningsRisk: {
      nextEarningsDate: '2027-01-15',
      daysUntilEarnings: 93,
      hasRiskWarning: false,
      warningText: 'Just reported blowout earnings. Zero earnings risk for next 90 days.'
    },
    structure4H: 'BULLISH_BOS',
    structureSummary: 'All-time high expansion following record net interest income (NII) and investment banking fees.',
    smcLevels: {
      orderBlock: { type: 'BULLISH', top: 218.00, bottom: 214.50 },
      fvg: { type: 'BULLISH', top: 220.00, bottom: 216.50 },
      poc: 217.50,
      vah: 225.00,
      val: 213.00
    },
    optionsSentiment: {
      putCallRatio: 0.65,
      maxPainPrice: 217.50,
      ivRank: 26,
      sentimentBias: 'BULLISH_FLOW'
    },
    relStrengthVsSpy: {
      perf1M: 5.2,
      perf3M: 11.8,
      status: 'MARKET_LEADER',
      rsScore: 9
    },
    scoreBreakdown: {
      structureScore: 14,
      smcVolumeScore: 13,
      relStrengthScore: 9,
      earningsSafetyScore: 10,
      fundamentalsScore: 10,
      valuationScore: 9,
      inst13FOwnershipScore: 9,
      optionsSentimentScore: 8,
      macroAlignmentScore: 4,
      riskRewardScore: 5,
      totalScore: 91
    },
    verdict: 'STRONG_BUY',
    verdictReason: 'Fortress balance sheet, cheap P/E multiple (12.8x), safe dividend yield (2.2%), zero earnings risk.',
    confidence: 91,
    tradePlan: {
      direction: 'LONG',
      entryZone: [217.00, 221.00],
      stopLoss: 212.80,
      takeProfit1: 236.00,
      takeProfit2: 248.00,
      riskRewardRatio: 3.40,
      invalidationTrigger: '4H candle breakdown below $212.80'
    },
    investmentHorizon: {
      suitability: 'VALUE_DIVIDEND',
      recommendedAllocationPct: 15.0,
      fairValueDCF: 255.00,
      marginOfSafety: 12.8,
      moatRating: 'WIDE_MOAT',
      growthThesis: 'Unrivaled corporate cash management, market share gains in advisory, strong capital return via dividends.',
      target6M: 255.00
    }
  }
];

export const CURRENT_MACRO_REGIME: MacroRegimeState = {
  sp500Status: 'BULLISH_TREND',
  nasdaqStatus: 'BULLISH_EXPANSION',
  vixLevel: 14.85,
  vixRegime: 'LOW_VOLATILITY_COMPLACENT',
  us10YYield: 4.08,
  dxyIndex: 102.45,
  marketRegimeVerdict: 'RISK-ON EQUITIES: VIX subdued under 15, S&P 500 trading above 20-day EMA, favourable liquidity conditions for high-conviction 4H swing positions.'
};

export class UsaStockScannerService {
  private static instance: UsaStockScannerService;
  private stocks: UsaStockProfile[] = INITIAL_USA_STOCKS;
  private regime: MacroRegimeState = CURRENT_MACRO_REGIME;

  public static getInstance(): UsaStockScannerService {
    if (!UsaStockScannerService.instance) {
      UsaStockScannerService.instance = new UsaStockScannerService();
    }
    return UsaStockScannerService.instance;
  }

  public getStocks(): UsaStockProfile[] {
    return this.stocks;
  }

  public getMacroRegime(): MacroRegimeState {
    return this.regime;
  }

  public getTopSwingPicks(): UsaStockProfile[] {
    return [...this.stocks]
      .filter(s => (s.verdict === 'STRONG_BUY' || s.verdict === 'BUY') && !s.earningsRisk.hasRiskWarning)
      .sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);
  }

  public getSingleBestStock(): UsaStockProfile {
    return this.getTopSwingPicks()[0] || this.stocks[0];
  }
}

export const usaStockService = UsaStockScannerService.getInstance();
