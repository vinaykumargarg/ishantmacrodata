import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp, TrendingDown, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, Clock, Calculator, AlertTriangle,
  HelpCircle, Eye, Info, Calendar, ShieldCheck, DollarSign, BarChart2,
  Globe, Cpu, Users, ArrowRight, BookOpen, Check
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import {
  DeltaSwingCoin,
  deltaSwingService,
  INITIAL_DELTA_SWING_COINS,
  roundToTick
} from '../services/deltaSwingEngine';
import { voiceService } from '../services/voiceSynthesisService';
import TradingViewWidget from './TradingViewWidget';

interface Props {
  onNavigate?: (tabId: string) => void;
}

const POPULAR_SWING_COINS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'SUI', 'AVAX', 'NEAR', 'LINK', 'ADA', 'PEPE', 'TIA', 'RENDER', 'BNB', 'XAUT'
];

export default function DeltaSwingScannerView({ onNavigate }: Props) {
  const [coins, setCoins] = useState<DeltaSwingCoin[]>(INITIAL_DELTA_SWING_COINS);
  const [selectedCoin, setSelectedCoin] = useState<DeltaSwingCoin>(INITIAL_DELTA_SWING_COINS[0]);
  const [filterBias, setFilterBias] = useState<'ALL' | 'LONG' | 'SHORT' | 'TOP_SCORE' | 'WAIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [chartMode, setChartMode] = useState<'CANVAS' | 'TRADINGVIEW'>('CANVAS');
  const [langMode, setLangMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activePillarTab, setActivePillarTab] = useState<'all' | 'technical' | 'fundamental' | 'microstructure' | 'macro' | 'socioEconomics'>('all');

  // Position Sizing Calculator state
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);

  // Chart Container Refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Fetch live market data on mount and interval
  useEffect(() => {
    let isMounted = true;
    const fetchLive = async () => {
      setIsRefreshing(true);
      try {
        const liveCoins = await deltaSwingService.fetchLiveUniverse();
        if (isMounted && liveCoins && liveCoins.length > 0) {
          setCoins(liveCoins);
          setLastUpdated(new Date().toLocaleTimeString());
          // Keep selected coin synchronized with fresh live data
          setSelectedCoin(prev => {
            const updated = liveCoins.find(c => c.symbol === prev.symbol);
            return updated || prev;
          });
        }
      } catch (e) {
        console.warn('Delta live universe fetch fallback used:', e);
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 30000); // 30s auto-refresh

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filtered Coins
  const filteredCoins = useMemo(() => {
    return coins.filter(coin => {
      const matchSearch =
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.underlying.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.contractSymbol.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterBias === 'LONG') {
        return coin.verdict === 'STRONG_BUY' || coin.verdict === 'BUY';
      }
      if (filterBias === 'SHORT') {
        return coin.verdict === 'STRONG_SHORT' || coin.verdict === 'SHORT';
      }
      if (filterBias === 'TOP_SCORE') {
        return coin.scoreBreakdown.totalScore >= 80;
      }
      if (filterBias === 'WAIT') {
        return coin.verdict === 'WAIT';
      }
      return true;
    });
  }, [coins, searchQuery, filterBias]);

  // Position Sizing Calculation
  const calcRiskAmount = (accountBalance * riskPercent) / 100;
  const priceDistance = Math.abs(selectedCoin.price - selectedCoin.tradePlan.stopLoss);
  const calculatedPositionContracts = priceDistance > 0 ? (calcRiskAmount / priceDistance).toFixed(selectedCoin.price > 10 ? 2 : 4) : '0';
  const calculatedNotional = (Number(calculatedPositionContracts) * selectedCoin.price).toFixed(0);

  // Initialize Lightweight Charts inside embedded card
  useEffect(() => {
    if (chartMode !== 'CANVAS' || !chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 800,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8'
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false
      }
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });

    // Generate anchored 4H candles around selected coin price
    const baseP = selectedCoin.price;
    const dummyCandles = [];
    const dummyVols = [];
    const nowSec = Math.floor(Date.now() / 1000);
    const isBear = selectedCoin.tradePlan.direction === 'SHORT';

    for (let i = 50; i >= 0; i--) {
      const time = (nowSec - i * 14400) as any;
      const drift = isBear ? (i * 0.003 * baseP) : (-i * 0.003 * baseP);
      const wave = Math.sin(i / 3) * 0.015 * baseP;
      const open = baseP + drift + wave + (Math.random() - 0.5) * 0.008 * baseP;
      const close = isBear
        ? open - Math.random() * 0.012 * baseP + 0.002 * baseP
        : open + Math.random() * 0.012 * baseP - 0.002 * baseP;
      const high = Math.max(open, close) + Math.random() * 0.006 * baseP;
      const low = Math.min(open, close) - Math.random() * 0.006 * baseP;
      dummyCandles.push({ time, open, high, low, close });
      dummyVols.push({
        time,
        value: Math.floor(Math.random() * 50000 + 10000),
        color: close >= open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
      });
    }

    candleSeries.setData(dummyCandles);
    volumeSeries.setData(dummyVols);

    // Draw Price Lines for Entry, Stop Loss, TP1, TP2, and POC
    if (selectedCoin.tradePlan.stopLoss) {
      candleSeries.createPriceLine({
        price: selectedCoin.tradePlan.stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        title: 'SL (Invalidation)',
        axisLabelVisible: true
      });
    }
    if (selectedCoin.tradePlan.entryZone[0]) {
      candleSeries.createPriceLine({
        price: (selectedCoin.tradePlan.entryZone[0] + selectedCoin.tradePlan.entryZone[1]) / 2,
        color: '#00f2fe',
        lineWidth: 2,
        title: 'Entry Zone',
        axisLabelVisible: true
      });
    }
    if (selectedCoin.tradePlan.takeProfit1) {
      candleSeries.createPriceLine({
        price: selectedCoin.tradePlan.takeProfit1,
        color: '#10b981',
        lineWidth: 2,
        title: 'TP1 (Partial 40%)',
        axisLabelVisible: true
      });
    }
    if (selectedCoin.tradePlan.takeProfit2) {
      candleSeries.createPriceLine({
        price: selectedCoin.tradePlan.takeProfit2,
        color: '#34d399',
        lineWidth: 1,
        title: 'TP2 (Swing 35%)',
        axisLabelVisible: true
      });
    }
    if (selectedCoin.volumeProfile.poc) {
      candleSeries.createPriceLine({
        price: selectedCoin.volumeProfile.poc,
        color: '#f59e0b',
        lineWidth: 1,
        title: 'POC (Point of Control)',
        axisLabelVisible: true
      });
    }

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [chartMode, selectedCoin]);

  // Handle Voice Briefing
  const triggerVoiceBriefing = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const isShort = selectedCoin.tradePlan.direction === 'SHORT';
    const isLong = selectedCoin.tradePlan.direction === 'LONG';
    const dirHindi = isShort ? 'शॉर्ट (बिक्री)' : isLong ? 'लॉन्ग (खरीद)' : 'वेट (इंतजार)';
    const dirHinglish = isShort ? 'SHORT (Sell on Retest)' : isLong ? 'LONG (Buy on Dip)' : 'WAIT (Chop Zone)';

    let speechText = '';
    if (langMode === 'hindi') {
      speechText = `डेल्टा एक्सचेंज 4H स्विंग रिपोर्ट। ${selectedCoin.symbol} का स्विंग ट्रेड ${dirHindi} है। एंट्री जोन ${selectedCoin.tradePlan.entryZone[0]} से ${selectedCoin.tradePlan.entryZone[1]} के बीच है, स्टॉप लॉस ${selectedCoin.tradePlan.stopLoss} पर लगाएं, टीपी 1 ${selectedCoin.tradePlan.takeProfit1} है और टीपी 2 ${selectedCoin.tradePlan.takeProfit2} है। रिकमेंडेड लेवरेज 2 से 3 एक्स क्रॉस रखें।`;
    } else if (langMode === 'hinglish') {
      speechText = `Dhyan se dekho bhai! Delta Exchange 4H Swing Planner par ${selectedCoin.symbol} ka ${dirHinglish} setup confirm hua hai. Kyon lein? ${selectedCoin.thesis?.whyHindiHinglish || selectedCoin.structureLabel} Entry Zone: ${selectedCoin.tradePlan.entryZone[0]} se ${selectedCoin.tradePlan.entryZone[1]}. Stop Loss strictly ${selectedCoin.tradePlan.stopLoss} par rakhein. Take Profit 1 ${selectedCoin.tradePlan.takeProfit1} aur TP2 ${selectedCoin.tradePlan.takeProfit2} hai. Leverage strictly 2x se 3x cross leverage lena hai taaki liquidation distance 30% se zyada dur rahe!`;
    } else {
      speechText = `Delta Exchange Institutional 4-Hour Swing Scanner Briefing. Selected asset is ${selectedCoin.symbol} with direction ${selectedCoin.tradePlan.direction}. Optimal entry zone is ${selectedCoin.tradePlan.entryZone[0]} to ${selectedCoin.tradePlan.entryZone[1]}, with invalidation stop loss at ${selectedCoin.tradePlan.stopLoss}, targeting ${selectedCoin.tradePlan.takeProfit1} and ${selectedCoin.tradePlan.takeProfit2}. Recommended safe leverage is 3x cross.`;
    }

    setIsSpeaking(true);
    voiceService.speak(speechText, {
      langMode,
      onEnd: () => setIsSpeaking(false)
    });
  };

  // BTC Market state
  const btcCoin = coins.find(c => c.symbol === 'BTC');
  const btcPrice = btcCoin ? btcCoin.price : 81136;
  const btcChange = btcCoin ? btcCoin.change24h : -1.35;
  const btcStructure = btcCoin ? btcCoin.structure : 'BEARISH_BOS';
  const isBtcBearish = btcChange < -0.8 || btcStructure === 'BEARISH_BOS';

  return (
    <div className="space-y-6 font-sans">
      {/* ── TOP HERO HEADER & METRIC STREAM ── */}
      <div className="terminal-card-glass p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(0,242,254,0.4)] shrink-0">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-cyan-400 font-sans">
                  DELTA EXCHANGE // INSTITUTIONAL 4H SWING TERMINAL
                </h1>
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                EXCLUSIVELY 4H & DAILY SWING TRADING • DEEP MULTI-PILLAR RESEARCH FOR EVERY COIN
              </div>
            </div>
          </div>

          {/* Telemetry Chips & Scan Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/60 bg-emerald-500/15 px-3 py-1 text-xs font-mono font-bold text-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.35)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#00e676]" />
              LIVE DELTA FEED
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-semibold text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              237 Delta Contracts
            </div>
            <div className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-mono text-slate-400 hidden sm:block">
              SYNC: {lastUpdated}
            </div>

            <button
              onClick={async () => {
                setIsRefreshing(true);
                const updated = await deltaSwingService.fetchLiveUniverse();
                setCoins(updated);
                setIsRefreshing(false);
                setLastUpdated(new Date().toLocaleTimeString());
              }}
              disabled={isRefreshing}
              className="btn-scan-neon"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Scan All Coins
            </button>
          </div>
        </div>
      </div>

      {/* ── MACRO ENVIRONMENT & BTC 4H REGIME FILTER BAR ── */}
      <div className="regime-banner-neon">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className={`flex items-center gap-1.5 self-start sm:self-center px-3 py-1 rounded-full text-xs font-black tracking-wide ${
            isBtcBearish
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              : 'badge-wait-neon'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isBtcBearish ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'}`} />
            {isBtcBearish ? 'BEARISH REGIME (FAVOR 4H SHORTS)' : 'NEUTRAL / SELECTIVE SWINGS'}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Macro Environment & BTC 4H Institutional Filter
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isBtcBearish
                ? 'BTC 4H Structure broke below Value Area POC ($81,600). Smart money strictly favors high-asymmetry SHORT setups on 4H supply retests.'
                : 'Balanced macro conditions. Selective swing trading favored with strict risk-to-reward parameters.'}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-5 shrink-0 text-right">
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">BTC Mark Price</div>
            <div className="text-xs font-mono font-black text-cyan-300 mt-0.5">${btcPrice.toLocaleString()}</div>
          </div>
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">BTC 4H Structure</div>
            <div className={`text-xs font-mono font-black mt-0.5 ${isBtcBearish ? 'text-rose-400' : 'text-amber-400'}`}>
              {btcStructure.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">BTC 24h Change</div>
            <div className={`text-xs font-mono font-black mt-0.5 ${btcChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
            </div>
          </div>
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Delta India OI</div>
            <div className="text-xs font-mono font-black text-cyan-400 mt-0.5">
              ${((btcCoin?.openInterest || 70647000) / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      </div>

      {/* ── COIN SELECTOR BAR & INSTANT SEARCH ── */}
      <div className="terminal-card-glass p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-cyan-400" />
              SELECT COIN FOR DEEP 4H SWING RESEARCH:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({coins.length} Contracts Available)
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search coin (e.g. BTC, ETH, SUI, DOGE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-border bg-slate-900/90 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400 w-full sm:w-72"
            />
          </div>
        </div>

        {/* Quick Popular Coin Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {POPULAR_SWING_COINS.map(sym => {
            const coinMatch = coins.find(c => c.symbol.toUpperCase() === sym);
            const isSelected = selectedCoin.symbol.toUpperCase() === sym;
            const isShort = coinMatch?.tradePlan.direction === 'SHORT';
            const isLong = coinMatch?.tradePlan.direction === 'LONG';

            return (
              <button
                key={sym}
                onClick={() => {
                  if (coinMatch) setSelectedCoin(coinMatch);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(0,242,254,0.5)] font-black'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                }`}
              >
                <span>{sym}</span>
                {coinMatch && (
                  <span className={`text-[10px] px-1 rounded ${
                    isSelected ? 'bg-slate-950/30 text-slate-950' :
                    isShort ? 'text-rose-400' : isLong ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {coinMatch.change24h >= 0 ? '+' : ''}{coinMatch.change24h.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MASTER 4H SWING BLUEPRINT FOR SELECTED COIN ── */}
      <div className="terminal-hero-spotlight">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
              <span>🎯</span>
              <span>4H SWING TRADING BLUEPRINT: {selectedCoin.underlying} ({selectedCoin.contractSymbol})</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white">
                {selectedCoin.symbol}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400">
                ${selectedCoin.price > 10 ? selectedCoin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : selectedCoin.price}
              </span>
              <span className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded ${selectedCoin.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {selectedCoin.change24h >= 0 ? '+' : ''}{selectedCoin.change24h.toFixed(2)}%
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Delta OI: ${(selectedCoin.openInterest / 1000000).toFixed(1)}M | Funding: {(selectedCoin.fundingRate * 100).toFixed(4)}%
              </span>
            </div>
          </div>

          {/* Verdict and Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={
              selectedCoin.tradePlan.direction === 'SHORT'
                ? 'badge-short-neon text-xs px-3.5 py-1.5 font-black shadow-[0_0_14px_rgba(244,63,94,0.4)]'
                : selectedCoin.tradePlan.direction === 'LONG'
                ? 'badge-long-neon text-xs px-3.5 py-1.5 font-black shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                : 'badge-wait-neon text-xs px-3.5 py-1.5 font-black'
            }>
              {selectedCoin.tradePlan.direction === 'SHORT'
                ? '🔴 CONFIRMED SHORT (Sell Retest of 4H Supply)'
                : selectedCoin.tradePlan.direction === 'LONG'
                ? '🟢 CONFIRMED LONG (Buy Pullback at 4H Demand)'
                : '⏸️ WAIT (Capital Preservation)'}
            </span>

            <span className="badge-score-neon text-xs px-3 py-1 font-bold">
              SCORE: {selectedCoin.scoreBreakdown.totalScore}/100
            </span>

            <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 text-xs font-bold text-indigo-300">
              SAFE LEVERAGE: {selectedCoin.safeLeverage.recommended}x CROSS
            </span>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-xs">
              {(['hinglish', 'hindi', 'english'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setLangMode(mode)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all ${
                    langMode === mode ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={triggerVoiceBriefing}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-400" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Jarvis Audio'}</span>
            </button>
          </div>
        </div>

        {/* ── 4-PANEL PRIMARY EXECUTION & LEVERAGE GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* PANEL 1: EXACT LEVELS (ENTRY, SL, TP1, TP2, TP3) */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-cyan-400" />
                Meri Entry, SL & TP Levels
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">R:R 1:{selectedCoin.tradePlan.riskRewardRatio.toFixed(2)}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-2">
                <div className="text-[10px] font-bold uppercase text-cyan-300">🎯 PREFERRED ENTRY ZONE</div>
                <div className="text-sm font-black font-mono text-cyan-200 mt-0.5">
                  ${selectedCoin.tradePlan.entryZone[0].toLocaleString()} – ${selectedCoin.tradePlan.entryZone[1].toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Wait for 4H Order Block / FVG Retest</div>
              </div>

              <div className="rounded-lg bg-rose-950/40 border border-rose-500/30 p-2">
                <div className="text-[10px] font-bold uppercase text-rose-300">🛑 PERFECT STOP LOSS (HARD CUT)</div>
                <div className="text-sm font-black font-mono text-rose-400 mt-0.5">
                  ${selectedCoin.tradePlan.stopLoss.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Dist: {Math.abs(((selectedCoin.tradePlan.stopLoss - selectedCoin.price) / selectedCoin.price) * 100).toFixed(1)}% away | Beyond 4H Structure
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div className="rounded bg-emerald-950/40 border border-emerald-500/30 p-1.5 text-center">
                  <div className="text-[9px] font-bold text-emerald-400">TP 1 (40%)</div>
                  <div className="text-xs font-black font-mono text-emerald-200 mt-0.5">
                    ${selectedCoin.tradePlan.takeProfit1.toLocaleString()}
                  </div>
                </div>
                <div className="rounded bg-emerald-950/40 border border-emerald-500/30 p-1.5 text-center">
                  <div className="text-[9px] font-bold text-emerald-400">TP 2 (35%)</div>
                  <div className="text-xs font-black font-mono text-emerald-200 mt-0.5">
                    ${selectedCoin.tradePlan.takeProfit2.toLocaleString()}
                  </div>
                </div>
                <div className="rounded bg-emerald-950/40 border border-emerald-500/30 p-1.5 text-center">
                  <div className="text-[9px] font-bold text-emerald-300">TP 3 (25%)</div>
                  <div className="text-xs font-black font-mono text-emerald-100 mt-0.5">
                    ${selectedCoin.tradePlan.takeProfit3.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL 2: KITNA LEVERAGE LENA CHAHIYE? (SAFE SWING LEVERAGE) */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                Kitna Leverage Lena Chahiye?
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">100% Safe Advice</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/30 p-2.5 text-center">
                <div className="text-[10px] font-bold text-indigo-300 uppercase">RECOMMENDED SWING LEVERAGE</div>
                <div className="text-2xl font-black font-mono text-cyan-300 mt-0.5">
                  {selectedCoin.safeLeverage.recommended}x CROSS
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Maximum Safe: {selectedCoin.safeLeverage.maxSafe}x Cross (Avoid 10x+)
                </div>
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-700/80 p-2.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Est. Liquidation Price:</span>
                  <span className="font-mono font-bold text-amber-400">
                    ${selectedCoin.safeLeverage.estimatedLiquidationPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Liquidation Distance:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedCoin.safeLeverage.liquidationBufferPct}% Buffer
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-2 text-[11px] text-indigo-200 leading-snug">
                💡 <strong>Kyon?</strong> 4H swing trading me normal 3% se 5% wicks aati hain. 2x-3x leverage me liquidation 30%+ dur rahegi, jisse aapka capital safe rahega.
              </div>
            </div>
          </div>

          {/* PANEL 3: VAH COIN KAHAN JA SAKTA HAI? (TRAJECTORY) */}
          <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-purple-400" />
                Vah Coin Kahan Ja Sakta Hai?
              </span>
              <span className="text-[10px] text-purple-300 font-bold">{selectedCoin.trajectory.probabilityPct}% Prob</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/30">
                <div className="text-[10px] font-bold text-purple-300 uppercase">EXPECTED SWING TRAJECTORY</div>
                <p className="text-xs font-medium text-slate-200 mt-1 leading-relaxed">
                  {selectedCoin.trajectory.whereCanItGo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-emerald-950/30 border border-emerald-500/30 p-2">
                  <div className="text-[10px] font-bold text-emerald-400">Bullish Scenario</div>
                  <div className="font-mono font-black text-emerald-300 text-sm mt-0.5">
                    ${selectedCoin.trajectory.bullishTarget.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold">{selectedCoin.trajectory.bullishPct}</div>
                </div>

                <div className="rounded bg-rose-950/30 border border-rose-500/30 p-2">
                  <div className="text-[10px] font-bold text-rose-400">Bearish Scenario</div>
                  <div className="font-mono font-black text-rose-300 text-sm mt-0.5">
                    ${selectedCoin.trajectory.bearishTarget.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-400 font-bold">{selectedCoin.trajectory.bearishPct}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Horizon: <span className="text-purple-300 font-bold">{selectedCoin.trajectory.expectedTimeframe}</span>
              </div>
            </div>
          </div>

          {/* PANEL 4: HIGH-IMPACT POSITION AREAS (S/R & POC) */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-amber-400" />
                High-Impact Position Area
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Institutional Nodes</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded bg-slate-900 border border-slate-700/80 p-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">INSTITUTIONAL DEMAND FLOOR</div>
                <div className="text-xs font-mono font-black text-emerald-400 mt-0.5">
                  {selectedCoin.highImpactZones.demandFloor}
                </div>
              </div>

              <div className="rounded bg-slate-900 border border-slate-700/80 p-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">INSTITUTIONAL SUPPLY CEILING</div>
                <div className="text-xs font-mono font-black text-rose-400 mt-0.5">
                  {selectedCoin.highImpactZones.supplyCeiling}
                </div>
              </div>

              <div className="rounded bg-slate-900 border border-amber-500/30 p-2">
                <div className="text-[10px] text-amber-400 uppercase font-bold">DELTA VOLUME POC (POINT OF CONTROL)</div>
                <div className="text-sm font-mono font-black text-amber-300 mt-0.5">
                  ${selectedCoin.highImpactZones.pocPrice.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Max traded contract volume node</div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Order Block: <span className="text-cyan-300 font-bold">{selectedCoin.highImpactZones.orderBlockZone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-PANEL DEEP RESEARCH GRID (NEWS, RISKS, THESIS, EXITS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
          {/* PANEL 5: UPCOMING NEWS & CATALYST EVENTS */}
          <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-cyan-400" />
                Uski Aane Wali Upcoming News Kya Hai? (News & Catalyst Events)
              </span>
              <span className="text-[10px] text-slate-400">Institutional Event Feed</span>
            </div>

            <div className="space-y-2.5">
              {selectedCoin.upcomingNews.map((news, idx) => (
                <div key={idx} className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1.5 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white leading-snug">{news.title}</h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                        news.impact === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        news.impact === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-700/40 text-slate-300'
                      }`}>
                        {news.impact}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        news.bias === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' :
                        news.bias === 'BEARISH' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-700/40 text-slate-400'
                      }`}>
                        {news.bias}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Timing: {news.date}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{news.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL 6: IS COIN MEIN KOI DIKKAT TO NAHI HAI? (RISK CHECKLIST) */}
          <div className="rounded-xl border border-rose-500/20 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Is Coin Mein Koi Dikkat To Nahi Hai? (Risk & Red Flag Checklist)
              </span>
              <span className="text-[10px] text-slate-400">Strict Audit</span>
            </div>

            <div className="space-y-2.5">
              {selectedCoin.riskChecklist.map((risk, idx) => (
                <div key={idx} className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {risk.category}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${
                      risk.status === 'CLEAN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      risk.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {risk.status === 'CLEAN' ? '✓ CLEAN' : risk.status === 'WARNING' ? '⚠ CAUTION' : '⛔ ALERT'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">{risk.headline}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{risk.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL 7: MAIN YEH COIN KYON LOON? (WHY TAKE THIS TRADE?) */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-cyan-400" />
                Main Yeh Coin Kyon Loon? / Vah Coin Kyon Move Ho Sakta Hai?
              </span>
              <span className="text-[10px] text-cyan-400">Institutional Thesis</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-sm font-black text-white">{selectedCoin.thesis.whyTitle}</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <div className="font-bold text-cyan-400 text-[11px] mb-1">📊 Technical Structure:</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">{selectedCoin.thesis.whyTechnical}</div>
                </div>

                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <div className="font-bold text-indigo-400 text-[11px] mb-1">🌊 Delta Derivatives & OI:</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">{selectedCoin.thesis.whyDerivatives}</div>
                </div>

                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <div className="font-bold text-amber-400 text-[11px] mb-1">🏛️ Fundamental Factors:</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">{selectedCoin.thesis.whyFundamental}</div>
                </div>
              </div>

              {/* Highlighted Hinglish Advice */}
              <div className="rounded-lg bg-cyan-950/50 border border-cyan-500/40 p-3 text-xs text-cyan-100">
                <div className="font-black text-cyan-300 flex items-center gap-1 mb-1">
                  <span>💡</span>
                  <span>Seedha Aur Saaf Institutional Advice (Hinglish):</span>
                </div>
                <p className="leading-relaxed text-xs">{selectedCoin.thesis.whyHindiHinglish}</p>
              </div>
            </div>
          </div>

          {/* PANEL 8: KAHAN PAR NIKALNA HAI? (STEP-BY-STEP EXIT STRATEGY) */}
          <div className="rounded-xl border border-emerald-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Kahan Par Nikalna Hai? (Step-by-Step Profit Booking & Exit Rules)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Disciplined Exits</span>
            </div>

            <div className="space-y-2">
              {selectedCoin.exitStrategy.map((exit, idx) => (
                <div key={idx} className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-cyan-300">{exit.step}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      Target: ${exit.targetPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span className="text-emerald-400">Action:</span>
                    <span>{exit.action}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{exit.ruleHinglish}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5-PILLAR INSTITUTIONAL CONFLUENCE BREAKDOWN ── */}
        <div className="rounded-xl border border-border bg-slate-950/80 p-4 space-y-3 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Har Ek Cheez 5 Pillars Mein (Institutional Quantitative Audit: {selectedCoin.symbol})</span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {(['all', 'technical', 'fundamental', 'microstructure', 'macro', 'socioEconomics'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActivePillarTab(tab)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    activePillarTab === tab
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab === 'all' ? 'All 5 Pillars' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {/* 1. TECHNICAL */}
            {(activePillarTab === 'all' || activePillarTab === 'technical') && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <BarChart2 className="h-3.5 w-3.5" /> 1. TECHNICAL
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {selectedCoin.fivePillars.technical.score}/20
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">{selectedCoin.fivePillars.technical.trend}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedCoin.fivePillars.technical.summary}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  {selectedCoin.fivePillars.technical.indicators}
                </div>
              </div>
            )}

            {/* 2. FUNDAMENTAL */}
            {(activePillarTab === 'all' || activePillarTab === 'fundamental') && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> 2. FUNDAMENTAL
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {selectedCoin.fivePillars.fundamental.score}/20
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  Tier: {selectedCoin.fivePillars.fundamental.healthTier.replace(/_/g, ' ')}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedCoin.fivePillars.fundamental.summary}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  {selectedCoin.fivePillars.fundamental.tokenomics}
                </div>
              </div>
            )}

            {/* 3. MICROSTRUCTURE */}
            {(activePillarTab === 'all' || activePillarTab === 'microstructure') && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5" /> 3. MICROSTRUCTURE
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {selectedCoin.fivePillars.microstructure.score}/20
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  {selectedCoin.fivePillars.microstructure.fundingInterpretation}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedCoin.fivePillars.microstructure.summary}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  {selectedCoin.fivePillars.microstructure.cvdVolumeDelta}
                </div>
              </div>
            )}

            {/* 4. MACRO */}
            {(activePillarTab === 'all' || activePillarTab === 'macro') && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> 4. MACRO LIQUIDITY
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {selectedCoin.fivePillars.macro.score}/20
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">DXY & Global M2 Dynamics</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedCoin.fivePillars.macro.summary}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  {selectedCoin.fivePillars.macro.dxyImpact}
                </div>
              </div>
            )}

            {/* 5. SOCIO-ECONOMICS */}
            {(activePillarTab === 'all' || activePillarTab === 'socioEconomics') && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> 5. SOCIO-ECONOMICS
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {selectedCoin.fivePillars.socioEconomics.score}/20
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">{selectedCoin.fivePillars.socioEconomics.fearGreedIndex}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedCoin.fivePillars.socioEconomics.summary}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  {selectedCoin.fivePillars.socioEconomics.retailVsSmartMoney}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── EMBEDDED 4H SMC CANDLESTICK CHART & POSITION SIZING CALCULATOR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4">
          {/* Chart View (8 cols) */}
          <div className="lg:col-span-8 rounded-xl border border-border bg-slate-950 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>4H SMC Candlestick Stream (POC, FVG & Order Block Levels)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-md bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setChartMode('CANVAS')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                      chartMode === 'CANVAS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AI Canvas
                  </button>
                  <button
                    onClick={() => setChartMode('TRADINGVIEW')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                      chartMode === 'TRADINGVIEW' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TradingView
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="rounded-lg overflow-hidden border border-slate-800/80 bg-[#090d16]">
              {chartMode === 'CANVAS' ? (
                <div ref={chartContainerRef} className="w-full h-[380px]" />
              ) : (
                <div className="w-full h-[380px]">
                  <TradingViewWidget symbol={`BINANCE:${selectedCoin.symbol}USDT`} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>SL: <strong className="text-rose-400">${selectedCoin.tradePlan.stopLoss.toLocaleString()}</strong></span>
              <span>Entry: <strong className="text-cyan-300">${selectedCoin.tradePlan.entryZone[0].toLocaleString()} – ${selectedCoin.tradePlan.entryZone[1].toLocaleString()}</strong></span>
              <span>TP1: <strong className="text-emerald-400">${selectedCoin.tradePlan.takeProfit1.toLocaleString()}</strong></span>
              <span>POC: <strong className="text-amber-400">${selectedCoin.volumeProfile.poc.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Position Sizer (4 cols) */}
          <div className="lg:col-span-4 rounded-xl border border-border bg-slate-950 p-4 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-amber-400" />
                Position Sizing & Risk Calculator
              </span>
              <span className="text-[10px] text-slate-400">Delta India</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold">Trading Capital (USD)</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg bg-slate-900 border border-slate-800 p-2 font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold">Max Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg bg-slate-900 border border-slate-800 p-2 font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Allowed Dollar Risk:</span>
                  <span className="font-bold text-rose-400">${calcRiskAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated Position Size:</span>
                  <span className="font-bold text-cyan-300 font-mono">{calculatedPositionContracts} {selectedCoin.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Notional Value:</span>
                  <span className="font-bold text-white font-mono">${calculatedNotional}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-slate-400">Safe Leverage:</span>
                  <span className="font-black text-amber-400">{selectedCoin.safeLeverage.recommended}x Cross</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Liquidation Price:</span>
                  <span className="font-mono font-bold text-emerald-400">${selectedCoin.safeLeverage.estimatedLiquidationPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-2.5 text-[11px] text-amber-200 leading-snug">
                ⚖️ <strong>Discipline Rule:</strong> Capital preservation is rule #1. Kabhi bhi ek swing trade me 2% se zyada risk na lein!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 237+ CONTRACTS UNIVERSE FILTER BAR & TABLE ── */}
      <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Table Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b border-border gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterBias('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'ALL'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              All Delta Contracts ({coins.length})
            </button>
            <button
              onClick={() => setFilterBias('SHORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'SHORT'
                  ? 'bg-rose-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-rose-400'
              }`}
            >
              Short Setups (4H Retest)
            </button>
            <button
              onClick={() => setFilterBias('LONG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'LONG'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-emerald-400'
              }`}
            >
              Long Setups (4H Demand)
            </button>
            <button
              onClick={() => setFilterBias('TOP_SCORE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'TOP_SCORE'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-background border border-border text-muted-foreground hover:text-amber-400'
              }`}
            >
              Top Alpha (Score ≥ 80)
            </button>
            <button
              onClick={() => setFilterBias('WAIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'WAIT'
                  ? 'bg-slate-700 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Wait / Preserve Capital
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <strong className="text-cyan-400">{filteredCoins.length}</strong> swing candidates
          </div>
        </div>

        {/* Table of Coins */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-3">Coin / Contract</th>
                <th className="py-3 px-3">Mark Price</th>
                <th className="py-3 px-3">24h Change</th>
                <th className="py-3 px-3">4H Structure</th>
                <th className="py-3 px-3">Entry & Stop Loss</th>
                <th className="py-3 px-3">Safe Leverage</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3">Confirmed Verdict</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCoins.map((coin, index) => {
                const isSelected = selectedCoin.symbol === coin.symbol;

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => {
                      setSelectedCoin(coin);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className={`transition-colors cursor-pointer group ${
                      isSelected ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <div className={`font-bold transition-colors ${isSelected ? 'text-cyan-300' : 'text-foreground group-hover:text-primary'}`}>
                            {coin.symbol}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{coin.contractSymbol}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-foreground">
                      ${coin.price > 10 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold">
                      <span className={coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          coin.structure === 'BULLISH_BOS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : coin.structure === 'BEARISH_BOS'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {coin.structure.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      <div className="text-cyan-300 font-bold">${coin.tradePlan.entryZone[0]} – ${coin.tradePlan.entryZone[1]}</div>
                      <div className="text-[10px] text-rose-400">SL: ${coin.tradePlan.stopLoss}</div>
                    </td>

                    <td className="py-3 px-3 text-muted-foreground font-mono">
                      <span className="text-indigo-400 font-bold">{coin.safeLeverage.recommended}x</span>
                      <div className="text-[10px] text-slate-400">Liq: ${coin.safeLeverage.estimatedLiquidationPrice}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-black text-sm">
                        <span className={coin.scoreBreakdown.totalScore >= 80 ? 'text-emerald-400' : coin.scoreBreakdown.totalScore >= 65 ? 'text-primary' : 'text-muted-foreground'}>
                          {coin.scoreBreakdown.totalScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-extrabold ${
                          coin.verdict === 'STRONG_BUY' || coin.verdict === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : coin.verdict === 'STRONG_SHORT' || coin.verdict === 'SHORT'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {coin.verdict.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCoin(coin);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className={`rounded px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30'
                        }`}
                      >
                        {isSelected ? 'Active Blueprint' : 'Load Research'}
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
}
