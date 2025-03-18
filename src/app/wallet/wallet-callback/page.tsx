'use client';

import { FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/walletProvider';

const WalletCallback: FC = () => {
  const router = useRouter();
  const { handleWalletResponse } = useWallet();

  useEffect(() => {
    const processCallback = async () => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const result = url.searchParams.get('result');

        if (result) {
          await handleWalletResponse(result);
        }

        router.push('/');
      }
    };

    processCallback();
  }, [router, handleWalletResponse]);

  return (
    <div className="flex items-center justify-center bg-neutral-500">
      <div className="bg-black/30 border border-amber-500/30 p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <h2 className="text-xl font-medium text-white mb-2">Processing Wallet Connection</h2>
          <p className="text-neutral-400 text-center">Please wait while we complete your wallet connection...</p>
        </div>
      </div>
    </div>
  );
};

export default WalletCallback;