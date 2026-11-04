import { BaseExchangeAdapter, ParsedMessage } from './BaseExchangeAdapter';

export const BYBIT_INTERVALS: Record<string, string> = {
  '1m': '1',
  '3m': '3',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '2h': '120',
  '4h': '240',
  '6h': '360',
  '12h': '720',
  '1d': 'D',
  '1w': 'W',
  '1M': 'M'
};

export class BybitAdapter extends BaseExchangeAdapter {
  public interval: string;
  public depthLevel: number;

  constructor(symbol: string, streams: string[] = ['kline', 'depth', 'trade'], options: { interval?: string; depthLevel?: number } = {}) {
    super(symbol, streams);
    this.interval = options.interval || '60';
    this.depthLevel = options.depthLevel || 50;
  }

  getWebSocketUrl(): string {
    return 'wss://stream.bybit.com/v5/public/spot';
  }

  getSubscribeMessage(): any {
    const symbol = this.symbol.toUpperCase();
    const args: string[] = [];

    if (this.streams.includes('kline')) {
      args.push(`kline.${this.interval}.${symbol}`);
    }
    if (this.streams.includes('depth')) {
      args.push(`orderbook.${this.depthLevel}.${symbol}`);
    }
    if (this.streams.includes('trade')) {
      args.push(`publicTrade.${symbol}`);
    }

    return { op: 'subscribe', args };
  }

  parseMessage(data: any): ParsedMessage {
    if (data?.op === 'subscribe' || data?.ret_msg === 'pong') return null;
    const topic = data?.topic;
    const payload = data?.data;
    if (!topic || !payload) return null;

    if (topic.startsWith('kline.')) {
      const k = payload[0];
      if (!k) return null;
      return {
        type: 'kline',
        data: {
          time: Math.floor(parseInt(k.start) / 1000),
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume),
          isClosed: k.confirm
        }
      };
    }

    if (topic.startsWith('orderbook.')) {
      return {
        type: 'depthUpdate',
        data: {
          bids: payload.b || [],
          asks: payload.a || [],
          lastUpdateId: payload.u
        }
      };
    }

    if (topic.startsWith('publicTrade.')) {
      const t = payload[0];
      if (!t) return null;
      return {
        type: 'trade',
        data: {
          id: t.i,
          price: parseFloat(t.p),
          volume: parseFloat(t.v),
          qty: parseFloat(t.v),
          time: parseInt(t.T),
          isBuy: t.S === 'Buy',
          isBuyerMaker: t.S === 'Sell'
        }
      };
    }

    return null;
  }

  protected _startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: 'ping' }));
      }
    }, 20000);
  }
}

export async function getBybitKlines(symbol: string, interval = '60', limit = 200): Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]> {
  try {
    const response = await fetch(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await response.json();
    if (!data?.result?.list) return [];
    return data.result.list.map((k: any) => ({
      time: Math.floor(parseInt(k[0]) / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    })).reverse();
  } catch {
    return [];
  }
}

export async function getBybitSymbols(): Promise<{ symbol: string; baseAsset: string; quoteAsset: string }[]> {
  return [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
    { symbol: 'MNTUSDT', baseAsset: 'MNT', quoteAsset: 'USDT' }
  ];
}
