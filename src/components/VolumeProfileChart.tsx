import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Candle,
  VolumeProfileResult,
  TradeDecision,
  ProfileType,
  AssetSymbol
} from '../data/volumeProfileDatabase';
import {
  Maximize2,
  Eye,
  Sliders,
  Crosshair as CrosshairIcon,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Shield,
  Target
} from 'lucide-react';

interface VolumeProfileChartProps {
  symbol: AssetSymbol;
  candles: Candle[];
  profile: VolumeProfileResult;
  decision: TradeDecision;
  currentPrice: number;
  profileType: ProfileType;
  vaPct: number;
  onRangeChange?: (startIndex: number, endIndex: number) => void;
  height?: number;
}

export const VolumeProfileChart: React.FC<VolumeProfileChartProps> = ({
  symbol,
  candles,
  profile,
  decision,
  currentPrice,
  profileType,
  vaPct,
  onRangeChange,
  height = 540
}) => {
  // View options & indicators
  const [showPoc, setShowPoc] = useState<boolean>(true);
  const [showVa, setShowVa] = useState<boolean>(true);
  const [showHvnsLvns, setShowHvnsLvns] = useState<boolean>(true);
  const [showTradeLevels, setShowTradeLevels] = useState<boolean>(true);
  const [showVolumeBars, setShowVolumeBars] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'BUY_SELL_DELTA' | 'VALUE_AREA'>('BUY_SELL_DELTA');

  // Interactive FRVP Range Sliders (indices)
  const [rangeStart, setRangeStart] = useState<number>(0);
  const [rangeEnd, setRangeEnd] = useState<number>(candles.length - 1);

  // Mouse crosshair state
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: Candle | null; price: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Synchronize range when candle length changes
  useEffect(() => {
    if (candles.length > 0) {
      if (profileType === 'FRVP') {
        setRangeStart(Math.max(0, candles.length - 48));
        setRangeEnd(candles.length - 1);
      } else {
        setRangeStart(0);
        setRangeEnd(candles.length - 1);
      }
    }
  }, [candles.length, profileType]);

  // Compute price scales
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const start = Math.max(0, Math.min(rangeStart, candles.length - 2));
    const end = Math.min(candles.length, Math.max(start + 2, rangeEnd + 1));
    return candles.slice(start, end);
  }, [candles, rangeStart, rangeEnd]);

  const { minPrice, maxPrice, priceRange, maxVol } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { minPrice: 1, maxPrice: 10, priceRange: 9, maxVol: 1 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxV = 1;

    for (const c of visibleCandles) {
      if (c.l < min) min = c.l;
      if (c.h > max) max = c.h;
      if (c.v > maxV) maxV = c.v;
    }

    // Include decision trade levels so they never get clipped
    if (showTradeLevels) {
      if (decision.stopLoss < min) min = decision.stopLoss;
      if (decision.tp2 > max) max = decision.tp2;
    }

    const padding = (max - min) * 0.04 || 1;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: max - min + padding * 2,
      maxVol: maxV
    };
  }, [visibleCandles, showTradeLevels, decision]);

  // SVG Dimension Constants
  const width = 1000;
  const chartHeight = height;
  const paddingLeft = 16;
  const paddingRight = 140; // Dedicated right column for Volume Profile histogram & price axis
  const paddingTop = 24;
  const paddingBottom = 40;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const volumeBarMaxHeight = plotHeight * 0.22;

  // Coordinate transforms
  const getY = (p: number) => {
    return paddingTop + (1 - (p - minPrice) / priceRange) * plotHeight;
  };

  const getPriceFromY = (y: number) => {
    const ratio = 1 - (y - paddingTop) / plotHeight;
    return minPrice + ratio * priceRange;
  };

  const candleWidth = visibleCandles.length > 0 ? Math.max(2, (plotWidth / visibleCandles.length) * 0.72) : 6;
  const candleSpacing = visibleCandles.length > 0 ? plotWidth / visibleCandles.length : 10;

  // Format helper
  const fmt = (val: number) => {
    if (val >= 1000) {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
    }
    return `$${val.toFixed(2)}`;
  };

  // Crosshair mouse movement
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgX = (clientX / rect.width) * width;
    const svgY = (clientY / rect.height) * chartHeight;

    if (svgX >= paddingLeft && svgX <= paddingLeft + plotWidth && svgY >= paddingTop && svgY <= paddingTop + plotHeight) {
      const candleIdx = Math.floor((svgX - paddingLeft) / candleSpacing);
      const candle = visibleCandles[Math.max(0, Math.min(visibleCandles.length - 1, candleIdx))] || null;
      const price = getPriceFromY(svgY);
      setCrosshair({ x: svgX, y: svgY, candle, price });
    } else {
      setCrosshair(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-slate-800 bg-[#070b14] p-3 text-slate-200 shadow-2xl">
      {/* ── TOP CHART CONTROLS & TELEMETRY STRIP ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-sky-400">
            <Activity className="size-3.5 text-sky-400 animate-pulse" />
            <span>VOLUME PROFILE ENGINE</span>
          </span>
          <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300 border border-sky-500/20">
            {profileType} (VA: {vaPct}%)
          </span>
          <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/20">
            POC: {profile.pocFormatted}
          </span>
          <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/20">
            VAH: {profile.vahFormatted}
          </span>
          <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/20">
            VAL: {profile.valFormatted}
          </span>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowPoc(!showPoc)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              showPoc
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            POC Line
          </button>
          <button
            onClick={() => setShowVa(!showVa)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              showVa
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            VAH / VAL
          </button>
          <button
            onClick={() => setShowHvnsLvns(!showHvnsLvns)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              showHvnsLvns
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            HVN / LVN
          </button>
          <button
            onClick={() => setShowTradeLevels(!showTradeLevels)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              showTradeLevels
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            Entry / SL / TP
          </button>
          <button
            onClick={() => setColorMode(colorMode === 'BUY_SELL_DELTA' ? 'VALUE_AREA' : 'BUY_SELL_DELTA')}
            className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
            title="Toggle between Buy/Sell Delta and Value Area color modes"
          >
            {colorMode === 'BUY_SELL_DELTA' ? '🎨 Delta Split' : '🎨 VA Shading'}
          </button>
        </div>
      </div>

      {/* ── FRVP RANGE SLIDERS (ACTIVE WHEN FRVP PROFILE SELECTED) ── */}
      {profileType === 'FRVP' && (
        <div className="flex items-center gap-3 bg-[#0c1222] px-3 py-1.5 rounded-lg border border-slate-800 mt-2 text-xs font-mono">
          <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
            <Sliders className="size-3" />
            Fixed Range (FRVP):
          </span>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-slate-400">Start Bar #{rangeStart}</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, rangeEnd - 5)}
              value={rangeStart}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setRangeStart(val);
                onRangeChange?.(val, rangeEnd);
              }}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] text-slate-400">End Bar #{rangeEnd}</span>
            <input
              type="range"
              min={Math.min(rangeStart + 5, candles.length - 1)}
              max={candles.length - 1}
              value={rangeEnd}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setRangeEnd(val);
                onRangeChange?.(rangeStart, val);
              }}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>
      )}

      {/* ── MAIN INTERACTIVE SVG CHART CANVAS ── */}
      <div className="relative mt-2 overflow-hidden rounded-lg bg-[#0a0f1d] border border-slate-800/80 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradients for Volume Profile Bars */}
            <linearGradient id="vpBuyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="vpSellGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="vpVaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="vpNonVaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines (Horizontal Price Intervals) */}
          {[0.15, 0.35, 0.55, 0.75, 0.95].map((ratio, idx) => {
            const p = minPrice + ratio * priceRange;
            const y = getY(p);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={width - paddingRight + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {fmt(p)}
                </text>
              </g>
            );
          })}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* HORIZONTAL VOLUME PROFILE HISTOGRAM (ALIGNED ON RIGHT SIDE)        */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {profile.rows.map((row, idx) => {
            const yCenter = getY(row.priceLevel);
            const rowHeight = Math.max(2, plotHeight / profile.rows.length);
            const maxBarWidth = paddingRight - 35; // Maximum width available for profile histogram
            const totalBarWidth = (row.volumePct / 100) * maxBarWidth;

            // Buy vs Sell split widths
            const buyRatio = row.totalVolume > 0 ? row.buyVolume / row.totalVolume : 0.5;
            const buyWidth = totalBarWidth * buyRatio;
            const sellWidth = totalBarWidth * (1 - buyRatio);

            const barX = width - paddingRight;

            return (
              <g key={idx} className="transition-opacity hover:opacity-100">
                {colorMode === 'BUY_SELL_DELTA' ? (
                  <>
                    {/* Buy Volume Bar */}
                    <rect
                      x={barX}
                      y={yCenter - rowHeight / 2}
                      width={Math.max(1, buyWidth)}
                      height={rowHeight - 1}
                      fill="url(#vpBuyGrad)"
                      rx="1"
                    />
                    {/* Sell Volume Bar */}
                    <rect
                      x={barX + buyWidth}
                      y={yCenter - rowHeight / 2}
                      width={Math.max(1, sellWidth)}
                      height={rowHeight - 1}
                      fill="url(#vpSellGrad)"
                      rx="1"
                    />
                  </>
                ) : (
                  /* Value Area Highlight Mode */
                  <rect
                    x={barX}
                    y={yCenter - rowHeight / 2}
                    width={Math.max(1, totalBarWidth)}
                    height={rowHeight - 1}
                    fill={row.isInValueArea ? 'url(#vpVaGrad)' : 'url(#vpNonVaGrad)'}
                    rx="1"
                  />
                )}

                {/* POC Row Highlight Border */}
                {row.isPoc && showPoc && (
                  <rect
                    x={barX}
                    y={yCenter - rowHeight / 2}
                    width={totalBarWidth + 4}
                    height={rowHeight - 1}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* VALUE AREA BOUNDARIES (VAH & VAL) & POINT OF CONTROL (POC) LINES   */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showVa && profile.vah > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(profile.vah)}
                x2={width}
                y2={getY(profile.vah)}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(profile.vah) - 10}
                width={80}
                height={16}
                fill="#0e7490"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(profile.vah) + 2}
                fill="#ecfeff"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                VAH {fmt(profile.vah)}
              </text>
            </g>
          )}

          {showVa && profile.val > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(profile.val)}
                x2={width}
                y2={getY(profile.val)}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(profile.val) - 10}
                width={80}
                height={16}
                fill="#0e7490"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(profile.val) + 2}
                fill="#ecfeff"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                VAL {fmt(profile.val)}
              </text>
            </g>
          )}

          {/* POC (Point of Control) Horizon Line */}
          {showPoc && profile.poc > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(profile.poc)}
                x2={width}
                y2={getY(profile.poc)}
                stroke="#f43f5e"
                strokeWidth="2.2"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(profile.poc) - 11}
                width={84}
                height={18}
                fill="#be123c"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(profile.poc) + 2}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                POC {fmt(profile.poc)}
              </text>
            </g>
          )}

          {/* HVNs and LVNs Tag Markers */}
          {showHvnsLvns && profile.hvns.map((hvn, i) => (
            <g key={`hvn-${i}`}>
              <circle
                cx={width - paddingRight - 4}
                cy={getY(hvn)}
                r="3"
                fill="#f59e0b"
              />
              <text
                x={width - paddingRight - 32}
                y={getY(hvn) + 3}
                fill="#fbbf24"
                fontSize="8"
                fontFamily="monospace"
              >
                HVN
              </text>
            </g>
          ))}

          {showHvnsLvns && profile.lvns.map((lvn, i) => (
            <g key={`lvn-${i}`}>
              <circle
                cx={width - paddingRight - 4}
                cy={getY(lvn)}
                r="2.5"
                fill="#64748b"
              />
              <text
                x={width - paddingRight - 32}
                y={getY(lvn) + 3}
                fill="#94a3b8"
                fontSize="8"
                fontFamily="monospace"
              >
                LVN
              </text>
            </g>
          ))}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* VOLUME HISTOGRAM BARS AT BOTTOM OF CHART                          */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showVolumeBars && visibleCandles.map((c, i) => {
            const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
            const barH = (c.v / maxVol) * volumeBarMaxHeight;
            const barY = paddingTop + plotHeight - barH;
            const isBull = c.c >= c.o;
            return (
              <rect
                key={`vol-${i}`}
                x={x - candleWidth / 2}
                y={barY}
                width={candleWidth}
                height={barH}
                fill={isBull ? '#10b981' : '#f43f5e'}
                opacity={0.35}
              />
            );
          })}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* CANDLESTICK RENDERING (WICKS + BODIES)                            */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {visibleCandles.map((c, i) => {
            const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
            const isBull = c.c >= c.o;
            const yOpen = getY(c.o);
            const yClose = getY(c.c);
            const yHigh = getY(c.h);
            const yLow = getY(c.l);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
            const candleColor = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* TRADE SETUP LEVELS OVERLAY (ENTRY, STOP-LOSS, TP1, TP2, TP3)       */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showTradeLevels && decision.status !== 'NO TRADE / DATA UNAVAILABLE' && (
            <g>
              {/* Take Profit 2 Line */}
              <line
                x1={paddingLeft}
                y1={getY(decision.tp2)}
                x2={width - paddingRight}
                y2={getY(decision.tp2)}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <text
                x={paddingLeft + 6}
                y={getY(decision.tp2) - 4}
                fill="#34d399"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                TP2: {decision.tp2Formatted} ({decision.riskRewardRatio})
              </text>

              {/* Take Profit 1 Line */}
              <line
                x1={paddingLeft}
                y1={getY(decision.tp1)}
                x2={width - paddingRight}
                y2={getY(decision.tp1)}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft + 6}
                y={getY(decision.tp1) - 4}
                fill="#34d399"
                fontSize="9"
                fontFamily="monospace"
              >
                TP1: {decision.tp1Formatted}
              </text>

              {/* Stop Loss Line */}
              <line
                x1={paddingLeft}
                y1={getY(decision.stopLoss)}
                x2={width - paddingRight}
                y2={getY(decision.stopLoss)}
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <text
                x={paddingLeft + 6}
                y={getY(decision.stopLoss) - 4}
                fill="#f87171"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                STOP LOSS: {decision.stopLossFormatted}
              </text>
            </g>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* CURRENT LIVE PRICE DASHED RAY & PILL                               */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <g>
            <line
              x1={paddingLeft}
              y1={getY(currentPrice)}
              x2={width}
              y2={getY(currentPrice)}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            <rect
              x={width - paddingRight + 2}
              y={getY(currentPrice) - 10}
              width={82}
              height={18}
              fill="#0284c7"
              rx="3"
            />
            <text
              x={width - paddingRight + 6}
              y={getY(currentPrice) + 3}
              fill="#ffffff"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {fmt(currentPrice)}
            </text>
          </g>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* CROSSHAIR & REAL-TIME INSPECTION TOOLTIP                           */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {crosshair && (
            <g pointerEvents="none">
              {/* Vertical Crosshair Line */}
              <line
                x1={crosshair.x}
                y1={paddingTop}
                x2={crosshair.x}
                y2={paddingTop + plotHeight}
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1={paddingLeft}
                y1={crosshair.y}
                x2={width - paddingRight}
                y2={crosshair.y}
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />

              {/* Price Tag at Crosshair Y */}
              <rect
                x={width - paddingRight + 2}
                y={crosshair.y - 9}
                width={70}
                height={16}
                fill="#334155"
                rx="2"
              />
              <text
                x={width - paddingRight + 6}
                y={crosshair.y + 3}
                fill="#f8fafc"
                fontSize="9"
                fontFamily="monospace"
              >
                {fmt(crosshair.price)}
              </text>

              {/* Candle Telemetry Box on Crosshair hover */}
              {crosshair.candle && (
                <g>
                  <rect
                    x={Math.min(crosshair.x + 12, width - paddingRight - 150)}
                    y={Math.max(paddingTop + 10, crosshair.y - 70)}
                    width={140}
                    height={68}
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={Math.min(crosshair.x + 18, width - paddingRight - 144)}
                    y={Math.max(paddingTop + 24, crosshair.y - 56)}
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    O: {fmt(crosshair.candle.o)}
                  </text>
                  <text
                    x={Math.min(crosshair.x + 18, width - paddingRight - 144)}
                    y={Math.max(paddingTop + 37, crosshair.y - 43)}
                    fill="#34d399"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    H: {fmt(crosshair.candle.h)}  L: {fmt(crosshair.candle.l)}
                  </text>
                  <text
                    x={Math.min(crosshair.x + 18, width - paddingRight - 144)}
                    y={Math.max(paddingTop + 50, crosshair.y - 30)}
                    fill={crosshair.candle.c >= crosshair.candle.o ? '#34d399' : '#f87171'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    C: {fmt(crosshair.candle.c)}
                  </text>
                  <text
                    x={Math.min(crosshair.x + 18, width - paddingRight - 144)}
                    y={Math.max(paddingTop + 63, crosshair.y - 17)}
                    fill="#94a3b8"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    Vol: {crosshair.candle.v.toLocaleString()}
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* ── BOTTOM TIME SCALE / RANGE LEGEND ── */}
      <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>{visibleCandles.length} Visible Candlesticks</span>
          <span>•</span>
          <span className="text-emerald-400">Total Buy Vol: {profile.buyVolumeTotal.toLocaleString()}</span>
          <span>•</span>
          <span className="text-rose-400">Total Sell Vol: {profile.sellVolumeTotal.toLocaleString()}</span>
          <span>•</span>
          <span className={profile.cvdTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Net Delta: {profile.cvdTotal >= 0 ? '+' : ''}{profile.cvdTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Histogram scale: Total Traded Volume @ Price Bin</span>
        </div>
      </div>
    </div>
  );
};
