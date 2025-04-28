// Updated AppProviders.tsx with improved localStorage synchronization 
'use client';

import { type FC, type ReactNode, useEffect } from 'react';
import { WalletProvider } from './walletProvider';

type AppProvidersProps = {
  readonly children: ReactNode;
};

export const AppProviders: FC<AppProvidersProps> = ({ children }): React.ReactElement => {
  useEffect(() => {
    const checkLocalStorageCallback = (): void => {
      const callbackData = localStorage.getItem('gc_wallet_callback');

      if (callbackData) {
        console.log("Detected callback data in localStorage");
        
        // Try both methods for maximum compatibility
        try {
          // 1. Post message approach
          window.postMessage(`gc:${callbackData}`, window.location.origin);
          
          // 2. Direct event dispatch approach
          const event = new CustomEvent('walletCallbackReceived', { 
            detail: { data: callbackData },
            bubbles: true 
          });
          document.dispatchEvent(event);
        } catch (error) {
          console.error("Error dispatching wallet callback:", error);
        }
        
        // Clear the storage item after a short delay to ensure processing
        setTimeout(() => {
          localStorage.removeItem('gc_wallet_callback');
        }, 500);
      }
    };

    // Initial check
    checkLocalStorageCallback();

    // Watch for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'gc_wallet_callback' && e.newValue) {
        checkLocalStorageCallback();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Periodic check as extra safety (Firefox sometimes misses storage events)
    const intervalId = setInterval(checkLocalStorageCallback, 500);
    
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

export default AppProviders;