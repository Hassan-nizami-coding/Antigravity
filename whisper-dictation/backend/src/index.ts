/**
 * Application Entry Point
 * Express server with all middleware and routes configured
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, getMaskedApiKey, isDevelopment } from './config/index.js';
import { createApiRouter } from './routes/index.js';
import {
  requestIdMiddleware,
  requestLoggingMiddleware,
  securityHeadersMiddleware,
  errorHandler,
  notFoundHandler,
  getCorsOptions,
} from './middleware/index.js';
import { logger } from './utils/logger.js';

// ===========================================
// Application Factory
// ===========================================

function createApp(): express.Application {
  const app = express();

  // ===========================================
  // Security Middleware (first)
  // ===========================================
  
  app.use(helmet(
    isDevelopment ? { contentSecurityPolicy: false } : {}
  ));
  app.use(securityHeadersMiddleware);
  app.use(cors(getCorsOptions()));

  // ===========================================
  // Request Processing Middleware
  // ===========================================
  
  app.use(requestIdMiddleware);
  app.use(requestLoggingMiddleware);
  
  // Parse JSON bodies (for optional parameters)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ===========================================
  // Trust Proxy (for rate limiting behind reverse proxy)
  // ===========================================
  
  if (!isDevelopment) {
    app.set('trust proxy', 1);
  }

  // ===========================================
  // Routes
  // ===========================================
  
  app.use(createApiRouter());

  // ===========================================
  // Error Handling (last)
  // ===========================================
  
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// ===========================================
// Server Startup
// ===========================================

async function startServer(): Promise<void> {
  const app = createApp();

  const server = app.listen(config.port, config.host, () => {
    logger.info({
      port: config.port,
      host: config.host,
      env: config.nodeEnv,
      apiKeyConfigured: !!config.groqApiKey,
      apiKeyPreview: getMaskedApiKey(),
    }, `🎙️  Whisper Dictation API started`);

    logger.info({
      endpoints: [
        `http://${config.host}:${config.port}/health`,
        `http://${config.host}:${config.port}/api/info`,
        `http://${config.host}:${config.port}/api/transcribe`,
      ],
    }, 'Available endpoints');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Promise Rejection');
  });

  // Uncaught exception handler
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught Exception');
    process.exit(1);
  });
}

// Start the server
startServer().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
