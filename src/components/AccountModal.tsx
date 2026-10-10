import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, X, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithEmail, signInWithGoogle } from '../lib/supabaseClient';
import { BrandLogo } from './BrandLogo';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, isBackendConnected } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signInWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const res = await signInWithGoogle();
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Google authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-md p-6 relative rounded-2xl bg-[#0c1426] border border-slate-700/80 shadow-[0_0_50px_rgba(0,212,255,0.15)] text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          <div className="space-y-4 text-center py-4 font-mono">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-sans">Ishant Macro Data</h2>
              <p className="text-xs text-slate-400 mt-1">
                Authenticated Account: <strong className="text-cyan-400 font-mono">{user.email || user.phone}</strong>
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified Institutional Pro Session
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-sans transition-colors cursor-pointer"
                >
                  Access Dashboard
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-900 border border-rose-500/40 hover:bg-rose-950/30 text-rose-400 text-xs font-sans transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
              <button
                onClick={() => {
                  window.location.hash = 'pricing';
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary font-bold text-xs font-sans transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                💎 View Membership Plans & Billing (₹)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-2">
                <BrandLogo size={42} />
              </div>
              <h2 className="text-base font-bold text-white font-sans">Institutional Terminal Login</h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Real authentication required to access custom watchlists, risk tools, and order flow.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed font-sans">{error}</span>
              </div>
            )}

            <div>
              <label className="text-slate-400 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@ishantmacro.com"
                  required
                  className="w-full bg-[#070c18] text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#070c18] text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Sign In with Real Credentials</span>
            </button>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-2 font-sans transition-all"
            >
              <span>🌐</span> Continue with Google
            </button>

            <div className="text-[10px] text-center text-slate-500 pt-1 font-sans">
              Status: {isBackendConnected ? '🟢 Supabase Connected' : '🔴 Real Supabase Backend Required'}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountModal;
