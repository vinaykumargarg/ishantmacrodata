/**
 * ISHANT MACRO AI TERMINAL (NEXVORA AI)
 * Official Payment Gateway Integration (Razorpay INR & Stripe Multi-Currency)
 */

import {
  SubscriptionPlan,
  UserSubscriptionRecord,
  OFFICIAL_SUBSCRIPTION_PLANS
} from '../data/subscriptionConfig';
import { supabase, isSupabaseConfigured, AuthUserProfile } from '../lib/supabaseClient';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

// Environment keys (with fallback for sandbox / demo mode)
export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID ||
  (typeof window !== 'undefined' ? localStorage.getItem('ISHANT_RAZORPAY_KEY_ID') || '' : '') ||
  'rzp_test_placeholder_key';

export const isRazorpayLive = !RAZORPAY_KEY_ID.includes('placeholder') && !RAZORPAY_KEY_ID.startsWith('rzp_test_');

/**
 * Dynamically injects official Razorpay Checkout SDK
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-sdk');
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load official Razorpay SDK script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay checkout flow for a selected subscription plan
 */
export async function initiateRazorpayCheckout(
  plan: SubscriptionPlan,
  user: AuthUserProfile | null,
  onSuccess: (record: UserSubscriptionRecord) => void,
  onError: (errMsg: string) => void,
  onDismiss?: () => void
): Promise<void> {
  if (plan.priceInr === 0) {
    // Free plan activation
    const freeRecord: UserSubscriptionRecord = {
      id: `sub_free_${Date.now()}`,
      userId: user?.id || 'guest_user',
      planId: 'free',
      planName: plan.name,
      tier: 'FREE',
      amountInr: 0,
      currency: 'INR',
      status: 'ACTIVE',
      startDate: new Date().toISOString(),
      expiryDate: '2099-12-31T23:59:59Z',
      paymentMethod: 'COMPLIMENTARY',
      autoRenew: false
    };
    saveSubscriptionLocal(freeRecord);
    onSuccess(freeRecord);
    return;
  }

  const isScriptLoaded = await loadRazorpayScript();
  if (!isScriptLoaded || !window.Razorpay) {
    onError('Unable to load payment gateway checkout. Please check internet connection or disable ad-blockers.');
    return;
  }

  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const amountPaise = plan.priceInr * 100;

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountPaise,
    currency: 'INR',
    name: 'Ishant Macro AI Terminal',
    description: `${plan.name} (${plan.durationLabel}) — Full Institutional Access`,
    image: '/brand-logo.jpg',
    order_id: undefined, // Optional when using standard client-side checkout in test mode
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || ''
    },
    notes: {
      plan_id: plan.id,
      tier: plan.tier,
      duration_months: plan.durationMonths.toString(),
      user_id: user?.id || 'guest'
    },
    theme: {
      color: '#00d4ff' // Institutional Electric Blue
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      }
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    }) => {
      // Calculate expiry date based on plan duration
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + plan.durationMonths);

      const record: UserSubscriptionRecord = {
        id: `sub_${response.razorpay_payment_id}`,
        userId: user?.id || 'guest_user',
        planId: plan.id,
        planName: plan.name,
        tier: plan.tier,
        amountInr: plan.priceInr,
        currency: 'INR',
        status: 'ACTIVE',
        startDate: now.toISOString(),
        expiryDate: expiry.toISOString(),
        paymentMethod: 'RAZORPAY',
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id || orderId,
        autoRenew: true,
        invoiceUrl: `https://dashboard.razorpay.com/payments/${response.razorpay_payment_id}`
      };

      // 1. Sync to Supabase production database if configured
      if (isSupabaseConfigured && supabase && user?.id) {
        try {
          await supabase.from('subscriptions').upsert({
            id: record.id,
            user_id: user.id,
            plan_id: plan.id,
            tier: plan.tier,
            amount_inr: plan.priceInr,
            currency: 'INR',
            status: 'ACTIVE',
            start_date: record.startDate,
            expiry_date: record.expiryDate,
            payment_provider: 'RAZORPAY',
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id || orderId,
            auto_renew: true,
            updated_at: new Date().toISOString()
          });

          // Update user entitlement tier in profiles
          await supabase.from('profiles').update({
            role: plan.tier === 'ELITE' ? 'pro_investor' : 'institutional_trader',
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
        } catch (dbErr) {
          console.warn('Supabase subscription sync warning:', dbErr);
        }
      }

      // 2. Persist locally for instant entitlement unlock
      saveSubscriptionLocal(record);
      onSuccess(record);
    }
  };

  try {
    const rzpInstance = new window.Razorpay(options);
    rzpInstance.on('payment.failed', (resp: any) => {
      onError(resp.error?.description || 'Payment was declined or failed. Please try another method.');
    });
    rzpInstance.open();
  } catch (err: any) {
    onError(err.message || 'Payment window could not be initialized.');
  }
}

/**
 * Saves subscription record in local storage
 */
export function saveSubscriptionLocal(record: UserSubscriptionRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ISHANT_SUB_${record.userId}`, JSON.stringify(record));
    localStorage.setItem('ISHANT_CURRENT_SUB', JSON.stringify(record));
    window.dispatchEvent(new Event('subscription_updated'));
  } catch (e) {}
}

/**
 * Retrieves the current active subscription for a user
 */
export async function getActiveSubscription(userId?: string): Promise<UserSubscriptionRecord | null> {
  // Check Supabase if configured and online
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          planId: data.plan_id,
          planName: OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === data.plan_id)?.name || 'Pro Plan',
          tier: data.tier,
          amountInr: data.amount_inr,
          currency: data.currency || 'INR',
          status: data.status,
          startDate: data.start_date,
          expiryDate: data.expiry_date,
          paymentMethod: data.payment_provider || 'RAZORPAY',
          paymentId: data.payment_id,
          orderId: data.order_id,
          autoRenew: data.auto_renew ?? true
        };
      }
    } catch (e) {}
  }

  // Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const localStr = userId
        ? localStorage.getItem(`ISHANT_SUB_${userId}`) || localStorage.getItem('ISHANT_CURRENT_SUB')
        : localStorage.getItem('ISHANT_CURRENT_SUB');

      if (localStr) {
        const parsed: UserSubscriptionRecord = JSON.parse(localStr);
        // Verify expiry
        if (new Date(parsed.expiryDate) > new Date()) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Cancel or toggle auto-renewal for a subscription
 */
export async function cancelSubscription(record: UserSubscriptionRecord): Promise<boolean> {
  const updated: UserSubscriptionRecord = {
    ...record,
    autoRenew: false
  };

  saveSubscriptionLocal(updated);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('subscriptions')
        .update({ auto_renew: false, updated_at: new Date().toISOString() })
        .eq('id', record.id);
    } catch (e) {}
  }

  return true;
}
