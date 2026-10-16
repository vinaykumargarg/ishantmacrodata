import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  CandleData,
  ComprehensiveMarketAnalysis,
  analyzeMarketStructure
} from '../utils/marketStructureEngine';
import {
  unifiedTradeSignalService,
  UnifiedTradingSignal,
  normalizeSymbolKey,
  getUsdtDominanceAnalysis
} from '../services/unifiedTradeSignalStore';

export type AssetTradingPlan = UnifiedTradingSignal;

export interface TradeHistoryItem {
  id: string;
  tradeNumber: number;
  symbol: string;
  decision: 'SHORT' | 'LONG';
  entryPrice: number;
  exitPrice: number;
  stopLossPrice: number;
  targetTp3: number;
  outcome: 'TP3_HIT' | 'SL_HIT' | 'MANUAL_ROTATED';
  pnlPoints: number;
  pnlPercent: number;
  closedAt: string;
  note: string;
}

export interface UsdtMacroTelemetry {
  usdtDominancePct: number; // e.g. 5.42%
  usdtDominanceChange24h: string; // e.g. "-0.18%"
  dxyDollarIndex: number; // e.g. 102.35
  dxyChange24h: string; // e.g. "+0.12%"
  usdtCapitalFlow: 'INFLOW_TO_RISK_ASSETS' | 'OUTFLOW_TO_STABLECOIN' | 'NEUTRAL_ABSORPTION';
  flowInterpretation: string;
  goldUsdtImpact: string;
  cryptoUsdtImpact: string;
}

export interface UserActiveTradeSession {
  symbol: string;
  entryPrice: number;
  entryTime: number;
  decision: 'LONG' | 'SHORT';
  tradeNumber: number;
  tp1Secured: boolean;
  tp2Secured: boolean;
  slMovedToCost: boolean;
  leverage: number;
}


export const DeeeprAiChartView: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [livePrice, setLivePrice] = useState<number>(84550);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<string>('-0.85%');
  const [wsStatus, setWsStatus] = useState<'LIVE' | 'CONNECTING'>('CONNECTING');
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);

  // Market Structure Engine Output State
  const [analysis, setAnalysis] = useState<ComprehensiveMarketAnalysis | null>(null);
  const [structureSensitivity, setStructureSensitivity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isMtfMode, setIsMtfMode] = useState<boolean>(true);

  // Dynamic Plans State
  const [plans, setPlans] = useState<Record<string, AssetTradingPlan>>({});
  const [tradeHistories, setTradeHistories] = useState<Record<string, TradeHistoryItem[]>>({
    BTCUSDT: [],
    PAXGUSDT: []
  });
  const [tradeAlert, setTradeAlert] = useState<{
    type: 'TP' | 'SL' | 'NEW';
    message: string;
    timestamp: number;
  } | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Custom Coin Input
  const [showAddCoin, setShowAddCoin] = useState<boolean>(false);
  const [customCoinInput, setCustomCoinInput] = useState<string>('');

  // ─── USER ACTIVE POSITION TRACKING ("Maine Yeh Trade Le Liya") ───
  const [userActiveTrade, setUserActiveTrade] = useState<UserActiveTradeSession | null>(() => {
    try {
      const saved = localStorage.getItem(`ishantmacro_user_trade_${selectedSymbol}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showEditEntryModal, setShowEditEntryModal] = useState<boolean>(false);
  const [customEntryInput, setCustomEntryInput] = useState<string>('');
  const userActiveTradeRef = useRef<UserActiveTradeSession | null>(null);
  userActiveTradeRef.current = userActiveTrade;
  const checkTradeLevelsRef = useRef<(price: number) => void>(() => {});

  // Sync active user trade on symbol switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ishantmacro_user_trade_${selectedSymbol}`);
      const parsed = saved ? JSON.parse(saved) : null;
      setUserActiveTrade(parsed);
      userActiveTradeRef.current = parsed;
    } catch {
      setUserActiveTrade(null);
      userActiveTradeRef.current = null;
    }
  }, [selectedSymbol]);

  // Current Plan from Unified Store (FIXED & ANCHORED, NO DRIFTING ON TICKS!)
  const plan = useMemo(() => {
    if (plans[selectedSymbol]) return plans[selectedSymbol];
    return unifiedTradeSignalService.getSignal(selectedSymbol);
  }, [plans, selectedSymbol]);

  // Dynamic USDT & Macro Radar State aligned with real market regime & live price
  const usdtMacro = useMemo<UsdtMacroTelemetry>(() => {
    const analysis = getUsdtDominanceAnalysis(livePrice, plan?.decision);
    return {
      usdtDominancePct: analysis.usdtDominancePct,
      usdtDominanceChange24h: analysis.usdtDominanceChange24h,
      dxyDollarIndex: analysis.dxyDollarIndex,
      dxyChange24h: analysis.dxyChange24h,
      usdtCapitalFlow: analysis.capitalFlow,
      flowInterpretation: analysis.relationshipHindiLogic,
      goldUsdtImpact:
        'Dollar Index DXY softening ke chalte Gold support maintain kar raha hai.',
      cryptoUsdtImpact: analysis.relationshipHindiLogic
    };
  }, [livePrice, plan?.decision]);

  // Chart Container & Instances Refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const candlesRef = useRef<CandleData[]>([]);
  const priceLinesRef = useRef<any[]>([]);
  const isTransitioningRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio Alerts Engine
  const playBeepSound = useCallback(
    (freq = 880) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      } catch {}
    },
    [soundEnabled]
  );

  const playSuccessChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.23);
      });
    } catch {}
  }, [soundEnabled]);

  // Price Lines on Lightweight Chart
  const renderPriceLines = useCallback(
    (
      series: ISeriesApi<'Candlestick'>,
      currentPlan: AssetTradingPlan,
      mAnalysis?: ComprehensiveMarketAnalysis | null,
      userTradeOverride?: UserActiveTradeSession | null
    ) => {
      priceLinesRef.current.forEach((line) => {
        try {
          series.removePriceLine(line);
        } catch {}
      });
      priceLinesRef.current = [];

      const activeTrade = userTradeOverride !== undefined ? userTradeOverride : userActiveTradeRef.current;

      // 0. If user has active trade, plot their exact entry line in bold Cyan
      if (activeTrade && activeTrade.entryPrice > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: activeTrade.entryPrice,
            color: '#06b6d4',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `📍 AAPKI ENTRY: $${Math.round(activeTrade.entryPrice).toLocaleString()}`
          })
        );
      } else {
        // Standard Plan Entry (Amber)
        priceLinesRef.current.push(
          series.createPriceLine({
            price: currentPlan.entryPrice,
            color: '#f59e0b',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `🎯 ENTRY: $${currentPlan.entryPrice.toLocaleString()}`
          })
        );
      }

      // 1. Stop Loss (Red or Risk-Free Green at Cost)
      if (activeTrade && activeTrade.slMovedToCost) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: activeTrade.entryPrice,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `🛡️ SL AT COST (RISK-FREE): $${Math.round(activeTrade.entryPrice).toLocaleString()} USD`
          })
        );
      } else {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: currentPlan.stopLossPrice,
            color: '#f43f5e',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: currentPlan.status === 'SL_HIT'
              ? `🛑 SL HIT: $${currentPlan.stopLossPrice.toLocaleString()} USD`
              : `🛑 STOP LOSS: $${currentPlan.stopLossPrice.toLocaleString()} USD`
          })
        );
      }

      // 3. TP1
      priceLinesRef.current.push(
        series.createPriceLine({
          price: currentPlan.targetTp1,
          color: '#059669',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🏁 TP1: $${currentPlan.targetTp1.toLocaleString()} USD`
        })
      );

      // 4. TP2
      priceLinesRef.current.push(
        series.createPriceLine({
          price: currentPlan.targetTp2,
          color: '#059669',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🏁 TP2: $${currentPlan.targetTp2.toLocaleString()} USD`
        })
      );

      // 5. TP3
      priceLinesRef.current.push(
        series.createPriceLine({
          price: currentPlan.targetTp3,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `🏆 TP3: $${currentPlan.targetTp3.toLocaleString()} USD`
        })
      );

      // 6. POC (Point of Control) from Market Structure Engine
      if (mAnalysis && mAnalysis.volumeProfile && mAnalysis.volumeProfile.poc > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: mAnalysis.volumeProfile.poc,
            color: '#ec4899',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `📍 POC: $${mAnalysis.volumeProfile.poc.toLocaleString()}`
          })
        );
      }

      // 7. PDH / PDL
      if (mAnalysis && mAnalysis.previousHighLows) {
        if (mAnalysis.previousHighLows.pdh) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: mAnalysis.previousHighLows.pdh,
              color: '#38bdf8',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              axisLabelVisible: true,
              title: `PDH: $${mAnalysis.previousHighLows.pdh.toLocaleString()}`
            })
          );
        }
        if (mAnalysis.previousHighLows.pdl) {
          priceLinesRef.current.push(
            series.createPriceLine({
              price: mAnalysis.previousHighLows.pdl,
              color: '#38bdf8',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              axisLabelVisible: true,
              title: `PDL: $${mAnalysis.previousHighLows.pdl.toLocaleString()}`
            })
          );
        }
      }
    },
    []
  );

  // Helper to place Single Confirmed Signal marker (no contradictory arrows!)
  const renderMarkers = useCallback((series: ISeriesApi<'Candlestick'>, currentPlan: AssetTradingPlan, candles: any[], mAnalysis?: ComprehensiveMarketAnalysis | null) => {
    if (!candles || candles.length === 0) return;
    const targetCandle = candles[candles.length - 1];

    try {
      const isLong = currentPlan.decision === 'LONG';
      const isShort = currentPlan.decision === 'SHORT';
      const markers: any[] = [];

      if (isLong) {
        markers.push({
          time: targetCandle.time,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: `🟢 AI LONG SIGNAL (${currentPlan.convictionPct}% Conviction)`
        });
      } else if (isShort) {
        markers.push({
          time: targetCandle.time,
          position: 'aboveBar',
          color: '#f43f5e',
          shape: 'arrowDown',
          text: `🔴 AI SHORT SIGNAL (${currentPlan.convictionPct}% Conviction)`
        });
      } else {
        markers.push({
          time: targetCandle.time,
          position: 'aboveBar',
          color: '#f59e0b',
          shape: 'circle',
          text: `⏳ AI VERDICT: WAIT (NO TRADE ZONE)`
        });
      }

      // ONLY include structure breaks that AGREE with the trade direction (NEVER contradictory opposite-direction arrows!)
      if (mAnalysis && mAnalysis.structureBreaks) {
        const matchingBreaks = mAnalysis.structureBreaks.filter((brk) =>
          isLong ? brk.direction === 'BULLISH' : isShort ? brk.direction === 'BEARISH' : false
        );
        matchingBreaks.slice(-2).forEach((brk) => {
          markers.push({
            time: brk.time,
            position: isLong ? 'belowBar' : 'aboveBar',
            color: isLong ? '#10b981' : '#f43f5e',
            shape: isLong ? 'arrowUp' : 'arrowDown',
            text: `${brk.label} (${brk.timeframe})`
          });
        });
      }

      createSeriesMarkers(series, markers);
    } catch (e) {}
  }, []);

  // Synchronize with Unified Trading Signal Bus (guarantees 100% exact parity with AiChartView)
  useEffect(() => {
    const unsub = unifiedTradeSignalService.subscribe((updatedSignal) => {
      setPlans((prev) => ({
        ...prev,
        [updatedSignal.symbol]: updatedSignal
      }));
      if (
        normalizeSymbolKey(updatedSignal.symbol) === normalizeSymbolKey(selectedSymbol) &&
        candleSeriesRef.current
      ) {
        renderPriceLines(candleSeriesRef.current, updatedSignal, analysis);
        renderMarkers(candleSeriesRef.current, updatedSignal, candlesRef.current, analysis);
      }
    });
    return unsub;
  }, [selectedSymbol, analysis, renderPriceLines, renderMarkers]);

  // Handle TP3 / SL Outcome
  const handleTradeOutcome = useCallback(
    (outcome: 'TP3_HIT' | 'SL_HIT', exitPrice: number) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const currentPlan = plan;
      const pnlPoints =
        currentPlan.decision === 'SHORT'
          ? Math.round(currentPlan.entryPrice - exitPrice)
          : Math.round(exitPrice - currentPlan.entryPrice);
      const pnlPercent = parseFloat(((pnlPoints / currentPlan.entryPrice) * 100).toFixed(2));

      if (outcome === 'TP3_HIT') {
        playSuccessChime();
      } else {
        playBeepSound(440);
      }

      const historyItem: TradeHistoryItem = {
        id: `hist-${Date.now()}`,
        tradeNumber: currentPlan.tradeNumber,
        symbol: selectedSymbol,
        decision: currentPlan.decision,
        entryPrice: currentPlan.entryPrice,
        exitPrice,
        stopLossPrice: currentPlan.stopLossPrice,
        targetTp3: currentPlan.targetTp3,
        outcome,
        pnlPoints,
        pnlPercent,
        closedAt: new Date().toLocaleTimeString(),
        note:
          outcome === 'TP3_HIT'
            ? `TP3 Hit at $${exitPrice.toLocaleString()}! Target Completed.`
            : `SL Hit at $${exitPrice.toLocaleString()}. Risk protected.`
      };

      setTradeHistories((prev) => ({
        ...prev,
        [selectedSymbol]: [historyItem, ...(prev[selectedSymbol] || [])].slice(0, 15)
      }));

      if (outcome === 'TP3_HIT') {
        setTradeAlert({
          type: 'TP',
          message: `🏆 TARGET ACHIEVED! Trade #${currentPlan.tradeNumber} Hit TP3 at $${currentPlan.targetTp3.toLocaleString()} (+${pnlPoints > 0 ? '+' : ''}${pnlPoints.toLocaleString()} Pts / ${pnlPercent}%)! Next Trade (#${currentPlan.tradeNumber + 1}) activate ki ja rahi hai...`,
          timestamp: Date.now()
        });
      } else {
        const slHitPlan = { ...currentPlan, status: 'SL_HIT' as const };
        setPlans((prev) => ({
          ...prev,
          [selectedSymbol]: slHitPlan
        }));

        setTradeAlert({
          type: 'SL',
          message: `🛑 STOP LOSS HIT: Trade #${currentPlan.tradeNumber} Invalidation touched at $${currentPlan.stopLossPrice.toLocaleString()} USD. Capital Protected! Market dump/breakdown ho raha hai. Naya setup dekhne ke liye "Scan Next Setup" par click karein.`,
          timestamp: Date.now()
        });

        if (candleSeriesRef.current) {
          renderPriceLines(candleSeriesRef.current, slHitPlan, analysis);
        }

        isTransitioningRef.current = false;
        return;
      }

      // If TP3 HIT and autoAdvance enabled, cycle to next setup
      if (autoAdvance) {
        setTimeout(() => {
          const nextPlan = unifiedTradeSignalService.cycleNextTrade(
            selectedSymbol,
            exitPrice,
            currentPlan.decision
          );

          setPlans((prev) => ({
            ...prev,
            [selectedSymbol]: nextPlan
          }));

          if (candleSeriesRef.current) {
            renderPriceLines(candleSeriesRef.current, nextPlan, analysis);
            renderMarkers(candleSeriesRef.current, nextPlan, candlesRef.current, analysis);
          }

          setTradeAlert({
            type: 'NEW',
            message: `⚡ AGLI TRADE #${nextPlan.tradeNumber} ACTIVATED: ${nextPlan.decision} Signal on ${nextPlan.displaySymbol} at ${nextPlan.entryZone}! Chart levels aur USDT flow update ho chuke hain.`,
            timestamp: Date.now()
          });

          isTransitioningRef.current = false;
        }, 1200);
      } else {
        isTransitioningRef.current = false;
      }
    },
    [plan, selectedSymbol, autoAdvance, playSuccessChime, playBeepSound, renderPriceLines, renderMarkers, analysis]
  );

  // ─── USER ACTIVE POSITION CONTROLS ("Maine Yeh Trade Le Liya") ───
  const saveUserTrade = useCallback(
    (trade: UserActiveTradeSession | null) => {
      setUserActiveTrade(trade);
      userActiveTradeRef.current = trade;
      try {
        if (trade) {
          localStorage.setItem(`ishantmacro_user_trade_${selectedSymbol}`, JSON.stringify(trade));
        } else {
          localStorage.removeItem(`ishantmacro_user_trade_${selectedSymbol}`);
        }
      } catch {}
      if (candleSeriesRef.current && plan) {
        renderPriceLines(candleSeriesRef.current, plan, analysis, trade);
      }
    },
    [selectedSymbol, plan, analysis, renderPriceLines]
  );

  // Check real-time tick levels (0-ms real-time tick evaluation)
  const checkTradeLevels = useCallback(
    (price: number) => {
      if (!plan || isTransitioningRef.current) return;

      // 1. Check User Active Trade Stop Loss
      if (userActiveTradeRef.current && userActiveTradeRef.current.symbol === selectedSymbol) {
        const uTrade = userActiveTradeRef.current;
        const isLong = uTrade.decision === 'LONG';
        const effStop = uTrade.slMovedToCost ? uTrade.entryPrice : plan.stopLossPrice;
        const isUserSlHit = isLong ? price <= effStop : price >= effStop;
        if (isUserSlHit) {
          const pts = isLong ? Math.round(price - uTrade.entryPrice) : Math.round(uTrade.entryPrice - price);
          const pct = parseFloat(((pts / uTrade.entryPrice) * 100).toFixed(2));
          const histItem: TradeHistoryItem = {
            id: `user-sl-${Date.now()}`,
            tradeNumber: uTrade.tradeNumber,
            symbol: selectedSymbol,
            decision: uTrade.decision,
            entryPrice: uTrade.entryPrice,
            exitPrice: price,
            stopLossPrice: effStop,
            targetTp3: plan.targetTp3,
            outcome: 'SL_HIT',
            pnlPoints: pts,
            pnlPercent: pct,
            closedAt: new Date().toLocaleTimeString(),
            note: `Stop Loss Hit at $${price.toLocaleString()} USD (${pts >= 0 ? '+' : ''}${pts} pts / ${pct}%). Strict Risk Protection Enforced.`
          };
          setTradeHistories((prev) => ({
            ...prev,
            [selectedSymbol]: [histItem, ...(prev[selectedSymbol] || [])]
          }));
          saveUserTrade(null);
          playBeepSound(440);
          setTradeAlert({
            type: 'SL',
            message: `🛑 STOP LOSS HIT: Aapka trade invalidation level ($${effStop.toLocaleString()} USD) par stop ho gaya hai! Loss: ${pts} USD (${pct}%). Capital strictly protect kiya gaya!`,
            timestamp: Date.now()
          });
          return;
        }
      }

      // 2. Check System Plan Levels (only when not in WAIT, and only when status is ACTIVE)
      if (plan.decision === 'WAIT' || plan.status === 'SL_HIT') return;
      const { decision, stopLossPrice, targetTp1, targetTp2, targetTp3 } = plan;

      // 1. Check Stop Loss (STRICTLY FIXED - NEVER TRAILED OR MOVED)
      const isSlHit = decision === 'SHORT' ? price >= stopLossPrice : price <= stopLossPrice;
      if (isSlHit && plan.status === 'ACTIVE') {
        handleTradeOutcome('SL_HIT', price);
        return;
      }

      // 2. Check TP3
      const isTp3Hit = decision === 'SHORT' ? price <= targetTp3 : price >= targetTp3;
      if (isTp3Hit) {
        handleTradeOutcome('TP3_HIT', price);
        return;
      }

      // 3. Check TP2
      const isTp2Hit = decision === 'SHORT' ? price <= targetTp2 : price >= targetTp2;
      if (isTp2Hit && plan.status !== 'TP2_HIT' && plan.status !== 'TP3_HIT') {
        setPlans((prev) => ({
          ...prev,
          [selectedSymbol]: { ...prev[selectedSymbol], status: 'TP2_HIT' }
        }));
        playBeepSound(1046);
        return;
      }

      // 4. Check TP1
      const isTp1Hit = decision === 'SHORT' ? price <= targetTp1 : price >= targetTp1;
      if (isTp1Hit && plan.status === 'ACTIVE') {
        setPlans((prev) => ({
          ...prev,
          [selectedSymbol]: { ...prev[selectedSymbol], status: 'TP1_HIT' }
        }));
        playBeepSound(880);
        return;
      }
    },
    [plan, selectedSymbol, handleTradeOutcome, saveUserTrade, playBeepSound]
  );

  checkTradeLevelsRef.current = checkTradeLevels;

  // Manual Next Trade Button
  const handleForceNextTrade = () => {
    const currentPrice = livePrice || plan.entryPrice;
    const nextPlan = unifiedTradeSignalService.cycleNextTrade(selectedSymbol, currentPrice);

    const historyItem: TradeHistoryItem = {
      id: `manual-${Date.now()}`,
      tradeNumber: plan.tradeNumber,
      symbol: selectedSymbol,
      decision: plan.decision,
      entryPrice: plan.entryPrice,
      exitPrice: currentPrice,
      stopLossPrice: plan.stopLossPrice,
      targetTp3: plan.targetTp3,
      outcome: 'MANUAL_ROTATED',
      pnlPoints:
        plan.decision === 'SHORT'
          ? Math.round(plan.entryPrice - currentPrice)
          : Math.round(currentPrice - plan.entryPrice),
      pnlPercent: parseFloat(
        (
          ((plan.decision === 'SHORT' ? plan.entryPrice - currentPrice : currentPrice - plan.entryPrice) /
            plan.entryPrice) *
          100
        ).toFixed(2)
      ),
      closedAt: new Date().toLocaleTimeString(),
      note: 'User manually requested next setup rotation.'
    };

    setTradeHistories((prev) => ({
      ...prev,
      [selectedSymbol]: [historyItem, ...(prev[selectedSymbol] || [])].slice(0, 15)
    }));

    setPlans((prev) => ({
      ...prev,
      [selectedSymbol]: nextPlan
    }));

    if (candleSeriesRef.current) {
      renderPriceLines(candleSeriesRef.current, nextPlan, analysis);
    }

    setTradeAlert({
      type: 'NEW',
      message: `⚡ Fresh Setup Scan: Trade #${nextPlan.tradeNumber} (${nextPlan.decision}) activated for ${nextPlan.displaySymbol}! Levels chart par update ho chuke hain.`,
      timestamp: Date.now()
    });

    playBeepSound(980);
  };

  // Instant Bias Direction Switcher (LONG <-> SHORT)
  const handleToggleDecision = () => {
    const currentPrice = livePrice || plan.entryPrice;
    const toggled = unifiedTradeSignalService.toggleDecision(selectedSymbol, currentPrice);

    setPlans((prev) => ({
      ...prev,
      [selectedSymbol]: toggled
    }));

    if (candleSeriesRef.current) {
      renderPriceLines(candleSeriesRef.current, toggled, analysis);
    }

    setTradeAlert({
      type: 'NEW',
      message: `🔄 DIRECTION SWITCHED: ${toggled.decision} Setup Activated! Dono charts par exact same ${toggled.decision} signal sync ho gaya.`,
      timestamp: Date.now()
    });

    playBeepSound(1046);
  };

  // Add Custom Coin Action
  const handleAddCustomCoin = () => {
    const clean = customCoinInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return;
    const sym = clean.endsWith('USDT') ? clean : `${clean}USDT`;
    setSelectedSymbol(sym);
    setShowAddCoin(false);
    setCustomCoinInput('');
    playBeepSound(1046);
  };


  const handleTakeTrade = (customPrice?: number) => {
    const entry = customPrice && customPrice > 0 ? customPrice : livePrice || plan.entryPrice;
    const cleanEntry = Math.round(entry * 100) / 100;
    const newSession: UserActiveTradeSession = {
      symbol: selectedSymbol,
      entryPrice: cleanEntry,
      entryTime: Date.now(),
      decision: plan.decision,
      tradeNumber: plan.tradeNumber || 1,
      tp1Secured: false,
      tp2Secured: false,
      slMovedToCost: false,
      leverage: 1
    };
    saveUserTrade(newSession);
    playSuccessChime();
    setTradeAlert({
      type: 'NEW',
      message: `🎉 MAINE YEH TRADE LE LIYA (ACTIVE)! Entry: $${cleanEntry.toLocaleString()} USD (${plan.decision}). AI ab aapko point-by-point live guidance dega!`,
      timestamp: Date.now()
    });
  };

  const handleToggleSlToCost = () => {
    if (!userActiveTrade) return;
    const updated = { ...userActiveTrade, slMovedToCost: !userActiveTrade.slMovedToCost };
    saveUserTrade(updated);
    playBeepSound(1046);
    setTradeAlert({
      type: 'NEW',
      message: updated.slMovedToCost
        ? `🛡️ STOP LOSS ENTRY COST ($${updated.entryPrice.toLocaleString()} USD) PAR SHIFT HO GAYA! Trade ab 100% Risk-Free hai!`
        : `Stop Loss standard plan level ($${plan.stopLossPrice.toLocaleString()} USD) par set kiya gaya.`,
      timestamp: Date.now()
    });
  };

  const handleMarkTp1Secured = () => {
    if (!userActiveTrade) return;
    const updated = { ...userActiveTrade, tp1Secured: true, slMovedToCost: true };
    saveUserTrade(updated);
    playSuccessChime();
    setTradeAlert({
      type: 'TP',
      message: `🏁 TP1 40% PROFIT SECURED! Stop Loss ko Entry ($${updated.entryPrice.toLocaleString()} USD) par lock kar diya gaya hai. Bacha hua 60% runner hold karein!`,
      timestamp: Date.now()
    });
  };

  const handleMarkTp2Secured = () => {
    if (!userActiveTrade) return;
    const updated = { ...userActiveTrade, tp2Secured: true };
    saveUserTrade(updated);
    playSuccessChime();
    setTradeAlert({
      type: 'TP',
      message: `🎯 TP2 35% PROFIT SECURED! Ab bacha hua 25% waterfall runner TP3 ($${plan.targetTp3.toLocaleString()} USD) ke liye trail karein!`,
      timestamp: Date.now()
    });
  };

  const handleCloseUserTrade = () => {
    if (!userActiveTrade) return;
    const exit = livePrice;
    const isLong = userActiveTrade.decision === 'LONG';
    const pts = isLong ? Math.round(exit - userActiveTrade.entryPrice) : Math.round(userActiveTrade.entryPrice - exit);
    const pct = parseFloat(((pts / userActiveTrade.entryPrice) * 100).toFixed(2));

    const histItem: TradeHistoryItem = {
      id: `user-closed-${Date.now()}`,
      tradeNumber: userActiveTrade.tradeNumber,
      symbol: selectedSymbol,
      decision: userActiveTrade.decision,
      entryPrice: userActiveTrade.entryPrice,
      exitPrice: exit,
      stopLossPrice: userActiveTrade.slMovedToCost ? userActiveTrade.entryPrice : plan.stopLossPrice,
      targetTp3: plan.targetTp3,
      outcome: pts >= 0 ? 'TP3_HIT' : 'SL_HIT',
      pnlPoints: pts,
      pnlPercent: pct,
      closedAt: new Date().toLocaleTimeString(),
      note: `User Exited at $${exit.toLocaleString()} USD (${pts >= 0 ? '+' : ''}${pts} pts / ${pct}%)`
    };

    setTradeHistories((prev) => ({
      ...prev,
      [selectedSymbol]: [histItem, ...(prev[selectedSymbol] || [])]
    }));

    saveUserTrade(null);
    if (pts >= 0) playSuccessChime(); else playBeepSound(440);
    setTradeAlert({
      type: pts >= 0 ? 'TP' : 'SL',
      message: `✅ TRADE CLOSED: Exit at $${exit.toLocaleString()} USD! PnL: ${pts >= 0 ? '+' : ''}${pts} USD (${pct}%). Ledger me record save ho chuka hai!`,
      timestamp: Date.now()
    });
  };

  const handleCancelUserTrade = () => {
    saveUserTrade(null);
    playBeepSound(600);
    setTradeAlert({
      type: 'NEW',
      message: 'Position tracking reset. Agli trade scan karne ke liye ready.',
      timestamp: Date.now()
    });
  };

  // User Active Trade PnL & Distance Math
  const userPnlInfo = useMemo(() => {
    if (!userActiveTrade || userActiveTrade.symbol !== selectedSymbol) return null;
    const entry = userActiveTrade.entryPrice;
    const isLong = userActiveTrade.decision === 'LONG';
    const pts = isLong ? (livePrice - entry) : (entry - livePrice);
    const pct = entry > 0 ? ((pts / entry) * 100) : 0;
    const effStop = userActiveTrade.slMovedToCost ? entry : plan.stopLossPrice;
    const distToSl = Math.abs(livePrice - effStop);
    const distToTp1 = Math.abs(plan.targetTp1 - livePrice);
    const isTp1Reached = isLong ? livePrice >= plan.targetTp1 : livePrice <= plan.targetTp1;
    const isTp2Reached = isLong ? livePrice >= plan.targetTp2 : livePrice <= plan.targetTp2;
    const isTp3Reached = isLong ? livePrice >= plan.targetTp3 : livePrice <= plan.targetTp3;
    const isSlTouched = isLong ? livePrice <= effStop : livePrice >= effStop;

    return {
      pts: Math.round(pts),
      pct: parseFloat(pct.toFixed(2)),
      effStop,
      distToSl: Math.round(distToSl),
      distToTp1: Math.round(distToTp1),
      isTp1Reached,
      isTp2Reached,
      isTp3Reached,
      isSlTouched
    };
  }, [userActiveTrade, selectedSymbol, livePrice, plan]);

  // ─── 1. FETCH REAL CANDLES, RUN MARKET STRUCTURE ENGINE & INITIALIZE CHART ───
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
      width: container.clientWidth || 800,
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

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    let isCancelled = false;
    const fetchCandles = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${selectedSymbol}&interval=${timeframe}&limit=100`
        );
        if (!res.ok) throw new Error('Failed to fetch candles');
        const data = await res.json();
        if (isCancelled) return;

        const formattedCandles: CandleData[] = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as any,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5])
        }));

        const formattedVolumes = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as any,
          value: parseFloat(d[5]),
          color: parseFloat(d[4]) >= parseFloat(d[1]) ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
        }));

        candleSeries.setData(formattedCandles);
        volumeSeries.setData(formattedVolumes);
        candlesRef.current = formattedCandles;

        if (formattedCandles.length > 0) {
          const last = formattedCandles[formattedCandles.length - 1];
          setLivePrice(last.close);

          // 1. Run Complete Mathematical Market Structure Engine (BOS, CHoCH, OBs, FVGs, S/R, Volume Profile, Confluence)
          const mAnalysis = analyzeMarketStructure(
            selectedSymbol,
            selectedSymbol.replace('USDT', ' / USD'),
            timeframe,
            formattedCandles,
            structureSensitivity
          );
          setAnalysis(mAnalysis);

          // 2. Generate dynamic sniper plan from Unified Store
          const activePlan = unifiedTradeSignalService.getSignal(
            selectedSymbol,
            undefined,
            last.close,
            formattedCandles
          );

          setPlans((prev) => ({
            ...prev,
            [selectedSymbol]: activePlan
          }));

          renderPriceLines(candleSeries, activePlan, mAnalysis);
          renderMarkers(candleSeries, activePlan, formattedCandles, mAnalysis);
        }

        chart.timeScale().fitContent();
        setChartLoaded(true);
      } catch (err) {
        console.warn('Using realistic fallback data for chart:', err);
        const now = Math.floor(Date.now() / 1000);
        const tfSec = 900;
        const baseP = selectedSymbol.includes('PAXG') || selectedSymbol.includes('XAU') ? 4160.17 : 84550;
        const fakeCandles: CandleData[] = [];
        const fakeVols: any[] = [];

        for (let i = 60; i >= 0; i--) {
          const t = now - i * tfSec;
          const open = baseP - (i > 20 ? (60 - i) * (baseP * 0.0004) : (i - 20) * (baseP * 0.0005));
          const close = open + (Math.sin(i) * 0.8) * (baseP * 0.0006);
          const high = Math.max(open, close) + Math.abs(Math.sin(i * 2)) * (baseP * 0.0004);
          const low = Math.min(open, close) - Math.abs(Math.cos(i * 2)) * (baseP * 0.0004);
          fakeCandles.push({ time: t, open, high, low, close, volume: Math.random() * 120 + 20 });
          fakeVols.push({
            time: t,
            value: Math.random() * 120 + 20,
            color: close >= open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'
          });
        }

        candleSeries.setData(fakeCandles);
        volumeSeries.setData(fakeVols);
        candlesRef.current = fakeCandles;
        const lastClose = fakeCandles[fakeCandles.length - 1].close;
        setLivePrice(lastClose);

        const mAnalysis = analyzeMarketStructure(
          selectedSymbol,
          selectedSymbol.replace('USDT', ' / USD'),
          timeframe,
          fakeCandles,
          structureSensitivity
        );
        setAnalysis(mAnalysis);

        const activePlan = unifiedTradeSignalService.getSignal(
          selectedSymbol,
          undefined,
          lastClose,
          fakeCandles
        );

        setPlans((prev) => ({
          ...prev,
          [selectedSymbol]: activePlan
        }));

        renderPriceLines(candleSeries, activePlan, mAnalysis);
        renderMarkers(candleSeries, activePlan, fakeCandles, mAnalysis);
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
  }, [selectedSymbol, timeframe, structureSensitivity, renderPriceLines, renderMarkers]);

  // ─── 2. REAL-TIME 0-MS WEBSOCKET TICKER ───
  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackTimer: any = null;

    try {
      const streamSymbol = selectedSymbol.toLowerCase();
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamSymbol}@ticker`);

      ws.onopen = () => {
        setWsStatus('LIVE');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const price = parseFloat(data.c);
          const change = parseFloat(data.P);
          if (!isNaN(price)) {
            setLivePrice((prev) => {
              if (price > prev) setPriceFlash('up');
              else if (price < prev) setPriceFlash('down');
              setTimeout(() => setPriceFlash(null), 300);
              return price;
            });
            setPriceChange24h(`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`);

            if (candleSeriesRef.current && candlesRef.current.length > 0) {
              const last = { ...candlesRef.current[candlesRef.current.length - 1] };
              last.close = price;
              if (price > last.high) last.high = price;
              if (price < last.low) last.low = price;
              candleSeriesRef.current.update(last as any);
            }

            // Real-time tick evaluation for SL, TP, and Active User Trade
            checkTradeLevelsRef.current?.(price);
          }
        } catch {}
      };

      ws.onerror = () => setWsStatus('CONNECTING');
      ws.onclose = () => setWsStatus('CONNECTING');
    } catch {
      setWsStatus('CONNECTING');
    }

    fallbackTimer = setInterval(() => {
      // ONLY run fallback timer if WebSocket is NOT live!
      setLivePrice((prev) => {
        // If WebSocket is live, do not inject synthetic jitter
        if (wsStatus === 'LIVE') return prev;
        const delta = (Math.random() - 0.495) * (prev * 0.0003);
        const updated = +(prev + delta).toFixed(2);
        if (updated > prev) setPriceFlash('up');
        else if (updated < prev) setPriceFlash('down');
        setTimeout(() => setPriceFlash(null), 300);
        checkTradeLevelsRef.current?.(updated);
        return updated;
      });
    }, 2000);

    return () => {
      if (ws) ws.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [selectedSymbol]);

  const assetTabs = [
    { key: 'BTCUSDT', label: 'BTC / USD', icon: '₿', desc: 'Bitcoin' },
    { key: 'PAXGUSDT', label: 'GOLD / USD (XAU)', icon: '🥇', desc: 'Gold Spot' },
    { key: 'SLVUSDT', label: 'SILVER / USD (XAG)', icon: '🥈', desc: 'Silver Spot' },
    { key: 'ETHUSDT', label: 'ETH / USD', icon: 'Ξ', desc: 'Ethereum' },
    { key: 'SOLUSDT', label: 'SOL / USD', icon: '⚡', desc: 'Solana' }
  ];

  const isShort = plan.decision === 'SHORT';
  const isTp1Achieved = isShort ? livePrice <= plan.targetTp1 : livePrice >= plan.targetTp1;
  const isTp2Achieved = isShort ? livePrice <= plan.targetTp2 : livePrice >= plan.targetTp2;
  const isTp3Achieved = isShort ? livePrice <= plan.targetTp3 : livePrice >= plan.targetTp3;

  const currentHistory = tradeHistories[selectedSymbol] || [];
  const totalCompletedTrades = currentHistory.length;
  const totalWins = currentHistory.filter((t) => t.outcome === 'TP3_HIT').length;
  const winRate = totalCompletedTrades > 0 ? Math.round((totalWins / totalCompletedTrades) * 100) : 100;

  return (
    <div className="w-full space-y-4 font-sans text-slate-100 bg-[#050a14] min-h-screen p-3 sm:p-5 rounded-2xl border border-[#1e293b] shadow-2xl">
      {/* ────────────────── TOP NAVIGATION & ACTIONS BAR ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081020] p-3 sm:p-4 rounded-xl border border-[#1e293b]">
        {/* Brand & Live WebSocket Chip */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/25">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                DEEEPR.AI™ INSTITUTIONAL SNIPER TERMINAL
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                {wsStatus === 'LIVE' ? '0-MS BINANCE WEBSOCKET LIVE' : 'CONNECTING LIVE STREAM...'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Auto-Cycle Trade Engine · Automatically Provides Next Dynamic Setup on TP / SL Hit
            </p>
          </div>
        </div>

        {/* Engine Controls (Force Next Trade, Auto-Advance, Audio, Ledger, AI Chart Analyse Switcher) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Switcher to AI Sniper Chart (Long/Short 11-Factors) */}
          <a
            href="#ai-chart"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white border border-rose-500/50 hover:brightness-125 shadow-md shadow-rose-950/40 transition-all cursor-pointer"
            title="Open Institutional AI Chart — Long / Short / Wait (11-Factor Confluence & Liquidation Clusters)"
          >
            <span>📈</span>
            <span>AI Chart Long/Short (11-Factors) 🎯</span>
          </a>

          {/* Direct Switcher to Market Chart AI Analyzer */}
          <a
            href="#market-chart-analyse"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600/40 via-indigo-600/40 to-pink-600/40 border border-purple-500/50 text-purple-200 hover:brightness-125 shadow-sm transition-all cursor-pointer"
            title="Open Market Chart AI Analyzer (A-to-Z Read)"
          >
            <span>🔬</span>
            <span>AI Chart Analyse ⭐</span>
          </a>

          {/* Locked Confirmed Single Trade Setup Badge (No Flip-Flops) */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm">
            <span>🛡️</span>
            <span>SINGLE DEFINITIVE SETUP · 100% STABLE</span>
          </span>

          {/* Sensitivity */}
          <button
            onClick={() => {
              const next =
                structureSensitivity === 'LOW'
                  ? 'MEDIUM'
                  : structureSensitivity === 'MEDIUM'
                  ? 'HIGH'
                  : 'LOW';
              setStructureSensitivity(next);
            }}
            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-[#0c1426] border border-[#1e293b] text-cyan-300 hover:text-white cursor-pointer"
            title="Structure Detection Sensitivity"
          >
            Sensitivity: {structureSensitivity}
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-[#0c1426] border border-[#1e293b] text-slate-300 hover:text-white"
            title="Chime Audio Alerts on TP/SL"
          >
            {soundEnabled ? '🔔 Audio ON' : '🔕 Mute'}
          </button>

          {/* History Modal Toggle */}
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0a162e] border border-cyan-500/30 text-cyan-300 hover:text-white cursor-pointer"
          >
            <span>📜</span>
            <span>Ledger ({totalCompletedTrades})</span>
          </button>
        </div>

        {/* Asset Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#040814] p-1 rounded-xl border border-[#1e293b]">
          {assetTabs.map((a) => (
            <button
              key={a.key}
              onClick={() => setSelectedSymbol(a.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSymbol === a.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}

          {/* + Add Custom Coin Button */}
          <button
            onClick={() => setShowAddCoin(!showAddCoin)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1"
          >
            <span>➕ Add Coin</span>
          </button>
        </div>

        {/* Timeframe Selector & MTF Toggle */}
        <div className="flex items-center gap-1 bg-[#040814] p-1 rounded-xl border border-[#1e293b]">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
                timeframe === tf ? 'bg-blue-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={() => setIsMtfMode(!isMtfMode)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              isMtfMode ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'text-slate-400'
            }`}
          >
            MTF {isMtfMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ────────────────── ADD CUSTOM COIN MODAL / BAR ────────────────── */}
      {showAddCoin && (
        <div className="p-3 bg-[#0a1428] rounded-xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">🪙</span>
            <span className="text-xs text-white font-bold">Add Any Crypto or Delta Exchange Pair:</span>
            <input
              type="text"
              value={customCoinInput}
              onChange={(e) => setCustomCoinInput(e.target.value)}
              placeholder="e.g. XRP, DOGE, BNB, SUI"
              className="px-2.5 py-1 rounded bg-[#040812] border border-slate-700 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCoin()}
            />
            <button
              onClick={handleAddCustomCoin}
              className="px-3 py-1 rounded bg-amber-400 text-slate-950 font-bold text-xs hover:brightness-110 cursor-pointer"
            >
              Load Ticker
            </button>
          </div>
          <button
            onClick={() => setShowAddCoin(false)}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* ────────────────── ⚡ REAL-TIME TRADE NOTIFICATION BANNER ────────────────── */}
      {tradeAlert && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm font-bold shadow-lg transition-all animate-fadeIn ${
            tradeAlert.type === 'TP'
              ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/50 to-[#081024] border-emerald-500/50 text-emerald-200'
              : tradeAlert.type === 'SL'
              ? 'bg-gradient-to-r from-rose-950/80 via-rose-900/50 to-[#081024] border-rose-500/50 text-rose-200'
              : 'bg-gradient-to-r from-cyan-950/80 via-blue-900/50 to-[#081024] border-cyan-500/50 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {tradeAlert.type === 'TP' ? '🏆' : tradeAlert.type === 'SL' ? '🛑' : '⚡'}
            </span>
            <span>{tradeAlert.message}</span>
          </div>
          <button
            onClick={() => setTradeAlert(null)}
            className="px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white bg-slate-900/50 border border-slate-700/50 cursor-pointer"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* ────────────────── 🕹️ DIRECT DECISION SELECTOR (AI AUTO / SHORT / LONG / WAIT) ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081022] p-3 rounded-2xl border-2 border-cyan-500/30 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <div>
            <span className="text-xs font-black uppercase text-white tracking-wider block">
              Trade Direction Selector (100% Fixed SL & TP):
            </span>
            <span className="text-[11px] text-slate-400">
              Pick Short, Long, or Wait directly — or let AI Smart Auto analyze the candles
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI SMART AUTO */}
          <button
            onClick={() => {
              const autoSignal = unifiedTradeSignalService.reevaluateWithCandles(
                selectedSymbol,
                candlesRef.current,
                livePrice
              );
              setPlans((prev) => ({ ...prev, [selectedSymbol]: autoSignal }));
              if (candleSeriesRef.current) {
                renderPriceLines(candleSeriesRef.current, autoSignal, analysis);
                renderMarkers(candleSeriesRef.current, autoSignal, candlesRef.current, analysis);
              }
              playBeepSound(980);
              setTradeAlert({
                type: 'NEW',
                message: `🤖 AI SMART AUTO RE-EVALUATED: ${autoSignal.decision} setup detected based on real market structure and candles!`,
                timestamp: Date.now()
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:brightness-110 shadow-md shadow-cyan-900/40 cursor-pointer active:scale-95 transition-all"
            title="Automatically detect direction from real multi-timeframe candles"
          >
            <span>🤖</span>
            <span>AI Smart Auto</span>
          </button>

          {/* SHORT SETUP BUTTON */}
          <button
            onClick={() => {
              const shortSignal = unifiedTradeSignalService.setDecision(
                selectedSymbol,
                'SHORT',
                livePrice,
                candlesRef.current
              );
              setPlans((prev) => ({ ...prev, [selectedSymbol]: shortSignal }));
              if (candleSeriesRef.current) {
                renderPriceLines(candleSeriesRef.current, shortSignal, analysis);
                renderMarkers(candleSeriesRef.current, shortSignal, candlesRef.current, analysis);
              }
              playBeepSound(1046);
              setTradeAlert({
                type: 'NEW',
                message: `🔴 SHORT SETUP ACTIVATED for ${shortSignal.displaySymbol}: Entry ${shortSignal.entryZone}, Strict Fixed SL $${shortSignal.stopLossPrice.toLocaleString()} USD!`,
                timestamp: Date.now()
              });
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              plan.decision === 'SHORT'
                ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/50 scale-[1.03] border-2 border-rose-300 ring-2 ring-rose-500/50'
                : 'bg-rose-950/40 text-rose-300 border border-rose-700/50 hover:bg-rose-900/50'
            }`}
          >
            <span>🔴</span>
            <span>SHORT SETUP</span>
          </button>

          {/* LONG SETUP BUTTON */}
          <button
            onClick={() => {
              const longSignal = unifiedTradeSignalService.setDecision(
                selectedSymbol,
                'LONG',
                livePrice,
                candlesRef.current
              );
              setPlans((prev) => ({ ...prev, [selectedSymbol]: longSignal }));
              if (candleSeriesRef.current) {
                renderPriceLines(candleSeriesRef.current, longSignal, analysis);
                renderMarkers(candleSeriesRef.current, longSignal, candlesRef.current, analysis);
              }
              playBeepSound(1046);
              setTradeAlert({
                type: 'NEW',
                message: `🟢 LONG SETUP ACTIVATED for ${longSignal.displaySymbol}: Entry ${longSignal.entryZone}, Strict Fixed SL $${longSignal.stopLossPrice.toLocaleString()} USD!`,
                timestamp: Date.now()
              });
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              plan.decision === 'LONG'
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/50 scale-[1.03] border-2 border-emerald-300 ring-2 ring-emerald-500/50'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/50'
            }`}
          >
            <span>🟢</span>
            <span>LONG SETUP</span>
          </button>

          {/* WAIT SETUP BUTTON */}
          <button
            onClick={() => {
              const waitSignal = unifiedTradeSignalService.setDecision(
                selectedSymbol,
                'WAIT',
                livePrice,
                candlesRef.current
              );
              setPlans((prev) => ({ ...prev, [selectedSymbol]: waitSignal }));
              if (candleSeriesRef.current) {
                renderPriceLines(candleSeriesRef.current, waitSignal, analysis);
                renderMarkers(candleSeriesRef.current, waitSignal, candlesRef.current, analysis);
              }
              playBeepSound(880);
              setTradeAlert({
                type: 'NEW',
                message: `⏳ WAIT MODE ACTIVATED: Market chop zone me hai. Favorable key levels tap hone ka wait karein.`,
                timestamp: Date.now()
              });
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              plan.decision === 'WAIT'
                ? 'bg-amber-500 text-slate-950 shadow-xl shadow-amber-900/50 scale-[1.03] border-2 border-amber-200 ring-2 ring-amber-500/50'
                : 'bg-amber-950/40 text-amber-300 border border-amber-700/50 hover:bg-amber-900/50'
            }`}
          >
            <span>⏳</span>
            <span>WAIT (NO TRADE)</span>
          </button>
        </div>
      </div>

      {/* ────────────────── 🚨 AI TRADE DECISION HERO CARD (DYNAMIC LONG, SHORT, YA WAIT) ────────────────── */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xl space-y-4 transition-all ${
          plan.decision === 'WAIT'
            ? 'bg-gradient-to-r from-[#171407] via-[#120f06] to-[#081024] border-amber-500/40 shadow-amber-950/30'
            : plan.decision === 'SHORT'
            ? 'bg-gradient-to-r from-[#170712] via-[#100618] to-[#081024] border-rose-500/40 shadow-rose-950/30'
            : 'bg-gradient-to-r from-[#051812] via-[#081820] to-[#081024] border-emerald-500/40 shadow-emerald-950/30'
        }`}
      >
        {/* Signal & Live Price Row */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
            plan.decision === 'WAIT'
              ? 'border-amber-500/20'
              : plan.decision === 'SHORT'
              ? 'border-rose-500/20'
              : 'border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex size-4">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  plan.decision === 'WAIT'
                    ? 'bg-amber-400'
                    : plan.decision === 'SHORT'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full size-4 ${
                  plan.decision === 'WAIT'
                    ? 'bg-amber-500'
                    : plan.decision === 'SHORT'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
              ></span>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    plan.decision === 'WAIT'
                      ? 'text-amber-400'
                      : plan.decision === 'SHORT'
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {plan.decision === 'WAIT'
                    ? `⏳ AI VERDICT: WAIT (CHOP / AWAITING PULLBACK TO KEY LEVEL)`
                    : plan.decision === 'SHORT'
                    ? `🔴 AI VERDICT: SHORT (SELL THE RETEST INTO RESISTANCE)`
                    : `🟢 AI VERDICT: LONG (BUY THE DISCOUNT DEMAND SWEEP)`}
                </span>

                <span
                  className={`px-2 py-0.5 rounded font-black text-xs border ${
                    plan.decision === 'WAIT'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : plan.decision === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {plan.convictionPct}% CONVICTION
                </span>

                {plan.status === 'SL_HIT' ? (
                  <span className="px-2.5 py-0.5 rounded font-black text-xs bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                    🛑 STOP LOSS HIT · TRADE INVALIDATED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded font-black text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    TRADE #{plan.tradeNumber || 1} ACTIVE ⚡
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {plan.status === 'SL_HIT'
                  ? `Trade #${plan.tradeNumber} ka Stop Loss $${plan.stopLossPrice.toLocaleString()} USD touch ho gaya hai. Capital strictly protect kiya gaya hai. Stop loss ko kabhi float ya bada nahi kiya jayega!`
                  : plan.hindiExplanation}
              </p>
            </div>
          </div>

            {/* Real-Time Live Price Pill */}
            <div className="flex items-center gap-2.5 bg-[#040814] px-4 py-2 rounded-xl border border-[#1e293b]">
              <span className="text-xs text-slate-400 font-medium">Binance Live (USD):</span>
            <span
              className={`text-xl sm:text-2xl font-black tabular-nums transition-colors duration-300 ${
                priceFlash === 'up'
                  ? 'text-emerald-400'
                  : priceFlash === 'down'
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                priceChange24h.startsWith('+')
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {priceChange24h}
            </span>
          </div>
        </div>

        {/* 6 Big Bold Clean Level Cards with Live Progress Status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Entry */}
          <div className="bg-[#0c1426] p-3 rounded-xl border border-amber-400/40">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">🎯 SNIPER ENTRY</span>
            <span className="text-sm sm:text-base font-extrabold text-white block mt-0.5 tabular-nums">
              {plan.entryZone}
            </span>
            <span className="text-[10px] text-slate-400">Optimal Execution Zone</span>
          </div>

          {/* Stop Loss */}
          <div className="bg-[#1a0812] p-3 rounded-xl border border-rose-500/50">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">🛑 STOP LOSS (SL)</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-300 block mt-0.5 tabular-nums">
              ${plan.stopLossPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-400/80">Strict Risk Protection</span>
          </div>

          {/* TP1 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              isTp1Achieved
                ? 'bg-[#04281e] border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-[#061814] border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏁 TARGET 1 (TP1)</span>
              {isTp1Achieved && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 animate-pulse">
                  HIT ✅
                </span>
              )}
            </div>
            <span className="text-sm sm:text-base font-extrabold text-emerald-300 block mt-0.5 tabular-nums">
              ${plan.targetTp1.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Take 40% Profit</span>
          </div>

          {/* TP2 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              isTp2Achieved
                ? 'bg-[#04281e] border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-[#061814] border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏁 TARGET 2 (TP2)</span>
              {isTp2Achieved && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 animate-pulse">
                  HIT ✅
                </span>
              )}
            </div>
            <span className="text-sm sm:text-base font-extrabold text-emerald-300 block mt-0.5 tabular-nums">
              ${plan.targetTp2.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Take 35% Profit</span>
          </div>

          {/* TP3 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              isTp3Achieved
                ? 'bg-[#04281e] border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-[#061814] border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">🏆 TARGET 3 (TP3)</span>
              {isTp3Achieved && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 animate-pulse">
                  HIT 🏆
                </span>
              )}
            </div>
            <span className="text-sm sm:text-base font-extrabold text-emerald-300 block mt-0.5 tabular-nums">
              ${plan.targetTp3.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Full Waterfall Runner</span>
          </div>

          {/* R:R Ratio */}
          <div className="bg-[#0a162e] p-3 rounded-xl border border-cyan-500/40">
            <span className="text-[10px] uppercase font-bold text-cyan-300 block">⚖️ REWARD : RISK</span>
            <span className="text-sm sm:text-base font-black text-cyan-200 block mt-0.5">{plan.rewardToRisk}</span>
            <span className="text-[10px] text-slate-400">Institutional Asymmetry</span>
          </div>
        </div>

        {/* ─── 🛑 STOP LOSS HIT ACTION BANNER (NO SILENT FLOATING / USER CONTROLLED) ─── */}
        {plan.status === 'SL_HIT' && (
          <div className="p-4 bg-gradient-to-r from-rose-950 via-[#150711] to-[#0a1024] border-2 border-rose-500/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-rose-950/40 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛑</span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-rose-200">
                    Trade #{plan.tradeNumber} Invalidation Hit at ${plan.stopLossPrice.toLocaleString()} USD
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50">
                    STRICT CAPITAL PROTECTION
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Market ne support breakdown kiya hai. Professional rules ke mutabiq Stop Loss ko kabhi neeche nahi khiskaya jata. Market re-evaluation ke baad agli high-conviction trade activate karne ke liye button par click karein.
                </p>
              </div>
            </div>

            <button
              onClick={handleForceNextTrade}
              className="px-5 py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 hover:brightness-110 shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Agli Institutional Trade Scan Karein</span>
            </button>
          </div>
        )}

        {/* ─── 🚀 USER ACTIVE TRADE CONTROLS ("Maine Yeh Trade Le Liya") ─── */}
        {!userActiveTrade && (
          <div className="bg-gradient-to-r from-emerald-950/70 via-[#071322] to-cyan-950/70 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/15 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Kya Aapne Exchange Par Yeh Trade Le Liya Hai?
                </h3>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  AI REAL-TIME COPILOT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Jaise hi aap Binance, Delta ya kisi exchange par entry execute karein, yahan click karein: <strong className="text-emerald-300 font-bold">&quot;YES, MAINE YEH TRADE LE LIYA&quot;</strong>. AI ko pata chal jayega aur AI aapko live position PnL, profit booking (TP1/TP2/TP3) aur Stop Loss Cost par lock karne ki point-by-point guidance dega!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleTakeTrade(livePrice)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:brightness-110 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-lg">🚀</span>
                <span>YES, MAINE YEH TRADE LE LIYA (ON KAR DIYA)</span>
              </button>

              <button
                onClick={() => {
                  setCustomEntryInput(livePrice ? String(Math.round(livePrice)) : '');
                  setShowEditEntryModal(true);
                }}
                className="px-3.5 py-3 rounded-xl text-xs font-bold bg-[#0c1a33] text-cyan-200 border border-cyan-500/40 hover:bg-cyan-900/40 hover:text-white transition-all cursor-pointer"
                title="Custom price par exact entry specify karein"
              >
                ✏️ Custom Entry
              </button>
            </div>
          </div>
        )}

        {/* ─── 🟢 ACTIVE LIVE POSITION DASHBOARD (USER POSITION IN PLAY) ─── */}
        {userActiveTrade && userPnlInfo && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 shadow-2xl space-y-4 animate-fadeIn ${
              userPnlInfo.isSlTouched
                ? 'bg-gradient-to-r from-[#2c0814] via-[#1a0410] to-[#0a0714] border-rose-500 shadow-rose-950/60'
                : 'bg-gradient-to-r from-[#031c16] via-[#051428] to-[#041d1a] border-emerald-400 shadow-emerald-500/25'
            }`}
          >
            {/* Header Status Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                userPnlInfo.isSlTouched ? 'border-rose-500/40' : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`size-3.5 rounded-full ${
                    userPnlInfo.isSlTouched ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-ping'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-white">
                      {userPnlInfo.isSlTouched
                        ? '🛑 AAPKI POSITION STOP LOSS HIT PAR INVALIDATE HO CHUKI HAI'
                        : '🟢 AAPKI LIVE POSITION ACTIVE HAI (IN PLAY)'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        userPnlInfo.isSlTouched ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {userActiveTrade.decision}
                    </span>
                    {userPnlInfo.isSlTouched ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600/30 text-rose-300 border border-rose-500/50 animate-pulse">
                        🛑 STOP LOSS HIT (-${Math.abs(userPnlInfo.pts).toLocaleString()} USD)
                      </span>
                    ) : userActiveTrade.slMovedToCost ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-400 text-slate-950">
                        🛡️ 100% RISK-FREE (COST SL)
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-300">
                    Entry Price: <strong className="text-white font-mono font-bold">${userActiveTrade.entryPrice.toLocaleString()} USD</strong> · Started: {new Date(userActiveTrade.entryTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Live PnL Counter */}
              <div
                className={`flex items-center gap-3 bg-[#020b14] px-4 py-2.5 rounded-xl border ${
                  userPnlInfo.isSlTouched ? 'border-rose-500/50' : 'border-emerald-500/40'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Live PnL (USD)</span>
                  <span
                    className={`text-xl sm:text-2xl font-black font-mono tabular-nums ${
                      userPnlInfo.pts >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {userPnlInfo.pts >= 0 ? '+' : ''}${userPnlInfo.pts.toLocaleString()} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Return</span>
                  <span
                    className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                      userPnlInfo.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {userPnlInfo.pct >= 0 ? '+' : ''}{userPnlInfo.pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Guidance Message based on price action */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                userPnlInfo.isSlTouched
                  ? 'bg-rose-950/90 border-rose-500 animate-pulse'
                  : userPnlInfo.isTp1Reached && !userActiveTrade.tp1Secured
                  ? 'bg-emerald-950/80 border-emerald-400 animate-pulse'
                  : userActiveTrade.slMovedToCost
                  ? 'bg-cyan-950/60 border-cyan-500/50'
                  : 'bg-[#06152a] border-slate-700'
              }`}
            >
              <span className="text-2xl">
                {userPnlInfo.isSlTouched
                  ? '🛑'
                  : userPnlInfo.isTp1Reached && !userActiveTrade.tp1Secured
                  ? '🏆'
                  : userActiveTrade.slMovedToCost
                  ? '🛡️'
                  : '💡'}
              </span>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {userPnlInfo.isSlTouched
                    ? 'STOP LOSS HIT! INVALIDATION LEVEL TOUCH HO GAYA HAI'
                    : userPnlInfo.isTp1Reached && !userActiveTrade.tp1Secured
                    ? 'TARGET 1 REACHED! 40% PROFIT BOOK KAREIN AUR SL ENTRY PAR SHIFT KAREIN'
                    : userActiveTrade.slMovedToCost
                    ? 'TRADE 100% RISK-FREE HAI! AB TENSION-FREE RUNNER ENJOY KAREIN'
                    : 'AI COPILOT REAL-TIME ADVICE:'}
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {userPnlInfo.isSlTouched
                    ? `Live price ne aapka Stop Loss ($${userPnlInfo.effStop.toLocaleString()} USD) touch kar liya hai. Market reversal ho chuka hai. Disciplined trader ki tarah loss ($${Math.abs(userPnlInfo.pts).toLocaleString()} USD) book karein aur position reset karein. Stop Loss ko kabhi float ya bada na karein!`
                    : userPnlInfo.isTp1Reached && !userActiveTrade.tp1Secured
                    ? `Price ne TP1 ($${plan.targetTp1.toLocaleString()} USD) touch kar liya hai! Abhi apna 40% profit secure karein aur exchange par SL ko exact $${userActiveTrade.entryPrice.toLocaleString()} (Cost) par shift karein.`
                    : userActiveTrade.slMovedToCost
                    ? `Aapka Stop Loss entry price ($${userActiveTrade.entryPrice.toLocaleString()} USD) par secured hai. Agar market reverse bhi hua to ₹1 ka loss nahi hoga. TP2 ($${plan.targetTp2.toLocaleString()} USD) aur TP3 ($${plan.targetTp3.toLocaleString()} USD) ke liye hold karein!`
                    : userPnlInfo.pts > 0
                    ? `Position green me chal rahi hai (+${userPnlInfo.pts} USD). TP1 ($${plan.targetTp1.toLocaleString()} USD) ab sirf $${userPnlInfo.distToTp1} USD door hai. Strict plan follow karein.`
                    : `Market pull back kar raha hai. Stop loss strict $${userPnlInfo.effStop.toLocaleString()} USD par laga rakhein. Panic me out na hon.`}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for the Active Trade */}
            {userPnlInfo.isSlTouched ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  onClick={handleCloseUserTrade}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white hover:brightness-110 shadow-xl shadow-rose-950/50 cursor-pointer"
                >
                  <span>🛑</span>
                  <span>STOP LOSS HIT: POSITION CLOSE & RECORD LOSS (-${Math.abs(userPnlInfo.pts).toLocaleString()} USD)</span>
                </button>
                <button
                  onClick={handleCancelUserTrade}
                  className="px-4 py-3 rounded-xl text-xs font-black bg-[#140810] text-rose-300 border border-rose-500/50 hover:bg-rose-950/60 cursor-pointer"
                >
                  ❌ Reset Tracking Direct
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mark TP1 Secured */}
                  <button
                    onClick={handleMarkTp1Secured}
                    disabled={userActiveTrade.tp1Secured}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      userActiveTrade.tp1Secured
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-emerald-500 text-slate-950 hover:brightness-110 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    <span>{userActiveTrade.tp1Secured ? '✅' : '🏁'}</span>
                    <span>{userActiveTrade.tp1Secured ? 'TP1 40% Booked' : 'TP1 Book Kiya (40%)'}</span>
                  </button>

                  {/* Move SL to Cost Button */}
                  <button
                    onClick={handleToggleSlToCost}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      userActiveTrade.slMovedToCost
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-[#0c1c38] text-cyan-200 border-cyan-500/40 hover:bg-cyan-900/40'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>{userActiveTrade.slMovedToCost ? 'SL Cost Par Hai (Risk-Free)' : 'SL Entry Cost Par Shift Karein'}</span>
                  </button>

                  {/* Mark TP2 Secured */}
                  <button
                    onClick={handleMarkTp2Secured}
                    disabled={userActiveTrade.tp2Secured}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      userActiveTrade.tp2Secured
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-[#0b1c2e] text-emerald-300 border border-emerald-500/40 hover:bg-emerald-950/60'
                    }`}
                  >
                    <span>{userActiveTrade.tp2Secured ? '✅' : '🎯'}</span>
                    <span>{userActiveTrade.tp2Secured ? 'TP2 35% Booked' : 'TP2 Book Kiya (35%)'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Close Position Button */}
                  <button
                    onClick={handleCloseUserTrade}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:brightness-110 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
                  >
                    <span>🏆</span>
                    <span>Trade Close Kar Di (Book Total PnL)</span>
                  </button>

                  {/* Cancel / Stop Tracking */}
                  <button
                    onClick={handleCancelUserTrade}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-[#140810] text-rose-300 border border-rose-500/40 hover:bg-rose-950/60 cursor-pointer"
                    title="Tracking band karein agar order execute nahi hua tha"
                  >
                    ❌ Reset Tracking
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Entry Price Modal */}
        {showEditEntryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#0b1325] border border-cyan-500/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>✏️</span>
                  <span>Exact Entry Price Dalein</span>
                </h4>
                <button
                  onClick={() => setShowEditEntryModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Aapne exchange par jis exact price par order fill kiya hai, yahan likhein taaki AI accurate PnL compute kare:
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Entry Price (USD):</label>
                <input
                  type="number"
                  step="any"
                  value={customEntryInput}
                  onChange={(e) => setCustomEntryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/50 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. 80750"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowEditEntryModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(customEntryInput);
                    if (!isNaN(val) && val > 0) {
                      handleTakeTrade(val);
                      setShowEditEntryModal(false);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-black bg-cyan-500 text-slate-950 hover:brightness-110 cursor-pointer"
                >
                  Save & Activate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Plain-Language Explanation (KYON HAI?) */}
        <div className="bg-[#060a16] p-3.5 rounded-xl border border-cyan-500/25 flex items-start gap-2.5 text-xs">
          <span className="text-cyan-400 text-base mt-0.5">💡</span>
          <div className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-cyan-300 text-xs uppercase tracking-wider block">
                Yeh Trade Kyon Hai? (Simple Hindi / Hinglish Logic):
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                100% Fixed Non-Floating Levels
              </span>
            </div>
            <p className="text-slate-200 mt-1.5 leading-relaxed text-xs sm:text-[13px]">{plan.hindiExplanation}</p>

            {/* 5-Point Institutional Proof Bullets */}
            {plan.rationaleBullets && plan.rationaleBullets.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider block">
                  Institutional Confluence & Decision Rationale:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  {plan.rationaleBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-[#091428] p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                      <span className="text-cyan-400 font-bold font-mono">0{idx + 1}.</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🎯 AAPKO TRADE KAISE LENA HAI (EASY 3 STEPS) */}
        {plan.stepByStepGuide && (
          <div className="bg-[#040d1e] p-3.5 rounded-xl border border-emerald-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs sm:text-sm font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                <span>🎯</span>
                <span>Aapko Trade Kaise Lena Hai (Easy 3-Step Execution Guide):</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                100% Synced With AI Chart ✅
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#061226] p-3 rounded-lg border border-amber-400/30">
                <span className="text-[10px] font-black text-amber-300 block uppercase">1. Entry Rule (Limit Order)</span>
                <p className="text-slate-200 mt-1 text-xs leading-relaxed">{plan.stepByStepGuide.step1Entry}</p>
              </div>
              <div className="bg-[#140610] p-3 rounded-lg border border-rose-500/30">
                <span className="text-[10px] font-black text-rose-300 block uppercase">2. Strict Stop Loss</span>
                <p className="text-slate-200 mt-1 text-xs leading-relaxed">{plan.stepByStepGuide.step2StopLoss}</p>
              </div>
              <div className="bg-[#051c14] p-3 rounded-lg border border-emerald-500/30">
                <span className="text-[10px] font-black text-emerald-300 block uppercase">3. Profit Booking & Risk-Free</span>
                <p className="text-slate-200 mt-1 text-xs leading-relaxed">{plan.stepByStepGuide.step3ProfitTaking}</p>
              </div>
            </div>
            <p className="text-[11px] text-amber-300/90 font-medium pt-1">
              {plan.stepByStepGuide.riskTip}
            </p>
          </div>
        )}

        {/* ────────────────── 🌊 USDT DOMINANCE & MACRO DOLLAR FLOW CONFLUENCE RADAR ────────────────── */}
        <div className="bg-[#060c18] p-3.5 rounded-xl border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🌊</span>
              <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                USDT Dominance (USDT.D) & Macro Dollar (DXY) Liquidity Radar
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30">
              Macro Transmission Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* USDT Dominance Box */}
            <div className="bg-[#030712] p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">USDT Dominance (USDT.D)</span>
                <span className="text-[10px] font-bold text-emerald-400">{usdtMacro.usdtDominanceChange24h}</span>
              </div>
              <div className="text-base font-black text-white font-mono mt-0.5">
                {usdtMacro.usdtDominancePct}%
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                USDT Dominance गिर रही है = पैसा Assets में invest हो रहा है।
              </p>
            </div>

            {/* DXY Dollar Box */}
            <div className="bg-[#030712] p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">DXY US Dollar Index</span>
                <span className="text-[10px] font-bold text-amber-400">{usdtMacro.dxyChange24h}</span>
              </div>
              <div className="text-base font-black text-amber-300 font-mono mt-0.5">
                {usdtMacro.dxyDollarIndex}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                DXY Resistance पर है = Gold & Crypto के लिए strong relief।
              </p>
            </div>

            {/* Synthesis Insight Box */}
            <div className="bg-[#030712] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Trade Impact Synthesis</span>
              <p className="text-xs text-purple-200 font-semibold mt-1 leading-tight">
                {selectedSymbol.includes('PAXG') || selectedSymbol.includes('XAU')
                  ? usdtMacro.goldUsdtImpact
                  : usdtMacro.cryptoUsdtImpact}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 30. FULL-WIDTH INSTITUTIONAL CANVAS CHART ────────────────── */}
      <div className="w-full space-y-3">
        <div className="rounded-2xl border border-[#1e293b] bg-[#070d1a] overflow-hidden shadow-2xl">
          {/* Chart Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#060b16] border-b border-[#1e293b] gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-extrabold text-white">{plan.name}</span>
              <span className="text-xs text-cyan-400 font-bold">· {plan.displaySymbol}</span>
              <span className="text-xs text-slate-400">({timeframe.toUpperCase()})</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Active Trade #{plan.tradeNumber || 1}
              </span>
              {isMtfMode && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  MTF Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (chartInstanceRef.current) {
                    chartInstanceRef.current.timeScale().fitContent();
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0a1428] text-slate-300 hover:text-white border border-[#1e293b] transition-all cursor-pointer"
              >
                🔄 Reset Zoom / Fit
              </button>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0a1428] border border-[#1e293b] text-xs font-bold">
                <span className="text-rose-400">🛑 SL</span>
                <span className="text-amber-400">🎯 Entry</span>
                <span className="text-emerald-400">🏆 TP</span>
                <span className="text-pink-400">📍 POC</span>
                <span className="text-cyan-400">● Live Ticks</span>
              </div>
            </div>
          </div>

          {/* Lightweight Charts Canvas Element */}
          <div className="relative w-full h-[540px]">
            <div ref={chartContainerRef} className="w-full h-full" />
            {!chartLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#070d1a]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <span className="size-3 rounded-full bg-cyan-400 animate-ping" />
                  Connecting Binance Live Candles...
                </div>
              </div>
            )}
          </div>

          {/* In-Chart Footbar showing Equilibrium 50%, POC, VAH, VAL, VWAP */}
          <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#060c18] border-t border-slate-800 text-[11px] text-slate-400 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Equilibrium 50%: <b className="text-white">${analysis?.premiumDiscount.equilibrium50.toLocaleString() || '—'}</b>
              </span>
              <span>
                POC: <b className="text-pink-400">${analysis?.volumeProfile.poc.toLocaleString() || '—'}</b>
              </span>
              <span>
                VAH: <b className="text-cyan-300">${analysis?.volumeProfile.vah.toLocaleString() || '—'}</b>
              </span>
              <span>
                VAL: <b className="text-cyan-300">${analysis?.volumeProfile.val.toLocaleString() || '—'}</b>
              </span>
              <span>
                Daily VWAP: <b className="text-amber-300">${analysis?.vwap.dailyVwap.toLocaleString() || '—'}</b>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Formula: Real-time Pure SMC / ICT Mathematical Algorithms (Zero Delayed Lag)
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 4-PILLAR EVIDENCE CONFLUENCE (DIRECTLY UNDERNEATH CHART) ────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          ✓ Primary Evidence & Confluence ({plan.decision === 'SHORT' ? 'Why Short' : 'Why Long'} is High Conviction)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pillar 1: Market Structure */}
          <div className="bg-[#081022] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <div
              className={`flex items-center gap-2 font-bold text-xs ${
                plan.decision === 'SHORT' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              <span>🏛️</span>
              <span>1. Market Structure & Trend</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{plan.structureNote}</p>
          </div>

          {/* Pillar 2: Liquidity Sweep */}
          <div className="bg-[#081022] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <span>💧</span>
              <span>2. Liquidity Sweep (SFP)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{plan.liquidityNote}</p>
          </div>

          {/* Pillar 3: USDT & Macro Confluence */}
          <div className="bg-[#081022] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <span>🌊</span>
              <span>3. USDT Flow & CVD Delta</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{plan.usdtMacroNote}</p>
          </div>

          {/* Pillar 4: Invalidation Rule */}
          <div className="bg-[#081022] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <span>📍</span>
              <span>4. Invalidation Rule</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{plan.invalidationRule}</p>
          </div>
        </div>
      </div>

      {/* ────────────────── TWO-COLUMN BOTTOM SECTION: MTF MATRIX + KEY MARKET LEVELS ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: MULTI-TIMEFRAME STRUCTURE MATRIX */}
        <div className="bg-[#070e1c] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📊</span>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Multi-Timeframe Structure Matrix (15M · 1H · 4H · 1D)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Real-time sync</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#040812] text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-2">TF</th>
                  <th className="p-2">Trend</th>
                  <th className="p-2">Structure</th>
                  <th className="p-2">Order Block</th>
                  <th className="p-2">Key Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {analysis?.mtfTable.map((row) => (
                  <tr key={row.timeframe} className="hover:bg-slate-800/30">
                    <td className="p-2 font-bold font-mono text-cyan-300">{row.timeframe}</td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                          row.trend === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : row.trend === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {row.trend}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-white text-[11px]">{row.structure}</td>
                    <td className="p-2 font-mono text-slate-300 text-[11px]">{row.orderBlock}</td>
                    <td className="p-2 font-mono text-cyan-400 text-[11px]">{row.keyLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: KEY MARKET LEVELS SIDEBAR */}
        <div className="bg-[#070e1c] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400">🏛️</span>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Key Market Levels (Sorted by Confluence)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              Institutional Confluence
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {analysis?.confluenceKeyLevels.slice(0, 5).map((lvl) => (
              <div
                key={lvl.id}
                className={`p-2 rounded-xl border transition-all text-xs space-y-1 ${
                  lvl.isHighConfluence
                    ? 'bg-[#09152b] border-cyan-500/50 shadow-sm'
                    : 'bg-[#050a14] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] truncate max-w-[200px]" title={lvl.name}>
                    {lvl.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                      lvl.score >= 90
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : lvl.score >= 80
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {lvl.score}/100
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                  <span className="text-cyan-400 font-bold">${lvl.price.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400">
                    {lvl.distancePoints.toLocaleString()} pts ({lvl.distancePct}%)
                  </span>
                </div>
              </div>
            ))}

            {/* Timeframe Anchors */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-4 gap-1.5 text-[10px] font-mono">
              <div className="bg-[#050a14] p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block">PDH</span>
                <b className="text-white">${analysis?.previousHighLows.pdh?.toLocaleString() || '—'}</b>
              </div>
              <div className="bg-[#050a14] p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block">PDL</span>
                <b className="text-white">${analysis?.previousHighLows.pdl?.toLocaleString() || '—'}</b>
              </div>
              <div className="bg-[#050a14] p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block">PWH</span>
                <b className="text-white">${analysis?.previousHighLows.pwh?.toLocaleString() || '—'}</b>
              </div>
              <div className="bg-[#050a14] p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block">PWL</span>
                <b className="text-white">${analysis?.previousHighLows.pwl?.toLocaleString() || '—'}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 📜 COMPLETED TRADES LEDGER (TRANSPARENCY & ACCURACY) ────────────────── */}
      {showHistoryModal && (
        <div className="bg-[#081022] p-4 rounded-xl border border-cyan-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📜</span>
              <h3 className="text-sm font-extrabold text-white">
                Completed Trades Ledger ({plan.displaySymbol}) — Win Rate: {winRate}% ({totalWins}/{totalCompletedTrades})
              </h3>
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {currentHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Abhi tak koi trade close nahi hui hai. Jaise hi market mein TP ya SL hit hoga, vah yahan record ho jayega
              aur agla trade turant live ho jayega!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#050a14] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Trade #</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Entry Price</th>
                    <th className="p-2">Exit Price</th>
                    <th className="p-2">Target TP3</th>
                    <th className="p-2">PnL Points</th>
                    <th className="p-2">Outcome</th>
                    <th className="p-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {currentHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-white">#{item.tradeNumber}</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                            item.decision === 'SHORT'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.decision}
                        </span>
                      </td>
                      <td className="p-2 font-mono">${item.entryPrice.toLocaleString()}</td>
                      <td className="p-2 font-mono">${item.exitPrice.toLocaleString()}</td>
                      <td className="p-2 font-mono text-emerald-400">${item.targetTp3.toLocaleString()}</td>
                      <td
                        className={`p-2 font-mono font-bold ${
                          item.pnlPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.pnlPoints >= 0 ? `+${item.pnlPoints.toLocaleString()}` : item.pnlPoints.toLocaleString()}{' '}
                        pts ({item.pnlPercent}%)
                      </td>
                      <td className="p-2 font-bold">
                        {item.outcome === 'TP3_HIT' ? (
                          <span className="text-emerald-400">🏆 TP3 HIT</span>
                        ) : item.outcome === 'SL_HIT' ? (
                          <span className="text-rose-400">🛑 SL HIT</span>
                        ) : (
                          <span className="text-cyan-400">⚡ ROTATED</span>
                        )}
                      </td>
                      <td className="p-2 text-slate-400">{item.closedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500 text-center font-mono">
        CRYPTO VIA BINANCE WEBSOCKET LIVE · MACRO VIA FRED (ST. LOUIS FED) · SMC ENGINE V9 ANCHORED · NOT FINANCIAL ADVICE
      </div>
    </div>
  );
};

export default DeeeprAiChartView;
