import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, Maximize2, RefreshCw } from 'lucide-react';
import { voiceService, VoiceState } from '../services/voiceSynthesisService';
import { generateJarvisResponse } from '../services/marketVoiceIntelligenceEngine';

interface JarvisFloatingWidgetProps {
  onOpenFullTerminal: () => void;
  currentTab: string;
}

export const JarvisFloatingWidget: React.FC<JarvisFloatingWidgetProps> = ({
  onOpenFullTerminal,
  currentTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [language, setLanguage] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');

  useEffect(() => {
    const unsub = voiceService.subscribeState((st) => setVoiceState(st));
    return () => unsub();
  }, []);

  // If already on the jarvis voice tab, hide the floating orb to avoid clutter
  if (currentTab === 'jarvis-voice-ai' || currentTab === 'assistant') {
    return null;
  }

  const handleStartListening = () => {
    if (voiceState === 'LISTENING') {
      voiceService.stopListening();
    } else {
      setTranscript('');
      voiceService.startListening(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleQuickQuery(text);
          }
        },
        undefined,
        language
      );
    }
  };

  const handleQuickQuery = (query: string) => {
    if (!query.trim()) return;
    const res = generateJarvisResponse(query, 'QUICK', language);
    setLastResponse(res.spokenText);
    voiceService.speak(res.spokenText, { langMode: language });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded Quick HUD Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl border border-cyan-500/40 bg-[#0b1220]/95 backdrop-blur-xl p-4 shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
              <strong className="text-foreground font-display text-sm">JARVIS Voice Mini-HUD</strong>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenFullTerminal}
                className="p-1 rounded text-cyan-400 hover:bg-secondary transition-colors"
                title="Expand to Full Terminal"
              >
                <Maximize2 className="size-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Close Mini-HUD"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Status & Mic button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartListening}
              className={`size-12 rounded-xl flex items-center justify-center font-bold transition-all shadow-lg cursor-pointer ${
                voiceState === 'LISTENING'
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50'
                  : voiceState === 'SPEAKING'
                  ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white animate-pulse'
                  : 'bg-primary/20 text-cyan-400 border border-cyan-500/40 hover:bg-primary/30'
              }`}
            >
              {voiceState === 'LISTENING' ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>

            <div className="flex-1">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                {voiceState === 'LISTENING' ? 'Listening...' : voiceState === 'SPEAKING' ? 'Speaking...' : 'Ready'}
              </span>
              <p className="text-foreground text-xs font-medium truncate">
                {transcript || (voiceState === 'LISTENING' ? 'Speak in Hinglish or English...' : 'Click mic to ask a quick question')}
              </p>
            </div>
          </div>

          {/* Spoken Response Preview */}
          {lastResponse && (
            <div className="p-2.5 rounded-lg bg-card/80 border border-border text-[11px] leading-relaxed text-foreground/90 max-h-32 overflow-y-auto">
              <span className="text-[9px] text-muted-foreground block font-mono">Spoken Answer:</span>
              {lastResponse}
            </div>
          )}

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border/60">
            {['All market analysis', 'BTC Long ya Short?', 'Gold XAUUSD setup'].map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setTranscript(p);
                  handleQuickQuery(p);
                }}
                className="px-2 py-1 rounded bg-secondary/80 hover:bg-primary/10 hover:border-primary/40 border border-border/60 text-[10px] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Launch Full Terminal Action */}
          <button
            onClick={onOpenFullTerminal}
            className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
          >
            <Sparkles className="size-3.5" /> Open Full Universal Jarvis Terminal
          </button>
        </div>
      )}

      {/* Floating Glowing Orb Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group size-14 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-cyan-400/50"
        title="Open JARVIS AI Voice Assistant"
      >
        <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping group-hover:block" />
        <Mic className="size-6 text-white" />
        <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-emerald-400 border-2 border-background" />
      </button>
    </div>
  );
};
