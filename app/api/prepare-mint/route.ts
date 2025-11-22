/**
 * Prepare Mint Transaction API
 * Returns transaction bytes for user to approve and sign
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  TokenMintTransaction,
  PrivateKey,
  AccountId,
  Client,
  TokenId,
  Hbar,
} from "@hashgraph/sdk";

/**
 * Create compact metadata (max 100 bytes for Hedera NFT)
 */
function createCompactMetadata(soulData: any): Buffer {
  // Create ultra-compact metadata
  // Strategy: Use short keys and truncate values
  const metadata = {
    n: (soulData.name || "Soul").substring(0, 20),  // name (max 20 chars)
    r: (soulData.rarity || "Common").substring(0, 1).toUpperCase(), // rarity (C/R/L/M)
    t: "Soul"  // type
  };

  const metadataString = JSON.stringify(metadata);
  const metadataBuffer = Buffer.from(metadataString);
  
  console.log('📏 Metadata size:', metadataBuffer.length, 'bytes');
  console.log('📄 Metadata:', metadataString);
  
  // Safety check - MUST be under 100 bytes
  if (metadataBuffer.length >= 100) {
    // If still too large, make it even smaller
    const ultraCompact = {
      n: (soulData.name || "Soul").substring(0, 15),
      r: (soulData.rarity || "C").substring(0, 1).toUpperCase(),
    };
    const ultraString = JSON.stringify(ultraCompact);
    const ultraBuffer = Buffer.from(ultraString);
    
    if (ultraBuffer.length >= 100) {
      throw new Error(`Metadata too large: ${ultraBuffer.length} bytes (max 100). Name too long.`);
    }
    
    console.log('📏 Using ultra-compact metadata:', ultraBuffer.length, 'bytes');
    return ultraBuffer;
  }
  
  return metadataBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const { soulData, recipientAccountId } = await request.json();

    console.log("📝 Preparing mint transaction for user approval...");
    console.log("   Recipient:", recipientAccountId);
    console.log("   Soul Name:", soulData?.name);

    if (!soulData || !recipientAccountId) {
      return NextResponse.json(
        { success: false, error: "Missing soulData or recipientAccountId" },
        { status: 400 }
      );
    }

    const tokenId = process.env.HEDERA_NFT_TOKEN_ID || process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || "0.0.7242548";
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!);

    // Create client for testnet
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    console.log("✅ Client created");

    // Create compact metadata (max 100 bytes)
    const metadataBuffer = createCompactMetadata(soulData);

    // Create mint transaction
    // Note: Mint will go to operator treasury, then we'll transfer to user
    const mintTx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([metadataBuffer])
      .setMaxTransactionFee(new Hbar(5))
      .freezeWith(client);

    // Sign with operator key (supply key is required for minting)
    // User will approve fee payment via HashConnect
    const signedMintTx = await mintTx.sign(operatorKey);

    console.log("✅ Mint transaction prepared (operator signed with supply key)");
    console.log("   User will approve fee payment via HashConnect");

    // Serialize signed transaction for user to approve
    const mintTxBytes = signedMintTx.toBytes();

    // Close client
    client.close();

    return NextResponse.json({
      success: true,
      transactionBytes: Buffer.from(mintTxBytes).toString('base64'),
      tokenId,
      recipientAccountId,
      metadataSize: metadataBuffer.length,
    });
  } catch (error: any) {
    console.error("❌ Prepare mint error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to prepare mint transaction",
      },
      { status: 500 }
    );
  }
}
