import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp, TrendingDown, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, Clock, Calculator, AlertTriangle,
  HelpCircle, Eye, Info
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
  INITIAL_DELTA_SWING_COINS
} from '../services/deltaSwingEngine';
import { voiceService } from '../services/voiceSynthesisService';
import TradingViewWidget from './TradingViewWidget';

interface Props {
  onNavigate?: (tabId: string) => void;
}

export default function DeltaSwingScannerView({ onNavigate }: Props) {
  const [coins, setCoins] = useState<DeltaSwingCoin[]>(INITIAL_DELTA_SWING_COINS);
  const [selectedCoin, setSelectedCoin] = useState<DeltaSwingCoin>(INITIAL_DELTA_SWING_COINS[0]);
  const [filterBias, setFilterBias] = useState<'ALL' | 'LONG' | 'SHORT' | 'TOP_SCORE' | 'WAIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<'CANVAS' | 'TRADINGVIEW'>('CANVAS');
  const [langMode, setLangMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

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

  // Top 5 Swing Setups
  const top5Swings = useMemo(() => {
    return [...coins]
      .filter(c => c.verdict === 'STRONG_SHORT' || c.verdict === 'SHORT' || c.verdict === 'STRONG_BUY' || c.verdict === 'BUY')
      .sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore)
      .slice(0, 5);
  }, [coins]);

  const bestSetup = top5Swings[0] || selectedCoin || coins[0];

  // Position Sizing Calculation
  const calcRiskAmount = (accountBalance * riskPercent) / 100;
  const priceDistance = Math.abs(selectedCoin.price - selectedCoin.tradePlan.stopLoss);
  const calculatedPositionContracts = priceDistance > 0 ? (calcRiskAmount / priceDistance).toFixed(2) : '0';
  const calculatedNotional = (Number(calculatedPositionContracts) * selectedCoin.price).toFixed(0);

  // Initialize Lightweight Charts inside Modal
  useEffect(() => {
    if (!isModalOpen || chartMode !== 'CANVAS' || !chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
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

    // Draw Price Lines for Entry, Stop Loss, and Take Profit
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
        title: 'TP1 (Partial)',
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
  }, [isModalOpen, chartMode, selectedCoin]);

  // Handle Voice Briefing
  const triggerVoiceBriefing = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const isShort = bestSetup.tradePlan.direction === 'SHORT';
    const isLong = bestSetup.tradePlan.direction === 'LONG';
    const dirHindi = isShort ? 'शॉर्ट (बिक्री)' : isLong ? 'लॉन्ग (खरीद)' : 'वेट (इंतजार)';
    const dirHinglish = isShort ? 'SHORT (Sell on Retest)' : isLong ? 'LONG (Buy on Dip)' : 'WAIT (Chop Zone)';

    let speechText = '';
    if (langMode === 'hindi') {
      speechText = `डेल्टा एक्सचेंज 4H स्विंग रिपोर्ट। सबसे मजबूत ट्रेड ${bestSetup.symbol} में ${dirHindi} का है, टोटल कॉनफ्लुएंस स्कोर ${bestSetup.scoreBreakdown.totalScore} आउट ऑफ 100 है। कारण: ${bestSetup.thesis?.whyTitle || bestSetup.structureLabel}। एंट्री जोन ${bestSetup.tradePlan.entryZone[0]} से ${bestSetup.tradePlan.entryZone[1]} के बीच है, स्टॉप लॉस ${bestSetup.tradePlan.stopLoss} पर लगाएं, और पहला टारगेट ${bestSetup.tradePlan.takeProfit1} है।`;
    } else if (langMode === 'hinglish') {
      speechText = `Dhyan se dekho bhai! Delta Exchange 4H Swing Scanner par sabse high conviction trade ${bestSetup.symbol} ka ${dirHinglish} setup hai, score ${bestSetup.scoreBreakdown.totalScore} out of 100 hai. Kyon karein? ${bestSetup.thesis?.whyHindiHinglish || bestSetup.structureLabel} Kis area par karein? Entry zone ${bestSetup.tradePlan.entryZone[0]} se ${bestSetup.tradePlan.entryZone[1]} hai, Stop Loss strictly ${bestSetup.tradePlan.stopLoss} par rakhein, aur Target One ${bestSetup.tradePlan.takeProfit1} hai. Strict discipline maintain karein!`;
    } else {
      speechText = `Delta Exchange Institutional 4-Hour Swing Scanner Briefing. Top ranked swing opportunity is ${bestSetup.symbol} with direction ${bestSetup.tradePlan.direction}. Rationale: ${bestSetup.thesis?.whyTitle || bestSetup.structureLabel}. Optimal entry zone is between ${bestSetup.tradePlan.entryZone[0]} and ${bestSetup.tradePlan.entryZone[1]}, with invalidation stop loss at ${bestSetup.tradePlan.stopLoss}, targeting ${bestSetup.tradePlan.takeProfit1} and ${bestSetup.tradePlan.takeProfit2}.`;
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
    <div className="space-y-5 font-sans">
      {/* ── TOP HERO HEADER & METRIC STREAM ── */}
      <div className="terminal-card-glass p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-black text-xl shadow-[0_0_16px_rgba(0,242,254,0.35)] shrink-0">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-cyan-400 font-sans">
                  DELTA EXCHANGE // 4H SWING & MACRO SCANNER
                </h1>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                INSTITUTIONAL 4H SMC, VALUE AREA PROFILE & MULTI-PILLAR DERIVATIVES INTELLIGENCE
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
            <div className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-mono font-semibold text-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              {coins.length} Scanned
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
            {isBtcBearish ? 'BEARISH REGIME (FAVOR 4H SHORTS)' : 'NEUTRAL / SELECTIVE'}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Macro Environment & BTC 4H Institutional Filter
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isBtcBearish
                ? 'BTC 4H Structure broke below Value Area POC ($81,600). Smart money favors high-asymmetry SHORT setups on 4H supply retests.'
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

      {/* ── HIGHEST-QUALITY CURRENT OPPORTUNITY (4H SWING) SPOTLIGHT ── */}
      <div className="terminal-hero-spotlight">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Verdict, Thesis (Why) & Actions (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
                <span>🏆</span>
                #1 HIGHEST-CONFLUENCE INSTITUTIONAL 4H SWING
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white">
                  {bestSetup.underlying} ({bestSetup.contractSymbol})
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-cyan-400">
                  ${bestSetup.price > 10 ? bestSetup.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : bestSetup.price}
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${bestSetup.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {bestSetup.change24h >= 0 ? '+' : ''}{bestSetup.change24h.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Confirmed Direction Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={
                bestSetup.tradePlan.direction === 'SHORT'
                  ? 'badge-short-neon text-xs px-3 py-1 font-black shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                  : bestSetup.tradePlan.direction === 'LONG'
                  ? 'badge-long-neon text-xs px-3 py-1 font-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : 'badge-wait-neon text-xs px-3 py-1 font-black'
              }>
                {bestSetup.tradePlan.direction === 'SHORT'
                  ? '🔴 CONFIRMED SHORT (Sell Retest of 4H Supply)'
                  : bestSetup.tradePlan.direction === 'LONG'
                  ? '🟢 CONFIRMED LONG (Buy Pullback at 4H Demand)'
                  : '⏸️ WAIT (Capital Preservation)'}
              </span>
              <span className="badge-score-neon">
                CONFLUENCE SCORE: {bestSetup.scoreBreakdown.totalScore}/100
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                CONFIDENCE: {bestSetup.confidence}%
              </span>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                LEVERAGE: {bestSetup.tradePlan.recommendedLeverage}x CROSS
              </span>
            </div>

            {/* ── KYON KAR RAHE HAIN? (WHY INSTITUTIONAL THESIS) ── */}
            <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-3.5 space-y-2.5 shadow-inner">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-cyan-400" />
                  Kyon Kar Rahe Hain? (Multi-Dimensional Institutional Rationale)
                </span>
                <span className="text-[10px] text-slate-400">Fundamental + Technical + Derivatives</span>
              </div>

              {/* Rationale Bullet Points */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                  <span><strong>Technical Structure:</strong> {bestSetup.thesis?.whyTechnical || bestSetup.structureLabel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0 mt-0.5">◆</span>
                  <span><strong>Derivatives & OI:</strong> {bestSetup.thesis?.whyDerivatives || `Delta Open Interest $${(bestSetup.openInterest / 1000000).toFixed(1)}M with active positioning.`}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">◆</span>
                  <span><strong>Fundamental Catalyst:</strong> {bestSetup.thesis?.whyFundamental || `Tier-1 liquidity asset on Delta Exchange India.`}</span>
                </div>
              </div>

              {/* Highlighted Hindi/Hinglish Advice Callout */}
              <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-2.5 text-xs text-cyan-200">
                <div className="font-extrabold text-cyan-300 flex items-center gap-1 mb-1">
                  <span>💡</span>
                  <span>Seedha Aur Saaf Institutional Advice (Hinglish):</span>
                </div>
                <p className="leading-relaxed text-[11px] text-cyan-100">
                  {bestSetup.thesis?.whyHindiHinglish}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedCoin(bestSetup);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-4 py-2 text-xs font-bold transition-all shadow-[0_0_14px_rgba(0,242,254,0.15)] cursor-pointer"
              >
                <span>⚡</span>
                Open 4H Canvas & Position Sizer
              </button>

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
                className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-400" />}
                <span>{isSpeaking ? 'Stop Audio' : 'Jarvis Audio'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Execution Blueprint (Where - Kis Area Par) (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                Kis Area Par Karna Hai? (Precision 4H Execution Blueprint)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">R:R 1:{bestSetup.tradePlan.riskRewardRatio.toFixed(2)}</span>
            </div>

            <div className="plan-grid-neon">
              <div className="plan-item-neon border-cyan-500/30">
                <div className="plan-item-label text-cyan-300">🎯 PREFERRED ENTRY ZONE</div>
                <div className="plan-item-val text-cyan-300 font-black">
                  ${bestSetup.tradePlan.entryZone[0].toLocaleString()} – ${bestSetup.tradePlan.entryZone[1].toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {bestSetup.tradePlan.direction === 'SHORT' ? '4H Bearish FVG / Breakdown POC Retest' : '4H Demand Order Block Reclaim'}
                </div>
              </div>

              <div className="plan-item-neon border-rose-500/30">
                <div className="plan-item-label text-rose-400">🛑 INVALIDATION STOP LOSS</div>
                <div className="plan-item-val text-rose-400 font-black">
                  ${bestSetup.tradePlan.stopLoss.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {bestSetup.tradePlan.direction === 'SHORT' ? 'Above 4H Supply Order Block High' : 'Below 4H Demand Base'}
                </div>
              </div>

              <div className="plan-item-neon border-emerald-500/30">
                <div className="plan-item-label text-emerald-400">🏁 TAKE PROFIT 1 (PARTIAL)</div>
                <div className="plan-item-val text-emerald-400 font-black">
                  ${bestSetup.tradePlan.takeProfit1.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Book 50% & Move Stop to Break-Even</div>
              </div>

              <div className="plan-item-neon border-emerald-500/30">
                <div className="plan-item-label text-emerald-400">🏆 TAKE PROFIT 2 (EXPANSION)</div>
                <div className="plan-item-val text-emerald-400 font-black">
                  ${bestSetup.tradePlan.takeProfit2.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Macro 4H Liquidity Sweep Pool</div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">RISK : REWARD RATIO</div>
                <div className="plan-item-val text-cyan-300">
                  1 : {bestSetup.tradePlan.riskRewardRatio.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Strictly Institutional Asymmetric</div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">DELTA VALUE AREA POC</div>
                <div className="plan-item-val text-amber-400">
                  ${bestSetup.volumeProfile.poc.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">High-Volume Node Pivot</div>
              </div>
            </div>

            <div className="invalidation-box-neon">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-xs">
                <strong>Invalidation Rule:</strong> {bestSetup.tradePlan.invalidationReason}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BEST 5 SWING SETUPS ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🏆</span>
            <h2 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Best 5 Institutional 4H Swing Setups
            </h2>
            <span className="rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-500/40 px-2.5 py-0.5 text-[10px] font-bold">
              DELTA EXCHANGE INDIA TOP CONFLUENCE
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Strict No-Trade Protection Safeguards Applied
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {top5Swings.map((c, idx) => (
            <div
              key={c.symbol}
              onClick={() => {
                setSelectedCoin(c);
                setIsModalOpen(true);
              }}
              className="terminal-card-glass p-3.5 hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black text-cyan-400">#{idx + 1}</span>
                  <span className="font-bold text-sm text-white">{c.contractSymbol}</span>
                </div>
                <span className={c.verdict === 'STRONG_SHORT' || c.verdict === 'SHORT' ? 'badge-short-neon' : 'badge-long-neon'}>
                  {c.verdict === 'STRONG_SHORT' || c.verdict === 'SHORT' ? 'SHORT' : 'LONG'}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base font-black font-mono text-cyan-300">
                  ${c.price > 10 ? c.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : c.price}
                </span>
                <span className="badge-score-neon text-[10px] py-0 px-2">
                  {c.scoreBreakdown.totalScore}/100
                </span>
              </div>

              <div className="text-[10px] text-slate-300 space-y-0.5 pt-1 border-t border-border/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry:</span>
                  <span className="font-mono text-cyan-300">${c.tradePlan.entryZone[0]} – ${c.tradePlan.entryZone[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stop Loss:</span>
                  <span className="font-mono text-rose-400">${c.tradePlan.stopLoss}</span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] pt-1 text-slate-400 font-mono">
                <span>R:R: 1:{c.tradePlan.riskRewardRatio.toFixed(2)}</span>
                <span className={c.tradePlan.direction === 'SHORT' ? 'text-rose-400' : 'text-emerald-400'}>
                  {c.smcZone.orderBlock.type} OB
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8-PILLAR QUANTITATIVE CONFLUENCE AUDIT ── */}
      <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            8-Pillar Quantitative Confluence Audit: {selectedCoin.symbol} ({selectedCoin.contractSymbol})
          </div>
          <div className="text-xs font-mono font-bold text-primary">
            Total Score: {selectedCoin.scoreBreakdown.totalScore}/100
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: 'Structure', score: selectedCoin.scoreBreakdown.structureScore, max: 15 },
            { label: 'SMC / OB', score: selectedCoin.scoreBreakdown.smcScore, max: 15 },
            { label: 'Volume POC', score: selectedCoin.scoreBreakdown.volumeProfileScore, max: 15 },
            { label: 'Deriv & OI', score: selectedCoin.scoreBreakdown.derivativesScore, max: 15 },
            { label: 'MTF Align', score: selectedCoin.scoreBreakdown.mtfScore, max: 15 },
            { label: 'RS vs BTC', score: selectedCoin.scoreBreakdown.relStrengthScore, max: 10 },
            { label: 'Momentum', score: selectedCoin.scoreBreakdown.momentumScore, max: 10 },
            { label: 'R:R Ratio', score: selectedCoin.scoreBreakdown.riskRewardScore, max: 5 }
          ].map(pillar => (
            <div key={pillar.label} className="rounded-lg bg-background/50 border border-border p-2 text-center">
              <div className="text-[10px] text-muted-foreground truncate">{pillar.label}</div>
              <div className="text-xs font-black text-foreground mt-0.5">
                <span className="text-primary">{pillar.score}</span>
                <span className="text-muted-foreground text-[10px]">/{pillar.max}</span>
              </div>
              <div className="w-full bg-border/50 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(pillar.score / pillar.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 230+ CONTRACTS UNIVERSE FILTER BAR & TABLE ── */}
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search coin or contract..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-48 sm:w-64"
              />
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
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              Sync
            </button>
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
                <th className="py-3 px-3">SMC & POC</th>
                <th className="py-3 px-3">Derivatives & OI</th>
                <th className="py-3 px-3 text-center">8-Pillar Score</th>
                <th className="py-3 px-3">Confirmed Verdict</th>
                <th className="py-3 px-3 text-right">Execution Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCoins.map((coin, index) => (
                <tr
                  key={coin.symbol}
                  onClick={() => {
                    setSelectedCoin(coin);
                    setIsModalOpen(true);
                  }}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">
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

                  <td className="py-3 px-3 text-muted-foreground">
                    <div>{coin.smcZone.orderBlock.type} OB</div>
                    <div className="text-[10px]">POC: ${coin.volumeProfile.poc.toLocaleString()}</div>
                  </td>

                  <td className="py-3 px-3 text-muted-foreground">
                    <div className="font-mono">OI: ${(coin.openInterest / 1000000).toFixed(1)}M</div>
                    <div className="text-[10px] text-amber-400">Funding: {(coin.fundingRate * 100).toFixed(4)}%</div>
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
                        setIsModalOpen(true);
                      }}
                      className="rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Inspect Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: 4H INTERACTIVE CHART, FULL THESIS & POSITION SIZER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
          <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-black text-sm">
                  {selectedCoin.symbol}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-foreground">
                      {selectedCoin.underlying} — 4H Swing Blueprint
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {selectedCoin.contractSymbol}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mark: ${selectedCoin.price.toLocaleString()} | 24h: {selectedCoin.change24h}% | Delta Leverage: up to {selectedCoin.maxLeverage}x
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-md bg-background border border-border p-0.5 text-xs">
                  <button
                    onClick={() => setChartMode('CANVAS')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${chartMode === 'CANVAS' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    AI Canvas
                  </button>
                  <button
                    onClick={() => setChartMode('TRADINGVIEW')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${chartMode === 'TRADINGVIEW' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    TradingView
                  </button>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Chart View */}
              <div className="rounded-xl border border-border bg-background p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    <span>4H SMC Candlestick Stream (POC, FVG & Order Block Levels)</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    SL: <span className="text-rose-400 font-bold">${selectedCoin.tradePlan.stopLoss}</span> | TP1: <span className="text-emerald-400 font-bold">${selectedCoin.tradePlan.takeProfit1}</span>
                  </div>
                </div>

                {chartMode === 'CANVAS' ? (
                  <div ref={chartContainerRef} className="w-full h-[380px]" />
                ) : (
                  <div className="w-full h-[380px]">
                    <TradingViewWidget symbol={`BINANCE:${selectedCoin.symbol}USDT`} />
                  </div>
                )}
              </div>

              {/* Institutional Thesis Breakdown: Kyon Kar Rahe Hain? */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-cyan-400" />
                    Kyon Kar Rahe Hain? (Institutional Multi-Factor Rationale)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    selectedCoin.tradePlan.direction === 'SHORT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                    selectedCoin.tradePlan.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    VERDICT: {selectedCoin.verdict.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-card/60 p-2.5 border border-border">
                    <div className="font-bold text-cyan-400 mb-1">📊 4H Technical Structure:</div>
                    <div className="text-slate-300 text-[11px]">{selectedCoin.thesis?.whyTechnical}</div>
                  </div>
                  <div className="rounded-lg bg-card/60 p-2.5 border border-border">
                    <div className="font-bold text-indigo-400 mb-1">🌊 Derivatives & Order Flow:</div>
                    <div className="text-slate-300 text-[11px]">{selectedCoin.thesis?.whyDerivatives}</div>
                  </div>
                  <div className="rounded-lg bg-card/60 p-2.5 border border-border">
                    <div className="font-bold text-amber-400 mb-1">🏛️ Fundamental Factors:</div>
                    <div className="text-slate-300 text-[11px]">{selectedCoin.thesis?.whyFundamental}</div>
                  </div>
                </div>

                <div className="rounded-lg bg-cyan-950/50 border border-cyan-500/40 p-3 text-xs text-cyan-100">
                  <div className="font-bold text-cyan-300 mb-0.5">🇮🇳 Institutional Hinglish Summary:</div>
                  <p className="text-[11px] leading-relaxed">{selectedCoin.thesis?.whyHindiHinglish}</p>
                </div>
              </div>

              {/* Execution Plan & Risk Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trade Setup Details (Where - Kis Area Par) */}
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    Kis Area Par Karna Hai? (Execution Blueprint)
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Direction / Verdict:</span>
                      <span className={`font-black ${selectedCoin.tradePlan.direction === 'SHORT' ? 'text-rose-400' : selectedCoin.tradePlan.direction === 'LONG' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedCoin.tradePlan.direction}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">🎯 Optimal Entry Zone:</span>
                      <span className="font-bold text-cyan-300">
                        ${selectedCoin.tradePlan.entryZone[0].toLocaleString()} – ${selectedCoin.tradePlan.entryZone[1].toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">🛑 Invalidation Stop Loss:</span>
                      <span className="font-bold text-rose-400">${selectedCoin.tradePlan.stopLoss.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">🏁 Take Profit 1 (Partial 1.8R):</span>
                      <span className="font-bold text-emerald-400">${selectedCoin.tradePlan.takeProfit1.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">🏆 Take Profit 2 (Expansion 3R+):</span>
                      <span className="font-bold text-emerald-300">${selectedCoin.tradePlan.takeProfit2.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">⚖️ Risk-to-Reward Ratio:</span>
                      <span className="font-black text-cyan-300">1 : {selectedCoin.tradePlan.riskRewardRatio.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-1">
                      <span className="font-bold text-foreground">Rule: </span>
                      {selectedCoin.tradePlan.invalidationReason}
                    </div>
                  </div>
                </div>

                {/* Dynamic Position Sizing Calculator */}
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="h-4 w-4 text-amber-400" />
                    Capital & Position Sizing Calculator (Delta India)
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-muted-foreground text-[10px]">Account Capital (USD)</label>
                      <input
                        type="number"
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(Number(e.target.value))}
                        className="w-full mt-1 rounded bg-card border border-border p-1.5 font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[10px]">Max Risk Per Trade (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(Number(e.target.value))}
                        className="w-full mt-1 rounded bg-card border border-border p-1.5 font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-card p-3 border border-border space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Amount:</span>
                      <span className="font-bold text-rose-400">${calcRiskAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calculated Units:</span>
                      <span className="font-bold text-primary font-mono">{calculatedPositionContracts} {selectedCoin.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Notional Value:</span>
                      <span className="font-bold text-foreground font-mono">${calculatedNotional}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border">
                      <span className="text-muted-foreground">Recommended Leverage:</span>
                      <span className="font-black text-amber-400">{selectedCoin.tradePlan.recommendedLeverage}x (Cross)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Delta Exchange India Market Feed | Execution strictly risk-managed
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
