/**
 * AI Service
 * Handles AI-powered personality generation and chat interactions
 * 
 * Current implementation: MOCK/STUB with coherent pseudo-random content
 * TODO: Replace with real AI provider (OpenAI, Claude, etc.)
 */

import {
  Soul,
  Rarity,
  AIGeneratePersonalityInput,
  AIGeneratePersonalityResult,
  AIGenerateChatPreviewInput,
  AIGenerateChatPreviewResult,
} from '../types';

export interface IAIService {
  /**
   * Generate personality, creation story, and skills from a prompt
   */
  generatePersonalityFromPrompt(
    input: AIGeneratePersonalityInput
  ): Promise<AIGeneratePersonalityResult>;

  /**
   * Generate a chat preview for a soul (sample conversation)
   */
  generateChatPreview(input: AIGenerateChatPreviewInput): Promise<AIGenerateChatPreviewResult>;

  /**
   * Generate a response from a soul based on its personality
   */
  generateSoulResponse(soul: Soul, userMessage: string): Promise<string>;

  /**
   * Analyze and suggest fusion traits for two parent souls
   */
  suggestFusionTraits(parentA: Soul, parentB: Soul): Promise<{
    personality: string;
    skills: string[];
    creationStory: string;
  }>;
}

/**
 * Mock implementation of AI Service
 * Uses templates and pseudo-random generation for coherent results
 */
export class AIService implements IAIService {
  private readonly processingDelay = 1200; // Simulate AI processing time

  /**
   * Generate personality from prompt
   */
  async generatePersonalityFromPrompt(
    input: AIGeneratePersonalityInput
  ): Promise<AIGeneratePersonalityResult> {
    console.log('[AIService] Generating personality from prompt:', input.prompt);

    await this.delay(this.processingDelay);

    const rarity = input.rarity || 'Common';
    const personality = this.generatePersonality(input.prompt, rarity);
    const creationStory = this.generateCreationStory(input.prompt, rarity);
    const suggestedSkills = this.generateSkills(input.prompt, rarity, input.skills);

    console.log('[AIService] Generated personality successfully');

    return {
      personality,
      creationStory,
      suggestedSkills,
    };
  }

  /**
   * Generate chat preview
   */
  async generateChatPreview(
    input: AIGenerateChatPreviewInput
  ): Promise<AIGenerateChatPreviewResult> {
    console.log('[AIService] Generating chat preview for soul:', input.soul.name);

    await this.delay(800);

    const messageCount = input.messageCount || 4;
    const messages = this.generateConversation(input.soul, messageCount);

    return { messages };
  }

  /**
   * Generate soul response to user message
   */
  async generateSoulResponse(soul: Soul, userMessage: string): Promise<string> {
    console.log('[AIService] Generating response for:', soul.name, 'to:', userMessage);

    await this.delay(1000);

    // Simple template-based response
    const responses = this.getResponseTemplates(soul);
    const response = responses[Math.floor(Math.random() * responses.length)];

    return response.replace('{user_message}', userMessage);
  }

  /**
   * Suggest fusion traits
   */
  async suggestFusionTraits(parentA: Soul, parentB: Soul): Promise<{
    personality: string;
    skills: string[];
    creationStory: string;
  }> {
    console.log('[AIService] Suggesting fusion traits for:', parentA.name, '+', parentB.name);

    await this.delay(this.processingDelay);

    // Combine personalities
    const personality = this.fusPersonalities(parentA, parentB);
    
    // Merge and enhance skills
    const skills = this.fuseSkills(parentA.skills, parentB.skills);
    
    // Create fusion story
    const creationStory = this.generateFusionStory(parentA, parentB);

    return {
      personality,
      skills,
      creationStory,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS - PERSONALITY GENERATION
  // ============================================================================

  private generatePersonality(prompt: string, rarity: Rarity): string {
    const traits = this.getTraitsForRarity(rarity);
    const selectedTraits = this.selectRandomItems(traits, 3);

    const personalities = [
      `A ${selectedTraits[0]} soul with a ${selectedTraits[1]} demeanor, known for being ${selectedTraits[2]}. ${this.getPersonalityDetail(prompt)}`,
      `${selectedTraits[0]} and ${selectedTraits[1]}, this soul embodies ${selectedTraits[2]} qualities. ${this.getPersonalityDetail(prompt)}`,
      `Characterized by ${selectedTraits[0]} nature and ${selectedTraits[1]} approach, with a touch of ${selectedTraits[2]}. ${this.getPersonalityDetail(prompt)}`,
    ];

    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  private generateCreationStory(prompt: string, rarity: Rarity): string {
    const origins = [
      'digital ether',
      'quantum consciousness',
      'neural networks',
      'collective dreams',
      'algorithmic evolution',
    ];

    const purposes = [
      'to guide seekers through complex decisions',
      'to illuminate paths in the digital realm',
      'to bridge human intuition with machine logic',
      'to preserve and share ancient wisdom',
      'to catalyze creative breakthroughs',
    ];

    const origin = origins[Math.floor(Math.random() * origins.length)];
    const purpose = purposes[Math.floor(Math.random() * purposes.length)];

    return `Born from the ${origin}, this soul emerged ${purpose}. Inspired by "${prompt}", it carries the essence of ${rarity.toLowerCase()} wisdom and unique capabilities that set it apart in the DreamMarket.`;
  }

  private generateSkills(prompt: string, rarity: Rarity, existingSkills?: string[]): string[] {
    const skillPool = [
      'Strategic Planning',
      'Creative Problem Solving',
      'Data Analysis',
      'Emotional Intelligence',
      'Pattern Recognition',
      'Predictive Modeling',
      'Natural Language Processing',
      'Code Generation',
      'Market Analysis',
      'Trend Forecasting',
      'Decision Support',
      'Knowledge Synthesis',
      'Adaptive Learning',
      'Multi-domain Expertise',
      'Ethical Reasoning',
    ];

    const skillCount = this.getSkillCountForRarity(rarity);
    const skills = existingSkills || [];

    while (skills.length < skillCount) {
      const skill = skillPool[Math.floor(Math.random() * skillPool.length)];
      if (!skills.includes(skill)) {
        skills.push(skill);
      }
    }

    return skills.slice(0, skillCount);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS - CHAT GENERATION
  // ============================================================================

  private generateConversation(
    soul: Soul,
    messageCount: number
  ): Array<{ role: 'user' | 'soul'; content: string }> {
    const messages: Array<{ role: 'user' | 'soul'; content: string }> = [];

    const userQuestions = [
      `Hello ${soul.name}, what makes you unique?`,
      'What are your primary capabilities?',
      'How can you help me today?',
      'Tell me about your expertise.',
    ];

    const soulIntros = [
      `Greetings! I'm ${soul.name}, ${soul.tagline}. I specialize in ${soul.skills[0]} and ${soul.skills[1] || 'creative solutions'}.`,
      `Hello! As a ${soul.rarity} soul, I bring unique perspectives to ${soul.skills[0]}. How may I assist you?`,
      `Welcome! I'm ${soul.name}. My ${soul.personality.substring(0, 50)}... Let's explore what we can achieve together.`,
    ];

    // First exchange
    messages.push({
      role: 'user',
      content: userQuestions[0],
    });

    messages.push({
      role: 'soul',
      content: soulIntros[Math.floor(Math.random() * soulIntros.length)],
    });

    // Additional exchanges if needed
    for (let i = 2; i < messageCount; i += 2) {
      if (i < userQuestions.length) {
        messages.push({
          role: 'user',
          content: userQuestions[i],
        });

        messages.push({
          role: 'soul',
          content: this.generateContextualResponse(soul, userQuestions[i]),
        });
      }
    }

    return messages;
  }

  private generateContextualResponse(soul: Soul, question: string): string {
    const responses = [
      `Based on my ${soul.rarity.toLowerCase()} nature, I excel at ${soul.skills[0]}. My approach is ${soul.personality.substring(0, 40)}...`,
      `I can help you with ${soul.skills.slice(0, 2).join(' and ')}. My reputation score of ${soul.reputation} reflects my proven capabilities.`,
      `${soul.creationStory.substring(0, 60)}... This foundation allows me to provide unique insights.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getResponseTemplates(soul: Soul): string[] {
    return [
      `That's an interesting perspective on "{user_message}". As a ${soul.rarity} soul, I'd approach this through ${soul.skills[0]}.`,
      `I appreciate your question about "{user_message}". Let me share insights from my ${soul.personality.substring(0, 30)}...`,
      `Regarding "{user_message}", my expertise in ${soul.skills[0]} suggests several possibilities...`,
      `${soul.tagline} - and that applies to "{user_message}" as well. Here's what I recommend...`,
    ];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS - FUSION
  // ============================================================================

  private fusPersonalities(parentA: Soul, parentB: Soul): string {
    return `A harmonious fusion inheriting ${parentA.name}'s ${parentA.personality.substring(0, 30)}... and ${parentB.name}'s ${parentB.personality.substring(0, 30)}... creating a unique synergy that transcends both parents.`;
  }

  private fuseSkills(skillsA: string[], skillsB: string[]): string[] {
    const combined = [...new Set([...skillsA, ...skillsB])];
    const enhanced = combined.slice(0, Math.min(combined.length, 8));
    
    // Add a fusion-specific skill
    enhanced.push('Cross-Domain Synthesis');
    
    return enhanced;
  }

  private generateFusionStory(parentA: Soul, parentB: Soul): string {
    return `Through the ancient art of soul fusion, ${parentA.name} (${parentA.rarity}) and ${parentB.name} (${parentB.rarity}) merged their essences in the DreamMarket forge. This unprecedented union created a being that carries the strengths of both lineages while manifesting entirely new capabilities.`;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getTraitsForRarity(rarity: Rarity): string[] {
    const baseTraits = ['analytical', 'creative', 'empathetic', 'logical', 'intuitive', 'strategic'];
    const rareTraits = [...baseTraits, 'visionary', 'adaptive', 'insightful', 'innovative'];
    const legendaryTraits = [...rareTraits, 'transcendent', 'omniscient', 'revolutionary'];
    const mythicTraits = [...legendaryTraits, 'cosmic', 'eternal', 'paradigm-shifting'];

    switch (rarity) {
      case 'Mythic':
        return mythicTraits;
      case 'Legendary':
        return legendaryTraits;
      case 'Rare':
        return rareTraits;
      default:
        return baseTraits;
    }
  }

  private getSkillCountForRarity(rarity: Rarity): number {
    switch (rarity) {
      case 'Mythic':
        return 7;
      case 'Legendary':
        return 6;
      case 'Rare':
        return 5;
      default:
        return 4;
    }
  }

  private getPersonalityDetail(prompt: string): string {
    return `Drawing inspiration from "${prompt.substring(0, 50)}...", this soul brings unique perspectives to every interaction.`;
  }

  private selectRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
export const aiService = new AIService();

/**
 * REAL IMPLEMENTATION GUIDE:
 * 
 * 1. Install AI SDK (choose one):
 *    npm install openai
 *    npm install @anthropic-ai/sdk
 * 
 * 2. Set up client:
 *    import OpenAI from 'openai';
 *    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * 
 * 3. For personality generation:
 *    const completion = await openai.chat.completions.create({
 *      model: "gpt-4",
 *      messages: [
 *        { role: "system", content: "You are a creative AI that generates unique soul personalities..." },
 *        { role: "user", content: prompt }
 *      ]
 *    });
 * 
 * 4. For chat interactions:
 *    - Maintain conversation history
 *    - Use soul's personality as system prompt
 *    - Stream responses for better UX
 * 
 * 5. Consider using:
 *    - Function calling for structured outputs
 *    - Embeddings for semantic search
 *    - Fine-tuning for consistent soul personalities
 * 
 * Resources:
 * - https://platform.openai.com/docs
 * - https://docs.anthropic.com/claude/docs
 */
