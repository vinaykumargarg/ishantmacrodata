import React, { useState, useEffect } from 'react';
import { isTabPremium, isFounderPassportActive } from '../services/subscriptionEntitlementService';
import { Lock } from 'lucide-react';

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
  items: SidebarSectionItem[];
}

// ── COLOR-CODED MASTER SECTIONS CATALOG (BLOOMBERG / TRADINGVIEW / LINEAR) ──
export const SECTIONS: SidebarSection[] = [
  {
    title: 'AI & CONFLUENCE',
    color: '#818cf8', // Indigo
    items: [
      { emoji: '⚡', name: 'AI Decision & Live Chart', route: 'institutional-multi-asset' },
      { emoji: '🤖', name: 'DEEEPR.AI Copilot', route: 'deeepr-ai' },
      { emoji: '🎯', name: 'DEEEPR Precision Entry', route: 'deeepr-precision-entry' },
      { emoji: '🏛️', name: 'Institutional AI Terminal', route: 'institutional-terminal' },
      { emoji: '📈', name: 'Market Chart AI Analyzer', route: 'market-chart-analyse' },
      { emoji: '🎯', name: 'AI Sniper Chart', route: 'ai-chart' },
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
    items: [
      { emoji: '🌊', name: 'Bookmap Liquidation Live', route: 'bookmap-liquidation' },
      { emoji: '💧', name: 'Liquidity Sweep & Liquidation', route: 'liquidity-sweep-map' },
      { emoji: '📡', name: 'DEEEPR Big Player Radar', route: 'deeepr-big-player-radar' },
      { emoji: '🔥', name: 'Liquidation Heatmap Pro', route: 'liquidation-heatmap' },
      { emoji: '📊', name: 'Order Flow & Bookmap AI', route: 'order-flow' },
      { emoji: '🗺️', name: 'Liquidation (CoinGlass)', route: 'liquidation-map' },
      { emoji: '🐋', name: 'Whale Engine & Smart Money', route: 'whales' },
      { emoji: '🏊', name: 'Banking & Global Liquidity', route: 'liquidity' },
      { emoji: '👥', name: 'Crowd Long/Short Sentiment', route: 'crowd' },
    ],
  },
  {
    title: 'GOLD, METALS & COMMODITIES',
    color: '#f5c451', // Gold
    items: [
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
    items: [
      { emoji: '🇮🇳', name: 'Indian Stocks AI (Top 500)', route: 'indian-stock-ai' },
      { emoji: '🇺🇸', name: 'USA Top 1000 AI (INDmoney)', route: 'usa-stock-ai' },
      { emoji: '📈', name: 'AI Stocks (US + NIFTY 100)', route: 'stock-ai' },
      { emoji: '📊', name: 'Global Stock Score Engine', route: 'global-score' },
      { emoji: '⚡', name: 'USA Stocks 4H Swing Scanner', route: 'usa-swing-scanner' },
      { emoji: '🛡️', name: 'Earnings Risk Guard (<14D)', route: 'usa-earnings-guard' },
      { emoji: '💼', name: 'US 1-6M Portfolio Builder', route: 'usa-portfolio-builder' },
      { emoji: '🔬', name: 'DEEEPR Stock Research (5-12M)', route: 'deeepr-stock-research' },
    ],
  },
  {
    title: 'CRYPTO & DELTA INDIA',
    color: '#a78bfa', // Violet
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
    items: [
      { emoji: '🌐', name: 'Global Macro Overview', route: 'landing' },
      { emoji: '📊', name: 'Live Market Overview', route: 'overview' },
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
    items: [
      { emoji: '📰', name: 'Financial News', route: 'news' },
      { emoji: '🎙️', name: 'Jarvis AI Market Voice', route: 'jarvis-voice-ai' },
      { emoji: '🤖', name: 'Jarvis Voice Assistant', route: 'assistant' },
      { emoji: '📲', name: 'Telegram AI Alerts', route: 'telegram-alerts' },
      { emoji: '📰', name: 'Daily Market Report', route: 'daily-report' },
    ],
  },
  {
    title: 'ACCOUNT & JOURNAL',
    color: '#f472b6', // Pink
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
  width = 205,
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
      aria-label="Terminal navigation"
      style={isMobile ? undefined : { width: `${width}px`, minWidth: `${width}px` }}
      className={`sidebar iitian-sidebar-root iitian-scroll select-none ${
        isMobile
          ? 'block w-full h-full border-none'
          : 'hidden shrink-0 sticky top-[46px] h-[calc(100vh-46px)] lg:block'
      } overflow-y-scroll pb-12 z-20 transition-[width] duration-75`}
    >
      <div className="py-2 px-1.5 space-y-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {/* Section Heading: 10px uppercase, letter-spacing 1.5px, section's color + 5px dot */}
            <div
              className="iitian-section-heading px-1.5 pt-2 pb-0.5 flex items-center gap-1.5"
              style={{ color: section.color }}
            >
              <span
                className="section-dot"
                style={{ backgroundColor: section.color, color: section.color }}
              />
              <span className="tracking-[1.5px] truncate">{section.title}</span>
            </div>

            {/* Section Items */}
            <div className="space-y-[1px]">
              {section.items.map((item) => {
                const isActive = activeTab === item.route;
                const isLocked = isTabPremium(item.route) && !isUnlocked;

                return (
                  <button
                    type="button"
                    key={item.route + item.name}
                    onClick={() => onSelectTab(item.route)}
                    title={item.name}
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(90deg, color-mix(in srgb, ${section.color} 22%, transparent), transparent)`,
                            borderLeftColor: section.color,
                            color: 'var(--text)',
                          }
                        : undefined
                    }
                    className={`iitian-item-btn w-full flex items-center gap-2 px-2 py-1.5 rounded-[7px] text-left text-[12.5px] leading-tight transition-all cursor-pointer border-l-[3px] ${
                      isActive
                        ? 'active font-semibold'
                        : 'border-transparent text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="iitian-item-emoji text-[13.5px] shrink-0 w-3.5 text-center leading-none">
                      {item.emoji}
                    </span>
                    <span className="iitian-item-label flex-1 leading-snug truncate">
                      {item.name}
                    </span>
                    {isLocked && (
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0 opacity-75 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
