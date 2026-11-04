/**
 * BaseExchangeAdapter - Abstract base adapter for cryptocurrency exchange WebSockets
 */

export interface ParsedKline {
  time: number; // unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean;
}

export interface ParsedDepthUpdate {
  bids: [string | number, string | number][];
  asks: [string | number, string | number][];
  lastUpdateId?: number;
}

export interface ParsedTrade {
  id: string | number;
  price: number;
  volume: number;
  qty: number;
  time: number;
  isBuy: boolean;
  isBuyerMaker?: boolean;
}

export type ParsedMessage =
  | { type: 'kline'; data: ParsedKline }
  | { type: 'depthUpdate'; data: ParsedDepthUpdate }
  | { type: 'trade'; data: ParsedTrade }
  | null;

export abstract class BaseExchangeAdapter {
  public symbol: string;
  public streams: string[];
  public ws: WebSocket | null = null;
  public isConnected = false;
  protected pingInterval: any = null;

  public onMessage: ((type: string, data: any) => void) | null = null;
  public onError: ((error: any) => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor(symbol: string, streams: string[] = ['kline', 'depth', 'trade']) {
    this.symbol = symbol;
    this.streams = streams;
  }

  abstract getWebSocketUrl(): string;
  abstract getSubscribeMessage(): any;
  abstract parseMessage(data: any): ParsedMessage;

  public connect(): void {
    if (typeof window === 'undefined') return;

    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this._onOpen();
      };

      this.ws.onmessage = (event) => {
        this._handleRawMessage(event.data);
      };

      this.ws.onerror = (error) => {
        if (this.onError) {
          this.onError(error);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this._cleanup();
        if (this.onClose) {
          this.onClose();
        }
      };
    } catch (err) {
      console.error('[BaseExchangeAdapter] Connection failed:', err);
      if (this.onError) this.onError(err);
    }
  }

  public close(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // quiet close
      }
      this._cleanup();
    }
  }

  public send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }

  protected _onOpen(): void {
    const subscribeMsg = this.getSubscribeMessage();
    if (subscribeMsg) {
      if (Array.isArray(subscribeMsg)) {
        subscribeMsg.forEach((msg) => this.send(msg));
      } else {
        this.send(subscribeMsg);
      }
    }
    this._startPing();
  }

  protected _handleRawMessage(rawData: any): void {
    try {
      const data = this._decompress(rawData);
      const parsed = this.parseMessage(data);
      if (parsed && this.onMessage) {
        this.onMessage(parsed.type, parsed.data);
      }
    } catch (e) {
      // Quiet fail on non-JSON heartbeats
    }
  }

  protected _decompress(data: any): any {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  protected _startPing(): void {
    // Override if exchange requires periodic ping
  }

  protected _cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.ws = null;
  }
}
