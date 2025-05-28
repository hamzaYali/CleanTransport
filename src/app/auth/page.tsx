'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { FaLock, FaKey } from 'react-icons/fa';
import { motion } from 'framer-motion';

const INTERNAL_PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD;

export default function AuthPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const isAuthenticated = Cookies.get('site_authenticated') === 'true';
    if (isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (password === INTERNAL_PASSWORD) {
      // Set cookie to expire in 7 days
      Cookies.set('site_authenticated', 'true', { expires: 7 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Add slight delay for better UX
      toast.success('Access granted');
      router.push('/');
    } else {
      toast.error('Invalid password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <Card className="border border-gray-100 shadow-lg">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
              <FaLock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">CIRA TRANSPORT</CardTitle>
            <CardDescription className="text-gray-500">
              Please enter the access password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <FaKey className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-4 py-6 bg-white/50 border-gray-200 focus:border-primary focus:ring-primary"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-medium transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </div>
                ) : (
                  'Access Site'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 