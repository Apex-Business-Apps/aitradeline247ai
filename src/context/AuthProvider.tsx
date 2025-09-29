import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'admin' | 'user' | 'moderator' | null;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'moderator' | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });
      
      // Log authentication attempt securely
      try {
        await supabase.functions.invoke('enhanced-security', {
          body: {
            event_type: error ? 'auth_failed' : 'auth_success',
            event_data: { method: 'email_otp' }
          }
        });
      } catch (analyticsError) {
        // Silently fail analytics to not break auth flow
        if (import.meta.env.DEV) {
          console.warn('Security logging failed:', analyticsError);
        }
      }
      
      // Return generic error message to prevent email enumeration
      return { 
        error: error ? new Error('Invalid credentials or account not found') : null 
      };
    } catch (err) {
      // Generic error message for security
      return { error: new Error('Authentication failed. Please try again.') };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Log sign out event
      try {
        await supabase.functions.invoke('enhanced-security', {
          body: {
            event_type: 'auth_signout',
            event_data: { timestamp: Date.now() }
          }
        });
      } catch (analyticsError) {
        if (import.meta.env.DEV) {
          console.warn('Security logging failed:', analyticsError);
        }
      }
      
      return { error };
    } catch (err) {
      return { error: new Error('Sign out failed. Please try again.') };
    }
  };

  const isAdmin = () => userRole === 'admin';

  const value = {
    user,
    session,
    loading,
    userRole,
    signInWithEmail,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};