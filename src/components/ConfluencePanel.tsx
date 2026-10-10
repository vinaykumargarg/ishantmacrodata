import React from 'react';

export interface ConfluenceFactor {
  name: string;
  weight: number;
  bias: number; // -1 to +1
  note: string;
  available: boolean;
}

export interface ConfluenceData {
  decision: 'LONG' | 'SHORT' | 'WAIT' | 'NO TRADE';
  longScore: number;
  shortScore: number;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  trend: string;
  setup?: {
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    rr: number;
    invalidation: number;
  };
  warnings: string[];
  factors: ConfluenceFactor[];
  liquidity: {
    pdh: number;
    pdl: number;
    pwh: number;
    pwl: number;
    eqh?: number;
    eql?: number;
    sweep: string;
  };
  vp: {
    poc: number;
    vah: number;
    val: number;
    position: string;
  };
  structure: string;
  fvg: Array<{ kind: 'bull' | 'bear'; from: number; to: number }>;
}

const formatNumber = (e: number) => e.toLocaleString(undefined, { maximumFractionDigits: e > 100 ? 2 : 4 });

const decisionStyles: Record<string, { icon: string; cls: string }> = {
  LONG: { icon: '🟢', cls: 'border-bull/50 bg-bull/10 text-bull' },
  SHORT: { icon: '🔴', cls: 'border-bear/50 bg-bear/10 text-bear' },
  WAIT: { icon: '🟡', cls: 'border-gold/50 bg-gold/10 text-gold' },
  'NO TRADE': { icon: '⛔', cls: 'border-border bg-secondary text-muted-foreground' }
};

const biasLabel = (b: number) => b > 0.15 ? 'Bullish' : b < -0.15 ? 'Bearish' : 'Neutral';
const biasColor = (b: number) => b > 0.15 ? 'text-bull' : b < -0.15 ? 'text-bear' : 'text-muted-foreground';

export const ConfluencePanel: React.FC<{ c: ConfluenceData }> = ({ c }) => {
  const o = decisionStyles[c.decision] || decisionStyles.WAIT;
  const findFactor = (t: string) => c.factors?.find(f => f.name.startsWith(t));
  const quickChecks: Array<[string, string, number]> = [
    ['Trend', c.trend, findFactor('Market')?.bias ?? 0],
    ['Liquidity', biasLabel(findFactor('Liquidity')?.bias ?? 0), findFactor('Liquidity')?.bias ?? 0],
    ['Liquidation', findFactor('Liquidation')?.available ? biasLabel(findFactor('Liquidation')!.bias) : 'DATA UNAVAILABLE', findFactor('Liquidation')?.bias ?? 0],
    ['OI', findFactor('Open')?.available ? biasLabel(findFactor('Open')!.bias) : 'DATA UNAVAILABLE', findFactor('Open')?.bias ?? 0],
    ['Funding', findFactor('Funding')?.available ? biasLabel(findFactor('Funding')!.bias) : 'DATA UNAVAILABLE', findFactor('Funding')?.bias ?? 0],
    ['Volume', findFactor('Volume')?.available ? biasLabel(findFactor('Volume')!.bias) : 'DATA UNAVAILABLE', findFactor('Volume')?.bias ?? 0],
    ['Volume Profile', c.vp?.position || '—', findFactor('Volume Profile')?.bias ?? 0],
    ['Momentum', biasLabel(findFactor('Momentum')?.bias ?? 0), findFactor('Momentum')?.bias ?? 0],
    ['Macro / News', biasLabel(findFactor('Macro')?.bias ?? 0), findFactor('Macro')?.bias ?? 0]
  ];

  return (
    <section className={`panel space-y-3 border-2 p-4 ${o.cls}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-3xl font-bold">
          {o.icon} {c.decision}
        </p>
        <div className="flex gap-4 text-sm text-foreground">
          <span>LONG <b className="num text-bull">{c.longScore}/100</b></span>
          <span>SHORT <b className="num text-bear">{c.shortScore}/100</b></span>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-semibold">
            {c.quality}
          </span>
        </div>
      </div>

      {c.setup ? (
        <div className="grid grid-cols-2 gap-2 text-sm text-foreground sm:grid-cols-4 lg:grid-cols-7">
          <div>Entry <b className="num block">{formatNumber(c.setup.entry)}</b></div>
          <div className="text-bear">SL <b className="num block">{formatNumber(c.setup.sl)}</b></div>
          <div className="text-bull">TP1 <b className="num block">{formatNumber(c.setup.tp1)}</b></div>
          <div className="text-bull">TP2 <b className="num block">{formatNumber(c.setup.tp2)}</b></div>
          <div className="text-bull">TP3 <b className="num block">{formatNumber(c.setup.tp3)}</b></div>
          <div>R:R <b className="num block">1:{c.setup.rr.toFixed(1)}</b></div>
          <div>Invalidation <b className="num block">{formatNumber(c.setup.invalidation)}</b></div>
        </div>
      ) : (
        <p className="text-sm text-foreground">
          Valid setup nahi hai — Entry/SL/TP tab dikhenge jab factors ek direction me agree karein. Trade force mat karein.
        </p>
      )}

      <div className="grid gap-x-4 gap-y-1 text-xs text-foreground sm:grid-cols-3">
        {quickChecks.map(([label, val, bias]) => (
          <p key={label}>
            <span className="text-muted-foreground">{label}:</span>{' '}
            <b className={biasColor(bias)}>{val}</b>
          </p>
        ))}
      </div>

      {c.warnings?.length > 0 && (
        <ul className="text-xs text-bear">
          {c.warnings.map((w, idx) => (
            <li key={idx}>⚠️ {w}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const ConfluenceDetails: React.FC<{ c: ConfluenceData }> = ({ c }) => {
  return (
    <div className="space-y-3">
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="label-xs px-3 py-2">Factor</th>
              <th className="label-xs px-3 py-2">Weight</th>
              <th className="label-xs px-3 py-2">Bias</th>
              <th className="label-xs px-3 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {c.factors?.map(f => (
              <tr key={f.name} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-semibold">{f.name}</td>
                <td className="num px-3 py-2">{f.available ? `${f.weight}%` : '—'}</td>
                <td className={`px-3 py-2 font-semibold ${f.available ? biasColor(f.bias) : 'text-muted-foreground'}`}>
                  {f.available ? `${biasLabel(f.bias)} ${f.bias > 0 ? '+' : ''}${f.bias.toFixed(2)}` : 'UNAVAILABLE'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{f.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-xs">
        <div className="panel space-y-1 p-3">
          <p className="label-xs">💧 Liquidity map</p>
          <p>PDH {formatNumber(c.liquidity?.pdh ?? 0)} · PDL {formatNumber(c.liquidity?.pdl ?? 0)}</p>
          <p>PWH {formatNumber(c.liquidity?.pwh ?? 0)} · PWL {formatNumber(c.liquidity?.pwl ?? 0)}</p>
          <p>Equal highs {c.liquidity?.eqh ? formatNumber(c.liquidity.eqh) : '—'} · Equal lows {c.liquidity?.eql ? formatNumber(c.liquidity.eql) : '—'}</p>
          <p>{c.liquidity?.sweep || '—'}</p>
        </div>

        <div className="panel space-y-1 p-3">
          <p className="label-xs">📊 Volume profile</p>
          <p>POC {formatNumber(c.vp?.poc ?? 0)}</p>
          <p>VAH {formatNumber(c.vp?.vah ?? 0)} · VAL {formatNumber(c.vp?.val ?? 0)}</p>
          <p>{c.vp?.position || '—'}</p>
        </div>

        <div className="panel space-y-1 p-3">
          <p className="label-xs">🧱 Structure / FVG</p>
          <p>{c.structure || '—'}</p>
          {c.fvg?.length ? (
            c.fvg.map((f, r) => (
              <p key={r} className={f.kind === 'bull' ? 'text-bull' : 'text-bear'}>
                {f.kind === 'bull' ? 'Bullish' : 'Bearish'} FVG {formatNumber(f.from)}–{formatNumber(f.to)}
              </p>
            ))
          ) : (
            <p>Koi open FVG nahi</p>
          )}
        </div>
      </div>
      <p className="label-xs">
        Score transparent hai: har factor ka weight × bias. Jo data free source me nahi milta (UNAVAILABLE) wo score se hata diya jata hai — koi fake data nahi. Decision support only, guaranteed profit nahi.
      </p>
    </div>
  );
};

export default ConfluencePanel;
