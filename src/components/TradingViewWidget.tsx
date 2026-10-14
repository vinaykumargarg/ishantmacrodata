import React, { useMemo, memo } from 'react';

interface TVWidgetProps {
  symbol: string;
  interval?: string;
  height?: number | string;
  studies?: string[];
  theme?: 'dark' | 'light';
}

/**
 * Symbol normalization mapping:
 * Translates exchange-restricted CME/ICE tickers to free, publicly embeddable continuous indices.
 */
function normalizeSymbol(sym: string): string {
  if (!sym) return 'TVC:USOIL';
  const clean = sym.trim();
  const upper = clean.toUpperCase();

  // WTI Crude Oil
  if (
    upper === 'CL' ||
    upper === 'CL1!' ||
    upper === 'NYMEX:CL1!' ||
    upper === 'WTI' ||
    upper === 'USOIL' ||
    upper === 'USOIL.CFD'
  ) {
    return 'TVC:USOIL';
  }

  // Brent Crude Oil
  if (
    upper === 'B' ||
    upper === 'B1!' ||
    upper === 'ICEEUR:B1!' ||
    upper === 'BRENT' ||
    upper === 'UKOIL' ||
    upper === 'UKOIL.CFD'
  ) {
    return 'TVC:UKOIL';
  }

  // Natural Gas
  if (upper === 'NG' || upper === 'NG1!' || upper === 'NYMEX:NG1!' || upper === 'NATGAS') {
    return 'TVC:NATGAS';
  }

  // Gasoline RBOB
  if (upper === 'RB' || upper === 'RB1!' || upper === 'NYMEX:RB1!') {
    return 'CAPITALCOM:GASOLINE';
  }

  return clean;
}

export const TradingViewWidget: React.FC<TVWidgetProps> = memo(({
  symbol,
  interval = '60',
  height = 460,
  theme = 'dark'
}) => {
  const resolvedSymbol = useMemo(() => normalizeSymbol(symbol), [symbol]);

  // Map intervals: 'D' -> 'D', '60' -> '60', '15' -> '15', '240' -> '240'
  const resolvedInterval = useMemo(() => {
    if (interval === '1D' || interval === 'D' || interval === 'd') return 'D';
    if (interval === '1W' || interval === 'W' || interval === 'w') return 'W';
    if (interval === '4H' || interval === '240') return '240';
    if (interval === '1H' || interval === '60') return '60';
    if (interval === '15M' || interval === '15') return '15';
    if (interval === '5M' || interval === '5') return '5';
    return interval;
  }, [interval]);

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol: resolvedSymbol,
      interval: resolvedInterval,
      theme: theme,
      style: '1',
      timezone: 'Etc/UTC',
      locale: 'en',
      allow_symbol_change: '1',
      symboledit: '1',
      saveimage: '1',
      toolbarbg: '0a1020',
      enable_publishing: '0',
      withdateranges: '1',
      hide_side_toolbar: '0',
      details: '1',
      hotlist: '0',
      calendar: '0'
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [resolvedSymbol, resolvedInterval, theme]);

  return (
    <div
      className="panel overflow-hidden p-0 border border-border rounded-xl bg-surface relative"
      style={{ height, minHeight: height, width: '100%' }}
    >
      <iframe
        key={`${resolvedSymbol}-${resolvedInterval}`}
        title={`TradingView Chart ${resolvedSymbol}`}
        src={iframeSrc}
        className="w-full h-full border-0 rounded-xl"
        style={{
          width: '100%',
          height: '100%',
          minHeight: typeof height === 'number' ? `${height}px` : height,
          display: 'block'
        }}
        allow="fullscreen; clipboard-write"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
});

export default TradingViewWidget;

