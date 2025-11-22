/**
 * Check if NFT is already listed
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Mark as dynamic route since we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const serialNumber = searchParams.get('serialNumber');

    if (!tokenId || !serialNumber) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    // Check if soul exists and is listed
    const { data: soul, error } = await supabase
      .from('souls')
      .select('is_listed, price')
      .eq('token_id', `${tokenId}:${serialNumber}`)
      .single();

    if (error || !soul) {
      return NextResponse.json({
        success: true,
        isListed: false,
      });
    }

    return NextResponse.json({
      success: true,
      isListed: soul.is_listed || false,
      price: soul.price || 0,
    });
  } catch (error: any) {
    console.error("❌ Check listing error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check listing",
      },
      { status: 500 }
    );
  }
}
