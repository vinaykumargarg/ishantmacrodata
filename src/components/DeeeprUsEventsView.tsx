import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, ShieldAlert, Zap, TrendingUp, TrendingDown,
  Activity, Search, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Sliders, Eye, CheckCircle2, ChevronRight, Layers, FileText,
  DollarSign, Globe, Lock, Play, Pause, Info, BarChart3, HelpCircle,
  ExternalLink, Landmark, Flame, Compass, Scale, Check
} from 'lucide-react';
import {
  UsCatalogEvent,
  US_EVENT_CATALOG,
  US_EVENT_CATEGORIES,
  searchEvents,
  getEventById
} from '../data/usEventsCatalogData';
import {
  FOREX_FACTORY_UPCOMING,
  computeUniversalEventMomentum,
  getLiveMarketPrices,
  getCurrentUsDstStatus,
  UpcomingForexFactoryEvent,
  UniversalEventMomentum
} from '../services/deeeprUsNewsImpactEngine';
import { sharedQuoteStore } from '../services/sharedQuoteStore';

interface Props {
  onNavigate?: (tabId: string) => void;
}

export default function DeeeprUsEventsView({ onNavigate }: Props) {
  // Currently selected event ID (defaults to US024: Thursday's Unemployment Claims as requested by user)
  const [selectedEventId, setSelectedEventId] = useState<string>('US024');

  // Language toggle: Hinglish vs English
  const [langMode, setLangMode] = useState<'hinglish' | 'english'>('hinglish');

  // Live prices from sharedQuoteStore
  const [livePrices, setLivePrices] = useState(getLiveMarketPrices());

  useEffect(() => {
    // Subscribe to sharedQuoteStore for 100% real-time price synchronization
    const unsubscribe = sharedQuoteStore.subscribe(() => {
      setLivePrices(getLiveMarketPrices());
    });
    return () => unsubscribe();
  }, []);

  // Compute live momentum and 10-year track record for selected event
  const momentum: UniversalEventMomentum = useMemo(() => {
    return computeUniversalEventMomentum(selectedEventId, '2026-10-28T15:18:55+05:30');
  }, [selectedEventId, livePrices]);

  // Live countdown ticker
  const [secondsRemaining, setSecondsRemaining] = useState<number>(momentum.countdownSeconds);

  useEffect(() => {
    setSecondsRemaining(momentum.countdownSeconds);
  }, [momentum.countdownSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
  };

  // Catalog search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);

  const filteredCatalog = useMemo(() => {
    return searchEvents(searchQuery);
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-24 font-sans text-foreground">
      {/* ── 1. HEADER & LIVE SINGLE QUOTE TICKER ── */}
      <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 font-black text-sm">
                🦅
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                DEEEPR US Events & Forex Factory Impact Radar
              </span>
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                Live 10-Year Macro Transmission
              </span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                EDT (+9:30 IST)
              </span>
            </div>

            <h1 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground font-display">
              US News Momentum: Gold (XAU) & Bitcoin (BTC)
            </h1>

            <p className="mt-1 text-xs text-muted-foreground max-w-3xl leading-relaxed">
              {langMode === 'hinglish'
                ? 'Forex Factory ke upcoming US events (Unemployment Claims, GDP, Core PCE, FOMC, NFP, CPI) aane par market me kya hoga: Data JYADA aane par, KAM aane par, ya EXACT SAME aane par Bitcoin aur Gold kahan jayenge aur kyun.'
                : 'Empirical 10-year macroeconomic impact engine. Projects directional movement, targets, and structural invalidation levels for Gold and Bitcoin when upcoming US releases beat, miss, or match consensus.'}
            </p>
          </div>

          {/* Live Single Quote Store Display & Language Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/80 px-3.5 py-2 text-xs font-mono shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">🥇 XAU:</span>
                <span className="text-foreground font-black text-sm">${livePrices.gold.toFixed(2)}</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">₿ BTC:</span>
                <span className="text-foreground font-black text-sm">${Math.round(livePrices.btc).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center rounded-xl bg-secondary border border-border p-1 text-xs">
              <button
                onClick={() => setLangMode('hinglish')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  langMode === 'hinglish'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLangMode('english')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  langMode === 'english'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. QUICK UPCOMING EVENT SELECTOR PILLS (FOREX FACTORY SCHEDULE) ── */}
        <div className="mt-4 border-t border-border pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
            <span>📅 Upcoming US Events (Select to View Exact Move & Target):</span>
            <button
              onClick={() => setShowCatalogModal(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold text-[11px] cursor-pointer"
            >
              <Search className="size-3" />
              <span>Browse All 90 US Events</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {FOREX_FACTORY_UPCOMING.map((item) => {
              const isSelected = selectedEventId === item.eventId;
              return (
                <button
                  key={item.eventId}
                  onClick={() => setSelectedEventId(item.eventId)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer text-left border ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-[1.02]'
                      : 'bg-secondary/70 hover:bg-secondary text-foreground border-border'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                    <span className="font-mono">{item.dayLabel}</span>
                    <span>•</span>
                    <span className="font-mono">{item.scheduledTimeIST.split(' ')[0]} IST</span>
                  </div>
                  <div className="font-extrabold text-xs truncate max-w-[210px] mt-0.5">
                    {item.name}
                  </div>
                  <div className="text-[10px] opacity-90 font-mono mt-0.5">
                    Forecast: <b>{item.forecastDisplay}</b>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. ACTIVE SELECTED EVENT HERO STRIP ── */}
      <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                ACTIVE SELECTION
              </span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {momentum.dayLabel} • {momentum.scheduledTimeDisplay}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1 flex items-center gap-2">
              <span>{momentum.event.event}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                {momentum.event.id}
              </span>
            </h2>
            <div className="text-xs text-muted-foreground mt-0.5">
              Agency: <b>{momentum.event.agency}</b> • Measure: <b>{momentum.event.measure}</b>
            </div>
          </div>

          {/* Large Countdown */}
          <div className="rounded-xl border border-border bg-card/80 p-3 sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Time Remaining to Release
            </div>
            <div className="font-mono text-xl font-black text-amber-400 mt-0.5">
              {formatCountdown(secondsRemaining)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Consensus: <b className="text-foreground">{momentum.forecastVal}</b> • Prev: <b className="text-foreground">{momentum.prevVal}</b>
            </div>
          </div>
        </div>

        {/* ── 4. THE 3 BIG READABLE IMPACT BOXES (16px+ FONTS, HIGH CONTRAST) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-4 text-amber-400" />
              <span>Market Reaction Scenarios (Bitcoin & Gold Kis Taraf Jayenge):</span>
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Live Baseline: Gold ${livePrices.gold.toFixed(2)} | BTC ${Math.round(livePrices.btc).toLocaleString()}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* ── BOX 1: AGAR DATA JYADA AAYA ── */}
            <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-3.5 shadow-sm hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-black uppercase tracking-wider">
                    📈 AGAR DATA JYADA AAYA
                  </span>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    Beat / Higher
                  </span>
                </div>

                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                  Condition: <b className="text-foreground">{momentum.higherScenario.conditionText}</b>
                </div>

                {/* Gold Projection */}
                <div className="mt-3 rounded-xl border border-border/80 bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      🥇 Spot Gold:
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        momentum.higherScenario.gold.direction === 'UPAR_PUMP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {momentum.higherScenario.gold.direction === 'UPAR_PUMP' ? (
                        <>
                          <ArrowUpRight className="size-3.5" />
                          <span>UPAR JAYEGA (PUMP)</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="size-3.5" />
                          <span>NICHE JAYEGA (DUMP)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected Target:</span>
                    <span className="text-base font-black text-foreground">
                      ${momentum.higherScenario.gold.targetPrice.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground flex justify-between">
                    <span>Move Range:</span>
                    <span className="font-bold text-foreground">{momentum.higherScenario.gold.expectedMove}</span>
                  </div>
                </div>

                {/* Bitcoin Projection */}
                <div className="mt-2.5 rounded-xl border border-border/80 bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      ₿ Bitcoin:
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        momentum.higherScenario.bitcoin.direction === 'UPAR_PUMP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {momentum.higherScenario.bitcoin.direction === 'UPAR_PUMP' ? (
                        <>
                          <ArrowUpRight className="size-3.5" />
                          <span>UPAR JAYEGA (PUMP)</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="size-3.5" />
                          <span>NICHE JAYEGA (DUMP)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected Target:</span>
                    <span className="text-base font-black text-foreground">
                      ${momentum.higherScenario.bitcoin.targetPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground flex justify-between">
                    <span>Move Range:</span>
                    <span className="font-bold text-foreground">{momentum.higherScenario.bitcoin.expectedMove}</span>
                  </div>
                </div>

                {/* Simple Hinglish Explanation */}
                <div className="mt-3 rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground border border-border">
                  <span className="font-bold text-foreground">Kyun hoga aisa? </span>
                  {langMode === 'hinglish'
                    ? momentum.higherScenario.gold.whyHinglish
                    : momentum.higherScenario.gold.whyEnglish}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border flex justify-between text-[11px] font-mono text-muted-foreground">
                <span>DXY: <b className="text-cyan-400">{momentum.higherScenario.dxyMove}</b></span>
                <span>10Y Yields: <b className="text-amber-400">{momentum.higherScenario.us10yMove}</b></span>
              </div>
            </div>

            {/* ── BOX 2: AGAR DATA KAM AAYA ── */}
            <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-3.5 shadow-sm hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-black uppercase tracking-wider">
                    📉 AGAR DATA KAM AAYA
                  </span>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    Miss / Lower
                  </span>
                </div>

                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                  Condition: <b className="text-foreground">{momentum.lowerScenario.conditionText}</b>
                </div>

                {/* Gold Projection */}
                <div className="mt-3 rounded-xl border border-border/80 bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      🥇 Spot Gold:
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        momentum.lowerScenario.gold.direction === 'UPAR_PUMP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {momentum.lowerScenario.gold.direction === 'UPAR_PUMP' ? (
                        <>
                          <ArrowUpRight className="size-3.5" />
                          <span>UPAR JAYEGA (PUMP)</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="size-3.5" />
                          <span>NICHE JAYEGA (DUMP)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected Target:</span>
                    <span className="text-base font-black text-foreground">
                      ${momentum.lowerScenario.gold.targetPrice.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground flex justify-between">
                    <span>Move Range:</span>
                    <span className="font-bold text-foreground">{momentum.lowerScenario.gold.expectedMove}</span>
                  </div>
                </div>

                {/* Bitcoin Projection */}
                <div className="mt-2.5 rounded-xl border border-border/80 bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      ₿ Bitcoin:
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        momentum.lowerScenario.bitcoin.direction === 'UPAR_PUMP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {momentum.lowerScenario.bitcoin.direction === 'UPAR_PUMP' ? (
                        <>
                          <ArrowUpRight className="size-3.5" />
                          <span>UPAR JAYEGA (PUMP)</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="size-3.5" />
                          <span>NICHE JAYEGA (DUMP)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected Target:</span>
                    <span className="text-base font-black text-foreground">
                      ${momentum.lowerScenario.bitcoin.targetPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground flex justify-between">
                    <span>Move Range:</span>
                    <span className="font-bold text-foreground">{momentum.lowerScenario.bitcoin.expectedMove}</span>
                  </div>
                </div>

                {/* Simple Hinglish Explanation */}
                <div className="mt-3 rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground border border-border">
                  <span className="font-bold text-foreground">Kyun hoga aisa? </span>
                  {langMode === 'hinglish'
                    ? momentum.lowerScenario.gold.whyHinglish
                    : momentum.lowerScenario.gold.whyEnglish}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border flex justify-between text-[11px] font-mono text-muted-foreground">
                <span>DXY: <b className="text-cyan-400">{momentum.lowerScenario.dxyMove}</b></span>
                <span>10Y Yields: <b className="text-amber-400">{momentum.lowerScenario.us10yMove}</b></span>
              </div>
            </div>

            {/* ── BOX 3: AGAR DATA EXACT SAME AAYA ── */}
            <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-3.5 shadow-sm hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-black uppercase tracking-wider">
                    ⚖️ AGAR DATA EXACT SAME AAYA
                  </span>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    In-Line / No Surprise
                  </span>
                </div>

                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                  Condition: <b className="text-foreground">{momentum.inLineScenario.conditionText}</b>
                </div>

                {/* Gold Projection */}
                <div className="mt-3 rounded-xl border border-border/80 bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">🥇 Spot Gold:</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                      SIDEWAYS CHOP / NO TREND
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected Range:</span>
                    <span className="text-sm font-bold text-foreground">
                      {momentum.inLineScenario.gold.expectedRange}
                    </span>
                  </div>
                </div>

                {/* Bitcoin Projection */}
                <div className="mt-2.5 rounded-xl border border-border/80 bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">₿ Bitcoin:</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                      CONSOLIDATION / CHOP
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected Range:</span>
                    <span className="text-sm font-bold text-foreground">
                      {momentum.inLineScenario.bitcoin.expectedRange}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-3 rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground border border-border">
                  <span className="font-bold text-foreground">Market Behavior: </span>
                  {langMode === 'hinglish'
                    ? momentum.inLineScenario.gold.whyHinglish
                    : 'Consensus in-line prints produce high initial wick noise without breaking macro support or resistance.'}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border text-center text-xs text-amber-400 font-bold">
                ⚠️ Institutional Advice: Strictly NO TRADE during exact in-line releases.
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. 10-YEAR HISTORICAL EMPIRICAL LEDGER ── */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-amber-400" />
              <span className="font-black text-xs uppercase tracking-wider text-amber-400">
                10-Year Historical Empirical Evidence Ledger (2016 – 2026)
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Total Releases Analyzed: <b>{momentum.tenYearStudy.totalReleases}</b>
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 text-xs font-mono">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground">Direction Hit Rate</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {momentum.tenYearStudy.hitRatePct}%
              </div>
              <div className="text-[10px] text-muted-foreground">Follows Expected Rule</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground">Typical Gold Move</div>
              <div className="text-base font-black text-amber-400 mt-0.5">
                {momentum.tenYearStudy.typicalGoldMovePts}
              </div>
              <div className="text-[10px] text-muted-foreground">Median Historical Move</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground">Typical Bitcoin Move</div>
              <div className="text-base font-black text-cyan-400 mt-0.5">
                {momentum.tenYearStudy.typicalBtcMovePts}
              </div>
              <div className="text-[10px] text-muted-foreground">Median Historical Move</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground">Spike Fade Probability</div>
              <div className="text-lg font-black text-rose-400 mt-0.5">
                {momentum.tenYearStudy.fadeProbabilityPct}%
              </div>
              <div className="text-[10px] text-rose-300 font-bold">5m Reversal Risk</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed pt-1 font-mono">
            {langMode === 'hinglish' ? momentum.tenYearStudy.summaryHinglish : momentum.tenYearStudy.summaryEnglish}
          </div>
        </div>
      </div>

      {/* ── 6. ALL UPCOMING EVENTS TIMELINE (FOREX FACTORY COMPLETE LIST) ── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-cyan-400" />
              <span>Full Upcoming US Events Calendar (Click to Check Impact):</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click on any event below to immediately load its 3-scenario price targets and 10-year track record.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-secondary/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/70 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-3 font-bold">Day & Time (IST)</th>
                <th className="py-3 px-3 font-bold">Event Name</th>
                <th className="py-3 px-3 font-bold">Category</th>
                <th className="py-3 px-3 font-bold">Forecast</th>
                <th className="py-3 px-3 font-bold">Previous</th>
                <th className="py-3 px-3 font-bold">Quick Impact Rule</th>
                <th className="py-3 px-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FOREX_FACTORY_UPCOMING.map((row) => {
                const isSelected = selectedEventId === row.eventId;
                return (
                  <tr
                    key={row.eventId}
                    className={`transition-colors ${
                      isSelected ? 'bg-amber-500/10' : 'hover:bg-secondary/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                      <div className="text-foreground">{row.dayLabel}</div>
                      <div className="text-[10px] text-amber-400">{row.scheduledTimeIST}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{row.name}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{row.shortSummary}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-foreground">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {row.forecastDisplay}
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground whitespace-nowrap">
                      {row.previousDisplay}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs">
                      {row.eventId === 'US024' || row.eventId === 'US022' ? (
                        <span className="text-emerald-400 font-bold">Higher = Gold & BTC UP</span>
                      ) : (
                        <span className="text-rose-400 font-bold">Higher = Gold & BTC DOWN</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEventId(row.eventId)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 7. BROWSE ALL 90 US EVENTS MODAL / DRAWER ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-border bg-card p-5 space-y-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Browse All 90 US Economic Events Catalog</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                    US001 – US090
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select any event from the full institutional registry to load its momentum scenario.
                </p>
              </div>

              <button
                onClick={() => setShowCatalogModal(false)}
                className="px-3 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 font-bold text-xs border border-border cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search event code (e.g. US013), name, agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-border rounded-xl border border-border">
              {filteredCatalog.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 hover:bg-secondary/50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{ev.id}</span>
                      <span className="font-bold text-foreground">{ev.event}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                        {ev.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ev.measure}</div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setShowCatalogModal(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 cursor-pointer shrink-0"
                  >
                    Load Event
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
