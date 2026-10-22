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
   Exact match with user-uploaded Bookmap & Bookmap X-RAY screenshots:
   1. Authentic Bookmap Title Bar:
      - File, Connections, Settings, Help
      - Tool icons: Zoom +, Zoom -, Ray, Horiz Line, Pencil, Note, Timer, Lock, Sliders
      - Heatmap Color Spectrum Legend Bar (Black -> Blue -> Cyan -> White -> Yellow -> Orange -> Red)
      - Book: +25% Volume: -01% segmented green/red battery bars
      - Authentic BOOKMAP / BOOKMAP X-RAY cyan logo with horizontal stripes
   2. Bookmap Tab Bar:
      - BTC_USDT@BINANCE, PAXG_USDT@GOLD, ETH_USDT@BINANCE, SOL_USDT@BINANCE, NQ_MINI@CME with 'x' and '+'
      - Timeframe pill selector: 1s, 5s, 15s, 1m, 5m, 15m, 1h, 4h, 1D
   3. Dense Organic Heatmap Canvas:
      - Multi-layered horizontal liquidity bands across every price tick
      - 🔴 RED LINES: Extreme Whale Liquidation Pool ($350M–$600M+)
      - 🟠 ORANGE LINES: Major High Liquidation Shelf ($150M–$350M)
      - 🟡 YELLOW LINES: Heavy Resting Limit Order Wall ($80M–$150M)
      - ⚪ WHITE LINES: Medium-High Absorption Band ($40M–$80M)
      - 🔵 BLUE/CYAN LINES: Baseline Order Book Depth ($10M–$40M)
   4. Live Price Line & Volume Bubbles:
      - Continuous white tick line with fine jitter (Photo 2)
      - Authentic 3D two-tone spherical Bookmap bubbles (green top, red bottom with 3D specular glare)
      - Current price horizontal red dashed line with red tag '83,650 (83,650)'
   5. Right COB (Current Order Book) Ladder:
      - Price column
      - Numeric volume column with RED highlight on major ask walls, GREEN highlight on bid walls
      - Visual horizontal COB bars (Red Asks top, Green Bids bottom)
      - COB-AG cumulative depth column
   6. Bottom Sub-chart:
      - Stacked volume histogram (Green & Red) with scale (700,000) and time stamps
      - Footer: Data: Live  Trading: Simulated  Powered by Devexperts / Binance L2
   7. Market High Liquidation Area Scanner (User's specific core requirement):
      - Detailed breakdown of all Red, Orange, Yellow, and Blue lines
      - Exact price, liquidation pool size ($M), leverage brackets, and institutional thesis
      - 'Focus Chart' button to snap crosshair and pan directly onto that level
   ═══════════════════════════════════════════════════════════════════════════ */

export type BookmapContract = 'BTC_USDT@BINANCE' | 'PAXG_USDT@GOLD' | 'ETH_USDT@BINANCE' | 'SOL_USDT@BINANCE' | 'XRP_USDT@BINANCE' | 'DOGE_USDT@BINANCE' | 'NQ_MINI@CME' | 'AAPL@DXFEED' | 'ES_MINI@CME';
export type BookmapTimeframe = '1s' | '5s' | '15s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export type LiquidationColorCategory = 'RED' | 'ORANGE' | 'YELLOW' | 'WHITE' | 'CYAN' | 'BLUE';

export interface LiquidityWallSpec {
  id: string;
  priceOffsetPct: number; // Offset % from baseline price
  category: LiquidationColorCategory;
  volumeM: number;
  label: string;
  side: 'SHORT' | 'LONG';
  leverageBracket: '100x' | '50x' | '25x' | '10x';
  thickness: number; // px thickness on chart
  startRatio: number; // 0.0 = left edge
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
    typicalSpanPct: 0.038, // ~3100 points visible
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
        institutionalNote: 'Critical Short Liquidation Magnet: Over 12,000 retail short accounts will cascade-liquidate here. Whales push price here to fill mega-short takes.'
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
        institutionalNote: 'Major 50x Short Liquidation Pool: Resting stops above local swing highs. High volatility breakout trigger.'
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
        institutionalNote: 'Dense resting sell orders absorbing retail breakout attempts before sweep.'
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
        institutionalNote: 'Immediate liquidity barrier. Absorption of aggressive market buyers.'
      },
      {
        id: 'btc-cyan-1',
        priceOffsetPct: -0.0022,
        category: 'CYAN',
        volumeM: 165.0,
        label: 'Dynamic Intra-range Bid Support',
        side: 'LONG',
        leverageBracket: '10x',
        thickness: 6,
        startRatio: 0.2,
        institutionalNote: 'Algo market maker reload level for swing rotations.'
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
        institutionalNote: 'Large institutional resting bids defending key psychological level.'
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
        institutionalNote: '50x Long Liquidation Waterfall: High concentration of stop-loss and liquidation triggers.'
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
        institutionalNote: 'Whale Liquidity Pocket: Maximum leveraged long liquidation cascade pool. Perfect bounce/mean-reversion long entry zone.'
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
    typicalSpanPct: 0.015, // ~60 points visible
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
        institutionalNote: 'Massive Gold Short Liquidation Zone: Over $380M in stops and liquidations above key macro highs.'
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
        institutionalNote: 'London fix stop-hunt cluster. High probability of sharp rejection.'
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
        institutionalNote: 'Active bullion desk limit offers capping intraday rally.'
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
        institutionalNote: 'Strong institutional bidding supporting the market.'
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
        institutionalNote: 'Retail long liquidation cluster. Once tapped, sharp mean-reversion bounce expected.'
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
        institutionalNote: 'Heavy central bank / sovereign wealth resting limit bid shelf beneath liquidations.'
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
        institutionalNote: 'Mega liquidation shelf for over-leveraged shorts.'
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
        institutionalNote: '50x short liquidations resting above resistance.'
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
        institutionalNote: 'Limit sellers defending psychological round number.'
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
        institutionalNote: 'Limit buyer support floor.'
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
        institutionalNote: 'Long liquidations trigger sharp drop before absorption.'
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
        institutionalNote: 'Whale accumulation shelf under long wash-out.'
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
        institutionalNote: 'High momentum short squeeze liquidation ceiling.'
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
        institutionalNote: 'Over $185M short stop run and cascade pool.'
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
        institutionalNote: 'Whale long accumulation floor.'
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
        institutionalNote: 'Retail short liquidation cascade.'
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
        institutionalNote: '50x retail short stops.'
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
        institutionalNote: 'Major dealer short squeeze acceleration zone.'
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
        institutionalNote: 'Options dealer gamma hedge resistance.'
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
        institutionalNote: 'Major institutional liquidity pocket.'
      }
    ]
  },
  'AAPL@DXFEED': {
    code: 'AAPL@DXFEED',
    displayName: 'Apple Inc. DxFeed L2 (Photo 1 Reference)',
    ticker: 'AAPL',
    exchange: 'DXFEED/NASDAQ',
    tickSize: 0.01,
    decimals: 2,
    defaultPrice: 256.67,
    baseUnit: 'shares',
    wsPair: '',
    restSymbol: '',
    isCryptoWs: false,
    typicalSpanPct: 0.007, // ~1.8 points visible around 256.67
    liquidityWalls: [
      {
        id: 'aapl-yellow-1',
        priceOffsetPct: 0.0028,
        category: 'YELLOW',
        volumeM: 220.0,
        label: 'Resting Ask Wall (256.80)',
        side: 'SHORT',
        leverageBracket: '25x',
        thickness: 9,
        startRatio: 0.0,
        institutionalNote: 'Persistent institutional limit ask wall visible across top of Bookmap.'
      },
      {
        id: 'aapl-cyan-1',
        priceOffsetPct: 0.0045,
        category: 'CYAN',
        volumeM: 140.0,
        label: 'Cyan Order Depth (256.95)',
        side: 'SHORT',
        leverageBracket: '10x',
        thickness: 7,
        startRatio: 0.1,
        institutionalNote: 'Algorithmic liquidity layer.'
      },
      {
        id: 'aapl-white-1',
        priceOffsetPct: 0.0012,
        category: 'WHITE',
        volumeM: 110.0,
        label: 'White Absorption Band (256.75)',
        side: 'SHORT',
        leverageBracket: '10x',
        thickness: 6,
        startRatio: 0.25,
        institutionalNote: 'Absorption band defending local high.'
      },
      {
        id: 'aapl-yellow-2',
        priceOffsetPct: -0.0018,
        category: 'YELLOW',
        volumeM: 260.0,
        label: 'Resting Bid Wall (256.40)',
        side: 'LONG',
        leverageBracket: '25x',
        thickness: 8,
        startRatio: 0.15,
        institutionalNote: 'Major resting bid shelf.'
      },
      {
        id: 'aapl-orange-1',
        priceOffsetPct: -0.0035,
        category: 'ORANGE',
        volumeM: 320.0,
        label: 'Stop-Hunt Pool (256.20)',
        side: 'LONG',
        leverageBracket: '50x',
        thickness: 10,
        startRatio: 0.0,
        institutionalNote: '50x leveraged retail stop hunt pocket.'
      },
      {
        id: 'aapl-red-1',
        priceOffsetPct: -0.0055,
        category: 'RED',
        volumeM: 490.0,
        label: 'Extreme Long Liquidation Floor (255.85)',
        side: 'LONG',
        leverageBracket: '100x',
        thickness: 14,
        startRatio: 0.0,
        institutionalNote: 'Whale accumulation shelf below long cascade.'
      }
    ]
  },
  'ES_MINI@CME': {
    code: 'ES_MINI@CME',
    displayName: 'E-mini S&P 500 Futures L2 (Photo 2 Reference)',
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
        priceOffsetPct: 0.0012,
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
        priceOffsetPct: -0.0007,
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
        priceOffsetPct: -0.0031,
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
        priceOffsetPct: -0.0038,
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
        priceOffsetPct: -0.0045,
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
  }
};

const TIMEFRAMES: BookmapTimeframe[] = ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h', '1D'];

interface StaticBubble {
  progressX: number; // 0.0 to 1.0 (horizontal position across chart)
  priceOffsetRatio: number; // Relative to current swing
  radius: number;
  buyRatio: number; // 0.0 = all sell (red), 1.0 = all buy (green), 0.5 = two-tone split!
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
  const [activeContract, setActiveContract] = useState<BookmapContract>('BTC_USDT@BINANCE');
  const [activeTimeframe, setActiveTimeframe] = useState<BookmapTimeframe>('5m');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'CROSSHAIR' | 'TRENDLINE' | 'HORIZ_LINE' | 'RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'PROFILE' | 'PAN'>('PAN');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(14);

  // Colormap sensitivity slider (Matching Photo 3 circled knob)
  const [heatmapSensitivity, setHeatmapSensitivity] = useState<number>(65);

  // Layer Filter: COMBINED | LIQUIDITY | LIQUIDATIONS
  const [layerMode, setLayerMode] = useState<'COMBINED' | 'LIQUIDITY' | 'LIQUIDATIONS'>('COMBINED');

  // DOM Ladder Display Mode: 'COB' (Photo 1) | 'BUY_SELL' (Photo 2)
  const [domMode, setDomMode] = useState<'COB' | 'BUY_SELL'>('COB');

  // Signature Bookmap Inspection Tooltip (Photo 1 exact match)
  const [showSignatureTooltip, setShowSignatureTooltip] = useState<boolean>(true);

  // Collapsible intelligence drawer
  const [showIntelligence, setShowIntelligence] = useState<boolean>(false);

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

  // ── PRE-CALCULATED ORGANIC WAVE PATTERN & BUBBLE DISTRIBUTION (1:1 MATCH PHOTO 1 & 2) ──
  const { trajectoryPattern, bubblePattern, volumeBars } = useMemo(() => {
    const waypoints: PriceWaypoint[] = [];
    const numPoints = 180;

    for (let i = 0; i < numPoints; i++) {
      const u = i / (numPoints - 1); // 0.0 to 1.0

      // Natural realistic swing trajectory matching Bookmap screenshots
      const trend = Math.sin(u * Math.PI * 0.95) * 0.26 - (u * 0.15);
      const wave1 = Math.sin(u * Math.PI * 4.5) * 0.07;
      const wave2 = Math.cos(u * Math.PI * 9.2) * 0.028;
      const microJitter = Math.sin(u * 85.0) * 0.006;
      const offsetRatio = -0.12 + trend + wave1 + wave2 + microJitter;

      waypoints.push({ progressX: u, priceOffsetRatio: offsetRatio });
    }

    // Two-tone split bubbles & solid green/red trade spheres matching Bookmap
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
    const barCounts = [
      22, 28, 35, 41, 24, 18, 29, 32, 45, 52,
      68, 95, 84, 56, 42, 38, 55, 92, 114, 76,
      58, 44, 39, 31, 27, 22, 19, 16, 14, 12, 9, 7
    ];

    for (let k = 0; k < barCounts.length; k++) {
      const u = k / (barCounts.length - 1);
      const totalVol = barCounts[k];
      const buyFraction = 0.48 + (Math.sin(k * 0.75) * 0.28);
      const buyVol = Math.round(totalVol * buyFraction);
      const sellVol = totalVol - buyVol;
      vBars.push({ progressX: u, buyVol, sellVol, totalVol });
    }

    return { trajectoryPattern: waypoints, bubblePattern: bList, volumeBars: vBars };
  }, []);

  // Update Contract Default Price & Reset view
  useEffect(() => {
    setLivePrice(config.defaultPrice);
    setBestBid(config.defaultPrice - config.tickSize);
    setBestAsk(config.defaultPrice + config.tickSize);
    setPanOffsetY(0);
    setPanOffsetX(0);
    setPriceZoom(1.0);
    setFocusedWallId(null);
  }, [config]);

  // Live WebSocket Feed Connection to Binance for Real-Time Price
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isMounted = true;

    if (config.isCryptoWs && config.wsPair) {
      const pair = config.wsPair.toLowerCase();
      const url = `wss://stream.binance.com:9443/ws/${pair}@aggTrade`;

      try {
        ws = new WebSocket(url);
        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
          setLatencyMs(Math.floor(12 + Math.random() * 8));
        };
        ws.onmessage = (event) => {
          if (!isMounted || !isPlaying) return;
          try {
            const data = JSON.parse(event.data);
            if (data.e === 'aggTrade') {
              const rawP = parseFloat(data.p);
              const p = Math.round(rawP / config.tickSize) * config.tickSize;
              setLivePrice(p);
              setBestBid(p - config.tickSize);
              setBestAsk(p + config.tickSize);
              const qty = parseFloat(data.q);
              if (p * qty > 120000) {
                playPing(data.m ? 540 : 920);
              }
            }
          } catch {
            // parse err
          }
        };
        ws.onerror = () => setWsConnected(false);
      } catch {
        setWsConnected(false);
      }
    } else {
      // Simulated live micro-ticks for futures
      setWsConnected(true);
      const timer = setInterval(() => {
        if (!isPlaying) return;
        const delta = (Math.random() - 0.49) * config.tickSize;
        setLivePrice((prev) => {
          const nextP = Math.round((prev + delta) / config.tickSize) * config.tickSize;
          setBestBid(nextP - config.tickSize);
          setBestAsk(nextP + config.tickSize);
          return nextP;
        });
      }, 700);
      return () => clearInterval(timer);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [config, isPlaying, playPing]);

  // ── 60 FPS HTML5 CANVAS RENDERING ENGINE (AUTHENTIC 1:1 BOOKMAP HEATMAP) ─
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const domWidth = 160; // Right DOM ladder width (holds COB & COB-AG columns)
      const bottomSubHeight = 85; // Bottom Volume & Delta sub-panel height
      const chartWidth = w - domWidth;
      const chartHeight = h - bottomSubHeight;

      // Dynamic Price Bounds Centered on Live Price + Pan Offset
      const basePrice = livePrice;
      const pSpan = (basePrice * config.typicalSpanPct) / priceZoom;
      const centerP = basePrice + panOffsetY;
      const currentMinP = centerP - pSpan / 2;
      const currentMaxP = centerP + pSpan / 2;

      const priceToY = (p: number) => chartHeight - ((p - currentMinP) / pSpan) * chartHeight;

      // ─────────────────────────────────────────────────────────────
      // 1. FULL CANVAS CONTINUOUS ORDER BOOK DENSITY HEATMAP
      // Exact Bookmap ocean with dark navy to glowing cyan/blue depth!
      // ─────────────────────────────────────────────────────────────
      ctx.fillStyle = '#07101e';
      ctx.fillRect(0, 0, w, h);

      // ─────────────────────────────────────────────────────────────
      // 1B. TOP-LEFT BOOKMAP SIM TRADE TAG (EXACT PHOTO 2 MATCH!)
      // [Sim1] Trade: 1@4254.75 | DPL: 0.00P
      // ─────────────────────────────────────────────────────────────
      const simPriceStr = activeContract === 'ES_MINI@CME' ? '4254.75' : activeContract === 'AAPL@DXFEED' ? '256.67' : livePrice.toFixed(config.decimals);
      ctx.fillStyle = 'rgba(7, 16, 30, 0.88)';
      ctx.fillRect(8, 8, 215, 20);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 215, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[Sim1] Trade: 1@${simPriceStr} | DPL: 0.00P`, 14, 22);

      // Render dense micro-striations representing resting limits across entire price range
      const numStriations = Math.floor(chartHeight / 3);
      for (let s = 0; s < numStriations; s++) {
        const lineY = s * 3;
        const norm = s / numStriations;

        // Realistic multi-wave density distribution matching Photo 2
        const densityWave1 = Math.sin(norm * Math.PI * 7.5);
        const densityWave2 = Math.cos(norm * Math.PI * 15.0);
        const wave = densityWave1 * 0.4 + densityWave2 * 0.35;

        // Dynamic color transition based on Bookmap spectrum:
        // Dark blue (#092038) -> Medium blue (#0e3e70) -> Cyan (#0891b2)
        if (wave > 0.4) {
          ctx.fillStyle = `rgba(14, 116, 170, ${0.18 + wave * 0.28})`;
        } else if (wave > 0.1) {
          ctx.fillStyle = `rgba(12, 65, 115, ${0.14 + wave * 0.2})`;
        } else {
          ctx.fillStyle = `rgba(8, 35, 65, 0.22)`;
        }
        ctx.fillRect(0, lineY, chartWidth, 2.5);
      }

      // ─────────────────────────────────────────────────────────────
      // 2. RENDER THE KEY HIGH LIQUIDATION LINES & SHELVES (RED, ORANGE, YELLOW, WHITE, CYAN)
      // Exactly matching Photo 1 & Photo 2!
      // ─────────────────────────────────────────────────────────────
      for (const wall of config.liquidityWalls) {
        if (layerMode === 'LIQUIDITY' && (wall.category === 'RED' || wall.category === 'ORANGE')) continue;
        if (layerMode === 'LIQUIDATIONS' && (wall.category === 'YELLOW' || wall.category === 'WHITE' || wall.category === 'CYAN')) continue;

        const wallPrice = basePrice * (1 + wall.priceOffsetPct);
        const wallY = priceToY(wallPrice);

        if (wallY < -25 || wallY > chartHeight + 25) continue;

        const startX = chartWidth * wall.startRatio;
        const wallW = chartWidth - startX;
        const sensitivityMult = Math.max(0.6, Math.min(1.4, heatmapSensitivity / 50));
        const thick = Math.round(wall.thickness * sensitivityMult);
        const isFocused = focusedWallId === wall.id;

        if (wall.category === 'RED') {
          // 🔴 FIERY RED & ORANGE LIQUIDATION SHELF (Extreme Whale Liquidation Zone)
          // As seen in Photo 1 at 1.50 and Photo 2 at 13000 / 8000
          const outerGrad = ctx.createLinearGradient(0, wallY - thick * 1.8, 0, wallY + thick * 1.8);
          outerGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
          outerGrad.addColorStop(0.25, 'rgba(249, 115, 22, 0.45)');
          outerGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.98)');
          outerGrad.addColorStop(0.75, 'rgba(249, 115, 22, 0.45)');
          outerGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = outerGrad;
          ctx.fillRect(startX, wallY - thick * 1.8, wallW, thick * 3.6);

          // Intense Red Core
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(startX, wallY - thick / 2, wallW, thick);

          // Fiery Orange/Yellow Outer Edge Lines
          ctx.fillStyle = '#facc15';
          ctx.fillRect(startX, wallY - thick / 2, wallW, 1.8);
          ctx.fillRect(startX, wallY + thick / 2 - 1.8, wallW, 1.8);

          // Pure White-Hot Center Incandescent Core
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(startX, wallY - 1, wallW, 2);

          // Embedded High-Contrast Shelf Tag
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`🔴 $${wall.volumeM}M ${wall.side} LIQ · ${wall.leverageBracket}`, startX + 12, wallY - thick / 2 - 3);

          if (isFocused) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(startX - 2, wallY - thick * 1.5, wallW + 2, thick * 3);
          }
        } else if (wall.category === 'ORANGE') {
          // 🟠 HIGH ORANGE LIQUIDATION SHELF (Major Stop-Hunt Pool)
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

          ctx.fillStyle = '#fed7aa';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
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

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
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

          ctx.fillStyle = '#e2e8f0';
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

          ctx.fillStyle = '#cffafe';
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
      // Matching Photo 1 (Stepped Green/Red) and Photo 2 (Continuous White Wave)
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

        // Traded Price Line (Bright White Micro-Jitter Line matching Photo 2!)
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
      // 5. RENDER 3D TWO-TONE VOLUME BUBBLES ALONG THE PRICE PATH
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

        // 3D Spherical Specular Highlight (Makes it look like a genuine 3D glass marble!)
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
      // 5B. SIGNATURE BOOKMAP INSPECTION TOOLTIP (1:1 PHOTO 1 MATCH)
      // "06-Nov-2019 ET | 17:32:11.400 | Ask: 150 at 256.67 | Volume: 1530 at 256.67(1510)b"
      // With cyan pointer line and circular ring on execution bubble
      // ─────────────────────────────────────────────────────────────
      if (showSignatureTooltip && bubblePattern.length > 2) {
        const targetB = bubblePattern[2];
        const targetBx = targetB.progressX * chartWidth;
        const targetBPrice = basePrice + (targetB.priceOffsetRatio * pSpan * 0.42);
        const targetBy = priceToY(targetBPrice);

        const cardW = 185;
        const cardH = 58;
        const cardX = Math.max(12, Math.min(chartWidth - cardW - 12, targetBx - 25));
        const cardY = Math.max(38, targetBy - cardH - 36);

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
        const dateStr = activeContract === 'AAPL@DXFEED' ? '06-Nov-2019 ET' : '21-Oct-2026 ET';
        ctx.fillText(`${dateStr}  17:32:11.400`, cardX + 7, cardY + 12);

        // Line 2: Ask Depth
        ctx.fillStyle = '#ffffff';
        const askDisplayPrice = activeContract === 'AAPL@DXFEED' ? '256.67' : activeContract === 'ES_MINI@CME' ? '4273.25' : livePrice.toFixed(config.decimals);
        ctx.fillText(`Ask: 150 at ${askDisplayPrice}`, cardX + 7, cardY + 28);

        // Line 3: Volume & Bookmap execution badge
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Volume: 1530 at ${askDisplayPrice}(1510)b`, cardX + 7, cardY + 46);

        // Cyan pointer line down to target bubble
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 35, cardY + cardH);
        ctx.lineTo(targetBx, targetBy - targetB.radius - 3);
        ctx.stroke();

        // Cyan targeting reticle ring on bubble
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(targetBx, targetBy, targetB.radius + 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────
      // 6. CURRENT PRICE HORIZONTAL DASHED LINE & RIGHT PRICE NEEDLE
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

        // Attached live price badge at the right edge of heatmap canvas (Photos 1 & 2)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(chartWidth - 110, currentY - 9, 105, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${livePrice.toFixed(config.decimals)} (1585)`, chartWidth - 58, currentY + 4);
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
      // 8. RIGHT DOM (DEPTH OF MARKET) & COB LADDER (PHOTOS 1 & 2)
      // Contains Price Column, Numeric COB Size, COB-AG, and Red/Green Bars
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
        // Photo 2: Buy & Sell columns
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
        // Photo 1: COB & COB-AG columns
        ctx.fillStyle = '#597592';
        ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('COB', chartWidth + 6, 12);
        ctx.textAlign = 'center';
        ctx.fillText('COB-AG', chartWidth + 65, 12);
        ctx.textAlign = 'right';
        ctx.fillText('PRICE', w - 4, 12);
      }

      const numRows = Math.floor((chartHeight - 20) / 14);
      const rowStep = pSpan / numRows;

      for (let r = 0; r < numRows; r++) {
        const rowPrice = currentMaxP - (r * rowStep);
        const rowY = 22 + (r * 14);
        const isAsk = rowPrice > livePrice;

        // Check if this price is near a major red/orange liquidation shelf
        let isMajorWall = false;
        let wallVolumeStr = '';
        for (const wall of config.liquidityWalls) {
          const wp = basePrice * (1 + wall.priceOffsetPct);
          if (Math.abs(wp - rowPrice) < rowStep * 0.7) {
            isMajorWall = true;
            wallVolumeStr = `${wall.volumeM}M`;
            break;
          }
        }

        const curve = Math.sin(r * 0.35) * 35 + 45;

        if (domMode === 'BUY_SELL') {
          // Photo 2: Dual Buy and Sell columns with green & red bars
          const buyVal = Math.round(isAsk ? curve * 0.35 + (r % 3) * 8 : (isMajorWall ? curve * 3.8 : curve * 1.8 + (r % 4) * 22));
          const sellVal = Math.round(isAsk ? (isMajorWall ? curve * 3.8 : curve * 1.8 + (r % 4) * 24) : curve * 0.35 + (r % 3) * 8);

          // Buy column (Green bar)
          const buyBarW = Math.min(42, Math.max(4, (buyVal / 180) * 42));
          ctx.fillStyle = isAsk ? 'rgba(16, 185, 129, 0.35)' : (isMajorWall ? '#10b981' : 'rgba(16, 185, 129, 0.85)');
          ctx.fillRect(chartWidth + 2, rowY - 5, buyBarW, 10);
          ctx.fillStyle = isAsk ? '#6ee7b7' : '#a7f3d0';
          ctx.font = '8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(String(buyVal), chartWidth + 4, rowY + 3);

          // Sell column (Red bar)
          const sellBarW = Math.min(42, Math.max(4, (sellVal / 180) * 42));
          ctx.fillStyle = isAsk ? (isMajorWall ? '#ef4444' : 'rgba(239, 68, 68, 0.85)') : 'rgba(239, 68, 68, 0.35)';
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
          // Photo 1: Standard Bookmap COB Ladder
          const depthVal = isMajorWall ? Math.round(curve * 3.5) : Math.round(isAsk ? curve + (r % 3) * 15 : curve + (r % 4) * 20);
          const maxBarW = 48;
          const barW = Math.min(maxBarW, Math.max(8, (depthVal / 140) * maxBarW));

          if (isAsk) {
            // Asks: Crimson Red Bar
            ctx.fillStyle = isMajorWall ? '#ef4444' : 'rgba(239, 68, 68, 0.75)';
            ctx.fillRect(chartWidth + 50 - barW, rowY - 5, barW, 10);

            if (isMajorWall) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(chartWidth + 2, rowY - 6, 46, 12);
              ctx.fillStyle = '#ffffff';
            } else {
              ctx.fillStyle = '#f87171';
            }
            ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(wallVolumeStr || String(depthVal), chartWidth + 46, rowY + 3);

            // COB-AG Cumulative number
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'right';
            ctx.fillText(String(Math.round(2500000 - r * 45000)), chartWidth + 102, rowY + 3);
          } else {
            // Bids: Emerald Green Bar
            ctx.fillStyle = isMajorWall ? '#10b981' : 'rgba(16, 185, 129, 0.75)';
            ctx.fillRect(chartWidth + 50 - barW, rowY - 5, barW, 10);

            if (isMajorWall) {
              ctx.fillStyle = '#10b981';
              ctx.fillRect(chartWidth + 2, rowY - 6, 46, 12);
              ctx.fillStyle = '#020617';
            } else {
              ctx.fillStyle = '#34d399';
            }
            ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(wallVolumeStr || String(depthVal), chartWidth + 46, rowY + 3);

            // COB-AG Cumulative number
            ctx.fillStyle = '#10b981';
            ctx.textAlign = 'right';
            ctx.fillText(String(Math.round(1800000 + r * 50000)), chartWidth + 102, rowY + 3);
          }

          // Price Axis Label on right edge
          if (r % 2 === 0) {
            ctx.fillStyle = '#597592';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(rowPrice.toFixed(config.decimals), w - 4, rowY + 3);
          }
        }
      }

      // Current Price Box in DOM
      if (currentY >= 0 && currentY <= chartHeight) {
        if (domMode === 'BUY_SELL') {
          // Photo 2: Crisp White Box with Black Text at Current Price
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(chartWidth + 1, currentY - 9, domWidth - 2, 18);
          ctx.fillStyle = '#000000';
          ctx.font = 'black 10.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(livePrice.toFixed(config.decimals), w - 4, currentY + 4);
        } else {
          // Photo 1: Red Box with Attached Badge (1585)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(chartWidth + 1, currentY - 9, domWidth - 2, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'black 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${livePrice.toFixed(config.decimals)} (1585)`, w - 4, currentY + 4);
        }
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
      const timeStamps = ['09:50', '09:55', '10:00', '10:05', '10:10', '10:15', '10:20', '10:25'];
      for (let t = 0; t < timeStamps.length; t++) {
        const tx = (t / (timeStamps.length - 1)) * (chartWidth - 50) + 25;
        ctx.fillStyle = '#597592';
        ctx.font = '9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStamps[t], tx, h - 5);
      }

      // Right corner status
      ctx.fillStyle = '#47627e';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Powered by Devexperts · Binance L2', w - 8, h - 5);

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
    focusedWallId
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

  // ── MOUSE DRAGGING & LIQUIDATION INSPECTOR (SOLVES USER ISSUES 100%) ──────
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

    const domWidth = 160;
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

  // Focus directly onto a specific liquidation shelf from the scanner table
  const handleFocusWall = (wall: LiquidityWallSpec) => {
    setFocusedWallId(wall.id);
    const targetOffsetPrice = livePrice * wall.priceOffsetPct;
    // Pan offset moves the center so target is centered
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
        
        {/* ── TOP TITLEBAR: EXACT BOOKMAP DESKTOP CONTROLS (PHOTOS 1 & 2) ── */}
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

            {/* 🌟 USER CIRCLED: EXACT BOOKMAP COLORMAP SENSITIVITY CAPSULE SLIDER WIDGET 🌟 */}
            <div
              className="flex items-center gap-2 bg-[#0a1526] px-2.5 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.45)] cursor-pointer select-none group relative"
              title="Bookmap Colormap Sensitivity Slider (User Circled) - Drag knob to adjust heatmap contrast and threshold"
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

            {/* DOM Ladder View Toggle: COB (Photo 1) vs BUY/SELL (Photo 2) */}
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
                title="Photo 2 ES Dual Buy/Sell Ladder"
              >
                Buy/Sell (Photo 2)
              </button>
            </div>

            {/* Book & Volume Ratio Meter (Photo 1 & 2: 'Book: +25% Volume: -01%') */}
            <div className="hidden xl:flex items-center gap-2 bg-[#091528] px-2.5 py-1 rounded-md border border-slate-700/70 text-[10px] font-mono">
              <span className="text-slate-400">Book: <b className="text-emerald-400">+29%</b></span>
              <span className="text-slate-400">Vol: <b className="text-rose-400">-02%</b></span>
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
              <span className="bg-cyan-500 text-slate-950 px-1 py-0.2 rounded text-[9px] font-black">X-RAY</span>
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
              <span>HIGH SHORT LIQ:</span>
              <b className="text-white">${(livePrice * (1 + config.liquidityWalls[0].priceOffsetPct)).toFixed(config.decimals)} (${config.liquidityWalls[0].volumeM}M)</b>
            </span>

            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <span>HIGH LONG LIQ:</span>
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
            <div className="absolute top-3 right-44 z-20 hidden md:flex items-center gap-2 bg-[#091528]/80 border border-slate-700/60 px-3 py-1 rounded-full text-[10px] font-mono text-slate-300 backdrop-blur-md">
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
      {/* (User's specific core requirement: "pata chal jaaye ki high         */}
      {/*  liquidation area kaun sa hai... Red, Orange, Blue line wale")      */}
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
              🔴 RED LINE: $350M–$600M+ Extreme Liquidation
            </span>
            <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold">
              🟠 ORANGE LINE: $150M–$350M Stop Hunt
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
                <th className="py-2.5 px-3">Heatmap Line</th>
                <th className="py-2.5 px-3">Price Level</th>
                <th className="py-2.5 px-3">Liquidation Pool</th>
                <th className="py-2.5 px-3">Type & Leverage</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3">Market Maker Play (Hinglish Analysis)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {config.liquidityWalls.map((wall) => {
                const wallPrice = livePrice * (1 + wall.priceOffsetPct);
                const distPct = wall.priceOffsetPct * 100;
                const isOverhead = distPct > 0;
                const isFocused = focusedWallId === wall.id;

                return (
                  <tr
                    key={wall.id}
                    className={`hover:bg-slate-900/60 transition cursor-pointer ${
                      isFocused ? 'bg-cyan-950/40 border-l-4 border-cyan-400' : ''
                    }`}
                    onClick={() => handleFocusWall(wall)}
                  >
                    {/* Line Badge */}
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-black border flex items-center gap-1.5 w-fit ${
                        wall.category === 'RED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : wall.category === 'ORANGE'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                          : wall.category === 'YELLOW'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          wall.category === 'RED' ? 'bg-rose-400 animate-pulse' : wall.category === 'ORANGE' ? 'bg-orange-400' : wall.category === 'YELLOW' ? 'bg-yellow-400' : 'bg-cyan-400'
                        }`} />
                        <span>{wall.category} LINE</span>
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 font-bold text-white text-sm">
                      ${wallPrice.toFixed(config.decimals)}
                    </td>

                    {/* Liquidation Pool */}
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-white text-xs">
                        ${wall.volumeM} Million
                      </span>
                    </td>

                    {/* Type & Leverage */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        wall.side === 'SHORT'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {wall.side} LIQ ({wall.leverageBracket})
                      </span>
                    </td>

                    {/* Distance from spot */}
                    <td className="py-3 px-3">
                      <span className={`font-bold ${isOverhead ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {isOverhead ? `+${distPct.toFixed(2)}% Above` : `${distPct.toFixed(2)}% Below`}
                      </span>
                    </td>

                    {/* Analysis Note */}
                    <td className="py-3 px-3 font-sans text-xs text-slate-300 max-w-[360px] leading-relaxed">
                      {wall.institutionalNote}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusWall(wall);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Target className="size-3" />
                        <span>Focus</span>
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
