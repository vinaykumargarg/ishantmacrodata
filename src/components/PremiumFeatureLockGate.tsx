import React, { useState } from 'react';
import { Lock, Sparkles, Key, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyAndApplyPassport, activate7DayTrial } from '../services/subscriptionEntitlementService';
import { useAuth } from '../context/AuthContext';

interface PremiumFeatureLockGateProps {
  featureTitle: string;
  featureDescription?: string;
  onNavigateToPricing: () => void;
  onUnlocked?: () => void;
}

export const PremiumFeatureLockGate: React.FC<PremiumFeatureLockGateProps> = ({
  featureTitle,
  featureDescription,
  onNavigateToPricing,
  onUnlocked,
}) => {
  const { user } = useAuth();
  const [passportInput, setPassportInput] = useState('');
  const [showPassportInput, setShowPassportInput] = useState(false);
  const [passportStatus, setPassportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleUnlockPassport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportInput.trim()) return;

    const res = verifyAndApplyPassport(passportInput, user);
    setPassportStatus(res);

    if (res.success) {
      setTimeout(() => {
        if (onUnlocked) onUnlocked();
      }, 800);
    }
  };

  return (
    <div className="relative min-h-[520px] flex items-center justify-center p-4">
      {/* Blurred decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950 to-indigo-950/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] text-center space-y-5 animate-fadeIn">
        {/* Lock Icon Pip */}
        <div className="flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-cyan-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-400 shadow-lg">
            <Lock className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-slate-950 text-[9px] font-bold">
              ★
            </span>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <span className="inline-block rounded-full border border-amber-500/40 bg-amber-950/50 px-3 py-0.5 text-xs font-mono font-bold text-amber-300 uppercase">
            🔒 Institutional Pro Module
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif]">
            {featureTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {featureDescription ||
              'This module requires an active subscription membership to access live algorithmic signals, order flow CVD, and quantitative market models.'}
          </p>
        </div>

        {/* Feature Benefits List */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-left grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">✓</span>
            <span>Multi-Timeframe SMC Signals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">✓</span>
            <span>Order Flow & CVD Microstructure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">✓</span>
            <span>Volume Profile POC / VAH / VAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">✓</span>
            <span>24/7 Telegram Institutional Bot</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* 7-Day Free Trial Button */}
          <button
            onClick={() => {
              activate7DayTrial(user);
              if (onUnlocked) onUnlocked();
            }}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 py-3 text-xs sm:text-sm font-bold font-mono text-slate-950 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>⚡ Start 7-Day Free Trial (100% Free - All Tools Unlocked)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateToPricing}
            className="w-full rounded-xl border border-cyan-500/50 bg-slate-900/90 hover:bg-slate-800/90 py-2.5 text-xs font-bold font-mono text-cyan-300 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Choose Your Trading Plan (from ₹2,999/mo)</span>
          </button>

          {/* Secondary Action: Founder Passport Unlock */}
          {!showPassportInput ? (
            <button
              onClick={() => setShowPassportInput(true)}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Have Founder Passport Key? (Unlock Instantly)</span>
            </button>
          ) : (
            <form onSubmit={handleUnlockPassport} className="space-y-2 pt-2 border-t border-slate-800/80 animate-fade-in">
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  placeholder="Enter Master Passport Key"
                  value={passportInput}
                  onChange={e => setPassportInput(e.target.value)}
                  className="flex-1 rounded-xl border border-amber-500/60 bg-slate-900/90 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2 text-xs font-bold font-mono text-slate-950 transition-all cursor-pointer"
                >
                  Verify Key
                </button>
              </div>

              {passportStatus && (
                <div
                  className={`p-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 ${
                    passportStatus.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {passportStatus.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{passportStatus.message}</span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureLockGate;
