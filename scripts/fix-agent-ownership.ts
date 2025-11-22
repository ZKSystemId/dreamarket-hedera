/**
 * Script to fix agent ownership for existing registered agents
 * Transfers ownership to operator so updates can work
 */

import { config } from "dotenv";
import * as path from "path";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔧 Fixing Agent Ownership Script\n");

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
    throw new Error("❌ Missing required environment variables: SOUL_AGENT_REGISTRY_CONTRACT, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY");
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
    .select('id, soul_id, token_id, name, owner_account_id')
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
        currentOwnerAddress = ownerResult?.toString() || "0x0";
        agentExists = currentOwnerAddress !== "0x0";

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

      // Try to transfer ownership to operator using transferAgentForMarketplace
      console.log(`   🔄 Transferring ownership to operator...`);
      
      try {
        const transferTx = new ContractExecuteTransaction()
          .setContractId(contractId)
          .setGas(500_000)
          .setMaxTransactionFee(new Hbar(10))
          .setFunction(
            "transferAgentForMarketplace",
            new ContractFunctionParameters()
              .addUint256(agentIdLong)
              .addAddress(operatorAddress)
          );

        const transferResponse = await transferTx.execute(client);
        const transferReceipt = await transferResponse.getReceipt(client);

        if (transferReceipt.status.toString() === "SUCCESS") {
          console.log(`   ✅ Ownership transferred successfully!`);
          console.log(`   TX: ${transferResponse.transactionId?.toString()}`);
          fixedCount++;
        } else {
          console.log(`   ❌ Transfer failed: ${transferReceipt.status.toString()}`);
          errorCount++;
        }
      } catch (transferError: any) {
        const errorMsg = transferError.message?.toString() || String(transferError);
        console.log(`   ❌ Transfer failed: ${errorMsg.substring(0, 100)}`);
        
        if (errorMsg.includes("function does not exist") || errorMsg.includes("CONTRACT_REVERT_EXECUTED")) {
          console.log(`   ⚠️  Contract may not have transferAgentForMarketplace function`);
          console.log(`   ⚠️  Or contract owner is different from operator`);
        }
        
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.error(`   ❌ Error processing ${soul.soul_id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📦 Total: ${souls.length}`);

  client.close();
}

main().catch(console.error);

