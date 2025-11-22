# DreamMarket Architecture

Complete system architecture documentation for the DreamMarket AI agent marketplace.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js + React + Tailwind)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/JSON API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      BACKEND API LAYER                          │
│                    (Express + TypeScript)                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Routes     │  │   Services   │  │  Validators  │        │
│  │  (REST API)  │─▶│ (Business    │  │              │        │
│  │              │  │  Logic)      │  │              │        │
│  └──────────────┘  └──────┬───────┘  └──────────────┘        │
└────────────────────────────┼────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Hedera    │  │   AI/LLM    │  │  PostgreSQL │
    │   Network   │  │   Service   │  │  Database   │
    │             │  │             │  │             │
    │ • HTS (NFT) │  │ • OpenAI    │  │ • Prisma    │
    │ • HCS (Log) │  │ • Claude    │  │ • Users     │
    │ • Contracts │  │ • Local LLM │  │ • Souls     │
    └─────────────┘  └─────────────┘  │ • Events    │
                                       │ • Interact. │
                                       └─────────────┘
```

---

## Layer Breakdown

### 1. Frontend Layer (Next.js)

**Location:** `app/`, `components/`, `lib/`

**Responsibilities:**
- User interface and interactions
- Soul browsing and filtering
- Soul creation wizard
- Chat interface
- Wallet integration
- State management

**Key Technologies:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Radix UI (components)

**Key Files:**
- `app/page.tsx` - Homepage/marketplace
- `app/souls/[id]/page.tsx` - Soul detail page
- `components/souls/` - Soul-related components
- `lib/api.ts` - API client (to be created)

---

### 2. Backend API Layer (Express)

**Location:** `src/`

**Responsibilities:**
- RESTful API endpoints
- Request validation
- Business logic orchestration
- Authentication (future)
- Rate limiting (future)

**Structure:**

```
src/
├── server.ts              # Express app entry point
├── config/
│   └── index.ts          # Configuration management
├── routes/
│   └── souls.ts          # Soul API endpoints
├── services/
│   ├── soulService.ts    # Soul business logic
│   ├── hederaService.ts  # Hedera blockchain integration
│   └── aiService.ts      # AI personality generation
├── types/
│   └── index.ts          # TypeScript types & DTOs
└── utils/
    └── validators.ts     # Input validation
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/souls` | List souls (paginated, filtered) |
| GET | `/api/souls/:id` | Get soul details |
| POST | `/api/souls` | Create/mint new soul |
| PATCH | `/api/souls/:id` | Update soul |
| POST | `/api/souls/:id/interactions` | Record interaction |
| GET | `/api/souls/:id/interactions` | Get interactions |
| POST | `/api/souls/:id/reputation` | Update reputation |
| POST | `/api/souls/:id/transfer` | Transfer soul |
| POST | `/api/souls/fuse` | Fuse two souls |

---

### 3. Service Layer

#### Soul Service (`soulService.ts`)

**Responsibilities:**
- Orchestrate soul operations
- Coordinate between database, Hedera, and AI
- Business logic enforcement

**Key Methods:**
- `getSouls()` - Query and filter souls
- `getSoulById()` - Get detailed soul info
- `createSoul()` - Mint new soul (DB + Hedera + AI)
- `updateSoul()` - Update soul metadata
- `createInteraction()` - Log interactions
- `updateReputation()` - Reputation management
- `fuseSouls()` - Combine two souls
- `transferSoul()` - Transfer ownership

#### Hedera Service (`hederaService.ts`)

**Responsibilities:**
- All Hedera network interactions
- NFT minting (HTS)
- Consensus logging (HCS)
- Smart contract calls (future)

**Key Methods:**
- `mintSoulIdentity()` - Mint Soul NFT
- `logInteractionHash()` - Log to HCS
- `transferSoul()` - Transfer NFT
- `getSoulMetadata()` - Query on-chain data
- `updateSoulMetadata()` - Update on-chain

**Integration Points:**
- Hedera Token Service (HTS) for NFTs
- Hedera Consensus Service (HCS) for logs
- Smart Contracts (ERC-8004) for verification

#### AI Service (`aiService.ts`)

**Responsibilities:**
- Generate soul personalities
- Create chat previews
- Generate soul responses
- Suggest fusion traits

**Key Methods:**
- `generatePersonalityFromPrompt()` - Create personality
- `generateChatPreview()` - Sample conversation
- `generateSoulResponse()` - Chat response
- `suggestFusionTraits()` - Fusion logic

**Providers:**
- OpenAI (GPT-4)
- Anthropic (Claude)
- Mock (for development)

---

### 4. Data Layer (PostgreSQL + Prisma)

**Location:** `prisma/`

**Schema:**

```
User
├── id (UUID)
├── walletAddress (unique)
├── displayName
└── Relations: ownedSouls[], interactions[]

Soul
├── id (UUID)
├── name, tagline, rarity
├── personality, skills[], creationStory
├── reputation (0-100)
├── ownerId (FK → User)
├── tokenId (Hedera NFT ID)
├── creationTxHash
└── Relations: events[], interactions[], fusions[]

SoulEvent
├── id (UUID)
├── soulId (FK → Soul)
├── type (MINTED, TRANSFERRED, etc.)
├── description
└── txHash

SoulInteraction
├── id (UUID)
├── soulId (FK → Soul)
├── userId (FK → User)
├── role (USER, SOUL, SYSTEM)
├── content
└── hashOnChain (HCS reference)

Fusion
├── id (UUID)
├── childSoulId (FK → Soul)
├── parentSoulAId (FK → Soul)
├── parentSoulBId (FK → Soul)
├── creatorId (FK → User)
└── fusionTxHash
```

**Indexes:**
- `Soul.ownerId`, `Soul.rarity`, `Soul.reputation`
- `SoulEvent.soulId`, `SoulEvent.type`
- `SoulInteraction.soulId`, `SoulInteraction.userId`

---

## Data Flow Examples

### Creating a Soul

```
1. User submits creation form (Frontend)
   ↓
2. POST /api/souls (API Layer)
   ↓
3. soulService.createSoul() (Service Layer)
   ├─→ aiService.generatePersonality() (if auto-generate)
   ├─→ hederaService.mintSoulIdentity() (mint NFT)
   ├─→ prisma.soul.create() (save to DB)
   └─→ prisma.soulEvent.create() (log MINTED event)
   ↓
4. Return Soul + Hedera data
   ↓
5. Display success + soul details (Frontend)
```

### Recording an Interaction

```
1. User chats with soul (Frontend)
   ↓
2. POST /api/souls/:id/interactions (API Layer)
   ↓
3. soulService.createInteraction() (Service Layer)
   ├─→ prisma.soulInteraction.createMany() (save messages)
   ├─→ hederaService.logInteractionHash() (if persistOnChain)
   └─→ prisma.soul.update() (increment totalInteractions)
   ↓
4. Return interaction count + HCS reference
   ↓
5. Update UI with confirmation (Frontend)
```

### Fusing Souls

```
1. User selects two parent souls (Frontend)
   ↓
2. POST /api/souls/fuse (API Layer)
   ↓
3. soulService.fuseSouls() (Service Layer)
   ├─→ prisma.soul.findMany() (get parents)
   ├─→ aiService.suggestFusionTraits() (generate child traits)
   ├─→ hederaService.mintSoulIdentity() (mint child NFT)
   ├─→ prisma.soul.create() (create child soul)
   ├─→ prisma.fusion.create() (record fusion)
   └─→ prisma.soulEvent.createMany() (log events)
   ↓
4. Return child soul + fusion metadata
   ↓
5. Display new soul (Frontend)
```

---

## Security Architecture

### Current (MVP)

- ✅ Input validation
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Environment variable protection
- ✅ SQL injection prevention (Prisma)

### Future Enhancements

- 🔄 JWT authentication
- 🔄 Wallet signature verification
- 🔄 Rate limiting
- 🔄 API key management
- 🔄 Role-based access control (RBAC)

---

## Scalability Considerations

### Current Architecture

- **Vertical scaling**: Increase server resources
- **Database**: PostgreSQL with indexes
- **Caching**: None (add Redis later)

### Future Optimizations

1. **Caching Layer (Redis)**
   - Cache frequently accessed souls
   - Cache API responses
   - Session management

2. **CDN Integration**
   - Static assets
   - Soul avatars
   - Metadata

3. **Database Optimization**
   - Read replicas
   - Connection pooling
   - Query optimization

4. **Microservices (if needed)**
   - Separate Hedera service
   - Separate AI service
   - Message queue (RabbitMQ/Kafka)

5. **Load Balancing**
   - Multiple API instances
   - Nginx/HAProxy

---

## Deployment Architecture

### Development

```
Local Machine
├── Next.js (localhost:3000)
├── Express API (localhost:3001)
├── PostgreSQL (localhost:5432)
└── Hedera Testnet
```

### Production

```
┌─────────────────────────────────────┐
│         Vercel / Netlify            │
│      (Next.js Frontend)             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Railway / Render / Fly.io      │
│      (Express Backend API)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Supabase / Neon / Railway DB      │
│      (PostgreSQL Database)          │
└─────────────────────────────────────┘

External Services:
├── Hedera Mainnet (Blockchain)
├── OpenAI API (AI Generation)
└── IPFS (Metadata Storage - optional)
```

---

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **State**: React Hooks

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL

### Blockchain
- **Network**: Hedera
- **Services**: HTS, HCS, Smart Contracts
- **SDK**: @hashgraph/sdk

### AI/ML
- **Providers**: OpenAI, Anthropic
- **Models**: GPT-4, Claude

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Build Tool**: TypeScript Compiler
- **Deployment**: Vercel, Railway

---

## Performance Metrics

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 200ms | TBD |
| Soul Creation Time | < 5s | ~3s (mock) |
| Database Query Time | < 50ms | TBD |
| Hedera Tx Confirmation | < 5s | ~2s (testnet) |
| AI Generation Time | < 3s | ~1.2s (mock) |

### Monitoring (Future)

- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics (Mixpanel, PostHog)
- Uptime monitoring

---

## Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:push
npm run db:seed

# 3. Start development servers
npm run dev:all  # Frontend + Backend
```

### Testing

```bash
# Unit tests (future)
npm test

# Integration tests (future)
npm run test:integration

# E2E tests (future)
npm run test:e2e
```

### Deployment

```bash
# Build frontend
npm run build

# Build backend
npm run build:backend

# Deploy
vercel deploy  # or platform-specific command
```

---

## API Versioning

### Current: v1 (Implicit)

All endpoints under `/api/`

### Future: Explicit Versioning

```
/api/v1/souls
/api/v2/souls  # Breaking changes
```

---

## Error Handling Strategy

### API Errors

```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: { ... }  // Dev mode only
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Auth required
- `FORBIDDEN` - Insufficient permissions
- `HEDERA_ERROR` - Blockchain error
- `AI_ERROR` - AI service error
- `INTERNAL_SERVER_ERROR` - Server error

---

## Logging Strategy

### Development

- Console logging
- Request/response logging (Morgan)
- Error stack traces

### Production

- Structured logging (JSON)
- Log aggregation (Datadog, LogRocket)
- Error tracking (Sentry)
- Performance monitoring

---

## Documentation

### Code Documentation

- Inline comments for complex logic
- JSDoc for public APIs
- README files in each major directory

### API Documentation

- `docs/api-contract.md` - Complete API reference
- OpenAPI/Swagger spec (future)
- Postman collection (future)

### Architecture Documentation

- This file (`ARCHITECTURE.md`)
- `BACKEND_SETUP.md` - Setup guide
- `HEDERA_INTEGRATION_GUIDE.md` - Blockchain integration

---

## Future Enhancements

### Phase 2 (Post-Hackathon)

1. **Authentication & Authorization**
   - Wallet-based auth
   - JWT tokens
   - Permission system

2. **Advanced Features**
   - Soul evolution
   - Soul rental system
   - Marketplace trading
   - Reputation algorithms

3. **Performance**
   - Redis caching
   - Database optimization
   - CDN integration

4. **Monitoring**
   - APM integration
   - Error tracking
   - Analytics

### Phase 3 (Production)

1. **Scalability**
   - Microservices architecture
   - Load balancing
   - Auto-scaling

2. **Advanced Hedera**
   - Smart contract integration
   - HFS for metadata
   - Scheduled transactions

3. **AI Enhancements**
   - Fine-tuned models
   - Embeddings for search
   - Real-time chat

4. **Mobile App**
   - React Native
   - Wallet integration
   - Push notifications

---

**Last Updated:** 2025-01-21  
**Version:** 1.0.0  
**For:** Hedera Hello Future Hackathon 2025
