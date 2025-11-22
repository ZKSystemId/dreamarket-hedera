/**
 * NFT Chat API - Proper integration with Soul system
 * Uses the full AI Chat Engine with skill unlocks and language restrictions
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchSoulByIdFromDB, saveSoulToDB, updateSoulXP } from "@/lib/supabaseClient";
import { chatWithSoul } from "@/lib/aiChatEngine";
import { SoulAgent, Rarity } from "@/types/agent";
import { getRarityForLevel } from "@/services/expService";

export async function POST(request: NextRequest) {
  try {
    const { message, nftId, personality, language = "en" } = await request.json();

    console.log("🤖 NFT Chat request:", { nftId, message, language });

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Try to find existing soul by token_id
    const { supabase } = await import("@/lib/supabase");
    
    let soul: SoulAgent | null = null;
    
    const { data: existingSouls } = await supabase
      .from('souls')
      .select('*')
      .eq('token_id', nftId);
    
    if (existingSouls && existingSouls.length > 0) {
      // Convert DB record to SoulAgent
      const record = existingSouls[0];
      soul = {
        id: record.soul_id,
        name: record.name,
        tagline: record.tagline,
        rarity: record.rarity as Rarity,
        personality: record.personality,
        skills: record.skills || [],
        creationStory: record.creation_story,
        reputation: record.reputation || 50,
        creator: record.creator_account_id,
        owner: record.owner_account_id,
        tokenId: record.token_id,
        creationTxHash: record.creation_tx_hash,
        lastUpdateTxHash: record.last_update_tx_hash,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        level: record.level || 1,
        xp: record.xp || 0,
        xpToNextLevel: record.xp_to_next_level || 100,
        totalTrainingTime: record.total_training_time || 0,
        evolutionHistory: [],
      };
      console.log("✅ Found existing soul:", soul.id, "Level:", soul.level);
    } else {
      // Create new soul entry
      console.log("🆕 Creating new soul entry for NFT:", nftId);
      
      const [tokenId, serialNumber] = nftId.split(':');
      const soulId = `soul-${Date.now()}`;
      
      await supabase
        .from('souls')
        .insert({
          soul_id: soulId,
          name: `Soul #${serialNumber || '1'}`,
          tagline: "AI Soul on Hedera",
          personality: personality || "Helpful AI assistant living on the Hedera blockchain. Knowledgeable about blockchain, NFTs, and Web3 technology.",
          creation_story: `Born on the Hedera network, this Soul represents a unique digital entity with evolving personality and capabilities.`,
          rarity: "Common",
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          total_training_time: 0,
          skills: ["Basic Conversation", "Simple Threads"],
          owner_account_id: "unknown",
          creator_account_id: "unknown",
          token_id: nftId,
          is_listed: false,
          reputation: 50,
        });
      
      // Fetch the newly created soul
      const { data: newSoul } = await supabase
        .from('souls')
        .select('*')
        .eq('soul_id', soulId)
        .single();
      
      if (newSoul) {
        soul = {
          id: newSoul.soul_id,
          name: newSoul.name,
          tagline: newSoul.tagline,
          rarity: "Common",
          personality: newSoul.personality,
          skills: newSoul.skills || [],
          creationStory: newSoul.creation_story,
          reputation: 50,
          creator: newSoul.creator_account_id,
          owner: newSoul.owner_account_id,
          tokenId: newSoul.token_id,
          creationTxHash: newSoul.creation_tx_hash || "",
          lastUpdateTxHash: newSoul.last_update_tx_hash || "",
          createdAt: newSoul.created_at,
          updatedAt: newSoul.updated_at,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          totalTrainingTime: 0,
          evolutionHistory: [],
        };
        console.log("✅ Soul created:", soul.id);
      }
    }

    if (!soul) {
      throw new Error("Failed to load or create soul");
    }

    // Use the full AI Chat Engine with skill unlocks and language system
    const result = await chatWithSoul(
      soul,
      message,
      [], // No history for now (can be enhanced later)
      undefined, // No blueprint
      language
    );

    console.log(`✅ Chat result: XP+${result.expGained}, Level ${result.newLevel}, LevelUp: ${result.leveledUp}`);

    // Update soul XP in database
    if (result.expGained > 0) {
      try {
        await updateSoulXP(soul.id, result.expGained);
        console.log(`💾 Soul XP updated in DB`);
      } catch (dbError) {
        console.warn("⚠️ Failed to update XP:", dbError);
      }
    }

    // Get updated rarity
    const newRarity = getRarityForLevel(result.newLevel);

    return NextResponse.json({
      success: true,
      response: result.reply,
      nftId,
      expGained: result.expGained,
      level: result.newLevel,
      rarity: newRarity,
      leveledUp: result.leveledUp,
      evolutionTriggered: result.evolutionTriggered,
      skillsUsed: result.skillsUsed,
    });
  } catch (error: any) {
    console.error("❌ Chat API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate response",
      },
      { status: 500 }
    );
  }
}
