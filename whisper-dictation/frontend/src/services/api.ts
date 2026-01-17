/**
 * Transcription API Service
 * Handles communication with the backend API
 */

import type {
  ApiResponse,
  TranscriptionResult,
  TranscriptionOptions,
  SupportedFormatsResponse,
} from '../types';

// ===========================================
// Configuration
// ===========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ===========================================
// API Client
// ===========================================

class TranscriptionApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Transcribe audio file
   */
  async transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    
    // Determine file extension based on MIME type
    const extension = this.getExtensionFromMimeType(audioBlob.type);
    formData.append('audio', audioBlob, `recording.${extension}`);
    
    // Add optional parameters
    if (options.language) {
      formData.append('language', options.language);
    }
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    if (options.temperature !== undefined) {
      formData.append('temperature', String(options.temperature));
    }

    const response = await fetch(`${this.baseUrl}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json() as ApiResponse<TranscriptionResult>;

    if (!data.success) {
      throw new ApiError(
        data.error.message,
        data.error.code,
        response.status,
        data.error.details
      );
    }

    return data.data;
  }

  /**
   * Get supported audio formats
   */
  async getSupportedFormats(): Promise<SupportedFormatsResponse> {
    const response = await fetch(`${this.baseUrl}/api/transcribe/formats`);
    const data = await response.json() as ApiResponse<SupportedFormatsResponse>;

    if (!data.success) {
      throw new ApiError(
        data.error.message,
        data.error.code,
        response.status
      );
    }

    return data.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/wav': 'wav',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
    };

    // Handle MIME types with codec suffix
    const baseMime = mimeType.split(';')[0] || mimeType;
    return mimeToExt[mimeType] || mimeToExt[baseMime] || 'webm';
  }
}

// ===========================================
// Custom API Error
// ===========================================

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  get isRateLimited(): boolean {
    return this.code === 'RATE_LIMIT_EXCEEDED' || this.statusCode === 429;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

// ===========================================
// Singleton Export
// ===========================================

export const transcriptionApi = new TranscriptionApiService();

export default transcriptionApi;
