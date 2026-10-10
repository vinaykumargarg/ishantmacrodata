import React, { useState } from 'react';
import { BookOpen, Plus, TrendingUp, Trophy, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { JournalEntry } from '../types';

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 'j1',
      date: '2026-10-07',
      symbol: 'NVDA',
      type: 'LONG',
      entryPrice: 128.50,
      exitPrice: 132.80,
      size: 100,
      pnl: 430,
      pnlPercent: 3.34,
      status: 'WIN',
      notes: '4H Flag Breakout setup post Blackwell announcement.',
      setup: 'AI Setup'
    },
    {
      id: 'j2',
      date: '2026-10-06',
      symbol: 'BTC/USD',
      type: 'LONG',
      entryPrice: 66400,
      exitPrice: 68200,
      size: 0.5,
      pnl: 900,
      pnlPercent: 2.71,
      status: 'WIN',
      notes: 'ETF inflow continuation signal.',
      setup: 'Macro Engine'
    }
  ]);

  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [size, setSize] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !entryPrice || !exitPrice || !size) return;

    const entryP = Number(entryPrice);
    const exitP = Number(exitPrice);
    const sz = Number(size);

    const rawPnl = type === 'LONG' ? (exitP - entryP) * sz : (entryP - exitP) * sz;
    const pnlPct = type === 'LONG' ? ((exitP - entryP) / entryP) * 100 : ((entryP - exitP) / entryP) * 100;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      symbol: symbol.toUpperCase(),
      type,
      entryPrice: entryP,
      exitPrice: exitP,
      size: sz,
      pnl: Number(rawPnl.toFixed(2)),
      pnlPercent: Number(pnlPct.toFixed(2)),
      status: rawPnl >= 0 ? 'WIN' : 'LOSS',
      notes: notes || 'Manual Terminal Log',
      setup: 'Manual'
    };

    setEntries([newEntry, ...entries]);
    setSymbol('');
    setEntryPrice('');
    setExitPrice('');
    setSize('');
    setNotes('');
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const totalWinTrades = entries.filter((e) => e.status === 'WIN').length;
  const winRate = entries.length > 0 ? ((totalWinTrades / entries.length) * 100).toFixed(1) : '0';
  const totalPnl = entries.reduce((acc, curr) => acc + curr.pnl, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#152720] to-[var(--bg-card)] border-green-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-400" />
              <h1 className="text-xl font-bold text-[var(--text-main)]">Institutional Trading Journal & Analytics</h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Log setups, measure win rates, track profit & loss, and audit execution performance over time.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Win Rate: </span>
              <strong className="text-green-400">{winRate}%</strong>
            </div>
            <div className="bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Cumulative PnL: </span>
              <strong className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                ${totalPnl.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Form Column (4 Cols) */}
        <form onSubmit={handleAddTrade} className="lg:col-span-4 glass-panel p-4 space-y-3 text-xs font-mono">
          <h3 className="font-bold text-[var(--text-main)] uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-400" /> Log New Executed Trade
          </h3>

          <div>
            <label className="text-[var(--text-muted)] block mb-1">Symbol (e.g. BTC, NVDA, RELIANCE)</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="NVDA"
              className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[var(--text-muted)] block mb-1">Side</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'LONG' | 'SHORT')}
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
              >
                <option value="LONG">LONG 📈</option>
                <option value="SHORT">SHORT 📉</option>
              </select>
            </div>

            <div>
              <label className="text-[var(--text-muted)] block mb-1">Position Size</label>
              <input
                type="number"
                step="any"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="10"
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[var(--text-muted)] block mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="128.50"
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] block mb-1">Exit Price ($)</label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="132.80"
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--text-muted)] block mb-1">Execution Notes / Rationale</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bullish flag breakout on 4H"
              className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold py-2.5 rounded-lg transition-all shadow-md"
          >
            Save Trade Entry
          </button>
        </form>

        {/* History Table Column (8 Cols) */}
        <div className="lg:col-span-8 glass-panel p-4 space-y-3">
          <h3 className="font-bold text-[var(--text-main)] uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Recorded Executions Log
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-subtle)] uppercase text-[10px]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2">Entry</th>
                  <th className="pb-2">Exit</th>
                  <th className="pb-2">PnL ($)</th>
                  <th className="pb-2">PnL (%)</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {entries.map((trade) => (
                  <tr key={trade.id} className="hover:bg-[var(--bg-card-hover)]">
                    <td className="py-2.5 text-[var(--text-muted)]">{trade.date}</td>
                    <td className="py-2.5 font-bold text-[var(--text-main)]">{trade.symbol}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trade.type === 'LONG' ? 'badge-bull' : 'badge-bear'}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-[var(--text-main)]">${trade.entryPrice}</td>
                    <td className="py-2.5 text-[var(--text-main)]">${trade.exitPrice}</td>
                    <td className={`py-2.5 font-bold ${trade.pnl >= 0 ? 'text-[var(--accent-bull)]' : 'text-[var(--accent-bear)]'}`}>
                      {trade.pnl >= 0 ? `+$${trade.pnl}` : `-$${Math.abs(trade.pnl)}`}
                    </td>
                    <td className={`py-2.5 font-semibold ${trade.pnlPercent >= 0 ? 'text-[var(--accent-bull)]' : 'text-[var(--accent-bear)]'}`}>
                      {trade.pnlPercent >= 0 ? `+${trade.pnlPercent}%` : `${trade.pnlPercent}%`}
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleDelete(trade.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete trade entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
