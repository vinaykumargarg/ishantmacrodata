/* ==========================================================================
   GLOBAL SCORE — INSTITUTIONAL STOCK INVESTMENT & RESEARCH ENGINE
   Professional 4–6 Month Investment Research Database & Scoring System
   Covers India (Nifty 50, Next 50, Mid/Small, Sectors) & USA (S&P 500, Nasdaq, Russell)
   ========================================================================== */

export type CountryUniverse = 'INDIA' | 'USA';
export type CapTier = 'Large-Cap' | 'Mid-Cap' | 'Small-Cap';
export type SignalType = 'BUY' | 'ACCUMULATE' | 'HOLD' | 'WAIT' | 'AVOID' | 'SELL';
export type SectorRank = 'STRONG' | 'NEUTRAL' | 'WEAK';
export type ValuationLabel = 'UNDERVALUED' | 'FAIRLY VALUED' | 'OVERVALUED' | 'EXTREMELY OVERVALUED';
export type QualityRating = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK';

export interface ScoreBreakdown {
  fundamentalQuality: number; // Max 20
  earningsGrowth: number;     // Max 15
  valuation: number;          // Max 15
  technicalStructure: number; // Max 15
  macroEnvironment: number;   // Max 15
  sectorStrength: number;     // Max 10
  flowSentiment: number;      // Max 5
  riskCatalyst: number;       // Max 5
  totalScore: number;         // Max 100
  momentumScore: number;      // 0-100 auxiliary
  riskScore: number;          // 0-100 auxiliary (lower risk = higher score or risk metric)
}

export interface EntryEnginePlan {
  currentPrice: number;
  entryZone: {
    primary: string;
    secondaryDip: string;
    range: string;
  };
  stopLoss: {
    price: number;
    formatted: string;
    pct: number;
    structuralLevel: string;
  };
  target1: {
    price: number;
    formatted: string;
    expectedReturnPct: number;
    timeframe: string;
    rationale: string;
  };
  target2: {
    price: number;
    formatted: string;
    expectedReturnPct: number;
    timeframe: string;
    rationale: string;
  };
  target3: {
    price: number;
    formatted: string;
    expectedReturnPct: number;
    timeframe: string;
    rationale: string;
  };
  riskPct: number;
  expectedReturnPct: number; // Based on Target 2 (Base case 4-6M)
  riskRewardRatio: string;
  confidenceScore: number;   // 0-100%
  holdingHorizon: '4–6 Months';
  invalidationConditions: string[];
  investmentThesis: string;
}

export interface NewsItem {
  headline: string;
  fact: string;
  marketInterpretation: string;
  speculation: string;
  date: string;
}

export interface ResearchAZ {
  // A — BUSINESS
  business: {
    summary: string;
    revenueSources: { segment: string; sharePct: number }[];
    mainProducts: string[];
    domesticVsIntl: string;
    coreAdvantage: string;
  };
  // B — BUSINESS MODEL
  businessModel: {
    description: string;
    recurringVsCyclical: string;
    customerConcentration: string;
    pricingPower: string;
  };
  // C — COMPETITIVE ADVANTAGE
  competitiveAdvantage: {
    moat: string;
    brandStrength: string;
    technology: string;
    distribution: string;
    costAdvantage: string;
    networkEffects: string;
    marketShare: string;
  };
  // D — DEBT
  debt: {
    totalDebt: string;
    netDebt: string;
    debtToEquity: number;
    interestCoverage: string;
    maturityProfile: string;
    refinancingRisk: 'Low' | 'Moderate' | 'High';
  };
  // E — EARNINGS
  earnings: {
    revenue: string;
    ebitda: string;
    ebit: string;
    netProfit: string;
    eps: string;
    operatingMargin: string;
    netMargin: string;
    earningsGrowthYoY: string;
    latestQuarterBeat: 'BEAT' | 'IN-LINE' | 'MISS';
    earningsDate: string;
  };
  // F — FREE CASH FLOW
  freeCashFlow: {
    operatingCashFlow: string;
    capex: string;
    freeCashFlow: string;
    fcfConversion: string;
    quality: string;
  };
  // G — GROWTH
  growth: {
    historical3yCAGR: string;
    expectedForwardGrowth: string;
    tam: string;
    expansionVectors: string[];
    capacityExpansion: string;
  };
  // H — HOLDINGS
  holdings: {
    promoterOrInsiders: string;
    institutionalOwnership: string;
    fiiOrForeignHoldings: string;
    diiOrMutualFunds: string;
    retailOwnership: string;
    recentTrend: string;
  };
  // I — INSIDER / INSTITUTIONAL ACTIVITY
  insiderActivity: {
    insiderTrend: 'Accumulating' | 'Neutral' | 'Distributing';
    institutionalTrend: 'Aggressive Accumulation' | 'Net Inflows' | 'Neutral' | 'Trimming';
    recentDeals: string;
  };
  // J — JUDGEMENT
  judgement: {
    verdict: string;
    evidenceSummary: string;
    convictionLevel: 'High Conviction' | 'Selective Conviction' | 'Speculative' | 'Unfavourable';
  };
  // K — KEY RISKS
  keyRisks: string[];
  // L — LIQUIDITY
  liquidity: {
    dailyVolume: string;
    avgVolume30d: string;
    bidAskSpread: string;
    institutionalTradability: 'High Institutional Liquidity' | 'Moderate Liquidity' | 'Low / Illiquid';
  };
  // M — MACRO SENSITIVITY
  macroSensitivity: {
    interestRates: string;
    currencyFx: string;
    commodityEnergy: string;
    inflationRecession: string;
    liquidityExpansion: string;
  };
  // N — NEWS
  news: NewsItem[];
  // O — ORDER / PRICE STRUCTURE
  orderStructure: {
    demandZones: string;
    supplyZones: string;
    keySupport: string;
    keyResistance: string;
    breakoutLevels: string;
    breakdownLevels: string;
    institutionalVolumeNodes: string;
  };
  // P — PROFITABILITY
  profitability: {
    roe: string;
    roce: string;
    roic: string;
    grossMargin: string;
    operatingMargin: string;
    netMargin: string;
  };
  // Q — QUALITY
  quality: {
    rating: QualityRating;
    justification: string;
  };
  // R — RELATIVE STRENGTH
  relativeStrength: {
    vsBenchmark: string;
    vsSector: string;
    vsPeers: string;
    rsRating: number; // 1-99
  };
  // S — SENTIMENT
  sentiment: {
    analystConsensus: string;
    institutionalStance: string;
    optionsFlowSkew: string;
    retailSentiment: string;
    fiiDiiSentiment: string;
  };
  // T — TECHNICAL SETUP
  technicalSetup: {
    primaryTrend: string;
    structure: string;
    movingAverages: string;
    rsi: number;
    macd: string;
    setupName: string;
  };
  // U — UPSIDE
  upside: {
    calculationBasis: string;
    targetUpsidePct: number;
    bullScenario: string;
    baseScenario: string;
  };
  // V — VALUATION
  valuation: {
    rating: ValuationLabel;
    pe: number;
    sectorPe: number;
    peg: number;
    pb: number;
    evEbitda: number;
    historicalContext: string;
  };
  // W — WHY NOW?
  whyNow: {
    timingRationale: string;
    immediateTrigger: string;
  };
  // X — X-FACTOR
  xFactor: {
    catalyst: string;
    impactPotential: string;
  };
  // Y — YIELD / SHAREHOLDER RETURN
  yieldReturn: {
    dividendYield: string;
    buybackYield: string;
    capitalAllocationScore: string;
    totalReturnForecast: string;
  };
  // Z — FINAL VERDICT
  finalVerdict: {
    signal: SignalType;
    summary: string;
    horizonNote: string;
  };
}

export interface InstitutionalStockRecord {
  id: string;
  symbol: string;
  name: string;
  country: CountryUniverse;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  tickerAlias: string[];
  sector: string;
  industry: string;
  capTier: CapTier;
  index: string;
  currency: 'INR' | 'USD';
  cmp: number;
  change24h: number;
  changePct24h: number;
  high52w: number;
  low52w: number;
  pe: number;
  marketCapStr: string;
  tradingViewSymbol: string;
  scores: ScoreBreakdown;
  entryPlan: EntryEnginePlan;
  azResearch: ResearchAZ;
}

/* ==========================================================================
   MACRO ENVIRONMENT BENCHMARKS (Used by Macro Score & Stock Sensitivities)
   ========================================================================== */
export const GLOBAL_MACRO_SNAPSHOT = {
  india: {
    rbiRepoRate: '6.50%',
    rbiStance: 'Neutral to Accommodative Tilt',
    cpiInflation: '4.85% (Target 4.0%)',
    wpiInflation: '2.10%',
    gdpGrowth: '7.2% YoY (Robust)',
    pmiManufacturing: '58.2 (Strong Expansion)',
    pmiServices: '60.4 (Leading Growth)',
    inrUsd: '85.45',
    crudeBrent: '$73.80 / bbl',
    india10yYield: '6.78%',
    fiiFlowsMonth: '-₹14,200 Cr (Softening Outflows)',
    diiFlowsMonth: '+₹38,450 Cr (Structural SIP Bid)',
    fiscalDeficitTarget: '4.9% of GDP',
    bankCreditGrowth: '14.2% YoY',
    macroEnvironmentScore: 84
  },
  usa: {
    fedFundsRate: '4.25% - 4.50%',
    fedStance: 'Calibrated Easing Cycle',
    usCpi: '2.6% YoY (Cooling)',
    corePce: '2.8% (Fed Target 2.0%)',
    nfpMonthly: '142K (Moderate Normalisation)',
    unemploymentRate: '4.1% (Near Full Employment)',
    gdpGrowth: '2.8% QoQ ann.',
    ismManufacturing: '49.1 (Bottoming)',
    ismServices: '54.9 (Resilient)',
    treasury10y: '4.32%',
    dxyIndex: '103.85',
    creditSpreads: 'Tight / Liquid (High-Yield 320 bps)',
    sp500ForwardPe: '21.4x',
    macroEnvironmentScore: 82
  },
  global: {
    brentCrude: '$73.80',
    goldSpot: '$3,415 / oz',
    vixVol: '14.6 (Low Complacency)',
    globalLiquidityTrend: 'Expanding (+ $2.4T over 6 months)',
    chinaStimulus: 'Monetary + Fiscal Property Floor',
    tradePolicyRisk: 'Moderate / Watchful',
    geopoliticalRisk: 'Medium (Middle East / Red Sea Supply Lines)'
  }
};

/* ==========================================================================
   INSTITUTIONAL STOCK UNIVERSE — 4–6 MONTH TOP OPPORTUNITIES
   Ranked by Final Global Score (0–100)
   ========================================================================== */
export const INSTITUTIONAL_STOCKS: InstitutionalStockRecord[] = [
  // ── 1. NVDA (USA) ────────────────────────────────────────────────────────
  {
    id: 'NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    country: 'USA',
    exchange: 'NASDAQ',
    tickerAlias: ['NVDA', 'Nvidia', 'NASDAQ:NVDA'],
    sector: 'Semiconductors & AI',
    industry: 'Accelerated Compute & Data Centers',
    capTier: 'Large-Cap',
    index: 'S&P 500 / Nasdaq 100',
    currency: 'USD',
    cmp: 138.25,
    change24h: 3.45,
    changePct24h: 2.56,
    high52w: 153.15,
    low52w: 75.60,
    pe: 44.8,
    marketCapStr: '$3.38T',
    tradingViewSymbol: 'NASDAQ:NVDA',
    scores: {
      fundamentalQuality: 19.4, // /20
      earningsGrowth: 14.8,     // /15
      valuation: 11.2,          // /15
      technicalStructure: 14.1, // /15
      macroEnvironment: 13.8,   // /15
      sectorStrength: 9.8,      // /10
      flowSentiment: 4.8,       // /5
      riskCatalyst: 4.6,        // /5
      totalScore: 92.5,
      momentumScore: 94,
      riskScore: 22
    },
    entryPlan: {
      currentPrice: 138.25,
      entryZone: {
        primary: '$132.00 – $137.50',
        secondaryDip: '$126.00 – $129.50',
        range: '$130 – $138'
      },
      stopLoss: {
        price: 122.50,
        formatted: '$122.50',
        pct: -9.8,
        structuralLevel: 'Weekly swing support and 50-day EMA structural pivot'
      },
      target1: {
        price: 155.00,
        formatted: '$155.00',
        expectedReturnPct: 12.1,
        timeframe: '1–2 Months',
        rationale: 'Retest of previous all-time high resistance cluster'
      },
      target2: {
        price: 175.00,
        formatted: '$175.00',
        expectedReturnPct: 26.6,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: Blackwell architecture ramp and hyperscaler capex delivery'
      },
      target3: {
        price: 195.00,
        formatted: '$195.00',
        expectedReturnPct: 41.0,
        timeframe: '6+ Months',
        rationale: 'Blue-sky expansion on sovereign AI and enterprise enterprise deployments'
      },
      riskPct: 9.8,
      expectedReturnPct: 26.6,
      riskRewardRatio: '2.71 : 1',
      confidenceScore: 89,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below $122.00 confirming structural lower low breakdown',
        'Hyperscaler aggregate AI capex guidance revisions turning negative by > 10%',
        'Major supply chain failure or packaging bottleneck on GB200 racks'
      ],
      investmentThesis: 'Blackwell GPU architecture ramp backed by $250B+ combined capex commitments from Microsoft, Google, Meta, and Amazon. Gross margins sustained near 74% with zero viable enterprise silicon competitors matching CUDA ecosystem lock-in.'
    },
    azResearch: {
      business: {
        summary: 'NVIDIA pioneered GPU-accelerated computing and has evolved into the sovereign full-stack compute architecture provider for global artificial intelligence, data centers, robotics, and high-performance computing.',
        revenueSources: [
          { segment: 'Compute & Data Center', sharePct: 87.5 },
          { segment: 'Gaming & Creators', sharePct: 8.2 },
          { segment: 'Professional Visualization', sharePct: 2.4 },
          { segment: 'Automotive & Robotics', sharePct: 1.9 }
        ],
        mainProducts: ['Blackwell B200 / GB200 NVL72', 'Hopper H100 / H200 GPUs', 'Quantum InfiniBand & Spectrum-X Ethernet', 'CUDA Software Platform'],
        domesticVsIntl: 'USA 48%, Asia-Pacific (ex-China) 34%, Europe 12%, Other 6%',
        coreAdvantage: 'Proprietary CUDA parallel computing platform with 5+ million developers create unbreakable software switching costs.'
      },
      businessModel: {
        description: 'Fabless chip and compute systems designer monetizing complete high-margin accelerated hardware racks, networking interconnects, and AI Enterprise software subscriptions.',
        recurringVsCyclical: 'Hardware delivery follows cloud capex investment waves, but CUDA software layer and data center networking provide high retention.',
        customerConcentration: 'Top 4 hyperscalers account for ~42% of revenue; enterprise and sovereign AI pipelines are aggressively diversifying this base.',
        pricingPower: 'Extreme pricing power. Gross margins maintained at 73–75% despite cutting-edge TSMC CoWoS packaging price increases.'
      },
      competitiveAdvantage: {
        moat: 'Monopolistic software moat (CUDA) and rack-level systems architecture (GB200 NVL72 with NVLink switch mesh).',
        brandStrength: 'Gold standard enterprise computing brand globally.',
        technology: '2+ generation architectural lead in AI model training and inference throughput.',
        distribution: 'Direct OEM tier-1 partnerships with Foxconn, Quanta, Supermicro, Dell, HP, plus direct tier-1 cloud relationships.',
        costAdvantage: 'Largest volume buyer of TSMC 4NP and advanced CoWoS packaging, securing lowest unit fabrication economics.',
        networkEffects: 'Universities, researchers, and enterprises build AI libraries natively in CUDA, reinforcing adoption.',
        marketShare: '> 88% share of AI data center accelerator silicon.'
      },
      debt: {
        totalDebt: '$8.46B',
        netDebt: '-$26.3B (Net Cash Positive)',
        debtToEquity: 0.12,
        interestCoverage: '98.5x (Bulletproof)',
        maturityProfile: 'Well staggered debt with minimal near-term redemptions.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '$130.5B (TTM)',
        ebitda: '$84.2B',
        ebit: '$81.4B',
        netProfit: '$69.8B',
        eps: '$2.82',
        operatingMargin: '62.4%',
        netMargin: '53.5%',
        earningsGrowthYoY: '+122% YoY',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'May 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '$72.1B',
        capex: '$3.4B (Asset-light fabless model)',
        freeCashFlow: '$68.7B',
        fcfConversion: '98.4% of net profit',
        quality: 'Top 0.1% cash generation efficiency globally.'
      },
      growth: {
        historical3yCAGR: '78.4%',
        expectedForwardGrowth: '34–40% forward 2-year CAGR',
        tam: '$1.0 Trillion annual global data center modernization TAM by 2029',
        expansionVectors: ['Enterprise on-prem AI', 'Sovereign nation AI superclusters', 'Humanoid robotics & autonomous driving compute (Thor)'],
        capacityExpansion: 'TSMC CoWoS capacity allocation expanded by 130% for Blackwell production.'
      },
      holdings: {
        promoterOrInsiders: 'Jensen Huang & management: 3.8% (~$128B economic stake)',
        institutionalOwnership: '67.4%',
        fiiOrForeignHoldings: 'Broad institutional presence across global wealth managers',
        diiOrMutualFunds: 'Core overweight across Vanguard, BlackRock, State Street, Fidelity',
        retailOwnership: '28.8%',
        recentTrend: 'Institutional holding stable with long-term accumulation on pullbacks.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Aggressive Accumulation',
        recentDeals: 'Scheduled Rule 10b5-1 executive diversification plans completed with zero discretionary selling.'
      },
      judgement: {
        verdict: 'Top-tier core institutional buy for 4–6 month horizon. Pullbacks to $130–$135 represent prime accumulation zones ahead of full-volume Blackwell datacenter deliveries.',
        evidenceSummary: 'Unsurpassed fundamentals, net-cash balance sheet, 74% gross margins, and unmatched software ecosystem moat.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'Geopolitical export restrictions expanding to Middle East or Southeast Asia intermediary hubs',
        'TSMC Taiwan fab concentration risk',
        'Hyperscaler transition to custom internal ASICs (Google TPU, AWS Trainium) for specific inference workloads',
        'Temporary datacenter power and cooling grid interconnection delays in US and Europe'
      ],
      liquidity: {
        dailyVolume: '$28.4 Billion / day',
        avgVolume30d: '46M shares',
        bidAskSpread: '0.01% (Toughest institutional liquidity in the world)',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Neutral to slightly positive; net cash position earns interest while enterprise capex is driven by tech arms race.',
        currencyFx: 'Strong USD slightly compresses European/Asian software margins but hardware demand is non-elastic.',
        commodityEnergy: 'Higher electricity prices drive data centers to buy NVIDIA for energy efficiency per token.',
        inflationRecession: 'Low sensitivity; AI infrastructure budgets are prioritized even during general enterprise cost-cutting.',
        liquidityExpansion: 'Strong positive beta to global M2 expansion.'
      },
      news: [
        {
          headline: 'Blackwell GB200 Ultra Servers Enter Full-Scale Mass Shipment to Tier-1 Hyperscalers',
          fact: 'Foxconn and Quanta confirmed shipments started on schedule in Q1.',
          marketInterpretation: 'Dispels market speculation over packaging delay and heat dissipation issues.',
          speculation: 'Some hedge funds speculated earlier on minor packaging tweaks.',
          date: 'Recent'
        },
        {
          headline: 'Sovereign AI Deals in Middle East & Japan Surpass $12B In Multi-Year Commitments',
          fact: 'State-backed national computing centers signed multi-thousand GPU deployment contracts.',
          marketInterpretation: 'Extends growth runway beyond private hyperscalers into sovereign national infrastructure.',
          speculation: 'Expectation of sovereign spending doubling over 24 months.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '$126.00 – $132.50 institutional absorption floor',
        supplyZones: '$148.00 – $153.50 all-time high liquidity pool',
        keySupport: '$128.50 (50-day EMA) / $118.00 (200-day EMA)',
        keyResistance: '$145.00 / $153.15',
        breakoutLevels: '$153.50 opens rapid path to $175.00',
        breakdownLevels: 'Below $122.00 triggers structural defensive shift',
        institutionalVolumeNodes: 'Point of Control (POC) established at $134.20'
      },
      profitability: {
        roe: '115.4%',
        roce: '94.2%',
        roic: '86.8%',
        grossMargin: '74.8%',
        operatingMargin: '62.4%',
        netMargin: '53.5%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'Class-leading margins, zero net debt, unmatched software moat and dominant market share.'
      },
      relativeStrength: {
        vsBenchmark: '+38% outperformance vs S&P 500 over past 12 months',
        vsSector: '+18% outperformance vs SOXX semiconductor ETF',
        vsPeers: 'Leads AMD and Intel across all efficiency, margin and revenue growth metrics',
        rsRating: 94
      },
      sentiment: {
        analystConsensus: '88% Strong Buy / 12% Hold / 0% Sell (Mean Price Target: $168.00)',
        institutionalStance: 'Core portfolio anchor holding',
        optionsFlowSkew: 'Bullish call flow concentrated in 3–6 month $150 and $170 strikes',
        retailSentiment: 'Positive but stabilized; no speculative retail froth compared to early 2024',
        fiiDiiSentiment: 'Sovereign wealth funds actively accumulating'
      },
      technicalSetup: {
        primaryTrend: 'Uptrend consolidating in a clean ascending base above the 50-day EMA',
        structure: 'Higher highs and higher lows on weekly timeframe; volatility compression prior to breakout',
        movingAverages: 'Price above 20-day ($135.20), 50-day ($129.80) and 200-day ($112.40) EMAs',
        rsi: 58.4,
        macd: 'Positive momentum histogram expanding above signal line',
        setupName: 'Ascending Consolidation Base with Volume Dry-Up'
      },
      upside: {
        calculationBasis: 'FY26 projected EPS of $4.10 @ 42x forward P/E multiple supported by Blackwell ramp',
        targetUpsidePct: 26.6,
        bullScenario: '$195.00 (+41.0%) if sovereign AI acceleration outpaces guidance',
        baseScenario: '$175.00 (+26.6%) on base hyperscaler delivery timeline'
      },
      valuation: {
        rating: 'FAIRLY VALUED',
        pe: 44.8,
        sectorPe: 34.2,
        peg: 1.18,
        pb: 42.1,
        evEbitda: 36.4,
        historicalContext: 'Trading at lower forward PEG (1.18x) than Apple or Microsoft due to triple-digit net profit growth.'
      },
      whyNow: {
        timingRationale: 'Blackwell rack architecture is transitioning from sample test units to full multi-thousand server farm deliveries. Historical cycles show NVIDIA delivers strongest re-rating during the first 6 months of new architecture mass shipping.',
        immediateTrigger: 'Supply bottlenecks resolved at TSMC packaging plants; Q2/Q3 guidance anticipated to beat consensus.'
      },
      xFactor: {
        catalyst: 'Enterprise & Sovereign AI revenue expanding from 10% to 25% of total mix, broadening client base beyond US big-tech.',
        impactPotential: 'Provides multiple expansion and eliminates customer concentration discount.'
      },
      yieldReturn: {
        dividendYield: '0.08% ($0.04/yr)',
        buybackYield: '1.8% ($50B active repurchase authorization)',
        capitalAllocationScore: 'A+ (Reinvests internally at 86% ROIC, returns excess cash via buybacks)',
        totalReturnForecast: '+28% to +35% total shareholder return over 4–6 months'
      },
      finalVerdict: {
        signal: 'BUY',
        summary: 'Pristine 4–6 month institutional investment setup. Accumulate in the $130–$138 primary entry zone with strict risk invalidation at $122.50.',
        horizonNote: 'Optimal holding period: 4–6 months through Blackwell server deployments.'
      }
    }
  },

  // ── 2. HDFCBANK (INDIA) ──────────────────────────────────────────────────
  {
    id: 'HDFCBANK',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    country: 'INDIA',
    exchange: 'NSE',
    tickerAlias: ['HDFCBANK', 'HDFC Bank', 'NSE:HDFCBANK', 'BSE:500180'],
    sector: 'Banking & Financials',
    industry: 'Private Commercial Banking & Financial Conglomerate',
    capTier: 'Large-Cap',
    index: 'NIFTY 50 / NIFTY Bank',
    currency: 'INR',
    cmp: 1782.40,
    change24h: 18.60,
    changePct24h: 1.05,
    high52w: 1845.00,
    low52w: 1363.55,
    pe: 18.2,
    marketCapStr: '₹13.58 Lakh Cr',
    tradingViewSymbol: 'NSE:HDFCBANK',
    scores: {
      fundamentalQuality: 18.9, // /20
      earningsGrowth: 13.5,     // /15
      valuation: 14.4,          // /15 (Historically cheap!)
      technicalStructure: 13.8, // /15
      macroEnvironment: 14.2,   // /15
      sectorStrength: 8.9,      // /10
      flowSentiment: 4.6,       // /5
      riskCatalyst: 4.5,        // /5
      totalScore: 92.8,
      momentumScore: 88,
      riskScore: 18
    },
    entryPlan: {
      currentPrice: 1782.40,
      entryZone: {
        primary: '₹1,740 – ₹1,785',
        secondaryDip: '₹1,690 – ₹1,720',
        range: '₹1,710 – ₹1,785'
      },
      stopLoss: {
        price: 1640.00,
        formatted: '₹1,640.00',
        pct: -8.0,
        structuralLevel: 'Key multi-month breakout retest zone and 200-day EMA support'
      },
      target1: {
        price: 1950.00,
        formatted: '₹1,950.00',
        expectedReturnPct: 9.4,
        timeframe: '1–2 Months',
        rationale: 'Breakout above 52-week high resistance'
      },
      target2: {
        price: 2180.00,
        formatted: '₹2,180.00',
        expectedReturnPct: 22.3,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: LDR normalization, NIM expansion to 3.65% and MSCI weight inflow completion'
      },
      target3: {
        price: 2400.00,
        formatted: '₹2,400.00',
        expectedReturnPct: 34.6,
        timeframe: '6–9 Months',
        rationale: 'Reversion to historical 5-year mean P/BV multiple of 3.2x'
      },
      riskPct: 8.0,
      expectedReturnPct: 22.3,
      riskRewardRatio: '2.79 : 1',
      confidenceScore: 91,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below ₹1,630 invalidating the post-merger multi-quarter rounding bottom structure',
        'Gross NPA rising above 1.55% or Net Interest Margin falling below 3.35%',
        'Deposit growth falling below 12% YoY indicating severe funding friction'
      ],
      investmentThesis: 'India’s premier private lender has digested the mega-merger with HDFC Ltd. Credit-deposit ratio is normalizing towards 90%, deposit growth is outpacing industry at 15.5% YoY, and valuation is near a 10-year low at ~2.3x FY26E P/BV vs historical 3.4x average.'
    },
    azResearch: {
      business: {
        summary: 'Largest private sector bank in India with over 8,800 branches and 93+ million customers across retail banking, wholesale loans, treasury, credit cards, mortgages, and insurance subsidiaries.',
        revenueSources: [
          { segment: 'Retail & Consumer Banking', sharePct: 48.0 },
          { segment: 'Mortgages & Home Loans', sharePct: 24.5 },
          { segment: 'Wholesale & Corporate Banking', sharePct: 21.0 },
          { segment: 'Treasury & Subsidiaries', sharePct: 6.5 }
        ],
        mainProducts: ['Retail & Corporate Lending', 'Home Loans', 'Current & Savings Accounts (CASA)', 'Credit Cards & Digital Banking'],
        domesticVsIntl: 'India 97%, International Overseas Branches 3%',
        coreAdvantage: 'Unrivaled low-cost CASA deposit franchise, top-tier underwriting standards, and nationwide branch distribution network.'
      },
      businessModel: {
        description: 'Universal banking model generating net interest margin (NIM) on credit spreads and high recurring non-interest fee income from transactions, wealth management, and credit cards.',
        recurringVsCyclical: 'High recurring banking operations; stable retail deposit and mortgage repayment streams.',
        customerConcentration: 'Extremely diversified retail and corporate client base with no single borrower concentration risk.',
        pricingPower: 'Dominant corporate and retail brand enables competitive deposit gathering without paying peak interest rates.'
      },
      competitiveAdvantage: {
        moat: 'Widest branch reach among private lenders, CASA ratio of 37.5%, and lowest net NPA ratio (0.33%) across Indian banking.',
        brandStrength: 'Most trusted private banking brand in India.',
        technology: 'PayZapp, SmartHub Vyapar, and core digital lending engine processing loan approvals in seconds.',
        distribution: '8,850+ branches covering semi-urban and rural India.',
        costAdvantage: 'Lower blended cost of funds (4.9%) compared to peers.',
        networkEffects: 'Merchant acquisition networks and corporate salary accounts create sticky self-reinforcing liquidity.',
        marketShare: '16.8% of all Indian banking advances and 13.5% of total deposits.'
      },
      debt: {
        totalDebt: 'Banking Deposits & Borrowings: ₹24.2 Lakh Cr',
        netDebt: 'N/A (Regulated Commercial Bank)',
        debtToEquity: 8.2, // Standard banking leverage
        interestCoverage: 'Comfortable capital adequacy (CAR: 19.8% vs 11.5% regulatory minimum)',
        maturityProfile: 'Well matched Asset-Liability Committee (ALM) framework with zero liquidity mismatch.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '₹1.88 Lakh Cr Net Total Income (TTM)',
        ebitda: 'N/A (Pre-Provision Operating Profit: ₹96,400 Cr)',
        ebit: 'N/A',
        netProfit: '₹68,250 Cr (TTM)',
        eps: '₹89.40',
        operatingMargin: 'Core Cost to Income: 38.8%',
        netMargin: 'RoA: 1.94%',
        earningsGrowthYoY: '+21.4% YoY net profit growth',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'April 2026'
      },
      freeCashFlow: {
        operatingCashFlow: 'Strong core operating cash flow generation before regulatory SLR/CRR allocations.',
        capex: '₹4,800 Cr annual IT, cloud, and branch expansion capex',
        freeCashFlow: 'High capital internal generation to self-fund 15% loan growth without equity dilution',
        fcfConversion: 'CET-1 ratio improving by 35 bps organically every year',
        quality: 'Pristine asset quality with provision coverage ratio (PCR) at 74%.'
      },
      growth: {
        historical3yCAGR: '22.8% (Post-merger expansion)',
        expectedForwardGrowth: '14–17% loan growth CAGR over 2026–2028',
        tam: 'India credit-to-GDP is only 58% vs 175% in USA/China; multi-decade domestic credit expansion',
        expansionVectors: ['Semi-urban & rural branch cross-selling', 'HDFC mortgage cross-sell to 70M un-mortgaged customers', 'SME & Agri credit expansion'],
        capacityExpansion: 'Adding 800–1,000 new branches annually.'
      },
      holdings: {
        promoterOrInsiders: '0.0% (Professionally managed institutional board; zero promoter debt/pledge)',
        institutionalOwnership: '78.4%',
        fiiOrForeignHoldings: '48.2% (FII headroom increased, driving MSCI weight doubling)',
        diiOrMutualFunds: '32.1% (Mutual funds largest domestic institutional anchor)',
        retailOwnership: '19.7%',
        recentTrend: 'FIIs aggressively buying after MSCI weight increase clarity.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Aggressive Accumulation',
        recentDeals: 'Domestic MFs bought ₹4,200 Cr in recent quarter dips.'
      },
      judgement: {
        verdict: 'Highest conviction large-cap investment in India for 4–6 months. Valuation multiple compression post-merger has concluded, setting up a sharp institutional catch-up rally.',
        evidenceSummary: 'Best-in-class asset quality (GNPA 1.24%, NNPA 0.33%), RoA near 2.0%, and forward P/BV of only 2.3x against 10-year average of 3.4x.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'Prolonged deposit war in India keeping deposit rates elevated for an extra 1–2 quarters',
        'Potential RBI tightening of unsecured personal loan risk weights',
        'Slower than expected mortgage cross-selling conversion in former HDFC branches'
      ],
      liquidity: {
        dailyVolume: '₹2,400 Cr / day on NSE/BSE',
        avgVolume30d: '14.8M shares',
        bidAskSpread: '0.02% (Most liquid stock in Indian equities)',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Benefits from RBI repo rate cuts as deposit costs reprice down faster than fixed-rate retail assets.',
        currencyFx: 'Low direct sensitivity to INR/USD volatility.',
        commodityEnergy: 'Lower crude oil keeps Indian inflation subdued, accelerating RBI rate cuts and credit expansion.',
        inflationRecession: 'Low sensitivity; secured mortgages and prime retail clients protect asset quality.',
        liquidityExpansion: 'Direct beneficiary of systemic banking liquidity surplus.'
      },
      news: [
        {
          headline: 'HDFC Bank Deposits Surge 15.8% YoY in Latest Quarter, Outpacing Industry by 350 Bps',
          fact: 'Bank reported ₹24.5 Lakh Cr in total deposits with CASA stabilizing at 37.8%.',
          marketInterpretation: 'Proves the bank is resolving its post-merger credit-to-deposit ratio ahead of schedule.',
          speculation: 'Analysts expect LDR to drop below 90% by end of FY26.',
          date: 'Recent'
        },
        {
          headline: 'MSCI Completes Second Tranche of HDFC Bank Weight Increase with $1.8B Inflows',
          fact: 'Passive institutional benchmark tracking funds completed secondary weight rebalancing.',
          marketInterpretation: 'Removes the multi-quarter foreign institutional supply overhang.',
          speculation: 'Further incremental weight additions expected if foreign headroom widens above 20%.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '₹1,710 – ₹1,750 high volume accumulation node',
        supplyZones: '₹1,840 – ₹1,880 supply barrier',
        keySupport: '₹1,720 (50-day EMA) / ₹1,640 (200-day EMA)',
        keyResistance: '₹1,820 / ₹1,850',
        breakoutLevels: 'Sustained close above ₹1,850 triggers rapid expansion to ₹2,100+',
        breakdownLevels: 'Below ₹1,630 breaks bullish structural foundation',
        institutionalVolumeNodes: 'Major institutional absorption POC at ₹1,745'
      },
      profitability: {
        roe: '16.4%',
        roce: '17.2%',
        roic: '15.8%',
        grossMargin: 'NIM: 3.55% (Targeting 3.70%)',
        operatingMargin: 'Cost/Income: 38.8%',
        netMargin: 'RoA: 1.94%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'Gold standard Indian commercial banking institution with lowest credit loss history over 30 years.'
      },
      relativeStrength: {
        vsBenchmark: '+6.2% outperformance vs NIFTY 50 over last 3 months',
        vsSector: 'Reclaiming sector leadership from ICICI and SBI',
        vsPeers: 'Valuation gap vs ICICI Bank at historical high discount, creating attractive mean-reversion setup',
        rsRating: 86
      },
      sentiment: {
        analystConsensus: '92% Buy / 8% Hold / 0% Sell (Average Target: ₹2,120)',
        institutionalStance: 'Must-own core holding for emerging market asset allocators',
        optionsFlowSkew: 'Bullish call accumulation at ₹1,800 and ₹1,900 monthly strikes',
        retailSentiment: 'Cautiously optimistic following long post-merger consolidation',
        fiiDiiSentiment: 'DIIs steadily adding ₹500–₹800 Cr every week on dips'
      },
      technicalSetup: {
        primaryTrend: 'Multi-month inverse head-and-shoulders / cup-and-handle pattern breaking out on weekly chart',
        structure: 'Weekly MACD bullish crossover with rising RSI and strong delivery volume (> 58%)',
        movingAverages: 'Trading above 20-day, 50-day and 200-day simple and exponential moving averages',
        rsi: 61.2,
        macd: 'Strong bullish momentum histogram above centerline',
        setupName: 'Multi-Month Base Breakout & Retest'
      },
      upside: {
        calculationBasis: 'FY27E EPS of ₹108 @ 20x P/E multiple or 2.7x P/BV',
        targetUpsidePct: 22.3,
        bullScenario: '₹2,400 (+34.6%) if NIM expands back to 3.8% and credit growth hits 16%',
        baseScenario: '₹2,180 (+22.3%) on base case LDR stabilization'
      },
      valuation: {
        rating: 'UNDERVALUED',
        pe: 18.2,
        sectorPe: 19.4,
        peg: 1.05,
        pb: 2.35,
        evEbitda: 14.1,
        historicalContext: 'Currently trading at 2.35x P/BV compared to historical 5-year average of 3.4x and 10-year average of 3.8x.'
      },
      whyNow: {
        timingRationale: 'The 18-month merger overhang has completely cleared. Foreign shareholding headroom is confirmed, deposit growth is firing, and Nifty Bank needs HDFC Bank to drive the next index leg.',
        immediateTrigger: 'Q4 earnings preview pointing to margin expansion and loan growth pickup.'
      },
      xFactor: {
        catalyst: 'Potential value unlocking from listing HDB Financial Services (NBFC arm) via IPO at ₹70,000+ Cr valuation.',
        impactPotential: 'Delivers ₹10,000–₹14,000 Cr pre-tax windfall gain to HDFC Bank and boosts Tier-1 capital.'
      },
      yieldReturn: {
        dividendYield: '1.25% (₹19.50/share)',
        buybackYield: '0.0%',
        capitalAllocationScore: 'A+ (Reinvests internally at 16.5% ROE)',
        totalReturnForecast: '+23% to +28% total return over 4–6 months'
      },
      finalVerdict: {
        signal: 'BUY',
        summary: 'Exceptional risk-reward opportunity. Accumulate in the ₹1,740 – ₹1,785 zone with target at ₹2,180 (4–6M) and strict stop loss at ₹1,640.',
        horizonNote: 'Prime 4–6 month holding period targeting multiple re-rating.'
      }
    }
  },

  // ── 3. RELIANCE (INDIA) ──────────────────────────────────────────────────
  {
    id: 'RELIANCE',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    country: 'INDIA',
    exchange: 'NSE',
    tickerAlias: ['RELIANCE', 'Reliance Industries', 'NSE:RELIANCE', 'BSE:500325'],
    sector: 'Energy & Conglomerate',
    industry: 'Integrated Energy, Retail, 5G Telecom & New Energy',
    capTier: 'Large-Cap',
    index: 'NIFTY 50',
    currency: 'INR',
    cmp: 1248.50,
    change24h: 12.80,
    changePct24h: 1.04,
    high52w: 1608.80,
    low52w: 1118.00,
    pe: 22.4,
    marketCapStr: '₹16.89 Lakh Cr',
    tradingViewSymbol: 'NSE:RELIANCE',
    scores: {
      fundamentalQuality: 18.2,
      earningsGrowth: 13.8,
      valuation: 13.9,
      technicalStructure: 13.5,
      macroEnvironment: 13.9,
      sectorStrength: 8.6,
      flowSentiment: 4.4,
      riskCatalyst: 4.7,
      totalScore: 91.0,
      momentumScore: 84,
      riskScore: 24
    },
    entryPlan: {
      currentPrice: 1248.50,
      entryZone: {
        primary: '₹1,220 – ₹1,255',
        secondaryDip: '₹1,180 – ₹1,205',
        range: '₹1,200 – ₹1,255'
      },
      stopLoss: {
        price: 1140.00,
        formatted: '₹1,140.00',
        pct: -8.7,
        structuralLevel: 'Key multi-year support base and lower trendline of ascending channel'
      },
      target1: {
        price: 1380.00,
        formatted: '₹1,380.00',
        expectedReturnPct: 10.5,
        timeframe: '1–2 Months',
        rationale: 'Retest of 200-day EMA resistance zone'
      },
      target2: {
        price: 1540.00,
        formatted: '₹1,540.00',
        expectedReturnPct: 23.3,
        timeframe: '4–6 Months',
        rationale: 'Jio telecom tariff hike flow-through and Retail monetization re-rating'
      },
      target3: {
        price: 1680.00,
        formatted: '₹1,680.00',
        expectedReturnPct: 34.5,
        timeframe: '6–9 Months',
        rationale: 'All-time high breakout on Jio / Retail IPO timeline announcements'
      },
      riskPct: 8.7,
      expectedReturnPct: 23.3,
      riskRewardRatio: '2.68 : 1',
      confidenceScore: 87,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below ₹1,130 indicating structural breakdown of 2-year value floor',
        'Gross Refining Margins (GRMs) dropping below $4.0/bbl for consecutive quarters',
        'Retail footfall or EBITDA margin collapsing due to aggressive quick-commerce disruption'
      ],
      investmentThesis: 'Jio tariff hikes (15–20%) are flowing directly to bottom line with ARPU climbing toward ₹205. Retail division is expanding square footage profitably, and the Jamnagar mega new-energy giga-factories (solar, battery, green hydrogen) begin commercial commissioning.'
    },
    azResearch: {
      business: {
        summary: 'India’s most valuable enterprise spanning Oil-to-Chemicals (O2C refining & petrochem), Jio Platforms (490M+ 5G telecom subscribers), Reliance Retail (18,800+ stores), and New Energy giga-complexes.',
        revenueSources: [
          { segment: 'Oil-to-Chemicals (O2C)', sharePct: 53.5 },
          { segment: 'Reliance Retail', sharePct: 27.2 },
          { segment: 'Digital Services / Jio', sharePct: 14.8 },
          { segment: 'Oil & Gas Exploration (KG-D6)', sharePct: 4.5 }
        ],
        mainProducts: ['Jio 5G Telecom & AirFiber', 'Reliance Retail Grocery & Electronics', 'Petroleum Fuels & Polymers', 'KG-D6 Natural Gas'],
        domesticVsIntl: 'India 72%, International exports 28%',
        coreAdvantage: 'Unmatched scale, lowest unit cost telecom infrastructure, Jamnagar refinery complexity index of 21.1, and captive retail footprint.'
      },
      businessModel: {
        description: 'Cash-cow downstream petrochemical and refining complex feeds capital expenditure into high-growth, high-ROCE consumer platforms (Jio & Retail) and futuristic New Energy ecosystems.',
        recurringVsCyclical: 'O2C is cyclical based on global refining crack spreads; Jio and Retail generate rock-solid recurring consumer subscription and grocery cash flows.',
        customerConcentration: 'Mass-market consumer presence with 490M+ Jio subscribers and 300M+ retail loyalty members.',
        pricingPower: 'High pricing power in Telecom following tariff hikes; immense bargaining power over FMCG suppliers in Retail.'
      },
      competitiveAdvantage: {
        moat: 'Sole standalone 5G (SA) telecom network in India, largest retail footprint in South Asia, and world’s most integrated refining site.',
        brandStrength: 'Household trust across 1.4 billion population.',
        technology: 'Proprietary 5G stack, JioBrain enterprise AI platform, and advanced solar PV heterojunction cell manufacturing.',
        distribution: 'Direct retail store access within 5km of 75% of urban Indian households.',
        costAdvantage: 'Lowest data transmission cost per gigabyte globally ($0.12/GB).',
        networkEffects: 'Jio ecosystem (JioCinema, JioHotstar merger, JioFiber, UPI payments) locks in digital consumer time.',
        marketShare: '41% telecom market share, 25%+ organized retail market share in India.'
      },
      debt: {
        totalDebt: '₹3.12 Lakh Cr',
        netDebt: '₹1.15 Lakh Cr (Comfortable vs annual EBITDA of ₹1.82 Lakh Cr)',
        debtToEquity: 0.38,
        interestCoverage: '7.8x',
        maturityProfile: 'Well staggered global bond and bank syndicated loan maturities.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '₹9.85 Lakh Cr (TTM)',
        ebitda: '₹1.82 Lakh Cr',
        ebit: '₹1.35 Lakh Cr',
        netProfit: '₹78,400 Cr',
        eps: '₹57.80',
        operatingMargin: '18.5%',
        netMargin: '8.0%',
        earningsGrowthYoY: '+11.8% YoY',
        latestQuarterBeat: 'IN-LINE',
        earningsDate: 'April 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '₹1.58 Lakh Cr',
        capex: '₹1.25 Lakh Cr (Peaking capex cycle as 5G rollout concludes)',
        freeCashFlow: '₹33,000 Cr (Expanding as capex tapers)',
        fcfConversion: 'Free cash flow expected to double over next 2 fiscal years',
        quality: 'High cash quality from daily consumer cash receipts in Retail and Jio.'
      },
      growth: {
        historical3yCAGR: '14.2%',
        expectedForwardGrowth: '15–18% forward EBITDA CAGR',
        tam: 'India consumer digital services and organized retail growing at 20%+ annually',
        expansionVectors: ['JioAirFiber scaling to 25M homes', 'Jio-Disney Star media merger integration', 'Solar panel & green hydrogen commercial output'],
        capacityExpansion: 'Dhirubhai Ambani Green Energy Giga Complex entering initial manufacturing phases.'
      },
      holdings: {
        promoterOrInsiders: 'Mukesh Ambani & Family: 50.3% (Zero pledge, bedrock alignment)',
        institutionalOwnership: '38.4%',
        fiiOrForeignHoldings: '21.5%',
        diiOrMutualFunds: '16.9%',
        retailOwnership: '11.3%',
        recentTrend: 'Foreign institutional selling has abated; domestic mutual funds steadily accumulating.'
      },
      insiderActivity: {
        insiderTrend: 'Accumulating',
        institutionalTrend: 'Net Inflows',
        recentDeals: 'Promoters increased stake by 0.25% through creeping acquisition over past 12 months.'
      },
      judgement: {
        verdict: 'Strong accumulation candidate for 4–6 months. Stock has underperformed the Nifty for 18 months and is deeply oversold at the lower boundary of its multi-year trading range.',
        evidenceSummary: 'Capex peaking, free cash flow inflecting upwards, telecom tariff hikes flowing directly to net profits, and multiple mega-IPO catalysts ahead.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'Global economic slowdown depressing petrochemical crack margins (PE, PP)',
        'Delays in commercial green energy giga-factory production yields',
        'Intense quick-commerce competition in urban grocery delivery'
      ],
      liquidity: {
        dailyVolume: '₹1,850 Cr / day on NSE/BSE',
        avgVolume30d: '11.2M shares',
        bidAskSpread: '0.02%',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Lower global and domestic rates reduce financing costs on capex loans.',
        currencyFx: 'Weaker INR boosts O2C export revenues and refining margins earned in USD.',
        commodityEnergy: 'Moderate crude oil ($70–$80) provides sweet spot for refining margins and downstream polymer demand.',
        inflationRecession: 'Resilient consumer telecom and retail staples buffer macro shocks.',
        liquidityExpansion: 'Large-cap benchmark anchor with high institutional beta.'
      },
      news: [
        {
          headline: 'Reliance Retail EBITDA Crosses ₹6,200 Cr in Record Festive Quarter',
          fact: 'Company reported 1.1 billion footfalls across its physical store network.',
          marketInterpretation: 'Demonstrates resilient consumer demand and disproves quick-commerce disruption fears.',
          speculation: 'Jio-Disney Hotstar streaming platform to dominate Indian sports broadcasting.',
          date: 'Recent'
        },
        {
          headline: 'Jio AirFiber Surpasses 3.5 Million Active Paying Home Broadband Connections',
          fact: 'Fastest 5G FWA deployment in the world adding 400,000 homes per month.',
          marketInterpretation: 'Accelerates high-ARPU recurring home broadband revenue with minimal last-mile fiber capex.',
          speculation: 'Targeting 20M homes by late 2027.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '₹1,180 – ₹1,230 multi-year institutional support floor',
        supplyZones: '₹1,340 – ₹1,390 200-day EMA resistance cluster',
        keySupport: '₹1,200 / ₹1,140',
        keyResistance: '₹1,320 / ₹1,420',
        breakoutLevels: 'Weekly close above ₹1,350 initiates trending move to ₹1,540',
        breakdownLevels: 'Below ₹1,130 invalidates structural uptrend',
        institutionalVolumeNodes: 'Highest traded volume cluster centered at ₹1,240'
      },
      profitability: {
        roe: '9.8% (Depressed by massive work-in-progress capital, set to re-rate to 14%)',
        roce: '10.5%',
        roic: '9.2%',
        grossMargin: 'O2C GRM $9.8/bbl',
        operatingMargin: '18.5%',
        netMargin: '8.0%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'National champion infrastructure asset with peerless economic moats across India’s core consumption and digital pillars.'
      },
      relativeStrength: {
        vsBenchmark: 'Lagged NIFTY 50 by 8% over last 6 months (Prime mean-reversion setup)',
        vsSector: 'Outperforming standalone oil marketing and exploration peers',
        vsPeers: 'Significantly more diversified than Bharti Airtel or Tata Motors',
        rsRating: 79
      },
      sentiment: {
        analystConsensus: '84% Buy / 16% Hold / 0% Sell (Average Consensus Target: ₹1,560)',
        institutionalStance: 'Core portfolio pillar; foreign allocators awaiting value-unlocking timeline',
        optionsFlowSkew: 'Heavy put writing at ₹1,200 strike indicating solid institutional floor',
        retailSentiment: 'Moderate patience; consolidation fatigue clearing weak retail hands',
        fiiDiiSentiment: 'DIIs continuously scooping up supplies from exiting momentum funds'
      },
      technicalSetup: {
        primaryTrend: 'Triple-bottom formation at ₹1,180–₹1,200 on daily chart with bullish RSI divergence',
        structure: 'Forming higher low at ₹1,220, clearing short-term 20-day moving average',
        movingAverages: 'Testing 20-day EMA (₹1,242), 50-day EMA at ₹1,268',
        rsi: 52.8,
        macd: 'Histogram curling up towards positive territory',
        setupName: 'Triple-Bottom Value Reversal on Major Support'
      },
      upside: {
        calculationBasis: 'SOTP (Sum-of-the-parts) valuation: O2C ₹550/sh + Jio ₹580/sh + Retail ₹460/sh + New Energy ₹120/sh',
        targetUpsidePct: 23.3,
        bullScenario: '₹1,680 (+34.5%) on concrete Jio IPO filing',
        baseScenario: '₹1,540 (+23.3%) on steady earnings delivery'
      },
      valuation: {
        rating: 'UNDERVALUED',
        pe: 22.4,
        sectorPe: 24.8,
        peg: 1.45,
        pb: 1.85,
        evEbitda: 11.2,
        historicalContext: 'EV/EBITDA of 11.2x is at the bottom 15th percentile of its 5-year valuation band.'
      },
      whyNow: {
        timingRationale: 'The capital expenditure drag on return ratios is ending. Telecom price increases have been accepted by customers with zero churn, and management has committed to value-unlocking roadmaps for consumer businesses within 12–18 months.',
        immediateTrigger: 'Seasonal pickup in refining margins and formal Jio IPO preparatory filings.'
      },
      xFactor: {
        catalyst: 'Separate public listing of Jio Platforms and Reliance Retail, unlocking holding company conglomerate discount.',
        impactPotential: 'Re-rates conglomerate valuation by 20–30% overnight based on precedent Indian demergers.'
      },
      yieldReturn: {
        dividendYield: '0.85% (₹10.00/share)',
        buybackYield: '0.0%',
        capitalAllocationScore: 'A (High capital efficiency once projects commission)',
        totalReturnForecast: '+24% to +30% expected 4–6 month total return'
      },
      finalVerdict: {
        signal: 'ACCUMULATE',
        summary: 'Patience rewarded setup. Accumulate in the ₹1,220–₹1,255 zone with target of ₹1,540 (4–6M) and strict structural invalidation at ₹1,140.',
        horizonNote: 'Best suited for 4–6 month horizon targeting mean reversion and SOTP re-rating.'
      }
    }
  },

  // ── 4. MSFT (USA) ────────────────────────────────────────────────────────
  {
    id: 'MSFT',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    country: 'USA',
    exchange: 'NASDAQ',
    tickerAlias: ['MSFT', 'Microsoft', 'NASDAQ:MSFT'],
    sector: 'Cloud & Enterprise Software',
    industry: 'Enterprise SaaS, Hyperscale Cloud & Cyber Security',
    capTier: 'Large-Cap',
    index: 'S&P 500 / Nasdaq 100 / Dow Jones',
    currency: 'USD',
    cmp: 428.50,
    change24h: 4.20,
    changePct24h: 0.99,
    high52w: 468.35,
    low52w: 395.10,
    pe: 33.2,
    marketCapStr: '$3.18T',
    tradingViewSymbol: 'NASDAQ:MSFT',
    scores: {
      fundamentalQuality: 19.6,
      earningsGrowth: 14.1,
      valuation: 12.6,
      technicalStructure: 13.9,
      macroEnvironment: 14.0,
      sectorStrength: 9.4,
      flowSentiment: 4.7,
      riskCatalyst: 4.4,
      totalScore: 92.7,
      momentumScore: 89,
      riskScore: 16
    },
    entryPlan: {
      currentPrice: 428.50,
      entryZone: {
        primary: '$418.00 – $429.00',
        secondaryDip: '$405.00 – $414.00',
        range: '$410 – $429'
      },
      stopLoss: {
        price: 392.00,
        formatted: '$392.00',
        pct: -8.5,
        structuralLevel: 'Key 52-week support floor and 200-day SMA structural trendline'
      },
      target1: {
        price: 465.00,
        formatted: '$465.00',
        expectedReturnPct: 8.5,
        timeframe: '1–2 Months',
        rationale: 'Retest of prior all-time high resistance'
      },
      target2: {
        price: 515.00,
        formatted: '$515.00',
        expectedReturnPct: 20.2,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: Azure AI growth acceleration to 33%+ and Copilot monetization'
      },
      target3: {
        price: 560.00,
        formatted: '$560.00',
        expectedReturnPct: 30.7,
        timeframe: '6–9 Months',
        rationale: 'Multiple expansion on enterprise AI agent adoption'
      },
      riskPct: 8.5,
      expectedReturnPct: 20.2,
      riskRewardRatio: '2.38 : 1',
      confidenceScore: 92,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below $390 breaking multi-year secular bull market channel',
        'Azure revenue growth decelerating below 25% in constant currency',
        'Commercial RPO (Remaining Performance Obligations) turning negative'
      ],
      investmentThesis: 'Azure is taking market share from AWS with AI services driving 12+ percentage points of cloud growth. Microsoft 365 Copilot adoption is inflecting across Fortune 500 enterprises, and AAA gaming pipeline (Activision) is expanding margins.'
    },
    azResearch: {
      business: {
        summary: 'World’s most diversified and resilient enterprise technology corporation, dominating enterprise productivity software, cloud computing (Azure), enterprise security, gaming, and developer tooling (GitHub).',
        revenueSources: [
          { segment: 'Intelligent Cloud (Azure, Server Products)', sharePct: 43.5 },
          { segment: 'Productivity & Business Processes (Office, LinkedIn)', sharePct: 33.2 },
          { segment: 'More Personal Computing (Windows, Xbox, Surface)', sharePct: 23.3 }
        ],
        mainProducts: ['Microsoft Azure Cloud', 'Microsoft 365 & Copilot', 'Windows 11 OS', 'LinkedIn & GitHub', 'Xbox Game Pass'],
        domesticVsIntl: 'USA 51%, International 49%',
        coreAdvantage: 'Deep enterprise customer relationships, unified Active Directory identity infrastructure, and preferred cloud integration.'
      },
      businessModel: {
        description: 'High-margin recurring enterprise subscription and consumption-based cloud contracts with 98%+ enterprise renewal rates.',
        recurringVsCyclical: 'Over 82% of revenue is recurring contractual SaaS or cloud consumption.',
        customerConcentration: 'Virtually zero customer concentration; millions of enterprise and public sector accounts.',
        pricingPower: 'Exceptional pricing power; successfully implemented 15–20% list price increases across Office 365 and Copilot add-ons.'
      },
      competitiveAdvantage: {
        moat: 'Unassailable enterprise software lock-in, identity management, and exclusive partnership with OpenAI models.',
        brandStrength: 'AAA sovereign-grade enterprise trust.',
        technology: 'Hyperscale global data center footprint across 60+ regions worldwide.',
        distribution: 'Direct enterprise salesforce touching every major government and corporation on earth.',
        costAdvantage: 'Massive compute scale yields lower power and silicon acquisition costs.',
        networkEffects: 'GitHub developer ecosystem (100M+ developers) and LinkedIn professional graph.',
        marketShare: 'Azure ~25% cloud infrastructure market share and gaining on AWS.'
      },
      debt: {
        totalDebt: '$42.5B',
        netDebt: '-$34.2B (Net Cash Positive with $76.7B in cash & short-term securities)',
        debtToEquity: 0.17,
        interestCoverage: '48.2x',
        maturityProfile: 'One of only two US corporations with a pristine S&P AAA credit rating (higher than US Government).',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '$254.2B (TTM)',
        ebitda: '$135.8B',
        ebit: '$118.4B',
        netProfit: '$92.1B',
        eps: '$12.35',
        operatingMargin: '46.6%',
        netMargin: '36.2%',
        earningsGrowthYoY: '+16.5% YoY',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'April 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '$124.5B',
        capex: '$54.0B (Aggressive AI data center build-out)',
        freeCashFlow: '$70.5B',
        fcfConversion: '76.5% of net profit despite peak AI infrastructure capex',
        quality: 'Pristine cash flow collection with near-zero bad debt.'
      },
      growth: {
        historical3yCAGR: '14.8%',
        expectedForwardGrowth: '14–16% forward revenue CAGR, 18% EPS CAGR',
        tam: 'Global IT enterprise spending TAM reaching $5.5 Trillion by 2028',
        expansionVectors: ['Agentic AI workflows inside M365 Copilot', 'Cybersecurity suite (Microsoft Defender) generating $25B+ revenue', 'Healthcare AI via Nuance'],
        capacityExpansion: 'Data center capacity doubling across Europe, Japan, and North America.'
      },
      holdings: {
        promoterOrInsiders: 'Insiders & Board: ~1.2%',
        institutionalOwnership: '73.2%',
        fiiOrForeignHoldings: 'Global sovereign and institutional presence',
        diiOrMutualFunds: 'Top holding in Vanguard Total Stock Market, SPY, QQQ',
        retailOwnership: '25.6%',
        recentTrend: 'Institutional holding rock solid; zero institutional liquidations.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Net Inflows',
        recentDeals: 'Routine executive option exercise and tax-related stock withholdings.'
      },
      judgement: {
        verdict: 'Highest quality sleep-well-at-night investment for 4–6 months. Pullback below $430 provides an attractive entry ahead of Copilot enterprise billing ramp.',
        evidenceSummary: 'AAA balance sheet, 46% operating margin, 30%+ Azure growth rate, and zero structural disruption risk.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'Massive AI infrastructure capex temporarily depressing operating margins for 2 quarters',
        'Antitrust scrutiny in Europe regarding Teams/Office bundling and cloud licensing terms',
        'OpenAI dependency if open-source model capabilities bridge the performance gap'
      ],
      liquidity: {
        dailyVolume: '$8.2 Billion / day',
        avgVolume30d: '19.4M shares',
        bidAskSpread: '0.01%',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Neutral to positive; net cash position earns high Treasury yields.',
        currencyFx: 'Strong USD shaves 1–2% off reported international revenue growth.',
        commodityEnergy: 'Requires reliable green power; actively signing nuclear power purchase agreements (e.g. Constellation Energy).',
        inflationRecession: 'Highest recession resistance among mega-cap tech; companies cannot cancel core Office or Azure contracts.',
        liquidityExpansion: 'Steady compounder benefiting from institutional equity fund inflows.'
      },
      news: [
        {
          headline: 'Microsoft Azure AI Customer Count Reaches 65,000, Up 60% YoY',
          fact: 'Over half of Fortune 500 companies are deploying Azure OpenAI service.',
          marketInterpretation: 'Validates commercial enterprise traction over speculative toy AI tools.',
          speculation: 'Copilot enterprise penetration to reach 20% of M365 seats by late 2026.',
          date: 'Recent'
        },
        {
          headline: 'Microsoft Signs 20-Year Power Agreement to Restart Three Mile Island Nuclear Plant for AI Cloud',
          fact: 'Secures 835 MW of carbon-free baseload energy dedicated to Microsoft datacenters.',
          marketInterpretation: 'Solves the primary bottleneck facing AI scaling: reliable electricity generation.',
          speculation: 'Competitors will face energy capacity rationing in PJM interconnection zone.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '$410.00 – $422.00 major institutional support shelf',
        supplyZones: '$455.00 – $468.00 previous all-time high supply block',
        keySupport: '$418.00 (200-day EMA) / $400.00 (Psychological round number)',
        keyResistance: '$445.00 / $468.35',
        breakoutLevels: 'Break above $470 opens blue-sky run to $520+',
        breakdownLevels: 'Below $392 triggers trend reversal',
        institutionalVolumeNodes: 'Point of Control sits at $424.50'
      },
      profitability: {
        roe: '38.4%',
        roce: '34.2%',
        roic: '31.8%',
        grossMargin: '69.8%',
        operatingMargin: '46.6%',
        netMargin: '36.2%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'The single most stable, profitable, and durable software monopoly on earth.'
      },
      relativeStrength: {
        vsBenchmark: '+12% vs S&P 500 over past 24 months',
        vsSector: 'Performing in line with broad enterprise software, outperforming Apple',
        vsPeers: 'Significantly higher operating margins (46%) than Amazon AWS or Google Cloud',
        rsRating: 88
      },
      sentiment: {
        analystConsensus: '94% Buy / 6% Hold / 0% Sell (Average Consensus Target: $505)',
        institutionalStance: 'Ultimate cornerstone asset in global institutional portfolios',
        optionsFlowSkew: 'Low implied volatility; institutional call overwriting and long put collars',
        retailSentiment: 'High conviction long-term sentiment',
        fiiDiiSentiment: 'Sovereign wealth funds and pension plans maintain continuous monthly dollar-cost-averaging'
      },
      technicalSetup: {
        primaryTrend: 'Healthy consolidation retesting the 200-day moving average in an unbroken secular uptrend',
        structure: 'Weekly bull flag contracting towards apex with declining sell volume',
        movingAverages: 'Trading at 200-day EMA ($421.50) and 50-day EMA ($430.20)',
        rsi: 51.4,
        macd: 'Neutral curling positive on 4-hour and daily charts',
        setupName: '200-Day EMA Bull Flag Rebound'
      },
      upside: {
        calculationBasis: 'FY26 projected EPS of $15.20 @ 34x forward P/E multiple',
        targetUpsidePct: 20.2,
        bullScenario: '$560.00 (+30.7%) on faster enterprise Copilot adoption',
        baseScenario: '$515.00 (+20.2%) on base cloud trajectory'
      },
      valuation: {
        rating: 'FAIRLY VALUED',
        pe: 33.2,
        sectorPe: 31.8,
        peg: 1.85,
        pb: 11.2,
        evEbitda: 23.4,
        historicalContext: 'Valuation is in line with 5-year historical average (32–35x P/E) despite significantly higher AI growth optionality.'
      },
      whyNow: {
        timingRationale: 'The stock has consolidated for 6 months while earnings caught up, compressing the forward multiple. With 200-day EMA support holding firm and Azure AI acceleration, this offers the safest risk-adjusted entry in US tech.',
        immediateTrigger: 'Upcoming fiscal earnings report expected to demonstrate Copilot enterprise contract conversion.'
      },
      xFactor: {
        catalyst: 'Enterprise Autonomous Agents platform (Copilot Studio) replacing manual back-office software licenses.',
        impactPotential: 'Expands Microsoft’s addressable software market into the multi-trillion global white-collar services pool.'
      },
      yieldReturn: {
        dividendYield: '0.78% ($3.32/yr with 10% annual dividend growth streak for 20 years)',
        buybackYield: '1.2% ($60B active buyback program)',
        capitalAllocationScore: 'A+ (Unsurpassed capital discipline)',
        totalReturnForecast: '+21% to +26% expected 4–6 month total return'
      },
      finalVerdict: {
        signal: 'BUY',
        summary: 'Pristine institutional buy. Accumulate in the $418–$429 range with target at $515 (4–6M) and strict stop loss at $392.',
        horizonNote: 'Core low-volatility 4–6 month compounding holding.'
      }
    }
  },

  // ── 5. HAL (INDIA) ───────────────────────────────────────────────────────
  {
    id: 'HAL',
    symbol: 'HAL',
    name: 'Hindustan Aeronautics Ltd',
    country: 'INDIA',
    exchange: 'NSE',
    tickerAlias: ['HAL', 'Hindustan Aeronautics', 'NSE:HAL', 'BSE:541154'],
    sector: 'Defence & Aerospace',
    industry: 'Military Aircraft, Helicopters, Jet Engines & Avionics',
    capTier: 'Large-Cap',
    index: 'NIFTY 50 / NIFTY Defence',
    currency: 'INR',
    cmp: 4120.00,
    change24h: 78.50,
    changePct24h: 1.94,
    high52w: 5675.00,
    low52w: 3045.00,
    pe: 36.4,
    marketCapStr: '₹2.75 Lakh Cr',
    tradingViewSymbol: 'NSE:HAL',
    scores: {
      fundamentalQuality: 18.7,
      earningsGrowth: 14.5,
      valuation: 13.2,
      technicalStructure: 14.0,
      macroEnvironment: 14.5,
      sectorStrength: 9.7,
      flowSentiment: 4.8,
      riskCatalyst: 4.8,
      totalScore: 94.2,
      momentumScore: 92,
      riskScore: 20
    },
    entryPlan: {
      currentPrice: 4120.00,
      entryZone: {
        primary: '₹3,980 – ₹4,150',
        secondaryDip: '₹3,820 – ₹3,920',
        range: '₹3,900 – ₹4,150'
      },
      stopLoss: {
        price: 3680.00,
        formatted: '₹3,680.00',
        pct: -10.7,
        structuralLevel: 'Key 200-day EMA support and previous major accumulation pivot'
      },
      target1: {
        price: 4680.00,
        formatted: '₹4,680.00',
        expectedReturnPct: 13.6,
        timeframe: '1–2 Months',
        rationale: 'Retest of 50-day moving average and intermediate resistance'
      },
      target2: {
        price: 5250.00,
        formatted: '₹5,250.00',
        expectedReturnPct: 27.4,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: Tejas Mk1A delivery ramp and GE-414 engine tech transfer progress'
      },
      target3: {
        price: 5900.00,
        formatted: '₹5,900.00',
        expectedReturnPct: 43.2,
        timeframe: '6–9 Months',
        rationale: 'New all-time high on formal DAC clearance of Su-30MKI upgrade and mega helicopter orders'
      },
      riskPct: 10.7,
      expectedReturnPct: 27.4,
      riskRewardRatio: '2.56 : 1',
      confidenceScore: 90,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below ₹3,650 breaking the primary multi-year secular bull market trendline',
        'Ministry of Defence deferring major capital acquisition contracts past FY27',
        'Failure in GE F404/F414 engine supply chain causing complete manufacturing halt for > 6 months'
      ],
      investmentThesis: 'Monopoly supplier of fighter jets, combat helicopters, and aircraft overhaul to the Indian Armed Forces. Order book stands at a monumental ₹1.28 Lakh Cr (~4.2x TTM revenue) with massive visibility over the next 10 years backed by the government’s Atmanirbhar Bharat defence indigenization mandate.'
    },
    azResearch: {
      business: {
        summary: 'India’s sole military aircraft manufacturer, responsible for designing, manufacturing, assembling, and maintaining indigenous fighter jets (Tejas Mk1A, Mk2, AMCA), combat helicopters (Prachand LCH, ALH Dhruv), and aero engines.',
        revenueSources: [
          { segment: 'Manufacturing (Tejas, Helicopters, Su-30)', sharePct: 52.0 },
          { segment: 'Repair & Overhaul (ROH)', sharePct: 42.0 },
          { segment: 'Spares & Engineering Services', sharePct: 6.0 }
        ],
        mainProducts: ['LCA Tejas Mk1A Fighter Jet', 'LCH Prachand Combat Helicopter', 'ALH Dhruv Helicopter', 'Su-30MKI Overhaul & Radar Upgrade'],
        domesticVsIntl: 'India (MoD & Armed Forces) 98%, Exports 2%',
        coreAdvantage: '100% sovereign defense manufacturing monopoly with irreplaceable aerospace engineering facilities in Bengaluru, Nashik, and Koraput.'
      },
      businessModel: {
        description: 'Cost-plus and fixed-price contracts awarded on nomination basis by Ministry of Defence, providing predictable, high-margin revenue and zero sales/marketing expenditure.',
        recurringVsCyclical: 'Repair & Overhaul (ROH) generates 42% recurring, high-margin, recession-proof revenue throughout aircraft fleet operational life (30+ years).',
        customerConcentration: 'Government of India (Indian Air Force, Navy, Army, Coast Guard) is the sole domestic buyer.',
        pricingPower: 'Cost-plus pricing protects margins from raw material and titanium price inflation.'
      },
      competitiveAdvantage: {
        moat: 'Absolute sovereign monopoly; private players lack the multi-decade capital, flight test facilities, and military security clearances.',
        brandStrength: 'State aerospace jewel of India.',
        technology: 'AESA radar integration, fly-by-wire flight control systems, and composite airframe manufacturing.',
        distribution: 'Direct pipeline into Indian Air Force and Army procurement.',
        costAdvantage: 'Significantly lower engineering wage costs compared to Dassault, Lockheed Martin, or Boeing.',
        networkEffects: 'Domestic tier-1 and tier-2 vendor supply chains (BEL, Astra, Data Patterns) are built around HAL platforms.',
        marketShare: '100% domestic market share for fixed-wing combat aircraft.'
      },
      debt: {
        totalDebt: '₹0 (Zero Debt)',
        netDebt: '-₹26,400 Cr (Massive Net Cash & Advance Deposits)',
        debtToEquity: 0.0,
        interestCoverage: 'Pristine (Earns ₹1,800+ Cr in annual treasury interest income)',
        maturityProfile: 'Completely debt-free balance sheet.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '₹30,450 Cr (TTM)',
        ebitda: '₹9,850 Cr',
        ebit: '₹9,120 Cr',
        netProfit: '₹7,620 Cr',
        eps: '₹114.20',
        operatingMargin: '32.4%',
        netMargin: '25.0%',
        earningsGrowthYoY: '+26.8% YoY',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'May 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '₹8,450 Cr',
        capex: '₹2,400 Cr (Nashik third assembly line and helicopter giga-facility in Tumakuru)',
        freeCashFlow: '₹6,050 Cr',
        fcfConversion: '79.4% of net profit converted to free cash flow',
        quality: 'Supreme cash quality supported by substantial milestone advance payments from MoD.'
      },
      growth: {
        historical3yCAGR: '21.5%',
        expectedForwardGrowth: '20–24% forward revenue & earnings CAGR through 2029',
        tam: 'India Defence Capex Budget expanding at 12–15% CAGR with 75% reserved for domestic procurement',
        expansionVectors: ['Tejas Mk1A delivery ramp to 24 aircraft/year', '156 Prachand helicopter mega-order (₹45,000 Cr)', 'Su-30MKI avionics & radar modernization (₹65,000 Cr)'],
        capacityExpansion: 'Tumakuru helicopter factory inaugurated, expanding production capacity to 30+ helicopters/year.'
      },
      holdings: {
        promoterOrInsiders: 'Government of India (President of India): 71.6% (Committed to retaining majority control)',
        institutionalOwnership: '21.4%',
        fiiOrForeignHoldings: '11.8%',
        diiOrMutualFunds: '9.6%',
        retailOwnership: '7.0%',
        recentTrend: 'Institutional holding has risen continuously as mutual funds treat HAL as an essential structural proxy for India’s rise.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Aggressive Accumulation',
        recentDeals: 'Domestic equity funds absorbed foreign block sale rebalancing with strong net inflows.'
      },
      judgement: {
        verdict: 'Elite institutional investment opportunity for 4–6 months. Recent consolidation from ₹5,600 down to ₹4,000 has flushed out speculative froth, offering an exceptional entry point.',
        evidenceSummary: 'Order backlog of ₹1.28 Lakh Cr, debt-free net-cash balance sheet, 32% operating margins, and 100% sovereign protection.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'Delays in delivery of GE F404 turbofan engines from GE Aerospace (USA)',
        'Lumpy quarterly revenue recognition based on physical aircraft handover milestones',
        'Potential Government of India Offer for Sale (OFS) to meet divestment targets, creating short-term supply overhang'
      ],
      liquidity: {
        dailyVolume: '₹650 Cr / day on NSE',
        avgVolume30d: '1.8M shares',
        bidAskSpread: '0.03%',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Virtually zero sensitivity to interest rates; net cash position earns interest.',
        currencyFx: 'Imported avionics and engines paid in USD/EUR; contracts feature foreign exchange variation clauses protecting margins.',
        commodityEnergy: 'Raw material price escalations are passed through to the Ministry of Defence.',
        inflationRecession: 'Completely insulated from macroeconomic downturns; defense budget is non-discretionary national security spending.',
        liquidityExpansion: 'Strong thematic leadership in domestic capital expenditure cycles.'
      },
      news: [
        {
          headline: 'Ministry of Defence Clears ₹45,000 Cr Deal for 156 Prachand Light Combat Helicopters from HAL',
          fact: 'Defence Acquisition Council (DAC) issued formal Acceptance of Necessity (AoN).',
          marketInterpretation: 'Expands HAL’s visible order book past ₹1.7 Lakh Cr, guaranteeing revenue for the next 8 years.',
          speculation: 'First helicopter deliveries from Tumakuru factory to begin ahead of schedule.',
          date: 'Recent'
        },
        {
          headline: 'HAL and GE Aerospace Finalize 80% Technology Transfer Terms for F414 Jet Engine Manufacturing in India',
          fact: 'Commercial manufacturing agreement signed for local assembly of jet engines for Tejas Mk2.',
          marketInterpretation: 'Positions HAL as one of the few aerospace firms worldwide with indigenous jet engine fabrication capabilities.',
          speculation: 'Eliminates long-term single-point supply vulnerability.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '₹3,900 – ₹4,080 primary institutional demand shelf',
        supplyZones: '₹4,750 – ₹5,100 intermediate supply zone',
        keySupport: '₹3,950 (50-day EMA) / ₹3,680 (200-day EMA)',
        keyResistance: '₹4,450 / ₹4,850',
        breakoutLevels: 'Sustained close above ₹4,500 opens aggressive move to ₹5,250',
        breakdownLevels: 'Below ₹3,650 triggers defensive exit',
        institutionalVolumeNodes: 'Point of Control firmly established at ₹4,050'
      },
      profitability: {
        roe: '28.9%',
        roce: '37.4%',
        roic: '48.2% (Adjusted for massive net cash holding)',
        grossMargin: '58.5%',
        operatingMargin: '32.4%',
        netMargin: '25.0%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'Monopolistic defense leader with net cash, 32% operating margins, and unmatched geopolitical relevance.'
      },
      relativeStrength: {
        vsBenchmark: '+44% outperformance vs NIFTY 50 over past 12 months',
        vsSector: 'Core flagship outperforming global aerospace peers like Boeing and Lockheed',
        vsPeers: 'Superior margins and ROE compared to BEL, BDL, or Mazagon Dock',
        rsRating: 92
      },
      sentiment: {
        analystConsensus: '88% Buy / 12% Hold / 0% Sell (Target: ₹5,400)',
        institutionalStance: 'High-conviction national security proxy asset',
        optionsFlowSkew: 'Heavy call buying in ₹4,200 and ₹4,500 strikes',
        retailSentiment: 'Bullish; retail investors accumulating on any dips',
        fiiDiiSentiment: 'Both domestic and foreign funds increasing portfolio weight'
      },
      technicalSetup: {
        primaryTrend: 'Strong secular uptrend completing a classic 25% healthy corrective pullback to 200-day EMA',
        structure: 'Double bottom reversal at ₹3,920 with high volume thrust and RSI bullish divergence',
        movingAverages: 'Reclaiming 20-day EMA (₹4,080) with 50-day EMA at ₹4,240',
        rsi: 56.4,
        macd: 'Bullish crossover confirmed on daily chart',
        setupName: '200-Day EMA Institutional Support Rebound'
      },
      upside: {
        calculationBasis: 'FY27E projected EPS of ₹150 @ 35x P/E multiple supported by 24% annual profit growth',
        targetUpsidePct: 27.4,
        bullScenario: '₹5,900 (+43.2%) if Tejas Mk1A deliveries accelerate to 24 units/year',
        baseScenario: '₹5,250 (+27.4%) on base order execution'
      },
      valuation: {
        rating: 'FAIRLY VALUED',
        pe: 36.4,
        sectorPe: 42.1,
        peg: 1.52,
        pb: 8.8,
        evEbitda: 25.2,
        historicalContext: 'Multiple has normalized from 48x down to 36x, making it attractive given the 22%+ earnings CAGR.'
      },
      whyNow: {
        timingRationale: 'The stock has finished a multi-month price and time correction. GE engine supply clarity is emerging, the ₹45,000 Cr Prachand order is entering contract signing, and FY26 deliveries are set to surge.',
        immediateTrigger: 'Imminent commercial signing of the 156 Light Combat Helicopter procurement contract.'
      },
      xFactor: {
        catalyst: 'Export contracts for Tejas Mk1A or ALH Dhruv to Southeast Asian, African, or South American air forces.',
        impactPotential: 'Transforms HAL from a domestic contractor into an international aerospace exporter, justifying a 45x+ valuation multiple.'
      },
      yieldReturn: {
        dividendYield: '1.20% (₹40.00/share)',
        buybackYield: '0.0%',
        capitalAllocationScore: 'A (High dividend payout ratio of 35% while funding capex internally)',
        totalReturnForecast: '+28% to +35% expected total return over 4–6 months'
      },
      finalVerdict: {
        signal: 'BUY',
        summary: 'Exceptional structural investment. Accumulate in the ₹3,980–₹4,150 zone with target at ₹5,250 (4–6M) and strict stop loss at ₹3,680.',
        horizonNote: 'Prime 4–6 month institutional holding horizon.'
      }
    }
  },

  // ── 6. AMZN (USA) ────────────────────────────────────────────────────────
  {
    id: 'AMZN',
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    country: 'USA',
    exchange: 'NASDAQ',
    tickerAlias: ['AMZN', 'Amazon', 'NASDAQ:AMZN'],
    sector: 'Cloud & Consumer Technology',
    industry: 'Hyperscale Cloud (AWS), E-Commerce & Digital Advertising',
    capTier: 'Large-Cap',
    index: 'S&P 500 / Nasdaq 100 / Dow Jones',
    currency: 'USD',
    cmp: 204.80,
    change24h: 3.10,
    changePct24h: 1.54,
    high52w: 215.90,
    low52w: 166.30,
    pe: 41.2,
    marketCapStr: '$2.16T',
    tradingViewSymbol: 'NASDAQ:AMZN',
    scores: {
      fundamentalQuality: 19.1,
      earningsGrowth: 14.6,
      valuation: 13.5,
      technicalStructure: 14.2,
      macroEnvironment: 13.9,
      sectorStrength: 9.2,
      flowSentiment: 4.6,
      riskCatalyst: 4.5,
      totalScore: 93.6,
      momentumScore: 91,
      riskScore: 21
    },
    entryPlan: {
      currentPrice: 204.80,
      entryZone: {
        primary: '$198.00 – $205.00',
        secondaryDip: '$190.00 – $195.00',
        range: '$192 – $205'
      },
      stopLoss: {
        price: 184.00,
        formatted: '$184.00',
        pct: -10.1,
        structuralLevel: 'Key 200-day moving average and breakout base support'
      },
      target1: {
        price: 225.00,
        formatted: '$225.00',
        expectedReturnPct: 9.8,
        timeframe: '1–2 Months',
        rationale: 'Breakout above previous all-time high of $215.90'
      },
      target2: {
        price: 255.00,
        formatted: '$255.00',
        expectedReturnPct: 24.5,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: AWS re-acceleration, retail margin expansion and advertising cash flow explosion'
      },
      target3: {
        price: 280.00,
        formatted: '$280.00',
        expectedReturnPct: 36.7,
        timeframe: '6–9 Months',
        rationale: 'Multiple expansion on record $65B+ annual free cash flow delivery'
      },
      riskPct: 10.1,
      expectedReturnPct: 24.5,
      riskRewardRatio: '2.42 : 1',
      confidenceScore: 90,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below $182 breaking 1-year ascending trend channel',
        'AWS operating margin falling below 28%',
        'US retail division turning operating loss negative'
      ],
      investmentThesis: 'Triple-engine compounding: AWS is re-accelerating to 19%+ YoY growth on Bedrock AI deployments, high-margin Digital Advertising is generating $55B+ at 50%+ margins, and regionalized fulfillment centers are driving record North American retail operating profits.'
    },
    azResearch: {
      business: {
        summary: 'Global leader in cloud computing infrastructure (AWS), e-commerce retail logistics, digital retail media advertising, and streaming entertainment (Prime Video).',
        revenueSources: [
          { segment: 'North America Retail E-Commerce', sharePct: 59.8 },
          { segment: 'International Retail', sharePct: 22.8 },
          { segment: 'Amazon Web Services (AWS)', sharePct: 17.4 }
        ],
        mainProducts: ['AWS Cloud & AI (Bedrock, SageMaker, Trainium)', 'Amazon Prime Marketplace', 'Digital Sponsored Ads', 'Prime Video & Audible'],
        domesticVsIntl: 'USA 68%, International 32%',
        coreAdvantage: 'Unmatched physical logistics fulfillment network and largest global public cloud infrastructure footprint.'
      },
      businessModel: {
        description: 'E-commerce generates high volume customer traffic and zero-working-capital float, which fuels high-margin advertising and dominant cloud infrastructure (AWS).',
        recurringVsCyclical: 'AWS and Prime subscriptions are highly recurring; e-commerce has seasonal fourth-quarter holiday surge.',
        customerConcentration: 'Over 310 million active customer accounts worldwide with zero concentration risk.',
        pricingPower: 'High pricing power in Prime membership fees ($139/yr) and cloud consumption.'
      },
      competitiveAdvantage: {
        moat: 'Billions invested in regionalized robotics fulfillment centers create an unassailable same-day and next-day delivery moat.',
        brandStrength: 'World’s most ubiquitous retail consumer brand.',
        technology: 'Custom silicon (Graviton4, Trainium2), Amazon Bedrock enterprise AI platform.',
        distribution: 'Over 1,000 fulfillment and delivery stations across North America and Europe.',
        costAdvantage: 'Highest scale in global package shipping lowers per-unit transportation cost below FedEx and UPS.',
        networkEffects: 'Flywheel: More buyers attract more third-party sellers, driving more advertising dollars and lower prices.',
        marketShare: 'AWS ~31% global cloud infrastructure market share; 38% US e-commerce market share.'
      },
      debt: {
        totalDebt: '$68.2B',
        netDebt: '$8.4B (Net cash imminent as $88B+ cash equivalents offset debt)',
        debtToEquity: 0.28,
        interestCoverage: '18.4x',
        maturityProfile: 'Extremely long-dated low-coupon fixed bonds issued during 2020–2021.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '$620.1B (TTM)',
        ebitda: '$112.5B',
        ebit: '$60.4B',
        netProfit: '$49.8B',
        eps: '$4.68',
        operatingMargin: '9.7% (Up from 2.5% in 2022!)',
        netMargin: '8.0%',
        earningsGrowthYoY: '+54.2% YoY',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'April 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '$112.8B',
        capex: '$58.0B (Data centers and robotics automation)',
        freeCashFlow: '$54.8B',
        fcfConversion: '110% of net profit',
        quality: 'Massive operational cash flow inflection following fulfillment network regionalization.'
      },
      growth: {
        historical3yCAGR: '12.4%',
        expectedForwardGrowth: '12–15% revenue CAGR, 25%+ operating income CAGR',
        tam: 'Global retail e-commerce is still only 20% of total retail sales; massive headroom remaining',
        expansionVectors: ['Amazon Ads scaling video streaming commercials', 'AWS custom silicon (Trainium) reducing AI training costs', 'Healthcare (One Medical) and grocery automation'],
        capacityExpansion: 'Investing $150B in datacenters over the next decade.'
      },
      holdings: {
        promoterOrInsiders: 'Jeff Bezos: 8.8% (~$190B economic alignment)',
        institutionalOwnership: '62.8%',
        fiiOrForeignHoldings: 'Broad global wealth fund presence',
        diiOrMutualFunds: 'Core allocation across SPY, QQQ, VTI',
        retailOwnership: '28.4%',
        recentTrend: 'Institutional accumulation steady through post-earnings dips.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Aggressive Accumulation',
        recentDeals: 'Jeff Bezos Rule 10b5-1 pre-scheduled sales executed smoothly without market impact.'
      },
      judgement: {
        verdict: 'Top-tier core institutional buy for 4–6 months. The market still undervalues Amazon’s margin expansion potential as retail margins climb to 6–8% and AWS re-accelerates.',
        evidenceSummary: 'Free cash flow surging past $55B, advertising revenue compounding at 20%+, and AWS maintaining global #1 cloud position.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'FTC antitrust lawsuit regarding third-party seller practices and pricing algorithms',
        'Intense competition from Temu and Shein in low-cost consumer discretionary categories',
        'Large-scale AI datacenter capex causing short-term free cash flow lumps'
      ],
      liquidity: {
        dailyVolume: '$7.4 Billion / day',
        avgVolume30d: '34M shares',
        bidAskSpread: '0.01%',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Lower interest rates stimulate consumer retail spending and corporate cloud software budgets.',
        currencyFx: 'Strong USD creates mild foreign exchange headwind on European and Japanese e-commerce sales.',
        commodityEnergy: 'Lower diesel fuel prices directly expand retail delivery margins.',
        inflationRecession: 'High inflation hurts discretionary retail, but essential staples and AWS provide strong balance.',
        liquidityExpansion: 'Strong positive correlation with global risk-on equity rallies.'
      },
      news: [
        {
          headline: 'AWS Revenue Grows 19.2% YoY, Driven by Accelerating Enterprise AI Deployments',
          fact: 'AWS annualized revenue run-rate reached $110 Billion.',
          marketInterpretation: 'Eliminates fears of AWS losing structural market share to Microsoft Azure.',
          speculation: 'AWS AI annualized revenue run-rate to exceed $10 Billion within 12 months.',
          date: 'Recent'
        },
        {
          headline: 'Amazon Advertising Revenue Reaches $14.3B in Single Quarter at 24% YoY Growth',
          fact: 'Prime Video ad tier launch contributed over $1.5B in incremental high-margin ad revenue.',
          marketInterpretation: 'Solidifies Amazon as the world’s third largest digital advertising giant behind Google and Meta.',
          speculation: 'Ad operating margins exceed 55%, subsidizing e-commerce delivery.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '$192.00 – $200.00 heavy institutional accumulation shelf',
        supplyZones: '$212.00 – $216.00 all-time high resistance',
        keySupport: '$195.00 (50-day EMA) / $184.00 (200-day EMA)',
        keyResistance: '$210.00 / $215.90',
        breakoutLevels: 'Clear break above $216 triggers blue-sky expansion to $250+',
        breakdownLevels: 'Below $182 triggers defensive reassessment',
        institutionalVolumeNodes: 'Point of Control centered at $198.40'
      },
      profitability: {
        roe: '22.8%',
        roce: '18.4%',
        roic: '17.2%',
        grossMargin: '49.2%',
        operatingMargin: '9.7%',
        netMargin: '8.0%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'Triple secular leadership in e-commerce, cloud computing, and digital advertising.'
      },
      relativeStrength: {
        vsBenchmark: '+21% outperformance vs S&P 500 over past 12 months',
        vsSector: 'Outperforming broad consumer discretionary (XLY) by 14%',
        vsPeers: 'Significantly higher margin trajectory than Walmart or Target',
        rsRating: 90
      },
      sentiment: {
        analystConsensus: '96% Buy / 4% Hold / 0% Sell (Mean Target: $242.00)',
        institutionalStance: 'Top-3 institutional hedge fund and mutual fund holding',
        optionsFlowSkew: 'Consistent bullish flow in out-of-the-money 4–6 month call spreads ($220–$250)',
        retailSentiment: 'Strong retail brand loyalty',
        fiiDiiSentiment: 'Sovereign wealth funds steadily adding allocation'
      },
      technicalSetup: {
        primaryTrend: 'Clean multi-month ascending channel holding above rising 50-day and 200-day EMAs',
        structure: 'Bullish consolidation just below all-time highs; volume contraction during pullbacks',
        movingAverages: 'Trading above 20-day ($201.20), 50-day ($196.40), and 200-day ($185.10) EMAs',
        rsi: 59.2,
        macd: 'Positive momentum histogram expanding above signal line',
        setupName: 'Ascending Triangle Breakout Base'
      },
      upside: {
        calculationBasis: 'FY26 projected EPS of $6.20 @ 41x forward P/E multiple or 30x Free Cash Flow',
        targetUpsidePct: 24.5,
        bullScenario: '$280.00 (+36.7%) if retail operating margins reach 8% and AWS grows > 22%',
        baseScenario: '$255.00 (+24.5%) on base trajectory'
      },
      valuation: {
        rating: 'FAIRLY VALUED',
        pe: 41.2,
        sectorPe: 32.4,
        peg: 1.35,
        pb: 8.4,
        evEbitda: 18.2,
        historicalContext: 'Forward EV/EBITDA of 18.2x is near a 10-year low (historical range: 24x–36x) due to surging cash flow.'
      },
      whyNow: {
        timingRationale: 'AWS has definitively crossed the threshold from customer optimization to new AI workload expansion. Combined with the Prime Video advertising ramp, Amazon’s cash generation is at an all-time record.',
        immediateTrigger: 'Upcoming quarterly results anticipated to demonstrate AWS margin expansion.'
      },
      xFactor: {
        catalyst: 'Robotics automation in fulfillment centers reducing cost-to-serve per package by $0.35–$0.50.',
        impactPotential: 'Flows an additional $4–$6 Billion straight to operating profit annually.'
      },
      yieldReturn: {
        dividendYield: '0.0%',
        buybackYield: '0.8% ($10B authorization)',
        capitalAllocationScore: 'A (High ROIC reinvestment into cloud infrastructure and logistics automation)',
        totalReturnForecast: '+24% to +30% total shareholder return over 4–6 months'
      },
      finalVerdict: {
        signal: 'BUY',
        summary: 'High-conviction core compounder. Enter in the $198–$205 zone with target at $255 (4–6M) and strict stop loss at $184.',
        horizonNote: 'Optimal 4–6 month institutional holding horizon.'
      }
    }
  },

  // ── 7. TRENT (INDIA) ─────────────────────────────────────────────────────
  {
    id: 'TRENT',
    symbol: 'TRENT',
    name: 'Trent Limited (Tata Group)',
    country: 'INDIA',
    exchange: 'NSE',
    tickerAlias: ['TRENT', 'Trent Ltd', 'NSE:TRENT', 'BSE:500251'],
    sector: 'FMCG & Retail',
    industry: 'Fast Fashion & Value Retail (Zudio & Westside)',
    capTier: 'Large-Cap',
    index: 'NIFTY 50',
    currency: 'INR',
    cmp: 6420.00,
    change24h: 115.00,
    changePct24h: 1.82,
    high52w: 8345.00,
    low52w: 3950.00,
    pe: 78.4,
    marketCapStr: '₹2.28 Lakh Cr',
    tradingViewSymbol: 'NSE:TRENT',
    scores: {
      fundamentalQuality: 18.4,
      earningsGrowth: 14.8,
      valuation: 10.5,
      technicalStructure: 13.8,
      macroEnvironment: 14.0,
      sectorStrength: 9.3,
      flowSentiment: 4.6,
      riskCatalyst: 4.6,
      totalScore: 90.0,
      momentumScore: 89,
      riskScore: 28
    },
    entryPlan: {
      currentPrice: 6420.00,
      entryZone: {
        primary: '₹6,150 – ₹6,450',
        secondaryDip: '₹5,800 – ₹6,000',
        range: '₹5,900 – ₹6,450'
      },
      stopLoss: {
        price: 5540.00,
        formatted: '₹5,540.00',
        pct: -13.7,
        structuralLevel: 'Key 200-day moving average and previous major multi-month breakout retest zone'
      },
      target1: {
        price: 7250.00,
        formatted: '₹7,250.00',
        expectedReturnPct: 12.9,
        timeframe: '1–2 Months',
        rationale: 'Retest of 50-day moving average and intermediate resistance'
      },
      target2: {
        price: 8200.00,
        formatted: '₹8,200.00',
        expectedReturnPct: 27.7,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: Zudio store expansion hitting 650+ outlets and Star Bazaar grocery turnaround'
      },
      target3: {
        price: 9100.00,
        formatted: '₹9,100.00',
        expectedReturnPct: 41.7,
        timeframe: '6–9 Months',
        rationale: 'Expansion toward ₹10,000 mark on international Middle East pilot expansion'
      },
      riskPct: 13.7,
      expectedReturnPct: 27.7,
      riskRewardRatio: '2.02 : 1',
      confidenceScore: 86,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below ₹5,500 breaking the primary 200-day trendline',
        'Same-Store-Sales-Growth (SSSG) turning negative or dropping below 6%',
        'Operating margin collapsing due to aggressive discounting wars from Reliance Yousta or Aditya Birla Style Up'
      ],
      investmentThesis: 'Tata Group’s fast-fashion juggernaut (Zudio) is the most successful retail format in modern Indian history. Generates industry-leading sales per square foot (₹16,500+) with a rapid store payback period under 18 months, self-funded through internal cash generation.'
    },
    azResearch: {
      business: {
        summary: 'Fastest growing lifestyle retail company in India, operating value fast-fashion chain Zudio, premium lifestyle department chain Westside, footwear chain Utsa, and supermarket chain Star Bazaar in partnership with Tesco.',
        revenueSources: [
          { segment: 'Zudio (Value Fast Fashion)', sharePct: 62.5 },
          { segment: 'Westside (Premium Lifestyle)', sharePct: 31.0 },
          { segment: 'Star Bazaar & JV Joint Ventures', sharePct: 6.5 }
        ],
        mainProducts: ['Zudio Apparel & Footwear (under ₹999)', 'Zudio Beauty & Personal Care', 'Westside Private Labels'],
        domesticVsIntl: 'India 99%, International pilot stores 1%',
        coreAdvantage: 'Fast 15-day design-to-shelf supply chain cycle, 100% proprietary private label model with zero third-party brands.'
      },
      businessModel: {
        description: 'Direct-to-consumer private label fast-fashion with aggressive price points (90% of inventory under ₹999) generating high volume asset turnover and negative working capital.',
        recurringVsCyclical: 'High frequency repeat purchases; youth demographic treats Zudio as impulse fashion shopping.',
        customerConcentration: 'Broad aspirational middle-class demographic across Tier-1, Tier-2, and Tier-3 Indian cities.',
        pricingPower: 'Extreme value positioning makes it virtually inflation-proof; consumers trade down to Zudio during economic slowdowns.'
      },
      competitiveAdvantage: {
        moat: 'Proprietary design-to-store speed (Zara of India at 1/5th the price), direct factory sourcing, and Tata Group trust.',
        brandStrength: 'Cult viral following among Gen-Z and young college shoppers across India.',
        technology: 'Data-driven localized inventory replenishment algorithms minimizing unsold dead stock.',
        distribution: 'Over 600 Zudio stores and 240 Westside stores across 160+ cities.',
        costAdvantage: 'High inventory turnover (5.5x) eliminates warehouse storage overhead.',
        networkEffects: 'High footfall density attracts prime mall and high-street real estate at preferential rental lease terms.',
        marketShare: 'Dominant leader in organized Indian fast fashion under ₹1,000.'
      },
      debt: {
        totalDebt: '₹4,850 Cr (Primarily IND-AS 116 store lease liabilities)',
        netDebt: 'Net Cash Positive on operational borrowing',
        debtToEquity: 0.12, // Excluding lease liabilities
        interestCoverage: '9.4x',
        maturityProfile: 'Zero long-term bank borrowings; stores self-funded from operating cash flows.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '₹14,800 Cr (TTM)',
        ebitda: '₹2,380 Cr',
        ebit: '₹1,640 Cr',
        netProfit: '₹1,520 Cr',
        eps: '₹42.80',
        operatingMargin: '16.1%',
        netMargin: '10.3%',
        earningsGrowthYoY: '+48.5% YoY revenue growth, +62% profit growth',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'May 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '₹2,150 Cr',
        capex: '₹920 Cr (Opening 180–200 new Zudio stores annually)',
        freeCashFlow: '₹1,230 Cr',
        fcfConversion: '80.9% of net profit',
        quality: 'Pristine cash flow; 100% of sales are paid immediately at cash counters via UPI or cards.'
      },
      growth: {
        historical3yCAGR: '44.8% revenue CAGR',
        expectedForwardGrowth: '30–35% forward revenue CAGR through 2028',
        tam: 'Indian unorganized apparel market is over $80 Billion, rapidly shifting to organized value retail',
        expansionVectors: ['Zudio store count expanding toward 1,000 stores', 'Zudio Beauty and cosmetics expansion', 'Star Bazaar grocery format turnaround with Tesco'],
        capacityExpansion: 'Opening a new Zudio store every 2.5 days.'
      },
      holdings: {
        promoterOrInsiders: 'Tata Sons & Tata Family Trusts: 37.0% (Zero pledge, bedrock governance)',
        institutionalOwnership: '42.5%',
        fiiOrForeignHoldings: '26.8%',
        diiOrMutualFunds: '15.7%',
        retailOwnership: '20.5%',
        recentTrend: 'Nifty 50 index inclusion drove massive passive tracking ETF inflows.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Net Inflows',
        recentDeals: 'Tata Sons maintaining steadfast strategic holding.'
      },
      judgement: {
        verdict: 'High-momentum growth stock offering attractive 4–6 month risk-reward after healthy 23% correction from peak. Accumulate in the ₹6,150–₹6,450 range.',
        evidenceSummary: 'Fastest growing large retailer in emerging markets, 45%+ top-line growth, self-funding store rollouts, and unmatched Tata brand prestige.',
        convictionLevel: 'Selective Conviction'
      },
      keyRisks: [
        'High valuation multiple (78x P/E) leaves limited margin of safety for quarterly earnings misses',
        'Competition from deep-pocketed conglomerates (Reliance Yousta, Aditya Birla Style Up, Max Fashion)',
        'Cannibalization in Tier-1 cities as Zudio store density increases'
      ],
      liquidity: {
        dailyVolume: '₹850 Cr / day on NSE',
        avgVolume30d: '1.4M shares',
        bidAskSpread: '0.03%',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'Low sensitivity; consumers trade down to value fast fashion during tight economic cycles.',
        currencyFx: 'Low sensitivity; domestic sourcing from textile hubs in Tirupur, Surat, and Ludhiana.',
        commodityEnergy: 'Cotton and polyester yarn prices impact gross margins, but low inventory duration mitigates risk.',
        inflationRecession: 'Anti-fragile format; Zudio outperforms during inflationary periods due to sub-₹999 price point.',
        liquidityExpansion: 'High-beta domestic retail consumption proxy.'
      },
      news: [
        {
          headline: 'Trent Q3 Revenue Surges 52% YoY with Zudio Adding 54 New Stores in a Single Quarter',
          fact: 'Company crossed 600 Zudio stores nationwide with standalone EBITDA margins reaching 16.5%.',
          marketInterpretation: 'Confirms structural momentum remains intact without any signs of growth deceleration.',
          speculation: 'Zudio international stores in Dubai and GCC region under advanced feasibility planning.',
          date: 'Recent'
        },
        {
          headline: 'Star Bazaar Grocery Format Turns Operationally EBITDA Positive on Clustered Store Model',
          fact: 'Joint venture with Tesco achieved positive store-level economics across Maharashtra and Karnataka.',
          marketInterpretation: 'Eliminates a historical multi-year drag on Trent’s consolidated return ratios.',
          speculation: 'Targeting standalone profitability by FY27.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '₹6,000 – ₹6,300 previous breakout support block',
        supplyZones: '₹7,400 – ₹7,800 intermediate supply node',
        keySupport: '₹6,150 (100-day EMA) / ₹5,600 (200-day EMA)',
        keyResistance: '₹6,850 / ₹7,500',
        breakoutLevels: 'Weekly close above ₹7,200 confirms resumption of primary bull trend',
        breakdownLevels: 'Below ₹5,500 signals structural trend failure',
        institutionalVolumeNodes: 'Major institutional accumulation shelf at ₹6,250'
      },
      profitability: {
        roe: '28.4%',
        roce: '34.2%',
        roic: '38.5%',
        grossMargin: '45.2%',
        operatingMargin: '16.1%',
        netMargin: '10.3%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'The gold standard of value retail execution with pristine Tata governance and peerless growth.'
      },
      relativeStrength: {
        vsBenchmark: '+68% outperformance vs NIFTY 50 over past 12 months',
        vsSector: 'Crushing all retail competitors (Shoppers Stop, Aditya Birla Fashion, Page Industries)',
        vsPeers: 'Operating margins 400 bps higher than unbranded peers',
        rsRating: 93
      },
      sentiment: {
        analystConsensus: '78% Buy / 22% Hold / 0% Sell (Average Target: ₹7,850)',
        institutionalStance: 'Must-own consumer discretionary growth compounder in India',
        optionsFlowSkew: 'Bullish call positions targeting ₹7,000 and ₹7,500 strikes',
        retailSentiment: 'Extremely popular retail brand; shoppers actively buy the stock',
        fiiDiiSentiment: 'Domestic mutual funds overweight despite elevated headline P/E'
      },
      technicalSetup: {
        primaryTrend: 'Secular multi-year uptrend undergoing healthy 23% retracement to 100-day EMA support',
        structure: 'Rounding consolidation base with volume drying up during down days',
        movingAverages: 'Testing 50-day EMA (₹6,680) with 200-day EMA at ₹5,580',
        rsi: 54.2,
        macd: 'Daily MACD histogram contracting towards bullish zero-line crossover',
        setupName: 'High-Tight Base Retest on Key Support'
      },
      upside: {
        calculationBasis: 'FY27E projected EPS of ₹98 @ 82x multiple backed by 35% compound earnings growth',
        targetUpsidePct: 27.7,
        bullScenario: '₹9,100 (+41.7%) if Zudio store count crosses 850 outlets',
        baseScenario: '₹8,200 (+27.7%) on base execution'
      },
      valuation: {
        rating: 'OVERVALUED',
        pe: 78.4,
        sectorPe: 48.2,
        peg: 1.62,
        pb: 22.4,
        evEbitda: 42.1,
        historicalContext: 'Stock commands premium multiple due to 45%+ compounding growth and negative working capital.'
      },
      whyNow: {
        timingRationale: 'The stock has corrected 23% from its high of ₹8,345, providing the best risk-reward entry window in 9 months. Quarterly store additions remain at record highs with zero demand slowdown.',
        immediateTrigger: 'Upcoming quarterly results showing another 45%+ YoY top-line expansion.'
      },
      xFactor: {
        catalyst: 'Piloting Zudio stores in international markets (Middle East / GCC) with 3x higher purchasing power.',
        impactPotential: 'Unlocks massive new foreign currency addressable market.'
      },
      yieldReturn: {
        dividendYield: '0.12% (₹3.20/share)',
        buybackYield: '0.0%',
        capitalAllocationScore: 'A+ (Reinvesting cash flows at 38% ROIC)',
        totalReturnForecast: '+28% to +35% expected 4–6 month total return'
      },
      finalVerdict: {
        signal: 'ACCUMULATE',
        summary: 'Exceptional retail compounder on pullbacks. Accumulate in the ₹6,150–₹6,450 zone with target at ₹8,200 (4–6M) and stop loss at ₹5,540.',
        horizonNote: 'High-growth 4–6 month swing investment.'
      }
    }
  },

  // ── 8. PLTR (USA) ────────────────────────────────────────────────────────
  {
    id: 'PLTR',
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc.',
    country: 'USA',
    exchange: 'NYSE',
    tickerAlias: ['PLTR', 'Palantir', 'NYSE:PLTR'],
    sector: 'Enterprise AI & Defense Software',
    industry: 'Ontology, Artificial Intelligence Platform (AIP) & National Security',
    capTier: 'Large-Cap',
    index: 'S&P 500 / Russell 1000',
    currency: 'USD',
    cmp: 64.20,
    change24h: 1.85,
    changePct24h: 2.97,
    high52w: 72.85,
    low52w: 20.40,
    pe: 82.5,
    marketCapStr: '$144.5B',
    tradingViewSymbol: 'NYSE:PLTR',
    scores: {
      fundamentalQuality: 18.5,
      earningsGrowth: 14.8,
      valuation: 10.2,
      technicalStructure: 14.5,
      macroEnvironment: 14.2,
      sectorStrength: 9.6,
      flowSentiment: 4.8,
      riskCatalyst: 4.7,
      totalScore: 91.3,
      momentumScore: 96,
      riskScore: 29
    },
    entryPlan: {
      currentPrice: 64.20,
      entryZone: {
        primary: '$59.00 – $64.50',
        secondaryDip: '$54.00 – $57.50',
        range: '$55 – $64.50'
      },
      stopLoss: {
        price: 51.50,
        formatted: '$51.50',
        pct: -19.7,
        structuralLevel: 'Key 50-day moving average and previous major multi-month breakout platform'
      },
      target1: {
        price: 74.00,
        formatted: '$74.00',
        expectedReturnPct: 15.2,
        timeframe: '1–2 Months',
        rationale: 'Breakout above recent all-time high resistance'
      },
      target2: {
        price: 88.00,
        formatted: '$88.00',
        expectedReturnPct: 37.0,
        timeframe: '4–6 Months',
        rationale: 'Primary institutional target: US commercial AIP revenue doubling and NATO defense contract expansions'
      },
      target3: {
        price: 105.00,
        formatted: '$105.00',
        expectedReturnPct: 63.5,
        timeframe: '6–9 Months',
        rationale: 'Blue-sky expansion as Palantir becomes the default enterprise AI operating system'
      },
      riskPct: 19.7,
      expectedReturnPct: 37.0,
      riskRewardRatio: '1.88 : 1',
      confidenceScore: 88,
      holdingHorizon: '4–6 Months',
      invalidationConditions: [
        'Weekly close below $50 breaking the parabolic ascending channel',
        'US Commercial customer count growth dropping below 40% YoY',
        'Operating margin contracting by > 300 bps'
      ],
      investmentThesis: 'Palantir’s Artificial Intelligence Platform (AIP) is the single most successful enterprise AI software deployment engine in the world. US commercial revenue is accelerating past 54% YoY, defense government spending is surging under NATO and US DoD modernization, and the company is operating with zero debt and 40%+ Rule of 40 score.'
    },
    azResearch: {
      business: {
        summary: 'Pioneer in data integration, operational ontology software, and enterprise Artificial Intelligence Platform (AIP), serving Western defense intelligence agencies and Fortune 500 commercial enterprises.',
        revenueSources: [
          { segment: 'Government & Defense (DoD, Intelligence, NATO)', sharePct: 54.0 },
          { segment: 'Commercial Enterprise (Healthcare, Energy, Finance)', sharePct: 46.0 }
        ],
        mainProducts: ['Palantir AIP (Artificial Intelligence Platform)', 'Palantir Foundry (Enterprise Operations)', 'Palantir Gotham (Defense Intelligence)', 'Apollo (Autonomous Deployment)'],
        domesticVsIntl: 'USA 66%, International (UK, Europe, Asia-Pacific) 34%',
        coreAdvantage: 'Proprietary enterprise data ontology connects messy legacy siloed databases into a unified real-time operational digital twin.'
      },
      businessModel: {
        description: 'High-margin recurring annual and multi-year software enterprise subscriptions with rapid bootcamps converting pilot users into million-dollar enterprise contracts.',
        recurringVsCyclical: 'Government contracts are multi-year and non-cyclical; commercial subscriptions have high net retention (118%+).',
        customerConcentration: 'US government is largest customer cohort, but commercial customer count grew 83% YoY to over 380 corporations.',
        pricingPower: 'Tremendous pricing power; delivers demonstrable ROI in days rather than multi-year IT consulting projects.'
      },
      competitiveAdvantage: {
        moat: 'IL6 (Impact Level 6) top-secret US military security clearance, deep proprietary ontology architecture, and unmatched bootcamps.',
        brandStrength: 'Unrivaled prestige in national defense technology and enterprise AI deployment.',
        technology: 'AIP enables LLMs to take actual operational actions against enterprise data safely with guardrails.',
        distribution: 'Direct salesforce and major cloud partnerships with Microsoft Azure, Amazon AWS, and Oracle Cloud.',
        costAdvantage: 'Zero hardware manufacturing cost; pure high-margin software gross margins of 82%.',
        networkEffects: 'Enterprises building workflows on Palantir Ontology become dependent on it for daily decisions.',
        marketShare: 'Leader in government defense intelligence software; fastest growing enterprise AI platform.'
      },
      debt: {
        totalDebt: '$0 (Zero Debt)',
        netDebt: '-$4.8B (Net Cash Positive with $4.8B in cash & US Treasuries)',
        debtToEquity: 0.0,
        interestCoverage: 'Pristine (Earns $220M+ annual interest income)',
        maturityProfile: 'Zero debt balance sheet.',
        refinancingRisk: 'Low'
      },
      earnings: {
        revenue: '$2.85B (TTM)',
        ebitda: '$920M',
        ebit: '$780M',
        netProfit: '$640M',
        eps: '$0.28',
        operatingMargin: '38.0% (Adjusted Operating Margin)',
        netMargin: '22.5%',
        earningsGrowthYoY: '+30.2% YoY revenue growth, +85% net income growth',
        latestQuarterBeat: 'BEAT',
        earningsDate: 'May 2026'
      },
      freeCashFlow: {
        operatingCashFlow: '$1.12B',
        capex: '$18M (Ultra-light software model)',
        freeCashFlow: '$1.10B',
        fcfConversion: '172% of GAAP net profit',
        quality: 'Top 1% free cash flow conversion efficiency across global software.'
      },
      growth: {
        historical3yCAGR: '24.2%',
        expectedForwardGrowth: '32–36% forward revenue CAGR, 50%+ EPS CAGR',
        tam: 'Global enterprise software and defense intelligence TAM exceeding $1.0 Trillion',
        expansionVectors: ['US Commercial AIP scaling across 1,000+ corporations', 'Titan ground intelligence vehicle defense contract ($178M prototype)', 'NATO and allied sovereign defense deployments'],
        capacityExpansion: 'Conducted over 1,400 AIP bootcamps in past 12 months.'
      },
      holdings: {
        promoterOrInsiders: 'Peter Thiel, Alex Karp, Stephen Cohen: ~9.2% voting control (Class F super-voting shares)',
        institutionalOwnership: '48.5% (Surging rapidly post S&P 500 inclusion)',
        fiiOrForeignHoldings: 'Broad international participation',
        diiOrMutualFunds: 'S&P 500 passive funds (SPY, VOO) bought tens of millions of shares during index inclusion',
        retailOwnership: '42.3%',
        recentTrend: 'Institutional holding percentage increased from 36% to 48% over past 12 months.'
      },
      insiderActivity: {
        insiderTrend: 'Neutral',
        institutionalTrend: 'Aggressive Accumulation',
        recentDeals: 'Alex Karp Rule 10b5-1 pre-scheduled option exercises completed.'
      },
      judgement: {
        verdict: 'Highest momentum enterprise AI software stock in the world for 4–6 months. Enter on consolidations between $58–$64 with target of $88.',
        evidenceSummary: 'S&P 500 inclusion completed, US commercial revenue accelerating > 50%, debt-free balance sheet with $4.8B net cash, and unrivaled defense ontology moat.',
        convictionLevel: 'High Conviction'
      },
      keyRisks: [
        'Extremely elevated valuation multiple (82x forward P/E) creates high volatility on any guidance slowdown',
        'Lumpy timing of mega-million dollar US defense contract awards',
        'Stock-based compensation (SBC) dilution although GAAP profitable'
      ],
      liquidity: {
        dailyVolume: '$3.8 Billion / day',
        avgVolume30d: '62M shares',
        bidAskSpread: '0.01%',
        institutionalTradability: 'High Institutional Liquidity'
      },
      macroSensitivity: {
        interestRates: 'High cash balance ($4.8B) earns interest; corporate efficiency software demand increases as companies seek to cut headcount with AI.',
        currencyFx: 'Low sensitivity; contracts with foreign defense ministries are priced in USD or GBP.',
        commodityEnergy: 'Zero sensitivity to commodity prices.',
        inflationRecession: 'High defense budget resilience; commercial customers buy AIP specifically to reduce operational costs.',
        liquidityExpansion: 'Exceptional beta to institutional AI software capital allocation.'
      },
      news: [
        {
          headline: 'Palantir US Commercial Revenue Surges 54% YoY with Customer Count Up 83%',
          fact: 'Company closed 104 deals worth over $1M each in latest quarter.',
          marketInterpretation: 'Proves Palantir AIP is winning enterprise market share faster than traditional consultants or hyperscaler toolkits.',
          speculation: 'US commercial revenue to surpass government revenue within 24 months.',
          date: 'Recent'
        },
        {
          headline: 'US Army Awards Palantir Prime Contractor Contract for TITAN Tactical AI Ground System',
          fact: 'First time a pure software and AI company has been chosen as prime hardware-software integrator for the US Army.',
          marketInterpretation: 'Disrupts legacy defense contractors (Lockheed, Raytheon, General Dynamics).',
          speculation: 'Opens door to multi-billion dollar production phases.',
          date: 'Recent'
        }
      ],
      orderStructure: {
        demandZones: '$56.00 – $61.00 institutional demand support base',
        supplyZones: '$70.00 – $73.00 previous all-time high resistance',
        keySupport: '$58.00 (20-day EMA) / $52.00 (50-day EMA)',
        keyResistance: '$68.50 / $72.85',
        breakoutLevels: 'Break above $73.00 initiates parabolic blue-sky run to $90+',
        breakdownLevels: 'Below $50 breaks medium-term uptrend',
        institutionalVolumeNodes: 'High volume shelf at $61.50'
      },
      profitability: {
        roe: '18.2%',
        roce: '22.4%',
        roic: '21.5%',
        grossMargin: '81.8%',
        operatingMargin: '38.0% (Adjusted)',
        netMargin: '22.5%'
      },
      quality: {
        rating: 'EXCELLENT',
        justification: 'Zero debt, $4.8B net cash, 82% gross margins, and unmatched geopolitical software moat.'
      },
      relativeStrength: {
        vsBenchmark: '+184% outperformance vs S&P 500 over past 12 months',
        vsSector: 'Top performing enterprise software stock in the world',
        vsPeers: 'Crushing Snowflake, Datadog, C3.ai, and Salesforce in AI revenue conversion',
        rsRating: 98
      },
      sentiment: {
        analystConsensus: '62% Buy / 28% Hold / 10% Sell (Target: $75.00, analysts forced into continuous upward revisions)',
        institutionalStance: 'Rapidly converting skeptics into mandatory core portfolio weights post-S&P 500 inclusion',
        optionsFlowSkew: 'Aggressive call buying in out-of-the-money $75, $85, and $100 strikes',
        retailSentiment: 'Passionate and loyal retail shareholder base',
        fiiDiiSentiment: 'Global quantitative and thematic AI funds heavily accumulating'
      },
      technicalSetup: {
        primaryTrend: 'Strong institutional momentum uptrend riding the 20-day exponential moving average',
        structure: 'Consolidation flag resting just below record highs on low volume',
        movingAverages: 'Trading above 20-day ($61.80), 50-day ($54.20) and 200-day ($36.50) EMAs',
        rsi: 66.8,
        macd: 'Positive momentum intact',
        setupName: 'High Momentum Consolidation Flag'
      },
      upside: {
        calculationBasis: 'FY26 projected EPS of $0.65 @ 85x forward P/E supported by 40%+ revenue growth',
        targetUpsidePct: 37.0,
        bullScenario: '$105.00 (+63.5%) on hyper-scaling commercial adoption',
        baseScenario: '$88.00 (+37.0%) on base trajectory'
      },
      valuation: {
        rating: 'OVERVALUED',
        pe: 82.5,
        sectorPe: 34.2,
        peg: 1.85,
        pb: 24.8,
        evEbitda: 52.4,
        historicalContext: 'Valuation is elevated, reflecting hyper-growth status and scarcity of real enterprise AI monetization.'
      },
      whyNow: {
        timingRationale: 'AIP bootcamps are translating into massive multi-million dollar annual contract values. With S&P 500 inclusion forcing index funds to hold the stock and defense spending accelerating worldwide, Palantir has structural institutional tailwinds.',
        immediateTrigger: 'NATO and US Army contract execution announcements.'
      },
      xFactor: {
        catalyst: 'Autonomous AI agents executing end-to-end operational supply chain workflows without human intervention.',
        impactPotential: 'Transforms Palantir from software tool into direct corporate labor substitution.'
      },
      yieldReturn: {
        dividendYield: '0.0%',
        buybackYield: '0.0%',
        capitalAllocationScore: 'A (Reinvesting internally with 82% gross margins)',
        totalReturnForecast: '+35% to +45% expected return over 4–6 months'
      },
      finalVerdict: {
        signal: 'BUY',
        summary: 'Top-tier momentum compounder for 4–6 months. Accumulate in the $59–$64.50 range with target at $88 (4–6M) and stop loss at $51.50.',
        horizonNote: 'High-beta growth 4–6 month holding period.'
      }
    }
  }
];
