import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the path requires authentication
  const protectedPaths = ['/dashboard', '/wallet', '/match', '/admin'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // In a real application, you would validate the JWT token here
    // For client-side protected routes, we'll let the component handle the redirect
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/wallet/:path*', '/match/:path*', '/admin/:path*', '/api/protected/:path*', '/api/wallet/:path*', '/api/match/:path*', '/api/admin/:path*']
};
