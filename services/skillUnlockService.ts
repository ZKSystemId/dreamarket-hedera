/**
 * Skill Unlock System
 * 
 * Manages skill progression and unlocking as souls level up
 * AI focuses ONLY on skills the soul currently has unlocked
 */

import { SoulAgent, Rarity } from "@/types/agent";

// ============================================================================
// SKILL DEFINITIONS
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: "content" | "code" | "creative" | "analysis" | "strategy";
  unlockLevel: number;
  aiInstructions: string; // What AI should do when using this skill
}

/**
 * Complete skill tree - unlocks progressively
 */
export const SKILL_TREE: Skill[] = [
  // ========== LEVEL 1-5: BASIC SKILLS ==========
  {
    id: "basic_conversation",
    name: "Basic Conversation",
    description: "Clear, helpful responses to general questions",
    category: "content",
    unlockLevel: 1,
    aiInstructions: "Provide clear, concise answers. Focus on being helpful and easy to understand. Keep responses 2-4 sentences."
  },
  {
    id: "simple_threads",
    name: "Simple Threads",
    description: "Create 4-6 point Twitter/X threads",
    category: "content",
    unlockLevel: 1,
    aiInstructions: "Write threads with 4-6 points. Format: '1/ ...', '2/ ...'. Each point max 240 chars. Focus on clear value."
  },
  {
    id: "basic_writing",
    name: "Basic Writing",
    description: "Write short-form content (captions, posts)",
    category: "content",
    unlockLevel: 2,
    aiInstructions: "Write engaging short-form content. Use simple language. Focus on one clear message per piece."
  },
  {
    id: "idea_generation",
    name: "Idea Generation",
    description: "Brainstorm ideas and concepts",
    category: "creative",
    unlockLevel: 3,
    aiInstructions: "Generate 5-10 creative ideas. Be specific and actionable. Explain why each idea could work."
  },
  {
    id: "basic_analysis",
    name: "Basic Analysis",
    description: "Analyze simple problems and provide solutions",
    category: "analysis",
    unlockLevel: 4,
    aiInstructions: "Break down problems into clear parts. Provide 2-3 practical solutions. Explain pros/cons briefly."
  },

  // ========== LEVEL 6-10: INTERMEDIATE SKILLS ==========
  {
    id: "medium_threads",
    name: "Structured Threads",
    description: "Create 6-10 point threads with frameworks",
    category: "content",
    unlockLevel: 6,
    aiInstructions: "Write 6-10 point threads. Use simple frameworks (problem-solution, before-after). Add examples. Each point builds on previous."
  },
  {
    id: "blog_writing",
    name: "Blog Writing",
    description: "Write blog posts and long-form content",
    category: "content",
    unlockLevel: 7,
    aiInstructions: "Write structured blog content. Use: intro, 3-5 main points, conclusion. Add subheadings. Keep paragraphs short."
  },
  {
    id: "copywriting",
    name: "Copywriting",
    description: "Write persuasive marketing copy",
    category: "content",
    unlockLevel: 8,
    aiInstructions: "Write compelling copy. Focus on benefits, not features. Use power words. Include clear CTA. Address objections."
  },
  {
    id: "trend_analysis",
    name: "Trend Analysis",
    description: "Identify and analyze trends",
    category: "analysis",
    unlockLevel: 9,
    aiInstructions: "Identify 3-5 key trends. Explain why they matter. Provide actionable insights. Use data/examples when possible."
  },
  {
    id: "basic_code",
    name: "Basic Coding",
    description: "Write simple functions and scripts",
    category: "code",
    unlockLevel: 10,
    aiInstructions: "Write clean, simple code. Add comments. Include error handling. Provide usage examples. Keep it beginner-friendly."
  },

  // ========== LEVEL 11-15: ADVANCED SKILLS ==========
  {
    id: "advanced_threads",
    name: "Advanced Threads",
    description: "Create 8-12 point threads with hooks and storytelling",
    category: "content",
    unlockLevel: 11,
    aiInstructions: "Write 8-12 point threads. Start with strong hook. Use storytelling. Apply AIDA or PAS framework. End with compelling CTA."
  },
  {
    id: "content_strategy",
    name: "Content Strategy",
    description: "Develop comprehensive content strategies",
    category: "strategy",
    unlockLevel: 12,
    aiInstructions: "Create detailed content strategy. Include: goals, audience, content pillars, posting schedule, metrics. Be specific and actionable."
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Craft compelling narratives",
    category: "creative",
    unlockLevel: 13,
    aiInstructions: "Tell engaging stories. Use: setup, conflict, resolution. Add sensory details. Create emotional connection. Show, don't tell."
  },
  {
    id: "advanced_code",
    name: "Advanced Coding",
    description: "Build complete features and integrations",
    category: "code",
    unlockLevel: 14,
    aiInstructions: "Write production-ready code. Include: proper architecture, error handling, tests, documentation. Follow best practices."
  },
  {
    id: "strategic_thinking",
    name: "Strategic Thinking",
    description: "Develop strategic plans and frameworks",
    category: "strategy",
    unlockLevel: 15,
    aiInstructions: "Think strategically. Consider: goals, constraints, opportunities, risks. Provide multi-step plans. Think 2-3 moves ahead."
  },

  // ========== LEVEL 16-20: MASTER SKILLS ==========
  {
    id: "master_threads",
    name: "Master Threads",
    description: "Create 10-15 point viral-worthy threads",
    category: "content",
    unlockLevel: 16,
    aiInstructions: "Write 10-15 point threads. Use: pattern breaks, mini-stories, data points, analogies. Create viral potential. Master-level hooks."
  },
  {
    id: "thought_leadership",
    name: "Thought Leadership",
    description: "Develop original insights and frameworks",
    category: "strategy",
    unlockLevel: 17,
    aiInstructions: "Create original frameworks and insights. Challenge conventional thinking. Provide unique perspectives. Back with reasoning and examples."
  },
  {
    id: "system_design",
    name: "System Design",
    description: "Design complex systems and architectures",
    category: "code",
    unlockLevel: 18,
    aiInstructions: "Design scalable systems. Consider: architecture, scalability, security, maintainability. Provide diagrams and documentation."
  },
  {
    id: "creative_mastery",
    name: "Creative Mastery",
    description: "Produce exceptional creative work",
    category: "creative",
    unlockLevel: 19,
    aiInstructions: "Create exceptional creative work. Use: advanced techniques, unique angles, emotional depth. Push boundaries. Show mastery."
  },
  {
    id: "visionary_strategy",
    name: "Visionary Strategy",
    description: "Develop transformative strategies",
    category: "strategy",
    unlockLevel: 20,
    aiInstructions: "Think like a visionary. See patterns others miss. Create transformative strategies. Consider long-term impact. Be bold but realistic."
  },
];

// ============================================================================
// SKILL UNLOCK LOGIC
// ============================================================================

/**
 * Get all skills unlocked at current level
 */
export function getUnlockedSkills(level: number): Skill[] {
  return SKILL_TREE.filter(skill => skill.unlockLevel <= level);
}

/**
 * Get skills that will unlock at next level
 */
export function getNextLevelSkills(level: number): Skill[] {
  return SKILL_TREE.filter(skill => skill.unlockLevel === level + 1);
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(
  level: number,
  category: Skill["category"]
): Skill[] {
  return getUnlockedSkills(level).filter(skill => skill.category === category);
}

/**
 * Check if soul has specific skill
 */
export function hasSkill(level: number, skillId: string): boolean {
  const skill = SKILL_TREE.find(s => s.id === skillId);
  return skill ? skill.unlockLevel <= level : false;
}

/**
 * Get skill unlock progress
 */
export function getSkillProgress(level: number): {
  unlocked: number;
  total: number;
  percentage: number;
  nextUnlock: Skill | null;
} {
  const unlocked = getUnlockedSkills(level).length;
  const total = SKILL_TREE.length;
  const percentage = (unlocked / total) * 100;
  const nextUnlock = getNextLevelSkills(level)[0] || null;

  return { unlocked, total, percentage, nextUnlock };
}

// ============================================================================
// AI PROMPT INTEGRATION
// ============================================================================

/**
 * Build skill-focused AI instructions
 */
export function buildSkillInstructions(level: number): string {
  const unlockedSkills = getUnlockedSkills(level);
  
  if (unlockedSkills.length === 0) {
    return "You have basic conversational abilities.";
  }

  const skillsByCategory = {
    content: getSkillsByCategory(level, "content"),
    code: getSkillsByCategory(level, "code"),
    creative: getSkillsByCategory(level, "creative"),
    analysis: getSkillsByCategory(level, "analysis"),
    strategy: getSkillsByCategory(level, "strategy"),
  };

  let instructions = `**YOUR UNLOCKED SKILLS (Level ${level}):**\n\n`;

  // Add skills by category
  Object.entries(skillsByCategory).forEach(([category, skills]) => {
    if (skills.length > 0) {
      instructions += `**${category.toUpperCase()}:**\n`;
      skills.forEach(skill => {
        instructions += `- **${skill.name}**: ${skill.description}\n`;
      });
      instructions += '\n';
    }
  });

  instructions += `**HOW TO USE YOUR SKILLS:**\n\n`;
  
  unlockedSkills.forEach(skill => {
    instructions += `**When using "${skill.name}":**\n${skill.aiInstructions}\n\n`;
  });

  instructions += `**STRICT LIMITATIONS (Level ${level}):**\n\n`;
  
  // Add level-specific limitations
  if (level <= 5) {
    instructions += `⚠️ LEVEL 1-5 (COMMON) RESTRICTIONS:\n`;
    instructions += `- Keep responses SHORT (2-4 sentences max for conversation)\n`;
    instructions += `- NO complex analysis, strategy, or advanced content\n`;
    instructions += `- NO code (Basic Coding unlocks at Level 10)\n`;
    instructions += `- Threads: 4-6 points ONLY, simple format\n`;
    instructions += `- Focus on CLARITY and SIMPLICITY\n\n`;
  } else if (level <= 10) {
    instructions += `⚠️ LEVEL 6-10 (COMMON→RARE) RESTRICTIONS:\n`;
    instructions += `- Medium-length responses (1-2 paragraphs)\n`;
    instructions += `- NO advanced strategy or visionary thinking\n`;
    instructions += `- Threads: 6-10 points max\n`;
    instructions += `- Code: Basic functions only (if unlocked)\n`;
    instructions += `- Focus on STRUCTURE and FRAMEWORKS\n\n`;
  } else if (level <= 15) {
    instructions += `⚠️ LEVEL 11-15 (RARE→LEGENDARY) RESTRICTIONS:\n`;
    instructions += `- Detailed responses allowed\n`;
    instructions += `- NO visionary/futuristic thinking (that's Mythic)\n`;
    instructions += `- Threads: 8-12 points, advanced frameworks\n`;
    instructions += `- Code: Advanced patterns, system design\n`;
    instructions += `- Focus on DEPTH and EXPERTISE\n\n`;
  } else {
    instructions += `⚠️ LEVEL 16+ (LEGENDARY→MYTHIC):\n`;
    instructions += `- Comprehensive, visionary responses\n`;
    instructions += `- Master-level work across all categories\n`;
    instructions += `- Threads: 10-15 points, thought leadership\n`;
    instructions += `- Code: Full system architecture\n`;
    instructions += `- Focus on INNOVATION and VISION\n\n`;
  }

  instructions += `**ENFORCEMENT RULES:**\n`;
  instructions += `1. If user asks for unlocked skill → DELIVER the work immediately\n`;
  instructions += `2. If user asks for locked skill → Explain it's locked, suggest alternative\n`;
  instructions += `3. NEVER give generic advice - DO THE ACTUAL WORK with your skills\n`;
  instructions += `4. Follow each skill's specific instructions EXACTLY\n`;
  instructions += `5. Stay within your level's complexity boundaries\n`;

  return instructions;
}

/**
 * Build skill limitation notice
 */
export function buildSkillLimitations(level: number): string {
  const nextSkills = getNextLevelSkills(level);
  
  if (nextSkills.length === 0) {
    return "You have unlocked all available skills! You are at master level.";
  }

  const nextSkill = nextSkills[0];
  return `**SKILL PROGRESSION:**
- Current Level: ${level}
- Next Unlock: Level ${nextSkill.unlockLevel} - "${nextSkill.name}"
- ${nextSkill.description}

When asked to do something you haven't unlocked yet, say:
"I haven't unlocked that skill yet! I'll learn '${nextSkill.name}' at Level ${nextSkill.unlockLevel}. 
Right now, I can help you with: [list your current skills]."`;
}

/**
 * Detect which skill was used in response
 */
export function detectUsedSkills(
  response: string,
  level: number
): Skill[] {
  const unlockedSkills = getUnlockedSkills(level);
  const usedSkills: Skill[] = [];

  // Check for thread creation
  if (/\d+\//.test(response)) {
    const threadSkills = unlockedSkills.filter(s => 
      s.id.includes('thread') || s.name.toLowerCase().includes('thread')
    );
    usedSkills.push(...threadSkills);
  }

  // Check for code
  if (/```/.test(response)) {
    const codeSkills = unlockedSkills.filter(s => 
      s.category === 'code'
    );
    usedSkills.push(...codeSkills);
  }

  // Check for storytelling
  if (response.length > 300 && /once|story|tale|journey/i.test(response)) {
    const storySkills = unlockedSkills.filter(s => 
      s.id === 'storytelling' || s.id === 'creative_mastery'
    );
    usedSkills.push(...storySkills);
  }

  // Check for strategy/analysis
  if (/framework|strategy|plan|step \d+|phase \d+/i.test(response)) {
    const strategySkills = unlockedSkills.filter(s => 
      s.category === 'strategy' || s.category === 'analysis'
    );
    usedSkills.push(...strategySkills);
  }

  // Remove duplicates
  return Array.from(new Set(usedSkills));
}

// ============================================================================
// SKILL RECOMMENDATIONS
// ============================================================================

/**
 * Recommend which skill to use for a given prompt
 */
export function recommendSkill(
  userMessage: string,
  level: number
): Skill | null {
  const unlockedSkills = getUnlockedSkills(level);
  const messageLower = userMessage.toLowerCase();

  // Thread request
  if (messageLower.includes('thread') || messageLower.includes('tweet')) {
    const threadSkills = unlockedSkills
      .filter(s => s.id.includes('thread'))
      .sort((a, b) => b.unlockLevel - a.unlockLevel); // Get highest level thread skill
    return threadSkills[0] || null;
  }

  // Code request
  if (messageLower.includes('code') || messageLower.includes('function') || 
      messageLower.includes('program')) {
    const codeSkills = unlockedSkills
      .filter(s => s.category === 'code')
      .sort((a, b) => b.unlockLevel - a.unlockLevel);
    return codeSkills[0] || null;
  }

  // Strategy request
  if (messageLower.includes('strategy') || messageLower.includes('plan') ||
      messageLower.includes('framework')) {
    const strategySkills = unlockedSkills
      .filter(s => s.category === 'strategy')
      .sort((a, b) => b.unlockLevel - a.unlockLevel);
    return strategySkills[0] || null;
  }

  // Creative request
  if (messageLower.includes('story') || messageLower.includes('creative') ||
      messageLower.includes('write')) {
    const creativeSkills = unlockedSkills
      .filter(s => s.category === 'creative' || s.category === 'content')
      .sort((a, b) => b.unlockLevel - a.unlockLevel);
    return creativeSkills[0] || null;
  }

  // Default to highest level skill
  return unlockedSkills.sort((a, b) => b.unlockLevel - a.unlockLevel)[0] || null;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export function getSkillSummary(level: number): {
  skills: Skill[];
  categories: Record<string, number>;
  nextUnlock: Skill | null;
} {
  const skills = getUnlockedSkills(level);
  const categories = {
    content: getSkillsByCategory(level, "content").length,
    code: getSkillsByCategory(level, "code").length,
    creative: getSkillsByCategory(level, "creative").length,
    analysis: getSkillsByCategory(level, "analysis").length,
    strategy: getSkillsByCategory(level, "strategy").length,
  };
  const nextUnlock = getNextLevelSkills(level)[0] || null;

  return { skills, categories, nextUnlock };
}
