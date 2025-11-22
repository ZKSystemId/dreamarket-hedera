/**
 * Fix NFT Ownership Script
 * 
 * Script untuk memperbaiki ownership NFT yang "nyangkut" di database
 * setelah transfer berhasil tapi database tidak ter-update.
 * 
 * Usage:
 *   npx tsx scripts/fix-nft-ownership.ts <token_id:serial_number> <new_owner_account_id>
 * 
 * Example:
 *   npx tsx scripts/fix-nft-ownership.ts 0.0.7242548:25 0.0.7222371
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";
import { Client, AccountBalanceQuery, AccountId, TokenId } from "@hashgraph/sdk";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase environment variables not found!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOwnership(tokenIdFull: string, newOwnerAccountId: string) {
  console.log("🔧 Fixing NFT Ownership\n");
  console.log(`Token ID: ${tokenIdFull}`);
  console.log(`New Owner: ${newOwnerAccountId}\n`);

  // Parse token ID
  const [tokenId, serialNumber] = tokenIdFull.split(':');
  if (!tokenId || !serialNumber) {
    console.error("❌ Invalid token ID format. Expected: 0.0.xxx:serial");
    process.exit(1);
  }

  // Step 1: Verify ownership on Hedera blockchain
  console.log("1️⃣ Verifying ownership on Hedera blockchain...");
  try {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    
    if (!operatorId || !operatorKey) {
      throw new Error("Hedera credentials not found");
    }

    const { Client, AccountBalanceQuery, AccountId, TokenId, PrivateKey } = await import("@hashgraph/sdk");
    
    const client = Client.forTestnet();
    client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromStringED25519(operatorKey));

    const accountId = AccountId.fromString(newOwnerAccountId);
    const tokenIdParsed = TokenId.fromString(tokenId);

    const balanceQuery = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    const tokenBalance = balanceQuery.tokens?.get(tokenId);
    const hasNFT = tokenBalance && tokenBalance.toNumber() > 0;

    console.log(`   Account: ${newOwnerAccountId}`);
    console.log(`   Token Balance: ${tokenBalance?.toString() || '0'}`);
    console.log(`   Has NFT: ${hasNFT ? '✅ YES' : '❌ NO'}`);

    if (!hasNFT) {
      console.warn("\n⚠️  WARNING: Account does not own this NFT on Hedera blockchain!");
      console.warn("   Are you sure this is the correct owner?");
      console.warn("   Continuing anyway...\n");
    } else {
      console.log("   ✅ Ownership verified on blockchain\n");
    }

    client.close();
  } catch (error: any) {
    console.warn(`⚠️  Could not verify ownership on blockchain: ${error.message}`);
    console.warn("   Continuing with database update anyway...\n");
  }

  // Step 2: Find soul in database
  console.log("2️⃣ Finding soul in database...");
  const { data: soulRecord, error: findError } = await supabase
    .from('souls')
    .select('id, soul_id, token_id, owner_account_id, is_listed, price')
    .eq('token_id', tokenIdFull)
    .single();

  if (findError || !soulRecord) {
    console.error("❌ Soul not found in database!");
    console.error(`   Error: ${findError?.message || 'No data returned'}`);
    process.exit(1);
  }

  console.log(`   Found: ${soulRecord.soul_id}`);
  console.log(`   Current Owner (DB): ${soulRecord.owner_account_id}`);
  console.log(`   Is Listed: ${soulRecord.is_listed}`);
  console.log(`   Price: ${soulRecord.price || 'N/A'}\n`);

  // Step 3: Update ownership
  console.log("3️⃣ Updating database ownership...");
  const updateData: any = {
    owner_account_id: newOwnerAccountId,
  };

  // Clear listing if it was listed
  if (soulRecord.is_listed) {
    updateData.is_listed = false;
    updateData.price = null;
    updateData.listed_at = null;
    console.log("   Clearing listing status...");
  }

  const { error: updateError } = await supabase
    .from('souls')
    .update(updateData)
    .eq('id', soulRecord.id);

  if (updateError) {
    console.error("❌ Failed to update database!");
    console.error(`   Error: ${updateError.message}`);
    process.exit(1);
  }

  console.log(`   ✅ Database updated successfully!`);
  console.log(`   ${soulRecord.owner_account_id} → ${newOwnerAccountId}\n`);

  // Step 4: Update contract ownership (optional)
  console.log("4️⃣ Updating ERC-8004 contract ownership (optional)...");
  try {
    const { transferAgentOnChain } = await import("@/lib/hederaContract");
    
    const result = await transferAgentOnChain({
      tokenId: tokenIdFull,
      newOwnerAccountId: newOwnerAccountId,
    });

    if (result.success) {
      console.log(`   ✅ Contract ownership updated!`);
      console.log(`   Transaction: ${result.txHash}`);
    } else {
      console.warn(`   ⚠️  Contract update failed: ${result.error}`);
      console.warn(`   This is non-critical, database is already updated.`);
    }
  } catch (error: any) {
    console.warn(`   ⚠️  Contract update error: ${error.message}`);
    console.warn(`   This is non-critical, database is already updated.`);
  }

  console.log("\n✅ Ownership fix completed!");
  console.log(`   NFT ${tokenIdFull} is now owned by ${newOwnerAccountId}`);
}

// Main
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Missing arguments!");
  console.error("\nUsage:");
  console.error("  npx tsx scripts/fix-nft-ownership.ts <token_id:serial_number> <new_owner_account_id>");
  console.error("\nExample:");
  console.error("  npx tsx scripts/fix-nft-ownership.ts 0.0.7242548:25 0.0.7222371");
  process.exit(1);
}

const [tokenIdFull, newOwnerAccountId] = args;

fixOwnership(tokenIdFull, newOwnerAccountId)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

