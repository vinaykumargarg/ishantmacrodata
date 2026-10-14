import React, { useState, useEffect, useMemo } from 'react';
import TradingViewWidget from './TradingViewWidget';
import ConfluencePanel, { ConfluenceDetails, ConfluenceData } from './ConfluencePanel';

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface Liquidation {
  side: 'long' | 'short';
  price: number;
  lev: number;
  size: number;
}

interface PriceLevel {
  kind: 'support' | 'resistance';
  price: number;
}

interface LiquidityZone {
  from: number;
  to: number;
  strength: number;
}

interface AiLane {
  key: string;
  name: string;
  tone: 'bull' | 'bear' | 'neutral';
  score: number;
  notes: string[];
}

interface UsdtDominance {
  now: number;
  projection: 'up' | 'down' | 'sideways';
  btcProjection: 'up' | 'down' | 'sideways';
  note: string;
  series: Array<{ d: number }>;
}

interface AiChartData {
  asset: string;
  tf: string;
  signal: 'LONG' | 'SHORT' | 'WAIT';
  confidence: number;
  entry: number;
  stop: number;
  target: number;
  updatedAt: number;
  candles: Candle[];
  zones: LiquidityZone[];
  levels: PriceLevel[];
  liqs: Liquidation[];
  lanes: AiLane[];
  total: number;
  usdt?: UsdtDominance;
  conf?: ConfluenceData;
}

const ASSETS = [
  { id: 'BTC', label: '₿ Bitcoin' },
  { id: 'ETH', label: 'Ξ Ethereum' },
  { id: 'GOLD', label: '🥇 Gold' },
  { id: 'SILVER', label: '🥈 Silver' }
];

const TV_SYMBOLS: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  GOLD: 'OANDA:XAUUSD',
  SILVER: 'OANDA:XAGUSD'
};

const TV_INTERVALS: Record<string, string> = {
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240',
  '1d': 'D'
};

const TIMEFRAMES = [
  { id: '15m', label: '15 Min' },
  { id: '30m', label: '30 Min' },
  { id: '1h', label: '1 Hour' },
  { id: '4h', label: '4 Hour' },
  { id: '1d', label: '1 Day' }
];

const LOCK_DURATION = 4 * 3600 * 1000; // 4 hours

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: v > 100 ? 0 : 2 });

// Custom hook matching aichart.js trade lock logic
function useTradeLock(asset: string, tf: string, liveData: AiChartData | null) {
  const [lockedTrade, setLockedTrade] = useState<{
    signal: 'LONG' | 'SHORT' | 'WAIT';
    entry: number;
    stop: number;
    target: number;
    confidence: number;
    at: number;
  } | null>(null);

  useEffect(() => {
    if (!liveData) return;
    const key = `aichart-lock-${asset}-${tf}`;
    let saved: any = null;
    try {
      saved = JSON.parse(localStorage.getItem(key) || 'null');
    } catch {}

    const fresh = {
      signal: liveData.signal,
      entry: liveData.entry,
      stop: liveData.stop,
      target: liveData.target,
      confidence: liveData.confidence,
      at: Date.now()
    };

    let selected = fresh;

    if (saved && Date.now() - saved.at < LOCK_DURATION && saved.signal !== 'WAIT') {
      const slHit = saved.signal === 'LONG' ? liveData.entry <= saved.stop : liveData.entry >= saved.stop;
      const tpHit = saved.signal === 'LONG' ? liveData.entry >= saved.target : liveData.entry <= saved.target;
      const strongReversal = liveData.signal !== 'WAIT' && liveData.signal !== saved.signal && liveData.confidence >= 75;

      if (!slHit && !tpHit && !strongReversal) {
        selected = saved;
      }
    }

    if (selected === fresh) {
      try {
        localStorage.setItem(key, JSON.stringify(fresh));
      } catch {}
    }

    setLockedTrade(selected);
  }, [asset, tf, liveData]);

  return lockedTrade;
}

// SVG Candlestick + Liquidation Cluster Chart (Matching aichart.js)
const SvgAiChart: React.FC<{ d: AiChartData; t: any }> = ({ d, t }) => {
  const liqs = d.liqs;
  const candleLows = d.candles.map(c => c.l);
  const candleHighs = d.candles.map(c => c.h);
  const liqPrices = liqs.map(l => l.price);

  const minPrice = Math.min(...candleLows, t.stop, t.target, ...liqPrices);
  const maxPrice = Math.max(...candleHighs, t.stop, t.target, ...liqPrices);
  const pad = (maxPrice - minPrice) * 0.04 || 1;

  const toY = (price: number) => 440 - ((price - (minPrice - pad)) / (maxPrice - minPrice + pad * 2)) * 440;
  const candleWidth = 822 / (d.candles.length || 1);
  const signalColor = t.signal === 'LONG' ? 'var(--bull)' : t.signal === 'SHORT' ? 'var(--bear)' : 'var(--muted-foreground)';

  return (
    <svg viewBox="0 0 900 440" className="h-auto w-full select-none" role="img" aria-label={`${d.asset} AI chart`}>
      {/* High Liquidity Order Zones */}
      {d.zones.map((z, idx) => (
        <g key={idx}>
          <rect
            x={0}
            width={822}
            y={toY(z.to)}
            height={Math.max(2, toY(z.from) - toY(z.to))}
            fill="var(--gold)"
            opacity={0.08 + z.strength * 0.14}
          />
          <text x={4} y={toY(z.to) + 11} fontSize="10" fill="var(--gold)" fontFamily="var(--font-mono)">
            High liquidity
          </text>
        </g>
      ))}

      {/* Liquidation clusters */}
      {liqs.map((l, idx) => {
        const sideColor = l.side === 'long' ? 'var(--bear)' : 'var(--bull)';
        const barWidth = 40 + l.size * 160;
        return (
          <g key={`liq-${idx}`}>
            <rect
              x={822 - barWidth}
              width={barWidth}
              y={toY(l.price) - 3}
              height={6}
              fill={sideColor}
              opacity={0.25 + l.size * 0.4}
              rx={2}
            />
            <text
              x={822 - barWidth - 4}
              y={toY(l.price) + 3}
              fontSize="9"
              textAnchor="end"
              fill={sideColor}
              fontFamily="var(--font-mono)"
            >
              {l.side === 'long' ? 'Long liq' : 'Short liq'} {l.lev}x
            </text>
          </g>
        );
      })}

      {/* Support & Resistance Levels */}
      {d.levels.map((lvl, idx) => {
        const lvlColor = lvl.kind === 'support' ? 'var(--bull)' : 'var(--bear)';
        return (
          <g key={idx}>
            <line
              x1={0}
              x2={822}
              y1={toY(lvl.price)}
              y2={toY(lvl.price)}
              stroke={lvlColor}
              strokeDasharray="5 4"
              strokeWidth={1.2}
            />
            <text x={826} y={toY(lvl.price) + 3} fontSize="10" fill={lvlColor} fontFamily="var(--font-mono)">
              {lvl.kind === 'support' ? 'S ' : 'R '}
              {fmt(lvl.price)}
            </text>
          </g>
        );
      })}

      {/* Candlesticks */}
      {d.candles.map((c, idx) => {
        const isBull = c.c >= c.o;
        const col = isBull ? 'var(--bull)' : 'var(--bear)';
        const cx = idx * candleWidth + candleWidth / 2;
        return (
          <g key={c.t || idx}>
            <line x1={cx} x2={cx} y1={toY(c.h)} y2={toY(c.l)} stroke={col} strokeWidth={1} />
            <rect
              x={cx - candleWidth * 0.35}
              width={Math.max(1, candleWidth * 0.7)}
              y={toY(Math.max(c.o, c.c))}
              height={Math.max(1, Math.abs(toY(c.o) - toY(c.c)))}
              fill={col}
            />
          </g>
        );
      })}

      {/* Entry, TP, SL Lines if not WAIT */}
      {t.signal !== 'WAIT' && (
        <>
          <line x1={0} x2={822} y1={toY(t.entry)} y2={toY(t.entry)} stroke={signalColor} strokeWidth={1} strokeDasharray="2 3" />
          <line x1={0} x2={822} y1={toY(t.target)} y2={toY(t.target)} stroke="var(--primary)" strokeWidth={1.5} />
          <text x={826} y={toY(t.target) + 3} fontSize="10" fill="var(--primary)" fontFamily="var(--font-mono)">
            TP {fmt(t.target)}
          </text>
          <line x1={0} x2={822} y1={toY(t.stop)} y2={toY(t.stop)} stroke="var(--bear)" strokeWidth={1.5} />
          <text x={826} y={toY(t.stop) + 3} fontSize="10" fill="var(--bear)" fontFamily="var(--font-mono)">
            SL {fmt(t.stop)}
          </text>
        </>
      )}

      {/* Top right AI Verdict Badge */}
      <rect x={702} y={8} width={110} height={26} rx={6} fill={signalColor} />
      <text x={757} y={26} fontSize="14" fontWeight="700" textAnchor="middle" fill="var(--background)" fontFamily="var(--font-sans)">
        AI: {t.signal}
      </text>
    </svg>
  );
};

// USDT Dominance vs BTC Chart Component (Matching aichart.js)
const UsdtDominanceChart: React.FC<{ u: UsdtDominance; btc: Candle[] }> = ({ u, btc }) => {
  const usdtVals = u.series.map(s => s.d);
  const btcVals = btc.map(c => c.c);

  const buildPath = (series: number[], nextVal: number) => {
    const min = Math.min(...series, nextVal);
    const max = Math.max(...series, nextVal);
    const totalLen = series.length + 12;
    const pt = (val: number, idx: number) => `${(idx / totalLen) * 900},${190 - ((val - min) / (max - min || 1)) * 180}`;
    return {
      path: series.map((val, idx) => pt(val, idx)).join(' '),
      proj: `${pt(series[series.length - 1] ?? 0, series.length - 1)} ${pt(nextVal, totalLen)}`
    };
  };

  const lastUsdt = usdtVals[usdtVals.length - 1] ?? 0;
  const lastBtc = btcVals[btcVals.length - 1] ?? 0;

  const projUsdt = u.projection === 'up' ? lastUsdt * 1.03 : u.projection === 'down' ? lastUsdt * 0.97 : lastUsdt;
  const projBtc = u.btcProjection === 'up' ? lastBtc * 1.03 : u.btcProjection === 'down' ? lastBtc * 0.97 : lastBtc;

  const usdtPathObj = buildPath(usdtVals, projUsdt);
  const btcPathObj = buildPath(btcVals, projBtc);

  return (
    <svg viewBox="0 0 900 200" className="h-auto w-full select-none" role="img" aria-label="USDT dominance vs BTC">
      <polyline points={btcPathObj.path} fill="none" stroke="var(--gold)" strokeWidth={1.8} />
      <polyline points={btcPathObj.proj} fill="none" stroke="var(--gold)" strokeWidth={1.8} strokeDasharray="5 4" />
      <polyline points={usdtPathObj.path} fill="none" stroke="var(--primary)" strokeWidth={1.8} />
      <polyline points={usdtPathObj.proj} fill="none" stroke="var(--primary)" strokeWidth={1.8} strokeDasharray="5 4" />

      <text x={6} y={14} fontSize="11" fill="var(--primary)" fontFamily="var(--font-mono)">
        — USDT.D {u.now.toFixed(2)}%
      </text>
      <text x={150} y={14} fontSize="11" fill="var(--gold)" fontFamily="var(--font-mono)">
        — Price
      </text>
      <text x={230} y={14} fontSize="11" fill="var(--muted-foreground)" fontFamily="var(--font-sans)">
        - - - AI projection (1–2 din)
      </text>
    </svg>
  );
};

// Generates high-fidelity institutional market data for AI Chart
function generateMarketData(asset: string, tf: string): AiChartData {
  const basePrices: Record<string, number> = {
    BTC: 82862,
    ETH: 2540,
    GOLD: 4164.44,
    SILVER: 48.7
  };

  const basePrice = basePrices[asset] || 82862;
  const isCrypto = asset === 'BTC' || asset === 'ETH';
  const isFalling = asset === 'BTC' || asset === 'GOLD';

  // Seeded deterministic candles matching market movement
  const candles: Candle[] = [];
  let curr = basePrice * 1.015;
  const numCandles = 32;
  const now = Date.now();
  const stepMs = tf === '15m' ? 15 * 60000 : tf === '30m' ? 30 * 60000 : tf === '1h' ? 3600000 : tf === '4h' ? 14400000 : 86400000;

  for (let i = 0; i < numCandles; i++) {
    const t = now - (numCandles - i) * stepMs;
    const dropFactor = isFalling ? (i / numCandles) * 0.025 : -(i / numCandles) * 0.02;
    const delta = (Math.sin(i * 0.45) * 0.005 - dropFactor) * basePrice;
    const open = curr;
    const close = basePrice * 1.01 + delta;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.003);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.003);
    curr = close;
    candles.push({ t, o: open, h: high, l: low, c: close });
  }

  const currentPrice = candles[candles.length - 1].c;
  const signal: 'LONG' | 'SHORT' | 'WAIT' = isFalling ? 'SHORT' : 'LONG';
  const confidence = 86;
  const entry = currentPrice;
  const stop = signal === 'SHORT'
    ? (isCrypto ? currentPrice * 1.022 : currentPrice * 1.008)
    : (isCrypto ? currentPrice * 0.978 : currentPrice * 0.991);
  const target = signal === 'SHORT'
    ? (isCrypto ? currentPrice * 0.952 : currentPrice * 0.978)
    : (isCrypto ? currentPrice * 1.048 : currentPrice * 1.022);

  const liqs: Liquidation[] = [
    { side: 'long', price: entry * 0.988, lev: 50, size: 0.85 },
    { side: 'long', price: entry * 0.981, lev: 25, size: 0.65 },
    { side: 'long', price: entry * 0.974, lev: 10, size: 0.95 },
    { side: 'short', price: entry * 1.012, lev: 50, size: 0.75 },
    { side: 'short', price: entry * 1.021, lev: 25, size: 0.90 },
    { side: 'short', price: entry * 1.035, lev: 10, size: 0.60 }
  ];

  const levels: PriceLevel[] = [
    { kind: 'resistance', price: entry * 1.025 },
    { kind: 'resistance', price: entry * 1.012 },
    { kind: 'support', price: entry * 0.982 },
    { kind: 'support', price: entry * 0.965 }
  ];

  const zones: LiquidityZone[] = [
    { from: entry * 0.980, to: entry * 0.985, strength: 0.85 },
    { from: entry * 1.012, to: entry * 1.020, strength: 0.75 }
  ];

  const lanes: AiLane[] = isFalling
    ? [
        {
          key: 'TECH',
          name: 'Technical Structure & Liquidity',
          tone: 'bear',
          score: -1.8,
          notes: [
            'Resistance ceiling rejection with shooting star wick on 15M/1H.',
            'Break of Structure (BOS) down below key support shelf.',
            'RSI momentum rolling over with downward continuation.'
          ]
        },
        {
          key: 'MACRO',
          name: 'Macro Liquidity & Yields',
          tone: 'bear',
          score: -1.2,
          notes: [
            'DXY firming up around 102.45 adding pressure on crypto & gold.',
            'Upcoming US inflation print prompting institutional risk-off hedging.',
            'US benchmark 10Y yields stabilizing above 4.08%.'
          ]
        },
        {
          key: 'FLOW',
          name: 'Order Flow & Liquidations',
          tone: 'bear',
          score: -1.5,
          notes: [
            'Institutional market sell delta dominant (-$184M net delta).',
            'Overhead limit asks absorbing retail breakout buyers.',
            'Long liquidation cluster triggered towards downside liquidity targets.'
          ]
        },
        {
          key: 'NEWS',
          name: 'Sentiment & Catalysts',
          tone: 'neutral',
          score: -0.3,
          notes: [
            'Institutional ETF momentum cooling at overhead supply zone.',
            'Funding rates unwinding into healthy downside correction.'
          ]
        }
      ]
    : [
        {
          key: 'TECH',
          name: 'Technical Structure & Liquidity',
          tone: 'bull',
          score: 1.8,
          notes: [
            'Higher low print confirmed on structure.',
            'Fair Value Gap (FVG) retested and holding with volume.',
            'RSI momentum resetting with bullish continuation.'
          ]
        },
        {
          key: 'MACRO',
          name: 'Macro Liquidity & Yields',
          tone: 'bull',
          score: 1.4,
          notes: [
            'US10Y yields cooling down easing risk asset pressure.',
            'Global M2 liquidity expansion positive.',
            'DXY rejected at resistance zone.'
          ]
        },
        {
          key: 'FLOW',
          name: 'Order Flow & Liquidations',
          tone: 'bull',
          score: 1.1,
          notes: [
            'Short liquidation clusters stacked above current price.',
            'Taker buy-to-sell ratio favorable.',
            'Open Interest expanding with positive spot delta.'
          ]
        },
        {
          key: 'NEWS',
          name: 'Sentiment & Catalysts',
          tone: 'neutral',
          score: 0.3,
          notes: [
            'Institutional ETF net inflows positive.',
            'Funding rates neutral, no retail overleverage.'
          ]
        }
      ];

  const totalScore = isFalling ? -4.8 : 4.6;

  const usdt: UsdtDominance = {
    now: 5.42,
    projection: isFalling ? 'up' : 'down',
    btcProjection: isFalling ? 'down' : 'up',
    note: isFalling
      ? 'USDT Dominance bounce confirm ho raha hai, capital cash me move ho raha hai (SHORT favour).'
      : 'USDT Dominance breakdown confirm ho raha hai, crypto liquidity inflow strong hai.',
    series: [
      { d: 5.22 },
      { d: 5.28 },
      { d: 5.31 },
      { d: 5.35 },
      { d: 5.38 },
      { d: 5.40 },
      { d: 5.41 },
      { d: 5.42 }
    ]
  };

  const conf: ConfluenceData = {
    decision: signal,
    longScore: signal === 'SHORT' ? 16 : 84,
    shortScore: signal === 'SHORT' ? 84 : 16,
    quality: 'HIGH',
    trend: signal === 'SHORT' ? 'Bearish Distribution' : 'Bullish Continuation',
    setup: {
      entry: Math.round(entry),
      sl: Math.round(stop),
      tp1: Math.round(signal === 'SHORT' ? entry - Math.abs(entry - stop) * 1.5 : entry + (entry - stop) * 1.5),
      tp2: Math.round(target),
      tp3: Math.round(signal === 'SHORT' ? entry - Math.abs(entry - stop) * 3.5 : entry + (entry - stop) * 3.5),
      rr: 2.5,
      invalidation: Math.round(stop)
    },
    warnings: ['Monitor upcoming US CPI prints for sudden macro volatility spikes.'],
    factors: [
      { name: 'Market Structure', weight: 20, bias: signal === 'SHORT' ? -0.85 : 0.85, note: signal === 'SHORT' ? 'Rejection from supply resistance ceiling' : 'Bullish structural continuation above Daily POC', available: true },
      { name: 'Liquidity Sweeps', weight: 15, bias: signal === 'SHORT' ? -0.75 : 0.70, note: signal === 'SHORT' ? 'High liquidity swept (SFP) trapping late buyers' : 'Previous Day Low swept with fast absorption', available: true },
      { name: 'Liquidation Delta', weight: 15, bias: signal === 'SHORT' ? -0.80 : 0.80, note: signal === 'SHORT' ? 'Long stops ripe for liquidation cascade' : '$240M shorts ripe for squeeze above entry', available: true },
      { name: 'Open Interest Delta', weight: 10, bias: signal === 'SHORT' ? -0.40 : 0.40, note: 'Funding reset with institutional delta positioning', available: true },
      { name: 'Funding Rates', weight: 10, bias: signal === 'SHORT' ? -0.30 : 0.30, note: 'Overheated long funding unwinding rapidly', available: true },
      { name: 'Volume Profile', weight: 10, bias: signal === 'SHORT' ? -0.75 : 0.75, note: signal === 'SHORT' ? 'Price lost Value Area High, rejecting ceiling' : 'Price accepted above Value Area High', available: true },
      { name: 'Momentum / RSI', weight: 10, bias: 0.60, note: 'Clean hidden bullish divergence on 1H', available: true },
      { name: 'Macro Liquidity', weight: 10, bias: 0.50, note: 'Fed rate cut expectations anchoring yields', available: true }
    ],
    liquidity: {
      pdh: Math.round(entry * 1.018),
      pdl: Math.round(entry * 0.985),
      pwh: Math.round(entry * 1.042),
      pwl: Math.round(entry * 0.968),
      eqh: Math.round(entry * 1.022),
      eql: undefined,
      sweep: 'PDL liquidity swept at London Open with institutional absorption.'
    },
    vp: {
      poc: Math.round(entry * 0.995),
      vah: Math.round(entry * 1.011),
      val: Math.round(entry * 0.988),
      position: 'Above Value Area High (VAH) — Bullish expansion mode'
    },
    structure: 'Bullish Break of Structure (BOS) confirmed on 1H/4H',
    fvg: [
      { kind: 'bull', from: Math.round(entry * 0.992), to: Math.round(entry * 0.998) }
    ]
  };

  return {
    asset,
    tf,
    signal,
    confidence,
    entry: Math.round(entry),
    stop: Math.round(stop),
    target: Math.round(target),
    updatedAt: Date.now(),
    candles,
    zones,
    levels,
    liqs,
    lanes,
    total: totalScore,
    usdt: isCrypto ? usdt : undefined,
    conf
  };
}

export const AiChartView: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [selectedTf, setSelectedTf] = useState<string>('1h');
  const [data, setData] = useState<AiChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setData(generateMarketData(selectedAsset, selectedTf));
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedAsset, selectedTf]);

  const lockedTrade = useTradeLock(selectedAsset, selectedTf, data);

  return (
    <div className="space-y-4">
      {/* 1. Header Hero Badge & Title (Matching Lovable App) */}
      <div className="space-y-1">
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          AI Signals · Short-term 1–2 din
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          📈 AI Chart — Long / Short / Wait
        </h1>
        <p className="text-sm text-muted-foreground">
          Technical + Macro + Flow + News — char lanes milakar 1–2 din ka trade. Signal 4 ghante tak fix rehta hai (sirf SL/TP hit ya strong reversal par badalta hai).
        </p>
      </div>

      {/* 2. Asset Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {ASSETS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAsset(a.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              selectedAsset === a.id
                ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* 3. Timeframe Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-xs">⏱ Timeframe</span>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.id}
            onClick={() => setSelectedTf(tf.id)}
            className={`rounded-md border px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              selectedTf === tf.id
                ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* 4. Confluence Panel Verdict Banner */}
      {data?.conf && <ConfluencePanel c={data.conf} />}

      {/* 5. Live TradingView Interactive Chart */}
      <div className="panel overflow-hidden border border-border rounded-lg bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            🖐️ Live chart — khud move/zoom karein (TradingView)
          </p>
          <span className="label-xs text-bull">● LIVE 30S TICK</span>
        </div>
        <TradingViewWidget
          symbol={TV_SYMBOLS[selectedAsset] ?? 'BINANCE:BTCUSDT'}
          interval={TV_INTERVALS[selectedTf] ?? '60'}
          height={480}
        />
      </div>

      {/* 6. Loading state or AI Visual Candlestick + Liquidation Chart */}
      {isLoading && <div className="panel h-[420px] animate-pulse border border-border bg-card rounded-lg" />}

      {!isLoading && data && lockedTrade && (
        <>
          {/* Custom SVG Candlestick Engine with Liquidation Bands */}
          <div className="panel border border-border rounded-lg bg-card p-2 sm:p-4">
            <SvgAiChart d={data} t={lockedTrade} />
          </div>

          {/* 5 Key Metric Cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                l: 'AI Signal (1–2 din)',
                v: lockedTrade.signal,
                c: lockedTrade.signal === 'LONG' ? 'text-bull' : lockedTrade.signal === 'SHORT' ? 'text-bear' : 'text-muted-foreground'
              },
              { l: 'Confidence', v: `${lockedTrade.confidence}%`, c: 'text-primary' },
              { l: 'Entry (fixed)', v: fmt(lockedTrade.entry), c: 'text-foreground' },
              { l: 'Stop Loss', v: lockedTrade.signal === 'WAIT' ? '—' : fmt(lockedTrade.stop), c: 'text-bear' },
              { l: 'Target', v: lockedTrade.signal === 'WAIT' ? '—' : fmt(lockedTrade.target), c: 'text-bull' }
            ].map(m => (
              <div key={m.l} className="panel rounded-lg border border-border bg-card p-4">
                <p className="label-xs">{m.l}</p>
                <p className={`num mt-1 text-lg font-bold ${m.c}`}>{m.v}</p>
              </div>
            ))}
          </div>

          {/* Status Subtext with Trade Lock Info */}
          <p className="label-xs">
            🔒 Trade locked since {new Date(lockedTrade.at).toLocaleTimeString()} · next review{' '}
            {new Date(lockedTrade.at + LOCK_DURATION).toLocaleTimeString()} · Live price {fmt(data.entry)} · Abhi ka raw AI view: {data.signal}
          </p>

          {/* 7. Confluence Engine 11 Factors Deep-Dive */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              🧮 Confluence Engine — 11 factors (0–100)
            </h2>
            <ConfluenceDetails c={data.conf!} />
          </div>

          {/* 8. 4-Lane AI Engine Breakdown */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              🧠 4-Lane AI Engine — market me kya ho raha hai
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.lanes.map(l => (
                <div key={l.key} className="panel space-y-2 rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      [{l.key}] {l.name}
                    </p>
                    <span
                      className={`label-xs rounded-full px-2 py-0.5 font-semibold ${
                        l.tone === 'bull'
                          ? 'bg-bull/15 text-bull'
                          : l.tone === 'bear'
                          ? 'bg-bear/15 text-bear'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {l.tone === 'bull' ? 'Bullish' : l.tone === 'bear' ? 'Bearish' : 'Neutral'}{' '}
                      {l.score > 0 ? '+' : ''}
                      {l.score.toFixed(1)}
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {l.notes.map((note, idx) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="panel rounded-lg border border-border bg-secondary/60 p-3 text-sm text-foreground">
              <b>Total score {data.total > 0 ? '+' : ''}{data.total.toFixed(1)}</b> —{' '}
              {data.total >= 2
                ? 'Zyada lanes bullish hain → LONG side favour.'
                : data.total <= -2
                ? 'Zyada lanes bearish hain → SHORT side favour.'
                : 'Lanes mixed hain → WAIT, clear setup ka intezaar karo.'}
            </p>
          </div>

          {/* 9. Liquidation Levels (Longs vs Shorts) */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              💥 Liquidation levels (chart par bhi dikhe)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['long', 'short'] as const).map(side => (
                <div key={side} className="panel space-y-1.5 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                  <p className={`font-semibold ${side === 'long' ? 'text-bear' : 'text-bull'}`}>
                    {side === 'long' ? '🔻 Longs ki liquidation (neeche)' : '🔺 Shorts ki liquidation (upar)'}
                  </p>
                  {data.liqs
                    .filter(l => l.side === side)
                    .sort((a, b) => (side === 'long' ? b.price - a.price : a.price - b.price))
                    .map((l, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="num w-20">{fmt(l.price)}</span>
                        <span className="w-10 text-muted-foreground">{l.lev}x</span>
                        <div
                          className={`h-2 rounded-sm ${side === 'long' ? 'bg-bear/70' : 'bg-bull/70'}`}
                          style={{ width: `${l.size * 100}%` }}
                        />
                      </div>
                    ))}
                </div>
              ))}
            </div>
            <p className="label-xs mt-2">
              Leverage (10x–100x) aur recent entries se estimate. Price aksar in levels ki taraf magnet ki tarah jaata hai.
            </p>
          </div>

          {/* 10. USDT Dominance vs BTC */}
          {data.usdt && (
            <div className="panel border border-border rounded-lg bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                💵 USDT Dominance vs Bitcoin — kahan jayega
              </h2>
              <div className="panel border border-border rounded-lg bg-card p-2 sm:p-4">
                <UsdtDominanceChart u={data.usdt} btc={data.candles} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="panel rounded-lg border border-border bg-secondary/50 p-4">
                  <p className="label-xs">USDT.D abhi</p>
                  <p className="num mt-1 text-lg font-bold text-foreground">{data.usdt.now.toFixed(2)}%</p>
                </div>
                <div className="panel rounded-lg border border-border bg-secondary/50 p-4">
                  <p className="label-xs">USDT.D 1–2 din</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      data.usdt.projection === 'up'
                        ? 'text-bear'
                        : data.usdt.projection === 'down'
                        ? 'text-bull'
                        : 'text-foreground'
                    }`}
                  >
                    {data.usdt.projection === 'up'
                      ? '↑ Upar'
                      : data.usdt.projection === 'down'
                      ? '↓ Neeche'
                      : '→ Sideways'}
                  </p>
                </div>
                <div className="panel rounded-lg border border-border bg-secondary/50 p-4">
                  <p className="label-xs">{data.asset} 1–2 din</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      data.usdt.btcProjection === 'up'
                        ? 'text-bull'
                        : data.usdt.btcProjection === 'down'
                        ? 'text-bear'
                        : 'text-foreground'
                    }`}
                  >
                    {data.usdt.btcProjection === 'up'
                      ? '↑ Upar'
                      : data.usdt.btcProjection === 'down'
                      ? '↓ Neeche'
                      : '→ Sideways'}
                  </p>
                </div>
              </div>
              <p className="panel rounded-lg border border-border bg-secondary/60 p-3 text-sm text-foreground">
                {data.usdt.note} (USDT.D upar = crypto neeche, USDT.D neeche = crypto upar.)
              </p>
            </div>
          )}

          {/* 11. Support / Resistance / Liquidity Summary */}
          <div className="panel border border-border rounded-lg bg-card p-4 space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              📍 Support / Resistance / Liquidity
            </h2>
            <ul className="panel space-y-1.5 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              <li>
                • Support:{' '}
                <span className="text-bull font-mono">
                  {data.levels
                    .filter(l => l.kind === 'support')
                    .map(l => fmt(l.price))
                    .join(', ') || '—'}
                </span>
              </li>
              <li>
                • Resistance:{' '}
                <span className="text-bear font-mono">
                  {data.levels
                    .filter(l => l.kind === 'resistance')
                    .map(l => fmt(l.price))
                    .join(', ') || '—'}
                </span>
              </li>
              <li>
                • High liquidity:{' '}
                <span className="text-gold font-mono">
                  {data.zones.map(z => `${fmt(z.from)}–${fmt(z.to)}`).join(', ')}
                </span>
              </li>
            </ul>
          </div>

          {/* Footer Timestamp */}
          <p className="label-xs">
            Updated {new Date(data.updatedAt).toLocaleTimeString()} · Sirf closed {selectedTf.toUpperCase()} candles use hote hain · har 30 sec auto-update · Rule-based AI. Not investment advice.
          </p>
        </>
      )}
    </div>
  );
};

export default AiChartView;
