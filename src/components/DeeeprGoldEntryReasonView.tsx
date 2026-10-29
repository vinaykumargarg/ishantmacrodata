import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  Compass,
  Layers,
  DollarSign,
  FileText,
  Calendar,
  Lock,
  Zap,
  Info
} from 'lucide-react';
import {
  runDeeeprGoldEntryEngine,
  GoldEngineParams,
  MasterGoldEntryOutput,
  WhyLayerScore
} from '../services/deeeprGoldEntryReasonEngine';

interface DeeeprGoldEntryReasonViewProps {
  onNavigate?: (tab: string) => void;
}

export const DeeeprGoldEntryReasonView: React.FC<DeeeprGoldEntryReasonViewProps> = ({
  onNavigate
}) => {
  // Interactive Simulation Controls
  const [currentPrice, setCurrentPrice] = useState<number>(2720.0);
  const [rangeLow, setRangeLow] = useState<number>(2710.0);
  const [rangeHigh, setRangeHigh] = useState<number>(2760.0);
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [dxyPrice, setDxyPrice] = useState<number>(102.35);
  const [dxyTrend, setDxyTrend] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BEARISH');
  const [us10yRealYield, setUs10yRealYield] = useState<number>(1.88);
  const [fedCutProb, setFedCutProb] = useState<number>(76);
  const [cotPercentile, setCotPercentile] = useState<number>(84);
  const [retailLongPct, setRetailLongPct] = useState<number>(52);
  const [hasTier1EventWithin30m, setHasTier1EventWithin30m] = useState<boolean>(false);
  const [sourceConflictActive, setSourceConflictActive] = useState<boolean>(false);
  const [htfTrend, setHtfTrend] = useState<'BULLISH' | 'BEARISH' | 'RANGE'>('BULLISH');

  // UI State
  const [activeTab, setActiveTab] = useState<'PLAN' | 'WHY_LAYERS' | 'LADDER' | 'DXY' | 'EVENTS' | 'REPORT'>('PLAN');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedHinglish, setCopiedHinglish] = useState(false);

  // Generate Engine Output
  const engineOutput: MasterGoldEntryOutput = useMemo(() => {
    const mockCandles = [
      { open: currentPrice - 5, high: currentPrice + 2, low: currentPrice - 8, close: currentPrice, volume: 1650 },
      { open: currentPrice, high: currentPrice + 4, low: currentPrice - 3, close: currentPrice + 2, volume: 1820 },
      { open: currentPrice + 2, high: currentPrice + 6, low: currentPrice - 1, close: currentPrice + 4, volume: 2100 }
    ];

    const params: GoldEngineParams = {
      currentPrice,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow,
      rangeHigh,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0,
      dxyPrice,
      dxyTrend,
      us10yRealYield,
      fedRateCutProb: fedCutProb,
      cotPercentile,
      retailLongPct,
      accountBalanceUsd: accountBalance,
      riskPct,
      hasTier1EventWithin30m,
      sourceConflictPct: sourceConflictActive ? 0.45 : 0.05,
      htfTrend
    };

    return runDeeeprGoldEntryEngine(params);
  }, [
    currentPrice,
    rangeLow,
    rangeHigh,
    accountBalance,
    riskPct,
    dxyPrice,
    dxyTrend,
    us10yRealYield,
    fedCutProb,
    cotPercentile,
    retailLongPct,
    hasTier1EventWithin30m,
    sourceConflictActive,
    htfTrend
  ]);

  const plan = engineOutput.plan;
  const why = engineOutput.why;
  const dxy = engineOutput.dxyCheck;
  const positions = engineOutput.positionsMap;
  const events = engineOutput.events;

  // Preset Scenario Handlers
  const handlePreset = (preset: 'BULLISH_DISCOUNT' | 'MID_RANGE_WAIT' | 'EVENT_BLACKOUT' | 'DXY_CONFLICT') => {
    if (preset === 'BULLISH_DISCOUNT') {
      setCurrentPrice(2720.0);
      setRangeLow(2710.0);
      setRangeHigh(2760.0);
      setDxyPrice(102.35);
      setDxyTrend('BEARISH');
      setUs10yRealYield(1.82);
      setHasTier1EventWithin30m(false);
      setSourceConflictActive(false);
      setHtfTrend('BULLISH');
      setRetailLongPct(52);
    } else if (preset === 'MID_RANGE_WAIT') {
      setCurrentPrice(2735.0); // Exact 50% midpoint
      setRangeLow(2710.0);
      setRangeHigh(2760.0);
      setHasTier1EventWithin30m(false);
      setSourceConflictActive(false);
    } else if (preset === 'EVENT_BLACKOUT') {
      setHasTier1EventWithin30m(true);
      setSourceConflictActive(false);
    } else if (preset === 'DXY_CONFLICT') {
      setDxyPrice(104.50);
      setDxyTrend('BULLISH');
      setUs10yRealYield(2.25);
      setHasTier1EventWithin30m(false);
      setSourceConflictActive(false);
    }
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(engineOutput, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const copyHinglishToClipboard = () => {
    const text = Object.entries(engineOutput.hinglishReportSections)
      .map(([key, val]) => `[${key.toUpperCase()}]\n${val}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedHinglish(true);
    setTimeout(() => setCopiedHinglish(false), 2500);
  };

  return (
    <div
      className="min-h-screen text-slate-100 p-3 sm:p-5 lg:p-6 space-y-6 font-sans"
      style={{ background: 'linear-gradient(135deg, #090d18 0%, #0d1a3a 50%, #14102d 100%)' }}
    >
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. INSTITUTIONAL TERMINAL HEADER & STATUS BAR */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
          border: '2px solid #eeba30',
          boxShadow: '0 0 25px rgba(238, 186, 48, 0.28)'
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/40">
                XAUUSD REASON ENGINE v1
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {engineOutput.asOfIST}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {engineOutput.session}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Basis: {engineOutput.confidenceBasis}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl">🥇</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                Gold Entry & Reason Engine
              </span>
              <span className="text-sm font-normal text-slate-300 font-sans">
                ("Kahan Entry, Kahan SL, Kahan TP, Aur Kyon")
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Multi-Layer Institutional Why Engine: Macro + DXY/Yields + COT + ETF Vaults + Central Banks + Retail Crowd + Technical Confluence.
            </p>
          </div>

          {/* Master Verdict Badge */}
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, #070e1e 0%, #0d1b38 100%)',
              border: engineOutput.masterVerdict === 'LONG' ? '2px solid #10b981' : engineOutput.masterVerdict === 'SHORT' ? '2px solid #f43f5e' : '2px solid #eeba30',
              boxShadow: engineOutput.masterVerdict === 'LONG' ? '0 0 18px rgba(16, 185, 129, 0.3)' : engineOutput.masterVerdict === 'SHORT' ? '0 0 18px rgba(244, 63, 94, 0.3)' : '0 0 18px rgba(238, 186, 48, 0.3)'
            }}
          >
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Master Arbiter State</div>
              <div className="text-lg font-black tracking-wide font-mono flex items-center justify-end gap-1.5">
                {engineOutput.masterVerdict === 'LONG' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-5 h-5" /> LONG
                  </span>
                ) : engineOutput.masterVerdict === 'SHORT' ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <TrendingDown className="w-5 h-5" /> SHORT
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-5 h-5" /> WAIT / ARMED
                  </span>
                )}
              </div>
            </div>
            <div className="h-9 w-px bg-slate-700/60"></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Setup Quality</div>
              <div className="text-lg font-black font-mono text-cyan-400">
                {why.longScore} <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="h-9 w-px bg-slate-700/60"></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Alignment</div>
              <div className={`text-xs font-bold px-2 py-1 rounded ${
                why.alignment === 'ALL_ALIGNED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : why.alignment === 'PARTIAL'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {why.alignment}
              </div>
            </div>
          </div>
        </div>

        {/* Global Warning Banners */}
        {engineOutput.warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 shadow-lg">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <div className="font-medium">
              {engineOutput.warnings.join(' • ')}
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. INTERACTIVE SIMULATION PRESETS & CONTROLS */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, #071526 0%, #0b223d 50%, #102a4d 100%)',
          border: '2px solid #38bdf8',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-sky-800/60">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>⚡ Interactive Simulator & Institutional Scenario Presets</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Simulate live Gold price, range extremes, DXY, and risk sizing to observe real-time recalculation of all 8 layers and execution tranches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePreset('BULLISH_DISCOUNT')}
              className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all font-semibold cursor-pointer shadow-sm"
            >
              🟢 Bullish Discount ($2720)
            </button>
            <button
              onClick={() => handlePreset('MID_RANGE_WAIT')}
              className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all font-semibold cursor-pointer shadow-sm"
            >
              ⏳ Mid-Range Chop ($2735 WAIT)
            </button>
            <button
              onClick={() => handlePreset('EVENT_BLACKOUT')}
              className="px-3 py-1.5 text-xs rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all font-semibold cursor-pointer shadow-sm"
            >
              📅 Tier-1 Event Blackout
            </button>
            <button
              onClick={() => handlePreset('DXY_CONFLICT')}
              className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all font-semibold cursor-pointer shadow-sm"
            >
              🔴 DXY Conflict (104.50)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3.5 text-xs">
          <div>
            <label className="text-slate-300 text-[11px] font-semibold block mb-1">XAUUSD Spot ($)</label>
            <input
              type="number"
              step="1"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="w-full bg-[#050b16] border border-sky-800/80 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-slate-300 text-[11px] font-semibold block mb-1">Range Low ($)</label>
            <input
              type="number"
              step="5"
              value={rangeLow}
              onChange={(e) => setRangeLow(Number(e.target.value))}
              className="w-full bg-[#050b16] border border-sky-800/80 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-slate-300 text-[11px] font-semibold block mb-1">Range High ($)</label>
            <input
              type="number"
              step="5"
              value={rangeHigh}
              onChange={(e) => setRangeHigh(Number(e.target.value))}
              className="w-full bg-[#050b16] border border-sky-800/80 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-slate-300 text-[11px] font-semibold block mb-1">DXY Price</label>
            <input
              type="number"
              step="0.1"
              value={dxyPrice}
              onChange={(e) => setDxyPrice(Number(e.target.value))}
              className="w-full bg-[#050b16] border border-sky-800/80 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-slate-300 text-[11px] font-semibold block mb-1">Account Balance ($)</label>
            <input
              type="number"
              step="1000"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              className="w-full bg-[#050b16] border border-sky-800/80 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-slate-300 text-[11px] font-semibold block mb-1">Risk Per Trade (%)</label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              max="2.0"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              className="w-full bg-[#050b16] border border-sky-800/80 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. NAVIGATION TABS */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-700/80 gap-2 overflow-x-auto pb-1.5">
        <button
          onClick={() => setActiveTab('PLAN')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'PLAN'
              ? 'bg-[#111f4d] text-amber-300 border-2 border-[#eeba30] shadow-[0_0_15px_rgba(238,186,48,0.3)]'
              : 'bg-[#091124] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          <span>🎯</span>
          <span>Active Plan & Execution ("Kahan Entry, SL, TP")</span>
        </button>

        <button
          onClick={() => setActiveTab('WHY_LAYERS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'WHY_LAYERS'
              ? 'bg-[#111f4d] text-amber-300 border-2 border-[#eeba30] shadow-[0_0_15px_rgba(238,186,48,0.3)]'
              : 'bg-[#091124] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          <span>🧠</span>
          <span>8-Layer Why Engine ("Kyon Long / Short")</span>
        </button>

        <button
          onClick={() => setActiveTab('LADDER')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'LADDER'
              ? 'bg-[#111f4d] text-amber-300 border-2 border-[#eeba30] shadow-[0_0_15px_rgba(238,186,48,0.3)]'
              : 'bg-[#091124] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          <span>🪜</span>
          <span>Price Ladder & Positions Map</span>
        </button>

        <button
          onClick={() => setActiveTab('DXY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'DXY'
              ? 'bg-[#111f4d] text-amber-300 border-2 border-[#eeba30] shadow-[0_0_15px_rgba(238,186,48,0.3)]'
              : 'bg-[#091124] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          <span>💵</span>
          <span>DXY Cross-Check ("DXY Kya Kar Sakta Hai?")</span>
        </button>

        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'EVENTS'
              ? 'bg-[#111f4d] text-amber-300 border-2 border-[#eeba30] shadow-[0_0_15px_rgba(238,186,48,0.3)]'
              : 'bg-[#091124] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          <span>📅</span>
          <span>Economic Events & Blackout Windows</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORT')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'REPORT'
              ? 'bg-[#111f4d] text-amber-300 border-2 border-[#eeba30] shadow-[0_0_15px_rgba(238,186,48,0.3)]'
              : 'bg-[#091124] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          <span>📜</span>
          <span>Full 11-Section Hinglish Report</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT 1: ACTIVE PLAN & EXECUTION */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'PLAN' && (
        <div className="space-y-6">
          {plan ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: 2-Tranche Entry & Stop Loss */}
              <div className="lg:col-span-2 space-y-5">
                {/* Entry Tranches Card */}
                <div
                  className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
                    border: '2px solid #eeba30',
                    boxShadow: '0 0 20px rgba(238, 186, 48, 0.25)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-500/30 gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                        <span>🎯</span> 1. ENTRY EXECUTION ZONES & 2-TRANCHE PLAN
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Calculated from institutional order blocks and sweep reclaim levels with strict closed-candle trigger confirmation.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {engineOutput.setup.family}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        Valid: <span className="text-amber-300 font-bold">{plan.validTillIST}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl relative overflow-hidden backdrop-blur-md"
                        style={{
                          background: 'linear-gradient(135deg, #070e1e 0%, #0d1b38 100%)',
                          border: '1.5px solid rgba(238, 186, 48, 0.4)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-300 font-mono tracking-wider">
                            TRANCHE {entry.id} ({entry.weightPct}%)
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            Limit Zone
                          </span>
                        </div>
                        <div className="text-2xl font-black font-mono text-white mb-2">
                          ${entry.priceLow} – ${entry.priceHigh}
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed bg-[#050b16] p-2.5 rounded-lg border border-slate-700/60">
                          <span className="text-amber-400 font-bold">Kyun (Reason): </span>
                          {entry.reason}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl bg-[#050b16] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Worst Entry Edge: </span>
                      <span className="font-mono font-bold text-amber-300">${plan.entryWorstEdge}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Weighted Average Entry: </span>
                      <span className="font-mono font-bold text-white">${plan.avgEntry}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Execution Trigger: </span>
                      <span className="text-emerald-400 font-bold">{engineOutput.setup.trigger.condition}</span>
                    </div>
                  </div>
                </div>

                {/* Stop Loss Card */}
                <div
                  className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, #220b14 0%, #2e0e1b 50%, #3d1425 100%)',
                    border: '2px solid #f43f5e',
                    boxShadow: '0 0 20px rgba(244, 63, 94, 0.25)'
                  }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-rose-900/40 mb-3">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-amber-400">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <span>🛑 2. STRUCTURAL STOP-LOSS (SL) & POOL PROTECTION</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Strictly placed outside the zone/wick + 0.35 ATR buffer. Structural stop cannot exceed 3x ATR.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/40">
                      {plan.stop.distancePts} pts / {plan.stop.distanceAtr} ATR
                    </span>
                  </div>

                  <div className="flex items-baseline gap-4 mb-3">
                    <div className="text-3xl font-black font-mono text-rose-400">
                      ${plan.stop.price}
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      Basis: <span className="text-white font-bold">{plan.stop.basis}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-200 bg-[#0d0509] p-3 rounded-lg border border-rose-900/60 leading-relaxed">
                    <span className="text-rose-400 font-bold">Kyun (Structural Reason): </span>
                    {plan.stop.reason}
                  </div>
                </div>

                {/* Take Profit Targets (TP1, TP2, TP3) */}
                <div
                  className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, #061e1b 0%, #092c28 50%, #0d3832 100%)',
                    border: '2px solid #10b981',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-800/60 gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                        <span>🏁</span> 3. TAKE-PROFIT ROADMAP (STRUCTURE & REAL RR)
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Real R:R calculated from worst entry edge. TP2 must yield ≥ 2.0R to validate execution.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      Min 1:2 RR Gate: PASSED (1:{plan.rrTp2})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plan.tps.map((tp) => (
                      <div
                        key={tp.id}
                        className="p-4 rounded-xl flex flex-col justify-between backdrop-blur-md"
                        style={{
                          background: 'linear-gradient(135deg, #051613 0%, #08241f 100%)',
                          border: '1.5px solid rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-emerald-300 font-mono">
                              {tp.id} (Book {tp.closePct}%)
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              1:{tp.rr} RR
                            </span>
                          </div>
                          <div className="text-2xl font-black font-mono text-white mb-1">
                            ${tp.price}
                          </div>
                          <div className="text-[11px] text-emerald-300 font-mono mb-2">
                            +{tp.distancePts} pts from entry
                          </div>
                        </div>
                        <div className="text-xs text-slate-200 bg-[#020d0b] p-2.5 rounded-lg border border-emerald-900/60 leading-relaxed text-[11px]">
                          {tp.reason}
                        </div>
                        {tp.trailRule && (
                          <div className="mt-2 text-[10px] text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/50 font-medium">
                            ⚡ {tp.trailRule}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Position Sizer & Invalidation */}
              <div className="space-y-5">
                {/* Position Sizer Card */}
                <div
                  className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, #071526 0%, #0b223d 50%, #102a4d 100%)',
                    border: '2px solid #38bdf8',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-sky-800/60 mb-3">
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                        <DollarSign className="w-4 h-4 text-cyan-400" />
                        <span>📐 4. POSITION SIZING & RISK GATE</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Automated lot sizing by structural stop.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      Max: {plan.position.maxAccountRiskPct}%
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-sky-900/40">
                      <span className="text-slate-300">Account Size</span>
                      <span className="font-mono font-bold text-white">
                        ${plan.position.accountBalanceUsd.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-sky-900/40">
                      <span className="text-slate-300">Risk Allocation</span>
                      <span className="font-mono font-bold text-amber-300">
                        {plan.position.riskPct}% (${plan.position.riskAmountUsd})
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-sky-900/40">
                      <span className="text-slate-300">SL Distance</span>
                      <span className="font-mono font-bold text-rose-400">
                        ${plan.stop.distancePts} pts
                      </span>
                    </div>
                    <div className="bg-[#050b16] p-3.5 rounded-xl border border-sky-800/80 text-center">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                        Recommended Order Size
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {plan.position.lotSize} Lots
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Contract Value: ${plan.position.contractValueUsd.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hard Invalidation Criteria */}
                <div
                  className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, #220b14 0%, #2e0e1b 50%, #3d1425 100%)',
                    border: '2px solid #f43f5e',
                    boxShadow: '0 0 20px rgba(244, 63, 94, 0.25)'
                  }}
                >
                  <div className="pb-3 border-b border-rose-900/40 mb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-amber-400">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>🔒 5. KAB IDEA GALAT HO JAYEGA (HARD INVALIDATION)</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Strict thesis killers: Exit or cancel if any condition triggers.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs">
                    {plan.invalidation.map((inv, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-[#0d0509] p-2.5 rounded-lg border border-rose-900/50 text-slate-200"
                      >
                        <span className="text-rose-400 font-bold shrink-0">✕</span>
                        <span>{inv}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200">
                    <span className="font-bold">⏱️ Time Stop: </span>
                    {plan.timeStop}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Hard WAIT State Banner */
            <div
              className="rounded-2xl p-8 text-center space-y-4 backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
                border: '2px solid #eeba30',
                boxShadow: '0 0 25px rgba(238, 186, 48, 0.28)'
              }}
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300 shadow-[0_0_15px_rgba(238,186,48,0.4)]">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                <span>⏳</span> CURRENT VERDICT: WAIT (NO VALID LOCATION OR HARD GATE ACTIVE)
              </h2>
              <p className="text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed">
                {engineOutput.hinglishReportSections.entryKahanAurKyun}
              </p>
              <div className="p-4 bg-[#050b16] border border-amber-500/40 rounded-xl max-w-xl mx-auto text-xs text-slate-300 text-left space-y-2 shadow-lg">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" /> 🎯 Armed Levels for Activation:
                </div>
                <div>• Long Armed Level: Closed candle rejection at 1H Demand OB ($2,715) with volume {'>'}= 1.2x.</div>
                <div>• Short Armed Level: Closed candle rejection at 1H Supply OB ($2,765) with CVD delta confirmation.</div>
                <div>• Opposing Zone Room: Must maintain {'>'}= 1.5R room before execution.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT 2: 8-LAYER WHY ENGINE */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'WHY_LAYERS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="rounded-2xl p-5 text-center shadow-lg backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #061e1b 0%, #092c28 50%, #0d3832 100%)',
                border: '2px solid #10b981',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
              }}
            >
              <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold mb-1">🟢 Long Setup Quality (SQ)</div>
              <div className="text-3xl font-black font-mono text-emerald-400">{why.longScore} / 100</div>
              <div className="text-[11px] text-slate-300 mt-1">Technical + Macro + Sovereign Weighting</div>
            </div>
            <div
              className="rounded-2xl p-5 text-center shadow-lg backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #220b14 0%, #2e0e1b 50%, #3d1425 100%)',
                border: '2px solid #f43f5e',
                boxShadow: '0 0 20px rgba(244, 63, 94, 0.25)'
              }}
            >
              <div className="text-xs uppercase tracking-wider text-rose-300 font-bold mb-1">🔴 Short Setup Quality (SQ)</div>
              <div className="text-3xl font-black font-mono text-rose-400">{why.shortScore} / 100</div>
              <div className="text-[11px] text-slate-300 mt-1">Capped at 35 if discount location invalid</div>
            </div>
            <div
              className="rounded-2xl p-5 text-center shadow-lg backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #071526 0%, #0b223d 50%, #102a4d 100%)',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
              }}
            >
              <div className="text-xs uppercase tracking-wider text-cyan-300 font-bold mb-1">⚖️ Confluence Alignment</div>
              <div className={`text-xl font-bold mt-1 ${
                why.alignment === 'ALL_ALIGNED' ? 'text-emerald-400' : why.alignment === 'PARTIAL' ? 'text-cyan-300' : 'text-rose-400'
              }`}>
                {why.alignment}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">Macro vs Positioning vs Technical Direction</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(why.layers).map(([key, layer]) => {
              const layerIcons: Record<string, string> = {
                macro: '🏛️',
                realYields: '📉',
                centralBanks: '🏦',
                etfFlows: '💼',
                retailPositioning: '👥',
                cotData: '📊',
                technicalLocation: '🎯',
                volatilityAtr: '🌊'
              };
              const icon = layerIcons[key] || '🔍';

              return (
                <div
                  key={key}
                  className="rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
                    border: '1.5px solid rgba(56, 189, 248, 0.35)',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 font-bold">
                          {layer.name}
                        </span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        layer.factLabel === 'REPORTED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : layer.factLabel === 'DERIVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : layer.factLabel === 'PUBLISHED_VIEWS'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {layer.factLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs mb-3 font-mono">
                      <span className="text-slate-300">Score: <span className="font-bold text-amber-300">{layer.score > 0 ? `+${layer.score}` : layer.score}</span></span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300">Weight: <span className="text-white font-bold">{layer.weight}%</span></span>
                      <span className="text-slate-600">•</span>
                      <span className={`font-bold ${
                        layer.lean === 'BULLISH' ? 'text-emerald-400' : layer.lean === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {layer.lean}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 bg-[#050b16] p-3 rounded-xl border border-sky-900/50 leading-relaxed mb-3">
                      {layer.reasonSentenceHinglish}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-sky-900/40 pt-2 font-mono">
                    <span>Source: <strong className="text-slate-300">{layer.source}</strong></span>
                    <span>Lag: <strong className="text-cyan-300">{layer.lag}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT 3: PRICE LADDER & POSITIONS MAP */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'LADDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vertical Price Ladder */}
          <div
            className="lg:col-span-1 rounded-2xl p-5 shadow-xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
              border: '2px solid #eeba30',
              boxShadow: '0 0 20px rgba(238, 186, 48, 0.25)'
            }}
          >
            <div className="pb-3 border-b border-amber-500/30 mb-4">
              <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                <span>🪜</span> INSTITUTIONAL PRICE LADDER
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">XAUUSD Spot structural levels and pivot anchors</p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 flex justify-between items-center shadow-sm">
                <span>$2,765.00</span>
                <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded-full font-bold">4H Supply OB Ceiling</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/50 text-purple-300 flex justify-between items-center shadow-sm">
                <span>$2,750.00</span>
                <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full font-bold">Options Call OI (14.2k)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 flex justify-between items-center shadow-sm">
                <span>$2,735.00</span>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">Mid-Range Equilibrium (WAIT)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 font-bold flex justify-between items-center text-sm shadow-[0_0_15px_rgba(238,186,48,0.35)]">
                <span>${currentPrice.toFixed(2)}</span>
                <span className="text-xs bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black">CURRENT SPOT</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 flex justify-between items-center shadow-sm">
                <span>$2,715.00 – $2,720.00</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">1H Demand OB + VWAP</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/50 text-blue-300 flex justify-between items-center shadow-sm">
                <span>$2,700.00</span>
                <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full font-bold">Options Max Pain Level</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-700/60 text-rose-400 flex justify-between items-center shadow-sm">
                <span>$2,697.80</span>
                <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded-full font-bold">Structural SL Cut</span>
              </div>
            </div>
          </div>

          {/* Positions Breakdown: Banks, COT, Central Banks */}
          <div className="lg:col-span-2 space-y-5">
            {/* Central Banks Card */}
            <div
              className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #061e1b 0%, #092c28 50%, #0d3832 100%)',
                border: '2px solid #10b981',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-800/50 mb-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    <span>🏦</span> CENTRAL BANKS & SOVEREIGN PURCHASES (WGC / IMF)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">Sovereign treasury allocations and de-dollarization flows</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  REPORTED (Monthly Lag)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {positions.centralBanks.topFacts.map((fact, idx) => (
                  <div key={idx} className="bg-[#051613] p-3 rounded-xl border border-emerald-900/50 text-xs text-slate-200">
                    {fact}
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Monthly Net Inflows: <span className="text-emerald-400 font-bold">+{positions.centralBanks.netBuyingTrendTonnes} tonnes</span>
              </div>
            </div>

            {/* Published Bank Forecasts Card */}
            <div
              className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #180d2b 0%, #241342 50%, #321a5c 100%)',
                border: '2px solid #a855f7',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)'
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-purple-800/50 mb-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">
                    <span>📑</span> PUBLISHED BANK RESEARCH NOTES & TARGETS
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">Goldman, Citi, and UBS macroeconomic desk notes</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  PUBLISHED_VIEWS (Low Weight)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {positions.bankViews.map((bv, idx) => (
                  <div key={idx} className="bg-[#0f081c] p-3.5 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">{bv.bank}</span>
                      <span className="font-mono text-amber-300 font-bold text-xs">${bv.priceTarget}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{bv.thesis}</p>
                    <div className="text-[10px] text-slate-400 font-mono border-t border-purple-900/40 pt-1">
                      {bv.source} ({bv.date})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retail Crowd Positioning Card */}
            <div
              className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
                border: '2px solid #eeba30',
                boxShadow: '0 0 20px rgba(238, 186, 48, 0.25)'
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                    <span>👥</span> RETAIL CROWD POSITIONING (CONTRARIAN PROXY)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">Broker sentiment split and crowded positioning warning</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  ESTIMATED (Broker Feed)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#050b16] p-3.5 rounded-xl border border-amber-500/20">
                <div>
                  <div className="text-xs text-slate-300">Retail Sentiment Split</div>
                  <div className="text-lg font-mono font-bold text-white mt-0.5">
                    {positions.crowd.retailLongPct}% Long / {100 - positions.crowd.retailLongPct}% Short
                  </div>
                  <div className="text-[10px] text-slate-400">Venue: {positions.crowd.venue}</div>
                </div>

                <div className="text-xs text-slate-200 max-w-md">
                  Contrarian Alert activates at <span className="text-amber-300 font-bold">≥ 75% Long</span> (Crowded Long Trap) or <span className="text-emerald-400 font-bold">≤ 35% Long</span> (Short Squeeze Fuel). Current status: Balanced.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT 4: DXY CROSS-CHECK */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'DXY' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, #071526 0%, #0b223d 50%, #102a4d 100%)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-sky-800/60 gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                  <span>💵</span> DXY CROSS-CHECK ("GOLD LONG HAI TO DXY KYA KAR SAKTA HAI?")
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Macro inverse correlation check: Room to resistance, downside targets, and invalidation limits.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono self-start sm:self-auto ${
                dxy.alignmentWithGold === 'ALIGNED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : dxy.alignmentWithGold === 'CONFLICT'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}>
                {dxy.alignmentWithGold}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Downside Room Card */}
              <div
                className="p-4 rounded-xl space-y-3 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, #061e1b 0%, #092c28 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    🟢 DXY Neeche Ja Sakta Hai? (Supports Gold Long)
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Room: <span className="text-emerald-400 font-bold">{dxy.downsideRoomAtr} ATR</span>
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#051613] p-3 rounded-lg border border-emerald-900/50">
                  {dxy.dxyCanGoDownHinglish}
                </p>
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Downside Triggers
                  </span>
                  <ul className="text-xs text-slate-200 space-y-1">
                    {dxy.triggersDown.map((trig, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400">•</span> {trig}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Upside Room Card */}
              <div
                className="p-4 rounded-xl space-y-3 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, #220b14 0%, #2e0e1b 100%)',
                  border: '1.5px solid rgba(244, 63, 94, 0.35)'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                    🔴 DXY Upar Ja Sakta Hai? (Risks Gold Long)
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Room: <span className="text-rose-400 font-bold">{dxy.upsideRoomAtr} ATR</span>
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#0d0509] p-3 rounded-lg border border-rose-900/50">
                  {dxy.dxyCanGoUpHinglish}
                </p>
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Upside Triggers (Gold Invalidation Risk)
                  </span>
                  <ul className="text-xs text-slate-200 space-y-1">
                    {dxy.triggersUp.map((trig, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-rose-400">•</span> {trig}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-[#050b16] border border-sky-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400">XAU/DXY 30d Correlation: </span>
                <span className="font-bold text-emerald-400">{dxy.correlations.xauDxy30d} (Normal Inverse)</span>
              </div>
              <div>
                <span className="text-slate-400">XAU/Real Yield 30d: </span>
                <span className="font-bold text-emerald-400">{dxy.correlations.xauRealYield30d}</span>
              </div>
              <div>
                <span className="text-slate-400">DXY Invalidation Level: </span>
                <span className="font-bold text-rose-400">{dxy.invalidationDxyLevel} (4H Close Above)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT 5: EVENTS & BLACKOUT WINDOWS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, #180d2b 0%, #241342 50%, #321a5c 100%)',
              border: '2px solid #a855f7',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-800/50 gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">
                  <span>📅</span> TIER-1 MACRO EVENT WINDOWS & STRICT BLACKOUT RULES
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">High-impact economic catalysts with mandatory execution blackout gates</p>
              </div>
              <span className="text-xs text-slate-300 font-mono">
                IST Execution Calendar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-purple-900/60 text-slate-300 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Time IST</th>
                    <th className="py-2.5 px-3">Impact Tier</th>
                    <th className="py-2.5 px-3">Forecast</th>
                    <th className="py-2.5 px-3">Previous</th>
                    <th className="py-2.5 px-3">Window Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/40">
                  {events.next24h.map((ev) => (
                    <tr key={ev.id} className="hover:bg-purple-950/30">
                      <td className="py-3 px-3 font-bold text-white">{ev.event}</td>
                      <td className="py-3 px-3 text-amber-300 font-bold">{ev.timeIST}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ev.tier === 1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          Tier {ev.tier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{ev.forecast}</td>
                      <td className="py-3 px-3 text-slate-400">{ev.previous}</td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-400 font-bold">Clear (Outside Blackout)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-[#0f081c] border border-purple-900/60 space-y-2 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Institutional Blackout Window Rules:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                1. No new leveraged Gold entries permitted 30 minutes before and 15 minutes after Tier-1 macro events (FOMC, CPI, NFP, US GDP).
              </p>
              <p className="text-slate-300 leading-relaxed">
                2. Post-event entry requires waiting for the first 15m candle close and a subsequent retest holding structural origin.
              </p>
              <p className="text-slate-300 leading-relaxed">
                3. Friday late session (post-23:30 IST): Position size reduced by 50% or flat exit to eliminate weekend gap risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT 6: FULL 11-SECTION HINGLISH REPORT */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'REPORT' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl p-5 shadow-xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, #0d1527 0%, #111f4d 50%, #1a153a 100%)',
              border: '2px solid #eeba30',
              boxShadow: '0 0 20px rgba(238, 186, 48, 0.25)'
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-amber-500/30 gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                  <span>📜</span> DEEEPR GOLD ENTRY REPORT (11 INSTITUTIONAL SECTIONS)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Simple Hinglish format with English numbers, tickers, and time IST.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyHinglishToClipboard}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 font-bold cursor-pointer shadow-sm"
                >
                  {copiedHinglish ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHinglish ? 'Copied Report!' : 'Copy Hinglish Report'}</span>
                </button>
                <button
                  onClick={copyJsonToClipboard}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 font-bold cursor-pointer shadow-sm"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>1️⃣</span> BOTTOM LINE (MASTER VERDICT & ZONE GRADE)
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.bottomLine}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>2️⃣</span> ENTRY KAHAN AUR KYUN
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.entryKahanAurKyun}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>3️⃣</span> STOP-LOSS KAHAN AUR KYUN
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.stopLossKahanAurKyun}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>4️⃣</span> TP1 / TP2 / TP3 KAHAN AUR KYUN
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.tpsKahanAurKyun}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>5️⃣</span> KYUN DIRECTION CHAIN (8-LAYER CONFLUENCE)
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.kyunDirectionChain}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>6️⃣</span> DXY KYA KAR SAKTA HAI (GOLD SE COMPARE)
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.dxyKyaKarSaktaHai}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>7️⃣</span> POSITIONS KAHAN OPEN HAIN (SMART MONEY VS RETAIL)
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.positionsKahanOpenHain}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>8️⃣</span> EVENTS / NEWS FILTER (WINDOW CHECK)
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.eventsFilter}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>9️⃣</span> OPPOSITE SIDE KA CASE (BEAR / BULL CASE)
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.oppositeSideCase}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>🔟</span> INVALIDATION AUR RISKS
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.invalidationAurRisks}</div>
              </div>

              <div className="bg-[#050b16] p-4 rounded-xl border border-amber-500/30">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>1️⃣1️⃣</span> DATA KI KAMI AUR REPORTING LAG
                </div>
                <div className="text-slate-200">{engineOutput.hinglishReportSections.dataKiKami}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. FOOTER DISCLAIMER */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="text-center text-[11px] text-slate-500 border-t border-slate-800/60 pt-4">
        {engineOutput.disclaimer}
      </div>
    </div>
  );
};
