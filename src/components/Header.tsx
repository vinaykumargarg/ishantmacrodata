import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenAccount: () => void;
  onNavigateHome: () => void;
  onNavigatePricing?: () => void;
  onNavigateJarvis?: () => void;
  onNavigateBtcUsdt?: () => void;
  onNavigateLiquiditySweep?: () => void;
  onNavigateDeltaSwing?: () => void;
  onNavigateUsaSwing?: () => void;
  onNavigateEventImpact?: () => void;
  onNavigateOil?: () => void;
  onNavigateDeeeprAi?: () => void;
  onNavigateAiChart?: () => void;
  onNavigateChartAnalyser?: () => void;
  onNavigateInstitutionalChart?: () => void;
  onNavigateMultiAssetEngine?: () => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  onNavigateHome,
  onNavigatePricing,
  onNavigateJarvis,
  onNavigateBtcUsdt,
  onNavigateLiquiditySweep,
  onNavigateDeltaSwing,
  onNavigateUsaSwing,
  onNavigateEventImpact,
  onNavigateOil,
  onNavigateDeeeprAi,
  onNavigateAiChart,
  onNavigateChartAnalyser,
  onNavigateInstitutionalChart,
  onNavigateMultiAssetEngine,
  onSearch,
  onOpenAccount
}) => {
  const { user, openAuthModal, logout } = useAuth();
  const [clockStr, setClockStr] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(
        now.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      {/* ── BRAND LOGO & TITLE (EXACT ORIGINAL BRANDING AS SHOWN IN SCREENSHOTS) ── */}
      <button
        onClick={onNavigateHome}
        className="flex min-w-0 items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none"
        title="Global Macro Command Centre"
      >
        <span className="bg-gradient-brand flex size-8 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground shadow-glow shrink-0">
          ⚡
        </span>
        <span className="block min-w-0">
          <span className="text-gradient block truncate text-sm font-semibold leading-tight">
            Ishant Jakhenia
          </span>
          <span className="label-xs block truncate">
            Global Macro Command Centre
          </span>
        </span>
      </button>

      {/* ── SEARCH INPUT ── */}
      <div className="hidden md:flex flex-1 max-w-sm mx-2 items-center relative">
        <input
          value={searchVal}
          onChange={handleSearchChange}
          placeholder="Search indicators, assets, events, central banks…"
          className="w-full rounded-md border border-border bg-card/70 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
        />
      </div>

      {/* ── RIGHT CONTROLS (EXACT ORIGINAL STATUS, CLOCK, THEME, LOGIN) ── */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Monospace UTC clock */}
        <span className="label-xs hidden xl:inline text-muted-foreground num">
          {clockStr}
        </span>

        {/* Live indicator chip */}
        <span className="label-xs hidden items-center gap-1.5 rounded-full border border-bull/30 bg-bull/10 px-2 py-1 text-bull sm:flex">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-bull"></span>
          Live · 30s
        </span>
        <span className="flex size-2 animate-pulse-dot rounded-full bg-bull sm:hidden"></span>

        {/* Delta 4H Swing Scanner Launcher */}
        {onNavigateDeltaSwing && (
          <button
            onClick={onNavigateDeltaSwing}
            className="rounded-md border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-amber-500/30"
            title="Open Delta Exchange All-Coin 4H Swing Scanner"
          >
            <span>⚡</span>
            <span className="hidden xl:inline">Delta 4H Swing</span>
          </button>
        )}

        {/* USA Stock Scanner Launcher */}
        {onNavigateUsaSwing && (
          <button
            onClick={onNavigateUsaSwing}
            className="rounded-md border border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-2.5 py-1.5 text-xs font-bold text-blue-400 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-blue-500/30"
            title="Open USA Stocks 4H Swing & Investment Scanner"
          >
            <span>🇺🇸</span>
            <span className="hidden xl:inline">USA Stocks</span>
          </button>
        )}

        {/* Event Impact Engine Launcher */}
        {onNavigateEventImpact && (
          <button
            onClick={onNavigateEventImpact}
            className="rounded-md border border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2.5 py-1.5 text-xs font-bold text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-purple-500/30"
            title="Open Market News & Event Impact Engine"
          >
            <span>🌍</span>
            <span className="hidden xl:inline">Event Impact</span>
          </button>
        )}

        {/* Liquidity Sweep Pro Launcher */}
        {onNavigateLiquiditySweep && (
          <button
            onClick={onNavigateLiquiditySweep}
            className="rounded-md border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-cyan-500/30"
            title="Open Advanced Liquidity Sweep & Liquidation Map (Pro System)"
          >
            <span>🌊</span>
            <span className="hidden lg:inline">Liquidity Sweep Pro</span>
          </button>
        )}

        {/* Oil Intelligence Terminal Launcher */}
        {onNavigateOil && (
          <button
            onClick={onNavigateOil}
            className="rounded-md border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-amber-500/30"
            title="Open Institutional Crude Oil Intelligence & Trading Terminal"
          >
            <span>🛢️</span>
            <span className="hidden md:inline">Oil AI</span>
          </button>
        )}

        {/* BTC-USDT Momentum Predictor Launcher */}
        {onNavigateBtcUsdt && (
          <button
            onClick={onNavigateBtcUsdt}
            className="rounded-md border border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-emerald-500/30"
            title="Open Advanced BTC–USDT Relationship & Momentum Prediction Engine"
          >
            <span className="animate-spin-slow">🔄</span>
            <span className="hidden md:inline">BTC–USDT Engine</span>
          </button>
        )}

        {/* Jarvis Voice AI Launcher */}
        {onNavigateJarvis && (
          <button
            onClick={onNavigateJarvis}
            className="rounded-md border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-400 hover:from-cyan-500/30 hover:to-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-cyan-500/30"
            title="Open JARVIS AI Market Voice Assistant"
          >
            <span className="animate-pulse">🎙️</span>
            <span className="hidden sm:inline">Jarvis Voice AI</span>
          </button>
        )}

        {/* Institutional Multi-Asset Engine Launcher */}
        {onNavigateMultiAssetEngine && (
          <button
            onClick={onNavigateMultiAssetEngine}
            className="rounded-md border border-cyan-400/80 bg-gradient-to-r from-cyan-500/30 via-indigo-600/30 to-purple-600/30 px-2.5 py-1.5 text-xs font-black text-cyan-200 hover:brightness-125 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.45)] ring-1 ring-cyan-400/60"
            title="Open Institutional Multi-Asset Analysis Engine (BTC, ETH, Gold, Crude Oil) — 7-Pillar Decision Support System"
          >
            <span className="animate-pulse">🌐</span>
            <span className="hidden sm:inline">Multi-Asset Engine ⭐</span>
          </button>
        )}

        {/* Advanced Institutional All-in-One Chart Launcher */}
        {onNavigateInstitutionalChart && (
          <button
            onClick={onNavigateInstitutionalChart}
            className="rounded-md border border-cyan-400/70 bg-gradient-to-r from-cyan-500/30 via-teal-500/30 to-indigo-500/30 px-2.5 py-1.5 text-xs font-black text-cyan-200 hover:brightness-125 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50"
            title="Open Advanced All-in-One Institutional Trading Chart (SMC + ICT + Order Flow + Liquidity + Volume Profile)"
          >
            <span className="animate-pulse">🏛️</span>
            <span className="hidden sm:inline">Institutional Chart ⭐</span>
          </button>
        )}

        {/* Deeepr.AI Market Structure Terminal Launcher */}
        {onNavigateDeeeprAi && (
          <button
            onClick={onNavigateDeeeprAi}
            className="rounded-md border border-cyan-500/60 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-indigo-600/30 px-2.5 py-1.5 text-xs font-black text-cyan-300 hover:brightness-125 transition-all cursor-pointer flex items-center gap-1.5 shadow-md ring-1 ring-cyan-500/40"
            title="Open DEEEPR.AI™ Market Structure & Key Levels Terminal (BTC, ETH, SOL, GOLD, SILVER)"
          >
            <span className="animate-pulse">🔮</span>
            <span className="hidden sm:inline">Deeepr.AI Chart ⭐</span>
          </button>
        )}

        {/* AI Sniper Chart (Long / Short / Wait) Launcher */}
        {onNavigateAiChart && (
          <button
            onClick={onNavigateAiChart}
            className="rounded-md border border-rose-500/60 bg-gradient-to-r from-rose-600/30 via-red-600/30 to-amber-600/30 px-2.5 py-1.5 text-xs font-black text-rose-300 hover:brightness-125 transition-all cursor-pointer flex items-center gap-1.5 shadow-md ring-1 ring-rose-500/40"
            title="Open AI Chart — Long / Short / Wait (11-Factor Confluence & Liquidation Clusters)"
          >
            <span className="animate-pulse">📈</span>
            <span className="hidden sm:inline">AI Chart Long/Short 🎯</span>
          </button>
        )}

        {/* Market Chart AI Analyzer Launcher */}
        {onNavigateChartAnalyser && (
          <button
            onClick={onNavigateChartAnalyser}
            className="rounded-md border border-purple-500/60 bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-pink-600/30 px-2.5 py-1.5 text-xs font-black text-purple-300 hover:brightness-125 transition-all cursor-pointer flex items-center gap-1.5 shadow-md ring-1 ring-purple-500/40"
            title="Open Market Chart AI Analyzer (A-to-Z Read & Deep Scanner)"
          >
            <span className="animate-pulse">🔬</span>
            <span className="hidden sm:inline">AI Chart Analyse ⭐</span>
          </button>
        )}

        {/* Upgrade / Pricing Button */}
        {onNavigatePricing && (
          <button
            onClick={onNavigatePricing}
            className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            title="Institutional Membership & Pricing"
          >
            <span>💎</span>
            <span className="hidden sm:inline">Upgrade (₹)</span>
          </button>
        )}

        {/* Light / Dark Mode Button */}
        <button
          onClick={onToggleTheme}
          aria-label="Light / dark mode"
          className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary cursor-pointer"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* Auth / Account Button */}
        {user ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenAccount}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>👤</span>
              <span className="truncate max-w-[100px]">
                {user.name || user.email?.split('@')[0] || 'Account'}
              </span>
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="bg-gradient-brand rounded-md px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer shadow-glow"
          >
            🔐 Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
