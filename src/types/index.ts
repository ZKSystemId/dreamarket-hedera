/**
 * Backend Types & DTOs for DreamMarket
 * Aligned with frontend types but extended for backend needs
 */

import { Rarity, SoulEventType, InteractionRole } from '@prisma/client';

// Re-export Prisma enums for convenience
export { Rarity, SoulEventType, InteractionRole };

// ============================================================================
// CORE DOMAIN TYPES (aligned with frontend)
// ============================================================================

export interface Soul {
  id: string;
  name: string;
  tagline: string;
  rarity: Rarity;
  avatarSeed?: string;
  personality: string;
  skills: string[];
  creationStory: string;
  reputation: number; // 0-100
  owner: string; // wallet address
  tokenId?: string;
  creationTxHash?: string;
  lastUpdateTxHash?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface SoulSummary {
  id: string;
  name: string;
  tagline: string;
  rarity: Rarity;
  avatarSeed?: string;
  reputation: number;
  owner: string;
  tokenId?: string;
  skills: string[];
  isListed: boolean;
  listingPrice?: number;
  createdAt: string;
}

export interface SoulEvent {
  id: string;
  type: SoulEventType;
  description: string;
  timestamp: string;
  txHash?: string;
  metadata?: Record<string, any>;
}

export interface SoulInteraction {
  id: string;
  role: InteractionRole;
  content: string;
  timestamp: string;
  hashOnChain?: string;
}

export interface SoulStats {
  totalInteractions: number;
  totalOwners: number;
  lastActiveAt: string;
}

export interface User {
  id: string;
  walletAddress: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REQUEST DTOs (Input)
// ============================================================================

export interface CreateSoulRequest {
  name: string;
  tagline: string;
  rarity: Rarity;
  personality?: string;
  skills?: string[];
  creationStory?: string;
  inspirationPrompt?: string;
  ownerWallet: string;
  autoGeneratePersonality?: boolean;
}

export interface UpdateSoulRequest {
  name?: string;
  tagline?: string;
  personality?: string;
  skills?: string[];
  creationStory?: string;
}

export interface CreateInteractionRequest {
  userWallet?: string;
  messages: Array<{
    role: 'user' | 'soul';
    content: string;
  }>;
  persistOnChain?: boolean;
}

export interface UpdateReputationRequest {
  delta?: number;
  newScore?: number;
  reason?: string;
}

export interface FuseSoulsRequest {
  parentAId: string;
  parentBId: string;
  ownerWallet: string;
  fusionFormula?: string;
}

export interface ListSoulRequest {
  price: number;
}

export interface TransferSoulRequest {
  toWallet: string;
  fromWallet: string;
}

// ============================================================================
// RESPONSE DTOs (Output)
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SoulDetailResponse {
  soul: Soul;
  events: SoulEvent[];
  stats: SoulStats;
}

export interface CreateSoulResponse {
  soul: Soul;
  hedera: {
    tokenId: string;
    creationTxHash: string;
  };
}

export interface CreateInteractionResponse {
  success: boolean;
  interactionCount: number;
  onChainReference?: string;
}

export interface FusionResponse {
  childSoul: Soul;
  fusion: {
    id: string;
    parentAId: string;
    parentBId: string;
    fusionTxHash?: string;
    inheritedTraits?: Record<string, any>;
  };
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

export interface GetSoulsQuery {
  search?: string;
  rarity?: Rarity;
  skills?: string; // comma-separated
  sort?: 'newest' | 'reputation' | 'mostTraded';
  limit?: number;
  offset?: number;
  isListed?: boolean;
  owner?: string;
}

export interface GetInteractionsQuery {
  limit?: number;
  offset?: number;
  role?: InteractionRole;
}

// ============================================================================
// SERVICE LAYER TYPES
// ============================================================================

export interface HederaMintInput {
  name: string;
  ownerWallet: string;
  rarity: Rarity;
  metadata?: Record<string, any>;
}

export interface HederaMintResult {
  tokenId: string;
  txHash: string;
}

export interface HederaLogInput {
  soulId: string;
  hash: string;
  topicId?: string;
}

export interface HederaLogResult {
  messageId: string;
  topicId: string;
}

export interface HederaTransferInput {
  soulId: string;
  tokenId: string;
  fromWallet: string;
  toWallet: string;
}

export interface HederaTransferResult {
  txHash: string;
}

export interface AIGeneratePersonalityInput {
  prompt: string;
  rarity?: Rarity;
  skills?: string[];
}

export interface AIGeneratePersonalityResult {
  personality: string;
  creationStory: string;
  suggestedSkills: string[];
}

export interface AIGenerateChatPreviewInput {
  soul: Soul;
  messageCount?: number;
}

export interface AIGenerateChatPreviewResult {
  messages: Array<{
    role: 'user' | 'soul';
    content: string;
  }>;
}

// ============================================================================
// VALIDATION SCHEMAS (for runtime validation)
// ============================================================================

export const RARITY_VALUES: Rarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

export const SOUL_EVENT_TYPES: SoulEventType[] = [
  'MINTED',
  'TRANSFERRED',
  'REPUTATION_UPDATED',
  'MEMORY_UPDATED',
  'FUSED',
  'EVOLVED',
  'RENTED',
  'LISTED',
  'DELISTED',
  'OTHER',
];

export const INTERACTION_ROLES: InteractionRole[] = ['USER', 'SOUL', 'SYSTEM'];

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface SortParams {
  field: string;
  order: SortOrder;
}
