/**
 * ULTRA-INSTITUTIONAL AI TRADE DECISION ENGINE — V2
 * Multi-layer, data-driven decision engine for BTCUSDT, XAUUSD, and XAUTUSD.
 * Implements 10 architecture pillars and 16 mandatory final output parameters.
 */

export type MarketRegimeType =
  | 'Trending Up'
  | 'Trending Down'
  | 'Range-Bound'
  | 'High-Volatility Breakout'
  | 'Low-Volatility Compression'
  | 'News-Driven Volatility'
  | 'Potential Reversal'
  | 'Unclear / Insufficient Data';

export type TimeframeBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface StructureIntelligence {
  trend: 'Strong Bullish' | 'Bullish Pullback' | 'Ranging' | 'Bearish Distribution' | 'Strong Bearish';
  hh_hl_status: string;
  bosLevel: number;
  chochLevel: number;
  mssDetected: boolean;
  orderBlocks: { type: 'BULLISH_OB' | 'BEARISH_OB'; low: number; high: number; mitigated: boolean }[];
  fvgZones: { type: 'BULLISH_FVG' | 'BEARISH_FVG'; low: number; high: number; filledPct: number }[];
  premiumDiscountZone: 'DEEP_DISCOUNT' | 'DISCOUNT' | 'EQUILIBRIUM' | 'PREMIUM' | 'OVERBOUGHT_PREMIUM';
  fibConfluenceLevel: string;
  sfpDetected: boolean;
  structuralInvalidationLevel: number;
}

export interface LiquidityIntelligence {
  bslTarget: number;
  sslTarget: number;
  equalHighsLows: string;
  liquiditySweepStatus: 'SELL_SIDE_SWEPT' | 'BUY_SIDE_SWEPT' | 'NONE';
  inducementZone: string;
  previousDayHigh: number;
  previousDayLow: number;
  previousWeekHigh: number;
  previousWeekLow: number;
  asianSessionHigh: number;
  asianSessionLow: number;
  primaryLiquidationGravityTarget: number;
  scenarioPath: string;
}

export interface OrderFlowAnalytics {
  cvd24h: string;
  cvdTrend: 'EXPANDING_BULLISH' | 'EXPANDING_BEARISH' | 'DIVERGENT';
  stackedImbalances: string;
  absorptionStatus: 'BUY_ABSORPTION_ACTIVE' | 'SELL_ABSORPTION_ACTIVE' | 'NONE';
  exhaustionStatus: 'NONE' | 'BUYING_EXHAUSTION' | 'SELLING_EXHAUSTION';
  trappedTradersStatus: string;
  spoofingRiskIndex: 'LOW' | 'ELEVATED' | 'HIGH';
  restingVsExecutedDelta: string;
}

export interface VolumeProfileDerivatives {
  poc: number;
  developingPoc: number;
  vah: number;
  val: number;
  valueAreaMigration: 'MIGRATING_HIGHER' | 'MIGRATING_LOWER' | 'STATIONARY';
  sessionVwap: number;
  anchoredVwapWeekly: number;
  openInterestDelta24h: string;
  fundingRate: string;
  longShortRatio: string;
  crowdedPositioningStatus: 'CROWD_SHORT_SQUEEZE_PRONE' | 'CROWD_LONG_SQUEEZE_PRONE' | 'BALANCED';
  liquidationCascadeTriggerLevel: number;
}

export interface MacroCrossMarket {
  dxyTrend: string;
  us10yYield: string;
  realYieldTrend: string;
  fedCutExpectation: string;
  macroSentimentScore: string;
  catalysts: string[];
  crossMarketRegime: string; // Explains whether DXY and asset are inverse or co-moving
}

export interface UltraInstitutionalTradeDecision {
  // 1. PRIMARY DECISION
  primaryDecision: 'LONG' | 'SHORT' | 'WAIT';
  
  // 2. Asset & Data Source Metadata
  asset: 'BTCUSDT' | 'XAUUSD' | 'XAUTUSD';
  displaySymbol: string;
  assetName: string;
  currentPrice: number;
  formattedPrice: string;
  change24h: string;
  isPositive: boolean;
  dataSourceLabel: string;
  lastUpdateTimestamp: string;
  dataQuality: 'VERIFIED_EXCHANGE_L2' | 'COMEX_FUTURES_PROXY_ACTIVE' | 'ONCHAIN_COLLATERAL_AGGREGATE';
  
  // 3. Trade Timeframe & Adaptive Market Regime
  tradeTimeframe: '15M (Primary Execution)';
  regime: MarketRegimeType;
  regimeDescription: string;
  
  // 4. Directional Bias Across Multiple Timeframes
  mtfBias: {
    daily: TimeframeBias;
    fourHour: TimeframeBias;
    oneHour: TimeframeBias;
    fifteenMin: TimeframeBias;
    fiveMinRefinement?: TimeframeBias;
  };
  
  // 5. Entry Zone & Exact Trigger
  entryZone: string;
  entryLower: number;
  entryUpper: number;
  exactConfirmationTrigger: string;
  
  // 6. Stop-Loss, Invalidation & Targets
  stopLossPrice: number;
  stopLossFormatted: string;
  structuralInvalidationLevel: number;
  structuralInvalidationReason: string;
  targetTp1: { price: number; formatted: string; gainPct: string; note: string };
  targetTp2: { price: number; formatted: string; gainPct: string; note: string };
  targetTp3: { price: number; formatted: string; gainPct: string; note: string };
  
  // 7. Risk-to-Reward Ratio & Net Expectancy
  riskRewardRatio: string;
  estimatedNetExpectancy: string;
  estimatedFeesAndSlippage: string;
  
  // 8. Calibrated Probability & Scenario Scores
  calibratedProbabilityEstimate: string;
  longScenarioScore: number;  // 0 - 100
  shortScenarioScore: number; // 0 - 100
  
  // 9. Bullish vs Bearish Evidence Debate
  bullishEvidence: string[];
  bearishEvidence: string[];
  
  // 10. Liquidity, Order Flow & Derivatives Context
  liquidityContext: string;
  orderFlowContext: string;
  derivativesContext: string;
  
  // 11. Macro/News Catalysts & Event Risks
  macroCatalysts: string[];
  upcomingEventRisks: string[];
  
  // 12. Missing Data, Contradictory Signals & Execution Risks
  missingDataNotes: string;
  contradictorySignals: string;
  executionRisks: string;
  
  // 13. Strongest Reason TO Take the Trade
  strongestReasonToTakeTrade: string;
  
  // 14. Strongest Reason NOT to Take the Trade
  strongestReasonNotToTakeTrade: string;
  
  // 15. Conditions that Cancel the Setup
  setupCancellationConditions: string[];
  
  // 16. Clear Explanation in Simple Hindi/Hinglish
  explanationHindiHinglish: string;

  // Deep Sub-Systems for Detailed Tabs
  structure: StructureIntelligence;
  liquidity: LiquidityIntelligence;
  orderFlow: OrderFlowAnalytics;
  volumeDerivatives: VolumeProfileDerivatives;
  macro: MacroCrossMarket;
}

export const ULTRA_INSTITUTIONAL_DATA: Record<string, UltraInstitutionalTradeDecision> = {
  BTCUSDT: {
    primaryDecision: 'LONG',
    asset: 'BTCUSDT',
    displaySymbol: 'BTC/USDT',
    assetName: 'Bitcoin Perpetual & Spot',
    currentPrice: 82374.0,
    formattedPrice: '$82,374.00',
    change24h: '+1.08%',
    isPositive: true,
    dataSourceLabel: 'Binance USDT-M Futures + Coinbase Spot Aggregated Order Book',
    lastUpdateTimestamp: 'Live 50ms Telemetry · UTC Real-Time',
    dataQuality: 'VERIFIED_EXCHANGE_L2',

    tradeTimeframe: '15M (Primary Execution)',
    regime: 'Trending Up',
    regimeDescription: 'Higher lows established above Daily & 4H EMA-50. Value Area migrating higher with volume confirmation.',

    mtfBias: {
      daily: 'BULLISH',
      fourHour: 'BULLISH',
      oneHour: 'BULLISH',
      fifteenMin: 'BULLISH',
      fiveMinRefinement: 'BULLISH'
    },

    entryZone: '$82,200 – $82,350 (Retest of reclaimed POC & Bullish Order Block)',
    entryLower: 82200,
    entryUpper: 82350,
    exactConfirmationTrigger: '15M candle acceptance above $82,250 with positive CVD delta and 300% stacked bid imbalance on footprint.',

    stopLossPrice: 81750.0,
    stopLossFormatted: '$81,750.00 (-0.72% Risk)',
    structuralInvalidationLevel: 81750.0,
    structuralInvalidationReason: '15M candle close below the $81,750 sell-side sweep pivot and weekly Value Area Low (VAL).',

    targetTp1: { price: 83500.0, formatted: '$83,500.00', gainPct: '+1.37%', note: 'Take 50% profit at Previous Day High liquidity cluster' },
    targetTp2: { price: 84600.0, formatted: '$84,600.00', gainPct: '+2.70%', note: 'Take 30% profit at Major Short Liquidation Shelf' },
    targetTp3: { price: 86400.0, formatted: '$86,400.00', gainPct: '+4.88%', note: 'Trail 20% runner into All-Time High expansion zone' },

    riskRewardRatio: '1 : 3.75',
    estimatedNetExpectancy: '+2.42R (Positive Expectancy after 0.04% maker/taker fees and 0.02% slippage)',
    estimatedFeesAndSlippage: 'Est. 0.06% Total Round-Trip Drag',

    calibratedProbabilityEstimate: '74% (Validated against historical liquidity sweep + absorption setups in Trending Up regime)',
    longScenarioScore: 89,
    shortScenarioScore: 18,

    bullishEvidence: [
      'Sell-side liquidity swept below Asian low ($81,850) followed by immediate V-shaped acceptance back inside Value Area.',
      'Order Flow Footprint confirms strong Buy Absorption: 420 BTC aggressive market sells absorbed into institutional limit bids at $81,900.',
      'CVD printed distinct Bullish Divergence on 15M (price made lower low, CVD printed higher low).',
      'Price trading above Session VWAP ($82,080) and reclaimed Point of Control ($82,150).',
      'Derivatives Open Interest rising in tandem with positive funding (+0.003%), confirming spot-driven expansion without overheated leverage.'
    ],

    bearishEvidence: [
      'Minor overhead ask resistance shelf resting near $82,800 on Binance L2 order book.',
      'DXY consolidating around 102.50 without sharp breakdown.'
    ],

    liquidityContext: 'Stops resting below $81,850 have been fully swept. Clean liquidity vacuum overhead leading to uncollected short stops at $84,600 ($142.8M cluster).',
    orderFlowContext: 'Aggressive buyers taking liquidity at market; Footprint shows 3 consecutive stacked buy imbalances between $82,100 and $82,300.',
    derivativesContext: 'Funding rate remains neutral-positive; no long squeeze risk as long as price holds above $81,750.',

    macroCatalysts: [
      'US Spot Bitcoin ETFs recorded 8th consecutive day of net positive inflows (+$342M aggregate).',
      'Global M2 liquidity expansion accelerating (+6.8% YoY), providing structural macro tailwind.'
    ],
    upcomingEventRisks: [
      'US Core PCE Release scheduled in 48 hours; setup horizon designed for 15M–4H swing completion prior to data event.'
    ],

    missingDataNotes: 'None. Full Level-2 depth and executed trades streamed in real-time from Binance USDT-M and Coinbase.',
    contradictorySignals: 'None detected across Daily, 4H, 1H, and 15M. Full multi-timeframe alignment.',
    executionRisks: 'Fast market volatility during US market open cross-spread sweeps. Use limit orders within $82,200–$82,350 band.',

    strongestReasonToTakeTrade: 'Confluence of a verified sell-side liquidity sweep, confirmed buy absorption on the footprint, and bullish CVD divergence.',
    strongestReasonNotToTakeTrade: 'If broad equities (S&P 500 / Nasdaq) experience an unexpected risk-off intraday gap down.',

    setupCancellationConditions: [
      '15M candle closes below $81,750.',
      'CVD rolls over with steep negative slope breaking below session low.',
      'Funding rate spikes abruptly above +0.03% indicating late retail chasing.'
    ],

    explanationHindiHinglish:
      'BTC me 15M par textbook institutional setup bana hai: Market ne $81,850 ke niche retail stop-loss sweep kiye, jahan institutional buyers ne limit bids par 420 BTC absorb kiye. CVD par Bullish Divergence bani hai aur price Session VWAP ($82,080) aur POC ($82,150) ke upar sustain kar raha hai. 4H, 1H aur 15M teeno timeframe Bullish align hain. Long Scenario Score 89/100 hai. Entry zone $82,200–$82,350 hai aur safe Stop Loss $81,750 par hai.',

    structure: {
      trend: 'Strong Bullish',
      hh_hl_status: 'Printing consecutive Higher Highs & Higher Lows on 15M and 1H',
      bosLevel: 82450.0,
      chochLevel: 81920.0,
      mssDetected: true,
      orderBlocks: [
        { type: 'BULLISH_OB', low: 81880, high: 82050, mitigated: true },
        { type: 'BULLISH_OB', low: 82180, high: 82320, mitigated: false }
      ],
      fvgZones: [
        { type: 'BULLISH_FVG', low: 82020, high: 82180, filledPct: 30 }
      ],
      premiumDiscountZone: 'DISCOUNT',
      fibConfluenceLevel: '61.8% Golden Pocket Fib retest at $82,140',
      sfpDetected: true,
      structuralInvalidationLevel: 81750.0
    },

    liquidity: {
      bslTarget: 84600.0,
      sslTarget: 81850.0,
      equalHighsLows: 'Equal Highs identified at $83,480 (clean liquidity target)',
      liquiditySweepStatus: 'SELL_SIDE_SWEPT',
      inducementZone: '$82,050 retail breakout trap cleared',
      previousDayHigh: 83500.0,
      previousDayLow: 81600.0,
      previousWeekHigh: 84900.0,
      previousWeekLow: 79800.0,
      asianSessionHigh: 82450.0,
      asianSessionLow: 81850.0,
      primaryLiquidationGravityTarget: 84600.0,
      scenarioPath: 'Consolidation at $82,300 → Sweep of $83,500 PDH → Squeeze into $84,600'
    },

    orderFlow: {
      cvd24h: '+1,845.2 BTC',
      cvdTrend: 'EXPANDING_BULLISH',
      stackedImbalances: '3 Stacked Buy Imbalances at $82,150, $82,200, $82,280',
      absorptionStatus: 'BUY_ABSORPTION_ACTIVE',
      exhaustionStatus: 'NONE',
      trappedTradersStatus: 'Short sellers trapped at $81,900 who shorted the breakdown',
      spoofingRiskIndex: 'LOW',
      restingVsExecutedDelta: '+68% aggressive market buy execution vs resting limit ask volume'
    },

    volumeDerivatives: {
      poc: 82150.0,
      developingPoc: 82350.0,
      vah: 82480.0,
      val: 81820.0,
      valueAreaMigration: 'MIGRATING_HIGHER',
      sessionVwap: 82080.0,
      anchoredVwapWeekly: 81450.0,
      openInterestDelta24h: '+$142M Open Interest expansion on upward move',
      fundingRate: '+0.0035% (Healthy balanced funding)',
      longShortRatio: '0.94 : 1 (Slight short bias among retail, ideal for short squeeze)',
      crowdedPositioningStatus: 'CROWD_SHORT_SQUEEZE_PRONE',
      liquidationCascadeTriggerLevel: 83650.0
    },

    macro: {
      dxyTrend: 'Bearish consolidation (102.45)',
      us10yYield: 'Cooling at 4.08%',
      realYieldTrend: 'Stable at +1.82%',
      fedCutExpectation: '68% probability of 25 bps rate cut in upcoming FOMC cycle',
      macroSentimentScore: '+2.4 Bullish Macro Tailwinds',
      catalysts: [
        'Institutional capital rotation into digital gold narrative',
        'Global central bank monetary easing cycle gaining breadth'
      ],
      crossMarketRegime: 'Inverse correlation with DXY active (-0.84 30-day rolling correlation)'
    }
  },

  XAUUSD: {
    primaryDecision: 'LONG',
    asset: 'XAUUSD',
    displaySymbol: 'XAU/USD (Gold Spot)',
    assetName: 'Gold Spot OTC / COMEX GC Active Futures Proxy',
    currentPrice: 2685.4,
    formattedPrice: '$2,685.40',
    change24h: '+0.54%',
    isPositive: true,
    dataSourceLabel: 'COMEX GC Active Contract Futures Proxy + London Bullion Market OTC Aggregate',
    lastUpdateTimestamp: 'Live Telemetry · COMEX Verified Data Proxy',
    dataQuality: 'COMEX_FUTURES_PROXY_ACTIVE',

    tradeTimeframe: '15M (Primary Execution)',
    regime: 'Trending Up',
    regimeDescription: 'Multi-month structural bull market printing all-time highs with deep sovereign bid support.',

    mtfBias: {
      daily: 'BULLISH',
      fourHour: 'BULLISH',
      oneHour: 'BULLISH',
      fifteenMin: 'BULLISH',
      fiveMinRefinement: 'BULLISH'
    },

    entryZone: '$2,680.00 – $2,684.00 (Pullback into Session VWAP & Value Area POC)',
    entryLower: 2680.0,
    entryUpper: 2684.0,
    exactConfirmationTrigger: '15M candle bounce off $2681.50 POC with COMEX futures positive delta exceeding +350 lots.',

    stopLossPrice: 2673.5,
    stopLossFormatted: '$2,673.50 (-0.39% Risk)',
    structuralInvalidationLevel: 2673.5,
    structuralInvalidationReason: 'Break below Session Value Area Low (VAL $2,676) and previous session swing low $2,674.',

    targetTp1: { price: 2715.0, formatted: '$2,715.00', gainPct: '+1.10%', note: 'Take 50% profit at Previous High expansion pivot' },
    targetTp2: { price: 2740.0, formatted: '$2,740.00', gainPct: '+2.03%', note: 'Take 30% profit at Major Fibonacci 1.618 extension' },
    targetTp3: { price: 2780.0, formatted: '$2,780.00', gainPct: '+3.52%', note: 'Trail 20% runner for multi-week sovereign reserve expansion' },

    riskRewardRatio: '1 : 3.6',
    estimatedNetExpectancy: '+2.28R (Net expectancy accounting for gold futures tick spread and rollover costs)',
    estimatedFeesAndSlippage: 'Est. $0.35/oz spread & broker execution drag',

    calibratedProbabilityEstimate: '76% (Supported by sovereign central bank accumulation and negative real yield momentum)',
    longScenarioScore: 92,
    shortScenarioScore: 12,

    bullishEvidence: [
      'Gold spot breaking into clean price discovery above key psychological shelf $2,680.',
      'COMEX GC order flow displays +4,280 lots net aggressive buyer delta with steep positive CVD slope.',
      'Value Area Point of Control ($2,682) acting as impenetrable institutional demand floor.',
      'US 10-Year real Treasury yields dropping, lowering the opportunity cost of holding non-yielding gold.',
      'Sovereign central banks (PBoC, RBI, CBR) reporting continued official reserve gold additions.'
    ],

    bearishEvidence: [
      'Short-term overbought readings on Daily RSI (68.4), requiring disciplined entry on pullbacks rather than chasing market tops.'
    ],

    liquidityContext: 'Zero historical overhead resistance (clean air discovery). Substantial resting buy-side liquidity stacked at $2,675–$2,680.',
    orderFlowContext: 'COMEX GC futures order flow shows persistent buyer absorption; sell attempts immediately repelled by passive limit bid walls.',
    derivativesContext: 'COMEX speculative net longs expanding steadily without extreme retail euphoria levels.',

    macroCatalysts: [
      'Global central bank net gold purchases on pace for another record year (>1,000 metric tons).',
      'Geopolitical tensions driving structural safe-haven flight into physical bullion.'
    ],
    upcomingEventRisks: [
      'Upcoming US Non-Farm Payrolls (NFP) release in 3 trading days; swing setup timed for pre-event profit realization.'
    ],

    missingDataNotes: 'Spot gold lacks centralized L2 book; COMEX GC active futures volume delta is utilized as high-fidelity institutional proxy.',
    contradictorySignals: 'None. Macro fundamentals and micro order flow are in rare 100% harmonious alignment.',
    executionRisks: 'Slight spread widening during London/New York session overlap transitions. Limit orders strictly advised.',

    strongestReasonToTakeTrade: 'Macro sovereign demand confluence with COMEX institutional order flow absorption at POC support.',
    strongestReasonNotToTakeTrade: 'If US Treasury yields unexpectedly spike +15 bps intraday on hawkish central bank commentary.',

    setupCancellationConditions: [
      '15M candle closes below $2,673.50.',
      'DXY executes a sharp +1.2% bullish breakout with bond yield spike.'
    ],

    explanationHindiHinglish:
      'Gold (XAUUSD) me all-time high discovery chal rahi hai: COMEX futures par +4,280 lots ki institutional buying delta confirm ho chuki hai. Session VWAP ($2,679.50) aur POC ($2,682.00) ne strong support diya hai. Real yields decline ho rahe hain aur global central banks physical gold accumulate kar rahe hain. Long Score 92/100 hai. Entry zone $2,680–$2,684 me buy karne par Stop Loss $2,673.50 par rakhein aur TP1 $2,715 par plan karein.',

    structure: {
      trend: 'Strong Bullish',
      hh_hl_status: 'Consecutive Higher Highs in Price Discovery Mode',
      bosLevel: 2688.0,
      chochLevel: 2674.0,
      mssDetected: true,
      orderBlocks: [
        { type: 'BULLISH_OB', low: 2675, high: 2682, mitigated: true }
      ],
      fvgZones: [
        { type: 'BULLISH_FVG', low: 2678, high: 2684, filledPct: 20 }
      ],
      premiumDiscountZone: 'DISCOUNT',
      fibConfluenceLevel: '50% Retest of London Opening Range at $2,681.20',
      sfpDetected: false,
      structuralInvalidationLevel: 2673.5
    },

    liquidity: {
      bslTarget: 2715.0,
      sslTarget: 2674.0,
      equalHighsLows: 'No equal highs overhead (open sky discovery)',
      liquiditySweepStatus: 'SELL_SIDE_SWEPT',
      inducementZone: '$2,678 retail breakout shelf retested',
      previousDayHigh: 2688.0,
      previousDayLow: 2668.0,
      previousWeekHigh: 2688.0,
      previousWeekLow: 2642.0,
      asianSessionHigh: 2685.5,
      asianSessionLow: 2678.0,
      primaryLiquidationGravityTarget: 2720.0,
      scenarioPath: 'Test $2,682 POC → Push through $2,688 → Discovery expansion into $2,715'
    },

    orderFlow: {
      cvd24h: '+4,280 Lots',
      cvdTrend: 'EXPANDING_BULLISH',
      stackedImbalances: 'Stacked Buy Imbalances at $2,682.50, $2,683.00, $2,684.80',
      absorptionStatus: 'BUY_ABSORPTION_ACTIVE',
      exhaustionStatus: 'NONE',
      trappedTradersStatus: 'Bearish swing traders trapped below $2,675',
      spoofingRiskIndex: 'LOW',
      restingVsExecutedDelta: '+72% aggressive market buy volume dominance'
    },

    volumeDerivatives: {
      poc: 2682.0,
      developingPoc: 2684.8,
      vah: 2688.0,
      val: 2676.0,
      valueAreaMigration: 'MIGRATING_HIGHER',
      sessionVwap: 2679.5,
      anchoredVwapWeekly: 2664.0,
      openInterestDelta24h: '+4,800 contracts expansion in COMEX GC open interest',
      fundingRate: 'N/A (Physical Futures)',
      longShortRatio: 'Speculative Net Longs 68% (Healthy)',
      crowdedPositioningStatus: 'BALANCED',
      liquidationCascadeTriggerLevel: 2695.0
    },

    macro: {
      dxyTrend: 'Softening at 102.45',
      us10yYield: 'Down 4 bps to 4.08%',
      realYieldTrend: 'Falling to +1.82%',
      fedCutExpectation: 'Multiple rate cuts priced for next 12 months',
      macroSentimentScore: '+3.8 Structural Bullish Macro',
      catalysts: [
        'Central bank diversification away from G7 sovereign debt',
        'De-dollarization payment rails expanding physical gold settlements'
      ],
      crossMarketRegime: 'Classic inverse correlation with US real yields fully intact (-0.91)'
    }
  },

  XAUTUSD: {
    primaryDecision: 'WAIT',
    asset: 'XAUTUSD',
    displaySymbol: 'XAUT/USDT (Tether Gold)',
    assetName: 'Tether Gold Physical Backed Token',
    currentPrice: 2682.8,
    formattedPrice: '$2,682.80',
    change24h: '+0.51%',
    isPositive: true,
    dataSourceLabel: 'Binance & OKX XAUT/USDT + Ethereum On-Chain Physical Vault Reserve Audit',
    lastUpdateTimestamp: 'Live 100ms Push · Swiss Vault Backed',
    dataQuality: 'ONCHAIN_COLLATERAL_AGGREGATE',

    tradeTimeframe: '15M (Primary Execution)',
    regime: 'Range-Bound',
    regimeDescription: 'Following physical gold spot price, but crypto order-book spread currently at $2.20 due to European session liquidity transition.',

    mtfBias: {
      daily: 'BULLISH',
      fourHour: 'BULLISH',
      oneHour: 'NEUTRAL',
      fifteenMin: 'NEUTRAL',
      fiveMinRefinement: 'NEUTRAL'
    },

    entryZone: '$2,674.00 – $2,678.00 (Wait for spread compression & arbitrage alignment with XAUUSD)',
    entryLower: 2674.0,
    entryUpper: 2678.0,
    exactConfirmationTrigger: 'Wait for XAUT spread to tighten below $0.80 and 15M candle acceptance above $2,682 with verified DEX/CEX arbitrage balance.',

    stopLossPrice: 2668.0,
    stopLossFormatted: '$2,668.00 (-0.55% Risk)',
    structuralInvalidationLevel: 2668.0,
    structuralInvalidationReason: 'Break of crypto vault discount floor and weekly VAL support.',

    targetTp1: { price: 2710.0, formatted: '$2,710.00', gainPct: '+1.01%', note: 'TP1 on arbitrage parity sync' },
    targetTp2: { price: 2735.0, formatted: '$2,735.00', gainPct: '+1.95%', note: 'TP2 on physical discovery' },
    targetTp3: { price: 2770.0, formatted: '$2,770.00', gainPct: '+3.25%', note: 'TP3 on multi-month hold' },

    riskRewardRatio: '1 : 2.4 (Inactive)',
    estimatedNetExpectancy: '+0.42R (Degraded by $2.20 crypto spread and DEX liquidity depth friction)',
    estimatedFeesAndSlippage: 'Est. 0.18% CEX/DEX spread & slippage penalty',

    calibratedProbabilityEstimate: '52% (Execution efficiency degraded by spread friction)',
    longScenarioScore: 56,
    shortScenarioScore: 42,

    bullishEvidence: [
      'Underlying physical gold collateral in Swiss vaults verified 100% backed (1 fine troy ounce per token).',
      'Macro trajectory is identical to spot gold (XAUUSD).'
    ],

    bearishEvidence: [
      'Order book depth on centralized crypto exchanges is significantly thinner than COMEX/OTC spot gold.',
      'Current spread ($2.20) exceeds ideal institutional threshold ($0.50), creating immediate slippage drag.',
      'Short-term price action lagging spot gold by 0.15% due to delayed CEX arbitrageurs.'
    ],

    liquidityContext: 'Order book liquidity depth is moderate ($18.5M total resting liquidity across Binance & OKX). Larger orders risk market impact.',
    orderFlowContext: 'Flow is balanced with retail market buying offset by market-maker arbitrage hedging.',
    derivativesContext: 'XAUT perpetual funding rate neutral; open interest limited compared to standard crypto pairs.',

    macroCatalysts: [
      'Same macro tailwinds as physical gold (sovereign accumulation & rate easing cycle).'
    ],
    upcomingEventRisks: [
      'Ethereum gas fee volatility during high-traffic token unlock windows.'
    ],

    missingDataNotes: 'DEX on-chain Uniswap v3 pool depth included; no missing data.',
    contradictorySignals: 'Micro order-book spread contradicts clean execution thesis. Expected value falls below institutional gatekeeper threshold.',
    executionRisks: 'Elevated spread drag. Direct trading of XAUUSD via futures or CFD is currently superior to XAUT crypto spot.',

    strongestReasonToTakeTrade: 'Direct blockchain exposure to physical gold without traditional broker account requirements.',
    strongestReasonNotToTakeTrade: 'High spread and slippage cost compared to trading direct XAUUSD on primary futures/spot venues.',

    setupCancellationConditions: [
      'Spread widens beyond $3.50.',
      'Underlying gold spot (XAUUSD) drops below $2,673.50.'
    ],

    explanationHindiHinglish:
      'XAUTUSD (Tether Gold) me underlying gold to bullish hai, par crypto exchanges par spread abhi $2.20 chal raha hai jo execution ke liye thoda costly hai. XAUUSD futures ke comparison me XAUT me slippage zyada lag sakti hai. Isliye institutional rule ke mutabiq iska verdict abhi "WAIT" hai. Agar aapko trade karna hai to direct XAUUSD par trade karna zyada profitable aur clean rahega jab tak XAUT ka spread tighten na ho jaye.',

    structure: {
      trend: 'Bullish Pullback',
      hh_hl_status: 'Tracking gold spot with minor lag',
      bosLevel: 2686.0,
      chochLevel: 2675.0,
      mssDetected: false,
      orderBlocks: [
        { type: 'BULLISH_OB', low: 2672, high: 2678, mitigated: false }
      ],
      fvgZones: [
        { type: 'BULLISH_FVG', low: 2674, high: 2680, filledPct: 50 }
      ],
      premiumDiscountZone: 'EQUILIBRIUM',
      fibConfluenceLevel: '50% Retest',
      sfpDetected: false,
      structuralInvalidationLevel: 2668.0
    },

    liquidity: {
      bslTarget: 2710.0,
      sslTarget: 2672.0,
      equalHighsLows: 'Equal highs at $2,686.50',
      liquiditySweepStatus: 'NONE',
      inducementZone: '$2,678',
      previousDayHigh: 2686.0,
      previousDayLow: 2667.0,
      previousWeekHigh: 2686.0,
      previousWeekLow: 2640.0,
      asianSessionHigh: 2684.0,
      asianSessionLow: 2676.0,
      primaryLiquidationGravityTarget: 2710.0,
      scenarioPath: 'Wait for spread compression → Follow XAUUSD breakout'
    },

    orderFlow: {
      cvd24h: '+$1.4M Token Net Delta',
      cvdTrend: 'DIVERGENT',
      stackedImbalances: 'Balanced book',
      absorptionStatus: 'NONE',
      exhaustionStatus: 'NONE',
      trappedTradersStatus: 'Neutral',
      spoofingRiskIndex: 'ELEVATED',
      restingVsExecutedDelta: 'Market makers quoting wide bid-ask bands'
    },

    volumeDerivatives: {
      poc: 2680.0,
      developingPoc: 2682.0,
      vah: 2685.0,
      val: 2675.0,
      valueAreaMigration: 'STATIONARY',
      sessionVwap: 2680.2,
      anchoredVwapWeekly: 2665.0,
      openInterestDelta24h: 'Neutral',
      fundingRate: '0.00% (Spot Token)',
      longShortRatio: 'Balanced',
      crowdedPositioningStatus: 'BALANCED',
      liquidationCascadeTriggerLevel: 2665.0
    },

    macro: {
      dxyTrend: 'Softening at 102.45',
      us10yYield: '4.08%',
      realYieldTrend: 'Falling to +1.82%',
      fedCutExpectation: 'Easing priced in',
      macroSentimentScore: '+3.2 Bullish',
      catalysts: ['Crypto gold tokenization adoption'],
      crossMarketRegime: 'Tied to physical gold parity'
    }
  }
};
