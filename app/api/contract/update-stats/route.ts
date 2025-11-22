/**
 * Update Agent Stats on Smart Contract
 * POST /api/contract/update-stats
 * 
 * Updates agent level, XP, and reputation on the ERC-8004 contract
 */

import { NextRequest, NextResponse } from "next/server";
import { updateAgentStatsOnChain } from "@/lib/hederaContract";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, level, xp, reputation } = body;

    // Validate input
    if (!agentId || level === undefined || xp === undefined || reputation === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate values
    if (level < 1 || level > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid level (must be 1-100)" },
        { status: 400 }
      );
    }

    if (reputation < 0 || reputation > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid reputation (must be 0-100)" },
        { status: 400 }
      );
    }

    console.log("📝 Updating agent stats on smart contract...");
    console.log("   Agent ID:", agentId);
    console.log("   Level:", level, "XP:", xp, "Reputation:", reputation);

    // Update stats on-chain
    const result = await updateAgentStatsOnChain({
      agentId,
      level,
      xp,
      reputation,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update agent stats" },
        { status: 500 }
      );
    }

    console.log("✅ Agent stats updated on smart contract!");
    console.log("   Transaction Hash:", result.txHash);

    return NextResponse.json({
      success: true,
      transactionHash: result.txHash,
      message: "Agent stats updated successfully on ERC-8004 contract",
    });
  } catch (error: any) {
    console.error("❌ Update agent stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update agent stats",
      },
      { status: 500 }
    );
  }
}

