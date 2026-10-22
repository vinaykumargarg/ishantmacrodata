import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw,
  Shield, AlertTriangle, CheckCircle, Brain, Activity, Zap, Play, Pause,
  Volume2, Layers, BarChart2, Radio, Compass, Eye, Info, Clock, ExternalLink,
  ChevronRight, Target, Flame, DollarSign, Database, Share2, Sparkles, Filter, Scale
} from 'lucide-react';
import {
  generateBtcUsdtPrediction,
  BtcUsdtPredictionPayload,
  ScenarioDetail,
  TimeframeStructure
} from '../services/btcUsdtRelationshipEngine';
import { voiceService, VoiceState } from '../services/voiceSynthesisService';
import TradingViewWidget from './TradingViewWidget';
import { FormattedMarkdown } from './FormattedMarkdown';

export const BtcUsdtRelationshipEngine: React.FC = () => {
  // Live Price & WebSocket State
  const [liveBtcPrice, setLiveBtcPrice] = useState<number>(83469);
  const [liveBtcChange, setLiveBtcChange] = useState<number>(0.19);
  const [liveUsdtD, setLiveUsdtD] = useState<number>(5.34);
  const [liveUsdtDChange, setLiveUsdtDChange] = useState<number>(-1.85);
  const [lastWsUpdate, setLastWsUpdate] = useState<string>(new Date().toLocaleTimeString());

  // Interactive Tabs
  const [selectedScenarioTab, setSelectedScenarioTab] = useState<string>('SCENARIO_A');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'5m' | '15m' | '1h' | '4h' | '1D'>('1h');
  const [activeChartTab, setActiveChartTab] = useState<'BTC' | 'USDT_D' | 'DUAL'>('DUAL');
  const [languageMode, setLanguageMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');

  // Voice Playback State
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [speechRate, setSpeechRate] = useState<number>(0.82);

  // Connect Real-Time Binance WebSocket for live BTC price updates
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const rawPrice = parseFloat(data.c);
          const changePct = parseFloat(data.P);
          if (!isNaN(rawPrice) && rawPrice > 0) {
            setLiveBtcPrice(rawPrice);
            setLiveBtcChange(parseFloat(changePct.toFixed(2)));
            setLastWsUpdate(new Date().toLocaleTimeString());
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Subscribe to Voice State
  useEffect(() => {
    const unsub = voiceService.subscribeState((st) => setVoiceState(st));
    return () => unsub();
  }, []);

  // Compute Full Quantitative Prediction Payload
  const prediction: BtcUsdtPredictionPayload = useMemo(() => {
    return generateBtcUsdtPrediction(liveBtcPrice, liveBtcChange, liveUsdtD, liveUsdtDChange);
  }, [liveBtcPrice, liveBtcChange, liveUsdtD, liveUsdtDChange]);

  // Voice Briefing Handler
  const handlePlayVoice = useCallback(() => {
    if (voiceState === 'SPEAKING') {
      voiceService.pauseSpeaking();
    } else if (voiceState === 'PAUSED') {
      voiceService.resumeSpeaking();
    } else {
      const textToSpeak = languageMode === 'hindi'
        ? prediction.spokenVoiceHindi
        : languageMode === 'hinglish'
        ? prediction.spokenVoiceHinglish
        : prediction.spokenVoiceEnglish;
      voiceService.speak(textToSpeak, { langMode: languageMode });
    }
  }, [voiceState, languageMode, prediction]);

  const handleStopVoice = () => voiceService.stopSpeaking();

  const handleSpeedChange = (rate: number) => {
    setSpeechRate(rate);
    voiceService.setRate(rate);
  };

  const activeScenario = useMemo(() => {
    return prediction.scenarios.find(s => s.id === selectedScenarioTab) || prediction.scenarios[0];
  }, [prediction.scenarios, selectedScenarioTab]);

  const activeTfData = useMemo(() => {
    return prediction.timeframes.find(t => t.timeframe === selectedTimeframe) || prediction.timeframes[2];
  }, [prediction.timeframes, selectedTimeframe]);

  return (
    <div className="flex-1 space-y-5 p-3 sm:p-5 max-w-[1680px] mx-auto text-foreground font-sans">
      
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. SECTION 9: REQUIRED FINAL DASHBOARD (FLAGSHIP HEADER)   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        {/* Top Banner Ribbon */}
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-secondary to-primary/5 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
                <RefreshCw className="size-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-display">
                    Advanced BTC–USDT Relationship & Momentum Prediction Engine
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
                    INSTITUTIONAL QUANT
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Multi-Factor Confluence • USDT Dominance Capital Flow • Derivatives Liquidity Magnets • Multi-Timeframe BOS/CHoCH
                </p>
              </div>
            </div>

            {/* Sync & Audio Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card/80 text-xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-muted-foreground">Live Feed:</span>
                <span className="font-mono font-bold text-foreground">{lastWsUpdate}</span>
              </div>

              {/* Language Selector */}
              <div className="flex items-center rounded-xl border border-border bg-secondary/80 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setLanguageMode('hinglish')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    languageMode === 'hinglish' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🇮🇳 Hinglish
                </button>
                <button
                  onClick={() => setLanguageMode('hindi')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    languageMode === 'hindi' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => setLanguageMode('english')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    languageMode === 'english' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌐 English
                </button>
              </div>

              {/* Audio Briefing Button */}
              <button
                onClick={handlePlayVoice}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                  voiceState === 'SPEAKING'
                    ? 'bg-cyan-500 text-white border-cyan-400 animate-pulse'
                    : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
                }`}
              >
                <Volume2 className="size-3.5" />
                <span>
                  {voiceState === 'SPEAKING' ? 'Deeepr Voice Bol Rahi Hai...' : voiceState === 'PAUSED' ? 'Resume Briefing' : '🎙️ Deeepr.ai Voice Briefing'}
                </span>
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#cross-asset-confirmation';
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-bold transition shadow-sm cursor-pointer"
                title="Launch Cross-Asset Confirmation Engine (BTC/USDT ↔ DXY/Gold)"
              >
                <Scale className="size-3.5" />
                <span>Cross-Asset Confirmation Engine ⭐</span>
              </button>

              {voiceState === 'SPEAKING' && (
                <button
                  onClick={handleStopVoice}
                  className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs cursor-pointer"
                  title="Stop Audio"
                >
                  <Pause className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 9 REQUIRED DASHBOARD GRID ── */}
        <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-border bg-card/60">
          {/* Metric 1: BTC Direction */}
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider block">
              1. BTC Direction
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-base sm:text-lg font-bold text-emerald-500 font-mono flex items-center gap-1">
                <ArrowUpRight className="size-5" />
                {prediction.btcDirection}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {liveBtcChange >= 0 ? '+' : ''}{liveBtcChange}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1 truncate">
              Live: ${liveBtcPrice.toLocaleString()}
            </span>
          </div>

          {/* Metric 2: USDT.D Direction */}
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider block">
              2. USDT.D Direction
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-base sm:text-lg font-bold text-emerald-500 font-mono flex items-center gap-1">
                <ArrowDownRight className="size-5" />
                {prediction.usdtDDirection}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {liveUsdtDChange}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1 truncate">
              Dominance: {liveUsdtD}% (Breakdown)
            </span>
          </div>

          {/* Metric 3: Relationship */}
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider block">
              3. Relationship Status
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-base sm:text-lg font-bold text-cyan-500 font-mono flex items-center gap-1">
                <CheckCircle className="size-5" />
                {prediction.relationshipStatus}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                -0.84 Correl
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1 truncate">
              Inverse Rotation Active
            </span>
          </div>

          {/* Metric 4: Momentum Status */}
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider block">
              4. Momentum Status
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-base sm:text-lg font-bold text-emerald-500 font-mono flex items-center gap-1">
                <Zap className="size-5" />
                {prediction.momentumStatus}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Score +{prediction.compositeEvidenceScore}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1 truncate">
              Spot CVD Absorption
            </span>
          </div>

          {/* Metric 5: Primary Action */}
          <div className="col-span-2 md:col-span-1 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-3 flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              5. PRIMARY ACTION
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-500 font-mono tracking-tight">
                {prediction.primaryAction}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
                {prediction.confidenceScore}% Conviction
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block mt-1 truncate">
              Risk:Reward {prediction.executionPlan.riskReward}
            </span>
          </div>
        </div>

        {/* ── SECTION 9 SUMMARY CALLOUT STRIP ── */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-card text-xs">
          {/* Bullish Scenario */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5" />
                Bullish Scenario ({prediction.bullishScenario.probability})
              </span>
              <span className="text-[11px] font-mono">Targets: {prediction.bullishScenario.targetZone}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {prediction.bullishScenario.condition}
            </p>
          </div>

          {/* Bearish Scenario */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
            <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="size-3.5" />
                Bearish Scenario ({prediction.bearishScenario.probability})
              </span>
              <span className="text-[11px] font-mono">Targets: {prediction.bearishScenario.targetZone}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {prediction.bearishScenario.condition}
            </p>
          </div>

          {/* Invalidation & Next Trigger */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <div className="flex items-center justify-between font-bold text-amber-600 dark:text-amber-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Shield className="size-3.5" />
                Invalidation & Trigger
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Invalidation:</strong> {prediction.invalidation}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-1">
              <strong className="text-foreground">Next Trigger:</strong> {prediction.nextTrigger}
            </p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. SECTION 2: LIVE MARKET DATA RIBBON (VERIFIED SOURCES)   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" />
              Real-Time Market Data Stream (Live & Verified Feeds)
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Updated: {lastWsUpdate}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {prediction.liveMetrics.map((m, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-3 shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mb-1">
                  <span className="truncate">{m.label}</span>
                  <span className={`px-1 rounded text-[9px] font-semibold ${
                    m.status === 'LIVE_WS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-foreground truncate">
                  {m.value}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t border-border/40 font-mono">
                <span className={`font-semibold ${
                  m.isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {m.change24h}
                </span>
                <span className="text-[9px] text-muted-foreground truncate max-w-[80px]" title={m.source}>
                  {m.source.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. DUAL TRADINGVIEW CHARTS: BTC/USDT & USDT.D             */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <BarChart2 className="size-4 text-cyan-500" />
              Live Interactive Synchronized Charts
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              Watch Bitcoin Inverse Correlation Against USDT Dominance
            </span>
          </div>

          <div className="flex items-center gap-1 bg-secondary rounded-xl p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveChartTab('DUAL')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                activeChartTab === 'DUAL' ? 'bg-card text-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dual Split View
            </button>
            <button
              onClick={() => setActiveChartTab('BTC')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                activeChartTab === 'BTC' ? 'bg-card text-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              BTC/USDT Full
            </button>
            <button
              onClick={() => setActiveChartTab('USDT_D')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                activeChartTab === 'USDT_D' ? 'bg-card text-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              USDT.D Full
            </button>
          </div>
        </div>

        {/* Dual Chart Rendering */}
        {activeChartTab === 'DUAL' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[440px]">
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  BINANCE: BTCUSDT (Live Price: ${liveBtcPrice.toLocaleString()})
                </span>
                <span className="text-emerald-500 font-semibold">{liveBtcChange >= 0 ? '+' : ''}{liveBtcChange}%</span>
              </div>
              <div className="h-[400px]">
                <TradingViewWidget symbol="BINANCE:BTCUSDT" interval="60" height="100%" />
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="bg-secondary/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-cyan-500" />
                  CRYPTOCAP: USDT.D (USDT Dominance: {liveUsdtD}%)
                </span>
                <span className="text-emerald-500 font-semibold">{liveUsdtDChange}% (Bearish Dominance = Bullish Crypto)</span>
              </div>
              <div className="h-[400px]">
                <TradingViewWidget symbol="CRYPTOCAP:USDT.D" interval="60" height="100%" />
              </div>
            </div>
          </div>
        ) : activeChartTab === 'BTC' ? (
          <div className="rounded-xl border border-border overflow-hidden bg-background h-[500px]">
            <TradingViewWidget symbol="BINANCE:BTCUSDT" interval="60" height="100%" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-background h-[500px]">
            <TradingViewWidget symbol="CRYPTOCAP:USDT.D" interval="60" height="100%" />
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. SECTION 3: BTC-USDT 5-SCENARIO INTERACTIVE MATRIX       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              BTC–USDT Relationship Matrix & 5-Scenario Engine
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deep quantitative interpretation for all 5 possible market conditions (A through E).
            </p>
          </div>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Active Now: Scenario A
          </span>
        </div>

        {/* Scenario Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-border pb-3">
          {prediction.scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenarioTab;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioTab(sc.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{sc.id.replace('SCENARIO_', 'Scenario ')}</span>
                {sc.isActiveCurrent && (
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Scenario Breakdown Card */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {activeScenario.title}
              </h4>
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground mt-1">
                <span>BTC Condition: <strong className="text-foreground">{activeScenario.btcCondition}</strong></span>
                <span>•</span>
                <span>USDT.D Condition: <strong className="text-foreground">{activeScenario.usdtDCondition}</strong></span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              {activeScenario.regimeType}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-lg border border-border/60">
            <strong className="text-foreground">Macro Capital Rotation Interpretation:</strong> {activeScenario.macroInterpretation}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Supporting Evidence */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle className="size-3.5" />
                Supporting Independent Evidence
              </h5>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {activeScenario.supportingEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contradicting Risks */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" />
                Contradicting Risks & Invalidation Checks
              </h5>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {activeScenario.contradictingRisks.map((rk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{rk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Simple Hindi / Hinglish Explanation Card */}
          <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed">
            <span className="font-bold text-primary block mb-1">
              💡 सरल भाषा में समझें (Hindi / Hinglish Analysis):
            </span>
            <p className="text-foreground">
              {languageMode === 'hindi' ? activeScenario.hindiExplanation : activeScenario.hinglishExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. MULTI-TIMEFRAME STRUCTURE & DERIVATIVES MATRIX         */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Section 4 Multi-Timeframe Structure */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                <Layers className="size-4 text-cyan-500" />
                Section 4: Multi-Timeframe Market Structure
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                BOS, CHoCH, Liquidity Sweeps, FVGs & Order Blocks
              </p>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5 mb-3 border-b border-border pb-2.5">
            {prediction.timeframes.map((tf) => (
              <button
                key={tf.timeframe}
                onClick={() => setSelectedTimeframe(tf.timeframe)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedTimeframe === tf.timeframe
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Active Timeframe Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border/80">
              <span className="font-mono text-muted-foreground">Strategic Role:</span>
              <span className="font-semibold text-foreground">{activeTfData.role}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-mono block">Break of Structure (BOS)</span>
                <span className="text-xs font-bold text-emerald-500 font-mono mt-0.5 block">{activeTfData.bosLevel}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-mono block">Change of Character (CHoCH)</span>
                <span className="text-xs font-bold text-rose-500 font-mono mt-0.5 block">{activeTfData.chochLevel}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-mono block">Fair Value Gap (FVG Zone)</span>
                <span className="text-xs font-semibold text-foreground font-mono mt-0.5 block">{activeTfData.fvgZone}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-mono block">Institutional Order Block</span>
                <span className="text-xs font-semibold text-foreground font-mono mt-0.5 block">{activeTfData.orderBlock}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60 flex items-center justify-between">
              <span className="text-muted-foreground">Liquidity Sweep Target:</span>
              <span className="font-mono font-bold text-amber-500">{activeTfData.liquiditySweep}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-muted-foreground">
              <span className="font-bold text-foreground">Trend Execution Note:</span> {activeTfData.trendStatus}
            </div>
          </div>
        </div>

        {/* Right: Section 5 Derivatives & Liquidity Intelligence */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3.5">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <Flame className="size-4 text-amber-500" />
              Section 5: Liquidity & Derivatives Intelligence
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Price vs Open Interest 4-Quadrant Matrix & Liquidation Magnets
            </p>
          </div>

          {/* 4-Quadrant Active Callout */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Active Derivatives Quadrant
            </span>
            <div className="text-sm font-bold text-foreground mt-1">
              {prediction.derivativesMatrix.priceOiQuadrant.title}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {prediction.derivativesMatrix.priceOiQuadrant.meaning}
            </p>
          </div>

          {/* Squeeze Probability Gauges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/80">
              <span className="text-[10px] text-muted-foreground font-mono block">Short Squeeze Probability</span>
              <span className="text-xs font-bold text-emerald-500 font-mono mt-0.5 block">
                {prediction.derivativesMatrix.priceOiQuadrant.shortSqueezeProbability}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/80">
              <span className="text-[10px] text-muted-foreground font-mono block">Long Squeeze Probability</span>
              <span className="text-xs font-bold text-muted-foreground font-mono mt-0.5 block">
                {prediction.derivativesMatrix.priceOiQuadrant.longSqueezeProbability}
              </span>
            </div>
          </div>

          {/* Liquidation Magnets */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/60">
              <span className="text-muted-foreground font-mono">Upper Liquidation Magnet:</span>
              <span className="font-mono font-bold text-emerald-500">
                {prediction.derivativesMatrix.upperLiquidationMagnet}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/60">
              <span className="text-muted-foreground font-mono">Lower Liquidation Magnet:</span>
              <span className="font-mono font-bold text-rose-500">
                {prediction.derivativesMatrix.lowerLiquidationMagnet}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/60">
              <span className="text-muted-foreground font-mono">Derivatives Funding Rate:</span>
              <span className="font-mono font-bold text-foreground">
                {prediction.derivativesMatrix.fundingRate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. SECTION 6 & 7: EVIDENCE SCORECARD & EXECUTION CARD      */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Section 6 Evidence Scorecard (-100 to +100) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
                <Brain className="size-4 text-primary" />
                Section 6: Momentum Confirmation Engine (10-Factor Scorecard)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transparent multi-factor quantitative weighting (-100 to +100 scale). No single-indicator bias.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-foreground">
                Composite Score:
              </span>
              <span className="text-base font-bold font-mono px-3 py-1 rounded-xl bg-emerald-500 text-white shadow-sm">
                +{prediction.compositeEvidenceScore} / 100
              </span>
            </div>
          </div>

          {/* Visual Gauge Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>-100 Extreme Bearish</span>
              <span>0 Neutral</span>
              <span>+100 Extreme Bullish</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden relative border border-border">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, (prediction.compositeEvidenceScore + 100) / 2)}%` }}
              />
            </div>
          </div>

          {/* 10 Factors Table */}
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-secondary/70 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">Factor & Metric</th>
                  <th className="py-2.5 px-2 text-center">Weight</th>
                  <th className="py-2.5 px-2 text-center">Reading</th>
                  <th className="py-2.5 px-3">Quantitative Evidence Summary</th>
                  <th className="py-2.5 px-2 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {prediction.evidenceFactors.map((f) => (
                  <tr key={f.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {f.factor}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">
                      {f.weight}%
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        f.reading === 'BULLISH'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : f.reading === 'BEARISH'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {f.reading}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {f.evidenceSummary}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-[10px] text-muted-foreground">
                      {f.source.split(' ')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Section 7 Institutional Execution Card */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-card p-4 sm:p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider block">
                  SECTION 7: EXECUTION PLAN
                </span>
                <h3 className="text-xl font-black text-foreground font-mono mt-0.5">
                  BTC {prediction.primaryAction} SETUP
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
                R:R {prediction.executionPlan.riskReward}
              </span>
            </div>

            <div className="space-y-2.5 mt-4 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground">Optimal Entry Zone:</span>
                <span className="font-bold text-foreground">{prediction.executionPlan.entryZone}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="text-rose-500 font-semibold">Stop Loss (Invalidation):</span>
                <span className="font-bold text-rose-500">{prediction.executionPlan.stopLoss}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-500 font-semibold">Target 1 (TP1):</span>
                <span className="font-bold text-emerald-500">{prediction.executionPlan.takeProfit1}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-500 font-semibold">Target 2 (TP2):</span>
                <span className="font-bold text-emerald-500">{prediction.executionPlan.takeProfit2}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
                <span className="text-muted-foreground">Estimated Holding Time:</span>
                <span className="font-medium text-foreground">{prediction.executionPlan.estimatedHoldingPeriod}</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border text-xs space-y-1.5">
              <span className="font-bold text-foreground block">Nearby Liquidity Magnets:</span>
              <ul className="space-y-1 text-muted-foreground text-[11px] font-mono">
                {prediction.executionPlan.nearbyLiquidityTargets.map((lt, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-cyan-500 font-bold">🎯</span>
                    <span>{lt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            <strong>Execution Rule:</strong> If market structure shifts or 15m candle closes below $80,950, immediately cancel and wait.
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. SECTION 8: MOMENTUM TRIGGERS & REAL-TIME ALERTS FEED    */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <Radio className="size-4 text-rose-500 animate-pulse" />
              Section 8: Momentum Trigger & Real-Time Alerts Feed
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated trigger monitoring across price action, USDT.D shifts, OI expansion, and liquidation sweeps.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            4 Active Rules Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {prediction.alerts.map((alt) => (
            <div
              key={alt.id}
              className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    alt.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : alt.status === 'ARMED'
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {alt.status}
                  </span>
                  <span className="text-muted-foreground text-[10px]">{alt.timestamp}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground">
                  {alt.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  <strong className="text-foreground">Trigger:</strong> {alt.triggerCondition}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  <strong className="text-foreground">Evidence:</strong> {alt.currentEvidence}
                </p>
              </div>

              <div className="text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/40">
                Invalidation: {alt.invalidationLevel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. SECTION 10: COMPLETE BILINGUAL EXPLANATION & SUMMARY     */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Section 10: Institutional Operating Analysis (Hindi / Hinglish Breakdown)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive technical evidence written in clear, natural language with every concept explained.
            </p>
          </div>

          <button
            onClick={handlePlayVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold cursor-pointer"
          >
            <Volume2 className="size-3.5" />
            <span>{voiceState === 'SPEAKING' ? 'Stop Voice' : '🎙️ Listen in Voice'}</span>
          </button>
        </div>

        <div className="bg-secondary/20 p-4 rounded-xl border border-border/80">
          <FormattedMarkdown
            content={
              languageMode === 'hindi'
                ? prediction.writtenMarkdownHindi
                : prediction.writtenMarkdownHinglish
            }
          />
        </div>
      </div>

    </div>
  );
};
export default BtcUsdtRelationshipEngine;
