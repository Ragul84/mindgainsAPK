// contexts/AuthContext.tsx - Enhanced with Loading States
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { LoadingScreen } from '@/components/LoadingScreen';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    console.log('🔄 Initializing auth...');
    
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        } else {
          console.log('📊 Initial session:', session ? 'Found' : 'None');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('💥 Session fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in');
            setAuthLoading(false);
            break;
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            setAuthLoading(false);
            break;
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            break;
          default:
            setAuthLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🚀 Attempting sign in...');
      setAuthLoading(true);
      setAuthMessage('Signing you in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Sign in failed:', error.message);
        setAuthLoading(false);
        return { error };
      }

      console.log('✅ Sign in successful');
      setAuthMessage('Welcome back!');
      
      // Small delay for smooth transition
      setTimeout(() => {
        setAuthLoading(false);
        router.replace('/(tabs)');
      }, 1000);

      return { error: null };
    } catch (err) {
      console.error('💥 Sign in error:', err);
      setAuthLoading(false);
      return { error: { message: 'Sign in failed' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🚀 Attempting sign up...');
      setAuthLoading(true);
      setAuthMessage('Creating your account...');
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        console.error('❌ Sign up failed:', error.message);
        setAuthLoading(false);
        return { error };
      }

      console.log('✅ Sign up successful');
      
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setAuthMessage('Account created! Check your email...');
        setTimeout(() => {
          setAuthLoading(false);
        }, 1500);
      } else if (data?.session) {
        setAuthMessage('Welcome to MindGains!');
        setTimeout(() => {
          setAuthLoading(false);
          router.replace('/(tabs)');
        }, 1000);
      } else {
        setAuthLoading(false);
      }

      return { data, error: null };
    } catch (err) {
      console.error('💥 Sign up error:', err);
      setAuthLoading(false);
      return { error: { message: 'Sign up failed' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚀 Signing out...');
      setAuthLoading(true);
      setAuthMessage('Signing you out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out failed:', error);
      } else {
        console.log('✅ Signed out successfully');
        setAuthMessage('See you later!');
      }
      
      setTimeout(() => {
        setAuthLoading(false);
        router.replace('/(auth)');
      }, 1000);
    } catch (err) {
      console.error('💥 Sign out error:', err);
      setAuthLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
      } else {
        console.log('✅ Session refreshed');
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (err) {
      console.error('💥 Session refresh error:', err);
    }
  };

  // Show loading screen during initial auth check
  if (loading) {
    return (
      <LoadingScreen 
        message="Welcome to MindGains"
        subMessage="Preparing your learning experience..."
      />
    );
  }

  // Show auth loading during sign in/up/out
  if (authLoading) {
    return (
      <LoadingScreen 
        message={authMessage}
        subMessage="Please wait a moment..."
      />
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};