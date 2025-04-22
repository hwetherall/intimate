import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client configured to use cookies
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Get auth token from header for debugging
    const authHeader = request.headers.get('Authorization');
    console.log("Middleware - Auth Header:", authHeader ? "Present" : "Missing");
    
    // Check cookie authentication
    const hasCookieAuth = request.cookies.has('supabase-auth-token');
    console.log("Middleware - Cookie Auth:", hasCookieAuth ? "Present" : "Missing");
    
    // Refresh session if expired - required for server components
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Middleware - Session:", session ? "Found" : "Not found");
    
    if (session) {
      // Log when the token expires
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown';
      console.log(`Middleware - Token expires at: ${expiresAt}`);
    }
    
    // Get the pathname from the request
    const { pathname } = request.nextUrl;

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

    // API paths that are authenticated but shouldn't redirect
    const apiPaths = [
      '/api/connect',
      '/api/feedback',
      '/api/recommendations',
    ];

    // For API routes, just let the API handle the auth check
    if (apiPaths.some(path => pathname.startsWith(path))) {
      // For API paths, add authorization if token exists
      if (session) {
        // Add session user ID to a custom header so API can use it
        res.headers.set('X-Supabase-User-ID', session.user.id);
      }
      return res;
    }

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
    return res;
  } catch (e) {
    // If there's an error, just continue with the request
    console.error('Middleware error:', e);
    return NextResponse.next();
  }
}

// Specify which routes the middleware should run on
export const config = {
  matcher: [
    // Apply to all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};