import { NextRequest, NextResponse } from 'next/server';
import { validateWalletData, validateWalletConnection } from '@/app/lib/signature-verifier';
import { createSecureSessionToken } from '@/app/lib/auth';
import crypto from 'crypto';

const ALLOWED_ORIGINS = [
  `https://${process.env.NEXT_PUPLIC_URL}`,
  `https://www.${process.env.NEXT_PUPLIC_URL}`,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { token, wallet, returnUrl } = await request.json();

    if (!token || !wallet || !wallet.address) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const connectionData = { token, data: wallet };
    const isValid = validateWalletData(connectionData);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet data' },
        { status: 400 }
      );
    }

    const validationResult = await validateWalletConnection(connectionData);

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: `Signature validation failed: ${validationResult.message}` },
        { status: 401 }
      );
    }

    const sessionToken = await createSecureSessionToken({
      address: wallet.address,
      networkId: wallet.networkId,
      name: wallet.name
    });

    const allowedReturnUrls = [
      `https://${process.env.NEXT_PUPLIC_URL}`,
      `https://${process.env.NEXT_PUPLIC_URL}`,
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
    ].filter(Boolean);

    const sanitizedReturnUrl =
      returnUrl && allowedReturnUrls.some(url => returnUrl.startsWith(url))
        ? returnUrl
        : `https://${process.env.NEXT_PUPLIC_URL}`;

    const response = NextResponse.json(
      {
        success: true,
        message: 'Wallet connected successfully',
        returnUrl: sanitizedReturnUrl
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('wallet_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 60 * 60 * 2,
      domain: isProduction ? `.${process.env.NEXT_PUBLIC_URL}` : undefined
    });

    const csrfToken = crypto.randomUUID();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      path: '/',
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 60 * 60 * 2,
      domain: isProduction ? `.${process.env.NEXT_PUBLIC_URL}` : undefined
    });

    return response;
  } catch (error) {
    console.error('[Wallet Connect] Unexpected server error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong, please try again later'
      },
      { status: 500 }
    );
  }
}