'use client';

import AssetBrowser from '@/components/assetBrowser';

export default function AssetsPage() {
  return (
    <main className="flex min-h-screen bg-black items-center justify-center text-neutral-400 py-8">
      <AssetBrowser />
    </main>
  );
}