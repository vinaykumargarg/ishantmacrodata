import { MarketTicker, StockSetup, MacroSignal, EconomicEvent, WhaleTransaction, EtfFlow } from '../types';

export const initialTickers: MarketTicker[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '$68,450.20', change: '+2.85%', isPositive: true, category: 'Crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '$2,640.80', change: '+1.92%', isPositive: true, category: 'Crypto' },
  { symbol: 'SOL/USD', name: 'Solana', price: '$154.30', change: '+4.15%', isPositive: true, category: 'Crypto' },
  { symbol: 'XAU/USD', name: 'Gold Spot', price: '$2,652.40', change: '+0.68%', isPositive: true, category: 'Commodities' },
  { symbol: 'S&P 500', name: 'SPX Index', price: '5,782.50', change: '+0.42%', isPositive: true, category: 'Equities' },
  { symbol: 'NIFTY 50', name: 'NSE Nifty', price: '22,520.45', change: '+1.30%', isPositive: true, category: 'Equities' },
  { symbol: 'SENSEX', name: 'BSE Sensex', price: '72,472.33', change: '+1.22%', isPositive: true, category: 'Equities' },
  { symbol: 'DXY', name: 'US Dollar Index', price: '102.45', change: '-0.28%', isPositive: false, category: 'Forex' },
  { symbol: 'US10Y', name: '10-Yr Treasury', price: '4.08%', change: '-0.04%', isPositive: false, category: 'Forex' },
  { symbol: 'NVDA', name: 'Nvidia Corp', price: '$132.80', change: '+3.10%', isPositive: true, category: 'Equities' },
  { symbol: 'RELIANCE', name: 'Reliance Ind', price: '₹1,170.30', change: '+0.66%', isPositive: true, category: 'Equities' },
];

export const mockStockSetups: StockSetup[] = [
  // US Equities
  {
    symbol: 'NVDA',
    companyName: 'Nvidia Corporation',
    market: 'US',
    price: '$132.80',
    change: '+3.10%',
    bias: 'BULLISH',
    score: 88,
    targetPrice: '$155.00',
    stopLoss: '$122.50',
    timeframe: ' Swing (2-4 wks)',
    technicalSetup: 'Bullish Flag Breakout on 4H above $130 level with expanding volume.',
    aiRationale: 'Blackwell GPU production ramping ahead of expectations. Cloud hyperscaler capex guidance remains elevated for Q4.',
    peRatio: '42.5x',
    marketCap: '$3.26T',
    volume24h: '$28.4B'
  },
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    market: 'US',
    price: '$227.40',
    change: '+0.85%',
    bias: 'BULLISH',
    score: 74,
    targetPrice: '$245.00',
    stopLoss: '$218.00',
    timeframe: ' Medium Term',
    technicalSetup: 'Ascending Triangle consolidation testing ATH resistance at $230.',
    aiRationale: 'iPhone 16 AI feature deployment timeline driving upgrade supercycle expectations in North America & China.',
    peRatio: '33.2x',
    marketCap: '$3.45T',
    volume24h: '$12.1B'
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    market: 'US',
    price: '$238.90',
    change: '-1.45%',
    bias: 'NEUTRAL',
    score: 52,
    targetPrice: '$260.00',
    stopLoss: '$215.00',
    timeframe: ' Range Trade',
    technicalSetup: 'Symmetrical Triangle near 200 EMA resistance level ($242).',
    aiRationale: 'Robotaxi event sentiment priced in; monitoring margin trends for lower-cost EV updates.',
    peRatio: '61.4x',
    marketCap: '$760B',
    volume24h: '$15.8B'
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    market: 'US',
    price: '$416.50',
    change: '+1.12%',
    bias: 'BULLISH',
    score: 82,
    targetPrice: '$450.00',
    stopLoss: '$398.00',
    timeframe: ' Swing Setup',
    technicalSetup: 'Bounce off key 100-day SMA support with bullish RSI divergence.',
    aiRationale: 'Azure AI ARR growth accelerating; Enterprise Copilot seat monetization gaining traction.',
    peRatio: '34.8x',
    marketCap: '$3.10T',
    volume24h: '$9.4B'
  },
  {
    symbol: 'AMD',
    companyName: 'Advanced Micro Devices',
    market: 'US',
    price: '$168.30',
    change: '+4.25%',
    bias: 'BULLISH',
    score: 85,
    targetPrice: '$195.00',
    stopLoss: '$152.00',
    timeframe: ' Breakout setup',
    technicalSetup: 'Cup and Handle pattern completing on Daily chart.',
    aiRationale: 'MI320X AI accelerator adoption expanding with tier-1 data center customers.',
    peRatio: '45.1x',
    marketCap: '$272B',
    volume24h: '$8.2B'
  },
  // NIFTY 100 Equities
  {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd.',
    market: 'NIFTY100',
    price: '₹1,170.30',
    change: '+0.66%',
    bias: 'BULLISH',
    score: 81,
    targetPrice: '₹1,380.00',
    stopLoss: '₹1,090.00',
    timeframe: ' Medium Term',
    technicalSetup: 'Higher low structure post 1:1 bonus share issue with MACD bullish crossover.',
    aiRationale: 'Jio Telecom ARPU expansion & Retail IPO timeline value unlocking expected in FY25.',
    peRatio: '21.8x',
    marketCap: '₹15.83 Lakh Cr',
    volume24h: '₹2,450 Cr'
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services',
    market: 'NIFTY100',
    price: '₹2,156.00',
    change: '-0.68%',
    bias: 'NEUTRAL',
    score: 64,
    targetPrice: '₹2,380.00',
    stopLoss: '₹2,020.00',
    timeframe: ' Consolidation',
    technicalSetup: 'Trading inside 2,100 - 2,250 horizontal consolidation channel.',
    aiRationale: 'BFSI tech spending stabilization offset by discretionary IT budget slowdown in US/EU.',
    peRatio: '22.4x',
    marketCap: '₹7.80 Lakh Cr',
    volume24h: '₹1,820 Cr'
  },
  {
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd.',
    market: 'NIFTY100',
    price: '₹707.25',
    change: '+0.97%',
    bias: 'BULLISH',
    score: 86,
    targetPrice: '₹820.00',
    stopLoss: '₹660.00',
    timeframe: ' Value Swing',
    technicalSetup: 'Multi-month breakout from falling wedge pattern.',
    aiRationale: 'Deposit growth catching up to credit growth; NIM improvement expected post-merger synergy integration.',
    peRatio: '16.8x',
    marketCap: '₹5.40 Lakh Cr',
    volume24h: '₹3,150 Cr'
  },
  {
    symbol: 'INFY',
    companyName: 'Infosys Limited',
    market: 'NIFTY100',
    price: '₹1,006.40',
    change: '-0.81%',
    bias: 'BULLISH',
    score: 79,
    targetPrice: '₹1,150.00',
    stopLoss: '₹940.00',
    timeframe: ' Momentum',
    technicalSetup: 'RSI breakout above 60 level; 50 EMA crossing above 200 EMA.',
    aiRationale: 'Large deal TCV bookings at record high driven by generative AI enterprise migration contracts.',
    peRatio: '21.6x',
    marketCap: '₹4.18 Lakh Cr',
    volume24h: '₹1,650 Cr'
  },
  {
    symbol: 'BHARTIARTL',
    companyName: 'Bharti Airtel Ltd.',
    market: 'NIFTY100',
    price: '₹1,805.10',
    change: '+1.03%',
    bias: 'BULLISH',
    score: 91,
    targetPrice: '₹2,020.00',
    stopLoss: '₹1,680.00',
    timeframe: ' Strong Uptrend',
    technicalSetup: 'Making new All-Time Highs with minimal pullback depth.',
    aiRationale: 'Tariff hikes driving double-digit ARPU growth; Africa 4G/5G expansion & Homes broadband scaling.',
    peRatio: '38.4x',
    marketCap: '₹10.20 Lakh Cr',
    volume24h: '₹1,980 Cr'
  }
];

export const mockMacroSignals: MacroSignal[] = [
  {
    id: '1',
    title: 'Fed Rate Cut Expectations Solidify (50bps in Q4)',
    category: 'Policy & Liquidity',
    impact: 'CRITICAL',
    bias: 'BULLISH',
    description: 'Futures markets pricing 92% probability of 25-50bps rate cut in upcoming FOMC meeting.',
    time: '12 mins ago',
    value: '4.75% Target'
  },
  {
    id: '2',
    title: 'US Net Liquidity Rebounds +$84B',
    category: 'Liquidity',
    impact: 'HIGH',
    bias: 'BULLISH',
    description: 'Treasury General Account (TGA) drawdowns + Reverse Repo facility runoff adding net liquidity.',
    time: '45 mins ago',
    value: '+$84.2 Billion'
  },
  {
    id: '3',
    title: 'Spot Bitcoin ETFs Record +$420M Inflows',
    category: 'Institutional Crypto',
    impact: 'HIGH',
    bias: 'BULLISH',
    description: 'BlackRock (IBIT) leading inflows for the 6th consecutive trading session.',
    time: '2 hours ago',
    value: '+$420.5 Million'
  },
  {
    id: '4',
    title: 'US CPI Inflation Cools to 2.4% YoY',
    category: 'Economy',
    impact: 'CRITICAL',
    bias: 'BULLISH',
    description: 'Core CPI print comes in softer than consensus forecast, easing real yield pressures.',
    time: '4 hours ago',
    value: '2.4% YoY'
  },
  {
    id: '5',
    title: 'DXY Dollar Index Rejects 103.5 Resistance',
    category: 'Forex & Commodities',
    impact: 'MEDIUM',
    bias: 'BULLISH',
    description: 'Dollar weakness provides cross-asset relief rally for Gold and Crypto risk assets.',
    time: '5 hours ago',
    value: '102.45 (-0.28%)'
  }
];

export const mockEconomicEvents: EconomicEvent[] = [
  {
    id: 'ev-1',
    date: '2026-10-09',
    time: '18:00 IST',
    country: 'USA',
    flag: '🇺🇸',
    event: 'FOMC Interest Rate Decision',
    impact: 'HIGH',
    actual: '4.75%',
    forecast: '4.75%',
    previous: '5.00%',
    status: 'UPCOMING'
  },
  {
    id: 'ev-2',
    date: '2026-10-10',
    time: '18:00 IST',
    country: 'USA',
    flag: '🇺🇸',
    event: 'US CPI YoY (Inflation Rate)',
    impact: 'HIGH',
    actual: '2.4%',
    forecast: '2.5%',
    previous: '2.6%',
    status: 'UPCOMING'
  },
  {
    id: 'ev-3',
    date: '2026-10-11',
    time: '18:00 IST',
    country: 'USA',
    flag: '🇺🇸',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    actual: '223K',
    forecast: '180K',
    previous: '142K',
    status: 'RELEASED'
  },
  {
    id: 'ev-4',
    date: '2026-10-12',
    time: '17:00 IST',
    country: 'IND',
    flag: '🇮🇳',
    event: 'India Retail CPI Inflation',
    impact: 'MEDIUM',
    actual: '3.65%',
    forecast: '3.80%',
    previous: '3.54%',
    status: 'UPCOMING'
  }
];

export const mockWhaleTransactions: WhaleTransaction[] = [
  {
    id: 'w1',
    txHash: '0x3a9f...b29c',
    asset: 'BTC',
    amount: '2,450 BTC',
    usdValue: '$167,700,000',
    from: 'Coinbase Prime',
    to: 'Cold Storage Wallet (0x81f...)',
    type: 'EXCHANGE WITHDRAWAL',
    timestamp: '8 mins ago',
    impact: 'BULLISH'
  },
  {
    id: 'w2',
    txHash: '0x9d11...f43e',
    asset: 'ETH',
    amount: '18,200 ETH',
    usdValue: '$48,060,000',
    from: 'Unknown Whale (0x41a...)',
    to: 'Binance Hot Wallet',
    type: 'EXCHANGE DEPOSIT',
    timestamp: '24 mins ago',
    impact: 'BEARISH'
  },
  {
    id: 'w3',
    txHash: '0x17c0...aa88',
    asset: 'SOL',
    amount: '140,000 SOL',
    usdValue: '$21,600,000',
    from: 'Kraken',
    to: 'Staking Contract',
    type: 'EXCHANGE WITHDRAWAL',
    timestamp: '52 mins ago',
    impact: 'BULLISH'
  }
];

export const mockEtfFlows: EtfFlow[] = [
  { date: 'Oct 08', ticker: 'IBIT', fundName: 'iShares Bitcoin Trust (BlackRock)', flowUsd: '+$284.5M', flowShares: '+4.1M', totalAum: '$24.8B', provider: 'BlackRock', isPositive: true },
  { date: 'Oct 08', ticker: 'FBTC', fundName: 'Fidelity Wise Origin Bitcoin', flowUsd: '+$112.3M', flowShares: '+1.6M', totalAum: '$12.1B', provider: 'Fidelity', isPositive: true },
  { date: 'Oct 08', ticker: 'ARKB', fundName: 'ARK 21Shares Bitcoin ETF', flowUsd: '+$34.2M', flowShares: '+490K', totalAum: '$3.4B', provider: 'ARK Invest', isPositive: true },
  { date: 'Oct 08', ticker: 'GBTC', fundName: 'Grayscale Bitcoin Trust', flowUsd: '-$18.4M', flowShares: '-260K', totalAum: '$14.2B', provider: 'Grayscale', isPositive: false },
  { date: 'Oct 08', ticker: 'ETHA', fundName: 'iShares Ethereum Trust', flowUsd: '+$48.6M', flowShares: '+18.4K', totalAum: '$1.4B', provider: 'BlackRock', isPositive: true },
];
