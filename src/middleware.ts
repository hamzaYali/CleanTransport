import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if exists
  const { data: { session } } = await supabase.auth.getSession();

  // Get the current URL and path
  const url = req.nextUrl;
  const path = url.pathname;
  const isAuthPage = path === '/login';
  
  // Define which paths require admin authentication
  const adminPaths = [
    '/admin',
    '/api/admin',
  ];
  
  // Check if the current path is an admin path or includes admin actions
  const isAdminPath = adminPaths.some(adminPath => path.startsWith(adminPath));
  const isAdminAction = path.includes('/edit') || path.includes('/add') || path.includes('/delete');
  
  // Redirect to login if trying to access admin routes without a session
  if (!session && (isAdminPath || isAdminAction) && !path.startsWith('/_next') && !path.startsWith('/api/public')) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If session exists and trying to access login page, redirect to home
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
} 