/**
 * Fallback AI System
 * 
 * Simple rule-based responses when OpenAI is not available
 * Use this temporarily until OpenAI credit is added
 */

import { SoulAgent } from "@/types/agent";

export interface FallbackResponse {
  reply: string;
  skillsUsed: string[];
}

/**
 * Generate fallback response based on user message
 */
export function generateFallbackResponse(
  soul: SoulAgent,
  message: string
): FallbackResponse {
  const messageLower = message.toLowerCase();
  
  // Greeting
  if (messageLower.includes('hi') || messageLower.includes('hello') || 
      messageLower.includes('halo') || messageLower.includes('hai')) {
    return {
      reply: `Hello! I'm ${soul.name}, ${soul.tagline}. 

I'm currently at Level ${soul.level} (${soul.rarity} rarity) with ${soul.skills.length} skills unlocked.

I can help you with:
${soul.skills.slice(0, 5).map(s => `- ${s}`).join('\n')}

What would you like to talk about?`,
      skillsUsed: ["Basic Conversation"]
    };
  }
  
  // Thread request
  if (messageLower.includes('thread') || messageLower.includes('tweet')) {
    const topic = message.replace(/buatin|thread|tentang|about|create|make/gi, '').trim() || 'this topic';
    
    return {
      reply: `Here's a thread about ${topic}:

1/ ${topic.charAt(0).toUpperCase() + topic.slice(1)} is an important topic. Let me break it down for you.

2/ Understanding the fundamentals is key. Start with the basics and build from there.

3/ Practical application matters more than theory. Focus on what you can implement today.

4/ Keep learning and iterating. Every expert was once a beginner.

5/ Take action now. The best time to start was yesterday, the second best time is today.

Note: This is a basic template. For better quality threads, please add OpenAI credit at platform.openai.com/settings/organization/billing`,
      skillsUsed: ["Simple Threads"]
    };
  }
  
  // Code request
  if (messageLower.includes('code') || messageLower.includes('function') || 
      messageLower.includes('buatin')) {
    return {
      reply: `I can help with that! However, I need OpenAI credit to generate quality code.

For now, here's what I suggest:
1. Add $5-10 credit to your OpenAI account
2. Go to: platform.openai.com/settings/organization/billing
3. Add payment method and credit
4. Wait 5-10 minutes for activation

Once active, I'll be able to:
- Write production-ready code
- Include error handling
- Add comments and documentation
- Provide usage examples

Want me to help with something else in the meantime?`,
      skillsUsed: ["Basic Conversation"]
    };
  }
  
  // About self
  if (messageLower.includes('siapa') || messageLower.includes('who are you') || 
      messageLower.includes('tentang') || messageLower.includes('about')) {
    return {
      reply: `I'm ${soul.name}, ${soul.tagline}

**My Story:**
${soul.creationStory || 'I\'m an AI soul in DreamMarket, learning and growing through conversations.'}

**Current Stats:**
- Level: ${soul.level}
- Rarity: ${soul.rarity}
- Reputation: ${soul.reputation}
- Skills: ${soul.skills.length} unlocked

**What I Can Do:**
${soul.skills.slice(0, 5).map(s => `- ${s}`).join('\n')}

I'm still developing my capabilities. Add OpenAI credit for better responses!`,
      skillsUsed: ["Basic Conversation"]
    };
  }
  
  // Default response - SHOULD NOT SEE THIS IF GROQ IS WORKING!
  return {
    reply: `⚠️ FALLBACK MODE ACTIVE ⚠️

This means Groq AI failed to respond. This message should NOT appear if Groq is working!

**Debug Info:**
- Your message: "${message}"
- Soul: ${soul.name} (Level ${soul.level})
- This is a fallback response, not real AI

**If you see this:**
1. Check server console for errors
2. Look for "❌ GROQ AI ERROR" in terminal
3. Report the error message

**Expected:** Real AI response from Groq
**Actual:** Fallback (something went wrong)

Please check the server console logs!`,
    skillsUsed: ["Basic Conversation"]
  };
}

/**
 * Check if OpenAI is available
 */
export async function checkOpenAIAvailable(): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}
