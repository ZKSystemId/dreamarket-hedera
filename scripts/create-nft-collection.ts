/**
 * Create NFT Collection on Hedera
 * Run this once to create the Soul NFT collection
 * 
 * Usage: npx tsx scripts/create-nft-collection.ts
 */

import { createNFTCollection } from "../lib/hederaNFT.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  console.log("🚀 Creating DreamMarket Soul NFT Collection...\n");

  try {
    const tokenId = await createNFTCollection(
      "DreamMarket Souls",
      "SOUL"
    );

    console.log("\n✅ SUCCESS!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 NFT Collection Created");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Token ID: ${tokenId}`);
    console.log(`Explorer: https://hashscan.io/testnet/token/${tokenId}`);
    console.log("\n📋 Next Steps:");
    console.log("1. Add this to your .env.local:");
    console.log(`   HEDERA_NFT_TOKEN_ID=${tokenId}`);
    console.log("\n2. Restart your dev server");
    console.log("3. Start minting Soul NFTs!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nPlease check:");
    console.error("1. HEDERA_OPERATOR_ID is set in .env");
    console.error("2. HEDERA_OPERATOR_KEY is set in .env");
    console.error("3. Operator account has enough HBAR (need ~30 HBAR)");
    process.exit(1);
  }
}

main();
