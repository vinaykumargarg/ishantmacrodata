import React, { useState, useEffect } from 'react';
import { Smartphone, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OtpNotificationBanner: React.FC = () => {
  const { activeOtpToast, dismissOtpToast } = useAuth();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!activeOtpToast) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((activeOtpToast.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        dismissOtpToast();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOtpToast, dismissOtpToast]);

  if (!activeOtpToast) return null;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(activeOtpToast.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm rounded-xl border border-cyan-400/80 bg-slate-950/95 p-3.5 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl text-slate-100 font-mono text-xs animate-slideDown">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Smartphone className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>SMS OTP DISPATCHED</span>
              <span className="text-[10px] text-amber-300 font-normal">({timeLeft}s)</span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5 font-sans">
              Phone: <b>{activeOtpToast.phone}</b>
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base font-extrabold text-white tracking-widest px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                {activeOtpToast.code}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded bg-cyan-600 hover:bg-cyan-500 px-2 py-1 text-[10px] font-bold text-slate-950 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={dismissOtpToast}
          className="text-slate-400 hover:text-white rounded p-1 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OtpNotificationBanner;
