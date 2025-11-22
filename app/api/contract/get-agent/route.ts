/**
 * Get Agent from Smart Contract
 * GET /api/contract/get-agent?agentId=...
 * 
 * Retrieves agent data from the ERC-8004 contract
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgentFromContract } from "@/lib/hederaContract";

// Mark as dynamic route since we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "agentId parameter required" },
        { status: 400 }
      );
    }

    console.log("📖 Fetching agent from smart contract...");
    console.log("   Agent ID:", agentId);

    // Get agent from contract
    const result = await getAgentFromContract(agentId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to get agent" },
        { status: 500 }
      );
    }

    console.log("✅ Agent fetched from smart contract!");
    console.log("   Agent:", result.agent?.name);

    return NextResponse.json({
      success: true,
      agent: result.agent,
    });
  } catch (error: any) {
    console.error("❌ Get agent error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get agent",
      },
      { status: 500 }
    );
  }
}

