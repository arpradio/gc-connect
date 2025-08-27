import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function validateSessionToken(sessionToken: string): Promise<{ isValid: boolean; payload?: any }> {
  try {
    if (!process.env.JWT_SECRET) return { isValid: false };
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);
    
    if (payload.address && payload.exp && payload.exp > Date.now() / 1000) {
      return { isValid: true, payload };
    }
    
    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionToken = request.cookies.get('wallet_session')?.value;
    const includeBalance = request.nextUrl.searchParams.get('includeBalance') === 'true';

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No active session', hasSession: false },
        { status: 200 }
      );
    }

    const validationResult = await validateSessionToken(sessionToken);

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: 'Session expired or invalid', sessionExpired: true, hasSession: false },
        { status: 401 }
      );
    }

    const response: any = {
      success: true,
      message: 'Session is valid',
      hasSession: true,
      address: validationResult.payload.address
    };

    if (includeBalance && validationResult.payload.address) {
      try {
        const balanceResponse = await fetch(`${request.nextUrl.origin}/api/wallet/balance?address=${validationResult.payload.address}&_t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          response.balance = balanceData;
        } else {
          console.warn('Balance fetch failed:', balanceResponse.status);
          response.balanceError = 'Failed to fetch balance';
        }
      } catch (balanceError) {
        console.warn('Failed to fetch balance:', balanceError);
        response.balanceError = 'Failed to fetch balance';
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in session check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        hasSession: false,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error)) 
          : undefined 
      },
      { status: 500 }
    );
  }
}