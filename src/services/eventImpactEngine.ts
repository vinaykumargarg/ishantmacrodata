/**
 * MARKET NEWS & EVENT IMPACT ENGINE
 * Real-Time 3-Scenario Analysis (Below / In-Line / Above)
 * Complete A-to-Z US News & Economic Events Intelligence:
 * 1. US CPI (Consumer Price Index)
 * 2. FOMC Rate Decision & Powell Conference
 * 3. US Non-Farm Payrolls (NFP) & Unemployment
 * 4. US Core PCE Price Index (Fed's #1 Gauge)
 * 5. US GDP Growth Rate (Quarterly Advance)
 * 6. US PPI (Producer Price Index Pipeline)
 * 7. US Retail Sales (Consumer Spending Engine)
 * 8. Fed Chair Powell Speeches / Jackson Hole
 * 9. US Initial Jobless Claims (Weekly Health)
 * 10. ISM Manufacturing & Services PMI
 *
 * Dedicated Bitcoin (BTC/USD) & Spot Gold (XAU/USD) Momentum Projections:
 * - What is this event & why is it high-impact?
 * - How does the market react & why does volatility/campus happen?
 * - Exactly where can Bitcoin and Gold go (Price targets, support, invalidation)
 * - 15-Minute News Trap Warning & Institutional Rules
 */

import { voiceService } from './voiceSynthesisService';

export interface AssetMomentumForecast {
  direction: 'BULLISH_PUMP' | 'BEARISH_DUMP' | 'SIDEWAYS_CHOP';
  expectedMove: string;
  targetPrice: string;
  targetRange: string;
  keyPivot: string;
  invalidation: string;
  catalystExplanation: string;
}

export interface MacroScenarioOutcome {
  dxy: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  yields10Y: { dir: 'UP' | 'DOWN' | 'CHOP'; bps: string; note: string };
  bitcoin: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  gold: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  equities: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  btcForecast: AssetMomentumForecast;
  goldForecast: AssetMomentumForecast;
  institutionalPlaybook: string;
}

export interface MacroEventData {
  id: string;
  name: string;
  shortName: string;
  country: 'US' | 'EU' | 'UK' | 'GLOBAL';
  category: 'INFLATION' | 'CENTRAL_BANK' | 'EMPLOYMENT' | 'GROWTH' | 'CONSUMPTION' | 'SENTIMENT';
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  releaseDate: string;
  frequency: string;
  countdownSeconds: number;
  previousValue: string;
  consensusForecast: string;
  historicalSurpriseBias: string;

  // Educational & Fundamental Context
  whatIsEvent: {
    hindi: string;
    hinglish: string;
    english: string;
  };
  whyItExists: {
    hindi: string;
    hinglish: string;
    english: string;
  };
  marketReactionMechanism: {
    hindi: string;
    hinglish: string;
    english: string;
  };

  // 3-Scenario Matrix
  scenarios: {
    belowForecast: {
      condition: string;
      outcome: MacroScenarioOutcome;
    };
    inLine: {
      condition: string;
      outcome: MacroScenarioOutcome;
    };
    aboveForecast: {
      condition: string;
      outcome: MacroScenarioOutcome;
    };
  };

  goldTransmission: {
    realYieldDriver: string;
    expectedRange: [number, number];
    keyTriggerLevel: number;
    directionalBias: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'STRONG_BEARISH' | 'CHOP';
  };

  bitcoinTransmission: {
    liquidityDriver: string;
    expectedRange: [number, number];
    keyTriggerLevel: number;
    directionalBias: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'STRONG_BEARISH' | 'CHOP';
  };

  trapWarning: {
    trapType: 'FIRST_MINUTE_WICK_HUNT' | 'SPREAD_EXPANSION_SLIPPAGE' | 'STOP_RUN_REVERSAL' | 'REVISED_PREVIOUS_TRAP';
    mechanism: string;
    safeExecutionWindow: string;
  };
}

export interface VoiceQueryFaq {
  id: string;
  questionHindi: string;
  questionHinglish: string;
  questionEnglish: string;
  answerHindi: string;
  answerHinglish: string;
  answerEnglish: string;
}

export const MACRO_EVENTS_REGISTRY: MacroEventData[] = [
  // 1. US CPI
  {
    id: 'us-cpi',
    name: 'US Consumer Price Index (CPI YoY & Core MoM)',
    shortName: 'US CPI Inflation',
    country: 'US',
    category: 'INFLATION',
    importance: 'CRITICAL',
    releaseDate: 'Wednesday, 08:30 AM EST (18:00 IST)',
    frequency: 'Monthly (Bureau of Labor Statistics)',
    countdownSeconds: 120,
    previousValue: '3.4% YoY (Core 2.4%)',
    consensusForecast: '3.6% YoY (Core 2.5%)',
    historicalSurpriseBias: 'Downside surprise probability 55%, In-line 35%, Upside 10%',

    whatIsEvent: {
      hindi: 'उपभोक्ता मूल्य सूचकांक (CPI) यह मापता है कि अमेरिकी आम नागरिक रोजमर्रा के सामान और सेवाओं (भोजन, पेट्रोल, मकान का किराया, मेडिकल, शिक्षा और कार) के लिए पिछले साल की तुलना में कितना अधिक या कम भुगतान कर रहे हैं। यह अमेरिकी जीवन यापन की लागत का सीधा सूचकांक है।',
      hinglish: 'Consumer Price Index (CPI) aam consumer ki daily basket (food, energy, housing rent, transportation, medical) ke price changes ko measure karta hai. Yeh US economy ka headline inflation benchmark hai jise Bureau of Labor Statistics (BLS) har mahine publish karta hai.',
      english: 'The Consumer Price Index (CPI) measures the average change over time in prices paid by urban consumers for a market basket of goods and services, serving as the benchmark measure of US headline inflation.'
    },

    whyItExists: {
      hindi: 'यह दुनिया की सबसे हाई-इम्पैक्ट न्यूज़ इसलिए है क्योंकि अमेरिकी केंद्रीय बैंक (Federal Reserve) का मुख्य कानूनी जनादेश महंगाई को 2% पर स्थिर रखना है। यदि CPI बढ़ता है, तो फेड ब्याज दरें घटा नहीं सकता और कर्ज महंगा रहता है। यदि CPI गिरता है, तो फेड ब्याज दरों में कटौती (Rate Cuts) करता है जिससे बाज़ार में खरबों डॉलर की सस्ती लिक्विडिटी आती है।',
      hinglish: 'Yeh itni high-impact news isliye hai kyunki Federal Reserve ka strict mandate 2% inflation target hai. Agar CPI hot aati hai toh Fed interest rate cuts delay kar deta hai jisse Dollar Index (DXY) spike karta hai. Agar CPI cool aati hai toh Fed rate cut cycle aggressive ho jati hai jo crypto aur gold ke liye rocket fuel hai.',
      english: 'It is a Tier-1 market mover because the Federal Reserve is legally mandated to achieve 2% price stability. High CPI forces high interest rates, while low CPI triggers rate cuts that expand global monetary liquidity.'
    },

    marketReactionMechanism: {
      hindi: 'मार्केट में हलचल (Kampan / Volatility) का कारण: 1. सीपीआई डेटा स्क्रीन पर आते ही हाई-फ़्रीक्वेंसी एल्गोरिदम्स तुरंत फेड रेट कट की संभावना को री-कैलकुलेट करते हैं। 2. डॉलर इंडेक्स (DXY) और 10-ईयर बॉन्ड यील्ड्स में तीव्र विस्फोट होता है। 3. डॉलर कमजोर होने पर ग्लोबल लिक्विडिटी बिटकॉइन और सोने की तरफ भागती है।',
      hinglish: 'Market Volatility Chain: Data aate hi HFT algorithms milliseconds mein trade karte hain -> CPI soft hone par US Dollar Index (DXY) aur US 10Y Bond Yields crash karte hain -> Dollar weak hone se global liquidity non-sovereign stores of value (Gold) aur high-beta digital gold (Bitcoin) mein flood karti hai.',
      english: 'Volatility Chain: Surprise Print -> Instant Repricing of Fed Funds Futures -> Inversion in DXY & 10Y Yields -> Cross-Asset Reallocation into Bitcoin, Gold, and Equities.'
    },

    scenarios: {
      belowForecast: {
        condition: 'Actual CPI < 3.6% (Soft / Disinflationary Print — Massive Dovish Surprise)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.75% to -1.20%', note: 'DXY dumps below 101.80 as Fed rate cut odds surge to 98%' },
          yields10Y: { dir: 'DOWN', bps: '-10 to -16 bps', note: '10Y Yield dives below 3.96% as duration is aggressively bought' },
          bitcoin: { dir: 'UP', pct: '+3.8% to +6.5%', note: 'Liquidity surge drives BTC to test and sweep $86,000+ resistance' },
          gold: { dir: 'UP', pct: '+1.8% to +2.6%', note: 'Lower real yields propel Gold toward fresh all-time highs above $2,720' },
          equities: { dir: 'UP', pct: '+1.4% to +2.2%', note: 'Tech and Semiconductors (NVDA, QQQ) rally sharply on valuation expansion' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+4.5% to +6.5% Rocket Surge',
            targetPrice: '$87,400',
            targetRange: '$85,800 – $88,200',
            keyPivot: '$83,400',
            invalidation: '4H Candle close below $82,400',
            catalystExplanation: 'Dollar dump hone se stablecoin liquidity crypto order books mein aggressively flood karegi, driving short squeeze across perpetual contracts.'
          },
          goldForecast: {
            direction: 'BULLISH_SURGE',
            expectedMove: '+1.8% to +2.5% All-Time High Run',
            targetPrice: '$2,725',
            targetRange: '$2,695 – $2,735',
            keyPivot: '$2,652',
            invalidation: 'Break below $2,630',
            catalystExplanation: 'US 10-Year real yields collapse hone se non-yielding gold holding cost zero ho jati hai, triggering sovereign central bank & ETF spot inflows.'
          },
          institutionalPlaybook: 'Aggressive LONG on BTC and Spot Gold on first 5-minute pullback; do not attempt counter-trend shorts.'
        }
      },
      inLine: {
        condition: 'Actual CPI = 3.6% (Matches Consensus Exactly — Fully Priced Baseline)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.20%', note: 'DXY consolidates in tight range around 102.50' },
          yields10Y: { dir: 'CHOP', bps: '±3 bps', note: 'Yields remain static as rate expectations are fully priced' },
          bitcoin: { dir: 'CHOP', pct: '±1.5%', note: 'Initial stop-hunt both sides followed by continuation of prevailing 4H trend' },
          gold: { dir: 'CHOP', pct: '±0.6%', note: 'Range trade between $2,640 and $2,670' },
          equities: { dir: 'CHOP', pct: '±0.4%', note: 'Mild sector rotation without broad market expansion' },
          btcForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±1.2% Two-Way Liquidity Sweep',
            targetPrice: '$84,200',
            targetRange: '$83,300 – $84,900',
            keyPivot: '$83,600',
            invalidation: 'Breakout of either $85,000 high or $82,800 low',
            catalystExplanation: 'Market makers headline print par high & low wicks banakar retail stop-losses hunt karenge, phir existing range mein settle honge.'
          },
          goldForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.5% Rangebound Rotation',
            targetPrice: '$2,662',
            targetRange: '$2,648 – $2,675',
            keyPivot: '$2,655',
            invalidation: 'Sustained close outside $2,640–$2,685',
            catalystExplanation: 'Expectations match hone par koi fresh macro catalyst nahi milta, institutional desk existing hedges maintain karte hain.'
          },
          institutionalPlaybook: 'Do not chase market orders on the print. Wait 15 minutes for liquidity sweeps to finish before placing limit orders.'
        }
      },
      aboveForecast: {
        condition: 'Actual CPI > 3.6% (Hot / Sticky Inflation Shock — Hawkish Delay of Rate Cuts)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.85% to +1.45%', note: 'DXY spikes through 103.50 as Fed cut expectations get deferred' },
          yields10Y: { dir: 'UP', bps: '+12 to +18 bps', note: '10Y Yield spikes to 4.25% putting severe pressure on risk assets' },
          bitcoin: { dir: 'DOWN', pct: '-3.2% to -5.8%', note: 'Liquidity drain causes immediate flush into 4H Order Block at $81,000' },
          gold: { dir: 'DOWN', pct: '-1.5% to -2.3%', note: 'Surging real yields trigger temporary algorithmic liquidation toward $2,605' },
          equities: { dir: 'DOWN', pct: '-1.6% to -2.6%', note: 'High-multiple tech stocks and crypto proxies suffer sharp distribution' },
          btcForecast: {
            direction: 'BEARISH_DUMP',
            expectedMove: '-3.5% to -5.8% Liquidation Flush',
            targetPrice: '$81,400',
            targetRange: '$80,800 – $82,200',
            keyPivot: '$84,200',
            invalidation: '4H reclaim above $84,800',
            catalystExplanation: 'Higher inflation means Fed rate cuts delay honge, yields jump karengi aur high-leverage crypto longs mein forced liquidation cascades trigger honge.'
          },
          goldForecast: {
            direction: 'BEARISH_DROP',
            expectedMove: '-1.5% to -2.3% Dollar Pullback',
            targetPrice: '$2,615',
            targetRange: '$2,605 – $2,630',
            keyPivot: '$2,665',
            invalidation: 'Reclaim of $2,675',
            catalystExplanation: 'US Dollar rally hone aur real yields badhne se gold futures mein algorithmic margin unwinding aur hedge selling hoti hai.'
          },
          institutionalPlaybook: 'Look for short scalp setups or wait for institutional capitulation sweep into the $81,000 4H Order Block to buy the deep discount.'
        }
      }
    },

    goldTransmission: {
      realYieldDriver: 'Inverse real yield correlation (-0.88). Every 10 bps drop in US 10Y Real Yield adds ~$25 to spot Gold.',
      expectedRange: [2630, 2735],
      keyTriggerLevel: 2685,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Global M2 and US Dollar liquidity transmission. Dollar weakness triggers instant crypto bidding.',
      expectedRange: [80800, 88200],
      keyTriggerLevel: 84000,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'FIRST_MINUTE_WICK_HUNT',
      mechanism: 'Algorithms intentionally trigger both Buy-Side and Sell-Side stops in the first 60 seconds with wide spreads before establishing the true directional trend.',
      safeExecutionWindow: 'Do NOT trade during 0–3 minutes post-print. Execute after the first 15-minute candle close.'
    }
  },

  // 2. FOMC RATE DECISION
  {
    id: 'us-fomc',
    name: 'FOMC Federal Reserve Interest Rate Decision & Press Conference',
    shortName: 'FOMC Rate Decision',
    country: 'US',
    category: 'CENTRAL_BANK',
    importance: 'CRITICAL',
    releaseDate: 'Wednesday, 02:00 PM EST (23:30 IST)',
    frequency: '8 Times Per Year',
    countdownSeconds: 432000,
    previousValue: '5.00%',
    consensusForecast: '4.75% (-25 bps Rate Cut)',
    historicalSurpriseBias: 'Cut 25 bps expected with 96% certainty; focus is on Powell press conference dot plot guidance.',

    whatIsEvent: {
      hindi: 'फेडरल ओपन मार्केट कमेटी (FOMC) अमेरिकी केंद्रीय बैंक की वह सर्वोच्च नीति-निर्धारक बैठक है जो वैश्विक रिज़र्व करेंसी (अमेरिकी डॉलर) की आधिकारिक ब्याज दरें तय करती है। इसके ठीक 30 मिनट बाद फेड चेयरमैन जेरोम पॉवेल की लाइव प्रेस कॉन्फ्रेंस होती है।',
      hinglish: 'FOMC meeting Federal Reserve ki benchmark interest rate setting body hai. Rate decision ke 30 minute baad Fed Chair Jerome Powell live media briefing dete hain jisme Dot Plot (future rate cut roadmap) reveal hota hai.',
      english: 'The Federal Open Market Committee sets the Federal Funds Rate, directly dictating global borrowing costs and liquidity availability across international financial markets.'
    },

    whyItExists: {
      hindi: 'यह दुनिया का नंबर-1 लिक्विडिटी इवेंट है। दुनिया का 60% वैश्विक व्यापार और अधिकांश ऋण डॉलर में है। ब्याज दर तय करती है कि वैश्विक अर्थव्यवस्था में तरलता (Liquidity) बढ़ेगी या घटेगी। सस्ता पैसा आने पर बिटकॉइन और सोना सबसे तेज़ गति से बढ़ते हैं।',
      hinglish: 'Duniya ka #1 Market Moving Event. Dollar cost determine karta hai ki institutions speculative risk lenge ya nahi. Rate cuts mean trillions of cash moving from money market funds into Bitcoin and Gold.',
      english: 'The cost of US dollar capital dictates risk appetite across all asset classes. Easing cycles unlock institutional cash reserves into sound stores of value.'
    },

    marketReactionMechanism: {
      hindi: 'रिएक्शन का क्रम: रात 11:30 बजे ब्याज दर का ऐलान (अक्सर फेकआउट व्हिपसॉ) -> रात 12:00 बजे पॉवेल की लाइव प्रेस कॉन्फ्रेंस -> आने वाले महीनों में कितने रेट कट होंगे उसका संकेत -> डॉलर और बॉन्ड यील्ड्स का वास्तविक ट्रेंड -> बिटकॉइन और सोने में 6% से 10% की विशाल छलांग या गिरावट।',
      hinglish: 'Two-Stage Reaction: 11:30 PM statement aate hi first fakeout wick banti hai. Real institutional trend 12:00 AM press conference mein banta hai jab Powell rate trajectory clarify karte hain.',
      english: 'Two-Stage Volatility: Initial statement triggers short-lived volatility sweeps; primary macro trend emerges during Chair Powell’s live press conference questioning.'
    },

    scenarios: {
      belowForecast: {
        condition: 'Dovish Surprise: 50 bps Cut or Powell telegraphs aggressive rapid cuts ahead',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-1.3% to -2.0%', note: 'Dollar breakdown across all G10 currency pairs' },
          yields10Y: { dir: 'DOWN', bps: '-16 to -24 bps', note: 'Yield curve bull steepens aggressively' },
          bitcoin: { dir: 'UP', pct: '+6.5% to +10.5%', note: 'Parabolic crypto impulse as monetary easing accelerates' },
          gold: { dir: 'UP', pct: '+2.8% to +4.0%', note: 'Sustained institutional central bank buying momentum' },
          equities: { dir: 'UP', pct: '+2.2% to +3.5%', note: 'Broad equity all-time high expansion' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+7.0% to +10.5% Mega Parabolic Expansion',
            targetPrice: '$91,500',
            targetRange: '$88,000 – $92,500',
            keyPivot: '$84,000',
            invalidation: 'Break below $82,500',
            catalystExplanation: 'Aggressive liquidity easing unlocks massive institutional capital into Bitcoin spot ETFs and offshore perpetuals.'
          },
          goldForecast: {
            direction: 'BULLISH_SURGE',
            expectedMove: '+2.8% to +4.0% Explosive ATH Rally',
            targetPrice: '$2,760',
            targetRange: '$2,730 – $2,780',
            keyPivot: '$2,670',
            invalidation: 'Break below $2,640',
            catalystExplanation: 'Rapid fiat currency debasement fear ignites massive sovereign wealth fund and treasury hedging.'
          },
          institutionalPlaybook: 'Hold core swing longs and trail stop loss to previous 4H swing lows; do not sell premature profits.'
        }
      },
      inLine: {
        condition: 'Expected 25 bps Cut with Balanced / Neutral Powell Guidance',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.40%', note: 'Mild fluctuations as guidance matches baseline' },
          yields10Y: { dir: 'CHOP', bps: '±4 bps', note: 'Curve remains stable' },
          bitcoin: { dir: 'CHOP', pct: '±2.0%', note: 'Volatile swings during Powell Q&A, settling positive' },
          gold: { dir: 'CHOP', pct: '±0.8%', note: 'Drifts upward steadily' },
          equities: { dir: 'CHOP', pct: '±0.6%', note: 'Index flat, single stocks driven by earnings' },
          btcForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±2.0% Volatile Whipsaw during Q&A',
            targetPrice: '$84,800',
            targetRange: '$83,000 – $86,000',
            keyPivot: '$83,800',
            invalidation: '4H close outside $82,500–$86,500',
            catalystExplanation: 'Powell ke har sentence par algos 500-dollar swings banayenge jab tak press conference end nahi hoti.'
          },
          goldForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.8% Steady Upward Drift',
            targetPrice: '$2,675',
            targetRange: '$2,655 – $2,690',
            keyPivot: '$2,660',
            invalidation: 'Break below $2,635',
            catalystExplanation: 'Priced-in trajectory confirms gradual easing, maintaining structural bull market in bullion.'
          },
          institutionalPlaybook: 'Wait until Jerome Powell concludes the 45-minute press conference before entering new positions.'
        }
      },
      aboveForecast: {
        condition: 'Hawkish Surprise: Rate Pause (0 bps cut) or Powell warns inflation is sticky',
        outcome: {
          dxy: { dir: 'UP', pct: '+1.6% to +2.4%', note: 'Massive short-squeeze in DXY toward 104.50' },
          yields10Y: { dir: 'UP', bps: '+22 to +30 bps', note: 'Sharp bear flattening shock' },
          bitcoin: { dir: 'DOWN', pct: '-6.0% to -9.5%', note: 'Leveraged long squeeze wiping over $400M in open interest' },
          gold: { dir: 'DOWN', pct: '-2.5% to -3.8%', note: 'Temporary dollar spike triggers stop-loss sweeps' },
          equities: { dir: 'DOWN', pct: '-2.8% to -4.0%', note: 'Sharp risk-off liquidation across risk curves' },
          btcForecast: {
            direction: 'BEARISH_DUMP',
            expectedMove: '-6.0% to -9.5% Cascading Long Squeeze',
            targetPrice: '$78,500',
            targetRange: '$77,500 – $79,800',
            keyPivot: '$84,500',
            invalidation: 'Reclaim of $85,000',
            catalystExplanation: 'Higher-for-longer dollar yields force multi-billion dollar de-leveraging in crypto derivative markets.'
          },
          goldForecast: {
            direction: 'BEARISH_DROP',
            expectedMove: '-2.5% to -3.8% Liquidity Shakedown',
            targetPrice: '$2,580',
            targetRange: '$2,570 – $2,605',
            keyPivot: '$2,650',
            invalidation: 'Reclaim of $2,660',
            catalystExplanation: 'Rising bond yields increase opportunity cost, forcing macro funds to temporarily reduce gold exposure.'
          },
          institutionalPlaybook: 'Immediately de-risk high-beta altcoins; place patient limit bids in deeply discounted 4H Order Blocks.'
        }
      }
    },

    goldTransmission: {
      realYieldDriver: 'Fed funds rate trajectory directly dictates gold holding opportunity cost.',
      expectedRange: [2570, 2780],
      keyTriggerLevel: 2660,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Bitcoin acts as the purest liquidity sponge in global finance.',
      expectedRange: [77500, 92500],
      keyTriggerLevel: 83500,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'STOP_RUN_REVERSAL',
      mechanism: 'The 2:00 PM statement release often creates a fake initial move, which is completely reversed at 2:30 PM when Powell speaks during the live press conference.',
      safeExecutionWindow: 'Never execute before 3:15 PM EST (post-conference).'
    }
  },

  // 3. US NFP & UNEMPLOYMENT
  {
    id: 'us-nfp',
    name: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
    shortName: 'US NFP Jobs Report',
    country: 'US',
    category: 'EMPLOYMENT',
    importance: 'CRITICAL',
    releaseDate: 'First Friday of Month, 08:30 AM EST (18:00 IST)',
    frequency: 'Monthly (BLS)',
    countdownSeconds: 220000,
    previousValue: '254K',
    consensusForecast: '145K',
    historicalSurpriseBias: 'High volatility print; average initial 5-minute BTC swing is 1.8%',

    whatIsEvent: {
      hindi: 'नॉन-फार्म पेरोल्स (NFP) अमेरिकी अर्थव्यवस्था की रोजगार रिपोर्ट है जो यह बताती है कि कृषि क्षेत्र को छोड़कर पिछले महीने अमेरिका में कितनी नई नौकरियां जुड़ीं, प्रति घंटा औसत वेतन कितना बढ़ा, और आधिकारिक बेरोजगारी दर क्या रही।',
      hinglish: 'Non-Farm Payrolls (NFP) US labor market ki monthly pulse report hai. Isme net job creation, Average Hourly Earnings (wage inflation), aur Unemployment Rate disclose hota hai.',
      english: 'Non-Farm Payrolls measures net payroll additions across the US non-farm economy, alongside wage growth and the official unemployment percentage.'
    },

    whyItExists: {
      hindi: 'फेडरल रिजर्व का दूसरा मुख्य स्तंभ "अधिकतम रोजगार" है। यदि नौकरियां अचानक गिरने लगती हैं, तो मंदी के डर से फेड को तुरंत आपातकालीन दर कटौती (Emergency Rate Cuts) करनी पड़ती है। यदि नौकरियां बहुत अधिक आती हैं, तो वेतन बढ़ने से महंगाई भड़कने का डर रहता है।',
      hinglish: 'Fed ka dual mandate employment par nirbhar karta hai. Labor market deteriorate hote hi Fed ko liquidity pump karni padti hai. Strong jobs report economic resilience show karti hai lekin rate cuts ko delay kar sakti hai.',
      english: 'The labor market gauges recessionary versus expansionary momentum, directly calibrating the speed and depth of central bank easing.'
    },

    marketReactionMechanism: {
      hindi: 'हलचल का कारण: कमजोर नौकरियां -> मंदी की आशंका लेकिन तेज दर कटौती की उम्मीद -> डॉलर इंडेक्स में गिरावट -> सोना सेफ हेवन और कम यील्ड के कारण उछलता है, और बिटकॉइन में लिक्विडिटी बूस्ट आता है। बहुत गर्म नौकरियां -> डॉलर उछलता है -> क्रिप्टो व गोल्ड में तात्कालिक गिरावट।',
      hinglish: 'Reaction Dynamics: Soft jobs print triggers DXY collapse, pushing Gold as safe haven + yield beneficiary, and sending Bitcoin higher on rate cut acceleration.',
      english: 'Soft labor prints weaken the USD and depress bond yields, expanding capital allocations into gold and speculative crypto assets.'
    },

    scenarios: {
      belowForecast: {
        condition: 'Actual NFP < 120K (Weak Labor Market — Accelerates Fed Easing Cycle)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.60% to -1.00%', note: 'Labor softening cements urgent Fed rate cutting cycle' },
          yields10Y: { dir: 'DOWN', bps: '-8 to -14 bps', note: 'Growth fears trigger bond rally' },
          bitcoin: { dir: 'UP', pct: '+2.8% to +4.5%', note: 'Monetary easing tailwind overpowers growth concern' },
          gold: { dir: 'UP', pct: '+1.4% to +2.2%', note: 'Safe haven + rate cut double tailwind' },
          equities: { dir: 'CHOP', pct: '±0.8%', note: 'Rate cut hope battles recession risk' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+3.0% to +4.8% Easing Tailwinds',
            targetPrice: '$86,200',
            targetRange: '$85,000 – $87,000',
            keyPivot: '$83,600',
            invalidation: '4H close below $82,800',
            catalystExplanation: 'Labor weakness Fed ko rate cut fast karne par majboor karti hai, providing liquidity boost to crypto.'
          },
          goldForecast: {
            direction: 'BULLISH_SURGE',
            expectedMove: '+1.5% to +2.2% Dual Tailwind Rally',
            targetPrice: '$2,710',
            targetRange: '$2,685 – $2,725',
            keyPivot: '$2,655',
            invalidation: 'Break below $2,635',
            catalystExplanation: 'Safe haven demand + declining real yields create the ideal fundamental environment for Gold.'
          },
          institutionalPlaybook: 'Favor Spot Gold over Equities on weak labor data; buy BTC on confirmed 15M candle close.'
        }
      },
      inLine: {
        condition: 'Actual NFP between 135K and 160K (Goldilocks print — Stable Growth)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.25%', note: 'Stable conditions' },
          yields10Y: { dir: 'CHOP', bps: '±3 bps', note: 'Soft landing scenario reinforced' },
          bitcoin: { dir: 'UP', pct: '+1.5% to +2.8%', note: 'Goldilocks environment is ideal for crypto risk appetite' },
          gold: { dir: 'CHOP', pct: '±0.5%', note: 'Consolidates' },
          equities: { dir: 'UP', pct: '+1.0% to +1.6%', note: 'Soft landing scenario propels corporate earnings outlook' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+1.8% to +2.8% Steady Trend Expansion',
            targetPrice: '$85,400',
            targetRange: '$84,200 – $85,900',
            keyPivot: '$83,800',
            invalidation: 'Break below $83,000',
            catalystExplanation: 'Goldilocks condition (economy not too hot, not too cold) provides the best background for 4H swing continuation.'
          },
          goldForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.5% Stable Range',
            targetPrice: '$2,668',
            targetRange: '$2,650 – $2,680',
            keyPivot: '$2,658',
            invalidation: 'Close outside $2,640–$2,690',
            catalystExplanation: 'No panic and no inflation spike means gold trades along its prevailing macro technical channel.'
          },
          institutionalPlaybook: 'Strongest scenario for USA Tech & 4H Delta Swing Setups.'
        }
      },
      aboveForecast: {
        condition: 'Actual NFP > 190K (Hot Labor Resilience — Delay in Aggressive Rate Cuts)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.75% to +1.20%', note: 'Strong economy delays aggressive easing expectations' },
          yields10Y: { dir: 'UP', bps: '+9 to +15 bps', note: 'Yields jump on strong consumer spending prospects' },
          bitcoin: { dir: 'DOWN', pct: '-2.2% to -3.8%', note: 'Initial knee-jerk drop on yield spike' },
          gold: { dir: 'DOWN', pct: '-1.2% to -1.9%', note: 'Pressure from rising dollar' },
          equities: { dir: 'CHOP', pct: '±0.5%', note: 'Higher rates offset by strong economic demand' },
          btcForecast: {
            direction: 'BEARISH_DUMP',
            expectedMove: '-2.5% to -3.8% Knee-Jerk Liquidation',
            targetPrice: '$82,200',
            targetRange: '$81,500 – $82,900',
            keyPivot: '$84,000',
            invalidation: 'Reclaim of $84,600',
            catalystExplanation: 'Yield surge triggers instant liquidation in leveraged longs before value buyers step in at discount.'
          },
          goldForecast: {
            direction: 'BEARISH_DROP',
            expectedMove: '-1.2% to -1.9% Pullback',
            targetPrice: '$2,630',
            targetRange: '$2,620 – $2,645',
            keyPivot: '$2,670',
            invalidation: 'Reclaim of $2,680',
            catalystExplanation: 'Strong dollar rally leads to profit taking and futures hedging.'
          },
          institutionalPlaybook: 'Wait for the initial flush to buy discounted crypto and gold dips at support order blocks.'
        }
      }
    },

    goldTransmission: {
      realYieldDriver: 'Strong employment pushes rate cut expectations out, exerting downward pressure on Gold.',
      expectedRange: [2620, 2725],
      keyTriggerLevel: 2670,
      directionalBias: 'CHOP'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Goldilocks payroll numbers fuel bull swings, extreme deviations cause brief whipsaws.',
      expectedRange: [81500, 87000],
      keyTriggerLevel: 84000,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'SPREAD_EXPANSION_SLIPPAGE',
      mechanism: 'Broker spreads and futures order books thin out 30 seconds prior to 8:30 AM EST, causing up to 0.8% slippage on stop orders.',
      safeExecutionWindow: 'Use limit orders only; avoid market entries during the first 10 minutes.'
    }
  },

  // 4. US CORE PCE PRICE INDEX
  {
    id: 'us-core-pce',
    name: 'US Core PCE Price Index (Fed’s #1 Preferred Inflation Gauge)',
    shortName: 'Core PCE Price Index',
    country: 'US',
    category: 'INFLATION',
    importance: 'CRITICAL',
    releaseDate: 'Last Friday of Month, 08:30 AM EST (18:00 IST)',
    frequency: 'Monthly (BEA)',
    countdownSeconds: 518400,
    previousValue: '2.7%',
    consensusForecast: '2.6%',
    historicalSurpriseBias: 'Downside surprise probability 45%, In-line 45%, Upside 10%',

    whatIsEvent: {
      hindi: 'कोर पीसीई (Personal Consumption Expenditures) अमेरिकी वाणिज्य मंत्रालय (BEA) द्वारा जारी किया जाने वाला वह महंगाई सूचकांक है जिसे फेडरल रिजर्व अपने 2% लक्ष्य के लिए आधिकारिक तौर पर सबसे ज़्यादा महत्व देता है। इसमें अस्थिर खाद्य और ऊर्जा को बाहर रखा जाता है।',
      hinglish: 'Core PCE Price Index Federal Reserve ka official #1 preferred inflation gauge hai. CPI ke mukable yeh consumer ke actual spending substitution ko capture karta hai aur Fed isi metric ko dekh kar interest rates decide karta hai.',
      english: 'The Core Personal Consumption Expenditures (PCE) Price Index excludes food and energy, representing the Federal Reserve’s official metric for tracking progress toward the 2% inflation target.'
    },

    whyItExists: {
      hindi: 'फेड के अधिकारी अपने सभी आधिकारिक बयानों और अनुमानों में CPI के बजाय Core PCE का हवाला देते हैं। जब Core PCE 2.6% से नीचे आता है, तो फेड के पास रेट कट करने का आधिकारिक कानूनी आधार बन जाता है।',
      hinglish: 'Fed Chair Powell aur Federal Open Market Committee officially Core PCE ko target karte hain. Isme drop aate hi monetary policy easing green-light ho jati hai.',
      english: 'The Fed officially anchors policy to Core PCE. Any sustained deceleration below 2.5% signals aggressive monetary expansion.'
    },

    marketReactionMechanism: {
      hindi: 'हलचल का कारण: Core PCE कम आता है -> फेड के रेट कट पर पक्की मुहर -> डॉलर इंडेक्स में गिरावट -> बॉन्ड यील्ड्स नीचे -> बिटकॉइन $87,000+ की तरफ दौड़ता है और सोना $2,720+ पर नया रिकॉर्ड बनाता है।',
      hinglish: 'Transmission: Soft Core PCE directly lowers the terminal Fed funds rate, collapsing real rates and causing immediate institutional bids in BTC and Gold.',
      english: 'Direct monetary transmission: Core PCE deceleration triggers immediate yield curve repricing and real interest rate declines.'
    },

    scenarios: {
      belowForecast: {
        condition: 'Core PCE < 2.6% (Clear Disinflation Path to 2%)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.70% to -1.10%', note: 'DXY plummets on guaranteed rate cut sequence' },
          yields10Y: { dir: 'DOWN', bps: '-9 to -15 bps', note: 'Duration heavily bid' },
          bitcoin: { dir: 'UP', pct: '+3.5% to +5.5%', note: 'Institutional spot buying sweeps swing highs' },
          gold: { dir: 'UP', pct: '+1.6% to +2.4%', note: 'Surges toward all-time highs' },
          equities: { dir: 'UP', pct: '+1.3% to +2.0%', note: 'High valuation tech stocks rally' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+4.0% to +5.8% Macro Rally',
            targetPrice: '$86,900',
            targetRange: '$85,500 – $87,800',
            keyPivot: '$83,600',
            invalidation: '4H candle close below $82,600',
            catalystExplanation: 'Official Fed gauge confirmed cooling unlocks massive multi-week macro funds allocation into Bitcoin.'
          },
          goldForecast: {
            direction: 'BULLISH_SURGE',
            expectedMove: '+1.6% to +2.4% ATH Push',
            targetPrice: '$2,720',
            targetRange: '$2,690 – $2,735',
            keyPivot: '$2,650',
            invalidation: 'Break below $2,630',
            catalystExplanation: 'Lower real yield backdrop solidifies gold structurally as the ultimate store of value.'
          },
          institutionalPlaybook: 'Strong swing long continuation signal; add to winners on first 15-minute pullback.'
        }
      },
      inLine: {
        condition: 'Core PCE = 2.6% (Consensus Match)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.20%', note: 'Rangebound' },
          yields10Y: { dir: 'CHOP', bps: '±3 bps', note: 'Stable' },
          bitcoin: { dir: 'CHOP', pct: '±1.2%', note: 'Trend continuation' },
          gold: { dir: 'CHOP', pct: '±0.4%', note: 'Consolidates' },
          equities: { dir: 'CHOP', pct: '±0.3%', note: 'Flat' },
          btcForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±1.2% Mild Rotation',
            targetPrice: '$84,400',
            targetRange: '$83,400 – $85,000',
            keyPivot: '$83,500',
            invalidation: 'Break below $82,800',
            catalystExplanation: 'Priced in baseline; market respects existing 4H support levels.'
          },
          goldForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.4% Consolidation',
            targetPrice: '$2,665',
            targetRange: '$2,650 – $2,675',
            keyPivot: '$2,652',
            invalidation: 'Break below $2,635',
            catalystExplanation: 'Equilibrium maintained across physical bullion and futures markets.'
          },
          institutionalPlaybook: 'Maintain current swing trading bias; avoid aggressive chasing.'
        }
      },
      aboveForecast: {
        condition: 'Core PCE > 2.7% (Persistent Sticky Services Inflation)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.80% to +1.30%', note: 'Hawkish repricing' },
          yields10Y: { dir: 'UP', bps: '+10 to +16 bps', note: 'Yield curve spikes' },
          bitcoin: { dir: 'DOWN', pct: '-2.8% to -4.5%', note: 'Speculative flush into key order block' },
          gold: { dir: 'DOWN', pct: '-1.3% to -2.0%', note: 'Dollar strength shakedown' },
          equities: { dir: 'DOWN', pct: '-1.4% to -2.2%', note: 'Tech profit taking' },
          btcForecast: {
            direction: 'BEARISH_DUMP',
            expectedMove: '-2.8% to -4.5% Flash Pullback',
            targetPrice: '$81,900',
            targetRange: '$81,200 – $82,800',
            keyPivot: '$84,200',
            invalidation: 'Reclaim of $84,800',
            catalystExplanation: 'Fed rate cuts delayed until next quarter forces temporary profit taking in crypto.'
          },
          goldForecast: {
            direction: 'BEARISH_DROP',
            expectedMove: '-1.3% to -2.0% Retest',
            targetPrice: '$2,625',
            targetRange: '$2,615 – $2,640',
            keyPivot: '$2,665',
            invalidation: 'Reclaim of $2,675',
            catalystExplanation: 'Dollar spike increases short term margin costs on gold futures.'
          },
          institutionalPlaybook: 'Wait for the initial liquidation sweep into the $81,500 level before re-entering longs.'
        }
      }
    },

    goldTransmission: {
      realYieldDriver: 'Direct driver of Fed real interest rate expectations.',
      expectedRange: [2620, 2735],
      keyTriggerLevel: 2670,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Institutional capital flows closely follow the Core PCE trend trajectory.',
      expectedRange: [81200, 87800],
      keyTriggerLevel: 83800,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'REVISED_PREVIOUS_TRAP',
      mechanism: 'The BEA often quietly revises previous months’ PCE data by 0.1%–0.2%, creating a deceptive initial price reaction before markets digest the net revision.',
      safeExecutionWindow: 'Wait 10 minutes post-release to inspect the net two-month revision sum.'
    }
  },

  // 5. US GDP GROWTH RATE
  {
    id: 'us-gdp',
    name: 'US Gross Domestic Product (GDP Annualized Growth Rate)',
    shortName: 'US GDP Growth',
    country: 'US',
    category: 'GROWTH',
    importance: 'HIGH',
    releaseDate: 'Quarterly, 08:30 AM EST (18:00 IST)',
    frequency: 'Quarterly (Advance, Second, Final)',
    countdownSeconds: 864000,
    previousValue: '3.0%',
    consensusForecast: '2.8%',
    historicalSurpriseBias: 'Resilient growth above 2.5% probability 65%',

    whatIsEvent: {
      hindi: 'सकल घरेलू उत्पाद (GDP) अमेरिका में उत्पादित सभी वस्तुओं और सेवाओं का कुल मौद्रिक मूल्य है। यह दुनिया की सबसे बड़ी $28 ट्रिलियन अर्थव्यवस्था की समग्र आर्थिक गति और मंदी के जोखिम को मापता है।',
      hinglish: 'Gross Domestic Product (GDP) US economy ka total output aur health scorecard hai. Isse pata chalta hai ki economy expand ho rahi hai ya recession (mandi) mein ja rahi hai.',
      english: 'Gross Domestic Product measures the annualized monetary value of all finished goods and services produced within the United States.'
    },

    whyItExists: {
      hindi: 'यदि जीडीपी नकारात्मक हो जाए, तो आधिकारिक मंदी घोषित होती है। यदि विकास मजबूत (2.5%+) रहता है, तो कॉर्पोरेट मुनाफा बढ़ता है और बाजार को "सॉफ्ट लैंडिंग" का भरोसा मिलता है।',
      hinglish: 'GDP indicates Soft Landing vs Recession. Strong growth without runaway inflation (Goldilocks) is the premier macro setup for tech stocks and Bitcoin bull markets.',
      english: 'GDP validates whether the economy is achieving a soft landing or entering contraction, guiding corporate earnings expectations.'
    },

    marketReactionMechanism: {
      hindi: 'हलचल का कारण: संतुलित जीडीपी (2.5%–3%) -> अमेरिकी कॉर्पोरेट कमाई मजबूत -> बिटकॉइन और टेक स्टॉक्स में तेजी। बहुत कमजोर जीडीपी (<1%) -> मंदी का खौफ -> गोल्ड सेफ हेवन बनकर दौड़ता है।',
      hinglish: 'Reaction Dynamics: Robust growth with moderating inflation keeps risk-on active for Bitcoin. Severe contraction triggers flight-to-safety into Gold and Treasury bonds.',
      english: 'Growth resilience sustains risk appetite in equities and crypto, while unexpected deceleration redirects capital into physical gold safe-havens.'
    },

    scenarios: {
      belowForecast: {
        condition: 'Actual GDP < 2.0% (Economic Slowdown / Growth Scare)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.50% to -0.80%', note: 'Growth deceleration weighs on USD' },
          yields10Y: { dir: 'DOWN', bps: '-6 to -11 bps', note: 'Flight to safety' },
          bitcoin: { dir: 'CHOP', pct: '±1.5%', note: 'Growth concerns offset rate cut hopes' },
          gold: { dir: 'UP', pct: '+1.2% to +1.8%', note: 'Safe haven demand activates' },
          equities: { dir: 'DOWN', pct: '-1.0% to -1.8%', note: 'Earnings revisions' },
          btcForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±1.5% Conflicted Reaction',
            targetPrice: '$83,800',
            targetRange: '$82,800 – $84,800',
            keyPivot: '$83,400',
            invalidation: 'Break below $82,200',
            catalystExplanation: 'Rate cut tailwind battles corporate earnings growth slowdown.'
          },
          goldForecast: {
            direction: 'BULLISH_SURGE',
            expectedMove: '+1.2% to +1.8% Safe Haven Run',
            targetPrice: '$2,705',
            targetRange: '$2,680 – $2,720',
            keyPivot: '$2,655',
            invalidation: 'Break below $2,640',
            catalystExplanation: 'Macro uncertainty and lower growth incentivize capital flight into physical gold.'
          },
          institutionalPlaybook: 'Favor Spot Gold over Equities; hold defensive crypto positions.'
        }
      },
      inLine: {
        condition: 'Actual GDP between 2.6% and 3.0% (Goldilocks Soft Landing)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.20%', note: 'Balanced' },
          yields10Y: { dir: 'CHOP', bps: '±3 bps', note: 'Steady' },
          bitcoin: { dir: 'UP', pct: '+1.8% to +3.0%', note: 'Ideal expansion conditions' },
          gold: { dir: 'CHOP', pct: '±0.5%', note: 'Stable' },
          equities: { dir: 'UP', pct: '+1.0% to +1.6%', note: 'Earnings expansion' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+2.0% to +3.2% Bull Continuation',
            targetPrice: '$85,800',
            targetRange: '$84,500 – $86,400',
            keyPivot: '$83,600',
            invalidation: 'Break below $82,800',
            catalystExplanation: 'Healthy growth confirms high risk tolerance among institutional fund managers.'
          },
          goldForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.5% Consolidation',
            targetPrice: '$2,670',
            targetRange: '$2,655 – $2,685',
            keyPivot: '$2,658',
            invalidation: 'Break below $2,640',
            catalystExplanation: 'Stable macroeconomic backdrop keeps gold trending steadily higher.'
          },
          institutionalPlaybook: 'Best scenario for 4H Swing Longs on US Stocks and Bitcoin.'
        }
      },
      aboveForecast: {
        condition: 'Actual GDP > 3.2% (Overheating Resilience)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.60% to +1.00%', note: 'USD strengthens' },
          yields10Y: { dir: 'UP', bps: '+8 to +13 bps', note: 'Higher for longer' },
          bitcoin: { dir: 'DOWN', pct: '-1.5% to -2.8%', note: 'Temporary dollar pressure' },
          gold: { dir: 'DOWN', pct: '-0.8% to -1.4%', note: 'Dollar headwind' },
          equities: { dir: 'CHOP', pct: '±0.6%', note: 'Strong revenue vs high yields' },
          btcForecast: {
            direction: 'BEARISH_DUMP',
            expectedMove: '-1.8% to -2.8% Dollar Drag',
            targetPrice: '$82,800',
            targetRange: '$82,200 – $83,400',
            keyPivot: '$84,000',
            invalidation: 'Reclaim of $84,600',
            catalystExplanation: 'Strong growth causes yields to rise, temporarily pulling liquidity from high-beta crypto.'
          },
          goldForecast: {
            direction: 'BEARISH_DROP',
            expectedMove: '-0.8% to -1.4% Pullback',
            targetPrice: '$2,645',
            targetRange: '$2,635 – $2,660',
            keyPivot: '$2,670',
            invalidation: 'Reclaim of $2,680',
            catalystExplanation: 'Rising yields and strong dollar create short-term profit taking pressure.'
          },
          institutionalPlaybook: 'Buy discounted dips at confirmed support order blocks.'
        }
      }
    },

    goldTransmission: {
      realYieldDriver: 'Growth shocks affect both safe haven demand and real yield assumptions.',
      expectedRange: [2635, 2720],
      keyTriggerLevel: 2665,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Goldilocks growth drives secular bull expansions in Bitcoin.',
      expectedRange: [82200, 86400],
      keyTriggerLevel: 83600,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'FIRST_MINUTE_WICK_HUNT',
      mechanism: 'GDP revisions (e.g. inventories vs real final sales) create conflicting initial interpretations between retail and institutions.',
      safeExecutionWindow: 'Examine Real Final Sales to Domestic Purchasers before executing.'
    }
  },

  // 6. US PPI (PRODUCER PRICE INDEX)
  {
    id: 'us-ppi',
    name: 'US Producer Price Index (PPI Pipeline Wholesale Inflation)',
    shortName: 'US PPI Wholesale Inflation',
    country: 'US',
    category: 'INFLATION',
    importance: 'HIGH',
    releaseDate: 'Monthly, 08:30 AM EST (18:00 IST)',
    frequency: 'Monthly (BLS)',
    countdownSeconds: 1200000,
    previousValue: '1.8%',
    consensusForecast: '1.6%',
    historicalSurpriseBias: 'Downside surprise probability 50%, In-line 40%',

    whatIsEvent: {
      hindi: 'उत्पादक मूल्य सूचकांक (PPI) यह मापता है कि फैक्ट्रियों और उत्पादकों को कच्चा माल और उत्पादन सेवाएं किस कीमत पर मिल रही हैं। यह थोक महंगाई (Wholesale Inflation) है जो 30 से 60 दिन बाद सीधे CPI में बदलती है।',
      hinglish: 'Producer Price Index (PPI) wholesale factory-gate price pressures ko measure karta hai. Yeh CPI ka leading indicator hai kyunki producers apni badhi hui costs agle mahine consumer par pass-on karte hain.',
      english: 'The Producer Price Index measures the average change over time in the selling prices received by domestic producers for their output, acting as a leading indicator for CPI.'
    },

    whyItExists: {
      hindi: 'यदि फैक्ट्रियों की लागत गिरती है, तो इसका मतलब है कि आने वाले महीनों में CPI भी गिरेगा। संस्थागत व्यापारी PPI को देखकर ही तय कर लेते हैं कि अगले महीने का CPI कैसा रहेगा।',
      hinglish: 'Smart money PPI se agle mahine ke CPI aur PCE ka forecast karti hai. PPI cooling ka matlab guaranteed CPI drop hota hai.',
      english: 'Institutional desks model upcoming CPI releases based on PPI pipeline trends, making it an early catalyst for yield movements.'
    },

    marketReactionMechanism: {
      hindi: 'हलचल का कारण: PPI कम आता है -> आने वाले CPI में गिरावट की पुष्टि -> डॉलर इंडेक्स नीचे -> बिटकॉइन और सोने में मजबूत रैली।',
      hinglish: 'Cooling PPI gives early green light for risk-on flows into Bitcoin and Gold as inflation pipeline clears.',
      english: 'Cooling wholesale prices depress terminal rate forecasts, reducing dollar yield support.'
    },

    scenarios: {
      belowForecast: {
        condition: 'PPI < 1.6% (Pipeline Inflation Clear)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.40% to -0.70%', note: 'Dollar weakens' },
          yields10Y: { dir: 'DOWN', bps: '-5 to -9 bps', note: 'Yields retreat' },
          bitcoin: { dir: 'UP', pct: '+2.0% to +3.5%', note: 'Steady bids' },
          gold: { dir: 'UP', pct: '+1.0% to +1.6%', note: 'Bullion gains' },
          equities: { dir: 'UP', pct: '+0.8% to +1.4%', note: 'Margin expansion' },
          btcForecast: {
            direction: 'BULLISH_PUMP',
            expectedMove: '+2.2% to +3.5% Pipeline Bid',
            targetPrice: '$85,600',
            targetRange: '$84,600 – $86,200',
            keyPivot: '$83,600',
            invalidation: 'Break below $82,900',
            catalystExplanation: 'Pipeline inflation clearing confirms Fed rate cutting trajectory is sustainable.'
          },
          goldForecast: {
            direction: 'BULLISH_SURGE',
            expectedMove: '+1.0% to +1.6% Advance',
            targetPrice: '$2,695',
            targetRange: '$2,675 – $2,710',
            keyPivot: '$2,655',
            invalidation: 'Break below $2,640',
            catalystExplanation: 'Decline in wholesale input costs confirms structurally lower real interest rates.'
          },
          institutionalPlaybook: 'Accumulate swing longs ahead of the upcoming CPI release.'
        }
      },
      inLine: {
        condition: 'PPI = 1.6% (Consensus Match)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.15%', note: 'Quiet' },
          yields10Y: { dir: 'CHOP', bps: '±2 bps', note: 'Flat' },
          bitcoin: { dir: 'CHOP', pct: '±0.8%', note: 'Tight range' },
          gold: { dir: 'CHOP', pct: '±0.3%', note: 'Steady' },
          equities: { dir: 'CHOP', pct: '±0.3%', note: 'Neutral' },
          btcForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.8% Range Trade',
            targetPrice: '$84,300',
            targetRange: '$83,500 – $84,800',
            keyPivot: '$83,600',
            invalidation: 'Break of range limits',
            catalystExplanation: 'Baseline expectations met; technicals govern intra-day price action.'
          },
          goldForecast: {
            direction: 'SIDEWAYS_CHOP',
            expectedMove: '±0.3% Flat',
            targetPrice: '$2,664',
            targetRange: '$2,655 – $2,675',
            keyPivot: '$2,655',
            invalidation: 'Close outside $2,645–$2,680',
            catalystExplanation: 'Equilibrium maintained.'
          },
          institutionalPlaybook: 'Follow established 4H chart levels.'
        }
      },
      aboveForecast: {
        condition: 'PPI > 1.8% (Wholesale Cost Spike)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.50% to +0.80%', note: 'USD bounces' },
          yields10Y: { dir: 'UP', bps: '+6 to +10 bps', note: 'Yields tick higher' },
          bitcoin: { dir: 'DOWN', pct: '-1.8% to -2.8%', note: 'Mild de-risking' },
          gold: { dir: 'DOWN', pct: '-0.8% to -1.3%', note: 'Dollar drag' },
          equities: { dir: 'DOWN', pct: '-0.7% to -1.3%', note: 'Input cost pressure' },
          btcForecast: {
            direction: 'BEARISH_DUMP',
            expectedMove: '-1.8% to -2.8% Pullback',
            targetPrice: '$82,900',
            targetRange: '$82,200 – $83,400',
            keyPivot: '$84,000',
            invalidation: 'Reclaim of $84,600',
            catalystExplanation: 'Wholesale inflation jump warns that CPI will remain sticky next month.'
          },
          goldForecast: {
            direction: 'BEARISH_DROP',
            expectedMove: '-0.8% to -1.3% Dip',
            targetPrice: '$2,648',
            targetRange: '$2,638 – $2,660',
            keyPivot: '$2,670',
            invalidation: 'Reclaim of $2,675',
            catalystExplanation: 'Higher wholesale numbers delay expected speed of rate cuts.'
          },
          institutionalPlaybook: 'Look for dip buy opportunities at major support zones.'
        }
      }
    },

    goldTransmission: {
      realYieldDriver: 'Leads CPI revisions and inflation expectations by 4–6 weeks.',
      expectedRange: [2640, 2710],
      keyTriggerLevel: 2665,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Provides early confirmation of macro liquidity trend directions.',
      expectedRange: [82400, 86200],
      keyTriggerLevel: 83600,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'FIRST_MINUTE_WICK_HUNT',
      mechanism: 'Trade services component can distort headline PPI; algos correct after analyzing core intermediate goods.',
      safeExecutionWindow: 'Wait 10 minutes post-release.'
    }
  }
];

export const VOICE_FAQS: VoiceQueryFaq[] = [
  {
    id: 'cpi-impact',
    questionHindi: 'CPI high aaya toh Gold aur Bitcoin par kya asar hoga?',
    questionHinglish: 'CPI high aaya toh Gold aur Bitcoin par kya asar hoga?',
    questionEnglish: 'What is the impact on Gold and Bitcoin if US CPI comes in hotter than expected?',
    answerHindi: 'अगर यूएस सीपीआई उम्मीद से ज़्यादा आया, तो डॉलर इंडेक्स यानी डीएक्सवाई में तेज़ उछाल आएगा और यूएस 10-ईयर यील्ड्स बढ़ेंगे। इससे बिटकॉइन में 3% से 5% और सोने में 1.5% से 2% की तात्कालिक गिरावट आ सकती है। पहले 15 मिनट मार्केट ऑर्डर्स से बचें और नीचे के 4-ऑवर ऑर्डर ब्लॉक पर लिक्विडिटी स्वीप का इंतज़ार करें।',
    answerHinglish: 'Dhyan se suno bhai! Agar US CPI expected se high aaya, toh DXY aur US 10Y Yields immediately surge karenge. Iska direct impact Bitcoin par negative padega aur BTC $81,000 se $82,000 ke 4H Order Block tak flush ho sakta hai, aur Gold $2,620 tak pull back karega. Pehle 15 minute news trap hota hai, isliye turant trade mat lena, sweep confirmation ke baad hi dip buy karna.',
    answerEnglish: 'If US CPI prints higher than consensus, the US Dollar Index (DXY) and 10-Year Treasury Yields will surge immediately. This creates algorithmic selling pressure on Bitcoin (projected -3% to -5.5%) and Gold (projected -1.5% to -2.2%). Avoid market execution in the first 15 minutes due to the initial stop-hunt trap; wait for 4H Order Block stabilization before taking positions.'
  },
  {
    id: 'nfp-trap',
    questionHindi: 'क्या न्यूज़ रिलीज़ के 5 मिनट पहले ट्रेड लेना चाहिए या ट्रैप होता है?',
    questionHinglish: 'Kya news release ke 5 minute pehle trade lena chahiye ya trap hota hai?',
    questionEnglish: 'Should I take trades 5 minutes before major news releases, or is it a trap?',
    answerHindi: 'न्यूज़ से ठीक पहले कभी भी ट्रेड नहीं लेना चाहिए। बड़े इंस्टीट्यूशंस और हाई-फ्रीक्वेंसी एल्गोरिदम्स पहले 60 सेकंड में दोनों तरफ के स्टॉप-लॉस उड़ाने के लिए स्प्रेड्स को फैला देते हैं। सही तरीका यह है कि न्यूज़ आने के 15 मिनट बाद 15-मिनट कैंडल के क्लोज होने का इंतज़ार करें और फिर असली ट्रेंड में ट्रेड करें।',
    answerHinglish: 'Bhai bilkul nahi! News se 5 minute pehle trade lena sabse bada trap hota hai. Algorithmic market makers order book thin kar dete hain aur first 60 seconds mein dono side ke buy-stops aur sell-stops hunt karte hain jisse bhari slippage hoti hai. Hamesha pehle 15-minute candle close hone do, uske baad hi institutional direction confirm hoti hai.',
    answerEnglish: 'Never trade within 5 minutes of a major data release. High-frequency algorithms widen order book spreads and engineer two-way wicks to harvest retail stops before the true institutional trend begins. Professional protocol dictates waiting for the 15-minute candle close post-release before entering with limit orders.'
  },
  {
    id: 'fomc-rate-cut',
    questionHindi: 'फ़ेडरल रिज़र्व रेट कट करेगा तो 4H स्विंग ट्रेड्स कब लेने चाहिए?',
    questionHinglish: 'Fed rate cut karega toh 4H swing trades kab lene chahiye?',
    questionEnglish: 'When should 4H swing trades be executed around a Federal Reserve rate cut?',
    answerHindi: 'रेट कट की घोषणा रात 11:30 बजे होती है, लेकिन असली चाल जेरोम पॉवेल की प्रेस कॉन्फ्रेंस के दौरान रात 12:00 बजे शुरू होती है। स्विंग ट्रेडर्स को प्रेस कॉन्फ्रेंस पूरी होने के बाद 4H कैंडल क्लोज़ और बीओएस कन्फर्मेशन देखकर ही एंट्री लेनी चाहिए।',
    answerHinglish: 'Fed announcement ke waqt initial spike fake out ho sakti hai. Asli direction Jerome Powell ki live press conference ke baad decide hoti hai. 4H swing traders ko conference khatam hone ke baad, jab structure break of structure (BOS) confirm kare, tabhi optimal entry zone mein limit order lagana chahiye.',
    answerEnglish: 'Execute 4H swing trades only after Fed Chair Jerome Powell completes the press conference (approximately 75 minutes after the initial policy release). Wait for a confirmed 4H Break of Structure (BOS) and enter at the retest of the Fair Value Gap (FVG) or Order Block.'
  }
];

export class EventImpactEngineService {
  private static instance: EventImpactEngineService;
  private events: MacroEventData[] = MACRO_EVENTS_REGISTRY;

  public static getInstance(): EventImpactEngineService {
    if (!EventImpactEngineService.instance) {
      EventImpactEngineService.instance = new EventImpactEngineService();
    }
    return EventImpactEngineService.instance;
  }

  public getEvents(): MacroEventData[] {
    return this.events;
  }

  public getNextHighImpactEvent(): MacroEventData {
    return this.events[0];
  }

  public playVoiceBriefing(answerText: string, lang: 'hindi' | 'hinglish' | 'english' = 'hinglish') {
    voiceService.speak(answerText, { langMode: lang });
  }

  public stopVoiceBriefing() {
    voiceService.stopSpeaking();
  }
}

export const eventImpactService = EventImpactEngineService.getInstance();
