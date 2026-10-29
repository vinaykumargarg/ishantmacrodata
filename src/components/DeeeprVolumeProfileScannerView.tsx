import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Compass,
  Copy,
  Check,
  ShieldAlert,
  Info,
  Zap,
  Flame,
  ArrowRight,
  Sparkles,
  Target,
  Maximize2,
  RefreshCw,
  Award,
  BarChart3,
  Calendar,
  Hourglass,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Radio
} from 'lucide-react';
import {
  runDeeeprVolumeProfileScanner,
  VpAsset,
  ScannerState,
  AssetProfileScan,
  VpConfluenceLevel
} from '../services/deeeprVolumeProfileConfluenceScannerEngine';

interface DeeeprVolumeProfileScannerViewProps {
  onNavigate?: (tab: string) => void;
}

export const DeeeprVolumeProfileScannerView: React.FC<DeeeprVolumeProfileScannerViewProps> = ({
  onNavigate
}) => {
  const [selectedAsset, setSelectedAsset] = useState<VpAsset | 'ALL'>('ALL');
  const [selectedState, setSelectedState] = useState<ScannerState | 'ALL'>('ALL');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedHinglish, setCopiedHinglish] = useState(false);

  const scannerOutput = useMemo(() => {
    return runDeeeprVolumeProfileScanner();
  }, []);

  const filteredAssets = useMemo(() => {
    return scannerOutput.assets.filter((a) => {
      const matchAsset = selectedAsset === 'ALL' || a.asset === selectedAsset;
      const matchState = selectedState === 'ALL' || a.state === selectedState;
      return matchAsset && matchState;
    });
  }, [scannerOutput, selectedAsset, selectedState]);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(scannerOutput, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const copyHinglish = () => {
    navigator.clipboard.writeText(scannerOutput.hinglishSummary.join('\n\n'));
    setCopiedHinglish(true);
    setTimeout(() => setCopiedHinglish(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 p-3 sm:p-5 lg:p-6 space-y-6 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
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
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#eeba30] via-cyan-400 to-[#eeba30] animate-pulse" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/30 text-[#f6cb55] border border-[#eeba30]/60 shadow-[0_0_10px_rgba(238,186,48,0.3)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#eeba30]" />
                <span>DEEEPR VOLUME PROFILE ENGINE v1</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                🕒 {scannerOutput.scanTimeIST}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/40">
                ⏱️ TF: {scannerOutput.timeframe}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                🌐 6 Major Assets Verified
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
              <span>📊 Volume Profile Confluence Scanner</span>
              <span className="text-base sm:text-lg font-bold text-cyan-300 font-mono">
                [BTC · ETH · SOL · GOLD · SILVER · NASDAQ]
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-4xl leading-relaxed">
              Institutional Volume at Price Engine. POC (Point of Control), 70% Value Area (VAH / VAL), High Volume Nodes (HVN), Low Volume Nodes (LVN) aur Order Blocks / FVG / Liquidity Pools ke saath confluence rank karta hai. Master Decision Engine ke liye validated evidence provide karta hai.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0">
            <button
              onClick={copyHinglish}
              className="px-4 py-2.5 text-xs font-black rounded-xl text-slate-950 bg-gradient-to-r from-[#eeba30] via-amber-300 to-yellow-400 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {copiedHinglish ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHinglish ? 'Copied Summary!' : '📜 Copy Hinglish Report'}</span>
            </button>

            <button
              onClick={copyJson}
              className="px-4 py-2.5 text-xs font-bold rounded-xl text-cyan-200 bg-cyan-950/60 border border-cyan-400/50 hover:bg-cyan-900/60 shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedJson ? 'Copied JSON!' : '📦 Export Scanner JSON'}</span>
            </button>
          </div>
        </div>

        {/* Global Warnings Bar if Any */}
        {scannerOutput.warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <div className="font-semibold leading-relaxed">
              <span className="text-[#eeba30] font-black uppercase mr-1">⚠️ DATA NOTE:</span>
              {scannerOutput.warnings.join(' • ')}
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
              onClick={() => onNavigate ? onNavigate('deeepr-auto-fibonacci') : (window.location.hash = '#deeepr-auto-fibonacci')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>📐 Auto-Fib Golden Zone</span>
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
            <button
              onClick={() => onNavigate ? onNavigate('deeepr-ai') : (window.location.hash = '#deeepr-ai')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>📈 DEEEPR.AI Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. READY CONFLUENCE RADAR & FILTER PANEL */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Section: Ready Radar Box */}
        <div
          className="lg:col-span-3 rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #091a18 0%, #0d2e26 50%, #0a1c24 100%)',
            border: '2px solid #10b981',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.28)'
          }}
        >
          <div>
            <div className="pb-3 mb-4 border-b border-emerald-500/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2.5">
                  <span className="text-xl">🔥</span>
                  <span>Ready Confluence Radar (Action Zones Within 0.5 ATR)</span>
                </h2>
                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/50 shadow-md">
                  ✨ {scannerOutput.readyList.length} ASSETS READY TO ENGAGE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Ye assets apne highest-quality volume profile zones (Score &ge; 70) ke 0.5 ATR ke daayre me hain. Yahan market immediate price reaction de sakta hai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {scannerOutput.readyList.map((ready, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-[#071322] to-[#0a1c33] border-2 border-emerald-400/60 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-emerald-950/50 hover:border-emerald-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white font-mono">{ready.asset}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/50">
                        🏆 Score: {ready.score}/100
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-200">
                      <strong className="text-emerald-300">{ready.levelType}:</strong>{' '}
                      <span className="font-extrabold text-white text-sm">${ready.levelPrice.toLocaleString()}</span>{' '}
                      <span className="text-slate-400">({ready.distanceAtr} ATR door)</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs font-black px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 inline-block uppercase">
                      👀 {ready.reactionToLookFor}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      🛡️ Uncontested Zone
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 text-xs text-emerald-200/90 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Institutional Rule:</strong> Koi bhi asset <strong>READY</strong> me tabhi qualify hota hai jab price kisi valid, uncontested zone se &lt; 0.5 ATR door ho aur confluence score &ge; 70 ho.
            </span>
          </div>
        </div>

        {/* Section: Filter Box */}
        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #0e1529 0%, #171d3d 100%)',
            border: '2px solid #38bdf8',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
          }}
        >
          <div className="space-y-4">
            <div className="pb-2 border-b border-cyan-500/30">
              <h3 className="text-base font-black bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                <span>🎯</span>
                <span>Asset & State Filter</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-1">
                Kahi bhi click karke apna manpasand asset aur status instant filter karein.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <span>💰</span>
                <span>Select Asset:</span>
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {(['ALL', 'BTC', 'ETH', 'SOL', 'XAU', 'XAG', 'NQ'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAsset(a)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                      selectedAsset === a
                        ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30 border border-cyan-200 scale-105'
                        : 'bg-[#0a0f1d] text-slate-300 hover:text-white border border-slate-700/80 hover:border-cyan-500/40'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <span>⚡</span>
                <span>Select State:</span>
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {(['ALL', 'READY', 'WATCH', 'CONTESTED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedState(s)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedState === s
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-[#eeba30] text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-yellow-100 scale-105'
                        : 'bg-[#0a0f1d] text-slate-300 hover:text-white border border-slate-700/80 hover:border-amber-500/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 text-xs text-cyan-300/80 text-center font-mono font-bold">
            Showing {filteredAssets.length} of 6 assets
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. MULTI-ASSET DETAILED PROFILE CARDS */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {filteredAssets.map((assetScan) => (
          <div
            key={assetScan.asset}
            className="rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 transition-all"
            style={{
              background: 'linear-gradient(135deg, #0b1122 0%, #0e1c3a 60%, #15112e 100%)',
              border: assetScan.state === 'READY'
                ? '2px solid #10b981'
                : assetScan.state === 'CONTESTED'
                ? '2px solid #a855f7'
                : '2px solid #3b82f6',
              boxShadow: assetScan.state === 'READY'
                ? '0 0 25px rgba(16, 185, 129, 0.25)'
                : assetScan.state === 'CONTESTED'
                ? '0 0 25px rgba(168, 85, 247, 0.22)'
                : '0 0 20px rgba(59, 130, 246, 0.18)'
            }}
          >
            {/* Section: Asset Header Ribbon */}
            <div className="pb-4 border-b border-slate-700/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2 font-mono">
                    <span className="text-2xl">{assetScan.asset === 'XAU' ? '🥇' : assetScan.asset === 'XAG' ? '🥈' : assetScan.asset === 'BTC' ? '₿' : assetScan.asset === 'ETH' ? 'Ξ' : assetScan.asset === 'SOL' ? '◎' : '📈'}</span>
                    <span>{assetScan.asset}</span>
                    <span className="text-sm font-semibold text-slate-300 font-sans">
                      ({assetScan.assetName})
                    </span>
                  </h2>

                  <span
                    className="text-xl sm:text-2xl font-mono font-black tracking-tight"
                    style={{
                      color: '#f6cb55',
                      textShadow: '0 0 10px rgba(238, 186, 48, 0.5)'
                    }}
                  >
                    ${assetScan.price.toLocaleString()}
                  </span>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase font-mono shadow-md ${
                    assetScan.state === 'READY'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400'
                      : assetScan.state === 'CONTESTED'
                      ? 'bg-purple-500/25 text-purple-300 border border-purple-400'
                      : 'bg-blue-500/25 text-blue-300 border border-blue-400'
                  }`}>
                    ● {assetScan.state}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-700">
                    Location: <strong className="text-cyan-300 uppercase">{assetScan.locationVsValue} VALUE</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-700">
                    Volume: <strong className={assetScan.volumeType === 'TICK' ? 'text-amber-400' : 'text-emerald-400'}>{assetScan.volumeType}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-700">
                    1H ATR: <strong className="text-white">${assetScan.atr1h}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-700 text-slate-400">
                    Feed: {assetScan.volumeSource}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2">
                Live volume structure aur auction dynamics: Value area ke andar mean-reversion tendency hoti hai, jabki outside value acceptance expansion drive karta hai.
              </p>
            </div>

            {/* Profile Triad Sub-panels (Session, Daily, Weekly) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sub-panel 1: Daily Profile Card (FINAL) */}
              <div
                className="rounded-xl p-4 space-y-2.5"
                style={{
                  background: 'linear-gradient(135deg, #091322 0%, #0d1e38 100%)',
                  border: '1.5px solid #3b82f6',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-blue-500/30">
                    <h4 className="font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Daily Profile (Finalized)</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      FINAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Pichhle 24 ghante ka closed volume footprint. POC magnet ki tarah act karta hai.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-[#060c18] p-2 rounded-lg border border-emerald-500/40">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">VAL (Floor)</div>
                    <div className="font-black text-emerald-300 text-sm mt-0.5">${assetScan.profiles.daily.val.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#060c18] p-2 rounded-lg border-2 border-[#eeba30] shadow-[0_0_10px_rgba(238,186,48,0.3)]">
                    <div className="text-[10px] text-[#eeba30] font-black uppercase">POC (Magnet)</div>
                    <div className="font-black text-yellow-300 text-sm mt-0.5">${assetScan.profiles.daily.poc.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#060c18] p-2 rounded-lg border border-rose-500/40">
                    <div className="text-[10px] text-rose-400 font-bold uppercase">VAH (Ceiling)</div>
                    <div className="font-black text-rose-300 text-sm mt-0.5">${assetScan.profiles.daily.vah.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300 pt-1 font-mono border-t border-slate-700/60">
                  <span>Shape: <strong className="text-white font-bold">{assetScan.profiles.daily.shape}</strong></span>
                  <span>VWAP: <strong className="text-cyan-300 font-bold">${assetScan.profiles.daily.anchoredVwap.vwap.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Sub-panel 2: Session Profile Card (DEVELOPING) */}
              <div
                className="rounded-xl p-4 space-y-2.5"
                style={{
                  background: 'linear-gradient(135deg, #131508 0%, #201f0c 100%)',
                  border: '1.5px solid #eeba30',
                  boxShadow: '0 0 15px rgba(238, 186, 48, 0.2)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-amber-500/30">
                    <h4 className="font-extrabold text-[#eeba30] uppercase tracking-wider flex items-center gap-1.5">
                      <span>⏱️</span>
                      <span>Live Session Profile (Developing)</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      DEVELOPING
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Current active session ka real-time volume. Intraday acceptance ya rejection dekhein.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-[#0b0f07] p-2 rounded-lg border border-emerald-500/40">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">VAL</div>
                    <div className="font-black text-emerald-300 text-sm mt-0.5">${assetScan.profiles.session.val.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#0b0f07] p-2 rounded-lg border-2 border-[#eeba30] shadow-[0_0_10px_rgba(238,186,48,0.3)]">
                    <div className="text-[10px] text-[#eeba30] font-black uppercase">POC</div>
                    <div className="font-black text-yellow-300 text-sm mt-0.5">${assetScan.profiles.session.poc.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#0b0f07] p-2 rounded-lg border border-rose-500/40">
                    <div className="text-[10px] text-rose-400 font-bold uppercase">VAH</div>
                    <div className="font-black text-rose-300 text-sm mt-0.5">${assetScan.profiles.session.vah.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300 pt-1 font-mono border-t border-slate-700/60">
                  <span>Bin Size: <strong className="text-white">${assetScan.binSize}</strong></span>
                  <span>Volume: <strong className="text-amber-300">{assetScan.profiles.session.totalVolume.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Sub-panel 3: Weekly HTF Profile Card */}
              <div
                className="rounded-xl p-4 space-y-2.5"
                style={{
                  background: 'linear-gradient(135deg, #100b22 0%, #1e143d 100%)',
                  border: '1.5px solid #a855f7',
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.18)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-purple-500/30">
                    <h4 className="font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>Weekly HTF Profile (Macro Anchor)</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      HTF ANCHOR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Bade institutional participants ka weekly positioning zone aur unvisited Naked POCs.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-[#090616] p-2 rounded-lg border border-purple-500/40">
                    <div className="text-[10px] text-purple-400 font-bold uppercase">VAL</div>
                    <div className="font-black text-purple-200 text-sm mt-0.5">${assetScan.profiles.weekly.val.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#090616] p-2 rounded-lg border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                    <div className="text-[10px] text-purple-300 font-black uppercase">POC</div>
                    <div className="font-black text-purple-100 text-sm mt-0.5">${assetScan.profiles.weekly.poc.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#090616] p-2 rounded-lg border border-purple-500/40">
                    <div className="text-[10px] text-purple-400 font-bold uppercase">VAH</div>
                    <div className="font-black text-purple-200 text-sm mt-0.5">${assetScan.profiles.weekly.vah.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300 pt-1 font-mono border-t border-slate-700/60">
                  <span>Naked POCs: <strong className="text-yellow-400">{assetScan.nakedPocs.map(p => `$${p.toLocaleString()}`).join(', ') || 'None'}</strong></span>
                </div>
              </div>
            </div>

            {/* Top Valid Levels Below & Above Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Sub-panel 4: Levels Below (Support Anchors) */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'linear-gradient(135deg, #071510 0%, #0d251d 100%)',
                  border: '1.5px solid #10b981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-emerald-500/30 text-xs">
                    <h4 className="font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 bg-clip-text text-transparent uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>🟢 Valid Support Anchors Below Price (Bounces & Retests)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">Ranked by Score</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Price girne par ye levels strong buying demand, absorption aur bounce provide karte hain.
                  </p>
                </div>

                <div className="space-y-3">
                  {assetScan.levelsBelow.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#05110d] border border-emerald-500/40 space-y-2 hover:border-emerald-300 transition-all shadow-md"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black font-mono text-white text-base">${lvl.price.toLocaleString()}</span>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {lvl.period.toUpperCase()} {lvl.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-300 font-bold">-{lvl.distanceAtr} ATR</span>
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black shadow-md">
                            Score {lvl.score}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold">Confluences: </span>
                        {lvl.confluences.map(c => c.details).join(' • ') || 'Volume Profile anchor only'}
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-300 font-mono pt-2 border-t border-emerald-500/20">
                        <span>Reaction: <strong className="text-cyan-300">{lvl.lookFor}</strong></span>
                        <span>Room to Opposing: <strong className="text-yellow-300">{lvl.roomR}R</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-panel 5: Levels Above (Resistance Anchors) */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'linear-gradient(135deg, #18090d 0%, #2a0e16 100%)',
                  border: '1.5px solid #f43f5e',
                  boxShadow: '0 0 15px rgba(244, 63, 94, 0.15)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-rose-500/30 text-xs">
                    <h4 className="font-black bg-gradient-to-r from-rose-400 via-pink-300 to-red-400 bg-clip-text text-transparent uppercase tracking-wide flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <span>🔴 Valid Resistance Anchors Above Price (Ceilings & Targets)</span>
                    </h4>
                    <span className="text-[11px] text-rose-400 font-mono font-bold">Ranked by Score</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Price upar badhne par ye heavy volume areas selling pressure aur expansion targets bante hain.
                  </p>
                </div>

                <div className="space-y-3">
                  {assetScan.levelsAbove.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#120609] border border-rose-500/40 space-y-2 hover:border-rose-300 transition-all shadow-md"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black font-mono text-white text-base">${lvl.price.toLocaleString()}</span>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {lvl.period.toUpperCase()} {lvl.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-300 font-bold">+{lvl.distanceAtr} ATR</span>
                          <span className="px-2.5 py-0.5 rounded bg-rose-500 text-slate-950 font-black shadow-md">
                            Score {lvl.score}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-rose-400 font-bold">Confluences: </span>
                        {lvl.confluences.map(c => c.details).join(' • ') || 'Volume Profile anchor only'}
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-300 font-mono pt-2 border-t border-rose-500/20">
                        <span>Reaction: <strong className="text-cyan-300">{lvl.lookFor}</strong></span>
                        <span>Room to Opposing: <strong className="text-yellow-300">{lvl.roomR}R</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-panel 6: Contested Band Warnings */}
            {assetScan.contestedBands.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-950/40 border-2 border-purple-500/50 text-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-1">
                  <h5 className="font-black text-purple-300 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>⚔️ Contested Chop Range Zone Alert</span>
                  </h5>
                  <p className="text-xs text-slate-300">
                    Contested Band Active: <strong>${assetScan.contestedBands[0].lowPrice.toLocaleString()} – ${assetScan.contestedBands[0].highPrice.toLocaleString()}</strong> (Opposing demand/supply 0.5 ATR ke andar hain). Is band ke andar koi trade nahi lene ka rule hai.
                  </p>
                </div>
                <span className="font-mono text-xs font-black bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full border border-purple-400/50 self-start sm:self-auto shrink-0">
                  Score Capped at 80
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. HINGLISH EXECUTIVE SUMMARY (Illuminated Gold Scroll) */}
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
              <span>Institutional Hinglish Executive Briefing (Key Takeaways)</span>
            </h2>
            <span className="text-xs font-mono font-bold text-yellow-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/50">
              Rule V1-V7 Validated
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Scanner ka 6-line point-by-point institutional analysis — kaun sa asset kis level par reaction dene wala hai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {scannerOutput.hinglishSummary.map((line, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-gradient-to-r from-[#0c0d12] to-[#121625] border border-[#eeba30]/35 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans shadow-md hover:border-[#eeba30]/60 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-[#eeba30]/20 text-[#eeba30] font-black font-mono text-sm shrink-0 border border-[#eeba30]/40">
                  #{idx + 1}
                </span>
                <span className="pt-0.5">{line}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#eeba30]/30 text-center text-xs font-mono text-[#eeba30]/90 font-bold">
          ⚖️ DEEEPR SINGLE ARBITER LAW: Volume Profile Scanner is purely an EVIDENCE module. Final trade verdict (LONG / SHORT / WAIT) is governed solely by the Master Decision Engine.
        </div>
      </div>
    </div>
  );
};

export default DeeeprVolumeProfileScannerView;
