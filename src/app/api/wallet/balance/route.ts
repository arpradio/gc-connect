import { NextRequest, NextResponse } from 'next/server';

type AddressBalance = {
  lovelace: string;
  assets?: Record<string, number>;
};

type BlockfrostAmountItem = {
  unit: string;
  quantity: string;
};

type BlockfrostAddressResponse = {
  address: string;
  amount: BlockfrostAmountItem[];
  stake_address: string;
  type: string;
  script: boolean;
};

// Enhanced balance fetch API in wallet/balance/route.ts
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
    // Remove any timestamp or cache-busting params
    const cleanAddress = address.split('?')[0];
    
    console.log('Fetching balance data from Blockfrost for address:', cleanAddress);
    const balance = await fetchAddressBalance(cleanAddress);

    // Add cache control headers to prevent browser caching
    return NextResponse.json(balance, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { lovelace: '0' },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
const fetchAddressBalance = async (address: string): Promise<AddressBalance> => {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  const network = process.env.CARDANO_NETWORK || 'mainnet';

  if (!apiKey) {
    console.log('BLOCKFROST_API_KEY is not defined, returning null data');
    return {
      lovelace: 'NaN', 
    };
  }

  try {
    const baseUrl = network === 'preprod'
      ? 'https://cardano-preprod.blockfrost.io/api/v0'
      : 'https://cardano-mainnet.blockfrost.io/api/v0';

    const response = await fetch(`${baseUrl}/addresses/${address}`, {
      headers: {
        'project_id': apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { lovelace: '0' };
      }

      console.error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      return { lovelace: '0' };
    }

    const data = await response.json() as BlockfrostAddressResponse;
    const lovelace = data.amount.find(item => item.unit === 'lovelace')?.quantity || '0';
    const assets = data.amount
      .filter(item => item.unit !== 'lovelace')
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.unit] = parseInt(item.quantity);
        return acc;
      }, {});

    return {
      lovelace,
      assets: Object.keys(assets).length > 0 ? assets : undefined
    };
  } catch (error) {
    console.error('Error fetching address balance:', error);
    return { lovelace: '0' };
  }
};