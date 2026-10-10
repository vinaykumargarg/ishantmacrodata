import React, { useEffect, useRef, memo } from 'react';

interface TVWidgetProps {
  symbol: string;
  interval?: string;
  height?: number | string;
  studies?: string[];
}

export const TradingViewWidget: React.FC<TVWidgetProps> = memo(({
  symbol,
  interval = '60',
  height = 420,
  studies = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      calendar: false,
      studies: studies,
      support_host: 'https://www.tradingview.com'
    });
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, interval, studies.join(',')]);

  return (
    <div
      className="panel overflow-hidden p-0 border border-[#1e2a42] rounded-lg bg-[#13192a]"
      style={{ height, minHeight: height, width: '100%' }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container h-full w-full"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
});

export default TradingViewWidget;
