/**
 * Express Middleware
 * Centralized middleware for error handling, logging, and security
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { httpLogger as logger } from '../utils/logger.js';
import { ApplicationError, isOperationalError } from '../utils/errors.js';
import { ErrorCode, type ApiErrorResponse } from '../types/index.js';
import { config, isProduction, isDevelopment } from '../config/index.js';

// ===========================================
// Request ID Middleware
// ===========================================

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = performance.now();
  next();
}

// ===========================================
// Request Logging Middleware
// ===========================================

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Log request
  logger.info({
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    ip: req.ip || req.socket.remoteAddress,
  }, 'Incoming request');

  // Log response on finish
  res.on('finish', () => {
    const duration = Math.round(performance.now() - req.startTime);
    const logFn = res.statusCode >= 400 ? logger.warn.bind(logger) : logger.info.bind(logger);
    
    logFn({
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs: duration,
    }, 'Request completed');
  });

  next();
}

// ===========================================
// Error Handling Middleware
// ===========================================

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId || uuidv4();

  // Log the error
  if (isOperationalError(error)) {
    logger.warn({
      requestId,
      error: {
        name: error.name,
        message: error.message,
        code: (error as ApplicationError).code,
      },
    }, 'Operational error occurred');
  } else {
    logger.error({
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, 'Unexpected error occurred');
  }

  // Determine status code and response
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  if (error instanceof ApplicationError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = `File upload error: ${error.message}`;
  }

  // Don't expose internal error details in production
  if (isProduction && statusCode === 500) {
    message = 'An unexpected error occurred. Please try again later.';
    details = undefined;
  }

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(response);
};

// ===========================================
// 404 Handler
// ===========================================

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(404).json(response);
}

// ===========================================
// Security Headers Middleware
// ===========================================

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Additional security headers beyond helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}

// ===========================================
// CORS Configuration Helper
// ===========================================

export function getCorsOptions() {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (config.allowedOrigins.includes(origin) || isDevelopment) {
        callback(null, true);
      } else {
        logger.warn({ origin }, 'CORS request from blocked origin');
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 86400, // 24 hours
  };
}
