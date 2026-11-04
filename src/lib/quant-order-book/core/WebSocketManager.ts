/**
 * WebSocketManager - Unified cryptocurrency exchange WebSocket manager with throttling & orderbook buffer
 */

import { BaseExchangeAdapter } from '../exchanges/BaseExchangeAdapter';

export const THROTTLE_CONFIG = {
  klines: 0,
  trades: 100,
  orderBook: 250,
  heatmap: 500,
  analytics: 1000
};

export class OrderBookBuffer {
  public bids = new Map<number, number>();
  public asks = new Map<number, number>();
  public lastUpdate = 0;
  public dirty = false;

  apply(update: { bids?: [number | string, number | string][]; asks?: [number | string, number | string][] }): void {
    if (update.bids) {
      for (const [p, s] of update.bids) {
        const price = parseFloat(p as string);
        const size = parseFloat(s as string);
        if (size === 0) {
          this.bids.delete(price);
        } else {
          this.bids.set(price, size);
        }
      }
    }

    if (update.asks) {
      for (const [p, s] of update.asks) {
        const price = parseFloat(p as string);
        const size = parseFloat(s as string);
        if (size === 0) {
          this.asks.delete(price);
        } else {
          this.asks.set(price, size);
        }
      }
    }

    this.dirty = true;
    this.lastUpdate = Date.now();
  }

  getState(depth = 50): { bids: [number, number][]; asks: [number, number][] } {
    const sortedBids = [...this.bids.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, depth) as [number, number][];

    const sortedAsks = [...this.asks.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(0, depth) as [number, number][];

    this.dirty = false;
    return { bids: sortedBids, asks: sortedAsks };
  }

  getAllLevels(): { bids: [number, number][]; asks: [number, number][] } {
    const bids = [...this.bids.entries()].sort((a, b) => b[0] - a[0]) as [number, number][];
    const asks = [...this.asks.entries()].sort((a, b) => a[0] - b[0]) as [number, number][];
    return { bids, asks };
  }

  clear(): void {
    this.bids.clear();
    this.asks.clear();
    this.dirty = false;
  }
}

export class WebSocketManager {
  private connections = new Map<string, BaseExchangeAdapter>();
  private adapters = new Map<string, new (symbol: string, streams?: string[], options?: any) => BaseExchangeAdapter>();
  private buffers = new Map<string, OrderBookBuffer>();
  private listeners = new Map<string, Set<(payload: any) => void>>();
  private throttleIntervalId: any = null;

  constructor() {
    this._startThrottleLoop();
  }

  registerAdapter(exchange: string, AdapterClass: new (symbol: string, streams?: string[], options?: any) => BaseExchangeAdapter): void {
    this.adapters.set(exchange.toLowerCase(), AdapterClass);
  }

  connect(exchange: string, symbol: string, streams: string[] = ['kline', 'depth', 'trade'], options: any = {}): string {
    const AdapterClass = this.adapters.get(exchange.toLowerCase());
    if (!AdapterClass) {
      throw new Error(`Unknown exchange: ${exchange}`);
    }

    const id = `${exchange.toLowerCase()}:${symbol.toUpperCase()}`;
    this.disconnect(id);

    const buffer = new OrderBookBuffer();
    this.buffers.set(id, buffer);

    const adapter = new AdapterClass(symbol, streams, options);

    adapter.onMessage = (type: string, data: any) => {
      this._handleMessage(id, type, data);
    };

    adapter.onError = (error: any) => {
      this._emit('error', { id, error });
    };

    adapter.onClose = () => {
      this._emit('disconnected', { id });
    };

    adapter.connect();
    this.connections.set(id, adapter);
    this._emit('connected', { id, exchange, symbol });

    return id;
  }

  disconnect(id: string): void {
    const adapter = this.connections.get(id);
    if (adapter) {
      adapter.close();
      this.connections.delete(id);
      this.buffers.delete(id);
    }
  }

  disconnectAll(): void {
    for (const id of Array.from(this.connections.keys())) {
      this.disconnect(id);
    }
  }

  on(event: string, callback: (payload: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (payload: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  getOrderBook(id: string, depth = 50): { bids: [number, number][]; asks: [number, number][] } {
    const buffer = this.buffers.get(id);
    return buffer ? buffer.getState(depth) : { bids: [], asks: [] };
  }

  getAllOrderBookLevels(id: string): { bids: [number, number][]; asks: [number, number][] } {
    const buffer = this.buffers.get(id);
    return buffer ? buffer.getAllLevels() : { bids: [], asks: [] };
  }

  setOrderBookSnapshot(id: string, bids: [number, number][], asks: [number, number][]): void {
    const buffer = this.buffers.get(id);
    if (buffer) {
      buffer.clear();
      buffer.apply({ bids, asks });
      this._emit('orderBookUpdate', { id, data: buffer.getState() });
    }
  }

  private _handleMessage(id: string, type: string, data: any): void {
    switch (type) {
      case 'kline':
        this._emit('kline', { id, data });
        break;
      case 'depth':
      case 'depthUpdate': {
        const buffer = this.buffers.get(id);
        if (buffer) {
          buffer.apply(data);
        }
        break;
      }
      case 'trade':
        this._emit('trade', { id, data });
        break;
      default:
        this._emit(type, { id, data });
    }
  }

  private _startThrottleLoop(): void {
    if (typeof window === 'undefined') return;
    this.throttleIntervalId = setInterval(() => {
      for (const [id, buffer] of this.buffers) {
        if (buffer.dirty) {
          this._emit('orderBookUpdate', {
            id,
            data: buffer.getState(50),
            rawLevels: buffer.getAllLevels()
          });
        }
      }
    }, THROTTLE_CONFIG.orderBook);
  }

  private _emit(event: string, payload: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  public destroy(): void {
    if (this.throttleIntervalId) {
      clearInterval(this.throttleIntervalId);
    }
    this.disconnectAll();
    this.listeners.clear();
  }
}

export const wsManager = new WebSocketManager();
