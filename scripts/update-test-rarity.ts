/**
 * Script to update rarity for testing
 * Updates Soul 1-5 with different rarities for testing AI chat by rarity feature
 * 
 * Usage: npx tsx scripts/update-test-rarity.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Rarity mapping based on level (from expService)
// Common: Level 1-5
// Rare: Level 6-10
// Legendary: Level 11-15
// Mythic: Level 16+

// XP thresholds from EXP_CONFIG.LEVEL_THRESHOLDS
// Level 6: 1000 XP, Level 11: 3250 XP, Level 16: 6900 XP
const TEST_CONFIG = [
  { serial: 1, rarity: 'Common', level: 1, xp: 0 },           // Common: Level 1, 0 XP
  { serial: 2, rarity: 'Rare', level: 6, xp: 1200 },         // Rare: Level 6, 1200 XP (threshold 1000 + 200)
  { serial: 3, rarity: 'Legendary', level: 11, xp: 3500 },   // Legendary: Level 11, 3500 XP (threshold 3250 + 250)
  { serial: 4, rarity: 'Mythic', level: 16, xp: 7200 },      // Mythic: Level 16, 7200 XP (threshold 6900 + 300)
  { serial: 5, rarity: 'Common', level: 1, xp: 0 },          // Common: Level 1, 0 XP
];

async function updateTestRarity() {
  console.log('🔧 Updating rarity for testing...\n');

  const operatorId = process.env.HEDERA_OPERATOR_ID || '0.0.7158483';
  const tokenId = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || '0.0.7242548';

  console.log(`📋 Operator ID: ${operatorId}`);
  console.log(`📋 Token ID: ${tokenId}\n`);

  for (const config of TEST_CONFIG) {
    const tokenKey = `${tokenId}:${config.serial}`;
    console.log(`🔍 Processing Soul #${config.serial} (${tokenKey})...`);

    try {
      // Find soul by token_id
      const { data: souls, error: findError } = await supabase
        .from('souls')
        .select('*')
        .eq('token_id', tokenKey)
        .eq('owner_account_id', operatorId)
        .order('xp', { ascending: false })
        .order('level', { ascending: false })
        .limit(1);

      if (findError) {
        console.error(`❌ Error finding soul:`, findError);
        continue;
      }

      if (!souls || souls.length === 0) {
        console.log(`⚠️  Soul #${config.serial} not found in database`);
        continue;
      }

      const soul = souls[0];
      console.log(`   Found: ${soul.soul_id} (Current: Level ${soul.level}, XP: ${soul.xp}, Rarity: ${soul.rarity})`);

      // Update rarity, level, and XP to match the level threshold
      // This ensures level won't reset because XP is sufficient for the level
      const { data: updated, error: updateError } = await supabase
        .from('souls')
        .update({
          rarity: config.rarity,
          level: config.level,
          xp: config.xp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', soul.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating soul:`, updateError);
        continue;
      }

      // Verify update
      if (updated.level === config.level && updated.rarity === config.rarity && updated.xp === config.xp) {
        console.log(`✅ Updated: Level ${config.level}, XP: ${config.xp}, Rarity: ${config.rarity}`);
      } else {
        console.error(`❌ Update verification failed! Expected Level ${config.level}, XP ${config.xp}, Rarity ${config.rarity}, but got Level ${updated.level}, XP ${updated.xp}, Rarity ${updated.rarity}`);
      }
      console.log('');
    } catch (error: any) {
      console.error(`❌ Error processing Soul #${config.serial}:`, error.message);
    }
  }

  console.log('✅ Rarity update complete!');
}

// Run the script
updateTestRarity()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

