import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionToken = request.cookies.get('wallet_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No active session', sessionExpired: true },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session is valid'
    });
  } catch (error) {
    console.error('Error in session check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error)) 
          : undefined 
      },
      { status: 500 }
    );
  }
}