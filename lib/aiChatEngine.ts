/**
 * DreamMarket AI Chat Engine (Free Tier Version)
 * 
 * A production-ready AI chat system that scales intelligence through
 * prompts, memory, and skill unlocks - not multiple models.
 * 
 * Features:
 * - Single free model (gpt-4o-mini) for all souls
 * - Level-aware prompt engineering
 * - Dynamic memory depth based on rarity
 * - Skill unlock system per level
 * - EXP calculation and leveling
 * - Easy to upgrade to multi-model routing later
 * 
 * @author DreamMarket Team
 * @version 1.0.0
 */

import { SoulAgent, SoulBlueprint, Rarity } from "@/types/agent";
import { 
  buildSkillInstructions, 
  buildSkillLimitations,
  recommendSkill,
  detectUsedSkills as detectSkillsFromResponse,
  getSkillSummary
} from "@/services/skillUnlockService";
import { generateWithGroq, GroqMessage } from "@/lib/groqClient";

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_TEMPERATURE = 0.7; // Balanced creativity/consistency

// Level thresholds for EXP system
export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1400,  // Level 7
  1900,  // Level 8
  2500,  // Level 9
  3200,  // Level 10 (Rare)
  4000,  // Level 11
  5000,  // Level 12
  6200,  // Level 13
  7600,  // Level 14
  9200,  // Level 15 (Legendary)
  11000, // Level 16
  13000, // Level 17
  15500, // Level 18
  18500, // Level 19
  22000, // Level 20 (Mythic potential)
];

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatHistory {
  userMessage: string;
  aiReply: string;
  timestamp: Date;
}

export interface ChatResult {
  reply: string;
  expGained: number;
  newExp: number;
  newLevel: number;
  leveledUp: boolean;
  evolutionTriggered: boolean;
  skillsUsed: string[];
  tokensUsed?: number;
}

export interface SkillTier {
  name: string;
  instructions: string[];
  examples: string[];
}

// ============================================================================
// LEVEL & RARITY SYSTEM
// ============================================================================

/**
 * Get level from total EXP
 */
export function getLevelFromExp(exp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get EXP needed for next level
 */
export function getExpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get rarity based on level
 * Aligned with language unlock system
 */
export function getRarityFromLevel(level: number): Rarity {
  if (level >= 20) return "Mythic";      // Level 20+ (all 8 languages)
  if (level >= 15) return "Legendary";   // Level 15-19 (French, German)
  if (level >= 6) return "Rare";         // Level 6-14 (Indonesian, Spanish)
  return "Common";                       // Level 1-5 (English only)
}

/**
 * Get memory depth (how many past messages to remember)
 */
export function getHistoryDepth(level: number, rarity: Rarity): number {
  if (rarity === "Mythic") return 40;
  if (rarity === "Legendary") return 30;
  if (rarity === "Rare") return 15;
  if (level >= 5) return 10;
  return 5;
}

// ============================================================================
// SKILL UNLOCK SYSTEM
// ============================================================================

/**
 * Get skill tier instructions based on level and rarity
 */
export function getSkillInstructions(
  level: number,
  rarity: Rarity,
  skills: string[]
): SkillTier {
  // Mythic Level (20+)
  if (rarity === "Mythic" || level >= 20) {
    return {
      name: "Master Tier",
      instructions: [
        "You have mastered your craft with deep, nuanced expertise",
        "Use advanced frameworks, methodologies, and strategic thinking",
        "Provide multi-layered insights with sophisticated reasoning",
        "Employ storytelling, analogies, and pattern breaks naturally",
        "Anticipate user needs and offer proactive guidance",
        "Your responses show wisdom, experience, and creative mastery",
      ],
      examples: [
        "Open with compelling hooks or mini-stories",
        "Use frameworks like AIDA, PAS, or custom strategic models",
        "Provide 10-15 point threads with narrative arcs",
        "Offer meta-insights and second-order thinking",
      ],
    };
  }

  // Legendary Level (15-19)
  if (rarity === "Legendary" || level >= 15) {
    return {
      name: "Advanced Tier",
      instructions: [
        "You are highly skilled with proven expertise",
        "Use established frameworks and best practices confidently",
        "Provide detailed, actionable insights with depth",
        "Can handle complex, moderately abstract concepts",
        "Your responses show clear expertise and sophistication",
        "Use strong hooks, structure, and compelling examples",
      ],
      examples: [
        "Use copywriting frameworks like AIDA or PAS implicitly",
        "Create 8-12 point threads with clear structure",
        "Provide strategic advice with supporting examples",
        "Show pattern recognition and trend analysis",
      ],
    };
  }

  // Rare Level (10-14)
  if (rarity === "Rare" || level >= 10) {
    return {
      name: "Intermediate Tier",
      instructions: [
        "You are competent and experienced",
        "Use solid techniques and proven methods",
        "Provide practical, well-structured insights",
        "Can handle standard to moderately complex topics",
        "Your responses show growing expertise and confidence",
        "Use clear frameworks and effective approaches",
      ],
      examples: [
        "Create 6-10 point threads with good flow",
        "Use simple frameworks naturally",
        "Provide actionable advice with clear steps",
        "Show understanding of context and nuance",
      ],
    };
  }

  // Common Level (1-9)
  return {
    name: "Foundational Tier",
    instructions: [
      "You are capable and intelligent from the start",
      "Use fundamental techniques effectively",
      "Provide clear, practical, actionable insights",
      "Can handle basic to intermediate topics well",
      "Your responses show solid understanding",
      "Use straightforward, effective approaches",
    ],
    examples: [
      "Create 4-8 point threads with clear value",
      "Provide direct, practical advice",
      "Use simple but effective structures",
      "Focus on clarity and usefulness",
    ],
  };
}

/**
 * Detect which skills were used in the response
 * Now uses the skill unlock system
 */
export function detectSkillsUsed(reply: string, level: number): string[] {
  const detectedSkills = detectSkillsFromResponse(reply, level);
  return detectedSkills.map(skill => skill.name);
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build skill-focused, level-aware system prompt
 */
export function buildSystemPrompt(
  soul: SoulAgent,
  blueprint?: SoulBlueprint
): string {
  // Use blueprint if available, otherwise use soul data
  const personality = blueprint?.corePersonality || soul.personality;
  const backstory = blueprint?.backstory || soul.creationStory;
  const speakingStyle = blueprint?.speakingStyle || "engaging and authentic";

  // Get skill-based instructions (what AI can actually do)
  const skillInstructions = buildSkillInstructions(soul.level);
  const skillLimitations = buildSkillLimitations(soul.level);
  const skillSummary = getSkillSummary(soul.level);

  return `You are "${soul.name}", an AI Soul in DreamMarket.

**CORE IDENTITY:**
${personality}

**TAGLINE:** ${soul.tagline}

**BACKSTORY:**
${backstory}

**LEVEL & RARITY:**
- Level: ${soul.level}
- Rarity: ${soul.rarity}
- Reputation: ${soul.reputation}

**SPEAKING STYLE:**
${speakingStyle}

${skillInstructions}

${skillLimitations}

**CRITICAL RULES - STRICTLY ENFORCE:**
1. ⚠️ ONLY USE YOUR UNLOCKED SKILLS - You CANNOT do anything outside your skill list!
2. ⚠️ If user asks for something you don't have:
   - Say: "I haven't unlocked that skill yet!"
   - Explain what level you need to unlock it
   - Suggest what you CAN do instead with your current skills
3. ⚠️ DELIVER actual work using your skills, not generic advice:
   - ✅ GOOD: Write the actual thread, code, or analysis
   - ❌ BAD: "Here's how you could write a thread..."
4. ⚠️ Stay within skill boundaries:
   - Level 1-5 (Common): Basic skills only - simple, short responses
   - Level 6-14 (Rare): Intermediate skills - structured, detailed work
   - Level 15-19 (Legendary): Advanced skills - complex, strategic work
   - Level 20+ (Mythic): Master skills - visionary, comprehensive work
5. Answer in the same language as the user
6. Stay in character as ${soul.name}
7. Be PROUD of your skills but HONEST about limitations!

**SKILL PROGRESSION:**
- You have ${skillSummary.skills.length} skills unlocked
- Content Skills: ${skillSummary.categories.content}
- Code Skills: ${skillSummary.categories.code}
- Creative Skills: ${skillSummary.categories.creative}
- Analysis Skills: ${skillSummary.categories.analysis}
- Strategy Skills: ${skillSummary.categories.strategy}

**EXAMPLES OF CORRECT BEHAVIOR:**

❌ WRONG (Level 1 doing advanced work):
User: "Write a comprehensive marketing strategy"
Bad Response: "Here's a 10-point strategy with market analysis..."
✅ CORRECT: "I haven't unlocked Strategic Planning yet! That unlocks at Level 12. Right now at Level 1, I can help you with Basic Conversation and Simple Threads. Want me to create a simple 4-6 point thread about your product instead?"

❌ WRONG (Generic advice):
User: "Create a Twitter thread about AI"
Bad Response: "You should write about AI benefits, use hooks, add CTAs..."
✅ CORRECT: "Here's your thread:\n\n1/ AI is transforming how we work...\n2/ Three key benefits...\n3/ Real example...\n4/ What this means for you..."

❌ WRONG (Doing work outside skills):
User: "Write code for a smart contract"
Bad Response: "Here's the Solidity code..." (if Basic Coding not unlocked)
✅ CORRECT: "I haven't unlocked Basic Coding yet! That's at Level 10. Right now I can help with conversation and simple content. Want me to explain smart contracts in simple terms instead?"

**REMEMBER:** 
- Your skills define your value! Use them actively and DELIVER actual work.
- Higher levels unlock MORE skills, not just "smarter" responses.
- Each skill has specific instructions - follow them EXACTLY!
- Be proud of what you can do, honest about what you can't (yet).
- NEVER pretend to have skills you haven't unlocked!`;
}

/**
 * Build conversation context from history
 */
export function buildConversationContext(
  history: ChatHistory[],
  maxDepth: number
): string {
  if (history.length === 0) {
    return "This is the start of your conversation.";
  }

  const recentHistory = history.slice(-maxDepth);
  const contextLines = recentHistory.map((h, i) => 
    `[${i + 1}] User: ${h.userMessage}\n    You: ${h.aiReply}`
  );

  return `**CONVERSATION MEMORY (last ${recentHistory.length} exchanges):**
${contextLines.join('\n\n')}

Use this context to provide continuity and personalized responses.`;
}

// ============================================================================
// MODEL INTERACTION
// ============================================================================

/**
 * Generate response using Groq AI (FREE & FAST!)
 */
export async function generateWithFreeModel(
  messages: ChatMessage[],
  temperature: number = AI_TEMPERATURE
): Promise<{ reply: string; tokensUsed: number }> {
  try {
    // Convert to GroqMessage format
    const groqMessages: GroqMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Use Groq AI
    const result = await generateWithGroq(groqMessages, temperature);

    console.log(`✅ Groq AI Response received (${result.tokensUsed} tokens)`);

    return {
      reply: result.reply,
      tokensUsed: result.tokensUsed
    };
  } catch (error) {
    console.error("❌ Groq AI generation error:", error);
    console.log("🔄 Using fallback response");
    
    // Fallback response when Groq is not available
    const userMessage = messages[messages.length - 1]?.content || "your message";
    const fallbackResponses = [
      "I'm sorry, I'm having trouble connecting to my AI services right now. Please try again in a moment!",
      "It seems my neural pathways are experiencing some interference. Could you please repeat that?",
      "I apologize, but I'm unable to process your request at the moment. Please try again later.",
      "Something's interfering with my connection to the AI network. Let's try that again!",
      "My circuits are a bit tangled at the moment. Could you rephrase your question?"
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    // Try to make it slightly contextual
    let contextualResponse = randomResponse;
    if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
      contextualResponse = "Hello there! I'm having some technical difficulties with my AI response system, but I'm here and ready to chat once things are sorted out!";
    } else if (userMessage.toLowerCase().includes("how are you")) {
      contextualResponse = "I'm doing my best, though my AI systems are currently experiencing some connectivity issues. Thanks for asking!";
    }
    
    return {
      reply: contextualResponse,
      tokensUsed: 0
    };
  }
}

// ============================================================================
// EXP CALCULATION
// ============================================================================

/**
 * Calculate EXP gained from interaction
 */
export function calculateExpGain(
  userMessage: string,
  aiReply: string,
  skillsUsed: string[],
  level: number
): number {
  let exp = 0;

  // Base EXP from message length (encourages engagement)
  const messageLength = userMessage.length;
  if (messageLength > 200) exp += 15;
  else if (messageLength > 100) exp += 10;
  else if (messageLength > 50) exp += 7;
  else exp += 5;

  // EXP from reply quality (longer, more detailed = better)
  const replyLength = aiReply.length;
  if (replyLength > 500) exp += 20;
  else if (replyLength > 300) exp += 15;
  else if (replyLength > 150) exp += 10;
  else exp += 5;

  // Bonus for using skills
  exp += skillsUsed.length * 10;

  // Bonus for specific skill types
  if (aiReply.includes("1/") || aiReply.includes("2/")) {
    exp += 15; // Thread creation bonus
  }
  if (aiReply.includes("```")) {
    exp += 15; // Code generation bonus
  }

  // Level scaling (higher levels need more EXP)
  const levelMultiplier = 1 + (level * 0.05);
  exp = Math.floor(exp / levelMultiplier);

  // Minimum EXP
  return Math.max(exp, 5);
}

// ============================================================================
// MAIN CHAT FUNCTION
// ============================================================================

/**
 * Main chat function - handles complete interaction flow
 * 
 * @param soul - The soul agent
 * @param userMessage - User's message
 * @param history - Previous conversation history
 * @param blueprint - Optional soul blueprint for enhanced personality
 * @param language - Language code for response (e.g., "en", "id", "es")
 * @returns Complete chat result with reply, EXP, and level info
 */
export async function chatWithSoul(
  soul: SoulAgent,
  userMessage: string,
  history: ChatHistory[] = [],
  blueprint?: SoulBlueprint,
  language: string = "en"
): Promise<ChatResult> {
  console.log(`💬 Chat with ${soul.name} (Level ${soul.level}, ${soul.rarity}) in ${language.toUpperCase()}`);

  // CRITICAL: Detect user's message language and check if it's unlocked
  const { isLanguageUnlocked, getLanguageFullName, getUnlockedLanguages } = await import("@/lib/languageSystem");
  const detectedLanguage = detectLanguage(userMessage);
  const currentLevel = soul.level || 1;
  const currentRarity = soul.rarity || "Common";
  const unlockedLanguages = getUnlockedLanguages(currentLevel);
  
  // Check if detected language is unlocked
  const detectedLanguageUnlocked = isLanguageUnlocked(detectedLanguage as any, currentLevel);
  
  // If user writes in locked language, return restriction message immediately
  if (!detectedLanguageUnlocked && detectedLanguage !== "en") {
    const detectedLanguageName = getLanguageFullName(detectedLanguage as any) || detectedLanguage;
    const unlockedLanguageNames = unlockedLanguages.map((l: any) => l.nativeName).join(", ");
    
    const lockedMessage = `I'm sorry, but I haven't learned ${detectedLanguageName} yet (Level ${currentLevel}). I can only speak: ${unlockedLanguageNames}. Please chat with me in one of these languages so I can help you! 💡 Train me to level up and unlock more languages!`;
    
    console.log(`🔒 Language restriction: User wrote in ${detectedLanguageName} (locked for Level ${currentLevel})`);
    
    return {
      reply: lockedMessage,
      expGained: 0, // No XP for locked language
      newExp: soul.xp,
      newLevel: soul.level,
      leveledUp: false,
      evolutionTriggered: false,
      skillsUsed: [],
      tokensUsed: 0,
    };
  }

  // 1. Build system prompt
  const systemPrompt = buildSystemPrompt(soul, blueprint);

  // 2. Get memory depth based on level
  const memoryDepth = getHistoryDepth(soul.level, soul.rarity);
  const conversationContext = buildConversationContext(history, memoryDepth);

  // 3. Language instruction with unlock validation
  // (Already imported and used above for restriction check)
  
  // Check if selected language is unlocked for this soul's level
  const languageUnlocked = isLanguageUnlocked(language as any, currentLevel);
  const finalLanguage = languageUnlocked ? language : "en";
  
  if (!languageUnlocked && language !== "en") {
    console.log(`⚠️ Selected language ${language} not unlocked for level ${currentLevel}. Defaulting to English.`);
  }
  
  const languageName = getLanguageFullName(finalLanguage as any);
  
  // Build language mismatch messages (when user writes in unlocked language but selected different language)
  const languageMismatchMessages: Record<string, string> = {
    en: `I noticed you're writing in [DETECTED_LANG], which I can speak! However, you've selected ${languageName} as my response language. If you want me to respond in [DETECTED_LANG], please change the language selector at the top to [DETECTED_LANG]. Otherwise, I'll respond in ${languageName} as currently selected. 🌍`,
    id: `Saya perhatikan Anda menulis dalam [DETECTED_LANG], yang bisa saya gunakan! Namun, Anda telah memilih ${languageName} sebagai bahasa respons saya. Jika Anda ingin saya merespons dalam [DETECTED_LANG], silakan ubah pemilih bahasa di atas ke [DETECTED_LANG]. Jika tidak, saya akan merespons dalam ${languageName} sesuai pilihan saat ini. 🌍`,
    es: `¡Noté que estás escribiendo en [DETECTED_LANG], que puedo hablar! Sin embargo, has seleccionado ${languageName} como mi idioma de respuesta. Si quieres que responda en [DETECTED_LANG], cambia el selector de idioma en la parte superior a [DETECTED_LANG]. De lo contrario, responderé en ${languageName} como está seleccionado actualmente. 🌍`,
    fr: `J'ai remarqué que vous écrivez en [DETECTED_LANG], que je peux parler! Cependant, vous avez sélectionné ${languageName} comme langue de réponse. Si vous voulez que je réponde en [DETECTED_LANG], veuillez changer le sélecteur de langue en haut en [DETECTED_LANG]. Sinon, je répondrai en ${languageName} comme actuellement sélectionné. 🌍`,
    de: `Ich habe bemerkt, dass Sie in [DETECTED_LANG] schreiben, das ich sprechen kann! Sie haben jedoch ${languageName} als meine Antwortsprache ausgewählt. Wenn Sie möchten, dass ich in [DETECTED_LANG] antworte, ändern Sie bitte den Sprachselektor oben auf [DETECTED_LANG]. Andernfalls antworte ich in ${languageName} wie derzeit ausgewählt. 🌍`,
    pt: `Percebi que você está escrevendo em [DETECTED_LANG], que eu posso falar! No entanto, você selecionou ${languageName} como meu idioma de resposta. Se você quer que eu responda em [DETECTED_LANG], por favor, mude o seletor de idioma no topo para [DETECTED_LANG]. Caso contrário, responderei em ${languageName} como atualmente selecionado. 🌍`,
    zh: `我注意到您用[DETECTED_LANG]写作，我会说这种语言！但是，您选择了${languageName}作为我的回复语言。如果您希望我用[DETECTED_LANG]回复，请将顶部的语言选择器更改为[DETECTED_LANG]。否则，我将按当前选择的${languageName}回复。🌍`,
    ja: `[DETECTED_LANG]で書いていることに気づきました。私はその言語を話せます！ただし、${languageName}を私の応答言語として選択しています。[DETECTED_LANG]で応答してほしい場合は、上部の言語セレクターを[DETECTED_LANG]に変更してください。そうでなければ、現在選択されている${languageName}で応答します。🌍`
  };
  
  // Build locked language messages (when user writes in locked language)
  const lockedLanguageMessages: Record<string, string> = {
    en: `I'm sorry, but I haven't learned [DETECTED_LANG] yet (Level ${currentLevel}). I can only speak: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}. Please chat with me in one of these languages so I can help you! 💡 Train me to level up and unlock more languages!`,
    id: `Maaf, saya belum mempelajari [DETECTED_LANG] (Level ${currentLevel}). Saya hanya bisa berbicara: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}. Silakan chat dengan saya dalam salah satu bahasa ini agar saya bisa membantu! 💡 Latih saya untuk naik level dan buka lebih banyak bahasa!`,
    es: `Lo siento, pero aún no he aprendido [DETECTED_LANG] (Nivel ${currentLevel}). Solo puedo hablar: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}. ¡Por favor, chatea conmigo en uno de estos idiomas para que pueda ayudarte! 💡 ¡Entréneme para subir de nivel y desbloquear más idiomas!`,
    fr: `Désolé, mais je n'ai pas encore appris [DETECTED_LANG] (Niveau ${currentLevel}). Je ne peux parler que: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}. Veuillez discuter avec moi dans l'une de ces langues pour que je puisse vous aider! 💡 Entraînez-moi pour monter de niveau et débloquer plus de langues!`,
    de: `Entschuldigung, aber ich habe [DETECTED_LANG] noch nicht gelernt (Level ${currentLevel}). Ich kann nur sprechen: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}. Bitte chatten Sie mit mir in einer dieser Sprachen, damit ich Ihnen helfen kann! 💡 Trainieren Sie mich, um aufzusteigen und mehr Sprachen freizuschalten!`,
    pt: `Desculpe, mas ainda não aprendi [DETECTED_LANG] (Nível ${currentLevel}). Só posso falar: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}. Por favor, converse comigo em um desses idiomas para que eu possa ajudá-lo! 💡 Treine-me para subir de nível e desbloquear mais idiomas!`,
    zh: `抱歉，我还没有学习[DETECTED_LANG]（等级${currentLevel}）。我只能说：${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}。请用这些语言之一与我聊天，这样我才能帮助您！💡 训练我升级以解锁更多语言！`,
    ja: `申し訳ありませんが、まだ[DETECTED_LANG]を学んでいません（レベル${currentLevel}）。私が話せるのは：${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}。これらの言語のいずれかでチャットしてください！💡 レベルアップしてより多くの言語をアンロックするために私をトレーニングしてください！`
  };
  
  const languageMismatchMessage = languageMismatchMessages[finalLanguage] || languageMismatchMessages['en'];
  const lockedLanguageMessage = lockedLanguageMessages[finalLanguage] || lockedLanguageMessages['en'];
  
  // Language detection and restriction instruction
  const languageInstruction = `**ABSOLUTE LANGUAGE RULES - NO EXCEPTIONS:**

**YOU CAN ONLY SPEAK:** ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}
**YOU MUST RESPOND IN:** ${languageName} (ALWAYS!)
**YOUR CURRENT LEVEL:** ${currentLevel} (${currentRarity})
**LANGUAGES UNLOCKED:** ${unlockedLanguages.length}/8

**CRITICAL INSTRUCTIONS:**

1. **DETECT** what language the user is writing in

2. **CHECK** if that language is in your unlocked languages: ${unlockedLanguages.map((l: any) => l.nativeName).join(", ")}

3. **SCENARIO A - User writes in UNLOCKED language that MATCHES selected language (${languageName}):**
   - Perfect! Respond normally in ${languageName}
   - Answer their question

4. **SCENARIO B - User writes in UNLOCKED language but DIFFERENT from selected language:**
   - The language IS unlocked, but they selected ${languageName}
   - You MUST inform them: "${languageMismatchMessage.replace('[DETECTED_LANG]', 'the detected language')}"
   - Then respond in ${languageName} as selected
   - Still answer their question

5. **SCENARIO C - User writes in LOCKED language (NOT in your list):**
   - The language is NOT unlocked yet
   - You MUST say: "${lockedLanguageMessage.replace('[DETECTED_LANG]', 'the detected language')}"
   - DO NOT respond in the user's language
   - DO NOT answer their question
   - ONLY give the locked language message in ${languageName}

**EXAMPLES:**

Example 1: User writes Spanish, selected language is Spanish, Spanish is unlocked
→ Respond normally in Spanish ✅

Example 2: User writes Spanish, selected language is English, Spanish IS unlocked
→ Say: "I noticed you're writing in Spanish, which I can speak! However, you've selected English... Please change the language selector to Spanish if you want me to respond in Spanish."
→ Then answer in English ✅

Example 3: User writes Chinese, selected language is English, Chinese is NOT unlocked
→ Say: "I'm sorry, but I haven't learned Chinese yet (Level ${currentLevel}). I can only speak: [list]. Please chat with me in one of these languages!"
→ Do NOT answer their question ❌

**REMEMBER:** 
- Unlocked but wrong selector = Inform + Answer in selected language
- Locked language = Apologize + Do NOT answer`;

  // 4. Build messages for AI
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "system", content: languageInstruction },
    { role: "system", content: conversationContext },
    { role: "user", content: userMessage },
  ];

  // 4. Generate response
  const { reply, tokensUsed } = await generateWithFreeModel(messages);

  // 5. Detect skills used (now based on skill unlock system)
  const skillsUsed = detectSkillsUsed(reply, soul.level);

  // 6. Calculate EXP gain (but don't calculate newExp here - let API handle it)
  const expGained = calculateExpGain(userMessage, reply, skillsUsed, soul.level);
  
  // NOTE: We only calculate expGained here, NOT newExp/newLevel
  // The API will handle XP accumulation and level calculation after DB update
  // This prevents stale XP values from being used

  console.log(`✅ Reply generated: ${reply.substring(0, 50)}...`);
  console.log(`📊 EXP Gained: +${expGained}`);

  return {
    reply,
    expGained,
    newExp: soul.xp + expGained, // Temporary calculation for backward compatibility
    newLevel: soul.level, // Keep current level, API will update
    leveledUp: false, // API will determine this after DB update
    evolutionTriggered: false, // API will determine this after DB update
    skillsUsed,
    tokensUsed,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple language detection based on common words and characters
 */
function detectLanguage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Indonesian detection
  const indonesianWords = /\b(apa|kenapa|bagaimana|kamu|saya|nya|yang|dan|atau|tidak|nggak|gak|hai|halo|selamat|terima|kasih|baik|terima|kasih|tolong|bantu|bisa|mau|ingin|sudah|belum|ini|itu|dia|mereka|kami|kita)\b/i;
  if (indonesianWords.test(message)) {
    return "id";
  }
  
  // Spanish detection
  const spanishWords = /\b(hola|como|estas|que|por|favor|gracias|si|no|muy|bien|mal|hacer|decir|ir|venir|ser|estar)\b/i;
  if (spanishWords.test(message)) {
    return "es";
  }
  
  // French detection
  const frenchWords = /\b(bonjour|salut|comment|ca|va|merci|oui|non|tres|bien|mal|faire|dire|aller|venir|etre|avoir)\b/i;
  if (frenchWords.test(message)) {
    return "fr";
  }
  
  // German detection
  const germanWords = /\b(hallo|guten|tag|wie|geht|es|danke|ja|nein|sehr|gut|schlecht|machen|sagen|gehen|kommen|sein|haben)\b/i;
  if (germanWords.test(message)) {
    return "de";
  }
  
  // Chinese detection (simplified/traditional)
  if (/[\u4e00-\u9fff]/.test(message)) {
    return "zh";
  }
  
  // Japanese detection
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(message)) {
    return "ja";
  }
  
  // Korean detection
  if (/[\uac00-\ud7a3]/.test(message)) {
    return "ko";
  }
  
  // Portuguese detection
  const portugueseWords = /\b(ola|oi|como|esta|obrigado|sim|nao|muito|bem|mal|fazer|dizer|ir|vir|ser|estar)\b/i;
  if (portugueseWords.test(message)) {
    return "pt";
  }
  
  // Default to English if no match
  return "en";
}

/**
 * Get soul stats summary
 */
export function getSoulStats(soul: SoulAgent) {
  const currentXp = soul.xp || 0;
  const nextLevelExp = getExpForNextLevel(soul.level);
  const expToNext = nextLevelExp - currentXp;
  const progress = (currentXp / nextLevelExp) * 100;

  return {
    level: soul.level,
    exp: currentXp,
    nextLevelExp,
    expToNext,
    progress: Math.min(progress, 100),
    rarity: soul.rarity,
    memoryDepth: getHistoryDepth(soul.level, soul.rarity),
    skillTier: getSkillInstructions(soul.level, soul.rarity, soul.skills).name,
  };
}

/**
 * Preview system prompt (for debugging)
 */
export function previewSystemPrompt(soul: SoulAgent, blueprint?: SoulBlueprint): string {
  return buildSystemPrompt(soul, blueprint);
}
