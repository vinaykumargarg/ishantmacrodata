import React, { useState, useEffect } from 'react';
import { Lock, Mail, Phone, CheckCircle2, AlertCircle, RefreshCw, Shield, ArrowRight, LineChart, Cpu, Globe, Zap, Settings, Database, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordResetEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../lib/supabaseClient';
import { BrandLogo } from './BrandLogo';

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
    isBackendConnected,
    saveBackendCredentials,
    supabaseUrl: currentUrl,
  } = useAuth();

  // Active Method: 'GOOGLE' | 'EMAIL' | 'PHONE'
  const [authMethod, setAuthMethod] = useState<'GOOGLE' | 'EMAIL' | 'PHONE'>('GOOGLE');
  const [emailMode, setEmailMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');

  // Form State: Email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Form State: Phone OTP
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Status & UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-page Supabase Backend setup state
  const [showBackendSetup, setShowBackendSetup] = useState(false);
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [authMethod, emailMode]);

  // Google OAuth Flow
  const handleGoogleSignIn = async () => {
    if (!isBackendConnected) {
      setErrorMessage('Please connect your Supabase project keys before initiating Google OAuth.');
      setShowBackendSetup(true);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await signInWithGoogle();
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Google authentication encountered an error.');
    }
  };

  // Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBackendConnected) {
      setErrorMessage('Please connect your Supabase project keys before authenticating.');
      setShowBackendSetup(true);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (emailMode === 'FORGOT') {
      const res = await sendPasswordResetEmail(email);
      setLoading(false);
      if (res.success) {
        setSuccessMessage(res.message || 'Password reset link sent to your email.');
      } else {
        setErrorMessage(res.error || 'Failed to send reset email.');
      }
      return;
    }

    if (emailMode === 'SIGNUP') {
      const res = await signUpWithEmail(email, password, fullName);
      setLoading(false);
      if (res.success) {
        setSuccessMessage(res.message || 'Verification email sent. Please check your inbox.');
        if (res.data?.user && !res.data.emailConfirmationRequired && onNavigateToTerminal) {
          setTimeout(onNavigateToTerminal, 600);
        }
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
      return;
    }

    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (res.success && res.data?.user) {
      setSuccessMessage('Welcome back to Ishant Macro Data.');
      if (onNavigateToTerminal) setTimeout(onNavigateToTerminal, 600);
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
  };

  // Phone OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    if (!isBackendConnected) {
      setErrorMessage('Please connect your Supabase project keys before requesting SMS OTP.');
      setShowBackendSetup(true);
      return;
    }

    const fullPhone = `${selectedCountryCode}${phoneNumber.replace(/\D/g, '')}`;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await sendPhoneOtp(fullPhone);
    setLoading(false);

    if (res.success) {
      setIsOtpSent(true);
      setOtpCountdown(res.data?.retryAfterSeconds || 60);
      setSuccessMessage(res.message || 'Real SMS OTP dispatched to your mobile phone.');
    } else {
      setErrorMessage(res.error || 'Failed to dispatch SMS OTP. Please check your Supabase SMS setup.');
    }
  };

  // Phone OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code received via SMS.');
      return;
    }

    const fullPhone = `${selectedCountryCode}${phoneNumber.replace(/\D/g, '')}`;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await verifyPhoneOtp(fullPhone, otpCode);
    setLoading(false);

    if (res.success && res.data?.user) {
      setSuccessMessage('Mobile phone authenticated successfully!');
      if (onNavigateToTerminal) setTimeout(onNavigateToTerminal, 600);
    } else {
      setErrorMessage(res.error || 'Invalid or expired OTP code entered.');
    }
  };

  const handleSaveBackendKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.startsWith('https://')) {
      setErrorMessage('Supabase URL must start with https://');
      return;
    }
    if (!inputKey || inputKey.length < 20) {
      setErrorMessage('Please enter a valid Supabase anon public key.');
      return;
    }
    const ok = saveBackendCredentials(inputUrl, inputKey);
    if (ok) {
      setSuccessMessage('Connected to Supabase project! Reloading...');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: BRAND SHOWCASE & INSTITUTIONAL PILLARS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <BrandLogo size={64} showText={false} />

            <div className="pt-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Outfit',sans-serif] tracking-tight uppercase leading-none flex items-center gap-2 flex-wrap">
                <span>ISHANT</span>
                <span className="text-slate-100 font-black">MACRO DATA</span>
                <span className="text-xl sm:text-2xl font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-400/40">
                  AI
                </span>
              </h1>
              <p className="mt-3 text-base sm:text-lg text-slate-300 font-medium">
                “See the Flow. Read the Market. Trade with Clarity.”
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-lg leading-relaxed">
                World-class institutional market intelligence, quantitative order flow, and cross-market confluence for Bitcoin, Gold, Crypto, US Stocks, and Indian Stocks.
              </p>
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              {
                icon: <LineChart className="w-4 h-4 text-cyan-400" />,
                title: 'Order Flow Footprint',
                desc: 'Tick-level CVD, footprint imbalances, and resting DOM depth walls.',
              },
              {
                icon: <Cpu className="w-4 h-4 text-emerald-400" />,
                title: 'Ultra AI Decision V2',
                desc: '16-factor institutional engine for BTC, Gold (XAU), and XAUT.',
              },
              {
                icon: <Globe className="w-4 h-4 text-purple-400" />,
                title: 'Cross-Market Macro',
                desc: 'DXY, US 10Y real yields, Fed expectations, and CPI surprises.',
              },
              {
                icon: <Zap className="w-4 h-4 text-amber-400" />,
                title: 'Global Multi-Asset',
                desc: 'US Tech Equities, NIFTY 100, and Spot ETF Institutional Flows.',
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-800 bg-[#090e1c]/80 backdrop-blur-md space-y-1 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-black border border-slate-800">{feat.icon}</span>
                  <h2 className="text-xs font-bold text-white font-['Outfit',sans-serif]">{feat.title}</h2>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{feat.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              {isBackendConnected ? 'Supabase Authentication Connected' : 'Backend Configuration Required'}
            </span>
            <span>·</span>
            <span>256-bit AES Encryption</span>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL AUTH GATEWAY */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-[#0c1426] via-[#080d1a] to-[#040710] p-6 sm:p-8 shadow-[0_0_60px_rgba(0,212,255,0.15)] relative overflow-hidden backdrop-blur-xl">
            <div className="text-center space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-mono border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                SECURE AUTHENTICATION GATEWAY
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit',sans-serif] tracking-wide">
                Institutional Terminal Access
              </h2>
              <p className="text-xs text-slate-400">
                Sign in to synchronize trading parameters and institutional alerts
              </p>
            </div>

            {/* Missing Backend Keys Notice */}
            {!isBackendConnected && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/50 text-xs text-amber-200 space-y-2 font-mono">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Supabase Backend Required</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBackendSetup(!showBackendSetup)}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-extrabold hover:bg-amber-400"
                  >
                    {showBackendSetup ? 'Hide Setup' : 'Connect Keys'}
                  </button>
                </div>
                <p className="text-[11px] text-amber-200/90 font-sans leading-tight">
                  Real authentication requires Supabase backend credentials. Please provide your Supabase URL & Key.
                </p>
              </div>
            )}

            {/* In-page Setup Form */}
            {showBackendSetup && (
              <form onSubmit={handleSaveBackendKeys} className="mb-4 p-4 rounded-xl bg-[#060a14] border border-cyan-500/40 space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Connect Live Supabase Project</span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Project URL</label>
                  <input
                    type="url"
                    required
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-[#0a0f1d] px-2.5 py-1.5 rounded-lg border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Anon Public Key</label>
                  <input
                    type="password"
                    required
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-[#0a0f1d] px-2.5 py-1.5 rounded-lg border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
                  >
                    Save & Connect Backend
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBackendSetup(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {user ? (
              <div className="space-y-4 py-4 text-center font-mono">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Active Session: Logged In</h3>
                  <p className="text-xs text-emerald-400 font-bold mt-1">
                    {user.email || user.phone}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Provider: <b className="text-cyan-400 uppercase">{user.provider}</b>
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex gap-3">
                  {onNavigateToTerminal && (
                    <button
                      onClick={onNavigateToTerminal}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-sans transition-colors"
                    >
                      Open AI Trading Terminal
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 border border-rose-500/40 hover:bg-rose-950/30 text-rose-400 text-xs font-sans transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1.5 bg-[#050811] p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setAuthMethod('GOOGLE')}
                    className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                      authMethod === 'GOOGLE'
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🌐</span> Google
                  </button>
                  <button
                    onClick={() => setAuthMethod('EMAIL')}
                    className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                      authMethod === 'EMAIL'
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    onClick={() => setAuthMethod('PHONE')}
                    className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                      authMethod === 'PHONE'
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone OTP
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* METHOD 1: GOOGLE */}
                {authMethod === 'GOOGLE' && (
                  <div className="space-y-4 py-2">
                    <p className="text-xs text-slate-300 leading-relaxed text-center">
                      Authenticate through official Google OAuth. Redirects to Google's genuine consent screen.
                    </p>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-white/5 active:scale-[0.99] disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>Continue with Google</span>
                    </button>
                  </div>
                )}

                {/* METHOD 2: EMAIL */}
                {authMethod === 'EMAIL' && (
                  <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEmailMode('LOGIN')}
                          className={`font-bold transition-colors ${
                            emailMode === 'LOGIN' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-slate-400'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailMode('SIGNUP')}
                          className={`font-bold transition-colors ${
                            emailMode === 'SIGNUP' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-slate-400'
                          }`}
                        >
                          Create Account
                        </button>
                      </div>
                      {emailMode !== 'FORGOT' && (
                        <button
                          type="button"
                          onClick={() => setEmailMode('FORGOT')}
                          className="text-[11px] text-slate-500 hover:text-cyan-300 transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>

                    {emailMode === 'SIGNUP' && (
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ishant Jakhenia"
                          className="w-full bg-[#070c18] text-white px-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs font-sans"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Institutional Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="trader@ishantmacro.com"
                          className="w-full bg-[#070c18] text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs font-mono"
                        />
                      </div>
                    </div>

                    {emailMode !== 'FORGOT' && (
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[#070c18] text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>
                        {emailMode === 'LOGIN'
                          ? 'Sign In to Ishant Macro Data'
                          : emailMode === 'SIGNUP'
                          ? 'Register Account'
                          : 'Send Password Reset Link'}
                      </span>
                    </button>
                  </form>
                )}

                {/* METHOD 3: PHONE OTP */}
                {authMethod === 'PHONE' && (
                  <div className="space-y-4">
                    {!isOtpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-3.5">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Enter your mobile number to receive a real 6-digit SMS OTP via Twilio / Supabase Phone Auth.
                        </p>

                        <div>
                          <label className="text-[11px] font-mono text-slate-400 block mb-1">Mobile Phone Number</label>
                          <div className="flex gap-2">
                            <select
                              value={selectedCountryCode}
                              onChange={(e) => setSelectedCountryCode(e.target.value)}
                              className="w-32 bg-[#070c18] text-white px-2 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 text-xs font-mono focus:outline-none"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={`${c.code}-${c.name}`} value={c.code} className="bg-slate-900 text-white">
                                  {c.flag} {c.code} ({c.name})
                                </option>
                              ))}
                            </select>

                            <div className="relative flex-1">
                              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                              <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="98765 43210"
                                className="w-full bg-[#070c18] text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                        >
                          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Dispatch Real SMS OTP</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Verifying: <b className="text-white">{selectedCountryCode} {phoneNumber}</b></span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOtpSent(false);
                              setOtpCode('');
                            }}
                            className="text-cyan-400 hover:underline"
                          >
                            Change Number
                          </button>
                        </div>

                        <div>
                          <label className="text-[11px] font-mono text-slate-400 block mb-1">Enter 6-Digit SMS Code</label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="w-full bg-[#070c18] text-center tracking-[0.5em] text-cyan-300 font-mono text-xl py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>Expires in: <b className="text-amber-400">5:00 min</b></span>
                          {otpCountdown > 0 ? (
                            <span>Resend in: <b className="text-cyan-400">{otpCountdown}s</b></span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-cyan-400 hover:underline font-bold"
                            >
                              Resend Real SMS OTP
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={loading || otpCode.length !== 6}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Verify SMS & Sign In</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageView;
