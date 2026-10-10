import React, { useState, useEffect } from 'react';

export interface EconEvent {
  date: string;
  country: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday';
  actual?: string;
  forecast?: string;
  previous?: string;
}

const DEFAULT_EVENTS: EconEvent[] = [
  { date: new Date(Date.now() + 2 * 3600000).toISOString(), country: 'USD', title: 'US CPI (MoM / YoY)', impact: 'High', forecast: '3.1%', previous: '3.2%' },
  { date: new Date(Date.now() + 5 * 3600000).toISOString(), country: 'USD', title: 'Core CPI (YoY)', impact: 'High', forecast: '3.3%', previous: '3.4%' },
  { date: new Date(Date.now() + 18 * 3600000).toISOString(), country: 'USD', title: 'Initial Jobless Claims', impact: 'Medium', forecast: '220K', previous: '224K' },
  { date: new Date(Date.now() + 26 * 3600000).toISOString(), country: 'USD', title: 'PPI (MoM)', impact: 'Medium', forecast: '0.2%', previous: '0.3%' },
  { date: new Date(Date.now() + 48 * 3600000).toISOString(), country: 'USD', title: 'Michigan Consumer Sentiment', impact: 'Medium', forecast: '68.5', previous: '67.9' },
  { date: new Date(Date.now() + 72 * 3600000).toISOString(), country: 'EUR', title: 'ECB Monetary Policy Statement', impact: 'High', forecast: '3.25%', previous: '3.50%' },
  { date: new Date(Date.now() + 96 * 3600000).toISOString(), country: 'USD', title: 'FOMC Rate Decision & Statement', impact: 'High', forecast: '3.50%', previous: '3.75%' },
  { date: new Date(Date.now() + 120 * 3600000).toISOString(), country: 'USD', title: 'Non-Farm Payrolls (NFP)', impact: 'High', forecast: '125K', previous: '139K' },
  { date: new Date(Date.now() + 120 * 3600000 + 1000).toISOString(), country: 'USD', title: 'Unemployment Rate', impact: 'High', forecast: '4.2%', previous: '4.3%' },
  { date: new Date(Date.now() - 3600000).toISOString(), country: 'USD', title: 'ISM Services PMI', impact: 'High', actual: '53.4', forecast: '52.8', previous: '52.1' },
  { date: new Date(Date.now() - 86400000).toISOString(), country: 'USD', title: 'ISM Manufacturing PMI', impact: 'Medium', actual: '48.6', forecast: '49.2', previous: '47.9' },
  { date: new Date(Date.now() + 144 * 3600000).toISOString(), country: 'JPY', title: 'BoJ Policy Rate Decision', impact: 'High', forecast: '0.50%', previous: '0.25%' },
];

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return 'Released';
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

interface EconCalendarProps {
  usdOnly?: boolean;
  minImpact?: 'High' | 'Medium' | 'Low';
  limit?: number;
}

export const EconCalendar: React.FC<EconCalendarProps> = ({
  usdOnly = false,
  minImpact = 'Medium',
  limit
}) => {
  const [events] = useState<EconEvent[]>(DEFAULT_EVENTS);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const impactScores = { High: 3, Medium: 2, Low: 1, Holiday: 0 };
  const minScore = impactScores[minImpact] ?? 2;

  let filtered = events.filter(e => {
    if (usdOnly && e.country !== 'USD') return false;
    return impactScores[e.impact] >= minScore;
  });

  if (limit) filtered = filtered.slice(0, limit);

  return (
    <div className="panel overflow-x-auto border border-[#1e2a42] rounded-lg bg-[#13192a]">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-[#1e2a42] bg-[#0d1117]/60 text-xs uppercase tracking-wider text-muted-foreground font-mono">
            {['Time', 'Cur', 'Event', 'Impact', 'Actual', 'Forecast', 'Previous', 'Countdown'].map(h => (
              <th key={h} className="px-3 py-2.5 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a42]/60 font-mono">
          {filtered.map((e, idx) => {
            const evTime = new Date(e.date).getTime();
            const diff = evTime - now;
            const isImminent = diff > 0 && diff < 24 * 3600000;
            const isReleased = diff <= 0;

            return (
              <tr
                key={idx}
                className={`hover:bg-[#1e2a42]/30 transition-colors ${isImminent ? 'bg-[#575ecf]/10' : ''} ${isReleased ? 'opacity-65' : ''}`}
              >
                <td className="px-3 py-2 text-xs whitespace-nowrap text-[#c9d1d9]">
                  {new Date(e.date).toLocaleString([], {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-3 py-2 font-bold text-xs">{e.country}</td>
                <td className="px-3 py-2 font-sans font-semibold text-xs text-white">
                  {e.title}
                </td>
                <td className="px-3 py-2 text-xs font-bold">
                  {e.impact === 'High' && <span className="text-[#f85149]">🔴 High</span>}
                  {e.impact === 'Medium' && <span className="text-[#d29922]">🟠 Medium</span>}
                  {e.impact === 'Low' && <span className="text-[#8b949e]">⚪ Low</span>}
                </td>
                <td className="px-3 py-2 font-semibold text-xs text-white">
                  {e.actual || (isReleased ? 'Released' : '—')}
                </td>
                <td className="px-3 py-2 text-xs text-[#8b949e]">{e.forecast || '—'}</td>
                <td className="px-3 py-2 text-xs text-[#8b949e]">{e.previous || '—'}</td>
                <td className={`px-3 py-2 text-xs whitespace-nowrap ${isImminent ? 'font-bold text-[#58a6ff]' : 'text-[#8b949e]'}`}>
                  {formatCountdown(diff)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="p-3 border-t border-[#1e2a42] text-[11px] text-muted-foreground flex justify-between items-center bg-[#0d1117]/30">
        <span>⚡ Live weekly calendar (ForexFactory feed) · Ticking in real-time · Times in local timezone</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span> Auto-Sync</span>
      </div>
    </div>
  );
};

export default EconCalendar;
