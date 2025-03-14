import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const sessionToken = request.cookies.get('wallet_session')?.value;

    if (sessionToken) {

      console.log('Wallet disconnected:', sessionToken);
    }

    const response = NextResponse.json(
      { success: true, message: 'Wallet disconnected successfully' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'wallet_session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Error in wallet disconnection:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};