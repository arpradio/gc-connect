import { NextRequest, NextResponse } from 'next/server';
import { validateWalletData, validateWalletConnection } from '@/app/lib/signature-verifier';
import { createSecureSessionToken } from '@/app/lib/auth';
import crypto from 'crypto';

const ALLOWED_ORIGINS = [
  'https://arpradio.media',
  'https://www.arpradio.media',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const origin = request.headers.get('origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    let rawBody = '';
    try {
      const clonedReq = request.clone();
      rawBody = await clonedReq.text();

      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Empty request body' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('[Wallet Connect] Failed to read request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error('[Wallet Connect] Invalid JSON in request body:', error);
      return NextResponse.json(
        { success: false, error: 'Malformed request data' },
        { status: 400 }
      );
    }

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Missing request body' },
        { status: 400 }
      );
    }

    const { token, wallet, connectionData, returnUrl } = body;

    if (!token || !wallet || !wallet.address) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

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
      'https://arpradio.media',
      'https://www.arpradio.media',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
    ].filter(Boolean);

    const sanitizedReturnUrl =
      returnUrl && allowedReturnUrls.some(url => returnUrl.startsWith(url))
        ? returnUrl
        : 'https://arpradio.media';

    const response = NextResponse.json(
      {
        success: true,
        message: 'Wallet connected successfully',
        returnUrl: sanitizedReturnUrl
      },
      { status: 200 }
    );

    response.cookies.set('wallet_session', sessionToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2
    });

    const csrfToken = crypto.randomUUID();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false,
      secure: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2
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

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin');

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
