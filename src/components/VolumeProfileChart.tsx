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
  Target,
  Palette,
  Check,
  Zap,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

interface VolumeProfileChartProps {
  symbol: AssetSymbol;
  candles: Candle[];
  profile: VolumeProfileResult;
  decision: TradeDecision;
  currentPrice: number;
  profileType: ProfileType;
  vaPct: number;
  isManualMode?: boolean;
  onRangeChange?: (startIndex: number, endIndex: number) => void;
  onToggleManualMode?: (manual: boolean) => void;
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
  isManualMode = false,
  onRangeChange,
  onToggleManualMode,
  height = 560
}) => {
  // Display Options
  const [showPoc, setShowPoc] = useState<boolean>(true);
  const [showVa, setShowVa] = useState<boolean>(true);
  const [showVaShading, setShowVaShading] = useState<boolean>(true);
  const [showOverboughtOversoldZones, setShowOverboughtOversoldZones] = useState<boolean>(true);
  const [showHvnsLvns, setShowHvnsLvns] = useState<boolean>(true);
  const [showTradeLevels, setShowTradeLevels] = useState<boolean>(true);
  const [showPositionBox, setShowPositionBox] = useState<boolean>(true);
  const [showVolumeBars, setShowVolumeBars] = useState<boolean>(true);

  // Profile Rendering Style: OVERLAY_ON_CANDLES (CoinGlass / FRVP style) vs RIGHT_COLUMN
  const [profileStyle, setProfileStyle] = useState<'OVERLAY_ON_CANDLES' | 'RIGHT_COLUMN'>('OVERLAY_ON_CANDLES');

  // Color Theme: COINGLASS (Blue / Orange) vs CLASSIC (Green / Pink)
  const [colorTheme, setColorTheme] = useState<'COINGLASS' | 'CLASSIC'>('COINGLASS');

  // Interactive FRVP Range Sliders (indices)
  const [rangeStart, setRangeStart] = useState<number>(0);
  const [rangeEnd, setRangeEnd] = useState<number>(candles.length - 1);

  // Mouse crosshair state
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: Candle | null; price: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Synchronize range when candle length changes
  useEffect(() => {
    if (candles.length > 0) {
      if (profileType === 'FRVP' || isManualMode) {
        setRangeStart(Math.max(0, candles.length - 48));
        setRangeEnd(candles.length - 1);
      } else {
        setRangeStart(0);
        setRangeEnd(candles.length - 1);
      }
    }
  }, [candles.length, profileType, isManualMode]);

  // Compute visible candle slice
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const start = Math.max(0, Math.min(rangeStart, candles.length - 2));
    const end = Math.min(candles.length, Math.max(start + 2, rangeEnd + 1));
    return candles.slice(start, end);
  }, [candles, rangeStart, rangeEnd]);

  // Price coordinate bounds
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

    // Include VAH, VAL, and decision trade levels so they never get clipped
    if (profile.vah > 0 && profile.vah > max) max = profile.vah;
    if (profile.val > 0 && profile.val < min) min = profile.val;

    if (showTradeLevels && decision.status !== 'NO TRADE / DATA UNAVAILABLE') {
      if (decision.stopLoss < min) min = decision.stopLoss;
      if (decision.stopLoss > max) max = decision.stopLoss;
      if (decision.tp2 < min) min = decision.tp2;
      if (decision.tp2 > max) max = decision.tp2;
    }

    const padding = (max - min) * 0.05 || 1;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: max - min + padding * 2,
      maxVol: maxV
    };
  }, [visibleCandles, showTradeLevels, decision, profile.vah, profile.val]);

  // SVG Dimension Constants
  const width = 1000;
  const chartHeight = height;
  const paddingLeft = 16;
  const paddingRight = profileStyle === 'RIGHT_COLUMN' ? 140 : 80;
  const paddingTop = 28;
  const paddingBottom = 40;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const volumeBarMaxHeight = plotHeight * 0.18;

  // Coordinate transforms
  const getY = (p: number) => {
    return paddingTop + (1 - (p - minPrice) / priceRange) * plotHeight;
  };

  const getPriceFromY = (y: number) => {
    const ratio = 1 - (y - paddingTop) / plotHeight;
    return minPrice + ratio * priceRange;
  };

  const candleWidth = visibleCandles.length > 0 ? Math.max(2.5, (plotWidth / visibleCandles.length) * 0.72) : 6;
  const candleSpacing = visibleCandles.length > 0 ? plotWidth / visibleCandles.length : 10;

  // Format helper
  const fmt = (val: number) => {
    if (val >= 1000) {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Colors based on theme (CoinGlass vs Classic)
  const buyBarColor = colorTheme === 'COINGLASS' ? '#2563eb' : '#10b981';
  const sellBarColor = colorTheme === 'COINGLASS' ? '#ea580c' : '#ec4899';

  return (
    <div className="relative flex flex-col rounded-xl border border-slate-800 bg-[#070b14] p-3 text-slate-200 shadow-2xl">
      {/* ── TOP CHART CONTROLS & TELEMETRY STRIP ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-black text-cyan-400">
            <Activity className="size-3.5 text-cyan-400 animate-pulse" />
            <span>VOLUME PROFILE ENGINE</span>
          </span>

          {/* Mode Badge */}
          <span className={`rounded px-2.5 py-0.5 text-[11px] font-black border ${
            isManualMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
          }`}>
            {isManualMode ? '🖐️ MANUAL FRVP (CUSTOM ANCHOR)' : '🤖 AUTOMATIC (VISIBLE RANGE VPVR)'}
          </span>

          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/40">
            POC: {profile.pocFormatted}
          </span>
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/40">
            VAH: {profile.vahFormatted} (70%)
          </span>
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/40">
            VAL: {profile.valFormatted} (70%)
          </span>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Overlay Style Switcher */}
          <button
            onClick={() => setProfileStyle(profileStyle === 'OVERLAY_ON_CANDLES' ? 'RIGHT_COLUMN' : 'OVERLAY_ON_CANDLES')}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              profileStyle === 'OVERLAY_ON_CANDLES'
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            title="Toggle between CoinGlass/FRVP Over-Candle overlay and Right-Axis layout"
          >
            {profileStyle === 'OVERLAY_ON_CANDLES' ? '📊 Chart Overlay (CoinGlass)' : '📑 Right Column'}
          </button>

          {/* Color Theme Switcher */}
          <button
            onClick={() => setColorTheme(colorTheme === 'COINGLASS' ? 'CLASSIC' : 'COINGLASS')}
            className="px-2 py-1 rounded text-[10px] font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
            title="Toggle color theme"
          >
            {colorTheme === 'COINGLASS' ? '🎨 Blue/Orange' : '🎨 Green/Pink'}
          </button>

          {/* POC Toggle */}
          <button
            onClick={() => setShowPoc(!showPoc)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              showPoc
                ? 'bg-rose-500/25 border-rose-500 text-rose-300 font-black'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            POC Line
          </button>

          {/* VAH / VAL Toggle */}
          <button
            onClick={() => setShowVa(!showVa)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              showVa
                ? 'bg-cyan-500/25 border-cyan-500 text-cyan-300 font-black'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            VAH / VAL
          </button>

          {/* 70% Value Area Shading Toggle */}
          <button
            onClick={() => setShowVaShading(!showVaShading)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              showVaShading
                ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300 font-black'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            70% VA Box
          </button>

          {/* Overbought / Oversold Bands */}
          <button
            onClick={() => setShowOverboughtOversoldZones(!showOverboughtOversoldZones)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              showOverboughtOversoldZones
                ? 'bg-purple-500/25 border-purple-500 text-purple-300 font-black'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            OB / OS Zones
          </button>

          {/* Trade Setup Position Box (Long/Short Box) */}
          <button
            onClick={() => setShowPositionBox(!showPositionBox)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              showPositionBox
                ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-black'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            Position Tool
          </button>
        </div>
      </div>

      {/* ── MANUAL FRVP RANGE ANCHOR CONTROLS (ACTIVE WHEN IN MANUAL MODE OR FRVP) ── */}
      {isManualMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-950/25 px-3 py-2 rounded-lg border border-amber-500/40 mt-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-black flex items-center gap-1.5 shrink-0">
              <Sliders className="size-3.5 text-amber-400" />
              <span>MANUAL FRVP ANCHORS:</span>
            </span>
            <span className="text-[11px] text-slate-300 hidden sm:inline">
              Drag anchors to calculate profile over custom impulse or consolidation range
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <span className="text-[10px] text-amber-300 font-bold shrink-0">Start Bar #{rangeStart}</span>
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
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] text-amber-300 font-bold shrink-0">End Bar #{rangeEnd}</span>
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
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const s = Math.max(0, candles.length - 30);
                setRangeStart(s);
                setRangeEnd(candles.length - 1);
                onRangeChange?.(s, candles.length - 1);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-amber-300 hover:text-white"
            >
              Last 30 Bars
            </button>
            <button
              onClick={() => {
                const s = Math.max(0, candles.length - 60);
                setRangeStart(s);
                setRangeEnd(candles.length - 1);
                onRangeChange?.(s, candles.length - 1);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-amber-300 hover:text-white"
            >
              Last 60 Bars
            </button>
            <button
              onClick={() => {
                setRangeStart(0);
                setRangeEnd(candles.length - 1);
                onRangeChange?.(0, candles.length - 1);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white"
            >
              Full Range
            </button>
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
              <stop offset="0%" stopColor={buyBarColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={buyBarColor} stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="vpSellGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={sellBarColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={sellBarColor} stopOpacity="0.85" />
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

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 1. OVERBOUGHT (> VAH) & OVERSOLD (< VAL) SHADED BACKGROUND BANDS    */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showOverboughtOversoldZones && profile.vah > 0 && (
            <g>
              {/* Overbought / Premium Zone (> VAH) */}
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={plotWidth}
                height={Math.max(0, getY(profile.vah) - paddingTop)}
                fill="#ef4444"
                fillOpacity="0.06"
              />
              <text
                x={paddingLeft + 10}
                y={paddingTop + 14}
                fill="#f87171"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="1"
              >
                🔴 OVERBOUGHT / PREMIUM ZONE (&gt; VAH) — WATCH FOR SUPPLY REJECTION
              </text>
            </g>
          )}

          {showOverboughtOversoldZones && profile.val > 0 && (
            <g>
              {/* Oversold / Discount Zone (< VAL) */}
              <rect
                x={paddingLeft}
                y={getY(profile.val)}
                width={plotWidth}
                height={Math.max(0, paddingTop + plotHeight - getY(profile.val))}
                fill="#10b981"
                fillOpacity="0.06"
              />
              <text
                x={paddingLeft + 10}
                y={paddingTop + plotHeight - 8}
                fill="#34d399"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="1"
              >
                🟢 OVERSOLD / DISCOUNT ZONE (&lt; VAL) — WATCH FOR DEMAND RECLAIM
              </text>
            </g>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 2. 70% VALUE AREA SHADED RECTANGLE (VAH TO VAL)                   */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showVaShading && profile.vah > 0 && profile.val > 0 && (
            <g>
              <rect
                x={paddingLeft}
                y={getY(profile.vah)}
                width={plotWidth}
                height={Math.max(0, getY(profile.val) - getY(profile.vah))}
                fill="#06b6d4"
                fillOpacity="0.05"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity="0.3"
              />
              <text
                x={width - paddingRight - 180}
                y={getY(profile.vah) + 14}
                fill="#06b6d4"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                opacity="0.8"
              >
                70% VALUE AREA (FAIR VALUE ZONE)
              </text>
            </g>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 3. BACKGROUND GRID LINES (HORIZONTAL PRICE INTERVALS)             */}
          {/* ────────────────────────────────────────────────────────────────── */}
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
          {/* 4. MANUAL FRVP ANCHORED SELECTION RECTANGLE (WHEN MANUAL)          */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {isManualMode && (
            <g>
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={plotWidth}
                height={plotHeight}
                fill="#f59e0b"
                fillOpacity="0.02"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="6 4"
                strokeOpacity="0.4"
              />
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={paddingTop + plotHeight}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <line
                x1={paddingLeft + plotWidth}
                y1={paddingTop}
                x2={paddingLeft + plotWidth}
                y2={paddingTop + plotHeight}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <text
                x={paddingLeft + 6}
                y={paddingTop + 14}
                fill="#f59e0b"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                [ FRVP ANCHOR: BAR #{rangeStart} ]
              </text>
            </g>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 5. VOLUME PROFILE HISTOGRAM (COINGLASS OVERLAY ON CANDLES OR RIGHT) */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {profile.rows.map((row, idx) => {
            const yCenter = getY(row.priceLevel);
            const rowHeight = Math.max(2.2, plotHeight / profile.rows.length);

            // Determine maximum width and anchor X based on profileStyle
            const isOverlay = profileStyle === 'OVERLAY_ON_CANDLES';
            const maxBarWidth = isOverlay ? plotWidth * 0.42 : paddingRight - 35;
            const totalBarWidth = (row.volumePct / 100) * maxBarWidth;

            // Buy vs Sell split widths
            const buyRatio = row.totalVolume > 0 ? row.buyVolume / row.totalVolume : 0.5;
            const buyWidth = totalBarWidth * buyRatio;
            const sellWidth = totalBarWidth * (1 - buyRatio);

            const barX = isOverlay ? paddingLeft : width - paddingRight;

            return (
              <g key={idx} className="transition-opacity hover:opacity-100">
                {/* Buy / Up Volume Bar */}
                <rect
                  x={barX}
                  y={yCenter - rowHeight / 2}
                  width={Math.max(1, buyWidth)}
                  height={rowHeight - 0.8}
                  fill="url(#vpBuyGrad)"
                  rx="1"
                  opacity={isOverlay ? 0.75 : 0.9}
                />
                {/* Sell / Down Volume Bar */}
                <rect
                  x={barX + buyWidth}
                  y={yCenter - rowHeight / 2}
                  width={Math.max(1, sellWidth)}
                  height={rowHeight - 0.8}
                  fill="url(#vpSellGrad)"
                  rx="1"
                  opacity={isOverlay ? 0.75 : 0.9}
                />

                {/* POC Row Highlight Border */}
                {row.isPoc && showPoc && (
                  <rect
                    x={barX}
                    y={yCenter - rowHeight / 2}
                    width={totalBarWidth + 4}
                    height={rowHeight - 0.8}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.8"
                  />
                )}
              </g>
            );
          })}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 6. VAH & VAL HORIZONTAL LINES (70% VALUE AREA BOUNDARIES)         */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showVa && profile.vah > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(profile.vah)}
                x2={width}
                y2={getY(profile.vah)}
                stroke="#06b6d4"
                strokeWidth="1.8"
                strokeDasharray="5 3"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(profile.vah) - 10}
                width={86}
                height={18}
                fill="#0e7490"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(profile.vah) + 3}
                fill="#ecfeff"
                fontSize="9.5"
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
                strokeWidth="1.8"
                strokeDasharray="5 3"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(profile.val) - 10}
                width={86}
                height={18}
                fill="#0e7490"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(profile.val) + 3}
                fill="#ecfeff"
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                VAL {fmt(profile.val)}
              </text>
            </g>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 7. POC (POINT OF CONTROL) RED LINE ACROSS PRICE AREA              */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showPoc && profile.poc > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(profile.poc)}
                x2={width}
                y2={getY(profile.poc)}
                stroke="#ef4444"
                strokeWidth="2.5"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(profile.poc) - 11}
                width={90}
                height={20}
                fill="#be123c"
                rx="3"
                filter="drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(profile.poc) + 3}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="black"
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
          {/* 8. VOLUME HISTOGRAM BARS AT BOTTOM OF CHART                        */}
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
          {/* 9. CANDLESTICK RENDERING (WICKS + BODIES)                          */}
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
          {/* 10. TRADE SETUP POSITION TOOL (RISK:REWARD BOX LIKE IITIAN TRADER) */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {showPositionBox && decision.status !== 'NO TRADE / DATA UNAVAILABLE' && (
            <g>
              {(() => {
                const isShort = decision.status === 'SHORT SETUP';
                const entryY = getY(decision.entryPrice);
                const slY = getY(decision.stopLoss);
                const tpY = getY(decision.tp2 || decision.tp1);

                const boxStartX = width - paddingRight - 160;
                const boxWidth = 150;

                // For short: SL is higher than entry (smaller Y in SVG)
                const slBoxTop = Math.min(entryY, slY);
                const slBoxHeight = Math.abs(slY - entryY);

                // For short: TP is lower than entry (larger Y in SVG)
                const tpBoxTop = Math.min(entryY, tpY);
                const tpBoxHeight = Math.abs(tpY - entryY);

                return (
                  <g opacity="0.85">
                    {/* Red Stop Loss Risk Box */}
                    <rect
                      x={boxStartX}
                      y={slBoxTop}
                      width={boxWidth}
                      height={Math.max(2, slBoxHeight)}
                      fill="#ef4444"
                      fillOpacity="0.25"
                      stroke="#ef4444"
                      strokeWidth="1"
                    />
                    {/* Green Profit Target Box */}
                    <rect
                      x={boxStartX}
                      y={tpBoxTop}
                      width={boxWidth}
                      height={Math.max(2, tpBoxHeight)}
                      fill="#10b981"
                      fillOpacity="0.25"
                      stroke="#10b981"
                      strokeWidth="1"
                    />

                    {/* Entry line divider */}
                    <line
                      x1={boxStartX}
                      y1={entryY}
                      x2={boxStartX + boxWidth}
                      y2={entryY}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    <text
                      x={boxStartX + 4}
                      y={slBoxTop + 10}
                      fill="#fca5a5"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SL: {decision.stopLossFormatted}
                    </text>

                    <text
                      x={boxStartX + 4}
                      y={entryY - 3}
                      fill="#ffffff"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="black"
                    >
                      ENTRY: {fmt(decision.entryPrice)}
                    </text>

                    <text
                      x={boxStartX + 4}
                      y={tpBoxTop + tpBoxHeight - 4}
                      fill="#6ee7b7"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      TARGET: {decision.tp2Formatted} (1:{decision.riskRewardRatio})
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 11. CURRENT LIVE PRICE DASHED RAY & PILL                           */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <g>
            <line
              x1={paddingLeft}
              y1={getY(currentPrice)}
              x2={width}
              y2={getY(currentPrice)}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
            <rect
              x={width - paddingRight + 2}
              y={getY(currentPrice) - 10}
              width={86}
              height={19}
              fill="#0284c7"
              rx="3"
              filter="drop-shadow(0 0 6px rgba(2, 132, 199, 0.4))"
            />
            <text
              x={width - paddingRight + 6}
              y={getY(currentPrice) + 3}
              fill="#ffffff"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="black"
            >
              {fmt(currentPrice)}
            </text>
          </g>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* 12. CROSSHAIR & REAL-TIME INSPECTION TOOLTIP                       */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {crosshair && (
            <g pointerEvents="none">
              <line
                x1={crosshair.x}
                y1={paddingTop}
                x2={crosshair.x}
                y2={paddingTop + plotHeight}
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingLeft}
                y1={crosshair.y}
                x2={width - paddingRight}
                y2={crosshair.y}
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />

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

      {/* ── BOTTOM TIME SCALE & VOLUME PROFILE LEGEND ── */}
      <div className="flex flex-wrap items-center justify-between pt-2.5 text-[10px] text-slate-400 font-mono border-t border-slate-800/80 mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <span>{visibleCandles.length} Candles in Active Profile</span>
          <span>•</span>
          <span className="text-blue-400 font-bold">Buy Vol: {profile.buyVolumeTotal.toLocaleString()}</span>
          <span>•</span>
          <span className="text-orange-400 font-bold">Sell Vol: {profile.sellVolumeTotal.toLocaleString()}</span>
          <span>•</span>
          <span className={profile.cvdTotal >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            CVD Delta: {profile.cvdTotal >= 0 ? '+' : ''}{profile.cvdTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <span>RED = POC</span>
          <span>•</span>
          <span className="text-cyan-400">CYAN = 70% VAH/VAL</span>
          <span>•</span>
          <span className="text-rose-400">TOP = OVERBOUGHT</span>
          <span>•</span>
          <span className="text-emerald-400">BOTTOM = OVERSOLD</span>
        </div>
      </div>
    </div>
  );
};
