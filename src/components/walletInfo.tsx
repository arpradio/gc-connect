import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, ExternalLink, Copy, Check, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AddressInfo = {
  readonly network?: string;
  readonly networkId?: number;
  readonly rewardAddress?: string;
  readonly paymentKeyHash?: string;
  readonly stakingKeyHash?: string;
  readonly isBase?: boolean;
  readonly isEnterprise?: boolean;
  readonly isReward?: boolean;
  [key: string]: unknown;
};

type PubKeyInfo = {
  readonly pubKeyHex: string;
  readonly pubKeyHashHex: string;
  readonly derivationKind: string;
};

type WalletData = {
  readonly name?: string;
  readonly address: string;
  readonly addressInfo?: AddressInfo;
  readonly spendPubKey?: PubKeyInfo;
  readonly stakePubKey?: PubKeyInfo;
  readonly salt?: string;
  readonly balance?: number;
};

type ConnectResponse = {
  readonly data: WalletData;
  readonly hash?: string;
  readonly sign?: {
    readonly signature: string;
    readonly key: string;
  };
};

const GameChangerWalletIntegration: React.FC = (): React.ReactElement => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<ConnectResponse | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [walletUrl, setWalletUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gcLibLoaded, setGcLibLoaded] = useState<boolean>(false);

  // Load GameChanger library
  useEffect((): void => {
    const loadGcLib = async (): Promise<void> => {
      if (typeof window !== 'undefined' && !window.gc) {
        try {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc/dist/browser.min.js';
          script.async = true;
          
          // Create a promise to wait for the script to load
          const loadPromise = new Promise<void>((resolve, reject): void => {
            script.onload = (): void => resolve();
            script.onerror = (): void => reject();
          });
          
          document.body.appendChild(script);
          await loadPromise;
          setGcLibLoaded(true);
        } catch (error) {
          console.error('Failed to load GameChanger library:', error);
          setConnectionError('Failed to load wallet connection library');
        }
      } else if (window.gc) {
        setGcLibLoaded(true);
      }
    };
    
    loadGcLib();
  }, []);

  // Check for stored wallet connection on mount
  useEffect((): void => {
    const savedConnection = localStorage.getItem('walletConnection');
    if (savedConnection) {
      try {
        const parsedData = JSON.parse(savedConnection) as ConnectResponse;
        setWalletData(parsedData);
        setIsConnected(true);
      } catch (err) {
        console.error('Error parsing saved wallet data:', err);
        localStorage.removeItem('walletConnection');
      }
    }
  }, []);

  const connectWallet = async (): Promise<void> => {
    if (!gcLibLoaded) {
      setConnectionError('GameChanger library not loaded yet. Please try again.');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const gcScript = {
        "title": "Connect Wallet",
        "description": "Connect to the application via GameChanger wallet",
        "type": "script",
        "exportAs": "connect",
        "returnURLPattern": window.location.origin + "/wallet-callback",
        "run": {
          "data": {
            "type": "script",
            "run": {
              "name": {
                "type": "getName"
              },
              "address": {
                "type": "getCurrentAddress"
              },
              "spendPubKey": {
                "type": "getSpendingPublicKey"
              },
              "stakePubKey": {
                "type": "getStakingPublicKey"
              },
              "addressInfo": {
                "type": "macro",
                "run": "{getAddressInfo(get('cache.data.address'))}"
              },
              "salt": {
                "type": "macro",
                "run": "{uuid()}"
              }
            }
          },
          "hash": {
            "type": "macro",
            "run": "{sha512(objToJson(get('cache.data')))}"
          },
          "sign": {
            "type": "signDataWithAddress",
            "address": "{get('cache.data.address')}",
            "dataHex": "{get('cache.hash')}"
          }
        }
      };

      if (typeof window === 'undefined' || !window.gc) {
        throw new Error('GameChanger library not available');
      }

      const url = await window.gc.encode.url({
        input: JSON.stringify(gcScript),
        apiVersion: "2",
        network: "mainnet",
        encoding: "gzip"
      });
      
      setWalletUrl(url);
      setQrModalOpen(true);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletResponse = async (responseData: string): Promise<boolean> => {
    try {
      if (typeof window === 'undefined' || !window.gc) {
        throw new Error('GameChanger library not available');
      }

      const resultObj = await window.gc.encodings.msg.decoder(responseData);
      
      if (resultObj.exports?.connect) {
        const connectData = resultObj.exports.connect as ConnectResponse;
        
        if (!connectData.data || !connectData.data.address) {
          throw new Error('Invalid wallet response');
        }
        
        setWalletData(connectData);
        setIsConnected(true);
        localStorage.setItem('walletConnection', JSON.stringify(connectData));
        return true;
      } else {
        throw new Error('Invalid wallet connection data');
      }
    } catch (error) {
      console.error('Error processing wallet response:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to process wallet response');
      return false;
    }
  };

  const openWalletInSameWindow = (): void => {
    if (walletUrl) {
      window.location.href = walletUrl;
    }
  };

  const copyAddress = async (): Promise<void> => {
    if (walletData?.data?.address) {
      try {
        await navigator.clipboard.writeText(walletData.data.address);
        setCopySuccess(true);
        setTimeout((): void => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy address', err);
      }
    }
  };

  const truncateAddress = (address: string | undefined): string => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="flex flex-col space-y-6">
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-xl text-white">GameChanger Wallet Connection</CardTitle>
          <CardDescription className="text-neutral-400">
            Connect your Cardano wallet to interact with the blockchain
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isConnected && walletData ? (
            <div className="space-y-4">
   
              
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-neutral-400">Wallet Address</span>
                  <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-lg">
                    <span className="text-sm text-neutral-300 font-mono overflow-hidden text-ellipsis">
                      {walletData.data.address}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      className="ml-2 text-neutral-400 hover:text-white"
                      onClick={copyAddress}
                    >
                      {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-neutral-400">Network</span>
                  <div className="bg-neutral-800 p-3 rounded-lg">
                    <span className="text-sm text-neutral-300">
                      {walletData.data.addressInfo?.network || 'mainnet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="bg-neutral-800 p-4 rounded-full">
                <Wallet className="h-10 w-10 text-amber-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-1">Wallet Not Connected</h3>
                <p className="text-neutral-400 max-w-sm">
                  Connect your GameChanger wallet to interact with the Cardano blockchain
                </p>
              </div>
              {connectionError && (
                <div className="bg-red-900/20 border border-red-700/30 text-red-400 p-3 rounded-lg text-sm max-w-sm text-center">
                  {connectionError}
                </div>
              )}
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting || !gcLibLoaded}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
        
        {isConnected && walletData && (
          <CardFooter className="flex justify-between border-t border-neutral-800 pt-4">
            <a 
              href={`https://cardanoscan.io/address/${walletData.data.address}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-sm text-amber-400 hover:text-amber-300"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              View on Explorer
            </a>
            
            <span className="text-xs text-neutral-500">
              Connected: {new Date().toLocaleString()}
            </span>
          </CardFooter>
        )}
      </Card>
      
      {isConnected && walletData && (
        <Tabs defaultValue="wallet-info" className="w-full">
          <TabsList className="grid grid-cols-1 bg-neutral-900">
            <TabsTrigger value="wallet-info">Wallet Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="wallet-info" className="space-y-4 mt-4">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Certificate Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {walletData.data.spendPubKey && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-neutral-400">Spending Public Key</span>
                    <div className="bg-neutral-800 p-3 rounded-lg">
                      <span className="text-xs text-neutral-300 font-mono break-all">
                        {walletData.data.spendPubKey.pubKeyHex}
                      </span>
                    </div>
                  </div>
                )}
                
                {walletData.data.stakePubKey && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-neutral-400">Staking Public Key</span>
                    <div className="bg-neutral-800 p-3 rounded-lg">
                      <span className="text-xs text-neutral-300 font-mono break-all">
                        {walletData.data.stakePubKey.pubKeyHex}
                      </span>
                    </div>
                  </div>
                )}
                
                {walletData.data.addressInfo?.rewardAddress && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-neutral-400">Reward Address</span>
                    <div className="bg-neutral-800 p-3 rounded-lg">
                      <span className="text-xs text-neutral-300 font-mono break-all">
                        {walletData.data.addressInfo.rewardAddress}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Connect GameChanger Wallet</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Scan this QR code with your GameChanger Wallet or click the button below
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-4 rounded-lg" id="qrcode-container">
              {walletUrl && (
                <div className="bg-neutral-800 p-3 rounded-lg max-w-xs overflow-hidden text-xs text-neutral-300 break-all">
                  {walletUrl}
                </div>
              )}
            </div>
            
            <Button
              onClick={openWalletInSameWindow}
              className="bg-amber-500 hover:bg-amber-600 text-white w-full"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Open GameChanger Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameChangerWalletIntegration;