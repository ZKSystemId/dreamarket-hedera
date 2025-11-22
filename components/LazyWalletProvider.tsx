"use client";

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';

// Lazy load WalletProvider with no SSR
const WalletProviderComponent = dynamic(
  () => import('@/contexts/WalletContext').then(mod => mod.WalletProvider),
  {
    ssr: false,
    loading: () => <WalletProviderFallback />,
  }
);

function WalletProviderFallback() {
  return (
    <div className="min-h-screen bg-background">
      {/* Placeholder while wallet provider loads */}
    </div>
  );
}

export function LazyWalletProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<WalletProviderFallback />}>
      <WalletProviderComponent>{children}</WalletProviderComponent>
    </Suspense>
  );
}
