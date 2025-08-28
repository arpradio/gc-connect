'use client';

import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { WalletProvider } from './walletProvider';

type AppProvidersProps = {
  readonly children: ReactNode;
};

export const AppProviders: FC<AppProvidersProps> = ({ children }): React.ReactElement => {
  const callbackProcessedRef = useRef(false);

  useEffect(() => {
    const processCallback = (callbackData: string): void => {
      if (callbackProcessedRef.current) return;
      
      console.log("Processing wallet callback data");
      callbackProcessedRef.current = true;
      
      try {
        window.postMessage(`gc:${callbackData}`, window.location.origin);
        
        const event = new CustomEvent('walletCallbackReceived', { 
          detail: { data: callbackData },
          bubbles: true 
        });
        document.dispatchEvent(event);
        
        setTimeout(() => {
          localStorage.removeItem('gc_wallet_callback');
          callbackProcessedRef.current = false;
        }, 1000);
        
      } catch (error) {
        console.error("Error processing wallet callback:", error);
        callbackProcessedRef.current = false;
      }
    };

    const checkCallback = (): void => {
      const callbackData = localStorage.getItem('gc_wallet_callback');
      if (callbackData && !callbackProcessedRef.current) {
        processCallback(callbackData);
      }
    };

    checkCallback();

    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'gc_wallet_callback' && e.newValue && !callbackProcessedRef.current) {
        processCallback(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const intervalId = setInterval(checkCallback, 1000);
    
    return (): void => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
};