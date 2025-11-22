/**
 * Test Script: Update Agent Stats on Contract
 * 
 * This script tests updating agent stats on the ERC-8004 contract
 * for a specific soul (Soul #3).
 * 
 * Usage:
 *   npx tsx scripts/test-update-contract.ts
 */

import { updateAgentStatsOnChain, isAgentRegisteredOnChain } from "@/lib/hederaContract";
import { ethers } from "ethers";
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase environment variables not found!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log("🧪 Testing Contract Update for Soul #3\n");

  // Soul #3 token ID
  const tokenId = "0.0.7242548:3";
  
  // Convert to agentId
  const hash = ethers.keccak256(ethers.toUtf8Bytes(tokenId));
  const agentId = BigInt(hash).toString();
  
  console.log(`📝 Token ID: ${tokenId}`);
  console.log(`📝 Agent ID: ${agentId}\n`);

  // Check if registered
  console.log("1️⃣ Checking if agent is registered...");
  const isRegistered = await isAgentRegisteredOnChain(agentId);
  console.log(`   Registered: ${isRegistered}\n`);

  if (!isRegistered) {
    console.log("❌ Agent not registered! Please register first.");
    return;
  }

  // Get soul data from database
  console.log("2️⃣ Fetching soul data from database...");
  const { data: soulData, error } = await supabase
    .from('souls')
    .select('*')
    .eq('token_id', tokenId)
    .single();
  
  if (error || !soulData) {
    console.log("❌ Soul not found in database!");
    console.log("   Error:", error?.message);
    return;
  }

  console.log(`   Name: ${soulData.name}`);
  console.log(`   Level: ${soulData.level}`);
  console.log(`   XP: ${soulData.xp}`);
  console.log(`   Rarity: ${soulData.rarity}\n`);

  // Test update
  console.log("3️⃣ Testing contract update...");
  const result = await updateAgentStatsOnChain({
    agentId,
    level: soulData.level || 1,
    xp: soulData.xp || 0,
    reputation: soulData.reputation || 50,
  });

  if (result.success) {
    console.log("\n✅ SUCCESS!");
    console.log(`   Transaction ID: ${result.txHash}`);
    console.log(`   HashScan: https://hashscan.io/testnet/transaction/${result.txHash}`);
  } else {
    console.log("\n❌ FAILED!");
    console.log(`   Error: ${result.error}`);
  }
}

testUpdate()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

