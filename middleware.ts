import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip maintenance check for admin and API routes
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.startsWith('/maintenance')) {
    return NextResponse.next();
  }

  // Check maintenance mode
  try {
    const maintenanceResponse = await fetch(`${request.nextUrl.origin}/api/maintenance-status`, {
      cache: 'no-store'
    });
    
    if (maintenanceResponse.ok) {
      const { isMaintenanceMode } = await maintenanceResponse.json();
      
      if (isMaintenanceMode && !request.nextUrl.pathname.startsWith('/maintenance')) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }
  } catch (error) {
    // If maintenance check fails, continue normally
    console.error('Maintenance check failed:', error);
  }

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
  matcher: ['/dashboard/:path*', '/wallet/:path*', '/match/:path*', '/admin/:path*', '/api/protected/:path*', '/api/wallet/:path*', '/api/match/:path*', '/api/admin/:path*', '/((?!api|_next/static|_next/image|favicon.ico|maintenance).*)']
};
