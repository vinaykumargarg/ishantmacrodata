import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  ChevronDown,
  Layers,
  Crosshair,
  Pencil,
  Eye,
  Hand,
  Clock,
  Flame,
  Zap,
  Target,
  SlidersHorizontal,
  Compass,
  Info,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  HelpCircle,
  Sliders
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   AUTHENTIC 1:1 BOOKMAP LIQUIDATION & ORDER FLOW HEATMAP TERMINAL (PRO V3)
   100% Exact match with user's reference screenshots:
   Photo 1: GEVO@DXFEED with exact COB ladder (1.54 to 1.08), 1585 tag at 1.28,
            377085 red peak at 1.50, green peaks at 1.26, 1.24, 1.10,
            watermark TRADING REVIEWERS, volume scale 700000, 09:50-10:15 time axis.
   Photo 2: AAPL@DXFEED with Colormap Sensitivity capsule slider (yellow circled),
            inspection tooltip at 230.87 with cyan drop line to bottom time axis.
   Photo 3: ES_MINI@CME with [Sim1] Trade: 1 @ 4254.75 | OPL: 0.00P,
            dual Buy/Sell DOM ladder with 4273.25 in white box, 2 LL green badge.
   ═══════════════════════════════════════════════════════════════════════════ */

export type BookmapContract =
  | 'GEVO@DXFEED'
  | 'AAPL@DXFEED'
  | 'ES_MINI@CME'
  | 'BTC_USDT@BINANCE'
  | 'PAXG_USDT@GOLD'
  | 'ETH_USDT@BINANCE'
  | 'SOL_USDT@BINANCE'
  | 'XRP_USDT@BINANCE'
  | 'DOGE_USDT@BINANCE'
  | 'NQ_MINI@CME';

export type BookmapTimeframe = '1s' | '5s' | '15s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export type LiquidationColorCategory = 'RED' | 'ORANGE' | 'YELLOW' | 'WHITE' | 'CYAN' | 'BLUE';

export interface LiquidityWallSpec {
  id: string;
  priceOffsetPct: number;
  category: LiquidationColorCategory;
  volumeM: number;
  label: string;
  side: 'SHORT' | 'LONG';
  leverageBracket: '100x' | '50x' | '25x' | '10x';
  thickness: number;
  startRatio: number;
  institutionalNote: string;
}

interface ContractConfig {
  code: BookmapContract;
  displayName: string;
  ticker: string;
  exchange: string;
  tickSize: number;
  decimals: number;
  defaultPrice: number;
  baseUnit: string;
  wsPair: string;
  restSymbol: string;
  isCryptoWs: boolean;
  typicalSpanPct: number;
  liquidityWalls: LiquidityWallSpec[];
}

const CONTRACT_CONFIGS: Record<BookmapContract, ContractConfig> = {
  // ── PHOTO 1 REFERENCE: GEVO@DXFEED ──
  'GEVO@DXFEED': {
    code: 'GEVO@DXFEED',
    displayName: 'GEVO Inc · DxFeed / Devexperts L2 (Photo 1 Reference)',
    ticker: 'GEVO',
    exchange: 'DXFEED/NASDAQ',
    tickSize: 0.02,
    decimals: 2,
    defaultPrice: 1.28,
    baseUnit: 'shares',
    wsPair: '',
    restSymbol: '',
    isCryptoWs: false,
    typicalSpanPct: 0.38, // 1.08 to 1.54 matching Photo 1 exactly
    liquidityWalls: [
      {
        id: 'gevo-red-1',
        priceOffsetPct: 0.1718, // 1.50
        category: 'RED',
        volumeM: 377.0,
        label: 'Major Short Liquidation Pool 1.50 (377K Shares)',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Extreme resting ask wall and short squeeze liquidation shelf at 1.50 matching Photo 1.'
      },
      {
        id: 'gevo-yellow-1',
        priceOffsetPct: 0.1562, // 1.48
        category: 'YELLOW',
        volumeM: 221.6,
        label: 'Resting Ask Wall 1.48 (221K Shares)',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 9,
        startRatio: 0.0,
        institutionalNote: 'Heavy limit ask wall defending 1.48.'
      },
      {
        id: 'gevo-orange-1',
        priceOffsetPct: 0.1406, // 1.46
        category: 'ORANGE',
        volumeM: 78.5,
        label: 'Stop-Hunt Shelf 1.46 (78K Shares)',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 8,
        startRatio: 0.0,
        institutionalNote: 'Breakout stop hunt shelf.'
      },
      {
        id: 'gevo-cyan-1',
        priceOffsetPct: 0.125, // 1.44
        category: 'CYAN',
        volumeM: 288.1,
        label: 'Cyan Order Depth 1.44 (288K Shares)',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.0,
        institutionalNote: 'Resting ask depth.'
      },
      {
        id: 'gevo-white-1',
        priceOffsetPct: 0.0937, // 1.40
        category: 'WHITE',
        volumeM: 187.2,
        label: 'White Absorption Band 1.40 (187K Shares)',
        side: 'SHORT',
        leverageBracket: '10x',
        thickness: 6,
        startRatio: 0.0,
        institutionalNote: 'White incandescent absorption band at psychological 1.40.'
      },
      {
        id: 'gevo-yellow-mid',
        priceOffsetPct: -0.0156, // 1.26 / 1.24
        category: 'YELLOW',
        volumeM: 211.5,
        label: 'Major Resting Bid Floor 1.24–1.26 (211K Shares)',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 10,
        startRatio: 0.0,
        institutionalNote: 'Dense yellow resting bid shelf holding the floor below 1.28.'
      },
      {
        id: 'gevo-yellow-bot',
        priceOffsetPct: -0.1406, // 1.10
        category: 'YELLOW',
        volumeM: 267.6,
        label: 'Lower Limit Floor 1.10 (267K Shares)',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 9,
        startRatio: 0.0,
        institutionalNote: 'Bottom resting bid wall at 1.10.'
      }
    ]
  },

  // ── PHOTO 2 REFERENCE: AAPL@DXFEED ──
  'AAPL@DXFEED': {
    code: 'AAPL@DXFEED',
    displayName: 'Apple Inc. · AAPL@DXFEED L2 (Photo 2 Reference)',
    ticker: 'AAPL',
    exchange: 'DXFEED/NASDAQ',
    tickSize: 0.01,
    decimals: 2,
    defaultPrice: 230.87,
    baseUnit: 'shares',
    wsPair: '',
    restSymbol: '',
    isCryptoWs: false,
    typicalSpanPct: 0.05, // 224 to 238 visible around 230.87
    liquidityWalls: [
      {
        id: 'aapl-yellow-1',
        priceOffsetPct: 0.0244, // 236.50
        category: 'YELLOW',
        volumeM: 240.0,
        label: 'Resting Ask Wall (236.50)',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 9,
        startRatio: 0.0,
        institutionalNote: 'Persistent institutional limit ask wall visible across top of Bookmap.'
      },
      {
        id: 'aapl-cyan-1',
        priceOffsetPct: 0.0150, // 234.30
        category: 'CYAN',
        volumeM: 160.0,
        label: 'Cyan Order Depth (234.30)',
        side: 'SHORT',
        leverageBracket: '10x',
        thickness: 7,
        startRatio: 0.1,
        institutionalNote: 'Algorithmic liquidity layer.'
      },
      {
        id: 'aapl-white-1',
        priceOffsetPct: 0.0080, // 232.70
        category: 'WHITE',
        volumeM: 120.0,
        label: 'White Absorption Band (232.70)',
        side: 'SHORT',
        leverageBracket: '10x',
        thickness: 6,
        startRatio: 0.25,
        institutionalNote: 'Absorption band defending local high.'
      },
      {
        id: 'aapl-yellow-2',
        priceOffsetPct: -0.0100, // 228.50
        category: 'YELLOW',
        volumeM: 280.0,
        label: 'Resting Bid Wall (228.50)',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 8,
        startRatio: 0.15,
        institutionalNote: 'Major resting bid shelf.'
      },
      {
        id: 'aapl-orange-1',
        priceOffsetPct: -0.0245, // 225.20
        category: 'ORANGE',
        volumeM: 350.0,
        label: 'Stop-Hunt Pool (225.20)',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.0,
        institutionalNote: '50x leveraged retail stop hunt pocket.'
      },
      {
        id: 'aapl-red-1',
        priceOffsetPct: -0.0350, // 222.80
        category: 'RED',
        volumeM: 520.0,
        label: 'Extreme Long Liquidation Floor (222.80)',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Whale accumulation shelf below long cascade.'
      }
    ]
  },

  // ── PHOTO 3 REFERENCE: ES_MINI@CME ──
  'ES_MINI@CME': {
    code: 'ES_MINI@CME',
    displayName: 'E-mini S&P 500 Futures L2 (Photo 3 Reference)',
    ticker: 'ES',
    exchange: 'CME GLOBEX',
    tickSize: 0.25,
    decimals: 2,
    defaultPrice: 4273.25,
    baseUnit: 'contracts',
    wsPair: '',
    restSymbol: '',
    isCryptoWs: false,
    typicalSpanPct: 0.006, // ~25 points visible (4254 to 4280)
    liquidityWalls: [
      {
        id: 'es-yellow-top',
        priceOffsetPct: 0.0012, // 4276.00
        category: 'YELLOW',
        volumeM: 280.0,
        label: 'Resting Ask Wall 4276.00',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 9,
        startRatio: 0.0,
        institutionalNote: 'Overhead limit ask resistance at 4276.00.'
      },
      {
        id: 'es-yellow-mid',
        priceOffsetPct: -0.0007, // 4270.00
        category: 'YELLOW',
        volumeM: 310.0,
        label: 'Resting Limit Wall 4270.00',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 9,
        startRatio: 0.0,
        institutionalNote: 'Strong yellow resting order wall at 4270.00.'
      },
      {
        id: 'es-yellow-low',
        priceOffsetPct: -0.0031, // 4260.00
        category: 'YELLOW',
        volumeM: 240.0,
        label: 'Resting Limit Wall 4260.00',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 8,
        startRatio: 0.0,
        institutionalNote: 'Round number psychological support.'
      },
      {
        id: 'es-orange-1',
        priceOffsetPct: -0.0038, // 4257.00
        category: 'ORANGE',
        volumeM: 390.0,
        label: 'Stop-Hunt Shelf 4257.00',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 11,
        startRatio: 0.0,
        institutionalNote: 'Major stop cluster below swing low.'
      },
      {
        id: 'es-red-1',
        priceOffsetPct: -0.0045, // 4254.00
        category: 'RED',
        volumeM: 540.0,
        label: 'Extreme Long Liquidation Floor 4254.00',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 15,
        startRatio: 0.0,
        institutionalNote: 'Whale liquidity pool where retail longs get flushed out.'
      }
    ]
  },

  // ── CRYPTO L2 FEEDS ──
  'BTC_USDT@BINANCE': {
    code: 'BTC_USDT@BINANCE',
    displayName: 'Bitcoin USDT Perpetual & Spot L2',
    ticker: 'BTCUSDT',
    exchange: 'BINANCE L2',
    tickSize: 1.0,
    decimals: 1,
    defaultPrice: 83650.0,
    baseUnit: 'BTC',
    wsPair: 'btcusdt',
    restSymbol: 'BTCUSDT',
    isCryptoWs: true,
    typicalSpanPct: 0.038,
    liquidityWalls: [
      {
        id: 'btc-red-1',
        priceOffsetPct: 0.0185,
        category: 'RED',
        volumeM: 540.0,
        label: 'Mega Short Squeeze Liquidation Shelf',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Critical Short Liquidation Magnet: Cascade pool.'
      },
      {
        id: 'btc-orange-1',
        priceOffsetPct: 0.0092,
        category: 'ORANGE',
        volumeM: 360.5,
        label: 'High Overhead Stop-Hunt & Squeeze Zone',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.15,
        institutionalNote: '50x short stops.'
      },
      {
        id: 'btc-yellow-1',
        priceOffsetPct: 0.0035,
        category: 'YELLOW',
        volumeM: 220.0,
        label: 'Heavy Resting Ask Wall & Limit Resistance',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 8,
        startRatio: 0.25,
        institutionalNote: 'Dense resting sell orders.'
      },
      {
        id: 'btc-white-1',
        priceOffsetPct: 0.0012,
        category: 'WHITE',
        volumeM: 145.0,
        label: 'Immediate Overhead Absorption Band',
        side: 'SHORT',
        leverageBracket: '10x',
        thickness: 6,
        startRatio: 0.35,
        institutionalNote: 'Absorption band.'
      },
      {
        id: 'btc-yellow-2',
        priceOffsetPct: -0.0075,
        category: 'YELLOW',
        volumeM: 260.0,
        label: 'Resting Limit Bid Floor Wall',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 8,
        startRatio: 0.1,
        institutionalNote: 'Institutional bid wall.'
      },
      {
        id: 'btc-orange-2',
        priceOffsetPct: -0.0145,
        category: 'ORANGE',
        volumeM: 410.0,
        label: 'Major Long Liquidation Cascade Shelf',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 11,
        startRatio: 0.0,
        institutionalNote: '50x long liquidations.'
      },
      {
        id: 'btc-red-2',
        priceOffsetPct: -0.0235,
        category: 'RED',
        volumeM: 625.5,
        label: 'Extreme Long Liquidation Trap & Whale Demand',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 15,
        startRatio: 0.0,
        institutionalNote: 'Whale liquidity pocket.'
      }
    ]
  },

  'PAXG_USDT@GOLD': {
    code: 'PAXG_USDT@GOLD',
    displayName: 'Gold Spot OTC & COMEX Futures L2',
    ticker: 'PAXGUSDT',
    exchange: 'COMEX/OTC',
    tickSize: 0.1,
    decimals: 1,
    defaultPrice: 4188.5,
    baseUnit: 'oz',
    wsPair: 'paxgusdt',
    restSymbol: 'PAXGUSDT',
    isCryptoWs: true,
    typicalSpanPct: 0.015,
    liquidityWalls: [
      {
        id: 'gold-red-1',
        priceOffsetPct: 0.0075,
        category: 'RED',
        volumeM: 380.0,
        label: 'Mega Overhead Gold Short Liquidation Ceiling',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Massive Gold Short Liquidation Zone.'
      },
      {
        id: 'gold-orange-1',
        priceOffsetPct: 0.0042,
        category: 'ORANGE',
        volumeM: 275.0,
        label: 'High Squeeze Shelf & Absorption Band',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.18,
        institutionalNote: 'London fix stop-hunt cluster.'
      },
      {
        id: 'gold-yellow-1',
        priceOffsetPct: 0.0018,
        category: 'YELLOW',
        volumeM: 190.0,
        label: 'Resting Ask Wall (Institutional Resistance)',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.25,
        institutionalNote: 'Bullion desk limit offers.'
      },
      {
        id: 'gold-yellow-2',
        priceOffsetPct: -0.0022,
        category: 'YELLOW',
        volumeM: 215.0,
        label: 'Resting Bid Wall (Bullion Demand Floor)',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 8,
        startRatio: 0.12,
        institutionalNote: 'Strong institutional bidding.'
      },
      {
        id: 'gold-orange-2',
        priceOffsetPct: -0.0055,
        category: 'ORANGE',
        volumeM: 320.0,
        label: 'Major Long Stop-Hunt Cascade Pool',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 11,
        startRatio: 0.05,
        institutionalNote: 'Retail long liquidation cluster.'
      },
      {
        id: 'gold-red-2',
        priceOffsetPct: -0.0095,
        category: 'RED',
        volumeM: 460.0,
        label: 'Extreme Long Liquidation Trap (Whale Bids)',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Central bank resting bid shelf.'
      }
    ]
  },

  'ETH_USDT@BINANCE': {
    code: 'ETH_USDT@BINANCE',
    displayName: 'Ethereum USDT Perpetual & Spot L2',
    ticker: 'ETHUSDT',
    exchange: 'BINANCE L2',
    tickSize: 0.05,
    decimals: 2,
    defaultPrice: 2534.2,
    baseUnit: 'ETH',
    wsPair: 'ethusdt',
    restSymbol: 'ETHUSDT',
    isCryptoWs: true,
    typicalSpanPct: 0.045,
    liquidityWalls: [
      {
        id: 'eth-red-1',
        priceOffsetPct: 0.024,
        category: 'RED',
        volumeM: 310.0,
        label: 'Extreme ETH Short Liquidation Ceiling',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 13,
        startRatio: 0.0,
        institutionalNote: 'Mega liquidation shelf.'
      },
      {
        id: 'eth-orange-1',
        priceOffsetPct: 0.012,
        category: 'ORANGE',
        volumeM: 230.0,
        label: 'High Squeeze Pool & Stop Run',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 9,
        startRatio: 0.2,
        institutionalNote: '50x short liquidations.'
      },
      {
        id: 'eth-yellow-1',
        priceOffsetPct: 0.004,
        category: 'YELLOW',
        volumeM: 160.0,
        label: 'Resting Ask Wall',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.3,
        institutionalNote: 'Limit sellers.'
      },
      {
        id: 'eth-yellow-2',
        priceOffsetPct: -0.006,
        category: 'YELLOW',
        volumeM: 175.0,
        label: 'Resting Bid Wall',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.2,
        institutionalNote: 'Support floor.'
      },
      {
        id: 'eth-orange-2',
        priceOffsetPct: -0.016,
        category: 'ORANGE',
        volumeM: 280.0,
        label: 'Long Cascade Liquidation Shelf',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.0,
        institutionalNote: 'Long liquidations.'
      },
      {
        id: 'eth-red-2',
        priceOffsetPct: -0.028,
        category: 'RED',
        volumeM: 395.0,
        label: 'Extreme Long Waterfall Liquidation Floor',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Whale accumulation.'
      }
    ]
  },

  'SOL_USDT@BINANCE': {
    code: 'SOL_USDT@BINANCE',
    displayName: 'Solana USDT Perpetual L2',
    ticker: 'SOLUSDT',
    exchange: 'BINANCE L2',
    tickSize: 0.01,
    decimals: 2,
    defaultPrice: 110.6,
    baseUnit: 'SOL',
    wsPair: 'solusdt',
    restSymbol: 'SOLUSDT',
    isCryptoWs: true,
    typicalSpanPct: 0.055,
    liquidityWalls: [
      {
        id: 'sol-red-1',
        priceOffsetPct: 0.035,
        category: 'RED',
        volumeM: 195.0,
        label: 'Extreme Short Squeeze Shelf',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 13,
        startRatio: 0.0,
        institutionalNote: 'Short squeeze ceiling.'
      },
      {
        id: 'sol-orange-1',
        priceOffsetPct: 0.018,
        category: 'ORANGE',
        volumeM: 140.0,
        label: 'High Overhead Stop-Hunt Pool',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 9,
        startRatio: 0.15,
        institutionalNote: '50x short stops.'
      },
      {
        id: 'sol-yellow-1',
        priceOffsetPct: -0.008,
        category: 'YELLOW',
        volumeM: 110.0,
        label: 'Resting Bids',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.2,
        institutionalNote: 'Support level.'
      },
      {
        id: 'sol-red-2',
        priceOffsetPct: -0.032,
        category: 'RED',
        volumeM: 220.0,
        label: 'Long Liquidation Cascade Floor',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 13,
        startRatio: 0.0,
        institutionalNote: 'Whale demand zone.'
      }
    ]
  },

  'XRP_USDT@BINANCE': {
    code: 'XRP_USDT@BINANCE',
    displayName: 'XRP USDT Perpetual & Spot L2',
    ticker: 'XRPUSDT',
    exchange: 'BINANCE L2',
    tickSize: 0.0001,
    decimals: 4,
    defaultPrice: 1.3920,
    baseUnit: 'XRP',
    wsPair: 'xrpusdt',
    restSymbol: 'XRPUSDT',
    isCryptoWs: true,
    typicalSpanPct: 0.05,
    liquidityWalls: [
      {
        id: 'xrp-red-1',
        priceOffsetPct: 0.038,
        category: 'RED',
        volumeM: 185.0,
        label: 'Mega XRP Short Squeeze Shelf',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 13,
        startRatio: 0.0,
        institutionalNote: 'Short stop run.'
      },
      {
        id: 'xrp-orange-1',
        priceOffsetPct: 0.019,
        category: 'ORANGE',
        volumeM: 120.0,
        label: 'High Overhead Resistance Squeeze',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 9,
        startRatio: 0.2,
        institutionalNote: '50x short liquidations.'
      },
      {
        id: 'xrp-yellow-1',
        priceOffsetPct: -0.008,
        category: 'YELLOW',
        volumeM: 95.0,
        label: 'Resting Bids Floor',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.15,
        institutionalNote: 'Institutional bid wall.'
      },
      {
        id: 'xrp-red-2',
        priceOffsetPct: -0.035,
        category: 'RED',
        volumeM: 210.0,
        label: 'Extreme Long Waterfall Floor',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Whale floor.'
      }
    ]
  },

  'DOGE_USDT@BINANCE': {
    code: 'DOGE_USDT@BINANCE',
    displayName: 'Dogecoin USDT Perpetual L2',
    ticker: 'DOGEUSDT',
    exchange: 'BINANCE L2',
    tickSize: 0.00001,
    decimals: 5,
    defaultPrice: 0.38720,
    baseUnit: 'DOGE',
    wsPair: 'dogeusdt',
    restSymbol: 'DOGEUSDT',
    isCryptoWs: true,
    typicalSpanPct: 0.065,
    liquidityWalls: [
      {
        id: 'doge-red-1',
        priceOffsetPct: 0.045,
        category: 'RED',
        volumeM: 165.0,
        label: 'Extreme Meme Liquidation Ceiling',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 13,
        startRatio: 0.0,
        institutionalNote: 'Retail cascade.'
      },
      {
        id: 'doge-orange-1',
        priceOffsetPct: 0.022,
        category: 'ORANGE',
        volumeM: 110.0,
        label: 'High Stop-Hunt Pool',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 9,
        startRatio: 0.2,
        institutionalNote: 'Short stops.'
      },
      {
        id: 'doge-yellow-1',
        priceOffsetPct: -0.012,
        category: 'YELLOW',
        volumeM: 85.0,
        label: 'Resting Support Shelf',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 7,
        startRatio: 0.15,
        institutionalNote: 'Meme trader demand wall.'
      },
      {
        id: 'doge-red-2',
        priceOffsetPct: -0.042,
        category: 'RED',
        volumeM: 190.0,
        label: 'Extreme Long Washout Floor',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Whale liquidity pocket.'
      }
    ]
  },

  'NQ_MINI@CME': {
    code: 'NQ_MINI@CME',
    displayName: 'NASDAQ-100 E-mini Futures L2',
    ticker: 'NQ',
    exchange: 'CME GLOBEX',
    tickSize: 0.25,
    decimals: 2,
    defaultPrice: 20820.5,
    baseUnit: 'contracts',
    wsPair: '',
    restSymbol: '',
    isCryptoWs: false,
    typicalSpanPct: 0.018,
    liquidityWalls: [
      {
        id: 'nq-red-1',
        priceOffsetPct: 0.009,
        category: 'RED',
        volumeM: 480.0,
        label: 'Mega Call Gamma / Short Squeeze Wall',
        side: 'SHORT',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Options dealer gamma squeeze zone.'
      },
      {
        id: 'nq-orange-1',
        priceOffsetPct: 0.0045,
        category: 'ORANGE',
        volumeM: 320.0,
        label: 'Overhead Call Wall',
        side: 'SHORT',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.2,
        institutionalNote: 'Dealer gamma hedge resistance.'
      },
      {
        id: 'nq-orange-2',
        priceOffsetPct: -0.005,
        category: 'ORANGE',
        volumeM: 340.0,
        label: 'Put Wall & Support',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.1,
        institutionalNote: 'Dealer put gamma floor.'
      },
      {
        id: 'nq-red-2',
        priceOffsetPct: -0.011,
        category: 'RED',
        volumeM: 520.0,
        label: 'Extreme Long Liquidation Cascade Shelf',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Institutional liquidity pocket.'
      }
    ]
  }
};

const TIMEFRAMES: BookmapTimeframe[] = ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h', '1D'];

interface StaticBubble {
  progressX: number;
  priceOffsetRatio: number;
  radius: number;
  buyRatio: number;
  isLiq?: boolean;
}

interface PriceWaypoint {
  progressX: number;
  priceOffsetRatio: number;
}

interface VolumeBarPoint {
  progressX: number;
  buyVol: number;
  sellVol: number;
  totalVol: number;
}

export const BookmapLiquidationTerminalView: React.FC = () => {
  // 🌟 DEFAULT CONTRACT: GEVO@DXFEED (Matching Photo 1 100%)
  const [activeContract, setActiveContract] = useState<BookmapContract>('GEVO@DXFEED');
  const [activeTimeframe, setActiveTimeframe] = useState<BookmapTimeframe>('5m');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'CROSSHAIR' | 'TRENDLINE' | 'HORIZ_LINE' | 'RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'PROFILE' | 'PAN'>('PAN');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(14);

  // Colormap sensitivity slider (Matching Photo 2 user circled capsule widget)
  const [heatmapSensitivity, setHeatmapSensitivity] = useState<number>(65);

  // DOM Ladder Display Mode: 'COB' (Photo 1) | 'BUY_SELL' (Photo 3)
  const [domMode, setDomMode] = useState<'COB' | 'BUY_SELL'>('COB');

  // Signature Bookmap Inspection Tooltip (Photo 2 exact match)
  const [showSignatureTooltip, setShowSignatureTooltip] = useState<boolean>(true);

  // Zoom & Pan state (Supports full hand dragging up/down/left/right)
  const [priceZoom, setPriceZoom] = useState<number>(1.0);
  const [panOffsetY, setPanOffsetY] = useState<number>(0);
  const [panOffsetX, setPanOffsetX] = useState<number>(0);

  // Dragging interaction refs
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const config = CONTRACT_CONFIGS[activeContract];

  // Automatically sync DOM mode with contract
  useEffect(() => {
    if (activeContract === 'ES_MINI@CME') {
      setDomMode('BUY_SELL');
    } else {
      setDomMode('COB');
    }
  }, [activeContract]);

  // Live Price State
  const [livePrice, setLivePrice] = useState<number>(config.defaultPrice);
  const [bestBid, setBestBid] = useState<number>(config.defaultPrice - config.tickSize);
  const [bestAsk, setBestAsk] = useState<number>(config.defaultPrice + config.tickSize);

  // Selected or Hovered Liquidation Shelf
  const [focusedWallId, setFocusedWallId] = useState<string | null>(null);

  // Hover Tooltip / Inspector State
  const [hoverInfo, setHoverInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    timeStr: string;
    nearestWall?: {
      id: string;
      label: string;
      volumeM: number;
      category: LiquidationColorCategory;
      side: 'SHORT' | 'LONG';
      leverageBracket: string;
      distPct: number;
      price: number;
      institutionalNote: string;
    };
    depthSize: number;
    volStr: string;
  } | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playPing = useCallback((freq = 880) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio allowed
    }
  }, [soundEnabled]);

  // ── PRE-CALCULATED NATURAL REALISTIC WAVES TAILORED PER REFERENCE PHOTO ──
  const { trajectoryPattern, bubblePattern, volumeBars } = useMemo(() => {
    const waypoints: PriceWaypoint[] = [];
    const numPoints = 180;

    if (activeContract === 'GEVO@DXFEED') {
      // 🌟 PHOTO 1 EXACT PATTERN:
      // Price starts around 1.37, swings up to peak 1.41 with large green bubble,
      // steps down staircase to 1.28 with series of red bubbles, consolidates,
      // and runs flat at 1.28 with the 1585 (1585) red badge!
      for (let i = 0; i < numPoints; i++) {
        const u = i / (numPoints - 1);
        let ratio = 0;
        if (u < 0.22) {
          ratio = 0.22 + Math.sin((u / 0.22) * Math.PI * 0.5) * 0.20 + Math.sin(u * 50) * 0.008;
        } else if (u < 0.42) {
          const p = (u - 0.22) / 0.20;
          ratio = 0.42 - (p * 0.42) + Math.sin(u * 60) * 0.008;
        } else if (u < 0.72) {
          ratio = Math.sin((u - 0.42) * Math.PI * 3.2) * 0.05 + Math.sin(u * 40) * 0.008;
        } else {
          ratio = 0.0;
        }
        waypoints.push({ progressX: u, priceOffsetRatio: ratio });
      }

      const bList: StaticBubble[] = [
        { progressX: 0.02, priceOffsetRatio: 0.22, radius: 10, buyRatio: 0.8 },
        { progressX: 0.05, priceOffsetRatio: 0.26, radius: 8, buyRatio: 0.6 },
        { progressX: 0.09, priceOffsetRatio: 0.30, radius: 11, buyRatio: 0.3 },
        { progressX: 0.13, priceOffsetRatio: 0.35, radius: 9, buyRatio: 0.8 },
        { progressX: 0.17, priceOffsetRatio: 0.39, radius: 12, buyRatio: 0.85 },
        { progressX: 0.22, priceOffsetRatio: 0.42, radius: 18, buyRatio: 0.95, isLiq: true }, // Big green bubble at 1.41 peak
        { progressX: 0.26, priceOffsetRatio: 0.34, radius: 13, buyRatio: 0.15 },
        { progressX: 0.29, priceOffsetRatio: 0.26, radius: 11, buyRatio: 0.1 },
        { progressX: 0.33, priceOffsetRatio: 0.17, radius: 15, buyRatio: 0.2, isLiq: true },
        { progressX: 0.37, priceOffsetRatio: 0.08, radius: 12, buyRatio: 0.3 },
        { progressX: 0.42, priceOffsetRatio: 0.00, radius: 14, buyRatio: 0.8 },
        { progressX: 0.48, priceOffsetRatio: 0.03, radius: 16, buyRatio: 0.85 },
        { progressX: 0.54, priceOffsetRatio: -0.02, radius: 13, buyRatio: 0.2 },
        { progressX: 0.61, priceOffsetRatio: 0.03, radius: 14, buyRatio: 0.85 },
        { progressX: 0.68, priceOffsetRatio: 0.00, radius: 10, buyRatio: 0.3 },
        { progressX: 0.74, priceOffsetRatio: 0.00, radius: 15, buyRatio: 0.8, isLiq: true }
      ];

      const vBars: VolumeBarPoint[] = [];
      const barCounts = [
        18, 22, 25, 30, 26, 32, 28, 35, 48, 85, 92, 110, 65, 45, 38, 42, 58, 62, 50, 40, 32, 25, 20, 18, 15
      ];
      for (let k = 0; k < barCounts.length; k++) {
        const u = k / (barCounts.length - 1);
        const totalVol = barCounts[k];
        const buyFraction = 0.5 + (Math.sin(k * 0.8) * 0.3);
        const buyVol = Math.round(totalVol * buyFraction);
        const sellVol = totalVol - buyVol;
        vBars.push({ progressX: u, buyVol, sellVol, totalVol });
      }

      return { trajectoryPattern: waypoints, bubblePattern: bList, volumeBars: vBars };
    }

    if (activeContract === 'AAPL@DXFEED') {
      // 🌟 PHOTO 2 EXACT PATTERN:
      // Broad oscillation with signature tooltip at x=0.18
      for (let i = 0; i < numPoints; i++) {
        const u = i / (numPoints - 1);
        const w1 = Math.sin(u * Math.PI * 3.2) * 0.32;
        const w2 = Math.cos(u * Math.PI * 7.5) * 0.08;
        const jitter = Math.sin(u * 90) * 0.015;
        waypoints.push({ progressX: u, priceOffsetRatio: w1 + w2 + jitter });
      }

      const bList: StaticBubble[] = [
        { progressX: 0.05, priceOffsetRatio: 0.12, radius: 12, buyRatio: 0.5 },
        { progressX: 0.11, priceOffsetRatio: 0.18, radius: 14, buyRatio: 0.8 },
        { progressX: 0.18, priceOffsetRatio: 0.06, radius: 16, buyRatio: 0.85, isLiq: true }, // Targeted bubble with tooltip!
        { progressX: 0.25, priceOffsetRatio: -0.15, radius: 13, buyRatio: 0.3 },
        { progressX: 0.32, priceOffsetRatio: -0.28, radius: 18, buyRatio: 0.2, isLiq: true },
        { progressX: 0.40, priceOffsetRatio: -0.10, radius: 15, buyRatio: 0.7 },
        { progressX: 0.50, priceOffsetRatio: 0.18, radius: 20, buyRatio: 0.85, isLiq: true },
        { progressX: 0.60, priceOffsetRatio: 0.32, radius: 17, buyRatio: 0.9 },
        { progressX: 0.72, priceOffsetRatio: 0.10, radius: 14, buyRatio: 0.4 },
        { progressX: 0.84, priceOffsetRatio: -0.20, radius: 19, buyRatio: 0.2, isLiq: true },
        { progressX: 0.94, priceOffsetRatio: -0.05, radius: 12, buyRatio: 0.6 }
      ];

      const vBars: VolumeBarPoint[] = [];
      const barCounts = [15, 24, 38, 52, 70, 95, 80, 60, 45, 30, 25, 40, 65, 85, 105, 90, 55, 35, 20, 15];
      for (let k = 0; k < barCounts.length; k++) {
        const u = k / (barCounts.length - 1);
        const totalVol = barCounts[k];
        const buyFraction = 0.52 + (Math.sin(k * 0.6) * 0.25);
        const buyVol = Math.round(totalVol * buyFraction);
        const sellVol = totalVol - buyVol;
        vBars.push({ progressX: u, buyVol, sellVol, totalVol });
      }

      return { trajectoryPattern: waypoints, bubblePattern: bList, volumeBars: vBars };
    }

    if (activeContract === 'ES_MINI@CME') {
      // 🌟 PHOTO 3 EXACT PATTERN:
      // Price descends from ~4268 to ~4254 with big red bubble at bottom (x=0.40),
      // then strongly rallies up to 4274 with multiple green bubbles along the way!
      for (let i = 0; i < numPoints; i++) {
        const u = i / (numPoints - 1);
        let ratio = 0;
        if (u < 0.40) {
          const p = u / 0.40;
          ratio = 0.10 - (p * 0.48) + Math.sin(u * 50) * 0.012;
        } else {
          const p = (u - 0.40) / 0.60;
          ratio = -0.38 + (p * 0.65) + Math.sin(u * 45) * 0.015;
        }
        waypoints.push({ progressX: u, priceOffsetRatio: ratio });
      }

      const bList: StaticBubble[] = [
        { progressX: 0.08, priceOffsetRatio: 0.02, radius: 12, buyRatio: 0.3 },
        { progressX: 0.16, priceOffsetRatio: -0.12, radius: 14, buyRatio: 0.25 },
        { progressX: 0.24, priceOffsetRatio: -0.22, radius: 13, buyRatio: 0.7 },
        { progressX: 0.32, priceOffsetRatio: -0.28, radius: 15, buyRatio: 0.2 },
        { progressX: 0.39, priceOffsetRatio: -0.38, radius: 26, buyRatio: 0.1, isLiq: true }, // Big red liquidation bubble at trough
        { progressX: 0.47, priceOffsetRatio: -0.22, radius: 13, buyRatio: 0.8 },
        { progressX: 0.58, priceOffsetRatio: -0.05, radius: 16, buyRatio: 0.85 },
        { progressX: 0.66, priceOffsetRatio: 0.08, radius: 14, buyRatio: 0.3 },
        { progressX: 0.74, priceOffsetRatio: 0.15, radius: 15, buyRatio: 0.8 },
        { progressX: 0.82, priceOffsetRatio: 0.22, radius: 17, buyRatio: 0.9, isLiq: true },
        { progressX: 0.88, priceOffsetRatio: 0.25, radius: 16, buyRatio: 0.85 },
        { progressX: 0.94, priceOffsetRatio: 0.27, radius: 18, buyRatio: 0.9, isLiq: true } // Green bubble cluster near 4274
      ];

      const vBars: VolumeBarPoint[] = [];
      const barCounts = [20, 28, 42, 60, 95, 120, 85, 50, 45, 60, 75, 90, 110, 105, 95, 80, 60, 40, 25];
      for (let k = 0; k < barCounts.length; k++) {
        const u = k / (barCounts.length - 1);
        const totalVol = barCounts[k];
        const buyFraction = u < 0.40 ? 0.35 : 0.72;
        const buyVol = Math.round(totalVol * buyFraction);
        const sellVol = totalVol - buyVol;
        vBars.push({ progressX: u, buyVol, sellVol, totalVol });
      }

      return { trajectoryPattern: waypoints, bubblePattern: bList, volumeBars: vBars };
    }

    // Default Crypto Trajectory
    for (let i = 0; i < numPoints; i++) {
      const u = i / (numPoints - 1);
      const trend = Math.sin(u * Math.PI * 0.95) * 0.26 - (u * 0.15);
      const wave1 = Math.sin(u * Math.PI * 4.5) * 0.07;
      const wave2 = Math.cos(u * Math.PI * 9.2) * 0.028;
      const microJitter = Math.sin(u * 85.0) * 0.006;
      const offsetRatio = -0.12 + trend + wave1 + wave2 + microJitter;
      waypoints.push({ progressX: u, priceOffsetRatio: offsetRatio });
    }

    const bList: StaticBubble[] = [
      { progressX: 0.04, priceOffsetRatio: waypoints[7].priceOffsetRatio, radius: 10, buyRatio: 0.5 },
      { progressX: 0.08, priceOffsetRatio: waypoints[14].priceOffsetRatio, radius: 13, buyRatio: 0.8 },
      { progressX: 0.13, priceOffsetRatio: waypoints[23].priceOffsetRatio, radius: 18, buyRatio: 0.5, isLiq: true },
      { progressX: 0.18, priceOffsetRatio: waypoints[32].priceOffsetRatio, radius: 9, buyRatio: 0.2 },
      { progressX: 0.23, priceOffsetRatio: waypoints[41].priceOffsetRatio, radius: 14, buyRatio: 0.5 },
      { progressX: 0.28, priceOffsetRatio: waypoints[50].priceOffsetRatio, radius: 21, buyRatio: 0.9, isLiq: true },
      { progressX: 0.34, priceOffsetRatio: waypoints[61].priceOffsetRatio, radius: 11, buyRatio: 0.4 },
      { progressX: 0.40, priceOffsetRatio: waypoints[72].priceOffsetRatio, radius: 16, buyRatio: 0.5 },
      { progressX: 0.46, priceOffsetRatio: waypoints[82].priceOffsetRatio, radius: 24, buyRatio: 0.85, isLiq: true },
      { progressX: 0.52, priceOffsetRatio: waypoints[93].priceOffsetRatio, radius: 13, buyRatio: 0.3 },
      { progressX: 0.58, priceOffsetRatio: waypoints[104].priceOffsetRatio, radius: 26, buyRatio: 0.5, isLiq: true },
      { progressX: 0.64, priceOffsetRatio: waypoints[115].priceOffsetRatio, radius: 17, buyRatio: 0.2 },
      { progressX: 0.70, priceOffsetRatio: waypoints[126].priceOffsetRatio, radius: 28, buyRatio: 0.75, isLiq: true },
      { progressX: 0.77, priceOffsetRatio: waypoints[138].priceOffsetRatio, radius: 19, buyRatio: 0.5 },
      { progressX: 0.83, priceOffsetRatio: waypoints[149].priceOffsetRatio, radius: 25, buyRatio: 0.9, isLiq: true },
      { progressX: 0.89, priceOffsetRatio: waypoints[160].priceOffsetRatio, radius: 15, buyRatio: 0.4 },
      { progressX: 0.95, priceOffsetRatio: waypoints[171].priceOffsetRatio, radius: 20, buyRatio: 0.5, isLiq: true }
    ];

    const vBars: VolumeBarPoint[] = [];
    const barCounts = [22, 28, 35, 41, 24, 18, 29, 32, 45, 52, 68, 95, 84, 56, 42, 38, 55, 92, 114, 76, 58, 44, 39, 31, 27, 22, 19, 16, 14, 12, 9, 7];
    for (let k = 0; k < barCounts.length; k++) {
      const u = k / (barCounts.length - 1);
      const totalVol = barCounts[k];
      const buyFraction = 0.48 + (Math.sin(k * 0.75) * 0.28);
      const buyVol = Math.round(totalVol * buyFraction);
      const sellVol = totalVol - buyVol;
      vBars.push({ progressX: u, buyVol, sellVol, totalVol });
    }

    return { trajectoryPattern: waypoints, bubblePattern: bList, volumeBars: vBars };
  }, [activeContract]);

  // Update Contract Default Price & Reset view
  useEffect(() => {
    setLivePrice(config.defaultPrice);
    setBestBid(config.defaultPrice - config.tickSize);
    setBestAsk(config.defaultPrice + config.tickSize);
    setPanOffsetY(0);
    setPanOffsetX(0);
    setPriceZoom(1.0);
    setFocusedWallId(null);
  }, [activeContract, config]);

  // Live WebSocket Tick Simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLivePrice((prev) => {
        const jitter = (Math.random() - 0.5) * config.tickSize * 1.5;
        const nextPrice = Number((prev + jitter).toFixed(config.decimals));
        setBestBid(Number((nextPrice - config.tickSize).toFixed(config.decimals)));
        setBestAsk(Number((nextPrice + config.tickSize).toFixed(config.decimals)));
        return nextPrice;
      });
      setLatencyMs(Math.round(12 + Math.random() * 8));
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, config]);

  // ── CORE CANVAS RENDERING ENGINE (1:1 PIXEL PARITY WITH USER PHOTOS) ──────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const domWidth = 195; // Exact Bookmap DOM ladder width
      const bottomSubHeight = 85; // Volume sub-panel height
      const chartWidth = w - domWidth;
      const chartHeight = h - bottomSubHeight;

      // Clear Canvas with Dark Deep Blue Gradient
      ctx.fillStyle = '#050e1c';
      ctx.fillRect(0, 0, w, h);

      // Price Span Calculation
      const basePrice = livePrice;
      const pSpan = (basePrice * config.typicalSpanPct) / priceZoom;
      const centerPrice = basePrice + panOffsetY;
      const currentMinP = centerPrice - pSpan / 2;
      const currentMaxP = centerPrice + pSpan / 2;

      const priceToY = (p: number) => {
        return chartHeight - ((p - currentMinP) / pSpan) * chartHeight;
      };

      // ─────────────────────────────────────────────────────────────
      // 1. ORDER BOOK HEATMAP BACKGROUND LIQUIDITY FIELD (NAVY / CYAN)
      // ─────────────────────────────────────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, chartWidth, chartHeight);
      bgGrad.addColorStop(0, '#040b17');
      bgGrad.addColorStop(0.5, '#051326');
      bgGrad.addColorStop(1, '#030a14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, chartWidth, chartHeight);

      // Multi-layer Resting Limit Bands (Blue/Cyan noise field)
      for (let y = 0; y < chartHeight; y += 12) {
        const rowNoise = Math.sin(y * 0.08) * 0.5 + 0.5;
        const alpha = (0.04 + rowNoise * 0.09) * (heatmapSensitivity / 65);
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.fillRect(0, y, chartWidth, 8);
      }

      // ─────────────────────────────────────────────────────────────
      // 2. LIQUIDATION SHELVES & GLOWING LIMIT ORDER WALLS
      // (Red, Orange, Yellow, White, Cyan bands matching Photo 1 & 2)
      // ─────────────────────────────────────────────────────────────
      for (const wall of config.liquidityWalls) {
        const wallPrice = basePrice * (1 + wall.priceOffsetPct);
        const wallY = priceToY(wallPrice);

        if (wallY < -20 || wallY > chartHeight + 20) continue;

        const startX = wall.startRatio * chartWidth;
        const wallW = chartWidth - startX;
        const thick = wall.thickness;
        const isFocused = focusedWallId === wall.id;

        if (wall.category === 'RED') {
          // 🔴 EXTREME RED LIQUIDATION MAGNET SHELF
          const outerGrad = ctx.createLinearGradient(0, wallY - thick * 1.6, 0, wallY + thick * 1.6);
          outerGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
          outerGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.95)');
          outerGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = outerGrad;
          ctx.fillRect(startX, wallY - thick * 1.6, wallW, thick * 3.2);

          // Solid Inner Crimson Core
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(startX, wallY - thick / 2, wallW, thick);

          // Bright Amber Hot Edge
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(startX, wallY - 1, wallW, 2);

          // Faint Label
          ctx.fillStyle = 'rgba(254, 202, 202, 0.7)';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`🔴 $${wall.volumeM}M LIQUIDATION · ${wall.leverageBracket}`, startX + 12, wallY - thick / 2 - 3);

          if (isFocused) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(startX - 2, wallY - thick * 1.5, wallW + 2, thick * 3);
          }
        } else if (wall.category === 'ORANGE') {
          // 🟠 HIGH ORANGE LIQUIDATION SHELF
          const outerGrad = ctx.createLinearGradient(0, wallY - thick * 1.4, 0, wallY + thick * 1.4);
          outerGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
          outerGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.9)');
          outerGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');

          ctx.fillStyle = outerGrad;
          ctx.fillRect(startX, wallY - thick * 1.4, wallW, thick * 2.8);

          ctx.fillStyle = '#f97316';
          ctx.fillRect(startX, wallY - thick / 2, wallW, thick);

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(startX, wallY - 1, wallW, 2);

          ctx.fillStyle = 'rgba(254, 215, 170, 0.7)';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`🟠 $${wall.volumeM}M STOP-HUNT · ${wall.leverageBracket}`, startX + 12, wallY - thick / 2 - 3);
        } else if (wall.category === 'YELLOW') {
          // 🟡 BRIGHT YELLOW RESTING LIMIT WALL
          const outerGrad = ctx.createLinearGradient(0, wallY - thick, 0, wallY + thick);
          outerGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
          outerGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.88)');
          outerGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');

          ctx.fillStyle = outerGrad;
          ctx.fillRect(startX, wallY - thick, wallW, thick * 2);

          ctx.fillStyle = '#facc15';
          ctx.fillRect(startX, wallY - thick / 2, wallW, thick);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(startX, wallY - 0.75, wallW, 1.5);

          ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`🟡 $${wall.volumeM}M LIMIT WALL`, startX + 12, wallY - thick / 2 - 3);
        } else if (wall.category === 'WHITE') {
          // ⚪ WHITE ABSORPTION BAND
          const outerGrad = ctx.createLinearGradient(0, wallY - thick, 0, wallY + thick);
          outerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          outerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.75)');
          outerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = outerGrad;
          ctx.fillRect(startX, wallY - thick, wallW, thick * 2);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(startX, wallY - thick / 2, wallW, thick);

          ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`⚪ $${wall.volumeM}M ABSORPTION`, startX + 12, wallY - thick / 2 - 2);
        } else {
          // 🔵 CYAN / BLUE LIQUIDITY BAND
          const outerGrad = ctx.createLinearGradient(0, wallY - thick, 0, wallY + thick);
          outerGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          outerGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.65)');
          outerGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.fillStyle = outerGrad;
          ctx.fillRect(startX, wallY - thick, wallW, thick * 2);

          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(startX, wallY - thick / 2, wallW, thick);

          ctx.fillStyle = 'rgba(207, 250, 254, 0.7)';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`🔵 $${wall.volumeM}M DEPTH`, startX + 12, wallY - thick / 2 - 2);
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. VERTICAL TIME GRID LINES ACROSS HEATMAP
      // ─────────────────────────────────────────────────────────────
      ctx.strokeStyle = '#0e243b';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      const numGridCols = 9;
      for (let c = 1; c < numGridCols; c++) {
        const gridX = (c / numGridCols) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, chartHeight);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ─────────────────────────────────────────────────────────────
      // 4. RENDER STEPPED BID / ASK SPREAD & CONTINUOUS PRICE WAVE
      // ─────────────────────────────────────────────────────────────
      if (trajectoryPattern.length > 1) {
        // Continuous Best Bid Line (Emerald Green)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < trajectoryPattern.length; i++) {
          const pt = trajectoryPattern[i];
          const px = pt.progressX * chartWidth;
          const pVal = basePrice + (pt.priceOffsetRatio * pSpan * 0.42) - config.tickSize;
          const py = priceToY(pVal);
          if (i === 0) ctx.moveTo(px, py);
          else {
            const prevP = basePrice + (trajectoryPattern[i - 1].priceOffsetRatio * pSpan * 0.42) - config.tickSize;
            ctx.lineTo(px, priceToY(prevP));
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Continuous Best Ask Line (Crimson Red)
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < trajectoryPattern.length; i++) {
          const pt = trajectoryPattern[i];
          const px = pt.progressX * chartWidth;
          const pVal = basePrice + (pt.priceOffsetRatio * pSpan * 0.42) + config.tickSize;
          const py = priceToY(pVal);
          if (i === 0) ctx.moveTo(px, py);
          else {
            const prevP = basePrice + (trajectoryPattern[i - 1].priceOffsetRatio * pSpan * 0.42) + config.tickSize;
            ctx.lineTo(px, priceToY(prevP));
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Traded Price Line (Bright White Line matching Photo 2 & 3)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < trajectoryPattern.length; i++) {
          const pt = trajectoryPattern[i];
          const px = pt.progressX * chartWidth;
          const pVal = basePrice + (pt.priceOffsetRatio * pSpan * 0.42);
          const py = priceToY(pVal);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. RENDER 3D TWO-TONE VOLUME BUBBLES (SPHERICAL MARBLES)
      // Exactly matching Photo 1 & Photo 2 Bookmap Spheres!
      // ─────────────────────────────────────────────────────────────
      for (const b of bubblePattern) {
        const bx = b.progressX * chartWidth;
        const bPrice = basePrice + (b.priceOffsetRatio * pSpan * 0.42);
        const by = priceToY(bPrice);
        const r = b.radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.clip();

        if (b.buyRatio === 0.5) {
          // Signature Bookmap Split Two-Tone Sphere (Green Top, Red Bottom)
          ctx.fillStyle = '#10b981';
          ctx.fillRect(bx - r, by - r, r * 2, r);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bx - r, by, r * 2, r);
        } else if (b.buyRatio > 0.5) {
          // Aggressive Buy (Green Sphere)
          ctx.fillStyle = '#10b981';
          ctx.fillRect(bx - r, by - r, r * 2, r * 2);
        } else {
          // Aggressive Sell (Red Sphere)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bx - r, by - r, r * 2, r * 2);
        }

        // 3D Spherical Specular Highlight (Makes it look like a genuine 3D marble!)
        const highlightGrad = ctx.createRadialGradient(
          bx - r * 0.35,
          by - r * 0.35,
          r * 0.08,
          bx,
          by,
          r
        );
        highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        highlightGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.35)');
        highlightGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.25)');
        highlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

        ctx.fillStyle = highlightGrad;
        ctx.fillRect(bx - r, by - r, r * 2, r * 2);

        ctx.restore();

        // Outer Dark Precision Border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.stroke();

        // Outer Neon Ring for Liquidations
        if (b.isLiq) {
          ctx.strokeStyle = b.buyRatio > 0.5 ? '#4ade80' : '#f87171';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(bx, by, r + 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5B. SIGNATURE BOOKMAP INSPECTION TOOLTIP (1:1 PHOTO 2 MATCH)
      // "08-Nov-2019 ET | 17:32:11.458 | Ask: 150 at 230.87 | Volume: 2330 at 230.87 (0.0104s)"
      // With vertical cyan line extending to bottom time axis
      // ─────────────────────────────────────────────────────────────
      if (showSignatureTooltip && bubblePattern.length > 2) {
        const targetB = bubblePattern[2];
        const targetBx = targetB.progressX * chartWidth;
        const targetBPrice = basePrice + (targetB.priceOffsetRatio * pSpan * 0.42);
        const targetBy = priceToY(targetBPrice);

        const cardW = 195;
        const cardH = 64;
        const cardX = Math.max(12, Math.min(chartWidth - cardW - 12, targetBx - 30));
        const cardY = Math.max(28, targetBy - cardH - 32);

        // Dark slate translucent tooltip card
        ctx.fillStyle = 'rgba(11, 23, 42, 0.94)';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        // Header highlight strip
        ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
        ctx.fillRect(cardX + 1, cardY + 1, cardW - 2, 16);

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';

        // Line 1: Date & Time
        ctx.fillStyle = '#67e8f9';
        const dateStr = activeContract === 'AAPL@DXFEED' ? '08-Nov-2019 ET' : activeContract === 'GEVO@DXFEED' ? '22-Oct-2026 ET' : '22-Oct-2026 ET';
        const timeStr = activeContract === 'AAPL@DXFEED' ? '17:32:11.458' : '10:14:22.584';
        ctx.fillText(`${dateStr}  ${timeStr}`, cardX + 7, cardY + 12);

        // Line 2: Ask Depth
        ctx.fillStyle = '#ffffff';
        const askDisplayPrice = activeContract === 'AAPL@DXFEED' ? '230.87' : activeContract === 'GEVO@DXFEED' ? '1.38' : activeContract === 'ES_MINI@CME' ? '4273.25' : livePrice.toFixed(config.decimals);
        const askSizeStr = activeContract === 'AAPL@DXFEED' ? '150' : '250';
        ctx.fillText(`Ask: ${askSizeStr} at ${askDisplayPrice}`, cardX + 7, cardY + 28);

        // Line 3: Volume & Bookmap execution badge
        ctx.fillStyle = '#38bdf8';
        const volStr = activeContract === 'AAPL@DXFEED' ? 'Volume: 2330 at 230.87 (0.0104s)' : `Volume: 1530 at ${askDisplayPrice}(1510)b`;
        ctx.fillText(volStr, cardX + 7, cardY + 46);

        // Cyan pointer line down to target bubble
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 35, cardY + cardH);
        ctx.lineTo(targetBx, targetBy - targetB.radius - 3);
        ctx.stroke();

        // Cyan vertical drop line to bottom time axis (Photo 2 signature feature!)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(targetBx, targetBy + targetB.radius + 3);
        ctx.lineTo(targetBx, chartHeight);
        ctx.stroke();

        // Cyan dot at bottom
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(targetBx, chartHeight - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cyan targeting reticle ring on bubble
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(targetBx, targetBy, targetB.radius + 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────
      // PHOTO 3 (ES_MINI@CME) TOP-LEFT HEADER:
      // [Sim1] Trade: 1 @ 4254.75 | OPL: 0.00P
      // ─────────────────────────────────────────────────────────────
      if (activeContract === 'ES_MINI@CME') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('[Sim1] Trade: 1 @ 4254.75', 12, 22);
        ctx.fillText('OPL: 0.00P', 12, 38);
      }

      // ─────────────────────────────────────────────────────────────
      // 6. CURRENT PRICE HORIZONTAL DASHED LINE & RIGHT PRICE BADGE
      // ─────────────────────────────────────────────────────────────
      const currentY = priceToY(livePrice);
      if (currentY >= 0 && currentY <= chartHeight) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(chartWidth, currentY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Attached live price badge at the right edge of heatmap canvas (Photo 1 "1585 (1585)")
        const tagW = activeContract === 'GEVO@DXFEED' ? 82 : 105;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(chartWidth - tagW - 2, currentY - 8, tagW, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          activeContract === 'GEVO@DXFEED' ? '1585 (1585)' : `${livePrice.toFixed(config.decimals)} (1585)`,
          chartWidth - tagW / 2 - 2,
          currentY + 4
        );
      }

      // ─────────────────────────────────────────────────────────────
      // 7. PRECISION YELLOW CROSSHAIR CURSOR & LIQUIDATION INSPECTOR
      // ─────────────────────────────────────────────────────────────
      if (showCrosshair && hoverInfo && hoverInfo.visible) {
        // Vertical yellow cursor line
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hoverInfo.x, 0);
        ctx.lineTo(hoverInfo.x, chartHeight);
        ctx.stroke();

        // Horizontal yellow cursor line
        ctx.beginPath();
        ctx.moveTo(0, hoverInfo.y);
        ctx.lineTo(chartWidth, hoverInfo.y);
        ctx.stroke();

        // Yellow price badge in DOM right margin
        ctx.fillStyle = '#facc15';
        ctx.fillRect(chartWidth + 1, hoverInfo.y - 8, domWidth - 2, 16);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(hoverInfo.price.toFixed(config.decimals), w - 5, hoverInfo.y + 4);
      }

      // ─────────────────────────────────────────────────────────────
      // 8. RIGHT DOM (DEPTH OF MARKET) & COB LADDER (PHOTOS 1, 2, 3)
      // Exactly matching Photo 1: PRICE | COB | COB-AG columns
      // Exactly matching Photo 3: Buy | Sell | Price dual bars
      // ─────────────────────────────────────────────────────────────
      ctx.fillStyle = '#050c18';
      ctx.fillRect(chartWidth, 0, domWidth, chartHeight);

      ctx.strokeStyle = '#0e243b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartWidth, 0);
      ctx.lineTo(chartWidth, chartHeight);
      ctx.stroke();

      // Column Header Strip matching Bookmap
      ctx.fillStyle = '#081424';
      ctx.fillRect(chartWidth, 0, domWidth, 18);

      if (domMode === 'BUY_SELL') {
        // Photo 3: Dual Buy & Sell columns (ES Mini CME)
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Buy', chartWidth + 6, 12);

        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('Sell', chartWidth + 65, 12);

        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        ctx.fillText('Price', w - 4, 12);
      } else {
        // Photo 1 & 2: Exact Bookmap PRICE | COB | COB-AG columns
        ctx.fillStyle = '#597592';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('PRICE', chartWidth + 6, 12);
        ctx.textAlign = 'right';
        ctx.fillText('COB', chartWidth + 88, 12);
        ctx.textAlign = 'right';
        ctx.fillText('COB-AG', w - 6, 12);
      }

      // Static depth lookup for GEVO (Photo 1 exact numbers)
      const gevoLookup: Record<string, { cob: number; ag: number; isRedPeak?: boolean; isGreenPeak?: boolean }> = {
        '1.54': { cob: 27583, ag: 2521387 },
        '1.52': { cob: 35907, ag: 2493804 },
        '1.50': { cob: 377085, ag: 2445441, isRedPeak: true },
        '1.48': { cob: 221657, ag: 2048771 },
        '1.46': { cob: 78593, ag: 1735634 },
        '1.44': { cob: 288114, ag: 1616038 },
        '1.42': { cob: 133073, ag: 1217072 },
        '1.40': { cob: 187295, ag: 1020726 },
        '1.38': { cob: 125874, ag: 810490 },
        '1.36': { cob: 79055, ag: 632517 },
        '1.34': { cob: 74494, ag: 528676 },
        '1.32': { cob: 116978, ag: 419632 },
        '1.30': { cob: 96609, ag: 210102 },
        '1.28': { cob: 51530, ag: 51530 },
        '1.26': { cob: 146307, ag: 300309, isGreenPeak: true },
        '1.24': { cob: 211560, ag: 695610, isGreenPeak: true },
        '1.22': { cob: 132121, ag: 863113 },
        '1.20': { cob: 151068, ag: 1106920 },
        '1.18': { cob: 40383, ag: 1180365 },
        '1.16': { cob: 20383, ag: 1214948 },
        '1.14': { cob: 94132, ag: 1322298 },
        '1.12': { cob: 72435, ag: 1404550 },
        '1.10': { cob: 267608, ag: 1721921, isGreenPeak: true },
        '1.08': { cob: 85568, ag: 1812945 }
      };

      if (activeContract === 'GEVO@DXFEED' && domMode === 'COB') {
        // 🌟 PHOTO 1: EXACT 24 ROWS FOR GEVO
        const gevoPrices = [
          '1.54', '1.52', '1.50', '1.48', '1.46', '1.44', '1.42', '1.40',
          '1.38', '1.36', '1.34', '1.32', '1.30', '1.28', '1.26', '1.24',
          '1.22', '1.20', '1.18', '1.16', '1.14', '1.12', '1.10', '1.08'
        ];

        for (let r = 0; r < gevoPrices.length; r++) {
          const priceStr = gevoPrices[r];
          const rowPrice = parseFloat(priceStr);
          const rowY = priceToY(rowPrice);
          if (rowY < 18 || rowY > chartHeight) continue;

          const isAsk = rowPrice > livePrice;
          const isAtSpot = Math.abs(rowPrice - livePrice) < 0.005;
          const gevoItem = gevoLookup[priceStr];

          if (isAtSpot) {
            // Price 1.28 Active Spot Row (with red outline box)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(chartWidth + 1, rowY - 7, domWidth - 2, 14);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(chartWidth + 1, rowY - 7, domWidth - 2, 14);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(priceStr, chartWidth + 6, rowY + 3);
            ctx.textAlign = 'right';
            ctx.fillText('51530', chartWidth + 88, rowY + 3);
            ctx.fillText('51530', w - 6, rowY + 3);
            continue;
          }

          // 1. Column 1: PRICE (Left side of DOM ladder)
          ctx.fillStyle = isAsk ? '#f87171' : '#34d399';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(priceStr, chartWidth + 6, rowY + 3);

          // 2. Column 2: COB (Middle column with red / green peak badges)
          const displayCobStr = gevoItem ? String(gevoItem.cob) : '50000';

          if (isAsk) {
            // Asks: High peak (1.50) has solid RED background box
            if (gevoItem?.isRedPeak) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(chartWidth + 44, rowY - 6, 46, 12);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
            } else {
              ctx.fillStyle = '#f87171';
              ctx.font = '8.5px "JetBrains Mono", monospace';
            }
            ctx.textAlign = 'right';
            ctx.fillText(displayCobStr, chartWidth + 88, rowY + 3);

            // 3. Column 3: COB-AG (Cumulative red horizontal bars extending right)
            const agVal = gevoItem ? gevoItem.ag : 1000000;
            const agMax = 2600000;
            const agBarW = Math.min(88, Math.max(10, (agVal / agMax) * 88));

            ctx.fillStyle = gevoItem?.isRedPeak ? '#ef4444' : 'rgba(239, 68, 68, 0.75)';
            ctx.fillRect(chartWidth + 96, rowY - 5, agBarW, 10);

            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(String(agVal), w - 6, rowY + 3);
          } else {
            // Bids: High peaks (1.26, 1.24, 1.10) have solid GREEN background box
            if (gevoItem?.isGreenPeak) {
              ctx.fillStyle = '#10b981';
              ctx.fillRect(chartWidth + 44, rowY - 6, 46, 12);
              ctx.fillStyle = '#020617';
              ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
            } else {
              ctx.fillStyle = '#34d399';
              ctx.font = '8.5px "JetBrains Mono", monospace';
            }
            ctx.textAlign = 'right';
            ctx.fillText(displayCobStr, chartWidth + 88, rowY + 3);

            // 3. Column 3: COB-AG (Cumulative green horizontal bars extending right)
            const agVal = gevoItem ? gevoItem.ag : 1000000;
            const agMax = 2000000;
            const agBarW = Math.min(88, Math.max(10, (agVal / agMax) * 88));

            ctx.fillStyle = gevoItem?.isGreenPeak ? '#10b981' : 'rgba(16, 185, 129, 0.75)';
            ctx.fillRect(chartWidth + 96, rowY - 5, agBarW, 10);

            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(String(agVal), w - 6, rowY + 3);
          }
        }
      } else {
        // Standard / Multi-asset DOM generation
        const numRows = Math.floor((chartHeight - 20) / 14);
        const rowStep = pSpan / numRows;

        for (let r = 0; r < numRows; r++) {
          const rowPrice = currentMaxP - (r * rowStep);
          const rowY = 22 + (r * 14);
          const isAsk = rowPrice > livePrice;
          const curve = Math.sin(r * 0.35) * 35 + 45;

          if (domMode === 'BUY_SELL') {
            // Photo 3: Dual Buy and Sell columns with green & red bars (ES Mini)
            const buyVal = Math.round(isAsk ? curve * 0.35 + (r % 3) * 8 : curve * 1.8 + (r % 4) * 22);
            const sellVal = Math.round(isAsk ? curve * 1.8 + (r % 4) * 24 : curve * 0.35 + (r % 3) * 8);

            // Buy column (Green bar)
            const buyBarW = Math.min(42, Math.max(4, (buyVal / 180) * 42));
            ctx.fillStyle = isAsk ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.85)';
            ctx.fillRect(chartWidth + 2, rowY - 5, buyBarW, 10);
            ctx.fillStyle = isAsk ? '#6ee7b7' : '#a7f3d0';
            ctx.font = '8.5px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(String(buyVal), chartWidth + 4, rowY + 3);

            // Sell column (Red bar)
            const sellBarW = Math.min(42, Math.max(4, (sellVal / 180) * 42));
            ctx.fillStyle = isAsk ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.35)';
            ctx.fillRect(chartWidth + 52, rowY - 5, sellBarW, 10);
            ctx.fillStyle = isAsk ? '#fca5a5' : '#fecaca';
            ctx.textAlign = 'left';
            ctx.fillText(String(sellVal), chartWidth + 54, rowY + 3);

            // Price Axis Label on right edge
            if (r % 2 === 0) {
              ctx.fillStyle = '#94a3b8';
              ctx.font = '9px "JetBrains Mono", monospace';
              ctx.textAlign = 'right';
              ctx.fillText(rowPrice.toFixed(config.decimals), w - 4, rowY + 3);
            }
          } else {
            // Standard COB
            ctx.fillStyle = isAsk ? '#f87171' : '#34d399';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(rowPrice.toFixed(config.decimals), chartWidth + 6, rowY + 3);

            const depthVal = Math.round(isAsk ? curve + (r % 3) * 15 : curve + (r % 4) * 20);
            ctx.fillStyle = isAsk ? '#f87171' : '#34d399';
            ctx.font = '8.5px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(String(depthVal), chartWidth + 88, rowY + 3);

            const agVal = isAsk ? Math.round(2500000 - r * 45000) : Math.round(51530 + r * 65000);
            const agBarW = Math.min(88, Math.max(10, (agVal / 2500000) * 88));
            ctx.fillStyle = isAsk ? 'rgba(239, 68, 68, 0.75)' : 'rgba(16, 185, 129, 0.75)';
            ctx.fillRect(chartWidth + 96, rowY - 5, agBarW, 10);

            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(String(agVal), w - 6, rowY + 3);
          }
        }

        // Current Price Box in DOM for Non-GEVO contracts
        if (currentY >= 0 && currentY <= chartHeight) {
          if (domMode === 'BUY_SELL') {
            // Photo 3: Crisp White Box with Black Text at Current Price
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(chartWidth + 1, currentY - 9, domWidth - 2, 18);
            ctx.fillStyle = '#000000';
            ctx.font = 'black 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(livePrice.toFixed(config.decimals), w - 4, currentY + 4);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(chartWidth + 1, currentY - 7, domWidth - 2, 14);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(chartWidth + 1, currentY - 7, domWidth - 2, 14);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(livePrice.toFixed(config.decimals), chartWidth + 6, currentY + 3);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // PHOTO 1 AUTHENTIC WATERMARK: TRADING REVIEWERS (with 3 green bars)
      // ─────────────────────────────────────────────────────────────
      if (activeContract === 'GEVO@DXFEED') {
        const wmX = 14;
        const wmY = chartHeight - 20;

        // 3 stacked green bars
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(wmX, wmY - 16, 20, 4);
        ctx.fillRect(wmX, wmY - 9, 28, 4);
        ctx.fillRect(wmX, wmY - 2, 24, 4);

        // Bold white text: TRADING / REVIEWERS
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('TRADING', wmX + 34, wmY - 6);
        ctx.fillText('REVIEWERS', wmX + 34, wmY + 8);
      }

      // ─────────────────────────────────────────────────────────────
      // PHOTO 3 BOTTOM-RIGHT GREEN BADGE: '2 LL'
      // ─────────────────────────────────────────────────────────────
      if (activeContract === 'ES_MINI@CME' || domMode === 'BUY_SELL') {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(w - 28, h - 18, 24, 14);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('2 LL', w - 16, h - 7);
      }

      // ─────────────────────────────────────────────────────────────
      // 9. BOTTOM VOLUME & DELTA SUB-PANEL (PHOTOS 1 & 2)
      // ─────────────────────────────────────────────────────────────
      ctx.fillStyle = '#050c18';
      ctx.fillRect(0, chartHeight, w, bottomSubHeight);

      ctx.strokeStyle = '#0e243b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, chartHeight);
      ctx.lineTo(w, chartHeight);
      ctx.stroke();

      // Volume Scale Tag (e.g. 700000 matching Photo 1)
      ctx.fillStyle = '#47627e';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('700000', 8, chartHeight + 14);

      const colSpanW = Math.max(10, chartWidth / volumeBars.length);

      for (let i = 0; i < volumeBars.length; i++) {
        const vb = volumeBars[i];
        const bx = vb.progressX * chartWidth;
        const total = vb.totalVol;
        const maxH = bottomSubHeight - 26;
        const barH = Math.min(maxH, Math.max(14, (total / 120) * maxH));

        const buyH = barH * (vb.buyVol / total);
        const sellH = barH - buyH;
        const baseY = h - 18;

        ctx.fillStyle = '#10b981';
        ctx.fillRect(bx - colSpanW * 0.4, baseY - buyH, colSpanW * 0.8, buyH);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx - colSpanW * 0.4, baseY - barH, colSpanW * 0.8, sellH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(total), bx, baseY - barH - 3);
      }

      // Time Axis Labels across bottom (e.g. 09:50, 09:55, 10:00, 10:05 matching Photo 1)
      const timeStamps = ['09:50', '09:55', '10:00', '10:05', '10:10', '10:15'];
      for (let t = 0; t < timeStamps.length; t++) {
        const tx = (t / (timeStamps.length - 1)) * (chartWidth - 50) + 25;
        ctx.fillStyle = '#597592';
        ctx.font = '9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStamps[t], tx, h - 5);
      }

      // Right corner status (Photo 1 exact layout)
      ctx.fillStyle = '#597592';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Powered by Devexperts  10:15 DX', chartWidth - 10, h - 5);
      ctx.fillText('Data: Live  Trading: Simulated', w - 8, h - 5);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    livePrice,
    priceZoom,
    panOffsetY,
    showCrosshair,
    config,
    trajectoryPattern,
    bubblePattern,
    volumeBars,
    hoverInfo,
    focusedWallId,
    activeContract,
    domMode,
    heatmapSensitivity,
    showSignatureTooltip
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // ── MOUSE DRAGGING & LIQUIDATION INSPECTOR ──────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const domWidth = 195;
    const subHeight = 85;
    const chartW = rect.width - domWidth;
    const chartH = rect.height - subHeight;

    // Handle Dragging / Panning (Move Up, Down, Left, Right with Hand!)
    if (isDraggingRef.current) {
      const dy = e.clientY - dragStartPosRef.current.y;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };

      const basePrice = livePrice;
      const pSpan = (basePrice * config.typicalSpanPct) / priceZoom;
      const priceDelta = (dy / chartH) * pSpan;

      setPanOffsetY((prev) => prev + priceDelta);
      return;
    }

    if (x > chartW || y > chartH) {
      setHoverInfo(null);
      return;
    }

    // Precise Price at Cursor
    const basePrice = livePrice;
    const pSpan = (basePrice * config.typicalSpanPct) / priceZoom;
    const centerP = basePrice + panOffsetY;
    const curMinP = centerP - pSpan / 2;
    const curMaxP = centerP + pSpan / 2;
    const priceAtY = curMaxP - (y / chartH) * pSpan;

    // Detect Nearest Liquidation Wall
    let nearestWall: any = undefined;
    let minDiff = Infinity;

    for (const w of config.liquidityWalls) {
      const wPrice = basePrice * (1 + w.priceOffsetPct);
      const diff = Math.abs(wPrice - priceAtY);
      if (diff < minDiff && diff < pSpan * 0.12) {
        minDiff = diff;
        const distPct = ((wPrice - basePrice) / basePrice) * 100;
        nearestWall = {
          id: w.id,
          label: w.label,
          volumeM: w.volumeM,
          category: w.category,
          side: w.side,
          leverageBracket: w.leverageBracket,
          distPct: Number(distPct.toFixed(2)),
          price: wPrice,
          institutionalNote: w.institutionalNote
        };
      }
    }

    setHoverInfo({
      visible: true,
      x,
      y,
      price: priceAtY,
      timeStr: '10:14:22.584',
      nearestWall,
      depthSize: Math.round(75 + Math.random() * 150),
      volStr: priceAtY >= basePrice ? '+52 ASK (Hit Ask)' : '-48 BID (Hit Bid)'
    });
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoverInfo(null);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setPriceZoom((z) => Math.min(4.5, z * 1.15));
    } else {
      setPriceZoom((z) => Math.max(0.35, z * 0.88));
    }
  };

  const handleZoomIn = () => setPriceZoom((z) => Math.min(4.5, z * 1.25));
  const handleZoomOut = () => setPriceZoom((z) => Math.max(0.35, z * 0.8));
  const handleResetZoom = () => {
    setPriceZoom(1.0);
    setPanOffsetY(0);
    setPanOffsetX(0);
    setFocusedWallId(null);
  };

  const handleFocusWall = (wall: LiquidityWallSpec) => {
    setFocusedWallId(wall.id);
    const targetOffsetPrice = livePrice * wall.priceOffsetPct;
    setPanOffsetY(targetOffsetPrice);
  };

  const handleTakeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Bookmap_${activeContract}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 select-none">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. EXACT BOOKMAP WINDOW CONTAINER (1:1 PARITY WITH USER PHOTOS)    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[890px] rounded-2xl'} bg-[#050b16] border border-cyan-500/25 shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden`}>
        
        {/* ── TOP TITLEBAR: EXACT BOOKMAP DESKTOP CONTROLS (PHOTOS 1, 2, 3) ── */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#0b1322] px-3 py-1.5 border-b border-[#334155] text-xs shadow-md">
          {/* Left Menus & Drawing Icons */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {/* Standard Desktop Menu */}
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs pr-2 border-r border-slate-700">
              <span className="hover:text-white cursor-pointer">File</span>
              <span className="hover:text-white cursor-pointer">Connections</span>
              <span className="hover:text-white cursor-pointer">Settings</span>
              <span className="hover:text-white cursor-pointer">Help</span>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1 text-slate-400">
              <button onClick={handleZoomIn} title="Zoom In" className="p-1 rounded hover:bg-slate-800 hover:text-white">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleZoomOut} title="Zoom Out" className="p-1 rounded hover:bg-slate-800 hover:text-white">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'CROSSHAIR' ? 'PAN' : 'CROSSHAIR')}
                title="Crosshair"
                className={`p-1 rounded ${activeTool === 'CROSSHAIR' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'TRENDLINE' ? 'PAN' : 'TRENDLINE')}
                title="Trendline / Ray"
                className={`p-1 rounded ${activeTool === 'TRENDLINE' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'PAN' ? 'CROSSHAIR' : 'PAN')}
                title="Hand Tool (Pan Chart)"
                className={`p-1 rounded ${activeTool === 'PAN' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Hand className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleResetZoom} title="Reset View" className="p-1 rounded hover:bg-slate-800 hover:text-cyan-300">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="h-4 w-px bg-slate-700 mx-1" />

            {/* 🌟 USER CIRCLED IN PHOTO 2: EXACT BOOKMAP COLORMAP SENSITIVITY CAPSULE SLIDER WIDGET 🌟 */}
            <div
              className="flex items-center gap-2 bg-[#0a1526] px-2.5 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.45)] cursor-pointer select-none group relative"
              title="Bookmap Colormap Sensitivity Slider (User Circled in Photo 2) - Drag knob to adjust heatmap contrast and threshold"
            >
              <div className="relative w-32 sm:w-36 h-4 rounded-full overflow-hidden p-0.5 border border-slate-600 bg-black flex items-center shadow-inner">
                {/* Authentic Bookmap Spectrum Gradient */}
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #000000 0%, #03447c 20%, #06b6d4 40%, #ffffff 52%, #facc15 68%, #f97316 84%, #ef4444 100%)'
                  }}
                />
                {/* Draggable Knob (White circle with yellow ring matching user screenshot) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-yellow-400 shadow-[0_2px_8px_rgba(0,0,0,0.9)] pointer-events-none transition-transform"
                  style={{
                    left: `calc(${heatmapSensitivity}% - 8px)`
                  }}
                />
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={heatmapSensitivity}
                  onChange={(e) => setHeatmapSensitivity(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                />
              </div>
              <span className="text-[10px] font-mono font-black text-yellow-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 min-w-[34px] text-center">
                {heatmapSensitivity}%
              </span>
            </div>

            {/* DOM Ladder View Toggle: COB (Photo 1) vs BUY/SELL (Photo 3) */}
            <div className="hidden md:flex items-center gap-1 bg-[#091528] p-0.5 rounded-md border border-slate-700 text-[10px] font-mono">
              <button
                onClick={() => setDomMode('COB')}
                className={`px-2 py-0.5 rounded font-bold transition ${domMode === 'COB' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                title="Photo 1 Standard COB Ladder"
              >
                COB (Photo 1)
              </button>
              <button
                onClick={() => setDomMode('BUY_SELL')}
                className={`px-2 py-0.5 rounded font-bold transition ${domMode === 'BUY_SELL' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                title="Photo 3 ES Dual Buy/Sell Ladder"
              >
                Buy/Sell (Photo 3)
              </button>
            </div>

            {/* Book & Volume Ratio Meter (Photo 1 & 2: 'Book: +25% Volume: -01%') */}
            <div className="hidden xl:flex items-center gap-2 bg-[#091528] px-2.5 py-1 rounded-md border border-slate-700/70 text-[10px] font-mono">
              <span className="text-slate-400">Book: <b className="text-emerald-400">+25%</b></span>
              <span className="text-slate-400">Vol: <b className="text-rose-400">-01%</b></span>
              {/* Segmented green & red mini battery bar */}
              <div className="flex gap-0.5">
                <span className="w-2 h-2.5 rounded-xs bg-emerald-500" />
                <span className="w-2 h-2.5 rounded-xs bg-emerald-500" />
                <span className="w-2 h-2.5 rounded-xs bg-emerald-500" />
                <span className="w-2 h-2.5 rounded-xs bg-rose-500" />
              </div>
            </div>
          </div>

          {/* Right Logo & Window Controls */}
          <div className="flex items-center gap-3">
            {/* Authentic BOOKMAP Logo in Cyan with Stripes */}
            <div className="flex items-center gap-1.5 font-black tracking-wider text-xs font-mono text-cyan-400">
              <div className="flex flex-col gap-0.5">
                <span className="w-3.5 h-0.5 bg-cyan-400" />
                <span className="w-3.5 h-0.5 bg-cyan-400" />
                <span className="w-3.5 h-0.5 bg-cyan-400" />
              </div>
              <span className="text-white">BOOKMAP</span>
              <span className="bg-cyan-500 text-slate-950 px-1 py-0.2 rounded text-[9px] font-black">PRO</span>
            </div>

            <button
              onClick={handleTakeSnapshot}
              title="Save Chart Screenshot"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSoundEnabled((s) => !s)}
              title="Audio Ping"
              className={`p-1 rounded ${soundEnabled ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white'}`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsFullscreen((f) => !f)}
              title="Fullscreen"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── SUB-HEADER: AUTHENTIC BOOKMAP TABS STRIP (PHOTOS 1 & 2) ── */}
        <div className="flex items-center justify-between bg-[#0b1424] px-2 py-1 border-b border-[#142842] text-xs font-mono">
          {/* Contract Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {(Object.keys(CONTRACT_CONFIGS) as BookmapContract[]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveContract(c)}
                className={`px-3 py-1 rounded-t-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeContract === c
                    ? 'bg-[#07101e] text-cyan-300 border-t-2 border-cyan-400 shadow-md'
                    : 'bg-[#091526] text-slate-400 hover:text-slate-200 hover:bg-[#0d1e35]'
                }`}
              >
                <span>{c}</span>
                <span className="text-[10px] text-slate-500 hover:text-rose-400">×</span>
              </button>
            ))}
            <button className="px-2 py-1 rounded bg-[#091526] hover:bg-[#0d1e35] text-slate-400 hover:text-white font-bold">
              +
            </button>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center gap-1 bg-[#060c18] p-0.5 rounded-md border border-slate-800 text-[11px]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 rounded transition font-bold ${
                  activeTimeframe === tf
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* ── LIVE HUD BAR: PRICE TICKER & CURRENT SQUEEZE ALERTS ── */}
        <div className="flex flex-wrap items-center justify-between bg-[#081224] px-3.5 py-1.5 border-b border-[#142842] text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm">{config.displayName}</span>
            <span className="text-base font-black text-cyan-300">
              ${livePrice.toFixed(config.decimals)}
            </span>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 border-l border-slate-800 pl-3">
              <span>BID: <b className="text-emerald-400">${bestBid.toFixed(config.decimals)}</b></span>
              <span>ASK: <b className="text-rose-400">${bestAsk.toFixed(config.decimals)}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>OVERHEAD WALL:</span>
              <b className="text-white">${(livePrice * (1 + config.liquidityWalls[0].priceOffsetPct)).toFixed(config.decimals)} (${config.liquidityWalls[0].volumeM}M)</b>
            </span>

            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <span>BID FLOOR:</span>
              <b className="text-white">${(livePrice * (1 + config.liquidityWalls[config.liquidityWalls.length - 1].priceOffsetPct)).toFixed(config.decimals)} (${config.liquidityWalls[config.liquidityWalls.length - 1].volumeM}M)</b>
            </span>

            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                isPlaying ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isPlaying ? 'PAUSE' : 'RESUME'}
            </button>
          </div>
        </div>

        {/* ── MAIN WORKSPACE: CANVAS VIEWPORT & TOOLBAR ── */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Vertical Toolstrip */}
          <aside className="w-9 shrink-0 bg-[#060c18] border-r border-[#142842] flex flex-col items-center py-2 gap-2 text-slate-400 z-10 select-none shadow-lg">
            <button
              onClick={() => setActiveTool('PAN')}
              title="Hand Tool: Drag chart up, down, left, right"
              className={`p-1.5 rounded transition ${activeTool === 'PAN' ? 'bg-cyan-500/30 text-cyan-300 shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Hand className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('CROSSHAIR')}
              title="Crosshair Tool"
              className={`p-1.5 rounded transition ${activeTool === 'CROSSHAIR' ? 'bg-cyan-500/30 text-cyan-300 shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('TRENDLINE')}
              title="Trendline / Ray"
              className={`p-1.5 rounded transition ${activeTool === 'TRENDLINE' ? 'bg-cyan-500/30 text-cyan-300 shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('HORIZ_LINE')}
              title="Horizontal Liquidation Line"
              className={`p-1.5 rounded font-mono text-xs font-bold transition ${activeTool === 'HORIZ_LINE' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              ―
            </button>
            <button
              onClick={() => setActiveTool('PROFILE')}
              title="Volume Profile Bracket"
              className={`p-1.5 rounded transition ${activeTool === 'PROFILE' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" />
            </button>

            <div className="h-px w-5 bg-slate-800 my-1" />

            <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded hover:bg-slate-800 hover:text-white">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded hover:bg-slate-800 hover:text-white">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={handleResetZoom} title="Reset Zoom & Pan" className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-300">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </aside>

          {/* Canvas Chart Area */}
          <div ref={containerRef} className="relative flex-1 bg-[#07101e] overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              onDoubleClick={handleResetZoom}
              className={`absolute inset-0 block w-full h-full ${activeTool === 'PAN' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
            />

            {/* Quick Interactive Prompt */}
            <div className="absolute top-3 right-52 z-20 hidden md:flex items-center gap-2 bg-[#091528]/85 border border-slate-700/60 px-3 py-1 rounded-full text-[10px] font-mono text-slate-300 backdrop-blur-md">
              <span>✋ Drag chart with mouse</span>
              <span>·</span>
              <span>🖱️ Wheel zoom</span>
              <span>·</span>
              <span>🎯 Hover any line to inspect liquidation</span>
            </div>

            {/* 🌟 INTERACTIVE LIQUIDATION & ORDER FLOW INSPECTOR TOOLTIP 🌟 */}
            {hoverInfo && hoverInfo.visible && (
              <div
                className="absolute pointer-events-none z-30 bg-[#071324]/95 border border-cyan-500/70 rounded-xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-xl text-xs font-mono text-slate-200"
                style={{
                  left: Math.min(hoverInfo.x + 16, (containerRef.current?.clientWidth || 800) - 280),
                  top: Math.max(12, Math.min(hoverInfo.y - 45, (containerRef.current?.clientHeight || 600) - 170))
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 mb-1.5 text-cyan-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {hoverInfo.timeStr}
                  </span>
                  <span className="text-white font-black text-sm">${hoverInfo.price.toFixed(config.decimals)}</span>
                </div>

                {hoverInfo.nearestWall ? (
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Liquidation Level:</span>
                      <span className={`font-black ${
                        hoverInfo.nearestWall.category === 'RED'
                          ? 'text-rose-400'
                          : hoverInfo.nearestWall.category === 'ORANGE'
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                      }`}>
                        {hoverInfo.nearestWall.category === 'RED' ? '🔴 RED LINE (MAX LIQ)' : hoverInfo.nearestWall.category === 'ORANGE' ? '🟠 ORANGE LINE (HIGH LIQ)' : '🟡 YELLOW LINE (WALL)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Liquidation Pool:</span>
                      <span className="font-extrabold text-white text-xs">
                        ${hoverInfo.nearestWall.volumeM}M ({hoverInfo.nearestWall.side} LIQ)
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Cluster Zone:</span>
                      <span className="text-amber-300 font-bold">{hoverInfo.nearestWall.label}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Leverage Bracket:</span>
                      <span className="text-cyan-300 font-bold">{hoverInfo.nearestWall.leverageBracket} Leverage Trap</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 mt-1 text-[10px]">
                      <span className="text-slate-400">Distance from Spot:</span>
                      <span className="font-bold text-white">
                        {hoverInfo.nearestWall.distPct >= 0 ? '+' : ''}{hoverInfo.nearestWall.distPct}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Resting Depth:</span>
                      <span className="text-amber-300 font-bold">~{hoverInfo.depthSize} {config.baseUnit}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Order Flow Delta:</span>
                      <span className="font-bold text-slate-200">{hoverInfo.volStr}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 mt-1 text-[10px]">
                      <span className="text-slate-400">Dist to Spot:</span>
                      <span className="font-bold text-white">
                        {Math.abs(hoverInfo.price - livePrice).toFixed(config.decimals)} ({((Math.abs(hoverInfo.price - livePrice) / livePrice) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER STATUS BAR (PHOTOS 1 & 2) ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-[#060c18] px-3.5 py-1.5 border-t border-[#142842] text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {wsConnected ? 'FEED CONNECTED' : 'SIMULATED FEED'} ({latencyMs}ms)
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              TIMEFRAME: <b className="text-cyan-400">{activeTimeframe.toUpperCase()}</b> · ZOOM: <b className="text-cyan-400">{priceZoom.toFixed(1)}x</b>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 font-bold">
              PAN: {panOffsetY >= 0 ? `+${panOffsetY.toFixed(1)}` : panOffsetY.toFixed(1)} pts
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>DATA: LIVE</span>
            <span>·</span>
            <span>TRADING: SIMULATED</span>
            <span>·</span>
            <span className="text-cyan-400 font-bold">1:1 BOOKMAP PRO</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. MARKET HIGH LIQUIDATION AREA SCANNER & COLOR GUIDE               */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-4 shadow-xl space-y-4">
        {/* Header & Explanation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-rose-400 fill-rose-400/20" />
              <h2 className="text-base sm:text-lg font-black text-white font-mono">
                Market High Liquidation Area Scanner (Red, Orange, Yellow & Blue Lines)
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Bookmap heatmap ke andar har color ka exact matlab aur market maker execution logic niche detailed hai. Kisi bhi level par click karke chart ko wahan snap karein:
            </p>
          </div>

          {/* Color Legend Quick Pills */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              🔴 RED LINE: Extreme Liquidation Wall
            </span>
            <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold">
              🟠 ORANGE LINE: High Stop-Hunt Pool
            </span>
            <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold">
              🟡 YELLOW LINE: Resting Limit Wall
            </span>
            <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              🔵 BLUE LINE: Standard Depth
            </span>
          </div>
        </div>

        {/* High Liquidation Shelves Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                <th className="py-2.5 px-3">Color / Tier</th>
                <th className="py-2.5 px-3">Price Level</th>
                <th className="py-2.5 px-3">Liquidation Pool</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Leverage Bracket</th>
                <th className="py-2.5 px-3">Institutional Strategy</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {config.liquidityWalls.map((wall) => {
                const wallPrice = livePrice * (1 + wall.priceOffsetPct);
                const distPct = wall.priceOffsetPct * 100;
                return (
                  <tr
                    key={wall.id}
                    className={`hover:bg-slate-900/60 transition ${
                      focusedWallId === wall.id ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black ${
                          wall.category === 'RED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : wall.category === 'ORANGE'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : wall.category === 'YELLOW'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                            : wall.category === 'WHITE'
                            ? 'bg-white/20 text-slate-100 border border-white/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {wall.category === 'RED' && '🔴 RED'}
                        {wall.category === 'ORANGE' && '🟠 ORANGE'}
                        {wall.category === 'YELLOW' && '🟡 YELLOW'}
                        {wall.category === 'WHITE' && '⚪ WHITE'}
                        {wall.category === 'CYAN' && '🔵 CYAN'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                      ${wallPrice.toFixed(config.decimals)}
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({distPct >= 0 ? '+' : ''}{distPct.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-amber-300 whitespace-nowrap">
                      ${wall.volumeM}M
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`font-bold ${wall.side === 'SHORT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {wall.side} LIQ
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-300 whitespace-nowrap">
                      {wall.leverageBracket} Trap
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs sm:max-w-md truncate font-sans">
                      {wall.institutionalNote}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleFocusWall(wall)}
                        className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[11px] font-bold border border-cyan-500/40 transition shadow-sm"
                      >
                        Focus Level
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookmapLiquidationTerminalView;
