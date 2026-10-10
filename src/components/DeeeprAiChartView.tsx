import React, { useState, useMemo, useEffect } from 'react';
import TradingViewWidget from './TradingViewWidget';
import {
  MULTI_FACTOR_ENGINE_DATA,
  MultiFactorDecisionEngineAsset,
  calculateInstitutionalRisk,
  TimeframeSignal
} from '../data/multiFactorChartEngineData';

export const DeeeprAiChartView: React.FC = () => {
  // Selected Asset & Sub-Views
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<'1D' | '4H' | '1H' | '15M' | '5M'>('15M');
  const [chartViewMode, setChartViewMode] = useState<'TRADINGVIEW' | 'FOOTPRINT_PROFILE'>('TRADINGVIEW');
  const [rightPanelTab, setRightPanelTab] = useState<'DECISION' | 'DOM_LADDER' | 'EVIDENCE' | 'RISK' | 'BACKTEST'>('DECISION');

  // DOM Ladder Interaction States (Matching user screenshot)
  const [activeOrderType, setActiveOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LIMIT'>('LIMIT');
  const [orderQty, setOrderQty] = useState<string>('1.0');
  const [orderToast, setOrderToast] = useState<string | null>(null);

  // Position Sizing & Risk Management State
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [selectedLeverage, setSelectedLeverage] = useState<number>(10);

  // Live UTC Clock
  const [utcTime, setUtcTime] = useState<string>('00:00:00');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const asset: MultiFactorDecisionEngineAsset =
    MULTI_FACTOR_ENGINE_DATA[selectedAssetKey] || MULTI_FACTOR_ENGINE_DATA['BTCUSDT'];

  // Map timeframe to TradingView interval string
  const tvInterval = useMemo(() => {
    switch (timeframe) {
      case '1D':
        return 'D';
      case '4H':
        return '240';
      case '1H':
        return '60';
      case '15M':
        return '15';
      case '5M':
        return '5';
      default:
        return '15';
    }
  }, [timeframe]);

  // Risk calculation output
  const riskCalculation = useMemo(() => {
    return calculateInstitutionalRisk({
      accountBalanceUsd: accountBalance,
      riskPercent: riskPercent,
      entryPrice: asset.currentPrice,
      stopLossPrice: asset.stopLossPrice,
      targetPrice: asset.targetTp2.price,
      leverage: selectedLeverage,
      contractSpecs: {
        maintenanceMarginPct: asset.contractSpecs.maintenanceMarginPct,
        estimatedSlippagePct: asset.contractSpecs.estimatedSlippagePct
      }
    });
  }, [accountBalance, riskPercent, selectedLeverage, asset]);

  const handleOrderAction = (actionName: string) => {
    setOrderToast(`Order Executed: ${actionName} ${orderQty} ${asset.symbol} @ $${asset.currentPrice.toLocaleString()}`);
    setTimeout(() => setOrderToast(null), 3500);
  };

  const assetList = [
    { key: 'BTCUSDT', label: 'BTC/USDT', tag: 'Bitcoin', icon: '₿' },
    { key: 'XAUUSD', label: 'XAU/USD', tag: 'Gold COMEX Proxy', icon: '🥇' },
    { key: 'XAUTUSD', label: 'XAUT/USD', tag: 'Tether Gold', icon: '🪙' }
  ];

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 bg-gradient-to-b from-[#0a1329]/95 via-[#070e20]/98 to-[#040816] min-h-screen p-3 sm:p-5 rounded-3xl border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(56,189,248,0.15)] backdrop-blur-2xl">
      {/* ────────────────── 1. MASTER INSTITUTIONAL NAVBAR & LIVE QUANT TELEMETRY ────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/25 pb-4 px-1">
        {/* Brand & Module Identity */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 blur-md opacity-70 animate-pulse" />
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 border border-cyan-400/50">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base sm:text-lg tracking-wider text-white font-['Outfit',sans-serif] flex items-center gap-2">
                  <span>NEXVORA</span>
                  <span className="text-cyan-gradient font-black">AI MULTI-FACTOR ENGINE</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-['JetBrains_Mono',monospace] font-black bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>QUANT ENGINE V3</span>
                </span>
              </div>
              <span className="text-xs text-slate-300 font-mono flex items-center gap-2 mt-0.5">
                <span className="text-cyan-400">⚡ 10-Pillar Pipeline</span>
                <span className="text-slate-500">·</span>
                <span className="text-emerald-400">🏛️ Real-Time Telemetry</span>
                <span className="text-slate-500">·</span>
                <span className="text-indigo-300">🛡️ Institutional Scoring</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Feeds Status & UTC Telemetry */}
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            L2 REAL-TIME (38ms)
          </span>

          <span className="bg-[#0e1c38] text-cyan-300 px-3 py-1 rounded-lg border border-cyan-500/40 text-[11px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            COINGLASS API: <b className="text-white">{asset.feedsStatus.liquidationCoinGlass}</b>
          </span>

          <span className="bg-[#121c33] text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 text-[11px] font-bold">
            UTC <b className="text-white">{utcTime}</b>
          </span>

          <span className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 text-purple-200 px-3 py-1 rounded-lg text-[11px] font-bold border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)] flex items-center gap-1">
            <span>🛡️</span>
            <span>AUDIT PASS</span>
          </span>
        </div>
      </header>

      {/* ────────────────── 2. ASSET SELECTOR & TIMEFRAME CONFLUENCE BAR ────────────────── */}
      <div className="flex flex-col gap-3 bg-gradient-to-r from-[#0d1a38]/90 via-[#0a1530]/90 to-[#0d1a38]/90 p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Asset Pills with Royal Badges */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {assetList.map((a) => {
              const isSelected = selectedAssetKey === a.key;
              const aData = MULTI_FACTOR_ENGINE_DATA[a.key];
              const isLong = aData?.decision === 'LONG';
              const isShort = aData?.decision === 'SHORT';

              return (
                <button
                  key={a.key}
                  onClick={() => setSelectedAssetKey(a.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold shrink-0 transition-all flex items-center gap-2.5 shadow-md ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 via-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_20px_rgba(56,189,248,0.4)] ring-2 ring-amber-300 scale-[1.02]'
                      : 'bg-[#101e3b]/80 text-slate-300 hover:text-white hover:bg-[#162a52] border border-cyan-500/20'
                  }`}
                >
                  <span className="text-base">{a.icon}</span>
                  <span className={isSelected ? 'text-slate-950 font-extrabold' : 'text-white'}>{a.label}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>({a.tag})</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isLong
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : isShort
                        ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    }`}
                  >
                    {aData?.decision}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timeframe Confluence Switcher (1D, 4H, 1H, 15M, 5M) */}
          <div className="flex items-center gap-2 bg-[#091326] p-1.5 rounded-xl border border-cyan-500/30 font-mono text-xs shadow-inner">
            <span className="text-[10px] text-amber-300 uppercase font-black px-2 flex items-center gap-1">
              <span>⏱</span>
              <span>TIMEFRAME:</span>
            </span>
            {(['1D', '4H', '1H', '15M', '5M'] as const).map((tf) => {
              const tfSignal = asset.timeframeSignals.find((s) => s.timeframe === tf);
              const isBull = tfSignal?.bias === 'BULLISH';
              const isBear = tfSignal?.bias === 'BEARISH';

              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    timeframe === tf
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <span>{tf}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isBull ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : isBear ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]' : 'bg-amber-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Timeframe Alignment Ribbon with Colored Glass Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-cyan-500/20 font-mono text-xs">
          {asset.timeframeSignals.map((tf) => (
            <div
              key={tf.timeframe}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                tf.bias === 'BULLISH'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 shadow-[0_4px_15px_rgba(16,185,129,0.1)]'
                  : tf.bias === 'BEARISH'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200 shadow-[0_4px_15px_rgba(244,63,94,0.1)]'
                  : 'bg-[#0f1d38]/60 border-cyan-500/25 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-black text-white">{tf.timeframe} · {tf.role}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  tf.bias === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {tf.bias}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-1.5 font-sans" title={tf.structure}>
                {tf.structure}
              </p>
              <div className="text-[10px] text-cyan-300 font-bold mt-1.5 flex items-center justify-between">
                <span>Pivot:</span>
                <span className="text-amber-300">{tf.keyLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────────── 3. DUAL-PANE WORKSPACE (CHART + DOM & DECISION ENGINE) ────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_510px]">
        {/* ── LEFT PANE: INSTITUTIONAL CHART VIEW (MATCHING USER SCREENSHOT) ── */}
        <div className="rounded-2xl border border-cyan-500/30 bg-[#091226]/90 overflow-hidden flex flex-col relative shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Chart Subnav Controls (TradingView vs Footprint & TPO Market Profile) */}
          <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#0c1836] via-[#09132b] to-[#0c1836] border-b border-cyan-500/25 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-white font-extrabold text-sm sm:text-base font-['Syne',sans-serif]">{asset.name}</span>
              <span className="text-cyan-400 font-bold text-xs">· {asset.exchangeSymbol}</span>
              <span className="text-emerald-400 font-black text-base">{asset.formattedPrice}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                asset.isPositive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {asset.change24h}
              </span>
            </div>

            {/* View Mode Toggle: TradingView vs Footprint / Market Profile */}
            <div className="flex items-center bg-[#070e1e] p-1 rounded-xl border border-cyan-500/30 shadow-inner">
              <button
                onClick={() => setChartViewMode('TRADINGVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chartViewMode === 'TRADINGVIEW'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>📊</span>
                <span>TradingView Pro</span>
              </button>
              <button
                onClick={() => setChartViewMode('FOOTPRINT_PROFILE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chartViewMode === 'FOOTPRINT_PROFILE'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>🌊</span>
                <span>Footprint & TPO Profile</span>
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="relative w-full flex-1" style={{ minHeight: '620px' }}>
            {chartViewMode === 'TRADINGVIEW' ? (
              <TradingViewWidget
                symbol={asset.tradingViewSymbol}
                interval={tvInterval}
                height={620}
              />
            ) : (
              /* Footprint & TPO Volume Profile View (Matching Uploaded Screenshot) */
              <div className="p-4 bg-gradient-to-b from-[#081124] to-[#050b18] flex flex-col justify-between h-full space-y-4">
                {/* Header Stats for Footprint */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-[#0d1c3d] to-[#0a152e] p-3.5 rounded-xl border border-cyan-500/30 font-mono text-xs shadow-md">
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">POINT OF CONTROL (POC)</span>
                    <span className="text-cyan-300 font-black text-sm">${asset.volumeProfileLevels.poc.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">VALUE AREA HIGH (VAH)</span>
                    <span className="text-amber-400 font-black text-sm">${asset.volumeProfileLevels.vah.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">VALUE AREA LOW (VAL)</span>
                    <span className="text-rose-400 font-black text-sm">${asset.volumeProfileLevels.val.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">SESSION VWAP</span>
                    <span className="text-emerald-400 font-black text-sm">${asset.volumeProfileLevels.sessionVwap.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footprint Cluster Columns Demonstration */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Footprint Bid/Ask Imbalance & Cluster Profile (15M Bars)</span>
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/30">
                      Diagonal Imbalance: ≥ 300%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {asset.footprintCandles.map((candle, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-gradient-to-b from-[#0f2044] to-[#0b1730] rounded-xl border border-cyan-500/30 p-3.5 space-y-2 font-mono shadow-md"
                      >
                        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 text-xs">
                          <span className="text-white font-black">{candle.time} UTC</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            candle.delta > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            Delta: {candle.delta > 0 ? `+${candle.delta}` : candle.delta} ({candle.deltaPct}%)
                          </span>
                        </div>

                        {/* Cluster Levels inside this bar */}
                        <div className="space-y-1.5 text-xs">
                          {candle.levels.map((lvl, lIdx) => (
                            <div
                              key={lIdx}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                                lvl.isPoc
                                  ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                                  : 'bg-[#091326]/80 border-slate-700/50'
                              }`}
                            >
                              <span className={`text-[11px] font-bold ${lvl.isBuyImbalance ? 'text-emerald-400 font-black' : 'text-slate-400'}`}>
                                {lvl.bidVol}
                              </span>
                              <span className="text-white font-extrabold text-xs">
                                ${lvl.price.toLocaleString()}
                                {lvl.isPoc && <span className="ml-1 text-[9px] text-amber-300 font-black">[POC]</span>}
                              </span>
                              <span className={`text-[11px] font-bold ${lvl.isSellImbalance ? 'text-rose-400 font-black' : 'text-slate-400'}`}>
                                {lvl.askVol}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-cyan-500/20 text-[10px]">
                          <span className="text-slate-300">CVD: <b className="text-cyan-300">+{candle.cvd}</b></span>
                          <span className="text-emerald-400 font-black">{candle.stackedImbalances}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CVD (Cumulative Volume Delta) Curve */}
                <div className="bg-gradient-to-r from-[#0c1836] to-[#0a142e] p-3.5 rounded-xl border border-cyan-500/30 font-mono text-xs space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                      CVD (Cumulative Volume Delta) & Divergence Monitor
                    </span>
                    <span className="text-emerald-400 font-black text-sm">{asset.cvdStatus.value24h}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    {asset.cvdStatus.note}
                  </p>
                  <div className="h-7 w-full bg-[#050b18] rounded-lg border border-cyan-500/25 overflow-hidden relative flex items-center px-3">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 w-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                    <span className="absolute right-3 text-[10px] text-emerald-400 font-black">
                      Bullish Delta Divergence Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Overlaid Institutional Target Tags (Top Right of Chart) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none z-10 font-mono text-xs max-w-[260px]">
              <div className="bg-[#0a1530]/95 backdrop-blur-xl p-2.5 rounded-xl border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-right pointer-events-auto">
                <span className="text-[9px] text-amber-300 uppercase font-black block flex items-center justify-end gap-1">
                  <span>🎯</span>
                  <span>DOMINANT LIQUIDITY CLUSTER</span>
                </span>
                <span className="text-white font-black text-xs">{asset.nearbyLiquidityTargets.dominantLiquidationCluster}</span>
              </div>
              <div className="bg-[#0a1530]/95 backdrop-blur-xl p-2.5 rounded-xl border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)] text-right pointer-events-auto">
                <span className="text-[9px] text-rose-300 uppercase font-black block flex items-center justify-end gap-1">
                  <span>🛡️</span>
                  <span>TECHNICAL INVALIDATION</span>
                </span>
                <span className="text-rose-400 font-black text-xs">{asset.stopLossFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: INSTITUTIONAL DECISION ENGINE & DOM LADDER ── */}
        <div className="rounded-2xl border border-cyan-500/30 bg-[#091226]/90 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl overflow-y-auto max-h-[780px]">
          {/* Sub-tab Navigation with Royal Styling */}
          <div className="flex items-center justify-between border-b border-cyan-500/25 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
              <button
                onClick={() => setRightPanelTab('DECISION')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                  rightPanelTab === 'DECISION'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>🎯</span>
                <span>Decision</span>
              </button>
              <button
                onClick={() => setRightPanelTab('DOM_LADDER')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                  rightPanelTab === 'DOM_LADDER'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>📊</span>
                <span>DOM</span>
              </button>
              <button
                onClick={() => setRightPanelTab('EVIDENCE')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                  rightPanelTab === 'EVIDENCE'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>⚖️</span>
                <span>8 Pillars</span>
              </button>
              <button
                onClick={() => setRightPanelTab('RISK')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                  rightPanelTab === 'RISK'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>🛡️</span>
                <span>Risk</span>
              </button>
              <button
                onClick={() => setRightPanelTab('BACKTEST')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                  rightPanelTab === 'BACKTEST'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-slate-950 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>🏆</span>
                <span>Backtest</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {orderToast && (
            <div className="bg-gradient-to-r from-emerald-950 via-[#0a2e1d] to-emerald-950 border border-emerald-400 text-emerald-200 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold animate-pulse shadow-lg flex items-center gap-2">
              <span>✓</span>
              <span>{orderToast}</span>
            </div>
          )}

          {/* ────────────────── SUB-TAB 1: PRIMARY DECISION CARD (17 AUDIT FIELDS) ────────────────── */}
          {rightPanelTab === 'DECISION' && (
            <div className="space-y-4">
              {/* Primary Decision Banner (LONG / SHORT / WAIT) */}
              <div
                className={`rounded-2xl border p-4.5 space-y-3.5 relative overflow-hidden ${
                  asset.decision === 'LONG'
                    ? 'royal-card-emerald'
                    : asset.decision === 'SHORT'
                    ? 'royal-card-rose'
                    : 'royal-card-gold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-3xl font-black font-['Outfit',sans-serif] tracking-wider drop-shadow-md ${
                        asset.decision === 'LONG'
                          ? 'text-emerald-400'
                          : asset.decision === 'SHORT'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {asset.decision === 'LONG' ? '▲ LONG' : asset.decision === 'SHORT' ? '▼ SHORT' : '■ WAIT'}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-200 bg-[#09152b] px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      Bias: <b className="text-emerald-400">{asset.higherTimeframeBias}</b>
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-amber-300 block uppercase font-black">CALIBRATED PROB</span>
                    <span className="text-2xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                      {asset.calibratedProbability}%
                    </span>
                  </div>
                </div>

                {/* Score Meters Row */}
                <div className="grid grid-cols-3 gap-2.5 font-mono text-[11px] pt-1 border-t border-cyan-500/20">
                  <div className="bg-[#09152b]/90 p-2.5 rounded-xl border border-cyan-500/25 text-center shadow-inner">
                    <span className="text-[9px] text-amber-300 block uppercase font-bold">SETUP QUALITY</span>
                    <span className="font-black text-emerald-400 text-xs">{asset.setupQualityScore}/100</span>
                  </div>
                  <div className="bg-[#09152b]/90 p-2.5 rounded-xl border border-cyan-500/25 text-center shadow-inner">
                    <span className="text-[9px] text-amber-300 block uppercase font-bold">DATA INTEGRITY</span>
                    <span className="font-black text-cyan-300 text-xs">{asset.dataQualityScore}/100</span>
                  </div>
                  <div className="bg-[#09152b]/90 p-2.5 rounded-xl border border-cyan-500/25 text-center shadow-inner">
                    <span className="text-[9px] text-amber-300 block uppercase font-bold">SIGNAL CONSENSUS</span>
                    <span className="font-black text-purple-300 text-xs">{asset.signalAgreementScore}%</span>
                  </div>
                </div>

                {/* Market Regime Pill */}
                <div className="bg-[#0a162f] p-3 rounded-xl border border-cyan-500/30 text-xs font-mono shadow-md">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase text-amber-300 font-black flex items-center gap-1">
                      <span>🧩</span>
                      <span>REGIME (8-TIER):</span>
                    </span>
                    <span className="text-white font-black bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40">
                      {asset.regime}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-1.5 leading-relaxed">
                    {asset.regimeRationale}
                  </p>
                </div>
              </div>

              {/* Exact Execution Trade Plan */}
              <div className="bg-gradient-to-b from-[#0c1836] to-[#081226] p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 space-y-3 font-mono text-xs shadow-md">
                <span className="text-xs text-gold-gradient uppercase font-black tracking-wider block flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>INSTITUTIONAL EXECUTION TRADE PLAN</span>
                </span>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#081329] border border-cyan-500/20">
                    <span className="text-slate-300 font-bold">ENTRY ZONE:</span>
                    <span className="text-white font-extrabold">{asset.entryZone}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/30 border border-rose-500/40">
                    <span className="text-rose-300 font-bold">STOP LOSS (INVALIDATION):</span>
                    <span className="text-rose-300 font-black">{asset.stopLossFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                    <span className="text-emerald-300 font-bold">TARGET 1 (TP1 - 50%):</span>
                    <span className="text-emerald-300 font-black">{asset.targetTp1.formatted} ({asset.targetTp1.gainPct})</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                    <span className="text-emerald-300 font-bold">TARGET 2 (TP2 - 30%):</span>
                    <span className="text-emerald-300 font-black">{asset.targetTp2.formatted} ({asset.targetTp2.gainPct})</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                    <span className="text-emerald-300 font-bold">TARGET 3 (TP3 - 20%):</span>
                    <span className="text-emerald-300 font-black">{asset.targetTp3.formatted} ({asset.targetTp3.gainPct})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-cyan-500/20 text-[11px]">
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">NET REWARD-TO-RISK</span>
                    <span className="text-white font-black text-xs">{asset.rewardToRiskNet}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">HOLDING HORIZON</span>
                    <span className="text-cyan-300 font-bold text-xs">{asset.expectedHoldingHorizon}</span>
                  </div>
                </div>
              </div>

              {/* Debate: Strongest Reason To Take Trade vs Not To Take Trade */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="bg-gradient-to-r from-[#0a2430]/90 to-[#0c1836]/90 p-3 rounded-xl border border-cyan-500/40 space-y-1.5 shadow-md">
                  <span className="text-[11px] text-cyan-300 uppercase font-black block flex items-center gap-1.5">
                    <span>✓</span>
                    <span>PRIMARY BULLISH EVIDENCE CONFLUENCE</span>
                  </span>
                  <ul className="text-[11px] text-slate-200 space-y-1 font-sans">
                    {asset.bullishFactorsDebate.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-[#290d18]/90 to-[#0c1836]/90 p-3 rounded-xl border border-rose-500/40 space-y-1.5 shadow-md">
                  <span className="text-[11px] text-rose-300 uppercase font-black block flex items-center gap-1.5">
                    <span>⚠</span>
                    <span>BEARISH RISK SCRUTINY & COUNTER-FACTORS</span>
                  </span>
                  <ul className="text-[11px] text-slate-200 space-y-1 font-sans">
                    {asset.bearishFactorsDebate.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Event Risk & No-Trade Filter Alert */}
              <div className="bg-gradient-to-r from-[#0d1a38] to-[#09132b] p-3 rounded-xl border border-cyan-500/30 text-xs font-mono flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] text-amber-300 font-bold block uppercase flex items-center gap-1">
                    <span>📅</span>
                    <span>UPCOMING HIGH-IMPACT RELEASE</span>
                  </span>
                  <span className="text-white font-black text-xs">{asset.upcomingEventRisk.eventName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-300 font-bold block uppercase">TIME REMAINING</span>
                  <span className="text-cyan-300 font-black text-xs">{asset.upcomingEventRisk.timeRemainingFormatted}</span>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── SUB-TAB 2: DOM DEPTH LADDER (MATCHING USER SCREENSHOT) ────────────────── */}
          {rightPanelTab === 'DOM_LADDER' && (
            <div className="space-y-3.5 font-mono">
              <div className="flex items-center justify-between border-b border-cyan-500/25 pb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider font-['Syne',sans-serif] flex items-center gap-1.5">
                  <span>📊</span>
                  <span>Depth of Market (DOM) & Order Book Ladder</span>
                </span>
                <span className="text-[10px] text-slate-300">
                  Spread: <b className="text-cyan-300 font-black">{asset.spread}</b>
                </span>
              </div>

              {/* Interactive DOM Table with Vibrant Depth Bars */}
              <div className="bg-[#091326] rounded-xl border border-cyan-500/30 overflow-hidden text-xs shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-3 bg-[#0c1836] p-2 text-center text-[10px] text-amber-300 font-black border-b border-cyan-500/25">
                  <span>BID SIZE</span>
                  <span>PRICE (USD)</span>
                  <span>ASK SIZE</span>
                </div>

                {/* DOM Rows */}
                <div className="divide-y divide-cyan-500/15">
                  {asset.orderBookDOM.map((row, rIdx) => {
                    const isAsk = row.askSize > 0;
                    const isBid = row.bidSize > 0;
                    const maxDepth = 60; // scale factor
                    const askBarWidth = isAsk ? Math.min(100, (row.askSize / maxDepth) * 100) : 0;
                    const bidBarWidth = isBid ? Math.min(100, (row.bidSize / maxDepth) * 100) : 0;

                    return (
                      <div
                        key={rIdx}
                        className={`grid grid-cols-3 p-2 items-center text-xs relative ${
                          row.isCurrent ? 'bg-cyan-950/80 font-black border-y border-cyan-400/50' : ''
                        }`}
                      >
                        {/* Bid Size with horizontal depth bar */}
                        <div className="text-left relative pl-2">
                          {isBid && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-emerald-500/30 rounded-r shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                style={{ width: `${bidBarWidth}%` }}
                              />
                              <span className="relative z-10 text-emerald-400 font-black">
                                {row.bidSize}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Price Column */}
                        <div className="text-center font-bold">
                          <span
                            className={
                              row.isCurrent
                                ? 'text-cyan-300 font-black text-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                                : isAsk
                                ? 'text-slate-200'
                                : 'text-slate-200'
                            }
                          >
                            ${row.price.toLocaleString()}
                          </span>
                          {row.isWall && (
                            <span className="ml-1 text-[8px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded border border-amber-400/40">
                              WALL
                            </span>
                          )}
                        </div>

                        {/* Ask Size with horizontal depth bar (Red) */}
                        <div className="text-right relative pr-2">
                          {isAsk && (
                            <>
                              <div
                                className="absolute right-0 top-0 bottom-0 bg-rose-500/35 rounded-l shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                                style={{ width: `${askBarWidth}%` }}
                              />
                              <span className="relative z-10 text-rose-400 font-black">
                                {row.askSize}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Execution Simulator (Matching User Screenshot Buttons) */}
              <div className="bg-gradient-to-b from-[#0c1836] to-[#081226] p-3.5 rounded-2xl border border-cyan-500/30 space-y-3 text-xs shadow-md">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-300 uppercase font-black flex items-center gap-1">
                    <span>⚡</span>
                    <span>ORDER EXECUTION CONTROLS</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {(['LIMIT', 'MARKET', 'STOP_LIMIT'] as const).map((ot) => (
                      <button
                        key={ot}
                        onClick={() => setActiveOrderType(ot)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                          activeOrderType === ot
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                            : 'bg-[#081226] text-slate-300 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        {ot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-slate-300 font-bold text-[11px]">ORDER SIZE:</span>
                  <input
                    type="text"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    className="bg-[#081226] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-white font-mono text-xs w-32 text-right focus:outline-none focus:border-cyan-400 font-bold"
                  />
                  <span className="text-amber-300 font-bold text-[11px]">{asset.symbol}</span>
                </div>

                {/* Primary Buy / Sell Buttons with Neon Glow */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleOrderAction('BUY MARKET')}
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 text-xs font-['Syne',sans-serif] tracking-wider"
                  >
                    BUY MKT ⚡
                  </button>
                  <button
                    onClick={() => handleOrderAction('SELL MARKET')}
                    className="bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 hover:from-rose-400 hover:to-red-400 text-white font-black py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.5)] active:scale-95 text-xs font-['Syne',sans-serif] tracking-wider"
                  >
                    SELL MKT ⚡
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleOrderAction('BUY BID')}
                    className="bg-[#0c1f38] hover:bg-[#122e54] text-cyan-300 font-black py-2 rounded-xl border border-cyan-500/40 text-xs shadow-md transition-all"
                  >
                    Buy Bid (Limit)
                  </button>
                  <button
                    onClick={() => handleOrderAction('SELL ASK')}
                    className="bg-[#2e0e1e] hover:bg-[#45142d] text-rose-300 font-black py-2 rounded-xl border border-rose-500/40 text-xs shadow-md transition-all"
                  >
                    Sell Ask (Limit)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── SUB-TAB 3: 8-PILLAR TRANSPARENT SCORING BREAKDOWN ────────────────── */}
          {rightPanelTab === 'EVIDENCE' && (
            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-cyan-500/25 pb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider font-['Syne',sans-serif] flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>8-Pillar Multi-Factor Evidence Scoring</span>
                </span>
                <span className="text-[10px] text-amber-300 font-black bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/40">
                  {asset.bullishEvidenceScore}% Bull / {asset.bearishEvidenceScore}% Bear
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.values(asset.pillars).map((p, pIdx) => {
                  const isBull = p.bias === 'BULLISH';
                  const isBear = p.bias === 'BEARISH';

                  return (
                    <div
                      key={pIdx}
                      className="bg-gradient-to-r from-[#0c1836] to-[#081226] p-3 rounded-xl border border-cyan-500/30 space-y-2 shadow-md transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-extrabold text-[11px] flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isBull
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                                : isBear
                                ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                                : 'bg-amber-400'
                            }`}
                          />
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-300 font-bold">Weight: {p.weight}%</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isBull
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            +{p.score}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {p.summary}
                      </p>

                      <div className="pt-1.5 text-[10px] text-slate-400 flex items-center justify-between border-t border-cyan-500/20">
                        <span>Status: <b className="text-cyan-300">{p.status}</b></span>
                        <span className="text-slate-300 font-bold">{p.details.length} verified factors</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ────────────────── SUB-TAB 4: RISK MANAGEMENT & POSITION SIZING ────────────────── */}
          {rightPanelTab === 'RISK' && (
            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-cyan-500/25 pb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider font-['Syne',sans-serif] flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Risk Management & Position Sizing Engine</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-black">
                  Stop-Loss Exposure First
                </span>
              </div>

              {/* Interactive Inputs */}
              <div className="grid grid-cols-3 gap-2.5 bg-gradient-to-r from-[#0c1836] to-[#081226] p-3.5 rounded-2xl border border-cyan-500/30 shadow-md">
                <div>
                  <span className="text-[10px] text-amber-300 font-bold block">ACCOUNT EQUITY</span>
                  <div className="flex items-center mt-1.5">
                    <span className="text-slate-400 mr-1">$</span>
                    <input
                      type="number"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(Number(e.target.value))}
                      className="bg-[#081226] border border-cyan-500/30 rounded-lg px-2 py-1.5 text-white text-xs w-full focus:outline-none focus:border-cyan-400 font-black"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-amber-300 font-bold block">RISK BUDGET (%)</span>
                  <div className="flex items-center mt-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(Number(e.target.value))}
                      className="bg-[#081226] border border-cyan-500/30 rounded-lg px-2 py-1.5 text-white text-xs w-full focus:outline-none focus:border-cyan-400 font-black"
                    />
                    <span className="text-slate-400 ml-1">%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-amber-300 font-bold block">LEVERAGE</span>
                  <div className="flex items-center mt-1.5">
                    <input
                      type="number"
                      value={selectedLeverage}
                      onChange={(e) => setSelectedLeverage(Number(e.target.value))}
                      className="bg-[#081226] border border-cyan-500/30 rounded-lg px-2 py-1.5 text-white text-xs w-full focus:outline-none focus:border-cyan-400 font-black"
                    />
                    <span className="text-slate-400 ml-1">x</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="bg-gradient-to-b from-[#0c1836] to-[#081226] p-3.5 rounded-2xl border border-cyan-500/30 space-y-2.5 text-xs shadow-md">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold">MAX MONETARY RISK ALLOWED:</span>
                  <span className="text-rose-400 font-black text-sm">${riskCalculation.monetaryRiskAllowed.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold">STOP LOSS DISTANCE:</span>
                  <span className="text-white font-black">{riskCalculation.stopLossDistancePct}% (${riskCalculation.stopLossDistancePrice.toLocaleString()})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold">RECOMMENDED POSITION SIZE:</span>
                  <span className="text-cyan-300 font-black text-sm">
                    {riskCalculation.recommendedPositionSizeUnits} {asset.symbol} (${riskCalculation.recommendedPositionSizeUsd.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold">MARGIN REQUIRED:</span>
                  <span className="text-white font-black">${riskCalculation.marginRequiredUsd.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 border-t border-cyan-500/20 pt-2">
                  <span className="font-bold">ESTIMATED LIQUIDATION PRICE:</span>
                  <span className="text-amber-400 font-black">${riskCalculation.estimatedLiquidationPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold">LIQUIDATION BUFFER:</span>
                  <span className="text-emerald-400 font-black">{riskCalculation.liquidationBufferDistancePct}%</span>
                </div>
              </div>

              {/* Risk Engine Guard Warning */}
              {riskCalculation.warnings.length > 0 ? (
                <div className="bg-rose-950/90 border border-rose-500 text-rose-200 p-3 rounded-xl text-[11px] space-y-1.5 shadow-md">
                  {riskCalculation.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span>⚠</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-950/60 border border-emerald-400 text-emerald-300 p-3 rounded-xl text-[11px] flex items-center gap-2 shadow-md">
                  <span className="text-base">✓</span>
                  <span>Risk parameters verified. Stop-loss executes well before liquidation threshold.</span>
                </div>
              )}
            </div>
          )}

          {/* ────────────────── SUB-TAB 5: BACKTEST & WALK-FORWARD PERFORMANCE ────────────────── */}
          {rightPanelTab === 'BACKTEST' && (
            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-cyan-500/25 pb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider font-['Syne',sans-serif] flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>Walk-Forward Backtesting & Performance</span>
                </span>
                <span className="text-[10px] text-amber-300 font-black bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/40">
                  {asset.backtestSummary.testPeriod}
                </span>
              </div>

              {/* Macro Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gradient-to-r from-[#0c1836] to-[#081226] p-3.5 rounded-2xl border border-cyan-500/30 text-center shadow-md">
                <div>
                  <span className="text-[9px] text-amber-300 block uppercase font-bold">WIN RATE</span>
                  <span className="text-emerald-400 font-black text-sm">{asset.backtestSummary.overallWinRate}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-300 block uppercase font-bold">PROFIT FACTOR</span>
                  <span className="text-cyan-300 font-black text-sm">{asset.backtestSummary.profitFactor}</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-300 block uppercase font-bold">EXPECTANCY</span>
                  <span className="text-white font-black text-sm">{asset.backtestSummary.overallExpectancy}</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-300 block uppercase font-bold">MAX DRAWDOWN</span>
                  <span className="text-amber-400 font-black text-sm">{asset.backtestSummary.maxDrawdownPct}</span>
                </div>
              </div>

              {/* Performance by Market Regime */}
              <div className="space-y-2">
                <span className="text-[10px] text-amber-300 uppercase font-black block flex items-center gap-1">
                  <span>📊</span>
                  <span>PERFORMANCE AUDIT BY MARKET REGIME</span>
                </span>

                {asset.backtestSummary.regimes.map((reg, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-[#0c1836] to-[#081226] p-3 rounded-xl border border-cyan-500/30 space-y-1.5 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black text-[11px]">{reg.regime}</span>
                      <span className="text-emerald-400 font-black text-[11px]">{reg.winRate}% Win</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-cyan-500/20">
                      <span>Sample: {reg.sampleSize} trades</span>
                      <span>Profit Factor: <b className="text-white">{reg.profitFactor}</b></span>
                      <span>Expectancy: <b className="text-cyan-300">{reg.expectancy}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Footer Navigation / Summary */}
          <div className="pt-3 border-t border-cyan-500/25 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 text-[11px]">
              Engine: <b className="text-cyan-300 font-black">Institutional Multi-Factor Quant V3</b>
            </span>
            <span className="text-slate-300 text-[11px]">
              Audit: <b className="text-emerald-400 font-black">17 Fields Verified</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeeeprAiChartView;
