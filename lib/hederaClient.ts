/**
 * Hedera Client Abstraction Layer
 * 
 * This file provides a mock implementation of Hedera blockchain interactions.
 * All functions return simulated data with network latency to mimic real blockchain calls.
 * 
 * INTEGRATION GUIDE:
 * To integrate with real Hedera network:
 * 1. Install @hashgraph/sdk
 * 2. Replace mock functions with actual Hedera SDK calls
 * 3. Use Hedera Token Service (HTS) for NFT minting
 * 4. Use Smart Contracts for marketplace logic
 * 5. Use Consensus Service for reputation/history tracking
 * 
 * Hedera Services to use:
 */

import { SoulAgent, SoulAgentInput, AgentHistoryEvent, Rarity } from "@/types/agent";
import { mockUser, mockSouls } from "./mockData";
import {
  fetchSoulsFromDB,
  fetchUserSoulsFromDB,
  fetchCreatedSoulsFromDB,
  fetchSoulByIdFromDB,
  saveSoulToDB,
  updateSoulXP as updateSoulXPDB,
  listSoulForSaleDB,
  cancelListingDB,
  buySoulDB,
} from "./supabaseClient";

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c2NqbWx6YXJ5cHFvemlndmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNTI4MDAsImV4cCI6MjA0NjYyODgwMH0.placeholder');
};

/**
 * Rarity helper: THE SINGLE SOURCE OF TRUTH for level -> rarity
 * ALIGNED with aiChatEngine.ts and expService.ts
 * NEVER returns undefined!
 */
const getRarityForLevel = (level: number): Rarity => {
  if (level >= 20) return "Mythic";      // Level 20+
  if (level >= 15) return "Legendary";   // Level 15-19
  if (level >= 10) return "Rare";        // Level 10-14
  return "Common";                       // Level 1-9
};

/**
 * Helper to add evolution fields to old souls
 * ENSURES rarity is NEVER undefined!
 */
const addEvolutionFields = (soul: any): SoulAgent => {
  // Ensure rarity is always valid
  const baseLevel = soul.level ?? 1;
  const baseRarity: Rarity = soul.rarity ?? getRarityForLevel(baseLevel);

  if (!soul.level) {
    // Calculate level based on rarity for existing souls (ALIGNED system)
    let level = 1;
    if (baseRarity === "Rare") level = 10;        // Rare starts at 10
    else if (baseRarity === "Legendary") level = 15; // Legendary starts at 15
    else if (baseRarity === "Mythic") level = 20;    // Mythic starts at 20

    return {
      ...soul,
      rarity: baseRarity, // ALWAYS set!
      level,
      xp: Math.floor(Math.random() * 100),
      xpToNextLevel: Math.floor(100 * Math.pow(1.5, level - 1)),
      totalTrainingTime: level * 30,
      evolutionHistory: []
    };
  }

  return {
    ...(soul as SoulAgent),
    rarity: baseRarity, // ALWAYS ensure rarity is set!
  };
};

// In-memory storage for new souls (simulating blockchain state)
let soulsDatabase = mockSouls.map(addEvolutionFields);
let nextTokenId = 123464;

/**
 * Fetch all souls from the marketplace
 * Real implementation: Query Hedera Mirror Node API for all NFTs in collection
 */
export async function fetchSouls(): Promise<SoulAgent[]> {
  if (isSupabaseConfigured()) {
    try {
      const souls = await fetchSoulsFromDB();
      console.log('✅ Fetched souls from Supabase:', souls.length);
      console.log('📊 Souls data:', souls.map(s => ({ id: s.id, name: s.name, isListed: s.isListed, price: s.price })));
      return souls;
    } catch (error) {
      console.error('❌ Supabase error, using mock data:', error);
      return []; // Return empty instead of mock data
    }
  }
  
  console.warn('⚠️ Supabase not configured, returning empty array');
  return []; // Return empty instead of mock data
}

/**
 * Fetch a single soul by ID
 * Real implementation: Query specific NFT metadata from Hedera
 */
export async function fetchSoulById(id: string): Promise<SoulAgent | null> {
  console.log('🔍 [fetchSoulById] Looking for soul:', id);
  
  if (isSupabaseConfigured()) {
    try {
      const soul = await fetchSoulByIdFromDB(id);
      if (soul) {
        console.log('✅ [fetchSoulById] Found soul in DB:', soul.id, soul.name);
        return soul;
      } else {
        console.warn('⚠️ [fetchSoulById] Soul not found in DB:', id);
      }
    } catch (error) {
      console.error('❌ [fetchSoulById] Supabase error:', error);
    }
  }
  
  // Fallback to mock data
  console.log('🔄 [fetchSoulById] Checking mock database...');
  await delay(500);
  const soul = soulsDatabase.find(s => s.id === id);
  
  if (soul) {
    console.log('✅ [fetchSoulById] Found soul in mock DB:', soul.id);
  } else {
    console.error('❌ [fetchSoulById] Soul not found anywhere:', id);
  }
  
  return soul || null;
}

/**
 * Mint a new soul as NFT on Hedera
 * Real implementation: Calls backend API which mints NFT using HTS
 */
export async function mintSoul(
  soulInput: SoulAgentInput,
  ownerAccountId?: string
): Promise<{
  tokenId: string;
  txHash: string;
  soulId: string;
}> {
  try {
    console.log('🚀 Calling mint API...');
    console.log('Soul input:', soulInput);
    
    // Call backend API to mint NFT on Hedera
    const response = await fetch('/api/souls/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(soulInput),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Mint API error:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to mint soul');
    }

    const data = await response.json();
    console.log('✅ Mint API success:', data);
    
    const owner = ownerAccountId || mockUser.address;

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        // Use nftId (token/serial) for better HashScan links
        const tokenIdWithSerial = data.nftId || `${data.tokenId}/${data.serial}`;
        const soulId = await saveSoulToDB(soulInput, owner, tokenIdWithSerial, data.txHash);
        console.log('✅ Soul saved to Supabase:', soulId);
        console.log('   Token ID with serial:', tokenIdWithSerial);
        return {
          tokenId: tokenIdWithSerial,
          txHash: data.txHash,
          soulId,
        };
      } catch (error) {
        console.error('❌ Failed to save to Supabase:', error);
        // Continue with mock data fallback
      }
    }

    // Fallback: Add to local database for display
    const tokenIdWithSerial = data.nftId || `${data.tokenId}/${data.serial}`;
    const newSoul: SoulAgent = {
      id: `soul-${data.serial}`,
      ...soulInput,
      rarity: "Common", // All souls start as Common
      reputation: 50,
      creator: owner, // Original minter
      owner, // Current owner (same at creation)
      tokenId: tokenIdWithSerial, // Include serial for HashScan link
      creationTxHash: data.txHash,
      lastUpdateTxHash: data.txHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Evolution system - start at level 1
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalTrainingTime: 0,
      evolutionHistory: [],
    };

    soulsDatabase.push(newSoul);

    return {
      tokenId: tokenIdWithSerial,
      txHash: data.txHash,
      soulId: newSoul.id,
    };
  } catch (error) {
    console.error('Error minting soul:', error);
    throw error;
  }
}

/**
 * Transfer soul ownership
 * Real implementation: Use HTS TokenTransferTransaction
 */
export async function transferSoul(
  soulId: string,
  fromAddress: string,
  toAddress: string
): Promise<{ txHash: string }> {
  await delay(1500);

  const soul = soulsDatabase.find(s => s.id === soulId);
  if (!soul) {
    throw new Error("Soul not found");
  }

  if (soul.owner !== fromAddress) {
    throw new Error("Not the owner of this soul");
  }

  soul.owner = toAddress;
  soul.updatedAt = new Date().toISOString();
  soul.lastUpdateTxHash = `0x${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 8)}`;

  return {
    txHash: soul.lastUpdateTxHash,
  };
}

/**
 * Update soul reputation
 * Real implementation: Use Consensus Service to record reputation change
 */
export async function updateReputation(
  soulId: string,
  newReputation: number
): Promise<{ txHash: string }> {
  await delay(1000);

  const soul = soulsDatabase.find(s => s.id === soulId);
  if (!soul) {
    throw new Error("Soul not found");
  }

  soul.reputation = Math.max(0, Math.min(100, newReputation));
  soul.updatedAt = new Date().toISOString();
  soul.lastUpdateTxHash = `0x${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 8)}`;

  return {
    txHash: soul.lastUpdateTxHash,
  };
}

/**
 * Fetch soul history/timeline from database
 * Includes: minting, marketplace transactions, level ups, evolutions
 */
export async function fetchSoulHistory(soulId: string): Promise<AgentHistoryEvent[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { supabase } = await import('./supabase');
    const events: AgentHistoryEvent[] = [];

    // Get soul record to find database ID
    let { data: soulRecords } = await supabase
      .from('souls')
      .select('id, soul_id, name, created_at, creation_tx_hash, token_id')
      .or(`soul_id.eq.${soulId},token_id.eq.${soulId}`)
      .order('xp', { ascending: false })
      .limit(1);

    if (!soulRecords || soulRecords.length === 0) {
      console.log('⚠️ Soul not found for history:', soulId);
      return [];
    }

    const soulRecord = soulRecords[0];
    const soulDbId = soulRecord.id;

    // 1. Mint event (from soul creation)
    events.push({
      id: `mint-${soulRecord.soul_id}`,
      type: "minted",
      description: `Soul "${soulRecord.name}" was minted on Hedera`,
      timestamp: soulRecord.created_at,
      txHash: soulRecord.creation_tx_hash || undefined,
    });

    // 2. Marketplace transactions (sales, listings, cancellations)
    const { data: marketplaceTx } = await supabase
      .from('marketplace_transactions')
      .select('*')
      .eq('soul_id', soulDbId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (marketplaceTx) {
      for (const tx of marketplaceTx) {
        if (tx.transaction_type === 'sale') {
          events.push({
            id: `sale-${tx.id}`,
            type: "transferred",
            description: `Sold to ${tx.to_account_id?.substring(0, 8)}...${tx.to_account_id?.substring(tx.to_account_id.length - 4)} for ${tx.price} HBAR`,
            timestamp: tx.created_at,
            txHash: tx.transaction_id || undefined,
          });
        } else if (tx.transaction_type === 'list') {
          events.push({
            id: `list-${tx.id}`,
            type: "listed",
            description: `Listed for sale at ${tx.price} HBAR`,
            timestamp: tx.created_at,
            txHash: tx.transaction_id || undefined,
          });
        } else if (tx.transaction_type === 'cancel') {
          events.push({
            id: `cancel-${tx.id}`,
            type: "delisted",
            description: `Listing cancelled`,
            timestamp: tx.created_at,
            txHash: tx.transaction_id || undefined,
          });
        }
      }
    }

    // 3. Level ups and evolutions (from chat interactions with XP earned)
    const { data: chatInteractions } = await supabase
      .from('chat_interactions')
      .select('created_at, xp_earned, level_after, rarity_after')
      .eq('soul_id', soulDbId)
      .gt('xp_earned', 0)
      .order('created_at', { ascending: false })
      .limit(50);

    if (chatInteractions) {
      let lastLevel = 0;
      let lastRarity = '';
      
      for (const interaction of chatInteractions) {
        if (interaction.level_after && interaction.level_after > lastLevel) {
          events.push({
            id: `levelup-${interaction.created_at}`,
            type: "level_up",
            description: `Level up! Reached Level ${interaction.level_after}${interaction.rarity_after && interaction.rarity_after !== lastRarity ? ` (${interaction.rarity_after})` : ''}`,
            timestamp: interaction.created_at,
            txHash: undefined,
          });
          lastLevel = interaction.level_after;
          if (interaction.rarity_after) {
            lastRarity = interaction.rarity_after;
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    return events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('❌ Error fetching soul history:', error);
    return [];
  }
}

/**
 * Get user's owned souls (current owner)
 * Real implementation: Query Hedera Mirror Node for NFTs owned by address
 */
export async function fetchUserSouls(address: string): Promise<SoulAgent[]> {
  if (isSupabaseConfigured()) {
    try {
      const souls = await fetchUserSoulsFromDB(address);
      console.log('✅ Fetched owned souls from Supabase:', souls.length);
      return souls;
    } catch (error) {
      console.error('❌ Supabase error:', error);
    }
  }
  
  await delay(700);
  return soulsDatabase.filter(soul => soul.owner === address);
}

/**
 * Get user's created souls (original minter)
 * Real implementation: Query Hedera Mirror Node for NFTs minted by address
 */
export async function fetchCreatedSouls(address: string): Promise<SoulAgent[]> {
  if (isSupabaseConfigured()) {
    try {
      const souls = await fetchCreatedSoulsFromDB(address);
      console.log('✅ Fetched created souls from Supabase:', souls.length);
      return souls;
    } catch (error) {
      console.error('❌ Supabase error:', error);
    }
  }
  
  await delay(700);
  return soulsDatabase.filter(soul => soul.creator === address);
}

/**
 * Connect wallet (mock)
 * Real implementation: Use HashConnect or Blade Wallet for connection
 */
export async function connectWallet(): Promise<{ address: string }> {
  await delay(1000);
  return { address: mockUser.address };
}

/**
 * Train soul - add XP and potentially level up
 * Real implementation: Record training session on Consensus Service
 */
export async function trainSoul(
  soulId: string,
  xpGained: number
): Promise<{ leveledUp: boolean; newLevel: number; newRarity?: Rarity }> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const result = await updateSoulXPDB(soulId, xpGained);
      console.log('✅ Soul trained in Supabase (raw):', result);
      
      // NORMALIZE result - ensure newRarity is NEVER undefined!
      const safeLevel = (result.newLevel ?? 1) as number;
      const safeRarity: Rarity = 
        (result.newRarity as Rarity | undefined) ?? getRarityForLevel(safeLevel);
      
      const normalizedResult = {
        leveledUp: !!result.leveledUp,
        newLevel: safeLevel,
        newRarity: safeRarity, // ← NEVER undefined!
      };
      
      console.log('✅ Soul trained (normalized):', normalizedResult);
      return normalizedResult;
    } catch (error) {
      console.error('❌ Supabase training error:', error);
      // Fall through to mock data
    }
  }

  await delay(1000);

  const soul = soulsDatabase.find(s => s.id === soulId);
  if (!soul) {
    throw new Error("Soul not found");
  }

  // Add XP
  soul.xp += xpGained;
  soul.totalTrainingTime += 5; // 5 minutes per training session

  let leveledUp = false;
  let newRarity: Rarity | undefined;

  // Check if leveled up
  while (soul.xp >= soul.xpToNextLevel) {
    soul.xp -= soul.xpToNextLevel;
    soul.level += 1;
    leveledUp = true;

    // Calculate next level XP requirement
    soul.xpToNextLevel = Math.floor(100 * Math.pow(1.5, soul.level - 1));

    // Check for rarity evolution (ALIGNED system)
    const oldRarity = soul.rarity;
    if (soul.level >= 10 && soul.rarity === "Common") {
      soul.rarity = "Rare";
      newRarity = "Rare";
    } else if (soul.level >= 15 && soul.rarity === "Rare") {
      soul.rarity = "Legendary";
      newRarity = "Legendary";
    } else if (soul.level >= 20 && soul.rarity === "Legendary") {
      soul.rarity = "Mythic";
      newRarity = "Mythic";
    }

    // Record evolution if rarity changed
    if (newRarity) {
      const evolutionEvent: import("@/types/agent").EvolutionEvent = {
        id: `evo-${Date.now()}`,
        fromRarity: oldRarity,
        toRarity: newRarity,
        fromLevel: soul.level - 1,
        toLevel: soul.level,
        xpGained,
        timestamp: new Date().toISOString(),
        txHash: `0x${Math.random().toString(36).substring(2, 15)}`,
      };
      soul.evolutionHistory.push(evolutionEvent);
    }
  }

  soul.updatedAt = new Date().toISOString();

  // ALWAYS ensure newRarity has a value (fallback to current rarity)
  if (!newRarity) {
    newRarity = soul.rarity;
  }

  return {
    leveledUp,
    newLevel: soul.level,
    newRarity, // ← NEVER undefined!
  };
}

/**
 * List soul for sale
 * Real implementation: Create marketplace listing with smart contract
 */
export async function listSoulForSale(
  soulId: string,
  priceInHbar: number
): Promise<{ txHash: string }> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      await listSoulForSaleDB(soulId, priceInHbar);
      console.log('✅ Soul listed in Supabase');
      return { txHash: `0x${Math.random().toString(36).substring(2, 15)}` };
    } catch (error) {
      console.error('❌ Supabase listing error:', error);
    }
  }

  await delay(1000);

  const soul = soulsDatabase.find(s => s.id === soulId);
  if (!soul) {
    throw new Error("Soul not found");
  }

  // Add listing info to soul (in production, this would be in marketplace contract)
  (soul as any).isListed = true;
  (soul as any).price = priceInHbar;
  (soul as any).listedAt = new Date().toISOString();

  return {
    txHash: `0x${Math.random().toString(36).substring(2, 15)}`,
  };
}

/**
 * Buy soul from marketplace
 * Real implementation: Execute marketplace purchase with HTS transfer
 */
export async function buySoul(
  soulId: string,
  buyerAddress: string
): Promise<{ txHash: string }> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      await buySoulDB(soulId, buyerAddress);
      console.log('✅ Soul purchased in Supabase');
      return { txHash: `0x${Math.random().toString(36).substring(2, 15)}` };
    } catch (error) {
      console.error('❌ Supabase purchase error:', error);
    }
  }

  await delay(1500);

  const soul = soulsDatabase.find(s => s.id === soulId);
  if (!soul) {
    throw new Error("Soul not found");
  }

  if (!(soul as any).isListed) {
    throw new Error("Soul is not listed for sale");
  }

  // Transfer ownership
  const previousOwner = soul.owner;
  soul.owner = buyerAddress;
  soul.updatedAt = new Date().toISOString();
  
  // Remove listing
  (soul as any).isListed = false;
  delete (soul as any).price;
  delete (soul as any).listedAt;

  const txHash = `0x${Math.random().toString(36).substring(2, 15)}`;
  soul.lastUpdateTxHash = txHash;

  return { txHash };
}

/**
 * Cancel soul listing
 * Real implementation: Remove marketplace listing
 */
export async function cancelListing(soulId: string): Promise<{ txHash: string }> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      await cancelListingDB(soulId);
      console.log('✅ Listing cancelled in Supabase');
      return { txHash: `0x${Math.random().toString(36).substring(2, 15)}` };
    } catch (error) {
      console.error('❌ Supabase cancel error:', error);
      throw error; // Don't fallback, show the error
    }
  }

  await delay(800);

  const soul = soulsDatabase.find(s => s.id === soulId);
  if (!soul) {
    throw new Error("Soul not found");
  }

  (soul as any).isListed = false;
  delete (soul as any).price;
  delete (soul as any).listedAt;

  return {
    txHash: `0x${Math.random().toString(36).substring(2, 15)}`,
  };
}

/**
 * Get account balance from Hedera Mirror Node
 * Real implementation: Query Hedera account balance via Mirror Node API
 */
export async function getAccountBalance(address: string): Promise<{
  hbar: number;
  tokens: number;
}> {
  try {
    // Fetch real balance from Hedera Mirror Node (Testnet)
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`
    );
    
    if (!response.ok) {
      console.warn(`Failed to fetch balance for ${address}, using mock data`);
      // Fallback to mock data if API fails
      const ownedNFTs = soulsDatabase.filter(soul => soul.owner === address);
      return {
        hbar: 100.5,
        tokens: ownedNFTs.length,
      };
    }
    
    const data = await response.json();
    
    // Convert tinybars to HBAR (1 HBAR = 100,000,000 tinybars)
    // Mirror node API returns balance directly as a number (tinybars)
    const balanceInTinybars = data.balance?.balance || data.balance || 0;
    const hbarBalance = parseFloat((balanceInTinybars / 100_000_000).toFixed(2));
    
    console.log(`💰 Balance for ${address}: ${hbarBalance} HBAR (${balanceInTinybars} tinybars)`);
    
    return {
      hbar: hbarBalance,
      tokens: 0, // This is not used, total NFTs is fetched separately
    };
  } catch (error) {
    console.error("Error fetching account balance:", error);
    
    // Fallback to counting owned NFTs
    const ownedNFTs = soulsDatabase.filter(soul => soul.owner === address);
    return {
      hbar: 0, // Show 0 if we can't fetch real balance
      tokens: ownedNFTs.length,
    };
  }
}
