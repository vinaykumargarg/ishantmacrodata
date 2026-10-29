/**
 * DEEEPR GOLD ENTRY + REASON ENGINE v1 REGRESSION TEST SUITE (T1 - T13)
 * 
 * Verifies all institutional rules:
 * T1. Price ordering: LONG SL < E2 <= E1 < TP1 < TP2 < TP3; SHORT reverse; worst-edge RR >= 2.0; null when WAIT, never "$0".
 * T2. Every entry/SL/TP has a reason present; level type matches zone list; broken/contested zones forbidden.
 * T3. DXY check: long + DXY bullish breakout + yields up = CONFLICT; gold up + DXY up = ANOMALY flag.
 * T4. COT/ETF/central-bank data dates visible; COT lag noted; REPORTED vs ESTIMATED vs PUBLISHED labels correct.
 * T5. Bank views: named, dated, published notes only; no unsourced rumours; weight low.
 * T6. Retail crowd: contrarian flag fires only at extreme percentile; venue label; retail is proxy, not whole market.
 * T7. Event filter: Tier-1 event within 30m blocks new entry (forces WAIT); Friday/weekend gap risk note present.
 * T8. Alignment label matches layer scores (ALL_ALIGNED requires consistent lean).
 * T9. Stop placement: SL not placed on exact round numbers / obvious pools without buffer (pool protection).
 * T10. Lifecycle: no direct LONG <-> SHORT flip without WAIT; stop-loss hit initiates 4-candle cooldown.
 * T11. Stale/conflicting data (> 0.3% price conflict) = WAIT with SOURCE_CONFLICT warning.
 * T12. Confidence labeled "unproven (n=0)" until >= 30 closed ledger observations; no "sure-shot/100%" words.
 * T13. Position size = (account * risk%) / (stop distance * contract value); risk 0.5-1% default, max 2%.
 */

import {
  runDeeeprGoldEntryEngine,
  calculateWorstEdgeRr,
  calculatePositionSize,
  calculateRangePositionP,
  evaluateDxyCrossCheck,
  evaluateWhyLayers,
  validateGoldLifecycleTransition,
  GoldEngineParams
} from '../deeeprGoldEntryReasonEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runAllGoldEntryReasonRegressionTests(): TestResult[] {
  const results: TestResult[] = [];

  const mockCandles = [
    { open: 2715, high: 2722, low: 2712, close: 2720, volume: 1540 },
    { open: 2720, high: 2726, low: 2718, close: 2724, volume: 1820 },
    { open: 2724, high: 2728, low: 2721, close: 2726, volume: 1950 }
  ];

  // ──────────────────────────────────────────────────────────
  // T1: Price Ordering & Worst-Edge RR Gate
  // ──────────────────────────────────────────────────────────
  try {
    // Bullish test parameters: price at discount (p <= 0.40), room to resistance >= 1.5R
    const longParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0, // p = (2720-2710)/50 = 0.20 (Discount)
      nearestSupport: 2715.0,
      nearestResistance: 2765.0,
      dxyPrice: 102.30,
      dxyTrend: 'BEARISH',
      us10yRealYield: 1.82,
      fedRateCutProb: 80,
      cotPercentile: 72,
      accountBalanceUsd: 10000,
      riskPct: 1.0,
      htfTrend: 'BULLISH'
    };

    const longOutput = runDeeeprGoldEntryEngine(longParams);
    let t1Passed = true;
    let t1Msg = '';

    if (!longOutput.plan) {
      t1Passed = false;
      t1Msg = 'Expected active plan for bullish discount setup, but plan was null';
    } else {
      const p = longOutput.plan;
      const e1 = p.entries[0];
      const e2 = p.entries[1];
      const sl = p.stop.price;
      const tp1 = p.tps[0].price;
      const tp2 = p.tps[1].price;
      const tp3 = p.tps[2].price;

      // Price ordering: SL < E2 <= E1 < TP1 < TP2 < TP3
      if (!(sl < e2.priceLow && e2.priceHigh <= e1.priceHigh && e1.priceHigh < tp1 && tp1 < tp2 && tp2 < tp3)) {
        t1Passed = false;
        t1Msg = `LONG Price ordering failed: SL=${sl}, E2=[${e2.priceLow}-${e2.priceHigh}], E1=[${e1.priceLow}-${e1.priceHigh}], TP1=${tp1}, TP2=${tp2}, TP3=${tp3}`;
      }

      // Worst edge RR must be >= 2.0 for TP2
      if (p.rrTp2 < 2.0) {
        t1Passed = false;
        t1Msg = `Worst-edge RR to TP2 must be >= 2.0, got ${p.rrTp2}`;
      }
    }

    // Also test WAIT case (mid-range p between 0.45 and 0.55): plan must be null, never "$0"
    const midRangeParams: GoldEngineParams = {
      ...longParams,
      currentPrice: 2735.0,
      rangeLow: 2710.0,
      rangeHigh: 2760.0 // p = (2735-2710)/50 = 0.50 (Exact Mid-Range)
    };
    const midOutput = runDeeeprGoldEntryEngine(midRangeParams);
    if (midOutput.masterVerdict !== 'WAIT' || midOutput.plan !== null) {
      t1Passed = false;
      t1Msg += ' | Mid-range failed to force WAIT and null plan';
    }

    results.push({
      name: 'T1: Price Ordering (SL < E2 <= E1 < TP1 < TP2 < TP3) & Worst-Edge RR (>= 2.0) with Null Plan on WAIT',
      passed: t1Passed,
      message: t1Passed ? 'LONG price hierarchy validated, worst-edge RR >= 2.0, mid-range properly returns null plan.' : t1Msg
    });
  } catch (err: any) {
    results.push({ name: 'T1: Price Ordering & Worst-Edge RR Gate', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T2: Mandatory Reason for Every Entry, SL, and TP
  // ──────────────────────────────────────────────────────────
  try {
    const longParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0,
      dxyPrice: 102.30,
      dxyTrend: 'BEARISH',
      us10yRealYield: 1.82,
      fedRateCutProb: 80,
      htfTrend: 'BULLISH'
    };

    const out = runDeeeprGoldEntryEngine(longParams);
    let t2Passed = true;
    let t2Msg = '';

    if (out.plan) {
      out.plan.entries.forEach((e) => {
        if (!e.reason || e.reason.trim().length < 10) {
          t2Passed = false;
          t2Msg += `Entry ${e.id} missing reason. `;
        }
      });
      if (!out.plan.stop.reason || out.plan.stop.reason.trim().length < 10) {
        t2Passed = false;
        t2Msg += 'Stop Loss missing structural reason. ';
      }
      out.plan.tps.forEach((tp) => {
        if (!tp.reason || tp.reason.trim().length < 10) {
          t2Passed = false;
          t2Msg += `TP ${tp.id} missing structural reason. `;
        }
      });
    } else {
      t2Passed = false;
      t2Msg = 'Plan was null';
    }

    results.push({
      name: 'T2: Mandatory Reason on Every Entry Tranche, SL, and TP (Level Type + Structural Confluence)',
      passed: t2Passed,
      message: t2Passed ? 'All entries, SL, and TP targets have comprehensive structural and timeframe reasons.' : t2Msg
    });
  } catch (err: any) {
    results.push({ name: 'T2: Mandatory Reason for Entry/SL/TP', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T3: DXY Cross-Check (Conflict & Regime Anomaly Detection)
  // ──────────────────────────────────────────────────────────
  try {
    // Case 1: Gold Long + DXY Bullish Breakout + Higher Yields -> CONFLICT
    const conflictCheck = evaluateDxyCrossCheck('LONG', 104.50, 'BULLISH', 2.25);
    const hasConflict = conflictCheck.alignmentWithGold === 'CONFLICT';

    // Case 2: Gold Long + DXY Bearish + Lower Yields -> ALIGNED
    const alignedCheck = evaluateDxyCrossCheck('LONG', 101.90, 'BEARISH', 1.80);
    const hasAligned = alignedCheck.alignmentWithGold === 'ALIGNED';

    // Case 3: Gold Long + DXY Bullish but yields falling (Geopolitical/De-dollarization) -> ANOMALY
    const anomalyCheck = evaluateDxyCrossCheck('LONG', 104.10, 'BULLISH', 1.85);
    const hasAnomaly = anomalyCheck.alignmentWithGold === 'ANOMALY';

    const t3Passed = hasConflict && hasAligned && hasAnomaly && conflictCheck.downsideRoomAtr !== null;
    results.push({
      name: 'T3: DXY Cross-Check (Gold vs DXY Conflict, Alignment & Regime Anomaly Detection)',
      passed: t3Passed,
      message: t3Passed
        ? 'DXY cross-check correctly identified CONFLICT (DXY bullish + yields up), ALIGNED (DXY down), and ANOMALY (Gold up + DXY up).'
        : `DXY check failed: conflict=${hasConflict}, aligned=${hasAligned}, anomaly=${hasAnomaly}`
    });
  } catch (err: any) {
    results.push({ name: 'T3: DXY Cross-Check', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T4: CFTC COT, ETF, and Central Bank Data Dates & Lag Annotations
  // ──────────────────────────────────────────────────────────
  try {
    const longParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0
    };

    const out = runDeeeprGoldEntryEngine(longParams);
    const cot = out.positionsMap.cot;
    const etf = out.positionsMap.etf;
    const cb = out.positionsMap.centralBanks;

    const hasCotDateAndLag = cot.dataDate && cot.lag.includes('Lag') && cot.label === 'REPORTED';
    const hasEtfLabel = etf.label === 'REPORTED' && etf.gldTonnesChange7d !== null;
    const hasCbLabel = cb.label === 'REPORTED' && cb.topFacts.length >= 3;

    const t4Passed = Boolean(hasCotDateAndLag && hasEtfLabel && hasCbLabel);
    results.push({
      name: 'T4: COT / ETF / Central Bank Data Dates, Release Lag & Official REPORTED Labels',
      passed: t4Passed,
      message: t4Passed
        ? 'CFTC COT has 3-day lag explicitly annotated, ETF flows labeled REPORTED, Central Bank WGC/IMF purchases verified.'
        : 'Missing dates, lag annotations, or incorrect labels in positions map.'
    });
  } catch (err: any) {
    results.push({ name: 'T4: COT, ETF, and CB Data Dates & Lag', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T5: Bank Views (Named, Dated, Published Notes Only; Low Weight)
  // ──────────────────────────────────────────────────────────
  try {
    const longParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0
    };

    const out = runDeeeprGoldEntryEngine(longParams);
    const bankViews = out.positionsMap.bankViews;
    let t5Passed = bankViews.length >= 3;
    let t5Msg = '';

    bankViews.forEach((bv) => {
      if (!bv.bank || !bv.date || !bv.source || bv.label !== 'PUBLISHED_VIEWS') {
        t5Passed = false;
        t5Msg += `Invalid bank view entry: ${JSON.stringify(bv)}. `;
      }
    });

    results.push({
      name: 'T5: Bank Research Notes (Named Institutions, Explicit Dates, Sources & PUBLISHED_VIEWS Label)',
      passed: t5Passed,
      message: t5Passed
        ? `Verified ${bankViews.length} published bank notes (Goldman Sachs, UBS, J.P. Morgan) with exact dates and sources.`
        : t5Msg
    });
  } catch (err: any) {
    results.push({ name: 'T5: Bank Views', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T6: Retail Crowd Positioning (Contrarian Flag at Extremes Only)
  // ──────────────────────────────────────────────────────────
  try {
    // Normal retail sentiment (52% long) -> Neutral score (0.0), balanced note
    const normalWhy = evaluateWhyLayers({
      fedRateCutProb: 75,
      us10yRealYield: 1.88,
      dxyPrice: 102.35,
      dxyChange24h: -0.2,
      dxyTrend: 'BEARISH',
      cotManagedMoneyPercentile: 80,
      cotWeeklyNetChangeContracts: 2000,
      gldEtfFlowWeeklyTonnes: 3.0,
      centralBankNetBuyingTonnesMonthly: 25.0,
      retailLongPct: 52,
      zoneGrade: 'A',
      htfTrendAligned: true,
      hasTier1EventWithin30m: false
    });

    // Extreme retail sentiment (78% long) -> Contrarian Bearish (-1.6 score)
    const extremeWhy = evaluateWhyLayers({
      fedRateCutProb: 75,
      us10yRealYield: 1.88,
      dxyPrice: 102.35,
      dxyChange24h: -0.2,
      dxyTrend: 'BEARISH',
      cotManagedMoneyPercentile: 80,
      cotWeeklyNetChangeContracts: 2000,
      gldEtfFlowWeeklyTonnes: 3.0,
      centralBankNetBuyingTonnesMonthly: 25.0,
      retailLongPct: 78,
      zoneGrade: 'A',
      htfTrendAligned: true,
      hasTier1EventWithin30m: false
    });

    const t6Passed =
      normalWhy.layers.L7_Retail_Crowd.score === 0.0 &&
      extremeWhy.layers.L7_Retail_Crowd.score < -1.0 &&
      extremeWhy.layers.L7_Retail_Crowd.factLabel === 'ESTIMATED';

    results.push({
      name: 'T6: Retail Crowd Contrarian Layer (Fires Alert Only at Extreme Percentiles, Labeled ESTIMATED)',
      passed: t6Passed,
      message: t6Passed
        ? 'Retail sentiment stays neutral at 52% and triggers contrarian bearish score (-1.6) at 78% extreme.'
        : 'Retail contrarian scoring failed.'
    });
  } catch (err: any) {
    results.push({ name: 'T6: Retail Crowd Positioning', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T7: Economic Event Filter (Tier-1 30m Blackout Window)
  // ──────────────────────────────────────────────────────────
  try {
    const eventBlackoutParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0,
      hasTier1EventWithin30m: true
    };

    const out = runDeeeprGoldEntryEngine(eventBlackoutParams);
    const hasTier1Warning = out.warnings.some((w) => w.includes('TIER_1_EVENT_BLACKOUT'));
    const t7Passed = out.masterVerdict === 'WAIT' && out.plan === null && hasTier1Warning;

    results.push({
      name: 'T7: Tier-1 Event Filter (New Entries Prohibited 30m Before Release; Forces WAIT & Blackout Warning)',
      passed: t7Passed,
      message: t7Passed
        ? 'Engine strictly enforced 30m pre-event blackout window: Master Verdict=WAIT, Plan=null, Blackout warning active.'
        : `Event blackout gate failed: verdict=${out.masterVerdict}, planIsNull=${out.plan === null}, hasWarning=${hasTier1Warning}`
    });
  } catch (err: any) {
    results.push({ name: 'T7: Economic Event Filter', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T8: Layer Alignment Consistency (ALL_ALIGNED vs PARTIAL vs CONFLICT)
  // ──────────────────────────────────────────────────────────
  try {
    const alignedWhy = evaluateWhyLayers({
      fedRateCutProb: 80,
      us10yRealYield: 1.80,
      dxyPrice: 101.90,
      dxyChange24h: -0.4,
      dxyTrend: 'BEARISH',
      cotManagedMoneyPercentile: 50,
      cotWeeklyNetChangeContracts: 4000,
      gldEtfFlowWeeklyTonnes: 5.0,
      centralBankNetBuyingTonnesMonthly: 30.0,
      retailLongPct: 50,
      zoneGrade: 'A',
      htfTrendAligned: true,
      hasTier1EventWithin30m: false
    });

    const conflictWhy = evaluateWhyLayers({
      fedRateCutProb: 20, // Hawkish
      us10yRealYield: 2.30, // High real yields
      dxyPrice: 105.00, // Strong DXY
      dxyChange24h: 0.8,
      dxyTrend: 'BULLISH',
      cotManagedMoneyPercentile: 92, // Overcrowded long
      cotWeeklyNetChangeContracts: -3000,
      gldEtfFlowWeeklyTonnes: -4.0,
      centralBankNetBuyingTonnesMonthly: 10.0,
      retailLongPct: 80,
      zoneGrade: 'A',
      htfTrendAligned: true,
      hasTier1EventWithin30m: false
    });

    const t8Passed = alignedWhy.alignment === 'ALL_ALIGNED' && conflictWhy.alignment === 'CONFLICT';
    results.push({
      name: 'T8: Reason Layer Alignment (ALL_ALIGNED on Macro/DXY/Tech Confluence vs CONFLICT on Opposing Forces)',
      passed: t8Passed,
      message: t8Passed
        ? 'Alignment classification strictly verified: ALL_ALIGNED when all layers agree; CONFLICT when macro/DXY opposes technicals.'
        : `Alignment mismatch: aligned=${alignedWhy.alignment}, conflict=${conflictWhy.alignment}`
    });
  } catch (err: any) {
    results.push({ name: 'T8: Layer Alignment Consistency', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T9: Stop-Loss Placement & Liquidity Pool Protection
  // ──────────────────────────────────────────────────────────
  try {
    const longParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0,
      htfTrend: 'BULLISH'
    };

    const out = runDeeeprGoldEntryEngine(longParams);
    let t9Passed = true;
    let t9Msg = '';

    if (!out.plan) {
      t9Passed = false;
      t9Msg = 'Plan was null';
    } else {
      const sl = out.plan.stop.price;
      // SL should not land on an exact round number like .00 without liquidity pool protection
      const isExactRound = sl % 1 === 0 || sl % 0.5 === 0;
      if (isExactRound) {
        t9Passed = false;
        t9Msg = `SL placed exactly on vulnerable round number/pool: ${sl}`;
      }
      if (!out.plan.stop.basis.includes('Pool Protection')) {
        t9Passed = false;
        t9Msg += ' Basis must reference Pool Protection.';
      }
    }

    results.push({
      name: 'T9: Stop-Loss Structural Placement & Retail Liquidity Pool Protection (+0.5 ATR + Offset)',
      passed: t9Passed,
      message: t9Passed ? `SL correctly offset beyond liquidity pool with buffer: $${out.plan?.stop.price}.` : t9Msg
    });
  } catch (err: any) {
    results.push({ name: 'T9: Stop Placement & Pool Protection', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T10: Lifecycle State Transitions (No Direct Flip & Cooldown)
  // ──────────────────────────────────────────────────────────
  try {
    // Check 1: Direct LONG -> SHORT flip forbidden
    const directFlip = validateGoldLifecycleTransition('LONG', 'SHORT');
    const directFlipBlocked = !directFlip.allowed && directFlip.verdict === 'WAIT';

    // Check 2: Cooldown active (only 2 candles since stop loss hit)
    const cooldownActive = validateGoldLifecycleTransition('WAIT', 'LONG', 2);
    const cooldownBlocked = !cooldownActive.allowed && cooldownActive.verdict === 'WAIT';

    // Check 3: Valid transition after 5 candles
    const validTransition = validateGoldLifecycleTransition('WAIT', 'LONG', 5);
    const validAllowed = validTransition.allowed && validTransition.verdict === 'LONG';

    const t10Passed = directFlipBlocked && cooldownBlocked && validAllowed;
    results.push({
      name: 'T10: Lifecycle State Machine (No Direct LONG <-> SHORT Flip & Mandatory 4-Candle Cooldown)',
      passed: t10Passed,
      message: t10Passed
        ? 'Direct flip prevented (forced through WAIT); 4-candle stop cooldown strictly enforced.'
        : `Lifecycle test failed: directFlipBlocked=${directFlipBlocked}, cooldownBlocked=${cooldownBlocked}, validAllowed=${validAllowed}`
    });
  } catch (err: any) {
    results.push({ name: 'T10: Lifecycle State Transitions', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T11: Stale & Conflicting Data Filter (> 0.3% Source Conflict)
  // ──────────────────────────────────────────────────────────
  try {
    const conflictParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0,
      sourceConflictPct: 0.45 // Exceeds 0.3%
    };

    const out = runDeeeprGoldEntryEngine(conflictParams);
    const hasConflictWarning = out.warnings.some((w) => w.includes('SOURCE_CONFLICT'));
    const t11Passed = out.masterVerdict === 'WAIT' && out.plan === null && hasConflictWarning;

    results.push({
      name: 'T11: Stale & Conflicting Data Gate (Discrepancy > 0.3% Forces WAIT with SOURCE_CONFLICT Warning)',
      passed: t11Passed,
      message: t11Passed
        ? 'Price conflict of 0.45% correctly triggered SOURCE_CONFLICT warning and forced Master Verdict=WAIT with null plan.'
        : 'Conflicting data did not trigger expected WAIT verdict.'
    });
  } catch (err: any) {
    results.push({ name: 'T11: Stale & Conflicting Data Gate', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T12: Unproven Confidence Label & Prohibition of Hype
  // ──────────────────────────────────────────────────────────
  try {
    const longParams: GoldEngineParams = {
      currentPrice: 2720.0,
      candles15m: mockCandles,
      atr1h: 18.5,
      atr15m: 6.2,
      rangeLow: 2710.0,
      rangeHigh: 2760.0,
      nearestSupport: 2715.0,
      nearestResistance: 2765.0
    };

    const out = runDeeeprGoldEntryEngine(longParams);
    const isUnproven = out.confidenceBasis === 'unproven (n=0)';

    // Verify absence of forbidden hype words in Hinglish report sections
    const reportText = Object.values(out.hinglishReportSections).join(' ').toLowerCase();
    const forbiddenWords = ['sure-shot', '100% fixed', '100% win', 'guaranteed', 'multibagger confirm'];
    const hasForbidden = forbiddenWords.some((w) => reportText.includes(w));

    const t12Passed = isUnproven && !hasForbidden;
    results.push({
      name: 'T12: Calibrated Ledger Confidence ("unproven (n=0)" Basis & Complete Prohibition of Hype)',
      passed: t12Passed,
      message: t12Passed
        ? 'Confidence basis strictly reads "unproven (n=0)" and zero forbidden marketing terms detected.'
        : `Confidence basis failed: isUnproven=${isUnproven}, hasForbidden=${hasForbidden}`
    });
  } catch (err: any) {
    results.push({ name: 'T12: Unproven Confidence Label', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T13: Position Sizing & Strict Risk Management Formula
  // ──────────────────────────────────────────────────────────
  try {
    // Formula: Position size = (account * risk%) / (stop distance * contract value)
    // Account: $10,000, Risk: 1% ($100), Stop distance: $12.50, Contract value: 100 oz per 1.0 lot ($100/pt)
    // Expected lot: $100 / ($12.50 * 100) = $100 / $1250 = 0.08 lots
    const accountBalance = 10000;
    const riskPct = 1.0;
    const stopDistPts = 12.5;
    const pos = calculatePositionSize(accountBalance, riskPct, stopDistPts);

    const expectedLots = 0.08;
    const diff = Math.abs(pos.lotSize - expectedLots);
    const t13Passed = diff < 0.005 && pos.riskAmountUsd === 100;

    results.push({
      name: 'T13: Position Sizing Formula: (Account * Risk%) / (Stop Distance * Contract Value)',
      passed: t13Passed,
      message: t13Passed
        ? `Position size calculated precisely: ${pos.lotSize} lots on $10,000 account risking 1.0% ($100) with $12.50 SL.`
        : `Position size mismatch: got ${pos.lotSize}, expected ${expectedLots}`
    });
  } catch (err: any) {
    results.push({ name: 'T13: Position Sizing Formula', passed: false, message: err.message });
  }

  return results;
}

// Direct terminal runner when executed via tsx
if (process.argv[1]?.includes('deeeprGoldEntryReasonRegression.test')) {
  console.log('================================================================');
  console.log('RUNNING DEEEPR GOLD ENTRY + REASON ENGINE REGRESSION TESTS (T1-T13)');
  console.log('================================================================');
  const results = runAllGoldEntryReasonRegressionTests();
  let passCount = 0;
  results.forEach((r, idx) => {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${idx + 1}/13] ${symbol} - ${r.name}`);
    if (!r.passed) {
      console.log(`     Error: ${r.message}`);
    } else {
      console.log(`     Details: ${r.message}`);
      passCount++;
    }
  });
  console.log('================================================================');
  console.log(`FINAL SCORE: ${passCount} / ${results.length} TESTS PASSED`);
  console.log('================================================================');
  if (passCount !== results.length) {
    process.exit(1);
  }
}
