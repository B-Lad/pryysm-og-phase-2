'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MASTER_EMAIL = 'LAD@admin.com';

function supabaseUserToAppUser(sbUser: SupabaseUser): AppUser {
  return {
    id: sbUser.id,
    name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
    email: sbUser.email!,
    role: sbUser.email === MASTER_EMAIL ? 'master' : 'admin',
    avatar: sbUser.user_metadata?.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check for demo session in localStorage
    const demoUser = localStorage.getItem('pryysm_demo_user');
    if (demoUser) {
      try { setUser(JSON.parse(demoUser)); } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(supabaseUserToAppUser(session.user));
        localStorage.removeItem('pryysm_demo_user');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(supabaseUserToAppUser(session.user));
        localStorage.removeItem('pryysm_demo_user');
      } else {
        const demoUser = localStorage.getItem('pryysm_demo_user');
        if (!demoUser) {
          setSession(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const role = email === MASTER_EMAIL ? 'master' : 'admin';
    router.push(role === 'master' ? '/master-admin' : '/dashboard');
    return { error: null };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    });
    if (error) return { error: error.message };
    localStorage.setItem('new_signup', 'true');
    router.push('/dashboard');
    return { error: null };
  };

  const loginAsDemo = () => {
    const demoUser: AppUser = { id: 'demo', name: 'Demo User', email: 'demo@pryysm.com', role: 'admin' };
    localStorage.setItem('pryysm_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('isDemoUser', 'true');
    setUser(demoUser);
    router.push('/dashboard');
  };

  const logout = async () => {
    localStorage.removeItem('pryysm_demo_user');
    localStorage.removeItem('isDemoUser');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, session, isLoading, login, signup, logout, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
