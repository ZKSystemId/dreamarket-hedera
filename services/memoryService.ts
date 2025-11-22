/**
 * Memory Service
 * 
 * Manages soul interaction history and context for AI conversations
 */

import { supabase } from "@/lib/supabase";

export interface ChatMemory {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Get recent interactions for a soul
 * Returns conversation history for context
 */
export async function getRecentInteractions(
  soulId: string,
  limit: number = 10
): Promise<ChatMemory[]> {
  try {
    // First, lookup soul by soul_id or token_id
    let soul;
    
    // Try by soul_id first
    const { data: soulBySoulIdArray } = await supabase
      .from('souls')
      .select('id')
      .eq('soul_id', soulId)
      .limit(1);

    if (soulBySoulIdArray && soulBySoulIdArray.length > 0) {
      soul = soulBySoulIdArray[0];
    } else {
      // Try by token_id (format: tokenId:serialNumber)
      const { data: soulByTokenIdArray } = await supabase
        .from('souls')
        .select('id')
        .eq('token_id', soulId)
        .limit(1);
      
      if (soulByTokenIdArray && soulByTokenIdArray.length > 0) {
        soul = soulByTokenIdArray[0];
      }
    }

    if (!soul) {
      console.warn(`⚠️ [getRecentInteractions] Soul not found: ${soulId}`);
      return [];
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('soul_id', soul.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Reverse to get chronological order (oldest first)
    return data.reverse().map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: msg.created_at
    }));
  } catch (error) {
    console.error('Failed to get recent interactions:', error);
    return [];
  }
}

/**
 * Save chat interaction to database
 */
export async function saveChatInteraction(
  soulId: string,
  userAccountId: string,
  role: "user" | "assistant",
  content: string,
  xpEarned: number = 0
): Promise<void> {
  try {
    // Get soul's internal UUID for foreign key
    const { data: soul } = await supabase
      .from('souls')
      .select('id')
      .eq('soul_id', soulId)
      .single();

    if (!soul) {
      throw new Error('Soul not found');
    }

    await supabase
      .from('chat_messages')
      .insert({
        soul_id: soul.id,
        user_account_id: userAccountId,
        role,
        content,
        xp_earned: xpEarned
      });
  } catch (error) {
    console.error('Failed to save chat interaction:', error);
    throw error;
  }
}

/**
 * Get conversation summary for evolution context
 * Analyzes recent chats to extract themes
 */
export async function getConversationSummary(
  soulId: string,
  limit: number = 20
): Promise<{
  totalMessages: number;
  topics: string[];
  avgMessageLength: number;
  userEngagement: 'high' | 'medium' | 'low';
}> {
  try {
    const interactions = await getRecentInteractions(soulId, limit);
    
    if (interactions.length === 0) {
      return {
        totalMessages: 0,
        topics: [],
        avgMessageLength: 0,
        userEngagement: 'low'
      };
    }

    // Calculate average message length
    const totalLength = interactions.reduce((sum, msg) => sum + msg.content.length, 0);
    const avgMessageLength = Math.round(totalLength / interactions.length);

    // Extract topics from messages (simple keyword extraction)
    const topics = extractTopics(interactions);

    // Determine engagement level
    const userEngagement = avgMessageLength > 100 ? 'high' 
      : avgMessageLength > 50 ? 'medium' 
      : 'low';

    return {
      totalMessages: interactions.length,
      topics,
      avgMessageLength,
      userEngagement
    };
  } catch (error) {
    console.error('Failed to get conversation summary:', error);
    return {
      totalMessages: 0,
      topics: [],
      avgMessageLength: 0,
      userEngagement: 'low'
    };
  }
}

/**
 * Extract topics from conversation
 * Simple keyword-based topic detection
 */
function extractTopics(interactions: ChatMemory[]): string[] {
  const topicKeywords = {
    'philosophy': ['meaning', 'purpose', 'existence', 'consciousness', 'reality'],
    'creativity': ['create', 'imagine', 'art', 'design', 'story', 'creative'],
    'wisdom': ['wisdom', 'knowledge', 'learn', 'understand', 'insight', 'teach'],
    'emotion': ['feel', 'emotion', 'love', 'hope', 'dream', 'happy', 'sad'],
    'technology': ['code', 'tech', 'ai', 'future', 'innovation', 'digital'],
    'science': ['science', 'research', 'experiment', 'theory', 'discover'],
    'spirituality': ['spirit', 'soul', 'meditation', 'mindful', 'zen', 'peace'],
    'adventure': ['adventure', 'explore', 'journey', 'travel', 'discover']
  };

  const topics = new Set<string>();
  const allText = interactions
    .map(i => i.content.toLowerCase())
    .join(' ');

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      topics.add(topic);
    }
  });

  return Array.from(topics);
}

/**
 * Get chat statistics for a soul
 */
export async function getChatStatistics(soulId: string): Promise<{
  totalChats: number;
  totalXpEarned: number;
  averageXpPerChat: number;
  lastChatAt: string | null;
}> {
  try {
    // Get soul's internal UUID
    const { data: soul } = await supabase
      .from('souls')
      .select('id')
      .eq('soul_id', soulId)
      .single();

    if (!soul) {
      return {
        totalChats: 0,
        totalXpEarned: 0,
        averageXpPerChat: 0,
        lastChatAt: null
      };
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('xp_earned, created_at')
      .eq('soul_id', soul.id)
      .eq('role', 'user'); // Only count user messages

    if (error || !data) {
      return {
        totalChats: 0,
        totalXpEarned: 0,
        averageXpPerChat: 0,
        lastChatAt: null
      };
    }

    const totalChats = data.length;
    const totalXpEarned = data.reduce((sum, msg) => sum + (msg.xp_earned || 0), 0);
    const averageXpPerChat = totalChats > 0 ? Math.round(totalXpEarned / totalChats) : 0;
    const lastChatAt = data.length > 0 ? data[data.length - 1].created_at : null;

    return {
      totalChats,
      totalXpEarned,
      averageXpPerChat,
      lastChatAt
    };
  } catch (error) {
    console.error('Failed to get chat statistics:', error);
    return {
      totalChats: 0,
      totalXpEarned: 0,
      averageXpPerChat: 0,
      lastChatAt: null
    };
  }
}
