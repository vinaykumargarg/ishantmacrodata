import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, NAV_CATEGORIES } from './components/Sidebar';
import { TickerBar } from './components/TickerBar';
import { BiasGauge } from './components/BiasGauge';
import { AccountModal } from './components/AccountModal';
import TradingViewWidget from './components/TradingViewWidget';
import EconCalendar from './components/EconCalendar';
import { TerminalSkeleton } from './components/ui/TerminalSkeleton';
import { X } from 'lucide-react';

const StockAiView = React.lazy(() => import('./components/StockAiView'));
const AiChartView = React.lazy(() => import('./components/AiChartView'));
const InstitutionalXauusdTerminalView = React.lazy(() => import('./components/InstitutionalXauusdTerminalView'));
const TrendAnalysisView = React.lazy(() => import('./components/TrendAnalysisView'));
const GoldDashboardView = React.lazy(() => import('./components/GoldDashboardView'));
const GoldTradingAiView = React.lazy(() => import('./components/GoldTradingAiView'));
const GoldAiMarketIntelligenceView = React.lazy(() => import('./components/GoldAiMarketIntelligenceView'));
const GoldSmcAutoTradeLabView = React.lazy(() => import('./components/GoldSmcAutoTradeLabView'));
const CryptoTradingAiView = React.lazy(() => import('./components/CryptoTradingAiView'));
const IndianStockAiView = React.lazy(() => import('./components/IndianStockAiView'));
const UsaTop1000AiView = React.lazy(() => import('./components/UsaTop1000AiView'));
const LiquidationTerminalView = React.lazy(() => import('./components/LiquidationTerminalView'));
const VolumeProfileTerminalView = React.lazy(() => import('./components/VolumeProfileTerminalView'));
const OrderFlowTerminal = React.lazy(() => import('./components/OrderFlowTerminal'));
const UltraInstitutionalDecisionEngine = React.lazy(() =>
  import('./components/UltraInstitutionalDecisionEngine').then((m) => ({ default: m.UltraInstitutionalDecisionEngine }))
);
const DeltaIntelligenceEngineView = React.lazy(() => import('./components/DeltaIntelligenceEngineView'));
const DeeeprAiChartView = React.lazy(() => import('./components/DeeeprAiChartView'));
const DeeeprDecisionEngineView = React.lazy(() =>
  import('./components/DeeeprDecisionEngineView').then((m) => ({ default: m.DeeeprDecisionEngineView }))
);
const DeeeprPrecisionEntryView = React.lazy(() =>
  import('./components/DeeeprPrecisionEntryView').then((m) => ({ default: m.DeeeprPrecisionEntryView }))
);
const DeeeprBigPlayerRadarView = React.lazy(() =>
  import('./components/DeeeprBigPlayerRadarView').then((m) => ({ default: m.DeeeprBigPlayerRadarView }))
);
const DeeeprGoldEntryReasonView = React.lazy(() =>
  import('./components/DeeeprGoldEntryReasonView').then((m) => ({ default: m.DeeeprGoldEntryReasonView }))
);
const DeeeprVolumeProfileScannerView = React.lazy(() =>
  import('./components/DeeeprVolumeProfileScannerView').then((m) => ({ default: m.DeeeprVolumeProfileScannerView }))
);
const DeeeprAutoFibonacciView = React.lazy(() =>
  import('./components/DeeeprAutoFibonacciView').then((m) => ({ default: m.DeeeprAutoFibonacciView }))
);
const InstitutionalAiTerminalView = React.lazy(() => import('./components/InstitutionalAiTerminalView'));
const AdvancedInstitutionalChart = React.lazy(() => import('./components/AdvancedInstitutionalChart'));
const InstitutionalMultiAssetEngineView = React.lazy(() => import('./components/InstitutionalMultiAssetEngineView'));
const MarketChartAnalyserTerminalView = React.lazy(() => import('./components/MarketChartAnalyserTerminalView'));
const CryptoWealthIntelligenceTerminalView = React.lazy(() => import('./components/CryptoWealthIntelligenceTerminalView'));
const LiquidationHeatmapTerminalView = React.lazy(() => import('./components/LiquidationHeatmapTerminalView'));
const BookmapLiquidationTerminalView = React.lazy(() => import('./components/BookmapLiquidationTerminalView'));
const OrderBookHeatmapView = React.lazy(() => import('./components/OrderBookHeatmapView'));
const RetailCrowdSentimentView = React.lazy(() => import('./components/RetailCrowdSentimentView'));
const DeeeprNewsEventsView = React.lazy(() => import('./components/DeeeprNewsEventsView'));
const UsaEconomicCalendarView = React.lazy(() => import('./components/UsaEconomicCalendarView'));
const DeeeprUsEventsView = React.lazy(() => import('./components/DeeeprUsEventsView'));
const SubscriptionPricingView = React.lazy(() => import('./components/SubscriptionPricingView'));
const BtcUsdtRelationshipEngine = React.lazy(() => import('./components/BtcUsdtRelationshipEngine'));
const CrossAssetConfirmationEngineView = React.lazy(() =>
  import('./components/CrossAssetConfirmationEngineView').then((m) => ({ default: m.CrossAssetConfirmationEngineView }))
);
const LiquiditySweepIntelligenceView = React.lazy(() =>
  import('./components/LiquiditySweepIntelligenceView').then((m) => ({ default: m.LiquiditySweepIntelligenceView }))
);
const TelegramAiAlertsView = React.lazy(() =>
  import('./components/TelegramAiAlertsView').then((m) => ({ default: m.TelegramAiAlertsView }))
);
const DeltaSwingScannerView = React.lazy(() => import('./components/DeltaSwingScannerView'));
const UsaStockScannerView = React.lazy(() => import('./components/UsaStockScannerView'));
const EventImpactEngineView = React.lazy(() => import('./components/EventImpactEngineView'));
const OilIntelligenceTerminalView = React.lazy(() => import('./components/OilIntelligenceTerminalView'));
const GoldSignalPanelView = React.lazy(() => import('./components/GoldSignalPanelView'));
const IshantMacroPortalView = React.lazy(() =>
  import('./components/IshantMacroPortalView').then((m) => ({ default: m.IshantMacroPortalView }))
);
const GlobalStockScoreEngineView = React.lazy(() => import('./components/GlobalStockScoreEngineView'));
const DeeeprStockResearchEngineView = React.lazy(() => import('./components/DeeeprStockResearchEngineView'));
const DeeeprLiquidationHubView = React.lazy(() => import('./components/DeeeprLiquidationHubView'));
const DeeeprAtoZPipelineView = React.lazy(() => import('./components/DeeeprAtoZPipelineView'));
const IntermarketCorrelationRadarView = React.lazy(() => import('./components/IntermarketCorrelationRadarView'));
const AuthPageView = React.lazy(() =>
  import('./components/AuthPageView').then((m) => ({ default: m.AuthPageView }))
);
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { JarvisVoiceMarketAssistant } from './components/JarvisVoiceMarketAssistant';
import { JarvisFloatingWidget } from './components/JarvisFloatingWidget';
import { OtpNotificationBanner } from './components/OtpNotificationBanner';
import {
  ALL_WORLD_GLOBAL_NEWS_FEED,
  UPCOMING_MACRO_CALENDAR_EVENTS
} from './data/institutionalMarketIntelligenceData';
import { BrandLogo } from './components/BrandLogo';
import { ErrorBoundary } from './components/ErrorBoundary';
import PremiumFeatureLockGate from './components/PremiumFeatureLockGate';
import { canAccessTab, isFounderPassportActive } from './services/subscriptionEntitlementService';
import { getActiveSubscription } from './services/paymentService';
import { UserSubscriptionRecord } from './data/subscriptionConfig';
import {
  ENGINE_SCORES,
  REGIME_DETECTOR,
  LONG_TERM_INVESTOR_PANEL,
  ETF_ISSUERS,
  CORPORATE_TREASURIES,
  LIQUIDATION_CLUSTERS_BTC,
  LIQUIDATION_CLUSTERS_ETH,
  DERIVATIVES_EXCHANGES,
  TOKEN_UNLOCKS,
  ALTCOINS_DATA,
  DEFI_CHAINS,
  NARRATIVES,
  CONFLUENCE_PILLARS,
  BULL_BEAR_SCANNER,
  CENTRAL_BANKS,
  CORRELATIONS_MATRIX,
  GEOPOLITICAL_RISKS,
  ACTIVE_SIGNALS
} from './data/terminalData';
import { MarketTicker } from './types';

/* ────────────────────────── LIVE TICKERS DATA ────────────────────────── */
const BASE_TICKERS: MarketTicker[] = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50', price: '25,014', change: '+1.18%', isPositive: true, category: 'Equities' },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: '81,720', change: '-0.45%', isPositive: false, category: 'Equities' },
  { symbol: 'INDIA VIX', name: 'India Volatility Index', price: '15.20', change: '-6.43%', isPositive: false, category: 'Equities' },
  { symbol: 'VIX', name: 'CBOE Volatility Index', price: '16.65', change: '-1.54%', isPositive: false, category: 'Equities' },
  { symbol: 'XAU/USD', name: 'Gold Spot', price: '4,033.1', change: '+0.28%', isPositive: true, category: 'Commodities' },
  { symbol: 'XAG/USD', name: 'Silver Spot', price: '52.72', change: '+0.32%', isPositive: true, category: 'Commodities' },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '81,073', change: '+0.66%', isPositive: true, category: 'Crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '2,343.6', change: '+0.49%', isPositive: true, category: 'Crypto' },
  { symbol: 'SOL/USD', name: 'Solana', price: '101.74', change: '+0.55%', isPositive: true, category: 'Crypto' },
  { symbol: 'S&P 500', name: 'S&P 500', price: '5,782', change: '+0.42%', isPositive: true, category: 'Equities' },
  { symbol: 'NASDAQ', name: 'Nasdaq 100', price: '20,410', change: '+0.58%', isPositive: true, category: 'Equities' },
  { symbol: 'DXY', name: 'US Dollar', price: '102.45', change: '-0.28%', isPositive: false, category: 'Forex' },
  { symbol: 'CRUDE OIL', name: 'Crude WTI', price: '71.45', change: '+0.62%', isPositive: true, category: 'Commodities' },
  { symbol: 'US10Y', name: 'US 10-Yr Yield', price: '4.08%', change: '-0.04%', isPositive: false, category: 'Forex' },
  { symbol: 'USDT.D', name: 'Tether Dominance', price: '5.42%', change: '-0.31%', isPositive: false, category: 'Crypto' },
  { symbol: 'XRP/USD', name: 'XRP', price: '1.39', change: '+1.45%', isPositive: true, category: 'Crypto' },
  { symbol: 'BNB/USD', name: 'BNB', price: '761.51', change: '+1.35%', isPositive: true, category: 'Crypto' },
  { symbol: 'DOGE/USD', name: 'Dogecoin', price: '0.3870', change: '+2.25%', isPositive: true, category: 'Crypto' }
];

/* ────────────────────────── FEATURE TITLES FOR LOCK GATES ────────────────────────── */
function getFeatureTitle(tab: string): string {
  const map: Record<string, string> = {
    'deeepr-atoz': 'DEEEPR A-to-Z Quantitative Pipeline (Analyze → Track Record)',
    'analyze': 'DEEEPR 4-Lane Analyze Engine',
    'strategy-builder': 'Plain-English Strategy Builder & DSL',
    'backtest': 'Deterministic Backtest Replay Engine',
    'paper-trading': 'Simulated Paper Trading Terminal',
    'track-record': 'Verifiable Production Track Record',
    'deeepr-pipeline': 'DEEEPR A-to-Z Quantitative Pipeline',
    'institutional-multi-asset': 'Institutional Multi-Asset Analysis Engine (BTC, ETH, Gold, Crude Oil)',
    'multi-asset-engine': 'Institutional Multi-Asset Analysis Engine',
    'institutional-multi-asset-engine': 'Institutional Multi-Asset Analysis Engine',
    'multi-asset-analysis': 'Institutional Multi-Asset Analysis Engine',
    'institutional-chart': 'Advanced Institutional Trading Chart (SMC + ICT + Order Flow)',
    'all-in-one-chart': 'Advanced Institutional Trading Chart',
    'institutional-trading-chart': 'Advanced Institutional Trading Chart',
    'smc-ict-chart': 'Advanced Institutional Trading Chart',
    'delta-swing-scanner': 'Delta Exchange India Multi-Coin Swing Scanner (231+ Coins)',
    'delta-scanner': 'Delta 4H All-Coin Scanner',
    'delta-swing-top5': 'Top 5 Alpha Swings (Delta)',
    'delta-wealth-1-3m': 'Delta 1-3M Investment Outlook',
    'usa-swing-scanner': 'USA Stocks 4H Swing & Investment Scanner',
    'usa-earnings-guard': 'Earnings Risk Guard (<14D Warning)',
    'usa-portfolio-builder': 'US 1-6M Portfolio Builder',
    'event-impact-engine': 'Live Event Impact Engine & Macro Scenarios',
    'macro-scenarios-matrix': '3-Scenario Matrix (CPI/FOMC/NFP)',
    'gold-btc-transmission': 'Gold & Bitcoin Transmission Models',
    'voice-query-assistant': 'AI Voice Macro Assistant',
    'oil-trading-ai': 'Crude Oil Intelligence & AI Terminal (WTI / Brent)',
    'oil-inventory-engine': 'EIA & API Inventory Event Radar',
    'oil-geopolitical-radar': 'Oil Geopolitics & OPEC+ Radar',
    'oil-position-sizer': 'Oil Institutional Risk Sizer',
    'deeepr-stock-research': 'DEEEPR Stock Research & Positional Plan Engine v1 (5–12M)',
    'stock-research': 'DEEEPR Stock Research & Positional Plan Engine v1 (5–12M)',
    'deeepr-stocks': 'DEEEPR Stock Research & Positional Plan Engine v1 (5–12M)',
    'stock-ai': 'AI Stocks (US + NIFTY 100)',
    'indian-stock-ai': 'Indian Stocks AI (Nifty 500 Deep Research)',
    'usa-stock-ai': 'USA Top 1000 AI Terminal (INDmoney & Russell)',
    'volume-profile-ai': 'Volume Profile & Bookmap AI (POC/VAH/VAL)',
    'trend-analysis': 'Multi-Timeframe Trend Analysis Engine (Multi-Asset)',
    'trend-engine': 'Multi-Timeframe Trend Analysis Engine (Multi-Asset)',
    'trend': 'Multi-Timeframe Trend Analysis Engine (Multi-Asset)',
    'xauusd-institutional': 'Institutional XAUUSD Intelligence Terminal (Gold Pro Max v2)',
    'xauusd-terminal': 'Institutional XAUUSD Intelligence Terminal (Gold Pro Max v2)',
    'gold-smc-lab': 'Gold (XAUUSD) SMC Auto Trade Lab — Auto-Marked SMC Chart & Auto Playbook',
    'gold-entry-models': 'Gold (XAUUSD) SMC Auto Trade Lab — Auto-Marked SMC Chart & Auto Playbook',
    'gold-pro': 'Institutional XAUUSD Intelligence Terminal (Gold Pro Max v2)',
    'gold-ai': 'Gold Trading AI Terminal',
    'gold-signal-panel': 'Gold Signal Panel — Institutional Long / Short (TP & SL)',
    'gold': 'Gold Macro Overview',
    'global-intel': 'Global Intelligence Desk',
    'ultra-ai': 'TradeAI Institutional Terminal',
    'order-flow': 'Order Flow & Bookmap AI Terminal (CVD & Footprint)',
    'order-book-heatmap': 'Order Book Liquidity Heatmap (Bookmap / ATAS 1:1)',
    'deeepr-liquidation-hub': 'DEEEPR Liquidation Hub v1 (Map + Heatmap + Max Pain + Cascades)',
    'liquidation-hub': 'DEEEPR Liquidation Hub v1',
    'deeepr-liquidation': 'DEEEPR Liquidation Hub v1',
    'liquidation-heatmap': 'Liquidation Heatmap Bookmap Terminal',
    'bookmap-liquidation': 'Bookmap Liquidation Live Engine (BTC & Gold 1:1)',
    'market-chart-analyse': 'Market Chart AI Analyzer (A-to-Z Read)',
    'market-chart-analysis': 'Market Chart AI Analyzer (A-to-Z Read)',
    'market-chart-analyses': 'Market Chart AI Analyzer (A-to-Z Read)',
    'institutional-terminal': 'Institutional AI Terminal (BTC + Gold)',
    'deeepr-ai': 'DEEEPR.AI Copilot & Market Structure Terminal',
    'deeepr-big-player-radar': 'DEEEPR Big Player Radar v1 (Weekly Smart-Money Analysis)',
    'deeepr-gold-entry-engine': 'DEEEPR Gold Entry + Reason Engine v1 (XAUUSD Why Engine)',
    'gold-entry-engine': 'DEEEPR Gold Entry + Reason Engine v1 (XAUUSD Why Engine)',
    'gold-why-engine': 'DEEEPR Gold Entry + Reason Engine v1 (XAUUSD Why Engine)',
    'deeepr-volume-profile-scanner': 'DEEEPR Volume Profile Confluence Scanner v1 (Multi-Asset)',
    'volume-profile-scanner': 'DEEEPR Volume Profile Confluence Scanner v1 (Multi-Asset)',
    'vp-scanner': 'DEEEPR Volume Profile Confluence Scanner v1 (Multi-Asset)',
    'deeepr-auto-fibonacci': 'DEEEPR Auto-Fibonacci + Golden Zone Engine v1 (Gold & BTC)',
    'auto-fibonacci': 'DEEEPR Auto-Fibonacci + Golden Zone Engine v1 (Gold & BTC)',
    'golden-zone-engine': 'DEEEPR Auto-Fibonacci + Golden Zone Engine v1 (Gold & BTC)',
    'crypto-wealth-intelligence': 'Crypto Long-Term Wealth Intelligence (Delta 1-4M+)',
    'delta-intelligence': 'Delta Exchange India Multi-Coin Engine (231+ Coins)',
    'crypto-ai': 'Crypto Trading AI (BTC / ETH / SOL)',
    'ai-chart': 'AI Sniper Chart (Long / Short / Wait)',
    'crypto-brain': 'AI Crypto Brain Engine',
    'btc-engine': 'Bitcoin Institutional Engine',
    'eth-engine': 'Ethereum & Dominance Engine',
    'whales': 'Whale Tracking & Custody Engine',
    'liquidation-map': 'Liquidation Terminal (CoinGlass Pro)',
    'derivatives-engine': 'Derivatives Positioning Engine',
    'options': 'Options Skew & Volatility Engine',
    'etf': 'ETF & Institutional Flows Engine',
    'stablecoin-engine': 'Stablecoin Velocity & Net Flows',
    'altcoins': 'Altcoins & Token Unlocks Engine',
    'defi': 'DeFi Ecosystems & TVL Engine',
    'narratives': 'Market Narratives Radar',
    'smart-money': 'Smart Money & Institutional Flows',
    'crypto-calendar': 'Crypto Catalysts & Dilution Calendar',
    'confluence': '11-Pillar Confluence Engine',
    'scanner': 'Bull/Bear Confluence Scanner',
    'regime': 'Market Regime Matrix',
    'correlations': 'Cross-Asset Correlations Matrix',
    'stocks': 'Global Equities Terminal',
    'forex': 'Currencies & DXY FX Terminal',
    'crypto': 'Crypto Market Radar',
    'macro': 'Global Macro Economy Dashboard',
    'fed': 'Federal Reserve & Rate Probabilities',
    'liquidity': 'Banking & Global Liquidity Engine',
    'yields': 'Yield Curve & Treasury Bonds',
    'central-banks': 'Central Banks Balance Sheet Tracker',
    'us-economy': 'US Economic Data Indicators',
    'usa-events': 'DEEEPR US News & Events Impact Engine (FOMC / CPI / NFP → Gold + Bitcoin)',
    'us-events': 'DEEEPR US News & Events Impact Engine (FOMC / CPI / NFP → Gold + Bitcoin)',
    'us-news': 'DEEEPR US News & Events Impact Engine (FOMC / CPI / NFP → Gold + Bitcoin)',
    'us-events-engine': 'DEEEPR US News & Events Impact Engine (FOMC / CPI / NFP → Gold + Bitcoin)',
    'fomc-cpi-engine': 'DEEEPR US News & Events Impact Engine (FOMC / CPI / NFP → Gold + Bitcoin)',
    'gdp': 'GDP & Economic Growth Nowcast',
    'inflation': 'Inflation & CPI/PCE Dashboard',
    'labour': 'Labour Market & Non-Farm Payrolls',
    'geopolitics': 'Geopolitical Risk Radar',
    'socioeconomic': 'Socioeconomic Regime Tracker',
    'sentiment': 'Market Sentiment & Positioning Skew',
    'put-call': 'Put / Call Ratios & Options Flow',
    'jarvis-voice-ai': 'Jarvis AI Market Voice Assistant',
    'liquidity-sweep-map': 'Liquidity Sweep & Liquidation Map (Pro)',
    'btc-usdt-momentum': 'BTC–USDT Momentum Prediction Engine',
    'intermarket-radar': 'BTC ⚡ USDT.D & Gold ⚡ DXY Intermarket Correlation Radar',
    'intermarket-dual-radar': 'BTC ⚡ USDT.D & Gold ⚡ DXY Intermarket Correlation Radar',
    'btc-usdt-gold-dxy': 'BTC ⚡ USDT.D & Gold ⚡ DXY Intermarket Correlation Radar',
    'cross-asset-confirmation': 'Cross-Asset Confirmation Engine (BTC/USDT ↔ DXY/Gold)',
    'risk': 'Institutional Risk Console',
    'journal': 'Institutional Trading Journal',
    'reports': 'Performance Analytics & Journal Reports',
    'telegram-alerts': 'Telegram AI Alerts & Live VIP Bot',
    'daily-report': 'Daily Market Intelligence Report',
    'crowd': 'Retail vs Whales Long/Short Skew & Crowd Sentiment',
    'crowd-sentiment': 'Retail vs Whales Long/Short Skew & Crowd Sentiment',
    'retail-position': 'Retail vs Whales Long/Short Skew & Crowd Sentiment',
    'retail-sentiment': 'Retail vs Whales Long/Short Skew & Crowd Sentiment',
    'deeepr-news-events': 'DEEEPR News & Economic Events Engine (US Monetary Policy, CPI, FOMC & Blackout Windows)',
    'news-events': 'DEEEPR News & Economic Events Engine',
    'onchain': 'On-Chain Analysis Engine'
  };
  return map[tab] || 'Institutional Trading Terminal Module';
}

/* ────────────────────────── APP COMPONENT ────────────────────────── */
function TerminalApp() {
  const { user, isLoading } = useAuth();
  const [currentSub, setCurrentSub] = useState<UserSubscriptionRecord | null>(null);
  const [isPassportUnlocked, setIsPassportUnlocked] = useState<boolean>(isFounderPassportActive);

  const reloadSub = useCallback(async () => {
    setIsPassportUnlocked(isFounderPassportActive());
    const sub = await getActiveSubscription(user?.id);
    setCurrentSub(sub);
  }, [user?.id]);

  useEffect(() => {
    reloadSub();
    window.addEventListener('subscription_updated', reloadSub);
    return () => window.removeEventListener('subscription_updated', reloadSub);
  }, [reloadSub]);

  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').replace('/', '');
      if (hash && hash.length > 0) {
        if (hash === 'landing' || hash === 'home' || hash === 'portal') return 'landing';
        return hash;
      }
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') || urlParams.get('page') || urlParams.get('view');
      if (tabParam) {
        if (tabParam === 'landing' || tabParam === 'home' || tabParam === 'portal') return 'landing';
        return tabParam;
      }
    }
    return 'landing'; // Default to IshantMacro Command Centre Portal
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '').replace('/', '');
      if (h) {
        if (h === 'home' || h === 'portal' || h === 'landing') {
          setActiveTabState('landing');
        } else {
          setActiveTabState(h);
        }
      } else {
        setActiveTabState('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'gold'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'gold' || stored === 'dark') return stored;
    }
    return 'light';
  });
  const isDarkMode = theme !== 'light';
  const [liveTickers, setLiveTickers] = useState<MarketTicker[]>(BASE_TICKERS);
  const [isLiveWs, setIsLiveWs] = useState<boolean>(false);

  // ── Resizable Sidebar Width (Default: 192px compact Lovable style, Min: 150px, Max: 360px) ──
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ishant_sidebar_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          // If previous default was 205, 230 or 240, normalize to new compact 192px
          if (parsed === 205 || parsed === 230 || parsed === 240) return 192;
          if (!isNaN(parsed) && parsed >= 150 && parsed <= 360) return parsed;
        }
      } catch {}
    }
    return 192;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handlePointerMove = (e: PointerEvent) => {
      const newWidth = Math.max(150, Math.min(380, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizingSidebar(false);
      try {
        localStorage.setItem('ishant_sidebar_width', String(sidebarWidth));
      } catch {}
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  // Setup real-time WebSocket for live crypto prices
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker/bnbusdt@ticker/dogeusdt@ticker');
      ws.onopen = () => setIsLiveWs(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const symMap: Record<string, string> = {
            BTCUSDT: 'BTC/USD',
            ETHUSDT: 'ETH/USD',
            SOLUSDT: 'SOL/USD',
            XRPUSDT: 'XRP/USD',
            BNBUSDT: 'BNB/USD',
            DOGEUSDT: 'DOGE/USD'
          };
          const targetSym = symMap[data.s];
          if (targetSym) {
            const rawPrice = parseFloat(data.c);
            const changePct = parseFloat(data.P);
            const formattedPrice = rawPrice > 1000 ? `$${rawPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `$${rawPrice.toFixed(2)}`;
            const formattedChange = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;

            setLiveTickers((prev) =>
              prev.map((t) =>
                t.symbol === targetSym
                  ? {
                      ...t,
                      price: formattedPrice,
                      change: formattedChange,
                      isPositive: changePct >= 0
                    }
                  : t
              )
            );
          }
        } catch (e) {}
      };
      ws.onerror = () => setIsLiveWs(false);
      ws.onclose = () => setIsLiveWs(false);
    } catch (e) {
      setIsLiveWs(false);
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Sync theme with document class, body class and localStorage
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light', 'gold');
    document.documentElement.classList.add(theme);
    if (document.body) {
      document.body.classList.remove('dark', 'light', 'gold');
      document.body.classList.add(theme);
    }
    if (theme === 'gold' || theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) document.body.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }, [theme]);

  // Fullscreen dedicated Landing Portal View (matches iitianmacro.ai layout requested by user)
  if (activeTab === 'landing' || activeTab === 'portal' || activeTab === 'home') {
    return (
      <div className="min-h-screen bg-[#06080e] text-slate-100 font-sans antialiased">
        <IshantMacroPortalView
          onLaunchTerminal={(targetTab?: string) => setActiveTab(targetTab || 'global-score')}
        />
        {/* Modals accessible while browsing portal */}
        {isProfileModalOpen && (
          <UserProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onNavigatePricing={() => {
              setIsProfileModalOpen(false);
              setActiveTab('pricing');
            }}
            onNavigateAlerts={() => {
              setIsProfileModalOpen(false);
              setActiveTab('alerts');
            }}
          />
        )}
        {isAccountOpen && <AccountModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans antialiased">
      {/* 1. Real-time Scrolling TickerBar */}
      <TickerBar tickers={liveTickers} isDarkMode={isDarkMode} />

      {/* 2. Topbar */}
      <Header
        isDarkMode={isDarkMode}
        theme={theme}
        onSelectTheme={(t) => setTheme(t)}
        onToggleTheme={() => {
          setTheme(prev => (prev === 'dark' ? 'light' : prev === 'light' ? 'gold' : 'dark'));
        }}
        onOpenAccount={() => setIsProfileModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigateHome={() => setActiveTab('landing')}
        onNavigatePricing={() => setActiveTab('pricing')}
        onSelectTab={setActiveTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* Mobile Drawer (Matches User Screenshot Phone View) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-[310px] max-w-[88vw] h-full bg-[#f6f1f1] border-r border-[#e6dede] shadow-2xl z-10 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-1)]">
              <span className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-[1.5px] text-[var(--text-2)] uppercase">
                TERMINAL NAVIGATION
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-[#6b7390] hover:text-[#1f2937] hover:bg-[#ebe7ee] cursor-pointer transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(id) => {
                  setActiveTab(id);
                  setIsMobileSidebarOpen(false);
                }}
                isDarkMode={isDarkMode}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Row: Left Sidebar + Resizable Divider + Right Viewport */}
      <div className={`flex flex-1 ${isResizingSidebar ? 'select-none cursor-col-resize' : ''}`}>
        {/* Sidebar Navigation (Resizable: 160px - 420px, Default 230px) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isDarkMode={isDarkMode}
          width={sidebarWidth}
        />

        {/* Draggable Vertical Resize Divider */}
        <div
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={(e) => {
            e.preventDefault();
            setIsResizingSidebar(true);
          }}
          onDoubleClick={() => {
            setSidebarWidth(192);
            try {
              localStorage.setItem('ishant_sidebar_width', '192');
            } catch {}
          }}
          className={`hidden lg:flex items-center justify-center relative cursor-col-resize select-none shrink-0 z-30 transition-colors ${
            isResizingSidebar
              ? 'w-2 bg-blue-500/25'
              : 'w-2 hover:bg-blue-500/15'
          }`}
          style={{ touchAction: 'none' }}
          title="Drag left/right to resize sidebar (Double click to reset to 192px)"
        >
          {/* Visible thin line */}
          <div
            className={`w-[1px] h-full pointer-events-none transition-colors ${
              isResizingSidebar
                ? 'bg-blue-500 w-[2px]'
                : isDarkMode
                ? 'bg-[#1e293b]'
                : 'bg-[#e2e8f0]'
            }`}
          />
        </div>

        {/* Scrollable Main Viewport (Compact Spacing) */}
        <main id="main" className="min-w-0 flex-1 space-y-3 p-2.5 sm:p-3 overflow-y-auto">
          {/* Mobile horizontal scrollable pill navigation */}
          <nav aria-label="Section navigation" className="-mx-3 flex snap-x gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden">
            {Array.from(new Map(NAV_CATEGORIES.flatMap(c => c.items).map(item => [item.id, item])).values()).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 snap-start rounded-full border px-3 py-1.5 text-xs transition-all flex items-center cursor-pointer ${
                  activeTab === item.id
                    ? 'border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-transparent font-bold text-amber-300 shadow-[0_0_15px_rgba(238,186,48,0.35)]'
                    : 'border-slate-800 bg-[#0c1426]/70 text-slate-300 hover:bg-[#121c38] hover:text-white'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* RENDER ACTIVE TAB */}
          <ErrorBoundary key={activeTab} onReset={() => setActiveTab('market-chart-analyse')}>
          {!canAccessTab(activeTab, currentSub) ? (
            <PremiumFeatureLockGate
              featureTitle={getFeatureTitle(activeTab)}
              featureDescription="This institutional module requires an active subscription or Master Passport key to access live algorithmic signals, order flow CVD, and quantitative market models."
              onNavigateToPricing={() => setActiveTab('pricing')}
              onUnlocked={reloadSub}
            />
          ) : (
            <React.Suspense fallback={<TerminalSkeleton />}>
              {(activeTab === 'deeepr-atoz' || activeTab === 'analyze' || activeTab === 'strategy-builder' || activeTab === 'backtest' || activeTab === 'paper-trading' || activeTab === 'track-record' || activeTab === 'deeepr-pipeline') && (
                <DeeeprAtoZPipelineView
                  onNavigate={setActiveTab}
                  initialTab={
                    activeTab === 'strategy-builder' ? 'strategy' :
                    activeTab === 'backtest' ? 'backtest' :
                    activeTab === 'paper-trading' ? 'paper' :
                    activeTab === 'track-record' ? 'track_record' :
                    activeTab === 'analyze' ? 'analyze' : 'analyze'
                  }
                />
              )}
              {(activeTab === 'institutional-multi-asset' || activeTab === 'multi-asset-engine' || activeTab === 'institutional-multi-asset-engine' || activeTab === 'multi-asset-analysis') && <InstitutionalMultiAssetEngineView onNavigate={setActiveTab} />}
              {(activeTab === 'institutional-chart' || activeTab === 'all-in-one-chart' || activeTab === 'institutional-trading-chart' || activeTab === 'smc-ict-chart') && <AdvancedInstitutionalChart />}
              {(activeTab === 'delta-swing-scanner' || activeTab === 'delta-scanner' || activeTab === 'delta-4h' || activeTab === 'delta-swing' || activeTab === 'delta-swing-top5' || activeTab === 'delta-wealth-1-3m') && <DeltaSwingScannerView onNavigate={setActiveTab} />}
              {(activeTab === 'usa-swing-scanner' || activeTab === 'usa-stocks-scanner' || activeTab === 'us-swing' || activeTab === 'usa-stock-scanner' || activeTab === 'usa-earnings-guard' || activeTab === 'usa-portfolio-builder') && <UsaStockScannerView onNavigate={setActiveTab} />}
              {(activeTab === 'event-impact-engine' || activeTab === 'news-impact' || activeTab === 'event-impact' || activeTab === 'macro-news-engine' || activeTab === 'macro-scenarios-matrix' || activeTab === 'gold-btc-transmission' || activeTab === 'voice-query-assistant') && <EventImpactEngineView onNavigate={setActiveTab} />}
              {(activeTab === 'oil-trading-ai' || activeTab === 'oil-intelligence' || activeTab === 'oil-terminal' || activeTab === 'crude-oil' || activeTab === 'oil-inventory-engine' || activeTab === 'oil-geopolitical-radar' || activeTab === 'oil-position-sizer' || activeTab === 'wti-brent') && <OilIntelligenceTerminalView onNavigate={setActiveTab} />}
              {(activeTab === 'landing' || activeTab === 'portal' || activeTab === 'home') && <IshantMacroPortalView onLaunchTerminal={(t) => setActiveTab(t || 'global-score')} />}
              {(activeTab === 'deeepr-stock-research' || activeTab === 'stock-research' || activeTab === 'deeepr-stocks') && <DeeeprStockResearchEngineView onNavigate={setActiveTab} />}
              {(activeTab === 'global-score' || activeTab === 'global-stock-score' || activeTab === 'stock-investment-engine') && <GlobalStockScoreEngineView onNavigate={setActiveTab} liveTickers={liveTickers} />}
              {activeTab === 'auth' && <AuthPageView onNavigateToTerminal={() => setActiveTab('ultra-ai')} />}
              {activeTab === 'stock-ai' && <StockAiView onNavigate={setActiveTab} />}
              {(activeTab === 'indian-stock-ai' || activeTab === 'indian-stocks' || activeTab === 'nifty-500') && <IndianStockAiView onNavigate={setActiveTab} />}
              {(activeTab === 'usa-stock-ai' || activeTab === 'usa-stocks' || activeTab === 'russell-1000' || activeTab === 'indmoney-us') && <UsaTop1000AiView onNavigate={setActiveTab} />}
              {(activeTab === 'volume-profile-ai' || activeTab === 'volume-profile' || activeTab === 'volume-profile-pro' || activeTab === 'volume-profile-setup' || activeTab === 'vp-terminal' || activeTab === 'volume-profile-confluence' || activeTab === 'vp-confluence') && <VolumeProfileTerminalView />}
              {(activeTab === 'gold-smc-lab' || activeTab === 'gold-entry-models' || activeTab === 'gold-smc-auto-lab') && <GoldSmcAutoTradeLabView />}
              {(activeTab === 'xauusd-institutional' || activeTab === 'xauusd-terminal' || activeTab === 'gold-pro' || activeTab === 'xauusd' || activeTab === 'gold-pro-max') && <InstitutionalXauusdTerminalView onNavigate={setActiveTab} />}
              {(activeTab === 'trend-analysis' || activeTab === 'trend' || activeTab === 'trend-engine' || activeTab === 'mtf-trend') && <TrendAnalysisView onNavigate={setActiveTab} />}
              {(activeTab === 'gold-ai' || activeTab === 'gold-trading-ai' || activeTab === 'gold-macro' || activeTab === 'gold-intelligence' || activeTab === 'gold-dashboard') && <GoldAiMarketIntelligenceView onNavigate={setActiveTab} />}
              {(activeTab === 'gold-signal-panel' || activeTab === 'gold-signals' || activeTab === 'gold-long-short') && <GoldSignalPanelView onNavigate={setActiveTab} />}
              {activeTab === 'global-intel' && <GlobalIntelView />}
              {activeTab === 'ultra-ai' && <UltraInstitutionalDecisionEngine onNavigate={setActiveTab} />}
              {activeTab === 'order-flow' && <OrderFlowTerminal onNavigate={setActiveTab} />}
              {(activeTab === 'order-book-heatmap' || activeTab === 'order-book-liquidity-heatmap' || activeTab === 'bookmap-heatmap' || activeTab === 'obh') && <OrderBookHeatmapView onNavigate={setActiveTab} />}
              {(activeTab === 'bookmap-liquidation' || activeTab === 'bookmap' || activeTab === 'bookmap-chart') && <BookmapLiquidationTerminalView />}
              {(activeTab === 'liquidation-heatmap' || activeTab === 'liquidation-chart' || activeTab === 'liq-heatmap') && <LiquidationHeatmapTerminalView onNavigate={setActiveTab} />}
              {(activeTab === 'market-chart-analyse' || activeTab === 'market-chart-analysis' || activeTab === 'market-chart-analyses' || activeTab === 'chart-ai-vision' || activeTab === 'chart-analyzer') && <MarketChartAnalyserTerminalView />}
              {(activeTab === 'institutional-terminal' || activeTab === 'institutional-ai' || activeTab === 'institutional-intelligence' || activeTab === 'btc-gold-terminal') && <InstitutionalAiTerminalView />}
              {(activeTab === 'deeepr-ai' || activeTab === 'deeepr' || activeTab === 'deeepr-ai-chart' || activeTab === 'deeepr-copilot' || activeTab === 'deeepr-chart') && <DeeeprAiChartView />}
              {(activeTab === 'deeepr-precision-entry' || activeTab === 'precision-entry' || activeTab === 'entry-engine') && <DeeeprPrecisionEntryView onNavigate={setActiveTab} />}
              {(activeTab === 'deeepr-decision-engine' || activeTab === 'decision-engine' || activeTab === 'deeepr-engine') && <DeeeprDecisionEngineView onNavigate={setActiveTab} />}
              {(activeTab === 'deeepr-big-player-radar' || activeTab === 'big-player-radar' || activeTab === 'smart-money-radar' || activeTab === 'smart-money') && <DeeeprBigPlayerRadarView onNavigate={setActiveTab} />}
              {(activeTab === 'deeepr-gold-entry-engine' || activeTab === 'gold-entry-engine' || activeTab === 'gold-why-engine') && <DeeeprGoldEntryReasonView onNavigate={setActiveTab} />}
              {(activeTab === 'deeepr-volume-profile-scanner' || activeTab === 'volume-profile-scanner' || activeTab === 'vp-scanner') && <DeeeprVolumeProfileScannerView onNavigate={setActiveTab} />}
              {(activeTab === 'deeepr-auto-fibonacci' || activeTab === 'auto-fibonacci' || activeTab === 'golden-zone-engine' || activeTab === 'auto-fib') && <DeeeprAutoFibonacciView onNavigate={setActiveTab} />}
              {(activeTab === 'crypto-wealth-intelligence' || activeTab === 'wealth-intelligence' || activeTab === 'delta-wealth' || activeTab === 'crypto-long-term-wealth') && <CryptoWealthIntelligenceTerminalView />}
              {(activeTab === 'delta-intelligence' || activeTab === 'delta-engine' || activeTab === 'delta-crypto' || activeTab === 'delta-exchange' || activeTab === 'delta-india') && <DeltaIntelligenceEngineView />}
              {(activeTab === 'crypto-ai' || activeTab === 'crypto-trading-ai' || activeTab === 'btc-trading-ai' || activeTab === 'eth-trading-ai' || activeTab === 'sol-trading-ai') && <CryptoTradingAiView />}
              {activeTab === 'ai-chart' && <AiChartView />}
              {activeTab === 'crypto-brain' && <CryptoBrainView />}
              {activeTab === 'btc-engine' && <BtcEngineView />}
              {activeTab === 'eth-engine' && <EthEngineView />}
              {activeTab === 'whales' && <WhaleEngineView />}
              {(activeTab === 'deeepr-liquidation-hub' || activeTab === 'liquidation-hub' || activeTab === 'deeepr-liquidation' || activeTab === 'liquidation-map' || activeTab === 'liquidation') && <DeeeprLiquidationHubView onNavigate={setActiveTab} />}
              {activeTab === 'derivatives-engine' && <DerivativesEngineView />}
              {activeTab === 'options' && <OptionsEngineView />}
              {activeTab === 'etf' && <EtfEngineView />}
              {activeTab === 'stablecoin-engine' && <StablecoinEngineView />}
              {activeTab === 'altcoins' && <AltcoinsView />}
              {activeTab === 'defi' && <DefiView />}
              {activeTab === 'narratives' && <NarrativesView />}
              {activeTab === 'smart-money' && <SmartMoneyView />}
              {activeTab === 'crypto-calendar' && <CryptoCalendarView />}
              {activeTab === 'overview' && <LiveMarketOverviewView />}
              {(activeTab === 'usa-events' || activeTab === 'us-events' || activeTab === 'us-news' || activeTab === 'us-events-engine' || activeTab === 'deeepr-us-events' || activeTab === 'fomc-cpi-engine') && (
                <DeeeprUsEventsView onNavigate={setActiveTab} />
              )}
              {(activeTab === 'deeepr-news-events' || activeTab === 'news-events' || activeTab === 'economic-events' || activeTab === 'macro-news' || activeTab === 'news-engine' || activeTab === 'calendar' || activeTab === 'usa-calendar') && (
                <UsaEconomicCalendarView onNavigate={setActiveTab} />
              )}
              {activeTab === 'confluence' && <ConfluenceEngineView />}
              {activeTab === 'scanner' && <BullBearScannerView />}
              {activeTab === 'regime' && <RegimeMatrixView />}
              {activeTab === 'gold' && <GoldDashboardView />}
              {activeTab === 'correlations' && <CorrelationsView />}
              {activeTab === 'stocks' && <StocksView />}
              {activeTab === 'forex' && <ForexView />}
              {activeTab === 'crypto' && <CryptoMarketView />}
              {activeTab === 'macro' && <MacroEconomyView />}
              {activeTab === 'fed' && <FedView />}
              {activeTab === 'liquidity' && <LiquidityView />}
              {activeTab === 'yields' && <YieldsView />}
              {activeTab === 'central-banks' && <CentralBanksView />}
              {activeTab === 'us-economy' && <UsEconomyView />}
              {activeTab === 'gdp' && <GdpView />}
              {activeTab === 'inflation' && <InflationView />}
              {activeTab === 'labour' && <LabourView />}
              {activeTab === 'geopolitics' && <GeopoliticsView />}
              {activeTab === 'socioeconomic' && <SocioeconomicView />}
              {activeTab === 'news' && <NewsView />}
              {activeTab === 'sentiment-legacy' && <SentimentView />}
              {activeTab === 'put-call' && <PutCallView />}
              {(activeTab === 'jarvis-voice-ai' || activeTab === 'jarvis' || activeTab === 'voice-ai' || activeTab === 'jarvis-ai' || activeTab === 'assistant') && <JarvisVoiceMarketAssistant />}
              {(activeTab === 'liquidity-sweep-map' || activeTab === 'liquidity-sweep-intelligence' || activeTab === 'liquidity-sweep' || activeTab === 'liquidity-map') && <LiquiditySweepIntelligenceView />}
              {(activeTab === 'btc-usdt-momentum' || activeTab === 'btc-usdt' || activeTab === 'usdt-btc' || activeTab === 'momentum-engine') && <BtcUsdtRelationshipEngine />}
              {(activeTab === 'intermarket-radar' || activeTab === 'intermarket-dual-radar' || activeTab === 'btc-usdt-gold-dxy' || activeTab === 'correlation-radar') && (
                <IntermarketCorrelationRadarView />
              )}
              {(activeTab === 'cross-asset-confirmation' || activeTab === 'cross-asset' || activeTab === 'intermarket-confirmation' || activeTab === 'btc-gold-correlation' || activeTab === 'cross-asset-engine') && <CrossAssetConfirmationEngineView />}
              {activeTab === 'risk' && <RiskConsoleView />}
              {activeTab === 'journal' && <TradingJournalView />}
              {activeTab === 'reports' && <JournalReportsView />}
              {(activeTab === 'crowd-sentiment' || activeTab === 'crowd' || activeTab === 'retail-sentiment' || activeTab === 'retail-position' || activeTab === 'sentiment') && (
                <RetailCrowdSentimentView onNavigate={setActiveTab} />
              )}
              {activeTab === 'onchain' && <OnChainView />}
              {activeTab === 'onchain-engine' && <OnChainView />}
              {activeTab === 'derivatives' && <DerivativesEngineView />}
              {activeTab === 'macro-engine' && <MacroEconomyView />}
              {activeTab === 'account' && <AccountPageView onOpenAccount={() => setIsAccountOpen(true)} />}
              {(activeTab === 'pricing' || activeTab === 'subscription' || activeTab === 'membership' || activeTab === 'plans') && <SubscriptionPricingView onPlanActivated={reloadSub} />}
            </React.Suspense>
          )}
          </ErrorBoundary>

          {/* Institutional Legal & Data Attribution Disclaimer Footer */}
          <footer className="label-xs border-t border-border pt-3">
            Crypto via CoinGecko, macro via FRED (St. Louis Fed), FX via Frankfurter, indices, metals and yields via Yahoo Finance, charts via TradingView. All feeds are proxied and cached server-side. On-chain and derivatives figures are illustrative. Not investment advice.
          </footer>
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onNavigatePricing={() => setActiveTab('pricing')}
        onNavigateAlerts={() => setActiveTab('alerts')}
      />

      {/* Account Modal */}
      <AccountModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />

      {/* Floating Quick Jarvis Voice Widget */}
      <JarvisFloatingWidget onOpenFullTerminal={() => setActiveTab('jarvis-voice-ai')} currentTab={activeTab} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 1. GLOBAL MARKET SCORE                                                      */
/* ────────────────────────────────────────────────────────────────────────── */
function GlobalMarketScoreView({ onNavigate, liveTickers }: { onNavigate: (id: string) => void; liveTickers: MarketTicker[] }) {
  // Extract live crypto prices if available
  const getTicker = (sym: string) => liveTickers.find((t) => t.symbol === sym);
  const btc = getTicker('BTC/USD') || { price: '$82,548', change: '-0.87%', isPositive: false };
  const eth = getTicker('ETH/USD') || { price: '$2,529', change: '-1.71%', isPositive: false };
  const sol = getTicker('SOL/USD') || { price: '$112.37', change: '-3.33%', isPositive: false };
  const xrp = getTicker('XRP/USD') || { price: '$1.40', change: '-1.23%', isPositive: false };
  const bnb = getTicker('BNB/USD') || { price: '$757.18', change: '-1.91%', isPositive: false };
  const doge = getTicker('DOGE/USD') || { price: '$0.0872', change: '-2.01%', isPositive: false };

  return (
    <div className="space-y-4">
      {/* 1. Breadcrumb Header */}
      <div>
        <p className="label-xs mb-1">🏛️ Executive Dashboard</p>
        <h1 className="text-gradient text-xl font-semibold tracking-tight sm:text-2xl font-display">
          Global Market Score
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          One score that blends inflation, growth, liquidity, positioning and price momentum. Above 60 is risk-on, below 40 is risk-off.
        </p>
      </div>

      {/* 2. Top Grid: Gauge Dial + AI Market Regime */}
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Left: Global Market Score Dial */}
        <section className="panel p-5">
          <h2 className="label-xs mb-3">🎯 Global Market Score</h2>
          <BiasGauge score={39} />
          <p className="mt-3 border-t border-border pt-3 text-center text-sm font-semibold text-bear">
            BEARISH
          </p>
        </section>

        {/* Right: AI Market Regime Card */}
        <section className="panel space-y-4 border-t-2 border-t-gold p-5">
          <div>
            <h2 className="label-xs">🧠 AI Market Regime</h2>
            <h3 className="font-display mt-2 text-2xl text-primary font-semibold">
              Disinflationary Late-Cycle Growth
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Output still expanding while inflation decelerates from elevated levels. Positioned near the Quadrant-1 / Quadrant-4 border, drifting down-left.
            </p>
            
            {/* Regime Status Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="label-xs rounded-sm border border-border bg-secondary px-2 py-1 text-neutral">
                Risk-on (Fragile)
              </span>
              <span className="label-xs rounded-sm border border-border bg-secondary px-2 py-1 text-bull">
                Liquidity: Expanding
              </span>
              <span className="label-xs rounded-sm border border-border bg-secondary px-2 py-1 text-bull">
                Inflation: Falling
              </span>
              <span className="label-xs rounded-sm border border-border bg-secondary px-2 py-1 text-neutral">
                Growth: Slowing
              </span>
              <span className="label-xs rounded-sm border border-border bg-secondary px-2 py-1 text-bear">
                Recession Risk: 24%
              </span>
            </div>
          </div>

          {/* Risk-on / Risk-off Indicator Slider */}
          <div className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="label-xs">Risk-On / Risk-Off Indicator</span>
              <span className="num text-sm font-semibold text-neutral">50</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-neutral" style={{ width: '50%' }} />
            </div>
            <div className="label-xs mt-1 flex justify-between">
              <span>Risk-Off</span>
              <span>Risk-On</span>
            </div>
          </div>

          {/* Key Tension */}
          <p className="rounded-sm border-l-2 border-accent bg-secondary/60 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Key tension: </span>
            Markets are pricing a soft landing. Whichever breaks first — labour or pipeline prices — sets the next regime.
          </p>
        </section>
      </div>

      {/* 3. Live Market Overview */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3 border-l-2 border-primary/70 pl-2">
          <h2 className="label-xs text-foreground/90">📈 Live Market Overview</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { id: 'btc', symbol: 'BTC/USD', price: btc.price, change: btc.change, isPositive: btc.isPositive, vol: '2.86K' },
            { id: 'eth', symbol: 'ETH/USD', price: eth.price, change: eth.change, isPositive: eth.isPositive, vol: '39.11K' },
            { id: 'sol', symbol: 'SOL/USD', price: sol.price, change: sol.change, isPositive: sol.isPositive, vol: '371.3K' },
            { id: 'xrp', symbol: 'XRP/USD', price: xrp.price, change: xrp.change, isPositive: xrp.isPositive, vol: '35.29M' },
            { id: 'bnb', symbol: 'BNB/USD', price: bnb.price, change: bnb.change, isPositive: bnb.isPositive, vol: '2.09K' },
            { id: 'doge', symbol: 'DOGE/USD', price: doge.price, change: doge.change, isPositive: doge.isPositive, vol: '90M' }
          ].map((item) => {
            const isBull = item.isPositive;
            const textClass = isBull ? 'text-bull' : 'text-bear';
            const statusLabel = isBull ? 'BULLISH' : 'BEARISH';
            return (
              <article key={item.id} className="panel p-3 transition-colors hover:border-primary/50">
                <header className="flex items-baseline justify-between gap-2">
                  <h3 className="num text-xs font-medium">{item.symbol}</h3>
                  <span className={`num text-xs ${textClass}`}>
                    {item.change}
                  </span>
                </header>
                <p className="num mt-1 text-lg font-semibold tracking-tight">
                  {item.price}
                </p>
                <footer className="mt-2 flex items-center justify-between">
                  <span className={`label-xs ${textClass}`}>{statusLabel}</span>
                  <span className="label-xs">VOL {item.vol}</span>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. Crypto Market Structure */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3 border-l-2 border-primary/70 pl-2">
          <h2 className="label-xs text-foreground/90">🪙 Crypto Market Structure</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Market Cap', value: '$2.68T' },
            { label: '24h Volume', value: '$182.4B' },
            { label: 'BTC Dominance', value: '56.4%' },
            { label: 'ETH Dominance', value: '12.1%' }
          ].map((m) => (
            <article key={m.label} className="panel p-3">
              <h3 className="label-xs">{m.label}</h3>
              <p className="num mt-2 text-base font-semibold">{m.value}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Macro Summary */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3 border-l-2 border-primary/70 pl-2">
          <h2 className="label-xs text-foreground/90">🌍 Macro Summary</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Inflation Trend', value: 'CPI 3.5%', sub: 'Prev 3.7% · Fcst 3.8%', tone: 'bull', toneLabel: 'BULLISH', note: 'Falling inflation lets the Fed cut — supportive for bonds and equities.' },
            { label: 'Interest-Rate Trend', value: '3.25–3.50%', sub: 'Prev 3.50–3.75% · Sep cut priced', tone: 'bull', toneLabel: 'BULLISH', note: 'Easing cycle intact; liquidity slowly expanding.' },
            { label: 'GDP Growth', value: '2.1%', sub: 'Prev 1.8% · Fcst 1.6%', tone: 'bull', toneLabel: 'BULLISH', note: 'Above-trend growth, recession risk contained.' },
            { label: 'Labour Market', value: 'NFP 57K', sub: 'Prev 139K · Fcst 110K', tone: 'bear', toneLabel: 'BEARISH', note: 'Hiring momentum cooling — watch claims for confirmation.' }
          ].map((item) => {
            const toneColor = item.tone === 'bull' ? 'text-bull' : item.tone === 'bear' ? 'text-bear' : 'text-neutral';
            return (
              <article key={item.label} className="panel p-3 transition-shadow hover:panel-glow">
                <header className="flex items-start justify-between gap-2">
                  <h3 className="label-xs">{item.label}</h3>
                  <span className={`label-xs rounded-full border border-border bg-secondary/60 px-1.5 py-0.5 ${toneColor}`}>
                    {item.toneLabel}
                  </span>
                </header>
                <p className="num mt-2 text-base font-semibold">{item.value}</p>
                <p className="num mt-1 text-[11px] text-muted-foreground">{item.sub}</p>
                <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">{item.note}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}


/* ────────────────────────────────────────────────────────────────────────── */
/* 2. AI STOCKS (US + NIFTY 100) WITH TRADINGVIEW & ADVANCED SIGNALS         */
/* ────────────────────────────────────────────────────────────────────────── */
// StockAiView is imported from ./components/StockAiView with both Tactical and dedicated INDmoney 1-6M Investment Modes

/* ────────────────────────────────────────────────────────────────────────── */
/* 3. GLOBAL INTELLIGENCE                                                      */
/* ────────────────────────────────────────────────────────────────────────── */
function GlobalIntelView() {
  const [category, setCategory] = useState<'bonds' | 'fx' | 'cmd' | 'eq'>('bonds');

  const categories = [
    { id: 'bonds' as const, label: '🏛️ Bonds & Rates', charts: [['TVC:US10Y', 'US 10Y Yield'], ['TVC:US02Y', 'US 2Y Yield'], ['TVC:DE10Y', 'Germany 10Y'], ['TVC:IN10Y', 'India 10Y']] },
    { id: 'fx' as const, label: '💱 USD & FX', charts: [['TVC:DXY', 'US Dollar Index'], ['FX:EURUSD', 'EUR/USD'], ['FX:USDJPY', 'USD/JPY'], ['FX_IDC:USDINR', 'USD/INR']] },
    { id: 'cmd' as const, label: '🛢️ Commodities', charts: [['OANDA:XAUUSD', 'Gold Spot'], ['OANDA:XAGUSD', 'Silver Spot'], ['TVC:USOIL', 'WTI Crude Oil'], ['COMEX:HG1!', 'Copper Futures']] },
    { id: 'eq' as const, label: '📈 Indices & Risk', charts: [['FOREXCOM:SPXUSD', 'S&P 500'], ['NASDAQ:NDX', 'Nasdaq 100'], ['TVC:VIX', 'VIX Volatility'], ['NSE:NIFTY', 'NIFTY 50']] }
  ];

  const currentCat = categories.find((c) => c.id === category) || categories[0];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Global Intelligence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🌍 Global Macro · Rates · FX · Commodities · News
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dedicated institutional research terminal — zero noise, pure macroeconomic telemetry across global rate curves, currencies, and event risk.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">News Sentiment (Live)</p>
          <p className="mt-1 text-xl font-bold font-mono text-bull">RISK-ON 🟢</p>
          <p className="mt-1 text-xs text-muted-foreground">🟢 18 Bullish · 🔴 6 Bearish headlines</p>
        </div>
        <div className="panel rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">What Is Happening</p>
          <p className="mt-1 text-sm text-foreground font-sans line-clamp-2">
            Disinflation trends broadening across North America while global central banks ease policy rates in tandem.
          </p>
        </div>
        <div className="panel rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Last Telemetry Update</p>
          <p className="mt-1 text-sm font-mono text-primary">Real-Time · Auto-Refresh 20s</p>
          <p className="mt-1 text-xs text-muted-foreground">Source: Institutional Wire + Central Bank Feeds</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold font-mono transition-colors ${category === c.id ? 'border-primary bg-primary text-[#0d1117]' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 2x2 Interactive Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {currentCat.charts.map(([sym, title]) => (
          <div key={sym} className="panel rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-mono text-foreground font-bold">{title} ({sym})</span>
              <span className="text-[11px] font-mono text-bull">● LIVE TRADINGVIEW</span>
            </div>
            <TradingViewWidget symbol={sym} interval="D" height={320} />
          </div>
        ))}
      </div>

      {/* Live Economic Calendar */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
          📅 Weekly Economic Calendar (CPI · PPI · FOMC · NFP)
        </h2>
        <EconCalendar usdOnly={false} minImpact="Medium" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 4. AI CHART (LONG / SHORT / WAIT)                                         */
/* ────────────────────────────────────────────────────────────────────────── */
// AiChartView is imported directly from ./components/AiChartView

/* ────────────────────────────────────────────────────────────────────────── */
/* 5. AI CRYPTO BRAIN                                                         */
/* ────────────────────────────────────────────────────────────────────────── */
function CryptoBrainView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🤖 AI Crypto Brain
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The ultimate synthesis engine — harmonizing on-chain, macro, liquidity, ETF flows, and derivative mechanics into a single Bitcoin regime rating.
        </p>
      </div>

      {/* Top Banner: BTC Regime 78/100 */}
      <section className="panel rounded-lg border border-border border-t-2 border-t-gold bg-card p-5 space-y-3">
        <p className="text-xs font-mono uppercase text-gold font-semibold">₿ BTC REGIME</p>
        <div className="flex flex-wrap items-end gap-4">
          <p className="text-4xl font-extrabold text-foreground font-mono">78/100</p>
          <span className="rounded-md bg-bull/15 px-3 py-1 text-sm font-mono font-bold text-bull">
            BULLISH REGIME
          </span>
          <p className="text-xs text-muted-foreground font-mono">
            BTC $82,374 · +1.08% 24h · Hashrate ATH (884 EH/s)
          </p>
        </div>
        <div className="grid gap-3 pt-2 text-xs sm:grid-cols-3 border-t border-border">
          <p>Short-term: <b className="text-foreground">Neutral / Bullish</b></p>
          <p>Swing: <b className="text-bull">Bullish Continuation</b></p>
          <p>Long-term: <b className="text-bull">Structural Bull</b></p>
        </div>
      </section>

      {/* 9 Engine Scores Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono">
          Engine Scores Breakdown (Weighted 0–100)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ENGINE_SCORES.map((e) => (
            <div key={e.label} className="panel rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold text-foreground">{e.label} (Weight {Math.round(e.weight * 100)}%)</span>
                <span className={e.value >= 70 ? 'text-bull font-bold' : e.value <= 40 ? 'text-bear' : 'text-gold'}>
                  {e.value}/100
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border">
                <div
                  className={`h-full ${e.value >= 70 ? 'bg-bull' : e.value <= 40 ? 'bg-bear' : 'bg-gold'}`}
                  style={{ width: `${e.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regime Detector Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono">
          Historical Regime Detector
        </h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left font-mono">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2.5">Regime</th>
                <th className="px-4 py-2.5">Key Conditions</th>
                <th className="px-4 py-2.5 text-right">Probability Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {REGIME_DETECTOR.map((r) => (
                <tr key={r.name} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2.5 font-bold text-foreground">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-sans">{r.conditions.join(' · ')}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-primary">{r.match}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 20-Factor Long-Term Investor Panel */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono">
          Long-Term Investor Panel (20 Core Factors)
        </h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left font-mono">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-3 py-2">Factor</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Reading</th>
                <th className="px-3 py-2 text-right">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {LONG_TERM_INVESTOR_PANEL.map((f, i) => (
                <tr key={i} className="hover:bg-[#1e2a42]/20">
                  <td className="px-3 py-2 font-bold text-foreground">{f.factor}</td>
                  <td className="px-3 py-2 text-muted-foreground">{f.weight}/10</td>
                  <td className="px-3 py-2 text-foreground">{f.value}</td>
                  <td className="px-3 py-2 text-right font-bold">
                    {f.read === 'bull' && <span className="text-bull">SUPPORTIVE</span>}
                    {f.read === 'bear' && <span className="text-bear">HEADWIND</span>}
                    {f.read === 'neutral' && <span className="text-gold">NEUTRAL</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 6. BITCOIN MARKET ENGINE                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
function BtcEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          ₿ Bitcoin Market Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live price structure, timeframe alignment, technical oscillator matrix, and depth analysis — in a unified command deck.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'BTC Price', val: '$82,374' },
          { label: '24h Change', val: '+1.08%' },
          { label: 'Market Cap', val: '$1.62T' },
          { label: '24h Volume', val: '$44.8B' },
          { label: '7d / 30d Trend', val: '+4.2% / +14.8%' },
          { label: 'ATH Distance', val: '-18.4%' },
          { label: 'BTC Dominance', val: '56.4%' },
          { label: 'Hashrate', val: '884 EH/s' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{m.val}</p>
          </div>
        ))}
      </div>

      {/* Live TradingView Chart */}
      <div className="panel rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-mono text-foreground font-bold">BINANCE:BTCUSDT · Advanced Live Chart</span>
          <span className="text-xs text-bull font-mono">1-Hour Timeframe</span>
        </div>
        <TradingViewWidget symbol="BINANCE:BTCUSDT" interval="60" height={460} studies={['STD;EMA', 'STD;RSI', 'STD;MACD']} />
      </div>

      {/* Multi-Timeframe Alignment */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono">
          Multi-Timeframe Trend & Alignment Matrix
        </h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left font-mono">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2">TF</th>
                <th className="px-4 py-2">Trend</th>
                <th className="px-4 py-2">RSI (14)</th>
                <th className="px-4 py-2">Readout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                { tf: '5M', trend: 'Range', rsi: 51, read: 'Chop around VWAP' },
                { tf: '15M', trend: 'Up', rsi: 58, read: 'Higher lows holding' },
                { tf: '1H', trend: 'Up', rsi: 62, read: 'BOS confirmed' },
                { tf: '4H', trend: 'Up', rsi: 64, read: 'Above EMA 20/50' },
                { tf: '1D', trend: 'Up', rsi: 61, read: 'Trend intact' },
                { tf: '1W', trend: 'Up', rsi: 67, read: 'Cycle uptrend' }
              ].map((r) => (
                <tr key={r.tf} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2 font-bold text-foreground">{r.tf}</td>
                  <td className="px-4 py-2 text-bull font-bold">↑ {r.trend}</td>
                  <td className="px-4 py-2 text-foreground">{r.rsi}</td>
                  <td className="px-4 py-2 text-muted-foreground font-sans">{r.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 7. ETHEREUM & DOMINANCE ENGINE                                             */
/* ────────────────────────────────────────────────────────────────────────── */
function EthEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          Ξ Ethereum & Dominance Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ETH/BTC ratio and market dominance metrics determine the exact rotation phase between Bitcoin and altcoin liquidity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'ETH Price', val: '$2,535' },
          { label: 'ETH 24h Change', val: '+3.45%' },
          { label: 'ETH/BTC Ratio', val: '0.03077' },
          { label: 'ETH Dominance', val: '12.1%' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
          </div>
        ))}
      </div>

      <div className="panel rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-mono text-foreground font-bold">BINANCE:ETHBTC · Rotation Indicator Chart</span>
          <span className="text-xs text-primary font-mono">Daily Timeframe</span>
        </div>
        <TradingViewWidget symbol="BINANCE:ETHBTC" interval="D" height={420} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 8. WHALE ENGINE                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
function WhaleEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🐋 Whale Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tracking large wallet cohort movements (&gt;100 BTC, &gt;1K BTC, &gt;10K BTC), exchange net outflows, and dormant coin activations.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel rounded-lg border border-border bg-card p-4 space-y-2 font-mono">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Whale Accumulation Score</span>
            <span className="text-bull font-bold">74 / 100 (Aggressive)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border">
            <div className="h-full bg-bull w-[74%]" />
          </div>
        </section>

        <section className="panel rounded-lg border border-border bg-card p-4 space-y-2 font-mono">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Whale Distribution Risk</span>
            <span className="text-primary font-bold">31 / 100 (Low)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border">
            <div className="h-full bg-primary w-[31%]" />
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
        {[
          { label: 'Wallets >100 BTC', val: '16,410', sub: '+42 in 30d' },
          { label: '1K+ BTC Addresses', val: '2,094', sub: '+18 in 30d' },
          { label: '10K+ BTC Mega-Whales', val: '104', sub: 'Flat' },
          { label: '30d Net Accumulation', val: '+38,600 BTC', sub: 'Bullish' },
          { label: 'Whale Exchange Outflow', val: '7,900 BTC', sub: '24h window' },
          { label: 'Dormant Whale Coins Moved', val: '1,250 BTC', sub: 'Subdued' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 9. LIQUIDATION HEATMAP, MAP & MAX PAIN (COINGLASS PRO)                    */
/* ────────────────────────────────────────────────────────────────────────── */
function LiquidationMapView() {
  return <LiquidationTerminalView />;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 10. DERIVATIVES & OPTIONS ENGINE                                           */
/* ────────────────────────────────────────────────────────────────────────── */
function DerivativesEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🎲 Derivatives Engine & Funding Rates
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perpetual futures funding rates, open interest distribution, basis spreads across premier derivative venues.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Aggregate OI', val: '$38.4B', sub: '+6.2% 24h' },
          { label: 'Futures Volume (24h)', val: '$74B', sub: 'Liquid' },
          { label: 'Avg Funding Rate', val: '+0.014%', sub: 'Healthy Contango' },
          { label: 'Annualized Basis', val: '7.8%', sub: 'Normal carry' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Exchange Comparison Matrix
        </h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2.5">Exchange</th>
                <th className="px-4 py-2.5">8h Funding</th>
                <th className="px-4 py-2.5">Open Interest</th>
                <th className="px-4 py-2.5 text-right">24h Liquidations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {DERIVATIVES_EXCHANGES.map((d) => (
                <tr key={d.ex} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2.5 font-bold text-foreground">{d.ex}</td>
                  <td className="px-4 py-2.5 text-bull">{d.funding}</td>
                  <td className="px-4 py-2.5 text-foreground">{d.oi}</td>
                  <td className="px-4 py-2.5 text-right text-bear font-bold">{d.liq24}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OptionsEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🎯 Options Engine & Skew
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Implied volatility, Put/Call ratios, 25-delta skew, max pain and dealer gamma positioning on Deribit and CME.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'BTC Options OI', val: '$41.2B' },
          { label: 'Implied Volatility (30D)', val: '48%' },
          { label: 'Put/Call Ratio (OI)', val: '0.72 (Call-Heavy)' },
          { label: 'Max Pain (Monthly)', val: '$88,000' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 11. ETF & INSTITUTIONAL ENGINE                                             */
/* ────────────────────────────────────────────────────────────────────────── */
function EtfEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🏛️ Spot ETF & Institutional Flows
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily and weekly net inflow trackers across BlackRock, Fidelity, and public corporate balance sheets.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Total ETF Holdings', val: '1.25M BTC', sub: '6.0% of supply' },
          { label: 'Total ETF AUM', val: '$135B', sub: 'Record high' },
          { label: 'Daily Net Flow', val: '+$281M', sub: 'Institutional bid' },
          { label: 'Cumulative Net Inflow', val: '+$54.2B', sub: 'Since launch' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ETF Issuers Table */}
      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">US Spot Bitcoin ETF Issuers</h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2.5">Ticker</th>
                <th className="px-4 py-2.5">Issuer</th>
                <th className="px-4 py-2.5">Daily Flow</th>
                <th className="px-4 py-2.5">Weekly Flow</th>
                <th className="px-4 py-2.5">Holdings</th>
                <th className="px-4 py-2.5 text-right">Total AUM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ETF_ISSUERS.map((e) => (
                <tr key={e.ticker} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2.5 font-bold text-foreground">{e.ticker}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.issuer}</td>
                  <td className={`px-4 py-2.5 font-bold ${e.day.startsWith('-') ? 'text-bear' : 'text-bull'}`}>{e.day}</td>
                  <td className={`px-4 py-2.5 font-bold ${e.week.startsWith('-') ? 'text-bear' : 'text-bull'}`}>{e.week}</td>
                  <td className="px-4 py-2.5 text-foreground">{e.holdings}</td>
                  <td className="px-4 py-2.5 text-right text-foreground font-bold">{e.aum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Treasuries Table */}
      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Corporate Treasury Balance Sheets</h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Total BTC</th>
                <th className="px-4 py-2.5">Avg Cost</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5 text-right">% of Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {CORPORATE_TREASURIES.map((c) => (
                <tr key={c.company} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2.5 font-bold text-foreground">{c.company}</td>
                  <td className="px-4 py-2.5 text-foreground font-bold">{c.btc}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.avgPrice}</td>
                  <td className="px-4 py-2.5 text-bull font-bold">{c.trend}</td>
                  <td className="px-4 py-2.5 text-right text-primary">{c.pctMcap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 12. GOLD DASHBOARD — FULL 16-MODULE COMMAND CENTRE                        */
/* ────────────────────────────────────────────────────────────────────────── */
// GoldDashboardView is imported directly from ./components/GoldDashboardView

/* ────────────────────────────────────────────────────────────────────────── */
/* 13. CHARTS & CORRELATIONS                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
function CorrelationsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Tools
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📉 Charts & Correlations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Five 'different' longs with 0.8 correlation is one big position. Check the cross-market rolling matrix before you size up.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel rounded-lg border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-mono font-bold text-foreground">BTC/USD (BINANCE:BTCUSDT)</p>
          <TradingViewWidget symbol="BINANCE:BTCUSDT" interval="60" height={360} />
        </div>
        <div className="panel rounded-lg border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-mono font-bold text-foreground">Gold Spot (OANDA:XAUUSD)</p>
          <TradingViewWidget symbol="OANDA:XAUUSD" interval="60" height={360} />
        </div>
        <div className="panel rounded-lg border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-mono font-bold text-foreground">S&P 500 (FOREXCOM:SPXUSD)</p>
          <TradingViewWidget symbol="FOREXCOM:SPXUSD" interval="D" height={360} />
        </div>
      </div>

      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Rolling Correlations (30D vs 90D)</h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2.5">Pair</th>
                <th className="px-4 py-2.5">30D</th>
                <th className="px-4 py-2.5">90D</th>
                <th className="px-4 py-2.5">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {CORRELATIONS_MATRIX.map((c) => (
                <tr key={c.pair} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2.5 font-bold text-foreground">{c.pair}</td>
                  <td className={`px-4 py-2.5 font-bold ${c.d30 > 0 ? 'text-bull' : 'text-bear'}`}>{c.d30.toFixed(2)}</td>
                  <td className={`px-4 py-2.5 font-bold ${c.d90 > 0 ? 'text-bull' : 'text-bear'}`}>{c.d90.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-sans">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 14. LIVE MARKET OVERVIEW (FULL 25+ ASSETS)                                 */
/* ────────────────────────────────────────────────────────────────────────── */
function LiveMarketOverviewView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Dashboard
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📈 Live Market Overview — Multi-Asset Telemetry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every premier market quote updating in real time across traditional finance and crypto majors.
        </p>
      </div>

      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Traditional Benchmark Assets</h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-4 py-2.5">Market</th>
                <th className="px-4 py-2.5">Last Price</th>
                <th className="px-4 py-2.5">Change</th>
                <th className="px-4 py-2.5 text-right">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {BASE_TICKERS.map((t) => (
                <tr key={t.symbol} className="hover:bg-[#1e2a42]/20">
                  <td className="px-4 py-2.5 font-bold text-foreground">{t.name} ({t.symbol})</td>
                  <td className="px-4 py-2.5 font-bold text-foreground">{t.price}</td>
                  <td className={`px-4 py-2.5 font-bold ${t.isPositive ? 'text-bull' : 'text-bear'}`}>{t.change}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 15. CONFLUENCE ENGINE & SCANNER                                            */
/* ────────────────────────────────────────────────────────────────────────── */
function ConfluenceEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Confluence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          ⚙️ Confluence Engine — 6 Weighted Pillars
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each pillar scored 0–100, weighted and blended into a single global market bias.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="panel rounded-lg border border-border bg-card p-5 flex flex-col items-center justify-between">
          <h2 className="text-xs uppercase font-mono text-muted-foreground">Global Macro Bias</h2>
          <BiasGauge score={68} />
          <div className="border-t border-border w-full pt-3 text-center">
            <span className="text-sm font-bold text-bull font-mono">BULLISH BIAS (68/100)</span>
          </div>
        </section>

        <section className="panel rounded-lg border border-border bg-card p-5 space-y-3 font-mono">
          <h2 className="text-xs uppercase text-muted-foreground font-bold">Pillars Breakdown</h2>
          {CONFLUENCE_PILLARS.map((p) => (
            <div key={p.pillar} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground font-semibold">{p.pillar} ({p.weight}% weight)</span>
                <span className={p.tone === 'bull' ? 'text-bull font-bold' : p.tone === 'bear' ? 'text-bear' : 'text-gold'}>
                  {p.read} · {p.score}/100
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border">
                <div className={`h-full ${p.tone === 'bull' ? 'bg-bull' : p.tone === 'bear' ? 'bg-bear' : 'bg-gold'}`} style={{ width: `${p.score}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function BullBearScannerView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Confluence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🐂 Bull / Bear Scanner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A market only earns a BULL or BEAR tag when trend, momentum, and macro fit align.
        </p>
      </div>

      <div className="panel overflow-x-auto rounded-lg border border-border bg-card font-mono">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
              <th className="px-4 py-2.5">Asset</th>
              <th className="px-4 py-2.5">Trend</th>
              <th className="px-4 py-2.5">Momentum</th>
              <th className="px-4 py-2.5">Macro Fit</th>
              <th className="px-4 py-2.5">Verdict</th>
              <th className="px-4 py-2.5">Trigger Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {BULL_BEAR_SCANNER.map((s) => (
              <tr key={s.asset} className="hover:bg-[#1e2a42]/20">
                <td className="px-4 py-2.5 font-bold text-foreground">{s.asset}</td>
                <td className={`px-4 py-2.5 font-bold ${s.trend === 'bull' ? 'text-bull' : s.trend === 'bear' ? 'text-bear' : 'text-gold'}`}>{s.trend.toUpperCase()}</td>
                <td className="px-4 py-2.5 text-foreground">{s.momentum}</td>
                <td className="px-4 py-2.5 text-foreground">{s.macroFit}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-2 py-0.5 font-bold ${s.verdict === 'BULL' ? 'bg-bull/15 text-bull' : s.verdict === 'BEAR' ? 'bg-bear/15 text-bear' : 'bg-gold/15 text-gold'}`}>
                    {s.verdict}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground font-sans">{s.trigger}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegimeMatrixView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Confluence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🧩 4-Quadrant Market-Regime Matrix
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mapping growth vs inflation trajectories into strategic asset allocation regimes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 font-mono">
        {[
          { q: 'Q1 · Goldilocks', g: 'Rising Growth', i: 'Falling Inflation', fav: 'Equities, Tech, Crypto', active: false },
          { q: 'Q2 · Reflation', g: 'Rising Growth', i: 'Rising Inflation', fav: 'Commodities, Energy, Value', active: false },
          { q: 'Q3 · Stagflation', g: 'Falling Growth', i: 'Rising Inflation', fav: 'Gold, Cash, Defensives', active: false },
          { q: 'Q4 · Deflation', g: 'Falling Growth', i: 'Falling Inflation', fav: 'Long Bonds, Quality USD', active: false },
          { q: 'Current · Q1 / Q4 Border', g: 'Slowing Growth', i: 'Decelerating Inflation', fav: 'Gold, Large-Cap Crypto, High-Quality Duration', active: true }
        ].map((item, idx) => (
          <div key={idx} className={`panel rounded-lg border p-5 ${item.active ? 'border-gold bg-gold/10' : 'border-border bg-card'}`}>
            <span className="text-xs uppercase text-primary font-bold">{item.q}</span>
            <div className="mt-2 text-sm text-foreground font-bold">{item.g} · {item.i}</div>
            <p className="mt-2 text-xs text-muted-foreground font-sans">Favours: <b className="text-foreground">{item.fav}</b></p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 16. INTELLIGENCE: AI TRADING ASSISTANT & RISK CONSOLE                      */
/* ────────────────────────────────────────────────────────────────────────── */
function AiAssistantView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Intelligence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🤖 AI Trading Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One clear call per market — LONG, SHORT or WAIT. No entry without a stop, no stop without a target.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 font-mono">
        {ACTIVE_SIGNALS.map((s) => (
          <div key={s.market} className="panel rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-foreground">{s.market}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.timeframe} · Risk {s.risk}</span>
              </div>
              <span className={`rounded px-2.5 py-0.5 text-xs font-bold ${s.side === 'LONG' ? 'bg-bull/15 text-bull' : s.side === 'SHORT' ? 'bg-bear/15 text-bear' : 'bg-gold/15 text-gold'}`}>
                {s.side}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs border-y border-border py-2.5">
              <div><span className="text-muted-foreground block text-[11px]">Entry</span><b>{s.entry}</b></div>
              <div className="text-bear"><span className="text-muted-foreground block text-[11px]">Stop</span><b>{s.stop}</b></div>
              <div className="text-bull"><span className="text-muted-foreground block text-[11px]">Target</span><b>{s.target}</b></div>
              <div><span className="text-muted-foreground block text-[11px]">R:R</span><b>{s.rr}</b></div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span className="text-foreground font-bold">{s.confidence}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden border border-border">
                <div className="h-full bg-primary" style={{ width: `${s.confidence}%` }} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-sans pt-1 border-t border-border">{s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskConsoleView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Intelligence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🛡️ AI Risk Console & Portfolio Heat
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Risk first, entry second. Automating position sizes based on equity and maximum allowable drawdown.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Account Equity', val: '$100,000' },
          { label: 'Risk Per Trade', val: '1.5%' },
          { label: 'Max Open Risk', val: '6.0%' },
          { label: 'Daily Loss Limit', val: '$3,000' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 17. REMAINING MODULES (ECONOMIC EVENTS, CENTRAL BANKS, ALTCOINS, DEFI...)  */
/* ────────────────────────────────────────────────────────────────────────── */
function EconomicEventsView() {
  const [usdOnly, setUsdOnly] = useState(false);
  const [highOnly, setHighOnly] = useState(false);
  const [filterDay, setFilterDay] = useState<'All' | 'Today' | 'Tomorrow' | 'Friday'>('Today');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Live News Reaction Chart State
  const [newsChartSymbol, setNewsChartSymbol] = useState<'OANDA:XAUUSD' | 'BINANCE:BTCUSDT' | 'CAPITALCOM:DXY' | 'TVC:US10Y'>('OANDA:XAUUSD');
  const [newsChartInterval, setNewsChartInterval] = useState<'15' | '60' | '240' | 'D'>('60');

  // Live Countdown to 6:00 PM US CPI Release (Today)
  const [countdownStr, setCountdownStr] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date();
      target.setHours(18, 0, 0, 0); // 6:00 PM today
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdownStr('RELEASED');
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdownStr(`${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER & FOREX FACTORY SYNC STATUS ── */}
      <div className="card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg font-black text-2xl shrink-0 shadow-lg">
              📅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-heading text-text">
                  NEWS EVENTS & LIVE MACRO CALENDAR
                </h1>
                <span className="label rounded-full bg-up-bg border border-up text-up px-2.5 py-0.5 font-bold">
                  FOREXFACTORY LIVE
                </span>
              </div>
              <p className="label text-text-muted font-bold mt-1">
                US CPI • CORE CPI • PPI • FOMC • RETAIL SALES • BITCOIN & GOLD TRANSMISSION
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-up animate-pulse" />
            <span className="text-xs font-mono font-bold text-accent">
              FEED ACTIVE: 14-OCT-2026 SESSION
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. UPCOMING TIER-1 RELEASE HERO SPOTLIGHT (US CPI AT 6:00 PM) ── */}
      <div className="terminal-hero-spotlight p-6 space-y-4 border-2 border-accent/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="label px-2 py-0.5 rounded bg-down-bg border border-down text-down font-bold">
                🔴 RED FOLDER • HIGH IMPACT
              </span>
              <span className="label text-accent font-bold">RELEASE TIME: TODAY, 6:00 PM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text">
              US Core CPI & CPI (MoM / YoY) Release
            </h2>
            <p className="text-xs text-text-muted">
              Bureau of Labor Statistics (BLS) headline & core inflation prints that dictate Federal Reserve interest rate policy.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="card px-5 py-3 border-2 border-gold/50 bg-surface-2 text-right shrink-0">
            <div className="text-[10px] font-mono uppercase text-gold font-bold tracking-wider">Countdown to Release</div>
            <div className="text-2xl font-mono font-black text-gold num mt-0.5">
              {countdownStr}
            </div>
          </div>
        </div>

        {/* 4 Official Forex Factory Key Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="plan-item">
            <div className="plan-item-label">Core CPI m/m</div>
            <div className="plan-item-val text-accent text-base">Forecast: 0.2%</div>
            <div className="text-[11px] text-text-muted mt-1">Previous: 0.3%</div>
          </div>
          <div className="plan-item">
            <div className="plan-item-label">Core CPI y/y</div>
            <div className="plan-item-val text-accent text-base">Forecast: 2.5%</div>
            <div className="text-[11px] text-text-muted mt-1">Previous: 2.4%</div>
          </div>
          <div className="plan-item">
            <div className="plan-item-label">CPI m/m</div>
            <div className="plan-item-val text-gold text-base">Forecast: 0.6%</div>
            <div className="text-[11px] text-text-muted mt-1">Previous: 0.4%</div>
          </div>
          <div className="plan-item">
            <div className="plan-item-label">CPI y/y (Headline)</div>
            <div className="plan-item-val text-gold text-base">Forecast: 3.6%</div>
            <div className="text-[11px] text-text-muted mt-1">Previous: 3.4%</div>
          </div>
        </div>

        {/* CPI 3-Scenario Matrix Quick Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-surface-2 border border-up/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-up">1. Below Forecast (&lt; 3.6%)</span>
              <span className="label text-up font-bold">BULLISH SURGE</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              DXY dumps below 101.80. Gold pumps toward <strong>$2,725+</strong>, Bitcoin surges toward <strong>$87,400+</strong>.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-gold/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gold">2. In-Line (= 3.6%)</span>
              <span className="label text-gold font-bold">2-WAY CHOP</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Initial 15-minute wick hunt both sides. Gold rangebound <strong>$2,648–$2,675</strong>, BTC consolidates <strong>$83.3K–$84.9K</strong>.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-down/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-down">3. Above Forecast (&gt; 3.6%)</span>
              <span className="label text-down font-bold">HAWKISH DROP</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              DXY rallies through 103.50. Gold pulls back to <strong>$2,620</strong>, Bitcoin dips toward <strong>$80,500</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. LIVE MULTI-ASSET NEWS REACTION CHART ── */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-text">
              📊 Live News Reaction Chart
            </span>
            <span className="label text-text-muted">Multi-Asset Real-Time Candles</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Asset Switcher */}
            <div className="flex items-center rounded-lg bg-surface-2 border border-border p-0.5 text-xs">
              {[
                { label: '🥇 Gold (XAU/USD)', sym: 'OANDA:XAUUSD' as const },
                { label: '₿ Bitcoin (BTC/USD)', sym: 'BINANCE:BTCUSDT' as const },
                { label: '💵 US Dollar (DXY)', sym: 'CAPITALCOM:DXY' as const },
                { label: '📈 10Y Yield', sym: 'TVC:US10Y' as const }
              ].map(asset => (
                <button
                  key={asset.sym}
                  onClick={() => setNewsChartSymbol(asset.sym)}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    newsChartSymbol === asset.sym ? 'btn-primary shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {asset.label}
                </button>
              ))}
            </div>

            {/* Timeframe */}
            <div className="flex items-center rounded-lg bg-surface-2 border border-border p-0.5 text-xs font-mono">
              {[
                { label: '15m', val: '15' as const },
                { label: '1H', val: '60' as const },
                { label: '4H', val: '240' as const },
                { label: '1D', val: 'D' as const }
              ].map(tf => (
                <button
                  key={tf.val}
                  onClick={() => setNewsChartInterval(tf.val)}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    newsChartInterval === tf.val ? 'bg-surface border border-accent text-accent' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Embedded TradingView Chart */}
        <div className="h-[440px] w-full rounded-xl overflow-hidden border border-border bg-[#0a1020]">
          <TradingViewWidget
            key={`${newsChartSymbol}-${newsChartInterval}`}
            symbol={newsChartSymbol}
            theme="dark"
            height={440}
            interval={newsChartInterval}
          />
        </div>
      </div>

      {/* ── 4. FOREX FACTORY-SYNCED CALENDAR TABLE & FILTERS ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterDay('Today')}
              className={`rounded-full border px-4 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                filterDay === 'Today' ? 'btn-primary' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              ⚡ Today's Events (ForexFactory)
            </button>
            <button
              onClick={() => setFilterDay('All')}
              className={`rounded-full border px-4 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                filterDay === 'All' ? 'btn-primary' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              📅 Complete Week
            </button>
            <button
              onClick={() => setHighOnly(!highOnly)}
              className={`rounded-full border px-4 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                highOnly ? 'border-down bg-down text-white' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {highOnly ? '🔴 High Impact Only' : 'Medium + High Impact'}
            </button>
            <button
              onClick={() => setUsdOnly(!usdOnly)}
              className={`rounded-full border px-4 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                usdOnly ? 'btn-primary' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {usdOnly ? '🇺🇸 USD Only' : '🌍 All Currencies'}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search event (CPI, Retail, FOMC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 pl-8 rounded-lg bg-surface border border-border text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent w-full sm:w-64"
            />
            <span className="absolute left-2.5 top-2 text-text-muted text-xs">🔍</span>
          </div>
        </div>

        <EconCalendar
          usdOnly={usdOnly}
          minImpact={highOnly ? 'High' : 'Low'}
          filterDay={filterDay}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

function AltcoinsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🪙 Altcoins & Token Unlocks Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Derivatives depth, valuation multiples, and upcoming cliff unlock dilution pressure.
        </p>
      </div>

      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Altcoin Intelligence Matrix</h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">FDV</th>
                <th className="px-3 py-2">Vol / Mcap</th>
                <th className="px-3 py-2">OI</th>
                <th className="px-3 py-2">Funding</th>
                <th className="px-3 py-2">Active TVL</th>
                <th className="px-3 py-2 text-right">30d Unlock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ALTCOINS_DATA.map((a) => (
                <tr key={a.coin} className="hover:bg-[#1e2a42]/20">
                  <td className="px-3 py-2 font-bold text-foreground">{a.coin}</td>
                  <td className="px-3 py-2 text-foreground">{a.fdv}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.volMcap}</td>
                  <td className="px-3 py-2 text-foreground">{a.oi}</td>
                  <td className="px-3 py-2 text-bull font-bold">{a.funding}</td>
                  <td className="px-3 py-2 text-foreground">{a.tvl}</td>
                  <td className="px-3 py-2 text-right text-bear font-bold">{a.unlock30d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 font-mono">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Token Unlock Dilution Calendar</h2>
        <div className="panel overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-3 py-2">Token</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">USD Value</th>
                <th className="px-3 py-2">% Circulating</th>
                <th className="px-3 py-2 text-right">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {TOKEN_UNLOCKS.map((u) => (
                <tr key={u.token} className="hover:bg-[#1e2a42]/20">
                  <td className="px-3 py-2 font-bold text-foreground">{u.token}</td>
                  <td className="px-3 py-2 text-foreground">{u.amount}</td>
                  <td className="px-3 py-2 text-bear font-bold">{u.usd}</td>
                  <td className="px-3 py-2 text-foreground">{u.pctCirc}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{u.schedule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DefiView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🧱 DeFi & Layer-1 Ecosystems
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Total DeFi TVL ($148B) and comparative on-chain economic metrics across competing blockchains.
        </p>
      </div>

      <div className="panel overflow-x-auto rounded-lg border border-border bg-card font-mono">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
              <th className="px-3 py-2.5">Chain</th>
              <th className="px-3 py-2.5">Active Addr</th>
              <th className="px-3 py-2.5">Daily Tx</th>
              <th className="px-3 py-2.5">TVL</th>
              <th className="px-3 py-2.5">DEX Vol</th>
              <th className="px-3 py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {DEFI_CHAINS.map((c) => (
              <tr key={c.chain} className="hover:bg-[#1e2a42]/20">
                <td className="px-3 py-2.5 font-bold text-foreground">{c.chain}</td>
                <td className="px-3 py-2.5 text-foreground">{c.addr}</td>
                <td className="px-3 py-2.5 text-foreground">{c.tx}</td>
                <td className="px-3 py-2.5 text-bull font-bold">{c.tvl}</td>
                <td className="px-3 py-2.5 text-foreground">{c.dex}</td>
                <td className="px-3 py-2.5 text-right font-bold text-primary">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NarrativesView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📡 Market Narratives & Sector Rotations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time score ranking of capital velocity and social mindshare across active crypto sectors.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
        {NARRATIVES.map((n) => (
          <div key={n.name} className="panel rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground text-sm">{n.name}</span>
              <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                Score: {n.score}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Growth: <b className={n.mcapGrowth.startsWith('+') ? 'text-bull' : 'text-bear'}>{n.mcapGrowth}</b></span>
              <span>Social: <b className="text-foreground">{n.social}</b></span>
            </div>
            <p className="text-xs text-muted-foreground font-sans border-t border-border pt-2">{n.drivers}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CentralBanksView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Policy & Money
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🌐 Global Central Banks & Rate Trajectories
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Currencies are relative trades. What matters is who is cutting faster — and the BoJ hiking is the global carry risk.
        </p>
      </div>

      <div className="panel overflow-x-auto rounded-lg border border-border bg-card font-mono">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
              <th className="px-4 py-2.5">Central Bank</th>
              <th className="px-4 py-2.5">Current Policy Rate</th>
              <th className="px-4 py-2.5">Stance</th>
              <th className="px-4 py-2.5 text-right">Next Move Priced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {CENTRAL_BANKS.map((b) => (
              <tr key={b.bank} className="hover:bg-[#1e2a42]/20">
                <td className="px-4 py-2.5 font-bold text-foreground">{b.bank}</td>
                <td className="px-4 py-2.5 text-foreground font-bold">{b.rate}</td>
                <td className="px-4 py-2.5 text-bull font-bold">{b.stance}</td>
                <td className="px-4 py-2.5 text-right text-primary">{b.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StablecoinEngineView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          💵 Stablecoins & Liquidity Flows
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Total stablecoin supply growth equals dry powder entering the cryptocurrency financial system.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Supply Growth (30d)', val: '+$6.4B', sub: 'Bullish dry powder' },
          { label: 'Exchange Reserves', val: '$48.2B', sub: '+$1.9B in 30d' },
          { label: 'Stablecoin Dominance', val: '7.4%', sub: 'Falling = Risk-On' },
          { label: 'Crypto Liquidity Score', val: '82 / 100', sub: 'Strong environment' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StocksView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Stock Market
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🏢 Stock Market & Equity Volatility
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-3">
        <TradingViewWidget symbol="FOREXCOM:SPXUSD" interval="D" height={420} />
      </div>
    </div>
  );
}

function ForexView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          World
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          💱 Forex Dashboard & Dollar Index
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-3">
        <TradingViewWidget symbol="TVC:DXY" interval="D" height={420} />
      </div>
    </div>
  );
}

function CryptoMarketView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          ₿ Crypto Market Overview
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-3">
        <TradingViewWidget symbol="BINANCE:BTCUSDT" interval="60" height={420} />
      </div>
    </div>
  );
}

function MacroEconomyView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Macro Economy
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📊 Inflation, Growth & Policy Trajectory
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-3">
        <TradingViewWidget symbol="TVC:US10Y" interval="D" height={420} />
      </div>
    </div>
  );
}

function FedView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Policy & Money
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🏦 Federal Reserve & Balance Sheet
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Fed Funds Target', val: '3.25–3.50%', sub: 'Upper bound 3.50%' },
          { label: 'Rate Cut Probability', val: '68%', sub: 'Next meeting' },
          { label: 'Fed Balance Sheet', val: '$6.62T', sub: 'QT tapering' },
          { label: 'Reverse Repo (RRP)', val: '$118B', sub: 'Near floor' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiquidityView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Policy & Money
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          💧 Banking & Global Liquidity
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'US M2 Money Supply', val: '$21.9T', sub: '+4.1% YoY' },
          { label: 'Global M2 (USD)', val: '$112T', sub: '+6.8% YoY' },
          { label: 'Treasury TGA Balance', val: '$742B', sub: 'Reserves injected' },
          { label: 'Commercial Bank Reserves', val: '$3.24T', sub: 'Ample regime' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function YieldsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Policy & Money
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📉 Yield Curve & Treasury Bonds
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-3">
        <TradingViewWidget symbol="TVC:US10Y" interval="D" height={400} />
      </div>
    </div>
  );
}

function UsEconomyView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Economy
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🇺🇸 US Economic Data Indicators
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'ISM Manufacturing', val: '48.6', sub: 'Contraction but improving' },
          { label: 'ISM Services', val: '53.4', sub: 'Expansion driving GDP' },
          { label: 'Retail Sales (MoM)', val: '+0.4%', sub: 'Consumer resilient' },
          { label: 'Consumer Confidence', val: '99.2', sub: 'Expectations soft' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GdpView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Economy
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📐 GDP & Economic Growth
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Real GDP (QoQ ann.)', val: '2.1%', sub: 'Above-trend' },
          { label: 'GDPNow Nowcast', val: '1.9%', sub: 'Current quarter' },
          { label: 'Consumption Imp.', val: '+1.4pp', sub: 'Core engine' },
          { label: 'Recession Prob (12m)', val: '24%', sub: 'Contained' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InflationView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Economy
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🔥 Inflation Dashboard
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Headline CPI (YoY)', val: '3.5%', sub: 'Decelerating' },
          { label: 'Core CPI (YoY)', val: '3.1%', sub: 'Shelter feeding through' },
          { label: 'Core PCE (Target 2.0%)', val: '2.7%', sub: 'Preferred gauge' },
          { label: '5y5y Breakeven', val: '2.28%', sub: 'Expectations anchored' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabourView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Economy
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          👷 Labour Market & Employment
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Non-Farm Payrolls', val: '57K', sub: 'Decelerating' },
          { label: 'Unemployment Rate', val: '4.3%', sub: 'Sahm rule watch' },
          { label: 'Initial Claims (4w avg)', val: '224K', sub: 'No layoff wave' },
          { label: 'Job Openings (JOLTS)', val: '7.2M', sub: 'Normalized' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeopoliticsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          World
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          ⚠️ Geopolitical Risk Index
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
        {GEOPOLITICAL_RISKS.map((g) => (
          <div key={g.region} className="panel rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">{g.region}</span>
              <span className="rounded bg-bear/15 px-2 py-0.5 text-xs text-bear font-bold">
                Risk: {g.level}/100
              </span>
            </div>
            <p className="text-xs text-foreground">{g.issue}</p>
            <p className="text-[11px] text-muted-foreground border-t border-border pt-2">Impact: {g.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocioeconomicView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          World
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          👥 Socioeconomic Data & Demographics
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Real Wage Growth', val: '+0.3%', sub: 'Purchasing power flat' },
          { label: 'Personal Savings Rate', val: '4.1%', sub: 'Buffers thinning' },
          { label: 'Credit Card Delinquency', val: '3.4%', sub: '90d+ lower cohorts' },
          { label: 'Housing Affordability', val: 'Lowest since 1985', sub: 'Elevated rates' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsView() {
  const [selectedCat, setSelectedCat] = useState<string>('ALL_WORLD');
  const [query, setQuery] = useState<string>('');

  const filteredNews = ALL_WORLD_GLOBAL_NEWS_FEED.filter((n) => {
    if (selectedCat !== 'ALL_WORLD' && n.category !== selectedCat) return false;
    if (query) {
      const q = query.toLowerCase();
      return n.headline.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.source.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
            Global News Wire
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2">
            <span>📰</span>
            <span>Real-Time All World Financial News & Breaking Crypto Events</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time verified feeds from Bloomberg, Reuters, CoinDesk, Cointelegraph & Global Central Banks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search news & events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        {[
          { key: 'ALL_WORLD', label: `⚡ All World News (${ALL_WORLD_GLOBAL_NEWS_FEED.length})` },
          { key: 'CRYPTO', label: '₿ Crypto & Bitcoin' },
          { key: 'COMMODITIES_GOLD', label: '🥇 Gold & Commodities' },
          { key: 'CENTRAL_BANKS', label: '🏦 Central Banks' },
          { key: 'GLOBAL_MACRO', label: '🌐 Global Macro' },
          { key: 'GEOPOLITICS', label: '🛡️ Geopolitics' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCat(tab.key)}
            className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
              selectedCat === tab.key
                ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* News Feed Grid */}
      <div className="grid gap-3 font-mono">
        {filteredNews.map((n) => (
          <div key={n.id} className="panel rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/50 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-foreground">
                  {n.source}
                </span>
                <span className="text-[11px] text-muted-foreground">⏱️ {n.timestamp}</span>
                {n.verified && <span className="text-[10px] text-bull font-bold">✓ Verified</span>}
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  n.sentiment === 'BULLISH' ? 'bg-bull/15 text-bull' : n.sentiment === 'BEARISH' ? 'bg-bear/15 text-bear' : 'bg-gold/15 text-gold'
                }`}>
                  {n.sentiment === 'BULLISH' ? '🟢 BULLISH' : n.sentiment === 'BEARISH' ? '🔴 BEARISH' : '🟡 NEUTRAL'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {n.impact}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-foreground font-sans">{n.headline}</h3>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">{n.summary}</p>

            {n.actualVsConsensus && (
              <div className="text-[11px] bg-secondary/50 p-2 rounded border border-border flex items-center justify-between flex-wrap gap-2">
                <span><b>Consensus:</b> {n.actualVsConsensus}</span>
                <span className="text-primary font-bold">Reaction: {n.marketReaction}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/60">
              <div className="text-muted-foreground font-sans">
                <b className="text-foreground">₿ Crypto Context:</b> {n.btcImpact}
              </div>
              <div className="text-muted-foreground font-sans">
                <b className="text-foreground">🥇 Gold Context:</b> {n.goldImpact}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming High-Impact Macro Events */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span>🗓️</span>
          <span>Upcoming Macro Events & Countdown Timers</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {UPCOMING_MACRO_CALENDAR_EVENTS.map((cal) => (
            <div key={cal.id} className="panel rounded-xl border border-border bg-card p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground font-sans">{cal.title}</span>
                <span className="px-1.5 py-0.5 rounded bg-bear/15 text-bear text-[10px] font-bold">{cal.impact}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Scheduled: {cal.scheduledTime}</span>
                <span className="text-gold font-bold">⏳ in {cal.countdown}</span>
              </div>
              <div className="flex justify-between text-[11px] bg-secondary/40 p-1.5 rounded">
                <span>Forecast: <b>{cal.forecast}</b></span>
                <span>Prior: <b>{cal.previous}</b></span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans pt-1 border-t border-border">
                <b>Plan:</b> {cal.marketImplication}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SentimentView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          World
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          😨 Market Sentiment & Positioning Skew
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
        {[
          { label: 'Crypto Fear & Greed', val: '68 · Greed', sub: 'Constructive' },
          { label: 'CNN Fear & Greed', val: '62 · Greed', sub: 'Equities healthy' },
          { label: 'CBOE VIX Volatility', val: '14.8', sub: 'Low vol regime' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PutCallView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          World
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          ⚖️ Put / Call Ratios
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Total US Equity P/C', val: '0.72', sub: 'Call-Heavy' },
          { label: 'S&P 500 Index P/C', val: '0.82', sub: 'Hedging demand' },
          { label: 'Nasdaq 100 P/C', val: '0.64', sub: 'Speculative upside' },
          { label: 'BTC Options P/C', val: '0.58', sub: 'Bullish call skew' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmartMoneyView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🧠 Smart Money & Institutional Flows
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 font-mono">
        {[
          { label: 'Whale Wallets (30d)', val: 'Net Accumulators', c: 'text-bull' },
          { label: 'Institutional Custodians', val: 'Strong Inflows', c: 'text-bull' },
          { label: 'Exchange Reserves', val: 'Multi-Year Lows', c: 'text-bull' },
          { label: 'CME Futures Positions', val: 'Institutional Longs Active', c: 'text-foreground' },
          { label: 'Large Options Trades', val: 'Call Spreads Dominating', c: 'text-bull' },
          { label: 'Stablecoin Velocity', val: 'Moving To Exchanges', c: 'text-bull' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className={`mt-1 text-lg font-bold ${m.c}`}>{m.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CryptoCalendarView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto Engines
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🗓️ Crypto Catalysts Calendar
        </h1>
      </div>
      <div className="space-y-2 font-mono">
        {[
          { date: 'Upcoming', event: 'US CPI Release (Consumer Price Index)', cat: 'Macro', impact: 'High 🔴' },
          { date: 'Upcoming', event: 'SUI 44M Token Unlock Event', cat: 'Dilution', impact: 'Medium 🟠' },
          { date: 'Upcoming', event: 'Deribit Quarterly Futures & Options Expiry', cat: 'Derivatives', impact: 'High 🔴' },
          { date: 'Upcoming', event: 'FOMC Decision & Fed Press Conference', cat: 'Macro', impact: 'High 🔴' }
        ].map((c, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-foreground font-bold">{c.event}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.date} · {c.cat}</p>
            </div>
            <span className="text-xs font-bold text-foreground">{c.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyReportView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Dashboard
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🗞️ Daily Market Briefing & Intelligence Report
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-5 space-y-3 font-sans leading-relaxed text-sm text-foreground">
        <h2 className="text-base font-bold text-foreground font-mono uppercase">Executive Summary</h2>
        <p>
          Global markets continue trading in a disinflationary late-cycle regime. Equities and digital assets remain supported by steady global central bank balance sheet expansion and easing expectations.
        </p>
        <p>
          Key technical levels remain respected across Bitcoin ($82.3K) and Gold ($4,125). Spot exchange balances continue to print multi-year drawdown lows.
        </p>
      </div>
    </div>
  );
}

function OnChainView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Crypto
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          ⛓️ On-Chain Analysis Engine
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {[
          { label: 'Long-Term Holder Supply', val: '14.62M BTC', sub: 'Accumulating' },
          { label: 'Exchange Reserves', val: '2.31M BTC', sub: '6-year low' },
          { label: 'MVRV Z-Score', val: '2.1', sub: 'Mid-cycle valuation' },
          { label: 'Realized Cap', val: '$1.04T', sub: '+1.8% 30d' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{m.val}</p>
            <p className="text-[11px] text-bull mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Account
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🔔 Active Alerts & Telemetry Triggers
        </h1>
      </div>
      <div className="space-y-2 font-mono">
        {[
          { title: 'BTC/USD breaks above $85,000 resistance', status: 'Active', type: 'Price Trigger' },
          { title: 'Perp funding rate exceeds +0.03% (Leverage warning)', status: 'Active', type: 'Funding Alert' },
          { title: 'US CPI print surprise greater than ±0.2pp', status: 'Active', type: 'Macro Alert' }
        ].map((a, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-foreground">{a.title}</p>
              <p className="text-[11px] text-muted-foreground">{a.type}</p>
            </div>
            <span className="text-xs font-bold text-bull">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradingJournalView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Intelligence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          📖 Institutional Trading Journal
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-4 font-mono">
        {[
          { label: 'Total Trades', val: '42' },
          { label: 'Win Rate', val: '69.0%' },
          { label: 'Profit Factor', val: '2.42' },
          { label: 'Net P&L', val: '+$18,450' }
        ].map((m, i) => (
          <div key={i} className="panel rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-bull">{m.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalReportsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wide">
          Intelligence
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-sans">
          🧾 Performance Analytics & Journal Reports
        </h1>
      </div>
      <div className="panel rounded-lg border border-border bg-card p-5 font-mono text-xs space-y-2">
        <p className="text-foreground font-bold">Sharpe Ratio: 1.84 · Max Drawdown: -4.2%</p>
        <p className="text-muted-foreground">System adherence score: 92% across all executed setups.</p>
      </div>
    </div>
  );
}

function AccountPageView({ onOpenAccount }: { onOpenAccount: () => void }) {
  const { user, openAuthModal, logout } = useAuth();

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="border-b border-border pb-4">
        <span className="inline-block rounded bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 font-mono uppercase tracking-wide">
          Account & Security
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground font-['Outfit',sans-serif]">
          👤 Institutional Account & Security
        </h1>
      </div>
      <div className="panel rounded-xl border border-border bg-card p-6 space-y-4">
        {user ? (
          <div className="space-y-3 font-mono text-xs">
            <p className="text-sm text-foreground">Status: <b className="text-emerald-400">Authenticated (Institutional Pro)</b></p>
            <p className="text-foreground">Identity: <b className="text-cyan-400">{user.email || user.phone}</b></p>
            <p className="text-muted-foreground">Provider: {user.provider.toUpperCase()} · Verified: ✅</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={openAuthModal}
                className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-500 transition-colors"
              >
                Account Details
              </button>
              <button
                onClick={logout}
                className="rounded-lg bg-card border border-rose-500/50 px-4 py-2 font-bold text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Tier: <b className="text-cyan-400">Institutional Pro Terminal</b></p>
            <p className="text-xs text-muted-foreground">Sign in to synchronize trading watchlist, risk sizing, and alert webhooks.</p>
            <button
              onClick={openAuthModal}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-bold font-mono text-slate-950 hover:opacity-90 shadow-lg transition-all"
            >
              🔐 Sign In / Authenticate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TerminalApp />
      <AuthModal />
      <OtpNotificationBanner />
    </AuthProvider>
  );
}
