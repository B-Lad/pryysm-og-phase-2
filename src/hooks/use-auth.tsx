'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'master';
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  loginAsDemo: () => void;
  updateUserProfile: (data: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MASTER_EMAIL = 'LAD@admin.com';

function getSupabase() {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createBrowserClient } = require('@supabase/ssr');
    return createBrowserClient(url, key);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const demoUser = localStorage.getItem('pryysm_demo_user');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
        setIsLoading(false);
        return;
      }
    } catch {}

    const supabase = getSupabase();
    if (!supabase) { setIsLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        setSession(session);
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email!,
          role: session.user.email === MASTER_EMAIL ? 'master' : 'admin',
          avatar: session.user.user_metadata?.avatar_url,
        });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setSession(session);
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email!,
          role: session.user.email === MASTER_EMAIL ? 'master' : 'admin',
          avatar: session.user.user_metadata?.avatar_url,
        });
      } else {
        try {
          if (!localStorage.getItem('pryysm_demo_user')) { setSession(null); setUser(null); }
        } catch { setSession(null); setUser(null); }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth service unavailable. Please add Supabase env vars.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    router.push(email === MASTER_EMAIL ? '/master-admin' : '/dashboard');
    return { error: null };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth service unavailable. Please add Supabase env vars.' };
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return { error: error.message };
    router.push('/dashboard');
    return { error: null };
  };

  const loginAsDemo = () => {
    const demoUser: AppUser = { id: 'demo', name: 'Demo User', email: 'demo@printflow.com', role: 'admin' };
    try { localStorage.setItem('pryysm_demo_user', JSON.stringify(demoUser)); localStorage.setItem('isDemoUser', 'true'); } catch {}
    setUser(demoUser);
    router.push('/dashboard');
  };

  const logout = async () => {
    try { localStorage.removeItem('pryysm_demo_user'); localStorage.removeItem('isDemoUser'); } catch {}
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null); setSession(null);
    router.push('/login');
  };

  const updateUserProfile = (data: Partial<AppUser>) => setUser(prev => prev ? { ...prev, ...data } : null);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, session, isLoading, login, signup, logout, loginAsDemo, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
