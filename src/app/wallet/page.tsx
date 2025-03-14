"use client"

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/lib/walletProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CreditCard, Music, Loader2, Wallet, ExternalLink } from 'lucide-react';
import WalletAssetCard from '@/components/walletCard';
import { parseAssetMetadata } from '@/lib/metadataParser';

type AssetMetadata = {
  name?: string;
  description?: string;
  image?: string;
  [key: string]: any;
};

type Asset = {
  assetId: string;
  policyId: string;
  assetName: string;
  displayName: string;
  quantity: number;
  fingerprint: string;
  metadata_json: AssetMetadata;
};

type ParsedMetadata = {
  title: string;
  artists: string[];
  genres: string[];
  duration?: string;
  isExplicit?: boolean;
  isAIGenerated?: boolean;
  coverImage?: string;
};

export default function WalletPage() {
  const { isConnected, walletData, refreshBalance } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [isFetchingAssets, setIsFetchingAssets] = useState<boolean>(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const balanceRefreshAttempted = useRef<boolean>(false);

  const hexToUtf8 = (hex: string): string => {
    try {
      const bytes = new Uint8Array(
        hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      return new TextDecoder().decode(bytes);
    } catch {
      return hex;
    }
  };

  useEffect(() => {
    const fetchAssets = async () => {
      if (!isConnected || !walletData?.data.address) {
        setIsLoading(false);
        return;
      }

      setIsFetchingAssets(true);
      setIsLoading(true);
      setFetchError(null);

      try {
        if (!balanceRefreshAttempted.current) {
          setIsBalanceLoading(true);
          await refreshBalance();
          balanceRefreshAttempted.current = true;
          setIsBalanceLoading(false);
        }

        const timestamp = Date.now();
        const requestUrl = `/api/wallet/assets?address=${encodeURIComponent(walletData.data.address)}&_t=${timestamp}`;

        const response = await fetch(requestUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          if (response.status === 404 || response.status === 405) {
            setAssets([]);
            setIsLoading(false);
            setIsFetchingAssets(false);
            return;
          }

          setFetchError(`Unable to fetch wallet assets (Status: ${response.status})`);
          setAssets([]);
          setIsLoading(false);
          setIsFetchingAssets(false);
          return;
        }

        const data = await response.json();

        if (data.assets && Object.keys(data.assets).length > 0) {
          const processedAssets: Asset[] = Object.entries(data.assets).map(([assetId, info]: [string, any]) => {
            const quantity = walletData.data.assets?.[assetId] || 1;

            return {
              assetId,
              policyId: info.policyId,
              assetName: info.assetName,
              displayName: info.metadata.name || hexToUtf8(info.assetName),
              quantity,
              fingerprint: info.fingerprint,
              metadata_json: info.metadata
            };
          });

          setAssets(processedAssets);
        } else {
          setAssets([]);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching assets:', error);
          setAssets([]);
          setFetchError(error instanceof Error ? error.message : 'Failed to load assets');
        }
      } finally {
        setIsLoading(false);
        setIsFetchingAssets(false);
      }
    };

    fetchAssets();
  }, [isConnected, walletData?.data.address, refreshBalance, refreshTrigger]);

  const formatAda = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 ₳';
    }
    return `${amount.toLocaleString()} ₳`;
  };

  const isMusicToken = (asset: Asset): boolean => {
    const metadata = parseAssetMetadata(asset);
    return !!metadata.duration || metadata.genres.length > 0 || metadata.artists.length > 0;
  };

  const musicTokens = assets.filter(isMusicToken);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Wallet Not Connected</h1>
          <p className="mt-4 text-zinc-400">Please connect your wallet to view your assets.</p>
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-medium text-white mb-3">No Assets Found</h3>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          This wallet doesn't have any native tokens or NFTs. Asset tokens will appear here once you receive them.
        </p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 max-w-md mx-auto w-full">
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Browse Marketplace
          </Button>
          <Button
            variant="outline"
            className="bg-black/20 border-slate-700 hover:bg-black/40 text-zinc-300"
          >
            Receive Assets
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
          <ExternalLink className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-3">Could Not Load Assets</h3>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          {fetchError || "There was an issue retrieving your assets. Please try again later."}
        </p>
        <Button
          onClick={() => {
            setIsLoading(true);
            setFetchError(null);
            setRefreshTrigger(prev => prev + 1);
          }}
          className="bg-slate-700 hover:bg-slate-600 text-white"
        >
          Retry
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-white mb-6">Wallet Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-300 text-lg">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-amber-400 mr-3" />
              <div className="text-3xl font-bold text-white">
                {isBalanceLoading ? (
                  <div className="h-8 w-24 bg-slate-700 animate-pulse rounded"></div>
                ) : (
                  formatAda(walletData?.data.balance)
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-300 text-lg">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Music className="h-8 w-8 text-purple-400 mr-3" />
              <div className="text-3xl font-bold text-white">
                {isLoading ? (
                  <div className="h-8 w-12 bg-slate-700 animate-pulse rounded"></div>
                ) : (
                  assets.length
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          My Music Tokens ({isLoading ? '...' : musicTokens.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((_, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="h-40 w-full md:w-40 bg-slate-700 animate-pulse"></div>
                  <div className="p-4 flex-1">
                    <div className="h-6 w-3/4 mb-2 bg-slate-700 animate-pulse"></div>
                    <div className="h-4 w-1/2 mb-4 bg-slate-700 animate-pulse"></div>
                    <div className="h-4 w-full mb-2 bg-slate-700 animate-pulse"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : fetchError ? (
          renderErrorState()
        ) : musicTokens.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <Music className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">No Music Tokens Found</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                You don't have any music tokens in your wallet yet. Browse the marketplace to discover music NFTs.
              </p>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Browse Music Marketplace
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {musicTokens.map(asset => (
              <WalletAssetCard
                key={asset.assetId}
                asset={asset}
                onClick={() => setSelectedAsset(asset)}
              />
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="all-assets" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-6 bg-slate-800/70">
          <TabsTrigger value="all-assets">All Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="all-assets" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              All Assets ({isLoading ? '...' : assets.length})
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="bg-black/20 border-slate-700 hover:bg-black/40 text-zinc-300"
              onClick={() => {
                setIsLoading(true);
                setFetchError(null);
                balanceRefreshAttempted.current = false;
                setRefreshTrigger(prev => prev + 1);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg
                  className="h-4 w-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22h6v-6M13.5 18.9A9 9 0 0 1 3 12.1L3 16" />
                </svg>
              )}
              Refresh Assets
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((_, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="h-40 w-full md:w-40 bg-slate-700 animate-pulse"></div>
                    <div className="p-4 flex-1">
                      <div className="h-6 w-3/4 mb-2 bg-slate-700 animate-pulse"></div>
                      <div className="h-4 w-1/2 mb-4 bg-slate-700 animate-pulse"></div>
                      <div className="h-4 w-full mb-2 bg-slate-700 animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : fetchError ? (
            renderErrorState()
          ) : assets.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets.map(asset => (
                <WalletAssetCard
                  key={asset.assetId}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}