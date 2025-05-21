'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TABLES } from './supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

type User = {
  id: string;
  username: string;
  isAdmin: boolean;
} | null;

type AuthContextType = {
  user: User;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        if (session) {
          // Get user details from the users table
          const { data: userData, error: userError } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.error('Error getting user data:', userError);
            setIsLoading(false);
            return;
          }
          
          // Set user state
          setUser({
            id: session.user.id,
            username: userData.username || session.user.email || '',
            isAdmin: userData.is_admin || false,
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error in session check:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session) {
          // Get user details when signed in
          const { data: userData, error: userError } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!userError && userData) {
            setUser({
              id: session.user.id,
              username: userData.username || session.user.email || '',
              isAdmin: userData.is_admin || false,
            });
            setIsAuthenticated(true);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear user state on sign out
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );
    
    // Check session on component mount
    checkSession();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    // Clear any existing login attempts that might be pending
    setIsLoading(true);
    
    try {
      // Simple validation
      if (!email || !password) {
        return false;
      }
      
      // Create a promise that will resolve after a timeout
      const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
        setTimeout(() => {
          resolve({
            data: null,
            error: new Error('Login request timed out')
          });
        }, 8000); // 8 second timeout
      });
      
      // Race the login request with the timeout
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise
      ]);
      
      if (error) {
        console.error('Error signing in:', error);
        return false;
      }
      
      // Add a small delay to allow auth state listener to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we have a session after the login
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error in login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear local state immediately to ensure UI reflects logout
      setUser(null);
      setIsAuthenticated(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This ensures all devices are logged out
      });
      
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Force a hard refresh to clear any cached state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error in logout:', error);
      // Still redirect even if there's an error
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 