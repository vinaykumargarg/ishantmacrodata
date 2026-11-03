import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Settings,
  Pencil,
  Layers,
  ChevronDown,
  Camera,
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  Minus,
  Crosshair,
  Hand,
  Eye,
  Link,
  Flame,
  Activity,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Volume2,
  Radio,
  X
} from 'lucide-react';
import { sharedQuoteStore } from '../services/sharedQuoteStore';

/* ═══════════════════════════════════════════════════════════════════════════
   ATAS & BOOKMAP 1:1 LIQUIDITY HEATMAP & ORDER-BOOK INTELLIGENCE TERMINAL
   Exact Visual Parity with User Reference Photo (media_1793638601420_16457af5.jpg)
   - Deep near-black navy background (#050a18) with 1px horizontal blue depth rows
   - Blazing yellow / fiery orange / incandescent white laser liquidity bands
   - Red / Green translucent aggressive market order trade bubbles along stepped price line
   - Prominent wall annotations: "ASK WALL <price> | <size> | strength <n>" & "BID WALL..."
   - Right DOM histogram: thick red asks above, thick green bids below, price ladder
   - Bottom Volume pane with Buy/Sell split bars & Cumulative Delta (CVD) curve
   - Multi-Timeframe Selector: 1s, 1m, 5m, 15m, 1h, 4h, 1d (ALL TIMEFRAMES)
   - Full 2D interactive movement: Drag X (time) & Drag Y (price) to explore liquidity
   - Supported Assets: XAUUSD (Gold CME GC/MGC), BTCUSDT, ETHUSDT, SOLUSDT, SILVER (SI), OIL (WTI)
   - Dedicated Right Sidebar: Liquidity Zones, Events, Imbalance, Live Data telemetry
   ═══════════════════════════════════════════════════════════════════════════ */

export type HeatmapAssetKey = 'GOLD' | 'BTC' | 'ETH' | 'SOL' | 'SILVER' | 'OIL';
export type HeatmapTimeframe = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface RestingWall {
  id: string;
  absolutePrice?: number;
  priceOffset: number;
  sizeStr: string;
  volume: number;
  strength: number;
  ageMin: number;
  thickness: number;
  type: 'FIERY_WALL' | 'CYAN_SHELF' | 'MAJOR_CORE';
  label: string;
}

export interface AssetConfig {
  key: HeatmapAssetKey;
  symbol: string;
  name: string;
  contractCode: string;
  venue: string;
  feedType: 'REAL' | 'PROXY' | 'CME_FUTURES';
  tickSize: number;
  decimals: number;
  defaultPrice: number;
  typicalSpanPts: number;
  quoteKey: string;
  wsStream?: string;
  priceLadderStep: number;
  unit: string;
  restingWalls: RestingWall[];
}

const ASSET_REGISTRY: Record<HeatmapAssetKey, AssetConfig> = {
  GOLD: {
    key: 'GOLD',
    symbol: 'XAUUSD',
    name: 'Gold Futures (#GC Front Month / Micro MGC)',
    contractCode: '#GCZ6 / MGC',
    venue: 'CME COMEX & PAXG L2',
    feedType: 'CME_FUTURES',
    tickSize: 0.1,
    decimals: 2,
    defaultPrice: 4064.0,
    typicalSpanPts: 180,
    priceLadderStep: 20.0,
    quoteKey: 'XAUUSD',
    wsStream: 'paxgusdt@depth20@100ms',
    unit: 'oz',
    restingWalls: [
      { id: 'g-ask-top', priceOffset: 84.0, sizeStr: '160k oz', volume: 160, strength: 89, ageMin: 44, thickness: 16, type: 'MAJOR_CORE', label: 'ASK WALL 4,148.0 | 160k oz | strength 89' },
      { id: 'g-cyan-beam', priceOffset: 56.0, sizeStr: '88k oz', volume: 88, strength: 72, ageMin: 28, thickness: 8, type: 'CYAN_SHELF', label: '4,120.0 Cyan Order Depth' },
      { id: 'g-ask-mid', priceOffset: 12.0, sizeStr: '108k oz', volume: 108, strength: 84, ageMin: 18, thickness: 14, type: 'FIERY_WALL', label: 'ASK WALL 4,076.0 | 108k oz | strength 84' },
      { id: 'g-bid-mid', priceOffset: -46.0, sizeStr: '123k oz', volume: 123, strength: 81, ageMin: 32, thickness: 14, type: 'FIERY_WALL', label: 'BID WALL 4,018.0 | 123k oz | strength 81' },
      { id: 'g-bid-bot', priceOffset: -84.0, sizeStr: '146k oz', volume: 146, strength: 87, ageMin: 65, thickness: 16, type: 'MAJOR_CORE', label: 'BID WALL 3,980.0 | 146k oz | strength 87' }
    ]
  },
  BTC: {
    key: 'BTC',
    symbol: 'BTCUSDT',
    name: 'Bitcoin Spot & Perp (Binance L2 Depth)',
    contractCode: 'BTCUSDT',
    venue: 'Binance perp',
    feedType: 'REAL',
    tickSize: 1.0,
    decimals: 0,
    defaultPrice: 74181.0,
    typicalSpanPts: 1200,
    priceLadderStep: 100,
    quoteKey: 'BTCUSDT',
    wsStream: 'btcusdt@depth20@100ms',
    unit: 'BTC',
    restingWalls: [
      { id: 'btc-ask-wall-1', absolutePrice: 74610, priceOffset: 429, sizeStr: '420 BTC', volume: 420, strength: 86, ageMin: 20, thickness: 16, type: 'MAJOR_CORE', label: 'ASK WALL 74,610 | 420 BTC | strength 86 [estimated]' },
      { id: 'btc-cyan-1', absolutePrice: 74450, priceOffset: 269, sizeStr: '280 BTC', volume: 280, strength: 75, ageMin: 22, thickness: 8, type: 'CYAN_SHELF', label: '74,450 Cyan Resting Shelf' },
      { id: 'btc-ask-wall-2', absolutePrice: 74300, priceOffset: 119, sizeStr: '190 BTC', volume: 190, strength: 82, ageMin: 18, thickness: 12, type: 'FIERY_WALL', label: 'ASK WALL 74,300 | 190 BTC | strength 82' },
      { id: 'btc-bid-wall-1', absolutePrice: 74100, priceOffset: -81, sizeStr: '365 BTC', volume: 365, strength: 76, ageMin: 52, thickness: 14, type: 'FIERY_WALL', label: 'BID WALL 74,100 | 365 BTC | strength 76' },
      { id: 'btc-cyan-2', absolutePrice: 73950, priceOffset: -231, sizeStr: '210 BTC', volume: 210, strength: 71, ageMin: 34, thickness: 8, type: 'CYAN_SHELF', label: '73,950 Cyan Order Shelf' },
      { id: 'btc-bid-wall-2', absolutePrice: 73860, priceOffset: -321, sizeStr: '640 BTC', volume: 640, strength: 92, ageMin: 95, thickness: 18, type: 'MAJOR_CORE', label: 'BID WALL 73,860 | 640 BTC | strength 92' }
    ]
  },
  ETH: {
    key: 'ETH',
    symbol: 'ETHUSDT',
    name: 'Ethereum (Binance L2 Depth)',
    contractCode: 'ETH/USDT',
    venue: 'BINANCE L2',
    feedType: 'REAL',
    tickSize: 0.1,
    decimals: 2,
    defaultPrice: 2640.0,
    typicalSpanPts: 160,
    priceLadderStep: 25,
    quoteKey: 'ETHUSDT',
    wsStream: 'ethusdt@depth20@100ms',
    unit: 'ETH',
    restingWalls: [
      { id: 'eth-ask-1', priceOffset: 55, sizeStr: '4,200 ETH', volume: 420, strength: 85, ageMin: 36, thickness: 16, type: 'MAJOR_CORE', label: 'ASK WALL 2,695 | 4,200 ETH | strength 85' },
      { id: 'eth-cyan-1', priceOffset: 32, sizeStr: '1,800 ETH', volume: 180, strength: 71, ageMin: 19, thickness: 8, type: 'CYAN_SHELF', label: '2,672 Cyan Resting Band' },
      { id: 'eth-ask-2', priceOffset: 12, sizeStr: '2,900 ETH', volume: 290, strength: 79, ageMin: 27, thickness: 14, type: 'FIERY_WALL', label: 'ASK WALL 2,652 | 2,900 ETH | strength 79' },
      { id: 'eth-bid-1', priceOffset: -30, sizeStr: '3,400 ETH', volume: 340, strength: 80, ageMin: 41, thickness: 14, type: 'FIERY_WALL', label: 'BID WALL 2,610 | 3,400 ETH | strength 80' },
      { id: 'eth-bid-2', priceOffset: -58, sizeStr: '5,100 ETH', volume: 510, strength: 89, ageMin: 78, thickness: 16, type: 'MAJOR_CORE', label: 'BID WALL 2,582 | 5,100 ETH | strength 89' }
    ]
  },
  SOL: {
    key: 'SOL',
    symbol: 'SOLUSDT',
    name: 'Solana (Binance L2 Depth)',
    contractCode: 'SOL/USDT',
    venue: 'BINANCE L2',
    feedType: 'REAL',
    tickSize: 0.01,
    decimals: 2,
    defaultPrice: 175.50,
    typicalSpanPts: 18.0,
    priceLadderStep: 3.0,
    quoteKey: 'SOLUSDT',
    wsStream: 'solusdt@depth20@100ms',
    unit: 'SOL',
    restingWalls: [
      { id: 'sol-ask-1', priceOffset: 6.5, sizeStr: '38,000 SOL', volume: 380, strength: 86, ageMin: 45, thickness: 16, type: 'MAJOR_CORE', label: 'ASK WALL 182.00 | 38k SOL | strength 86' },
      { id: 'sol-cyan-1', priceOffset: 3.8, sizeStr: '19,500 SOL', volume: 195, strength: 74, ageMin: 20, thickness: 8, type: 'CYAN_SHELF', label: '179.30 Cyan Order Depth' },
      { id: 'sol-ask-2', priceOffset: 1.5, sizeStr: '24,000 SOL', volume: 240, strength: 80, ageMin: 31, thickness: 14, type: 'FIERY_WALL', label: 'ASK WALL 177.00 | 24k SOL | strength 80' },
      { id: 'sol-bid-1', priceOffset: -3.5, sizeStr: '28,000 SOL', volume: 280, strength: 78, ageMin: 35, thickness: 14, type: 'FIERY_WALL', label: 'BID WALL 172.00 | 28k SOL | strength 78' },
      { id: 'sol-bid-2', priceOffset: -7.0, sizeStr: '45,000 SOL', volume: 450, strength: 91, ageMin: 80, thickness: 18, type: 'MAJOR_CORE', label: 'BID WALL 168.50 | 45k SOL | strength 91' }
    ]
  },
  SILVER: {
    key: 'SILVER',
    symbol: 'XAGUSD',
    name: 'Silver Futures (#SI Front Month)',
    contractCode: '#SIZ6 / SIL',
    venue: 'CME COMEX',
    feedType: 'CME_FUTURES',
    tickSize: 0.005,
    decimals: 3,
    defaultPrice: 50.80,
    typicalSpanPts: 3.2,
    priceLadderStep: 0.5,
    quoteKey: 'SLVUSDT',
    unit: 'oz',
    restingWalls: [
      { id: 'ag-ask-1', priceOffset: 1.15, sizeStr: '180k oz', volume: 180, strength: 84, ageMin: 50, thickness: 16, type: 'MAJOR_CORE', label: 'ASK WALL 51.95 | 180k oz | strength 84' },
      { id: 'ag-cyan-1', priceOffset: 0.65, sizeStr: '85k oz', volume: 85, strength: 70, ageMin: 18, thickness: 8, type: 'CYAN_SHELF', label: '51.45 Cyan Resting Band' },
      { id: 'ag-ask-2', priceOffset: 0.18, sizeStr: '120k oz', volume: 120, strength: 77, ageMin: 29, thickness: 14, type: 'FIERY_WALL', label: 'ASK WALL 50.98 | 120k oz | strength 77' },
      { id: 'ag-bid-1', priceOffset: -0.62, sizeStr: '140k oz', volume: 140, strength: 79, ageMin: 39, thickness: 14, type: 'FIERY_WALL', label: 'BID WALL 50.18 | 140k oz | strength 79' },
      { id: 'ag-bid-2', priceOffset: -1.25, sizeStr: '210k oz', volume: 210, strength: 88, ageMin: 72, thickness: 16, type: 'MAJOR_CORE', label: 'BID WALL 49.55 | 210k oz | strength 88' }
    ]
  },
  OIL: {
    key: 'OIL',
    symbol: 'USOIL',
    name: 'Crude Oil (CME WTI #CL)',
    contractCode: '#CLZ6',
    venue: 'NYMEX / CME',
    feedType: 'CME_FUTURES',
    tickSize: 0.01,
    decimals: 2,
    defaultPrice: 76.50,
    typicalSpanPts: 4.8,
    priceLadderStep: 0.8,
    quoteKey: 'WTI',
    unit: 'bbl',
    restingWalls: [
      { id: 'oil-ask-1', priceOffset: 1.85, sizeStr: '250k bbl', volume: 250, strength: 85, ageMin: 48, thickness: 16, type: 'MAJOR_CORE', label: 'ASK WALL 78.35 | 250k bbl | strength 85' },
      { id: 'oil-cyan-1', priceOffset: 1.05, sizeStr: '110k bbl', volume: 110, strength: 72, ageMin: 21, thickness: 8, type: 'CYAN_SHELF', label: '77.55 Cyan Order Depth' },
      { id: 'oil-ask-2', priceOffset: 0.28, sizeStr: '165k bbl', volume: 165, strength: 81, ageMin: 34, thickness: 14, type: 'FIERY_WALL', label: 'ASK WALL 76.78 | 165k bbl | strength 81' },
      { id: 'oil-bid-1', priceOffset: -0.95, sizeStr: '190k bbl', volume: 190, strength: 78, ageMin: 38, thickness: 14, type: 'FIERY_WALL', label: 'BID WALL 75.55 | 190k bbl | strength 78' },
      { id: 'oil-bid-2', priceOffset: -1.95, sizeStr: '310k bbl', volume: 310, strength: 90, ageMin: 85, thickness: 16, type: 'MAJOR_CORE', label: 'BID WALL 74.55 | 310k bbl | strength 90' }
    ]
  }
};

const TIMEFRAME_CONFIGS: Record<HeatmapTimeframe, { label: string; spanHours: number; colSeconds: number; title: string }> = {
  '1s': { label: '1s', spanHours: 0.15, colSeconds: 1, title: '1-Second Columns (Ultra-Scalp Depth)' },
  '1m': { label: '1m', spanHours: 0.5, colSeconds: 60, title: '1-Minute Columns (Intraday L2 Book)' },
  '5m': { label: '5m', spanHours: 2.5, colSeconds: 300, title: '5-Minute Columns (Execution Structure)' },
  '15m': { label: '15m', spanHours: 8, colSeconds: 900, title: '15-Minute Columns (Session Liquidity Sweeps)' },
  '1h': { label: '1h', spanHours: 24, colSeconds: 3600, title: '1-Hour Columns (Day Structural Order Blocks)' },
  '4h': { label: '4h', spanHours: 96, colSeconds: 14400, title: '4-Hour Columns (Swing Institutional Pools)' },
  '1d': { label: '1d', spanHours: 360, colSeconds: 86400, title: '1-Day Columns (Macro High Timeframe Pools)' }
};

export const BookmapLiquidationTerminalView: React.FC = () => {
  const [activeAsset, setActiveAsset] = useState<HeatmapAssetKey>('GOLD');
  const [activeTimeframe, setActiveTimeframe] = useState<HeatmapTimeframe>('15m');
  const [activeTool, setActiveTool] = useState<'CROSSHAIR' | 'PAN' | 'RULER'>('CROSSHAIR');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Viewport 2D Movement & Zoom
  const [priceZoom, setPriceZoom] = useState<number>(1.0);
  const [timeZoom, setTimeZoom] = useState<number>(1.0);
  const [panOffsetY, setPanOffsetY] = useState<number>(0); // Vertical price movement
  const [panOffsetX, setPanOffsetX] = useState<number>(0); // Horizontal time movement

  // Custom visual adjustments
  const [contrast, setContrast] = useState<number>(1.3);
  const [bubbleFilter, setBubbleFilter] = useState<number>(10);
  const [bubbleScale, setBubbleScale] = useState<number>(1.0);
  const [showDom, setShowDom] = useState<boolean>(true);
  const [showCvd, setShowCvd] = useState<boolean>(true);
  const [highlightWallId, setHighlightWallId] = useState<string | null>(null);

  // Live price tracking
  const currentConfig = useMemo(() => ASSET_REGISTRY[activeAsset], [activeAsset]);
  const [livePrice, setLivePrice] = useState<number>(currentConfig.defaultPrice);
  const [latencyMs, setLatencyMs] = useState<number>(16);

  // Canvas Refs & Dragging
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crosshair state
  const [hoverInfo, setHoverInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    timeStr: string;
    volStr: string;
    nearestWall: string | null;
  } | null>({
    visible: true,
    x: 480,
    y: 280,
    price: currentConfig.defaultPrice,
    timeStr: '21:14:35',
    volStr: 'Vol: +12 Buy Aggressor',
    nearestWall: null
  });

  // Sync Live Quotes from Shared Quote Store
  useEffect(() => {
    const q = sharedQuoteStore.getQuote(currentConfig.quoteKey);
    if (q && q.price > 0 && activeAsset !== 'GOLD') {
      setLivePrice(q.price);
    }

    const unsub = sharedQuoteStore.subscribe((quote) => {
      if ((quote.symbol === currentConfig.quoteKey || quote.asset === currentConfig.quoteKey) && activeAsset !== 'GOLD') {
        setLivePrice(quote.price);
      }
    });

    return () => unsub();
  }, [currentConfig, activeAsset]);

  // Real Binance L2 WebSocket for Crypto
  useEffect(() => {
    let ws: WebSocket | null = null;
    if (currentConfig.wsStream && (activeAsset === 'BTC' || activeAsset === 'ETH' || activeAsset === 'SOL')) {
      try {
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${currentConfig.wsStream}`);
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.b?.[0] && data?.a?.[0]) {
              const bestB = parseFloat(data.b[0][0]);
              const bestA = parseFloat(data.a[0][0]);
              if (!isNaN(bestB) && !isNaN(bestA)) {
                setLivePrice(Number(((bestB + bestA) / 2).toFixed(currentConfig.decimals)));
                setLatencyMs(Math.round(14 + Math.random() * 8));
              }
            }
          } catch {
            // ignore
          }
        };
      } catch {
        // ignore
      }
    }

    return () => {
      if (ws) ws.close();
    };
  }, [currentConfig, activeAsset]);

  // Gentle micro-ticking for Gold / Silver / Oil matching live floor
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice((prev) => {
        const delta = (Math.random() - 0.495) * currentConfig.tickSize * 0.9;
        return Number((prev + delta).toFixed(currentConfig.decimals));
      });
    }, 450);

    return () => clearInterval(interval);
  }, [currentConfig]);

  // Switch Asset
  const handleSelectAsset = (key: HeatmapAssetKey) => {
    setActiveAsset(key);
    const cfg = ASSET_REGISTRY[key];
    const q = sharedQuoteStore.getQuote(cfg.quoteKey);
    setLivePrice(q && q.price > 0 && key !== 'GOLD' ? q.price : cfg.defaultPrice);
    setPanOffsetY(0);
    setPanOffsetX(0);
    setPriceZoom(1.0);
    setTimeZoom(1.0);
    setHighlightWallId(null);
  };

  // Recenter View
  const handleRecenter = () => {
    setPanOffsetY(0);
    setPanOffsetX(0);
    setPriceZoom(1.0);
    setTimeZoom(1.0);
    setHighlightWallId(null);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    const el = containerRef.current?.closest('.bookmap-root-terminal') as HTMLElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Snapshot PNG export
  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `LiquidityHeatmap_${currentConfig.symbol}_${activeTimeframe}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC PATTERNS PER TIMEFRAME (BUBBLES, CVD, DOM, VOLUME BARS)
  // ─────────────────────────────────────────────────────────────────────────
  const chartPatterns = useMemo(() => {
    // Stepped price trajectory and aggressive market order bubbles
    // Matching ATAS reference photo: green buy bubbles, red sell bubbles along stepped price path
    const seed = activeAsset.charCodeAt(0) + activeTimeframe.charCodeAt(0);
    const bubbleCount = 18;
    const bubbles = [];

    let currentPriceOffset = 0;
    for (let i = 0; i < bubbleCount; i++) {
      const progressX = 0.08 + (i / bubbleCount) * 0.76;
      const drift = Math.sin(i * 0.85 + seed) * (currentConfig.typicalSpanPts * 0.08);
      currentPriceOffset = drift;
      const isBuy = Math.sin(i * 1.7 + seed) > -0.15;
      const rawVol = Math.round(35 + Math.abs(Math.sin(i * 2.3)) * 280);
      const radius = Math.min(26, Math.max(5, Math.round(Math.sqrt(rawVol) * 1.35 * bubbleScale)));

      bubbles.push({
        id: `b-${i}`,
        progressX,
        priceOffset: currentPriceOffset,
        radius,
        volume: rawVol,
        isBuy,
        showText: rawVol > 120
      });
    }

    // Right DOM Histogram: Red Ask bars above, Green Bid bars below
    const baseP = livePrice;
    const domAsks = currentConfig.restingWalls
      .filter((w) => (w.absolutePrice !== undefined ? w.absolutePrice > baseP : w.priceOffset > 0))
      .map((w) => {
        const offset = w.absolutePrice !== undefined ? (w.absolutePrice - baseP) : w.priceOffset;
        return {
          priceOffset: offset,
          volume: w.volume,
          label: w.sizeStr,
          peakLabel: `${w.volume}`,
          radiusY: Math.max(10, w.thickness)
        };
      });

    const domBids = currentConfig.restingWalls
      .filter((w) => (w.absolutePrice !== undefined ? w.absolutePrice < baseP : w.priceOffset < 0))
      .map((w) => {
        const offset = w.absolutePrice !== undefined ? (w.absolutePrice - baseP) : w.priceOffset;
        return {
          priceOffset: offset,
          volume: w.volume,
          label: w.sizeStr,
          peakLabel: `${w.volume}`,
          radiusY: Math.max(10, w.thickness)
        };
      });

    // Bottom Volume Histogram Bars (Buy/Sell split + CVD points)
    const histBars = [];
    let cvdAcc = 0;
    const barCount = 28;
    for (let b = 0; b < barCount; b++) {
      const prog = (b + 0.5) / barCount;
      const total = Math.round(20 + Math.abs(Math.sin(b * 0.65 + seed)) * 55);
      const buyRatio = 0.4 + Math.abs(Math.cos(b * 0.9 + seed)) * 0.3;
      const buyVol = Math.round(total * buyRatio);
      const sellVol = total - buyVol;
      cvdAcc += buyVol - sellVol;

      histBars.push({
        progressX: prog,
        total,
        buyVol,
        sellVol,
        cvd: cvdAcc,
        label: total > 45 ? `${total}` : undefined
      });
    }

    return { bubbles, domAsks, domBids, histBars };
  }, [activeAsset, activeTimeframe, currentConfig, bubbleScale]);

  // ─────────────────────────────────────────────────────────────────────────
  // MASTER 60 FPS CANVAS RENDERING LOOP
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const profileWidth = showDom ? 175 : 85;
      const bottomHistHeight = 115;
      const chartWidth = w - profileWidth;
      const chartHeight = h - bottomHistHeight;

      // Price Scaling with PanOffsetY & PriceZoom
      const basePrice = livePrice;
      const pSpan = (currentConfig.typicalSpanPts / priceZoom);
      const centerPrice = basePrice + panOffsetY;
      const minP = centerPrice - pSpan / 2;
      const maxP = centerPrice + pSpan / 2;

      const priceToY = (p: number) => {
        return chartHeight - ((p - minP) / pSpan) * chartHeight;
      };

      // Time X coordinate calculation with PanOffsetX & TimeZoom
      const timeToX = (progress: number) => {
        const zoomedW = chartWidth * timeZoom;
        const startX = panOffsetX;
        return startX + progress * zoomedW;
      };

      // ─────────────────────────────────────────────────────────────────────
      // 1. DEEP NEAR-BLACK NAVY BACKGROUND & CONTINUOUS STRATIFIED ROWS
      // (ATAS & Bookmap Signature 1px Horizontal Blue Stripes)
      // ─────────────────────────────────────────────────────────────────────
      ctx.fillStyle = '#050a18';
      ctx.fillRect(0, 0, w, h);

      // Subtle horizontal gradient strata
      const numRows = Math.round(chartHeight / 4.5);
      for (let r = 0; r < numRows; r++) {
        const ry = (r / numRows) * chartHeight;
        const wave = Math.sin(r * 0.38) * 0.5 + 0.5;
        // Alternating thin 1px row gaps
        ctx.fillStyle = r % 2 === 0
          ? `rgba(11, 42, 82, ${0.18 + wave * 0.15 * contrast})`
          : `rgba(7, 18, 43, ${0.45 + wave * 0.25})`;
        ctx.fillRect(0, ry, chartWidth, chartHeight / numRows - 1);
      }

      // ─────────────────────────────────────────────────────────────────────
      // 2. GLOWING FIERY RESTING LIQUIDITY WALLS & CYAN SHELVES
      // (1:1 with yellow/orange/red/white laser bands in reference photo)
      // ─────────────────────────────────────────────────────────────────────
      for (const wall of currentConfig.restingWalls) {
        const wallPrice = wall.absolutePrice !== undefined ? wall.absolutePrice : (basePrice + wall.priceOffset);
        const wallY = priceToY(wallPrice);

        if (wallY < -50 || wallY > chartHeight + 50) continue;

        const thick = wall.thickness;
        const isTargeted = highlightWallId === wall.id;

        if (wall.type === 'FIERY_WALL' || wall.type === 'MAJOR_CORE') {
          // Outer Fiery Orange/Red Bloom
          const bloom = ctx.createLinearGradient(0, wallY - thick * 2.8, 0, wallY + thick * 2.8);
          bloom.addColorStop(0, 'rgba(224, 58, 47, 0)');
          bloom.addColorStop(0.2, 'rgba(245, 154, 35, 0.45)');
          bloom.addColorStop(0.5, isTargeted ? 'rgba(255, 230, 0, 0.98)' : 'rgba(245, 154, 35, 0.92)');
          bloom.addColorStop(0.8, 'rgba(224, 58, 47, 0.45)');
          bloom.addColorStop(1, 'rgba(224, 58, 47, 0)');

          ctx.fillStyle = bloom;
          ctx.fillRect(0, wallY - thick * 2.8, chartWidth, thick * 5.6);

          // Solid Crimson-Red Body
          ctx.fillStyle = '#e03a2f';
          ctx.fillRect(0, wallY - thick * 0.6, chartWidth, thick * 1.2);

          // Incandescent Yellow Core
          ctx.fillStyle = '#e8d44d';
          ctx.fillRect(0, wallY - 3, chartWidth, 6);

          // White-Hot Laser Center
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, wallY - 1, chartWidth, 2);
        } else {
          // Electric Cyan Neon Band
          const cyanBloom = ctx.createLinearGradient(0, wallY - thick * 2.2, 0, wallY + thick * 2.2);
          cyanBloom.addColorStop(0, 'rgba(55, 182, 200, 0)');
          cyanBloom.addColorStop(0.5, 'rgba(55, 182, 200, 0.85)');
          cyanBloom.addColorStop(1, 'rgba(55, 182, 200, 0)');

          ctx.fillStyle = cyanBloom;
          ctx.fillRect(0, wallY - thick * 2.2, chartWidth, thick * 4.4);

          ctx.fillStyle = '#37b6c8';
          ctx.fillRect(0, wallY - thick * 0.5, chartWidth, thick);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, wallY - 1, chartWidth, 2);
        }

        // ───────────────────────────────────────────────────────────────────
        // ON-CHART WALL ANNOTATION PILL (EXACT MATCH WITH ATAS PHOTO)
        // e.g. "ASK WALL 74,830 | 420 BTC | strength 94" (Amber pill with leader)
        // e.g. "BID WALL 74,100 | 365 BTC | strength 76" (Cyan/Emerald pill with leader)
        // ───────────────────────────────────────────────────────────────────
        const isAsk = wall.priceOffset > 0;
        const isMajorLeader = wall.strength >= 76 || isTargeted;

        if (isMajorLeader) {
          const pillX = isAsk ? chartWidth * 0.28 : chartWidth * 0.18;
          const pillY = isAsk ? wallY - 24 : wallY + 24;

          // Dot on the resting line
          ctx.fillStyle = isAsk ? '#f59a23' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(pillX + 90, wallY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Leader pointer line from pill to wall
          ctx.strokeStyle = isAsk ? '#f59a23' : '#38bdf8';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(pillX + 40, isAsk ? pillY + 12 : pillY);
          ctx.lineTo(pillX + 90, wallY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Rounded Tag Box
          const tagText = `${isAsk ? 'ASK WALL' : 'BID WALL'} ${wallPrice.toLocaleString(undefined, { maximumFractionDigits: currentConfig.decimals })} | ${wall.sizeStr} | strength ${wall.strength}`;
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          const tagWidth = ctx.measureText(tagText).width + 14;

          ctx.fillStyle = isAsk ? 'rgba(25, 18, 5, 0.95)' : 'rgba(5, 24, 28, 0.95)';
          ctx.fillRect(pillX, pillY - 11, tagWidth, 19);

          ctx.strokeStyle = isAsk ? 'rgba(245, 154, 35, 0.85)' : 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 1;
          ctx.strokeRect(pillX, pillY - 11, tagWidth, 19);

          ctx.fillStyle = isAsk ? '#fbbf24' : '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText(tagText, pillX + 7, pillY + 2.5);
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // 3. VERTICAL TIME GRID LINES (MATCHING CHOSEN TIMEFRAME)
      // ─────────────────────────────────────────────────────────────────────
      ctx.strokeStyle = '#0e243e';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);

      const numCols = 8;
      for (let c = 1; c < numCols; c++) {
        const gx = (c / numCols) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, chartHeight);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ─────────────────────────────────────────────────────────────────────
      // 4. LIVE MARKET PRICE STEPPED DASHED HAIRLINE
      // ─────────────────────────────────────────────────────────────────────
      const livePriceY = priceToY(livePrice);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, livePriceY);
      ctx.lineTo(chartWidth, livePriceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ─────────────────────────────────────────────────────────────────────
      // 5. STEPPED PRICE LINE & AGGRESSIVE MARKET TRADE BUBBLES
      // (Green Market Buys, Red Market Sells, Alpha Shading)
      // ─────────────────────────────────────────────────────────────────────
      // Draw Stepped connecting line
      ctx.strokeStyle = 'rgba(255, 107, 129, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < chartPatterns.bubbles.length; i++) {
        const b = chartPatterns.bubbles[i];
        const bx = timeToX(b.progressX);
        const by = priceToY(basePrice + b.priceOffset);
        if (i === 0) ctx.moveTo(bx, by);
        else {
          // Stepped interpolation
          const prevB = chartPatterns.bubbles[i - 1];
          const prevY = priceToY(basePrice + prevB.priceOffset);
          ctx.lineTo(bx, prevY);
          ctx.lineTo(bx, by);
        }
      }
      ctx.lineTo(timeToX(0.88), livePriceY);
      ctx.stroke();

      // Render Bubbles with Volumetric Shading
      for (const b of chartPatterns.bubbles) {
        if (b.volume < bubbleFilter) continue;

        const bx = timeToX(b.progressX);
        const by = priceToY(basePrice + b.priceOffset);
        const r = b.radius;

        if (bx < -30 || bx > chartWidth + 30 || by < -30 || by > chartHeight + 30) continue;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);

        // Green #2ecc71 (Buy) or Red #e74c3c (Sell) with 75% Alpha
        ctx.fillStyle = b.isBuy ? 'rgba(46, 204, 113, 0.78)' : 'rgba(231, 76, 60, 0.78)';
        ctx.fill();

        // 3D Glass Specular Gradient
        const grad = ctx.createRadialGradient(
          bx - r * 0.35,
          by - r * 0.35,
          r * 0.1,
          bx,
          by,
          r
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Thin crisp outline
        ctx.strokeStyle = b.isBuy ? '#27ae60' : '#c0392b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Volume text on large prominent bubbles
        if (b.showText && r >= 14) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${b.volume}`, bx, by + 3);
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // 6. RIGHT-SIDE DOM HISTOGRAM & PRICE LADDER (EXACT ATAS MATCH)
      // Red Asks Above Price, Green Bids Below Price
      // ─────────────────────────────────────────────────────────────────────
      if (showDom) {
        ctx.fillStyle = '#030714';
        ctx.fillRect(chartWidth, 0, profileWidth, chartHeight);

        // Vertical divider line
        ctx.strokeStyle = '#0e243e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(chartWidth, 0);
        ctx.lineTo(chartWidth, chartHeight);
        ctx.stroke();

        // Red Ask Bars Growing Leftwards
        for (const ap of chartPatterns.domAsks) {
          const ay = priceToY(basePrice + ap.priceOffset);
          const barW = Math.min(85, (ap.volume / 550) * 85);
          const rY = ap.radiusY;

          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(chartWidth + 2, ay - rY / 2, barW, rY);

          // White peak label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(ap.peakLabel, chartWidth + barW + 5, ay + 3.5);
        }

        // Green Bid Bars Growing Leftwards
        for (const bp of chartPatterns.domBids) {
          const by = priceToY(basePrice + bp.priceOffset);
          const barW = Math.min(85, (bp.volume / 650) * 85);
          const rY = bp.radiusY;

          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(chartWidth + 2, by - rY / 2, barW, rY);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(bp.peakLabel, chartWidth + barW + 5, by + 3.5);
        }

        // Price Ladder ticks on the right edge
        const ladderStep = currentConfig.priceLadderStep;
        const startPrice = Math.floor(minP / ladderStep) * ladderStep;
        const endPrice = Math.ceil(maxP / ladderStep) * ladderStep;

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';

        for (let p = startPrice; p <= endPrice; p += ladderStep) {
          const py = priceToY(p);
          if (py < 15 || py > chartHeight - 15) continue;
          ctx.fillText(p.toFixed(currentConfig.decimals), w - 6, py + 4.5);

          ctx.strokeStyle = '#1e385c';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(w - 65, py);
          ctx.lineTo(w - 58, py);
          ctx.stroke();
        }

        // PROMINENT BOXED LIVE PRICE BADGE (Exact match with photo)
        const badgeW = 76;
        const badgeH = 22;
        const badgeX = w - badgeW - 3;
        const badgeY = livePriceY - badgeH / 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(livePrice.toFixed(currentConfig.decimals), badgeX + badgeW / 2, badgeY + 15.5);
      }

      // ─────────────────────────────────────────────────────────────────────
      // 7. BOTTOM PANE: VOLUME BUY/SELL SPLIT & CUMULATIVE DELTA (CVD)
      // Matches ATAS / Bookmap 1:1 with bidirectional bars (Green UP, Red DOWN)
      // ─────────────────────────────────────────────────────────────────────
      ctx.fillStyle = '#020614';
      ctx.fillRect(0, chartHeight, w, bottomHistHeight);

      // Horizontal separator
      ctx.strokeStyle = '#0e243e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, chartHeight);
      ctx.lineTo(w, chartHeight);
      ctx.stroke();

      // Subchart Title (Exact match with photo)
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Volume (Buy / Sell) | Cum. Delta ^', 8, chartHeight + 13);

      const histMidY = chartHeight + 52;
      const colW = Math.max(6, (chartWidth / chartPatterns.histBars.length) * 0.72);

      // Zero baseline for Buy/Sell volume
      ctx.strokeStyle = 'rgba(30, 58, 92, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, histMidY);
      ctx.lineTo(chartWidth, histMidY);
      ctx.stroke();

      for (const bar of chartPatterns.histBars) {
        const bx = bar.progressX * chartWidth;
        const total = bar.total;
        const maxBarHalfH = 34;
        const buyH = Math.min(maxBarHalfH, Math.max(3, (bar.buyVol / 40) * maxBarHalfH));
        const sellH = Math.min(maxBarHalfH, Math.max(3, (bar.sellVol / 40) * maxBarHalfH));

        // Green Buy Volume shoots UP from baseline
        ctx.fillStyle = '#10b981';
        ctx.fillRect(bx - colW / 2, histMidY - buyH, colW, buyH);

        // Red Sell Volume hangs DOWN from baseline
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx - colW / 2, histMidY, colW, sellH);

        if (bar.label && total > 55) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(bar.label, bx, histMidY - buyH - 2);
        }
      }

      // Cumulative Volume Delta (CVD) overlaid curve in Electric Cyan
      if (showCvd && chartPatterns.histBars.length > 1) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < chartPatterns.histBars.length; i++) {
          const bar = chartPatterns.histBars[i];
          const bx = bar.progressX * chartWidth;
          const cvdY = histMidY - (bar.cvd / 80) * 22;
          if (i === 0) ctx.moveTo(bx, cvdY);
          else ctx.lineTo(bx, cvdY);
        }
        ctx.stroke();
      }

      // Time scale along bottom (e.g. 21:00, 21:05, 21:10, 21:15, 21:20, 21:25)
      const nowMs = Date.now();
      const colSec = TIMEFRAME_CONFIGS[activeTimeframe].colSeconds;
      const timeLabels = [];
      for (let t = 6; t >= 0; t--) {
        const d = new Date(nowMs - t * colSec * 10 * 1000);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        const ss = d.getSeconds().toString().padStart(2, '0');
        timeLabels.push(colSec < 60 ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`);
      }

      for (let t = 0; t < timeLabels.length; t++) {
        const tx = (t / (timeLabels.length - 1)) * (chartWidth - 90) + 45;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabels[t], tx, h - 7);
      }

      // ─────────────────────────────────────────────────────────────────────
      // 8. BRIGHT YELLOW CROSSHAIR (#ffd700) & FLOATING TOOLTIP BOX
      // ─────────────────────────────────────────────────────────────────────
      if (hoverInfo && hoverInfo.visible && hoverInfo.x <= chartWidth && hoverInfo.y <= chartHeight) {
        // Vertical yellow crosshair line
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hoverInfo.x, 0);
        ctx.lineTo(hoverInfo.x, chartHeight);
        ctx.stroke();

        // Horizontal dashed line
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(0, hoverInfo.y);
        ctx.lineTo(chartWidth, hoverInfo.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dark Floating Card Tooltip
        const tipW = 120;
        const tipH = 58;
        const tipX = Math.min(hoverInfo.x + 14, chartWidth - tipW - 8);
        const tipY = Math.max(8, Math.min(hoverInfo.y - 25, chartHeight - tipH - 8));

        ctx.fillStyle = 'rgba(2, 6, 20, 0.96)';
        ctx.fillRect(tipX, tipY, tipW, tipH);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(tipX, tipY, tipW, tipH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(hoverInfo.price.toFixed(currentConfig.decimals), tipX + 8, tipY + 16);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9.5px "JetBrains Mono", monospace';
        ctx.fillText(hoverInfo.timeStr, tipX + 8, tipY + 32);

        ctx.fillStyle = hoverInfo.price >= livePrice ? '#f59a23' : '#10b981';
        ctx.fillText(hoverInfo.volStr, tipX + 8, tipY + 47);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    livePrice,
    priceZoom,
    timeZoom,
    panOffsetY,
    panOffsetX,
    contrast,
    bubbleFilter,
    showDom,
    showCvd,
    highlightWallId,
    currentConfig,
    activeTimeframe,
    chartPatterns,
    hoverInfo
  ]);

  // Handle Resize for 4K / Retina screens
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2D MOUSE & TOUCH DRAGGING (BOTH X HORIZONTAL TIME & Y VERTICAL PRICE)
  // Addresses user request: "usko main chart ko move kar sakta hun dekhne ke liye"
  // ─────────────────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
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

    const profileWidth = showDom ? 175 : 85;
    const bottomHistHeight = 115;
    const chartW = rect.width - profileWidth;
    const chartH = rect.height - bottomHistHeight;

    // Both Horizontal (X Time) and Vertical (Y Price) Panning
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      // Y-axis price delta
      const pSpan = (currentConfig.typicalSpanPts / priceZoom);
      const priceDelta = (dy / chartH) * pSpan;
      setPanOffsetY((prev) => prev + priceDelta);

      // X-axis time delta
      setPanOffsetX((prev) => prev + dx);
      return;
    }

    if (x > chartW || y > chartH) return;

    const pSpan = (currentConfig.typicalSpanPts / priceZoom);
    const centerP = livePrice + panOffsetY;
    const curMaxP = centerP + pSpan / 2;
    const priceAtCursor = curMaxP - (y / chartH) * pSpan;

    const date = new Date();
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

    setHoverInfo({
      visible: true,
      x,
      y,
      price: priceAtCursor,
      timeStr,
      volStr: priceAtCursor >= livePrice ? 'Vol: +18 Ask Wall' : 'Vol: -24 Bid Floor',
      nearestWall: null
    });
  };

  // Zooming via Mouse Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.shiftKey) {
      // Shift + Wheel zooms Time (X)
      if (e.deltaY < 0) {
        setTimeZoom((z) => Math.min(3.5, z * 1.12));
      } else {
        setTimeZoom((z) => Math.max(0.4, z * 0.89));
      }
    } else {
      // Standard Wheel zooms Price (Y)
      if (e.deltaY < 0) {
        setPriceZoom((z) => Math.min(4.5, z * 1.12));
      } else {
        setPriceZoom((z) => Math.max(0.35, z * 0.89));
      }
    }
  };

  return (
    <div className="bookmap-root-terminal flex flex-col w-full h-[calc(100vh-105px)] min-h-[700px] bg-[#020614] text-slate-100 rounded-lg overflow-hidden border border-[#0e243e] shadow-2xl select-none font-sans">
      {/* ── TOP SOFTWARE CHROME HEADER (ATAS & BOOKMAP STYLE) ── */}
      <header className="flex flex-wrap items-center justify-between bg-[#080e1c] px-3 py-1.5 border-b border-[#0e243e] text-xs font-mono select-none gap-2">
        {/* Left: Contract Pill & Venue status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#030714] border border-cyan-500/50 text-cyan-300 font-bold text-xs">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-extrabold">{currentConfig.contractCode}</span>
            <span className="text-[10px] text-slate-400">· {currentConfig.venue}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300 border-l border-slate-800 pl-2">
            <span className="text-slate-400">Feed:</span>
            <span className="text-emerald-400 font-bold">{currentConfig.feedType}</span>
            <span className="text-slate-400">Latency:</span>
            <span className="text-cyan-400 font-bold">{latencyMs}ms</span>
          </div>
        </div>

        {/* Center 1: Asset Tabs (Gold, BTC, ETH, SOL, Silver, Oil) */}
        <div className="flex items-center gap-1 bg-[#030714] p-0.5 rounded-md border border-slate-800">
          {(Object.keys(ASSET_REGISTRY) as HeatmapAssetKey[]).map((k) => {
            const isActive = activeAsset === k;
            return (
              <button
                key={k}
                onClick={() => handleSelectAsset(k)}
                className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <span>{k}</span>
              </button>
            );
          })}
        </div>

        {/* Center 2: ALL TIMEFRAMES SELECTOR (User Requested: 15m, 1h, 4h, 1d) */}
        <div className="flex items-center gap-0.5 bg-[#030714] p-0.5 rounded-md border border-slate-800">
          {(Object.keys(TIMEFRAME_CONFIGS) as HeatmapTimeframe[]).map((tf) => {
            const isTfActive = activeTimeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                title={TIMEFRAME_CONFIGS[tf].title}
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${
                  isTfActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* Right: Window & Tool Controls */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-1 hover:text-white rounded hover:bg-slate-800"
            title="Heatmap Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRecenter}
            className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800"
            title="Recenter Chart (Reset View)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSnapshot}
            className="p-1 hover:text-white rounded hover:bg-slate-800"
            title="Export PNG Screenshot"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-1 hover:text-white rounded hover:bg-slate-800"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ── WORKSPACE: LEFT TOOLBAR + MAIN HEATMAP CANVAS + RIGHT SIDEBAR ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Vertical Toolstrip */}
        <aside className="w-8 shrink-0 bg-[#060c18] border-r border-[#0e243e] flex flex-col items-center py-2.5 gap-2.5 text-slate-400 z-10 select-none">
          <button
            onClick={() => setActiveTool('CROSSHAIR')}
            title="Crosshair Tool (Inspect Liquidity)"
            className={`p-1 rounded transition ${activeTool === 'CROSSHAIR' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('PAN')}
            title="Pan / Hand Tool (Drag Chart Up/Down & Left/Right)"
            className={`p-1 rounded transition ${activeTool === 'PAN' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          <div className="h-px w-4 bg-slate-800 my-0.5" />

          {/* Zoom controls */}
          <button
            onClick={() => setPriceZoom((z) => Math.min(4.5, z * 1.15))}
            title="Zoom Price In (+)"
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPriceZoom((z) => Math.max(0.35, z * 0.88))}
            title="Zoom Price Out (-)"
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRecenter}
            title="Reset Pan & Zoom"
            className="p-1 rounded hover:bg-slate-800 hover:text-cyan-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </aside>

        {/* Central Heatmap Canvas Viewport */}
        <div ref={containerRef} className="relative flex-1 bg-[#050a18] overflow-hidden">
          {/* Top-Left Informational Overlay (Matches Reference Photo Header 1:1) */}
          <div className="absolute top-2.5 left-3 z-10 text-[11px] font-mono select-none tracking-tight flex items-center gap-2 pointer-events-none drop-shadow-md">
            <span className="font-semibold text-[#f59e0b]">{currentConfig.symbol} {currentConfig.venue}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">HEATMAP {activeTimeframe} columns</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300/80">ILLUSTRATIVE MOCKUP - synthetic data</span>
          </div>

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onDoubleClick={handleRecenter}
            className={`absolute inset-0 block w-full h-full ${
              activeTool === 'PAN' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
            }`}
          />
        </div>

        {/* ── RIGHT SIDEBAR (EXACT MATCH WITH REFERENCE PHOTO media_1793638601420_16457af5.jpg) ── */}
        <aside className="w-64 shrink-0 bg-[#060c18] border-l border-[#0e243e] flex flex-col justify-between text-xs font-mono p-3 space-y-3 overflow-y-auto z-10">
          {/* Section 1: LIQUIDITY ZONES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>LIQUIDITY ZONES</span>
              </span>
              <span className="text-[9px] text-slate-500 font-bold">CLICK TO JUMP</span>
            </div>

            <div className="space-y-1.5">
              {currentConfig.restingWalls.map((wall) => {
                const wallPrice = wall.absolutePrice !== undefined ? wall.absolutePrice : (livePrice + wall.priceOffset);
                const isAsk = wall.absolutePrice !== undefined ? wall.absolutePrice > livePrice : wall.priceOffset > 0;
                const isSelected = highlightWallId === wall.id;

                return (
                  <button
                    key={wall.id}
                    onClick={() => {
                      setHighlightWallId(wall.id);
                      setPanOffsetY(livePrice - wallPrice);
                    }}
                    className={`w-full text-left p-1.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : isAsk
                        ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/50 text-slate-300'
                        : 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${isAsk ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isAsk ? 'ASK' : 'BID'} {wallPrice.toFixed(currentConfig.decimals > 1 ? 1 : 0)}
                      </span>
                      <span className="text-white font-black">{wall.sizeStr}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-0.5">
                      <span>strength {wall.strength}</span>
                      <span>{wall.ageMin} min age</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: LIVE ORDERBOOK EVENTS */}
          <div className="space-y-1.5">
            <div className="border-b border-slate-800 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>EVENTS</span>
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded">DEFENDED</span>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-amber-300 font-bold">21:53 Absorption</span>
                <span className="text-slate-300 font-mono">@{(livePrice - (activeAsset === 'BTC' ? 160 : livePrice * 0.002)).toFixed(currentConfig.decimals > 1 ? 1 : 0)}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">21:54 Wall added</span>
                <span className="text-slate-300 font-mono">@{(livePrice + (activeAsset === 'BTC' ? 220 : livePrice * 0.003)).toFixed(currentConfig.decimals > 1 ? 1 : 0)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: ORDERBOOK IMBALANCE */}
          <div className="space-y-1.5">
            <div className="border-b border-slate-800 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              IMBALANCE
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-emerald-400">Bids 54%</span>
              <span className="text-rose-400">Asks 46%</span>
            </div>
            {/* Visual Balance Bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800 flex">
              <div className="h-full bg-emerald-500" style={{ width: '54%' }} />
              <div className="h-full bg-rose-500" style={{ width: '46%' }} />
            </div>
          </div>

          {/* Section 4: DATA TELEMETRY & ATTRIBUTION */}
          <div className="p-2 rounded-md bg-[#040814] border border-slate-800 space-y-1 text-[10.5px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATA</div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Feed:</span>
              <span className="text-cyan-300 font-bold truncate">{currentConfig.venue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Recorded price:</span>
              <span className="text-white font-mono font-bold">{livePrice.toFixed(currentConfig.decimals)}</span>
            </div>
            <div className="pt-1 text-[9px] text-slate-500 leading-tight">
              Evidence only, non-custodial L2 orderbook depth.
            </div>
          </div>
        </aside>
      </div>

      {/* ── SETTINGS DRAWER (MODAL OVERLAY) ── */}
      {showSettingsDrawer && (
        <div className="absolute top-10 right-2 z-30 w-80 bg-[#080e1c] border border-slate-700 rounded-lg shadow-2xl p-3.5 space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Heatmap & DOM Controls</span>
            </span>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Contrast:</span>
                <span>{contrast.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Min Bubble Size:</span>
                <span>{bubbleFilter}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={bubbleFilter}
                onChange={(e) => setBubbleFilter(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Bubble Scale:</span>
                <span>{bubbleScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={bubbleScale}
                onChange={(e) => setBubbleScale(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Show Right DOM Histogram</span>
              <input
                type="checkbox"
                checked={showDom}
                onChange={(e) => setShowDom(e.target.checked)}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Show Cumulative Delta (CVD)</span>
              <input
                type="checkbox"
                checked={showCvd}
                onChange={(e) => setShowCvd(e.target.checked)}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmapLiquidationTerminalView;
