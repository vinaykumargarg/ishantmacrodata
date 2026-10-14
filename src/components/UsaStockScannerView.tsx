import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, Clock, Calculator, AlertTriangle,
  PieChart as PieIcon, DollarSign, Building, Briefcase
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
  UsaStockProfile,
  usaStockService,
  INITIAL_USA_STOCKS,
  CURRENT_MACRO_REGIME
} from '../services/usaStockEngine';
import { voiceService } from '../services/voiceSynthesisService';
import TradingViewWidget from './TradingViewWidget';

interface Props {
  onNavigate?: (tabId: string) => void;
}

export default function UsaStockScannerView({ onNavigate }: Props) {
  const [stocks, setStocks] = useState<UsaStockProfile[]>(INITIAL_USA_STOCKS);
  const [selectedStock, setSelectedStock] = useState<UsaStockProfile>(INITIAL_USA_STOCKS[0]);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [biasFilter, setBiasFilter] = useState<'ALL' | 'BUY' | 'WAIT' | 'SHORT' | 'SAFE_EARNINGS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<'CANVAS' | 'TRADINGVIEW'>('CANVAS');
  const [activeTabHorizon, setActiveTabHorizon] = useState<'SWING_4H' | 'INVEST_6M' | 'PORTFOLIO_BUILDER'>('SWING_4H');
  const [langMode, setLangMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Position Sizing State
  const [accountCapital, setAccountCapital] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);

  // Chart DOM Reference
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  // Filter logic
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchSearch =
        stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.industry.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (sectorFilter !== 'ALL' && stock.sector !== sectorFilter) return false;

      if (biasFilter === 'BUY') return stock.verdict === 'STRONG_BUY' || stock.verdict === 'BUY';
      if (biasFilter === 'WAIT') return stock.verdict === 'WAIT';
      if (biasFilter === 'SHORT') return stock.verdict === 'STRONG_SHORT' || stock.verdict === 'SHORT';
      if (biasFilter === 'SAFE_EARNINGS') return !stock.earningsRisk.hasRiskWarning;

      return true;
    });
  }, [stocks, searchQuery, sectorFilter, biasFilter]);

  const topPicks = useMemo(() => {
    return [...stocks]
      .filter(s => (s.verdict === 'STRONG_BUY' || s.verdict === 'BUY') && !s.earningsRisk.hasRiskWarning)
      .sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore)
      .slice(0, 5);
  }, [stocks]);

  const bestPick = topPicks[0] || selectedStock;

  // Position Sizing Calculation
  const riskAmount = (accountCapital * riskPercent) / 100;
  const priceDistance = Math.abs(selectedStock.price - selectedStock.tradePlan.stopLoss);
  const calculatedShares = priceDistance > 0 ? Math.floor(riskAmount / priceDistance) : 0;
  const calculatedNotional = (calculatedShares * selectedStock.price).toFixed(2);

  // Lightweight Chart Setup for Stocks
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

    const baseP = selectedStock.price;
    const dummyCandles = [];
    const nowSec = Math.floor(Date.now() / 1000);

    for (let i = 50; i >= 0; i--) {
      const time = (nowSec - i * 14400) as any;
      const wave = Math.sin(i / 5) * 0.015 * baseP;
      const open = baseP + wave + (Math.random() - 0.5) * 0.008 * baseP;
      const close = open + (Math.random() - 0.48) * 0.012 * baseP;
      const high = Math.max(open, close) + Math.random() * 0.006 * baseP;
      const low = Math.min(open, close) - Math.random() * 0.006 * baseP;
      dummyCandles.push({ time, open, high, low, close });
    }

    candleSeries.setData(dummyCandles);

    if (selectedStock.tradePlan.stopLoss) {
      candleSeries.createPriceLine({
        price: selectedStock.tradePlan.stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        title: 'Stop Loss',
        axisLabelVisible: true
      });
    }
    if (selectedStock.tradePlan.takeProfit1) {
      candleSeries.createPriceLine({
        price: selectedStock.tradePlan.takeProfit1,
        color: '#10b981',
        lineWidth: 2,
        title: 'TP1 (2R Target)',
        axisLabelVisible: true
      });
    }
    if (selectedStock.smcLevels.poc) {
      candleSeries.createPriceLine({
        price: selectedStock.smcLevels.poc,
        color: '#f59e0b',
        lineWidth: 1,
        title: 'POC',
        axisLabelVisible: true
      });
    }

    chartInstanceRef.current = chart;

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
  }, [isModalOpen, chartMode, selectedStock]);

  // Voice Briefing
  const triggerVoiceBriefing = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    let speechText = '';
    if (langMode === 'hindi') {
      speechText = `यूएस स्टॉक स्विंग और इन्वेस्टमेंट रिपोर्ट। नंबर वन पिक ${bestPick.name} है, जिसका टिकर ${bestPick.ticker} है। 10-पिलर स्कोर ${bestPick.scoreBreakdown.totalScore} आउट ऑफ 100 है। 4-ऑवर एंट्री जोन डॉलर ${bestPick.tradePlan.entryZone[0]} से ${bestPick.tradePlan.entryZone[1]} के बीच है, स्टॉप लॉस ${bestPick.tradePlan.stopLoss} है, और टारगेट वन ${bestPick.tradePlan.takeProfit1} है। अर्निंग्स रिस्क शून्य है।`;
    } else if (langMode === 'hinglish') {
      speechText = `Dhyan se suno bhai! US Stocks 4H Swing Scanner par sabse strong setup ${bestPick.ticker} यानी ${bestPick.name} ka hai. Total quantitative score ${bestPick.scoreBreakdown.totalScore} out of 100 hai. Earnings risk clear hai aur agle 30 din koi binary event nahi hai. Optimal entry zone ${bestPick.tradePlan.entryZone[0]} se ${bestPick.tradePlan.entryZone[1]} dollar hai, invalidation stop loss ${bestPick.tradePlan.stopLoss} par rakhein aur target one ${bestPick.tradePlan.takeProfit1} hai.`;
    } else {
      speechText = `USA Stocks Swing & Investment Briefing. Top ranked institutional pick is ${bestPick.name}, ticker ${bestPick.ticker}, scoring ${bestPick.scoreBreakdown.totalScore} out of 100. Trade direction is ${bestPick.tradePlan.direction} with entry zone from ${bestPick.tradePlan.entryZone[0]} to ${bestPick.tradePlan.entryZone[1]}, stop loss at ${bestPick.tradePlan.stopLoss}, and target one at ${bestPick.tradePlan.takeProfit1}, delivering a 1 to ${bestPick.tradePlan.riskRewardRatio.toFixed(2)} risk to reward.`;
    }

    setIsSpeaking(true);
    voiceService.speak(speechText, {
      langMode,
      onEnd: () => setIsSpeaking(false)
    });
  };

  return (
    <div className="space-y-5 font-sans">
      {/* ── TOP HERO HEADER & METRIC STREAM ── */}
      <div className="terminal-card-glass p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-xl shadow-[0_0_16px_rgba(59,130,246,0.35)] shrink-0">
              🇺🇸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">
                  USA STOCKS // 4H SWING & INVESTMENT SCANNER
                </h1>
              </div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-0.5">
                S&P 500, NASDAQ & RUSSELL 1000 INSTITUTIONAL EQUITY RADAR
              </div>
            </div>
          </div>

          {/* Telemetry Chips & Scan Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#00e676]" />
              LIVE NYSE / NASDAQ
            </div>
            <div className="rounded-full border border-blue-500/20 bg-background/50 px-3 py-1 text-xs font-mono text-blue-300">
              500+ Scanned
            </div>
            <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-400 font-bold">
              EARNINGS SHIELD (&lt;14D)
            </div>

            <button
              onClick={triggerVoiceBriefing}
              className="btn-scan-neon"
            >
              <Volume2 className="h-3.5 w-3.5" />
              {isSpeaking ? 'Stop Briefing' : 'Deeepr Voice Briefing'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MACRO REGIME BANNER (EXACT NEON PHOTO MATCH) ── */}
      <div className="regime-banner-neon">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="badge-long-neon flex items-center gap-1.5 self-start sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            RISK-ON EQUITIES
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              US Macro & Equity Regime Filter
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {CURRENT_MACRO_REGIME.marketRegimeVerdict}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-5 shrink-0 text-right">
          <div className="border-l border-border/60 pl-4">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">S&P 500</div>
            <div className="text-xs font-mono font-black text-emerald-400 mt-0.5">BULLISH TREND</div>
          </div>
          <div className="border-l border-border/60 pl-4">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Nasdaq 100</div>
            <div className="text-xs font-mono font-black text-cyan-400 mt-0.5">EXPANSION</div>
          </div>
          <div className="border-l border-border/60 pl-4">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">VIX Volatility</div>
            <div className="text-xs font-mono font-black text-foreground mt-0.5">{CURRENT_MACRO_REGIME.vixLevel}</div>
          </div>
          <div className="border-l border-border/60 pl-4">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">US 10Y Yield</div>
            <div className="text-xs font-mono font-black text-amber-400 mt-0.5">{CURRENT_MACRO_REGIME.us10YYield}%</div>
          </div>
        </div>
      </div>

      {/* ── HIGHEST-QUALITY US OPPORTUNITY SPOTLIGHT ── */}
      <div className="terminal-hero-spotlight">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
                <span>🏆</span>
                HIGHEST-QUALITY US EQUITY OPPORTUNITY
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white">
                  {bestPick.ticker}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-cyan-400">
                  ${bestPick.price.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                {bestPick.name} • {bestPick.sector} ({bestPick.industry})
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-long-neon">
                FINAL BIAS: {bestPick.verdict.replace('_', ' ')}
              </span>
              <span className="badge-score-neon">
                10-PILLAR SCORE: {bestPick.scoreBreakdown.totalScore}/100
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                EARNINGS SAFE: {bestPick.earningsRisk.daysUntilEarnings}d away
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                13F INST: {bestPick.institutionalOwnership}%
              </span>
            </div>

            {/* Bullets with glowing cyan diamonds */}
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                <span>{bestPick.structureSummary}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                <span>Options Max Pain at ${bestPick.optionsSentiment.maxPainPrice.toFixed(2)} with Bullish institutional flow (P/C {bestPick.optionsSentiment.putCallRatio}).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">◆</span>
                <span>DCF Intrinsic Fair Value ${bestPick.investmentHorizon.fairValueDCF.toFixed(2)} with +{bestPick.investmentHorizon.marginOfSafety.toFixed(1)}% margin of safety. {bestPick.investmentHorizon.growthThesis}</span>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedStock(bestPick);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-4 py-2 text-xs font-bold transition-all shadow-[0_0_14px_rgba(0,242,254,0.15)] cursor-pointer"
              >
                <span>⚡</span>
                Open Deep Research & 4H Chart
              </button>
            </div>
          </div>

          {/* Right Column: 2x3 Parameter Grid & Invalidation (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="plan-grid-neon">
              <div className="plan-item-neon">
                <div className="plan-item-label">Preferred Entry Zone</div>
                <div className="plan-item-val text-cyan-400">
                  ${bestPick.tradePlan.entryZone[0].toFixed(2)} – ${bestPick.tradePlan.entryZone[1].toFixed(2)}
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Dynamic Stop Loss (ATR)</div>
                <div className="plan-item-val text-rose-400">
                  ${bestPick.tradePlan.stopLoss.toFixed(2)}
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Take Profit 1 (Partial)</div>
                <div className="plan-item-val text-emerald-400">
                  ${bestPick.tradePlan.takeProfit1.toFixed(2)} (Partial 2R)
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Take Profit 2 / 3</div>
                <div className="plan-item-val text-emerald-400">
                  ${bestPick.tradePlan.takeProfit2.toFixed(2)} (Swing Expansion)
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">Risk : Reward Ratio</div>
                <div className="plan-item-val text-cyan-300">
                  1 : {bestPick.tradePlan.riskRewardRatio.toFixed(2)}
                </div>
              </div>

              <div className="plan-item-neon">
                <div className="plan-item-label">DCF Fair Value Target</div>
                <div className="plan-item-val text-white">
                  ${bestPick.investmentHorizon.fairValueDCF.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="invalidation-box-neon">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>
                <strong>Invalidation:</strong> ${bestPick.tradePlan.stopLoss.toFixed(2)} ({bestPick.tradePlan.invalidationTrigger})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BEST 5 US SWING PICKS (EXACT MATCH TO PHOTO) ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🏆</span>
            <h2 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Top 5 US Equity 4H Swings (Zero Earnings Risk &lt;14D)
            </h2>
            <span className="rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-500/40 px-2.5 py-0.5 text-[10px] font-bold">
              PRIMARY 4H DECISION TIMEFRAME
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Strict Binary Earnings Safeguards Applied
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topPicks.map((s, idx) => (
            <div
              key={s.ticker}
              onClick={() => {
                setSelectedStock(s);
                setIsModalOpen(true);
              }}
              className="terminal-card-glass p-3.5 hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black text-cyan-400">#{idx + 1}</span>
                  <span className="font-bold text-sm text-white">{s.ticker}</span>
                </div>
                <span className="badge-long-neon text-[10px]">
                  {s.verdict.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base font-black font-mono text-cyan-300">
                  ${s.price.toFixed(2)}
                </span>
                <span className="badge-score-neon text-[10px] py-0 px-2">
                  {s.scoreBreakdown.totalScore}/100
                </span>
              </div>

              <div className="text-[10px] text-muted-foreground truncate">{s.name}</div>

              <div className="flex justify-between text-[11px] pt-1.5 border-t border-border/50 text-slate-400 font-mono">
                <span>R:R: 1:{s.tradePlan.riskRewardRatio.toFixed(2)}</span>
                <span className="text-emerald-400">{s.earningsRisk.daysUntilEarnings}d safe</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── UNIVERSE TABLE & FILTER BAR ── */}
      <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Table Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b border-border gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setBiasFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                biasFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              All Tickers ({stocks.length})
            </button>
            <button
              onClick={() => setBiasFilter('BUY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                biasFilter === 'BUY'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-emerald-400'
              }`}
            >
              Buy Candidates
            </button>
            <button
              onClick={() => setBiasFilter('SAFE_EARNINGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                biasFilter === 'SAFE_EARNINGS'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-background border border-border text-muted-foreground hover:text-amber-400'
              }`}
            >
              Earnings Safe (&gt;14d)
            </button>
            <button
              onClick={() => setBiasFilter('WAIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                biasFilter === 'WAIT'
                  ? 'bg-slate-700 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Wait / Earnings Risk
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search US ticker or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Stocks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-3">Ticker / Company</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">24h Change</th>
                <th className="py-3 px-3">Earnings Risk Guard</th>
                <th className="py-3 px-3">4H Structure</th>
                <th className="py-3 px-3">13F & Valuation</th>
                <th className="py-3 px-3 text-center">10-Pillar Score</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStocks.map((stock, index) => (
                <tr
                  key={stock.ticker}
                  onClick={() => {
                    setSelectedStock(stock);
                    setIsModalOpen(true);
                  }}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary font-mono">
                        {stock.ticker}
                      </span>
                      <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {stock.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{stock.sector} • {stock.marketCap}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-foreground">
                    ${stock.price.toFixed(2)}
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold">
                    <span className={stock.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {stock.earningsRisk.hasRiskWarning ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold">
                        <AlertTriangle className="h-3 w-3" />
                        Earnings in {stock.earningsRisk.daysUntilEarnings}d
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        Safe ({stock.earningsRisk.daysUntilEarnings}d)
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        stock.structure4H === 'BULLISH_BOS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : stock.structure4H === 'BEARISH_BOS'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {stock.structure4H.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-muted-foreground">
                    <div>13F: <span className="font-bold text-foreground">{stock.institutionalOwnership}%</span></div>
                    <div className="text-[10px]">P/E: {stock.peRatio.toFixed(1)}x | PEG: {stock.pegRatio}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 font-black text-sm">
                      <span className={stock.scoreBreakdown.totalScore >= 80 ? 'text-emerald-400' : stock.scoreBreakdown.totalScore >= 65 ? 'text-primary' : 'text-muted-foreground'}>
                        {stock.scoreBreakdown.totalScore}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/100</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-extrabold ${
                        stock.verdict === 'STRONG_BUY' || stock.verdict === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : stock.verdict === 'STRONG_SHORT' || stock.verdict === 'SHORT'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {stock.verdict.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStock(stock);
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

      {/* ── MODAL: 4H CHART, 1-6M THESIS & POSITION SIZER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
          <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-black text-sm">
                  {selectedStock.ticker}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-foreground">
                      {selectedStock.name} ({selectedStock.ticker})
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {selectedStock.sector}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Price: ${selectedStock.price.toFixed(2)} | Market Cap: {selectedStock.marketCap} | Institutional 13F: {selectedStock.institutionalOwnership}%
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
                    <span>4H Candlestick Chart (Levels & Volume Profile POC)</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    SL: <span className="text-rose-400 font-bold">${selectedStock.tradePlan.stopLoss.toFixed(2)}</span> | TP1: <span className="text-emerald-400 font-bold">${selectedStock.tradePlan.takeProfit1.toFixed(2)}</span>
                  </div>
                </div>

                {chartMode === 'CANVAS' ? (
                  <div ref={chartContainerRef} className="w-full h-[380px]" />
                ) : (
                  <div className="w-full h-[380px]">
                    <TradingViewWidget symbol={`NASDAQ:${selectedStock.ticker}`} />
                  </div>
                )}
              </div>

              {/* Execution Details & 1-6M Thesis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 4H Swing Blueprint */}
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    4H Swing Trading Execution Blueprint
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Verdict & Reason:</span>
                      <span className="font-bold text-emerald-400">{selectedStock.verdict.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Optimal Entry Zone:</span>
                      <span className="font-bold text-foreground">
                        ${selectedStock.tradePlan.entryZone[0].toFixed(2)} – ${selectedStock.tradePlan.entryZone[1].toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Stop Loss (SL):</span>
                      <span className="font-bold text-rose-400">${selectedStock.tradePlan.stopLoss.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Take Profit 1 (2R):</span>
                      <span className="font-bold text-emerald-400">${selectedStock.tradePlan.takeProfit1.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Take Profit 2 (Expansion):</span>
                      <span className="font-bold text-primary">${selectedStock.tradePlan.takeProfit2.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Risk-to-Reward Ratio:</span>
                      <span className="font-black text-emerald-400">1 : {selectedStock.tradePlan.riskRewardRatio.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-1">
                      <span className="font-bold text-foreground">Invalidation: </span>
                      {selectedStock.tradePlan.invalidationTrigger}
                    </div>
                  </div>
                </div>

                {/* 1-6 Month Investment Outlook & DCF */}
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-amber-400" />
                    1–6 Month Investment Horizon & Moat
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Portfolio Classification:</span>
                      <span className="font-bold text-amber-400">{selectedStock.investmentHorizon.suitability.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">DCF Intrinsic Fair Value:</span>
                      <span className="font-bold text-emerald-400">${selectedStock.investmentHorizon.fairValueDCF.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Margin of Safety:</span>
                      <span className="font-bold text-primary">+{selectedStock.investmentHorizon.marginOfSafety.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Economic Moat Rating:</span>
                      <span className="font-bold text-foreground">{selectedStock.investmentHorizon.moatRating.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">6-Month Price Target:</span>
                      <span className="font-black text-amber-400">${selectedStock.investmentHorizon.target6M.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
                      <span className="font-bold text-foreground">Growth Thesis: </span>
                      {selectedStock.investmentHorizon.growthThesis}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Institutional USA Stock Intelligence | Zero binary earnings front-running
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
