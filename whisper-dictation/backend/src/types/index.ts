/**
 * Application Types
 * Central type definitions for the entire backend
 */

// ===========================================
// Transcription Types
// ===========================================

/**
 * Supported audio formats for transcription
 */
export type AudioFormat = 
  | 'flac' 
  | 'mp3' 
  | 'mp4' 
  | 'mpeg' 
  | 'mpga' 
  | 'ogg' 
  | 'wav' 
  | 'webm';

/**
 * Supported languages for transcription
 * ISO 639-1 language codes
 */
export type SupportedLanguage = 
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru'
  | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'tr' | 'vi' | 'th' | 'id'
  | 'auto'; // Auto-detect

/**
 * Request payload for transcription
 */
export interface TranscriptionRequest {
  /** Audio file buffer */
  audioBuffer: Buffer;
  /** Original filename */
  filename: string;
  /** MIME type of the audio */
  mimeType: string;
  /** Target language (optional, defaults to auto-detect) */
  language?: string | undefined;
  /** Optional prompt for context */
  prompt?: string | undefined;
  /** Temperature for sampling (0-1) */
  temperature?: number | undefined;
}

/**
 * Successful transcription response
 */
export interface TranscriptionResult {
  /** Unique request identifier */
  requestId: string;
  /** Transcribed text */
  text: string;
  /** Detected or specified language */
  language: string;
  /** Processing duration in milliseconds */
  processingTimeMs: number;
  /** Audio duration in seconds (if available) */
  audioDurationSeconds?: number | undefined;
  /** Confidence score (if available) */
  confidence?: number | undefined;
  /** Timestamp of completion */
  timestamp: string;
}

/**
 * Word-level timestamp information
 */
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

// ===========================================
// API Response Types
// ===========================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
    requestId: string;
    timestamp: string;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===========================================
// Whisper/Groq API Types
// ===========================================

/**
 * Groq API transcription request
 */
export interface GroqTranscriptionRequest {
  file: Buffer;
  model: 'whisper-large-v3';
  language?: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'verbose_json';
  temperature?: number;
}

/**
 * Groq API transcription response
 */
export interface GroqTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

/**
 * Groq API error response
 */
export interface GroqApiError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// ===========================================
// Service Interface Types
// ===========================================

/**
 * Generic transcription service interface
 * Allows swapping providers without changing business logic
 */
export interface ITranscriptionService {
  /** Service provider name */
  readonly providerName: string;
  
  /** Supported audio formats */
  readonly supportedFormats: readonly AudioFormat[];
  
  /** Maximum file size in bytes */
  readonly maxFileSizeBytes: number;
  
  /** Transcribe audio to text */
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
  
  /** Check if service is healthy */
  healthCheck(): Promise<boolean>;
}

// ===========================================
// Health Check Types
// ===========================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    transcription: {
      status: 'up' | 'down';
      provider: string;
      latencyMs?: number;
    };
  };
}

// ===========================================
// Error Types
// ===========================================

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_AUDIO_FORMAT = 'INVALID_AUDIO_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  MISSING_AUDIO = 'MISSING_AUDIO',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown> | undefined;
  isOperational: boolean;
}
