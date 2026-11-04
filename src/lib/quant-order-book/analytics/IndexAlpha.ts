/**
 * IndexAlpha - Quantitative analytics for order book & trade flow
 */

export interface TradeItem {
  id?: string | number;
  price: number;
  volume?: number;
  qty: number;
  time?: number;
  isBuy?: boolean;
  isBuyerMaker?: boolean;
}

export interface QuantMetrics {
  indexAlpha: string;
  delta: string;
  cvd: string;
  imbalance: string;
  spread: string;
  spreadPct: string;
  raw: {
    indexAlpha: number;
    delta: number;
    cvd: number;
    imbalance: number;
    spread: number;
    spreadPct: number;
  };
}

export class IndexAlpha {
  private tradesBuffer: TradeItem[] = [];
  private orderBookHistory: { timestamp: number; data: any }[] = [];
  private maxBufferSize = 2000;
  private windowMs = 60000; // 1 minute

  addTrade(trade: TradeItem): void {
    this.tradesBuffer.push({
      ...trade,
      time: trade.time || Date.now()
    });

    while (this.tradesBuffer.length > this.maxBufferSize) {
      this.tradesBuffer.shift();
    }
  }

  addOrderBook(orderBook: { bids: [number, number][]; asks: [number, number][] }): void {
    this.orderBookHistory.push({
      timestamp: Date.now(),
      data: orderBook
    });

    const cutoff = Date.now() - 300000;
    this.orderBookHistory = this.orderBookHistory.filter((h) => h.timestamp >= cutoff);
  }

  calculateIndexAlpha(orderBook: { bids: [number, number][]; asks: [number, number][] }): number {
    if (!orderBook?.bids?.length || !orderBook?.asks?.length) {
      return 1;
    }

    const bidVolume = orderBook.bids.reduce((sum, [, qty]) => sum + (parseFloat(qty as any) || 0), 0);
    const askVolume = orderBook.asks.reduce((sum, [, qty]) => sum + (parseFloat(qty as any) || 0), 0);

    if (askVolume === 0) return 999;
    return bidVolume / askVolume;
  }

  calculateDelta(windowMs = this.windowMs): number {
    const cutoff = Date.now() - windowMs;
    const recentTrades = this.tradesBuffer.filter((t) => (t.time || 0) >= cutoff);

    let buyVolume = 0;
    let sellVolume = 0;

    for (const trade of recentTrades) {
      const val = (trade.qty || trade.volume || 0) * trade.price;
      if (trade.isBuyerMaker) {
        sellVolume += val;
      } else {
        buyVolume += val;
      }
    }

    return buyVolume - sellVolume;
  }

  calculateCVD(): number {
    let cvd = 0;
    for (const trade of this.tradesBuffer) {
      const val = (trade.qty || trade.volume || 0) * trade.price;
      if (trade.isBuyerMaker) {
        cvd -= val;
      } else {
        cvd += val;
      }
    }
    return cvd;
  }

  calculateImbalance(orderBook: { bids: [number, number][]; asks: [number, number][] }): number {
    if (!orderBook?.bids?.length || !orderBook?.asks?.length) {
      return 0;
    }

    const bestBid = orderBook.bids[0];
    const bestAsk = orderBook.asks[0];
    if (!bestBid || !bestAsk) return 0;

    const bidQty = parseFloat(bestBid[1] as any) || 0;
    const askQty = parseFloat(bestAsk[1] as any) || 0;
    const total = bidQty + askQty;
    if (total === 0) return 0;

    return (bidQty - askQty) / total;
  }

  getMetrics(orderBook: { bids: [number, number][]; asks: [number, number][] }): QuantMetrics {
    const indexAlpha = this.calculateIndexAlpha(orderBook);
    const delta = this.calculateDelta();
    const cvd = this.calculateCVD();
    const imbalance = this.calculateImbalance(orderBook);

    let spread = 0;
    let spreadPct = 0;
    if (orderBook?.bids?.[0] && orderBook?.asks?.[0]) {
      const bestBid = parseFloat(orderBook.bids[0][0] as any);
      const bestAsk = parseFloat(orderBook.asks[0][0] as any);
      spread = +(bestAsk - bestBid).toFixed(2);
      spreadPct = bestBid > 0 ? +((spread / bestBid) * 100).toFixed(4) : 0;
    }

    return {
      indexAlpha: indexAlpha.toFixed(2),
      delta: this._formatNumber(delta),
      cvd: this._formatNumber(cvd),
      imbalance: (imbalance * 100).toFixed(1) + '%',
      spread: spread.toFixed(2),
      spreadPct: spreadPct.toFixed(3) + '%',
      raw: { indexAlpha, delta, cvd, imbalance, spread, spreadPct }
    };
  }

  private _formatNumber(num: number): string {
    const abs = Math.abs(num);
    const sign = num >= 0 ? '+' : '-';

    if (abs >= 1000000) {
      return sign + (abs / 1000000).toFixed(2) + 'M';
    }
    if (abs >= 1000) {
      return sign + (abs / 1000).toFixed(2) + 'K';
    }
    return sign + abs.toFixed(2);
  }

  clear(): void {
    this.tradesBuffer = [];
    this.orderBookHistory = [];
  }
}

export const analytics = new IndexAlpha();
