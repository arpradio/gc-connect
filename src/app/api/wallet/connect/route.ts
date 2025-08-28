// src/app/api/wallet/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateWalletConnection, validateWalletData } from '@/app/lib/signature-verifier';

interface ConnectRequest {
  token: string;
  wallet: {
    address: string;
    name: string;
    networkId: number;
  };
  connectionData: any;
  returnUrl: string;
  isMobile: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConnectRequest = await request.json();
    
    console.log("API Connect - Received payload:", {
      hasToken: !!body.token,
      tokenLength: body.token?.length || 0,
      walletAddress: body.wallet?.address ? '[PRESENT]' : '[MISSING]',
      hasConnectionData: !!body.connectionData,
      hasSignature: !!body.connectionData?.sign?.signature,
      hasKey: !!body.connectionData?.sign?.key,
      hasHash: !!body.connectionData?.hash,
      dataStructure: body.connectionData ? Object.keys(body.connectionData) : [],
      connectionDataType: typeof body.connectionData
    });

    if (!body.connectionData || !body.wallet?.address) {
      console.error("Missing connection data or wallet address");
      return NextResponse.json(
        { success: false, error: "Missing connection data or wallet address" },
        { status: 400 }
      );
    }

    // ✅ FIX 1: Basic validation first
    const isValidData = validateWalletData(body.connectionData);
    
    console.log("Basic validation result:", {
      isValid: isValidData,
      hasData: !!body.connectionData.data,
      hasAddress: !!body.connectionData.data?.address,
      hasHash: !!body.connectionData.hash,
      hasSign: !!body.connectionData.sign
    });

    if (!isValidData) {
      console.error("Wallet data validation failed");
      return NextResponse.json(
        { success: false, error: "Invalid wallet data structure" },
        { status: 400 }
      );
    }

    // ✅ FIX 2: Signature validation
    console.log("Starting signature validation...");
    const signatureValidation = await validateWalletConnection(body.connectionData);
    
    console.log("Signature validation result:", {
      isValid: signatureValidation.isValid,
      message: signatureValidation.message,
      environment: signatureValidation.environment,
      walletName: signatureValidation.walletName,
      networkId: signatureValidation.networkId
    });

    if (!signatureValidation.isValid) {
      console.error("Signature validation failed:", signatureValidation.message);
      return NextResponse.json(
        { success: false, error: `Signature validation failed: ${signatureValidation.message}` },
        { status: 401 }
      );
    }

    // ✅ FIX 3: Create session after successful verification
    console.log("Creating wallet session...");
    const sessionData = {
      address: body.wallet.address,
      name: body.wallet.name,
      networkId: body.wallet.networkId,
      token: body.token,
      lastActivity: new Date().toISOString(),
      verified: true,
      connectedAt: new Date().toISOString()
    };

    console.log("Session data created:", {
      address: sessionData.address ? '[PRESENT]' : '[MISSING]',
      name: sessionData.name,
      networkId: sessionData.networkId,
      hasToken: !!sessionData.token,
      verified: sessionData.verified
    });

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: "Wallet connected successfully",
      session: {
        address: sessionData.address,
        name: sessionData.name,
        networkId: sessionData.networkId,
        verified: sessionData.verified
      }
    });

    // ✅ FIX 4: Set secure session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    };

    response.cookies.set('wallet_session', JSON.stringify(sessionData), cookieOptions);
    
    console.log("Session cookie set with options:", cookieOptions);
    console.log("Wallet connection successful for address:", sessionData.address.substring(0, 8) + '...');

    return response;

  } catch (error) {
    console.error("API Connect Error:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error during wallet connection",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}