import React from 'react';

export interface StatTileProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    isPositive?: boolean;
    isNeutral?: boolean;
    suffix?: string;
  };
  subtext?: string;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  subtext,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#131822] border border-white/10 rounded-lg p-3.5 flex flex-col justify-between transition-colors hover:border-white/15 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7c8699]">
          {label}
        </span>
        {delta && (
          <span
            className={`text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded ${
              delta.isNeutral
                ? 'bg-white/5 text-[#a7b0c3]'
                : delta.isPositive
                ? 'bg-[#2ebd85]/12 text-[#2ebd85]'
                : 'bg-[#f0616d]/12 text-[#f0616d]'
            }`}
          >
            {delta.isPositive ? '+' : ''}
            {delta.value}
            {delta.suffix || ''}
          </span>
        )}
      </div>

      <div className="text-xl md:text-2xl font-semibold tabular-nums text-[#e8ecf4] tracking-tight">
        {value}
      </div>

      {subtext && (
        <div className="text-[11px] text-[#7c8699] mt-1 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default StatTile;
