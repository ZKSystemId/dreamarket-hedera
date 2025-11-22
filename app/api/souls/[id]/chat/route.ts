/**
 * Soul Chat API Endpoint
 * POST /api/souls/:id/chat
 * 
 * Complete flow: Chat → EXP → Level → Evolution
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchSoulByIdFromDB, updateSoulXP } from "@/lib/supabaseClient";
import { chatWithSoul, ChatHistory } from "@/lib/aiChatEngine";
import { generateFallbackResponse } from "@/lib/fallbackAI";
import { 
  getRecentInteractions, 
  saveChatInteraction,
  getConversationSummary 
} from "@/services/memoryService";
import {
  getLevelForExp,
  getRarityForLevel,
  shouldEvolvePersonality,
  getXpForNextLevel,
  calculateSoulStats
} from "@/services/expService";
import {
  evolveSoulPersonality,
  extractUserInsights
} from "@/services/aiPersonalityService";
import { supabase } from "@/lib/supabase";
import { 
  recordRarityEvolution, 
  recordLevelUp,
  isEvolutionRecordingEnabled 
} from "@/lib/evolutionService";
import { 
  isLanguageUnlocked, 
  getUnlockedLanguages, 
  getLanguageUnlockSummary,
  Language,
  ALL_LANGUAGES 
} from "@/lib/languageSystem";
import { buildChatSystemPrompt } from "@/services/chatPromptService";

export interface ChatRequestBody {
  message: string;
  userWallet?: string;
  persistOnChain?: boolean;
  language?: string;
}

export interface ChatResponse {
  reply: string;
  expGained: number;
  totalExp: number;
  level: number;
  rarity: string;
  didLevelUp: boolean;
  didRarityChange: boolean;
  didEvolve: boolean;
  evolutionSummary?: string;
  soul: any;
  stats: {
    xpToNextLevel: number;
    progress: number;
    nextMilestone: any;
  };
}

// Helper functions for server-side logic
function rarityFromLevel(level: number): string {
  if (level >= 16) return "Mythic";
  if (level >= 11) return "Legendary";
  if (level >= 6) return "Rare";
  return "Common";
}

function guardMessageByRarity(rarity: string, message: string, language: string): { allowed: boolean; reason?: string } {
  // Common = English only - STRICT CHECK
  if (rarity === "Common") {
    // Deteksi Indonesian dengan heuristik yang lebih ketat
    const likelyIndonesian = 
      /\b(apa|kenapa|bagaimana|kamu|saya|nya|yang|dan|atau|tidak|nggak|gak|hai|halo|selamat|terima|kasih)\b/i.test(message) ||
      /[^\x00-\x7F]/.test(message) || // non-ASCII characters
      language === "id";
    
    if (likelyIndonesian) {
      return {
        allowed: false,
        reason: "🔒 **Bahasa Terkunci (Common)** — Hanya bahasa Inggris yang didukung di Level 1–5.\n🗝️ **Cara unlock:** Naikkan level ke **6 (Rare)** dengan ngobrol dalam bahasa Inggris."
      };
    }
  }
  
  // Rare = English + Indonesian
  if (rarity === "Rare") {
    const isOtherLanguage = language !== "en" && language !== "id";
    if (isOtherLanguage) {
      return {
        allowed: false,
        reason: "🔒 **Bahasa Terkunci!**\n\nSebagai soul Rare (Level 6-10), saya bisa berbicara: 🇺🇸 English, 🇮🇩 Indonesian\n\n🎯 **Unlock Berikutnya:** Lebih banyak bahasa di Level 11 (Legendary)\n\n💬 Gunakan English atau Indonesian!"
      };
    }
  }
  
  return { allowed: true };
}

// Use proper EXP system from expSystem.ts

function nextXpThreshold(level: number): number {
  return 100 * level; // Level 1 = 100 XP, Level 2 = 200 XP, etc.
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("\n🤖 CHAT API HIT (POST)");
  console.log("Soul ID param:", params.id);
  
  try {
    const soulIdParam = params.id;
    const body = await request.json();
    const { message, userWallet = "anonymous", language = "en" } = body;
    
    console.log("📨 Message:", message);
    console.log("🌍 Language:", language);

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Try to find soul by soul_id first, then by token_id
    let soul = await fetchSoulByIdFromDB(soulIdParam);
    
    // If not found by soul_id, try by token_id (format: tokenId:serial)
    if (!soul) {
      console.log("🔍 Soul not found by soul_id, trying token_id lookup...");
      const { supabase } = await import("@/lib/supabase");
      
      // First try exact token_id match
      const { data: exactMatch } = await supabase
        .from('souls')
        .select('*')
        .eq('token_id', soulIdParam)
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(1);
      
      if (exactMatch && exactMatch.length > 0) {
        const record = exactMatch[0];
        console.log(`✅ Found soul by exact token_id: ${record.soul_id}, Level: ${record.level}, XP: ${record.xp}`);
        const { recordToSoul } = await import("@/lib/supabaseClient");
        soul = recordToSoul(record);
      } else {
        // If no exact match, try partial match for token_id
        const { data: partialMatch } = await supabase
          .from('souls')
          .select('*')
          .ilike('token_id', `%${soulIdParam}%`)
          .order('level', { ascending: false })
          .order('xp', { ascending: false })
          .limit(1);
        
        if (partialMatch && partialMatch.length > 0) {
          const record = partialMatch[0];
          console.log(`✅ Found soul by partial token_id: ${record.soul_id}, Token: ${record.token_id}, Level: ${record.level}, XP: ${record.xp}`);
          const { recordToSoul } = await import("@/lib/supabaseClient");
          soul = recordToSoul(record);
        }
      }
      
      if (!soul) {
        // Auto-create soul entry for new NFT
        console.log("🆕 Creating new soul entry for NFT:", soulIdParam);
        const [tokenId, serialNumber] = soulIdParam.split(':');
        const newSoulId = `Soul-${Date.now().toString().slice(-6)}`; // Match format from mint-nft
        
        // CRITICAL: Use getRarityForLevel to ensure correct rarity
        const initialLevel = 1;
        const initialRarity = getRarityForLevel(initialLevel);
        
        console.log(`📝 Creating soul with token_id: ${soulIdParam}`);
        
        const { error: insertError } = await supabase
          .from('souls')
          .insert({
            soul_id: newSoulId,
            name: `Soul #${serialNumber || '1'}`,
            tagline: "AI Soul on Hedera",
            personality: "Helpful AI assistant living on the Hedera blockchain. Knowledgeable about blockchain, NFTs, and Web3 technology.",
            creation_story: `Born on the Hedera network, this Soul represents a unique digital entity with evolving personality and capabilities.`,
            rarity: initialRarity, // Use getRarityForLevel instead of hardcoded "Common"
            level: initialLevel,
            xp: 0,
            xp_to_next_level: 100,
            total_training_time: 0,
            skills: ["Basic Conversation", "Simple Threads"],
            owner_account_id: userWallet || "unknown",
            creator_account_id: userWallet || "unknown",
            token_id: soulIdParam, // CRITICAL: Set token_id for ERC-8004 contract updates
            is_listed: false,
            reputation: 50,
          });
        
        if (insertError) {
          console.error("❌ Failed to create soul:", insertError);
        } else {
          // Fetch the newly created soul
          const { data: newSouls } = await supabase
            .from('souls')
            .select('*')
            .eq('soul_id', newSoulId)
            .single();
          
          if (newSouls) {
            const { recordToSoul } = await import("@/lib/supabaseClient");
            soul = recordToSoul(newSouls);
            console.log("✅ Soul created:", soul.id);
          }
        }
      }
    }
    
    if (!soul) {
      console.error("❌ Soul not found and failed to create with ID:", soulIdParam);
      return NextResponse.json({ error: "Soul not found" }, { status: 404 });
    }

    // Check if soul is listed - cannot chat if listed
    if (soul.isListed) {
      console.log(`🚫 Soul ${soul.id} is listed, cannot chat`);
      return NextResponse.json(
        { 
          success: false,
          error: "This Soul is currently listed for sale and cannot be chatted with. Please cancel the listing first." 
        },
        { status: 403 }
      );
    }

    // CRITICAL: Ensure rarity is set correctly based on level
    // BUT: Don't override if rarity is manually set for testing (e.g., Mythic at Level 16, Legendary at Level 11)
    const currentLevel = soul.level || 1;
    const expectedRarity = getRarityForLevel(currentLevel);
    const currentRarity = soul.rarity || expectedRarity;
    
    // Only update rarity if it's missing, not if it's manually set for testing
    // Check if rarity is higher than expected (indicates manual setting for testing)
    const validRarities = ['Common', 'Rare', 'Legendary', 'Mythic'];
    const isRarityValid = validRarities.includes(currentRarity);
    
    // Check if rarity is higher than expected (indicates manual setting)
    const rarityOrder = { 'Common': 1, 'Rare': 2, 'Legendary': 3, 'Mythic': 4 };
    const currentRarityOrder = rarityOrder[currentRarity as keyof typeof rarityOrder] || 0;
    const expectedRarityOrder = rarityOrder[expectedRarity as keyof typeof rarityOrder] || 0;
    const isRarityManuallySet = currentRarityOrder > expectedRarityOrder && isRarityValid;
    
    if (!soul.rarity) {
      // Only update if rarity is missing
      soul.rarity = expectedRarity;
      console.log(`🔄 Set missing rarity: ${expectedRarity} (Level ${currentLevel})`);
      
      // Update rarity in database if it's missing
      try {
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from('souls')
          .update({ rarity: expectedRarity })
          .eq('soul_id', soul.id);
        console.log(`💾 Updated missing rarity in database for ${soul.id}`);
      } catch (dbError) {
        console.warn("⚠️ Failed to update rarity in database:", dbError);
      }
    } else if (isRarityManuallySet) {
      // Rarity is manually set for testing - preserve it
      console.log(`🔒 Preserving manually set rarity: ${currentRarity} (Level ${currentLevel}, expected: ${expectedRarity})`);
    } else if (currentRarity !== expectedRarity && !isRarityValid) {
      // Invalid rarity - fix it
      const oldRarity = soul.rarity;
      soul.rarity = expectedRarity;
      console.log(`🔄 Fixed invalid rarity: ${oldRarity} → ${expectedRarity} (Level ${currentLevel})`);
      
      try {
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from('souls')
          .update({ rarity: expectedRarity })
          .eq('soul_id', soul.id);
        console.log(`💾 Fixed rarity in database for ${soul.id}`);
      } catch (dbError) {
        console.warn("⚠️ Failed to update rarity in database:", dbError);
      }
    }

    // NOTE: Language restriction is handled inside chatWithSoul
    // It provides better user feedback and handles edge cases better

    // Use the existing working aiChatEngine system
    let result;
    try {
      console.log(`📤 Calling chatWithSoul...`);
      console.log(`   Soul ID: ${soul.id}`);
      console.log(`   Level: ${soul.level}, XP: ${soul.xp}, Rarity: ${soul.rarity}`);
      console.log(`   Message: ${message.substring(0, 50)}...`);
      console.log(`   Language: ${language}`);
      
      result = await chatWithSoul(
        soul,
        message,
        [], // history
        undefined, // blueprint
        language
      );

      console.log(`✅ Chat success: reply length=${result.reply.length}, XP+${result.expGained}`);
    } catch (chatError: any) {
      console.error("❌ chatWithSoul error:", chatError);
      console.error("   Error message:", chatError?.message);
      console.error("   Error stack:", chatError?.stack);
      throw new Error(`Chat engine failed: ${chatError?.message || "Unknown error"}`);
    }
    console.log(`📊 Before update - Soul ID: ${soul.id}, Current XP: ${soul.xp}, Level: ${soul.level}`);

    // Update XP in database
    let dbUpdateResult = null;
    let updatedSoul = soul;
    
    if (result.expGained > 0) {
      try {
        console.log(`🔄 Attempting to update XP for soul: ${soul.id} +${result.expGained}`);
        dbUpdateResult = await updateSoulXP(soul.id, result.expGained);
        console.log(`💾 XP updated in DB successfully:`, dbUpdateResult);
        
        // CRITICAL: Reload soul from DB to get fresh XP values
        const freshSoul = await fetchSoulByIdFromDB(soul.id);
        if (freshSoul) {
          updatedSoul = freshSoul;
          console.log(`🔄 Soul reloaded - Fresh XP: ${freshSoul.xp}, Level: ${freshSoul.level}, Rarity: ${freshSoul.rarity}`);
        }
      } catch (dbError: any) {
        console.error("❌ CRITICAL: Failed to update XP in DB:", dbError);
        console.error("❌ Error details:", dbError.message, dbError.stack);
        // Don't throw - continue to return response, but log the error
      }
    } else {
      console.warn("⚠️ No XP gained (restricted or error)");
    }

    // Get updated rarity based on new level (use DB result if available)
    // BUT: Preserve manually set rarity for testing
    const finalLevel = dbUpdateResult?.newLevel || updatedSoul.level;
    const finalXP = updatedSoul.xp;
    const finalExpectedRarity = getRarityForLevel(finalLevel);
    const finalCurrentRarity = updatedSoul.rarity || finalExpectedRarity;
    
    // Check if rarity is manually set for testing (different from expected)
    const finalValidRarities = ['Common', 'Rare', 'Legendary', 'Mythic'];
    const finalIsRarityValid = finalValidRarities.includes(finalCurrentRarity);
    const finalIsRarityManuallySet = finalCurrentRarity !== finalExpectedRarity && finalIsRarityValid;
    
    // Use current rarity if manually set, otherwise use expected rarity
    const newRarity = finalIsRarityManuallySet ? finalCurrentRarity : finalExpectedRarity;
    
    if (finalIsRarityManuallySet) {
      console.log(`🔒 Preserving manually set rarity: ${newRarity} (Level ${finalLevel}, expected: ${finalExpectedRarity})`);
    }
    
    console.log(`📊 After update - Level: ${finalLevel}, XP: ${finalXP}, Rarity: ${newRarity}`);

    // Calculate stats safely
    const nextLevelXp = getXpForNextLevel(finalLevel);
    const xpToNextLevel = Math.max(0, nextLevelXp - finalXP);
    const progress = nextLevelXp > 0 ? Math.min(1, finalXP / nextLevelXp) : 0;

    // Save chat history to database
    try {
      const { saveChatMessage } = await import("@/lib/supabaseClient");
      
      console.log(`📝 Saving chat history for soul: ${soul.id}`);
      
      // Save user message
      await saveChatMessage(
        soul.id,
        userWallet,
        'user',
        message,
        0 // User message doesn't earn XP
      );
      
      // Save assistant reply
      await saveChatMessage(
        soul.id,
        userWallet,
        'assistant',
        result.reply,
        result.expGained
      );
      
      console.log("💾 Chat history saved to database");
    } catch (historyError: any) {
      console.warn("⚠️ Failed to save chat history:", historyError.message);
      // Don't fail the request if history save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        reply: result.reply,
        expGained: result.expGained,
        totalExp: finalXP, // Use fresh XP from DB
        level: finalLevel, // Use fresh level from DB
        rarity: newRarity, 
        didLevelUp: dbUpdateResult?.leveledUp || result.leveledUp,
        didRarityChange: dbUpdateResult?.newRarity !== undefined,
        didEvolve: dbUpdateResult?.newRarity !== undefined,
        restricted: !result.expGained, // If no XP gained, likely restricted
        soul: updatedSoul, // Return fresh soul data
        contractUpdate: dbUpdateResult?.contractUpdate || null, // ERC-8004 contract update result
        stats: {
          xpToNextLevel,
          progress,
          nextMilestone: { level: finalLevel + 1 }
        }
      }
    });

  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ CHAT API ERROR");
    console.error("=".repeat(60));
    console.error("Error type:", error?.constructor?.name || typeof error);
    console.error("Error message:", error?.message || String(error));
    console.error("Error stack:", error?.stack);
    console.error("Soul ID:", params.id);
    console.error("=".repeat(60) + "\n");
    
    // Check if it's a Groq rate limit error
    const isRateLimit = error?.message?.includes("rate_limit") || error?.message?.includes("429");
    
    return NextResponse.json({ 
      success: false, 
      error: isRateLimit ? "Rate limit reached" : "Chat failed",
      message: error instanceof Error ? error.message : "Unknown error",
      rateLimited: isRateLimit,
      details: process.env.NODE_ENV === "development" ? {
        type: error?.constructor?.name,
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5)
      } : undefined
    }, { status: isRateLimit ? 429 : 500 });
  }
}

// GET endpoint to get chat history and soul data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const soulIdParam = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const userWallet = searchParams.get('userWallet') || undefined;

    // Load soul data
    let soul = await fetchSoulByIdFromDB(soulIdParam);
    
    // If not found by soul_id, try by token_id
    if (!soul) {
      const { supabase } = await import("@/lib/supabase");
      const { data: souls } = await supabase
        .from('souls')
        .select('*')
        .eq('token_id', soulIdParam)
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(1);
      
      if (souls && souls.length > 0) {
        const record = souls[0];
        console.log(`📊 [GET] Loading soul with highest progress: ${record.soul_id}, Level: ${record.level}, XP: ${record.xp}`);
        const { recordToSoul } = await import("@/lib/supabaseClient");
        soul = recordToSoul(record);
      }
    }

    if (!soul) {
      return NextResponse.json(
        { error: "Soul not found" },
        { status: 404 }
      );
    }

    // Get chat history filtered by current owner
    // Use provided userWallet or soul's owner_account_id
    const ownerAccountId = userWallet || soul.owner;
    const { getChatHistory } = await import("@/lib/supabaseClient");
    const chatHistory = await getChatHistory(soul.id, ownerAccountId, limit);

    // Convert chat history to format expected by frontend
    const messages = chatHistory.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }));

    const interactions = await getRecentInteractions(soulIdParam, limit);
    const summary = await getConversationSummary(soulIdParam, limit);

    return NextResponse.json({
      success: true,
      data: {
        soul,
        messages, // Chat history from database
        interactions,
        summary
      }
    });

  } catch (error) {
    console.error("❌ Get chat data error:", error);
    
    return NextResponse.json(
      { error: "Failed to get chat data" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear chat history
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const soulIdParam = params.id;
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');

    console.log(`🗑️ DELETE request - Soul: ${soulIdParam}, User: ${userWallet}`);

    if (!userWallet) {
      return NextResponse.json(
        { error: "User wallet is required" },
        { status: 400 }
      );
    }

    // Get soul's UUID from database
    const { supabase } = await import("@/lib/supabase");
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create admin client with service role key to bypass RLS for DELETE
    // This is necessary because RLS policies may block DELETE operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupabase = serviceRoleKey 
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : null;
    
    console.log(`🔑 Using ${adminSupabase ? 'ADMIN (service role)' : 'ANON (RLS may block)'} client for DELETE`);
    
    // Try by soul_id first
    let soulRecord = null;
    const { data: soulBySoulIdArray } = await supabase
      .from('souls')
      .select('id, owner_account_id')
      .eq('soul_id', soulIdParam)
      .limit(1);

    if (soulBySoulIdArray && soulBySoulIdArray.length > 0) {
      soulRecord = soulBySoulIdArray[0];
      console.log(`✅ Found soul by soul_id: ${soulIdParam}`);
    } else {
      // Try by token_id
      const { data: soulByTokenIdArray } = await supabase
        .from('souls')
        .select('id, owner_account_id')
        .eq('token_id', soulIdParam)
        .limit(1);
      
      if (soulByTokenIdArray && soulByTokenIdArray.length > 0) {
        soulRecord = soulByTokenIdArray[0];
        console.log(`✅ Found soul by token_id: ${soulIdParam}`);
      }
    }

    if (!soulRecord) {
      console.warn(`⚠️ Soul not found: ${soulIdParam}`);
      return NextResponse.json(
        { error: "Soul not found" },
        { status: 404 }
      );
    }

    // Verify user is the owner
    if (soulRecord.owner_account_id !== userWallet) {
      console.warn(`⚠️ Unauthorized - owner: ${soulRecord.owner_account_id}, user: ${userWallet}`);
      return NextResponse.json(
        { error: "Unauthorized: You are not the owner of this soul" },
        { status: 403 }
      );
    }

    // Delete chat history for this soul and user
    console.log(`🗑️ Deleting messages for soul ${soulRecord.id}, user ${userWallet}`);
    
    // First, check what messages exist before deleting
    const { data: existingMessages, error: checkError } = await supabase
      .from('chat_messages')
      .select('id, soul_id, user_account_id, role')
      .eq('soul_id', soulRecord.id);
    
    if (checkError) {
      console.error(`❌ Error checking messages:`, checkError);
    } else {
      console.log(`📊 Found ${existingMessages?.length || 0} total messages for soul ${soulRecord.id}`);
      console.log(`📊 Messages with user_account_id=${userWallet}: ${existingMessages?.filter(m => m.user_account_id === userWallet).length || 0}`);
      if (existingMessages && existingMessages.length > 0) {
        const uniqueUsers = [...new Set(existingMessages.map(m => m.user_account_id))];
        console.log(`📊 Unique user_account_ids in messages:`, uniqueUsers);
        console.log(`📊 Sample message:`, existingMessages[0]);
      }
    }
    
    // Try delete - use admin client if available, otherwise try direct delete
    const deleteClient = adminSupabase || supabase;
    
    // If we have messages to delete, try deleting them
    let deletedCount = 0;
    let deleteError = null;
    
    if (existingMessages && existingMessages.length > 0) {
      // Try deleting messages one by one if bulk delete fails (workaround for RLS)
      const messagesToDelete = existingMessages.filter(m => m.user_account_id === userWallet);
      console.log(`🗑️ Attempting to delete ${messagesToDelete.length} messages for user ${userWallet}`);
      
      if (messagesToDelete.length > 0) {
        // Try bulk delete first
        const { error: bulkError, data: bulkDeleted, count: bulkCount } = await deleteClient
          .from('chat_messages')
          .delete()
          .eq('soul_id', soulRecord.id)
          .eq('user_account_id', userWallet)
          .select();
        
        console.log(`🔍 Bulk delete result: error=${!!bulkError}, deletedData=${bulkDeleted?.length || 0}, count=${bulkCount}`);
        if (bulkError) {
          console.error(`❌ Bulk delete error details:`, bulkError);
        }
        
        if (!bulkError && bulkDeleted && bulkDeleted.length > 0) {
          deletedCount = bulkDeleted.length;
          console.log(`✅ Bulk delete succeeded - deleted ${deletedCount} messages`);
        } else if (!bulkError && bulkCount && bulkCount > 0) {
          deletedCount = bulkCount;
          console.log(`✅ Bulk delete succeeded (via count) - deleted ${deletedCount} messages`);
        } else {
          // Bulk delete failed, try deleting one by one
          console.log(`⚠️ Bulk delete failed, trying individual deletes...`);
          if (bulkError) {
            console.error(`❌ Bulk delete error:`, bulkError);
          }
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const msg of messagesToDelete) {
            const { error: singleError } = await deleteClient
              .from('chat_messages')
              .delete()
              .eq('id', msg.id)
              .eq('soul_id', soulRecord.id)
              .eq('user_account_id', userWallet);
            
            if (singleError) {
              console.warn(`⚠️ Failed to delete message ${msg.id}:`, singleError);
              errorCount++;
              if (!deleteError) {
                deleteError = singleError;
              }
            } else {
              successCount++;
            }
          }
          
          deletedCount = successCount;
          console.log(`📊 Individual delete results: ${successCount} succeeded, ${errorCount} failed`);
          
          // If individual deletes also failed, try deleting all messages for this soul (user is verified owner)
          if (successCount === 0 && messagesToDelete.length > 0) {
            console.log(`⚠️ All individual deletes failed, trying to delete all messages for soul (user is verified owner)...`);
            
            // Try deleting all messages for this soul without user filter
            // Since we already verified user is the owner, this should be safe
            const allMessagesToDelete = existingMessages.filter(m => m.soul_id === soulRecord.id);
            console.log(`🗑️ Attempting to delete all ${allMessagesToDelete.length} messages for soul ${soulRecord.id}`);
            
            // Try deleting one by one without user_account_id filter
            let ownerSuccessCount = 0;
            let ownerErrorCount = 0;
            
            for (const msg of allMessagesToDelete) {
              const { error: msgError } = await deleteClient
                .from('chat_messages')
                .delete()
                .eq('id', msg.id)
                .eq('soul_id', soulRecord.id);
              
              if (msgError) {
                console.warn(`⚠️ Failed to delete message ${msg.id} (owner mode):`, msgError);
                ownerErrorCount++;
                if (!deleteError) {
                  deleteError = msgError;
                }
              } else {
                ownerSuccessCount++;
              }
            }
            
            deletedCount = ownerSuccessCount;
            console.log(`📊 Owner delete results: ${ownerSuccessCount} succeeded, ${ownerErrorCount} failed`);
            
            if (ownerSuccessCount > 0) {
              console.log(`✅ Successfully deleted ${ownerSuccessCount} messages using owner mode`);
            }
          }
        }
      }
    }
    
    const count = deletedCount;

    if (deleteError) {
      console.error(`❌ Delete error:`, deleteError);
      throw new Error(`Failed to delete chat history: ${deleteError.message}`);
    }

    console.log(`✅ Chat history deleted - ${count || 0} messages removed for soul ${soulRecord.id}`);

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully",
      deletedCount: count || 0
    });

  } catch (error: any) {
    console.error("❌ Delete chat history error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to delete chat history" 
      },
      { status: 500 }
    );
  }
}
