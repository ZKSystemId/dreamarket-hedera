/**
 * Check if account is operator
 * Returns operator account ID for frontend to check
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const operatorId = process.env.HEDERA_OPERATOR_ID || process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID;
    
    if (!operatorId) {
      return NextResponse.json(
        { success: false, error: "Operator ID not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operatorId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get operator ID" },
      { status: 500 }
    );
  }
}

