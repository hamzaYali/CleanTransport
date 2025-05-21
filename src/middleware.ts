import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const { supabase, response } = createClient(request);

  // Refresh the session if it exists
  await supabase.auth.getSession();

  return response;
}

// Specify the routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/* (public files)
     * - auth/* (auth routes - customize this if needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 