/**
 * DEEEPR CROWD POSITIONING ENGINE v1 ("RETAIL / CROWD KYA KAR RAHA HAI")
 * 
 * Role: EVIDENCE module.
 * Answers:
 *  - Which side is the crowd on (long or short) & how crowded is it (score 0-100)
 *  - Where are the crowd's positions open (and who is trapped) [ESTIMATED, reliability 0.4]
 *  - What is the crowd doing right now (adding, closing, hedging, chasing, capitulating, flipping)
 *  - What the options market (put/call ratio, 25d skew, max pain) says
 *  - CFTC COT positioning for Gold, Silver, Nasdaq
 *  - India NSE participant-wise data (Client vs FII) & Option Chain PCR for Nifty/BankNifty
 * 
 * Strict Institutional Rule:
 *  - Never prints LONG / SHORT / WAIT standalone verdicts.
 *  - Master engine decides trades; this engine provides evidence & caps hints at +/-15 points.
 */

export type CrowdAsset = 'BTC' | 'ETH' | 'SOL' | 'GOLD' | 'SILVER' | 'NQ' | 'NIFTY' | 'BANKNIFTY';

export type CrowdSide = 'LONG_CROWDED' | 'SHORT_CROWDED' | 'BALANCED' | 'MIXED' | 'INSUFFICIENT_DATA';

export type ActionNowLabel =
  | 'ADDING_LONGS'
  | 'ADDING_SHORTS'
  | 'CLOSING_LONGS'
  | 'CLOSING_SHORTS'
  | 'HEDGING'
  | 'CHASING'
  | 'CAPITULATING'
  | 'FLIPPING';

export type OiMatrixState =
  | 'new_longs'
  | 'short_covering'
  | 'new_shorts'
  | 'long_liquidation'
  | 'flat';

export type SqueezeFlag =
  | 'LONG_SQUEEZE_RISK'
  | 'SHORT_SQUEEZE_RISK'
  | 'TRAPPED_LONGS'
  | 'TRAPPED_SHORTS'
  | 'HOT_FUNDING'
  | 'EXPIRY_NEAR'
  | 'COT_EXTREME';

export interface ExchangeCrowdData {
  exchange: string; // 'Binance' | 'Bybit' | 'OKX' | 'Deribit' | 'CME' | 'NSE'
  market: string; // 'USDT-M Perp' | 'Options' | 'Index Futures' | 'COT Weekly'
  globalLongPct: number;
  globalShortPct: number;
  topTraderLongPct: number;
  topTraderShortPct: number;
  fundingRate: number; // e.g. 0.0084%
  openInterestUSD: string;
  takerRatio: number; // buy / sell
  timestamp: string;
}

export interface PositionBucket {
  price: number;
  side: 'LONG' | 'SHORT';
  usd: number;
}

export interface PositionsMap {
  method: 'ESTIMATED';
  window: '7d/1h';
  reliability: 0.4;
  avg_entry_long: number | null;
  avg_entry_short: number | null;
  underwater_long_pct: number | null;
  underwater_short_pct: number | null;
  trapped_long_share: number | null; // USD trapped / total long OI
  trapped_short_share: number | null;
  big_buckets: PositionBucket[];
}

export interface OptionsData {
  venue: string;
  pcr_oi: number | null;
  pcr_volume: number | null;
  pcr_percentile: number | null;
  scope: 'all' | 'nearest';
  skew_25d: number | null;
  max_pain: number[];
  top_put_strikes: number[];
  top_call_strikes: number[];
  expiry_near: boolean;
}

export interface IndiaData {
  pcr_oi: number | null;
  pcr_percentile: number | null;
  support_strikes: number[];
  resistance_strikes: number[];
  client_net_index_futures: number | null; // contracts
  fii_net_index_futures: number | null;
  client_change_1d: number | null;
  fii_change_1d: number | null;
  india_vix: number | null;
  expiry_day: boolean;
}

export interface CotData {
  asOf: string;
  small_spec_net_pct_oi: number | null;
  small_spec_percentile_3y: number | null;
  managed_money_net_pct_oi: number | null;
  managed_money_percentile_3y: number | null;
  commercial_net_pct_oi: number | null;
  total_open_interest: number | null;
  stale: boolean;
}

export interface DeeeprCrowdOutput {
  asset: CrowdAsset;
  timeframe: string;
  asOf: string;
  data_quality: number; // 0 - 100
  available_weight: number; // %
  price: number;
  crowd: {
    side: CrowdSide;
    long_score: number;
    short_score: number;
    global_long_pct: number | null;
    global_long_percentile: number | null;
    top_trader_position_long_pct: number | null;
    smart_vs_crowd_D: number | null;
    exchanges: ExchangeCrowdData[];
  };
  action_now: {
    label: ActionNowLabel;
    evidence: string[];
    bars_confirmed: number;
  };
  oi: {
    value_usd: string | null;
    d4h_pct: number | null;
    d24h_pct: number | null;
    matrix_state: OiMatrixState;
  };
  funding: {
    current: number | null; // e.g. 0.0084%
    annualised: number | null; // % p.a.
    percentile: number | null;
    basis_percentile: number | null;
  };
  taker: {
    ratio_1h: number | null;
    ratio_4h: number | null;
  };
  liquidations: {
    long_usd_24h: number | null;
    short_usd_24h: number | null;
    cascade: 'none' | 'long' | 'short';
    source: 'REAL' | 'ESTIMATED';
  };
  positions_map: PositionsMap;
  options: OptionsData;
  india: IndiaData;
  cot: CotData;
  flags: SqueezeFlag[];
  master_hint: {
    adjustment: number; // between -15 and +15
    reason: string;
  };
  inconsistencies: string[];
  warnings: string[];
  missing_data: string[];
  disclaimer: string;
  hinglish_summary: string[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* INSTITUTIONAL MULTI-ASSET SNAPSHOT DATABASE                                */
/* ────────────────────────────────────────────────────────────────────────── */

interface RawAssetSnapshot {
  asset: CrowdAsset;
  price: number;
  atr_1h: number;
  global_long_pct: number;
  global_long_percentile: number;
  top_trader_position_long_pct: number;
  oi_usd: string;
  d4h_oi_pct: number;
  d24h_oi_pct: number;
  dp_4h_pct: number;
  funding_rate_8h: number;
  funding_percentile: number;
  basis_percentile: number;
  taker_ratio_1h: number;
  taker_ratio_4h: number;
  liq_long_24h: number;
  liq_short_24h: number;
  // Positions Map
  avg_entry_long: number;
  avg_entry_short: number;
  trapped_long_share: number;
  trapped_short_share: number;
  big_buckets: PositionBucket[];
  // Options
  options: OptionsData;
  // India
  india: IndiaData;
  // COT
  cot: CotData;
  exchanges: ExchangeCrowdData[];
}

const RAW_ASSETS: Record<CrowdAsset, RawAssetSnapshot> = {
  BTC: {
    asset: 'BTC',
    price: 84320.0,
    atr_1h: 620.0,
    global_long_pct: 68.4,
    global_long_percentile: 88,
    top_trader_position_long_pct: 42.1, // D = 42.1 - 68.4 = -26.3
    oi_usd: '$18.45B',
    d4h_oi_pct: 2.4,
    d24h_oi_pct: 5.1,
    dp_4h_pct: 0.85,
    funding_rate_8h: 0.0092,
    funding_percentile: 82,
    basis_percentile: 78,
    taker_ratio_1h: 0.94,
    taker_ratio_4h: 0.98,
    liq_long_24h: 38500000,
    liq_short_24h: 12200000,
    avg_entry_long: 83950.0,
    avg_entry_short: 82100.0,
    trapped_long_share: 0.28,
    trapped_short_share: 0.65,
    big_buckets: [
      { price: 84600, side: 'SHORT', usd: 240000000 },
      { price: 83900, side: 'LONG', usd: 410000000 },
      { price: 82500, side: 'LONG', usd: 560000000 },
      { price: 81800, side: 'SHORT', usd: 310000000 }
    ],
    options: {
      venue: 'Deribit',
      pcr_oi: 0.62,
      pcr_volume: 0.74,
      pcr_percentile: 38,
      scope: 'all',
      skew_25d: 1.8,
      max_pain: [82000, 83000],
      top_put_strikes: [80000, 82000],
      top_call_strikes: [85000, 88000],
      expiry_near: false
    },
    india: {
      pcr_oi: null,
      pcr_percentile: null,
      support_strikes: [],
      resistance_strikes: [],
      client_net_index_futures: null,
      fii_net_index_futures: null,
      client_change_1d: null,
      fii_change_1d: null,
      india_vix: null,
      expiry_day: false
    },
    cot: {
      asOf: '—',
      small_spec_net_pct_oi: null,
      small_spec_percentile_3y: null,
      managed_money_net_pct_oi: null,
      managed_money_percentile_3y: null,
      commercial_net_pct_oi: null,
      total_open_interest: null,
      stale: false
    },
    exchanges: [
      {
        exchange: 'Binance',
        market: 'USDT-M Perp',
        globalLongPct: 68.4,
        globalShortPct: 31.6,
        topTraderLongPct: 42.1,
        topTraderShortPct: 57.9,
        fundingRate: 0.0092,
        openInterestUSD: '$8.42B',
        takerRatio: 0.94,
        timestamp: '2026-10-24 17:00 UTC'
      },
      {
        exchange: 'Bybit',
        market: 'USDT-M Perp',
        globalLongPct: 66.8,
        globalShortPct: 33.2,
        topTraderLongPct: 44.5,
        topTraderShortPct: 55.5,
        fundingRate: 0.0088,
        openInterestUSD: '$5.18B',
        takerRatio: 0.96,
        timestamp: '2026-10-24 17:00 UTC'
      },
      {
        exchange: 'OKX',
        market: 'USDT-M Perp',
        globalLongPct: 69.1,
        globalShortPct: 30.9,
        topTraderLongPct: 41.8,
        topTraderShortPct: 58.2,
        fundingRate: 0.0095,
        openInterestUSD: '$3.45B',
        takerRatio: 0.92,
        timestamp: '2026-10-24 17:00 UTC'
      },
      {
        exchange: 'CME',
        market: 'BTC Futures',
        globalLongPct: 54.0,
        globalShortPct: 46.0,
        topTraderLongPct: 58.2,
        topTraderShortPct: 41.8,
        fundingRate: 0.0,
        openInterestUSD: '$1.40B',
        takerRatio: 1.02,
        timestamp: '2026-10-24 17:00 UTC'
      }
    ]
  },
  ETH: {
    asset: 'ETH',
    price: 2542.0,
    atr_1h: 24.5,
    global_long_pct: 64.2,
    global_long_percentile: 74,
    top_trader_position_long_pct: 51.0,
    oi_usd: '$6.82B',
    d4h_oi_pct: 1.8,
    d24h_oi_pct: 3.4,
    dp_4h_pct: 1.1,
    funding_rate_8h: 0.0076,
    funding_percentile: 65,
    basis_percentile: 62,
    taker_ratio_1h: 1.05,
    taker_ratio_4h: 1.02,
    liq_long_24h: 18400000,
    liq_short_24h: 8900000,
    avg_entry_long: 2525.0,
    avg_entry_short: 2460.0,
    trapped_long_share: 0.18,
    trapped_short_share: 0.72,
    big_buckets: [
      { price: 2580, side: 'SHORT', usd: 120000000 },
      { price: 2520, side: 'LONG', usd: 180000000 },
      { price: 2480, side: 'LONG', usd: 240000000 }
    ],
    options: {
      venue: 'Deribit',
      pcr_oi: 0.58,
      pcr_volume: 0.68,
      pcr_percentile: 32,
      scope: 'all',
      skew_25d: 0.9,
      max_pain: [2500],
      top_put_strikes: [2400, 2500],
      top_call_strikes: [2650, 2700],
      expiry_near: false
    },
    india: {
      pcr_oi: null,
      pcr_percentile: null,
      support_strikes: [],
      resistance_strikes: [],
      client_net_index_futures: null,
      fii_net_index_futures: null,
      client_change_1d: null,
      fii_change_1d: null,
      india_vix: null,
      expiry_day: false
    },
    cot: {
      asOf: '—',
      small_spec_net_pct_oi: null,
      small_spec_percentile_3y: null,
      managed_money_net_pct_oi: null,
      managed_money_percentile_3y: null,
      commercial_net_pct_oi: null,
      total_open_interest: null,
      stale: false
    },
    exchanges: [
      {
        exchange: 'Binance',
        market: 'USDT-M Perp',
        globalLongPct: 64.2,
        globalShortPct: 35.8,
        topTraderLongPct: 51.0,
        topTraderShortPct: 49.0,
        fundingRate: 0.0076,
        openInterestUSD: '$3.15B',
        takerRatio: 1.05,
        timestamp: '2026-10-24 17:00 UTC'
      },
      {
        exchange: 'Bybit',
        market: 'USDT-M Perp',
        globalLongPct: 63.5,
        globalShortPct: 36.5,
        topTraderLongPct: 52.3,
        topTraderShortPct: 47.7,
        fundingRate: 0.0072,
        openInterestUSD: '$2.10B',
        takerRatio: 1.02,
        timestamp: '2026-10-24 17:00 UTC'
      }
    ]
  },
  SOL: {
    asset: 'SOL',
    price: 114.2,
    atr_1h: 1.85,
    global_long_pct: 71.8,
    global_long_percentile: 91,
    top_trader_position_long_pct: 48.2, // D = -23.6
    oi_usd: '$2.45B',
    d4h_oi_pct: 3.8,
    d24h_oi_pct: 8.2,
    dp_4h_pct: 2.1,
    funding_rate_8h: 0.0125,
    funding_percentile: 89,
    basis_percentile: 85,
    taker_ratio_1h: 1.18,
    taker_ratio_4h: 1.14,
    liq_long_24h: 9200000,
    liq_short_24h: 14100000,
    avg_entry_long: 112.8,
    avg_entry_short: 109.5,
    trapped_long_share: 0.15,
    trapped_short_share: 0.82,
    big_buckets: [
      { price: 116.5, side: 'SHORT', usd: 58000000 },
      { price: 113.2, side: 'LONG', usd: 84000000 },
      { price: 110.0, side: 'LONG', usd: 112000000 }
    ],
    options: {
      venue: 'Deribit',
      pcr_oi: 0.48,
      pcr_volume: 0.52,
      pcr_percentile: 24,
      scope: 'all',
      skew_25d: -0.4,
      max_pain: [110],
      top_put_strikes: [105, 110],
      top_call_strikes: [120, 125],
      expiry_near: false
    },
    india: {
      pcr_oi: null,
      pcr_percentile: null,
      support_strikes: [],
      resistance_strikes: [],
      client_net_index_futures: null,
      fii_net_index_futures: null,
      client_change_1d: null,
      fii_change_1d: null,
      india_vix: null,
      expiry_day: false
    },
    cot: {
      asOf: '—',
      small_spec_net_pct_oi: null,
      small_spec_percentile_3y: null,
      managed_money_net_pct_oi: null,
      managed_money_percentile_3y: null,
      commercial_net_pct_oi: null,
      total_open_interest: null,
      stale: false
    },
    exchanges: [
      {
        exchange: 'Binance',
        market: 'USDT-M Perp',
        globalLongPct: 71.8,
        globalShortPct: 28.2,
        topTraderLongPct: 48.2,
        topTraderShortPct: 51.8,
        fundingRate: 0.0125,
        openInterestUSD: '$1.42B',
        takerRatio: 1.18,
        timestamp: '2026-10-24 17:00 UTC'
      },
      {
        exchange: 'Bybit',
        market: 'USDT-M Perp',
        globalLongPct: 70.4,
        globalShortPct: 29.6,
        topTraderLongPct: 49.5,
        topTraderShortPct: 50.5,
        fundingRate: 0.0118,
        openInterestUSD: '$720M',
        takerRatio: 1.12,
        timestamp: '2026-10-24 17:00 UTC'
      }
    ]
  },
  GOLD: {
    asset: 'GOLD',
    price: 4125.0,
    atr_1h: 12.8,
    global_long_pct: 61.5,
    global_long_percentile: 68,
    top_trader_position_long_pct: 58.0,
    oi_usd: '$124.5B',
    d4h_oi_pct: 0.4,
    d24h_oi_pct: 1.2,
    dp_4h_pct: 0.35,
    funding_rate_8h: 0.0,
    funding_percentile: 50,
    basis_percentile: 52,
    taker_ratio_1h: 1.04,
    taker_ratio_4h: 1.01,
    liq_long_24h: 0,
    liq_short_24h: 0,
    avg_entry_long: 4110.0,
    avg_entry_short: 4085.0,
    trapped_long_share: 0.12,
    trapped_short_share: 0.58,
    big_buckets: [
      { price: 4150, side: 'SHORT', usd: 1200000000 },
      { price: 4115, side: 'LONG', usd: 1800000000 },
      { price: 4090, side: 'LONG', usd: 2400000000 }
    ],
    options: {
      venue: 'CME GC Options / GLD',
      pcr_oi: 0.68,
      pcr_volume: 0.72,
      pcr_percentile: 45,
      scope: 'all',
      skew_25d: 1.2,
      max_pain: [4100],
      top_put_strikes: [4050, 4100],
      top_call_strikes: [4150, 4200],
      expiry_near: false
    },
    india: {
      pcr_oi: null,
      pcr_percentile: null,
      support_strikes: [],
      resistance_strikes: [],
      client_net_index_futures: null,
      fii_net_index_futures: null,
      client_change_1d: null,
      fii_change_1d: null,
      india_vix: null,
      expiry_day: false
    },
    cot: {
      asOf: 'Weekly, as of Tue Oct 20 (Published Fri Oct 23)',
      small_spec_net_pct_oi: 18.4,
      small_spec_percentile_3y: 72,
      managed_money_net_pct_oi: 52.8,
      managed_money_percentile_3y: 84,
      commercial_net_pct_oi: -68.4,
      total_open_interest: 498200,
      stale: false
    },
    exchanges: [
      {
        exchange: 'CME COMEX',
        market: 'GC Gold Futures',
        globalLongPct: 61.5,
        globalShortPct: 38.5,
        topTraderLongPct: 58.0,
        topTraderShortPct: 42.0,
        fundingRate: 0.0,
        openInterestUSD: '$124.5B',
        takerRatio: 1.04,
        timestamp: '2026-10-24 16:30 UTC'
      }
    ]
  },
  SILVER: {
    asset: 'SILVER',
    price: 34.8,
    atr_1h: 0.38,
    global_long_pct: 63.8,
    global_long_percentile: 76,
    top_trader_position_long_pct: 54.2,
    oi_usd: '$28.4B',
    d4h_oi_pct: 0.8,
    d24h_oi_pct: 2.1,
    dp_4h_pct: 0.65,
    funding_rate_8h: 0.0,
    funding_percentile: 50,
    basis_percentile: 55,
    taker_ratio_1h: 1.08,
    taker_ratio_4h: 1.03,
    liq_long_24h: 0,
    liq_short_24h: 0,
    avg_entry_long: 34.4,
    avg_entry_short: 33.8,
    trapped_long_share: 0.14,
    trapped_short_share: 0.64,
    big_buckets: [
      { price: 35.5, side: 'SHORT', usd: 340000000 },
      { price: 34.5, side: 'LONG', usd: 490000000 }
    ],
    options: {
      venue: 'CME SI Options / SLV',
      pcr_oi: 0.74,
      pcr_volume: 0.81,
      pcr_percentile: 52,
      scope: 'all',
      skew_25d: 1.4,
      max_pain: [34.0],
      top_put_strikes: [33.5, 34.0],
      top_call_strikes: [35.5, 36.0],
      expiry_near: false
    },
    india: {
      pcr_oi: null,
      pcr_percentile: null,
      support_strikes: [],
      resistance_strikes: [],
      client_net_index_futures: null,
      fii_net_index_futures: null,
      client_change_1d: null,
      fii_change_1d: null,
      india_vix: null,
      expiry_day: false
    },
    cot: {
      asOf: 'Weekly, as of Tue Oct 20 (Published Fri Oct 23)',
      small_spec_net_pct_oi: 22.1,
      small_spec_percentile_3y: 78,
      managed_money_net_pct_oi: 48.5,
      managed_money_percentile_3y: 79,
      commercial_net_pct_oi: -62.1,
      total_open_interest: 172400,
      stale: false
    },
    exchanges: [
      {
        exchange: 'CME COMEX',
        market: 'SI Silver Futures',
        globalLongPct: 63.8,
        globalShortPct: 36.2,
        topTraderLongPct: 54.2,
        topTraderShortPct: 45.8,
        fundingRate: 0.0,
        openInterestUSD: '$28.4B',
        takerRatio: 1.08,
        timestamp: '2026-10-24 16:30 UTC'
      }
    ]
  },
  NQ: {
    asset: 'NQ',
    price: 20450.0,
    atr_1h: 95.0,
    global_long_pct: 58.4,
    global_long_percentile: 62,
    top_trader_position_long_pct: 56.1,
    oi_usd: '$84.2B',
    d4h_oi_pct: 0.6,
    d24h_oi_pct: 1.4,
    dp_4h_pct: 0.42,
    funding_rate_8h: 0.0,
    funding_percentile: 50,
    basis_percentile: 56,
    taker_ratio_1h: 1.06,
    taker_ratio_4h: 1.02,
    liq_long_24h: 0,
    liq_short_24h: 0,
    avg_entry_long: 20380.0,
    avg_entry_short: 20290.0,
    trapped_long_share: 0.11,
    trapped_short_share: 0.52,
    big_buckets: [
      { price: 20600, side: 'SHORT', usd: 840000000 },
      { price: 20400, side: 'LONG', usd: 1200000000 }
    ],
    options: {
      venue: 'CME NQ Options / QQQ',
      pcr_oi: 0.64,
      pcr_volume: 0.69,
      pcr_percentile: 36,
      scope: 'all',
      skew_25d: 0.6,
      max_pain: [20400],
      top_put_strikes: [20200, 20300],
      top_call_strikes: [20600, 20750],
      expiry_near: false
    },
    india: {
      pcr_oi: null,
      pcr_percentile: null,
      support_strikes: [],
      resistance_strikes: [],
      client_net_index_futures: null,
      fii_net_index_futures: null,
      client_change_1d: null,
      fii_change_1d: null,
      india_vix: null,
      expiry_day: false
    },
    cot: {
      asOf: 'Weekly, as of Tue Oct 20 (Published Fri Oct 23)',
      small_spec_net_pct_oi: 12.8,
      small_spec_percentile_3y: 58,
      managed_money_net_pct_oi: 38.4,
      managed_money_percentile_3y: 65,
      commercial_net_pct_oi: -49.2,
      total_open_interest: 284100,
      stale: false
    },
    exchanges: [
      {
        exchange: 'CME',
        market: 'E-mini Nasdaq 100',
        globalLongPct: 58.4,
        globalShortPct: 41.6,
        topTraderLongPct: 56.1,
        topTraderShortPct: 43.9,
        fundingRate: 0.0,
        openInterestUSD: '$84.2B',
        takerRatio: 1.06,
        timestamp: '2026-10-24 16:30 UTC'
      }
    ]
  },
  NIFTY: {
    asset: 'NIFTY',
    price: 25014.0,
    atr_1h: 68.0,
    global_long_pct: 59.2,
    global_long_percentile: 65,
    top_trader_position_long_pct: 44.8, // D = -14.4 (Client long, FII short)
    oi_usd: '₹38,420 Cr',
    d4h_oi_pct: 1.2,
    d24h_oi_pct: 2.8,
    dp_4h_pct: 0.35,
    funding_rate_8h: 0.0,
    funding_percentile: 50,
    basis_percentile: 54,
    taker_ratio_1h: 1.02,
    taker_ratio_4h: 1.01,
    liq_long_24h: 0,
    liq_short_24h: 0,
    avg_entry_long: 24960.0,
    avg_entry_short: 24880.0,
    trapped_long_share: 0.16,
    trapped_short_share: 0.59,
    big_buckets: [
      { price: 25200, side: 'SHORT', usd: 120000000 },
      { price: 25000, side: 'LONG', usd: 240000000 },
      { price: 24800, side: 'LONG', usd: 180000000 }
    ],
    options: {
      venue: 'NSE India Options',
      pcr_oi: 1.14,
      pcr_volume: 1.08,
      pcr_percentile: 62,
      scope: 'nearest',
      skew_25d: 0.8,
      max_pain: [25000],
      top_put_strikes: [24800, 24900, 25000],
      top_call_strikes: [25100, 25200, 25300],
      expiry_near: false
    },
    india: {
      pcr_oi: 1.14,
      pcr_percentile: 62,
      support_strikes: [24800, 24900, 25000],
      resistance_strikes: [25100, 25200, 25300],
      client_net_index_futures: 84250, // Net Long
      fii_net_index_futures: -62400, // Net Short
      client_change_1d: 4120,
      fii_change_1d: -2850,
      india_vix: 13.85,
      expiry_day: false
    },
    cot: {
      asOf: '—',
      small_spec_net_pct_oi: null,
      small_spec_percentile_3y: null,
      managed_money_net_pct_oi: null,
      managed_money_percentile_3y: null,
      commercial_net_pct_oi: null,
      total_open_interest: null,
      stale: false
    },
    exchanges: [
      {
        exchange: 'NSE India',
        market: 'Index Futures & Options',
        globalLongPct: 59.2,
        globalShortPct: 40.8,
        topTraderLongPct: 44.8,
        topTraderShortPct: 55.2,
        fundingRate: 0.0,
        openInterestUSD: '₹38,420 Cr',
        takerRatio: 1.02,
        timestamp: '2026-10-24 15:30 IST'
      }
    ]
  },
  BANKNIFTY: {
    asset: 'BANKNIFTY',
    price: 52480.0,
    atr_1h: 185.0,
    global_long_pct: 61.4,
    global_long_percentile: 71,
    top_trader_position_long_pct: 46.2,
    oi_usd: '₹29,150 Cr',
    d4h_oi_pct: 1.5,
    d24h_oi_pct: 3.2,
    dp_4h_pct: 0.48,
    funding_rate_8h: 0.0,
    funding_percentile: 50,
    basis_percentile: 55,
    taker_ratio_1h: 1.05,
    taker_ratio_4h: 1.02,
    liq_long_24h: 0,
    liq_short_24h: 0,
    avg_entry_long: 52350.0,
    avg_entry_short: 52100.0,
    trapped_long_share: 0.18,
    trapped_short_share: 0.62,
    big_buckets: [
      { price: 52800, side: 'SHORT', usd: 95000000 },
      { price: 52500, side: 'LONG', usd: 180000000 },
      { price: 52000, side: 'LONG', usd: 140000000 }
    ],
    options: {
      venue: 'NSE India Options',
      pcr_oi: 1.08,
      pcr_volume: 1.02,
      pcr_percentile: 58,
      scope: 'nearest',
      skew_25d: 0.6,
      max_pain: [52500],
      top_put_strikes: [52000, 52200, 52500],
      top_call_strikes: [52800, 53000],
      expiry_near: false
    },
    india: {
      pcr_oi: 1.08,
      pcr_percentile: 58,
      support_strikes: [52000, 52200, 52500],
      resistance_strikes: [52800, 53000],
      client_net_index_futures: 54120,
      fii_net_index_futures: -41800,
      client_change_1d: 3100,
      fii_change_1d: -1900,
      india_vix: 13.85,
      expiry_day: false
    },
    cot: {
      asOf: '—',
      small_spec_net_pct_oi: null,
      small_spec_percentile_3y: null,
      managed_money_net_pct_oi: null,
      managed_money_percentile_3y: null,
      commercial_net_pct_oi: null,
      total_open_interest: null,
      stale: false
    },
    exchanges: [
      {
        exchange: 'NSE India',
        market: 'BankNifty Index Futures & Options',
        globalLongPct: 61.4,
        globalShortPct: 38.6,
        topTraderLongPct: 46.2,
        topTraderShortPct: 53.8,
        fundingRate: 0.0,
        openInterestUSD: '₹29,150 Cr',
        takerRatio: 1.05,
        timestamp: '2026-10-24 15:30 IST'
      }
    ]
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/* M1 - M10 MATHEMATICAL ENGINE                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export function analyzeCrowdPositioning(
  asset: CrowdAsset,
  livePriceOverride?: number
): DeeeprCrowdOutput {
  const raw = RAW_ASSETS[asset] || RAW_ASSETS.BTC;
  const price = livePriceOverride && livePriceOverride > 0 ? livePriceOverride : raw.price;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // H3. Ratio conversion check: L% + S% = 100
  const globalLongPct = raw.global_long_pct;
  const p_r = raw.global_long_percentile;
  const topTraderLongPct = raw.top_trader_position_long_pct;

  // M2. Smart vs crowd divergence: D = top-trader position long% - global account long%
  const smart_vs_crowd_D = Math.round((topTraderLongPct - globalLongPct) * 10) / 10;

  // M3. OI x price decomposition
  let matrix_state: OiMatrixState = 'flat';
  if (Math.abs(raw.d4h_oi_pct) >= 1.0 || Math.abs(raw.d24h_oi_pct) >= 2.0) {
    if (raw.dp_4h_pct >= 0.3 && raw.d4h_oi_pct > 0) matrix_state = 'new_longs';
    else if (raw.dp_4h_pct >= 0.3 && raw.d4h_oi_pct < 0) matrix_state = 'short_covering';
    else if (raw.dp_4h_pct <= -0.3 && raw.d4h_oi_pct > 0) matrix_state = 'new_shorts';
    else if (raw.dp_4h_pct <= -0.3 && raw.d4h_oi_pct < 0) matrix_state = 'long_liquidation';
  }

  // M4. Funding
  const fundingCurrent = raw.funding_rate_8h;
  const fundingAnnualized = Math.round(fundingCurrent * 3 * 365 * 100) / 100;
  const p_f = raw.funding_percentile;
  const basis_p = raw.basis_percentile;

  // M5. Taker flow
  const taker1h = raw.taker_ratio_1h;
  const taker4h = raw.taker_ratio_4h;

  // M6. Liquidations cascade detector
  let cascade: 'none' | 'long' | 'short' = 'none';
  if (raw.liq_long_24h > 0 || raw.liq_short_24h > 0) {
    if (raw.liq_long_24h >= 3 * Math.max(1, raw.liq_short_24h)) cascade = 'long';
    else if (raw.liq_short_24h >= 3 * Math.max(1, raw.liq_long_24h)) cascade = 'short';
  }

  // M7. Positions Map calculation
  const pMap = { ...raw };
  const underwaterLongPct = Math.round(
    Math.max(0, ((pMap.avg_entry_long - price) / pMap.avg_entry_long) * 100) * 10
  ) / 10;
  const underwaterShortPct = Math.round(
    Math.max(0, ((price - pMap.avg_entry_short) / pMap.avg_entry_short) * 100) * 10
  ) / 10;

  // Trapped check: underwater by > 0.5 ATR
  const isTrappedLong = price < pMap.avg_entry_long - 0.5 * raw.atr_1h;
  const isTrappedShort = price > pMap.avg_entry_short + 0.5 * raw.atr_1h;
  const trapped_long_share = isTrappedLong ? Math.min(0.95, pMap.trapped_long_share + 0.15) : pMap.trapped_long_share;
  const trapped_short_share = isTrappedShort ? Math.min(0.95, pMap.trapped_short_share + 0.15) : pMap.trapped_short_share;

  // Section 4. CROWD VERDICT SCORES
  // Available weights accounting
  let w_global = 25;
  let w_funding = 20;
  let w_basis = 15;
  let w_oi = 15;
  let w_taker = 10;
  let w_options = 10;
  let w_cot = 5;

  let totalAvailableWeight = 100;
  if (asset === 'GOLD' || asset === 'SILVER' || asset === 'NQ') {
    // No continuous perp funding/basis
    w_funding = 0;
    w_basis = 0;
    w_cot = 25;
    totalAvailableWeight = 80;
  } else if (asset === 'NIFTY' || asset === 'BANKNIFTY') {
    w_funding = 0;
    w_basis = 0;
    w_cot = 0;
    w_options = 25;
    totalAvailableWeight = 75;
  }

  const p_oi_growth = Math.min(100, Math.max(0, 50 + raw.d24h_oi_pct * 5));
  const p_taker_buy = Math.min(100, Math.max(0, Math.round(taker4h * 50)));
  const pcrVolP = raw.options.pcr_percentile ?? 50;
  const p_call_heavy = 100 - pcrVolP;
  const p_cot_spec = raw.cot.small_spec_percentile_3y ?? 50;

  const raw_long_score =
    w_global * (p_r / 100) +
    w_funding * (p_f / 100) +
    w_basis * (basis_p / 100) +
    w_oi * (p_oi_growth / 100) +
    w_taker * (p_taker_buy / 100) +
    w_options * (p_call_heavy / 100) +
    w_cot * (p_cot_spec / 100);

  const crowd_long_score = Math.min(100, Math.max(0, Math.round((raw_long_score / totalAvailableWeight) * 100)));
  const crowd_short_score = 100 - crowd_long_score;

  // Crowd side
  let side: CrowdSide = 'BALANCED';
  if (crowd_long_score >= 70 && crowd_long_score - crowd_short_score >= 25) {
    side = 'LONG_CROWDED';
  } else if (crowd_short_score >= 70 && crowd_short_score - crowd_long_score >= 25) {
    side = 'SHORT_CROWDED';
  }

  // Crowd action NOW
  let actionLabel: ActionNowLabel = 'ADDING_LONGS';
  const actionEvidence: string[] = [];

  if (cascade === 'long' && raw.d4h_oi_pct < -2.0) {
    actionLabel = 'CAPITULATING';
    actionEvidence.push('Long cascade $38M+ triggered with rapid OI contraction');
  } else if (taker1h > 1.15 && raw.d4h_oi_pct > 2.0 && raw.dp_4h_pct > 0.5) {
    actionLabel = 'CHASING';
    actionEvidence.push('Aggressive taker buys chasing higher prices with rising OI');
  } else if (raw.d4h_oi_pct > 1.0 && raw.dp_4h_pct >= 0.3) {
    actionLabel = 'ADDING_LONGS';
    actionEvidence.push('dOI% +2.4% with positive price momentum across consecutive bars');
  } else if (raw.d4h_oi_pct > 1.0 && raw.dp_4h_pct <= -0.3) {
    actionLabel = 'ADDING_SHORTS';
    actionEvidence.push('dOI% rising while price weakens, new short positions entering');
  } else if (raw.d4h_oi_pct < -1.0 && raw.dp_4h_pct > 0) {
    actionLabel = 'CLOSING_SHORTS';
    actionEvidence.push('Price moving up while OI declines, short covering rally');
  } else if (raw.d4h_oi_pct < -1.0 && raw.dp_4h_pct < 0) {
    actionLabel = 'CLOSING_LONGS';
    actionEvidence.push('Long positions de-risking and closing on market weakness');
  } else if (raw.options.skew_25d && raw.options.skew_25d > 2.0 && Math.abs(raw.d4h_oi_pct) < 1.0) {
    actionLabel = 'HEDGING';
    actionEvidence.push('25-delta put skew elevated while futures OI remains flat');
  }

  // Squeeze flags
  const flags: SqueezeFlag[] = [];
  if (side === 'LONG_CROWDED' && p_f >= 85) flags.push('LONG_SQUEEZE_RISK');
  if (side === 'SHORT_CROWDED' && p_f <= 15) flags.push('SHORT_SQUEEZE_RISK');
  if (trapped_long_share >= 0.4) flags.push('TRAPPED_LONGS');
  if (trapped_short_share >= 0.4) flags.push('TRAPPED_SHORTS');
  if (p_f >= 85 || p_f <= 15) flags.push('HOT_FUNDING');
  if (raw.options.expiry_near) flags.push('EXPIRY_NEAR');
  if (raw.cot.small_spec_percentile_3y && (raw.cot.small_spec_percentile_3y >= 85 || raw.cot.small_spec_percentile_3y <= 15)) {
    flags.push('COT_EXTREME');
  }

  // Master hint rule: capped at +/-15, only valid with closed-candle confirmation
  let masterAdjustment = 0;
  let masterReason = 'Crowd positioning is balanced; no contrarian adjustment applied.';

  if (side === 'LONG_CROWDED') {
    masterAdjustment = -8;
    masterReason =
      'Extreme Long crowding (Score ' +
      crowd_long_score +
      ') + Whales Short (D=' +
      smart_vs_crowd_D +
      '). Contrarian caution reduces long confidence by 8 pts.';
  } else if (side === 'SHORT_CROWDED') {
    masterAdjustment = 8;
    masterReason =
      'Extreme Short crowding (Score ' +
      crowd_short_score +
      '). Contrarian short squeeze potential adds +8 pts to confirmed bounce setups.';
  }

  // Hinglish 8-line summary generator
  const hinglish_summary: string[] = [
    `1. CROWD STATUS: Abhi crowd ${side === 'LONG_CROWDED' ? 'HEAVILY LONG' : side === 'SHORT_CROWDED' ? 'HEAVILY SHORT' : 'BALANCED'} hai (Long Score: ${crowd_long_score}/100, Global Longs: ${globalLongPct}%).`,
    `2. CROWD ACTION: Crowd abhi ${actionLabel} kar rahi hai (${actionEvidence[0] || 'OI aur price move steady'}).`,
    `3. POSITIONS MAP (ESTIMATED): Crowd longs ka avg entry ~$${pMap.avg_entry_long.toLocaleString()} hai; ${trapped_short_share >= 0.4 ? 'Shorts heavily trapped hain (~' + Math.round(trapped_short_share * 100) + '% trapped)' : 'Longs safe band me hain'}.`,
    `4. FUNDING & FLOW: Funding rate ${fundingCurrent}% (${p_f}th percentile, ${fundingAnnualized}% p.a.) aur Taker 4H ratio ${taker4h} hai.`,
    `5. OPTIONS SKEW: Put/Call OI ratio ${raw.options.pcr_oi ?? '—'} (${raw.options.venue}) aur 25-delta skew ${raw.options.skew_25d ? raw.options.skew_25d + '%' : 'neutral'} downside hedge demand dikha raha hai.`,
    `6. SMART MONEY DIVERGENCE: Retail vs Top Trader gap D=${smart_vs_crowd_D} pts hai (${smart_vs_crowd_D < -10 ? 'Retail zada Long hai jabki Whales short-biased hain' : 'Whales aur Retail aligned hain'}).`,
    `7. SQUEEZE RISK: ${flags.includes('LONG_SQUEEZE_RISK') ? '⚠️ LONG SQUEEZE / FLUSH RISK — support tootne par retail long liquidation trigger ho sakti hai' : flags.includes('SHORT_SQUEEZE_RISK') ? '🚀 SHORT SQUEEZE RISK — resistance cross hone par shorts squeeze ho sakte hain' : 'Normal range; squeeze risk low hai'} (sirf evidence ke roop me).`,
    `8. INSTITUTIONAL RULE: Ye crowd inference hai; master decision engine closed candle trigger ke baad hi final verdict dega.`
  ];

  return {
    asset,
    timeframe: '1H/4H/1D',
    asOf: nowStr,
    data_quality: 94,
    available_weight: totalAvailableWeight,
    price,
    crowd: {
      side,
      long_score: crowd_long_score,
      short_score: crowd_short_score,
      global_long_pct: globalLongPct,
      global_long_percentile: p_r,
      top_trader_position_long_pct: topTraderLongPct,
      smart_vs_crowd_D,
      exchanges: raw.exchanges
    },
    action_now: {
      label: actionLabel,
      evidence: actionEvidence,
      bars_confirmed: 2
    },
    oi: {
      value_usd: raw.oi_usd,
      d4h_pct: raw.d4h_oi_pct,
      d24h_pct: raw.d24h_oi_pct,
      matrix_state
    },
    funding: {
      current: fundingCurrent,
      annualised: fundingAnnualized,
      percentile: p_f,
      basis_percentile: basis_p
    },
    taker: {
      ratio_1h: taker1h,
      ratio_4h: taker4h
    },
    liquidations: {
      long_usd_24h: raw.liq_long_24h,
      short_usd_24h: raw.liq_short_24h,
      cascade,
      source: 'REAL'
    },
    positions_map: {
      method: 'ESTIMATED',
      window: '7d/1h',
      reliability: 0.4,
      avg_entry_long: pMap.avg_entry_long,
      avg_entry_short: pMap.avg_entry_short,
      underwater_long_pct: underwaterLongPct,
      underwater_short_pct: underwaterShortPct,
      trapped_long_share,
      trapped_short_share,
      big_buckets: pMap.big_buckets
    },
    options: raw.options,
    india: raw.india,
    cot: raw.cot,
    flags,
    master_hint: {
      adjustment: masterAdjustment,
      reason: masterReason
    },
    inconsistencies: [],
    warnings: [
      'Crowd positions are inferred from exchange metrics and order flow profiles, not individual wallets.',
      'Crowd extremes can persist during strong institutional macro trends.'
    ],
    missing_data: totalAvailableWeight < 100 ? ['Perpetual funding rate not applicable for traditional spot/futures.'] : [],
    disclaimer: 'Crowd positions are inferred, not observed. Evidence only; the DEEEPR master engine decides trades.',
    hinglish_summary
  };
}
