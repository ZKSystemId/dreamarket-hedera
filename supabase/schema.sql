-- DreamMarket Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Souls Table (NFT metadata + evolution data)
CREATE TABLE souls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_id TEXT UNIQUE NOT NULL, -- e.g., "soul-001"
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Rare', 'Legendary', 'Mythic')),
  avatar_url TEXT, -- Custom uploaded image URL
  personality TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  creation_story TEXT,
  
  -- Blockchain data
  creator_account_id TEXT NOT NULL, -- Original minter (never changes)
  owner_account_id TEXT NOT NULL, -- Current owner (changes on buy/sell)
  token_id TEXT, -- Hedera token ID
  creation_tx_hash TEXT,
  last_update_tx_hash TEXT,
  
  -- Evolution system
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  total_training_time INTEGER DEFAULT 0, -- minutes
  
  -- Marketplace
  is_listed BOOLEAN DEFAULT FALSE,
  price DECIMAL(10, 2),
  listed_at TIMESTAMP,
  
  -- Metadata
  reputation INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_id UUID REFERENCES souls(id) ON DELETE CASCADE,
  user_account_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evolution History Table
CREATE TABLE evolution_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_id UUID REFERENCES souls(id) ON DELETE CASCADE,
  from_rarity TEXT NOT NULL,
  to_rarity TEXT NOT NULL,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  xp_gained INTEGER DEFAULT 0,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training Sessions Table
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_id UUID REFERENCES souls(id) ON DELETE CASCADE,
  user_account_id TEXT NOT NULL,
  session_type TEXT NOT NULL, -- 'chat', 'manual', 'quest'
  xp_gained INTEGER NOT NULL,
  duration_minutes INTEGER,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Transactions Table
CREATE TABLE marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_id UUID REFERENCES souls(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('list', 'delist', 'sale')),
  from_account_id TEXT,
  to_account_id TEXT,
  price DECIMAL(10, 2),
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_souls_owner ON souls(owner_account_id);
CREATE INDEX idx_souls_listed ON souls(is_listed) WHERE is_listed = TRUE;
CREATE INDEX idx_souls_rarity ON souls(rarity);
CREATE INDEX idx_souls_level ON souls(level);
CREATE INDEX idx_chat_messages_soul ON chat_messages(soul_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_evolution_history_soul ON evolution_history(soul_id);
CREATE INDEX idx_training_sessions_soul ON training_sessions(soul_id);
CREATE INDEX idx_marketplace_transactions_soul ON marketplace_transactions(soul_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to souls table
CREATE TRIGGER update_souls_updated_at
  BEFORE UPDATE ON souls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Public read access for marketplace
CREATE POLICY "Public souls are viewable by everyone"
  ON souls FOR SELECT
  USING (true);

-- Users can insert their own souls
CREATE POLICY "Users can insert their own souls"
  ON souls FOR INSERT
  WITH CHECK (true);

-- Users can update their own souls
CREATE POLICY "Users can update their own souls"
  ON souls FOR UPDATE
  USING (true);

-- Chat messages policies
CREATE POLICY "Users can view their soul's messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (true);

-- Evolution history is publicly viewable
CREATE POLICY "Evolution history is viewable by everyone"
  ON evolution_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert evolution history"
  ON evolution_history FOR INSERT
  WITH CHECK (true);

-- Training sessions policies
CREATE POLICY "Users can view training sessions"
  ON training_sessions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert training sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (true);

-- Marketplace transactions are public
CREATE POLICY "Marketplace transactions are viewable by everyone"
  ON marketplace_transactions FOR SELECT
  USING (true);

CREATE POLICY "System can insert marketplace transactions"
  ON marketplace_transactions FOR INSERT
  WITH CHECK (true);
