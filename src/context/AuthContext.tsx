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

interface AuthContextType {
  user: AuthUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  loginUser: (user: AuthUserProfile) => void;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  saveBackendCredentials: (url: string, key: string) => boolean;
  clearBackendCredentials: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check real Supabase live session if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const liveUser: AuthUserProfile = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            provider: (session.user.app_metadata?.provider as any) || (session.user.phone ? 'phone' : 'email'),
            createdAt: session.user.created_at,
            role: 'institutional_trader',
            isVerified: Boolean(session.user.confirmed_at || session.user.phone_confirmed_at),
          };
          setUser(liveUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }).catch(() => {
        setUser(null);
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const liveUser: AuthUserProfile = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            provider: (session.user.app_metadata?.provider as any) || (session.user.phone ? 'phone' : 'email'),
            createdAt: session.user.created_at,
            role: 'institutional_trader',
            isVerified: Boolean(session.user.confirmed_at || session.user.phone_confirmed_at),
          };
          setUser(liveUser);

          // Sync with public.profiles table in background
          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
              full_name: liveUser.name,
              updated_at: new Date().toISOString()
            });
          } catch (e) {
            // Ignore if table hasn't been created yet
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const loginUser = (newUser: AuthUserProfile) => {
    setUser(newUser);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await signOutUser();
    setUser(null);
    setIsLoading(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isBackendConnected: isSupabaseConfigured,
        supabaseUrl: activeSupabaseUrl,
        supabaseAnonKey: activeSupabaseAnonKey,
        loginUser,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        saveBackendCredentials: saveRuntimeSupabaseCredentials,
        clearBackendCredentials: clearRuntimeSupabaseCredentials,
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
