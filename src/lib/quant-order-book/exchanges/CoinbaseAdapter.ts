import { BaseExchangeAdapter, ParsedMessage } from './BaseExchangeAdapter';

export class CoinbaseAdapter extends BaseExchangeAdapter {
  public productId: string;

  constructor(symbol: string, streams: string[] = ['depth', 'trade']) {
    super(symbol, streams.filter((s) => s !== 'kline'));
    this.productId = this._formatSymbol(symbol);
  }

  getWebSocketUrl(): string {
    return 'wss://advanced-trade-ws.coinbase.com';
  }

  getSubscribeMessage(): any {
    return null; // Sent in _onOpen
  }

  protected _onOpen(): void {
    if (this.streams.includes('depth')) {
      this.send({
        type: 'subscribe',
        product_ids: [this.productId],
        channel: 'level2'
      });
    }
    if (this.streams.includes('trade')) {
      this.send({
        type: 'subscribe',
        product_ids: [this.productId],
        channel: 'market_trades'
      });
    }
  }

  parseMessage(data: any): ParsedMessage {
    const channel = data?.channel;
    const events = data?.events;
    if (!channel || !events?.length) return null;

    if (channel === 'l2_data') {
      const updates = events[0]?.updates || [];
      const bids: [number, number][] = [];
      const asks: [number, number][] = [];

      for (const u of updates) {
        if (u.side === 'bid') {
          bids.push([parseFloat(u.price_level), parseFloat(u.new_quantity)]);
        } else if (u.side === 'offer') {
          asks.push([parseFloat(u.price_level), parseFloat(u.new_quantity)]);
        }
      }

      return {
        type: 'depthUpdate',
        data: { bids, asks }
      };
    }

    if (channel === 'market_trades') {
      const trades = events[0]?.trades || [];
      const t = trades[0];
      if (!t) return null;

      return {
        type: 'trade',
        data: {
          id: t.trade_id,
          price: parseFloat(t.price),
          volume: parseFloat(t.size),
          qty: parseFloat(t.size),
          time: new Date(t.time).getTime(),
          isBuy: t.side === 'BUY',
          isBuyerMaker: t.side === 'SELL'
        }
      };
    }

    return null;
  }

  private _formatSymbol(symbol: string): string {
    if (symbol.endsWith('USDT')) {
      return symbol.replace('USDT', '-USDT');
    }
    if (symbol.endsWith('USD') && !symbol.includes('-')) {
      return symbol.replace('USD', '-USD');
    }
    return symbol;
  }
}

export async function getCoinbaseSymbols(): Promise<{ symbol: string; baseAsset: string; quoteAsset: string }[]> {
  return [
    { symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD' },
    { symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD' },
    { symbol: 'SOL-USD', baseAsset: 'SOL', quoteAsset: 'USD' }
  ];
}
