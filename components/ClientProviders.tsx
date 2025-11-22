"use client";

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/toast';

// Dynamically import WalletProvider to avoid SSR issues
const WalletProvider = dynamic(
  () => import('@/contexts/WalletContext').then((mod) => mod.WalletProvider),
  { ssr: false }
);

export default function ClientProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LanguageProvider>
      <WalletProvider>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}
