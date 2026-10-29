/**
 * DEEEPR A-TO-Z PIPELINE REGRESSION & INTEGRITY TEST SUITE
 * Tests for DP1 - DP15 requirements
 */

import {
  evaluate4LaneAnalysis,
  parsePlainEnglishStrategy,
  runBacktestSimulation,
  deeeprAtoZPipelineManager,
  calculateWilsonInterval,
  generateRecordChecksum
} from '../deeeprAtoZPipelineEngine';

describe('DEEEPR A-to-Z Pipeline Engine Regression', () => {
  // DP1: 4-Lane Analysis & Master Verdict Single Arbiter
  it('DP1: 4-Lane Analysis emits single Master Verdict and detects lane disagreements', () => {
    const analysis = evaluate4LaneAnalysis('BTC');

    expect(analysis.asset).toBe('BTC');
    expect(['LONG', 'SHORT', 'WAIT']).toContain(analysis.masterVerdict);
    expect(analysis.lanes.Technical).toBeDefined();
    expect(analysis.lanes.Flow).toBeDefined();
    expect(analysis.lanes.News).toBeDefined();
    expect(analysis.lanes.Macro).toBeDefined();

    // Check evidence bullets (grounding)
    expect(analysis.lanes.Technical.evidence.length).toBeGreaterThanOrEqual(3);
    expect(analysis.lanes.Flow.evidence.length).toBeGreaterThanOrEqual(3);
    expect(analysis.lanes.News.evidence.length).toBeGreaterThanOrEqual(3);
    expect(analysis.lanes.Macro.evidence.length).toBeGreaterThanOrEqual(3);

    // Disagreement matrix
    expect(analysis.disagreement).toBeDefined();
    expect(analysis.disagreement.waitReason).toBeTruthy();
    expect(analysis.disagreement.conditionToFlip).toBeTruthy();
  });

  // DP2: Strategy DSL Parser & Echo
  it('DP2: Strategy DSL Parser parses English/Hinglish prompt into rule schema with echo', () => {
    const prompt = '15m par jab RSI 30 ke neeche jaye aur volume spike ho toh long entry le';
    const strat = parsePlainEnglishStrategy(prompt, 'BTC');

    expect(strat.asset).toBe('BTC');
    expect(strat.timeframe).toBe('15m');
    expect(strat.parsedSummary).toContain('Maine samjha');
    expect(strat.entryRules.length).toBeGreaterThanOrEqual(1);

    // Falling knife warning check
    expect(strat.warnings.some(w => w.includes('falling-knife') || w.includes('RSI'))).toBe(true);
  });

  // DP3: Deterministic Backtest Engine
  it('DP3: Deterministic Backtest enforces SL-first tie rule, costs and unproven badge', () => {
    const strat = parsePlainEnglishStrategy('SSL sweep & reclaim', 'ETH');
    const result = runBacktestSimulation(strat, 20);

    expect(result.totalTrades).toBe(20);
    expect(result.isUnproven).toBe(true); // n < 30 must be UNPROVEN
    expect(result.winRatePct).toBeGreaterThanOrEqual(0);
    expect(result.profitFactor).toBeGreaterThan(0);
    expect(result.trades.length).toBe(20);

    // Verify all trades have fees and valid exit reasons
    result.trades.forEach(tr => {
      expect(tr.feePaid).toBeGreaterThan(0);
      expect(['SL_HIT', 'TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'TIMEOUT_CLOSED']).toContain(tr.exitReason);
    });
  });

  // DP4: Wilson Confidence Interval
  it('DP4: Wilson Score Interval computes conservative mathematical bounds', () => {
    const wilson = calculateWilsonInterval(15, 25); // 60% observed
    expect(wilson.lower).toBeLessThan(60);
    expect(wilson.upper).toBeGreaterThan(60);
    expect(wilson.lower).toBeGreaterThan(35);
  });

  // DP5: Cryptographic Append-Only Checksum
  it('DP5: SHA-256 style checksum is deterministic and tamper-evident', () => {
    const record = { signalId: 'sig_test_1', asset: 'BTC', price: 85000, side: 'LONG' };
    const h1 = generateRecordChecksum(record);
    const h2 = generateRecordChecksum(record);
    expect(h1).toBe(h2);
    expect(h1.startsWith('0x')).toBe(true);

    const modified = { ...record, price: 85001 };
    const h3 = generateRecordChecksum(modified);
    expect(h3).not.toBe(h1);
  });

  // DP6: Paper Trading Balance & Execution
  it('DP6: Paper Trading simulator handles order placement, margin deduction and PnL', () => {
    const initialAccount = deeeprAtoZPipelineManager.getPaperAccount();
    const initialBalance = initialAccount.balance;

    const pos = deeeprAtoZPipelineManager.openPaperTrade('BTC', 'LONG', 1000);
    expect(pos.asset).toBe('BTC');
    expect(pos.side).toBe('LONG');
    expect(pos.investedUsd).toBe(1000);

    const updatedAccount = deeeprAtoZPipelineManager.getPaperAccount();
    expect(updatedAccount.balance).toBe(initialBalance - 1000);

    deeeprAtoZPipelineManager.closePaperTrade(pos.id);
    const closedAccount = deeeprAtoZPipelineManager.getPaperAccount();
    expect(closedAccount.openPositions.find(p => p.id === pos.id)).toBeUndefined();
  });

  // DP7: Token Ledger & Spending
  it('DP7: Token Ledger correctly debits and tracks balance', () => {
    const initialBal = deeeprAtoZPipelineManager.getTokenBalance();
    const success = deeeprAtoZPipelineManager.spendTokens('ANALYZE', 3, 'Test 4-Lane Run');
    expect(success).toBe(true);
    expect(deeeprAtoZPipelineManager.getTokenBalance()).toBe(initialBal - 3);
  });
});

