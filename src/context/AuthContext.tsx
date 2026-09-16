import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, type Profile, type SessionUser } from '@/lib/api';

type AuthContextType = {
  session: { user: SessionUser } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: SessionUser } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const { user, profile } = await api.get<{ user: SessionUser | null; profile: Profile | null }>(
        '/api/auth/session'
      );
      setSession(user ? { user } : null);
      setProfile(profile);
    } catch (err) {
      console.error('Error loading session:', err);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { user } = await api.post<{ user: SessionUser }>('/api/auth/signup', {
        email,
        password,
        fullName,
      });
      setSession({ user });
      await loadSession();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  }, [loadSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await api.post<{ user: SessionUser }>('/api/auth/login', { email, password });
      setSession({ user });
      await loadSession();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  }, [loadSession]);

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // Always clear local state, even if the server call fails, so the
      // UI can never show a stale logged-in account after Sign Out.
      setSession(null);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
