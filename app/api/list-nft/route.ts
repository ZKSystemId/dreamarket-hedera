/**
 * List NFT on Marketplace API
 * User lists their NFT for sale
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { tokenId, serialNumber, price, ownerAccountId } = await request.json();

    console.log("🏪 Listing NFT on marketplace...");
    console.log("   Token:", tokenId);
    console.log("   Serial:", serialNumber);
    console.log("   Price:", price, "HBAR");
    console.log("   Owner:", ownerAccountId);

    // Validate inputs
    if (!tokenId || !serialNumber || !price || !ownerAccountId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    // Find soul by token ID (get the one with highest XP to avoid duplicates)
    const tokenKey = `${tokenId}:${serialNumber}`;
    console.log(`🔍 Looking for soul with token_id: ${tokenKey}`);
    
    // DEBUG: Check all records first
    const { data: allSouls } = await supabase
      .from('souls')
      .select('soul_id, level, xp, created_at')
      .eq('token_id', tokenKey);
    
    console.log('🔍 All souls found for listing:', tokenKey, allSouls);
    
    // Use consistent ordering (same as profile page)
    const { data: souls, error: findError } = await supabase
      .from('souls')
      .select('*')
      .eq('token_id', tokenKey)
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);
    
    const soul = souls && souls.length > 0 ? souls[0] : null;
    
    if (soul) {
      console.log(`✅ Selected soul for listing: ${soul.soul_id}, Level: ${soul.level}, XP: ${soul.xp}, Current is_listed: ${soul.is_listed}`);
    }

    // If soul not found, create it first (for NFTs minted before database integration)
    let soulRecord = soul;
    
    if (findError) {
      console.error("❌ Error querying soul:", findError);
      return NextResponse.json(
        { success: false, error: "Database query error" },
        { status: 500 }
      );
    }
    
    if (!soul) {
      console.log("⚠️ Soul not in database, creating entry...");
      
      // Create soul entry
      const { data: newSoul, error: createError } = await supabase
        .from('souls')
        .insert({
          soul_id: `Soul-${Date.now().toString().slice(-6)}`,
          name: `Soul #${serialNumber}`,
          tagline: "AI Soul on Hedera",
          personality: "Helpful AI assistant living on the Hedera blockchain. Knowledgeable about blockchain, NFTs, and Web3 technology.",
          creation_story: `Born on the Hedera network on ${new Date().toLocaleDateString()}, this Soul represents a unique digital entity with evolving personality and capabilities.`,
          rarity: "Common",
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          total_training_time: 0,
          skills: ["blockchain", "hedera", "nft"],
          owner_account_id: ownerAccountId,
          creator_account_id: ownerAccountId,
          token_id: `${tokenId}:${serialNumber}`,
          is_listed: false,
        })
        .select()
        .single();
      
      if (createError || !newSoul) {
        console.error("❌ Failed to create soul:", createError);
        return NextResponse.json(
          { success: false, error: "Failed to create soul record" },
          { status: 500 }
        );
      }
      
      soulRecord = newSoul;
      console.log("✅ Soul entry created");
    } else {
      // Soul exists, verify ownership or update owner if different
      if (soulRecord.owner_account_id !== ownerAccountId) {
        console.log(`⚠️ Owner mismatch! DB: ${soulRecord.owner_account_id}, Listing: ${ownerAccountId}`);
        console.log("   Updating owner to current account...");
        
        // Update owner to current account (in case NFT was transferred outside app)
        const { data: updatedOwner, error: ownerError } = await supabase
          .from('souls')
          .update({ owner_account_id: ownerAccountId })
          .eq('id', soulRecord.id)
          .select()
          .single();
        
        if (ownerError || !updatedOwner) {
          console.error("❌ Failed to update owner:", ownerError);
          return NextResponse.json(
            { success: false, error: "Ownership verification failed" },
            { status: 403 }
          );
        }
        
        soulRecord = updatedOwner;
        console.log("✅ Owner updated");
      }
    }

    // Update soul to listed
    console.log(`📝 Updating soul ${soulRecord.soul_id} (DB ID: ${soulRecord.id}) to listed...`);
    console.log(`   Token ID: ${soulRecord.token_id}`);
    console.log(`   Price: ${price} HBAR`);
    console.log(`   Current is_listed: ${soulRecord.is_listed}`);
    
    const { data: updatedSoul, error: updateError } = await supabase
      .from('souls')
      .update({
        is_listed: true,
        price: parseFloat(price),
        listed_at: new Date().toISOString(),
      })
      .eq('id', soulRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      console.error("   Error details:", JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { success: false, error: "Failed to list NFT", details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedSoul) {
      console.error("❌ No soul returned after update!");
      return NextResponse.json(
        { success: false, error: "Update failed - no data returned" },
        { status: 500 }
      );
    }

    console.log("✅ Soul updated to listed!");
    console.log(`   soul_id: ${updatedSoul.soul_id}`);
    console.log(`   token_id: ${updatedSoul.token_id}`);
    console.log(`   is_listed: ${updatedSoul.is_listed}`);
    console.log(`   price: ${updatedSoul.price}`);

    // Record marketplace transaction
    await supabase
      .from('marketplace_transactions')
      .insert({
        soul_id: soulRecord.id,
        transaction_type: 'list',
        from_account_id: ownerAccountId,
        price: parseFloat(price),
      });

    console.log("✅ NFT listed successfully!");

    return NextResponse.json({
      success: true,
      data: {
        soul: updatedSoul,
        message: `Soul #${serialNumber} listed for ${price} HBAR`,
      },
    });
  } catch (error: any) {
    console.error("❌ List NFT error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list NFT",
      },
      { status: 500 }
    );
  }
}

// Delist NFT
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const serialNumber = searchParams.get('serialNumber');
    const ownerAccountId = searchParams.get('ownerAccountId');

    console.log("🔓 Delisting NFT...");

    // Find and update soul
    const { data: soul, error: findError } = await supabase
      .from('souls')
      .select('*')
      .eq('token_id', `${tokenId}:${serialNumber}`)
      .eq('owner_account_id', ownerAccountId)
      .single();

    if (findError || !soul) {
      return NextResponse.json(
        { success: false, error: "Soul not found" },
        { status: 404 }
      );
    }

    // Update to not listed
    const { error: updateError } = await supabase
      .from('souls')
      .update({
        is_listed: false,
        price: null,
        listed_at: null,
      })
      .eq('id', soul.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to delist NFT" },
        { status: 500 }
      );
    }

    // Record transaction
    await supabase
      .from('marketplace_transactions')
      .insert({
        soul_id: soul.id,
        transaction_type: 'delist',
        from_account_id: ownerAccountId,
      });

    console.log("✅ NFT delisted successfully!");

    return NextResponse.json({
      success: true,
      message: "NFT delisted successfully",
    });
  } catch (error: any) {
    console.error("❌ Delist error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delist NFT",
      },
      { status: 500 }
    );
  }
}
