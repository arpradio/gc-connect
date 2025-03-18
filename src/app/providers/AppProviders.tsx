'use client';

import { type FC, type ReactNode, useEffect } from 'react';
import { WalletProvider } from '@/lib/walletProvider';

type AppProvidersProps = {
  readonly children: ReactNode;
};

export const AppProviders: FC<AppProvidersProps> = ({ children }): React.ReactElement => {
  useEffect(() => {
    const checkLocalStorageCallback = (): void => {
      const callbackData = localStorage.getItem('gc_wallet_callback');

      if (callbackData) {
        window.postMessage(`gc:${callbackData}`, window.location.origin);
        localStorage.removeItem('gc_wallet_callback');
      }
    };

    checkLocalStorageCallback();

    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'gc_wallet_callback' && e.newValue) {
        checkLocalStorageCallback();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return (): void => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (

    <WalletProvider>
      {children}
    </WalletProvider>

  );
};

export default AppProviders;