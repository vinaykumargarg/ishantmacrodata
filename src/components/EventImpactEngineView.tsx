import React, { useState, useEffect } from 'react';
import {
  Clock, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, AlertTriangle, Play,
  Pause, Globe, TrendingUp, TrendingDown, HelpCircle, MessageSquare, BookOpen, Cpu
} from 'lucide-react';
import {
  MacroEventData,
  VoiceQueryFaq,
  eventImpactService,
  MACRO_EVENTS_REGISTRY,
  VOICE_FAQS
} from '../services/eventImpactEngine';
import { voiceService } from '../services/voiceSynthesisService';

interface Props {
  onNavigate?: (tabId: string) => void;
}

export default function EventImpactEngineView({ onNavigate }: Props) {
  const [events, setEvents] = useState<MacroEventData[]>(MACRO_EVENTS_REGISTRY);
  const [selectedEvent, setSelectedEvent] = useState<MacroEventData>(MACRO_EVENTS_REGISTRY[0]);
  const [selectedScenario, setSelectedScenario] = useState<'below' | 'inline' | 'above'>('below');
  const [langMode, setLangMode] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [activeFaq, setActiveFaq] = useState<VoiceQueryFaq>(VOICE_FAQS[0]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Countdown timer simulation
  const [secondsRemaining, setSecondsRemaining] = useState<number>(selectedEvent.countdownSeconds);

  useEffect(() => {
    setSecondsRemaining(selectedEvent.countdownSeconds);
  }, [selectedEvent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleSpeakFaq = (faq: VoiceQueryFaq) => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    let speech = '';
    if (langMode === 'hindi') speech = faq.answerHindi;
    else if (langMode === 'hinglish') speech = faq.answerHinglish;
    else speech = faq.answerEnglish;

    setIsSpeaking(true);
    voiceService.speak(speech, {
      langMode,
      onEnd: () => setIsSpeaking(false)
    });
  };

  const currentOutcome =
    selectedScenario === 'below'
      ? selectedEvent.scenarios.belowForecast
      : selectedScenario === 'inline'
      ? selectedEvent.scenarios.inLine
      : selectedEvent.scenarios.aboveForecast;

  const currentBtcForecast = currentOutcome.outcome.btcForecast;
  const currentGoldForecast = currentOutcome.outcome.goldForecast;

  return (
    <div className="space-y-6">
      {/* ── TOP HERO HEADER & EVENT COUNTDOWN ── */}
      <div className="card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg font-black text-2xl shrink-0">
              🌍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-heading text-text">
                  GLOBAL MACRO // EVENT IMPACT & NEWS ENGINE
                </h1>
              </div>
              <div className="label text-text-muted font-bold mt-1">
                INSTITUTIONAL TRANSMISSION • BITCOIN & GOLD MOMENTUM RADAR
              </div>
            </div>
          </div>

          {/* Telemetry Chips & Voice Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-down/30 bg-down-bg px-3 py-1.5 label font-bold text-down">
              <span className="h-2 w-2 rounded-full bg-down animate-pulse" />
              HIGH-IMPACT VOLATILITY ENGINE
            </div>

            {/* Language Selector */}
            <div className="flex items-center rounded-full bg-surface-2 border border-border p-1 text-xs">
              <button
                onClick={() => setLangMode('hinglish')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  langMode === 'hinglish' ? 'btn-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLangMode('hindi')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  langMode === 'hindi' ? 'btn-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLangMode('english')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  langMode === 'english' ? 'btn-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEXT HIGH IMPACT RELEASE COUNTDOWN BANNER ── */}
      <div className="regime-banner-neon p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="badge-wait flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            NEXT UPCOMING EVENT
          </div>
          <div>
            <h3 className="text-base font-bold text-text">
              {selectedEvent.name} ({selectedEvent.country})
            </h3>
            <p className="text-sm text-text-muted mt-0.5">
              Release: {selectedEvent.releaseDate} • Bias: {selectedEvent.historicalSurpriseBias}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-right">
          <div className="card px-4 py-2 border border-gold/40 font-mono font-bold text-lg text-gold num">
            {formatCountdown(secondsRemaining)}
          </div>
          <div className="hidden md:block border-l border-border pl-4">
            <div className="label text-text-muted">Consensus Forecast</div>
            <div className="text-sm font-mono font-bold text-accent mt-0.5 num">
              {selectedEvent.consensusForecast}
            </div>
          </div>
          <div className="hidden lg:block border-l border-border pl-4">
            <div className="label text-text-muted">Previous Print</div>
            <div className="text-sm font-mono font-bold text-text mt-0.5 num">
              {selectedEvent.previousValue}
            </div>
          </div>
        </div>
      </div>

      {/* ── EVENT SELECTOR TABS ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {events.map(ev => (
          <button
            key={ev.id}
            onClick={() => setSelectedEvent(ev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              ev.id === selectedEvent.id
                ? 'btn-primary'
                : 'card hover:bg-surface-2 text-text-muted hover:text-text'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{ev.name.split('(')[0]}</span>
            <span className="label rounded px-2 py-0.5 bg-surface-2 text-text font-bold">
              {ev.importance}
            </span>
          </button>
        ))}
      </div>

      {/* ── EDUCATIONAL & FUNDAMENTAL PURPOSE: YEH EVENT KYA HAI AUR KYON AATA HAI? ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: What is this event? */}
        <div className="card p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-accent">
            <BookOpen className="h-5 w-5" />
            <h3 className="text-base font-bold text-text">
              1. Yeh Event Kya Hai? (What is it?)
            </h3>
          </div>
          <p className={`text-sm text-text leading-relaxed ${langMode === 'hindi' ? 'font-hi' : ''}`}>
            {langMode === 'hindi'
              ? selectedEvent.whatIsEvent.hindi
              : langMode === 'hinglish'
              ? selectedEvent.whatIsEvent.hinglish
              : selectedEvent.whatIsEvent.english}
          </p>
        </div>

        {/* Card 2: Why does it exist and matter? */}
        <div className="card p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-gold">
            <Cpu className="h-5 w-5" />
            <h3 className="text-base font-bold text-text">
              2. Yeh Kyon Aati Hai? (Why it Matters)
            </h3>
          </div>
          <p className={`text-sm text-text leading-relaxed ${langMode === 'hindi' ? 'font-hi' : ''}`}>
            {langMode === 'hindi'
              ? selectedEvent.whyItExists.hindi
              : langMode === 'hinglish'
              ? selectedEvent.whyItExists.hinglish
              : selectedEvent.whyItExists.english}
          </p>
        </div>

        {/* Card 3: Market Reaction Mechanism */}
        <div className="card p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-up">
            <Activity className="h-5 w-5" />
            <h3 className="text-base font-bold text-text">
              3. Market Reaction Chain (Kampan Ka Karan)
            </h3>
          </div>
          <p className={`text-sm text-text leading-relaxed ${langMode === 'hindi' ? 'font-hi' : ''}`}>
            {langMode === 'hindi'
              ? selectedEvent.marketReactionMechanism.hindi
              : langMode === 'hinglish'
              ? selectedEvent.marketReactionMechanism.hinglish
              : selectedEvent.marketReactionMechanism.english}
          </p>
        </div>
      </div>

      {/* ── 3-SCENARIO ANALYSIS MATRIX ── */}
      <div className="card p-6 space-y-5 border-2 border-accent/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="label text-accent font-bold">Algorithmic Confluence Engine</div>
            <h2 className="text-xl font-bold tracking-heading text-text">
              {selectedEvent.name} — 3-Scenario Projection
            </h2>
            <p className="text-sm text-text-muted mt-1">{selectedEvent.historicalSurpriseBias}</p>
          </div>

          {/* Scenario Tabs Switcher */}
          <div className="flex rounded-xl bg-surface-2 border border-border p-1 gap-1 text-xs">
            <button
              onClick={() => setSelectedScenario('below')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                selectedScenario === 'below'
                  ? 'bg-up text-accent-fg'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              1. Below Forecast (Cool / Disinflation)
            </button>
            <button
              onClick={() => setSelectedScenario('inline')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                selectedScenario === 'inline'
                  ? 'bg-gold text-accent-fg'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              2. In-Line (Consensus Baseline)
            </button>
            <button
              onClick={() => setSelectedScenario('above')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                selectedScenario === 'above'
                  ? 'bg-down text-white'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              3. Above Forecast (Hot / Hawkish Shock)
            </button>
          </div>
        </div>

        {/* Selected Scenario Condition Banner */}
        <div className="rounded-xl bg-surface-2 p-3.5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              ℹ
            </span>
            <span className="font-bold text-sm text-text">{currentOutcome.condition}</span>
          </div>
          <span className="label text-accent font-bold">Active Quantitative Blueprint</span>
        </div>

        {/* 5-Asset Projected Direction Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* US Dollar (DXY) */}
          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">US Dollar (DXY)</span>
              <span
                className={`label font-bold px-2 py-0.5 rounded ${
                  currentOutcome.outcome.dxy.dir === 'UP'
                    ? 'bg-up-bg text-up'
                    : currentOutcome.outcome.dxy.dir === 'DOWN'
                    ? 'bg-down-bg text-down'
                    : 'bg-gold/15 text-gold'
                }`}
              >
                {currentOutcome.outcome.dxy.dir}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text num">{currentOutcome.outcome.dxy.pct}</div>
            <p className="text-xs text-text-muted leading-relaxed">{currentOutcome.outcome.dxy.note}</p>
          </div>

          {/* US 10Y Yields */}
          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">10Y Treasury Yield</span>
              <span
                className={`label font-bold px-2 py-0.5 rounded ${
                  currentOutcome.outcome.yields10Y.dir === 'UP'
                    ? 'bg-up-bg text-up'
                    : currentOutcome.outcome.yields10Y.dir === 'DOWN'
                    ? 'bg-down-bg text-down'
                    : 'bg-gold/15 text-gold'
                }`}
              >
                {currentOutcome.outcome.yields10Y.dir}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text num">{currentOutcome.outcome.yields10Y.bps}</div>
            <p className="text-xs text-text-muted leading-relaxed">{currentOutcome.outcome.yields10Y.note}</p>
          </div>

          {/* Bitcoin (BTC) */}
          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">Bitcoin (BTC/USD)</span>
              <span
                className={`label font-bold px-2 py-0.5 rounded ${
                  currentOutcome.outcome.bitcoin.dir === 'UP'
                    ? 'bg-up-bg text-up'
                    : currentOutcome.outcome.bitcoin.dir === 'DOWN'
                    ? 'bg-down-bg text-down'
                    : 'bg-gold/15 text-gold'
                }`}
              >
                {currentOutcome.outcome.bitcoin.dir}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text num">{currentOutcome.outcome.bitcoin.pct}</div>
            <p className="text-xs text-text-muted leading-relaxed">{currentOutcome.outcome.bitcoin.note}</p>
          </div>

          {/* Gold (XAU/USD) */}
          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">Spot Gold (XAU/USD)</span>
              <span
                className={`label font-bold px-2 py-0.5 rounded ${
                  currentOutcome.outcome.gold.dir === 'UP'
                    ? 'bg-up-bg text-up'
                    : currentOutcome.outcome.gold.dir === 'DOWN'
                    ? 'bg-down-bg text-down'
                    : 'bg-gold/15 text-gold'
                }`}
              >
                {currentOutcome.outcome.gold.dir}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text num">{currentOutcome.outcome.gold.pct}</div>
            <p className="text-xs text-text-muted leading-relaxed">{currentOutcome.outcome.gold.note}</p>
          </div>

          {/* Equities (S&P / QQQ) */}
          <div className="card p-4 space-y-2 bg-surface-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">US Equities (QQQ/SPY)</span>
              <span
                className={`label font-bold px-2 py-0.5 rounded ${
                  currentOutcome.outcome.equities.dir === 'UP'
                    ? 'bg-up-bg text-up'
                    : currentOutcome.outcome.equities.dir === 'DOWN'
                    ? 'bg-down-bg text-down'
                    : 'bg-gold/15 text-gold'
                }`}
              >
                {currentOutcome.outcome.equities.dir}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text num">{currentOutcome.outcome.equities.pct}</div>
            <p className="text-xs text-text-muted leading-relaxed">{currentOutcome.outcome.equities.note}</p>
          </div>
        </div>

        {/* Institutional Playbook Banner */}
        <div className="p-4 rounded-xl bg-surface-2 border border-border flex items-start gap-3">
          <Target className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-text">Institutional Execution Playbook: </span>
            <span className="text-text-muted">{currentOutcome.outcome.institutionalPlaybook}</span>
          </div>
        </div>
      </div>

      {/* ── DEDICATED BITCOIN & GOLD MOMENTUM RADAR (CORE USER REQUIREMENT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BITCOIN (BTC/USD) DEEP MOMENTUM RADAR */}
        <div className="card p-6 space-y-4 border-2 border-accent/40">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent text-accent-fg flex items-center justify-center font-bold text-xl">
                ₿
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">Bitcoin (BTC/USD) Momentum Forecast</h3>
                <div className="label text-text-muted">Scenario: {currentOutcome.condition.split('(')[0]}</div>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentBtcForecast.direction === 'BULLISH_PUMP'
                  ? 'bg-up-bg text-up border border-up'
                  : currentBtcForecast.direction === 'BEARISH_DUMP'
                  ? 'bg-down-bg text-down border border-down'
                  : 'bg-gold/15 text-gold border border-gold'
              }`}
            >
              {currentBtcForecast.direction.replace('_', ' ')}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="plan-item">
              <div className="plan-item-label">Expected Momentum Move</div>
              <div className="plan-item-val text-accent text-base">{currentBtcForecast.expectedMove}</div>
            </div>
            <div className="plan-item">
              <div className="plan-item-label">Target Range (Post-News)</div>
              <div className="plan-item-val text-text text-base">{currentBtcForecast.targetRange}</div>
            </div>
            <div className="plan-item">
              <div className="plan-item-label">Key Support / Pivot</div>
              <div className="plan-item-val text-gold text-base">{currentBtcForecast.keyPivot}</div>
            </div>
            <div className="plan-item">
              <div className="plan-item-label">Setup Invalidation Level</div>
              <div className="plan-item-val text-down text-base">{currentBtcForecast.invalidation}</div>
            </div>
          </div>

          {/* Transmission Catalyst Explanation */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-sm">
            <div className="label text-accent font-bold mb-1">Market Catalyst & Liquidity Transmission:</div>
            <p className="text-text-muted leading-relaxed">{currentBtcForecast.catalystExplanation}</p>
          </div>
        </div>

        {/* SPOT GOLD (XAU/USD) DEEP MOMENTUM RADAR */}
        <div className="card p-6 space-y-4 border-2 border-gold/40">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gold text-accent-fg flex items-center justify-center font-bold text-xl">
                🥇
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">Spot Gold (XAU/USD) Momentum Forecast</h3>
                <div className="label text-text-muted">Scenario: {currentOutcome.condition.split('(')[0]}</div>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentGoldForecast.direction === 'BULLISH_SURGE'
                  ? 'bg-up-bg text-up border border-up'
                  : currentGoldForecast.direction === 'BEARISH_DROP'
                  ? 'bg-down-bg text-down border border-down'
                  : 'bg-gold/15 text-gold border border-gold'
              }`}
            >
              {currentGoldForecast.direction.replace('_', ' ')}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="plan-item">
              <div className="plan-item-label">Expected Momentum Move</div>
              <div className="plan-item-val text-gold text-base">{currentGoldForecast.expectedMove}</div>
            </div>
            <div className="plan-item">
              <div className="plan-item-label">Target Range (Post-News)</div>
              <div className="plan-item-val text-text text-base">{currentGoldForecast.targetRange}</div>
            </div>
            <div className="plan-item">
              <div className="plan-item-label">Key Support / Pivot</div>
              <div className="plan-item-val text-accent text-base">{currentGoldForecast.keyPivot}</div>
            </div>
            <div className="plan-item">
              <div className="plan-item-label">Setup Invalidation Level</div>
              <div className="plan-item-val text-down text-base">{currentGoldForecast.invalidation}</div>
            </div>
          </div>

          {/* Transmission Catalyst Explanation */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-sm">
            <div className="label text-gold font-bold mb-1">Real Yield Transmission & Bullion Inflows:</div>
            <p className="text-text-muted leading-relaxed">{currentGoldForecast.catalystExplanation}</p>
          </div>
        </div>
      </div>

      {/* ── NEWS TRAP WARNING & 15-MINUTE EXECUTION RULE ── */}
      <div className="invalidation-box flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-down shrink-0" />
          <div>
            <h4 className="text-base font-bold text-down">
              Institutional Trap Warning: {selectedEvent.trapWarning.trapType.replace(/_/g, ' ')}
            </h4>
            <p className="text-sm text-text-muted mt-1">{selectedEvent.trapWarning.mechanism}</p>
          </div>
        </div>

        <div className="shrink-0 bg-surface px-4 py-2 rounded-xl border border-border text-center">
          <div className="label text-text-muted">Execution Window</div>
          <div className="text-sm font-bold text-accent mt-0.5">{selectedEvent.trapWarning.safeExecutionWindow}</div>
        </div>
      </div>

      {/* ── AI VOICE QUERY & AUDIO ASSISTANT (HINDI / HINGLISH / ENGLISH) ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent text-accent-fg flex items-center justify-center font-bold text-xl">
              🎙️
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">AI Macro Audio Assistant (Hindi / Hinglish / English)</h3>
              <p className="text-sm text-text-muted">Ask questions about market impact and receive instant spoken institutional briefings.</p>
            </div>
          </div>

          <div className="label text-text-muted font-bold">Voice Synthesis Active</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {VOICE_FAQS.map(faq => (
            <div
              key={faq.id}
              onClick={() => {
                setActiveFaq(faq);
                handleSpeakFaq(faq);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeFaq.id === faq.id
                  ? 'border-accent bg-surface-2 shadow-lg shadow-accent/10'
                  : 'border-border bg-surface hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="label text-accent font-bold">Question {faq.id.toUpperCase()}</span>
                <button className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-fg">
                  {isSpeaking && activeFaq.id === faq.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </button>
              </div>

              <h4 className="text-sm font-bold text-text mb-2">
                {langMode === 'hindi'
                  ? faq.questionHindi
                  : langMode === 'hinglish'
                  ? faq.questionHinglish
                  : faq.questionEnglish}
              </h4>

              <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                {langMode === 'hindi'
                  ? faq.answerHindi
                  : langMode === 'hinglish'
                  ? faq.answerHinglish
                  : faq.answerEnglish}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
