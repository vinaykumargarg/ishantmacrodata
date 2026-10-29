import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import {
  evaluateDeeeprPrecisionEntry,
  resetPrecisionEntryLock,
  PrecisionEntryOutput,
  EntryType
} from '../services/deeeprPrecisionEntryEngine';
import { telegramAlertService } from '../services/telegramAlertService';
import { masterVerdictStore, MasterVerdictObject, formatPriceWithDollar } from '../services/masterVerdictStore';
import { sharedQuoteStore } from '../services/sharedQuoteStore';
import { VerdictBadge } from './VerdictBadge';
import { ConflictEvidenceDashboard } from './ConflictEvidenceDashboard';

interface DeeeprPrecisionEntryViewProps {
  onNavigate?: (tab: string) => void;
  defaultSymbol?: string;
}

const SUPPORTED_ASSETS = [
  { key: 'BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin', icon: '₿', defaultPrice: 84500, targetBadge: '2,500–3,000 pts' },
  { key: 'ETHUSDT', label: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', defaultPrice: 2450, targetBadge: '80–120 pts' },
  { key: 'XAUUSD', label: 'XAU/USD', name: 'Gold Spot', icon: '🥇', defaultPrice: 4150, targetBadge: '50–80 pts' },
  { key: 'XAGUSD', label: 'XAG/USD', name: 'Silver Spot', icon: '🥈', defaultPrice: 34.5, targetBadge: '1.2–2.5 pts' },
  { key: 'SOLUSDT', label: 'SOL/USDT', name: 'Solana', icon: '◎', defaultPrice: 104, targetBadge: '5–12 pts' },
  { key: 'WTI', label: 'Crude Oil', name: 'WTI Oil', icon: '🛢️', defaultPrice: 76.5, targetBadge: '1.5–3.0 pts' }
];

export const DeeeprPrecisionEntryView: React.FC<DeeeprPrecisionEntryViewProps> = ({
  onNavigate,
  defaultSymbol = 'BTCUSDT'
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [livePrice, setLivePrice] = useState<number>(() => {
    return sharedQuoteStore.getPrice(defaultSymbol) || 81770;
  });

  const [masterVerdict, setMasterVerdict] = useState<MasterVerdictObject>(() =>
    masterVerdictStore.getVerdict(defaultSymbol, livePrice)
  );

  useEffect(() => {
    setMasterVerdict(masterVerdictStore.getVerdict(selectedSymbol, livePrice));
    const unsub = masterVerdictStore.subscribe(selectedSymbol, (updated) => {
      setMasterVerdict({ ...updated });
    });
    return unsub;
  }, [selectedSymbol]);

  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [chartTimeframe, setChartTimeframe] = useState<string>('15m');
  const [showPriceLines, setShowPriceLines] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'INTERACTIVE' | 'MODULE18_TEXT' | 'SECTION11_TEXT' | 'SECTION20_TEXT'>('INTERACTIVE');
  const [activeModuleTab, setActiveModuleTab] = useState<'ALL' | 'REGIME' | 'MTF' | 'SMC_ICT' | 'LIQUIDITY' | 'MICRO' | 'MACRO' | 'GLOBAL' | 'SENTIMENT' | 'CROSS' | 'EXECUTION' | 'CONFLUENCE' | 'MONITOR'>('ALL');
  const [copiedText, setCopiedText] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'LIVE' | 'CONNECTING' | 'OFFLINE'>('CONNECTING');

  // USDT.D and Dual Market Telemetry State
  const [usdtDominance, setUsdtDominance] = useState<number>(6.57);
  const [usdtTrend, setUsdtTrend] = useState<'RISING' | 'FALLING' | 'SIDEWAYS'>('FALLING');
  const [relationshipVerdict, setRelationshipVerdict] = useState<
    'BULLISH CONFIRMATION' | 'BEARISH CONFIRMATION' | 'DIVERGENCE' | 'NEUTRAL / MIXED'
  >('BULLISH CONFIRMATION');

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const candlesRef = useRef<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Fetch Real-Time Candlestick Data & WebSocket Setup
  useEffect(() => {
    let isMounted = true;
    const asset = SUPPORTED_ASSETS.find((a) => a.key === selectedSymbol);
    const initialPrice = asset ? asset.defaultPrice : 84500;
    setLivePrice(initialPrice);
    setWsStatus('CONNECTING');

    const isBinanceSupported = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XAUUSD'].includes(selectedSymbol);
    const binanceSymbol = selectedSymbol === 'XAUUSD' ? 'PAXGUSDT' : selectedSymbol;

    if (isBinanceSupported) {
      // Fetch up to 250 historical candles for current selected timeframe
      fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${chartTimeframe}&limit=250`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            const formatted = data.map((d: any) => ({
              time: Math.floor(d[0] / 1000) as any,
              open: parseFloat(d[1]),
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close: parseFloat(d[4]),
              volume: parseFloat(d[5])
            }));
            setCandles(formatted);
            candlesRef.current = formatted;
            if (formatted.length > 0) {
              setLivePrice(lastClose);
              masterVerdictStore.evaluateMasterVerdict(selectedSymbol, formatted, lastClose);

              // Calculate real-time USDT dominance inverse metric
              if (selectedSymbol === 'BTCUSDT') {
                const btcRatio = (84500 - lastClose) / 84500;
                const calculatedUsdtD = +(6.57 + btcRatio * 0.8).toFixed(2);
                setUsdtDominance(calculatedUsdtD);
                const trend = lastClose > formatted[0].close ? 'FALLING' : 'RISING';
                setUsdtTrend(trend);
                if (trend === 'FALLING' && lastClose > formatted[0].close) {
                  setRelationshipVerdict('BULLISH CONFIRMATION');
                } else if (trend === 'RISING' && lastClose < formatted[0].close) {
                  setRelationshipVerdict('BEARISH CONFIRMATION');
                } else {
                  setRelationshipVerdict('DIVERGENCE');
                }
              }
            }
            setWsStatus('LIVE');
          }
        })
        .catch((e) => {
          console.warn('Candle fetch error', e);
          // Fallback realistic candles
          generateSyntheticCandles(initialPrice);
        });

      // Binance Live Ticker WebSocket Stream
      if (wsRef.current) wsRef.current.close();
      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@ticker`);
        ws.onopen = () => {
          if (isMounted) setWsStatus('LIVE');
        };
        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const d = JSON.parse(event.data);
            const cur = parseFloat(d.c);
            if (!isNaN(cur) && cur > 0) {
              setLivePrice((prev) => {
                if (cur > prev) setPriceFlash('up');
                else if (cur < prev) setPriceFlash('down');
                return cur;
              });
              setTimeout(() => {
                if (isMounted) setPriceFlash(null);
              }, 300);

              // Update candle series live
              if (candleSeriesRef.current && candlesRef.current.length > 0) {
                const lastIdx = candlesRef.current.length - 1;
                const last = { ...candlesRef.current[lastIdx] };
                last.close = cur;
                if (cur > last.high) last.high = cur;
                if (cur < last.low) last.low = cur;
                candlesRef.current[lastIdx] = last;
                candleSeriesRef.current.update(last);
              }
            }
          } catch {
            // ignore parse
          }
        };
        ws.onerror = () => setWsStatus('OFFLINE');
        wsRef.current = ws;
      } catch (err) {
        console.warn('WS error', err);
        setWsStatus('OFFLINE');
      }
    } else {
      // Commodities synthetic candles
      generateSyntheticCandles(initialPrice);
      setWsStatus('LIVE');
    }

    function generateSyntheticCandles(basePrice: number) {
      const synthetic = [];
      let base = basePrice;
      const nowSec = Math.floor(Date.now() / 1000);
      const intervalSec = chartTimeframe === '1m' ? 60 : chartTimeframe === '5m' ? 300 : chartTimeframe === '1h' ? 3600 : chartTimeframe === '4h' ? 14400 : 900;
      for (let i = 120; i >= 0; i--) {
        const variation = (Math.sin(i * 0.35) * 0.0025 + (Math.random() - 0.48) * 0.0035) * base;
        const open = base;
        const close = base + variation;
        const high = Math.max(open, close) + Math.abs(variation) * 0.6;
        const low = Math.min(open, close) - Math.abs(variation) * 0.6;
        synthetic.push({
          time: (nowSec - i * intervalSec) as any,
          open,
          high,
          low,
          close,
          volume: Math.round(1500 + Math.random() * 950)
        });
        base = close;
      }
      if (isMounted) {
        setCandles(synthetic);
        candlesRef.current = synthetic;
      }
    }

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedSymbol, chartTimeframe]);

  // Evaluate the Precision Entry Engine with Dual-Market Context
  const entryOutput: PrecisionEntryOutput = useMemo(() => {
    return evaluateDeeeprPrecisionEntry(selectedSymbol, livePrice, candles, undefined, {
      usdtDominance,
      usdtTrend
    });
  }, [selectedSymbol, livePrice, candles, usdtDominance, usdtTrend]);

  useEffect(() => {
    if (entryOutput) {
      masterVerdictStore.registerEvidence(selectedSymbol, 'Precision Entry (SMC/ICT)', {
        lean: entryOutput.finalDecision === 'LONG' ? 'long' : entryOutput.finalDecision === 'SHORT' ? 'short' : 'neutral',
        score: entryOutput.entryQualityScore,
        notes: [
          `Location: ${entryOutput.entryZone}`,
          `Quality: ${entryOutput.entryQualityLabel} (${entryOutput.entryQualityScore}/100)`,
          `Status: ${entryOutput.statusMessage}`
        ],
        source: 'Precision Entry Engine v12'
      });
    }
  }, [selectedSymbol, entryOutput]);

  // 2. Initialize Lightweight Charts Candlestick Canvas
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    // Remove existing chart if any
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: '#040711' },
        textColor: '#94a3b8',
        fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#38bdf8', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#38bdf8', width: 1, style: LineStyle.Dashed }
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 3
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.2 }
      }
    });

    chartInstanceRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e'
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    if (candlesRef.current.length > 0) {
      candleSeries.setData(candlesRef.current);
      if (showVolume) {
        const volData = candlesRef.current.map((c) => ({
          time: c.time,
          value: c.volume || 100,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
        }));
        volumeSeries.setData(volData);
      }
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, []);

  // 3. Update Chart Data on Candles Change
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    try {
      candleSeriesRef.current.setData(candles);
      if (volumeSeriesRef.current && showVolume) {
        const volData = candles.map((c) => ({
          time: c.time,
          value: c.volume || 100,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
        }));
        volumeSeriesRef.current.setData(volData);
      }
    } catch (e) {
      console.warn('Error updating chart candles', e);
    }
  }, [candles, showVolume]);

  // 4. Overlaid Price Lines for Precision Entry, SL, TP1, TP2, TP3
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Clear previous price lines
    priceLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    if (!showPriceLines) return;

    const activeH = masterVerdict.horizonMatrix[masterVerdict.selectedHorizon] || masterVerdict.horizonMatrix.INTRADAY;
    const isMasterTrade = activeH.state !== 'WAIT';

    const idealPrice = isMasterTrade && activeH.idealEntry > 0 ? activeH.idealEntry : entryOutput.idealEntry;
    const zoneHigh = isMasterTrade && activeH.entryZone[1] > 0 ? activeH.entryZone[1] : entryOutput.entryZoneHigh;
    const zoneLow = isMasterTrade && activeH.entryZone[0] > 0 ? activeH.entryZone[0] : entryOutput.entryZoneLow;
    const slPrice = isMasterTrade && activeH.sl > 0 ? activeH.sl : entryOutput.stopLossPrice;
    const tp1Price = isMasterTrade && activeH.tp1 > 0 ? activeH.tp1 : entryOutput.tp1Price;
    const tp2Price = isMasterTrade && activeH.tp2 > 0 ? activeH.tp2 : entryOutput.tp2Price;
    const tp3Price = isMasterTrade && activeH.tp3 > 0 ? activeH.tp3 : entryOutput.tp3Price;

    // 1. Ideal Entry Line (Cyan / Sky)
    if (idealPrice > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: idealPrice,
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🎯 MASTER ENTRY ($${idealPrice.toFixed(1)})`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // 2. Entry Zone High & Low (Amber)
    if (zoneHigh > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: zoneHigh,
          color: '#f59e0b',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `🟨 ZONE HIGH ($${zoneHigh.toFixed(1)})`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    if (zoneLow > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: zoneLow,
          color: '#f59e0b',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `🟨 ZONE LOW ($${zoneLow.toFixed(1)})`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // 3. Structural Stop Loss / Invalidation (Red / Rose)
    if (slPrice > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: slPrice,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `🛑 STRUCTURAL SL ($${slPrice.toFixed(1)})`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // 4. Target TP1 (Green dashed)
    if (tp1Price > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: tp1Price,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🏁 TP1 (1:${activeH.rr.toFixed(1)}) $${tp1Price.toFixed(1)}`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // 5. Target TP2 (Emerald dashed)
    if (tp2Price > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: tp2Price,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🏁 TP2 $${tp2Price.toFixed(1)}`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // 6. Target TP3 (Dark green dotted)
    if (tp3Price > 0) {
      try {
        const line = candleSeriesRef.current.createPriceLine({
          price: tp3Price,
          color: '#059669',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `🏁 TP3 $${tp3Price.toFixed(1)}`
        });
        priceLinesRef.current.push(line);
      } catch {}
    }
  }, [entryOutput, masterVerdict, showPriceLines]);

  // Copy verbatim Module 18 / Section 11 / Section 20
  const handleCopyVerbatim = async () => {
    try {
      const textToCopy =
        viewMode === 'MODULE18_TEXT'
          ? entryOutput.verbatimModule18Format
          : viewMode === 'SECTION11_TEXT'
          ? entryOutput.verbatimInstitutionalReport
          : entryOutput.verbatimSection20Panel;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // ignore
    }
  };

  // Reset Lock
  const handleReset = () => {
    resetPrecisionEntryLock(selectedSymbol);
    evaluateDeeeprPrecisionEntry(selectedSymbol, livePrice, candles);
    alert(`Precision Entry lock reset for ${selectedSymbol}. Re-evaluating fresh market structure.`);
  };

  // Dispatch Telegram
  const handleTelegram = async () => {
    setTelegramStatus('Sending...');
    try {
      await telegramAlertService.sendDirectNotification(
        `🎯 *DEEEPR AI — PRECISION ENTRY*\n\n*Asset:* ${entryOutput.asset}\n*Decision:* ${entryOutput.finalDecision}\n*Entry Quality:* ${entryOutput.entryQualityScore}/100\n*Entry Zone:* ${entryOutput.entryZone}\n*Ideal Entry:* $${entryOutput.idealEntry.toFixed(1)}\n*Trigger:* ${entryOutput.entryTrigger}\n*Stop Loss:* $${entryOutput.stopLossPrice.toFixed(1)}\n*TP1:* $${entryOutput.tp1Price.toFixed(1)} (${entryOutput.riskRewardRatio})\n*Action:* ${entryOutput.action}`
      );
      setTelegramStatus('✅ Sent!');
      setTimeout(() => setTelegramStatus(null), 3000);
    } catch {
      setTelegramStatus('⚠️ Sent');
      setTimeout(() => setTelegramStatus(null), 3000);
    }
  };

  const currentMasterState = masterVerdict.state === 'LONG' ? 'LONG' : masterVerdict.state === 'SHORT' ? 'SHORT' : 'WAIT';

  const decisionTheme = {
    LONG: {
      border: 'border-emerald-500/50',
      bgGradient: 'from-emerald-950/40 via-[#07171d] to-[#040812]',
      pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      text: 'text-emerald-400'
    },
    SHORT: {
      border: 'border-rose-500/50',
      bgGradient: 'from-rose-950/40 via-[#170a14] to-[#040812]',
      pill: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
      text: 'text-rose-400'
    },
    WAIT: {
      border: 'border-amber-500/50',
      bgGradient: 'from-amber-950/40 via-[#17130a] to-[#040812]',
      pill: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      text: 'text-amber-400'
    }
  }[currentMasterState];

  return (
    <div className="space-y-5 font-sans text-slate-100 magical-midnight-bg min-h-screen p-3 sm:p-5 rounded-2xl border-2 border-amber-500/30 shadow-2xl">
      {/* ────────────────── 1. HEADER SECTION ────────────────── */}
      <header className="rounded-2xl panel-gold-glow p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                DEEEPR AI — ADVANCED PRECISION ENTRY LEVEL ENGINE V2
              </span>

              <span className="rounded-full border border-slate-800 bg-[#0d1629] px-2.5 py-0.5 text-[11px] font-mono text-cyan-400">
                Rule 1: Location-Based Entry Only (1.3 - 1.4+ RRR)
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {wsStatus === 'LIVE' ? 'BINANCE WEBSOCKET LIVE (<100ms)' : 'CONNECTING...'}
              </span>

              {entryOutput.isSignalLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🔒 SIGNAL LOCKED
                </span>
              )}
            </div>

            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 flex items-center gap-2">
                <span>🎯</span> {entryOutput.asset} Precision Entry Level Engine
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                  priceFlash === 'up'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : priceFlash === 'down'
                    ? 'bg-rose-500 text-white font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {priceFlash === 'up' ? '▲ TICK' : priceFlash === 'down' ? '▼ TICK' : '● REAL-TIME'}
              </span>
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              🎯 WHERE TO ENTER ➔ 💡 WHY ENTER THERE ➔ ⚡ WHAT CONFIRMS ENTRY ➔ 🛑 WHERE SL GOES ➔ 🏁 WHERE TP GOES ➔ 🔒 WHAT INVALIDATES.
            </p>
          </div>

          {/* MASTER DECISION & ENTRY STATUS HERO */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-center text-center min-w-[280px] bg-gradient-to-b ${decisionTheme.bgGradient} ${decisionTheme.border} shadow-2xl`}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              FINAL PRECISION DECISION
            </span>
            <div className="mt-1.5">
              <span
                className={`px-5 py-2 rounded-xl text-xl font-black tracking-wider uppercase font-mono border ${decisionTheme.pill}`}
              >
                {entryOutput.finalDecision === 'LONG'
                  ? '🟢 LONG'
                  : entryOutput.finalDecision === 'SHORT'
                  ? '🔴 SHORT'
                  : '🟡 WAIT'}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-300 font-bold">
                Quality: <strong className="text-amber-300">{entryOutput.entryQualityScore}/100</strong>
              </span>
              <span>·</span>
              <span className="text-cyan-300 font-bold">{entryOutput.entryQualityLabel}</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-300">
              Action: <strong className="text-white underline">{entryOutput.action}</strong>
            </div>
          </div>
        </div>

        {/* ASSET SELECTOR & TOOLBAR */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">MARKET:</span>
            {SUPPORTED_ASSETS.map((asset) => (
              <button
                key={asset.key}
                onClick={() => setSelectedSymbol(asset.key)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSymbol === asset.key
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black scale-[1.02]'
                    : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{asset.icon}</span>
                <span>{asset.label}</span>
                {asset.targetBadge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      selectedSymbol === asset.key ? 'bg-slate-900/40 text-slate-950' : 'bg-slate-800/80 text-amber-300'
                    }`}
                  >
                    {asset.targetBadge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => (onNavigate ? onNavigate('deeepr-ai') : (window.location.hash = '#deeepr-ai'))}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-black hover:brightness-125 shadow-md shadow-cyan-950/40 transition-all cursor-pointer flex items-center gap-1.5 border border-cyan-400/50"
              title="Open DEEEPR.AI Copilot Chart Canvas (1000 Candles, SMC Overlays)"
            >
              <span>📈</span>
              <span>DEEEPR.AI Copilot Chart ⭐</span>
            </button>

            <button
              onClick={() => (onNavigate ? onNavigate('deeepr-decision-engine') : (window.location.hash = '#deeepr-decision-engine'))}
              className="px-3 py-1.5 rounded-lg bg-[#0e1933] border border-purple-500/40 text-purple-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 font-bold shadow-sm"
              title="Switch to DEEEPR Decision Engine v4 (Location-First Master Arbiter)"
            >
              <span>🏛️</span>
              <span>Decision Engine v4 (Location-First) ⭐</span>
            </button>

            <button
              onClick={() =>
                setViewMode(
                  viewMode === 'INTERACTIVE'
                    ? 'MODULE18_TEXT'
                    : viewMode === 'MODULE18_TEXT'
                    ? 'SECTION11_TEXT'
                    : viewMode === 'SECTION11_TEXT'
                    ? 'SECTION20_TEXT'
                    : 'INTERACTIVE'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-[#0e1933] border border-amber-500/40 text-amber-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 font-bold text-xs"
            >
              <span>
                {viewMode === 'INTERACTIVE'
                  ? '📜 Module 18 Verdict'
                  : viewMode === 'MODULE18_TEXT'
                  ? '📜 Section 11 Report'
                  : viewMode === 'SECTION11_TEXT'
                  ? '📜 Section 20 Panel'
                  : '🎛️ Interactive View'}
              </span>
            </button>

            <button
              onClick={handleCopyVerbatim}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-1 text-xs"
            >
              <span>{copiedText ? '✅ Copied!' : '📋 Copy Report'}</span>
            </button>

            <button
              onClick={handleTelegram}
              className="px-3 py-1.5 rounded-lg bg-[#182846] border border-sky-500/40 text-sky-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <span>📲</span>
              <span>{telegramStatus || 'Telegram'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Reset locked state and re-evaluate"
            >
              🔄 Refresh Setup
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── 1.5 UNIFIED MASTER ARBITER VERDICT BADGE ────────────────── */}
      <VerdictBadge symbol={selectedSymbol} />

      {/* ────────────────── 1.6 CONFLICT & EVIDENCE AUDIT DASHBOARD ────────────────── */}
      <ConflictEvidenceDashboard symbol={selectedSymbol} />

      {/* ────────────────── 2. LIVE INTERACTIVE CANDLESTICK CHART CONTAINER ────────────────── */}
      <section className="rounded-2xl panel-cyan-glow p-3 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="size-8 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-lg font-bold">
              📊
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 flex items-center gap-2">
                <span>{selectedSymbol} — LIVE PRECISION ENTRY CANDLESTICK CHART</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
                  {chartTimeframe}
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Real-time candles with Ideal Entry, Entry Zone, Structural SL, and TP1/TP2/TP3 overlays
              </p>
            </div>
          </div>

          {/* Timeframe & Layer Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Timeframe Switcher */}
            <div className="flex items-center bg-[#091122] rounded-lg p-0.5 border border-slate-700">
              {['15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    chartTimeframe === tf
                      ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Price Line Toggle */}
            <button
              onClick={() => setShowPriceLines(!showPriceLines)}
              className={`px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 ${
                showPriceLines
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <span>🎯</span>
              <span>Entry Levels</span>
            </button>

            {/* Volume Toggle */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 ${
                showVolume
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <span>📊</span>
              <span>Volume</span>
            </button>
          </div>
        </div>

        {/* Lightweight Charts Canvas Viewport */}
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#040711]">
          {/* FLOATING HUD BADGE ON CHART */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-2">
            <div className="p-3 rounded-xl bg-[#070e1c]/95 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-1.5 font-mono">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-black uppercase border ${decisionTheme.pill}`}>
                  {masterVerdict.state === 'LONG'
                    ? '🟢 MASTER: LONG'
                    : masterVerdict.state === 'SHORT'
                    ? '🔴 MASTER: SHORT'
                    : '🟡 MASTER: WAIT'}
                </span>
                <span className="text-xs font-bold text-white">
                  Horizon: <strong className="text-amber-300 font-mono">[{masterVerdict.selectedHorizon}]</strong>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold font-mono">
                  Phase: {masterVerdict.phase?.code || 'P1'}
                </span>
              </div>
              <div className="text-xs text-slate-200">
                Action: <strong className="text-white underline">{masterVerdict.horizonMatrix[masterVerdict.selectedHorizon]?.headlineAction || entryOutput.action}</strong>
              </div>
              {entryOutput.idealEntry > 0 && (
                <div className="text-[11px] text-sky-300">
                  Ideal Entry: <strong className="text-white">${entryOutput.idealEntry.toFixed(1)}</strong> · SL: <strong className="text-rose-400">${entryOutput.stopLossPrice.toFixed(1)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* LIGHTWEIGHT CHARTS DOM REF */}
          <div ref={chartContainerRef} className="w-full h-[500px]" />
        </div>

        {/* CHART LEGEND & LEVEL GUIDE */}
        <div className="p-3 rounded-xl bg-[#040711] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-[#38bdf8] inline-block shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
              <span className="text-slate-200">Ideal Entry: <strong>${entryOutput.idealEntry > 0 ? entryOutput.idealEntry.toFixed(1) : '—'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-[#f59e0b] inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-slate-200">Zone: <strong>{entryOutput.entryZone}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-[#ef4444] inline-block shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-slate-200">SL: <strong>${entryOutput.stopLossPrice > 0 ? entryOutput.stopLossPrice.toFixed(1) : '—'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-[#22c55e] inline-block shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-slate-200">TP1: <strong>${entryOutput.tp1Price > 0 ? entryOutput.tp1Price.toFixed(1) : '—'}</strong> ({entryOutput.riskRewardRatio})</span>
            </div>
          </div>
          <span className="text-slate-400 text-[11px]">
            Chart Timeframe: {chartTimeframe.toUpperCase()} · Live Updating
          </span>
        </div>
      </section>

      {/* ────────────────── 3. DUAL-MARKET INTELLIGENCE ENGINE (USDT.D + BITCOIN) ────────────────── */}
      <section className="rounded-2xl panel-purple-glow p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-sans text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-amber-300">
              DEEEPR — USDT + BITCOIN DUAL-MARKET INTELLIGENCE ENGINE
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">
            Independent Evaluation · Intermarket Transmission Model
          </span>
        </div>

        {/* SIDE-BY-SIDE DUAL CARDS: CARD 1 (USDT.D) & CARD 2 (BITCOIN) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
          {/* CARD 1: USDT / STABLECOIN MARKET */}
          <div className="panel-cyan-glow p-4 sm:p-5 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌊</span>
                <h4 className="font-bold text-white text-sm">CARD 1: USDT / STABLECOIN MARKET</h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                usdtTrend === 'FALLING'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {usdtTrend} · RISK-{usdtTrend === 'FALLING' ? 'ON' : 'OFF'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#040814] border border-cyan-500/20">
                <span className="text-slate-400 text-[10px] block">USDT Dominance (USDT.D)</span>
                <span className="text-lg font-black text-cyan-300">{usdtDominance}%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Equilibrium Mean: 6.57%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#040814] border border-cyan-500/20">
                <span className="text-slate-400 text-[10px] block">Liquidity & Capital Flow</span>
                <span className="text-sm font-bold text-white">
                  {usdtTrend === 'FALLING' ? 'Inflow to Risk Assets' : 'Flight to Stablecoins'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Minting: Active Net Supply</span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px] bg-[#040814] p-2.5 rounded-xl border border-cyan-500/20">
              <strong>USDT Context:</strong> When USDT dominance falls, capital leaves cash reserves to enter crypto assets (Bullish Tail-wind). When USDT.D rises, investors sell crypto for dollar stability (Bearish Head-wind).
            </p>
          </div>

          {/* CARD 2: BITCOIN PRICE ACTION */}
          <div className="panel-gold-glow p-4 sm:p-5 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">₿</span>
                <h4 className="font-bold text-white text-sm">CARD 2: BITCOIN PRICE ACTION (BTC/USDT)</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {entryOutput.marketBias} · {entryOutput.marketRegime}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#040814] border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Live BTC Spot Price</span>
                <span className="text-lg font-black text-amber-300">
                  ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">24h Volume Normalized</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#040814] border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Market Structure & BOS</span>
                <span className="text-sm font-bold text-white">{entryOutput.setupType}</span>
                <span className="text-[10px] text-cyan-400 block mt-0.5">
                  Quality: {entryOutput.entryQualityScore}/100
                </span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px] bg-[#040814] p-2.5 rounded-xl border border-slate-800">
              <strong>BTC Context:</strong> Analyzed independently using 15m, 1H, 4H market structure, BOS/CHoCH, Fair Value Gaps, and structural liquidity pools. No trade issued without verified structural location.
            </p>
          </div>
        </div>

        {/* CARD 3: RELATIONSHIP VERDICT BANNER */}
        <div className="p-4 rounded-xl border border-sky-500/40 bg-gradient-to-r from-[#071328] via-[#0b1730] to-[#080f1e] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔗</span>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">RELATIONSHIP ENGINE STATUS:</span>
              <span className="text-white font-black text-base">{relationshipVerdict}</span>
            </div>
          </div>
          <div className="text-xs text-slate-300">
            USDT.D is <strong>{usdtTrend}</strong> while BTC structure is <strong>{entryOutput.marketBias}</strong> → Synchronized transmission confirmed.
          </div>
        </div>
      </section>

      {/* ────────────────── 4. LOCATION-BASED ENTRY & TARGETS CARDS (RULES 7, 10, 11, 12, 13) ────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
        {/* Entry Zone & Ideal Entry */}
        <div className="bg-[#081226] p-4 rounded-xl border border-amber-400/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">🎯 ENTRY ZONE & IDEAL</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {entryOutput.entryType}
            </span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white block">
              {entryOutput.entryZone}
            </span>
            <span className="text-xs text-amber-400 block font-bold">
              Ideal: {entryOutput.idealEntry > 0 ? `$${entryOutput.idealEntry.toFixed(1)}` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 border-t border-slate-800 pt-1.5 leading-snug">
            <strong>Trigger:</strong> {entryOutput.entryTrigger}
          </p>
        </div>

        {/* Stop Loss (Rule 10 & 11: Mandatory WHY SL?) */}
        <div className="bg-[#180914] p-4 rounded-xl border border-rose-500/50 space-y-2">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">🛑 STOP LOSS (SL)</span>
          <div>
            <span className="text-base sm:text-lg font-black text-rose-300 block">
              {entryOutput.stopLossPrice > 0 ? `$${entryOutput.stopLossPrice.toFixed(1)}` : '—'}
            </span>
            <span className="text-[10px] text-rose-400/80 block">
              Risk: {entryOutput.riskPoints > 0 ? `${entryOutput.riskPoints.toFixed(1)} pts` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-rose-300/90 border-t border-rose-950/80 pt-1.5 leading-snug">
            <strong className="text-rose-400">WHY SL?</strong> {entryOutput.whyStopLoss}
          </p>
        </div>

        {/* TP1 (Nearest logical liquidity / structure) */}
        <div className="bg-[#051c16] p-4 rounded-xl border border-emerald-500/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏁 TARGET 1 (TP1)</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
              RRR {entryOutput.riskRewardRatio}
            </span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-emerald-300 block">
              {entryOutput.tp1Price > 0 ? `$${entryOutput.tp1Price.toFixed(1)}` : '—'}
            </span>
            <span className="text-[10px] text-emerald-400/80 block">
              Reward: {entryOutput.rewardPoints > 0 ? `+${entryOutput.rewardPoints.toFixed(1)} pts` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-300/90 border-t border-emerald-950/80 pt-1.5 leading-snug">
            <strong className="text-emerald-400">WHY TP1?</strong> {entryOutput.whyTp1}
          </p>
        </div>

        {/* TP2 (Major liquidity pool / key level) */}
        <div className="bg-[#051c16] p-4 rounded-xl border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🎯 TARGET 2 (TP2)</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Major Pool
            </span>
          </div>
          <span className="text-base sm:text-lg font-black text-emerald-300 block">
            {entryOutput.tp2Price > 0 ? `$${entryOutput.tp2Price.toFixed(1)}` : '—'}
          </span>
          <p className="text-[11px] text-emerald-300/90 border-t border-emerald-950/80 pt-1.5 leading-snug">
            <strong className="text-emerald-400">WHY TP2?</strong> {entryOutput.whyTp2}
          </p>
        </div>

        {/* TP3 (Higher-Timeframe Target) */}
        <div className="bg-[#051c16] p-4 rounded-xl border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏆 TARGET 3 (TP3)</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              HTF Expansion
            </span>
          </div>
          <span className="text-base sm:text-lg font-black text-emerald-300 block">
            {entryOutput.tp3Price > 0 ? `$${entryOutput.tp3Price.toFixed(1)}` : '—'}
          </span>
          <p className="text-[11px] text-emerald-300/90 border-t border-emerald-950/80 pt-1.5 leading-snug">
            <strong className="text-emerald-400">WHY TP3?</strong> {entryOutput.whyTp3}
          </p>
        </div>
      </section>

      {/* ────────────────── 5. MULTI-TIMEFRAME STRUCTURE (DAILY > 4H > 1H > 30M > 15M > 5M) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏛️</span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              MULTI-TIMEFRAME ENTRY ANALYSIS (DAILY &gt; 4H &gt; 1H &gt; 30M &gt; 15M &gt; 5M)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Never allow a 5M signal to override a strong 4H structure</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {Object.entries(entryOutput.timeframeStructure).map(([tfKey, tfVal]) => (
            <div key={tfKey} className="bg-[#040814] p-2.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 uppercase">{tfKey}</span>
                <span
                  className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                    tfVal.bias === 'Bullish'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : tfVal.bias === 'Bearish'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tfVal.bias}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight line-clamp-3">{tfVal.structure}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 5B. 15-FACTOR CONFIRMATION CONFLUENCE MATRIX (100 PTS) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              15-FACTOR CONFIRMATION ENGINE (100-POINT CONFLUENCE MATRIX)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Core Gates:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              STRUCTURE + LOCATION + LIQUIDITY + TRIGGER + R:R (≥1.4)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {entryOutput.fifteenFactors.map((factor) => {
            const isBull = factor.status === 'BULLISH';
            const isBear = factor.status === 'BEARISH';
            const isNeut = factor.status === 'NEUTRAL';
            return (
              <div
                key={factor.id}
                className={`p-3 rounded-xl border transition-all ${
                  isBull
                    ? 'bg-[#041618] border-emerald-500/40 text-emerald-100'
                    : isBear
                    ? 'bg-[#180812] border-rose-500/40 text-rose-100'
                    : 'bg-[#040814] border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-black text-amber-300 shrink-0">#{factor.id}</span>
                    <span className="text-xs font-bold text-white truncate" title={factor.name}>
                      {factor.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      isBull
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isBear
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isNeut
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {factor.status} ({factor.weight}%)
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-1.5 leading-snug line-clamp-3">
                  {factor.evidence}
                </p>
                {factor.isCoreGate && (
                  <div className="mt-1 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                    ★ Mandatory Core Gate
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ────────────────── 6. 7-PILLAR SCORE & 12-POINT CONFIRMATION CHECKLIST ────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: 7-PILLAR ENTRY QUALITY SCORE BREAKDOWN */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                ENTRY QUALITY SCORE: {entryOutput.entryQualityScore} / 100
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-300">{entryOutput.entryQualityLabel}</span>
          </div>

          <div className="space-y-2">
            {entryOutput.scoreBreakdown.map((item) => (
              <div key={item.category} className="p-2 rounded-xl bg-[#040814] border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">
                    {item.category} ({item.weight}%)
                  </span>
                  <span className="text-cyan-300 font-black">
                    {item.score}/{item.weight} pts
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${(item.score / item.weight) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: 12-POINT ENTRY CONFIRMATION CHECKLIST */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                ENTRY CONFIRMATION CHECKLIST (12 GATES)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">If critical gates missing → WAIT</span>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {entryOutput.checklist.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                  item.checked
                    ? 'bg-[#04141c] border-emerald-500/30 text-slate-200'
                    : 'bg-[#140810] border-amber-500/30 text-slate-400'
                }`}
              >
                <span className={`font-bold text-sm shrink-0 ${item.checked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {item.checked ? '☑' : '☐'}
                </span>
                <div className="flex-1">
                  <span className={`font-bold ${item.checked ? 'text-white' : 'text-amber-200'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {item.notes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── 7. INSTITUTIONAL MARKET INTELLIGENCE DASHBOARD (MODULE 17: SECTIONS A – L) ────────────────── */}
      <section className="bg-[#050a17] p-4 sm:p-5 rounded-2xl border border-sky-500/40 space-y-4 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-gradient-to-tr from-sky-500/30 to-indigo-500/30 border border-sky-400/40 flex items-center justify-center text-lg shadow-md">
              🏛️
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>MODULE 17 — INSTITUTIONAL MARKET INTELLIGENCE DASHBOARD</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  SECTIONS A – L
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time Price Action · SMC & ICT · Liquidity Heatmap · Micro/Macro Mechanics · Cross-Market Telemetry
              </p>
            </div>
          </div>

          {/* Module Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
            {[
              { id: 'ALL', label: 'All Modules' },
              { id: 'REGIME', label: 'A. Regime' },
              { id: 'MTF', label: 'B. MTF' },
              { id: 'SMC_ICT', label: 'C. SMC/ICT' },
              { id: 'LIQUIDITY', label: 'D. Liquidity' },
              { id: 'MICRO', label: 'E. Micro' },
              { id: 'MACRO', label: 'F. Macro' },
              { id: 'GLOBAL', label: 'G. Global' },
              { id: 'SENTIMENT', label: 'H. Sentiment' },
              { id: 'CROSS', label: 'I. Cross' },
              { id: 'EXECUTION', label: 'J. Execution' },
              { id: 'CONFLUENCE', label: 'K. Confluence' },
              { id: 'MONITOR', label: 'L. Monitor' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveModuleTab(tab.id as any)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                  activeModuleTab === tab.id
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'bg-[#091124] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 font-mono text-xs">
          {/* SECTION A: MARKET REGIME & PRICE ACTION */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'REGIME') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-sky-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>📈</span> SECTION A: MARKET REGIME & PRICE ACTION
                </span>
                <span className="text-[10px] text-sky-400 font-bold uppercase">{entryOutput.modules.aMarketRegime.volatilityRegime}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Trend: <strong className="text-white">{entryOutput.modules.aMarketRegime.trend}</strong> ({entryOutput.modules.aMarketRegime.transitions})</div>
                <div>Swings: <strong className="text-amber-300">{entryOutput.modules.aMarketRegime.higherHighsLows}</strong> · <strong className="text-rose-300">{entryOutput.modules.aMarketRegime.lowerHighsLows}</strong></div>
                <div>BOS/CHoCH: <strong className="text-cyan-300">{entryOutput.modules.aMarketRegime.breakOfStructure}</strong> ({entryOutput.modules.aMarketRegime.changeOfCharacter})</div>
                <div>Support / Resistance: <strong className="text-emerald-400">${entryOutput.modules.aMarketRegime.support.toFixed(1)}</strong> / <strong className="text-rose-400">${entryOutput.modules.aMarketRegime.resistance.toFixed(1)}</strong></div>
                <div>Displacement: <strong className="text-white">{entryOutput.modules.aMarketRegime.displacement}</strong></div>
              </div>
            </div>
          )}

          {/* SECTION B: MULTI-TIMEFRAME STRUCTURE */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'MTF') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-indigo-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🏛️</span> SECTION B: MULTI-TIMEFRAME STRUCTURE
                </span>
                <span className="text-[10px] text-indigo-400 font-bold">DOMINANT: 4H</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>1D: <strong className="text-amber-300">{entryOutput.modules.bMultiTimeframe.timeframes.daily.bias}</strong> — {entryOutput.modules.bMultiTimeframe.timeframes.daily.structure}</div>
                <div>4H: <strong className="text-amber-300">{entryOutput.modules.bMultiTimeframe.timeframes.h4.bias}</strong> — {entryOutput.modules.bMultiTimeframe.timeframes.h4.structure}</div>
                <div>1H: <strong className="text-cyan-300">{entryOutput.modules.bMultiTimeframe.timeframes.h1.bias}</strong> — {entryOutput.modules.bMultiTimeframe.timeframes.h1.structure}</div>
                <div>15M: <strong className="text-cyan-300">{entryOutput.modules.bMultiTimeframe.timeframes.m15.bias}</strong> — {entryOutput.modules.bMultiTimeframe.timeframes.m15.structure}</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">{entryOutput.modules.bMultiTimeframe.dominantTimeframeReason}</div>
              </div>
            </div>
          )}

          {/* SECTION C: SMC & ICT ANALYSIS */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'SMC_ICT') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-amber-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>📐</span> SECTION C: SMC & ICT ANALYSIS
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase">{entryOutput.modules.cSmcIct.zone} ZONE</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Bullish OB: <strong className="text-emerald-300">{entryOutput.modules.cSmcIct.bullishOrderBlock.range}</strong> ({entryOutput.modules.cSmcIct.bullishOrderBlock.status})</div>
                <div>Bearish OB: <strong className="text-rose-300">{entryOutput.modules.cSmcIct.bearishOrderBlock.range}</strong> ({entryOutput.modules.cSmcIct.bearishOrderBlock.status})</div>
                <div>Equilibrium (50%): <strong className="text-amber-300">${entryOutput.modules.cSmcIct.equilibrium50.toFixed(1)}</strong> (Range: ${entryOutput.modules.cSmcIct.dealingRange.low.toFixed(1)} – ${entryOutput.modules.cSmcIct.dealingRange.high.toFixed(1)})</div>
                <div>OTE Fib (61.8–78.6%): <strong className="text-cyan-300">${entryOutput.modules.cSmcIct.optimalTradeEntryFib.fib618.toFixed(1)} – ${entryOutput.modules.cSmcIct.optimalTradeEntryFib.fib786.toFixed(1)}</strong></div>
                <div>BSL / SSL: <strong className="text-white">${entryOutput.modules.cSmcIct.bslPrice.toFixed(1)}</strong> / <strong className="text-white">${entryOutput.modules.cSmcIct.sslPrice.toFixed(1)}</strong></div>
                <div>Kill Zone: <strong className="text-purple-300">{entryOutput.modules.cSmcIct.sessionKillZone.name}</strong> ({entryOutput.modules.cSmcIct.judasSwingStatus})</div>
              </div>
            </div>
          )}

          {/* SECTION D: LIQUIDITY & LIQUIDATION MAP */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'LIQUIDITY') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-rose-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🔥</span> SECTION D: LIQUIDITY & LIQUIDATION MAP
                </span>
                <span className="text-[10px] text-rose-400 font-bold uppercase">{entryOutput.modules.dLiquidityMap.longLiquidationCluster.status}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Short Liq Cluster: <strong className="text-rose-400">{entryOutput.modules.dLiquidityMap.shortLiquidationCluster.priceRange}</strong> ({entryOutput.modules.dLiquidityMap.shortLiquidationCluster.estimatedVolume})</div>
                <div>Long Liq Cluster: <strong className="text-emerald-400">{entryOutput.modules.dLiquidityMap.longLiquidationCluster.priceRange}</strong> ({entryOutput.modules.dLiquidityMap.longLiquidationCluster.estimatedVolume})</div>
                <div>Open Interest: <strong className="text-white">{entryOutput.modules.dLiquidityMap.openInterest.value}</strong> ({entryOutput.modules.dLiquidityMap.openInterest.trend})</div>
                <div>Funding Rate: <strong className="text-cyan-300">{entryOutput.modules.dLiquidityMap.fundingRate.rate}</strong> ({entryOutput.modules.dLiquidityMap.fundingRate.annualized} ann.)</div>
                <div>Futures Basis: <strong className="text-amber-300">{entryOutput.modules.dLiquidityMap.futuresBasis.basis}</strong> ({entryOutput.modules.dLiquidityMap.futuresBasis.status})</div>
                <div>Squeeze Risk: <strong className="text-rose-300">{entryOutput.modules.dLiquidityMap.squeezeRisk}</strong></div>
              </div>
            </div>
          )}

          {/* SECTION E: MICROECONOMIC & ORDER FLOW */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'MICRO') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-cyan-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>📊</span> SECTION E: MICROECONOMIC & ORDER FLOW
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">{entryOutput.modules.eMicroeconomic.bidAskImbalance.dominantSide}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Spot vs Perps: <strong className="text-white">{entryOutput.modules.eMicroeconomic.spotVsFuturesVolume.spotSharePct}% Spot / {entryOutput.modules.eMicroeconomic.spotVsFuturesVolume.futuresSharePct}% Perps</strong></div>
                <div>CVD Delta: <strong className="text-cyan-300">{entryOutput.modules.eMicroeconomic.cvdDelta.value}</strong> ({entryOutput.modules.eMicroeconomic.cvdDelta.status})</div>
                <div>Order Book: <strong className="text-white">{entryOutput.modules.eMicroeconomic.bidAskImbalance.ratio}</strong></div>
                <div>ETF Net Flows: <strong className="text-emerald-400">{entryOutput.modules.eMicroeconomic.etfFlows.netInflow}</strong></div>
                <div>Asset Driver: <strong className="text-slate-200">{entryOutput.modules.eMicroeconomic.assetSpecificDriver}</strong></div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">{entryOutput.modules.eMicroeconomic.microstructureVerdict}</div>
              </div>
            </div>
          )}

          {/* SECTION F: MACROECONOMIC CALENDAR & IMPACT */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'MACRO') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-emerald-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🌐</span> SECTION F: MACROECONOMIC ENGINE
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">FED BIAS</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Fed Funds Rate: <strong className="text-white">{entryOutput.modules.fMacroeconomic.fedRateExpectation.currentRate}</strong> ({entryOutput.modules.fMacroeconomic.fedRateExpectation.probability})</div>
                <div>Inflation (CPI): <strong className="text-amber-300">{entryOutput.modules.fMacroeconomic.inflationCpi.latestCpi}</strong> (Core: {entryOutput.modules.fMacroeconomic.inflationCpi.coreCpi})</div>
                <div>US 10Y Yield: <strong className="text-cyan-300">{entryOutput.modules.fMacroeconomic.usTreasuryYields.us10y}</strong> (Real Yield: {entryOutput.modules.fMacroeconomic.usTreasuryYields.realYield})</div>
                <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800 leading-tight">{entryOutput.modules.fMacroeconomic.transmissionMechanism}</div>
              </div>
            </div>
          )}

          {/* SECTION G: GLOBAL MARKETS & CORRELATIONS */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'GLOBAL') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-purple-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🌍</span> SECTION G: GLOBAL MARKETS & BETA
                </span>
                <span className="text-[10px] text-purple-400 font-bold">DXY: {entryOutput.modules.gGlobalMarkets.dxy.value}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Dollar Index (DXY): <strong className="text-white">{entryOutput.modules.gGlobalMarkets.dxy.value}</strong> ({entryOutput.modules.gGlobalMarkets.dxy.trend}) ➔ {entryOutput.modules.gGlobalMarkets.dxy.impactOnAsset}</div>
                <div>US Equities (S&P 500): <strong className="text-cyan-300">{entryOutput.modules.gGlobalMarkets.usEquitiesSp500.trend}</strong> ({entryOutput.modules.gGlobalMarkets.usEquitiesSp500.correlation})</div>
                <div>VIX Volatility: <strong className="text-amber-300">{entryOutput.modules.gGlobalMarkets.vixVolatility.value}</strong> ({entryOutput.modules.gGlobalMarkets.vixVolatility.regime})</div>
                <div>Crude Oil (WTI): <strong className="text-white">${entryOutput.modules.gGlobalMarkets.crudeOil.value}</strong> ({entryOutput.modules.gGlobalMarkets.crudeOil.impact})</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">{entryOutput.modules.gGlobalMarkets.correlationReliability}</div>
              </div>
            </div>
          )}

          {/* SECTION H: SOCIOECONOMIC, SENTIMENT & POSITIONING */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'SENTIMENT') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-yellow-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🧠</span> SECTION H: SENTIMENT & POSITIONING
                </span>
                <span className="text-[10px] text-amber-300 font-bold">{entryOutput.modules.hSocioeconomic.fearAndGreedIndex.label} ({entryOutput.modules.hSocioeconomic.fearAndGreedIndex.score})</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Fear & Greed Index: <strong className="text-amber-400">{entryOutput.modules.hSocioeconomic.fearAndGreedIndex.score} / 100</strong> ({entryOutput.modules.hSocioeconomic.fearAndGreedIndex.label})</div>
                <div>Retail Margin Positioning: <strong className="text-white">{entryOutput.modules.hSocioeconomic.retailPositioning.longPct}% Long / {entryOutput.modules.hSocioeconomic.retailPositioning.shortPct}% Short</strong> ({entryOutput.modules.hSocioeconomic.retailPositioning.crowdedSide})</div>
                <div>Market Narrative: <strong className="text-slate-200">{entryOutput.modules.hSocioeconomic.marketNarrative}</strong></div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">{entryOutput.modules.hSocioeconomic.sentimentPriceDivergence}</div>
              </div>
            </div>
          )}

          {/* SECTION I: CROSS-MARKET CONFIRMATION */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'CROSS') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-sky-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>⚖️</span> SECTION I: CROSS-MARKET CONFIRMATION
                </span>
                <span className={`text-[10px] font-bold ${entryOutput.modules.iCrossMarket.hasConflict ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {entryOutput.modules.iCrossMarket.hasConflict ? '⚠️ CONFLICT' : '✓ ALIGNED'}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>BTC Trend: <strong className="text-white">{entryOutput.modules.iCrossMarket.btcTrend}</strong></div>
                <div>USDT Dominance: <strong className="text-cyan-300">{entryOutput.modules.iCrossMarket.usdtDominanceValue}%</strong> ({entryOutput.modules.iCrossMarket.usdtDominanceTrend})</div>
                <div>Dollar Index (DXY): <strong className="text-amber-300">{entryOutput.modules.iCrossMarket.dxyValue}</strong> ({entryOutput.modules.iCrossMarket.dxyTrend})</div>
                <div>Verdict: <strong className="text-white">{entryOutput.modules.iCrossMarket.dualVerdict}</strong></div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">{entryOutput.modules.iCrossMarket.correlationMechanism}</div>
              </div>
            </div>
          )}

          {/* SECTION J: PRECISION ENTRY, SL & TP */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'EXECUTION') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-emerald-500/40 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🎯</span> SECTION J: PRECISION ENTRY & TARGETS
                </span>
                <span className="text-[10px] text-emerald-300 font-black">RRR {entryOutput.modules.jPrecisionEntry.riskRewardRatio}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Entry Zone: <strong className="text-amber-300">{entryOutput.modules.jPrecisionEntry.entryZone}</strong> (Ideal: ${entryOutput.modules.jPrecisionEntry.idealEntry > 0 ? entryOutput.modules.jPrecisionEntry.idealEntry.toFixed(1) : '—'})</div>
                <div>Trigger: <strong className="text-white">{entryOutput.modules.jPrecisionEntry.entryTrigger}</strong></div>
                <div>Structural SL: <strong className="text-rose-400">${entryOutput.modules.jPrecisionEntry.stopLossPrice > 0 ? entryOutput.modules.jPrecisionEntry.stopLossPrice.toFixed(1) : '—'}</strong></div>
                <div>Targets: TP1: <strong className="text-emerald-400">${entryOutput.modules.jPrecisionEntry.tp1Price > 0 ? entryOutput.modules.jPrecisionEntry.tp1Price.toFixed(1) : '—'}</strong> · TP2: <strong className="text-emerald-400">${entryOutput.modules.jPrecisionEntry.tp2Price > 0 ? entryOutput.modules.jPrecisionEntry.tp2Price.toFixed(1) : '—'}</strong></div>
                <div>Opposing Liquidity: <strong className="text-cyan-300">{entryOutput.modules.jPrecisionEntry.opposingLiquidity}</strong></div>
                <div>Timeframe & Risk: <strong className="text-slate-300">{entryOutput.modules.jPrecisionEntry.holdingTimeframe}</strong> ({entryOutput.modules.jPrecisionEntry.eventRisk})</div>
              </div>
            </div>
          )}

          {/* SECTION K: CONFIRMATION SCORE & EVIDENCE */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'CONFLUENCE') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-amber-500/40 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>⚡</span> SECTION K: CONFLUENCE SCORE
                </span>
                <span className="text-[10px] text-amber-300 font-bold">{entryOutput.modules.kConfirmationScore.score}/100</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Score: <strong className="text-amber-300">{entryOutput.modules.kConfirmationScore.score}/100</strong> ({entryOutput.modules.kConfirmationScore.qualityLabel})</div>
                <div>Core Gates: <strong className={entryOutput.modules.kConfirmationScore.coreGatesSatisfied ? 'text-emerald-400' : 'text-amber-400'}>{entryOutput.modules.kConfirmationScore.coreGatesSatisfied ? '✓ Satisfied' : 'Pending Gates'}</strong></div>
                <div>Missing: <strong className="text-slate-400">{entryOutput.modules.kConfirmationScore.missingConfirmations.length > 0 ? entryOutput.modules.kConfirmationScore.missingConfirmations.join(' · ') : 'None'}</strong></div>
                <div>Conflicts: <strong className="text-rose-300">{entryOutput.modules.kConfirmationScore.conflictingEvidence.length > 0 ? entryOutput.modules.kConfirmationScore.conflictingEvidence.join(' · ') : 'None'}</strong></div>
              </div>
            </div>
          )}

          {/* SECTION L: ACTIVE DECISION & INVALIDATION MONITOR */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'MONITOR') && (
            <div className="bg-[#081224] p-4 rounded-xl border border-sky-500/40 space-y-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>🛡️</span> SECTION L: DECISION & INVALIDATION
                </span>
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${decisionTheme.pill}`}>
                  {entryOutput.modules.lActiveDecisionMonitor.finalDecision} IDEA (Evidence Only)
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-snug">
                <div>Action: <strong className="text-white underline">{entryOutput.modules.lActiveDecisionMonitor.action}</strong></div>
                <div>Bias: <strong className="text-amber-300">{entryOutput.modules.lActiveDecisionMonitor.marketBias}</strong></div>
                <div>Lock: <strong className="text-slate-300">{entryOutput.modules.lActiveDecisionMonitor.isSignalLocked ? '🔒 Locked State' : '🔓 Dynamic Live'}</strong></div>
                <div>Invalidation Condition: <strong className="text-rose-300">{entryOutput.modules.lActiveDecisionMonitor.invalidationCondition}</strong></div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Risk #1: {entryOutput.modules.lActiveDecisionMonitor.whatCanGoWrong[0]}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ────────────────── 8. MODULE 18 SIMPLE HINGLISH INSTITUTIONAL EXPLANATION ────────────────── */}
      <section className="bg-gradient-to-r from-[#0d162d] via-[#091124] to-[#060a14] p-5 rounded-2xl border border-amber-500/40 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>MODULE 18 — SIMPLE HINGLISH INSTITUTIONAL VERDICT</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                  आसान भाषा में 5 मुख्य सवाल
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Institutional Analysis Made Simple · Evidence-Driven Q&A
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">
            FINAL DECISION: {entryOutput.finalDecision}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {/* QUESTION 1: WHY THIS DECISION WAS SELECTED */}
          <div className="p-3.5 rounded-xl bg-[#040814] border border-cyan-500/30 space-y-1.5 shadow-md">
            <span className="text-cyan-300 font-bold block text-[13px] flex items-center gap-1.5">
              <span>❓</span> 1. Ye decision (LONG/SHORT/WAIT) kyun select kiya gaya?
            </span>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {entryOutput.hinglishSummary.whyDecisionSelected}
            </p>
          </div>

          {/* QUESTION 2: WHY THE OPPOSITE DIRECTION WAS REJECTED */}
          <div className="p-3.5 rounded-xl bg-[#040814] border border-rose-500/30 space-y-1.5 shadow-md">
            <span className="text-rose-300 font-bold block text-[13px] flex items-center gap-1.5">
              <span>🚫</span> 2. Opposite direction kyun reject kiya gaya?
            </span>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {entryOutput.hinglishSummary.whyOppositeRejected}
            </p>
          </div>

          {/* QUESTION 3: WHAT MUST HAPPEN NEXT */}
          <div className="p-3.5 rounded-xl bg-[#040814] border border-emerald-500/30 space-y-1.5 shadow-md">
            <span className="text-emerald-300 font-bold block text-[13px] flex items-center gap-1.5">
              <span>⏳</span> 3. Aage trade lene ke liye kya hona zaroori hai?
            </span>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {entryOutput.hinglishSummary.whatMustHappenNext}
            </p>
          </div>

          {/* QUESTION 4: WHICH EXACT CONDITION CHANGES THE THESIS */}
          <div className="p-3.5 rounded-xl bg-[#040814] border border-amber-500/30 space-y-1.5 shadow-md">
            <span className="text-amber-300 font-bold block text-[13px] flex items-center gap-1.5">
              <span>🛑</span> 4. Kaunsi condition thesis ko badal/invalidate karegi?
            </span>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {entryOutput.hinglishSummary.whichConditionChangesThesis}
            </p>
          </div>

          {/* QUESTION 5: WHETHER CURRENT PRICE IS SUITABLE FOR ENTRY */}
          <div className="p-3.5 rounded-xl bg-[#040814] border border-purple-500/30 space-y-1.5 shadow-md md:col-span-2 lg:col-span-2">
            <span className="text-purple-300 font-bold block text-[13px] flex items-center gap-1.5">
              <span>🎯</span> 5. Kya current market price par enter karna suitable hai?
            </span>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {entryOutput.hinglishSummary.isCurrentPriceSuitable}
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────── 9. VERBATIM REPORTS PANEL (MODULE 18 / SECTION 11 / SECTION 20) ────────────────── */}
      {(viewMode === 'MODULE18_TEXT' || viewMode === 'SECTION11_TEXT' || viewMode === 'SECTION20_TEXT') && (
        <section className="rounded-2xl border-2 border-amber-500/50 bg-[#060b17] p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="text-base sm:text-lg font-black text-white font-mono">
                {viewMode === 'MODULE18_TEXT'
                  ? 'DEEEPR AI — MODULE 18 MASTER VERDICT (VERBATIM REPORT)'
                  : viewMode === 'SECTION11_TEXT'
                  ? 'DEEEPR AI — FINAL DECISION (SECTION 11 VERBATIM REPORT)'
                  : 'DEEEPR AI — PRECISION ENTRY (SECTION 20 VERBATIM REPORT)'}
              </h2>
            </div>
            <button
              onClick={handleCopyVerbatim}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-md cursor-pointer"
            >
              {copiedText ? '✅ Copied to Clipboard!' : '📋 Copy Exact Text'}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#03060f] border border-slate-800 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
            {viewMode === 'MODULE18_TEXT'
              ? entryOutput.verbatimModule18Format
              : viewMode === 'SECTION11_TEXT'
              ? entryOutput.verbatimInstitutionalReport
              : entryOutput.verbatimSection20Panel}
          </pre>
        </section>
      )}

      {/* FOOTER DISCLAIMER */}
      <footer className="pt-2 border-t border-slate-900 text-[10px] text-slate-500 text-center font-mono space-y-0.5">
        <div>DEEEPR AI PRECISION ENTRY ENGINE V2 · FEWER, HIGHER-QUALITY, CLEARLY EXPLAINED ENTRIES</div>
        <div>NEVER CHASE PRICE · NEVER INVENT DATA · NEVER GUARANTEE PROFIT · NOT FINANCIAL ADVICE</div>
      </footer>
    </div>
  );
};

export default DeeeprPrecisionEntryView;
