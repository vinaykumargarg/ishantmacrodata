import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';
import {
  runTrendAnalysisEngine,
  SupportedTrendAsset,
  TimeframeKey,
  TrendEvidenceOutput
} from '../services/trendAnalysisEngine';
import { sharedQuoteStore } from '../services/sharedQuoteStore';

interface Props {
  onNavigate?: (tab: string) => void;
  initialAsset?: SupportedTrendAsset;
}

const ASSET_LIST: { key: SupportedTrendAsset; name: string; symbol: string; tvSymbol: string; category: string }[] = [
  { key: 'XAUUSD', name: 'Gold Spot (XAU/USD)', symbol: 'XAUUSD', tvSymbol: 'OANDA:XAUUSD', category: 'METALS' },
  { key: 'BTCUSDT', name: 'Bitcoin (BTC/USDT)', symbol: 'BTCUSDT', tvSymbol: 'BINANCE:BTCUSDT', category: 'CRYPTO' },
  { key: 'ETHUSDT', name: 'Ethereum (ETH/USDT)', symbol: 'ETHUSDT', tvSymbol: 'BINANCE:ETHUSDT', category: 'CRYPTO' },
  { key: 'SOLUSDT', name: 'Solana (SOL/USDT)', symbol: 'SOLUSDT', tvSymbol: 'BINANCE:SOLUSDT', category: 'CRYPTO' },
  { key: 'XAGUSD', name: 'Silver Spot (XAG/USD)', symbol: 'XAGUSD', tvSymbol: 'OANDA:XAGUSD', category: 'METALS' },
  { key: 'DXY', name: 'US Dollar Index', symbol: 'DXY', tvSymbol: 'CAPITALCOM:DXY', category: 'FOREX' },
  { key: 'SPX', name: 'S&P 500 Index', symbol: 'SPX', tvSymbol: 'FOREXCOM:SPXUSD', category: 'EQUITIES' },
  { key: 'NIFTY', name: 'NIFTY 50 (India)', symbol: 'NIFTY', tvSymbol: 'NSE:NIFTY', category: 'EQUITIES' }
];

export const TrendAnalysisView: React.FC<Props> = ({ onNavigate: _onNavigate, initialAsset = 'XAUUSD' }) => {
  const [selectedAsset, setSelectedAsset] = useState<SupportedTrendAsset>(initialAsset);
  const [selectedTf, setSelectedTf] = useState<TimeframeKey>('4H');
  const [langMode, setLangMode] = useState<'hinglish' | 'english'>('hinglish');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Live Price synced from SharedQuoteStore
  const [livePrice, setLivePrice] = useState<number>(() => {
    const q = sharedQuoteStore.getQuote(selectedAsset);
    return q && q.price > 0 ? q.price : 2738.5;
  });

  useEffect(() => {
    const q = sharedQuoteStore.getQuote(selectedAsset);
    if (q && q.price > 0) setLivePrice(q.price);

    const unsub = sharedQuoteStore.subscribe((quote) => {
      const targetSym = selectedAsset === 'XAUUSD' ? 'PAXGUSDT' : selectedAsset;
      if (quote.symbol.toUpperCase() === targetSym.toUpperCase() || quote.symbol.toUpperCase() === selectedAsset) {
        if (quote.price > 0) setLivePrice(quote.price);
      }
    });
    return () => unsub();
  }, [selectedAsset]);

  // Compute Trend Analysis Engine Deterministically
  const trendReport: TrendEvidenceOutput = useMemo(() => {
    return runTrendAnalysisEngine({
      asset: selectedAsset,
      currentPrice: livePrice
    });
  }, [selectedAsset, livePrice]);

  const currentAssetMeta = ASSET_LIST.find((a) => a.key === selectedAsset) || ASSET_LIST[0];
  const activeTfReport = trendReport.perTimeframe[selectedTf];
  const htfReport = trendReport.perTimeframe['4H'];

  const handleCopySummary = () => {
    const text = `TREND ANALYSIS REPORT | ${selectedAsset}
HEADLINE: ${trendReport.headlineSummary}
DOMINANT HTF: ${trendReport.dominantHtfTrend} | HEALTH: ${trendReport.overallHealth} | MATURITY: ${trendReport.overallMaturity}
ALIGNMENT: ${trendReport.alignmentScore}% of Timeframes Synchronized
ACTIVE EARLY WARNINGS: ${trendReport.activeWarningsCount}
DESK EXPLANATION: ${langMode === 'hinglish' ? trendReport.deskExplanationHinglish : trendReport.deskExplanationEnglish}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div style={{ backgroundColor: '#090d16', color: '#e2e8f0', minHeight: '100vh', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── TOP HEADER / ASSET SELECTOR ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            fontSize: '18px',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
                MULTI-TIMEFRAME TREND ANALYSIS ENGINE
              </span>
              <span style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                BUILD v1 • RESEARCH AID
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px'
              }}>
                {trendReport.volumeType}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Publishes <strong>evidence.trend</strong> to Master Arbiter • 3 Independent Votes • Trend Strength, Maturity & Health
            </div>
          </div>
        </div>

        {/* Multi-Asset Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {ASSET_LIST.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedAsset(item.key)}
              style={{
                background: selectedAsset === item.key ? '#3b82f6' : 'rgba(255,255,255,0.04)',
                color: selectedAsset === item.key ? '#ffffff' : '#94a3b8',
                border: `1px solid ${selectedAsset === item.key ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: selectedAsset === item.key ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {item.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ── COMPUTED HEADLINE SUMMARY BANNER ── */}
      <div style={{
        background: '#0d131f',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
            HEADLINE SYNTHESIS:
          </span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', fontFamily: 'monospace' }}>
            {trendReport.headlineSummary}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setLangMode('hinglish')}
            style={{
              background: langMode === 'hinglish' ? '#3b82f6' : 'transparent',
              color: langMode === 'hinglish' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Hinglish
          </button>
          <button
            onClick={() => setLangMode('english')}
            style={{
              background: langMode === 'english' ? '#3b82f6' : 'transparent',
              color: langMode === 'english' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            English
          </button>
          <button
            onClick={handleCopySummary}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#cbd5e1',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copiedSummary ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
            {copiedSummary ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* ── 4 KEY TREND METER CHIPS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        
        {/* CHIP 1: DIRECTION */}
        <div style={{
          background: '#0d131f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>DOMINANT HTF DIRECTION</span>
            <span style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px'
            }}>
              {htfReport.confirmation}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {trendReport.dominantHtfTrend === 'UP' ? (
              <TrendingUp size={24} color="#22c55e" />
            ) : trendReport.dominantHtfTrend === 'DOWN' ? (
              <TrendingDown size={24} color="#ef4444" />
            ) : (
              <Activity size={24} color="#f59e0b" />
            )}
            <span style={{
              fontSize: '22px',
              fontWeight: '900',
              color: trendReport.dominantHtfTrend === 'UP' ? '#22c55e' : trendReport.dominantHtfTrend === 'DOWN' ? '#ef4444' : '#f59e0b',
              fontFamily: 'monospace'
            }}>
              {trendReport.dominantHtfTrend}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {trendReport.alignmentScore}% of Timeframes aligned with HTF bias
          </div>
        </div>

        {/* CHIP 2: STRENGTH */}
        <div style={{
          background: '#0d131f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>TREND STRENGTH (4H)</span>
            <span style={{
              background: 'rgba(59,130,246,0.15)',
              color: '#60a5fa',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              {htfReport.strength.band}
            </span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace' }}>
            {htfReport.strength.score}/100
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            ADX(14): <strong>{htfReport.strength.adx14}</strong> ({htfReport.strength.adxTrajectory}) • ER: <strong>{htfReport.strength.kaufmanEfficiencyRatio}</strong>
          </div>
        </div>

        {/* CHIP 3: MATURITY */}
        <div style={{
          background: '#0d131f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>TREND MATURITY</span>
            <span style={{
              background: htfReport.maturity.stage === 'EXHAUSTED' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              color: htfReport.maturity.stage === 'EXHAUSTED' ? '#ef4444' : '#f59e0b',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              {htfReport.maturity.stage}
            </span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#f59e0b', fontFamily: 'monospace' }}>
            {htfReport.maturity.score}/100
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Extension: <strong>{htfReport.maturity.extensionFromEma50Atr}x ATR</strong> from EMA50 • Flags: {htfReport.maturity.exhaustionFlags.length}
          </div>
        </div>

        {/* CHIP 4: HEALTH */}
        <div style={{
          background: '#0d131f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>TREND HEALTH QUALITY</span>
            <span style={{
              background: htfReport.health.label === 'HEALTHY' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              color: htfReport.health.label === 'HEALTHY' ? '#22c55e' : '#f59e0b',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              {htfReport.health.label}
            </span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#22c55e', fontFamily: 'monospace' }}>
            {htfReport.health.score}/100
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Fib Pullback: <strong>{htfReport.health.pullbackDepthFib}</strong> ({htfReport.health.pullbackQuality.replace('_', ' ')})
          </div>
        </div>
      </div>

      {/* ── WORKSPACE: CHART (LEFT) & DESK INTELLIGENCE / WARNINGS (RIGHT) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1.2fr)', gap: '16px', marginBottom: '20px' }}>
        
        {/* CHART SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            background: '#0d131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Active Timeframe:</span>
              {(['1W', '1D', '4H', '1H', '15M', '5M'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTf(tf)}
                  style={{
                    background: selectedTf === tf ? '#3b82f6' : 'rgba(255,255,255,0.04)',
                    color: selectedTf === tf ? '#ffffff' : '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: selectedTf === tf ? '800' : '600',
                    cursor: 'pointer'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Price: <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>${livePrice.toFixed(2)}</strong>
            </div>
          </div>

          <div style={{
            height: '480px',
            background: '#090d16',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <TradingViewWidget
              symbol={currentAssetMeta.tvSymbol}
              interval={selectedTf === '1W' ? 'W' : selectedTf === '1D' ? 'D' : selectedTf === '4H' ? '240' : selectedTf === '1H' ? '60' : selectedTf === '15M' ? '15' : '5'}
              theme="dark"
              height={480}
            />

            {/* Invalidation HUD */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#f8fafc',
              zIndex: 10
            }}>
              <span>Invalidation Level: <strong style={{ color: '#ef4444' }}>${activeTfReport.invalidationLevel}</strong></span>
              <span style={{ color: '#64748b', marginLeft: '6px' }}>({activeTfReport.invalidationCondition})</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DESK COMMENTARY & EARLY-WARNINGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Desk Assessment Card */}
          <div style={{
            background: '#0d131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
              DESK ASSESSMENT ({langMode.toUpperCase()})
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#e2e8f0', marginTop: '8px' }}>
              {langMode === 'hinglish' ? trendReport.deskExplanationHinglish : trendReport.deskExplanationEnglish}
            </div>

            <div style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94a3b8'
            }}>
              <span>Regime: <strong style={{ color: '#f59e0b' }}>{activeTfReport.regime}</strong></span>
              <span>Timing Context: <strong style={{ color: '#38bdf8' }}>{trendReport.timingLtfContext}</strong></span>
            </div>
          </div>

          {/* Early-Warning Signals (EW1 - EW8) */}
          <div style={{
            background: '#0d131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} color="#f59e0b" />
                EARLY-WARNING SIGNALS ({trendReport.activeWarningsCount})
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Rule: 15M signal alone does not flip 4H
              </span>
            </div>

            {trendReport.activeWarningsCount === 0 ? (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '10px', borderRadius: '8px', color: '#4ade80', fontSize: '12px' }}>
                No active exhaustion or momentum divergence warnings. Trend structure is clean.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTfReport.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>[{w.code}] {w.name}</span>
                      <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px' }}>
                        {w.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>{w.description}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      <em>Desk Rule: {w.implication}</em>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Invalidation Rule */}
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginTop: '12px',
              fontSize: '11px',
              color: '#f87171'
            }}>
              <strong>Kya Galat Sabit Karega?</strong>
              <div style={{ marginTop: '2px', color: '#cbd5e1' }}>
                {activeTfReport.invalidationCondition}. Wicks do not count; verified on closed candle only.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MULTI-TIMEFRAME TREND MATRIX TABLE (1W, 1D, 4H, 1H, 15M, 5M) ── */}
      <div style={{
        background: '#0d131f',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
              TIMEFRAME STACK — 3 INDEPENDENT VOTES MATRIX
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Vote 1: Market Structure (Swings/BOS) • Vote 2: EMA Stack (20/50/200) • Vote 3: Anchored VWAP
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#38bdf8' }}>
            Closed-Candle Rule Enforced
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>TF</th>
                <th style={{ padding: '8px 10px' }}>Direction</th>
                <th style={{ padding: '8px 10px' }}>Votes (3/3)</th>
                <th style={{ padding: '8px 10px' }}>Structure Vote</th>
                <th style={{ padding: '8px 10px' }}>EMA Stack Vote</th>
                <th style={{ padding: '8px 10px' }}>Anchored VWAP</th>
                <th style={{ padding: '8px 10px' }}>Strength</th>
                <th style={{ padding: '8px 10px' }}>Maturity</th>
                <th style={{ padding: '8px 10px' }}>Health</th>
                <th style={{ padding: '8px 10px' }}>Invalidation</th>
              </tr>
            </thead>
            <tbody>
              {(['1W', '1D', '4H', '1H', '15M', '5M'] as const).map((tf) => {
                const r = trendReport.perTimeframe[tf];
                return (
                  <tr
                    key={tf}
                    onClick={() => setSelectedTf(tf)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: selectedTf === tf ? 'rgba(59,130,246,0.08)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '10px', fontWeight: '800', color: selectedTf === tf ? '#38bdf8' : '#f8fafc' }}>{tf}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        color: r.direction === 'UP' ? '#22c55e' : r.direction === 'DOWN' ? '#ef4444' : '#f59e0b',
                        fontWeight: '800'
                      }}>
                        {r.direction}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{r.confirmation}</td>
                    <td style={{ padding: '10px', color: r.votes.structure.vote === 'UP' ? '#22c55e' : r.votes.structure.vote === 'DOWN' ? '#ef4444' : '#94a3b8' }}>
                      {r.votes.structure.vote}
                    </td>
                    <td style={{ padding: '10px', color: r.votes.emaStack.vote === 'UP' ? '#22c55e' : r.votes.emaStack.vote === 'DOWN' ? '#ef4444' : '#94a3b8' }}>
                      {r.votes.emaStack.vote}
                    </td>
                    <td style={{ padding: '10px', color: r.votes.anchoredVwap.vote === 'UP' ? '#22c55e' : r.votes.anchoredVwap.vote === 'DOWN' ? '#ef4444' : '#94a3b8' }}>
                      {r.votes.anchoredVwap.vote}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: '700' }}>{r.strength.score}</span>
                      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>({r.strength.band})</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: '#f59e0b' }}>{r.maturity.stage}</span>
                      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>({r.maturity.score})</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: '#22c55e' }}>{r.health.label}</span>
                      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>({r.health.score})</span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#ef4444' }}>${r.invalidationLevel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MULTI-ASSET TREND HEATMAP & RELATIVE STRENGTH ── */}
      <div style={{
        background: '#0d131f',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
              CROSS-ASSET TREND HEATMAP (MULTI-ASSET ALIGNMENT)
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Click any row to switch active asset • Cross-asset Relative Strength (RS) checks
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            8 Core Macro & Crypto Assets
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>Asset</th>
                <th style={{ padding: '8px 10px' }}>Price</th>
                <th style={{ padding: '8px 10px' }}>24H Change</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>1W</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>1D</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>4H</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>1H</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>15M</th>
                <th style={{ padding: '8px 10px' }}>Relative Strength (RS)</th>
              </tr>
            </thead>
            <tbody>
              {trendReport.crossAssetHeatmap.map((item) => (
                <tr
                  key={item.asset}
                  onClick={() => setSelectedAsset(item.asset)}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: selectedAsset === item.asset ? 'rgba(59,130,246,0.1)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '10px', fontWeight: '800', color: '#f8fafc' }}>{item.name}</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: '#cbd5e1' }}>${item.price.toLocaleString()}</td>
                  <td style={{ padding: '10px', color: item.change24h >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
                    {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                  </td>

                  {(['1W', '1D', '4H', '1H', '15M'] as const).map((tf) => {
                    const t = item.timeframeTrends[tf];
                    const isUp = t.direction === 'UP';
                    const isDown = t.direction === 'DOWN';
                    return (
                      <td key={tf} style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          background: isUp ? 'rgba(34,197,94,0.15)' : isDown ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: isUp ? '#22c55e' : isDown ? '#ef4444' : '#f59e0b',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: '800',
                          fontSize: '11px',
                          display: 'inline-block',
                          minWidth: '55px'
                        }}>
                          {t.direction}
                        </span>
                      </td>
                    );
                  })}

                  <td style={{ padding: '10px' }}>
                    <span style={{
                      color: item.relativeStrengthVsBenchmark.trend === 'OUTPERFORMING' ? '#22c55e' : item.relativeStrengthVsBenchmark.trend === 'UNDERPERFORMING' ? '#ef4444' : '#94a3b8',
                      fontWeight: '700'
                    }}>
                      {item.relativeStrengthVsBenchmark.trend}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                      ({item.relativeStrengthVsBenchmark.note})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TrendAnalysisView;
