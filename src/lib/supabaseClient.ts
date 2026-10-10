import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase configuration from environment variables or runtime settings
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const runtimeUrl = typeof window !== 'undefined' ? localStorage.getItem('ISHANT_SUPABASE_URL') || '' : '';
const runtimeAnonKey = typeof window !== 'undefined' ? localStorage.getItem('ISHANT_SUPABASE_ANON_KEY') || '' : '';

export const activeSupabaseUrl = envUrl || runtimeUrl;
export const activeSupabaseAnonKey = envAnonKey || runtimeAnonKey;

export const isSupabaseConfigured = Boolean(
  activeSupabaseUrl &&
  activeSupabaseAnonKey &&
  !activeSupabaseUrl.includes('placeholder') &&
  !activeSupabaseAnonKey.includes('placeholder') &&
  activeSupabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(activeSupabaseUrl, activeSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function saveRuntimeSupabaseCredentials(url: string, anonKey: string): boolean {
  if (!url || !anonKey || !url.startsWith('https://')) return false;
  localStorage.setItem('ISHANT_SUPABASE_URL', url.trim());
  localStorage.setItem('ISHANT_SUPABASE_ANON_KEY', anonKey.trim());
  window.location.reload();
  return true;
}

export function clearRuntimeSupabaseCredentials(): void {
  localStorage.removeItem('ISHANT_SUPABASE_URL');
  localStorage.removeItem('ISHANT_SUPABASE_ANON_KEY');
  window.location.reload();
}

export interface AuthUserProfile {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'phone';
  createdAt: string;
  role: 'institutional_trader' | 'macro_analyst' | 'pro_investor';
  isVerified: boolean;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const MISSING_BACKEND_ERROR =
  'Authentication backend not connected. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or enter your project keys in the Backend Setup panel.';

/**
 * 1. REAL CONTINUE WITH GOOGLE OAUTH
 */
export async function signInWithGoogle(): Promise<AuthResponse<{ url?: string }>> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: MISSING_BACKEND_ERROR };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.url) {
      // Redirect to genuine Google consent and login screen
      window.location.href = data.url;
      return { success: true, data: { url: data.url } };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Google OAuth failed to initialize.' };
  }
}

/**
 * 2. REAL EMAIL & PASSWORD REGISTRATION
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResponse<{ user?: AuthUserProfile; emailConfirmationRequired: boolean }>> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: MISSING_BACKEND_ERROR };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const isConfirmed = Boolean(data.user?.confirmed_at || data.session);
    const user: AuthUserProfile | undefined = data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          name: fullName || data.user.email?.split('@')[0],
          provider: 'email',
          createdAt: data.user.created_at,
          role: 'institutional_trader',
          isVerified: isConfirmed,
        }
      : undefined;

    return {
      success: true,
      data: {
        user,
        emailConfirmationRequired: !isConfirmed,
      },
      message: isConfirmed
        ? 'Account registered and logged in successfully.'
        : 'Registration successful! Verification email sent. Please check your inbox before logging in.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration request failed.' };
  }
}

/**
 * 2B. REAL EMAIL & PASSWORD SIGN IN
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse<{ user: AuthUserProfile }>> {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: MISSING_BACKEND_ERROR };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'No user returned from authentication server.' };
    }

    const user: AuthUserProfile = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      provider: 'email',
      createdAt: data.user.created_at,
      role: 'institutional_trader',
      isVerified: Boolean(data.user.confirmed_at),
    };

    return { success: true, data: { user }, message: 'Authentication verified successfully.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login request failed.' };
  }
}

/**
 * 2C. REAL PASSWORD RESET / FORGOT PASSWORD
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResponse> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: MISSING_BACKEND_ERROR };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/#reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `Password reset link sent to ${email}. Please check your email inbox.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Password reset request failed.' };
  }
}

/**
 * 3. REAL PHONE SMS OTP DISPATCH
 */
export async function sendPhoneOtp(
  fullPhoneNumber: string
): Promise<AuthResponse<{ retryAfterSeconds: number }>> {
  const cleaned = fullPhoneNumber.replace(/\s+/g, '');

  // E.164 verification: + followed by 8 to 15 digits
  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return {
      success: false,
      error: 'Invalid phone format. Please include your country code, e.g., +91 9876543210.',
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: MISSING_BACKEND_ERROR };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: cleaned,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { retryAfterSeconds: 60 },
      message: `Real SMS OTP dispatched to ${cleaned}. Please check your phone for the 6-digit code.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'SMS OTP request failed.' };
  }
}

/**
 * 3B. REAL PHONE SMS OTP VERIFICATION
 */
export async function verifyPhoneOtp(
  fullPhoneNumber: string,
  otpCode: string
): Promise<AuthResponse<{ user: AuthUserProfile }>> {
  const cleaned = fullPhoneNumber.replace(/\s+/g, '');
  const trimmedOtp = otpCode.trim();

  if (!/^\d{6}$/.test(trimmedOtp)) {
    return { success: false, error: 'OTP must be exactly 6 numeric digits.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: MISSING_BACKEND_ERROR };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: cleaned,
      token: trimmedOtp,
      type: 'sms',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'OTP verification succeeded but no user session was established.' };
    }

    const user: AuthUserProfile = {
      id: data.user.id,
      phone: data.user.phone || cleaned,
      name: `Trader ${cleaned.slice(-4)}`,
      provider: 'phone',
      createdAt: data.user.created_at,
      role: 'institutional_trader',
      isVerified: true,
    };

    return {
      success: true,
      data: { user },
      message: 'Mobile number verified successfully.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'OTP verification failed.' };
  }
}

/**
 * 4. REAL SIGN OUT
 */
export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
}
