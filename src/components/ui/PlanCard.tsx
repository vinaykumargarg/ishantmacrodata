import React, { useState } from 'react';
import { Copy, Check, ShieldAlert } from 'lucide-react';
import { Badge } from './Badge';

export interface PlanItem {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: 'positive' | 'negative' | 'warning' | 'accent' | 'neutral';
}

export interface PlanCardProps {
  asset: string;
  state: 'LONG' | 'SHORT' | 'ARMED-LONG' | 'ARMED-SHORT' | 'WAIT';
  entry: string | number;
  sl: string | number;
  tp1: string | number;
  tp2: string | number;
  tp3: string | number;
  rr: string | number;
  invalidationReason?: string;
  className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  asset,
  state,
  entry,
  sl,
  tp1,
  tp2,
  tp3,
  rr,
  invalidationReason,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `ISHANTMACRO AI EXECUTION PLAN — ${asset}
State: ${state}
Entry: ${entry}
Stop Loss: ${sl}
Target 1: ${tp1}
Target 2: ${tp2}
Target 3: ${tp3}
RR: ${rr}`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLong = state.includes('LONG');
  const isShort = state.includes('SHORT');
  const isWait = state === 'WAIT';

  const gridItems: PlanItem[] = [
    {
      label: 'Planned Entry',
      value: entry,
      subtext: isWait ? 'Waiting at zone' : 'Worst edge',
      highlight: isLong ? 'positive' : isShort ? 'negative' : 'neutral',
    },
    {
      label: 'Stop Loss (SL)',
      value: sl,
      subtext: 'Beyond far edge + buffer',
      highlight: 'negative',
    },
    {
      label: 'Target 1 (TP1)',
      value: tp1,
      subtext: 'Partial exit (>= 1R)',
      highlight: 'positive',
    },
    {
      label: 'Target 2 (TP2)',
      value: tp2,
      subtext: '>= 2.0R benchmark',
      highlight: 'positive',
    },
    {
      label: 'Target 3 (TP3)',
      value: tp3,
      subtext: 'HTF structure',
      highlight: 'positive',
    },
    {
      label: 'Calculated RR',
      value: typeof rr === 'number' ? `1 : ${rr.toFixed(2)}` : rr,
      subtext: 'To TP2 target',
      highlight: 'accent',
    },
  ];

  return (
    <div
      className={`bg-[#131822] border border-white/10 rounded-xl p-4 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7c8699]">
            Execution Architecture
          </span>
          <Badge
            variant={isLong ? 'positive' : isShort ? 'negative' : 'warning'}
            dot
            size="sm"
          >
            {state}
          </Badge>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#a7b0c3] hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
          title="Copy execution plan to clipboard"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-[#2ebd85]" />
              <span className="text-[#2ebd85]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy Plan</span>
            </>
          )}
        </button>
      </div>

      {/* 2-row institutional grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {gridItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#1a2030] border border-white/5 rounded-lg p-2.5 flex flex-col justify-between"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7c8699] mb-1">
              {item.label}
            </span>
            <span
              className={`text-sm md:text-base font-semibold tabular-nums ${
                item.highlight === 'positive'
                  ? 'text-[#2ebd85]'
                  : item.highlight === 'negative'
                  ? 'text-[#f0616d]'
                  : item.highlight === 'accent'
                  ? 'text-[#5b8cff]'
                  : 'text-[#e8ecf4]'
              }`}
            >
              {item.value || '—'}
            </span>
            {item.subtext && (
              <span className="text-[10px] text-[#7c8699] mt-0.5 truncate">
                {item.subtext}
              </span>
            )}
          </div>
        ))}
      </div>

      {invalidationReason && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-[#f0616d]/10 border border-[#f0616d]/25 text-[#f0616d] text-xs">
          <ShieldAlert className="size-4 shrink-0" />
          <span className="font-medium">Invalidation Trigger:</span>
          <span className="text-[#e8ecf4] font-normal truncate">
            {invalidationReason}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlanCard;
