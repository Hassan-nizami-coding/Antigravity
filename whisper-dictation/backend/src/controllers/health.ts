/**
 * Health Controller
 * System health and status endpoints
 */

import type { Request, Response } from 'express';
import { getTranscriptionService } from '../services/transcription.js';
import type { HealthCheckResult, ApiSuccessResponse } from '../types/index.js';
import { config, getMaskedApiKey } from '../config/index.js';

// Track server start time
const serverStartTime = Date.now();

// Package version (would be loaded from package.json in production)
const VERSION = '1.0.0';

export class HealthController {
  /**
   * GET /health
   * Basic health check
   */
  health = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /health/detailed
   * Detailed health check with service status
   */
  detailedHealth = async (_req: Request, res: Response): Promise<void> => {
    const transcriptionService = getTranscriptionService();
    
    // Check transcription service health
    const transcriptionHealthy = await transcriptionService.healthCheck();
    
    const overallStatus = transcriptionHealthy ? 'healthy' : 'degraded';
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      version: VERSION,
      services: {
        transcription: {
          status: transcriptionHealthy ? 'up' : 'down',
          provider: transcriptionService.providerName,
        },
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  };

  /**
   * GET /health/ready
   * Readiness probe for Kubernetes/container orchestration
   */
  ready = async (_req: Request, res: Response): Promise<void> => {
    const transcriptionService = getTranscriptionService();
    const isReady = await transcriptionService.healthCheck();
    
    if (isReady) {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false, reason: 'Transcription service unavailable' });
    }
  };

  /**
   * GET /health/live
   * Liveness probe for Kubernetes/container orchestration
   */
  live = (_req: Request, res: Response): void => {
    res.status(200).json({ alive: true });
  };

  /**
   * GET /api/info
   * API information endpoint
   */
  info = (_req: Request, res: Response): void => {
    const response: ApiSuccessResponse<Record<string, unknown>> = {
      success: true,
      data: {
        name: 'Whisper Dictation API',
        version: VERSION,
        description: 'Production-grade speech-to-text API using Whisper V3',
        provider: 'Groq',
        model: 'whisper-large-v3',
        features: [
          'Real-time transcription',
          'Multiple audio format support',
          'Language detection',
          'Custom prompts',
        ],
        limits: {
          maxFileSizeMb: config.maxAudioSizeMb,
          rateLimit: `${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000} seconds`,
        },
        // Show masked API key to verify configuration (safe for non-production)
        config: {
          apiKeyConfigured: !!config.groqApiKey,
          apiKeyPreview: getMaskedApiKey(),
        },
      },
    };

    res.json(response);
  };
}

export const healthController = new HealthController();
