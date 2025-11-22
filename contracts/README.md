# Smart Contracts - ERC-8004 Implementation

This directory contains the ERC-8004 compliant smart contract for verifiable on-chain AI agents.

## Contract: SoulAgentRegistry.sol

**Standard:** ERC-8004 - Verifiable On-Chain Agents  
**Network:** Hedera Testnet/Mainnet  
**Language:** Solidity 0.8.20

### Features

- ✅ Register AI agents on-chain
- ✅ Update agent stats (level, XP, reputation)
- ✅ Transfer agent ownership
- ✅ Query agent data
- ✅ Track total registered agents

### Contract Structure

```solidity
struct Agent {
    uint256 tokenId;      // NFT token ID
    address owner;        // Current owner
    address creator;      // Original creator
    string name;          // Agent name
    string tagline;       // Agent tagline
    uint8 rarity;         // 0=Common, 1=Rare, 2=Legendary, 3=Mythic
    uint8 level;          // Current level
    uint256 xp;           // Experience points
    uint256 reputation;   // Reputation score
    bool isActive;        // Active status
    uint256 createdAt;    // Creation timestamp
    uint256 lastUpdated;  // Last update timestamp
}
```

## Compilation

```bash
npm run compile
```

This will compile the contract and generate artifacts in `artifacts/contracts/`.

## Deployment

See [DEPLOY_CONTRACT.md](../DEPLOY_CONTRACT.md) for detailed deployment instructions.

Quick deploy:
```bash
npm run deploy:testnet
```

## Integration

The contract is automatically integrated with:
- NFT minting flow (`app/api/mint-nft/route.ts`)
- XP/Level update flow (`lib/supabaseClient.ts`)

## API Endpoints

- `POST /api/contract/register-agent` - Register new agent
- `POST /api/contract/update-stats` - Update agent stats
- `GET /api/contract/get-agent` - Query agent data

## Testing

After deployment, test the contract:

```bash
# Register agent
curl -X POST http://localhost:3000/api/contract/register-agent \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "0.0.7242548:1",
    "name": "Test Agent",
    "tagline": "Test",
    "rarity": 0,
    "creatorAddress": "0x...",
    "ownerAddress": "0x..."
  }'
```

## Resources

- [ERC-8004 Standard](https://eips.ethereum.org/EIPS/eip-8004)
- [Hedera Smart Contracts Docs](https://docs.hedera.com/hedera/smart-contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

