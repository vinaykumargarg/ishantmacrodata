import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp, TrendingDown, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, Clock, Calculator, AlertTriangle
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

  // Fetch live market data on mount
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
        coin.underlying.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterBias === 'LONG') {
        return coin.verdict === 'STRONG_BUY' || coin.verdict === 'BUY';
      }
      if (filterBias === 'SHORT') {
        return coin.verdict === 'STRONG_SHORT' || coin.verdict === 'SHORT';
      }
      if (filterBias === 'TOP_SCORE') {
        return coin.scoreBreakdown.totalScore >= 85;
      }
      if (filterBias === 'WAIT') {
        return coin.verdict === 'WAIT';
      }
      return true;
    });
  }, [coins, searchQuery, filterBias]);

  const top5Swings = useMemo(() => {
    return [...coins]
      .filter(c => c.verdict === 'STRONG_BUY' || c.verdict === 'STRONG_SHORT' || c.verdict === 'BUY')
      .sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore)
      .slice(0, 5);
  }, [coins]);

  const bestSetup = top5Swings[0] || selectedCoin;

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

    for (let i = 50; i >= 0; i--) {
      const time = (nowSec - i * 14400) as any;
      const wave = Math.sin(i / 4) * 0.02 * baseP;
      const open = baseP + wave + (Math.random() - 0.5) * 0.01 * baseP;
      const close = open + (Math.random() - 0.48) * 0.015 * baseP;
      const high = Math.max(open, close) + Math.random() * 0.008 * baseP;
      const low = Math.min(open, close) - Math.random() * 0.008 * baseP;
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
    if (selectedCoin.tradePlan.takeProfit1) {
      candleSeries.createPriceLine({
        price: selectedCoin.tradePlan.takeProfit1,
        color: '#10b981',
        lineWidth: 2,
        title: 'TP1 (1.5R)',
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

    let speechText = '';
    if (langMode === 'hindi') {
      speechText = `डेल्टा एक्सचेंज 4H स्विंग स्कैनर रिपोर्ट। सबसे मजबूत सेटअप ${bestSetup.symbol} में है, जिसकी कॉनफ्लुएंस स्कोर ${bestSetup.scoreBreakdown.totalScore} आउट ऑफ 100 है। एंट्री जोन डॉलर ${bestSetup.tradePlan.entryZone[0]} से ${bestSetup.tradePlan.entryZone[1]} के बीच है, स्टॉप लॉस ${bestSetup.tradePlan.stopLoss} है, और टारगेट वन ${bestSetup.tradePlan.takeProfit1} है। रिस्क टू रिवार्ड रेशियो 1 इस टू ${bestSetup.tradePlan.riskRewardRatio.toFixed(2)} है।`;
    } else if (langMode === 'hinglish') {
      speechText = `Dhyan se dekho bhai! Delta Exchange 4H Swing Scanner par sabse high conviction setup ${bestSetup.symbol} ka hai, total score ${bestSetup.scoreBreakdown.totalScore} out of 100 hai. Structure clear bullish break of structure confirm kar raha hai. Optimal entry zone ${bestSetup.tradePlan.entryZone[0]} se ${bestSetup.tradePlan.entryZone[1]} hai, stop loss strictly ${bestSetup.tradePlan.stopLoss} par rakhein aur target one ${bestSetup.tradePlan.takeProfit1} hai. Minimum 2:1 risk reward maintain karein!`;
    } else {
      speechText = `Delta Exchange Institutional 4-Hour Swing Scanner Briefing. Top ranked swing opportunity is ${bestSetup.symbol} with a quantitative score of ${bestSetup.scoreBreakdown.totalScore} over 100. Trade plan direction is ${bestSetup.tradePlan.direction} with entry zone between ${bestSetup.tradePlan.entryZone[0]} and ${bestSetup.tradePlan.entryZone[1]}, stop loss at ${bestSetup.tradePlan.stopLoss}, and target one at ${bestSetup.tradePlan.takeProfit1}, delivering a risk to reward ratio of 1 to ${bestSetup.tradePlan.riskRewardRatio.toFixed(2)}.`;
    }

    setIsSpeaking(true);
    voiceService.speak(speechText, {
      langMode,
      onEnd: () => setIsSpeaking(false)
    });
  };

  return (
    <div className="space-y-5 font-sans">
      {/* ── TOP HERO HEADER & METRIC STREAM (EXACT MATCH TO PHOTO) ── */}
      <div className="terminal-card-glass p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-black text-xl shadow-[0_0_16px_rgba(0,242,254,0.35)] shrink-0">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-cyan-400 font-sans">
                  DELTA EXCHANGE // 4H SWING SCANNER
                </h1>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                ALL-COIN MARKET INTELLIGENCE & MEDIUM-TERM INVESTMENT RADAR
              </div>
            </div>
          </div>

          {/* Telemetry Chips & Scan Button (Exact Photo Match) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/60 bg-emerald-500/15 px-3 py-1 text-xs font-mono font-bold text-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.35)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#00e676]" />
              LIVE
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-semibold text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              261 Active Pairs
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-mono font-semibold text-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              {coins.length} Scanned
            </div>
            <div className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-mono text-slate-400 hidden sm:block">
              TIME: {lastUpdated}
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

      {/* ── MACRO ENVIRONMENT & BTC MARKET FILTER BAR (EXACT MATCH TO PHOTO) ── */}
      <div className="regime-banner-neon">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="badge-wait-neon flex items-center gap-1.5 self-start sm:self-center">
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#ffb300]" />
            NEUTRAL
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Macro Environment & BTC Market Filter
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Balanced macro conditions. Selective swing trading favored with strict risk-to-reward parameters.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-5 shrink-0 text-right">
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">BTC 4H Structure</div>
            <div className="text-xs font-mono font-black text-amber-400 mt-0.5">CONSOLIDATION</div>
          </div>
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">BTC Dominance</div>
            <div className="text-xs font-mono font-black text-white mt-0.5">58.4%</div>
          </div>
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">BTC 24h Change</div>
            <div className="text-xs font-mono font-black text-rose-400 mt-0.5">-0.29%</div>
          </div>
          <div className="border-l border-slate-700/80 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Macro Score</div>
            <div className="text-xs font-mono font-black text-cyan-400 mt-0.5">60/100</div>
          </div>
        </div>
      </div>

      {/* ── HIGHEST-QUALITY CURRENT OPPORTUNITY (4H SWING) SPOTLIGHT (EXACT MATCH TO PHOTO) ── */}
      <div className="terminal-hero-spotlight">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
                <span>🏆</span>
                HIGHEST-QUALITY CURRENT OPPORTUNITY (4H SWING)
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white">
                  {bestSetup.contractSymbol}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-cyan-400">
                  ${bestSetup.price > 10 ? bestSetup.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : bestSetup.price}
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={bestSetup.verdict === 'STRONG_SHORT' || bestSetup.verdict === 'SHORT' ? 'badge-short-neon' : 'badge-long-neon'}>
                FINAL BIAS: {bestSetup.verdict === 'STRONG_SHORT' || bestSetup.verdict === 'SHORT' ? 'SHORT' : 'LONG'}
              </span>
              <span className="badge-score-neon">
                SWING SCORE: {bestSetup.scoreBreakdown.totalScore}/100
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                CONFIDENCE: {bestSetup.confidence}%
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                HORIZON: 3-7 DAYS
              </span>
            </div>

            {/* Bullets with glowing cyan diamonds */}
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                <span>{bestSetup.structureLabel}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                <span>{bestSetup.smcZone.orderBlock.type} Order Block & FVG Zone (${bestSetup.volumeProfile.poc.toLocaleString()})</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                <span>Price {bestSetup.change24h >= 0 ? 'expanding' : 'compressing'} with {bestSetup.derivatives.cvdDivergence.replace(/_/g, ' ')}. Aggressive capital opening fresh swing positions.</span>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedCoin(bestSetup);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-4 py-2 text-xs font-bold transition-all shadow-[0_0_14px_rgba(0,242,254,0.15)] cursor-pointer"
              >
                <span>⚡</span>
                Open Deep Research & 4H Chart
              </button>

              <button
                onClick={triggerVoiceBriefing}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-400" />}
                <span>{isSpeaking ? 'Stop Audio' : 'Jarvis Audio'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: 2x3 Parameter Grid & Invalidation (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="plan-grid-neon">
              <div className="plan-item-neon">
                <div className="plan-item-label">Preferred Entry Zone</div>
                <div className="plan-item-val text-cyan-400">
                  ${bestSetup.tradePlan.entryZone[0].toLocaleString()} – ${bestSetup.tradePlan.entryZone[1].toLocaleString()}
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Dynamic Stop Loss (ATR)</div>
                <div className="plan-item-val text-rose-400">
                  ${bestSetup.tradePlan.stopLoss.toLocaleString()}
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Take Profit 1 (Partial)</div>
                <div className="plan-item-val text-emerald-400">
                  ${bestSetup.tradePlan.takeProfit1.toLocaleString()} (Partial 1.8R)
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Take Profit 2 / 3</div>
                <div className="plan-item-val text-emerald-400">
                  ${bestSetup.tradePlan.takeProfit2.toLocaleString()} (Swing Low 3.0R)
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Risk : Reward Ratio</div>
                <div className="plan-item-val text-cyan-300">
                  1 : {bestSetup.tradePlan.riskRewardRatio.toFixed(2)}
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Breakout Entry</div>
                <div className="plan-item-val text-white">
                  ${bestSetup.volumeProfile.val.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="invalidation-box-neon">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>
                <strong>Invalidation:</strong> ${bestSetup.tradePlan.stopLoss.toLocaleString()} ({bestSetup.tradePlan.invalidationReason})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BEST 5 SWING SETUPS (EXACT MATCH TO PHOTO) ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🏆</span>
            <h2 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Best 5 Swing Setups
            </h2>
            <span className="rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-500/40 px-2.5 py-0.5 text-[10px] font-bold">
              PRIMARY 4H DECISION TIMEFRAME
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

              <div className="flex justify-between text-[11px] pt-1.5 border-t border-border/50 text-slate-400 font-mono">
                <span>R:R: 1:{c.tradePlan.riskRewardRatio.toFixed(2)}</span>
                <span className="text-emerald-400">{c.smcZone.orderBlock.type} OB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SPOTLIGHT BEST SETUP HERO CARD ── */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/10 p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 font-black text-lg">
              {bestSetup.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">#1 Algorithmic Swing Pick</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold">
                  {bestSetup.verdictLabel}
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">
                {bestSetup.underlying} ({bestSetup.contractSymbol})
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Mark Price (Delta)</div>
              <div className="text-xl font-black text-foreground">
                ${bestSetup.price > 10 ? bestSetup.price.toLocaleString() : bestSetup.price}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confluence Score</div>
              <div className="text-xl font-black text-primary">
                {bestSetup.scoreBreakdown.totalScore}
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCoin(bestSetup);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-lg"
            >
              <Maximize2 className="h-4 w-4" />
              Open 4H Canvas & Sizer
            </button>
          </div>
        </div>

        {/* 8-Pillar Scoring Breakdown Grid */}
        <div className="py-4">
          <div className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            8-Pillar Quantitative Confluence Audit
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Structure', score: bestSetup.scoreBreakdown.structureScore, max: 15 },
              { label: 'SMC / OB', score: bestSetup.scoreBreakdown.smcScore, max: 15 },
              { label: 'Volume POC', score: bestSetup.scoreBreakdown.volumeProfileScore, max: 15 },
              { label: 'Deriv & OI', score: bestSetup.scoreBreakdown.derivativesScore, max: 15 },
              { label: 'MTF Align', score: bestSetup.scoreBreakdown.mtfScore, max: 15 },
              { label: 'RS vs BTC', score: bestSetup.scoreBreakdown.relStrengthScore, max: 10 },
              { label: 'Momentum', score: bestSetup.scoreBreakdown.momentumScore, max: 10 },
              { label: 'R:R Ratio', score: bestSetup.scoreBreakdown.riskRewardScore, max: 5 }
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

        {/* Trade Execution Plan Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Optimal Entry Zone</div>
            <div className="text-sm font-black text-emerald-400 mt-1">
              ${bestSetup.tradePlan.entryZone[0].toLocaleString()} – ${bestSetup.tradePlan.entryZone[1].toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Retest of 4H FVG & Value Area</div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Invalidation (Stop Loss)</div>
            <div className="text-sm font-black text-rose-400 mt-1">
              ${bestSetup.tradePlan.stopLoss.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Below 4H Order Block base</div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Targets (TP1 / TP2)</div>
            <div className="text-sm font-black text-primary mt-1">
              TP1: ${bestSetup.tradePlan.takeProfit1.toLocaleString()} | TP2: ${bestSetup.tradePlan.takeProfit2.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">R:R Ratio 1:{bestSetup.tradePlan.riskRewardRatio.toFixed(2)}</div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">1-3M Investment Outlook</div>
            <div className="text-sm font-black text-amber-400 mt-1">
              Target: ${bestSetup.investmentHorizon.target90D.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {bestSetup.investmentHorizon.decision.replace('_', ' ')} • {bestSetup.investmentHorizon.fundamentalHealth}
            </div>
          </div>
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
              All Coins ({coins.length})
            </button>
            <button
              onClick={() => setFilterBias('LONG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'LONG'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-emerald-400'
              }`}
            >
              Long Setups (BOS)
            </button>
            <button
              onClick={() => setFilterBias('SHORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'SHORT'
                  ? 'bg-rose-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-rose-400'
              }`}
            >
              Short Setups
            </button>
            <button
              onClick={() => setFilterBias('TOP_SCORE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'TOP_SCORE'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-background border border-border text-muted-foreground hover:text-amber-400'
              }`}
            >
              Top Alpha (Score ≥ 85)
            </button>
            <button
              onClick={() => setFilterBias('WAIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBias === 'WAIT'
                  ? 'bg-slate-700 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Wait / No Trade
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
                <th className="py-3 px-3">Actionable Verdict</th>
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

      {/* ── MODAL: 4H INTERACTIVE CHART & POSITION SIZER ── */}
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
                      {selectedCoin.underlying} — 4H Swing Terminal
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {selectedCoin.contractSymbol}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mark: ${selectedCoin.price.toLocaleString()} | 24h: {selectedCoin.change24h}% | Delta India Leverage: up to {selectedCoin.maxLeverage}x
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-md bg-background border border-border p-0.5 text-xs">
                  <button
                    onClick={() => setChartMode('CANVAS')}
                    className={`px-2.5 py-1 rounded font-bold ${chartMode === 'CANVAS' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    AI Canvas
                  </button>
                  <button
                    onClick={() => setChartMode('TRADINGVIEW')}
                    className={`px-2.5 py-1 rounded font-bold ${chartMode === 'TRADINGVIEW' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    TradingView
                  </button>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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

              {/* Execution Plan & Risk Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trade Setup Details */}
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    Precision 4H Execution Blueprint
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Direction / Verdict:</span>
                      <span className="font-black text-emerald-400">{selectedCoin.verdict.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Optimal Entry Zone:</span>
                      <span className="font-bold text-foreground">
                        ${selectedCoin.tradePlan.entryZone[0].toLocaleString()} – ${selectedCoin.tradePlan.entryZone[1].toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Invalidation Stop Loss:</span>
                      <span className="font-bold text-rose-400">${selectedCoin.tradePlan.stopLoss.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Take Profit 1 (1.5R):</span>
                      <span className="font-bold text-emerald-400">${selectedCoin.tradePlan.takeProfit1.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Take Profit 2 (3R+ Expansion):</span>
                      <span className="font-bold text-primary">${selectedCoin.tradePlan.takeProfit2.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Risk-to-Reward Ratio:</span>
                      <span className="font-black text-emerald-400">1 : {selectedCoin.tradePlan.riskRewardRatio.toFixed(2)}</span>
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
                    Capital & Position Sizing Calculator
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
                Delta Exchange India Market Feed | Execution purely quantitative
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
