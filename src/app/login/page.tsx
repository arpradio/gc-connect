'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useWallet } from '@/app/providers/walletProvider';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const { isConnected, connect, isConnecting, walletUrl } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [connectionInProgress, setConnectionInProgress] = useState(false);


  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rawRedirect = searchParams.get('redirect');
    const fallback = '/';
    const redirect = rawRedirect ?? localStorage.getItem('walletReturnUrl') ?? fallback;
    localStorage.setItem('walletReturnUrl', redirect);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/wallet/session');
        if (response.ok) {
          const savedUrl = localStorage.getItem('walletReturnUrl') ?? '/';
          router.replace(savedUrl);
          return;
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (isConnected) {
      const savedUrl = localStorage.getItem('walletReturnUrl') || '/';
      router.replace(savedUrl);
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (connectionInProgress && walletUrl) {
      window.open(
        walletUrl,
        'wallet_popup',
        'width=420,height=680,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,noopener=yes'
      );
      setConnectionInProgress(false);
    }
  }, [walletUrl, connectionInProgress]);

  const connectWithSoftWallet = async () => {
    try {
      setConnectionInProgress(true);
      await connect();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
      setConnectionInProgress(false);
    }
  };

  const createWallet = () => {
    window.open(
      'https://beta-wallet.gamechanger.finance/create',
      '_blank'
    );
  };

  if (isCheckingSession || isConnected || connectionInProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900/50">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
        <p className="text-white">
          {connectionInProgress
            ? 'Opening wallet popup...'
            : isConnecting
            ? 'Connecting wallet...'
            : 'Checking session...'}
        </p>
      </div>
    );
  }

  return (
    <section className="bg-black/30 backdrop-blur-md rounded-lg p-8 border flex flex-col h-full mx-auto border-zinc-700 max-w-md">
      <div className="flex items-center justify-center mb-4 text-amber-400">
        <Wallet size={36} />
      </div>

      <h1 className="text-2xl font-bold text-white text-center mb-4">
        Wallet Required
      </h1>

      <p className="text-base mb-6 text-zinc-300 text-center">
        Connect your Cardano wallet to access this content and interact with {process.env.NEXT_PUBLIC_COMPANY_NAME}.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-400" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-4 flex flex-col items-center">
        <Button
          onClick={connectWithSoftWallet}
          className="w-fit bg-amber-600 hover:bg-amber-700 border-[1px] border-neutral-300 text-white px-6 py-3 rounded-lg font-medium"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>

        <div className="flex text-left pl-2 pr-6 items-start text-xs text-amber-500 bg-black/40 py-1 rounded">
          <span className="text-gray-300 text-xl mt-0.5">ℹ️</span>
          <span className="ml-4 text-xs italic">
            A new burner wallet will be created if you do not already have one. See below for other options.
          </span>
        </div>

        <hr className="text-neutral-300 w-full pb-2" />

        <Button
          onClick={createWallet}
          variant="outline"
          className="w-fit border-zinc-700 hover:border-zinc-500 bg-purple-900/30 hover:bg-purple-800/50 text-zinc-300"
        >
          New to Cardano? Create a Wallet
        </Button>
      </div>

      <p className="mt-2 text-xs italic text-zinc-400 text-center">
        A new window will open to complete the wallet connection process, which can be closed after completion.
      </p>
    </section>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-slate-900/50">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}