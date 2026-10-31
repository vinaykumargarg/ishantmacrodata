import React from 'react';

/**
 * Resilient lazy loader for code-split components.
 * Automatically catches 'Failed to fetch dynamically imported module' (e.g. after a new build/deployment)
 * and hard-reloads the page cleanly from the server without showing crash anomalies or broken views.
 */
export function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<any> {
  return React.lazy(async () => {
    try {
      const mod = await factory();
      return mod && mod.default ? mod : { default: mod };
    } catch (err: any) {
      const msg = (err && (err.message || String(err))) || '';
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('dynamically imported');

      if (isChunkError && typeof window !== 'undefined') {
        const key = 'chunk_auto_heal_ts';
        const last = parseInt(sessionStorage.getItem(key) || '0', 10);
        const now = Date.now();
        // Allow hard reload once every 10 seconds to fetch fresh bundle
        if (now - last > 10000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
          // Never resolve or reject to keep Suspense active while reloading
          return new Promise(() => {});
        }
      }
      throw err;
    }
  });
}

export default safeLazy;
