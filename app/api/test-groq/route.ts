/**
 * Test Groq API Endpoint
 * GET /api/test-groq
 * 
 * Quick test to verify Groq is working
 */

import { NextResponse } from "next/server";
import { generateWithGroq } from "@/lib/groqClient";

export async function GET() {
  try {
    console.log("🧪 Testing Groq API...");
    
    // Check environment variables
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;
    const provider = process.env.AI_PROVIDER;
    
    console.log(`AI_PROVIDER: ${provider}`);
    console.log(`GROQ_MODEL: ${model}`);
    console.log(`GROQ_API_KEY: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'}`);
    
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      return NextResponse.json({
        success: false,
        error: "GROQ_API_KEY not set in .env file",
        help: "Get free key at: https://console.groq.com/keys"
      }, { status: 400 });
    }
    
    // Test simple message
    console.log("📤 Sending test message to Groq...");
    const result = await generateWithGroq([
      { role: "user", content: "Say 'Groq is working!' in Indonesian" }
    ]);
    
    console.log("✅ Groq test successful!");
    
    return NextResponse.json({
      success: true,
      message: "Groq AI is working perfectly!",
      response: result.reply,
      tokensUsed: result.tokensUsed,
      model: model,
      provider: "Groq (FREE)"
    });
    
  } catch (error: any) {
    console.error("❌ Groq test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      help: "Check your GROQ_API_KEY in .env file"
    }, { status: 500 });
  }
}
