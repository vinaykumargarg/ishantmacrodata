import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ShieldAlert,
  Zap,
  RefreshCw,
  Code2,
  Copy,
  Check,
  FileText,
  Activity,
  Flame
} from 'lucide-react';
import {
  analyzeNewsAndEconomicEvents,
  DeeeprNewsEventsOutput,
  UpcomingEvent
} from '../services/deeeprNewsEventsEngine';

interface DeeeprNewsEventsViewProps {
  onNavigate?: (tab: string) => void;
}

export const DeeeprNewsEventsView: React.FC<DeeeprNewsEventsViewProps> = ({ onNavigate: _onNavigate }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'usa' | 'tier1'>('usa');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute live institutional data
  const data: DeeeprNewsEventsOutput = useMemo(() => {
    return analyzeNewsAndEconomicEvents();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUpcoming: UpcomingEvent[] = useMemo(() => {
    if (filterMode === 'usa') {
      return data.upcoming_events.filter(
        (e) => e.country === 'United States' || e.name.toLowerCase().includes('fed') || e.name.toLowerCase().includes('fomc')
      );
    }
    if (filterMode === 'tier1') {
      return data.upcoming_events.filter((e) => e.importance === 'high');
    }
    return data.upcoming_events;
  }, [data.upcoming_events, filterMode]);

  const nextMajorEvent = data.upcoming_events[0];

  return (
    <div className="space-y-5 pb-12 font-sans text-foreground">
      {/* ── 1. HEADER & LIVE TIME BAR ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              🌍
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">
              DEEEPR Decision Engine Evidence & Awareness Module
            </span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              v1.0 Institutional
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl text-foreground font-display flex items-center gap-2">
            <span>News & Economic Events Engine</span>
            <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
              (US Monetary Policy, CPI, NFP, FOMC & Macro Awareness)
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            All times strictly in <b>IST (UTC+05:30)</b> with original release time zones. Never prints buy/sell signals — provides event-risk awareness and blackout windows.
          </p>
        </div>

        {/* Action Controls & JSON Modal Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
            title="Inspect Master Engine JSON Contract"
          >
            <Code2 className="size-3.5 text-primary" />
            <span>Master JSON</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Events</span>
          </button>
        </div>
      </div>

      {/* ── 2. ACTIVE BLACKOUT WINDOW ALERT (IF ANY TIER-1 EVENT IS NEAR) ── */}
      {data.event_risk.active_blackouts.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-500/80 bg-rose-500/15 p-4 text-xs text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.25)] space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-bold uppercase tracking-wider text-sm">
            <ShieldAlert className="size-5 text-rose-400 animate-pulse" />
            <span>⚠️ TRADING BLACKOUT WINDOW ACTIVE — STRICT NO-ENTRY ZONE</span>
          </div>
          {data.event_risk.active_blackouts.map((b, i) => (
            <div key={i} className="space-y-1">
              <p className="font-bold text-rose-100 text-sm">{b.eventName}</p>
              <div className="flex flex-wrap gap-3 font-mono text-[11px] text-rose-300">
                <span>
                  Window: <b>{b.from_ist}</b> to <b>{b.to_ist}</b>
                </span>
                <span>
                  Time Remaining: <b>{b.remaining_minutes} minutes</b>
                </span>
              </div>
              <p className="text-rose-200/90 text-xs mt-1">{b.advice}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. HERO NEXT IMMEDIATE EVENT & COUNTDOWN ── */}
      {nextMajorEvent && (
        <div className="panel rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
                ⏱️
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Next Scheduled High-Impact Catalyst
                </span>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {nextMajorEvent.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 px-3 py-1 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                <Clock className="size-3.5" />
                <span>In ~{nextMajorEvent.minutes_to_event} Minutes</span>
              </span>
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-mono font-semibold text-muted-foreground">
                {nextMajorEvent.scheduled_ist}
              </span>
            </div>
          </div>

          {/* Numbers Grid: Forecast vs Previous vs Hawkish/Dovish Thresholds */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Consensus Forecast</span>
              <p className="text-xl font-black text-foreground">{nextMajorEvent.forecast ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">{nextMajorEvent.unit}</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Previous Reading</span>
              <p className="text-xl font-black text-foreground">{nextMajorEvent.previous ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">Revised from prior prints</p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
              <span className="text-[10px] text-rose-300 uppercase font-bold flex items-center gap-1">
                <span>🔴 Hawkish If</span>
              </span>
              <p className="text-xs font-bold text-rose-200 mt-1">{nextMajorEvent.hawkish_if}</p>
              <p className="text-[10px] text-muted-foreground">DXY up, Yields up, Risk down</p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
              <span className="text-[10px] text-emerald-300 uppercase font-bold flex items-center gap-1">
                <span>🟢 Dovish If</span>
              </span>
              <p className="text-xs font-bold text-emerald-200 mt-1">{nextMajorEvent.dovish_if}</p>
              <p className="text-[10px] text-muted-foreground">Gold up, BTC up, Yields down</p>
            </div>
          </div>

          {/* Expected Reaction Breakdown by Asset */}
          <div className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-400" />
              <span>Institutional Reaction Map (Expected Volatility Bands)</span>
            </span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs font-mono">
              <div className="p-2 rounded bg-card/70 border border-border/70">
                <span className="text-muted-foreground">💵 DXY:</span>{' '}
                <span className="text-foreground">{nextMajorEvent.expected_reaction.DXY}</span>
              </div>
              <div className="p-2 rounded bg-card/70 border border-border/70">
                <span className="text-muted-foreground">📉 US10Y:</span>{' '}
                <span className="text-foreground">{nextMajorEvent.expected_reaction.US10Y}</span>
              </div>
              <div className="p-2 rounded bg-card/70 border border-border/70">
                <span className="text-muted-foreground">🥇 Gold:</span>{' '}
                <span className="text-foreground">{nextMajorEvent.expected_reaction.Gold}</span>
              </div>
              <div className="p-2 rounded bg-card/70 border border-border/70">
                <span className="text-muted-foreground">💻 Nasdaq:</span>{' '}
                <span className="text-foreground">{nextMajorEvent.expected_reaction.Nasdaq}</span>
              </div>
              <div className="p-2 rounded bg-card/70 border border-border/70">
                <span className="text-muted-foreground">₿ Bitcoin:</span>{' '}
                <span className="text-foreground">{nextMajorEvent.expected_reaction.BTC}</span>
              </div>
              <div className="p-2 rounded bg-card/70 border border-border/70">
                <span className="text-muted-foreground">🇮🇳 Nifty:</span>{' '}
                <span className="text-foreground">{nextMajorEvent.expected_reaction.Nifty}</span>
              </div>
            </div>
          </div>

          {/* Priced-In Check & Source */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
            <span>
              <b>Priced-in Check:</b> {nextMajorEvent.priced_in_check}
            </span>
            <span className="font-mono text-[11px]">Source: {nextMajorEvent.source}</span>
          </div>
        </div>
      )}

      {/* ── 4. 24-HOUR EVENT RISK RADAR PER ASSET ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
            <Activity className="size-4 text-primary" />
            <span>Next 24H Event Risk Radar (Asset Exposure Scores)</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Proximity × Sensitivity Weighted (0-100)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 font-mono text-xs">
          {Object.entries(data.event_risk.next_24h).map(([asset, risk]) => (
            <div key={asset} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground text-sm">{asset}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    risk.level === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : risk.level === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {risk.level}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Risk Score:</span>
                  <span className="font-bold text-foreground">{risk.score}/100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${
                      risk.score >= 60 ? 'bg-rose-500' : risk.score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${risk.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. UPCOMING ECONOMIC CALENDAR WITH FILTERS ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Scheduled Economic Events (Times in IST)
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterMode('usa')}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                filterMode === 'usa'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              🇺🇸 US Monetary Policy
            </button>
            <button
              onClick={() => setFilterMode('tier1')}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                filterMode === 'tier1'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              🔥 High Impact Only
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                filterMode === 'all'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              🌍 All Global
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground uppercase">
                <th className="pb-2">Time (IST)</th>
                <th className="pb-2">Event</th>
                <th className="pb-2">Country</th>
                <th className="pb-2">Importance</th>
                <th className="pb-2">Forecast</th>
                <th className="pb-2">Previous</th>
                <th className="pb-2">Blackout Window</th>
                <th className="pb-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUpcoming.map((ev) => (
                <tr key={ev.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-3 font-bold text-foreground">
                    <div>{ev.scheduled_ist.replace(' IST', '')}</div>
                    <div className="text-[10px] text-muted-foreground">{ev.scheduled_original}</div>
                  </td>
                  <td className="py-3 font-sans font-bold text-foreground max-w-xs">{ev.name}</td>
                  <td className="py-3 text-muted-foreground">{ev.country}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        ev.importance === 'high'
                          ? 'bg-rose-500/20 text-rose-300'
                          : ev.importance === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {ev.importance}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-primary">{ev.forecast ?? '—'}</td>
                  <td className="py-3 text-muted-foreground">{ev.previous ?? '—'}</td>
                  <td className="py-3 text-[11px] text-rose-300">
                    {ev.blackout.from_ist.split(' ')[1]} - {ev.blackout.to_ist.split(' ')[1]} IST
                  </td>
                  <td className="py-3 text-[11px] text-muted-foreground max-w-[140px] truncate">
                    {ev.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. RECENTLY RELEASED INDICATORS & SURPRISE TRACKER ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
            <Check className="size-4 text-emerald-400" />
            <span>Recently Released Indicators & Surprise Tracker</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Real-Time Revision Audited</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 font-mono text-xs">
          {data.released_recently.map((rel, i) => (
            <div key={i} className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <span className="font-bold text-foreground font-sans text-sm">{rel.name}</span>
                <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-bold text-muted-foreground">
                  {rel.released_ist}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-card p-2 rounded-lg border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Actual</span>
                  <p className="text-sm font-black text-foreground">{rel.actual}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Forecast</span>
                  <p className="text-sm font-bold text-muted-foreground">{rel.forecast}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Classification</span>
                  <p className="text-sm font-bold text-emerald-400 uppercase">{rel.classification}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-border/60">
                <span className="text-muted-foreground">
                  Market Reaction: Gold {rel.market_reaction_so_far.Gold}, DXY {rel.market_reaction_so_far.DXY}
                </span>
                <span className="text-primary font-bold">✓ {rel.reaction_vs_expected.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. BREAKING NEWS WIRE & ASSET SENTIMENT (LAST 48H) ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
          <div>
            <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
              <Flame className="size-4 text-amber-500" />
              <span>Institutional Financial News Wire (Last 48 Hours)</span>
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Dominant Narrative: <b className="text-foreground">{data.news.dominant_narrative}</b>
            </p>
          </div>

          {/* Sentiment Meter Badges */}
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {Object.entries(data.news.sentiment_by_asset).map(([sym, val]) => (
              <span
                key={sym}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  val > 20
                    ? 'bg-bull/15 text-bull border border-bull/30'
                    : val < -20
                    ? 'bg-bear/15 text-bear border border-bear/30'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {sym}: {val > 0 ? `+${val}` : val}
              </span>
            ))}
          </div>
        </div>

        {/* Headlines List */}
        <div className="space-y-2">
          {data.news.top_headlines.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/80 bg-secondary/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-primary/50 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-foreground font-mono">
                    {item.source}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {item.published_ist}
                  </span>
                  {item.verified && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Verified Feed</span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground font-sans leading-snug">
                  {item.headline}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.assets.map((ast) => (
                  <span
                    key={ast}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground"
                  >
                    {ast}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. WEEK AHEAD CALENDAR ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="label-xs flex items-center gap-1.5 text-foreground font-bold">
            <Calendar className="size-4 text-cyan-400" />
            <span>Week Ahead Macro Catalysts Overview</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Weekly Outlook</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 font-mono text-xs">
          {data.week_ahead.map((w, i) => (
            <div key={i} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
              <span className="text-xs font-bold text-foreground font-sans">{w.day}</span>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                {w.events.map((ev, j) => (
                  <li key={j} className="flex items-start gap-1">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── 9. EXACT 10-LINE HINGLISH INSTITUTIONAL SUMMARY ── */}
      <div className="panel rounded-2xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
              Hinglish Institutional Summary (10 Lines)
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Rulebook Compliant</span>
        </div>

        <div className="space-y-1.5 font-mono text-xs leading-relaxed text-foreground/90">
          {data.hinglish_summary.map((line, idx) => (
            <div key={idx} className="rounded-lg bg-secondary/30 p-2 border border-border/50">
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* ── 10. STRICT RAW JSON EXPORT MODAL ── */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground font-mono">
                  DEEEPR News + Economic Events Engine v1 — Contract JSON
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyJson}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
                >
                  {copied ? <Check className="size-3.5 text-bull" /> : <Copy className="size-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-black/90 p-3 font-mono text-[11px] text-emerald-400 border border-border">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeeeprNewsEventsView;
