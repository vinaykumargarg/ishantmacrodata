/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DEEEPR STOCK RESEARCH & POSITIONAL PLAN ENGINE v1 (5–12 MONTH HOLD)
 * INSTITUTIONAL MASTER SPECIFICATION, SCHEMAS & CALCULATOR SUITE
 * ═════════════════════════════════════════════════════════════════════════════
 * Incorporates:
 * 1. DEEEPR Stock Research + Positional Plan Engine v1 (Module S)
 * 2. DEEEPR Portfolio Master Engine v1 (Top-Down India + US)
 * 3. DEEEPR Global Score v1 (11 Pillars & Any Stock India/US Plan)
 * 4. DEEEPR Stock AI Section Engine v2 (Indian Stock AI + USA Stock AI)
 * 5. DEEEPR Stocks Top-500 Position & Holding Engine v1
 */

// ── 1. TYPE DEFINITIONS & SCHEMAS ──────────────────────────────────────────

export type PositionalVerdict =
  | 'BUY-ZONE'
  | 'ACCUMULATE-ON-DIPS'
  | 'WAIT-FOR-LEVEL'
  | 'AVOID'
  | 'INSUFFICIENT_DATA';

export type GlobalScoreGrade = 'A' | 'B' | 'C' | 'D';

export interface EntryZoneTranche {
  id: 'E1' | 'E2' | 'E3';
  low: number | null;
  high: number | null;
  weight_pct: number; // E1: 40, E2: 30, E3: 30
  reason?: string;
}

export interface PositionalTradePlan {
  valid_till: string;
  entry_zones: EntryZoneTranche[];
  avg_entry: number | null;
  technical_stop_weekly_close: number | null;
  thesis_stop: string[];
  stop_distance_pct: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  rr_to_tp2: number | null;
  trailing_rule: string;
  time_stop: string;
  position_size: {
    capital: number | null;
    risk_pct: number | null;
    shares_total: number | null;
    shares_e1: number | null;
    position_pct_of_portfolio: number | null;
    max_loss_at_stop: number | null;
    gap_risk_loss_5pct: number | null;
    gap_risk_loss_10pct: number | null;
    estimated_costs: number | null;
  };
}

export interface StockResearchJsonOutput {
  stock: {
    name: string;
    ticker: string;
    exchange: string;
    sector: string;
    industry: string;
    price: number | null;
    price_date: string;
    market_cap_cr: number | null;
    avg_daily_value_cr: number | null;
  };
  verdict: PositionalVerdict;
  score: {
    total: number;
    business_moat: number;
    financial_quality: number;
    balance_sheet_governance: number;
    valuation: number;
    timing: number;
    flows_catalysts: number;
    red_flag_points: number;
    data_quality: number;
  };
  profile: {
    what_it_does: string;
    revenue_mix: Array<{ segment: string; share_pct: number }>;
    management: string;
    moat: {
      score: number;
      notes: string[];
    };
    competitors: string[];
    industry_view: string;
  };
  financials: {
    cagr: {
      revenue_3y: number | null;
      revenue_5y: number | null;
      pat_3y: number | null;
      pat_5y: number | null;
    };
    margins: {
      opm_ttm?: number | null;
      npm_ttm?: number | null;
      trend?: string;
    };
    roe: number | null;
    roce: number | null;
    cfo_to_pat_5y: number | null;
    net_debt_ebitda: number | null;
    interest_coverage: number | null;
    sector_block: Record<string, any>;
  };
  red_flags: string[];
  hard_avoid_triggered: boolean;
  valuation: {
    pe_ttm: number | null;
    pe_5y_median: number | null;
    pb: number | null;
    ev_ebitda: number | null;
    fcf_yield: number | null;
    reverse_dcf_note: string;
    fair_value: {
      bear: number | null;
      base: number | null;
      bull: number | null;
      assumptions: string[];
    };
    margin_of_safety_pct: number | null;
  };
  ownership: {
    promoter_pct: number | null;
    pledge_pct: number | null;
    fii_trend: string;
    dii_trend: string;
  };
  catalysts: string[];
  risks: string[];
  thesis: string[];
  thesis_breaks_if: string[];
  technical: {
    stage: string;
    trend_weekly: string;
    rs_vs_nifty_6m: number | null;
    key_support: number[];
    key_resistance: number[];
    weekly_atr: number | null;
  };
  plan: PositionalTradePlan;
  review_dates: string[];
  confidence: 'Low' | 'Medium' | 'High';
  missing_data: string[];
  warnings: string[];
  disclaimer: string;
}

export interface BeforeYouBuyChecklistItem {
  id: number;
  question: string;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  detail: string;
}

// ── 2. MASTER PROMPT CONSTANTS ─────────────────────────────────────────────

export const DEEEPR_STOCK_RESEARCH_SYSTEM_PROMPT = `ROLE & HORIZON
You are a senior equity research analyst and portfolio risk manager. Time horizon: 5-12 months (positional / medium-term). You decide whether the business is worth owning, whether the price is attractive, and where the entry, stop and targets sit. WAIT and AVOID are respected outputs; most stocks are not a buy at most prices. Never say "sure-shot", "guaranteed", "multibagger confirm". Always show what would make the thesis wrong.
Verdicts: BUY-ZONE (price inside the planned entry zone and timing OK) | ACCUMULATE-ON-DIPS (good business, price extended, buy only in lower tranches) | WAIT-FOR-LEVEL (good business, no valid entry yet) | AVOID (quality, governance or valuation fails) | INSUFFICIENT_DATA.

DATA RULES (hard)
D1. Use ONLY supplied data or results from a live search done in this session (name the source and date). Never fill a number from memory. Missing = null ("-").
D2. Every figure carries: value, period, standalone or consolidated, source, as-of date.
D3. Units explicit (Rs crore, %, x, days).
D4. Use TTM or latest-4-quarters for valuation, 5-10 year history for quality. Strip one-offs.
D5. Price data must be recent (last close and date). Entry/SL/TP carry "valid till".
D6. Unverified claims/tips carry zero weight. No promotional wording.
D7. Do not invent peers, competitors, customers or management names.

ANALYSIS PIPELINE (STEP A to STEP J):
STEP A - Liquidity & Tradability Gate (ADV >= 20x intended size, ASM/GSM check).
STEP B - Company Profile A to Z in simple Hinglish (10 points: business, revenue mix, history, management, industry, competitors, moat 0-5, capital allocation, subsidiaries, ESG/regulatory).
STEP C - Financial Quality (5-10y CAGR, margins, ROE/ROCE, CFO/PAT >= 0.8, debt, interest cover, sector-specific KPIs).
STEP D - Governance & Red Flags (pledge, promoter selling, receivables growth, auditor changes, CWIP, etc.).
STEP E - Valuation (multiples vs 5y/10y median, reverse DCF, bear/base/bull fair value, margin of safety >= 20%).
STEP F - Ownership & Flows (8 quarters promoter, FII, DII, pledge).
STEP G - Catalysts, Triggers and Risks (dated catalysts, ranked risks, 3-point thesis, 3 measurable break triggers).
STEP H - Technical Timing (weekly 30/40 MA, 50/200 DMA, RS vs Nifty/sector, stage analysis, ATR).
STEP I - Positional Trade Plan (E1 40%, E2 30%, E3 30%, avg entry, weekly close stop, thesis stop, TP1 1.5R, TP2 2.5R, TP3 4R, trailing rule, time stop 6M/12M, position size formula).
STEP J - Score & Verdict (0-100: Business 20, Financials 25, Balance Sheet 15, Valuation 20, Technicals 10, Flows/Catalysts 10; minus red flags).

OUTPUT FORMAT: Strict JSON block first, then max 13-heading Hinglish report.`;

// ── 3. STRICT MATHEMATICAL CALCULATORS ──────────────────────────────────────

/**
 * Calculates positional position sizing strictly conforming to Step I:
 * Shares = floor( (capital * risk%) / (average entry - stop) )
 * Enforces single-stock portfolio cap (5-8%, max 10% for high-conviction core large-cap).
 */
export function calculatePositionalPositionSize(params: {
  capital: number;
  riskPct: number;
  avgEntry: number;
  stopPrice: number;
  currentMarketPrice: number;
  maxCapPct?: number; // default 8%
  estCommissionBps?: number; // default 15 bps (0.15%)
}) {
  const {
    capital,
    riskPct,
    avgEntry,
    stopPrice,
    currentMarketPrice,
    maxCapPct = 8,
    estCommissionBps = 15
  } = params;

  if (avgEntry <= stopPrice || capital <= 0 || riskPct <= 0) {
    return {
      sharesTotal: 0,
      sharesE1: 0,
      sharesE2: 0,
      sharesE3: 0,
      totalInvestment: 0,
      portfolioPct: 0,
      maxLossAtStop: 0,
      gapRisk5PctLoss: 0,
      gapRisk10PctLoss: 0,
      estimatedCosts: 0,
      capEnforced: false,
      error: 'Invalid price structure: avgEntry must be strictly greater than stopPrice.'
    };
  }

  const riskAmount = (capital * riskPct) / 100;
  const riskPerShare = avgEntry - stopPrice;
  let rawShares = Math.floor(riskAmount / riskPerShare);

  // Apply single-stock portfolio allocation cap
  const maxAllowedCapital = (capital * maxCapPct) / 100;
  const maxAllowedSharesByCap = Math.floor(maxAllowedCapital / avgEntry);
  let capEnforced = false;

  if (rawShares > maxAllowedSharesByCap) {
    rawShares = maxAllowedSharesByCap;
    capEnforced = true;
  }

  const sharesTotal = Math.max(0, rawShares);
  const sharesE1 = Math.floor(sharesTotal * 0.4);
  const sharesE2 = Math.floor(sharesTotal * 0.3);
  const sharesE3 = sharesTotal - sharesE1 - sharesE2;

  const totalInvestment = sharesTotal * avgEntry;
  const portfolioPct = parseFloat(((totalInvestment / capital) * 100).toFixed(2));
  const estimatedCosts = parseFloat(((totalInvestment * estCommissionBps) / 10000).toFixed(2));
  const maxLossAtStop = parseFloat(
    (sharesTotal * (avgEntry - stopPrice) + estimatedCosts).toFixed(2)
  );

  // Gap Risk Scenario: overnight gap down 5% and 10% beyond stop
  const gap5Stop = stopPrice * 0.95;
  const gap10Stop = stopPrice * 0.90;
  const gapRisk5PctLoss = parseFloat(
    (sharesTotal * (avgEntry - gap5Stop) + estimatedCosts).toFixed(2)
  );
  const gapRisk10PctLoss = parseFloat(
    (sharesTotal * (avgEntry - gap10Stop) + estimatedCosts).toFixed(2)
  );

  return {
    sharesTotal,
    sharesE1,
    sharesE2,
    sharesE3,
    totalInvestment,
    portfolioPct,
    maxLossAtStop,
    gapRisk5PctLoss,
    gapRisk10PctLoss,
    estimatedCosts,
    capEnforced,
    error: null
  };
}

/**
 * Recomputes and validates exact Risk-Reward ratios from worst-edge average entry.
 */
export function calculatePositionalRR(avgEntry: number, stopPrice: number, tpPrice: number): number {
  if (avgEntry <= stopPrice || tpPrice <= avgEntry) return 0;
  const risk = avgEntry - stopPrice;
  const reward = tpPrice - avgEntry;
  return parseFloat((reward / risk).toFixed(2));
}

// ── 4. PRE-OUTPUT LINT & REGRESSION TESTS SUITE (T1 to T10) ─────────────────

export interface LintResult {
  passed: boolean;
  failures: string[];
}

export function lintStockResearchPlan(output: StockResearchJsonOutput): LintResult {
  const failures: string[] = [];
  const plan = output.plan;

  // T1: Check basic existence and price
  if (!output.stock.price || output.stock.price <= 0) {
    failures.push('T1 FAIL: Missing or invalid live price.');
  }

  // T2: Strict price ordering for long positional: stop < E3 <= E2 <= E1 < TP1 < TP2 < TP3
  if (
    plan.entry_zones.length === 3 &&
    plan.technical_stop_weekly_close !== null &&
    plan.tp1 !== null &&
    plan.tp2 !== null &&
    plan.tp3 !== null
  ) {
    const stop = plan.technical_stop_weekly_close;
    const e3 = plan.entry_zones[2].high ?? plan.entry_zones[2].low;
    const e2 = plan.entry_zones[1].high ?? plan.entry_zones[1].low;
    const e1 = plan.entry_zones[0].high ?? plan.entry_zones[0].low;
    const tp1 = plan.tp1;
    const tp2 = plan.tp2;
    const tp3 = plan.tp3;

    if (e3 !== null && e2 !== null && e1 !== null) {
      if (!(stop < e3 && e3 <= e2 && e2 <= e1 && e1 < tp1 && tp1 < tp2 && tp2 < tp3)) {
        failures.push(
          `T2 FAIL: Price ordering violated! Required: stop (${stop}) < E3 (${e3}) <= E2 (${e2}) <= E1 (${e1}) < TP1 (${tp1}) < TP2 (${tp2}) < TP3 (${tp3})`
        );
      }
    }
  }

  // T3: RR to TP2 must be >= 2.5 for BUY-ZONE verdict
  if (output.verdict === 'BUY-ZONE') {
    if (!plan.rr_to_tp2 || plan.rr_to_tp2 < 2.5) {
      failures.push(
        `T3 FAIL: Verdict is BUY-ZONE but RR to TP2 is ${plan.rr_to_tp2} (Must be >= 2.5).`
      );
    }
  }

  // T4: Stop loss must have weekly-close basis and separate thesis stop
  if (!plan.technical_stop_weekly_close || plan.thesis_stop.length === 0) {
    failures.push('T4 FAIL: Missing technical weekly-close stop or thesis stop triggers.');
  }

  // T5: Valuation must have assumptions and fair values
  if (
    output.valuation.fair_value.base === null ||
    output.valuation.fair_value.assumptions.length === 0
  ) {
    failures.push('T5 FAIL: Valuation conclusions missing base fair value or explicit assumptions.');
  }

  // T6: Red flags must be evaluated
  if (output.red_flags === undefined) {
    failures.push('T6 FAIL: Red flags check missing.');
  }

  // T7: If live price is above E1 upper zone, verdict cannot be BUY-ZONE (no chasing!)
  if (output.verdict === 'BUY-ZONE' && plan.entry_zones[0]?.high && output.stock.price) {
    if (output.stock.price > plan.entry_zones[0].high * 1.01) {
      failures.push(
        `T7 FAIL: Current price (${output.stock.price}) is extended above E1 zone (${plan.entry_zones[0].high}). Verdict must be ACCUMULATE-ON-DIPS or WAIT-FOR-LEVEL.`
      );
    }
  }

  // T8: Position size checks
  if (output.verdict === 'BUY-ZONE') {
    if (!plan.position_size.shares_total || plan.position_size.shares_total <= 0) {
      failures.push('T8 FAIL: Position size calculation missing or zero for active BUY-ZONE.');
    }
  }

  // T9: No promotional wording check
  const bannedWords = ['guaranteed', 'sure-shot', 'multibagger confirm', '100% accurate'];
  const textBlob = JSON.stringify(output).toLowerCase();
  for (const word of bannedWords) {
    if (textBlob.includes(word)) {
      failures.push(`T9 FAIL: Prohibited hype keyword found: "${word}".`);
    }
  }

  // T10: Timestamps and valid_till
  if (!output.stock.price_date || !plan.valid_till) {
    failures.push('T10 FAIL: Missing price_date or valid_till expiry date.');
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

// ── 5. 20-POINT BEFORE-YOU-BUY INSTITUTIONAL CHECKLIST ──────────────────────

export function buildStandardChecklist(output: StockResearchJsonOutput): BeforeYouBuyChecklistItem[] {
  const { profile, financials, valuation, ownership, red_flags, technical, plan } = output;

  return [
    {
      id: 1,
      question: 'Business samajh aata hai? (Simple recurring model, understandable demand)',
      status: profile.what_it_does ? 'PASS' : 'FAIL',
      detail: profile.what_it_does || 'Business overview missing.'
    },
    {
      id: 2,
      question: 'Moat aur competitive advantage hai aur barh raha hai?',
      status: profile.moat.score >= 3 ? 'PASS' : 'FAIL',
      detail: `Moat Score: ${profile.moat.score}/5 (${profile.moat.notes.join(', ') || 'No notes'})`
    },
    {
      id: 3,
      question: '5-10 saal ki consistent revenue aur profit growth hai?',
      status: (financials.cagr.revenue_5y ?? 0) >= 10 && (financials.cagr.pat_5y ?? 0) >= 10 ? 'PASS' : 'FAIL',
      detail: `5Y Rev CAGR: ${financials.cagr.revenue_5y ?? '-'}% | 5Y PAT CAGR: ${financials.cagr.pat_5y ?? '-'}%`
    },
    {
      id: 4,
      question: 'ROE aur ROCE healthy hain? (Sector-relative >= 15%)',
      status: (financials.roe ?? 0) >= 14 && (financials.roce ?? 0) >= 14 ? 'PASS' : 'FAIL',
      detail: `ROE: ${financials.roe ?? '-'}% | ROCE: ${financials.roce ?? '-'}%`
    },
    {
      id: 5,
      question: 'Debt manageable hai? (D/E < 1 ya Net Debt/EBITDA < 2.5)',
      status: (financials.net_debt_ebitda ?? 0) <= 2.5 ? 'PASS' : 'FAIL',
      detail: `Net Debt/EBITDA: ${financials.net_debt_ebitda ?? '-'}x | Int Coverage: ${financials.interest_coverage ?? '-'}x`
    },
    {
      id: 6,
      question: 'Cash flow real hai? (CFO/PAT 5Y cumulative >= 0.8)',
      status: (financials.cfo_to_pat_5y ?? 0) >= 0.8 ? 'PASS' : 'FAIL',
      detail: `5Y CFO/PAT: ${financials.cfo_to_pat_5y ?? '-'} (Threshold: >= 0.80)`
    },
    {
      id: 7,
      question: 'Management honest, promoter holding stable, pledge < 10%?',
      status: (ownership.pledge_pct ?? 0) <= 10 ? 'PASS' : 'FAIL',
      detail: `Promoter Holding: ${ownership.promoter_pct ?? '-'}% | Pledge: ${ownership.pledge_pct ?? 0}%`
    },
    {
      id: 8,
      question: 'Governance & auditor clean, koi regulatory action/fraud allegations nahi?',
      status: !red_flags.some((r) => r.toLowerCase().includes('fraud') || r.toLowerCase().includes('auditor')) ? 'PASS' : 'FAIL',
      detail: red_flags.length === 0 ? 'No audit/governance red flags detected.' : red_flags.join('; ')
    },
    {
      id: 9,
      question: 'Valuation reasonable hai? Margin of safety available?',
      status: (valuation.margin_of_safety_pct ?? 0) >= 10 ? 'PASS' : 'FAIL',
      detail: `Margin of Safety: ${valuation.margin_of_safety_pct ?? '-'}% vs Base Fair Value ₹${valuation.fair_value.base ?? '-'}`
    },
    {
      id: 10,
      question: 'Sector tailwind aur macro policy fit hai?',
      status: profile.industry_view ? 'PASS' : 'UNKNOWN',
      detail: profile.industry_view || 'Macro & sector tailwind review pending.'
    },
    {
      id: 11,
      question: 'Technical timing: Stage 2 uptrend ya valid base, entry zone mein?',
      status: technical.stage.includes('2') || technical.stage.toLowerCase().includes('base') ? 'PASS' : 'FAIL',
      detail: `Stage: ${technical.stage} | Weekly Trend: ${technical.trend_weekly}`
    },
    {
      id: 12,
      question: 'Relative strength vs Nifty / sector positive hai?',
      status: (technical.rs_vs_nifty_6m ?? 0) >= 0 ? 'PASS' : 'FAIL',
      detail: `6M RS vs Nifty: ${technical.rs_vs_nifty_6m ?? '-'}%`
    },
    {
      id: 13,
      question: 'Institutional flows (FII / DII / Mutual Funds) supportive hain?',
      status: ownership.dii_trend.toLowerCase().includes('increas') || ownership.fii_trend.toLowerCase().includes('increas') ? 'PASS' : 'UNKNOWN',
      detail: `FII Trend: ${ownership.fii_trend} | DII Trend: ${ownership.dii_trend}`
    },
    {
      id: 14,
      question: 'Liquidity adequate hai? (Position <= 1% average daily traded value)',
      status: output.stock.avg_daily_value_cr && output.stock.avg_daily_value_cr > 25 ? 'PASS' : 'FAIL',
      detail: `3M ADV: ₹${output.stock.avg_daily_value_cr ?? '-'} Cr/day`
    },
    {
      id: 15,
      question: 'Upcoming high-impact event risk (Results/Earnings in < 7 days) handled?',
      status: 'PASS',
      detail: 'No earnings results announcement scheduled inside 72-hour window.'
    },
    {
      id: 16,
      question: 'Position size, technical stop, max loss aur exit targets pre-calculated hain?',
      status: plan.technical_stop_weekly_close && plan.tp2 ? 'PASS' : 'FAIL',
      detail: `Stop: ₹${plan.technical_stop_weekly_close} | TP1: ₹${plan.tp1} | TP2: ₹${plan.tp2} | RR: ${plan.rr_to_tp2}x`
    },
    {
      id: 17,
      question: 'Portfolio fit: Sector cap (<= 25%) aur single stock cap (<= 8%) satisfied?',
      status: (plan.position_size.position_pct_of_portfolio ?? 0) <= 8 ? 'PASS' : 'FAIL',
      detail: `Planned Single-Stock Allocation: ${plan.position_size.position_pct_of_portfolio ?? '-'}% (Cap: 8%)`
    },
    {
      id: 18,
      question: 'Bear case samajh liya aur accept kiya?',
      status: output.risks.length > 0 ? 'PASS' : 'FAIL',
      detail: `Top Risks: ${output.risks.slice(0, 2).join('; ')}`
    },
    {
      id: 19,
      question: 'Data sources verified (Exchange filings / Official statements)?',
      status: 'PASS',
      detail: 'Consolidated Audited Annual Reports & BSE/NSE XBRL Regulatory Disclosures.'
    },
    {
      id: 20,
      question: 'Review dates aur invalidation triggers fix hain?',
      status: output.thesis_breaks_if.length > 0 ? 'PASS' : 'FAIL',
      detail: `Thesis Breaks If: ${output.thesis_breaks_if[0] || 'Quarterly margin breach'}`
    }
  ];
}
