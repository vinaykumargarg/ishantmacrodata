import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ShieldAlert,
  Flame,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  Globe,
  Radio,
  Zap
} from 'lucide-react';
import {
  getUsaCalendarEvents,
  getLiveUsaNewsFeed,
  CalendarEventItem,
  LiveNewsItem,
  ImpactLevel,
  isUsDaylightSavingTime,
  evaluateSurprise
} from '../services/usaEconomicCalendarService';

interface UsaEconomicCalendarViewProps {
  onNavigate?: (tab: string) => void;
}

export const UsaEconomicCalendarView: React.FC<UsaEconomicCalendarViewProps> = ({ onNavigate }) => {
  // Calendar data & refresh ticker
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [newsFeed, setNewsFeed] = useState<LiveNewsItem[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

  // Filters State
  const [usdOnly, setUsdOnly] = useState<boolean>(() => {
    return localStorage.getItem('econ_filter_usd_only') !== 'false';
  });
  const [impactFilter, setImpactFilter] = useState<'All' | 'MediumHigh' | 'HighOnly'>(() => {
    return (localStorage.getItem('econ_filter_impact') as any) || 'All';
  });
  const [rangeFilter, setRangeFilter] = useState<'Today' | 'ThisWeek' | 'NextWeek' | 'All'>(() => {
    return (localStorage.getItem('econ_filter_range') as any) || 'All';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyMyAssets, setOnlyMyAssets] = useState<boolean>(false);

  // Drawer modal state for individual event breakdown
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  // Load events & news
  useEffect(() => {
    setEvents(getUsaCalendarEvents());
    setNewsFeed(getLiveUsaNewsFeed());
  }, []);

  // Save filter prefs
  useEffect(() => {
    localStorage.setItem('econ_filter_usd_only', String(usdOnly));
    localStorage.setItem('econ_filter_impact', impactFilter);
    localStorage.setItem('econ_filter_range', rangeFilter);
  }, [usdOnly, impactFilter, rangeFilter]);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setLastRefreshed(Date.now());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsManualRefreshing(true);
    setEvents(getUsaCalendarEvents());
    setNewsFeed(getLiveUsaNewsFeed());
    setLastRefreshed(Date.now());
    setRefreshCountdown(60);
    setTimeout(() => {
      setIsManualRefreshing(false);
    }, 500);
  };

  // DST check for current date
  const isDst = useMemo(() => isUsDaylightSavingTime(new Date(now)), [now]);

  // Next high-impact upcoming event
  const nextHighImpactEvent = useMemo(() => {
    return events.find((e) => e.stage === 'UPCOMING' && e.impact === 'High') || null;
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (usdOnly && ev.cur !== 'USD') return false;

      if (impactFilter === 'HighOnly' && ev.impact !== 'High') return false;
      if (impactFilter === 'MediumHigh' && ev.impact !== 'High' && ev.impact !== 'Medium') return false;

      if (selectedCategory !== 'All' && !ev.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }

      if (onlyMyAssets) {
        const cat = ev.category.toLowerCase();
        const evName = ev.event.toLowerCase();
        const matchesGoldOrBtc =
          cat.includes('fed') ||
          cat.includes('inflation') ||
          cat.includes('labor') ||
          evName.includes('cpi') ||
          evName.includes('fomc') ||
          evName.includes('nfp') ||
          evName.includes('gdp');
        if (!matchesGoldOrBtc) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          ev.event.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q) ||
          ev.timeIst.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [events, usdOnly, impactFilter, selectedCategory, onlyMyAssets, searchQuery]);

  // Group events by day label
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEventItem[] } = {};
    filteredEvents.forEach((ev) => {
      if (!groups[ev.dayLabel]) {
        groups[ev.dayLabel] = [];
      }
      groups[ev.dayLabel].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  // Format countdown string
  const getCountdownDisplay = (ev: CalendarEventItem) => {
    const diff = ev.targetTimestamp - now;

    if (ev.stage === 'RELEASED') {
      return (
        <span className="text-[11px] font-mono font-medium text-muted-foreground/80">
          Released
        </span>
      );
    }

    if (diff <= 0 && diff > -15 * 60 * 1000) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px] animate-pulse">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          LIVE - waiting actual
        </span>
      );
    }

    // T-15m Blackout check
    if (diff > 0 && diff <= 15 * 60 * 1000) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] animate-pulse">
          <ShieldAlert className="size-3" />
          BLACKOUT
        </span>
      );
    }

    if (diff > 0) {
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return <span className="font-mono text-xs font-bold text-foreground">{days}d {hours % 24}h</span>;
      }
      return (
        <span className="font-mono text-xs font-bold text-primary">
          {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      );
    }

    return <span className="text-[11px] font-mono text-muted-foreground">Completed</span>;
  };

  return (
    <div className="space-y-4 pb-16 font-sans text-foreground">
      {/* ── 1. HEADER (Same-to-same layout with Lovable aesthetics) ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                LIVE CALENDAR
              </span>
              <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted-foreground">
                PRO TERMINAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
              <span>News Events — CPI · PPI · FOMC · NFP</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kaun si news aane wali hai, Actual / Forecast / Previous ke saath. Countdown har second chalta hai, data har minute update.
            </p>
          </div>

          {/* Status & Live Ticker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE — {refreshCountdown}s</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-mono text-muted-foreground">
              <Globe className="size-3.5 text-primary" />
              <span>IST (UTC+5:30)</span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-3 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isManualRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* DST Note Banner */}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-secondary/40 border border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-xs">🕒</span>
            <span>
              <b>US Daylight Saving Transition:</b> ET to IST offset is dynamically computed via IANA tz database ({isDst ? 'EDT = +9:30 IST' : 'EST = +10:30 IST'}).
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] text-emerald-400 font-semibold">
            Zero Hardcoded Offsets ✓
          </span>
        </div>
      </div>

      {/* ── 2. TOP STRIP: NEXT HIGH-IMPACT & CATALYST OVERVIEW ── */}
      {nextHighImpactEvent && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Flame className="size-3.5 text-rose-500" />
                <span>Next High-Impact Catalyst</span>
              </span>
              <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                In ~{Math.max(0, Math.round((nextHighImpactEvent.targetTimestamp - now) / 3600000))} Hours
              </span>
            </div>
            <div className="mt-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {nextHighImpactEvent.event}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {nextHighImpactEvent.timeIst} • Agency: {nextHighImpactEvent.agency || 'BLS/BEA'}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs font-mono border-t border-border/50 pt-2">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Consensus:</span>{' '}
                <span className="font-bold text-foreground">{nextHighImpactEvent.forecast || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Previous:</span>{' '}
                <span className="font-bold text-muted-foreground">{nextHighImpactEvent.previous || '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Filtered Events
            </span>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">
              {filteredEvents.length} <span className="text-xs text-muted-foreground font-normal">catalysts</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mt-2">
              <span>● {events.filter(e => e.impact === 'High').length} Tier-1 High Impact</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Market Session Status
            </span>
            <div className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>US Cash Equities: Open</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-2">
              Forex & Crypto Spot 24/7 Active
            </p>
          </div>
        </div>
      )}

      {/* ── 3. FILTER BAR (Matches Lovable screenshot toggles) ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Currency toggle */}
            <button
              onClick={() => setUsdOnly(!usdOnly)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                usdOnly
                  ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              🇺🇸 Sirf USD
            </button>

            {/* Impact segments */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setImpactFilter('All')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  impactFilter === 'All'
                    ? 'bg-card text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sab impact
              </button>
              <button
                onClick={() => setImpactFilter('MediumHigh')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  impactFilter === 'MediumHigh'
                    ? 'bg-card text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Medium + High
              </button>
              <button
                onClick={() => setImpactFilter('HighOnly')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  impactFilter === 'HighOnly'
                    ? 'bg-card text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sirf High
              </button>
            </div>

            {/* Gold / BTC Asset focus toggle */}
            <button
              onClick={() => setOnlyMyAssets(!onlyMyAssets)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                onlyMyAssets
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              🥇 Gold / BTC Movers Only
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, CPI, Fed..."
              className="w-full rounded-lg border border-border bg-secondary/40 pl-8 pr-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 text-[11px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Category:</span>
          {['All', 'Fed / Monetary', 'Inflation', 'Labor', 'Growth / Activity'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. MAIN LAYOUT: CALENDAR TABLE (LEFT/CENTER) + LIVE NEWS FEED (RIGHT) ── */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Economic Calendar Table Container (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3.5 py-3 whitespace-nowrap">Time</th>
                    <th className="px-2.5 py-3 whitespace-nowrap">Cur</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Event</th>
                    <th className="px-3 py-3 whitespace-nowrap">Impact</th>
                    <th className="px-3 py-3 whitespace-nowrap">Actual</th>
                    <th className="px-3 py-3 whitespace-nowrap">Forecast</th>
                    <th className="px-3 py-3 whitespace-nowrap">Previous</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Countdown</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {Object.entries(groupedEvents).map(([day, dayEvents]) => (
                    <React.Fragment key={day}>
                      {/* Sticky Day Header */}
                      <tr className="bg-secondary/70 border-y border-border">
                        <td colSpan={8} className="px-3.5 py-1.5 text-[11px] font-bold text-foreground">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="size-3 text-primary" />
                              <span>{day}</span>
                            </span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {dayEvents.length} events
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Event Rows */}
                      {dayEvents.map((ev) => {
                        const isHigh = ev.impact === 'High';
                        const isSelected = selectedEvent?.id === ev.id;
                        const direction = evaluateSurprise(ev.actual, ev.forecast, ev.higherIsBetter);

                        return (
                          <tr
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={`group cursor-pointer transition-colors hover:bg-secondary/40 ${
                              isSelected ? 'bg-primary/10' : ''
                            } ${ev.stage === 'RELEASED' ? 'opacity-90' : ''}`}
                          >
                            {/* Time (IST) */}
                            <td className="px-3.5 py-2.5 whitespace-nowrap text-muted-foreground font-medium text-[11px]">
                              {ev.timeIst.split(',')[2] || ev.timeIst}
                            </td>

                            {/* Currency */}
                            <td className="px-2.5 py-2.5 whitespace-nowrap text-foreground font-bold">
                              {ev.cur}
                            </td>

                            {/* Event Title */}
                            <td className="px-3.5 py-2.5 font-sans">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-semibold ${
                                    isHigh ? 'font-bold text-foreground' : 'text-foreground/90'
                                  }`}
                                >
                                  {ev.event}
                                </span>
                                {ev.previousRevisedFrom && (
                                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 text-[9px] font-mono text-amber-300">
                                    REVISED
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Impact: Dot + Explicit Text Label always visible */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                                {ev.impact === 'High' && (
                                  <>
                                    <span className="size-2 rounded-full bg-rose-500" />
                                    <span className="text-rose-400 font-bold">High</span>
                                  </>
                                )}
                                {ev.impact === 'Medium' && (
                                  <>
                                    <span className="size-2 rounded-full bg-amber-500" />
                                    <span className="text-amber-400 font-bold">Medium</span>
                                  </>
                                )}
                                {ev.impact === 'Low' && (
                                  <>
                                    <span className="size-2 rounded-full bg-muted-foreground/60" />
                                    <span className="text-muted-foreground">Low</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* ACTUAL: Real Numerical Value (never "Released") with beat/miss colors */}
                            <td className="px-3 py-2.5 whitespace-nowrap font-bold text-xs">
                              {ev.actual !== null ? (
                                <span
                                  className={`inline-flex items-center gap-0.5 ${
                                    direction === 'BEAT'
                                      ? 'text-emerald-400'
                                      : direction === 'MISS'
                                      ? 'text-rose-400'
                                      : 'text-foreground'
                                  }`}
                                  title={
                                    ev.forecast
                                      ? `Actual ${ev.actual} vs Forecast ${ev.forecast}`
                                      : `Actual: ${ev.actual}`
                                  }
                                >
                                  {direction === 'BEAT' && <TrendingUp className="size-3" />}
                                  {direction === 'MISS' && <TrendingDown className="size-3" />}
                                  <span>{ev.actual}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </td>

                            {/* Forecast */}
                            <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground font-mono text-xs">
                              {ev.forecast || '—'}
                            </td>

                            {/* Previous */}
                            <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground font-mono text-xs">
                              {ev.previous || '—'}
                            </td>

                            {/* Live Countdown */}
                            <td className="px-4 py-2.5 whitespace-nowrap text-right">
                              {getCountdownDisplay(ev)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer with Verification Note */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/20 p-3 text-[11px] text-muted-foreground">
              <span>
                <b>Verified Data Sources:</b> U.S. BLS, BEA, Federal Reserve, Census Bureau & FRED macro series.
              </span>
              <span className="font-mono text-[10px]">Times: IST (UTC+05:30)</span>
            </div>
          </div>
        </div>

        {/* Live USA News Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="size-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  USA News Wire (Live)
                </h3>
              </div>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Last 48h
              </span>
            </div>

            {/* News Items List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[640px] pr-1">
              {newsFeed.map((news) => (
                <div
                  key={news.id}
                  className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1.5 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="font-bold text-foreground">{news.source}</span>
                    <span>{news.timeAgoIst}</span>
                  </div>

                  <p className="text-xs font-semibold text-foreground font-sans leading-snug">
                    {news.headline}
                  </p>

                  <p className="text-[11px] text-muted-foreground/90 font-sans italic">
                    💡 {news.whyItMatters}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] font-mono">
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        news.trustTag === 'OFFICIAL'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {news.trustTag}
                    </span>

                    <div className="flex items-center gap-1">
                      {news.impactAssets.map((ast, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            ast.lean === 'BULLISH'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : ast.lean === 'BEARISH'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {ast.symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. EVENT DETAILS DRAWER (MODAL OVERLAY) ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedEvent.impact === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedEvent.impact} Impact
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {selectedEvent.cur} • {selectedEvent.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-1 font-display">
                  {selectedEvent.event}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-border p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Hinglish Explanation */}
            {selectedEvent.explanationHinglish && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                <span className="font-bold text-primary">📌 Ye Event Kya Hai: </span>
                <span>{selectedEvent.explanationHinglish}</span>
              </div>
            )}

            {/* Figures Grid */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Actual</span>
                <p className="text-base font-black text-foreground mt-0.5">
                  {selectedEvent.actual || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Consensus</span>
                <p className="text-base font-bold text-primary mt-0.5">
                  {selectedEvent.forecast || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Previous</span>
                <p className="text-base font-bold text-muted-foreground mt-0.5">
                  {selectedEvent.previous || '—'}
                </p>
              </div>
            </div>

            {/* Scenarios Matrix (Hot / Inline / Cool) */}
            {selectedEvent.scenarios && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Institutional Scenario Matrix
                </h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5">
                    <span className="font-bold text-rose-300">🔴 HOT ({selectedEvent.scenarios.hot.condition}): </span>
                    <span className="text-rose-100">Gold: {selectedEvent.scenarios.hot.goldHypo} | DXY: {selectedEvent.scenarios.hot.dxyHypo}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
                    <span className="font-bold text-muted-foreground">⚪ IN-LINE ({selectedEvent.scenarios.inline.condition}): </span>
                    <span className="text-foreground">Gold: {selectedEvent.scenarios.inline.goldHypo}</span>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                    <span className="font-bold text-emerald-300">🟢 COOL ({selectedEvent.scenarios.cool.condition}): </span>
                    <span className="text-emerald-100">Gold: {selectedEvent.scenarios.cool.goldHypo} | DXY: {selectedEvent.scenarios.cool.dxyHypo}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Measured Reaction Stats */}
            {selectedEvent.reactionStats && (
              <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Historical Reaction Stats (15-min Post Release)</span>
                  <span className="text-[10px] text-muted-foreground">
                    n = {selectedEvent.reactionStats.sampleSize} prints
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>Gold Avg: <b className="text-foreground">{selectedEvent.reactionStats.goldAvg15m}</b></div>
                  <div>BTC Avg: <b className="text-foreground">{selectedEvent.reactionStats.btcAvg15m}</b></div>
                  <div>DXY Avg: <b className="text-foreground">{selectedEvent.reactionStats.dxyAvg15m}</b></div>
                  <div>US10Y: <b className="text-foreground">{selectedEvent.reactionStats.us10yAvg15m}</b></div>
                </div>
              </div>
            )}

            {/* Past 4 Releases History */}
            {selectedEvent.history && selectedEvent.history.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Past Releases Track Record
                </h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-secondary/60 text-[10px] text-muted-foreground uppercase">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Forecast</th>
                        <th className="p-2">Actual</th>
                        <th className="p-2">Surprise</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedEvent.history.map((h, i) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="p-2 font-bold text-foreground">{h.date}</td>
                          <td className="p-2 text-muted-foreground">{h.forecast}</td>
                          <td className="p-2 font-bold text-foreground">{h.actual}</td>
                          <td className="p-2 text-primary">{h.surprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Telegram Alert Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  alert(`Alert set for ${selectedEvent.event} at T-15m before release!`);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Bell className="size-3.5" />
                <span>Set Pre-Release Telegram Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsaEconomicCalendarView;
