"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from "react";

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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const gcScript = {
  "title": `Connect to ${process.env.COMPANY_NAME} `,
  "description": `Connect to ${process.env.COMPANY_NAME} via GameChanger wallet`,
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
        "spendPubKey": {
          "type": "getSpendingPublicKey"
        },
        "stakePubKey": {
          "type": "getStakingPublicKey"
        },
        "addressInfo": {
          "type": "macro",
          "run": "{getAddressInfo(get('cache.data.address'))}"
        }
      }
    }
  }
};

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletUrl: string | null;
  inProgress: boolean;
}

const WalletConnectModal: FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  walletUrl,
  inProgress,
}) => {
  if (!isOpen) return null;

  const openWalletInSameWindow = () => {
    if (walletUrl) {
      window.location.href = walletUrl;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sky-950 border border-zinc-700 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">
            Connect GameChanger Wallet
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            disabled={inProgress}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-4">
            {inProgress
              ? "Processing wallet connection. Please wait..."
              : "Please scan this QR code with your GameChanger Wallet or click the button below to open the wallet in the same window."}
          </p>

          {walletUrl && !inProgress && (
            <div className="flex flex-col items-center">
              <div
                className="mb-4 bg-white p-4 rounded-lg"
                id="qrcode-container"
              ></div>

              <button
                onClick={openWalletInSameWindow}
                className="bg-amber-500 text-white py-2 px-4 rounded hover:bg-amber-600 transition-colors w-full text-center"
              >
                Open GameChanger Wallet
              </button>
            </div>
          )}

          {inProgress && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500 mt-4">
          {inProgress
            ? "Please complete the wallet connection process"
            : "You'll be redirected to GameChanger Wallet and automatically returned when complete."}
        </div>
      </div>
    </div>
  );
};

const loadGameChangerLib = async (): Promise<void> => {
  if (typeof window !== "undefined" && !window.gc) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc/dist/browser.min.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load GameChanger library"));
      document.body.appendChild(script);
    });
  }
  return Promise.resolve();
};

const fetchWalletBalance = async (
  address: string
): Promise<AddressBalance | null> => {
  try {
    const response = await fetch(`/api/wallet/balance?address=${address}`);
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
  const [gcLibLoaded, setGcLibLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadGameChangerLib()
      .then(() => setGcLibLoaded(true))
      .catch((err) => {
        console.error("Failed to load GameChanger library:", err);
        setError(new Error("Failed to load wallet connection library"));
      });
  }, []);

  const refreshBalance = async (): Promise<void> => {
    if (!walletData?.data.address) return;

    try {
      const balanceData = await fetchWalletBalance(walletData.data.address);
      if (!balanceData) return;

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
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem("walletConnection");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as ConnectionData;
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
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const gcResult = url.searchParams.get("result");

      if (gcResult) {
        console.log(
          "Detected result parameter in URL, processing wallet response"
        );
        handleWalletResponse(gcResult);

        const cleanURL = window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
      }
    }
  }, []);

  useEffect(() => {
    if (isModalOpen && walletUrl) {
      const loadQRCode = async () => {
        try {
          if (!window.QRCode) {
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
            script.async = true;
            document.body.appendChild(script);

            await new Promise<void>((resolve, reject) => {
              script.onload = () => resolve();
              script.onerror = () =>
                reject(new Error("Failed to load QR code library"));
            });
          }

          const container = document.getElementById("qrcode-container");
          if (container) {
            container.innerHTML = "";

            if (window.QRCode && walletUrl) {
              new window.QRCode(container, {
                text: walletUrl,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: window.QRCode.CorrectLevel.H,
              });
            }
          }
        } catch (err) {
          console.error("Error creating QR code:", err);
        }
      };

      loadQRCode();
    }
  }, [isModalOpen, walletUrl]);

  const handleWalletResponse = async (resultRaw: string): Promise<void> => {
    setInProgress(true);

    try {
      if (!window.gc) {
        await loadGameChangerLib();
      }

      console.log("Processing wallet response");

      const resultObj = await window.gc.encodings.msg.decoder(resultRaw);
      console.log("Decoded wallet response:", resultObj);

      if (resultObj.exports?.connect) {
        const connectData = resultObj.exports.connect;

        if (!connectData.data || !connectData.data.address) {
          throw new Error("Wallet response missing address data");
        }

        const balanceData = await fetchWalletBalance(connectData.data.address);

        let finalData = connectData;
        if (balanceData) {
          const balanceInAda = parseInt(balanceData.lovelace) / 1000000;
          finalData = {
            ...connectData,
            data: {
              ...connectData.data,
              balance: balanceInAda,
              assets: balanceData.assets,
            },
            lastActivity: new Date().toISOString(),
          };
        }

        const sessionToken = createSessionToken(finalData);

        console.log("Wallet connected successfully:", finalData.data.address);
        console.log("Wallet data:", finalData);

        setWalletData(finalData);
        setIsConnected(true);

        localStorage.setItem("walletConnection", JSON.stringify(finalData));

        try {
          await fetch("/api/wallet/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: sessionToken,
              wallet: {
                address: finalData.data.address,
                name: finalData.data.name || "Unknown Wallet",
                networkId: finalData.data.addressInfo?.networkId || 1,
              },
            }),
          });
        } catch (apiError) {
          console.error("API error:", apiError);
        }

        setIsModalOpen(false);
      } else {
        throw new Error("Invalid wallet response format");
      }
    } catch (err) {
      console.error("Error processing wallet response", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsConnecting(false);
      setInProgress(false);
    }
  };

  const connect = async (): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!window.gc) {
        await loadGameChangerLib();
      }

      if (!window.gc) {
        throw new Error("GameChanger wallet library failed to load");
      }

      const scriptWithCurrentUrl = {
        ...gcScript,
        returnURLPattern: window.location.origin + window.location.pathname,
      };

      console.log("Generating wallet connection URL");
      const url = await window.gc.encode.url({
        input: JSON.stringify(scriptWithCurrentUrl),
        apiVersion: "2",
        network: "mainnet",
        encoding: "gzip",
      });

      console.log("Wallet URL generated");
      setWalletUrl(url);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error initiating wallet connection", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnecting(false);
    }
  };

  const disconnect = (): void => {
    setWalletData(null);
    setIsConnected(false);
    localStorage.removeItem("walletConnection");

    fetch("/api/wallet/disconnect", {
      method: "POST",
    }).catch((err) => console.error("Error disconnecting from API:", err));
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
      }}
    >
      {children}
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        walletUrl={walletUrl}
        inProgress={inProgress}
      />
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
        qr: (options: {
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
    QRCode: {
      new(
        element: HTMLElement,
        options: {
          text: string;
          width?: number;
          height?: number;
          colorDark?: string;
          colorLight?: string;
          correctLevel?: number;
        }
      ): unknown;
      CorrectLevel: {
        L: number;
        M: number;
        Q: number;
        H: number;
      };
    };
  }
}
