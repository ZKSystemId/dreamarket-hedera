/**
 * LLM Client Wrapper
 * 
 * Abstract interface for LLM providers (OpenAI, Claude, etc.)
 * Allows easy swapping of providers without changing business logic
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmClient {
  generate(messages: LlmMessage[]): Promise<string>;
}

/**
 * OpenAI Client Implementation
 * Uses OpenAI API for real personality evolution
 */
class OpenAIClient implements LlmClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "gpt-4") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model;
  }

  async generate(messages: LlmMessage[]): Promise<string> {
    if (!this.apiKey) {
      console.warn("⚠️ OpenAI API key not configured, using mock client");
      return mockClient.generate(messages);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.8, // Creative but controlled
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("❌ OpenAI API error:", error);
      // Fallback to mock client
      return mockClient.generate(messages);
    }
  }
}

/**
 * Mock Client Implementation
 * Returns deterministic but varied responses for testing
 * Can be used when API key is not available
 */
class MockLlmClient implements LlmClient {
  async generate(messages: LlmMessage[]): Promise<string> {
    console.log("🤖 Using Mock LLM Client");
    
    // Extract soul data from user message
    const userMessage = messages.find(m => m.role === "user");
    if (!userMessage) {
      throw new Error("No user message found");
    }

    try {
      const data = JSON.parse(userMessage.content);
      const { soulName, previousRarity, newRarity, previousPersonality, previousTagline, skills } = data;

      // Generate evolved personality based on rarity
      const personalityEnhancements = {
        "Rare": "with deeper insights and refined wisdom",
        "Legendary": "with profound understanding and masterful expertise",
        "Mythic": "with transcendent knowledge and unparalleled mastery"
      };

      const enhancement = personalityEnhancements[newRarity as keyof typeof personalityEnhancements] || "with enhanced capabilities";

      // Build evolved personality
      const updatedPersonality = `${previousPersonality} Through countless interactions and experiences, ${soulName} has evolved ${enhancement}. The core essence remains, but now enriched with greater depth and sophistication.`;

      // Enhance tagline
      const taglinePrefix = {
        "Rare": "The Refined",
        "Legendary": "The Masterful",
        "Mythic": "The Transcendent"
      };
      const prefix = taglinePrefix[newRarity as keyof typeof taglinePrefix] || "The Enhanced";
      const updatedTagline = previousTagline.includes(prefix) 
        ? previousTagline 
        : `${prefix} ${previousTagline}`;

      // Add evolution-specific skills
      const evolutionSkills = {
        "Rare": ["Advanced Reasoning", "Pattern Recognition"],
        "Legendary": ["Strategic Thinking", "Deep Analysis"],
        "Mythic": ["Transcendent Wisdom", "Universal Understanding"]
      };
      const newSkills = [...skills, ...(evolutionSkills[newRarity as keyof typeof evolutionSkills] || [])];

      // Generate evolution summary
      const evolutionSummary = `${soulName} has ascended from ${previousRarity} to ${newRarity} rarity, gaining profound new insights and capabilities. The soul's personality has deepened, becoming more nuanced and wise through its journey of growth.`;

      // Return strict JSON
      return JSON.stringify({
        updatedPersonality,
        updatedTagline,
        updatedSkills: newSkills,
        evolutionSummary
      }, null, 2);

    } catch (error) {
      console.error("❌ Mock client error:", error);
      throw new Error("Failed to parse evolution request");
    }
  }
}

// Export singleton instances
export const mockClient = new MockLlmClient();
export const openAIClient = new OpenAIClient();

// Default client (will use OpenAI if key available, otherwise mock)
export const llmClient: LlmClient = process.env.OPENAI_API_KEY 
  ? openAIClient 
  : mockClient;

// Export for testing/swapping
export { OpenAIClient, MockLlmClient };
