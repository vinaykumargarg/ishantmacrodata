/**
 * ISHANT MACRO AI TERMINAL — TELEGRAM MARKET ALERT CLIENT SERVICE
 * Handles communication with the backend Telegram bot daemon, Supabase persistence,
 * and live alert dispatching.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface TelegramConfigState {
  chatId: string;
  telegramUsername?: string;
  isConnected: boolean;
  isBackendRunning: boolean;
  botUsername: string;
  botId?: number;
  lastVerifiedAt?: string;
  error?: string;
}

export interface AlertToggles {
  priceCrossing: boolean;
  supportResistanceBreakout: boolean;
  liquiditySweep: boolean;
  liquidationClusters: boolean;
  volumeFundingSpikes: boolean;
  marketStructureShifts: boolean;
  btcUsdtMomentum: boolean;
  longShortWaitSetups: boolean;
  entryTpSlRiskReward: boolean;
  macroEconomicNews: boolean;
  dailySummary: boolean;
  emergencyVolatility: boolean;
}

export interface AssetAlertSetting {
  enabled: boolean;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
  frequency: 'instant' | '5m' | '15m' | '30m' | '1h' | '4h' | 'daily';
  upperThreshold: number;
  lowerThreshold: number;
  minConfidence: number; // e.g. 80
}

export type SupportedAssetKey = 'BTC' | 'ETH' | 'SOL' | 'XAUUSD' | 'XAGUSD' | 'DXY' | 'USDT_D';

export interface LiveMarketAssetSnapshot {
  price: number;
  change24h: number;
  source: string;
  status: string;
  exchange_binance?: number;
  exchange_delta?: number;
  exchange_spot?: number;
  delta_symbol?: string;
  funding_rate?: number;
}

export interface AlertHistoryItem {
  id: string;
  chat_id: string;
  asset: string;
  alert_type: string;
  price: number;
  bias: string;
  confidence: number;
  status: 'DELIVERED' | 'FAILED' | 'THROTTLED';
  message: string;
  ist_timestamp: string;
  created_at: string;
}

export const DEFAULT_ALERT_TOGGLES: AlertToggles = {
  priceCrossing: true,
  supportResistanceBreakout: true,
  liquiditySweep: true,
  liquidationClusters: true,
  volumeFundingSpikes: true,
  marketStructureShifts: true,
  btcUsdtMomentum: true,
  longShortWaitSetups: true,
  entryTpSlRiskReward: true,
  macroEconomicNews: true,
  dailySummary: true,
  emergencyVolatility: true,
};

export const DEFAULT_ASSET_SETTINGS: Record<SupportedAssetKey, AssetAlertSetting> = {
  BTC: {
    enabled: true,
    timeframe: '15m',
    frequency: '5m',
    upperThreshold: 88000,
    lowerThreshold: 80000,
    minConfidence: 85,
  },
  ETH: {
    enabled: true,
    timeframe: '15m',
    frequency: '15m',
    upperThreshold: 2800,
    lowerThreshold: 2350,
    minConfidence: 80,
  },
  SOL: {
    enabled: true,
    timeframe: '15m',
    frequency: '15m',
    upperThreshold: 130,
    lowerThreshold: 98,
    minConfidence: 80,
  },
  XAUUSD: {
    enabled: true,
    timeframe: '15m',
    frequency: '15m',
    upperThreshold: 4300,
    lowerThreshold: 4050,
    minConfidence: 85,
  },
  XAGUSD: {
    enabled: true,
    timeframe: '1h',
    frequency: '30m',
    upperThreshold: 65,
    lowerThreshold: 52,
    minConfidence: 80,
  },
  DXY: {
    enabled: true,
    timeframe: '1h',
    frequency: '1h',
    upperThreshold: 104,
    lowerThreshold: 100.5,
    minConfidence: 80,
  },
  USDT_D: {
    enabled: true,
    timeframe: '15m',
    frequency: '15m',
    upperThreshold: 7.5,
    lowerThreshold: 5.2,
    minConfidence: 80,
  },
};

const STORAGE_KEY_CHAT_ID = 'ISHANT_TELEGRAM_CHAT_ID';
const STORAGE_KEY_TOGGLES = 'ISHANT_TELEGRAM_TOGGLES';
const STORAGE_KEY_ASSETS = 'ISHANT_TELEGRAM_ASSETS';

class TelegramAlertService {
  private apiBase = '/api/telegram';

  /**
   * Check connection to backend Telegram service
   */
  async checkBackendStatus(): Promise<{
    configured: boolean;
    botUsername: string;
    botInfo: any;
    subscribersCount: number;
    subscribers: any[];
    istTime: string;
  }> {
    try {
      const res = await fetch(`${this.apiBase}/status`);
      if (res.ok) {
        const data = await res.json();
        return {
          configured: data.configured,
          botUsername: data.bot_username || 'Researchsomething_bot',
          botInfo: data.bot_info || {},
          subscribersCount: data.subscribers_count || 0,
          subscribers: data.subscribers || [],
          istTime: data.ist_time || '',
        };
      }
    } catch (e) {
      console.warn('Backend telegram status check warning:', e);
    }
    return {
      configured: false,
      botUsername: 'Researchsomething_bot',
      botInfo: {},
      subscribersCount: 0,
      subscribers: [],
      istTime: '',
    };
  }

  /**
   * Verify and connect a Telegram Chat ID
   */
  async verifyChatId(chatId: string): Promise<{
    success: boolean;
    error?: string;
    hint?: string;
    data?: any;
  }> {
    const trimmedId = chatId.trim();
    if (!trimmedId) {
      return { success: false, error: 'Chat ID cannot be empty.' };
    }

    try {
      const res = await fetch(`${this.apiBase}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: trimmedId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        this.saveSavedChatId(trimmedId);
        return { success: true, data };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to verify Chat ID with Telegram.',
          hint: data.hint || `Make sure you clicked Start on @Researchsomething_bot in Telegram first.`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to connect to Telegram Alert backend.',
      };
    }
  }

  /**
   * Send an institutional test alert to the specified or stored Chat ID
   */
  async sendTestAlert(
    chatId: string,
    asset: SupportedAssetKey = 'BTC',
    alertType: string = 'liquidity_sweep'
  ): Promise<{
    success: boolean;
    error?: string;
    alert?: any;
  }> {
    try {
      const res = await fetch(`${this.apiBase}/test-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          asset,
          alert_type: alertType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        return { success: true, alert: data.alert };
      } else {
        return { success: false, error: data.error || 'Telegram message rejected.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error dispatching test alert.' };
    }
  }

  /**
   * Trigger Daily Macro Briefing
   */
  async triggerDailySummary(chatId?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.apiBase}/trigger-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json();
      return { success: Boolean(data.ok), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Trigger Emergency Volatility Alert
   */
  async triggerEmergencyVolatility(chatId?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.apiBase}/trigger-volatility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json();
      return { success: Boolean(data.ok), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Fetch Live Market Data for all supported assets
   */
  async fetchLiveMarketData(): Promise<Record<SupportedAssetKey, LiveMarketAssetSnapshot> | null> {
    try {
      const res = await fetch(`${this.apiBase}/live-market-data`);
      if (res.ok) {
        const data = await res.json();
        return data.data || null;
      }
    } catch (e) {
      console.warn('Failed to fetch live market data from backend:', e);
    }
    return null;
  }

  /**
   * Fetch recent alert history
   */
  async fetchAlertHistory(limit: number = 30): Promise<AlertHistoryItem[]> {
    try {
      const res = await fetch(`${this.apiBase}/history?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return data.history || [];
      }
    } catch (e) {
      console.warn('Failed to fetch alert history:', e);
    }
    return [];
  }

  /**
   * Save user configuration to backend and Supabase
   */
  async saveConfiguration(
    chatId: string,
    toggles: AlertToggles,
    assets: Record<SupportedAssetKey, AssetAlertSetting>,
    userId?: string
  ): Promise<boolean> {
    try {
      localStorage.setItem(STORAGE_KEY_TOGGLES, JSON.stringify(toggles));
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));

      // 1. Backend sync
      await fetch(`${this.apiBase}/save-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          alert_toggles: toggles,
          asset_settings: assets,
          user_id: userId,
        }),
      });

      // 2. Supabase sync if connected
      if (isSupabaseConfigured && supabase && userId) {
        await supabase.from('telegram_subscribers').upsert({
          user_id: userId,
          chat_id: chatId,
          alert_toggles: toggles,
          asset_settings: assets,
          is_connected: true,
          updated_at: new Date().toISOString(),
        });
      }
      return true;
    } catch (e) {
      console.error('Error saving telegram config:', e);
      return false;
    }
  }

  // Local Storage Helpers
  getSavedChatId(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_CHAT_ID) || '';
  }

  saveSavedChatId(chatId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_CHAT_ID, chatId.trim());
  }

  getSavedToggles(): AlertToggles {
    if (typeof window === 'undefined') return DEFAULT_ALERT_TOGGLES;
    const item = localStorage.getItem(STORAGE_KEY_TOGGLES);
    if (!item) return DEFAULT_ALERT_TOGGLES;
    try {
      return { ...DEFAULT_ALERT_TOGGLES, ...JSON.parse(item) };
    } catch {
      return DEFAULT_ALERT_TOGGLES;
    }
  }

  getSavedAssetSettings(): Record<SupportedAssetKey, AssetAlertSetting> {
    if (typeof window === 'undefined') return DEFAULT_ASSET_SETTINGS;
    const item = localStorage.getItem(STORAGE_KEY_ASSETS);
    if (!item) return DEFAULT_ASSET_SETTINGS;
    try {
      return { ...DEFAULT_ASSET_SETTINGS, ...JSON.parse(item) };
    } catch {
      return DEFAULT_ASSET_SETTINGS;
    }
  }
}

export const telegramAlertService = new TelegramAlertService();
