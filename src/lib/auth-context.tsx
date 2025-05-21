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

      try {
        // Check if user record exists in the users table
        const { data, error } = await supabase
          .from('users')
          .select('username, is_admin')
          .eq('id', supabaseUser.id)
          .single();

        // Set the user state - fallback to email if no username or errors occur
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: data?.username || supabaseUser.email || '',
          isAdmin: data?.is_admin || false,
        });
        setIsAuthenticated(true);

        // If we got a user record successfully, no need to try to create one
        if (data) return;
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Set basic user data from auth
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: supabaseUser.email || '',
          isAdmin: false,
        });
        setIsAuthenticated(true);
      }

      // Try to create a user record if we couldn't find one
      try {
        await supabase.from('users').insert({
          id: supabaseUser.id,
          username: supabaseUser.email,
          is_admin: false,
        });
      } catch (error) {
        console.error('Error creating user record:', error);
        // This is fine, we'll continue with just the auth user
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

  // Logout function - Fixed to handle frontend and auth separately
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear local state first
      setUser(null);
      setIsAuthenticated(false);
      
      // Sign out from Supabase auth
      await supabase.auth.signOut();
      
      // Force clear any storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
      
      // Hard redirect to refresh the app state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still force a redirect even if there's an error
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