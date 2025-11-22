/**
 * Groq AI Client - Simple & Direct
 * 
 * FREE & FAST AI using Groq API
 * No dependencies needed!
 */

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponse {
  reply: string;
  tokensUsed: number;
}

/**
 * Generate AI response using Groq
 */
export async function generateWithGroq(
  messages: GroqMessage[],
  temperature: number = 0.7
): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY not set! Get free key at: https://console.groq.com/keys");
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(` GROQ API CALL`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Model: ${model}`);
  console.log(`Messages: ${messages.length}`);
  console.log(`Temperature: ${temperature}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);

  try {
    console.log(` Sending request to Groq...`);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });

    console.log(` Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(` Groq API error response:`, errorText);
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(` Response data:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    const reply = data.choices[0]?.message?.content || "No response from Groq";
    const tokensUsed = data.usage?.total_tokens || 0;

    console.log(` Groq response received (${tokensUsed} tokens)`);
    console.log(` Reply preview: ${reply.substring(0, 100)}...\n`);

    return {
      reply,
      tokensUsed,
    };
  } catch (error: any) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(` GROQ API ERROR`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Error type: ${error.constructor.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack:`, error.stack);
    console.error(`${'='.repeat(60)}\n`);
    throw error;
  }
}

/**
 * Test Groq connection
 */
export async function testGroqConnection(): Promise<boolean> {
  try {
    const testMessages: GroqMessage[] = [
      { role: "user", content: "Say 'Hello from Groq!' if you can hear me." }
    ];
    
    const result = await generateWithGroq(testMessages, 0.7);
    console.log(`✅ Groq test successful: ${result.reply}`);
    return true;
  } catch (error) {
    console.error(`❌ Groq test failed:`, error);
    return false;
  }
}
