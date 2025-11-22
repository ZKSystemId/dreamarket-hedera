/**
 * EXP and Level System for AI Soul Growth
 * Based on interaction quality, length, and engagement
 */

export interface LevelConfig {
  minLevel: number;
  maxLevel: number;
  minExp: number;
  maxExp: number;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
  expPerChat: number;
  features: string[];
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    minLevel: 1,
    maxLevel: 5,
    minExp: 0,
    maxExp: 500,
    rarity: 'Common',
    expPerChat: 10,
    features: ['Basic chat', 'Simple responses'],
  },
  {
    minLevel: 6,
    maxLevel: 10,
    minExp: 501,
    maxExp: 1500,
    rarity: 'Rare',
    expPerChat: 20,
    features: ['Memory active', 'Context awareness', 'Personality hints'],
  },
  {
    minLevel: 11,
    maxLevel: 15,
    minExp: 1501,
    maxExp: 4000,
    rarity: 'Legendary',
    expPerChat: 30,
    features: ['Personality evolution', 'Deep memory', 'Emotional intelligence'],
  },
  {
    minLevel: 16,
    maxLevel: 999,
    minExp: 4001,
    maxExp: 999999,
    rarity: 'Mythic',
    expPerChat: 40,
    features: ['Multi-agent fusion', 'Advanced reasoning', 'Proactive suggestions'],
  },
];

/**
 * Calculate EXP gain based on interaction quality
 */
export function calculateExpGain(
  userMessage: string,
  aiResponse: string,
  currentLevel: number = 1
): number {
  // Base EXP
  let exp = 5;

  // Length factor (longer conversations = more learning)
  const lengthFactor = Math.min(userMessage.length / 100, 5);
  exp += lengthFactor;

  // Diversity factor (unique words = better engagement)
  const uniqueWords = new Set(aiResponse.toLowerCase().split(/\s+/));
  const diversityFactor = Math.min(uniqueWords.size / 50, 5);
  exp += diversityFactor;

  // Level multiplier (higher level = more EXP needed)
  const levelMultiplier = 1 + (currentLevel * 0.1);
  exp *= levelMultiplier;

  return Math.round(exp);
}

/**
 * Get level config for current level
 */
export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS.find(
    config => level >= config.minLevel && level <= config.maxLevel
  ) || LEVEL_CONFIGS[0];
}

/**
 * Calculate XP needed for next level
 */
export function getXPForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Get current level progress from total XP
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  progress: number;
} {
  let level = 1;
  let xpAccumulated = 0;
  
  // Calculate current level
  while (true) {
    const xpNeeded = getXPForNextLevel(level);
    if (xpAccumulated + xpNeeded > totalXP) {
      break;
    }
    xpAccumulated += xpNeeded;
    level++;
    if (level > 999) break;
  }
  
  // Calculate progress in current level
  const currentLevelXP = totalXP - xpAccumulated;
  const xpForNextLevel = getXPForNextLevel(level);
  const progress = (currentLevelXP / xpForNextLevel) * 100;
  
  return {
    currentLevel: level,
    currentLevelXP,
    xpForNextLevel,
    progress,
  };
}

/**
 * Check if soul should evolve to new rarity
 */
export function checkRarityEvolution(
  currentLevel: number,
  currentRarity: string
): { shouldEvolve: boolean; newRarity?: string } {
  if (currentLevel >= 16 && currentRarity !== 'Mythic') {
    return { shouldEvolve: true, newRarity: 'Mythic' };
  }
  if (currentLevel >= 11 && currentRarity === 'Rare') {
    return { shouldEvolve: true, newRarity: 'Legendary' };
  }
  if (currentLevel >= 6 && currentRarity === 'Common') {
    return { shouldEvolve: true, newRarity: 'Rare' };
  }
  return { shouldEvolve: false };
}

/**
 * Generate personality evolution prompt
 */
export function getPersonalityEvolutionPrompt(
  currentPersonality: string,
  newRarity: string,
  level: number
): string {
  const traits = {
    Rare: 'more confident, knowledgeable, and engaging',
    Legendary: 'wise, emotionally intelligent, with deep understanding',
    Mythic: 'masterful, proactive, with exceptional insight and creativity',
  };

  return `Evolve this AI personality to reflect ${traits[newRarity as keyof typeof traits]} traits at level ${level}. 
Preserve the core essence but enhance maturity and capabilities:

Current: ${currentPersonality}

Enhanced personality (keep it concise, 2-3 sentences):`;
}

/**
 * Get features unlocked at current level
 */
export function getUnlockedFeatures(level: number): string[] {
  const config = getLevelConfig(level);
  return config.features;
}

/**
 * Calculate total training time bonus
 */
export function getTrainingTimeBonus(totalMinutes: number): number {
  // Bonus EXP for dedicated training time
  if (totalMinutes > 180) return 1.5; // 3+ hours = 50% bonus
  if (totalMinutes > 60) return 1.3;  // 1+ hour = 30% bonus
  if (totalMinutes > 30) return 1.2;  // 30+ min = 20% bonus
  return 1.0;
}
