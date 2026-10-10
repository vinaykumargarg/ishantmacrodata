/* ==========================================================================
   MARKET SESSION & TRADING HOURS ENGINE
   Real-Time Market Open/Close Detection for Indian (NSE/BSE) & US (NYSE/NASDAQ)
   Ensures accurate settled closing prices when closed, and live streaming when open.
   ========================================================================== */

export interface MarketSessionInfo {
  isOpen: boolean;
  status: 'OPEN' | 'CLOSED' | 'PRE-MARKET' | 'AFTER-HOURS' | 'WEEKEND';
  label: string;
  badgeClass: string;
  nextSessionText: string;
  marketName: string;
  tradingHours: string;
  timezone: string;
}

/**
 * Calculates current market session for Indian Equities (NSE / BSE)
 * Normal Trading Hours: 09:15 AM - 03:30 PM IST, Monday to Friday.
 */
export function getIndianMarketSession(): MarketSessionInfo {
  const now = new Date();

  // Use Intl to get exact day of week and time in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const minsTotal = hour * 60 + minute;

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) {
    return {
      isOpen: false,
      status: 'WEEKEND',
      label: 'MARKET CLOSED (WEEKEND)',
      badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
      nextSessionText: 'Opens Monday 09:15 AM IST (NSE/BSE)',
      marketName: 'NSE & BSE India',
      tradingHours: '09:15 AM – 03:30 PM IST (Mon–Fri)',
      timezone: 'Asia/Kolkata (IST)'
    };
  }

  // Pre-market: 09:00 - 09:15 IST (540 to 555 mins)
  if (minsTotal >= 540 && minsTotal < 555) {
    return {
      isOpen: false,
      status: 'PRE-MARKET',
      label: 'PRE-MARKET AUCTION',
      badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      nextSessionText: 'Regular Session Opens at 09:15 AM IST',
      marketName: 'NSE & BSE India',
      tradingHours: '09:15 AM – 03:30 PM IST (Mon–Fri)',
      timezone: 'Asia/Kolkata (IST)'
    };
  }

  // Regular Trading Session: 09:15 - 15:30 IST (555 to 930 mins)
  if (minsTotal >= 555 && minsTotal < 930) {
    return {
      isOpen: true,
      status: 'OPEN',
      label: 'LIVE CONTINUOUS MARKET',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      nextSessionText: 'Closes Today at 03:30 PM IST',
      marketName: 'NSE & BSE India',
      tradingHours: '09:15 AM – 03:30 PM IST (Mon–Fri)',
      timezone: 'Asia/Kolkata (IST)'
    };
  }

  // Post-market / Closed
  return {
    isOpen: false,
    status: 'CLOSED',
    label: 'MARKET CLOSED (POST-MARKET)',
    badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
    nextSessionText: weekday === 'Fri' ? 'Opens Monday 09:15 AM IST' : 'Opens Tomorrow 09:15 AM IST',
    marketName: 'NSE & BSE India',
    tradingHours: '09:15 AM – 03:30 PM IST (Mon–Fri)',
    timezone: 'Asia/Kolkata (IST)'
  };
}

/**
 * Calculates current market session for US Equities (NYSE / NASDAQ)
 * Normal Trading Hours: 09:30 AM - 04:00 PM EST, Monday to Friday.
 */
export function getUsMarketSession(): MarketSessionInfo {
  const now = new Date();

  // Use Intl to get exact day of week and time in America/New_York
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const minsTotal = hour * 60 + minute;

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) {
    return {
      isOpen: false,
      status: 'WEEKEND',
      label: 'MARKET CLOSED (WEEKEND)',
      badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
      nextSessionText: 'Opens Monday 09:30 AM EST (07:00 PM IST)',
      marketName: 'NYSE & NASDAQ USA',
      tradingHours: '09:30 AM – 04:00 PM EST (Mon–Fri)',
      timezone: 'America/New_York (EST)'
    };
  }

  // Pre-market: 04:00 - 09:30 EST (240 to 570 mins)
  if (minsTotal >= 240 && minsTotal < 570) {
    return {
      isOpen: false,
      status: 'PRE-MARKET',
      label: 'US PRE-MARKET',
      badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      nextSessionText: 'Regular Session Opens at 09:30 AM EST',
      marketName: 'NYSE & NASDAQ USA',
      tradingHours: '09:30 AM – 04:00 PM EST (Mon–Fri)',
      timezone: 'America/New_York (EST)'
    };
  }

  // Regular Trading Session: 09:30 - 16:00 EST (570 to 960 mins)
  if (minsTotal >= 570 && minsTotal < 960) {
    return {
      isOpen: true,
      status: 'OPEN',
      label: 'LIVE CONTINUOUS MARKET',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      nextSessionText: 'Closes Today at 04:00 PM EST',
      marketName: 'NYSE & NASDAQ USA',
      tradingHours: '09:30 AM – 04:00 PM EST (Mon–Fri)',
      timezone: 'America/New_York (EST)'
    };
  }

  // After-hours: 16:00 - 20:00 EST (960 to 1200 mins)
  if (minsTotal >= 960 && minsTotal < 1200) {
    return {
      isOpen: false,
      status: 'AFTER-HOURS',
      label: 'US AFTER-HOURS',
      badgeClass: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
      nextSessionText: 'After-Hours Trading Active',
      marketName: 'NYSE & NASDAQ USA',
      tradingHours: '09:30 AM – 04:00 PM EST (Mon–Fri)',
      timezone: 'America/New_York (EST)'
    };
  }

  // Post-market / Closed
  return {
    isOpen: false,
    status: 'CLOSED',
    label: 'MARKET CLOSED (POST-MARKET)',
    badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
    nextSessionText: weekday === 'Fri' ? 'Opens Monday 09:30 AM EST' : 'Opens Tomorrow 09:30 AM EST',
    marketName: 'NYSE & NASDAQ USA',
    tradingHours: '09:30 AM – 04:00 PM EST (Mon–Fri)',
    timezone: 'America/New_York (EST)'
  };
}
