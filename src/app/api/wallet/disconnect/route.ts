import { NextRequest, NextResponse } from 'next/server';

function buildDisconnectResponse(): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: 'Wallet disconnected successfully'
  });

  response.cookies.delete('wallet_session');
  response.cookies.delete('csrf_token');

  return response;
}

export async function POST(_request: NextRequest) {
  try {
    return buildDisconnectResponse();
  } catch (error) {
    console.error('[Wallet Disconnect][POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect wallet'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    return buildDisconnectResponse();
  } catch (error) {
    console.error('[Wallet Disconnect][GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect wallet'
      },
      { status: 500 }
    );
  }
}
