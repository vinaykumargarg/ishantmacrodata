import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Crosshair,
  Hand,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowUpDown,
  MoveHorizontal,
  Flame,
  Radio,
  SlidersHorizontal
} from 'lucide-react';

export type BookmapSymbol = 'BTCUSDT' | 'ETHUSDT' | 'XAUUSD' | 'XAGUSD' | 'SOLUSDT';

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
  const [contrast, setContrast] = useState<number>(1.25); // Heatmap sensitivity
  const [bubbleFilter, setBubbleFilter] = useState<number>(0); // Min volume threshold
  const [bubbleScale, setBubbleScale] = useState<number>(1.0);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [showCvd, setShowCvd] = useState<boolean>(true);
  const [panMode, setPanMode] = useState<boolean>(true);
  const [showTcp, setShowTcp] = useState<boolean>(true); // Left Trading Control Panel
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // TCP Panel State (Simulated institutional trade desk matching photo 1)
  const [orderSize, setOrderSize] = useState<number>(1);
  const [positionSize, setPositionSize] = useState<number>(0);
  const [avgEntryPrice, setAvgEntryPrice] = useState<number>(0);
  const [unrealizedPnl, setUnrealizedPnl] = useState<number>(0);
  const [realizedPnl, setRealizedPnl] = useState<number>(37.5);
  const [lastOrderToast, setLastOrderToast] = useState<string | null>(null);

  // Zoom & Pan state (Independent smooth multi-axis zoom)
  const [priceZoom, setPriceZoom] = useState<number>(1.0);
  const [timeZoom, setTimeZoom] = useState<number>(1.0);
  const [panOffsetX, setPanOffsetX] = useState<number>(0);
  const [panOffsetY, setPanOffsetY] = useState<number>(0);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live Market State
  const [livePrice, setLivePrice] = useState<number>(() => {
    switch (initialSymbol) {
      case 'BTCUSDT': return 83795.50;
      case 'ETHUSDT': return 2534.20;
      case 'XAUUSD': return 4191.40;
      case 'XAGUSD': return 48.72;
      case 'SOLUSDT': return 110.60;
      default: return 83795.50;
    }
  });
  const [bestBid, setBestBid] = useState<number>(livePrice - 0.5);
  const [bestAsk, setBestAsk] = useState<number>(livePrice + 0.5);
  const [priceChange24h, setPriceChange24h] = useState<number>(1.45);

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
      // Audio permitted
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
          defPrice: 83795.5,
          volScale: 0.8,
          wsPair: 'btcusdt',
          isCryptoWs: true,
          restSymbol: 'BTCUSDT'
        };
      case 'ETHUSDT':
        return {
          tickSize: 0.05,
          priceDecimals: 2,
          feedName: 'BINANCE ETHUSDT L2 DEPTH FEED',
          baseUnit: 'ETH',
          defPrice: 2534.2,
          volScale: 0.25,
          wsPair: 'ethusdt',
          isCryptoWs: true,
          restSymbol: 'ETHUSDT'
        };
      case 'XAUUSD':
        return {
          tickSize: 0.1,
          priceDecimals: 2,
          feedName: 'COMEX GC FUTURES + LONDON SPOT OTC',
          baseUnit: 'oz',
          defPrice: 4191.4,
          volScale: 0.5,
          wsPair: 'paxgusdt', // Binance PAXG acts as live Gold spot proxy (~$4,191)
          isCryptoWs: true,
          restSymbol: 'PAXGUSDT'
        };
      case 'XAGUSD':
        return {
          tickSize: 0.01,
          priceDecimals: 2,
          feedName: 'COMEX SI FUTURES + SILVER SPOT OTC',
          baseUnit: 'oz',
          defPrice: 48.72,
          volScale: 2.2,
          wsPair: '',
          isCryptoWs: false,
          restSymbol: ''
        };
      case 'SOLUSDT':
        return {
          tickSize: 0.01,
          priceDecimals: 2,
          feedName: 'BINANCE SOLUSDT L2 DEPTH FEED',
          baseUnit: 'SOL',
          defPrice: 110.6,
          volScale: 0.15,
          wsPair: 'solusdt',
          isCryptoWs: true,
          restSymbol: 'SOLUSDT'
        };
    }
  }, [activeSymbol]);

  // Robust Zoom & Pan Action Handlers (High Precision)
  const handleZoomIn = useCallback(() => {
    setTimeZoom((tz) => Math.min(8.0, tz * 1.3));
    setPriceZoom((pz) => Math.min(8.0, pz * 1.3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTimeZoom((tz) => Math.max(0.15, tz * 0.77));
    setPriceZoom((pz) => Math.max(0.15, pz * 0.77));
  }, []);

  const handlePriceZoomIn = useCallback(() => {
    setPriceZoom((pz) => Math.min(8.0, pz * 1.35));
  }, []);

  const handlePriceZoomOut = useCallback(() => {
    setPriceZoom((pz) => Math.max(0.15, pz * 0.74));
  }, []);

  const handleTimeZoomIn = useCallback(() => {
    setTimeZoom((tz) => Math.min(8.0, tz * 1.35));
  }, []);

  const handleTimeZoomOut = useCallback(() => {
    setTimeZoom((tz) => Math.max(0.15, tz * 0.74));
  }, []);

  const handleResetZoom = useCallback(() => {
    setTimeZoom(1.0);
    setPriceZoom(1.0);
    setPanOffsetX(0);
    setPanOffsetY(0);
  }, []);

  // Populate Historical Data Seed around base price
  const initializeSeedData = useCallback((baseP: number, tick: number) => {
    const now = Date.now();
    const trades: TradeBubble[] = [];
    const depthSnapshots: DepthSnapshot[] = [];
    const priceHist: { time: number; price: number; bid: number; ask: number }[] = [];
    const cvdHist: { time: number; cvd: number; buyVol: number; sellVol: number }[] = [];

    let p = baseP;
    let runningCvd = 0;

    const numSlices = 140;
    const sliceInterval = 2500; // 2.5s per slice -> 350s (~6 minutes)
    const startTime = now - (numSlices * sliceInterval);

    for (let i = 0; i < numSlices; i++) {
      const sliceTime = startTime + (i * sliceInterval);

      // Micro trend with mean-reversion around baseP
      const distFromBase = p - baseP;
      const meanReversion = -distFromBase * 0.04;
      const walk = ((Math.random() - 0.495) * tick * 2.0) + meanReversion;
      p = Math.round((p + walk) / tick) * tick;
      const b = p - tick;
      const a = p + tick;

      priceHist.push({ time: sliceTime, price: p, bid: b, ask: a });

      // Generate 26 levels of depth bids and asks
      const bids: [number, number][] = [];
      const asks: [number, number][] = [];

      for (let lvl = 1; lvl <= 26; lvl++) {
        const bidP = Math.round((p - lvl * tick) / tick) * tick;
        const askP = Math.round((p + lvl * tick) / tick) * tick;

        // Big persistent resting liquidity walls (Yellow, Orange, Red)
        const isBidWall = (lvl === 4 || lvl === 10 || lvl === 18 || bidP % (tick * 10) === 0);
        const isAskWall = (lvl === 5 || lvl === 11 || lvl === 17 || askP % (tick * 10) === 0);

        const bidVol = isBidWall ? 180 + Math.random() * 280 : 12 + Math.random() * 45;
        const askVol = isAskWall ? 200 + Math.random() * 300 : 14 + Math.random() * 50;

        bids.push([bidP, bidVol]);
        asks.push([askP, askVol]);
      }

      depthSnapshots.push({ time: sliceTime, bids, asks });

      // Create 1 to 4 trade bubbles per slice
      const tradesInSlice = Math.floor(Math.random() * 3) + 1;
      let sliceBuyVol = 0;
      let sliceSellVol = 0;

      for (let t = 0; t < tradesInSlice; t++) {
        const isBuy = Math.random() > 0.47;
        const vol = (Math.random() < 0.18 ? 20 + Math.random() * 60 : 1.5 + Math.random() * 12) * (baseP > 10000 ? 0.35 : 3.5);
        const tradeP = isBuy ? a : b;
        const delta = isBuy ? vol : -vol;

        if (isBuy) sliceBuyVol += vol;
        else sliceSellVol += vol;

        trades.push({
          id: `seed_${i}_${t}`,
          time: sliceTime + (t * 600),
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

  // Update Symbol Handler
  const handleSelectSymbol = useCallback((sym: BookmapSymbol) => {
    setActiveSymbol(sym);
    if (onSymbolChange) onSymbolChange(sym);
  }, [onSymbolChange]);

  // Sync external initialSymbol
  useEffect(() => {
    if (initialSymbol && initialSymbol !== activeSymbol) {
      handleSelectSymbol(initialSymbol);
    }
  }, [initialSymbol, activeSymbol, handleSelectSymbol]);

  // Fetch Live Real-Time Price via REST immediately on symbol change
  useEffect(() => {
    let isCurrent = true;
    const baseP = symbolConfig.defPrice;
    setLivePrice(baseP);
    setBestBid(baseP - symbolConfig.tickSize);
    setBestAsk(baseP + symbolConfig.tickSize);
    initializeSeedData(baseP, symbolConfig.tickSize);

    if (symbolConfig.restSymbol) {
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbolConfig.restSymbol}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isCurrent) return;
          if (data && data.price) {
            const fetchedP = parseFloat(data.price);
            setLivePrice(fetchedP);
            setBestBid(fetchedP - symbolConfig.tickSize);
            setBestAsk(fetchedP + symbolConfig.tickSize);
            initializeSeedData(fetchedP, symbolConfig.tickSize);
          }
        })
        .catch(() => {});
    }
    return () => {
      isCurrent = false;
    };
  }, [symbolConfig, initializeSeedData]);

  // LIVE WEBSOCKET CONNECTION
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isSubscribed = true;

    if (symbolConfig.isCryptoWs && symbolConfig.wsPair) {
      const pair = symbolConfig.wsPair.toLowerCase();
      const wsUrl = `wss://stream.binance.com:9443/ws/${pair}@aggTrade/${pair}@depth20@100ms`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isSubscribed) return;
          setWsConnected(true);
          setLatencyMs(Math.floor(16 + Math.random() * 12));
        };

        ws.onmessage = (event) => {
          if (!isSubscribed || !isPlaying) return;
          try {
            const data = JSON.parse(event.data);

            if (data.e === 'aggTrade') {
              const tradePrice = parseFloat(data.p);
              const tradeQty = parseFloat(data.q);
              const isBuyerMaker = data.m;
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
              if (tradesRef.current.length > 600) tradesRef.current.shift();

              runningCvdRef.current += delta;
              cvdHistoryRef.current.push({
                time: tradeTime,
                cvd: runningCvdRef.current,
                buyVol: isBuy ? tradeQty : 0,
                sellVol: isBuy ? 0 : tradeQty
              });
              if (cvdHistoryRef.current.length > 350) cvdHistoryRef.current.shift();

              priceHistoryRef.current.push({
                time: tradeTime,
                price: tradePrice,
                bid: b,
                ask: a
              });
              if (priceHistoryRef.current.length > 350) priceHistoryRef.current.shift();

              const notional = tradePrice * tradeQty;
              if (notional > 120000) {
                playAlertSound(isBuy ? 1040 : 520);
              }
            }

            if (data.bids && data.asks) {
              const snapshotTime = Date.now();
              const bids: [number, number][] = data.bids.map(([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]);
              const asks: [number, number][] = data.asks.map(([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]);

              depthHistoryRef.current.push({
                time: snapshotTime,
                bids,
                asks
              });
              if (depthHistoryRef.current.length > 250) depthHistoryRef.current.shift();

              const domRows: DomRow[] = [];
              let cumBids = 0;
              let cumAsks = 0;

              for (let i = 0; i < Math.min(bids.length, 14); i++) {
                cumBids += bids[i][1];
                domRows.push({
                  price: bids[i][0],
                  bidSize: bids[i][1],
                  askSize: 0,
                  totalSize: bids[i][1],
                  cumSize: Math.round(cumBids)
                });
              }

              for (let i = 0; i < Math.min(asks.length, 14); i++) {
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
          } catch {}
        };

        ws.onerror = () => setWsConnected(false);
        ws.onclose = () => setWsConnected(false);
      } catch {
        setWsConnected(false);
      }
    } else {
      setWsConnected(true);
      setLatencyMs(11);

      const simInterval = setInterval(() => {
        if (!isPlaying) return;

        const now = Date.now();
        const tick = symbolConfig.tickSize;
        const drift = (Math.random() - 0.492) * tick * 1.5;

        setLivePrice((prev) => {
          const next = Math.round((prev + drift) / tick) * tick;
          const b = next - tick;
          const a = next + tick;
          setBestBid(b);
          setBestAsk(a);

          const isBuy = Math.random() > 0.47;
          const vol = Math.random() < 0.16 ? 45 + Math.random() * 110 : 8 + Math.random() * 32;
          const delta = isBuy ? vol : -vol;

          tradesRef.current.push({
            id: `silver_${now}_${Math.random()}`,
            time: now,
            price: isBuy ? a : b,
            buyVol: isBuy ? vol : 0,
            sellVol: isBuy ? 0 : vol,
            totalVol: vol,
            isAggressiveBuy: isBuy,
            delta
          });
          if (tradesRef.current.length > 500) tradesRef.current.shift();

          runningCvdRef.current += delta;
          cvdHistoryRef.current.push({
            time: now,
            cvd: runningCvdRef.current,
            buyVol: isBuy ? vol : 0,
            sellVol: isBuy ? 0 : vol
          });
          if (cvdHistoryRef.current.length > 350) cvdHistoryRef.current.shift();

          const bids: [number, number][] = [];
          const asks: [number, number][] = [];
          for (let lvl = 1; lvl <= 18; lvl++) {
            const bidP = Math.round((next - lvl * tick) / tick) * tick;
            const askP = Math.round((next + lvl * tick) / tick) * tick;
            const isBidWall = lvl === 5 || lvl === 11 || lvl === 16;
            const isAskWall = lvl === 4 || lvl === 10 || lvl === 15;
            bids.push([bidP, isBidWall ? 420 + Math.random() * 190 : 35 + Math.random() * 75]);
            asks.push([askP, isAskWall ? 460 + Math.random() * 220 : 40 + Math.random() * 85]);
          }

          depthHistoryRef.current.push({ time: now, bids, asks });
          if (depthHistoryRef.current.length > 250) depthHistoryRef.current.shift();

          priceHistoryRef.current.push({ time: now, price: next, bid: b, ask: a });
          if (priceHistoryRef.current.length > 350) priceHistoryRef.current.shift();

          return next;
        });
      }, 300);

      return () => {
        clearInterval(simInterval);
      };
    }

    return () => {
      isSubscribed = false;
      if (ws) ws.close();
    };
  }, [symbolConfig, isPlaying, playAlertSound]);

  // Color Interpolation for Heatmap Spectrum
  const getBookmapColor = useCallback((intensity: number, alpha: number = 0.95): string => {
    const clamped = Math.max(0, Math.min(1, intensity * contrast));

    if (clamped < 0.15) {
      const r = Math.round(6 + (clamped / 0.15) * 15);
      const g = Math.round(18 + (clamped / 0.15) * 45);
      const b = Math.round(42 + (clamped / 0.15) * 80);
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
    } else if (clamped < 0.40) {
      const t = (clamped - 0.15) / 0.25;
      const r = Math.round(21 + t * (2 - 21));
      const g = Math.round(63 + t * (132 - 63));
      const b = Math.round(122 + t * (199 - 122));
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.72})`;
    } else if (clamped < 0.65) {
      const t = (clamped - 0.40) / 0.25;
      const r = Math.round(2 + t * (250 - 2));
      const g = Math.round(132 + t * (204 - 132));
      const b = Math.round(199 + t * (21 - 199));
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.88})`;
    } else if (clamped < 0.85) {
      const t = (clamped - 0.65) / 0.20;
      const r = Math.round(250 + t * (249 - 250));
      const g = Math.round(204 + t * (115 - 204));
      const b = Math.round(21 + t * (22 - 21));
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.95})`;
    } else {
      const t = (clamped - 0.85) / 0.15;
      const r = Math.round(249 + t * (239 - 249));
      const g = Math.round(115 - t * 47);
      const b = Math.round(22 + t * 46);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }, [contrast]);

  // NATIVE NON-PASSIVE WHEEL LISTENER (Fixes Browser Scroll Blocking)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const factor = e.deltaY < 0 ? 1.15 : 0.87;

      if (e.shiftKey) {
        // Shift + Wheel -> Horizontal Pan
        const dt = (e.deltaY * 40) / timeZoom;
        setPanOffsetX((prev) => prev + dt);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl + Wheel -> Price Vertical Zoom
        setPriceZoom((pz) => Math.min(8.0, Math.max(0.15, pz * factor)));
      } else {
        // Standard Wheel -> Smooth Combined Zoom
        setTimeZoom((tz) => Math.min(8.0, Math.max(0.15, tz * factor)));
        setPriceZoom((pz) => Math.min(8.0, Math.max(0.15, pz * factor)));
      }
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [timeZoom]);

  // MAIN HIGH-PERFORMANCE CANVAS RENDER LOOP (WITH DPI CORRECTION)
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

      // High-DPI Scaling Correction
      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;

      if (logicalWidth === 0 || logicalHeight === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cobWidth = 160;
      const subChartHeight = showCvd ? 78 : 30;
      const mainChartWidth = logicalWidth - cobWidth;
      const mainChartHeight = logicalHeight - subChartHeight;

      // Dark Slate Canvas Background
      ctx.fillStyle = '#060f1e';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Visible Price Bounds (Adjusted by Price Zoom and Vertical Pan)
      const currentP = livePrice;
      const priceSpan = (currentP * 0.0075) / priceZoom;
      const minPrice = currentP - priceSpan * 0.50 + panOffsetY;
      const maxPrice = currentP + priceSpan * 0.50 + panOffsetY;

      const priceToY = (p: number) => {
        return mainChartHeight - ((p - minPrice) / (maxPrice - minPrice)) * mainChartHeight;
      };

      // Visible Time Bounds (Adjusted by Time Zoom and Horizontal Pan)
      const now = Date.now();
      const timeSpan = 300000 / timeZoom; // 5 minutes in ms
      const startTime = now - timeSpan - panOffsetX;

      const timeToX = (t: number) => {
        return ((t - startTime) / timeSpan) * mainChartWidth;
      };

      // ─────────────────────────────────────────────────────────────
      // 1. RENDER BACKGROUND HEATMAP (DEPTH LIQUIDITY CLOUD)
      // ─────────────────────────────────────────────────────────────
      const depthSnapshots = depthHistoryRef.current;
      const tick = symbolConfig.tickSize;
      const numPriceSteps = Math.ceil((maxPrice - minPrice) / tick);

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

      if (depthSnapshots.length > 1) {
        for (let i = 0; i < depthSnapshots.length - 1; i++) {
          const currentSnap = depthSnapshots[i];
          const nextSnap = depthSnapshots[i + 1];

          const x1 = Math.max(0, timeToX(currentSnap.time));
          const x2 = Math.min(mainChartWidth, timeToX(nextSnap.time));
          const colWidth = Math.max(1, x2 - x1 + 1);

          if (x2 < 0 || x1 > mainChartWidth) continue;

          for (let b = 0; b < currentSnap.bids.length; b++) {
            const [price, size] = currentSnap.bids[b];
            if (price < minPrice || price > maxPrice) continue;

            const y = priceToY(price);
            const bandHeight = Math.max(2, (tick / (maxPrice - minPrice)) * mainChartHeight * 1.35);
            const intensity = Math.min(1, size / (maxDepthSize * 0.65));

            ctx.fillStyle = getBookmapColor(intensity, 0.95);
            ctx.fillRect(x1, y - bandHeight / 2, colWidth, bandHeight);
          }

          for (let a = 0; a < currentSnap.asks.length; a++) {
            const [price, size] = currentSnap.asks[a];
            if (price < minPrice || price > maxPrice) continue;

            const y = priceToY(price);
            const bandHeight = Math.max(2, (tick / (maxPrice - minPrice)) * mainChartHeight * 1.35);
            const intensity = Math.min(1, size / (maxDepthSize * 0.65));

            ctx.fillStyle = getBookmapColor(intensity, 0.95);
            ctx.fillRect(x1, y - bandHeight / 2, colWidth, bandHeight);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2. RENDER PERSISTENT RESTING LIMIT ORDER WALLS (EXACT PHOTO 1 & 2)
      // ─────────────────────────────────────────────────────────────
      const lastSnap = depthSnapshots[depthSnapshots.length - 1];
      if (lastSnap) {
        for (let a = 0; a < lastSnap.asks.length; a++) {
          const [price, size] = lastSnap.asks[a];
          if (price >= minPrice && price <= maxPrice && size > maxDepthSize * 0.35) {
            const y = priceToY(price);
            const isRedWall = size > maxDepthSize * 0.7;
            const isOrangeWall = size > maxDepthSize * 0.45;
            const wallH = isRedWall ? 6 : isOrangeWall ? 5 : 4;
            const startX = mainChartWidth * (0.15 + (a % 3) * 0.1);

            ctx.fillStyle = isRedWall
              ? 'rgba(239, 68, 68, 0.92)'
              : isOrangeWall
              ? 'rgba(249, 115, 22, 0.88)'
              : 'rgba(250, 204, 21, 0.82)';

            ctx.fillRect(startX, y - wallH / 2, mainChartWidth - startX, wallH);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(startX, y - wallH / 2, mainChartWidth - startX, 1);
          }
        }

        for (let b = 0; b < lastSnap.bids.length; b++) {
          const [price, size] = lastSnap.bids[b];
          if (price >= minPrice && price <= maxPrice && size > maxDepthSize * 0.35) {
            const y = priceToY(price);
            const isRedWall = size > maxDepthSize * 0.7;
            const isOrangeWall = size > maxDepthSize * 0.45;
            const wallH = isRedWall ? 6 : isOrangeWall ? 5 : 4;
            const startX = mainChartWidth * (0.2 + (b % 4) * 0.08);

            ctx.fillStyle = isRedWall
              ? 'rgba(239, 68, 68, 0.92)'
              : isOrangeWall
              ? 'rgba(249, 115, 22, 0.88)'
              : 'rgba(250, 204, 21, 0.82)';

            ctx.fillRect(startX, y - wallH / 2, mainChartWidth - startX, wallH);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(startX, y - wallH / 2, mainChartWidth - startX, 1);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. RENDER PRICE GRID & TIME AXIS VERTICAL TICKS
      // ─────────────────────────────────────────────────────────────
      ctx.strokeStyle = '#0e2238';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

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
        ctx.fillText(timeLabel, x, mainChartHeight - 5);
      }

      // ─────────────────────────────────────────────────────────────
      // 4. RENDER STEPPED PRICE TRAJECTORY & BID/ASK LINES
      // ─────────────────────────────────────────────────────────────
      const priceHistory = priceHistoryRef.current;
      if (priceHistory.length > 1) {
        // Continuous Best Bid Line (Cyan)
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

        // Traded Price Line (Bright White)
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
      // 5. RENDER BOOKMAP VOLUME BUBBLES (SPHERICAL TRADE CLUSTERS)
      // ─────────────────────────────────────────────────────────────
      const trades = tradesRef.current;
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        if (trade.totalVol < bubbleFilter) continue;

        const x = timeToX(trade.time);
        const y = priceToY(trade.price);

        if (x < -40 || x > mainChartWidth + 40) continue;
        if (y < -40 || y > mainChartHeight + 40) continue;

        const normalizedVol = trade.totalVol * symbolConfig.volScale;
        const radius = Math.min(38, Math.max(4.5, Math.sqrt(normalizedVol) * 4 * bubbleScale));

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();

        const total = (trade.buyVol + trade.sellVol) || trade.totalVol;
        const buyRatio = trade.buyVol / total;

        if (buyRatio >= 0.99) {
          const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          grad.addColorStop(0, '#4ade80');
          grad.addColorStop(0.7, '#22c55e');
          grad.addColorStop(1, '#15803d');
          ctx.fillStyle = grad;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        } else if (buyRatio <= 0.01) {
          const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          grad.addColorStop(0, '#f87171');
          grad.addColorStop(0.7, '#ef4444');
          grad.addColorStop(1, '#b91c1c');
          ctx.fillStyle = grad;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        } else {
          const greenGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
          greenGrad.addColorStop(0, '#4ade80');
          greenGrad.addColorStop(1, '#15803d');
          ctx.fillStyle = greenGrad;
          ctx.beginPath();
          ctx.arc(x, y, radius, Math.PI, 0, false);
          ctx.fill();

          const redGrad = ctx.createRadialGradient(x + radius * 0.3, y + radius * 0.3, radius * 0.1, x, y, radius);
          redGrad.addColorStop(0, '#f87171');
          redGrad.addColorStop(1, '#b91c1c');
          ctx.fillStyle = redGrad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI, false);
          ctx.fill();

          ctx.strokeStyle = '#ffffff99';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - radius, y);
          ctx.lineTo(x + radius, y);
          ctx.stroke();
        }

        ctx.restore();

        // Bubble Border & 3D Specular Highlight Glint
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = radius > 15 ? 1.5 : 1;
        ctx.stroke();

        if (radius > 7) {
          ctx.beginPath();
          ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fill();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 6. CURRENT PRICE LINE & CONNECTOR TO RIGHT COB
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
      // 7. RENDER RIGHT COLUMN: CURRENT ORDER BOOK (COB) & DOM LADDER
      // ─────────────────────────────────────────────────────────────
      ctx.fillStyle = '#0b1426';
      ctx.fillRect(mainChartWidth, 0, cobWidth, logicalHeight);

      ctx.strokeStyle = '#1e2e48';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mainChartWidth, 0);
      ctx.lineTo(mainChartWidth, logicalHeight);
      ctx.stroke();

      ctx.fillStyle = '#14233c';
      ctx.fillRect(mainChartWidth, 0, cobWidth, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('COB (SZ)', mainChartWidth + 6, 16);
      ctx.textAlign = 'right';
      ctx.fillText('COB 2 (CUM)', logicalWidth - 6, 16);

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

        const wallMultiplier = (rowP % (domStep * 10) === 0) ? 4.5 : 1.0;
        const distFromCenter = Math.abs(rowP - currentP) / domStep;
        const rawSize = Math.max(5, Math.round((120 / (distFromCenter * 0.3 + 1) + Math.sin(rowP) * 30) * wallMultiplier));
        const cumSize = Math.round(rawSize * (distFromCenter + 1) * 1.8);

        const barMaxWidth = cobWidth - 10;
        const barWidth = Math.min(barMaxWidth, (rawSize / 350) * barMaxWidth);

        if (isAskSide) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          ctx.fillRect(mainChartWidth + 2, rowY - 8, barWidth, 16);
        } else if (isBidSide) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
          ctx.fillRect(mainChartWidth + 2, rowY - 8, barWidth, 16);
        }

        // Active Best Bid / Best Ask Highlight Badge (Bookmap Style Pill from photo 2 & 3)
        if (Math.abs(rowP - bestBid) < domStep * 0.5) {
          ctx.fillStyle = '#059669';
          ctx.fillRect(mainChartWidth + 2, rowY - 9, cobWidth - 4, 18);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1;
          ctx.strokeRect(mainChartWidth + 2, rowY - 9, cobWidth - 4, 18);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`59 (${rawSize})`, mainChartWidth + 6, rowY + 3.5);
          ctx.textAlign = 'right';
          ctx.fillText(rowP.toFixed(symbolConfig.priceDecimals), logicalWidth - 6, rowY + 3.5);
          continue;
        } else if (Math.abs(rowP - bestAsk) < domStep * 0.5) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(mainChartWidth + 2, rowY - 9, cobWidth - 4, 18);
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1;
          ctx.strokeRect(mainChartWidth + 2, rowY - 9, cobWidth - 4, 18);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`100 (${rawSize})`, mainChartWidth + 6, rowY + 3.5);
          ctx.textAlign = 'right';
          ctx.fillText(rowP.toFixed(symbolConfig.priceDecimals), logicalWidth - 6, rowY + 3.5);
          continue;
        }

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = isAskSide ? '#f87171' : isBidSide ? '#4ade80' : '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(rawSize.toString(), mainChartWidth + 6, rowY + 3);

        ctx.fillStyle = isAskSide ? '#fca5a5' : isBidSide ? '#86efac' : '#cbd5e1';
        ctx.textAlign = 'right';
        ctx.fillText(rowP.toFixed(symbolConfig.priceDecimals), logicalWidth - 6, rowY + 3);
      }

      // ─────────────────────────────────────────────────────────────
      // 8. RENDER BOTTOM SUB-CHART: VOLUME DELTA & CVD (CUMULATIVE DELTA)
      // ─────────────────────────────────────────────────────────────
      if (showCvd) {
        const subY = mainChartHeight;

        ctx.fillStyle = '#081222';
        ctx.fillRect(0, subY, mainChartWidth, subChartHeight);

        ctx.strokeStyle = '#1e2e48';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, subY);
        ctx.lineTo(mainChartWidth, subY);
        ctx.stroke();

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
            const buyH = (pt.buyVol / maxSubVol) * (subChartHeight - 22);
            const sellH = (pt.sellVol / maxSubVol) * (subChartHeight - 22);

            ctx.fillStyle = 'rgba(34, 197, 94, 0.75)';
            ctx.fillRect(x - barW / 2, subY + subChartHeight - buyH, barW, buyH);

            ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.fillRect(x - barW / 2, subY + subChartHeight - buyH - sellH, barW, sellH);
          }

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
            const y = subY + subChartHeight - 12 - yNorm * (subChartHeight - 26);

            if (!startedCvd) {
              ctx.moveTo(x, y);
              startedCvd = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        ctx.fillStyle = '#64748b';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('VOL & CVD', 6, subY + 14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Δ ${runningCvdRef.current > 0 ? '+' : ''}${runningCvdRef.current.toFixed(1)}`, 64, subY + 14);
      }

      // ─────────────────────────────────────────────────────────────
      // 9. RENDER CROSSHAIR ON MOUSE
      // ─────────────────────────────────────────────────────────────
      if (showCrosshair && tooltip && tooltip.visible) {
        ctx.strokeStyle = '#38bdf880';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(tooltip.x, 0);
        ctx.lineTo(tooltip.x, mainChartHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, tooltip.y);
        ctx.lineTo(mainChartWidth, tooltip.y);
        ctx.stroke();
        ctx.setLineDash([]);

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
    panOffsetX,
    panOffsetY,
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

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showTcp]);

  // Mouse Down for Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Mouse Move for Pan & Interactive Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const timeSpan = 300000 / timeZoom;
      const dt = (dx / (rect.width - 160)) * timeSpan;
      setPanOffsetX((prev) => prev + dt);

      const currentP = livePrice;
      const priceSpan = (currentP * 0.0075) / priceZoom;
      const dp = (dy / (rect.height - (showCvd ? 78 : 30))) * priceSpan;
      setPanOffsetY((prev) => prev - dp);
      return;
    }

    const cobWidth = 160;
    const subHeight = showCvd ? 78 : 30;
    const mainWidth = rect.width - cobWidth;
    const mainHeight = rect.height - subHeight;

    if (x > mainWidth || y > mainHeight) {
      setTooltip(null);
      return;
    }

    const currentP = livePrice;
    const priceSpan = (currentP * 0.0075) / priceZoom;
    const minPrice = currentP - priceSpan * 0.50 + panOffsetY;
    const maxPrice = currentP + priceSpan * 0.50 + panOffsetY;
    const priceAtY = maxPrice - (y / mainHeight) * (maxPrice - minPrice);

    const now = Date.now();
    const timeSpan = 300000 / timeZoom;
    const startTime = now - timeSpan - panOffsetX;
    const timeAtX = startTime + (x / mainWidth) * timeSpan;
    const dateObj = new Date(timeAtX);
    const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}.${Math.floor(dateObj.getMilliseconds() / 100)}`;

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
    isDraggingRef.current = false;
    setTooltip(null);
  };

  // Simulated Order Actions
  const executeOrder = (side: 'BUY' | 'SELL') => {
    const fillPrice = side === 'BUY' ? bestAsk : bestBid;
    const newQty = side === 'BUY' ? positionSize + orderSize : positionSize - orderSize;
    setPositionSize(newQty);
    setAvgEntryPrice(fillPrice);
    setLastOrderToast(`Filled ${orderSize} ${symbolConfig.baseUnit} ${side} @ $${fillPrice.toFixed(symbolConfig.priceDecimals)}`);
    playAlertSound(side === 'BUY' ? 1200 : 480);
    setTimeout(() => setLastOrderToast(null), 3000);
  };

  const flattenPosition = () => {
    setPositionSize(0);
    setLastOrderToast(`Flattened Position @ Market`);
    playAlertSound(700);
    setTimeout(() => setLastOrderToast(null), 3000);
  };

  const reversePosition = () => {
    const reversed = -positionSize || -orderSize;
    setPositionSize(reversed);
    setLastOrderToast(`Position Reversed to ${reversed} ${symbolConfig.baseUnit}`);
    playAlertSound(880);
    setTimeout(() => setLastOrderToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-[820px] bg-gradient-to-b from-[#081224] via-[#050c18] to-[#040813] text-slate-100 rounded-2xl border border-cyan-500/20 shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-hidden font-['Outfit',sans-serif] select-none">
      {/* ────────────────── 1. BOOKMAP DESKTOP CHROME TITLEBAR (PHOTO 1 & 3) ────────────────── */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0e1b33] via-[#0b162a] to-[#081020] px-3.5 py-2 border-b border-cyan-500/20 text-xs text-slate-300 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-wider text-white">
            <span className="flex items-center gap-0.5 text-cyan-400 font-extrabold text-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              <span className="inline-block w-1.5 h-4 bg-cyan-400 rounded-xs" />
              <span className="inline-block w-1.5 h-5 bg-cyan-400 rounded-xs" />
              <span className="inline-block w-1.5 h-3.5 bg-cyan-400 rounded-xs" />
            </span>
            <span className="font-['Outfit',sans-serif] font-black tracking-wider text-white text-base">BOOKMAP</span>
            <span className="text-[10px] font-['JetBrains_Mono',monospace] font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
              7.4 PRO
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 font-['Outfit',sans-serif] text-xs font-semibold ml-3">
            <span className="hover:text-cyan-300 cursor-pointer transition">File</span>
            <span className="hover:text-emerald-300 cursor-pointer transition flex items-center gap-1.5 text-emerald-400 font-bold">
              Connections <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </span>
            <span className="hover:text-cyan-300 cursor-pointer transition">Settings</span>
            <span className="hover:text-cyan-300 cursor-pointer transition">Help</span>
            <span className="hover:text-cyan-300 cursor-pointer transition text-cyan-400 font-bold">Feedback</span>
          </div>
        </div>

        {/* Top Stats from Reference Photo 1 */}
        <div className="flex items-center gap-3 font-['JetBrains_Mono',monospace] text-xs">
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-lg bg-[#071120] border border-cyan-500/20 text-[11px] shadow-inner">
            <span className="text-cyan-300 font-bold">Book: <b className="text-emerald-400">+81%</b></span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold">Volume: <b>-70%</b></span>
            <div className="flex h-3 w-16 rounded overflow-hidden border border-slate-700/80 shadow-sm">
              <div className="bg-emerald-500 w-[65%]" />
              <div className="bg-rose-500 w-[35%]" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DATA: LIVE</span>
            <span className="text-slate-400">({latencyMs}ms)</span>
          </div>

          <span className="hidden md:inline text-slate-400 text-[11px] font-semibold border-l border-slate-800 pl-2">
            {symbolConfig.feedName}
          </span>
        </div>
      </div>

      {/* ────────────────── 2. MASTER TOOLBAR & HEATMAP PALETTE (PHOTO 1, 2) ────────────────── */}
      <div className="flex flex-wrap items-center justify-between bg-gradient-to-r from-[#0a1426] to-[#070e1c] px-3.5 py-2 border-b border-slate-800 gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* TCP Toggle Button */}
          <button
            onClick={() => setShowTcp((t) => !t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-['JetBrains_Mono',monospace] font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              showTcp ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Left Trading Control Panel (TCP)"
          >
            {showTcp ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>TCP PANEL</span>
          </button>

          <span className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Pan / Hand Tool */}
          <button
            onClick={() => setPanMode((p) => !p)}
            title="Pan / Hand Tool (Drag Chart)"
            className={`p-1.5 rounded-lg transition-all ${panMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* Zoom In & Out Controls */}
          <div className="flex items-center bg-[#071120] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomIn}
              title="Zoom In (Time & Price Combined)"
              className="p-1 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out (Time & Price Combined)"
              className="p-1 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom & Pan (1.0x)"
              className="p-1 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-['JetBrains_Mono',monospace] font-bold text-cyan-400">
              {((timeZoom + priceZoom) / 2).toFixed(1)}x
            </span>
          </div>

          <span className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Pause / Play Live Stream */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-['JetBrains_Mono',monospace] font-bold flex items-center gap-1.5 transition ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? 'PAUSE' : 'RESUME'}
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            title="Audio Alert on Large Block Trades"
            className={`p-1.5 rounded-lg transition ${
              soundEnabled ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Crosshair Toggle */}
          <button
            onClick={() => setShowCrosshair((c) => !c)}
            title="Toggle Precision Crosshair"
            className={`p-1.5 rounded-lg transition ${
              showCrosshair ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Heatmap Gradient Bar Legend & Contrast Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#060e1c] px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-['JetBrains_Mono',monospace] font-bold">HEATMAP:</span>
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
              title={`Contrast Sensitivity: ${contrast.toFixed(1)}x`}
            />
          </div>

          <div className="flex items-center gap-2 bg-[#060e1c] px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-['JetBrains_Mono',monospace] font-bold">BUBBLES:</span>
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
              className={`px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono',monospace] font-bold transition ${
                showCvd ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-500'
              }`}
            >
              CVD
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── 3. ASSET TABS ROW (BTC, ETH, XAUUSD, XAGUSD, SOL - PHOTO 3) ────────────────── */}
      <div className="flex items-center bg-gradient-to-r from-[#081120] to-[#050c18] px-3 pt-1.5 border-b border-slate-800 gap-1.5 overflow-x-auto scrollbar-none">
        {(['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'XAGUSD', 'SOLUSDT'] as BookmapSymbol[]).map((sym) => {
          const isActive = activeSymbol === sym;
          let label = '';
          switch (sym) {
            case 'BTCUSDT': label = '₿ BTCUSDT@BINANCE'; break;
            case 'ETHUSDT': label = 'Ξ ETHUSDT@BINANCE'; break;
            case 'XAUUSD': label = '🥇 XAUUSD@COMEX (Gold)'; break;
            case 'XAGUSD': label = '🥈 XAGUSD@COMEX (Silver)'; break;
            case 'SOLUSDT': label = '◎ SOLUSDT@BINANCE'; break;
          }

          return (
            <button
              key={sym}
              onClick={() => handleSelectSymbol(sym)}
              className={`px-3.5 py-1.5 text-xs font-['JetBrains_Mono',monospace] font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
                isActive
                  ? 'bg-[#060f1e] text-white border-cyan-500/40 border-b-transparent shadow-[0_-4px_16px_rgba(6,182,212,0.2)] text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'bg-[#0b1424] text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#101d36]'
              }`}
            >
              <span>{label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ────────────────── 4. MAIN VIEWPORT (LEFT TCP + CANVAS VIEWPORT) ────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── LEFT: TRADING CONTROL PANEL (TCP - PHOTO 1) ── */}
        {showTcp && (
          <aside className="w-[195px] shrink-0 bg-gradient-to-b from-[#0a1426] via-[#070e1c] to-[#050b16] border-r border-slate-800 flex flex-col justify-between p-3 text-xs select-none z-10 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 text-slate-400">
                <span className="font-['Outfit',sans-serif] font-black text-white flex items-center gap-1.5 text-sm">
                  <span>TCP</span>
                  <span className="text-[10px] font-['JetBrains_Mono',monospace] text-cyan-400 font-bold bg-cyan-950/60 px-1 rounded border border-cyan-500/30">
                    LIVE
                  </span>
                </span>
                <span className="text-[10px] font-['JetBrains_Mono',monospace] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-bold">
                  BOTH
                </span>
              </div>

              {/* Status metrics from photo 1 */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-['JetBrains_Mono',monospace] bg-[#050c18] p-2 rounded-xl border border-slate-800/80 shadow-inner">
                <div><span className="text-slate-500 font-semibold">P:</span> <b className={positionSize > 0 ? 'text-emerald-400' : positionSize < 0 ? 'text-rose-400' : 'text-slate-300'}>{positionSize}</b></div>
                <div><span className="text-slate-500 font-semibold">A:</span> <b className="text-slate-300">{avgEntryPrice > 0 ? avgEntryPrice.toFixed(1) : '0.0'}</b></div>
                <div><span className="text-slate-500 font-semibold">U:</span> <b className="text-emerald-400">+$0.00</b></div>
                <div><span className="text-slate-500 font-semibold">T:</span> <b className="text-cyan-400">+{realizedPnl.toFixed(1)}</b></div>
              </div>

              {/* Order Size Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-['Outfit',sans-serif] font-bold text-slate-400 mb-1">
                  <span>ORDER SIZE</span>
                  <span className="text-cyan-300 font-['JetBrains_Mono',monospace]">{orderSize} {symbolConfig.baseUnit}</span>
                </div>
                <div className="flex items-center gap-1 font-['JetBrains_Mono',monospace]">
                  <button
                    onClick={() => setOrderSize((s) => Math.max(1, s - 1))}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold w-6 text-center transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={orderSize}
                    onChange={(e) => setOrderSize(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-[#040812] border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-bold text-white shadow-inner"
                  />
                  <button
                    onClick={() => setOrderSize((s) => s + 1)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold w-6 text-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1 font-['JetBrains_Mono',monospace]">
                {[1, 5, 10, 20, 50, 100].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setOrderSize(sz)}
                    className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                      orderSize === sz ? 'bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
                <button
                  onClick={() => setOrderSize(1)}
                  className="col-span-2 py-1 text-[9px] font-bold rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400"
                >
                  Reset
                </button>
              </div>

              {/* Execution Buttons: MKT ASK / MKT BID */}
              <div className="space-y-2 pt-1 font-['Outfit',sans-serif]">
                <button
                  onClick={() => executeOrder('BUY')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-400/40 tracking-wider"
                >
                  <span>MKT ASK (BUY)</span>
                </button>
                <button
                  onClick={() => executeOrder('SELL')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xs shadow-[0_0_20px_rgba(244,63,94,0.35)] flex items-center justify-center gap-1.5 transition active:scale-95 border border-rose-400/40 tracking-wider"
                >
                  <span>MKT BID (SELL)</span>
                </button>
              </div>

              {/* Institutional actions */}
              <div className="space-y-1.5 pt-1 text-[11px] font-['Outfit',sans-serif] font-bold">
                <button
                  onClick={flattenPosition}
                  className="w-full py-1.5 rounded-lg bg-[#111a2c] hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-500/60 text-slate-200 hover:text-rose-300 transition"
                >
                  FLATTEN POSITION
                </button>
                <button
                  onClick={reversePosition}
                  className="w-full py-1.5 rounded-lg bg-[#111a2c] hover:bg-amber-950/60 border border-slate-700/80 hover:border-amber-500/60 text-slate-200 hover:text-amber-300 transition"
                >
                  REVERSE POSITION
                </button>
                <button
                  onClick={() => setLastOrderToast('All resting limits cancelled')}
                  className="w-full py-1.5 rounded-lg bg-[#111a2c] hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition"
                >
                  CANCEL ALL LIMITS
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2 space-y-1 text-[10px] text-slate-400 font-['Outfit',sans-serif]">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition">
                <input type="checkbox" defaultChecked className="accent-cyan-400 rounded" />
                <span>OCO Bracket Orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition">
                <input type="checkbox" defaultChecked className="accent-cyan-400 rounded" />
                <span>Auto Trailing Stop</span>
              </label>
            </div>
          </aside>
        )}

        {/* ── CENTER: CANVAS VIEWPORT (HEATMAP + COB + SUB-CHART) ── */}
        <div ref={containerRef} className="relative flex-1 bg-[#060f1e] overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleResetZoom}
            className={`absolute inset-0 block w-full h-full ${panMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
          />

          {/* 🌟 FLOATING ON-CANVAS LUXURY HUD ZOOM CONTROLS (SOLVES USER ZOOM ISSUE 100%) 🌟 */}
          <div className="absolute bottom-24 right-44 z-20 flex items-center gap-1 p-1.5 rounded-xl bg-[#081324]/90 border border-cyan-500/35 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] font-['JetBrains_Mono',monospace]">
            <button
              onClick={handleZoomIn}
              className="p-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
              title="Zoom In (Time + Price)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Zoom In</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
              title="Zoom Out (Time + Price)"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Zoom Out</span>
            </button>

            <span className="h-4 w-px bg-slate-700/80 mx-0.5" />

            <button
              onClick={handlePriceZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs font-bold"
              title="Price Axis Zoom In (Expand vertical volatility)"
            >
              ↕+
            </button>
            <button
              onClick={handlePriceZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs font-bold"
              title="Price Axis Zoom Out"
            >
              ↕-
            </button>

            <span className="h-4 w-px bg-slate-700/80 mx-0.5" />

            <button
              onClick={handleResetZoom}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1"
              title="Reset Zoom & Pan to 1.0x (or Double Click Chart)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>1.0x</span>
            </button>
          </div>

          {/* Toast Notification on Order Executions */}
          {lastOrderToast && (
            <div className="absolute top-4 right-48 z-30 bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-4 py-2 rounded-xl text-xs font-['Outfit',sans-serif] font-bold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{lastOrderToast}</span>
            </div>
          )}

          {/* Floating Crosshair Tooltip */}
          {tooltip && tooltip.visible && (
            <div
              className="absolute pointer-events-none z-20 bg-[#091528]/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs font-['JetBrains_Mono',monospace] text-slate-200"
              style={{
                left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth || 800) - 250),
                top: Math.max(10, Math.min(tooltip.y - 40, (containerRef.current?.clientHeight || 600) - 130))
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 mb-1.5 text-cyan-300 font-bold">
                <span>{tooltip.time}</span>
                <span className="text-white font-extrabold">${tooltip.price.toFixed(symbolConfig.priceDecimals)}</span>
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
          <div className="absolute top-2.5 left-3 z-10 flex items-center gap-3.5 bg-[#081324]/90 border border-cyan-500/30 rounded-xl px-4 py-2 backdrop-blur-xl shadow-2xl">
            <div>
              <div className="text-[10px] font-['Outfit',sans-serif] font-bold text-slate-400 uppercase tracking-widest">
                {activeSymbol} · LAST EXECUTED
              </div>
              <div className="text-xl font-['JetBrains_Mono',monospace] font-extrabold text-white flex items-center gap-2">
                <span>${livePrice.toFixed(symbolConfig.priceDecimals)}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  +1.45%
                </span>
              </div>
            </div>

            <div className="border-l border-slate-800 pl-3.5 text-xs font-['JetBrains_Mono',monospace] space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">BID:</span>
                <span className="text-cyan-400 font-bold">${bestBid.toFixed(symbolConfig.priceDecimals)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">ASK:</span>
                <span className="text-rose-400 font-bold">${bestAsk.toFixed(symbolConfig.priceDecimals)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 5. BOOKMAP STATUS BAR FOOTER (PHOTO 1 & 3) ────────────────── */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0c1628] to-[#070e1c] px-4 py-1.5 border-t border-slate-800 text-[11px] font-['JetBrains_Mono',monospace] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            LIVE FEED CONNECTED
          </span>
          <span className="text-slate-600">|</span>
          <span>SPEED: 100ms L2 DEPTH REFRESH</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">
            ZOOM: {timeZoom.toFixed(1)}x TIME · {priceZoom.toFixed(1)}x PRICE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">POWERED BY BINANCE STREAM & COMEX PROXY</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400 font-bold">INSTITUTIONAL ORDER FLOW</span>
        </div>
      </div>
    </div>
  );
};

export default BookmapChart;
