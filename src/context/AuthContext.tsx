  import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
  import { jwtDecode } from 'jwt-decode';
  import { signIn, signUp, signOut as authSignOut, verifyToken } from '@/lib/auth';
  import type { Profile } from '@prisma/client';

  type AuthContextType = {
    session: { user: { id: string; email: string } } | null;
    profile: Profile | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
  };

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthContextType['session']>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
      try {
        // Import prisma here to avoid circular dependency issues during SSR
        const prisma = await import('@/lib/prisma').then((mod) => mod.default);
        const data = await prisma.profile.findUnique({
          where: { id: userId },
        });
        setProfile(data ?? null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      }
    }, []);

    // Check for existing token on load
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded: { userId: string; exp: number } = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 > Date.now()) {
            setSession({ user: { id: decoded.userId, email: '' } }); // Email not in JWT for security
            fetchProfile(decoded.userId).finally(() => setLoading(false));
            return;
          }
        } catch (error) {
          console.warn('Invalid token:', error);
        }
      }
      setLoading(false);
    }, [fetchProfile]);

    const signUp = useCallback(async (email: string, password: string, fullName: string) => {
      try {
        setLoading(true);
        const result = await signUp(email, password, fullName);
        setLoading(false);
        return result;
      } catch (error: any) {
        setLoading(false);
        return { error: error.message ?? 'Unknown error' };
      }
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
      try {
        setLoading(true);
        const result = await signIn(email, password);
        if (!result.error && result.token) {
          localStorage.setItem('token', result.token);
          // Decode token to get user ID for session
          const decoded: { userId: string } = jwtDecode(result.token);
          setSession({ user: { id: decoded.userId, email } });
          await fetchProfile(decoded.userId);
        }
        setLoading(false);
        return result;
      } catch (error: any) {
        setLoading(false);
        return { error: error.message ?? 'Unknown error' };
      }
    }, []);

    const signOut = useCallback(async () => {
      try {
        await authSignOut();
        localStorage.removeItem('token');
        setSession(null);
        setProfile(null);
      } catch (error) {
        console.error('Error during sign out:', error);
      }
    }, []);

    const refreshProfile = useCallback(async () => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    }, [session, fetchProfile]);

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
