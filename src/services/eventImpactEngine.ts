/**
 * MARKET NEWS & EVENT IMPACT ENGINE
 * Real-Time 3-Scenario Analysis (Below / In-Line / Above)
 * Dedicated Gold (XAU/USD) & Bitcoin (BTC/USD) Transmission Models
 * News Trap Detector & Multi-Lingual AI Voice Assistant (Hindi / Hinglish / English)
 */

import { voiceService } from './voiceSynthesisService';

export interface MacroScenarioOutcome {
  dxy: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  yields10Y: { dir: 'UP' | 'DOWN' | 'CHOP'; bps: string; note: string };
  bitcoin: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  gold: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  equities: { dir: 'UP' | 'DOWN' | 'CHOP'; pct: string; note: string };
  institutionalPlaybook: string;
}

export interface MacroEventData {
  id: string;
  name: string;
  country: 'US' | 'EU' | 'UK' | 'GLOBAL';
  category: 'INFLATION' | 'CENTRAL_BANK' | 'EMPLOYMENT' | 'GROWTH';
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  releaseDate: string; // ISO or human format
  countdownSeconds: number;
  previousValue: string;
  consensusForecast: string;
  historicalSurpriseBias: string;
  
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

  // Dedicated Asset Impacts
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
    trapType: 'FIRST_MINUTE_WICK_HUNT' | 'SPREAD_EXPANSION_SLIPPAGE' | 'STOP_RUN_REVERSAL';
    mechanism: string;
    safeExecutionWindow: string; // e.g. "Wait 15 minutes post-print for candle close"
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
  {
    id: 'us-cpi',
    name: 'US Consumer Price Index (CPI YoY)',
    country: 'US',
    category: 'INFLATION',
    importance: 'CRITICAL',
    releaseDate: 'Thursday, 08:30 AM EST (18:00 IST)',
    countdownSeconds: 15420,
    previousValue: '2.5%',
    consensusForecast: '2.3%',
    historicalSurpriseBias: 'Downside surprise probability 55%, In-line 35%, Upside 10%',
    scenarios: {
      belowForecast: {
        condition: 'Actual CPI < 2.3% (Soft / Disinflationary Print)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.65% to -1.10%', note: 'DXY dumps below 101.80 as Fed rate cut odds surge to 98%' },
          yields10Y: { dir: 'DOWN', bps: '-8 to -14 bps', note: '10Y Yield dives below 3.98% as duration is aggressively bought' },
          bitcoin: { dir: 'UP', pct: '+3.5% to +6.0%', note: 'Liquidity surge drives BTC to test and sweep $86,000+ resistance' },
          gold: { dir: 'UP', pct: '+1.8% to +2.5%', note: 'Lower real yields propel Gold toward fresh all-time highs above $2,720' },
          equities: { dir: 'UP', pct: '+1.2% to +1.8%', note: 'Tech and Semiconductors (NVDA, QQQ) rally sharply on valuation expansion' },
          institutionalPlaybook: 'Aggressive LONG on BTC, Gold, and QQQ on first 5-minute pullback; avoid shorting.'
        }
      },
      inLine: {
        condition: 'Actual CPI = 2.3% (Exactly Matches Consensus)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.20%', note: 'DXY consolidates in tight range around 102.50' },
          yields10Y: { dir: 'CHOP', bps: '±3 bps', note: 'Yields remain static as rate expectations are fully priced' },
          bitcoin: { dir: 'CHOP', pct: '±1.5%', note: 'Initial stop-hunt both sides followed by continuation of prevailing 4H trend' },
          gold: { dir: 'CHOP', pct: '±0.6%', note: 'Range trade between $2,640 and $2,670' },
          equities: { dir: 'CHOP', pct: '±0.4%', note: 'Mild sector rotation without broad market expansion' },
          institutionalPlaybook: 'Do not chase market orders. Wait for the initial 15-minute range breakout with volume.'
        }
      },
      aboveForecast: {
        condition: 'Actual CPI > 2.4% (Hot / Sticky Inflation Shock)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.80% to +1.40%', note: 'DXY spikes through 103.50 as Fed cut expectations get deferred' },
          yields10Y: { dir: 'UP', bps: '+10 to +18 bps', note: '10Y Yield spikes to 4.25% putting severe pressure on risk assets' },
          bitcoin: { dir: 'DOWN', pct: '-3.0% to -5.5%', note: 'Liquidity drain causes immediate flush into 4H Order Block at $81,000' },
          gold: { dir: 'DOWN', pct: '-1.5% to -2.2%', note: 'Surging real yields trigger temporary algorithmic liquidation toward $2,600' },
          equities: { dir: 'DOWN', pct: '-1.5% to -2.5%', note: 'High-multiple tech stocks and crypto proxies suffer sharp distribution' },
          institutionalPlaybook: 'Look for short scalp setups or wait for institutional capitulation sweep to buy the dip.'
        }
      }
    },
    goldTransmission: {
      realYieldDriver: 'Inverse real yield correlation (-0.88). Every 10 bps drop in US 10Y Real Yield adds ~$25 to spot Gold.',
      expectedRange: [2630, 2715],
      keyTriggerLevel: 2685,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Global M2 and US Dollar liquidity transmission. Dollar weakness triggers instant crypto bidding.',
      expectedRange: [81500, 86800],
      keyTriggerLevel: 84000,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'FIRST_MINUTE_WICK_HUNT',
      mechanism: 'Algorithms intentionally trigger both Buy-Side and Sell-Side stops in the first 60 seconds with wide spreads before establishing the true directional trend.',
      safeExecutionWindow: 'Do NOT trade during 0–3 minutes post-print. Execute after the first 15-minute candle close.'
    }
  },
  {
    id: 'us-fomc',
    name: 'FOMC Federal Reserve Interest Rate Decision & Press Conference',
    country: 'US',
    category: 'CENTRAL_BANK',
    importance: 'CRITICAL',
    releaseDate: 'Wednesday, 02:00 PM EST (23:30 IST)',
    countdownSeconds: 432000,
    previousValue: '5.00%',
    consensusForecast: '4.75% (-25 bps Rate Cut)',
    historicalSurpriseBias: 'Cut 25 bps expected with 96% certainty; focus is on Powell press conference dot plot guidance.',
    scenarios: {
      belowForecast: {
        condition: 'Dovish 50 bps Cut or Powell telegraphs aggressive cuts',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-1.2% to -1.8%', note: 'Dollar breakdown across all G10 currency pairs' },
          yields10Y: { dir: 'DOWN', bps: '-15 to -22 bps', note: 'Yield curve bull steepens aggressively' },
          bitcoin: { dir: 'UP', pct: '+6.0% to +10.0%', note: 'Parabolic crypto impulse as monetary easing accelerates' },
          gold: { dir: 'UP', pct: '+2.5% to +3.8%', note: 'Sustained institutional central bank buying momentum' },
          equities: { dir: 'UP', pct: '+2.0% to +3.2%', note: 'Broad equity all-time high expansion' },
          institutionalPlaybook: 'Hold core swing longs and trail stop loss to previous 4H swing lows.'
        }
      },
      inLine: {
        condition: '25 bps Cut with Balanced / Neutral Powell Tone',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.40%', note: 'Mild fluctuations as guidance matches baseline' },
          yields10Y: { dir: 'CHOP', bps: '±4 bps', note: 'Curve remains stable' },
          bitcoin: { dir: 'CHOP', pct: '±2.0%', note: 'Volatile swings during Powell Q&A, settling positive' },
          gold: { dir: 'CHOP', pct: '±0.8%', note: 'Drifts upward steadily' },
          equities: { dir: 'CHOP', pct: '±0.6%', note: 'Index flat, single stocks driven by individual earnings' },
          institutionalPlaybook: 'Wait until Jerome Powell concludes the 45-minute press conference before entering new positions.'
        }
      },
      aboveForecast: {
        condition: 'Hawkish Pause (0 bps cut) or Powell warns of inflation resurgence',
        outcome: {
          dxy: { dir: 'UP', pct: '+1.5% to +2.2%', note: 'Massive short-squeeze in DXY toward 104.50' },
          yields10Y: { dir: 'UP', bps: '+20 to +28 bps', note: 'Sharp bear flattening shock' },
          bitcoin: { dir: 'DOWN', pct: '-6.0% to -9.0%', note: 'Leveraged long squeeze wiping over $400M in open interest' },
          gold: { dir: 'DOWN', pct: '-2.5% to -3.5%', note: 'Temporary dollar spike triggers stop-loss sweeps' },
          equities: { dir: 'DOWN', pct: '-2.5% to -3.8%', note: 'Sharp risk-off liquidation' },
          institutionalPlaybook: 'Immediately de-risk high-beta altcoins; place bids in deeply discounted Order Blocks.'
        }
      }
    },
    goldTransmission: {
      realYieldDriver: 'Fed funds rate trajectory directly dictates gold holding opportunity cost.',
      expectedRange: [2610, 2740],
      keyTriggerLevel: 2660,
      directionalBias: 'BULLISH'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Bitcoin acts as the purest liquidity sponge in global finance.',
      expectedRange: [79500, 88500],
      keyTriggerLevel: 83500,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'STOP_RUN_REVERSAL',
      mechanism: 'The 2:00 PM statement release often creates a fake initial move, which is completely reversed at 2:30 PM when Powell speaks during the live press conference.',
      safeExecutionWindow: 'Never execute before 3:15 PM EST (post-conference).'
    }
  },
  {
    id: 'us-nfp',
    name: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
    country: 'US',
    category: 'EMPLOYMENT',
    importance: 'CRITICAL',
    releaseDate: 'First Friday of Month, 08:30 AM EST (18:00 IST)',
    countdownSeconds: 220000,
    previousValue: '254K',
    consensusForecast: '145K',
    historicalSurpriseBias: 'High volatility print; average initial 5-minute BTC swing is 1.8%',
    scenarios: {
      belowForecast: {
        condition: 'Actual NFP < 120K (Weak Labor Market)',
        outcome: {
          dxy: { dir: 'DOWN', pct: '-0.50% to -0.90%', note: 'Labor softening cements urgent Fed rate cutting cycle' },
          yields10Y: { dir: 'DOWN', bps: '-7 to -12 bps', note: 'Growth fears trigger bond rally' },
          bitcoin: { dir: 'UP', pct: '+2.5% to +4.0%', note: 'Monetary easing tailwind overpowers growth concern' },
          gold: { dir: 'UP', pct: '+1.2% to +1.9%', note: 'Safe haven + rate cut double tailwind' },
          equities: { dir: 'CHOP', pct: '±0.8%', note: 'Rate cut hope battles recession risk' },
          institutionalPlaybook: 'Favor Gold over Equities on weak labor data.'
        }
      },
      inLine: {
        condition: 'Actual NFP between 135K and 160K (Goldilocks print)',
        outcome: {
          dxy: { dir: 'CHOP', pct: '±0.25%', note: 'Stable conditions' },
          yields10Y: { dir: 'CHOP', bps: '±3 bps', note: 'Soft landing scenario reinforced' },
          bitcoin: { dir: 'UP', pct: '+1.5% to +2.5%', note: 'Goldilocks environment is ideal for crypto risk appetite' },
          gold: { dir: 'CHOP', pct: '±0.4%', note: 'Consolidates' },
          equities: { dir: 'UP', pct: '+1.0% to +1.5%', note: 'Soft landing scenario propels corporate earnings outlook' },
          institutionalPlaybook: 'Strongest scenario for USA Tech & 4H Crypto Swings.'
        }
      },
      aboveForecast: {
        condition: 'Actual NFP > 190K (Hot Labor Resilience)',
        outcome: {
          dxy: { dir: 'UP', pct: '+0.70% to +1.10%', note: 'Strong economy delays aggressive easing expectations' },
          yields10Y: { dir: 'UP', bps: '+8 to +14 bps', note: 'Yields jump on strong consumer spending prospects' },
          bitcoin: { dir: 'DOWN', pct: '-2.0% to -3.5%', note: 'Initial knee-jerk drop on yield spike' },
          gold: { dir: 'DOWN', pct: '-1.2% to -1.8%', note: 'Pressure from rising dollar' },
          equities: { dir: 'CHOP', pct: '±0.5%', note: 'Higher rates offset by strong economic demand' },
          institutionalPlaybook: 'Wait for the initial flush to buy discounted crypto dips.'
        }
      }
    },
    goldTransmission: {
      realYieldDriver: 'Strong employment pushes rate cut expectations out, exerting downward pressure on Gold.',
      expectedRange: [2640, 2695],
      keyTriggerLevel: 2670,
      directionalBias: 'CHOP'
    },
    bitcoinTransmission: {
      liquidityDriver: 'Goldilocks payroll numbers fuel bull swings, extreme deviations cause brief whipsaws.',
      expectedRange: [82500, 85800],
      keyTriggerLevel: 84000,
      directionalBias: 'BULLISH'
    },
    trapWarning: {
      trapType: 'SPREAD_EXPANSION_SLIPPAGE',
      mechanism: 'Broker spreads and futures order books thin out 30 seconds prior to 8:30 AM EST, causing up to 0.8% slippage on stop orders.',
      safeExecutionWindow: 'Use limit orders only; avoid market entries during the first 10 minutes.'
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
