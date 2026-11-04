import { BaseExchangeAdapter, ParsedMessage } from './BaseExchangeAdapter';

export const OKX_INTERVALS: Record<string, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '12h': '12H',
  '1d': '1D',
  '1w': '1W',
  '1M': '1M'
};

export class OKXAdapter extends BaseExchangeAdapter {
  public interval: string;
  public depthLevel: string;

  constructor(symbol: string, streams: string[] = ['kline', 'depth', 'trade'], options: { interval?: string; depthLevel?: string } = {}) {
    super(symbol, streams);
    this.interval = options.interval || '1H';
    this.depthLevel = options.depthLevel || 'books50-l2-tbt';
  }

  getWebSocketUrl(): string {
    return 'wss://ws.okx.com:8443/ws/v5/public';
  }

  getSubscribeMessage(): any {
    const instId = this._formatSymbol(this.symbol);
    const args: any[] = [];

    if (this.streams.includes('kline')) {
      args.push({ channel: `candle${this.interval}`, instId });
    }
    if (this.streams.includes('depth')) {
      args.push({ channel: this.depthLevel, instId });
    }
    if (this.streams.includes('trade')) {
      args.push({ channel: 'trades', instId });
    }

    return { op: 'subscribe', args };
  }

  parseMessage(data: any): ParsedMessage {
    if (data?.event === 'subscribe' || data?.event === 'error' || data === 'pong') {
      return null;
    }

    const channel = data?.arg?.channel;
    const payload = data?.data?.[0];
    if (!channel || !payload) return null;

    if (channel.startsWith('candle')) {
      return {
        type: 'kline',
        data: {
          time: Math.floor(parseInt(payload[0]) / 1000),
          open: parseFloat(payload[1]),
          high: parseFloat(payload[2]),
          low: parseFloat(payload[3]),
          close: parseFloat(payload[4]),
          volume: parseFloat(payload[5]),
          isClosed: payload[8] === '1'
        }
      };
    }

    if (channel.startsWith('books')) {
      return {
        type: 'depthUpdate',
        data: {
          bids: payload.bids,
          asks: payload.asks
        }
      };
    }

    if (channel === 'trades') {
      return {
        type: 'trade',
        data: {
          id: payload.tradeId,
          price: parseFloat(payload.px),
          volume: parseFloat(payload.sz),
          qty: parseFloat(payload.sz),
          time: parseInt(payload.ts),
          isBuy: payload.side === 'buy',
          isBuyerMaker: payload.side === 'sell'
        }
      };
    }

    return null;
  }

  protected _startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 20000);
  }

  private _formatSymbol(symbol: string): string {
    if (symbol.endsWith('USDT') && !symbol.includes('-')) {
      return symbol.replace('USDT', '-USDT');
    }
    return symbol;
  }
}

export async function getOKXKlines(symbol: string, bar = '1H', limit = 100): Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]> {
  try {
    const formatted = symbol.endsWith('USDT') && !symbol.includes('-') ? symbol.replace('USDT', '-USDT') : symbol;
    const response = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${formatted}&bar=${bar}&limit=${limit}`);
    const data = await response.json();
    if (!data?.data) return [];
    return data.data.map((c: any) => ({
      time: Math.floor(parseInt(c[0]) / 1000),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    })).reverse();
  } catch {
    return [];
  }
}

export async function getOKXSymbols(): Promise<{ symbol: string; baseAsset: string; quoteAsset: string }[]> {
  return [
    { symbol: 'BTC-USDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETH-USDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
    { symbol: 'SOL-USDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
    { symbol: 'OKB-USDT', baseAsset: 'OKB', quoteAsset: 'USDT' },
    { symbol: 'DOGE-USDT', baseAsset: 'DOGE', quoteAsset: 'USDT' }
  ];
}
