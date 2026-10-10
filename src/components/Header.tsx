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
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  onNavigateHome,
  onNavigatePricing,
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
      {/* ── BRAND LOGO & TITLE (EXACT LOVABLE BRANDING) ── */}
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

      {/* ── RIGHT CONTROLS (EXACT LOVABLE STATUS, CLOCK, THEME, LOGIN) ── */}
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
