import { NextRequest, NextResponse } from "next/server";
import { createNFTCollection } from "@/lib/hederaNFT";

export async function POST(request: NextRequest) {
  try {
    console.log("🎨 Creating NFT collection...");

    const tokenId = await createNFTCollection(
      "DreamMarket Souls",
      "SOUL"
    );

    console.log("✅ NFT Collection created:", tokenId);

    return NextResponse.json({
      success: true,
      data: {
        tokenId,
        explorerUrl: `https://hashscan.io/testnet/token/${tokenId}`,
        message: `Collection created! Add this to your .env:\nHEDERA_NFT_TOKEN_ID=${tokenId}`,
      },
    });
  } catch (error: any) {
    console.error("❌ Create collection error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create collection",
        details: "Make sure HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are set in .env"
      },
      { status: 500 }
    );
  }
}
