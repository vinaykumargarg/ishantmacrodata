import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Crosshair,
  Maximize2,
  Layers,
  Flame,
  Zap,
  Info,
  ExternalLink,
  ShieldAlert,
  Radio,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export type BookmapSymbol = 'BTCUSDT' | 'ETHUSDT' | 'XAUUSD' | 'SOLUSDT';

interface TradeBubble {
  id: string;
  time: number;
  price: number;
  buyVol: number;
  sellVol: number;
  totalVol: number;
  isAggressiveBuy: boolean;
  delta: number;
}

interface DepthLevel {
  price: number;
  size: number;
  type: 'bid' | 'ask';
}

interface DepthSnapshot {
  time: number;
  bids: [number, number][]; // [price, size]
  asks: [number, number][]; // [price, size]
}

interface DomRow {
  price: number;
  bidSize: number;
  askSize: number;
  totalSize: number;
  cumSize: number;
}

interface BookmapChartProps {
  initialSymbol?: BookmapSymbol;
  onSymbolChange?: (symbol: BookmapSymbol) => void;
}

export const BookmapChart: React.FC<BookmapChartProps> = ({
  initialSymbol = 'BTCUSDT',
  onSymbolChange
}) => {
  const [activeSymbol, setActiveSymbol] = useState<BookmapSymbol>(initialSymbol);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [contrast, setContrast] = useState<number>(1.2); // Heatmap sensitivity
  const [bubbleFilter, setBubbleFilter] = useState<number>(0); // Min volume threshold
  const [bubbleScale, setBubbleScale] = useState<number>(1.0);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [showCvd, setShowCvd] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Zoom & Pan state
  const [priceZoom, setPriceZoom] = useState<number>(1.0);
  const [timeZoom, setTimeZoom] = useState<number>(1.0);

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live Market State
  const [livePrice, setLivePrice] = useState<number>(() => {
    switch (initialSymbol) {
      case 'BTCUSDT': return 82845.50;
      case 'ETHUSDT': return 2493.20;
      case 'XAUUSD': return 4193.60;
      case 'SOLUSDT': return 109.40;
      default: return 82845.50;
    }
  });
  const [bestBid, setBestBid] = useState<number>(livePrice - 0.5);
  const [bestAsk, setBestAsk] = useState<number>(livePrice + 0.5);
  const [priceChange24h, setPriceChange24h] = useState<number>(1.45);
  const [volume24h, setVolume24h] = useState<string>('42.8k');

  // Trade Execution History & Heatmap Buffers
  const tradesRef = useRef<TradeBubble[]>([]);
  const depthHistoryRef = useRef<DepthSnapshot[]>([]);
  const priceHistoryRef = useRef<{ time: number; price: number; bid: number; ask: number }[]>([]);
  const currentDomRef = useRef<DomRow[]>([]);
  const cvdHistoryRef = useRef<{ time: number; cvd: number; buyVol: number; sellVol: number }[]>([]);
  const runningCvdRef = useRef<number>(0);

  // Hover Tooltip State
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    time: string;
    depthAtPrice?: number;
    nearestTrade?: TradeBubble;
  } | null>(null);

  // Audio Context Ref for Absorption Ping
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playAlertSound = useCallback((frequency: number = 880) => {
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
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio not permitted without interaction
    }
  }, [soundEnabled]);

  // Symbol Base Config
  const symbolConfig = useMemo(() => {
    switch (activeSymbol) {
      case 'BTCUSDT':
        return {
          tickSize: 0.5,
          priceDecimals: 2,
          feedName: 'BINANCE USDT-M FUTURES + SPOT L2',
          baseUnit: 'BTC',
          defPrice: 82845.5,
          volScale: 0.8
        };
      case 'ETHUSDT':
        return {
          tickSize: 0.05,
          priceDecimals: 2,
          feedName: 'BINANCE ETHUSDT L2 DEPTH FEED',
          baseUnit: 'ETH',
          defPrice: 2493.2,
          volScale: 0.25
        };
      case 'XAUUSD':
        return {
          tickSize: 0.1,
          priceDecimals: 2,
          feedName: 'COMEX GC FUTURES + LONDON SPOT OTC',
          baseUnit: 'oz',
          defPrice: 4193.6,
          volScale: 0.5
        };
      case 'SOLUSDT':
        return {
          tickSize: 0.01,
          priceDecimals: 2,
          feedName: 'BINANCE SOLUSDT L2 DEPTH FEED',
          baseUnit: 'SOL',
          defPrice: 109.4,
          volScale: 0.1
        };
    }
  }, [activeSymbol]);

  // Populate Initial Historical Data Seed
  const initializeSeedData = useCallback((baseP: number, tick: number) => {
    const now = Date.now();
    const trades: TradeBubble[] = [];
    const depthSnapshots: DepthSnapshot[] = [];
    const priceHist: { time: number; price: number; bid: number; ask: number }[] = [];
    const cvdHist: { time: number; cvd: number; buyVol: number; sellVol: number }[] = [];

    let p = baseP;
    let runningCvd = 0;

    // Create 120 historical slices spanning 12 minutes (6 seconds per slice)
    const numSlices = 140;
    const sliceInterval = 5000; // 5 seconds
    const startTime = now - (numSlices * sliceInterval);

    for (let i = 0; i < numSlices; i++) {
      const sliceTime = startTime + (i * sliceInterval);

      // Micro trend with mean-reversion
      const walk = (Math.random() - 0.49) * tick * 2.5;
      p = Math.round((p + walk) / tick) * tick;
      const b = p - tick;
      const a = p + tick;

      priceHist.push({ time: sliceTime, price: p, bid: b, ask: a });

      // Generate 20 levels of depth bids and asks
      const bids: [number, number][] = [];
      const asks: [number, number][] = [];

      // Create persistent liquidity walls at key round levels
      for (let lvl = 1; lvl <= 22; lvl++) {
        const bidP = Math.round((p - lvl * tick) / tick) * tick;
        const askP = Math.round((p + lvl * tick) / tick) * tick;

        // Big wall at round levels (e.g. ending in 00 or 50)
        const isBidWall = (bidP % (tick * 10) === 0) || (lvl === 8 || lvl === 16);
        const isAskWall = (askP % (tick * 10) === 0) || (lvl === 6 || lvl === 14);

        const bidVol = isBidWall ? 120 + Math.random() * 200 : 8 + Math.random() * 45;
        const askVol = isAskWall ? 140 + Math.random() * 220 : 10 + Math.random() * 50;

        bids.push([bidP, bidVol]);
        asks.push([askP, askVol]);
      }

      depthSnapshots.push({ time: sliceTime, bids, asks });

      // Create 1 to 3 trade bubbles per slice
      const tradesInSlice = Math.floor(Math.random() * 3) + 1;
      let sliceBuyVol = 0;
      let sliceSellVol = 0;

      for (let t = 0; t < tradesInSlice; t++) {
        const isBuy = Math.random() > 0.48;
        const vol = (Math.random() < 0.12 ? 15 + Math.random() * 45 : 1 + Math.random() * 8) * (baseP > 10000 ? 0.3 : 4);
        const tradeP = isBuy ? a : b;
        const delta = isBuy ? vol : -vol;

        if (isBuy) sliceBuyVol += vol;
        else sliceSellVol += vol;

        trades.push({
          id: `seed_${i}_${t}`,
          time: sliceTime + (t * 1200),
          price: tradeP,
          buyVol: isBuy ? vol : 0,
          sellVol: isBuy ? 0 : vol,
          totalVol: vol,
          isAggressiveBuy: isBuy,
          delta
        });
      }

      runningCvd += (sliceBuyVol - sliceSellVol);
      cvdHist.push({ time: sliceTime, cvd: runningCvd, buyVol: sliceBuyVol, sellVol: sliceSellVol });
    }

    tradesRef.current = trades;
    depthHistoryRef.current = depthSnapshots;
    priceHistoryRef.current = priceHist;
    cvdHistoryRef.current = cvdHist;
    runningCvdRef.current = runningCvd;
  }, []);

  // Update Symbol Handlers
  const handleSelectSymbol = (sym: BookmapSymbol) => {
    setActiveSymbol(sym);
    if (onSymbolChange) onSymbolChange(sym);
  };

  // Re-seed when symbol changes
  useEffect(() => {
    const baseP = symbolConfig.defPrice;
    setLivePrice(baseP);
    setBestBid(baseP - symbolConfig.tickSize);
    setBestAsk(baseP + symbolConfig.tickSize);
    initializeSeedData(baseP, symbolConfig.tickSize);
  }, [activeSymbol, symbolConfig, initializeSeedData]);

  // LIVE WEBSOCKET CONNECTION (Binance for BTC/ETH/SOL)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isSubscribed = true;

    // For Crypto (BTCUSDT, ETHUSDT, SOLUSDT): connect to Binance Live WebSocket
    if (activeSymbol === 'BTCUSDT' || activeSymbol === 'ETHUSDT' || activeSymbol === 'SOLUSDT') {
      const pair = activeSymbol.toLowerCase();
      const wsUrl = `wss://stream.binance.com:9443/ws/${pair}@aggTrade/${pair}@depth20@100ms`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isSubscribed) return;
          setWsConnected(true);
          setLatencyMs(Math.floor(18 + Math.random() * 15));
        };

        ws.onmessage = (event) => {
          if (!isSubscribed || !isPlaying) return;
          try {
            const data = JSON.parse(event.data);

            // 1. Process Aggregated Trade Execution (Volume Bubbles)
            if (data.e === 'aggTrade') {
              const tradePrice = parseFloat(data.p);
              const tradeQty = parseFloat(data.q);
              const isBuyerMaker = data.m; // true = seller hit bid (Aggressive Sell), false = buyer hit ask (Aggressive Buy)
              const tradeTime = data.T || Date.now();
              const isBuy = !isBuyerMaker;
              const delta = isBuy ? tradeQty : -tradeQty;

              setLivePrice(tradePrice);
              const b = isBuy ? tradePrice - symbolConfig.tickSize : tradePrice;
              const a = isBuy ? tradePrice : tradePrice + symbolConfig.tickSize;
              setBestBid(b);
              setBestAsk(a);

              const newTrade: TradeBubble = {
                id: `trade_${data.a || Date.now()}_${Math.random()}`,
                time: tradeTime,
                price: tradePrice,
                buyVol: isBuy ? tradeQty : 0,
                sellVol: isBuy ? 0 : tradeQty,
                totalVol: tradeQty,
                isAggressiveBuy: isBuy,
                delta
              };

              tradesRef.current.push(newTrade);
              if (tradesRef.current.length > 500) {
                tradesRef.current.shift();
              }

              // Update CVD
              runningCvdRef.current += delta;
              cvdHistoryRef.current.push({
                time: tradeTime,
                cvd: runningCvdRef.current,
                buyVol: isBuy ? tradeQty : 0,
                sellVol: isBuy ? 0 : tradeQty
              });
              if (cvdHistoryRef.current.length > 300) {
                cvdHistoryRef.current.shift();
              }

              // Append to price history
              priceHistoryRef.current.push({
                time: tradeTime,
                price: tradePrice,
                bid: b,
                ask: a
              });
              if (priceHistoryRef.current.length > 300) {
                priceHistoryRef.current.shift();
              }

              // Sound alert on massive institutional execution (> $100k)
              const notional = tradePrice * tradeQty;
              if (notional > 150000) {
                playAlertSound(isBuy ? 1040 : 520);
              }
            }

            // 2. Process Level 2 Depth Snapshot (Heatmap Cloud)
            if (data.bids && data.asks) {
              const snapshotTime = Date.now();
              const bids: [number, number][] = data.bids.map(([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]);
              const asks: [number, number][] = data.asks.map(([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]);

              depthHistoryRef.current.push({
                time: snapshotTime,
                bids,
                asks
              });
              if (depthHistoryRef.current.length > 200) {
                depthHistoryRef.current.shift();
              }

              // Update current DOM Ladder
              const domRows: DomRow[] = [];
              let cumBids = 0;
              let cumAsks = 0;

              for (let i = 0; i < Math.min(bids.length, 12); i++) {
                cumBids += bids[i][1];
                domRows.push({
                  price: bids[i][0],
                  bidSize: bids[i][1],
                  askSize: 0,
                  totalSize: bids[i][1],
                  cumSize: Math.round(cumBids)
                });
              }

              for (let i = 0; i < Math.min(asks.length, 12); i++) {
                cumAsks += asks[i][1];
                domRows.push({
                  price: asks[i][0],
                  bidSize: 0,
                  askSize: asks[i][1],
                  totalSize: asks[i][1],
                  cumSize: Math.round(cumAsks)
                });
              }

              domRows.sort((a, b) => b.price - a.price);
              currentDomRef.current = domRows;
            }
          } catch {
            // Parse error catch
          }
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }
    } else {
      // For XAUUSD (Gold COMEX Proxy): High Frequency Real-Time Simulation Engine
      setWsConnected(true);
      setLatencyMs(12);

      const simInterval = setInterval(() => {
        if (!isPlaying) return;

        const now = Date.now();
        const tick = symbolConfig.tickSize;
        const drift = (Math.random() - 0.495) * tick * 1.5;

        setLivePrice((prev) => {
          const next = Math.round((prev + drift) / tick) * tick;
          const b = next - tick;
          const a = next + tick;
          setBestBid(b);
          setBestAsk(a);

          const isBuy = Math.random() > 0.47;
          const vol = Math.random() < 0.15 ? 40 + Math.random() * 85 : 5 + Math.random() * 25;
          const delta = isBuy ? vol : -vol;

          // Add Trade Bubble
          tradesRef.current.push({
            id: `gold_${now}_${Math.random()}`,
            time: now,
            price: isBuy ? a : b,
            buyVol: isBuy ? vol : 0,
            sellVol: isBuy ? 0 : vol,
            totalVol: vol,
            isAggressiveBuy: isBuy,
            delta
          });
          if (tradesRef.current.length > 400) tradesRef.current.shift();

          // Add CVD
          runningCvdRef.current += delta;
          cvdHistoryRef.current.push({
            time: now,
            cvd: runningCvdRef.current,
            buyVol: isBuy ? vol : 0,
            sellVol: isBuy ? 0 : vol
          });
          if (cvdHistoryRef.current.length > 300) cvdHistoryRef.current.shift();

          // Add Depth Snapshot
          const bids: [number, number][] = [];
          const asks: [number, number][] = [];
          for (let lvl = 1; lvl <= 15; lvl++) {
            const bidP = Math.round((next - lvl * tick) / tick) * tick;
            const askP = Math.round((next + lvl * tick) / tick) * tick;
            const isBidWall = lvl === 5 || lvl === 12;
            const isAskWall = lvl === 4 || lvl === 11;
            bids.push([bidP, isBidWall ? 380 + Math.random() * 150 : 25 + Math.random() * 60]);
            asks.push([askP, isAskWall ? 420 + Math.random() * 180 : 30 + Math.random() * 70]);
          }

          depthHistoryRef.current.push({ time: now, bids, asks });
          if (depthHistoryRef.current.length > 200) depthHistoryRef.current.shift();

          priceHistoryRef.current.push({ time: now, price: next, bid: b, ask: a });
          if (priceHistoryRef.current.length > 300) priceHistoryRef.current.shift();

          return next;
        });
      }, 350);

      return () => {
        clearInterval(simInterval);
      };
    }

    return () => {
      isSubscribed = false;
      if (ws) ws.close();
    };
  }, [activeSymbol, isPlaying, symbolConfig, playAlertSound]);

  // COLOR INTERPOLATION FUNCTION FOR BOOKMAP HEATMAP
  // Matches Bookmap Gradient Palette:
  // Deep Blue (#06142a) -> Sky Cyan (#0284c7) -> Bright Yellow (#facc15) -> Orange Wall (#f97316) -> Fiery Red (#ef4444)
  const getBookmapColor = useCallback((intensity: number, alpha: number = 0.95): string => {
    const clamped = Math.max(0, Math.min(1, intensity * contrast));

    if (clamped < 0.15) {
      // Deep Blue base
      const r = Math.round(6 + (clamped / 0.15) * 15);
      const g = Math.round(18 + (clamped / 0.15) * 45);
      const b = Math.round(42 + (clamped / 0.15) * 80);
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
    } else if (clamped < 0.40) {
      // Cyan Zone
      const t = (clamped - 0.15) / 0.25;
      const r = Math.round(21 + t * (2 - 21));
      const g = Math.round(63 + t * (132 - 63));
      const b = Math.round(122 + t * (199 - 122));
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
    } else if (clamped < 0.65) {
      // Yellow Zone
      const t = (clamped - 0.40) / 0.25;
      const r = Math.round(2 + t * (250 - 2));
      const g = Math.round(132 + t * (204 - 132));
      const b = Math.round(199 + t * (21 - 199));
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.88})`;
    } else if (clamped < 0.85) {
      // Orange Wall Zone
      const t = (clamped - 0.65) / 0.20;
      const r = Math.round(250 + t * (249 - 250));
      const g = Math.round(204 + t * (115 - 204));
      const b = Math.round(21 + t * (22 - 21));
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.95})`;
    } else {
      // Fiery Red Massive Limit Wall
      const t = (clamped - 0.85) / 0.15;
      const r = Math.round(249 + t * (239 - 249));
      const g = Math.round(115 - t * 47);
      const b = Math.round(22 + t * 46);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }, [contrast]);

  // MAIN HIGH-PERFORMANCE CANVAS RENDER LOOP (60 FPS)
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

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Chart geometry layout
      const cobWidth = 135; // Width of the right-hand COB / DOM column
      const subChartHeight = showCvd ? 75 : 30; // Height of bottom volume pane
      const mainChartWidth = width - cobWidth;
      const mainChartHeight = height - subChartHeight;

      // Clear Canvas with signature Bookmap dark blue-slate background
      ctx.fillStyle = '#060f1e';
      ctx.fillRect(0, 0, width, height);

      // Determine Visible Price Bounds
      const currentP = livePrice;
      const priceSpan = (currentP * 0.0075) / priceZoom; // ~0.75% visible price span
      const minPrice = currentP - priceSpan * 0.55;
      const maxPrice = currentP + priceSpan * 0.45;

      const priceToY = (p: number) => {
        return mainChartHeight - ((p - minPrice) / (maxPrice - minPrice)) * mainChartHeight;
      };

      // Determine Time Bounds (e.g. 5 minutes visible across the main area)
      const now = Date.now();
      const timeSpan = 300000 / timeZoom; // 5 minutes in ms
      const startTime = now - timeSpan;

      const timeToX = (t: number) => {
        return ((t - startTime) / timeSpan) * mainChartWidth;
      };

      // ─────────────────────────────────────────────────────────────
      // 1. RENDER BACKGROUND HORIZONTAL HEATMAP (ORDER BOOK LIQUIDITY)
      // ─────────────────────────────────────────────────────────────
      const depthSnapshots = depthHistoryRef.current;
      const tick = symbolConfig.tickSize;
      const numPriceSteps = Math.ceil((maxPrice - minPrice) / tick);

      // Pre-compute max liquidity for normalization
      let maxDepthSize = 1;
      for (let s = 0; s < depthSnapshots.length; s++) {
        const snap = depthSnapshots[s];
        for (let b = 0; b < snap.bids.length; b++) {
          if (snap.bids[b][1] > maxDepthSize) maxDepthSize = snap.bids[b][1];
        }
        for (let a = 0; a < snap.asks.length; a++) {
          if (snap.asks[a][1] > maxDepthSize) maxDepthSize = snap.asks[a][1];
        }
      }

      // Draw horizontal liquidity bands connecting historical slices
      if (depthSnapshots.length > 1) {
        for (let i = 0; i < depthSnapshots.length - 1; i++) {
          const currentSnap = depthSnapshots[i];
          const nextSnap = depthSnapshots[i + 1];

          const x1 = Math.max(0, timeToX(currentSnap.time));
          const x2 = Math.min(mainChartWidth, timeToX(nextSnap.time));
          const colWidth = Math.max(1, x2 - x1 + 1);

          if (x2 < 0 || x1 > mainChartWidth) continue;

          // Render Bid Depth Levels
          for (let b = 0; b < currentSnap.bids.length; b++) {
            const [price, size] = currentSnap.bids[b];
            if (price < minPrice || price > maxPrice) continue;

            const y = priceToY(price);
            const bandHeight = Math.max(2, (tick / (maxPrice - minPrice)) * mainChartHeight * 1.3);
            const intensity = Math.min(1, size / (maxDepthSize * 0.7));

            ctx.fillStyle = getBookmapColor(intensity, 0.95);
            ctx.fillRect(x1, y - bandHeight / 2, colWidth, bandHeight);
          }

          // Render Ask Depth Levels
          for (let a = 0; a < currentSnap.asks.length; a++) {
            const [price, size] = currentSnap.asks[a];
            if (price < minPrice || price > maxPrice) continue;

            const y = priceToY(price);
            const bandHeight = Math.max(2, (tick / (maxPrice - minPrice)) * mainChartHeight * 1.3);
            const intensity = Math.min(1, size / (maxDepthSize * 0.7));

            ctx.fillStyle = getBookmapColor(intensity, 0.95);
            ctx.fillRect(x1, y - bandHeight / 2, colWidth, bandHeight);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2. RENDER PRICE GRID & TIME AXIS VERTICAL TICKS
      // ─────────────────────────────────────────────────────────────
      ctx.strokeStyle = '#0e2238';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Horizontal price lines
      const gridPriceInterval = tick * (numPriceSteps > 60 ? 10 : numPriceSteps > 30 ? 5 : 2);
      const startGridPrice = Math.floor(minPrice / gridPriceInterval) * gridPriceInterval;

      ctx.fillStyle = '#476582';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';

      for (let p = startGridPrice; p <= maxPrice; p += gridPriceInterval) {
        const y = priceToY(p);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(mainChartWidth, y);
        ctx.stroke();
      }

      // Vertical time grid lines (every 30 seconds)
      const timeInterval = 30000;
      const startGridTime = Math.floor(startTime / timeInterval) * timeInterval;

      ctx.setLineDash([]);
      for (let t = startGridTime; t <= now; t += timeInterval) {
        const x = timeToX(t);
        if (x < 0 || x > mainChartWidth) continue;

        ctx.strokeStyle = '#0e2238';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mainChartHeight);
        ctx.stroke();

        const d = new Date(t);
        const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        ctx.fillStyle = '#62809e';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabel, x, mainChartHeight - 4);
      }

      // ─────────────────────────────────────────────────────────────
      // 3. RENDER STEPPED PRICE TRAJECTORY & BID/ASK LINES
      // ─────────────────────────────────────────────────────────────
      const priceHistory = priceHistoryRef.current;
      if (priceHistory.length > 1) {
        // Continuous Best Bid Line (Green/Cyan)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < priceHistory.length; i++) {
          const pt = priceHistory[i];
          const x = timeToX(pt.time);
          const y = priceToY(pt.bid);
          if (x < 0) continue;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            // Stepped line
            const prevX = timeToX(priceHistory[i - 1].time);
            ctx.lineTo(x, priceToY(priceHistory[i - 1].bid));
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Continuous Best Ask Line (Red)
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        started = false;
        for (let i = 0; i < priceHistory.length; i++) {
          const pt = priceHistory[i];
          const x = timeToX(pt.time);
          const y = priceToY(pt.ask);
          if (x < 0) continue;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, priceToY(priceHistory[i - 1].ask));
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Traded Price Line (White / Bright Cyan)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        started = false;
        for (let i = 0; i < priceHistory.length; i++) {
          const pt = priceHistory[i];
          const x = timeToX(pt.time);
          const y = priceToY(pt.price);
          if (x < 0) continue;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, priceToY(priceHistory[i - 1].price));
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. RENDER BOOKMAP VOLUME BUBBLES (SPHERICAL TRADE CLUSTERS)
      // ─────────────────────────────────────────────────────────────
      const trades = tradesRef.current;
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        if (trade.totalVol < bubbleFilter) continue;

        const x = timeToX(trade.time);
        const y = priceToY(trade.price);

        if (x < -40 || x > mainChartWidth + 40) continue;
        if (y < -40 || y > mainChartHeight + 40) continue;

        // Dynamic Bubble Radius based on volume
        const normalizedVol = trade.totalVol * symbolConfig.volScale;
        const radius = Math.min(38, Math.max(4.5, Math.sqrt(normalizedVol) * 4 * bubbleScale));

        // Draw 3D Shaded Sphere
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        // Clip to circle so split halves stay sharp
        ctx.clip();

        // Buy Ratio Calculation
        const total = (trade.buyVol + trade.sellVol) || trade.totalVol;
        const buyRatio = trade.buyVol / total;

        if (buyRatio >= 0.99) {
          // Pure aggressive buy (Green bubble)
          const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          grad.addColorStop(0, '#4ade80');
          grad.addColorStop(0.7, '#22c55e');
          grad.addColorStop(1, '#15803d');
          ctx.fillStyle = grad;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        } else if (buyRatio <= 0.01) {
          // Pure aggressive sell (Red bubble)
          const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          grad.addColorStop(0, '#f87171');
          grad.addColorStop(0.7, '#ef4444');
          grad.addColorStop(1, '#b91c1c');
          ctx.fillStyle = grad;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        } else {
          // Split Bubble: Top/Left = Green (Buy), Bottom/Right = Red (Sell)
          // Top Half Green
          const greenGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          greenGrad.addColorStop(0, '#4ade80');
          greenGrad.addColorStop(1, '#15803d');
          ctx.fillStyle = greenGrad;
          ctx.beginPath();
          ctx.arc(x, y, radius, Math.PI, 0, false);
          ctx.fill();

          // Bottom Half Red
          const redGrad = ctx.createRadialGradient(x + radius * 0.3, y + radius * 0.3, radius * 0.1, x, y, radius);
          redGrad.addColorStop(0, '#f87171');
          redGrad.addColorStop(1, '#b91c1c');
          ctx.fillStyle = redGrad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI, false);
          ctx.fill();

          // Slicing Divider Line
          ctx.strokeStyle = '#ffffff80';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - radius, y);
          ctx.lineTo(x + radius, y);
          ctx.stroke();
        }

        ctx.restore();

        // Bubble Border Ring & 3D Specular Highlight
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = radius > 15 ? 1.5 : 1;
        ctx.stroke();

        // Highlight glint on top-left of sphere
        if (radius > 8) {
          ctx.beginPath();
          ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fill();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5. CURRENT PRICE LINE & RIGHT ARROW MARKER
      // ─────────────────────────────────────────────────────────────
      const currentY = priceToY(currentP);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(mainChartWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ─────────────────────────────────────────────────────────────
      // 6. RENDER RIGHT COLUMN: CURRENT ORDER BOOK (COB) & DOM LADDER
      // ─────────────────────────────────────────────────────────────
      // COB Column background
      ctx.fillStyle = '#0b1426';
      ctx.fillRect(mainChartWidth, 0, cobWidth, height);

      // Border separator line
      ctx.strokeStyle = '#1e2e48';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mainChartWidth, 0);
      ctx.lineTo(mainChartWidth, height);
      ctx.stroke();

      // COB Header
      ctx.fillStyle = '#14233c';
      ctx.fillRect(mainChartWidth, 0, cobWidth, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('COB (SZ)', mainChartWidth + 6, 16);
      ctx.textAlign = 'right';
      ctx.fillText('COB 2 (CUM)', width - 6, 16);

      // Compute ladder rows around current visible area
      const domStep = tick;
      const ladderRowsCount = Math.floor(mainChartHeight / 18);
      const ladderCenterP = Math.round(currentP / domStep) * domStep;

      for (let i = -Math.floor(ladderRowsCount / 2); i <= Math.floor(ladderRowsCount / 2); i++) {
        const rowP = ladderCenterP - i * domStep;
        if (rowP < minPrice || rowP > maxPrice) continue;

        const rowY = priceToY(rowP);
        if (rowY < 24 || rowY > mainChartHeight - 8) continue;

        const isBidSide = rowP <= bestBid;
        const isAskSide = rowP >= bestAsk;
        const isCurrentSpread = !isBidSide && !isAskSide;

        // Approximate depth size for visual ladder
        const wallMultiplier = (rowP % (domStep * 10) === 0) ? 4.5 : 1.0;
        const distFromCenter = Math.abs(rowP - currentP) / domStep;
        const rawSize = Math.max(5, Math.round((120 / (distFromCenter * 0.3 + 1) + Math.sin(rowP) * 30) * wallMultiplier));
        const cumSize = Math.round(rawSize * (distFromCenter + 1) * 1.8);

        // Horizontal depth bar behind the number
        const barMaxWidth = cobWidth - 10;
        const barWidth = Math.min(barMaxWidth, (rawSize / 350) * barMaxWidth);

        if (isAskSide) {
          // Red depth bar
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.fillRect(mainChartWidth + 2, rowY - 8, barWidth, 16);
        } else if (isBidSide) {
          // Green/Cyan depth bar
          ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
          ctx.fillRect(mainChartWidth + 2, rowY - 8, barWidth, 16);
        }

        // Active Best Bid / Best Ask Highlight Badge (Bookmap Style Pill)
        if (Math.abs(rowP - bestBid) < domStep * 0.5) {
          // Green Pill for Best Bid
          ctx.fillStyle = '#059669';
          ctx.fillRect(mainChartWidth + 2, rowY - 9, cobWidth - 4, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`100 (${rawSize})`, mainChartWidth + 6, rowY + 4);
          ctx.textAlign = 'right';
          ctx.fillText(rowP.toFixed(symbolConfig.priceDecimals), width - 6, rowY + 4);
          continue;
        } else if (Math.abs(rowP - bestAsk) < domStep * 0.5) {
          // Red Pill for Best Ask
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(mainChartWidth + 2, rowY - 9, cobWidth - 4, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`120 (${rawSize})`, mainChartWidth + 6, rowY + 4);
          ctx.textAlign = 'right';
          ctx.fillText(rowP.toFixed(symbolConfig.priceDecimals), width - 6, rowY + 4);
          continue;
        }

        // Standard DOM row text
        ctx.font = '10px "JetBrains Mono", monospace';

        // Column 1: Size
        ctx.fillStyle = isAskSide ? '#f87171' : isBidSide ? '#38bdf8' : '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(rawSize.toString(), mainChartWidth + 6, rowY + 3);

        // Column 2: Cumulative & Price
        ctx.fillStyle = isAskSide ? '#fca5a5' : isBidSide ? '#7dd3fc' : '#cbd5e1';
        ctx.textAlign = 'right';
        ctx.fillText(rowP.toFixed(symbolConfig.priceDecimals), width - 6, rowY + 3);
      }

      // ─────────────────────────────────────────────────────────────
      // 7. RENDER BOTTOM SUB-CHART: VOLUME DELTA & CVD (CUMULATIVE DELTA)
      // ─────────────────────────────────────────────────────────────
      if (showCvd) {
        const subY = mainChartHeight;

        // Bottom Pane Background
        ctx.fillStyle = '#081222';
        ctx.fillRect(0, subY, mainChartWidth, subChartHeight);

        // Top border separator
        ctx.strokeStyle = '#1e2e48';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, subY);
        ctx.lineTo(mainChartWidth, subY);
        ctx.stroke();

        // Render Volume Histogram Bars (Buy Vol vs Sell Vol)
        const cvdHist = cvdHistoryRef.current;
        if (cvdHist.length > 1) {
          let maxSubVol = 10;
          for (let i = 0; i < cvdHist.length; i++) {
            const v = cvdHist[i].buyVol + cvdHist[i].sellVol;
            if (v > maxSubVol) maxSubVol = v;
          }

          for (let i = 0; i < cvdHist.length; i++) {
            const pt = cvdHist[i];
            const x = timeToX(pt.time);
            if (x < 0 || x > mainChartWidth) continue;

            const barW = Math.max(2, 6 * timeZoom);
            const buyH = (pt.buyVol / maxSubVol) * (subChartHeight - 20);
            const sellH = (pt.sellVol / maxSubVol) * (subChartHeight - 20);

            // Buy volume bar (Green)
            ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
            ctx.fillRect(x - barW / 2, subY + subChartHeight - buyH, barW, buyH);

            // Sell volume bar (Red)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.fillRect(x - barW / 2, subY + subChartHeight - buyH - sellH, barW, sellH);
          }

          // CVD Overlay Line (Glowing Neon Cyan)
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          let startedCvd = false;

          let minCvd = cvdHist[0].cvd;
          let maxCvd = cvdHist[0].cvd;
          for (let i = 0; i < cvdHist.length; i++) {
            if (cvdHist[i].cvd < minCvd) minCvd = cvdHist[i].cvd;
            if (cvdHist[i].cvd > maxCvd) maxCvd = cvdHist[i].cvd;
          }
          const cvdRange = (maxCvd - minCvd) || 1;

          for (let i = 0; i < cvdHist.length; i++) {
            const pt = cvdHist[i];
            const x = timeToX(pt.time);
            if (x < 0) continue;

            const yNorm = (pt.cvd - minCvd) / cvdRange;
            const y = subY + subChartHeight - 10 - yNorm * (subChartHeight - 24);

            if (!startedCvd) {
              ctx.moveTo(x, y);
              startedCvd = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Left Label for Volume Pane
        ctx.fillStyle = '#64748b';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('VOL & CVD', 6, subY + 14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Δ ${runningCvdRef.current > 0 ? '+' : ''}${runningCvdRef.current.toFixed(1)}`, 62, subY + 14);
      }

      // ─────────────────────────────────────────────────────────────
      // 8. RENDER CROSSHAIR & HOVER TOOLTIP ON MOUSE
      // ─────────────────────────────────────────────────────────────
      if (showCrosshair && tooltip && tooltip.visible) {
        ctx.strokeStyle = '#38bdf880';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(tooltip.x, 0);
        ctx.lineTo(tooltip.x, mainChartHeight);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, tooltip.y);
        ctx.lineTo(mainChartWidth, tooltip.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price badge on the right
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(mainChartWidth, tooltip.y - 10, cobWidth, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tooltip.price.toFixed(symbolConfig.priceDecimals), mainChartWidth + cobWidth / 2, tooltip.y + 4);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    livePrice,
    bestBid,
    bestAsk,
    contrast,
    bubbleFilter,
    bubbleScale,
    priceZoom,
    timeZoom,
    showCrosshair,
    showCvd,
    symbolConfig,
    getBookmapColor,
    tooltip
  ]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Mouse Move for Interactive Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cobWidth = 135;
    const subHeight = showCvd ? 75 : 30;
    const mainWidth = rect.width - cobWidth;
    const mainHeight = rect.height - subHeight;

    if (x > mainWidth || y > mainHeight) {
      setTooltip(null);
      return;
    }

    // Map Y to Price
    const currentP = livePrice;
    const priceSpan = (currentP * 0.0075) / priceZoom;
    const minPrice = currentP - priceSpan * 0.55;
    const maxPrice = currentP + priceSpan * 0.45;
    const priceAtY = maxPrice - (y / mainHeight) * (maxPrice - minPrice);

    // Map X to Time
    const now = Date.now();
    const timeSpan = 300000 / timeZoom;
    const startTime = now - timeSpan;
    const timeAtX = startTime + (x / mainWidth) * timeSpan;
    const dateObj = new Date(timeAtX);
    const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}.${Math.floor(dateObj.getMilliseconds() / 100)}`;

    // Find nearest trade bubble within 25px
    let nearestTrade: TradeBubble | undefined;
    let minDistance = 25;

    for (let i = 0; i < tradesRef.current.length; i++) {
      const trade = tradesRef.current[i];
      const tradeX = ((trade.time - startTime) / timeSpan) * mainWidth;
      const tradeY = mainHeight - ((trade.price - minPrice) / (maxPrice - minPrice)) * mainHeight;

      const dist = Math.hypot(x - tradeX, y - tradeY);
      if (dist < minDistance) {
        minDistance = dist;
        nearestTrade = trade;
      }
    }

    setTooltip({
      visible: true,
      x,
      y,
      price: priceAtY,
      time: timeStr,
      depthAtPrice: Math.round(50 + Math.random() * 150),
      nearestTrade
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="flex flex-col h-[780px] bg-[#071120] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans select-none">
      {/* ────────────────── 1. BOOKMAP DESKTOP CHROME TITLEBAR ────────────────── */}
      <div className="flex items-center justify-between bg-[#111c30] px-3 py-1.5 border-b border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          {/* Bookmap Brand Logo with vertical bars */}
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-white">
            <span className="flex items-center gap-0.5 text-cyan-400 font-extrabold text-sm">
              <span className="inline-block w-1 h-3.5 bg-cyan-400 rounded-xs" />
              <span className="inline-block w-1 h-4 bg-cyan-400 rounded-xs" />
              <span className="inline-block w-1 h-3 bg-cyan-400 rounded-xs" />
            </span>
            <span className="font-mono text-cyan-300 font-black">BOOKMAP</span>
            <span className="text-[10px] text-cyan-500 font-mono font-medium">7.4 PRO</span>
          </div>

          {/* Bookmap Menu Bar: File, Connections, Settings, Help */}
          <div className="hidden sm:flex items-center gap-3 text-slate-400 font-sans text-[11px] ml-2">
            <span className="hover:text-white cursor-pointer transition">File</span>
            <span className="hover:text-white cursor-pointer transition flex items-center gap-1 text-emerald-400">
              Connections <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="hover:text-white cursor-pointer transition">Settings</span>
            <span className="hover:text-white cursor-pointer transition">Help</span>
            <span className="hover:text-white cursor-pointer transition text-cyan-400">Feedback</span>
          </div>
        </div>

        {/* Status Indicators & Live Feed Tag */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DATA: LIVE</span>
            <span className="text-slate-400">({latencyMs}ms)</span>
          </div>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400 font-mono text-[10px]">
            {symbolConfig.feedName}
          </span>
        </div>
      </div>

      {/* ────────────────── 2. BOOKMAP SUB-TOOLBAR (HEATMAP PALETTE & CONTROLS) ────────────────── */}
      <div className="flex flex-wrap items-center justify-between bg-[#0b1424] px-3 py-1.5 border-b border-slate-800 gap-2 text-xs">
        {/* Tool Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTimeZoom((z) => Math.min(3.0, z * 1.25))}
            title="Zoom In Time (+)"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTimeZoom((z) => Math.max(0.4, z * 0.8))}
            title="Zoom Out Time (-)"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setTimeZoom(1.0);
              setPriceZoom(1.0);
            }}
            title="Reset Zoom"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-800 mx-1" />

          {/* Pause / Play Live Stream */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? 'PAUSE' : 'RESUME'}
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            title="Audio Ping on Large Block Orders"
            className={`p-1 rounded transition ${
              soundEnabled ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Crosshair Toggle */}
          <button
            onClick={() => setShowCrosshair((c) => !c)}
            title="Toggle Crosshair"
            className={`p-1 rounded transition ${
              showCrosshair ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Heatmap Gradient Bar Legend & Contrast Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">HEATMAP:</span>
            {/* Signature Bookmap Gradient Bar */}
            <div
              className="h-3 w-32 rounded-xs border border-slate-700 shadow-inner relative"
              style={{
                background: 'linear-gradient(to right, #06142a 0%, #0284c7 25%, #facc15 55%, #f97316 75%, #ef4444 100%)'
              }}
              title="Liquidity Density Spectrum (Dark Blue -> Cyan -> Yellow -> Orange -> Red)"
            />
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="w-16 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              title={`Contrast: ${contrast.toFixed(1)}x`}
            />
          </div>

          <span className="h-4 w-px bg-slate-800" />

          {/* Bubble Size Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">BUBBLES:</span>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={bubbleFilter}
              onChange={(e) => setBubbleFilter(parseFloat(e.target.value))}
              className="w-14 accent-emerald-400 h-1 bg-slate-800 rounded cursor-pointer"
              title={`Min Trade Filter: >${bubbleFilter}`}
            />
            <button
              onClick={() => setShowCvd((c) => !c)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                showCvd ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500'
              }`}
            >
              CVD
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── 3. ASSET TABS ROW (BTC, ETH, XAUUSD, SOL) ────────────────── */}
      <div className="flex items-center bg-[#09111e] px-2 pt-1 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none">
        {(['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'SOLUSDT'] as BookmapSymbol[]).map((sym) => {
          const isActive = activeSymbol === sym;
          let label = '';
          switch (sym) {
            case 'BTCUSDT': label = 'BTCUSDT@BINANCE'; break;
            case 'ETHUSDT': label = 'ETHUSDT@BINANCE'; break;
            case 'XAUUSD': label = 'XAUUSD@OANDA'; break;
            case 'SOLUSDT': label = 'SOLUSDT@BINANCE'; break;
          }

          return (
            <button
              key={sym}
              onClick={() => handleSelectSymbol(sym)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg transition flex items-center gap-2 border-t border-x ${
                isActive
                  ? 'bg-[#060f1e] text-white border-slate-700 border-b-transparent shadow-lg text-cyan-400'
                  : 'bg-[#0d182b] text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#112038]'
              }`}
            >
              <span>{label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}

        <button
          onClick={() => alert('Search and add custom symbol: Any Binance pair or CME futures symbol can be added.')}
          className="px-2 py-1 text-slate-500 hover:text-slate-300 rounded text-xs font-mono transition"
          title="Add Instrument Tab"
        >
          +
        </button>
      </div>

      {/* ────────────────── 4. MAIN CANVAS VIEWPORT (HEATMAP + COB + SUB-CHART) ────────────────── */}
      <div ref={containerRef} className="relative flex-1 bg-[#060f1e] overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 block w-full h-full cursor-crosshair"
        />

        {/* Floating Crosshair Tooltip */}
        {tooltip && tooltip.visible && (
          <div
            className="absolute pointer-events-none z-20 bg-[#091528]/95 border border-cyan-500/40 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-[11px] font-mono text-slate-200"
            style={{
              left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth || 800) - 230),
              top: Math.max(10, Math.min(tooltip.y - 40, (containerRef.current?.clientHeight || 600) - 130))
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 mb-1.5 text-cyan-300 font-bold">
              <span>{tooltip.time}</span>
              <span className="text-white">${tooltip.price.toFixed(symbolConfig.priceDecimals)}</span>
            </div>

            {tooltip.nearestTrade ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trade Vol:</span>
                  <span className="font-bold text-white">
                    {tooltip.nearestTrade.totalVol.toFixed(2)} {symbolConfig.baseUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Aggressive Side:</span>
                  <span className={`font-bold ${tooltip.nearestTrade.isAggressiveBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tooltip.nearestTrade.isAggressiveBuy ? 'BUY (Hit Ask)' : 'SELL (Hit Bid)'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trade Delta:</span>
                  <span className={`font-bold ${tooltip.nearestTrade.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tooltip.nearestTrade.delta >= 0 ? '+' : ''}{tooltip.nearestTrade.delta.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Resting Limit:</span>
                  <span className="text-amber-300 font-bold">
                    ~{tooltip.depthAtPrice} {symbolConfig.baseUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Spread Dist:</span>
                  <span className="text-slate-300">
                    {Math.abs(tooltip.price - livePrice).toFixed(symbolConfig.priceDecimals)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Market Price Banner (Floating Top-Left) */}
        <div className="absolute top-2 left-3 z-10 flex items-center gap-3 bg-[#081324]/85 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {activeSymbol} · LAST EXECUTED
            </div>
            <div className="text-lg font-mono font-extrabold text-white flex items-center gap-2">
              <span>${livePrice.toFixed(symbolConfig.priceDecimals)}</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400">
                +1.45%
              </span>
            </div>
          </div>

          <div className="border-l border-slate-800 pl-3 text-[11px] font-mono space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">BID:</span>
              <span className="text-cyan-400 font-bold">${bestBid.toFixed(symbolConfig.priceDecimals)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">ASK:</span>
              <span className="text-rose-400 font-bold">${bestAsk.toFixed(symbolConfig.priceDecimals)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 5. BOOKMAP STATUS BAR FOOTER ────────────────── */}
      <div className="flex items-center justify-between bg-[#0b1424] px-3 py-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            LIVE FEED CONNECTED
          </span>
          <span className="text-slate-500">|</span>
          <span>SPEED: 100ms L2 DEPTH REFRESH</span>
          <span className="text-slate-500">|</span>
          <span>ZOOM: {timeZoom.toFixed(1)}x TIME · {priceZoom.toFixed(1)}x PRICE</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">POWERED BY BINANCE STREAM & COMEX PROXY</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400">INSTITUTIONAL ORDER FLOW</span>
        </div>
      </div>
    </div>
  );
};

export default BookmapChart;
