import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import * as d3 from 'd3';
import { wsManager } from '../lib/quant-order-book/core/WebSocketManager';
import { storage, QuantOrderBookSettings } from '../lib/quant-order-book/core/StorageManager';
import { BinanceAdapter, getBinanceKlines, getBinanceOrderBookSnapshot, getBinanceSymbols } from '../lib/quant-order-book/exchanges/BinanceAdapter';
import { OKXAdapter, getOKXKlines, getOKXSymbols } from '../lib/quant-order-book/exchanges/OKXAdapter';
import { BybitAdapter, getBybitKlines, getBybitSymbols } from '../lib/quant-order-book/exchanges/BybitAdapter';
import { CoinbaseAdapter, getCoinbaseSymbols } from '../lib/quant-order-book/exchanges/CoinbaseAdapter';
import { OrderBookHeatmap } from '../lib/quant-order-book/charts/OrderBookHeatmap';
import { analytics, QuantMetrics } from '../lib/quant-order-book/analytics/IndexAlpha';
import { levelAnalyzer, LevelSummaryResult } from '../lib/quant-order-book/analytics/LevelAnalyzer';
import {
  Activity,
  Layers,
  Sliders,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  Shield,
  Zap,
  BarChart2,
  SlidersHorizontal,
  Flame,
  ArrowUpDown
} from 'lucide-react';

// Register adapters with manager
wsManager.registerAdapter('binance', BinanceAdapter);
wsManager.registerAdapter('okx', OKXAdapter);
wsManager.registerAdapter('bybit', BybitAdapter);
wsManager.registerAdapter('coinbase', CoinbaseAdapter);

const TIMEFRAMES = [
  { id: '1m', label: '1m' },
  { id: '3m', label: '3m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '30m', label: '30m' },
  { id: '1h', label: '1h' },
  { id: '2h', label: '2h' },
  { id: '4h', label: '4h' },
  { id: '1d', label: '1d' }
];

const POPULAR_PAIRS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', base: 'BTC' },
  { symbol: 'ETHUSDT', name: 'Ethereum', base: 'ETH' },
  { symbol: 'SOLUSDT', name: 'Solana', base: 'SOL' },
  { symbol: 'BNBUSDT', name: 'BNB', base: 'BNB' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', base: 'DOGE' },
  { symbol: 'XRPUSDT', name: 'Ripple', base: 'XRP' },
  { symbol: 'PAXGUSDT', name: 'Gold (Pax Gold)', base: 'PAXG' }
];

interface QuantOrderBookTerminalViewProps {
  onNavigate?: (tabId: string) => void;
}

export const QuantOrderBookTerminalView: React.FC<QuantOrderBookTerminalViewProps> = ({ onNavigate }) => {
  // ── SETTINGS & SELECTIONS ──
  const initialSettings = useMemo(() => storage.getSettings(), []);
  const [exchange, setExchange] = useState<'binance' | 'okx' | 'bybit' | 'coinbase'>(initialSettings.exchange || 'binance');
  const [symbol, setSymbol] = useState<string>(initialSettings.symbol || 'BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>(initialSettings.timeframe || '1h');
  const [orderBookMode, setOrderBookMode] = useState<'ladder' | 'depth' | 'levels'>(initialSettings.orderBookMode || 'ladder');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(initialSettings.showHeatmap ?? true);
  const [showCvd, setShowCvd] = useState<boolean>(initialSettings.showCvd ?? true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState<boolean>(false);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState<string>('');

  // Heatmap customization
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(initialSettings.heatmapOpacity || 0.7);
  const [heatmapBins, setHeatmapBins] = useState<number>(initialSettings.heatmapBins || 100);

  // Live streaming states
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [metrics, setMetrics] = useState<QuantMetrics>({
    indexAlpha: '1.00',
    delta: '0',
    cvd: '0',
    imbalance: '0.0%',
    spread: '0.00',
    spreadPct: '0.000%',
    raw: { indexAlpha: 1, delta: 0, cvd: 0, imbalance: 0, spread: 0, spreadPct: 0 }
  });
  const [levelAnalysis, setLevelAnalysis] = useState<LevelSummaryResult | null>(null);
  const [ladderData, setLadderData] = useState<{ bids: [number, number][]; asks: [number, number][] }>({ bids: [], asks: [] });

  // DOM Container references
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const cvdSvgRef = useRef<SVGSVGElement | null>(null);
  const depthSvgRef = useRef<SVGSVGElement | null>(null);

  // Chart instances
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const heatmapInstanceRef = useRef<OrderBookHeatmap | null>(null);

  // CVD Data buffer
  const cvdDataRef = useRef<{ time: number; buy: number; sell: number; cvd: number }[]>([]);

  // Filtered symbols
  const filteredSymbols = useMemo(() => {
    const q = symbolSearchQuery.toUpperCase().trim();
    if (!q) return POPULAR_PAIRS;
    return POPULAR_PAIRS.filter((p) => p.symbol.includes(q) || p.name.toUpperCase().includes(q) || p.base.includes(q));
  }, [symbolSearchQuery]);

  // ── SAVE PREFERENCES ──
  useEffect(() => {
    storage.saveSettings({
      exchange,
      symbol,
      timeframe,
      orderBookMode: orderBookMode === 'levels' ? 'ladder' : orderBookMode,
      showHeatmap,
      showCvd,
      heatmapOpacity,
      heatmapBins
    });
  }, [exchange, symbol, timeframe, orderBookMode, showHeatmap, showCvd, heatmapOpacity, heatmapBins]);

  // ── INITIALIZE LIGHTWEIGHT CHARTS & CANVAS HEATMAP ──
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean previous instances
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.remove();
      } catch {
        // ignore
      }
      chartInstanceRef.current = null;
    }
    if (heatmapInstanceRef.current) {
      heatmapInstanceRef.current.destroy();
      heatmapInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#050a18' },
        textColor: '#8b8b8f',
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
        fontSize: 11
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#121a2f'
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#121a2f'
        }
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.15
        }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: true }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      }
    });

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e'
    });

    // Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume'
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0
      }
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Attach OrderBook Heatmap canvas overlay
    const heatmap = new OrderBookHeatmap(container, {
      opacity: heatmapOpacity,
      binsCount: heatmapBins,
      bidColor: { r: 16, g: 185, b: 129 },
      askColor: { r: 244, g: 63, b: 94 },
      showVolumeLabels: true
    });
    heatmap.attachToChart(chart, candleSeries);
    heatmap.setVisible(showHeatmap);
    heatmapInstanceRef.current = heatmap;

    // Handle container resize
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        const { clientWidth, clientHeight } = chartContainerRef.current;
        chartInstanceRef.current.applyOptions({
          width: clientWidth,
          height: clientHeight
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch {
          // quiet
        }
      }
      if (heatmapInstanceRef.current) {
        heatmapInstanceRef.current.destroy();
      }
    };
  }, []);

  // Update Heatmap Visibility & Opacity dynamically
  useEffect(() => {
    if (heatmapInstanceRef.current) {
      heatmapInstanceRef.current.setVisible(showHeatmap);
      heatmapInstanceRef.current.setOpacity(heatmapOpacity);
      heatmapInstanceRef.current.setBinsCount(heatmapBins);
    }
  }, [showHeatmap, heatmapOpacity, heatmapBins]);

  // ── LOAD HISTORICAL CANDLES & REST SNAPSHOT THEN CONNECT WS ──
  useEffect(() => {
    let isCancelled = false;
    setConnectionStatus('CONNECTING');
    analytics.clear();
    cvdDataRef.current = [];

    async function loadDataAndConnect() {
      // 1. Load historical Klines
      let klines: any[] = [];
      if (exchange === 'binance') {
        klines = await getBinanceKlines(symbol, timeframe, 300);
      } else if (exchange === 'okx') {
        klines = await getOKXKlines(symbol, timeframe === '1h' ? '1H' : '1D', 200);
      } else if (exchange === 'bybit') {
        klines = await getBybitKlines(symbol, timeframe === '1h' ? '60' : '240', 200);
      } else {
        // Fallback to Binance data
        klines = await getBinanceKlines(symbol, timeframe, 300);
      }

      if (isCancelled) return;

      if (klines && klines.length > 0 && candleSeriesRef.current && volumeSeriesRef.current) {
        candleSeriesRef.current.setData(
          klines.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close
          }))
        );

        volumeSeriesRef.current.setData(
          klines.map((k) => ({
            time: k.time,
            value: k.volume,
            color: k.close >= k.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'
          }))
        );

        const lastClose = klines[klines.length - 1].close;
        setCurrentPrice(lastClose);
        if (heatmapInstanceRef.current) {
          heatmapInstanceRef.current.currentPrice = lastClose;
        }

        if (chartInstanceRef.current) {
          chartInstanceRef.current.timeScale().fitContent();
        }
      }

      // 2. Load initial OrderBook snapshot
      if (exchange === 'binance' || exchange === 'bybit' || exchange === 'okx') {
        const snap = await getBinanceOrderBookSnapshot(symbol.replace('-', ''), 100);
        if (!isCancelled && snap.bids.length) {
          const formattedBids = snap.bids.map((b) => [b[0], b[1]]) as [number, number][];
          const formattedAsks = snap.asks.map((a) => [a[0], a[1]]) as [number, number][];

          wsManager.setOrderBookSnapshot(`${exchange}:${symbol}`, formattedBids, formattedAsks);
          if (heatmapInstanceRef.current) {
            heatmapInstanceRef.current.update({ bids: formattedBids, asks: formattedAsks }, currentPrice);
          }
          setLadderData({ bids: formattedBids.slice(0, 25), asks: formattedAsks.slice(0, 25) });
          const analysis = levelAnalyzer.analyze({ bids: formattedBids, asks: formattedAsks });
          setLevelAnalysis(analysis);
          const m = analytics.getMetrics({ bids: formattedBids, asks: formattedAsks });
          setMetrics(m);
        }
      }

      if (isCancelled) return;

      // 3. Connect Multi-Exchange WebSocket Streams
      const connId = wsManager.connect(exchange, symbol, ['kline', 'depth', 'trade'], { interval: timeframe });
      setConnectionStatus('CONNECTED');

      // Handlers
      const onKline = (payload: any) => {
        if (isCancelled || payload.id !== connId) return;
        const k = payload.data;
        if (candleSeriesRef.current && volumeSeriesRef.current) {
          candleSeriesRef.current.update({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close
          });
          volumeSeriesRef.current.update({
            time: k.time,
            value: k.volume,
            color: k.close >= k.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'
          });

          setCurrentPrice(k.close);
          if (heatmapInstanceRef.current) {
            heatmapInstanceRef.current.currentPrice = k.close;
          }
        }
      };

      const onOrderBookUpdate = (payload: any) => {
        if (isCancelled || payload.id !== connId) return;
        const ob = payload.data;
        if (!ob) return;

        setLadderData({
          bids: (ob.bids || []).slice(0, 25),
          asks: (ob.asks || []).slice(0, 25)
        });

        if (heatmapInstanceRef.current) {
          heatmapInstanceRef.current.update(ob, currentPrice);
        }

        const analysis = levelAnalyzer.analyze(ob);
        setLevelAnalysis(analysis);

        const m = analytics.getMetrics(ob);
        setMetrics(m);
      };

      const onTrade = (payload: any) => {
        if (isCancelled || payload.id !== connId) return;
        const t = payload.data;
        if (!t) return;

        analytics.addTrade(t);
        setCurrentPrice((prev) => {
          if (t.price !== prev) {
            setPriceFlash(t.price > prev ? 'UP' : 'DOWN');
            setTimeout(() => setPriceFlash('NONE'), 400);
          }
          return t.price;
        });

        // Push to CVD buffer
        const now = Date.now();
        const lastCvd = cvdDataRef.current.length > 0 ? cvdDataRef.current[cvdDataRef.current.length - 1] : { buy: 0, sell: 0, cvd: 0 };
        const vol = Math.abs(t.volume || t.qty || 0);
        const newBuy = t.isBuy ? lastCvd.buy + vol : lastCvd.buy;
        const newSell = !t.isBuy ? lastCvd.sell + vol : lastCvd.sell;
        const newCvd = newBuy - newSell;

        cvdDataRef.current.push({ time: now, buy: newBuy, sell: newSell, cvd: newCvd });
        if (cvdDataRef.current.length > 80) {
          cvdDataRef.current.shift();
        }

        renderCvdChart();
      };

      const onError = () => {
        if (!isCancelled) setConnectionStatus('DISCONNECTED');
      };

      wsManager.on('kline', onKline);
      wsManager.on('orderBookUpdate', onOrderBookUpdate);
      wsManager.on('trade', onTrade);
      wsManager.on('error', onError);

      return () => {
        wsManager.off('kline', onKline);
        wsManager.off('orderBookUpdate', onOrderBookUpdate);
        wsManager.off('trade', onTrade);
        wsManager.off('error', onError);
        wsManager.disconnect(connId);
      };
    }

    const cleanupPromise = loadDataAndConnect();

    return () => {
      isCancelled = true;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [exchange, symbol, timeframe]);

  // ── RENDER D3 CVD CHART ──
  const renderCvdChart = useCallback(() => {
    if (!cvdSvgRef.current || cvdDataRef.current.length < 2) return;
    const svg = d3.select(cvdSvgRef.current);
    const width = cvdSvgRef.current.clientWidth || 600;
    const height = cvdSvgRef.current.clientHeight || 120;

    svg.selectAll('*').remove();

    const data = cvdDataRef.current;
    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([10, width - 10]);

    const allValues = [...data.map((d) => d.buy), ...data.map((d) => d.sell), ...data.map((d) => d.cvd)];
    const minVal = Math.min(...allValues, 0);
    const maxVal = Math.max(...allValues, 1);

    const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height - 15, 15]);

    // Zero line
    const zeroY = yScale(0);
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', zeroY)
      .attr('y2', zeroY)
      .attr('stroke', 'rgba(255, 255, 255, 0.12)')
      .attr('stroke-dasharray', '3,3');

    // Buy area & line (Green)
    const buyArea = d3.area<any>()
      .x((_, i) => xScale(i))
      .y0(zeroY)
      .y1((d) => yScale(d.buy))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'rgba(16, 185, 129, 0.15)')
      .attr('d', buyArea);

    const buyLine = d3.line<any>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.buy))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('d', buyLine);

    // Sell line (Red)
    const sellLine = d3.line<any>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.sell))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('d', sellLine);

    // Main CVD Line (Yellow)
    const cvdLine = d3.line<any>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.cvd))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2)
      .attr('d', cvdLine);
  }, []);

  // ── RENDER D3 MARKET DEPTH CHART ──
  useEffect(() => {
    if (orderBookMode !== 'depth' || !depthSvgRef.current) return;
    const { bids, asks } = ladderData;
    if (!bids.length || !asks.length) return;

    const svg = d3.select(depthSvgRef.current);
    const width = depthSvgRef.current.clientWidth || 300;
    const height = depthSvgRef.current.clientHeight || 350;

    svg.selectAll('*').remove();

    // Compute cumulative volume
    let bidCum = 0;
    const cumBids = bids.map(([p, q]) => {
      bidCum += q;
      return { price: p, cumulative: bidCum };
    });

    let askCum = 0;
    const cumAsks = asks.map(([p, q]) => {
      askCum += q;
      return { price: p, cumulative: askCum };
    });

    const minPrice = cumBids[cumBids.length - 1]?.price || currentPrice * 0.98;
    const maxPrice = cumAsks[cumAsks.length - 1]?.price || currentPrice * 1.02;
    const maxVol = Math.max(bidCum, askCum, 1);

    const xScale = d3.scaleLinear().domain([minPrice, maxPrice]).range([15, width - 15]);
    const yScale = d3.scaleLinear().domain([0, maxVol]).range([height - 25, 20]);

    // Bids Area (Green)
    const bidArea = d3.area<any>()
      .x((d) => xScale(d.price))
      .y0(height - 25)
      .y1((d) => yScale(d.cumulative))
      .curve(d3.curveStepAfter);

    svg.append('path')
      .datum(cumBids)
      .attr('fill', 'rgba(16, 185, 129, 0.25)')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('d', bidArea);

    // Asks Area (Red)
    const askArea = d3.area<any>()
      .x((d) => xScale(d.price))
      .y0(height - 25)
      .y1((d) => yScale(d.cumulative))
      .curve(d3.curveStepAfter);

    svg.append('path')
      .datum(cumAsks)
      .attr('fill', 'rgba(244, 63, 94, 0.25)')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('d', askArea);

    // Mid price marker
    const midX = xScale(currentPrice);
    svg.append('line')
      .attr('x1', midX)
      .attr('x2', midX)
      .attr('y1', 15)
      .attr('y2', height - 25)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');
  }, [ladderData, orderBookMode, currentPrice]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Max ladder volume for relative depth bars
  const maxLadderVol = useMemo(() => {
    const all = [...ladderData.bids.map((b) => b[1]), ...ladderData.asks.map((a) => a[1])];
    return Math.max(...all, 0.001);
  }, [ladderData]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-full bg-[#050a18] text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ── TOP HEADER / TOOLBAR ── */}
      <header className="h-12 border-b border-white/10 bg-[#0a1024] px-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo & Terminal Name */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <span className="p-1 rounded bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400">
              <Flame className="w-4 h-4" />
            </span>
            <span className="font-bold text-xs font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
              QUANT ORDERBOOK PRO
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                5000 BINS
              </span>
            </span>
          </div>

          {/* Exchange Selector */}
          <div className="flex items-center bg-[#050a18] border border-white/10 rounded-md p-0.5">
            {(['binance', 'okx', 'bybit', 'coinbase'] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setExchange(ex)}
                className={`px-2 py-1 text-[11px] font-mono font-bold rounded transition-colors uppercase ${
                  exchange === ex ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Symbol Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSymbolDropdown((v) => !v)}
              className="flex items-center gap-2 bg-[#050a18] border border-white/10 hover:border-cyan-500/40 rounded-md px-2.5 py-1 text-xs font-mono font-bold text-slate-200 transition-colors"
            >
              <span>{symbol}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {showSymbolDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#0a1024] border border-cyan-500/30 rounded-lg shadow-2xl p-2 z-50">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    placeholder="Search crypto pair..."
                    className="w-full bg-[#050a18] border border-white/10 rounded pl-7 pr-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredSymbols.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        setSymbol(item.symbol);
                        setShowSymbolDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs font-mono transition-colors ${
                        symbol === item.symbol ? 'bg-cyan-900/60 text-cyan-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <span>{item.symbol}</span>
                      <span className="text-[10px] text-slate-400">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Price Flash Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <span
              className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded transition-all duration-300 ${
                priceFlash === 'UP'
                  ? 'bg-emerald-500/30 text-emerald-300 scale-105'
                  : priceFlash === 'DOWN'
                  ? 'bg-rose-500/30 text-rose-300 scale-105'
                  : 'text-slate-100'
              }`}
            >
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
          </div>

          {/* Timeframe Buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-[#050a18] p-0.5 rounded-md border border-white/10 ml-2">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  timeframe === tf.id ? 'bg-cyan-600 font-bold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            title="Toggle Canvas Heatmap Overlay"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              showHeatmap
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>

          {/* CVD Toggle */}
          <button
            onClick={() => setShowCvd((v) => !v)}
            title="Toggle CVD Pane"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              showCvd
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>CVD</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Terminal Settings"
            className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Fullscreen"
            className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ── QUANT METRICS RIBBON (Index α, Delta, CVD, Imbalance, Spread) ── */}
      <div className="h-10 border-b border-white/10 bg-[#080d20] px-4 flex items-center justify-between text-xs font-mono shrink-0 overflow-x-auto">
        <div className="flex items-center gap-6">
          {/* Index α */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">INDEX α:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded ${
                parseFloat(metrics.indexAlpha) >= 1.05
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : parseFloat(metrics.indexAlpha) <= 0.95
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  : 'bg-white/5 text-amber-300 border border-amber-500/30'
              }`}
            >
              {metrics.indexAlpha}
            </span>
            <span className="text-[10px] text-slate-400">
              {parseFloat(metrics.indexAlpha) > 1.0 ? 'Buyers Dominating' : 'Sellers Dominating'}
            </span>
          </div>

          {/* Delta */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="text-slate-400">DELTA (1m):</span>
            <span
              className={`font-bold ${
                metrics.raw.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.delta}
            </span>
          </div>

          {/* CVD */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="text-slate-400">CVD (Cum):</span>
            <span
              className={`font-bold ${
                metrics.raw.cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.cvd}
            </span>
          </div>

          {/* Order Book Imbalance */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="text-slate-400">IMBALANCE:</span>
            <span
              className={`font-bold ${
                metrics.raw.imbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.imbalance}
            </span>
            <div className="w-16 h-2 rounded bg-rose-900/60 overflow-hidden relative">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.max(0, Math.min(100, (metrics.raw.imbalance + 1) * 50))}%` }}
              />
            </div>
          </div>

          {/* Spread */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="text-slate-400">SPREAD:</span>
            <span className="text-slate-200 font-semibold">{metrics.spread} pts</span>
            <span className="text-[10px] text-slate-400">({metrics.spreadPct})</span>
          </div>
        </div>

        {/* Right Side Liquidity Nearest Info */}
        {levelAnalysis && levelAnalysis.summary && (
          <div className="hidden xl:flex items-center gap-4 text-[11px] text-slate-300">
            {levelAnalysis.summary.nearestSupport && (
              <span className="text-emerald-400">
                Support: ${levelAnalysis.summary.nearestSupport.price.toFixed(2)} ({levelAnalysis.summary.nearestSupport.ratio})
              </span>
            )}
            {levelAnalysis.summary.nearestResistance && (
              <span className="text-rose-400">
                Resistance: ${levelAnalysis.summary.nearestResistance.price.toFixed(2)} ({levelAnalysis.summary.nearestResistance.ratio})
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── MAIN WORKSPACE (Chart + CVD + DOM Ladder) ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Area: Candlestick Chart + Heatmap Overlay + Bottom CVD */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Main Chart Canvas Wrapper */}
          <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />

          {/* Bottom Pane: CVD Chart (Collapsible) */}
          {showCvd && (
            <div className="h-28 border-t border-white/10 bg-[#070b1c] flex flex-col shrink-0 relative">
              <div className="h-6 px-3 border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-3 h-3 text-cyan-400" />
                  <span>CUMULATIVE VOLUME DELTA (CVD) · REAL-TIME TICK FLOW</span>
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Buys
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Sells
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Net CVD
                  </span>
                </div>
              </div>
              <svg ref={cvdSvgRef} className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Right Side Panel: DOM Ladder / Depth / Key Levels (Collapsible) */}
        {showRightPanel && (
          <aside className="w-72 lg:w-80 border-l border-white/10 bg-[#090e22] flex flex-col shrink-0 overflow-hidden z-10">
            {/* Panel Tabs */}
            <div className="h-9 border-b border-white/10 bg-[#070b1c] px-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  onClick={() => setOrderBookMode('ladder')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    orderBookMode === 'ladder' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  DOM LADDER
                </button>
                <button
                  onClick={() => setOrderBookMode('depth')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    orderBookMode === 'depth' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  DEPTH
                </button>
                <button
                  onClick={() => setOrderBookMode('levels')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    orderBookMode === 'levels' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WALLS
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {ladderData.bids.length + ladderData.asks.length} L2
              </span>
            </div>

            {/* TAB 1: DOM LADDER */}
            {orderBookMode === 'ladder' && (
              <div className="flex-1 flex flex-col overflow-hidden font-mono text-[11px]">
                {/* Column Headers */}
                <div className="h-6 px-3 flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 uppercase">
                  <span>Price ($)</span>
                  <span>Size ({symbol.replace('USDT', '')})</span>
                  <span>Total</span>
                </div>

                {/* Asks (Red - Top) */}
                <div className="flex-1 overflow-y-auto flex flex-col-reverse justify-start divide-y divide-white/[0.02]">
                  {ladderData.asks.slice(0, 18).map(([price, qty], idx) => {
                    const pct = Math.min(100, (qty / maxLadderVol) * 100);
                    return (
                      <div key={`ask-${idx}`} className="relative h-5 px-3 flex items-center justify-between group hover:bg-white/5">
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-rose-500/20 transition-all pointer-events-none"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="text-rose-400 font-bold z-10">{price.toFixed(2)}</span>
                        <span className="text-slate-300 z-10">{qty.toFixed(3)}</span>
                        <span className="text-slate-500 text-[10px] z-10">{(price * qty).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Center Spread Banner */}
                <div className="h-7 bg-[#0c142e] border-y border-white/10 px-3 flex items-center justify-between font-bold text-xs">
                  <span className="text-amber-400 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> SPREAD:
                  </span>
                  <span className="text-slate-200">{metrics.spread} pts ({metrics.spreadPct})</span>
                </div>

                {/* Bids (Green - Bottom) */}
                <div className="flex-1 overflow-y-auto flex flex-col justify-start divide-y divide-white/[0.02]">
                  {ladderData.bids.slice(0, 18).map(([price, qty], idx) => {
                    const pct = Math.min(100, (qty / maxLadderVol) * 100);
                    return (
                      <div key={`bid-${idx}`} className="relative h-5 px-3 flex items-center justify-between group hover:bg-white/5">
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-emerald-500/20 transition-all pointer-events-none"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="text-emerald-400 font-bold z-10">{price.toFixed(2)}</span>
                        <span className="text-slate-300 z-10">{qty.toFixed(3)}</span>
                        <span className="text-slate-500 text-[10px] z-10">{(price * qty).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MARKET DEPTH CHART */}
            {orderBookMode === 'depth' && (
              <div className="flex-1 flex flex-col overflow-hidden relative p-2">
                <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                  <span>CUMULATIVE DEPTH CURVE</span>
                  <span className="text-emerald-400">Bids</span> · <span className="text-rose-400">Asks</span>
                </div>
                <svg ref={depthSvgRef} className="flex-1 w-full h-full" />
              </div>
            )}

            {/* TAB 3: KEY LIQUIDITY WALLS & LEVELS */}
            {orderBookMode === 'levels' && levelAnalysis && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4 font-mono text-xs">
                {/* Resistance Levels */}
                <div>
                  <div className="text-[11px] font-bold text-rose-400 uppercase flex items-center justify-between mb-1.5">
                    <span>🔴 Resistance Walls</span>
                    <span className="text-[10px] text-slate-400">{levelAnalysis.resistanceLevels.length} detected</span>
                  </div>
                  <div className="space-y-1.5">
                    {levelAnalysis.resistanceLevels.slice(0, 5).map((lvl, idx) => (
                      <div key={`res-${idx}`} className="p-2 rounded bg-rose-950/40 border border-rose-500/20">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-rose-300">${lvl.price.toFixed(2)}</span>
                          <span className="text-[10px] text-rose-400">Strength: {lvl.strength}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>Volume: {levelAnalyzer.formatVolume(lvl.volume)}</span>
                          <span>{lvl.ratio} avg</span>
                        </div>
                        <div className="w-full bg-rose-950 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-rose-500 h-full" style={{ width: `${lvl.strength}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support Levels */}
                <div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase flex items-center justify-between mb-1.5">
                    <span>🟢 Support Walls</span>
                    <span className="text-[10px] text-slate-400">{levelAnalysis.supportLevels.length} detected</span>
                  </div>
                  <div className="space-y-1.5">
                    {levelAnalysis.supportLevels.slice(0, 5).map((lvl, idx) => (
                      <div key={`sup-${idx}`} className="p-2 rounded bg-emerald-950/40 border border-emerald-500/20">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-emerald-300">${lvl.price.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-400">Strength: {lvl.strength}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>Volume: {levelAnalyzer.formatVolume(lvl.volume)}</span>
                          <span>{lvl.ratio} avg</span>
                        </div>
                        <div className="w-full bg-emerald-950 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-emerald-500 h-full" style={{ width: `${lvl.strength}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aggregate Summary */}
                <div className="p-2.5 rounded bg-[#070b1c] border border-white/10 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Bids:</span>
                    <span className="text-emerald-400 font-bold">{levelAnalyzer.formatVolume(levelAnalysis.summary.totalBidVolume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Asks:</span>
                    <span className="text-rose-400 font-bold">{levelAnalyzer.formatVolume(levelAnalysis.summary.totalAskVolume)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-slate-400">Bid/Ask Ratio:</span>
                    <span className="text-cyan-400 font-bold">{levelAnalysis.summary.bidAskRatio}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── SETTINGS MODAL ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1024] border border-cyan-500/40 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-sm font-mono flex items-center gap-2 text-cyan-300">
                <Sliders className="w-4 h-4" /> QUANT HEATMAP PREFERENCES
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-300 block mb-1">
                  Heatmap Aggregation Bins: <span className="text-cyan-400 font-bold">{heatmapBins}</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="10"
                  value={heatmapBins}
                  onChange={(e) => setHeatmapBins(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">
                  Heatmap Canvas Opacity: <span className="text-cyan-400 font-bold">{(heatmapOpacity * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                <span>Show Real-Time CVD Chart</span>
                <input
                  type="checkbox"
                  checked={showCvd}
                  onChange={(e) => setShowCvd(e.target.checked)}
                  className="accent-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                <span>Side Panel (DOM Ladder / Depth)</span>
                <input
                  type="checkbox"
                  checked={showRightPanel}
                  onChange={(e) => setShowRightPanel(e.target.checked)}
                  className="accent-cyan-500"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantOrderBookTerminalView;
