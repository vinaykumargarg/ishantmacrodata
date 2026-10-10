export interface MarketTicker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  category: 'Crypto' | 'Equities' | 'Forex' | 'Commodities';
}

export interface StockSetup {
  symbol: string;
  companyName: string;
  market: 'US' | 'NIFTY100';
  price: string;
  change: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  targetPrice: string;
  stopLoss: string;
  timeframe: string;
  technicalSetup: string;
  aiRationale: string;
  peRatio: string;
  marketCap: string;
  volume24h: string;
}

export interface MacroSignal {
  id: string;
  title: string;
  category: string;
  impact: 'HIGH' | 'MEDIUM' | 'CRITICAL';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
  time: string;
  value: string;
}

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual: string;
  forecast: string;
  previous: string;
  status: 'UPCOMING' | 'RELEASED';
}

export interface WhaleTransaction {
  id: string;
  txHash: string;
  asset: string;
  amount: string;
  usdValue: string;
  from: string;
  to: string;
  type: 'EXCHANGE DEPOSIT' | 'EXCHANGE WITHDRAWAL' | 'WALLET TRANSFER';
  timestamp: string;
  impact: 'BEARISH' | 'BULLISH' | 'NEUTRAL';
}

export interface EtfFlow {
  date: string;
  ticker: string;
  fundName: string;
  flowUsd: string;
  flowShares: string;
  totalAum: string;
  provider: string;
  isPositive: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  status: 'WIN' | 'LOSS' | 'OPEN';
  notes: string;
  setup: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
