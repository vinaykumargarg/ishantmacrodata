/**
 * Deeepr.ai Trading Intelligence Data Engine
 * Models single decisive verdict per asset: LONG, SHORT, or WAIT for 1-2 Days Hold Trader.
 * Features:
 * - TradingView direct connectivity with 15M, 1H, 4H, 1D timeframes
 * - Activation Trigger level & conditions
 * - High Liquidation Clusters & Heatmap zones
 * - High Whale Entry Zones & Iceberg absorption walls
 * - Order flow Price Ladder (Sell walls, Buy walls, Liq zones, Swing S/R)
 * - 4-Lane Reconciliation (Technical, Flow, Narrative, Macro)
 * Strict Rule: When lanes disagree, verdict is strictly WAIT.
 */

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  cvdDelta: number; // positive = market buy aggressor, negative = market sell aggressor
}

export interface LiquidationCluster {
  type: 'SHORT_SQUEEZE' | 'LONG_CASCADE';
  priceLevel: number;
  volumeUsdMillions: number;
  leverageType: string;
  intensity: 'EXTREME' | 'HIGH' | 'MODERATE';
  distancePct: number;
}

export interface WhaleWall {
  type: 'ICEBERG_BID' | 'ICEBERG_ASK';
  priceLevel: number;
  assetVolume: number;
  usdMillions: number;
  exchange: string;
  absorptionRatePct: number;
}

export interface PriceLadderLevel {
  id: string;
  type: 'WHALE_WALL' | 'LIQUIDATION_SHORT' | 'LIQUIDATION_LONG' | 'RESISTANCE' | 'SUPPORT' | 'CURRENT_PRICE' | 'ALERT' | 'TARGET_TP' | 'STOP_LOSS' | 'OPTIMAL_ENTRY';
  label: string;
  volumeUsd?: string;
  volume?: string;
  price: number;
  formattedPrice: string;
  color: string;
  badgeBg?: string;
  badgeTextColor?: string;
}

export interface LaneTelemetry {
  name: string;
  icon: string;
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -100 to +100
  weight: number;
  impactLevel: 'LOW' | 'MODERATE' | 'HIGH';
  headline: string;
  bullets: string[];
}

export interface DeeeprAssetSetup {
  symbol: string;
  displaySymbol: string;
  name: string;
  category: 'Crypto' | 'Commodity' | 'Equity';
  tradingViewSymbol: string;
  currentPrice: number;
  priceFormatted: string;
  change24h: string;
  isPositive: boolean;
  volume24h: string;
  
  // Position Analysis Header
  rsi14: number;
  regime: 'TRENDING UP' | 'TRENDING DOWN' | 'CHOP / ACCUMULATION' | 'VOLATILITY SQUEEZE';
  regimeColor: string;
  laneAgreementFraction: string;
  
  // Decisive Verdict
  verdict: 'LONG' | 'SHORT' | 'WAIT';
  holdDuration: '1–2 Days Hold Trader';
  confidencePct: number;
  status: 'ACTIVATED' | 'PENDING_ACTIVATION' | 'WAITING_RECONCILIATION';
  setupSummary: string;
  
  // Invalidation Rules (Exact Deeepr Invalidation Section)
  invalidationRules: string[];
  
  // Execution Levels
  activationTrigger: {
    price: number;
    priceFormatted: string;
    conditionText: string;
    isTriggered: boolean;
  };
  optimalEntry: {
    price: number;
    priceFormatted: string;
    type: 'LIMIT_PULLBACK' | 'BREAKOUT_RETEST' | 'MARKET_MOMENTUM';
  };
  stopLoss: {
    price: number;
    priceFormatted: string;
    riskPct: string;
    invalidationReason: string;
  };
  targets: {
    tp1: { price: number; priceFormatted: string; gainPct: string; sizePct: string };
    tp2: { price: number; priceFormatted: string; gainPct: string; sizePct: string };
    tp3: { price: number; priceFormatted: string; gainPct: string; sizePct: string };
  };
  riskRewardRatio: string;
  
  // Right Axis Price Ladder Overlay (Whale walls, Liq zones, Swing S/R)
  priceLadder: PriceLadderLevel[];
  
  // Order Flow & Liquidation Telemetry
  liquidationClusters: LiquidationCluster[];
  whaleWalls: WhaleWall[];
  marketOrderFlow: {
    cvd24hUsdMillions: number;
    cvdFormatted: string;
    aggressiveBuyPct: number;
    aggressiveSellPct: number;
    orderFlowWorkVerdict: string;
    absorptionStatus: string;
  };
  
  // 4-Lane Reconciliation Engine (Technical, Flow, Narrative, Macro)
  lanes: {
    technical: LaneTelemetry;
    flow: LaneTelemetry;
    narrative: LaneTelemetry;
    macro: LaneTelemetry;
  };
  reconciliationSummary: string;
  
  // Key Drivers (News & Catalyst wire)
  keyDrivers: string[];
  
  // Historical Candles
  candles: Candle[];
}

export const DEEEPR_ASSETS_DATA: Record<string, DeeeprAssetSetup> = {
  BTC: {
    symbol: 'BTC',
    displaySymbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:BTCUSDT',
    currentPrice: 82862,
    priceFormatted: '$82,862',
    change24h: '-0.97%',
    isPositive: false,
    volume24h: '$41.8B',
    rsi14: 41.8,
    regime: 'TRENDING DOWN',
    regimeColor: '#f43f5e',
    laneAgreementFraction: '4/4 LANES',
    verdict: 'SHORT',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 92,
    status: 'ACTIVATED',
    setupSummary: 'Rejection from $84,590 supply block confirmed. -1,672 pt cascade broken below $83,000 support, targeting liquidity floor.',
    
    invalidationRules: [
      '1h close above $84,590 supply ceiling',
      'Sudden positive taker CVD surge exceeding +2,000 BTC',
      'RSI climbs back above 58 on 1h timeframe'
    ],
    
    activationTrigger: {
      price: 84550,
      priceFormatted: '$84,550',
      conditionText: '⚡ SFP Short Trigger: Rejection at $84,590 resistance with negative CVD delta cascade',
      isTriggered: true
    },
    optimalEntry: {
      price: 84550,
      priceFormatted: '$84,550',
      type: 'BREAKOUT_RETEST'
    },
    stopLoss: {
      price: 84650,
      priceFormatted: '$84,650',
      riskPct: '+0.12% (Tight Invalidation)',
      invalidationReason: 'Strict invalidation above $84,590 supply ceiling'
    },
    targets: {
      tp1: { price: 82400, priceFormatted: '$82,400', gainPct: '+2.54%', sizePct: '50% position' },
      tp2: { price: 81800, priceFormatted: '$81,800', gainPct: '+3.25%', sizePct: '30% position' },
      tp3: { price: 80850, priceFormatted: '$80,850', gainPct: '+4.37%', sizePct: '20% runner' }
    },
    riskRewardRatio: '1 : 12.8',
    
    priceLadder: [
      { id: 'l1', type: 'WHALE_WALL', label: 'Sell wall', volume: '$5.2M', price: 86000.0, formattedPrice: '86000.00', color: '#eab308' },
      { id: 'l2', type: 'LIQUIDATION_SHORT', label: 'Liq Short', volume: '$43.9M', price: 84961.85, formattedPrice: '84961.85', color: '#f43f5e' },
      { id: 'l3', type: 'WHALE_WALL', label: 'Sell wall', volume: '$37.7M', price: 84949.0, formattedPrice: '84949.00', color: '#eab308' },
      { id: 'l4', type: 'LIQUIDATION_SHORT', label: 'Liq Short', volume: '$9.7M', price: 84319.45, formattedPrice: '84319.45', color: '#f43f5e' },
      { id: 'l5', type: 'RESISTANCE', label: 'R', volume: '', price: 84294.78, formattedPrice: '84294.78', color: '#64748b' },
      { id: 'l6', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 82374.0, formattedPrice: '82374.00', color: '#10b981' },
      { id: 'l7', type: 'LIQUIDATION_LONG', label: 'Liq Long', volume: '$10.4M', price: 82158.86, formattedPrice: '82158.86', color: '#10b981' },
      { id: 'l8', type: 'SUPPORT', label: 'S', volume: '', price: 81878.36, formattedPrice: '81878.36', color: '#64748b' },
      { id: 'l9', type: 'LIQUIDATION_LONG', label: 'Liq Long', volume: '$4.3M', price: 81516.46, formattedPrice: '81516.46', color: '#10b981' },
      { id: 'l10', type: 'SUPPORT', label: 'S', volume: '', price: 80850.0, formattedPrice: '80850.00', color: '#64748b' }
    ],
    
    liquidationClusters: [
      {
        type: 'SHORT_SQUEEZE',
        priceLevel: 84600,
        volumeUsdMillions: 142.8,
        leverageType: '50x-100x Short Leverage Clustered',
        intensity: 'EXTREME',
        distancePct: 2.7
      },
      {
        type: 'SHORT_SQUEEZE',
        priceLevel: 86450,
        volumeUsdMillions: 88.5,
        leverageType: '25x Short Stops',
        intensity: 'HIGH',
        distancePct: 4.95
      },
      {
        type: 'LONG_CASCADE',
        priceLevel: 80600,
        volumeUsdMillions: 62.4,
        leverageType: 'Long Leverage Liquidation Floor',
        intensity: 'MODERATE',
        distancePct: -2.15
      }
    ],
    
    whaleWalls: [
      {
        type: 'ICEBERG_BID',
        priceLevel: 81900,
        assetVolume: 2450,
        usdMillions: 201.8,
        exchange: 'Binance & Coinbase Pro',
        absorptionRatePct: 91
      },
      {
        type: 'ICEBERG_ASK',
        priceLevel: 84949,
        assetVolume: 445,
        usdMillions: 37.7,
        exchange: 'Binance & Bybit',
        absorptionRatePct: 42
      }
    ],
    
    marketOrderFlow: {
      cvd24hUsdMillions: 64.2,
      cvdFormatted: '+$64.2M (Bullish Aggressor)',
      aggressiveBuyPct: 61.4,
      aggressiveSellPct: 38.6,
      orderFlowWorkVerdict: 'Aggressive market buyers successfully absorbing passive offers without slippage',
      absorptionStatus: 'Heavy market selling at $81,900 was completely absorbed by institutional limit bids'
    },
    
    lanes: {
      technical: {
        name: 'TECHNICAL',
        icon: '📐',
        status: 'BULLISH',
        score: 15,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'EMA stack bullish; price holding firmly above 50 and 200 EMA on 1H timeframe',
        bullets: [
          'EMA 21/50 golden cross intact with upward slope',
          'Price above 50 and 200 EMAs on 1H chart',
          'RSI 54.3 in ideal expansion zone without overbought exhaustion'
        ]
      },
      narrative: {
        name: 'NARRATIVE',
        icon: '📰',
        status: 'BULLISH',
        score: 48,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'Multiple bullish catalysts; positive institutional sentiment dominating social flow',
        bullets: [
          'Spot ETF continuous net daily inflows surpassing $340M',
          'Macro disinflation broadening across G7 central banks',
          'Regulatory clarity discussions advancing favorably'
        ]
      },
      flow: {
        name: 'FLOW',
        icon: '🌊',
        status: 'BULLISH',
        score: 3,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'Funding rate negative; short liquidations stacked overhead creating upward vacuum',
        bullets: [
          'Funding rate negative (-0.004%); shorts paying longs to stay short',
          'Short liquidations pending at $84,961 ($43.9M cluster)',
          'Taker buy volume exceeding taker sell on derivatives tape'
        ]
      },
      macro: {
        name: 'MACRO',
        icon: '🌐',
        status: 'BULLISH',
        score: 30,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Extreme Fear is fading; DXY soft, US 10Y yields cooling, zero explicit risk-off shocks',
        bullets: [
          'Fear & Greed index normalizing from 19 to 52',
          'DXY consolidating below 103 resistance',
          'No immediate geopolitical escalation shocks on institutional wires'
        ]
      }
    },
    reconciliationSummary: 'All 4 lanes (Technical, Narrative, Flow, Macro) agree on the long side. Validated for 1-2 Days Hold.',
    
    keyDrivers: [
      'Ripple CEO Slams JPMorgan for "Misrepresenting" the CLARITY Act on Institutional TV',
      'US Spot Bitcoin ETFs Record 8th Consecutive Day of Inflows ($342M aggregate)',
      'Hashrate reaches new historic high (892 EH/s), reinforcing network mining security'
    ],
    
    candles: [
      { time: '02:00', open: 81200, high: 81450, low: 81100, close: 81380, volume: 1420, cvdDelta: 12.4 },
      { time: '04:00', open: 81380, high: 81600, low: 81290, close: 81520, volume: 1680, cvdDelta: 18.2 },
      { time: '06:00', open: 81520, high: 81850, low: 81480, close: 81790, volume: 2100, cvdDelta: 24.5 },
      { time: '08:00', open: 81790, high: 82100, low: 81650, close: 81920, volume: 2450, cvdDelta: 14.1 },
      { time: '10:00', open: 81920, high: 82250, low: 81820, close: 82110, volume: 2890, cvdDelta: 31.6 },
      { time: '12:00', open: 82110, high: 82050, low: 81750, close: 81880, volume: 1980, cvdDelta: -14.2 },
      { time: '14:00', open: 81880, high: 82200, low: 81850, close: 82140, volume: 2640, cvdDelta: 28.9 },
      { time: '16:00', open: 82140, high: 82450, low: 82080, close: 82310, volume: 3120, cvdDelta: 42.1 },
      { time: '18:00', open: 82310, high: 82550, low: 82220, close: 82420, volume: 3450, cvdDelta: 51.4 },
      { time: '20:00', open: 82420, high: 82600, low: 82280, close: 82374, volume: 2980, cvdDelta: 38.2 }
    ]
  },

  ETH: {
    symbol: 'ETH',
    displaySymbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:ETHUSDT',
    currentPrice: 2535,
    priceFormatted: '$2,535',
    change24h: '+3.45%',
    isPositive: true,
    volume24h: '$18.4B',
    rsi14: 49.2,
    regime: 'CHOP / ACCUMULATION',
    regimeColor: '#38bdf8',
    laneAgreementFraction: '0/4 LANES',
    verdict: 'WAIT',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 54,
    status: 'WAITING_RECONCILIATION',
    setupSummary: 'Bullish flow and narrative support technical bounce from support near $2,480, but heavy whale ask walls and downward liquidation gravity create conflicting signals.',
    
    invalidationRules: [
      '1h close below $2,420 (major structural long liquidation shelf)',
      'Funding rate spikes positive above +0.015%',
      'RSI drops below 40 on 1h timeframe'
    ],
    
    activationTrigger: {
      price: 2585,
      priceFormatted: '$2,585',
      conditionText: 'Wait for 4H candle acceptance above $2,585 Whale Ask wall before activating LONG',
      isTriggered: false
    },
    optimalEntry: {
      price: 2440,
      priceFormatted: '$2,440',
      type: 'LIMIT_PULLBACK'
    },
    stopLoss: {
      price: 2360,
      priceFormatted: '$2,360',
      riskPct: '-3.28%',
      invalidationReason: 'Invalidates if price flushes below the $2,380 weekly swing low'
    },
    targets: {
      tp1: { price: 2680, priceFormatted: '$2,680', gainPct: '+5.72%', sizePct: '50% position' },
      tp2: { price: 2790, priceFormatted: '$2,790', gainPct: '+10.05%', sizePct: '30% position' },
      tp3: { price: 2950, priceFormatted: '$2,950', gainPct: '+16.37%', sizePct: '20% runner' }
    },
    riskRewardRatio: '1 : 2.9 (Inactive)',
    
    priceLadder: [
      { id: 'e1', type: 'WHALE_WALL', label: 'Sell wall', volume: '$82.5M', price: 2580.0, formattedPrice: '2580.00', color: '#eab308' },
      { id: 'e2', type: 'LIQUIDATION_SHORT', label: 'Liq Short', volume: '$46.2M', price: 2595.0, formattedPrice: '2595.00', color: '#f43f5e' },
      { id: 'e3', type: 'RESISTANCE', label: 'R', volume: '', price: 2560.0, formattedPrice: '2560.00', color: '#64748b' },
      { id: 'e4', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 2535.0, formattedPrice: '2535.00', color: '#10b981' },
      { id: 'e5', type: 'SUPPORT', label: 'S', volume: '', price: 2480.0, formattedPrice: '2480.00', color: '#64748b' },
      { id: 'e6', type: 'LIQUIDATION_LONG', label: 'Liq Long', volume: '$112.5M', price: 2420.0, formattedPrice: '2420.00', color: '#f43f5e' },
      { id: 'e7', type: 'SUPPORT', label: 'S', volume: '', price: 2380.0, formattedPrice: '2380.00', color: '#64748b' }
    ],
    
    liquidationClusters: [
      {
        type: 'LONG_CASCADE',
        priceLevel: 2420,
        volumeUsdMillions: 112.5,
        leverageType: 'Over-leveraged Long Stop Cascade Zone',
        intensity: 'EXTREME',
        distancePct: -4.54
      }
    ],
    
    whaleWalls: [
      {
        type: 'ICEBERG_ASK',
        priceLevel: 2580,
        assetVolume: 32000,
        usdMillions: 82.5,
        exchange: 'Binance & Bybit',
        absorptionRatePct: 42
      }
    ],
    
    marketOrderFlow: {
      cvd24hUsdMillions: -8.4,
      cvdFormatted: '-$8.4M (Seller Divergence)',
      aggressiveBuyPct: 48.2,
      aggressiveSellPct: 51.8,
      orderFlowWorkVerdict: 'Market order CVD is diverging negatively despite price push',
      absorptionStatus: 'Aggressive retail buyers are being capped into whale ask limits at $2,580'
    },
    
    lanes: {
      technical: {
        name: 'TECHNICAL',
        icon: '📐',
        status: 'BULLISH',
        score: 12,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Holding above 200 EMA on 1H chart with rising short-term momentum',
        bullets: ['Price testing EMA-50 resistance', 'Bullish divergence forming on 30m chart']
      },
      narrative: {
        name: 'NARRATIVE',
        icon: '📰',
        status: 'NEUTRAL',
        score: 0,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'L2 activity booming, but Ethereum mainnet gas revenue remaining muted',
        bullets: ['Layer 2 TVL at all-time high', 'Mainnet fee burn subdued']
      },
      flow: {
        name: 'FLOW',
        icon: '🌊',
        status: 'BEARISH',
        score: -42,
        weight: 0.25,
        impactLevel: 'HIGH',
        headline: 'Heavy $82.5M Whale iceberg ask wall capping upside at $2,580',
        bullets: ['Smart money limit orders heavily skewed lower toward $2,420', 'Open interest rising without spot volume backing']
      },
      macro: {
        name: 'MACRO',
        icon: '🌐',
        status: 'NEUTRAL',
        score: 5,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Global risk sentiment neutral for smart-contract alt-layer ecosystems',
        bullets: ['Broad market waiting for FOMC rate trajectory guidance', 'BTC dominance absorbing lion share of crypto liquidity']
      }
    },
    reconciliationSummary: 'Lanes conflict: Technical is Bullish while Flow & Liquidation are Bearish. Deeepr rule enforced: STRICTLY WAIT.',
    
    keyDrivers: [
      'Vitalik Buterin outlines "The Surge" roadmap for L2 interoperability standards',
      'Ethereum Spot ETFs record mild outflows (-$14.2M) as Grayscale continues redemptions',
      'Staking deposit queue holds steady with 34.2M ETH locked in validators'
    ],
    
    candles: [
      { time: '02:00', open: 2460, high: 2478, low: 2452, close: 2472, volume: 8400, cvdDelta: 4.1 },
      { time: '04:00', open: 2472, high: 2495, low: 2468, close: 2490, volume: 9200, cvdDelta: 5.6 },
      { time: '06:00', open: 2490, high: 2515, low: 2482, close: 2508, volume: 11400, cvdDelta: 8.2 },
      { time: '08:00', open: 2508, high: 2530, low: 2500, close: 2522, volume: 12800, cvdDelta: 3.4 },
      { time: '10:00', open: 2522, high: 2548, low: 2518, close: 2542, volume: 14200, cvdDelta: -2.1 },
      { time: '12:00', open: 2542, high: 2555, low: 2528, close: 2532, volume: 10800, cvdDelta: -6.4 },
      { time: '14:00', open: 2532, high: 2546, low: 2520, close: 2528, volume: 9800, cvdDelta: -4.8 },
      { time: '16:00', open: 2528, high: 2550, low: 2524, close: 2545, volume: 11200, cvdDelta: 2.1 },
      { time: '18:00', open: 2545, high: 2560, low: 2530, close: 2538, volume: 10400, cvdDelta: -3.5 },
      { time: '20:00', open: 2538, high: 2545, low: 2528, close: 2535, volume: 8900, cvdDelta: -1.2 }
    ]
  },

  SOL: {
    symbol: 'SOL',
    displaySymbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:SOLUSDT',
    currentPrice: 112.99,
    priceFormatted: '$112.99',
    change24h: '+2.88%',
    isPositive: true,
    volume24h: '$4.2B',
    rsi14: 59.4,
    regime: 'TRENDING UP',
    regimeColor: '#eab308',
    laneAgreementFraction: '4/4 LANES',
    verdict: 'LONG',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 82,
    status: 'ACTIVATED',
    setupSummary: 'Whale bids front-running $110 demand zone with aggressive market order buy volume. High liquidation cluster at $121 offers a pristine 1:3.6 swing target.',
    
    invalidationRules: [
      '1h close below $108.40 (local consolidation support)',
      'Funding rate climbs above +0.02%',
      'RSI drops below 48 on 1h timeframe'
    ],
    
    activationTrigger: {
      price: 111.80,
      priceFormatted: '$111.80',
      conditionText: 'Triggers on retest of $111.80 ascending trendline with CVD positive tick',
      isTriggered: true
    },
    optimalEntry: {
      price: 112.50,
      priceFormatted: '$112.50',
      type: 'MARKET_MOMENTUM'
    },
    stopLoss: {
      price: 108.40,
      priceFormatted: '$108.40',
      riskPct: '-3.64%',
      invalidationReason: 'Breach of $108.40 local consolidation low and EMA-50 support'
    },
    targets: {
      tp1: { price: 118.50, priceFormatted: '$118.50', gainPct: '+5.33%', sizePct: '50% position' },
      tp2: { price: 122.80, priceFormatted: '$122.80', gainPct: '+9.16%', sizePct: '30% position' },
      tp3: { price: 128.00, priceFormatted: '$128.00', gainPct: '+13.78%', sizePct: '20% runner' }
    },
    riskRewardRatio: '1 : 3.6',
    
    priceLadder: [
      { id: 's1', type: 'LIQUIDATION_SHORT', label: 'Liq Short', volume: '$48.7M', price: 121.50, formattedPrice: '121.50', color: '#f43f5e' },
      { id: 's2', type: 'WHALE_WALL', label: 'Sell wall', volume: '$12.4M', price: 118.00, formattedPrice: '118.00', color: '#eab308' },
      { id: 's3', type: 'RESISTANCE', label: 'R', volume: '', price: 115.20, formattedPrice: '115.20', color: '#64748b' },
      { id: 's4', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 112.99, formattedPrice: '112.99', color: '#10b981' },
      { id: 's5', type: 'WHALE_WALL', label: 'Buy wall', volume: '$46.4M', price: 110.50, formattedPrice: '110.50', color: '#eab308' },
      { id: 's6', type: 'SUPPORT', label: 'S', volume: '', price: 108.40, formattedPrice: '108.40', color: '#64748b' }
    ],
    
    liquidationClusters: [
      {
        type: 'SHORT_SQUEEZE',
        priceLevel: 121.50,
        volumeUsdMillions: 48.7,
        leverageType: 'Short Liquidation Magnet',
        intensity: 'HIGH',
        distancePct: 7.53
      }
    ],
    
    whaleWalls: [
      {
        type: 'ICEBERG_BID',
        priceLevel: 110.50,
        assetVolume: 420000,
        usdMillions: 46.4,
        exchange: 'Binance & Bybit',
        absorptionRatePct: 86
      }
    ],
    
    marketOrderFlow: {
      cvd24hUsdMillions: 18.6,
      cvdFormatted: '+$18.6M (Market Buyer Lead)',
      aggressiveBuyPct: 59.2,
      aggressiveSellPct: 40.8,
      orderFlowWorkVerdict: 'Aggressive market orders expanding on each 15m breakout bar',
      absorptionStatus: 'Clean trend continuation without passive resistance exhaustion'
    },
    
    lanes: {
      technical: {
        name: 'TECHNICAL',
        icon: '📐',
        status: 'BULLISH',
        score: 24,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'Ascending triangle breakout on 4H chart with high volume',
        bullets: ['RSI 59.4 with clean room to expand', 'Supertrend flipped green on 1H timeframe']
      },
      narrative: {
        name: 'NARRATIVE',
        icon: '📰',
        status: 'BULLISH',
        score: 36,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'Solana DEX volume surpasses multi-chain competition; validator upgrades live',
        bullets: ['Firedancer testnet throughput hits record TPS', 'Stablecoin market cap on Solana expands +8.4%']
      },
      flow: {
        name: 'FLOW',
        icon: '🌊',
        status: 'BULLISH',
        score: 22,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: '$46.4M Whale support wall stacked at $110.50',
        bullets: ['TWAP accumulation detected in morning hours', 'Whale sell orders thin above $115']
      },
      macro: {
        name: 'MACRO',
        icon: '🌐',
        status: 'BULLISH',
        score: 18,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'High-beta momentum appetite elevated across retail and hedge fund flow',
        bullets: ['Altcoin beta appetite strong', 'No correlation breakdowns']
      }
    },
    reconciliationSummary: 'All 4 lanes aligned BULLISH. Solid 1-2 Day LONG setup active.',
    
    keyDrivers: [
      'Solana DEX weekly volume leads all Layer 1 blockchains at $12.4B',
      'Jump Crypto Firedancer client milestone updates successfully deployed on testnet',
      'PayPal USD (PYUSD) supply expansion on Solana accelerates by 15%'
    ],
    
    candles: [
      { time: '02:00', open: 109.2, high: 110.1, low: 108.8, close: 109.8, volume: 18400, cvdDelta: 2.1 },
      { time: '04:00', open: 109.8, high: 110.5, low: 109.4, close: 110.2, volume: 21200, cvdDelta: 3.4 },
      { time: '06:00', open: 110.2, high: 111.4, low: 110.0, close: 111.0, volume: 26800, cvdDelta: 5.2 },
      { time: '08:00', open: 111.0, high: 112.2, low: 110.7, close: 111.8, volume: 31200, cvdDelta: 7.8 },
      { time: '10:00', open: 111.8, high: 113.1, low: 111.5, close: 112.4, volume: 34500, cvdDelta: 9.6 },
      { time: '12:00', open: 112.4, high: 112.9, low: 111.9, close: 112.2, volume: 24500, cvdDelta: -1.2 },
      { time: '14:00', open: 112.2, high: 113.2, low: 112.0, close: 112.8, volume: 29800, cvdDelta: 6.4 },
      { time: '16:00', open: 112.8, high: 113.5, low: 112.4, close: 113.1, volume: 33400, cvdDelta: 8.1 },
      { time: '18:00', open: 113.1, high: 113.6, low: 112.7, close: 113.2, volume: 28900, cvdDelta: 4.5 },
      { time: '20:00', open: 113.2, high: 113.4, low: 112.6, close: 112.99, volume: 24200, cvdDelta: 2.3 }
    ]
  },

  BNB: {
    symbol: 'BNB',
    displaySymbol: 'BNB/USDT',
    name: 'BNB',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:BNBUSDT',
    currentPrice: 761.51,
    priceFormatted: '$761.51',
    change24h: '+1.35%',
    isPositive: true,
    volume24h: '$1.8B',
    rsi14: 62.1,
    regime: 'TRENDING UP',
    regimeColor: '#eab308',
    laneAgreementFraction: '0/4 LANES',
    verdict: 'WAIT',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 58,
    status: 'WAITING_RECONCILIATION',
    setupSummary: 'Price near historical highs at $765 resistance. Whale ask wall detected at $775. High risk of mean-reversion chop. Strictly WAIT for cleaner entry.',
    
    invalidationRules: [
      '1h close below $745.00 support shelf',
      'RSI drops below 50 on 1h'
    ],
    
    activationTrigger: {
      price: 775.00,
      priceFormatted: '$775.00',
      conditionText: 'Wait for 4H candle acceptance above $775 all-time high resistance',
      isTriggered: false
    },
    optimalEntry: {
      price: 742.00,
      priceFormatted: '$742.00',
      type: 'LIMIT_PULLBACK'
    },
    stopLoss: {
      price: 724.00,
      priceFormatted: '$724.00',
      riskPct: '-2.42%',
      invalidationReason: 'Invalidates if price breaks 200 EMA support'
    },
    targets: {
      tp1: { price: 795.00, priceFormatted: '$795.00', gainPct: '+4.39%', sizePct: '50% position' },
      tp2: { price: 825.00, priceFormatted: '$825.00', gainPct: '+8.33%', sizePct: '30% position' },
      tp3: { price: 860.00, priceFormatted: '$860.00', gainPct: '+12.93%', sizePct: '20% runner' }
    },
    riskRewardRatio: '1 : 3.1 (Inactive)',
    
    priceLadder: [
      { id: 'b1', type: 'WHALE_WALL', label: 'Sell wall', volume: '$18.5M', price: 775.0, formattedPrice: '775.00', color: '#eab308' },
      { id: 'b2', type: 'RESISTANCE', label: 'R', volume: '', price: 765.0, formattedPrice: '765.00', color: '#64748b' },
      { id: 'b3', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 761.51, formattedPrice: '761.51', color: '#10b981' },
      { id: 'b4', type: 'SUPPORT', label: 'S', volume: '', price: 745.0, formattedPrice: '745.00', color: '#64748b' },
      { id: 'b5', type: 'LIQUIDATION_LONG', label: 'Liq Long', volume: '$14.2M', price: 738.0, formattedPrice: '738.00', color: '#10b981' }
    ],
    
    liquidationClusters: [],
    whaleWalls: [],
    marketOrderFlow: {
      cvd24hUsdMillions: 4.2,
      cvdFormatted: '+$4.2M',
      aggressiveBuyPct: 51.5,
      aggressiveSellPct: 48.5,
      orderFlowWorkVerdict: 'Flow balanced; awaiting direction breakout',
      absorptionStatus: 'Normal depth'
    },
    
    lanes: {
      technical: {
        name: 'TECHNICAL',
        icon: '📐',
        status: 'BULLISH',
        score: 18,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Consolidating near record highs',
        bullets: ['Price above 20 EMA', 'Momentum cooling off']
      },
      narrative: {
        name: 'NARRATIVE',
        icon: '📰',
        status: 'NEUTRAL',
        score: 0,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Launchpool token distributions underway',
        bullets: ['Ecosystem participation high']
      },
      flow: {
        name: 'FLOW',
        icon: '🌊',
        status: 'BEARISH',
        score: -28,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'Whale ask iceberg stacking at $775 ceiling',
        bullets: ['Passive sellers absorbing upward bids']
      },
      macro: {
        name: 'MACRO',
        icon: '🌐',
        status: 'NEUTRAL',
        score: 5,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Exchange token volume steady',
        bullets: ['No idiosyncratic regulatory friction']
      }
    },
    reconciliationSummary: 'Lanes in conflict at resistance. Verdict is strictly WAIT.',
    keyDrivers: ['BNB Chain quarterly auto-burn completed ($450M value equivalent)'],
    candles: []
  },

  XRP: {
    symbol: 'XRP',
    displaySymbol: 'XRP/USDT',
    name: 'XRP',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:XRPUSDT',
    currentPrice: 1.39,
    priceFormatted: '$1.3900',
    change24h: '+1.45%',
    isPositive: true,
    volume24h: '$2.1B',
    rsi14: 64.8,
    regime: 'TRENDING DOWN',
    regimeColor: '#f43f5e',
    laneAgreementFraction: '4/4 LANES',
    verdict: 'SHORT',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 78,
    status: 'ACTIVATED',
    setupSummary: 'Whale distribution detected at $1.42 resistance. Aggressive market sell orders expanding on CVD while $38.5M long liquidation cascade sits below at $1.29. Confluence favors 1-2 day swing SHORT.',
    
    invalidationRules: [
      '1h close above $1.4350 (key swing high and whale ask block)',
      'Funding rate turns heavily negative below -0.02%',
      'RSI reclaims 70 on 1h timeframe'
    ],
    
    activationTrigger: {
      price: 1.402,
      priceFormatted: '$1.4020',
      conditionText: 'Triggers on rejection below $1.4020 with negative 15m CVD delta acceleration',
      isTriggered: true
    },
    optimalEntry: {
      price: 1.395,
      priceFormatted: '$1.3950',
      type: 'LIMIT_PULLBACK'
    },
    stopLoss: {
      price: 1.435,
      priceFormatted: '$1.4350',
      riskPct: '+2.87%',
      invalidationReason: 'Breach of $1.4350 key swing high and whale sell iceberg wall'
    },
    targets: {
      tp1: { price: 1.335, priceFormatted: '$1.3350', gainPct: '+4.30%', sizePct: '50% position' },
      tp2: { price: 1.290, priceFormatted: '$1.2900', gainPct: '+7.53%', sizePct: '30% position' },
      tp3: { price: 1.240, priceFormatted: '$1.2400', gainPct: '+11.11%', sizePct: '20% runner' }
    },
    riskRewardRatio: '1 : 3.2',
    
    priceLadder: [
      { id: 'x1', type: 'WHALE_WALL', label: 'Sell wall', volume: '$59.8M', price: 1.425, formattedPrice: '1.4250', color: '#eab308' },
      { id: 'x2', type: 'RESISTANCE', label: 'R', volume: '', price: 1.402, formattedPrice: '1.4020', color: '#64748b' },
      { id: 'x3', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 1.39, formattedPrice: '1.3900', color: '#f43f5e' },
      { id: 'x4', type: 'SUPPORT', label: 'S', volume: '', price: 1.350, formattedPrice: '1.3500', color: '#64748b' },
      { id: 'x5', type: 'LIQUIDATION_LONG', label: 'Liq Long', volume: '$38.5M', price: 1.290, formattedPrice: '1.2900', color: '#10b981' }
    ],
    
    liquidationClusters: [
      {
        type: 'LONG_CASCADE',
        priceLevel: 1.290,
        volumeUsdMillions: 38.5,
        leverageType: 'Long Liquidation Cascade Magnet',
        intensity: 'HIGH',
        distancePct: -7.19
      }
    ],
    
    whaleWalls: [
      {
        type: 'ICEBERG_ASK',
        priceLevel: 1.425,
        assetVolume: 42000000,
        usdMillions: 59.8,
        exchange: 'Binance & Upbit',
        absorptionRatePct: 88
      }
    ],
    
    marketOrderFlow: {
      cvd24hUsdMillions: -24.8,
      cvdFormatted: '-$24.8M (Market Seller Aggression)',
      aggressiveBuyPct: 39.4,
      aggressiveSellPct: 60.6,
      orderFlowWorkVerdict: 'Aggressive market sell volume pushing through bids with notable slippage',
      absorptionStatus: 'Bids at $1.395 are thin; market sells hitting bid tape consistently'
    },
    
    lanes: {
      technical: {
        name: 'TECHNICAL',
        icon: '📐',
        status: 'BEARISH',
        score: -34,
        weight: 0.25,
        impactLevel: 'MODERATE',
        headline: 'Double top rejection on 4H chart with bearish RSI divergence',
        bullets: ['Bearish MACD crossover confirmed', 'Lost local ascending support line']
      },
      narrative: {
        name: 'NARRATIVE',
        icon: '📰',
        status: 'BEARISH',
        score: -18,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Post-announcement profit taking observed across retail forums',
        bullets: ['Whale wallet transfers to Upbit exchange']
      },
      flow: {
        name: 'FLOW',
        icon: '🌊',
        status: 'BEARISH',
        score: -45,
        weight: 0.25,
        impactLevel: 'HIGH',
        headline: '$59.8M Whale ask wall capping upside at $1.425',
        bullets: ['Open interest shedding with negative delta']
      },
      macro: {
        name: 'MACRO',
        icon: '🌐',
        status: 'BEARISH',
        score: -20,
        weight: 0.25,
        impactLevel: 'LOW',
        headline: 'Liquidation pocket below acts as natural magnet',
        bullets: ['Long cascade pool at $1.290']
      }
    },
    reconciliationSummary: 'All 4 lanes aligned BEARISH. Validated for 1-2 Day SHORT swing setup.',
    keyDrivers: ['Korean retail trading volume on Upbit seeing heavy market sell orders'],
    candles: []
  },

  ADA: {
    symbol: 'ADA',
    displaySymbol: 'ADA/USDT',
    name: 'Cardano',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:ADAUSDT',
    currentPrice: 0.745,
    priceFormatted: '$0.7450',
    change24h: '+0.88%',
    isPositive: true,
    volume24h: '$840M',
    rsi14: 51.0,
    regime: 'CHOP / ACCUMULATION',
    regimeColor: '#38bdf8',
    laneAgreementFraction: '0/4 LANES',
    verdict: 'WAIT',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 50,
    status: 'WAITING_RECONCILIATION',
    setupSummary: 'Rangebound between $0.72 support and $0.78 resistance. No clear directional institutional delta. Strictly WAIT.',
    invalidationRules: ['1h close outside $0.72 - $0.78 range'],
    activationTrigger: { price: 0.785, priceFormatted: '$0.7850', conditionText: 'Wait for range breakout', isTriggered: false },
    optimalEntry: { price: 0.725, priceFormatted: '$0.7250', type: 'LIMIT_PULLBACK' },
    stopLoss: { price: 0.695, priceFormatted: '$0.6950', riskPct: '-4.13%', invalidationReason: 'Break of range support' },
    targets: { tp1: { price: 0.82, priceFormatted: '$0.8200', gainPct: '+10.0%', sizePct: '50%' }, tp2: { price: 0.88, priceFormatted: '$0.8800', gainPct: '+18.1%', sizePct: '30%' }, tp3: { price: 0.95, priceFormatted: '$0.9500', gainPct: '+27.5%', sizePct: '20%' } },
    riskRewardRatio: '1 : 2.4 (Inactive)',
    priceLadder: [
      { id: 'a1', type: 'RESISTANCE', label: 'R', volume: '', price: 0.780, formattedPrice: '0.7800', color: '#64748b' },
      { id: 'a2', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 0.745, formattedPrice: '0.7450', color: '#38bdf8' },
      { id: 'a3', type: 'SUPPORT', label: 'S', volume: '', price: 0.720, formattedPrice: '0.7200', color: '#64748b' }
    ],
    liquidationClusters: [],
    whaleWalls: [],
    marketOrderFlow: { cvd24hUsdMillions: 0.5, cvdFormatted: '+$0.5M', aggressiveBuyPct: 50.2, aggressiveSellPct: 49.8, orderFlowWorkVerdict: 'Neutral chop', absorptionStatus: 'Low volatility' },
    lanes: {
      technical: { name: 'TECHNICAL', icon: '📐', status: 'NEUTRAL', score: 0, weight: 0.25, impactLevel: 'LOW', headline: 'Range consolidation', bullets: ['Sideways EMA', 'RSI 51'] },
      narrative: { name: 'NARRATIVE', icon: '📰', status: 'NEUTRAL', score: 0, weight: 0.25, impactLevel: 'LOW', headline: 'Governance voting underway', bullets: ['Standard governance roadmap'] },
      flow: { name: 'FLOW', icon: '🌊', status: 'NEUTRAL', score: 0, weight: 0.25, impactLevel: 'LOW', headline: 'Orderbook balanced', bullets: ['Equal bid/ask depth'] },
      macro: { name: 'MACRO', icon: '🌐', status: 'NEUTRAL', score: 0, weight: 0.25, impactLevel: 'LOW', headline: 'Following general crypto beta', bullets: ['Neutral'] }
    },
    reconciliationSummary: 'Lanes neutral. Strictly WAIT.',
    keyDrivers: ['Cardano Foundation governance voting active'],
    candles: []
  },

  AVAX: {
    symbol: 'AVAX',
    displaySymbol: 'AVAX/USDT',
    name: 'Avalanche',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:AVAXUSDT',
    currentPrice: 28.40,
    priceFormatted: '$28.40',
    change24h: '+2.10%',
    isPositive: true,
    volume24h: '$490M',
    rsi14: 56.5,
    regime: 'TRENDING UP',
    regimeColor: '#eab308',
    laneAgreementFraction: '4/4 LANES',
    verdict: 'LONG',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 80,
    status: 'ACTIVATED',
    setupSummary: 'Subnet institutional tokenization partnership momentum. Short liquidation shelf at $31.20 provides clean 1:3.4 swing upside.',
    invalidationRules: ['1h close below $27.10 demand shelf'],
    activationTrigger: { price: 28.10, priceFormatted: '$28.10', conditionText: 'Confirmed bounce off $28.10', isTriggered: true },
    optimalEntry: { price: 28.30, priceFormatted: '$28.30', type: 'LIMIT_PULLBACK' },
    stopLoss: { price: 26.90, priceFormatted: '$26.90', riskPct: '-4.95%', invalidationReason: 'Break of daily EMA-20' },
    targets: { tp1: { price: 31.20, priceFormatted: '$31.20', gainPct: '+10.2%', sizePct: '50%' }, tp2: { price: 33.50, priceFormatted: '$33.50', gainPct: '+18.3%', sizePct: '30%' }, tp3: { price: 36.00, priceFormatted: '$36.00', gainPct: '+27.2%', sizePct: '20%' } },
    riskRewardRatio: '1 : 3.4',
    priceLadder: [
      { id: 'v1', type: 'LIQUIDATION_SHORT', label: 'Liq Short', volume: '$16.4M', price: 31.20, formattedPrice: '31.20', color: '#f43f5e' },
      { id: 'v2', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 28.40, formattedPrice: '28.40', color: '#10b981' },
      { id: 'v3', type: 'SUPPORT', label: 'S', volume: '', price: 27.10, formattedPrice: '27.10', color: '#64748b' }
    ],
    liquidationClusters: [],
    whaleWalls: [],
    marketOrderFlow: { cvd24hUsdMillions: 8.4, cvdFormatted: '+$8.4M', aggressiveBuyPct: 58.2, aggressiveSellPct: 41.8, orderFlowWorkVerdict: 'Taker buy dominance', absorptionStatus: 'Positive' },
    lanes: {
      technical: { name: 'TECHNICAL', icon: '📐', status: 'BULLISH', score: 22, weight: 0.25, impactLevel: 'MODERATE', headline: 'Higher lows on 4H', bullets: ['EMA-20 sloping up'] },
      narrative: { name: 'NARRATIVE', icon: '📰', status: 'BULLISH', score: 32, weight: 0.25, impactLevel: 'MODERATE', headline: 'Real-world asset (RWA) expansion', bullets: ['Institutional subnet adoption'] },
      flow: { name: 'FLOW', icon: '🌊', status: 'BULLISH', score: 20, weight: 0.25, impactLevel: 'LOW', headline: 'Short liquidations overhead', bullets: ['Funding rate neutral-negative'] },
      macro: { name: 'MACRO', icon: '🌐', status: 'BULLISH', score: 14, weight: 0.25, impactLevel: 'LOW', headline: 'Crypto beta supportive', bullets: ['No headwinds'] }
    },
    reconciliationSummary: 'All 4 lanes aligned BULLISH. 1-2 Day LONG active.',
    keyDrivers: ['Major European banking consortium trials asset tokenization on Avalanche Subnet'],
    candles: []
  },

  DOGE: {
    symbol: 'DOGE',
    displaySymbol: 'DOGE/USDT',
    name: 'Dogecoin',
    category: 'Crypto',
    tradingViewSymbol: 'BINANCE:DOGEUSDT',
    currentPrice: 0.3870,
    priceFormatted: '$0.3870',
    change24h: '+2.25%',
    isPositive: true,
    volume24h: '$3.1B',
    rsi14: 61.2,
    regime: 'TRENDING UP',
    regimeColor: '#eab308',
    laneAgreementFraction: '4/4 LANES',
    verdict: 'LONG',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 76,
    status: 'ACTIVATED',
    setupSummary: 'Retail breakout momentum supported by positive CVD buy volume. Overhead liquidation shelf at $0.44 offers high reward potential.',
    invalidationRules: ['1h close below $0.3620 support'],
    activationTrigger: { price: 0.3820, priceFormatted: '$0.3820', conditionText: 'Confirmed hold above $0.3820', isTriggered: true },
    optimalEntry: { price: 0.3850, priceFormatted: '$0.3850', type: 'MARKET_MOMENTUM' },
    stopLoss: { price: 0.3580, priceFormatted: '$0.3580', riskPct: '-7.01%', invalidationReason: 'Break of support' },
    targets: { tp1: { price: 0.4250, priceFormatted: '$0.4250', gainPct: '+10.3%', sizePct: '50%' }, tp2: { price: 0.4550, priceFormatted: '$0.4550', gainPct: '+18.1%', sizePct: '30%' }, tp3: { price: 0.4950, priceFormatted: '$0.4950', gainPct: '+28.5%', sizePct: '20%' } },
    riskRewardRatio: '1 : 2.9',
    priceLadder: [
      { id: 'd1', type: 'LIQUIDATION_SHORT', label: 'Liq Short', volume: '$28.4M', price: 0.4400, formattedPrice: '0.4400', color: '#f43f5e' },
      { id: 'd2', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 0.3870, formattedPrice: '0.3870', color: '#10b981' },
      { id: 'd3', type: 'SUPPORT', label: 'S', volume: '', price: 0.3620, formattedPrice: '0.3620', color: '#64748b' }
    ],
    liquidationClusters: [],
    whaleWalls: [],
    marketOrderFlow: { cvd24hUsdMillions: 14.5, cvdFormatted: '+$14.5M', aggressiveBuyPct: 62.4, aggressiveSellPct: 37.6, orderFlowWorkVerdict: 'Strong retail market buying', absorptionStatus: 'Momentum active' },
    lanes: {
      technical: { name: 'TECHNICAL', icon: '📐', status: 'BULLISH', score: 26, weight: 0.25, impactLevel: 'MODERATE', headline: 'Bull pennant breakout on 4H', bullets: ['Expanding volume'] },
      narrative: { name: 'NARRATIVE', icon: '📰', status: 'BULLISH', score: 38, weight: 0.25, impactLevel: 'MODERATE', headline: 'Meme beta high sentiment', bullets: ['Social volume spike'] },
      flow: { name: 'FLOW', icon: '🌊', status: 'BULLISH', score: 24, weight: 0.25, impactLevel: 'MODERATE', headline: 'Taker buy dominance', bullets: ['Shorts being squeezed'] },
      macro: { name: 'MACRO', icon: '🌐', status: 'BULLISH', score: 10, weight: 0.25, impactLevel: 'LOW', headline: 'Risk-on crypto appetite', bullets: ['High beta leading'] }
    },
    reconciliationSummary: 'All 4 lanes aligned BULLISH. 1-2 Day LONG active.',
    keyDrivers: ['Social volume index prints 3-week peak on retail excitement'],
    candles: []
  },

  PAXG: {
    symbol: 'PAXG',
    displaySymbol: 'PAXG/USDT',
    name: 'Pax Gold',
    category: 'Commodity',
    tradingViewSymbol: 'BINANCE:PAXGUSDT',
    currentPrice: 4164.44,
    priceFormatted: '$4,164.44',
    change24h: '-0.72%',
    isPositive: false,
    volume24h: '$65M',
    rsi14: 42.1,
    regime: 'TRENDING DOWN',
    regimeColor: '#f43f5e',
    laneAgreementFraction: '4/4 LANES',
    verdict: 'SHORT',
    holdDuration: '1–2 Days Hold Trader',
    confidencePct: 94,
    status: 'ACTIVATED',
    setupSummary: 'Rejection from $4,227.28 ATH resistance confirmed. -63 pt cascade broken below 4,180.74 EMA, targeting $4,066.14 demand pool.',
    invalidationRules: ['1h close above $4,227.28 ATH high'],
    activationTrigger: { price: 4225, priceFormatted: '$4,225', conditionText: 'Rejection from $4,227 ATH ceiling', isTriggered: true },
    optimalEntry: { price: 4225, priceFormatted: '$4,225', type: 'BREAKOUT_RETEST' },
    stopLoss: { price: 4228.5, priceFormatted: '$4,228.50', riskPct: '+0.08%', invalidationReason: 'Strict invalidation above $4,227.28 ATH high' },
    targets: { tp1: { price: 4140, priceFormatted: '$4,140', gainPct: '+2.01%', sizePct: '50%' }, tp2: { price: 4100, priceFormatted: '$4,100', gainPct: '+2.95%', sizePct: '30%' }, tp3: { price: 4066.14, priceFormatted: '$4,066.14', gainPct: '+3.76%', sizePct: '20%' } },
    riskRewardRatio: '1 : 11.2',
    priceLadder: [
      { id: 'p1', type: 'RESISTANCE', label: 'R ATH', volume: '$12.5M', price: 4227.28, formattedPrice: '4227.28', color: '#f43f5e' },
      { id: 'p2', type: 'CURRENT_PRICE', label: 'Live', volume: '', price: 4164.44, formattedPrice: '4164.44', color: '#f43f5e' },
      { id: 'p3', type: 'SUPPORT', label: 'Broken EMA', volume: '', price: 4180.74, formattedPrice: '4180.74', color: '#10b981' },
      { id: 'p4', type: 'TARGET_TP', label: 'Target Floor', volume: '', price: 4066.14, formattedPrice: '4066.14', color: '#10b981' }
    ],
    liquidationClusters: [],
    whaleWalls: [],
    marketOrderFlow: { cvd24hUsdMillions: 12.0, cvdFormatted: '+$12.0M', aggressiveBuyPct: 65.0, aggressiveSellPct: 35.0, orderFlowWorkVerdict: 'Central bank & institutional hedge buying', absorptionStatus: 'Strong demand' },
    lanes: {
      technical: { name: 'TECHNICAL', icon: '📐', status: 'BULLISH', score: 38, weight: 0.25, impactLevel: 'HIGH', headline: 'Structural breakout above previous ATH', bullets: ['All moving averages pointing up'] },
      narrative: { name: 'NARRATIVE', icon: '📰', status: 'BULLISH', score: 45, weight: 0.25, impactLevel: 'HIGH', headline: 'Global sovereign reserve asset accumulation', bullets: ['BRICS de-dollarization theme'] },
      flow: { name: 'FLOW', icon: '🌊', status: 'BULLISH', score: 28, weight: 0.25, impactLevel: 'MODERATE', headline: 'Physical gold backing ETF inflows', bullets: ['Vault redemption requests zero'] },
      macro: { name: 'MACRO', icon: '🌐', status: 'BULLISH', score: 42, weight: 0.25, impactLevel: 'HIGH', headline: 'Real rates declining as central banks cut rates', bullets: ['Negative real yields supportive'] }
    },
    reconciliationSummary: 'All 4 lanes aligned BULLISH. Pristine 1-2 Day LONG hold.',
    keyDrivers: ['Global central bank net gold purchases reach 12-month high'],
    candles: []
  }
};
