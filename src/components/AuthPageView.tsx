import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordResetEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../lib/supabaseClient';
import { activate7DayTrial } from '../services/subscriptionEntitlementService';

interface CountryCodeOption {
  code: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', name: 'UAE (Dubai)', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
];

export const AuthPageView: React.FC<{ onNavigateToTerminal?: () => void }> = ({ onNavigateToTerminal }) => {
  const {
    user,
    logout,
    showOtpToast,
  } = useAuth();

  // Mode: 'SIGNUP' | 'LOGIN_EMAIL' | 'LOGIN_PHONE' | 'VERIFY_OTP' | 'FORGOT'
  const [viewMode, setViewMode] = useState<'SIGNUP' | 'LOGIN_EMAIL' | 'LOGIN_PHONE' | 'VERIFY_OTP' | 'FORGOT'>('SIGNUP');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingPurpose, setPendingPurpose] = useState<'SIGNUP' | 'LOGIN'>('SIGNUP');

  // Status & Loaders
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Handle Signup Submit -> Send Verification Code
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters with letters, numbers & symbols.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp mobile number.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Use and Privacy Policy.');
      return;
    }

    setLoading(true);
    const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
    setPendingPhone(fullPhone);
    setPendingPurpose('SIGNUP');

    const otpRes = await sendPhoneOtp(fullPhone);
    setLoading(false);

    if (otpRes.success) {
      setViewMode('VERIFY_OTP');
      setOtpCountdown(60);
      setSuccessMessage(`Verification code dispatched to ${fullPhone}.`);
      if (otpRes.data?.simulatedCode) {
        showOtpToast(fullPhone, otpRes.data.simulatedCode, 60);
      }
    } else {
      setErrorMessage(otpRes.error || 'Failed to dispatch verification code.');
    }
  };

  // Handle Login with Email
  const handleLoginEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setLoading(true);
    const res = await signInWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Welcome back! Successfully authenticated.');
      if (onNavigateToTerminal) onNavigateToTerminal();
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
  };

  // Handle Login with Phone -> Send Code
  const handleLoginPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter your 10-digit registered mobile number.');
      return;
    }

    setLoading(true);
    const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
    setPendingPhone(fullPhone);
    setPendingPurpose('LOGIN');

    const res = await sendPhoneOtp(fullPhone);
    setLoading(false);

    if (res.success) {
      setViewMode('VERIFY_OTP');
      setOtpCountdown(60);
      setSuccessMessage(`Verification code sent to ${fullPhone}.`);
      if (res.data?.simulatedCode) {
        showOtpToast(fullPhone, res.data.simulatedCode, 60);
      }
    } else {
      setErrorMessage(res.error || 'Failed to send verification code.');
    }
  };

  // Handle OTP Verification
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    if (pendingPurpose === 'SIGNUP') {
      const signupRes = await signUpWithEmail(email, password, name);
      if (!signupRes.success) {
        setLoading(false);
        setErrorMessage(signupRes.error || 'Registration failed.');
        return;
      }

      const verifyRes = await verifyPhoneOtp(pendingPhone, otpCode, signupRes.data?.user);
      setLoading(false);

      if (verifyRes.success) {
        // Activate 7-Day Free Unlimited Trial automatically
        activate7DayTrial(verifyRes.data?.user);
        setSuccessMessage('Account verified! 7-Day Free Unlimited Trial activated successfully.');
        if (onNavigateToTerminal) onNavigateToTerminal();
      } else {
        setErrorMessage(verifyRes.error || 'Invalid verification code.');
      }
    } else {
      const verifyRes = await verifyPhoneOtp(pendingPhone, otpCode);
      setLoading(false);

      if (verifyRes.success) {
        setSuccessMessage('Welcome back! Successfully authenticated.');
        if (onNavigateToTerminal) onNavigateToTerminal();
      } else {
        setErrorMessage(verifyRes.error || 'Invalid verification code.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.success) {
      activate7DayTrial(res.data?.user);
      if (onNavigateToTerminal) onNavigateToTerminal();
    } else {
      setErrorMessage(res.error || 'Google login failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-3 sm:px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-[460px] rounded-3xl border border-[#262c3e] bg-[#141823] p-6 sm:p-8 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-5">
        {/* Status Alerts */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. VIEW: CREATE YOUR ACCOUNT */}
        {viewMode === 'SIGNUP' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight font-['Outfit',sans-serif]">
                Create your account
              </h2>
              <p className="text-xs text-slate-300">
                Choose your plan after signup. Start with 7-Day Free Unlimited Trial.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we greet you?"
                className="w-full rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ chars with letters, numbers & symbols"
                  className="w-full rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 pr-11 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                WHATSAPP MOBILE NUMBER
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 rounded-xl border border-[#2d3648] bg-[#1d2331] px-2.5 py-3 text-sm text-center text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="flex-1 rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Must have WhatsApp. We'll send a code to verify it.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                REFERRAL CODE (OPTIONAL)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. 9YTPU5"
                className="w-full rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all uppercase"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="page_terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="page_terms" className="text-xs text-slate-300 cursor-pointer leading-tight">
                I agree to the <span className="text-cyan-400 hover:underline">Terms of Use</span> and <span className="text-cyan-400 hover:underline">Privacy Policy</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white hover:bg-slate-100 py-3.5 px-6 text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <span>SEND VERIFICATION CODE</span>}
            </button>

            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              We'll also email you a verification link to unlock all features.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 rounded-full border border-[#2d3648] bg-[#1d2331] hover:bg-[#252c3e] py-2.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-slate-300">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setViewMode('LOGIN_EMAIL')}
                className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Log in
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-center text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-center gap-3">
                <span>Terms</span>
                <span>·</span>
                <span>Privacy</span>
                <span>·</span>
                <span>Refund</span>
              </div>
              <div>© 2026 Deeepr.ai. All rights reserved.</div>
              <div className="tracking-widest uppercase text-[9px]">Examine · Evaluate · Execute.</div>
            </div>
          </form>
        )}

        {/* 2. VIEW: WELCOME BACK (EMAIL) */}
        {viewMode === 'LOGIN_EMAIL' && (
          <form onSubmit={handleLoginEmailSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight font-['Outfit',sans-serif]">
                Welcome back
              </h2>
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                Examine · Evaluate · Execute.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 pr-11 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('FORGOT')}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white hover:bg-slate-100 py-3.5 px-6 text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <span>LOG IN</span>}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setViewMode('LOGIN_PHONE')}
                className="text-xs text-slate-300 hover:text-cyan-400 cursor-pointer"
              >
                Log in with your phone number instead
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-slate-300">
              New here?{' '}
              <button
                type="button"
                onClick={() => setViewMode('SIGNUP')}
                className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Create an account
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-center text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-center gap-3">
                <span>Terms</span>
                <span>·</span>
                <span>Privacy</span>
                <span>·</span>
                <span>Refund</span>
              </div>
              <div>© 2026 Deeepr.ai. All rights reserved.</div>
              <div className="tracking-widest uppercase text-[9px]">Examine · Evaluate · Execute.</div>
            </div>
          </form>
        )}

        {/* 3. VIEW: WELCOME BACK (PHONE) */}
        {viewMode === 'LOGIN_PHONE' && (
          <form onSubmit={handleLoginPhoneSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight font-['Outfit',sans-serif]">
                Welcome back
              </h2>
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                Examine · Evaluate · Execute.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                WHATSAPP MOBILE NUMBER
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 rounded-xl border border-[#2d3648] bg-[#1d2331] px-2.5 py-3 text-sm text-center text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="flex-1 rounded-xl border border-[#2d3648] bg-[#1d2331] px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Use the number you verified when you signed up.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white hover:bg-slate-100 py-3.5 px-6 text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <span>SEND CODE</span>}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setViewMode('LOGIN_EMAIL')}
                className="text-xs text-slate-300 hover:text-cyan-400 cursor-pointer"
              >
                Log in with email instead
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-slate-300">
              New here?{' '}
              <button
                type="button"
                onClick={() => setViewMode('SIGNUP')}
                className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Create an account
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-center text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-center gap-3">
                <span>Terms</span>
                <span>·</span>
                <span>Privacy</span>
                <span>·</span>
                <span>Refund</span>
              </div>
              <div>© 2026 Deeepr.ai. All rights reserved.</div>
              <div className="tracking-widest uppercase text-[9px]">Examine · Evaluate · Execute.</div>
            </div>
          </form>
        )}

        {/* 4. VIEW: VERIFY OTP */}
        {viewMode === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight font-['Outfit',sans-serif]">
                Verify code
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter the 6-digit code sent to your WhatsApp number <strong className="text-cyan-400 font-mono">{pendingPhone}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                6-DIGIT VERIFICATION CODE
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full rounded-xl border border-cyan-500/60 bg-[#1d2331] px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-cyan-300 focus:border-cyan-400 focus:bg-[#202738] focus:outline-none transition-all"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>{otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Code expired?'}</span>
              {otpCountdown === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    sendPhoneOtp(pendingPhone).then((res) => {
                      setOtpCountdown(60);
                      if (res.data?.simulatedCode) {
                        showOtpToast(pendingPhone, res.data.simulatedCode, 60);
                      }
                    });
                  }}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Resend code
                </button>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full rounded-full bg-white hover:bg-slate-100 py-3.5 px-6 text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <span>{pendingPurpose === 'SIGNUP' ? 'VERIFY & START 7-DAY TRIAL' : 'CONFIRM & LOG IN'}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPageView;
