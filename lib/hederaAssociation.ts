/**
 * Hedera Token Association Helper
 * 
 * Provides utilities to check and ensure token association
 * for user accounts before minting/transferring NFTs.
 */

/**
 * Check if an account is associated with a specific token
 * via Hedera Mirror Node API
 * 
 * @param accountId - Hedera account ID (e.g., "0.0.123456")
 * @param tokenId - Hedera token ID (e.g., "0.0.7242548")
 * @param network - Network to query (testnet or mainnet)
 * @returns true if associated, false otherwise
 */
export async function isTokenAssociated(
  accountId: string,
  tokenId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<boolean> {
  try {
    const baseUrl = network === "testnet"
      ? "https://testnet.mirrornode.hedera.com"
      : "https://mainnet.mirrornode.hedera.com";

    const url = `${baseUrl}/api/v1/tokens/${tokenId}/balances?account.id=${accountId}`;

    console.log(`🔍 [Association Check] Checking if ${accountId} is associated with token ${tokenId}`);
    console.log(`   Mirror Node URL: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️  [Association Check] Mirror Node returned ${response.status}`);
      // If API fails, assume not associated to be safe
      return false;
    }

    const data = await response.json();

    // Check if balances array contains our account
    const balances = data.balances || [];
    const isAssociated = balances.some((balance: any) => 
      balance.account === accountId
    );

    if (isAssociated) {
      console.log(`✅ [Association Check] Account ${accountId} IS associated with token ${tokenId}`);
    } else {
      console.log(`❌ [Association Check] Account ${accountId} is NOT associated with token ${tokenId}`);
    }

    return isAssociated;
  } catch (error) {
    console.error(`❌ [Association Check] Error checking association:`, error);
    // On error, assume not associated to be safe
    return false;
  }
}

/**
 * Get all tokens associated with an account
 * Useful for debugging
 * 
 * @param accountId - Hedera account ID
 * @param network - Network to query
 * @returns Array of token IDs
 */
export async function getAssociatedTokens(
  accountId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<string[]> {
  try {
    const baseUrl = network === "testnet"
      ? "https://testnet.mirrornode.hedera.com"
      : "https://mainnet.mirrornode.hedera.com";

    const url = `${baseUrl}/api/v1/accounts/${accountId}/tokens`;

    console.log(`🔍 [Get Tokens] Fetching all tokens for ${accountId}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️  [Get Tokens] Mirror Node returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const tokens = (data.tokens || []).map((t: any) => t.token_id);

    console.log(`✅ [Get Tokens] Found ${tokens.length} associated tokens`);
    console.log(`   Tokens:`, tokens);

    return tokens;
  } catch (error) {
    console.error(`❌ [Get Tokens] Error fetching tokens:`, error);
    return [];
  }
}
