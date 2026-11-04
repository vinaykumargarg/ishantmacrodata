/**
 * OrderBookHeatmap - Real-time canvas-based cumulative orderbook depth heatmap
 * Overlaid directly on Lightweight Charts candlestick chart
 */

import { IChartApi, ISeriesApi } from 'lightweight-charts';

export interface HeatmapOptions {
  bidColor?: { r: number; g: number; b: number };
  askColor?: { r: number; g: number; b: number };
  opacity?: number;
  binsCount?: number;
  minAlpha?: number;
  maxAlpha?: number;
  showVolumeLabels?: boolean;
}

export class OrderBookHeatmap {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver | null = null;
  private chartRef: IChartApi | null = null;
  private candleSeriesRef: ISeriesApi<'Candlestick'> | null = null;

  public options: Required<HeatmapOptions>;
  public orderBook = {
    bids: new Map<number, number>(),
    asks: new Map<number, number>()
  };

  public currentPrice = 0;
  public maxVolume = 1;
  private width = 0;
  private height = 0;

  constructor(container: HTMLElement | string, options: HeatmapOptions = {}) {
    this.container = typeof container === 'string'
      ? (document.querySelector(container) as HTMLElement)
      : container;

    this.options = {
      bidColor: { r: 0, g: 200, b: 83 },
      askColor: { r: 255, g: 23, b: 68 },
      opacity: 0.7,
      binsCount: 100,
      minAlpha: 0.12,
      maxAlpha: 0.92,
      showVolumeLabels: true,
      ...options
    };

    if (this.container) {
      this._init();
    }
  }

  private _init(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'quant-heatmap-canvas';
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: ${this.options.opacity};
      z-index: 4;
    `;

    this.container.style.position = 'relative';
    this.container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    this.ctx = ctx;

    this.resizeObserver = new ResizeObserver(() => this._handleResize());
    this.resizeObserver.observe(this.container);
    this._handleResize();
  }

  public attachToChart(chart: IChartApi, candleSeries: ISeriesApi<'Candlestick'>): void {
    this.chartRef = chart;
    this.candleSeriesRef = candleSeries;

    if (this.chartRef) {
      this.chartRef.timeScale().subscribeVisibleLogicalRangeChange(() => {
        this.render();
      });
    }
  }

  private _handleResize(): void {
    if (!this.container || !this.canvas || !this.ctx) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  public update(data: { bids?: [number | string, number | string][]; asks?: [number | string, number | string][] }, currentPrice?: number): void {
    if (!data) return;
    if (currentPrice && !isNaN(currentPrice) && currentPrice > 0) {
      this.currentPrice = currentPrice;
    }

    if (data.bids?.length) {
      for (const [p, q] of data.bids) {
        const price = parseFloat(p as string);
        const qty = parseFloat(q as string);
        if (!isNaN(price) && !isNaN(qty)) {
          if (qty > 0) {
            this.orderBook.bids.set(price, qty);
          } else {
            this.orderBook.bids.delete(price);
          }
        }
      }
    }

    if (data.asks?.length) {
      for (const [p, q] of data.asks) {
        const price = parseFloat(p as string);
        const qty = parseFloat(q as string);
        if (!isNaN(price) && !isNaN(qty)) {
          if (qty > 0) {
            this.orderBook.asks.set(price, qty);
          } else {
            this.orderBook.asks.delete(price);
          }
        }
      }
    }

    this.render();
  }

  private _aggregateToBins(levels: Map<number, number>, priceMin: number, priceMax: number): number[] {
    const binsCount = this.options.binsCount;
    const priceRange = priceMax - priceMin;
    const binSize = priceRange / binsCount;
    const bins = new Array(binsCount).fill(0);

    for (const [price, volume] of levels) {
      if (price < priceMin || price > priceMax) continue;
      const binIndex = Math.floor((price - priceMin) / binSize);
      if (binIndex >= 0 && binIndex < binsCount) {
        bins[binIndex] += volume;
      }
    }
    return bins;
  }

  public render(): void {
    if (!this.ctx || !this.width || !this.height) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    let priceMin: number | null = null;
    let priceMax: number | null = null;

    if (this.candleSeriesRef) {
      try {
        const topPrice = this.candleSeriesRef.coordinateToPrice(0);
        const bottomPrice = this.candleSeriesRef.coordinateToPrice(this.height);
        if (topPrice !== null && bottomPrice !== null) {
          priceMin = Math.min(topPrice, bottomPrice);
          priceMax = Math.max(topPrice, bottomPrice);
        }
      } catch {
        // quiet fallback
      }
    }

    if (!priceMin || !priceMax || priceMin === priceMax) {
      if (!this.currentPrice) return;
      const range = this.currentPrice * 0.08;
      priceMin = this.currentPrice - range;
      priceMax = this.currentPrice + range;
    }

    const bidBins = this._aggregateToBins(this.orderBook.bids, priceMin, priceMax);
    const askBins = this._aggregateToBins(this.orderBook.asks, priceMin, priceMax);

    const allVolumes = [...bidBins, ...askBins].filter((v) => v > 0);
    if (allVolumes.length > 0) {
      allVolumes.sort((a, b) => a - b);
      const idx = Math.floor(allVolumes.length * 0.95);
      this.maxVolume = allVolumes[idx] || allVolumes[allVolumes.length - 1] || 1;
    }

    const binsCount = this.options.binsCount;
    const binHeight = this.height / binsCount;

    for (let i = 0; i < binsCount; i++) {
      const y = this.height - (i + 1) * binHeight;

      // BIDS (Green depth)
      if (bidBins[i] > 0) {
        const intensity = Math.min(bidBins[i] / this.maxVolume, 1);
        const alpha = this.options.minAlpha + intensity * (this.options.maxAlpha - this.options.minAlpha);
        this.ctx.fillStyle = `rgba(${this.options.bidColor.r}, ${this.options.bidColor.g}, ${this.options.bidColor.b}, ${alpha})`;
        this.ctx.fillRect(0, y, this.width, binHeight + 0.5);

        if (this.options.showVolumeLabels && intensity > 0.4) {
          this._drawVolumeLabel(bidBins[i], 12, y + binHeight / 2, 'bid');
        }
      }

      // ASKS (Red depth)
      if (askBins[i] > 0) {
        const intensity = Math.min(askBins[i] / this.maxVolume, 1);
        const alpha = this.options.minAlpha + intensity * (this.options.maxAlpha - this.options.minAlpha);
        this.ctx.fillStyle = `rgba(${this.options.askColor.r}, ${this.options.askColor.g}, ${this.options.askColor.b}, ${alpha})`;
        this.ctx.fillRect(0, y, this.width, binHeight + 0.5);

        if (this.options.showVolumeLabels && intensity > 0.4) {
          this._drawVolumeLabel(askBins[i], 12, y + binHeight / 2, 'ask');
        }
      }
    }

    // Mid Price Marker Line
    if (this.candleSeriesRef && this.currentPrice > 0) {
      try {
        const currentY = this.candleSeriesRef.priceToCoordinate(this.currentPrice);
        if (currentY !== null && currentY >= 0 && currentY <= this.height) {
          this.ctx.strokeStyle = 'rgba(255, 214, 0, 0.85)';
          this.ctx.lineWidth = 1.5;
          this.ctx.setLineDash([6, 3]);
          this.ctx.beginPath();
          this.ctx.moveTo(0, currentY);
          this.ctx.lineTo(this.width, currentY);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      } catch {
        // ignore coordinate error during resize
      }
    }
  }

  private _drawVolumeLabel(volume: number, x: number, y: number, type: 'bid' | 'ask'): void {
    let text = volume.toFixed(1);
    if (volume >= 1000000) text = (volume / 1000000).toFixed(1) + 'M';
    else if (volume >= 1000) text = (volume / 1000).toFixed(1) + 'K';

    this.ctx.font = 'bold 10px JetBrains Mono, monospace';
    const textWidth = this.ctx.measureText(text).width;
    const padding = 4;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = 13;

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
    this.ctx.fillRect(x, y - bgHeight / 2, bgWidth, bgHeight);

    this.ctx.fillStyle = type === 'bid' ? '#00e676' : '#ff5252';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + padding, y);
  }

  public setVisible(visible: boolean): void {
    if (this.canvas) {
      this.canvas.style.display = visible ? 'block' : 'none';
    }
  }

  public setOpacity(opacity: number): void {
    this.options.opacity = opacity;
    if (this.canvas) {
      this.canvas.style.opacity = `${opacity}`;
    }
  }

  public setBinsCount(count: number): void {
    this.options.binsCount = count;
    this.render();
  }

  public clear(): void {
    this.orderBook.bids.clear();
    this.orderBook.asks.clear();
    this.maxVolume = 1;
    if (this.ctx && this.width && this.height) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  public destroy(): void {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
