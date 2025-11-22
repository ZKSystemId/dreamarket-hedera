// Hedera Wallet Integration for Frontend
// Using HashConnect for wallet connection

import {
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
} from "@hashgraph/sdk";

// HashConnect will be added later
// For now, we'll use a hybrid approach

export interface WalletConnection {
  accountId: string;
  network: string;
  connected: boolean;
}

export interface MintSoulParams {
  name: string;
  tagline: string;
  rarity: string;
  personality: string;
  skills: string[];
  creationStory: string;
}

// Connect wallet using HashConnect
export async function connectWallet(): Promise<WalletConnection> {
  // TODO: Implement HashConnect
  // For hackathon demo, we'll use backend API approach
  throw new Error("Wallet connection not yet implemented. Use backend API for now.");
}

// Mint Soul NFT via Backend API (Custodial approach for demo)
export async function mintSoulViaAPI(soulData: MintSoulParams): Promise<{
  success: boolean;
  tokenId?: string;
  serial?: number;
  txHash?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/souls/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(soulData),
    });

    if (!response.ok) {
      throw new Error('Failed to mint soul');
    }

    const data = await response.json();
    return {
      success: true,
      tokenId: data.tokenId,
      serial: data.serial,
      txHash: data.txHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Transfer Soul NFT
export async function transferSoul(
  tokenId: string,
  serial: number,
  recipientId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const response = await fetch('/api/souls/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId,
        serial,
        recipientId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to transfer soul');
    }

    const data = await response.json();
    return {
      success: true,
      txHash: data.txHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get Soul NFT metadata from Hedera Mirror Node
export async function getSoulMetadata(tokenId: string, serial: number) {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}/nfts/${serial}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching soul metadata:', error);
    return null;
  }
}
