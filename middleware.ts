import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
  
  // Refresh session if expired - required for server components
  await supabase.auth.getSession();
  
  // Get the pathname from the request
  const { pathname } = request.nextUrl;

  // Check auth state
  const {
    data: { session },
  } = await supabase.auth.getSession();

 // Auth required paths
const authRequiredPaths = [
  '/profile',
  '/profile/preferences',
  '/recommendations',
  // Add other protected routes here
];

  // Auth pages
  const authPages = [
    '/auth/login',
    '/auth/signup',
    '/auth/invite',
  ];

  // Check if the route requires authentication
  const requiresAuth = authRequiredPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Check if the route is an auth page
  const isAuthPage = authPages.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Redirect unauthenticated users to login page if trying to access protected routes
  if (requiresAuth && !session) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users to profile page if trying to access auth pages
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

// Specify which routes the middleware should run on
export const config = {
  matcher: [
    // Apply to all paths except static files, api routes, etc.
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};