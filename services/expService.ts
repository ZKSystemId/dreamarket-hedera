/**
 * EXP & Leveling Service
 * 
 * Handles experience points, leveling, and rarity progression
 */

import { Rarity } from "@/types/agent";

/**
 * EXP Configuration
 */
export const EXP_CONFIG = {
  // Base EXP per message
  BASE_EXP: 10,
  
  // Bonus EXP for longer messages
  LENGTH_BONUS_THRESHOLD: 100, // characters
  LENGTH_BONUS: 5,
  
  // Bonus for quality interactions (detected keywords)
  QUALITY_KEYWORDS: [
    'why', 'how', 'explain', 'understand', 'learn', 'teach',
    'think', 'feel', 'believe', 'wisdom', 'insight', 'meaning'
  ],
  QUALITY_BONUS: 3,
  
  // Level thresholds
  LEVEL_THRESHOLDS: [
    0,    // Level 1: 0-99 XP
    100,  // Level 2: 100-199 XP
    250,  // Level 3: 250-399 XP
    450,  // Level 4: 450-649 XP
    700,  // Level 5: 700-999 XP (Common → Rare)
    1000, // Level 6: 1000-1349 XP
    1350, // Level 7: 1350-1749 XP
    1750, // Level 8: 1750-2199 XP
    2200, // Level 9: 2200-2699 XP
    2700, // Level 10: 2700+ XP (Rare → Legendary)
    3250, // Level 11
    3850, // Level 12
    4500, // Level 13
    5200, // Level 14
    6000, // Level 15: (Legendary → Mythic)
    6900, // Level 16
    7900, // Level 17
    9000, // Level 18
    10200, // Level 19
    11500, // Level 20
  ],
  
  // Rarity thresholds (aligned with language unlock system)
  RARITY_LEVELS: {
    Common: { min: 1, max: 5 },      // Level 1-5 (English only)
    Rare: { min: 6, max: 14 },       // Level 6-14 (Indonesian, Spanish)
    Legendary: { min: 15, max: 19 }, // Level 15-19 (French, German)
    Mythic: { min: 20, max: 999 }    // Level 20+ (All 8 languages)
  }
};

/**
 * Calculate EXP gain from a chat interaction
 * Based on message length, quality, and engagement
 */
export function calculateExpGain(
  userMessage: string,
  soulReply: string
): number {
  let exp = EXP_CONFIG.BASE_EXP;

  // Length bonus for substantial messages
  if (userMessage.length > EXP_CONFIG.LENGTH_BONUS_THRESHOLD) {
    exp += EXP_CONFIG.LENGTH_BONUS;
  }

  // Quality bonus for thoughtful questions
  const messageLower = userMessage.toLowerCase();
  const hasQualityKeyword = EXP_CONFIG.QUALITY_KEYWORDS.some(
    keyword => messageLower.includes(keyword)
  );
  if (hasQualityKeyword) {
    exp += EXP_CONFIG.QUALITY_BONUS;
  }

  // Bonus for longer AI responses (indicates deeper engagement)
  if (soulReply.length > 200) {
    exp += 2;
  }

  return exp;
}

/**
 * Get level for given EXP
 * Returns the current level based on total experience
 */
export function getLevelForExp(exp: number): number {
  const thresholds = EXP_CONFIG.LEVEL_THRESHOLDS;
  
  // Find the highest level threshold that exp meets
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (exp >= thresholds[i]) {
      return i + 1; // Levels are 1-indexed
    }
  }
  
  return 1; // Minimum level
}

/**
 * Get XP required for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= EXP_CONFIG.LEVEL_THRESHOLDS.length) {
    // Max level reached, return a high number
    return EXP_CONFIG.LEVEL_THRESHOLDS[EXP_CONFIG.LEVEL_THRESHOLDS.length - 1] + 1000;
  }
  
  return EXP_CONFIG.LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get XP progress to next level (0-1)
 */
export function getXpProgress(currentExp: number, currentLevel: number): number {
  const currentLevelXp = EXP_CONFIG.LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXp = getXpForNextLevel(currentLevel);
  
  const xpIntoLevel = currentExp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  
  return Math.min(1, xpIntoLevel / xpNeededForLevel);
}

/**
 * Get rarity for given level
 * Determines soul rarity based on current level
 * ALIGNED with aiChatEngine.ts getRarityFromLevel()
 */
export function getRarityForLevel(level: number): Rarity {
  // Aligned with language unlock system
  if (level >= 20) return "Mythic";      // Level 20+ (all 8 languages)
  if (level >= 15) return "Legendary";   // Level 15-19 (French, German)
  if (level >= 6) return "Rare";         // Level 6-14 (Indonesian, Spanish)
  return "Common";                       // Level 1-5 (English only)
}

/**
 * Check if soul should evolve personality
 * Evolution happens at rarity transitions
 */
export function shouldEvolvePersonality(
  oldLevel: number,
  newLevel: number,
  oldRarity: Rarity,
  newRarity: Rarity
): boolean {
  // Evolve when rarity changes
  if (oldRarity !== newRarity) {
    return true;
  }

  // Also evolve at specific milestone levels (even if rarity doesn't change)
  const evolutionMilestones = [5, 10, 15, 20];
  const crossedMilestone = evolutionMilestones.some(
    milestone => oldLevel < milestone && newLevel >= milestone
  );

  return crossedMilestone;
}

/**
 * Get evolution milestone info
 * ALIGNED with aiChatEngine.ts rarity system
 */
export function getNextEvolutionMilestone(currentLevel: number): {
  level: number;
  rarity: Rarity;
  xpRequired: number;
} | null {
  const milestones = [
    { level: 10, rarity: "Rare" as Rarity },       // Common → Rare
    { level: 15, rarity: "Legendary" as Rarity },  // Rare → Legendary
    { level: 20, rarity: "Mythic" as Rarity }      // Legendary → Mythic
  ];

  const nextMilestone = milestones.find(m => m.level > currentLevel);
  
  if (!nextMilestone) {
    return null; // Max evolution reached
  }

  return {
    level: nextMilestone.level,
    rarity: nextMilestone.rarity,
    xpRequired: EXP_CONFIG.LEVEL_THRESHOLDS[nextMilestone.level - 1]
  };
}

/**
 * Calculate stats summary for a soul
 */
export function calculateSoulStats(exp: number, level: number) {
  const nextLevelXp = getXpForNextLevel(level);
  const currentLevelXp = EXP_CONFIG.LEVEL_THRESHOLDS[level - 1] || 0;
  const xpToNextLevel = nextLevelXp - exp;
  const progress = getXpProgress(exp, level);
  const rarity = getRarityForLevel(level);
  const nextMilestone = getNextEvolutionMilestone(level);

  return {
    level,
    exp,
    rarity,
    xpToNextLevel,
    nextLevelXp,
    currentLevelXp,
    progress,
    nextMilestone
  };
}
