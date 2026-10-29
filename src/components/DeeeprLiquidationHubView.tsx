import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  coinglassLiquidationEngine,
  HeatmapGrid,
  LiqCandle,
  ActiveLiqBand,
  RealLiquidationEvent,
  formatUsd,
  niceStep
} from '../services/coinglassLiquidationEngine';
import { sharedQuoteStore } from '../services/sharedQuoteStore';
import {
  LIQUIDATION_PROFILES,
  AVAILABILITY_MATRIX,
  AssetLiquidationProfile,
  OptionStrikeData,
  lintLiquidationProfile,
  generateLiquidationHinglishReport,
  publishLiquidationEvidenceToMaster
} from '../services/deeeprLiquidationHubService';
import { getMasterVerdictState } from '../services/masterVerdictStore';
import {
  Flame,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Compass,
  Layers,
  BarChart2,
  Sliders,
  Info,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Maximize2
} from 'lucide-react';

interface DeeeprLiquidationHubViewProps {
  onNavigate?: (tab: string) => void;
  defaultAsset?: 'BTC' | 'ETH' | 'SOL' | 'GOLD' | 'SILVER';
}

export const DeeeprLiquidationHubView: React.FC<DeeeprLiquidationHubViewProps> = ({
  onNavigate,
  defaultAsset = 'BTC'
}) => {
  const [selectedAssetKey, setSelectedAssetKey] = useState<'BTC' | 'ETH' | 'SOL' | 'GOLD' | 'SILVER'>(defaultAsset);
  const [activeTab, setActiveTab] = useState<'HEATMAP' | 'MAP' | 'REAL_FEED' | 'MAX_PAIN' | 'CLUSTERS' | 'REPORT_JSON'>('HEATMAP');
  const [timeRange, setTimeRange] = useState<'1d' | '3d' | '7d' | '14d'>('3d');
  const [showRealBubbles, setShowRealBubbles] = useState<boolean>(true);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Synchronized price from sharedQuoteStore
  const resolveTargetSymbol = useCallback((k: string) => {
    if (k === 'BTC') return 'BTCUSDT';
    if (k === 'ETH') return 'ETHUSDT';
    if (k === 'SOL') return 'SOLUSDT';
    if (k === 'GOLD') return 'PAXGUSDT';
    return 'SLVUSDT';
  }, []);

  const [livePrice, setLivePrice] = useState<number>(() => {
    const q = sharedQuoteStore.getQuote(resolveTargetSymbol(defaultAsset));
    return q && q.price > 0 ? q.price : defaultAsset === 'BTC' ? 81500 : 2450;
  });
  const [priceChange24h, setPriceChange24h] = useState<number>(1.25);
  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  // Heatmap Grid State from Coinglass Engine
  const [gridData, setGridData] = useState<HeatmapGrid | null>(null);
  const [isLoadingGrid, setIsLoadingGrid] = useState<boolean>(true);
  const [wsStatus, setWsStatus] = useState<{ connected: boolean; isStale: boolean; lastMsgSecondsAgo: number }>({
    connected: true,
    isStale: false,
    lastMsgSecondsAgo: 0.8
  });

  // Interactive Zoom / Pan / Hover State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    price: number;
    candle?: LiqCandle;
    activeLiqUsd?: number;
    nearestCluster?: string;
  } | null>(null);

  // Fetch data & subscribe to feeds
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingGrid(true);

    const loadData = async () => {
      try {
        const grid = await coinglassLiquidationEngine.fetchAndComputeHeatmap(selectedAssetKey, timeRange);
        if (isSubscribed) {
          setGridData(grid);
          setIsLoadingGrid(false);
          setLivePrice(grid.perpPrice);
        }
      } catch (err) {
        console.error('Error fetching liquidation heatmap:', err);
        if (isSubscribed) setIsLoadingGrid(false);
      }
    };

    loadData();

    // Subscribe to engine grid updates
    const unsubEngine = coinglassLiquidationEngine.subscribe((newGrid) => {
      const sym = resolveTargetSymbol(selectedAssetKey);
      if (newGrid.symbol === sym) {
        setGridData(newGrid);
        setLivePrice(newGrid.perpPrice);
      }
    });

    // Subscribe to sharedQuoteStore for instant price synchronization with top ticker
    const unsubQuotes = sharedQuoteStore.subscribe((quote) => {
      const sym = resolveTargetSymbol(selectedAssetKey);
      if (quote.symbol === sym && quote.price > 0) {
        setLivePrice((prev) => {
          if (prev !== quote.price) {
            setPriceFlash(quote.price >= prev ? 'UP' : 'DOWN');
            setTimeout(() => setPriceFlash('NONE'), 300);
          }
          return quote.price;
        });
        setPriceChange24h(quote.change24h || 0);
      }
    });

    // Check WS status every second
    const statusInterval = setInterval(() => {
      setWsStatus(coinglassLiquidationEngine.getWsStatus());
    }, 1000);

    return () => {
      isSubscribed = false;
      unsubEngine();
      unsubQuotes();
      clearInterval(statusInterval);
    };
  }, [selectedAssetKey, timeRange, resolveTargetSymbol]);

  // Merge gridData with base profile for Max Pain and Scenarios
  const profile: AssetLiquidationProfile = useMemo(() => {
    const base = LIQUIDATION_PROFILES[selectedAssetKey] || LIQUIDATION_PROFILES.BTC;
    const currentP = livePrice > 0 ? livePrice : base.price;

    return {
      ...base,
      price: currentP,
      price_source:
        selectedAssetKey === 'GOLD' || selectedAssetKey === 'SILVER'
          ? 'Binance Crypto Perp Proxy (PAXGUSDT/SLVUSDT)'
          : 'Binance Futures Live Mark Stream',
      fuel: {
        ...base.fuel,
        up_points: gridData?.fuelUpPoints ?? base.fuel.up_points,
        down_points: gridData?.fuelDownPoints ?? base.fuel.down_points
      }
    };
  }, [selectedAssetKey, livePrice, gridData]);

  // Master verdict integration
  const masterVerdict = useMemo(() => {
    try {
      if (typeof getMasterVerdictState === 'function') {
        const v = getMasterVerdictState(profile.asset);
        if (v && v.state) return v;
      }
    } catch {
      // fallback
    }
    return { state: 'WAIT' };
  }, [profile.asset]);

  // Publish evidence to master verdict
  useEffect(() => {
    publishLiquidationEvidenceToMaster(profile);
  }, [profile]);

  // Canvas Heatmap Drawing Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── DRAW AUTHENTIC COINGLASS HEATMAP WITH CLEAR-ON-CROSS ──
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Deep purple authentic Coinglass background
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, width, height);

    if (!gridData || gridData.candles.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('Syncing authentic Binance klines & liquidation grid...', width / 2 - 160, height / 2);
      return;
    }

    const candles = gridData.candles;
    const candleCount = candles.length;
    const bands = gridData.bands;
    const maxVal = Math.max(10000, gridData.maxIntensity995);

    // Layout Dimensions
    const leftMargin = 55; // room for colorbar & labels
    const rightMargin = 80; // room for Y-axis price labels
    const topMargin = 20;
    const bottomMargin = 30; // room for X-axis timestamps

    const chartW = width - leftMargin - rightMargin;
    const chartH = height - topMargin - bottomMargin;

    // 2. Compute dynamic visible price span around live price
    const currentPrice = livePrice;
    let minCandleLow = Infinity;
    let maxCandleHigh = -Infinity;
    for (const c of candles) {
      if (c.low < minCandleLow) minCandleLow = c.low;
      if (c.high > maxCandleHigh) maxCandleHigh = c.high;
    }

    const rawSpan = Math.max(currentPrice * 0.08, (maxCandleHigh - minCandleLow) * 1.3);
    const visibleSpan = rawSpan / zoomLevel;
    const minP = currentPrice - visibleSpan * 0.5 + panOffset;
    const maxP = currentPrice + visibleSpan * 0.5 + panOffset;

    const priceToY = (p: number) => {
      return topMargin + chartH - ((p - minP) / (maxP - minP)) * chartH;
    };

    const indexToX = (idx: number) => {
      return leftMargin + (idx / Math.max(1, candleCount - 1)) * chartW;
    };

    // 3. Grid Lines & Clean Round Y-Axis Ticks (niceStep)
    const tickStep = niceStep((maxP - minP) / 7);
    const startTick = Math.ceil(minP / tickStep) * tickStep;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    for (let t = startTick; t <= maxP; t += tickStep) {
      const y = priceToY(t);
      if (y < topMargin || y > topMargin + chartH) continue;

      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(leftMargin + chartW, y);
      ctx.stroke();

      // Right Y-axis tick text
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      const dec = selectedAssetKey === 'GOLD' || selectedAssetKey === 'SILVER' ? 2 : 0;
      ctx.fillText(`$${t.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`, leftMargin + chartW + 6, y + 3);
    }

    // 4. Viridis Color Palette Interpolation
    const getViridisColor = (intensity: number) => {
      const norm = Math.min(1.0, Math.max(0, intensity / maxVal));
      if (norm < 0.25) {
        // Deep purple to Navy blue
        const t = norm / 0.25;
        const r = Math.round(43 + t * (49 - 43));
        const g = Math.round(10 + t * (104 - 10));
        const b = Math.round(77 + t * (142 - 77));
        return `rgba(${r}, ${g}, ${b}, ${0.45 + t * 0.2})`;
      } else if (norm < 0.6) {
        // Navy blue to Emerald green
        const t = (norm - 0.25) / 0.35;
        const r = Math.round(49 + t * (53 - 49));
        const g = Math.round(104 + t * (183 - 104));
        const b = Math.round(142 + t * (121 - 142));
        return `rgba(${r}, ${g}, ${b}, ${0.65 + t * 0.2})`;
      } else {
        // Emerald green to Vivid Electric Yellow
        const t = (norm - 0.6) / 0.4;
        const r = Math.round(53 + t * (253 - 53));
        const g = Math.round(183 + t * (231 - 183));
        const b = Math.round(121 + t * (37 - 121));
        return `rgba(${r}, ${g}, ${b}, ${0.85 + t * 0.15})`;
      }
    };

    // 5. Draw Authentic Horizontal Liquidation Bands with CLEAR-ON-CROSS
    // Bands originate at band.originCandleIdx, and STOP at band.clearedCandleIdx!
    const bandHeight = Math.max(2, (gridData.bucketStep / (maxP - minP)) * chartH);

    for (const band of bands) {
      if (band.priceLevel < minP || band.priceLevel > maxP) continue;

      const y = priceToY(band.priceLevel);
      const startX = indexToX(band.originCandleIdx);
      const endX = band.isCleared && band.clearedCandleIdx !== null
        ? indexToX(band.clearedCandleIdx)
        : leftMargin + chartW; // uncrossed runs till live right edge!

      const drawW = Math.max(2, endX - startX);
      ctx.fillStyle = getViridisColor(band.initialUsd);
      ctx.fillRect(startX, y - bandHeight / 2, drawW, bandHeight);
    }

    // 6. Candlestick Overlay on Top of the Heatmap
    const candleWidth = Math.max(2, (chartW / candleCount) * 0.7);

    for (let i = 0; i < candleCount; i++) {
      const c = candles[i];
      const x = indexToX(i);
      const yOpen = priceToY(c.open);
      const yClose = priceToY(c.close);
      const yHigh = priceToY(c.high);
      const yLow = priceToY(c.low);

      const isBull = c.close >= c.open;
      const candleColor = isBull ? '#10b981' : '#ef4444';

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = candleColor;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyH);
    }

    // 7. Live Force Order Bubbles (if enabled)
    if (showRealBubbles) {
      const realLiqs = coinglassLiquidationEngine.getRealLiquidations();
      realLiqs.slice(0, 15).forEach((ev) => {
        if (ev.price >= minP && ev.price <= maxP) {
          const y = priceToY(ev.price);
          // Draw near the live edge (last 20% of chart)
          const bubbleX = leftMargin + chartW - 20 - Math.random() * 40;
          const radius = Math.min(10, Math.max(4, Math.log10(ev.usd) * 1.5));

          ctx.fillStyle = ev.side === 'LONG' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(34, 197, 94, 0.45)';
          ctx.beginPath();
          ctx.arc(bubbleX, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ev.side === 'LONG' ? '#ef4444' : '#22c55e';
          ctx.stroke();
        }
      });
    }

    // 8. Live Price Dashed Line & Right Axis Tag
    const liveY = priceToY(currentPrice);
    if (liveY >= topMargin && liveY <= topMargin + chartH) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftMargin, liveY);
      ctx.lineTo(leftMargin + chartW, liveY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live Price Marker Badge
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(leftMargin + chartW + 2, liveY - 9, 74, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      const dec = selectedAssetKey === 'GOLD' || selectedAssetKey === 'SILVER' ? 2 : 1;
      ctx.fillText(`$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`, leftMargin + chartW + 6, liveY + 4);
    }

    // 9. Viridis Colorbar on Left with Numeric Max & 0 Labels
    const cbX = 14;
    const cbY = topMargin + 10;
    const cbW = 10;
    const cbH = chartH - 20;

    const cbGrad = ctx.createLinearGradient(0, cbY + cbH, 0, cbY);
    cbGrad.addColorStop(0, '#2b0a4d');
    cbGrad.addColorStop(0.3, '#31688e');
    cbGrad.addColorStop(0.7, '#35b779');
    cbGrad.addColorStop(1, '#fde725');

    ctx.fillStyle = cbGrad;
    ctx.fillRect(cbX, cbY, cbW, cbH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(cbX, cbY, cbW, cbH);

    // Visible Numeric Max Value Label (e.g. $778.74M)
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(formatUsd(maxVal), cbX - 8, cbY - 5);

    // 0 Value Label
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('0', cbX + 1, cbY + cbH + 12);

    // 10. Bottom X-Axis IST Timestamps
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    const xStep = Math.floor(candleCount / 5);

    for (let i = 0; i < candleCount; i += xStep) {
      const c = candles[i];
      const x = indexToX(i);
      const d = new Date(c.time);
      const timeStr = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      ctx.fillText(timeStr, x - 25, height - 10);
    }

    // 11. Crosshair Hover Guides & Tooltip
    if (hoverInfo) {
      const hX = hoverInfo.x;
      const hY = hoverInfo.y;

      if (hX >= leftMargin && hX <= leftMargin + chartW && hY >= topMargin && hY <= topMargin + chartH) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([2, 2]);

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(leftMargin, hY);
        ctx.lineTo(leftMargin + chartW, hY);
        ctx.stroke();

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(hX, topMargin);
        ctx.lineTo(hX, topMargin + chartH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [gridData, livePrice, zoomLevel, panOffset, hoverInfo, showRealBubbles, selectedAssetKey]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // Handle Mouse Hover / Crosshair on Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !gridData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const leftMargin = 55;
    const rightMargin = 80;
    const topMargin = 20;
    const bottomMargin = 30;
    const chartW = canvas.width - leftMargin - rightMargin;
    const chartH = canvas.height - topMargin - bottomMargin;

    if (x < leftMargin || x > leftMargin + chartW || y < topMargin || y > topMargin + chartH) {
      setHoverInfo(null);
      return;
    }

    const candles = gridData.candles;
    const candleCount = candles.length;
    const rawSpan = Math.max(livePrice * 0.08, (candles[candles.length - 1].high - candles[0].low) * 1.3);
    const visibleSpan = rawSpan / zoomLevel;
    const minP = livePrice - visibleSpan * 0.5 + panOffset;
    const maxP = livePrice + visibleSpan * 0.5 + panOffset;

    // Price under cursor
    const priceUnderCursor = +(maxP - ((y - topMargin) / chartH) * (maxP - minP)).toFixed(2);

    // Candle under cursor
    const candleIdx = Math.min(candleCount - 1, Math.max(0, Math.round(((x - leftMargin) / chartW) * (candleCount - 1))));
    const candle = candles[candleIdx];

    // Find nearest active uncrossed band
    const nearestCluster =
      priceUnderCursor > livePrice
        ? gridData.clustersAbove.find((c) => Math.abs(c.centerPrice - priceUnderCursor) < gridData.bucketStep * 2)
        : gridData.clustersBelow.find((c) => Math.abs(c.centerPrice - priceUnderCursor) < gridData.bucketStep * 2);

    setHoverInfo({
      x,
      y,
      price: priceUnderCursor,
      candle,
      activeLiqUsd: nearestCluster ? nearestCluster.usd : undefined,
      nearestCluster: nearestCluster ? `${nearestCluster.side === 'SHORT_LIQ' ? 'Short Liq Pool' : 'Long Liq Trap'} ($${(nearestCluster.usd / 1e6).toFixed(1)}M)` : undefined
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(3.5, prev * 1.15));
    } else {
      setZoomLevel((prev) => Math.max(0.6, prev / 1.15));
    }
  };

  const resetView = () => {
    setZoomLevel(1.0);
    setPanOffset(0);
  };

  const lints = useMemo(() => lintLiquidationProfile(profile), [profile]);
  const hinglishReport = useMemo(() => generateLiquidationHinglishReport(profile), [profile]);

  const jsonExport = useMemo(() => {
    return JSON.stringify(
      {
        asOf: new Date().toISOString(),
        asOfIst: new Date().toLocaleTimeString('en-IN') + ' IST',
        asset: profile.asset,
        symbol: resolveTargetSymbol(selectedAssetKey),
        livePrice: profile.price,
        openInterestUsd: gridData?.openInterestUsd ?? profile.oi_funding_context.oi_usd,
        spotPrice: gridData?.spotPrice ?? 0,
        perpPrice: gridData?.perpPrice ?? profile.price,
        basisDiffPct: gridData?.spotBasisDiffPct ?? 0,
        totalActiveShortLiqUsd: gridData?.totalActiveShortUsd ?? 0,
        totalActiveLongLiqUsd: gridData?.totalActiveLongUsd ?? 0,
        fuelUp: gridData?.fuelUpPoints ?? profile.fuel.up_points,
        fuelDown: gridData?.fuelDownPoints ?? profile.fuel.down_points,
        clustersAbove: gridData?.clustersAbove ?? [],
        clustersBelow: gridData?.clustersBelow ?? [],
        disclaimer: 'Liquidation maps are ESTIMATED models based on OI changes and clear-on-cross math. Not investment advice.'
      },
      null,
      2
    );
  }, [profile, selectedAssetKey, gridData, resolveTargetSymbol]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonExport);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* ── TOP HONEST SCOPE & DISCLAIMER BANNER ── */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-xs text-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="size-4 shrink-0 text-amber-400" />
          <span>
            <strong>HONEST SCOPE:</strong> Real exchange leverage is private. Heatmap levels are <strong>ESTIMATED MODELS</strong> (Clear-on-Cross OI Distribution). Only executed force orders are <strong>REAL</strong>. Evidence only — DEEEPR Master Engine decides trades.
          </span>
        </div>
        <button
          onClick={() => setShowAssumptionsModal(true)}
          className="text-amber-300 underline font-semibold hover:text-white shrink-0 cursor-pointer"
        >
          View Model Assumptions ↗
        </button>
      </div>

      {/* ── MASTER TERMINAL HEADER & TICKER STRIP ── */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0f1222]/95 via-[#0a0c18]/95 to-[#06070f]/95 p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                <Flame className="size-3.5 text-amber-400" />
                Coinglass-Style Heatmap (Clear-On-Cross Engine)
              </span>

              {/* Dynamic Live / Stale WS Badge */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono border ${
                wsStatus.isStale
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}>
                <span className={`size-1.5 rounded-full ${wsStatus.isStale ? 'bg-rose-400' : 'bg-emerald-400 animate-ping'}`}></span>
                {wsStatus.isStale ? 'STALE (>10s)' : `LIVE WS (${wsStatus.lastMsgSecondsAgo}s)`}
              </span>

              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-mono text-purple-300 border border-purple-500/20">
                MODEL: ESTIMATED (60% OI · 5x-100x)
              </span>

              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-300 border border-slate-700">
                MASTER ARBITER: {masterVerdict.state}
              </span>
            </div>

            {/* Live Synchronized Price & Basis Check */}
            <div className="flex items-baseline gap-3 mt-2 flex-wrap">
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono transition-colors duration-200 ${
                priceFlash === 'UP' ? 'text-emerald-400' : priceFlash === 'DOWN' ? 'text-rose-400' : 'text-white'
              }`}>
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: selectedAssetKey === 'GOLD' || selectedAssetKey === 'SILVER' ? 2 : 1 })}
              </h1>
              <span className={`text-sm font-mono font-bold ${priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
              </span>

              {/* Spot Cross-Check Chip */}
              {gridData && gridData.spotPrice > 0 && selectedAssetKey !== 'GOLD' && selectedAssetKey !== 'SILVER' && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                  gridData.isBasisWarning
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}>
                  <span>Spot: ${gridData.spotPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                  <span>•</span>
                  <span>Basis: {gridData.spotBasisDiffPct > 0 ? '+' : ''}{gridData.spotBasisDiffPct}%</span>
                  {gridData.isBasisWarning && <span className="text-rose-400 font-bold">⚠️ Warning</span>}
                </span>
              )}

              <span className="text-xs text-slate-400 font-mono">
                OI: {formatUsd(gridData?.openInterestUsd ?? profile.oi_funding_context.oi_usd)}
              </span>
            </div>

            {/* Gold / Silver Proxy Banner */}
            {(profile.asset === 'GOLD' || profile.asset === 'SILVER') && (
              <p className="text-xs text-amber-400/90 mt-1 font-mono">
                ⚠️ Note: Spot {profile.asset} has no public liquidation feed. Data is crypto perp proxy ({profile.price_source}), not COMEX physical spot.
              </p>
            )}
          </div>

          {/* ASSET SELECTOR BUTTONS */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto shrink-0">
            {(['BTC', 'ETH', 'SOL', 'GOLD', 'SILVER'] as const).map((assetKey) => (
              <button
                key={assetKey}
                onClick={() => {
                  setSelectedAssetKey(assetKey);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedAssetKey === assetKey
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {assetKey}
              </button>
            ))}
          </div>
        </div>

        {/* ── TIME RANGE SWITCHER & TOOLBAR ── */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Range Lookback:</span>
            {(['1d', '3d', '7d', '14d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-cyan-500 text-slate-950 font-extrabold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                {r === '1d' ? '1D (5m · 288)' : r === '3d' ? '3D (15m · 288)' : r === '7d' ? '7D (30m · 336)' : '14D (1h · 336)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRealBubbles(!showRealBubbles)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                showRealBubbles ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Real Force Orders: {showRealBubbles ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={resetView}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-mono cursor-pointer"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      {/* ── PRIMARY VIEW SELECTOR TABS ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('HEATMAP')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HEATMAP'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Flame className="size-3.5" />
            <span>Coinglass-Style Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('MAP')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MAP'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <BarChart2 className="size-3.5" />
            <span>Liquidation Depth Map</span>
          </button>
          <button
            onClick={() => setActiveTab('REAL_FEED')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REAL_FEED'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Activity className="size-3.5" />
            <span>Real Executed Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('MAX_PAIN')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MAX_PAIN'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Compass className="size-3.5" />
            <span>Options Max Pain</span>
          </button>
          <button
            onClick={() => setActiveTab('CLUSTERS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CLUSTERS'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Sliders className="size-3.5" />
            <span>Liquidity Clusters</span>
          </button>
          <button
            onClick={() => setActiveTab('REPORT_JSON')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REPORT_JSON'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Shield className="size-3.5" />
            <span>Hinglish Audit & JSON</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: AUTHENTIC COINGLASS HEATMAP WITH CLEAR-ON-CROSS ── */}
      {activeTab === 'HEATMAP' && (
        <div className="space-y-3">
          <div className="relative rounded-2xl border border-slate-800/80 bg-[#080512] p-3 overflow-hidden shadow-2xl">
            {/* Heatmap Canvas */}
            <canvas
              ref={canvasRef}
              width={1120}
              height={460}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              className="w-full h-[460px] rounded-lg block cursor-crosshair"
            />

            {/* Interactive Crosshair Tooltip Overlay */}
            {hoverInfo && (
              <div
                style={{
                  position: 'absolute',
                  left: Math.min(800, hoverInfo.x / (canvasRef.current?.width || 1120) * (canvasRef.current?.clientWidth || 1120) + 15),
                  top: Math.min(380, hoverInfo.y / (canvasRef.current?.height || 460) * (canvasRef.current?.clientHeight || 460) + 15),
                  pointerEvents: 'none'
                }}
                className="bg-slate-950/95 border border-cyan-500/50 rounded-lg p-2.5 text-xs font-mono shadow-2xl z-20 space-y-1"
              >
                <div className="text-cyan-300 font-bold">Level: ${hoverInfo.price.toLocaleString()}</div>
                {hoverInfo.nearestCluster && (
                  <div className="text-amber-300 font-bold">{hoverInfo.nearestCluster}</div>
                )}
                {hoverInfo.candle && (
                  <div className="text-slate-400 text-[11px]">
                    Candle: C: ${hoverInfo.candle.close.toLocaleString()} | Vol: {hoverInfo.candle.volume.toFixed(0)}
                  </div>
                )}
                <div className="text-[10px] text-slate-500">Wheel to Zoom · Drag to Pan</div>
              </div>
            )}

            {/* Bottom time and candle count indicator */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-6 pt-2">
              <span>{timeRange === '1d' ? '24 Hours ago' : timeRange === '3d' ? '3 Days ago' : timeRange === '7d' ? '7 Days ago' : '14 Days ago'}</span>
              <span>IST Timezone ({new Date().toLocaleTimeString('en-IN')} IST) · {gridData?.candles.length ?? 288} Binance Klines</span>
              <span>Live Edge (${livePrice.toLocaleString()})</span>
            </div>
          </div>

          {/* Quick Stats Grid under heatmap */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Nearest Short Magnet (Up)</span>
              <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                ${gridData?.clustersAbove[0]?.centerPrice.toLocaleString() ?? '—'} ({gridData?.clustersAbove[0]?.distancePct ?? 0}%)
              </p>
              <span className="text-[10px] text-slate-400">
                Est. Size: {formatUsd(gridData?.clustersAbove[0]?.usd ?? 0)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Nearest Long Trap (Down)</span>
              <p className="text-base font-bold text-rose-400 font-mono mt-0.5">
                ${gridData?.clustersBelow[0]?.centerPrice.toLocaleString() ?? '—'} ({gridData?.clustersBelow[0]?.distancePct ?? 0}%)
              </p>
              <span className="text-[10px] text-slate-400">
                Est. Size: {formatUsd(gridData?.clustersBelow[0]?.usd ?? 0)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Options Max Pain (K*)</span>
              <p className="text-base font-bold text-sky-400 font-mono mt-0.5">
                ${profile.options.max_pain.toLocaleString()} ({profile.options.distance_to_max_pain_pct}%)
              </p>
              <span className="text-[10px] text-slate-400">Expiry: {profile.options.hours_to_expiry}h baaki</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Fuel Up vs Down</span>
              <p className="text-base font-bold font-mono mt-0.5 text-cyan-300">
                +{gridData?.fuelUpPoints ?? profile.fuel.up_points} / -{gridData?.fuelDownPoints ?? profile.fuel.down_points} pts
              </p>
              <span className="text-[10px] text-slate-400">Ratio: {profile.realized.ratio_long_to_short_24h}x</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIQUIDATION DEPTH MAP (HORIZONTAL BARS) ── */}
      {activeTab === 'MAP' && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="size-4 text-cyan-400" />
                Estimated Liquidation Depth Map (Live Price Bins)
              </h2>
              <p className="text-xs text-slate-400">
                Amber bars = Short Liquidations (Forced Buys ABOVE price) · Red bars = Long Liquidations (Forced Sells BELOW price)
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Active Uncrossed: Short {formatUsd(gridData?.totalActiveShortUsd ?? 0)} · Long {formatUsd(gridData?.totalActiveLongUsd ?? 0)}
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {/* SHORT LIQUIDATIONS (ABOVE) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-800">
              <div className="text-[11px] text-amber-300 font-bold uppercase flex items-center justify-between">
                <span>Short Liquidation Clusters (Buy Fuel Above)</span>
                <span>Est. USD Size</span>
              </div>
              {(gridData?.clustersAbove ?? []).slice().reverse().map((cluster) => (
                <div key={cluster.id} className="flex items-center gap-2">
                  <span className="w-20 text-slate-400">${cluster.centerPrice.toLocaleString()}</span>
                  <div className="flex-1 bg-slate-800/60 rounded-full h-4 overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cluster.usd / Math.max(1, gridData?.maxIntensity995 ?? 1e8)) * 100)}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center px-2 text-[10px] text-slate-950 font-bold">
                      {cluster.label} (+{cluster.distancePct}% · {cluster.dominantLeverage})
                    </span>
                  </div>
                  <span className="w-20 text-right font-bold text-yellow-300">{formatUsd(cluster.usd)}</span>
                </div>
              ))}
            </div>

            {/* LIVE CURRENT PRICE DIVIDER */}
            <div className="py-2 px-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg flex items-center justify-between text-cyan-300 font-bold">
              <span>LIVE CURRENT PRICE: ${livePrice.toLocaleString()}</span>
              <span>1H ATR: ${profile.atr_1h}</span>
            </div>

            {/* LONG LIQUIDATIONS (BELOW) */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] text-rose-300 font-bold uppercase flex items-center justify-between">
                <span>Long Liquidation Clusters (Sell Fuel Below)</span>
                <span>Est. USD Size</span>
              </div>
              {(gridData?.clustersBelow ?? []).map((cluster) => (
                <div key={cluster.id} className="flex items-center gap-2">
                  <span className="w-20 text-slate-400">${cluster.centerPrice.toLocaleString()}</span>
                  <div className="flex-1 bg-slate-800/60 rounded-full h-4 overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cluster.usd / Math.max(1, gridData?.maxIntensity995 ?? 1e8)) * 100)}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-bold">
                      {cluster.label} (-{cluster.distancePct}% · {cluster.dominantLeverage})
                    </span>
                  </div>
                  <span className="w-20 text-right font-bold text-rose-300">{formatUsd(cluster.usd)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: REAL EXECUTED FEED & CASCADES ── */}
      {activeTab === 'REAL_FEED' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="size-4 text-emerald-400" />
                Real Executed Force Orders (Binance Futures Stream)
              </h2>
              <span className="text-xs text-slate-400">Live multi-venue liquidated orders</span>
            </div>

            {/* Rolling totals table */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              {(['5m', '15m', '1h', '4h', '24h'] as const).map((w) => {
                const win = profile.realized.window[w];
                return (
                  <div key={w} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{w} Window</div>
                    <div className="text-rose-400">L: ${(win.long_usd / 1e6).toFixed(2)}M</div>
                    <div className="text-emerald-400">S: ${(win.short_usd / 1e6).toFixed(2)}M</div>
                  </div>
                );
              })}
            </div>

            {/* Cascade Detector Box */}
            <div className={`p-4 rounded-xl border ${
              profile.realized.cascade.active
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <Shield className="size-4" />
                <span>Cascade Detector (Strict 3x Gates):</span>
                <span>{profile.realized.cascade.active ? 'ACTIVE CASCADE WARNING' : 'NO CASCADE (NORMAL FLOW)'}</span>
              </div>
              <p className="text-xs mt-1 text-slate-300">
                {profile.realized.cascade.message}
              </p>
            </div>
          </div>

          {/* Real Feed Live List */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono">Live Force Order Stream</h3>
            <div className="space-y-1.5 font-mono text-[11px] max-h-[380px] overflow-y-auto pr-1">
              {coinglassLiquidationEngine.getRealLiquidations().length > 0 ? (
                coinglassLiquidationEngine.getRealLiquidations().map((ev) => (
                  <div key={ev.id} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${ev.side === 'LONG' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {ev.side}
                      </span>
                      <span className="text-slate-300">{formatUsd(ev.usd)}</span>
                    </div>
                    <div className="text-right text-slate-400 text-[10px]">
                      <div>${ev.price.toLocaleString()}</div>
                      <div>{ev.symbol} · {new Date(ev.time).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-6">Listening for real force orders on WebSocket...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: OPTIONS MAX PAIN & GAMMA WALLS ── */}
      {activeTab === 'MAX_PAIN' && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="size-4 text-sky-400" />
                Options Max Pain & Strike Walls (Deribit / CME Proxy)
              </h2>
              <p className="text-xs text-slate-400">
                Max Pain K* is the strike price where option buyers collectively expire with minimum profit. Expiry: {profile.options.expiry_ist}.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300">
                Max Pain: ${profile.options.max_pain.toLocaleString()} ({profile.options.distance_to_max_pain_pct}%)
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                PCR (OI): {profile.options.pcr_oi}
              </span>
            </div>
          </div>

          {/* Pain Curve Table / Graph */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="py-2 px-3">Strike Price</th>
                  <th className="py-2 px-3">Call OI</th>
                  <th className="py-2 px-3">Put OI</th>
                  <th className="py-2 px-3">Calculated Buyer Pain ($)</th>
                  <th className="py-2 px-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {profile.options.pain_curve.map((row: OptionStrikeData) => {
                  const isMaxPain = row.strike === profile.options.max_pain;
                  return (
                    <tr key={row.strike} className={isMaxPain ? 'bg-sky-950/40 font-bold text-sky-200' : 'hover:bg-slate-800/30'}>
                      <td className="py-2 px-3 text-white">${row.strike.toLocaleString()}</td>
                      <td className="py-2 px-3 text-emerald-400">{row.callOi.toLocaleString()}</td>
                      <td className="py-2 px-3 text-rose-400">{row.putOi.toLocaleString()}</td>
                      <td className="py-2 px-3">${(row.painValue / 1e6).toFixed(1)}M</td>
                      <td className="py-2 px-3">
                        {isMaxPain ? (
                          <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 text-[10px] font-extrabold">
                            K* MAX PAIN MINIMA
                          </span>
                        ) : row.strike > profile.price ? (
                          <span className="text-amber-400">Call Resistance Wall</span>
                        ) : (
                          <span className="text-emerald-400">Put Support Wall</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: CLUSTERS & 3-SCENARIO MATRIX ── */}
      {activeTab === 'CLUSTERS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {profile.scenarios.map((sc, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-cyan-300">{sc.name} Scenario</span>
                  <span className="text-xs font-mono font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-cyan-200">
                    {sc.probability}% Probability
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div><strong>Trigger:</strong> {sc.trigger}</div>
                  <div><strong>Path:</strong> {sc.path}</div>
                  <div className="text-rose-400"><strong>Invalidation:</strong> {sc.invalidation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: HINGLISH AUDIT & STRICT JSON ── */}
      {activeTab === 'REPORT_JSON' && (
        <div className="space-y-4">
          {/* 10-Point Hinglish Report */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="size-4 text-emerald-400" />
              10-Point Institutional Hinglish Analysis Report
            </h2>
            <div className="space-y-2 text-xs text-slate-300 font-sans leading-relaxed">
              {hinglishReport.map((line, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Lint Tests T1-T12 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="size-4 text-cyan-400" />
              Pre-Output Lint & Regression Audit (Tests T1–T12)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
              {lints.map((lint) => (
                <div key={lint.code} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{lint.code}: {lint.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      lint.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' :
                      lint.status === 'WARN' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {lint.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{lint.details}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strict JSON Export */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-mono">Master Output JSON (Section 5 Spec)</span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-cyan-300/90 max-h-72 overflow-y-auto p-3 bg-slate-900/80 rounded-lg">
              {jsonExport}
            </pre>
          </div>
        </div>
      )}

      {/* ── ASSUMPTIONS MODAL ── */}
      {showAssumptionsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Estimated Liquidation Model Assumptions</h3>
              <button
                onClick={() => setShowAssumptionsModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 font-mono">
              <p>• <strong>Leverage Weights:</strong> 5x (10%), 10x (25%), 25x (30%), 50x (20%), 100x (15%).</p>
              <p>• <strong>Maintenance Margin Rate (MMR):</strong> 0.5% default tier assumption.</p>
              <p>• <strong>Formulas:</strong> Long Liq ≈ Entry × (1 - 1/L + MMR); Short Liq ≈ Entry × (1 + 1/L - MMR).</p>
              <p>• <strong>Clear-On-Cross:</strong> Price-crossed levels are cleared at the crossing candle.</p>
              <p>• <strong>Gold/Silver:</strong> Crypto perp proxy (Binance PAXGUSDT/SLVUSDT), not COMEX physical spot.</p>
            </div>
            <button
              onClick={() => setShowAssumptionsModal(false)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white cursor-pointer"
            >
              Close Popover
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeeeprLiquidationHubView;
