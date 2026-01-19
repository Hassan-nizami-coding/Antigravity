/**
 * Application Types
 * Shared type definitions for the frontend
 */

// ===========================================
// Transcription Types
// ===========================================

export interface TranscriptionResult {
  requestId: string;
  text: string;
  language: string;
  processingTimeMs: number;
  audioDurationSeconds?: number;
  confidence?: number;
  timestamp: string;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

// ===========================================
// API Response Types
// ===========================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
    timestamp: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===========================================
// Recording State
// ===========================================

export type RecordingState = 
  | 'idle'           // Not recording, ready to start
  | 'requesting'     // Requesting microphone permission
  | 'recording'      // Actively recording
  | 'processing'     // Sending to API
  | 'complete'       // Transcription complete
  | 'error';         // Error occurred

export interface RecordingStatus {
  state: RecordingState;
  duration: number;    // Recording duration in seconds
  audioLevel: number;  // Audio level 0-1
}

// ===========================================
// Theme Types
// ===========================================

export type Theme = 'light' | 'dark' | 'system';

// ===========================================
// Supported Formats Response
// ===========================================

export interface SupportedFormatsResponse {
  formats: string[];
  maxFileSizeMb: number;
  maxFileSizeBytes: number;
}
