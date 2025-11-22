/**
 * Deploy SoulAgentRegistry Smart Contract to Hedera
 * 
 * This script deploys the ERC-8004 compliant SoulAgentRegistry contract
 * to Hedera testnet/mainnet for verifiable on-chain AI agents.
 * 
 * Usage:
 *   npm run deploy:testnet
 *   npm run deploy:mainnet
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("🚀 Deploying SoulAgentRegistry Contract...\n");

  // Get network from command line or default to testnet
  const network = process.env.HEDERA_NETWORK || "testnet";
  const isTestnet = network === "testnet";

  console.log(`📡 Network: ${network}`);
  console.log(`🔗 RPC URL: ${isTestnet ? "https://testnet.hashio.io/api" : "https://mainnet.hashio.io/api"}\n`);

  // Get deployer account
  const privateKey = process.env.HEDERA_OPERATOR_KEY;
  if (!privateKey) {
    throw new Error("❌ HEDERA_OPERATOR_KEY not found in environment variables");
  }

  // Create provider
  const rpcUrl = isTestnet
    ? "https://testnet.hashio.io/api"
    : "https://mainnet.hashio.io/api";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`👤 Deployer Address: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} HBAR\n`);

  if (balance === 0n) {
    throw new Error("❌ Insufficient balance. Please fund your account with HBAR.");
  }

  // Read contract bytecode and ABI
  const contractPath = path.join(__dirname, "../artifacts/contracts/SoulAgentRegistry.sol/SoulAgentRegistry.json");
  
  if (!fs.existsSync(contractPath)) {
    console.error("❌ Contract artifacts not found. Please run 'npm run compile' first.");
    process.exit(1);
  }

  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const bytecode = contractArtifact.bytecode;
  const abi = contractArtifact.abi;

  console.log("📦 Contract Bytecode Size:", bytecode.length / 2, "bytes");
  console.log("📋 Contract ABI Functions:", abi.filter((item: any) => item.type === "function").length, "functions\n");

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  const contract = await contractFactory.deploy();
  console.log("📝 Transaction Hash:", contract.deploymentTransaction()?.hash);
  
  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("\n✅ Contract Deployed Successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 HashScan:", `https://hashscan.io/${network}/contract/${contractAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network,
    contractAddress,
    deployer: wallet.address,
    transactionHash: contract.deploymentTransaction()?.hash,
    deployedAt: new Date().toISOString(),
    abi: abi,
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
  console.log("1. Update your API routes to use this contract address");
  console.log("2. Test contract functions using the API endpoints");
  console.log("3. Verify contract on HashScan (optional)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });

