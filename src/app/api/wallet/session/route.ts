// src/app/api/wallet/session/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface AddressBalance {
  lovelace: string;
  assets?: Record<string, number>;
}

async function fetchWalletBalance(address: string): Promise<AddressBalance | null> {
  try {
    // Replace with your actual balance API logic
    const url = `/api/wallet/balance?address=${address}`;
    const response = await fetch(new URL(url, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.status === 401) {
      return { lovelace: "-1" };
    }
    
    if (!response.ok) return { lovelace: "0" };

    const data = await response.json();

    if (data.error) {
      console.error("Balance API error:", data.error);
      return { lovelace: "0" };
    }

    return data;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return { lovelace: "0" };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('wallet_session');
    
    if (!sessionCookie) {
      console.log("No wallet session cookie found");
      return NextResponse.json(
        { success: false, error: "No active session" },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error("Failed to parse session cookie:", error);
      return NextResponse.json(
        { success: false, error: "Invalid session data" },
        { status: 401 }
      );
    }

    // Validate session data
    if (!sessionData.address || !sessionData.verified) {
      console.error("Invalid session data structure:", {
        hasAddress: !!sessionData.address,
        verified: sessionData.verified
      });
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    // Check if balance is requested
    const { searchParams } = new URL(request.url);
    const includeBalance = searchParams.get('includeBalance') === 'true';

    const responseData: any = {
      success: true,
      session: {
        address: sessionData.address,
        name: sessionData.name,
        networkId: sessionData.networkId,
        verified: sessionData.verified,
        lastActivity: sessionData.lastActivity
      }
    };

    if (includeBalance) {
      console.log("Fetching balance for session...");
      try {
        const balance = await fetchWalletBalance(sessionData.address);
        responseData.balance = balance;
        
        if (balance?.lovelace === "-1") {
          console.warn("Balance fetch indicates session expired");
          responseData.balanceError = "Session expired";
        }
      } catch (error) {
        console.error("Failed to fetch balance for session:", error);
        responseData.balanceError = "Failed to fetch balance";
        responseData.balance = { lovelace: "0" };
      }
    }

    // Update last activity
    const updatedSessionData = {
      ...sessionData,
      lastActivity: new Date().toISOString()
    };

    const response = NextResponse.json(responseData);
    
    // Update session cookie with new activity time
    response.cookies.set('wallet_session', JSON.stringify(updatedSessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error("Session API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: "Session cleared" 
    });
    
    response.cookies.set('wallet_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;

  } catch (error) {
    console.error("Session DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}