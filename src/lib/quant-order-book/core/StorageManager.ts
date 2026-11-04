/**
 * StorageManager - LocalStorage persistence for user preferences
 */

export interface QuantOrderBookSettings {
  exchange: 'binance' | 'okx' | 'bybit' | 'coinbase';
  symbol: string;
  timeframe: string;
  orderBookMode: 'ladder' | 'depth';
  orderBookDepth: number;
  heatmapOpacity: number;
  heatmapBins: number;
  showHeatmap: boolean;
  showCvd: boolean;
  showLevels: boolean;
}

const DEFAULT_SETTINGS: QuantOrderBookSettings = {
  exchange: 'binance',
  symbol: 'BTCUSDT',
  timeframe: '1h',
  orderBookMode: 'ladder',
  orderBookDepth: 20,
  heatmapOpacity: 0.7,
  heatmapBins: 100,
  showHeatmap: true,
  showCvd: true,
  showLevels: true
};

const STORAGE_KEY = 'quant_orderbook_pro_settings_v1';

class StorageManager {
  private settings: QuantOrderBookSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): QuantOrderBookSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[StorageManager] Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public getSettings(): QuantOrderBookSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<QuantOrderBookSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('[StorageManager] Failed to save settings:', e);
      }
    }
  }
}

export const storage = new StorageManager();
