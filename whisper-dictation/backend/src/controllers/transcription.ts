/**
 * Transcription Controller
 * Handles HTTP layer for transcription endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { getTranscriptionService } from '../services/transcription.js';
import { validateAudioFile, SUPPORTED_AUDIO_FORMATS } from '../utils/audio.js';
import { MissingAudioError, ValidationError, InvalidAudioFormatError, FileTooLargeError } from '../utils/errors.js';
import { config } from '../config/index.js';
import type { ApiSuccessResponse, TranscriptionResult } from '../types/index.js';
import { transcriptionLogger as logger } from '../utils/logger.js';

// ===========================================
// Type definitions for multer file
// ===========================================

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// ===========================================
// Transcription Controller
// ===========================================

export class TranscriptionController {
  private readonly transcriptionService = getTranscriptionService();
  private readonly maxFileSizeBytes = config.maxAudioSizeMb * 1024 * 1024;

  /**
   * POST /api/transcribe
   * Transcribe uploaded audio file
   */
  transcribe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate file exists
      const file = req.file as MulterFile | undefined;
      
      if (!file) {
        throw new MissingAudioError();
      }

      // Check for minimum file size (4KB) to avoid empty/header-only files
      if (file.size < 4096) {
        throw new ValidationError('Audio file is too small (minimum 4KB required). Please record for at least 1 second.');
      }

      logger.debug({
        requestId: req.requestId,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }, 'Processing audio file');

      // Validate audio file
      const validation = validateAudioFile(
        file.buffer,
        file.mimetype,
        file.originalname,
        this.maxFileSizeBytes
      );

      if (!validation.valid) {
        if (validation.error?.includes('exceeds maximum')) {
          throw new FileTooLargeError(file.size, this.maxFileSizeBytes);
        }
        if (validation.error?.includes('Unsupported')) {
          throw new InvalidAudioFormatError(file.mimetype, SUPPORTED_AUDIO_FORMATS);
        }
        throw new ValidationError(validation.error ?? 'Invalid audio file');
      }

      // Extract optional parameters from body
      const language = this.parseLanguage(req.body?.language);
      const prompt = this.parsePrompt(req.body?.prompt);
      const temperature = this.parseTemperature(req.body?.temperature);

      // Perform transcription
      const result = await this.transcriptionService.transcribe({
        audioBuffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        language,
        prompt,
        temperature,
      });

      // Send success response
      const response: ApiSuccessResponse<TranscriptionResult> = {
        success: true,
        data: result,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs: result.processingTimeMs,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/transcribe/formats
   * Get supported audio formats
   */
  getSupportedFormats = (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: {
        formats: SUPPORTED_AUDIO_FORMATS,
        maxFileSizeMb: config.maxAudioSizeMb,
        maxFileSizeBytes: this.maxFileSizeBytes,
      },
    });
  };

  // ===========================================
  // Private helpers
  // ===========================================

  private parseLanguage(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().toLowerCase();
    }
    return undefined;
  }

  private parsePrompt(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      // Limit prompt length
      return value.trim().slice(0, 500);
    }
    return undefined;
  }

  private parseTemperature(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    const num = Number(value);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      return num;
    }
    return undefined;
  }
}

// Singleton instance
export const transcriptionController = new TranscriptionController();
