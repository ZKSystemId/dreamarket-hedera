/**
 * Create Hedera Consensus Service Topic for Soul Evolution
 * 
 * Run this script once to create the HCS topic:
 * npx tsx scripts/create-evolution-topic.ts
 * 
 * Then add the topic ID to your .env file:
 * EVOLUTION_TOPIC_ID=0.0.XXXXXX
 */

import {
  Client,
  TopicCreateTransaction,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function createEvolutionTopic() {
  console.log("🚀 Creating Hedera Consensus Service Topic for Soul Evolution...\n");

  // Get credentials
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    console.error("❌ Error: HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env");
    process.exit(1);
  }

  // Setup client
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromString(operatorKey)
  );

  try {
    // Create topic
    console.log("📝 Creating HCS topic...");
    
    const transaction = new TopicCreateTransaction()
      .setTopicMemo("DreamMarket Soul Evolution Records - Hedera Hello Future Hackathon 2025")
      .setAdminKey(PrivateKey.fromString(operatorKey).publicKey)
      .setSubmitKey(PrivateKey.fromString(operatorKey).publicKey)
      .setMaxTransactionFee(5);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const topicId = receipt.topicId;

    if (!topicId) {
      throw new Error("Failed to get topic ID");
    }

    console.log("\n✅ SUCCESS! Evolution topic created!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📋 Topic ID: ${topicId.toString()}`);
    console.log(`🔗 HashScan: https://hashscan.io/testnet/topic/${topicId.toString()}`);
    console.log(`💰 Transaction: ${response.transactionId.toString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📝 Next Steps:\n");
    console.log("1. Add this to your .env file:");
    console.log(`   EVOLUTION_TOPIC_ID=${topicId.toString()}\n`);
    console.log("2. Restart your development server");
    console.log("3. Evolution events will now be recorded on-chain!\n");

    console.log("💡 What this topic does:");
    console.log("   - Records every soul evolution (Common → Rare → Legendary → Mythic)");
    console.log("   - Records level up events");
    console.log("   - Provides verifiable, immutable proof of soul growth");
    console.log("   - Cost: ~$0.0001 per evolution event");
    console.log("   - Anyone can verify evolution history on HashScan\n");

    client.close();

  } catch (error) {
    console.error("\n❌ Error creating topic:", error);
    client.close();
    process.exit(1);
  }
}

// Run the script
createEvolutionTopic();
