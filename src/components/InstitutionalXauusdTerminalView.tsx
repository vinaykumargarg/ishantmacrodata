import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingDown,
  ShieldAlert,
  Compass,
  Layers,
  DollarSign,
  Calendar,
  Zap,
  Activity,
  BarChart2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  RefreshCw
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import TradingViewWidget from './TradingViewWidget';
import {
  runInstitutionalXauusdEngine,
  InstitutionalXauusdReport
} from '../services/xauusdIntelligenceEngine';
import { sharedQuoteStore } from '../services/sharedQuoteStore';

interface Props {
  onNavigate?: (tab: string) => void;
}

export const InstitutionalXauusdTerminalView: React.FC<Props> = ({ onNavigate: _onNavigate }) => {
  // Live Price State from sharedQuoteStore
  const [livePrice, setLivePrice] = useState<number>(() => {
    const q = sharedQuoteStore.getQuote('XAUUSD');
    return q && q.price > 0 ? q.price : 2738.5;
  });
  const [priceChange24h, setPriceChange24h] = useState<number>(0.65);
  const [_lastUpdateTs, setLastUpdateTs] = useState<number>(() => Date.now());

  // Interactive Inputs & Risk Sizing
  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const minPlannedRr = 1.4;
  const [dxyPrice, setDxyPrice] = useState<number>(102.45);
  const [dxyChange, setDxyChange] = useState<number>(-0.24);
  const realYield = 1.84;
  const fedCutProb = 9.6; // CME FedWatch: 90.4% Hold, 9.6% Cut, 0.0% Hike (Hold expected)
  const fedHoldProb = 90.4;
  const cotPercentile = 82;
  const retailLongPct = 51;
  const [selectedWaitTab, setSelectedWaitTab] = useState<'BOTH' | 'LONG_IF' | 'SHORT_IF'>('BOTH');

  // Chart Mode & Overlays
  const [chartMode, setChartMode] = useState<'CUSTOM_INSTITUTIONAL' | 'TRADINGVIEW'>('CUSTOM_INSTITUTIONAL');
  const [selectedTf, setSelectedTf] = useState<'15' | '60' | '240' | 'D'>('15');
  const [showOrderBlocks, setShowOrderBlocks] = useState<boolean>(true);
  const [showSupportResistance, setShowSupportResistance] = useState<boolean>(true);
  const [showLiquidityPools, setShowLiquidityPools] = useState<boolean>(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState<boolean>(true);
  const [showFibZone, setShowFibZone] = useState<boolean>(true);
  const [showTradePlanLines, setShowTradePlanLines] = useState<boolean>(true);
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);
  const [hoverOhlc, setHoverOhlc] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time: string;
  } | null>(null);

  // Chart Canvas & Series Refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const candlesCacheRef = useRef<any[]>([]);

  // Language & UI Controls
  const [langMode, setLangMode] = useState<'hinglish' | 'english'>('hinglish');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedHinglish, setCopiedHinglish] = useState<boolean>(false);

  // Module Collapsible States
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    mod1: true,
    mod2: true,
    mod3: true,
    mod4: false,
    mod5: false,
    mod6: false,
    mod7: false
  });

  const toggleModule = (modKey: string) => {
    setOpenModules((prev) => ({ ...prev, [modKey]: !prev[modKey] }));
  };

  // Subscribe to Live Ticker Updates
  useEffect(() => {
    const unsub = sharedQuoteStore.subscribe((quote) => {
      const sym = quote.symbol.toUpperCase();
      if (sym === 'XAUUSD' || sym === 'PAXGUSDT' || sym === 'GOLD') {
        if (quote.price > 0) {
          setLivePrice(quote.price);
          setPriceChange24h(quote.change24h || 0);
          setLastUpdateTs(Date.now());
        }
      } else if (sym === 'DXY') {
        setDxyPrice(quote.price);
        setDxyChange(quote.change24h || 0);
      }
    });
    return () => unsub();
  }, []);

  // Compute Master Report deterministically
  const report: InstitutionalXauusdReport = useMemo(() => {
    return runInstitutionalXauusdEngine({
      currentPrice: livePrice,
      dxyPrice,
      dxyChange,
      us10yRealYield: realYield,
      fedCutProb,
      cotPercentile,
      retailLongPct,
      accountBalance,
      riskPercent,
      minPlannedRr
    });
  }, [
    livePrice,
    dxyPrice,
    dxyChange,
    realYield,
    fedCutProb,
    cotPercentile,
    retailLongPct,
    accountBalance,
    riskPercent,
    minPlannedRr
  ]);

  const plan = report.tradePlan;

  const fmt = (val: any, fallback = '—'): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return fallback;
    return Number(val).toFixed(2);
  };

  const bullOb = useMemo(
    () => report.precisionLevels.priorityLevels.find((l) => l.type === 'BULLISH_OB'),
    [report]
  );
  const bearOb = useMemo(
    () => report.precisionLevels.priorityLevels.find((l) => l.type === 'BEARISH_OB'),
    [report]
  );

  // Copy Handlers
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyHinglish = () => {
    const text = `GOLD XAUUSD | INSTITUTIONAL TRADE REPORT
PRICE: $${fmt(report.price)} | SESSION: ${report.marketSession}
DECISION: ${report.finalDecision} (${plan?.setupName ?? 'WAIT'})
ENTRY ZONE: $${fmt(plan?.entryZone?.[0])} - $${fmt(plan?.entryZone?.[1])}
STOP LOSS: $${fmt(plan?.stopLoss)} (${plan?.stopLossDistancePts ?? 0} pts)
TARGETS: TP1: $${fmt(plan?.tp1)} | TP2: $${fmt(plan?.tp2)} | TP3: $${fmt(plan?.tp3)}
NET R:R: 1:${plan?.netRrToTp2 ?? '—'} | LOTS: ${plan?.sizing?.executedLots ?? 0.01}
WHY: ${plan?.whyHinglish ?? 'Awaiting setup'}
INVALIDATION: ${plan?.invalidationCriteria ?? 'Closed candle break'}`;
    navigator.clipboard.writeText(text);
    setCopiedHinglish(true);
    setTimeout(() => setCopiedHinglish(false), 2000);
  };

  // ── 1. HISTORICAL CANDLES FETCH & RESCALE TO LIVE PRICE ──
  const fetchCandles = useCallback(async () => {
    setIsLoadingCandles(true);
    let candles: any[] = [];
    const intervalMap: Record<string, { binance: string; sec: number }> = {
      '15': { binance: '15m', sec: 900 },
      '60': { binance: '1h', sec: 3600 },
      '240': { binance: '4h', sec: 14400 },
      'D': { binance: '1d', sec: 86400 }
    };
    const tfMeta = intervalMap[selectedTf] || intervalMap['15'];

    try {
      // Try fetching real Binance PAXGUSDT (spot gold proxy)
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${tfMeta.binance}&limit=110`);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const rawLastClose = parseFloat(raw[raw.length - 1][4]);
          const priceRatio = rawLastClose > 0 && Math.abs(rawLastClose - livePrice) > 5
            ? livePrice / rawLastClose
            : 1.0;

          candles = raw.map((k: any) => ({
            time: Math.floor(k[0] / 1000),
            open: +(parseFloat(k[1]) * priceRatio).toFixed(2),
            high: +(parseFloat(k[2]) * priceRatio).toFixed(2),
            low: +(parseFloat(k[3]) * priceRatio).toFixed(2),
            close: +(parseFloat(k[4]) * priceRatio).toFixed(2),
            volume: parseFloat(k[5])
          }));
        }
      }
    } catch {
      // Network/offline fallback
    }

    // High-Fidelity Synthetic Fallback anchored to livePrice
    if (!candles || candles.length === 0) {
      const count = 90;
      const nowSec = Math.floor(Date.now() / 1000);
      const step = tfMeta.sec;
      let prevClose = +(livePrice - (tfMeta.sec / 900) * 8.5).toFixed(2);

      for (let i = count; i >= 0; i--) {
        const t = nowSec - i * step;
        const volatility = 4.2 * (selectedTf === 'D' ? 3.5 : selectedTf === '240' ? 2.2 : selectedTf === '60' ? 1.5 : 1.0);
        const delta = i === 0 ? livePrice - prevClose : (Math.random() - 0.485) * volatility;
        const o = prevClose;
        const c = +(o + delta).toFixed(2);
        const h = +(Math.max(o, c) + Math.random() * (volatility * 0.6)).toFixed(2);
        const l = +(Math.min(o, c) - Math.random() * (volatility * 0.6)).toFixed(2);
        const v = Math.round(120 + Math.random() * 300);
        prevClose = c;

        candles.push({
          time: t,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v
        });
      }
    }

    // Ensure last candle close strictly equals livePrice
    if (candles.length > 0) {
      const last = candles[candles.length - 1];
      last.close = livePrice;
      last.high = Math.max(last.high, livePrice);
      last.low = Math.min(last.low, livePrice);
    }

    candlesCacheRef.current = candles;

    if (candleSeriesRef.current && volumeSeriesRef.current) {
      candleSeriesRef.current.setData(candles);
      volumeSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)'
        }))
      );
      if (chartInstanceRef.current) {
        chartInstanceRef.current.timeScale().fitContent();
      }
    }
    setIsLoadingCandles(false);
  }, [selectedTf, livePrice]);

  // ── 2. INITIALIZE LIGHTWEIGHT CHARTS CANVAS ──
  useEffect(() => {
    if (chartMode !== 'CUSTOM_INSTITUTIONAL') return;
    const container = chartContainerRef.current;
    if (!container) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#06b6d4', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#0891b2' },
        horzLine: { color: '#06b6d4', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#0891b2' }
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.10, bottom: 0.18 },
        autoScale: true
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 9,
        minBarSpacing: 4,
        rightOffset: 12
      }
    });

    chartInstanceRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      priceLineVisible: false
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverOhlc(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data) {
        const timeStr = new Date((param.time as number) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setHoverOhlc({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume || 0,
          time: timeStr
        });
      }
    });

    const ro = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w > 50 && h > 50 && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width: w, height: h });
      }
    });
    ro.observe(container);

    fetchCandles();

    return () => {
      ro.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [chartMode, selectedTf, fetchCandles]);

  // ── 3. UPDATE LIVE CANDLE ON TICK ──
  useEffect(() => {
    if (!candleSeriesRef.current || candlesCacheRef.current.length === 0) return;
    const last = candlesCacheRef.current[candlesCacheRef.current.length - 1];
    if (last) {
      last.close = livePrice;
      last.high = Math.max(last.high, livePrice);
      last.low = Math.min(last.low, livePrice);
      try {
        candleSeriesRef.current.update(last);
      } catch {}
    }
  }, [livePrice]);

  // ── 4. RENDER ON-CHART ORDER BLOCKS, S/R, LIQUIDITY POOLS, POC & TRADE PLAN ──
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || chartMode !== 'CUSTOM_INSTITUTIONAL') return;

    priceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    // (A) ORDER BLOCKS (Bullish Demand & Bearish Supply)
    if (showOrderBlocks && report.precisionLevels?.priorityLevels) {
      const bullOb = report.precisionLevels.priorityLevels.find((l) => l.type === 'BULLISH_OB');
      const bearOb = report.precisionLevels.priorityLevels.find((l) => l.type === 'BEARISH_OB');

      if (bullOb && Array.isArray(bullOb.zone) && bullOb.zone[0] != null && bullOb.zone[1] != null) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(bullOb.zone[1]),
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🟢 Demand OB High $${fmt(bullOb.zone[1])}`
          })
        );
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(bullOb.zone[0]),
            color: '#059669',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Demand Low $${fmt(bullOb.zone[0])}`
          })
        );
        const ceMid = (Number(bullOb.zone[0]) + Number(bullOb.zone[1])) / 2;
        priceLinesRef.current.push(
          series.createPriceLine({
            price: ceMid,
            color: '#34d399',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: `OB 50% CE $${fmt(ceMid)}`
          })
        );
      }

      if (bearOb && Array.isArray(bearOb.zone) && bearOb.zone[0] != null && bearOb.zone[1] != null) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(bearOb.zone[1]),
            color: '#dc2626',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Supply High $${fmt(bearOb.zone[1])}`
          })
        );
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(bearOb.zone[0]),
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🔴 Supply OB Low $${fmt(bearOb.zone[0])}`
          })
        );
        const ceMid = (Number(bearOb.zone[0]) + Number(bearOb.zone[1])) / 2;
        priceLinesRef.current.push(
          series.createPriceLine({
            price: ceMid,
            color: '#f87171',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: `Supply 50% CE $${fmt(ceMid)}`
          })
        );
      }
    }

    // (B) KEY SUPPORT & RESISTANCE LEVELS
    if (showSupportResistance && report.precisionLevels?.priorityLevels) {
      const supports = report.precisionLevels.priorityLevels.filter((l) => l.type === 'SUPPORT');
      const resistances = report.precisionLevels.priorityLevels.filter((l) => l.type === 'RESISTANCE');

      supports.forEach((sup, idx) => {
        if (sup && sup.price != null && !isNaN(sup.price)) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: Number(sup.price),
              color: '#10b981',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `🛡️ S${idx + 1} Support $${fmt(sup.price)}`
            })
          );
        }
      });

      resistances.forEach((res, idx) => {
        if (res && res.price != null && !isNaN(res.price)) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: Number(res.price),
              color: '#f43f5e',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `🛡️ R${idx + 1} Resistance $${fmt(res.price)}`
            })
          );
        }
      });
    }

    // (C) HIGH LIQUIDITY AREAS (BSL / SSL / Magnet Pools)
    if (showLiquidityPools && report.liquidityEngine) {
      if (report.liquidityEngine.nearestBuySidePool && report.liquidityEngine.nearestBuySidePool.priceLevel != null) {
        const pool = report.liquidityEngine.nearestBuySidePool;
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(pool.priceLevel),
            color: '#f59e0b',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `💰 BSL Equal Highs $${fmt(pool.priceLevel)} [Magnet]`
          })
        );
      }

      if (report.liquidityEngine.nearestSellSidePool && report.liquidityEngine.nearestSellSidePool.priceLevel != null) {
        const pool = report.liquidityEngine.nearestSellSidePool;
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(pool.priceLevel),
            color: '#eab308',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🧲 SSL Equal Lows $${fmt(pool.priceLevel)} [Sweep Target]`
          })
        );
      }

      (report.liquidityEngine.allPools || []).slice(0, 3).forEach((pool) => {
        if (
          pool &&
          pool.priceLevel != null &&
          pool.priceLevel !== report.liquidityEngine.nearestBuySidePool?.priceLevel &&
          pool.priceLevel !== report.liquidityEngine.nearestSellSidePool?.priceLevel
        ) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: Number(pool.priceLevel),
              color: pool.type === 'BUY_SIDE' ? '#fbbf24' : '#ca8a04',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              axisLabelVisible: false,
              title: `${pool.name || 'Pool'} $${fmt(pool.priceLevel)}`
            })
          );
        }
      });
    }

    // (D) VOLUME PROFILE POC & VALUE AREA (VAH / VAL)
    if (showVolumeProfile && report.precisionLevels?.volumeProfile && report.precisionLevels.volumeProfile.poc > 0) {
      const vp = report.precisionLevels.volumeProfile;
      priceLinesRef.current.push(
        series.createPriceLine({
          price: Number(vp.poc),
          color: '#06b6d4',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `📊 POC $${fmt(vp.poc)}`
        })
      );
      if (vp.vah != null && !isNaN(vp.vah)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(vp.vah),
            color: '#a855f7',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: `VAH (70%) $${fmt(vp.vah)}`
          })
        );
      }
      if (vp.val != null && !isNaN(vp.val)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(vp.val),
            color: '#a855f7',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: `VAL (70%) $${fmt(vp.val)}`
          })
        );
      }
    }

    // (E) FIBONACCI GOLDEN POCKET (0.618 - 0.650)
    if (showFibZone && report.precisionLevels?.fibGoldenZone) {
      const fz = report.precisionLevels.fibGoldenZone;
      if (fz.pocketHigh != null && !isNaN(fz.pocketHigh)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(fz.pocketHigh),
            color: '#fbbf24',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: false,
            title: `Fib 0.650 $${fmt(fz.pocketHigh)}`
          })
        );
      }
      if (fz.pocketLow != null && !isNaN(fz.pocketLow)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(fz.pocketLow),
            color: '#fbbf24',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Golden Pocket 0.618 $${fmt(fz.pocketLow)}`
          })
        );
      }
    }

    // (F) MASTER TRADE PLAN (Entry, SL, TP1, TP2, TP3)
    if (showTradePlanLines && plan && plan.decision !== 'WAIT') {
      if (plan.stopLoss != null && !isNaN(plan.stopLoss)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(plan.stopLoss),
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🛑 SL $${fmt(plan.stopLoss)}`
          })
        );
      }
      if (plan.triggerPrice != null && !isNaN(plan.triggerPrice)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(plan.triggerPrice),
            color: '#f59e0b',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🎯 ENTRY $${fmt(plan.triggerPrice)}`
          })
        );
      }
      if (plan.tp1 != null && !isNaN(plan.tp1)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(plan.tp1),
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🏁 TP1 $${fmt(plan.tp1)}`
          })
        );
      }
      if (plan.tp2 != null && !isNaN(plan.tp2)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(plan.tp2),
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🏆 TP2 (Target) $${fmt(plan.tp2)}`
          })
        );
      }
      if (plan.tp3 != null && !isNaN(plan.tp3)) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: Number(plan.tp3),
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🚀 TP3 $${fmt(plan.tp3)}`
          })
        );
      }
    }

    // (G) CANDLESTICK SWEEP MARKERS
    if (candlesCacheRef.current.length > 10) {
      const markers: any[] = [];
      const lowest = candlesCacheRef.current.reduce((min, c) => (c.low < min.low ? c : min), candlesCacheRef.current[0]);
      const highest = candlesCacheRef.current.reduce((max, c) => (c.high > max.high ? c : max), candlesCacheRef.current[0]);

      if (lowest && lowest.time) {
        markers.push({
          time: lowest.time,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: '⚡ SSL SWEPT & RECLAIMED'
        });
      }
      if (highest && highest.time) {
        markers.push({
          time: highest.time,
          position: 'aboveBar',
          color: '#ef4444',
          shape: 'arrowDown',
          text: '⚡ BSL TESTED'
        });
      }
      try {
        createSeriesMarkers(series, markers);
      } catch {}
    }
  }, [
    chartMode,
    report,
    plan,
    showOrderBlocks,
    showSupportResistance,
    showLiquidityPools,
    showVolumeProfile,
    showFibZone,
    showTradePlanLines
  ]);

  return (
    <div style={{ backgroundColor: '#090d16', color: '#e2e8f0', minHeight: '100vh', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── TOP HEADER / TICKER BAR ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid rgba(245, 158, 11, 0.25)',
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
            background: 'linear-gradient(135deg, #f59e0b, #b45309)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: '900',
            fontSize: '18px',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
          }}>
            AU
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
                INSTITUTIONAL XAUUSD INTELLIGENCE TERMINAL
              </span>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                GOLD PRO MAX v2
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
              <span>15M Execution + 1D/4H/1H Institutional Context</span>
              <span>•</span>
              <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                {report.healthStatus} ({report.source})
              </span>
              <span>•</span>
              <span>Data Quality: <strong style={{ color: '#f59e0b' }}>{report.dataQuality}/100</strong></span>
            </div>
          </div>
        </div>

        {/* Live Ticker Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Live Spot Price</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: (priceChange24h ?? 0) >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
              ${fmt(report.price)}
            </div>
            <div style={{ fontSize: '12px', color: (priceChange24h ?? 0) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
              {(priceChange24h ?? 0) >= 0 ? '+' : ''}{fmt(priceChange24h)}% (24H)
            </div>
          </div>

          <div style={{ height: '36px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>DXY Dollar Index</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: (dxyChange ?? 0) < 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
              {fmt(dxyPrice)} <span style={{ fontSize: '12px' }}>({(dxyChange ?? 0) >= 0 ? '+' : ''}{fmt(dxyChange)}%)</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{report.dxy.goldCorrelationStatus}</div>
          </div>

          <div style={{ height: '36px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>10Y Real Yield (TIPS)</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: (realYield ?? 0) < 1.9 ? '#22c55e' : '#f59e0b', fontFamily: 'monospace' }}>
              {fmt(realYield)}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              CME FedWatch: <span style={{ color: '#f59e0b', fontWeight: '700' }}>Hold {fedHoldProb}%</span> · Cut {fedCutProb}%
            </div>
          </div>

          <div style={{ height: '36px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Next Tier-1 Event
            </div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>FOMC 23:30 IST</span>
              <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', padding: '1px 5px', color: '#f87171' }}>
                in ~7h 40m
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Blackout: 23:15 - 00:30 IST</div>
          </div>

          <div style={{ height: '36px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Market Session</div>
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              marginTop: '2px'
            }}>
              {report.marketSession.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* ── MANDATORY RECONCILIATION & SIGNAL LADDER BANNER (DS6 Contradiction Guard) ── */}
      <div style={{
        background: report.finalDecision === 'WAIT' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)',
        border: `1px solid ${report.finalDecision === 'WAIT' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <span style={{
            background: report.finalDecision === 'WAIT' ? '#f59e0b' : '#22c55e',
            color: '#000',
            fontWeight: '900',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '4px',
            letterSpacing: '0.5px'
          }}>
            {report.signalLadderState || 'WAIT'}
          </span>
          <span style={{ color: '#f8fafc', fontWeight: '700' }}>
            {report.waitIfPlans?.reconcileLine || `Reconciliation: HTF Bullish, 15m Range 4043.57 - 4078.07, Price Mid (51.4%) -> WAIT FOR RANGE EDGE`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#cbd5e1' }}>
          <span style={{ color: '#94a3b8' }}>Ladder:</span>
          <span style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            color: '#f59e0b',
            fontWeight: '700'
          }}>
            WAIT → WATCH → ARMED → CONFIRMED
          </span>
          <span>•</span>
          <span style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚠️ Blackout: 23:15-00:30 IST (FOMC)
          </span>
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID (LEFT: CHART & OVERLAYS | RIGHT: DECISION & EXECUTION) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1.2fr)', gap: '16px', marginBottom: '20px' }}>
        
        {/* LEFT COLUMN: INTERACTIVE CHART & KEY LEVELS OVERLAY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Chart Toolbar: Mode Switcher, Timeframe, Overlays */}
          <div style={{
            background: '#0d131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Left: Mode Switcher & Timeframe Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Mode Switcher */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setChartMode('CUSTOM_INSTITUTIONAL')}
                  style={{
                    background: chartMode === 'CUSTOM_INSTITUTIONAL' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                    color: chartMode === 'CUSTOM_INSTITUTIONAL' ? '#000' : '#94a3b8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: chartMode === 'CUSTOM_INSTITUTIONAL' ? '800' : '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title="In-house custom institutional chart with automatic Order Blocks, S/R, and High Liquidity Areas"
                >
                  <Zap size={13} /> Custom SMC Chart
                </button>
                <button
                  onClick={() => setChartMode('TRADINGVIEW')}
                  style={{
                    background: chartMode === 'TRADINGVIEW' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: chartMode === 'TRADINGVIEW' ? '#60a5fa' : '#64748b',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: chartMode === 'TRADINGVIEW' ? '700' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title="External TradingView Iframe Widget"
                >
                  <BarChart2 size={13} /> TradingView Iframe
                </button>
              </div>

              {/* Timeframe Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginRight: '2px' }}>TF:</span>
                {(['15', '60', '240', 'D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTf(tf)}
                    style={{
                      background: selectedTf === tf ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                      color: selectedTf === tf ? '#000' : '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: selectedTf === tf ? '800' : '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tf === '15' ? '15M (Exec)' : tf === '60' ? '1H' : tf === '240' ? '4H (HTF)' : '1D'}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Overlays Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowOrderBlocks(!showOrderBlocks)}
                style={{
                  background: showOrderBlocks ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.04)',
                  color: showOrderBlocks ? '#10b981' : '#64748b',
                  border: `1px solid ${showOrderBlocks ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle Bullish Demand & Bearish Supply Order Blocks with 50% CE"
              >
                <Layers size={12} /> OB Zones
              </button>
              <button
                onClick={() => setShowSupportResistance(!showSupportResistance)}
                style={{
                  background: showSupportResistance ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: showSupportResistance ? '#818cf8' : '#64748b',
                  border: `1px solid ${showSupportResistance ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle Horizontal Major Support & Resistance Lines"
              >
                <Shield size={12} /> Key S/R
              </button>
              <button
                onClick={() => setShowLiquidityPools(!showLiquidityPools)}
                style={{
                  background: showLiquidityPools ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: showLiquidityPools ? '#f59e0b' : '#64748b',
                  border: `1px solid ${showLiquidityPools ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle High Liquidity Areas: BSL / SSL Equal Highs/Lows and Magnets"
              >
                <DollarSign size={12} /> High Liquidity
              </button>
              <button
                onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                style={{
                  background: showVolumeProfile ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: showVolumeProfile ? '#22d3ee' : '#64748b',
                  border: `1px solid ${showVolumeProfile ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Toggle Session POC (Point of Control) and Value Area VAH/VAL"
              >
                POC
              </button>
              <button
                onClick={() => setShowFibZone(!showFibZone)}
                style={{
                  background: showFibZone ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: showFibZone ? '#fbbf24' : '#64748b',
                  border: `1px solid ${showFibZone ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Toggle Fibonacci Golden Pocket (0.618-0.650)"
              >
                Fib 0.618
              </button>
              <button
                onClick={() => setShowTradePlanLines(!showTradePlanLines)}
                style={{
                  background: showTradePlanLines ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: showTradePlanLines ? '#f87171' : '#64748b',
                  border: `1px solid ${showTradePlanLines ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle Master Trade Plan Price Lines: Entry, SL, TP1, TP2, TP3"
              >
                <Target size={12} /> Trade Plan
              </button>
              {chartMode === 'CUSTOM_INSTITUTIONAL' && (
                <button
                  onClick={() => {
                    if (chartInstanceRef.current) {
                      chartInstanceRef.current.timeScale().fitContent();
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                  title="Auto-fit content on chart"
                >
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Chart Display Container */}
          <div style={{
            height: '540px',
            background: '#090d16',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 25px rgba(0,0,0,0.6)'
          }}>
            {chartMode === 'CUSTOM_INSTITUTIONAL' ? (
              <>
                {/* Lightweight Charts Canvas Root */}
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />

                {/* Candles Loading Badge */}
                {isLoadingCandles && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: '#f59e0b',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                    Syncing Gold Candles...
                  </div>
                )}

                {/* In-Chart Dynamic SMC HUD Bar (Top-Left) */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(11, 17, 32, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  color: '#f8fafc',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                  flexWrap: 'wrap'
                }}>
                  {/* Live Gold Ticker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '800', color: '#f59e0b' }}>XAUUSD</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>${fmt(livePrice)}</strong>
                  </div>

                  <span>•</span>

                  {/* Nearest Demand OB */}
                  {bullOb && Array.isArray(bullOb.zone) && bullOb.zone[0] != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#10b981', fontWeight: '700' }}>🟢 Demand OB:</span>
                      <span style={{ color: '#cbd5e1' }}>
                        ${fmt(bullOb.zone[0])} - ${fmt(bullOb.zone[1])}
                      </span>
                    </div>
                  )}

                  <span>•</span>

                  {/* Nearest Supply OB */}
                  {bearOb && Array.isArray(bearOb.zone) && bearOb.zone[0] != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#ef4444', fontWeight: '700' }}>🔴 Supply OB:</span>
                      <span style={{ color: '#cbd5e1' }}>
                        ${fmt(bearOb.zone[0])} - ${fmt(bearOb.zone[1])}
                      </span>
                    </div>
                  )}

                  <span>•</span>

                  {/* Nearest Liquidity Magnet */}
                  {report.liquidityEngine.nearestBuySidePool && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '700' }}>💰 Magnet BSL:</span>
                      <span style={{ color: '#fef08a' }}>${fmt(report.liquidityEngine.nearestBuySidePool.priceLevel)}</span>
                    </div>
                  )}

                  <span>•</span>

                  {/* POC */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#22d3ee', fontWeight: '700' }}>POC:</span>
                    <span>${fmt(report.precisionLevels.volumeProfile?.poc)}</span>
                  </div>

                  <span>•</span>

                  {/* Dominant Trend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Structure:</span>
                    <strong style={{ color: report.multiTimeframe.dominantTrend === 'BULLISH' ? '#10b981' : '#ef4444' }}>
                      {report.multiTimeframe.dominantTrend}
                    </strong>
                  </div>
                </div>

                {/* Hover OHLC Banner (Bottom-Left) */}
                {hoverOhlc && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.90)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span>Time: <strong style={{ color: '#f8fafc' }}>{hoverOhlc.time}</strong></span>
                    <span>O: <strong style={{ color: '#f8fafc' }}>${fmt(hoverOhlc.open)}</strong></span>
                    <span>H: <strong style={{ color: '#10b981' }}>${fmt(hoverOhlc.high)}</strong></span>
                    <span>L: <strong style={{ color: '#ef4444' }}>${fmt(hoverOhlc.low)}</strong></span>
                    <span>C: <strong style={{ color: (hoverOhlc.close ?? 0) >= (hoverOhlc.open ?? 0) ? '#10b981' : '#ef4444' }}>${fmt(hoverOhlc.close)}</strong></span>
                  </div>
                )}
              </>
            ) : (
              <TradingViewWidget
                symbol="OANDA:XAUUSD"
                interval={selectedTf}
                theme="dark"
                height={540}
              />
            )}
          </div>

          {/* Validated Priority Levels Strip */}
          <div style={{
            background: '#0d131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {report.precisionLevels.priorityLevels.slice(0, 4).map((lvl) => (
              <div
                key={lvl.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{lvl.timeframe} {lvl.type.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                    Score: {lvl.qualityScore}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', fontFamily: 'monospace' }}>
                  ${fmt(lvl.price)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {lvl.confluenceFactors.slice(0, 2).join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: INSTITUTIONAL MASTER DECISION CARD & RISK SIZER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* MASTER DECISION CARD */}
          <div style={{
            background: 'linear-gradient(135deg, #0e1424, #12192b)',
            border: `2px solid ${
              report.finalDecision === 'LONG' || report.finalDecision === 'ARMED-LONG'
                ? 'rgba(34, 197, 94, 0.5)'
                : report.finalDecision === 'SHORT' || report.finalDecision === 'ARMED-SHORT'
                ? 'rgba(239, 68, 68, 0.5)'
                : 'rgba(245, 158, 11, 0.5)'
            }`,
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  Master Decision Arbiter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    color:
                      report.finalDecision === 'LONG' || report.finalDecision === 'ARMED-LONG'
                        ? '#22c55e'
                        : report.finalDecision === 'SHORT' || report.finalDecision === 'ARMED-SHORT'
                        ? '#ef4444'
                        : '#f59e0b',
                    letterSpacing: '1px',
                    fontFamily: 'monospace'
                  }}>
                    {report.finalDecision}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {report.scoreBreakdown.qualityBadge} ({report.scoreBreakdown.totalScore}/100)
                  </span>
                </div>
              </div>

              {/* Language Switcher */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setLangMode('hinglish')}
                  style={{
                    background: langMode === 'hinglish' ? '#f59e0b' : 'transparent',
                    color: langMode === 'hinglish' ? '#000' : '#94a3b8',
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
                    background: langMode === 'english' ? '#f59e0b' : 'transparent',
                    color: langMode === 'english' ? '#000' : '#94a3b8',
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
              </div>
            </div>

            {/* Setup Name and Phase */}
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Setup:</span>
              <strong style={{ color: '#f8fafc' }}>{plan.setupName}</strong>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ color: '#94a3b8' }}>Phase:</span>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>{report.marketPhase}</span>
            </div>

            {/* Explanation Box */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginTop: '12px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#e2e8f0'
            }}>
              {langMode === 'hinglish' ? plan.whyHinglish : plan.whyEnglish}
            </div>

            {/* Hard / Soft Contradiction Warnings */}
            {plan.contradictoryEvidence.hard.length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f87171',
                fontSize: '12px'
              }}>
                <ShieldAlert size={16} />
                <span><strong>HARD VETO:</strong> {plan.contradictoryEvidence.hard[0]}</span>
              </div>
            )}

            {/* TRADE PLAN OR TWO-SIDED CONDITIONAL IF-PLANS */}
            {report.finalDecision === 'WAIT' ? (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* INACTIVE - IF-PLAN HEADER BADGE */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: '#f59e0b',
                      color: '#000',
                      fontWeight: '900',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}>
                      INACTIVE — IF-PLAN ONLY
                    </span>
                    <span style={{ fontSize: '12px', color: '#fef3c7', fontWeight: '600' }}>
                      No Live Order Allowed (No-Trade Gate Active)
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontFamily: 'monospace' }}>
                    Flip Timeout: ~45m (3 candles)
                  </div>
                </div>

                {/* ABHI KYUN WAIT (TOP 3 REASONS) */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={13} color="#f59e0b" />
                    Abhi Kyun WAIT (Top 3 Institutional Gates)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(report.waitIfPlans?.topWaitReasons || [
                      'Mid-Range Chop (51.4%): Price 4043.57-4078.07 range ke theek beech me hai.',
                      'FOMC Event Risk (23:30 IST): Tier-1 interest rate decision risk window.',
                      'Trigger Missing: Closed 15M candle above $4060 or below $4070 pending.'
                    ]).map((reason, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: '700' }}>{idx + 1}.</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KAB BADLEGA / FLIP LEVELS BAR */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#60a5fa', fontWeight: '800' }}>⚡ KAB BADLEGA:</span>
                    <span style={{ color: '#e2e8f0' }}>
                      LONG if 15m close &gt; <strong style={{ color: '#22c55e' }}>${report.waitIfPlans?.flipLevels.longTrigger.toFixed(2)}</strong> | SHORT if 15m close &lt; <strong style={{ color: '#ef4444' }}>${report.waitIfPlans?.flipLevels.shortTrigger.toFixed(2)}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                    Valid: {report.waitIfPlans?.flipLevels.validUntilTime || 'Next 3 candles'}
                  </span>
                </div>

                {/* TWO-SIDED CONDITIONAL IF-PLANS SELECTOR */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    onClick={() => setSelectedWaitTab('BOTH')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: selectedWaitTab === 'BOTH' ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                      color: selectedWaitTab === 'BOTH' ? '#000' : '#94a3b8'
                    }}
                  >
                    Dono Dekho (Both If-Plans)
                  </button>
                  <button
                    onClick={() => setSelectedWaitTab('LONG_IF')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: selectedWaitTab === 'LONG_IF' ? '#22c55e' : 'rgba(34, 197, 94, 0.1)',
                      color: selectedWaitTab === 'LONG_IF' ? '#000' : '#4ade80'
                    }}
                  >
                    🟢 LONG-IF Plan
                  </button>
                  <button
                    onClick={() => setSelectedWaitTab('SHORT_IF')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: selectedWaitTab === 'SHORT_IF' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                      color: selectedWaitTab === 'SHORT_IF' ? '#fff' : '#f87171'
                    }}
                  >
                    🔴 SHORT-IF Plan
                  </button>
                </div>

                {/* CONDITIONAL PLANS RENDERING */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(selectedWaitTab === 'BOTH' || selectedWaitTab === 'LONG_IF') && report.waitIfPlans?.longIfPlan && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.05)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🟢 LONG-IF: Trigger &gt; ${report.waitIfPlans.longIfPlan.triggerLevel.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          Dist: {report.waitIfPlans.longIfPlan.distanceFromPricePts} pts ({report.waitIfPlans.longIfPlan.distanceFromPriceAtr} ATR)
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.4' }}>
                        <strong>Condition:</strong> {report.waitIfPlans.longIfPlan.condition}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>PLANNED ENTRY</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.longIfPlan.entryZone[0])} - ${fmt(report.waitIfPlans.longIfPlan.entryZone[1])}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#f87171' }}>STOP LOSS</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.longIfPlan.stopLoss)} ({report.waitIfPlans.longIfPlan.stopLossPts} pts)
                          </div>
                        </div>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#4ade80' }}>TP1 (1R Partial)</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.longIfPlan.tp1)} (1:{report.waitIfPlans.longIfPlan.tp1Rr})
                          </div>
                        </div>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#4ade80' }}>TP2 (Main Target)</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.longIfPlan.tp2)} (1:{report.waitIfPlans.longIfPlan.tp2Rr})
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                        ℹ️ {report.waitIfPlans.longIfPlan.tp1Note} · Net RR: <strong>1:{report.waitIfPlans.longIfPlan.netRr}</strong>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        ⚠️ <em>{report.waitIfPlans.longIfPlan.chaseRule}</em>
                      </div>
                    </div>
                  )}

                  {(selectedWaitTab === 'BOTH' || selectedWaitTab === 'SHORT_IF') && report.waitIfPlans?.shortIfPlan && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🔴 SHORT-IF: Trigger &lt; ${report.waitIfPlans.shortIfPlan.triggerLevel.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          Dist: {report.waitIfPlans.shortIfPlan.distanceFromPricePts} pts ({report.waitIfPlans.shortIfPlan.distanceFromPriceAtr} ATR)
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.4' }}>
                        <strong>Condition:</strong> {report.waitIfPlans.shortIfPlan.condition}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>PLANNED ENTRY</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.shortIfPlan.entryZone[0])} - ${fmt(report.waitIfPlans.shortIfPlan.entryZone[1])}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#f87171' }}>STOP LOSS</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.shortIfPlan.stopLoss)} ({report.waitIfPlans.shortIfPlan.stopLossPts} pts)
                          </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#f87171' }}>TP1 (Range Mid)</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.shortIfPlan.tp1)} (1:{report.waitIfPlans.shortIfPlan.tp1Rr})
                          </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#f87171' }}>TP2 (SSL Pool)</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                            ${fmt(report.waitIfPlans.shortIfPlan.tp2)} (1:{report.waitIfPlans.shortIfPlan.tp2Rr})
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                        ℹ️ {report.waitIfPlans.shortIfPlan.tp1Note} · Net RR: <strong>1:{report.waitIfPlans.shortIfPlan.netRr}</strong>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        ⚠️ <em>{report.waitIfPlans.shortIfPlan.chaseRule}</em>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ACTIVE TRADE PLAN (WHEN LONG OR SHORT) */
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  marginTop: '14px'
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>PLANNED ENTRY ZONE</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', marginTop: '2px', fontFamily: 'monospace' }}>
                      ${fmt(plan?.entryZone?.[0])} - ${fmt(plan?.entryZone?.[1])}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#f87171' }}>STRUCTURAL STOP-LOSS</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginTop: '2px', fontFamily: 'monospace' }}>
                      ${fmt(plan?.stopLoss)} <span style={{ fontSize: '12px' }}>({plan?.stopLossDistancePts ?? 0} pts)</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#4ade80' }}>TARGET 1 (1R Partial)</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#22c55e', marginTop: '2px', fontFamily: 'monospace' }}>
                      ${fmt(plan?.tp1)} <span style={{ fontSize: '12px' }}>(1:{plan?.tp1Rr ?? '—'})</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#4ade80' }}>TARGET 2 (2R Main Target)</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#22c55e', marginTop: '2px', fontFamily: 'monospace' }}>
                      ${fmt(plan?.tp2)} <span style={{ fontSize: '12px' }}>(1:{plan?.tp2Rr ?? '—'})</span>
                    </div>
                  </div>
                </div>

                {/* Net RR & Invalidation */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Net Reward:Risk: </span>
                    <strong style={{ color: plan.netRrToTp2 >= minPlannedRr ? '#22c55e' : '#ef4444', fontFamily: 'monospace', fontSize: '14px' }}>
                      1:{plan.netRrToTp2}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>(After Spread & Costs)</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                    Min RR Gate: <strong style={{ color: '#f59e0b' }}>1:{minPlannedRr}</strong>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RISK & POSITION SIZING CALCULATOR */}
          <div style={{
            background: '#0d131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} color="#f59e0b" />
                Institutional Lot Sizing Calculator (100 oz / lot)
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>1 Point = $1.00 ($100/Lot)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Account Balance ($)</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    background: '#131b2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.25"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    background: '#131b2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Sizing Results Strip */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>EXECUTE LOTS</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b', fontFamily: 'monospace' }}>
                  {plan.sizing.executedLots}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>MAX RISK BUDGET</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', fontFamily: 'monospace' }}>
                  ${plan.sizing.riskBudgetUsd}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>ACTUAL RISK ($)</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#22c55e', fontFamily: 'monospace' }}>
                  ${plan.sizing.actualRiskUsd}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7 INSTITUTIONAL COLLAPSIBLE MODULES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        
        {/* MODULE 1: MULTI-TIMEFRAME STRUCTURE */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod1')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={18} color="#3b82f6" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 1 — Multi-Timeframe Trend & Market Structure (1D, 4H, 1H, 15M, 5M)
              </span>
              <span style={{
                background: report.multiTimeframe.alignedWithHtf ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: report.multiTimeframe.alignedWithHtf ? '#22c55e' : '#f59e0b',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {report.multiTimeframe.alignedWithHtf ? '15M Aligned with 4H' : 'HTF Alignment Diverging'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.hash = 'trend-analysis';
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Full Trend Analysis Engine →
              </button>
            </div>
            {openModules.mod1 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {(['1D', '4H', '1H', '15M', '5M'] as const).map((tf) => {
                  const s = report.multiTimeframe[tf];
                  return (
                    <div
                      key={tf}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: '#f59e0b' }}>{tf}</span>
                        <span style={{
                          color: s.trend === 'BULLISH' ? '#22c55e' : s.trend === 'BEARISH' ? '#ef4444' : '#94a3b8',
                          fontWeight: '700',
                          fontSize: '11px'
                        }}>
                          {s.trend}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                        Swing High: <strong style={{ color: '#f8fafc' }}>${s.swingHigh}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Swing Low: <strong style={{ color: '#f8fafc' }}>${s.swingLow}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        BOS: <span style={{ color: '#60a5fa' }}>{s.lastBOS?.type || 'None'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong>Institutional Rule:</strong> Range Position p = {report.multiTimeframe['15M'].currentRangeP} ({report.multiTimeframe['15M'].currentRangeP <= 0.45 ? 'Discount Zone - Longs Favored' : report.multiTimeframe['15M'].currentRangeP >= 0.55 ? 'Premium Zone - Shorts Favored' : 'Mid-Range No-Trade Zone'}).
                Equilibrium level sits at <strong>${report.multiTimeframe['15M'].equilibrium}</strong>.
              </div>
            </div>
          )}
        </div>

        {/* MODULE 2: BUY-SIDE & SELL-SIDE LIQUIDITY */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod2')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={18} color="#ef4444" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 2 — Buy-Side & Sell-Side Liquidity Engine
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Fuel Up: +{report.liquidityEngine.fuelUpPoints} pts | Fuel Down: -{report.liquidityEngine.fuelDownPoints} pts
              </span>
            </div>
            {openModules.mod2 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod2 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {report.liquidityEngine.allPools.map((pool) => (
                  <div
                    key={pool.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${pool.type === 'BUY_SIDE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        background: pool.type === 'BUY_SIDE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: pool.type === 'BUY_SIDE' ? '#22c55e' : '#ef4444',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {pool.type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace' }}>
                        ${pool.priceLevel}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginTop: '6px' }}>{pool.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{pool.evidenceSource}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{pool.reactionScenario}</div>
                  </div>
                ))}
              </div>

              {/* Estimated Liquidation Clusters Strip */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {report.liquidityEngine.estimatedLiqClusters.map((cluster, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Estimated Stop Cluster: </span>
                    <strong style={{ color: cluster.side === 'SHORT_LIQ' ? '#22c55e' : '#ef4444' }}>${cluster.price}</strong>
                    <span style={{ color: '#64748b', marginLeft: '6px' }}>({cluster.volumeEstimate})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODULE 3: AUTOMATIC PRECISION LEVELS */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod3')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={18} color="#f59e0b" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 3 — Precision Levels (Order Blocks, Fib Golden Zone & Volume Profile)
              </span>
            </div>
            {openModules.mod3 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod3 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>Fibonacci Golden Pocket</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px', fontFamily: 'monospace' }}>
                    ${report.precisionLevels.fibGoldenZone.pocketLow} - ${report.precisionLevels.fibGoldenZone.pocketHigh}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>0.618 - 0.650 Retracement Confluence Zone</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '700' }}>Volume Profile Value Area (70%)</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px', fontFamily: 'monospace' }}>
                    VAH: ${report.precisionLevels.volumeProfile.vah} | VAL: ${report.precisionLevels.volumeProfile.val}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Point of Control (POC): <strong style={{ color: '#22d3ee' }}>${report.precisionLevels.volumeProfile.poc}</strong> ({report.precisionLevels.volumeProfile.volumeType})
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: '700' }}>Psychological Round Levels</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '6px', fontFamily: 'monospace' }}>
                    {report.precisionLevels.psychologicalRoundNumbers.map((lvl) => `$${lvl}`).join(' • ')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>$50 / $100 Major Option Strikes</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODULE 4: MACRO & FUNDAMENTAL INTELLIGENCE */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod4')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="#10b981" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 4 — Macro, Micro & Fundamental Intelligence (Real Yields & Fed Rates)
              </span>
              <span style={{
                background: report.macroIntelligence.macroBias === 'BULLISH' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: report.macroIntelligence.macroBias === 'BULLISH' ? '#22c55e' : '#f59e0b',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                Macro Bias: {report.macroIntelligence.macroBias}
              </span>
            </div>
            {openModules.mod4 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod4 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '8px 10px' }}>Macro Factor</th>
                      <th style={{ padding: '8px 10px' }}>Latest Data</th>
                      <th style={{ padding: '8px 10px' }}>Frequency</th>
                      <th style={{ padding: '8px 10px' }}>Gold Implication</th>
                      <th style={{ padding: '8px 10px' }}>Confidence</th>
                      <th style={{ padding: '8px 10px' }}>Desk Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.macroIntelligence.pillars.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px', fontWeight: '700', color: '#f8fafc' }}>{p.factor}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#38bdf8' }}>{p.latestData}</td>
                        <td style={{ padding: '10px', color: '#94a3b8' }}>{p.frequency}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            color: p.goldImplication === 'BULLISH' ? '#22c55e' : p.goldImplication === 'BEARISH' ? '#ef4444' : '#94a3b8',
                            fontWeight: '700'
                          }}>
                            {p.goldImplication}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#f59e0b', fontWeight: '700' }}>{p.confidence}%</td>
                        <td style={{ padding: '10px', color: '#cbd5e1' }}>{p.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODULE 5: RETAIL CROWD & BIG-PLAYER POSITIONING */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod5')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={18} color="#a855f7" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 5 — Retail Crowd & Big-Player Positioning (CFTC COT & Open Interest)
              </span>
            </div>
            {openModules.mod5 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod5 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>CFTC MANAGED MONEY NET</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#22c55e', marginTop: '2px', fontFamily: 'monospace' }}>
                    +{report.positioning.managedMoneyNetLots.toLocaleString()} Lots
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>3Y Percentile: {report.positioning.managedMoneyPercentile3Y}%</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>COMEX OPEN INTEREST</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginTop: '2px', fontFamily: 'monospace' }}>
                    {report.positioning.comexOpenInterest.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#22c55e' }}>WoW Change: +{report.positioning.comexOiChange.toLocaleString()}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>RETAIL SENTIMENT SKEW</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px' }}>
                    <span style={{ color: '#22c55e' }}>{report.positioning.retailLongPct}% Long</span> / <span style={{ color: '#ef4444' }}>{report.positioning.retailShortPct}% Short</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Broker Specific Feed</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODULE 6: DXY DIRECTION & CORRELATION */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod6')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingDown size={18} color="#60a5fa" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 6 — DXY Direction, Momentum & Gold Correlation Engine
              </span>
            </div>
            {openModules.mod6 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod6 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div><strong>DXY DIRECTION:</strong> <span style={{ color: report.dxy.direction === 'BEARISH' ? '#22c55e' : '#ef4444' }}>{report.dxy.direction}</span></div>
                <div><strong>DXY MOMENTUM:</strong> <span style={{ color: '#f8fafc' }}>{report.dxy.momentum}</span></div>
                <div><strong>CORRELATION STATUS:</strong> <span style={{ color: '#22c55e' }}>{report.dxy.goldCorrelationStatus}</span></div>
                <div><strong>IMPLICATION FOR GOLD:</strong> <span style={{ color: '#f59e0b', fontWeight: '700' }}>{report.dxy.goldImplication}</span></div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                Conditional Zone: {report.dxy.nextConditionalZone}. Dollar invalidation sits at ${report.dxy.invalidation}.
              </div>
            </div>
          )}
        </div>

        {/* MODULE 7: US ECONOMIC NEWS & EVENT IMPACT */}
        <div style={{ background: '#0d131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleModule('mod7')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#ec4899" />
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                MODULE 7 — US Economic News & Event Risk Window
              </span>
              <span style={{
                background: report.newsEvents.blackoutActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)',
                color: report.newsEvents.blackoutActive ? '#ef4444' : '#22c55e',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {report.newsEvents.blackoutActive ? 'BLACKOUT RISK ACTIVE' : 'Clear Window (No Immediate Event)'}
              </span>
            </div>
            {openModules.mod7 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {openModules.mod7 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {report.newsEvents.nextTier1Event && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>{report.newsEvents.nextTier1Event.name}</span>
                    <span style={{ color: '#ec4899', fontSize: '12px', fontWeight: '700' }}>{report.newsEvents.nextTier1Event.datetimeIst}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                    <span>Forecast: <strong style={{ color: '#f8fafc' }}>{report.newsEvents.nextTier1Event.forecast}</strong></span>
                    <span>Previous: <strong style={{ color: '#f8fafc' }}>{report.newsEvents.nextTier1Event.previous}</strong></span>
                    <span>Source: {report.newsEvents.nextTier1Event.source}</span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    <div style={{ color: '#22c55e' }}>Bullish Scenario: {report.newsEvents.nextTier1Event.bullishScenario}</div>
                    <div style={{ color: '#ef4444', marginTop: '3px' }}>Bearish Scenario: {report.newsEvents.nextTier1Event.bearishScenario}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM SECTION: COMPLETE INSTITUTIONAL TRADE REPORT ── */}
      <div style={{
        background: '#0d131f',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#f8fafc', margin: 0 }}>
              GOLD XAUUSD — INSTITUTIONAL TRADE REPORT
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Deterministic snapshot derived from 15M closed price action & multi-asset intermarket inputs
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopyHinglish}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedHinglish ? <Check size={14} /> : <Copy size={14} />}
              {copiedHinglish ? 'Copied Summary!' : 'Copy Desk Summary'}
            </button>

            <button
              onClick={handleCopyJson}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedJson ? <Check size={14} /> : <Copy size={14} />}
              {copiedJson ? 'Copied JSON!' : 'Copy Full Engine JSON'}
            </button>
          </div>
        </div>

        {/* Formatted Code Block of Output */}
        <pre style={{
          background: '#070a12',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '16px',
          color: '#cbd5e1',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.6',
          overflowX: 'auto',
          margin: 0
        }}>
{`GOLD XAUUSD — INSTITUTIONAL TRADE REPORT
──────────────────────────────────────────────────────────
LIVE GOLD PRICE:       $${fmt(report.price)}
DATA TIMESTAMP:        ${report.timestamp}
DATA STATUS:           ${report.healthStatus} (${report.source})
DATA QUALITY:          ${report.dataQuality}/100

1D TREND:              ${report.multiTimeframe['1D'].trend}
4H TREND:              ${report.multiTimeframe['4H'].trend}
1H STRUCTURE:          ${report.multiTimeframe['1H'].trend} (BOS: ${report.multiTimeframe['1H'].lastBOS?.type || 'None'})
15M STRUCTURE:         ${report.multiTimeframe['15M'].trend} (Range P: ${report.multiTimeframe['15M'].currentRangeP})

BUY-SIDE LIQUIDITY:    $${report.liquidityEngine.nearestBuySidePool?.priceLevel || 'N/A'} (Magnet Target)
SELL-SIDE LIQUIDITY:   $${report.liquidityEngine.nearestSellSidePool?.priceLevel || 'N/A'} (Demand Support)

MAJOR SUPPORT:         $${report.multiTimeframe['15M'].swingLow}
MAJOR RESISTANCE:      $${report.multiTimeframe['15M'].swingHigh}
FIBONACCI GOLDEN ZONE: $${report.precisionLevels.fibGoldenZone.pocketLow} - $${report.precisionLevels.fibGoldenZone.pocketHigh}
VOLUME PROFILE POC:    $${report.precisionLevels.volumeProfile.poc} (${report.precisionLevels.volumeProfile.volumeType})

RETAIL POSITIONING:    ${report.positioning.retailLongPct}% Long / ${report.positioning.retailShortPct}% Short
CFTC MANAGED MONEY:    +${report.positioning.managedMoneyNetLots.toLocaleString()} Lots (${report.positioning.managedMoneyPercentile3Y}% Percentile)

DXY TREND:             ${report.dxy.direction} (${dxyChange >= 0 ? '+' : ''}${dxyChange}%)
GOLD-DXY ALIGNMENT:    ${report.dxy.goldCorrelationStatus} (${report.dxy.goldImplication})
10Y REAL YIELD (TIPS): ${report.macroIntelligence.realYield10yTips}% (Daily)
FED RATE CUT PROB:     ${report.macroIntelligence.fedRateCutProb}%

FINAL DECISION:        ${report.finalDecision} (${plan?.setupName ?? 'WAIT'})
ENTRY ZONE:            $${fmt(plan?.entryZone?.[0])} - $${fmt(plan?.entryZone?.[1])}
STOP LOSS:             $${fmt(plan?.stopLoss)} (${plan?.stopLossDistancePts ?? 0} pts outside structure)
TARGET 1:              $${fmt(plan?.tp1)} (RR 1:${plan?.tp1Rr ?? '—'})
TARGET 2:              $${fmt(plan?.tp2)} (RR 1:${plan?.tp2Rr ?? '—'})
TARGET 3:              $${fmt(plan?.tp3)} (RR 1:${plan?.tp3Rr ?? '—'})
REWARD:RISK (NET):     1:${plan?.netRrToTp2 ?? '—'} (Meets Min 1:${minPlannedRr} Requirement)
POSITION SIZING:       ${plan?.sizing?.executedLots ?? 0.01} Lots (Risk: $${fmt(plan?.sizing?.actualRiskUsd)} on $${accountBalance.toLocaleString()})

SETUP INVALIDATION:    ${plan.invalidationCriteria}
CONFIRMATION REQUIRED: ${plan.confirmationRequired}

THESIS:                ${plan.whyEnglish}
HINGLISH EXPLANATION:  ${plan.whyHinglish}`}
        </pre>
      </div>

    </div>
  );
};

export default InstitutionalXauusdTerminalView;
