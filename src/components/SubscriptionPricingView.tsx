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
  Sliders,
  DollarSign,
  FileText,
  User,
  Settings
} from 'lucide-react';

interface SubscriptionPricingViewProps {
  onPlanActivated?: () => void;
}

export const SubscriptionPricingView: React.FC<SubscriptionPricingViewProps> = ({
  onPlanActivated
}) => {
  const { user, openAuthModal } = useAuth();
  const [activePlanId, setActivePlanId] = useState<SubscriptionPlanId>('annual');
  const [currentSub, setCurrentSub] = useState<UserSubscriptionRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'PLANS' | 'COMPARISON' | 'MY_SUB' | 'ADMIN'>('PLANS');

  // Checkout Status State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin Config State
  const [adminPlans, setAdminPlans] = useState<SubscriptionPlan[]>(OFFICIAL_SUBSCRIPTION_PLANS);

  useEffect(() => {
    async function loadSub() {
      const sub = await getActiveSubscription(user?.id);
      setCurrentSub(sub);
    }
    loadSub();

    const handleUpdate = () => loadSub();
    window.addEventListener('subscription_updated', handleUpdate);
    return () => window.removeEventListener('subscription_updated', handleUpdate);
  }, [user]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    await initiateRazorpayCheckout(
      plan,
      user,
      (record) => {
        setIsProcessing(false);
        setCurrentSub(record);
        setSuccessMessage(`Payment verified! ${plan.name} has been successfully activated. Enjoy unthrottled institutional intelligence.`);
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

  const handleCancelSub = async () => {
    if (!currentSub) return;
    if (confirm('Are you sure you want to turn off automatic renewal? You will retain access until your current billing period ends.')) {
      await cancelSubscription(currentSub);
      const updated = await getActiveSubscription(user?.id);
      setCurrentSub(updated);
      alert('Automatic renewal has been cancelled. Your active access continues until expiry.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-foreground max-w-7xl mx-auto px-2 sm:px-4">
      {/* ── HEADER HERO ── */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Zap className="h-3.5 w-3.5" />
          <span>OFFICIAL INSTITUTIONAL MEMBERSHIP & PRICING</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Unlock Institutional Trading Intelligence
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground">
          Real-time Order Flow, Bookmap AI, Delta Exchange India Multi-Coin Engine (231+ Coins), Indian Stocks Top 500, and USA Top 1000 AI Terminals.
        </p>

        {/* Sub-navigation pills */}
        <div className="flex justify-center gap-1.5 pt-2 text-xs">
          {[
            { id: 'PLANS', label: 'Subscription Plans (INR)' },
            { id: 'COMPARISON', label: 'Feature Comparison' },
            { id: 'MY_SUB', label: currentSub ? 'My Active Membership' : 'Membership Status' },
            { id: 'ADMIN', label: 'Admin Gateway Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
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
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">
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
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. SUBSCRIPTION PLANS GRID (EXACT INR CONFIGURATION)                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminPlans.filter(p => p.id !== 'free').map((plan) => {
              const isBest = plan.isBestValue;
              const isPopular = plan.isPopular;
              const isCurrent = currentSub?.planId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all backdrop-blur-md ${
                    isBest
                      ? 'border-primary/80 bg-gradient-to-b from-primary/10 via-card to-card shadow-[0_0_40px_rgba(0,212,255,0.18)] ring-1 ring-primary/40'
                      : isPopular
                      ? 'border-amber-500/70 bg-gradient-to-b from-amber-500/10 via-card to-card shadow-[0_0_30px_rgba(245,158,11,0.12)]'
                      : 'border-border bg-card/90 hover:border-border/80'
                  }`}
                >
                  {/* Top Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`rounded-full px-3 py-0.5 text-[10px] font-black tracking-wider uppercase border shadow-md ${
                        isBest
                          ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                          : 'bg-amber-500 text-black border-amber-400'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Plan Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-foreground">{plan.name}</h3>
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {plan.durationLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.tagline}</p>
                    </div>

                    {/* Pricing Block */}
                    <div className="border-y border-border/60 py-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-muted-foreground">₹</span>
                        <span className="text-3xl font-black text-foreground tracking-tight">
                          {plan.priceInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {plan.durationLabel}
                        </span>
                      </div>

                      {/* Monthly Equivalent & Savings */}
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          ₹{plan.monthlyEquivalentInr.toLocaleString('en-IN')} / month
                        </span>
                        {plan.savingsInr > 0 && (
                          <span className="font-bold text-emerald-400">
                            Save ₹{plan.savingsInr.toLocaleString('en-IN')} ({plan.savingsPct}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key Features List */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-foreground text-[11px] uppercase tracking-wider block">
                        Included Entitlements:
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
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Active Plan</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                          isBest
                            ? 'bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow'
                            : isPopular
                            ? 'bg-amber-500 text-black hover:bg-amber-400'
                            : 'bg-primary/90 text-primary-foreground hover:bg-primary'
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
                    <div className="text-[10px] text-center text-muted-foreground mt-2">
                      Instant Activation • GST Invoice Included
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── FREE PLAN CAROUSEL BANNER ── */}
          <div className="rounded-xl border border-border bg-card/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-base font-bold text-muted-foreground">
                🆓
              </div>
              <div>
                <h4 className="font-bold text-foreground">Free Starter Tier Available</h4>
                <p className="text-muted-foreground text-[11px]">
                  Explore basic global dials and delayed market overviews. No credit card required.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSubscribe(OFFICIAL_SUBSCRIPTION_PLANS[0])}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-accent text-xs cursor-pointer whitespace-nowrap"
            >
              Continue with Free Plan
            </button>
          </div>

          {/* ── SECURITY & GATEWAY ASSURANCE BADGES ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
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
              <thead className="bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground">
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
      {/* 3. USER MEMBERSHIP DASHBOARD                                               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MY_SUB' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs shadow-sm max-w-3xl mx-auto">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                My Membership & Billing Profile
              </h3>
              <p className="text-muted-foreground">
                Manage your active entitlement, payment records, and renewal status.
              </p>
            </div>
            {currentSub && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                {currentSub.status}
              </span>
            )}
          </div>

          {currentSub ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Active Plan</div>
                  <div className="text-base font-black text-foreground">{currentSub.planName}</div>
                  <div className="text-[11px] text-primary font-semibold">Tier: {currentSub.tier}</div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Billing Amount</div>
                  <div className="text-base font-black text-foreground">
                    ₹{currentSub.amountInr.toLocaleString('en-IN')} {currentSub.currency}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Payment Provider: {currentSub.paymentMethod}</div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(currentSub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Current Period Expiry</div>
                  <div className="text-sm font-semibold text-emerald-400">
                    {new Date(currentSub.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Actions & Invoices */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                <h4 className="font-bold text-foreground">Subscription Actions</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('PLANS')}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 cursor-pointer"
                  >
                    Upgrade / Extend Plan
                  </button>

                  <button
                    onClick={handleCancelSub}
                    className="px-4 py-2 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive font-semibold text-xs hover:bg-destructive/20 cursor-pointer"
                  >
                    Turn Off Auto-Renewal
                  </button>

                  {currentSub.paymentId && (
                    <div className="text-muted-foreground text-[11px] ml-auto">
                      Transaction Ref: <strong className="font-mono text-foreground">{currentSub.paymentId}</strong>
                    </div>
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
                You are currently exploring on the Free Starter tier. Upgrade to access full Order Flow and AI signals.
              </p>
              <button
                onClick={() => setActiveTab('PLANS')}
                className="px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-bold text-xs hover:opacity-90 cursor-pointer shadow-glow"
              >
                View Official Plans
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. ADMIN GATEWAY MANAGEMENT PANEL                                          */}
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
                To activate live card & UPI payments in production, configure <code className="text-primary font-mono">VITE_RAZORPAY_KEY_ID</code> in your Vercel or production hosting environment variables.
              </p>
            </div>

            {/* Grant Complimentary Access Tool */}
            <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
              <h4 className="font-bold text-foreground">Grant Complimentary Institutional Pro Access:</h4>
              <p className="text-muted-foreground text-[11px]">
                Direct administrative unlock for testing and internal team verification.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    const testSub: UserSubscriptionRecord = {
                      id: `sub_admin_grant_${Date.now()}`,
                      userId: user?.id || 'admin_user',
                      planId: 'annual',
                      planName: 'Annual Master Elite (Admin VIP Grant)',
                      tier: 'ELITE',
                      amountInr: 20000,
                      currency: 'INR',
                      status: 'ACTIVE',
                      startDate: new Date().toISOString(),
                      expiryDate: '2028-12-31T23:59:59Z',
                      paymentMethod: 'COMPLIMENTARY',
                      autoRenew: false
                    };
                    initiateRazorpayCheckout(OFFICIAL_SUBSCRIPTION_PLANS[4], user, () => {}, () => {});
                    setCurrentSub(testSub);
                    alert('Complimentary Annual Master Elite access granted successfully.');
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 cursor-pointer"
                >
                  ⚡ Grant 1-Year Master Elite Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPricingView;
