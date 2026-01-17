/**
 * Groq Whisper V3 Transcription Service
 * Production-ready implementation with retry logic and proper error handling
 */

import FormData from 'form-data';
import { config } from '../config/index.js';
import type {
  ITranscriptionService,
  TranscriptionRequest,
  TranscriptionResult,
  AudioFormat,
  GroqTranscriptionResponse,
  GroqApiError,
} from '../types/index.js';
import { transcriptionLogger as logger } from '../utils/logger.js';
import { ProviderError, TimeoutError, TranscriptionError } from '../utils/errors.js';
import { SUPPORTED_AUDIO_FORMATS, getMimeTypeForFormat, normalizeFilename } from '../utils/audio.js';
import { v4 as uuidv4 } from 'uuid';

// ===========================================
// Constants
// ===========================================

const WHISPER_MODEL = 'whisper-large-v3' as const;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_BACKOFF_MULTIPLIER = 2;

// ===========================================
// Groq Whisper Service Implementation
// ===========================================

export class GroqWhisperService implements ITranscriptionService {
  public readonly providerName = 'Groq';
  public readonly supportedFormats = SUPPORTED_AUDIO_FORMATS;
  public readonly maxFileSizeBytes: number;

  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey = config.groqApiKey;
    this.apiUrl = config.groqApiUrl;
    this.maxFileSizeBytes = config.maxAudioSizeMb * 1024 * 1024;
    this.timeoutMs = config.audioTimeoutMs;

    logger.info({
      provider: this.providerName,
      model: WHISPER_MODEL,
      maxFileSizeMb: config.maxAudioSizeMb,
    }, 'Groq Whisper service initialized');
  }

  /**
   * Transcribe audio to text using Whisper V3
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const requestId = uuidv4();
    const startTime = performance.now();

    logger.info({
      requestId,
      filename: request.filename,
      mimeType: request.mimeType,
      sizeBytes: request.audioBuffer.length,
      language: request.language ?? 'auto',
    }, 'Starting transcription');

    try {
      const response = await this.callApiWithRetry(request, requestId);
      const processingTimeMs = Math.round(performance.now() - startTime);

      const result: TranscriptionResult = {
        requestId,
        text: response.text.trim(),
        language: response.language ?? request.language ?? 'auto',
        processingTimeMs,
        audioDurationSeconds: response.duration,
        timestamp: new Date().toISOString(),
      };

      logger.info({
        requestId,
        processingTimeMs,
        textLength: result.text.length,
        language: result.language,
      }, 'Transcription completed successfully');

      return result;
    } catch (error) {
      const processingTimeMs = Math.round(performance.now() - startTime);
      
      logger.error({
        requestId,
        processingTimeMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Transcription failed');

      throw error;
    }
  }

  /**
   * Call Groq API with retry logic
   */
  private async callApiWithRetry(
    request: TranscriptionRequest,
    requestId: string,
    attempt = 1
  ): Promise<GroqTranscriptionResponse> {
    try {
      return await this.callApi(request, requestId);
    } catch (error) {
      // Determine if error is retryable
      const isRetryable = this.isRetryableError(error);
      
      if (isRetryable && attempt < MAX_RETRIES) {
        const delayMs = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_MULTIPLIER, attempt - 1);
        
        logger.warn({
          requestId,
          attempt,
          maxRetries: MAX_RETRIES,
          delayMs,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Retrying transcription after failure');

        await this.delay(delayMs);
        return this.callApiWithRetry(request, requestId, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Call Groq API
   */
  private async callApi(
    request: TranscriptionRequest,
    requestId: string
  ): Promise<GroqTranscriptionResponse> {
    // Build form data
    const formData = new FormData();
    
    // Determine format from MIME type
    const format = this.detectFormat(request.mimeType, request.filename);
    const normalizedFilename = normalizeFilename(request.filename, format);
    const mimeType = getMimeTypeForFormat(format);
    
    formData.append('file', request.audioBuffer, {
      filename: normalizedFilename,
      contentType: mimeType,
    });
    
    formData.append('model', WHISPER_MODEL);
    formData.append('response_format', 'verbose_json');
    
    if (request.language && request.language !== 'auto') {
      formData.append('language', request.language);
    }
    
    if (request.prompt) {
      formData.append('prompt', request.prompt);
    }
    
    if (request.temperature !== undefined) {
      formData.append('temperature', String(request.temperature));
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      logger.debug({
        requestId,
        url: this.apiUrl,
        model: WHISPER_MODEL,
        filename: normalizedFilename,
      }, 'Sending request to Groq API');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData.getBuffer(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage: string;
        
        try {
          const errorJson = JSON.parse(errorBody) as GroqApiError;
          errorMessage = errorJson.error?.message ?? 'Unknown API error';
        } catch {
          errorMessage = errorBody || `HTTP ${response.status}`;
        }

        logger.error({
          requestId,
          status: response.status,
          error: errorMessage,
        }, 'Groq API returned error');

        if (response.status === 429) {
          throw new ProviderError('Groq', 'Rate limit exceeded', { 
            status: 429,
            retryable: true 
          });
        }

        if (response.status >= 500) {
          throw new ProviderError('Groq', errorMessage, { 
            status: response.status,
            retryable: true 
          });
        }

        throw new ProviderError('Groq', errorMessage, { 
          status: response.status,
          retryable: false 
        });
      }

      // Parse successful response
      const data = await response.json() as GroqTranscriptionResponse;

      if (!data.text && data.text !== '') {
        throw new TranscriptionError('API returned empty response', { requestId });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError('Groq API call', this.timeoutMs);
      }

      throw error;
    }
  }

  /**
   * Detect audio format from MIME type and filename
   */
  private detectFormat(mimeType: string, filename: string): AudioFormat {
    // Simple detection - in production, use the audio.ts utilities
    const mimeFormats: Record<string, AudioFormat> = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/mp4': 'mp4',
    };

    const format = mimeFormats[mimeType.toLowerCase().split(';')[0] ?? ''];
    if (format) return format;

    // Fallback to extension
    const ext = filename.toLowerCase().split('.').pop();
    if (ext && this.supportedFormats.includes(ext as AudioFormat)) {
      return ext as AudioFormat;
    }

    // Default to webm (most common from browsers)
    return 'webm';
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof ProviderError) {
      return error.details?.['retryable'] === true;
    }
    if (error instanceof TimeoutError) {
      return true;
    }
    if (error instanceof Error) {
      // Network errors are retryable
      return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].some(
        code => error.message.includes(code)
      );
    }
    return false;
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple validation - could be enhanced with a test API call
      if (!this.apiKey || this.apiKey.length < 10) {
        logger.warn('API key appears invalid');
        return false;
      }
      return true;
    } catch (error) {
      logger.error({ error }, 'Health check failed');
      return false;
    }
  }
}

// ===========================================
// Singleton Export
// ===========================================

let serviceInstance: GroqWhisperService | null = null;

export function getTranscriptionService(): ITranscriptionService {
  if (!serviceInstance) {
    serviceInstance = new GroqWhisperService();
  }
  return serviceInstance;
}

export default GroqWhisperService;
