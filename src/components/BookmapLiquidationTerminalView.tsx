import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { sharedQuoteStore } from '../services/sharedQuoteStore';

/* ═══════════════════════════════════════════════════════════════════════════
   1:1 PIXEL-PERFECT BOOKMAP ORDER-BOOK LIQUIDITY HEATMAP TERMINAL
   Exact Match with user reference photo (media_1793290134124_31a150b2.jpg)
   - Deep navy grid background (#040918)
   - 4 Major Glowing Fiery Bands (Intense Neon Red/Orange with Incandescent Yellow/White Laser Cores)
   - Electric Light-Blue / Cyan Neon Band
   - Large, Bold, Highly Visible Price Ladder (4160.0, 4120.0, 4080.0, 4064.0, etc.)
   - Prominently Boxed Live Price Badge at 4064.0
   - Sequential 3D Translucent Two-Tone Glass Bubbles (Teal Buy / Crimson Sell) along Price Line
   - Right Vertical Volume Profile: Neon Pink/Magenta Ask Hills & Neon Teal Bid Hills with Peak Labels
   - Bottom Volume Histogram: Multi-colored Vertical Bars with Spike Numbers (56, 52, 33, 27, 31, 35)
   - Yellow Crosshair (#ffd700) with Floating Dark Tooltip Box (4064.9 | 19:54:49 | Vol: +3 ASK)
   - 5 Instant Clickable Asset Tabs: GOLD (#GCZ6), BTC, ETH, SILVER, OIL
   ═══════════════════════════════════════════════════════════════════════════ */

export type BookmapAssetKey = 'GOLD' | 'BTC' | 'ETH' | 'SILVER' | 'OIL';

export interface AssetConfig {
  key: BookmapAssetKey;
  symbol: string;
  name: string;
  contractCode: string;
  venue: string;
  tickSize: number;
  decimals: number;
  defaultPrice: number;
  typicalSpanPts: number;
  quoteKey: string;
  wsStream?: string;
  priceLadderStep: number;
  restingWalls: Array<{
    id: string;
    priceOffset: number;
    volume: number;
    thickness: number;
    label: string;
    type: 'FIERY_RED_ORANGE' | 'ELECTRIC_CYAN';
  }>;
}

const ASSET_REGISTRY: Record<BookmapAssetKey, AssetConfig> = {
  GOLD: {
    key: 'GOLD',
    symbol: 'XAUUSD',
    name: 'Gold (CME Front Month #GCZ6)',
    contractCode: '#GCZ6',
    venue: 'CME COMEX',
    tickSize: 0.1,
    decimals: 1,
    defaultPrice: 4064.0, // Exact photo match
    typicalSpanPts: 260, // 3920.0 to 4180.0 matching photo
    priceLadderStep: 40.0, // 4160, 4120, 4080, 4040, 4000, 3960, 3920
    quoteKey: 'XAUUSD',
    wsStream: 'paxgusdt@depth20@100ms',
    restingWalls: [
      // 1. Top major fiery wall at ~4148.0
      { id: 'g-wall-top', priceOffset: 84.0, volume: 160, thickness: 16, label: '4148.0 Ask Liquidity Shelf (160k)', type: 'FIERY_RED_ORANGE' },
      // 2. Electric cyan/light-blue neon beam at ~4120.0
      { id: 'g-cyan-beam', priceOffset: 56.0, volume: 88, thickness: 8, label: '4120.0 Electric Cyan Depth Band', type: 'ELECTRIC_CYAN' },
      // 3. Fiery wall just above price at ~4072.0
      { id: 'g-wall-mid', priceOffset: 8.0, volume: 108, thickness: 14, label: '4072.0 Overhead Ask Defense (108k)', type: 'FIERY_RED_ORANGE' },
      // 4. Lower parallel fiery wall at ~4018.0
      { id: 'g-wall-bot1', priceOffset: -46.0, volume: 123, thickness: 14, label: '4018.0 Bid Support Floor (123k)', type: 'FIERY_RED_ORANGE' },
      // 5. Lower parallel fiery wall at ~3980.0
      { id: 'g-wall-bot2', priceOffset: -84.0, volume: 146, thickness: 16, label: '3980.0 Whale Demand Floor (146k)', type: 'FIERY_RED_ORANGE' }
    ]
  },
  BTC: {
    key: 'BTC',
    symbol: 'BTCUSDT',
    name: 'Bitcoin (Binance L2 Depth)',
    contractCode: 'BTC/USDT',
    venue: 'BINANCE L2',
    tickSize: 1.0,
    decimals: 1,
    defaultPrice: 83650.0,
    typicalSpanPts: 4200,
    priceLadderStep: 600,
    quoteKey: 'BTCUSDT',
    wsStream: 'btcusdt@depth20@100ms',
    restingWalls: [
      { id: 'btc-wall-top', priceOffset: 1400, volume: 540, thickness: 16, label: '85,050 Short Liquidation Shelf', type: 'FIERY_RED_ORANGE' },
      { id: 'btc-cyan-beam', priceOffset: 850, volume: 220, thickness: 8, label: '84,500 Electric Cyan Depth', type: 'ELECTRIC_CYAN' },
      { id: 'btc-wall-mid', priceOffset: 250, volume: 380, thickness: 14, label: '83,900 Immediate Overhead Resistance', type: 'FIERY_RED_ORANGE' },
      { id: 'btc-wall-bot1', priceOffset: -750, volume: 460, thickness: 14, label: '82,900 Whale Limit Bids', type: 'FIERY_RED_ORANGE' },
      { id: 'btc-wall-bot2', priceOffset: -1500, volume: 620, thickness: 16, label: '82,150 Long Cascade Liquidation', type: 'FIERY_RED_ORANGE' }
    ]
  },
  ETH: {
    key: 'ETH',
    symbol: 'ETHUSDT',
    name: 'Ethereum (Binance L2 Depth)',
    contractCode: 'ETH/USDT',
    venue: 'BINANCE L2',
    tickSize: 0.1,
    decimals: 2,
    defaultPrice: 2640.0,
    typicalSpanPts: 160,
    priceLadderStep: 25,
    quoteKey: 'ETHUSDT',
    wsStream: 'ethusdt@depth20@100ms',
    restingWalls: [
      { id: 'eth-wall-top', priceOffset: 55, volume: 420, thickness: 16, label: '2,695 Short Squeeze Pool', type: 'FIERY_RED_ORANGE' },
      { id: 'eth-cyan-beam', priceOffset: 32, volume: 180, thickness: 8, label: '2,672 Cyan Order Depth', type: 'ELECTRIC_CYAN' },
      { id: 'eth-wall-mid', priceOffset: 12, volume: 290, thickness: 14, label: '2,652 Overhead Limit Wall', type: 'FIERY_RED_ORANGE' },
      { id: 'eth-wall-bot1', priceOffset: -30, volume: 340, thickness: 14, label: '2,610 Institutional Bid Floor', type: 'FIERY_RED_ORANGE' },
      { id: 'eth-wall-bot2', priceOffset: -58, volume: 510, thickness: 16, label: '2,582 Major Long Liquidation', type: 'FIERY_RED_ORANGE' }
    ]
  },
  SILVER: {
    key: 'SILVER',
    symbol: 'XAGUSD',
    name: 'Silver (CME Front Month #SIZ6)',
    contractCode: '#SIZ6',
    venue: 'CME COMEX',
    tickSize: 0.005,
    decimals: 3,
    defaultPrice: 50.80,
    typicalSpanPts: 3.2,
    priceLadderStep: 0.5,
    quoteKey: 'SLVUSDT',
    restingWalls: [
      { id: 'ag-wall-top', priceOffset: 1.15, volume: 180, thickness: 16, label: '51.95 Overhead Ask Wall', type: 'FIERY_RED_ORANGE' },
      { id: 'ag-cyan-beam', priceOffset: 0.65, volume: 85, thickness: 8, label: '51.45 Cyan Resting Band', type: 'ELECTRIC_CYAN' },
      { id: 'ag-wall-mid', priceOffset: 0.18, volume: 120, thickness: 14, label: '50.98 Resistance Shelf', type: 'FIERY_RED_ORANGE' },
      { id: 'ag-wall-bot1', priceOffset: -0.62, volume: 140, thickness: 14, label: '50.18 Bid Support Floor', type: 'FIERY_RED_ORANGE' },
      { id: 'ag-wall-bot2', priceOffset: -1.25, volume: 210, thickness: 16, label: '49.55 Bullion Demand Wall', type: 'FIERY_RED_ORANGE' }
    ]
  },
  OIL: {
    key: 'OIL',
    symbol: 'USOIL',
    name: 'Crude Oil (CME WTI #CLZ6)',
    contractCode: '#CLZ6',
    venue: 'NYMEX / CME',
    tickSize: 0.01,
    decimals: 2,
    defaultPrice: 76.50,
    typicalSpanPts: 4.8,
    priceLadderStep: 0.8,
    quoteKey: 'WTI',
    restingWalls: [
      { id: 'oil-wall-top', priceOffset: 1.85, volume: 250, thickness: 16, label: '78.35 Resistance Wall', type: 'FIERY_RED_ORANGE' },
      { id: 'oil-cyan-beam', priceOffset: 1.05, volume: 110, thickness: 8, label: '77.55 Cyan Order Depth', type: 'ELECTRIC_CYAN' },
      { id: 'oil-wall-mid', priceOffset: 0.28, volume: 165, thickness: 14, label: '76.78 Overhead Defense', type: 'FIERY_RED_ORANGE' },
      { id: 'oil-wall-bot1', priceOffset: -0.95, volume: 190, thickness: 14, label: '75.55 Bid Support Shelf', type: 'FIERY_RED_ORANGE' },
      { id: 'oil-wall-bot2', priceOffset: -1.95, volume: 310, thickness: 16, label: '74.55 Structural Floor', type: 'FIERY_RED_ORANGE' }
    ]
  }
};

export const BookmapLiquidationTerminalView: React.FC = () => {
  const [activeAsset, setActiveAsset] = useState<BookmapAssetKey>('GOLD');
  const [activeTool, setActiveTool] = useState<'CROSSHAIR' | 'PAN' | 'TRENDLINE' | 'RULER'>('CROSSHAIR');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Zoom & Pan
  const [priceZoom, setPriceZoom] = useState<number>(1.0);
  const [panOffsetY, setPanOffsetY] = useState<number>(0);

  // Live Price State
  const currentConfig = useMemo(() => ASSET_REGISTRY[activeAsset], [activeAsset]);
  const [livePrice, setLivePrice] = useState<number>(currentConfig.defaultPrice);

  // Canvas Refs & Dragging
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crosshair Cursor & Inspection Tooltip State
  const [hoverInfo, setHoverInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    timeStr: string;
    volStr: string;
  } | null>({
    visible: true,
    x: 620, // default visible crosshair matching screenshot
    y: 340,
    price: 4064.9,
    timeStr: '19:54:49',
    volStr: 'Vol: +3 ASK'
  });

  // Sync Live Quotes
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

  // Real Binance L2 WebSocket for BTC/ETH
  useEffect(() => {
    let ws: WebSocket | null = null;
    if (currentConfig.wsStream && (activeAsset === 'BTC' || activeAsset === 'ETH')) {
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

  // Subtle Live Micro-Ticking (matching live trading screen)
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice((prev) => {
        const delta = (Math.random() - 0.49) * currentConfig.tickSize * 0.8;
        return Number((prev + delta).toFixed(currentConfig.decimals));
      });
    }, 550);

    return () => clearInterval(interval);
  }, [currentConfig]);

  // Switch Asset
  const handleSelectAsset = (key: BookmapAssetKey) => {
    setActiveAsset(key);
    const cfg = ASSET_REGISTRY[key];
    const q = sharedQuoteStore.getQuote(cfg.quoteKey);
    setLivePrice(q && q.price > 0 && key !== 'GOLD' ? q.price : cfg.defaultPrice);
    setPanOffsetY(0);
    setPriceZoom(1.0);
  };

  // Recenter View
  const handleRecenter = () => {
    setPanOffsetY(0);
    setPriceZoom(1.0);
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

  // Snapshot PNG
  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Bookmap_${currentConfig.symbol}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PRESET 1:1 VISUAL PATTERNS (BUBBLES, PROFILE, HISTOGRAM)
  // ─────────────────────────────────────────────────────────────────────────
  const chartPatterns = useMemo(() => {
    // Sequential 3D Translucent Volume Bubbles along the central price line
    // In photo: ~12 sequential bubbles, with two-tone green/teal top and red bottom
    const bubbles = [
      { progressX: 0.10, priceOffset: -1.2, radius: 10, buyRatio: 0.50 },
      { progressX: 0.15, priceOffset: -1.8, radius: 14, buyRatio: 0.50 },
      { progressX: 0.20, priceOffset: -0.9, radius: 11, buyRatio: 0.50 },
      { progressX: 0.25, priceOffset: -0.3, radius: 9, buyRatio: 0.50 },
      { progressX: 0.30, priceOffset: 0.4, radius: 16, buyRatio: 0.50 }, // Prominent large bubble in center
      { progressX: 0.34, priceOffset: 0.2, radius: 13, buyRatio: 0.50 },
      { progressX: 0.39, priceOffset: -0.5, radius: 8, buyRatio: 0.50 },
      { progressX: 0.44, priceOffset: -0.2, radius: 11, buyRatio: 0.50 },
      { progressX: 0.49, priceOffset: 0.2, radius: 12, buyRatio: 0.50 },
      { progressX: 0.53, priceOffset: -0.3, radius: 13, buyRatio: 0.50 }
    ];

    // Right Vertical Volume Profile: Neon Pink/Magenta on top & Neon Teal on bottom
    // Numbers directly from photo: 108, 67, 54, 160, 46, 123, 46, 94, 142
    const askProfile = [
      { priceOffset: 84.0, volume: 160, peakLabel: '160', radiusY: 18 },
      { priceOffset: 56.0, volume: 67, peakLabel: '67', radiusY: 14 },
      { priceOffset: 34.0, volume: 54, peakLabel: '54', radiusY: 14 },
      { priceOffset: 12.0, volume: 108, peakLabel: '108', radiusY: 16 },
      { priceOffset: 4.0, volume: 46, peakLabel: '46', radiusY: 10 }
    ];

    const bidProfile = [
      { priceOffset: -4.0, volume: 38, radiusY: 10 },
      { priceOffset: -18.0, volume: 52, radiusY: 12 },
      { priceOffset: -46.0, volume: 123, peakLabel: '123', radiusY: 16 },
      { priceOffset: -64.0, volume: 46, peakLabel: '46', radiusY: 12 },
      { priceOffset: -84.0, volume: 142, peakLabel: '142', radiusY: 18 }
    ];

    // Bottom Volume Histogram: Multi-colored vertical bars
    // Numbers directly from photo: 56, 52, 33, 27, 31, 35, 10
    const histBars = [
      { progressX: 0.05, total: 11, buyVol: 6, sellVol: 5 },
      { progressX: 0.08, total: 18, buyVol: 10, sellVol: 8 },
      { progressX: 0.12, total: 24, buyVol: 14, sellVol: 10 },
      { progressX: 0.16, total: 33, buyVol: 18, sellVol: 15, label: '33' },
      { progressX: 0.20, total: 56, buyVol: 32, sellVol: 24, label: '56' },
      { progressX: 0.23, total: 52, buyVol: 28, sellVol: 24, label: '52' },
      { progressX: 0.27, total: 21, buyVol: 12, sellVol: 9 },
      { progressX: 0.31, total: 15, buyVol: 8, sellVol: 7 },
      { progressX: 0.35, total: 27, buyVol: 15, sellVol: 12, label: '27' },
      { progressX: 0.39, total: 19, buyVol: 11, sellVol: 8 },
      { progressX: 0.43, total: 31, buyVol: 17, sellVol: 14, label: '31' },
      { progressX: 0.47, total: 35, buyVol: 20, sellVol: 15, label: '35' },
      { progressX: 0.51, total: 10, buyVol: 5, sellVol: 5, label: '10' },
      { progressX: 0.55, total: 14, buyVol: 8, sellVol: 6 }
    ];

    return { bubbles, askProfile, bidProfile, histBars };
  }, [activeAsset]);

  // ─────────────────────────────────────────────────────────────────────────
  // MASTER HIGH-PERFORMANCE 60 FPS CANVAS RENDERER
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

      // Layout Proportions (Exact Match with Reference Photo)
      const profileWidth = 180; // Dedicated wide zone for right volume profile & price ladder
      const bottomHistHeight = 110; // Bottom volume histogram sub-panel height
      const chartWidth = w - profileWidth;
      const chartHeight = h - bottomHistHeight;

      // Price Scaling
      const basePrice = livePrice;
      const pSpan = currentConfig.typicalSpanPts / priceZoom;
      const centerPrice = basePrice + panOffsetY;
      const minP = centerPrice - pSpan / 2;
      const maxP = centerPrice + pSpan / 2;

      const priceToY = (p: number) => {
        return chartHeight - ((p - minP) / pSpan) * chartHeight;
      };

      // ─────────────────────────────────────────────────────────────────────
      // 1. DEEP DARK NAVY BACKGROUND & SUBTLE STRATA
      // ─────────────────────────────────────────────────────────────────────
      ctx.fillStyle = '#040918';
      ctx.fillRect(0, 0, w, h);

      // Subtle horizontal gradient strata across the heatmap field
      const bgGrad = ctx.createLinearGradient(0, 0, 0, chartHeight);
      bgGrad.addColorStop(0, '#040b1e');
      bgGrad.addColorStop(0.3, '#05122c');
      bgGrad.addColorStop(0.7, '#040e22');
      bgGrad.addColorStop(1, '#030816');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, chartWidth, chartHeight);

      // Multi-layer ambient resting depth (shades of deep blue / light blue noise)
      const numStrata = 42;
      for (let i = 0; i < numStrata; i++) {
        const sy = (i / numStrata) * chartHeight;
        const wave = Math.sin(i * 0.42) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(13, 80, 160, ${0.08 + wave * 0.12})`;
        ctx.fillRect(0, sy, chartWidth, chartHeight / numStrata);
      }

      // ─────────────────────────────────────────────────────────────────────
      // 2. 4 MAJOR GLOWING FIERY RED/ORANGE WALLS & ELECTRIC CYAN BEAM
      // (1:1 Exact Match with the blazing bands in photo)
      // ─────────────────────────────────────────────────────────────────────
      for (const wall of currentConfig.restingWalls) {
        const wallPrice = basePrice + wall.priceOffset;
        const wallY = priceToY(wallPrice);

        if (wallY < -40 || wallY > chartHeight + 40) continue;

        const thick = wall.thickness;

        if (wall.type === 'FIERY_RED_ORANGE') {
          // 🔥 BLAZING FIERY GLOWING RED / ORANGE BAND
          // Layer 1: Wide Outer Fiery Orange/Red Bloom
          const bloom = ctx.createLinearGradient(0, wallY - thick * 2.4, 0, wallY + thick * 2.4);
          bloom.addColorStop(0, 'rgba(255, 30, 0, 0)');
          bloom.addColorStop(0.2, 'rgba(255, 60, 0, 0.45)');
          bloom.addColorStop(0.5, 'rgba(255, 120, 0, 0.95)');
          bloom.addColorStop(0.8, 'rgba(255, 60, 0, 0.45)');
          bloom.addColorStop(1, 'rgba(255, 30, 0, 0)');

          ctx.fillStyle = bloom;
          ctx.fillRect(0, wallY - thick * 2.4, chartWidth, thick * 4.8);

          // Layer 2: Solid Glowing Crimson-Red Body
          ctx.fillStyle = '#ff1e00';
          ctx.fillRect(0, wallY - thick * 0.6, chartWidth, thick * 1.2);

          // Layer 3: Blazing Hot Yellow Core
          ctx.fillStyle = '#ffdd00';
          ctx.fillRect(0, wallY - 2.5, chartWidth, 5);

          // Layer 4: Incandescent White-Hot Laser Center
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, wallY - 0.75, chartWidth, 1.5);
        } else {
          // ⚡ ELECTRIC LIGHT-BLUE / CYAN NEON BEAM
          const cyanBloom = ctx.createLinearGradient(0, wallY - thick * 2.0, 0, wallY + thick * 2.0);
          cyanBloom.addColorStop(0, 'rgba(0, 229, 255, 0)');
          cyanBloom.addColorStop(0.5, 'rgba(0, 229, 255, 0.85)');
          cyanBloom.addColorStop(1, 'rgba(0, 229, 255, 0)');

          ctx.fillStyle = cyanBloom;
          ctx.fillRect(0, wallY - thick * 2.0, chartWidth, thick * 4.0);

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(0, wallY - thick * 0.5, chartWidth, thick);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, wallY - 1, chartWidth, 2);
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // 3. VERTICAL DOTTED TIME GRID LINES
      // ─────────────────────────────────────────────────────────────────────
      ctx.strokeStyle = '#0e243e';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      const numCols = 7;
      for (let c = 1; c < numCols; c++) {
        const gx = (c / numCols) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, chartHeight);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ─────────────────────────────────────────────────────────────────────
      // 4. LIVE MARKET PRICE DOTTED HORIZONTAL LINE
      // ─────────────────────────────────────────────────────────────────────
      const livePriceY = priceToY(livePrice);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(0, livePriceY);
      ctx.lineTo(chartWidth, livePriceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ─────────────────────────────────────────────────────────────────────
      // 5. PRICE PATH & 3D TRANSLUCENT VOLUME BUBBLES ALONG PRICE LINE
      // ─────────────────────────────────────────────────────────────────────
      // Price path line connecting the trade bubbles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < chartPatterns.bubbles.length; i++) {
        const b = chartPatterns.bubbles[i];
        const bx = b.progressX * chartWidth;
        const by = priceToY(basePrice + b.priceOffset);
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.lineTo(chartWidth * 0.56, livePriceY);
      ctx.stroke();

      // Draw 3D Translucent Two-Tone Glass Bubbles
      for (const b of chartPatterns.bubbles) {
        const bx = b.progressX * chartWidth;
        const by = priceToY(basePrice + b.priceOffset);
        const r = b.radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.clip();

        // Top Half: Vibrant Green/Teal (#00e5ff)
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(bx - r, by - r, r * 2, r);

        // Bottom Half: Vibrant Crimson Red (#ef4444)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx - r, by, r * 2, r);

        // 3D Spherical Specular Light Reflection
        const sphereGrad = ctx.createRadialGradient(
          bx - r * 0.35,
          by - r * 0.35,
          r * 0.08,
          bx,
          by,
          r
        );
        sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
        sphereGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.38)');
        sphereGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.2)');
        sphereGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

        ctx.fillStyle = sphereGrad;
        ctx.fillRect(bx - r, by - r, r * 2, r * 2);

        ctx.restore();

        // Dark crisp border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────────────
      // 6. RIGHT-SIDE VERTICAL VOLUME PROFILE & LARGE PRICE LADDER
      // (Exact match with right side of reference photo)
      // ─────────────────────────────────────────────────────────────────────
      ctx.fillStyle = '#030714';
      ctx.fillRect(chartWidth, 0, profileWidth, chartHeight);

      // Separator line
      ctx.strokeStyle = '#0e243e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartWidth, 0);
      ctx.lineTo(chartWidth, chartHeight);
      ctx.stroke();

      // Top Ask Volume Profile (Neon Pink / Magenta Curved Hills)
      for (const ap of chartPatterns.askProfile) {
        const ay = priceToY(basePrice + ap.priceOffset);
        const peakWidth = Math.min(85, (ap.volume / 160) * 85);
        const rY = ap.radiusY;

        // Smooth Curved Mountain Profile (Gaussian shape)
        ctx.beginPath();
        ctx.moveTo(chartWidth, ay - rY);
        ctx.quadraticCurveTo(chartWidth + peakWidth * 1.05, ay, chartWidth, ay + rY);
        ctx.closePath();

        const askGrad = ctx.createLinearGradient(chartWidth, 0, chartWidth + peakWidth, 0);
        askGrad.addColorStop(0, '#ff1744');
        askGrad.addColorStop(1, '#f43f5e');
        ctx.fillStyle = askGrad;
        ctx.fill();

        // White Peak Label on the hill
        if (ap.peakLabel) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(ap.peakLabel, chartWidth + peakWidth + 4, ay + 3.5);
        }
      }

      // Bottom Bid Volume Profile (Neon Teal Curved Hills)
      for (const bp of chartPatterns.bidProfile) {
        const by = priceToY(basePrice + bp.priceOffset);
        const peakWidth = Math.min(85, (bp.volume / 150) * 85);
        const rY = bp.radiusY;

        // Smooth Curved Mountain Profile
        ctx.beginPath();
        ctx.moveTo(chartWidth, by - rY);
        ctx.quadraticCurveTo(chartWidth + peakWidth * 1.05, by, chartWidth, by + rY);
        ctx.closePath();

        const bidGrad = ctx.createLinearGradient(chartWidth, 0, chartWidth + peakWidth, 0);
        bidGrad.addColorStop(0, '#00e5ff');
        bidGrad.addColorStop(1, '#06b6d4');
        ctx.fillStyle = bidGrad;
        ctx.fill();

        // White Peak Label on the hill
        if (bp.peakLabel) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(bp.peakLabel, chartWidth + peakWidth + 4, by + 3.5);
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // 7. LARGE, BOLD, PROMINENT PRICE LADDER ON FAR RIGHT
      // Addresses user issue: "Iske andar price Chhota dikh raha hai"
      // ─────────────────────────────────────────────────────────────────────
      const ladderStep = currentConfig.priceLadderStep;
      const startPrice = Math.floor(minP / ladderStep) * ladderStep;
      const endPrice = Math.ceil(maxP / ladderStep) * ladderStep;

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px "JetBrains Mono", monospace'; // Large bold font
      ctx.textAlign = 'right';

      for (let p = startPrice; p <= endPrice; p += ladderStep) {
        const py = priceToY(p);
        if (py < 15 || py > chartHeight - 15) continue;

        ctx.fillText(p.toFixed(currentConfig.decimals), w - 8, py + 4.5);

        // Tick mark
        ctx.strokeStyle = '#1e385c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w - 75, py);
        ctx.lineTo(w - 68, py);
        ctx.stroke();
      }

      // PROMINENT BOXED CURRENT LIVE PRICE BADGE (e.g. 4064.0 matching photo)
      const badgeW = 76;
      const badgeH = 22;
      const badgeX = w - badgeW - 4;
      const badgeY = livePriceY - badgeH / 2;

      // Solid White Box with Black Bold Text (Instant High Contrast)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(livePrice.toFixed(currentConfig.decimals), badgeX + badgeW / 2, badgeY + 15.5);

      // ─────────────────────────────────────────────────────────────────────
      // 8. BOTTOM VOLUME HISTOGRAM SUB-PANEL
      // (1:1 with bottom row in photo: numbers 56, 52, 33, 27, 31, 35, 10)
      // ─────────────────────────────────────────────────────────────────────
      ctx.fillStyle = '#020614';
      ctx.fillRect(0, chartHeight, w, bottomHistHeight);

      // Separator
      ctx.strokeStyle = '#0e243e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, chartHeight);
      ctx.lineTo(w, chartHeight);
      ctx.stroke();

      const histBaseY = h - 22;
      const colWidth = Math.max(14, (chartWidth / chartPatterns.histBars.length) * 0.65);

      for (const bar of chartPatterns.histBars) {
        const bx = bar.progressX * chartWidth;
        const total = bar.total;
        const maxH = bottomHistHeight - 34;
        const barH = Math.min(maxH, Math.max(14, (total / 60) * maxH));

        const buyH = barH * (bar.buyVol / total);
        const sellH = barH - buyH;

        // Teal Buy Volume on bottom
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(bx - colWidth / 2, histBaseY - buyH, colWidth, buyH);

        // Crimson Sell Volume on top
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx - colWidth / 2, histBaseY - barH, colWidth, sellH);

        // White Peak Label directly above bar
        if (bar.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(bar.label, bx, histBaseY - barH - 4);
        }
      }

      // Time labels along bottom (matching 19:54:49)
      const timeLabels = ['19:54:15', '19:54:30', '19:54:49', '19:55:00', '19:55:15'];
      for (let t = 0; t < timeLabels.length; t++) {
        const tx = (t / (timeLabels.length - 1)) * (chartWidth - 100) + 50;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabels[t], tx, h - 6);
      }

      // ─────────────────────────────────────────────────────────────────────
      // 9. BRIGHT YELLOW CROSSHAIR (#ffd700) & SIGNATURE TOOLTIP BOX
      // (1:1 exact match with yellow line and box in photo)
      // ─────────────────────────────────────────────────────────────────────
      if (hoverInfo && hoverInfo.visible && hoverInfo.x <= chartWidth && hoverInfo.y <= chartHeight) {
        // Full-height vertical yellow line
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hoverInfo.x, 0);
        ctx.lineTo(hoverInfo.x, chartHeight);
        ctx.stroke();

        // Horizontal dotted yellow line
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(0, hoverInfo.y);
        ctx.lineTo(chartWidth, hoverInfo.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Signature Bookmap Dark Tooltip Box (matching 4064.9 | 19:54:49 | Vol: +3 ASK)
        const tooltipW = 104;
        const tooltipH = 52;
        const tooltipX = Math.min(hoverInfo.x + 12, chartWidth - tooltipW - 8);
        const tooltipY = Math.max(8, Math.min(hoverInfo.y - 25, chartHeight - tooltipH - 8));

        ctx.fillStyle = 'rgba(2, 6, 20, 0.96)';
        ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, tooltipW, tooltipH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(hoverInfo.price.toFixed(currentConfig.decimals), tooltipX + 8, tooltipY + 16);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9.5px "JetBrains Mono", monospace';
        ctx.fillText(hoverInfo.timeStr, tooltipX + 8, tooltipY + 31);

        ctx.fillStyle = '#00e5ff';
        ctx.fillText(hoverInfo.volStr, tooltipX + 8, tooltipY + 45);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    livePrice,
    priceZoom,
    panOffsetY,
    currentConfig,
    chartPatterns,
    hoverInfo
  ]);

  // Handle Resize for 4k / Retina screens
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
  // MOUSE & TOUCH INTERACTIONS
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

    const profileWidth = 180;
    const bottomHistHeight = 110;
    const chartW = rect.width - profileWidth;
    const chartH = rect.height - bottomHistHeight;

    // Pan Dragging
    if (isDraggingRef.current) {
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const pSpan = currentConfig.typicalSpanPts / priceZoom;
      const priceDelta = (dy / chartH) * pSpan;

      setPanOffsetY((prev) => prev + priceDelta);
      return;
    }

    if (x > chartW || y > chartH) return;

    const pSpan = currentConfig.typicalSpanPts / priceZoom;
    const centerP = livePrice + panOffsetY;
    const curMaxP = centerP + pSpan / 2;
    const priceAtCursor = curMaxP - (y / chartH) * pSpan;

    setHoverInfo({
      visible: true,
      x,
      y,
      price: priceAtCursor,
      timeStr: '19:54:49',
      volStr: priceAtCursor >= livePrice ? 'Vol: +3 ASK' : 'Vol: -5 BID'
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setPriceZoom((z) => Math.min(4.5, z * 1.12));
    } else {
      setPriceZoom((z) => Math.max(0.35, z * 0.89));
    }
  };

  return (
    <div className="bookmap-root-terminal flex flex-col w-full h-[calc(100vh-105px)] min-h-[680px] bg-[#020614] text-slate-100 rounded-md overflow-hidden border border-[#0e243e] shadow-2xl select-none font-sans">
      {/* ── TOP BOOKMAP SOFTWARE CHROME HEADER (EXACT PHOTO MATCH) ── */}
      <header className="flex items-center justify-between bg-[#080e1c] px-3 py-1.5 border-b border-[#0e243e] text-xs font-mono select-none">
        {/* Left: Window Icons & Dropdowns matching photo */}
        <div className="flex items-center gap-2.5">
          <button className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="Settings">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button className="text-slate-400 hover:text-white flex items-center gap-0.5 text-[11px]" title="Pause / Play">
            <span className="font-bold">❚❚</span>
          </button>

          {/* Active Contract Selector Pill (#GCZ6 matching photo) */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#030714] border border-cyan-500/50 text-cyan-300 font-bold text-xs">
            <span className="text-white font-extrabold">{currentConfig.contractCode}</span>
            <span className="text-[10px] text-slate-400">· {currentConfig.venue}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-300 text-[11px]">
            <button className="flex items-center gap-0.5 hover:text-white">
              <span>Settings</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-0.5 hover:text-white">
              <Pencil className="w-3 h-3" />
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            <button className="flex items-center gap-0.5 hover:text-white">
              <Layers className="w-3 h-3" />
              <span>Indicators</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button className="hover:text-white">
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center: "Heatmap" Title + 5 Instant Clickable Asset Tabs */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-200 tracking-wide hidden md:inline">Heatmap</span>

          <nav className="flex items-center gap-1 bg-[#030714] p-0.5 rounded-md border border-slate-800" aria-label="Asset Tabs">
            {(Object.keys(ASSET_REGISTRY) as BookmapAssetKey[]).map((k) => {
              const isActive = activeAsset === k;
              return (
                <button
                  key={k}
                  onClick={() => handleSelectAsset(k)}
                  className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{k}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-2 text-slate-400">
          <button className="p-1 hover:text-white rounded" title="Link Chart">
            <Link className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleSnapshot} className="p-1 hover:text-white rounded" title="Snapshot">
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleRecenter} className="p-1 hover:text-cyan-300 rounded" title="Recenter">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleToggleFullscreen} className="p-1 hover:text-white rounded" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE: LEFT TOOLBAR + FULL HEATMAP CANVAS ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Vertical Bookmap Toolstrip */}
        <aside className="w-8 shrink-0 bg-[#060c18] border-r border-[#0e243e] flex flex-col items-center py-2.5 gap-2.5 text-slate-400 z-10 select-none">
          <button
            onClick={() => setActiveTool('CROSSHAIR')}
            title="Crosshair Tool"
            className={`p-1 rounded transition ${activeTool === 'CROSSHAIR' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('PAN')}
            title="Hand Tool (Pan Chart)"
            className={`p-1 rounded transition ${activeTool === 'PAN' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('TRENDLINE')}
            title="Trendline Tool"
            className={`p-1 rounded transition ${activeTool === 'TRENDLINE' ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            title="Horizontal Ray"
            className="p-1 font-mono text-xs font-bold hover:bg-slate-800 hover:text-white rounded"
          >
            ―
          </button>

          <div className="h-px w-4 bg-slate-800 my-0.5" />

          <button onClick={() => setPriceZoom((z) => Math.min(4.5, z * 1.15))} title="Zoom In (+)" className="p-1 rounded hover:bg-slate-800 hover:text-white">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setPriceZoom((z) => Math.max(0.35, z * 0.88))} title="Zoom Out (-)" className="p-1 rounded hover:bg-slate-800 hover:text-white">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleRecenter} title="Reset Center" className="p-1 rounded hover:bg-slate-800 hover:text-cyan-300">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </aside>

        {/* Central Canvas Viewport */}
        <div ref={containerRef} className="relative flex-1 bg-[#040918] overflow-hidden">
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
      </div>
    </div>
  );
};

export default BookmapLiquidationTerminalView;
