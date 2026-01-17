/**
 * API Routes
 * Clean route definitions with proper middleware chain
 */

import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { transcriptionController } from '../controllers/transcription.js';
import { healthController } from '../controllers/health.js';
import { config } from '../config/index.js';

// ===========================================
// Multer Configuration
// ===========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxAudioSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio and video/webm (which can contain audio)
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are accepted.`));
    }
  },
});

// ===========================================
// Rate Limiting
// ===========================================

const transcriptionRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For in production (behind proxy)
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// ===========================================
// Router Factory
// ===========================================

export function createApiRouter(): Router {
  const router = Router();

  // ===========================================
  // Health Routes (no rate limiting)
  // ===========================================
  
  router.get('/health', healthController.health);
  router.get('/health/detailed', healthController.detailedHealth);
  router.get('/health/ready', healthController.ready);
  router.get('/health/live', healthController.live);

  // ===========================================
  // API Routes
  // ===========================================
  
  // API Info
  router.get('/api/info', healthController.info);

  // Transcription endpoints
  router.post(
    '/api/transcribe',
    transcriptionRateLimiter,
    upload.single('audio'),
    transcriptionController.transcribe
  );

  router.get(
    '/api/transcribe/formats',
    transcriptionController.getSupportedFormats
  );

  return router;
}

export default createApiRouter;
