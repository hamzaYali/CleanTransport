'use client';

import { useEffect } from 'react';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add overflow hidden to body when this layout is active
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Clean up when the component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return <>{children}</>;
} 