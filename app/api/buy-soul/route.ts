import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { soulId, buyerAccountId, transactionId } = body;

    console.log("💰 Processing soul purchase...");
    console.log("   Soul ID:", soulId);
    console.log("   Buyer:", buyerAccountId);
    console.log("   Transaction ID:", transactionId);

    if (!soulId || !buyerAccountId || !transactionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get soul details (query by soul_id first, fallback to token_id if needed)
    let { data: soul, error: soulError } = await supabase
      .from('souls')
      .select('*')
      .eq('soul_id', soulId)
      .order('xp', { ascending: false })
      .limit(1);

    // If not found by soul_id, try by token_id (format: tokenId:serial)
    if ((soulError || !soul || soul.length === 0) && soulId.includes(':')) {
      console.log("🔄 Soul not found by soul_id, trying token_id:", soulId);
      const tokenResult = await supabase
        .from('souls')
        .select('*')
        .eq('token_id', soulId)
        .order('xp', { ascending: false })
        .limit(1);
      
      soul = tokenResult.data;
      soulError = tokenResult.error;
    }

    const soulRecord = soul && soul.length > 0 ? soul[0] : null;

    if (soulError) {
      console.error("❌ Database query error:", soulError);
      return NextResponse.json(
        { success: false, error: "Database query error" },
        { status: 500 }
      );
    }

    if (!soulRecord) {
      console.error("❌ Soul not found:", soulId);
      return NextResponse.json(
        { success: false, error: "Soul not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Found soul: ${soulRecord.soul_id}, Level: ${soulRecord.level}, XP: ${soulRecord.xp}, Owner: ${soulRecord.owner_account_id}`);

    // Check if buyer already owns the soul (NFT transfer might have completed first)
    if (soulRecord.owner_account_id === buyerAccountId) {
      // Buyer already owns it - this means NFT transfer succeeded
      // Just update listing status if still listed
      if (soulRecord.is_listed) {
        console.log("📝 Buyer already owns soul, clearing listing status...");
        await supabase
          .from('souls')
          .update({
            is_listed: false,
            price: null,
            listed_at: null,
          })
          .eq('id', soulRecord.id);
      }
      
      console.log("✅ Purchase already completed (NFT transfer succeeded first)");
      return NextResponse.json({
        success: true,
        message: "Soul purchase already completed",
        soul: {
          id: soulRecord.soul_id,
          name: soulRecord.name,
          newOwner: buyerAccountId,
          previousOwner: soulRecord.owner_account_id,
          price: soulRecord.price,
        },
      });
    }

    // Verify soul is listed (only if buyer doesn't own it yet)
    if (!soulRecord.is_listed) {
      return NextResponse.json(
        { success: false, error: "Soul is not listed for sale" },
        { status: 400 }
      );
    }

    const previousOwner = soulRecord.owner_account_id;
    const price = soulRecord.price;

    // Update soul ownership (use database ID to ensure correct update)
    console.log(`📝 Updating soul ${soulRecord.soul_id} (DB ID: ${soulRecord.id})...`);
    const { error: updateError } = await supabase
      .from('souls')
      .update({
        owner_account_id: buyerAccountId,
        is_listed: false,
        price: null,
        listed_at: null,
      })
      .eq('id', soulRecord.id); // Use database ID instead of soul_id for accuracy

    if (updateError) {
      console.error("❌ Failed to update soul:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update soul ownership" },
        { status: 500 }
      );
    }

    // Record marketplace transaction
    await supabase
      .from('marketplace_transactions')
      .insert({
        soul_id: soulRecord.id, // Use database ID
        transaction_type: 'sale',
        from_account_id: previousOwner,
        to_account_id: buyerAccountId,
        price: price,
        hedera_transaction_id: transactionId,
      });

    console.log("✅ Soul purchased successfully!");
    console.log(`   ${previousOwner} → ${buyerAccountId}`);
    console.log(`   Price: ${price} HBAR`);
    console.log(`   Soul ID: ${soulRecord.soul_id}`);

    return NextResponse.json({
      success: true,
      message: "Soul purchased successfully",
      soul: {
        id: soulRecord.soul_id,
        name: soulRecord.name,
        newOwner: buyerAccountId,
        previousOwner: previousOwner,
        price: price,
      },
    });
  } catch (error: any) {
    console.error("❌ Buy soul error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process purchase" },
      { status: 500 }
    );
  }
}
