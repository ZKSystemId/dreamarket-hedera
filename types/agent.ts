export type Rarity = "Common" | "Rare" | "Legendary" | "Mythic";

export interface SoulAgent {
  id: string;
  name: string;
  tagline: string;
  rarity: Rarity;
  avatarSeed?: string;
  avatarUrl?: string; // Custom uploaded image
  personality: string;
  skills: string[];
  creationStory: string;
  reputation: number; // 0–100
  creator: string; // Original minter (never changes)
  owner: string; // Current owner (changes on buy/sell)
  tokenId?: string;
  creationTxHash?: string;
  lastUpdateTxHash?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  // Evolution system
  level: number; // Current level (1-20+)
  xp: number; // Current XP
  xpToNextLevel: number; // XP needed for next level
  totalTrainingTime: number; // Minutes spent training
  evolutionHistory: EvolutionEvent[]; // History of evolutions
  // Marketplace
  isListed?: boolean; // Is soul listed for sale
  price?: number; // Price in HBAR
  listedAt?: string; // When listed
}

export interface SoulBlueprint {
  name: string;
  tagline: string;
  corePersonality: string;   // Main personality description
  skills: string[];          // Actual AI capabilities
  backstory: string;         // Creation story
  preferredTopics: string[]; // Topics soul likes to discuss
  avoidTopics: string[];     // Topics to avoid
  speakingStyle: string;     // How the soul communicates
}

export interface SoulAgentInput {
  name: string;
  tagline: string;
  rarity: Rarity;
  personality: string;
  skills: string[];
  creationStory: string;
}

export interface SoulCreationRequest {
  inspirationPrompt: string;  // User's creative input
  language?: string;          // Default: English
  autoGenerate?: boolean;     // Auto-generate with AI (default: true)
  constraints?: {
    maxSkills?: number;
    tone?: string;
    domain?: string;          // Writer, Mentor, Hacker, etc.
  };
}

export interface AgentHistoryEvent {
  id: string;
  type: "minted" | "transferred" | "reputation_updated" | "updated" | "evolved" | "listed" | "delisted" | "level_up" | "sale" | "cancel";
  description: string;
  timestamp: string;
  txHash?: string;
}

export interface EvolutionParams {
  previousLevel: number;
  newLevel: number;
  previousRarity: Rarity;
  newRarity: Rarity;
  reason?: string; // e.g. "Accumulated 500 EXP from deep philosophical chats"
  userInsights?: string[]; // extracted themes from interactions
}

export interface EvolutionResult {
  updatedPersonality: string;
  updatedTagline?: string;
  updatedSkills?: string[];
  evolutionSummary: string; // a 1–3 sentence story of the evolution
}

export interface EvolutionEvent {
  id: string;
  fromRarity: Rarity;
  toRarity: Rarity;
  fromLevel: number;
  toLevel: number;
  xpGained: number;
  timestamp: string;
  txHash?: string;
}

export interface FilterOptions {
  search: string;
  rarity: Rarity | "all";
  skills: string[];
  sortBy: "newest" | "reputation" | "traded" | "price-low" | "price-high";
}
