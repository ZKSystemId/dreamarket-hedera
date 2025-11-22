# DreamMarket Backend Setup Guide

Complete guide to setting up and running the DreamMarket backend API.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Backend](#running-the-backend)
6. [Testing the API](#testing-the-api)
7. [Development Workflow](#development-workflow)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** v18+ and npm
- **PostgreSQL** v14+ (or use a cloud provider like Supabase, Neon, Railway)
- **Git**

### Optional Tools

- **Postman** or **Insomnia** for API testing
- **Prisma Studio** (included) for database visualization
- **Docker** (optional) for containerized PostgreSQL

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd HederaEvent
```

### 2. Install Dependencies

```bash
npm install
```

This will install both frontend and backend dependencies including:
- Express, Prisma, TypeScript
- Hedera SDK (when you add it)
- AI SDKs (when you add them)

---

## Database Setup

### Option A: Local PostgreSQL

#### Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dreammarket;

# Create user (optional)
CREATE USER dreammarket_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dreammarket TO dreammarket_user;

# Exit
\q
```

### Option B: Cloud Database (Recommended for Quick Start)

**Supabase (Free tier available):**
1. Go to https://supabase.com
2. Create new project
3. Copy the connection string from Settings → Database
4. Use the connection string in `.env`

**Neon (Free tier available):**
1. Go to https://neon.tech
2. Create new project
3. Copy the connection string
4. Use in `.env`

**Railway:**
1. Go to https://railway.app
2. Create PostgreSQL service
3. Copy connection string
4. Use in `.env`

---

## Environment Configuration

### 1. Create Environment File

```bash
# Copy the example file
cp .env.backend.example .env
```

### 2. Configure Variables

Edit `.env` with your values:

```env
# Server
NODE_ENV=development
PORT=3001

# Database - Update with your connection string
DATABASE_URL="postgresql://username:password@localhost:5432/dreammarket?schema=public"

# Hedera (for now, use testnet defaults)
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY

# AI Provider (start with mock)
AI_PROVIDER=mock

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

This generates the TypeScript types from your Prisma schema.

### 4. Push Schema to Database

```bash
# For development (quick, no migrations)
npm run db:push

# OR for production (with migrations)
npm run db:migrate
```

### 5. Seed Sample Data (Optional)

```bash
npm run db:seed
```

This creates sample users, souls, events, and interactions for testing.

---

## Running the Backend

### Development Mode (with auto-reload)

```bash
npm run dev:backend
```

The server will start on `http://localhost:3001`

### Run Frontend + Backend Together

```bash
npm run dev:all
```

This runs both Next.js frontend (port 3000) and Express backend (port 3001) concurrently.

### Production Build

```bash
# Build backend
npm run build:backend

# Start production server
npm run start:backend
```

---

## Testing the API

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T10:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### Get All Souls

```bash
curl http://localhost:3001/api/souls
```

### Get Soul by ID

```bash
curl http://localhost:3001/api/souls/<soul-id>
```

### Create a Soul

```bash
curl -X POST http://localhost:3001/api/souls \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Soul",
    "tagline": "A test soul for development",
    "rarity": "Common",
    "ownerWallet": "0.0.123456",
    "autoGeneratePersonality": true,
    "inspirationPrompt": "A helpful assistant"
  }'
```

### Using Postman/Insomnia

Import the API contract from `docs/api-contract.md` or create requests manually using the documented endpoints.

---

## Development Workflow

### 1. Database Changes

When you modify `prisma/schema.prisma`:

```bash
# Generate new Prisma client
npm run db:generate

# Push changes to database
npm run db:push

# OR create a migration (recommended for production)
npm run db:migrate
```

### 2. View Database

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555` for visual database management.

### 3. Code Structure

```
src/
├── config/          # Configuration and environment
├── routes/          # API route handlers
├── services/        # Business logic layer
│   ├── hederaService.ts   # Hedera blockchain integration
│   ├── aiService.ts       # AI personality generation
│   └── soulService.ts     # Soul orchestration
├── types/           # TypeScript types and DTOs
├── utils/           # Utility functions
└── server.ts        # Express server entry point
```

### 4. Adding Real Hedera Integration

When ready to integrate real Hedera SDK:

```bash
npm install @hashgraph/sdk
```

Then update `src/services/hederaService.ts`:

```typescript
import { Client, PrivateKey, TokenCreateTransaction } from '@hashgraph/sdk';

// Replace mock implementation with real SDK calls
// See implementation guide in hederaService.ts
```

### 5. Adding Real AI Integration

For OpenAI:
```bash
npm install openai
```

For Claude:
```bash
npm install @anthropic-ai/sdk
```

Then update `src/services/aiService.ts` with real API calls.

---

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
HEDERA_NETWORK=mainnet
HEDERA_OPERATOR_ID=<mainnet-account>
HEDERA_OPERATOR_KEY=<mainnet-key>
AI_PROVIDER=openai
AI_API_KEY=<your-api-key>
```

### Deployment Platforms

#### Vercel (Recommended for Next.js + API Routes)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard.

#### Railway

1. Connect GitHub repo
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically on push

#### Render

1. Create new Web Service
2. Connect repo
3. Build command: `npm run build:backend`
4. Start command: `npm run start:backend`
5. Add environment variables

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:backend
RUN npm run db:generate
EXPOSE 3001
CMD ["npm", "run", "start:backend"]
```

---

## Troubleshooting

### Database Connection Issues

**Error: `Can't reach database server`**

- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL is correct
- Check firewall/network settings
- For cloud databases, check IP whitelist

**Error: `Authentication failed`**

- Verify username and password in DATABASE_URL
- Check user permissions in PostgreSQL

### Prisma Issues

**Error: `Prisma Client not generated`**

```bash
npm run db:generate
```

**Error: `Migration failed`**

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then push schema
npm run db:push
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf dist/
rm -rf node_modules/
npm install
npm run build:backend
```

### Module Not Found Errors

Ensure all dependencies are installed:

```bash
npm install
```

If using the backend separately:
```bash
npm install express cors helmet morgan dotenv @prisma/client
npm install -D @types/express @types/cors @types/morgan prisma tsx
```

---

## API Documentation

Full API documentation is available at:
- **File:** `docs/api-contract.md`
- **Interactive:** Start server and visit `http://localhost:3001/api`

---

## Next Steps

1. ✅ Set up database
2. ✅ Run seed script
3. ✅ Test API endpoints
4. 🔄 Integrate real Hedera SDK
5. 🔄 Integrate real AI provider
6. 🔄 Add authentication
7. 🔄 Add rate limiting
8. 🔄 Deploy to production

---

## Support

- **Documentation:** `docs/api-contract.md`
- **Hedera Docs:** https://docs.hedera.com
- **Prisma Docs:** https://www.prisma.io/docs
- **Discord:** https://go.hellofuturehackathon.dev/hfa-discord

---

**Last Updated:** 2025-01-21  
**Version:** 1.0.0
