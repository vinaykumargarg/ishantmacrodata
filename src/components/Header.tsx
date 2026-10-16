import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ChevronDown, Sparkles, CreditCard, Bell, Settings, ShieldCheck } from 'lucide-react';

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
  onOpenProfile?: () => void;
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
  onOpenProfile,
  onSearch,
  onOpenAccount
}) => {
  const { user, openAuthModal, logout } = useAuth();
  const [clockStr, setClockStr] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

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

        {/* Subscription / Pricing Button */}
        {onNavigatePricing && (
          <button
            onClick={onNavigatePricing}
            className="rounded-md border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-cyan-500/30"
            title="Institutional Membership & Subscription Plans"
          >
            <span>💎</span>
            <span>Subscription</span>
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

        {/* Auth / Account Buttons & User Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="rounded-lg border border-slate-700 bg-slate-900/90 hover:border-cyan-500/50 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              title="Open User Profile & Account Menu"
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
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-slate-900" />
              </div>

              <span className="truncate max-w-[90px] sm:max-w-[120px] font-mono text-xs">
                {user.name || user.email?.split('@')[0]}
              </span>

              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl z-50 animate-slideDown font-['Plus_Jakarta_Sans',sans-serif] text-xs"
                onClick={() => setIsUserMenuOpen(false)}
              >
                {/* User Info Header */}
                <div className="p-2 border-b border-slate-800 space-y-0.5">
                  <div className="font-bold text-white font-mono truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {user.email || user.phone}
                  </div>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/40">
                      {user.subscriptionTier}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Verified ✓</span>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      if (onOpenProfile) onOpenProfile();
                      else openAuthModal('PROFILE');
                    }}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-2 cursor-pointer font-mono"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={onOpenAccount}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-2 cursor-pointer font-mono"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Account & Security</span>
                  </button>

                  {onNavigatePricing && (
                    <button
                      onClick={onNavigatePricing}
                      className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-2 cursor-pointer font-mono"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Subscription (₹)</span>
                    </button>
                  )}
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={logout}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors flex items-center gap-2 cursor-pointer font-mono font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Login Button */}
            <button
              onClick={() => openAuthModal('LOGIN')}
              className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              title="Sign in to your institutional account"
            >
              <span>🔐</span>
              <span>Login</span>
            </button>

            {/* Sign Up Button */}
            <button
              onClick={() => openAuthModal('SIGNUP')}
              className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-slate-950 hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center gap-1 font-mono"
              title="Create new institutional account"
            >
              <span>✨</span>
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
