import React, { useState } from 'react';
import { ShieldAlert, Calculator, DollarSign, Percent, AlertTriangle } from 'lucide-react';

export const RiskConsolePage: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(68450);
  const [stopLossPrice, setStopLossPrice] = useState<number>(66200);
  const [leverage, setLeverage] = useState<number>(10);

  // Risk Math
  const maxRiskUsd = (accountBalance * riskPercent) / 100;
  const distancePercent = Math.abs((entryPrice - stopLossPrice) / entryPrice) * 100;
  const positionSizeUsd = distancePercent > 0 ? maxRiskUsd / (distancePercent / 100) : 0;
  const marginRequired = positionSizeUsd / leverage;
  const liquidationPriceLong = entryPrice * (1 - 1 / leverage);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#2a1b1b] to-[var(--bg-card)] border-red-500/30">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-400" />
          <div>
            <h1 className="text-xl font-bold text-[var(--text-main)]">AI Risk & Position Sizing Console</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Calculate exact position sizing, max dollar risk, required leverage margin, and liquidation thresholds.
            </p>
          </div>
        </div>
      </div>

      {/* Input Controls & Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Inputs */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-400" /> Trade Parameters
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-[var(--text-muted)] block mb-1">Total Account Balance ($)</label>
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] block mb-1">Max Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[var(--text-muted)] block mb-1">Entry Price ($)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Stop Loss ($)</label>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[var(--text-muted)] block mb-1">Leverage ({leverage}x)</label>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Output Calculations */}
        <div className="glass-panel p-5 space-y-4 bg-gradient-to-b from-[var(--bg-card)] to-[#151c28]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-green-400" /> Optimal Execution Readout
          </h3>

          <div className="space-y-3 font-mono">
            <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
              <span className="text-[11px] text-[var(--text-subtle)] uppercase">Max Dollar Risk Allowed</span>
              <div className="text-xl font-extrabold text-red-400 mt-0.5">${maxRiskUsd.toFixed(2)}</div>
            </div>

            <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
              <span className="text-[11px] text-[var(--text-subtle)] uppercase">Recommended Position Size</span>
              <div className="text-xl font-extrabold text-green-400 mt-0.5">${positionSizeUsd.toFixed(2)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-subtle)] uppercase">Margin Required</span>
                <div className="text-base font-bold text-amber-400 mt-0.5">${marginRequired.toFixed(2)}</div>
              </div>

              <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-subtle)] uppercase">Estimated Liq Price</span>
                <div className="text-base font-bold text-red-500 mt-0.5">${liquidationPriceLong.toFixed(2)}</div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Stop loss is <strong>{distancePercent.toFixed(2)}%</strong> away. Always stick to the pre-computed position size to protect capital drawdown.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
