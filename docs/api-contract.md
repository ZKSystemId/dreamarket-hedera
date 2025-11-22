# DreamMarket API Contract

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api`  
**Protocol:** HTTP/JSON REST API

---

## Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Examples](#examples)

---

## Overview

The DreamMarket API provides a complete backend for managing AI agent "souls" - digital entities with unique personalities, skills, and on-chain identities powered by Hedera.

### Key Features

- **Soul Management**: Create, read, update souls
- **Hedera Integration**: NFT minting (HTS), consensus logging (HCS)
- **AI Generation**: Personality and chat generation
- **Interactions**: Record and retrieve soul-user conversations
- **Fusion**: Combine two souls into a new entity
- **Reputation System**: Track and update soul reputation scores

### Response Envelope

All API responses follow this structure:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## Data Models

### Core Types

#### Rarity

```typescript
type Rarity = "Common" | "Rare" | "Legendary" | "Mythic";
```

#### Soul

```typescript
interface Soul {
  id: string;                    // UUID
  name: string;                  // 2-50 chars
  tagline: string;               // 5-100 chars
  rarity: Rarity;
  avatarSeed?: string;           // For avatar generation
  personality: string;           // Rich text description
  skills: string[];              // 1-10 skills
  creationStory: string;         // Origin narrative
  reputation: number;            // 0-100
  owner: string;                 // Wallet address
  tokenId?: string;              // Hedera token ID (0.0.xxxxx)
  creationTxHash?: string;       // Hedera transaction hash
  lastUpdateTxHash?: string;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

#### SoulSummary (for list views)

```typescript
interface SoulSummary {
  id: string;
  name: string;
  tagline: string;
  rarity: Rarity;
  avatarSeed?: string;
  reputation: number;
  owner: string;
  tokenId?: string;
  skills: string[];
  isListed: boolean;
  listingPrice?: number;
  createdAt: string;
}
```

#### SoulEvent

```typescript
type SoulEventType = 
  | "MINTED" 
  | "TRANSFERRED" 
  | "REPUTATION_UPDATED" 
  | "MEMORY_UPDATED" 
  | "FUSED" 
  | "EVOLVED" 
  | "RENTED" 
  | "LISTED" 
  | "DELISTED" 
  | "OTHER";

interface SoulEvent {
  id: string;
  type: SoulEventType;
  description: string;
  timestamp: string;
  txHash?: string;
  metadata?: Record<string, any>;
}
```

#### SoulInteraction

```typescript
type InteractionRole = "USER" | "SOUL" | "SYSTEM";

interface SoulInteraction {
  id: string;
  role: InteractionRole;
  content: string;
  timestamp: string;
  hashOnChain?: string;  // HCS message ID
}
```

#### SoulStats

```typescript
interface SoulStats {
  totalInteractions: number;
  totalOwners: number;
  lastActiveAt: string;
}
```

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

## API Endpoints

### 1. Get Souls (List)

**Endpoint:** `GET /api/souls`

**Description:** Retrieve a paginated, filtered, and sorted list of souls.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search in name, tagline, personality |
| `rarity` | Rarity | No | - | Filter by rarity |
| `skills` | string | No | - | Comma-separated skills to filter |
| `sort` | string | No | `newest` | Sort order: `newest`, `reputation`, `mostTraded` |
| `limit` | number | No | `20` | Items per page (max 100) |
| `offset` | number | No | `0` | Pagination offset |
| `isListed` | boolean | No | - | Filter by listing status |
| `owner` | string | No | - | Filter by owner wallet |

**Response:**

```typescript
{
  success: true,
  data: {
    data: SoulSummary[],
    pagination: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    }
  }
}
```

**Example Request:**

```bash
GET /api/souls?rarity=Legendary&sort=reputation&limit=10
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Aria the Wise",
        "tagline": "Guardian of ancient knowledge",
        "rarity": "Legendary",
        "avatarSeed": "abc123",
        "reputation": 95,
        "owner": "0.0.123456",
        "tokenId": "0.0.789012",
        "skills": ["Strategic Planning", "Knowledge Synthesis"],
        "isListed": false,
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 2. Get Soul Details

**Endpoint:** `GET /api/souls/:id`

**Description:** Retrieve complete details for a specific soul.

**Path Parameters:**

- `id` (string, required): Soul UUID

**Response:**

```typescript
{
  success: true,
  data: {
    soul: Soul,
    events: SoulEvent[],  // Recent 10 events
    stats: SoulStats
  }
}
```

**Example Request:**

```bash
GET /api/souls/550e8400-e29b-41d4-a716-446655440000
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "soul": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Aria the Wise",
      "tagline": "Guardian of ancient knowledge",
      "rarity": "Legendary",
      "avatarSeed": "abc123",
      "personality": "A visionary soul with an adaptive demeanor...",
      "skills": ["Strategic Planning", "Knowledge Synthesis", "Predictive Modeling"],
      "creationStory": "Born from the quantum consciousness...",
      "reputation": 95,
      "owner": "0.0.123456",
      "tokenId": "0.0.789012",
      "creationTxHash": "0xabc...def",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-20T14:22:00Z"
    },
    "events": [
      {
        "id": "evt-001",
        "type": "MINTED",
        "description": "Soul 'Aria the Wise' was minted as a Legendary entity",
        "timestamp": "2025-01-15T10:30:00Z",
        "txHash": "0xabc...def"
      }
    ],
    "stats": {
      "totalInteractions": 127,
      "totalOwners": 1,
      "lastActiveAt": "2025-01-20T14:22:00Z"
    }
  }
}
```

---

### 3. Create Soul (Mint)

**Endpoint:** `POST /api/souls`

**Description:** Create and mint a new soul NFT.

**Request Body:**

```typescript
{
  name: string;                    // Required, 2-50 chars
  tagline: string;                 // Required, 5-100 chars
  rarity: Rarity;                  // Required
  personality?: string;            // Optional if autoGenerate
  skills?: string[];               // Optional if autoGenerate
  creationStory?: string;          // Optional if autoGenerate
  inspirationPrompt?: string;      // For AI generation
  ownerWallet: string;             // Required, Hedera address
  autoGeneratePersonality?: boolean; // Use AI to generate
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    soul: Soul,
    hedera: {
      tokenId: string,
      creationTxHash: string
    }
  }
}
```

**Example Request:**

```json
{
  "name": "Nova",
  "tagline": "The Digital Alchemist",
  "rarity": "Rare",
  "inspirationPrompt": "A soul that transforms data into wisdom",
  "ownerWallet": "0.0.123456",
  "autoGeneratePersonality": true
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "soul": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Nova",
      "tagline": "The Digital Alchemist",
      "rarity": "Rare",
      "personality": "A creative soul with a visionary demeanor...",
      "skills": ["Data Analysis", "Pattern Recognition", "Creative Problem Solving"],
      "creationStory": "Born from the neural networks...",
      "reputation": 50,
      "owner": "0.0.123456",
      "tokenId": "0.0.789013",
      "creationTxHash": "0x123...456",
      "createdAt": "2025-01-21T09:15:00Z",
      "updatedAt": "2025-01-21T09:15:00Z"
    },
    "hedera": {
      "tokenId": "0.0.789013",
      "creationTxHash": "0x123...456"
    }
  }
}
```

---

### 4. Update Soul

**Endpoint:** `PATCH /api/souls/:id`

**Description:** Update soul information (off-chain data).

**Path Parameters:**

- `id` (string, required): Soul UUID

**Request Body:**

```typescript
{
  name?: string;
  tagline?: string;
  personality?: string;
  skills?: string[];
  creationStory?: string;
}
```

**Response:**

```typescript
{
  success: true,
  data: Soul
}
```

---

### 5. Create Interaction

**Endpoint:** `POST /api/souls/:id/interactions`

**Description:** Record a conversation/interaction with a soul.

**Path Parameters:**

- `id` (string, required): Soul UUID

**Request Body:**

```typescript
{
  userWallet?: string;           // Optional, for anonymous interactions
  messages: Array<{
    role: "user" | "soul";
    content: string;
  }>;
  persistOnChain?: boolean;      // Log to Hedera HCS
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    success: boolean,
    interactionCount: number,
    onChainReference?: string    // HCS message ID if persisted
  }
}
```

**Example Request:**

```json
{
  "userWallet": "0.0.123456",
  "messages": [
    {
      "role": "user",
      "content": "Hello, can you help me with strategic planning?"
    },
    {
      "role": "soul",
      "content": "Of course! I specialize in strategic planning..."
    }
  ],
  "persistOnChain": true
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "interactionCount": 128,
    "onChainReference": "1705920000-542"
  }
}
```

---

### 6. Get Interactions

**Endpoint:** `GET /api/souls/:id/interactions`

**Description:** Retrieve interaction history for a soul.

**Path Parameters:**

- `id` (string, required): Soul UUID

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `50` | Items per page |
| `offset` | number | No | `0` | Pagination offset |
| `role` | InteractionRole | No | - | Filter by role |

**Response:**

```typescript
{
  success: true,
  data: PaginatedResponse<SoulInteraction>
}
```

---

### 7. Update Reputation

**Endpoint:** `POST /api/souls/:id/reputation`

**Description:** Update a soul's reputation score.

**Path Parameters:**

- `id` (string, required): Soul UUID

**Request Body:**

```typescript
{
  delta?: number;        // Change amount (+/- value)
  newScore?: number;     // Set absolute score (0-100)
  reason?: string;       // Description of change
}
```

**Response:**

```typescript
{
  success: true,
  data: Soul
}
```

**Example Request:**

```json
{
  "delta": 5,
  "reason": "Excellent strategic advice provided"
}
```

---

### 8. Transfer Soul

**Endpoint:** `POST /api/souls/:id/transfer`

**Description:** Transfer soul NFT to another wallet.

**Path Parameters:**

- `id` (string, required): Soul UUID

**Request Body:**

```typescript
{
  fromWallet: string;    // Current owner
  toWallet: string;      // New owner
}
```

**Response:**

```typescript
{
  success: true,
  data: Soul
}
```

---

### 9. Fuse Souls

**Endpoint:** `POST /api/souls/fuse`

**Description:** Combine two parent souls into a new child soul.

**Request Body:**

```typescript
{
  parentAId: string;         // UUID of first parent
  parentBId: string;         // UUID of second parent
  ownerWallet: string;       // Owner of new soul
  fusionFormula?: string;    // Optional fusion method
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    childSoul: Soul,
    fusion: {
      id: string,
      parentAId: string,
      parentBId: string,
      fusionTxHash?: string,
      inheritedTraits?: Record<string, any>
    }
  }
}
```

**Example Request:**

```json
{
  "parentAId": "550e8400-e29b-41d4-a716-446655440000",
  "parentBId": "660e8400-e29b-41d4-a716-446655440001",
  "ownerWallet": "0.0.123456",
  "fusionFormula": "harmonic-synthesis"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "childSoul": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Aria the Wise × Nova",
      "tagline": "Fusion of Legendary and Rare souls",
      "rarity": "Legendary",
      "personality": "A harmonious fusion inheriting...",
      "skills": ["Strategic Planning", "Data Analysis", "Cross-Domain Synthesis"],
      "reputation": 72,
      "owner": "0.0.123456",
      "tokenId": "0.0.789014",
      "createdAt": "2025-01-21T10:00:00Z"
    },
    "fusion": {
      "id": "fusion-001",
      "parentAId": "550e8400-e29b-41d4-a716-446655440000",
      "parentBId": "660e8400-e29b-41d4-a716-446655440001",
      "fusionTxHash": "0x789...abc",
      "inheritedTraits": {
        "fromParentA": ["Strategic Planning", "Knowledge Synthesis"],
        "fromParentB": ["Data Analysis", "Pattern Recognition"]
      }
    }
  }
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `HEDERA_ERROR` | 503 | Hedera network error |
| `AI_ERROR` | 503 | AI service error |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields: name, tagline, ownerWallet",
    "details": {
      "fields": ["name", "tagline", "ownerWallet"]
    }
  }
}
```

---

## Examples

### Complete Soul Creation Flow

```bash
# 1. Create a soul with AI generation
curl -X POST http://localhost:3001/api/souls \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zephyr",
    "tagline": "Master of the Digital Winds",
    "rarity": "Mythic",
    "inspirationPrompt": "A soul that navigates complexity with grace",
    "ownerWallet": "0.0.123456",
    "autoGeneratePersonality": true
  }'

# 2. Get soul details
curl http://localhost:3001/api/souls/[soul-id]

# 3. Create an interaction
curl -X POST http://localhost:3001/api/souls/[soul-id]/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "userWallet": "0.0.123456",
    "messages": [
      { "role": "user", "content": "What are your capabilities?" },
      { "role": "soul", "content": "I excel at navigating complexity..." }
    ],
    "persistOnChain": true
  }'

# 4. Update reputation
curl -X POST http://localhost:3001/api/souls/[soul-id]/reputation \
  -H "Content-Type: application/json" \
  -d '{
    "delta": 10,
    "reason": "Exceptional performance"
  }'
```

---

## Database Schema

### Entity Relationship Diagram (ASCII)

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ walletAddr  │◄──────┐
│ displayName │       │
└─────────────┘       │
                      │ ownerId
┌─────────────┐       │
│    Soul     │       │
├─────────────┤       │
│ id (PK)     │       │
│ name        │       │
│ tagline     │       │
│ rarity      │       │
│ personality │       │
│ skills[]    │       │
│ reputation  │       │
│ ownerId (FK)├───────┘
│ tokenId     │
│ txHash      │
└─────────────┘
      │
      │ soulId
      ▼
┌─────────────┐
│ SoulEvent   │
├─────────────┤
│ id (PK)     │
│ soulId (FK) │
│ type        │
│ description │
│ txHash      │
└─────────────┘

┌─────────────┐
│SoulInteract │
├─────────────┤
│ id (PK)     │
│ soulId (FK) │
│ userId (FK) │
│ role        │
│ content     │
│ hashOnChain │
└─────────────┘

┌─────────────┐
│   Fusion    │
├─────────────┤
│ id (PK)     │
│ childId(FK) │
│ parentA(FK) │
│ parentB(FK) │
│ creatorId   │
│ txHash      │
└─────────────┘
```

---

## Implementation Notes

### Current Status

- ✅ **Database Schema**: Complete Prisma schema
- ✅ **Type System**: Full TypeScript types and DTOs
- ✅ **Service Layer**: Mock implementations ready
- ✅ **API Routes**: All endpoints defined
- 🔄 **Hedera Integration**: Mock (ready for SDK)
- 🔄 **AI Integration**: Mock (ready for OpenAI/Claude)

### Next Steps for Production

1. **Install Hedera SDK**: `npm install @hashgraph/sdk`
2. **Install AI SDK**: `npm install openai` or `npm install @anthropic-ai/sdk`
3. **Replace mock implementations** in `hederaService.ts` and `aiService.ts`
4. **Add authentication** (JWT, wallet signatures)
5. **Add rate limiting** (express-rate-limit)
6. **Add input validation** (zod, joi)
7. **Add comprehensive logging** (winston, pino)
8. **Add monitoring** (Prometheus, Datadog)
9. **Add caching** (Redis)
10. **Add WebSocket support** for real-time updates

---

**Last Updated:** 2025-01-21  
**Maintained By:** DreamMarket Team
