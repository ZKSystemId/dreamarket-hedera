/**
 * Multi-Provider AI Client
 * 
 * Supports multiple FREE AI providers:
 * - Groq (FREE & FAST!)
 * - Hugging Face (FREE)
 * - OpenAI (Paid)
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  reply: string;
  tokensUsed: number;
  provider: string;
}

const AI_PROVIDER = process.env.AI_PROVIDER || "groq";
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || "0.7");

/**
 * Generate AI response using configured provider
 */
export async function generateAIResponse(
  messages: AIMessage[],
  temperature: number = AI_TEMPERATURE
): Promise<AIResponse> {
  console.log(`🤖 Using AI Provider: ${AI_PROVIDER}`);

  switch (AI_PROVIDER) {
    case "groq":
      return await generateWithGroq(messages, temperature);
    case "huggingface":
      return await generateWithHuggingFace(messages, temperature);
    case "openai":
      return await generateWithOpenAI(messages, temperature);
    default:
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * Groq API (FREE & FAST!)
 * Get API key: https://console.groq.com/keys
 */
async function generateWithGroq(
  messages: AIMessage[],
  temperature: number
): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY not set. Get free key at: https://console.groq.com/keys");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    reply: data.choices[0]?.message?.content || "",
    tokensUsed: data.usage?.total_tokens || 0,
    provider: "Groq (FREE)",
  };
}

/**
 * Hugging Face API (FREE)
 * Get API key: https://huggingface.co/settings/tokens
 */
async function generateWithHuggingFace(
  messages: AIMessage[],
  temperature: number
): Promise<AIResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL || "meta-llama/Meta-Llama-3-70B-Instruct";

  if (!apiKey || apiKey === "your_huggingface_token_here") {
    throw new Error("HUGGINGFACE_API_KEY not set. Get free key at: https://huggingface.co/settings/tokens");
  }

  // Convert messages to prompt format
  const prompt = messages.map(m => {
    if (m.role === "system") return `System: ${m.content}`;
    if (m.role === "user") return `User: ${m.content}`;
    return `Assistant: ${m.content}`;
  }).join("\n\n") + "\n\nAssistant:";

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature,
          max_new_tokens: 1000,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  const data = await response.json();
  const reply = data[0]?.generated_text || "";

  return {
    reply: reply.trim(),
    tokensUsed: reply.split(" ").length, // Approximate
    provider: "Hugging Face (FREE)",
  };
}

/**
 * OpenAI API (Paid - needs credit)
 */
async function generateWithOpenAI(
  messages: AIMessage[],
  temperature: number
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();

  return {
    reply: data.choices[0]?.message?.content || "",
    tokensUsed: data.usage?.total_tokens || 0,
    provider: "OpenAI",
  };
}

/**
 * Check if current provider is available
 */
export async function checkProviderAvailable(): Promise<boolean> {
  try {
    const testMessages: AIMessage[] = [
      { role: "user", content: "Hi" }
    ];
    await generateAIResponse(testMessages);
    return true;
  } catch (error) {
    console.error(`Provider ${AI_PROVIDER} not available:`, error);
    return false;
  }
}
