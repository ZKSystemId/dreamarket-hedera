/**
 * Register Existing Souls to ERC-8004 Contract
 * 
 * This script registers all existing souls (NFTs) from the database
 * to the ERC-8004 smart contract that were minted before the contract was deployed.
 * 
 * Usage:
 *   tsx scripts/register-existing-souls.ts
 */

import { registerAgentOnChain, isAgentRegisteredOnChain } from "@/lib/hederaContract";
import { ethers } from "ethers";
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables FIRST
config({ path: path.resolve(process.cwd(), ".env") });

// Initialize Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase environment variables not found!");
  console.error("   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Convert tokenId to agentId (same method as in hederaContract.ts)
 */
function convertTokenIdToAgentId(tokenId: string): string {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(tokenId));
  return BigInt(hash).toString();
}

/**
 * Convert Hedera account ID to Ethereum address format
 */
function convertAccountIdToAddress(accountId: string): string {
  if (accountId.startsWith('0.0.')) {
    return `0x${accountId.replace(/\./g, '').padStart(40, '0')}`;
  }
  return accountId;
}

async function registerExistingSouls() {
  console.log("🚀 Starting bulk registration of existing souls to ERC-8004 contract...\n");

  // Check if contract is deployed
  const contractAddress = process.env.SOUL_AGENT_REGISTRY_CONTRACT;
  if (!contractAddress) {
    console.error("❌ SOUL_AGENT_REGISTRY_CONTRACT not set in .env");
    console.error("   Please deploy the contract first using: npm run deploy:hedera");
    process.exit(1);
  }

  console.log(`📝 Contract Address: ${contractAddress}\n`);

  // Get all souls from database
  console.log("📊 Fetching souls from database...");
  const { data: souls, error } = await supabase
    .from('souls')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error("❌ Error fetching souls:", error);
    process.exit(1);
  }

  if (!souls || souls.length === 0) {
    console.log("ℹ️  No souls found in database");
    process.exit(0);
  }

  console.log(`✅ Found ${souls.length} souls in database\n`);

  // Rarity mapping
  const rarityMap: Record<string, number> = {
    'Common': 0,
    'Rare': 1,
    'Legendary': 2,
    'Mythic': 3,
  };

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each soul
  for (let i = 0; i < souls.length; i++) {
    const soul = souls[i];
    const progress = `[${i + 1}/${souls.length}]`;

    console.log(`\n${progress} Processing: ${soul.name || 'Unnamed'} (${soul.token_id || 'No token ID'})`);

    // Skip if no token_id
    if (!soul.token_id) {
      console.log(`   ⚠️  Skipping: No token_id`);
      skipCount++;
      continue;
    }

    // Check if already registered
    try {
      const agentId = convertTokenIdToAgentId(soul.token_id);
      const isRegistered = await isAgentRegisteredOnChain(agentId);
      
      if (isRegistered) {
        console.log(`   ✅ Already registered (Agent ID: ${agentId})`);
        skipCount++;
        continue;
      }
    } catch (checkError) {
      console.log(`   ⚠️  Could not check registration status, proceeding...`);
    }

    // Prepare registration data
    const rarity = rarityMap[soul.rarity as string] || 0;
    const ownerAccountId = soul.owner_account_id || soul.creator_account_id;
    
    if (!ownerAccountId) {
      console.log(`   ⚠️  Skipping: No owner_account_id`);
      skipCount++;
      continue;
    }

    const ownerAddress = convertAccountIdToAddress(ownerAccountId);
    const creatorAddress = convertAccountIdToAddress(soul.creator_account_id || ownerAccountId);

    console.log(`   📝 Registering to contract...`);
    console.log(`      Token ID: ${soul.token_id}`);
    console.log(`      Name: ${soul.name}`);
    console.log(`      Rarity: ${soul.rarity} (${rarity})`);
    console.log(`      Owner: ${ownerAddress}`);

    try {
      const result = await registerAgentOnChain({
        tokenId: soul.token_id,
        name: soul.name || "Unnamed Soul",
        tagline: soul.tagline || "",
        rarity: rarity,
        creatorAddress: creatorAddress,
        ownerAddress: ownerAddress,
      });

      if (result.success) {
        console.log(`   ✅ Successfully registered!`);
        console.log(`      Agent ID: ${result.agentId}`);
        console.log(`      Transaction: ${result.txHash}`);
        successCount++;
      } else {
        console.error(`   ❌ Registration failed: ${result.error}`);
        errorCount++;
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message || error}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    if (i < souls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Registration Summary");
  console.log("=".repeat(60));
  console.log(`✅ Successfully registered: ${successCount}`);
  console.log(`⏭️  Skipped (already registered/no data): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📦 Total processed: ${souls.length}`);
  console.log("=".repeat(60));

  if (successCount > 0) {
    console.log("\n🎉 Bulk registration completed!");
    console.log(`   Check contract on HashScan: https://hashscan.io/testnet/contract/${contractAddress}`);
  }
}

// Run the script
registerExistingSouls()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
