import {
  UserSubscriptionRecord,
  SubscriptionPlan,
  OFFICIAL_SUBSCRIPTION_PLANS,
  SubscriptionPlanId
} from '../data/subscriptionConfig';
import { AuthUserProfile } from '../lib/supabaseClient';
import { saveSubscriptionLocal, getActiveSubscription } from './paymentService';

export const FOUNDER_PASSPORT_KEY = '20008';
const PASSPORT_STORAGE_KEY = 'ISHANT_FOUNDER_PASSPORT';
const TRANSACTION_HISTORY_KEY = 'ISHANT_PAYMENT_HISTORY_V2';

/**
 * Checks whether the Founder Master Passport (20008) is active on this device
 */
export function isFounderPassportActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = localStorage.getItem(PASSPORT_STORAGE_KEY);
    if (key === FOUNDER_PASSPORT_KEY) return true;

    const currentSubRaw = localStorage.getItem('ISHANT_CURRENT_SUB');
    if (currentSubRaw) {
      const parsed: UserSubscriptionRecord = JSON.parse(currentSubRaw);
      if (
        parsed.status === 'ACTIVE' &&
        (parsed.planId === 'founder_passport' || parsed.paymentId?.includes('20008'))
      ) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

/**
 * Creates the permanent Lifetime Founder Subscription Record
 */
export function createFounderRecord(user?: AuthUserProfile | null): UserSubscriptionRecord {
  return {
    id: 'sub_founder_lifetime_20008',
    userId: user?.id || 'founder_master',
    planId: 'founder_passport',
    planName: 'Founder Lifetime Elite (Passport)',
    tier: 'ELITE',
    amountInr: 0,
    currency: 'INR',
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    expiryDate: '2099-12-31T23:59:59Z', // Lifetime
    paymentMethod: 'COMPLIMENTARY',
    paymentId: 'PASSPORT-MASTER-KEY',
    orderId: 'FOUNDER-MASTER-OVERRIDE',
    autoRenew: true,
    invoiceUrl: 'https://ishantmacro.ai/founder-passport-verified'
  };
}

/**
 * Creates a 7-Day Free Unlimited Trial Subscription Record
 */
export function create7DayTrialRecord(user?: AuthUserProfile | null): UserSubscriptionRecord {
  const now = new Date();
  const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // exactly 7 days

  return {
    id: `sub_trial_${Date.now()}`,
    userId: user?.id || 'trial_user',
    planId: 'trial_7d',
    planName: '7-Day Free Unlimited Trial',
    tier: 'ELITE',
    amountInr: 0,
    currency: 'INR',
    status: 'ACTIVE',
    startDate: now.toISOString(),
    expiryDate: expiry.toISOString(),
    paymentMethod: 'COMPLIMENTARY',
    paymentId: `TRIAL-7D-${Date.now().toString(36).toUpperCase()}`,
    orderId: 'FREE-7DAY-TRIAL',
    autoRenew: false,
    invoiceUrl: 'https://ishantmacro.ai/trial-receipt'
  };
}

/**
 * Activates 7-Day Free Unlimited Trial for the user
 */
export function activate7DayTrial(user?: AuthUserProfile | null): {
  success: boolean;
  message: string;
  record: UserSubscriptionRecord;
} {
  const trialRecord = create7DayTrialRecord(user);
  saveSubscriptionLocal(trialRecord);
  recordPaymentTransaction(trialRecord);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ISHANT_TRIAL_ACTIVATED', 'true');
      window.dispatchEvent(new Event('subscription_updated'));
    } catch (e) {}
  }

  return {
    success: true,
    message: '7-Day Free Trial activated successfully! All institutional tools, AI charts, and SMC models are now unlocked for 7 days.',
    record: trialRecord
  };
}

/**
 * Verifies the Master Passport password (20008) and activates permanent Lifetime Elite access
 */
export function verifyAndApplyPassport(
  inputKey: string,
  user?: AuthUserProfile | null
): { success: boolean; message: string; record?: UserSubscriptionRecord } {
  const cleanKey = inputKey.trim();

  if (cleanKey !== FOUNDER_PASSPORT_KEY) {
    return {
      success: false,
      message: 'Invalid passport key. Access denied.'
    };
  }

  // 1. Save passport flag
  try {
    localStorage.setItem(PASSPORT_STORAGE_KEY, FOUNDER_PASSPORT_KEY);
  } catch (e) {}

  // 2. Create and persist Lifetime Record
  const founderRecord = createFounderRecord(user);
  saveSubscriptionLocal(founderRecord);
  recordPaymentTransaction(founderRecord);

  // 3. Dispatch global sync event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('subscription_updated'));
  }

  return {
    success: true,
    message: 'Founder Master Passport Verified! Lifetime Elite access permanently unlocked across all market tools, AI engines, and institutional charts.',
    record: founderRecord
  };
}

/**
 * Revokes passport (useful for testing lock screens)
 */
export function revokeFounderPassport(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PASSPORT_STORAGE_KEY);
    localStorage.removeItem('ISHANT_CURRENT_SUB');
    window.dispatchEvent(new Event('subscription_updated'));
  } catch (e) {}
}

/**
 * Free tabs accessible to everyone without paid subscription
 */
export const FREE_TABS = new Set([
  'global-score',
  'economic-events',
  'calendar',
  'news',
  'pricing',
  'subscription',
  'membership',
  'plans',
  'account',
  'profile',
  'auth',
  'overview'
]);

/**
 * Checks whether a given navigation tab is a Premium locked module
 */
export function isTabPremium(tabId: string): boolean {
  if (!tabId) return false;
  const cleanId = tabId.toLowerCase().trim();
  return !FREE_TABS.has(cleanId);
}

/**
 * Validates whether the user can access the target tab
 */
export function canAccessTab(tabId: string, sub: UserSubscriptionRecord | null): boolean {
  // 1. Free public tabs are always accessible
  if (!isTabPremium(tabId)) {
    return true;
  }

  // 2. Founder Passport 20008 permanently unlocks EVERYTHING
  if (isFounderPassportActive()) {
    return true;
  }

  // 3. Active Subscription check
  if (sub && sub.status === 'ACTIVE') {
    const isNotExpired = new Date(sub.expiryDate) > new Date();
    if (isNotExpired && (sub.tier === 'PRO' || sub.tier === 'ELITE')) {
      return true;
    }
  }

  return false;
}

/**
 * Formats remaining days
 */
export function getRemainingDays(expiryDateStr: string): string {
  try {
    const exp = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days > 1000) return 'Lifetime Access';
    return `${days} Days Remaining`;
  } catch {
    return 'Active';
  }
}

/**
 * Transaction history storage
 */
export function getPaymentTransactions(): UserSubscriptionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPaymentTransaction(record: UserSubscriptionRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPaymentTransactions();
    // Prepend new record, avoid duplicates
    const filtered = list.filter(r => r.id !== record.id);
    filtered.unshift(record);
    localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (e) {}
}
