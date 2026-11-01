import React, { useState, useEffect } from 'react';
import { isTabPremium, isFounderPassportActive } from '../services/subscriptionEntitlementService';
import { Lock } from 'lucide-react';
import { soundEffects } from '../services/soundEffectsService';

export interface NavCategory {
  title: string;
  items: { id: string; label: string }[];
}

export interface MenuItem {
  id: string;
  name: string;
  cat: string;
  color: string;
}

export interface SidebarSectionItem {
  emoji: string;
  name: string;
  route: string;
}

export interface SidebarSection {
  title: string;
  color: string;
  icon?: string;
  items: SidebarSectionItem[];
}

// ── COLOR-CODED MASTER SECTIONS CATALOG (BLOOMBERG / TRADINGVIEW / LINEAR) ──
export const SECTIONS: SidebarSection[] = [
  {
    title: 'DASHBOARD',
    color: '#3b82f6', // Royal Blue
    icon: '📊',
    items: [
      { emoji: '📋', name: 'AI Pre-Trade Analysis & Checklist', route: 'pre-trade' },
      { emoji: '⚡', name: 'Pump / Dump Radar (Kyun Aaya?)', route: 'pump-dump-radar' },
      { emoji: '🎯', name: 'Global Market Score', route: 'global-score' },
      { emoji: '🏛️', name: 'Institutional AI Terminal', route: 'institutional-terminal' },
      { emoji: '🎯', name: 'AI Sniper Chart', route: 'ai-chart' },
      { emoji: '⚡', name: 'AI Decision & Live Chart', route: 'institutional-multi-asset' },
      { emoji: '📊', name: 'Live Market Overview', route: 'overview' },
      { emoji: '📰', name: 'Daily Market Report', route: 'daily-report' },
      { emoji: '👥', name: 'Crowd Long/Short Sentiment', route: 'crowd' },
    ],
  },
  {
    title: 'AI & CONFLUENCE',
    color: '#818cf8', // Indigo
    icon: '⚡',
    items: [
      { emoji: '🤖', name: 'DEEEPR.AI Copilot', route: 'deeepr-ai' },
      { emoji: '🎯', name: 'DEEEPR Precision Entry', route: 'deeepr-precision-entry' },
      { emoji: '📈', name: 'Market Chart AI Analyzer', route: 'market-chart-analyse' },
      { emoji: '✨', name: 'DEEEPR A-to-Z Pipeline', route: 'deeepr-atoz' },
      { emoji: '🧭', name: 'MTF Trend Analysis', route: 'trend-analysis' },
      { emoji: '📊', name: 'TradeAI Terminal', route: 'ultra-ai' },
      { emoji: '🧩', name: 'Cross-Asset Confirmation', route: 'cross-asset-confirmation' },
      { emoji: '📊', name: 'Confluence Engine', route: 'confluence' },
      { emoji: '📡', name: 'Bull/Bear Scanner', route: 'scanner' },
      { emoji: '📉', name: 'Market-Regime Matrix', route: 'regime' },
    ],
  },
  {
    title: 'LIQUIDATION & ORDER FLOW',
    color: '#fb7185', // Rose
    icon: '🌊',
    items: [
      { emoji: '🌊', name: 'Bookmap Liquidation Live', route: 'bookmap-liquidation' },
      { emoji: '💧', name: 'Liquidity Sweep & Liquidation', route: 'liquidity-sweep-map' },
      { emoji: '📡', name: 'DEEEPR Big Player Radar', route: 'deeepr-big-player-radar' },
      { emoji: '🔥', name: 'Liquidation Heatmap Pro', route: 'liquidation-heatmap' },
      { emoji: '📊', name: 'Order Flow & Bookmap AI', route: 'order-flow' },
      { emoji: '🗺️', name: 'Liquidation (CoinGlass)', route: 'liquidation-map' },
      { emoji: '🐋', name: 'Whale Engine & Smart Money', route: 'whales' },
      { emoji: '🏊', name: 'Banking & Global Liquidity', route: 'liquidity' },
    ],
  },
  {
    title: 'GOLD, METALS & COMMODITIES',
    color: '#f5c451', // Gold
    icon: '🥇',
    items: [
      { emoji: '⚡', name: 'Gold SMC Auto Trade Lab', route: 'gold-smc-lab' },
      { emoji: '🥇', name: 'Gold Macro Overview', route: 'gold' },
      { emoji: '🪙', name: 'DEEEPR Gold Entry & Reason', route: 'deeepr-gold-entry-engine' },
      { emoji: '🏆', name: 'Institutional XAUUSD Terminal', route: 'xauusd-institutional' },
      { emoji: '🎯', name: 'Gold Signal Panel (TP/SL)', route: 'gold-signal-panel' },
      { emoji: '🤖', name: 'Gold Trading AI', route: 'gold-ai' },
      { emoji: '🔗', name: 'Gold & BTC Transmission', route: 'gold-btc-transmission' },
      { emoji: '🛢️', name: 'Oil Intelligence Terminal', route: 'oil-trading-ai' },
      { emoji: '⛽', name: 'EIA & API Inventory Radar', route: 'oil-inventory-engine' },
      { emoji: '🌍', name: 'Oil Geopolitical Radar', route: 'oil-geopolitical-radar' },
      { emoji: '📐', name: 'Oil Institutional Risk Sizer', route: 'oil-position-sizer' },
    ],
  },
  {
    title: 'ANALYSIS, VOLUME & MOMENTUM',
    color: '#34d399', // Emerald
    icon: '📈',
    items: [
      { emoji: '🔮', name: 'BTC-USDT Momentum Prediction', route: 'btc-usdt-momentum' },
      { emoji: '📊', name: 'DEEEPR Volume Profile Scanner', route: 'deeepr-volume-profile-scanner' },
      { emoji: '📐', name: 'DEEEPR Auto-Fibonacci', route: 'deeepr-auto-fibonacci' },
      { emoji: '📈', name: 'Volume Profile Pro (VAH/VAL)', route: 'volume-profile-ai' },
      { emoji: '📶', name: 'Volume Profile Confluence', route: 'volume-profile-confluence' },
      { emoji: '⚡', name: 'Intermarket Radar (USDT.D)', route: 'intermarket-radar' },
      { emoji: '📉', name: 'Charts & Correlations', route: 'correlations' },
    ],
  },
  {
    title: 'STOCKS & EQUITY RESEARCH',
    color: '#60a5fa', // Sky Blue
    icon: '💼',
    items: [
      { emoji: '🇮🇳', name: 'Indian Stocks AI (Top 500)', route: 'indian-stock-ai' },
      { emoji: '🇺🇸', name: 'USA Top 1000 AI (INDmoney)', route: 'usa-stock-ai' },
      { emoji: '📈', name: 'AI Stocks (US + NIFTY 100)', route: 'stock-ai' },
      { emoji: '⚡', name: 'USA Stocks 4H Swing Scanner', route: 'usa-swing-scanner' },
      { emoji: '🛡️', name: 'Earnings Risk Guard (<14D)', route: 'usa-earnings-guard' },
      { emoji: '💼', name: 'US 1-6M Portfolio Builder', route: 'usa-portfolio-builder' },
      { emoji: '🔬', name: 'DEEEPR Stock Research (5-12M)', route: 'deeepr-stock-research' },
    ],
  },
  {
    title: 'CRYPTO & DELTA INDIA',
    color: '#a78bfa', // Violet
    icon: '₿',
    items: [
      { emoji: '🇮🇳', name: 'Delta India Multi-Coin Engine', route: 'delta-intelligence' },
      { emoji: '⚡', name: 'Delta 4H All-Coin Scanner', route: 'delta-swing-scanner' },
      { emoji: '🔥', name: 'Top 5 Alpha Swings (Delta)', route: 'delta-swing-top5' },
      { emoji: '💎', name: 'Delta 1-3M Investment Outlook', route: 'delta-wealth-1-3m' },
      { emoji: '💰', name: 'Crypto Wealth Intelligence', route: 'crypto-wealth-intelligence' },
      { emoji: '🤖', name: 'Crypto Trading AI', route: 'crypto-ai' },
      { emoji: '🧠', name: 'AI Crypto Brain', route: 'crypto-brain' },
      { emoji: '₿', name: 'Bitcoin Macro Engine', route: 'btc-engine' },
      { emoji: '⛓️', name: 'On-Chain Analytics Engine', route: 'onchain-engine' },
      { emoji: '📊', name: 'Derivatives Engine', route: 'derivatives-engine' },
      { emoji: '📉', name: 'Options Volatility Engine', route: 'options' },
      { emoji: '🏦', name: 'ETF & Institutional Flows', route: 'etf' },
      { emoji: '💵', name: 'Stablecoins & Liquidity', route: 'stablecoin-engine' },
      { emoji: '⟠', name: 'Ethereum & Dominance', route: 'eth-engine' },
      { emoji: '🪙', name: 'Altcoins & Token Unlocks', route: 'altcoins' },
      { emoji: '🌾', name: 'DeFi & Ecosystems', route: 'defi' },
      { emoji: '📢', name: 'Market Narratives Radar', route: 'narratives' },
      { emoji: '📅', name: 'Crypto Calendar', route: 'crypto-calendar' },
    ],
  },
  {
    title: 'GLOBAL MACRO & ECONOMY',
    color: '#38bdf8', // Cyan
    icon: '🌐',
    items: [
      { emoji: '🌐', name: 'Global Macro Overview', route: 'landing' },
      { emoji: '⚡', name: 'Live Event Impact Engine', route: 'event-impact-engine' },
      { emoji: '🎯', name: '3-Scenario Matrix (CPI/FOMC)', route: 'macro-scenarios-matrix' },
      { emoji: '🌍', name: 'Global Intelligence', route: 'global-intel' },
      { emoji: '📅', name: 'US Events & News', route: 'usa-events' },
      { emoji: '📅', name: 'Economic Calendar', route: 'calendar' },
      { emoji: '🏛️', name: 'Federal Reserve (FOMC)', route: 'fed' },
      { emoji: '🏦', name: 'Global Central Banks', route: 'central-banks' },
      { emoji: '📈', name: 'Yield Curve & Treasuries', route: 'yields' },
      { emoji: '💵', name: 'US Economic Data', route: 'us-economy' },
      { emoji: '📊', name: 'GDP & Growth', route: 'gdp' },
      { emoji: '🔥', name: 'Inflation Dashboard', route: 'inflation' },
      { emoji: '👷', name: 'Labour Market & NFP', route: 'labour' },
      { emoji: '💱', name: 'Forex Dashboard', route: 'forex' },
      { emoji: '🛡️', name: 'Geopolitical Risk Radar', route: 'geopolitics' },
      { emoji: '😱', name: 'Sentiment & Fear/Greed', route: 'sentiment' },
      { emoji: '⚖️', name: 'Put/Call Ratio', route: 'put-call' },
    ],
  },
  {
    title: 'NEWS, VOICE & ALERTS',
    color: '#c084fc', // Purple
    icon: '📰',
    items: [
      { emoji: '📰', name: 'Financial News', route: 'news' },
      { emoji: '🎙️', name: 'Jarvis AI Market Voice', route: 'jarvis-voice-ai' },
      { emoji: '🤖', name: 'Jarvis Voice Assistant', route: 'assistant' },
      { emoji: '📲', name: 'Telegram AI Alerts', route: 'telegram-alerts' },
    ],
  },
  {
    title: 'ACCOUNT & JOURNAL',
    color: '#f472b6', // Pink
    icon: '👤',
    items: [
      { emoji: '📜', name: 'Trading Journal', route: 'journal' },
      { emoji: '📑', name: 'Journal Reports', route: 'reports' },
      { emoji: '🛡️', name: 'AI Risk Console', route: 'risk' },
      { emoji: '💎', name: 'Subscription & Plans', route: 'pricing' },
      { emoji: '👤', name: 'My Account & Profile', route: 'account' },
    ],
  },
];

// Preserving legacy MENU export for full backward compatibility
export const MENU: MenuItem[] = SECTIONS.flatMap((sec) =>
  sec.items.map((item) => ({
    id: item.route,
    name: item.name,
    cat: sec.title,
    color: sec.color,
  }))
);

export const NAV_CATEGORIES: NavCategory[] = SECTIONS.map((s) => ({
  title: s.title,
  items: s.items.map((i) => ({ id: i.route, label: i.name })),
}));

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isDarkMode?: boolean;
  isMobile?: boolean;
  width?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode = true,
  isMobile = false,
  width = 192,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (isFounderPassportActive()) return true;
    try {
      const raw = localStorage.getItem('ISHANT_CURRENT_SUB');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.status === 'ACTIVE' && new Date(parsed.expiryDate) > new Date();
      }
    } catch {}
    return false;
  });

  const sidebarRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      if (isFounderPassportActive()) {
        setIsUnlocked(true);
        return;
      }
      try {
        const raw = localStorage.getItem('ISHANT_CURRENT_SUB');
        if (raw) {
          const parsed = JSON.parse(raw);
          setIsUnlocked(parsed.status === 'ACTIVE' && new Date(parsed.expiryDate) > new Date());
          return;
        }
      } catch {}
      setIsUnlocked(false);
    };

    window.addEventListener('subscription_updated', handleUpdate);
    return () => window.removeEventListener('subscription_updated', handleUpdate);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      aria-label="Terminal navigation"
      style={isMobile ? undefined : { width: `${width}px`, minWidth: `${width}px` }}
      className={`sidebar iitian-sidebar-root iitian-scroll select-none ${
        isMobile
          ? 'block w-full h-full border-none'
          : 'hidden shrink-0 sticky top-[46px] h-[calc(100vh-46px)] lg:block'
      } overflow-y-scroll pb-16 z-20 transition-[width] duration-75`}
    >
      <div className="py-2 px-1.5 space-y-3">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {/* Section Heading: clean mono uppercase with small icon badge matching lovable.app */}
            <div
              className="iitian-section-heading px-2 pt-1.5 pb-0.5 flex items-center gap-2"
              style={{ color: section.color }}
            >
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[11px]"
                style={{
                  backgroundColor: `color-mix(in srgb, ${section.color} 15%, transparent)`,
                  color: section.color,
                }}
              >
                {section.icon || '⚡'}
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] font-semibold tracking-[1.3px] truncate">
                {section.title}
              </span>
            </div>

            {/* Section Items */}
            <div className="space-y-[1.5px]">
              {section.items.map((item) => {
                const isActive = activeTab === item.route;
                const isLocked = isTabPremium(item.route) && !isUnlocked;

                return (
                  <button
                    type="button"
                    key={item.route + item.name}
                    onClick={() => {
                      soundEffects.playBlip();
                      onSelectTab(item.route);
                    }}
                    title={item.name}
                    className={`iitian-item-btn w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-left text-[12.8px] leading-tight transition-all cursor-pointer ${
                      isActive
                        ? 'active font-semibold bg-[#2563eb] text-white shadow-md shadow-blue-600/30'
                        : 'text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className={`iitian-item-emoji text-[13px] shrink-0 w-4 text-center leading-none ${isActive ? 'text-white' : ''}`}>
                      {item.emoji}
                    </span>
                    <span className={`iitian-item-label flex-1 leading-snug truncate ${isActive ? 'text-white font-medium' : ''}`}>
                      {item.name}
                    </span>
                    {isLocked && (
                      <Lock className={`w-3 h-3 shrink-0 ml-0.5 ${isActive ? 'text-white/80' : 'text-amber-400 opacity-75'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Navigation / Scroll To Top Affordance */}
      <div className="sticky bottom-0 left-0 right-0 py-1.5 px-2 bg-[var(--surface-1)]/95 backdrop-blur-md border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-3)] font-mono z-10">
        <span className="truncate max-w-[110px] text-[var(--text-2)] font-semibold uppercase">{activeTab}</span>
        <button
          type="button"
          onClick={() => sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-blue-500 hover:text-blue-400 font-bold px-1.5 py-0.5 rounded hover:bg-blue-500/10 transition-colors cursor-pointer"
          title="Scroll up to top"
        >
          ↑ TOP
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
