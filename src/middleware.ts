import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current URL and path
  const url = req.nextUrl;
  const path = url.pathname;

  // Allow access to auth and login pages
  if (path === '/auth' || path === '/login') {
    return res;
  }

  // Check for site authentication first
  const siteAuthenticated = req.cookies.get('site_authenticated')?.value === 'true';
  if (!siteAuthenticated && path !== '/auth') {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  // Refresh session if exists for admin authentication
  const { data: { session } } = await supabase.auth.getSession();
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

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /examples (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|examples|[\\w-]+\\.\\w+).*)',
  ],
}; 