/**
 * Soul Evolution Service - Hedera Consensus Service Integration
 * 
 * Records soul evolution events on Hedera blockchain using HCS (Consensus Service)
 * This provides verifiable, immutable proof of soul growth and evolution.
 * 
 * Why HCS?
 * - Cheap: $0.0001 per message
 * - Fast: Instant finality
 * - Verifiable: Public topic, anyone can verify
 * - Scalable: Millions of messages
 * 
 * @author DreamMarket Team
 */

import {
  Client,
  TopicMessageSubmitTransaction,
  TopicId,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";
import { Rarity } from "@/types/agent";

// ============================================================================
// TYPES
// ============================================================================

export interface EvolutionEvent {
  type: "SOUL_EVOLUTION" | "LEVEL_UP" | "SKILL_UNLOCK";
  soulId: string;
  tokenId: string;
  serial: number;
  fromRarity: Rarity;
  toRarity: Rarity;
  fromLevel: number;
  toLevel: number;
  xpGained: number;
  timestamp: number;
  userWallet?: string;
}

export interface EvolutionProof {
  topicId: string;
  sequenceNumber: string;
  txHash: string;
  consensusTimestamp: string;
  hashscanUrl: string;
}

// ============================================================================
// HEDERA CLIENT SETUP
// ============================================================================

function getHederaClient(): Client | null {
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    console.warn('⚠️ Hedera credentials not configured for evolution service');
    return null;
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromString(operatorKey)
  );

  return client;
}

// ============================================================================
// EVOLUTION RECORDING
// ============================================================================

/**
 * Record soul evolution event on Hedera Consensus Service
 * 
 * This creates an immutable, verifiable record of the evolution on-chain.
 * Anyone can query the HCS topic to verify evolution history.
 * 
 * @param event - Evolution event details
 * @returns Proof of evolution (topic ID, sequence number, tx hash)
 */
export async function recordEvolutionOnChain(
  event: EvolutionEvent
): Promise<EvolutionProof | null> {
  const client = getHederaClient();
  if (!client) {
    console.warn('⚠️ Skipping on-chain evolution recording (no Hedera client)');
    return null;
  }

  const topicId = process.env.EVOLUTION_TOPIC_ID;
  if (!topicId) {
    console.warn('⚠️ Evolution topic not configured');
    client.close();
    return null;
  }

  try {
    console.log(`📝 Recording evolution on HCS: ${event.soulId}`);
    console.log(`   ${event.fromRarity} (Lv ${event.fromLevel}) → ${event.toRarity} (Lv ${event.toLevel})`);

    // Create message payload
    const message = {
      ...event,
      timestamp: Date.now(),
      version: "1.0",
    };

    // Submit to HCS topic
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(JSON.stringify(message))
      .setMaxTransactionFee(1); // Very cheap!

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    const proof: EvolutionProof = {
      topicId,
      sequenceNumber: receipt.topicSequenceNumber?.toString() || "0",
      txHash: response.transactionId.toString(),
      consensusTimestamp: new Date().toISOString(), // Use current timestamp
      hashscanUrl: `https://hashscan.io/testnet/topic/${topicId}`,
    };

    console.log(`✅ Evolution recorded on HCS!`);
    console.log(`   Topic: ${topicId}`);
    console.log(`   Sequence: ${proof.sequenceNumber}`);
    console.log(`   TX: ${proof.txHash}`);

    client.close();
    return proof;

  } catch (error) {
    console.error('❌ Failed to record evolution on HCS:', error);
    client.close();
    return null;
  }
}

/**
 * Record level up event (without rarity change)
 */
export async function recordLevelUp(
  soulId: string,
  tokenId: string,
  serial: number,
  fromLevel: number,
  toLevel: number,
  xpGained: number,
  rarity: Rarity,
  userWallet?: string
): Promise<EvolutionProof | null> {
  const event: EvolutionEvent = {
    type: "LEVEL_UP",
    soulId,
    tokenId,
    serial,
    fromRarity: rarity,
    toRarity: rarity,
    fromLevel,
    toLevel,
    xpGained,
    timestamp: Date.now(),
    userWallet,
  };

  return recordEvolutionOnChain(event);
}

/**
 * Record rarity evolution event
 */
export async function recordRarityEvolution(
  soulId: string,
  tokenId: string,
  serial: number,
  fromRarity: Rarity,
  toRarity: Rarity,
  fromLevel: number,
  toLevel: number,
  xpGained: number,
  userWallet?: string
): Promise<EvolutionProof | null> {
  const event: EvolutionEvent = {
    type: "SOUL_EVOLUTION",
    soulId,
    tokenId,
    serial,
    fromRarity,
    toRarity,
    fromLevel,
    toLevel,
    xpGained,
    timestamp: Date.now(),
    userWallet,
  };

  return recordEvolutionOnChain(event);
}

// ============================================================================
// EVOLUTION HISTORY (Future: Query HCS)
// ============================================================================

/**
 * Get evolution history for a soul
 * 
 * NOTE: This requires HCS Mirror Node API or subscription
 * For hackathon MVP, we'll store in Supabase and just provide HCS proof
 * 
 * Future enhancement: Query HCS topic messages directly
 */
export async function getEvolutionHistory(soulId: string): Promise<EvolutionEvent[]> {
  // TODO: Implement HCS topic query via Mirror Node API
  // For now, return from Supabase evolution_history table
  console.log(`📜 Evolution history for ${soulId} (from database)`);
  return [];
}

/**
 * Verify evolution proof on-chain
 * 
 * Anyone can verify by checking the HCS topic message
 */
export function getEvolutionVerificationUrl(topicId: string, sequenceNumber: string): string {
  return `https://hashscan.io/testnet/topic/${topicId}/message/${sequenceNumber}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if evolution recording is enabled
 */
export function isEvolutionRecordingEnabled(): boolean {
  return !!(
    process.env.HEDERA_OPERATOR_ID &&
    process.env.HEDERA_OPERATOR_KEY &&
    process.env.EVOLUTION_TOPIC_ID
  );
}

/**
 * Get evolution topic info
 */
export function getEvolutionTopicInfo() {
  return {
    topicId: process.env.EVOLUTION_TOPIC_ID || "Not configured",
    enabled: isEvolutionRecordingEnabled(),
    hashscanUrl: process.env.EVOLUTION_TOPIC_ID
      ? `https://hashscan.io/testnet/topic/${process.env.EVOLUTION_TOPIC_ID}`
      : null,
  };
}

/**
 * Format evolution event for display
 */
export function formatEvolutionEvent(event: EvolutionEvent): string {
  if (event.type === "SOUL_EVOLUTION") {
    return `🎉 EVOLUTION! ${event.fromRarity} → ${event.toRarity} at Level ${event.toLevel}`;
  } else if (event.type === "LEVEL_UP") {
    return `⬆️ Level Up! Reached Level ${event.toLevel} (+${event.xpGained} XP)`;
  } else {
    return `✨ Skill Unlocked at Level ${event.toLevel}`;
  }
}
