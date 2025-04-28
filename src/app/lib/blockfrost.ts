type OnChainMetadata = {
  name?: string;
  description?: string;
  image?: string;
  [key: string]: unknown;
};

type BlockfrostAssetMetadata = {
  asset: string;
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  quantity: string;
  initial_mint_tx_hash: string;
  mint_or_burn_count: number;
  onchain_metadata?: OnChainMetadata;
  metadata?: {
    name?: string;
    description?: string;
    ticker?: string;
    url?: string;
    logo?: string;
    decimals?: number;
  };
};

type AssetInfo = {
  policyId: string;
  assetName: string;
  metadata: {
    name: string;
    description?: string;
    image?: string;
    ticker?: string;
    decimals?: number;
  };
  fingerprint: string;
  quantity: string;
};

type WalletAmountItem = {
  unit: string;
  quantity: string;
};

type WalletExtendedResponse = {
  amount: WalletAmountItem[];
};

export async function getAssetInfo(assetId: string): Promise<AssetInfo | null> {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  const network = process.env.CARDANO_NETWORK || 'mainnet';

  if (!apiKey) {
    console.error('BLOCKFROST_API_KEY is not defined in environment variables');
    return null;
  }

  try {
    const baseUrl = network === 'preprod'
      ? 'https://cardano-preprod.blockfrost.io/api/v0'
      : 'https://cardano-mainnet.blockfrost.io/api/v0';

    const response = await fetch(`${baseUrl}/assets/${assetId}`, {
      headers: {
        'project_id': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as BlockfrostAssetMetadata;

    const policyId = data.policy_id;
    const assetName = data.asset_name;

    let name = '';
    let description = undefined;
    let image = undefined;
    let ticker = undefined;
    let decimals = undefined;

    if (data.onchain_metadata) {
      name = data.onchain_metadata.name || '';
      description = data.onchain_metadata.description;
      image = data.onchain_metadata.image;
    }

    if ((!name || name === '') && data.metadata) {
      name = data.metadata.name || '';
      description = data.metadata.description;
      ticker = data.metadata.ticker;
      decimals = data.metadata.decimals;
    }

    if (!name || name === '') {
      try {
        const hexString = assetName;
        const bytes = Buffer.from(hexString, 'hex');
        name = bytes.toString('utf-8');
      } catch {
        name = assetName;
      }
    }

    return {
      policyId,
      assetName,
      metadata: {
        name,
        description,
        image,
        ticker,
        decimals
      },
      fingerprint: data.fingerprint,
      quantity: data.quantity
    };
  } catch (error) {
    console.error('Error fetching asset info:', error);
    return null;
  }
}

export async function getWalletAssets(address: string): Promise<Record<string, AssetInfo> | null> {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  const network = process.env.CARDANO_NETWORK || 'mainnet';

  if (!apiKey) {
    console.error('BLOCKFROST_API_KEY is not defined in environment variables');
    return null;
  }

  try {
    const baseUrl = network === 'preprod'
      ? 'https://cardano-preprod.blockfrost.io/api/v0'
      : 'https://cardano-mainnet.blockfrost.io/api/v0';

    const response = await fetch(`${baseUrl}/addresses/${address}/extended`, {
      headers: {
        'project_id': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as WalletExtendedResponse;
    const assets = data.amount
      .filter((item: WalletAmountItem) => item.unit !== 'lovelace')
      .map((item: WalletAmountItem) => item.unit);

    const assetInfoMap: Record<string, AssetInfo> = {};

    await Promise.all(
      assets.map(async (assetId: string) => {
        const assetInfo = await getAssetInfo(assetId);
        if (assetInfo) {
          assetInfoMap[assetId] = assetInfo;
        }
      })
    );

    return assetInfoMap;
  } catch (error) {
    console.error('Error fetching wallet assets:', error);
    return null;
  }
}