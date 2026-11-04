import { BaseExchangeAdapter, ParsedMessage } from './BaseExchangeAdapter';

export const BINANCE_INTERVALS: Record<string, string> = {
  '1s': '1s',
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '8h': '8h',
  '12h': '12h',
  '1d': '1d',
  '3d': '3d',
  '1w': '1w',
  '1M': '1M'
};

export class BinanceAdapter extends BaseExchangeAdapter {
  public interval: string;
  public depthLevel: number;

  constructor(symbol: string, streams: string[] = ['kline', 'depth', 'trade'], options: { interval?: string; depthLevel?: number } = {}) {
    super(symbol, streams);
    this.interval = options.interval || '1h';
    this.depthLevel = options.depthLevel || 20;
  }

  getWebSocketUrl(): string {
    const symbol = this.symbol.toLowerCase();
    const streamNames: string[] = [];

    if (this.streams.includes('kline')) {
      streamNames.push(`${symbol}@kline_${this.interval}`);
    }
    if (this.streams.includes('depth')) {
      streamNames.push(`${symbol}@depth@100ms`);
    }
    if (this.streams.includes('trade')) {
      streamNames.push(`${symbol}@trade`);
    }

    return `wss://stream.binance.com:9443/stream?streams=${streamNames.join('/')}`;
  }

  getSubscribeMessage(): any {
    return null;
  }

  parseMessage(data: any): ParsedMessage {
    if (!data?.stream || !data?.data) {
      return null;
    }

    const streamName = data.stream;
    const payload = data.data;

    if (streamName.includes('@kline_')) {
      return this._parseKline(payload);
    }
    if (streamName.includes('@depth')) {
      return this._parseDepth(payload);
    }
    if (streamName.includes('@trade')) {
      return this._parseTrade(payload);
    }

    return null;
  }

  private _parseKline(data: any): ParsedMessage {
    const k = data.k;
    return {
      type: 'kline',
      data: {
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        isClosed: k.x
      }
    };
  }

  private _parseDepth(data: any): ParsedMessage {
    return {
      type: 'depthUpdate',
      data: {
        bids: data.b,
        asks: data.a,
        lastUpdateId: data.u
      }
    };
  }

  private _parseTrade(data: any): ParsedMessage {
    const price = parseFloat(data.p);
    const volume = parseFloat(data.q);
    if (isNaN(price) || isNaN(volume)) return null;

    return {
      type: 'trade',
      data: {
        id: data.t,
        price,
        volume,
        qty: volume,
        time: data.T,
        isBuy: !data.m,
        isBuyerMaker: data.m
      }
    };
  }

  changeInterval(newInterval: string): void {
    if (this.interval === newInterval) return;
    const symbol = this.symbol.toLowerCase();
    const oldStream = `${symbol}@kline_${this.interval}`;
    const newStream = `${symbol}@kline_${newInterval}`;

    this.send({
      method: 'UNSUBSCRIBE',
      params: [oldStream],
      id: Date.now()
    });

    this.send({
      method: 'SUBSCRIBE',
      params: [newStream],
      id: Date.now() + 1
    });

    this.interval = newInterval;
  }
}

export async function getBinanceSymbols(): Promise<{ symbol: string; baseAsset: string; quoteAsset: string }[]> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const data = await response.json();
    return data.symbols
      .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s: any) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset
      }));
  } catch {
    return [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
      { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
      { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
      { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT' },
      { symbol: 'PAXGUSDT', baseAsset: 'PAXG (Gold)', quoteAsset: 'USDT' }
    ];
  }
}

export async function getBinanceOrderBookSnapshot(symbol: string, limit = 100): Promise<{ bids: [number, number][]; asks: [number, number][]; lastUpdateId: number }> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`);
    const data = await response.json();
    return {
      bids: (data.bids || []).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: (data.asks || []).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]),
      lastUpdateId: data.lastUpdateId || 0
    };
  } catch (e) {
    console.error('Binance snapshot error:', e);
    return { bids: [], asks: [], lastUpdateId: 0 };
  }
}

export async function getBinanceKlines(symbol: string, interval = '1h', limit = 500): Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await response.json();
    return data.map((k: any) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
  } catch (e) {
    console.error('Binance klines error:', e);
    return [];
  }
}
