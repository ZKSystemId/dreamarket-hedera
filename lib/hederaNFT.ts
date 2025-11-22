/**
 * Hedera NFT Minting Service
 * Real HTS (Hedera Token Service) integration for minting Soul NFTs
 */

import { 
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction, 
  TransferTransaction, 
  TokenId, 
  Hbar,
  AccountBalanceQuery,
  TokenAssociateTransaction
} from "@hashgraph/sdk";

// Hedera client setup
let client: Client | null = null;

function getHederaClient(): Client {
  if (!client) {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
      throw new Error("Hedera credentials not configured in .env");
    }

    client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromString(operatorKey)
    );
  }

  return client;
}

/**
 * Create NFT Collection (Token)
 * This should be done once to create the collection
 */
export async function createNFTCollection(
  collectionName: string,
  collectionSymbol: string
): Promise<string> {
  const client = getHederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);

  console.log("🎨 Creating NFT collection:", collectionName);

  // Create NFT token
  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName(collectionName)
    .setTokenSymbol(collectionSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .setAdminKey(operatorKey)
    .setMaxTransactionFee(new Hbar(30))
    .freezeWith(client);

  const tokenCreateSign = await tokenCreateTx.sign(operatorKey);
  const tokenCreateSubmit = await tokenCreateSign.execute(client);
  const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  const tokenId = tokenCreateRx.tokenId!;

  console.log("✅ NFT Collection created:", tokenId.toString());

  return tokenId.toString();
}

/**
 * Mint NFT to specific user wallet
 */
export async function mintNFTToUser(
  tokenId: string,
  recipientAccountId: string,
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: any[];
  }
): Promise<{
  tokenId: string;
  serialNumber: number;
  transactionId: string;
  metadataUrl: string;
  finalOwner: string;
  transferredToUser: boolean;
  transferError?: string;
}> {
  const client = getHederaClient();
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);

  console.log("🎨 Minting NFT to user:", recipientAccountId);

  // CRITICAL: Check if recipient is different from operator BEFORE minting
  const recipientAccount = AccountId.fromString(recipientAccountId);
  if (recipientAccount.equals(operatorId)) {
    throw new Error("Operator account cannot mint to itself. Use user account for minting.");
  }

  // CRITICAL: Check if user has associated the token, if not auto-associate
  try {
    console.log("🔍 Checking token association for user:", recipientAccountId);
    console.log("   Token ID:", tokenId);
    
    const balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(recipientAccount)
      .execute(client);
    
    console.log("   User token balances:", balanceCheckTx.tokens);
    console.log("   All token keys:", Array.from(balanceCheckTx.tokens?.keys() || []));
    
    const tokenBalance = balanceCheckTx.tokens?.get(tokenId);
    console.log("   Token balance for", tokenId, ":", tokenBalance?.toString());
    
    if (tokenBalance === undefined) {
      console.log("⚠️ Token not associated - attempting auto-associate...");
      
      try {
        // Auto-associate token for user
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(recipientAccount)
          .setTokenIds([TokenId.fromString(tokenId)])
          .setMaxTransactionFee(new Hbar(20))
          .freezeWith(client);
        
        const associateSign = await associateTx.sign(operatorKey);
        const associateSubmit = await associateSign.execute(client);
        const associateRx = await associateSubmit.getReceipt(client);
        
        console.log("✅ Token auto-associated successfully!");
        console.log("   Association transaction:", associateSubmit.transactionId.toString());
        
        // Verify association worked
        console.log("🔍 Verifying association after auto-associate...");
        const verifyBalanceTx = await new AccountBalanceQuery()
          .setAccountId(recipientAccount)
          .execute(client);
        
        const verifyTokenBalance = verifyBalanceTx.tokens?.get(tokenId);
        console.log("   Token balance after association:", verifyTokenBalance?.toString());
        
        if (verifyTokenBalance === undefined) {
          throw new Error("Auto-associate transaction succeeded but token still not found in account");
        }
        
      } catch (associateError: any) {
        console.error("❌ Auto-associate failed:", associateError.message);
        throw new Error(`Failed to auto-associate token: ${associateError.message}. Please manually associate the token at https://hashscan.io/testnet/token/${tokenId}`);
      }
    }
  } catch (associationError: any) {
    console.error("❌ Token association process failed:", associationError.message);
    throw new Error(`Token association failed: ${associationError.message}`);
  }

  // Create compact metadata (max 100 bytes for Hedera)
  const metadataJSON = JSON.stringify(metadata);
  const metadataBuffer = Buffer.from(metadataJSON);

  // Step 1: Mint NFT to operator first
  console.log("📝 Step 1: Minting NFT to operator...");
  const mintTx = await new TokenMintTransaction()
    .setTokenId(TokenId.fromString(tokenId))
    .setMetadata([metadataBuffer])
    .setMaxTransactionFee(new Hbar(20))
    .freezeWith(client);

  const mintSign = await mintTx.sign(operatorKey);
  const mintSubmit = await mintSign.execute(client);
  const mintRx = await mintSubmit.getReceipt(client);
  const serialNumber = mintRx.serials[0].toNumber();

  console.log("✅ NFT minted, serial number:", serialNumber);

  // Step 2: Immediately transfer to user (CRITICAL - no exceptions)
  console.log("📤 Step 2: Transferring NFT to user wallet...");
  
  const transferTx = await new TransferTransaction()
    .addNftTransfer(
      TokenId.fromString(tokenId),
      serialNumber,
      operatorId,
      recipientAccount
    )
    .setMaxTransactionFee(new Hbar(20))
    .freezeWith(client);

  const transferSign = await transferTx.sign(operatorKey);
  const transferSubmit = await transferSign.execute(client);
  const transferRx = await transferSubmit.getReceipt(client);

  console.log("🔍 Verifying transfer result...");
  console.log("   Transfer status:", transferRx.status.toString());
  console.log("   Transaction ID:", transferSubmit.transactionId.toString());

  // CRITICAL: Verify NFT actually moved to user
  try {
    console.log("🔍 Checking user account after transfer...");
    const userBalanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(recipientAccount)
      .execute(client);
    
    console.log("   User token balances after transfer:", userBalanceCheckTx.tokens);
    console.log("   All token keys after transfer:", Array.from(userBalanceCheckTx.tokens?.keys() || []));
    
    const userTokenBalance = userBalanceCheckTx.tokens?.get(tokenId);
    console.log("   User token balance after transfer:", userTokenBalance?.toString());
    
    if (!userTokenBalance || userTokenBalance.toNumber() === 0) {
      // Check operator account to see where NFT went
      console.log("🔍 Checking operator account...");
      const operatorBalanceCheckTx = await new AccountBalanceQuery()
        .setAccountId(operatorId)
        .execute(client);
      
      const operatorTokenBalance = operatorBalanceCheckTx.tokens?.get(tokenId);
      console.log("   Operator token balance after transfer:", operatorTokenBalance?.toString());
      
      throw new Error(`Transfer verification failed: NFT not found in user account ${recipientAccountId}. NFT is still with operator ${operatorId}`);
    }
    
    console.log("✅ Transfer verification successful - NFT is in user account");
  } catch (verifyError: any) {
    console.error("❌ Transfer verification failed:", verifyError.message);
    throw new Error(`Transfer failed verification: ${verifyError.message}`);
  }

  const finalOwner = recipientAccount;
  const txId = transferSubmit.transactionId.toString();
  console.log("✅ NFT successfully transferred to user:", recipientAccountId);

  // Create metadata URL
  const metadataUrl = `https://hashscan.io/testnet/token/${tokenId}/${serialNumber}`;

  return {
    tokenId,
    serialNumber,
    transactionId: txId,
    metadataUrl,
    finalOwner: finalOwner.toString(),
    transferredToUser: true,
    transferError: undefined
  };
}

/**
 * Get NFT info from Hedera Mirror Node
 */
export async function getNFTInfo(
  tokenId: string,
  serialNumber: number
): Promise<any> {
  const response = await fetch(
    `https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}/nfts/${serialNumber}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch NFT info");
  }

  return response.json();
}

/**
 * Check if user has associated with token
 */
export async function checkTokenAssociation(
  accountId: string,
  tokenId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.tokens && data.tokens.length > 0;
  } catch (error) {
    console.error("Error checking token association:", error);
    return false;
  }
}
