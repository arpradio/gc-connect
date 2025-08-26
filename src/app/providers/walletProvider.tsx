import React, { createContext, useContext, useState, useEffect, useRef, FC, ReactNode } from 'react';
import { BalanceManager } from '../lib/balance-manager';
import { validateWalletData } from '../lib/signature-verifier';
import WalletConnectModal from '@/components/Header/WalletConnetModal';
import { AlertTriangle } from 'lucide-react';

interface AddressBalance {
  lovelace: string;
  assets?: Record<string, number>;
}

interface ConnectionData {
  data: {
    address: string;
    balance?: number;
    networkId?: number;
    name?: string;
    addressInfo?: {
      networkId: number;
    };
    assets?: Record<string, number>;
  };
  lastActivity?: string;
  hash?: string;
  sign?: {
    signature: string;
    key: string;
  };
}

export interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isBalanceLoading: boolean;
  walletData: ConnectionData | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: (providedWalletData?: ConnectionData, forceRefresh?: boolean) => Promise<void>;
  error: Error | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  walletUrl: string | null;
  handleWalletResponse: (resultRaw: string) => Promise<void>;
  sessionExpired: boolean;
  updateWalletBalance: (balance: { lovelace: string; assets?: Record<string, number> }) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini'];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  return isMobileUA && (isTouchDevice || isSmallScreen);
};

const getCallbackUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000/wallet/wallet-callback';
  return `${window.location.origin}/wallet/wallet-callback`;
};

const getBaseScript = (type: 'software' | 'hardware') => ({
  "title": "🎼 🎧 🎵 | ARP Radio - Cardano's Music Minter, Player, and Index | 🎵 🎧 🎼",
  "description": `Connect your ${type === 'hardware' ? 'hardware ' : ''}wallet to ARP Radio`,
  "require": type === 'hardware' ? {
    "walletTypeIn": ["hardware"]
  } : {
    "not": {
      "walletTypeIn": ["hardware"]
    }
  },
  "type": "script",
  "exportAs": "connect",
  "returnURLPattern": getCallbackUrl(),
  "run": type === 'hardware' ? {
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
  } : {
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
    }
  }
});

declare global {
  interface Window {
    gc?: {
      encode?: {
        url?: (params: { input: string; apiVersion: string; network: string; encoding: string }) => Promise<string>;
      };
      encodings?: {
        msg?: {
          decoder?: (input: string) => Promise<any>;
        };
      };
      [key: string]: any;
    };
  }
}

const loadGameChangerLib = async (): Promise<boolean> => {
  if (typeof window !== "undefined") {
    return !window.gc;
  }
  return false;
};

const generateWalletUrl = async (scriptType: 'software' | 'hardware'): Promise<string | null> => {
  try {
    if (!window.gc?.encode?.url) {
      throw new Error("GameChanger wallet library not available");
    }

    const script = getBaseScript(scriptType);
    const url = await window.gc.encode.url({
      input: JSON.stringify(script),
      apiVersion: "2",
      network: "mainnet",
      encoding: "gzip"
    });
    return url;
  } catch (err) {
    console.error(`Error generating ${scriptType} wallet URL:`, err);
    return null;
  }
};



const createSessionToken = (walletData: ConnectionData): string => {
  try {
    if (!walletData?.data?.address) {
      throw new Error("Invalid wallet data");
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


interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<ConnectionData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [loadAttempted, setLoadAttempted] = useState<boolean>(false);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  // Child window management for GameChanger connections
  const popupWindowRef = useRef<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const openPopupWindow = (url: string): Window | null => {
    try {
      const popupFeatures = [
        'width=400',
        'height=700',
        'scrollbars=yes',
        'resizable=yes',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=yes'
      ].join(',');

      const popup = window.open(url, 'gamechangerWallet', popupFeatures);

      if (!popup) {
        console.warn('Popup blocked by browser');
        return null;
      }

      // Center the popup on screen
      const screenLeft = window.screenLeft || window.screenX || 0;
      const screenTop = window.screenTop || window.screenY || 0;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;

      const popupWidth = 400;
      const popupHeight = 600;
      const left = screenLeft + (screenWidth - popupWidth) / 2;
      const top = screenTop + (screenHeight - popupHeight) / 2;

      popup.moveTo(left, top);
      popup.focus();

      return popup;
    } catch (error) {
      console.error('Error opening popup window:', error);
      return null;
    }
  };

  const startPopupMonitoring = (popup: Window) => {
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
    }

    let hasLoggedClosure = false;

    popupCheckInterval.current = setInterval(() => {
      if (popup.closed) {
        if (!hasLoggedClosure) {
          console.log('Popup window closed by user');
          hasLoggedClosure = true;
        }

        clearInterval(popupCheckInterval.current!);
        popupCheckInterval.current = null;
        popupWindowRef.current = null;

        if (isConnecting) {
          setIsConnecting(false);
          setInProgress(false);
        }
        return;
      }
    }, 1000);
  };

  const closePopupWindow = () => {
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      try {
        popupWindowRef.current.close();
      } catch (error) {
        console.warn('Failed to close popup window:', error);
      }
    }

    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
      popupCheckInterval.current = null;
    }

    popupWindowRef.current = null;
  };

  useEffect(() => {
    return () => {
      closePopupWindow();
    };
  }, []);


  useEffect(() => {
    // Cleanup popup monitoring on unmount
    return () => {
      closePopupWindow();
    };
  }, []);

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

  const refreshBalance = async (providedWalletData?: ConnectionData, forceRefresh = false): Promise<void> => {
    const targetWalletData = providedWalletData || walletData;

    if (!targetWalletData?.data.address) return;

    const balanceManager = BalanceManager.getInstance();

    if (balanceManager.isPending(targetWalletData.data.address) && !forceRefresh) {
      return;
    }

    try {
      setIsBalanceLoading(true);

      const balance = await balanceManager.getBalance(targetWalletData.data.address, forceRefresh);

      if (balance.lovelace === "-1") {
        console.warn("Session expired detected during balance refresh");
        setSessionExpired(true);
        setIsConnected(false);
        setIsModalOpen(true);
        balanceManager.clearCache(targetWalletData.data.address);
        return;
      }

      const balanceInAda = parseInt(balance.lovelace) / 1000000;

      const updatedWalletData = {
        ...targetWalletData,
        data: {
          ...targetWalletData.data,
          balance: balanceInAda,
          assets: balance.assets,
        },
      };

      setWalletData(updatedWalletData);
      localStorage.setItem("walletConnection", JSON.stringify(updatedWalletData));

    } catch (err) {
      console.error("Failed to refresh balance:", err);

      if (err instanceof Error) {
        if (err.message === 'SESSION_EXPIRED' ||
          err.message.includes("401") ||
          err.message.toLowerCase().includes("unauthorized")) {
          setSessionExpired(true);
          setIsConnected(false);
          setIsModalOpen(true);
          balanceManager.clearCache(targetWalletData.data.address);
        }
      }
      throw err;
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      const savedData = localStorage.getItem("walletConnection");
      if (!savedData || !mounted) return;

      try {
        const parsed = JSON.parse(savedData) as ConnectionData;

        const sessionResponse = await fetch("/api/wallet/session?includeBalance=true", {
          method: "GET",
          credentials: 'include'
        });

        if (!mounted) return;

        if (sessionResponse.status === 401) {
          console.warn("Wallet session expired or invalid");
          localStorage.removeItem("walletConnection");
          const balanceManager = BalanceManager.getInstance();
          balanceManager.clearCache();
          setSessionExpired(true);
          setIsConnected(false);
          return;
        }

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();

          let updatedWalletData = parsed;

          if (sessionData.balance && sessionData.balance.lovelace !== "-1") {
            const balanceInAda = parseInt(sessionData.balance.lovelace) / 1000000;
            updatedWalletData = {
              ...parsed,
              data: {
                ...parsed.data,
                balance: balanceInAda,
                assets: sessionData.balance.assets,
              },
            };

            localStorage.setItem("walletConnection", JSON.stringify(updatedWalletData));
          } else if (sessionData.balanceError) {
            console.warn('Balance error in session response:', sessionData.balanceError);
          }

          setWalletData(updatedWalletData);
          setIsConnected(true);

          if (!sessionData.balance && mounted) {
            refreshBalance(updatedWalletData).catch(err => {
              console.error("Fallback balance refresh failed:", err);
            });
          }
        } else {
          console.warn("Session check failed:", sessionResponse.status);
          localStorage.removeItem("walletConnection");
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to verify wallet session", err);
          localStorage.removeItem("walletConnection");
          const balanceManager = BalanceManager.getInstance();
          balanceManager.clearCache();
        }
      }
    };

    verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  // FIXED VERSION - Uses GameChanger token instead of local session token
  const handleWalletResponse = async (resultRaw: string): Promise<void> => {
    setInProgress(true);
    setSessionExpired(false);

    try {
      if (!window.gc || !window.gc.encodings || !window.gc.encodings.msg || !window.gc.encodings.msg.decoder) {
        throw new Error("GameChanger library not properly loaded");
      }

      const resultObj = await window.gc.encodings.msg.decoder(resultRaw);
      console.log("GameChanger response decoded:", {
        hasExports: !!resultObj.exports,
        hasConnect: !!resultObj.exports?.connect,
        hasGcToken: !!resultObj.gcToken,
        hasToken: !!resultObj.token
      });

      if (resultObj.exports?.connect) {
        const connectData = resultObj.exports.connect;

        if (!validateWalletData(connectData)) {
          throw new Error("Invalid wallet data format");
        }

        if (!connectData.data || !connectData.data.address) {
          throw new Error("Wallet response missing address data");
        }

        const returnUrl = localStorage.getItem("walletReturnUrl") || "/";

        let walletDataWithoutBalance = {
          ...connectData,
          data: {
            ...connectData.data,
            balance: undefined,
            assets: {},
          },
          lastActivity: new Date().toISOString(),
        };

        localStorage.setItem("walletConnection", JSON.stringify(walletDataWithoutBalance));

        try {
          const isMobile = isMobileDevice();

          // ✅ FIX: Use GameChanger token instead of local session token
          const gameChangerToken = resultObj.gcToken || resultObj.token;

          if (!gameChangerToken) {
            console.warn("No GameChanger token found in response, using fallback");
          }

          const connectPayload = {
            token: gameChangerToken || createSessionToken(walletDataWithoutBalance), // Use GC token first
            wallet: {
              address: walletDataWithoutBalance.data.address,
              name: walletDataWithoutBalance.data.name || "Unknown Wallet",
              networkId: walletDataWithoutBalance.data.addressInfo?.networkId ||
                walletDataWithoutBalance.data.networkId || 1,
            },
            connectionData: walletDataWithoutBalance,
            returnUrl,
            isMobile
          };

          console.log("Connect payload:", {
            hasToken: !!connectPayload.token,
            tokenLength: connectPayload.token?.length,
            tokenSource: gameChangerToken ? 'GameChanger' : 'Fallback',
            walletAddress: connectPayload.wallet.address ? '[PRESENT]' : '[MISSING]',
            networkId: connectPayload.wallet.networkId
          });

          const response = await fetch("/api/wallet/connect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache"
            },
            credentials: 'include',
            body: JSON.stringify(connectPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API response error:", response.status, response.statusText, errorText);

            if (response.status === 400) {
              throw new Error(`Invalid request: ${errorText}`);
            } else if (response.status === 401) {
              throw new Error(`Authentication failed: ${errorText}`);
            }

            throw new Error(`Session creation failed: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const data = await response.json();
          console.log("Connection successful:", data);

          if (data.success) {
            setWalletData(walletDataWithoutBalance);
            setIsConnected(true);
            setIsModalOpen(false);

            // Close popup window if it's open
            closePopupWindow();

            const verifySessionAndFetchBalance = async () => {
              try {
                const sessionCheck = await fetch('/api/wallet/session?includeBalance=true', {
                  credentials: 'include'
                });

                if (sessionCheck.ok) {
                  const sessionData = await sessionCheck.json();

                  if (sessionData.balance && sessionData.balance.lovelace !== "-1") {
                    const balanceInAda = parseInt(sessionData.balance.lovelace) / 1000000;
                    const updatedWalletData = {
                      ...walletDataWithoutBalance,
                      data: {
                        ...walletDataWithoutBalance.data,
                        balance: balanceInAda,
                        assets: sessionData.balance.assets,
                      },
                    };

                    setWalletData(updatedWalletData);
                    localStorage.setItem("walletConnection", JSON.stringify(updatedWalletData));

                  } else {
                    await refreshBalance(walletDataWithoutBalance);
                  }
                } else {
                  console.warn("Session not ready, retrying in 700ms");
                  setTimeout(verifySessionAndFetchBalance, 700);
                }
              } catch (err) {
                console.error("Session verification failed:", err);
                setTimeout(() => {
                  refreshBalance(walletDataWithoutBalance).catch(console.error);
                }, 1000);
              }
            };

            setTimeout(verifySessionAndFetchBalance, 100);


          } else {
            console.error("API returned success: false, error:", data.error);
            throw new Error(data.error || "Session creation failed - API returned success: false");
          }
        } catch (apiError) {
          console.error("API call failed:", apiError);
          throw apiError;
        }
      } else {
        throw new Error("Invalid wallet response format");
      }
    } catch (err) {
      console.error("Error processing wallet response", err);
      setError(err instanceof Error ? err : new Error(String(err)));

      // Close popup window on error
      closePopupWindow();

      const returnUrl = localStorage.getItem("walletReturnUrl") || "/";
      const finalReturnUrl = returnUrl === "/" || returnUrl.endsWith("/") ? "/wallet" : returnUrl;

      setTimeout(() => {
        window.location.href = finalReturnUrl;
      }, 3000);
    } finally {
      setIsConnecting(false);
      setInProgress(false);
    }
  };

  useEffect(() => {
    const handleDesktopPopupMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      let resultData = null;
      let messageSource = 'unknown';

      if (event.data && typeof event.data === 'string' && event.data.startsWith('gc:')) {
        resultData = event.data.substring(3);
        messageSource = 'desktop_popup_direct';
      } else if (event.data && typeof event.data === 'object' && event.data.type === 'gc_wallet_callback') {
        resultData = event.data.result;
        messageSource = `desktop_popup_${event.data.source || 'structured'}`;
      }

      if (resultData) {
        console.log(`Received wallet response from ${messageSource}`);


        if (popupWindowRef.current && event.source === popupWindowRef.current) {
          console.log('Message confirmed from our popup window');
        }

        handleWalletResponse(resultData);
      }
    };

    const handleMobileStorageCallback = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.data) {
        console.log('Received wallet response from mobile storage callback');
        handleWalletResponse(customEvent.detail.data);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'gc_wallet_callback' && event.newValue) {
        console.log('Received wallet response from storage change');
        handleWalletResponse(event.newValue);

        setTimeout(() => {
          localStorage.removeItem('gc_wallet_callback');
          localStorage.removeItem('gc_wallet_callback_timestamp');
        }, 1000);
      }
    };

    window.addEventListener('message', handleDesktopPopupMessage);
    document.addEventListener('walletCallbackReceived', handleMobileStorageCallback);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleDesktopPopupMessage);
      document.removeEventListener('walletCallbackReceived', handleMobileStorageCallback);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const connect = async (): Promise<void> => {
    if (isConnected || isConnecting || inProgress) {
      console.log('Connection already in progress or established');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      if (sessionExpired) {
        localStorage.removeItem("walletConnection");
        setWalletData(null);
      } else {
        setSessionExpired(false);
      }

      if (!window.gc?.encode?.url) {
        console.error('GameChanger library not available');
        setError(new Error("GameChanger wallet library not available. Please refresh and try again."));
        setIsConnecting(false);
        return;
      }

      const currentUrl = window.location.href;
      localStorage.setItem("walletReturnUrl", currentUrl);

      const softwalletUrl = await generateWalletUrl('software');

      if (softwalletUrl) {
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
    if (inProgress) {
      console.log('Connection already in progress');
      return;
    }

    setInProgress(true);

    try {
      const url = walletUrl || await generateWalletUrl('software');

      if (!url) {
        throw new Error("Failed to generate wallet connection URL");
      }

      if (isMobileDevice()) {
        const userConfirmsRedirect = window.confirm(
          "You will be redirected to your wallet app. Would you like to continue in a new tab? This will redirect your current page."
        );

        if (userConfirmsRedirect) {
          window.location.href = url;
        } else {
          throw new Error("User cancelled connection");
        }
      } else {
        console.log('Opening GameChanger connection in popup window...');

        closePopupWindow();

        const popup = openPopupWindow(url);

        if (popup) {
          popupWindowRef.current = popup;
          startPopupMonitoring(popup);
          console.log('Popup window opened successfully');
        } else {
          const userConfirmsRedirect = window.confirm(
            "Popup was blocked by your browser. Would you like to continue in a new tab? This will redirect your current page."
          );

          if (userConfirmsRedirect) {
            window.location.href = url;
          } else {
            throw new Error("User cancelled connection - popup blocked");
          }
        }
      }

    } catch (err) {
      console.error("Connect with soft wallet error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      closePopupWindow();
    } finally {
      setIsConnecting(false);
      setInProgress(false);
    }
  };



  const disconnect = (): void => {
    setWalletData(null);
    setIsConnected(false);
    setSessionExpired(false);
    setIsBalanceLoading(false);
    localStorage.removeItem("walletConnection");
    localStorage.removeItem("walletReturnUrl");

    closePopupWindow();

    fetch("/api/wallet/disconnect", {
      method: "POST",
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Disconnect failed');
        }
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

        closePopupWindow();
      }
    }
  };

  const updateWalletBalance = (balance: { lovelace: string; assets?: Record<string, number> }) => {
    if (!walletData) return;

    const balanceInAda = parseInt(balance.lovelace) / 1000000;
    const updatedWalletData = {
      ...walletData,
      data: {
        ...walletData.data,
        balance: balanceInAda,
        assets: balance.assets,
      },
    };

    setWalletData(updatedWalletData);
    localStorage.setItem("walletConnection", JSON.stringify(updatedWalletData));
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        isBalanceLoading,
        walletData,
        connect,
        disconnect,
        refreshBalance,
        error,
        isModalOpen,
        setIsModalOpen,
        walletUrl,
        handleWalletResponse,
        sessionExpired,
        updateWalletBalance
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
        <div className="fixed top-20 right-4 z-50 bg-red-800 border border-red-500 rounded-lg p-3 shadow-lg max-w-xs  flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-300 flex-shrink-0" />
          <div>
            <p className="text-white font-medium">Session Expired</p>
            <p className="text-red-100 text-sm">Your wallet session has expired.</p>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};