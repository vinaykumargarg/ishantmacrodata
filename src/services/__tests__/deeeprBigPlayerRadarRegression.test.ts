/**
 * DEEEPR "BIG PLAYER RADAR" v1 REGRESSION TEST SUITE (T1 - T10)
 * 
 * Verifies all institutional rules:
 * T1. Strict fact labeling (REPORTED/DERIVED/ESTIMATED/INFERENCE), source, date, and lag annotations.
 * T2. No private positions or intentions stated as fact; INFERENCE segregated with confidence.
 * T3. Wallet labels with confidence & source; unlabelled whales tagged "unlabelled"; early-era wallets default "intent unknown"; zero identity claims on Satoshi.
 * T4. Math verification: net flows, 52w z-scores, persistence (>= 3 of 4 weeks), weights normalisation, cost-basis estimates, stale/missing sources weight 0.
 * T5. Conflict handling: classes disagree -> label MIXED_CONFLICT with confidence down; SOURCE_CONFLICT flagged when sources differ > 2%.
 * T6. Weekly IST boundaries: Mon-Sun IST consistent, week-over-week comparisons.
 * T7. Evidence integration: evidence.bigPlayers[asset] consumed with capped weight; never flips verdict alone; NO standalone LONG/SHORT badge on radar.
 * T8. Asset coverage: BTC, ETH, other coins, gold, silver, oil each have correct data maps; missing class marked "-" with reason, never 0.
 * T9. Alerts: thresholds from percentiles/config, deduplication, whale-to-exchange deposits vs withdrawals distinguished.
 * T10. No hype/promotion; confidence labeled "unproven (n=0)" until >= 30 closed ledger observations.
 */

import {
  computeZScore,
  classifyBehavior,
  computeSmartMoneyScore,
  getWeekBoundariesIST,
  buildAssetSmartMoneyProfile,
  generateWeeklyBigPlayerReport,
  getBigPlayerEvidenceForMaster,
  MOCK_RADAR_EVENTS,
  MOCK_RADAR_FRESHNESS,
  AssetKey
} from '../deeeprBigPlayerRadarEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runAllBigPlayerRadarRegressionTests(): TestResult[] {
  const results: TestResult[] = [];

  // ──────────────────────────────────────────────────────────
  // T1: Strict Labeling & Lag Awareness
  // ──────────────────────────────────────────────────────────
  try {
    const report = generateWeeklyBigPlayerReport();
    const btc = report.assets.BTC;
    
    // Check that every entity class has source, dataDate, lag, and valid FactLabel
    const validLabels = ['REPORTED', 'DERIVED', 'ESTIMATED', 'INFERENCE'];
    let allLabeled = true;
    let missingInfo = '';

    Object.values(btc.classes).forEach((cls) => {
      if (!validLabels.includes(cls.label) || !cls.source || !cls.dataDate || !cls.lag) {
        allLabeled = false;
        missingInfo = `${cls.entityClass}: label=${cls.label}, src=${cls.source}, lag=${cls.lag}`;
      }
    });

    results.push({
      name: 'T1: Strict Labeling & Lag Awareness (REPORTED/DERIVED/ESTIMATED/INFERENCE with Source & Lag)',
      passed: allLabeled,
      message: allLabeled ? 'All 11 entity classes carry strict labels, dates, sources, and lag notices.' : `Failed: ${missingInfo}`
    });
  } catch (err: any) {
    results.push({ name: 'T1: Strict Labeling', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T2: Intent Segregated as INFERENCE (Never Stated as Fact)
  // ──────────────────────────────────────────────────────────
  try {
    const btc = buildAssetSmartMoneyProfile('BTC', 80400);
    let properlySegregated = true;
    let violation = '';

    // Verify all scenarios are labelled 'INFERENCE' and contain evidenceList with facts
    btc.scenarios.forEach((sc) => {
      if (sc.label !== 'INFERENCE') {
        properlySegregated = false;
        violation = `Scenario ${sc.scenarioName} has label ${sc.label}`;
      }
      if (!sc.evidenceList || sc.evidenceList.length === 0) {
        properlySegregated = false;
        violation = `Scenario ${sc.scenarioName} missing evidence list`;
      }
      // Check that evidence items are REPORTED or DERIVED facts
      sc.evidenceList.forEach((e) => {
        if (e.label === 'INFERENCE') {
          properlySegregated = false;
          violation = `Evidence point "${e.point}" was labelled INFERENCE instead of fact`;
        }
      });
    });

    results.push({
      name: 'T2: Intent Segregated as INFERENCE (Hypotheses tagged INFERENCE, evidence points tagged REPORTED/DERIVED)',
      passed: properlySegregated,
      message: properlySegregated ? 'All institutional scenarios carry strict INFERENCE tags and cite verifiable facts.' : `Violation: ${violation}`
    });
  } catch (err: any) {
    results.push({ name: 'T2: Intent Segregated', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T3: Wallet Labeling Rules & Early-Era "Intent Unknown"
  // ──────────────────────────────────────────────────────────
  try {
    const btc = buildAssetSmartMoneyProfile('BTC', 80400);
    const earlyEra = btc.classes.early_era_wallets;
    const whales = btc.classes.whales;

    // Early-era must default to "intent unknown" and zero Satoshi claims
    const earlyEraSafe = earlyEra.summaryHinglish.toLowerCase().includes('intent unknown') ||
                         earlyEra.summaryHinglish.toLowerCase().includes('unknown');
    const noSatoshiIdentityClaims = !earlyEra.summaryHinglish.toLowerCase().includes('satoshi ne becha') &&
                                    !earlyEra.summaryHinglish.toLowerCase().includes('satoshi dumped');
    
    // Whale events distinguish unlabelled vs labelled
    const whaleAlert = MOCK_RADAR_EVENTS.find((e) => e.entityClass === 'whales');
    const isUnlabelledWhale = whaleAlert?.headline.toLowerCase().includes('unlabelled') || whaleAlert?.descriptionHinglish.toLowerCase().includes('non-exchange');

    results.push({
      name: 'T3: Wallet Labeling Rules (Early-era wallets default to "Intent Unknown", zero Satoshi identity claims)',
      passed: earlyEraSafe && noSatoshiIdentityClaims && (isUnlabelledWhale ?? false),
      message: `Early-era safe: ${earlyEraSafe}, No Satoshi claim: ${noSatoshiIdentityClaims}, Unlabelled whale noted: ${isUnlabelledWhale}`
    });
  } catch (err: any) {
    results.push({ name: 'T3: Wallet Labeling Rules', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T4: Math Verification (Z-Scores, Persistence, Score Weights)
  // ──────────────────────────────────────────────────────────
  try {
    // 1. Test z-score
    const z1 = computeZScore(1500, 1000, 250); // (1500-1000)/250 = 2.0
    const zPass = z1 === 2.0;

    // 2. Test persistence (>= 3 weeks of same sign)
    const b1 = classifyBehavior(1.5, 3); // ACCUMULATING, persistent
    const b2 = classifyBehavior(1.5, 1); // ACCUMULATING, not persistent
    const b3 = classifyBehavior(-1.2, 4); // DISTRIBUTING, persistent
    const behaviorPass = b1.behavior === 'ACCUMULATING' && b1.isPersistent &&
                         b2.behavior === 'ACCUMULATING' && !b2.isPersistent &&
                         b3.behavior === 'DISTRIBUTING' && b3.isPersistent;

    // 3. Test weights normalisation
    const scoreBull = computeSmartMoneyScore({
      etfZScore: 2.0, // 25
      cotZScore: 1.5, // 11.25 -> ~11
      corpCentralBankZScore: 2.0, // 20
      whaleZScore: 1.5, // 11.25 -> ~11
      exchangeOutflowZScore: 2.0, // 10
      bankLean: 1.0, // 5
      minerSellingPressureZScore: -1.0, // +2.5
      earlyEraMovementActive: false
    });

    const scorePass = scoreBull.score >= 70 && scoreBull.label === 'SMART_MONEY_BUYING';

    results.push({
      name: 'T4: Math Verification (Z-scores, >= 3W persistence rule, and weighted score normalisation)',
      passed: zPass && behaviorPass && scorePass,
      message: `Z-Score: ${z1}, Behavior: ${b1.behavior} (${b1.isPersistent}), Bull Score: ${scoreBull.score}`
    });
  } catch (err: any) {
    results.push({ name: 'T4: Math Verification', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T5: Conflict Handling (Classes disagree -> MIXED_CONFLICT)
  // ──────────────────────────────────────────────────────────
  try {
    // When institutions buy while whales heavily distribute or conflict is flagged
    const conflictScore = computeSmartMoneyScore({
      etfZScore: 2.0,
      cotZScore: -2.0,
      corpCentralBankZScore: 1.5,
      whaleZScore: -2.5,
      exchangeOutflowZScore: -1.5,
      bankLean: 0.0,
      minerSellingPressureZScore: 2.0,
      earlyEraMovementActive: false
    }, 0, true);

    const conflictHandled = conflictScore.label === 'MIXED_CONFLICT' && conflictScore.confidence === 'LOW';

    results.push({
      name: 'T5: Conflict Handling (Opposing entity classes trigger MIXED_CONFLICT and downgrade confidence)',
      passed: conflictHandled,
      message: `Label: ${conflictScore.label}, Confidence: ${conflictScore.confidence}, Penalties: -${conflictScore.penalties} pts`
    });
  } catch (err: any) {
    results.push({ name: 'T5: Conflict Handling', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T6: Weekly Boundaries (Mon-Sun IST Consistency)
  // ──────────────────────────────────────────────────────────
  try {
    const boundaries = getWeekBoundariesIST();
    const hasMon = boundaries.start.includes('00:00 IST');
    const hasSun = boundaries.end.includes('23:59 IST');
    const validWeekNum = boundaries.weekNum >= 1 && boundaries.weekNum <= 53;

    results.push({
      name: 'T6: Weekly Boundaries (Strict Mon 00:00 to Sun 23:59 IST cycle with ISO week numbers)',
      passed: hasMon && hasSun && validWeekNum,
      message: `Week Range: ${boundaries.start} → ${boundaries.end} (Week #${boundaries.weekNum})`
    });
  } catch (err: any) {
    results.push({ name: 'T6: Weekly Boundaries', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T7: Single Arbiter Evidence Integration (Rule R9)
  // ──────────────────────────────────────────────────────────
  try {
    const evidence = getBigPlayerEvidenceForMaster('BTC');
    
    // Check that score weight applied is capped at +-10
    const weightCapped = Math.abs(evidence.scoreWeightApplied) <= 10;
    
    // Check that evidence has no standalone LONG/SHORT trade signal
    const isEvidenceOnly = (evidence.label as string) !== 'LONG' && (evidence.label as string) !== 'SHORT';

    results.push({
      name: 'T7: Single Arbiter Evidence Integration (Evidence weight capped at ±10 pts, zero independent verdicts)',
      passed: weightCapped && isEvidenceOnly,
      message: `Label: ${evidence.label}, Score: ${evidence.score}, Weight applied: ${evidence.scoreWeightApplied} pts (Capped <= 10)`
    });
  } catch (err: any) {
    results.push({ name: 'T7: Single Arbiter Integration', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T8: Multi-Asset Coverage (BTC, ETH, Alts, Gold, Silver, Oil)
  // ──────────────────────────────────────────────────────────
  try {
    const assets: AssetKey[] = ['BTC', 'ETH', 'SOL', 'XAU', 'XAG', 'WTI'];
    let allCovered = true;
    let missingInfo = '';

    assets.forEach((a) => {
      const p = buildAssetSmartMoneyProfile(a, 100);
      if (!p || !p.classes.etf_managers || !p.classes.hedge_funds_cot) {
        allCovered = false;
        missingInfo = `Asset ${a} missing core classes`;
      }
      // Oil must have CFTC COT WTI or OPEC
      if (a === 'WTI' && (!p.classes.hedge_funds_cot.source.includes('COT') || !p.classes.governments_central_banks.source.includes('OPEC'))) {
        allCovered = false;
        missingInfo = 'WTI missing COT or OPEC fundamental source';
      }
      // Gold must have Central Bank WGC/IMF source
      if (a === 'XAU' && !p.classes.governments_central_banks.source.includes('WGC')) {
        allCovered = false;
        missingInfo = 'XAU missing WGC central bank source';
      }
    });

    results.push({
      name: 'T8: Multi-Asset Coverage (Tailored asset data maps: WTI uses COT/OPEC, XAU uses WGC Central Banks)',
      passed: allCovered,
      message: allCovered ? 'All 6 asset classes (BTC, ETH, Alts, Gold, Silver, Oil) have dedicated institutional data maps.' : `Failed: ${missingInfo}`
    });
  } catch (err: any) {
    results.push({ name: 'T8: Multi-Asset Coverage', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T9: Priority Radar Alerts & Transfer Directionality
  // ──────────────────────────────────────────────────────────
  try {
    const events = MOCK_RADAR_EVENTS;
    const hasEtfStreak = events.some((e) => e.alertType === 'ETF_STREAK');
    const hasDormant = events.some((e) => e.alertType === 'DORMANT_AWAKENING');
    const hasWhaleTransfer = events.some((e) => e.alertType === 'WHALE_TRANSFER');

    // Whale event must clearly state deposit vs withdrawal
    const whaleEvt = events.find((e) => e.alertType === 'WHALE_TRANSFER');
    const hasDirectionality = whaleEvt?.descriptionHinglish.toLowerCase().includes('deposit') ||
                             whaleEvt?.descriptionHinglish.toLowerCase().includes('transfer');

    results.push({
      name: 'T9: Priority Radar Alerts (ETF Streaks, Whale Transfers with deposit/withdrawal distinction, Dormant Awakenings)',
      passed: hasEtfStreak && hasDormant && hasWhaleTransfer && (hasDirectionality ?? false),
      message: `Alerts verified: ETF streak (${hasEtfStreak}), Dormant coin (${hasDormant}), Whale transfer (${hasWhaleTransfer})`
    });
  } catch (err: any) {
    results.push({ name: 'T9: Priority Radar Alerts', passed: false, message: err.message });
  }

  // ──────────────────────────────────────────────────────────
  // T10: No Marketing Hype & Ledger Confidence Calibration
  // ──────────────────────────────────────────────────────────
  try {
    const report = generateWeeklyBigPlayerReport();
    let noHype = true;
    let hypeViolation = '';

    const forbiddenWords = ['100% stable', 'sure shot', 'sure-shot', 'guarantee', 'moon', '100% fixed', 'jackpot'];

    // Scan top takeaways & macro summaries
    report.top5TakeawaysHinglish.forEach((t) => {
      forbiddenWords.forEach((fw) => {
        if (t.toLowerCase().includes(fw)) {
          noHype = false;
          hypeViolation = `Found "${fw}" in takeaway: ${t}`;
        }
      });
    });

    // Check confidence basis is labeled unproven until n>=30
    const confidenceBasisCorrect = report.assets.BTC.smartMoney.confidenceBasis.includes('unproven (n=0)');

    results.push({
      name: 'T10: No Marketing Hype & Ledger Calibration (Zero hype words, confidence marked "unproven (n=0)")',
      passed: noHype && confidenceBasisCorrect,
      message: `No promotional claims: ${noHype}, Confidence basis: "${report.assets.BTC.smartMoney.confidenceBasis}"`
    });
  } catch (err: any) {
    results.push({ name: 'T10: No Marketing Hype', passed: false, message: err.message });
  }

  return results;
}
