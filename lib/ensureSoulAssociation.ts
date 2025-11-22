/**
 * Frontend Helper for Soul Token Association
 * 
 * Ensures user account is associated with Soul NFT token
 * before minting. Handles TokenAssociateTransaction if needed.
 */

import { 
  TokenAssociateTransaction, 
  AccountId, 
  TokenId, 
  Status,
  Transaction
} from "@hashgraph/sdk";
import { isTokenAssociated } from "@/lib/hederaAssociation";

/**
 * Ensure user account is associated with Soul NFT token
 * 
 * Flow:
 * 1. Check via Mirror Node if already associated
 * 2. If yes -> return immediately (no approval needed)
 * 3. If no -> create TokenAssociateTransaction and request user approval
 * 
 * @param accountId - User's Hedera account ID
 * @param sendTransaction - Function to send transaction via wallet (from WalletContext)
 * @param soulTokenId - Soul NFT token ID (from env)
 * @param network - Network (testnet or mainnet)
 * @throws Error if association transaction fails
 */
export async function ensureSoulAssociated(
  accountId: string,
  sendTransaction: (transaction: Transaction) => Promise<{ transactionId: string }>,
  soulTokenId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔗 ENSURE SOUL ASSOCIATION`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Account: ${accountId}`);
  console.log(`Token: ${soulTokenId}`);
  console.log(`Network: ${network}`);

  // Step 1: Check if already associated via Mirror Node
  console.log(`\n📡 Step 1: Checking association via Mirror Node...`);
  const alreadyAssociated = await isTokenAssociated(accountId, soulTokenId, network);

  if (alreadyAssociated) {
    console.log(`✅ Already associated! No action needed.`);
    console.log(`${'='.repeat(60)}\n`);
    return;
  }

  // Step 2: Not associated - need to send TokenAssociateTransaction
  console.log(`\n⚠️  Not associated yet. Creating TokenAssociateTransaction...`);

  try {
    // Import Client dynamically to avoid SSR issues
    const { Client } = await import("@hashgraph/sdk");

    // Create client for the network
    const client = network === "testnet" 
      ? Client.forTestnet() 
      : Client.forMainnet();

    // IMPORTANT: We don't set operator here because user will sign via wallet
    // Transaction will be created without operator and signed by user's wallet

    // Create TokenAssociateTransaction
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(soulTokenId)])
      .freezeWith(client);

    console.log(`📝 TokenAssociateTransaction created`);
    console.log(`   Account: ${accountId}`);
    console.log(`   Token: ${soulTokenId}`);

    // Step 3: Send to user's wallet for approval
    console.log(`\n🔐 Step 2: Requesting user approval via wallet...`);
    console.log(`   User will see popup to approve TokenAssociateTransaction`);

    const { transactionId } = await sendTransaction(associateTx);

    console.log(`✅ Association transaction approved!`);
    console.log(`   Transaction ID: ${transactionId}`);

    // Step 4: Wait a moment for Mirror Node to update
    console.log(`\n⏳ Waiting 2 seconds for Mirror Node to update...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Verify association succeeded
    console.log(`\n🔍 Step 3: Verifying association...`);
    const nowAssociated = await isTokenAssociated(accountId, soulTokenId, network);

    if (!nowAssociated) {
      console.warn(`⚠️  Association verification failed. Mirror Node may not have updated yet.`);
      console.warn(`   Proceeding anyway - mint/transfer will fail if association didn't work.`);
    } else {
      console.log(`✅ Association verified successfully!`);
    }

    console.log(`${'='.repeat(60)}\n`);

    client.close();
  } catch (error: any) {
    console.error(`\n❌ Association failed:`, error);
    console.log(`${'='.repeat(60)}\n`);

    // Provide user-friendly error message
    let errorMessage = "Failed to associate Soul NFT token with your account.";
    
    if (error.message?.includes("USER_REJECT")) {
      errorMessage = "You rejected the token association. Please approve to continue.";
    } else if (error.message?.includes("INSUFFICIENT_TX_FEE")) {
      errorMessage = "Insufficient HBAR for transaction fee. Please add HBAR to your account.";
    } else if (error.message) {
      errorMessage = `Association failed: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Check if Soul token is associated (wrapper for convenience)
 * 
 * @param accountId - User's Hedera account ID
 * @param network - Network (testnet or mainnet)
 * @returns true if associated, false otherwise
 */
export async function isSoulTokenAssociated(
  accountId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<boolean> {
  // Use NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID (existing in Vercel) or fallback to NEXT_PUBLIC_SOUL_NFT_TOKEN_ID
  const soulTokenId = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || process.env.NEXT_PUBLIC_SOUL_NFT_TOKEN_ID;
  
  if (!soulTokenId) {
    console.error("❌ Soul NFT Token ID not configured (NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID or NEXT_PUBLIC_SOUL_NFT_TOKEN_ID)");
    return false;
  }

  return isTokenAssociated(accountId, soulTokenId, network);
}
