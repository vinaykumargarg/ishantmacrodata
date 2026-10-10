import { MacroEnvironmentSnapshot, MacroAndNewsEvent, PortfolioStressTest } from '../types/deltaExchange';

export const DELTA_MACRO_SNAPSHOT: MacroEnvironmentSnapshot = {
  fedRateExpectation: '4.25% - 4.50% (25bps rate cut priced at 74% probability)',
  fedRateDecisionDate: 'Next FOMC: 30 Days Out',
  cpiYearOverYear: '2.4% (Core CPI: 2.8% - Disinflationary trend intact)',
  corePceYearOverYear: '2.6% (In line with Fed quarterly projection)',
  dxyIndex: 102.45,
  dxyTrend: 'RANGE',
  us10yYield: '4.08%',
  globalLiquidityIndex: '$32.4T (PBoC & Central Bank easing expanding M2 by +4.2% YoY)',
  btcDominancePct: 58.4,
  stablecoinTotalCapUsd: '$198.5B (+2.4% net inflows 30d trailing)',
  etfNetFlowWeeklyUsd: '+$1.84B (Sustained institutional spot demand)',
  sp500Level: '5,782 (Risk assets near ATH, modest volatility premium)',
  cryptoRiskRegime: 'SELECTIVE_ROTATION'
};

export const DELTA_NEWS_AND_EVENTS: MacroAndNewsEvent[] = [
  {
    id: 'news-1',
    title: 'US SEC & CFTC Clarify Staking and Commodity Treatment Framework',
    category: 'REGULATORY',
    source: 'SEC Regulatory Brief / Bloomberg Terminal',
    publishedAt: '2 hours ago',
    credibility: 'CONFIRMED_OFFICIAL',
    impact: 'BULLISH',
    coinsAffected: ['ETH', 'SOL', 'ADA', 'AVAX'],
    summary: 'Joint agency regulatory draft signals permissive stance toward non-custodial liquid staking protocols, substantially reducing enforcement risk for Layer-1 proof-of-stake ecosystems over the 60-day horizon.'
  },
  {
    id: 'news-2',
    title: 'Global Central Banks Inject $120B in Net Liquidity via Repo Facilities',
    category: 'MACRO',
    source: 'Federal Reserve H.4.1 / PBOC Open Market Operations',
    publishedAt: '5 hours ago',
    credibility: 'CONFIRMED_OFFICIAL',
    impact: 'BULLISH',
    coinsAffected: ['BTC', 'ETH', 'SOL'],
    summary: 'Global synchronized balance sheet stabilization lowers real borrowing rates, fostering a favorable macro liquidity backdrop for crypto investment over the 90-day cycle.'
  },
  {
    id: 'news-3',
    title: 'Delta Exchange India Expands Cross-Margining Options Coverage',
    category: 'ECOSYSTEM',
    source: 'Delta Exchange India Official Announcement',
    publishedAt: '12 hours ago',
    credibility: 'CONFIRMED_OFFICIAL',
    impact: 'BULLISH',
    coinsAffected: ['BTC', 'ETH', 'SOL', 'XRP'],
    summary: 'Enhanced portfolio margining on INR & USDT pairs provides institutional traders with capital efficiency, elevating open interest depth and reducing basis slippage across majors.'
  },
  {
    id: 'news-4',
    title: 'Layer-2 Blob Space Utilization Rises to 92% Following Major Rollup Upgrades',
    category: 'ECOSYSTEM',
    source: 'Etherscan & Dune Analytics Verified',
    publishedAt: '18 hours ago',
    credibility: 'CONFIRMED_OFFICIAL',
    impact: 'BULLISH',
    coinsAffected: ['ETH', 'ARB', 'OP'],
    summary: 'Ethereum EIP-4844 blob gas fee burn rate hits a 4-month high as transaction throughput on Arbitrum and Optimism expands, improving ETH fee capture fundamentals.'
  },
  {
    id: 'news-5',
    title: 'Significant Token Unlock Window Approaching for Major Infrastructure Assets',
    category: 'SECURITY',
    source: 'TokenUnlocks & Messari Research',
    publishedAt: '1 day ago',
    credibility: 'CONFIRMED_OFFICIAL',
    impact: 'BEARISH',
    coinsAffected: ['TIA', 'APT', 'ARB', 'STRK'],
    summary: 'Over $480M in venture cliff unlocks scheduled over the next 30-60 days presents structural supply overhang for high-FDV low-float tokens. Conservative sizing recommended.'
  },
  {
    id: 'news-6',
    title: 'Geopolitical Tensions in Middle East Spark Gold & Stablecoin Flight',
    category: 'GEOPOLITICAL',
    source: 'Reuters Financial Intelligence',
    publishedAt: '2 days ago',
    credibility: 'REPUTABLE_OUTLET',
    impact: 'HIGH_VOLATILITY',
    coinsAffected: ['BTC', 'PAXG', 'XAUT'],
    summary: 'Safe-haven assets saw rapid bid escalation while altcoin leverage got washed out through localized -4% open interest contraction on high-beta names.'
  }
];

export const UPCOMING_ECONOMIC_CALENDAR_90D = [
  { event: 'US CPI Inflation Report (YoY)', date: 'Oct 15, 2026', forecast: '2.3%', previous: '2.4%', impact: 'HIGH' },
  { event: 'FOMC Interest Rate Decision & Powell Presser', date: 'Nov 06, 2026', forecast: '-25 bps', previous: '4.75%', impact: 'CRITICAL' },
  { event: 'US Non-Farm Payrolls (NFP) & Unemployment', date: 'Nov 14, 2026', forecast: '145K / 4.1%', previous: '152K', impact: 'HIGH' },
  { event: 'ECB Governing Council Policy Meeting', date: 'Dec 04, 2026', forecast: '-25 bps', previous: '3.25%', impact: 'MEDIUM' },
  { event: 'Quarterly Derivatives Expiry & Quadruple Witching', date: 'Dec 26, 2026', forecast: 'N/A', previous: 'Record OI', impact: 'CRITICAL' }
];

export const PORTFOLIO_STRESS_TESTS: PortfolioStressTest[] = [
  {
    scenarioName: 'Macro Liquidity Shock / Sharp BTC Flush (-25%)',
    btcShockPct: -25,
    altcoinBetaShockPct: -38,
    liquidityShockPct: -45,
    estimatedPortfolioDrawdownPct: -31.4,
    recoveryHorizonDays: 45,
    mitigationAdvice: 'Maintain at least 35% in stablecoins/cash reserve; enforce strict -7% stop-loss invalidation thresholds and avoid leveraged longs on altcoins during FOMC weeks.'
  },
  {
    scenarioName: 'Regulatory Crackdown on Unregistered Altcoin Securities',
    btcShockPct: -6,
    altcoinBetaShockPct: -32,
    liquidityShockPct: -28,
    estimatedPortfolioDrawdownPct: -21.8,
    recoveryHorizonDays: 60,
    mitigationAdvice: 'Overweight decentralized commodity-grade Layer-1 assets (BTC, ETH) and blue-chip DeFi with audited immutable codebases over high-FDV centralized foundation tokens.'
  },
  {
    scenarioName: 'Concentrated Token Unlock Dilution Cascade',
    btcShockPct: -2,
    altcoinBetaShockPct: -24,
    liquidityShockPct: -18,
    estimatedPortfolioDrawdownPct: -14.6,
    recoveryHorizonDays: 30,
    mitigationAdvice: 'Filter universe by circulating-to-total supply ratio > 65% and exclude assets with > 5% circulating supply unlocks within the 30-90 day horizon.'
  },
  {
    scenarioName: 'Stablecoin Depeg or Banking Settlement Friction',
    btcShockPct: -12,
    altcoinBetaShockPct: -26,
    liquidityShockPct: -55,
    estimatedPortfolioDrawdownPct: -22.5,
    recoveryHorizonDays: 21,
    mitigationAdvice: 'Diversify cash allocation across multi-jurisdictional stablecoins and direct INR/USD balances on Delta Exchange India.'
  }
];
