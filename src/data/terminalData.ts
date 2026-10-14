/* Terminal comprehensive dataset extracted from target terminal specifications */

export interface StockItem {
  symbol: string;
  tv: string;
  yahoo: string;
  name: string;
  market: 'US' | 'IN';
  sector: string;
}

export const ALL_STOCKS: StockItem[] = [
  // US Equities (Top 32)
  { symbol: 'AAPL', tv: 'AAPL', yahoo: 'AAPL', name: 'Apple Inc.', market: 'US', sector: 'Tech' },
  { symbol: 'MSFT', tv: 'MSFT', yahoo: 'MSFT', name: 'Microsoft Corporation', market: 'US', sector: 'Tech' },
  { symbol: 'NVDA', tv: 'NVDA', yahoo: 'NVDA', name: 'NVIDIA Corporation', market: 'US', sector: 'Semis' },
  { symbol: 'AMZN', tv: 'AMZN', yahoo: 'AMZN', name: 'Amazon.com Inc.', market: 'US', sector: 'Consumer' },
  { symbol: 'GOOGL', tv: 'GOOGL', yahoo: 'GOOGL', name: 'Alphabet Inc.', market: 'US', sector: 'Tech' },
  { symbol: 'META', tv: 'META', yahoo: 'META', name: 'Meta Platforms Inc.', market: 'US', sector: 'Tech' },
  { symbol: 'TSLA', tv: 'TSLA', yahoo: 'TSLA', name: 'Tesla Inc.', market: 'US', sector: 'Auto' },
  { symbol: 'AVGO', tv: 'AVGO', yahoo: 'AVGO', name: 'Broadcom Inc.', market: 'US', sector: 'Semis' },
  { symbol: 'AMD', tv: 'AMD', yahoo: 'AMD', name: 'Advanced Micro Devices', market: 'US', sector: 'Semis' },
  { symbol: 'NFLX', tv: 'NFLX', yahoo: 'NFLX', name: 'Netflix Inc.', market: 'US', sector: 'Media' },
  { symbol: 'PLTR', tv: 'PLTR', yahoo: 'PLTR', name: 'Palantir Technologies', market: 'US', sector: 'Tech' },
  { symbol: 'COIN', tv: 'COIN', yahoo: 'COIN', name: 'Coinbase Global', market: 'US', sector: 'Crypto' },
  { symbol: 'MSTR', tv: 'MSTR', yahoo: 'MSTR', name: 'MicroStrategy Inc.', market: 'US', sector: 'Crypto' },
  { symbol: 'JPM', tv: 'JPM', yahoo: 'JPM', name: 'JPMorgan Chase & Co.', market: 'US', sector: 'Banks' },
  { symbol: 'V', tv: 'V', yahoo: 'V', name: 'Visa Inc.', market: 'US', sector: 'Financials' },
  { symbol: 'LLY', tv: 'LLY', yahoo: 'LLY', name: 'Eli Lilly and Company', market: 'US', sector: 'Healthcare' },
  { symbol: 'WMT', tv: 'WMT', yahoo: 'WMT', name: 'Walmart Inc.', market: 'US', sector: 'Consumer' },
  { symbol: 'COST', tv: 'COST', yahoo: 'COST', name: 'Costco Wholesale Corp', market: 'US', sector: 'Consumer' },
  { symbol: 'SPY', tv: 'SPY', yahoo: 'SPY', name: 'S&P 500 ETF Trust', market: 'US', sector: 'Index' },
  { symbol: 'QQQ', tv: 'QQQ', yahoo: 'QQQ', name: 'Invesco QQQ ETF', market: 'US', sector: 'Index' },

  // Indian NIFTY 100 Equities
  { symbol: 'RELIANCE', tv: 'NSE:RELIANCE', yahoo: 'RELIANCE.NS', name: 'Reliance Industries', market: 'IN', sector: 'Energy' },
  { symbol: 'TCS', tv: 'NSE:TCS', yahoo: 'TCS.NS', name: 'Tata Consultancy Services', market: 'IN', sector: 'IT' },
  { symbol: 'HDFCBANK', tv: 'NSE:HDFCBANK', yahoo: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', market: 'IN', sector: 'Banks' },
  { symbol: 'ICICIBANK', tv: 'NSE:ICICIBANK', yahoo: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', market: 'IN', sector: 'Banks' },
  { symbol: 'INFY', tv: 'NSE:INFY', yahoo: 'INFY.NS', name: 'Infosys Limited', market: 'IN', sector: 'IT' },
  { symbol: 'BHARTIARTL', tv: 'NSE:BHARTIARTL', yahoo: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', market: 'IN', sector: 'Telecom' },
  { symbol: 'SBIN', tv: 'NSE:SBIN', yahoo: 'SBIN.NS', name: 'State Bank of India', market: 'IN', sector: 'Banks' },
  { symbol: 'ITC', tv: 'NSE:ITC', yahoo: 'ITC.NS', name: 'ITC Limited', market: 'IN', sector: 'FMCG' },
  { symbol: 'LT', tv: 'NSE:LT', yahoo: 'LT.NS', name: 'Larsen & Toubro Ltd', market: 'IN', sector: 'Infra' },
  { symbol: 'HINDUNILVR', tv: 'NSE:HINDUNILVR', yahoo: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', market: 'IN', sector: 'FMCG' },
  { symbol: 'KOTAKBANK', tv: 'NSE:KOTAKBANK', yahoo: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', market: 'IN', sector: 'Banks' },
  { symbol: 'AXISBANK', tv: 'NSE:AXISBANK', yahoo: 'AXISBANK.NS', name: 'Axis Bank Ltd', market: 'IN', sector: 'Banks' },
  { symbol: 'BAJFINANCE', tv: 'NSE:BAJFINANCE', yahoo: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', market: 'IN', sector: 'NBFC' },
  { symbol: 'MARUTI', tv: 'NSE:MARUTI', yahoo: 'MARUTI.NS', name: 'Maruti Suzuki India', market: 'IN', sector: 'Auto' },
  { symbol: 'SUNPHARMA', tv: 'NSE:SUNPHARMA', yahoo: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', market: 'IN', sector: 'Pharma' },
  { symbol: 'TATAMOTORS', tv: 'NSE:TATAMOTORS', yahoo: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', market: 'IN', sector: 'Auto' },
  { symbol: 'TATASTEEL', tv: 'NSE:TATASTEEL', yahoo: 'TATASTEEL.NS', name: 'Tata Steel Ltd', market: 'IN', sector: 'Metals' },
  { symbol: 'ADANIENT', tv: 'NSE:ADANIENT', yahoo: 'ADANIENT.NS', name: 'Adani Enterprises Ltd', market: 'IN', sector: 'Conglomerate' },
  { symbol: 'ZOMATO', tv: 'NSE:ZOMATO', yahoo: 'ZOMATO.NS', name: 'Zomato Limited', market: 'IN', sector: 'Consumer' },
  { symbol: 'HAL', tv: 'NSE:HAL', yahoo: 'HAL.NS', name: 'Hindustan Aeronautics Ltd', market: 'IN', sector: 'Defence' },
  { symbol: 'TITAN', tv: 'NSE:TITAN', yahoo: 'TITAN.NS', name: 'Titan Company Ltd', market: 'IN', sector: 'Consumer' }
];

/* ── Crypto Engine Datasets ── */
export const ENGINE_SCORES = [
  { label: 'Macro', value: 72, weight: 0.12 },
  { label: 'Liquidity', value: 81, weight: 0.15 },
  { label: 'ETF', value: 76, weight: 0.14 },
  { label: 'On-chain', value: 69, weight: 0.13 },
  { label: 'Derivatives', value: 63, weight: 0.10 },
  { label: 'Whales', value: 74, weight: 0.10 },
  { label: 'Stablecoins', value: 82, weight: 0.10 },
  { label: 'Technical', value: 78, weight: 0.10 },
  { label: 'Sentiment', value: 61, weight: 0.06 }
];

export const REGIME_DETECTOR = [
  { name: 'ACCUMULATION', conditions: ['Price sideways', 'Exchange reserves ↓', 'Long-term holders ↑', 'ETF flows ↑', 'Funding neutral', 'OI controlled'], match: 55 },
  { name: 'BULL TREND', conditions: ['Price ↑', 'Volume ↑', 'ETF inflows ↑', 'Stablecoin liquidity ↑', 'OI healthy', 'On-chain demand ↑'], match: 82 },
  { name: 'DISTRIBUTION', conditions: ['Price high', 'Whale selling ↑', 'Exchange inflows ↑', 'ETF flows weakening', 'LTH distribution'], match: 18 },
  { name: 'LEVERAGE BLOW-OFF', conditions: ['Price ↑ rapidly', 'OI ↑↑', 'Funding extremely positive', 'Long/Short crowded', 'Liquidations increasing'], match: 34 },
  { name: 'BEAR MARKET', conditions: ['Price ↓', 'ETF outflows', 'On-chain demand weak', 'Liquidity contraction', 'LTH capitulation'], match: 6 }
];

export const LONG_TERM_INVESTOR_PANEL = [
  { factor: 'Global liquidity', weight: 10, read: 'bull', value: 'Global M2 +6.8% YoY' },
  { factor: 'Stablecoin supply', weight: 9, read: 'bull', value: '+$6.4B 30d' },
  { factor: 'BTC ETF flows', weight: 9, read: 'bull', value: '+$3.9B monthly' },
  { factor: 'LTH behaviour', weight: 8, read: 'bull', value: 'LTH supply +128K' },
  { factor: 'MVRV', weight: 7, read: 'neutral', value: '2.1 — mid-cycle' },
  { factor: 'Realized Cap', weight: 6, read: 'bull', value: '$1.04T, rising' },
  { factor: 'Exchange reserves', weight: 7, read: 'bull', value: '2.31M BTC, 6-yr low' },
  { factor: 'Miner behaviour', weight: 4, read: 'neutral', value: 'Reserves flat, hashrate ATH' },
  { factor: 'Corporate holdings', weight: 5, read: 'bull', value: '1.02M BTC, +21K 30d' },
  { factor: 'Issuance / halving', weight: 4, read: 'bull', value: '450 BTC/day post-2024 halving' },
  { factor: 'Regulatory environment', weight: 5, read: 'bull', value: 'US stablecoin law passed' },
  { factor: 'Network adoption', weight: 3, read: 'neutral', value: 'Active addresses flat' },
  { factor: 'Institutional adoption', weight: 5, read: 'bull', value: 'ETF + treasury growth' },
  { factor: 'BTC dominance', weight: 3, read: 'neutral', value: '~57%' },
  { factor: 'ETH/BTC', weight: 3, read: 'neutral', value: 'Basing' },
  { factor: 'DeFi TVL', weight: 3, read: 'bull', value: '$148B' },
  { factor: 'Crypto market cap', weight: 3, read: 'bull', value: '$3.86T' },
  { factor: 'Token unlock pressure', weight: 2, read: 'bear', value: '$358M next 7d' },
  { factor: 'Developer activity', weight: 2, read: 'neutral', value: 'Stable' },
  { factor: 'Macro liquidity', weight: 2, read: 'bull', value: 'Fed easing' }
];

export const ETF_ISSUERS = [
  { ticker: 'IBIT', issuer: 'BlackRock', day: '+$212M', week: '+$940M', holdings: '748K BTC', aum: '$81B' },
  { ticker: 'FBTC', issuer: 'Fidelity', day: '+$64M', week: '+$210M', holdings: '204K BTC', aum: '$22B' },
  { ticker: 'GBTC', issuer: 'Grayscale', day: '-$38M', week: '-$120M', holdings: '178K BTC', aum: '$19B' },
  { ticker: 'ARKB', issuer: 'ARK 21Shares', day: '+$21M', week: '+$66M', holdings: '42K BTC', aum: '$4.6B' },
  { ticker: 'BITB', issuer: 'Bitwise', day: '+$12M', week: '+$48M', holdings: '40K BTC', aum: '$4.3B' },
  { ticker: 'HODL', issuer: 'VanEck', day: '+$6M', week: '+$19M', holdings: '15K BTC', aum: '$1.6B' },
  { ticker: 'BTCO/BRRR', issuer: 'Invesco / Valkyrie', day: '+$4M', week: '+$12M', holdings: '26K BTC', aum: '$2.8B' },
];

export const CORPORATE_TREASURIES = [
  { company: 'MicroStrategy (MSTR)', btc: '632,457', avgPrice: '$73,500', trend: 'Buying', pctMcap: '62%' },
  { company: 'MARA Holdings', btc: '50,639', avgPrice: '$68,200', trend: 'Buying', pctMcap: '88%' },
  { company: 'Twenty One Capital', btc: '43,514', avgPrice: '$92,400', trend: 'Buying', pctMcap: '71%' },
  { company: 'Riot Platforms', btc: '19,225', avgPrice: '$61,900', trend: 'Holding', pctMcap: '45%' },
  { company: 'Metaplanet Inc.', btc: '18,991', avgPrice: '$99,800', trend: 'Buying', pctMcap: '54%' },
  { company: 'Tesla Inc.', btc: '11,509', avgPrice: '$31,600', trend: 'Holding', pctMcap: '0.1%' },
  { company: 'Coinbase Global', btc: '9,267', avgPrice: '$29,400', trend: 'Holding', pctMcap: '1.4%' }
];

export const LIQUIDATION_CLUSTERS_BTC = [
  { level: '+8% ($95.2K)', longs: 0, shorts: 82 },
  { level: '+6% ($93.4K)', longs: 0, shorts: 74 },
  { level: '+4% ($91.6K)', longs: 0, shorts: 58 },
  { level: '+2% ($89.8K)', longs: 0, shorts: 36 },
  { level: 'Spot ($88.1K)', longs: 0, shorts: 0 },
  { level: '-2% ($86.3K)', longs: 44, shorts: 0 },
  { level: '-4% ($84.5K)', longs: 68, shorts: 0 },
  { level: '-6% ($82.8K)', longs: 88, shorts: 0 },
  { level: '-8% ($81.0K)', longs: 61, shorts: 0 }
];

export const LIQUIDATION_CLUSTERS_ETH = [
  { level: '+8% ($2,840)', longs: 0, shorts: 66 },
  { level: '+6% ($2,780)', longs: 0, shorts: 80 },
  { level: '+4% ($2,720)', longs: 0, shorts: 51 },
  { level: '+2% ($2,680)', longs: 0, shorts: 30 },
  { level: 'Spot ($2,630)', longs: 0, shorts: 0 },
  { level: '-2% ($2,570)', longs: 52, shorts: 0 },
  { level: '-4% ($2,520)', longs: 79, shorts: 0 },
  { level: '-6% ($2,470)', longs: 92, shorts: 0 },
  { level: '-8% ($2,420)', longs: 48, shorts: 0 }
];

export const DERIVATIVES_EXCHANGES = [
  { ex: 'Binance', funding: '+0.012%', oi: '$12.1B', liq24: '$148M' },
  { ex: 'Bybit', funding: '+0.018%', oi: '$7.4B', liq24: '$96M' },
  { ex: 'OKX', funding: '+0.010%', oi: '$5.2B', liq24: '$61M' },
  { ex: 'Coinbase Intl', funding: '+0.009%', oi: '$1.1B', liq24: '$12M' },
  { ex: 'Deribit', funding: '—', oi: '$2.8B', liq24: '$9M' },
  { ex: 'CME Group', funding: '—', oi: '$16.9B', liq24: '—' },
  { ex: 'Hyperliquid', funding: '+0.021%', oi: '$3.6B', liq24: '$44M' }
];

export const TOKEN_UNLOCKS = [
  { token: 'SUI', date: 'Upcoming', amount: '44M SUI', usd: '$152M', pctCirc: '1.3%', type: 'Investor + Team', schedule: 'Linear' },
  { token: 'ARB', date: 'Upcoming', amount: '92.6M ARB', usd: '$48M', pctCirc: '1.9%', type: 'Team + Investors', schedule: 'Linear' },
  { token: 'APT', date: 'Upcoming', amount: '11.3M APT', usd: '$58M', pctCirc: '1.8%', type: 'Foundation + Core', schedule: 'Cliff' },
  { token: 'ENA', date: 'Upcoming', amount: '40.6M ENA', usd: '$29M', pctCirc: '0.7%', type: 'Treasury', schedule: 'Linear' },
  { token: 'STRK', date: 'Upcoming', amount: '127M STRK', usd: '$17M', pctCirc: '3.4%', type: 'Investors', schedule: 'Linear' },
  { token: 'ZRO', date: 'Upcoming', amount: '25.7M ZRO', usd: '$54M', pctCirc: '9.8%', type: 'Team + Investors', schedule: 'Cliff' }
];

export const ALTCOINS_DATA = [
  { coin: 'SOL', fdv: '$124B', volMcap: '6.1%', oi: '$6.8B', funding: '+0.02%', liq24: '$38M', users: '3.1M', tvl: '$11.2B', unlock30d: '0.4%', inflation: '4.6%' },
  { coin: 'XRP', fdv: '$302B', volMcap: '3.4%', oi: '$4.1B', funding: '+0.01%', liq24: '$22M', users: '—', tvl: '$0.1B', unlock30d: '1.0% (escrow)', inflation: '—' },
  { coin: 'BNB', fdv: '$120B', volMcap: '1.8%', oi: '$1.4B', funding: '+0.01%', liq24: '$6M', users: '1.9M', tvl: '$7.4B', unlock30d: '0%', inflation: 'Deflationary' },
  { coin: 'DOGE', fdv: '$34B', volMcap: '5.2%', oi: '$2.6B', funding: '+0.03%', liq24: '$29M', users: '—', tvl: '—', unlock30d: '0%', inflation: '3.9%' },
  { coin: 'SUI', fdv: '$36B', volMcap: '7.8%', oi: '$1.9B', funding: '+0.03%', liq24: '$18M', users: '1.2M', tvl: '$2.2B', unlock30d: '2.1%', inflation: '6.4%' },
  { coin: 'ARB', fdv: '$4.8B', volMcap: '9.1%', oi: '$0.4B', funding: '-0.01%', liq24: '$4M', users: '0.7M', tvl: '$2.9B', unlock30d: '1.8%', inflation: '—' }
];

export const DEFI_CHAINS = [
  { chain: 'Ethereum', addr: '512K', tx: '1.3M', fees: '$2.1M', tvl: '$78B', stables: '$142B', dex: '$3.9B', devs: '6,200', revenue: '$1.9M', status: 'Expanding' },
  { chain: 'Solana', addr: '3.1M', tx: '52M', fees: '$1.8M', tvl: '$11.2B', stables: '$12B', dex: '$3.6B', devs: '2,900', revenue: '$1.4M', status: 'Accelerating' },
  { chain: 'BNB Chain', addr: '1.9M', tx: '8.4M', fees: '$0.6M', tvl: '$7.4B', stables: '$9B', dex: '$1.8B', devs: '1,100', revenue: '$0.5M', status: 'Stable' },
  { chain: 'Arbitrum', addr: '0.7M', tx: '2.1M', fees: '$0.2M', tvl: '$2.9B', stables: '$5B', dex: '$0.7B', devs: '900', revenue: '$0.1M', status: 'Cooling' },
  { chain: 'Base', addr: '2.4M', tx: '9.1M', fees: '$0.4M', tvl: '$4.6B', stables: '$4.2B', dex: '$1.1B', devs: '1,400', revenue: '$0.3M', status: 'Cooling' },
  { chain: 'Avalanche', addr: '0.2M', tx: '1.2M', fees: '$0.05M', tvl: '$1.4B', stables: '$1.9B', dex: '$0.2B', devs: '500', revenue: '$0.04M', status: 'Stable' }
];

export const NARRATIVES = [
  { name: 'AI & Compute Agents', score: 84, volume: 'High', mcapGrowth: '+18% 30d', social: 'Very high', drivers: 'Agents, compute tokens, new launches' },
  { name: 'Stablecoins & Payments', score: 81, volume: 'High', mcapGrowth: '+3% 30d', social: 'High', drivers: 'Regulation clarity, payments adoption' },
  { name: 'RWA (Real World Assets)', score: 76, volume: 'Medium', mcapGrowth: '+11% 30d', social: 'Medium', drivers: 'Tokenised treasuries, institutional pilots' },
  { name: 'Prediction Markets', score: 72, volume: 'High', mcapGrowth: '+9%', social: 'High', drivers: 'Volumes at record highs' },
  { name: 'Bitcoin Ecosystem / L2', score: 64, volume: 'Medium', mcapGrowth: '+4%', social: 'Medium', drivers: 'Treasury companies, Runes, Ordinals' },
  { name: 'DeFi & Fee Switches', score: 63, volume: 'Medium', mcapGrowth: '+6%', social: 'Medium', drivers: 'TVL growth, fee switch votes' },
  { name: 'Layer 1 Platforms', score: 60, volume: 'Medium', mcapGrowth: '+5%', social: 'Medium', drivers: 'SOL/SUI activity expansion' },
  { name: 'Restaking & Yield', score: 52, volume: 'Low', mcapGrowth: '-2%', social: 'Low', drivers: 'Yield compression' },
  { name: 'Layer 2 Rollups', score: 46, volume: 'Medium', mcapGrowth: '-4%', social: 'Low', drivers: 'Unlock pressure, fee decline' },
  { name: 'Memecoins & Culture', score: 41, volume: 'High', mcapGrowth: '-12%', social: 'High', drivers: 'Attention rotating to AI utility' }
];

/* ── Desks & Macro Datasets ── */
export const CONFLUENCE_PILLARS = [
  { pillar: 'Inflation', read: 'Falling', score: 72, weight: 20, tone: 'bull', note: 'Headline and core both decelerating — policy path stays easy.' },
  { pillar: 'Growth', read: 'Slowing but positive', score: 54, weight: 20, tone: 'neutral', note: 'Above-trend GDP with cooling hiring: late cycle, not recession.' },
  { pillar: 'Liquidity', read: 'Expanding', score: 68, weight: 20, tone: 'bull', note: 'QT tapering, reserves stable, stablecoin supply rising.' },
  { pillar: 'Policy', read: 'Easing', score: 70, weight: 15, tone: 'bull', note: 'Cuts priced at the next meeting; dot plot implies two more.' },
  { pillar: 'Positioning', read: 'Crowded long', score: 38, weight: 15, tone: 'bear', note: 'Funding positive, long/short skewed — squeeze risk.' },
  { pillar: 'Price Momentum', read: 'Trending up', score: 64, weight: 10, tone: 'bull', note: 'Majors above rising 50/200-day structure.' }
];

export const BULL_BEAR_SCANNER = [
  { asset: 'BTC/USD', trend: 'bull', momentum: 78, macroFit: 74, verdict: 'BULL', trigger: 'Holds above 84,900 swing low' },
  { asset: 'ETH/USD', trend: 'bull', momentum: 69, macroFit: 71, verdict: 'BULL', trigger: 'ETH/BTC base breakout above 0.038' },
  { asset: 'SOL/USD', trend: 'bull', momentum: 74, macroFit: 66, verdict: 'BULL', trigger: 'Reclaim of 120 pivot' },
  { asset: 'XAU/USD', trend: 'bull', momentum: 71, macroFit: 80, verdict: 'BULL', trigger: 'Real yields below 1.70%' },
  { asset: 'DXY', trend: 'bear', momentum: 34, macroFit: 30, verdict: 'BEAR', trigger: 'Loses 101.4 support' },
  { asset: 'US 500 (SPX)', trend: 'neutral', momentum: 56, macroFit: 48, verdict: 'MIXED', trigger: 'Breadth confirmation needed' },
  { asset: 'Crude (WTI)', trend: 'bear', momentum: 38, macroFit: 42, verdict: 'BEAR', trigger: 'Demand downgrades persist' },
  { asset: 'US 10Y Yield', trend: 'bear', momentum: 40, macroFit: 62, verdict: 'BEAR', trigger: 'Softer labour data prints' }
];

export const CENTRAL_BANKS = [
  { bank: 'Federal Reserve', rate: '3.25–3.50%', stance: 'Cutting', next: 'Cut 25bps priced', tone: 'bull' },
  { bank: 'ECB (Eurozone)', rate: '2.25%', stance: 'On hold', next: 'No change expected', tone: 'neutral' },
  { bank: 'Bank of England', rate: '3.75%', stance: 'Cutting slowly', next: 'Cut ~45% priced', tone: 'bull' },
  { bank: 'Bank of Japan', rate: '0.75%', stance: 'Hiking', next: 'Hike risk — carry unwind watch', tone: 'bear' },
  { bank: 'PBoC (China)', rate: '2.90% (1Y LPR)', stance: 'Easing', next: 'RRR cut expected', tone: 'bull' },
  { bank: 'Swiss National Bank', rate: '0.25%', stance: 'Neutral', next: 'No change', tone: 'neutral' }
];

export const CORRELATIONS_MATRIX = [
  { pair: 'BTC vs Nasdaq 100', d30: 0.68, d90: 0.61, note: 'Crypto still trades as long-duration tech risk.' },
  { pair: 'BTC vs Gold', d30: 0.24, d90: 0.31, note: 'Shared debasement bid, different volatility profiles.' },
  { pair: 'Gold vs DXY', d30: -0.42, d90: -0.38, note: 'Weaker dollar supports bullion structural bid.' },
  { pair: 'Gold vs 10Y Real Yield', d30: -0.61, d90: -0.57, note: 'The cleanest macro gold driver.' },
  { pair: 'S&P 500 vs 10Y Yield', d30: -0.29, d90: -0.18, note: 'Yields matter again above ~4.25%.' },
  { pair: 'DXY vs EM Equities', d30: -0.55, d90: -0.49, note: 'Dollar is the global liquidity valve.' },
  { pair: 'Crude vs Breakevens', d30: 0.57, d90: 0.52, note: 'Energy directly drives near-term inflation expectations.' }
];

export const GEOPOLITICAL_RISKS = [
  { region: 'Middle East', issue: 'Shipping-lane disruption & oil facility risk', level: 68, impact: 'Oil, freight rates, headline CPI', tone: 'bear' },
  { region: 'Eastern Europe', issue: 'Conflict and European energy supply resilience', level: 61, impact: 'European gas, EUR, defence equities', tone: 'bear' },
  { region: 'Taiwan Strait', issue: 'Semiconductor supply chain tensions', level: 44, impact: 'Semis, tech capex, hardware', tone: 'neutral' },
  { region: 'US–China', issue: 'Tariffs, tech export controls and AI barriers', level: 57, impact: 'Goods inflation, chip capex', tone: 'bear' },
  { region: 'Latin America', issue: 'Election cycle and currency volatility', level: 32, impact: 'EM FX, copper, commodities', tone: 'neutral' }
];

export const ACTIVE_SIGNALS = [
  { market: 'BTC/USD', side: 'LONG', timeframe: '1-2 Days (Sniper Pre-Move)', risk: 'Low (230 pt SL)', bias: 'Pre-Move Liquidity Absorption (Zero Lag)', entry: '$81,950 (Long) | $84,920 (Pre-Drop Short)', stop: '$81,720 (Tight -230 pts)', target: '$85,200 (+3,250 pts)', rr: '14.1', confidence: 91, reason: 'Whale Iceberg Wall absorption + CVD Bullish Divergence before +3,200 pt move. 0-lag early signal eliminates 3,000 pt late chasing.' },
  { market: 'ETH/USD', side: 'LONG', timeframe: 'Intraday Sniper', risk: 'Low (25 pt SL)', bias: 'Pre-Move SFP Liquidity Sweep', entry: '$2,490 (Sniper Discount)', stop: '$2,465 (Tight -25 pts)', target: '$2,820 (+330 pts)', rr: '13.2', confidence: 88, reason: 'Zero-lag spot CVD accumulation detected before breakout. Tight invalidation below Asian sweep low.' },
  { market: 'XAU/USD', side: 'LONG', timeframe: 'Pre-London Sweep', risk: 'Low ($8.50 SL)', bias: 'Pre-Expansion Iceberg Bid Block', entry: '$4,118.50 (Sniper)', stop: '$4,110.00 (Tight -$8.50)', target: '$4,220.00 (+$101.50)', rr: '11.9', confidence: 92, reason: 'PBoC & COMEX iceberg bid replenishment before London expansion. 1:11.9 asymmetric R:R.' },
  { market: 'SOL/USD', side: 'WAIT', timeframe: '4-Hour', risk: 'High', bias: 'Range compression', entry: '$112.99', stop: '—', target: '—', rr: '—', confidence: 54, reason: 'Divergence between active address acceleration and DEX volume cooling.' },
  { market: 'DXY', side: 'SHORT', timeframe: 'Weekly', risk: 'Medium', bias: 'Fed easing cycle', entry: '102.45', stop: '103.80', target: '99.50', rr: '2.2', confidence: 75, reason: 'Global central banks divergence with Fed rate cut probabilities holding above 68%.' },
  { market: 'US 500', side: 'WAIT', timeframe: 'Daily', risk: 'Medium', bias: 'Narrowing breadth', entry: '5,782', stop: '—', target: '—', rr: '—', confidence: 58, reason: 'Megacap tech leadership masking median stock contraction across small caps.' }
];
