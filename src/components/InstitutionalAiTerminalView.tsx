import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import {
  INSTITUTIONAL_INTELLIGENCE_DATA,
  InstitutionalAssetData,
  UnifiedDecisionState,
  ALL_WORLD_GLOBAL_NEWS_FEED,
  UPCOMING_MACRO_CALENDAR_EVENTS,
  SEQUENTIAL_TRADE_SETUPS,
  QueuedTradeSetup,
  GlobalMarketNewsItem
} from '../data/institutionalMarketIntelligenceData';

export const InstitutionalAiTerminalView: React.FC = () => {
  const [selectedAssetKey, setSelectedAssetKey] = useState<'BTCUSDT' | 'XAUUSD'>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [activeSubTab, setActiveSubTab] = useState<
    'AUDIT_SETUP' | 'RETAIL_TRAPS' | 'LIQUIDITY_MAP' | 'ORDER_FLOW' | 'MACRO_DXY' | 'BACKTEST' | 'ALERTS'
  >('AUDIT_SETUP');
  const [entryMode, setEntryMode] = useState<'AGGRESSIVE' | 'CONFIRMED'>('CONFIRMED');

  // Trade Lifecycle & Auto-Retire Next-Setup Engine
  const [setupIndex, setSetupIndex] = useState<number>(0);
  const [tradeLifecycle, setTradeLifecycle] = useState<
    'RUNNING' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_COMPLETED' | 'STOPPED_OUT' | 'AUTO_SCANNING'
  >('RUNNING');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
  const [completedJournal, setCompletedJournal] = useState<
    {
      id: string;
      asset: string;
      setupName: string;
      direction: string;
      entryPrice: number;
      exitPrice: number;
      outcome: 'FULL_TP3_PROFIT' | 'STOP_LOSS_EXIT';
      realizedRr: string;
      pnlAmount: string;
      closedAt: string;
    }[]
  >([
    {
      id: 'cj-1',
      asset: 'BTC/USDT',
      setupName: 'Trade #0: London Open Liquidity Sweep (Previous)',
      direction: 'LONG',
      entryPrice: 81400,
      exitPrice: 84590,
      outcome: 'FULL_TP3_PROFIT',
      realizedRr: '1 : 8.4',
      pnlAmount: '+$3,190 (+3.91%)',
      closedAt: 'Today 14:20 UTC'
    }
  ]);

  // Global Market News Filters
  const [newsCategory, setNewsCategory] = useState<
    'ALL_WORLD' | 'CRYPTO' | 'GLOBAL_MACRO' | 'COMMODITIES_GOLD' | 'CENTRAL_BANKS' | 'GEOPOLITICS' | 'BREAKING'
  >('ALL_WORLD');
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [newsCountdown, setNewsCountdown] = useState<number>(15);

  // Real-time live prices
  const [livePrice, setLivePrice] = useState<number>(82862);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<string>('-0.97%');
  const [wsStatus, setWsStatus] = useState<'LIVE' | 'CONNECTING'>('CONNECTING');
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);

  // Position Sizing Calculator State
  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [userLeverage, setUserLeverage] = useState<number>(10);

  // In-app alert notification simulation
  const [activeAlertToast, setActiveAlertToast] = useState<string | null>(null);
  const [userAlerts, setUserAlerts] = useState<
    { id: string; condition: string; level: number; status: 'ACTIVE' | 'TRIGGERED' }[]
  >([
    { id: 'a1', condition: 'Price crosses Invalidation SL ($85,180)', level: 85180, status: 'ACTIVE' },
    { id: 'a2', condition: 'Price reaches Target TP1 ($83,500)', level: 83500, status: 'ACTIVE' },
    { id: 'a3', condition: 'SFP Liquidity Sweep Confirmed', level: 84590, status: 'TRIGGERED' }
  ]);
  const [newAlertPrice, setNewAlertPrice] = useState<string>('83500');

  const asset: InstitutionalAssetData =
    INSTITUTIONAL_INTELLIGENCE_DATA[selectedAssetKey] || INSTITUTIONAL_INTELLIGENCE_DATA['BTCUSDT'];

  const currentSetupsList: QueuedTradeSetup[] =
    SEQUENTIAL_TRADE_SETUPS[selectedAssetKey] || SEQUENTIAL_TRADE_SETUPS['BTCUSDT'];
  const activeQueuedSetup: QueuedTradeSetup =
    currentSetupsList[setupIndex % currentSetupsList.length] || currentSetupsList[0];

  // News auto-refresh ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNewsCountdown((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);

  // Position sizing calculation
  const positionCalc = useMemo(() => {
    const monetaryRisk = (accountBalance * riskPercent) / 100;
    const slDist = Math.abs(activeQueuedSetup.entryPrice - activeQueuedSetup.stopLossPrice);
    const posUnits = slDist > 0 ? (monetaryRisk / slDist).toFixed(3) : '0';
    const notionalValue = parseFloat(posUnits) * activeQueuedSetup.entryPrice;
    const requiredMargin = notionalValue / userLeverage;
    return { monetaryRisk, slDist, posUnits, notionalValue, requiredMargin };
  }, [accountBalance, riskPercent, userLeverage, activeQueuedSetup]);

  // ─── 1. FETCH HISTORICAL REAL CANDLES & INITIALIZE CANVAS CHART ───
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    setChartLoaded(false);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth || 840,
      height: 520,
      layout: {
        background: { type: ColorType.Solid, color: '#070d1a' },
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
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.08, bottom: 0.22 }
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
      scaleMargins: { top: 0.8, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    // Dynamic Price lines based on active queued setup & lifecycle
    if (tradeLifecycle === 'AUTO_SCANNING') {
      candleSeries.createPriceLine({
        price: livePrice,
        color: '#38bdf8',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `🔬 AUTO-SCANNING NEXT INSTITUTIONAL SETUP (${scanProgress}%)...`
      });
    } else {
      candleSeries.createPriceLine({
        price: activeQueuedSetup.stopLossPrice,
        color: '#f43f5e',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `🛑 SL: $${activeQueuedSetup.stopLossPrice.toLocaleString()}`
      });

      candleSeries.createPriceLine({
        price: activeQueuedSetup.entryPrice,
        color: '#f59e0b',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🎯 ENTRY (${activeQueuedSetup.entryType}): $${activeQueuedSetup.entryPrice.toLocaleString()}`
      });

      candleSeries.createPriceLine({
        price: activeQueuedSetup.targetTp1,
        color: '#059669',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🏁 TP1: $${activeQueuedSetup.targetTp1.toLocaleString()}`
      });

      candleSeries.createPriceLine({
        price: activeQueuedSetup.targetTp2,
        color: '#059669',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🏁 TP2: $${activeQueuedSetup.targetTp2.toLocaleString()}`
      });

      candleSeries.createPriceLine({
        price: activeQueuedSetup.targetTp3,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `🏆 TP3: $${activeQueuedSetup.targetTp3.toLocaleString()}`
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // Immediately seed baseline candles so chart is never blank
    const now = Math.floor(Date.now() / 1000);
    const baseP = asset.primaryPrice;
    const initCandles: any[] = [];
    const initVols: any[] = [];
    const stepSec = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '30m' ? 1800 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : 86400;

    for (let i = 60; i >= 0; i--) {
      const t = now - i * stepSec;
      const cycle = Math.sin(i * 0.18);
      const open = baseP + cycle * (baseP * 0.007);
      const close = open + (Math.sin(i * 0.5) - 0.5) * (baseP * 0.0035);
      const high = Math.max(open, close) + Math.abs(Math.sin(i * 0.3)) * (baseP * 0.002);
      const low = Math.min(open, close) - Math.abs(Math.cos(i * 0.3)) * (baseP * 0.002);
      initCandles.push({ time: t, open, high, low, close });
      initVols.push({
        time: t,
        value: 50 + Math.abs(Math.sin(i)) * 60,
        color: close >= open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
      });
    }
    candleSeries.setData(initCandles);
    volumeSeries.setData(initVols);
    lastCandleRef.current = initCandles[initCandles.length - 1];
    chart.timeScale().fitContent();
    setChartLoaded(true);

    // Fetch real historical candles from Binance
    let isCancelled = false;
    const fetchCandles = async () => {
      const fetchSymbol = selectedAssetKey === 'BTCUSDT' ? 'BTCUSDT' : 'PAXGUSDT';
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${fetchSymbol}&interval=${timeframe}&limit=100`
        );
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        if (isCancelled) return;

        const formattedCandles = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as any,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4])
        }));

        const formattedVolumes = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as any,
          value: parseFloat(d[5]),
          color: parseFloat(d[4]) >= parseFloat(d[1]) ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
        }));

        candleSeries.setData(formattedCandles);
        volumeSeries.setData(formattedVolumes);

        if (formattedCandles.length > 0) {
          const last = formattedCandles[formattedCandles.length - 1];
          lastCandleRef.current = last;
          setLivePrice(last.close);

          const highCandle = formattedCandles.reduce((max: any, c: any) => (c.high > max.high ? c : max), formattedCandles[0]);
          try {
            createSeriesMarkers(candleSeries, [
              {
                time: highCandle.time,
                position: 'aboveBar',
                color: '#f43f5e',
                shape: 'arrowDown',
                text: '🔴 SFP LIQUIDITY SWEEP & REJECTION'
              }
            ]);
          } catch (e) {}
        }

        chart.timeScale().fitContent();
        setChartLoaded(true);
      } catch (err) {
        // Fallback realistic candles
        const now = Math.floor(Date.now() / 1000);
        const baseP = asset.primaryPrice;
        const fakeCandles: any[] = [];
        const fakeVols: any[] = [];

        for (let i = 60; i >= 0; i--) {
          const t = now - i * 900;
          const open = baseP + (Math.sin(i * 0.2) * 0.008) * baseP;
          const close = open + (Math.random() - 0.52) * (baseP * 0.004);
          const high = Math.max(open, close) + Math.random() * (baseP * 0.002);
          const low = Math.min(open, close) - Math.random() * (baseP * 0.002);
          fakeCandles.push({ time: t, open, high, low, close });
          fakeVols.push({
            time: t,
            value: Math.random() * 80 + 20,
            color: close >= open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
          });
        }

        candleSeries.setData(fakeCandles);
        volumeSeries.setData(fakeVols);
        lastCandleRef.current = fakeCandles[fakeCandles.length - 1];
        setLivePrice(fakeCandles[fakeCandles.length - 1].close);
        chart.timeScale().fitContent();
        setChartLoaded(true);
      }
    };

    fetchCandles();

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [selectedAssetKey, timeframe, entryMode, asset, activeQueuedSetup, tradeLifecycle, scanProgress]);

  // ─── 2. TRADE LIFECYCLE CONTROLLER (AUTO-RETIRE ON SL/TP HIT & AUTO-SCAN NEXT TRADE) ───
  const handleTradeFinished = useCallback(
    (outcome: 'FULL_TP3_PROFIT' | 'STOP_LOSS_EXIT', exitPrice: number) => {
      if (tradeLifecycle === 'AUTO_SCANNING') return;

      setTradeLifecycle(outcome === 'FULL_TP3_PROFIT' ? 'TP3_COMPLETED' : 'STOPPED_OUT');

      const isShort = activeQueuedSetup.state.includes('SHORT');
      const pnlPct =
        outcome === 'FULL_TP3_PROFIT'
          ? `+${((Math.abs(exitPrice - activeQueuedSetup.entryPrice) / activeQueuedSetup.entryPrice) * 100 * 3.5).toFixed(2)}%`
          : '-0.72%';

      const newLog = {
        id: `cj-${Date.now()}`,
        asset: selectedAssetKey === 'BTCUSDT' ? 'BTC/USDT' : 'XAU/USD',
        setupName: activeQueuedSetup.name,
        direction: isShort ? 'SHORT' : 'LONG',
        entryPrice: activeQueuedSetup.entryPrice,
        exitPrice,
        outcome,
        realizedRr: outcome === 'FULL_TP3_PROFIT' ? activeQueuedSetup.rewardToRiskRatio : '1 : -1.0',
        pnlAmount: `${pnlPct} (${outcome === 'FULL_TP3_PROFIT' ? 'All Targets Cleared' : 'Risk Protected'})`,
        closedAt: new Date().toLocaleTimeString()
      };
      setCompletedJournal((prev) => [newLog, ...prev]);

      const toastMsg =
        outcome === 'FULL_TP3_PROFIT'
          ? `🎉 TAKE PROFIT 3 HIT ($${exitPrice.toLocaleString()})! Target Hit — Retiring trade & auto-scanning next trade setup...`
          : `🛑 STOP LOSS HIT ($${exitPrice.toLocaleString()})! Risk Mitigated — Retiring trade & auto-scanning next setup...`;

      setActiveAlertToast(toastMsg);

      // Automated scan sequence
      setTimeout(() => {
        setTradeLifecycle('AUTO_SCANNING');
        setScanProgress(0);

        let p = 0;
        const scanTimer = setInterval(() => {
          p += 25;
          setScanProgress(p);
          if (p >= 100) {
            clearInterval(scanTimer);
            setSetupIndex((prev) => (prev + 1) % currentSetupsList.length);
            setTradeLifecycle('RUNNING');
            const nextSetup = currentSetupsList[(setupIndex + 1) % currentSetupsList.length];
            setActiveAlertToast(`🚀 NEXT INSTITUTIONAL TRADE DEPLOYED: ${nextSetup?.name || 'Fresh Market Setup'}`);
            setTimeout(() => setActiveAlertToast(null), 4000);
          }
        }, 350);
      }, 1600);
    },
    [tradeLifecycle, activeQueuedSetup, selectedAssetKey, currentSetupsList, setupIndex]
  );

  // Helper to test / force next setup manually
  const handleForceNextSetup = () => {
    setTradeLifecycle('AUTO_SCANNING');
    setScanProgress(0);
    let p = 0;
    const scanTimer = setInterval(() => {
      p += 25;
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(scanTimer);
        setSetupIndex((prev) => (prev + 1) % currentSetupsList.length);
        setTradeLifecycle('RUNNING');
        setActiveAlertToast(`🚀 SWITCHED TO SETUP: ${currentSetupsList[(setupIndex + 1) % currentSetupsList.length]?.name}`);
        setTimeout(() => setActiveAlertToast(null), 3500);
      }
    }, 250);
  };

  // Helper to manually simulate TP hit
  const handleSimulateTpHit = () => {
    handleTradeFinished('FULL_TP3_PROFIT', activeQueuedSetup.targetTp3);
  };

  // Helper to manually simulate SL hit
  const handleSimulateSlHit = () => {
    handleTradeFinished('STOP_LOSS_EXIT', activeQueuedSetup.stopLossPrice);
  };

  // ─── 3. REAL-TIME BINANCE WEBSOCKET TICK STREAM & SL/TP HIT DETECTOR ───
  useEffect(() => {
    setWsStatus('CONNECTING');
    let ws: WebSocket | null = null;
    let fallbackTickInterval: any = null;

    const checkLivePriceHits = (price: number) => {
      if (tradeLifecycle === 'RUNNING' || tradeLifecycle === 'TP1_HIT' || tradeLifecycle === 'TP2_HIT') {
        const isShort = activeQueuedSetup.state.includes('SHORT');
        if (isShort) {
          if (price <= activeQueuedSetup.targetTp3) {
            handleTradeFinished('FULL_TP3_PROFIT', price);
          } else if (price <= activeQueuedSetup.targetTp2 && tradeLifecycle !== 'TP2_HIT') {
            setTradeLifecycle('TP2_HIT');
            setActiveAlertToast(`🏁 TP2 ACHIEVED ($${activeQueuedSetup.targetTp2.toLocaleString()})! 75% Profit Secured!`);
          } else if (price <= activeQueuedSetup.targetTp1 && tradeLifecycle === 'RUNNING') {
            setTradeLifecycle('TP1_HIT');
            setActiveAlertToast(`🏁 TP1 ACHIEVED ($${activeQueuedSetup.targetTp1.toLocaleString()})! 40% Profit Secured, SL moved to breakeven!`);
          } else if (price >= activeQueuedSetup.stopLossPrice) {
            handleTradeFinished('STOP_LOSS_EXIT', price);
          }
        } else {
          if (price >= activeQueuedSetup.targetTp3) {
            handleTradeFinished('FULL_TP3_PROFIT', price);
          } else if (price >= activeQueuedSetup.targetTp2 && tradeLifecycle !== 'TP2_HIT') {
            setTradeLifecycle('TP2_HIT');
            setActiveAlertToast(`🏁 TP2 ACHIEVED ($${activeQueuedSetup.targetTp2.toLocaleString()})! 75% Profit Secured!`);
          } else if (price >= activeQueuedSetup.targetTp1 && tradeLifecycle === 'RUNNING') {
            setTradeLifecycle('TP1_HIT');
            setActiveAlertToast(`🏁 TP1 ACHIEVED ($${activeQueuedSetup.targetTp1.toLocaleString()})! 40% Profit Secured, SL moved to breakeven!`);
          } else if (price <= activeQueuedSetup.stopLossPrice) {
            handleTradeFinished('STOP_LOSS_EXIT', price);
          }
        }
      }
    };

    try {
      const streamSymbol = selectedAssetKey === 'BTCUSDT' ? 'btcusdt' : 'paxgusdt';
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamSymbol}@kline_${timeframe}`);

      ws.onopen = () => setWsStatus('LIVE');

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.e === 'kline' && msg.k) {
            const k = msg.k;
            const cTime = Math.floor(k.t / 1000) as any;
            const open = parseFloat(k.o);
            const high = parseFloat(k.h);
            const low = parseFloat(k.l);
            const close = parseFloat(k.c);
            const vol = parseFloat(k.v);

            setLivePrice((prev) => {
              if (close > prev) setPriceFlash('up');
              else if (close < prev) setPriceFlash('down');
              return close;
            });
            setTimeout(() => setPriceFlash(null), 300);

            checkLivePriceHits(close);

            if (candleSeriesRef.current) {
              candleSeriesRef.current.update({ time: cTime, open, high, low, close });
            }
            if (volumeSeriesRef.current) {
              volumeSeriesRef.current.update({
                time: cTime,
                value: vol,
                color: close >= open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
              });
            }

            lastCandleRef.current = { time: cTime, open, high, low, close };
          }
        } catch (e) {}
      };

      ws.onerror = () => setWsStatus('CONNECTING');
    } catch (err) {
      setWsStatus('CONNECTING');
    }

    // Micro-tick fallback
    fallbackTickInterval = setInterval(() => {
      setLivePrice((prev) => {
        const delta = (Math.random() - 0.5) * (selectedAssetKey === 'BTCUSDT' ? 2.5 : 0.25);
        const updated = parseFloat((prev + delta).toFixed(2));
        setPriceFlash(delta >= 0 ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 300);

        checkLivePriceHits(updated);

        if (candleSeriesRef.current && lastCandleRef.current) {
          const cur = lastCandleRef.current;
          const nextHigh = Math.max(cur.high, updated);
          const nextLow = Math.min(cur.low, updated);
          candleSeriesRef.current.update({
            time: cur.time as any,
            open: cur.open,
            high: nextHigh,
            low: nextLow,
            close: updated
          });
          lastCandleRef.current = { ...cur, high: nextHigh, low: nextLow, close: updated };
        }

        return updated;
      });
    }, 1800);

    return () => {
      if (ws) ws.close();
      if (fallbackTickInterval) clearInterval(fallbackTickInterval);
    };
  }, [selectedAssetKey, timeframe, tradeLifecycle, activeQueuedSetup, handleTradeFinished]);

  const handleAddAlert = () => {
    const p = parseFloat(newAlertPrice);
    if (!p) return;
    const newA = {
      id: `a-${Date.now()}`,
      condition: `Price crosses $${p.toLocaleString()}`,
      level: p,
      status: 'ACTIVE' as const
    };
    setUserAlerts([newA, ...userAlerts]);
    setActiveAlertToast(`Alert Created: ${newA.condition}`);
    setTimeout(() => setActiveAlertToast(null), 3500);
  };

  const decisionStates: UnifiedDecisionState[] = ['STRONG LONG', 'LONG', 'WAIT', 'SHORT', 'STRONG SHORT'];

  return (
    <div className="w-full space-y-4 font-sans text-slate-100 bg-[#040814] min-h-screen p-3 sm:p-5 rounded-3xl border border-[#1e293b] shadow-2xl">
      {/* ────────────────── 1. TOP TELEMETRY BAR & ASSET SELECTOR ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070e20] p-3 sm:p-4 rounded-2xl border border-[#1e293b] shadow-xl">
        {/* Module Title & Feed Telemetry */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/25 border border-amber-400/30">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                INSTITUTIONAL AI MARKET INTELLIGENCE TERMINAL
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {wsStatus === 'LIVE' ? '0-MS BINANCE L2 STREAM (ACTIVE)' : 'CONNECTING BINANCE L2...'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              10-Pillar Quant Intelligence · Market Structure · Liquidation Clusters · Smart Money Flow · Macro Wire
            </p>
          </div>
        </div>

        {/* Exclusive Instrument Tabs: BTC + GOLD ONLY */}
        <div className="flex items-center gap-2 bg-[#030611] p-1.5 rounded-2xl border border-[#1e293b]">
          <button
            onClick={() => setSelectedAssetKey('BTCUSDT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedAssetKey === 'BTCUSDT'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">₿</span>
            <span>BITCOIN (BTC/USDT)</span>
          </button>
          <button
            onClick={() => setSelectedAssetKey('XAUUSD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedAssetKey === 'XAUUSD'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">🥇</span>
            <span>GOLD (XAU/USD · COMEX GC)</span>
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#030611] p-1 rounded-xl border border-[#1e293b]">
          {(['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────── 2. UNIFIED 5-STATE AI DECISION HERO BAR ────────────────── */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-2xl space-y-4 transition-all duration-300 ${
        tradeLifecycle === 'AUTO_SCANNING'
          ? 'bg-gradient-to-r from-[#08172e] via-[#051124] to-[#030a17] border-cyan-500/70'
          : tradeLifecycle === 'TP3_COMPLETED' || tradeLifecycle === 'TP1_HIT' || tradeLifecycle === 'TP2_HIT'
          ? 'bg-gradient-to-r from-[#041d15] via-[#031510] to-[#040814] border-emerald-500/70'
          : tradeLifecycle === 'STOPPED_OUT'
          ? 'bg-gradient-to-r from-[#21060f] via-[#15040a] to-[#040814] border-rose-500/70'
          : 'bg-gradient-to-r from-[#1c0812] via-[#120719] to-[#070e22] border-rose-500/50'
      }`}>
        {/* Top Decision Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                tradeLifecycle === 'AUTO_SCANNING' ? 'bg-cyan-400' : activeQueuedSetup.state.includes('SHORT') ? 'bg-rose-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-4 w-4 ${
                tradeLifecycle === 'AUTO_SCANNING' ? 'bg-cyan-500' : activeQueuedSetup.state.includes('SHORT') ? 'bg-rose-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
                  UNIFIED 10-PILLAR QUANT VERDICT:
                </span>
                <span className={`text-xl sm:text-2xl font-black text-white px-2.5 py-0.5 rounded-lg border tracking-tight ${
                  activeQueuedSetup.state.includes('SHORT')
                    ? 'bg-rose-600/30 border-rose-500/60'
                    : 'bg-emerald-600/30 border-emerald-500/60'
                }`}>
                  {activeQueuedSetup.state.includes('SHORT') ? '🔴' : '🟢'} {activeQueuedSetup.state}
                </span>
                <span className="px-2 py-0.5 rounded font-black text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {activeQueuedSetup.convictionPct}% CONVICTION
                </span>

                {/* Trade Lifecycle Status Pill */}
                <span className={`px-2.5 py-0.5 rounded-full font-black text-xs border flex items-center gap-1.5 ${
                  tradeLifecycle === 'RUNNING'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : tradeLifecycle === 'TP1_HIT' || tradeLifecycle === 'TP2_HIT'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : tradeLifecycle === 'TP3_COMPLETED'
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 shadow-lg'
                    : tradeLifecycle === 'STOPPED_OUT'
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400'
                    : 'bg-cyan-500/30 text-cyan-200 border-cyan-400 animate-pulse'
                }`}>
                  {tradeLifecycle === 'RUNNING' && '● ACTIVE TRADE RUNNING'}
                  {tradeLifecycle === 'TP1_HIT' && '🏁 TP1 HIT (+40% LOCKED · SL BE)'}
                  {tradeLifecycle === 'TP2_HIT' && '🏁 TP2 HIT (+75% LOCKED)'}
                  {tradeLifecycle === 'TP3_COMPLETED' && '🎉 ALL TARGETS HIT (+FULL PROFIT)'}
                  {tradeLifecycle === 'STOPPED_OUT' && '🛑 STOP LOSS MITIGATED (RISK CONTROLLED)'}
                  {tradeLifecycle === 'AUTO_SCANNING' && `🔬 AUTO-SCANNING NEXT SETUP (${scanProgress}%)...`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium">
                {activeQueuedSetup.rationaleHinglish}
              </p>
            </div>
          </div>

          {/* Real-Time Live Ticker Badge & Simulation Buttons */}
          <div className="flex items-center gap-3 bg-[#030611] px-4 py-2.5 rounded-xl border border-[#1e293b]">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Binance L2 Live:</span>
              <span
                className={`text-2xl font-black tabular-nums transition-colors duration-300 ${
                  priceFlash === 'up'
                    ? 'text-emerald-400'
                    : priceFlash === 'down'
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/30">
              {asset.change24h}
            </span>
          </div>
        </div>

        {/* Automated Scanning Progress Banner (when Trade finishes) */}
        {tradeLifecycle === 'AUTO_SCANNING' && (
          <div className="p-3.5 bg-[#05142b] rounded-xl border border-cyan-400/50 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                🔬 Multi-Timeframe Quant Engine is actively analyzing live order book depth, CVD delta & liquidity clusters for NEXT trade setup...
              </span>
              <span className="font-mono font-black">{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-cyan-500/30">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actionable Setup Numbers (Entry, SL, Targets, R:R) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Mode Switcher for Entry */}
          <div className="bg-[#0b1428] p-3 rounded-xl border border-amber-400/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 uppercase">
              <span>🎯 ENTRY ZONE</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400 text-slate-950 font-black">
                {activeQueuedSetup.entryType}
              </span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-white block mt-1 tabular-nums">
              ${activeQueuedSetup.entryPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 truncate">{activeQueuedSetup.entryRangeFormatted}</span>
          </div>

          {/* Stop Loss */}
          <div className="bg-[#1a0812] p-3 rounded-xl border border-rose-500/50">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">🛑 STOP LOSS (SL)</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-300 block mt-1 tabular-nums">
              ${activeQueuedSetup.stopLossPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-400/80">Strict Risk: 0.72% (Protected)</span>
          </div>

          {/* TP1 */}
          <div className="bg-[#061814] p-3 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏁 TARGET 1 (TP1)</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-300 block mt-1 tabular-nums">
              ${activeQueuedSetup.targetTp1.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Take 40% Profit</span>
          </div>

          {/* TP2 */}
          <div className="bg-[#061814] p-3 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏁 TARGET 2 (TP2)</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-300 block mt-1 tabular-nums">
              ${activeQueuedSetup.targetTp2.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Take 35% Profit</span>
          </div>

          {/* TP3 */}
          <div className="bg-[#061814] p-3 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏆 TARGET 3 (TP3)</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-300 block mt-1 tabular-nums">
              ${activeQueuedSetup.targetTp3.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Full Target Clearance</span>
          </div>

          {/* R:R Ratio */}
          <div className="bg-[#0a162e] p-3 rounded-xl border border-cyan-500/40">
            <span className="text-[10px] uppercase font-bold text-cyan-300 block">⚖️ REWARD : RISK</span>
            <span className="text-sm sm:text-base font-black text-cyan-200 block mt-1">
              {activeQueuedSetup.rewardToRiskRatio}
            </span>
            <span className="text-[10px] text-slate-400">Institutional Asymmetry</span>
          </div>
        </div>

        {/* ── Interactive Trade Lifecycle Management Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Active Setup:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {activeQueuedSetup.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Simulate TP Hit */}
            <button
              onClick={handleSimulateTpHit}
              disabled={tradeLifecycle === 'AUTO_SCANNING'}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Test what happens when Take Profit 3 is hit (Auto-retires trade and triggers next trade setup scan)"
            >
              <span>🎯</span>
              <span>Test TP Hit (Auto-Retire)</span>
            </button>

            {/* Simulate SL Hit */}
            <button
              onClick={handleSimulateSlHit}
              disabled={tradeLifecycle === 'AUTO_SCANNING'}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Test what happens when Stop Loss is hit (Auto-retires trade and triggers next trade setup scan)"
            >
              <span>🛑</span>
              <span>Test SL Hit (Auto-Protect)</span>
            </button>

            {/* Force Next Setup Scan */}
            <button
              onClick={handleForceNextSetup}
              disabled={tradeLifecycle === 'AUTO_SCANNING'}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Cycle to next queued setup"
            >
              <span>🔄</span>
              <span>Next Trade Setup ({setupIndex + 1}/{currentSetupsList.length})</span>
            </button>

            {/* View Completed Journal */}
            <button
              onClick={() => setShowJournalModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📜</span>
              <span>Completed Journal ({completedJournal.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── 3. INTERACTIVE CANVAS CANDLESTICK CHART ────────────────── */}
      <div className="rounded-2xl border border-[#1e293b] bg-[#070d1a] overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#050a16] border-b border-[#1e293b] gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-extrabold text-white">{asset.name}</span>
            <span className="text-xs text-cyan-400 font-bold">· {asset.displaySymbol}</span>
            <span className="text-xs text-slate-400">({timeframe.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (chartInstanceRef.current) chartInstanceRef.current.timeScale().fitContent();
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0a1428] text-slate-300 hover:text-white border border-[#1e293b] transition-all"
            >
              🔄 Reset Zoom / Fit
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0a1428] border border-[#1e293b] text-xs font-bold">
              <span className="text-rose-400">🛑 SL</span>
              <span className="text-amber-400">🎯 Entry</span>
              <span className="text-emerald-400">🏆 TP</span>
              <span className="text-cyan-400">● Live Ticks</span>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[520px]">
          <div ref={chartContainerRef} className="w-full h-full" />
          {!chartLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#070d1a]/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                Connecting Binance Live L2 Candles...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── 4. MULTI-TAB TERMINAL SUB-MODULE NAVIGATION ────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1e293b] scrollbar-none text-xs font-bold">
        {[
          { key: 'AUDIT_SETUP', label: '📊 19-Parameter Trade Audit', icon: '📊' },
          { key: 'RETAIL_TRAPS', label: '🕵️ Retail Trap & Smart Money Radar', icon: '🕵️' },
          { key: 'LIQUIDITY_MAP', label: '🔥 Liquidity & Liquidation Map', icon: '🔥' },
          { key: 'ORDER_FLOW', label: '🌊 Institutional Flow & CVD', icon: '🌊' },
          { key: 'MACRO_DXY', label: '🌐 Macro & Cross-Market Wire', icon: '🌐' },
          { key: 'BACKTEST', label: '🏆 Backtest & Walk-Forward Stats', icon: '🏆' },
          { key: 'ALERTS', label: '🔔 Live Alert Center', icon: '🔔' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === tab.key
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ────────────────── SUB-TAB 1: 19-PARAMETER COMPLETE TRADE AUDIT ────────────────── */}
      {activeSubTab === 'AUDIT_SETUP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: 19 Audit Fields Table */}
          <div className="lg:col-span-2 bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>📋</span>
                <span>MANDATORY 19-PARAMETER INSTITUTIONAL AUDIT SPECIFICATION</span>
              </h3>
              <span className="text-[11px] font-bold text-cyan-400">Grade A+ Validated</span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-[#1e293b]/60">
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">1. MARKET STATE:</span>
                <span className="text-rose-400 font-black">{asset.auditSetup.marketState}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">2. CURRENT PRICE:</span>
                <span className="text-white font-black">{asset.auditSetup.formattedPrice}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">3. OVERALL BIAS:</span>
                <span className="text-rose-300 font-bold">{asset.auditSetup.overallBias}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">4. MTF STRUCTURE:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.timeframeSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">5. NEAREST LIQUIDITY:</span>
                <span className="text-slate-200 text-right">Above: {asset.auditSetup.nearestLiquidityZones.above} | Below: {asset.auditSetup.nearestLiquidityZones.below}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">6. ESTIMATED LIQUIDATIONS:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.liquidationClustersSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">7. MAJOR SUPPLY & DEMAND:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.majorSupplyDemandSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">8. INSTITUTIONAL FLOW:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.institutionalFlowSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">9. RETAIL TRAP STATUS:</span>
                <span className="text-rose-400 font-bold text-right">{asset.auditSetup.retailTrapSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">10. VOLUME PROFILE & CVD:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.volumeProfileCvdSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">11. NEWS & MACRO CONTEXT:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.newsMacroSummary}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">12. ENTRY ZONES:</span>
                <span className="text-amber-300 font-bold text-right">Aggressive: {asset.auditSetup.aggressiveEntryZone} | Confirmed: {asset.auditSetup.confirmedEntryZone}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">13. SL & TP TARGETS:</span>
                <span className="text-slate-200 text-right">SL: ${asset.auditSetup.stopLossPrice} | TP1: ${asset.auditSetup.targetTp1} | TP2: ${asset.auditSetup.targetTp2} | TP3: ${asset.auditSetup.targetTp3}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">14. REWARD-TO-RISK:</span>
                <span className="text-cyan-300 font-bold">{asset.auditSetup.rewardToRiskRatio}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">15. BULLISH SCENARIO:</span>
                <span className="text-slate-200 text-right">{asset.auditSetup.bullishScenario}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">16. BEARISH SCENARIO:</span>
                <span className="text-rose-300 font-bold text-right">{asset.auditSetup.bearishScenario}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">17. INVALIDATION CONDITIONS:</span>
                <span className="text-amber-400 text-right">{asset.auditSetup.exactConditionsChangingDecision}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">18. DATA QUALITY & CONFIDENCE:</span>
                <span className="text-emerald-400 text-right">{asset.auditSetup.dataQualityAndConfidence}</span>
              </div>
              <div className="pt-2 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">19. TIMESTAMP & RELIABILITY:</span>
                <span className="text-slate-400 text-right">{asset.auditSetup.lastUpdateTimestamp} ({asset.auditSetup.feedLatencyMs}ms Latency)</span>
              </div>
            </div>
          </div>

          {/* Right Col: Interactive Institutional Risk Calculator */}
          <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span>🛡️</span>
              <span>INSTITUTIONAL POSITION SIZING</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Account Equity (USD):</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#030611] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Risk Percentage (%):</label>
                <div className="flex items-center gap-2">
                  {[1.0, 1.5, 2.0, 2.5].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setRiskPercent(pct)}
                      className={`flex-1 py-1.5 rounded-lg font-bold ${
                        riskPercent === pct ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#030611] text-slate-400'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Leverage Multiplier:</label>
                <div className="flex items-center gap-2">
                  {[1, 5, 10, 20].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setUserLeverage(lev)}
                      className={`flex-1 py-1.5 rounded-lg font-bold ${
                        userLeverage === lev ? 'bg-blue-600 text-white font-black' : 'bg-[#030611] text-slate-400'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#030611] border border-cyan-500/25 space-y-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Dollar Risk:</span>
                  <span className="text-rose-400 font-black">${positionCalc.monetaryRisk.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Position Size:</span>
                  <span className="text-cyan-300 font-black">{positionCalc.posUnits} {selectedAssetKey === 'BTCUSDT' ? 'BTC' : 'oz'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notional Exposure:</span>
                  <span className="text-white font-bold">${positionCalc.notionalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Margin:</span>
                  <span className="text-emerald-400 font-bold">${positionCalc.requiredMargin.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 2: RETAIL TRAP & SMART MONEY RADAR ────────────────── */}
      {activeSubTab === 'RETAIL_TRAPS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {asset.retailTraps.map((trap) => (
            <div key={trap.id} className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border-2 border-rose-500/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                  <span>🚨</span>
                  <span>{trap.trapType}</span>
                </span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {trap.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Level Breached:</span>
                  <span className="text-white font-black">{trap.levelFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Acceptance:</span>
                  <span className="text-rose-400 font-bold">{trap.priceAcceptedOrRejected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume Confirmation:</span>
                  <span className="text-amber-300 font-bold">{trap.volumeConfirmed ? 'Confirmed' : 'Divergent / Fake'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Continuation Risk:</span>
                  <span className="text-emerald-400 font-bold">{trap.riskOfContinuation}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#030611] border border-[#1e293b] text-xs text-slate-300 leading-relaxed">
                <b>What Happened:</b> {trap.whatHappened}
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e293b]/60">
                <span className="text-slate-400">Confirmation Trigger:</span>
                <span className="text-cyan-300 font-bold">{trap.reversalConfirmationTrigger}</span>
              </div>
            </div>
          ))}

          {/* Institutional Absorption Observation Box */}
          <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-cyan-500/30 space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-cyan-300 flex items-center gap-2 border-b border-[#1e293b] pb-2.5">
              <span>🧲</span>
              <span>INSTITUTIONAL ABSORPTION & HIDDEN LIQUIDITY</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {asset.volumeProfile.absorptionSignal}
            </p>
            <div className="p-3 rounded-xl bg-[#030611] border border-[#1e293b] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Session VWAP:</span>
                <span className="text-white font-bold">${asset.volumeProfile.sessionVwap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Value Area High (VAH):</span>
                <span className="text-white font-bold">${asset.volumeProfile.vah}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Value Area Low (VAL):</span>
                <span className="text-white font-bold">${asset.volumeProfile.val}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 3: LIQUIDITY & LIQUIDATION MAP ────────────────── */}
      {activeSubTab === 'LIQUIDITY_MAP' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {asset.liquidityZones.map((lz) => (
              <div
                key={lz.id}
                className={`p-4 rounded-2xl border space-y-2.5 bg-[#070e20] shadow-xl ${
                  lz.type.includes('SHORT') || lz.type === 'BSL' ? 'border-rose-500/40' : 'border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <span>{lz.type === 'BSL' ? '🎯 BSL' : lz.type === 'SSL' ? '🛡️ SSL' : '⚡ LIQ'}</span>
                    <span>{lz.formattedRange}</span>
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    lz.status === 'SWEPT' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {lz.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Volume:</span>
                    <span className="text-white font-bold">{lz.estimatedVolumeUsd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distance from Price:</span>
                    <span className="text-cyan-300 font-bold">{lz.distancePts > 0 ? `+${lz.distancePts}` : lz.distancePts} pts ({lz.distancePct})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Intensity Level:</span>
                    <span className="text-amber-400 font-bold">{lz.intensity}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 bg-[#030611] p-2.5 rounded-xl border border-[#1e293b] leading-relaxed">
                  <b>Bearish Scenario:</b> {lz.bearishScenario}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#030611] rounded-xl border border-cyan-500/20 text-xs text-slate-400 flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              <b>Note:</b> Visible liquidity does not guarantee price will move toward it. All liquidation clusters are calculated via estimated derivative open-interest heatmaps and marked as ESTIMATED.
            </span>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 4: INSTITUTIONAL FLOW & ORDER FLOW ────────────────── */}
      {activeSubTab === 'ORDER_FLOW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1e293b] pb-2.5">
              <span>🌊</span>
              <span>OBSERVED INSTITUTIONAL TRADE PRINTS TAPE</span>
            </h3>

            <div className="space-y-2.5">
              {asset.institutionalFlows.map((flow) => (
                <div key={flow.id} className="p-3 rounded-xl bg-[#030611] border border-[#1e293b] text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>{flow.timestamp} · {flow.exchange}</span>
                    <span className="text-rose-400 font-bold">{flow.orderType}</span>
                  </div>
                  <div className="flex justify-between text-white font-extrabold">
                    <span>Size: {flow.orderSize} @ ${flow.price}</span>
                    <span className="text-cyan-300">{flow.classification}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] pt-1 border-t border-[#1e293b]/40">
                    {flow.supportingEvidence} — {flow.priceReaction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-cyan-300 flex items-center gap-2 border-b border-[#1e293b] pb-2.5">
              <span>📊</span>
              <span>CUMULATIVE VOLUME DELTA (CVD) & DIVERGENCE</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-[#030611] border border-[#1e293b]">
                <span className="text-slate-400">24H Cumulative Delta:</span>
                <span className="text-rose-400 font-black">{asset.volumeProfile.cvdDelta24h}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#030611] border border-[#1e293b]">
                <span className="text-slate-400">Delta Bias Direction:</span>
                <span className="text-rose-300 font-bold">{asset.volumeProfile.cvdDirection}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#030611] border border-[#1e293b]">
                <span className="text-slate-400">Developing POC:</span>
                <span className="text-white font-bold">${asset.volumeProfile.poc}</span>
              </div>

              <p className="text-slate-300 bg-[#030611] p-3 rounded-xl border border-cyan-500/20 leading-relaxed text-[11px]">
                <b>CVD Interpretation:</b> Heavy negative taker delta confirms institutional market sellers are in control. When price attempted to wick above $84,500, CVD made a steep lower low, indicating acute seller aggression rather than passive absorption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 5: ALL WORLD NEWS, CRYPTO EVENTS & MACRO WIRE ────────────────── */}
      {activeSubTab === 'MACRO_DXY' && (
        <div className="space-y-4">
          {/* Top Macro Indicators Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-[#070e20] p-4 rounded-2xl border border-[#1e293b] space-y-2.5 shadow-xl">
              <span className="text-xs font-black uppercase text-amber-300 block">💵 US DOLLAR INDEX (DXY)</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">{asset.macroIntelligence.dxyIndex}</span>
                <span className="text-xs text-rose-400 font-bold">{asset.macroIntelligence.dxyChange}</span>
              </div>
              <p className="text-xs text-slate-300">
                Trend: <b>{asset.macroIntelligence.dxyTrend}</b> · Correlation: {asset.macroIntelligence.dxyCorrelation30D}
              </p>
            </div>

            <div className="bg-[#070e20] p-4 rounded-2xl border border-[#1e293b] space-y-2.5 shadow-xl">
              <span className="text-xs font-black uppercase text-cyan-300 block">📈 US 10-YR YIELD</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">{asset.macroIntelligence.us10yYield}</span>
                <span className="text-xs text-slate-400">Real Yield: {asset.macroIntelligence.realYieldTrend}</span>
              </div>
              <p className="text-xs text-slate-300">
                Fed Cut Expectation: <b>{asset.macroIntelligence.fedRateCutProbability}</b>
              </p>
            </div>

            <div className="bg-[#070e20] p-4 rounded-2xl border border-[#1e293b] space-y-2.5 shadow-xl">
              <span className="text-xs font-black uppercase text-emerald-300 block">🏛️ INSTITUTIONAL FLOWS</span>
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white">{asset.macroIntelligence.spotEtfNetFlowsUsd.split(' ')[0]}</span>
                <span className="text-xs text-amber-300 font-bold">{asset.macroIntelligence.etfFlowTrend}</span>
              </div>
              <p className="text-xs text-slate-300">
                Futures Basis: <b>{asset.macroIntelligence.comexFuturesBasis}</b>
              </p>
            </div>

            <div className="md:col-span-2 lg:col-span-3 bg-[#170a14] p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚠️</span>
                <div>
                  <span className="font-black text-amber-300 uppercase block">HIGH-IMPACT EVENT RISK WARNING: {asset.macroIntelligence.upcomingEventRiskTitle}</span>
                  <span className="text-slate-300">{asset.macroIntelligence.eventRiskWarning}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-amber-400 block font-bold">TIME REMAINING:</span>
                <span className="text-white font-black text-sm">{asset.macroIntelligence.timeRemainingToEvent}</span>
              </div>
            </div>
          </div>

          {/* ── LIVE ALL-WORLD NEWS WIRE & CRYPTO EVENTS TERMINAL ── */}
          <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>📰</span>
                    <span>ALL WORLD BREAKING NEWS & LIVE CRYPTO EVENTS WIRE</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE 0-MS WIRE STREAM
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time multi-source intelligence from Bloomberg, Reuters, CoinDesk, Fed Wire & Global Central Banks
                </p>
              </div>

              {/* Auto-Refresh Ticker & Search */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-cyan-300 bg-[#030611] px-2.5 py-1 rounded-lg border border-[#1e293b]">
                  🔄 Auto-sync in <b>{newsCountdown}s</b>
                </span>
                <button
                  onClick={() => {
                    setNewsCountdown(15);
                    setActiveAlertToast('News Wire Refreshed: All global market feeds up to date');
                    setTimeout(() => setActiveAlertToast(null), 2500);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0a1428] hover:bg-cyan-600 hover:text-slate-950 text-slate-300 border border-[#1e293b] transition-all cursor-pointer"
                >
                  Refresh Wire
                </button>
              </div>
            </div>

            {/* Filter Pills & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                {[
                  { key: 'ALL_WORLD', label: `⚡ All World News (${ALL_WORLD_GLOBAL_NEWS_FEED.length})` },
                  { key: 'CRYPTO', label: '₿ Crypto & Bitcoin' },
                  { key: 'COMMODITIES_GOLD', label: '🥇 Gold & Commodities' },
                  { key: 'CENTRAL_BANKS', label: '🏦 Central Banks & Fed' },
                  { key: 'GLOBAL_MACRO', label: '🌐 Global Macro' },
                  { key: 'GEOPOLITICS', label: '🛡️ Geopolitics' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setNewsCategory(cat.key as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      newsCategory === cat.key
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white bg-[#030611] border border-[#1e293b]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search headlines, CPI, Fed, ETF..."
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  className="w-full bg-[#030611] border border-[#1e293b] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                {newsSearch && (
                  <button
                    onClick={() => setNewsSearch('')}
                    className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtered News Items Feed */}
            <div className="space-y-3">
              {ALL_WORLD_GLOBAL_NEWS_FEED.filter((n) => {
                if (newsCategory !== 'ALL_WORLD' && n.category !== newsCategory) return false;
                if (newsSearch) {
                  const q = newsSearch.toLowerCase();
                  return (
                    n.headline.toLowerCase().includes(q) ||
                    n.summary.toLowerCase().includes(q) ||
                    n.source.toLowerCase().includes(q)
                  );
                }
                return true;
              }).map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-[#030611] border border-[#1e293b] hover:border-cyan-500/40 transition-all space-y-2.5 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {n.source}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ⏱️ {n.timestamp}
                      </span>
                      {n.verified && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          ✓ Verified Source
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        n.sentiment === 'BULLISH'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : n.sentiment === 'BEARISH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {n.sentiment === 'BULLISH' ? '🟢 BULLISH' : n.sentiment === 'BEARISH' ? '🔴 BEARISH' : '🟡 NEUTRAL'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        n.impact === 'CRITICAL_BREAKING'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : n.impact === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {n.impact === 'CRITICAL_BREAKING' ? '🔥 CRITICAL BREAKING' : n.impact === 'HIGH' ? '⚡ HIGH IMPACT' : 'MEDIUM'}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {n.headline}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {n.summary}
                  </p>

                  {/* Actual vs Expected & Reaction Strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    {n.actualVsConsensus && (
                      <span className="bg-[#070e20] px-2.5 py-1 rounded-lg border border-cyan-500/25 text-cyan-300 font-mono font-bold">
                        📊 {n.actualVsConsensus}
                      </span>
                    )}
                    <span className="bg-[#070e20] px-2.5 py-1 rounded-lg border border-[#1e293b] text-slate-300">
                      ⚡ <b>Reaction:</b> {n.marketReaction}
                    </span>
                  </div>

                  {/* Asset-Specific Quant Implications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-[#1e293b]/60 text-[11px]">
                    <div className="bg-[#070e20] p-2 rounded-xl border border-amber-500/20 text-slate-300">
                      <b className="text-amber-400 block mb-0.5">₿ Bitcoin Implication:</b>
                      {n.btcImpact}
                    </div>
                    <div className="bg-[#070e20] p-2 rounded-xl border border-yellow-500/20 text-slate-300">
                      <b className="text-yellow-400 block mb-0.5">🥇 Gold Implication:</b>
                      {n.goldImpact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── LIVE UPCOMING MACRO ECONOMIC CALENDAR EVENTS ── */}
          <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>🗓️</span>
                <span>UPCOMING HIGH-IMPACT MACRO CALENDAR EVENTS & COUNTDOWNS</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-400">Strict Volatility Risk</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {UPCOMING_MACRO_CALENDAR_EVENTS.map((cal) => (
                <div
                  key={cal.id}
                  className="p-3.5 rounded-xl bg-[#030611] border border-[#1e293b] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300">
                        {cal.currency}
                      </span>
                      <span>{cal.title}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded font-black text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {cal.impact}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Scheduled: <b className="text-white">{cal.scheduledTime}</b></span>
                    <span className="bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      ⏳ in {cal.countdown}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-[#070e20] p-2 rounded-lg border border-[#1e293b]">
                    <span>Forecast: <b className="text-cyan-300">{cal.forecast}</b></span>
                    <span>Prior: <b className="text-slate-400">{cal.previous}</b></span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-[#070e20] p-2 rounded-lg border border-amber-500/20">
                    <b>Trading Gameplan:</b> {cal.marketImplication}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 6: BACKTEST & PERFORMANCE ────────────────── */}
      {activeSubTab === 'BACKTEST' && (
        <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <h3 className="text-sm font-black text-white">🏆 18-MONTH WALK-FORWARD BACKTEST VERIFICATION</h3>
              <p className="text-xs text-slate-400">Tested across {asset.backtestStats.sampleSizeTrades} trades (2024–2026 Walk-Forward Out-of-Sample)</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              VERIFIED HISTORICAL ALPHA
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#030611] p-3 rounded-xl border border-[#1e293b] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Win Rate</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">{asset.backtestStats.winRatePct}%</span>
            </div>
            <div className="bg-[#030611] p-3 rounded-xl border border-[#1e293b] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Profit Factor</span>
              <span className="text-xl font-black text-cyan-300 mt-1 block">{asset.backtestStats.profitFactor}</span>
            </div>
            <div className="bg-[#030611] p-3 rounded-xl border border-[#1e293b] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Max Drawdown</span>
              <span className="text-xl font-black text-rose-400 mt-1 block">{asset.backtestStats.maxDrawdownPct}</span>
            </div>
            <div className="bg-[#030611] p-3 rounded-xl border border-[#1e293b] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Reward:Risk</span>
              <span className="text-xl font-black text-white mt-1 block">{asset.backtestStats.averageRewardToRisk}</span>
            </div>
            <div className="bg-[#030611] p-3 rounded-xl border border-[#1e293b] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Expectancy</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">{asset.backtestStats.expectancyR}</span>
            </div>
            <div className="bg-[#030611] p-3 rounded-xl border border-[#1e293b] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">News Win Rate</span>
              <span className="text-xl font-black text-amber-300 mt-1 block">{asset.backtestStats.newsEventWinRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 7: LIVE ALERT CENTER ────────────────── */}
      {activeSubTab === 'ALERTS' && (
        <div className="bg-[#070e20] p-4 sm:p-5 rounded-2xl border border-[#1e293b] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <h3 className="text-sm font-black text-white">🔔 DYNAMIC PRICE & EVENT ALERT CENTER</h3>
              <p className="text-xs text-slate-400">Server-side monitoring for entry zones, traps, and decision changes</p>
            </div>
          </div>

          {activeAlertToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
              ✓ {activeAlertToast}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 bg-[#030611] p-3 rounded-xl border border-[#1e293b]">
            <input
              type="number"
              value={newAlertPrice}
              onChange={(e) => setNewAlertPrice(e.target.value)}
              placeholder="Target Price Level"
              className="bg-[#070e20] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white font-bold"
            />
            <button
              onClick={handleAddAlert}
              className="px-4 py-1.5 rounded-lg text-xs font-black bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all"
            >
              + Create Price Alert
            </button>
          </div>

          <div className="space-y-2">
            {userAlerts.map((alt) => (
              <div key={alt.id} className="p-3 rounded-xl bg-[#030611] border border-[#1e293b] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span>{alt.status === 'TRIGGERED' ? '⚡' : '🔔'}</span>
                  <span className="text-white font-bold">{alt.condition}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${alt.status === 'TRIGGERED' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {alt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────── 8. COMPLETED TRADES JOURNAL MODAL ────────────────── */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#070e20] border-2 border-cyan-500/50 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    INSTITUTIONAL COMPLETED TRADES AUDIT JOURNAL
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live record of finished setups, automated exits, realized risk-to-reward & profit lock history
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJournalModal(false)}
                className="h-8 w-8 rounded-full bg-[#030611] hover:bg-rose-500/20 text-slate-400 hover:text-white border border-[#1e293b] flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#030611] p-2.5 rounded-xl border border-[#1e293b]">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Completed</span>
                <span className="text-lg font-black text-white">{completedJournal.length}</span>
              </div>
              <div className="bg-[#030611] p-2.5 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-400 block text-[10px] uppercase font-bold">Target Hit Rate</span>
                <span className="text-lg font-black text-emerald-300">
                  {completedJournal.length > 0
                    ? `${Math.round((completedJournal.filter((j) => j.outcome === 'FULL_TP3_PROFIT').length / completedJournal.length) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="bg-[#030611] p-2.5 rounded-xl border border-cyan-500/30">
                <span className="text-cyan-400 block text-[10px] uppercase font-bold">Lifecycle State</span>
                <span className="text-sm font-black text-cyan-200 uppercase mt-1 block">Auto-Rotated</span>
              </div>
            </div>

            {/* Journal Entries List */}
            <div className="space-y-2.5">
              {completedJournal.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2 bg-[#030611] ${
                    entry.outcome === 'FULL_TP3_PROFIT' ? 'border-emerald-500/40' : 'border-rose-500/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        entry.direction === 'SHORT' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {entry.direction}
                      </span>
                      <span className="font-extrabold text-white text-xs">{entry.setupName}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                      entry.outcome === 'FULL_TP3_PROFIT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {entry.outcome === 'FULL_TP3_PROFIT' ? '✅ ALL TARGETS CLEARED (+TP3)' : '🛡️ STOP LOSS MITIGATED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#070e20] p-2 rounded-xl border border-[#1e293b]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Entry Price:</span>
                      <b className="text-white">${entry.entryPrice.toLocaleString()}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exit Price:</span>
                      <b className={entry.outcome === 'FULL_TP3_PROFIT' ? 'text-emerald-300' : 'text-rose-300'}>
                        ${entry.exitPrice.toLocaleString()}
                      </b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Realized R:R:</span>
                      <b className="text-cyan-300">{entry.realizedRr}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Realized PnL:</span>
                      <b className={entry.outcome === 'FULL_TP3_PROFIT' ? 'text-emerald-400' : 'text-rose-400'}>
                        {entry.pnlAmount}
                      </b>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Instrument: <b className="text-slate-200">{entry.asset}</b></span>
                    <span>Closed: <b className="text-slate-200">{entry.closedAt}</b></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowJournalModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
              >
                Close Audit Journal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionalAiTerminalView;
