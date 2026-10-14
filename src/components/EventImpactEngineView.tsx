import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, ShieldAlert, Target, Zap, Activity,
  Sliders, Search, RefreshCw, Volume2, VolumeX, Maximize2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, Award,
  Compass, Radio, Flame, CheckCircle2, AlertTriangle, Play,
  Pause, Globe, TrendingUp, TrendingDown, HelpCircle, MessageSquare
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
  const [customVoiceQuestion, setCustomVoiceQuestion] = useState<string>('');

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

  return (
    <div className="space-y-6">
      {/* ── TOP HERO HEADER & EVENT COUNTDOWN ── */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-primary/5 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 border border-rose-500/20">
                <Radio className="h-3.5 w-3.5 animate-pulse text-rose-400" />
                HIGH-IMPACT EVENT ENGINE
              </span>
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">
                3-SCENARIO PROJECTIONS
              </span>
              <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                GOLD & BITCOIN TRANSMISSION
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              Market News & Event Impact Engine
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
              Algorithmic pre-event scenario modeling for CPI, FOMC, NFP, and GDP. Predicts instantaneous transmission to DXY, US 10Y Yields, Bitcoin, and Gold with institutional News Trap alerts.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-background/60 p-2.5 rounded-lg border border-border">
            <span className="text-xs text-muted-foreground font-semibold">AI Voice Dialect:</span>
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
          </div>
        </div>

        {/* Next High Impact Release Countdown Bar */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-xs text-muted-foreground font-bold">NEXT MAJOR MACRO EVENT:</div>
              <div className="text-sm font-black text-foreground">{selectedEvent.name} ({selectedEvent.country})</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-background/80 px-4 py-2 border border-border font-mono font-black text-base text-amber-400">
              {formatCountdown(secondsRemaining)}
            </div>
            <div className="text-xs text-right text-muted-foreground hidden md:block">
              <div>Consensus: <span className="font-bold text-foreground">{selectedEvent.consensusForecast}</span></div>
              <div>Previous: <span className="font-bold text-foreground">{selectedEvent.previousValue}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EVENT SELECTOR TABS ── */}
      <div className="flex flex-wrap items-center gap-2">
        {events.map(ev => (
          <button
            key={ev.id}
            onClick={() => setSelectedEvent(ev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ev.id === selectedEvent.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{ev.name.split('(')[0]}</span>
            <span className="text-[10px] rounded px-1.5 py-0.5 bg-black/20 text-white font-extrabold">
              {ev.importance}
            </span>
          </button>
        ))}
      </div>

      {/* ── 3-SCENARIO ANALYSIS MATRIX ── */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/10 p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-xs font-bold text-primary uppercase tracking-wider">Algorithmic Reaction Engine</div>
            <h2 className="text-lg font-black text-foreground">{selectedEvent.name} — 3-Scenario Blueprint</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedEvent.historicalSurpriseBias}</p>
          </div>

          {/* Scenario Tabs Switcher */}
          <div className="flex rounded-lg bg-background border border-border p-1 gap-1 text-xs">
            <button
              onClick={() => setSelectedScenario('below')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                selectedScenario === 'below'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              1. Below Forecast (Cool)
            </button>
            <button
              onClick={() => setSelectedScenario('inline')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                selectedScenario === 'inline'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              2. In-Line (Consensus)
            </button>
            <button
              onClick={() => setSelectedScenario('above')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                selectedScenario === 'above'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3. Above Forecast (Hot)
            </button>
          </div>
        </div>

        {/* Selected Scenario Condition Banner */}
        <div className="my-4 rounded-lg bg-background/60 p-3 border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary">
              i
            </span>
            <span className="font-bold text-xs text-foreground">{currentOutcome.condition}</span>
          </div>
          <span className="text-[11px] text-primary font-semibold">Institutional Playbook Ready</span>
        </div>

        {/* 5-Asset Projected Direction Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* US Dollar (DXY) */}
          <div className="rounded-xl border border-border bg-background/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">US Dollar (DXY)</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  currentOutcome.outcome.dxy.dir === 'UP'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : currentOutcome.outcome.dxy.dir === 'DOWN'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {currentOutcome.outcome.dxy.dir}
              </span>
            </div>
            <div className="text-lg font-black text-foreground">{currentOutcome.outcome.dxy.pct}</div>
            <p className="text-[11px] text-muted-foreground leading-tight">{currentOutcome.outcome.dxy.note}</p>
          </div>

          {/* US 10Y Yields */}
          <div className="rounded-xl border border-border bg-background/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">10Y Treasury Yield</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  currentOutcome.outcome.yields10Y.dir === 'UP'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : currentOutcome.outcome.yields10Y.dir === 'DOWN'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {currentOutcome.outcome.yields10Y.dir}
              </span>
            </div>
            <div className="text-lg font-black text-foreground">{currentOutcome.outcome.yields10Y.bps}</div>
            <p className="text-[11px] text-muted-foreground leading-tight">{currentOutcome.outcome.yields10Y.note}</p>
          </div>

          {/* Bitcoin (BTC) */}
          <div className="rounded-xl border border-border bg-background/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Bitcoin (BTC/USD)</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  currentOutcome.outcome.bitcoin.dir === 'UP'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : currentOutcome.outcome.bitcoin.dir === 'DOWN'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {currentOutcome.outcome.bitcoin.dir}
              </span>
            </div>
            <div className="text-lg font-black text-foreground">{currentOutcome.outcome.bitcoin.pct}</div>
            <p className="text-[11px] text-muted-foreground leading-tight">{currentOutcome.outcome.bitcoin.note}</p>
          </div>

          {/* Gold (XAU/USD) */}
          <div className="rounded-xl border border-border bg-background/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Spot Gold (XAU/USD)</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  currentOutcome.outcome.gold.dir === 'UP'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : currentOutcome.outcome.gold.dir === 'DOWN'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {currentOutcome.outcome.gold.dir}
              </span>
            </div>
            <div className="text-lg font-black text-foreground">{currentOutcome.outcome.gold.pct}</div>
            <p className="text-[11px] text-muted-foreground leading-tight">{currentOutcome.outcome.gold.note}</p>
          </div>

          {/* Equities (S&P / QQQ) */}
          <div className="rounded-xl border border-border bg-background/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">US Equities (QQQ/SPY)</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  currentOutcome.outcome.equities.dir === 'UP'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : currentOutcome.outcome.equities.dir === 'DOWN'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {currentOutcome.outcome.equities.dir}
              </span>
            </div>
            <div className="text-lg font-black text-foreground">{currentOutcome.outcome.equities.pct}</div>
            <p className="text-[11px] text-muted-foreground leading-tight">{currentOutcome.outcome.equities.note}</p>
          </div>
        </div>

        {/* Institutional Playbook Footer */}
        <div className="mt-4 pt-3 border-t border-border flex items-start gap-2.5 bg-background/40 p-3 rounded-lg">
          <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-foreground">Execution Protocol: </span>
            <span className="text-muted-foreground">{currentOutcome.outcome.institutionalPlaybook}</span>
          </div>
        </div>
      </div>

      {/* ── DEDICATED GOLD & BITCOIN TRANSMISSION PANELS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gold Transmission Model */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-black">
                G
              </span>
              Gold (XAU/USD) Macro Transmission
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {selectedEvent.goldTransmission.directionalBias}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedEvent.goldTransmission.realYieldDriver}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
            <div className="rounded bg-background p-2 border border-border">
              <div className="text-[10px] text-muted-foreground">Expected Range:</div>
              <div className="font-mono font-bold text-foreground">
                ${selectedEvent.goldTransmission.expectedRange[0]} – ${selectedEvent.goldTransmission.expectedRange[1]}
              </div>
            </div>
            <div className="rounded bg-background p-2 border border-border">
              <div className="text-[10px] text-muted-foreground">Key Breakout Trigger:</div>
              <div className="font-mono font-bold text-primary">
                ${selectedEvent.goldTransmission.keyTriggerLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Bitcoin Transmission Model */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-black">
                ₿
              </span>
              Bitcoin (BTC/USD) Liquidity Transmission
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {selectedEvent.bitcoinTransmission.directionalBias}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedEvent.bitcoinTransmission.liquidityDriver}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
            <div className="rounded bg-background p-2 border border-border">
              <div className="text-[10px] text-muted-foreground">Expected Range:</div>
              <div className="font-mono font-bold text-foreground">
                ${selectedEvent.bitcoinTransmission.expectedRange[0].toLocaleString()} – ${selectedEvent.bitcoinTransmission.expectedRange[1].toLocaleString()}
              </div>
            </div>
            <div className="rounded bg-background p-2 border border-border">
              <div className="text-[10px] text-muted-foreground">Key Breakout Trigger:</div>
              <div className="font-mono font-bold text-primary">
                ${selectedEvent.bitcoinTransmission.keyTriggerLevel.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEWS TRAP DETECTOR ── */}
      <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-card via-card/90 to-rose-500/5 p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0 mt-1" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider">
                News Trap Detector & Whipsaw Warning
              </h3>
              <span className="rounded bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                {selectedEvent.trapWarning.trapType.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedEvent.trapWarning.mechanism}
            </p>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Safe Execution Protocol: {selectedEvent.trapWarning.safeExecutionWindow}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI VOICE QUERY ASSISTANT (HINDI, HINGLISH, ENGLISH) ── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Voice Macro Assistant (Hindi / Hinglish / English)
            </h2>
            <p className="text-xs text-muted-foreground">
              Ask or select common questions about macro event impacts and listen to real-time audio answers.
            </p>
          </div>
        </div>

        {/* Preset Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VOICE_FAQS.map(faq => (
            <div
              key={faq.id}
              onClick={() => setActiveFaq(faq)}
              className={`rounded-xl border p-3.5 transition-all cursor-pointer space-y-2.5 ${
                faq.id === activeFaq.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-background/50 hover:border-primary/40'
              }`}
            >
              <div className="text-xs font-bold text-foreground">
                {langMode === 'hindi' ? faq.questionHindi : langMode === 'hinglish' ? faq.questionHinglish : faq.questionEnglish}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">Instant Audio Analysis</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFaq(faq);
                    handleSpeakFaq(faq);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90 cursor-pointer"
                >
                  <Volume2 className="h-3 w-3" />
                  Listen
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Question Audio Answer Box */}
        <div className="rounded-xl bg-background/70 border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Volume2 className="h-4 w-4" />
              AI Voice Answer ({langMode.toUpperCase()}):
            </span>
            <button
              onClick={() => handleSpeakFaq(activeFaq)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isSpeaking ? 'Stop Audio' : 'Play Voice Answer'}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-card p-3 rounded-lg border border-border/60">
            {langMode === 'hindi' ? activeFaq.answerHindi : langMode === 'hinglish' ? activeFaq.answerHinglish : activeFaq.answerEnglish}
          </p>
        </div>
      </div>
    </div>
  );
}
