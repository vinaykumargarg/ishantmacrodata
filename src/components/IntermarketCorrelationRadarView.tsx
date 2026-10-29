import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw,
  Shield, AlertTriangle, CheckCircle2, Activity, Zap, Compass, Eye,
  Layers, BarChart2, Radio, Target, Sparkles, Filter, Scale, Columns,
  Maximize2, ArrowRight, DollarSign, Coins, HelpCircle, Volume2
} from 'lucide-react';
import {
  computeIntermarketRadar,
  TimeframeKey,
  AssetPairType,
  IntermarketRadarState,
  TfCorrelationAnalysis
} from '../services/intermarketRadarEngine';
import { sharedQuoteStore } from '../services/sharedQuoteStore';
import { TradingViewWidget } from './TradingViewWidget';
import { voiceService } from '../services/voiceSynthesisService';

export const IntermarketCorrelationRadarView: React.FC = () => {
  // Navigation & View Mode
  const [selectedPair, setSelectedPair] = useState<AssetPairType>('BTC_USDT');
  const [selectedTf, setSelectedTf] = useState<TimeframeKey>('15m');
  const [chartLayout, setChartLayout] = useState<'SIDE_BY_SIDE' | 'STACKED'>('SIDE_BY_SIDE');
  const [isQuadView, setIsQuadView] = useState<boolean>(false);

  // Live Asset Prices from sharedQuoteStore
  const [btcQuote, setBtcQuote] = useState(() => sharedQuoteStore.getQuote('BTCUSDT'));
  const [usdtDQuote, setUsdtDQuote] = useState(() => sharedQuoteStore.getQuote('USDTD'));
  const [goldQuote, setGoldQuote] = useState(() => sharedQuoteStore.getQuote('PAXGUSDT'));
  const [dxyQuote, setDxyQuote] = useState(() => sharedQuoteStore.getQuote('DXY'));
  const [lastTickTime, setLastTickTime] = useState<string>(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  // Voice narration state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Subscribe to real-time quote updates
  useEffect(() => {
    const unsub = sharedQuoteStore.subscribe((quote) => {
      const sym = quote.symbol;
      if (sym === 'BTCUSDT') setBtcQuote(quote);
      else if (sym === 'USDTD') setUsdtDQuote(quote);
      else if (sym === 'PAXGUSDT' || sym === 'XAUUSD') setGoldQuote(quote);
      else if (sym === 'DXY') setDxyQuote(quote);
      setLastTickTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    });
    return () => unsub();
  }, []);

  // Compute Radar State
  const radarData: IntermarketRadarState = useMemo(() => {
    const btcPx = btcQuote.price > 0 ? btcQuote.price : 81458;
    const btcChg = btcQuote.change24h || 0.85;
    const usdtDPx = usdtDQuote.price > 0 ? usdtDQuote.price : 6.718;
    const usdtDChg = usdtDQuote.change24h || -1.45;
    const goldPx = goldQuote.price > 0 ? goldQuote.price : 4047.33;
    const goldChg = goldQuote.change24h || -0.32;
    const dxyPx = dxyQuote.price > 0 ? dxyQuote.price : 102.401;
    const dxyChg = dxyQuote.change24h || 0.28;

    return computeIntermarketRadar(
      btcPx, btcChg,
      usdtDPx, usdtDChg,
      goldPx, goldChg,
      dxyPx, dxyChg
    );
  }, [btcQuote, usdtDQuote, goldQuote, dxyQuote]);

  const activePairSummary = selectedPair === 'BTC_USDT' ? radarData.btcUsdt : radarData.goldDxy;
  const activeTfAnalysis: TfCorrelationAnalysis = activePairSummary.timeframes[selectedTf];

  // Convert selectedTf to TradingView interval format
  const tvInterval = useMemo(() => {
    switch (selectedTf) {
      case '15m': return '15';
      case '1h': return '60';
      case '4h': return '240';
      case '1D': return 'D';
      default: return '15';
    }
  }, [selectedTf]);

  // Voice Brief Handler
  const handleVoiceBrief = useCallback(() => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `${activePairSummary.title}. ${activeTfAnalysis.tfLabel}. ${activeTfAnalysis.institutionalThesisHinglish} Playbook action: ${activeTfAnalysis.traderPlaybook.action}. ${activeTfAnalysis.traderPlaybook.triggerCondition}.`;
      setIsSpeaking(true);
      voiceService.speak(textToSpeak, {
        langMode: 'hinglish',
        onEnd: () => setIsSpeaking(false)
      });
    }
  }, [isSpeaking, activePairSummary, activeTfAnalysis]);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto pb-16 px-2 sm:px-4">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. INSTITUTIONAL HERO HEADER & MULTI-ASSET BAR           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background p-4 sm:p-6 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <Radio className="size-3 animate-pulse text-emerald-400" />
                INTERMARKET DUAL RADAR v4.2
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Live Websocket Sync • {lastTickTime} IST
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                Closed-Candle Confirmed
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground font-display flex flex-wrap items-center gap-2.5">
              <span>BTC ⚡ USDT.D</span>
              <span className="text-muted-foreground font-light">&</span>
              <span>GOLD ⚡ DXY</span>
              <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">
                (Multi-Timeframe Inverse Correlation Scanner)
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Real-time liquidity flow & macro confirmation matrix. Jab <strong className="text-foreground">Bitcoin</strong> upar ja raha ho aur <strong className="text-foreground">USDT Dominance (USDT.D)</strong> dump ho raha ho, to Long safe hota hai. Same way, jab <strong className="text-foreground">DXY</strong> girta hai to <strong className="text-foreground">Gold</strong> me genuine breakout milta hai.
            </p>
          </div>

          {/* Quick Actions & Voice */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={handleVoiceBrief}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                isSpeaking
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
              }`}
              title="Jarvis AI Institutional Audio Brief"
            >
              <Volume2 className="size-4 text-primary" />
              <span>{isSpeaking ? 'Stop Audio Brief' : 'Hinglish Audio Brief'}</span>
            </button>

            <button
              onClick={() => setIsQuadView(!isQuadView)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                isQuadView
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <Columns className="size-4" />
              <span>{isQuadView ? 'Exit Quad View' : 'Quad 4-Chart Mode'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Ticker Snapshot Row */}
        <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* BTC */}
          <div className="p-3 rounded-xl bg-card/60 border border-border/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Coins className="size-3 text-amber-500" />
                BITSTAMP:BTCUSD
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-foreground mt-0.5">
                ${(btcQuote.price || 81458).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${
              (btcQuote.change24h || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {(btcQuote.change24h || 0) >= 0 ? '+' : ''}{(btcQuote.change24h || 0.85).toFixed(2)}%
            </div>
          </div>

          {/* USDT.D */}
          <div className="p-3 rounded-xl bg-card/60 border border-border/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <DollarSign className="size-3 text-cyan-400" />
                CRYPTOCAP:USDT.D
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-cyan-400 mt-0.5">
                {(usdtDQuote.price || 6.718).toFixed(3)}%
              </div>
            </div>
            <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${
              (usdtDQuote.change24h || 0) <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {(usdtDQuote.change24h || -1.45).toFixed(2)}%
              <span className="text-[10px] block opacity-75 font-normal">
                {(usdtDQuote.change24h || 0) <= 0 ? 'Bullish BTC' : 'Bearish BTC'}
              </span>
            </div>
          </div>

          {/* Gold */}
          <div className="p-3 rounded-xl bg-card/60 border border-border/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-amber-400" />
                FOREXCOM:XAUUSD
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-300 mt-0.5">
                ${(goldQuote.price || 4047.33).toFixed(2)}
              </div>
            </div>
            <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${
              (goldQuote.change24h || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {(goldQuote.change24h || 0) >= 0 ? '+' : ''}{(goldQuote.change24h || -0.32).toFixed(2)}%
            </div>
          </div>

          {/* DXY */}
          <div className="p-3 rounded-xl bg-card/60 border border-border/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <BarChart2 className="size-3 text-blue-400" />
                TVC:DXY (US Dollar)
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-blue-400 mt-0.5">
                {(dxyQuote.price || 102.401).toFixed(3)}
              </div>
            </div>
            <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${
              (dxyQuote.change24h || 0) <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {(dxyQuote.change24h || 0) >= 0 ? '+' : ''}{(dxyQuote.change24h || 0.28).toFixed(2)}%
              <span className="text-[10px] block opacity-75 font-normal">
                {(dxyQuote.change24h || 0) > 0 ? 'Gold Pressure' : 'Gold Support'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. DUAL PAIR CONTROLLER & TIMEFRAME SELECTOR              */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card/80">
        {/* Pair Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setSelectedPair('BTC_USDT'); setIsQuadView(false); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              selectedPair === 'BTC_USDT' && !isQuadView
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Coins className="size-4" />
            <span>🪙 BTC/USD ⚡ USDT.D (Crypto Radar)</span>
          </button>

          <button
            onClick={() => { setSelectedPair('GOLD_DXY'); setIsQuadView(false); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              selectedPair === 'GOLD_DXY' && !isQuadView
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-black'
                : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="size-4" />
            <span>🥇 XAUUSD (Gold) ⚡ DXY (Macro Dollar)</span>
          </button>
        </div>

        {/* Timeframe Buttons (15m, 1h, 4h, 1D) */}
        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-xl border border-border">
          {(['15m', '1h', '4h', '1D'] as TimeframeKey[]).map((tf) => {
            const isActive = selectedTf === tf;
            return (
              <button
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Layout Toggle (Side-by-Side vs Stacked) */}
        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border text-xs">
          <button
            onClick={() => setChartLayout('SIDE_BY_SIDE')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              chartLayout === 'SIDE_BY_SIDE'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Side-by-side 50/50 horizontal split"
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setChartLayout('STACKED')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              chartLayout === 'STACKED'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Stacked top-and-bottom view"
          >
            Stacked
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. MULTI-TIMEFRAME SYNCHRONIZATION MATRIX (15m, 1h, 4h, 1D) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Multi-Timeframe Correlation Matrix (15M ➔ 1D)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Har timeframe par check karein ki dono assets me inverse alignment confirmed hai ya trap hai.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">Alignment Score:</span>
            <span className="font-bold text-emerald-400">
              {activePairSummary.correlationMatrixHealth.alignedTfs}/4 TFs Aligned
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(['15m', '1h', '4h', '1D'] as TimeframeKey[]).map((tf) => {
            const tfItem = activePairSummary.timeframes[tf];
            const isCurrentTf = selectedTf === tf;

            // Color border according to state
            const badgeColorClasses = {
              emerald: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
              red: 'border-rose-500/40 bg-rose-500/5 text-rose-400',
              amber: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
              blue: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
              purple: 'border-purple-500/40 bg-purple-500/5 text-purple-400'
            }[tfItem.stateBadge.color];

            return (
              <div
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isCurrentTf
                    ? 'ring-2 ring-primary border-primary bg-card shadow-lg shadow-primary/5'
                    : 'border-border/80 bg-card/60 hover:bg-card hover:border-border'
                }`}
              >
                {/* Header: TF badge and Conviction */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-secondary text-foreground">
                    {tf.toUpperCase()} ({tfItem.tfLabel.split(' ')[0]})
                  </span>

                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border">
                    Corr: {tfItem.correlationCoefficient.toFixed(2)}
                  </span>
                </div>

                {/* State Badge */}
                <div className={`p-2 rounded-lg border text-xs font-bold mb-3 ${badgeColorClasses}`}>
                  <div className="truncate">{tfItem.stateBadge.label}</div>
                  <div className="text-[10px] font-normal opacity-85 truncate mt-0.5">
                    {tfItem.stateBadge.sublabel}
                  </div>
                </div>

                {/* 2 Assets Side-by-Side Status */}
                <div className="space-y-2 text-xs font-mono border-t border-border/60 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground truncate">{tfItem.asset1.symbol}:</span>
                    <span className={`font-bold ${
                      tfItem.asset1.structure === 'BULLISH' ? 'text-emerald-400' : tfItem.asset1.structure === 'BEARISH' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {tfItem.asset1.structure} ({tfItem.asset1.priceFormatted})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground truncate">{tfItem.asset2.symbol}:</span>
                    <span className={`font-bold ${
                      tfItem.asset2.structure === 'BEARISH' ? 'text-emerald-400' : tfItem.asset2.structure === 'BULLISH' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {tfItem.asset2.structure} ({tfItem.asset2.priceFormatted})
                    </span>
                  </div>
                </div>

                {/* Micro Takeaway */}
                <div className="mt-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground line-clamp-2">
                  {tfItem.institutionalThesisHinglish}
                </div>

                {isCurrentTf && (
                  <div className="mt-2.5 text-center text-[10px] font-bold text-primary flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>VIEWING ON DUAL CHARTS</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. DUAL CHARTS CONTAINER (SYNCHRONIZED TRADINGVIEW WIDGETS)*/}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-display flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              <span>
                Synchronized Dual Chart View ({selectedTf.toUpperCase()} Timeframe)
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Left / Top chart shows primary asset ({activePairSummary.asset1Symbol}), Right / Bottom chart shows inverse macro transceiver ({activePairSummary.asset2Symbol}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-secondary font-mono text-muted-foreground border border-border">
              Interval: {selectedTf.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        {!isQuadView ? (
          <div className={`grid gap-4 ${
            chartLayout === 'SIDE_BY_SIDE' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* Chart 1: Primary Asset (BTC or Gold) */}
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3.5 py-2 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{activePairSummary.asset1TvSymbol}</span>
                  <span className="text-muted-foreground font-normal">
                    ({activeTfAnalysis.asset1.priceFormatted})
                  </span>
                </span>
                <span className={`font-semibold ${
                  activeTfAnalysis.asset1.structure === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {activeTfAnalysis.asset1.structure} MOMENTUM
                </span>
              </div>
              <div className="h-[460px] w-full">
                <TradingViewWidget
                  symbol={activePairSummary.asset1TvSymbol}
                  interval={tvInterval}
                  height="100%"
                />
              </div>
            </div>

            {/* Chart 2: Macro Transceiver (USDT.D or DXY) */}
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3.5 py-2 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{activePairSummary.asset2TvSymbol}</span>
                  <span className="text-muted-foreground font-normal">
                    ({activeTfAnalysis.asset2.priceFormatted})
                  </span>
                </span>
                <span className={`font-semibold ${
                  activeTfAnalysis.asset2.structure === 'BEARISH' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {activeTfAnalysis.asset2.structure} ({activePairSummary.pair === 'BTC_USDT' ? 'Inverse to BTC' : 'Inverse to Gold'})
                </span>
              </div>
              <div className="h-[460px] w-full">
                <TradingViewWidget
                  symbol={activePairSummary.asset2TvSymbol}
                  interval={tvInterval}
                  height="100%"
                />
              </div>
            </div>
          </div>
        ) : (
          /* QUAD VIEW: ALL 4 ASSETS AT ONCE (BTC + USDT.D + GOLD + DXY) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BTC */}
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground">1. BITSTAMP:BTCUSD</span>
                <span className="text-emerald-400 font-semibold">${btcQuote.price.toLocaleString()}</span>
              </div>
              <div className="h-[360px]">
                <TradingViewWidget symbol="BITSTAMP:BTCUSD" interval={tvInterval} height="100%" />
              </div>
            </div>

            {/* USDT.D */}
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground">2. CRYPTOCAP:USDT.D</span>
                <span className="text-cyan-400 font-semibold">{usdtDQuote.price.toFixed(3)}%</span>
              </div>
              <div className="h-[360px]">
                <TradingViewWidget symbol="CRYPTOCAP:USDT.D" interval={tvInterval} height="100%" />
              </div>
            </div>

            {/* GOLD */}
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground">3. FOREXCOM:XAUUSD</span>
                <span className="text-amber-400 font-semibold">${goldQuote.price.toFixed(2)}</span>
              </div>
              <div className="h-[360px]">
                <TradingViewWidget symbol="FOREXCOM:XAUUSD" interval={tvInterval} height="100%" />
              </div>
            </div>

            {/* DXY */}
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground">4. TVC:DXY</span>
                <span className="text-blue-400 font-semibold">{dxyQuote.price.toFixed(3)}</span>
              </div>
              <div className="h-[360px]">
                <TradingViewWidget symbol="TVC:DXY" interval={tvInterval} height="100%" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. INSTITUTIONAL ACTION BOX & PLAYBOOK (HINGLISH DEEP DIVE)*/}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Playbook Rules Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <Target className="size-4 text-emerald-400" />
              <span>Trader Playbook ({selectedTf.toUpperCase()})</span>
            </h4>
            <span className={`px-2.5 py-1 rounded-md text-xs font-black font-mono ${
              activeTfAnalysis.traderPlaybook.action === 'BUY LONG'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : activeTfAnalysis.traderPlaybook.action === 'SELL SHORT'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {activeTfAnalysis.traderPlaybook.action}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-muted-foreground block text-[11px] font-mono">Entry Trigger Rule:</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {activeTfAnalysis.traderPlaybook.triggerCondition}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-muted-foreground block text-[11px] font-mono">Stop-Loss Invalidation:</span>
              <span className="font-semibold text-rose-400 font-mono mt-0.5 block">
                {activeTfAnalysis.traderPlaybook.stopLossRule}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-muted-foreground block text-[11px] font-mono">Target Reference (TP1/TP2):</span>
              <span className="font-semibold text-emerald-400 font-mono mt-0.5 block">
                {activeTfAnalysis.traderPlaybook.targetReference}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border font-mono text-xs">
              <span className="text-muted-foreground">Estimated Risk:Reward:</span>
              <span className="font-bold text-foreground">{activeTfAnalysis.traderPlaybook.riskRewardEst}</span>
            </div>
          </div>
        </div>

        {/* Detailed Hinglish Desk Thesis */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              <span>Chief Strategist Institutional Desk Guidance (Hinglish)</span>
            </h4>

            <span className="text-xs font-mono text-muted-foreground">
              Conviction Score: <strong className="text-foreground">{activeTfAnalysis.convictionScore}/100</strong>
            </span>
          </div>

          {/* Institutional Thesis Explanation */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs sm:text-sm leading-relaxed text-foreground space-y-2.5">
            <p>
              💡 <strong>Market Reality ({activePairSummary.asset1Symbol} vs {activePairSummary.asset2Symbol}):</strong>
            </p>
            <p className="text-muted-foreground">
              {activeTfAnalysis.institutionalThesisHinglish}
            </p>
          </div>

          {/* 3 Core Rules for Trader */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-background/80 border border-border/80 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                <span className="text-emerald-400">1.</span>
                <span>Direct Inflow Rule</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {selectedPair === 'BTC_USDT'
                  ? 'Jab USDT.D girta hai, tabhi BTC Long safe hota hai. Dono ek sath upar ja rahe ho to pump fake hota hai.'
                  : 'Jab DXY 15M resistance se reject ho, tabhi Gold Long lena chahiye. Bullish dollar me Gold buy karna trap hai.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background/80 border border-border/80 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                <span className="text-amber-400">2.</span>
                <span>Closed Candle Rule</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Wicks ko break mat mano. Candle close hone ka wait karein taaki false breakout me entry trigger na ho.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background/80 border border-border/80 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                <span className="text-primary">3.</span>
                <span>Multi-TF Hierarchy</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                4H/1D direction sets the bias. 15M/1H timing sets the trigger. Counter-trend trades me half risk use karein.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntermarketCorrelationRadarView;
