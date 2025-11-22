/**
 * Alternative Deployment Script using Hedera SDK
 * 
 * This script uses Hedera SDK directly instead of ethers.js,
 * which is more compatible with Hedera's ED25519 keys.
 * 
 * Usage:
 *   tsx scripts/deploy-contract-hedera-sdk.ts
 */

import {
  Client,
  ContractCreateTransaction,
  ContractFunctionParameters,
  PrivateKey,
  AccountId,
  Hbar,
} from "@hashgraph/sdk";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("🚀 Deploying SoulAgentRegistry Contract using Hedera SDK...\n");

  // Get network
  const network = process.env.HEDERA_NETWORK || "testnet";
  const isTestnet = network === "testnet";

  console.log(`📡 Network: ${network}\n`);

  // Get operator credentials
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error("❌ HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required in .env");
  }

  // Create Hedera client
  const client = isTestnet
    ? Client.forTestnet()
    : Client.forMainnet();

  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
  
  // Set longer timeout for large transactions
  client.setRequestTimeout(120000); // 120 seconds

  console.log(`👤 Operator: ${operatorId}`);
  console.log(`💰 Network: ${isTestnet ? "Testnet" : "Mainnet"}\n`);

  // Read contract bytecode
  const contractPath = path.join(__dirname, "../artifacts/contracts/SoulAgentRegistry.sol/SoulAgentRegistry.json");
  
  if (!fs.existsSync(contractPath)) {
    console.error("❌ Contract artifacts not found. Please run 'npm run compile' first.");
    process.exit(1);
  }

  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const bytecode = contractArtifact.bytecode;

  if (!bytecode || bytecode === "0x") {
    throw new Error("❌ Contract bytecode not found in artifacts");
  }

  // Remove 0x prefix if present
  const bytecodeHex = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  const bytecodeBytes = Buffer.from(bytecodeHex, "hex");

  console.log("📦 Contract Bytecode Size:", bytecodeBytes.length, "bytes");
  console.log("📋 Contract ABI Functions:", contractArtifact.abi.filter((item: any) => item.type === "function").length, "functions\n");

  // Deploy contract using Hedera SDK
  console.log("⏳ Deploying contract...");
  console.log("   Bytecode size:", bytecodeBytes.length, "bytes");
  console.log("   Estimated gas needed:", Math.ceil(bytecodeBytes.length / 24) * 1000, "gas");
  
  // Calculate gas: ~24 bytes per gas unit, plus overhead
  // For safety, use 2x the calculated amount
  const estimatedGas = Math.ceil((bytecodeBytes.length / 24) * 2);
  const gasLimit = Math.max(estimatedGas, 2_000_000); // Minimum 2M gas, or calculated amount
  
  console.log("   Using gas limit:", gasLimit);
  console.log("   Max transaction fee: 50 HBAR\n");
  
  const contractCreateTx = new ContractCreateTransaction()
    .setBytecode(bytecodeBytes)
    .setGas(gasLimit)
    .setMaxTransactionFee(new Hbar(50)); // Increased to 50 HBAR for large contracts

  console.log("   Executing transaction...");
  let contractCreateResponse;
  let contractCreateReceipt;
  
  // Retry logic for network issues
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      contractCreateResponse = await contractCreateTx.execute(client);
      console.log("   Transaction submitted, waiting for receipt...");
      contractCreateReceipt = await contractCreateResponse.getReceipt(client);
      break; // Success, exit retry loop
    } catch (error: any) {
      retryCount++;
      const errorMsg = error.message?.toString() || String(error);
      
      if (errorMsg.includes("UNKNOWN") || errorMsg.includes("UNAVAILABLE")) {
        if (retryCount < maxRetries) {
          console.warn(`   ⚠️  Network error (attempt ${retryCount}/${maxRetries}), retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
      }
      
      // If not a network error or max retries reached, throw
      throw error;
    }
  }
  
  if (!contractCreateReceipt) {
    throw new Error("Failed to get receipt after retries");
  }

  const contractId = contractCreateReceipt.contractId;

  if (!contractId) {
    throw new Error("❌ Contract deployment failed - no contract ID returned");
  }

  console.log("\n✅ Contract Deployed Successfully!");
  console.log("📍 Contract ID:", contractId.toString());
  console.log("🔗 HashScan:", `https://hashscan.io/${network}/contract/${contractId.toString()}\n`);

  // Convert contract ID to Ethereum address format (for compatibility)
  // Hedera contract IDs are like 0.0.123456, Ethereum addresses are 0x...
  // For now, we'll use the contract ID as-is
  const contractAddress = contractId.toString();

  // Save deployment info
  const deploymentInfo = {
    network,
    contractId: contractId.toString(),
    contractAddress: contractAddress, // Same as contractId for Hedera
    deployer: operatorId,
    transactionId: contractCreateResponse?.transactionId?.toString() || "unknown",
    deployedAt: new Date().toISOString(),
    abi: contractArtifact.abi,
  };

  const deploymentPath = path.join(__dirname, `../deployments/${network}-deployment.json`);
  const deploymentDir = path.dirname(deploymentPath);
  
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  // Update .env file with contract address
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Remove old contract address if exists
    envContent = envContent.replace(/SOUL_AGENT_REGISTRY_CONTRACT=.*\n/g, "");
    
    // Add new contract address
    envContent += `\n# ERC-8004 Soul Agent Registry Contract\n`;
    envContent += `SOUL_AGENT_REGISTRY_CONTRACT=${contractAddress}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env file with contract address\n");
  }

  console.log("🎉 Deployment Complete!");
  console.log("\nNext Steps:");
  console.log("1. Update your API routes to use this contract ID");
  console.log("2. Test contract functions using the API endpoints");
  console.log("3. Verify contract on HashScan");

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });

