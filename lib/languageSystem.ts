/**
 * Language Unlock System
 * Languages unlock as soul levels up - making multi-language a premium feature!
 */

import { Rarity } from "@/types/agent";

export type Language = "en" | "id" | "es" | "fr" | "de" | "ja" | "ko" | "zh";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  unlockLevel: number;
  unlockRarity: Rarity;
}

/**
 * All available languages with unlock requirements
 */
export const ALL_LANGUAGES: LanguageInfo[] = [
  // Common - Level 1+
  { 
    code: "en", 
    name: "English", 
    nativeName: "English", 
    flag: "🇺🇸",
    unlockLevel: 1,
    unlockRarity: "Common"
  },
  
  // Rare - Level 6+
  { 
    code: "id", 
    name: "Indonesian", 
    nativeName: "Bahasa Indonesia", 
    flag: "🇮🇩",
    unlockLevel: 6,
    unlockRarity: "Rare"
  },
  { 
    code: "es", 
    name: "Spanish", 
    nativeName: "Español", 
    flag: "🇪🇸",
    unlockLevel: 6,
    unlockRarity: "Rare"
  },
  
  // Legendary - Level 11+
  { 
    code: "fr", 
    name: "French", 
    nativeName: "Français", 
    flag: "🇫🇷",
    unlockLevel: 11,
    unlockRarity: "Legendary"
  },
  { 
    code: "de", 
    name: "German", 
    nativeName: "Deutsch", 
    flag: "🇩🇪",
    unlockLevel: 11,
    unlockRarity: "Legendary"
  },
  
  // Mythic - Level 16+
  { 
    code: "ja", 
    name: "Japanese", 
    nativeName: "日本語", 
    flag: "🇯🇵",
    unlockLevel: 16,
    unlockRarity: "Mythic"
  },
  { 
    code: "ko", 
    name: "Korean", 
    nativeName: "한국어", 
    flag: "🇰🇷",
    unlockLevel: 16,
    unlockRarity: "Mythic"
  },
  { 
    code: "zh", 
    name: "Chinese", 
    nativeName: "中文", 
    flag: "🇨🇳",
    unlockLevel: 16,
    unlockRarity: "Mythic"
  },
];

/**
 * Get languages unlocked for a specific level
 */
export function getUnlockedLanguages(level: number): LanguageInfo[] {
  return ALL_LANGUAGES.filter(lang => level >= lang.unlockLevel);
}

/**
 * Get locked languages for a specific level
 */
export function getLockedLanguages(level: number): LanguageInfo[] {
  return ALL_LANGUAGES.filter(lang => level < lang.unlockLevel);
}

/**
 * Check if a language is unlocked for a level
 */
export function isLanguageUnlocked(languageCode: Language, level: number): boolean {
  const lang = ALL_LANGUAGES.find(l => l.code === languageCode);
  if (!lang) return false;
  return level >= lang.unlockLevel;
}

/**
 * Get language count by rarity
 */
export function getLanguageCountByRarity(rarity: Rarity): number {
  switch (rarity) {
    case "Common":
      return 1; // English only
    case "Rare":
      return 3; // English + Indonesian + Spanish
    case "Legendary":
      return 5; // + French + German
    case "Mythic":
      return 8; // All languages!
    default:
      return 1;
  }
}

/**
 * Get language unlock summary for display
 */
export function getLanguageUnlockSummary(level: number): {
  unlocked: LanguageInfo[];
  locked: LanguageInfo[];
  nextUnlock?: LanguageInfo;
  totalUnlocked: number;
  totalLanguages: number;
} {
  const unlocked = getUnlockedLanguages(level);
  const locked = getLockedLanguages(level);
  const nextUnlock = locked.length > 0 ? locked[0] : undefined;

  return {
    unlocked,
    locked,
    nextUnlock,
    totalUnlocked: unlocked.length,
    totalLanguages: ALL_LANGUAGES.length,
  };
}

/**
 * Get language name for display
 */
export function getLanguageName(code: Language): string {
  const lang = ALL_LANGUAGES.find(l => l.code === code);
  return lang ? lang.nativeName : "English";
}

/**
 * Get full language name for AI prompt
 */
export function getLanguageFullName(code: Language): string {
  const languageMap: Record<Language, string> = {
    en: "English",
    id: "Indonesian (Bahasa Indonesia)",
    es: "Spanish (Español)",
    fr: "French (Français)",
    de: "German (Deutsch)",
    ja: "Japanese (日本語)",
    ko: "Korean (한국어)",
    zh: "Chinese (中文)",
  };
  
  return languageMap[code] || "English";
}
