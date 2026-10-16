import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUserProfile,
  signOutUser,
  isSupabaseConfigured,
  supabase,
  saveRuntimeSupabaseCredentials,
  clearRuntimeSupabaseCredentials,
  activeSupabaseUrl,
  activeSupabaseAnonKey
} from '../lib/supabaseClient';

export type AuthModalMode = 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'PROFILE';

interface AuthContextType {
  user: AuthUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendConnected: boolean;
  backendType: 'SUPABASE_CLOUD' | 'INSTITUTIONAL_VAULT';
  supabaseUrl: string;
  supabaseAnonKey: string;
  loginUser: (user: AuthUserProfile) => void;
  updateUserProfile: (updates: Partial<AuthUserProfile>) => void;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  initialAuthMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  saveBackendCredentials: (url: string, key: string) => boolean;
  clearBackendCredentials: () => void;
  activeOtpToast: { phone: string; code: string; expiresAt: number } | null;
  showOtpToast: (phone: string, code: string, durationSeconds?: number) => void;
  dismissOtpToast: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'ISHANT_AUTH_SESSION_V2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserProfile | null>(() => {
    // Restore persistent session immediately from local vault to prevent flash of logged-out state
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [initialAuthMode, setInitialAuthMode] = useState<AuthModalMode>('LOGIN');
  const [activeOtpToast, setActiveOtpToast] = useState<{ phone: string; code: string; expiresAt: number } | null>(null);

  // Sync session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. If Supabase Cloud is configured, check cloud session
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const cloudUser: AuthUserProfile = {
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Trader',
              avatarUrl: session.user.user_metadata?.avatar_url,
              provider: (session.user.app_metadata?.provider as any) || (session.user.phone ? 'phone' : 'email'),
              linkedProviders: [(session.user.app_metadata?.provider as any) || 'email'],
              createdAt: session.user.created_at,
              lastLoginAt: session.user.last_sign_in_at || new Date().toISOString(),
              role: 'institutional_trader',
              isVerified: Boolean(session.user.confirmed_at || session.user.phone_confirmed_at),
              isEmailVerified: Boolean(session.user.confirmed_at),
              isPhoneVerified: Boolean(session.user.phone_confirmed_at),
              subscriptionTier: 'PRO',
              subscriptionStatus: 'ACTIVE',
            };
            setUser(cloudUser);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cloudUser));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase session check error:', e);
        }
      }

      // 2. Check local vault persistent session
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        }
      } catch (e) {}

      if (isMounted) setIsLoading(false);
    };

    initAuth();

    // Listen to Supabase Cloud auth changes if active
    let authListenerUnsub: (() => void) | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const cloudUser: AuthUserProfile = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Trader',
            avatarUrl: session.user.user_metadata?.avatar_url,
            provider: (session.user.app_metadata?.provider as any) || (session.user.phone ? 'phone' : 'email'),
            linkedProviders: [(session.user.app_metadata?.provider as any) || 'email'],
            createdAt: session.user.created_at,
            lastLoginAt: new Date().toISOString(),
            role: 'institutional_trader',
            isVerified: Boolean(session.user.confirmed_at || session.user.phone_confirmed_at),
            isEmailVerified: Boolean(session.user.confirmed_at),
            isPhoneVerified: Boolean(session.user.phone_confirmed_at),
            subscriptionTier: 'PRO',
            subscriptionStatus: 'ACTIVE',
          };
          setUser(cloudUser);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cloudUser));

          // Background sync to public.profiles table
          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
              full_name: cloudUser.name,
              updated_at: new Date().toISOString(),
            });
          } catch {}
        }
      });
      authListenerUnsub = () => authListener.subscription.unsubscribe();
    }

    return () => {
      isMounted = false;
      if (authListenerUnsub) authListenerUnsub();
    };
  }, []);

  const loginUser = (newUser: AuthUserProfile) => {
    setUser(newUser);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
    setIsAuthModalOpen(false);
  };

  const updateUserProfile = (updates: Partial<AuthUserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const logout = async () => {
    setIsLoading(true);
    await signOutUser();
    setUser(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setIsLoading(false);
  };

  const openAuthModal = (mode: AuthModalMode = 'LOGIN') => {
    setInitialAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const showOtpToast = (phone: string, code: string, durationSeconds: number = 60) => {
    const expiresAt = Date.now() + durationSeconds * 1000;
    setActiveOtpToast({ phone, code, expiresAt });
  };

  const dismissOtpToast = () => setActiveOtpToast(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isBackendConnected: isSupabaseConfigured,
        backendType: isSupabaseConfigured ? 'SUPABASE_CLOUD' : 'INSTITUTIONAL_VAULT',
        supabaseUrl: activeSupabaseUrl,
        supabaseAnonKey: activeSupabaseAnonKey,
        loginUser,
        updateUserProfile,
        logout,
        isAuthModalOpen,
        initialAuthMode,
        openAuthModal,
        closeAuthModal,
        saveBackendCredentials: saveRuntimeSupabaseCredentials,
        clearBackendCredentials: clearRuntimeSupabaseCredentials,
        activeOtpToast,
        showOtpToast,
        dismissOtpToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
