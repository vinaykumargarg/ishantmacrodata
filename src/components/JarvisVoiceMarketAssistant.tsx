import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, Send, Play, Pause,
  Square, RotateCcw, TrendingUp, TrendingDown, Shield, Brain,
  Activity, ArrowUpRight, ArrowDownRight, Layers, ExternalLink,
  Copy, Check, RefreshCw, BarChart2, Radio, Info, ChevronRight,
  Zap, Compass, Target, HelpCircle, Globe, Calendar, Terminal,
  Settings, Key, X, CheckCircle2, Sliders, PlayCircle, Loader2
} from 'lucide-react';
import {
  generateJarvisResponse,
  INITIAL_MARKET_SNAPSHOTS,
  GLOBAL_MACRO_CORRELATION,
  USD_TO_INR_RATE,
  MarketAssetSnapshot,
  JarvisResponsePayload
} from '../services/marketVoiceIntelligenceEngine';
import {
  voiceService,
  VoiceState,
  FormattedVoiceOption,
  DEEEPR_NEURAL_VOICES,
  NeuralVoicePreset
} from '../services/voiceSynthesisService';
import TradingViewWidget from './TradingViewWidget';
import { FormattedMarkdown } from './FormattedMarkdown';

interface ChatEntry {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  payload?: JarvisResponsePayload;
  timestamp: string;
}

export const JarvisVoiceMarketAssistant: React.FC = () => {
  // Voice & Interaction State
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [responseMode, setResponseMode] = useState<'QUICK' | 'DEEP_RESEARCH' | 'TRADING'>('DEEP_RESEARCH');
  const [language, setLanguage] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.82);
  const [availableVoices, setAvailableVoices] = useState<FormattedVoiceOption[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(
    voiceService.settings.selectedVoiceName || ''
  );
  const [micTranscript, setMicTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deeepr.ai & ElevenLabs Neural Voice State
  const [isNeuralModalOpen, setIsNeuralModalOpen] = useState<boolean>(false);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>(
    voiceService.getElevenLabsApiKey() || ''
  );
  const [selectedNeuralVoiceId, setSelectedNeuralVoiceId] = useState<string>(
    voiceService.settings.selectedNeuralVoiceId || 'FZkK3TvQ0pjyDmT8fzIW'
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState<boolean>(false);
  const [playingPresetId, setPlayingPresetId] = useState<string | null>(null);
  const [useNeuralEngine, setUseNeuralEngine] = useState<boolean>(
    voiceService.settings.useNeuralEngine
  );

  // Active Asset & Terminal Tabs
  const [activeAssetKey, setActiveAssetKey] = useState<string>('BTC');
  const [rightPanelTab, setRightPanelTab] = useState<'decision' | 'chart' | 'orderflow' | 'macro'>('decision');

  // Real-time Market Snapshots
  const [marketSnapshots, setMarketSnapshots] = useState<Record<string, MarketAssetSnapshot>>(INITIAL_MARKET_SNAPSHOTS);
  const [lastWsUpdate, setLastWsUpdate] = useState<string>(new Date().toLocaleTimeString());

  // Conversation History
  const [conversation, setConversation] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      sender: 'jarvis',
      text: `### 🤖 JARVIS Universal Market Voice Expert Initialized
Welcome! I am your AI Market Copilot with direct feeds connected to **Bitcoin, Ethereum, Solana, Gold (XAUUSD), DXY, and USDT Dominance**.

You can click the microphone to speak naturally in **Hinglish, English, or Hindi**, or type any question below.

#### 🎙️ Recommended Quick Queries:
- "All market ka analysis karo"
- "Bitcoin mein LONG, SHORT ya WAIT?"
- "Gold ka XAUUSD analysis DXY ke saath karo"
- "BTC, ETH aur SOL mein abhi kaunsa setup better hai?"`,
      payload: generateJarvisResponse('All market ka analysis karo', 'QUICK', 'hinglish'),
      timestamp: 'Just now'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isThinking]);

  // Subscribe to Voice Service State (Listening / Speaking / Idle)
  useEffect(() => {
    const unsub = voiceService.subscribeState((st) => {
      setVoiceState(st);
    });
    return () => unsub();
  }, []);

  // Subscribe to Available Voices
  useEffect(() => {
    const unsubVoices = voiceService.subscribeVoices((voices) => {
      setAvailableVoices(voices);
      if (!selectedVoiceName) {
        const best = voiceService.pickBestVoice(language);
        if (best) {
          setSelectedVoiceName(best.name);
          voiceService.setSelectedVoice(best.name);
        }
      }
    });
    return () => unsubVoices();
  }, [language, selectedVoiceName]);

  // When language preference switches, auto-select optimal voice
  useEffect(() => {
    const best = voiceService.pickBestVoice(language);
    if (best) {
      setSelectedVoiceName(best.name);
      voiceService.setSelectedVoice(best.name);
    }
  }, [language]);

  // Connect Real-Time Binance WebSocket for live BTC, ETH, SOL price updates
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const rawPrice = parseFloat(data.c);
          const changePct = parseFloat(data.P);
          const high = parseFloat(data.h);
          const low = parseFloat(data.l);

          const symMap: Record<string, string> = {
            BTCUSDT: 'BTC',
            ETHUSDT: 'ETH',
            SOLUSDT: 'SOL'
          };
          const targetKey = symMap[data.s];

          if (targetKey) {
            setMarketSnapshots((prev) => {
              const current = prev[targetKey];
              if (!current) return prev;
              const formattedPrice = rawPrice > 1000
                ? `$${rawPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : `$${rawPrice.toFixed(2)}`;
              
              const inrValue = (rawPrice * USD_TO_INR_RATE);
              const formattedInr = inrValue > 100000 
                ? `₹${(inrValue / 100000).toFixed(2)} L` 
                : `₹${inrValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

              return {
                ...prev,
                [targetKey]: {
                  ...current,
                  price: rawPrice,
                  formattedPrice,
                  priceInr: formattedInr,
                  change24h: parseFloat(changePct.toFixed(2)),
                  high24h: high,
                  low24h: low,
                  lastUpdated: new Date().toLocaleTimeString()
                }
              };
            });
            setLastWsUpdate(new Date().toLocaleTimeString());
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Active Asset Snapshot
  const activeAsset = useMemo(() => {
    return marketSnapshots[activeAssetKey] || marketSnapshots['BTC'];
  }, [marketSnapshots, activeAssetKey]);

  // Handle Query Submission (Voice or Text)
  const handleProcessQuery = useCallback((queryToRun: string) => {
    if (!queryToRun.trim()) return;

    // Interrupt any ongoing speech
    voiceService.stopSpeaking();

    const userEntry: ChatEntry = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryToRun.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversation((prev) => [...prev, userEntry]);
    setTextInput('');
    setMicTranscript('');
    setIsThinking(true);

    // Context from previous response
    const lastJarvisEntry = [...conversation].reverse().find(c => c.sender === 'jarvis');
    const prevContext = {
      asset: activeAssetKey,
      lastResponse: lastJarvisEntry?.text
    };

    // Synthesize response using Jarvis Market Intelligence Engine
    setTimeout(() => {
      const responsePayload = generateJarvisResponse(
        queryToRun,
        responseMode,
        language,
        marketSnapshots,
        prevContext
      );

      // If user query mentions a specific asset, switch active tab to it
      if (responsePayload.assetIdentified && marketSnapshots[responsePayload.assetIdentified]) {
        setActiveAssetKey(responsePayload.assetIdentified);
      }

      const jarvisEntry: ChatEntry = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        text: responsePayload.writtenMarkdown,
        payload: responsePayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversation((prev) => [...prev, jarvisEntry]);
      setIsThinking(false);

      // Play spoken AI voice response if not muted
      if (!isMuted && responsePayload.spokenText) {
        voiceService.speak(responsePayload.spokenText, {
          langMode: language
        });
      }
    }, 400);
  }, [conversation, responseMode, language, marketSnapshots, activeAssetKey, isMuted]);

  // Toggle Microphone
  const handleToggleMic = () => {
    if (voiceState === 'LISTENING') {
      voiceService.stopListening();
    } else {
      voiceService.startListening(
        (transcript, isFinal) => {
          setMicTranscript(transcript);
          if (isFinal) {
            handleProcessQuery(transcript);
          }
        },
        (error) => {
          console.warn('Speech Recognition notice:', error);
        },
        language
      );
    }
  };

  // Voice Playback Controls
  const handleStopVoice = () => voiceService.stopSpeaking();
  const handlePauseVoice = () => voiceService.pauseSpeaking();
  const handleResumeVoice = () => voiceService.resumeSpeaking();
  const handleReplayVoice = (textToReplay?: string) => {
    if (textToReplay) {
      voiceService.speak(textToReplay, { langMode: language });
    } else {
      voiceService.replayLast(language);
    }
  };

  const handleToggleMute = () => {
    const muted = voiceService.toggleMute();
    setIsMuted(muted);
  };

  const handleChangeVoice = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    voiceService.setSelectedVoice(voiceName);
    const matchedNeural = DEEEPR_NEURAL_VOICES.find(v => v.id === voiceName || v.name === voiceName);
    if (matchedNeural) {
      setSelectedNeuralVoiceId(matchedNeural.id);
      setUseNeuralEngine(true);
    }
  };

  const handleSaveApiKey = (key: string) => {
    voiceService.setElevenLabsApiKey(key);
    setElevenLabsApiKey(key);
    setKeySaveSuccess(true);
    setTimeout(() => setKeySaveSuccess(false), 2500);
  };

  const handleSelectNeuralVoice = (voiceId: string) => {
    setSelectedNeuralVoiceId(voiceId);
    voiceService.setSelectedNeuralVoice(voiceId);
    voiceService.setUseNeuralEngine(true);
    setUseNeuralEngine(true);
    setSelectedVoiceName(voiceId);
  };

  const handlePlayPresetSample = async (presetId: string) => {
    setPlayingPresetId(presetId);
    try {
      await voiceService.playPresetSample(presetId);
    } finally {
      setTimeout(() => setPlayingPresetId(null), 3500);
    }
  };

  const handleToggleNeuralEngine = () => {
    const nextVal = !useNeuralEngine;
    setUseNeuralEngine(nextVal);
    voiceService.setUseNeuralEngine(nextVal);
  };

  const handleTestVoice = () => {
    voiceService.testVoice(language);
  };

  const handleChangeSpeed = (newRate: number) => {
    setSpeechRate(newRate);
    voiceService.setRate(newRate);
  };

  const handleCopyMarkdown = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    voiceService.stopSpeaking();
    setConversation([
      {
        id: 'new-session',
        sender: 'jarvis',
        text: `### 🔄 Session Cleared
I am ready for your next market research question. Ask me anything about **BTC, ETH, SOL, Gold (XAUUSD), DXY, or USDT Dominance**!`,
        payload: generateJarvisResponse('All market ka analysis karo', 'QUICK', language),
        timestamp: 'Just now'
      }
    ]);
  };

  // Sample Quick Prompt Chips
  const sampleVoicePrompts = [
    { label: 'All Market 6-Asset Report 🌐', query: 'All market ka analysis karo' },
    { label: 'Bitcoin LONG ya SHORT? ₿', query: 'Bitcoin mein LONG, SHORT ya WAIT setup do' },
    { label: 'Gold vs DXY Macro Impact 🥇', query: 'Gold ka XAUUSD analysis DXY ke saath karo' },
    { label: 'BTC, ETH & SOL Setup Ranking ⚡', query: 'BTC, ETH aur SOL mein abhi kaunsa setup better hai?' },
    { label: 'Liquidation Magnets & Clusters 🔥', query: 'Bitcoin ke liquidation levels aur order blocks batao' },
    { label: 'USDT Dominance Impact 💧', query: 'DXY aur USDT Dominance ka BTC par kya impact hai?' },
    { label: 'Explain SMC (BOS vs CHoCH) 🧠', query: 'Explain BOS aur CHoCH in simple Hinglish' }
  ];

  // Visualizer animated bars
  const visualizerBars = Array.from({ length: 32 }, (_, i) => i);

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto pb-12 font-sans text-foreground">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. TOP PREMIUM CONTROL BAR                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Status */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className={`size-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-md ${
                voiceState === 'SPEAKING'
                  ? 'bg-cyan-500 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/20 animate-pulse'
                  : voiceState === 'LISTENING'
                  ? 'bg-rose-500 text-white shadow-rose-500/40 ring-4 ring-rose-500/20 animate-bounce'
                  : voiceState === 'THINKING'
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 animate-spin'
                  : 'bg-primary/10 text-primary border border-primary/30'
              }`}>
                {voiceState === 'LISTENING' ? <Mic className="size-6 text-white" /> : '🎙️'}
              </div>
              <span className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-card ${
                voiceState === 'LISTENING' ? 'bg-rose-500 animate-ping' :
                voiceState === 'SPEAKING' ? 'bg-cyan-400' :
                voiceState === 'THINKING' ? 'bg-indigo-500' : 'bg-emerald-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
                  JARVIS AI Market Voice Assistant
                </h1>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  INSTITUTIONAL QUANT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Universal Voice Intelligence for <strong className="text-foreground">BTC, ETH, SOL, Gold, DXY & USDT.D</strong> with real-time calculations.
              </p>
            </div>
          </div>

          {/* Mode, Language & Audio Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Deeepr.ai Reel Voice Studio Pill */}
            <button
              onClick={() => setIsNeuralModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs shadow-sm shadow-cyan-500/10 transition-all cursor-pointer"
              title="Deeepr.ai & Instagram Reel Voice Studio"
            >
              <Sparkles className="size-3.5 text-cyan-400 animate-spin" />
              <span>✨ Deeepr.ai Reel Voice</span>
              <span className={`size-2 rounded-full ${elevenLabsApiKey ? 'bg-emerald-400' : 'bg-cyan-400'} animate-pulse ml-0.5`} />
            </button>

            {/* Mode Selector */}
            <div className="flex items-center rounded-xl border border-border bg-secondary/60 p-1 text-xs font-medium">
              <button
                onClick={() => setResponseMode('QUICK')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  responseMode === 'QUICK'
                    ? 'bg-card text-foreground font-bold shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ⚡ Quick
              </button>
              <button
                onClick={() => setResponseMode('DEEP_RESEARCH')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  responseMode === 'DEEP_RESEARCH'
                    ? 'bg-card text-foreground font-bold shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🔬 Deep Research
              </button>
              <button
                onClick={() => setResponseMode('TRADING')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  responseMode === 'TRADING'
                    ? 'bg-card text-foreground font-bold shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🎯 Trading Setup
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center rounded-xl border border-border bg-secondary/60 p-1 text-xs font-medium">
              <button
                onClick={() => setLanguage('hinglish')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === 'hinglish' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🇮🇳 Hinglish
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === 'english' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🌐 English
              </button>
              <button
                onClick={() => setLanguage('hindi')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === 'hindi' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300 font-bold border border-orange-500/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Voice Audio Controls */}
            <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-xl p-1">
              <button
                onClick={handleToggleMute}
                className={`p-2 rounded-lg hover:bg-card text-xs transition-colors cursor-pointer ${
                  isMuted ? 'text-rose-500' : 'text-primary'
                }`}
                title={isMuted ? 'Voice Muted (Click to Unmute)' : 'Voice Enabled (Click to Mute)'}
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>

              {voiceState === 'SPEAKING' && (
                <>
                  <button
                    onClick={handlePauseVoice}
                    className="p-2 rounded-lg hover:bg-card text-xs text-amber-500 cursor-pointer"
                    title="Pause Voice"
                  >
                    <Pause className="size-4" />
                  </button>
                  <button
                    onClick={handleStopVoice}
                    className="p-2 rounded-lg hover:bg-card text-xs text-rose-500 cursor-pointer"
                    title="Interrupt Voice"
                  >
                    <Square className="size-4" />
                  </button>
                </>
              )}

              {voiceState === 'PAUSED' && (
                <button
                  onClick={handleResumeVoice}
                  className="p-2 rounded-lg hover:bg-card text-xs text-emerald-500 cursor-pointer"
                  title="Resume Voice"
                >
                  <Play className="size-4" />
                </button>
              )}

              <button
                onClick={() => handleReplayVoice()}
                className="p-2 rounded-lg hover:bg-card text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Replay Last Answer"
              >
                <RotateCcw className="size-4" />
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 🎙️ JARVIS VOICE PERSONA, PACING & AUDIO CLARITY TUNING BAR  */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-md p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Radio className="size-4 text-cyan-500 animate-pulse" />
              <span>Aawaz / Voice Persona:</span>
            </div>

            <select
              value={selectedVoiceName}
              onChange={(e) => handleChangeVoice(e.target.value)}
              className="bg-secondary text-foreground border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer max-w-[320px] sm:max-w-[380px] truncate"
            >
              {availableVoices.length === 0 && (
                <option value="">Default AI Voice</option>
              )}
              {availableVoices.map((opt) => {
                const val = opt.neuralId || opt.voice?.name || opt.displayName;
                return (
                  <option key={val} value={val}>
                    {opt.displayName}
                  </option>
                );
              })}
            </select>

            <button
              onClick={() => setIsNeuralModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Open Deeepr.ai / ElevenLabs Voice Engine Modal"
            >
              <Sparkles className="size-3.5 text-cyan-400" />
              <span>Deeepr.ai Studio</span>
              <span className={`size-1.5 rounded-full ${elevenLabsApiKey ? 'bg-emerald-400' : 'bg-cyan-400'} animate-ping`} />
            </button>

            <button
              onClick={handleTestVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                voiceState === 'SPEAKING'
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm shadow-cyan-500/20'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
              }`}
              title="Test current voice with sample speech"
            >
              <Volume2 className="size-3.5" />
              <span>{voiceState === 'SPEAKING' ? 'Bol Raha Hai...' : '🔊 Test'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Pacing Speed Presets */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Raftaar (Speed):</span>
              {[
                { rate: 0.78, label: '🐢 0.78x Dhire (Clear)' },
                { rate: 0.85, label: '🎙️ 0.85x Calm' },
                { rate: 1.00, label: '⚡ 1.0x Normal' }
              ].map((btn) => (
                <button
                  key={btn.rate}
                  onClick={() => handleChangeSpeed(btn.rate)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    Math.abs(speechRate - btn.rate) < 0.04
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Volume Status Badge */}
            <div className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
              <span>🔊 Tej (100% Loud & Crisp)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. NEAT & CLEAN 6-ASSET TICKER CARDS                       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(marketSnapshots).map(([key, asset]) => {
          const isSelected = activeAssetKey === key;
          const isPos = asset.change24h >= 0;

          return (
            <button
              key={key}
              onClick={() => {
                setActiveAssetKey(key);
                setRightPanelTab('decision');
              }}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/40'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="text-primary font-mono text-sm">
                    {key === 'BTC' && '₿'}
                    {key === 'ETH' && 'Ξ'}
                    {key === 'SOL' && '◎'}
                    {key === 'GOLD' && '🥇'}
                    {key === 'DXY' && '💵'}
                    {key === 'USDT_D' && '💧'}
                  </span>
                  <span>{asset.symbol}</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  asset.decision === 'LONG' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                  asset.decision === 'SHORT' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                  'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {asset.decision}
                </span>
              </div>

              <div className="text-base font-bold text-foreground font-mono tracking-tight">
                {asset.formattedPrice}
              </div>

              <div className="flex items-center justify-between text-[11px] mt-1.5">
                <span className={`font-mono font-semibold flex items-center gap-0.5 ${
                  isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isPos ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {isPos ? '+' : ''}{asset.change24h}%
                </span>
                {asset.priceInr && (
                  <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[80px]">
                    {asset.priceInr}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. JARVIS INTERACTIVE AUDIO VISUALIZER & PROMPTS HUD       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Glowing Voice Orb */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleMic}
              className={`relative size-16 sm:size-20 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md ${
                voiceState === 'LISTENING'
                  ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105 ring-4 ring-rose-500/30'
                  : voiceState === 'SPEAKING'
                  ? 'bg-cyan-500 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/30 animate-pulse'
                  : 'bg-primary/10 border-2 border-primary/40 text-primary hover:bg-primary/20 hover:scale-105'
              }`}
              title={voiceState === 'LISTENING' ? 'Click to Stop Listening' : 'Click to Speak into Microphone'}
            >
              {voiceState === 'LISTENING' ? (
                <MicOff className="size-7 sm:size-8 animate-pulse text-white" />
              ) : (
                <Mic className="size-7 sm:size-8" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase ${
                  voiceState === 'LISTENING' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse' :
                  voiceState === 'SPEAKING' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 animate-pulse' :
                  voiceState === 'THINKING' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' :
                  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  <span className={`size-2 rounded-full ${
                    voiceState === 'LISTENING' ? 'bg-rose-500 animate-ping' :
                    voiceState === 'SPEAKING' ? 'bg-cyan-400' :
                    voiceState === 'THINKING' ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`} />
                  {voiceState === 'LISTENING' && 'Listening to Voice...'}
                  {voiceState === 'SPEAKING' && 'Jarvis Speaking...'}
                  {voiceState === 'THINKING' && 'Calculating Quant Levels...'}
                  {voiceState === 'IDLE' && 'Jarvis Voice Ready'}
                </span>

                <span className="text-[11px] text-muted-foreground font-mono">
                  Binance Sync: {lastWsUpdate}
                </span>
              </div>

              <p className="text-xs text-foreground font-medium mt-1.5">
                {voiceState === 'LISTENING' && (micTranscript ? `"${micTranscript}"` : 'Speak naturally in Hindi, Hinglish, or English...')}
                {voiceState === 'SPEAKING' && 'Click Stop (⏹️) to interrupt anytime.'}
                {voiceState === 'IDLE' && 'Click the microphone or choose a quick prompt chip below.'}
              </p>
            </div>
          </div>

          {/* Audio Waveform Equalizer */}
          <div className="flex items-center gap-1 h-10 px-4 py-2 rounded-xl bg-secondary/50 border border-border/80 overflow-hidden w-full md:w-auto justify-center">
            {visualizerBars.map((b) => {
              const isAnim = voiceState === 'SPEAKING' || voiceState === 'LISTENING';
              const heightPct = isAnim
                ? Math.floor(20 + Math.sin((b * 1.5) + Date.now() / 200) * 80)
                : 15;

              return (
                <div
                  key={b}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    voiceState === 'SPEAKING'
                      ? 'bg-cyan-500'
                      : voiceState === 'LISTENING'
                      ? 'bg-rose-500'
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3.5 mt-3.5 border-t border-border/70 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-muted-foreground shrink-0 flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500" /> Prompts:
          </span>
          {sampleVoicePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleProcessQuery(p.query)}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-border bg-secondary/40 hover:bg-primary/10 hover:border-primary/40 text-foreground/80 hover:text-foreground font-medium transition-all cursor-pointer text-[11px]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. DUAL-PANE VIEWPORT: CONVERSATION (LEFT) + TERMINAL (RIGHT) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: CONVERSATION & TRANSCRIPT FEED (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-[740px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground font-display">Interactive Jarvis Transcript</span>
            </div>
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md hover:bg-secondary cursor-pointer"
              title="Reset conversation memory"
            >
              <RotateCcw className="size-3" /> Clear History
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Sender badge */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 font-mono">
                  {msg.sender === 'jarvis' ? (
                    <>
                      <span className="size-2 rounded-full bg-primary" />
                      <strong className="text-primary">JARVIS CORE</strong>
                    </>
                  ) : (
                    <>
                      <span className="size-2 rounded-full bg-amber-500" />
                      <strong className="text-amber-600 dark:text-amber-400">TRADER</strong>
                    </>
                  )}
                  <span>· {msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl text-xs max-w-[96%] leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-foreground font-medium rounded-tr-none'
                    : 'bg-secondary/40 border border-border text-foreground rounded-tl-none'
                }`}>
                  {/* Clean Formatted Markdown (No raw asterisks!) */}
                  <FormattedMarkdown content={msg.text} />

                  {/* Highlights pills */}
                  {msg.payload?.summaryHighlights && (
                    <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap gap-1.5">
                      {msg.payload.summaryHighlights.map((hl, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-mono font-medium">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Action Bar */}
                  {msg.sender === 'jarvis' && (
                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReplayVoice(msg.payload?.spokenText || msg.text)}
                          className="hover:text-primary p-1 rounded hover:bg-secondary flex items-center gap-1 transition-colors cursor-pointer"
                          title="Read aloud"
                        >
                          <Volume2 className="size-3.5" /> Read
                        </button>
                        <button
                          onClick={() => handleCopyMarkdown(msg.id, msg.text)}
                          className="hover:text-foreground p-1 rounded hover:bg-secondary flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {msg.payload?.suggestedFollowUps && msg.payload.suggestedFollowUps.length > 0 && (
                        <button
                          onClick={() => handleProcessQuery(msg.payload!.suggestedFollowUps[0])}
                          className="text-primary hover:underline flex items-center gap-0.5 text-[11px] font-medium cursor-pointer"
                        >
                          Next: {msg.payload.suggestedFollowUps[0].slice(0, 26)}... <ChevronRight className="size-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-secondary/50 border border-border text-xs text-primary font-mono">
                <RefreshCw className="size-4 animate-spin" />
                <span>Jarvis calculating SMC levels, order book and macro context...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMic}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  voiceState === 'LISTENING'
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-secondary border-border hover:border-primary text-primary'
                }`}
                title="Toggle Mic Voice Input"
              >
                <Mic className="size-4" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcessQuery(textInput)}
                placeholder="Ask in Hindi, Hinglish, or English (e.g. 'Bitcoin ka full analysis karo')..."
                className="flex-1 bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans"
              />

              <button
                onClick={() => handleProcessQuery(textInput)}
                disabled={!textInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSTITUTIONAL MARKET VISUAL TERMINAL (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-[740px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Tabs Bar */}
          <div className="p-2.5 border-b border-border bg-secondary/30 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRightPanelTab('decision')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelTab === 'decision'
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Target className="size-3.5 text-primary" /> Long / Short Engine
              </button>
              <button
                onClick={() => setRightPanelTab('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelTab === 'chart'
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart2 className="size-3.5 text-primary" /> Live Chart
              </button>
              <button
                onClick={() => setRightPanelTab('orderflow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelTab === 'orderflow'
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="size-3.5 text-primary" /> Liquidity & Order Flow
              </button>
              <button
                onClick={() => setRightPanelTab('macro')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelTab === 'macro'
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="size-3.5 text-primary" /> Macro & DXY Matrix
              </button>
            </div>

            {/* Asset Pill */}
            <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-lg bg-card border border-border">
              <span>{activeAsset.symbol}</span>
              <span className="text-primary">{activeAsset.formattedPrice}</span>
            </div>
          </div>

          {/* TAB 1: DECISION ENGINE */}
          {rightPanelTab === 'decision' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Executive Decision Header Card */}
              <div className="rounded-xl border border-border bg-secondary/30 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                      Universal Institutional Verdict · {activeAsset.name}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight px-3.5 py-1 rounded-xl shadow-xs ${
                        activeAsset.decision === 'LONG' ? 'bg-emerald-500 text-white' :
                        activeAsset.decision === 'SHORT' ? 'bg-rose-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {activeAsset.decision}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {activeAsset.regime}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          Conviction: <strong className="text-foreground">{activeAsset.confidence}%</strong> · R:R: <strong className="text-primary font-bold">{activeAsset.riskReward}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold block">Quant Calibration</span>
                    <div className="w-36 h-2.5 rounded-full bg-secondary border border-border mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${activeAsset.confidence > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${activeAsset.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Execution Levels Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground text-[10px] block uppercase font-mono font-semibold">Optimal Entry Zone</span>
                    <span className="font-bold text-foreground font-mono text-[11px] mt-1 block">
                      {activeAsset.entryZone}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <span className="text-rose-600 dark:text-rose-400 text-[10px] block uppercase font-mono font-semibold">Protective Stop Loss</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-[11px] mt-1 block">
                      {activeAsset.stopLoss}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block uppercase font-mono font-semibold">Take Profit 1</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mt-1 block">
                      {activeAsset.takeProfit1}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-cyan-600 dark:text-cyan-400 text-[10px] block uppercase font-mono font-semibold">Take Profit 2</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-[11px] mt-1 block">
                      {activeAsset.takeProfit2}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Checklist & Strict Invalidation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-display">
                    <Check className="size-4 text-emerald-500" /> Mandatory Execution Checklist
                  </h4>
                  <div className="space-y-2 text-xs text-foreground/90">
                    {activeAsset.confirmationChecklist.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border/40">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className="leading-snug">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-display">
                    <Shield className="size-4" /> Invalidation & Trapped Setup Rule
                  </h4>
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {activeAsset.invalidationTrigger}
                  </p>
                  <div className="text-[11px] text-muted-foreground pt-2 border-t border-rose-500/20">
                    <strong>Disciplined Rule:</strong> Never average down into a broken structural level.
                  </div>
                </div>
              </div>

              {/* Technical & SMC Overlays Card */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5 font-display">
                  <Layers className="size-4 text-primary" /> Smart Money Concepts & Indicator Readout
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Break of Structure</span>
                    <strong className="text-foreground text-[13px]">${activeAsset.bosLevel.toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">CHoCH Pivot</span>
                    <strong className="text-foreground text-[13px]">${activeAsset.chochLevel.toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">RSI (14)</span>
                    <strong className="text-primary text-[13px]">{activeAsset.rsi14}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">VWAP Benchmark</span>
                    <strong className="text-foreground text-[13px]">${activeAsset.vwap.toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Demand Order Block</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-[13px]">${activeAsset.orderBlockDemand.low} - ${activeAsset.orderBlockDemand.high}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Supply Order Block</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-[13px]">${activeAsset.orderBlockSupply.low} - ${activeAsset.orderBlockSupply.high}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Upper Short Liq</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-[13px]">${activeAsset.upperLiquidationMagnet.price.toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Lower Long Liq</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-[13px]">${activeAsset.lowerLiquidationMagnet.price.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CHART INTEGRATION */}
          {rightPanelTab === 'chart' && (
            <div className="flex-1 flex flex-col p-3 bg-card">
              <div className="flex items-center justify-between text-xs px-2 py-1.5 text-muted-foreground font-mono">
                <span>TradingView Institutional Feed for {activeAsset.symbol}</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
                </span>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden border border-border min-h-[550px]">
                <TradingViewWidget
                  symbol={
                    activeAssetKey === 'BTC' ? 'BINANCE:BTCUSDT' :
                    activeAssetKey === 'ETH' ? 'BINANCE:ETHUSDT' :
                    activeAssetKey === 'SOL' ? 'BINANCE:SOLUSDT' :
                    activeAssetKey === 'GOLD' ? 'OANDA:XAUUSD' :
                    activeAssetKey === 'DXY' ? 'CAPITALCOM:DXY' :
                    'CRYPTOCAP:USDT.D'
                  }
                  theme="dark"
                  autosize={true}
                />
              </div>
            </div>
          )}

          {/* TAB 3: ORDER FLOW & LIQUIDATIONS */}
          {rightPanelTab === 'orderflow' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  🔥 Estimated Liquidation Clusters ({activeAsset.symbol})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10">
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-bold block">
                      UPPER SHORT SQUEEZE MAGNET
                    </span>
                    <div className="text-2xl font-extrabold text-foreground font-mono mt-1">
                      ${activeAsset.upperLiquidationMagnet.price.toLocaleString()}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Estimated volume: <strong>{activeAsset.upperLiquidationMagnet.volumeEst}</strong>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block">
                      LOWER LONG LIQUIDATION MAGNET
                    </span>
                    <div className="text-2xl font-extrabold text-foreground font-mono mt-1">
                      ${activeAsset.lowerLiquidationMagnet.price.toLocaleString()}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Estimated volume: <strong>{activeAsset.lowerLiquidationMagnet.volumeEst}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  🌊 CVD & Derivatives Telemetry
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">CVD Bias</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-[13px]">{activeAsset.cvdBias.replace(/_/g, ' ')}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Funding Rate (8h)</span>
                    <strong className="text-foreground text-[13px]">{activeAsset.fundingRate8h}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Open Interest (24h)</span>
                    <strong className="text-primary text-[13px]">{activeAsset.openInterestChange24h}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Long / Short Ratio</span>
                    <strong className="text-foreground text-[13px]">{activeAsset.longShortRatio}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MACRO & DXY CORRELATION MATRIX */}
          {rightPanelTab === 'macro' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>🌐 Cross-Market Correlation Matrix (30-Day Window)</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Synchronized Quant Feed</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-semibold">BTC vs DXY Correlation</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-xl block mt-1">
                      {GLOBAL_MACRO_CORRELATION.btcDxyCorr30d}
                    </strong>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">Inverse Relationship</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-semibold">BTC vs USDT Dominance</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-xl block mt-1">
                      {GLOBAL_MACRO_CORRELATION.btcUsdtDominanceCorr30d}
                    </strong>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">High Risk-On Inflow</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-semibold">Gold (XAU) vs DXY</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-xl block mt-1">
                      {GLOBAL_MACRO_CORRELATION.goldDxyCorr30d}
                    </strong>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">Yield Sensitive</span>
                  </div>
                </div>
              </div>

              {/* Macro Indicators */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-xs">
                <h4 className="font-bold text-foreground font-mono">Key Macro Drivers & Institutional Flows</h4>
                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="text-muted-foreground">Federal Reserve Policy Trajectory</span>
                    <span className="font-bold text-foreground">{GLOBAL_MACRO_CORRELATION.fedRateCutExpectation}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="text-muted-foreground">Spot Bitcoin ETF Net Inflow</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{GLOBAL_MACRO_CORRELATION.etfNetInflowUsd}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="text-muted-foreground">US 10-Year Benchmark Yield</span>
                    <span className="font-bold text-foreground">{GLOBAL_MACRO_CORRELATION.us10yYield}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="text-muted-foreground">Bitcoin Dominance (BTC.D)</span>
                    <span className="font-bold text-primary">{GLOBAL_MACRO_CORRELATION.btcDominanceValue}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Attribution */}
          <div className="p-3 border-t border-border bg-secondary/20 text-[11px] text-muted-foreground flex items-center justify-between font-mono">
            <span>Verified Feeds: Binance WS, LBMA London, ICE DXY, FRED Fed Macro</span>
            <span>Latency: &lt;15ms</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 🎙️ DEEEPR.AI & INSTAGRAM REEL NEURAL VOICE STUDIO MODAL   */}
      {/* ────────────────────────────────────────────────────────── */}
      {isNeuralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-[#090d16] text-white p-5 sm:p-7 shadow-2xl space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-md shadow-cyan-500/20">
                  🎙️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                      Deeepr.ai & Instagram Reel AI Voice Studio
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      ELEVENLABS NEURAL
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    Exact studio AI voice profile used by <strong>Deeepr.ai</strong> and <strong>Dinesh Kirola (@stockburner_official)</strong> in viral trading reels.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNeuralModalOpen(false)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Explanation Banner */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Sparkles className="size-4" />
                <span>Same-to-Same Reel Voice Architecture</span>
              </div>
              <p className="text-white/80 leading-relaxed">
                Instagram reels (Dinesh Kirola / Deeepr.ai) mein <strong>ElevenLabs Multilingual V2</strong> ka <span className="text-cyan-300 font-semibold font-mono">Bunty</span> aur <span className="text-cyan-300 font-semibold font-mono">Adam</span> voice model use hota hai. 
                Yeh voice 100% natural studio tone, deep bass aur Hinglish accent ke saath bolti hai!
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-white/50">
                <span>Free Tier:</span>
                <span className="text-emerald-400 font-medium">10,000 characters free every month on ElevenLabs.io</span>
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300 ml-auto flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* ElevenLabs API Key Input Section */}
            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                  <Key className="size-3.5 text-cyan-400" />
                  <span>ElevenLabs API Key</span>
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  elevenLabsApiKey ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {elevenLabsApiKey ? '🟢 Neural Studio Connected' : '⚪ Local DSP Studio Fallback Active'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="Paste your ElevenLabs API Key (e.g. sk_...)"
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  onClick={() => handleSaveApiKey(elevenLabsApiKey)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {keySaveSuccess ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-black" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Key</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-white/50">
                Key will be stored locally in your browser (<code className="text-cyan-300">localStorage</code>) and used directly for audio synthesis.
              </p>
            </div>

            {/* Preset Voice Models */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 font-mono">
                  Select Reel Voice Persona
                </h3>
                <span className="text-[11px] text-cyan-400 font-semibold font-mono">
                  Active: {DEEEPR_NEURAL_VOICES.find(v => v.id === selectedNeuralVoiceId)?.name || 'Bunty'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEEEPR_NEURAL_VOICES.map((preset) => {
                  const isSelected = selectedNeuralVoiceId === preset.id;
                  const isPlaying = playingPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectNeuralVoice(preset.id)}
                      className={`rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {preset.reelTag}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-1.5">
                            {preset.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPresetSample(preset.id);
                            }}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isPlaying
                                ? 'bg-cyan-500 text-black animate-pulse'
                                : 'bg-white/10 hover:bg-white/20 text-cyan-300'
                            }`}
                            title="Play Voice Sample"
                          >
                            {isPlaying ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <span className="text-white/40 font-mono text-[10px]">
                          Voice ID: {preset.id.slice(0, 8)}...
                        </span>
                        <span className={`font-semibold ${isSelected ? 'text-cyan-300' : 'text-white/40'}`}>
                          {isSelected ? '✓ Selected Voice' : 'Click to Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Test & Done */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
              <button
                onClick={handleTestVoice}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Volume2 className="size-4" />
                <span>Test Live Jarvis Response in this Voice</span>
              </button>

              <button
                onClick={() => setIsNeuralModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
