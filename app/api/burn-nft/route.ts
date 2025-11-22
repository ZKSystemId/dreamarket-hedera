/**
 * Burn NFT API
 * Burn NFT that failed to transfer (still in operator account)
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  TokenBurnTransaction,
  PrivateKey,
  AccountId,
  Client,
  TokenId,
  Hbar,
  AccountBalanceQuery,
} from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
  try {
    const { 
      tokenId, 
      serialNumber,
    } = await request.json();

    if (!tokenId || !serialNumber) {
      return NextResponse.json(
        { success: false, error: "Token ID and serial number are required" },
        { status: 400 }
      );
    }

    console.log("🔥 Burning NFT...");
    console.log("   Token ID:", tokenId);
    console.log("   Serial:", serialNumber);

    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!);

    // Create client
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    const tokenIdParsed = TokenId.fromString(tokenId);

    // CRITICAL: Verify NFT is in operator account before burning
    console.log("🔍 Verifying NFT ownership...");
    try {
      const balanceQuery = await new AccountBalanceQuery()
        .setAccountId(operatorId)
        .execute(client);
      
      const tokenBalance = balanceQuery.tokens?.get(tokenId);
      const nftCount = tokenBalance?.toNumber() || 0;
      
      console.log("   NFT count in operator account:", nftCount);
      
      if (nftCount === 0) {
        client.close();
        return NextResponse.json(
          { 
            success: false, 
            error: "NFT not found in operator account. Only operator can burn NFTs." 
          },
          { status: 403 }
        );
      }

      // Verify this specific serial number exists
      // Query mirror node to check if NFT is in operator account
      try {
        const mirrorResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}/nfts/${serialNumber}`
        );
        
        if (mirrorResponse.ok) {
          const nftData = await mirrorResponse.json();
          const currentOwner = nftData.account_id;
          
          console.log("   Current NFT owner:", currentOwner);
          console.log("   Operator account:", operatorId.toString());
          
          if (currentOwner !== operatorId.toString()) {
            client.close();
            return NextResponse.json(
              { 
                success: false, 
                error: `NFT is owned by ${currentOwner}, not operator. Only operator can burn NFTs.` 
              },
              { status: 403 }
            );
          }
        }
      } catch (mirrorError) {
        console.warn("⚠️ Could not verify NFT ownership from mirror node:", mirrorError);
        // Continue anyway - we'll let the burn transaction fail if NFT is not in operator account
      }
    } catch (verifyError: any) {
      console.error("❌ Error verifying NFT ownership:", verifyError);
      client.close();
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to verify NFT ownership" 
        },
        { status: 500 }
      );
    }

    // Create burn transaction
    // Note: NFT must be in treasury account (operator account) to burn
    const burnTx = await new TokenBurnTransaction()
      .setTokenId(tokenIdParsed)
      .setSerials([serialNumber])
      .setMaxTransactionFee(new Hbar(5))
      .freezeWith(client);

    console.log("📝 Executing burn transaction...");

    // Sign with operator key (supply key is required for burning)
    const signedBurnTx = await burnTx.sign(operatorKey);
    const txResponse = await signedBurnTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log("✅ NFT burned successfully!");
    console.log("   Transaction ID:", txResponse.transactionId.toString());
    console.log("   Status:", receipt.status.toString());

    client.close();

    return NextResponse.json({
      success: true,
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
      message: `NFT ${tokenId}:${serialNumber} has been burned`,
    });
  } catch (error: any) {
    console.error("❌ Burn NFT error:", error);
    console.error("   Error details:", error.message);
    console.error("   Stack:", error.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to burn NFT",
      },
      { status: 500 }
    );
  }
}

