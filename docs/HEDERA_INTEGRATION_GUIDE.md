# Hedera Integration Guide for DreamMarket

Complete guide for integrating real Hedera services into DreamMarket to maximize hackathon scoring (35% of total score).

---

## Overview

DreamMarket uses **multiple Hedera services** for deep integration:

1. **Hedera Token Service (HTS)** - NFT minting for Soul identities
2. **Hedera Consensus Service (HCS)** - Immutable interaction logging
3. **Smart Contracts (ERC-8004)** - On-chain AI agent verification (optional advanced feature)
4. **Hedera File Service (HFS)** - Soul metadata storage (optional)

This aligns with the **AI & Agents** track (Intermediate: Multi-Agent Marketplace).

---

## Installation

```bash
npm install @hashgraph/sdk
```

---

## 1. Hedera Token Service (HTS) - Soul NFTs

### Setup Client

Update `src/services/hederaService.ts`:

```typescript
import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import { config } from '../config';

class HederaService {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;
  private collectionTokenId?: string; // Store collection token ID

  constructor() {
    // Initialize client
    this.client = config.hedera.network === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();

    this.operatorId = AccountId.fromString(config.hedera.operatorId!);
    this.operatorKey = PrivateKey.fromString(config.hedera.operatorKey!);

    this.client.setOperator(this.operatorId, this.operatorKey);
  }

  // Create NFT collection (run once)
  async createSoulCollection() {
    const transaction = await new TokenCreateTransaction()
      .setTokenName('DreamMarket Souls')
      .setTokenSymbol('SOUL')
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(this.operatorId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(this.operatorKey)
      .setAdminKey(this.operatorKey)
      .freezeWith(this.client);

    const signTx = await transaction.sign(this.operatorKey);
    const txResponse = await signTx.execute(this.client);
    const receipt = await txResponse.getReceipt(this.client);

    this.collectionTokenId = receipt.tokenId!.toString();
    console.log(`NFT Collection created: ${this.collectionTokenId}`);

    return this.collectionTokenId;
  }

  // Mint individual Soul NFT
  async mintSoulIdentity(input: HederaMintInput): Promise<HederaMintResult> {
    if (!this.collectionTokenId) {
      throw new Error('Collection not created. Call createSoulCollection() first.');
    }

    // Create metadata (can be IPFS hash or direct JSON)
    const metadata = Buffer.from(JSON.stringify({
      name: input.name,
      rarity: input.rarity,
      owner: input.ownerWallet,
      ...input.metadata,
    }));

    // Mint NFT
    const mintTx = await new TokenMintTransaction()
      .setTokenId(this.collectionTokenId)
      .setMetadata([metadata])
      .freezeWith(this.client);

    const mintTxSign = await mintTx.sign(this.operatorKey);
    const mintTxResponse = await mintTxSign.execute(this.client);
    const mintReceipt = await mintTxResponse.getReceipt(this.client);

    const serialNumber = mintReceipt.serials[0].toNumber();
    const tokenId = `${this.collectionTokenId}/${serialNumber}`;

    // Associate token with owner (if needed)
    // await this.associateToken(input.ownerWallet, this.collectionTokenId);

    // Transfer to owner
    // await this.transferNFT(tokenId, this.operatorId.toString(), input.ownerWallet);

    return {
      tokenId,
      txHash: mintTxResponse.transactionId.toString(),
    };
  }

  // Transfer Soul NFT
  async transferSoul(input: HederaTransferInput): Promise<HederaTransferResult> {
    const [tokenId, serialNumber] = input.tokenId.split('/');

    const transferTx = await new TransferTransaction()
      .addNftTransfer(
        tokenId,
        parseInt(serialNumber),
        AccountId.fromString(input.fromWallet),
        AccountId.fromString(input.toWallet)
      )
      .freezeWith(this.client);

    // Sign with sender's key (in production, use wallet signature)
    const transferTxResponse = await transferTx.execute(this.client);
    const transferReceipt = await transferTxResponse.getReceipt(this.client);

    return {
      txHash: transferTxResponse.transactionId.toString(),
    };
  }
}
```

---

## 2. Hedera Consensus Service (HCS) - Interaction Logging

### Create Topic (Run Once)

```typescript
import { TopicCreateTransaction, TopicMessageSubmitTransaction } from '@hashgraph/sdk';

class HederaService {
  private topicId?: string;

  async createInteractionTopic() {
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo('DreamMarket Soul Interactions')
      .setAdminKey(this.operatorKey)
      .setSubmitKey(this.operatorKey)
      .freezeWith(this.client);

    const signTx = await transaction.sign(this.operatorKey);
    const txResponse = await signTx.execute(this.client);
    const receipt = await txResponse.getReceipt(this.client);

    this.topicId = receipt.topicId!.toString();
    console.log(`HCS Topic created: ${this.topicId}`);

    return this.topicId;
  }

  async logInteractionHash(input: HederaLogInput): Promise<HederaLogResult> {
    if (!this.topicId && !input.topicId) {
      throw new Error('Topic not created. Call createInteractionTopic() first.');
    }

    const topicId = input.topicId || this.topicId!;

    // Submit message to HCS
    const submitTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(input.hash)
      .freezeWith(this.client);

    const submitTxResponse = await submitTx.execute(this.client);
    const submitReceipt = await submitTxResponse.getReceipt(this.client);

    return {
      messageId: submitTxResponse.transactionId.toString(),
      topicId,
    };
  }
}
```

---

## 3. Smart Contracts (ERC-8004) - Advanced Feature

For **maximum scoring**, implement ERC-8004 for verifiable on-chain agents.

### Deploy Contract

```solidity
// contracts/SoulRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SoulRegistry {
    struct Soul {
        string name;
        string personality;
        address owner;
        uint256 reputation;
        bool verified;
    }

    mapping(uint256 => Soul) public souls;
    uint256 public soulCount;

    event SoulRegistered(uint256 indexed soulId, string name, address owner);
    event ReputationUpdated(uint256 indexed soulId, uint256 newReputation);

    function registerSoul(
        string memory name,
        string memory personality
    ) external returns (uint256) {
        soulCount++;
        souls[soulCount] = Soul({
            name: name,
            personality: personality,
            owner: msg.sender,
            reputation: 50,
            verified: true
        });

        emit SoulRegistered(soulCount, name, msg.sender);
        return soulCount;
    }

    function updateReputation(uint256 soulId, uint256 newReputation) external {
        require(souls[soulId].owner == msg.sender, "Not owner");
        souls[soulId].reputation = newReputation;
        emit ReputationUpdated(soulId, newReputation);
    }

    function getSoul(uint256 soulId) external view returns (Soul memory) {
        return souls[soulId];
    }
}
```

### Deploy with Hedera

```typescript
import { ContractCreateFlow, ContractExecuteTransaction, ContractCallQuery } from '@hashgraph/sdk';
import * as fs from 'fs';

class HederaService {
  async deploySoulContract() {
    const bytecode = fs.readFileSync('contracts/SoulRegistry.bin');

    const contractTx = new ContractCreateFlow()
      .setBytecode(bytecode)
      .setGas(100000);

    const contractResponse = await contractTx.execute(this.client);
    const contractReceipt = await contractResponse.getReceipt(this.client);

    const contractId = contractReceipt.contractId!.toString();
    console.log(`Contract deployed: ${contractId}`);

    return contractId;
  }

  async registerSoulOnChain(contractId: string, name: string, personality: string) {
    // Call registerSoul function
    const contractExecTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100000)
      .setFunction('registerSoul', [name, personality])
      .freezeWith(this.client);

    const contractExecResponse = await contractExecTx.execute(this.client);
    const contractExecReceipt = await contractExecResponse.getReceipt(this.client);

    return {
      txHash: contractExecResponse.transactionId.toString(),
    };
  }
}
```

---

## 4. Configuration

### Environment Variables

Update `.env`:

```env
# Hedera Testnet
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY_HERE

# Collection and Topic IDs (after creation)
HEDERA_COLLECTION_TOKEN_ID=0.0.xxxxx
HEDERA_TOPIC_ID=0.0.xxxxx
HEDERA_CONTRACT_ID=0.0.xxxxx
```

### Get Testnet Account

1. Go to https://portal.hedera.com/register
2. Create testnet account
3. Get free testnet HBAR from faucet
4. Copy Account ID and Private Key

---

## 5. Integration Checklist

### For Hackathon Scoring (35% of score)

- [x] **HTS Integration** (15 points)
  - [x] Create NFT collection for Souls
  - [x] Mint individual Soul NFTs
  - [x] Transfer NFTs between wallets
  - [x] Store metadata on-chain

- [x] **HCS Integration** (10 points)
  - [x] Create topic for interactions
  - [x] Log interaction hashes
  - [x] Provide verifiable proof

- [ ] **Smart Contracts** (10 points) - BONUS
  - [ ] Deploy ERC-8004 contract
  - [ ] Register souls on-chain
  - [ ] Update reputation on-chain
  - [ ] Query soul data from contract

### Impact on Hedera Ecosystem (20% of score)

- **New Accounts**: Each user creates Hedera account
- **TPS Increase**: Every mint, transfer, interaction increases TPS
- **Novel Use Case**: AI agent marketplace is unique to Hedera
- **Ecosystem Growth**: Attracts AI/Web3 developers

---

## 6. Testing

### Test HTS

```typescript
// Test script: scripts/test-hedera.ts
import { hederaService } from '../src/services/hederaService';

async function testHTS() {
  // Create collection
  const collectionId = await hederaService.createSoulCollection();
  console.log('Collection:', collectionId);

  // Mint Soul
  const result = await hederaService.mintSoulIdentity({
    name: 'Test Soul',
    ownerWallet: '0.0.123456',
    rarity: 'Common',
  });
  console.log('Minted:', result);
}

testHTS();
```

### Test HCS

```typescript
async function testHCS() {
  // Create topic
  const topicId = await hederaService.createInteractionTopic();
  console.log('Topic:', topicId);

  // Log interaction
  const result = await hederaService.logInteractionHash({
    soulId: 'soul-123',
    hash: 'interaction-hash-abc',
  });
  console.log('Logged:', result);
}
```

---

## 7. Production Considerations

### Security

- **Never commit private keys** to Git
- Use environment variables
- Rotate keys regularly
- Use separate accounts for testnet/mainnet

### Cost Optimization

- **Batch operations** where possible
- **Cache frequently accessed data**
- **Use HCS for logs** (cheaper than transactions)
- **Optimize metadata size**

### Monitoring

- Track transaction success rates
- Monitor HBAR balance
- Log all Hedera operations
- Set up alerts for failures

---

## 8. Resources

### Official Documentation

- **Hedera Docs**: https://docs.hedera.com/hedera
- **SDK Reference**: https://docs.hedera.com/hedera/sdks-and-apis/sdks
- **HTS Guide**: https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service
- **HCS Guide**: https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service

### Code Examples

- **GitHub Snippets**: https://github.com/hedera-dev/hedera-code-snippets
- **Cheatsheets**: https://github.com/hedera-dev/hedera-cheatsheets

### Support

- **Discord**: https://go.hellofuturehackathon.dev/hfa-discord
- **Developer Help Desk**: Available during hackathon

---

## 9. Hackathon Strategy

### Maximize Integration Score (15%)

✅ **Use Multiple Services**
- HTS for NFTs
- HCS for logging
- Smart Contracts (bonus)

✅ **Show Creative Integration**
- Unique soul fusion mechanism
- On-chain reputation system
- Verifiable AI agent identities

✅ **Demonstrate Ecosystem Impact**
- Track metrics: souls minted, interactions logged
- Show TPS contribution
- Document new accounts created

### Maximize Success Score (20%)

✅ **Impact Metrics**
- Number of souls created
- Total interactions logged
- Active users/wallets
- Transaction volume

✅ **Ecosystem Growth**
- Attract AI developers to Hedera
- Novel use case for HTS + AI
- Potential for real adoption

---

**Last Updated:** 2025-01-21  
**For:** Hedera Hello Future Hackathon 2025
