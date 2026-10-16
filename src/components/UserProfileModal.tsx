import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Key,
  ExternalLink,
  CreditCard,
  Bell,
  LogOut,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendPhoneOtp, verifyPhoneOtp } from '../lib/supabaseClient';
import { BrandLogo } from './BrandLogo';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigatePricing?: () => void;
  onNavigateAlerts?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigatePricing,
  onNavigateAlerts,
}) => {
  const { user, logout, updateUserProfile, showOtpToast } = useAuth();

  // Phone linking mini-flow
  const [showPhoneLinkInput, setShowPhoneLinkInput] = useState(false);
  const [linkPhoneCountry, setLinkPhoneCountry] = useState('+91');
  const [linkPhoneNumber, setLinkPhoneNumber] = useState('');
  const [linkOtpCode, setLinkOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const isGoogleLinked = user.linkedProviders.includes('google') || user.provider === 'google';
  const isEmailLinked = Boolean(user.email && (user.linkedProviders.includes('email') || user.provider === 'email'));
  const isPhoneLinked = Boolean(user.phone && (user.linkedProviders.includes('phone') || user.provider === 'phone'));

  const memberSinceStr = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Oct 2026';

  const lastLoginStr = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' IST'
    : 'Just now';

  // Handle Send OTP for linking phone
  const handleSendLinkOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPhoneNumber.trim()) {
      setPhoneError('Please enter your 10-digit mobile number.');
      return;
    }
    const full = `${linkPhoneCountry}${linkPhoneNumber.replace(/\D/g, '')}`;
    setLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    const res = await sendPhoneOtp(full);
    setLoading(false);

    if (res.success) {
      setIsOtpSent(true);
      setOtpCountdown(60);
      setPhoneSuccess(`Verification code dispatched to ${full}.`);
      if (res.data?.simulatedCode) {
        showOtpToast(full, res.data.simulatedCode, 60);
      }
    } else {
      setPhoneError(res.error || 'Failed to dispatch OTP.');
    }
  };

  // Handle Verify OTP for linking phone
  const handleVerifyLinkOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkOtpCode.length !== 6) {
      setPhoneError('Please enter the 6-digit code.');
      return;
    }
    const full = `${linkPhoneCountry}${linkPhoneNumber.replace(/\D/g, '')}`;
    setLoading(true);
    setPhoneError(null);

    const res = await verifyPhoneOtp(full, linkOtpCode, user);
    setLoading(false);

    if (res.success && res.data?.user) {
      updateUserProfile(res.data.user);
      setPhoneSuccess('Phone number linked successfully to your account!');
      setShowPhoneLinkInput(false);
      setIsOtpSent(false);
    } else {
      setPhoneError(res.error || 'Invalid OTP code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-gradient-to-b from-[#0c1426] via-[#080d1a] to-[#040710] p-5 sm:p-7 shadow-[0_0_50px_rgba(0,212,255,0.15)] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Close profile modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── HEADER RIBBON ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-cyan-400/80 shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 text-2xl font-black font-mono shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold border-2 border-slate-900 shadow">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit',sans-serif]">
                  {user.name}
                </h2>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/40 uppercase">
                  {user.subscriptionTier}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user.email || user.phone || 'Institutional Trader'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onNavigatePricing) onNavigatePricing();
              }}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-slate-950 font-mono hover:opacity-95 shadow cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manage Plan</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 font-mono hover:bg-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── 2-COLUMN PROFILE DECK ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Left Column: Account Details & Status */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 font-mono text-xs">
              <h3 className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Account Credentials & Metadata</span>
              </h3>

              <div className="divide-y divide-slate-800/80 text-[11px] space-y-2 pt-1">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[170px]" title={user.id}>
                    {user.id}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Member Since:</span>
                  <span className="text-slate-200">{memberSinceStr}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Last Session:</span>
                  <span className="text-slate-200">{lastLoginStr}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Account Role:</span>
                  <span className="text-cyan-400 font-bold uppercase">{user.role}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Subscription Status:</span>
                  <span className="text-emerald-400 font-bold">
                    {user.subscriptionTier} ({user.subscriptionStatus})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  if (onNavigatePricing) onNavigatePricing();
                }}
                className="rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 p-2.5 text-left transition-colors cursor-pointer flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white font-mono">Subscription</div>
                  <div className="text-[10px] text-slate-400">View active plan</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onNavigateAlerts) onNavigateAlerts();
                }}
                className="rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 p-2.5 text-left transition-colors cursor-pointer flex items-center gap-2"
              >
                <Bell className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white font-mono">Alerts Radar</div>
                  <div className="text-[10px] text-slate-400">Telegram triggers</div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Linked Identities & Multi-Auth */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 font-mono text-xs">
              <h3 className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Linked Authentication Identities</span>
              </h3>

              {/* 1. Google Identity */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌐</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Google Identity</div>
                    <div className="text-[10px] text-slate-400">
                      {isGoogleLinked ? user.email || 'Connected' : 'Not linked'}
                    </div>
                  </div>
                </div>
                {isGoogleLinked ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                    Connected ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Available</span>
                )}
              </div>

              {/* 2. Email Address */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-bold text-white text-[11px]">Email Verification</div>
                    <div className="text-[10px] text-slate-400">
                      {user.email || 'No email associated'}
                    </div>
                  </div>
                </div>
                {isEmailLinked ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                    Verified ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400">Pending</span>
                )}
              </div>

              {/* 3. Mobile Phone */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white text-[11px]">Mobile Phone OTP</div>
                      <div className="text-[10px] text-slate-400">
                        {user.phone ? user.phone : 'No phone linked'}
                      </div>
                    </div>
                  </div>
                  {isPhoneLinked ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                      Linked ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowPhoneLinkInput(!showPhoneLinkInput)}
                      className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold hover:bg-indigo-600/50 transition-colors cursor-pointer"
                    >
                      {showPhoneLinkInput ? 'Cancel' : '+ Link Phone'}
                    </button>
                  )}
                </div>

                {/* Inline Phone Link Form if not linked */}
                {showPhoneLinkInput && !isPhoneLinked && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    {!isOtpSent ? (
                      <form onSubmit={handleSendLinkOtp} className="space-y-2">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={linkPhoneCountry}
                            onChange={e => setLinkPhoneCountry(e.target.value)}
                            className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-center font-mono"
                          />
                          <input
                            type="tel"
                            placeholder="9876543210"
                            value={linkPhoneNumber}
                            onChange={e => setLinkPhoneNumber(e.target.value)}
                            className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] font-mono text-white placeholder-slate-500 focus:border-cyan-400"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full rounded bg-cyan-600 hover:bg-cyan-500 py-1 text-[11px] font-bold text-slate-950 font-mono transition-colors"
                        >
                          {loading ? 'Sending OTP...' : 'Send SMS OTP'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyLinkOtp} className="space-y-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit OTP code"
                          value={linkOtpCode}
                          onChange={e => setLinkOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded bg-slate-900 border border-cyan-500/60 px-3 py-1.5 text-xs text-center font-mono tracking-widest text-cyan-300"
                        />
                        <button
                          type="submit"
                          disabled={loading || linkOtpCode.length !== 6}
                          className="w-full rounded bg-emerald-500 hover:bg-emerald-400 py-1 text-[11px] font-bold text-slate-950 font-mono transition-colors"
                        >
                          {loading ? 'Verifying...' : 'Confirm & Link'}
                        </button>
                      </form>
                    )}

                    {phoneError && <p className="text-[10px] text-rose-400 font-mono">{phoneError}</p>}
                    {phoneSuccess && <p className="text-[10px] text-emerald-400 font-mono">{phoneSuccess}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECURITY PROTOCOL FOOTER ── */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted Session: Active</span>
          </span>
          <button
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1 text-slate-300 font-bold transition-colors cursor-pointer"
          >
            Close Deck
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
