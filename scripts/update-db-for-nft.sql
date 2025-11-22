-- Update Supabase database schema for NFT minting
-- Run this in Supabase SQL Editor

-- Add NFT-related columns to souls table
ALTER TABLE souls
ADD COLUMN IF NOT EXISTS token_id TEXT,
ADD COLUMN IF NOT EXISTS serial_number INTEGER,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS minted_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_souls_token_serial 
ON souls(token_id, serial_number);

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_souls_transaction 
ON souls(transaction_id);

-- Add comment for documentation
COMMENT ON COLUMN souls.token_id IS 'Hedera Token ID (e.g., 0.0.XXXXXX)';
COMMENT ON COLUMN souls.serial_number IS 'NFT serial number within the collection';
COMMENT ON COLUMN souls.transaction_id IS 'Hedera transaction ID for minting';
COMMENT ON COLUMN souls.minted_at IS 'Timestamp when NFT was minted on-chain';

-- Verify changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'souls'
AND column_name IN ('token_id', 'serial_number', 'transaction_id', 'minted_at');
