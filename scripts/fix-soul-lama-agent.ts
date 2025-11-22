/**
 * Script to fix soul lama agents by deactivating and re-registering with operator as owner
 * This allows soul lama to update contract stats without updating the contract itself
 * 
 * IMPORTANT: This requires the current owner to deactivate the agent first
 * If current owner is not operator, this won't work without user interaction
 */

import { config } from "dotenv";
import * as path from "path";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔧 Fixing Soul Lama Agents Script\n");
  console.log("⚠️  NOTE: This script requires current owner to deactivate agent first");
  console.log("⚠️  If owner is not operator, this won't work without user interaction\n");

  const { Client, ContractExecuteTransaction, ContractCallQuery, ContractFunctionParameters, PrivateKey, AccountId, Hbar, Long } = await import("@hashgraph/sdk");
  const { ethers } = await import("ethers");
  const { createClient } = await import("@supabase/supabase-js");

  // Get environment variables
  const contractId = process.env.SOUL_AGENT_REGISTRY_CONTRACT;
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!contractId || !operatorId || !operatorKey) {
    throw new Error("❌ Missing required environment variables");
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("❌ Missing Supabase credentials");
  }

  // Initialize Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create Hedera client
  const client = network === "testnet"
    ? Client.forTestnet()
    : Client.forMainnet();

  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));

  // Convert operator account ID to address
  const operatorAddress = operatorId.startsWith('0.0.') 
    ? `0x${operatorId.replace(/\./g, '').padStart(40, '0')}` 
    : operatorId;

  console.log(`📡 Network: ${network}`);
  console.log(`👤 Operator: ${operatorId} (${operatorAddress})`);
  console.log(`📦 Contract: ${contractId}\n`);

  // Get all souls from database
  console.log("📊 Fetching souls from database...");
  const { data: souls, error: soulsError } = await supabase
    .from('souls')
    .select('id, soul_id, token_id, name, tagline, rarity, level, xp, reputation, owner_account_id')
    .not('token_id', 'is', null)
    .order('id', { ascending: true });

  if (soulsError) {
    throw new Error(`Failed to fetch souls: ${soulsError.message}`);
  }

  if (!souls || souls.length === 0) {
    console.log("⚠️  No souls found in database");
    return;
  }

  console.log(`✅ Found ${souls.length} souls\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process each soul
  for (const soul of souls) {
    if (!soul.token_id) {
      console.log(`⏭️  Skipping ${soul.soul_id} - no token_id`);
      skippedCount++;
      continue;
    }

    try {
      // Convert tokenId to agentId
      const hash = ethers.keccak256(ethers.toUtf8Bytes(soul.token_id));
      const agentIdBigInt = BigInt(hash);
      const agentId = agentIdBigInt.toString();
      const agentIdLong = Long.fromString(agentIdBigInt.toString(), true); // true = unsigned

      console.log(`\n🔍 Processing: ${soul.soul_id}`);
      console.log(`   Token ID: ${soul.token_id}`);
      console.log(`   Agent ID: ${agentId}`);

      // Check if agent exists and get current owner
      let currentOwnerAddress = "0x0";
      let agentExists = false;
      let agentData: any = null;

      try {
        const agentQuery = new ContractCallQuery()
          .setContractId(contractId)
          .setGas(100_000)
          .setFunction(
            "getAgent",
            new ContractFunctionParameters()
              .addUint256(agentIdLong)
          );

        const agentQueryResponse = await agentQuery.execute(client);
        const ownerResult = agentQueryResponse.getAddress(1);
        const nameResult = agentQueryResponse.getString(3);
        const taglineResult = agentQueryResponse.getString(4);
        const rarityResult = agentQueryResponse.getUint8(5);
        
        currentOwnerAddress = ownerResult?.toString() || "0x0";
        agentExists = currentOwnerAddress !== "0x0";
        
        agentData = {
          owner: currentOwnerAddress,
          name: nameResult || soul.name,
          tagline: taglineResult || soul.tagline || "",
          rarity: rarityResult || 0,
        };

        console.log(`   Agent exists: ${agentExists}`);
        console.log(`   Current owner: ${currentOwnerAddress}`);
      } catch (queryError: any) {
        console.log(`   ⚠️  Agent not found or query failed: ${queryError.message}`);
        skippedCount++;
        continue;
      }

      if (!agentExists) {
        console.log(`   ⏭️  Agent not registered, skipping`);
        skippedCount++;
        continue;
      }

      // Check if owner is already operator
      if (currentOwnerAddress.toLowerCase() === operatorAddress.toLowerCase()) {
        console.log(`   ✅ Owner is already operator, no fix needed`);
        skippedCount++;
        continue;
      }

      // For soul lama: We cannot deactivate because we're not the owner
      // We cannot re-register because agent already exists
      // Without contract update, there's no way to fix this
      console.log(`   ❌ Cannot fix: Owner (${currentOwnerAddress}) is not operator (${operatorAddress})`);
      console.log(`   ❌ Cannot deactivate: Requires owner's signature`);
      console.log(`   ❌ Cannot re-register: Agent already exists`);
      console.log(`   ⚠️  Solution: Update contract with transferAgentForMarketplace function, or`);
      console.log(`   ⚠️  Solution: Current owner must deactivate agent manually, then re-register`);
      errorCount++;

    } catch (error: any) {
      console.error(`   ❌ Error processing ${soul.soul_id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Cannot Fix: ${errorCount}`);
  console.log(`   📦 Total: ${souls.length}`);
  console.log(`\n⚠️  CONCLUSION: Without contract update, soul lama cannot be fixed automatically.`);
  console.log(`   Soul baru akan bekerja karena owner = operator.`);
  console.log(`   Soul lama perlu update contract atau manual intervention.`);

  client.close();
}

main().catch(console.error);

