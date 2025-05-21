'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Define our types
type User = {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
} | null;

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a direct Supabase client - no middlemen
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to check auth state on load and setup listeners
  useEffect(() => {
    // Function to set the user from the Supabase user
    const setUserState = async (supabaseUser: any) => {
      if (!supabaseUser) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Check if user record exists in the users table
      const { data } = await supabase
        .from('users')
        .select('username, is_admin')
        .eq('id', supabaseUser.id)
        .single();

      // Set the user state
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: data?.username || supabaseUser.email || '',
        isAdmin: data?.is_admin || false,
      });
      setIsAuthenticated(true);

      // If no user record, create one
      if (!data) {
        try {
          await supabase.from('users').insert({
            id: supabaseUser.id,
            username: supabaseUser.email,
            is_admin: false,
          });
        } catch (error) {
          console.error('Error creating user record:', error);
        }
      }
    };

    // Check current session
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (session?.user) {
          await setUserState(session.user);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await setUserState(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    // Check session on mount
    checkSession();

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return !error;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 