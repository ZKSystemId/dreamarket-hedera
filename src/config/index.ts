/**
 * Configuration Management
 * Centralized configuration for the backend
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  database: {
    url: string;
  };
  hedera: {
    network: 'testnet' | 'mainnet';
    operatorId?: string;
    operatorKey?: string;
    topicId?: string;
  };
  ai: {
    provider: 'openai' | 'claude' | 'mock';
    apiKey?: string;
    model?: string;
  };
  cors: {
    origin: string | string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export const config: Config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/dreammarket',
  },

  // Hedera Network
  hedera: {
    network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    operatorId: process.env.HEDERA_OPERATOR_ID,
    operatorKey: process.env.HEDERA_OPERATOR_KEY,
    topicId: process.env.HEDERA_TOPIC_ID,
  },

  // AI Provider
  ai: {
    provider: (process.env.AI_PROVIDER as 'openai' | 'claude' | 'mock') || 'mock',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'https://dreammarket-hedera.vercel.app'],
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};

// Validate required configuration
export const validateConfig = () => {
  const errors: string[] = [];

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (config.hedera.network === 'mainnet') {
    if (!config.hedera.operatorId) {
      errors.push('HEDERA_OPERATOR_ID is required for mainnet');
    }
    if (!config.hedera.operatorKey) {
      errors.push('HEDERA_OPERATOR_KEY is required for mainnet');
    }
  }

  if (config.ai.provider !== 'mock' && !config.ai.apiKey) {
    console.warn('⚠️  AI_API_KEY not set, using mock AI service');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
};

// Log configuration (without sensitive data)
export const logConfig = () => {
  console.log('[Config] Environment:', config.env);
  console.log('[Config] Port:', config.port);
  console.log('[Config] Hedera Network:', config.hedera.network);
  console.log('[Config] AI Provider:', config.ai.provider);
  console.log('[Config] Database:', config.database.url.replace(/:[^:@]+@/, ':****@'));
};
