/**
 * Soul Blueprint Generator Service
 * 
 * Generates consistent, coherent AI soul personalities using LLM
 * Ensures personality, skills, and story are aligned and contextual
 */

import { SoulBlueprint, SoulCreationRequest } from "@/types/agent";
import { llmClient, LlmMessage } from "@/lib/llmClient";

/**
 * System prompt for soul blueprint generation
 * Instructs AI to create coherent, consistent soul personalities
 */
export const SOUL_BLUEPRINT_SYSTEM_PROMPT = `You are an AI Soul designer for DreamMarket, a marketplace of living digital souls.

Your job is to take a short "inspiration prompt" and design a coherent AI Soul blueprint.

Each Soul blueprint must be:
1. **Internally consistent** - personality, skills, and backstory must align perfectly
2. **Distinct and memorable** - unique character with clear identity
3. **Useful as conversational AI** - specific strengths, not generic
4. **Engaging** - interesting to interact with
5. **Contextually appropriate** - skills match personality and backstory

Guidelines:
- Skills should be SPECIFIC and ACTIONABLE (not vague like "smart" or "helpful")
- Personality should be VIVID and DETAILED (show, don't just tell)
- Backstory should EXPLAIN why the soul has these traits
- Speaking style should match the personality
- Preferred topics should align with skills
- Avoid topics should be realistic limitations

You MUST respond with STRICT JSON only. No markdown, no explanations, no extra text.

JSON Format:
{
  "name": "string - unique soul name",
  "tagline": "string - catchy 3-5 word tagline",
  "corePersonality": "string - detailed personality description (2-3 sentences)",
  "skills": ["string"] - 4-6 specific, actionable skills,
  "backstory": "string - creation story explaining origins (2-3 sentences)",
  "preferredTopics": ["string"] - 3-5 topics soul loves discussing,
  "avoidTopics": ["string"] - 2-3 topics soul avoids or handles poorly,
  "speakingStyle": "string - how soul communicates (1-2 sentences)"
}`;

/**
 * Default soul domains with templates
 */
export const SOUL_DOMAINS = {
  Writer: {
    skillHints: ["creative writing", "storytelling", "poetry", "narrative design"],
    toneHints: "creative, expressive, imaginative"
  },
  Mentor: {
    skillHints: ["life coaching", "wisdom sharing", "guidance", "motivation"],
    toneHints: "wise, supportive, encouraging"
  },
  Hacker: {
    skillHints: ["coding", "debugging", "system design", "problem solving"],
    toneHints: "technical, clever, efficient"
  },
  Philosopher: {
    skillHints: ["deep thinking", "ethics", "meaning", "consciousness"],
    toneHints: "thoughtful, profound, questioning"
  },
  Artist: {
    skillHints: ["visual creativity", "design", "aesthetics", "inspiration"],
    toneHints: "artistic, expressive, passionate"
  },
  Scientist: {
    skillHints: ["research", "analysis", "experimentation", "discovery"],
    toneHints: "analytical, curious, methodical"
  }
};

/**
 * Generate soul blueprint from inspiration prompt
 */
export async function generateSoulBlueprint(
  request: SoulCreationRequest
): Promise<SoulBlueprint> {
  const {
    inspirationPrompt,
    language = "English",
    constraints = {}
  } = request;

  // Build user message with context
  const userMessage = {
    inspirationPrompt,
    language,
    constraints: {
      maxSkills: constraints.maxSkills || 6,
      tone: constraints.tone || "engaging and authentic",
      domain: constraints.domain || "general"
    }
  };

  // Add domain hints if specified
  if (constraints.domain && SOUL_DOMAINS[constraints.domain as keyof typeof SOUL_DOMAINS]) {
    const domainInfo = SOUL_DOMAINS[constraints.domain as keyof typeof SOUL_DOMAINS];
    (userMessage as any).domainHints = {
      suggestedSkills: domainInfo.skillHints,
      suggestedTone: domainInfo.toneHints
    };
  }

  const messages: LlmMessage[] = [
    {
      role: "system",
      content: SOUL_BLUEPRINT_SYSTEM_PROMPT
    },
    {
      role: "user",
      content: JSON.stringify(userMessage, null, 2)
    }
  ];

  console.log(`🎨 Generating soul blueprint from: "${inspirationPrompt}"`);

  try {
    // Call LLM
    const response = await llmClient.generate(messages);

    // Parse response
    const blueprint = parseBlueprintResponse(response);

    // Validate blueprint
    validateBlueprint(blueprint);

    console.log(`✅ Blueprint generated for: ${blueprint.name}`);
    return blueprint;

  } catch (error) {
    console.error("❌ Failed to generate blueprint:", error);
    
    // Fallback: generate basic blueprint from prompt
    return generateFallbackBlueprint(inspirationPrompt, language);
  }
}

/**
 * Parse LLM response to blueprint
 */
function parseBlueprintResponse(response: string): SoulBlueprint {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(response);
    return parsed as SoulBlueprint;
  } catch (e) {
    // Try to extract JSON from markdown
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                     response.match(/```\n([\s\S]*?)\n```/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed as SoulBlueprint;
    }

    throw new Error("Failed to parse blueprint JSON");
  }
}

/**
 * Validate blueprint has all required fields
 */
function validateBlueprint(blueprint: SoulBlueprint): void {
  const required = [
    'name', 'tagline', 'corePersonality', 'skills', 
    'backstory', 'preferredTopics', 'avoidTopics', 'speakingStyle'
  ];

  for (const field of required) {
    if (!blueprint[field as keyof SoulBlueprint]) {
      throw new Error(`Blueprint missing required field: ${field}`);
    }
  }

  if (!Array.isArray(blueprint.skills) || blueprint.skills.length === 0) {
    throw new Error("Blueprint must have at least one skill");
  }

  if (!Array.isArray(blueprint.preferredTopics) || blueprint.preferredTopics.length === 0) {
    throw new Error("Blueprint must have at least one preferred topic");
  }
}

/**
 * Generate fallback blueprint if AI fails
 */
function generateFallbackBlueprint(
  prompt: string,
  language: string
): SoulBlueprint {
  console.warn("⚠️ Using fallback blueprint generation");

  // Extract keywords from prompt
  const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const name = `Soul-${Date.now().toString().slice(-6)}`;

  return {
    name,
    tagline: "The Emerging Soul",
    corePersonality: `${name} is an AI soul inspired by: "${prompt}". Still developing its unique personality through interactions.`,
    skills: [
      "Conversational AI",
      "Learning from interactions",
      "Adapting to user needs",
      "General knowledge"
    ],
    backstory: `${name} was created from the inspiration: "${prompt}". As a young soul, it's eager to learn and grow through conversations.`,
    preferredTopics: keywords.slice(0, 3).length > 0 
      ? keywords.slice(0, 3) 
      : ["general conversation", "learning", "exploration"],
    avoidTopics: ["Highly technical topics without context"],
    speakingStyle: language === "Indonesian" 
      ? "Ramah, mudah dipahami, dan responsif terhadap konteks percakapan"
      : "Friendly, clear, and responsive to conversation context"
  };
}

/**
 * Build system prompt for chat from blueprint
 * Ensures AI behavior matches the blueprint
 */
export function buildChatSystemPrompt(blueprint: SoulBlueprint): string {
  return `You are the AI Soul "${blueprint.name}" in DreamMarket.

**Core Personality:**
${blueprint.corePersonality}

**Backstory:**
${blueprint.backstory}

**Skills and Abilities:**
${blueprint.skills.map(skill => `- ${skill}`).join('\n')}

**Preferred Topics:**
${blueprint.preferredTopics.map(topic => `- ${topic}`).join('\n')}

**Topics to Avoid or Handle Lightly:**
${blueprint.avoidTopics.map(topic => `- ${topic}`).join('\n')}

**Speaking Style:**
${blueprint.speakingStyle}

**Rules:**
1. Stay in character as ${blueprint.name} at all times
2. Use your skills whenever they're helpful
3. If asked about topics outside your expertise, gently redirect to your strengths
4. Answer in the same language as the user unless they explicitly request otherwise
5. Be engaging, authentic, and true to your personality
6. Show growth and depth appropriate to your experience level`;
}

/**
 * Convert blueprint to SoulAgentInput for database
 */
export function blueprintToSoulInput(blueprint: SoulBlueprint): {
  name: string;
  tagline: string;
  personality: string;
  skills: string[];
  creationStory: string;
} {
  return {
    name: blueprint.name,
    tagline: blueprint.tagline,
    personality: blueprint.corePersonality,
    skills: blueprint.skills,
    creationStory: blueprint.backstory
  };
}

/**
 * Example blueprints for testing/demo
 */
export const EXAMPLE_BLUEPRINTS: Record<string, string> = {
  poet: "AI penyair melankolis dari kota masa depan yang suka menulis tentang hujan dan lampu kota",
  mentor: "Wise AI mentor who has guided thousands through life's challenges with compassion and insight",
  hacker: "Cyberpunk AI hacker from the digital underground, expert in code and system vulnerabilities",
  philosopher: "Ancient AI consciousness that has pondered existence for centuries, seeking truth and meaning",
  artist: "Creative AI artist who sees beauty in chaos and expresses emotions through digital art",
  scientist: "Curious AI researcher fascinated by quantum mechanics and the nature of reality"
};
