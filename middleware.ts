import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/auth',
  '/api/auth/linkedin',
  '/api/auth/linkedin/callback',
  '/api/cron/daily', // protected by CRON_SECRET, not session
  '/_next',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get('li_authed');
  if (!session?.value) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
