import React from 'react';

export interface NavCategory {
  title: string;
  icon: string;
  items: { id: string; label: string; icon: string }[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    title: 'AI Decision & Live Chart',
    icon: '⚡',
    items: [
      { id: 'gold', label: 'Gold Macro Overview 🥇', icon: '🥇' },
      { id: 'news', label: 'Financial News 📰', icon: '📰' },
      { id: 'jarvis-voice-ai', label: 'Jarvis AI Market Voice Expert 🎙️⭐ (Hindi/Hinglish/Eng)', icon: '🎙️' },
      { id: 'liquidity-sweep-map', label: 'Liquidity Sweep & Liquidation Map ⭐ (Pro)', icon: '🌊' },
      { id: 'btc-usdt-momentum', label: 'BTC–USDT Momentum Prediction Engine ⭐ (Institutional)', icon: '🔄' },
      { id: 'market-chart-analyse', label: 'Market Chart AI Analyzer ⭐ (A-to-Z Read)', icon: '🔬' },
      { id: 'crypto-wealth-intelligence', label: 'Crypto Long-Term Wealth Intelligence ⭐ (Delta 1-4M+)', icon: '💎' },
      { id: 'institutional-terminal', label: 'Institutional AI Terminal ⭐ (BTC + Gold)', icon: '🏛️' },
      { id: 'deeepr-ai', label: 'DEEEPR.AI Copilot ⭐ (BTC / Gold)', icon: '🔮' },
      { id: 'ai-chart', label: 'AI Sniper Chart (Long/Short) 🎯', icon: '📈' }
    ]
  },
  {
    title: 'Stocks & Global',
    icon: '🏦',
    items: [
      { id: 'indian-stock-ai', label: 'Indian Stocks AI ⭐ (Top 500)', icon: '🇮🇳' },
      { id: 'usa-stock-ai', label: 'USA Top 1000 AI ⭐ (INDmoney)', icon: '🇺🇸' },
      { id: 'volume-profile-ai', label: 'Volume Profile AI ⭐ (Crypto/Gold/Silver)', icon: '📶' },
      { id: 'gold-ai', label: 'Gold Trading AI ⭐', icon: '🥇' },
      { id: 'stock-ai', label: 'AI Stocks (US + NIFTY 100)', icon: '📊' },
      { id: 'global-intel', label: 'Global Intelligence', icon: '🌍' },
      { id: 'ultra-ai', label: 'TradeAI Terminal ⭐', icon: '⚡' },
      { id: 'order-flow', label: 'Order Flow & Bookmap AI ⭐ (BTC/ETH/Gold/Silver/SOL)', icon: '🌊' }
    ]
  },
  {
    title: 'Delta 4H Swing Scanner ⭐',
    icon: '⚡',
    items: [
      { id: 'delta-swing-scanner', label: 'Delta 4H All-Coin Scanner ⭐ (SMC & Profile)', icon: '⚡' },
      { id: 'delta-swing-top5', label: 'Top 5 Alpha Swings (Delta)', icon: '🔥' },
      { id: 'delta-wealth-1-3m', label: 'Delta 1-3M Investment Outlook', icon: '💎' }
    ]
  },
  {
    title: 'USA Stock Swing & Invest ⭐',
    icon: '🇺🇸',
    items: [
      { id: 'usa-swing-scanner', label: 'USA Stocks 4H Swing Scanner ⭐ (S&P/Nasdaq)', icon: '📈' },
      { id: 'usa-earnings-guard', label: 'Earnings Risk Guard (<14D Warning)', icon: '🛡️' },
      { id: 'usa-portfolio-builder', label: 'US 1-6M Portfolio Builder', icon: '💼' }
    ]
  },
  {
    title: 'Market News & Event Impact ⭐',
    icon: '🌍',
    items: [
      { id: 'event-impact-engine', label: 'Live Event Impact Engine ⭐ (Live Scenarios)', icon: '🌍' },
      { id: 'macro-scenarios-matrix', label: '3-Scenario Matrix (CPI/FOMC/NFP)', icon: '📊' },
      { id: 'gold-btc-transmission', label: 'Gold & Bitcoin Transmission Models', icon: '🥇' },
      { id: 'voice-query-assistant', label: 'AI Voice Macro Assistant 🎙️ (Hindi/Eng)', icon: '🎙️' }
    ]
  },
  {
    title: 'Crypto Engines',
    icon: '🧬',
    items: [
      { id: 'liquidation-heatmap', label: 'Liquidation Heatmap Bookmap ⭐ (BTC/Gold/ETH/SOL)', icon: '🔥' },
      { id: 'delta-intelligence', label: 'Delta India Multi-Coin Engine ⭐ (1-3M)', icon: '🏛️' },
      { id: 'crypto-ai', label: 'Crypto Trading AI ⭐ (BTC/ETH/SOL)', icon: '⚡' },
      { id: 'crypto-brain', label: 'AI Crypto Brain', icon: '🤖' },
      { id: 'macro-engine', label: 'Macro Engine', icon: '🌐' },
      { id: 'economic-events', label: 'News Events (CPI/FOMC)', icon: '📅' },
      { id: 'btc-engine', label: 'Bitcoin Engine', icon: '₿' },
      { id: 'onchain-engine', label: 'On-Chain Engine', icon: '⛓️' },
      { id: 'whales', label: 'Whale Engine', icon: '🐋' },
      { id: 'derivatives-engine', label: 'Derivatives Engine', icon: '🎲' },
      { id: 'liquidation-map', label: 'Liquidation (CoinGlass Pro)', icon: '🔥' },
      { id: 'options', label: 'Options Engine', icon: '🎯' },
      { id: 'etf', label: 'ETF & Institutional', icon: '🏛️' },
      { id: 'stablecoin-engine', label: 'Stablecoins & Flows', icon: '💵' },
      { id: 'eth-engine', label: 'Ethereum & Dominance', icon: 'Ξ' },
      { id: 'altcoins', label: 'Altcoins & Unlocks', icon: '🪙' },
      { id: 'defi', label: 'DeFi & Ecosystems', icon: '🧱' },
      { id: 'narratives', label: 'Narratives', icon: '📡' },
      { id: 'smart-money', label: 'Smart Money', icon: '🧠' },
      { id: 'crypto-calendar', label: 'Crypto Calendar', icon: '🗓️' }
    ]
  },
  {
    title: 'Dashboard',
    icon: '📊',
    items: [
      { id: 'global-score', label: 'Global Market Score', icon: '🎯' },
      { id: 'overview', label: 'Live Market Overview', icon: '📈' },
      { id: 'daily-report', label: 'Daily Market Report', icon: '🗞️' },
      { id: 'crowd', label: 'Crowd Long/Short', icon: '👥' }
    ]
  },
  {
    title: 'Confluence',
    icon: '🧠',
    items: [
      { id: 'confluence', label: 'Confluence Engine', icon: '⚙️' },
      { id: 'scanner', label: 'Bull/Bear Scanner', icon: '🐂' },
      { id: 'regime', label: 'Market-Regime Matrix', icon: '🧩' }
    ]
  },
  {
    title: 'Economy',
    icon: '🏛️',
    items: [
      { id: 'us-economy', label: 'US Economic Data', icon: '🇺🇸' },
      { id: 'gdp', label: 'GDP & Growth', icon: '📐' },
      { id: 'inflation', label: 'Inflation Dashboard', icon: '🔥' },
      { id: 'labour', label: 'Labour Market', icon: '👷' },
      { id: 'calendar', label: 'Economic Calendar', icon: '🗓️' }
    ]
  },
  {
    title: 'Policy & Money',
    icon: '💵',
    items: [
      { id: 'fed', label: 'Federal Reserve', icon: '🏦' },
      { id: 'liquidity', label: 'Banking & Liquidity', icon: '💧' },
      { id: 'yields', label: 'Yield Curve & Bonds', icon: '📉' },
      { id: 'central-banks', label: 'Global Central Banks', icon: '🌐' }
    ]
  },
  {
    title: 'Macro Economy',
    icon: '🌡️',
    items: [
      { id: 'macro', label: 'Inflation & Growth', icon: '📊' }
    ]
  },
  {
    title: 'Crypto',
    icon: '🪙',
    items: [
      { id: 'crypto', label: 'Crypto Market', icon: '₿' },
      { id: 'onchain', label: 'On-Chain Analysis', icon: '⛓️' },
      { id: 'derivatives', label: 'Derivatives', icon: '🎲' }
    ]
  },
  {
    title: 'Traditional',
    icon: '🥇',
    items: [
      { id: 'gold', label: 'Gold Macro Overview', icon: '🥇' },
      { id: 'stocks', label: 'Stock Market', icon: '🏢' }
    ]
  },
  {
    title: 'World',
    icon: '🌍',
    items: [
      { id: 'forex', label: 'Forex Dashboard', icon: '💱' },
      { id: 'geopolitics', label: 'Geopolitical Risk', icon: '⚠️' },
      { id: 'socioeconomic', label: 'Socioeconomic Data', icon: '👥' },
      { id: 'news', label: 'Financial News', icon: '📰' },
      { id: 'sentiment', label: 'Market Sentiment', icon: '😨' },
      { id: 'put-call', label: 'Put/Call Ratio', icon: '⚖️' }
    ]
  },
  {
    title: 'Tools',
    icon: '🛠️',
    items: [
      { id: 'correlations', label: 'Charts & Correlations', icon: '📉' }
    ]
  },
  {
    title: 'Intelligence',
    icon: '🤖',
    items: [
      { id: 'assistant', label: 'Jarvis Voice Assistant 🎙️', icon: '🤖' },
      { id: 'risk', label: 'AI Risk Console', icon: '🛡️' },
      { id: 'journal', label: 'Trading Journal', icon: '📖' },
      { id: 'reports', label: 'Journal Reports', icon: '🧾' }
    ]
  },
  {
    title: 'Account',
    icon: '👤',
    items: [
      { id: 'pricing', label: 'Pricing & Plans (₹)', icon: '💎' },
      { id: 'account', label: 'My Account', icon: '👤' }
    ]
  },
  {
    title: 'Telegram & Alerts',
    icon: '📲',
    items: [
      { id: 'telegram-alerts', label: 'Telegram AI Alerts 📲⭐ (Live Bot)', icon: '🔔' }
    ]
  }
];

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isDarkMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Terminal navigation"
      className="sidebar-scroll-visible hidden w-64 shrink-0 sticky top-[84px] h-[calc(100vh-84px)] border-r border-sidebar-border bg-sidebar/95 px-4 py-6 shadow-[var(--shadow-sidebar)] backdrop-blur-xl lg:block"
    >
      {NAV_CATEGORIES.map((cat) => (
        <div key={cat.title} className="mb-6">
          <p className="label-xs mb-2.5 flex items-center gap-2 px-2 text-primary/70">
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-md bg-gold/12 text-sm"
            >
              {cat.icon}
            </span>
            {cat.title}
          </p>
          <ul className="space-y-0.5">
            {cat.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectTab(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-all text-left cursor-pointer ${
                      isActive
                        ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 to-indigo-500/15 font-bold text-cyan-300 shadow-[0_0_16px_rgba(0,242,254,0.3)] ring-1 ring-cyan-400/40'
                        : 'border-transparent text-sidebar-foreground/75 hover:border-cyan-500/30 hover:bg-slate-800/60 hover:text-white hover:shadow-sm'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center text-[13px] leading-none shrink-0"
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default Sidebar;


