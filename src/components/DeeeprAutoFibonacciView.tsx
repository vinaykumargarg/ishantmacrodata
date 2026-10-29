import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  Info,
  Lock,
  Unlock,
  Zap,
  Target,
  FileText,
  Sparkles,
  BarChart2,
  CheckSquare,
  Award
} from 'lucide-react';
import {
  runDeeeprAutoFibonacciEngine,
  FibAsset,
  FibTimeframe,
  AutoFibonacciParams,
  AutoFibonacciOutput
} from '../services/deeeprAutoFibonacciEngine';
import { masterVerdictStore } from '../services/masterVerdictStore';
import { VerdictBadge } from './VerdictBadge';
import { ConflictEvidenceDashboard } from './ConflictEvidenceDashboard';

interface DeeeprAutoFibonacciViewProps {
  onNavigate?: (tab: string) => void;
  defaultAsset?: FibAsset;
}

export const DeeeprAutoFibonacciView: React.FC<DeeeprAutoFibonacciViewProps> = ({
  onNavigate,
  defaultAsset = 'BTCUSDT'
}) => {
  const [selectedAsset, setSelectedAsset] = useState<FibAsset>(defaultAsset);
  const [selectedTf, setSelectedTf] = useState<FibTimeframe>('1H');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [eventBlackoutActive, setEventBlackoutActive] = useState<boolean>(false);
  
  // Interactive Simulation Controls
  const [customPrice, setCustomPrice] = useState<number>(() => {
    return selectedAsset === 'XAUUSD' ? 2724.8 : 82500.0;
  });

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedHinglish, setCopiedHinglish] = useState(false);

  // Sync default price when asset changes
  const handleAssetChange = (newAsset: FibAsset) => {
    setSelectedAsset(newAsset);
    setCustomPrice(newAsset === 'XAUUSD' ? 2724.8 : newAsset === 'ETHUSDT' ? 2840.0 : 82500.0);
  };

  const output: AutoFibonacciOutput = useMemo(() => {
    const atr1h = selectedAsset === 'XAUUSD' ? 18.5 : selectedAsset === 'ETHUSDT' ? 38.0 : 620.0;
    const params: AutoFibonacciParams = {
      asset: selectedAsset,
      currentPrice: customPrice,
      atr1h,
      candles15m: [
        { open: customPrice - 10, high: customPrice + 15, low: customPrice - 12, close: customPrice, volume: 1850 }
      ],
      isEventBlackoutActive: eventBlackoutActive
    };

    return runDeeeprAutoFibonacciEngine(params);
  }, [selectedAsset, customPrice, eventBlackoutActive]);

  const leg = output.primaryLeg;
  const gz = output.goldenZone;
  const scenarios = output.scenarios;

  // Register as evidence with single Master Arbiter
  useEffect(() => {
    if (!gz || !leg) return;
    masterVerdictStore.registerEvidence({
      moduleName: 'Auto-Fibonacci Golden Zone',
      role: 'EVIDENCE',
      lean: (gz.state === 'CONFIRMED' || gz.state === 'REACTING')
        ? (leg.dir === 'bullish' ? 'long' : 'short')
        : (gz.state === 'FAILED' || gz.state === 'INVALIDATED')
        ? (leg.dir === 'bullish' ? 'short' : 'long')
        : 'neutral',
      weight: output.evidenceWeightForMaster,
      note: `${leg.tf} ${leg.dir} Golden Zone [$${gz.pocketLow} - $${gz.pocketHigh}], state: ${gz.state}`,
      timestamp: Date.now()
    });
  }, [gz, leg, output.evidenceWeightForMaster]);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const copyHinglish = () => {
    navigator.clipboard.writeText(output.hinglishExplanation);
    setCopiedHinglish(true);
    setTimeout(() => setCopiedHinglish(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 p-3 sm:p-5 lg:p-6 space-y-6 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 0. SINGLE MASTER ARBITER BADGE */}
      {/* ────────────────────────────────────────────────────────── */}
      <VerdictBadge symbol={selectedAsset} />
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MASTER TERMINAL HERO (Deep Midnight Magical Blue + Gold Border Glow) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #090d18 0%, #0d1a3a 50%, #14102d 100%)',
          border: '2px solid #eeba30',
          boxShadow: '0 0 25px rgba(238, 186, 48, 0.28), inset 0 0 15px rgba(238, 186, 48, 0.08)'
        }}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#eeba30] via-yellow-400 to-[#eeba30] animate-pulse" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/30 text-[#f6cb55] border border-[#eeba30]/60 shadow-[0_0_10px_rgba(238,186,48,0.3)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#eeba30]" />
                <span>DEEEPR AUTO-FIBONACCI & GOLDEN ZONE v1</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                🕒 {output.asOfIST}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/40">
                ⏱️ Exec TF: {output.execTF}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                Ledger Basis: {output.confidenceBasis}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-950/60 text-purple-300 border border-purple-500/40">
                🛡️ EVIDENCE MODULE ONLY
              </span>
            </div>

            {/* Glowing Main Title */}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mt-3 flex items-center gap-3 flex-wrap"
              style={{
                color: '#f6cb55',
                textShadow: '0 0 16px rgba(238, 186, 48, 0.55), 0 0 30px rgba(238, 186, 48, 0.25)'
              }}
            >
              <span>📐 Auto-Fibonacci + Golden Zone Engine</span>
              <span className="text-base sm:text-lg font-bold text-cyan-300 font-mono">
                [GOLD · BITCOIN · ETHEREUM · SOLANA]
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-4xl leading-relaxed">
              Algorithmic ATR ZigZag Pivot Detection. Dominant impulse leg ko detect karke Golden Pocket [0.618–0.65], OTE band [0.62–0.79], 8-point confirmation checklist aur S1/S2/S3 execution scenarios compute karta hai. Single Master Verdict ke liye confluence provide karta hai.
            </p>
          </div>

          {/* Action Hub & Status */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-[#080d1a] border border-[#eeba30]/40 p-3.5 rounded-xl shadow-lg">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Golden Zone State</div>
                <div className="text-base font-black font-mono flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-md ${
                    gz.state === 'CONFIRMED' || gz.state === 'REACTING'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                      : gz.state === 'APPROACHING' || gz.state === 'TOUCHED'
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                      : gz.state === 'FAILED' || gz.state === 'INVALIDATED'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-400'
                      : 'bg-blue-500/30 text-blue-300 border border-blue-400'
                  }`}>
                    ● {gz.state}
                  </span>
                </div>
              </div>
              <div className="h-9 w-px bg-slate-700"></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Master Evidence</div>
                <div className="text-base font-black font-mono text-cyan-300">
                  {output.evidenceWeightForMaster > 0 ? `+${output.evidenceWeightForMaster}` : output.evidenceWeightForMaster}
                  <span className="text-[10px] text-slate-400 font-normal"> (Capped ±10)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyHinglish}
                className="flex-1 px-3.5 py-2 text-xs font-black rounded-xl text-slate-950 bg-gradient-to-r from-[#eeba30] via-amber-300 to-yellow-400 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedHinglish ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHinglish ? 'Copied Brief!' : '📜 Copy Hinglish'}</span>
              </button>

              <button
                onClick={copyJson}
                className="flex-1 px-3.5 py-2 text-xs font-bold rounded-xl text-cyan-200 bg-cyan-950/60 border border-cyan-400/50 hover:bg-cyan-900/60 shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedJson ? 'Copied JSON!' : '📦 JSON'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Warnings Bar if Any */}
        {output.warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <div className="font-semibold leading-relaxed">
              <span className="text-[#eeba30] font-black uppercase mr-1">⚠️ FIBONACCI NOTE:</span>
              {output.warnings.join(' • ')}
            </div>
          </div>
        )}

        {/* Quick Launch Switchers */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <span>🔗 Connected Institutional Engines:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-volume-profile-scanner') : (window.location.hash = '#deeepr-volume-profile-scanner')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊 Volume Profile Scanner</span>
            </button>
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-gold-entry-engine') : (window.location.hash = '#deeepr-gold-entry-engine')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🥇 Gold Why Engine</span>
            </button>
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-decision-engine') : (window.location.hash = '#deeepr-decision-engine')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🏛️ Decision Engine v4</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. ASSET SELECTOR & SIMULATION CONTROLS */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 sm:p-6 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #0a1122 0%, #0d1e3d 100%)',
          border: '2px solid #38bdf8',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
        }}
      >
        <div className="pb-3 border-b border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <span>🎯</span>
              <span>Select Asset & Interactive Simulation Panel</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Select karein Bitcoin, Gold, Ethereum ya Solana aur real-time pivot retracement parameters inspect karein.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                isLocked
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-md'
                  : 'bg-[#070b12] text-slate-300 border border-slate-700 hover:text-white'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isLocked ? 'Leg Locked (Manual)' : 'Auto-Pick Active'}</span>
            </button>

            <button
              onClick={() => setEventBlackoutActive(!eventBlackoutActive)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                eventBlackoutActive
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 shadow-md'
                  : 'bg-[#070b12] text-slate-300 border border-slate-700 hover:text-white'
              }`}
            >
              <span>{eventBlackoutActive ? '⚡ Event Blackout ON' : 'Event Blackout OFF'}</span>
            </button>
          </div>
        </div>

        {/* Asset Selection Buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          {(['BTCUSDT', 'XAUUSD', 'ETHUSDT', 'SOLUSDT'] as const).map((a) => (
            <button
              key={a}
              onClick={() => handleAssetChange(a)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                selectedAsset === a
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-[#eeba30] text-slate-950 shadow-lg shadow-amber-500/30 border border-yellow-200 scale-105'
                  : 'bg-[#060b16] text-slate-300 hover:text-white border border-slate-700/80 hover:border-amber-500/40'
              }`}
            >
              {a === 'BTCUSDT' ? '₿ BTC/USDT' : a === 'XAUUSD' ? '🥇 XAU/USD (Gold)' : a === 'ETHUSDT' ? 'Ξ ETH/USDT' : '◎ SOL/USDT'}
            </button>
          ))}
        </div>

        {/* Simulation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4 text-xs">
          <div className="p-3 bg-[#060b16] rounded-xl border border-slate-700/80">
            <label className="text-slate-300 text-xs font-bold block mb-1">
              Live Simulation Price ({selectedAsset}):
            </label>
            <input
              type="number"
              step={selectedAsset === 'XAUUSD' ? 0.5 : 10}
              value={customPrice}
              onChange={(e) => setCustomPrice(Number(e.target.value))}
              className="w-full bg-[#0d1424] border border-cyan-500/50 rounded-lg px-3 py-1.5 font-mono text-white text-sm font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="p-3 bg-[#060b16] rounded-xl border border-[#eeba30]/40">
            <label className="text-[#eeba30] text-xs font-black block mb-1 uppercase tracking-wide">
              👑 Golden Pocket Range (0.618 - 0.65):
            </label>
            <div className="text-amber-300 text-sm font-black font-mono mt-1">
              ${gz.pocketLow.toLocaleString()} – ${gz.pocketHigh.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-[#060b16] rounded-xl border border-slate-700/80">
            <label className="text-cyan-300 text-xs font-bold block mb-1">
              Depth Interpretation:
            </label>
            <div className="text-slate-200 text-xs font-medium truncate mt-1">
              {output.depthInterpretation}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. PRIMARY LEG CARD & CONFIRMATION CHECKLIST */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Primary Leg Overview & Confirmation Checklist */}
        <div className="space-y-6">
          {/* Section: Primary Leg Card */}
          <div
            className="rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5"
            style={{
              background: 'linear-gradient(135deg, #0e1529 0%, #151d3b 100%)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
            }}
          >
            <div className="pb-2.5 border-b border-cyan-500/30">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Primary Impulse Leg ({leg.tf})</span>
                </h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  Quality: {leg.quality}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Dominant structural swing point jahan se Fibonacci retracement calculate hota hai.
              </p>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Direction</span>
                <span className={`font-black text-sm ${leg.dir === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {leg.dir.toUpperCase()} IMPULSE
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Origin Anchor A</span>
                <span className="text-white font-black text-sm">${leg.A.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Extreme Anchor B</span>
                <span className="text-white font-black text-sm">${leg.B.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Impulse Range R</span>
                <span className="text-amber-300 font-bold">${leg.R.toLocaleString()} ({leg.rAtr} ATR)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Invalidation Level</span>
                <span className="text-rose-400 font-black text-sm">${leg.invalidationPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section: 8-Point Confirmation Checklist */}
          <div
            className="rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5"
            style={{
              background: 'linear-gradient(135deg, #091a18 0%, #0d2e26 100%)',
              border: '2px solid #10b981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div className="pb-2.5 border-b border-emerald-500/30">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>8-Point Confirmation Checklist</span>
                </h3>
                <span className="text-[11px] text-emerald-300 font-mono font-bold">Real-time Check</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Golden zone me entry lene se pehle in 8 structural gates ka verified hona zaroori hai.
              </p>
            </div>

            <ul className="space-y-2 text-xs">
              {gz.checklist.map((chk, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-[#05110d] p-3 rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 transition-all"
                >
                  <span className={`font-black text-base shrink-0 ${chk.pass ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {chk.pass ? '✓' : '○'}
                  </span>
                  <div>
                    <div className="text-white font-bold">{chk.item}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{chk.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle & Right: Retracement Ladder & S1/S2/S3 Execution Scenarios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Fibonacci Levels Ladder */}
          <div
            className="rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
            style={{
              background: 'linear-gradient(135deg, #0b1120 0%, #0e1c3a 60%, #15112e 100%)',
              border: '2px solid #eeba30',
              boxShadow: '0 0 25px rgba(238, 186, 48, 0.25)'
            }}
          >
            <div className="pb-3 border-b border-[#eeba30]/40 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-[#eeba30] bg-clip-text text-transparent flex items-center gap-2">
                  <span>📏</span>
                  <span>Mathematical Retracement & Extension Ladder</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Formulas compute karte hain exact price levels. Golden Pocket (0.618-0.650) highest reaction probability rakhta hai.
                </p>
              </div>
              <span className="text-xs font-mono text-yellow-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/50 font-bold">
                Golden Pocket: 0.618 – 0.650
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {output.levels.map((lvl) => (
                <div
                  key={lvl.ratio}
                  className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                    lvl.tag === 'golden'
                      ? 'bg-amber-500/15 border-2 border-[#eeba30] text-amber-300 font-bold shadow-lg shadow-amber-500/20'
                      : lvl.tag === 'ote'
                      ? 'bg-blue-500/15 border border-blue-400/60 text-blue-300'
                      : lvl.tag === 'eq'
                      ? 'bg-purple-500/15 border border-purple-400/60 text-purple-300'
                      : 'bg-[#070b16] border-slate-700/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-black text-sm">
                      {lvl.ratio === 0 ? '0.0 (B)' : lvl.ratio === 1 ? '1.0 (A)' : lvl.ratio.toFixed(3)}
                    </span>
                    <span className="text-white font-black text-base">${lvl.price?.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400">
                      [{lvl.band?.[0]?.toLocaleString() ?? '—'} – {lvl.band?.[1]?.toLocaleString() ?? '—'}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 hidden sm:inline">
                      {lvl.confluence?.[0] || 'Standard Retracement'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      lvl.grade === 'A'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : lvl.grade === 'B'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      Grade {lvl.grade} ({lvl.confluenceScore})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Extension Targets Bar */}
            <div className="mt-4 pt-3 border-t border-slate-700/80 grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="bg-[#070c18] p-3 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold">TP1 (Prior Swing B)</div>
                <div className="font-black text-white text-base mt-0.5">${output.targets?.tp1PriorSwing?.toLocaleString() ?? '—'}</div>
              </div>
              <div className="bg-[#070c18] p-3 rounded-xl border border-emerald-500/50">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">TP2 (1.272 Ext)</div>
                <div className="font-black text-emerald-300 text-base mt-0.5">${output.targets?.tp2Extension1272?.toLocaleString() ?? '—'}</div>
              </div>
              <div className="bg-[#070c18] p-3 rounded-xl border border-cyan-500/50">
                <div className="text-[10px] text-cyan-400 uppercase font-bold">TP3 (1.618 Ext)</div>
                <div className="font-black text-cyan-300 text-base mt-0.5">${output.targets?.tp3Extension1618?.toLocaleString() ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* Section: S1/S2/S3 Execution Scenarios */}
          <div
            className="rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
            style={{
              background: 'linear-gradient(135deg, #0e1224 0%, #171b38 100%)',
              border: '2px solid #a855f7',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.22)'
            }}
          >
            <div className="pb-2.5 border-b border-purple-500/30">
              <h3 className="text-base sm:text-lg font-black bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                <span>🔮</span>
                <span>Master Execution Scenarios (S1 Bounce · S2 Deeper/Fail · S3 Chop)</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Fibonacci akele trade nahi deta. Price action ke according market in 3 scenarios me se ek follow karega:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* S1: Bounce Continuation */}
              <div className="p-4 rounded-xl bg-[#091a14] border-2 border-emerald-400/70 space-y-2 shadow-lg">
                <div className="flex justify-between items-center pb-1.5 border-b border-emerald-500/30">
                  <span className="font-black text-emerald-300 text-sm">S1: BOUNCE (Trend)</span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded">
                    {scenarios?.[0]?.probability ?? 'Medium'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Golden zone hold hota hai aur reversal trigger candle close hoti hai.
                </p>
                <div className="text-[11px] font-mono text-emerald-300 pt-1 border-t border-emerald-500/20 space-y-0.5">
                  <div>Entry: {scenarios?.[0]?.entryZone ? `$${scenarios[0].entryZone[0]?.toLocaleString()} – $${scenarios[0].entryZone[1]?.toLocaleString()}` : 'Zone Trigger'}</div>
                  <div>SL: {scenarios?.[0]?.sl ? `$${scenarios[0].sl.toLocaleString()}` : 'Beyond 0.786'}</div>
                  <div>TP: {scenarios?.[0]?.tps?.[0]?.price ? `$${scenarios[0].tps[0].price.toLocaleString()} (${scenarios[0].tps[0].id})` : 'TP1'}</div>
                </div>
              </div>

              {/* S2: Deep Retracement / Fail */}
              <div className="p-4 rounded-xl bg-[#1f0a14] border-2 border-rose-400/70 space-y-2 shadow-lg">
                <div className="flex justify-between items-center pb-1.5 border-b border-rose-500/30">
                  <span className="font-black text-rose-300 text-sm">S2: DEEPER / FAIL</span>
                  <span className="text-[10px] font-mono font-bold bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded">
                    {scenarios?.[1]?.probability ?? 'Low'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Price 0.786 ke neeche close karta hai. Retracement origin tak deepen ho sakti hai.
                </p>
                <div className="text-[11px] font-mono text-rose-300 pt-1 border-t border-rose-500/20 space-y-0.5">
                  <div>Next Target: {scenarios?.[1]?.tps?.[0]?.price ? `$${scenarios[1].tps[0].price.toLocaleString()} (${scenarios[1].tps[0].id})` : '0.886 Retrace'}</div>
                  <div>Invalidate Origin: ${leg?.A?.price?.toLocaleString() ?? '—'}</div>
                </div>
              </div>

              {/* S3: Chop / Consolidation */}
              <div className="p-4 rounded-xl bg-[#181308] border-2 border-amber-400/70 space-y-2 shadow-lg">
                <div className="flex justify-between items-center pb-1.5 border-b border-amber-500/30">
                  <span className="font-black text-amber-300 text-sm">S3: CHOP / WAIT</span>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded">
                    {scenarios?.[2]?.probability ?? 'Medium'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Zone ke andar overlapping candles. Koi clear trigger nahi — strict WAIT command.
                </p>
                <div className="text-[11px] font-mono text-amber-300 pt-1 border-t border-amber-500/20">
                  Status: WAIT for trigger close
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3.5 MASTER CONFLICT & EVIDENCE DASHBOARD */}
      {/* ────────────────────────────────────────────────────────── */}
      <ConflictEvidenceDashboard symbol={selectedAsset} />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. HINGLISH EXECUTIVE BRIEFING SCROLL (Illuminated Gold Scroll) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4"
        style={{
          background: 'linear-gradient(135deg, #100f14 0%, #171408 50%, #0d1222 100%)',
          border: '2px solid #eeba30',
          boxShadow: '0 0 25px rgba(238, 186, 48, 0.25)'
        }}
      >
        <div className="pb-3 border-b border-[#eeba30]/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2
              className="text-lg sm:text-xl font-black uppercase tracking-wider flex items-center gap-2.5"
              style={{
                color: '#eeba30',
                textShadow: '0 0 10px rgba(238, 186, 48, 0.5)'
              }}
            >
              <span>📜</span>
              <span>Institutional Hinglish Golden Zone Briefing</span>
            </h2>
            <span className="text-xs font-mono font-bold text-yellow-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/50">
              Rule R1-R5 Validated
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Algorithmically generated market commentary from current impulse pivot data.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-[#0c0d12] to-[#121625] border border-[#eeba30]/35 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans shadow-md">
          {output.hinglishExplanation}
        </div>

        <div className="pt-3 border-t border-[#eeba30]/30 text-center text-xs font-mono text-[#eeba30]/90 font-bold">
          ⚖️ DEEEPR SINGLE ARBITER LAW: Auto-Fibonacci Golden Zone Engine is purely a CONFLUENCE / EVIDENCE module. Final trade verdict (LONG / SHORT / WAIT) is governed solely by the Master Decision Engine.
        </div>
      </div>
    </div>
  );
};

export default DeeeprAutoFibonacciView;
