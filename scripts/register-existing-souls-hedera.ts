/**
 * Register Existing Souls to ERC-8004 Contract using Hedera SDK
 * 
 * This script registers all existing souls (NFTs) from the database
 * to the ERC-8004 smart contract using Hedera SDK (not ethers.js).
 * 
 * Usage:
 *   npx tsx scripts/register-existing-souls-hedera.ts
 */

import {
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  PrivateKey,
  AccountId,
  Hbar,
  Long,
} from "@hashgraph/sdk";
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { ethers } from "ethers";

// Load environment variables FIRST
config({ path: path.resolve(process.cwd(), ".env") });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase environment variables not found!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Convert tokenId to agentId using keccak256 hash (same as in hederaContract.ts)
 */
function convertTokenIdToAgentId(tokenId: string): string {
  // Use keccak256 hash exactly like in hederaContract.ts
  const hash = ethers.keccak256(ethers.toUtf8Bytes(tokenId));
  return BigInt(hash).toString();
}

/**
 * Convert Hedera account ID to Ethereum address format
 * Must be exactly 42 characters (0x + 40 hex chars)
 */
function convertAccountIdToAddress(accountId: string): string {
  if (!accountId) {
    throw new Error("Account ID is required");
  }
  
  if (accountId.startsWith('0x') && accountId.length === 42) {
    // Already an Ethereum address
    return accountId;
  }
  
  if (accountId.startsWith('0.0.')) {
    // Convert Hedera account ID (0.0.xxx) to Ethereum address
    const num = accountId.replace(/\./g, '');
    // Pad to 40 hex characters (20 bytes)
    const hex = num.padStart(40, '0');
    return `0x${hex}`;
  }
  
  // If it's just numbers, pad it
  const num = accountId.replace(/[^0-9]/g, '');
  if (num) {
    return `0x${num.padStart(40, '0')}`;
  }
  
  throw new Error(`Invalid account ID format: ${accountId}`);
}

async function registerExistingSouls() {
  console.log("🚀 Starting bulk registration using Hedera SDK...\n");

  // Get Hedera credentials
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;
  const contractId = process.env.SOUL_AGENT_REGISTRY_CONTRACT;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!operatorId || !operatorKey) {
    console.error("❌ HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required");
    process.exit(1);
  }

  if (!contractId) {
    console.error("❌ SOUL_AGENT_REGISTRY_CONTRACT not set in .env");
    process.exit(1);
  }

  console.log(`📝 Contract ID: ${contractId}`);
  console.log(`📡 Network: ${network}\n`);

  // Create Hedera client
  const client = network === "testnet"
    ? Client.forTestnet()
    : Client.forMainnet();

  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));

  // Load contract ABI to get function signatures
  const contractPath = path.join(__dirname, "../artifacts/contracts/SoulAgentRegistry.sol/SoulAgentRegistry.json");
  let contractABI: any[] = [];
  
  if (fs.existsSync(contractPath)) {
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    contractABI = contractArtifact.abi;
  }

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

  console.log(`✅ Found ${souls.length} souls in database`);

  // Filter: Only NFT with serial number < 30 (minted before ERC-8004)
  const filteredSouls = souls.filter(soul => {
    if (!soul.token_id) return false;
    
    // Extract serial number from token_id (format: "0.0.7242548:1")
    const parts = soul.token_id.split(':');
    if (parts.length === 2) {
      const serialNumber = parseInt(parts[1]);
      return !isNaN(serialNumber) && serialNumber < 30;
    }
    return false;
  });

  // Remove duplicates (keep only one entry per token_id)
  const uniqueSouls = Array.from(
    new Map(filteredSouls.map(soul => [soul.token_id, soul])).values()
  );

  console.log(`📋 Filtered to ${uniqueSouls.length} unique souls (serial < 30)\n`);
  
  if (uniqueSouls.length === 0) {
    console.log("ℹ️  No souls to register (all are serial >= 30 or no token_id)");
    process.exit(0);
  }

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
  for (let i = 0; i < uniqueSouls.length; i++) {
    const soul = uniqueSouls[i];
    const progress = `[${i + 1}/${uniqueSouls.length}]`;

    console.log(`\n${progress} Processing: ${soul.name || 'Unnamed'} (${soul.token_id || 'No token ID'})`);

    // Skip if no token_id
    if (!soul.token_id) {
      console.log(`   ⚠️  Skipping: No token_id`);
      skipCount++;
      continue;
    }

    // Prepare registration data
    const rarity = rarityMap[soul.rarity as string] || 0;
    const ownerAccountId = soul.owner_account_id || soul.creator_account_id;
    
    if (!ownerAccountId) {
      console.log(`   ⚠️  Skipping: No owner_account_id`);
      skipCount++;
      continue;
    }

    let ownerAddress: string;
    let creatorAddress: string;
    try {
      ownerAddress = convertAccountIdToAddress(ownerAccountId);
      creatorAddress = convertAccountIdToAddress(soul.creator_account_id || ownerAccountId);
    } catch (addrError: any) {
      console.log(`   ⚠️  Skipping: Invalid address format - ${addrError.message}`);
      skipCount++;
      continue;
    }

    const agentId = convertTokenIdToAgentId(soul.token_id);
    
    // Also need tokenId as uint256 for the contract
    // Use the same agentId as tokenId (since contract uses agentId as both)
    const tokenIdBigInt = BigInt(agentId);
    const tokenIdLong = Long.fromString(tokenIdBigInt.toString(), true); // true = unsigned

    console.log(`   📝 Registering to contract...`);
    console.log(`      Token ID: ${soul.token_id}`);
    console.log(`      Agent ID: ${agentId}`);
    console.log(`      Name: ${soul.name}`);
    console.log(`      Rarity: ${soul.rarity} (${rarity})`);

    try {
      // Create contract execute transaction
      // Function: registerAgent(uint256 tokenId, string memory name, string memory tagline, uint8 rarity, address creator)
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(500_000)
        .setMaxTransactionFee(new Hbar(10))
        .setFunction(
          "registerAgent",
          new ContractFunctionParameters()
            .addUint256(tokenIdLong) // tokenId (using agentId which is hash of token_id string)
            .addString(soul.name || "Unnamed Soul")
            .addString(soul.tagline || "")
            .addUint8(rarity)
            .addAddress(creatorAddress) // creator address
        );

      const executeResponse = await contractExecuteTx.execute(client);
      const receipt = await executeResponse.getReceipt(client);

      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
      }

      console.log(`   ✅ Successfully registered!`);
      const txId = executeResponse?.transactionId?.toString() || "N/A";
      console.log(`      Transaction ID: ${txId}`);
      console.log(`      Agent ID: ${agentId}`);
      successCount++;
    } catch (error: any) {
      // Check if agent already exists or contract reverted
      const errorMsg = error.message?.toString() || error.toString();
      
      if (errorMsg.includes("Agent already registered") || 
          errorMsg.includes("already exists") ||
          errorMsg.includes("CONTRACT_REVERT_EXECUTED")) {
        console.log(`   ⏭️  Already registered or contract reverted (likely duplicate)`);
        skipCount++;
      } else {
        console.error(`   ❌ Error: ${errorMsg}`);
        errorCount++;
      }
    }

    // Small delay to avoid rate limiting
    if (i < uniqueSouls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Registration Summary");
  console.log("=".repeat(60));
  console.log(`✅ Successfully registered: ${successCount}`);
  console.log(`⏭️  Skipped (already registered/no data): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📦 Total processed: ${uniqueSouls.length} (filtered from ${souls.length} total)`);
  console.log("=".repeat(60));

  if (successCount > 0) {
    console.log("\n🎉 Bulk registration completed!");
    console.log(`   Check contract on HashScan: https://hashscan.io/${network}/contract/${contractId}`);
  }

  client.close();
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
