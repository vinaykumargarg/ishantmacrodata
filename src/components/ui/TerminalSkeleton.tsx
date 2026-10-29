import React from 'react';

export const TerminalSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4 md:p-6 w-full animate-pulse select-none">
      {/* Header bar skeleton */}
      <div className="bg-[#131822] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-8 w-48 bg-white/10 rounded" />
        </div>
        <div className="h-8 w-40 bg-white/10 rounded-full" />
        <div className="h-6 w-32 bg-white/10 rounded" />
      </div>

      {/* Plan grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#131822] border border-white/10 rounded-lg p-3 space-y-2">
            <div className="h-3 w-16 bg-white/10 rounded" />
            <div className="h-6 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Chart canvas placeholder skeleton */}
      <div className="bg-[#131822] border border-white/10 rounded-xl h-[420px] flex items-center justify-center">
        <div className="text-xs text-[#7c8699] font-mono">
          Loading institutional market feed...
        </div>
      </div>
    </div>
  );
};

export default TerminalSkeleton;
