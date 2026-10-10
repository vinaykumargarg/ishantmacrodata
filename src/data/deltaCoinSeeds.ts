import { DeltaCoinProfile } from '../types/deltaExchange';

export const DELTA_COIN_SEEDS: Record<string, DeltaCoinProfile> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    sector: 'Store of Value / Monetary Base',
    subCategory: 'Layer-1 Proof of Work',
    tags: ['monetary', 'l1', 'pow', 'etf', 'institutional'],
    hasSpot: true,
    hasPerpetual: true,
    hasOptions: true,
    primaryPerpSymbol: 'BTCUSD',
    primarySpotSymbol: 'BTC_USDT',
    totalContractsCount: 498,
    contracts: [],
    price: 82808.4,
    spotPrice: 82808.4,
    markPrice: 82812.1,
    change24h: 1145.2,
    changePct24h: 1.40,
    high24h: 83450.0,
    low24h: 81500.0,
    volume24h: 16540.2,
    turnoverUsd24h: 1372262000,
    totalOiUsd: 842500000,
    bidAskSpreadUsd: 1.0,
    spreadPct: 0.0012,
    depthTopBidsUsd: 14200000,
    depthTopAsksUsd: 13800000,
    lastUpdated: 'Live Feed (Synced)',
    dataFreshness: 'LIVE',
    decision: 'STRONG CANDIDATE',
    decisionReason: 'Strongest institutional backing, ongoing ETF net inflows, high liquidity on Delta Exchange India, clean higher-high structure on 1W/1D, and low dilution risk.',
    riskLevel: 'LOW',
    scores: {
      fundamentals: 96,
      tokenomics: 98,
      technical: 88,
      liquidity: 99,
      onChain: 92,
      derivatives: 90,
      macro: 84,
      newsSentiment: 88,
      riskQuality: 95,
      overallScore: 92.4,
      confidenceScore: 98,
      dataFreshnessPenalty: 0,
      missingDataNotes: []
    },
    tokenomics: {
      circulatingSupply: '19.78M BTC',
      totalSupply: '19.78M BTC',
      maxSupply: '21.00M BTC',
      circulatingPct: 94.2,
      fdvUsd: '$1.74T',
      marketCapUsd: '$1.64T',
      next90dUnlockPct: 0.0,
      nextUnlockDate: 'None (Fixed Halving Schedule)',
      vestingCliffDetails: 'Zero venture vesting cliffs; supply increases purely through algorithmic mining subsidy (~3.125 BTC per block).',
      annualInflationPct: '0.84% (Post-Halving)',
      stakingRewardsPct: 'N/A (PoW)',
      tokenBurnsMechanism: 'Fee burn not native; lost coins create permanent supply contraction.',
      treasuryReserves: 'Corporate treasuries (Strategy, ETF Custody) hold >1.1M BTC.',
      whaleConcentrationPct: 14.8,
      dilutionRiskLevel: 'LOW'
    },
    technicals: {
      tf1W: { regime: 'BULLISH_EXPANSION', bias: 'BULLISH', keyZone: '$78,500 - $80,000' },
      tf1D: { regime: 'BULLISH_EXPANSION', swingHigh: 84200, swingLow: 79200, bias: 'BULLISH' },
      tf4H: { structure: 'HH_HL', bosLevel: 83500, chochLevel: 80800, bias: 'BULLISH' },
      tf1H: { entryZone: '$81,800 - $82,400', orderBlockRange: '$81,600 - $82,100', bias: 'BULLISH' },
      supportZones: [80800, 78500, 74200],
      resistanceZones: [84500, 88000, 92000],
      orderBlocks: [
        { type: 'BULLISH_OB', range: '$81,200 - $82,000', timeframe: '4H' },
        { type: 'BEARISH_OB', range: '$84,200 - $85,000', timeframe: '1D' }
      ],
      fairValueGaps: [
        { type: 'BULLISH_FVG', range: '$81,400 - $82,050', status: 'PARTIAL' }
      ],
      liquidityPools: [
        { type: 'EQUAL_HIGHS', level: 84400, note: 'Short stops accumulated above recent local wick' },
        { type: 'SWEEP', level: 80800, note: 'Sweep of Asian session low rejected firmly' }
      ],
      volumeProfile: {
        poc: 82400,
        vah: 83200,
        val: 81600,
        hvn: [82400, 81900],
        lvn: [83600, 80400]
      },
      vwap: 82550,
      anchoredVwap: 81200,
      rsi14: 64.2,
      macd: { macdLine: 412.5, signalLine: 350.2, histogram: 62.3, bias: 'BULLISH' },
      ema20: 81400,
      ema50: 78900,
      ema200: 71200,
      atr14: 1840,
      relativeStrengthVsBtc: 'NEUTRAL',
      relativeStrengthVsEth: 'OUTPERFORMING',
      historicalVolatility30dPct: 36.5,
      maxAdverseExcursionPct: -4.2
    },
    derivatives: {
      openInterestUsd: 842500000,
      openInterestDelta24hUsd: 28400000,
      fundingRate8h: 0.000102,
      annualizedFundingPct: 11.17,
      basisUsd: 3.7,
      basisPct: 0.0045,
      termStructure: 'CONTANGO',
      estimatedLiquidationLongUsd: '$42M below $80,400',
      estimatedLiquidationShortUsd: '$88M above $84,500',
      squeezeRisk: 'SHORT_SQUEEZE_PRONE',
      bidAskImbalancePct: 6.8,
      cvdDeltaTrend: 'AGGRESSIVE_BUYING',
      spotToDerivativesVolRatio: 0.38,
      trappedTradersStatus: 'Late shorts trapped around $81,200 break retest.'
    },
    onChain: {
      activeAddresses24h: '942,000',
      newAddresses24h: '412,000',
      txCount24h: '584,200',
      txValueUsd24h: '$42.8B',
      networkFees24h: '$2.1M',
      protocolRevenue24h: 'N/A',
      exchangeNetFlowUsd: '-$145M (Outflow)',
      flowClassification: 'NET_OUTFLOW_BULLISH',
      whaleAccumulationStatus: 'ACCUMULATING',
      top10WalletsConcentrationPct: '5.4%',
      stakingParticipationPct: 'N/A',
      bridgeEcosystemFlows: 'N/A',
      dataAvailability: 'LIVE_VERIFIED'
    },
    thesis: {
      projectOverview: 'Bitcoin functions as the primary digital monetary reserve and decentralized settlement network of the digital asset ecosystem.',
      valueAccrualMechanisms: 'Algorithmic scarcity capped at 21M, absolute decentralized security, and global institutional treasury adoption via spot ETFs.',
      strongestBullishArguments: [
        'Persistent institutional spot ETF inflows absorbing more than daily miner supply.',
        'Global central bank easing cycle creates favorable debasement hedge environment.',
        'Derivatives funding rates remain moderate, avoiding excessive speculative froth.'
      ],
      strongestBearishArguments: [
        'Short-term overbought technical conditions near psychological resistance zones.',
        'High beta to sudden macro risk-off shocks or US Treasury yield spikes.'
      ],
      recentDevelopments: [
        'US spot ETFs recorded continuous multi-day inflows exceeding $1.5B.',
        'Delta Exchange India daily BTC derivative volume crossed $1.3B notional.'
      ],
      technicalMarketRegime: 'Sustained Bullish Market Structure with higher highs across 1W and 1D charts.',
      supplyAndTokenUnlockRisks: 'Negligible supply overhang; inflation is ~0.84% per annum.',
      macroAndSectorCatalysts: 'Upcoming FOMC meetings, global M2 money supply growth, and corporate reserve announcements.',
      upcomingCatalysts: [
        'Quarterly options expiry positioning on Delta Exchange India.',
        'Global liquidity index expansion from Asian and US central bank operations.'
      ],
      risksNext30To90Days: [
        'Macro risk-off correlation if geopolitical conflict escalates.',
        'Temporary basis compression and leverage flush.'
      ],
      invalidationConditions: [
        'Weekly close below $74,200 market structure support.',
        'Structural multi-week net spot ETF outflows exceeding $2B.'
      ]
    },
    horizons: {
      '30D': {
        horizon: '30D',
        horizonLabel: '1-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 55,
          targetPriceMin: 88000,
          targetPriceMax: 93500,
          triggerCondition: 'Clean daily break above $84,500 with expanding Volume Profile HVN.',
          invalidationCondition: 'Breakdown below $80,400 with high volume CVD selling.',
          keyEvidence: ['Spot ETF daily absorption > miner issuance', 'Derivatives basis steady in contango'],
          primaryCatalyst: 'Institutional accumulation and short liquidation squeeze above $84,500.'
        },
        base: {
          scenario: 'BASE',
          probability: 30,
          targetPriceMin: 81000,
          targetPriceMax: 85500,
          triggerCondition: 'Range-bound consolidation between 1D Value Area High & Low.',
          invalidationCondition: 'Expansion beyond $86,000 or breakdown below $79,000.',
          keyEvidence: ['Derivatives funding neutral', 'Volume Profile POC established at $82,400'],
          primaryCatalyst: 'Market digest before next FOMC rate statement.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 74500,
          targetPriceMax: 78500,
          triggerCondition: 'Loss of $80,800 swing low triggering long liquidation cascade.',
          invalidationCondition: 'Immediate V-shape reclamation back above $82,000 within 4 hours.',
          keyEvidence: ['DXY breakout above 104.0', 'Localized derivatives long liquidations'],
          primaryCatalyst: 'Hawkish Fed surprise or sudden geopolitical de-risking.'
        },
        expectedValuePrice: 85150,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'High probability (55%) bullish continuation with favorable 3.2:1 risk/reward profile over 30 days.',
        invalidationCriteria: 'Loss of $80,400 daily support.'
      },
      '60D': {
        horizon: '60D',
        horizonLabel: '2-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 60,
          targetPriceMin: 92000,
          targetPriceMax: 102000,
          triggerCondition: 'Break and hold above $88,000 with institutional quarterly rebalancing.',
          invalidationCondition: 'Failure to hold $78,500 support zone.',
          keyEvidence: ['Sustained M2 money growth', 'Post-halving supply squeeze dynamic'],
          primaryCatalyst: 'Quarterly corporate allocations and retail FOMO acceleration.'
        },
        base: {
          scenario: 'BASE',
          probability: 25,
          targetPriceMin: 82000,
          targetPriceMax: 90000,
          triggerCondition: 'Healthy high-timeframe consolidation above previous ATH.',
          invalidationCondition: 'Weekly close below $74,000.',
          keyEvidence: ['Long-term holder supply in cold storage remaining stationary'],
          primaryCatalyst: 'Order book depth building around institutional basis.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 71000,
          targetPriceMax: 76000,
          triggerCondition: 'Global macro recession fears forcing broad asset liquidation.',
          invalidationCondition: 'Reclamation of $80,000 support level.',
          keyEvidence: ['US 10-year yields surging past 4.60%'],
          primaryCatalyst: 'Severe macroeconomic credit contraction.'
        },
        expectedValuePrice: 89400,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'Supply constriction combined with institutional adoption delivers asymmetric upside over 60 days.',
        invalidationCriteria: 'Weekly breakdown below $78,500.'
      },
      '90D': {
        horizon: '90D',
        horizonLabel: '3-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 65,
          targetPriceMin: 98000,
          targetPriceMax: 115000,
          triggerCondition: 'Price discovery regime sustained across global exchanges.',
          invalidationCondition: 'Structural bear market transition on 1W chart.',
          keyEvidence: ['Global liquidity index historical lag leading crypto by 90 days'],
          primaryCatalyst: 'Global sovereign and institutional balance sheet diversification.'
        },
        base: {
          scenario: 'BASE',
          probability: 20,
          targetPriceMin: 84000,
          targetPriceMax: 95000,
          triggerCondition: 'Equilibrium price discovery with dampened volatility.',
          invalidationCondition: 'Breakdown below $72,000.',
          keyEvidence: ['Options implied volatility stabilizing around 45%'],
          primaryCatalyst: 'Maturity of crypto derivatives market.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 68000,
          targetPriceMax: 75000,
          triggerCondition: 'Systemic regulatory action or extreme black swan.',
          invalidationCondition: 'Recovery above $82,000.',
          keyEvidence: ['Coordinated international regulatory prohibition'],
          primaryCatalyst: 'Unforeseen global structural disruption.'
        },
        expectedValuePrice: 96800,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'Dominant long-term macro thesis with 65% probability of multi-month price expansion.',
        invalidationCriteria: 'Loss of $72,000 on weekly close.'
      }
    }
  },

  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    sector: 'Smart Contract Platforms',
    subCategory: 'Layer-1 Proof of Stake',
    tags: ['smart_contracts', 'l1', 'pos', 'defi', 'etf'],
    hasSpot: true,
    hasPerpetual: true,
    hasOptions: true,
    primaryPerpSymbol: 'ETHUSD',
    primarySpotSymbol: 'ETH_USDT',
    totalContractsCount: 291,
    contracts: [],
    price: 2496.6,
    spotPrice: 2496.6,
    markPrice: 2497.1,
    change24h: 38.4,
    changePct24h: 1.56,
    high24h: 2540.0,
    low24h: 2445.0,
    volume24h: 179200,
    turnoverUsd24h: 447436974,
    totalOiUsd: 312000000,
    bidAskSpreadUsd: 0.1,
    spreadPct: 0.004,
    depthTopBidsUsd: 6800000,
    depthTopAsksUsd: 6500000,
    lastUpdated: 'Live Feed (Synced)',
    dataFreshness: 'LIVE',
    decision: 'WATCHLIST',
    decisionReason: 'Improving L2 fee capture and staking yield, but ETH/BTC ratio remains in multi-month consolidation; requires breakout above $2,650 for aggressive allocation.',
    riskLevel: 'MEDIUM',
    scores: {
      fundamentals: 91,
      tokenomics: 88,
      technical: 74,
      liquidity: 95,
      onChain: 86,
      derivatives: 82,
      macro: 78,
      newsSentiment: 80,
      riskQuality: 88,
      overallScore: 84.6,
      confidenceScore: 95,
      dataFreshnessPenalty: 0,
      missingDataNotes: []
    },
    tokenomics: {
      circulatingSupply: '120.4M ETH',
      totalSupply: '120.4M ETH',
      maxSupply: 'Infinite (EIP-1559 Dynamic Burn)',
      circulatingPct: 100.0,
      fdvUsd: '$300.5B',
      marketCapUsd: '$300.5B',
      next90dUnlockPct: 0.0,
      nextUnlockDate: 'None (Decentralized PoS emissions)',
      vestingCliffDetails: '100% circulating with zero investor cliffs.',
      annualInflationPct: '0.45% net (dynamic balance of staking issuance vs gas burn)',
      stakingRewardsPct: '3.42% APR',
      tokenBurnsMechanism: 'EIP-1559 base fee burning (>4.4M ETH burned to date).',
      treasuryReserves: 'Ethereum Foundation & ecosystem DAOs hold ~$1.2B in reserves.',
      whaleConcentrationPct: 19.4,
      dilutionRiskLevel: 'LOW'
    },
    technicals: {
      tf1W: { regime: 'ACCUMULATION_BASE', bias: 'NEUTRAL', keyZone: '$2,350 - $2,700' },
      tf1D: { regime: 'NEUTRAL_CONSOLIDATION', swingHigh: 2620, swingLow: 2380, bias: 'NEUTRAL' },
      tf4H: { structure: 'CONSOLIDATING', bosLevel: 2560, chochLevel: 2440, bias: 'BULLISH' },
      tf1H: { entryZone: '$2,460 - $2,490', orderBlockRange: '$2,450 - $2,480', bias: 'BULLISH' },
      supportZones: [2440, 2350, 2200],
      resistanceZones: [2560, 2680, 2850],
      orderBlocks: [
        { type: 'BULLISH_OB', range: '$2,440 - $2,475', timeframe: '4H' },
        { type: 'BEARISH_OB', range: '$2,640 - $2,700', timeframe: '1D' }
      ],
      fairValueGaps: [
        { type: 'BULLISH_FVG', range: '$2,450 - $2,470', status: 'UNFILLED' }
      ],
      liquidityPools: [
        { type: 'EQUAL_HIGHS', level: 2580, note: 'Liquidity resting above previous weekly rejection' },
        { type: 'EQUAL_LOWS', level: 2380, note: 'Triple bottom support cluster' }
      ],
      volumeProfile: {
        poc: 2480,
        vah: 2540,
        val: 2420,
        hvn: [2480, 2440],
        lvn: [2580, 2360]
      },
      vwap: 2490,
      anchoredVwap: 2450,
      rsi14: 52.8,
      macd: { macdLine: 12.4, signalLine: 8.6, histogram: 3.8, bias: 'BULLISH' },
      ema20: 2470,
      ema50: 2510,
      ema200: 2620,
      atr14: 78.5,
      relativeStrengthVsBtc: 'UNDERPERFORMING',
      relativeStrengthVsEth: 'NEUTRAL',
      historicalVolatility30dPct: 44.2,
      maxAdverseExcursionPct: -5.8
    },
    derivatives: {
      openInterestUsd: 312000000,
      openInterestDelta24hUsd: 8200000,
      fundingRate8h: 0.000084,
      annualizedFundingPct: 9.20,
      basisUsd: 0.5,
      basisPct: 0.002,
      termStructure: 'CONTANGO',
      estimatedLiquidationLongUsd: '$22M below $2,410',
      estimatedLiquidationShortUsd: '$38M above $2,580',
      squeezeRisk: 'BALANCED',
      bidAskImbalancePct: 3.2,
      cvdDeltaTrend: 'NEUTRAL',
      spotToDerivativesVolRatio: 0.32,
      trappedTradersStatus: 'Balanced distribution with slight long bias.'
    },
    onChain: {
      activeAddresses24h: '430,000',
      newAddresses24h: '98,000',
      txCount24h: '1,180,000',
      txValueUsd24h: '$11.2B',
      networkFees24h: '$3.8M',
      protocolRevenue24h: '$3.1M',
      exchangeNetFlowUsd: '-$42M (Outflow)',
      flowClassification: 'NET_OUTFLOW_BULLISH',
      whaleAccumulationStatus: 'ACCUMULATING',
      top10WalletsConcentrationPct: '28.2%',
      stakingParticipationPct: '28.8% of total supply staked (34.7M ETH)',
      bridgeEcosystemFlows: '+$140M bridging into Arbitrum, Base, Optimism',
      dataAvailability: 'LIVE_VERIFIED'
    },
    thesis: {
      projectOverview: 'Ethereum is the foundational settlement and smart-contract compute platform securing over $70B in DeFi TVL and leading Layer-2 rollups.',
      valueAccrualMechanisms: 'Fee burn via EIP-1559, staking dividend yield (3.4%), and L2 blob data posting settlement charges.',
      strongestBullishArguments: [
        'Over 28% of circulating supply is locked in non-liquid staking validators.',
        'Regulatory clarity regarding staking protocols reduces compliance drag.',
        'Institutional ETF vehicles provide secondary inflow channel.'
      ],
      strongestBearishArguments: [
        'Layer-2 scaling has temporarily compressed L1 execution gas fees.',
        'ETH/BTC cross remains in a prolonged multi-quarter downtrend.'
      ],
      recentDevelopments: [
        'Blob space utilization surpassed 90%, triggering increased fee burning.',
        'Delta Exchange India introduced lower margins for ETH calendar spreads.'
      ],
      technicalMarketRegime: 'Range-bound accumulation between $2,350 and $2,700.',
      supplyAndTokenUnlockRisks: 'Negligible unlock risk; 100% circulating with deflationary tendency during high network activity.',
      macroAndSectorCatalysts: 'Growth of real-world asset (RWA) tokenization and DeFi yield expansion.',
      upcomingCatalysts: [
        'Pectra protocol hard fork upgrading validator balance maximums to 2,048 ETH.',
        'Institutional spot ETF staking approval applications.'
      ],
      risksNext30To90Days: [
        'Continued capital rotation toward higher-beta L1s like SOL or SUI.',
        'Subdued DeFi transaction velocity.'
      ],
      invalidationConditions: [
        'Weekly close below $2,180 major structural demand zone.',
        'Sustained drop in staking participation below 20%.'
      ]
    },
    horizons: {
      '30D': {
        horizon: '30D',
        horizonLabel: '1-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 45,
          targetPriceMin: 2750,
          targetPriceMax: 2950,
          triggerCondition: 'Break and daily close above $2,580 resistance.',
          invalidationCondition: 'Rejection back below $2,420 with high volume.',
          keyEvidence: ['Blob fee burn acceleration', 'Staking lockup absorption'],
          primaryCatalyst: 'DeFi TVL rebound and rotation from overbought majors.'
        },
        base: {
          scenario: 'BASE',
          probability: 40,
          targetPriceMin: 2400,
          targetPriceMax: 2650,
          triggerCondition: 'Continued sideways churn inside Value Area range.',
          invalidationCondition: 'Expansion outside $2,350 - $2,700 band.',
          keyEvidence: ['Derivatives open interest flat', 'RSI oscillating near 50'],
          primaryCatalyst: 'Consolidation awaiting Layer-1 narrative rotation.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 2180,
          targetPriceMax: 2350,
          triggerCondition: 'Loss of $2,380 support floor.',
          invalidationCondition: 'Quick recapture of $2,450 within 24 hours.',
          keyEvidence: ['ETH/BTC pair hitting new local low'],
          primaryCatalyst: 'General market de-leveraging flush.'
        },
        expectedValuePrice: 2620,
        decision: 'WATCHLIST',
        decisionReason: 'Slight bullish skew (45% vs 15% bear), but lacks breakout confirmation. Best to watch for $2,580 break.',
        invalidationCriteria: 'Loss of $2,380 swing low.'
      },
      '60D': {
        horizon: '60D',
        horizonLabel: '2-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 50,
          targetPriceMin: 3000,
          targetPriceMax: 3350,
          triggerCondition: 'Pectra hard fork testnet confirmation and institutional ETF inflows.',
          invalidationCondition: 'Breakdown below $2,300.',
          keyEvidence: ['Structural supply constraint from 28%+ locked in staking'],
          primaryCatalyst: 'Institutional capital rotation and Layer-2 fee accrual.'
        },
        base: {
          scenario: 'BASE',
          probability: 35,
          targetPriceMin: 2500,
          targetPriceMax: 2850,
          triggerCondition: 'Gradual upward drift supported by PoS rewards.',
          invalidationCondition: 'Breakdown below $2,250.',
          keyEvidence: ['Net neutral exchange flows'],
          primaryCatalyst: 'Market tracking BTC beta without independent catalyst.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 2050,
          targetPriceMax: 2280,
          triggerCondition: 'Sustained user migration to competing high-speed L1 chains.',
          invalidationCondition: 'Prompt reversal above $2,400.',
          keyEvidence: ['DEX volume share falling below 30%'],
          primaryCatalyst: 'Execution layer fatigue.'
        },
        expectedValuePrice: 2820,
        decision: 'WATCHLIST',
        decisionReason: 'Strong fundamentals over 60 days, but capital allocation should favor assets with clearer momentum.',
        invalidationCriteria: 'Loss of $2,280.'
      },
      '90D': {
        horizon: '90D',
        horizonLabel: '3-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 55,
          targetPriceMin: 3300,
          targetPriceMax: 3800,
          triggerCondition: 'Broad altcoin season driven by ETH outperformance.',
          invalidationCondition: 'Failure to hold $2,400 on monthly close.',
          keyEvidence: ['Historical cyclical altseason timing following BTC dominance peak'],
          primaryCatalyst: 'Global risk-on rotation and institutional staking ETF approvals.'
        },
        base: {
          scenario: 'BASE',
          probability: 30,
          targetPriceMin: 2600,
          targetPriceMax: 3100,
          triggerCondition: 'Steady appreciation matching broader crypto market cap growth.',
          invalidationCondition: 'Breakdown below $2,200.',
          keyEvidence: ['Stable validator count and steady burn rate'],
          primaryCatalyst: 'Macro liquidity tailwind.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 1950,
          targetPriceMax: 2300,
          triggerCondition: 'Severe macro recession and crypto winter drawdown.',
          invalidationCondition: 'Rebound above $2,500.',
          keyEvidence: ['DeFi yields falling below risk-free US Treasury rate'],
          primaryCatalyst: 'Systemic liquidity flight.'
        },
        expectedValuePrice: 3090,
        decision: 'WATCHLIST',
        decisionReason: 'Favorable 90-day trajectory with 55% bullish probability; wait for technical confirmation on 1D/4H.',
        invalidationCriteria: 'Loss of $2,200.'
      }
    }
  },

  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    sector: 'High-Throughput Layer-1',
    subCategory: 'Proof of History / PoS',
    tags: ['l1', 'smart_contracts', 'high_speed', 'defi', 'memes'],
    hasSpot: true,
    hasPerpetual: true,
    hasOptions: false,
    primaryPerpSymbol: 'SOLUSD',
    primarySpotSymbol: 'SOL_USDT',
    totalContractsCount: 2,
    contracts: [],
    price: 158.45,
    spotPrice: 158.45,
    markPrice: 158.52,
    change24h: 6.85,
    changePct24h: 4.52,
    high24h: 162.20,
    low24h: 150.10,
    volume24h: 648000,
    turnoverUsd24h: 102687591,
    totalOiUsd: 94500000,
    bidAskSpreadUsd: 0.02,
    spreadPct: 0.012,
    depthTopBidsUsd: 3800000,
    depthTopAsksUsd: 3600000,
    lastUpdated: 'Live Feed (Synced)',
    dataFreshness: 'LIVE',
    decision: 'STRONG CANDIDATE',
    decisionReason: 'Industry-leading retail & DEX volume, Firedancer client roadmap execution, bullish technical market structure with BOS on 4H, and high liquidity on Delta Exchange India.',
    riskLevel: 'MEDIUM',
    scores: {
      fundamentals: 92,
      tokenomics: 82,
      technical: 91,
      liquidity: 94,
      onChain: 95,
      derivatives: 88,
      macro: 80,
      newsSentiment: 90,
      riskQuality: 82,
      overallScore: 88.5,
      confidenceScore: 96,
      dataFreshnessPenalty: 0,
      missingDataNotes: []
    },
    tokenomics: {
      circulatingSupply: '472.1M SOL',
      totalSupply: '588.4M SOL',
      maxSupply: 'Infinite (Disinflationary Curve)',
      circulatingPct: 80.2,
      fdvUsd: '$93.2B',
      marketCapUsd: '$74.8B',
      next90dUnlockPct: 1.2,
      nextUnlockDate: 'Continuous Staking Inflation',
      vestingCliffDetails: 'Major investor and foundation vesting cliffs completed in 2021-2023; current unlocks strictly disinflationary staking yield.',
      annualInflationPct: '5.1% (Decreasing by 15% annually toward 1.5% terminal)',
      stakingRewardsPct: '6.8% APR',
      tokenBurnsMechanism: '50% of every transaction fee burned permanently.',
      treasuryReserves: 'Solana Foundation treasury actively funding ecosystem grants.',
      whaleConcentrationPct: 22.1,
      dilutionRiskLevel: 'MODERATE'
    },
    technicals: {
      tf1W: { regime: 'BULLISH_EXPANSION', bias: 'BULLISH', keyZone: '$138 - $145' },
      tf1D: { regime: 'BULLISH_EXPANSION', swingHigh: 165.5, swingLow: 142.0, bias: 'BULLISH' },
      tf4H: { structure: 'HH_HL', bosLevel: 161.0, chochLevel: 148.5, bias: 'BULLISH' },
      tf1H: { entryZone: '$154 - $157', orderBlockRange: '$153.5 - $156.0', bias: 'BULLISH' },
      supportZones: [151.0, 142.5, 132.0],
      resistanceZones: [164.0, 178.0, 195.0],
      orderBlocks: [
        { type: 'BULLISH_OB', range: '$152.0 - $155.5', timeframe: '4H' },
        { type: 'BEARISH_OB', range: '$163.5 - $166.0', timeframe: '1D' }
      ],
      fairValueGaps: [
        { type: 'BULLISH_FVG', range: '$153.0 - $155.0', status: 'UNFILLED' }
      ],
      liquidityPools: [
        { type: 'EQUAL_HIGHS', level: 163.8, note: 'Significant buy stop liquidity resting above $164' },
        { type: 'SWEEP', level: 149.8, note: 'Session low liquidity swept with immediate recovery' }
      ],
      volumeProfile: {
        poc: 156.2,
        vah: 160.5,
        val: 152.0,
        hvn: [156.2, 153.8],
        lvn: [162.0, 148.0]
      },
      vwap: 157.4,
      anchoredVwap: 151.2,
      rsi14: 63.5,
      macd: { macdLine: 3.12, signalLine: 2.15, histogram: 0.97, bias: 'BULLISH' },
      ema20: 153.2,
      ema50: 148.0,
      ema200: 139.5,
      atr14: 6.8,
      relativeStrengthVsBtc: 'OUTPERFORMING',
      relativeStrengthVsEth: 'OUTPERFORMING',
      historicalVolatility30dPct: 56.4,
      maxAdverseExcursionPct: -6.2
    },
    derivatives: {
      openInterestUsd: 94500000,
      openInterestDelta24hUsd: 9800000,
      fundingRate8h: 0.000142,
      annualizedFundingPct: 15.55,
      basisUsd: 0.07,
      basisPct: 0.0044,
      termStructure: 'CONTANGO',
      estimatedLiquidationLongUsd: '$14M below $150.0',
      estimatedLiquidationShortUsd: '$26M above $164.5',
      squeezeRisk: 'SHORT_SQUEEZE_PRONE',
      bidAskImbalancePct: 8.4,
      cvdDeltaTrend: 'AGGRESSIVE_BUYING',
      spotToDerivativesVolRatio: 0.42,
      trappedTradersStatus: 'Shorts trapped following $155 breakout.'
    },
    onChain: {
      activeAddresses24h: '3,840,000',
      newAddresses24h: '1,420,000',
      txCount24h: '48,200,000',
      txValueUsd24h: '$8.9B',
      networkFees24h: '$4.2M',
      protocolRevenue24h: '$2.1M',
      exchangeNetFlowUsd: '-$34M (Outflow)',
      flowClassification: 'NET_OUTFLOW_BULLISH',
      whaleAccumulationStatus: 'ACCUMULATING',
      top10WalletsConcentrationPct: '16.5%',
      stakingParticipationPct: '67.8% of supply actively staked',
      bridgeEcosystemFlows: '+$190M net bridge inflows from EVM ecosystems',
      dataAvailability: 'LIVE_VERIFIED'
    },
    thesis: {
      projectOverview: 'Solana is a high-speed monolithic Layer-1 blockchain capable of processing 2,500+ TPS with sub-second finality and nominal sub-cent transaction costs.',
      valueAccrualMechanisms: 'Fee burn (50% base fee burned), staking rewards, priority compute fee capture, and DEX volume velocity.',
      strongestBullishArguments: [
        'Dominant DEX trading volume share, frequently flipping Ethereum mainnet.',
        'Imminent mainnet deployment of Jump Crypto’s Firedancer validator client.',
        'High beta asset of choice for institutional crypto exposure.'
      ],
      strongestBearishArguments: [
        'Higher annual inflation (5.1%) compared to BTC and ETH.',
        'Heavy meme coin speculative dependency in transaction volume mix.'
      ],
      recentDevelopments: [
        'Firedancer Frankendancer client live on mainnet in non-voting mode.',
        'Delta Exchange India reported record SOL perpetual turnover exceeding $100M.'
      ],
      technicalMarketRegime: 'Bullish expansion with clear Higher High and Higher Low progression across daily charts.',
      supplyAndTokenUnlockRisks: 'Moderate inflation (~5.1%), but fully offset by ecosystem staking absorption (>67% staked).',
      macroAndSectorCatalysts: 'Growth in high-frequency DeFi, Solana Mobile Seeker ecosystem, and DePIN projects.',
      upcomingCatalysts: [
        'Full Firedancer client vote validation launch.',
        'Potential US Solana ETF regulatory filings.'
      ],
      risksNext30To90Days: [
        'Network degradation under extreme volatility bursts.',
        'Aggressive fee burn reduction if retail meme trading volume subsides.'
      ],
      invalidationConditions: [
        'Daily close below $142.0 swing low.',
        'Catastrophic validator outage lasting >4 hours.'
      ]
    },
    horizons: {
      '30D': {
        horizon: '30D',
        horizonLabel: '1-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 55,
          targetPriceMin: 178,
          targetPriceMax: 198,
          triggerCondition: 'Breakout above $164 with sustained CVD accumulation.',
          invalidationCondition: 'Rejection back below $151.',
          keyEvidence: ['Record DEX volume share', 'Active address metrics exceeding 3.8M'],
          primaryCatalyst: 'Short squeeze above $164 and continuation toward $185 resistance.'
        },
        base: {
          scenario: 'BASE',
          probability: 30,
          targetPriceMin: 150,
          targetPriceMax: 168,
          triggerCondition: 'Consolidation above 50-day EMA support ($148).',
          invalidationCondition: 'Breakdown below $144.',
          keyEvidence: ['Funding rate stabilizing at 0.01%'],
          primaryCatalyst: 'Consolidation phase between swing levels.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 130,
          targetPriceMax: 142,
          triggerCondition: 'Loss of $148 support triggered by BTC correction.',
          invalidationCondition: 'Immediate bounce above $152.',
          keyEvidence: ['Elevated open interest unwinding'],
          primaryCatalyst: 'High-beta leverage liquidation cascade.'
        },
        expectedValuePrice: 171.2,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'Strong technical momentum and active on-chain usage justify an aggressive research candidate rating for 30D horizon.',
        invalidationCriteria: 'Loss of $148 support on daily close.'
      },
      '60D': {
        horizon: '60D',
        horizonLabel: '2-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 60,
          targetPriceMin: 195,
          targetPriceMax: 230,
          triggerCondition: 'Firedancer mainnet progress and altcoin beta outperformance.',
          invalidationCondition: 'Loss of $140 level.',
          keyEvidence: ['Over 67% of SOL locked in staking', 'Accelerating institutional DeFi flows'],
          primaryCatalyst: 'Ecosystem expansion and institutional ETF narrative.'
        },
        base: {
          scenario: 'BASE',
          probability: 25,
          targetPriceMin: 155,
          targetPriceMax: 185,
          triggerCondition: 'Healthy trend channel continuation.',
          invalidationCondition: 'Breakdown below $135.',
          keyEvidence: ['Steady protocol fee generation'],
          primaryCatalyst: 'Market tracking broader crypto expansion.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 120,
          targetPriceMax: 138,
          triggerCondition: 'Broad market crash or serious validator performance issue.',
          invalidationCondition: 'Rebound above $150.',
          keyEvidence: ['Sudden drop in active wallet activity'],
          primaryCatalyst: 'Macro de-risking event.'
        },
        expectedValuePrice: 194.5,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'Robust 60D fundamentals with 60% probability of breaking above $200.',
        invalidationCriteria: 'Weekly breakdown below $140.'
      },
      '90D': {
        horizon: '90D',
        horizonLabel: '3-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 60,
          targetPriceMin: 220,
          targetPriceMax: 260,
          triggerCondition: 'Price discovery test of previous all-time highs ($260).',
          invalidationCondition: 'Failure to hold $130 on weekly close.',
          keyEvidence: ['TPS throughput scaling to 5,000+ under Firedancer'],
          primaryCatalyst: 'Cycle peak expansion and mainstream consumer app adoption.'
        },
        base: {
          scenario: 'BASE',
          probability: 25,
          targetPriceMin: 165,
          targetPriceMax: 205,
          triggerCondition: 'Steady consolidation near upper cycle boundary.',
          invalidationCondition: 'Breakdown below $130.',
          keyEvidence: ['Resilient decentralized exchange metrics'],
          primaryCatalyst: 'Broader market maturation.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 110,
          targetPriceMax: 135,
          triggerCondition: 'Severe macro bear market onset.',
          invalidationCondition: 'Recovery above $150.',
          keyEvidence: ['Liquidity drain across altcoin ecosystems'],
          primaryCatalyst: 'Global macroeconomic stagflation.'
        },
        expectedValuePrice: 208.0,
        decision: 'STRONG CANDIDATE',
        decisionReason: '60% probability of high-timeframe ATH retest; strong risk-reward thesis.',
        invalidationCriteria: 'Weekly close below $130.'
      }
    }
  },

  AAVE: {
    symbol: 'AAVE',
    name: 'Aave',
    sector: 'Decentralized Finance (DeFi)',
    subCategory: 'Lending & Liquidity Protocol',
    tags: ['defi', 'lending', 'bluechip', 'revenue_generating'],
    hasSpot: false,
    hasPerpetual: true,
    hasOptions: false,
    primaryPerpSymbol: 'AAVEUSD',
    totalContractsCount: 1,
    contracts: [],
    price: 172.23,
    spotPrice: 172.28,
    markPrice: 172.25,
    change24h: 7.15,
    changePct24h: 4.33,
    high24h: 176.50,
    low24h: 164.20,
    volume24h: 62450,
    turnoverUsd24h: 10756338,
    totalOiUsd: 18400000,
    bidAskSpreadUsd: 0.05,
    spreadPct: 0.029,
    depthTopBidsUsd: 850000,
    depthTopAsksUsd: 820000,
    lastUpdated: 'Live Feed (Synced)',
    dataFreshness: 'LIVE',
    decision: 'STRONG CANDIDATE',
    decisionReason: 'Dominant real protocol revenue exceeding $50M annualized, fee-switch activation proposal, v4 roadmap, and clean 1D breakout above $165 accumulation base.',
    riskLevel: 'LOW',
    scores: {
      fundamentals: 95,
      tokenomics: 94,
      technical: 87,
      liquidity: 82,
      onChain: 90,
      derivatives: 84,
      macro: 78,
      newsSentiment: 88,
      riskQuality: 92,
      overallScore: 88.8,
      confidenceScore: 94,
      dataFreshnessPenalty: 0,
      missingDataNotes: []
    },
    tokenomics: {
      circulatingSupply: '14.95M AAVE',
      totalSupply: '16.00M AAVE',
      maxSupply: '16.00M AAVE',
      circulatingPct: 93.4,
      fdvUsd: '$2.75B',
      marketCapUsd: '$2.57B',
      next90dUnlockPct: 0.0,
      nextUnlockDate: 'None (Fully Distributed)',
      vestingCliffDetails: 'Over 93% of supply circulating. No venture cliffs remaining.',
      annualInflationPct: '0.0% (Deflationary buyback proposal underway)',
      stakingRewardsPct: '5.2% APR (Safety Module)',
      tokenBurnsMechanism: 'Ecosystem treasury fee switch allocates protocol revenue toward secondary market buybacks.',
      treasuryReserves: 'Aave DAO treasury holds >$85M in liquid assets and GHO reserves.',
      whaleConcentrationPct: 18.2,
      dilutionRiskLevel: 'LOW'
    },
    technicals: {
      tf1W: { regime: 'BULLISH_EXPANSION', bias: 'BULLISH', keyZone: '$145 - $155' },
      tf1D: { regime: 'BULLISH_EXPANSION', swingHigh: 178.0, swingLow: 154.0, bias: 'BULLISH' },
      tf4H: { structure: 'HH_HL', bosLevel: 175.0, chochLevel: 162.0, bias: 'BULLISH' },
      tf1H: { entryZone: '$168 - $171', orderBlockRange: '$167 - $170', bias: 'BULLISH' },
      supportZones: [165.0, 154.0, 142.0],
      resistanceZones: [180.0, 205.0, 230.0],
      orderBlocks: [
        { type: 'BULLISH_OB', range: '$164 - $168', timeframe: '4H' },
        { type: 'BEARISH_OB', range: '$182 - $188', timeframe: '1D' }
      ],
      fairValueGaps: [
        { type: 'BULLISH_FVG', range: '$166 - $169', status: 'UNFILLED' }
      ],
      liquidityPools: [
        { type: 'EQUAL_HIGHS', level: 179.5, note: 'Resting buy stops above previous local peak' },
        { type: 'SWEEP', level: 161.5, note: 'Low sweep prior to impulsive expansion' }
      ],
      volumeProfile: {
        poc: 169.5,
        vah: 174.0,
        val: 165.0,
        hvn: [169.5, 166.0],
        lvn: [175.5, 160.0]
      },
      vwap: 171.0,
      anchoredVwap: 164.5,
      rsi14: 66.8,
      macd: { macdLine: 4.8, signalLine: 3.2, histogram: 1.6, bias: 'BULLISH' },
      ema20: 166.0,
      ema50: 158.0,
      ema200: 135.0,
      atr14: 7.2,
      relativeStrengthVsBtc: 'OUTPERFORMING',
      relativeStrengthVsEth: 'OUTPERFORMING',
      historicalVolatility30dPct: 48.2,
      maxAdverseExcursionPct: -4.5
    },
    derivatives: {
      openInterestUsd: 18400000,
      openInterestDelta24hUsd: 1950000,
      fundingRate8h: 0.000095,
      annualizedFundingPct: 10.4,
      basisUsd: 0.05,
      basisPct: 0.0003,
      termStructure: 'CONTANGO',
      estimatedLiquidationLongUsd: '$3.2M below $162',
      estimatedLiquidationShortUsd: '$6.5M above $180',
      squeezeRisk: 'SHORT_SQUEEZE_PRONE',
      bidAskImbalancePct: 5.6,
      cvdDeltaTrend: 'AGGRESSIVE_BUYING',
      spotToDerivativesVolRatio: 0.45,
      trappedTradersStatus: 'Bearish liquidity trapped below $168 retest.'
    },
    onChain: {
      activeAddresses24h: '12,400',
      newAddresses24h: '3,100',
      txCount24h: '28,500',
      txValueUsd24h: '$1.4B',
      networkFees24h: '$285,000',
      protocolRevenue24h: '$195,000 (Direct Protocol Revenue)',
      exchangeNetFlowUsd: '-$8.4M (Outflow)',
      flowClassification: 'NET_OUTFLOW_BULLISH',
      whaleAccumulationStatus: 'ACCUMULATING',
      top10WalletsConcentrationPct: '24.1%',
      stakingParticipationPct: '19.4% in Safety Module',
      bridgeEcosystemFlows: 'Deployed across 12 chains with $14B TVL',
      dataAvailability: 'LIVE_VERIFIED'
    },
    thesis: {
      projectOverview: 'Aave is the benchmark decentralized liquidity market protocol enabling autonomous over-collateralized borrowing and lending across Ethereum, Arbitrum, Base, and Avalanche.',
      valueAccrualMechanisms: 'Protocol fee switch redirecting lending spread revenue to AAVE token buybacks and Safety Module stakers.',
      strongestBullishArguments: [
        'Over $14B in Total Value Locked with record real fee generation.',
        'Tokenomics are practically fully diluted (93.4% circulating) with zero venture dump risk.',
        'Aave v4 architecture will unify cross-chain liquidity and eliminate fragmentation.'
      ],
      strongestBearishArguments: [
        'Regulatory scrutiny around decentralized stablecoin GHO peg mechanics.',
        'Smart contract systemic risk in the event of unforeseen exploit.'
      ],
      recentDevelopments: [
        'Aave DAO approved temperature check for Umbrella safety module overhaul.',
        'Delta Exchange India open interest in AAVE perpetuals rose +18% week-over-week.'
      ],
      technicalMarketRegime: 'Bullish market structure breakout above multi-month range resistance ($160).',
      supplyAndTokenUnlockRisks: 'Negligible unlock risk; virtually fixed supply with positive buyback pressure.',
      macroAndSectorCatalysts: 'Rising interest rates in traditional finance expanding decentralized institutional yields.',
      upcomingCatalysts: [
        'Execution of the fee switch buyback mechanism.',
        'Aave v4 mainnet testnet deployment.'
      ],
      risksNext30To90Days: [
        'Bad debt accumulation during severe market liquidation flash crashes.',
        'Macro risk-off appetite damping DeFi borrowing demand.'
      ],
      invalidationConditions: [
        'Daily close below $152 key structure support.',
        'DeFi contract exploit resulting in capital loss.'
      ]
    },
    horizons: {
      '30D': {
        horizon: '30D',
        horizonLabel: '1-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 60,
          targetPriceMin: 195,
          targetPriceMax: 220,
          triggerCondition: 'Clean break above $180 with CVD buying confirmation.',
          invalidationCondition: 'Rejection back below $164.',
          keyEvidence: ['Real revenue expansion', 'Zero unlock overhang'],
          primaryCatalyst: 'Fee switch implementation vote and buyback execution.'
        },
        base: {
          scenario: 'BASE',
          probability: 25,
          targetPriceMin: 165,
          targetPriceMax: 182,
          triggerCondition: 'Healthy backtest of previous range highs ($165-$170).',
          invalidationCondition: 'Breakdown below $158.',
          keyEvidence: ['Steady Safety Module staking retention'],
          primaryCatalyst: 'Range digestion before next expansion leg.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 142,
          targetPriceMax: 155,
          triggerCondition: 'Loss of $160 level under market-wide selloff.',
          invalidationCondition: 'Prompt recovery above $165.',
          keyEvidence: ['Macro crypto selloff dragging high-beta DeFi'],
          primaryCatalyst: 'Leverage deleveraging flush.'
        },
        expectedValuePrice: 193.5,
        decision: 'STRONG CANDIDATE',
        decisionReason: '60% bullish probability with exceptional fundamental value backing and zero dilution risk.',
        invalidationCriteria: 'Loss of $160 on daily close.'
      },
      '60D': {
        horizon: '60D',
        horizonLabel: '2-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 65,
          targetPriceMin: 220,
          targetPriceMax: 260,
          triggerCondition: 'DeFi renaissance narrative gaining traction across institutional allocators.',
          invalidationCondition: 'Failure to hold $155 support.',
          keyEvidence: ['Annualized protocol revenue surpassing $75M'],
          primaryCatalyst: 'Aave v4 testnet and buyback accumulation.'
        },
        base: {
          scenario: 'BASE',
          probability: 20,
          targetPriceMin: 170,
          targetPriceMax: 205,
          triggerCondition: 'Continued steady consolidation.',
          invalidationCondition: 'Breakdown below $150.',
          keyEvidence: ['Net TVL retention above $13B'],
          primaryCatalyst: 'Market tracking BTC beta.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 130,
          targetPriceMax: 152,
          triggerCondition: 'Severe DeFi exploit on major cross-chain bridge.',
          invalidationCondition: 'Recovery above $165.',
          keyEvidence: ['Total DeFi TVL contraction'],
          primaryCatalyst: 'Smart contract contagion.'
        },
        expectedValuePrice: 215.2,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'Strongest fundamentals in decentralized finance; ideal 1-3 month investment thesis.',
        invalidationCriteria: 'Weekly breakdown below $155.'
      },
      '90D': {
        horizon: '90D',
        horizonLabel: '3-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 65,
          targetPriceMin: 250,
          targetPriceMax: 320,
          triggerCondition: 'Aave re-rating toward $5B market capitalization.',
          invalidationCondition: 'Loss of $150 on weekly close.',
          keyEvidence: ['Deflationary token supply dynamics taking effect'],
          primaryCatalyst: 'Institutional DeFi adoption and full v4 deployment.'
        },
        base: {
          scenario: 'BASE',
          probability: 20,
          targetPriceMin: 180,
          targetPriceMax: 230,
          triggerCondition: 'Equilibrium price discovery.',
          invalidationCondition: 'Breakdown below $145.',
          keyEvidence: ['Stable fee yields'],
          primaryCatalyst: 'Consolidation around cyclical mean.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 15,
          targetPriceMin: 125,
          targetPriceMax: 155,
          triggerCondition: 'Systemic macro bear market.',
          invalidationCondition: 'Rebound above $170.',
          keyEvidence: ['Borrowing demand dropping to zero'],
          primaryCatalyst: 'Liquidity freeze.'
        },
        expectedValuePrice: 248.0,
        decision: 'STRONG CANDIDATE',
        decisionReason: 'Clear fundamental moat, superior tokenomics, and 65% bullish probability over 90 days.',
        invalidationCriteria: 'Loss of $150 on weekly close.'
      }
    }
  },

  TIA: {
    symbol: 'TIA',
    name: 'Celestia',
    sector: 'Modular Blockchain Infrastructure',
    subCategory: 'Data Availability Layer',
    tags: ['modular', 'data_availability', 'infrastructure', 'high_unlock_risk'],
    hasSpot: false,
    hasPerpetual: true,
    hasOptions: false,
    primaryPerpSymbol: 'TIAUSD',
    totalContractsCount: 1,
    contracts: [],
    price: 4.85,
    spotPrice: 4.85,
    markPrice: 4.86,
    change24h: -0.32,
    changePct24h: -6.18,
    high24h: 5.25,
    low24h: 4.72,
    volume24h: 1845000,
    turnoverUsd24h: 9140000,
    totalOiUsd: 14200000,
    bidAskSpreadUsd: 0.002,
    spreadPct: 0.041,
    depthTopBidsUsd: 420000,
    depthTopAsksUsd: 580000,
    lastUpdated: 'Live Feed (Synced)',
    dataFreshness: 'LIVE',
    decision: 'AVOID',
    decisionReason: 'Massive upcoming venture token unlock overhang (>80% of current circulating float unlocking in near term), persistent negative CVD, and lower highs across all daily timeframes.',
    riskLevel: 'EXTREME',
    scores: {
      fundamentals: 72,
      tokenomics: 24,
      technical: 38,
      liquidity: 75,
      onChain: 58,
      derivatives: 44,
      macro: 65,
      newsSentiment: 42,
      riskQuality: 28,
      overallScore: 48.2,
      confidenceScore: 92,
      dataFreshnessPenalty: 0,
      missingDataNotes: []
    },
    tokenomics: {
      circulatingSupply: '215.4M TIA',
      totalSupply: '1.08B TIA',
      maxSupply: 'Infinite (8% initial inflation curve)',
      circulatingPct: 19.9,
      fdvUsd: '$5.24B',
      marketCapUsd: '$1.04B',
      next90dUnlockPct: 82.5,
      nextUnlockDate: 'Approaching Major Cliff',
      vestingCliffDetails: 'Massive venture capital and early contributor cliff unlocking ~175M TIA over the next 30-90 days, creating immense structural sell pressure.',
      annualInflationPct: '7.4% initial declining schedule',
      stakingRewardsPct: '9.8% APR',
      tokenBurnsMechanism: 'Nominal transaction fee burn; currently insufficient to offset emissions.',
      treasuryReserves: 'Foundation reserves held for ongoing ecosystem development.',
      whaleConcentrationPct: 58.4,
      dilutionRiskLevel: 'CRITICAL'
    },
    technicals: {
      tf1W: { regime: 'BEARISH_DISTRIBUTION', bias: 'BEARISH', keyZone: '$7.50 - $9.00' },
      tf1D: { regime: 'BEARISH_DISTRIBUTION', swingHigh: 5.80, swingLow: 4.60, bias: 'BEARISH' },
      tf4H: { structure: 'LH_LL', bosLevel: 4.70, chochLevel: 5.45, bias: 'BEARISH' },
      tf1H: { entryZone: '$5.05 - $5.20 (Short Entry)', orderBlockRange: '$5.10 - $5.30', bias: 'BEARISH' },
      supportZones: [4.60, 4.10, 3.50],
      resistanceZones: [5.25, 5.80, 6.50],
      orderBlocks: [
        { type: 'BEARISH_OB', range: '$5.20 - $5.45', timeframe: '4H' },
        { type: 'BULLISH_OB', range: '$4.10 - $4.40', timeframe: '1D' }
      ],
      fairValueGaps: [
        { type: 'BEARISH_FVG', range: '$5.15 - $5.35', status: 'UNFILLED' }
      ],
      liquidityPools: [
        { type: 'EQUAL_LOWS', level: 4.60, note: 'Sell stop liquidity resting below multi-week low' },
        { type: 'EQUAL_HIGHS', level: 5.40, note: 'Weak highs retested and rejected' }
      ],
      volumeProfile: {
        poc: 5.05,
        vah: 5.40,
        val: 4.75,
        hvn: [5.05, 5.25],
        lvn: [4.80, 4.40]
      },
      vwap: 4.92,
      anchoredVwap: 5.35,
      rsi14: 38.4,
      macd: { macdLine: -0.18, signalLine: -0.12, histogram: -0.06, bias: 'BEARISH' },
      ema20: 5.15,
      ema50: 5.65,
      ema200: 7.80,
      atr14: 0.38,
      relativeStrengthVsBtc: 'UNDERPERFORMING',
      relativeStrengthVsEth: 'UNDERPERFORMING',
      historicalVolatility30dPct: 78.4,
      maxAdverseExcursionPct: -14.2
    },
    derivatives: {
      openInterestUsd: 14200000,
      openInterestDelta24hUsd: -1200000,
      fundingRate8h: -0.000310,
      annualizedFundingPct: -33.9,
      basisUsd: -0.015,
      basisPct: -0.003,
      termStructure: 'BACKWARDATION',
      estimatedLiquidationLongUsd: '$4.8M below $4.50',
      estimatedLiquidationShortUsd: '$2.1M above $5.30',
      squeezeRisk: 'LONG_FLUSH_PRONE',
      bidAskImbalancePct: -12.4,
      cvdDeltaTrend: 'AGGRESSIVE_SELLING',
      spotToDerivativesVolRatio: 0.18,
      trappedTradersStatus: 'Late dip buyers trapped above $5.10.'
    },
    onChain: {
      activeAddresses24h: '18,500',
      newAddresses24h: '4,200',
      txCount24h: '94,000',
      txValueUsd24h: '$48M',
      networkFees24h: '$3,800 (Extremely Low Real Fee Capture)',
      protocolRevenue24h: '$1,900',
      exchangeNetFlowUsd: '+$14.2M (Inflow - Pre-Unlock Transfers)',
      flowClassification: 'NET_INFLOW_BEARISH',
      whaleAccumulationStatus: 'DISTRIBUTING',
      top10WalletsConcentrationPct: '54.2%',
      stakingParticipationPct: '58.0% (Unstaking queue expanding)',
      bridgeEcosystemFlows: 'Modular DA rollups posting data but paying nominal fees',
      dataAvailability: 'LIVE_VERIFIED'
    },
    thesis: {
      projectOverview: 'Celestia is a modular consensus and data network designed to let anyone deploy their own rollup blockchain without consensus overhead.',
      valueAccrualMechanisms: 'Rollup developers pay in TIA to post data blobs; stakers validate blocks for inflation and fees.',
      strongestBullishArguments: [
        'Pioneer and first-mover in the modular blockchain thesis.',
        'Low barrier to entry for Cosmos and EVM rollups to post data.'
      ],
      strongestBearishArguments: [
        'Catastrophic token unlock overhang: >80% of float unlocking over the 30-90 day horizon.',
        'Real network fee capture is negligible ($3,800/day), creating zero organic demand buffer against dilution.',
        'Continuous venture OTC dumping and hedging through perpetual futures.'
      ],
      recentDevelopments: [
        'Venture investors moved large allocations to custodial exchanges ahead of vesting date.',
        'Funding rate on Delta Exchange perpetuals shifted deeply negative (-34% annualized).'
      ],
      technicalMarketRegime: 'Sustained Bearish Trend with Lower Highs and Lower Lows across 1D and 4H.',
      supplyAndTokenUnlockRisks: 'CRITICAL: Top unlock risk in the crypto market; impending float expansion.',
      macroAndSectorCatalysts: 'Competition from Ethereum blobs (EIP-4844) reducing Celestia DA cost advantage.',
      upcomingCatalysts: [
        'Massive investor cliff unlock event.',
        'Secondary OTC lockup sales.'
      ],
      risksNext30To90Days: [
        'Cascading sell pressure as unlocked VC tokens hit spot and hedging markets.',
        'Loss of critical $4.00 support.'
      ],
      invalidationConditions: [
        'Daily close above $6.50 confirming complete supply absorption.',
        'Announcement of voluntary multi-year lockup extension by all tier-1 investors.'
      ]
    },
    horizons: {
      '30D': {
        horizon: '30D',
        horizonLabel: '1-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 15,
          targetPriceMin: 5.60,
          targetPriceMax: 6.40,
          triggerCondition: 'Short squeeze squeeze event triggered by extreme negative funding.',
          invalidationCondition: 'Immediate collapse back below $5.00.',
          keyEvidence: ['Derivatives funding at -34% annualized creates squeeze vulnerability'],
          primaryCatalyst: 'Temporary short squeeze before unlock date.'
        },
        base: {
          scenario: 'BASE',
          probability: 45,
          targetPriceMin: 3.80,
          targetPriceMax: 4.60,
          triggerCondition: 'Continued drift downward as pre-unlock hedging expands.',
          invalidationCondition: 'Rebound above $5.30.',
          keyEvidence: ['Exchange inflows accelerating', 'CVD persistent selling'],
          primaryCatalyst: 'Hedging and pre-unlock positioning.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 40,
          targetPriceMin: 2.80,
          targetPriceMax: 3.60,
          triggerCondition: 'Unlock event triggers aggressive spot market liquidation.',
          invalidationCondition: 'V-shape reclaim of $4.20.',
          keyEvidence: ['82% float expansion hitting thin liquidity books'],
          primaryCatalyst: 'Severe supply overhang realization.'
        },
        expectedValuePrice: 3.95,
        decision: 'AVOID',
        decisionReason: 'High unlock dilution risk (82.5% float expansion) creates unfavorable 1-3 month investment profile. Strongly advise avoiding spot accumulation.',
        invalidationCriteria: 'Clean break above $6.20.'
      },
      '60D': {
        horizon: '60D',
        horizonLabel: '2-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 20,
          targetPriceMin: 5.50,
          targetPriceMax: 6.80,
          triggerCondition: 'All unlock supply absorbed by institutional market makers.',
          invalidationCondition: 'Failure to hold $3.80.',
          keyEvidence: ['Ecosystem expansion announcement'],
          primaryCatalyst: 'Post-unlock relief rally.'
        },
        base: {
          scenario: 'BASE',
          probability: 45,
          targetPriceMin: 3.20,
          targetPriceMax: 4.20,
          triggerCondition: 'Prolonged bottoming process under heavy float.',
          invalidationCondition: 'Breakdown below $2.50.',
          keyEvidence: ['Elevated volume with stagnant price action'],
          primaryCatalyst: 'Gradual OTC absorption.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 35,
          targetPriceMin: 2.20,
          targetPriceMax: 3.00,
          triggerCondition: 'Secondary dilution waves and token abandonment.',
          invalidationCondition: 'Reclaim of $4.00.',
          keyEvidence: ['Developer migration to rival DA layers'],
          primaryCatalyst: 'Continuous venture sell pressure.'
        },
        expectedValuePrice: 3.48,
        decision: 'AVOID',
        decisionReason: 'Expected value price ($3.48) is -28% below current CMP ($4.85); avoidance warranted.',
        invalidationCriteria: 'Weekly close above $5.50.'
      },
      '90D': {
        horizon: '90D',
        horizonLabel: '3-Month Outlook',
        bullish: {
          scenario: 'BULLISH',
          probability: 25,
          targetPriceMin: 5.80,
          targetPriceMax: 7.20,
          triggerCondition: 'Complete cycle reset with modular ecosystem explosion.',
          invalidationCondition: 'Breakdown below $3.00.',
          keyEvidence: ['Network fee burning mechanism revamp'],
          primaryCatalyst: 'Ecosystem maturity and relief bounce.'
        },
        base: {
          scenario: 'BASE',
          probability: 45,
          targetPriceMin: 3.00,
          targetPriceMax: 4.00,
          triggerCondition: 'Range-bound accumulation following deep capitulation.',
          invalidationCondition: 'Breakdown below $2.00.',
          keyEvidence: ['Volatility contraction at cycle lows'],
          primaryCatalyst: 'Market digestion of circulating float.'
        },
        bearish: {
          scenario: 'BEARISH',
          probability: 30,
          targetPriceMin: 1.80,
          targetPriceMax: 2.60,
          triggerCondition: 'Continued venture liquidation in a risk-off macro environment.',
          invalidationCondition: 'Recovery above $3.80.',
          keyEvidence: ['Severe open interest deflation'],
          primaryCatalyst: 'Prolonged tokenomics decay.'
        },
        expectedValuePrice: 3.42,
        decision: 'AVOID',
        decisionReason: '75% probability of trading below CMP over the 90-day horizon due to relentless token inflation.',
        invalidationCriteria: 'Weekly close above $5.80.'
      }
    }
  }
};
