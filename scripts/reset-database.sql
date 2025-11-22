-- Reset Database for Fresh Testing
-- Run this in Supabase SQL Editor

-- Clear all marketplace data
DELETE FROM marketplace_transactions;
DELETE FROM souls;

-- Reset sequences (if any)
-- ALTER SEQUENCE souls_id_seq RESTART WITH 1;

-- Verify tables are empty
SELECT 'souls' as table_name, COUNT(*) as count FROM souls
UNION ALL
SELECT 'marketplace_transactions' as table_name, COUNT(*) as count FROM marketplace_transactions;

-- Show table structure for reference
\d souls;
\d marketplace_transactions;
