import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DreamMarket - The Marketplace of Digital Souls",
  description: "Create, own, and trade AI personalities with on-chain identity powered by Hedera. Built for Hedera Hello Future Hackathon 2025.",
  keywords: ["AI agents", "marketplace", "Hedera", "blockchain", "NFT", "digital souls"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
