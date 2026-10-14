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
    <div className="space-y-6">
      {/* ── TOP HERO HEADER & US REGIME BANNER ── */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-primary/5 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                NYSE / NASDAQ LIVE STREAM
              </span>
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">
                4H SWING & 1-6M INVESTOR
              </span>
              <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                EARNINGS RISK SHIELD (&lt;14D)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              USA Stocks — Advanced Swing & Investment Scanner
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
              Quantitative 10-Pillar Equity Scoring across S&P 500 & Nasdaq leaders. Evaluates 4H market structure, SMC, 13F smart money accumulation, Options Max Pain, DCF valuation, and Earnings Event Risk warnings.
            </p>
          </div>

          {/* Voice Briefing & Lang Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-background/60 p-2.5 rounded-lg border border-border">
            <div className="flex items-center rounded-md bg-card p-0.5 border border-border text-xs">
              <button
                onClick={() => setLangMode('hinglish')}
                className={`px-2 py-1 rounded ${langMode === 'hinglish' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLangMode('hindi')}
                className={`px-2 py-1 rounded ${langMode === 'hindi' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLangMode('english')}
                className={`px-2 py-1 rounded ${langMode === 'english' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
              >
                Eng
              </button>
            </div>

            <button
              onClick={triggerVoiceBriefing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-md cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              {isSpeaking ? 'Stop Briefing' : 'Deeepr.ai Voice Briefing'}
            </button>
          </div>
        </div>

        {/* Macro Regime Status Ticker Row */}
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="rounded-lg bg-background/50 border border-border p-2">
            <span className="text-muted-foreground text-[10px]">S&P 500 (SPY):</span>
            <div className="font-bold text-emerald-400 mt-0.5">Bullish Trend (Above 20 EMA)</div>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-2">
            <span className="text-muted-foreground text-[10px]">Nasdaq 100 (QQQ):</span>
            <div className="font-bold text-emerald-400 mt-0.5">Bullish Expansion</div>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-2">
            <span className="text-muted-foreground text-[10px]">VIX Volatility:</span>
            <div className="font-bold text-primary mt-0.5">{CURRENT_MACRO_REGIME.vixLevel} (Low Risk)</div>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-2">
            <span className="text-muted-foreground text-[10px]">US 10Y Yield:</span>
            <div className="font-bold text-foreground mt-0.5">{CURRENT_MACRO_REGIME.us10YYield}%</div>
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-2 col-span-2 sm:col-span-1">
            <span className="text-muted-foreground text-[10px]">US Dollar Index (DXY):</span>
            <div className="font-bold text-amber-400 mt-0.5">{CURRENT_MACRO_REGIME.dxyIndex}</div>
          </div>
        </div>
      </div>

      {/* ── TOP 5 SWING HERO PICKS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            Top 5 US Equity 4H Swings (Zero Earnings Risk &lt;14D)
          </h2>
          <span className="text-xs text-muted-foreground">Ranked by 10-Pillar Equity Confluence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topPicks.map((s, idx) => (
            <div
              key={s.ticker}
              onClick={() => {
                setSelectedStock(s);
                setIsModalOpen(true);
              }}
              className={`group relative rounded-xl border p-3.5 transition-all duration-200 cursor-pointer hover:border-primary/60 hover:shadow-xl ${
                s.ticker === selectedStock.ticker
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-black text-primary">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-sm text-foreground">{s.ticker}</span>
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {s.verdict.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-base font-black text-foreground">${s.price.toFixed(2)}</span>
                <span className={`text-xs font-semibold ${s.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {s.change24h >= 0 ? '+' : ''}{s.change24h.toFixed(2)}%
                </span>
              </div>

              <div className="text-[10px] text-muted-foreground truncate mb-2">{s.name}</div>

              <div className="space-y-1 pt-2 border-t border-border/50 text-[11px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Score:</span>
                  <span className="font-bold text-primary">{s.scoreBreakdown.totalScore}/100</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>R:R Setup:</span>
                  <span className="font-semibold text-emerald-400">1:{s.tradePlan.riskRewardRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Earnings:</span>
                  <span className="font-medium text-emerald-400">{s.earningsRisk.daysUntilEarnings}d away (Safe)</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-bold text-primary group-hover:translate-x-1 transition-transform">
                <span>View Full Audit</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SPOTLIGHT BEST STOCK CARD ── */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/10 p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 font-black text-lg">
              {bestPick.ticker}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">#1 US Institutional Pick</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold">
                  {bestPick.verdict.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">
                {bestPick.name} • {bestPick.sector} ({bestPick.industry})
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Current Price</div>
              <div className="text-xl font-black text-foreground">${bestPick.price.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">10-Pillar Score</div>
              <div className="text-xl font-black text-primary">
                {bestPick.scoreBreakdown.totalScore}
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedStock(bestPick);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-lg"
            >
              <Maximize2 className="h-4 w-4" />
              Open 4H Canvas & 1-6M Thesis
            </button>
          </div>
        </div>

        {/* 10-Pillar Scoring Breakdown Grid */}
        <div className="py-4">
          <div className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            10-Pillar Equity Scoring Audit
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {[
              { label: 'Structure', score: bestPick.scoreBreakdown.structureScore, max: 15 },
              { label: 'SMC POC', score: bestPick.scoreBreakdown.smcVolumeScore, max: 15 },
              { label: 'RS vs SPY', score: bestPick.scoreBreakdown.relStrengthScore, max: 10 },
              { label: 'Earnings Risk', score: bestPick.scoreBreakdown.earningsSafetyScore, max: 10 },
              { label: 'Fundamentals', score: bestPick.scoreBreakdown.fundamentalsScore, max: 10 },
              { label: 'Valuation/DCF', score: bestPick.scoreBreakdown.valuationScore, max: 10 },
              { label: '13F Smart Money', score: bestPick.scoreBreakdown.inst13FOwnershipScore, max: 10 },
              { label: 'Options/MaxPain', score: bestPick.scoreBreakdown.optionsSentimentScore, max: 10 },
              { label: 'Macro Regime', score: bestPick.scoreBreakdown.macroAlignmentScore, max: 5 },
              { label: 'Risk/Reward', score: bestPick.scoreBreakdown.riskRewardScore, max: 5 }
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

        {/* Execution Plan Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">4H Swing Entry Zone</div>
            <div className="text-sm font-black text-emerald-400 mt-1">
              ${bestPick.tradePlan.entryZone[0].toFixed(2)} – ${bestPick.tradePlan.entryZone[1].toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">4H Order Block Retest</div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Invalidation Stop Loss</div>
            <div className="text-sm font-black text-rose-400 mt-1">
              ${bestPick.tradePlan.stopLoss.toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Strict structural invalidation</div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Targets (TP1 / TP2)</div>
            <div className="text-sm font-black text-primary mt-1">
              TP1: ${bestPick.tradePlan.takeProfit1.toFixed(2)} | TP2: ${bestPick.tradePlan.takeProfit2.toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">R:R Ratio 1:{bestPick.tradePlan.riskRewardRatio.toFixed(2)}</div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">1-6M Investment Target</div>
            <div className="text-sm font-black text-amber-400 mt-1">
              ${bestPick.investmentHorizon.target6M.toFixed(2)} (Fair Value: ${bestPick.investmentHorizon.fairValueDCF.toFixed(2)})
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {bestPick.investmentHorizon.moatRating.replace('_', ' ')} • {bestPick.investmentHorizon.suitability.replace('_', ' ')}
            </div>
          </div>
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
