import { NextRequest, NextResponse } from "next/server";
import { saveSoulToDB } from "@/lib/supabaseClient";

/**
 * Save minted NFT to database
 * Note: NFT is already minted via prepare-mint + user approval flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipientAccountId,
      soulData,
      tokenId, // Format: "0.0.123456:1" (tokenId:serialNumber)
      transactionId,
    } = body;

    if (!recipientAccountId) {
      return NextResponse.json(
        { error: "Recipient account ID is required" },
        { status: 400 }
      );
    }

    if (!soulData) {
      return NextResponse.json(
        { error: "Soul data is required" },
        { status: 400 }
      );
    }

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    // If recipientAccountId is "OPERATOR", use actual operator ID
    const actualOwnerId = recipientAccountId === "OPERATOR" 
      ? process.env.HEDERA_OPERATOR_ID || recipientAccountId
      : recipientAccountId;

    console.log("💾 Saving minted NFT to database:", tokenId);
    console.log("   Owner (original):", recipientAccountId);
    console.log("   Owner (actual):", actualOwnerId);
    console.log("   Soul Name:", soulData.name);

    // Parse tokenId (format: "0.0.123456:1")
    const [tokenIdOnly, serialNumber] = tokenId.split(':');

    // Create soul_id format: Soul-421755 (consistent format)
    const soulIdFormatted = `Soul-${Date.now().toString().slice(-6)}`;
    
    // Save to database - use direct insert to ensure consistent soul_id
    let savedSoulId = soulIdFormatted;
    try {
      const { supabase } = await import("@/lib/supabase");
      
      const { data: insertedData, error: insertError } = await supabase.from('souls').insert({
        soul_id: soulIdFormatted,
        name: soulData.name,
        tagline: soulData.tagline || "",
        personality: soulData.personality || "",
        rarity: soulData.rarity || "Common",
        level: soulData.level || 1,
        xp: soulData.xp || 0,
        skills: soulData.skills || [],
        owner_account_id: actualOwnerId,
        creator_account_id: actualOwnerId,
        token_id: tokenId,
        creation_tx_hash: transactionId || null,
        is_listed: false,
      }).select('soul_id').single();
      
      if (insertError) {
        console.error("❌ Failed to insert soul:", insertError);
        throw insertError;
      }
      
      if (insertedData) {
        savedSoulId = insertedData.soul_id;
        console.log("✅ Soul saved to database:", savedSoulId);
      }
    } catch (dbError: any) {
      console.error("❌ Failed to save soul to database:", dbError);
      // Don't throw - return soul_id anyway so redirect can work
    }

    // Register agent on ERC-8004 smart contract (optional, won't fail if contract not deployed)
    let contractRegistrationResult = null;
    try {
      const { registerAgentOnChain } = await import("@/lib/hederaContract");
      
      // Convert rarity string to number (0=Common, 1=Rare, 2=Legendary, 3=Mythic)
      const rarityMap: Record<string, number> = {
        'Common': 0,
        'Rare': 1,
        'Legendary': 2,
        'Mythic': 3,
      };
      const rarityNumber = rarityMap[soulData.rarity || 'Common'] || 0;

      // Convert Hedera account ID to Ethereum address format (for contract)
      // For Hedera, we'll use a simple conversion or use operator account
      const ownerAddress = actualOwnerId.startsWith('0.0.') 
        ? `0x${actualOwnerId.replace(/\./g, '').padStart(40, '0')}` 
        : actualOwnerId;

      contractRegistrationResult = await registerAgentOnChain({
        tokenId,
        name: soulData.name,
        tagline: soulData.tagline || "",
        rarity: rarityNumber,
        creatorAddress: ownerAddress,
        ownerAddress: ownerAddress,
      });

      if (contractRegistrationResult.success) {
        console.log("✅ Agent registered on ERC-8004 contract!");
        console.log("   Contract Agent ID:", contractRegistrationResult.agentId);
        console.log("   Transaction Hash:", contractRegistrationResult.txHash);
      } else {
        console.warn("⚠️ Failed to register agent on contract (non-critical):", contractRegistrationResult.error);
      }
    } catch (contractError: any) {
      console.warn("⚠️ Contract registration failed (non-critical):", contractError.message);
      // Don't fail the entire request if contract registration fails
    }

    return NextResponse.json({
      success: true,
      data: {
        soulId: savedSoulId, // Return actual saved soul_id for redirect
        tokenId: tokenIdOnly,
        serialNumber: parseInt(serialNumber) || 0,
        transactionId: transactionId || "",
        explorerUrl: `https://hashscan.io/testnet/token/${tokenIdOnly}/${serialNumber}`,
      },
    });
  } catch (error: any) {
    console.error("❌ Save NFT to database error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save NFT to database" },
      { status: 500 }
    );
  }
}
