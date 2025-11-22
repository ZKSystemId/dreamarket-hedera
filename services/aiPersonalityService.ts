/**
 * AI Personality Evolution Service
 * 
 * Handles the evolution of Soul personalities using LLM
 * Preserves core identity while increasing depth and wisdom
 */

import { SoulAgent, EvolutionParams, EvolutionResult, Rarity } from "@/types/agent";
import { LlmMessage, llmClient } from "@/lib/llmClient";

/**
 * System prompt for personality evolution
 * Defines the role, constraints, and output format
 */
export const SYSTEM_PROMPT = `You are a personality evolution engine for an AI Soul marketplace called DreamMarket.

Each Soul is a persistent AI personality owned by a user. Souls start at Common rarity and can evolve to Rare, Legendary, and Mythic.

When a Soul evolves, you must:
1. **Preserve its core identity and original themes** - This is the same Soul, just more experienced
2. **Increase its depth, wisdom, and distinctiveness** - Make it feel more "alive" and nuanced
3. **Make the personality feel more "experienced" and "mature"** as levels increase
4. **Avoid breaking the original style** unless explicitly requested
5. **Keep the same language** as the original personality (if English, stay English)
6. **Do not change owner or any on-chain fields** - only personality, tagline, skills

Evolution Guidelines by Rarity:
- **Common → Rare**: Add depth and nuance, refine existing traits
- **Rare → Legendary**: Add wisdom and mastery, introduce new dimensions
- **Legendary → Mythic**: Transcendent understanding, profound insights

You output **STRICTLY FORMATTED JSON ONLY**. Do not include any commentary, markdown, or extra text.

Output Format:
{
  "updatedPersonality": "string - enhanced personality description",
  "updatedTagline": "string - evolved tagline",
  "updatedSkills": ["string"] - enhanced skill list,
  "evolutionSummary": "string - 1-3 sentence story of this evolution"
}`;

/**
 * Build evolution prompt messages
 * Creates a structured prompt for the LLM
 */
export function buildEvolutionPrompt(
  soul: SoulAgent,
  params: EvolutionParams
): LlmMessage[] {
  // Extract user insights from recent interactions (if available)
  const insights = params.userInsights || [
    "Engaged in thoughtful conversations",
    "Demonstrated growing understanding",
    "Showed increasing depth in responses"
  ];

  // Build user message with structured data
  const userMessage = {
    soulName: soul.name,
    previousLevel: params.previousLevel,
    newLevel: params.newLevel,
    previousRarity: params.previousRarity,
    newRarity: params.newRarity,
    previousPersonality: soul.personality,
    previousTagline: soul.tagline,
    skills: soul.skills,
    creationStory: soul.creationStory,
    reason: params.reason || `Evolved from level ${params.previousLevel} to ${params.newLevel} through continuous growth and learning`,
    userInsights: insights,
    totalTrainingTime: soul.totalTrainingTime,
    reputation: soul.reputation
  };

  return [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    {
      role: "user",
      content: JSON.stringify(userMessage, null, 2)
    }
  ];
}

/**
 * Parse LLM response
 * Extracts JSON from the response, handling various formats
 */
function parseLlmResponse(raw: string): EvolutionResult {
  try {
    // Try to parse as direct JSON
    const parsed = JSON.parse(raw);
    
    // Validate required fields
    if (!parsed.updatedPersonality || !parsed.evolutionSummary) {
      throw new Error("Missing required fields in LLM response");
    }

    return {
      updatedPersonality: parsed.updatedPersonality,
      updatedTagline: parsed.updatedTagline,
      updatedSkills: parsed.updatedSkills,
      evolutionSummary: parsed.evolutionSummary
    };
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/) || raw.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          updatedPersonality: parsed.updatedPersonality,
          updatedTagline: parsed.updatedTagline,
          updatedSkills: parsed.updatedSkills,
          evolutionSummary: parsed.evolutionSummary
        };
      } catch (e) {
        // Continue to error handling
      }
    }

    console.error("❌ Failed to parse LLM response:", raw);
    throw new Error("Failed to parse evolution result from LLM");
  }
}

/**
 * Evolve Soul Personality
 * Main function to evolve a soul's personality using AI
 */
export async function evolveSoulPersonality(
  soul: SoulAgent,
  params: EvolutionParams
): Promise<EvolutionResult> {
  console.log(`🧬 Evolving ${soul.name} from ${params.previousRarity} to ${params.newRarity}`);

  try {
    // Build prompt messages
    const messages = buildEvolutionPrompt(soul, params);

    // Call LLM
    const raw = await llmClient.generate(messages);

    // Parse response
    const result = parseLlmResponse(raw);

    console.log(`✅ Evolution complete for ${soul.name}`);
    console.log(`📝 Summary: ${result.evolutionSummary}`);

    return result;
  } catch (error) {
    console.error(`❌ Evolution failed for ${soul.name}:`, error);
    throw error;
  }
}

/**
 * Check if soul should evolve
 * Determines if a soul has reached an evolution milestone
 */
export function shouldSoulEvolve(soul: SoulAgent): boolean {
  // Evolution milestones
  const EVOLUTION_LEVELS = {
    RARE: 5,      // Common → Rare at level 5
    LEGENDARY: 10, // Rare → Legendary at level 10
    MYTHIC: 15     // Legendary → Mythic at level 15
  };

  const currentRarity = soul.rarity;
  const level = soul.level;

  // Check if at evolution threshold
  if (currentRarity === "Common" && level >= EVOLUTION_LEVELS.RARE) {
    return true;
  }
  if (currentRarity === "Rare" && level >= EVOLUTION_LEVELS.LEGENDARY) {
    return true;
  }
  if (currentRarity === "Legendary" && level >= EVOLUTION_LEVELS.MYTHIC) {
    return true;
  }

  return false;
}

/**
 * Get next rarity
 * Returns the next rarity tier for evolution
 */
export function getNextRarity(currentRarity: Rarity): Rarity | null {
  const rarityProgression: Rarity[] = ["Common", "Rare", "Legendary", "Mythic"];
  const currentIndex = rarityProgression.indexOf(currentRarity);
  
  if (currentIndex === -1 || currentIndex === rarityProgression.length - 1) {
    return null; // Already at max rarity
  }

  return rarityProgression[currentIndex + 1];
}

/**
 * Get evolution level requirement
 * Returns the level required for next evolution
 */
export function getEvolutionLevelRequirement(currentRarity: Rarity): number | null {
  const requirements: Record<Rarity, number | null> = {
    "Common": 5,
    "Rare": 10,
    "Legendary": 15,
    "Mythic": null // Max rarity
  };

  return requirements[currentRarity];
}

/**
 * Extract user insights from chat history
 * Analyzes chat messages to extract themes and patterns
 */
export function extractUserInsights(chatMessages: any[]): string[] {
  if (!chatMessages || chatMessages.length === 0) {
    return ["Engaged in thoughtful conversations"];
  }

  const insights: string[] = [];

  // Analyze message topics (simple keyword extraction)
  const topics = new Set<string>();
  const keywords = {
    philosophy: ["meaning", "purpose", "existence", "consciousness"],
    creativity: ["create", "imagine", "art", "design", "story"],
    wisdom: ["wisdom", "knowledge", "learn", "understand", "insight"],
    emotion: ["feel", "emotion", "love", "hope", "dream"],
    technology: ["code", "tech", "ai", "future", "innovation"]
  };

  chatMessages.forEach(msg => {
    const content = msg.content?.toLowerCase() || "";
    Object.entries(keywords).forEach(([topic, words]) => {
      if (words.some(word => content.includes(word))) {
        topics.add(topic);
      }
    });
  });

  // Generate insights based on topics
  if (topics.has("philosophy")) {
    insights.push("Explored deep philosophical questions about existence and meaning");
  }
  if (topics.has("creativity")) {
    insights.push("Demonstrated creative thinking and imaginative expression");
  }
  if (topics.has("wisdom")) {
    insights.push("Showed growing wisdom and understanding through learning");
  }
  if (topics.has("emotion")) {
    insights.push("Developed emotional depth and empathetic responses");
  }
  if (topics.has("technology")) {
    insights.push("Engaged with technological concepts and future possibilities");
  }

  // Add general insight if no specific topics found
  if (insights.length === 0) {
    insights.push("Engaged in diverse and meaningful conversations");
  }

  // Add message count insight
  insights.push(`Participated in ${chatMessages.length} conversations, building experience`);

  return insights;
}
