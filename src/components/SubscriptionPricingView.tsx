import React, { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  SubscriptionPlanId,
  OFFICIAL_SUBSCRIPTION_PLANS,
  PLAN_FEATURE_COMPARISON,
  UserSubscriptionRecord
} from '../data/subscriptionConfig';
import {
  initiateRazorpayCheckout,
  getActiveSubscription,
  cancelSubscription,
  RAZORPAY_KEY_ID,
  isRazorpayLive
} from '../services/paymentService';
import {
  verifyAndApplyPassport,
  revokeFounderPassport,
  isFounderPassportActive,
  getRemainingDays,
  getPaymentTransactions,
  recordPaymentTransaction,
  activate7DayTrial,
  FOUNDER_PASSPORT_KEY
} from '../services/subscriptionEntitlementService';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  X as XIcon,
  Shield,
  Zap,
  Award,
  CreditCard,
  Lock,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  User,
  Settings,
  Key,
  Download,
  Printer,
  Sparkles,
  Unlock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Mail
} from 'lucide-react';

interface SubscriptionPricingViewProps {
  onPlanActivated?: () => void;
}

export const SubscriptionPricingView: React.FC<SubscriptionPricingViewProps> = ({
  onPlanActivated
}) => {
  const { user, openAuthModal, loginWithGoogle } = useAuth();
  const [currentSub, setCurrentSub] = useState<UserSubscriptionRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'PLANS' | 'COMPARISON' | 'MY_SUB' | 'HISTORY' | 'ADMIN'>('PLANS');

  // Checkout Status State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login Required Modal State
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);

  // Master Passport Key State (20008)
  const [passportKeyInput, setPassportKeyInput] = useState<string>('');
  const [passportStatus, setPassportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isPassportUnlocked, setIsPassportUnlocked] = useState<boolean>(isFounderPassportActive);

  // Invoice / Receipt Modal State
  const [selectedInvoiceSub, setSelectedInvoiceSub] = useState<UserSubscriptionRecord | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  // Manage Subscription Modal State
  const [isManageSubModalOpen, setIsManageSubModalOpen] = useState<boolean>(false);

  // Payment Transactions History
  const [transactions, setTransactions] = useState<UserSubscriptionRecord[]>([]);

  const reloadSubData = async () => {
    const sub = await getActiveSubscription(user?.id);
    setCurrentSub(sub);
    setIsPassportUnlocked(isFounderPassportActive());
    setTransactions(getPaymentTransactions());
  };

  useEffect(() => {
    reloadSubData();
    const handleUpdate = () => reloadSubData();
    window.addEventListener('subscription_updated', handleUpdate);
    return () => window.removeEventListener('subscription_updated', handleUpdate);
  }, [user]);

  // Handle subscribe action
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Requirement 3: If not logged in, prompt Login/Signup first
    if (!user) {
      setPendingPlan(plan);
      setIsLoginRequiredOpen(true);
      return;
    }

    setIsProcessing(true);
    await initiateRazorpayCheckout(
      plan,
      user,
      (record) => {
        setIsProcessing(false);
        setCurrentSub(record);
        recordPaymentTransaction(record);
        setTransactions(getPaymentTransactions());
        setSuccessMessage(`Payment verified! ${plan.name} has been successfully activated. Enjoy unthrottled institutional intelligence.`);
        setSelectedInvoiceSub(record);
        setIsInvoiceModalOpen(true);
        if (onPlanActivated) onPlanActivated();
      },
      (err) => {
        setIsProcessing(false);
        setErrorMessage(err);
      },
      () => {
        setIsProcessing(false);
      }
    );
  };

  // Resume checkout after login
  const handleResumeCheckoutAfterLogin = (mode: 'GOOGLE' | 'EMAIL' | 'PHONE') => {
    setIsLoginRequiredOpen(false);
    if (mode === 'GOOGLE') {
      loginWithGoogle();
    } else if (mode === 'EMAIL') {
      openAuthModal('LOGIN');
    } else if (mode === 'PHONE') {
      openAuthModal('LOGIN');
    }
  };

  // Master Passport Key (20008) Activation
  const handleApplyPassportKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportKeyInput.trim()) return;

    const result = verifyAndApplyPassport(passportKeyInput, user);
    setPassportStatus(result);

    if (result.success) {
      setIsPassportUnlocked(true);
      setCurrentSub(result.record || null);
      setSuccessMessage(result.message);
      reloadSubData();
      if (onPlanActivated) onPlanActivated();
    }
  };

  // Revoke passport key for testing lock gates
  const handleRevokePassport = () => {
    if (confirm('Are you sure you want to lock the terminal again to test the free/premium lock gates?')) {
      revokeFounderPassport();
      setIsPassportUnlocked(false);
      setCurrentSub(null);
      setPassportStatus(null);
      setSuccessMessage('Passport reset. Premium modules are now locked for free/unsubscribed mode.');
      reloadSubData();
    }
  };

  const handleCancelSub = async () => {
    if (!currentSub) return;
    if (confirm('Are you sure you want to turn off automatic renewal? You will retain access until your current billing period ends.')) {
      await cancelSubscription(currentSub);
      await reloadSubData();
      alert('Automatic renewal has been cancelled. Your active access continues until expiry.');
    }
  };

  // 4 Target official plans
  const targetPlans = OFFICIAL_SUBSCRIPTION_PLANS.filter(p => p.id !== 'free' && p.id !== 'founder_passport');

  // Check if current user has active subscription
  const isSubActive = Boolean(
    (currentSub && currentSub.status === 'ACTIVE' && new Date(currentSub.expiryDate) > new Date()) ||
    isPassportUnlocked
  );

  return (
    <div className="space-y-6 pb-16 font-['Plus_Jakarta_Sans',sans-serif] text-foreground max-w-7xl mx-auto px-2 sm:px-4">
      {/* ── HEADER HERO ── */}
      <div className="text-center space-y-3 pt-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-mono font-bold text-primary shadow-sm">
          <Zap className="h-3.5 w-3.5" />
          <span>OFFICIAL INSTITUTIONAL TRADING TERMINAL</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-['Outfit',sans-serif]">
          Choose Your Trading Plan
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Real-time Order Flow, SMC Market Structure, Delta Exchange India Multi-Coin Engine (231+ Coins), Indian Stocks Top 500, and USA Top 1000 AI Terminals.
        </p>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap justify-center gap-1.5 pt-3 text-xs">
          {[
            { id: 'PLANS', label: 'Subscription Plans (INR)' },
            { id: 'COMPARISON', label: 'Feature Comparison' },
            { id: 'MY_SUB', label: isSubActive ? 'My Subscription (Active)' : 'My Subscription' },
            { id: 'HISTORY', label: 'Payment History' },
            { id: 'ADMIN', label: 'Gateway Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer font-mono ${
                activeTab === tab.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ALERTS (ERROR & SUCCESS) ── */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200 cursor-pointer">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. SUBSCRIPTION PLANS (4 EXACT PLANS)                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'PLANS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {targetPlans.map((plan) => {
              const isBest = plan.isBestValue;
              const isPopular = plan.isPopular;
              const isCurrent = currentSub?.planId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all backdrop-blur-md ${
                    isBest
                      ? 'border-cyan-500/80 bg-gradient-to-b from-cyan-950/20 via-card to-card shadow-[0_0_35px_rgba(6,182,212,0.22)] ring-1 ring-cyan-500/40'
                      : isPopular
                      ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/20 via-card to-card shadow-[0_0_30px_rgba(245,158,11,0.18)]'
                      : 'border-border bg-card/90 hover:border-border/80'
                  }`}
                >
                  {/* Top Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`rounded-full px-3 py-0.5 text-[10px] font-black tracking-wider uppercase border shadow-md font-mono ${
                        isBest
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 border-cyan-400'
                          : 'bg-amber-500 text-slate-950 border-amber-400'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Plan Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-foreground font-['Outfit',sans-serif]">{plan.name}</h3>
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
                          {plan.durationLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.tagline}</p>
                    </div>

                    {/* Pricing Block */}
                    <div className="border-y border-border/60 py-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-muted-foreground">₹</span>
                        <span className="text-3xl font-black text-foreground tracking-tight font-mono">
                          {plan.priceInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {plan.durationLabel}
                        </span>
                      </div>

                      {/* Effective Monthly Cost & Savings */}
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">
                          ₹{plan.monthlyEquivalentInr.toLocaleString('en-IN')} / month
                        </span>
                        {plan.savingsInr > 0 && (
                          <span className="font-bold text-emerald-400 font-mono text-[11px]">
                            Save ₹{plan.savingsInr.toLocaleString('en-IN')} ({plan.savingsPct}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Plan Benefits Checklist */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-foreground text-[11px] uppercase tracking-wider block font-mono">
                        Plan Benefits:
                      </span>
                      <ul className="space-y-1.5">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                            <span className="text-[11px] leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Subscribe Action Button */}
                  <div className="pt-5 mt-4 border-t border-border/50">
                    {isCurrent || (isPassportUnlocked && plan.id === 'annual') ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 font-mono">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Active Plan</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 font-mono ${
                          isBest
                            ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-glow'
                            : isPopular
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            : 'bg-primary text-primary-foreground hover:opacity-90'
                        }`}
                      >
                        {isProcessing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <span>Subscribe Now</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    )}
                    <div className="text-[10px] text-center text-muted-foreground mt-2 font-mono">
                      Instant Razorpay Activation • Tax Invoice Included
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 7-DAY FREE UNLIMITED TRIAL BANNER ── */}
          <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">7-Day Free Unlimited Trial Available</h4>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                    100% Free
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Try all institutional AI features, SMC models, order flow CVD, and advanced charts free for 7 days. No credit card required.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                activate7DayTrial(user);
                reloadSubData();
                setSuccessMessage('7-Day Free Trial activated! All institutional tools and charts are now unlocked.');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap font-mono shadow-md flex items-center gap-1.5"
            >
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── FREE STARTER PLAN BAR ── */}
          <div className="rounded-xl border border-border bg-card/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-base font-bold text-muted-foreground">
                🆓
              </div>
              <div>
                <h4 className="font-bold text-foreground">Free Starter Tier Available</h4>
                <p className="text-muted-foreground text-[11px]">
                  Explore basic global dials, public news, and delayed market overviews. No credit card required.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSubscribe(OFFICIAL_SUBSCRIPTION_PLANS[0])}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-accent text-xs cursor-pointer whitespace-nowrap font-mono"
            >
              Continue Free
            </button>
          </div>

          {/* ── SECURITY & GATEWAY ASSURANCE BADGES ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="rounded-xl border border-border/80 bg-background/50 p-3 flex items-center gap-2.5">
              <Shield className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-foreground">Bank Grade Security</div>
                <div className="text-[10px] text-muted-foreground">256-bit SSL encrypted checkout</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/50 p-3 flex items-center gap-2.5">
              <CreditCard className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <div className="font-bold text-foreground">All Indian Payment Modes</div>
                <div className="text-[10px] text-muted-foreground">UPI (GPay/PhonePe), Cards, NetBanking</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/50 p-3 flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-foreground">No Forced Contracts</div>
                <div className="text-[10px] text-muted-foreground">Cancel online anytime with 1-click</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/50 p-3 flex items-center gap-2.5">
              <Award className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <div className="font-bold text-foreground">Institutional Support</div>
                <div className="text-[10px] text-muted-foreground">Direct analyst desk access</div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* MASTER PASSPORT SECTION (OVERRIDE FOR 100% FREE LIFETIME FOUNDER ACCESS)   */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="relative rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/20 via-slate-950 to-cyan-950/20 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    <span>Founder Security Override</span>
                  </span>
                  {isPassportUnlocked && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Passport Active</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                  <span>👑 Founder Master Passport Override</span>
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif]">
                  Laptop / Owner Override: Enter your secret Master Passport key to unlock permanent, 100% free lifetime access across all market tools, AI analysis engines, order flow terminals, and institutional charts for this browser.
                </p>
              </div>

              {/* Passport Form / Status */}
              <div className="w-full md:w-auto shrink-0 space-y-2">
                {!isPassportUnlocked ? (
                  <form onSubmit={handleApplyPassportKey} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      placeholder="Enter Master Passport Key"
                      value={passportKeyInput}
                      onChange={(e) => setPassportKeyInput(e.target.value)}
                      className="rounded-xl border border-amber-500/50 bg-slate-900/90 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 min-w-[210px]"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2 text-xs font-bold font-mono text-slate-950 transition-all cursor-pointer whitespace-nowrap shadow-md"
                    >
                      Unlock Free Lifetime Access
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Founder Passport Verified: 100% Free Lifetime Active</span>
                    </div>
                    <button
                      onClick={handleRevokePassport}
                      className="text-[11px] font-mono text-slate-400 hover:text-rose-400 underline cursor-pointer"
                      title="Lock features again to test subscription gate"
                    >
                      Lock Again (Test Gate)
                    </button>
                  </div>
                )}

                {passportStatus && !isPassportUnlocked && (
                  <div className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 ${
                    passportStatus.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                  }`}>
                    {passportStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{passportStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. COMPREHENSIVE FEATURES COMPARISON TABLE                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'COMPARISON' && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 text-xs shadow-sm">
          <div className="border-b border-border/60 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Detailed Plan Features Comparison</h3>
              <p className="text-muted-foreground text-xs">
                Compare entitlements across Starter (Free), Pro (Monthly/Quarterly), and Elite (Half-Yearly/Annual) tiers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground font-mono">
                <tr>
                  <th className="py-3 px-3">Feature & Capability</th>
                  <th className="py-3 px-3 text-center">Starter (Free)</th>
                  <th className="py-3 px-3 text-center text-primary font-bold">Pro (₹2,999/mo)</th>
                  <th className="py-3 px-3 text-center text-amber-400 font-bold">Elite (₹1,666/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {PLAN_FEATURE_COMPARISON.map((row, i) => (
                  <tr key={i} className="hover:bg-accent/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {row.featureName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground">{row.free}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-primary/5 font-semibold">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-primary">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-amber-500/5 font-bold">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-amber-400">{row.elite}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. USER MEMBERSHIP DASHBOARD (MY SUBSCRIPTION)                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MY_SUB' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5 text-xs shadow-sm max-w-3xl mx-auto">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                My Subscription & Entitlement Profile
              </h3>
              <p className="text-muted-foreground">
                Manage your active entitlement, payment records, and renewal status.
              </p>
            </div>
            {isSubActive && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-bold font-mono">
                ACTIVE
              </span>
            )}
          </div>

          {isSubActive ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Plan</div>
                  <div className="text-base font-black text-foreground">
                    {isPassportUnlocked
                      ? 'Founder Lifetime Elite (Passport)'
                      : currentSub?.planName || 'Monthly Pro'}
                  </div>
                  <div className="text-[11px] text-primary font-semibold font-mono">
                    Tier: {currentSub?.tier || 'ELITE'}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Billing Amount</div>
                  <div className="text-base font-black text-foreground font-mono">
                    ₹{currentSub ? currentSub.amountInr.toLocaleString('en-IN') : '0'} INR
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Payment Provider: {currentSub?.paymentMethod || 'PASSPORT KEY'}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Start Date</div>
                  <div className="text-sm font-semibold text-foreground font-mono">
                    {currentSub
                      ? new Date(currentSub.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Expiry Date</div>
                  <div className="text-sm font-semibold text-emerald-400 font-mono">
                    {currentSub
                      ? new Date(currentSub.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '31/12/2099'}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Days Remaining</div>
                  <div className="text-sm font-semibold text-cyan-400 font-mono">
                    {currentSub ? getRemainingDays(currentSub.expiryDate) : 'Lifetime Access'}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Payment ID</div>
                  <div className="text-sm font-semibold text-foreground font-mono truncate">
                    {currentSub?.paymentId || 'PASSPORT-MASTER-KEY'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold font-mono">Status: Successful</div>
                </div>
              </div>

              {/* Actions & Invoices */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                <h4 className="font-bold text-foreground">Subscription Actions</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('PLANS')}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 cursor-pointer font-mono"
                  >
                    Upgrade / Extend Plan
                  </button>

                  <button
                    onClick={() => {
                      if (currentSub) setSelectedInvoiceSub(currentSub);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-foreground font-semibold text-xs hover:bg-card cursor-pointer font-mono flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View GST Tax Invoice</span>
                  </button>

                  {!isPassportUnlocked && (
                    <button
                      onClick={handleCancelSub}
                      className="px-4 py-2 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive font-semibold text-xs hover:bg-destructive/20 cursor-pointer font-mono"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto text-xl">
                💎
              </div>
              <h4 className="font-bold text-foreground text-sm">No Active Paid Subscription Found</h4>
              <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                You are currently exploring on the Free Starter tier. Subscribe to access unthrottled Order Flow, SMC models, and live AI signals.
              </p>
              <button
                onClick={() => setActiveTab('PLANS')}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 cursor-pointer shadow-md font-mono"
              >
                Choose Your Trading Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. PAYMENT HISTORY TABLE                                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Payment & Billing History
              </h3>
              <p className="text-muted-foreground text-xs">
                Inspect your previous order receipts, transaction IDs, and tax invoices.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-accent/40 transition-colors">
                      <td className="py-2.5 px-3 text-foreground">
                        {new Date(tx.startDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {tx.planName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        ₹{tx.amountInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px] truncate max-w-[140px]">
                        {tx.paymentId || 'PASSPORT-KEY'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedInvoiceSub(tx);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-[10px] text-primary font-bold cursor-pointer transition-colors"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. ADMIN GATEWAY MANAGEMENT PANEL                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ADMIN' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs shadow-sm max-w-3xl mx-auto">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Subscription & Payment Gateway Administration
              </h3>
              <p className="text-muted-foreground text-xs">
                Configure production payment keys, manage plans, and inspect webhook status.
              </p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-foreground">
              Mode: {isRazorpayLive ? 'LIVE' : 'SANDBOX / TEST'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
              <h4 className="font-bold text-foreground">Payment Provider Keys (Razorpay):</h4>
              <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
                <div>Key ID: <strong className="text-foreground">{RAZORPAY_KEY_ID}</strong></div>
                <div>Status: <span className={isRazorpayLive ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {isRazorpayLive ? 'Verified Live Gateway' : 'Sandbox Test Mode Active'}
                </span></div>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                To activate live card & UPI payments in production, configure <code className="text-primary font-mono">VITE_RAZORPAY_KEY_ID</code> in your hosting environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LOGIN REQUIRED MODAL PROMPT (REQUIREMENT 3)                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isLoginRequiredOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/50 space-y-5 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
            <button
              onClick={() => setIsLoginRequiredOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif]">
                Please Login or Sign Up to continue
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                To activate your subscription for <strong className="text-cyan-300 font-mono">{pendingPlan?.name}</strong>, please authenticate your account first:
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Google Button */}
              <button
                onClick={() => handleResumeCheckoutAfterLogin('GOOGLE')}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800/90 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Email Button */}
              <button
                onClick={() => handleResumeCheckoutAfterLogin('EMAIL')}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800/90 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Continue with Email</span>
              </button>

              {/* Phone Button */}
              <button
                onClick={() => handleResumeCheckoutAfterLogin('PHONE')}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800/90 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Continue with Phone</span>
              </button>
            </div>

            <div className="text-center text-[11px] text-slate-400 font-mono pt-1">
              After login, you will automatically proceed to complete checkout.
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. GST TAX INVOICE & RECEIPT MODAL (REQUIREMENT 11)                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isInvoiceModalOpen && selectedInvoiceSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/50 space-y-4 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Invoice Header */}
            <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">Tax Invoice / Payment Receipt</span>
                <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">Ishant Macro AI Terminal</h3>
                <p className="text-[11px] text-slate-400 font-mono">Invoice #{selectedInvoiceSub.id.substring(0, 16)}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                PAID ✓
              </span>
            </div>

            {/* Bill To & Date Details */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Customer Details:</span>
                <div className="font-bold text-white">{user?.name || 'Institutional Trader'}</div>
                <div className="text-slate-400 text-[11px]">{user?.email || user?.phone || 'account@ishantmacro.ai'}</div>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Date & Provider:</span>
                <div className="text-slate-200">
                  {new Date(selectedInvoiceSub.startDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-cyan-400 text-[11px]">Provider: {selectedInvoiceSub.paymentMethod}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
                <span>Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="flex justify-between items-center text-white font-semibold">
                <span>{selectedInvoiceSub.planName}</span>
                <span>₹{selectedInvoiceSub.amountInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>GST (18% inclusive)</span>
                <span>₹{(selectedInvoiceSub.amountInr * 0.18 / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-cyan-300 font-bold border-t border-slate-800 pt-1.5">
                <span>Total Paid</span>
                <span>₹{selectedInvoiceSub.amountInr.toLocaleString('en-IN')} INR</span>
              </div>
            </div>

            {/* Transaction Ref */}
            <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
              <div>Transaction ID: <span className="text-slate-200 font-bold">{selectedInvoiceSub.paymentId || 'PASSPORT-MASTER-KEY'}</span></div>
              <div>Access Expiry: <span className="text-emerald-400 font-bold">{new Date(selectedInvoiceSub.expiryDate).toLocaleDateString('en-IN')}</span></div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-bold text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPricingView;
