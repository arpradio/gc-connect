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
    if (initialConnect) {
      console.log('Initial connect - using wallet provided balance');
      return NextResponse.json({ lovelace: '0' });
    }

    console.log('Fetching balance data from Blockfrost');
    const balance = await fetchAddressBalance(address);
    return NextResponse.json(balance);

  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { lovelace: '0' } 
    );
  }
}

const fetchAddressBalance = async (address: string): Promise<AddressBalance> => {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  const network = process.env.CARDANO_NETWORK || 'mainnet';

  if (!apiKey) {
    console.log('BLOCKFROST_API_KEY is not defined, returning mock data');
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
      return { lovelace: 'NaN' };
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