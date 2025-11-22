/**
 * Register Agent on Smart Contract (ERC-8004)
 * POST /api/contract/register-agent
 * 
 * Registers a new AI agent (Soul) on the ERC-8004 compliant smart contract
 */

import { NextRequest, NextResponse } from "next/server";
import { registerAgentOnChain } from "@/lib/hederaContract";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, name, tagline, rarity, creatorAddress, ownerAddress } = body;

    // Validate input
    if (!tokenId || !name || !tagline || rarity === undefined || !creatorAddress || !ownerAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate rarity (0-3)
    if (rarity < 0 || rarity > 3) {
      return NextResponse.json(
        { success: false, error: "Invalid rarity (must be 0-3)" },
        { status: 400 }
      );
    }

    console.log("📝 Registering agent on smart contract...");
    console.log("   Token ID:", tokenId);
    console.log("   Name:", name);
    console.log("   Rarity:", rarity);

    // Register agent on-chain
    const result = await registerAgentOnChain({
      tokenId,
      name,
      tagline,
      rarity,
      creatorAddress,
      ownerAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to register agent" },
        { status: 500 }
      );
    }

    console.log("✅ Agent registered on smart contract!");
    console.log("   Agent ID:", result.agentId);
    console.log("   Transaction Hash:", result.txHash);

    return NextResponse.json({
      success: true,
      agentId: result.agentId,
      transactionHash: result.txHash,
      message: "Agent registered successfully on ERC-8004 contract",
    });
  } catch (error: any) {
    console.error("❌ Register agent error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register agent",
      },
      { status: 500 }
    );
  }
}

