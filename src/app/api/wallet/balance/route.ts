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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const initialConnect = searchParams.get('initial') === 'true';

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  try {
    // On initial connect, the balance should already be in the wallet data
    // No need to fetch from Blockfrost
    if (initialConnect) {
      console.log('Initial connect - using wallet provided balance');
      // Return an empty response since the balance is already in the wallet data
      return NextResponse.json({ lovelace: '0' });
    }

    // For subsequent balance refreshes, fetch from Blockfrost
    console.log('Fetching balance data from Blockfrost');
    const balance = await fetchAddressBalance(address);

    // Return the balance data
    return NextResponse.json(balance);

  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { lovelace: '0' } // Return zero balance on error instead of an error response
    );
  }
}

const fetchAddressBalance = async (address: string): Promise<AddressBalance> => {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  const network = process.env.CARDANO_NETWORK || 'mainnet';

  if (!apiKey) {
    console.log('BLOCKFROST_API_KEY is not defined, returning mock data');
    // Return sample data for testing
    return {
      lovelace: '25000000', // 25 ADA in lovelace
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
      // Add cache control headers to avoid stale data
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { lovelace: '0' };
      }

      console.error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      // Return zero balance instead of throwing an error
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
    // Return zero balance instead of throwing an error
    return { lovelace: '0' };
  }
};