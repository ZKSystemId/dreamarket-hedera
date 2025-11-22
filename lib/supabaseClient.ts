import { supabase, SoulRecord, ChatMessageRecord } from './supabase';
import { SoulAgent, SoulAgentInput, Rarity } from '@/types/agent';
import { getRarityForLevel } from '@/services/expService';

/**
 * Convert database record to SoulAgent type
 * CRITICAL: Ensures rarity is always correct based on level
 */
export function recordToSoul(record: SoulRecord): SoulAgent {
  const level = record.level || 1;
  const rarityFromDB = record.rarity as Rarity;
  
  // CRITICAL: Calculate correct rarity based on level
  const correctRarity = getRarityForLevel(level);
  
  // Check if rarity is manually set for testing (different from expected)
  const validRarities = ['Common', 'Rare', 'Legendary', 'Mythic'];
  const isRarityValid = validRarities.includes(rarityFromDB);
  const isRarityManuallySet = rarityFromDB && rarityFromDB !== correctRarity && isRarityValid;
  
  // Use DB rarity if manually set for testing, otherwise use correct rarity
  const finalRarity = isRarityManuallySet 
    ? rarityFromDB 
    : (rarityFromDB && rarityFromDB === correctRarity ? rarityFromDB : correctRarity);
  
  // Log if rarity was corrected (but not if manually set for testing)
  if (rarityFromDB !== finalRarity && !isRarityManuallySet) {
    console.log(`🔄 [recordToSoul] Corrected rarity for ${record.soul_id}: ${rarityFromDB} → ${finalRarity} (Level ${level})`);
  } else if (isRarityManuallySet) {
    console.log(`🔒 [recordToSoul] Preserving manually set rarity for ${record.soul_id}: ${finalRarity} (Level ${level}, expected: ${correctRarity})`);
  }
  
  return {
    id: record.soul_id,
    name: record.name,
    tagline: record.tagline,
    rarity: finalRarity, // Always use correct rarity based on level
    avatarUrl: record.avatar_url,
    personality: record.personality,
    skills: record.skills,
    creationStory: record.creation_story,
    reputation: record.reputation,
    creator: record.creator_account_id,
    owner: record.owner_account_id,
    tokenId: record.token_id,
    creationTxHash: record.creation_tx_hash,
    lastUpdateTxHash: record.last_update_tx_hash,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    level: level,
    xp: record.xp || 0,
    xpToNextLevel: record.xp_to_next_level || 100,
    totalTrainingTime: record.total_training_time || 0,
    evolutionHistory: [], // Load separately if needed
    isListed: record.is_listed,
    price: record.price ? Number(record.price) : undefined,
    listedAt: record.listed_at,
  };
}

/**
 * Fetch all souls from database
 */
export async function fetchSoulsFromDB(): Promise<SoulAgent[]> {
  const { data, error } = await supabase
    .from('souls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching souls:', error);
    return [];
  }

  return data.map(recordToSoul);
}

/**
 * Fetch user's owned souls (current owner)
 */
export async function fetchUserSoulsFromDB(accountId: string): Promise<SoulAgent[]> {
  const { data, error } = await supabase
    .from('souls')
    .select('*')
    .eq('owner_account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user souls:', error);
    return [];
  }

  return data.map(recordToSoul);
}

/**
 * Fetch user's created souls (original minter)
 */
export async function fetchCreatedSoulsFromDB(accountId: string): Promise<SoulAgent[]> {
  const { data, error } = await supabase
    .from('souls')
    .select('*')
    .eq('creator_account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching created souls:', error);
    return [];
  }

  return data.map(recordToSoul);
}

/**
 * Fetch single soul by ID (supports both soul_id and token_id)
 */
export async function fetchSoulByIdFromDB(soulId: string): Promise<SoulAgent | null> {
  console.log('🔍 [fetchSoulByIdFromDB] Querying for:', soulId);
  
  // Try exact match by soul_id first
  let { data, error } = await supabase
    .from('souls')
    .select('*')
    .eq('soul_id', soulId)
    .single();

  // If not found by exact soul_id, try to find souls that contain the identifier
  if (error) {
    console.log('🔄 [fetchSoulByIdFromDB] Not found by exact soul_id, searching for partial matches...');
    
    // Try to find souls where soul_id contains the identifier (e.g., "soul-2" matches "soul-2-xyz")
    // OR where name matches (e.g., "Soul #2")
    const { data: partialMatches } = await supabase
      .from('souls')
      .select('*')
      .or(`soul_id.ilike.%${soulId}%,name.ilike.%${soulId.replace('Soul-', 'Soul #')}%`)
      .order('level', { ascending: false })  // Get the one with highest LEVEL first
      .order('xp', { ascending: false })     // Then by XP
      .limit(1);
    
    if (partialMatches && partialMatches.length > 0) {
      data = partialMatches[0];
      error = null;
      console.log(`✅ [fetchSoulByIdFromDB] Found partial match: ${data.soul_id} (${data.name}) with Level: ${data.level}, XP: ${data.xp}`);
    }
    
    // Also try by token_id if it contains ':'
    if (!data && soulId.includes(':')) {
      console.log('🔄 [fetchSoulByIdFromDB] Trying token_id lookup...');
      console.log('   Searching for token_id:', soulId);
      
      // Try exact match first
      let result = await supabase
        .from('souls')
        .select('*')
        .eq('token_id', soulId)
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(1);
      
      if (result.data && result.data.length > 0) {
        data = result.data[0];
        error = null;
        console.log(`✅ [fetchSoulByIdFromDB] Found by token_id (exact): ${data.soul_id} with Level: ${data.level}, XP: ${data.xp}`);
      } else {
        // Try URL-decoded version (in case of %3A instead of :)
        const decodedId = decodeURIComponent(soulId);
        if (decodedId !== soulId) {
          console.log('🔄 [fetchSoulByIdFromDB] Trying URL-decoded token_id:', decodedId);
          result = await supabase
            .from('souls')
            .select('*')
            .eq('token_id', decodedId)
            .order('level', { ascending: false })
            .order('xp', { ascending: false })
            .limit(1);
          
          if (result.data && result.data.length > 0) {
            data = result.data[0];
            error = null;
            console.log(`✅ [fetchSoulByIdFromDB] Found by token_id (decoded): ${data.soul_id} with Level: ${data.level}, XP: ${data.xp}`);
          }
        }
      }
      
      if (!data) {
        console.warn('⚠️ [fetchSoulByIdFromDB] No soul found with token_id:', soulId);
      }
    }
  }

  if (error) {
    console.error('❌ [fetchSoulByIdFromDB] Error fetching soul:', error);
    return null;
  }

  if (!data) {
    console.warn('⚠️ [fetchSoulByIdFromDB] No data found for:', soulId);
    return null;
  }

  console.log('✅ [fetchSoulByIdFromDB] Found soul:', data.soul_id, data.name, 'Level:', data.level, 'XP:', data.xp);
  console.log('🔍 [fetchSoulByIdFromDB] Record token_id:', data.token_id);
  const soul = recordToSoul(data);
  console.log('🔍 [fetchSoulByIdFromDB] Converted soul.tokenId:', soul.tokenId);
  return soul;
}

/**
 * Save new soul to database
 */
export async function saveSoulToDB(
  soul: SoulAgentInput,
  ownerAccountId: string,
  tokenId: string,
  txHash: string
): Promise<string> {
  const soulId = `soul-${Date.now()}`;

  console.log('💾 Saving soul to Supabase:', { soulId, name: soul.name, owner: ownerAccountId });

  const { data, error } = await supabase
    .from('souls')
    .insert({
      soul_id: soulId,
      name: soul.name,
      tagline: soul.tagline,
      rarity: 'Common', // Always start as Common
      personality: soul.personality,
      skills: soul.skills,
      creation_story: soul.creationStory,
      creator_account_id: ownerAccountId, // Original minter
      owner_account_id: ownerAccountId, // Current owner (same at creation)
      token_id: tokenId,
      creation_tx_hash: txHash,
      last_update_tx_hash: txHash,
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      total_training_time: 0,
      reputation: 50,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving soul:', error);
    throw new Error(`Failed to save soul: ${error.message}`);
  }

  console.log('✅ Soul saved successfully:', data);
  return soulId;
}

/**
 * Update soul XP and level
 */
export async function updateSoulXP(
  soulId: string,
  xpGained: number
): Promise<{ leveledUp: boolean; newLevel: number; newRarity?: Rarity; contractUpdate?: any }> {
  console.log(`🔄 [updateSoulXP] Starting for soul: ${soulId}, XP to add: ${xpGained}`);
  
  // Fetch current soul
  const { data: soulRecord, error: fetchError } = await supabase
    .from('souls')
    .select('*')
    .eq('soul_id', soulId)
    .single();

  if (fetchError || !soulRecord) {
    console.error(`❌ [updateSoulXP] Soul not found:`, fetchError);
    throw new Error('Soul not found');
  }

  // Convert to SoulAgent object to get tokenId
  const soul = recordToSoul(soulRecord);
  console.log(`📊 [updateSoulXP] Current state - XP: ${soul.xp}, Level: ${soul.level}, Rarity: ${soul.rarity}`);
  console.log(`🔍 [updateSoulXP] Soul tokenId: ${soul.tokenId || 'MISSING'}`);

  // Use CUMULATIVE XP system (never reset XP)
  let newXP = soul.xp + xpGained;
  let newRarity: Rarity = soul.rarity;
  let leveledUp = false;
  
  console.log(`➕ [updateSoulXP] Calculating - Old XP: ${soul.xp} + Gained: ${xpGained} = New XP: ${newXP}`);

  // Calculate new level based on TOTAL cumulative XP
  const { getLevelForExp } = await import("@/services/expService");
  const newLevel = getLevelForExp(newXP);
  const oldLevel = soul.level;
  
  leveledUp = newLevel > oldLevel;
  
  console.log(`📊 [updateSoulXP] Level check - Old: ${oldLevel}, New: ${newLevel}, LeveledUp: ${leveledUp}`);

  // Determine rarity based on new level
  const { getRarityForLevel } = await import("@/services/expService");
  const expectedRarity = getRarityForLevel(newLevel);
  const currentRarity = soul.rarity;
  
  // Check if rarity is manually set for testing (higher than expected for new level)
  const validRarities = ['Common', 'Rare', 'Legendary', 'Mythic'];
  const isRarityValid = validRarities.includes(currentRarity);
  
  const rarityOrder = { 'Common': 1, 'Rare': 2, 'Legendary': 3, 'Mythic': 4 };
  const currentRarityOrder = rarityOrder[currentRarity as keyof typeof rarityOrder] || 0;
  const expectedRarityOrder = rarityOrder[expectedRarity as keyof typeof rarityOrder] || 0;
  
  // Rarity is manually set if it's higher than expected for the NEW level
  const isRarityManuallySet = currentRarityOrder > expectedRarityOrder && isRarityValid;
  
  // Determine final rarity
  const oldRarity = currentRarity;
  if (isRarityManuallySet) {
    // Preserve manually set rarity for testing
    newRarity = currentRarity;
    console.log(`🔒 [updateSoulXP] Preserving manually set rarity: ${newRarity} (Level ${oldLevel}→${newLevel}, expected: ${expectedRarity})`);
  } else {
    // Use expected rarity for the new level
    newRarity = expectedRarity;
    if (newRarity !== oldRarity) {
      console.log(`🧬 [updateSoulXP] Rarity evolution: ${oldRarity} → ${newRarity} (Level ${oldLevel}→${newLevel})`);
      
      // Record evolution if rarity changed
      await supabase.from('evolution_history').insert({
        soul_id: soul.id,
        from_rarity: oldRarity,
        to_rarity: newRarity,
        level_at_evolution: newLevel,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log(`🔄 [updateSoulXP] Rarity unchanged: ${newRarity} (Level ${oldLevel}→${newLevel})`);
    }
  }

  // Calculate XP needed for next level
  const { getXpForNextLevel } = await import("@/services/expService");
  const newXPToNextLevel = getXpForNextLevel(newLevel);

  console.log(`💾 [updateSoulXP] Saving to DB - XP: ${newXP}, Level: ${newLevel}, Rarity: ${newRarity}`);

  // Update soul
  const { error: updateError } = await supabase
    .from('souls')
    .update({
      xp: newXP,
      level: newLevel,
      rarity: newRarity,
      xp_to_next_level: newXPToNextLevel,
      total_training_time: soul.totalTrainingTime + 5,
    })
    .eq('soul_id', soulId);

  if (updateError) {
    console.error(`❌ [updateSoulXP] Failed to save:`, updateError);
    throw new Error('Failed to update soul');
  }

  console.log(`✅ [updateSoulXP] Success! Level: ${newLevel}, XP: ${newXP}, LeveledUp: ${leveledUp}`);

  // Update agent stats on ERC-8004 smart contract (optional, won't fail if contract not deployed)
  let contractUpdateResult: { success: boolean; txHash?: string; error?: string } | null = null;
  
  // Debug: Check if tokenId exists
  console.log(`🔍 [updateSoulXP] Checking tokenId - soul.tokenId: ${soul.tokenId}, soul.id: ${soul.id}`);
  
  try {
    const { updateAgentStatsOnChain, isAgentRegisteredOnChain, registerAgentOnChain } = await import("@/lib/hederaContract");
    const { ethers } = await import("ethers");
    
    // Convert tokenId to uint256 for contract
    const tokenId = soul.tokenId;
    console.log(`🔍 [updateSoulXP] tokenId check: ${tokenId ? `Found: ${tokenId}` : 'MISSING!'}`);
    
    if (tokenId) {
      // Convert tokenId to uint256 using same method as registerAgentOnChain
      const hash = ethers.keccak256(ethers.toUtf8Bytes(tokenId));
      const agentId = BigInt(hash).toString();
      
      // Check if agent is registered first
      console.log(`🔍 [updateSoulXP] Checking if agent is registered: ${agentId}`);
      const isRegistered = await isAgentRegisteredOnChain(agentId);
      console.log(`🔍 [updateSoulXP] Agent registered status: ${isRegistered}`);
      
      if (!isRegistered) {
        // Agent not registered, register it first
        console.log(`📝 [updateSoulXP] Agent not registered, registering first...`);
        console.log(`   Token ID: ${tokenId}`);
        console.log(`   Agent ID: ${agentId}`);
        console.log(`   Soul: ${soul.name} (Owner: ${soul.owner})`);
        
        try {
          // Get operator ID for registration
          const operatorId = process.env.HEDERA_OPERATOR_ID;
          
          if (operatorId) {
            // Convert rarity to number if it's a string
            const rarityMap: Record<string, number> = {
              'Common': 0,
              'Rare': 1,
              'Legendary': 2,
              'Mythic': 3,
            };
            const rarityNumber = rarityMap[soul.rarity] || 0;
            
            // Convert Hedera account ID to Ethereum address format
            const ownerAddress = soul.owner?.startsWith('0.0.') 
              ? `0x${soul.owner.replace(/\./g, '').padStart(40, '0')}` 
              : soul.owner || operatorId;
            
            const creatorAddress = soul.creator?.startsWith('0.0.') 
              ? `0x${soul.creator.replace(/\./g, '').padStart(40, '0')}` 
              : soul.creator || operatorId;
            
            console.log(`   Owner: ${ownerAddress}`);
            console.log(`   Creator: ${creatorAddress}`);
            console.log(`   Rarity: ${soul.rarity} (${rarityNumber})`);
            
            const registerResult = await registerAgentOnChain({
              tokenId,
              name: soul.name,
              tagline: soul.tagline,
              rarity: rarityNumber,
              creatorAddress,
              ownerAddress,
            });
            
            if (registerResult.success) {
              console.log(`✅ [updateSoulXP] Agent registered successfully! TX: ${registerResult.txHash}`);
              console.log(`   Agent ID: ${registerResult.agentId}`);
            } else {
              console.warn(`⚠️ [updateSoulXP] Registration failed: ${registerResult.error}`);
              console.warn(`   This might be a contract deployment issue - continuing anyway`);
              // Continue to try update anyway (might work if agent was registered differently)
            }
          } else {
            console.warn(`⚠️ [updateSoulXP] HEDERA_OPERATOR_ID not found, cannot register`);
          }
        } catch (regError: any) {
          console.error(`❌ [updateSoulXP] Registration error:`, regError.message);
          console.error(`   Stack:`, regError.stack?.split('\n').slice(0, 3).join('\n'));
          // Don't fail - continue to try update anyway
        }
      } else {
        // Agent is registered
        console.log(`✅ [updateSoulXP] Agent already registered`);
        console.log(`   Agent ID: ${agentId}`);
        console.log(`   Will attempt to update stats...`);
      }
      
      // Update contract (blocking for now to see errors)
      console.log(`📝 [updateSoulXP] Attempting to update contract stats...`);
      console.log(`   Agent ID: ${agentId}`);
      console.log(`   Level: ${newLevel}, XP: ${newXP}, Reputation: ${soul.reputation || 50}`);
      
      try {
        const updateResult = await updateAgentStatsOnChain({
          agentId,
          level: newLevel,
          xp: newXP,
          reputation: soul.reputation || 50,
        });
        
        contractUpdateResult = updateResult;
        
        if (updateResult.success) {
          console.log(`✅ [updateSoulXP] Agent stats updated on ERC-8004 contract! TX: ${updateResult.txHash}`);
        } else {
          console.error(`❌ [updateSoulXP] Contract update failed: ${updateResult.error}`);
        }
      } catch (updateError: any) {
        console.error(`❌ [updateSoulXP] Contract update error:`, updateError);
        console.error(`   Error details:`, updateError.message || updateError);
        contractUpdateResult = { success: false, error: updateError.message || String(updateError) };
      }
    }
  } catch (contractError: any) {
    console.warn("⚠️ [updateSoulXP] Contract update failed (non-critical):", contractError.message);
    contractUpdateResult = { success: false, error: contractError.message || String(contractError) };
    // Don't fail the entire operation if contract update fails
  }

  return {
    leveledUp,
    newLevel,
    newRarity: newRarity !== soul.rarity ? newRarity : undefined,
    contractUpdate: contractUpdateResult,
  };
}

/**
 * Save chat message
 */
export async function saveChatMessage(
  soulId: string,
  userAccountId: string,
  role: 'user' | 'assistant',
  content: string,
  xpEarned: number = 0
): Promise<void> {
  // Get soul's UUID
  // soulId can be either soul_id (e.g., "Soul-123") or token_id (e.g., "0.0.7242548:1")
  let soul;
  
  // Try by soul_id first
  const { data: soulBySoulIdArray } = await supabase
    .from('souls')
    .select('id')
    .eq('soul_id', soulId)
    .limit(1);

  if (soulBySoulIdArray && soulBySoulIdArray.length > 0) {
    soul = soulBySoulIdArray[0];
    console.log(`✅ Found soul by soul_id: ${soulId}`);
  } else {
    // Try by token_id (format: tokenId:serialNumber)
    const { data: soulByTokenIdArray } = await supabase
      .from('souls')
      .select('id')
      .eq('token_id', soulId)
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .limit(1);
    
    if (soulByTokenIdArray && soulByTokenIdArray.length > 0) {
      soul = soulByTokenIdArray[0];
      console.log(`✅ Found soul by token_id: ${soulId}`);
    } else {
      console.warn(`⚠️ Soul not found for saveChatMessage: ${soulId}`);
    }
  }

  if (!soul) {
    console.warn(`⚠️ Soul not found for saveChatMessage: ${soulId}`);
    return;
  }

  await supabase.from('chat_messages').insert({
    soul_id: soul.id,
    user_account_id: userAccountId,
    role,
    content,
    xp_earned: xpEarned,
  });
}

/**
 * Get chat history for soul
 * Only returns messages from the current owner (user_account_id matches owner_account_id)
 * soulId can be either soul_id (e.g., "Soul-123") or token_id (e.g., "0.0.7242548:1")
 */
export async function getChatHistory(
  soulId: string,
  currentOwnerAccountId?: string,
  limit: number = 50
): Promise<ChatMessageRecord[]> {
  // Get soul's UUID and owner
  // Try by soul_id first
  let soul;
  const { data: soulBySoulIdArray } = await supabase
    .from('souls')
    .select('id, owner_account_id')
    .eq('soul_id', soulId)
    .limit(1);

  if (soulBySoulIdArray && soulBySoulIdArray.length > 0) {
    soul = soulBySoulIdArray[0];
    console.log(`✅ [getChatHistory] Found soul by soul_id: ${soulId}`);
  } else {
    // Try by token_id (format: tokenId:serialNumber)
    const { data: soulByTokenIdArray } = await supabase
      .from('souls')
      .select('id, owner_account_id')
      .eq('token_id', soulId)
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .limit(1);
    
    if (soulByTokenIdArray && soulByTokenIdArray.length > 0) {
      soul = soulByTokenIdArray[0];
      console.log(`✅ [getChatHistory] Found soul by token_id: ${soulId}`);
    } else {
      console.warn(`⚠️ [getChatHistory] Soul not found by soul_id or token_id`);
    }
  }

  if (!soul) {
    console.warn(`⚠️ [getChatHistory] Soul not found: ${soulId}`);
    return [];
  }

  // Use provided owner or get from soul record
  const ownerAccountId = currentOwnerAccountId || soul.owner_account_id;
  
  console.log(`📝 [getChatHistory] Querying chat_messages - soul.id: ${soul.id}, owner: ${ownerAccountId}`);

  // Only get messages from the current owner
  // This ensures that when NFT is transferred, new owner won't see previous owner's chat history
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('soul_id', soul.id)
    .eq('user_account_id', ownerAccountId) // Filter by current owner
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error(`❌ [getChatHistory] Error fetching chat history for soul ${soul.id}:`, error);
    return [];
  }
  
  console.log(`✅ [getChatHistory] Found ${data?.length || 0} messages for soul ${soul.id}`);

  return data || [];
}

/**
 * Delete chat history for a soul (only messages from the current owner)
 */
export async function deleteChatHistory(
  soulId: string,
  userAccountId: string
): Promise<void> {
  // Get soul's UUID
  // soulId can be either soul_id (e.g., "Soul-123") or token_id (e.g., "0.0.7242548:1")
  let soul;
  
  // Try by soul_id first
  const { data: soulBySoulIdArray } = await supabase
    .from('souls')
    .select('id')
    .eq('soul_id', soulId)
    .limit(1);

  if (soulBySoulIdArray && soulBySoulIdArray.length > 0) {
    soul = soulBySoulIdArray[0];
    console.log(`✅ [deleteChatHistory] Found soul by soul_id: ${soulId}`);
  } else {
    // Try by token_id (format: tokenId:serialNumber)
    const { data: soulByTokenIdArray } = await supabase
      .from('souls')
      .select('id')
      .eq('token_id', soulId)
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .limit(1);
    
    if (soulByTokenIdArray && soulByTokenIdArray.length > 0) {
      soul = soulByTokenIdArray[0];
      console.log(`✅ [deleteChatHistory] Found soul by token_id: ${soulId}`);
    } else {
      console.warn(`⚠️ [deleteChatHistory] Soul not found by soul_id or token_id`);
    }
  }

  if (!soul) {
    throw new Error(`Soul not found: ${soulId}`);
  }

  console.log(`🗑️ [deleteChatHistory] Deleting messages for soul ${soul.id}, user ${userAccountId}`);

  // Delete only messages from the current owner
  const { error: deleteError, count } = await supabase
    .from('chat_messages')
    .delete()
    .eq('soul_id', soul.id)
    .eq('user_account_id', userAccountId);

  if (deleteError) {
    console.error(`❌ [deleteChatHistory] Error deleting chat history for soul ${soul.id}:`, deleteError);
    throw new Error(`Failed to delete chat history: ${deleteError.message}`);
  }
  
  console.log(`✅ [deleteChatHistory] Chat history deleted successfully for soul ${soul.id} - deleted ${count || 0} messages`);
}

/**
 * List soul for sale
 */
export async function listSoulForSaleDB(
  soulId: string,
  price: number
): Promise<void> {
  console.log('📝 Listing soul for sale:', { soulId, price });
  
  const { data, error } = await supabase
    .from('souls')
    .update({
      is_listed: true,
      price,
      listed_at: new Date().toISOString(),
    })
    .eq('soul_id', soulId)
    .select();

  if (error) {
    console.error('❌ Failed to list soul:', error);
    throw new Error(`Failed to list soul: ${error.message}`);
  }

  console.log('✅ Soul listed successfully:', data);

  // Record transaction
  const { data: soul } = await supabase
    .from('souls')
    .select('id, owner_account_id')
    .eq('soul_id', soulId)
    .single();

  if (soul) {
    await supabase.from('marketplace_transactions').insert({
      soul_id: soul.id,
      transaction_type: 'list',
      from_account_id: soul.owner_account_id,
      price,
    });
  }
}

/**
 * Cancel soul listing
 */
export async function cancelListingDB(soulId: string): Promise<void> {
  console.log('🚫 Cancelling listing for:', soulId);
  
  // Try by soul_id first
  let { data, error } = await supabase
    .from('souls')
    .update({
      is_listed: false,
      price: null,
      listed_at: null,
    })
    .eq('soul_id', soulId)
    .select();

  console.log('📊 Update by soul_id result:', { data, error });

  // If not found by soul_id, try by token_id
  if (error || !data || data.length === 0) {
    console.log('🔄 Trying by token_id...');
    const result = await supabase
      .from('souls')
      .update({
        is_listed: false,
        price: null,
        listed_at: null,
      })
      .eq('token_id', soulId)
      .select();
    
    console.log('📊 Update by token_id result:', { data: result.data, error: result.error });
    
    data = result.data;
    error = result.error;
  }

  // If still not found, try like search
  if (error || !data || data.length === 0) {
    console.log('🔄 Trying with like search...');
    const result = await supabase
      .from('souls')
      .update({
        is_listed: false,
        price: null,
        listed_at: null,
      })
      .like('token_id', `%${soulId}%`)
      .select();
    
    console.log('📊 Update by like search result:', { data: result.data, error: result.error });
    
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('❌ Failed to cancel listing:', error);
    throw new Error(`Failed to cancel listing: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.error('❌ No records updated for soul_id:', soulId);
    throw new Error(`No soul found with identifier: ${soulId}`);
  }

  console.log('✅ Listing cancelled successfully:', data);
}

/**
 * Update soul evolution
 * Updates soul with evolved personality, rarity, and skills
 */
export async function updateSoulEvolution(
  soulId: string,
  evolution: {
    rarity: string;
    personality: string;
    tagline: string;
    skills: string[];
    evolutionSummary: string;
  }
): Promise<SoulAgent> {
  console.log('🧬 Updating soul evolution:', soulId);

  const { data, error } = await supabase
    .from('souls')
    .update({
      rarity: evolution.rarity,
      personality: evolution.personality,
      tagline: evolution.tagline,
      skills: evolution.skills,
      updated_at: new Date().toISOString()
    })
    .eq('soul_id', soulId)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to update soul evolution:', error);
    throw new Error(`Failed to update soul evolution: ${error.message}`);
  }

  // Record evolution event in history
  await supabase.from('evolution_history').insert({
    soul_id: data.id,
    from_rarity: data.rarity, // This will be old rarity from trigger
    to_rarity: evolution.rarity,
    from_level: data.level,
    to_level: data.level,
    xp_gained: 0,
    evolution_summary: evolution.evolutionSummary,
    evolved_at: new Date().toISOString()
  });

  console.log('✅ Soul evolution updated successfully');
  return recordToSoul(data);
}

/**
 * Buy soul from marketplace
 */
export async function buySoulDB(
  soulId: string,
  buyerAccountId: string
): Promise<void> {
  // Get soul
  const { data: soul } = await supabase
    .from('souls')
    .select('*')
    .eq('soul_id', soulId)
    .single();

  if (!soul || !soul.is_listed) {
    throw new Error('Soul not available for purchase');
  }

  const previousOwner = soul.owner_account_id;
  const price = soul.price;

  // Update ownership
  const { error } = await supabase
    .from('souls')
    .update({
      owner_account_id: buyerAccountId,
      is_listed: false,
      price: null,
      listed_at: null,
    })
    .eq('soul_id', soulId);

  if (error) {
    throw new Error('Failed to purchase soul');
  }

  // Record transaction
  await supabase.from('marketplace_transactions').insert({
    soul_id: soul.id,
    transaction_type: 'sale',
    from_account_id: previousOwner,
    to_account_id: buyerAccountId,
    price,
  });
}

/**
 * Get marketplace listings
 */
export async function getMarketplaceListings(): Promise<SoulAgent[]> {
  const { data, error } = await supabase
    .from('souls')
    .select('*')
    .eq('is_listed', true)
    .order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data.map(recordToSoul);
}
