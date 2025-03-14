import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { token, wallet } = body;

    if (!token || !wallet || !wallet.address) {
      console.error("Invalid request data received:", body);
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.log("=== Wallet Connection Data ===");
    console.log(`Address: ${wallet.address}`);
    console.log(`Name: ${wallet.name || "Unknown"}`);
    console.log(`Network ID: ${wallet.networkId}`);
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log("Complete wallet data:");
    console.log(JSON.stringify(wallet, null, 2));

    console.log("Full request body:");
    console.log(JSON.stringify(body, null, 2));

    console.log(`Wallet connected: ${wallet.address} (${wallet.name})`);

    const response = NextResponse.json({
      success: true,
      message: "Wallet connected successfully",
      wallet: {
        address: wallet.address,
        name: wallet.name,
        network: wallet.networkId === 1 ? "mainnet" : "testnet",
      },
    });

    response.cookies.set({
      name: "wallet_session",
      value: token,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Error processing wallet connection:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Wallet disconnection requested");

    const response = NextResponse.json({
      success: true,
      message: "Wallet disconnected successfully",
    });

    response.cookies.delete("wallet_session");

    return response;
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
