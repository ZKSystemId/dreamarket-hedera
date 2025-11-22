/**
 * Get Serial Number API
 * Query operator account to find the latest minted NFT serial number
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey,
  TokenId,
} from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
  try {
    const { tokenId, transactionId } = await request.json();

    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: "Token ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Querying operator account for latest NFT...");
    console.log("   Token ID:", tokenId);
    console.log("   Transaction ID:", transactionId);

    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!);

    // Create client
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    // Query operator account balance to get NFT count
    const balanceQuery = await new AccountBalanceQuery()
      .setAccountId(operatorId)
      .execute(client);

    const tokenBalance = balanceQuery.tokens?.get(tokenId);
    const nftCount = tokenBalance?.toNumber() || 0;

    console.log("   NFT count in operator account:", nftCount);

    if (nftCount === 0) {
      client.close();
      return NextResponse.json({
        success: false,
        error: "No NFTs found in operator account",
      });
    }

    // Query mirror node to get the latest NFT for this token
    try {
      const mirrorResponse = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}/nfts?order=desc&limit=10`
      );

      if (mirrorResponse.ok) {
        const nftData = await mirrorResponse.json();
        
        if (nftData.nfts && nftData.nfts.length > 0) {
          // Find the NFT that was minted in our transaction (if transactionId provided)
          // Otherwise, just get the latest one
          let targetNFT = nftData.nfts[0]; // Latest by default
          
          if (transactionId) {
            // Try to find NFT minted in this transaction
            for (const nft of nftData.nfts) {
              // Check if this NFT was minted recently (within last 2 minutes)
              const mintTime = parseInt(nft.created_timestamp) * 1000;
              const now = Date.now();
              const timeDiff = now - mintTime;
              
              if (timeDiff < 120000) { // Within 2 minutes
                targetNFT = nft;
                console.log("   Found recently minted NFT:", nft.serial_number);
                break;
              }
            }
          }

          const serialNumber = parseInt(targetNFT.serial_number);
          console.log("✅ Found serial number:", serialNumber);

          client.close();

          return NextResponse.json({
            success: true,
            serialNumber,
            nftCount,
          });
        }
      }
    } catch (mirrorError) {
      console.error("❌ Error querying mirror node:", mirrorError);
    }

    client.close();

    return NextResponse.json({
      success: false,
      error: "Could not find serial number",
    });
  } catch (error: any) {
    console.error("❌ Get serial number error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get serial number",
      },
      { status: 500 }
    );
  }
}

