import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface SoulRecord {
  id: string;
  soul_id: string;
  name: string;
  tagline: string;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
  avatar_url?: string;
  personality: string;
  skills: string[];
  creation_story: string;
  creator_account_id: string;
  owner_account_id: string;
  token_id?: string;
  creation_tx_hash?: string;
  last_update_tx_hash?: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  total_training_time: number;
  is_listed: boolean;
  price?: number;
  listed_at?: string;
  reputation: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  soul_id: string;
  user_account_id: string;
  role: 'user' | 'assistant';
  content: string;
  xp_earned: number;
  created_at: string;
}

export interface EvolutionHistoryRecord {
  id: string;
  soul_id: string;
  from_rarity: string;
  to_rarity: string;
  from_level: number;
  to_level: number;
  xp_gained: number;
  tx_hash?: string;
  created_at: string;
}

export interface TrainingSessionRecord {
  id: string;
  soul_id: string;
  user_account_id: string;
  session_type: 'chat' | 'manual' | 'quest';
  xp_gained: number;
  duration_minutes?: number;
  tx_hash?: string;
  created_at: string;
}

export interface MarketplaceTransactionRecord {
  id: string;
  soul_id: string;
  transaction_type: 'list' | 'delist' | 'sale';
  from_account_id?: string;
  to_account_id?: string;
  price?: number;
  tx_hash?: string;
  created_at: string;
}
