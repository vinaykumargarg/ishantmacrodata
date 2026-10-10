/**
 * ISHANT MACRO AI TERMINAL (NEXVORA AI)
 * Official Centralized Subscription & Membership Configuration (INR)
 * Exact Plans: ₹2,999 / 1m, ₹6,999 / 3m, ₹9,999 / 6m, ₹20,000 / 12m
 */

export type SubscriptionPlanId = 'free' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual';
export type EntitlementTier = 'FREE' | 'PRO' | 'ELITE';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  tier: EntitlementTier;
  durationMonths: number;
  durationLabel: string;
  priceInr: number;
  monthlyEquivalentInr: number;
  savingsInr: number;
  savingsPct: number;
  isPopular?: boolean;
  isBestValue?: boolean;
  tagline: string;
  features: string[];
  limitations?: string[];
  razorpayPlanId?: string; // Optional Razorpay recurring subscription plan ID
}

export const MONTHLY_BASE_RATE_INR = 2999;

export const OFFICIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tier: 'FREE',
    durationMonths: 0,
    durationLabel: 'Forever Free',
    priceInr: 0,
    monthlyEquivalentInr: 0,
    savingsInr: 0,
    savingsPct: 0,
    tagline: 'Basic global market score and public economic indicators.',
    features: [
      'Live Global Market Score dial',
      'Daily economic calendar highlights',
      'Basic crypto & gold price tickers',
      'Limited to 5 AI chart queries / day',
      'Standard community support'
    ],
    limitations: [
      'No institutional Order Flow or Bookmap access',
      'No Delta India Multi-Coin Engine (1-3M)',
      'No Volume Profile POC / VAH / VAL terminal',
      'No Indian Stock AI (Top 500) deep dive',
      'No USA Top 1000 AI intelligence'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    tier: 'PRO',
    durationMonths: 1,
    durationLabel: '1 Month',
    priceInr: 2999,
    monthlyEquivalentInr: 2999,
    savingsInr: 0,
    savingsPct: 0,
    tagline: 'Full institutional intelligence access with monthly flexibility.',
    features: [
      'Full AI Chart Analysis (Long / Short / Wait)',
      'Delta Exchange India Multi-Coin Intelligence Engine (231+ Coins)',
      'Volume Profile & Order Flow Terminal (CVD, POC, VAH, VAL)',
      'Indian Stocks AI (Nifty 500 Deep Research)',
      'USA Top 1000 AI (INDmoney & Russell Analysis)',
      'Gold & Bitcoin Institutional Decision Engines',
      'Unlimited AI market regime queries',
      'Real-time WebSocket tick streaming',
      'Priority institutional support'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Pro',
    tier: 'PRO',
    badge: 'SAVE 22%',
    durationMonths: 3,
    durationLabel: '3 Months',
    priceInr: 6999,
    monthlyEquivalentInr: 2333,
    savingsInr: 1998,
    savingsPct: 22,
    tagline: 'Ideal for 1-3 month investment and swing trading cycles.',
    features: [
      'Everything in Monthly Pro plan',
      'Covers a full 90-day macro economic cycle (FOMC, CPI, NFP)',
      'Delta Exchange 1-Month, 2-Month & 3-Month scenario engines',
      'Save ₹1,998 compared to monthly renewals',
      'Priority algorithmic data feeds',
      'Exclusive macro research briefings'
    ]
  },
  {
    id: 'half_yearly',
    name: 'Half-Yearly Elite',
    tier: 'ELITE',
    badge: 'SAVE 44%',
    isPopular: true,
    durationMonths: 6,
    durationLabel: '6 Months',
    priceInr: 9999,
    monthlyEquivalentInr: 1666,
    savingsInr: 7995,
    savingsPct: 44,
    tagline: 'Best balance of cost and continuous market advantage.',
    features: [
      'All Pro Plan features included',
      'Highest configurable usage limits and API priority',
      'Advanced multi-timeframe SMC order block scanners',
      'Complete historical backtesting & token unlock calendar',
      'Direct WhatsApp / Telegram institutional alert channel',
      'Save ₹7,995 compared to monthly renewals (44% discount)',
      'Complimentary access to new AI model updates'
    ]
  },
  {
    id: 'annual',
    name: 'Annual Master Elite',
    tier: 'ELITE',
    badge: 'BEST LONG-TERM VALUE',
    isBestValue: true,
    durationMonths: 12,
    durationLabel: '12 Months (1 Year)',
    priceInr: 20000,
    monthlyEquivalentInr: 1667,
    savingsInr: 15988,
    savingsPct: 44,
    tagline: 'Full year institutional command center for serious traders.',
    features: [
      'All Elite Plan features for an entire year',
      'Maximum savings of ₹15,988 vs monthly billing',
      '1-on-1 terminal onboarding & setup consultation',
      'Custom watchlist & portfolio stress-test exports',
      'VIP priority server bandwidth & lowest latency',
      'Annual tax invoice & GST input credit receipt',
      'Locked-in grandfathered pricing on all future features'
    ]
  }
];

export interface PlanFeatureComparison {
  category: string;
  featureName: string;
  free: boolean | string;
  pro: boolean | string;
  elite: boolean | string;
}

export const PLAN_FEATURE_COMPARISON: PlanFeatureComparison[] = [
  {
    category: 'Market Intelligence & Terminals',
    featureName: 'Global Market Score & Regime Dial',
    free: 'Basic (15m delay)',
    pro: 'Real-time Live',
    elite: 'Real-time + Predictive'
  },
  {
    category: 'Market Intelligence & Terminals',
    featureName: 'Delta Exchange India Multi-Coin Engine',
    free: false,
    pro: 'Full (231+ Coins, 1-3M)',
    elite: 'Full + Custom Scenarios'
  },
  {
    category: 'Market Intelligence & Terminals',
    featureName: 'Volume Profile & Bookmap AI (POC/VAH/VAL)',
    free: false,
    pro: 'Included',
    elite: 'Advanced Footprint + CVD'
  },
  {
    category: 'Market Intelligence & Terminals',
    featureName: 'Indian Stocks AI (Nifty 500 Deep Research)',
    free: 'Top 10 Only',
    pro: 'Full 500 Universe',
    elite: 'Full 500 + Custom Screeners'
  },
  {
    category: 'Market Intelligence & Terminals',
    featureName: 'USA Top 1000 AI (INDmoney & Russell 1000)',
    free: 'Top 10 Only',
    pro: 'Full 1000 Universe',
    elite: 'Full 1000 + Valuation Models'
  },
  {
    category: 'AI Signals & Analytics',
    featureName: 'TradeAI Confluence Signals (Long/Short/Wait)',
    free: '5 queries / day',
    pro: 'Unlimited',
    elite: 'Unlimited + Webhooks'
  },
  {
    category: 'AI Signals & Analytics',
    featureName: '90-Day Token Unlock & Dilution Calendar',
    free: false,
    pro: 'Included',
    elite: 'Included + Whale Alerts'
  },
  {
    category: 'Execution & Support',
    featureName: 'Real-Time WebSocket Data Streaming',
    free: false,
    pro: 'Standard WS',
    elite: 'Dedicated Low-Latency WS'
  },
  {
    category: 'Execution & Support',
    featureName: 'Support Level',
    free: 'Community',
    pro: 'Priority Email (24h)',
    elite: 'VIP Telegram / WhatsApp Desk'
  }
];

export interface UserSubscriptionRecord {
  id: string;
  userId: string;
  planId: SubscriptionPlanId;
  planName: string;
  tier: EntitlementTier;
  amountInr: number;
  currency: 'INR' | 'USD';
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  expiryDate: string;
  paymentMethod: 'RAZORPAY' | 'STRIPE' | 'COMPLIMENTARY' | 'MANUAL';
  paymentId?: string;
  orderId?: string;
  autoRenew: boolean;
  invoiceUrl?: string;
}
