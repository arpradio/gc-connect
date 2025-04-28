import { NextRequest, NextResponse } from 'next/server';
import { getWalletAssets } from '@/app/lib/blockfrost';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  try {
    const assets = await getWalletAssets(address);

    if (!assets) {
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assets });

  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}