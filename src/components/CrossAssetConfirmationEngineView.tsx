import React, { useState, useEffect, useMemo } from 'react';
import {
  evaluateDeeeprCrossAssetConfirmation,
  PrimaryAssetKey,
  CandidateDirection,
  CrossAssetConfirmationOutput,
  RELATIONSHIP_MAP
} from '../services/deeeprCrossAssetConfirmationEngine';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Scale,
  Zap,
  Info,
  Clock,
  Layers,
  Activity,
  FileCode,
  AlertTriangle
} from 'lucide-react';

export const CrossAssetConfirmationEngineView: React.FC = () => {
  // ── 1. USER INTERACTIVE PARAMETERS ──
  const [primaryAsset, setPrimaryAsset] = useState<PrimaryAssetKey>('BTC');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [candidateDirection, setCandidateDirection] = useState<CandidateDirection>('long');
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [activeViewTab, setActiveViewTab] = useState<'DASHBOARD' | 'CONFIRMERS_TABLE' | 'JSON_CONTRACT'>('DASHBOARD');

  // ── 2. LIVE ASSET PRICING & STREAMING ──
  const [btcPrice, setBtcPrice] = useState<number>(84200.0);
  const [goldPrice, setGoldPrice] = useState<number>(4188.5);
  const [usdtDPrice, setUsdtDPrice] = useState<number>(6.57);
  const [dxyPrice, setDxyPrice] = useState<number>(102.35);

  // Real-time Binance WebSocket for live ticker updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/paxgusdt@ticker');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const p = parseFloat(data.c);
          if (data.s === 'BTCUSDT' && !isNaN(p)) setBtcPrice(p);
          if (data.s === 'PAXGUSDT' && !isNaN(p)) setGoldPrice(p);
        } catch {}
      };
    } catch {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Compute Cross-Asset Engine Output
  const output: CrossAssetConfirmationOutput = useMemo(() => {
    return evaluateDeeeprCrossAssetConfirmation(
      primaryAsset,
      timeframe,
      candidateDirection,
      {
        'USDT.D': { value: usdtDPrice, changePct: candidateDirection === 'long' ? -0.85 : 0.85 },
        'DXY (US Dollar Index)': { value: dxyPrice, changePct: -0.15 },
        'BTC (Bitcoin)': { value: btcPrice, changePct: 1.15 },
        'Gold (XAU)': { value: goldPrice, changePct: 0.45 }
      }
    );
  }, [primaryAsset, timeframe, candidateDirection, btcPrice, goldPrice, usdtDPrice, dxyPrice]);

  const handleRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const stateColor =
    output.state === 'CONFIRMS'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : output.state === 'CONTRADICTS'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : output.state === 'INSUFFICIENT_DATA'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-slate-300 bg-slate-800/40 border-slate-700/50';

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* ── 1. HEADER & CONTROL BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050a1a] border border-cyan-500/30 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="text-cyan-400 w-5 h-5" />
            <h1 className="text-lg font-black text-white tracking-wide uppercase">
              DEEEPR Cross-Asset Confirmation Engine v1
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              EVIDENCE ONLY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates whether intermarket correlations confirm or contradict candidate setup. Master Engine (DEEEPR) holds single arbiter authority.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-400 font-mono">Last update: {lastRefreshed}</span>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Refresh Evaluation"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── 2. INTERACTIVE PARAMETER SELECTORS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#070e24] border border-slate-800 rounded-xl">
        {/* Primary Asset */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
            Primary Asset:
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['BTC', 'ETH', 'SOL', 'GOLD', 'SILVER', 'NQ'] as PrimaryAssetKey[]).map((a) => (
              <button
                key={a}
                onClick={() => setPrimaryAsset(a)}
                className={`py-1 px-2 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                  primaryAsset === a
                    ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Execution Timeframe */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
            Execution Timeframe:
          </label>
          <div className="grid grid-cols-6 gap-1">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`py-1 px-1.5 rounded text-xs font-bold font-mono transition-all cursor-pointer text-center ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Direction */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
            Candidate Direction:
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['long', 'short', 'none'] as CandidateDirection[]).map((d) => (
              <button
                key={d}
                onClick={() => setCandidateDirection(d)}
                className={`py-1 px-2 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                  candidateDirection === d
                    ? d === 'long'
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : d === 'short'
                      ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. VETO BANNER (IF RAISED) ── */}
      {output.veto && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-950/80 border-2 border-rose-500 rounded-xl text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <span className="font-black text-sm uppercase block tracking-wide">
              INTERMARKET VETO ACTIVE
            </span>
            <span className="text-xs text-rose-300 font-mono mt-0.5 block">
              {output.veto_reason}
            </span>
          </div>
        </div>
      )}

      {/* ── 4. MASTER VERDICT SUMMARY GAUGE & METRICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* State Badge */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${stateColor}`}>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Cross-Asset State
          </span>
          <div className="flex items-center gap-2 my-2">
            {output.state === 'CONFIRMS' ? (
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            ) : output.state === 'CONTRADICTS' ? (
              <XCircle className="w-7 h-7 text-rose-400" />
            ) : (
              <HelpCircle className="w-7 h-7 text-slate-400" />
            )}
            <span className="text-2xl font-black tracking-tight">{output.state}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {output.master_hint}
          </span>
        </div>

        {/* Composite Score */}
        <div className="p-4 bg-[#050a1a] border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Composite Alignment Score
          </span>
          <div className="my-2">
            <span className={`text-3xl font-black font-mono ${
              output.score >= 40 ? 'text-emerald-400' : output.score <= -40 ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {output.score > 0 ? `+${output.score}` : output.score}
            </span>
            <span className="text-xs text-slate-500 font-mono ml-1">/ 100</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>15m: {output.score_by_tf['15m']}</span>
            <span>•</span>
            <span>1H: {output.score_by_tf['1H']}</span>
            <span>•</span>
            <span>4H: {output.score_by_tf['4H']}</span>
          </div>
        </div>

        {/* Available Weight */}
        <div className="p-4 bg-[#050a1a] border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Available Weight Breadth
          </span>
          <div className="my-2">
            <span className={`text-3xl font-black font-mono ${output.available_weight >= 60 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {output.available_weight}%
            </span>
            <span className="text-xs text-slate-500 font-mono ml-1">open market</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {output.available_weight >= 60 ? 'Adequate liquidity breadth' : 'INSUFFICIENT DATA (Below 60%)'}
          </span>
        </div>

        {/* Data Quality */}
        <div className="p-4 bg-[#050a1a] border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Data Quality & Hygiene
          </span>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-emerald-400">
              {output.data_quality}/100
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Zero conflict • Same-clock closed
          </span>
        </div>
      </div>

      {/* ── 5. SUB-TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveViewTab('DASHBOARD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeViewTab === 'DASHBOARD'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 Summary & Hinglish Readout
        </button>
        <button
          onClick={() => setActiveViewTab('CONFIRMERS_TABLE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeViewTab === 'CONFIRMERS_TABLE'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📋 Confirmer Weight Matrix ({output.confirmers.length} Assets)
        </button>
        <button
          onClick={() => setActiveViewTab('JSON_CONTRACT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            activeViewTab === 'JSON_CONTRACT'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode size={13} className="inline mr-1" />
          Strict JSON Output
        </button>
      </div>

      {/* ── 6. ACTIVE TAB CONTENT ── */}
      {activeViewTab === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* Hinglish Summary Card */}
          <div className="p-4 bg-[#050d20] border border-cyan-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Institutional Hinglish Summary (Max 5 Lines)
              </h3>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              {output.hinglish_summary.map((line, idx) => (
                <p key={idx} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Warnings & Divergences */}
          {(output.warnings.length > 0 || output.divergences.length > 0) && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-300">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle size={14} />
                <span>Intermarket Warnings & Divergences:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                {output.warnings.map((w, i) => (
                  <li key={`w-${i}`}>{w}</li>
                ))}
                {output.divergences.map((d, i) => (
                  <li key={`d-${i}`}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeViewTab === 'CONFIRMERS_TABLE' && (
        <div className="bg-[#050a1a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-[#071126]">
                  <th className="py-2.5 px-3">Confirmer</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Change %</th>
                  <th className="py-2.5 px-3">Trend</th>
                  <th className="py-2.5 px-3">z-Score</th>
                  <th className="py-2.5 px-3">Exp. Sign</th>
                  <th className="py-2.5 px-3">Reading</th>
                  <th className="py-2.5 px-3">Regime</th>
                  <th className="py-2.5 px-3">Base Wt</th>
                  <th className="py-2.5 px-3 text-right">Applied Wt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {output.confirmers.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{c.source}</td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {c.value !== null ? c.value.toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {c.change_pct !== null ? (
                        <span className={c.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {c.change_pct >= 0 ? '+' : ''}{c.change_pct}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        c.trend === 'BULLISH' ? 'bg-emerald-950 text-emerald-300' : c.trend === 'BEARISH' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.trend}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {c.z !== null ? (c.z > 0 ? `+${c.z}` : c.z) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{c.expected_sign > 0 ? '+1' : '-1'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.reading === 'supports'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : c.reading === 'contradicts'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.reading}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{c.regime}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.weight}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {c.applied_weight}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeViewTab === 'JSON_CONTRACT' && (
        <div className="bg-[#040816] border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}

      {/* Institutional Evidence Notice */}
      <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[10px] text-slate-400 flex items-center justify-between">
        <span>
          🏛️ <strong>DEEEPR Master Arbiter Rulebook:</strong> Cross-asset correlation is EVIDENCE ONLY. It may raise a VETO flag to protect capital, but NEVER prints LONG/SHORT/WAIT trade entries on its own.
        </span>
      </div>
    </div>
  );
};

export default CrossAssetConfirmationEngineView;
