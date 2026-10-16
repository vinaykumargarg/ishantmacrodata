import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AssetSymbol,
  ProfileType,
  Timeframe,
  DataProvider,
  SessionName,
  ASSET_REGISTRY,
  Candle,
  calculateVolumeProfile,
  generateBenchmarkCandles,
  evaluateVolumeProfileDecision,
  getAssetTelemetry
} from '../data/volumeProfileDatabase';
import { VolumeProfileChart } from './VolumeProfileChart';
import { TradingViewWidget } from './TradingViewWidget';
import {
  Activity,
  Layers,
  TrendingUp,
  TrendingDown,
  Compass,
  Zap,
  BarChart2,
  Sliders,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
  Crosshair,
  Award,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Check,
  ArrowRight,
  Info
} from 'lucide-react';

export default function VolumeProfileTerminalView() {
  // Selected Asset & Configuration
  const [selectedSymbol, setSelectedSymbol] = useState<AssetSymbol>('BTCUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15m');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [profileType, setProfileType] = useState<ProfileType>('VRVP');
  const [selectedProvider, setSelectedProvider] = useState<DataProvider>('BINANCE_SPOT');
  const [selectedSession, setSelectedSession] = useState<SessionName>('ALL');
  const [vaPercentage, setVaPercentage] = useState<number>(0.70);
  const [chartMode, setChartMode] = useState<'NATIVE_VP' | 'TRADINGVIEW_EMBED'>('NATIVE_VP');

  // Bottom Panel Tab
  const [bottomTab, setBottomTab] = useState<'DISTRIBUTION_TABLE' | 'HISTORICAL_LEVELS' | 'MACRO_CATALYSTS' | 'DATA_QUALITY'>('DISTRIBUTION_TABLE');

  // Active Asset Metadata
  const assetMeta = useMemo(() => ASSET_REGISTRY[selectedSymbol], [selectedSymbol]);

  // Real-Time Streaming Ticker State
  const [livePrice, setLivePrice] = useState<number>(assetMeta.basePrice);
  const [priceChange24h, setPriceChange24h] = useState<number>(1.84);
  const [high24h, setHigh24h] = useState<number>(assetMeta.basePrice * 1.025);
  const [low24h, setLow24h] = useState<number>(assetMeta.basePrice * 0.978);
  const [volume24h, setVolume24h] = useState<string>('42.8k BTC');
  const [feedStatus, setFeedStatus] = useState<'LIVE' | 'DELAYED' | 'DISCONNECTED'>('LIVE');
  const [feedLatencyMs, setFeedLatencyMs] = useState<number>(42);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');
  const [flashDirection, setFlashDirection] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');

  // Multi-Asset Watchlist Real-Time Prices
  const [watchlistPrices, setWatchlistPrices] = useState<Record<AssetSymbol, { price: number; changePct: number }>>({
    BTCUSD: { price: 82799.50, changePct: 0.25 },
    ETHUSD: { price: 2493.80, changePct: -0.45 },
    SOLUSD: { price: 109.47, changePct: 1.85 },
    XAUUSD: { price: 4193.60, changePct: 0.65 },
    XAGUSD: { price: 59.80, changePct: 1.15 }
  });

  // Candle Dataset
  const [candles, setCandles] = useState<Candle[]>(() => generateBenchmarkCandles(selectedSymbol, 96));

  // FRVP Subset Index Window for Manual Mode
  const [frvpWindow, setFrvpWindow] = useState<{ start: number; end: number }>({
    start: 0,
    end: 95
  });

  // Market Session Clock (UTC / London / NY / Asia)
  const [activeSessionInfo, setActiveSessionInfo] = useState<{ currentSession: string; sessionTimes: string }>({
    currentSession: 'NEW YORK SESSION',
    sessionTimes: '13:00 – 21:00 UTC'
  });

  // Update session time
  useEffect(() => {
    const updateSession = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      if (utcHour >= 0 && utcHour < 8) {
        setActiveSessionInfo({ currentSession: 'ASIAN SESSION', sessionTimes: '00:00 – 08:00 UTC (Tokyo/Singapore)' });
      } else if (utcHour >= 8 && utcHour < 13) {
        setActiveSessionInfo({ currentSession: 'LONDON SESSION', sessionTimes: '08:00 – 16:00 UTC (European High Vol)' });
      } else if (utcHour >= 13 && utcHour < 17) {
        setActiveSessionInfo({ currentSession: 'LONDON / NY OVERLAP', sessionTimes: '13:00 – 17:00 UTC (Peak Institutional Liquidity)' });
      } else {
        setActiveSessionInfo({ currentSession: 'NEW YORK SESSION', sessionTimes: '13:00 – 21:00 UTC (Wall St Active)' });
      }
    };
    updateSession();
    const interval = setInterval(updateSession, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync baseline when symbol changes
  useEffect(() => {
    const newCandles = generateBenchmarkCandles(selectedSymbol, 96);
    setCandles(newCandles);
    const p = ASSET_REGISTRY[selectedSymbol].basePrice;
    setLivePrice(p);
    setHigh24h(p * 1.018);
    setLow24h(p * 0.982);
    setFrvpWindow({ start: 0, end: newCandles.length - 1 });
  }, [selectedSymbol]);

  // Real-Time REST Fetch: Immediately fetches real live prices & real Binance Kline volumes
  useEffect(() => {
    let isCancelled = false;

    const fetchLiveRestData = async () => {
      // 1. Fetch real-time prices for BTC, ETH, SOL
      try {
        const pricesRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]');
        if (pricesRes.ok) {
          const list = await pricesRes.json();
          if (Array.isArray(list)) {
            const pMap: Record<string, number> = {};
            for (const item of list) {
              pMap[item.symbol] = parseFloat(item.price);
            }
            if (!isCancelled) {
              setWatchlistPrices(prev => ({
                ...prev,
                BTCUSD: { price: pMap['BTCUSDT'] || prev.BTCUSD.price, changePct: prev.BTCUSD.changePct },
                ETHUSD: { price: pMap['ETHUSDT'] || prev.ETHUSD.price, changePct: prev.ETHUSD.changePct },
                SOLUSD: { price: pMap['SOLUSDT'] || prev.SOLUSD.price, changePct: prev.SOLUSD.changePct }
              }));

              if (selectedSymbol === 'BTCUSD' && pMap['BTCUSDT']) {
                setLivePrice(pMap['BTCUSDT']);
              } else if (selectedSymbol === 'ETHUSD' && pMap['ETHUSDT']) {
                setLivePrice(pMap['ETHUSDT']);
              } else if (selectedSymbol === 'SOLUSD' && pMap['SOLUSDT']) {
                setLivePrice(pMap['SOLUSDT']);
              }
            }
          }
        }
      } catch (err) {
        // fallback
      }

      // 2. Fetch 24hr ticker for current symbol if crypto
      if (['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(selectedSymbol)) {
        const pair = selectedSymbol.replace('USD', 'USDT');
        try {
          const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
          if (tickerRes.ok) {
            const data = await tickerRes.json();
            if (!isCancelled && data && data.lastPrice) {
              const cp = parseFloat(data.lastPrice);
              const chg = parseFloat(data.priceChangePercent);
              const h = parseFloat(data.highPrice);
              const l = parseFloat(data.lowPrice);
              setLivePrice(cp);
              setPriceChange24h(chg);
              setHigh24h(h);
              setLow24h(l);
              setVolume24h(`${parseFloat(data.volume).toFixed(1)} ${assetMeta.lotUnit}`);
              setFeedStatus('LIVE');
              setLastUpdatedTime(new Date().toLocaleTimeString());
            }
          }
        } catch (e) {
          // fallback
        }

        // 3. Fetch real live klines from Binance for real Volume Profile
        const tfMap: Record<Timeframe, string> = {
          '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
          '30m': '30m', '1H': '1h', '2H': '2h', '4H': '4h',
          '1D': '1d', '1W': '1w'
        };
        const intervalStr = tfMap[selectedTimeframe] || '15m';
        try {
          const klineRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${intervalStr}&limit=96`);
          if (klineRes.ok) {
            const klines = await klineRes.json();
            if (!isCancelled && Array.isArray(klines) && klines.length > 0) {
              const parsed: Candle[] = klines.map((k: any) => ({
                t: k[0],
                o: parseFloat(k[1]),
                h: parseFloat(k[2]),
                l: parseFloat(k[3]),
                c: parseFloat(k[4]),
                v: parseFloat(k[5]),
                buyV: parseFloat(k[9]),
                sellV: Math.max(0, parseFloat(k[5]) - parseFloat(k[9]))
              }));
              setCandles(parsed);
              if (!isManualMode) {
                setFrvpWindow({ start: 0, end: parsed.length - 1 });
              }
            }
          }
        } catch (e) {
          // fallback
        }
      }
    };

    fetchLiveRestData();
    const pollTimer = setInterval(fetchLiveRestData, 3500);
    return () => {
      isCancelled = true;
      clearInterval(pollTimer);
    };
  }, [selectedSymbol, selectedTimeframe, assetMeta.lotUnit, isManualMode]);

  // Handle Automatic vs Manual Switch
  const handleToggleMode = (manual: boolean) => {
    setIsManualMode(manual);
    if (manual) {
      setProfileType('FRVP');
      setFrvpWindow({
        start: Math.max(0, candles.length - 48),
        end: candles.length - 1
      });
    } else {
      setProfileType('VRVP');
      setFrvpWindow({
        start: 0,
        end: candles.length - 1
      });
    }
  };

  // Filter candles based on profileType, manual mode & session
  const filteredCandles = useMemo(() => {
    if (candles.length === 0) return [];
    if (isManualMode || profileType === 'FRVP') {
      return candles.slice(frvpWindow.start, frvpWindow.end + 1);
    }
    if (profileType === 'SESSION' && selectedSession !== 'ALL') {
      return candles.filter((c) => {
        const h = new Date(c.t).getUTCHours();
        if (selectedSession === 'ASIA') return h >= 0 && h < 8;
        if (selectedSession === 'LONDON') return h >= 8 && h < 16;
        if (selectedSession === 'NEW_YORK') return h >= 13 && h < 21;
        return true;
      });
    }
    return candles; // VRVP (Visible Range)
  }, [candles, isManualMode, profileType, frvpWindow, selectedSession]);

  // Volume Profile calculation
  const volumeProfileResult = useMemo(() => {
    return calculateVolumeProfile(filteredCandles, 50, vaPercentage);
  }, [filteredCandles, vaPercentage]);
  const profile = volumeProfileResult;

  // Market structure & Order flow telemetry
  const telemetry = useMemo(() => {
    return getAssetTelemetry(selectedSymbol);
  }, [selectedSymbol]);

  // AI Decision Engine
  const decision = useMemo(() => {
    return evaluateVolumeProfileDecision(
      selectedSymbol,
      volumeProfileResult,
      livePrice,
      telemetry.structure,
      telemetry.orderFlow
    );
  }, [selectedSymbol, volumeProfileResult, livePrice, telemetry]);

  // Format price helper
  const fmt = (p: number) => {
    if (p >= 1000) {
      return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${p.toFixed(assetMeta.decimals)}`;
  };

  // Price Zone Evaluation (Overbought vs Value Area vs Oversold)
  const isOverbought = livePrice > volumeProfileResult.vah;
  const isOversold = livePrice < volumeProfileResult.val;
  const isInsideVa = !isOverbought && !isOversold;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & TELEMETRY STRIP                                     */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-2.5 py-0.5 text-xs font-black text-white shadow-sm flex items-center gap-1.5">
                <span>📶 VOLUME PROFILE PRO</span>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-sky-300 border border-slate-700">
                VAH / VAL / POC 70% VALUE AREA ENGINE
              </span>
              <span className="rounded bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30">
                AUTO & MANUAL FRVP ANCHORS
              </span>

              {/* Feed Status Badge */}
              <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold ${
                feedStatus === 'LIVE'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{feedStatus === 'LIVE' ? 'LIVE STREAM' : feedStatus}</span>
                <span className="font-normal opacity-80 text-[10px]">• {feedLatencyMs}ms</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
                <span>{assetMeta.name}</span>
                <span className="text-sm font-semibold text-slate-400 font-sans">({selectedSymbol})</span>
              </h1>
              <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
                <Clock className="size-3" />
                {activeSessionInfo.currentSession} ({activeSessionInfo.sessionTimes})
              </span>
            </div>
          </div>

          {/* Real-Time Price Tile */}
          <div className="flex items-center gap-4 self-start lg:self-auto bg-[#070b14] px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Live Mark Price</div>
              <div className={`text-2xl sm:text-3xl font-black transition-all duration-300 ${
                flashDirection === 'UP'
                  ? 'text-emerald-400 scale-105'
                  : flashDirection === 'DOWN'
                    ? 'text-rose-400 scale-105'
                    : 'text-white'
              }`}>
                {fmt(livePrice)}
              </div>
            </div>
            <div className="border-l border-slate-800 pl-3 space-y-0.5 font-mono text-xs">
              <div className={`font-bold flex items-center gap-0.5 ${priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange24h >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                <span>{priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%</span>
              </div>
              <div className="text-[10px] text-slate-400">
                24h H: <b className="text-slate-300">{fmt(high24h)}</b> L: <b className="text-slate-300">{fmt(low24h)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. AUTOMATIC VS MANUAL MODE SELECTOR & TIMEFRAME STRIP              */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-3.5 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Automatic vs Manual Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400 font-mono">CALCULATION MODE:</span>
            <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
              <button
                onClick={() => handleToggleMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  !isManualMode
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🤖 AUTOMATIC (Auto VPVR)</span>
              </button>
              <button
                onClick={() => handleToggleMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  isManualMode
                    ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🖐️ MANUAL (Fixed Range FRVP)</span>
              </button>
            </div>
          </div>

          {/* Multiple Timeframes Selector */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">Timeframe:</span>
            {(['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', '1D', '1W'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-center font-bold text-xs font-mono transition-all cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Value Area % Selector (Default 70%) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">VA Size:</span>
            {[0.68, 0.70, 0.80].map((v) => (
              <button
                key={v}
                onClick={() => setVaPercentage(v)}
                className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  vaPercentage === v
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-black'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                {(v * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>

        {/* Quick Asset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Asset:</span>
          {(['BTCUSD', 'ETHUSD', 'SOLUSD', 'XAUUSD', 'XAGUSD'] as AssetSymbol[]).map((sym) => {
            const data = watchlistPrices[sym];
            const isSelected = selectedSymbol === sym;
            return (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>{sym === 'BTCUSD' ? '₿ BTC' : sym === 'ETHUSD' ? 'Ξ ETH' : sym === 'SOLUSD' ? '◎ SOL' : sym === 'XAUUSD' ? '🥇 Gold' : '🥈 Silver'}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-950' : data.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.changePct >= 0 ? '+' : ''}{data.changePct.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 3. 70% VALUE AREA & OVERBOUGHT / OVERSOLD ZONE BANNER              */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
        {/* VAH Box */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isOverbought
            ? 'border-rose-500/60 bg-rose-500/15 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40'
            : 'border-slate-800 bg-slate-950 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              VAH (VALUE AREA HIGH - 70%)
            </span>
            {isOverbought && (
              <span className="bg-rose-500/30 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded border border-rose-500/40 animate-pulse">
                🔴 OVERBOUGHT ZONE
              </span>
            )}
          </div>
          <div className="text-xl font-black text-white mt-1">
            {profile.vahFormatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Upper ceiling of 70% volume. Above this = Premium / Overbought zone. Rejections signal short trades back into POC.
          </p>
        </div>

        {/* POC Box */}
        <div className="p-3.5 rounded-xl border border-rose-500/40 bg-slate-950 text-slate-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <span>●</span> POC (POINT OF CONTROL)
            </span>
            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded border border-rose-500/30">
              MAX VOLUME MAGNET
            </span>
          </div>
          <div className="text-xl font-black text-white mt-1">
            {profile.pocFormatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Single price with highest traded volume. Acts as primary mean-reversion magnet for all rotations.
          </p>
        </div>

        {/* VAL Box */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isOversold
            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40'
            : 'border-slate-800 bg-slate-950 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              VAL (VALUE AREA LOW - 70%)
            </span>
            {isOversold && (
              <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                🟢 OVERSOLD ZONE
              </span>
            )}
          </div>
          <div className="text-xl font-black text-white mt-1">
            {profile.valFormatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Lower floor of 70% volume. Below this = Discount / Oversold zone. Reclaims signal high-asymmetry long trades.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 4. MAIN WORKSPACE: CHART CANVAS + TRADE DECISION ENGINE             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* CENTER / LEFT: INTERACTIVE VOLUME PROFILE CHART */}
        <div className="space-y-3">
          {chartMode === 'NATIVE_VP' ? (
            <VolumeProfileChart
              symbol={selectedSymbol}
              candles={filteredCandles}
              profile={volumeProfileResult}
              decision={decision}
              currentPrice={livePrice}
              profileType={profileType}
              vaPct={Math.round(vaPercentage * 100)}
              isManualMode={isManualMode}
              onRangeChange={(start, end) => setFrvpWindow({ start, end })}
              onToggleManualMode={handleToggleMode}
              height={550}
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-2 shadow-2xl">
              <TradingViewWidget
                symbol={assetMeta.tvSymbol}
                interval={selectedTimeframe === '1D' ? 'D' : selectedTimeframe === '4H' ? '240' : selectedTimeframe === '1H' ? '60' : '15'}
                height={550}
              />
            </div>
          )}
        </div>

        {/* RIGHT: VOLUME PROFILE OVERBOUGHT/OVERSOLD TRADE DECISION ENGINE */}
        <div className="space-y-3 font-mono text-xs">
          {/* Main Decision Card */}
          <div className="rounded-xl border border-cyan-500/30 bg-[#0a0f1d] p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                <Target className="size-3.5 text-cyan-400" />
                Volume Profile 70% Trade Engine
              </span>
              <span className="text-[10px] font-bold text-cyan-400 font-mono">Real-Time Setup</span>
            </div>

            {/* Current Price Zone Badge */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">CURRENT PRICE LOCATION:</div>
              <div className="text-sm font-black flex items-center gap-1.5">
                {isOverbought ? (
                  <span className="text-rose-400">🔴 OVERBOUGHT / PREMIUM (&gt; VAH)</span>
                ) : isOversold ? (
                  <span className="text-emerald-400">🟢 OVERSOLD / DISCOUNT (&lt; VAL)</span>
                ) : (
                  <span className="text-cyan-300">🔵 70% VALUE AREA FAIR BALANCE</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                Live Price: <b className="text-white">{fmt(livePrice)}</b> | VAH: {profile.vahFormatted} | POC: {profile.pocFormatted} | VAL: {profile.valFormatted}
              </div>
            </div>

            {/* Generated Decision Status */}
            <div className={`p-3.5 rounded-xl border text-center space-y-1 shadow-lg ${
              decision.status === 'LONG SETUP'
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                : decision.status === 'SHORT SETUP'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                  : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
            }`}>
              <div className="text-xl font-black tracking-tight">
                {decision.status}
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold">
                <span>Confidence: <b>{decision.confidenceScore}%</b></span>
                <span>•</span>
                <span>Tier: <b className="text-white">{decision.qualityTier}</b></span>
              </div>
            </div>

            {/* Actionable Trade Levels */}
            <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">🎯 Entry Zone:</span>
                <span className="font-bold text-cyan-300">{decision.entryZone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">🛑 Stop Loss:</span>
                <span className="font-bold text-rose-400">{decision.stopLossFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">🏁 Target 1 (POC Magnet):</span>
                <span className="font-bold text-emerald-400">{decision.tp1Formatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">🏆 Target 2 (Opposite VA):</span>
                <span className="font-bold text-emerald-300">{decision.tp2Formatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">⚖️ Risk:Reward Ratio:</span>
                <span className="font-black text-cyan-400">1 : {decision.riskRewardRatio}</span>
              </div>
            </div>

            {/* Hinglish Guidance Callout */}
            <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-2.5 text-xs text-cyan-200">
              <div className="font-black text-cyan-300 flex items-center gap-1 mb-1">
                <span>💡</span>
                <span>Volume Profile Trading Strategy (Hinglish):</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isOverbought
                  ? `Price VAH (${profile.vahFormatted}) ke upar Overbought zone me hai. Agar buying volume dry ho aur price VAH ke niche slip kare to SHORT REJECTION trade banti hai. Stop Loss ${decision.stopLossFormatted} par rakhein aur Target POC (${profile.pocFormatted}) par book karein.`
                  : isOversold
                  ? `Price VAL (${profile.valFormatted}) ke niche Oversold zone me hai. Sellers ki absorption ke baad jaise hi price VAL ke upar reclaim kare, LONG trade initiate karein. SL strictly ${decision.stopLossFormatted} par rakhein aur TP1 POC (${profile.pocFormatted}) par lein.`
                  : `Price 70% Value Area me rotate ho raha hai. POC (${profile.pocFormatted}) fair value magnet hai. Range boundary test hone par extreme ko fade karein.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
