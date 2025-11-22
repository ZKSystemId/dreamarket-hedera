/**
 * Hedera Mirror Node API Integration
 * Fetch NFTs directly from blockchain, not database
 */

const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com/api/v1";

export interface NFTInfo {
  token_id: string;
  serial_number: number;
  account_id: string;
  metadata: string;
  created_timestamp: string;
}

export interface TokenBalance {
  token_id: string;
  balance: number;
}

/**
 * Get all NFTs owned by an account
 */
export async function getNFTsOwnedByAccount(
  accountId: string,
  tokenId?: string
): Promise<NFTInfo[]> {
  try {
    let url = `${MIRROR_NODE_URL}/accounts/${accountId}/nfts`;
    
    // Filter by specific token if provided
    if (tokenId) {
      url += `?token.id=${tokenId}`;
    }

    console.log("🔍 Fetching NFTs from Mirror Node:", url);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Mirror Node API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    console.log("✅ Found NFTs:", data.nfts?.length || 0);
    
    return data.nfts || [];
  } catch (error) {
    console.error("Error fetching NFTs from Mirror Node:", error);
    return [];
  }
}

/**
 * Get specific NFT details
 */
export async function getNFTDetails(
  tokenId: string,
  serialNumber: number
): Promise<NFTInfo | null> {
  try {
    const url = `${MIRROR_NODE_URL}/tokens/${tokenId}/nfts/${serialNumber}`;
    
    console.log("🔍 Fetching NFT details:", url);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("NFT not found:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log("✅ NFT data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching NFT details:", error);
    return null;
  }
}

/**
 * Get all NFTs in a collection (token)
 */
export async function getNFTsInCollection(tokenId: string): Promise<NFTInfo[]> {
  try {
    const url = `${MIRROR_NODE_URL}/tokens/${tokenId}/nfts`;
    
    console.log("🔍 Fetching collection NFTs:", url);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Collection not found:", response.status);
      return [];
    }

    const data = await response.json();
    
    console.log("✅ Collection has NFTs:", data.nfts?.length || 0);
    
    return data.nfts || [];
  } catch (error) {
    console.error("Error fetching collection NFTs:", error);
    return [];
  }
}

/**
 * Decode NFT metadata
 */
export function decodeNFTMetadata(metadata: string): any {
  try {
    // Metadata is base64 encoded
    const decoded = Buffer.from(metadata, 'base64').toString('utf-8');
    
    // Try to parse as JSON
    try {
      return JSON.parse(decoded);
    } catch {
      // If not JSON, return as string
      return { raw: decoded };
    }
  } catch (error) {
    console.error("Error decoding metadata:", error);
    return { raw: metadata };
  }
}

/**
 * Get account token balances
 */
export async function getAccountTokenBalances(
  accountId: string
): Promise<TokenBalance[]> {
  try {
    const url = `${MIRROR_NODE_URL}/accounts/${accountId}/tokens`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    return data.tokens || [];
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return [];
  }
}

/**
 * Get total NFT count for an account
 */
export async function getTotalNFTCount(accountId: string): Promise<number> {
  try {
    const url = `${MIRROR_NODE_URL}/accounts/${accountId}/nfts`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    
    return data.nfts?.length || 0;
  } catch (error) {
    console.error("Error fetching total NFT count:", error);
    return 0;
  }
}
