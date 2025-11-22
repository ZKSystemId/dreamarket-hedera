/**
 * Create New HTS Token for Fresh Testing
 * Run: node scripts/create-new-token.js
 */

const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar
} = require("@hashgraph/sdk");

require('dotenv').config();

async function createNewToken() {
  console.log("🚀 Creating new HTS token for DreamMarket...");

  // Setup client
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  try {
    // Create new NFT token
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName("DreamMarket Souls v2")
      .setTokenSymbol("SOUL2")
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(operatorId)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .setWipeKey(operatorKey)
      .setFreezeKey(operatorKey)
      .setPauseKey(operatorKey)
      .setMaxTransactionFee(new Hbar(30))
      .freezeWith(client);

    console.log("📝 Signing transaction...");
    const tokenCreateSign = await tokenCreateTx.sign(operatorKey);

    console.log("📤 Submitting transaction...");
    const tokenCreateSubmit = await tokenCreateSign.execute(client);

    console.log("⏳ Waiting for receipt...");
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);

    const tokenId = tokenCreateRx.tokenId;
    console.log("✅ Token created successfully!");
    console.log(`🪙 Token ID: ${tokenId}`);
    console.log(`📊 Transaction ID: ${tokenCreateSubmit.transactionId}`);

    // Update .env file
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace token IDs
    envContent = envContent.replace(
      /HEDERA_NFT_TOKEN_ID=.*/,
      `HEDERA_NFT_TOKEN_ID=${tokenId}`
    );
    envContent = envContent.replace(
      /NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID=.*/,
      `NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID=${tokenId}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env file updated!");

    console.log("\n🎉 SUCCESS! New token created:");
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Name: DreamMarket Souls v2`);
    console.log(`   Symbol: SOUL2`);
    console.log(`   Type: NFT (Non-Fungible)`);
    console.log(`   Supply: Infinite`);
    console.log(`   Network: Testnet`);
    
    console.log("\n📋 Next steps:");
    console.log("1. Restart your dev server (npm run dev)");
    console.log("2. Clear database (run reset-database.sql)");
    console.log("3. Mint new NFTs with fresh token");
    console.log("4. Test marketplace with clean slate!");

  } catch (error) {
    console.error("❌ Error creating token:", error);
    console.error("   Make sure HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are set in .env");
  } finally {
    client.close();
  }
}

// Run the script
createNewToken();
