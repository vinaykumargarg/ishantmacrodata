import React, { useState, useEffect } from 'react';
import { masterVerdictStore } from '../services/masterVerdictStore';

interface ComputedSyncBadgeProps {
  moduleName: string;
  asset?: string;
  verdictId?: string;
  asOf?: number;
  className?: string;
}

/**
 * Computed Sync Badge (Section 3.6 & Test T5, T10):
 * Displays dynamic live sync status based on master verdict ID and age.
 * Replaces all static marketing claims ("100% Synced").
 */
export const ComputedSyncBadge: React.FC<ComputedSyncBadgeProps> = ({
  moduleName: _moduleName,
  asset = 'BTCUSDT',
  verdictId,
  asOf,
  className = ''
}) => {
  const [syncState, setSyncState] = useState(() =>
    masterVerdictStore.checkSync(asset, verdictId, asOf)
  );

  useEffect(() => {
    const update = () => {
      setSyncState(masterVerdictStore.checkSync(asset, verdictId, asOf));
    };

    update();
    const interval = setInterval(update, 2000);
    const unsub = masterVerdictStore.subscribe(asset, update);

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [asset, verdictId, asOf]);

  if (!syncState.isSynced) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 ${className}`}
        title={`Module out of sync with Master Verdict (${syncState.masterVerdictId})`}
      >
        <span className="size-2 rounded-full bg-rose-500 animate-ping" />
        <span>OUT OF SYNC</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 ${className}`}
      title={`Verified Single Arbiter Sync · Verdict: ${syncState.masterVerdictId}`}
    >
      <span className="size-1.5 rounded-full bg-emerald-400" />
      <span>In sync · {syncState.ageSeconds}s</span>
    </span>
  );
};

export default ComputedSyncBadge;
