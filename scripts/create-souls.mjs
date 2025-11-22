/**
 * Create Soul records in database from existing NFTs
 * Run: node scripts/create-souls.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSoulsFromNFTs() {
  console.log("🚀 Creating soul records from existing NFTs...\n");

  // Your existing NFTs - UPDATE OWNER IF DIFFERENT
  const nfts = [
    {
      serial: 1,
      tokenId: "0.0.7232401",
      metadata: "soul:Soul-217951",
      owner: "0.0.7158483",
    },
    {
      serial: 2,
      tokenId: "0.0.7232401",
      metadata: "soul:Soul-335574",
      owner: "0.0.7158483",
    },
    {
      serial: 3,
      tokenId: "0.0.7232401",
      metadata: "soul:Soul-421755",
      owner: "0.0.7158483",
    },
  ];

  for (const nft of nfts) {
    try {
      const soulId = nft.metadata.replace("soul:", "");
      
      console.log(`📝 Creating soul record for ${soulId}...`);

      // Check if exists
      const { data: existing } = await supabase
        .from('souls')
        .select('soul_id')
        .eq('soul_id', soulId)
        .single();

      if (existing) {
        console.log(`   ⏭️  Already exists, skipping\n`);
        continue;
      }

      // Create soul
      const { data, error } = await supabase
        .from('souls')
        .insert({
          soul_id: soulId,
          name: `Soul #${nft.serial}`,
          tagline: "AI Soul on Hedera",
          personality: "Helpful AI assistant living on the Hedera blockchain. Knowledgeable about blockchain, NFTs, and Web3 technology.",
          rarity: "Common",
          level: 1,
          xp: 0,
          skills: ["blockchain", "hedera", "nft"],
          owner_account_id: nft.owner,
          creator_account_id: nft.owner,
          token_id: `${nft.tokenId}:${nft.serial}`,
          is_listed: false,
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error:`, error.message);
      } else {
        console.log(`   ✅ Created successfully!`);
        console.log(`      ID: ${soulId}`);
        console.log(`      Token: ${nft.tokenId}:${nft.serial}\n`);
      }
    } catch (error) {
      console.error(`   ❌ Failed:`, error.message);
    }
  }

  console.log("✅ Done!");
}

createSoulsFromNFTs().catch(console.error);
