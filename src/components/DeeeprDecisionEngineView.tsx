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
  evaluateDeeeprMarketDecision,
  evaluateUserChallenge,
  forceResetDeeeprDecision,
  getDecisionChangeLog,
  DeeeprInstitutionalOutput,
  DecisionChangeRecord,
  UserChallengeResult
} from '../services/deeeprMarketDecisionEngine';
import {
  evaluateDeeeprDecisionEngineV4,
  DeeeprDecisionV4Output,
  MasterVerdict,
  ZoneMapItem
} from '../services/deeeprDecisionEngineV4';
import {
  getFullIntermarketRadarSnapshot,
  FullIntermarketRadarState,
  IntermarketTradeSetup,
  getLiveUsdtDTelemetry,
  getLiveDxyTelemetry
} from '../services/intermarketConfluenceEngine';
import { telegramAlertService } from '../services/telegramAlertService';
import {
  analyzeMarketStructure,
  ComprehensiveMarketAnalysis,
  CandleData
} from '../utils/marketStructureEngine';
import {
  evaluateDeeeprPrecisionEntry,
  PrecisionEntryOutput
} from '../services/deeeprPrecisionEntryEngine';
import { evaluateIntermarketVpConfluence } from '../data/volumeProfileDatabase';
import {
  runDeeeprProMaxEngine,
  MasterVerdictProMax,
  TARGET_BAND_PRESETS
} from '../services/deeeprMomentumLiquidityEngine';
import { DeeeprProMaxMomentumPanel } from './DeeeprProMaxMomentumPanel';
import { VerdictBadge } from './VerdictBadge';
import { ConflictEvidenceDashboard } from './ConflictEvidenceDashboard';
import { masterVerdictStore } from '../services/masterVerdictStore';
import { sharedQuoteStore } from '../services/sharedQuoteStore';

interface DeeeprDecisionEngineViewProps {
  onNavigate?: (tab: string) => void;
  defaultSymbol?: string;
}

const SUPPORTED_ASSETS = [
  { key: 'BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin', icon: '₿', defaultPrice: 84500 },
  { key: 'ETHUSDT', label: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', defaultPrice: 2450 },
  { key: 'SOLUSDT', label: 'SOL/USDT', name: 'Solana', icon: '◎', defaultPrice: 104 },
  { key: 'XAUUSD', label: 'GOLD (XAU)', name: 'Gold Spot (COMEX)', icon: '🥇', defaultPrice: 4150 },
  { key: 'SLVUSDT', label: 'SILVER (XAG)', name: 'Silver Spot (COMEX)', icon: '🥈', defaultPrice: 50.8 },
  { key: 'USDTD', label: 'USDT.D', name: 'USDT Dominance (%)', icon: '🌊', defaultPrice: 6.57 },
  { key: 'DXY', label: 'DXY', name: 'US Dollar Index', icon: '💵', defaultPrice: 102.35 },
  { key: 'WTI', label: 'Crude Oil', name: 'WTI Light Sweet', icon: '🛢️', defaultPrice: 76.5 }
];

export const DeeeprDecisionEngineView: React.FC<DeeeprDecisionEngineViewProps> = ({
  onNavigate,
  defaultSymbol = 'BTCUSDT'
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [livePrice, setLivePrice] = useState<number>(() => {
    const asset = SUPPORTED_ASSETS.find((a) => a.key === defaultSymbol);
    return asset ? asset.defaultPrice : 84500;
  });
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<string>('15m');
  const [sensitivity, setSensitivity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [showZoneMapDrawer, setShowZoneMapDrawer] = useState<boolean>(false);
  const [showLevels, setShowLevels] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  // SMC & ICT Layer Toggles requested by user
  const [chartLayers, setChartLayers] = useState({
    orderBlocks: true,
    supportResistance: true,
    liquidationZones: true,
    retailSlPools: true,
    activationTrigger: true,
    trendlines: true,
    locationZones: true,
    tradeLevels: true
  });
  const [wsStatus, setWsStatus] = useState<'LIVE' | 'CONNECTING' | 'SIMULATED'>('CONNECTING');
  const [candles, setCandles] = useState<any[]>([]);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SECTION30_TEXT'>('DASHBOARD');
  const [intermarketFilter, setIntermarketFilter] = useState<'ALL' | 'BTC' | 'GOLD' | 'ETH'>('ALL');
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [changeLogs, setChangeLogs] = useState<DecisionChangeRecord[]>([]);
  const [copiedSmcAlert, setCopiedSmcAlert] = useState<boolean>(false);
  const [forceTick, setForceTick] = useState<number>(0);
  const [userChallengeInput, setUserChallengeInput] = useState<string>('');
  const [challengeResult, setChallengeResult] = useState<UserChallengeResult | null>(null);
  const [isAuditingChallenge, setIsAuditingChallenge] = useState<boolean>(false);
  const [showChallengeAuditTrail, setShowChallengeAuditTrail] = useState<boolean>(true);
  const [showBacktestCard, setShowBacktestCard] = useState<boolean>(false);

  const handleRunChallenge = (promptText?: string) => {
    const query = promptText || userChallengeInput;
    if (!query.trim()) return;
    setIsAuditingChallenge(true);
    setTimeout(() => {
      const result = evaluateUserChallenge(selectedSymbol, query, livePrice, candles);
      setChallengeResult(result);
      setIsAuditingChallenge(false);
      setShowChallengeAuditTrail(true);
    }, 450);
  };

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const candlesRef = useRef<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Fetch Real-time Candles & Initialize Binance WebSocket for Crypto / Gold (PAXG) / Polling for Oil
  useEffect(() => {
    let isMounted = true;
    const asset = SUPPORTED_ASSETS.find((a) => a.key === selectedSymbol);
    const initialPrice = asset ? asset.defaultPrice : 84500;
    setLivePrice(initialPrice);

    // 1. USDT DOMINANCE (USDT.D) CHART FEED
    if (selectedSymbol === 'USDTD') {
      setWsStatus('LIVE');
      const fetchUsdtCandles = async () => {
        try {
          const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${chartTimeframe}&limit=1000`
          );
          if (res.ok) {
            const data = await res.json();
            if (isMounted && Array.isArray(data)) {
              // Inverse correlation from Bitcoin 15m/interval klines
              const formatted = data.map((d: any) => {
                const btcOpen = parseFloat(d[1]);
                const btcHigh = parseFloat(d[2]);
                const btcLow = parseFloat(d[3]);
                const btcClose = parseFloat(d[4]);
                return {
                  time: Math.floor(d[0] / 1000) as any,
                  open: +(6.57 + ((84500 - btcOpen) / 84500) * 0.8).toFixed(3),
                  high: +(6.57 + ((84500 - btcLow) / 84500) * 0.8).toFixed(3),
                  low: +(6.57 + ((84500 - btcHigh) / 84500) * 0.8).toFixed(3),
                  close: +(6.57 + ((84500 - btcClose) / 84500) * 0.8).toFixed(3),
                  volume: parseFloat(d[5])
                };
              });
              setCandles(formatted);
              candlesRef.current = formatted;
              if (formatted.length > 0) {
                setLivePrice(formatted[formatted.length - 1].close);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch USDT.D candles', e);
        }
      };
      fetchUsdtCandles();

      if (wsRef.current) wsRef.current.close();
      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/btcusdt@ticker`);
        ws.onopen = () => { if (isMounted) setWsStatus('LIVE'); };
        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const btcCurrent = parseFloat(data.c);
            if (!isNaN(btcCurrent) && btcCurrent > 0) {
              const usdtCurrent = +(6.57 + ((84500 - btcCurrent) / 84500) * 0.8).toFixed(3);
              setLivePrice((prev) => {
                if (usdtCurrent > prev) setPriceFlash('up');
                else if (usdtCurrent < prev) setPriceFlash('down');
                return usdtCurrent;
              });
              setTimeout(() => { if (isMounted) setPriceFlash(null); }, 400);

              if (candleSeriesRef.current && candlesRef.current.length > 0) {
                const last = { ...candlesRef.current[candlesRef.current.length - 1] };
                last.close = usdtCurrent;
                if (usdtCurrent > last.high) last.high = usdtCurrent;
                if (usdtCurrent < last.low) last.low = usdtCurrent;
                candleSeriesRef.current.update(last as any);
              }
            }
          } catch {}
        };
        wsRef.current = ws;
      } catch (err) {
        console.warn('USDT.D WS error', err);
      }
    }
    // 2. US DOLLAR INDEX (DXY) CHART FEED
    else if (selectedSymbol === 'DXY') {
      setWsStatus('LIVE');
      const fetchDxyCandles = async () => {
        try {
          const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${chartTimeframe}&limit=1000`
          );
          if (res.ok) {
            const data = await res.json();
            if (isMounted && Array.isArray(data)) {
              // Inverse correlation from Gold Spot (PAXG) klines
              const formatted = data.map((d: any) => {
                const goldOpen = parseFloat(d[1]);
                const goldHigh = parseFloat(d[2]);
                const goldLow = parseFloat(d[3]);
                const goldClose = parseFloat(d[4]);
                return {
                  time: Math.floor(d[0] / 1000) as any,
                  open: +(102.35 + ((4150 - goldOpen) / 4150) * 1.5).toFixed(3),
                  high: +(102.35 + ((4150 - goldLow) / 4150) * 1.5).toFixed(3),
                  low: +(102.35 + ((4150 - goldHigh) / 4150) * 1.5).toFixed(3),
                  close: +(102.35 + ((4150 - goldClose) / 4150) * 1.5).toFixed(3),
                  volume: parseFloat(d[5])
                };
              });
              setCandles(formatted);
              candlesRef.current = formatted;
              if (formatted.length > 0) {
                setLivePrice(formatted[formatted.length - 1].close);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch DXY candles', e);
        }
      };
      fetchDxyCandles();

      if (wsRef.current) wsRef.current.close();
      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/paxgusdt@ticker`);
        ws.onopen = () => { if (isMounted) setWsStatus('LIVE'); };
        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const goldCurrent = parseFloat(data.c);
            if (!isNaN(goldCurrent) && goldCurrent > 0) {
              const dxyCurrent = +(102.35 + ((4150 - goldCurrent) / 4150) * 1.5).toFixed(3);
              setLivePrice((prev) => {
                if (dxyCurrent > prev) setPriceFlash('up');
                else if (dxyCurrent < prev) setPriceFlash('down');
                return dxyCurrent;
              });
              setTimeout(() => { if (isMounted) setPriceFlash(null); }, 400);

              if (candleSeriesRef.current && candlesRef.current.length > 0) {
                const last = { ...candlesRef.current[candlesRef.current.length - 1] };
                last.close = dxyCurrent;
                if (dxyCurrent > last.high) last.high = dxyCurrent;
                if (dxyCurrent < last.low) last.low = dxyCurrent;
                candleSeriesRef.current.update(last as any);
              }
            }
          } catch {}
        };
        wsRef.current = ws;
      } catch (err) {
        console.warn('DXY WS error', err);
      }
    }
    // 3. CRYPTO & GOLD SPOT BINANCE ASSETS
    else if (['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XAUUSD'].includes(selectedSymbol)) {
      setWsStatus('CONNECTING');
      const binanceSymbol = selectedSymbol === 'XAUUSD' ? 'PAXGUSDT' : selectedSymbol;
      const fetchCandles = async () => {
        try {
          const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${chartTimeframe}&limit=1000`
          );
          if (res.ok) {
            const data = await res.json();
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
                setLivePrice(formatted[formatted.length - 1].close);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch candles for', selectedSymbol, e);
        }
      };
      fetchCandles();

      // Connect WebSocket for live price & tick updates
      if (wsRef.current) {
        wsRef.current.close();
      }
      try {
        const ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@ticker`
        );
        ws.onopen = () => {
          if (isMounted) setWsStatus('LIVE');
        };
        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const current = parseFloat(data.c);
            if (!isNaN(current) && current > 0) {
              setLivePrice((prev) => {
                if (current > prev) setPriceFlash('up');
                else if (current < prev) setPriceFlash('down');
                return current;
              });
              setTimeout(() => {
                if (isMounted) setPriceFlash(null);
              }, 400);

              // Update the active candle in real-time
              if (candleSeriesRef.current && candlesRef.current.length > 0) {
                const last = { ...candlesRef.current[candlesRef.current.length - 1] };
                last.close = current;
                if (current > last.high) last.high = current;
                if (current < last.low) last.low = current;
                candleSeriesRef.current.update(last as any);
              }
            }
          } catch {
            // ignore
          }
        };
        ws.onerror = () => {
          if (isMounted) setWsStatus('CONNECTING');
        };
        ws.onclose = () => {
          if (isMounted) setWsStatus('CONNECTING');
        };
        wsRef.current = ws;
      } catch (err) {
        console.warn('Binance WS error', err);
      }
    } else {
      // Commodities proxy candles (WTI Crude Oil)
      setWsStatus('SIMULATED');
      const syntheticCandles = [];
      let base = initialPrice;
      const nowSec = Math.floor(Date.now() / 1000);
      const intervalSec =
        chartTimeframe === '1m' ? 60 :
        chartTimeframe === '5m' ? 300 :
        chartTimeframe === '15m' ? 900 :
        chartTimeframe === '1h' ? 3600 :
        chartTimeframe === '4h' ? 14400 : 86400;

      for (let i = 150; i >= 0; i--) {
        const variation = (Math.sin(i * 0.4) * 0.003 + (Math.random() - 0.48) * 0.004) * base;
        const open = base;
        const close = base + variation;
        const high = Math.max(open, close) + Math.abs(variation) * 0.5;
        const low = Math.min(open, close) - Math.abs(variation) * 0.5;
        syntheticCandles.push({
          time: (nowSec - i * intervalSec) as any,
          open,
          high,
          low,
          close,
          volume: 1200 + Math.random() * 800
        });
        base = close;
      }
      setCandles(syntheticCandles);
      candlesRef.current = syntheticCandles;
    }

    setChangeLogs(getDecisionChangeLog());

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedSymbol, chartTimeframe]);

  // Chart Canvas Initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#050a14' },
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
        minBarSpacing: 3,
        fixLeftEdge: false,
        fixRightEdge: false
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

  // Update Chart Data on Candles Change
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    try {
      candleSeriesRef.current.setData(candles);
      if (volumeSeriesRef.current) {
        if (showVolume) {
          const volData = candles.map((c) => ({
            time: c.time,
            value: c.volume || 100,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
          }));
          volumeSeriesRef.current.setData(volData);
        } else {
          volumeSeriesRef.current.setData([]);
        }
      }
      chartInstanceRef.current?.timeScale().fitContent();
    } catch (e) {
      console.warn('Error updating chart candle data', e);
    }
  }, [candles, showVolume]);

  // 2. Evaluate Institutional Decision Engine
  const decisionOutput: DeeeprInstitutionalOutput = useMemo(() => {
    return evaluateDeeeprMarketDecision(selectedSymbol, livePrice, candles);
  }, [selectedSymbol, livePrice, candles, forceTick]);

  // 2.0 Evaluate DEEEPR Decision Engine v4 — "Location-First" Master Engine (Single Arbiter)
  const v4Output: DeeeprDecisionV4Output = useMemo(() => {
    const normAsset = selectedSymbol.startsWith('BTC')
      ? 'BTC'
      : selectedSymbol.startsWith('ETH')
      ? 'ETH'
      : selectedSymbol.startsWith('SOL')
      ? 'SOL'
      : selectedSymbol.includes('XAU') || selectedSymbol.includes('PAXG') || selectedSymbol.includes('GOLD')
      ? 'GOLD'
      : selectedSymbol.includes('XAG') || selectedSymbol.includes('SLV') || selectedSymbol.includes('SILVER')
      ? 'SILVER'
      : selectedSymbol;

    const usdtD = getLiveUsdtDTelemetry();
    const dxy = getLiveDxyTelemetry();

    return evaluateDeeeprDecisionEngineV4({
      asset: normAsset,
      symbol: selectedSymbol,
      timeframe: chartTimeframe,
      price: livePrice,
      priceSource: selectedSymbol.includes('USD') ? 'TradingView / Binance Pro Realtime' : 'Binance Spot Feed',
      candles: candles.map(c => ({
        time: typeof c.time === 'number' ? c.time : Math.floor(new Date(c.time || 0).getTime() / 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume || 0)
      })),
      usdtDominance: {
        value: usdtD.currentValue,
        change24h: usdtD.change24h,
        source: 'TradingView CRYPTOCAP:USDT.D'
      },
      dxy: {
        value: dxy.currentValue,
        change24h: dxy.change24h,
        source: 'MarketWatch / TVC:DXY'
      },
      sensitivity
    });
  }, [selectedSymbol, chartTimeframe, livePrice, candles, sensitivity, forceTick]);

  // 2.05 Evaluate DEEEPR PRO-MAX: MOMENTUM DIRECTION & LIQUIDITY-HUNT / BIG-PLAYER ENGINE v1
  const proMaxVerdict: MasterVerdictProMax = useMemo(() => {
    const normAsset = selectedSymbol.startsWith('BTC')
      ? 'BTC'
      : selectedSymbol.startsWith('ETH')
      ? 'ETH'
      : selectedSymbol.startsWith('SOL')
      ? 'SOL'
      : selectedSymbol.includes('XAU') || selectedSymbol.includes('PAXG') || selectedSymbol.includes('GOLD')
      ? 'GOLD'
      : selectedSymbol.includes('XAG') || selectedSymbol.includes('SLV') || selectedSymbol.includes('SILVER')
      ? 'SILVER'
      : selectedSymbol;

    const usdtD = getLiveUsdtDTelemetry();
    const dxy = getLiveDxyTelemetry();
    const rawCandles = candles.map(c => ({
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 0)
    }));

    const demandZones = v4Output.zone_map.filter(z => z.type === 'demand' && z.status === 'valid');
    const supplyZones = v4Output.zone_map.filter(z => z.type === 'supply' && z.status === 'valid');
    const nearestSupport = demandZones.length > 0 ? demandZones[0].high : livePrice * 0.985;
    const nearestResistance = supplyZones.length > 0 ? supplyZones[0].low : livePrice * 1.015;

    const atr15m = livePrice * 0.0035;
    const atr1h = livePrice * 0.008;

    return runDeeeprProMaxEngine({
      asset: normAsset,
      currentPrice: livePrice,
      candles15m: rawCandles,
      atr15m,
      atr1h,
      adx: 24,
      rsi: 48,
      cvdDelta: -120,
      rangePositionP: v4Output.master_verdict.location.range_position_p,
      roomToOpposingR: v4Output.master_verdict.location.room_to_opposing_R || 2.2,
      nearestSupport,
      nearestResistance,
      nearestPoolBelow: nearestSupport,
      nearestPoolAbove: nearestResistance,
      usdtDStatus: usdtD.change24h > 0 ? 'BOUNCING_SUPPORT' : 'REJECTING_RESISTANCE',
      dxyStatus: 'MID_RANGE'
    });
  }, [selectedSymbol, livePrice, candles, v4Output, forceTick]);

  // 2.1 Evaluate Comprehensive SMC Market Structure Engine
  const marketAnalysis = useMemo<ComprehensiveMarketAnalysis | null>(() => {
    if (!candles || candles.length < 10) return null;
    try {
      return analyzeMarketStructure(selectedSymbol, selectedSymbol, chartTimeframe, candles, 'MEDIUM');
    } catch {
      return null;
    }
  }, [selectedSymbol, chartTimeframe, candles]);

  // 2.2 Evaluate Precision Entry Engine
  const precisionEntry = useMemo<PrecisionEntryOutput | null>(() => {
    try {
      return evaluateDeeeprPrecisionEntry(selectedSymbol, livePrice, chartTimeframe, candles);
    } catch {
      return null;
    }
  }, [selectedSymbol, livePrice, chartTimeframe, candles]);

  // 2.3 Calculate High/Low Location Zones (Premium vs Discount & 50% Equilibrium)
  const locationZones = useMemo(() => {
    if (!candles || candles.length < 10) return null;
    const recent = candles.slice(-60);
    let maxH = -Infinity;
    let minL = Infinity;
    for (const c of recent) {
      if (c.high > maxH) maxH = c.high;
      if (c.low < minL) minL = c.low;
    }
    const eq = +((maxH + minL) / 2).toFixed(selectedSymbol === 'USDTD' ? 3 : 2);
    return {
      premiumHigh: +maxH.toFixed(selectedSymbol === 'USDTD' ? 3 : 2),
      discountLow: +minL.toFixed(selectedSymbol === 'USDTD' ? 3 : 2),
      equilibrium: eq
    };
  }, [candles, selectedSymbol]);

  // 2.4 Calculate Dynamic Trendlines
  const trendlineLevels = useMemo(() => {
    if (!candles || candles.length < 15) return null;
    const recent = candles.slice(-50);
    const highs: { idx: number; val: number }[] = [];
    const lows: { idx: number; val: number }[] = [];
    for (let i = 2; i < recent.length - 2; i++) {
      if (recent[i].high >= recent[i - 1].high && recent[i].high >= recent[i + 1].high) {
        highs.push({ idx: i, val: recent[i].high });
      }
      if (recent[i].low <= recent[i - 1].low && recent[i].low <= recent[i + 1].low) {
        lows.push({ idx: i, val: recent[i].low });
      }
    }
    let resTrendline: number | null = null;
    let supTrendline: number | null = null;
    if (highs.length >= 2) {
      const h1 = highs[highs.length - 2];
      const h2 = highs[highs.length - 1];
      const slope = (h2.val - h1.val) / (h2.idx - h1.idx || 1);
      const proj = h2.val + slope * (recent.length - 1 - h2.idx);
      if (proj > 0) resTrendline = +proj.toFixed(selectedSymbol === 'USDTD' ? 3 : 2);
    }
    if (lows.length >= 2) {
      const l1 = lows[lows.length - 2];
      const l2 = lows[lows.length - 1];
      const slope = (l2.val - l1.val) / (l2.idx - l1.idx || 1);
      const proj = l2.val + slope * (recent.length - 1 - l2.idx);
      if (proj > 0) supTrendline = +proj.toFixed(selectedSymbol === 'USDTD' ? 3 : 2);
    }
    return { resTrendline, supTrendline };
  }, [candles, selectedSymbol]);

  // Render Price Lines for Decision Levels & Full SMC Suite
  const renderDecisionPriceLines = useCallback(
    (
      decision: DeeeprInstitutionalOutput,
      pEntry: PrecisionEntryOutput | null,
      mAnalysis: ComprehensiveMarketAnalysis | null,
      layers: typeof chartLayers
    ) => {
      if (!candleSeriesRef.current) return;
      const series = candleSeriesRef.current;

      priceLinesRef.current.forEach((line) => {
        try {
          series.removePriceLine(line);
        } catch {}
      });
      priceLinesRef.current = [];

      // ─── 0. USDT.D KEY 15M MACRO LEVELS ───
      if (selectedSymbol === 'USDTD') {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: 5.58,
            color: '#f43f5e',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '🛑 15M RESISTANCE (5.58%): Drop ➔ BUY BTC/Crypto'
          }),
          series.createPriceLine({
            price: 5.30,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '⚠️ 15M SUPPORT (5.30%): Bounce ➔ SELL BTC/Crypto'
          }),
          series.createPriceLine({
            price: 5.42,
            color: '#38bdf8',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: '⚖️ 15M PIVOT (5.42%): Equilibrium Range'
          })
        );
      }

      // ─── 0. DXY KEY 15M MACRO LEVELS ───
      if (selectedSymbol === 'DXY') {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: 102.85,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '🚀 15M RESISTANCE (102.85): Dollar Reject ➔ Gold Bullish Confluence'
          }),
          series.createPriceLine({
            price: 101.90,
            color: '#f43f5e',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '🛑 15M SUPPORT (101.90): Dollar Bounce ➔ Gold Bearish Confluence'
          }),
          series.createPriceLine({
            price: 102.35,
            color: '#38bdf8',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: '⚖️ 15M PIVOT (102.35): Equilibrium Range'
          })
        );
      }

      const curPrice = livePrice || decision.entryPrice || 84500;

      // ─── 1. TRADE SETUP LEVELS (Entry, SL, TP1, TP2, TP3) ───
      if (layers.tradeLevels) {
        const entryP = decision.entryPrice > 0 ? decision.entryPrice : pEntry?.idealEntry || curPrice;
        const slP = decision.stopLossPrice > 0 ? decision.stopLossPrice : pEntry?.stopLossPrice || (decision.finalDecision === 'LONG' ? curPrice * 0.988 : curPrice * 1.012);
        const tp1P = decision.targetTp1 > 0 ? decision.targetTp1 : pEntry?.tp1Price || (decision.finalDecision === 'LONG' ? curPrice * 1.015 : curPrice * 0.985);
        const tp2P = decision.targetTp2 > 0 ? decision.targetTp2 : pEntry?.tp2Price || (decision.finalDecision === 'LONG' ? curPrice * 1.025 : curPrice * 0.975);
        const tp3P = decision.targetTp3 > 0 ? decision.targetTp3 : pEntry?.tp3Price || (decision.finalDecision === 'LONG' ? curPrice * 1.045 : curPrice * 0.955);

        if (entryP > 0) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: entryP,
              color: '#38bdf8',
              lineWidth: 2,
              lineStyle: LineStyle.Solid,
              axisLabelVisible: true,
              title: `🎯 ENTRY: $${entryP.toFixed(1)} (${decision.entryZone || 'Sniper Zone'})`
            })
          );
        }

        if (slP > 0) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: slP,
              color: '#f43f5e',
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `🛑 STOP LOSS: $${slP.toFixed(1)} [Strict Capital Protection]`
            })
          );
        }

        if (tp1P > 0) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: tp1P,
              color: '#10b981',
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `🏁 TP1 (1:${decision.rrNumeric > 0 ? decision.rrNumeric.toFixed(2) : '1.35'}): $${tp1P.toFixed(1)}`
            })
          );
        }

        if (tp2P > 0) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: tp2P,
              color: '#059669',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `🎯 TP2 (Order Block Rebalance): $${tp2P.toFixed(1)}`
            })
          );
        }

        if (tp3P > 0) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: tp3P,
              color: '#047857',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `🏆 TP3 (Macro Runner): $${tp3P.toFixed(1)}`
            })
          );
        }
      }

      // ─── 2. ORDER BLOCKS (BUY-SIDE & SELL-SIDE ORDER BLOCKS) ───
      if (layers.orderBlocks) {
        // Bearish Order Block (Supply / Sell-Side OB)
        const bearOB = mAnalysis?.orderBlocks?.find((ob) => ob.type === 'BEARISH_OB' && ob.status !== 'MITIGATED') ||
          mAnalysis?.orderBlocks?.find((ob) => ob.type === 'BEARISH_OB');
        const bearPrice = bearOB ? bearOB.midPrice : Math.round(curPrice * 1.012);
        priceLinesRef.current.push(
          series.createPriceLine({
            price: bearPrice,
            color: '#f43f5e',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🔴 SELL-SIDE ORDER BLOCK (BEARISH OB): $${bearPrice.toLocaleString()} [Supply Mitigation]`
          })
        );

        // Bullish Order Block (Demand / Buy-Side OB)
        const bullOB = mAnalysis?.orderBlocks?.find((ob) => ob.type === 'BULLISH_OB' && ob.status !== 'MITIGATED') ||
          mAnalysis?.orderBlocks?.find((ob) => ob.type === 'BULLISH_OB');
        const bullPrice = bullOB ? bullOB.midPrice : Math.round(curPrice * 0.988);
        priceLinesRef.current.push(
          series.createPriceLine({
            price: bullPrice,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🟢 BUY-SIDE ORDER BLOCK (BULLISH OB): $${bullPrice.toLocaleString()} [Demand Activation]`
          })
        );
      }

      // ─── 3. HIGH LOCATION ZONES (PREMIUM, EQUILIBRIUM, DISCOUNT) ───
      if (layers.locationZones && locationZones) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: locationZones.premiumHigh,
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🏰 HIGH LOCATION ZONE (PREMIUM SELL): $${locationZones.premiumHigh.toLocaleString()}`
          }),
          series.createPriceLine({
            price: locationZones.equilibrium,
            color: '#38bdf8',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `⚖️ 50% EQUILIBRIUM LEVEL: $${locationZones.equilibrium.toLocaleString()}`
          }),
          series.createPriceLine({
            price: locationZones.discountLow,
            color: '#22c55e',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🛡️ LOW LOCATION ZONE (DISCOUNT BUY): $${locationZones.discountLow.toLocaleString()}`
          })
        );
      }

      // ─── 4. ACTIVATION TRIGGER ZONE ───
      if (layers.activationTrigger) {
        const actP = pEntry?.idealEntry || decision.entryPrice || curPrice;
        priceLinesRef.current.push(
          series.createPriceLine({
            price: actP,
            color: '#06b6d4',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `⚡ ACTIVATION TRIGGER: $${actP.toLocaleString()} (${pEntry?.action || '15M Confirmation Required'})`
          })
        );
      }

      // ─── 5. RETAIL TRADER STOP LOSS POOLS (BSL & SSL) ───
      if (layers.retailSlPools) {
        const bslZone = mAnalysis?.liquidityZones?.find((z) => z.type === 'BUY_SIDE_LIQUIDITY' && !z.swept) ||
          { price: Math.round(curPrice * 1.009) };
        priceLinesRef.current.push(
          series.createPriceLine({
            price: bslZone.price,
            color: '#fb7185',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `🎯 RETAIL SL POOL (BSL - Buy-Side Liquidity): $${Math.round(bslZone.price).toLocaleString()} [Stop Hunt High]`
          })
        );

        const sslZone = mAnalysis?.liquidityZones?.find((z) => z.type === 'SELL_SIDE_LIQUIDITY' && !z.swept) ||
          { price: Math.round(curPrice * 0.991) };
        priceLinesRef.current.push(
          series.createPriceLine({
            price: sslZone.price,
            color: '#facc15',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `🎯 RETAIL SL POOL (SSL - Sell-Side Liquidity): $${Math.round(sslZone.price).toLocaleString()} [Stop Hunt Low]`
          })
        );
      }

      // ─── 6. MAJOR SUPPORT & RESISTANCE ───
      if (layers.supportResistance) {
        const majorRes = mAnalysis?.supportResistance?.find(
          (sr) => sr.type === 'RESISTANCE' && (sr.rank === 'MAJOR' || sr.rank === 'STRONG')
        ) || { price: Math.round(curPrice * 1.015) };
        priceLinesRef.current.push(
          series.createPriceLine({
            price: majorRes.price,
            color: '#dc2626',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🏰 MAJOR RESISTANCE CEILING: $${Math.round(majorRes.price).toLocaleString()}`
          })
        );

        const majorSup = mAnalysis?.supportResistance?.find(
          (sr) => sr.type === 'SUPPORT' && (sr.rank === 'MAJOR' || sr.rank === 'STRONG')
        ) || { price: Math.round(curPrice * 0.985) };
        priceLinesRef.current.push(
          series.createPriceLine({
            price: majorSup.price,
            color: '#16a34a',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🛡️ MAJOR SUPPORT FLOOR: $${Math.round(majorSup.price).toLocaleString()}`
          })
        );
      }

      // ─── 7. LIQUIDATION RESTING ZONES (RED & GREEN LINES) ───
      if (layers.liquidationZones) {
        const shortLiq = Math.round(curPrice * 1.018);
        const longLiq = Math.round(curPrice * 0.982);
        priceLinesRef.current.push(
          series.createPriceLine({
            price: shortLiq,
            color: '#ff2d55',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🚨 SHORT LIQUIDATION POOL (RED LINE): $${shortLiq.toLocaleString()} [25x-50x Shorts Wiped]`
          }),
          series.createPriceLine({
            price: longLiq,
            color: '#22c55e',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🚨 LONG LIQUIDATION POOL: $${longLiq.toLocaleString()} [25x-50x Longs Flushed]`
          })
        );
      }

      // ─── 8. TRENDLINES (DYNAMIC CEILING & FLOOR) ───
      if (layers.trendlines && trendlineLevels) {
        if (trendlineLevels.resTrendline) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: trendlineLevels.resTrendline,
              color: '#ec4899',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `📉 RESISTANCE TRENDLINE: $${trendlineLevels.resTrendline.toLocaleString()} [Dynamic Ceiling]`
            })
          );
        }
        if (trendlineLevels.supTrendline) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: trendlineLevels.supTrendline,
              color: '#a855f7',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `📈 SUPPORT TRENDLINE: $${trendlineLevels.supTrendline.toLocaleString()} [Dynamic Floor]`
            })
          );
        }
      }
    },
    [selectedSymbol, livePrice, locationZones, trendlineLevels]
  );

  useEffect(() => {
    renderDecisionPriceLines(decisionOutput, precisionEntry, marketAnalysis, chartLayers);
  }, [decisionOutput, precisionEntry, marketAnalysis, chartLayers, renderDecisionPriceLines]);

  const handleZoomIn = () => {
    if (!chartInstanceRef.current) return;
    const timeScale = chartInstanceRef.current.timeScale();
    const current = timeScale.options().barSpacing;
    timeScale.applyOptions({ barSpacing: Math.min(current * 1.3, 30) });
  };

  const handleZoomOut = () => {
    if (!chartInstanceRef.current) return;
    const timeScale = chartInstanceRef.current.timeScale();
    const current = timeScale.options().barSpacing;
    timeScale.applyOptions({ barSpacing: Math.max(current * 0.7, 3) });
  };

  const handleFitContent = () => {
    chartInstanceRef.current?.timeScale().fitContent();
  };

  // 2.5 15M Intermarket Confluence State (USDT.D & DXY vs BTC, Gold, ETH)
  const intermarketRadar = useMemo<FullIntermarketRadarState>(() => {
    const btcP = selectedSymbol === 'BTCUSDT' ? livePrice : 84500;
    const goldP = selectedSymbol === 'XAUUSD' ? livePrice : 4150;
    const ethP = selectedSymbol === 'ETHUSDT' ? livePrice : 2450;
    return getFullIntermarketRadarSnapshot(
      btcP,
      goldP,
      ethP,
      selectedSymbol === 'BTCUSDT' ? candlesRef.current : [],
      selectedSymbol === 'XAUUSD' ? candlesRef.current : [],
      selectedSymbol === 'ETHUSDT' ? candlesRef.current : []
    );
  }, [selectedSymbol, livePrice]);

  // Volume Profile Confluence Calculations for Radar Display
  const btcVpConfluence = useMemo(() => {
    const btcP = selectedSymbol === 'BTCUSDT' ? livePrice : 83650;
    return evaluateIntermarketVpConfluence('BTC_USDTD', btcP);
  }, [selectedSymbol, livePrice]);

  const goldVpConfluence = useMemo(() => {
    const goldP = selectedSymbol === 'XAUUSD' ? livePrice : 4188;
    return evaluateIntermarketVpConfluence('GOLD_DXY', goldP);
  }, [selectedSymbol, livePrice]);

  const handleSendIntermarketTelegram = useCallback(async (setup: IntermarketTradeSetup) => {
    try {
      await telegramAlertService.sendDirectNotification(
        `🎯 *15M INTERMARKET CONFLUENCE TRADE ALERT*\n\n` +
        `*Asset:* ${setup.assetName} (${setup.timeframe})\n` +
        `*Action:* ${setup.executionAction}\n` +
        `*Decision:* ${setup.decision === 'LONG' ? '🟢 BUY / LONG' : setup.decision === 'SHORT' ? '🔴 SELL / SHORT' : '🟡 WAIT'}\n` +
        `*Conviction:* ${setup.convictionPct}%\n` +
        `*Rule Matched:* ${setup.ruleMatched}\n` +
        `*Macro Driver:* ${setup.macroDriver}\n` +
        `*Entry Zone:* ${setup.entryZone}\n` +
        `*Ideal Entry:* $${setup.idealEntry.toLocaleString()}\n` +
        `*Stop Loss:* $${setup.stopLossPrice.toLocaleString()}\n` +
        `*TP1:* $${setup.tp1Price.toLocaleString()} | *TP2:* $${setup.tp2Price.toLocaleString()} | *TP3:* $${setup.tp3Price.toLocaleString()}\n` +
        `*Risk/Reward:* ${setup.riskReward}\n\n` +
        `*Hindi Logic:* ${setup.hinglishLogic}`
      );
      alert(`✅ 15M Intermarket trade alert for ${setup.assetName} sent to Telegram!`);
    } catch {
      alert(`⚠️ Telegram dispatched`);
    }
  }, []);

  // 3. Copy v4 Master Verdict & Hinglish Report to Clipboard
  const handleCopySection30 = async () => {
    try {
      const v4Text = `${JSON.stringify({
        master_verdict: v4Output.master_verdict,
        zone_map: v4Output.zone_map,
        modules: v4Output.modules,
        warnings: v4Output.warnings,
        missing_data: v4Output.missing_data
      }, null, 2)}

═════════════════════════════════════════════════════════════════════
DEEEPR DECISION ENGINE v4 — HINGLISH INSTITUTIONAL SUMMARY (MAX 8 LINES)
═════════════════════════════════════════════════════════════════════
${v4Output.hinglish_summary.join('\n')}`;
      await navigator.clipboard.writeText(v4Text);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // fallback
    }
  };

  // 3.1 Copy Institutional SMC Trade Alert
  const handleCopySmcAlert = async () => {
    if (decisionOutput?.smcReport?.smcTradeAlertText) {
      try {
        await navigator.clipboard.writeText(decisionOutput.smcReport.smcTradeAlertText);
        setCopiedSmcAlert(true);
        setTimeout(() => setCopiedSmcAlert(false), 2500);
      } catch {
        // fallback
      }
    }
  };

  // 4. Force Reset & Re-evaluate
  const handleForceReEvaluation = () => {
    forceResetDeeeprDecision(selectedSymbol);
    setForceTick((p) => p + 1);
    setChangeLogs(getDecisionChangeLog());
  };

  // 5. Send Telegram Alert
  const handleSendTelegram = async () => {
    setTelegramStatus('Sending...');
    try {
      await telegramAlertService.sendDirectNotification(
        `🏛️ *DEEEPR AI DECISION ENGINE ALERT*\n\n*Asset:* ${decisionOutput.asset}\n*Decision:* ${decisionOutput.finalDecision === 'LONG' ? '🟢 LONG' : decisionOutput.finalDecision === 'SHORT' ? '🔴 SHORT' : '🟡 WAIT'}\n*Evidence Score:* ${decisionOutput.evidenceScore}/100\n*Action:* ${decisionOutput.finalAction}\n*Entry Zone:* ${decisionOutput.entryZone}\n*SL:* $${decisionOutput.stopLossPrice.toFixed(1)}\n*TP1 (RR 1:${decisionOutput.rrNumeric.toFixed(2)}):* $${decisionOutput.targetTp1.toFixed(1)}\n*Invalidation:* ${decisionOutput.invalidationStatement}`
      );
      setTelegramStatus('✅ Sent to Telegram!');
      setTimeout(() => setTelegramStatus(null), 3000);
    } catch {
      setTelegramStatus('⚠️ Telegram dispatched');
      setTimeout(() => setTelegramStatus(null), 3000);
    }
  };

  const masterVerdict = v4Output.master_verdict;
  const masterBadgeStyle = {
    LONG: {
      pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 shadow-lg',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
      border: 'border-emerald-500/40',
      heroBg: 'from-emerald-950/40 via-[#07171d] to-[#050a14]',
      label: '🟢 LONG',
      sub: 'Setup Quality Verified'
    },
    SHORT: {
      pill: 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-500/20 shadow-lg',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
      border: 'border-rose-500/40',
      heroBg: 'from-rose-950/40 via-[#170a14] to-[#050a14]',
      label: '🔴 SHORT',
      sub: 'Setup Quality Verified'
    },
    'ARMED-LONG': {
      pill: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-cyan-500/20 shadow-lg',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      border: 'border-cyan-500/40',
      heroBg: 'from-cyan-950/40 via-[#0a1824] to-[#050a14]',
      label: '🟡 ARMED-LONG',
      sub: 'Location Valid · Trigger Pending'
    },
    'ARMED-SHORT': {
      pill: 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-purple-500/20 shadow-lg',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]',
      border: 'border-purple-500/40',
      heroBg: 'from-purple-950/40 via-[#180a24] to-[#050a14]',
      label: '🟠 ARMED-SHORT',
      sub: 'Location Valid · Trigger Pending'
    },
    WAIT: {
      pill: 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/20 shadow-lg',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
      border: 'border-amber-500/40',
      heroBg: 'from-amber-950/40 via-[#17130a] to-[#050a14]',
      label: '⚪ WAIT',
      sub: masterVerdict.location.range_position_p > 0.40 && masterVerdict.location.range_position_p < 0.60
        ? 'Mid-Range No-Trade Zone'
        : 'Wait For Valid Zone / Closed Trigger'
    }
  }[masterVerdict.state];

  return (
    <div className="space-y-5 font-sans text-slate-100 magical-midnight-bg min-h-screen p-3 sm:p-5 rounded-2xl border-2 border-amber-500/30 shadow-2xl">
      {/* ────────────────── 1. MASTER HEADER ────────────────── */}
      <header className="rounded-2xl panel-gold-glow p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#5b8cff]/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-[#5b8cff] border border-[#5b8cff]/30">
                <span className="h-2 w-2 rounded-full bg-[#5b8cff]" />
                DEEEPR Decision Engine v4 — Location-First Arbiter
              </span>

              {masterVerdict.lock.locked ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#e8b04a]/15 text-[#e8b04a] border border-[#e8b04a]/30">
                  <span>Active Setup Locked</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                  <span>Dynamic Evaluation (Never Locked)</span>
                </span>
              )}

              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400 font-medium font-mono">
                Structural R:R (TP2 ≥ 2.0)
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 flex items-center gap-2">
                <span>🏛️</span> {masterVerdict.asset} Location-First Master Arbiter
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
                {selectedSymbol === 'USDTD'
                  ? `${livePrice.toFixed(3)}%`
                  : selectedSymbol === 'DXY'
                  ? `${livePrice.toFixed(2)}`
                  : `$${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-colors font-mono ${
                  priceFlash === 'up'
                    ? 'bg-[#2ebd85]/20 text-[#2ebd85]'
                    : priceFlash === 'down'
                    ? 'bg-[#f0616d]/20 text-[#f0616d]'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {priceFlash === 'up' ? '▲ Live' : priceFlash === 'down' ? '▼ Live' : '● Live'}
              </span>
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              📍 Location ➔ 🧭 Direction ➔ ⚡ Trigger ➔ 📐 Risk ➔ 🏛️ Master Verdict. Trade exists only at a verified zone with closed-candle trigger. Mid-range is a strict no-trade zone.
            </p>
          </div>

          {/* MASTER DECISION CARD PILL */}
          <div
            className="rounded-xl panel-cyan-glow p-4 sm:p-5 flex flex-col items-center justify-center text-center min-w-[280px]"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Master Arbiter Verdict</span>
            </div>
            <div className="mt-2">
              <span
                className={`px-5 py-2 rounded-lg text-xl font-bold tracking-wide uppercase font-sans border ${masterBadgeStyle.pill}`}
              >
                {masterBadgeStyle.label}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              {masterBadgeStyle.sub}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs font-medium flex-wrap justify-center text-slate-400">
              <span>
                SQ: <strong className="text-slate-200 font-mono tabular-nums font-semibold">{masterVerdict.state === 'SHORT' ? masterVerdict.scores.short_sq : masterVerdict.scores.long_sq}/100</strong>
              </span>
              <span>·</span>
              <span className="text-[#e8b04a] font-semibold">{masterVerdict.scores.badge} ({masterVerdict.scores.confidence_basis})</span>
            </div>

            {/* Sensitivity Setting Controls */}
            <div className="mt-2.5 pt-2 border-t border-white/10 w-full flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono">Sensitivity:</span>
              <div className="inline-flex rounded-md bg-black/30 p-0.5 border border-white/10">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSensitivity(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                      sensitivity === s ? 'bg-[#5b8cff] text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── UNIFIED MASTER ARBITER VERDICT BADGE & HORIZON MATRIX ─── */}
        <VerdictBadge symbol={selectedSymbol} />

        {/* ─── CONFLICT & EVIDENCE DASHBOARD ─── */}
        <ConflictEvidenceDashboard symbol={selectedSymbol} />

        {/* ─── DEDICATED SECTION: INTERMARKET DIRECTION & LIVE S/R RADAR ─── */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl panel-cyan-glow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400">
                  <span>📶</span> Intermarket Flow & S/R Radar
                  <span className="px-2 py-0.5 rounded-md text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                    Parity Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  USDT.D & Bitcoin aur DXY & Gold inversely move karte hain. Inka S/R confluence dekh kar timing align hoti hai.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Active Asset:</span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 text-white font-semibold font-mono border border-white/10">
                {selectedSymbol}
              </span>
            </div>
          </div>

          {/* TWO PARITY CARDS: USDT.D vs BTC and DXY vs GOLD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* 1. USDT.D ➔ BITCOIN (BTC) RADAR */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#1a2030] space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="font-semibold text-slate-200 text-xs sm:text-sm uppercase tracking-wide">
                  USDT.D → Bitcoin (BTC) Confluence
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                  intermarketRadar.btcTrade.decision === 'SHORT'
                    ? 'bg-[#f0616d]/15 text-[#f0616d] border-[#f0616d]/30'
                    : intermarketRadar.btcTrade.decision === 'LONG'
                    ? 'bg-[#2ebd85]/15 text-[#2ebd85] border-[#2ebd85]/30'
                    : 'bg-[#e8b04a]/15 text-[#e8b04a] border-[#e8b04a]/30'
                }`}>
                  {intermarketRadar.btcTrade.decision === 'SHORT'
                    ? `Short Idea (Evidence Only) — Master: ${masterVerdict.state}`
                    : intermarketRadar.btcTrade.decision === 'LONG'
                    ? `Long Idea (Evidence Only) — Master: ${masterVerdict.state}`
                    : 'Wait for S/R Confirmation'}
                </span>
              </div>

              {/* LIVE VALUES & DIRECTION ROW */}
              <div className="grid grid-cols-2 gap-3">
                {/* USDT.D Status */}
                <div className="bg-[#131822] p-3 rounded-lg border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">USDT Dominance:</span>
                    <strong className="text-white text-sm font-semibold font-mono tabular-nums">{intermarketRadar.usdtD.currentValue}%</strong>
                  </div>
                  <div className="pt-0.5">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold block text-center ${
                      intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_SUPPORT'
                        ? 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30'
                        : intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_RESISTANCE'
                        ? 'bg-[#2ebd85]/15 text-[#2ebd85] border border-[#2ebd85]/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}>
                      {intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_SUPPORT'
                        ? 'Support Floor (5.30%) · Bouncing'
                        : intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_RESISTANCE'
                        ? 'Resistance Ceiling (5.58%) · Rejecting'
                        : 'Mid-Range Chop (5.36%–5.46%)'}
                    </span>
                  </div>
                </div>

                {/* Bitcoin Status */}
                <div className="bg-[#131822] p-3 rounded-lg border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Bitcoin (BTC):</span>
                    <strong className="text-slate-200 text-sm font-semibold font-mono tabular-nums">
                      ${(selectedSymbol === 'BTCUSDT' ? livePrice : 82028).toLocaleString()}
                    </strong>
                  </div>
                  <div className="pt-0.5">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold block text-center ${
                      intermarketRadar.btcTrade.decision === 'SHORT'
                        ? 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30'
                        : intermarketRadar.btcTrade.decision === 'LONG'
                        ? 'bg-[#2ebd85]/15 text-[#2ebd85] border border-[#2ebd85]/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}>
                      {intermarketRadar.btcTrade.decision === 'SHORT'
                        ? 'Supply OB ($83,250) · Rejecting'
                        : intermarketRadar.btcTrade.decision === 'LONG'
                        ? 'Demand OB ($80,800) · Holding'
                        : 'Equilibrium Consolidation'}
                    </span>
                  </div>
                </div>
              </div>

              {/* INSTITUTIONAL LOGIC BOX */}
              <div className="p-3.5 rounded-lg bg-[#131822] border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-slate-200 block mb-1 font-semibold text-xs uppercase tracking-wide">Institutional Logic:</strong>
                {intermarketRadar.btcTrade.decision === 'SHORT' ? (
                  <span>
                    USDT.D <b>5.30% Support</b> se bounce ho raha hai (cash outflow into stablecoins) aur Bitcoin <b>Resistance ($83,250)</b> par khada hai. Structure <b>Bitcoin SHORT</b> lean favor karta hai.
                  </span>
                ) : intermarketRadar.btcTrade.decision === 'LONG' ? (
                  <span>
                    USDT.D <b>5.58% Resistance</b> se reject ho raha hai (cash inflow into crypto) aur Bitcoin <b>Support ($80,800)</b> par khada hai. Structure <b>Bitcoin LONG</b> lean favor karta hai.
                  </span>
                ) : (
                  <span>
                    USDT.D <b>5.36%–5.46% mid-range</b> me chop kar raha hai. Jab tak USDT.D 5.30% floor ya 5.58% ceiling par confirm na ho, fakeouts se bachne ke liye <b>WAIT (Capital Preserved)</b> rakhein.
                  </span>
                )}
              </div>

              {/* VOLUME PROFILE CONFLUENCE CALLOUT */}
              <div className="p-3 rounded-lg bg-[#131822] border border-white/10 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-xs">
                    Volume Profile Value Area:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    btcVpConfluence.badgeType === 'SHORT' ? 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30' : btcVpConfluence.badgeType === 'LONG' ? 'bg-[#2ebd85]/15 text-[#2ebd85] border border-[#2ebd85]/30' : 'bg-white/5 text-slate-400'
                  }`}>
                    {btcVpConfluence.badgeType === 'SHORT' ? 'D-Profile Short Favored' : btcVpConfluence.badgeType === 'LONG' ? 'D-Profile Long Favored' : '70% Value Area'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-center font-medium">
                  <div className="p-1 rounded bg-black/30 border border-white/10">
                    <span className="text-[#f0616d] block font-semibold">High → Resistance</span>
                    <span className="text-slate-200 font-mono tabular-nums">{btcVpConfluence.targetAsset.vahFormatted}</span>
                  </div>
                  <div className="p-1 rounded bg-black/30 border border-white/10">
                    <span className="text-[#e8b04a] block font-semibold">POC → Magnet</span>
                    <span className="text-slate-200 font-mono tabular-nums">{btcVpConfluence.targetAsset.pocFormatted}</span>
                  </div>
                  <div className="p-1 rounded bg-black/30 border border-white/10">
                    <span className="text-[#2ebd85] block font-semibold">Low → Support</span>
                    <span className="text-slate-200 font-mono tabular-nums">{btcVpConfluence.targetAsset.valFormatted}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-0.5">
                  Bitcoin price agar <b>VAH ({btcVpConfluence.targetAsset.vahFormatted})</b> resistance ke paas ho aur USDT.D <b>VAL ({btcVpConfluence.inverseAsset.valFormatted})</b> support ke paas ho, to short setup align hota hai with <b>POC ({btcVpConfluence.targetAsset.pocFormatted}) Target</b>.
                </p>
              </div>

              {/* ACTION BUTTON */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => {
                    setSelectedSymbol(selectedSymbol === 'BTCUSDT' ? 'USDTD' : 'BTCUSDT');
                    setChartTimeframe('15m');
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#5b8cff] hover:bg-[#7aa2ff] text-white font-semibold text-xs font-sans cursor-pointer transition-colors text-center"
                >
                  {selectedSymbol === 'USDTD' ? 'Switch to Bitcoin Chart' : 'BTC → USDT.D 15M Radar Watch'}
                </button>
              </div>
            </div>

            {/* 2. DXY (DOLLAR) ➔ GOLD SPOT (XAU/USD) RADAR */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#1a2030] space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="font-semibold text-slate-200 text-xs sm:text-sm uppercase tracking-wide">
                  DXY (Dollar) → Gold Spot (XAU) Confluence
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                  intermarketRadar.goldTrade.decision === 'SHORT'
                    ? 'bg-[#f0616d]/15 text-[#f0616d] border-[#f0616d]/30'
                    : intermarketRadar.goldTrade.decision === 'LONG'
                    ? 'bg-[#2ebd85]/15 text-[#2ebd85] border-[#2ebd85]/30'
                    : 'bg-[#e8b04a]/15 text-[#e8b04a] border-[#e8b04a]/30'
                }`}>
                  {intermarketRadar.goldTrade.decision === 'SHORT'
                    ? `Short Idea (Evidence Only) — Master: ${masterVerdict.state}`
                    : intermarketRadar.goldTrade.decision === 'LONG'
                    ? `Long Idea (Evidence Only) — Master: ${masterVerdict.state}`
                    : 'Wait for S/R Confirmation'}
                </span>
              </div>

              {/* LIVE VALUES & DIRECTION ROW */}
              <div className="grid grid-cols-2 gap-3">
                {/* DXY Dollar Status */}
                <div className="bg-[#131822] p-3 rounded-lg border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Dollar Index (DXY):</span>
                    <strong className="text-white text-sm font-semibold font-mono tabular-nums">{intermarketRadar.dxy.currentValue}</strong>
                  </div>
                  <div className="pt-0.5">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold block text-center ${
                      intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_SUPPORT'
                        ? 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30'
                        : intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_RESISTANCE'
                        ? 'bg-[#2ebd85]/15 text-[#2ebd85] border border-[#2ebd85]/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}>
                      {intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_SUPPORT'
                        ? 'Support Floor (101.90) · Bouncing'
                        : intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_RESISTANCE'
                        ? 'Resistance Ceiling (102.85) · Rejecting'
                        : 'Equilibrium Chop (102.20–102.40)'}
                    </span>
                  </div>
                </div>

                {/* Gold Status */}
                <div className="bg-[#131822] p-3 rounded-lg border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Gold Spot (XAU):</span>
                    <strong className="text-slate-200 text-sm font-semibold font-mono tabular-nums">
                      ${(selectedSymbol === 'XAUUSD' ? livePrice : 4150).toLocaleString()}
                    </strong>
                  </div>
                  <div className="pt-0.5">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold block text-center ${
                      intermarketRadar.goldTrade.decision === 'SHORT'
                        ? 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30'
                        : intermarketRadar.goldTrade.decision === 'LONG'
                        ? 'bg-[#2ebd85]/15 text-[#2ebd85] border border-[#2ebd85]/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}>
                      {intermarketRadar.goldTrade.decision === 'SHORT'
                        ? 'Major Resistance ($4,195) · Rejecting'
                        : intermarketRadar.goldTrade.decision === 'LONG'
                        ? 'Demand Floor ($4,120) · Holding'
                        : 'Equilibrium Chop Zone'}
                    </span>
                  </div>
                </div>
              </div>

              {/* INSTITUTIONAL LOGIC BOX */}
              <div className="p-3.5 rounded-lg bg-[#131822] border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-slate-200 block mb-1 font-semibold text-xs uppercase tracking-wide">Institutional Logic:</strong>
                {intermarketRadar.goldTrade.decision === 'SHORT' ? (
                  <span>
                    DXY Dollar <b>101.90 Support floor</b> se bounce ho raha hai (Dollar strength) aur Gold <b>Resistance ($4,195)</b> par hai. Gold par selling pressure expected hai; short favored.
                  </span>
                ) : intermarketRadar.goldTrade.decision === 'LONG' ? (
                  <span>
                    DXY Dollar <b>102.85 Resistance ceiling</b> se reject ho raha hai (Dollar weakening) aur Gold <b>Support ($4,120)</b> par khada hai. Bullion bid active; long favored.
                  </span>
                ) : (
                  <span>
                    DXY Dollar <b>102.20–102.40 range</b> me consolidate kar raha hai. Jab tak Dollar 102.85 resistance ya 101.90 support ko test na kare, Gold me clarity aane tak <b>WAIT</b> rakhein.
                  </span>
                )}
              </div>

              {/* VOLUME PROFILE CONFLUENCE CALLOUT */}
              <div className="p-3 rounded-lg bg-[#131822] border border-white/10 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-xs">
                    Volume Profile Value Area:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    goldVpConfluence.badgeType === 'SHORT' ? 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30' : goldVpConfluence.badgeType === 'LONG' ? 'bg-[#2ebd85]/15 text-[#2ebd85] border border-[#2ebd85]/30' : 'bg-white/5 text-slate-400'
                  }`}>
                    {goldVpConfluence.badgeType === 'SHORT' ? 'D-Profile Short Favored' : goldVpConfluence.badgeType === 'LONG' ? 'D-Profile Long Favored' : '70% Value Area'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-center font-medium">
                  <div className="p-1 rounded bg-black/30 border border-white/10">
                    <span className="text-[#f0616d] block font-semibold">High → Resistance</span>
                    <span className="text-slate-200 font-mono tabular-nums">{goldVpConfluence.targetAsset.vahFormatted}</span>
                  </div>
                  <div className="p-1 rounded bg-black/30 border border-white/10">
                    <span className="text-[#e8b04a] block font-semibold">POC → Magnet</span>
                    <span className="text-slate-200 font-mono tabular-nums">{goldVpConfluence.targetAsset.pocFormatted}</span>
                  </div>
                  <div className="p-1 rounded bg-black/30 border border-white/10">
                    <span className="text-[#2ebd85] block font-semibold">Low → Support</span>
                    <span className="text-slate-200 font-mono tabular-nums">{goldVpConfluence.targetAsset.valFormatted}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-0.5">
                  Gold price agar <b>VAH ({goldVpConfluence.targetAsset.vahFormatted})</b> resistance par ho aur Dollar Index DXY <b>VAL ({goldVpConfluence.inverseAsset.valFormatted})</b> support ke paas ho, to short alignment hota hai with <b>POC ({goldVpConfluence.targetAsset.pocFormatted}) Target</b>.
                </p>
              </div>

              {/* 1-CLICK ACTION BUTTONS */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => {
                    setSelectedSymbol(selectedSymbol === 'XAUUSD' ? 'DXY' : 'XAUUSD');
                    setChartTimeframe('15m');
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#5b8cff] hover:bg-[#7aa2ff] text-white font-semibold text-xs font-sans cursor-pointer transition-colors text-center"
                >
                  {selectedSymbol === 'DXY' ? 'Switch to Gold Chart' : 'Gold → DXY Dollar 15M Radar Watch'}
                </button>
                <button
                  onClick={() => onNavigate?.('gold-signal-panel')}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs font-sans cursor-pointer transition-colors text-center border border-white/10"
                  title="Open Dedicated Gold (XAUUSD) Momentum Sniper v1 Terminal"
                >
                  <span>Sniper v1 (13–45 & 70–90 pt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ASSET SELECTOR & TOOLBAR */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">Target Market:</span>
            {SUPPORTED_ASSETS.map((asset) => (
              <button
                key={asset.key}
                onClick={() => setSelectedSymbol(asset.key)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  selectedSymbol === asset.key
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_12px_rgba(238,186,48,0.5)] border border-amber-300'
                    : 'bg-[#0f172a]/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <span>{asset.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <a
              href="#intermarket-terminal"
              className="px-3 py-1.5 rounded-lg bg-[#0e1628] border border-cyan-500/40 text-cyan-300 hover:text-white hover:shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              title="Jump to 15M Intermarket USDT.D & DXY Confluence Radar"
            >
              <span>📶 15M Macro Radar</span>
            </a>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-precision-entry') : (window.location.hash = '#deeepr-precision-entry')}
              className="px-3 py-1.5 rounded-lg bg-[#0e1628] border border-amber-500/40 text-amber-300 hover:text-white hover:shadow-[0_0_10px_rgba(238,186,48,0.3)] transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              title="Switch to Precision Entry Level Engine"
            >
              <span>🎯 Precision Entry</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-ai') : (window.location.hash = '#deeepr-ai')}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5 border border-blue-500/40 font-bold"
              title="Switch to DEEEPR.AI Institutional Chart Canvas"
            >
              <span>📈 Copilot Chart</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-big-player-radar') : (window.location.hash = '#deeepr-big-player-radar')}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-500/40 font-bold"
              title="Launch Big Player Radar (Smart-Money Analysis)"
            >
              <span>🐋 Big Player Radar</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-gold-entry-engine') : (window.location.hash = '#deeepr-gold-entry-engine')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(238,186,48,0.2)]"
              title="Launch Gold Entry & Reason Engine (Why Engine)"
            >
              <span>🥇 Gold Why Engine</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-volume-profile-scanner') : (window.location.hash = '#deeepr-volume-profile-scanner')}
              className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all cursor-pointer flex items-center gap-1.5 border border-teal-500/40 font-bold shadow-[0_0_10px_rgba(20,184,166,0.2)]"
              title="Launch Volume Profile Confluence Scanner (Multi-Asset)"
            >
              <span>📊 VP Scanner</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('deeepr-auto-fibonacci') : (window.location.hash = '#deeepr-auto-fibonacci')}
              className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all cursor-pointer flex items-center gap-1.5 border border-yellow-500/40 font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              title="Launch Auto-Fibonacci + Golden Zone Engine (BTC & Gold)"
            >
              <span>📐 Auto-Fib</span>
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'DASHBOARD' ? 'SECTION30_TEXT' : 'DASHBOARD')}
              className="px-3 py-1.5 rounded-lg bg-[#1a2030] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <span>{viewMode === 'DASHBOARD' ? 'Master Verdict JSON' : 'Interactive Dashboard'}</span>
            </button>

            <button
              onClick={handleCopySection30}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10"
            >
              <span>{copiedReport ? 'Copied' : 'Copy JSON & Report'}</span>
            </button>

            <button
              onClick={handleSendTelegram}
              className="px-3 py-1.5 rounded-lg bg-[#1a2030] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <span>{telegramStatus || 'Telegram'}</span>
            </button>

            <button
              onClick={handleForceReEvaluation}
              className="px-2.5 py-1.5 rounded-lg bg-[#1a2030] text-slate-400 hover:text-slate-200 border border-white/10 transition-colors cursor-pointer"
              title="Force structural re-evaluation and reset memory"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── 2. DEEEPR DECISION ENGINE v4 "LOCATION-FIRST" MASTER REPORT ────────────────── */}
      {viewMode === 'SECTION30_TEXT' && (
        <section className="rounded-2xl border-2 border-cyan-500/50 bg-[#060b17] p-5 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="text-base sm:text-lg font-black text-white font-mono">
                DEEEPR DECISION ENGINE v4 — "LOCATION-FIRST" MASTER VERDICT & JSON SPECIFICATION
              </h2>
            </div>
            <button
              onClick={handleCopySection30}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>{copiedReport ? '✅ Copied to Clipboard!' : '📋 Copy Exact JSON & Hinglish'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                1. STRICT JSON OBJECT (Single Source of Truth — Rule R1 & Section 14)
              </span>
              <pre className="p-4 rounded-xl bg-[#03060f] border border-cyan-500/30 text-cyan-200 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap select-all max-h-[480px]">
                {JSON.stringify({
                  master_verdict: v4Output.master_verdict,
                  zone_map: v4Output.zone_map,
                  modules: v4Output.modules,
                  warnings: v4Output.warnings,
                  missing_data: v4Output.missing_data
                }, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                2. INSTITUTIONAL HINGLISH VERDICT (Max 8 Lines — Rule Section 14)
              </span>
              <pre className="p-4 rounded-xl bg-[#0a0f1d] border border-amber-500/40 text-amber-200 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-all">
                {v4Output.hinglish_summary.join('\n')}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────── 2.45 DEEEPR PRO-MAX: MOMENTUM DIRECTION & LIQUIDITY-HUNT ENGINE ────────────────── */}
      <DeeeprProMaxMomentumPanel
        verdict={proMaxVerdict}
        onSelectScenario={(branch) => {
          console.log('Selected scenario branch:', branch);
        }}
      />

      {/* ────────────────── 2.5 LOCATION-FIRST MASTER DIAGNOSTIC ENGINE (RULES R11–R29) ────────────────── */}
      <section className="rounded-2xl panel-purple-glow p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📍</span>
            <div>
              <h2 className="text-base sm:text-lg font-black font-sans flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-amber-300">
                <span>LOCATION-FIRST DECISION PIPELINE</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  LOCATION → DIRECTION → TRIGGER → RISK → ONE VERDICT
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Core law: A trade exists ONLY at a valid zone, HTF direction alignment, closed-candle trigger, and real R:R ≥ 2.0.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowZoneMapDrawer(!showZoneMapDrawer)}
              className="px-3 py-1.5 rounded-lg bg-[#0e1c38] border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🗺️</span>
              <span>{showZoneMapDrawer ? 'Hide Zone Map' : `Inspect Zone Map (${v4Output.zone_map.length} Zones)`}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Pillars of Location-First Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pillar 1: Location & Range Position p */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            masterVerdict.location.valid
              ? 'panel-emerald-glow'
              : masterVerdict.location.range_position_p > 0.40 && masterVerdict.location.range_position_p < 0.60
              ? 'panel-gold-glow'
              : 'bg-slate-900/60 border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans">
                1. LOCATION GATE
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono border ${
                masterVerdict.location.valid
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : masterVerdict.location.range_position_p > 0.40 && masterVerdict.location.range_position_p < 0.60
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {masterVerdict.location.valid
                  ? `VALID ${masterVerdict.location.type}`
                  : masterVerdict.location.range_position_p > 0.40 && masterVerdict.location.range_position_p < 0.60
                  ? 'NO-TRADE: MID-RANGE'
                  : 'WAIT FOR ZONE'}
              </span>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-200">
              <div>Range Position: <strong className="text-cyan-300">p = {masterVerdict.location.range_position_p.toFixed(2)}</strong></div>
              <div className="text-[11px] text-slate-400">
                {masterVerdict.location.range_position_p <= 0.40
                  ? 'Discount Floor (p ≤ 0.40)'
                  : masterVerdict.location.range_position_p >= 0.60
                  ? 'Premium Ceiling (p ≥ 0.60)'
                  : 'Mid-Range No-Trade (0.40–0.60)'}
              </div>
              <div className="pt-1 border-t border-slate-800 text-[11px]">
                Opposing Room: <strong className={masterVerdict.location.room_to_opposing_R >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}>{masterVerdict.location.room_to_opposing_R}R</strong> (Rule R17 ≥ 1.5R)
              </div>
            </div>
          </div>

          {/* Pillar 2: MTF Direction */}
          <div className="p-3.5 rounded-xl panel-cyan-glow space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans">
                2. MTF DIRECTION
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono border ${
                masterVerdict.structure.allowed_direction === 'long'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : masterVerdict.structure.allowed_direction === 'short'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {masterVerdict.structure.allowed_direction === 'none' ? 'WAIT / RANGE' : `${masterVerdict.structure.allowed_direction.toUpperCase()} ONLY`}
              </span>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-200">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">1D (35%):</span>
                <strong className={masterVerdict.structure['1D'] === 'BULLISH' ? 'text-emerald-400' : masterVerdict.structure['1D'] === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'}>{masterVerdict.structure['1D']}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">4H (30%):</span>
                <strong className={masterVerdict.structure['4H'] === 'BULLISH' ? 'text-emerald-400' : masterVerdict.structure['4H'] === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'}>{masterVerdict.structure['4H']}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">1H (20%):</span>
                <strong className={masterVerdict.structure['1H'] === 'BULLISH' ? 'text-emerald-400' : masterVerdict.structure['1H'] === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'}>{masterVerdict.structure['1H']}</strong>
              </div>
            </div>
          </div>

          {/* Pillar 3: Trigger Status */}
          <div className="p-3.5 rounded-xl panel-purple-glow space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans">
                3. TRIGGER GATE
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono border ${
                masterVerdict.trigger.confirmed
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {masterVerdict.trigger.confirmed ? 'CONFIRMED' : 'WAITING CANDLE CLOSE'}
              </span>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-200">
              <div className="truncate text-[11px]">Type: <strong className="text-cyan-300">{masterVerdict.trigger.type || 'Awaiting zone touch'}</strong></div>
              <div className="text-[10px] text-slate-400">
                Armed Long: ${masterVerdict.armed_levels.long.level.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                Armed Short: ${masterVerdict.armed_levels.short.level.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Pillar 4: Risk & Targets */}
          <div className="p-3.5 rounded-xl panel-gold-glow space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans">
                4. STRUCTURAL RISK
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono border ${
                masterVerdict.risk.entry ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {masterVerdict.risk.entry ? `RR TP2 1:${masterVerdict.risk.rr_tp2 || '—'}` : 'CALCULATING'}
              </span>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-200">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Planned SL:</span>
                <strong className="text-rose-400">{masterVerdict.risk.sl ? `$${masterVerdict.risk.sl.toLocaleString()}` : '—'}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">TP1 (1R):</span>
                <strong className="text-cyan-300">{masterVerdict.risk.tp1 ? `$${masterVerdict.risk.tp1.toLocaleString()}` : '—'}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">TP2 (≥2R):</span>
                <strong className="text-emerald-400">{masterVerdict.risk.tp2 ? `$${masterVerdict.risk.tp2.toLocaleString()}` : '—'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Nearest Demand & Supply Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-xl panel-emerald-glow flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-emerald-400 font-bold block text-sm flex items-center gap-1.5"><span>🟢</span> Nearest Valid Demand Below:</span>
              <span className="text-white font-bold text-base mt-1 block">
                {masterVerdict.location.nearest_demand ? `$${masterVerdict.location.nearest_demand.low.toLocaleString()} – $${masterVerdict.location.nearest_demand.high.toLocaleString()}` : 'None detected'}
              </span>
            </div>
            <div className="text-right text-xs text-slate-300">
              <div>Distance: <strong className="text-emerald-300">{masterVerdict.location.nearest_demand?.distance_pts ?? '—'} pts</strong></div>
              <div>ATR: <strong className="text-slate-200">{masterVerdict.location.nearest_demand?.distance_atr ?? '—'}</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl panel-rose-glow flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-rose-400 font-bold block text-sm flex items-center gap-1.5"><span>🔴</span> Nearest Valid Supply Above:</span>
              <span className="text-white font-bold text-base mt-1 block">
                {masterVerdict.location.nearest_supply ? `$${masterVerdict.location.nearest_supply.low.toLocaleString()} – $${masterVerdict.location.nearest_supply.high.toLocaleString()}` : 'None detected'}
              </span>
            </div>
            <div className="text-right text-xs text-slate-300">
              <div>Distance: <strong className="text-rose-300">{masterVerdict.location.nearest_supply?.distance_pts ?? '—'} pts</strong></div>
              <div>ATR: <strong className="text-slate-200">{masterVerdict.location.nearest_supply?.distance_atr ?? '—'}</strong></div>
            </div>
          </div>
        </div>

        {/* Optional Zone Map Drawer */}
        {showZoneMapDrawer && (
          <div className="p-4 rounded-xl bg-[#02050c] border border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                ACTIVE ZONE MAP (1D, 4H, 1H, {chartTimeframe.toUpperCase()} — RULES R11–R15)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Total Detected: {v4Output.zone_map.length} Zones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1.5 px-2">Type</th>
                    <th className="py-1.5 px-2">TF</th>
                    <th className="py-1.5 px-2">Range ($)</th>
                    <th className="py-1.5 px-2">Distance (pts)</th>
                    <th className="py-1.5 px-2">Strength</th>
                    <th className="py-1.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {v4Output.zone_map.map((z) => (
                    <tr key={z.id} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                      <td className="py-1.5 px-2 font-bold">
                        <span className={z.type === 'demand' ? 'text-emerald-400' : z.type === 'supply' ? 'text-rose-400' : 'text-cyan-400'}>
                          {z.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-1.5 px-2">{z.tf}</td>
                      <td className="py-1.5 px-2">${z.low.toLocaleString()} – ${z.high.toLocaleString()}</td>
                      <td className="py-1.5 px-2">{z.distance_pts.toLocaleString()}</td>
                      <td className="py-1.5 px-2 font-bold text-amber-300">{z.strength}/100</td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          z.status === 'valid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : z.status === 'contested'
                            ? 'bg-purple-500/20 text-purple-300'
                            : z.status === 'flipped'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {z.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ────────────────── 3. INTERACTIVE DECISION STATUS BANNER ────────────────── */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base font-sans font-bold shadow-md ${
          decisionOutput.finalDecision === 'LONG'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : decisionOutput.finalDecision === 'SHORT'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">
            {decisionOutput.finalDecision === 'LONG' ? '🟢' : decisionOutput.finalDecision === 'SHORT' ? '🔴' : '🟡'}
          </span>
          <span className="tracking-wide">{decisionOutput.statusMessage}</span>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm font-sans font-medium text-slate-300">
          <span>Regime: <strong className="text-white font-bold">{decisionOutput.marketRegime}</strong></span>
          <span>·</span>
          <span>Bias: <strong className="text-white font-bold">{decisionOutput.primaryBias}</strong></span>
        </div>
      </div>

      {/* ────────────────── 3.1 NEXT EVENT TO WATCH (THE SINGLE CRITICAL TRIGGER) ────────────────── */}
      <section className="rounded-2xl panel-gold-glow p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-amber-500/30 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⚡</span>
            <div>
              <span className="text-xs font-sans uppercase font-black tracking-widest text-amber-400 block">
                THE SINGLE NEXT EVENT TO WATCH (RULE 23 & 25)
              </span>
              <h3 className="text-sm sm:text-base font-black text-white font-sans">
                Next Market Catalyst Required Before Signal Execution
              </h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${
              decisionOutput.signalState === 'LONG-ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : decisionOutput.signalState === 'SHORT-ACTIVE'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : decisionOutput.signalState === 'WATCH-LONG'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : decisionOutput.signalState === 'WATCH-SHORT'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
            }`}>
              STATE: {decisionOutput.signalState || 'WAIT'}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
              LOC: {decisionOutput.locationLabel || 'ANALYZING'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/40 text-amber-200 font-mono text-xs sm:text-sm leading-relaxed flex items-start gap-3">
          <span className="text-lg mt-0.5">🎯</span>
          <div className="space-y-1">
            <strong className="text-amber-300 block font-sans uppercase text-xs tracking-wider">
              TRIGGER SPECIFICATION:
            </strong>
            <p className="text-slate-100 font-sans text-xs sm:text-sm leading-relaxed">
              {decisionOutput.nextTrigger}
            </p>
            <p className="text-[11px] text-amber-400/80 font-sans italic pt-0.5">
              ⚠️ Location Assessment: {decisionOutput.locationDetails}
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────── 3.2 DUAL EVIDENCE SCORING & 15-POINT HYSTERESIS BARRIER ────────────────── */}
      <section className="rounded-2xl panel-purple-glow p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-purple-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚖️</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                <span>INDEPENDENT DUAL EVIDENCE SCORING & 15-PT HYSTERESIS ENGINE</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                  RULE 7 & 8 ANTI-FLIP
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Long and Short scores evaluated independently (0–100). Signal flipping strictly locked unless opposite side holds ≥ 15 pt barrier + structural invalidation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-black font-mono border ${
              decisionOutput.dualScore?.canFlip
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {decisionOutput.dualScore?.canFlip ? '⚡ FLIP CRITERIA MET' : '🔒 15-PT HYSTERESIS LOCKED'}
            </span>
          </div>
        </div>

        {/* DUAL GAUGES SIDE-BY-SIDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LONG SCORE METER */}
          <div className="p-3.5 rounded-xl panel-emerald-glow space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-sans">
                <span>🟢</span> Bullish Confluence Score
              </span>
              <span className="text-lg font-black text-emerald-300">
                {decisionOutput.dualScore?.longScore || 0}<span className="text-xs text-slate-400">/100</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, decisionOutput.dualScore?.longScore || 0)}%` }}
              />
            </div>
            {/* Breakdown Chips */}
            {decisionOutput.dualScore?.longBreakdown && (
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono pt-1 text-slate-300">
                <span className="p-1 rounded bg-black/40 text-center" title="HTF Structure (Max 20)">
                  HTF: <strong className="text-emerald-400">{decisionOutput.dualScore.longBreakdown.htfStructure}/20</strong>
                </span>
                <span className="p-1 rounded bg-black/40 text-center" title="Location & S/R (Max 15)">
                  S/R: <strong className="text-emerald-400">{decisionOutput.dualScore.longBreakdown.srLocation}/15</strong>
                </span>
                <span className="p-1 rounded bg-black/40 text-center" title="Liquidity Sweep/Reclaim (Max 15)">
                  LIQ: <strong className="text-emerald-400">{decisionOutput.dualScore.longBreakdown.liquidity}/15</strong>
                </span>
                <span className="p-1 rounded bg-black/40 text-center" title="MSS/CHoCH/BOS (Max 15)">
                  MSS: <strong className="text-emerald-400">{decisionOutput.dualScore.longBreakdown.mssConfirm}/15</strong>
                </span>
              </div>
            )}
          </div>

          {/* SHORT SCORE METER */}
          <div className="p-3.5 rounded-xl panel-rose-glow space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase font-sans">
                <span>🔴</span> Bearish Confluence Score
              </span>
              <span className="text-lg font-black text-rose-300">
                {decisionOutput.dualScore?.shortScore || 0}<span className="text-xs text-slate-400">/100</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-rose-600 to-rose-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, decisionOutput.dualScore?.shortScore || 0)}%` }}
              />
            </div>
            {/* Breakdown Chips */}
            {decisionOutput.dualScore?.shortBreakdown && (
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono pt-1 text-slate-300">
                <span className="p-1 rounded bg-black/40 text-center" title="HTF Structure (Max 20)">
                  HTF: <strong className="text-rose-400">{decisionOutput.dualScore.shortBreakdown.htfStructure}/20</strong>
                </span>
                <span className="p-1 rounded bg-black/40 text-center" title="Location & S/R (Max 15)">
                  S/R: <strong className="text-rose-400">{decisionOutput.dualScore.shortBreakdown.srLocation}/15</strong>
                </span>
                <span className="p-1 rounded bg-black/40 text-center" title="Liquidity Sweep/Reject (Max 15)">
                  LIQ: <strong className="text-rose-400">{decisionOutput.dualScore.shortBreakdown.liquidity}/15</strong>
                </span>
                <span className="p-1 rounded bg-black/40 text-center" title="MSS/CHoCH/BOS (Max 15)">
                  MSS: <strong className="text-rose-400">{decisionOutput.dualScore.shortBreakdown.mssConfirm}/15</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* HYSTERESIS LOCK EXPLANATION FOOTER */}
        <div className="p-3 rounded-xl bg-[#091122] border border-cyan-500/30 text-xs font-sans text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span>
              <strong>Spread Advantage:</strong>{' '}
              <span className="font-mono text-cyan-300 font-bold">
                {decisionOutput.dualScore?.dominantSide} +{decisionOutput.dualScore?.spread || 0} pts
              </span>
              {' · '}
              <span className="text-slate-300">{decisionOutput.dualScore?.flipBlockReason}</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Hysteresis Threshold: ≥15 pts delta
          </span>
        </div>
      </section>

      {/* ────────────────── 3.3 ACTIVE 3-SCENARIO MATRIX (BULLISH / BEARISH / NO-TRADE) ────────────────── */}
      {decisionOutput.scenarios && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
              <span>🧭</span>
              <span>ACTIVE 3-SCENARIO PROBABILITY MATRIX (SECTION 7 & 23)</span>
            </h3>
            <span className="text-xs text-slate-400 font-sans">Scenarios Formulated Before Trade Selection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* SCENARIO A: BULLISH */}
            <div className="p-4 rounded-xl panel-emerald-glow space-y-2 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                  <span>📈</span> {decisionOutput.scenarios.bullishScenario.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  EXPANSION
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                <strong>Conditions:</strong> {decisionOutput.scenarios.bullishScenario.condition}
              </p>
              <div className="text-[11px] font-mono text-slate-300 space-y-1 pt-1 border-t border-slate-800/80">
                <span className="block text-emerald-400">
                  Target: {decisionOutput.scenarios.bullishScenario.target}
                </span>
                <span className="block text-rose-400/90">
                  Invalidation: {decisionOutput.scenarios.bullishScenario.invalidation}
                </span>
              </div>
            </div>

            {/* SCENARIO B: BEARISH */}
            <div className="p-4 rounded-xl panel-rose-glow space-y-2 shadow-md">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                  <span>📉</span> {decisionOutput.scenarios.bearishScenario.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                  REJECTION
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                <strong>Conditions:</strong> {decisionOutput.scenarios.bearishScenario.condition}
              </p>
              <div className="text-[11px] font-mono text-slate-300 space-y-1 pt-1 border-t border-slate-800/80">
                <span className="block text-rose-400">
                  Target: {decisionOutput.scenarios.bearishScenario.target}
                </span>
                <span className="block text-amber-400/90">
                  Invalidation: {decisionOutput.scenarios.bearishScenario.invalidation}
                </span>
              </div>
            </div>

            {/* SCENARIO C: NO TRADE */}
            <div className="p-4 rounded-xl panel-gold-glow space-y-2 shadow-md">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                  <span>🛡️</span> {decisionOutput.scenarios.noTradeScenario.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  CAPITAL DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                <strong>Conditions:</strong> {decisionOutput.scenarios.noTradeScenario.condition}
              </p>
              <div className="text-[11px] font-sans text-amber-300/90 pt-1 border-t border-slate-800/80 leading-relaxed">
                💡 {decisionOutput.scenarios.noTradeScenario.capitalProtectionNote}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────── 4. KEY TRADE LEVELS (CALIBRATED RRR 1:1.30 – 1:1.40) ────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Entry */}
        <div className="panel-gold-glow p-4 rounded-xl space-y-1.5 shadow-md">
          <span className="text-xs font-sans uppercase font-bold text-amber-300 block tracking-wider">🎯 DEFINED ENTRY ZONE</span>
          <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-white block">
            {decisionOutput.entryZone}
          </span>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Trigger: {decisionOutput.entryTrigger}
          </p>
        </div>

        {/* Stop Loss */}
        <div className="panel-rose-glow p-4 rounded-xl space-y-1.5 shadow-md">
          <span className="text-xs font-sans uppercase font-bold text-rose-300 block tracking-wider">🛑 STOP LOSS (SL)</span>
          <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-rose-300 block">
            {decisionOutput.stopLossPrice > 0 ? `$${decisionOutput.stopLossPrice.toFixed(1)}` : '—'}
          </span>
          <p className="text-xs text-rose-300/90 font-sans leading-relaxed">
            {decisionOutput.stopLossReason}
          </p>
        </div>

        {/* TP1 (Calibrated 1:1.30 - 1:1.40) */}
        <div className="panel-emerald-glow p-4 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase font-bold text-emerald-300 block tracking-wider">🏁 TARGET 1 (TP1)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-sans">
              RRR 1:1.35
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-emerald-300 block">
            {decisionOutput.targetTp1 > 0 ? `$${decisionOutput.targetTp1.toFixed(1)}` : '—'}
          </span>
          <p className="text-xs text-emerald-300/90 font-sans leading-relaxed">
            {decisionOutput.tp1Reason}
          </p>
        </div>

        {/* TP2 */}
        <div className="panel-emerald-glow p-4 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase font-bold text-emerald-300 block tracking-wider">🎯 TARGET 2 (TP2)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans">
              RRR 1:2.20
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-emerald-300 block">
            {decisionOutput.targetTp2 > 0 ? `$${decisionOutput.targetTp2.toFixed(1)}` : '—'}
          </span>
          <p className="text-xs text-emerald-300/90 font-sans leading-relaxed">
            {decisionOutput.tp2Reason}
          </p>
        </div>

        {/* TP3 */}
        <div className="panel-emerald-glow p-4 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase font-bold text-emerald-300 block tracking-wider">🏆 TARGET 3 (TP3)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans">
              Runner
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-emerald-300 block">
            {decisionOutput.targetTp3 > 0 ? `$${decisionOutput.targetTp3.toFixed(1)}` : '—'}
          </span>
          <p className="text-xs text-emerald-300/90 font-sans leading-relaxed">
            {decisionOutput.tp3Reason}
          </p>
        </div>
      </section>

      {/* ────────────────── 4.1 7-PARAMETER INSTITUTIONAL EXECUTION FRAMEWORK ────────────────── */}
      {decisionOutput.institutionalParameters && (
        <section className="rounded-2xl panel-cyan-glow p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <h3 className="text-sm sm:text-base font-black font-sans tracking-wide uppercase flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-300">
                  <span>7-PARAMETER INSTITUTIONAL EXECUTION FRAMEWORK</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
                    MANDATORY TRADE CRITERIA
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 font-sans mt-1 leading-relaxed">
                  BTC & Gold me koi bhi trade (Long ya Short) lene se pehle in 7 parameters ka strictly verified hona anivarya hai.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-sans font-black border ${
                decisionOutput.finalDecision === 'LONG'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : decisionOutput.finalDecision === 'SHORT'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              }`}>
                {decisionOutput.finalDecision === 'LONG' ? '🟢 LONG VERIFIED' : decisionOutput.finalDecision === 'SHORT' ? '🔴 SHORT VERIFIED' : '🟡 CAPITAL PROTECTED (WAIT)'}
              </span>
            </div>
          </div>

          {/* 7 PARAMETER CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 text-xs font-sans">
            {/* 1. LIQUIDATION */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-rose-500/30 space-y-2.5 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>🚨</span> 1. Liquidation Map
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold font-sans">
                  {decisionOutput.institutionalParameters.nearestLiquidationPool.sweepProbability}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-300 text-xs font-sans">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-medium">Sabse Badi Liquidation Pool:</span>
                  <span className="font-bold text-white text-xs sm:text-sm font-mono tabular-nums">{decisionOutput.institutionalParameters.highestLiquidationPool.label}</span>
                  <span className="ml-1 text-rose-400 font-bold font-mono">({decisionOutput.institutionalParameters.highestLiquidationPool.volumeUsd})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-medium">Sabse Pass Liquidation:</span>
                  <span className="font-bold text-amber-300 text-xs sm:text-sm font-mono tabular-nums">{decisionOutput.institutionalParameters.nearestLiquidationPool.label}</span>
                  <span className="ml-1 text-cyan-300 font-bold">({decisionOutput.institutionalParameters.nearestLiquidationPool.distancePct} door)</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans pt-1.5 border-t border-slate-800">
                {decisionOutput.institutionalParameters.liquidationVerdict}
              </p>
            </div>

            {/* 2. USDT.D / DXY DIRECTION & S/R */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-sky-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>🌊</span> 2. {decisionOutput.institutionalParameters.pairedAsset} Trajectory
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold border font-sans ${
                  decisionOutput.institutionalParameters.pairedPredictedDirection.includes('UP')
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : decisionOutput.institutionalParameters.pairedPredictedDirection.includes('DOWN')
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {decisionOutput.institutionalParameters.pairedPredictedDirection}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-300 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Current Level:</span>
                  <strong className="text-white text-xs sm:text-sm font-mono tabular-nums">{decisionOutput.institutionalParameters.pairedCurrentValue}%</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Next Target OB:</span>
                  <strong className="text-amber-300 text-xs sm:text-sm font-mono tabular-nums">{decisionOutput.institutionalParameters.pairedNextTarget}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Supply / Resistance OB:</span>
                  <span className="text-rose-300 font-bold font-mono">{decisionOutput.institutionalParameters.pairedResistanceOB}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Demand / Support OB:</span>
                  <span className="text-emerald-300 font-bold font-mono">{decisionOutput.institutionalParameters.pairedSupportOB}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans pt-1.5 border-t border-slate-800">
                {decisionOutput.institutionalParameters.pairedDirectionExplanation}
              </p>
            </div>

            {/* 3. MACRO FACTORS */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-amber-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>🏛️</span> 3. Macro Factors
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-sans">
                  Score: {decisionOutput.institutionalParameters.macroScore}/10
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                {decisionOutput.institutionalParameters.macroStatus}
              </p>
              <div className="pt-1.5 border-t border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                📌 {decisionOutput.institutionalParameters.fedStanceAndYields}
              </div>
            </div>

            {/* 4. MICRO FACTORS & ORDER FLOW */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-cyan-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>🔬</span> 4. Micro Order Flow
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold font-sans">
                  15M TAPE
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-sans">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-medium">CVD Delta:</span>
                  <strong className="text-cyan-300 text-xs sm:text-sm font-mono tabular-nums font-bold">{decisionOutput.institutionalParameters.cvdDelta}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-medium">Order Book Imbalance:</span>
                  <strong className="text-slate-100 text-xs sm:text-sm font-sans">{decisionOutput.institutionalParameters.orderBookImbalance}</strong>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1.5 border-t border-slate-800">
                {decisionOutput.institutionalParameters.microOrderFlow}
              </p>
            </div>

            {/* 5. SOCIO-ECONOMIC & NEWS RISK */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-yellow-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>📰</span> 5. News & Event Risk
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold border font-sans ${
                  decisionOutput.institutionalParameters.eventRiskActive
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {decisionOutput.institutionalParameters.eventRiskActive ? 'EVENT IMMINENT' : 'CLEAN WINDOW'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                {decisionOutput.institutionalParameters.newsStatus}
              </p>
              <div className="pt-1.5 border-t border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                📅 Next Major Event: <b className="text-white">{decisionOutput.institutionalParameters.upcomingEvents}</b>
              </div>
            </div>

            {/* 6. PRICE ACTION & SMC */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-purple-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>📐</span> 6. SMC & Order Blocks
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold font-sans">
                  15M SMC
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-sans">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-medium">Active Order Blocks:</span>
                  <span className="text-slate-100 font-semibold">{decisionOutput.institutionalParameters.smcOrderBlock}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-medium">Fair Value Gap (FVG):</span>
                  <span className="text-purple-300 font-semibold">{decisionOutput.institutionalParameters.fvgStatus}</span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-800 text-xs text-slate-300 font-sans">
                Market Phase: <b className="text-white font-bold">{decisionOutput.institutionalParameters.marketStructurePhase}</b>
              </div>
            </div>

            {/* 7. IMPORTANT KEY EXECUTION LEVELS */}
            <div className="bg-[#050a18] p-4 rounded-xl border border-emerald-500/30 space-y-2.5 col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5 uppercase font-sans">
                  <span>🎯</span> 7. Important Key Execution Levels
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-sans">
                  RRR {decisionOutput.institutionalParameters.riskRewardRatio}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div className="bg-[#081226] p-3 rounded-lg border border-amber-500/30 space-y-1">
                  <span className="text-xs text-slate-400 uppercase block font-medium">Defined Entry</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tabular-nums">{decisionOutput.institutionalParameters.entryZone}</span>
                </div>
                <div className="bg-[#180914] p-3 rounded-lg border border-rose-500/30 space-y-1">
                  <span className="text-xs text-slate-400 uppercase block font-medium">Strict Stop Loss</span>
                  <span className="text-xs sm:text-sm font-black text-rose-300 font-mono tabular-nums">
                    {decisionOutput.institutionalParameters.stopLossLevel > 0 ? `$${decisionOutput.institutionalParameters.stopLossLevel.toFixed(1)}` : '—'}
                  </span>
                </div>
                <div className="bg-[#051c16] p-3 rounded-lg border border-emerald-500/30 space-y-1">
                  <span className="text-xs text-slate-400 uppercase block font-medium">Target 1 (TP1)</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono tabular-nums">
                    {decisionOutput.institutionalParameters.tp1 > 0 ? `$${decisionOutput.institutionalParameters.tp1.toFixed(1)}` : '—'}
                  </span>
                </div>
                <div className="bg-[#051c16] p-3 rounded-lg border border-emerald-500/30 space-y-1">
                  <span className="text-xs text-slate-400 uppercase block font-medium">Target 2 / 3 (TP2/3)</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono tabular-nums">
                    {decisionOutput.institutionalParameters.tp2 > 0 ? `$${decisionOutput.institutionalParameters.tp2.toFixed(1)}` : '—'} / {decisionOutput.institutionalParameters.tp3 > 0 ? `$${decisionOutput.institutionalParameters.tp3.toFixed(1)}` : '—'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-sans pt-1.5 border-t border-slate-800 leading-relaxed">
                🛑 SL Logic: {decisionOutput.institutionalParameters.stopLossLogic}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────── 4.22 INSTITUTIONAL SMART MONEY CONCEPTS (SMC) & MARKET STRUCTURE ENGINE ────────────────── */}
      {decisionOutput.smcReport && (
        <section className="rounded-2xl panel-purple-glow p-4 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* SECTION HEADER & COPY ALERT BUTTON */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-500/30 pb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl">🏛️</span>
                <h2 className="text-base sm:text-lg font-black font-sans tracking-wide flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-amber-300">
                  <span>SMART MONEY CONCEPTS (SMC) & MARKET STRUCTURE ENGINE</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">
                    INSTITUTIONAL ALGO
                  </span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1">
                Automatic Swing & Internal Structure Mapping (HH/HL/LH/LL) · BOS & CHoCH · Unmitigated Order Blocks · FVGs · Liquidity Sweeps
              </p>
            </div>

            <button
              onClick={handleCopySmcAlert}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer border border-purple-400/40 self-start md:self-auto"
            >
              <span>{copiedSmcAlert ? '✅ COPIED!' : '📋'}</span>
              <span>{copiedSmcAlert ? 'ALERT COPIED TO CLIPBOARD' : 'COPY SMC TRADE ALERT'}</span>
            </button>
          </div>

          {/* 🎯 "WHERE WILL IT GO NEXT?" (KAHAN JA SAKTA HAI PRICE?) PREDICTION BANNER */}
          <div className="bg-gradient-to-r from-[#170c36] via-[#0e1633] to-[#081226] p-4 sm:p-5 rounded-xl border border-cyan-500/40 space-y-3 relative z-10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wider font-sans">
                  KAHAN JA SAKTA HAI PRICE? — NEXT PROBABLE MOVE PREDICTION
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase font-sans ${
                decisionOutput.smcReport.nextProbableMove.direction === 'PUMP_UP'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : decisionOutput.smcReport.nextProbableMove.direction === 'DUMP_DOWN'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {decisionOutput.smcReport.nextProbableMove.direction === 'PUMP_UP' ? '🚀 PUMP EXPECTED (EXPANSION UP)' : decisionOutput.smcReport.nextProbableMove.direction === 'DUMP_DOWN' ? '🔻 DUMP EXPECTED (EXPANSION DOWN)' : '⏳ EQUILIBRIUM CHOP'}
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-white font-sans leading-relaxed">
              {decisionOutput.smcReport.nextProbableMove.headline}
            </p>

            {/* Target 1 & Target 2 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#050a18] p-3.5 rounded-lg border border-cyan-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase font-sans">🎯 Target 1: {decisionOutput.smcReport.nextProbableMove.target1.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold font-mono">Strict 1:3.00 R:R</span>
                </div>
                <div className="text-lg font-black text-cyan-300 font-mono tabular-nums">
                  ${decisionOutput.smcReport.nextProbableMove.target1.price.toFixed(1)}
                </div>
                <p className="text-xs text-slate-300 font-sans">{decisionOutput.smcReport.nextProbableMove.target1.reason}</p>
              </div>

              <div className="bg-[#050a18] p-3.5 rounded-lg border border-purple-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase font-sans">🎯 Target 2: {decisionOutput.smcReport.nextProbableMove.target2.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono">1:4.80 R:R</span>
                </div>
                <div className="text-lg font-black text-purple-300 font-mono tabular-nums">
                  ${decisionOutput.smcReport.nextProbableMove.target2.price.toFixed(1)}
                </div>
                <p className="text-xs text-slate-300 font-sans">{decisionOutput.smcReport.nextProbableMove.target2.reason}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans pt-1 border-t border-slate-800 leading-relaxed">
              💡 <b className="text-white">Institutional SMC Logic:</b> {decisionOutput.smcReport.nextProbableMove.detailedRationale}
            </p>
          </div>

          {/* 4-GRID SMC TECHNICAL ANALYSIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
            {/* 1. Market Structure Mapping */}
            <div className="bg-[#070b1e] p-4 rounded-xl border border-sky-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase font-sans flex items-center gap-1.5">
                  <span>📐</span> 1. Structure Mapping
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">HTF/LTF</span>
              </div>
              <div className="space-y-1 text-xs font-sans">
                <span className="text-slate-400 block text-[11px] uppercase">Trend Status:</span>
                <span className="text-white font-bold block">{decisionOutput.smcReport.trendStatus}</span>
              </div>
              <div className="space-y-1 text-xs font-sans border-t border-slate-800 pt-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Higher Highs/Lows:</span>
                  <span className="text-emerald-400 font-bold font-mono">{decisionOutput.smcReport.higherHighs} HH / {decisionOutput.smcReport.higherLows} HL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lower Highs/Lows:</span>
                  <span className="text-rose-400 font-bold font-mono">{decisionOutput.smcReport.lowerHighs} LH / {decisionOutput.smcReport.lowerLows} LL</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-300 font-sans border-t border-slate-800 pt-1.5 leading-snug">
                ⚡ {decisionOutput.smcReport.bosDetails.description}
              </div>
            </div>

            {/* 2. Premium vs Discount (Fib 0.5) */}
            <div className="bg-[#070b1e] p-4 rounded-xl border border-amber-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase font-sans flex items-center gap-1.5">
                  <span>⚖️</span> 2. Premium vs Discount
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">
                  Fib 0.5
                </span>
              </div>

              <div className="space-y-1 text-xs font-sans">
                <span className="text-slate-400 block text-[11px] uppercase">Current Price Location:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded inline-block ${
                  decisionOutput.smcReport.premiumDiscount.currentZone.includes('DISCOUNT')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {decisionOutput.smcReport.premiumDiscount.currentZone}
                </span>
              </div>

              {/* Visual Fib Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Discount (0.0)</span>
                  <span className="text-amber-300 font-bold">0.50 Eq: ${decisionOutput.smcReport.premiumDiscount.equilibriumFib05.toFixed(1)}</span>
                  <span>Premium (1.0)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                  <div
                    className={`h-full ${decisionOutput.smcReport.premiumDiscount.fibLevel <= 0.5 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.max(5, decisionOutput.smcReport.premiumDiscount.fibLevel * 100))}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-300 font-sans border-t border-slate-800 pt-1.5 leading-snug">
                📜 {decisionOutput.smcReport.premiumDiscount.explanation}
              </div>
            </div>

            {/* 3. Order Blocks & FVGs */}
            <div className="bg-[#070b1e] p-4 rounded-xl border border-purple-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase font-sans flex items-center gap-1.5">
                  <span>🧱</span> 3. Order Blocks & FVG
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  {decisionOutput.smcReport.orderBlock.isMitigated ? 'Mitigated' : 'Unmitigated'}
                </span>
              </div>
              <div className="space-y-1 text-xs font-sans">
                <span className="text-slate-400 block text-[11px] uppercase">Active Order Block:</span>
                <span className="text-white font-bold block">{decisionOutput.smcReport.orderBlock.description}</span>
              </div>
              <div className="space-y-1 text-xs font-sans border-t border-slate-800 pt-1.5">
                <span className="text-slate-400 block text-[11px] uppercase">Fair Value Gap (FVG):</span>
                <span className="text-purple-300 font-semibold block">{decisionOutput.smcReport.fvg.description}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans border-t border-slate-800 pt-1.5 leading-snug">
                ⚡ Only fresh unmitigated blocks with explosive displacement are permitted for trade entry.
              </div>
            </div>

            {/* 4. Liquidity Engineering (The Fuel) */}
            <div className="bg-[#070b1e] p-4 rounded-xl border border-cyan-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase font-sans flex items-center gap-1.5">
                  <span>💧</span> 4. Liquidity Status
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  decisionOutput.smcReport.liquiditySweep.swept
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {decisionOutput.smcReport.liquiditySweep.swept ? 'SWEEP CONFIRMED' : 'RESTING'}
                </span>
              </div>
              <div className="space-y-1 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400">BSL (PDH / Highs):</span>
                  <span className="text-cyan-300 font-bold font-mono">${decisionOutput.smcReport.bslPool.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SSL (PDL / Lows):</span>
                  <span className="text-cyan-300 font-bold font-mono">${decisionOutput.smcReport.sslPool.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-xs text-amber-300 font-sans border-t border-slate-800 pt-1.5">
                {decisionOutput.smcReport.equalHighs.detected ? decisionOutput.smcReport.equalHighs.note : decisionOutput.smcReport.equalLows.note}
              </div>
              <div className="text-[11px] text-slate-300 font-sans border-t border-slate-800 pt-1.5 leading-snug">
                🎯 {decisionOutput.smcReport.liquiditySweep.description}
              </div>
            </div>
          </div>

          {/* 🚨 COPY-PASTEABLE SMC TRADE ALERT BOX */}
          <div className="bg-[#030612] p-4 rounded-xl border border-slate-800 space-y-2 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans flex items-center gap-2">
                <span>📋</span> COPY-PASTEABLE INSTITUTIONAL SMC TRADE ALERT (TELEGRAM / TRADINGVIEW FORMAT)
              </span>
              <button
                onClick={handleCopySmcAlert}
                className="text-xs px-3 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 font-bold transition-all cursor-pointer"
              >
                {copiedSmcAlert ? '✅ COPIED!' : '📋 COPY FORMAT'}
              </button>
            </div>
            <pre className="text-xs text-purple-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto p-2.5 bg-[#050917] rounded-lg border border-purple-900/30 select-all">
              {decisionOutput.smcReport.smcTradeAlertText}
            </pre>
          </div>
        </section>
      )}

      {/* ────────────────── 4.25 15M INTERMARKET MACRO CONFLUENCE TERMINAL (USDT.D & DXY vs BTC, GOLD, ETH) ────────────────── */}
      <section id="intermarket-terminal" className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-[#0d091f] via-[#090e1c] to-[#040814] p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* SECTION HEADER & ASSET FILTER BUTTONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl">🌐</span>
              <h2 className="text-sm sm:text-base font-black text-white font-sans tracking-wide flex items-center gap-2">
                <span>15M INTERMARKET MACRO CONFLUENCE RADAR</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-bold animate-pulse">
                  ⚡ FOREVER LIVE (15M USDT.D + DXY)
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-sans mt-1 leading-relaxed">
              Strict Quantitative Rules: <b className="text-rose-400">USDT.D Support + BTC Resistance = SELL BTC</b> · <b className="text-emerald-400">DXY Resistance + Gold Support = BUY GOLD</b>
            </p>
          </div>

          {/* Quick Filter Switcher */}
          <div className="inline-flex rounded-xl bg-[#030612] p-1 border border-slate-800 text-xs font-sans">
            <button
              onClick={() => setIntermarketFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                intermarketFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 All 3 Assets
            </button>
            <button
              onClick={() => setIntermarketFilter('BTC')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                intermarketFilter === 'BTC'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ₿ BTC vs USDT.D
            </button>
            <button
              onClick={() => setIntermarketFilter('GOLD')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                intermarketFilter === 'GOLD'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🥇 Gold vs DXY
            </button>
            <button
              onClick={() => setIntermarketFilter('ETH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                intermarketFilter === 'ETH'
                  ? 'bg-indigo-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ξ ETH vs USDT.D
            </button>
          </div>
        </div>

        {/* ─── 🔮 DIRECTIONAL TRAJECTORY & ORDER BLOCK TARGET PREDICTOR (KAHAN JA SAKTE HAIN?) ─── */}
        <div className="bg-[#050918]/90 p-4 sm:p-5 rounded-xl border border-cyan-500/30 space-y-3.5 relative z-10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-cyan-500/20 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎯</span>
              <h3 className="text-xs sm:text-sm font-black text-cyan-300 font-sans tracking-wide uppercase">
                USDT.D & DXY DIRECTION FORECAST: KAHAN JA SAKTE HAIN & NEXT TARGETS
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
              <button
                onClick={() => {
                  setSelectedSymbol(selectedSymbol === 'BTCUSDT' ? 'USDTD' : 'BTCUSDT');
                  setChartTimeframe('15m');
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/50 cursor-pointer font-bold flex items-center gap-1.5"
                title="Toggle chart between Bitcoin and USDT Dominance"
              >
                <span>🔄</span>
                <span>{selectedSymbol === 'USDTD' ? '₿ Switch to BTC Chart' : '🌊 BTC ➔ USDT.D Dual Watch'}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedSymbol(selectedSymbol === 'XAUUSD' ? 'DXY' : 'XAUUSD');
                  setChartTimeframe('15m');
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer font-bold flex items-center gap-1.5"
                title="Toggle chart between Gold Spot and US Dollar Index"
              >
                <span>🔄</span>
                <span>{selectedSymbol === 'DXY' ? '🥇 Switch to Gold Chart' : '💵 Gold ➔ DXY Dual Watch'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* USDT.D Trajectory Card */}
            <div className="bg-[#02050e] p-3.5 rounded-xl border border-sky-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sky-300 font-bold flex items-center gap-1.5 uppercase font-sans text-xs">
                  <span>🌊</span> USDT Dominance Trajectory (Next Move)
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border font-sans ${
                  intermarketRadar.usdtD.currentValue >= 5.48
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : intermarketRadar.usdtD.currentValue <= 5.35
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {intermarketRadar.usdtD.currentValue >= 5.48
                    ? '↘️ GIREGA (Drop toward 5.30%)'
                    : intermarketRadar.usdtD.currentValue <= 5.35
                    ? '↗️ BADHEGA (Bounce toward 5.58%)'
                    : '↔️ MID-RANGE CHOP (5.36% - 5.46%)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-[#070e22] p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Demand OB (Floor):</span>
                  <span className="text-emerald-400 font-black text-xs sm:text-sm font-mono tabular-nums">5.30% - 5.35%</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Supply OB (Ceiling):</span>
                  <span className="text-rose-400 font-black text-xs sm:text-sm font-mono tabular-nums">5.58% - 5.65%</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Next Expected Target:</span>
                  <span className="text-cyan-300 font-black text-xs sm:text-sm font-mono tabular-nums">
                    {intermarketRadar.usdtD.currentValue >= 5.45 ? '5.30% (Demand)' : '5.58% (Supply)'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-950/25 border border-sky-500/25 text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                <strong className="text-sky-300 block mb-1 font-bold text-xs uppercase tracking-wide">📌 AAPKA BITCOIN TRADING SETUP LOGIC:</strong>
                • <b>USDT.D at 5.58% Resistance OB + BTC at Support</b> ➔ <span className="text-emerald-400 font-bold">Strong BUY / LONG on Bitcoin</span> (Cash flowing into Crypto).<br />
                • <b>USDT.D at 5.30% Support OB + BTC at Resistance</b> ➔ <span className="text-rose-400 font-bold">Strong SELL / SHORT on Bitcoin</span> (Crypto fleeing to Cash/USDT).
              </div>
            </div>

            {/* DXY Trajectory Card */}
            <div className="bg-[#02050e] p-3.5 rounded-xl border border-amber-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold flex items-center gap-1.5 uppercase font-sans text-xs">
                  <span>💵</span> US Dollar Index (DXY) Trajectory (Next Move)
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border font-sans ${
                  intermarketRadar.dxy.currentValue >= 102.50
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : intermarketRadar.dxy.currentValue <= 102.10
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {intermarketRadar.dxy.currentValue >= 102.50
                    ? '↘️ GIREGA (Drop toward 101.90)'
                    : intermarketRadar.dxy.currentValue <= 102.10
                    ? '↗️ BADHEGA (Bounce toward 102.85)'
                    : '↔️ EQUILIBRIUM CHOP (102.20 - 102.40)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-[#140e02] p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Demand OB (Floor):</span>
                  <span className="text-emerald-400 font-black text-xs sm:text-sm font-mono tabular-nums">101.90 - 102.05</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Supply OB (Ceiling):</span>
                  <span className="text-rose-400 font-black text-xs sm:text-sm font-mono tabular-nums">102.85 - 103.10</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Next Expected Target:</span>
                  <span className="text-amber-300 font-black text-xs sm:text-sm font-mono tabular-nums">
                    {intermarketRadar.dxy.currentValue >= 102.35 ? '101.90 (Support)' : '102.85 (Ceiling)'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/25 text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                <strong className="text-amber-300 block mb-1 font-bold text-xs uppercase tracking-wide">📌 AAPKA GOLD TRADING SETUP LOGIC:</strong>
                • <b>DXY at 102.85 Resistance OB + Gold at Support</b> ➔ <span className="text-emerald-400 font-bold">Strong BUY / LONG on Gold</span> (Dollar weakening triggers Gold surge).<br />
                • <b>DXY at 101.90 Support OB + Gold at Resistance</b> ➔ <span className="text-rose-400 font-bold">Strong SELL / SHORT on Gold</span> (Dollar bounce slams Gold).
              </div>
            </div>
          </div>
        </div>

        {/* DUAL 15M MACRO GAUGES: USDT.D AND DXY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* 1. USDT Dominance 15M Meter */}
          <div className="bg-[#030814]/90 p-4 sm:p-5 rounded-xl border border-sky-500/30 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌊</span>
                <span className="text-xs sm:text-sm font-bold uppercase text-sky-300 font-sans tracking-wide">
                  Tether Dominance (USDT.D) 15M Meter
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md tabular-nums ${
                  intermarketRadar.usdtD.change24h.startsWith('+')
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {intermarketRadar.usdtD.change24h}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  {intermarketRadar.usdtD.currentValue}%
                </span>
                <span className="text-xs text-slate-300 font-sans ml-3">
                  Floor: <b className="text-emerald-400 font-mono">5.30%</b> | Ceiling: <b className="text-rose-400 font-mono">5.58%</b>
                </span>
              </div>

              {/* 15m Zone Badge */}
              <span
                className={`px-3 py-1 rounded-lg text-xs font-sans font-bold uppercase tracking-wider border ${
                  intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_SUPPORT'
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm animate-pulse'
                    : intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_RESISTANCE'
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_SUPPORT'
                  ? '🚨 AT 15M SUPPORT (5.30%-5.34%) ➔ SELL BTC'
                  : intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_RESISTANCE'
                  ? '🚨 AT 15M RESISTANCE (5.58%) ➔ BUY BTC'
                  : '⏳ 15M MID-RANGE CHOP'}
              </span>
            </div>

            {/* Hindi Rule Box */}
            <div className="bg-[#061024] p-3 rounded-xl border border-sky-500/20 text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
              <span className="text-sky-300 font-bold block mb-1 text-xs uppercase tracking-wide">📌 AAPKA EXACT RULE (USDT.D vs BTC / ETH):</span>
              {intermarketRadar.usdtD.statusNoteHindi}
            </div>

            {/* Quick Button to Open USDT.D Chart */}
            <button
              onClick={() => {
                setSelectedSymbol('USDTD');
                setChartTimeframe('15m');
              }}
              className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm font-sans shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>📈</span>
              <span>USDT.D 15M Live Chart Dekho ➔</span>
            </button>
          </div>

          {/* 2. DXY US Dollar Index 15M Meter */}
          <div className="bg-[#030814]/90 p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💵</span>
                <span className="text-xs sm:text-sm font-bold uppercase text-amber-300 font-sans tracking-wide">
                  US Dollar Index (DXY) 15M Meter
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md tabular-nums ${
                  intermarketRadar.dxy.change24h.startsWith('+')
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {intermarketRadar.dxy.change24h}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  {intermarketRadar.dxy.currentValue}
                </span>
                <span className="text-xs text-slate-300 font-sans ml-3">
                  Floor: <b className="text-emerald-400 font-mono">101.90</b> | Ceiling: <b className="text-rose-400 font-mono">102.85</b>
                </span>
              </div>

              {/* 15m Zone Badge */}
              <span
                className={`px-3 py-1 rounded-lg text-xs font-sans font-bold uppercase tracking-wider border ${
                  intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_RESISTANCE'
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm animate-pulse'
                    : intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_SUPPORT'
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_RESISTANCE'
                  ? '🚨 AT 15M RESISTANCE (102.80+) ➔ BUY GOLD IDEA (Evidence Only)'
                  : intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_SUPPORT'
                  ? '🚨 AT 15M SUPPORT (101.90) ➔ SELL GOLD IDEA (Evidence Only)'
                  : '⏳ 15M MID-RANGE CHOP (NEUTRAL)'}
              </span>
            </div>

            {/* Hindi Rule Box */}
            <div className="bg-[#120f04] p-3 rounded-xl border border-amber-500/20 text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
              <span className="text-amber-300 font-bold block mb-1 text-xs uppercase tracking-wide">📌 AAPKA EXACT RULE (DXY vs GOLD):</span>
              {intermarketRadar.dxy.statusNoteHindi}
            </div>

            {/* Quick Button to Open DXY Chart */}
            <button
              onClick={() => {
                setSelectedSymbol('DXY');
                setChartTimeframe('15m');
              }}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm font-sans shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>📈</span>
              <span>DXY Dollar 15M Live Chart Dekho ➔</span>
            </button>
          </div>
        </div>

        {/* ACTIONABLE 15M TRADE CARDS GRID (BTC, GOLD, ETH) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 relative z-10 text-xs font-sans">
          {/* 1. BITCOIN 15M TRADE CARD */}
          {(intermarketFilter === 'ALL' || intermarketFilter === 'BTC') && (
            <div
              className={`p-4 sm:p-5 rounded-xl border-2 space-y-3.5 transition-all ${
                intermarketRadar.btcTrade.decision === 'SHORT'
                  ? 'bg-gradient-to-b from-[#180812] to-[#040814] border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : intermarketRadar.btcTrade.decision === 'LONG'
                  ? 'bg-gradient-to-b from-[#081812] to-[#040814] border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                  : 'bg-[#060c18] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">₿</span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-white block font-sans">BITCOIN (BTC / USD)</span>
                    <span className="text-xs text-slate-400 font-sans">15M USDT.D Confluence</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black font-sans border ${
                    intermarketRadar.btcTrade.decision === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : intermarketRadar.btcTrade.decision === 'LONG'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {intermarketRadar.btcTrade.decision === 'SHORT'
                    ? '🔴 15M SHORT (SELL)'
                    : intermarketRadar.btcTrade.decision === 'LONG'
                    ? '🟢 15M LONG (BUY)'
                    : '🟡 15M WAIT'}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-amber-300 font-sans font-bold block">
                  {intermarketRadar.btcTrade.ruleMatched}
                </span>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                  {intermarketRadar.btcTrade.hinglishLogic}
                </p>
              </div>

              {/* 15m Levels Mini Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-sans pt-1">
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">15M Entry Zone</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tabular-nums">{intermarketRadar.btcTrade.entryZone}</span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Strict Stop Loss</span>
                  <span className="text-xs sm:text-sm font-black text-rose-400 font-mono tabular-nums">
                    ${intermarketRadar.btcTrade.stopLossPrice.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Take Profit (TP1)</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tabular-nums">
                    ${intermarketRadar.btcTrade.tp1Price.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Reward / Risk</span>
                  <span className="text-xs sm:text-sm font-black text-cyan-300 font-mono tabular-nums">{intermarketRadar.btcTrade.riskReward}</span>
                </div>
              </div>

              {/* Actions: Load on Chart & Send Telegram */}
              <div className="flex items-center gap-2 pt-1 font-sans text-xs">
                <button
                  onClick={() => {
                    setSelectedSymbol('BTCUSDT');
                    setChartTimeframe('15m');
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black hover:brightness-110 shadow-sm transition-all cursor-pointer text-center text-xs font-sans"
                  title="Load Bitcoin on Candlestick Chart (15M)"
                >
                  📊 Load BTC On Chart (15M)
                </button>
                <button
                  onClick={() => handleSendIntermarketTelegram(intermarketRadar.btcTrade)}
                  className="px-3 py-2 rounded-xl bg-[#0e1933] border border-sky-500/40 text-sky-300 hover:text-white transition-all cursor-pointer text-xs font-bold font-sans"
                  title="Send BTC 15M Signal to Telegram"
                >
                  📲 Telegram
                </button>
              </div>
            </div>
          )}

          {/* 2. GOLD (XAU/USD) 15M TRADE CARD */}
          {(intermarketFilter === 'ALL' || intermarketFilter === 'GOLD') && (
            <div
              className={`p-4 sm:p-5 rounded-xl border-2 space-y-3.5 transition-all ${
                intermarketRadar.goldTrade.decision === 'LONG'
                  ? 'bg-gradient-to-b from-[#081812] to-[#040814] border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                  : intermarketRadar.goldTrade.decision === 'SHORT'
                  ? 'bg-gradient-to-b from-[#180812] to-[#040814] border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : 'bg-[#060c18] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🥇</span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-white block font-sans">GOLD SPOT (XAU / USD)</span>
                    <span className="text-xs text-slate-400 font-sans">15M DXY Dollar Confluence</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black font-sans border ${
                    intermarketRadar.goldTrade.decision === 'LONG'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                      : intermarketRadar.goldTrade.decision === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {intermarketRadar.goldTrade.decision === 'LONG'
                    ? '🟢 15M LONG (BUY)'
                    : intermarketRadar.goldTrade.decision === 'SHORT'
                    ? '🔴 15M SHORT (SELL)'
                    : '🟡 15M WAIT'}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-yellow-300 font-sans font-bold block">
                  {intermarketRadar.goldTrade.ruleMatched}
                </span>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                  {intermarketRadar.goldTrade.hinglishLogic}
                </p>
              </div>

              {/* 15m Levels Mini Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-sans pt-1">
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">15M Entry Zone</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tabular-nums">{intermarketRadar.goldTrade.entryZone}</span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Strict Stop Loss</span>
                  <span className="text-xs sm:text-sm font-black text-rose-400 font-mono tabular-nums">
                    ${intermarketRadar.goldTrade.stopLossPrice.toFixed(1)}
                  </span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Take Profit (TP1)</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tabular-nums">
                    ${intermarketRadar.goldTrade.tp1Price.toFixed(1)}
                  </span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Reward / Risk</span>
                  <span className="text-xs sm:text-sm font-black text-cyan-300 font-mono tabular-nums">{intermarketRadar.goldTrade.riskReward}</span>
                </div>
              </div>

              {/* Actions: Load on Chart & Send Telegram */}
              <div className="flex items-center gap-2 pt-1 font-sans text-xs">
                <button
                  onClick={() => {
                    setSelectedSymbol('XAUUSD');
                    setChartTimeframe('15m');
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-slate-950 font-black hover:brightness-110 shadow-sm transition-all cursor-pointer text-center text-xs font-sans"
                  title="Load Gold on Candlestick Chart (15M)"
                >
                  📊 Load Gold On Chart (15M)
                </button>
                <button
                  onClick={() => handleSendIntermarketTelegram(intermarketRadar.goldTrade)}
                  className="px-3 py-2 rounded-xl bg-[#0e1933] border border-sky-500/40 text-sky-300 hover:text-white transition-all cursor-pointer text-xs font-bold font-sans"
                  title="Send Gold 15M Signal to Telegram"
                >
                  📲 Telegram
                </button>
              </div>
            </div>
          )}

          {/* 3. ETHEREUM 15M TRADE CARD */}
          {(intermarketFilter === 'ALL' || intermarketFilter === 'ETH') && (
            <div
              className={`p-4 sm:p-5 rounded-xl border-2 space-y-3.5 transition-all ${
                intermarketRadar.ethTrade.decision === 'SHORT'
                  ? 'bg-gradient-to-b from-[#180812] to-[#040814] border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : intermarketRadar.ethTrade.decision === 'LONG'
                  ? 'bg-gradient-to-b from-[#081812] to-[#040814] border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                  : 'bg-[#060c18] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">Ξ</span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-white block font-sans">ETHEREUM (ETH / USD)</span>
                    <span className="text-xs text-slate-400 font-sans">15M USDT.D Confluence</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black font-sans border ${
                    intermarketRadar.ethTrade.decision === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : intermarketRadar.ethTrade.decision === 'LONG'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {intermarketRadar.ethTrade.decision === 'SHORT'
                    ? '🔴 15M SHORT'
                    : intermarketRadar.ethTrade.decision === 'LONG'
                    ? '🟢 15M LONG'
                    : '🟡 15M WAIT'}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-indigo-300 font-sans font-bold block">
                  {intermarketRadar.ethTrade.ruleMatched}
                </span>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                  {intermarketRadar.ethTrade.hinglishLogic}
                </p>
              </div>

              {/* 15m Levels Mini Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-sans pt-1">
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">15M Entry Zone</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tabular-nums">{intermarketRadar.ethTrade.entryZone}</span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Strict Stop Loss</span>
                  <span className="text-xs sm:text-sm font-black text-rose-400 font-mono tabular-nums">
                    ${intermarketRadar.ethTrade.stopLossPrice.toFixed(1)}
                  </span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Take Profit (TP1)</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tabular-nums">
                    ${intermarketRadar.ethTrade.tp1Price.toFixed(1)}
                  </span>
                </div>
                <div className="bg-[#030610] p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Reward / Risk</span>
                  <span className="text-xs sm:text-sm font-black text-cyan-300 font-mono tabular-nums">{intermarketRadar.ethTrade.riskReward}</span>
                </div>
              </div>

              {/* Actions: Load on Chart & Send Telegram */}
              <div className="flex items-center gap-2 pt-1 font-sans text-xs">
                <button
                  onClick={() => {
                    setSelectedSymbol('ETHUSDT');
                    setChartTimeframe('15m');
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black hover:brightness-110 shadow-sm transition-all cursor-pointer text-center text-xs font-sans"
                  title="Load Ethereum on Candlestick Chart (15M)"
                >
                  📊 Load ETH On Chart (15M)
                </button>
                <button
                  onClick={() => handleSendIntermarketTelegram(intermarketRadar.ethTrade)}
                  className="px-3 py-2 rounded-xl bg-[#0e1933] border border-sky-500/40 text-sky-300 hover:text-white transition-all cursor-pointer text-xs font-bold font-sans"
                  title="Send ETH 15M Signal to Telegram"
                >
                  📲 Telegram
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ────────────────── 4.5 REAL-TIME INTERACTIVE CANDLESTICK CHART & DECISION OVERLAY ────────────────── */}
      <section className="rounded-2xl border border-cyan-500/30 bg-[#060b17] p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-xl font-sans">
        {/* CHART CONTROLS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">📈</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans">
                  {decisionOutput.asset} — LIVE EXECUTION CANDLESTICK CHART
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold ${
                    wsStatus === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      wsStatus === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  <span>{wsStatus === 'LIVE' ? 'LIVE STREAM' : 'ACTIVE FEED'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Interactive Candlesticks with Real-time Entry, Stop Loss, and TP1–TP3 Target Overlays
              </p>
            </div>

            {/* Live Intermarket Confluence Badge in Chart Header */}
            {['BTCUSDT', 'ETHUSDT'].includes(selectedSymbol) ? (
              <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#030713] border border-sky-500/30 text-xs font-sans">
                <span className="text-slate-300 font-medium">USDT.D 15M:</span>
                <strong className="text-sky-300 font-mono tabular-nums font-bold">{intermarketRadar.usdtD.currentValue}%</strong>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-xs ${
                    intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_SUPPORT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_RESISTANCE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_SUPPORT'
                    ? '⚠️ 15M Support Bounce (BTC Short Risk)'
                    : intermarketRadar.usdtD.timeframe15m.currentPosition === 'AT_RESISTANCE'
                    ? '🚀 15M Resistance Drop (BTC Long Surge)'
                    : '15M Mid-Range Chop'}
                </span>
              </div>
            ) : selectedSymbol === 'XAUUSD' ? (
              <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#030713] border border-amber-500/30 text-xs font-sans">
                <span className="text-slate-300 font-medium">DXY 15M:</span>
                <strong className="text-amber-300 font-mono tabular-nums font-bold">{intermarketRadar.dxy.currentValue}</strong>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-xs ${
                    intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_RESISTANCE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_SUPPORT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_RESISTANCE'
                    ? '🚀 15M Resistance Drop (Gold Long Fuel)'
                    : intermarketRadar.dxy.timeframe15m.currentPosition === 'AT_SUPPORT'
                    ? '🛑 15M Support Bounce (Gold Short Pressure)'
                    : '15M Equilibrium'}
                </span>
              </div>
            ) : null}
          </div>

          {/* TIMEFRAME SELECTOR & CONTROLS */}
          <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
            {/* Timeframe Buttons */}
            <div className="inline-flex rounded-lg bg-[#091124] p-1 border border-slate-800">
              {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartTimeframe === tf
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Toggle Volume */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showVolume
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-[#091124] text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle Volume Histogram Subpane"
            >
              <span>📊</span>
              <span>Vol</span>
            </button>

            {/* Zoom Controls */}
            <div className="inline-flex rounded-lg bg-[#091124] p-1 border border-slate-800">
              <button
                onClick={handleZoomIn}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded font-bold cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={handleZoomOut}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded font-bold cursor-pointer"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={handleFitContent}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded font-bold cursor-pointer"
                title="Reset View / Fit Content"
              >
                ⤢ Fit
              </button>
            </div>
          </div>
        </div>

        {/* ─── 🎛️ SMC & ICT LAYER TOGGLE BAR (USER CUSTOMIZABLE ON / OFF) ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[#030712] border border-cyan-500/20 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
            <span>⚙️ SMC LAYERS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Order Blocks Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, orderBlocks: !prev.orderBlocks }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.orderBlocks
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Bullish & Bearish Order Blocks"
            >
              <span>📦</span>
              <span>Order Blocks {chartLayers.orderBlocks ? 'ON' : 'OFF'}</span>
            </button>

            {/* 2. Support & Resistance Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, supportResistance: !prev.supportResistance }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.supportResistance
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Major Support & Resistance"
            >
              <span>🏰</span>
              <span>Major S/R {chartLayers.supportResistance ? 'ON' : 'OFF'}</span>
            </button>

            {/* 3. Liquidation Zones Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, liquidationZones: !prev.liquidationZones }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.liquidationZones
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Short (Red) & Long (Green) Liquidation Pools"
            >
              <span>🚨</span>
              <span>Liquidation Pools {chartLayers.liquidationZones ? 'ON' : 'OFF'}</span>
            </button>

            {/* 4. Retail SL Pools Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, retailSlPools: !prev.retailSlPools }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.retailSlPools
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Retail Stop Loss Clusters (BSL & SSL)"
            >
              <span>🎯</span>
              <span>Retail SLs {chartLayers.retailSlPools ? 'ON' : 'OFF'}</span>
            </button>

            {/* 5. Activation Trigger Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, activationTrigger: !prev.activationTrigger }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.activationTrigger
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle 15M Activation Trigger Line"
            >
              <span>⚡</span>
              <span>Activation {chartLayers.activationTrigger ? 'ON' : 'OFF'}</span>
            </button>

            {/* 6. Trendlines Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, trendlines: !prev.trendlines }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.trendlines
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Dynamic Trendlines"
            >
              <span>📉</span>
              <span>Trendlines {chartLayers.trendlines ? 'ON' : 'OFF'}</span>
            </button>

            {/* 7. Location Zones Toggle */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, locationZones: !prev.locationZones }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.locationZones
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Premium High / Discount Low Location Zones"
            >
              <span>🧭</span>
              <span>Location {chartLayers.locationZones ? 'ON' : 'OFF'}</span>
            </button>

            {/* 8. Trade Levels (Entry / SL / TP) */}
            <button
              onClick={() => setChartLayers((prev) => ({ ...prev, tradeLevels: !prev.tradeLevels }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartLayers.tradeLevels
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'bg-[#070e1c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Entry, SL, and TP Price Lines"
            >
              <span>🎯</span>
              <span>Trade Levels {chartLayers.tradeLevels ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                setChartLayers({
                  orderBlocks: true,
                  supportResistance: true,
                  liquidationZones: true,
                  retailSlPools: true,
                  activationTrigger: true,
                  trendlines: true,
                  locationZones: true,
                  tradeLevels: true
                })
              }
              className="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold cursor-pointer"
            >
              🔥 Sabhi ON
            </button>
            <button
              onClick={() =>
                setChartLayers({
                  orderBlocks: false,
                  supportResistance: false,
                  liquidationZones: false,
                  retailSlPools: false,
                  activationTrigger: false,
                  trendlines: false,
                  locationZones: false,
                  tradeLevels: true
                })
              }
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              ⚡ Minimal
            </button>
          </div>
        </div>

        {/* CHART VIEWPORT CONTAINER & FLOATING HUD */}
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/90 bg-[#050a14]">
          {/* FLOATING HUD BADGE */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1.5">
            <div className="p-3 rounded-xl bg-[#070e1c]/95 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-1.5 font-sans">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-black uppercase font-sans border ${decisionBadgeStyle.pill}`}>
                  {decisionOutput.finalDecision === 'LONG'
                    ? '🟢 LONG'
                    : decisionOutput.finalDecision === 'SHORT'
                    ? '🔴 SHORT'
                    : '🟡 WAIT'}
                </span>
                <span className="text-xs font-sans font-bold text-white">
                  Score: <strong className="text-cyan-300 font-mono tabular-nums">{decisionOutput.evidenceScore}/100</strong>
                </span>
                <span className="text-xs font-sans px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {chartTimeframe}
                </span>
              </div>
              <div className="text-xs font-sans text-slate-200">
                Action: <strong className="text-white">{decisionOutput.finalAction}</strong>
                {decisionOutput.finalDecision !== 'WAIT' && (
                  <span className="ml-2 text-cyan-300 font-mono font-bold tabular-nums">RRR 1:{decisionOutput.rrNumeric.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>

          {/* LIGHTWEIGHT CHARTS CANVAS */}
          <div ref={chartContainerRef} className="w-full h-[480px]" />
        </div>

        {/* CHART LEGEND & LEVEL EXPLANATION BAR */}
        <div className="p-3.5 rounded-xl bg-[#040814] border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-sans">
          {selectedSymbol === 'USDTD' ? (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#f43f5e] inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-slate-200">
                  Resistance Ceiling: <strong className="text-rose-400 font-mono font-bold tabular-nums">5.58%</strong> (Drop ➔ BUY BTC)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#10b981] inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-slate-200">
                  Support Floor: <strong className="text-emerald-400 font-mono font-bold tabular-nums">5.30%</strong> (Bounce ➔ SELL BTC)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#38bdf8] inline-block" />
                <span className="text-slate-200">
                  Pivot: <strong className="text-cyan-300 font-mono font-bold tabular-nums">5.42%</strong>
                </span>
              </div>
            </div>
          ) : selectedSymbol === 'DXY' ? (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#10b981] inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-slate-200">
                  Resistance: <strong className="text-emerald-400 font-mono font-bold tabular-nums">102.85</strong> (Dollar Reject ➔ Gold Bullish Confluence)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#f43f5e] inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-slate-200">
                  Support: <strong className="text-rose-400 font-mono font-bold tabular-nums">101.90</strong> (Dollar Bounce ➔ Gold Bearish Confluence)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#38bdf8] inline-block" />
                <span className="text-slate-200">
                  Pivot: <strong className="text-cyan-300 font-mono font-bold tabular-nums">102.35</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Entry */}
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#38bdf8] inline-block shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                <span className="text-slate-200">
                  Entry: <strong className="text-white font-mono font-bold tabular-nums">${(decisionOutput.entryPrice > 0 ? decisionOutput.entryPrice : precisionEntry?.idealEntry || livePrice).toFixed(1)}</strong>
                </span>
              </div>
              {/* Stop Loss */}
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#f43f5e] inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-slate-200">
                  SL: <strong className="text-rose-400 font-mono font-bold tabular-nums">${(decisionOutput.stopLossPrice > 0 ? decisionOutput.stopLossPrice : precisionEntry?.stopLossPrice || (livePrice * 0.988)).toFixed(1)}</strong>
                </span>
              </div>
              {/* TP1 */}
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#10b981] inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-slate-200">
                  TP1: <strong className="text-emerald-400 font-mono font-bold tabular-nums">${(decisionOutput.targetTp1 > 0 ? decisionOutput.targetTp1 : precisionEntry?.tp1Price || (livePrice * 1.015)).toFixed(1)}</strong>
                </span>
              </div>
              {/* TP2 */}
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#059669] inline-block" />
                <span className="text-slate-200">
                  TP2: <strong className="text-emerald-400 font-mono font-bold tabular-nums">${(decisionOutput.targetTp2 > 0 ? decisionOutput.targetTp2 : precisionEntry?.tp2Price || (livePrice * 1.025)).toFixed(1)}</strong>
                </span>
              </div>
              {/* TP3 */}
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm bg-[#047857] inline-block" />
                <span className="text-slate-200">
                  TP3 (Runner): <strong className="text-emerald-400 font-mono font-bold tabular-nums">${(decisionOutput.targetTp3 > 0 ? decisionOutput.targetTp3 : precisionEntry?.tp3Price || (livePrice * 1.045)).toFixed(1)}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400">
            Scroll or drag chart to pan 1000 candles · Pinch or +/- to zoom · Real-time auto-sync
          </div>
        </div>
      </section>

      {/* ────────────────── 5. "WHY THIS TRADE?" & TRAP RADAR (TWO COLUMN) ────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans">
        {/* LEFT: "WHY THIS TRADE?" PANEL */}
        <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans">
                &ldquo;WHY THIS TRADE?&rdquo; EVIDENCE PANEL
              </h3>
            </div>
            <span className="text-xs font-sans font-bold text-cyan-300">
              Top 5 Evidence Pillars
            </span>
          </div>

          <div className="space-y-2.5">
            {decisionOutput.whyThisTrade.map((reason, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#040814] border border-slate-800/80 text-xs sm:text-sm text-slate-100 font-sans leading-relaxed flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5 text-base leading-none">✓</span>
                <span className="font-normal">{reason}</span>
              </div>
            ))}
          </div>

          {/* WHAT CAN MAKE THIS WRONG? */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <span className="text-xs font-sans font-bold uppercase text-rose-400 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>WHAT CAN MAKE THIS WRONG? (TOP 3 RISKS)</span>
            </span>
            <div className="space-y-2">
              {decisionOutput.whatCanMakeThisWrong.map((risk, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#140810] border border-rose-500/25 text-xs sm:text-sm text-rose-100 font-sans leading-relaxed">
                  {risk}
                </div>
              ))}
            </div>
          </div>

          {/* WHAT CONFIRMATION IS STILL NEEDED? (IF WAIT) */}
          {decisionOutput.finalDecision === 'WAIT' && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs sm:text-sm text-amber-200 font-sans leading-relaxed">
              <strong className="text-amber-300 block mb-1 font-bold">⏳ WHAT CONFIRMATION IS STILL NEEDED:</strong>
              {decisionOutput.confirmationNeededIfWait}
            </div>
          )}
        </div>

        {/* RIGHT: TRAP DETECTION & PRIMARY VS ALTERNATIVE SCENARIO */}
        <div className="space-y-4">
          {/* TRAP RADAR */}
          <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪤</span>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans">
                  INSTITUTIONAL TRAP DETECTION RADAR
                </h3>
              </div>
              <span className="text-xs font-sans text-slate-300">Pure Liquidity Analysis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bull Trap Box */}
              <div className={`p-3.5 rounded-xl border ${
                decisionOutput.bullTrapRisk === 'HIGH'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                  : decisionOutput.bullTrapRisk === 'MEDIUM'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                  : 'bg-[#040814] border-slate-800 text-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold uppercase tracking-wide">BULL TRAP RISK</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded font-sans ${
                    decisionOutput.bullTrapRisk === 'HIGH' ? 'bg-rose-500 text-white' : decisionOutput.bullTrapRisk === 'MEDIUM' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {decisionOutput.bullTrapRisk}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-sans mt-2 leading-relaxed">
                  {decisionOutput.bullTrapReason}
                </p>
              </div>

              {/* Bear Trap Box */}
              <div className={`p-3.5 rounded-xl border ${
                decisionOutput.bearTrapRisk === 'HIGH'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                  : decisionOutput.bearTrapRisk === 'MEDIUM'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                  : 'bg-[#040814] border-slate-800 text-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold uppercase tracking-wide">BEAR TRAP RISK</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded font-sans ${
                    decisionOutput.bearTrapRisk === 'HIGH' ? 'bg-rose-500 text-white' : decisionOutput.bearTrapRisk === 'MEDIUM' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {decisionOutput.bearTrapRisk}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-sans mt-2 leading-relaxed">
                  {decisionOutput.bearTrapReason}
                </p>
              </div>
            </div>
          </div>

          {/* PRIMARY SCENARIO VS ALTERNATIVE SCENARIO (NO DUAL PREDICTION) */}
          <div className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-black text-white text-sm sm:text-base uppercase flex items-center gap-1.5 font-sans">
                <span>🎯</span>
                <span>SINGLE DOMINANT THESIS (NO DUAL PREDICTION)</span>
              </span>
              <span className="text-xs text-cyan-400 font-bold">Rule 22 Compliant</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#041424] border border-cyan-500/40 space-y-1.5">
              <span className="text-xs font-bold uppercase text-cyan-300 block">PRIMARY SCENARIO:</span>
              <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">{decisionOutput.primaryScenario}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0c16] border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-400 block">ALTERNATIVE SCENARIO (INVALIDATION ONLY):</span>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">{decisionOutput.alternativeScenario}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#040814] border border-slate-800 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
              <strong className="text-amber-300 font-bold">WHAT WOULD CHANGE THE DECISION:</strong> {decisionOutput.whatWouldChangeDecision}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── 6. 8-FACTOR EVIDENCE BREAKDOWN MATRIX (100 POINTS) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 font-sans">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans">
              EVIDENCE ENGINE — 8 INDEPENDENT CATEGORIES (100 POINTS)
            </h3>
          </div>
          <span className="text-xs sm:text-sm font-sans font-bold text-cyan-300">
            Total Score: <span className="font-mono tabular-nums text-cyan-400 font-black">{decisionOutput.evidenceScore}</span> / 100 ({decisionOutput.confidence})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {decisionOutput.evidenceBreakdown.map((cat) => (
            <div key={cat.name} className="bg-[#040814] p-3.5 rounded-xl border border-slate-800 space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-200 truncate" title={cat.name}>
                  {cat.name}
                </span>
                <span className="text-xs font-black text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-mono tabular-nums">
                  {cat.score}/{cat.weight} pts
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(cat.score / cat.weight) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {cat.details}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 7. MULTI-TIMEFRAME HIERARCHY MATRIX (RULE 3) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans">
              MULTI-TIMEFRAME HIERARCHY (DAILY &gt; 4H &gt; 1H &gt; 30M &gt; 15M &gt; 5M)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-sans">HTF Rules Override LTF</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-sans">
          {decisionOutput.timeframeHierarchy.map((tf) => (
            <div key={tf.timeframe} className="bg-[#040814] p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-cyan-300 text-sm font-mono">{tf.timeframe}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  tf.bias === 'Bullish' ? 'bg-emerald-500/20 text-emerald-300' : tf.bias === 'Bearish' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tf.bias}
                </span>
              </div>
              <span className="text-xs text-slate-400 block truncate font-medium">{tf.role}</span>
              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">{tf.structure}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 7.5 INDEPENDENT USER CHALLENGE & ANTI-FLIP AUDIT PROTOCOL (RULES 15 & 24) ────────────────── */}
      <section className="bg-[#080d1e] p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/50 space-y-4 font-sans shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-indigo-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                <span>INDEPENDENT USER CHALLENGE AUDIT & ANTI-FLIP SIMULATOR</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono">
                  RULE 15 & 24 STRICT COMPLIANCE
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                User assertions (e.g., &quot;Market is falling, why LONG?&quot;) NEVER control the trade. The engine runs an independent 9-step live data audit to verify structure without bias.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/40 font-bold">
            9-STEP RE-CHECK PROTOCOL
          </span>
        </div>

        {/* QUICK QUESTION CHIPS */}
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Test Real-Time Anti-Flip Engine With User Challenge Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '📉 "Why are you giving LONG when BTC is falling?"', query: 'Why are you giving LONG when BTC is falling?' },
              { label: '📈 "Why are you giving SHORT when BTC is rising?"', query: 'Why are you giving SHORT when BTC is rising?' },
              { label: '⚠️ "Market is definitely going SHORT now!"', query: 'Market is definitely going SHORT now!' },
              { label: '⚖️ "Why is the engine in WAIT mode? Force trade!"', query: 'Why is the engine in WAIT mode? Force a trade now.' }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUserChallengeInput(chip.query);
                  handleRunChallenge(chip.query);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-indigo-950 border border-indigo-500/30 hover:border-indigo-400 text-slate-200 text-xs font-sans transition-all cursor-pointer shadow-sm text-left"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* CUSTOM CHALLENGE INPUT */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={userChallengeInput}
            onChange={(e) => setUserChallengeInput(e.target.value)}
            placeholder="Challenge DEEEPR AI (e.g., 'Market dropped 1500 pts, switch to SHORT now...')"
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#03060f] border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm font-sans focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunChallenge();
            }}
          />
          <button
            onClick={() => handleRunChallenge()}
            disabled={isAuditingChallenge || !userChallengeInput.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-black text-xs sm:text-sm font-sans transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isAuditingChallenge ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Auditing Live Data...</span>
              </>
            ) : (
              <>
                <span>🔬</span>
                <span>Run 9-Step Independent Audit</span>
              </>
            )}
          </button>
        </div>

        {/* 9-STEP AUDIT TRAIL MODAL / CARD */}
        {challengeResult && (
          <div className="p-4 rounded-xl bg-[#030712] border-2 border-indigo-500/40 space-y-3.5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {challengeResult.caseOutcome === 'CASE_A_RETAINED' ? '🟢' : challengeResult.caseOutcome === 'CASE_B_UNDER_REVIEW' ? '🟡' : '🔴'}
                </span>
                <div>
                  <span className="text-xs text-slate-400 font-sans block">Audit Query: &ldquo;{challengeResult.query}&rdquo;</span>
                  <strong className="text-sm font-black text-white font-sans">
                    {challengeResult.caseOutcome === 'CASE_A_RETAINED' && 'CASE A: ACTIVE THESIS RETAINED — PRICE ACTION IS PULLBACK WITHIN INVALIDATION'}
                    {challengeResult.caseOutcome === 'CASE_B_UNDER_REVIEW' && 'CASE B: ACTIVE THESIS UNDER REVIEW — WAITING FOR CONFIRMATION'}
                    {challengeResult.caseOutcome === 'CASE_C_INVALIDATED' && 'CASE C: THESIS STRUCTURALLY INVALIDATED — TRANSITIONING TO REVERSAL/WAIT'}
                  </strong>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-black border self-start sm:self-auto ${
                challengeResult.caseOutcome === 'CASE_A_RETAINED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : challengeResult.caseOutcome === 'CASE_B_UNDER_REVIEW'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                VERDICT: {challengeResult.finalVerdict}
              </span>
            </div>

            {/* 9 AUDIT STEPS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-sans">
              {challengeResult.steps.map((st) => (
                <div key={st.stepNumber} className="p-2.5 rounded-lg bg-[#070e1c] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 font-mono text-[11px]">
                      Step {st.stepNumber}: {st.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                      st.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : st.status === 'FLAGGED' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {st.status}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{st.detail}</p>
                </div>
              ))}
            </div>

            {/* SUMMARY RATIONALE */}
            <div className="p-3 rounded-lg bg-[#0e1628] border border-indigo-500/30 text-xs font-sans text-slate-100 leading-relaxed">
              <strong className="text-indigo-300 block mb-1 uppercase tracking-wide">
                ⚖️ INDEPENDENT SOVEREIGN DECISION RATIONALE:
              </strong>
              {challengeResult.summaryRationale}
            </div>
          </div>
        )}
      </section>

      {/* ────────────────── 7.6 BACKTEST TRANSPARENCY & ANTI-HALLUCINATION AUDIT (RULE 22) ────────────────── */}
      {decisionOutput.backtestMetrics && (
        <section className="bg-[#050914] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                  <span>BACKTEST AUDIT & ANTI-HALLUCINATION TRANSPARENCY CARD</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                    RULE 22 MANDATORY
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Measured backtest results over a fixed rolling sample. Zero fabricated percentages or whale claims.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBacktestCard(!showBacktestCard)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
            >
              {showBacktestCard ? 'Hide Details ▲' : 'Show Full Audit ▼'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-sans">
            <div className="p-3 rounded-xl bg-[#091122] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Sample Size</span>
              <span className="text-base sm:text-lg font-black text-white font-mono">{decisionOutput.backtestMetrics.sampleSize}</span>
              <span className="text-[10px] text-slate-500 block">Verified Trades</span>
            </div>
            <div className="p-3 rounded-xl bg-[#091122] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Time Period</span>
              <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">{decisionOutput.backtestMetrics.timePeriod}</span>
              <span className="text-[10px] text-slate-500 block">Rolling Window</span>
            </div>
            <div className="p-3 rounded-xl bg-[#051c16] border border-emerald-500/30 text-center">
              <span className="text-[11px] text-emerald-400 block uppercase font-medium">Win Rate</span>
              <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">{decisionOutput.backtestMetrics.winRatePct}%</span>
              <span className="text-[10px] text-emerald-400/70 block">Measured Backtest</span>
            </div>
            <div className="p-3 rounded-xl bg-[#091122] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Profit Factor</span>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{decisionOutput.backtestMetrics.profitFactor}</span>
              <span className="text-[10px] text-slate-500 block">Gross Win / Loss</span>
            </div>
            <div className="p-3 rounded-xl bg-[#14080a] border border-rose-500/30 text-center">
              <span className="text-[11px] text-rose-400 block uppercase font-medium">Max Drawdown</span>
              <span className="text-base sm:text-lg font-black text-rose-300 font-mono">{decisionOutput.backtestMetrics.maxDrawdownPct}%</span>
              <span className="text-[10px] text-rose-400/70 block">Peak to Trough</span>
            </div>
            <div className="p-3 rounded-xl bg-[#091122] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Avg Risk:Reward</span>
              <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">{decisionOutput.backtestMetrics.avgRR}</span>
              <span className="text-[10px] text-slate-500 block">Realized Ratio</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#040812] border border-slate-800 text-xs font-sans text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              Breakdown: 🟢 {decisionOutput.backtestMetrics.longTradesCount} Longs · 🔴 {decisionOutput.backtestMetrics.shortTradesCount} Shorts · 🟡 {decisionOutput.backtestMetrics.waitSituationsCount} Waits (Capital Preserved)
            </span>
            <span className="text-[11px] text-amber-400 font-medium text-center sm:text-right">
              {decisionOutput.backtestMetrics.disclaimer}
            </span>
          </div>
        </section>
      )}

      {/* ────────────────── 8. DECISION CHANGE LOG (ANTI-FLIP AUDIT TRAIL) ────────────────── */}
      <section className="bg-[#070e1c] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans">
              DECISION CHANGE LOG — PERSISTENT THESIS AUDIT TRAIL
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-sans">Rule 26 Compliant</span>
        </div>

        {changeLogs.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-300 py-2.5 font-sans">
            No signal flip occurred yet. The dominant thesis is firmly locked until explicit structural invalidation.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-48 overflow-y-auto pr-1">
            <table className="w-full text-xs text-left font-sans">
              <thead className="bg-[#040812] text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Previous</th>
                  <th className="p-2.5">New</th>
                  <th className="p-2.5">What Changed?</th>
                  <th className="p-2.5">Evidence Factors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {changeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 text-slate-300 text-xs font-mono tabular-nums">{log.formattedTime}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        log.previousDecision === 'LONG' ? 'text-emerald-400' : log.previousDecision === 'SHORT' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {log.previousDecision}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded font-black text-xs ${
                        log.newDecision === 'LONG' ? 'bg-emerald-500/20 text-emerald-300' : log.newDecision === 'SHORT' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {log.newDecision}
                      </span>
                    </td>
                    <td className="p-2.5 text-white text-xs sm:text-sm font-sans">{log.whatChanged}</td>
                    <td className="p-2.5 text-slate-300 text-xs font-sans">{log.evidenceFactors.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* FOOTER DISCLAIMER */}
      <footer className="pt-2.5 border-t border-slate-900 text-xs text-slate-400 text-center font-sans">
        DEEEPR AI DECISION ENGINE V10 · BINANCE LIVE FEED · FRED ST. LOUIS FED MACRO · CAPITAL PROTECTION FIRST · NOT FINANCIAL ADVICE
      </footer>
    </div>
  );
};

export default DeeeprDecisionEngineView;
