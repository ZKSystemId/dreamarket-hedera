/**
 * DreamMarket Backend Server
 * Express server with TypeScript
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import soulRoutes from './routes/souls';
import { ApiResponse } from './types';

// Initialize Express app
const app: Express = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'DreamMarket API',
      version: '1.0.0',
      description: 'The Marketplace of Digital Souls - Backend API',
      documentation: '/api/docs',
      endpoints: {
        souls: '/api/souls',
        health: '/health',
      },
    },
  };
  res.json(response);
});

// Soul routes
app.use('/api/souls', soulRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);

  const statusCode = (err as any).statusCode || 500;
  const response: ApiResponse = {
    success: false,
    error: {
      code: (err as any).code || 'INTERNAL_SERVER_ERROR',
      message: config.env === 'production' ? 'An error occurred' : err.message,
      details: config.env === 'production' ? undefined : err.stack,
    },
  };

  res.status(statusCode).json(response);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection (Prisma will auto-connect on first query)
    console.log('[Server] Checking database connection...');

    // Start listening
    app.listen(config.port, () => {
      console.log('='.repeat(60));
      console.log('🌟 DreamMarket Backend Server');
      console.log('='.repeat(60));
      console.log(`Environment: ${config.env}`);
      console.log(`Port: ${config.port}`);
      console.log(`API URL: http://localhost:${config.port}/api`);
      console.log(`Health: http://localhost:${config.port}/health`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server if not in test mode
if (require.main === module) {
  startServer();
}

export default app;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
