import React from 'react';
import { Badge } from './Badge';
import { ComputedSyncBadge } from '../ComputedSyncBadge';
import { ShieldCheck, Clock } from 'lucide-react';

export interface VerdictHeaderProps {
  asset: string;
  price: number | string;
  change24h?: number;
  state: 'LONG' | 'SHORT' | 'ARMED-LONG' | 'ARMED-SHORT' | 'WAIT';
  sqScore: number;
  confidence: number;
  confidenceBasis?: string;
  timeframe?: string;
  lastUpdated?: string | number;
  className?: string;
}

export const VerdictHeader: React.FC<VerdictHeaderProps> = ({
  asset,
  price,
  change24h,
  state,
  sqScore,
  confidence,
  confidenceBasis = 'unproven (n=0)',
  timeframe = '15m',
  lastUpdated,
  className = '',
}) => {
  const isLong = state.includes('LONG');
  const isShort = state.includes('SHORT');

  const stateVariant = isLong ? 'positive' : isShort ? 'negative' : 'warning';

  const stateLabel = {
    LONG: 'Long Setup Confirmed',
    SHORT: 'Short Setup Confirmed',
    'ARMED-LONG': 'Armed Long (Pending Trigger)',
    'ARMED-SHORT': 'Armed Short (Pending Trigger)',
    WAIT: 'Wait (No Edge / Mid-Range)',
  }[state] || state;

  return (
    <div
      className={`bg-[#131822] border border-white/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${className}`}
    >
      {/* Left: Asset, Price & 24h Change */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-bold tracking-tight text-[#e8ecf4]">
            {asset}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#a7b0c3] font-mono">
            {timeframe}
          </span>
          <ComputedSyncBadge moduleName="VerdictHeader" asset={asset} />
        </div>

        <div className="flex items-baseline gap-3 mt-0.5">
          <span className="text-2xl md:text-4xl font-semibold tabular-nums text-[#e8ecf4] tracking-tight font-mono">
            {typeof price === 'number'
              ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : price}
          </span>
          {typeof change24h === 'number' && (
            <span
              className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded ${
                change24h >= 0
                  ? 'bg-[#2ebd85]/12 text-[#2ebd85]'
                  : 'bg-[#f0616d]/12 text-[#f0616d]'
              }`}
            >
              {change24h >= 0 ? '+' : ''}
              {change24h.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Centre: Institutional Verdict Chip */}
      <div className="flex flex-col items-start md:items-center gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7c8699]">
          Single Arbiter Verdict
        </span>
        <Badge variant={stateVariant} dot size="md" className="text-xs py-1 px-3">
          {stateLabel}
        </Badge>
      </div>

      {/* Right: Setup Quality, Confidence & Freshness */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7c8699]">Setup Quality:</span>
          <span className="text-xs font-semibold tabular-nums font-mono text-[#e8ecf4]">
            {sqScore}/100
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#a7b0c3]">
          <ShieldCheck className="size-3.5 text-[#5b8cff]" />
          <span>Confidence:</span>
          <span className="font-semibold text-[#e8ecf4] tabular-nums font-mono">
            {confidence}%
          </span>
          <span className="text-[#7c8699]">({confidenceBasis})</span>
        </div>

        {lastUpdated && (
          <div className="hidden md:flex items-center gap-1 text-[10px] text-[#7c8699]">
            <Clock className="size-3" />
            <span>Updated {String(lastUpdated)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerdictHeader;
