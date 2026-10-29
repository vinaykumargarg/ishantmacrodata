import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Clock,
  Globe,
  Sun,
  Moon,
  Bell,
  FileText,
  User,
  LogOut,
  Settings,
  CreditCard,
  ChevronDown,
  Sparkles,
  X,
  ExternalLink,
  Check,
  ChevronRight,
  Menu
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export type AppTheme = 'dark' | 'light' | 'gold';
export type TradingMode = 'beginner' | 'advanced';

export interface HeaderProps {
  isDarkMode: boolean;
  theme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  onToggleTheme: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenAccount: () => void;
  onNavigateHome: () => void;
  onNavigatePricing?: () => void;
  onOpenProfile?: () => void;
  onSearch?: (query: string) => void;
  onSelectTab?: (tabId: string) => void;
}

interface SearchItem {
  id: string;
  name: string;
  category: 'Assets' | 'AI & Trading Charts' | 'Scanners' | 'Liquidity & Order Flow' | 'Stocks' | 'Macro & News';
  badge?: string;
  keywords?: string[];
}

const SEARCH_DATABASE: SearchItem[] = [
  // Assets
  { id: 'ai-chart', name: 'Bitcoin (BTC / USD)', category: 'Assets', badge: 'Crypto', keywords: ['btc', 'crypto', 'coin'] },
  { id: 'eth-engine', name: 'Ethereum (ETH / USD)', category: 'Assets', badge: 'Crypto', keywords: ['eth', 'ether', 'dominance'] },
  { id: 'crypto-ai', name: 'Solana (SOL / USD)', category: 'Assets', badge: 'Crypto', keywords: ['sol', 'altcoin'] },
  { id: 'gold-ai', name: 'Gold Spot (XAU / USD)', category: 'Assets', badge: 'Commodity', keywords: ['gold', 'xau', 'bullion'] },
  { id: 'order-flow', name: 'Silver Spot (XAG / USD)', category: 'Assets', badge: 'Commodity', keywords: ['silver', 'xag', 'metals'] },
  { id: 'oil-trading-ai', name: 'Crude Oil (WTI / Brent)', category: 'Assets', badge: 'Energy', keywords: ['oil', 'crude', 'brent', 'wti'] },
  { id: 'indian-stock-ai', name: 'NIFTY 50 & Indian Equities', category: 'Assets', badge: 'India', keywords: ['nifty', 'bse', 'nse', 'stocks'] },
  { id: 'usa-stock-ai', name: 'S&P 500 & US Top 1000', category: 'Assets', badge: 'USA', keywords: ['sp500', 'nasdaq', 'us stocks'] },
  { id: 'cross-asset-confirmation', name: 'US Dollar Index (DXY)', category: 'Assets', badge: 'Forex', keywords: ['dxy', 'dollar', 'fx'] },

  // AI & Trading Charts
  { id: 'ai-chart', name: 'AI Sniper Chart (Long / Short / Wait)', category: 'AI & Trading Charts', badge: 'AI', keywords: ['chart', 'sniper', 'signal'] },
  { id: 'deeepr-ai', name: 'DEEEPR.AI Copilot & Institutional Chart', category: 'AI & Trading Charts', badge: 'AI', keywords: ['copilot', 'chart', 'smc'] },
  { id: 'institutional-chart', name: 'Institutional All-in-One Chart (SMC/ICT)', category: 'AI & Trading Charts', badge: 'Pro', keywords: ['smc', 'ict', 'fvg', 'order block'] },
  { id: 'institutional-multi-asset', name: 'Institutional Multi-Asset Engine', category: 'AI & Trading Charts', badge: 'Engine', keywords: ['multi asset', 'btc', 'gold', 'oil'] },
  { id: 'ultra-ai', name: 'TradeAI Institutional Terminal', category: 'AI & Trading Charts', badge: 'Terminal', keywords: ['terminal', 'ultra'] },
  { id: 'deeepr-decision-engine', name: 'DEEEPR Decision Engine v4 (30 Rules)', category: 'AI & Trading Charts', badge: 'Decision', keywords: ['decision', 'arbiter', 'rules'] },
  { id: 'deeepr-big-player-radar', name: 'DEEEPR Big Player Radar v1 (Smart Money)', category: 'AI & Trading Charts', badge: 'Whales', keywords: ['big player', 'smart money', 'whale', 'etf', 'cot', 'blackrock'] },
  { id: 'deeepr-gold-entry-engine', name: 'DEEEPR Gold Entry + Reason Engine v1 (XAUUSD Why Engine)', category: 'AI & Trading Charts', badge: 'Gold', keywords: ['gold', 'xauusd', 'why engine', 'kahan entry', 'gold entry', 'dxy', 'sl', 'tp'] },
  { id: 'deeepr-auto-fibonacci', name: 'DEEEPR Auto-Fibonacci + Golden Zone Engine v1 (Gold & BTC)', category: 'AI & Trading Charts', badge: 'Fib', keywords: ['fibonacci', 'auto fib', 'golden zone', 'golden pocket', '0.618', 'ote', 'retracement'] },
  { id: 'deeepr-volume-profile-scanner', name: 'DEEEPR Volume Profile Confluence Scanner v1 (Multi-Asset)', category: 'Scanners', badge: 'Profile', keywords: ['volume profile', 'vp scanner', 'poc', 'vah', 'val', 'hvn', 'lvn', 'naked poc'] },
  { id: 'deeepr-precision-entry', name: 'DEEEPR Precision Entry Engine', category: 'AI & Trading Charts', badge: 'Entry', keywords: ['precision', 'level entry'] },
  { id: 'market-chart-analyse', name: 'Market Chart AI Analyzer (A-to-Z Read)', category: 'AI & Trading Charts', badge: 'Vision', keywords: ['analyzer', 'chart analysis'] },

  // Scanners
  { id: 'delta-swing-scanner', name: 'Delta 4H All-Coin Swing Scanner', category: 'Scanners', badge: '4H', keywords: ['delta', 'swing', 'all coins'] },
  { id: 'delta-swing-top5', name: 'Top 5 Alpha Swings (Delta)', category: 'Scanners', badge: 'Alpha', keywords: ['alpha', 'top 5'] },
  { id: 'usa-swing-scanner', name: 'USA Stocks 4H Swing Scanner', category: 'Scanners', badge: 'US', keywords: ['us stocks', 'swing', 'scanner'] },
  { id: 'scanner', name: 'Bull / Bear Confluence Scanner', category: 'Scanners', badge: 'Confluence', keywords: ['bull', 'bear', 'scanner'] },
  { id: 'usa-earnings-guard', name: 'Earnings Risk Guard (<14D Warning)', category: 'Scanners', badge: 'Risk', keywords: ['earnings', 'guard'] },

  // Liquidity & Order Flow
  { id: 'order-book-heatmap', name: 'Order Book Liquidity Heatmap (Bookmap / ATAS 1:1)', category: 'Liquidity & Order Flow', badge: 'Heatmap', keywords: ['bookmap', 'atas', 'order book', 'depth'] },
  { id: 'deeepr-liquidation-hub', name: 'DEEEPR Liquidation Hub v1 (Map + Heatmap)', category: 'Liquidity & Order Flow', badge: 'Liq', keywords: ['liquidation', 'max pain', 'cascades'] },
  { id: 'order-flow', name: 'Order Flow & CVD Terminal', category: 'Liquidity & Order Flow', badge: 'CVD', keywords: ['order flow', 'delta', 'footprint'] },
  { id: 'volume-profile-confluence', name: 'Volume Profile Confluence Engine', category: 'Liquidity & Order Flow', badge: 'VP', keywords: ['volume profile', 'poc', 'vah', 'val'] },
  { id: 'volume-profile-ai', name: 'Volume Profile Pro (VAH/VAL/POC Setup)', category: 'Liquidity & Order Flow', badge: 'Profile', keywords: ['volume', 'poc'] },
  { id: 'crowd-sentiment', name: 'Retail vs Whales Long/Short Skew & Crowd', category: 'Liquidity & Order Flow', badge: 'Skew', keywords: ['crowd', 'retail', 'whales'] },

  // Stocks
  { id: 'indian-stock-ai', name: 'Indian Stocks AI (NIFTY 500)', category: 'Stocks', badge: 'India', keywords: ['indian stocks', 'nifty', 'nse'] },
  { id: 'usa-stock-ai', name: 'USA Top 1000 AI (INDmoney)', category: 'Stocks', badge: 'USA', keywords: ['usa stocks', 'sp500'] },
  { id: 'deeepr-stock-research', name: 'DEEEPR Stock Research & Positional Engine (5-12M)', category: 'Stocks', badge: '5-12M', keywords: ['research', 'positional', 'fundamental'] },
  { id: 'global-score', name: 'Global Stock Score Engine (4-6M)', category: 'Stocks', badge: 'Score', keywords: ['score', 'global stocks'] },

  // Macro & News
  { id: 'usa-events', name: 'US Events & News Impact Engine (FOMC/CPI/NFP → Gold+BTC)', category: 'Macro & News', badge: 'US Events', keywords: ['us news', 'usa events', 'fomc', 'cpi', 'nfp', 'pce', 'gdp', 'fed', 'gold impact', 'bitcoin impact', 'powell'] },
  { id: 'deeepr-news-events', name: 'DEEEPR News & Events Engine (CPI/FOMC/NFP)', category: 'Macro & News', badge: 'Macro', keywords: ['news', 'cpi', 'fomc', 'nfp', 'fed'] },
  { id: 'event-impact-engine', name: 'Live Event Impact Engine (3 Scenarios)', category: 'Macro & News', badge: 'Live', keywords: ['impact', 'scenarios', 'event'] },
  { id: 'calendar', name: 'Global Economic Calendar', category: 'Macro & News', badge: 'Calendar', keywords: ['economic calendar', 'data releases'] },
  { id: 'daily-report', name: 'Daily Market Intelligence Report', category: 'Macro & News', badge: 'Report', keywords: ['daily report', 'briefing'] },
  { id: 'jarvis-voice-ai', name: 'Jarvis AI Market Voice Assistant', category: 'Macro & News', badge: 'Voice', keywords: ['jarvis', 'voice', 'audio'] },
  { id: 'telegram-alerts', name: 'Telegram AI Alerts & VIP Bot', category: 'Macro & News', badge: 'Bot', keywords: ['telegram', 'alerts', 'bot'] }
];

interface SupportedTimezone {
  id: string;
  name: string;
  short: string;
  iana: string;
}

const SUPPORTED_TIMEZONES: SupportedTimezone[] = [
  { id: 'IST', name: 'India (IST - Kolkata)', short: 'IST', iana: 'Asia/Kolkata' },
  { id: 'EST', name: 'New York (US Eastern)', short: 'ET', iana: 'America/New_York' },
  { id: 'LON', name: 'London (UK / BST / GMT)', short: 'LON', iana: 'Europe/London' },
  { id: 'DXB', name: 'Dubai (GST - UAE)', short: 'DXB', iana: 'Asia/Dubai' },
  { id: 'TYO', name: 'Tokyo (JST - Japan)', short: 'TYO', iana: 'Asia/Tokyo' },
  { id: 'UTC', name: 'Universal Coordinated Time', short: 'UTC', iana: 'UTC' }
];

interface TradingSessionInfo {
  name: string;
  startUtc: number; // in UTC hours
  endUtc: number;   // in UTC hours
  center: string;
  desc: string;
}

const SESSIONS_CONFIG: TradingSessionInfo[] = [
  { name: 'Sydney', startUtc: 22, endUtc: 7, center: 'Australia', desc: 'Asia-Pacific Open' },
  { name: 'Tokyo', startUtc: 0, endUtc: 9, center: 'Japan', desc: 'Asian Financial Hub' },
  { name: 'London', startUtc: 8, endUtc: 17, center: 'Europe', desc: 'European Heavyweight' },
  { name: 'New York', startUtc: 13, endUtc: 22, center: 'United States', desc: 'US Wall Street' }
];

interface InstitutionalAlert {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
  targetTab: string;
  isRead: boolean;
  type: 'structure' | 'macro' | 'liquidation' | 'signal';
}

const INITIAL_ALERTS: InstitutionalAlert[] = [
  {
    id: 'alt-1',
    title: 'BTC Structure: 4H Demand Retest',
    detail: 'Liquidity sweep confirmed at $82,100; candle closed back inside 4H demand.',
    timeAgo: '8m ago',
    targetTab: 'ai-chart',
    isRead: false,
    type: 'structure'
  },
  {
    id: 'alt-2',
    title: 'Gold Sniper: Extension Target 70pt',
    detail: 'XAU/USD testing $4,115 support zone with 70–90 pt overhead expansion room.',
    timeAgo: '26m ago',
    targetTab: 'gold-signal-panel',
    isRead: false,
    type: 'signal'
  },
  {
    id: 'alt-3',
    title: 'US Core PCE & FOMC Horizon',
    detail: 'High-impact macroeconomic event in 48h. Institutional blackout rules active.',
    timeAgo: '1h ago',
    targetTab: 'deeepr-news-events',
    isRead: false,
    type: 'macro'
  },
  {
    id: 'alt-4',
    title: 'Liquidation Cascade Detected',
    detail: '+$14.2M short liquidations flushed across Delta & Binance perps.',
    timeAgo: '3h ago',
    targetTab: 'deeepr-liquidation-hub',
    isRead: true,
    type: 'liquidation'
  }
];

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  theme = 'dark',
  onSelectTheme,
  onToggleTheme,
  onOpenAccount,
  onNavigateHome,
  onNavigatePricing,
  onOpenProfile,
  onSelectTab,
  onToggleMobileSidebar
}) => {
  const { user, openAuthModal, logout } = useAuth();

  // ── State Management ──
  const [activeDropdown, setActiveDropdown] = useState<
    'none' | 'search' | 'timezone' | 'session' | 'alerts' | 'reports' | 'user'
  >('none');

  // Time & Timezone State
  const [currentTimezone, setCurrentTimezone] = useState<SupportedTimezone>(() => {
    try {
      const saved = localStorage.getItem('ISHANT_SELECTED_TZ');
      if (saved) {
        const found = SUPPORTED_TIMEZONES.find((t) => t.id === saved || t.iana === saved);
        if (found) return found;
      }
    } catch {}
    return SUPPORTED_TIMEZONES[0]; // Default Asia/Kolkata (IST)
  });

  const [clockString, setClockString] = useState<string>('');

  // Presentation Mode: Beginner vs Advanced
  const [tradingMode, setTradingMode] = useState<TradingMode>(() => {
    try {
      const saved = localStorage.getItem('ISHANT_TRADING_MODE');
      if (saved === 'beginner' || saved === 'advanced') return saved;
    } catch {}
    return 'advanced';
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSearchIdx, setSelectedSearchIdx] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ISHANT_RECENT_SEARCHES');
      return raw ? JSON.parse(raw) : ['Bitcoin', 'Gold Spot', 'DEEEPR AI', 'Order Book Heatmap'];
    } catch {
      return ['Bitcoin', 'Gold Spot', 'DEEEPR AI'];
    }
  });

  // Alerts State
  const [alerts, setAlerts] = useState<InstitutionalAlert[]>(INITIAL_ALERTS);
  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);

  // Click outside ref to close popovers
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Keyboard shortcut: Ctrl+K / Cmd+K to open search ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveDropdown((prev) => (prev === 'search' ? 'none' : 'search'));
        setTimeout(() => searchInputRef.current?.focus(), 80);
      } else if (e.key === 'Escape') {
        setActiveDropdown('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Live Clock Tick (Every Second) ──
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: currentTimezone.iana,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        };
        const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(now);
        const getVal = (t: string) => parts.find((p) => p.type === t)?.value || '';

        const day = getVal('day');
        const month = getVal('month');
        const year = getVal('year');
        const hour = getVal('hour');
        const minute = getVal('minute');
        const second = getVal('second');
        const dayPeriod = (getVal('dayPeriod') || '').toUpperCase();

        setClockString(`${day} ${month} ${year} | ${hour}:${minute}:${second} ${dayPeriod} ${currentTimezone.short}`);
      } catch (err) {
        setClockString(now.toUTCString());
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [currentTimezone]);

  // Save timezone
  const handleSelectTimezone = (tz: SupportedTimezone) => {
    setCurrentTimezone(tz);
    try {
      localStorage.setItem('ISHANT_SELECTED_TZ', tz.id);
    } catch {}
    setActiveDropdown('none');
  };

  // Toggle Trading Mode (Beginner / Advanced)
  const handleToggleMode = (mode: TradingMode) => {
    setTradingMode(mode);
    try {
      localStorage.setItem('ISHANT_TRADING_MODE', mode);
      window.dispatchEvent(new CustomEvent('trading_mode_changed', { detail: mode }));
    } catch {}
  };

  // ── Global Session Calculations ──
  const sessionStatus = useMemo(() => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const currentUtcDec = utcHours + utcMinutes / 60;

    const list = SESSIONS_CONFIG.map((s) => {
      let isActive = false;
      if (s.startUtc > s.endUtc) {
        isActive = currentUtcDec >= s.startUtc || currentUtcDec < s.endUtc;
      } else {
        isActive = currentUtcDec >= s.startUtc && currentUtcDec < s.endUtc;
      }

      // Calculate time until next open in hours
      let hoursUntilOpen = 0;
      if (isActive) {
        hoursUntilOpen = 0;
      } else if (currentUtcDec < s.startUtc) {
        hoursUntilOpen = s.startUtc - currentUtcDec;
      } else {
        hoursUntilOpen = 24 - currentUtcDec + s.startUtc;
      }

      return {
        ...s,
        isActive,
        hoursUntilOpen
      };
    });

    const activeList = list.filter((s) => s.isActive);
    let summary = 'Off-Peak';
    if (activeList.some((s) => s.name === 'London') && activeList.some((s) => s.name === 'New York')) {
      summary = 'London & NY (Peak)';
    } else if (activeList.length > 0) {
      summary = activeList.map((s) => s.name).join(' & ');
    }

    return {
      list,
      activeList,
      summary,
      isAnyActive: activeList.length > 0
    };
  }, []);

  // ── Navigation Handler ──
  const handleNavigate = useCallback(
    (tabId: string, searchLabel?: string) => {
      setActiveDropdown('none');
      if (searchLabel) {
        setRecentSearches((prev) => {
          const next = [searchLabel, ...prev.filter((item) => item !== searchLabel)].slice(0, 6);
          try {
            localStorage.setItem('ISHANT_RECENT_SEARCHES', JSON.stringify(next));
          } catch {}
          return next;
        });
      }

      if (onSelectTab) {
        onSelectTab(tabId);
      } else if (typeof window !== 'undefined') {
        window.location.hash = tabId;
      }
    },
    [onSelectTab]
  );

  // ── Filtered Search Results ──
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_DATABASE.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKey = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchName || matchCat || matchKey;
    }).slice(0, 8);
  }, [searchQuery]);

  // Handle Search Keyboard Navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = searchResults[selectedSearchIdx];
      if (target) {
        handleNavigate(target.id, target.name);
      }
    }
  };

  const markAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  return (
    <header
      ref={headerRef}
      style={{
        background: 'rgba(13, 20, 36, 0.75)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)'
      }}
      className="sticky top-0 z-40 h-[48px] px-2.5 sm:px-3 shadow-[0_4px_20px_rgba(0,0,0,0.35)] select-none transition-colors relative"
    >
      {/* Hairline gradient at bottom of header */}
      <div className="header-hairline-gradient absolute bottom-0 left-0 right-0 pointer-events-none" />

      <div className="flex h-full w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* ── 0. Hamburger Menu Button ── */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] transition-all cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* ── 1. [BRANDING: 32px ROUNDED SQUARE BRAND-GRADIENT "IM"] ── */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 shrink-0 bg-transparent border-none p-0 cursor-pointer group focus:outline-none text-left"
            title="IshantMacro | Institutional Macro Command Centre"
          >
            {/* 32px rounded square brand-gradient with "IM" white bold */}
            <div
              style={{ background: 'var(--brand-grad)' }}
              className="flex size-8 shrink-0 items-center justify-center rounded-[9px] text-white font-bold text-xs shadow-md shadow-indigo-500/25 select-none transition-transform duration-200 group-hover:scale-105 font-mono"
            >
              IM
            </div>
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-['Sora'] text-[13.5px] font-bold text-[var(--text)] tracking-tight">
                IshantMacro
              </span>
              <span className="font-['JetBrains_Mono'] text-[8px] font-medium tracking-wider text-[var(--text-3)] uppercase leading-none mt-0.5">
                GLOBAL MACRO COMMAND CENTRE
              </span>
            </div>
          </button>
        </div>

        {/* ── 2. [GLOBAL SEARCH BOX: surface-2, border var(--border), radius 10px] ── */}
        <div className="relative flex-1 max-w-[280px] lg:max-w-[320px] hidden md:block">
          <div
            onClick={() => {
              setActiveDropdown('search');
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            style={{
              background: 'var(--surface-2)',
              borderColor: 'var(--border)'
            }}
            className="flex h-[32px] w-full items-center justify-between rounded-[10px] border px-2.5 text-xs text-[var(--text-2)] hover:border-[var(--brand)] cursor-pointer transition-all focus-within:ring-2 focus-within:ring-indigo-500/30"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Search className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search assets, charts, stocks, news..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeDropdown !== 'search') setActiveDropdown('search');
                }}
                onFocus={() => setActiveDropdown('search')}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-transparent border-none text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none"
              />
            </div>
            <kbd className="hidden lg:inline-flex items-center text-[9.5px] font-mono px-1 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-3)] border border-[var(--border)]">
              Ctrl K
            </kbd>
          </div>

          {/* Search Dropdown Modal */}
          {activeDropdown === 'search' && (
            <div className="absolute left-0 mt-1.5 w-[360px] lg:w-[420px] rounded-lg border border-[#1e2e42] bg-[#0c1322] p-2 shadow-2xl shadow-cyan-950/40 z-50 animate-fadeIn text-xs">
              {searchQuery.trim().length === 0 ? (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recent Searches
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-1.5 mb-2">
                    {recentSearches.map((rec) => (
                      <button
                        key={rec}
                        onClick={() => setSearchQuery(rec)}
                        className="px-2 py-1 rounded bg-[#182335] text-slate-300 hover:text-cyan-300 hover:bg-[#20334A] border border-[#223348] text-[11px] cursor-pointer transition-colors"
                      >
                        {rec}
                      </button>
                    ))}
                  </div>

                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-[#182335] pt-2">
                    Quick Navigation
                  </div>
                  <div className="space-y-0.5 pt-1">
                    {[
                      { id: 'ai-chart', name: 'AI Sniper Chart (BTC / Gold)', cat: 'AI Charts' },
                      { id: 'order-book-heatmap', name: 'Order Book Liquidity Heatmap (Bookmap 1:1)', cat: 'Liquidity' },
                      { id: 'deeepr-stock-research', name: 'DEEEPR Stock Positional Research (5-12M)', cat: 'Stocks' },
                      { id: 'deeepr-news-events', name: 'News & Economic Events Engine (CPI/FOMC)', cat: 'Macro' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id, item.name)}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#182335] text-left cursor-pointer transition-colors group"
                      >
                        <span className="text-slate-300 group-hover:text-cyan-300 font-medium">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.cat}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-0.5">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    {searchResults.length} Results Found
                  </div>
                  {searchResults.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id, item.name)}
                      className={`flex w-full items-center justify-between px-2.5 py-2 rounded text-left cursor-pointer transition-colors ${
                        idx === selectedSearchIdx ? 'bg-[#182335] text-cyan-300 border-l-2 border-cyan-400' : 'text-slate-300 hover:bg-[#152033]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-400">⚡</span>
                        <span className="text-xs font-medium truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a293d] text-cyan-400 font-mono border border-cyan-800/40 shrink-0">
                        {item.badge || item.category}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <p className="text-xs">No matching routes or assets found for &quot;{searchQuery}&quot;</p>
                  <p className="text-[11px] text-slate-500 mt-1">Try searching BTC, Gold, Nifty, Heatmap, or CPI</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. [LIVE TIME + DATE] & TIMEZONE SELECTOR ── */}
        <div className="relative hidden xl:flex items-center">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'timezone' ? 'none' : 'timezone'))}
            className="flex h-[28px] items-center gap-1.5 rounded-md border border-[#1e2e42] bg-[#0c1322] px-2 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer transition-colors shadow-xs"
            title="Click to change timezone (Default Asia/Kolkata IST)"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-[11px] tracking-tight">{clockString}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Timezone Selector Dropdown */}
          {activeDropdown === 'timezone' && (
            <div className="absolute top-8 left-0 w-64 rounded-lg border border-[#1e2e42] bg-[#0c1322] p-1.5 shadow-2xl z-50 animate-fadeIn text-xs">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Timezone
              </div>
              <div className="space-y-0.5 mt-1">
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <button
                    key={tz.id}
                    onClick={() => handleSelectTimezone(tz)}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded text-left cursor-pointer transition-colors ${
                      currentTimezone.id === tz.id ? 'bg-[#182335] text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-[#141e2e]'
                    }`}
                  >
                    <span>{tz.name}</span>
                    {currentTimezone.id === tz.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. [LIVE TRADING SESSION TRACKER] ── */}
        <div className="relative hidden lg:flex items-center">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'session' ? 'none' : 'session'))}
            className="flex h-[28px] items-center gap-1.5 rounded-md border border-[#1e2e42] bg-[#0c1322] px-2 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer transition-colors shadow-xs"
            title="Global Trading Session Status & Overlaps"
          >
            <span
              className={`size-2 rounded-full shrink-0 ${
                sessionStatus.isAnyActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px] font-semibold text-slate-200">
              {sessionStatus.summary}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Session Detail Dropdown */}
          {activeDropdown === 'session' && (
            <div className="absolute top-9 left-0 w-72 rounded-lg border border-[#1e2e42] bg-[#0c1322] p-2.5 shadow-2xl z-50 animate-fadeIn text-xs">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#182335]">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Global FX & Equities Sessions
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {currentTimezone.short}
                </span>
              </div>

              <div className="space-y-1.5">
                {sessionStatus.list.map((s) => (
                  <div
                    key={s.name}
                    className={`p-2 rounded border transition-colors ${
                      s.isActive
                        ? 'bg-[#182335] border-cyan-800/50 text-slate-100'
                        : 'bg-[#0f1726]/60 border-[#1a2536] text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${s.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        {s.name} ({s.center})
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {s.isActive ? 'ACTIVE' : 'CLOSED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-mono">
                      <span>{s.desc}</span>
                      <span>{s.startUtc}:00 – {s.endUtc}:00 UTC</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#182335] text-[10px] text-slate-400 leading-tight">
                💡 <span className="text-cyan-400 font-semibold">Crypto Markets</span> trade 24/7/365 uninterrupted.
              </div>
            </div>
          )}
        </div>

        {/* ── 5. [DARK / LIGHT THEME TOGGLE] ── */}
        <div
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          className="flex items-center rounded-[8px] border p-0.5 text-xs shadow-xs"
        >
          <button
            type="button"
            onClick={() => onSelectTheme ? onSelectTheme('dark') : onToggleTheme()}
            style={
              theme === 'dark' || (!theme && isDarkMode)
                ? { background: 'var(--brand-grad)', color: '#ffffff' }
                : undefined
            }
            className={`px-2 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              theme === 'dark' || (!theme && isDarkMode)
                ? 'shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
            }`}
            title="Dark Mode (Terminal Cyber)"
          >
            <Moon className="w-3 h-3" />
            <span className="hidden 2xl:inline text-[11px]">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTheme ? onSelectTheme('light') : onToggleTheme()}
            style={
              theme === 'light'
                ? { background: 'var(--brand-grad)', color: '#ffffff' }
                : undefined
            }
            className={`px-2 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              theme === 'light'
                ? 'shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
            }`}
            title="Light Mode (Financial Pro)"
          >
            <Sun className="w-3 h-3" />
            <span className="hidden 2xl:inline text-[11px]">Light</span>
          </button>
        </div>

        {/* ── 6. [BEGINNER / ADVANCED MODE] ── */}
        <div
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          className="hidden sm:flex items-center rounded-[8px] border p-0.5 text-xs shadow-xs"
        >
          <button
            type="button"
            onClick={() => handleToggleMode('beginner')}
            style={
              tradingMode === 'beginner'
                ? { background: 'var(--brand-grad)', color: '#ffffff' }
                : undefined
            }
            className={`px-2 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              tradingMode === 'beginner'
                ? 'shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
            }`}
            title="Beginner Mode: Simplified language, key metrics, clear summaries"
          >
            Beginner
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('advanced')}
            style={
              tradingMode === 'advanced'
                ? { background: 'var(--brand-grad)', color: '#ffffff' }
                : undefined
            }
            className={`px-2 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              tradingMode === 'advanced'
                ? 'shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
            }`}
            title="Advanced Mode: Full institutional SMC/ICT, order flow & liquidity depth"
          >
            Advanced
          </button>
        </div>

        {/* ── 7. [ALERTS CENTER] ── */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'alerts' ? 'none' : 'alerts'))}
            className="relative flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[#1e2e42] bg-[#0c1322] text-slate-300 hover:border-cyan-500/50 hover:text-white cursor-pointer transition-colors shadow-xs"
            title="Alerts Center (Market structure, signals, macro)"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {activeDropdown === 'alerts' && (
            <div className="absolute right-0 top-10 w-80 sm:w-88 rounded-lg border border-[#1e2e42] bg-[#0c1322] p-2.5 shadow-2xl z-50 animate-fadeIn text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#182335]">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Institutional Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAlertsAsRead}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => handleNavigate(alt.targetTab)}
                    className={`p-2 rounded border cursor-pointer transition-colors text-left ${
                      alt.isRead
                        ? 'bg-[#0f1726]/40 border-[#1a2536] text-slate-400 hover:bg-[#152033]'
                        : 'bg-[#182335] border-cyan-800/40 text-slate-200 hover:border-cyan-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200 truncate flex-1">
                        {alt.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 ml-2 shrink-0">
                        {alt.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {alt.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-[#182335] flex items-center justify-between text-[11px]">
                <button
                  onClick={() => handleNavigate('telegram-alerts')}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open VIP Telegram Bot</span>
                </button>
                <span className="text-[10px] text-slate-500 font-mono">Real-time Stream</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 8. [REPORTS CENTER] ── */}
        <div className="relative hidden md:flex items-center">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'reports' ? 'none' : 'reports'))}
            className="flex h-[34px] items-center gap-1.5 rounded-md border border-[#1e2e42] bg-[#0c1322] px-2.5 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer transition-colors shadow-xs"
            title="Institutional Research & Performance Reports"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-xs">Reports</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Reports Dropdown */}
          {activeDropdown === 'reports' && (
            <div className="absolute right-0 top-10 w-72 rounded-lg border border-[#1e2e42] bg-[#0c1322] p-2 shadow-2xl z-50 animate-fadeIn text-xs">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#182335] pb-1.5 mb-1">
                Institutional Reports Center
              </div>
              <div className="space-y-1">
                {[
                  { id: 'daily-report', title: 'Daily Market Intelligence Report', desc: 'Global macro, crypto & market briefing' },
                  { id: 'deeepr-stock-research', title: 'DEEEPR Stock Positional Research', desc: '5-12M holding thesis & financial quality' },
                  { id: 'gold-btc-transmission', title: 'Gold & BTC Transmission Models', desc: 'Yield curve & inflation correlation report' },
                  { id: 'reports', title: 'Performance Analytics & Journal', desc: 'Session win rate, trade logs & drawdown' },
                  { id: 'global-score', title: 'Global Stock Score Dossier', desc: 'Top Indian & US equities rank score' }
                ].map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => handleNavigate(rep.id)}
                    className="flex w-full flex-col px-2.5 py-1.5 rounded hover:bg-[#182335] text-left cursor-pointer transition-colors group"
                  >
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300 text-xs">
                      {rep.title}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-snug">
                      {rep.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 9. [SIGN IN / USER ACCOUNT] ── */}
        <div className="flex shrink-0 items-center">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown((prev) => (prev === 'user' ? 'none' : 'user'))}
                className="flex h-[34px] items-center gap-2 rounded-md border border-[#1e2e42] bg-[#0c1322] px-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 cursor-pointer transition-all shadow-xs"
                title="User Profile & Account Menu"
              >
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-5 w-5 rounded-full object-cover border border-cyan-400"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold font-mono">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 border border-slate-900" />
                </div>
                <span className="truncate max-w-[70px] sm:max-w-[100px] font-mono text-xs hidden sm:inline">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {activeDropdown === 'user' && (
                <div
                  className="absolute right-0 top-10 w-56 rounded-xl border border-[#1e2e42] bg-[#0c1322] p-2 shadow-2xl z-50 animate-fadeIn text-xs font-sans"
                  onClick={() => setActiveDropdown('none')}
                >
                  <div className="p-2 border-b border-[#182335] space-y-0.5">
                    <div className="font-bold text-slate-100 font-mono truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {user.email || user.phone}
                    </div>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/40">
                        {user.subscriptionTier || 'PRO'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">Verified ✓</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        if (onOpenProfile) onOpenProfile();
                        else openAuthModal('PROFILE');
                      }}
                      className="w-full rounded px-2.5 py-1.5 text-left text-slate-300 hover:text-white hover:bg-[#182335] transition-colors flex items-center gap-2 cursor-pointer font-mono"
                    >
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={onOpenAccount}
                      className="w-full rounded px-2.5 py-1.5 text-left text-slate-300 hover:text-white hover:bg-[#182335] transition-colors flex items-center gap-2 cursor-pointer font-mono"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Account & Security</span>
                    </button>

                    {onNavigatePricing && (
                      <button
                        onClick={onNavigatePricing}
                        className="w-full rounded px-2.5 py-1.5 text-left text-slate-300 hover:text-white hover:bg-[#182335] transition-colors flex items-center gap-2 cursor-pointer font-mono"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Subscription Plans</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#182335]">
                    <button
                      onClick={logout}
                      className="w-full rounded px-2.5 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors flex items-center gap-2 cursor-pointer font-mono font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('LOGIN')}
              className="flex h-[34px] items-center gap-1.5 rounded-md border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 px-3 text-xs font-semibold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              title="Sign in to your institutional account"
            >
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
