import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const config = {
  matcher: [
    '/api/ipfs/:path*',
    '/api/wallet/:path*',
    '/mint',
    '/mint/:path*',
    '/wallet',
    '/api/mint/:path*'
  ],
};

async function validateWalletSession(sessionToken: string): Promise<boolean> {
  try {
    if (!process.env.JWT_SECRET) return false;
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);
    
    return !!(payload.address && payload.exp && payload.exp > Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  const walletSession = request.cookies.get('wallet_session')?.value;

  if (currentPath.startsWith('/api/wallet/connect') ||
      currentPath.startsWith('/api/wallet/session') ||
      currentPath.startsWith('/api/wallet/disconnect')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  if ((currentPath === '/user' || currentPath.startsWith('/user/')) && 
      (!walletSession || !(await validateWalletSession(walletSession)))) {
    const redirectPath = request.nextUrl.pathname + request.nextUrl.search;
    const noAuthUrl = new URL('/no-auth', request.nextUrl.origin);
    noAuthUrl.searchParams.set('redirect', redirectPath);
    return NextResponse.redirect(noAuthUrl);
  }

  



  if (currentPath === '/wallet' && 
      (!walletSession || !(await validateWalletSession(walletSession)))) {
    const noAuthUrl = new URL('/no-auth', request.nextUrl.origin);
    noAuthUrl.searchParams.set('redirect', '/wallet');
    return NextResponse.redirect(noAuthUrl);
  }

  return NextResponse.next();
}