/**
 * LevelAnalyzer - Key orderbook liquidity walls detection & strength scoring
 */

export interface SignificantLevel {
  price: number;
  volume: number;
  strength: number; // 0-100
  color: string;
  type: 'support' | 'resistance';
  ratio: string;
  count?: number;
}

export interface LevelSummaryResult {
  supportLevels: SignificantLevel[];
  resistanceLevels: SignificantLevel[];
  summary: {
    midPrice: number;
    spread: number;
    spreadPercent: string;
    totalBidVolume: number;
    totalAskVolume: number;
    bidAskRatio: string;
    nearestSupport?: SignificantLevel;
    nearestResistance?: SignificantLevel;
    supportCount: number;
    resistanceCount: number;
  };
}

export class LevelAnalyzer {
  private significanceThreshold = 2.0;
  private clusterRange = 0.001; // 0.1%
  private maxLevels = 8;
  private history: number[] = [];
  private maxHistorySize = 100;

  analyze(orderBook: { bids: [number, number][]; asks: [number, number][] }): LevelSummaryResult {
    if (!orderBook?.bids?.length || !orderBook?.asks?.length) {
      return {
        supportLevels: [],
        resistanceLevels: [],
        summary: {
          midPrice: 0,
          spread: 0,
          spreadPercent: '0%',
          totalBidVolume: 0,
          totalAskVolume: 0,
          bidAskRatio: '1.00',
          supportCount: 0,
          resistanceCount: 0
        }
      };
    }

    const allVolumes = [
      ...orderBook.bids.map(([, v]) => parseFloat(v as any) || 0),
      ...orderBook.asks.map(([, v]) => parseFloat(v as any) || 0)
    ].filter((v) => v > 0);

    const avgVolume = allVolumes.length > 0 ? allVolumes.reduce((a, b) => a + b, 0) / allVolumes.length : 1;
    const maxVolume = allVolumes.length > 0 ? Math.max(...allVolumes) : 1;

    this.history.push(avgVolume);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    const supportLevels = this._findSignificantLevels(orderBook.bids, avgVolume, maxVolume, 'support');
    const resistanceLevels = this._findSignificantLevels(orderBook.asks, avgVolume, maxVolume, 'resistance');

    const summary = this._buildSummary(orderBook, supportLevels, resistanceLevels);
    return { supportLevels, resistanceLevels, summary };
  }

  private _findSignificantLevels(
    levels: [number, number][],
    avgVolume: number,
    maxVolume: number,
    type: 'support' | 'resistance'
  ): SignificantLevel[] {
    const significant: SignificantLevel[] = [];
    const threshold = avgVolume * this.significanceThreshold;

    for (const [p, q] of levels) {
      const price = parseFloat(p as any);
      const qty = parseFloat(q as any);
      if (qty >= threshold) {
        const strength = Math.min(100, Math.round((qty / maxVolume) * 100));
        significant.push({
          price,
          volume: qty,
          strength,
          color: this._getColorByStrength(strength, type),
          type,
          ratio: (qty / avgVolume).toFixed(2) + 'x'
        });
      }
    }

    const clustered = this._clusterLevels(significant);
    return clustered.sort((a, b) => b.strength - a.strength).slice(0, this.maxLevels);
  }

  private _clusterLevels(levels: SignificantLevel[]): SignificantLevel[] {
    if (levels.length === 0) return [];
    const clusters: SignificantLevel[] = [];
    const used = new Set<number>();

    for (let i = 0; i < levels.length; i++) {
      if (used.has(i)) continue;
      const cluster = [levels[i]];
      used.add(i);

      for (let j = i + 1; j < levels.length; j++) {
        if (used.has(j)) continue;
        const priceDiff = Math.abs(levels[i].price - levels[j].price) / levels[i].price;
        if (priceDiff <= this.clusterRange) {
          cluster.push(levels[j]);
          used.add(j);
        }
      }

      const totalVolume = cluster.reduce((sum, l) => sum + l.volume, 0);
      const avgPrice = cluster.reduce((sum, l) => sum + l.price, 0) / cluster.length;
      const maxStrength = Math.max(...cluster.map((l) => l.strength));

      clusters.push({
        price: avgPrice,
        volume: totalVolume,
        strength: maxStrength,
        color: this._getColorByStrength(maxStrength, cluster[0].type),
        type: cluster[0].type,
        ratio: cluster[0].ratio,
        count: cluster.length
      });
    }

    return clusters;
  }

  private _getColorByStrength(strength: number, type: 'support' | 'resistance'): string {
    if (type === 'support') {
      if (strength < 30) return 'rgba(0, 200, 83, 0.4)';
      if (strength < 70) return 'rgba(0, 200, 83, 0.7)';
      return 'rgba(0, 255, 100, 0.95)';
    } else {
      if (strength < 30) return 'rgba(255, 23, 68, 0.4)';
      if (strength < 70) return 'rgba(255, 23, 68, 0.7)';
      return 'rgba(255, 50, 80, 0.95)';
    }
  }

  private _buildSummary(
    orderBook: { bids: [number, number][]; asks: [number, number][] },
    supportLevels: SignificantLevel[],
    resistanceLevels: SignificantLevel[]
  ): LevelSummaryResult['summary'] {
    const totalBidVolume = orderBook.bids.reduce((sum, [, v]) => sum + (parseFloat(v as any) || 0), 0);
    const totalAskVolume = orderBook.asks.reduce((sum, [, v]) => sum + (parseFloat(v as any) || 0), 0);

    const bestBid = parseFloat(orderBook.bids[0]?.[0] as any) || 0;
    const bestAsk = parseFloat(orderBook.asks[0]?.[0] as any) || 0;
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;
    const spread = +(bestAsk - bestBid).toFixed(2);
    const spreadPercent = midPrice > 0 ? ((spread / midPrice) * 100).toFixed(4) + '%' : '0%';

    const nearestSupport = supportLevels.filter((l) => l.price < midPrice).sort((a, b) => b.price - a.price)[0];
    const nearestResistance = resistanceLevels.filter((l) => l.price > midPrice).sort((a, b) => a.price - b.price)[0];

    return {
      midPrice,
      spread,
      spreadPercent,
      totalBidVolume,
      totalAskVolume,
      bidAskRatio: totalAskVolume > 0 ? (totalBidVolume / totalAskVolume).toFixed(2) : '1.00',
      nearestSupport,
      nearestResistance,
      supportCount: supportLevels.length,
      resistanceCount: resistanceLevels.length
    };
  }

  formatVolume(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(2) + 'K';
    return value.toFixed(2);
  }
}

export const levelAnalyzer = new LevelAnalyzer();
