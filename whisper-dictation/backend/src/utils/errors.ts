/**
 * Custom Error Classes
 * Structured error handling with proper error codes and status codes
 */

import { ErrorCode, type AppError } from '../types/index.js';

// ===========================================
// Base Application Error
// ===========================================

export class ApplicationError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    details?: Record<string, unknown> | undefined,
    isOperational = true
  ) {
    super(message);
    
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

// ===========================================
// Specific Error Classes
// ===========================================

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

export class InvalidAudioFormatError extends ApplicationError {
  constructor(providedFormat: string, allowedFormats: readonly string[]) {
    super(
      `Invalid audio format: ${providedFormat}. Allowed formats: ${allowedFormats.join(', ')}`,
      ErrorCode.INVALID_AUDIO_FORMAT,
      400,
      { providedFormat, allowedFormats }
    );
    this.name = 'InvalidAudioFormatError';
  }
}

export class FileTooLargeError extends ApplicationError {
  constructor(fileSize: number, maxSize: number) {
    super(
      `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      ErrorCode.FILE_TOO_LARGE,
      413,
      { fileSize, maxSize }
    );
    this.name = 'FileTooLargeError';
  }
}

export class MissingAudioError extends ApplicationError {
  constructor() {
    super(
      'No audio file provided in request',
      ErrorCode.MISSING_AUDIO,
      400
    );
    this.name = 'MissingAudioError';
  }
}

export class RateLimitError extends ApplicationError {
  constructor(retryAfterMs: number) {
    super(
      'Rate limit exceeded. Please try again later.',
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      { retryAfterMs }
    );
    this.name = 'RateLimitError';
  }
}

export class TranscriptionError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      ErrorCode.TRANSCRIPTION_FAILED,
      500,
      details
    );
    this.name = 'TranscriptionError';
  }
}

export class ProviderError extends ApplicationError {
  constructor(provider: string, message: string, details?: Record<string, unknown>) {
    super(
      `${provider} error: ${message}`,
      ErrorCode.PROVIDER_ERROR,
      502,
      { provider, ...details }
    );
    this.name = 'ProviderError';
  }
}

export class TimeoutError extends ApplicationError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      ErrorCode.TIMEOUT,
      504,
      { operation, timeoutMs }
    );
    this.name = 'TimeoutError';
  }
}

export class ServiceUnavailableError extends ApplicationError {
  constructor(service: string) {
    super(
      `Service '${service}' is currently unavailable`,
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
      { service }
    );
    this.name = 'ServiceUnavailableError';
  }
}

// ===========================================
// Error Type Guards
// ===========================================

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

export function isOperationalError(error: unknown): boolean {
  return isApplicationError(error) && error.isOperational;
}
