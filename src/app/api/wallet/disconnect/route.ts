// src/app/api/wallet/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("Wallet disconnect requested");
    
    // Get session to log disconnect
    const sessionCookie = request.cookies.get('wallet_session');
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        console.log("Disconnecting wallet:", {
          address: sessionData.address ? sessionData.address.substring(0, 8) + '...' : 'unknown',
          name: sessionData.name || 'unknown'
        });
      } catch (error) {
        console.log("Could not parse session data during disconnect");
      }
    }

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: "Wallet disconnected successfully" 
    });
    
    // Clear session cookie
    response.cookies.set('wallet_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    console.log("Wallet session cleared successfully");
    return response;

  } catch (error) {
    console.error("Disconnect API Error:", error);
    
    // Still try to clear the cookie even if there's an error
    const response = NextResponse.json(
      { success: false, error: "Error during disconnect, but session cleared" },
      { status: 500 }
    );
    
    response.cookies.set('wallet_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
    
    return response;
  }
}