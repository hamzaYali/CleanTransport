'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaUser, FaLock } from 'react-icons/fa';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { signIn, user } = useAuth();
  
  // If already authenticated, redirect to home
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Create a timeout to reset loading state if the login takes too long
    const loginTimeout = setTimeout(() => {
      setIsLoading(false);
      setError('Login request timed out. Please try again.');
    }, 10000); // 10 seconds timeout
    
    try {
      const { error: signInError } = await signIn(loginEmail, loginPassword);
      
      // Clear timeout since we got a response
      clearTimeout(loginTimeout);
      
      if (!signInError) {
        // Successful login handled by auth state change listener
        toast.success('Login successful!');
        router.push(redirectPath);
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
      }
    } catch (err) {
      // Clear timeout since we caught an error
      clearTimeout(loginTimeout);
      
      console.error('Login error:', err);
      setError('An error occurred during login');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center h-screen bg-[#f5f7fa] overflow-hidden no-scroll-login">
      <div className="w-full max-w-[450px] px-4">
        <Card className="w-full shadow-[0_15px_35px_rgba(0,0,0,0.15)] border-0 overflow-hidden rounded-lg">
          <div className="gradient-header-animation h-20 flex items-center justify-center">
            <CardTitle className="text-2xl font-bold text-white">Transport Dashboard</CardTitle>
          </div>
          
          <form onSubmit={handleLogin}>
            <CardContent className="p-6 space-y-4 login-form-content">
              {error && (
                <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-gray-700 font-medium">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10 bg-[#EEF2FB] border-0 rounded-xl h-12 transition-all duration-300 focus:bg-[#f5f7ff] focus:ring focus:ring-[#a33a47]/20"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 bg-[#EEF2FB] border-0 rounded-xl h-12 transition-all duration-300 focus:bg-[#f5f7ff] focus:ring focus:ring-[#a33a47]/20"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="glossy-button w-full h-12 rounded-full relative overflow-hidden"
                >
                  {isLoading ? (
                    <span className="relative z-10 flex items-center justify-center">
                      <span className="mr-2">Logging in</span>
                      <span className="loading-dots">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                      </span>
                    </span>
                  ) : (
                    <span className="relative z-10">Login</span>
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t px-6 py-3 bg-gray-50">
              <Link 
                href="/" 
                className="text-sm text-gray-500 hover:text-[#a33a47] transition-colors"
              >
                Return to Dashboard
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 