import React, { useState } from 'react';
import TradingViewWidget from './TradingViewWidget';

interface TimeframeTab {
  id: 'short' | 'swing' | 'long';
  label: string;
  horizon: string;
  focus: string;
}

const TIMEFRAME_TABS: TimeframeTab[] = [
  {
    id: 'short',
    label: 'Short Term',
    horizon: '1D – 1W',
    focus: 'DXY, US yields, economic data, Fed expectations, futures positioning, OI, technicals, news.'
  },
  {
    id: 'swing',
    label: 'Swing',
    horizon: '1W – 3M',
    focus: 'Fed path, CPI/PCE, real yields, DXY trend, ETF flows, CFTC positioning, liquidity, geopolitics.'
  },
  {
    id: 'long',
    label: 'Long Term',
    horizon: '6M – 5Y',
    focus: 'Global M2, central-bank gold buying, reserves, fiscal deficits, debt, real yields, ETF demand, mine supply, geopolitical fragmentation.'
  }
];

const RETURNS_DATA = [
  { period: '1D', change: 0.42 },
  { period: '1W', change: 1.85 },
  { period: '1M', change: 4.60 },
  { period: '3M', change: 9.20 },
  { period: '1Y', change: 28.40 }
];

const METRICS_ITEMS = [
  { label: 'ATR (14D)', value: '$42.60', sub: 'Volatility: High' },
  { label: 'Daily high / low', value: '$4,238 / $4,186', sub: 'Range: $52' },
  { label: 'Weekly high / low', value: '$4,262 / $4,104', sub: 'Range: $158' },
  { label: 'Monthly high / low', value: '$4,310 / $3,948', sub: 'Range: $362' },
  { label: 'Futures volume (GC)', value: '218k contracts', sub: 'vs 20D avg 194k' },
  { label: 'Futures open interest', value: '486k contracts', sub: '+2.1% WoW', tone: 'bull' }
];

const SR_LEVELS = [
  { kind: 'Resistance', level: '$4,310', note: 'Monthly high — breakout above = trend continuation.' },
  { kind: 'Resistance', level: '$4,262', note: 'Weekly high, first supply zone.' },
  { kind: 'Support', level: '$4,186', note: 'Daily low aur intraday demand zone.' },
  { kind: 'Support', level: '$4,104', note: 'Weekly low — iske neeche short-term trend weak.' },
  { kind: 'Support', level: '$3,948', note: 'Monthly low / 50 EMA cluster.' }
];

const DXY_ITEMS = [
  { label: 'DXY trend', value: 'Down (lower highs)', tone: 'bull', note: 'Gold ke liye supportive.' },
  { label: 'DXY 20 DMA', value: '99.4', sub: 'Price below → short-term bearish USD' },
  { label: 'DXY 50 DMA', value: '100.2', sub: 'Price below → medium-term bearish USD' },
  { label: 'DXY 200 DMA', value: '102.6', sub: 'Major trend still bearish USD' },
  { label: 'DXY momentum (RSI 14)', value: '41', sub: 'Weak, oversold se door' },
  { label: 'USD positioning (CFTC)', value: 'Net short', sub: 'Crowded — bounce risk', tone: 'bear' }
];

const DXY_SCENARIOS = [
  { scenario: 'DXY ↑ + Gold ↓', reading: 'Normal inverse relationship — dollar strength gold pe pressure.', tone: 'bear' },
  { scenario: 'DXY ↓ + Gold ↑', reading: 'Normal bullish relationship — dollar weakness gold ko support.', tone: 'bull' },
  { scenario: 'DXY ↑ + Gold ↑', reading: 'RELATIONSHIP BREAKDOWN — safe-haven / de-dollarisation bid, structurally bullish gold.', tone: 'bull' },
  { scenario: 'DXY ↓ + Gold ↓', reading: 'Breakdown — risk-on liquidation ya positioning unwind, caution.', tone: 'bear' }
];

const YIELD_ITEMS = [
  { label: 'US 5Y yield', value: '3.82%', sub: '-4bp today' },
  { label: 'US 30Y yield', value: '4.62%', sub: '+2bp today' },
  { label: '10Y real yield (TIPS)', value: '1.62%', sub: '-6bp WoW', tone: 'bull' },
  { label: '2Y–10Y spread', value: '+22bp', sub: 'Curve steepening' },
  { label: '10Y–30Y spread', value: '+48bp', sub: 'Long-end premium rising' },
  { label: 'Term premium (ACM)', value: '0.54', sub: 'Elevated — fiscal risk premium', tone: 'bull' }
];

const FED_ITEMS = [
  { label: 'Fed funds rate', value: '4.00–4.25%', sub: 'Target range' },
  { label: 'Next FOMC', value: '17–18 Mar', sub: 'Statement + dot plot' },
  { label: 'Rate-cut probability', value: '68%', sub: 'Next meeting', tone: 'bull' },
  { label: 'Rate-hike probability', value: '4%', sub: 'Next meeting' },
  { label: 'Expected rate 3M', value: '3.95%', sub: 'Forward curve' },
  { label: 'Expected rate 6M', value: '3.70%', sub: 'Forward curve' },
  { label: 'Expected rate 12M', value: '3.35%', sub: 'Forward curve' },
  { label: 'Fed balance sheet', value: '$6.62T', sub: 'QT slowing' }
];

const MACRO_SURPRISES = [
  { group: 'Inflation', event: 'CPI YoY', actual: '2.9%', forecast: '3.1%', previous: '3.0%', surprise: '-0.2pp', fedImpact: 'Dovish', goldImpact: 'bull' },
  { group: 'Inflation', event: 'Core CPI YoY', actual: '3.1%', forecast: '3.3%', previous: '3.2%', surprise: '-0.2pp', fedImpact: 'Dovish', goldImpact: 'bull' },
  { group: 'Inflation', event: 'PCE YoY', actual: '2.6%', forecast: '2.6%', previous: '2.7%', surprise: '0.0pp', fedImpact: 'Neutral', goldImpact: 'neutral' },
  { group: 'Inflation', event: 'Core PCE YoY', actual: '2.8%', forecast: '2.9%', previous: '2.9%', surprise: '-0.1pp', fedImpact: 'Dovish', goldImpact: 'bull' },
  { group: 'Inflation', event: 'PPI YoY', actual: '2.4%', forecast: '2.2%', previous: '2.1%', surprise: '+0.2pp', fedImpact: 'Hawkish', goldImpact: 'bear' },
  { group: 'Employment', event: 'Non-farm payrolls', actual: '162K', forecast: '53K', previous: '79K', surprise: '+109K', fedImpact: 'Hawkish', goldImpact: 'bear' },
  { group: 'Employment', event: 'Unemployment rate', actual: '4.3%', forecast: '4.3%', previous: '4.2%', surprise: '0.0pp', fedImpact: 'Neutral', goldImpact: 'neutral' },
  { group: 'Employment', event: 'Average hourly earnings', actual: '0.3%', forecast: '0.3%', previous: '0.4%', surprise: '0.0pp', fedImpact: 'Neutral', goldImpact: 'neutral' },
  { group: 'Employment', event: 'Initial claims', actual: '218K', forecast: '228K', previous: '224K', surprise: '-10K', fedImpact: 'Hawkish', goldImpact: 'bear' },
  { group: 'Economy', event: 'GDP QoQ (annualised)', actual: '2.4%', forecast: '2.1%', previous: '2.0%', surprise: '+0.3pp', fedImpact: 'Hawkish', goldImpact: 'bear' },
  { group: 'Economy', event: 'ISM Manufacturing', actual: '48.6', forecast: '49.2', previous: '48.9', surprise: '-0.6', fedImpact: 'Dovish', goldImpact: 'bull' },
  { group: 'Economy', event: 'ISM Services', actual: '52.4', forecast: '51.8', previous: '51.6', surprise: '+0.6', fedImpact: 'Hawkish', goldImpact: 'bear' },
  { group: 'Economy', event: 'Retail sales MoM', actual: '0.6%', forecast: '0.3%', previous: '0.2%', surprise: '+0.3pp', fedImpact: 'Hawkish', goldImpact: 'bear' }
];

const CENTRAL_BANKS_BUYING = [
  { country: 'China (PBoC)', monthly: '+1.9 t', annual: '+44 t', trend: 'Increasing' },
  { country: 'India (RBI)', monthly: '+2.4 t', annual: '+72 t', trend: 'Increasing' },
  { country: 'Poland (NBP)', monthly: '+1.2 t', annual: '+68 t', trend: 'Increasing' },
  { country: 'Türkiye (CBRT)', monthly: '+3.1 t', annual: '+81 t', trend: 'Increasing' },
  { country: 'Kazakhstan', monthly: '+0.6 t', annual: '+14 t', trend: 'Steady' },
  { country: 'Uzbekistan', monthly: '-0.8 t', annual: '-9 t', trend: 'Selling' },
  { country: 'Russia', monthly: '0 t', annual: '+3 t', trend: 'Steady' },
  { country: 'Other central banks', monthly: '+4.2 t', annual: '+52 t', trend: 'Increasing' }
];

const ETF_FLOWS = [
  { label: 'GLD holdings', value: '912 t', sub: '+4.2 t this week', tone: 'bull' },
  { label: 'IAU holdings', value: '428 t', sub: '+1.8 t this week', tone: 'bull' },
  { label: 'Global ETF holdings', value: '3,684 t', sub: 'AUM ~$412B', tone: 'bull' },
  { label: 'Daily flow', value: '+$210M', sub: 'Strong net creation', tone: 'bull' },
  { label: 'Weekly flow', value: '+$1.4B', sub: '4th straight inflow week', tone: 'bull' },
  { label: 'Monthly flow', value: '+$5.1B', sub: 'Western institutional return', tone: 'bull' }
];

const REGIONAL_ETF = [
  { region: 'North America', flow: '+$860M week', tone: 'bull' },
  { region: 'Europe', flow: '+$420M week', tone: 'bull' },
  { region: 'Asia', flow: '+$140M week', tone: 'bull' },
  { region: 'Other', flow: '-$20M week', tone: 'bear' }
];

const CFTC_DATA = [
  { category: 'Managed money', long: '224k', short: '38k', net: '+186k', weekly: '+11.4k' },
  { category: 'Commercial (producers/banks)', long: '112k', short: '318k', net: '-206k', weekly: '-9.8k' },
  { category: 'Other reportables', long: '64k', short: '42k', net: '+22k', weekly: '+1.2k' },
  { category: 'Non-reportable (small traders)', long: '38k', short: '22k', net: '+16k', weekly: '+0.6k' }
];

const DERIVATIVES_METRICS = [
  { label: 'Open interest', value: '486k', sub: '+2.1% WoW', tone: 'bull' },
  { label: 'Volume', value: '218k', sub: 'Above 20D avg', tone: 'bull' },
  { label: 'Futures basis', value: '+$18', sub: 'Contango — normal carry' },
  { label: 'Options volume', value: '94k', sub: 'Calls 61%' },
  { label: 'Put/Call ratio', value: '0.18', sub: 'Call-heavy', tone: 'bull' },
  { label: 'Implied volatility', value: '18.4%', sub: 'IV > HV — hedging demand' },
  { label: 'Options skew (25d)', value: '+1.4', sub: 'Call skew', tone: 'bull' },
  { label: 'Max pain', value: '$4,150', sub: 'Nearest monthly expiry' }
];

const GEOPOLITICAL_EVENTS = [
  { event: 'Middle East escalation', score: 84, goldImpact: 'bull', confidence: 79 },
  { event: 'Russia / Ukraine', score: 76, goldImpact: 'bull', confidence: 74 },
  { event: 'US–China tech & tariff tensions', score: 72, goldImpact: 'bull', confidence: 71 },
  { event: 'Taiwan strait tensions', score: 61, goldImpact: 'bull', confidence: 64 },
  { event: 'US–Iran standoff', score: 68, goldImpact: 'bull', confidence: 66 },
  { event: 'New sanctions / reserve freezes', score: 70, goldImpact: 'bull', confidence: 77 },
  { event: 'Trade wars & tariffs', score: 66, goldImpact: 'bull', confidence: 69 },
  { event: 'Political instability (elections, budgets)', score: 54, goldImpact: 'neutral', confidence: 58 }
];

const GLOBAL_LIQUIDITY_ITEMS = [
  { label: 'Global M2', value: '$118.4T', sub: '+6.2% YoY', tone: 'bull' },
  { label: 'US M2', value: '$22.1T', sub: '+3.8% YoY', tone: 'bull' },
  { label: 'China M2', value: '¥318T', sub: '+7.4% YoY', tone: 'bull' },
  { label: 'Fed balance sheet', value: '$6.62T', sub: 'QT slowing' },
  { label: 'ECB balance sheet', value: '€6.1T', sub: 'Gradual runoff' },
  { label: 'BOJ balance sheet', value: '¥742T', sub: 'Still expansionary', tone: 'bull' },
  { label: 'Treasury General Account', value: '$742B', sub: 'Drawdown = liquidity add', tone: 'bull' },
  { label: 'Reverse repo (RRP)', value: '$58B', sub: 'Near zero — buffer gone', tone: 'bear' },
  { label: 'Bank reserves', value: '$3.18T', sub: 'Ample but falling' }
];

const INDIA_DESK_ITEMS = [
  { label: 'USD/INR', value: '88.4', sub: 'Weak rupee = higher MCX gold' },
  { label: 'MCX Gold (10g)', value: '₹1,21,450', sub: 'Front-month futures' },
  { label: 'Spot gold (Mumbai, 24k)', value: '₹1,22,100', sub: 'Incl. duty + GST' },
  { label: 'MCX vs international', value: '+0.4%', sub: 'Local premium', tone: 'bull' },
  { label: 'Indian premium / discount', value: '+$6/oz', sub: 'Premium = strong physical demand', tone: 'bull' },
  { label: 'Gold imports (latest month)', value: '62 t', sub: '+18% YoY', tone: 'bull' },
  { label: 'RBI gold reserves', value: '888 t', sub: '~12.5% of reserves', tone: 'bull' },
  { label: 'Indian gold ETF flows', value: '+₹1,840 cr', sub: 'Monthly net inflow', tone: 'bull' },
  { label: 'Jewellery demand', value: 'Firm', sub: 'Wedding + festive season support' }
];

const MINERS_DATA = [
  { company: 'Newmont', production: '5.9 Moz', aisc: '$1,540', guidance: 'Flat' },
  { company: 'Barrick', production: '3.9 Moz', aisc: '$1,460', guidance: 'Slightly higher' },
  { company: 'Agnico Eagle', production: '3.5 Moz', aisc: '$1,290', guidance: 'Raised' },
  { company: 'AngloGold Ashanti', production: '2.7 Moz', aisc: '$1,510', guidance: 'Flat' },
  { company: 'Kinross', production: '2.1 Moz', aisc: '$1,420', guidance: 'Flat' }
];

const MOVING_AVERAGES = [
  { name: '20 EMA', value: '$4,168', read: 'bull' },
  { name: '50 EMA', value: '$4,042', read: 'bull' },
  { name: '100 EMA', value: '$3,884', read: 'bull' },
  { name: '200 EMA', value: '$3,610', read: 'bull' },
  { name: '20 SMA', value: '$4,155', read: 'bull' },
  { name: '50 SMA', value: '$4,020', read: 'bull' },
  { name: '200 SMA', value: '$3,566', read: 'bull' }
];

const PILLARS_SCORE = [
  { pillar: 'Macro', score: 78 },
  { pillar: 'Liquidity', score: 72 },
  { pillar: 'Fed', score: 65 },
  { pillar: 'Real yield', score: 80 },
  { pillar: 'DXY', score: 74 },
  { pillar: 'ETF flow', score: 82 },
  { pillar: 'Central banks', score: 91 },
  { pillar: 'CFTC positioning', score: 68 },
  { pillar: 'Geopolitics', score: 85 },
  { pillar: 'Technical', score: 76 }
];

const WORLD_NEWS = [
  { tag: 'GOLD', headline: 'Central banks continue net buying', detail: 'WGC estimate ke mutabiq Q1 net purchases ~244 t — structural demand strong.', tone: 'bull' },
  { tag: 'GOLD', headline: 'ETF inflows fourth straight week', detail: 'Western investors wapas — global holdings 3,684 t.', tone: 'bull' },
  { tag: 'SILVER', headline: 'Industrial + solar demand tight market', detail: 'Gold/silver ratio compress ho raha hai; silver high-beta play.', tone: 'bull' },
  { tag: 'BITCOIN', headline: 'Spot BTC ETF inflows continue', detail: 'Exchange balances gir rahe hain — supply squeeze narrative.', tone: 'bull' },
  { tag: 'ETHEREUM', headline: 'ETH/BTC strength returning', detail: 'Staking + L2 activity up; ETF flows improving.', tone: 'bull' },
  { tag: 'WORLD', headline: 'Geopolitical risk elevated', detail: 'Middle East aur sanctions headlines safe-haven bid support kar rahe hain.', tone: 'bull' }
];

export const GoldDashboardView: React.FC = () => {
  const [horizon, setHorizon] = useState<'short' | 'swing' | 'long'>('short');
  const activeTabObj = TIMEFRAME_TABS.find(t => t.id === horizon) || TIMEFRAME_TABS[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          🥇 Gold Command Centre
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Live Gold Market — AI Gold Brain
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          XAU/USD spot aur futures se lekar dollar, real yields, Fed, macro surprises, central banks, ETF flows, CFTC positioning, geopolitics, India premium aur technicals — sab ek premium terminal me.
        </p>
      </div>

      {/* 2. Top AI Read Dashboard */}
      <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
        <h2 className="label-xs text-foreground font-bold">AI Gold Read (Live)</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
          <article className="panel border border-border rounded-lg bg-secondary/50 p-3">
            <h3 className="label-xs">XAU/USD spot</h3>
            <p className="num mt-2 text-xl font-semibold text-foreground">$4,125</p>
            <p className="num mt-1 text-[11px] text-bull">+0.77% today</p>
          </article>
          <article className="panel border border-border rounded-lg bg-secondary/50 p-3">
            <h3 className="label-xs">Gold bias</h3>
            <p className="mt-2 text-xl font-semibold text-bull">BULLISH</p>
            <p className="label-xs mt-1 text-muted-foreground">Volatility: High</p>
          </article>
          <article className="panel border border-border rounded-lg bg-secondary/50 p-3">
            <h3 className="label-xs">Trend strength</h3>
            <p className="num mt-2 text-xl font-semibold text-primary">78 / 100</p>
            <p className="label-xs mt-1 text-bull">Strong HH / HL Structure</p>
          </article>
          <article className="panel border border-border rounded-lg bg-secondary/50 p-3">
            <h3 className="label-xs">Gold/Silver ratio</h3>
            <p className="num mt-2 text-xl font-semibold text-foreground">84.2</p>
            <p className="label-xs mt-1 text-muted-foreground">1 BTC = 20.0 oz gold</p>
          </article>
        </div>
        <p className="text-xs text-muted-foreground">
          Trend structure HH/HL bana hua hai, central-bank aur ETF demand support de rahi hai; volatility high hai to size chhoti rakho.
        </p>
      </div>

      {/* 3. 1 · Live Gold Market & Drivers */}
      <div className="panel border border-border rounded-lg bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">1 · Live Gold Market & Drivers</h2>
        {/* Returns Row */}
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5 font-mono">
          {RETURNS_DATA.map(r => (
            <article key={r.period} className="panel rounded border border-border bg-secondary/40 p-3 text-center">
              <p className="label-xs">{r.period}</p>
              <p className="num mt-1 text-base font-semibold text-bull">+{r.change}%</p>
            </article>
          ))}
        </div>
        {/* Key Telemetry Metrics Grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
          {METRICS_ITEMS.map((m, idx) => (
            <div key={idx} className="panel rounded border border-border bg-secondary/40 p-3">
              <p className="label-xs">{m.label}</p>
              <p className="num mt-1 text-lg font-bold text-foreground">{m.value}</p>
              <p className={`text-[11px] mt-0.5 ${m.tone === 'bull' ? 'text-bull' : 'text-muted-foreground'}`}>{m.sub}</p>
            </div>
          ))}
        </div>
        {/* S/R Levels Table */}
        <div className="panel overflow-x-auto rounded border border-border bg-secondary/20">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SR_LEVELS.map((s, idx) => (
                <tr key={idx}>
                  <td className={`px-3 py-2 font-bold ${s.kind === 'Support' ? 'text-bull' : 'text-bear'}`}>{s.kind}</td>
                  <td className="px-3 py-2 font-mono font-bold text-foreground">{s.level}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Live TradingView Chart */}
      <div className="panel border border-border rounded-lg bg-card p-3 space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-semibold text-foreground">XAU/USD Chart</span>
          <span className="label-xs text-bull">● LIVE STREAMING</span>
        </div>
        <TradingViewWidget symbol="OANDA:XAUUSD" interval="60" height={440} />
      </div>

      {/* 5. Timeframe Desk Tabs */}
      <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Timeframe Desk</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          {TIMEFRAME_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setHorizon(tab.id)}
              className={`flex-1 rounded-lg border p-3 text-left transition-all cursor-pointer ${
                horizon === tab.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="block text-xs font-semibold">{tab.label}</span>
              <span className={`label-xs block mt-0.5 ${horizon === tab.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {tab.horizon}
              </span>
            </button>
          ))}
        </div>
        <p className="panel rounded border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground mr-1">Focus:</span>
          {activeTabObj.focus}
        </p>
      </div>

      {/* Conditional Sub-Modules based on Horizon */}
      {horizon === 'short' && (
        <>
          {/* US Dollar Module */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">2 · US Dollar Module (DXY)</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
              {DXY_ITEMS.map((d, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{d.label}</p>
                  <p className="num mt-1 text-base font-bold text-foreground">{d.value}</p>
                  <p className={`text-[11px] mt-0.5 ${d.tone === 'bull' ? 'text-bull' : d.tone === 'bear' ? 'text-bear' : 'text-muted-foreground'}`}>
                    {d.sub || d.note}
                  </p>
                </div>
              ))}
            </div>
            <div className="panel overflow-x-auto rounded border border-border bg-secondary/20">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                    <th className="px-3 py-2">Scenario</th>
                    <th className="px-3 py-2">AI Reading</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {DXY_SCENARIOS.map((s, idx) => (
                    <tr key={idx}>
                      <td className={`px-3 py-2 font-mono font-bold ${s.tone === 'bull' ? 'text-bull' : 'text-bear'}`}>{s.scenario}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.reading}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* US Treasury & Real Yields */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">3 · US Treasury & Real Yield Module</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
              {YIELD_ITEMS.map((y, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{y.label}</p>
                  <p className="num mt-1 text-lg font-bold text-foreground">{y.value}</p>
                  <p className={`text-[11px] mt-0.5 ${y.tone === 'bull' ? 'text-bull' : 'text-muted-foreground'}`}>{y.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Futures & Derivatives */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">9 · Gold Futures & Derivatives</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
              {DERIVATIVES_METRICS.map((m, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{m.label}</p>
                  <p className="num mt-1 text-lg font-bold text-foreground">{m.value}</p>
                  <p className={`text-[11px] mt-0.5 ${m.tone === 'bull' ? 'text-bull' : 'text-muted-foreground'}`}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Analysis */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">15 · Technical Analysis</h2>
            <div className="grid gap-2 sm:grid-cols-4 font-mono">
              {MOVING_AVERAGES.map((ma, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-2.5 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{ma.name}</span>
                  <span className="text-xs font-bold text-bull">{ma.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {horizon === 'swing' && (
        <>
          {/* Fed & Interest-Rate Expectations */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">4 · Fed & Interest-Rate Expectations</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
              {FED_ITEMS.map((f, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{f.label}</p>
                  <p className="num mt-1 text-lg font-bold text-foreground">{f.value}</p>
                  <p className={`text-[11px] mt-0.5 ${f.tone === 'bull' ? 'text-bull' : 'text-muted-foreground'}`}>{f.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* US Macro Surprises */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">5 · US Macro Data — Actual vs Forecast vs Previous</h2>
            <div className="panel overflow-x-auto rounded border border-border bg-secondary/20 font-mono">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                    <th className="px-3 py-2">Group</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">Actual</th>
                    <th className="px-3 py-2">Forecast</th>
                    <th className="px-3 py-2">Previous</th>
                    <th className="px-3 py-2">Surprise</th>
                    <th className="px-3 py-2">Fed Impact</th>
                    <th className="px-3 py-2">Gold Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {MACRO_SURPRISES.map((m, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-muted-foreground">{m.group}</td>
                      <td className="px-3 py-2 font-bold text-foreground font-sans">{m.event}</td>
                      <td className="px-3 py-2 font-bold text-foreground">{m.actual}</td>
                      <td className="px-3 py-2 text-muted-foreground">{m.forecast}</td>
                      <td className="px-3 py-2 text-muted-foreground">{m.previous}</td>
                      <td className="px-3 py-2 text-foreground">{m.surprise}</td>
                      <td className={`px-3 py-2 font-bold ${m.fedImpact === 'Dovish' ? 'text-bull' : m.fedImpact === 'Hawkish' ? 'text-bear' : 'text-muted-foreground'}`}>{m.fedImpact}</td>
                      <td className={`px-3 py-2 font-bold ${m.goldImpact === 'bull' ? 'text-bull' : m.goldImpact === 'bear' ? 'text-bear' : 'text-muted-foreground'}`}>
                        {m.goldImpact === 'bull' ? 'BULLISH' : m.goldImpact === 'bear' ? 'BEARISH' : 'NEUTRAL'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ETF Flows */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">7 · Gold ETF Flows</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
              {ETF_FLOWS.map((e, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{e.label}</p>
                  <p className="num mt-1 text-lg font-bold text-bull">{e.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{e.sub}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-4 font-mono pt-2">
              {REGIONAL_ETF.map((r, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/30 p-2.5 flex justify-between">
                  <span className="text-xs text-muted-foreground">{r.region}</span>
                  <span className={`text-xs font-bold ${r.tone === 'bull' ? 'text-bull' : 'text-bear'}`}>{r.flow}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CFTC Positioning */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">8 · CFTC Commitment of Traders (COT)</h2>
            <div className="panel overflow-x-auto rounded border border-border bg-secondary/20 font-mono">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Long</th>
                    <th className="px-3 py-2">Short</th>
                    <th className="px-3 py-2">Net Position</th>
                    <th className="px-3 py-2">Weekly Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {CFTC_DATA.map((c, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-foreground font-sans">{c.category}</td>
                      <td className="px-3 py-2 text-bull font-bold">{c.long}</td>
                      <td className="px-3 py-2 text-bear font-bold">{c.short}</td>
                      <td className="px-3 py-2 font-bold text-foreground">{c.net}</td>
                      <td className="px-3 py-2 text-bull">{c.weekly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Geopolitics */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">10 · Geopolitical Risk Engine</h2>
            <div className="grid gap-2 sm:grid-cols-2 font-mono">
              {GEOPOLITICAL_EVENTS.map((g, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-foreground font-sans">{g.event}</p>
                    <p className="text-[11px] text-muted-foreground">Confidence: {g.confidence}%</p>
                  </div>
                  <span className="rounded bg-bear/15 px-2.5 py-1 text-xs font-bold text-bear">
                    Risk {g.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {horizon === 'long' && (
        <>
          {/* Central Bank Gold Buying */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">6 · Central Bank Gold Accumulation (Official Reserves)</h2>
            <div className="panel overflow-x-auto rounded border border-border bg-secondary/20 font-mono">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                    <th className="px-3 py-2">Central Bank / Sovereign</th>
                    <th className="px-3 py-2">Monthly Net</th>
                    <th className="px-3 py-2">Annual Net</th>
                    <th className="px-3 py-2 text-right">Trend Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {CENTRAL_BANKS_BUYING.map((b, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-foreground font-sans">{b.country}</td>
                      <td className={`px-3 py-2 font-bold ${b.monthly.startsWith('-') ? 'text-bear' : 'text-bull'}`}>{b.monthly}</td>
                      <td className={`px-3 py-2 font-bold ${b.annual.startsWith('-') ? 'text-bear' : 'text-bull'}`}>{b.annual}</td>
                      <td className={`px-3 py-2 text-right font-bold ${b.trend === 'Selling' ? 'text-bear' : 'text-bull'}`}>{b.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Liquidity */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">12 · Global Liquidity Aggregates</h2>
            <div className="grid gap-3 sm:grid-cols-3 font-mono">
              {GLOBAL_LIQUIDITY_ITEMS.map((g, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{g.label}</p>
                  <p className="num mt-1 text-lg font-bold text-foreground">{g.value}</p>
                  <p className={`text-[11px] mt-0.5 ${g.tone === 'bull' ? 'text-bull' : g.tone === 'bear' ? 'text-bear' : 'text-muted-foreground'}`}>{g.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* India Gold Desk */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">13 · India Gold Desk (MCX · Premiums · Physical)</h2>
            <div className="grid gap-3 sm:grid-cols-3 font-mono">
              {INDIA_DESK_ITEMS.map((item, i) => (
                <div key={i} className="panel rounded border border-border bg-secondary/40 p-3">
                  <p className="label-xs">{item.label}</p>
                  <p className="num mt-1 text-lg font-bold text-foreground">{item.value}</p>
                  <p className={`text-[11px] mt-0.5 ${item.tone === 'bull' ? 'text-bull' : 'text-muted-foreground'}`}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Supply & Fundamentals */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">14 · Gold Mine Supply & AISC Margins</h2>
            <div className="panel overflow-x-auto rounded border border-border bg-secondary/20 font-mono">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                    <th className="px-3 py-2">Producer</th>
                    <th className="px-3 py-2">Annual Output</th>
                    <th className="px-3 py-2">AISC Cost</th>
                    <th className="px-3 py-2 text-right">Guidance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {MINERS_DATA.map((m, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-foreground font-sans">{m.company}</td>
                      <td className="px-3 py-2 text-foreground">{m.production}</td>
                      <td className="px-3 py-2 text-foreground font-bold">{m.aisc}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{m.guidance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 6. 16 · AI Gold Brain — Regime Score (10 Pillars) */}
      <div className="panel border border-border rounded-lg bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">16 · AI Gold Brain — 10 Pillars Regime Score</h2>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="panel rounded-lg border border-border bg-secondary/40 p-4 space-y-3 font-mono">
            {PILLARS_SCORE.map(p => (
              <div key={p.pillar} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{p.pillar}</span>
                  <span className="text-bull font-bold">{p.score}/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden border border-border">
                  <div className="h-full bg-bull" style={{ width: `${p.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="panel rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
            <p className="label-xs">Gold long-term bias</p>
            <p className="text-2xl font-bold text-bull">BULLISH (78/100)</p>
            <div className="border-t border-border pt-2 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Key Drivers:</p>
              <p>• Central-bank demand strong — structural bid har dip pe.</p>
              <p>• ETF flows improving — institutional participation wapas.</p>
              <p>• Global liquidity supportive — M2 growth positive.</p>
              <p>• Geopolitical risk elevated — safe-haven premium.</p>
              <p>• Real-yield trend supportive — opportunity cost gir raha hai.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. World News Matrix */}
      <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Gold, Silver, Bitcoin & Ethereum — World Intelligence</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {WORLD_NEWS.map((n, i) => (
            <article key={i} className="panel rounded border border-border bg-secondary/40 p-3 space-y-1">
              <span className="label-xs text-gold font-bold">[{n.tag}]</span>
              <h3 className="text-sm font-bold text-foreground font-sans">{n.headline}</h3>
              <p className="text-xs text-muted-foreground font-sans">{n.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="label-xs">
        Live prices Yahoo Finance / OANDA / CoinGecko se; positioning, ETF, central-bank, supply aur options figures illustrative institutional framework hain — not investment advice.
      </p>
    </div>
  );
};

export default GoldDashboardView;
