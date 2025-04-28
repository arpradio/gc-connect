"use client";

import { validateWalletData } from '@/app/lib/signature-verifier';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from "react";
import WalletConnectModal from '../../components/Header/WalletConnetModal';
import { AlertTriangle } from 'lucide-react';

type AddressIdentity = {
  readonly scriptHex: string;
  readonly scriptHash: string;
  readonly scriptRefHex: string;
};

type AddressInfo = {
  readonly isByron: boolean;
  readonly isReward: boolean;
  readonly isEnterprise: boolean;
  readonly isPointer: boolean;
  readonly isPaymentScript: boolean;
  readonly isStakingScript: boolean;
  readonly paymentScriptHash: string;
  readonly stakingScriptHash: string;
  readonly isScript: boolean;
  readonly kind: string;
  readonly isCardano: boolean;
  readonly isShelley: boolean;
  readonly isBase: boolean;
  readonly isPaymentKey: boolean;
  readonly isStakingKey: boolean;
  readonly paymentKeyHash: string;
  readonly stakingKeyHash: string;
  readonly rewardAddress: string;
  readonly network: string;
  readonly networkId: number;
  readonly identity: AddressIdentity;
};

type Signature = {
  readonly signature: string;
  readonly key: string;
};

type WalletData = {
  readonly name: string;
  readonly address: string;
  readonly addressInfo: AddressInfo;
  readonly agreement?: string;
  readonly salt?: string;
  readonly balance?: number;
  readonly assets?: Record<string, number>;
};

type ConnectionData = {
  readonly data: WalletData;
  readonly hash?: string;
  readonly sign?: Signature;
  readonly lastActivity?: string;
};

interface AddressBalance {
  readonly lovelace: string;
  readonly assets?: Record<string, number>;
}

export interface WalletContextType {
  readonly isConnected: boolean;
  readonly isConnecting: boolean;
  readonly walletData: ConnectionData | null;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly refreshBalance: () => Promise<void>;
  readonly error: Error | null;
  readonly isModalOpen: boolean;
  readonly setIsModalOpen: (open: boolean) => void;
  readonly walletUrl: string | null;
  readonly handleWalletResponse: (responseData: string) => Promise<void>;
  readonly sessionExpired: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const gcScript = {
  "title": `Connect to ${process.env.PUBLIC_URL}`,
  "description": "Connect your wallet using GameChanger!",
  "require": {
        "not": {
            "walletTypeIn": [
                "hardware"
            ]
        }
      },
  "type": "script",
  "exportAs": "connect",
  "returnURLPattern": "http://localhost:3000/wallet/wallet-callback",
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

const hwScript = {
  "title": `Connect to ${process.env.NEXT_PUBLIC_COMPANY_NAME}`,
  "description": "Connect your wallet using GameChanger!",
  "require": {
      "walletTypeIn": [
          "hardware"
      ]
  },
  "type": "script",
  "exportAs": "connect",
  "returnURLPattern": "http://localhost:3000/wallet/wallet-callback",
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
        "addressInfo": {
          "type": "macro",
          "run": "{getAddressInfo(get('cache.data.address'))}"
        },
        "salt": {
          "type": "macro",
          "run": "{uuid()}"
        }
      }
    }
  }
};

const loadGameChangerLib = async (): Promise<boolean> => {
  if (typeof window !== "undefined") {
    return !!window.gc;
  }
  return false;
};

const fetchWalletBalance = async (
  address: string
): Promise<AddressBalance | null> => {
  try {
    const url = `/api/wallet/balance?address=${address}`;
    const response = await fetch(url, {
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
};

const createSessionToken = (walletData: ConnectionData): string => {
  try {
    if (!walletData?.data?.address) {
      throw new Error("Invalid wallet data");
    }

    if (
      walletData.sign &&
      (!walletData.sign.signature || !walletData.sign.key || !walletData.hash)
    ) {
      console.warn("Wallet data has incomplete signature information");
    }

    const address = walletData.data.address;
    const timestamp = Date.now();

    const sessionData = {
      address,
      lastActivity: new Date().toISOString(),
    };

    localStorage.setItem("walletSession", JSON.stringify(sessionData));
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomPart = Array.from(randomBytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return `${address.substring(0, 8)}_${randomPart}_${timestamp}`;
  } catch (error) {
    console.error("Error creating session token:", error);
    throw error;
  }
};

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<ConnectionData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [loadAttempted, setLoadAttempted] = useState<boolean>(false);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    const checkLib = async () => {
      if (loadAttempted) return;
      setLoadAttempted(true);
      
      const isAvailable = await loadGameChangerLib();
      if (!isAvailable) {
        console.warn("GameChanger library not available. Connect functionality may be limited.");
      }
    };
    
    checkLib();
  }, [loadAttempted]);

  useEffect(() => {
    const handleCallbackEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.data) {
        handleWalletResponse(customEvent.detail.data);
      }
    };
    
    window.addEventListener('walletCallbackReceived', handleCallbackEvent);
    return () => window.removeEventListener('walletCallbackReceived', handleCallbackEvent);
  }, []);

// Improved balance fetch function in walletProvider.tsx
const refreshBalance = async (): Promise<void> => {
  if (!walletData?.data.address) return;

  try {
    // Add a small delay to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add a timestamp to prevent caching
    const timestamp = Date.now();
    const balanceData = await fetchWalletBalance(`${walletData.data.address}?_t=${timestamp}`);
    
    if (!balanceData) return;
    
    if (balanceData.lovelace === "-1") {
      console.warn("Session expired detected during balance refresh");
      setSessionExpired(true);
      setIsConnected(false);
      setIsModalOpen(true);
      return;
    }

    const balanceInAda = parseInt(balanceData.lovelace) / 1000000;

    const updatedWalletData = {
      ...walletData,
      data: {
        ...walletData.data,
        balance: balanceInAda,
        assets: balanceData.assets,
      },
    };

    setWalletData(updatedWalletData);
    localStorage.setItem(
      "walletConnection",
      JSON.stringify(updatedWalletData)
    );
    
    return;
  } catch (err) {
    console.error("Failed to refresh balance:", err);

    // Only set session expired if it's truly a 401 error
    if (err instanceof Error && 
        (err.message.includes("401") || 
         err.message.toLowerCase().includes("unauthorized"))) {
      setSessionExpired(true);
      setIsConnected(false);
      setIsModalOpen(true);
    }
    throw err;
  }
};

  useEffect(() => {
    const verifySession = async () => {
      const savedData = localStorage.getItem("walletConnection");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData) as ConnectionData;
          const sessionResponse = await fetch("/api/wallet/session", {
            method: "GET",
          });
          
          if (sessionResponse.status === 401) {
            console.warn("Wallet session expired or invalid");
            setSessionExpired(true);
            setIsConnected(false);
            return;
          }
          
          setWalletData(parsed);
          setIsConnected(true);

          if (parsed.data.address) {
            refreshBalance();
          }
        } catch (err) {
          console.error("Failed to parse saved wallet data", err);
          localStorage.removeItem("walletConnection");
        }
      }
    };
    
    verifySession();
  }, []);


  const handleWalletResponse = async (resultRaw: string): Promise<void> => {
    setInProgress(true);
    setSessionExpired(false);
  
    try {
      if (!window.gc || !window.gc.encodings || !window.gc.encodings.msg || !window.gc.encodings.msg.decoder) {
        throw new Error("GameChanger library not properly loaded");
      }
  
      console.log("Processing wallet response");
  
      const resultObj = await window.gc.encodings.msg.decoder(resultRaw);
      console.log("Decoded wallet response:", resultObj);
  
      if (resultObj.exports?.connect) {
        const connectData = resultObj.exports.connect;
  
        if (!validateWalletData(connectData)) {
          throw new Error("Invalid wallet data format");
        }
  
        if (!connectData.data || !connectData.data.address) {
          throw new Error("Wallet response missing address data");
        }
        
        // First fetch a minimal balance just to initialize the wallet
        const initialBalanceData = await fetchWalletBalance(connectData.data.address);
        const returnUrl = localStorage.getItem("walletReturnUrl") || "/";
        
        const initialBalanceInAda = initialBalanceData ? parseInt(initialBalanceData.lovelace) / 1000000 : 0;
  
        let finalData = {
          ...connectData,
          data: {
            ...connectData.data,
            balance: initialBalanceInAda,
            assets: initialBalanceData?.assets || {},
          },
          lastActivity: new Date().toISOString(),
        };
        
        // Set initial state and store in localStorage
        setWalletData(finalData);
        setIsConnected(true);
        localStorage.setItem("walletConnection", JSON.stringify(finalData));
  
        const sessionToken = createSessionToken(finalData);
  
        try {
          // Send the wallet connection to the backend
          const response = await fetch("/api/wallet/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: sessionToken,
              wallet: {
                address: finalData.data.address,
                name: finalData.data.name || "Unknown Wallet",
                networkId: finalData.data.addressInfo?.networkId || 1,
              },
              connectionData: finalData,
              returnUrl
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            // After successful connection, fetch complete balance immediately
            try {
              const completeBalanceData = await fetchWalletBalance(connectData.data.address);
              
              if (completeBalanceData) {
                const balanceInAda = parseInt(completeBalanceData.lovelace) / 1000000;
                
                // Update wallet data with accurate balance
                const updatedData = {
                  ...finalData,
                  data: {
                    ...finalData.data,
                    balance: balanceInAda,
                    assets: completeBalanceData.assets || {},
                  }
                };
                
                setWalletData(updatedData);
                localStorage.setItem("walletConnection", JSON.stringify(updatedData));
                console.log("Complete balance fetched successfully:", balanceInAda);
              }
            } catch (balanceError) {
              console.error("Error fetching complete balance:", balanceError);
              // Continue with initial balance if complete balance fetch fails
            }
            
            window.location.href = returnUrl;
          } else {
            console.error("API error:", data.error);
            window.location.href = returnUrl;
          }
        } catch (apiError) {
          console.error("API error:", apiError);
          window.location.href = returnUrl;
        }
  
        setIsModalOpen(false);
      } else {
        throw new Error("Invalid wallet response format");
      }
    } catch (err) {
      console.error("Error processing wallet response", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      const returnUrl = localStorage.getItem("walletReturnUrl") || "/";
      window.location.href = returnUrl;
    } finally {
      setIsConnecting(false);
      setInProgress(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle both string messages and structured object messages
      if (event.origin !== window.location.origin) return;
      
      // Handle string format (legacy)
      if (event.data && typeof event.data === 'string' && event.data.startsWith('gc:')) {
        const resultData = event.data.substring(3);
        handleWalletResponse(resultData);
        return;
      }
      
      // Handle structured format (improved)
      if (event.data && typeof event.data === 'object' && event.data.type === 'gc_wallet_callback') {
        handleWalletResponse(event.data.result);
        return;
      }
    };
    
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.data) {
        handleWalletResponse(customEvent.detail.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    document.addEventListener('walletCallbackReceived', handleCustomEvent);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('walletCallbackReceived', handleCustomEvent);
    };
  }, []);

  const generateWalletUrl = async (scriptType: 'software' | 'hardware'): Promise<string | null> => {
    try {
      if (!window.gc || !window.gc.encode || !window.gc.encode.url) {
        throw new Error("GameChanger wallet library not available");
      }

      const scriptWithCurrentUrl = {
        ...(scriptType === 'hardware' ? hwScript : gcScript),
        returnURLPattern: window.location.origin + "/wallet/wallet-callback",
      };

      console.log(`Generating ${scriptType} wallet connection URL`);
      return await window.gc.encode.url({
        input: JSON.stringify(scriptWithCurrentUrl),
        apiVersion: "2",
        network: "mainnet",
        encoding: "gzip",
      });
    } catch (err) {
      console.error(`Error generating ${scriptType} wallet URL:`, err);
      throw err;
    }
  };

  const connect = async (): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (sessionExpired) {
        localStorage.removeItem("walletConnection");
        setWalletData(null);
      } else {
        setSessionExpired(false);
      }

      if (!window.gc || !window.gc.encode || !window.gc.encode.url) {
        setError(new Error("GameChanger wallet library not available. Please refresh and try again."));
        setIsConnecting(false);
        return;
      }

      const currentUrl = window.location.href;
      localStorage.setItem("walletReturnUrl", currentUrl);

      const softwalletUrl = await generateWalletUrl('software');
      
      if (softwalletUrl) {
        console.log("Wallet URL generated successfully");
        setWalletUrl(softwalletUrl);
        setIsModalOpen(true);
      } else {
        throw new Error("Failed to generate wallet URL");
      }
    } catch (err) {
      console.error("Error initiating wallet connection", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnecting(false);
    }
  };

  const connectWithSoftWallet = async () => {
    try {
      const url = walletUrl || (sessionExpired ? await generateWalletUrl('software') : null);
      
      if (!url) {
        throw new Error("Failed to generate wallet URL");
      }
      
      // Open the wallet URL, not a balance API endpoint
      const popup = window.open(
        url, 
        'wallet_popup',
        'width=420,height=680,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,noopener=yes'
      );
      
      const checkPopupClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopupClosed);
          console.log('Popup was closed');
        }
      }, 500);
      
    } catch (err) {
      console.error("Error opening wallet popup:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };
  const disconnect = (): void => {
    setWalletData(null);
    setIsConnected(false);
    setSessionExpired(false);
    localStorage.removeItem("walletConnection");
  
    fetch("/api/wallet/disconnect", {
      method: "POST",
      credentials: 'include', 
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Disconnect failed');
      }
      console.log('Wallet disconnected successfully');
      
      window.location.reload();
    })
    .catch((err) => {
      console.error("Error disconnecting wallet:", err);
      
      window.location.reload();
    });
  };

  const closeModal = (): void => {
    if (!inProgress) {
      setIsModalOpen(false);
      if (isConnecting) {
        setIsConnecting(false);
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        walletData,
        connect,
        disconnect,
        refreshBalance,
        error,
        isModalOpen,
        setIsModalOpen,
        walletUrl,
        handleWalletResponse,
        sessionExpired
      }}
    >
      {children}
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        walletUrl={walletUrl}
        inProgress={inProgress}
        onConnectSoftWallet={connectWithSoftWallet}
        isSessionExpired={sessionExpired}
      />
      
      {sessionExpired && !isModalOpen && isConnected && (
        <div className="fixed top-20 right-4 z-50 bg-red-900/80 border border-red-500 rounded-lg p-3 shadow-lg max-w-xs animate-fadeIn flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-300 flex-shrink-0" />
          <div>
            <p className="text-white font-medium">Session Expired</p>
            <p className="text-red-200 text-sm">Your wallet session has expired. Please reconnect.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

declare global {
  interface Window {
    gc: {
      encode: {
        url: (options: {
          input: string;
          apiVersion: string;
          network: string;
          encoding: string;
        }) => Promise<string>;
        qr?: (options: {
          input: string;
          apiVersion: string;
          network: string;
          encoding: string;
          qrResultType: string;
        }) => string;
      };
      encodings: {
        msg: {
          decoder: (resultRaw: string) => Promise<{
            exports?: {
              connect?: ConnectionData;
            };
          }>;
        };
      };
    };
  }
}